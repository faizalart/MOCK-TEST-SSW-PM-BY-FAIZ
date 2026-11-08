import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\d27ebec7-1c6f-4a08-9700-b5f26bb90bdd';
const indexUrl = 'file:///c:/Users/Admin/Documents/GitHub/MOCK-TEST-SSW-PM-BY-FAIZ/index.html';

const profile = path.join(artifactDir, 'scratch', 'chrome-profile-debug-' + Date.now());
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
  proc.kill();
  process.exit(2);
}, 30000);

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

  const stateInfo = await ev(`({
    page: window.state?.page,
    studyList: window.state?.studyList,
    viewHTML: document.querySelector('#view')?.innerHTML?.slice(0, 300),
    navBtns: Array.from(document.querySelectorAll('.nav-item')).map(b => b.dataset.page)
  })`, 'initial-state');
  console.log('Initial state:', stateInfo);

  // Click study nav
  const clickRes = await ev(`(async () => {
    const btn = document.querySelector('[data-page="study"]');
    if (!btn) return 'btn not found';
    btn.click();
    await new Promise(r => setTimeout(r, 500));
    return {
      page: window.state?.page,
      viewHTML: document.querySelector('#view')?.innerHTML?.slice(0, 500)
    };
  })()`, 'click-study');
  console.log('Click study res:', clickRes);

  clearTimeout(killer);
  proc.kill();
  process.exit(0);
} catch (e) {
  console.error('Debug error:', e);
  clearTimeout(killer);
  proc.kill();
  process.exit(1);
}
