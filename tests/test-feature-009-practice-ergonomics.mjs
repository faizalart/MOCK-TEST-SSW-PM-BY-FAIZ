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

async function waitForCondition(cdp, sessionId, expr, timeout = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const res = await cdp.eval(expr, sessionId);
    if (res) return res;
    await delay(50);
  }
  throw new Error(`Timeout waiting for condition: ${expr}`);
}

async function dispatchKey(cdp, sessionId, key, code = '') {
  await cdp.eval(`document.dispatchEvent(new KeyboardEvent('keydown', {
    key: ${JSON.stringify(key)},
    code: ${JSON.stringify(code || key)},
    bubbles: true,
    cancelable: true
  }))`, sessionId);
  await delay(120);
}

async function waitForAppBoot(cdp, sessionId) {
  await waitForCondition(
    cdp,
    sessionId,
    `Boolean(window.state && window.state.questions && window.state.questions.length > 0 && document.querySelector('#connection-label')?.textContent?.trim()?.length > 0)`
  );
  // boot() calls renderHome() again after ensureKunciUjian1Loaded/ensureSswPmTipe2Loaded
  await delay(1200);
}

async function exitExamToHome(cdp, sessionId) {
  await cdp.eval(`(async () => {
    if (window.state?.page === 'exam' && typeof window.finishExam === 'function') {
      await window.finishExam(false, true);
    }
    if (typeof window.go === 'function') {
      await window.go('home');
    }
  })()`, sessionId);
}

async function startPracticeSession(cdp, sessionId, shuffleOptions = false) {
  await exitExamToHome(cdp, sessionId);
  await waitForCondition(cdp, sessionId, `Boolean(document.querySelector('[data-action="quick-practice-kunci1"]'))`);
  await cdp.eval(`document.querySelector('[data-action="quick-practice-kunci1"]').click()`, sessionId);
  await waitForCondition(cdp, sessionId, `Boolean(document.querySelector('#setup-form button[type="submit"]'))`);
  if (shuffleOptions) {
    await cdp.eval(`(() => {
      const cb = document.querySelector('#setup-form input[name="shuffleOptions"]');
      if (cb && !cb.checked) cb.click();
    })()`, sessionId);
  }
  await cdp.eval(`document.querySelector('#setup-form button[type="submit"]').click()`, sessionId);
  await waitForCondition(cdp, sessionId, `Boolean(document.querySelector('.exam-shell') && document.querySelector('.question-map-item.current'))`);
  await delay(150);
}

async function main() {
  console.log('=== FEATURE 009 (US4 & US5): Practice Ergonomics Verification ===\n');

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

  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ssw-f009-ergo-'));
  const chrome = launchChrome(userDataDir);
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
    cdp.on('Runtime.exceptionThrown', params => {
      console.error('[PAGE EXCEPTION]', params.exceptionDetails?.exception?.description || params.exceptionDetails?.text);
    });
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 800,
      deviceScaleFactor: 1,
      mobile: false
    }, sessionId);

    // =========================================================================
    // US4: Reveal Correct Answer in Untimed Practice Mode
    // =========================================================================
    console.log('--- US4: Eye Reveal in Untimed Practice Mode ---');
    await cdp.send('Page.navigate', { url: baseUrl }, sessionId);
    await waitForAppBoot(cdp, sessionId);
    await startPracticeSession(cdp, sessionId, true);

    const toolbarInfo = await cdp.eval(`(() => {
      const tools = document.querySelector('.exam-bottom-tools');
      if (!tools) return { missing: true, page: window.state?.page, href: location.href, hasShell: !!document.querySelector('.exam-shell') };
      const children = Array.from(tools.children);
      const globeIdx = children.findIndex(el => el.classList.contains('practice-trans-btn'));
      const eyeIdx = children.findIndex(el => el.classList.contains('practice-reveal-btn'));
      const fIdx = children.findIndex(el => el.classList.contains('furigana-quick-button'));
      const eye = children[eyeIdx];
      return {
        globeIdx,
        eyeIdx,
        fIdx,
        action: eye ? eye.getAttribute('data-action') : null,
        ariaPressed: eye ? eye.getAttribute('aria-pressed') : null,
        checksCount: document.querySelectorAll('.practice-answer-key-check').length
      };
    })()`, sessionId);

    assert.ok(toolbarInfo && !toolbarInfo.missing, `Expected .exam-bottom-tools to render, got ${JSON.stringify(toolbarInfo)}`);
    assert.ok(toolbarInfo.globeIdx >= 0, 'Expected Globe button in toolbar');
    assert.equal(toolbarInfo.eyeIdx, toolbarInfo.globeIdx + 1, 'Expected Eye button immediately after Globe button');
    assert.equal(toolbarInfo.fIdx, toolbarInfo.eyeIdx + 1, 'Expected F (furigana) button immediately after Eye button');
    assert.equal(toolbarInfo.action, 'toggle-practice-reveal-answer');
    assert.equal(toolbarInfo.ariaPressed, 'false', 'Expected Eye toggle default OFF');
    assert.equal(toolbarInfo.checksCount, 0, 'Expected zero check markers when Eye is OFF');
    console.log('✓ US4.1: Eye button sits between Globe and F, defaults to OFF');

    // Toggle Eye ON
    await cdp.eval(`document.querySelector('[data-action="toggle-practice-reveal-answer"]').click()`, sessionId);
    await delay(80);

    const revealOnInfo = await cdp.eval(`(() => {
      const eye = document.querySelector('[data-action="toggle-practice-reveal-answer"]');
      const checks = Array.from(document.querySelectorAll('.practice-answer-key-check'));
      const choices = Array.from(document.querySelectorAll('.answer-choice'));
      const revealedChoiceIdx = choices.findIndex(c => c.querySelector('.practice-answer-key-check'));
      const checkEl = checks[0];
      const checkSvg = checkEl ? (checkEl.tagName.toLowerCase() === 'svg' ? checkEl : checkEl.querySelector('svg')) : null;
      const rect = checkSvg ? checkSvg.getBoundingClientRect() : null;
      const parentChoice = checkEl ? checkEl.closest('.answer-choice') : null;
      const s = window.state?.activeSession;
      const q = s ? s.questions[s.currentIndex] : null;
      return {
        hasExamShell: !!document.querySelector('.exam-shell'),
        ariaPressed: eye ? eye.getAttribute('aria-pressed') : null,
        checksCount: checks.length,
        revealedChoiceIdx,
        expectedCorrectIdx: q ? q.correctIndex : null,
        isSvg: checkSvg ? checkSvg.tagName.toLowerCase() === 'svg' : false,
        width: rect ? Math.round(rect.width) : 0,
        height: rect ? Math.round(rect.height) : 0,
        hasCheckboxOrBadge: parentChoice ? !!parentChoice.querySelector('input[type="checkbox"], .badge, .pill') : false,
        textContent: checkEl ? checkEl.textContent.trim() : ''
      };
    })()`, sessionId);
    assert.equal(revealOnInfo.ariaPressed, 'true', 'Expected Eye toggle ON');
    assert.equal(revealOnInfo.checksCount, 1, 'Expected exactly 1 answer-key check SVG when ON');
    assert.ok(revealOnInfo.revealedChoiceIdx >= 0, 'Expected check inside one .answer-choice');
    assert.equal(revealOnInfo.revealedChoiceIdx, revealOnInfo.expectedCorrectIdx, 'Expected check on q.correctIndex even with shuffled options');
    assert.equal(revealOnInfo.isSvg, true, 'Expected check marker to be an SVG icon');
    assert.equal(revealOnInfo.width, 16, 'Expected ~16px check icon width');
    assert.equal(revealOnInfo.height, 16, 'Expected ~16px check icon height');
    assert.equal(revealOnInfo.hasCheckboxOrBadge, false, 'Expected no checkbox/badge');
    assert.equal(revealOnInfo.textContent, '', 'Expected no extra text inside check icon');
    console.log('✓ US4.2: Eye ON shows single minimalist 16x16 Lucide check SVG on correct option');

    // Select a wrong option and verify distinction
    const wrongIdx = revealOnInfo.revealedChoiceIdx === 0 ? 1 : 0;
    await cdp.eval(`document.querySelectorAll('.answer-choice')[${wrongIdx}].click()`, sessionId);
    await waitForCondition(cdp, sessionId, `Boolean(document.querySelector('.answer-choice.selected'))`);

    const wrongSelectInfo = await cdp.eval(`(() => {
      const choices = Array.from(document.querySelectorAll('.answer-choice'));
      return {
        selectedIndices: choices.map((c, i) => c.classList.contains('selected') ? i : -1).filter(i => i >= 0),
        checkIndices: choices.map((c, i) => c.querySelector('.practice-answer-key-check') ? i : -1).filter(i => i >= 0)
      };
    })()`, sessionId);

    assert.deepEqual(wrongSelectInfo.selectedIndices, [wrongIdx], 'Expected user selection on wrong option');
    assert.deepEqual(wrongSelectInfo.checkIndices, [revealOnInfo.revealedChoiceIdx], 'Expected correct-answer check to remain on correct option');
    console.log('✓ US4.3: Wrong user selection and revealed correct answer coexist distinctly');

    // Navigate Next & Prev and verify Eye stays ON
    await cdp.eval(`document.querySelector('[data-action="exam-next"]').click()`, sessionId);
    await waitForCondition(cdp, sessionId, `document.querySelector('.question-map-item.current')?.dataset.index === '1'`);
    const nextPersist = await cdp.eval(`(() => ({
      ariaPressed: document.querySelector('[data-action="toggle-practice-reveal-answer"]')?.getAttribute('aria-pressed'),
      checksCount: document.querySelectorAll('.practice-answer-key-check').length
    }))()`, sessionId);
    assert.equal(nextPersist.ariaPressed, 'true', 'Expected Eye toggle to persist after Next');
    assert.equal(nextPersist.checksCount, 1, 'Expected check marker to render on next question');

    await waitForCondition(cdp, sessionId, `Boolean(document.querySelector('[data-action="exam-prev"]'))`);
    await cdp.eval(`document.querySelector('[data-action="exam-prev"]').click()`, sessionId);
    await waitForCondition(cdp, sessionId, `document.querySelector('.question-map-item.current')?.dataset.index === '0'`);
    const prevPersist = await cdp.eval(`(() => ({
      ariaPressed: document.querySelector('[data-action="toggle-practice-reveal-answer"]')?.getAttribute('aria-pressed'),
      checksCount: document.querySelectorAll('.practice-answer-key-check').length
    }))()`, sessionId);
    assert.equal(prevPersist.ariaPressed, 'true', 'Expected Eye toggle to persist after Prev');
    assert.equal(prevPersist.checksCount, 1, 'Expected check marker on previous question');
    console.log('✓ US4.4: Eye reveal persists across Next/Previous navigation');

    // Toggle Eye OFF
    await cdp.eval(`document.querySelector('[data-action="toggle-practice-reveal-answer"]').click()`, sessionId);
    await delay(80);
    const offChecks = await cdp.eval(`document.querySelectorAll('.practice-answer-key-check').length`, sessionId);
    assert.equal(offChecks, 0, 'Expected check marker to disappear immediately on Eye OFF');

    // Toggle Eye ON and check 390px and 360px mobile viewports for zero collision & zero overflow
    await cdp.eval(`document.querySelector('[data-action="toggle-practice-reveal-answer"]').click()`, sessionId);
    await delay(80);

    for (const vp of [{ width: 390, height: 844 }, { width: 360, height: 740 }]) {
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 2,
        mobile: true
      }, sessionId);
      await delay(120);

      const mobileLayout = await cdp.eval(`(() => {
        const overflow = document.documentElement.scrollWidth - window.innerWidth;
        const check = document.querySelector('.practice-answer-key-check');
        const row = check ? check.closest('.practice-option-row') : null;
        const kotoba = row ? row.querySelector('.practice-ctrl-kotoba') : null;
        const globe = document.querySelector('.practice-trans-btn');
        const eye = document.querySelector('.practice-reveal-btn');
        const furigana = document.querySelector('.furigana-quick-button');
        const checkRect = check ? check.getBoundingClientRect() : null;
        const kotobaRect = kotoba ? kotoba.getBoundingClientRect() : null;
        const globeRect = globe ? globe.getBoundingClientRect() : null;
        const eyeRect = eye ? eye.getBoundingClientRect() : null;
        const fRect = furigana ? furigana.getBoundingClientRect() : null;
        return {
          overflow,
          hasCheck: !!checkRect,
          hasKotoba: !!kotobaRect,
          checkRight: checkRect ? checkRect.right : null,
          kotobaLeft: kotobaRect ? kotobaRect.left : null,
          globeRight: globeRect ? globeRect.right : null,
          eyeLeft: eyeRect ? eyeRect.left : null,
          eyeRight: eyeRect ? eyeRect.right : null,
          fLeft: fRect ? fRect.left : null
        };
      })()`, sessionId);

      assert.ok(mobileLayout.overflow <= 0, `Expected 0px overflow at ${vp.width}px, got ${mobileLayout.overflow}px`);
      assert.ok(mobileLayout.hasCheck && mobileLayout.hasKotoba, `Expected check and kotoba controls at ${vp.width}px`);
      assert.ok(
        mobileLayout.checkRight <= mobileLayout.kotobaLeft + 0.5,
        `Collision at ${vp.width}px: checkRight=${mobileLayout.checkRight} > kotobaLeft=${mobileLayout.kotobaLeft}`
      );
      assert.ok(
        mobileLayout.globeRight <= mobileLayout.eyeLeft + 1 && mobileLayout.eyeRight <= mobileLayout.fLeft + 1,
        `Toolbar button overlap at ${vp.width}px`
      );
      console.log(`✓ US4.5: Zero collision & zero overflow verified at ${vp.width}x${vp.height}`);
    }

    // Reset viewport to desktop 1280x800 for mode isolation & US5
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 800,
      deviceScaleFactor: 1,
      mobile: false
    }, sessionId);

    // Mode Isolation: Full Mock Test
    await exitExamToHome(cdp, sessionId);
    await waitForCondition(cdp, sessionId, `Boolean(document.querySelector('[data-action="quick-start-kunci1"]'))`);
    await cdp.eval(`document.querySelector('[data-action="quick-start-kunci1"]').click()`, sessionId);
    await waitForCondition(cdp, sessionId, `Boolean(document.querySelector('#setup-form button[type="submit"]'))`);
    await cdp.eval(`document.querySelector('#setup-form button[type="submit"]').click()`, sessionId);
    await waitForCondition(cdp, sessionId, `Boolean(document.querySelector('.exam-shell') && document.querySelector('.question-map-item.current'))`);
    await delay(100);

    const mockIsolation = await cdp.eval(`(() => {
      const hasEye = !!document.querySelector('.practice-reveal-btn, [data-action="toggle-practice-reveal-answer"]');
      const checksBefore = document.querySelectorAll('.practice-answer-key-check').length;
      const decoy = document.createElement('button');
      decoy.setAttribute('data-action', 'toggle-practice-reveal-answer');
      document.body.appendChild(decoy);
      decoy.click();
      decoy.remove();
      const checksAfter = document.querySelectorAll('.practice-answer-key-check').length;
      const stateRevealAfter = Boolean(window.state?.practiceRevealAnswer);
      return { hasEye, checksBefore, checksAfter, stateRevealAfter };
    })()`, sessionId);
    assert.equal(mockIsolation.hasEye, false, 'Full Mock Test must NOT render Eye button');
    assert.equal(mockIsolation.checksBefore, 0, 'Full Mock Test must NOT render check markers');
    assert.equal(mockIsolation.checksAfter, 0, 'Full Mock Test handler guard must block toggle-practice-reveal-answer');
    assert.equal(mockIsolation.stateRevealAfter, false, 'Full Mock Test must keep state.practiceRevealAnswer false');
    console.log('✓ US4.6: Full Mock Test dual rendering + handler isolation verified');

    // Mode Isolation: Timed Custom Exam
    await exitExamToHome(cdp, sessionId);
    await waitForCondition(cdp, sessionId, `Boolean(document.querySelector('[data-action="quick-custom"]'))`);
    await cdp.eval(`document.querySelector('[data-action="quick-custom"]').click()`, sessionId);
    await waitForCondition(cdp, sessionId, `Boolean(document.querySelector('#setup-form button[type="submit"]'))`);
    const customDiag = await cdp.eval(`(() => {
      const form = document.querySelector('#setup-form');
      const cb = form.querySelector('input[name="practice"]');
      if (cb && cb.checked) cb.click();
      const btn = form.querySelector('button[type="submit"]');
      const info = {
        mode: form.elements.mode?.value,
        setId: form.elements.setId?.value,
        count: form.elements.count?.value,
        duration: form.elements.duration?.value,
        disabled: btn.disabled,
        valid: form.checkValidity()
      };
      btn.click();
      return info;
    })()`, sessionId);
    try {
      await waitForCondition(cdp, sessionId, `Boolean(document.querySelector('.exam-shell') && document.querySelector('.question-map-item.current'))`);
    } catch (e) {
      const after = await cdp.eval(`({ page: window.state?.page, toast: document.querySelector('.toast')?.textContent })`, sessionId);
      throw new Error(`${e.message} | customDiag=${JSON.stringify(customDiag)} | after=${JSON.stringify(after)}`);
    }
    await delay(100);

    const customIsolation = await cdp.eval(`(() => {
      const hasEye = !!document.querySelector('.practice-reveal-btn, [data-action="toggle-practice-reveal-answer"]');
      const checksBefore = document.querySelectorAll('.practice-answer-key-check').length;
      const decoy = document.createElement('button');
      decoy.setAttribute('data-action', 'toggle-practice-reveal-answer');
      document.body.appendChild(decoy);
      decoy.click();
      decoy.remove();
      const checksAfter = document.querySelectorAll('.practice-answer-key-check').length;
      const stateRevealAfter = Boolean(window.state?.practiceRevealAnswer);
      return { hasEye, checksBefore, checksAfter, stateRevealAfter };
    })()`, sessionId);
    assert.equal(customIsolation.hasEye, false, 'Timed Custom Exam must NOT render Eye button');
    assert.equal(customIsolation.checksBefore, 0, 'Timed Custom Exam must NOT render check markers');
    assert.equal(customIsolation.checksAfter, 0, 'Timed Custom Exam handler guard must block toggle-practice-reveal-answer');
    assert.equal(customIsolation.stateRevealAfter, false, 'Timed Custom Exam must keep state.practiceRevealAnswer false');
    console.log('✓ US4.7: Timed Custom Exam dual rendering + handler isolation verified');

    // =========================================================================
    // US5: Stable Number List Scroll Position in Untimed Practice Mode
    // =========================================================================
    console.log('\n--- US5: Stable Number List Scroll Position ---');
    await startPracticeSession(cdp, sessionId, false);

    const mapSetup = await cdp.eval(`(() => {
      const map = document.querySelector('.exam-question-map');
      if (!map) return null;
      const maxScroll = map.scrollHeight - map.clientHeight;
      const targetScroll = maxScroll > 20 ? Math.floor(maxScroll * 0.7) : 0;
      map.scrollTop = targetScroll;
      return {
        scrollHeight: map.scrollHeight,
        clientHeight: map.clientHeight,
        maxScroll,
        appliedScrollTop: map.scrollTop
      };
    })()`, sessionId);

    assert.ok(mapSetup, 'Expected .exam-question-map to render');
    assert.ok(mapSetup.maxScroll > 20, `Expected scrollable .exam-question-map on desktop, got maxScroll=${mapSetup.maxScroll}`);
    assert.ok(mapSetup.appliedScrollTop > 10, `Expected non-zero initial test scrollTop, got ${mapSetup.appliedScrollTop}`);
    const expectedScroll = mapSetup.appliedScrollTop;

    // 1. Next button
    await cdp.eval(`document.querySelector('[data-action="exam-next"]').click()`, sessionId);
    await waitForCondition(cdp, sessionId, `document.querySelector('.question-map-item.current')?.dataset.index === '1'`);
    let scrollState = await cdp.eval(`(() => ({
      scrollTop: document.querySelector('.exam-question-map').scrollTop,
      currentText: document.querySelector('.question-map-item.current')?.textContent?.trim()
    }))()`, sessionId);
    assert.equal(scrollState.scrollTop, expectedScroll, 'Expected 0px scrollTop delta on Next button');
    assert.equal(scrollState.currentText, '2', 'Expected .current highlight to update to 2');
    console.log('✓ US5.1: Next button preserved scrollTop (delta === 0 px) and updated .current');

    // 2. Previous button
    await waitForCondition(cdp, sessionId, `Boolean(document.querySelector('[data-action="exam-prev"]'))`);
    await cdp.eval(`document.querySelector('[data-action="exam-prev"]').click()`, sessionId);
    await waitForCondition(cdp, sessionId, `document.querySelector('.question-map-item.current')?.dataset.index === '0'`);
    scrollState = await cdp.eval(`(() => ({
      scrollTop: document.querySelector('.exam-question-map').scrollTop,
      currentText: document.querySelector('.question-map-item.current')?.textContent?.trim()
    }))()`, sessionId);
    assert.equal(scrollState.scrollTop, expectedScroll, 'Expected 0px scrollTop delta on Previous button');
    assert.equal(scrollState.currentText, '1', 'Expected .current highlight to update to 1');
    console.log('✓ US5.2: Previous button preserved scrollTop (delta === 0 px) and updated .current');

    // 3. Keyboard shortcuts (ArrowRight & ArrowLeft)
    await dispatchKey(cdp, sessionId, 'ArrowRight', 'ArrowRight');
    await waitForCondition(cdp, sessionId, `document.querySelector('.question-map-item.current')?.dataset.index === '1'`);
    scrollState = await cdp.eval(`(() => ({
      scrollTop: document.querySelector('.exam-question-map').scrollTop,
      currentText: document.querySelector('.question-map-item.current')?.textContent?.trim()
    }))()`, sessionId);
    assert.equal(scrollState.scrollTop, expectedScroll, 'Expected 0px scrollTop delta on ArrowRight shortcut');
    assert.equal(scrollState.currentText, '2', 'Expected .current highlight to update to 2 on ArrowRight');

    await dispatchKey(cdp, sessionId, 'ArrowLeft', 'ArrowLeft');
    await waitForCondition(cdp, sessionId, `document.querySelector('.question-map-item.current')?.dataset.index === '0'`);
    scrollState = await cdp.eval(`(() => ({
      scrollTop: document.querySelector('.exam-question-map').scrollTop,
      currentText: document.querySelector('.question-map-item.current')?.textContent?.trim()
    }))()`, sessionId);
    assert.equal(scrollState.scrollTop, expectedScroll, 'Expected 0px scrollTop delta on ArrowLeft shortcut');
    assert.equal(scrollState.currentText, '1', 'Expected .current highlight to update to 1 on ArrowLeft');
    console.log('✓ US5.3: Keyboard shortcuts preserved scrollTop (delta === 0 px) and updated .current');

    // 4. Clicking a number in the list (jump-question)
    const clickedNum = await cdp.eval(`(() => {
      const map = document.querySelector('.exam-question-map');
      const mapRect = map.getBoundingClientRect();
      const items = Array.from(map.querySelectorAll('.question-map-item[data-action="jump-question"]'));
      const visibleTarget = items.find(el => {
        if (el.classList.contains('current')) return false;
        const r = el.getBoundingClientRect();
        return r.top >= mapRect.top && r.bottom <= mapRect.bottom;
      }) || items[items.length - 1];
      const text = visibleTarget.textContent.trim();
      visibleTarget.click();
      return text;
    })()`, sessionId);
    await waitForCondition(cdp, sessionId, `document.querySelector('.question-map-item.current')?.textContent?.trim() === ${JSON.stringify(clickedNum)}`);
    scrollState = await cdp.eval(`(() => ({
      scrollTop: document.querySelector('.exam-question-map').scrollTop,
      currentText: document.querySelector('.question-map-item.current')?.textContent?.trim()
    }))()`, sessionId);
    assert.equal(scrollState.scrollTop, expectedScroll, 'Expected 0px scrollTop delta on jump-question click');
    assert.equal(scrollState.currentText, clickedNum, `Expected .current highlight to update to ${clickedNum}`);
    console.log(`✓ US5.4: jump-question click (#${clickedNum}) preserved scrollTop (delta === 0 px) and updated .current`);

    // 5. Manual user scroll still works & new session resets to scrollTop === 0
    const manualScroll = await cdp.eval(`(() => {
      const map = document.querySelector('.exam-question-map');
      map.scrollTop = 24;
      return map.scrollTop;
    })()`, sessionId);
    assert.equal(manualScroll, 24, 'Expected manual user scroll to still work freely');

    await startPracticeSession(cdp, sessionId, false);
    const newSessionScroll = await cdp.eval(`document.querySelector('.exam-question-map')?.scrollTop`, sessionId);
    assert.equal(newSessionScroll, 0, 'Expected new Practice session to initialize Number List at scrollTop === 0');
    console.log('✓ US5.5: Manual scroll works & new session resets Number List to scrollTop === 0');

    // =========================================================================
    // US3-A: Practice Answer Layout Compactness & Mode Parity (T019)
    // =========================================================================
    console.log('\n--- US3-A: Practice Layout Compactness & Mode Isolation ---');
    const viewports = [
      { width: 1440, height: 900, mobile: false, dpr: 1 },
      { width: 390, height: 844, mobile: true, dpr: 2 },
      { width: 360, height: 740, mobile: true, dpr: 2 }
    ];

    for (const vp of viewports) {
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: vp.dpr,
        mobile: vp.mobile
      }, sessionId);
      await delay(120);

      const practiceMetrics = await cdp.eval(`(() => {
        const row = document.querySelector('.practice-option-row');
        const choice = row?.querySelector('.answer-choice');
        const text = choice?.querySelector('.answer-text');
        const transBtn = row?.querySelector('.practice-ctrl-trans');
        const kotobaBtn = row?.querySelector('.practice-ctrl-kotoba');
        if (!row || !choice || !text || !transBtn || !kotobaBtn) return null;
        const cs = getComputedStyle(choice);
        const choiceRect = choice.getBoundingClientRect();
        const textRect = text.getBoundingClientRect();
        const transRect = transBtn.getBoundingClientRect();
        const kotobaRect = kotobaBtn.getBoundingClientRect();
        return {
          overflow: document.documentElement.scrollWidth - window.innerWidth,
          paddingLeft: parseFloat(cs.paddingLeft),
          paddingRight: parseFloat(cs.paddingRight),
          textLeftOffset: textRect.left - choiceRect.left,
          transW: transRect.width,
          transH: transRect.height,
          kotobaW: kotobaBtn.getBoundingClientRect().width,
          kotobaH: kotobaRect.height
        };
      })()`, sessionId);

      assert.ok(practiceMetrics, `Expected practice option row metrics at ${vp.width}px`);
      assert.ok(practiceMetrics.overflow <= 0, `Expected 0px overflow at ${vp.width}px, got ${practiceMetrics.overflow}`);
      assert.equal(practiceMetrics.paddingLeft, 26, `Expected compact 26px paddingLeft at ${vp.width}px`);
      assert.equal(practiceMetrics.paddingRight, 48, `Expected 48px paddingRight at ${vp.width}px`);
      assert.ok(practiceMetrics.textLeftOffset < 32, `Expected .answer-text left offset < 32px (got ${practiceMetrics.textLeftOffset}px) at ${vp.width}px`);
      assert.ok(practiceMetrics.transW >= 44 && practiceMetrics.transH >= 44, `Expected >=44x44px trans hit area at ${vp.width}px`);
      assert.ok(practiceMetrics.kotobaW >= 44 && practiceMetrics.kotobaH >= 44, `Expected >=44x44px kotoba hit area at ${vp.width}px`);

      const shot = await cdp.send('Page.captureScreenshot', { format: 'png' }, sessionId);
      assert.ok(shot.data && shot.data.length > 1000, `Expected valid Practice screenshot at ${vp.width}x${vp.height}`);
      console.log(`✓ US3-A Practice layout & screenshot verified at ${vp.width}x${vp.height} (offset=${practiceMetrics.textLeftOffset.toFixed(1)}px)`);
    }

    // Verify Feature 008 scroll-to-row behavior still works on .practice-ctrl-kotoba click
    await cdp.eval(`document.querySelector('.practice-option-row .practice-ctrl-kotoba').click()`, sessionId);
    await waitForCondition(cdp, sessionId, `Boolean(document.querySelector('.practice-option-row .practice-option-kotoba'))`);
    console.log('✓ US3-A: Feature 008 Kotoba toggle & row visibility intact');

    // Verify Full Mock Test cards remain untouched (padding 6px 12px) at 1440x900, 390x844, 360x740
    await exitExamToHome(cdp, sessionId);
    await waitForCondition(cdp, sessionId, `Boolean(document.querySelector('[data-action="quick-start-kunci1"]'))`);
    await cdp.eval(`document.querySelector('[data-action="quick-start-kunci1"]').click()`, sessionId);
    await waitForCondition(cdp, sessionId, `Boolean(document.querySelector('#setup-form button[type="submit"]'))`);
    await cdp.eval(`document.querySelector('#setup-form button[type="submit"]').click()`, sessionId);
    await waitForCondition(cdp, sessionId, `Boolean(document.querySelector('.exam-shell') && document.querySelector('.question-map-item.current'))`);
    await delay(100);

    for (const vp of viewports) {
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: vp.dpr,
        mobile: vp.mobile
      }, sessionId);
      await delay(100);

      const mockMetrics = await cdp.eval(`(() => {
        const choice = document.querySelector('.answer-choice');
        const cs = choice ? getComputedStyle(choice) : null;
        return cs ? {
          hasPracticeRow: Boolean(document.querySelector('.practice-option-row')),
          paddingLeft: parseFloat(cs.paddingLeft),
          paddingRight: parseFloat(cs.paddingRight),
          overflow: document.documentElement.scrollWidth - window.innerWidth
        } : null;
      })()`, sessionId);

      assert.ok(mockMetrics, `Expected Full Mock choice metrics at ${vp.width}px`);
      assert.equal(mockMetrics.hasPracticeRow, false, 'Full Mock must NOT render .practice-option-row');
      assert.equal(mockMetrics.paddingLeft, 12, `Full Mock paddingLeft must stay 12px at ${vp.width}px`);
      assert.equal(mockMetrics.paddingRight, 12, `Full Mock paddingRight must stay 12px at ${vp.width}px`);
      assert.ok(mockMetrics.overflow <= 0, `Full Mock 0px overflow at ${vp.width}px`);
      const shot = await cdp.send('Page.captureScreenshot', { format: 'png' }, sessionId);
      assert.ok(shot.data && shot.data.length > 1000, `Expected valid Full Mock screenshot at ${vp.width}x${vp.height}`);
    }
    console.log('✓ US3-A: Full Mock Test answer card parity & screenshots verified at 1440px, 390px, 360px');

    console.log('\nALL US3-A, US4 & US5 ERGONOMICS TESTS PASSED!');
  } finally {
    chrome.kill('SIGKILL');
    server.close();
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch {
      // ignore temp cleanup error on Windows
    }
  }
}

main().catch(err => {
  console.error('\nTEST FAILED:', err);
  process.exit(1);
});
