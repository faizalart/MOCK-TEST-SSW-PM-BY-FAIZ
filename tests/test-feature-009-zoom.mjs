import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
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
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.pipeWrite.write(JSON.stringify(payload) + '\0');
    });
  }

  on(method, callback) {
    if (!this.listeners.has(method)) {
      this.listeners.set(method, []);
    }
    this.listeners.get(method).push(callback);
  }

  async eval(expression, sessionId) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true
    }, sessionId);
    if (res.exceptionDetails) {
      const desc = res.exceptionDetails.exception?.description || res.exceptionDetails.text || 'Runtime.evaluate exception';
      throw new Error(desc);
    }
    return res.result ? res.result.value : undefined;
  }
}

function launchChrome(userDataDir) {
  const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
  return spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${userDataDir}`,
    '--remote-debugging-pipe',
    'about:blank'
  ], {
    stdio: ['ignore', 'pipe', 'pipe', 'pipe', 'pipe']
  });
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForCondition(cdp, sessionId, expr, timeout = 4000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const res = await cdp.eval(expr, sessionId);
    if (res) return res;
    await delay(50);
  }
  return await cdp.eval(expr, sessionId);
}

async function main() {
  console.log('=== FEATURE 009 (US2): Mobile Fill Screen & Pinch-to-Zoom Verification ===\n');

  // Static contract checks
  const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  assert.match(indexHtml, /user-scalable=yes/, 'index.html viewport must allow user-scalable=yes');
  assert.match(indexHtml, /maximum-scale=5\.0/, 'index.html viewport must allow maximum-scale=5.0');

  const editorCss = fs.readFileSync(path.join(ROOT, 'QUESTION-EDITOR-UPDATES.css'), 'utf8');
  assert.match(editorCss, /body\.exam-mode\.is-fill-screen/, 'QUESTION-EDITOR-UPDATES.css must define body.exam-mode.is-fill-screen');
  assert.match(editorCss, /touch-action:\s*pan-x pan-y pinch-zoom\s*!important/, 'QUESTION-EDITOR-UPDATES.css must preserve pinch-zoom touch-action');
  assert.equal(/touch-action:\s*none/.test(editorCss), false, 'QUESTION-EDITOR-UPDATES.css must never set touch-action: none');

  const appJs = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
  assert.match(appJs, /function shouldUseFillScreenFallback\(\)/, 'app.js must define shouldUseFillScreenFallback()');
  assert.match(appJs, /DEFAULT_PINCH_COOLDOWN_MS\s*=\s*150/, 'app.js must define tunable DEFAULT_PINCH_COOLDOWN_MS = 150');
  assert.match(appJs, /pointercancel/, 'app.js must handle pointercancel in multi-touch guard');
  console.log('✓ Static checks: viewport meta, Fill Screen CSS, touch-action, and passive pointer guard verified');

  const server = http.createServer((req, res) => {
    try {
      const urlPath = new URL(req.url, 'http://127.0.0.1').pathname;
      const relPath = urlPath === '/' ? '/index.html' : decodeURIComponent(urlPath);
      const filePath = path.join(ROOT, relPath);
      if (!filePath.startsWith(ROOT)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
        fs.createReadStream(filePath).pipe(res);
      } else {
        res.writeHead(404);
        res.end('Not found');
      }
    } catch (err) {
      res.writeHead(500);
      res.end(err.message);
    }
  });

  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}/`;

  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ssw-f009-zoom-'));
  const chrome = launchChrome(userDataDir);
  const cdp = new CDPClient(chrome);

  try {
    const target = await cdp.send('Target.getTargets');
    const pageTarget = target.targetInfos.find(t => t.type === 'page');
    const { sessionId } = await cdp.send('Target.attachToTarget', {
      targetId: pageTarget.targetId,
      flatten: true
    });
    await cdp.send('Page.enable', {}, sessionId);
    await cdp.send('Runtime.enable', {}, sessionId);

    // Emulate mobile viewport (390x844) with touch enabled
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 3,
      mobile: true
    }, sessionId);
    await cdp.send('Emulation.setTouchEmulationEnabled', {
      enabled: true,
      maxTouchPoints: 5
    }, sessionId);

    const pageErrors = [];
    cdp.on('Runtime.exceptionThrown', params => {
      pageErrors.push(params.exceptionDetails?.text || 'Uncaught exception');
    });

    await cdp.send('Page.navigate', { url: baseUrl }, sessionId);
    await waitForCondition(cdp, sessionId, `Boolean(window.__APP_BOOTED__ && window.state && window.state.questions && window.state.questions.length > 0)`, 10000);

    // Start Practice Mode
    await cdp.eval(`document.querySelector('[data-action="quick-practice-kunci1"]')?.click()`, sessionId);
    await waitForCondition(cdp, sessionId, `Boolean(document.querySelector('#setup-form button[type="submit"]'))`, 8000);
    await cdp.eval(`document.querySelector('#setup-form button[type="submit"]')?.click()`, sessionId);
    await waitForCondition(cdp, sessionId, `Boolean(document.querySelector('.exam-shell'))`, 8000);
    await delay(200);

    // Activate Fill Screen on mobile
    await cdp.eval(`document.querySelector('[data-action="toggle-fullscreen"]')?.click()`, sessionId);
    await delay(120);

    const fillState = await cdp.eval(`({
      isFillScreen: document.body.classList.contains('is-fill-screen'),
      isNativeFullscreen: document.body.classList.contains('is-fullscreen'),
      touchAction: getComputedStyle(document.querySelector('.exam-shell')).touchAction,
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth
    })`, sessionId);

    assert.equal(fillState.isFillScreen, true, 'Mobile toggleFullscreen must activate body.is-fill-screen');
    assert.equal(fillState.isNativeFullscreen, false, 'Mobile toggleFullscreen must NOT activate native fullscreen');
    assert.match(fillState.touchAction, /pinch-zoom|manipulation/, `Expected touch-action to allow pinch-zoom (or canonical 'manipulation'), got ${fillState.touchAction}`);
    assert.ok(fillState.scrollWidth <= fillState.innerWidth, `Expected 0px horizontal overflow, got ${fillState.scrollWidth} > ${fillState.innerWidth}`);
    console.log(`✓ Fill Screen mode activated on mobile (touch-action: ${fillState.touchAction}, overflow: ${fillState.scrollWidth}/${fillState.innerWidth})`);

    // Test 20 simulated multi-touch pinch gestures over .answer-choice and .practice-row-ctrl
    for (let i = 0; i < 20; i++) {
      const useCancel = i % 4 === 3;
      await cdp.eval(`(() => {
        const target = document.querySelector('.answer-choice[data-index="0"]');
        const rect = target.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        target.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 101, pointerType: 'touch', clientX: cx - 20, clientY: cy, bubbles: true }));
        target.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 102, pointerType: 'touch', clientX: cx + 20, clientY: cy, bubbles: true }));
        target.dispatchEvent(new PointerEvent('${useCancel ? 'pointercancel' : 'pointerup'}', { pointerId: 101, pointerType: 'touch', clientX: cx - 40, clientY: cy, bubbles: true }));
        target.dispatchEvent(new PointerEvent('${useCancel ? 'pointercancel' : 'pointerup'}', { pointerId: 102, pointerType: 'touch', clientX: cx + 40, clientY: cy, bubbles: true }));
        // Browser synthetic click upon lifting pinch fingers
        target.click();
        const ctrl = document.querySelector('.practice-ctrl-trans');
        if (ctrl) ctrl.click();
      })()`, sessionId);
      await delay(25);
    }

    const afterPinches = await cdp.eval(`({
      selectedCount: document.querySelectorAll('.answer-choice.selected').length,
      answeredKeys: Object.keys(window.state.activeSession?.answers || {}).length,
      transActiveCount: document.querySelectorAll('.practice-row-ctrl.is-active').length
    })`, sessionId);

    assert.equal(afterPinches.selectedCount, 0, '20 simulated pinches must cause 0 accidental answer selections');
    assert.equal(afterPinches.answeredKeys, 0, '20 simulated pinches must leave session.answers empty');
    assert.equal(afterPinches.transActiveCount, 0, '20 simulated pinches must cause 0 accidental control toggles');
    console.log('✓ Multi-touch guard: 20 simulated pinches (pointerup + pointercancel) caused 0 accidental clicks');

    // Wait past 150ms cooldown and verify immediate responsive single-finger tap
    await delay(180);
    await cdp.eval(`(() => {
      const target = document.querySelector('.answer-choice[data-index="1"]');
      const rect = target.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      target.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 201, pointerType: 'touch', clientX: cx, clientY: cy, bubbles: true }));
      target.dispatchEvent(new PointerEvent('pointerup', { pointerId: 201, pointerType: 'touch', clientX: cx, clientY: cy, bubbles: true }));
      target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, clientX: cx, clientY: cy }));
    })()`, sessionId);
    await waitForCondition(cdp, sessionId, `document.querySelector('.answer-choice[data-index="1"]')?.classList.contains('selected')`);
    assert.equal(await cdp.eval(`document.querySelector('.answer-choice[data-index="1"]')?.classList.contains('selected')`, sessionId), true, 'Single-finger tap after cooldown must select answer immediately');
    console.log('✓ Post-pinch single-finger tap responsiveness verified');

    // Verify CDP page scale factor (zoom >= 2x and back to 1x) preserves 0px overflow after return
    await cdp.send('Emulation.setPageScaleFactor', { pageScaleFactor: 2.2 }, sessionId);
    await delay(120);
    await cdp.send('Emulation.setPageScaleFactor', { pageScaleFactor: 1.0 }, sessionId);
    await delay(150);

    const afterZoomReturn = await cdp.eval(`({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      headerVisible: Boolean(document.querySelector('.exam-header')?.getBoundingClientRect().height > 0),
      bottomVisible: Boolean(document.querySelector('.exam-bottom-tools')?.getBoundingClientRect().height > 0)
    })`, sessionId);
    assert.ok(afterZoomReturn.scrollWidth <= afterZoomReturn.innerWidth, '0px horizontal overflow after returning to 1x scale');
    assert.equal(afterZoomReturn.headerVisible, true, 'Exam header remains visible after zoom cycle');
    assert.equal(afterZoomReturn.bottomVisible, true, 'Exam bottom toolbar remains visible after zoom cycle');
    console.log('✓ Page scale 2.2x -> 1.0x cycle: 0px horizontal overflow & toolbar restoration verified');

    // Toggle Fill Screen OFF and verify cleanup
    await cdp.eval(`document.querySelector('[data-action="toggle-fullscreen"]')?.click()`, sessionId);
    await delay(100);
    assert.equal(await cdp.eval(`document.body.classList.contains('is-fill-screen')`, sessionId), false, 'Toggling Fill Screen off must remove body.is-fill-screen');

    assert.equal(pageErrors.length, 0, `Unexpected page errors: ${pageErrors.join('; ')}`);
    console.log('\nALL FEATURE 009 US2 MOBILE FILL SCREEN & PINCH GUARD CDP TESTS PASSED!');
    console.log('NOTE: Physical device testing on Android Chrome, Samsung Internet, and iOS Safari remains PENDING.');
  } finally {
    chrome.kill('SIGKILL');
    server.close();
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch {}
  }
}

main().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
