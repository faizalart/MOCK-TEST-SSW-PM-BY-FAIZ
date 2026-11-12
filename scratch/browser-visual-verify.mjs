import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert';
import { spawn } from 'node:child_process';

const ROOT = process.cwd();

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json',
  '.ico': 'image/x-icon'
};

class CDPClient {
  constructor(chromeProcess) {
    this.chrome = chromeProcess;
    this.pipeWrite = chromeProcess.stdio[3];
    this.pipeRead = chromeProcess.stdio[4];
    this.msgId = 0;
    this.pending = new Map();
    this.listeners = new Map();
    this.buf = Buffer.alloc(0);

    this.pipeRead.on('data', chunk => {
      this.buf = Buffer.concat([this.buf, chunk]);
      let idx;
      while ((idx = this.buf.indexOf(0)) !== -1) {
        const raw = this.buf.subarray(0, idx).toString('utf8');
        this.buf = this.buf.subarray(idx + 1);
        if (!raw) continue;
        try {
          const msg = JSON.parse(raw);
          if (msg.id && this.pending.has(msg.id)) {
            const { resolve, reject } = this.pending.get(msg.id);
            this.pending.delete(msg.id);
            if (msg.error) reject(new Error(msg.error.message));
            else resolve(msg.result);
          } else if (msg.method && this.listeners.has(msg.method)) {
            for (const fn of this.listeners.get(msg.method)) {
              fn(msg.params, msg.sessionId);
            }
          }
        } catch (e) {
          console.error('[CDP Parse Error]', e);
        }
      }
    });
  }

  send(method, params = {}, sessionId = undefined) {
    const id = ++this.msgId;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      const payload = JSON.stringify({ id, method, params, sessionId }) + '\0';
      this.pipeWrite.write(payload, 'utf8');
    });
  }

  on(method, fn) {
    if (!this.listeners.has(method)) this.listeners.set(method, []);
    this.listeners.get(method).push(fn);
  }

  async eval(expression, sessionId = undefined) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true
    }, sessionId);
    if (res.exceptionDetails) {
      console.error('Exception Details:', JSON.stringify(res.exceptionDetails, null, 2));
      throw new Error(res.exceptionDetails.text || 'Runtime.evaluate exception');
    }
    return res.result ? res.result.value : undefined;
  }
}

function findChromePath() {
  const possiblePaths = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    `${process.env.LOCALAPPDATA}/Google/Chrome/Application/chrome.exe`
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error('Chrome executable not found on host');
}

function startStaticServer() {
  const server = http.createServer((req, res) => {
    const rawUrl = req.url || '/';
    const cleanPath = rawUrl.split('?')[0];
    let filePath = path.join(ROOT, cleanPath === '/' ? 'index.html' : cleanPath);

    if (!fs.existsSync(filePath)) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
      return;
    }

    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
      if (!fs.existsSync(filePath)) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
        return;
      }
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });
    fs.createReadStream(filePath).pipe(res);
  });

  return new Promise(resolve => {
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      resolve({ server, port, origin: `http://127.0.0.1:${port}` });
    });
  });
}

const delay = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  console.log('=== STARTING BROWSER VISUAL VERIFICATION & SCREENSHOT HARNESS ===\n');

  if (!fs.existsSync('scratch/screenshots')) {
    fs.mkdirSync('scratch/screenshots', { recursive: true });
  }

  const { server, port, origin } = await startStaticServer();
  console.log(`[HTTP Server] Running at ${origin}`);

  const chromePath = findChromePath();
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-test-'));

  const chrome = spawn(chromePath, [
    '--headless=new',
    '--no-first-run',
    '--no-default-browser-check',
    '--remote-debugging-pipe',
    `--user-data-dir=${userDataDir}`,
    '--disable-background-networking',
    '--disable-features=Translate,OptimizationHints,MediaRouter',
    '--window-size=1920,1080',
    'about:blank'
  ], {
    stdio: ['ignore', 'ignore', 'pipe', 'pipe', 'pipe']
  });

  const cdp = new CDPClient(chrome);
  await delay(1200);

  try {
    const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });

    await cdp.send('Page.enable', {}, sessionId);
    await cdp.send('Runtime.enable', {}, sessionId);
    await cdp.send('DOM.enable', {}, sessionId);
    await cdp.send('CSS.enable', {}, sessionId);

    // 1. Desktop Viewport 1920x1080
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
      mobile: false
    }, sessionId);

    console.log(`[CDP] Navigating to ${origin}...`);
    await cdp.send('Page.navigate', { url: origin }, sessionId);
    await delay(2500);

    // Wait for home dashboard to load
    for (let i = 0; i < 30; i++) {
      const ready = await cdp.eval('Boolean(document.querySelector("[data-action=\\"quick-practice-kunci1\\"]"))', sessionId);
      if (ready) break;
      await delay(200);
    }

    console.log('[CDP] Starting Untimed Practice Mode via quick action...');
    await cdp.eval(`
      (() => {
        const btn = document.querySelector('[data-action="quick-practice-kunci1"]');
        if (btn) btn.click();
      })()
    `, sessionId);
    await delay(1000);

    // On setup page, submit form to start exam
    console.log('[CDP] Submitting setup form...');
    await cdp.eval(`
      (() => {
        const submitBtn = document.querySelector('#setup-form button[type="submit"]');
        if (submitBtn) submitBtn.click();
      })()
    `, sessionId);
    await delay(1500);

    // Wait for exam shell
    for (let i = 0; i < 30; i++) {
      const inExam = await cdp.eval('Boolean(document.querySelector(".exam-shell") && document.body.classList.contains("exam-mode"))', sessionId);
      if (inExam) break;
      await delay(200);
    }

    // Jump to Question 7 (index 6) to match the exact question in reference screenshot!
    console.log('[CDP] Navigating to Question 7 in question map...');
    await cdp.eval(`
      (() => {
        const mapButtons = document.querySelectorAll('.question-map-grid button, .exam-question-map button');
        if (mapButtons && mapButtons[6]) {
          mapButtons[6].click();
        }
      })()
    `, sessionId);
    await delay(800);

    // Verify DOM structure
    const domCheck = await cdp.eval(`
      (() => {
        const promptRow = document.querySelector('.practice-prompt-row');
        const optRows = document.querySelectorAll('.practice-option-row');
        const transButtons = document.querySelectorAll('.practice-ctrl-trans');
        const kotobaButtons = document.querySelectorAll('.practice-ctrl-kotoba');
        const svgIcons = document.querySelectorAll('.practice-row-ctrl svg');
        const answerChoices = document.querySelectorAll('.practice-option-row .answer-choice');
        const promptCard = document.querySelector('.question-card');

        return {
          hasPromptRow: Boolean(promptRow),
          hasPromptCard: Boolean(promptCard),
          optRowCount: optRows.length,
          transButtonCount: transButtons.length,
          kotobaButtonCount: kotobaButtons.length,
          visibleSvgIconCount: Array.from(svgIcons).filter(s => getComputedStyle(s).display !== 'none').length,
          answerChoiceCount: answerChoices.length
        };
      })()
    `, sessionId);

    console.log('[DOM Check]', domCheck);
    assert.strictEqual(domCheck.hasPromptRow, true, 'Prompt row must exist');
    assert.strictEqual(domCheck.optRowCount > 0, true, 'Option rows must exist');
    assert.strictEqual(domCheck.visibleSvgIconCount, 0, 'Zero visible SVG icons allowed');

    // Screenshot 1: Desktop Default State (All Controls OFF)
    const ss1 = await cdp.send('Page.captureScreenshot', { format: 'png' }, sessionId);
    fs.writeFileSync('scratch/screenshots/desktop-01-default-off.png', Buffer.from(ss1.data, 'base64'));
    console.log('✓ Captured scratch/screenshots/desktop-01-default-off.png');

    // Screenshot 2: Select Option 0 (Answer choice 1) & Toggle Option 0 Translation ON
    // This reproduces the exact state from the user's uploaded reference screenshot!
    console.log('[CDP] Clicking Option 1 (center) to select answer and clicking Left Zone to toggle translation...');
    await cdp.eval(`
      (() => {
        const choices = document.querySelectorAll('.practice-option-row .answer-choice');
        if (choices[0]) choices[0].click();
        const transBtns = document.querySelectorAll('.practice-option-row .practice-ctrl-trans');
        if (transBtns[0]) transBtns[0].click();
      })()
    `, sessionId);
    await delay(600);

    const ss2 = await cdp.send('Page.captureScreenshot', { format: 'png' }, sessionId);
    fs.writeFileSync('scratch/screenshots/desktop-02-selected-with-translation.png', Buffer.from(ss2.data, 'base64'));
    console.log('✓ Captured scratch/screenshots/desktop-02-selected-with-translation.png');

    // Screenshot 3: Toggle Kotoba on Option 1
    console.log('[CDP] Clicking Right Zone on Option 1 to toggle Kotoba vocabulary list...');
    await cdp.eval(`
      (() => {
        const kotobaBtns = document.querySelectorAll('.practice-option-row .practice-ctrl-kotoba');
        if (kotobaBtns[0]) kotobaBtns[0].click();
      })()
    `, sessionId);
    await delay(600);

    const ss3 = await cdp.send('Page.captureScreenshot', { format: 'png' }, sessionId);
    fs.writeFileSync('scratch/screenshots/desktop-03-kotoba-open.png', Buffer.from(ss3.data, 'base64'));
    console.log('✓ Captured scratch/screenshots/desktop-03-kotoba-open.png');

    // 4. Mobile Viewport: 390x844
    console.log('[CDP] Switching to Mobile Viewport 390x844...');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
      hasTouch: true
    }, sessionId);
    await delay(600);

    // Measure mobile layout geometry
    const mobileGeo = await cdp.eval(`
      (() => {
        const optRow = document.querySelector('.practice-option-row');
        const choice = optRow.querySelector('.answer-choice');
        const leftBtn = optRow.querySelector('.practice-ctrl-trans');
        const rightBtn = optRow.querySelector('.practice-ctrl-kotoba');
        
        const rowRect = optRow.getBoundingClientRect();
        const choiceRect = choice.getBoundingClientRect();
        const leftRect = leftBtn.getBoundingClientRect();
        const rightRect = rightBtn.getBoundingClientRect();

        return {
          rowWidth: rowRect.width,
          choiceWidth: choiceRect.width,
          leftBtnWidth: leftRect.width,
          leftBtnHeight: leftRect.height,
          rightBtnWidth: rightRect.width,
          rightBtnHeight: rightRect.height,
          leftBtnTouchTargetOk: leftRect.width >= 44 && leftRect.height >= 44,
          rightBtnTouchTargetOk: rightRect.width >= 44 && rightRect.height >= 44
        };
      })()
    `, sessionId);
    console.log('[Mobile Geometry]', mobileGeo);
    assert.strictEqual(mobileGeo.leftBtnTouchTargetOk, true, 'Mobile left button must meet 44x44px target');
    assert.strictEqual(mobileGeo.rightBtnTouchTargetOk, true, 'Mobile right button must meet 44x44px target');

    const ss4 = await cdp.send('Page.captureScreenshot', { format: 'png' }, sessionId);
    fs.writeFileSync('scratch/screenshots/mobile-04-practice-mode.png', Buffer.from(ss4.data, 'base64'));
    console.log('✓ Captured scratch/screenshots/mobile-04-practice-mode.png');

    // Copy screenshots to Artifacts directory for user display
    const artifactDir = 'C:/Users/Admin/.gemini/antigravity/brain/d27ebec7-1c6f-4a08-9700-b5f26bb90bdd';
    fs.copyFileSync('scratch/screenshots/desktop-01-default-off.png', path.join(artifactDir, 'desktop-01-default-off.png'));
    fs.copyFileSync('scratch/screenshots/desktop-02-selected-with-translation.png', path.join(artifactDir, 'desktop-02-selected-with-translation.png'));
    fs.copyFileSync('scratch/screenshots/desktop-03-kotoba-open.png', path.join(artifactDir, 'desktop-03-kotoba-open.png'));
    fs.copyFileSync('scratch/screenshots/mobile-04-practice-mode.png', path.join(artifactDir, 'mobile-04-practice-mode.png'));
    console.log('✓ Copied screenshots to Artifacts directory!');

    console.log('\n=== ALL BROWSER VISUAL VERIFICATION CHECKS COMPLETED SUCCESSFULLY! ===');
  } finally {
    try { chrome.kill(); } catch (e) {}
    try { server.close(); } catch (e) {}
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}
  }
}

main().catch(err => {
  console.error('[FATAL ERROR]', err);
  process.exit(1);
});
