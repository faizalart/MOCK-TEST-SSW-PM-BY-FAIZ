import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\d27ebec7-1c6f-4a08-9700-b5f26bb90bdd';
const indexUrl = 'file:///c:/Users/Admin/Documents/GitHub/MOCK-TEST-SSW-PM-BY-FAIZ/index.html';

const profile = path.join(artifactDir, 'scratch', 'chrome-profile-test');
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

setTimeout(() => { proc.kill(); process.exit(1); }, 20000);

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

    for (let i = 0; i < 40; i++) {
      await new Promise(r => setTimeout(r, 200));
      const res = await send('Runtime.evaluate', {
        expression: 'Boolean(document.querySelector(".home-dashboard"))'
      }, sessionId);
      if (res.result?.value) {
        console.log('App ready!');
        break;
      }
    }

    const navRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.querySelector('[data-page="bank"]');
        return { foundBtn: Boolean(btn), text: btn?.textContent?.trim() };
      })()`,
      returnByValue: true
    }, sessionId);
    console.log('Nav button:', navRes.result.value);

    // Click bank button
    await send('Runtime.evaluate', {
      expression: `document.querySelector('[data-page="bank"]').click()`
    }, sessionId);

    await new Promise(r => setTimeout(r, 800));

    const checkView = await send('Runtime.evaluate', {
      expression: `(() => {
        const view = document.querySelector('#view');
        return {
          viewFirstChildClass: view.firstElementChild?.className,
          kicker: document.querySelector('.zen-kicker')?.textContent?.trim(),
          title: document.querySelector('.zen-page-title')?.textContent?.trim()
        };
      })()`,
      returnByValue: true
    }, sessionId);
    console.log('After bank click check:', checkView.result.value);

  } finally {
    proc.kill();
    fs.rmSync(profile, { recursive: true, force: true });
  }
}

run();
