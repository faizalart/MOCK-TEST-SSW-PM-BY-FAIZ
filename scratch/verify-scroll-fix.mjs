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

  async eval(expression, sessionId = undefined) {
    const res = await cdp.send('Runtime.evaluate', {
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

let cdp;

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
  console.log('=== VERIFYING SELECTIVE TRANSLATION & KOTOBA SCROLL ADJUSTMENT ===\n');

  if (!fs.existsSync('scratch/screenshots')) {
    fs.mkdirSync('scratch/screenshots', { recursive: true });
  }

  const { server, origin } = await startStaticServer();
  console.log(`[HTTP Server] Running at ${origin}`);

  const chromePath = findChromePath();
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-scroll-test-'));

  const chrome = spawn(chromePath, [
    '--headless=new',
    '--no-first-run',
    '--no-default-browser-check',
    '--remote-debugging-pipe',
    `--user-data-dir=${userDataDir}`,
    '--disable-background-networking',
    '--window-size=390,640',
    'about:blank'
  ], {
    stdio: ['ignore', 'ignore', 'pipe', 'pipe', 'pipe']
  });

  cdp = new CDPClient(chrome);
  await delay(1000);

  try {
    const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });

    await cdp.send('Page.enable', {}, sessionId);
    await cdp.send('Runtime.enable', {}, sessionId);
    await cdp.send('DOM.enable', {}, sessionId);

    // Set mobile viewport 390x640
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 640,
      deviceScaleFactor: 2,
      mobile: true
    }, sessionId);

    console.log(`[CDP] Navigating to ${origin}...`);
    await cdp.send('Page.navigate', { url: origin }, sessionId);
    await delay(2000);

    // Wait for quick practice button
    for (let i = 0; i < 30; i++) {
      const ready = await cdp.eval('Boolean(document.querySelector("[data-action=\\"quick-practice-kunci1\\"]"))', sessionId);
      if (ready) break;
      await delay(200);
    }

    console.log('[CDP] Starting Untimed Practice Mode...');
    await cdp.eval('document.querySelector(\'[data-action="quick-practice-kunci1"]\')?.click()', sessionId);
    await delay(1200);

    // Wait for setup submit button
    for (let i = 0; i < 30; i++) {
      const ready = await cdp.eval('Boolean(document.querySelector("#setup-form button[type=\\"submit\\"]"))', sessionId);
      if (ready) break;
      await delay(200);
    }

    console.log('[CDP] Submitting setup form...');
    await cdp.eval('document.querySelector(\'#setup-form button[type="submit"]\')?.click()', sessionId);
    await delay(1500);

    // Wait for exam workspace to appear
    for (let i = 0; i < 40; i++) {
      const inExam = await cdp.eval('Boolean(document.querySelector(".exam-workspace"))', sessionId);
      if (inExam) break;
      await delay(200);
    }

    // Question 7
    console.log('[CDP] Navigating to Question 7 in question map...');
    await cdp.eval(`
      (() => {
        const mapButtons = document.querySelectorAll('.question-map-grid button, .exam-question-map button');
        if (mapButtons && mapButtons[6]) mapButtons[6].click();
      })()
    `, sessionId);
    await delay(1000);

    // Check workspace scroll metrics on mobile
    const initialCheck = await cdp.eval(`
      (() => {
        const ws = document.querySelector('.exam-workspace');
        const rows = document.querySelectorAll('.practice-option-row');
        return {
          scrollTop: ws ? ws.scrollTop : 0,
          scrollHeight: ws ? ws.scrollHeight : 0,
          clientHeight: ws ? ws.clientHeight : 0,
          optRowCount: rows.length
        };
      })()
    `, sessionId);
    console.log('[Mobile Workspace Initial Metrics]:', initialCheck);

    // Scroll workspace down to Option 3 (index 2)
    console.log('[CDP] Scrolling down to Option 3...');
    await cdp.eval(`
      (() => {
        const ws = document.querySelector('.exam-workspace');
        const rows = document.querySelectorAll('.practice-option-row');
        const opt3 = rows[2] || rows[rows.length - 1];
        if (opt3) {
          opt3.scrollIntoView({ block: 'nearest' });
        }
      })()
    `, sessionId);
    await delay(300);

    const posBeforeClick = await cdp.eval(`
      (() => {
        const ws = document.querySelector('.exam-workspace');
        const rows = document.querySelectorAll('.practice-option-row');
        const opt3 = rows[2] || rows[rows.length - 1];
        const wsRect = ws.getBoundingClientRect();
        const optRect = opt3.getBoundingClientRect();
        return {
          scrollTop: ws.scrollTop,
          optTop: optRect.top - wsRect.top,
          optBottom: optRect.bottom - wsRect.top,
          wsHeight: wsRect.height
        };
      })()
    `, sessionId);
    console.log('[Position Before Click]:', posBeforeClick);

    // Now click Option 3's translation button (left zone)
    console.log('[CDP] Clicking Option 3 translation toggle...');
    await cdp.eval(`
      (() => {
        const rows = document.querySelectorAll('.practice-option-row');
        const opt3 = rows[2] || rows[rows.length - 1];
        const transBtn = opt3 ? opt3.querySelector('.practice-ctrl-trans') : null;
        if (transBtn) transBtn.click();
      })()
    `, sessionId);

    // Wait for requestAnimationFrame and smooth scroll adjustment
    await delay(800);

    const postTransPos = await cdp.eval(`
      (() => {
        const ws = document.querySelector('.exam-workspace');
        const rows = document.querySelectorAll('.practice-option-row');
        const opt3 = rows[2] || rows[rows.length - 1];
        const wsRect = ws.getBoundingClientRect();
        const optRect = opt3.getBoundingClientRect();
        const transSpan = opt3.querySelector('.practice-option-translation');

        return {
          scrollTop: ws ? ws.scrollTop : 0,
          hasTranslation: Boolean(transSpan && transSpan.textContent.trim()),
          transText: transSpan ? transSpan.textContent.trim() : '',
          optRelativeTop: optRect.top - wsRect.top,
          optRelativeBottom: optRect.bottom - wsRect.top,
          wsHeight: wsRect.height,
          // Is Option 3 comfortably framed inside the viewport?
          isInView: (optRect.top >= wsRect.top - 10) && (optRect.top <= wsRect.bottom - 40)
        };
      })()
    `, sessionId);

    console.log('[Post-Translation Toggle Position]:', postTransPos);

    // Assert that the viewport did NOT snap to 0!
    assert.strictEqual(postTransPos.hasTranslation, true, 'Option 3 translation must be rendered and visible');
    assert.ok(postTransPos.scrollTop > 0, `Workspace must NOT snap to top (scrollTop is ${postTransPos.scrollTop})`);
    assert.ok(postTransPos.isInView, 'Option 3 and translation must be framed precisely in view');

    // Now click Option 3 Kotoba button (right zone)
    console.log('[CDP] Clicking Option 3 Kotoba toggle...');
    await cdp.eval(`
      (() => {
        const rows = document.querySelectorAll('.practice-option-row');
        const opt3 = rows[2] || rows[rows.length - 1];
        const kotobaBtn = opt3 ? opt3.querySelector('.practice-ctrl-kotoba') : null;
        if (kotobaBtn) kotobaBtn.click();
      })()
    `, sessionId);

    await delay(800);

    const postKotobaPos = await cdp.eval(`
      (() => {
        const ws = document.querySelector('.exam-workspace');
        const rows = document.querySelectorAll('.practice-option-row');
        const opt3 = rows[2] || rows[rows.length - 1];
        const wsRect = ws.getBoundingClientRect();
        const optRect = opt3.getBoundingClientRect();
        const kotobaList = opt3.querySelector('.practice-kotoba-list');

        return {
          scrollTop: ws ? ws.scrollTop : 0,
          hasKotoba: Boolean(kotobaList),
          optRelativeTop: optRect.top - wsRect.top,
          optRelativeBottom: optRect.bottom - wsRect.top,
          wsHeight: wsRect.height,
          isInView: (optRect.top >= wsRect.top - 20) && (optRect.top <= wsRect.bottom - 40)
        };
      })()
    `, sessionId);

    console.log('[Post-Kotoba Toggle Position]:', postKotobaPos);

    assert.ok(postKotobaPos.scrollTop > 0, `Workspace must NOT snap to top after Kotoba toggle (scrollTop is ${postKotobaPos.scrollTop})`);
    assert.ok(postKotobaPos.isInView, 'Option 3 must remain precisely in view');

    // Take screenshot of the accurately scrolled and rendered state
    const ss = await cdp.send('Page.captureScreenshot', { format: 'png' }, sessionId);
    const ssPath = 'scratch/screenshots/scroll-fix-option3-verified.png';
    fs.writeFileSync(ssPath, Buffer.from(ss.data, 'base64'));
    console.log(`✓ Screenshot captured at ${ssPath}`);

    console.log('\n================================================================');
    console.log('✓ SCROLL-TO-TOP BUG COMPLETELY RESOLVED!');
    console.log('✓ OPTION 3 SCROLLS PRECISELY AND AUTOMATICALLY INTO VIEW!');
    console.log('================================================================\n');

  } finally {
    try {
      chrome.kill('SIGTERM');
    } catch (e) {}
    try {
      server.close();
    } catch (e) {}
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch (e) {}
  }
}

main().catch(err => {
  console.error('[ERROR in verify-scroll-fix]', err);
  process.exit(1);
});
