import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\d27ebec7-1c6f-4a08-9700-b5f26bb90bdd';

const htmlContent = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body {
    background: #f8fafc;
    font-family: system-ui, -apple-system, sans-serif;
    padding: 40px;
    display: flex;
    gap: 20px;
    align-items: center;
  }
  .flag-box {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 3px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.08);
  }
  .flag-box svg {
    display: block;
  }
  /* Pill trigger */
  .lang-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    height: 34px;
    padding: 0 12px;
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 9999px;
    cursor: pointer;
    box-shadow: 0 1px 2px rgba(0,0,0,0.04);
  }
  .lang-chevron {
    width: 8px;
    height: 5px;
    stroke: #64748b;
    fill: none;
    stroke-width: 1.8;
  }
  /* Dropdown card */
  .lang-dropdown {
    display: inline-flex;
    flex-direction: column;
    background: #ffffff;
    border: 1px solid rgba(0,0,0,0.08);
    border-radius: 12px;
    padding: 5px;
    box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.06);
    gap: 2px;
  }
  .lang-item {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 34px;
    border-radius: 8px;
    border: none;
    background: transparent;
    cursor: pointer;
    transition: background 0.15s ease;
  }
  .lang-item:hover {
    background: #f1f5f9;
  }
  .lang-item.is-active {
    background: #f0fdf4;
    outline: 1px solid #86efac;
  }
</style>
</head>
<body>
  <div class="lang-pill">
    <div class="flag-box">
      <svg viewBox="0 0 60 30" width="22" height="14" aria-hidden="true">
        <clipPath id="uk-clip-test"><path d="M0,0 v30 h60 v-30 z"/></clipPath>
        <clipPath id="uk-diag-test"><path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z"/></clipPath>
        <g clip-path="url(#uk-clip-test)">
          <path d="M0,0 v30 h60 v-30 z" fill="#012169"/>
          <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" stroke-width="6"/>
          <path d="M0,0 L60,30 M60,0 L0,30" clip-path="url(#uk-diag-test)" stroke="#c8102e" stroke-width="4"/>
          <path d="M30,0 v30 M0,15 h60" stroke="#fff" stroke-width="10"/>
          <path d="M30,0 v30 M0,15 h60" stroke="#c8102e" stroke-width="6"/>
        </g>
      </svg>
    </div>
    <svg class="lang-chevron" viewBox="0 0 8 5"><path d="M1 1L4 4L7 1" stroke-linecap="round" stroke-linejoin="round"/></svg>
  </div>

  <div class="lang-dropdown">
    <button class="lang-item" title="Bahasa Indonesia">
      <div class="flag-box">
        <svg viewBox="0 0 24 16" width="22" height="14" aria-hidden="true">
          <rect width="24" height="8" fill="#e70011"/>
          <rect y="8" width="24" height="8" fill="#ffffff"/>
        </svg>
      </div>
    </button>
    <button class="lang-item is-active" title="English">
      <div class="flag-box">
        <svg viewBox="0 0 60 30" width="22" height="14" aria-hidden="true">
          <clipPath id="uk-clip-dd"><path d="M0,0 v30 h60 v-30 z"/></clipPath>
          <clipPath id="uk-diag-dd"><path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z"/></clipPath>
          <g clip-path="url(#uk-clip-dd)">
            <path d="M0,0 v30 h60 v-30 z" fill="#012169"/>
            <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" stroke-width="6"/>
            <path d="M0,0 L60,30 M60,0 L0,30" clip-path="url(#uk-diag-dd)" stroke="#c8102e" stroke-width="4"/>
            <path d="M30,0 v30 M0,15 h60" stroke="#fff" stroke-width="10"/>
            <path d="M30,0 v30 M0,15 h60" stroke="#c8102e" stroke-width="6"/>
          </g>
        </svg>
      </div>
    </button>
    <button class="lang-item" title="日本語">
      <div class="flag-box">
        <svg viewBox="0 0 24 16" width="22" height="14" aria-hidden="true">
          <rect width="24" height="16" fill="#ffffff"/>
          <circle cx="12" cy="8" r="4.8" fill="#bc002d"/>
        </svg>
      </div>
    </button>
  </div>
</body>
</html>`;

const previewPath = path.join(artifactDir, 'scratch', 'flag-preview.html');
fs.writeFileSync(previewPath, htmlContent);

const proc = spawn(chromePath, [
  '--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files',
  '--remote-debugging-pipe', 'about:blank'
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

setTimeout(() => { proc.kill(); process.exit(1); }, 15000);

async function test() {
  const { targetInfos } = await send('Target.getTargets');
  const { sessionId } = await send('Target.attachToTarget', {
    targetId: targetInfos.find(t => t.type === 'page').targetId,
    flatten: true
  });
  await send('Page.enable', {}, sessionId);
  await send('Page.navigate', { url: 'file:///' + previewPath.replace(/\\/g, '/') }, sessionId);
  await new Promise(r => setTimeout(r, 600));

  const shot = await send('Page.captureScreenshot', { format: 'png' }, sessionId);
  fs.writeFileSync(path.join(artifactDir, 'flag-preview.png'), Buffer.from(shot.data, 'base64'));
  console.log('Saved flag preview screenshot!');
  proc.kill();
}
test();
