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
    const res = await cdpSendEval(this, expression, sessionId);
    if (res.exceptionDetails) {
      const desc = res.exceptionDetails.exception?.description || res.exceptionDetails.text || 'Runtime.evaluate exception';
      throw new Error(desc);
    }
    return res.result ? res.result.value : undefined;
  }
}

function cdpSendEval(cdp, expression, sessionId) {
  return cdp.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true
  }, sessionId);
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

async function waitForCondition(cdp, sessionId, expr, timeoutMs = 10000, intervalMs = 50) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const val = await cdp.eval(expr, sessionId);
      if (val) return val;
    } catch {}
    await delay(intervalMs);
  }
  throw new Error(`Timeout waiting for condition: ${expr}`);
}

function startStaticServer() {
  return new Promise((resolve, reject) => {
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

    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      const port = typeof addr === 'object' && addr ? addr.port : 8080;
      resolve({ server, port });
    });
    server.on('error', reject);
  });
}

async function main() {
  console.log('=== FEATURE 010 (US4): Android CBT Fullscreen Button Fix & Fallback Contract Verification ===\n');

  const { server, port } = await startStaticServer();
  const testUrl = `http://127.0.0.1:${port}/`;
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ssw-test-fs-'));
  const chromeProcess = launchChrome(tempDir);
  const cdp = new CDPClient(chromeProcess);

  try {
    const targetInfo = await new Promise(async (resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Timeout finding page target')), 15000);
      try {
        const res = await cdp.send('Target.getTargets');
        const page = (res.targetInfos || []).find(t => t.type === 'page');
        if (page) {
          clearTimeout(timer);
          resolve(page);
          return;
        }
      } catch {}
      cdp.on('Target.targetCreated', params => {
        if (params.targetInfo?.type === 'page') {
          clearTimeout(timer);
          resolve(params.targetInfo);
        }
      });
    });

    const { sessionId } = await cdp.send('Target.attachToTarget', {
      targetId: targetInfo.targetId,
      flatten: true
    });

    await cdp.send('Page.enable', {}, sessionId);
    await cdp.send('Runtime.enable', {}, sessionId);
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 412,
      height: 915,
      deviceScaleFactor: 2.625,
      mobile: true
    }, sessionId);

    await cdp.send('Page.navigate', { url: testUrl }, sessionId);
    await waitForCondition(cdp, sessionId, `Boolean(window.__APP_BOOTED__ && window.state?.questions?.length > 0)`);
    console.log('✓ CBT Simulator booted successfully with mobile emulation');

    // ------------------------------------------------------------------------
    // Scenario 1: Fallback detection contract verification across User Agents
    // ------------------------------------------------------------------------
    const uaTests = await cdp.eval(`(() => {
      const originalUA = navigator.userAgent;
      const originalReqFs = document.documentElement.requestFullscreen;

      function testFallbackWith(ua, hasFs = true) {
        Object.defineProperty(navigator, 'userAgent', { value: ua, configurable: true });
        if (!hasFs) {
          document.documentElement.requestFullscreen = null;
          document.documentElement.webkitRequestFullscreen = null;
        } else {
          document.documentElement.requestFullscreen = originalReqFs || (() => Promise.resolve());
        }
        const result = shouldUseFillScreenFallback();
        // Restore
        Object.defineProperty(navigator, 'userAgent', { value: originalUA, configurable: true });
        if (originalReqFs) document.documentElement.requestFullscreen = originalReqFs;
        else {
          delete document.documentElement.requestFullscreen;
          delete document.documentElement.webkitRequestFullscreen;
        }
        return result;
      }

      const androidChromeUA = 'Mozilla/5.0 (Linux; Android 13; SM-S908B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36';
      const androidSamsungUA = 'Mozilla/5.0 (Linux; Android 12; SAMSUNG SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/16.0 Chrome/92.0.4515.166 Mobile Safari/537.36';
      const iosSafariUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1';
      const ipadSafariUA = 'Mozilla/5.0 (iPad; CPU OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1';
      const desktopChromeUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

      return {
        androidChromeFallback: testFallbackWith(androidChromeUA, true),
        androidSamsungFallback: testFallbackWith(androidSamsungUA, true),
        androidNoNativeFallback: testFallbackWith(androidChromeUA, false),
        iosFallback: testFallbackWith(iosSafariUA, true),
        ipadFallback: testFallbackWith(ipadSafariUA, true),
        desktopChromeFallback: testFallbackWith(desktopChromeUA, true)
      };
    })()`, sessionId);

    assert.equal(uaTests.androidChromeFallback, false, 'Android Chrome with native API must NOT use CSS fallback (must attempt native)');
    assert.equal(uaTests.androidSamsungFallback, false, 'Android Samsung Internet with native API must NOT use CSS fallback (must attempt native)');
    assert.equal(uaTests.androidNoNativeFallback, true, 'Android device without native API must use CSS fallback');
    assert.equal(uaTests.iosFallback, true, 'iOS Safari must use CSS fallback');
    assert.equal(uaTests.ipadFallback, true, 'iPadOS Safari must use CSS fallback');
    assert.equal(uaTests.desktopChromeFallback, false, 'Desktop Chrome must NOT use CSS fallback');
    console.log('✓ Scenario 1: shouldUseFillScreenFallback() accurately differentiates Android (native), iOS (fallback), and missing APIs');

    // ------------------------------------------------------------------------
    // Scenario 2: Start Untimed Practice session and verify Fullscreen Button
    // ------------------------------------------------------------------------
    await cdp.eval(`(async () => {
      const q = (state.questions && state.questions.length) ? state.questions[0] : (await getAll('questions'))[0];
      const session = {
        id: 'exam-fs-test-1',
        title: 'Latihan CBT Fullscreen',
        setId: 'ssw-pm-kunci-ujian-1',
        packageId: 'ssw-pm-kunci-ujian-1',
        startedAt: Date.now(),
        timed: false,
        durationMinutes: 0,
        status: 'in_progress',
        mode: 'practice',
        questions: [q],
        answers: {},
        currentIndex: 0
      };
      await put('sessions', session);
      state.activeSession = session;
      await go('exam');
    })()`, sessionId);

    await waitForCondition(cdp, sessionId, `Boolean(document.querySelector('[data-action="toggle-fullscreen"]'))`);
    console.log('✓ Practice CBT workspace loaded with Fullscreen toggle button');

    const initialBtn = await cdp.eval(`(() => {
      const btn = document.querySelector('[data-action="toggle-fullscreen"]');
      return {
        icon: btn?.querySelector('.fs-icon')?.textContent?.trim(),
        ariaPressed: btn?.getAttribute('aria-pressed'),
        bodyHasFs: document.body.classList.contains('is-fullscreen'),
        bodyHasFill: document.body.classList.contains('is-fill-screen')
      };
    })()`, sessionId);

    assert.equal(initialBtn.icon, '⛶', 'Initial icon must be ⛶');
    assert.equal(initialBtn.ariaPressed, 'false', 'Initial aria-pressed must be "false"');
    assert.equal(initialBtn.bodyHasFs, false, 'Initial body must not have is-fullscreen');
    assert.equal(initialBtn.bodyHasFill, false, 'Initial body must not have is-fill-screen');
    console.log('✓ Initial Fullscreen button state verified: ⛶, aria-pressed="false"');

    // ------------------------------------------------------------------------
    // Scenario 3: CSS Fallback Toggle Execution (Simulate iOS / Rejection / Toggle)
    // ------------------------------------------------------------------------
    const fillScreenToggle = await cdp.eval(`(() => {
      // Toggle fill screen state
      state.examFillScreen = true;
      updateFullscreenUI();
      const btn = document.querySelector('[data-action="toggle-fullscreen"]');
      return {
        icon: btn?.querySelector('.fs-icon')?.textContent?.trim(),
        ariaPressed: btn?.getAttribute('aria-pressed'),
        bodyHasFill: document.body.classList.contains('is-fill-screen'),
        active: isFullscreenActive()
      };
    })()`, sessionId);

    assert.equal(fillScreenToggle.icon, '🗗', 'Active icon must switch to 🗗');
    assert.equal(fillScreenToggle.ariaPressed, 'true', 'Active aria-pressed must be "true"');
    assert.equal(fillScreenToggle.bodyHasFill, true, 'Active body must have is-fill-screen class');
    assert.equal(fillScreenToggle.active, true, 'isFullscreenActive() must return true');
    console.log('✓ Fullscreen active state verified: 🗗, aria-pressed="true", is-fill-screen active');

    // ------------------------------------------------------------------------
    // Scenario 4: Teardown on exam exit via cleanupFullscreen()
    // ------------------------------------------------------------------------
    const cleanupResult = await cdp.eval(`(() => {
      cleanupFullscreen();
      const btn = document.querySelector('[data-action="toggle-fullscreen"]');
      return {
        bodyHasFs: document.body.classList.contains('is-fullscreen'),
        bodyHasFill: document.body.classList.contains('is-fill-screen'),
        examFillScreen: state.examFillScreen,
        btnAriaPressed: btn?.getAttribute('aria-pressed')
      };
    })()`, sessionId);

    assert.equal(cleanupResult.bodyHasFs, false, 'Teardown must remove is-fullscreen from body');
    assert.equal(cleanupResult.bodyHasFill, false, 'Teardown must remove is-fill-screen from body');
    assert.equal(cleanupResult.examFillScreen, false, 'Teardown must reset state.examFillScreen to false');
    console.log('✓ Teardown verified: cleanupFullscreen() completely purges all fullscreen classes');

    // ------------------------------------------------------------------------
    // Scenario 5: Physical Device Notice & Contract Boundary
    // ------------------------------------------------------------------------
    console.log('\n------------------------------------------------------------');
    console.log('NOTE ON PHYSICAL DEVICE TESTING (Per Contract & Guidelines):');
    console.log('- Headless Chrome CDP environment verifies API detection logic,');
    console.log('  fallback branches, UI synchronization, and class hygiene.');
    console.log('- Real native requestFullscreen() gesture activation on Android Chrome');
    console.log('  and Samsung Internet requires physical tap interaction on real hardware.');
    console.log('  Physical device verification is recorded as PENDING manual test.');
    console.log('------------------------------------------------------------\n');

    console.log('ALL FEATURE 010 US4 ANDROID FULLSCREEN TESTS PASSED!');
  } finally {
    try { chromeProcess.kill('SIGKILL'); } catch {}
    try { server.close(); } catch {}
    try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}
  }
}

main().catch(err => {
  console.error('\n❌ Test failed:', err);
  process.exit(1);
});
