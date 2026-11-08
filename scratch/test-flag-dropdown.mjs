import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\d27ebec7-1c6f-4a08-9700-b5f26bb90bdd';
const indexUrl = 'file:///c:/Users/Admin/Documents/GitHub/MOCK-TEST-SSW-PM-BY-FAIZ/index.html';

const profile = path.join(artifactDir, 'scratch', 'chrome-profile-flag-test');
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

    // 1. Initial State Check
    const initCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const trigger = document.querySelector('#zen-lang-trigger');
        const flagBox = trigger?.querySelector('.flag-box');
        const svg = flagBox?.querySelector('svg');
        const menu = document.querySelector('#zen-lang-menu');
        return {
          hasTrigger: Boolean(trigger),
          hasFlagBox: Boolean(flagBox),
          svgViewBox: svg?.getAttribute('viewBox'),
          isMenuHidden: menu?.hidden
        };
      })()`,
      returnByValue: true
    }, sessionId);
    console.log('Initial Flag Trigger check:', initCheck.result.value);
    if (!initCheck.result.value.hasTrigger || !initCheck.result.value.hasFlagBox) {
      throw new Error('Flag trigger button or SVG flag not found!');
    }

    // 2. Click trigger to open dropdown
    console.log('Clicking #zen-lang-trigger to open menu...');
    await send('Runtime.evaluate', {
      expression: `document.querySelector('#zen-lang-trigger').click()`
    }, sessionId);
    await new Promise(r => setTimeout(r, 250));

    const openCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const wrap = document.querySelector('#zen-lang-dropdown');
        const menu = document.querySelector('#zen-lang-menu');
        const items = Array.from(document.querySelectorAll('.zen-lang-item')).map(el => el.dataset.lang);
        return {
          isOpen: wrap?.classList.contains('is-open'),
          menuHidden: menu?.hidden,
          items
        };
      })()`,
      returnByValue: true
    }, sessionId);
    console.log('Dropdown open check:', openCheck.result.value);
    if (!openCheck.result.value.isOpen || openCheck.result.value.menuHidden) {
      throw new Error('Dropdown did not open properly!');
    }

    // Capture screenshot of opened flag menu
    const shotOpen = await send('Page.captureScreenshot', {
      format: 'png',
      clip: { x: 0, y: 0, width: 1200, height: 200, scale: 2 }
    }, sessionId);
    fs.writeFileSync(path.join(artifactDir, 'topbar-flag-dropdown-open.png'), Buffer.from(shotOpen.data, 'base64'));
    console.log('Saved artifact: topbar-flag-dropdown-open.png');

    // 3. Click English flag
    console.log('Clicking .zen-lang-item[data-lang="en"]...');
    await send('Runtime.evaluate', {
      expression: `document.querySelector('.zen-lang-item[data-lang="en"]').click()`
    }, sessionId);
    await new Promise(r => setTimeout(r, 400));

    const enCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const wrap = document.querySelector('#zen-lang-dropdown');
        const trigger = document.querySelector('#zen-lang-trigger');
        const svg = trigger?.querySelector('svg');
        const activeItem = document.querySelector('.zen-lang-item.is-active')?.dataset.lang;
        const navBank = document.querySelector('[data-page="bank"] span')?.textContent?.trim();
        return {
          menuClosed: !wrap?.classList.contains('is-open'),
          activeLang: window.state?.lang,
          activeItem,
          navBankText: navBank,
          flagViewBox: svg?.getAttribute('viewBox')
        };
      })()`,
      returnByValue: true
    }, sessionId);
    console.log('English Flag selection check:', enCheck.result.value);
    if (enCheck.result.value.activeLang !== 'en') {
      throw new Error(`Expected active lang "en", got "${enCheck.result.value.activeLang}"`);
    }

    // Capture screenshot of UK flag active
    const shotUk = await send('Page.captureScreenshot', {
      format: 'png',
      clip: { x: 0, y: 0, width: 1200, height: 160, scale: 2 }
    }, sessionId);
    fs.writeFileSync(path.join(artifactDir, 'topbar-flag-uk-active.png'), Buffer.from(shotUk.data, 'base64'));
    console.log('Saved artifact: topbar-flag-uk-active.png');

    // 4. Click Japanese flag
    console.log('Re-opening menu and selecting Japanese flag...');
    await send('Runtime.evaluate', {
      expression: `document.querySelector('#zen-lang-trigger').click()`
    }, sessionId);
    await new Promise(r => setTimeout(r, 200));

    await send('Runtime.evaluate', {
      expression: `document.querySelector('.zen-lang-item[data-lang="ja"]').click()`
    }, sessionId);
    await new Promise(r => setTimeout(r, 400));

    const jaCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const activeItem = document.querySelector('.zen-lang-item.is-active')?.dataset.lang;
        const navBank = document.querySelector('[data-page="bank"] span')?.textContent?.trim();
        return {
          activeLang: window.state?.lang,
          activeItem,
          navBankText: navBank
        };
      })()`,
      returnByValue: true
    }, sessionId);
    console.log('Japanese Flag selection check:', jaCheck.result.value);
    if (jaCheck.result.value.activeLang !== 'ja') {
      throw new Error(`Expected active lang "ja", got "${jaCheck.result.value.activeLang}"`);
    }

    // Capture screenshot of Japan flag active
    const shotJa = await send('Page.captureScreenshot', {
      format: 'png',
      clip: { x: 0, y: 0, width: 1200, height: 160, scale: 2 }
    }, sessionId);
    fs.writeFileSync(path.join(artifactDir, 'topbar-flag-japan-active.png'), Buffer.from(shotJa.data, 'base64'));
    console.log('Saved artifact: topbar-flag-japan-active.png');

    console.log('\n>>> FLAG DROPDOWN VERIFICATION COMPLETED SUCCESSFULLY! <<<');
  } finally {
    clearTimeout(killer);
    proc.kill();
  }
}

run().catch(err => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});
