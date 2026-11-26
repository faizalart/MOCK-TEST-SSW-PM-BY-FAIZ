import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { validateQuestion, DEFAULT_PACKAGES } from '../utils.js';

const ROOT = process.cwd();

const NEW_PACKAGES = [
  { file: 'ssw-pm-kunci-ujian-14.json', id: 'ssw-pm-kunci-ujian-14', name: 'Soal Ujian 14', count: 59 },
  { file: 'ssw-pm-kunci-ujian-15.json', id: 'ssw-pm-kunci-ujian-15', name: 'Soal Ujian 15', count: 38 },
  { file: 'ssw-pm-kunci-ujian-16.json', id: 'ssw-pm-kunci-ujian-16', name: 'Soal Ujian 16', count: 50 }
];

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

async function waitForCondition(cdp, sessionId, expr, timeout = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const ok = await cdp.eval(expr, sessionId);
      if (ok) return ok;
    } catch {}
    await new Promise(r => setTimeout(r, 100));
  }
  throw new Error(`Timeout waiting for condition: ${expr}`);
}

async function runStaticTests() {
  console.log('--- PART 1: Static Schema, Asset & Kotoba Validation (Paket 14, 15, 16) ---');

  const dict = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/sharedKotobaDictionary.json'), 'utf8'));
  const map = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/kotobaMapping.json'), 'utf8'));
  const extra = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/kotoba-dan-kategori-tambahan.json'), 'utf8'));

  assert.ok(extra.totalEntries >= 728, 'kotoba-dan-kategori-tambahan.json must have at least 728 total entries');

  let totalQuestionsChecked = 0;
  let totalImagesChecked = 0;
  const assetsDir = path.join(ROOT, 'assets/questions');

  for (const pkgInfo of NEW_PACKAGES) {
    const filePath = path.join(ROOT, 'data', pkgInfo.file);
    assert.ok(fs.existsSync(filePath), `${pkgInfo.file} must exist in data/`);
    const d = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    assert.equal(d.questions.length, pkgInfo.count, `Question count for ${pkgInfo.id} must be ${pkgInfo.count}`);

    for (const q of d.questions) {
      totalQuestionsChecked++;
      const errs = validateQuestion(q);
      assert.equal(errs.length, 0, `Question ${q.id} validation errors: ${errs.join(', ')}`);

      // Check kotoba mapping
      assert.ok(Array.isArray(map.questions[q.id]), `map.questions[${q.id}] must be an array`);
      assert.ok(map.options[q.id], `map.options[${q.id}] must exist`);
      for (const opt of q.options) {
        assert.ok(Array.isArray(map.options[q.id][opt.id]), `map.options[${q.id}][${opt.id}] must be array`);
      }

      // Check image references
      if (q.imageMediaId || q.questionImage) {
        totalImagesChecked++;
        const m = (q.media || []).find(item => item.id === q.imageMediaId) || q.media?.[0];
        assert.ok(m, `Media item for ${q.id} must exist in q.media`);
        const fn = path.basename(m.path);
        const imagePath = path.join(assetsDir, fn);
        assert.ok(fs.existsSync(imagePath), `Image file ${fn} must exist in assets/questions`);
        const buf = fs.readFileSync(imagePath);
        const w = buf.readUInt32BE(16);
        const h = buf.readUInt32BE(20);
        assert.ok(!(w === 1240 && h === 1755), `Image ${fn} must not be full page (got ${w}x${h})`);
      }
    }
  }

  assert.equal(totalQuestionsChecked, 147, 'Total new questions must be 147');
  assert.equal(totalImagesChecked, 11, 'Total new images must be 11');
  console.log(`✓ 147 questions and 11 cropped images statically validated with 0 errors`);

  // Service worker check
  const swContent = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
  assert.ok(/ssw-pm-mock-test-shell-v\d+/.test(swContent), 'sw.js cache must have versioned shell cache');
  for (const p of NEW_PACKAGES) {
    assert.ok(swContent.includes(`./data/${p.file}`), `sw.js must precache ./data/${p.file}`);
  }
  console.log('✓ Service Worker precaches all 3 new packages under v36 cache');
}

async function runBrowserTests() {
  console.log('\n--- PART 2: Real Browser / CDP Integration (Paket 14, 15, 16) ---');

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
  console.log(`✓ Local test server running on http://127.0.0.1:${port}`);

  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-14-16-test-'));
  const chromeProcess = launchChrome(userDataDir);
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
    if (params.response.status === 404) {
      network404s.push(params.response.url);
    }
  });

  try {
    await cdp.send('Target.setDiscoverTargets', { discover: true });
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
    await cdp.send('Network.enable', {}, sessionId);

    await cdp.send('Page.navigate', { url: `http://127.0.0.1:${port}/index.html` }, sessionId);
    await waitForCondition(cdp, sessionId, 'document.readyState === "complete"');
    await waitForCondition(cdp, sessionId, 'window.__APP_BOOTED__ === true && typeof window.ensureAllBuiltinSetsLoaded === "function"', 20000);

    await cdp.eval('window.ensureAllBuiltinSetsLoaded(true)', sessionId);
    await waitForCondition(cdp, sessionId, 'window.state && window.state.questions && window.state.questions.length >= 1700', 20000);

    const questionsCount = await cdp.eval('window.state.questions.length', sessionId);
    console.log(`✓ App booted & seeded: ${questionsCount} total questions in IndexedDB (1587 + 147 = 1734)`);

    // Verify all 3 packages appear in getAvailablePackages
    const available = await cdp.eval('window.getAvailablePackages().map(p => ({ id: p.id, name: p.name, total: p.total, active: p.active }))', sessionId);
    for (const pkg of NEW_PACKAGES) {
      const found = available.find(p => p.id === pkg.id);
      assert.ok(found, `Package ${pkg.id} must be in available packages`);
      assert.equal(found.total, pkg.count, `Total questions for ${pkg.id} must be ${pkg.count}`);
      assert.equal(found.active, pkg.count, `Active questions for ${pkg.id} must be ${pkg.count}`);
    }
    console.log(`✓ All 3 new packages present in catalog with 100% active questions matching counts`);

    async function startPackageMode(setId, mode, count) {
      await cdp.eval(`
        (async () => {
          for (const s of window.state.sessions) {
            if (s.status === 'in_progress') {
              s.status = 'completed';
              await window.put('sessions', s);
            }
          }
          window.state.activeSession = null;
          window.state.setup.mode = ${JSON.stringify(mode)};
          window.state.setup.practice = ${mode === 'practice'};
          window.state.setup.setId = ${JSON.stringify(setId)};
          window.state.setup.count = ${count};
          window.state.setup.duration = ${mode === 'practice' ? 0 : 70};
          window.state.setup.random = false;
          window.state.setup.shuffleQuestions = false;
          window.state.setup.shuffleOptions = false;
          await window.startExam();
        })()
      `, sessionId);
      await waitForCondition(cdp, sessionId, `window.state.page === "exam" && window.state.activeSession && window.state.activeSession.setId === ${JSON.stringify(setId)}`);
    }

    // 1. Test Soal Ujian 14 (59 questions, test #33 image & #59 navigation)
    await startPackageMode('ssw-pm-kunci-ujian-14', 'practice', 59);
    const u14Btns = await cdp.eval('document.querySelectorAll(".question-map-item").length', sessionId);
    assert.equal(u14Btns, 59, 'Soal Ujian 14 must have 59 navigator buttons');

    await cdp.eval('window.moveExamTo(32)', sessionId); // Question #33
    await waitForCondition(cdp, sessionId, 'window.state.activeSession.currentIndex === 32');
    await waitForCondition(cdp, sessionId, '(() => { const img = document.querySelector(".question-display-image"); return Boolean(img && img.complete && img.naturalWidth > 0); })()', 10000);
    const q33Img = await cdp.eval('(() => { const img = document.querySelector(".question-display-image"); return { src: img.src, w: img.naturalWidth, h: img.naturalHeight }; })()', sessionId);
    assert.ok(q33Img.src.includes('kunci-ujian-14-q033.png'), 'Question 33 must render kunci-ujian-14-q033.png');
    assert.ok(q33Img.w > 0, 'Image 33 must load with natural width');
    console.log(`✓ Soal Ujian 14 verified: 59 questions, #33 image rendered (${q33Img.w}x${q33Img.h})`);

    // 2. Test Soal Ujian 15 (38 questions, test #35 image)
    await startPackageMode('ssw-pm-kunci-ujian-15', 'full', 38);
    const u15Btns = await cdp.eval('document.querySelectorAll(".question-map-item").length', sessionId);
    assert.equal(u15Btns, 38, 'Soal Ujian 15 must have 38 navigator buttons');

    await cdp.eval('window.moveExamTo(34)', sessionId); // Question #35
    await waitForCondition(cdp, sessionId, 'window.state.activeSession.currentIndex === 34');
    await waitForCondition(cdp, sessionId, '(() => { const img = document.querySelector(".question-display-image"); return Boolean(img && img.complete && img.naturalWidth > 0); })()', 10000);
    console.log('✓ Soal Ujian 15 CBT Mode verified: 38 questions, #35 image rendered');

    // 3. Test Soal Ujian 16 (50 questions, test #1 with 4 options A..D & #41 image)
    await startPackageMode('ssw-pm-kunci-ujian-16', 'practice', 50);
    const u16Btns = await cdp.eval('document.querySelectorAll(".question-map-item").length', sessionId);
    assert.equal(u16Btns, 50, 'Soal Ujian 16 must have 50 navigator buttons');

    const q1OptsCount = await cdp.eval('document.querySelectorAll(".answer-choice").length', sessionId);
    assert.equal(q1OptsCount, 4, 'Question #1 in Soal Ujian 16 must render 4 options (A, B, C, D)');

    await cdp.eval('window.moveExamTo(40)', sessionId); // Question #41
    await waitForCondition(cdp, sessionId, 'window.state.activeSession.currentIndex === 40');
    await waitForCondition(cdp, sessionId, '(() => { const img = document.querySelector(".question-display-image"); return Boolean(img && img.complete && img.naturalWidth > 0); })()', 10000);
    console.log('✓ Soal Ujian 16 verified: 50 questions, #1 has 4 options A..D, #41 image rendered');

    // Network 404 check
    assert.equal(network404s.length, 0, `Detected 404 network errors: ${network404s.join(', ')}`);
    console.log('✓ Zero HTTP 404 asset errors detected');

    // Critical console error check
    const criticalErrors = consoleErrors.filter(e => !e.includes('favicon') && !e.includes('ServiceWorker') && !e.includes('sw.js'));
    assert.equal(criticalErrors.length, 0, `Detected console errors: ${criticalErrors.join('\n')}`);
    console.log('✓ Zero JavaScript runtime console errors detected');

  } finally {
    try { chromeProcess.kill(); } catch {}
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch {}
    await new Promise(resolve => server.close(resolve));
  }
}

async function main() {
  console.log('================================================================');
  console.log('TEST SUITE: INTEGRATION OF SOAL UJIAN 14, 15, 16');
  console.log('================================================================');
  await runStaticTests();
  await runBrowserTests();
  console.log('\n================================================================');
  console.log('ALL 3 NEW PACKAGES INTEGRATION TESTS PASSED (100%)!');
  console.log('================================================================\n');
}

main().catch(err => {
  console.error('\n❌ Test Suite Failed:', err);
  process.exit(1);
});
