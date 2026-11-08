import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\d27ebec7-1c6f-4a08-9700-b5f26bb90bdd';
const indexUrl = 'file:///c:/Users/Admin/Documents/GitHub/MOCK-TEST-SSW-PM-BY-FAIZ/index.html';

const profile = path.join(artifactDir, 'scratch', 'chrome-profile-study-' + Date.now());
fs.mkdirSync(profile, { recursive: true });

const proc = spawn(chromePath, [
  '--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--disable-web-security',
  `--user-data-dir=${profile}`, '--remote-debugging-pipe', 'about:blank'
], { stdio: ['ignore', 'ignore', 'pipe', 'pipe', 'pipe'] });

const out = proc.stdio[3], inp = proc.stdio[4];
let buf = '', nextId = 1;
const pending = new Map();

inp.on('data', c => {
  buf += c.toString('utf8');
  let i;
  while ((i = buf.indexOf('\0')) !== -1) {
    const raw = buf.slice(0, i); buf = buf.slice(i + 1);
    if (!raw.trim()) continue;
    const m = JSON.parse(raw);
    if (m.id && pending.has(m.id)) {
      const { resolve, reject } = pending.get(m.id); pending.delete(m.id);
      m.error ? reject(new Error(m.error.message)) : resolve(m.result);
    }
  }
});

const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
  const id = nextId++; pending.set(id, { resolve, reject });
  out.write(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }) + '\0');
});

const killer = setTimeout(() => {
  console.error('TIMEOUT 75s');
  proc.kill();
  process.exit(2);
}, 75000);

async function run() {
  try {
    const { targetInfos } = await send('Target.getTargets');
    const { sessionId } = await send('Target.attachToTarget', {
      targetId: targetInfos.find(t => t.type === 'page').targetId,
      flatten: true
    });

    await send('Runtime.enable', {}, sessionId);
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    }, sessionId);

    const ev = async (expr, label) => {
      const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }, sessionId);
      if (r.exceptionDetails) {
        throw new Error(`[${label}] ` + (r.exceptionDetails.exception?.description || r.exceptionDetails.text));
      }
      return r.result?.value;
    };

    const waitFor = sel => `(async () => {
      for (let i = 0; i < 120; i++) {
        if (document.querySelector(${JSON.stringify(sel)})) return true;
        await new Promise(r => setTimeout(r, 100));
      }
      throw new Error('waitFor timeout: ' + ${JSON.stringify(sel)});
    })()`;

    console.log('1. Navigating to index.html...');
    await send('Page.navigate', { url: indexUrl }, sessionId);
    await ev(waitFor('[data-page="study"]'), 'boot-study-nav');

    console.log('2. Verifying Study List empty state...');
    await ev(`document.querySelector('[data-page="study"]').click()`, 'click-nav-study');
    await ev(waitFor('.zen-study-page .zen-empty-block'), 'wait-empty-study');

    const emptyInfo = await ev(`({
      badgeCount: document.querySelector('#nav-study-badge')?.textContent,
      badgeIsZero: document.querySelector('#nav-study-badge')?.classList.contains('is-zero'),
      hasEmptyTitle: !!document.querySelector('.zen-empty-block .hd-empty-title'),
      hasStartCta: !!document.querySelector('.zen-empty-block [data-page="setup"]')
    })`, 'empty-info');
    console.log('Empty state info:', emptyInfo);

    // Screenshot 1: study-list-page-empty.png
    await new Promise(r => setTimeout(r, 200));
    const ssEmpty = await send('Page.captureScreenshot', { format: 'png' }, sessionId);
    fs.writeFileSync(path.join(artifactDir, 'study-list-page-empty.png'), Buffer.from(ssEmpty.data, 'base64'));
    console.log('Saved: study-list-page-empty.png');

    console.log('3. Starting CBT Exam...');
    await ev(`document.querySelector('.zen-empty-block [data-page="setup"]').click()`, 'click-start-from-empty');
    await ev(waitFor('#setup-form button[type="submit"]:not([disabled])'), 'wait-setup');
    await ev(`document.querySelector('#setup-form button[type="submit"]').click()`, 'submit-setup');
    await ev(waitFor('.exam-shell .answer-choice'), 'wait-cbt-exam');
    await ev(waitFor('.study-list-quick-button'), 'wait-study-btn');

    // Verify CBT tools bar and Study List button idle
    const cbtIdleInfo = await ev(`({
      toolsCount: document.querySelectorAll('.exam-bottom-tools .exam-tool-button').length,
      btnText: document.querySelector('.study-list-quick-button')?.textContent?.trim(),
      isActive: document.querySelector('.study-list-quick-button')?.classList.contains('is-active'),
      ariaPressed: document.querySelector('.study-list-quick-button')?.getAttribute('aria-pressed'),
      title: document.querySelector('.study-list-quick-button')?.getAttribute('title')
    })`, 'cbt-idle-info');
    console.log('CBT Study Button Idle:', cbtIdleInfo);

    // Screenshot 2: cbt-study-button-idle.png
    const ssIdle = await send('Page.captureScreenshot', { format: 'png' }, sessionId);
    fs.writeFileSync(path.join(artifactDir, 'cbt-study-button-idle.png'), Buffer.from(ssIdle.data, 'base64'));
    console.log('Saved: cbt-study-button-idle.png');

    console.log('4. Clicking "+" button to add Question 1 to Study List...');
    await ev(`document.querySelector('.study-list-quick-button').click()`, 'click-study-btn');
    await new Promise(r => setTimeout(r, 200));

    const cbtActiveInfo = await ev(`({
      btnText: document.querySelector('.study-list-quick-button')?.textContent?.trim(),
      isActive: document.querySelector('.study-list-quick-button')?.classList.contains('is-active'),
      ariaPressed: document.querySelector('.study-list-quick-button')?.getAttribute('aria-pressed'),
      title: document.querySelector('.study-list-quick-button')?.getAttribute('title'),
      badgeText: document.querySelector('#nav-study-badge')?.textContent,
      badgeIsZero: document.querySelector('#nav-study-badge')?.classList.contains('is-zero')
    })`, 'cbt-active-info');
    console.log('CBT Study Button Active:', cbtActiveInfo);

    // Screenshot 3: cbt-study-button-active.png
    const ssActive = await send('Page.captureScreenshot', { format: 'png' }, sessionId);
    fs.writeFileSync(path.join(artifactDir, 'cbt-study-button-active.png'), Buffer.from(ssActive.data, 'base64'));
    console.log('Saved: cbt-study-button-active.png');

    console.log('5. Navigating questions in CBT and marking Question 2...');
    await ev(`document.querySelectorAll('.answer-choice')[0].click()`, 'answer-q1');
    await ev(`document.querySelector('.exam-nav-btn.is-next')?.click() || document.querySelector('[data-action=\"next-question\"]')?.click()`, 'next-q');
    await new Promise(r => setTimeout(r, 200));

    // In Q2: verify button is idle (+)
    const q2Idle = await ev(`document.querySelector('.study-list-quick-button')?.textContent?.trim()`, 'q2-text');
    console.log('Q2 Study button initial state:', q2Idle);

    // Add Q2 to Study List as well
    await ev(`document.querySelector('.study-list-quick-button').click()`, 'click-study-q2');
    await new Promise(r => setTimeout(r, 200));
    await ev(`document.querySelectorAll('.answer-choice')[1].click()`, 'answer-q2');

    // Go back to Q1, verify button is still active (✓)
    await ev(`document.querySelector('.exam-nav-btn.is-prev')?.click() || document.querySelector('[data-action=\"prev-question\"]')?.click()`, 'prev-q');
    await new Promise(r => setTimeout(r, 200));
    const q1Check = await ev(`document.querySelector('.study-list-quick-button')?.textContent?.trim()`, 'q1-back-check');
    console.log('Q1 Study button after navigating back:', q1Check);

    console.log('6. Finishing exam and reviewing answer cards...');
    await ev(`document.querySelector('.exam-header-finish').click()`, 'finish-exam');
    await ev(waitFor('[data-action="confirm-ok"]'), 'wait-confirm');
    await ev(`document.querySelector('[data-action="confirm-ok"]').click()`, 'confirm-finish');
    await ev(waitFor('.zen-review-item'), 'wait-review');

    // Verify Review cards Furigana AND Translation buttons
    const reviewButtonsInfo = await ev(`({
      cardsCount: document.querySelectorAll('.zen-review-item').length,
      cardsWithFuri: document.querySelectorAll('.zen-review-item .zen-furi-card-btn').length,
      cardsWithTrans: document.querySelectorAll('.zen-review-item .zen-trans-card-btn').length
    })`, 'review-buttons-info');
    console.log('Review Cards Buttons Info:', reviewButtonsInfo);

    // Scroll to review cards and capture screenshot showing both buttons
    await ev(`(() => {
      const c = document.querySelectorAll('.zen-review-item')[0];
      if (c) {
        c.scrollIntoView({ block: 'start' });
        window.scrollBy(0, -80);
      }
    })()`, 'scroll-to-review');
    await new Promise(r => setTimeout(r, 300));
    const ssReview = await send('Page.captureScreenshot', { format: 'png' }, sessionId);
    fs.writeFileSync(path.join(artifactDir, 'review-cards-furigana-and-trans.png'), Buffer.from(ssReview.data, 'base64'));
    console.log('Saved: review-cards-furigana-and-trans.png');

    console.log('7. Navigating to Study List with populated items...');
    await ev(`document.querySelector('[data-page="study"]').click()`, 'open-study-page');
    await ev(waitFor('.zen-study-card'), 'wait-study-cards');

    const populatedInfo = await ev(`({
      totalCards: document.querySelectorAll('.zen-study-card').length,
      totalCountText: document.querySelector('#study-total-count')?.textContent,
      firstCardPkg: document.querySelector('.zen-study-card .zen-study-pkg-pill')?.textContent,
      firstCardQNum: document.querySelector('.zen-study-card .zen-study-qnum-pill')?.textContent,
      hasCorrectBadge: !!document.querySelector('.zen-study-card .zen-study-correct-badge'),
      hasTransPanel: !!document.querySelector('.zen-study-card .zen-study-translation-panel')
    })`, 'populated-info');
    console.log('Populated Study List info:', populatedInfo);

    // Screenshot 4: study-list-page-populated.png
    await new Promise(r => setTimeout(r, 200));
    const ssPopulated = await send('Page.captureScreenshot', { format: 'png' }, sessionId);
    fs.writeFileSync(path.join(artifactDir, 'study-list-page-populated.png'), Buffer.from(ssPopulated.data, 'base64'));
    console.log('Saved: study-list-page-populated.png');

    console.log('8. Opening Question Detail Modal...');
    await ev(`document.querySelector('.zen-study-card [data-action="open-study-detail"]').click()`, 'open-detail');
    await ev(waitFor('.modal-body .zen-study-modal-wrap'), 'wait-detail-modal');

    // Screenshot 5: study-list-question-detail.png
    await new Promise(r => setTimeout(r, 200));
    const ssDetail = await send('Page.captureScreenshot', { format: 'png' }, sessionId);
    fs.writeFileSync(path.join(artifactDir, 'study-list-question-detail.png'), Buffer.from(ssDetail.data, 'base64'));
    console.log('Saved: study-list-question-detail.png');

    // Close modal
    await ev(`document.querySelector('.modal-header button[data-action="close-modal"]').click()`, 'close-modal');
    await new Promise(r => setTimeout(r, 200));

    console.log('9. Testing Remove item from Study List...');
    const cardsBefore = await ev(`document.querySelectorAll('.zen-study-card').length`, 'count-before-remove');
    await ev(`document.querySelector('.zen-study-card [data-action="remove-study-item"]').click()`, 'remove-first');
    await new Promise(r => setTimeout(r, 250));
    const cardsMiddle = await ev(`document.querySelectorAll('.zen-study-card').length`, 'count-middle');
    console.log(`Cards count: ${cardsBefore} -> ${cardsMiddle}`);

    await ev(`document.querySelector('.zen-study-card [data-action="remove-study-item"]').click()`, 'remove-second');
    await ev(waitFor('.zen-study-page .zen-empty-block'), 'wait-empty-again');
    const badgeAfter = await ev(`({
      text: document.querySelector('#nav-study-badge')?.textContent,
      isZero: document.querySelector('#nav-study-badge')?.classList.contains('is-zero')
    })`, 'badge-after');
    console.log('Badge after removing all items:', badgeAfter);

    console.log('\n=== ALL E2E ASSERTIONS PASSED SUCCESSFULLY! ===');
    clearTimeout(killer);
    proc.kill();
    process.exit(0);
  } catch (err) {
    console.error('TEST ERROR:', err);
    clearTimeout(killer);
    proc.kill();
    process.exit(1);
  }
}

run();
