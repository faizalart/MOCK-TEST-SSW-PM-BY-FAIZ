import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { validateQuestion, DEFAULT_PACKAGES } from '../utils.js';

const ROOT = process.cwd();

const LATSOL_FILES = [
  'latsol-nguyen-01.json', 'latsol-nguyen-02.json', 'latsol-nguyen-03.json', 'latsol-nguyen-04.json', 'latsol-nguyen-05.json',
  'latsol-nguyen-06.json', 'latsol-nguyen-07.json', 'latsol-nguyen-08.json', 'latsol-nguyen-09.json', 'latsol-nguyen-10.json',
  'latsol-reguler-01.json', 'latsol-reguler-02.json', 'latsol-reguler-03.json', 'latsol-reguler-04.json', 'latsol-reguler-05.json', 'latsol-reguler-06.json',
  'latsol-tambahan-01.json', 'latsol-tambahan-02.json',
  'latsol-hitungan-01.json'
];

const EXPECTED_COUNTS = {
  'latsol-nguyen-01': 40,
  'latsol-nguyen-02': 40,
  'latsol-nguyen-03': 40,
  'latsol-nguyen-04': 40,
  'latsol-nguyen-05': 36,
  'latsol-nguyen-06': 40,
  'latsol-nguyen-07': 39,
  'latsol-nguyen-08': 39,
  'latsol-nguyen-09': 40,
  'latsol-nguyen-10': 41,
  'latsol-reguler-01': 20,
  'latsol-reguler-02': 20,
  'latsol-reguler-03': 20,
  'latsol-reguler-04': 20,
  'latsol-reguler-05': 20,
  'latsol-reguler-06': 20,
  'latsol-tambahan-01': 25,
  'latsol-tambahan-02': 30,
  'latsol-hitungan-01': 11
};

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

function readPngDimensions(filePath) {
  const buf = fs.readFileSync(filePath);
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  return { width, height };
}

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

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function dispatchKey(cdp, sessionId, key, code = '', repeat = false) {
  await cdp.eval(`document.dispatchEvent(new KeyboardEvent('keydown', {
    key: ${JSON.stringify(key)},
    code: ${JSON.stringify(code || key)},
    repeat: ${Boolean(repeat)},
    bubbles: true,
    cancelable: true
  }))`, sessionId);
  await delay(80);
}

async function waitForCondition(cdp, sessionId, expr, timeoutMs = 15000, intervalMs = 100) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const ok = await cdp.eval(expr, sessionId);
      if (ok) return ok;
    } catch {}
    await delay(intervalMs);
  }
  throw new Error(`Timeout waiting for condition: ${expr}`);
}

async function runStaticTests() {
  console.log('--- PART 1: Static Schema, Asset & Kotoba Integrity Validation ---');

  for (const f of LATSOL_FILES) {
    assert.equal(fs.existsSync(path.join(ROOT, 'data', f)), true, `File ${f} must exist in data/`);
  }
  console.log('✓ All 19 JSON package files exist in data/');

  const defaultPackageIds = new Set(DEFAULT_PACKAGES.map(p => p.id));
  for (const f of LATSOL_FILES) {
    const d = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', f), 'utf8'));
    assert.equal(defaultPackageIds.has(d.setId), true, `Package ${d.setId} must be in DEFAULT_PACKAGES`);
    assert.equal(d.setName, DEFAULT_PACKAGES.find(p => p.id === d.setId).name, `Display name must match setName`);
    assert.equal(d.questions.length, EXPECTED_COUNTS[d.setId], `Question count for ${d.setId} must be ${EXPECTED_COUNTS[d.setId]}`);
  }
  console.log('✓ All 19 packages registered with exact setId, setName, and expected question count');

  let totalQuestions = 0;
  let activeQuestions = 0;
  let questionImagesCount = 0;
  let optionImagesCount = 0;
  const seenIds = new Set();
  const optionLetters = ['A', 'B', 'C', 'D'];
  const questionsDir = path.join(ROOT, 'assets/questions');
  const exactAssetFiles = new Set(fs.readdirSync(questionsDir));

  for (const f of LATSOL_FILES) {
    const d = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', f), 'utf8'));
    assert.ok(Array.isArray(d.questions), `Package ${f} questions must be an array`);

    for (const q of d.questions) {
      totalQuestions++;
      assert.ok(!seenIds.has(q.id), `Duplicate question ID detected: ${q.id}`);
      seenIds.add(q.id);

      const errs = validateQuestion(q);
      assert.equal(errs.length, 0, `Validation error in ${q.id}: ${errs.join(', ')}`);
      assert.equal(optionLetters[q.correctIndex], q.correctAnswer, `correctAnswer and correctIndex mismatch in ${q.id}`);
      assert.equal(q.active, true, `Question ${q.id} in repaired dataset must have active: true`);
      activeQuestions++;

      if (q.imageMediaId) {
        questionImagesCount++;
        const m = (q.media || []).find(item => item.id === q.imageMediaId);
        assert.ok(m && m.path, `Question ${q.id} imageMediaId ${q.imageMediaId} must resolve in q.media`);
        const baseName = path.basename(m.path);
        assert.ok(exactAssetFiles.has(baseName), `Asset file ${baseName} must exist with exact case in assets/questions`);
        const dims = readPngDimensions(path.join(questionsDir, baseName));
        assert.ok(!(dims.width === 1240 && dims.height === 1755), `Asset ${baseName} must be cropped (not full-page 1240x1755)`);
      }

      for (const opt of q.options) {
        if (opt.mediaId) {
          optionImagesCount++;
          const m = (q.media || []).find(item => item.id === opt.mediaId);
          assert.ok(m && m.path, `Question ${q.id} option ${opt.id} mediaId ${opt.mediaId} must resolve in q.media`);
          const baseName = path.basename(m.path);
          assert.ok(exactAssetFiles.has(baseName), `Option asset file ${baseName} must exist with exact case in assets/questions`);
          const dims = readPngDimensions(path.join(questionsDir, baseName));
          assert.ok(!(dims.width === 1240 && dims.height === 1755), `Option asset ${baseName} must be cropped`);
        }
      }
    }
  }

  const KATEGORI_2_IDS = new Set([
    'nguyen01-q039', 'nguyen02-q039', 'nguyen02-q040', 'nguyen03-q037', 'nguyen03-q039',
    'nguyen04-q038', 'nguyen04-q039', 'nguyen06-q004', 'nguyen06-q005', 'nguyen06-q032',
    'nguyen06-q038', 'nguyen08-q038', 'nguyen08-q039', 'nguyen09-q038', 'nguyen09-q040',
    'nguyen10-q038', 'nguyen10-q039', 'nguyen10-q040', 'reguler05-q008'
  ]);
  for (const f of LATSOL_FILES) {
    const d = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', f), 'utf8'));
    for (const q of d.questions) {
      if (KATEGORI_2_IDS.has(q.id)) {
        assert.equal(q.imageMediaId, '', `Kategori 2 question ${q.id} must have empty imageMediaId`);
        assert.equal(q.questionImage, '', `Kategori 2 question ${q.id} must have empty questionImage`);
        assert.equal(q.questionImageAlternate, undefined, `Kategori 2 question ${q.id} must not have questionImageAlternate`);
        assert.equal(q.options.filter(o => o.mediaId).length, 3, `Kategori 2 question ${q.id} must keep 3 option mediaIds`);
      }
    }
  }

  assert.equal(totalQuestions, 581, 'Total questions must be exactly 581');
  assert.equal(activeQuestions, 581, 'Active questions in repaired dataset must be 581');
  assert.equal(questionImagesCount, 76, 'Kategori 1 questions with main imageMediaId must be 76');
  assert.equal(optionImagesCount, 57, 'Kategori 2 options with option mediaId must be 57 (19 questions x 3 options)');
  console.log(`✓ 581 questions verified: 581 active, 76 Kategori 1 question illustrations, 57 Kategori 2 option illustrations (0 duplicate composite images, 0 full-page scans)`);

  // Verify context-separated Kotoba (questions vs options A/B/C/D) & U/V alignment
  const extraKotoba = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/kotoba-dan-kategori-tambahan.json'), 'utf8'));
  const km = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/kotobaMapping.json'), 'utf8'));
  const kd = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/sharedKotobaDictionary.json'), 'utf8'));

  assert.ok(extraKotoba.totalEntries >= 581, 'totalEntries must be at least 581');
  assert.ok(Object.keys(extraKotoba.entries).length >= 581, 'entries count must be at least 581');

  let totalPromptTerms = 0;
  let totalOptionTerms = 0;
  let totalOptionsChecked = 0;

  for (const f of LATSOL_FILES) {
    const d = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', f), 'utf8'));
    for (const q of d.questions) {
      const qId = q.id;
      const entry = extraKotoba.entries[qId];
      assert.ok(entry, `extraKotoba.entries[${qId}] must exist`);
      assert.equal(entry.kotobaU.length, entry.kotobaV.length, `kotobaU and kotobaV length must match for ${qId}`);
      assert.ok(entry.kotobaU.length > 0, `kotobaU for ${qId} must not be empty`);

      const pIds = km.questions[qId];
      assert.ok(Array.isArray(pIds) && pIds.length > 0, `km.questions[${qId}] must be a non-empty array`);
      for (const id of pIds) {
        const term = kd.terms[id];
        assert.ok(term && term.status === 'verified', `Prompt term ${id} for ${qId} must exist and be verified`);
        assert.ok(term.arti && term.arti.length > 0, `Arti for prompt term ${id} (${term.kanji}) must be non-empty`);
        totalPromptTerms++;
      }

      assert.ok(km.options[qId] && typeof km.options[qId] === 'object', `km.options[${qId}] must exist`);
      for (const opt of q.options) {
        totalOptionsChecked++;
        const oIds = km.options[qId][opt.id];
        const ckIds = km.byCompositeKey[`${qId}::${opt.id}`];
        assert.ok(Array.isArray(oIds) && oIds.length > 0, `km.options[${qId}][${opt.id}] must be a non-empty array`);
        assert.deepEqual(oIds, ckIds, `km.byCompositeKey["${qId}::${opt.id}"] must match km.options[${qId}][${opt.id}]`);
        for (const id of oIds) {
          const term = kd.terms[id];
          assert.ok(term && term.status === 'verified', `Option term ${id} for ${qId}::${opt.id} must exist and be verified`);
          assert.ok(term.arti && term.arti.length > 0, `Arti for option term ${id} (${term.kanji}) must be non-empty`);
          totalOptionTerms++;
        }
      }
    }
  }

  // Verify specific context-separation and completeness on sample questions
  const q32PromptKanji = km.questions['nguyen01-q032'].map(id => kd.terms[id].kanji);
  const q32OptAKanji = km.options['nguyen01-q032']['A'].map(id => kd.terms[id].kanji);
  const q32OptBKanji = km.options['nguyen01-q032']['B'].map(id => kd.terms[id].kanji);
  assert.ok(q32PromptKanji.includes('重い釜') && q32PromptKanji.includes('両手') && q32PromptKanji.includes('腰'), 'nguyen01-q032 prompt must include 重い釜, 両手, 腰');
  assert.ok(!q32PromptKanji.includes('台車'), 'Option-only word 台車 must not leak into nguyen01-q032 prompt Kotoba');
  assert.ok(q32OptAKanji.includes('膝') && q32OptAKanji.includes('曲げて') && q32OptAKanji.includes('立ち上がる'), 'nguyen01-q032 Option A must include 膝, 曲げて, 立ち上がる');
  assert.ok(q32OptBKanji.includes('台車') && q32OptBKanji.includes('運ぶ'), 'nguyen01-q032 Option B must include 台車, 運ぶ');

  const q39OptAKanji = km.options['nguyen01-q039']['A'].map(id => kd.terms[id].kanji);
  const q39OptBKanji = km.options['nguyen01-q039']['B'].map(id => kd.terms[id].kanji);
  const q39OptCKanji = km.options['nguyen01-q039']['C'].map(id => kd.terms[id].kanji);
  assert.ok(q39OptAKanji.includes('手で触れるな'), 'nguyen01-q039 Option A must include sign text 手で触れるな');
  assert.ok(q39OptBKanji.includes('点検中') && q39OptBKanji.includes('スイッチを入れるな'), 'nguyen01-q039 Option B must include sign text 点検中, スイッチを入れるな');
  assert.ok(q39OptCKanji.includes('はさまれ注意'), 'nguyen01-q039 Option C must include sign text はさまれ注意');

  console.log(`✓ Context-separated Kotoba verified across all 581 questions (${totalPromptTerms} prompt terms, ${totalOptionTerms} option terms across ${totalOptionsChecked} options, 0 empty contexts)`);

  // Verify Academic QA corrected answer keys (Tahap B)
  const expectedKeyFixes = [
    { file: 'latsol-nguyen-03.json', id: 'nguyen03-q029', answer: 'C', index: 2 },
    { file: 'latsol-nguyen-09.json', id: 'nguyen09-q029', answer: 'C', index: 2 },
    { file: 'latsol-nguyen-10.json', id: 'nguyen10-q030', answer: 'C', index: 2 },
    { file: 'latsol-reguler-01.json', id: 'reguler01-q007', answer: 'A', index: 0 }
  ];
  for (const fix of expectedKeyFixes) {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', fix.file), 'utf8'));
    const q = pkg.questions.find(item => item.id === fix.id);
    assert.ok(q, `Question ${fix.id} must exist in ${fix.file}`);
    assert.equal(q.correctAnswer, fix.answer, `${fix.id} correctAnswer must be ${fix.answer}`);
    assert.equal(q.correctIndex, fix.index, `${fix.id} correctIndex must be ${fix.index}`);
  }
  console.log('✓ Academic QA answer key corrections verified (nguyen03-q029=C, nguyen09-q029=C, nguyen10-q030=C, reguler01-q007=A)');

  // Service Worker check
  const swContent = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
  assert.ok(/ssw-pm-mock-test-shell-v\d+/.test(swContent), 'sw.js cache must have versioned shell cache');
  for (const f of LATSOL_FILES) {
    assert.ok(swContent.includes(`./data/${f}`), `sw.js must precache ./${f}`);
  }
  assert.ok(swContent.includes('./data/kotoba-dan-kategori-tambahan.json'), 'sw.js must precache kotoba-dan-kategori-tambahan.json');
  console.log(`✓ Service Worker precaches all 19 JSON packages + kotoba metadata under versioned shell cache`);
}

async function runBrowserTests() {
  console.log('\n--- PART 2: Real Browser / CDP Integration & Flow Verification ---');

  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
    const filePath = path.join(ROOT, decodeURIComponent(reqPath.replace(/^\/+/, '')));

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const mime = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': 'no-cache' });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not Found: ' + req.url);
    }
  });

  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`✓ Local test server running on ${baseUrl}`);

  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-19paket-test-'));
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

    await cdp.send('Page.navigate', { url: `${baseUrl}/index.html` }, sessionId);
    await waitForCondition(cdp, sessionId, 'document.readyState === "complete"');
    await waitForCondition(cdp, sessionId, 'window.__APP_BOOTED__ === true && typeof window.ensureAllBuiltinSetsLoaded === "function"', 20000);

    await cdp.eval('window.ensureAllBuiltinSetsLoaded(true)', sessionId);
    await waitForCondition(cdp, sessionId, 'window.state && window.state.questions && window.state.questions.length >= 1580', 20000);

    const questionsCount = await cdp.eval('window.state.questions.length', sessionId);
    console.log(`✓ App booted & seeded: ${questionsCount} total questions in IndexedDB`);

    // 1. Verify all 19 packages appear in getAvailablePackages with 100% active questions
    const available = await cdp.eval('window.getAvailablePackages().map(p => ({ id: p.id, name: p.name, total: p.total, active: p.active }))', sessionId);
    for (const [setId, expectedCount] of Object.entries(EXPECTED_COUNTS)) {
      const found = available.find(p => p.id === setId);
      assert.ok(found, `Package ${setId} must appear in available packages`);
      assert.equal(found.total, expectedCount, `Total questions for ${setId} must be ${expectedCount}`);
      assert.equal(found.active, expectedCount, `Active questions for ${setId} must be ${expectedCount}`);
    }
    console.log(`✓ All 19 packages present in catalog with 100% active questions matching JSON counts`);

    // Helper to start a package in practice or full CBT mode without confirmation modal blocking
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

    // 2. Test Latsol Nguyen 01 (Practice Mode: 40 questions, #32 cropped image + Kotoba U/V, #33-#35, #39 option images A/B/C, #40)
    await startPackageMode('latsol-nguyen-01', 'practice', 40);
    const n01MapBtns = await cdp.eval('document.querySelectorAll(".question-map-item").length', sessionId);
    assert.equal(n01MapBtns, 40, `Nguyen 01 navigator must render 40 buttons (got ${n01MapBtns})`);

    // Move to #32 (index 31)
    await cdp.eval('window.moveExamTo(31)', sessionId);
    await waitForCondition(cdp, sessionId, '(() => { const img = document.querySelector(".question-display-image"); return Boolean(img && img.complete && img.naturalWidth > 0); })()', 10000);
    const q32Img = await cdp.eval('(() => { const img = document.querySelector(".question-display-image"); return { src: img.src, w: img.naturalWidth, h: img.naturalHeight }; })()', sessionId);
    assert.ok(q32Img.src.includes('assets/questions/nguyen01-q032.png'));
    assert.ok(q32Img.w > 0 && q32Img.h < 1000, `nguyen01-q032.png must be cropped illustration (got ${q32Img.w}x${q32Img.h})`);

    // Open Kotoba on #32 via Shortcut V and verify context-separated prompt & option entries
    await dispatchKey(cdp, sessionId, 'v', 'KeyV');
    await waitForCondition(cdp, sessionId, 'document.querySelectorAll(".practice-question-kotoba .practice-kotoba-item").length === 13');
    const q32Kotoba = await cdp.eval(`
      Array.from(document.querySelectorAll(".practice-question-kotoba .practice-kotoba-item")).map(el => ({
        kanji: el.querySelector(".kotoba-ruby")?.childNodes[0]?.textContent || '',
        rt: el.querySelector(".kotoba-ruby rt")?.textContent || '',
        arti: el.querySelector(".kotoba-meaning")?.textContent || ''
      }))
    `, sessionId);
    assert.equal(q32Kotoba[0].kanji, '重い釜');
    assert.equal(q32Kotoba[0].rt, 'おもいかま');
    assert.equal(q32Kotoba[1].kanji, '両手');
    assert.equal(q32Kotoba[1].rt, 'りょうて');
    assert.equal(q32Kotoba[2].kanji, '持ち上げた');
    assert.equal(q32Kotoba[2].rt, 'もちあげた');
    assert.equal(q32Kotoba[10].kanji, '間違っている');
    assert.equal(q32Kotoba[10].rt, 'まちがっている');

    // Open Option A Kotoba on #32 via Shortcut Z and verify Option A's 13 terms
    await dispatchKey(cdp, sessionId, 'z', 'KeyZ');
    await waitForCondition(cdp, sessionId, 'document.querySelectorAll(".practice-option-kotoba .practice-kotoba-item").length === 13');
    console.log(`✓ Nguyen 01 #32 verified: cropped illustration (${q32Img.w}x${q32Img.h}) + 13 prompt Kotoba & 13 Option A Kotoba rendered in context`);

    // Navigate #33 -> #34 -> #35 via Next button
    for (const targetIdx of [32, 33, 34]) {
      await cdp.eval('document.querySelector("[data-action=\\"exam-next\\"]").click()', sessionId);
      await waitForCondition(cdp, sessionId, `window.state.activeSession.currentIndex === ${targetIdx}`);
    }

    // Jump to #39 (index 38) via navigator button click and verify NO duplicate question image + 3 option images A, B, C
    await cdp.eval('document.querySelector(".question-map-item[data-index=\\"38\\"]").click()', sessionId);
    await waitForCondition(cdp, sessionId, 'window.state.activeSession.currentIndex === 38');
    await waitForCondition(cdp, sessionId, '(() => { const imgs = Array.from(document.querySelectorAll(".answer-image")); return imgs.length === 3 && imgs.every(i => i.complete && i.naturalWidth > 0); })()', 10000);
    const q39MainImgCount = await cdp.eval('document.querySelectorAll(".question-display-image").length', sessionId);
    assert.equal(q39MainImgCount, 0, 'Kategori 2 question nguyen01-q039 must NOT render a duplicate composite question image');
    const q39OptImgs = await cdp.eval('Array.from(document.querySelectorAll(".answer-image")).map(i => ({ src: i.src, w: i.naturalWidth, h: i.naturalHeight }))', sessionId);
    assert.equal(q39OptImgs.length, 3);
    assert.ok(q39OptImgs[0].src.includes('nguyen01-q039-option-a.png'));
    assert.ok(q39OptImgs[1].src.includes('nguyen01-q039-option-b.png'));
    assert.ok(q39OptImgs[2].src.includes('nguyen01-q039-option-c.png'));
    console.log(`✓ Nguyen 01 #39 verified: 0 duplicate composite question image + 3 cropped option images (A, B, C) rendered & loaded`);

    // Move to #40 (index 39) via Next button
    await cdp.eval('document.querySelector("[data-action=\\"exam-next\\"]").click()', sessionId);
    await waitForCondition(cdp, sessionId, 'window.state.activeSession.currentIndex === 39');
    console.log(`✓ Nguyen 01 navigator & Next verified through #40`);

    // 3. Test Nguyen 05 (36 questions in CBT Mode, including #34 nguyen05-q034.png & #36)
    await startPackageMode('latsol-nguyen-05', 'full', 36);
    const n05Pool = await cdp.eval('window.state.activeSession.questions.length', sessionId);
    const n05MapBtns = await cdp.eval('document.querySelectorAll(".question-map-item").length', sessionId);
    assert.equal(n05Pool, 36, `Nguyen 05 CBT pool must have all 36 questions (got ${n05Pool})`);
    assert.equal(n05MapBtns, 36, `Nguyen 05 navigator must have 36 buttons`);
    await cdp.eval('document.querySelector(".question-map-item[data-index=\\"33\\"]").click()', sessionId);
    await waitForCondition(cdp, sessionId, 'window.state.activeSession.currentIndex === 33');
    await waitForCondition(cdp, sessionId, '(() => { const img = document.querySelector(".question-display-image"); return Boolean(img && img.complete && img.naturalWidth > 0); })()', 10000);
    await cdp.eval('document.querySelector(".question-map-item[data-index=\\"35\\"]").click()', sessionId);
    await waitForCondition(cdp, sessionId, 'window.state.activeSession.currentIndex === 35');
    console.log(`✓ Nguyen 05 CBT Mode verified: all 36 questions active, #34 image rendered, #36 accessible`);

    // 4. Test Nguyen 07 (39 questions in CBT Mode, #33..#39 accessible)
    await startPackageMode('latsol-nguyen-07', 'full', 39);
    const n07MapBtns = await cdp.eval('document.querySelectorAll(".question-map-item").length', sessionId);
    assert.equal(n07MapBtns, 39, `Nguyen 07 navigator must have 39 buttons`);
    await cdp.eval('document.querySelector(".question-map-item[data-index=\\"38\\"]").click()', sessionId);
    await waitForCondition(cdp, sessionId, 'window.state.activeSession.currentIndex === 38');
    console.log(`✓ Nguyen 07 CBT Mode verified: all 39 questions active, #39 accessible`);

    // 5. Test Nguyen 10 (41 questions in Practice & CBT Mode, #33..#41 accessible)
    await startPackageMode('latsol-nguyen-10', 'full', 41);
    const n10MapBtns = await cdp.eval('document.querySelectorAll(".question-map-item").length', sessionId);
    assert.equal(n10MapBtns, 41, `Nguyen 10 navigator must have 41 buttons`);
    await cdp.eval('document.querySelector(".question-map-item[data-index=\\"40\\"]").click()', sessionId);
    await waitForCondition(cdp, sessionId, 'window.state.activeSession.currentIndex === 40');
    console.log(`✓ Nguyen 10 CBT Mode verified: all 41 questions active, #41 accessible`);

    // 6. Test Tambahan 02 (30 questions, #21 tambahan02-q021.png) & Reguler 05 (#8 with 3 option images A/B/C)
    await startPackageMode('latsol-tambahan-02', 'practice', 30);
    await cdp.eval('document.querySelector(".question-map-item[data-index=\\"20\\"]").click()', sessionId);
    await waitForCondition(cdp, sessionId, 'window.state.activeSession.currentIndex === 20');
    await waitForCondition(cdp, sessionId, '(() => { const qImg = document.querySelector(".question-display-image"); return Boolean(qImg && qImg.complete && qImg.naturalWidth > 0 && qImg.src.includes("tambahan02-q021.png")); })()', 10000);
    console.log(`✓ Tambahan 02 #21 verified: cropped question image (tambahan02-q021.png) rendered & loaded`);

    await startPackageMode('latsol-reguler-05', 'practice', 20);
    await cdp.eval('document.querySelector(".question-map-item[data-index=\\"7\\"]").click()', sessionId);
    await waitForCondition(cdp, sessionId, 'window.state.activeSession.currentIndex === 7');
    await waitForCondition(cdp, sessionId, '(() => { const qImgs = document.querySelectorAll(".question-display-image"); const oImgs = Array.from(document.querySelectorAll(".answer-image")); return qImgs.length === 0 && oImgs.length === 3 && oImgs.every(i => i.complete && i.naturalWidth > 0); })()', 10000);
    console.log(`✓ Reguler 05 #8 verified: 0 duplicate composite question image + 3 option images (A, B, C) rendered & loaded`);

    // 7. Test Hitungan 01 (11 questions)
    await startPackageMode('latsol-hitungan-01', 'practice', 11);
    const hitunganPool = await cdp.eval('window.state.activeSession.questions.length', sessionId);
    assert.equal(hitunganPool, 11, `latsol-hitungan-01 pool must have 11 questions`);
    console.log(`✓ Latsol Hitungan 01 verified: 11 questions`);

    // Zero 404s check
    assert.equal(network404s.length, 0, `Detected 404 network errors: ${network404s.join(', ')}`);
    console.log('✓ Zero HTTP 404 asset errors detected');

    // Zero critical console errors
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
  console.log('TEST SUITE: INTEGRATION OF 19 SSW PM QUESTION PACKAGES');
  console.log('================================================================');
  await runStaticTests();
  await runBrowserTests();
  console.log('\n================================================================');
  console.log('ALL 19 PACKAGES INTEGRATION TESTS PASSED (100%)!');
  console.log('================================================================\n');
}

main().catch(err => {
  console.error('\n❌ Test Suite Failed:', err);
  process.exit(1);
});
