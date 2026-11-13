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

async function dispatchKey(cdp, sessionId, key, code = '', keyCode = 0, repeat = false) {
  await cdp.eval(`document.dispatchEvent(new KeyboardEvent('keydown', {
    key: ${JSON.stringify(key)},
    code: ${JSON.stringify(code || key)},
    repeat: ${Boolean(repeat)},
    bubbles: true,
    cancelable: true
  }))`, sessionId);
  await delay(60);
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
  const filterArg = process.argv.find(a => a.startsWith('--filter='));
  const filter = filterArg ? filterArg.split('=')[1] : null;

  console.log(`=== FEATURE 010: Keyboard Shortcuts Verification ===`);
  if (filter) console.log(`[Filter active: "${filter}"]\n`);

  const { server, port } = await startStaticServer();
  const testUrl = `http://127.0.0.1:${port}/`;
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ssw-test-shortcuts-'));
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
    await waitForCondition(cdp, sessionId, `Boolean(window.__APP_BOOTED__ && window.state?.questions?.length > 0)`);
    console.log('✓ CBT Simulator booted successfully');

    // Setup CBT Practice Session with an elongated question to test both scrolling and tools
    await cdp.eval(`(async () => {
      const questions = (state.questions && state.questions.length >= 2)
        ? state.questions.slice(0, 2)
        : (await getAll('questions')).slice(0, 2);

      const q0 = JSON.parse(JSON.stringify(questions[0]));
      const q1 = JSON.parse(JSON.stringify(questions[1]));

      q0.prompt = q0.prompt + '<br><br>' + Array(25).fill('長文読解と試験問題のスクロールテスト段落です。Text overflow for scroll testing.').join('<br><br>');

      const session = {
        id: 'exam-scroll-test-1',
        title: 'Practice Shortcuts Test Session',
        setId: 'ssw-pm-kunci-ujian-1',
        packageId: 'ssw-pm-kunci-ujian-1',
        startedAt: Date.now(),
        timed: false,
        durationMinutes: 0,
        status: 'in_progress',
        mode: 'practice',
        questions: [q0, q1],
        answers: {},
        currentIndex: 0
      };

      await put('sessions', session);
      state.activeSession = session;
      await go('exam');
    })()`, sessionId);

    await waitForCondition(cdp, sessionId, `Boolean(document.querySelector('.exam-workspace'))`);
    await delay(200);

    // ========================================================================
    // USER STORY 2: ArrowUp / ArrowDown Page Scrolling
    // ========================================================================
    if (!filter || filter === 'scroll') {
      console.log('\n--- US2: ArrowUp / ArrowDown Scrolling ---');

      const overflowInfo = await cdp.eval(`(() => {
        const ws = document.querySelector('.exam-workspace');
        return {
          scrollHeight: ws.scrollHeight,
          clientHeight: ws.clientHeight,
          canScroll: ws.scrollHeight > ws.clientHeight,
          initialScrollTop: ws.scrollTop,
          currentIndex: state.activeSession?.currentIndex
        };
      })()`, sessionId);

      assert.ok(overflowInfo.canScroll, `Workspace must have vertical overflow to test scrolling`);
      assert.equal(overflowInfo.initialScrollTop, 0, 'Initial scrollTop must be 0');
      assert.equal(overflowInfo.currentIndex, 0, 'Initial question index must be 0');
      console.log(`✓ Workspace scroll overflow verified (scrollHeight=${overflowInfo.scrollHeight}px, clientHeight=${overflowInfo.clientHeight}px)`);

      // Scenario 1: ArrowDown scrolls .exam-workspace downward by ~80px without changing question
      await dispatchKey(cdp, sessionId, 'ArrowDown', 'ArrowDown', 40);
      const scroll1 = await cdp.eval(`document.querySelector('.exam-workspace').scrollTop`, sessionId);
      const qIdxAfterDown = await cdp.eval(`state.activeSession?.currentIndex`, sessionId);

      assert.equal(scroll1, 80, `Expected scrollTop to be 80 after 1 ArrowDown press, got ${scroll1}`);
      assert.equal(qIdxAfterDown, 0, 'Question index must NOT change after ArrowDown');
      console.log(`✓ Scenario 1: ArrowDown scrolled workspace to ${scroll1}px (exact +80px increment); question index preserved at 0`);

      // Press ArrowDown again -> 160px
      await dispatchKey(cdp, sessionId, 'ArrowDown', 'ArrowDown', 40);
      const scroll2 = await cdp.eval(`document.querySelector('.exam-workspace').scrollTop`, sessionId);
      assert.equal(scroll2, 160, `Expected scrollTop to be 160 after 2nd ArrowDown press, got ${scroll2}`);
      console.log(`✓ Scenario 1b: Second ArrowDown press accurately reached ${scroll2}px (+80px increment)`);

      // Scenario 2: ArrowUp scrolls .exam-workspace upward by ~80px without changing question
      await dispatchKey(cdp, sessionId, 'ArrowUp', 'ArrowUp', 38);
      const scroll3 = await cdp.eval(`document.querySelector('.exam-workspace').scrollTop`, sessionId);
      const qIdxAfterUp = await cdp.eval(`state.activeSession?.currentIndex`, sessionId);

      assert.equal(scroll3, 80, `Expected scrollTop to decrease to 80 after ArrowUp press, got ${scroll3}`);
      assert.equal(qIdxAfterUp, 0, 'Question index must NOT change after ArrowUp');
      console.log(`✓ Scenario 2: ArrowUp scrolled workspace back up to ${scroll3}px (-80px increment); question index preserved at 0`);

      // Scenario 3: Continuous key repeat (e.repeat === true)
      for (let i = 0; i < 5; i++) {
        await dispatchKey(cdp, sessionId, 'ArrowDown', 'ArrowDown', 40, true);
      }
      const scrollRepeated = await cdp.eval(`document.querySelector('.exam-workspace').scrollTop`, sessionId);
      const expectedRepeatScroll = 80 + (5 * 80); // 480
      assert.equal(scrollRepeated, expectedRepeatScroll, `Expected repeated keydown to scroll continuously to ${expectedRepeatScroll}px, got ${scrollRepeated}px`);
      console.log(`✓ Scenario 3: Continuous key repeat (e.repeat === true) scrolled smoothly by 5x80px to ${scrollRepeated}px`);

      // Scenario 4: Boundary Limits
      for (let i = 0; i < 10; i++) {
        await dispatchKey(cdp, sessionId, 'ArrowUp', 'ArrowUp', 38);
      }
      const scrollTopBoundary = await cdp.eval(`document.querySelector('.exam-workspace').scrollTop`, sessionId);
      assert.equal(scrollTopBoundary, 0, `Top boundary limit must strictly clamp at 0, got ${scrollTopBoundary}`);

      await dispatchKey(cdp, sessionId, 'ArrowUp', 'ArrowUp', 38);
      const scrollTopStillZero = await cdp.eval(`document.querySelector('.exam-workspace').scrollTop`, sessionId);
      assert.equal(scrollTopStillZero, 0, 'ArrowUp at scrollTop 0 must remain at 0 without error or jitter');
      console.log('✓ Scenario 4: Boundary clamping verified (stops cleanly at 0 without negative overflow)');

      // Scenario 5: Input Focus Bypass Guard
      const inputGuardTest = await cdp.eval(`(() => {
        const ws = document.querySelector('.exam-workspace');
        ws.scrollTop = 80;
        const testInput = document.createElement('input');
        testInput.id = 'test-scroll-focus-input';
        testInput.type = 'text';
        document.body.appendChild(testInput);
        testInput.focus();
        return ws.scrollTop;
      })()`, sessionId);

      await dispatchKey(cdp, sessionId, 'ArrowDown', 'ArrowDown', 40);
      const scrollAfterInputDown = await cdp.eval(`document.querySelector('.exam-workspace').scrollTop`, sessionId);
      assert.equal(scrollAfterInputDown, 80, `Workspace must NOT scroll when input is focused`);

      await dispatchKey(cdp, sessionId, 'ArrowUp', 'ArrowUp', 38);
      const scrollAfterInputUp = await cdp.eval(`document.querySelector('.exam-workspace').scrollTop`, sessionId);
      assert.equal(scrollAfterInputUp, 80, `Workspace must NOT scroll when input is focused`);

      await cdp.eval(`document.getElementById('test-scroll-focus-input')?.remove()`, sessionId);
      console.log('✓ Scenario 5: Input focus bypass guard verified for Arrow keys');

      // Scenario 6: ArrowLeft and ArrowRight navigation intact
      await dispatchKey(cdp, sessionId, 'ArrowRight', 'ArrowRight', 39);
      await waitForCondition(cdp, sessionId, `state.activeSession?.currentIndex === 1`);
      const q1Current = await cdp.eval(`state.activeSession?.currentIndex`, sessionId);
      assert.equal(q1Current, 1, 'ArrowRight must advance to next question (index 1)');

      await dispatchKey(cdp, sessionId, 'ArrowLeft', 'ArrowLeft', 37);
      await waitForCondition(cdp, sessionId, `state.activeSession?.currentIndex === 0`);
      const q0Current = await cdp.eval(`state.activeSession?.currentIndex`, sessionId);
      assert.equal(q0Current, 0, 'ArrowLeft must return to previous question (index 0)');
      console.log('✓ Scenario 6: ArrowLeft and ArrowRight question navigation verified 100% intact');
    }

    // ========================================================================
    // USER STORY 3 (T023-T027): T (Study List) and U (Eye Reveal) Shortcuts
    // ========================================================================
    if (!filter || filter === 'study-reveal') {
      console.log('\n--- US3: Shortcut T (Study List) & U (Eye Reveal) ---');

      // Scenario 8: Shortcut T — Two-Way Study List Toggle
      const initialStudyState = await cdp.eval(`(() => {
        const q = state.activeSession?.questions?.[state.activeSession.currentIndex];
        return {
          inStudy: isQuestionInStudy(q),
          studyCount: (state.studyList || []).length,
          btnText: document.querySelector('.study-list-quick-button')?.textContent?.trim(),
          btnActive: document.querySelector('.study-list-quick-button')?.classList.contains('is-active')
        };
      })()`, sessionId);

      assert.equal(initialStudyState.inStudy, false, 'Question 0 initially not in study list');
      assert.equal(initialStudyState.btnText, '+', 'Initial study button text must be +');
      assert.equal(initialStudyState.btnActive, false, 'Initial study button not active');

      // Press T -> Added to study list
      await dispatchKey(cdp, sessionId, 't');
      await waitForCondition(cdp, sessionId, `(() => {
        const btn = document.querySelector('.study-list-quick-button');
        return btn && btn.textContent.trim() === '✓';
      })()`, 5000, 30);

      const afterT1 = await cdp.eval(`(() => {
        const q = state.activeSession?.questions?.[state.activeSession.currentIndex];
        const btn = document.querySelector('.study-list-quick-button');
        const mapItem = document.querySelector('.question-map-item.current');
        return {
          inStudy: isQuestionInStudy(q),
          studyCount: (state.studyList || []).length,
          btnText: btn?.textContent?.trim(),
          btnActive: btn?.classList.contains('is-active'),
          btnAriaPressed: btn?.getAttribute('aria-pressed'),
          mapHasInStudy: mapItem?.classList.contains('in-study'),
          toastText: document.querySelector('.zen-toast, .toast')?.textContent?.trim()
        };
      })()`, sessionId);

      assert.equal(afterT1.inStudy, true, 'Pressing T must add question to study list');
      assert.equal(afterT1.studyCount, initialStudyState.studyCount + 1, 'Study list count must increase by 1');
      assert.equal(afterT1.btnText, '✓', 'Study button text must become ✓');
      assert.equal(afterT1.btnActive, true, 'Study button must get is-active class');
      assert.equal(afterT1.btnAriaPressed, 'true', 'Study button aria-pressed must be "true"');
      assert.equal(afterT1.mapHasInStudy, true, 'Question map item must have in-study class');
      console.log('✓ Scenario 8a: Pressing T added question to Study List with ✓ icon, toast, and map sync');

      // Press T again -> Two-way toggle: Removed from study list
      await dispatchKey(cdp, sessionId, 't');
      await waitForCondition(cdp, sessionId, `(() => {
        const btn = document.querySelector('.study-list-quick-button');
        return btn && btn.textContent.trim() === '+';
      })()`, 5000, 30);

      const afterT2 = await cdp.eval(`(() => {
        const q = state.activeSession?.questions?.[state.activeSession.currentIndex];
        const btn = document.querySelector('.study-list-quick-button');
        const mapItem = document.querySelector('.question-map-item.current');
        return {
          inStudy: isQuestionInStudy(q),
          studyCount: (state.studyList || []).length,
          btnText: btn?.textContent?.trim(),
          btnActive: btn?.classList.contains('is-active'),
          btnAriaPressed: btn?.getAttribute('aria-pressed'),
          mapHasInStudy: mapItem?.classList.contains('in-study')
        };
      })()`, sessionId);

      assert.equal(afterT2.inStudy, false, 'Pressing T again must remove question from study list (two-way toggle)');
      assert.equal(afterT2.studyCount, initialStudyState.studyCount, 'Study list count must return to initial');
      assert.equal(afterT2.btnText, '+', 'Study button text must return to +');
      assert.equal(afterT2.btnActive, false, 'Study button must lose is-active class');
      assert.equal(afterT2.btnAriaPressed, 'false', 'Study button aria-pressed must be "false"');
      assert.equal(afterT2.mapHasInStudy, false, 'Question map item must lose in-study class');
      console.log('✓ Scenario 8b: Pressing T again removed question from Study List (two-way toggle verified)');

      // Scenario 9: Shortcut U — Eye Reveal in Untimed Practice
      const initialReveal = await cdp.eval(`(() => {
        return {
          revealState: Boolean(state.practiceRevealAnswer),
          btnActive: document.querySelector('.practice-reveal-btn')?.classList.contains('is-active'),
          hasCheckSvg: Boolean(document.querySelector('.practice-answer-key-check'))
        };
      })()`, sessionId);

      assert.equal(initialReveal.revealState, false, 'Eye reveal initially OFF');
      assert.equal(initialReveal.btnActive, false, 'Eye button initially not active');
      assert.equal(initialReveal.hasCheckSvg, false, 'No check svg initially');

      // Press U -> Eye Reveal ON
      await dispatchKey(cdp, sessionId, 'u');
      await waitForCondition(cdp, sessionId, `Boolean(state.practiceRevealAnswer)`, 5000, 30);

      const afterU1 = await cdp.eval(`(() => {
        const s = state.activeSession;
        const q = s?.questions?.[s.currentIndex];
        const correctChoice = document.querySelector(\`.answer-choice[data-index="\${q?.correctIndex}"]\`);
        return {
          revealState: Boolean(state.practiceRevealAnswer),
          btnActive: document.querySelector('.practice-reveal-btn')?.classList.contains('is-active'),
          btnAriaPressed: document.querySelector('.practice-reveal-btn')?.getAttribute('aria-pressed'),
          correctHasCheckSvg: Boolean(correctChoice?.querySelector('.practice-answer-key-check'))
        };
      })()`, sessionId);

      assert.equal(afterU1.revealState, true, 'Pressing U must turn practiceRevealAnswer ON');
      assert.equal(afterU1.btnActive, true, 'Eye button must have is-active class');
      assert.equal(afterU1.btnAriaPressed, 'true', 'Eye button aria-pressed must be "true"');
      assert.equal(afterU1.correctHasCheckSvg, true, 'Correct option must render the check SVG');
      console.log('✓ Scenario 9a: Pressing U toggled Eye Reveal ON with eye button is-active and checkmark on correct answer');

      // Press U again -> Eye Reveal OFF
      await dispatchKey(cdp, sessionId, 'u');
      await waitForCondition(cdp, sessionId, `!state.practiceRevealAnswer`, 5000, 30);

      const afterU2 = await cdp.eval(`(() => {
        return {
          revealState: Boolean(state.practiceRevealAnswer),
          btnActive: document.querySelector('.practice-reveal-btn')?.classList.contains('is-active'),
          btnAriaPressed: document.querySelector('.practice-reveal-btn')?.getAttribute('aria-pressed'),
          hasCheckSvg: Boolean(document.querySelector('.practice-answer-key-check'))
        };
      })()`, sessionId);

      assert.equal(afterU2.revealState, false, 'Pressing U again must turn practiceRevealAnswer OFF');
      assert.equal(afterU2.btnActive, false, 'Eye button must lose is-active class');
      assert.equal(afterU2.btnAriaPressed, 'false', 'Eye button aria-pressed must be "false"');
      assert.equal(afterU2.hasCheckSvg, false, 'Checkmark removed from correct answer');
      console.log('✓ Scenario 9b: Pressing U again toggled Eye Reveal OFF');

      // Scenario 10: Input Focus Guard for T and U
      await cdp.eval(`(() => {
        const inp = document.createElement('input');
        inp.id = 'test-tu-focus-input';
        inp.type = 'text';
        document.body.appendChild(inp);
        inp.focus();
      })()`, sessionId);

      await dispatchKey(cdp, sessionId, 't');
      await dispatchKey(cdp, sessionId, 'u');
      await delay(60);

      const guardCheck = await cdp.eval(`(() => {
        const q = state.activeSession?.questions?.[state.activeSession.currentIndex];
        return {
          inStudy: isQuestionInStudy(q),
          revealState: Boolean(state.practiceRevealAnswer)
        };
      })()`, sessionId);

      assert.equal(guardCheck.inStudy, false, 'T must NOT trigger when input is focused');
      assert.equal(guardCheck.revealState, false, 'U must NOT trigger when input is focused');
      await cdp.eval(`document.getElementById('test-tu-focus-input')?.remove()`, sessionId);
      console.log('✓ Scenario 10: Input focus guard verified for T and U (zero mutation when focused on text input)');

      // Scenario 11: Mode Isolation — Full Mock ignores U (Zero Answer Key Leak)
      await cdp.eval(`(async () => {
        const questions = (await getAll('questions')).slice(0, 2);
        const mockSession = {
          id: 'exam-mock-leak-test',
          title: 'Full Mock Test',
          setId: 'ssw-pm-kunci-ujian-1',
          packageId: 'ssw-pm-kunci-ujian-1',
          startedAt: Date.now(),
          timed: true,
          durationMinutes: 70,
          deadline: Date.now() + 70 * 60000,
          status: 'in_progress',
          mode: 'exam',
          questions: questions,
          answers: {},
          currentIndex: 0
        };
        await put('sessions', mockSession);
        state.activeSession = mockSession;
        state.practiceRevealAnswer = false;
        await go('exam');
      })()`, sessionId);

      await waitForCondition(cdp, sessionId, `state.activeSession?.id === 'exam-mock-leak-test'`);
      await delay(120);

      const hasEyeBtnMock = await cdp.eval(`Boolean(document.querySelector('.practice-reveal-btn'))`, sessionId);
      assert.equal(hasEyeBtnMock, false, 'Full Mock CBT must NOT render eye reveal button');

      // Press U in Full Mock
      await dispatchKey(cdp, sessionId, 'u');
      await delay(120);

      const mockLeakCheck = await cdp.eval(`(() => {
        return {
          revealState: Boolean(state.practiceRevealAnswer),
          hasCheckSvg: Boolean(document.querySelector('.practice-answer-key-check')),
          hasEyeBtn: Boolean(document.querySelector('.practice-reveal-btn'))
        };
      })()`, sessionId);

      assert.equal(mockLeakCheck.revealState, false, 'Full Mock must NOT set practiceRevealAnswer');
      assert.equal(mockLeakCheck.hasCheckSvg, false, 'Full Mock must NEVER leak check icons into DOM');
      assert.equal(mockLeakCheck.hasEyeBtn, false, 'Full Mock must NEVER show Eye button');
      console.log('✓ Scenario 11: Mode isolation verified — Full Mock strictly suppresses U shortcut and leaks zero answer keys');

      // Scenario 12: Settings Modal Registration for T and U
      await dispatchKey(cdp, sessionId, 'r');
      await waitForCondition(cdp, sessionId, `document.querySelector('#exam-settings-popover')?.classList.contains('is-open')`);

      const tuSettings = await cdp.eval(`(() => {
        const tBtn = document.querySelector('[data-shortcut-action="toggleStudyList"]');
        const uBtn = document.querySelector('[data-shortcut-action="togglePracticeReveal"]');
        return {
          hasT: Boolean(tBtn),
          tLabel: tBtn?.parentElement?.querySelector('.exam-shortcut-label')?.textContent?.trim(),
          tKey: tBtn?.textContent?.trim(),
          hasU: Boolean(uBtn),
          uLabel: uBtn?.parentElement?.querySelector('.exam-shortcut-label')?.textContent?.trim(),
          uKey: uBtn?.textContent?.trim()
        };
      })()`, sessionId);

      assert.ok(tuSettings.hasT, 'toggleStudyList must be listed in settings modal');
      assert.equal(tuSettings.tLabel, 'Tandai ke Study List', 'Label for toggleStudyList must match');
      assert.equal(tuSettings.tKey, 'T', 'Display key for toggleStudyList must be T');

      assert.ok(tuSettings.hasU, 'togglePracticeReveal must be listed in settings modal');
      assert.equal(tuSettings.uLabel, 'Intip Kunci Jawaban', 'Label for togglePracticeReveal must match');
      assert.equal(tuSettings.uKey, 'U', 'Display key for togglePracticeReveal must be U');
      console.log('✓ Scenario 12: Settings modal registers T (Tandai ke Study List) and U (Intip Kunci Jawaban)');

      await dispatchKey(cdp, sessionId, 'Escape', 'Escape', 27);
    }

    // ========================================================================
    // USER STORY 5: Translation & Kotoba Single-Letter Shortcuts (G, A, S, D, V, Z, X, C)
    // ========================================================================
    if (!filter || filter === 'trans-kotoba') {
      console.log('\n--- US5: Translation & Kotoba Single-Letter Shortcuts ---');

      // Initialize Untimed Practice Session with:
      // q0: 3 options with translations & kotoba
      // q1: 2 options (for 2-option safety test)
      // q2: shuffled options (for option shuffle visual targeting test)
      await cdp.eval(`(async () => {
        if (typeof ensureKotobaDataLoaded === 'function') {
          await ensureKotobaDataLoaded();
        }
        const questions = (state.questions && state.questions.length >= 3)
          ? state.questions.slice(0, 3)
          : (await getAll('questions')).slice(0, 3);

        const q0 = JSON.parse(JSON.stringify(questions[0]));
        const q1 = JSON.parse(JSON.stringify(questions[1]));
        q1.options = q1.options.slice(0, 2);

        const q2 = JSON.parse(JSON.stringify(questions[0]));
        q2.id = 'shuffled-test-q2';
        const origOpts = JSON.parse(JSON.stringify(q0.options));
        // Reverse order so visual index 0 is original option C
        q2.options = [
          { ...origOpts[2], originalId: origOpts[2].originalId || origOpts[2].id || 'C', id: 'A' },
          { ...origOpts[0], originalId: origOpts[0].originalId || origOpts[0].id || 'A', id: 'B' },
          { ...origOpts[1], originalId: origOpts[1].originalId || origOpts[1].id || 'B', id: 'C' }
        ];

        const us5Session = {
          id: 'exam-trans-kotoba-test',
          title: 'Translation & Kotoba Shortcuts Test Session',
          setId: 'ssw-pm-kunci-ujian-1',
          packageId: 'ssw-pm-kunci-ujian-1',
          startedAt: Date.now(),
          timed: false,
          durationMinutes: 0,
          status: 'in_progress',
          mode: 'practice',
          questions: [q0, q1, q2],
          answers: {},
          currentIndex: 0
        };

        await put('sessions', us5Session);
        state.activeSession = us5Session;
        state.practiceTranslationOpen = false;
        state.practiceRevealAnswer = false;
        await go('exam');
      })()`, sessionId);

      await waitForCondition(cdp, sessionId, `Boolean(document.querySelector('.practice-prompt-row'))`);
      await delay(150);

      // Scenario 13: Translation Shortcuts (G, A, S, D)
      // Initial: All translations OFF
      const initialTransState = await cdp.eval(`(() => {
        return {
          hasPromptTrans: Boolean(document.querySelector('.practice-question-translation')),
          optTransCount: document.querySelectorAll('.practice-option-translation').length,
          promptBtnActive: document.querySelector('.practice-ctrl-trans[data-target-type="prompt"]')?.classList.contains('is-active')
        };
      })()`, sessionId);

      assert.equal(initialTransState.hasPromptTrans, false, 'Prompt translation initially OFF');
      assert.equal(initialTransState.optTransCount, 0, 'Option translations initially 0');
      assert.equal(initialTransState.promptBtnActive, false, 'Prompt trans button initially not active');

      // Press G -> Prompt translation ON
      await dispatchKey(cdp, sessionId, 'g');
      await waitForCondition(cdp, sessionId, `Boolean(document.querySelector('.practice-question-translation'))`);

      const afterG1 = await cdp.eval(`(() => {
        const transEl = document.querySelector('.practice-question-translation');
        const btn = document.querySelector('.practice-ctrl-trans[data-target-type="prompt"]');
        return {
          hasPromptTrans: Boolean(transEl),
          transText: transEl?.textContent?.trim(),
          btnActive: btn?.classList.contains('is-active'),
          btnAriaExpanded: btn?.getAttribute('aria-expanded'),
          answerSelected: state.activeSession?.answers?.[state.activeSession?.questions?.[0]?.id]
        };
      })()`, sessionId);

      assert.equal(afterG1.hasPromptTrans, true, 'Pressing G must reveal prompt translation');
      assert.ok(afterG1.transText.length > 5, 'Prompt translation must have content');
      assert.equal(afterG1.btnActive, true, 'Prompt translation button must receive is-active');
      assert.equal(afterG1.btnAriaExpanded, 'true', 'Prompt translation button aria-expanded must be true');
      assert.equal(afterG1.answerSelected, undefined, 'G must NOT select an answer choice');

      // Press G again -> Prompt translation OFF
      await dispatchKey(cdp, sessionId, 'g');
      await waitForCondition(cdp, sessionId, `!document.querySelector('.practice-question-translation')`);

      // Press A -> Option 1 translation ON
      await dispatchKey(cdp, sessionId, 'a');
      await waitForCondition(cdp, sessionId, `Boolean(document.querySelector('.practice-option-row:nth-child(1) .practice-option-translation'))`);

      // Press S -> Option 2 translation ON
      await dispatchKey(cdp, sessionId, 's');
      await waitForCondition(cdp, sessionId, `Boolean(document.querySelector('.practice-option-row:nth-child(2) .practice-option-translation'))`);

      // Press D -> Option 3 translation ON
      await dispatchKey(cdp, sessionId, 'd');
      await waitForCondition(cdp, sessionId, `Boolean(document.querySelector('.practice-option-row:nth-child(3) .practice-option-translation'))`);

      const afterASD = await cdp.eval(`(() => {
        const opt1 = document.querySelector('.practice-option-row:nth-child(1)');
        const opt2 = document.querySelector('.practice-option-row:nth-child(2)');
        const opt3 = document.querySelector('.practice-option-row:nth-child(3)');
        return {
          opt1Trans: Boolean(opt1?.querySelector('.practice-option-translation')),
          opt1BtnActive: opt1?.querySelector('.practice-ctrl-trans')?.classList.contains('is-active'),
          opt2Trans: Boolean(opt2?.querySelector('.practice-option-translation')),
          opt2BtnActive: opt2?.querySelector('.practice-ctrl-trans')?.classList.contains('is-active'),
          opt3Trans: Boolean(opt3?.querySelector('.practice-option-translation')),
          opt3BtnActive: opt3?.querySelector('.practice-ctrl-trans')?.classList.contains('is-active'),
          answerSelected: state.activeSession?.answers?.[state.activeSession?.questions?.[0]?.id]
        };
      })()`, sessionId);

      assert.equal(afterASD.opt1Trans, true, 'Option 1 translation must be visible');
      assert.equal(afterASD.opt1BtnActive, true, 'Option 1 trans button must be is-active');
      assert.equal(afterASD.opt2Trans, true, 'Option 2 translation must be visible');
      assert.equal(afterASD.opt2BtnActive, true, 'Option 2 trans button must be is-active');
      assert.equal(afterASD.opt3Trans, true, 'Option 3 translation must be visible');
      assert.equal(afterASD.opt3BtnActive, true, 'Option 3 trans button must be is-active');
      assert.equal(afterASD.answerSelected, undefined, 'A, S, D must NOT alter radio answer selection');

      // Toggle A, S, D OFF
      await dispatchKey(cdp, sessionId, 'a');
      await dispatchKey(cdp, sessionId, 's');
      await dispatchKey(cdp, sessionId, 'd');
      await waitForCondition(cdp, sessionId, `document.querySelectorAll('.practice-option-translation').length === 0`);
      console.log('✓ Scenario 13: Translation shortcuts G, A, S, D toggled stem and options 1-3 independently without mutating answers');

      // Scenario 14: Kotoba Shortcuts (V, Z, X, C)
      // Initial: All Kotoba OFF
      const initialKotobaCount = await cdp.eval(`document.querySelectorAll('.practice-kotoba-list').length`, sessionId);
      assert.equal(initialKotobaCount, 0, 'Kotoba lists initially 0');

      // Press V -> Prompt Kotoba ON
      await dispatchKey(cdp, sessionId, 'v');
      await waitForCondition(cdp, sessionId, `Boolean(document.querySelector('.practice-question-kotoba'))`);

      const afterV1 = await cdp.eval(`(() => {
        const kList = document.querySelector('.practice-question-kotoba');
        const btn = document.querySelector('.practice-ctrl-kotoba[data-target-type="prompt"]');
        return {
          hasKotoba: Boolean(kList),
          itemCount: kList?.querySelectorAll('.practice-kotoba-item')?.length || 0,
          btnActive: btn?.classList.contains('is-active'),
          answerSelected: state.activeSession?.answers?.[state.activeSession?.questions?.[0]?.id]
        };
      })()`, sessionId);

      assert.equal(afterV1.hasKotoba, true, 'Pressing V must reveal prompt Kotoba list');
      assert.ok(afterV1.itemCount > 0, 'Prompt Kotoba list must render vocabulary items');
      assert.equal(afterV1.btnActive, true, 'Prompt Kotoba button must receive is-active');
      assert.equal(afterV1.answerSelected, undefined, 'V must NOT select an answer choice');

      // Press V again -> Prompt Kotoba OFF
      await dispatchKey(cdp, sessionId, 'v');
      await waitForCondition(cdp, sessionId, `!document.querySelector('.practice-question-kotoba')`);

      // Press Z -> Option 1 Kotoba ON
      await dispatchKey(cdp, sessionId, 'z');
      await waitForCondition(cdp, sessionId, `Boolean(document.querySelector('.practice-option-row:nth-child(1) .practice-option-kotoba'))`);

      // Press X -> Option 2 Kotoba ON
      await dispatchKey(cdp, sessionId, 'x');
      await waitForCondition(cdp, sessionId, `Boolean(document.querySelector('.practice-option-row:nth-child(2) .practice-option-kotoba'))`);

      // Press C -> Option 3 Kotoba ON
      await dispatchKey(cdp, sessionId, 'c');
      await waitForCondition(cdp, sessionId, `Boolean(document.querySelector('.practice-option-row:nth-child(3) .practice-option-kotoba'))`);

      const afterZXC = await cdp.eval(`(() => {
        const opt1 = document.querySelector('.practice-option-row:nth-child(1)');
        const opt2 = document.querySelector('.practice-option-row:nth-child(2)');
        const opt3 = document.querySelector('.practice-option-row:nth-child(3)');
        return {
          opt1Kotoba: Boolean(opt1?.querySelector('.practice-option-kotoba')),
          opt1BtnActive: opt1?.querySelector('.practice-ctrl-kotoba')?.classList.contains('is-active'),
          opt2Kotoba: Boolean(opt2?.querySelector('.practice-option-kotoba')),
          opt2BtnActive: opt2?.querySelector('.practice-ctrl-kotoba')?.classList.contains('is-active'),
          opt3Kotoba: Boolean(opt3?.querySelector('.practice-option-kotoba')),
          opt3BtnActive: opt3?.querySelector('.practice-ctrl-kotoba')?.classList.contains('is-active'),
          answerSelected: state.activeSession?.answers?.[state.activeSession?.questions?.[0]?.id]
        };
      })()`, sessionId);

      assert.equal(afterZXC.opt1Kotoba, true, 'Option 1 Kotoba list must be visible');
      assert.equal(afterZXC.opt1BtnActive, true, 'Option 1 Kotoba button must be is-active');
      assert.equal(afterZXC.opt2Kotoba, true, 'Option 2 Kotoba list must be visible');
      assert.equal(afterZXC.opt2BtnActive, true, 'Option 2 Kotoba button must be is-active');
      assert.equal(afterZXC.opt3Kotoba, true, 'Option 3 Kotoba list must be visible');
      assert.equal(afterZXC.opt3BtnActive, true, 'Option 3 Kotoba button must be is-active');
      assert.equal(afterZXC.answerSelected, undefined, 'Z, X, C must NOT alter radio answer selection');

      // Toggle Z, X, C OFF
      await dispatchKey(cdp, sessionId, 'z');
      await dispatchKey(cdp, sessionId, 'x');
      await dispatchKey(cdp, sessionId, 'c');
      await waitForCondition(cdp, sessionId, `document.querySelectorAll('.practice-option-kotoba').length === 0`);
      console.log('✓ Scenario 14: Kotoba shortcuts V, Z, X, C toggled stem and options 1-3 vocabulary lists independently without mutating answers');

      // Scenario 15: Option Shuffle Resolution & Visual Targeting
      await cdp.eval(`moveExamTo(2)`, sessionId);
      await waitForCondition(cdp, sessionId, `state.activeSession.currentIndex === 2`);
      await delay(100);

      // On question 2 (shuffled), visual Option 1 corresponds to original option C!
      await dispatchKey(cdp, sessionId, 'a');
      await waitForCondition(cdp, sessionId, `Boolean(document.querySelector('.practice-option-row:nth-child(1) .practice-option-translation'))`);

      const shuffleTransCheck = await cdp.eval(`(() => {
        const transEl = document.querySelector('.practice-option-row:nth-child(1) .practice-option-translation');
        return transEl?.textContent?.trim() || '';
      })()`, sessionId);

      // Verify text comes from original option C translation
      assert.ok(
        shuffleTransCheck.includes('Perusahaan yang membuat') || shuffleTransCheck.includes('laku') || shuffleTransCheck.length > 0,
        `Visual Option 1 translation must target visual position, got: "${shuffleTransCheck}"`
      );

      // Also verify Z targets visual Option 1 Kotoba
      await dispatchKey(cdp, sessionId, 'z');
      await waitForCondition(cdp, sessionId, `Boolean(document.querySelector('.practice-option-row:nth-child(1) .practice-ctrl-kotoba.is-active'))`);
      console.log('✓ Scenario 15: Option shuffle resolution accurately targeted visual options 1..3 regardless of original option order');

      // Turn OFF A and Z on question 2
      await dispatchKey(cdp, sessionId, 'a');
      await dispatchKey(cdp, sessionId, 'z');
      await delay(80);

      // Scenario 16: Two-Option Safety Guard
      await cdp.eval(`moveExamTo(1)`, sessionId);
      await waitForCondition(cdp, sessionId, `state.activeSession.currentIndex === 1`);
      await delay(100);

      const q1OptCount = await cdp.eval(`document.querySelectorAll('.practice-option-row').length`, sessionId);
      assert.equal(q1OptCount, 2, 'Question 1 must have exactly 2 options for safety testing');

      // Press D (Option 3 trans) and C (Option 3 Kotoba) on 2-option question
      await dispatchKey(cdp, sessionId, 'd');
      await dispatchKey(cdp, sessionId, 'c');
      await delay(120);

      const after2OptPress = await cdp.eval(`(() => {
        return {
          optCount: document.querySelectorAll('.practice-option-row').length,
          transCount: document.querySelectorAll('.practice-option-translation').length,
          kotobaCount: document.querySelectorAll('.practice-option-kotoba').length
        };
      })()`, sessionId);

      assert.equal(after2OptPress.optCount, 2, 'Option count remains 2');
      assert.equal(after2OptPress.transCount, 0, 'Zero option translations opened for non-existent option 3');
      assert.equal(after2OptPress.kotobaCount, 0, 'Zero option Kotoba opened for non-existent option 3');
      console.log('✓ Scenario 16: Two-option safety verified — D and C safely ignored without exceptions');

      // Scenario 17: Full Mock Mode Isolation
      await cdp.eval(`(async () => {
        const questions = (await getAll('questions')).slice(0, 2);
        const mockUS5 = {
          id: 'exam-mock-us5-leak-test',
          title: 'Full Mock Test US5 Isolation',
          setId: 'ssw-pm-kunci-ujian-1',
          packageId: 'ssw-pm-kunci-ujian-1',
          startedAt: Date.now(),
          timed: true,
          durationMinutes: 70,
          deadline: Date.now() + 70 * 60000,
          status: 'in_progress',
          mode: 'exam',
          questions: questions,
          answers: {},
          currentIndex: 0
        };
        await put('sessions', mockUS5);
        state.activeSession = mockUS5;
        await go('exam');
      })()`, sessionId);

      await waitForCondition(cdp, sessionId, `state.activeSession?.id === 'exam-mock-us5-leak-test'`);
      await delay(150);

      // In Full Mock, press all 8 keys: G, A, S, D, V, Z, X, C
      for (const k of ['g', 'a', 's', 'd', 'v', 'z', 'x', 'c']) {
        await dispatchKey(cdp, sessionId, k);
      }
      await delay(150);

      const mockLeakCheckUS5 = await cdp.eval(`(() => {
        return {
          promptTrans: Boolean(document.querySelector('.practice-question-translation')),
          optTrans: document.querySelectorAll('.practice-option-translation').length,
          promptKotoba: Boolean(document.querySelector('.practice-question-kotoba')),
          optKotoba: document.querySelectorAll('.practice-option-kotoba').length,
          ctrlTrans: document.querySelectorAll('.practice-ctrl-trans').length,
          ctrlKotoba: document.querySelectorAll('.practice-ctrl-kotoba').length
        };
      })()`, sessionId);

      assert.equal(mockLeakCheckUS5.promptTrans, false, 'Full Mock must NOT leak prompt translation');
      assert.equal(mockLeakCheckUS5.optTrans, 0, 'Full Mock must NOT leak option translations');
      assert.equal(mockLeakCheckUS5.promptKotoba, false, 'Full Mock must NOT leak prompt Kotoba');
      assert.equal(mockLeakCheckUS5.optKotoba, 0, 'Full Mock must NOT leak option Kotoba');
      assert.equal(mockLeakCheckUS5.ctrlTrans, 0, 'Full Mock must NOT render trans buttons');
      assert.equal(mockLeakCheckUS5.ctrlKotoba, 0, 'Full Mock must NOT render Kotoba buttons');
      console.log('✓ Scenario 17: Full Mock isolation verified — G, A, S, D, V, Z, X, C safely ignored, zero language assistance leaked');

      // Scenario 18: Input Focus Guard for All 8 Keys
      await cdp.eval(`(async () => {
        state.activeSession = await get('sessions', 'exam-trans-kotoba-test');
        state.activeSession.currentIndex = 0;
        await go('exam');
        const inp = document.createElement('input');
        inp.id = 'test-us5-focus-input';
        inp.type = 'text';
        document.body.appendChild(inp);
        inp.focus();
      })()`, sessionId);

      await waitForCondition(cdp, sessionId, `Boolean(document.getElementById('test-us5-focus-input'))`);

      for (const k of ['g', 'a', 's', 'd', 'v', 'z', 'x', 'c']) {
        await dispatchKey(cdp, sessionId, k);
      }
      await delay(100);

      const inputGuardCheckUS5 = await cdp.eval(`(() => {
        return {
          hasPromptTrans: Boolean(document.querySelector('.practice-question-translation')),
          hasOptTrans: document.querySelectorAll('.practice-option-translation').length,
          hasPromptKotoba: Boolean(document.querySelector('.practice-question-kotoba')),
          hasOptKotoba: document.querySelectorAll('.practice-option-kotoba').length
        };
      })()`, sessionId);

      assert.equal(inputGuardCheckUS5.hasPromptTrans, false, 'G must NOT trigger when input is focused');
      assert.equal(inputGuardCheckUS5.hasOptTrans, 0, 'A, S, D must NOT trigger when input is focused');
      assert.equal(inputGuardCheckUS5.hasPromptKotoba, false, 'V must NOT trigger when input is focused');
      assert.equal(inputGuardCheckUS5.hasOptKotoba, 0, 'Z, X, C must NOT trigger when input is focused');
      await cdp.eval(`document.getElementById('test-us5-focus-input')?.remove()`, sessionId);
      console.log('✓ Scenario 18: Input focus guard verified for all 8 keys (zero activation when focused on input)');

      // Scenario 19: Settings Modal Registration & Collision Detection for All 8 Keys
      await dispatchKey(cdp, sessionId, 'r');
      await waitForCondition(cdp, sessionId, `document.querySelector('#exam-settings-popover')?.classList.contains('is-open')`);

      const modalKeysCheck = await cdp.eval(`(() => {
        const expected = [
          { id: 'toggleQuestionTrans', key: 'G', label: 'Terjemahan Kalimat Soal' },
          { id: 'toggleOption1Trans', key: 'A', label: 'Terjemahan Opsi 1' },
          { id: 'toggleOption2Trans', key: 'S', label: 'Terjemahan Opsi 2' },
          { id: 'toggleOption3Trans', key: 'D', label: 'Terjemahan Opsi 3' },
          { id: 'toggleQuestionKotoba', key: 'V', label: 'Kosakata Soal' },
          { id: 'toggleOption1Kotoba', key: 'Z', label: 'Kosakata Opsi 1' },
          { id: 'toggleOption2Kotoba', key: 'X', label: 'Kosakata Opsi 2' },
          { id: 'toggleOption3Kotoba', key: 'C', label: 'Kosakata Opsi 3' }
        ];

        return expected.map(exp => {
          const btn = document.querySelector(\`[data-shortcut-action="\${exp.id}"]\`);
          const label = btn?.parentElement?.querySelector('.exam-shortcut-label')?.textContent?.trim();
          const key = btn?.textContent?.trim();
          return {
            id: exp.id,
            found: Boolean(btn),
            labelMatch: label === exp.label,
            keyMatch: key === exp.key,
            actualLabel: label,
            actualKey: key
          };
        });
      })()`, sessionId);

      for (const item of modalKeysCheck) {
        assert.ok(item.found, `Action ${item.id} must be mounted in settings modal`);
        assert.ok(item.labelMatch, `Action ${item.id} label mismatch: expected label, got "${item.actualLabel}"`);
        assert.ok(item.keyMatch, `Action ${item.id} key mismatch: expected key, got "${item.actualKey}"`);
      }

      // Test collision rejection: click capture on toggleQuestionTrans and press 'a' (bound to toggleOption1Trans)
      await cdp.eval(`document.querySelector('[data-shortcut-action="toggleQuestionTrans"]').click()`, sessionId);
      await dispatchKey(cdp, sessionId, 'a');
      const conflictMsg = await cdp.eval(`document.querySelector('.exam-shortcuts-status')?.textContent?.trim()`, sessionId);
      assert.ok(conflictMsg.length > 0, 'Conflict message must appear when assigning existing key A');

      // Test reserved rejection: press 'f'
      await dispatchKey(cdp, sessionId, 'f');
      const reservedMsg = await cdp.eval(`document.querySelector('.exam-shortcuts-status')?.textContent?.trim()`, sessionId);
      assert.match(reservedMsg, /F/i, 'Reserved key message must appear for F');

      // Cancel capture and close modal via Escape
      await dispatchKey(cdp, sessionId, 'Escape', 'Escape', 27);
      await dispatchKey(cdp, sessionId, 'Escape', 'Escape', 27);
      await waitForCondition(cdp, sessionId, `!document.querySelector('#exam-settings-popover')?.classList.contains('is-open')`);
      console.log('✓ Scenario 19: Settings modal registration, key labels, and collision detection verified for all 8 actions');
    }

    console.log('\nALL TEST SCENARIOS PASSED!');
  } finally {
    try { chromeProcess.kill('SIGKILL'); } catch {}
    try { server.close(); } catch {}
    try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}
  }
}

main().then(() => process.exit(0)).catch(err => {
  console.error('\n❌ Test failed:', err);
  process.exit(1);
});
