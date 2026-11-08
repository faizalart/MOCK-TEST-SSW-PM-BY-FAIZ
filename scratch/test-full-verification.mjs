import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\d27ebec7-1c6f-4a08-9700-b5f26bb90bdd';
const indexUrl = 'file:///c:/Users/Admin/Documents/GitHub/MOCK-TEST-SSW-PM-BY-FAIZ/index.html';

const profile = path.join(artifactDir, 'scratch', 'chrome-profile-full-test');
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
  console.error('TIMEOUT 60s');
  proc.kill();
  process.exit(2);
}, 60000);

async function run() {
  try {
    const { targetInfos } = await send('Target.getTargets');
    const { sessionId } = await send('Target.attachToTarget', {
      targetId: targetInfos.find(t => t.type === 'page').targetId,
      flatten: true
    });

    await send('Page.enable', {}, sessionId);
    await send('Runtime.enable', {}, sessionId);
    await send('Network.enable', {}, sessionId);
    await send('Network.setBypassServiceWorker', { bypass: true }, sessionId);
    await send('Network.clearBrowserCache', {}, sessionId);

    console.log('Navigating to', indexUrl);
    await send('Page.navigate', { url: indexUrl }, sessionId);

    // Wait for home dashboard ready
    for (let i = 0; i < 40; i++) {
      await new Promise(r => setTimeout(r, 200));
      const res = await send('Runtime.evaluate', {
        expression: 'Boolean(document.querySelector(".home-dashboard"))'
      }, sessionId);
      if (res.result?.value) {
        console.log('Home dashboard loaded after', (i + 1) * 200, 'ms');
        break;
      }
    }

    // 1. TEST BANK PAGE KICKER IN ID, EN, JA
    console.log('\n--- 1. Testing Question Bank language kickers ---');
    // Navigate to bank
    await send('Runtime.evaluate', {
      expression: `document.querySelector('[data-page="bank"]').click()`
    }, sessionId);

    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 150));
      const res = await send('Runtime.evaluate', {
        expression: 'Boolean(document.querySelector(".zen-bank-page"))'
      }, sessionId);
      if (res.result?.value) break;
    }

    // Check ID
    const bankId = await send('Runtime.evaluate', {
      expression: `(() => ({
        kicker: document.querySelector('.zen-bank-page .zen-kicker')?.textContent?.trim(),
        title: document.querySelector('.zen-bank-page .zen-page-title')?.textContent?.trim()
      }))()`,
      returnByValue: true
    }, sessionId);
    console.log('Bank [ID]:', bankId.result.value);
    if (bankId.result.value.kicker !== 'PUSTAKA & EDITOR SOAL') {
      throw new Error(`Expected ID kicker "PUSTAKA & EDITOR SOAL", got "${bankId.result.value.kicker}"`);
    }

    // Switch to EN
    await send('Runtime.evaluate', {
      expression: `(() => {
        const sel = document.querySelector('#global-lang-select');
        sel.value = 'en';
        sel.dispatchEvent(new Event('change', { bubbles: true }));
      })()`
    }, sessionId);
    await new Promise(r => setTimeout(r, 300));

    const bankEn = await send('Runtime.evaluate', {
      expression: `(() => ({
        kicker: document.querySelector('.zen-bank-page .zen-kicker')?.textContent?.trim(),
        title: document.querySelector('.zen-bank-page .zen-page-title')?.textContent?.trim()
      }))()`,
      returnByValue: true
    }, sessionId);
    console.log('Bank [EN]:', bankEn.result.value);
    if (bankEn.result.value.kicker !== 'QUESTION LIBRARY & EDITOR') {
      throw new Error(`Expected EN kicker "QUESTION LIBRARY & EDITOR", got "${bankEn.result.value.kicker}"`);
    }

    // Capture screenshot of Bank EN
    const shotBankEn = await send('Page.captureScreenshot', { format: 'png' }, sessionId);
    fs.writeFileSync(path.join(artifactDir, 'bank-page-english-kicker.png'), Buffer.from(shotBankEn.data, 'base64'));
    console.log('Saved artifact: bank-page-english-kicker.png');

    // Switch to JA
    await send('Runtime.evaluate', {
      expression: `(() => {
        const sel = document.querySelector('#global-lang-select');
        sel.value = 'ja';
        sel.dispatchEvent(new Event('change', { bubbles: true }));
      })()`
    }, sessionId);
    await new Promise(r => setTimeout(r, 300));

    const bankJa = await send('Runtime.evaluate', {
      expression: `(() => ({
        kicker: document.querySelector('.zen-bank-page .zen-kicker')?.textContent?.trim(),
        title: document.querySelector('.zen-bank-page .zen-page-title')?.textContent?.trim()
      }))()`,
      returnByValue: true
    }, sessionId);
    console.log('Bank [JA]:', bankJa.result.value);
    if (bankJa.result.value.kicker !== '問題ライブラリ＆エディタ') {
      throw new Error(`Expected JA kicker "問題ライブラリ＆エディタ", got "${bankJa.result.value.kicker}"`);
    }

    // 2. TEST SETUP KICKER
    console.log('\n--- 2. Testing Setup page kickers ---');
    await send('Runtime.evaluate', {
      expression: `document.querySelector('[data-page="setup"]').click()`
    }, sessionId);

    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 150));
      const res = await send('Runtime.evaluate', {
        expression: 'Boolean(document.querySelector(".zen-setup-page"))'
      }, sessionId);
      if (res.result?.value) break;
    }

    const setupJa = await send('Runtime.evaluate', {
      expression: `document.querySelector('.zen-setup-page .zen-kicker')?.textContent?.trim()`,
      returnByValue: true
    }, sessionId);
    console.log('Setup [JA] kicker:', setupJa.result.value);
    if (setupJa.result.value !== 'CBT模擬試験 · SSW PM') {
      throw new Error(`Expected JA setup kicker "CBT模擬試験 · SSW PM", got "${setupJa.result.value}"`);
    }

    // Switch setup to EN
    await send('Runtime.evaluate', {
      expression: `(() => {
        const sel = document.querySelector('#global-lang-select');
        sel.value = 'en';
        sel.dispatchEvent(new Event('change', { bubbles: true }));
      })()`
    }, sessionId);
    await new Promise(r => setTimeout(r, 300));

    const setupEn = await send('Runtime.evaluate', {
      expression: `document.querySelector('.zen-setup-page .zen-kicker')?.textContent?.trim()`,
      returnByValue: true
    }, sessionId);
    console.log('Setup [EN] kicker:', setupEn.result.value);
    if (setupEn.result.value !== 'CBT SIMULATION · SSW PM') {
      throw new Error(`Expected EN setup kicker "CBT SIMULATION · SSW PM", got "${setupEn.result.value}"`);
    }

    // 3. TEST MOBILE VIEWPORT PINNING ON CBT START
    console.log('\n--- 3. Testing Mobile Viewport Pinning on CBT Start ---');

    // Emulate standard mobile screen (390 x 844)
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
      hasTouch: true
    }, sessionId);

    // Scroll down 320px
    console.log('Simulating mobile scroll down to 320px...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        window.scrollTo(0, 320);
        if (document.documentElement) document.documentElement.scrollTop = 320;
        if (document.body) document.body.scrollTop = 320;
      })()`
    }, sessionId);

    const scrollBeforeStart = await send('Runtime.evaluate', {
      expression: `window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0`,
      returnByValue: true
    }, sessionId);
    console.log('Scroll before start:', scrollBeforeStart.result.value);

    // Click "Start Exam"
    console.log('Submitting setup form to start exam...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const form = document.querySelector('#setup-form');
        const submitBtn = form?.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.click();
      })()`
    }, sessionId);

    // Wait for exam-shell
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 200));
      const res = await send('Runtime.evaluate', {
        expression: 'Boolean(document.querySelector(".exam-shell") && document.body.classList.contains("exam-mode"))'
      }, sessionId);
      if (res.result?.value) {
        console.log('Exam shell rendered in exam-mode!');
        break;
      }
    }

    // Settle layout
    await new Promise(r => setTimeout(r, 600));

    // Verify viewport geometry
    const geo = await send('Runtime.evaluate', {
      expression: `(() => {
        const shell = document.querySelector('.exam-shell');
        const header = document.querySelector('.exam-header');
        const bottom = document.querySelector('.exam-bottom');
        const sRect = shell?.getBoundingClientRect();
        const hRect = header?.getBoundingClientRect();
        const bRect = bottom?.getBoundingClientRect();
        return {
          windowScrollY: window.scrollY,
          docScrollTop: document.documentElement.scrollTop,
          bodyScrollTop: document.body.scrollTop,
          windowInnerHeight: window.innerHeight,
          shellTop: sRect?.top,
          shellBottom: sRect?.bottom,
          shellHeight: sRect?.height,
          headerTop: hRect?.top,
          headerBottom: hRect?.bottom,
          bottomBarTop: bRect?.top,
          bottomBarBottom: bRect?.bottom,
          hasExamMode: document.body.classList.contains('exam-mode'),
          hasInExam: document.documentElement.classList.contains('in-exam')
        };
      })()`,
      returnByValue: true
    }, sessionId);

    console.log('Exam Viewport Metrics:', JSON.stringify(geo.result.value, null, 2));

    const g = geo.result.value;
    if (g.windowScrollY !== 0) {
      throw new Error(`Expected window.scrollY === 0, got ${g.windowScrollY}`);
    }
    if (g.headerTop !== 0) {
      throw new Error(`Expected header top === 0 (not cut off), got ${g.headerTop}`);
    }
    const bottomGap = Math.abs(g.bottomBarBottom - g.windowInnerHeight);
    console.log('Bottom bar gap from viewport bottom:', bottomGap, 'px');
    if (bottomGap > 3) {
      throw new Error(`Expected bottom bar to sit flush with viewport bottom (gap <= 3px), but gap is ${bottomGap}px (bottomBarBottom: ${g.bottomBarBottom}, innerHeight: ${g.windowInnerHeight})`);
    }

    // Capture mobile CBT screenshot
    const shotCbt = await send('Page.captureScreenshot', { format: 'png' }, sessionId);
    fs.writeFileSync(path.join(artifactDir, 'cbt-mobile-viewport-initial-start.png'), Buffer.from(shotCbt.data, 'base64'));
    console.log('Saved artifact: cbt-mobile-viewport-initial-start.png');

    console.log('\n>>> ALL VERIFICATIONS PASSED 100%! <<<');
  } finally {
    clearTimeout(killer);
    proc.kill();
  }
}

run().catch(err => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});
