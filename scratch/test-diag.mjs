import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\d27ebec7-1c6f-4a08-9700-b5f26bb90bdd';
const indexUrl = 'file:///c:/Users/Admin/Documents/GitHub/MOCK-TEST-SSW-PM-BY-FAIZ/index.html';

const profile = path.join(artifactDir, 'scratch', 'chrome-profile-diag-' + Date.now());
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
  proc.kill();
  process.exit(2);
}, 25000);

try {
  const { targetInfos } = await send('Target.getTargets');
  const { sessionId } = await send('Target.attachToTarget', {
    targetId: targetInfos.find(t => t.type === 'page').targetId,
    flatten: true
  });
  await send('Runtime.enable', {}, sessionId);

  const ev = async (expr, label) => {
    const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }, sessionId);
    if (r.exceptionDetails) {
      throw new Error(`[${label}] ` + (r.exceptionDetails.exception?.description || r.exceptionDetails.text));
    }
    return r.result?.value;
  };

  await send('Page.navigate', { url: indexUrl }, sessionId);
  await new Promise(r => setTimeout(r, 2000));

  console.log('Navigating to setup...');
  await ev(`document.querySelector('[data-page="setup"]').click()`, 'go-setup');
  await new Promise(r => setTimeout(r, 600));

  console.log('Clicking submit...');
  await ev(`document.querySelector('#setup-form button[type="submit"]').click()`, 'click-submit');
  await new Promise(r => setTimeout(r, 1200));

  const after = await ev(`({
    page: document.body.className,
    examShell: !!document.querySelector('.exam-shell'),
    viewHtml: document.querySelector('#view')?.innerHTML?.slice(0, 300)
  })`, 'after-click');
  console.log('After submit click:', after);

  clearTimeout(killer);
  proc.kill();
  process.exit(0);
} catch (e) {
  console.error('Error:', e);
  clearTimeout(killer);
  proc.kill();
  process.exit(1);
}
