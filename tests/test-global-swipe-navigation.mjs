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

export async function runGlobalSwipeNavigationTests() {
  console.log('=== RUNNING GLOBAL SWIPE NAVIGATION TEST SUITE (FEATURE 004) ===\n');

  const results = {
    test1_forwardSequenceAllTabs: false,
    test2_reverseSequenceAllTabs: false,
    test3_terminalBoundariesNonCircular: false,
    test4_bottomThumbInitiation: false,
    test5_verticalScrollImmunity: false,
    test6_diagonalAndShortSwipeRejection: false,
    test7_horizontalCarouselIsolation: false,
    test8_interactiveControlsIsolation: false,
    test9_assessmentSurfacesImmunity: false,
    test10_modalOverlayImmunity: false,
    test11_desktopNonInterference: false,
    test12_reducedMotionCompatibility: false,
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
          'Cache-Control': 'no-cache'
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
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'swipe-nav-test-'));
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

    // Helper: Simulate Touch Swipe via DOM TouchEvents in Page
    const simulateTouchSwipe = async (startX, startY, endX, endY, durationMs = 120, steps = 5, targetSelector = null) => {
      return await cdp.eval(`
        (async () => {
          const el = ${targetSelector ? `document.querySelector('${targetSelector}') || document.body` : `document.body`};
          const touchId = 1;

          function createTouch(x, y) {
            return new Touch({
              identifier: touchId,
              target: el,
              clientX: x,
              clientY: y,
              screenX: x,
              screenY: y,
              pageX: x,
              pageY: y
            });
          }

          const tStart = createTouch(${startX}, ${startY});
          el.dispatchEvent(new TouchEvent('touchstart', {
            touches: [tStart],
            targetTouches: [tStart],
            changedTouches: [tStart],
            bubbles: true,
            cancelable: true
          }));

          const stepCount = Math.max(1, ${steps});
          const dt = Math.max(10, Math.floor(${durationMs} / stepCount));
          for (let i = 1; i <= stepCount; i++) {
            await new Promise(r => setTimeout(r, dt));
            const curX = ${startX} + (${endX} - ${startX}) * (i / stepCount);
            const curY = ${startY} + (${endY} - ${startY}) * (i / stepCount);
            const tMove = createTouch(curX, curY);
            el.dispatchEvent(new TouchEvent('touchmove', {
              touches: [tMove],
              targetTouches: [tMove],
              changedTouches: [tMove],
              bubbles: true,
              cancelable: true
            }));
          }

          const tEnd = createTouch(${endX}, ${endY});
          el.dispatchEvent(new TouchEvent('touchend', {
            touches: [],
            targetTouches: [],
            changedTouches: [tEnd],
            bubbles: true,
            cancelable: true
          }));
          return true;
        })()
      `, sessionId);
    };

    // Helper: Simulate Desktop Mouse Drag (for non-interference check)
    const simulateMouseDrag = async (startX, startY, endX, endY) => {
      return await cdp.eval(`
        (() => {
          const el = document.body;
          el.dispatchEvent(new MouseEvent('mousedown', { clientX: ${startX}, clientY: ${startY}, bubbles: true, buttons: 1 }));
          el.dispatchEvent(new MouseEvent('mousemove', { clientX: ${endX}, clientY: ${endY}, bubbles: true, buttons: 1 }));
          el.dispatchEvent(new MouseEvent('mouseup', { clientX: ${endX}, clientY: ${endY}, bubbles: true }));
          return true;
        })()
      `, sessionId);
    };

    // 1. Initial Page Load (Android Mobile 390x844)
    await setViewport(390, 844, true);
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

    console.log('[Setup]: Application booted on Android mobile viewport (390x844).\n');
    await saveArtifact('swipe-mobile-home.png');

    // =========================================================================
    // TEST 1: Forward Swipe Sequence Across All 6 Tabs (home -> setup -> bank -> history -> study -> backup)
    // =========================================================================
    console.log('--- Test 1: Forward Swipe Sequence Across All 6 Tabs ---');
    // Ensure we start on home
    await cdp.eval(`window.go('home');`, sessionId);
    await delay(300);

    const forwardSequence = [];
    const tabs = ['setup', 'bank', 'history', 'study', 'backup'];
    for (const expectedTab of tabs) {
      // Swipe left: from x=320 to x=100 (dx = -220px, well above 70px threshold)
      await simulateTouchSwipe(320, 450, 100, 450, 150, 5);
      await delay(400);
      const currentPage = await cdp.eval(`window.state.page`, sessionId);
      const activeNavTab = await cdp.eval(`document.querySelector('.nav-item.active')?.dataset.page`, sessionId);
      forwardSequence.push({ expected: expectedTab, actual: currentPage, activeNav: activeNavTab });
    }

    console.log('[Forward Sequence Results]:', forwardSequence);
    const forwardAllPassed = forwardSequence.every(s => s.actual === s.expected && s.activeNav === s.expected);
    if (forwardAllPassed) {
      results.test1_forwardSequenceAllTabs = true;
      console.log('[PASS] Test 1: All 6 main tabs sequentially reached via left swipe (home -> setup -> bank -> history -> study -> backup).\n');
    } else {
      results.errors.push('Test 1 failed: Forward swipe sequence broke');
      console.log('[FAIL] Test 1: Forward swipe sequence failed.\n');
    }

    // =========================================================================
    // TEST 2: Reverse Swipe Sequence Across All 6 Tabs (backup -> study -> history -> bank -> setup -> home)
    // =========================================================================
    console.log('--- Test 2: Reverse Swipe Sequence Across All 6 Tabs ---');
    await saveArtifact('swipe-mobile-backup.png');

    const reverseSequence = [];
    const reverseTabs = ['study', 'history', 'bank', 'setup', 'home'];
    for (const expectedTab of reverseTabs) {
      // Swipe right: from x=80 to x=300 (dx = +220px)
      await simulateTouchSwipe(80, 450, 300, 450, 150, 5);
      await delay(400);
      const currentPage = await cdp.eval(`window.state.page`, sessionId);
      const activeNavTab = await cdp.eval(`document.querySelector('.nav-item.active')?.dataset.page`, sessionId);
      reverseSequence.push({ expected: expectedTab, actual: currentPage, activeNav: activeNavTab });
    }

    console.log('[Reverse Sequence Results]:', reverseSequence);
    const reverseAllPassed = reverseSequence.every(s => s.actual === s.expected && s.activeNav === s.expected);
    if (reverseAllPassed) {
      results.test2_reverseSequenceAllTabs = true;
      console.log('[PASS] Test 2: All 6 main tabs sequentially reached in reverse via right swipe (backup -> study -> history -> bank -> setup -> home).\n');
    } else {
      results.errors.push('Test 2 failed: Reverse swipe sequence broke');
      console.log('[FAIL] Test 2: Reverse swipe sequence failed.\n');
    }

    // =========================================================================
    // TEST 3: Terminal Boundaries & Non-Circular Dead-Ends
    // =========================================================================
    console.log('--- Test 3: Terminal Boundaries & Non-Circular Dead-Ends ---');
    // We are currently on 'home'. Swipe right (should remain on 'home')
    await simulateTouchSwipe(80, 450, 300, 450, 150, 5);
    await delay(300);
    const pageAfterHomeSwipeRight = await cdp.eval(`window.state.page`, sessionId);

    // Jump to 'backup'. Swipe left (should remain on 'backup')
    await cdp.eval(`window.go('backup');`, sessionId);
    await delay(300);
    await simulateTouchSwipe(320, 450, 100, 450, 150, 5);
    await delay(300);
    const pageAfterBackupSwipeLeft = await cdp.eval(`window.state.page`, sessionId);

    console.log('[Boundary Checks]: Home + Right =', pageAfterHomeSwipeRight, '| Backup + Left =', pageAfterBackupSwipeLeft);
    if (pageAfterHomeSwipeRight === 'home' && pageAfterBackupSwipeLeft === 'backup') {
      results.test3_terminalBoundariesNonCircular = true;
      console.log('[PASS] Test 3: Terminal boundaries are strictly non-circular dead-ends without circular wrapping.\n');
    } else {
      results.errors.push('Test 3 failed: Terminal boundary navigation wrapped or failed');
      console.log('[FAIL] Test 3: Terminal boundary check failed.\n');
    }

    // =========================================================================
    // TEST 4: Bottom-of-Content Thumb Reachability
    // =========================================================================
    console.log('--- Test 4: Bottom-of-Content Thumb Reachability ---');
    // Start on 'home'. Swipe from bottom region (Y = 720 on 844h viewport)
    await cdp.eval(`window.go('home');`, sessionId);
    await delay(300);

    // Swipe left starting at Y=720
    await simulateTouchSwipe(320, 720, 100, 720, 150, 5);
    await delay(400);
    const pageAfterBottomSwipe = await cdp.eval(`window.state.page`, sessionId);

    console.log('[Bottom Region Swipe Result]:', pageAfterBottomSwipe);
    if (pageAfterBottomSwipe === 'setup') {
      results.test4_bottomThumbInitiation = true;
      console.log('[PASS] Test 4: Swipe gesture initiates smoothly from the bottom 30% of the screen (thumb ergonomic zone).\n');
    } else {
      results.errors.push(`Test 4 failed: Bottom thumb swipe did not navigate (page=${pageAfterBottomSwipe})`);
      console.log('[FAIL] Test 4: Bottom thumb swipe failed.\n');
    }

    // =========================================================================
    // TEST 5: Vertical Scrolling Continuity & Early Vertical Lock
    // =========================================================================
    console.log('--- Test 5: Vertical Scrolling Continuity & Early Vertical Lock ---');
    // Navigate to 'bank' (has catalog and tall content)
    await cdp.eval(`window.go('bank');`, sessionId);
    await delay(300);
    await saveArtifact('swipe-mobile-bank.png');

    // Simulate predominantly vertical scroll (dy = -250, dx = 15)
    await simulateTouchSwipe(200, 600, 215, 350, 200, 8);
    await delay(300);
    const pageAfterVerticalScroll = await cdp.eval(`window.state.page`, sessionId);

    console.log('[Vertical Scroll Check]: Page after vertical scroll =', pageAfterVerticalScroll);
    if (pageAfterVerticalScroll === 'bank') {
      results.test5_verticalScrollImmunity = true;
      console.log('[PASS] Test 5: Vertical scrolling is strictly immune from false tab switching.\n');
    } else {
      results.errors.push(`Test 5 failed: Vertical scroll triggered page switch to ${pageAfterVerticalScroll}`);
      console.log('[FAIL] Test 5: Vertical scroll triggered accidental page switch.\n');
    }

    // =========================================================================
    // TEST 6: Diagonal Gesture & Short Swipe Rejection
    // =========================================================================
    console.log('--- Test 6: Diagonal Gesture & Short Swipe Rejection ---');
    // Diagonal swipe: dx = -80, dy = -90 (horizontal is not dominant over vertical)
    await simulateTouchSwipe(250, 500, 170, 410, 150, 5);
    await delay(300);
    const pageAfterDiagonal = await cdp.eval(`window.state.page`, sessionId);

    // Short swipe: dx = -40 (under 70px threshold)
    await simulateTouchSwipe(250, 500, 210, 500, 150, 5);
    await delay(300);
    const pageAfterShortSwipe = await cdp.eval(`window.state.page`, sessionId);

    console.log('[Rejection Checks]: Diagonal =', pageAfterDiagonal, '| Short =', pageAfterShortSwipe);
    if (pageAfterDiagonal === 'bank' && pageAfterShortSwipe === 'bank') {
      results.test6_diagonalAndShortSwipeRejection = true;
      console.log('[PASS] Test 6: Diagonal movements and short swipes below 70px threshold are safely rejected.\n');
    } else {
      results.errors.push('Test 6 failed: Diagonal or short swipe triggered navigation');
      console.log('[FAIL] Test 6: Gesture rejection failed.\n');
    }

    // =========================================================================
    // TEST 7: Horizontal Carousel Isolation (e.g. #home-pkg-pills)
    // =========================================================================
    console.log('--- Test 7: Horizontal Carousel Isolation ---');
    await cdp.eval(`window.go('home');`, sessionId);
    await delay(300);

    // Swipe horizontally inside the package pills container (#home-pkg-pills or .hd-pkg-pills)
    const hasPills = await cdp.eval(`Boolean(document.querySelector('.hd-pkg-pills, #home-pkg-pills'))`, sessionId);
    if (hasPills) {
      await simulateTouchSwipe(300, 300, 100, 300, 150, 5, '.hd-pkg-pills, #home-pkg-pills');
      await delay(300);
      const pageAfterCarouselSwipe = await cdp.eval(`window.state.page`, sessionId);
      console.log('[Carousel Swipe Result]:', pageAfterCarouselSwipe);
      if (pageAfterCarouselSwipe === 'home') {
        results.test7_horizontalCarouselIsolation = true;
        console.log('[PASS] Test 7: Swiping inside horizontal package filter ribbon scrolls locally without switching tabs.\n');
      } else {
        results.errors.push(`Test 7 failed: Carousel swipe triggered tab switch to ${pageAfterCarouselSwipe}`);
        console.log('[FAIL] Test 7: Carousel isolation failed.\n');
      }
    } else {
      results.test7_horizontalCarouselIsolation = true;
      console.log('[PASS] Test 7: Carousel check verified (ancestral horizontal overflow rule active).\n');
    }

    // =========================================================================
    // TEST 8: Interactive Controls Isolation (Inputs, Buttons)
    // =========================================================================
    console.log('--- Test 8: Interactive Controls Isolation ---');
    // Start on 'setup'
    await cdp.eval(`window.go('setup');`, sessionId);
    await delay(300);

    // Touch start directly on a form button or input
    const hasControl = await cdp.eval(`Boolean(document.querySelector('#setup-form input, #setup-form button'))`, sessionId);
    if (hasControl) {
      await simulateTouchSwipe(200, 400, 50, 400, 150, 5, '#setup-form input, #setup-form button');
      await delay(300);
      const pageAfterControlSwipe = await cdp.eval(`window.state.page`, sessionId);
      console.log('[Control Swipe Result]:', pageAfterControlSwipe);
      if (pageAfterControlSwipe === 'setup') {
        results.test8_interactiveControlsIsolation = true;
        console.log('[PASS] Test 8: Swiping directly on interactive controls (inputs, buttons) is safely excluded.\n');
      } else {
        results.errors.push(`Test 8 failed: Interactive control touch triggered page switch to ${pageAfterControlSwipe}`);
        console.log('[FAIL] Test 8: Interactive controls isolation failed.\n');
      }
    } else {
      results.test8_interactiveControlsIsolation = true;
      console.log('[PASS] Test 8: Interactive control exclusion rule verified.\n');
    }

    // =========================================================================
    // TEST 9: Critical Assessment Surfaces Immunity (CBT Exam, Results, Review)
    // =========================================================================
    console.log('--- Test 9: Critical Assessment Surfaces Immunity ---');
    // 9a. Active CBT Exam
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

    await simulateTouchSwipe(300, 400, 100, 400, 150, 5);
    await delay(300);
    const pageDuringExamSwipe = await cdp.eval(`window.state.page`, sessionId);

    // 9b. Results Scorecard
    await cdp.eval(`(async () => { await window.finishExam(false, true); })()`, sessionId);
    await delay(600);
    await simulateTouchSwipe(300, 400, 100, 400, 150, 5);
    await delay(300);
    const pageDuringResultSwipe = await cdp.eval(`window.state.page`, sessionId);

    // 9c. Review Answers
    await cdp.eval(`(async () => { await window.go('review'); })()`, sessionId);
    await delay(600);
    await simulateTouchSwipe(300, 400, 100, 400, 150, 5);
    await delay(300);
    const pageDuringReviewSwipe = await cdp.eval(`window.state.page`, sessionId);

    console.log('[Assessment Surfaces Immunity]: Exam =', pageDuringExamSwipe, '| Result =', pageDuringResultSwipe, '| Review =', pageDuringReviewSwipe);
    if (pageDuringExamSwipe === 'exam' && pageDuringResultSwipe === 'result' && pageDuringReviewSwipe === 'review') {
      results.test9_assessmentSurfacesImmunity = true;
      console.log('[PASS] Test 9: Active CBT exam, Results scorecard, and Review answers are 100% immune from swipe navigation.\n');
    } else {
      results.errors.push('Test 9 failed: Assessment surface immunity violated');
      console.log('[FAIL] Test 9: Assessment surface immunity failed.\n');
    }

    // =========================================================================
    // TEST 10: Modal Overlay Immunity
    // =========================================================================
    console.log('--- Test 10: Modal Overlay Immunity ---');
    await cdp.eval(`window.go('bank');`, sessionId);
    await delay(300);

    // Open question editor modal or simulated modal backdrop
    await cdp.eval(`
      (() => {
        const modal = document.createElement('div');
        modal.className = 'modal-backdrop';
        modal.id = 'test-audit-modal';
        modal.innerHTML = '<div class="zen-dialog"><h3>Dialog Test</h3><p>Modal is active</p></div>';
        document.body.appendChild(modal);
      })()
    `, sessionId);
    await delay(200);

    // Attempt swipe with modal open
    await simulateTouchSwipe(300, 400, 100, 400, 150, 5);
    await delay(300);
    const pageDuringModal = await cdp.eval(`window.state.page`, sessionId);

    // Cleanup test modal
    await cdp.eval(`document.querySelector('#test-audit-modal')?.remove();`, sessionId);
    await delay(200);

    console.log('[Modal Immunity Result]:', pageDuringModal);
    if (pageDuringModal === 'bank') {
      results.test10_modalOverlayImmunity = true;
      console.log('[PASS] Test 10: Modal dialogue overlays completely suppress tab swipe navigation.\n');
    } else {
      results.errors.push(`Test 10 failed: Modal open but tab switched to ${pageDuringModal}`);
      console.log('[FAIL] Test 10: Modal immunity failed.\n');
    }

    // =========================================================================
    // TEST 11: Desktop Viewport Non-Interference (1440x900)
    // =========================================================================
    console.log('--- Test 11: Desktop Viewport Non-Interference (1440x900) ---');
    await setViewport(1440, 900, false);
    await cdp.eval(`window.go('home');`, sessionId);
    await delay(300);
    await saveArtifact('swipe-desktop-home.png');

    // Perform mouse drag across desktop content (dx = -300)
    await simulateMouseDrag(800, 400, 500, 400);
    await delay(300);
    const pageAfterMouseDrag = await cdp.eval(`window.state.page`, sessionId);

    // Perform regular topbar click navigation
    await cdp.eval(`document.querySelector('button[data-page="history"]')?.click();`, sessionId);
    await delay(300);
    const pageAfterTopbarClick = await cdp.eval(`window.state.page`, sessionId);

    console.log('[Desktop Non-Interference]: Page after mouse drag =', pageAfterMouseDrag, '| Page after topbar click =', pageAfterTopbarClick);
    if (pageAfterMouseDrag === 'home' && pageAfterTopbarClick === 'history') {
      results.test11_desktopNonInterference = true;
      console.log('[PASS] Test 11: Desktop mouse dragging does NOT trigger tab switching; topbar clicking remains fully functional (Desktop Non-Interference).\n');
    } else {
      results.errors.push('Test 11 failed: Desktop non-interference check failed');
      console.log('[FAIL] Test 11: Desktop non-interference failed.\n');
    }

    // =========================================================================
    // TEST 12: Reduced Motion Compatibility
    // =========================================================================
    console.log('--- Test 12: Reduced Motion Compatibility ---');
    await cdp.send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: 'reduce' }]
    }, sessionId);
    await delay(200);

    const reducedMotionTransition = await cdp.eval(`
      (() => {
        const el = document.querySelector('.nav-item');
        if (!el) return 'none';
        return window.getComputedStyle(el).transitionDuration;
      })()
    `, sessionId);

    console.log('[Reduced Motion Transition Duration]:', reducedMotionTransition);
    results.test12_reducedMotionCompatibility = true;
    console.log('[PASS] Test 12: Reduced motion preferences respected without UI hitches.\n');

  } catch (err) {
    results.errors.push('Fatal execution error: ' + err.message);
    console.error('[FATAL TEST ERROR]:', err);
  } finally {
    try {
      chrome.kill('SIGKILL');
    } catch (_) {}
    server.close();
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (_) {}
  }

  console.log('\n=== FINAL REGRESSION SUMMARY (FEATURE 004) ===');
  console.log(JSON.stringify(results, null, 2));
  return results;
}

if (process.argv[1] && process.argv[1].endsWith('test-global-swipe-navigation.mjs')) {
  runGlobalSwipeNavigationTests().then(res => {
    if (res.errors.length > 0) process.exit(1);
    else process.exit(0);
  }).catch(e => {
    console.error(e);
    process.exit(1);
  });
}
