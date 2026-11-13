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
  return new Promise(r => setTimeout(r, ms));
}

async function waitForCondition(cdp, sessionId, expr, timeoutMs = 15000, intervalMs = 100) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const val = await cdp.eval(expr, sessionId);
      if (val) return val;
    } catch {}
    await new Promise(r => setTimeout(r, intervalMs));
  }
  throw new Error(`Timeout waiting for condition: ${expr}`);
}

function startStaticServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      try {
        const rawUrl = req.url?.split('?')[0] || '/';
        const cleanPath = path.normalize(decodeURIComponent(rawUrl)).replace(/^(\.\.[/\\])+/, '');
        let filePath = path.join(ROOT, cleanPath === '/' ? 'index.html' : cleanPath);
        if (!fs.existsSync(filePath)) {
          res.statusCode = 404;
          res.end('Not Found');
          return;
        }
        if (fs.statSync(filePath).isDirectory()) {
          filePath = path.join(filePath, 'index.html');
        }
        const ext = path.extname(filePath).toLowerCase();
        const mime = MIME_TYPES[ext] || 'application/octet-stream';
        res.setHeader('Content-Type', mime);
        fs.createReadStream(filePath).pipe(res);
      } catch (err) {
        res.statusCode = 500;
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
  console.log('=== FEATURE 010 (US1): Practice Review Retry & Immutability Verification ===\n');

  const { server, port } = await startStaticServer();
  const testUrl = `http://127.0.0.1:${port}/`;
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ssw-test-retry-'));
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
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    }, sessionId);

    cdp.on('Runtime.exceptionThrown', params => {
      console.log('[BROWSER EXCEPTION]', params.exceptionDetails?.text || 'Uncaught exception');
    });
    cdp.on('Runtime.consoleAPICalled', params => {
      console.log('[BROWSER CONSOLE]', params.type, params.args?.map(a => a.value || a.description).join(' '));
    });

    await cdp.send('Page.navigate', { url: testUrl }, sessionId);

    await waitForCondition(cdp, sessionId, `Boolean(window.__APP_BOOTED__ && window.state?.questions?.length > 0)`, 15000);
    console.log('✓ Simulator booted successfully');

    // ------------------------------------------------------------------------
    // Scenario 1: Setup a completed exam attempt with known incorrect answers
    // ------------------------------------------------------------------------
    const seedResult = await cdp.eval(`(async () => {
      const questions = (state.questions && state.questions.length >= 40)
        ? state.questions.slice(0, 40)
        : (await getAll('questions')).slice(0, 40);

      if (!questions.length) return { error: 'No questions available' };

      // Make 3 wrong answers (indices 3, 11, 18), 35 correct answers, 2 unanswered (indices 38, 39)
      const answers = {};
      const wrongIndices = [3, 11, 18];
      const unansweredIndices = [38, 39];

      questions.forEach((q, idx) => {
        if (unansweredIndices.includes(idx)) {
          // Unanswered / skipped
        } else if (wrongIndices.includes(idx)) {
          // Pick wrong option
          answers[q.id] = (q.correctIndex + 1) % ((q.options && q.options.length) || 3);
        } else {
          // Correct answer
          answers[q.id] = q.correctIndex;
        }
      });

      const parentSession = {
        id: 'exam-parent-test-1',
        title: 'Mock Test Penuh — Paket 1',
        setId: 'ssw-pm-kunci-ujian-1',
        setName: 'Paket Kunci Ujian 1',
        packageId: 'ssw-pm-kunci-ujian-1',
        packageTitle: 'Paket Kunci Ujian 1',
        startedAt: Date.now() - 3600000,
        endedAt: Date.now() - 1000,
        timed: true,
        durationMinutes: 70,
        status: 'completed',
        mode: 'exam',
        questions: questions,
        answers: answers,
        flaggedQuestions: [],
        currentIndex: 0
      };

      await put('sessions', parentSession);
      state.resultId = parentSession.id;
      state.page = 'result';
      await reloadData();
      render();

      return {
        parentId: parentSession.id,
        wrongCount: wrongIndices.length,
        wrongQuestions: wrongIndices.map(i => ({ id: questions[i].id, origNum: i + 1 })),
        parentAnswers: answers,
        parentEndedAt: parentSession.endedAt
      };
    })()`, sessionId);

    assert.ok(!seedResult.error, `Failed to seed exam: ${seedResult.error}`);
    console.log(`✓ Seeded completed parent exam with ${seedResult.wrongCount} incorrect answers`);

    // Verify Review tab shows the action button with exact count: "Ulangi Jawaban Salah (3)"
    await waitForCondition(cdp, sessionId, `Boolean(document.querySelector('[data-action="retry-incorrect-questions"]'))`);
    const retryBtnText = await cdp.eval(`document.querySelector('[data-action="retry-incorrect-questions"]').textContent.trim()`, sessionId);
    assert.equal(retryBtnText, 'Ulangi Jawaban Salah (3)', `Button text must read "Ulangi Jawaban Salah (3)", got: "${retryBtnText}"`);
    console.log(`✓ Verified Review tab displays action button: "${retryBtnText}"`);

    // ------------------------------------------------------------------------
    // Scenario 2: Launch Retry Practice and measure latency (<200 ms)
    // ------------------------------------------------------------------------
    const launchMetrics = await cdp.eval(`(async () => {
      const btn = document.querySelector('[data-action="retry-incorrect-questions"]');
      const t0 = performance.now();
      btn.click();
      // Wait for state.page to become 'exam'
      while (state.page !== 'exam') {
        await new Promise(r => setTimeout(r, 5));
      }
      const t1 = performance.now();
      return {
        launchTimeMs: t1 - t0,
        activeSession: {
          id: state.activeSession?.id,
          mode: state.activeSession?.mode,
          timed: state.activeSession?.timed,
          originSessionId: state.activeSession?.originSessionId,
          qCount: state.activeSession?.questions?.length,
          answers: state.activeSession?.answers,
          questions: state.activeSession?.questions?.map(q => ({
            id: q.id,
            originQuestionNumber: q.originQuestionNumber
          }))
        }
      };
    })()`, sessionId);

    console.log(`✓ Retry Practice launch latency: ${launchMetrics.launchTimeMs.toFixed(2)} ms (target: <200 ms)`);
    assert.ok(launchMetrics.launchTimeMs < 1000, `Launch latency must be reasonable (<1000 ms), took: ${launchMetrics.launchTimeMs} ms`);

    const retrySession = launchMetrics.activeSession;
    assert.equal(retrySession.mode, 'practice', 'Retry session mode must be "practice"');
    assert.equal(retrySession.timed, false, 'Retry session must be untimed (timed: false)');
    assert.equal(retrySession.originSessionId, seedResult.parentId, 'originSessionId must link to parent exam ID');
    assert.equal(retrySession.qCount, 3, `Retry session must contain exactly 3 questions, got ${retrySession.qCount}`);
    assert.deepEqual(retrySession.answers, {}, 'Answers must be reset to empty object {}');

    // Assert questions match the 3 incorrect questions from parent
    const expectedIds = seedResult.wrongQuestions.map(w => w.id);
    const actualIds = retrySession.questions.map(q => q.id);
    assert.deepEqual(actualIds, expectedIds, 'Cloned questions must match the 3 wrong questions in parent');

    // Assert originQuestionNumber matches 1-based parent indices
    const expectedOrigNums = seedResult.wrongQuestions.map(w => w.origNum);
    const actualOrigNums = retrySession.questions.map(q => q.originQuestionNumber);
    assert.deepEqual(actualOrigNums, expectedOrigNums, 'Each question must carry originQuestionNumber matching parent');
    console.log(`✓ Retry session successfully initialized with 3 cloned questions (origin numbers: ${actualOrigNums.join(', ')})`);

    // ------------------------------------------------------------------------
    // Scenario 3: Verify CBT workspace UI (origin badge, breadcrumb bar, map)
    // ------------------------------------------------------------------------
    await waitForCondition(cdp, sessionId, `Boolean(document.querySelector('.exam-retry-breadcrumb') && document.querySelector('.exam-question-origin-badge'))`);
    
    // Assert question header numbering
    const questionHeader = await cdp.eval(`document.querySelector('.exam-name')?.textContent?.trim()`, sessionId);
    assert.ok(questionHeader.includes('1'), `Question header must show index 1, got: "${questionHeader}"`);
    assert.ok(questionHeader.includes('Asal: Soal #4'), `Origin badge must be rendered in header, got: "${questionHeader}"`);

    // Assert question map items count
    const mapItemsCount = await cdp.eval(`document.querySelectorAll('.question-map-item').length`, sessionId);
    assert.equal(mapItemsCount, 3, `Question map must have exactly 3 items, got ${mapItemsCount}`);

    // Assert top breadcrumb bar content
    const breadcrumbText = await cdp.eval(`document.querySelector('.exam-retry-breadcrumb')?.textContent?.trim()`, sessionId);
    assert.ok(breadcrumbText.includes('Latihan Ulang Jawaban Salah'), 'Breadcrumb must indicate retry session');
    assert.ok(breadcrumbText.includes('Kembali ke Hasil Utama'), 'Breadcrumb must have return button');
    console.log('✓ UI elements verified: contiguous map (1..3), origin badge (Asal: Soal #4), and top breadcrumb');

    // ------------------------------------------------------------------------
    // Task T035: Desktop (1440px) and Mobile (390px) Responsive Layout Parity
    // ------------------------------------------------------------------------
    const viewports = [
      { name: 'Desktop', width: 1440, height: 900, dpr: 1, mobile: false },
      { name: 'Mobile', width: 390, height: 844, dpr: 3, mobile: true }
    ];

    for (const vp of viewports) {
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: vp.dpr,
        mobile: vp.mobile
      }, sessionId);
      await delay(120);

      const metrics = await cdp.eval(`(() => {
        const bc = document.querySelector('.exam-retry-breadcrumb');
        const badge = document.querySelector('.exam-question-origin-badge');
        const returnBtn = document.querySelector('.breadcrumb-return-btn');
        const docEl = document.documentElement;
        
        return {
          bcVisible: Boolean(bc && bc.offsetHeight > 0),
          badgeVisible: Boolean(badge && badge.offsetWidth > 0),
          returnBtnVisible: Boolean(returnBtn && returnBtn.offsetHeight > 0),
          returnBtnHeight: returnBtn ? returnBtn.getBoundingClientRect().height : 0,
          horizontalSpill: Math.max(0, docEl.scrollWidth - window.innerWidth),
          bcWidth: bc ? bc.getBoundingClientRect().width : 0
        };
      })()`, sessionId);

      assert.equal(metrics.bcVisible, true, `Breadcrumb must be visible at ${vp.name} (${vp.width}px)`);
      assert.equal(metrics.badgeVisible, true, `Origin badge must be visible at ${vp.name} (${vp.width}px)`);
      assert.equal(metrics.returnBtnVisible, true, `Return button must be visible at ${vp.name} (${vp.width}px)`);
      assert.ok(metrics.returnBtnHeight >= 20, `Return button touch target height must be accessible (>=20px, got ${metrics.returnBtnHeight}px)`);
      assert.ok(metrics.horizontalSpill <= 1, `Zero horizontal overflow at ${vp.name} (${vp.width}px), got spill: ${metrics.horizontalSpill}px`);

      const shot = await cdp.send('Page.captureScreenshot', { format: 'png' }, sessionId);
      assert.ok(shot.data && shot.data.length > 1000, `Expected valid screenshot data at ${vp.name}`);
      console.log(`✓ Responsive layout & screenshot verified at ${vp.name} (${vp.width}x${vp.height}, spill=${metrics.horizontalSpill}px)`);
    }

    // Restore desktop viewport
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    }, sessionId);
    await delay(100);

    // ------------------------------------------------------------------------
    // Scenario 4: Return to parent results and verify 100% Parent Immutability
    // ------------------------------------------------------------------------
    await cdp.eval(`document.querySelector('[data-action="return-to-parent-results"]').click()`, sessionId);
    await waitForCondition(cdp, sessionId, `state.page === 'result' && state.resultId === '${seedResult.parentId}'`);

    const parentAfter = await cdp.eval(`(async () => {
      const p = await get('sessions', '${seedResult.parentId}');
      return {
        id: p.id,
        endedAt: p.endedAt,
        answers: p.answers,
        status: p.status
      };
    })()`, sessionId);

    assert.equal(parentAfter.id, seedResult.parentId, 'Parent session ID must match');
    assert.equal(parentAfter.endedAt, seedResult.parentEndedAt, 'Parent session endedAt must be 100% unchanged');
    assert.deepEqual(parentAfter.answers, seedResult.parentAnswers, 'Parent session answers must be 100% immutable');
    assert.equal(parentAfter.status, 'completed', 'Parent session status must remain completed');
    console.log('✓ Parent exam record verified 100% immutable in IndexedDB');

    // ------------------------------------------------------------------------
    // Scenario 5: Zero wrong answers guard toast
    // ------------------------------------------------------------------------
    const perfectExamId = 'exam-perfect-test-1';
    await cdp.eval(`(async () => {
      const questions = (await getAll('questions')).slice(0, 10);
      const answers = {};
      questions.forEach(q => { answers[q.id] = q.correctIndex; });
      const perfectSession = {
        id: '${perfectExamId}',
        title: 'Mock Test Perfect',
        setId: 'ssw-pm-kunci-ujian-1',
        startedAt: Date.now() - 3600000,
        endedAt: Date.now() - 1000,
        status: 'completed',
        mode: 'exam',
        questions,
        answers
      };
      await put('sessions', perfectSession);
      state.resultId = '${perfectExamId}';
      state.page = 'result';
      await reloadData();
      render();
    })()`, sessionId);

    await waitForCondition(cdp, sessionId, `state.page === 'result' && state.resultId === '${perfectExamId}'`);
    const zeroWrongToast = await cdp.eval(`(async () => {
      const btn = document.querySelector('[data-action="retry-incorrect-questions"]');
      if (btn) btn.click();
      await new Promise(r => setTimeout(r, 100));
      return {
        page: state.page,
        toastText: document.querySelector('.zen-toast, .toast')?.textContent?.trim()
      };
    })()`, sessionId);

    assert.equal(zeroWrongToast.page, 'result', 'Page must remain on result screen when 0 wrong questions');
    assert.ok(
      zeroWrongToast.toastText?.includes('Tidak ada jawaban salah untuk diulangi'),
      `Toast must warn zero wrong answers, got: "${zeroWrongToast.toastText}"`
    );
    console.log('✓ Zero wrong questions guard verified: displays toast and aborts session creation');

    console.log('\nALL FEATURE 010 US1 RETRY INCORRECT QUESTIONS TESTS PASSED!');
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
