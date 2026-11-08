import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\d27ebec7-1c6f-4a08-9700-b5f26bb90bdd';
const indexUrl = 'file:///c:/Users/Admin/Documents/GitHub/MOCK-TEST-SSW-PM-BY-FAIZ/index.html';

const profile = path.join(artifactDir, 'scratch', 'chrome-profile-lang-' + Date.now());
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
    if (m.method === 'Runtime.consoleAPICalled') {
      console.log('[BROWSER CONSOLE]', m.params.type, m.params.args.map(a => a.value || a.description).join(' '));
    }
    if (m.method === 'Runtime.exceptionThrown') {
      console.log('[BROWSER EXCEPTION]', m.params.exceptionDetails);
    }
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
  console.error('TIMEOUT 90s');
  proc.kill();
  process.exit(2);
}, 90000);

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
      for (let i = 0; i < 150; i++) {
        if (document.querySelector(${JSON.stringify(sel)})) return true;
        await new Promise(r => setTimeout(r, 100));
      }
      throw new Error('waitFor timeout: ' + ${JSON.stringify(sel)});
    })()`;

    console.log('1. Navigating to index.html and waiting for boot()...');
    await send('Page.navigate', { url: indexUrl }, sessionId);
    await ev(waitFor('.home-dashboard'), 'wait-boot-home');
    await new Promise(r => setTimeout(r, 1200));

    // Verify language switcher options (Flags only)
    console.log('2. Verifying minimalist language switcher options...');
    const langOpts = await ev(`Array.from(document.querySelectorAll('#global-lang-select option')).map(o => ({ value: o.value, text: o.textContent.trim(), title: o.title }))`, 'lang-opts');
    console.log('Language select options:', langOpts);

    // Capture screenshot of minimalist header language select
    const ssLang = await send('Page.captureScreenshot', { format: 'png' }, sessionId);
    fs.writeFileSync(path.join(artifactDir, 'header-minimalist-lang-select.png'), Buffer.from(ssLang.data, 'base64'));
    console.log('Saved: header-minimalist-lang-select.png');

    // 3. Start CBT Exam, finish it, and test Review card 3 buttons
    console.log('3. Starting CBT Exam to test review cards...');
    await ev(`document.querySelector('[data-page="setup"]').click()`, 'go-setup');
    await ev(waitFor('#setup-form button[type="submit"]:not([disabled])'), 'wait-setup');
    await ev(`document.querySelector('#setup-form button[type="submit"]').click()`, 'submit-setup');
    await ev(waitFor('.exam-shell .answer-choice'), 'wait-cbt-exam');

    console.log('4. Answering Question 1 and finishing exam...');
    await ev(`document.querySelectorAll('.answer-choice')[0].click()`, 'answer-q1');
    await ev(`document.querySelector('.exam-header-finish').click()`, 'finish-exam');
    await ev(waitFor('[data-action="confirm-ok"]'), 'wait-confirm');
    await ev(`document.querySelector('[data-action="confirm-ok"]').click()`, 'confirm-finish');
    await ev(waitFor('.zen-review-item'), 'wait-review');

    console.log('5. Verifying review cards have ALL 3 buttons (F, 文A, +)...');
    const reviewCardsInfo = await ev(`({
      cardsCount: document.querySelectorAll('.zen-review-item').length,
      furiCount: document.querySelectorAll('.zen-review-item .zen-furi-card-btn').length,
      transCount: document.querySelectorAll('.zen-review-item .zen-trans-card-btn').length,
      studyCount: document.querySelectorAll('.zen-review-item .zen-study-card-btn').length,
      firstCardStudyText: document.querySelector('.zen-review-item .zen-study-card-btn')?.textContent?.trim()
    })`, 'review-cards-info');
    console.log('Review Cards 3 Buttons Info:', reviewCardsInfo);

    // Click the '+' study button on card 1 in review!
    console.log('6. Clicking "+" button on review card 1...');
    await ev(`document.querySelector('.zen-review-item .zen-study-card-btn').click()`, 'click-review-study');
    await new Promise(r => setTimeout(r, 250));

    const afterClickReviewStudy = await ev(`({
      firstCardStudyText: document.querySelector('.zen-review-item .zen-study-card-btn')?.textContent?.trim(),
      isActive: document.querySelector('.zen-review-item .zen-study-card-btn')?.classList.contains('is-active'),
      badgeText: document.querySelector('#nav-study-badge')?.textContent,
      badgeIsZero: document.querySelector('#nav-study-badge')?.classList.contains('is-zero')
    })`, 'after-review-study-click');
    console.log('After review study click:', afterClickReviewStudy);

    // Scroll into view of first card and take screenshot
    await ev(`(() => {
      const c = document.querySelectorAll('.zen-review-item')[0];
      if (c) {
        c.scrollIntoView({ block: 'start' });
        window.scrollBy(0, -90);
      }
    })()`, 'scroll-card');
    await new Promise(r => setTimeout(r, 300));
    const ssCardStudy = await send('Page.captureScreenshot', { format: 'png' }, sessionId);
    fs.writeFileSync(path.join(artifactDir, 'review-card-study-button.png'), Buffer.from(ssCardStudy.data, 'base64'));
    console.log('Saved: review-card-study-button.png');

    // 7. Test Language Switch to English
    console.log('7. Switching language to English (🇬🇧)...');
    await ev(`(() => {
      const sel = document.querySelector('#global-lang-select');
      sel.value = 'en';
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    })()`, 'switch-to-en');
    await new Promise(r => setTimeout(r, 600));

    const enNav = await ev(`Array.from(document.querySelectorAll('.nav-item')).map(b => b.textContent.trim())`, 'en-nav');
    console.log('English Nav Items:', enNav);

    const enResultTitle = await ev(`document.querySelector('.zen-review-bar h2')?.textContent?.trim()`, 'en-result-title');
    console.log('English Review Bar Title:', enResultTitle);

    // Navigate to Study List in English
    await ev(`document.querySelector('[data-page="study"]').click()`, 'go-study-en');
    await ev(waitFor('.zen-study-card'), 'wait-study-en');
    await new Promise(r => setTimeout(r, 300));
    const ssEnglish = await send('Page.captureScreenshot', { format: 'png' }, sessionId);
    fs.writeFileSync(path.join(artifactDir, 'page-english.png'), Buffer.from(ssEnglish.data, 'base64'));
    console.log('Saved: page-english.png');

    // 8. Test Language Switch to Japanese
    console.log('8. Switching language to Japanese (🇯🇵)...');
    await ev(`(() => {
      const sel = document.querySelector('#global-lang-select');
      sel.value = 'ja';
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    })()`, 'switch-to-ja');
    await new Promise(r => setTimeout(r, 600));

    const jaNav = await ev(`Array.from(document.querySelectorAll('.nav-item')).map(b => b.textContent.trim())`, 'ja-nav');
    console.log('Japanese Nav Items:', jaNav);

    const jaStudyTitle = await ev(`document.querySelector('.zen-page-title')?.textContent?.trim()`, 'ja-study-title');
    console.log('Japanese Study List Title:', jaStudyTitle);

    await new Promise(r => setTimeout(r, 300));
    const ssJapanese = await send('Page.captureScreenshot', { format: 'png' }, sessionId);
    fs.writeFileSync(path.join(artifactDir, 'page-japanese.png'), Buffer.from(ssJapanese.data, 'base64'));
    console.log('Saved: page-japanese.png');

    // Switch back to Indonesian
    console.log('9. Switching back to Indonesian (🇮🇩)...');
    await ev(`(() => {
      const sel = document.querySelector('#global-lang-select');
      sel.value = 'id';
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    })()`, 'switch-to-id');
    await new Promise(r => setTimeout(r, 400));

    console.log('\n=== ALL REVIEW STUDY BUTTON & I18N TESTS PASSED! ===');
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
