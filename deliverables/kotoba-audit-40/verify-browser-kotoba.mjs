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

async function waitForCondition(cdp, sessionId, expr, timeout = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const ok = await cdp.eval(expr, sessionId);
      if (ok) return ok;
    } catch {}
    await new Promise(r => setTimeout(r, 80));
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
  const port = server.address().port;

  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-kotoba-verify-'));
  const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
  const chromeProcess = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${userDataDir}`,
    '--remote-debugging-pipe',
    'about:blank',
  ], { stdio: ['ignore', 'pipe', 'pipe', 'pipe', 'pipe'] });

  const cdp = new CDPClient(chromeProcess);
  const consoleErrors = [];
  const network404s = [];

  cdp.on('Runtime.consoleAPICalled', params => {
    if (params.type === 'error') {
      const txt = (params.args || []).map(a => a.value || a.description || '').join(' ');
      consoleErrors.push(txt);
    }
  });
  cdp.on('Network.responseReceived', params => {
    if (params.response.status === 404) network404s.push(params.response.url);
  });

  const checks = [];
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

    await cdp.send('Page.navigate', { url: `http://127.0.0.1:${port}/index.html` }, sessionId);
    await waitForCondition(cdp, sessionId, 'document.readyState === "complete"');
    await waitForCondition(cdp, sessionId, 'window.__APP_BOOTED__ === true && typeof window.ensureAllBuiltinSetsLoaded === "function"', 20000);
    await cdp.eval('window.ensureAllBuiltinSetsLoaded(true)', sessionId);
    await waitForCondition(cdp, sessionId, 'window.state && window.state.questions && window.state.questions.length >= 2139', 20000);

    async function startPractice(setId, count) {
      await cdp.eval(`
        (async () => {
          for (const s of window.state.sessions) {
            if (s.status === 'in_progress') { s.status = 'completed'; await window.put('sessions', s); }
          }
          window.state.activeSession = null;
          window.state.setup.mode = 'practice';
          window.state.setup.practice = true;
          window.state.setup.setId = ${JSON.stringify(setId)};
          window.state.setup.count = ${count};
          window.state.setup.duration = 0;
          window.state.setup.random = false;
          window.state.setup.shuffleQuestions = false;
          window.state.setup.shuffleOptions = false;
          await window.startExam();
        })()
      `, sessionId);
      await waitForCondition(cdp, sessionId, `window.state.page === "exam" && window.state.activeSession && window.state.activeSession.setId === ${JSON.stringify(setId)}`);
    }

    async function jumpToQuestionId(qId) {
      const idx = await cdp.eval(`window.state.activeSession.questions.findIndex(q => q.id === ${JSON.stringify(qId)})`, sessionId);
      assert(idx >= 0, `Question ${qId} must exist in activeSession`);
      await cdp.eval(`window.moveExamTo(${idx})`, sessionId);
      await waitForCondition(cdp, sessionId, `window.state.activeSession.currentIndex === ${idx}`);
    }

    async function togglePromptKotoba() {
      await cdp.eval('document.querySelector(".practice-prompt-row .practice-ctrl-kotoba").click()', sessionId);
      await waitForCondition(cdp, sessionId, 'Boolean(document.querySelector(".practice-question-kotoba"))');
      return cdp.eval(`Array.from(document.querySelectorAll(".practice-question-kotoba .practice-kotoba-item")).map(el => ({
        kanji: el.querySelector(".kotoba-ruby")?.childNodes[0]?.textContent || '',
        rt: el.querySelector(".kotoba-ruby rt")?.textContent || '',
        arti: el.querySelector(".kotoba-meaning")?.textContent || ''
      }))`, sessionId);
    }

    async function toggleOptionKotoba(optIndex, expectList = true) {
      await cdp.eval(`document.querySelectorAll(".practice-option-row .practice-ctrl-kotoba")[${optIndex}].click()`, sessionId);
      if (expectList) {
        await waitForCondition(cdp, sessionId, `document.querySelectorAll(".practice-option-row")[${optIndex}].querySelector(".practice-option-kotoba") !== null`);
      } else {
        await new Promise(r => setTimeout(r, 120));
      }
      return cdp.eval(`Array.from(document.querySelectorAll(".practice-option-row")[${optIndex}].querySelectorAll(".practice-option-kotoba .practice-kotoba-item")).map(el => ({
        kanji: el.querySelector(".kotoba-ruby")?.childNodes[0]?.textContent || '',
        rt: el.querySelector(".kotoba-ruby rt")?.textContent || '',
        arti: el.querySelector(".kotoba-meaning")?.textContent || ''
      }))`, sessionId);
    }

    // 1. Cohort 1: ssw-pm-kunci-ujian-1 #11 (0ºC-10ºC)
    await startPractice('ssw-pm-kunci-ujian-1', 40);
    await jumpToQuestionId('kunci1-q011');
    const c1OptA = await toggleOptionKotoba(0);
    assert(c1OptA.some(t => t.kanji === 'ºC' && t.arti.includes('Celcius')), 'kunci1-q011 Opt A must render ºC');
    checks.push({ cohort: 'cohort_1', qId: 'kunci1-q011::A', count: c1OptA.length, sample: c1OptA.map(t => t.kanji) });

    // 2. Cohort 1: ssw-pm-tipe2-nguyen1 #24 (3つ)
    await startPractice('ssw-pm-tipe2-nguyen1', 40);
    await jumpToQuestionId('q024');
    const t2OptA = await toggleOptionKotoba(0);
    assert(t2OptA.some(t => t.kanji === 'つ'), 'tipe2-nguyen1 q024 Opt A must render つ');
    checks.push({ cohort: 'cohort_1', qId: 'q024::A', count: t2OptA.length, sample: t2OptA.map(t => t.kanji) });

    // 3. Cohort 2: latsol-nguyen-01 #32 (prompt + opt A + furigana toggle) & #39 (sign スイッチを入れるな)
    await startPractice('latsol-nguyen-01', 40);
    await jumpToQuestionId('nguyen01-q032');
    const n32P = await togglePromptKotoba();
    assert(n32P.some(t => t.kanji === '持ち上げた') && n32P.some(t => t.kanji === '間違っている'), 'nguyen01-q032 prompt missing expected repaired terms');
    const n32A = await toggleOptionKotoba(0);
    assert(n32A.some(t => t.kanji === '膝') && n32A.some(t => t.kanji === '立ち上がる'), 'nguyen01-q032 opt A missing expected terms');
    await cdp.eval('document.querySelector("[data-action=\\"toggle-furigana-quick\\"]").click()', sessionId);
    const hideFuri = await cdp.eval('document.body.classList.contains("hide-furigana")', sessionId);
    assert.equal(hideFuri, true, 'Furigana toggle must hide readings cleanly');
    await cdp.eval('document.querySelector("[data-action=\\"toggle-furigana-quick\\"]").click()', sessionId);
    checks.push({ cohort: 'cohort_2', qId: 'nguyen01-q032', promptCount: n32P.length, optACount: n32A.length, furiganaSync: true });

    await jumpToQuestionId('nguyen01-q039');
    const n39B = await toggleOptionKotoba(1);
    assert(n39B.some(t => t.kanji === '点検中') && n39B.some(t => t.kanji === 'スイッチを入れるな'), 'nguyen01-q039 Opt B must render sign term');
    checks.push({ cohort: 'cohort_2', qId: 'nguyen01-q039::B', sample: n39B.map(t => t.kanji) });

    // 4. Cohort 2: latsol-nguyen-06 #35 (hiragana prompt いみ)
    await startPractice('latsol-nguyen-06', 40);
    await jumpToQuestionId('nguyen06-q035');
    const n06P = await togglePromptKotoba();
    assert(n06P.some(t => t.kanji === 'いみ'), 'nguyen06-q035 prompt must render いみ');
    checks.push({ cohort: 'cohort_2', qId: 'nguyen06-q035', sample: n06P.map(t => t.kanji) });

    // 5. Cohort 2: latsol-tambahan-02 #11 (きんぞく, かみのけ) & #28 (きがいてきがいよういん)
    await startPractice('latsol-tambahan-02', 30);
    await jumpToQuestionId('tambahan02-q011');
    const tb11A = await toggleOptionKotoba(0);
    const tb11B = await toggleOptionKotoba(1);
    assert(tb11A.some(t => t.kanji === 'きんぞく') && tb11B.some(t => t.kanji === 'かみのけ'), 'tambahan02-q011 options must render きんぞく and かみのけ');
    await jumpToQuestionId('tambahan02-q028');
    const tb28C = await toggleOptionKotoba(2);
    assert(tb28C.some(t => t.kanji === 'きがいてきがいよういん'), 'tambahan02-q028 Opt C must render きがいてきがいよういん');
    checks.push({ cohort: 'cohort_2', qId: 'tambahan02-q011/q028', sample: [tb11A[0]?.kanji, tb11B[0]?.kanji, tb28C[0]?.kanji] });

    // 6. Cohort 2: latsol-nguyen-05 #36 Option C (non-Japanese truncated placeholder [] handles gracefully)
    await startPractice('latsol-nguyen-05', 36);
    await jumpToQuestionId('nguyen05-q036');
    const n05C = await toggleOptionKotoba(2, false);
    assert.equal(n05C.length, 0, 'Non-Japanese truncated option handles safely with 0 items and 0 errors');
    checks.push({ cohort: 'cohort_2', qId: 'nguyen05-q036::C', count: 0, gracefulEmpty: true });

    // 7. Cohort 3: ssw-pm-kunci-ujian-14 #35 (3つ) & ssw-pm-kunci-ujian-16 #1 (4 options A..D)
    await startPractice('ssw-pm-kunci-ujian-14', 59);
    await jumpToQuestionId('kunci-ujian-14-q035');
    const u14OptA = await toggleOptionKotoba(0);
    assert(u14OptA.some(t => t.kanji === 'つ'), 'kunci-ujian-14-q035 Opt A must render つ');
    checks.push({ cohort: 'cohort_3', qId: 'kunci-ujian-14-q035::A', sample: u14OptA.map(t => t.kanji) });

    await startPractice('ssw-pm-kunci-ujian-16', 50);
    await jumpToQuestionId('kunci-ujian-16-q001');
    const u16P = await togglePromptKotoba();
    assert(u16P.length >= 5, 'kunci-ujian-16-q001 prompt must render >=5 verified Kotoba items');
    checks.push({ cohort: 'cohort_3', qId: 'kunci-ujian-16-q001', count: u16P.length });

    // 8. Cohort 4: pilot-otaff51-01 #1
    await startPractice('pilot-otaff51-01', 5);
    const pilotP = await togglePromptKotoba();
    assert(pilotP.length >= 5, 'pilot-otaff51-01 #1 must render >=5 verified Kotoba items');
    checks.push({ cohort: 'cohort_4', qId: 'pilot-otaff51-01 #1', count: pilotP.length });

    // 9. Protected 10 Reference: latsol-otaff-pm51-01 #1
    await startPractice('latsol-otaff-pm51-01', 40);
    const protP = await togglePromptKotoba();
    assert(protP.length >= 5, 'Protected latsol-otaff-pm51-01 #1 must render verified Kotoba cleanly');
    checks.push({ cohort: 'protected_10', qId: 'latsol-otaff-pm51-01 #1', count: protP.length });

    assert.equal(network404s.length, 0, `Detected HTTP 404 errors: ${network404s.join(', ')}`);
    const criticalErrors = consoleErrors.filter(e => !e.includes('favicon') && !e.includes('ServiceWorker') && !e.includes('sw.js'));
    assert.equal(criticalErrors.length, 0, `Detected JS console errors: ${criticalErrors.join('\n')}`);

    console.log(JSON.stringify({ passed: true, checksExecuted: checks.length, network404s: 0, consoleErrors: 0, checks }, null, 2));
  } finally {
    try { chromeProcess.kill(); } catch {}
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch {}
    await new Promise(resolve => server.close(resolve));
  }
}

main().catch(err => {
  console.error('BROWSER VERIFY FAILED:', err);
  process.exit(1);
});
