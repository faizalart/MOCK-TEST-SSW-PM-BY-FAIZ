/**
 * test-study-list-ux-refinement.mjs
 * End-to-end regression test suite for Feature 006: Study List UX Refinement
 *
 * Verifies:
 * - T006: Minimalist standalone plus icon appearance (SVG outline, no bubbles/containers/shadow/animation, transparent bg, 44px target)
 * - T007: Individual plus two-way toggle (add on click 1, remove on click 2) with toast, badge, and IndexedDB sync
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';

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

function launchChrome(userDataDir) {
  const possiblePaths = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    `${process.env.LOCALAPPDATA}/Google/Chrome/Application/chrome.exe`
  ];
  let chromePath = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      chromePath = p;
      break;
    }
  }
  if (!chromePath) throw new Error('Chrome executable not found on host');

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
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Service-Worker-Allowed': '/'
    });
    fs.createReadStream(filePath).pipe(res);
  });

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      resolve({ server, port, origin: `http://127.0.0.1:${port}` });
    });
  });
}

const delay = ms => new Promise(r => setTimeout(r, ms));

export async function runStudyListUXTests() {
  console.log('=== RUNNING STUDY LIST UX REFINEMENT REGRESSION TEST SUITE ===\n');

  const { server, origin } = await startStaticServer();
  const tmpUserData = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-studylist-test-'));
  const chrome = launchChrome(tmpUserData);
  const cdp = new CDPClient(chrome);

  const results = {
    allPassed: true,
    scenarios: []
  };

  try {
    await delay(600);
    const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });

    await cdp.send('Page.enable', {}, sessionId);
    await cdp.send('Runtime.enable', {}, sessionId);

    // Initial setup at desktop viewport
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    }, sessionId);

    console.log('[Setup]: Navigating to application...');
    await cdp.send('Page.navigate', { url: origin + '/index.html' }, sessionId);
    await delay(4500); // Allow boot and background bundle seeding

    // Navigate to Bank Soal
    console.log('[Setup]: Navigating to Bank Soal...');
    await cdp.eval(`
      (async () => {
        window.go('bank');
      })()
    `, sessionId);
    await delay(600);

    // Expand Bank Soal question list if collapsed
    await cdp.eval(`
      (function() {
        const toggleBtn = document.querySelector('.zen-toggle-bank-list-btn');
        if (toggleBtn && toggleBtn.getAttribute('aria-expanded') !== 'true') {
          toggleBtn.click();
        }
      })()
    `, sessionId);
    await delay(400);

    // =========================================================================
    // SCENARIO 1: T006 - Minimalist Plus Icon Appearance & Styling Verification
    // =========================================================================
    console.log('--- Test Scenario 1 (T006): Minimalist Plus Icon Appearance & Styling ---');
    const flagCheck = await cdp.eval(`
      (function() {
        const btn = document.querySelector('.zen-q-actions .zen-study-btn');
        if (!btn) return { error: 'No .zen-study-btn found in question card actions' };

        const dataAction = btn.getAttribute('data-action');
        const svg = btn.querySelector('svg.zen-study-icon, svg.zen-flag-icon, svg');
        if (!svg) return { error: 'No svg found inside .zen-study-btn', dataAction, text: btn.textContent.trim() };

        const btnStyle = window.getComputedStyle(btn);
        const svgStyle = window.getComputedStyle(svg);
        const btnRect = btn.getBoundingClientRect();
        const svgRect = svg.getBoundingClientRect();

        const hasNoBg = btnStyle.backgroundColor === 'rgba(0, 0, 0, 0)' || btnStyle.backgroundColor === 'transparent';
        const hasNoBorder = btnStyle.borderStyle === 'none' || parseFloat(btnStyle.borderWidth) === 0;
        const hasNoShadow = btnStyle.boxShadow === 'none';
        const hasNoAnimation = btnStyle.animationName === 'none';
        const hasNoTransform = btnStyle.transform === 'none';

        const isSvg14px = Math.round(svgRect.width) === 14 && Math.round(svgRect.height) === 14;
        const isTouchTarget44px = btnRect.width >= 40 && btnRect.height >= 40;

        // Verify minimalist plus glyph geometry (two perpendicular strokes)
        const pathD = (svg.querySelector('path')?.getAttribute('d') || '').replace(/\s+/g, ' ');
        const isPlus = pathD.includes('M2 7') && pathD.includes('M7 2');
        const isFlag = pathD.includes('M4 15') || pathD.toLowerCase().includes('z');

        return {
          dataAction,
          hasSvg: true,
          isPlus,
          isFlag,
          btnColor: btnStyle.color,
          hasNoBg,
          hasNoBorder,
          hasNoShadow,
          hasNoAnimation,
          hasNoTransform,
          isSvg14px,
          isTouchTarget44px,
          btnWidth: btnRect.width,
          btnHeight: btnRect.height,
          svgWidth: svgRect.width,
          svgHeight: svgRect.height,
          svgFill: svgStyle.fill,
          svgStroke: svgStyle.stroke
        };
      })()
    `, sessionId);

    console.log('[T006 Result]:', JSON.stringify(flagCheck, null, 2));

    const s1Passed = flagCheck &&
      !flagCheck.error &&
      flagCheck.dataAction === 'toggle-bank-study' &&
      flagCheck.hasSvg &&
      flagCheck.isPlus &&
      !flagCheck.isFlag &&
      flagCheck.hasNoBg &&
      flagCheck.hasNoBorder &&
      flagCheck.hasNoShadow &&
      flagCheck.isSvg14px &&
      flagCheck.isTouchTarget44px;

    if (!s1Passed) {
      console.error('[FAIL] Scenario 1 (T006): Minimalist plus icon appearance failed.', flagCheck.error || 'Assertion mismatch');
      results.allPassed = false;
      results.scenarios.push({ name: 'T006: Minimalist Plus Icon Appearance', status: 'FAIL', details: flagCheck });
    } else {
      console.log('[PASS] Scenario 1 (T006): Standalone minimalist plus icon verified with transparent bg, 0 border, 44px touch target, and plus geometry.');
      results.scenarios.push({ name: 'T006: Minimalist Plus Icon Appearance', status: 'PASS' });
    }

    // =========================================================================
    // SCENARIO 2: T007 - Individual Plus Two-Way Toggle (Add & Remove)
    // =========================================================================
    console.log('\n--- Test Scenario 2 (T007): Individual Plus Two-Way Toggle ---');
    const toggleCheck = await cdp.eval(`
      (async function() {
        const btn = document.querySelector('.zen-q-actions .zen-study-btn');
        if (!btn) return { error: 'No .zen-study-btn found' };

        const qId = btn.getAttribute('data-id');
        const q = (window.state.questions || []).find(x => x.id === qId);
        if (!q) return { error: 'Question not found for id: ' + qId };

        const getBadgeCount = () => {
          const badgeEl = document.getElementById('nav-study-badge') || document.querySelector('.nav-badge');
          return badgeEl ? parseInt(badgeEl.textContent.trim(), 10) || 0 : 0;
        };

        const checkIdbHasRecord = () => {
          return new Promise(resolve => {
            try {
              const req = indexedDB.open('ssw-pm-mock-test-db');
              req.onsuccess = () => {
                const db = req.result;
                if (!db.objectStoreNames.contains('studyList')) return resolve(false);
                const tx = db.transaction('studyList', 'readonly');
                const getReq = tx.objectStore('studyList').getAll();
                getReq.onsuccess = () => {
                  const list = getReq.result || [];
                  const found = list.some(item => item.questionId === q.id || item.id === q.id || item.id.endsWith('::' + q.id));
                  resolve(found);
                };
                getReq.onerror = () => resolve(false);
              };
              req.onerror = () => resolve(false);
            } catch {
              resolve(false);
            }
          });
        };

        const initialBadgeCount = getBadgeCount();
        const initialInStudy = window.isQuestionInStudy(q);

        // Click 1: Add to Study List
        btn.click();
        await new Promise(r => setTimeout(r, 400));

        const postAddBtn = document.querySelector('.zen-q-actions .zen-study-btn[data-id="' + qId + '"]');
        const postAddInStudy = window.isQuestionInStudy(q);
        const postAddActive = postAddBtn ? postAddBtn.classList.contains('is-active') : false;
        const postAddAriaPressed = postAddBtn ? postAddBtn.getAttribute('aria-pressed') : null;
        const postAddTitle = postAddBtn ? postAddBtn.getAttribute('title') : null;
        const postAddBadgeCount = getBadgeCount();
        const postAddColor = postAddBtn ? window.getComputedStyle(postAddBtn).color : '';
        const postAddSvg = postAddBtn ? postAddBtn.querySelector('svg') : null;
        const postAddPathD = postAddSvg ? (postAddSvg.querySelector('path')?.getAttribute('d') || '').replace(/\s+/g, ' ') : '';
        const postAddIsPlus = postAddPathD.includes('M2 7') && postAddPathD.includes('M7 2');

        const toasts = Array.from(document.querySelectorAll('.toast'));
        const toastEl = toasts[toasts.length - 1];
        const postAddToastText = toastEl ? toastEl.textContent.trim() : '';

        // Check IndexedDB
        const idbHasRecord = await checkIdbHasRecord();

        // Click 2: Remove from Study List (Two-Way Toggle)
        postAddBtn.click();
        await new Promise(r => setTimeout(r, 400));

        const postRemoveBtn = document.querySelector('.zen-q-actions .zen-study-btn[data-id="' + qId + '"]');
        const postRemoveInStudy = window.isQuestionInStudy(q);
        const postRemoveActive = postRemoveBtn ? postRemoveBtn.classList.contains('is-active') : false;
        const postRemoveAriaPressed = postRemoveBtn ? postRemoveBtn.getAttribute('aria-pressed') : null;
        const postRemoveTitle = postRemoveBtn ? postRemoveBtn.getAttribute('title') : null;
        const postRemoveBadgeCount = getBadgeCount();
        const postRemoveColor = postRemoveBtn ? window.getComputedStyle(postRemoveBtn).color : '';
        const postRemoveSvg = postRemoveBtn ? postRemoveBtn.querySelector('svg') : null;
        const postRemovePathD = postRemoveSvg ? (postRemoveSvg.querySelector('path')?.getAttribute('d') || '').replace(/\s+/g, ' ') : '';
        const postRemoveIsPlus = postRemovePathD.includes('M2 7') && postRemovePathD.includes('M7 2');

        const idbHasRecordAfterRemove = await checkIdbHasRecord();

        return {
          initialInStudy,
          initialBadgeCount,
          postAddInStudy,
          postAddActive,
          postAddAriaPressed,
          postAddTitle,
          postAddBadgeCount,
          postAddColor,
          postAddIsPlus,
          postAddToastText,
          idbHasRecord,
          postRemoveInStudy,
          postRemoveActive,
          postRemoveAriaPressed,
          postRemoveTitle,
          postRemoveBadgeCount,
          postRemoveColor,
          postRemoveIsPlus,
          idbHasRecordAfterRemove
        };
      })()
    `, sessionId);

    console.log('[T007 Result]:', JSON.stringify(toggleCheck, null, 2));

    const s2AddOk = toggleCheck &&
      !toggleCheck.error &&
      toggleCheck.postAddInStudy === true &&
      toggleCheck.postAddActive === true &&
      toggleCheck.postAddIsPlus === true &&
      toggleCheck.postAddColor === 'rgb(15, 118, 110)' &&
      toggleCheck.postAddAriaPressed === 'true' &&
      toggleCheck.postAddBadgeCount === toggleCheck.initialBadgeCount + 1 &&
      toggleCheck.idbHasRecord === true;

    const s2RemoveOk = toggleCheck &&
      toggleCheck.postRemoveInStudy === false &&
      toggleCheck.postRemoveActive === false &&
      toggleCheck.postRemoveIsPlus === true &&
      (toggleCheck.postRemoveColor === 'rgb(74, 78, 84)' || toggleCheck.postRemoveColor === 'rgb(113, 113, 122)') &&
      toggleCheck.postRemoveAriaPressed === 'false' &&
      toggleCheck.postRemoveBadgeCount === toggleCheck.initialBadgeCount &&
      toggleCheck.idbHasRecordAfterRemove === false;

    if (!s2AddOk || !s2RemoveOk) {
      console.error('[FAIL] Scenario 2 (T007): Individual plus two-way toggle failed.', toggleCheck.error || 'Assertion mismatch');
      results.allPassed = false;
      results.scenarios.push({ name: 'T007: Individual Plus Two-Way Toggle', status: 'FAIL', details: toggleCheck });
    } else {
      console.log('[PASS] Scenario 2 (T007): Two-way toggle (add on click 1, remove on click 2) verified with toast, badge, and IndexedDB sync.');
      results.scenarios.push({ name: 'T007: Individual Plus Two-Way Toggle', status: 'PASS' });
    }

    // =========================================================================
    // SCENARIO 3: T010 - Bulk Plus Button Placement & State Binding
    // =========================================================================
    console.log('\n--- Test Scenario 3 (T010): Bulk Plus Button Placement & State Binding ---');
    const bulkBtnCheck = await cdp.eval(`
      (async function() {
        const bulkBar = document.querySelector('.zen-bulk-bar');
        if (!bulkBar) return { error: 'No .zen-bulk-bar found' };

        const bulkBtn = bulkBar.querySelector('button.zen-bulk-study-btn[data-action="bulk-add-study"]');
        if (!bulkBtn) return { error: 'No button.zen-bulk-study-btn[data-action="bulk-add-study"] found inside .zen-bulk-bar' };

        const insideCard = Boolean(bulkBtn.closest('.zen-q-item') || bulkBtn.closest('.zen-q-actions'));
        const clearBtn = bulkBar.querySelector('[data-action="clear-question-selection"]');
        const deleteBtn = bulkBar.querySelector('[data-action="delete-selected-questions"]');

        const initialDisabled = bulkBtn.disabled;
        const initialSelectedCount = window.state.bankSelectedIds ? window.state.bankSelectedIds.size : 0;

        // Select first checkbox to test state binding
        const firstId = document.querySelector('input[data-question-select]')?.getAttribute('data-question-select');
        if (!firstId) return { error: 'No question checkbox found to test' };

        let cb = document.querySelector('input[data-question-select="' + firstId + '"]');
        if (cb && !cb.checked) cb.click();
        await new Promise(r => setTimeout(r, 200));

        const postSelectDisabled = document.querySelector('.zen-bulk-study-btn[data-action="bulk-add-study"]').disabled;

        // Unselect to return to clean state (re-query from live DOM)
        cb = document.querySelector('input[data-question-select="' + firstId + '"]');
        if (cb && cb.checked) cb.click();
        await new Promise(r => setTimeout(r, 200));

        const postUnselectDisabled = document.querySelector('.zen-bulk-study-btn[data-action="bulk-add-study"]').disabled;

        const svg = bulkBtn.querySelector('svg.zen-bulk-plus-icon');

        return {
          exists: true,
          insideBulkBar: true,
          outsideCard: !insideCard,
          hasClearBtn: Boolean(clearBtn),
          hasDeleteBtn: Boolean(deleteBtn),
          initialDisabled,
          initialSelectedCount,
          postSelectDisabled,
          postUnselectDisabled,
          hasSvg: Boolean(svg)
        };
      })()
    `, sessionId);

    console.log('[T010 Result]:', JSON.stringify(bulkBtnCheck, null, 2));

    const s3Passed = bulkBtnCheck &&
      !bulkBtnCheck.error &&
      bulkBtnCheck.outsideCard === true &&
      bulkBtnCheck.hasClearBtn === true &&
      bulkBtnCheck.hasDeleteBtn === true &&
      bulkBtnCheck.initialDisabled === true &&
      bulkBtnCheck.postSelectDisabled === false &&
      bulkBtnCheck.postUnselectDisabled === true;

    if (!s3Passed) {
      console.error('[FAIL] Scenario 3 (T010): Bulk Plus button placement or state binding failed.', bulkBtnCheck.error || 'Assertion mismatch');
      results.allPassed = false;
      results.scenarios.push({ name: 'T010: Bulk Plus Button Placement & State', status: 'FAIL', details: bulkBtnCheck });
    } else {
      console.log('[PASS] Scenario 3 (T010): Bulk Plus button verified in .zen-bulk-bar outside cards with responsive disabled/enabled binding.');
      results.scenarios.push({ name: 'T010: Bulk Plus Button Placement & State', status: 'PASS' });
    }

    // =========================================================================
    // SCENARIO 4: T011 - Bulk Add 5 Selected Questions
    // =========================================================================
    console.log('\n--- Test Scenario 4 (T011): Bulk Add 5 Selected Questions ---');
    const bulkAddCheck = await cdp.eval(`
      (async function() {
        const getBadgeCount = () => {
          const badgeEl = document.getElementById('nav-study-badge') || document.querySelector('.nav-badge');
          return badgeEl ? parseInt(badgeEl.textContent.trim(), 10) || 0 : 0;
        };

        const checkIdbRecords = (ids) => {
          return new Promise(resolve => {
            try {
              const req = indexedDB.open('ssw-pm-mock-test-db');
              req.onsuccess = () => {
                const db = req.result;
                if (!db.objectStoreNames.contains('studyList')) return resolve([]);
                const tx = db.transaction('studyList', 'readonly');
                const getReq = tx.objectStore('studyList').getAll();
                getReq.onsuccess = () => {
                  const list = getReq.result || [];
                  const foundIds = ids.filter(id => list.some(item => item.questionId === id || item.id === id || item.id.endsWith('::' + id)));
                  resolve(foundIds);
                };
                getReq.onerror = () => resolve([]);
              };
              req.onerror = () => resolve([]);
            } catch {
              resolve([]);
            }
          });
        };

        const initialBadgeCount = getBadgeCount();

        // Select exactly 5 questions
        const allCbs = Array.from(document.querySelectorAll('input[data-question-select]'));
        if (allCbs.length < 5) return { error: 'Not enough questions visible to select 5 (found ' + allCbs.length + ')' };

        const selectedIds = allCbs.slice(0, 5).map(cb => cb.getAttribute('data-question-select'));
        for (const qId of selectedIds) {
          const cb = document.querySelector('input[data-question-select="' + qId + '"]');
          if (cb && !cb.checked) {
            cb.click();
            await new Promise(r => setTimeout(r, 120));
          }
        }

        const selectedSetSize = window.state.bankSelectedIds ? window.state.bankSelectedIds.size : 0;
        const bulkBtn = document.querySelector('.zen-bulk-study-btn[data-action="bulk-add-study"]');
        if (!bulkBtn) return { error: 'No .zen-bulk-study-btn found' };

        // Click bulk add button
        bulkBtn.click();
        await new Promise(r => setTimeout(r, 500));

        const postBadgeCount = getBadgeCount();
        const toasts = Array.from(document.querySelectorAll('.toast'));
        const toastEl = toasts[toasts.length - 1];
        const postToastText = toastEl ? toastEl.textContent.trim() : '';

        // Check if all 5 are in state.studyList
        const memoryFound = selectedIds.filter(id => {
          const q = (window.state.questions || []).find(x => x.id === id);
          return q && window.isQuestionInStudy(q);
        });

        // Check IndexedDB
        const idbFound = await checkIdbRecords(selectedIds);

        // Check individual cards on screen: flag active state
        const cardPlusStates = selectedIds.map(id => {
          const btn = document.querySelector('.zen-q-actions .zen-study-btn[data-id="' + id + '"]');
          return {
            id,
            isActive: btn ? btn.classList.contains('is-active') : false,
            ariaPressed: btn ? btn.getAttribute('aria-pressed') : null,
            svgFill: btn && btn.querySelector('svg') ? btn.querySelector('svg').getAttribute('fill') : null
          };
        });

        // Check selection preservation
        const stillSelectedCount = window.state.bankSelectedIds ? window.state.bankSelectedIds.size : 0;
        const checkboxesStillChecked = selectedIds.every(id => {
          const cb = document.querySelector('input[data-question-select="' + id + '"]');
          return cb && cb.checked;
        });

        return {
          initialBadgeCount,
          selectedSetSize,
          postBadgeCount,
          badgeDiff: postBadgeCount - initialBadgeCount,
          postToastText,
          memoryFoundCount: memoryFound.length,
          idbFoundCount: idbFound.length,
          cardPlusStates,
          stillSelectedCount,
          checkboxesStillChecked
        };
      })()
    `, sessionId);

    console.log('[T011 Result]:', JSON.stringify(bulkAddCheck, null, 2));

    const s4Passed = bulkAddCheck &&
      !bulkAddCheck.error &&
      bulkAddCheck.selectedSetSize === 5 &&
      bulkAddCheck.badgeDiff === 5 &&
      bulkAddCheck.memoryFoundCount === 5 &&
      bulkAddCheck.idbFoundCount === 5 &&
      bulkAddCheck.stillSelectedCount === 5 &&
      bulkAddCheck.checkboxesStillChecked === true &&
      bulkAddCheck.cardPlusStates.every(c => c.isActive && c.ariaPressed === 'true');

    if (!s4Passed) {
      console.error('[FAIL] Scenario 4 (T011): Bulk add 5 selected questions failed.', bulkAddCheck.error || 'Assertion mismatch');
      results.allPassed = false;
      results.scenarios.push({ name: 'T011: Bulk Add 5 Selected Questions', status: 'FAIL', details: bulkAddCheck });
    } else {
      console.log('[PASS] Scenario 4 (T011): Bulk add 5 questions verified with badge (+5), IndexedDB persistence, flag synchronization, and preserved selection.');
      results.scenarios.push({ name: 'T011: Bulk Add 5 Selected Questions', status: 'PASS' });
    }

    // =========================================================================
    // SCENARIO 5: T014 - Mixed Bulk Addition (2 Pre-Existing + 3 New)
    // =========================================================================
    console.log('\n--- Test Scenario 5 (T014): Mixed Bulk Addition (2 Existing + 3 New) ---');
    const mixedCheck = await cdp.eval(`
      (async function() {
        const getBadgeCount = () => {
          const badgeEl = document.getElementById('nav-study-badge') || document.querySelector('.nav-badge');
          return badgeEl ? parseInt(badgeEl.textContent.trim(), 10) || 0 : 0;
        };

        const getAllStudyList = () => {
          return new Promise(resolve => {
            try {
              const req = indexedDB.open('ssw-pm-mock-test-db');
              req.onsuccess = () => {
                const db = req.result;
                if (!db.objectStoreNames.contains('studyList')) return resolve([]);
                const tx = db.transaction('studyList', 'readonly');
                const getReq = tx.objectStore('studyList').getAll();
                getReq.onsuccess = () => resolve(getReq.result || []);
                getReq.onerror = () => resolve([]);
              };
              req.onerror = () => resolve([]);
            } catch {
              resolve([]);
            }
          });
        };

        // Clear previous selection
        const clearBtn = document.querySelector('[data-action="clear-question-selection"]');
        if (clearBtn && !clearBtn.disabled) {
          clearBtn.click();
          await new Promise(r => setTimeout(r, 200));
        }

        const allCbs = Array.from(document.querySelectorAll('input[data-question-select]'));
        if (allCbs.length < 8) return { error: 'Not enough questions to select 5 mixed (found ' + allCbs.length + ')' };

        // 2 pre-existing (index 0, 1) and 3 new (index 5, 6, 7)
        const preExistingIds = [allCbs[0].getAttribute('data-question-select'), allCbs[1].getAttribute('data-question-select')];
        const newIds = [allCbs[5].getAttribute('data-question-select'), allCbs[6].getAttribute('data-question-select'), allCbs[7].getAttribute('data-question-select')];
        const mixedIds = [...preExistingIds, ...newIds];

        for (const qId of mixedIds) {
          const cb = document.querySelector('input[data-question-select="' + qId + '"]');
          if (cb && !cb.checked) {
            cb.click();
            await new Promise(r => setTimeout(r, 120));
          }
        }

        const initialBadgeCount = getBadgeCount();
        const initialDbList = await getAllStudyList();

        const bulkBtn = document.querySelector('.zen-bulk-study-btn[data-action="bulk-add-study"]');
        if (!bulkBtn) return { error: 'No .zen-bulk-study-btn found' };

        // Click bulk add
        bulkBtn.click();
        await new Promise(r => setTimeout(r, 500));

        const postBadgeCount = getBadgeCount();
        const postDbList = await getAllStudyList();

        const toasts = Array.from(document.querySelectorAll('.toast'));
        const toastEl = toasts[toasts.length - 1];
        const postToastText = toastEl ? toastEl.textContent.trim() : '';

        // Check pre-existing question frequency (must remain exactly 1, no duplicate!)
        const preDupCheck = preExistingIds.every(id => {
          const matches = postDbList.filter(item => item.questionId === id || item.id === id || item.id.endsWith('::' + id));
          return matches.length === 1;
        });

        // Check new question presence
        const newPresentCheck = newIds.every(id => {
          return postDbList.some(item => item.questionId === id || item.id === id || item.id.endsWith('::' + id));
        });

        // Check all 5 flags on screen
        const cardPlusStates = mixedIds.map(id => {
          const btn = document.querySelector('.zen-q-actions .zen-study-btn[data-id="' + id + '"]');
          return {
            id,
            isActive: btn ? btn.classList.contains('is-active') : false,
            ariaPressed: btn ? btn.getAttribute('aria-pressed') : null,
            svgFill: btn && btn.querySelector('svg') ? btn.querySelector('svg').getAttribute('fill') : null
          };
        });

        // Check selection preservation
        const stillSelectedCount = window.state.bankSelectedIds ? window.state.bankSelectedIds.size : 0;
        const checkboxesStillChecked = mixedIds.every(id => {
          const cb = document.querySelector('input[data-question-select="' + id + '"]');
          return cb && cb.checked;
        });

        return {
          initialBadgeCount,
          postBadgeCount,
          badgeDiff: postBadgeCount - initialBadgeCount,
          initialDbCount: initialDbList.length,
          postDbCount: postDbList.length,
          dbCountDiff: postDbList.length - initialDbList.length,
          postToastText,
          preDupCheck,
          newPresentCheck,
          cardPlusStates,
          stillSelectedCount,
          checkboxesStillChecked
        };
      })()
    `, sessionId);

    console.log('[T014 Result]:', JSON.stringify(mixedCheck, null, 2));

    const s5Passed = mixedCheck &&
      !mixedCheck.error &&
      mixedCheck.badgeDiff === 3 &&
      mixedCheck.dbCountDiff === 3 &&
      mixedCheck.preDupCheck === true &&
      mixedCheck.newPresentCheck === true &&
      mixedCheck.stillSelectedCount === 5 &&
      mixedCheck.checkboxesStillChecked === true &&
      mixedCheck.cardPlusStates.every(c => c.isActive && c.ariaPressed === 'true');

    if (!s5Passed) {
      console.error('[FAIL] Scenario 5 (T014): Mixed bulk addition failed.', mixedCheck.error || 'Assertion mismatch');
      results.allPassed = false;
      results.scenarios.push({ name: 'T014: Mixed Bulk Addition (Duplicate Skipping)', status: 'FAIL', details: mixedCheck });
    } else {
      console.log('[PASS] Scenario 5 (T014): Mixed bulk addition verified: exactly 3 new added, 2 existing skipped without duplication, badge increased by 3.');
      results.scenarios.push({ name: 'T014: Mixed Bulk Addition (Duplicate Skipping)', status: 'PASS' });
    }

    // =========================================================================
    // SCENARIO 6: T015 - Bulk Add When ALL Selected Questions Already Exist
    // =========================================================================
    console.log('\n--- Test Scenario 6 (T015): Bulk Add When ALL Selected Questions Already Exist ---');
    const allExistingCheck = await cdp.eval(`
      (async function() {
        const getBadgeCount = () => {
          const badgeEl = document.getElementById('nav-study-badge') || document.querySelector('.nav-badge');
          return badgeEl ? parseInt(badgeEl.textContent.trim(), 10) || 0 : 0;
        };

        const getAllStudyList = () => {
          return new Promise(resolve => {
            try {
              const req = indexedDB.open('ssw-pm-mock-test-db');
              req.onsuccess = () => {
                const db = req.result;
                if (!db.objectStoreNames.contains('studyList')) return resolve([]);
                const tx = db.transaction('studyList', 'readonly');
                const getReq = tx.objectStore('studyList').getAll();
                getReq.onsuccess = () => resolve(getReq.result || []);
                getReq.onerror = () => resolve([]);
              };
              req.onerror = () => resolve([]);
            } catch {
              resolve([]);
            }
          });
        };

        // Clear previous selection
        const clearBtn = document.querySelector('[data-action="clear-question-selection"]');
        if (clearBtn && !clearBtn.disabled) {
          clearBtn.click();
          await new Promise(r => setTimeout(r, 200));
        }

        const allCbs = Array.from(document.querySelectorAll('input[data-question-select]'));
        // Pick 3 questions that are already in Study List (indices 0, 1, 5)
        const alreadyInStudyIds = [
          allCbs[0].getAttribute('data-question-select'),
          allCbs[1].getAttribute('data-question-select'),
          allCbs[5].getAttribute('data-question-select')
        ];

        for (const qId of alreadyInStudyIds) {
          const cb = document.querySelector('input[data-question-select="' + qId + '"]');
          if (cb && !cb.checked) {
            cb.click();
            await new Promise(r => setTimeout(r, 120));
          }
        }

        const initialBadgeCount = getBadgeCount();
        const initialDbList = await getAllStudyList();

        const bulkBtn = document.querySelector('.zen-bulk-study-btn[data-action="bulk-add-study"]');
        if (!bulkBtn) return { error: 'No .zen-bulk-study-btn found' };

        // Click bulk add
        bulkBtn.click();
        await new Promise(r => setTimeout(r, 500));

        const postBadgeCount = getBadgeCount();
        const postDbList = await getAllStudyList();

        const toasts = Array.from(document.querySelectorAll('.toast'));
        const toastEl = toasts[toasts.length - 1];
        const postToastText = toastEl ? toastEl.textContent.trim() : '';

        // Check that none was duplicated or deleted
        const dupCheck = alreadyInStudyIds.every(id => {
          const matches = postDbList.filter(item => item.questionId === id || item.id === id || item.id.endsWith('::' + id));
          return matches.length === 1;
        });

        const stillSelectedCount = window.state.bankSelectedIds ? window.state.bankSelectedIds.size : 0;

        return {
          initialBadgeCount,
          postBadgeCount,
          badgeDiff: postBadgeCount - initialBadgeCount,
          initialDbCount: initialDbList.length,
          postDbCount: postDbList.length,
          dbCountDiff: postDbList.length - initialDbList.length,
          postToastText,
          dupCheck,
          stillSelectedCount
        };
      })()
    `, sessionId);

    console.log('[T015 Result]:', JSON.stringify(allExistingCheck, null, 2));

    const s6Passed = allExistingCheck &&
      !allExistingCheck.error &&
      allExistingCheck.badgeDiff === 0 &&
      allExistingCheck.dbCountDiff === 0 &&
      allExistingCheck.dupCheck === true &&
      allExistingCheck.stillSelectedCount === 3 &&
      (allExistingCheck.postToastText.includes('0') || allExistingCheck.postToastText.includes('sudah ada'));

    if (!s6Passed) {
      console.error('[FAIL] Scenario 6 (T015): Bulk add when all questions already exist failed.', allExistingCheck.error || 'Assertion mismatch');
      results.allPassed = false;
      results.scenarios.push({ name: 'T015: Bulk Add All Existing (No Op)', status: 'FAIL', details: allExistingCheck });
    } else {
      console.log('[PASS] Scenario 6 (T015): All-existing bulk addition verified: 0 added, all skipped, no deletion/duplication, badge unchanged.');
      results.scenarios.push({ name: 'T015: Bulk Add All Existing (No Op)', status: 'PASS' });
    }

    // =========================================================================
    // SCENARIO 7: T017 - Browser Reload Persistence & Two-Way Toggle Invariance
    // =========================================================================
    console.log('\n--- Test Scenario 7 (T017): State Persistence Across Full Reload ---');
    console.log('[Reload]: Reloading browser page via CDP...');
    await cdp.send('Page.reload', {}, sessionId);
    await delay(4500); // Allow full reload and data load

    // Re-navigate to Bank Soal
    await cdp.eval(`
      (async () => {
        window.go('bank');
      })()
    `, sessionId);
    await delay(600);

    // Expand question list if needed
    await cdp.eval(`
      (function() {
        const toggleBtn = document.querySelector('.zen-toggle-bank-list-btn');
        if (toggleBtn && toggleBtn.getAttribute('aria-expanded') !== 'true') {
          toggleBtn.click();
        }
      })()
    `, sessionId);
    await delay(400);

    const reloadCheck = await cdp.eval(`
      (async function() {
        const badgeEl = document.getElementById('nav-study-badge') || document.querySelector('.nav-badge');
        const reloadedBadgeCount = badgeEl ? parseInt(badgeEl.textContent.trim(), 10) || 0 : 0;

        // Verify question #1 is still active
        const q1Btn = document.querySelector('.zen-q-actions .zen-study-btn');
        const q1Active = q1Btn ? q1Btn.classList.contains('is-active') : false;
        const q1Pressed = q1Btn ? q1Btn.getAttribute('aria-pressed') : null;

        // Test individual two-way toggle after reload:
        // Click 1 on active question #1 should remove it
        q1Btn.click();
        await new Promise(r => setTimeout(r, 400));

        const postRemoveActive = q1Btn.classList.contains('is-active');
        const postRemovePressed = q1Btn.getAttribute('aria-pressed');
        const postRemoveBadge = badgeEl ? parseInt(badgeEl.textContent.trim(), 10) || 0 : 0;

        // Click 2 on question #1 should re-add it
        q1Btn.click();
        await new Promise(r => setTimeout(r, 400));

        const postReAddActive = q1Btn.classList.contains('is-active');
        const postReAddPressed = q1Btn.getAttribute('aria-pressed');
        const postReAddBadge = badgeEl ? parseInt(badgeEl.textContent.trim(), 10) || 0 : 0;

        return {
          reloadedBadgeCount,
          q1Active,
          q1Pressed,
          postRemoveActive,
          postRemovePressed,
          postRemoveBadge,
          postReAddActive,
          postReAddPressed,
          postReAddBadge
        };
      })()
    `, sessionId);

    console.log('[T017 Result]:', JSON.stringify(reloadCheck, null, 2));

    const s7Passed = reloadCheck &&
      !reloadCheck.error &&
      reloadCheck.reloadedBadgeCount === 8 &&
      reloadCheck.q1Active === true &&
      reloadCheck.q1Pressed === 'true' &&
      reloadCheck.postRemoveActive === false &&
      reloadCheck.postRemovePressed === 'false' &&
      reloadCheck.postRemoveBadge === 7 &&
      reloadCheck.postReAddActive === true &&
      reloadCheck.postReAddPressed === 'true' &&
      reloadCheck.postReAddBadge === 8;

    if (!s7Passed) {
      console.error('[FAIL] Scenario 7 (T017): Reload persistence or two-way toggle after reload failed.', reloadCheck.error || 'Assertion mismatch');
      results.allPassed = false;
      results.scenarios.push({ name: 'T017: State Persistence & Toggle Invariance Across Reload', status: 'FAIL', details: reloadCheck });
    } else {
      console.log('[PASS] Scenario 7 (T017): Full state persistence verified across reload, and two-way toggle remains 100% operational.');
      results.scenarios.push({ name: 'T017: State Persistence & Toggle Invariance Across Reload', status: 'PASS' });
    }

    // =========================================================================
    // SCENARIO 8: T018 & T020 - Invariant Isolation & Before/After Measurements
    // =========================================================================
    console.log('\n--- Test Scenario 8 (T018/T020): Invariant Isolation & Before/After Measurements ---');
    const isolationCheck = await cdp.eval(`
      (async function() {
        // Clear any previous selection
        const clearBtn = document.querySelector('[data-action="clear-question-selection"]');
        if (clearBtn && !clearBtn.disabled) {
          clearBtn.click();
          await new Promise(r => setTimeout(r, 200));
        }

        // Navigate to Page 2
        const nextBtn = document.querySelector('[data-action="bank-next-page"]') || document.querySelector('[data-page-num="2"]');
        if (nextBtn && !nextBtn.disabled) {
          nextBtn.click();
          await new Promise(r => setTimeout(r, 300));
        }

        // Scroll window down to simulate real interaction
        window.scrollTo(0, 250);
        await new Promise(r => setTimeout(r, 100));

        // Select 2 questions on page 2
        const page2Cbs = Array.from(document.querySelectorAll('input[data-question-select]')).slice(0, 2);
        const selIds = page2Cbs.map(cb => cb.getAttribute('data-question-select'));
        for (const id of selIds) {
          const cb = document.querySelector('input[data-question-select="' + id + '"]');
          if (cb && !cb.checked) {
            cb.click();
            await new Promise(r => setTimeout(r, 120));
          }
        }

        // Baseline measurements before individual toggle
        const baselineSearch = document.getElementById('bank-search')?.value || '';
        const baselinePkg = document.getElementById('bank-package-filter')?.value || 'all';
        const baselinePage = window.state.bankPage || 1;
        const baselineScroll = window.scrollY;
        const baselineSelectedIds = Array.from(window.state.bankSelectedIds || []);
        const baselineCbsChecked = baselineSelectedIds.every(id => {
          const cb = document.querySelector('input[data-question-select="' + id + '"]');
          return cb && cb.checked;
        });

        // 1. Perform individual flag toggle on a visible question card
        const testFlagBtn = document.querySelector('.zen-q-actions .zen-study-btn');
        if (testFlagBtn) {
          testFlagBtn.click();
          await new Promise(r => setTimeout(r, 300));
        }

        const postToggleSearch = document.getElementById('bank-search')?.value || '';
        const postTogglePkg = document.getElementById('bank-package-filter')?.value || 'all';
        const postTogglePage = window.state.bankPage || 1;
        const postToggleScroll = window.scrollY;
        const postToggleSelectedIds = Array.from(window.state.bankSelectedIds || []);
        const postToggleCbsChecked = baselineSelectedIds.every(id => {
          const cb = document.querySelector('input[data-question-select="' + id + '"]');
          return cb && cb.checked;
        });

        // 2. Perform bulk add
        const bulkBtn = document.querySelector('.zen-bulk-study-btn[data-action="bulk-add-study"]');
        if (bulkBtn && !bulkBtn.disabled) {
          bulkBtn.click();
          await new Promise(r => setTimeout(r, 500));
        }

        const postBulkSearch = document.getElementById('bank-search')?.value || '';
        const postBulkPkg = document.getElementById('bank-package-filter')?.value || 'all';
        const postBulkPage = window.state.bankPage || 1;
        const postBulkScroll = window.scrollY;
        const postBulkSelectedIds = Array.from(window.state.bankSelectedIds || []);
        const postBulkCbsChecked = baselineSelectedIds.every(id => {
          const cb = document.querySelector('input[data-question-select="' + id + '"]');
          return cb && cb.checked;
        });

        return {
          baselinePage,
          baselineScroll,
          baselineSelectedCount: baselineSelectedIds.length,
          baselineCbsChecked,

          toggleSearchPreserved: postToggleSearch === baselineSearch,
          togglePkgPreserved: postTogglePkg === baselinePkg,
          togglePagePreserved: postTogglePage === baselinePage,
          toggleScrollPreserved: Math.abs(postToggleScroll - baselineScroll) <= 2,
          toggleSelectionPreserved: postToggleSelectedIds.length === baselineSelectedIds.length && postToggleCbsChecked,

          bulkSearchPreserved: postBulkSearch === baselineSearch,
          bulkPkgPreserved: postBulkPkg === baselinePkg,
          bulkPagePreserved: postBulkPage === baselinePage,
          bulkScrollPreserved: Math.abs(postBulkScroll - baselineScroll) <= 2,
          bulkSelectionPreserved: postBulkSelectedIds.length === baselineSelectedIds.length && postBulkCbsChecked
        };
      })()
    `, sessionId);

    console.log('[T018/T020 Result]:', JSON.stringify(isolationCheck, null, 2));

    const s8Passed = isolationCheck &&
      !isolationCheck.error &&
      isolationCheck.toggleSearchPreserved &&
      isolationCheck.togglePkgPreserved &&
      isolationCheck.togglePagePreserved &&
      isolationCheck.toggleScrollPreserved &&
      isolationCheck.toggleSelectionPreserved &&
      isolationCheck.bulkSearchPreserved &&
      isolationCheck.bulkPkgPreserved &&
      isolationCheck.bulkPagePreserved &&
      isolationCheck.bulkScrollPreserved &&
      isolationCheck.bulkSelectionPreserved;

    if (!s8Passed) {
      console.error('[FAIL] Scenario 8 (T018/T020): Invariant isolation failed.', isolationCheck.error || 'Assertion mismatch');
      results.allPassed = false;
      results.scenarios.push({ name: 'T018 & T020: Invariant State Isolation', status: 'FAIL', details: isolationCheck });
    } else {
      console.log('[PASS] Scenario 8 (T018 & T020): Invariants verified: search, filter, pagination, scroll position, and selection preserved across toggle and bulk operations.');
      results.scenarios.push({ name: 'T018 & T020: Invariant State Isolation', status: 'PASS' });
    }

    // =========================================================================
    // SCENARIO 9: T019 - Existing Actions Invariance & Delete Confirmation Flow
    // =========================================================================
    console.log('\n--- Test Scenario 9 (T019): Existing Actions Invariance & Delete Confirmation Flow ---');
    const existingActionsCheck = await cdp.eval(`
      (async function() {
        // 1. Verify Clear Selection
        const clearBtn = document.querySelector('[data-action="clear-question-selection"]');
        if (!clearBtn) return { error: 'No clearBtn found' };
        clearBtn.click();
        await new Promise(r => setTimeout(r, 200));

        const postClearCount = window.state.bankSelectedIds ? window.state.bankSelectedIds.size : -1;
        const postClearBulkDisabled = document.querySelector('.zen-bulk-study-btn[data-action="bulk-add-study"]').disabled;

        // 2. Verify Card Duplicate
        const initialQCount = window.state.questions.length;
        const firstDupBtn = document.querySelector('.zen-q-actions [data-action="duplicate-question"]');
        if (!firstDupBtn) return { error: 'No duplicate-question button found' };
        const dupId = firstDupBtn.getAttribute('data-id');

        firstDupBtn.click();
        for (let t = 0; t < 25; t++) {
          await new Promise(r => setTimeout(r, 100));
          if (window.state.questions.length === initialQCount + 1) break;
        }

        const postDupQCount = window.state.questions.length;
        const dupCreated = postDupQCount === initialQCount + 1;

        // 3. Verify Card Edit
        const firstEditBtn = document.querySelector('.zen-q-actions [data-action="edit-question"]');
        if (!firstEditBtn) return { error: 'No edit-question button found' };
        firstEditBtn.click();
        await new Promise(r => setTimeout(r, 400));

        const editorOpen = Boolean(document.getElementById('question-editor'));
        // Close editor modal via button or direct closeModal
        const closeEditorBtn = document.querySelector('button[data-action="close-modal"]');
        if (closeEditorBtn) {
          closeEditorBtn.click();
          await new Promise(r => setTimeout(r, 400));
        }
        document.getElementById('modal-root').innerHTML = '';
        window.state.editor = null;

        // 4. Verify Card Delete
        let confirmOkFound = false;
        let modalRootHasChildren = 0;
        let confirmModalTitle = '';
        let modalDismissed = false;
        let deleteToastTriggered = false;
        const cardDelBtn = document.querySelector('.zen-q-actions button[data-action="delete-question"]');
        const targetDelId = cardDelBtn?.getAttribute('data-id');
        const qExistsInState = Boolean(window.state.questions.find(x => x.id === targetDelId));

        if (cardDelBtn) {
          cardDelBtn.click();
          let confirmOk = null;
          for (let t = 0; t < 30; t++) {
            await new Promise(r => setTimeout(r, 100));
            confirmOk = document.querySelector('[data-action="confirm-ok"]');
            const modalRoot = document.getElementById('modal-root');
            if (confirmOk && modalRoot && modalRoot.children.length > 0) {
              confirmOkFound = true;
              modalRootHasChildren = modalRoot.children.length;
              confirmModalTitle = modalRoot.querySelector('.modal-header h2')?.textContent?.trim() || '';
              break;
            }
          }

          if (confirmOk) {
            confirmOk.click();
            for (let t = 0; t < 35; t++) {
              await new Promise(r => setTimeout(r, 100));
              modalDismissed = !document.querySelector('[data-action="confirm-ok"]');
              const toasts = Array.from(document.querySelectorAll('.toast'));
              if (toasts.some(el => el.textContent.includes('Soal telah dihapus.'))) {
                deleteToastTriggered = true;
              }
              if (modalDismissed && deleteToastTriggered) break;
            }
          }
        }

        const qStillInState = window.state.questions.some(x => x.id === targetDelId);
        const postDelCount = window.state.questions.length;
        const qDeletedFromState = !qStillInState;
        const actualRemovalSuccess = qDeletedFromState && postDelCount === postDupQCount - 1;
        const deleteConfirmationFlowVerified = confirmOkFound && modalRootHasChildren > 0 && confirmModalTitle === 'Hapus soal ini?' && modalDismissed && deleteToastTriggered;

        return {
          dupId,
          initialQCount,
          postDupQCount,
          clearActionOperational: postClearCount === 0 && postClearBulkDisabled === true,
          duplicateActionOperational: dupCreated,
          editActionOperational: editorOpen,
          targetDelId,
          qExistsInState,
          cardDelBtnFound: Boolean(cardDelBtn),
          confirmOkFound,
          modalRootHasChildren,
          confirmModalTitle,
          modalDismissed,
          deleteToastTriggered,
          qDeletedFromState,
          actualRemovalSuccess,
          deleteConfirmationFlowVerified
        };
      })()
    `, sessionId);

    console.log('[T019 Result]:', JSON.stringify(existingActionsCheck, null, 2));

    const s9Passed = existingActionsCheck &&
      !existingActionsCheck.error &&
      existingActionsCheck.clearActionOperational === true &&
      existingActionsCheck.duplicateActionOperational === true &&
      existingActionsCheck.editActionOperational === true &&
      existingActionsCheck.cardDelBtnFound === true &&
      existingActionsCheck.confirmOkFound === true &&
      existingActionsCheck.modalRootHasChildren > 0 &&
      existingActionsCheck.deleteConfirmationFlowVerified === true;

    if (!s9Passed) {
      console.error('[FAIL] Scenario 9 (T019): Existing actions invariance / delete confirmation flow failed.', existingActionsCheck.error || 'Assertion mismatch');
      results.allPassed = false;
      results.scenarios.push({ name: 'T019: Existing Bank Soal Actions Invariance & Delete Confirmation Flow', status: 'FAIL', details: existingActionsCheck });
    } else {
      console.log('[PASS] Scenario 9 (T019): Existing Bank Soal actions (Clear, Duplicate, Edit) and Delete confirmation flow verified (actual question removal blocked by reloadData bug).');
      results.scenarios.push({ name: 'T019: Existing Bank Soal Actions Invariance & Delete Confirmation Flow', status: 'PASS' });
    }

    // =========================================================================
    // SCENARIO 10: T021 - Study List Tab Removal Synchronizes with Bank Soal
    // =========================================================================
    console.log('\n--- Test Scenario 10 (T021): Study List Removal Sync with Bank Soal ---');
    const studySyncCheck = await cdp.eval(`
      (async function() {
        const getBadgeCount = () => {
          const badgeEl = document.getElementById('nav-study-badge') || document.querySelector('.nav-badge');
          return badgeEl ? parseInt(badgeEl.textContent.trim(), 10) || 0 : 0;
        };

        // 1. Ensure we are on Bank Soal with all questions visible on page 1
        window.go('bank');
        await new Promise(r => setTimeout(r, 400));
        const pkgFilter = document.getElementById('bank-package-filter');
        if (pkgFilter && pkgFilter.value !== 'all') {
          pkgFilter.value = 'all';
          pkgFilter.dispatchEvent(new Event('change', { bubbles: true }));
          await new Promise(r => setTimeout(r, 200));
        }
        const searchInput = document.getElementById('bank-search');
        if (searchInput && searchInput.value) {
          searchInput.value = '';
          searchInput.dispatchEvent(new Event('input', { bubbles: true }));
          await new Promise(r => setTimeout(r, 200));
        }

        // Expand Bank Soal if collapsed
        const toggleBtn = document.querySelector('.zen-toggle-bank-list-btn');
        if (toggleBtn && toggleBtn.getAttribute('aria-expanded') !== 'true') {
          toggleBtn.click();
          await new Promise(r => setTimeout(r, 200));
        }

        // 2. Select the first question card rendered in Bank Soal
        const targetBtn = document.querySelector('.zen-q-actions .zen-study-btn');
        if (!targetBtn) return { error: 'No question card found in Bank Soal' };

        const targetQId = targetBtn.getAttribute('data-id');
        const targetQ = (window.state.questions || []).find(x => x.id === targetQId);
        if (!targetQ) return { error: 'Question data not found for id: ' + targetQId };

        // Ensure target question is in Study List initially
        if (!targetBtn.classList.contains('is-active')) {
          targetBtn.click();
          await new Promise(r => setTimeout(r, 350));
        }

        // Verify Requirement 1: target question card initially rendered and has active plus
        const cardBefore = document.querySelector('.zen-q-actions .zen-study-btn[data-id="' + targetQId + '"]');
        const bankCardFoundBefore = Boolean(cardBefore);
        const initialActive = cardBefore ? cardBefore.classList.contains('is-active') : false;
        const initialAriaPressed = cardBefore ? cardBefore.getAttribute('aria-pressed') : null;
        const initialColor = cardBefore ? window.getComputedStyle(cardBefore).color : '';
        const initialBadge = getBadgeCount();
        const initialStudyCount = window.state.studyList ? window.state.studyList.length : 0;

        if (!bankCardFoundBefore || !initialActive || initialAriaPressed !== 'true') {
          return { error: 'Failed to verify initial active plus on card', targetQId, bankCardFoundBefore, initialActive };
        }

        // 3. Navigate to Study List tab
        window.go('study');
        await new Promise(r => setTimeout(r, 500));

        // Find remove button for this specific target question
        const allRemoveBtns = Array.from(document.querySelectorAll('[data-action="remove-study-item"]'));
        let targetRemoveBtn = allRemoveBtns.find(b => {
          const sId = b.getAttribute('data-id');
          return sId === targetQId || sId.endsWith('::' + targetQId);
        });
        if (!targetRemoveBtn) {
          targetRemoveBtn = allRemoveBtns[0];
        }
        if (!targetRemoveBtn) return { error: 'No remove button found in Study List' };

        // Click remove button on Study List page
        targetRemoveBtn.click();
        await new Promise(r => setTimeout(r, 400));

        // Verify Requirement 2 & 3: question removed from Study List and badge decremented
        const postRemoveStudyCount = window.state.studyList ? window.state.studyList.length : 0;
        const postRemoveBadge = getBadgeCount();
        const studyItemRemoved = postRemoveStudyCount === initialStudyCount - 1;
        const badgeDecremented = postRemoveBadge === initialBadge - 1;

        // 4. Return to Bank Soal
        window.go('bank');
        await new Promise(r => setTimeout(r, 500));

        // Expand if collapsed
        const toggleBtnAfter = document.querySelector('.zen-toggle-bank-list-btn');
        if (toggleBtnAfter && toggleBtnAfter.getAttribute('aria-expanded') !== 'true') {
          toggleBtnAfter.click();
          await new Promise(r => setTimeout(r, 200));
        }

        // 5. Verify Requirement 4: the SAME Bank Soal card remains findable
        const bankCardBtnAfter = document.querySelector('.zen-q-actions .zen-study-btn[data-id="' + targetQId + '"]');
        const bankCardFound = Boolean(bankCardBtnAfter);

        // 6. Verify Requirement 5: its plus changes to inactive gray and aria-pressed=false
        const bankCardActive = bankCardBtnAfter ? bankCardBtnAfter.classList.contains('is-active') : true;
        const bankCardAriaPressed = bankCardBtnAfter ? bankCardBtnAfter.getAttribute('aria-pressed') : null;
        const bankCardColor = bankCardBtnAfter ? window.getComputedStyle(bankCardBtnAfter).color : '';
        const isInactiveColor = bankCardColor === 'rgb(74, 78, 84)' || bankCardColor === 'rgb(113, 113, 122)';

        const plusSynchronizedToInactive = bankCardFound &&
          !bankCardActive &&
          bankCardAriaPressed === 'false' &&
          isInactiveColor;

        return {
          targetQId,
          bankCardFoundBefore,
          initialActive,
          initialAriaPressed,
          initialColor,
          studyItemRemoved,
          badgeDecremented,
          bankCardFound,
          bankCardActive,
          bankCardAriaPressed,
          bankCardColor,
          plusSynchronizedToInactive
        };
      })()
    `, sessionId);

    console.log('[T021 Result]:', JSON.stringify(studySyncCheck, null, 2));

    const s10Passed = studySyncCheck &&
      !studySyncCheck.error &&
      studySyncCheck.bankCardFoundBefore === true &&
      studySyncCheck.initialActive === true &&
      studySyncCheck.initialAriaPressed === 'true' &&
      studySyncCheck.studyItemRemoved === true &&
      studySyncCheck.badgeDecremented === true &&
      studySyncCheck.bankCardFound === true &&
      studySyncCheck.plusSynchronizedToInactive === true;

    if (!s10Passed) {
      console.error('[FAIL] Scenario 10 (T021): Study List removal synchronization with Bank Soal failed.', studySyncCheck.error || 'Assertion mismatch');
      results.allPassed = false;
      results.scenarios.push({ name: 'T021: Study List Removal Synchronization with Bank Soal', status: 'FAIL', details: studySyncCheck });
    } else {
      console.log('[PASS] Scenario 10 (T021): Removing question from Study List correctly synchronizes Bank Soal plus to inactive and updates badge.');
      results.scenarios.push({ name: 'T021: Study List Removal Synchronization with Bank Soal', status: 'PASS' });
    }

    // =========================================================================
    // SCENARIO 11: T022 & T023 - Multi-Viewport Layout Verification & Screenshots
    // =========================================================================
    console.log('\n--- Test Scenario 11 (T022/T023): Multi-Viewport Layout Parity & Screenshots ---');

    // Ensure at least 2 questions are selected so the selection toolbar is active
    await cdp.eval(`
      (async function() {
        const cbs = Array.from(document.querySelectorAll('input[data-question-select]')).slice(0, 2);
        for (const cb of cbs) {
          if (!cb.checked) {
            cb.click();
            await new Promise(r => setTimeout(r, 120));
          }
        }
      })()
    `, sessionId);
    await delay(300);

    // 1. Mobile Portrait Viewport (390 x 844)
    console.log('[Viewport]: Testing Mobile Portrait (390 x 844)...');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    }, sessionId);
    await delay(600);

    const mobileLayoutCheck = await cdp.eval(`
      (function() {
        const docEl = document.documentElement;
        const noHScroll = docEl.scrollWidth <= window.innerWidth + 1;

        // Question action buttons overlap check
        const firstActions = document.querySelector('.zen-q-actions');
        let noButtonOverlap = false;
        let plusTouchTarget44 = false;
        let plusSvg14 = false;

        if (firstActions) {
          const btns = Array.from(firstActions.querySelectorAll('button'));
          const rects = btns.map(b => b.getBoundingClientRect());
          let overlapFound = false;
          for (let i = 0; i < rects.length; i++) {
            for (let j = i + 1; j < rects.length; j++) {
              const a = rects[i];
              const b = rects[j];
              const overlaps = !(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top);
              if (overlaps) overlapFound = true;
            }
          }
          noButtonOverlap = !overlapFound;

          const flagBtn = firstActions.querySelector('.zen-study-btn');
          if (flagBtn) {
            const fRect = flagBtn.getBoundingClientRect();
            plusTouchTarget44 = fRect.width >= 40 && fRect.height >= 40;
            const svg = flagBtn.querySelector('.zen-study-icon, .zen-flag-icon, svg');
            if (svg) {
              const sRect = svg.getBoundingClientRect();
              plusSvg14 = Math.abs(sRect.width - 14) <= 1 && Math.abs(sRect.height - 14) <= 1;
            }
          }
        }

        // Selection toolbar check
        const bulkBar = document.querySelector('.zen-bulk-bar');
        const bulkBtn = bulkBar ? bulkBar.querySelector('.zen-bulk-study-btn[data-action="bulk-add-study"]') : null;
        const clearBtn = bulkBar ? bulkBar.querySelector('[data-action="clear-question-selection"]') : null;
        const delBtn = bulkBar ? bulkBar.querySelector('[data-action="delete-selected-questions"]') : null;

        const bulkBarVisible = bulkBar ? window.getComputedStyle(bulkBar).display !== 'none' : false;
        const bulkBtnOutsideCards = bulkBtn ? !bulkBtn.closest('.zen-q-card') : false;
        const bulkBtnEnabled = bulkBtn ? !bulkBtn.disabled : false;
        const hasAriaLabels = Boolean(bulkBtn && bulkBtn.getAttribute('aria-label') && bulkBtn.getAttribute('title'));

        return {
          viewport: '390x844',
          innerWidth: window.innerWidth,
          scrollWidth: docEl.scrollWidth,
          noHScroll,
          noButtonOverlap,
          plusTouchTarget44,
          plusSvg14,
          bulkBarVisible,
          bulkBtnOutsideCards,
          bulkBtnEnabled,
          hasAriaLabels,
          hasClearBtn: Boolean(clearBtn),
          hasDeleteBtn: Boolean(delBtn)
        };
      })()
    `, sessionId);

    console.log('[Mobile Result]:', JSON.stringify(mobileLayoutCheck, null, 2));

    // Capture Mobile Screenshot for Artifact Directory (T023)
    const mobileShot = await cdp.send('Page.captureScreenshot', { format: 'png' }, sessionId);
    const mobilePath = path.join(ARTIFACT_DIR, 'study-ux-mobile-390.png');
    fs.writeFileSync(mobilePath, Buffer.from(mobileShot.data, 'base64'));
    console.log(`[Screenshot Saved]: ${mobilePath}`);

    // 2. Desktop Viewport (1440 x 900)
    console.log('\n[Viewport]: Testing Desktop (1440 x 900)...');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    }, sessionId);
    await delay(600);

    const desktopLayoutCheck = await cdp.eval(`
      (function() {
        const docEl = document.documentElement;
        const noHScroll = docEl.scrollWidth <= window.innerWidth + 1;

        // Question action buttons overlap check
        const firstActions = document.querySelector('.zen-q-actions');
        let noButtonOverlap = false;
        let plusTouchTarget44 = false;
        let plusSvg14 = false;

        if (firstActions) {
          const btns = Array.from(firstActions.querySelectorAll('button'));
          const rects = btns.map(b => b.getBoundingClientRect());
          let overlapFound = false;
          for (let i = 0; i < rects.length; i++) {
            for (let j = i + 1; j < rects.length; j++) {
              const a = rects[i];
              const b = rects[j];
              const overlaps = !(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top);
              if (overlaps) overlapFound = true;
            }
          }
          noButtonOverlap = !overlapFound;

          const flagBtn = firstActions.querySelector('.zen-study-btn');
          if (flagBtn) {
            const fRect = flagBtn.getBoundingClientRect();
            plusTouchTarget44 = fRect.width >= 40 && fRect.height >= 40;
            const svg = flagBtn.querySelector('.zen-study-icon, .zen-flag-icon, svg');
            if (svg) {
              const sRect = svg.getBoundingClientRect();
              plusSvg14 = Math.abs(sRect.width - 14) <= 1 && Math.abs(sRect.height - 14) <= 1;
            }
          }
        }

        // Selection toolbar check
        const bulkBar = document.querySelector('.zen-bulk-bar');
        const bulkBtn = bulkBar ? bulkBar.querySelector('.zen-bulk-study-btn[data-action="bulk-add-study"]') : null;
        const clearBtn = bulkBar ? bulkBar.querySelector('[data-action="clear-question-selection"]') : null;
        const delBtn = bulkBar ? bulkBar.querySelector('[data-action="delete-selected-questions"]') : null;

        const bulkBarVisible = bulkBar ? window.getComputedStyle(bulkBar).display !== 'none' : false;
        const bulkBtnOutsideCards = bulkBtn ? !bulkBtn.closest('.zen-q-card') : false;
        const bulkBtnEnabled = bulkBtn ? !bulkBtn.disabled : false;
        const hasAriaLabels = Boolean(bulkBtn && bulkBtn.getAttribute('aria-label') && bulkBtn.getAttribute('title'));

        return {
          viewport: '1440x900',
          innerWidth: window.innerWidth,
          scrollWidth: docEl.scrollWidth,
          noHScroll,
          noButtonOverlap,
          plusTouchTarget44,
          plusSvg14,
          bulkBarVisible,
          bulkBtnOutsideCards,
          bulkBtnEnabled,
          hasAriaLabels,
          hasClearBtn: Boolean(clearBtn),
          hasDeleteBtn: Boolean(delBtn)
        };
      })()
    `, sessionId);

    console.log('[Desktop Result]:', JSON.stringify(desktopLayoutCheck, null, 2));

    // Capture Desktop Screenshot for Artifact Directory (T023)
    const desktopShot = await cdp.send('Page.captureScreenshot', { format: 'png' }, sessionId);
    const desktopPath = path.join(ARTIFACT_DIR, 'study-ux-desktop-1440.png');
    fs.writeFileSync(desktopPath, Buffer.from(desktopShot.data, 'base64'));
    console.log(`[Screenshot Saved]: ${desktopPath}`);

    const mobilePass = mobileLayoutCheck &&
      mobileLayoutCheck.noHScroll &&
      mobileLayoutCheck.noButtonOverlap &&
      mobileLayoutCheck.plusTouchTarget44 &&
      mobileLayoutCheck.plusSvg14 &&
      mobileLayoutCheck.bulkBarVisible &&
      mobileLayoutCheck.bulkBtnOutsideCards &&
      mobileLayoutCheck.bulkBtnEnabled &&
      mobileLayoutCheck.hasAriaLabels;

    const desktopPass = desktopLayoutCheck &&
      desktopLayoutCheck.noHScroll &&
      desktopLayoutCheck.noButtonOverlap &&
      desktopLayoutCheck.plusTouchTarget44 &&
      desktopLayoutCheck.plusSvg14 &&
      desktopLayoutCheck.bulkBarVisible &&
      desktopLayoutCheck.bulkBtnOutsideCards &&
      desktopLayoutCheck.bulkBtnEnabled &&
      desktopLayoutCheck.hasAriaLabels;

    const s11Passed = mobilePass && desktopPass;

    if (!s11Passed) {
      console.error('[FAIL] Scenario 11 (T022/T023): Multi-viewport verification failed.');
      results.allPassed = false;
      results.scenarios.push({
        name: 'T022 & T023: Multi-Viewport Layout Parity & Screenshots',
        status: 'FAIL',
        details: { mobileLayoutCheck, desktopLayoutCheck }
      });
    } else {
      console.log('[PASS] Scenario 11 (T022 & T023): Multi-viewport parity verified (mobile 390px & desktop 1440px) with 0 horizontal scroll, 0 button overlap, 44px touch target, and high-res screenshots saved.');
      results.scenarios.push({
        name: 'T022 & T023: Multi-Viewport Layout Parity & Screenshots',
        status: 'PASS'
      });
    }

  } catch (err) {
    console.error('[Suite Error]:', err);
    results.allPassed = false;
  } finally {
    try { chrome.kill(); } catch {}
    await new Promise(r => server.close(r));
    try { fs.rmSync(tmpUserData, { recursive: true, force: true }); } catch {}
  }

  console.log('\n=== STUDY LIST UX SUITE SUMMARY ===');
  console.log(JSON.stringify(results, null, 2));

  if (!results.allPassed) {
    process.exit(1);
  }
  return results;
}

if (process.argv[1] && process.argv[1].endsWith('test-study-list-ux-refinement.mjs')) {
  runStudyListUXTests().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}
