import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { validateQuestion, rawStats } from '../../utils.js';
import {
  isValidHiraganaReading,
  extractQuestionPlainText,
  extractOptionPlainText,
  extractOptionId,
} from '../../scripts/lib/kotoba-pipeline-utils.mjs';

const ROOT = process.cwd();
const VALIDATED_DIR = path.join(ROOT, 'deliverables/pilot-otaff51-01/validated');
const REPORTS_DIR = path.join(VALIDATED_DIR, 'reports');
fs.mkdirSync(REPORTS_DIR, { recursive: true });

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

function readPngDimensions(filePath) {
  const buf = fs.readFileSync(filePath);
  assert.equal(buf.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', `${path.basename(filePath)} must have valid PNG magic bytes`);
  return {
    width: buf.readUInt32BE(16),
    height: buf.readUInt32BE(20),
    bytes: buf.length,
  };
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
  const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
  return spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${userDataDir}`,
    '--remote-debugging-pipe',
    'about:blank',
  ], {
    stdio: ['ignore', 'pipe', 'pipe', 'pipe', 'pipe'],
  });
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

async function waitForCondition(cdp, sessionId, expr, timeoutMs = 15000, intervalMs = 100) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const ok = await cdp.eval(`Boolean(${expr})`, sessionId);
    if (ok) return true;
    await delay(intervalMs);
  }
  throw new Error(`Timeout waiting for condition: ${expr}`);
}

async function runStaticValidation() {
  console.log('--- PART 1: Static Schema, Kotoba, PNG & Scoring Validation ---');

  const pilot = JSON.parse(fs.readFileSync(path.join(VALIDATED_DIR, 'data/pilot-otaff51-01.json'), 'utf8'));
  const dictDelta = JSON.parse(fs.readFileSync(path.join(VALIDATED_DIR, 'data/sharedKotobaDictionary-delta.json'), 'utf8'));
  const mapDelta = JSON.parse(fs.readFileSync(path.join(VALIDATED_DIR, 'data/kotobaMapping-delta.json'), 'utf8'));
  const ktDelta = JSON.parse(fs.readFileSync(path.join(VALIDATED_DIR, 'data/kotoba-tambahan-delta.json'), 'utf8'));

  const prodDict = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/sharedKotobaDictionary.json'), 'utf8'));

  assert.equal(pilot.setId, 'pilot-otaff51-01');
  assert.equal(pilot.totalQuestions, 5);
  assert.equal(pilot.pointsPerQuestion, 30);
  assert.equal(pilot.maxScore, 150);
  assert.equal(pilot.questions.length, 5);

  const expectedKeys = ['D', 'A', 'B', 'C', 'D'];
  for (let i = 0; i < pilot.questions.length; i++) {
    const q = pilot.questions[i];
    const errs = validateQuestion(q);
    assert.deepEqual(errs, [], `Question ${q.id} failed validateQuestion: ${errs.join(', ')}`);
    assert.equal(q.options.length, 4, `${q.id} must have 4 options`);
    assert.equal(q.correctAnswer, expectedKeys[i], `${q.id} correctAnswer`);
    assert.equal(q.correctIndex, expectedKeys[i].charCodeAt(0) - 65, `${q.id} correctIndex`);
    assert.equal(q.points, 30, `${q.id} points must be 30`);
  }

  // Q001 Option A repair check
  const q1OptA = pilot.questions[0].options[0];
  assert.ok(extractOptionPlainText(q1OptA).includes('食品の衛生管理が十分ではない食品（安全ではない食品）'), 'Q001 Option A must match Bab 1-3.pdf p. 8 verbatim');

  // Q002 7 allergens check
  const q2U = pilot.questions[1].kotobaU.join('\n');
  for (const allergen of ['えび', 'かに', 'くるみ', 'そば', 'ピーナッツ', 'カシューナッツ', 'ピスタチオ']) {
    assert.ok(q2U.includes(allergen), `Q002 kotobaU must include ${allergen}`);
  }

  // PNGs check
  const expectedPngs = [
    'pilot-otaff51-q004.png',
    'pilot-otaff51-q005-option-a.png',
    'pilot-otaff51-q005-option-b.png',
    'pilot-otaff51-q005-option-c.png',
    'pilot-otaff51-q005-option-d.png',
  ];
  for (const fname of expectedPngs) {
    const fpath = path.join(VALIDATED_DIR, 'assets/questions', fname);
    assert.ok(fs.existsSync(fpath), `Missing PNG: ${fname}`);
    const dims = readPngDimensions(fpath);
    assert.ok(dims.width > 0 && dims.height > 0, `Invalid PNG dimensions for ${fname}`);
    console.log(`  PNG ${fname}: ${dims.width}x${dims.height} (${dims.bytes} bytes)`);
  }

  // Kotoba checks
  const prodTermIds = new Set(Object.keys(prodDict.terms || {}));
  const deltaTerms = dictDelta.terms || {};
  assert.equal(Object.keys(deltaTerms).length, 115, 'Expected 115 dictionary delta terms');
  for (const [id, entry] of Object.entries(deltaTerms)) {
    assert.ok(!prodTermIds.has(id), `TermId collision with prod: ${id}`);
    assert.equal(entry.status, 'verified', `${id} status must be verified`);
    assert.ok(isValidHiraganaReading(entry.furigana), `${id} invalid hiragana furigana: ${entry.furigana}`);
    assert.ok(entry.arti && entry.arti.trim().length > 0, `${id} empty arti`);
  }

  // Dangling + 3-way sync
  for (const q of pilot.questions) {
    const qId = q.id;
    const ktEntry = ktDelta.entries[qId];
    assert.ok(ktEntry, `Missing ktDelta entry for ${qId}`);
    assert.deepEqual(q.kotobaU, ktEntry.kotobaU, `kotobaU mismatch between pilot.json and ktDelta for ${qId}`);
    assert.deepEqual(q.kotobaV, ktEntry.kotobaV, `kotobaV mismatch between pilot.json and ktDelta for ${qId}`);

    const mapQ = mapDelta.questions[qId] || [];
    const mapOpts = mapDelta.options[qId] || {};
    const allIds = new Set(mapQ);
    for (const [optId, ids] of Object.entries(mapOpts)) {
      assert.deepEqual(ids, mapDelta.byCompositeKey[`${qId}::${optId}`], `byCompositeKey mismatch for ${qId}::${optId}`);
      for (const id of ids) allIds.add(id);
    }
    for (const id of allIds) {
      assert.ok(deltaTerms[id] || prodDict.terms[id], `Dangling termId ${id} in ${qId}`);
    }
    assert.equal(allIds.size, q.kotobaU.length, `Unique mapped termIds (${allIds.size}) vs kotobaU (${q.kotobaU.length}) mismatch in ${qId}`);
  }

  // Scoring check via utils.js rawStats
  const mockSession = {
    questions: pilot.questions,
    answers: {
      'pilot-otaff51-q001': 3,
      'pilot-otaff51-q002': 0,
      'pilot-otaff51-q003': 1,
      'pilot-otaff51-q004': 2,
      'pilot-otaff51-q005': 3,
    },
  };
  const stats = rawStats(mockSession);
  assert.equal(stats.correct, 5);
  assert.equal(stats.total, 5);
  assert.equal(stats.maxWeightedScore, 150);
  assert.equal(stats.weightedScore, 150);
  assert.equal(stats.percent, 100);
  console.log('✓ Static Schema, Kotoba (115 terms, 3-way sync, 0 collisions), 5 PNGs, & rawStats (150/150) passed.');

  return { pilot, dictDelta, mapDelta, ktDelta };
}

async function runBrowserValidation({ pilot, dictDelta, mapDelta, ktDelta }) {
  console.log('\n--- PART 2: Isolated Headless Chrome + CDP Live Browser Verification ---');

  // Pre-merge Kotoba files in memory (never touches disk prod files!)
  const prodDict = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/sharedKotobaDictionary.json'), 'utf8'));
  const prodMap = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/kotobaMapping.json'), 'utf8'));
  const prodKt = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/kotoba-dan-kategori-tambahan.json'), 'utf8'));

  const mergedDict = JSON.stringify({
    _meta: prodDict._meta,
    terms: { ...prodDict.terms, ...dictDelta.terms },
  });
  const mergedMap = JSON.stringify({
    _meta: prodMap._meta,
    questions: { ...prodMap.questions, ...mapDelta.questions },
    options: { ...prodMap.options, ...mapDelta.options },
    byCompositeKey: { ...prodMap.byCompositeKey, ...mapDelta.byCompositeKey },
  });
  const mergedKt = JSON.stringify({
    ...prodKt,
    totalEntries: (prodKt.totalEntries || 0) + Object.keys(ktDelta.entries).length,
    entries: { ...prodKt.entries, ...ktDelta.entries },
  });

  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/' || reqPath === '') reqPath = '/index.html';

    // Virtual endpoints for isolated pilot testing
    if (reqPath === '/data/sharedKotobaDictionary.json') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-cache' });
      res.end(mergedDict);
      return;
    }
    if (reqPath === '/data/kotobaMapping.json') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-cache' });
      res.end(mergedMap);
      return;
    }
    if (reqPath === '/data/kotoba-dan-kategori-tambahan.json') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-cache' });
      res.end(mergedKt);
      return;
    }
    if (reqPath.startsWith('/assets/questions/pilot-otaff51-')) {
      const fname = path.basename(reqPath);
      const localPng = path.join(VALIDATED_DIR, 'assets/questions', fname);
      if (fs.existsSync(localPng)) {
        res.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'no-cache' });
        fs.createReadStream(localPng).pipe(res);
        return;
      }
    }

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
  console.log(`✓ Isolated virtual test server running on ${baseUrl}`);

  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-pilot-otaff51-'));
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
    await cdp.send('DOM.enable', {}, sessionId);
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1366, height: 900, deviceScaleFactor: 1, mobile: false }, sessionId);

    await cdp.send('Page.navigate', { url: `${baseUrl}/index.html` }, sessionId);
    await waitForCondition(cdp, sessionId, 'window.__APP_BOOTED__ === true && window.state && Array.isArray(window.state.questions) && window.state.questions.length > 0', 20000);
    console.log('✓ App loaded in headless Chrome');

    // Navigate to Bank Soal tab where #json-set-import-file is rendered
    await cdp.eval('document.querySelector("[data-page=\\"bank\\"]")?.click()', sessionId);
    await waitForCondition(cdp, sessionId, 'Boolean(document.querySelector("#json-set-import-file"))', 10000);

    // Import pilot-otaff51-01.json via real #json-set-import-file input
    const doc = await cdp.send('DOM.getDocument', {}, sessionId);
    const inputNode = await cdp.send('DOM.querySelector', {
      nodeId: doc.root.nodeId,
      selector: '#json-set-import-file',
    }, sessionId);
    assert.ok(inputNode.nodeId > 0, '#json-set-import-file must exist');
    await cdp.send('DOM.setFileInputFiles', {
      nodeId: inputNode.nodeId,
      files: [path.join(VALIDATED_DIR, 'data/pilot-otaff51-01.json')],
    }, sessionId);

    await waitForCondition(cdp, sessionId, 'window.state.questions.filter(q => q.setId === "pilot-otaff51-01").length === 5', 10000);
    console.log('✓ Imported pilot-otaff51-01.json via #json-set-import-file (5 questions loaded)');

    // Start Practice Mode for pilot-otaff51-01 to verify images & Kotoba
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
    const navCount = await cdp.eval('document.querySelectorAll(".question-map-item").length', sessionId);
    assert.equal(navCount, 5, 'Navigator must show 5 questions');

    // Check Q002 Kotoba (newly added allergens)
    await cdp.eval('window.moveExamTo(1)', sessionId);
    await waitForCondition(cdp, sessionId, 'window.state.activeSession.currentIndex === 1');
    await dispatchKey(cdp, sessionId, 'z', 'KeyZ');
    await waitForCondition(cdp, sessionId, 'document.querySelectorAll(".practice-option-kotoba .practice-kotoba-item").length > 0');
    const q2OptAKotobaText = await cdp.eval('document.querySelector(".practice-option-kotoba").innerText', sessionId);
    assert.ok(q2OptAKotobaText.includes('えび') && q2OptAKotobaText.includes('カシューナッツ'), 'Q002 Option A Kotoba must render えび and カシューナッツ');
    console.log('✓ Q002 Option A Kotoba verified in live UI (includes えび & カシューナッツ)');

    // Check Q004 question image
    await cdp.eval('window.moveExamTo(3)', sessionId);
    await waitForCondition(cdp, sessionId, '(() => { const img = document.querySelector(".question-display-image"); return Boolean(img && img.complete && img.naturalWidth > 0); })()');
    const q4Img = await cdp.eval('(() => { const img = document.querySelector(".question-display-image"); return { src: img.src, w: img.naturalWidth, h: img.naturalHeight }; })()', sessionId);
    assert.ok(q4Img.src.includes('pilot-otaff51-q004.png'));
    const ssQ4 = await cdp.send('Page.captureScreenshot', { format: 'png' }, sessionId);
    fs.writeFileSync(path.join(REPORTS_DIR, 'live-q004.png'), Buffer.from(ssQ4.data, 'base64'));
    console.log(`✓ Q004 question image rendered (${q4Img.w}x${q4Img.h}) and screenshot saved`);

    // Check Q005 4 option images & NO duplicate question image
    await cdp.eval('window.moveExamTo(4)', sessionId);
    await waitForCondition(cdp, sessionId, '(() => { const imgs = Array.from(document.querySelectorAll(".answer-image")); return imgs.length === 4 && imgs.every(i => i.complete && i.naturalWidth > 0); })()');
    const q5MainImgs = await cdp.eval('document.querySelectorAll(".question-display-image").length', sessionId);
    assert.equal(q5MainImgs, 0, 'Q005 must NOT render duplicate question-display-image');
    const q5OptImgs = await cdp.eval('Array.from(document.querySelectorAll(".answer-image")).map(i => ({ src: i.src, w: i.naturalWidth, h: i.naturalHeight }))', sessionId);
    assert.equal(q5OptImgs.length, 4);
    const ssQ5 = await cdp.send('Page.captureScreenshot', { format: 'png' }, sessionId);
    fs.writeFileSync(path.join(REPORTS_DIR, 'live-q005.png'), Buffer.from(ssQ5.data, 'base64'));
    console.log(`✓ Q005 4 option images rendered (${q5OptImgs.map(x => `${x.w}x${x.h}`).join(', ')}) and screenshot saved`);

    // Start Exam Mode and answer all 5 correctly -> submit -> verify score 150/150
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
    assert.ok(resultText.includes('150'), 'Exam result screen must display score 150');
    console.log('✓ Exam mode submit verified: score 150 / 150 displayed');

    assert.deepEqual(consoleErrors, [], `Expected 0 console errors, got: ${consoleErrors.join(' | ')}`);
    assert.deepEqual(network404s, [], `Expected 0 network 404s, got: ${network404s.join(' | ')}`);
    console.log('✓ Console errors: 0, Network 404s: 0');
  } finally {
    try { chromeProcess.kill(); } catch {}
    server.close();
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch {}
  }
}

(async () => {
  const data = await runStaticValidation();
  await runBrowserValidation(data);
  console.log('\nALL VALIDATIONS PASSED.');
})();
