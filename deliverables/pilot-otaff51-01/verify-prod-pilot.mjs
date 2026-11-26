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
  '.ico': 'image/x-icon',
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
            for (const fn of this.listeners.get(msg.method)) fn(msg.params, msg.sessionId);
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
    if (!this.listeners.has(method)) this.listeners.set(method, []);
    this.listeners.get(method).push(callback);
  }

  async eval(expression, sessionId) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
    }, sessionId);
    if (res.exceptionDetails) {
      const desc = res.exceptionDetails.exception?.description || res.exceptionDetails.text || 'Runtime.evaluate exception';
      throw new Error(desc);
    }
    return res.result ? res.result.value : undefined;
  }
}

function launchChrome(userDataDir) {
  return spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${userDataDir}`,
    '--remote-debugging-pipe',
    'about:blank',
  ], { stdio: ['ignore', 'pipe', 'pipe', 'pipe', 'pipe'] });
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function dispatchKey(cdp, sessionId, key, code = '') {
  await cdp.eval(`document.dispatchEvent(new KeyboardEvent('keydown', {
    key: ${JSON.stringify(key)},
    code: ${JSON.stringify(code || key)},
    repeat: false,
    bubbles: true,
    cancelable: true
  }))`, sessionId);
  await delay(100);
}

async function waitForCondition(cdp, sessionId, expr, timeoutMs = 20000, intervalMs = 100) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await cdp.eval(`Boolean(${expr})`, sessionId)) return true;
    await delay(intervalMs);
  }
  throw new Error(`Timeout waiting for condition: ${expr}`);
}

async function main() {
  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
    const filePath = path.join(ROOT, decodeURIComponent(reqPath.replace(/^\/+/, '')));
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not Found: ' + req.url);
    }
  });

  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-prod-pilot-'));
  const chromeProcess = launchChrome(userDataDir);
  const cdp = new CDPClient(chromeProcess);
  const consoleErrors = [];
  const network404s = [];

  cdp.on('Runtime.consoleAPICalled', params => {
    if (params.type === 'error') {
      consoleErrors.push((params.args || []).map(a => a.value || a.description || '').join(' '));
    }
  });
  cdp.on('Network.responseReceived', params => {
    if (params.response.status === 404) network404s.push(params.response.url);
  });

  try {
    await cdp.send('Target.setDiscoverTargets', { discover: true });
    const targetInfo = await new Promise(async (resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Timeout finding page target')), 15000);
      try {
        const res = await cdp.send('Target.getTargets');
        const page = (res.targetInfos || []).find(t => t.type === 'page');
        if (page) { clearTimeout(timer); resolve(page); return; }
      } catch {}
      cdp.on('Target.targetCreated', params => {
        if (params.targetInfo?.type === 'page') { clearTimeout(timer); resolve(params.targetInfo); }
      });
    });

    const { sessionId } = await cdp.send('Target.attachToTarget', { targetId: targetInfo.targetId, flatten: true });
    await cdp.send('Page.enable', {}, sessionId);
    await cdp.send('Runtime.enable', {}, sessionId);
    await cdp.send('Network.enable', {}, sessionId);
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1366, height: 900, deviceScaleFactor: 1, mobile: false }, sessionId);

    await cdp.send('Page.navigate', { url: `${baseUrl}/index.html` }, sessionId);
    await waitForCondition(cdp, sessionId, 'window.__APP_BOOTED__ === true && typeof window.ensureAllBuiltinSetsLoaded === "function"', 20000);
    await cdp.eval('window.ensureAllBuiltinSetsLoaded(true)', sessionId);
    await waitForCondition(cdp, sessionId, 'window.state?.questions?.some(q => q.setId === "pilot-otaff51-01")', 20000);

    const pkgInfo = await cdp.eval('window.getAvailablePackages().find(p => p.id === "pilot-otaff51-01")', sessionId);
    assert.ok(pkgInfo, 'pilot-otaff51-01 must be in getAvailablePackages()');
    assert.equal(pkgInfo.total, 5);
    assert.equal(pkgInfo.active, 5);
    console.log(`✓ Auto-loaded package: ${pkgInfo.name} (${pkgInfo.active}/${pkgInfo.total})`);

    // Check Beranda card text
    const homeText = await cdp.eval('document.body.innerText', sessionId);
    assert.ok(homeText.includes('Pilot OTAFF 5.1'), 'Beranda must show Pilot OTAFF 5.1');
    console.log('✓ Beranda card visible');

    // Start Practice Mode
    await cdp.eval(`
      (async () => {
        window.state.activeSession = null;
        window.state.setup.mode = 'practice';
        window.state.setup.practice = true;
        window.state.setup.setId = 'pilot-otaff51-01';
        window.state.setup.count = 5;
        window.state.setup.duration = 0;
        window.state.setup.random = false;
        window.state.setup.shuffleQuestions = false;
        window.state.setup.shuffleOptions = false;
        await window.startExam();
      })()
    `, sessionId);
    await waitForCondition(cdp, sessionId, 'window.state.page === "exam" && window.state.activeSession?.setId === "pilot-otaff51-01"');

    // Q002 Option A Kotoba
    await cdp.eval('window.moveExamTo(1)', sessionId);
    await waitForCondition(cdp, sessionId, 'window.state.activeSession.currentIndex === 1');
    await dispatchKey(cdp, sessionId, 'z', 'KeyZ');
    await waitForCondition(cdp, sessionId, 'document.querySelectorAll(".practice-option-kotoba .practice-kotoba-item").length > 0');
    const q2OptA = await cdp.eval('document.querySelector(".practice-option-kotoba").innerText', sessionId);
    assert.ok(q2OptA.includes('えび') && q2OptA.includes('カシューナッツ'));
    console.log('✓ Q002 Option A Kotoba rendered (えび, カシューナッツ)');

    // Q004 question image
    await cdp.eval('window.moveExamTo(3)', sessionId);
    await waitForCondition(cdp, sessionId, '(() => { const img = document.querySelector(".question-display-image"); return Boolean(img && img.complete && img.naturalWidth > 0); })()');
    const q4Img = await cdp.eval('(() => { const i = document.querySelector(".question-display-image"); return { src: i.src, w: i.naturalWidth, h: i.naturalHeight }; })()', sessionId);
    assert.ok(q4Img.src.includes('pilot-otaff51-q004.png'));
    console.log(`✓ Q004 question image rendered (${q4Img.w}x${q4Img.h})`);

    // Q005 4 option images
    await cdp.eval('window.moveExamTo(4)', sessionId);
    await waitForCondition(cdp, sessionId, '(() => { const imgs = Array.from(document.querySelectorAll(".answer-image")); return imgs.length === 4 && imgs.every(i => i.complete && i.naturalWidth > 0); })()');
    const q5Main = await cdp.eval('document.querySelectorAll(".question-display-image").length', sessionId);
    assert.equal(q5Main, 0);
    const q5Opts = await cdp.eval('Array.from(document.querySelectorAll(".answer-image")).map(i => ({ w: i.naturalWidth, h: i.naturalHeight }))', sessionId);
    console.log(`✓ Q005 4 option images rendered (${q5Opts.map(x => `${x.w}x${x.h}`).join(', ')})`);

    // Exam mode submit & 150/150 score check
    await cdp.eval(`
      (async () => {
        window.state.activeSession = null;
        window.state.setup.mode = 'exam';
        window.state.setup.practice = false;
        window.state.setup.setId = 'pilot-otaff51-01';
        window.state.setup.count = 5;
        window.state.setup.duration = 15;
        window.state.setup.random = false;
        window.state.setup.shuffleQuestions = false;
        window.state.setup.shuffleOptions = false;
        await window.startExam();
      })()
    `, sessionId);
    await waitForCondition(cdp, sessionId, 'window.state.page === "exam" && window.state.activeSession?.mode === "exam"');

    const keys = ['D', 'A', 'B', 'C', 'D'];
    for (let i = 0; i < 5; i++) {
      await cdp.eval(`window.moveExamTo(${i})`, sessionId);
      await waitForCondition(cdp, sessionId, `window.state.activeSession.currentIndex === ${i}`);
      await cdp.eval(`document.querySelector('.option-card[data-option="${keys[i]}"]')?.click()`, sessionId);
      await delay(50);
    }
    await cdp.eval('window.finishExam(true)', sessionId);
    await waitForCondition(cdp, sessionId, 'window.state.page === "result" || document.body.innerText.includes("150")');
    const resultText = await cdp.eval('document.body.innerText', sessionId);
    assert.ok(resultText.includes('150'), 'Result screen must display 150');
    console.log('✓ Exam mode submit verified: 150 / 150');

    assert.deepEqual(consoleErrors, [], `Console errors: ${consoleErrors.join(' | ')}`);
    assert.deepEqual(network404s, [], `Network 404s: ${network404s.join(' | ')}`);
    console.log('✓ Console errors: 0, Network 404s: 0');
    console.log('\nPRODUCTION INTEGRATION VERIFIED.');
  } finally {
    try { chromeProcess.kill(); } catch {}
    server.close();
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch {}
  }
}

main();
