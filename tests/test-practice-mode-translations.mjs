/**
 * tests/test-practice-mode-translations.mjs
 * End-to-end regression test suite for Feature 007: Practice Mode Inline Indonesian Translations
 *
 * Verifies:
 * - T016: Browser test harness using Headless Chromium CDP and local static HTTP server
 * - T017: Mode isolation & globe toggle (Practice presence, initial OFF, toggle state, Timed absence)
 * - T018: Inline translation DOM rendering (Prompt & option translations, toggle OFF removal, fallbacks, plain presentation)
 * - T019: Navigation persistence (Next, Prev, Map jumps) & option shuffling invariance (shuffleOptions: true)
 * - T020: Academic integrity (0% leakage), session lifecycle reset, and multi-viewport touch clearance (390px / 1440px)
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert';
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

  async eval(expression, sessionId) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true
    }, sessionId);
    if (res.exceptionDetails) {
      throw new Error(res.exceptionDetails.text || 'Runtime.evaluate exception');
    }
    return res.result ? res.result.value : undefined;
  }
}

function findChromePath() {
  const possiblePaths = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    `${process.env.LOCALAPPDATA}/Google/Chrome/Application/chrome.exe`
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error('Chrome executable not found on host');
}

function startStaticServer() {
  const server = http.createServer((req, res) => {
    const rawUrl = req.url || '/';
    const cleanPath = rawUrl.split('?')[0];
    let filePath = path.join(ROOT, cleanPath === '/' ? 'index.html' : cleanPath);

    if (!fs.existsSync(filePath)) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
      return;
    }

    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
      if (!fs.existsSync(filePath)) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
        return;
      }
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });
    fs.createReadStream(filePath).pipe(res);
  });

  return new Promise(resolve => {
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      resolve({ server, port, origin: `http://127.0.0.1:${port}` });
    });
  });
}

const delay = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  console.log('=== STARTING FEATURE 007 AUTOMATED BROWSER TEST SUITE ===\n');

  let serverInstance = null;
  let chromeProcess = null;
  let userDataDir = null;

  try {
    // ------------------------------------------------------------------------
    // T016: Initialize Test Harness
    // ------------------------------------------------------------------------
    console.log('[T016] Initializing local HTTP server and Headless Chromium CDP...');
    const { server, origin } = await startStaticServer();
    serverInstance = server;

    const chromePath = findChromePath();
    userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-feat007-'));

    chromeProcess = spawn(
      chromePath,
      [
        '--headless=new',
        '--disable-gpu',
        '--no-sandbox',
        '--no-first-run',
        '--no-default-browser-check',
        `--user-data-dir=${userDataDir}`,
        '--remote-debugging-pipe',
        'about:blank'
      ],
      { stdio: ['ignore', 'pipe', 'pipe', 'pipe', 'pipe'] }
    );

    const cdp = new CDPClient(chromeProcess);
    await delay(600);

    const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });

    await cdp.send('Page.enable', {}, sessionId);
    await cdp.send('Runtime.enable', {}, sessionId);

    // Set initial desktop viewport
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    }, sessionId);

    await cdp.send('Page.navigate', { url: `${origin}/index.html` }, sessionId);
    await delay(1200);

    // Wait until question data loads
    await cdp.eval(`
      new Promise((resolve) => {
        const check = () => {
          if (window.state && window.state.questions && window.state.questions.length > 0 && typeof window.startExam === 'function') {
            resolve(true);
          } else {
            setTimeout(check, 100);
          }
        };
        check();
      })
    `, sessionId);

    console.log('[T016 PASS] Harness established and application booted successfully.\n');

    // ------------------------------------------------------------------------
    // T017: Mode Isolation & Globe Toggle State
    // ------------------------------------------------------------------------
    console.log('[T017] Verifying Mode Isolation and Globe Toggle State...');

    // Launch Untimed Practice session
    await cdp.eval(`
      (async () => {
        window.state.setup = {
          mode: 'practice',
          setId: 'ssw-pm-kunci-ujian-1',
          count: 40,
          duration: 70,
          random: false,
          shuffleOptions: false,
          practice: true
        };
        await window.startExam();
      })()
    `, sessionId);
    await delay(500);

    const practiceInitState = await cdp.eval(`
      (function() {
        const btn = document.querySelector('.practice-trans-btn');
        const tools = document.querySelector('.exam-bottom-tools');
        const plusBtn = document.querySelector('.study-list-quick-button');
        const furiBtn = document.querySelector('.furigana-quick-button');
        const promptTrans = document.querySelector('.practice-question-translation');
        const optTrans = document.querySelectorAll('.practice-option-translation');

        return {
          btnExists: Boolean(btn),
          isInsideTools: Boolean(tools && tools.contains(btn)),
          adjacentToPlus: Boolean(plusBtn && plusBtn.nextElementSibling === btn),
          beforeFurigana: Boolean(btn && btn.nextElementSibling === furiBtn),
          ariaExpanded: btn ? btn.getAttribute('aria-expanded') : null,
          ariaPressed: btn ? btn.getAttribute('aria-pressed') : null,
          title: btn ? btn.getAttribute('title') : null,
          isActive: btn ? btn.classList.contains('is-active') : false,
          stateOpen: window.state.practiceTranslationOpen,
          promptTransCount: promptTrans ? 1 : 0,
          optTransCount: optTrans.length
        };
      })()
    `, sessionId);

    assert.strictEqual(practiceInitState.btnExists, true, 'Globe button must exist in untimed Practice');
    assert.strictEqual(practiceInitState.adjacentToPlus, true, 'Globe button must sit immediately adjacent to plus button');
    assert.strictEqual(practiceInitState.beforeFurigana, true, 'Globe button must sit before furigana button');
    assert.strictEqual(practiceInitState.ariaExpanded, 'false', 'Initial aria-expanded must be false');
    assert.strictEqual(practiceInitState.ariaPressed, 'false', 'Initial aria-pressed must be false');
    assert(practiceInitState.title && practiceInitState.title.includes('Tampilkan Terjemahan'), 'Title must prompt to show translation');
    assert.strictEqual(practiceInitState.isActive, false, 'Button must not have is-active initially');
    assert.strictEqual(practiceInitState.stateOpen, false, 'state.practiceTranslationOpen must be false initially');
    assert.strictEqual(practiceInitState.promptTransCount, 0, 'No prompt translation rendered initially');
    assert.strictEqual(practiceInitState.optTransCount, 0, 'No option translations rendered initially');
    console.log('  ✔ Untimed Practice initial state verified (globe present, OFF by default).');

    // Click toggle to turn ON
    await cdp.eval(`document.querySelector('.practice-trans-btn').click();`, sessionId);
    await delay(300);

    const toggleOnState = await cdp.eval(`
      (function() {
        const btn = document.querySelector('.practice-trans-btn');
        return {
          ariaExpanded: btn.getAttribute('aria-expanded'),
          ariaPressed: btn.getAttribute('aria-pressed'),
          title: btn.getAttribute('title'),
          isActive: btn.classList.contains('is-active'),
          stateOpen: window.state.practiceTranslationOpen
        };
      })()
    `, sessionId);

    assert.strictEqual(toggleOnState.stateOpen, true, 'Clicking globe must toggle state to true');
    assert.strictEqual(toggleOnState.isActive, true, 'Globe must have is-active class when ON');
    assert.strictEqual(toggleOnState.ariaExpanded, 'true', 'aria-expanded must be true when ON');
    assert.strictEqual(toggleOnState.ariaPressed, 'true', 'aria-pressed must be true when ON');
    assert(toggleOnState.title.includes('Sembunyikan Terjemahan'), 'Title must prompt to hide translation');
    console.log('  ✔ Clicking globe toggles active state ON.');

    // Click toggle to turn OFF
    await cdp.eval(`document.querySelector('.practice-trans-btn').click();`, sessionId);
    await delay(300);

    const toggleOffState = await cdp.eval(`
      (function() {
        const btn = document.querySelector('.practice-trans-btn');
        return {
          ariaExpanded: btn.getAttribute('aria-expanded'),
          ariaPressed: btn.getAttribute('aria-pressed'),
          title: btn.getAttribute('title'),
          isActive: btn.classList.contains('is-active'),
          stateOpen: window.state.practiceTranslationOpen
        };
      })()
    `, sessionId);

    assert.strictEqual(toggleOffState.stateOpen, false, 'Second click must toggle state back to false');
    assert.strictEqual(toggleOffState.isActive, false, 'is-active must be removed when OFF');
    console.log('  ✔ Clicking globe again toggles active state back to OFF.');

    // Test Full Mock Test mode isolation
    await cdp.eval(`
      (async () => {
        window.state.setup = {
          mode: 'full',
          setId: 'ssw-pm-kunci-ujian-1',
          count: 40,
          duration: 70,
          random: false,
          shuffleOptions: false,
          practice: false
        };
        await window.startExam();
      })()
    `, sessionId);
    await delay(500);

    const fullMockState = await cdp.eval(`
      (function() {
        const btn = document.querySelector('.practice-trans-btn');
        const qTrans = document.querySelector('.practice-question-translation');
        const oTrans = document.querySelector('.practice-option-translation');
        return {
          btnExists: Boolean(btn),
          qTransExists: Boolean(qTrans),
          oTransExists: Boolean(oTrans)
        };
      })()
    `, sessionId);

    assert.strictEqual(fullMockState.btnExists, false, 'Globe button must NEVER exist in Full Mock Test');
    assert.strictEqual(fullMockState.qTransExists, false, 'Question translation must NEVER render in Full Mock Test');
    assert.strictEqual(fullMockState.oTransExists, false, 'Option translation must NEVER render in Full Mock Test');
    console.log('  ✔ Full Mock Test mode isolation verified (strictly absent).');

    // Test Timed Custom Exam mode isolation
    await cdp.eval(`
      (async () => {
        window.state.setup = {
          mode: 'exam',
          setId: 'ssw-pm-kunci-ujian-1',
          count: 40,
          duration: 70,
          random: false,
          shuffleOptions: false,
          practice: false
        };
        await window.startExam();
      })()
    `, sessionId);
    await delay(500);

    const timedExamState = await cdp.eval(`
      (function() {
        return Boolean(document.querySelector('.practice-trans-btn'));
      })()
    `, sessionId);
    assert.strictEqual(timedExamState, false, 'Globe button must NEVER exist in Timed Custom Exam');
    console.log('  ✔ Timed Custom Exam mode isolation verified (strictly absent).');

    console.log('[T017 PASS] Mode isolation and toggle state transitions 100% verified.\n');

    // ------------------------------------------------------------------------
    // T018: Inline Translation DOM Rendering & Fallback
    // ------------------------------------------------------------------------
    console.log('[T018] Verifying Inline Translation DOM Rendering, Styling, & Fallback...');

    // Return to Untimed Practice
    await cdp.eval(`
      (async () => {
        window.state.setup = {
          mode: 'practice',
          setId: 'ssw-pm-kunci-ujian-1',
          count: 40,
          duration: 70,
          random: false,
          shuffleOptions: false,
          practice: true
        };
        await window.startExam();
      })()
    `, sessionId);
    await delay(500);

    // Toggle ON
    await cdp.eval(`document.querySelector('.practice-trans-btn').click();`, sessionId);
    await delay(300);

    const renderAudit = await cdp.eval(`
      (function() {
        const s = window.state.activeSession;
        const q = s.questions[s.currentIndex];
        const qCard = document.querySelector('.question-card');
        const qPrompt = qCard.querySelector('.question-prompt');
        const qTrans = qCard.querySelector('.practice-question-translation');

        const optChoices = document.querySelectorAll('.answer-choice');
        const optionsData = [];

        optChoices.forEach((choice, idx) => {
          const letter = choice.querySelector('.answer-letter').textContent.trim();
          const jpText = choice.querySelector('.answer-text') ? choice.querySelector('.answer-text').textContent.trim() : '';
          const transEl = choice.querySelector('.practice-option-translation');
          const transText = transEl ? transEl.textContent.trim() : null;
          const radio = choice.querySelector('.answer-radio');

          // Check computed styling for plain presentation
          let transStyle = null;
          if (transEl) {
            const cs = window.getComputedStyle(transEl);
            transStyle = {
              display: cs.display,
              fontSize: cs.fontSize,
              color: cs.color,
              marginTop: cs.marginTop
            };
          }

          optionsData.push({
            idx,
            letter,
            jpText,
            transText,
            hasRadio: Boolean(radio),
            transStyle
          });
        });

        const qTransStyle = qTrans ? {
          display: window.getComputedStyle(qTrans).display,
          fontSize: window.getComputedStyle(qTrans).fontSize,
          color: window.getComputedStyle(qTrans).color,
          marginTop: window.getComputedStyle(qTrans).marginTop
        } : null;

        return {
          promptText: qPrompt ? qPrompt.textContent.trim() : '',
          expectedPromptTrans: String(q.promptTranslation || '').trim(),
          actualPromptTrans: qTrans ? qTrans.textContent.trim() : null,
          qTransLang: qTrans ? qTrans.getAttribute('lang') : null,
          qTransDirectlyUnderPrompt: Boolean(qPrompt && qPrompt.nextElementSibling === qTrans),
          qTransStyle,
          optionsCount: optionsData.length,
          optionsData
        };
      })()
    `, sessionId);

    assert(renderAudit.actualPromptTrans, 'Prompt translation must be rendered when toggle is ON');
    assert.strictEqual(renderAudit.actualPromptTrans, renderAudit.expectedPromptTrans, 'Prompt translation text must match q.promptTranslation');
    assert.strictEqual(renderAudit.qTransLang, 'id', 'Prompt translation element must have lang="id"');
    assert.strictEqual(renderAudit.qTransDirectlyUnderPrompt, true, 'Prompt translation must sit directly under question-prompt');
    assert.strictEqual(renderAudit.qTransStyle.display, 'block', 'Prompt translation display must be block');
    console.log('  ✔ Question prompt translation accurately rendered beneath Japanese prompt.');

    assert(renderAudit.optionsCount >= 2, 'Question must have options');
    for (const opt of renderAudit.optionsData) {
      assert(opt.transText, `Option ${opt.letter} must have translation rendered`);
      assert.strictEqual(opt.hasRadio, true, `Option ${opt.letter} radio button must remain present and intact`);
      assert.strictEqual(opt.transStyle.display, 'block', `Option translation ${opt.letter} display must be block`);
    }
    console.log('  ✔ Option translations accurately rendered inside each answer-content with block display.');

    // Toggle OFF -> assert clean DOM removal
    await cdp.eval(`document.querySelector('.practice-trans-btn').click();`, sessionId);
    await delay(300);

    const cleanRemovalAudit = await cdp.eval(`
      (function() {
        const qTrans = document.querySelector('.practice-question-translation');
        const oTrans = document.querySelectorAll('.practice-option-translation');
        return {
          qTransCount: qTrans ? 1 : 0,
          oTransCount: oTrans.length
        };
      })()
    `, sessionId);

    assert.strictEqual(cleanRemovalAudit.qTransCount, 0, 'Prompt translation must be cleanly removed on toggle OFF');
    assert.strictEqual(cleanRemovalAudit.oTransCount, 0, 'Option translations must be cleanly removed on toggle OFF');
    console.log('  ✔ Clean DOM removal verified when toggled OFF.');

    // Fallback: Test empty prompt translation and empty option translation
    const fallbackAudit = await cdp.eval(`
      (function() {
        const s = window.state.activeSession;
        const q = s.questions[s.currentIndex];
        // Temporarily clear translations
        const origPromptTrans = q.promptTranslation;
        const origOptTrans = q.options[0].translation;
        q.promptTranslation = '';
        q.options[0].translation = '   ';

        window.state.practiceTranslationOpen = true;
        renderExam();

        const qTrans = document.querySelector('.practice-question-translation');
        const opt0 = document.querySelectorAll('.answer-choice')[0];
        const opt0Trans = opt0 ? opt0.querySelector('.practice-option-translation') : null;

        // Restore
        q.promptTranslation = origPromptTrans;
        q.options[0].translation = origOptTrans;
        renderExam();

        return {
          emptyPromptRendered: Boolean(qTrans),
          emptyOptRendered: Boolean(opt0Trans)
        };
      })()
    `, sessionId);

    assert.strictEqual(fallbackAudit.emptyPromptRendered, false, 'Empty prompt translation must NOT render empty container');
    assert.strictEqual(fallbackAudit.emptyOptRendered, false, 'Whitespace option translation must NOT render empty span');
    console.log('  ✔ Fallback verified (zero empty containers when translation text is absent).');

    console.log('[T018 PASS] Translation DOM rendering, styling, and fallback 100% verified.\n');

    // ------------------------------------------------------------------------
    // T019: Navigation Persistence & Option Shuffling Invariance
    // ------------------------------------------------------------------------
    console.log('[T019] Verifying Navigation Persistence and Option Shuffling Invariance...');

    // Turn translations ON
    await cdp.eval(`
      window.state.practiceTranslationOpen = true;
      renderExam();
    `, sessionId);
    await delay(300);

    // Navigate to Question 2 (Next)
    await cdp.eval(`document.querySelector('[data-action="exam-next"]').click();`, sessionId);
    await delay(300);

    const nextNavCheck = await cdp.eval(`
      (function() {
        const s = window.state.activeSession;
        const q = s.questions[s.currentIndex];
        const btn = document.querySelector('.practice-trans-btn');
        const qTrans = document.querySelector('.practice-question-translation');
        const oTrans = document.querySelectorAll('.practice-option-translation');

        return {
          index: s.currentIndex,
          stateOpen: window.state.practiceTranslationOpen,
          btnIsActive: btn ? btn.classList.contains('is-active') : false,
          qTransMatches: qTrans ? qTrans.textContent.trim() === String(q.promptTranslation || '').trim() : false,
          oTransCount: oTrans.length
        };
      })()
    `, sessionId);

    assert.strictEqual(nextNavCheck.index, 1, 'Should navigate to question index 1');
    assert.strictEqual(nextNavCheck.stateOpen, true, 'Translation state must persist after Next');
    assert.strictEqual(nextNavCheck.btnIsActive, true, 'Globe button must remain active after Next');
    assert.strictEqual(nextNavCheck.qTransMatches, true, 'Question 2 prompt translation must display immediately');
    assert(nextNavCheck.oTransCount >= 2, 'Question 2 option translations must display immediately');
    console.log('  ✔ Navigation persistence verified on "Next".');

    // Navigate back to Question 1 (Prev)
    await cdp.eval(`document.querySelector('[data-action="exam-prev"]').click();`, sessionId);
    await delay(300);

    const prevNavCheck = await cdp.eval(`
      (function() {
        const s = window.state.activeSession;
        return {
          index: s.currentIndex,
          stateOpen: window.state.practiceTranslationOpen,
          hasTrans: Boolean(document.querySelector('.practice-question-translation'))
        };
      })()
    `, sessionId);

    assert.strictEqual(prevNavCheck.index, 0, 'Should navigate back to question index 0');
    assert.strictEqual(prevNavCheck.stateOpen, true, 'Translation state must persist after Prev');
    assert.strictEqual(prevNavCheck.hasTrans, true, 'Translations must remain visible after Prev');
    console.log('  ✔ Navigation persistence verified on "Prev".');

    // Jump to Question 10 (Question Map)
    await cdp.eval(`document.querySelector('.question-map-item[data-index="9"]').click();`, sessionId);
    await delay(300);

    const mapJumpCheck = await cdp.eval(`
      (function() {
        const s = window.state.activeSession;
        return {
          index: s.currentIndex,
          stateOpen: window.state.practiceTranslationOpen,
          hasTrans: Boolean(document.querySelector('.practice-question-translation'))
        };
      })()
    `, sessionId);

    assert.strictEqual(mapJumpCheck.index, 9, 'Should jump to question index 9');
    assert.strictEqual(mapJumpCheck.stateOpen, true, 'Translation state must persist after Map jump');
    assert.strictEqual(mapJumpCheck.hasTrans, true, 'Translations must remain visible after Map jump');
    console.log('  ✔ Navigation persistence verified on Question Map jump.');

    // Test Option Shuffling Invariance
    await cdp.eval(`
      (async () => {
        window.state.setup = {
          mode: 'practice',
          setId: 'ssw-pm-kunci-ujian-1',
          count: 40,
          duration: 70,
          random: false,
          shuffleOptions: true, // Shuffled options!
          practice: true
        };
        await window.startExam();
        window.state.practiceTranslationOpen = true;
        renderExam();
      })()
    `, sessionId);
    await delay(500);

    const shuffleInvarianceAudit = await cdp.eval(`
      (function() {
        const s = window.state.activeSession;
        const q = s.questions[s.currentIndex];
        const masterQ = window.state.questions.find(x => x.id === q.id);

        const choices = document.querySelectorAll('.answer-choice');
        const pairings = [];

        choices.forEach(choice => {
          const letter = choice.querySelector('.answer-letter').textContent.trim();
          const jpText = choice.querySelector('.answer-text').textContent.trim();
          const transText = choice.querySelector('.practice-option-translation').textContent.trim();
          pairings.push({ letter, jpText, transText });
        });

        // Verify against master options
        let allMatched = true;
        for (const p of pairings) {
          const masterOpt = masterQ.options.find(mo => {
            const temp = document.createElement('div');
            temp.innerHTML = mo.text;
            return temp.textContent.trim() === p.jpText;
          });

          if (!masterOpt) {
            allMatched = false;
            break;
          }
          const tempTrans = document.createElement('div');
          tempTrans.innerHTML = masterOpt.translation;
          if (tempTrans.textContent.trim() !== p.transText) {
            allMatched = false;
            break;
          }
        }

        return {
          pairingsCount: pairings.length,
          allMatched
        };
      })()
    `, sessionId);

    assert.strictEqual(shuffleInvarianceAudit.allMatched, true, 'Option-to-translation pairing must be 100% invariant under shuffling');
    console.log('  ✔ Option shuffling invariance verified in live browser session.');

    // Verify option selection interaction
    await cdp.eval(`document.querySelectorAll('.answer-choice')[1].click();`, sessionId);
    await delay(200);

    const selectionCheck = await cdp.eval(`
      (function() {
        const choices = document.querySelectorAll('.answer-choice');
        const s = window.state.activeSession;
        const q = s.questions[s.currentIndex];
        return {
          choice1Selected: choices[1].classList.contains('selected'),
          choice1AriaChecked: choices[1].getAttribute('aria-checked'),
          savedAnswerIndex: s.answers[q.id]
        };
      })()
    `, sessionId);

    assert.strictEqual(selectionCheck.choice1Selected, true, 'Selected option must have selected class');
    assert.strictEqual(selectionCheck.choice1AriaChecked, 'true', 'Selected option must have aria-checked="true"');
    assert.strictEqual(selectionCheck.savedAnswerIndex, 1, 'Answer index 1 must be saved accurately');
    console.log('  ✔ Option radio selection behavior verified completely unaffected by inline translation.');

    console.log('[T019 PASS] Navigation persistence and shuffling invariance 100% verified.\n');

    // ------------------------------------------------------------------------
    // T020: Academic Integrity, Session Reset & Multi-Viewport Ergonomics
    // ------------------------------------------------------------------------
    console.log('[T020] Verifying Academic Integrity, Session Reset & Viewport Ergonomics...');

    // Academic integrity: Assert 0% leakage of answer key or explanation
    const integrityAudit = await cdp.eval(`
      (function() {
        const s = window.state.activeSession;
        const q = s.questions[s.currentIndex];
        const qTrans = document.querySelector('.practice-question-translation').textContent;
        const oTransElements = document.querySelectorAll('.practice-option-translation');
        let allTransText = qTrans;
        oTransElements.forEach(el => { allTransText += ' ' + el.textContent; });

        const correctAns = String(q.correctAnswer || '').trim();
        const explanation = String(q.explanation || '').trim();

        // Check if explanation is leaked
        const leakedExplanation = explanation.length > 5 && allTransText.includes(explanation);

        // Check for answer key leakage indicators (e.g. "Jawaban: A" or "Kunci: B")
        const leakedKeyPattern = /(?:jawaban|kunci|correct)\s*[:=]\s*[A-D]/i.test(allTransText);

        return {
          leakedExplanation,
          leakedKeyPattern
        };
      })()
    `, sessionId);

    assert.strictEqual(integrityAudit.leakedExplanation, false, 'Explanation text must NOT leak into translation elements');
    assert.strictEqual(integrityAudit.leakedKeyPattern, false, 'Answer key must NOT leak into translation elements');
    console.log('  ✔ Academic integrity verified: 0% answer key or explanation leakage.');

    // Session lifecycle reset check: finish session and start new session
    await cdp.eval(`
      (async () => {
        await window.finishExam(true);
      })()
    `, sessionId);
    await delay(500);

    const postFinishState = await cdp.eval(`window.state.practiceTranslationOpen`, sessionId);
    assert.strictEqual(postFinishState, false, 'state.practiceTranslationOpen must reset to false after finishExam');

    // Start a brand new Practice session
    await cdp.eval(`
      (async () => {
        window.state.setup = {
          mode: 'practice',
          setId: 'ssw-pm-kunci-ujian-1',
          count: 40,
          duration: 70,
          random: false,
          shuffleOptions: false,
          practice: true
        };
        await window.startExam();
      })()
    `, sessionId);
    await delay(500);

    const newSessionState = await cdp.eval(`
      (function() {
        const btn = document.querySelector('.practice-trans-btn');
        return {
          stateOpen: window.state.practiceTranslationOpen,
          btnIsActive: btn ? btn.classList.contains('is-active') : false,
          qTransRendered: Boolean(document.querySelector('.practice-question-translation'))
        };
      })()
    `, sessionId);

    assert.strictEqual(newSessionState.stateOpen, false, 'New session must start with translations OFF');
    assert.strictEqual(newSessionState.btnIsActive, false, 'New session globe button must be inactive');
    assert.strictEqual(newSessionState.qTransRendered, false, 'New session must not render translations until toggled');
    console.log('  ✔ Session lifecycle reset verified (resets on finish and starts clean on new session).');

    // Multi-viewport ergonomics verification
    const testViewports = [
      { name: 'Desktop (1440x900)', width: 1440, height: 900, mobile: false },
      { name: 'Mobile Portrait (390x844)', width: 390, height: 844, mobile: true }
    ];

    for (const vp of testViewports) {
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: vp.mobile ? 2 : 1,
        mobile: vp.mobile
      }, sessionId);
      await delay(300);

      const vpMetrics = await cdp.eval(`
        (function() {
          const btn = document.querySelector('.practice-trans-btn');
          const plusBtn = document.querySelector('.study-list-quick-button');
          const furiBtn = document.querySelector('.furigana-quick-button');

          const r = btn.getBoundingClientRect();
          const pr = plusBtn.getBoundingClientRect();
          const fr = furiBtn.getBoundingClientRect();

          const hasOverlap = (
            (r.left < pr.right && r.right > pr.left && r.top < pr.bottom && r.bottom > pr.top) ||
            (r.left < fr.right && r.right > fr.left && r.top < fr.bottom && r.bottom > fr.top)
          );

          const docWidth = document.documentElement.scrollWidth;
          const winWidth = window.innerWidth;
          const hasHorizontalOverflow = docWidth > winWidth;

          return {
            btnWidth: r.width,
            btnHeight: r.height,
            hasOverlap,
            hasHorizontalOverflow
          };
        })()
      `, sessionId);

      assert(vpMetrics.btnWidth >= 30, `${vp.name}: button width must be at least 30px`);
      assert(vpMetrics.btnHeight >= 28, `${vp.name}: button height must be at least 28px`);
      assert.strictEqual(vpMetrics.hasOverlap, false, `${vp.name}: globe button must not collide with adjacent tools`);
      assert.strictEqual(vpMetrics.hasHorizontalOverflow, false, `${vp.name}: must have zero horizontal overflow`);
      console.log(`  ✔ Viewport ${vp.name} clearance verified (no overlap, no horizontal scroll).`);
    }

    console.log('[T020 PASS] Academic integrity, lifecycle reset, and responsive ergonomics 100% verified.\n');

    console.log('================================================================');
    console.log('ALL PHASE 5 TESTS (T016, T017, T018, T019, T020) PASSED WITH EXIT CODE 0');
    console.log('================================================================');
    process.exitCode = 0;

  } catch (err) {
    console.error('\n[TEST RUNNER FATAL ERROR]', err);
    process.exitCode = 1;
  } finally {
    if (chromeProcess) {
      try { chromeProcess.kill('SIGTERM'); } catch {}
    }
    if (serverInstance) {
      try { serverInstance.close(); } catch {}
    }
    if (userDataDir && fs.existsSync(userDataDir)) {
      try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch {}
    }
  }
}

main();
