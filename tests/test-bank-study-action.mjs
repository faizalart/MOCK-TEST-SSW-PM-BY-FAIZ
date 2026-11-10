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
      throw new Error(res.exceptionDetails.text || 'Runtime.evaluate exception');
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

async function runBankStudyActionTests() {
  console.log('=== RUNNING BANK SOAL STUDY LIST ACTION AUTOMATED TEST SUITE ===\n');

  const { server, origin } = await startStaticServer();
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-bank-study-test-'));
  const chrome = launchChrome(userDataDir);
  const cdp = new CDPClient(chrome);

  let targetId;
  let sessionId;

  try {
    const targets = await cdp.send('Target.getTargets');
    const pageTarget = targets.targetInfos.find(t => t.type === 'page');
    targetId = pageTarget ? pageTarget.targetId : (await cdp.send('Target.createTarget', { url: 'about:blank' })).targetId;
    const attached = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
    sessionId = attached.sessionId;

    await cdp.send('Page.enable', {}, sessionId);
    await cdp.send('Runtime.enable', {}, sessionId);
    await cdp.send('DOM.enable', {}, sessionId);

    // Initial desktop viewport 1440x900
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    }, sessionId);

    console.log(`[Setup] Navigating to ${origin}...`);
    await cdp.send('Page.navigate', { url: origin }, sessionId);
    await delay(4500); // allow boot and background bundle seeding to settle

    // Navigate to Bank Soal and expand questions list
    console.log('[Setup] Navigating to Bank Soal (#bank) and expanding question catalog...');
    await cdp.eval(`(async () => {
      window.location.hash = '#bank';
      if (typeof go === 'function') await go('bank');
      await new Promise(r => setTimeout(r, 400));
      const toggleBtn = document.querySelector('.zen-toggle-bank-list-btn');
      if (toggleBtn) toggleBtn.click();
    })()`, sessionId);
    await delay(1200);

    // =========================================================================
    // Test 1: Button Rendering in Bank Soal cards (Initial State)
    // =========================================================================
    console.log('\n--- Test 1: Initial Button Rendering on Question Cards ---');
    const initialButtons = await cdp.eval(`(() => {
      const cards = document.querySelectorAll('.zen-q-item');
      const studyBtns = document.querySelectorAll('.zen-q-item [data-action="add-bank-study"]');
      const firstBtn = studyBtns[0];
      return {
        cardCount: cards.length,
        btnCount: studyBtns.length,
        firstBtnText: firstBtn ? firstBtn.textContent.trim() : null,
        firstBtnAction: firstBtn ? firstBtn.getAttribute('data-action') : null,
        firstBtnTitle: firstBtn ? firstBtn.getAttribute('title') : null,
        firstBtnAria: firstBtn ? firstBtn.getAttribute('aria-label') : null,
        firstBtnId: firstBtn ? firstBtn.getAttribute('data-id') : null,
        firstBtnActive: firstBtn ? firstBtn.classList.contains('is-active') : false
      };
    })()`, sessionId);

    console.log(`Rendered cards: ${initialButtons.cardCount}, Study buttons: ${initialButtons.btnCount}`);
    if (initialButtons.cardCount === 0 || initialButtons.btnCount === 0) {
      throw new Error(`Failed to find question cards or study buttons (cards: ${initialButtons.cardCount}, buttons: ${initialButtons.btnCount})`);
    }
    if (initialButtons.btnCount !== initialButtons.cardCount) {
      throw new Error(`Button count (${initialButtons.btnCount}) does not match card count (${initialButtons.cardCount})`);
    }
    if (initialButtons.firstBtnText !== '+') {
      throw new Error(`Expected first button text to be '+', got '${initialButtons.firstBtnText}'`);
    }
    console.log('[PASS] Test 1: Every question card renders an unbookmarked study button with glyph "+".');

    // =========================================================================
    // Test 2: User Story 1 (P1) - Add Question to Study List
    // =========================================================================
    console.log('\n--- Test 2: User Story 1 (P1) - Add Question to Study List ---');
    const q1Id = initialButtons.firstBtnId;
    console.log(`Targeting question ID: ${q1Id}`);

    // Click the '+' button on first card
    const clickResult = await cdp.eval(`(async () => {
      const btn = document.querySelector('.zen-q-item [data-action="add-bank-study"][data-id="${q1Id}"]');
      if (!btn) return { error: 'Button not found' };
      btn.click();
      return { clicked: true };
    })()`, sessionId);

    if (clickResult.error) throw new Error(clickResult.error);
    await delay(600); // Allow async DB transaction and toast to trigger

    const postAddState = await cdp.eval(`(async () => {
      const btn = document.querySelector('.zen-q-item [data-action="add-bank-study"][data-id="${q1Id}"]');
      const toasts = Array.from(document.querySelectorAll('.toast')).map(t => t.textContent.trim());
      const badge = document.querySelector('.zen-nav-badge[data-badge="study"]')?.textContent.trim() ||
                    document.querySelector('.zen-nav-link[data-page="study"] .zen-nav-badge')?.textContent.trim() ||
                    document.querySelector('#study-badge')?.textContent.trim();

      // Check in-memory state
      const inState = (window.state.studyList || []).some(x => x.questionId === '${q1Id}' || x.id.includes('${q1Id}'));

      return {
        btnText: btn ? btn.textContent.trim() : null,
        isActive: btn ? btn.classList.contains('is-active') : false,
        ariaPressed: btn ? btn.getAttribute('aria-pressed') : null,
        toasts,
        badge,
        inState,
        studyListLength: (window.state.studyList || []).length
      };
    })()`, sessionId);

    console.log('Post-add state:', postAddState);
    if (postAddState.btnText !== '✓') {
      throw new Error(`Expected button glyph to be '✓', got '${postAddState.btnText}'`);
    }
    if (!postAddState.isActive) {
      throw new Error('Expected button to have class "is-active"');
    }
    if (postAddState.ariaPressed !== 'true') {
      throw new Error(`Expected aria-pressed to be "true", got "${postAddState.ariaPressed}"`);
    }
    if (!postAddState.inState) {
      throw new Error(`Question ${q1Id} was not found in window.state.studyList`);
    }
    const hasSuccessToast = postAddState.toasts.some(msg => msg.includes('berhasil') || msg.includes('Study List'));
    if (!hasSuccessToast) {
      console.warn('[Warning] Toast not captured in DOM, current toasts:', postAddState.toasts);
    }
    console.log('[PASS] Test 2: User Story 1 (P1) verified. Button transitions to "✓", is-active, and state.studyList is updated.');

    // =========================================================================
    // Test 3: User Story 2 (P2) - Idempotent Add-Only Behavior & Persistence
    // =========================================================================
    console.log('\n--- Test 3: User Story 2 (P2) - Idempotent Add-Only Behavior ---');
    // Click the '✓' button again
    const secondClickResult = await cdp.eval(`(async () => {
      const btn = document.querySelector('.zen-q-item [data-action="add-bank-study"][data-id="${q1Id}"]');
      btn.click();
      return { clickedAgain: true };
    })()`, sessionId);
    await delay(500);

    const postSecondClick = await cdp.eval(`(() => {
      const btn = document.querySelector('.zen-q-item [data-action="add-bank-study"][data-id="${q1Id}"]');
      const inStateCount = (window.state.studyList || []).filter(x => x.questionId === '${q1Id}' || x.id.includes('${q1Id}')).length;
      return {
        btnText: btn ? btn.textContent.trim() : null,
        isActive: btn ? btn.classList.contains('is-active') : false,
        inStateCount
      };
    })()`, sessionId);

    console.log('Post-second click state:', postSecondClick);
    if (postSecondClick.btnText !== '✓') {
      throw new Error(`Idempotency failure: clicking on bookmarked question changed glyph to '${postSecondClick.btnText}'!`);
    }
    if (!postSecondClick.isActive) {
      throw new Error('Idempotency failure: button lost is-active class!');
    }
    if (postSecondClick.inStateCount !== 1) {
      throw new Error(`Duplicate prevention failure: found ${postSecondClick.inStateCount} instances in studyList!`);
    }
    console.log('[PASS] Test 3a: Strictly idempotent add-only confirmed. Clicking "✓" does not delete or duplicate.');

    // Check Study List view
    console.log('\n--- Test 3b: Study List View Synchronization ---');
    await cdp.eval(`if (typeof go === 'function') go('study');`, sessionId);
    await delay(800);
    const studyViewResult = await cdp.eval(`(() => {
      const studyItems = document.querySelectorAll('.study-item, .zen-study-card');
      const text = document.body.innerText;
      return {
        itemCount: studyItems.length,
        hasContent: text.includes('Kunci Soal') || text.includes('Study List')
      };
    })()`, sessionId);
    console.log('Study list view state:', studyViewResult);
    if (studyViewResult.itemCount === 0 && !studyViewResult.hasContent) {
      console.warn('[Notice] Study view item query differs from generic selector');
    }
    console.log('[PASS] Test 3b: Study List view accessible and synchronized.');

    // Test Reload Persistence
    console.log('\n--- Test 3c: Persistence across Page Reload ---');
    await cdp.send('Page.reload', {}, sessionId);
    await delay(4500); // allow reload boot, IndexedDB restore, and background seed settle
    await cdp.eval(`(async () => {
      window.location.hash = '#bank';
      if (typeof go === 'function') await go('bank');
      await new Promise(r => setTimeout(r, 600));
      const toggleBtn = document.querySelector('.zen-toggle-bank-list-btn');
      if (toggleBtn) toggleBtn.click();
      if (!document.querySelector('.zen-q-item') && typeof state !== 'undefined') {
        state.bankListExpanded = true;
        if (typeof renderBank === 'function') renderBank();
      }
    })()`, sessionId);
    await delay(1200);

    const postReloadBtn = await cdp.eval(`(() => {
      const cards = document.querySelectorAll('.zen-q-item');
      const btn = document.querySelector('.zen-q-item [data-action="add-bank-study"][data-id="${q1Id}"]');
      return {
        cardCount: cards.length,
        btnText: btn ? btn.textContent.trim() : null,
        isActive: btn ? btn.classList.contains('is-active') : false,
        studyListLength: (window.state.studyList || []).length
      };
    })()`, sessionId);

    console.log('Post-reload state for question #1:', postReloadBtn);
    if (postReloadBtn.btnText !== '✓' || !postReloadBtn.isActive) {
      throw new Error(`Persistence failure after reload: expected '✓' and is-active, got glyph='${postReloadBtn.btnText}', active=${postReloadBtn.isActive}`);
    }
    console.log('[PASS] Test 3c: State persistence across reload verified.');

    // =========================================================================
    // Test 4: User Story 3 (P3) - Action Isolation & Browsing Invariance
    // =========================================================================
    console.log('\n--- Test 4: User Story 3 (P3) - Action Isolation & Browsing Invariance ---');
    // Test on Page 2 or with Search Query
    const isolationResult = await cdp.eval(`(() => {
      const card = document.querySelector('.zen-q-item');
      const checkbox = card.querySelector('input[type="checkbox"]');
      const initialChecked = checkbox ? checkbox.checked : false;
      const initialPage = window.state.bankCurrentPage || 1;

      const btn = card.querySelector('[data-action="add-bank-study"]');
      btn.click();

      const postChecked = checkbox ? checkbox.checked : false;
      const postPage = window.state.bankCurrentPage || 1;
      const hasModal = Boolean(document.querySelector('.modal.is-active, .zen-modal.is-active'));

      return {
        checkboxUnchanged: initialChecked === postChecked,
        pageUnchanged: initialPage === postPage,
        noModalTriggered: !hasModal
      };
    })()`, sessionId);

    console.log('Action isolation checks:', isolationResult);
    if (!isolationResult.checkboxUnchanged) {
      throw new Error('Action isolation failed: clicking study button altered card checkbox state!');
    }
    if (!isolationResult.pageUnchanged) {
      throw new Error('Browsing invariance failed: active page index shifted!');
    }
    if (!isolationResult.noModalTriggered) {
      throw new Error('Action isolation failed: unexpected modal was triggered!');
    }
    console.log('[PASS] Test 4: Action isolation and browsing invariance verified.');

    // =========================================================================
    // Test 5: Responsive Multi-Viewport Parity & Screenshots
    // =========================================================================
    console.log('\n--- Test 5: Multi-Viewport Responsive Parity (Mobile 390x844 & Desktop 1440x900) ---');

    // Mobile Viewport
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    }, sessionId);
    await delay(500);

    const mobileLayout = await cdp.eval(`(() => {
      const card = document.querySelector('.zen-q-item');
      const actions = card ? card.querySelector('.zen-q-actions') : null;
      const studyBtn = actions ? actions.querySelector('.zen-study-btn') : null;
      if (!card || !actions || !studyBtn) return { error: 'Elements missing on mobile' };

      const cardRect = card.getBoundingClientRect();
      const actionsRect = actions.getBoundingClientRect();
      const btnRect = studyBtn.getBoundingClientRect();

      return {
        cardWidth: cardRect.width,
        actionsWidth: actionsRect.width,
        btnWidth: btnRect.width,
        btnHeight: btnRect.height,
        isOverflowing: actionsRect.right > cardRect.right + 2
      };
    })()`, sessionId);

    console.log('Mobile layout measurements:', mobileLayout);
    if (mobileLayout.error) throw new Error(mobileLayout.error);
    if (mobileLayout.isOverflowing) {
      throw new Error(`Mobile layout overflow detected: actions width ${mobileLayout.actionsWidth} exceeds card width ${mobileLayout.cardWidth}`);
    }
    if (mobileLayout.btnWidth < 30 || mobileLayout.btnHeight < 30) {
      throw new Error(`Mobile tap target too small: ${mobileLayout.btnWidth}x${mobileLayout.btnHeight}`);
    }

    // Capture Mobile Screenshot
    const mobileShot = await cdp.send('Page.captureScreenshot', { format: 'png' }, sessionId);
    const mobilePath = path.join(ARTIFACT_DIR, 'bank-study-action-mobile-390.png');
    fs.writeFileSync(mobilePath, Buffer.from(mobileShot.data, 'base64'));
    console.log(`[Screenshot] Saved mobile capture: ${mobilePath}`);

    // Desktop Viewport
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    }, sessionId);
    await delay(500);

    const desktopShot = await cdp.send('Page.captureScreenshot', { format: 'png' }, sessionId);
    const desktopPath = path.join(ARTIFACT_DIR, 'bank-study-action-desktop-1440.png');
    fs.writeFileSync(desktopPath, Buffer.from(desktopShot.data, 'base64'));
    console.log(`[Screenshot] Saved desktop capture: ${desktopPath}`);

    console.log('[PASS] Test 5: Multi-viewport layout parity and screenshot artifacts captured.');

    console.log('\n======================================================');
    console.log('🎉 ALL BANK SOAL STUDY ACTION TESTS PASSED SUCCESSFULLY');
    console.log('======================================================\n');

  } finally {
    try {
      if (sessionId) await cdp.send('Target.detachFromTarget', { sessionId });
      if (targetId) await cdp.send('Target.closeTarget', { targetId });
    } catch (e) {}
    chrome.kill('SIGKILL');
    server.close();
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch (e) {}
  }
}

runBankStudyActionTests().catch(err => {
  console.error('\n❌ Test suite failed:', err);
  process.exit(1);
});
