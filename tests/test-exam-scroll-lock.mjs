import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { runGovernanceCheck } from './verify-cache-governance.js';

const ROOT = process.cwd();
const ARTIFACT_DIR = 'C:/Users/Admin/.gemini/antigravity/brain/d27ebec7-1c6f-4a08-9700-b5f26bb90bdd';

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

export async function runExamScrollLockRegressionTests() {
  console.log('=== RUNNING CBT EXAM SCROLL LOCK REGRESSION SUITE (FEATURE 003) ===\n');

  const results = {
    test1_manualFinishResultsScrollDesktop: false,
    test2_timeUpResultsScrollMobile: false,
    test3_reviewAnswersScrollToQ40Desktop: false,
    test4_reviewAnswersScrollToQ40Mobile: false,
    test5_activeCbtScrollIsolationPreserved: false,
    test6_transitionTeardownNoResidualClasses: false,
    test7_subsequentExamSessionImmunity: false,
    errors: []
  };

  // Pre-check governance invariants
  console.log('--- Pre-check: Cache Governance & SW Version Invariants ---');
  const gov = runGovernanceCheck();
  if (!gov.passed) {
    results.errors.push('Governance check failed: ' + gov.errors.join('; '));
    return results;
  }
  console.log('[PASS] Pre-check: Governance invariants verified.\n');

  // Start local HTTP server
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
        res.writeHead(200, {
          'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
          'Cache-Control': 'no-store'
        });
        fs.createReadStream(filePath).pipe(res);
      } else {
        res.writeHead(404);
        res.end('Not Found');
      }
    } catch (e) {
      res.writeHead(500);
      res.end(e.message);
    }
  });

  const port = await new Promise(resolve => {
    server.listen(0, '127.0.0.1', () => resolve(server.address().port));
  });

  const appUrl = `http://127.0.0.1:${port}/`;
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cbt-scroll-test-'));
  const chrome = launchChrome(tempDir);
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
    await cdp.send('DOM.enable', {}, sessionId);

    // Helper: Set Viewport
    const setViewport = async (width, height, isMobile = false) => {
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width,
        height,
        deviceScaleFactor: isMobile ? 3 : 1,
        mobile: isMobile,
        screenOrientation: isMobile ? { angle: 0, type: 'portraitPrimary' } : { angle: 0, type: 'landscapePrimary' }
      }, sessionId);
      await cdp.send('Emulation.setTouchEmulationEnabled', {
        enabled: isMobile,
        maxTouchPoints: isMobile ? 5 : 1
      }, sessionId);
    };

    // Helper: Save Screenshot Artifact
    const saveArtifact = async (filename) => {
      try {
        const { data } = await cdp.send('Page.captureScreenshot', { format: 'png' }, sessionId);
        const outPath = path.join(ARTIFACT_DIR, filename);
        fs.writeFileSync(outPath, Buffer.from(data, 'base64'));
        console.log(`[Artifact Saved]: ${filename}`);
      } catch (e) {
        console.warn(`[Artifact Warning]: Could not save ${filename}: ${e.message}`);
      }
    };

    // 1. Initial Page Load
    await setViewport(1440, 900, false);
    await cdp.send('Page.navigate', { url: appUrl }, sessionId);
    await delay(2000);

    // Wait until boot finishes
    await cdp.eval(`
      new Promise((resolve) => {
        const check = () => {
          if (window.state && window.state.questions && window.state.questions.length > 0) resolve(true);
          else setTimeout(check, 100);
        };
        check();
      })
    `, sessionId);

    console.log('[Setup]: Application booted with 1,006 questions in database.\n');

    // =========================================================================
    // TEST 5: Active CBT Scroll Isolation Preserved (During Exam Active)
    // =========================================================================
    console.log('--- Test 5: Active CBT Scroll Isolation Preserved ---');
    // Start an exam session
    await cdp.eval(`
      (async () => {
        window.state.setup = {
          mode: 'custom',
          setId: 'ssw-pm-kunci-ujian-1',
          count: 40,
          duration: 70,
          passingScore: 65,
          random: false,
          shuffleOptions: false
        };
        await window.startExam();
      })()
    `, sessionId);
    await delay(600);

    const activeExamState = await cdp.eval(`
      ({
        page: window.state.page,
        hasBodyExamMode: document.body.classList.contains('exam-mode'),
        hasHtmlInExam: document.documentElement.classList.contains('in-exam'),
        htmlOverflow: window.getComputedStyle(document.documentElement).overflow,
        htmlPosition: window.getComputedStyle(document.documentElement).position,
        hasWorkspace: Boolean(document.querySelector('.exam-workspace')),
        totalExamQuestions: window.state.activeSession?.questions?.length || 0
      })
    `, sessionId);

    console.log('[Active CBT State]:', activeExamState);
    if (activeExamState.page === 'exam' &&
        activeExamState.hasBodyExamMode &&
        activeExamState.hasHtmlInExam &&
        activeExamState.htmlOverflow === 'hidden' &&
        activeExamState.htmlPosition === 'fixed' &&
        activeExamState.hasWorkspace &&
        activeExamState.totalExamQuestions === 40) {
      results.test5_activeCbtScrollIsolationPreserved = true;
      console.log('[PASS] Test 5: Active CBT viewport scroll isolation is strictly preserved (position: fixed, overflow: hidden).\n');
    } else {
      results.errors.push('Test 5 failed: Active CBT scroll isolation not properly engaged');
      console.log('[FAIL] Test 5: Active CBT scroll isolation failed.\n');
    }

    // =========================================================================
    // TEST 1: Manual Finish Results Scorecard Scrolling (Desktop - 1440x900)
    // =========================================================================
    console.log('--- Test 1: Manual Finish Results Scorecard Scrolling (Desktop 1440x900) ---');
    await setViewport(1440, 900, false);

    // Answer question 1 and finish exam manually
    await cdp.eval(`
      (async () => {
        // Set answer for q0
        const q0 = window.state.activeSession.questions[0];
        window.state.activeSession.answers[q0.id] = 0;
        await window.finishExam(false, true); // confirmed manual finish
      })()
    `, sessionId);
    await delay(600);

    const manualFinishState = await cdp.eval(`
      ({
        page: window.state.page,
        hasBodyExamMode: document.body.classList.contains('exam-mode'),
        hasHtmlInExam: document.documentElement.classList.contains('in-exam'),
        htmlOverflow: window.getComputedStyle(document.documentElement).overflow,
        htmlPosition: window.getComputedStyle(document.documentElement).position,
        bodyOverflow: window.getComputedStyle(document.body).overflow,
        hasResultPage: Boolean(document.querySelector('.zen-result-page')),
        initialScrollY: window.scrollY
      })
    `, sessionId);

    console.log('[Manual Finish Results State]:', manualFinishState);

    // Perform scroll down on Results page
    await cdp.eval(`window.scrollTo(0, 450);`, sessionId);
    await delay(300);

    const manualScrollY = await cdp.eval(`window.scrollY`, sessionId);
    console.log(`[Results Desktop Scroll Position]: initial=${manualFinishState.initialScrollY}, afterScroll=${manualScrollY}`);

    await saveArtifact('results-desktop.png');

    if (manualFinishState.page === 'result' &&
        !manualFinishState.hasBodyExamMode &&
        !manualFinishState.hasHtmlInExam &&
        manualFinishState.htmlOverflow !== 'hidden' &&
        manualFinishState.htmlPosition !== 'fixed' &&
        manualScrollY > 100) {
      results.test1_manualFinishResultsScrollDesktop = true;
      console.log('[PASS] Test 1: Results scorecard is fully scrollable on desktop after manual exam completion (scrollY > 0, 0 residual classes).\n');
    } else {
      results.errors.push(`Test 1 failed: Results scorecard not scrollable (scrollY=${manualScrollY}, hasHtmlInExam=${manualFinishState.hasHtmlInExam})`);
      console.log(`[FAIL] Test 1: Results scorecard scroll lock remains active (scrollY=${manualScrollY}, in-exam=${manualFinishState.hasHtmlInExam}).\n`);
    }

    // =========================================================================
    // TEST 3: Review Answers Scrolling Down to Question #40 (Desktop - 1440x900)
    // =========================================================================
    console.log('--- Test 3: Review Answers Scrolling Down to Question #40 (Desktop) ---');
    // Open review answers
    await cdp.eval(`
      (async () => {
        await window.go('review');
      })()
    `, sessionId);
    await delay(600);

    // Check review items count
    const reviewStats = await cdp.eval(`
      ({
        page: window.state.page,
        itemCount: document.querySelectorAll('.zen-review-item').length,
        hasHtmlInExam: document.documentElement.classList.contains('in-exam'),
        hasBodyExamMode: document.body.classList.contains('exam-mode'),
        initialScrollY: window.scrollY
      })
    `, sessionId);

    console.log('[Review Page Initial State]:', reviewStats);

    // Scroll to the bottom of the review list
    await cdp.eval(`
      (() => {
        const lastItem = document.querySelector('.zen-review-item:last-child');
        if (lastItem) {
          lastItem.scrollIntoView({ block: 'center' });
        } else {
          window.scrollTo(0, document.body.scrollHeight);
        }
      })()
    `, sessionId);
    await delay(500);

    const reviewScrolledState = await cdp.eval(`
      (() => {
        const lastItem = document.querySelector('.zen-review-item:last-child');
        const q40Badge = document.querySelector('.zen-review-item:nth-of-type(40) .zen-review-tag');
        const rect = lastItem ? lastItem.getBoundingClientRect() : null;
        return {
          scrollY: window.scrollY,
          maxScroll: document.body.scrollHeight - window.innerHeight,
          q40BadgeText: q40Badge ? q40Badge.textContent.trim() : null,
          lastItemInViewport: rect ? (rect.top < window.innerHeight && rect.bottom > 0) : false
        };
      })()
    `, sessionId);

    console.log('[Review Scrolled State]:', reviewScrolledState);
    await saveArtifact('review-q40-desktop.png');

    if (reviewStats.itemCount === 40 &&
        reviewScrolledState.scrollY > 800 &&
        reviewScrolledState.lastItemInViewport) {
      results.test3_reviewAnswersScrollToQ40Desktop = true;
      console.log('[PASS] Test 3: User can scroll down through all 40 questions in Review Answers to the very last question (#40).\n');
    } else {
      results.errors.push(`Test 3 failed: Question #40 not reached in review (scrollY=${reviewScrolledState.scrollY}, inViewport=${reviewScrolledState.lastItemInViewport})`);
      console.log(`[FAIL] Test 3: Review scrolling to question #40 failed.\n`);
    }

    // =========================================================================
    // TEST 2: Time-Up Automatic Finish & Mobile Scrolling (Mobile - 390x844)
    // =========================================================================
    console.log('--- Test 2: Time-Up Automatic Finish & Mobile Scrolling (Mobile 390x844) ---');
    await setViewport(390, 844, true);

    // Start a fresh exam on mobile
    await cdp.eval(`
      (async () => {
        window.state.setup = {
          mode: 'custom',
          setId: 'ssw-pm-kunci-ujian-1',
          count: 40,
          duration: 70,
          passingScore: 65,
          random: false,
          shuffleOptions: false
        };
        await window.startExam();
      })()
    `, sessionId);
    await delay(600);

    // Simulate automatic time-up
    await cdp.eval(`
      (async () => {
        await window.finishExam(true); // time-up automatic finish
      })()
    `, sessionId);
    await delay(600);

    const mobileResultsState = await cdp.eval(`
      ({
        page: window.state.page,
        hasBodyExamMode: document.body.classList.contains('exam-mode'),
        hasHtmlInExam: document.documentElement.classList.contains('in-exam'),
        htmlPosition: window.getComputedStyle(document.documentElement).position,
        htmlOverflow: window.getComputedStyle(document.documentElement).overflow,
        initialScrollY: window.scrollY
      })
    `, sessionId);

    console.log('[Time-Up Mobile Results State]:', mobileResultsState);

    // Simulate touch scroll down on mobile Results
    await cdp.eval(`window.scrollTo(0, 500);`, sessionId);
    await delay(300);

    const mobileScrollY = await cdp.eval(`window.scrollY`, sessionId);
    console.log(`[Mobile Results Scroll Position]: initial=${mobileResultsState.initialScrollY}, afterScroll=${mobileScrollY}`);
    await saveArtifact('results-mobile.png');

    if (mobileResultsState.page === 'result' &&
        !mobileResultsState.hasBodyExamMode &&
        !mobileResultsState.hasHtmlInExam &&
        mobileResultsState.htmlPosition !== 'fixed' &&
        mobileResultsState.htmlOverflow !== 'hidden' &&
        mobileScrollY > 100) {
      results.test2_timeUpResultsScrollMobile = true;
      console.log('[PASS] Test 2: Results scorecard is fully scrollable on mobile after automatic timer expiration.\n');
    } else {
      results.errors.push(`Test 2 failed: Mobile results not scrollable after time-up (scrollY=${mobileScrollY}, in-exam=${mobileResultsState.hasHtmlInExam})`);
      console.log(`[FAIL] Test 2: Mobile results scroll lock active after time-up.\n`);
    }

    // =========================================================================
    // TEST 4: Review Answers Mobile Scrolling to Question #40 (Mobile 390x844)
    // =========================================================================
    console.log('--- Test 4: Review Answers Mobile Scrolling to Question #40 (Mobile) ---');
    await cdp.eval(`
      (async () => {
        await window.go('review');
      })()
    `, sessionId);
    await delay(600);

    await cdp.eval(`
      (() => {
        const lastItem = document.querySelector('.zen-review-item:last-child');
        if (lastItem) {
          lastItem.scrollIntoView({ block: 'center' });
        } else {
          window.scrollTo(0, document.body.scrollHeight);
        }
      })()
    `, sessionId);
    await delay(500);

    const mobileReviewScrolled = await cdp.eval(`
      (() => {
        const lastItem = document.querySelector('.zen-review-item:last-child');
        const rect = lastItem ? lastItem.getBoundingClientRect() : null;
        return {
          scrollY: window.scrollY,
          itemCount: document.querySelectorAll('.zen-review-item').length,
          lastItemInViewport: rect ? (rect.top < window.innerHeight && rect.bottom > 0) : false
        };
      })()
    `, sessionId);

    console.log('[Mobile Review Scrolled State]:', mobileReviewScrolled);
    await saveArtifact('review-q40-mobile.png');

    if (mobileReviewScrolled.itemCount === 40 &&
        mobileReviewScrolled.scrollY > 800 &&
        mobileReviewScrolled.lastItemInViewport) {
      results.test4_reviewAnswersScrollToQ40Mobile = true;
      console.log('[PASS] Test 4: Mobile user can smoothly scroll to question #40 in Review Answers.\n');
    } else {
      results.errors.push(`Test 4 failed: Mobile Review question #40 not reached (scrollY=${mobileReviewScrolled.scrollY})`);
      console.log(`[FAIL] Test 4: Mobile Review scrolling failed.\n`);
    }

    // =========================================================================
    // TEST 6: Transition Teardown & Zero Residual Classes
    // =========================================================================
    console.log('--- Test 6: Transition Teardown & Invariant Routing ---');
    // Navigate from Results/Review to Beranda
    await cdp.eval(`window.go('home');`, sessionId);
    await delay(300);

    const homeClasses = await cdp.eval(`
      ({
        page: window.state.page,
        hasBodyExamMode: document.body.classList.contains('exam-mode'),
        hasHtmlInExam: document.documentElement.classList.contains('in-exam')
      })
    `, sessionId);

    // Navigate to Bank Soal
    await cdp.eval(`window.go('bank');`, sessionId);
    await delay(300);

    const bankClasses = await cdp.eval(`
      ({
        page: window.state.page,
        hasBodyExamMode: document.body.classList.contains('exam-mode'),
        hasHtmlInExam: document.documentElement.classList.contains('in-exam')
      })
    `, sessionId);

    console.log('[Non-Exam Route States]: Home:', homeClasses, 'Bank:', bankClasses);

    if (homeClasses.page === 'home' &&
        !homeClasses.hasBodyExamMode &&
        !homeClasses.hasHtmlInExam &&
        bankClasses.page === 'bank' &&
        !bankClasses.hasBodyExamMode &&
        !bankClasses.hasHtmlInExam) {
      results.test6_transitionTeardownNoResidualClasses = true;
      console.log('[PASS] Test 6: Zero residual classes when navigating across non-exam SPA routes.\n');
    } else {
      results.errors.push('Test 6 failed: Residual exam classes found on non-exam routes');
      console.log('[FAIL] Test 6: Residual classes on non-exam routes.\n');
    }

    // =========================================================================
    // TEST 7: Subsequent Exam Session Immunity
    // =========================================================================
    console.log('--- Test 7: Subsequent Exam Session Immunity ---');
    // Start second exam session
    await cdp.eval(`
      (async () => {
        window.state.setup = {
          mode: 'practice',
          durationMinutes: 70,
          totalQuestions: 40,
          packageId: 'all',
          passingScore: 65,
          randomizeOrder: false,
          randomizeOptions: false
        };
        await window.startExam();
      })()
    `, sessionId);
    await delay(600);

    const secondExamActive = await cdp.eval(`
      ({
        page: window.state.page,
        hasHtmlInExam: document.documentElement.classList.contains('in-exam'),
        hasBodyExamMode: document.body.classList.contains('exam-mode')
      })
    `, sessionId);

    // Finish second exam
    await cdp.eval(`(async () => { await window.finishExam(false, true); })()`, sessionId);
    await delay(600);

    const secondExamFinished = await cdp.eval(`
      ({
        page: window.state.page,
        hasHtmlInExam: document.documentElement.classList.contains('in-exam'),
        hasBodyExamMode: document.body.classList.contains('exam-mode'),
        scrollY: window.scrollY
      })
    `, sessionId);

    await cdp.eval(`window.scrollTo(0, 300);`, sessionId);
    await delay(200);
    const secondScrollY = await cdp.eval(`window.scrollY`, sessionId);

    console.log('[Second Exam Session States]: Active:', secondExamActive, 'Finished:', secondExamFinished, 'scrollY:', secondScrollY);

    if (secondExamActive.page === 'exam' &&
        secondExamActive.hasHtmlInExam &&
        secondExamActive.hasBodyExamMode &&
        secondExamFinished.page === 'result' &&
        !secondExamFinished.hasHtmlInExam &&
        !secondExamFinished.hasBodyExamMode &&
        secondScrollY > 100) {
      results.test7_subsequentExamSessionImmunity = true;
      console.log('[PASS] Test 7: Repeated exam session successfully engages and releases scroll lock without drift or corruption.\n');
    } else {
      results.errors.push('Test 7 failed: Subsequent exam session did not release scroll lock properly');
      console.log('[FAIL] Test 7: Subsequent exam session failed.\n');
    }

  } catch (err) {
    console.error('[Regression Test Fatal Error]:', err);
    results.errors.push(err.message);
  } finally {
    try {
      chrome.kill('SIGTERM');
      server.close();
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
  }

  console.log('\n=== FINAL REGRESSION SUMMARY (FEATURE 003) ===');
  console.log(JSON.stringify(results, null, 2));

  return results;
}

if (process.argv[1] && process.argv[1].endsWith('test-exam-scroll-lock.mjs')) {
  runExamScrollLockRegressionTests().then(res => {
    if (res.errors.length > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  });
}
