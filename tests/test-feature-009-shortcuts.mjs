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

async function waitForCondition(cdp, sessionId, expr, timeout = 3000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const res = await cdp.eval(expr, sessionId);
    if (res) return res;
    await delay(50);
  }
  return await cdp.eval(expr, sessionId);
}

async function dispatchKey(cdp, sessionId, key, code = '', keyCode = 0) {
  await cdp.eval(`document.dispatchEvent(new KeyboardEvent('keydown', {
    key: ${JSON.stringify(key)},
    code: ${JSON.stringify(code || key)},
    bubbles: true,
    cancelable: true
  }))`, sessionId);
  await delay(150);
}

async function main() {
  console.log('=== FEATURE 009 (US1): Customizable Keyboard Shortcuts Verification ===\n');

  // 1. Static listener consolidation check
  const appSource = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
  const keydownListenerCount = (appSource.match(/document\.addEventListener\('keydown'/g) || []).length;
  assert.equal(keydownListenerCount, 1, `Expected exactly 1 document keydown listener, found ${keydownListenerCount}`);
  console.log('✓ Static check: Single consolidated document keydown listener verified (0 duplicates)');

  // Start local static HTTP server
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

  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ssw-f009-shortcuts-'));
  const chrome = launchChrome(userDataDir);
  const cdp = new CDPClient(chrome);

  try {
    console.log('[DEBUG] Getting targets...');
    const target = await cdp.send('Target.getTargets');
    console.log('[DEBUG] Target infos:', target.targetInfos);
    const pageTarget = target.targetInfos.find(t => t.type === 'page');
    console.log('[DEBUG] Attaching to targetId:', pageTarget?.targetId);
    const { sessionId } = await cdp.send('Target.attachToTarget', {
      targetId: pageTarget.targetId,
      flatten: true
    });
    console.log('[DEBUG] Attached sessionId:', sessionId);
    await cdp.send('Page.enable', {}, sessionId);
    console.log('[DEBUG] Page enabled');
    await cdp.send('Runtime.enable', {}, sessionId);
    console.log('[DEBUG] Runtime enabled');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 800,
      deviceScaleFactor: 1,
      mobile: false
    }, sessionId);
    console.log('[DEBUG] Metrics overridden');

    const pageErrors = [];
    cdp.on('Runtime.exceptionThrown', params => {
      pageErrors.push(params.exceptionDetails?.text || 'Uncaught exception');
    });
    cdp.on('Runtime.consoleAPICalled', params => {
      console.log('[BROWSER CONSOLE]', params.type, params.args?.map(a => a.value || a.description).join(' '));
    });

    console.log('[DEBUG] Navigating to:', baseUrl);
    await cdp.send('Page.navigate', { url: baseUrl }, sessionId);
    console.log('[DEBUG] Waiting for boot...');
    await waitForCondition(cdp, sessionId, `Boolean(window.__APP_BOOTED__ && window.state?.questions?.length > 0)`, 10000);
    console.log('[DEBUG] Boot complete!');

    // Start Practice Mode via home buttons
    await cdp.eval(`document.querySelector('[data-action="quick-practice-kunci1"]').click()`, sessionId);
    await cdp.eval(`new Promise(r => {
      const check = () => document.querySelector('#setup-form button[type="submit"]') ? r(true) : setTimeout(check, 50);
      check();
    })`, sessionId);
    await cdp.eval(`document.querySelector('#setup-form button[type="submit"]').click()`, sessionId);
    await cdp.eval(`new Promise(r => {
      const check = () => document.querySelector('.exam-shell') ? r(true) : setTimeout(check, 50);
      check();
    })`, sessionId);
    await waitForCondition(cdp, sessionId, `Boolean(document.querySelector('.question-map-item.current'))`);
    await delay(150);

    // Scenario 1: Default shortcuts in Untimed Practice
    const debugInfo = await cdp.eval(`({
      page: window.state?.page,
      activeSession: Boolean(window.state?.activeSession),
      currentIndex: window.state?.activeSession?.currentIndex,
      totalQ: window.state?.activeSession?.questions?.length,
      examShortcuts: window.state?.examShortcuts
    })`, sessionId);
    console.log('[DEBUG] Exam state before ArrowRight:', debugInfo);

    const q1Idx = await cdp.eval(`document.querySelector('.question-map-item.current')?.dataset.index`, sessionId);
    assert.equal(q1Idx, '0', `Expected starting on question index 0, got ${q1Idx}`);

    await dispatchKey(cdp, sessionId, 'ArrowRight', 'ArrowRight', 39);
    await waitForCondition(cdp, sessionId, `document.querySelector('.question-map-item.current')?.dataset.index === '1'`);
    const q2Idx = await cdp.eval(`document.querySelector('.question-map-item.current')?.dataset.index`, sessionId);
    assert.equal(q2Idx, '1', `Expected ArrowRight to move to question index 1, got ${q2Idx}`);

    await dispatchKey(cdp, sessionId, 'ArrowLeft', 'ArrowLeft', 37);
    await waitForCondition(cdp, sessionId, `document.querySelector('.question-map-item.current')?.dataset.index === '0'`);
    const q1Again = await cdp.eval(`document.querySelector('.question-map-item.current')?.dataset.index`, sessionId);
    assert.equal(q1Again, '0', `Expected ArrowLeft to move back to question index 0, got ${q1Again}`);

    // Select option 1, 2, 3
    await dispatchKey(cdp, sessionId, '1', 'Digit1', 49);
    await waitForCondition(cdp, sessionId, `document.querySelector('.answer-choice[data-index="0"]')?.classList.contains('selected')`);
    assert.equal(await cdp.eval(`document.querySelector('.answer-choice[data-index="0"]')?.classList.contains('selected')`, sessionId), true);

    await dispatchKey(cdp, sessionId, '2', 'Digit2', 50);
    await waitForCondition(cdp, sessionId, `document.querySelector('.answer-choice[data-index="1"]')?.classList.contains('selected')`);
    assert.equal(await cdp.eval(`document.querySelector('.answer-choice[data-index="1"]')?.classList.contains('selected')`, sessionId), true);

    await dispatchKey(cdp, sessionId, '3', 'Digit3', 51);
    await waitForCondition(cdp, sessionId, `document.querySelector('.answer-choice[data-index="2"]')?.classList.contains('selected')`);
    assert.equal(await cdp.eval(`document.querySelector('.answer-choice[data-index="2"]')?.classList.contains('selected')`, sessionId), true);

    // Test key '4' on 3-option vs 4-option question
    const optCount = await cdp.eval(`document.querySelectorAll('.answer-choice').length`, sessionId);
    await dispatchKey(cdp, sessionId, '4', 'Digit4', 52);
    if (optCount >= 4) {
      await waitForCondition(cdp, sessionId, `document.querySelector('.answer-choice[data-index="3"]')?.classList.contains('selected')`);
      assert.equal(await cdp.eval(`document.querySelector('.answer-choice[data-index="3"]')?.classList.contains('selected')`, sessionId), true);
    } else {
      // 3-option question: option 3 remains selected, no crash
      assert.equal(await cdp.eval(`document.querySelector('.answer-choice[data-index="2"]')?.classList.contains('selected')`, sessionId), true);
    }
    console.log(`✓ Scenario 1a: Navigation (ArrowRight/ArrowLeft) and Option 1-4 selection verified (options on Q1: ${optCount})`);

    // Test E (Furigana), Q (Map), W (Flag), R (Settings), Y (Practice Translation)
    const furiBefore = await cdp.eval(`document.body.classList.contains('hide-furigana')`, sessionId);
    await dispatchKey(cdp, sessionId, 'e');
    const furiAfter = await cdp.eval(`document.body.classList.contains('hide-furigana')`, sessionId);
    assert.notEqual(furiAfter, furiBefore, 'Key E should toggle furigana');

    const mapBefore = await cdp.eval(`document.querySelector('.exam-shell').classList.contains('map-hidden')`, sessionId);
    await dispatchKey(cdp, sessionId, 'q');
    const mapAfter = await cdp.eval(`document.querySelector('.exam-shell').classList.contains('map-hidden')`, sessionId);
    assert.notEqual(mapAfter, mapBefore, 'Key Q should toggle question map');

    const flagBefore = await cdp.eval(`document.querySelector('.question-map-item.current')?.classList.contains('flagged')`, sessionId);
    await dispatchKey(cdp, sessionId, 'w');
    const flagAfter = await cdp.eval(`document.querySelector('.question-map-item.current')?.classList.contains('flagged')`, sessionId);
    assert.notEqual(flagAfter, flagBefore, 'Key W should toggle flag');

    const transBefore = await cdp.eval(`Boolean(document.querySelector('[data-action="toggle-practice-translation"]')?.classList.contains('is-active'))`, sessionId);
    await dispatchKey(cdp, sessionId, 'y');
    const transAfter = await cdp.eval(`Boolean(document.querySelector('[data-action="toggle-practice-translation"]')?.classList.contains('is-active'))`, sessionId);
    assert.notEqual(transAfter, transBefore, 'Key Y should toggle Practice translation in Untimed Practice');
    // Toggle Y back off
    await dispatchKey(cdp, sessionId, 'y');

    // Open settings with R
    await dispatchKey(cdp, sessionId, 'r');
    assert.equal(await cdp.eval(`document.querySelector('#exam-settings-popover')?.classList.contains('is-open')`, sessionId), true, 'Key R should open settings popover');
    console.log('✓ Scenario 1b: E (Furigana), Q (Map), W (Flag), R (Settings), Y (Practice Translation) verified');

    // Scenario 2: Remap, capture isolation, conflict/reserved rejection, persistence, reset
    // Verify 11 shortcut rows rendered
    const shortcutCount = await cdp.eval(`document.querySelectorAll('#exam-shortcuts-section .exam-shortcut-row').length`, sessionId);
    assert.equal(shortcutCount, 11, `Expected 11 shortcut rows, got ${shortcutCount}`);

    // Start capture on nextQuestion
    await cdp.eval(`document.querySelector('[data-shortcut-action="nextQuestion"]').click()`, sessionId);
    assert.equal(await cdp.eval(`document.querySelector('[data-shortcut-action="nextQuestion"]').textContent.trim()`, sessionId), 'Press a key...');

    // Conflict rejection: press 'q' (bound to toggleMap)
    await dispatchKey(cdp, sessionId, 'q');
    const conflictMsg = await cdp.eval(`document.querySelector('.exam-shortcuts-status')?.textContent?.trim()`, sessionId);
    assert.ok(conflictMsg.length > 0, 'Expected conflict status message when pressing q');
    assert.equal(await cdp.eval(`document.querySelector('#exam-settings-popover')?.classList.contains('is-open')`, sessionId), true, 'Settings popover should stay open on conflict');

    // Reserved rejection: press 'f'
    await dispatchKey(cdp, sessionId, 'f');
    const reservedMsg = await cdp.eval(`document.querySelector('.exam-shortcuts-status')?.textContent?.trim()`, sessionId);
    assert.match(reservedMsg, /F/i, 'Expected reserved key message for F');

    // Valid remap: press 'n'
    await dispatchKey(cdp, sessionId, 'n');
    assert.equal(await cdp.eval(`document.querySelector('[data-shortcut-action="nextQuestion"]').textContent.trim()`, sessionId), 'N');
    assert.equal(await cdp.eval(`document.querySelector('.exam-shortcuts-status')?.textContent?.trim()`, sessionId), '');

    // Close settings via Escape
    await dispatchKey(cdp, sessionId, 'Escape', 'Escape', 27);
    assert.equal(await cdp.eval(`document.querySelector('#exam-settings-popover')?.classList.contains('is-open')`, sessionId), false);

    // Old ArrowRight no longer advances; 'n' advances!
    await dispatchKey(cdp, sessionId, 'ArrowRight', 'ArrowRight', 39);
    assert.equal(await cdp.eval(`document.querySelector('.question-map-item.current')?.dataset.index`, sessionId), '0', 'Old ArrowRight should no longer advance after remap');
    await dispatchKey(cdp, sessionId, 'n');
    await waitForCondition(cdp, sessionId, `document.querySelector('.question-map-item.current')?.dataset.index === '1'`);
    assert.equal(await cdp.eval(`document.querySelector('.question-map-item.current')?.dataset.index`, sessionId), '1', 'Remapped key N should advance to index 1');

    // Focus input guard: focusing an input and pressing 'n' should not advance
    await cdp.eval(`(() => {
      const inp = document.createElement('input');
      inp.id = 'test-shortcut-guard-input';
      document.body.appendChild(inp);
      inp.focus();
    })()`, sessionId);
    await dispatchKey(cdp, sessionId, 'n');
    assert.equal(await cdp.eval(`document.querySelector('.question-map-item.current')?.dataset.index`, sessionId), '1', 'Shortcut must not fire when an input element is focused');
    await cdp.eval(`document.getElementById('test-shortcut-guard-input')?.remove()`, sessionId);

    // Persistence across page reload
    const storedRaw = await cdp.eval(`localStorage.getItem('sswPmExamShortcuts')`, sessionId);
    const stored = JSON.parse(storedRaw);
    assert.equal(stored.bindings.nextQuestion, 'n');

    await cdp.send('Page.navigate', { url: baseUrl }, sessionId);
    await waitForCondition(cdp, sessionId, `Boolean(window.__APP_BOOTED__ && window.state?.questions?.length > 0)`, 10000);
    const loadedShortcuts = await cdp.eval(`window.state?.examShortcuts`, sessionId);
    assert.equal(loadedShortcuts.nextQuestion, 'n', 'Remapped shortcut N must persist across reload');

    // Re-enter practice to verify UI badge and Reset
    await waitForCondition(cdp, sessionId, `Boolean(document.querySelector('[data-action="quick-practice-kunci1"]') || document.querySelector('[data-action="resume-session"]'))`);
    await cdp.eval(`(() => {
      const resume = document.querySelector('[data-action="resume-session"]');
      if (resume) {
        resume.click();
      } else {
        document.querySelector('[data-action="quick-practice-kunci1"]')?.click();
      }
    })()`, sessionId);
    await waitForCondition(cdp, sessionId, `Boolean(document.querySelector('.exam-shell') || document.querySelector('#setup-form button[type="submit"]'))`);
    const onSetup = await cdp.eval(`Boolean(document.querySelector('#setup-form button[type="submit"]'))`, sessionId);
    if (onSetup) {
      await cdp.eval(`document.querySelector('#setup-form button[type="submit"]')?.click()`, sessionId);
      await waitForCondition(cdp, sessionId, `Boolean(document.querySelector('.exam-shell'))`);
    }
    await delay(200);

    await waitForCondition(cdp, sessionId, `Boolean(document.querySelector('[data-action="exam-settings"]'))`);
    await cdp.eval(`document.querySelector('[data-action="exam-settings"]')?.click()`, sessionId);
    await waitForCondition(cdp, sessionId, `Boolean(document.querySelector('#exam-settings-popover.is-open'))`);
    await waitForCondition(cdp, sessionId, `Boolean(document.querySelector('[data-shortcut-action="nextQuestion"]'))`);
    assert.equal(await cdp.eval(`document.querySelector('[data-shortcut-action="nextQuestion"]').textContent.trim()`, sessionId), 'N', 'Remapped shortcut N badge must be N');

    // Reset Shortcuts
    await cdp.eval(`document.querySelector('[data-action="reset-exam-shortcuts"]').click()`, sessionId);
    await delay(100);
    assert.equal(await cdp.eval(`document.querySelector('[data-shortcut-action="nextQuestion"]').textContent.trim()`, sessionId), '→', 'Reset Shortcuts should restore ArrowRight (→)');
    console.log('✓ Scenario 2: Capture isolation, conflict/reserved rejection, remap, input guard, persistence & reset verified');

    // Mode isolation check: Timed / Full Mock mode should NOT activate Y translation
    await cdp.send('Page.navigate', { url: baseUrl }, sessionId);
    await waitForCondition(cdp, sessionId, `Boolean(window.__APP_BOOTED__ && window.state?.questions?.length > 0)`, 10000);
    await waitForCondition(cdp, sessionId, `Boolean(document.querySelector('[data-action="quick-start-kunci1"]'))`);
    await cdp.eval(`document.querySelector('[data-action="quick-start-kunci1"]')?.click()`, sessionId);
    await waitForCondition(cdp, sessionId, `Boolean(document.querySelector('#setup-form button[type="submit"]'))`);
    await cdp.eval(`document.querySelector('#setup-form button[type="submit"]')?.click()`, sessionId);
    await waitForCondition(cdp, sessionId, `Boolean(document.querySelector('.exam-shell'))`);
    await delay(150);
    await dispatchKey(cdp, sessionId, 'y');
    const mockTransActive = await cdp.eval(`Boolean(document.querySelector('[data-action="toggle-practice-translation"]'))`, sessionId);
    assert.equal(mockTransActive, false, 'Full Mock must not render or activate Practice translation via Y');
    console.log('✓ Mode isolation: Full Mock ignores Y practice translation shortcut');

    assert.equal(pageErrors.length, 0, `Unexpected page errors: ${pageErrors.join('; ')}`);
    console.log('\nALL FEATURE 009 US1 SHORTCUT TESTS PASSED!');
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
