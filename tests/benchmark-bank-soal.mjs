import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';

const ROOT = process.cwd();

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

async function runBenchmark() {
  console.log('=== BENCHMARK: Optimized Performance Tab Bank Soal ===');

  const server = http.createServer((req, res) => {
    try {
      const urlPath = new URL(req.url, 'http://127.0.0.1').pathname;
      const relPath = urlPath === '/' ? '/index.html' : decodeURIComponent(urlPath);
      const filePath = path.join(ROOT, relPath);

      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not found');
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, {
        'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
        'Service-Worker-Allowed': '/'
      });
      fs.createReadStream(filePath).pipe(res);
    } catch (err) {
      res.writeHead(500);
      res.end(err.message);
    }
  });

  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/index.html`;

  const tmpUserData = fs.mkdtempSync(path.join(os.tmpdir(), 'mocktest-bench-post-'));
  const chrome = launchChrome(tmpUserData);
  const cdp = new CDPClient(chrome);

  try {
    const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });

    await cdp.send('Page.enable', {}, sessionId);
    await cdp.send('Runtime.enable', {}, sessionId);

    console.log('[Navigate]: Loading application...');
    await cdp.send('Page.navigate', { url: baseUrl }, sessionId);
    await new Promise(r => setTimeout(r, 4500));

    const initInfo = await cdp.eval(`
      (() => {
        return {
          totalQuestions: state.questions.length,
          packages: getAvailablePackages().length,
          initialDOMNodes: document.querySelectorAll('*').length
        };
      })()
    `, sessionId);

    console.log('[Initial State]:', initInfo);

    // Step 1: Measure click on Bank Soal tab (collapsed state)
    console.log('\n--- Step 1: Measuring Tab Bank Soal Open (Collapsed) ---');
    const tabOpenPerf = await cdp.eval(`
      (async () => {
        const domBefore = document.querySelectorAll('*').length;
        const t0 = performance.now();
        
        const bankBtn = document.querySelector('button[data-page="bank"]');
        if (!bankBtn) return { error: 'Bank button not found' };
        bankBtn.click();

        await new Promise(requestAnimationFrame);
        const t1 = performance.now();

        const domAfter = document.querySelectorAll('*').length;
        const catalogPresent = !!document.querySelector('.zen-catalog-section');
        const renderedQuestionsCount = document.querySelectorAll('.zen-q-item').length;
        const isCollapsed = !!document.querySelector('.zen-questions-section.is-collapsed');
        const toggleBtnText = document.querySelector('.zen-toggle-bank-list-btn')?.textContent?.trim();

        return {
          timeMs: +(t1 - t0).toFixed(2),
          domBefore,
          domAfter,
          domDifference: domAfter - domBefore,
          catalogPresent,
          isCollapsed,
          toggleBtnText,
          renderedQuestionsCount
        };
      })()
    `, sessionId);

    console.log('[Step 1 Results - Tab Open]:', JSON.stringify(tabOpenPerf, null, 2));

    // Step 2: Measure clicking Expand [Tampilkan daftar soal]
    console.log('\n--- Step 2: Measuring Expand [Tampilkan daftar soal] ---');
    const expandPerf = await cdp.eval(`
      (async () => {
        const domBefore = document.querySelectorAll('*').length;
        const t0 = performance.now();

        const toggleBtn = document.querySelector('.zen-toggle-bank-list-btn');
        if (!toggleBtn) return { error: 'Toggle button not found' };
        toggleBtn.click();

        await new Promise(requestAnimationFrame);
        const t1 = performance.now();

        const domAfter = document.querySelectorAll('*').length;
        const renderedQuestionsCount = document.querySelectorAll('.zen-q-item').length;
        const isExpanded = !!document.querySelector('.zen-questions-section.is-expanded');
        const paginationPresent = !!document.querySelector('.zen-pagination');
        const paginationInfo = document.querySelector('.zen-pagination-info')?.textContent?.trim();
        const toggleBtnText = document.querySelector('.zen-toggle-bank-list-btn')?.textContent?.trim();

        return {
          expandTimeMs: +(t1 - t0).toFixed(2),
          domBefore,
          domAfter,
          domDifference: domAfter - domBefore,
          isExpanded,
          toggleBtnText,
          renderedQuestionsCount,
          paginationPresent,
          paginationInfo
        };
      })()
    `, sessionId);

    console.log('[Step 2 Results - Expand]:', JSON.stringify(expandPerf, null, 2));

    // Step 3: Measure Search on 1,006 questions (Page 1 rendered)
    console.log('\n--- Step 3: Measuring Search on Full Dataset ---');
    const searchPerf = await cdp.eval(`
      (async () => {
        const searchInput = document.getElementById('bank-search');
        if (!searchInput) return { error: 'Search input not found' };

        const t0 = performance.now();
        searchInput.value = 'haccp';
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        await new Promise(requestAnimationFrame);
        const t1 = performance.now();

        const renderedCount = document.querySelectorAll('.zen-q-item').length;
        const paginationInfo = document.querySelector('.zen-pagination-info')?.textContent?.trim();
        return {
          searchTimeMs: +(t1 - t0).toFixed(2),
          renderedCount,
          totalMatching: state.bankVisibleIds.length,
          paginationInfo
        };
      })()
    `, sessionId);

    console.log('[Step 3 Results - Search]:', JSON.stringify(searchPerf, null, 2));

    // Step 4: Measure Pagination Switching
    console.log('\n--- Step 4: Measuring Pagination Navigation ---');
    const pageNavPerf = await cdp.eval(`
      (async () => {
        // Clear search first
        const searchInput = document.getElementById('bank-search');
        searchInput.value = '';
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));

        const t0 = performance.now();
        const nextBtn = document.querySelector('button[data-action="bank-next-page"]');
        if (!nextBtn) return { error: 'Next button not found' };
        nextBtn.click();

        await new Promise(requestAnimationFrame);
        const t1 = performance.now();

        const renderedCount = document.querySelectorAll('.zen-q-item').length;
        const paginationInfo = document.querySelector('.zen-pagination-info')?.textContent?.trim();
        const activePage = document.querySelector('.zen-page-num-btn.is-active')?.textContent?.trim();

        return {
          pageNavTimeMs: +(t1 - t0).toFixed(2),
          activePage,
          renderedCount,
          paginationInfo
        };
      })()
    `, sessionId);

    console.log('[Step 4 Results - Page Navigation]:', JSON.stringify(pageNavPerf, null, 2));

    // Step 5: Measure Collapse [Sembunyikan daftar soal]
    console.log('\n--- Step 5: Measuring Collapse [Sembunyikan daftar soal] ---');
    const collapsePerf = await cdp.eval(`
      (async () => {
        const domBefore = document.querySelectorAll('*').length;
        const t0 = performance.now();

        const toggleBtn = document.querySelector('.zen-toggle-bank-list-btn');
        if (!toggleBtn) return { error: 'Toggle button not found' };
        toggleBtn.click();

        await new Promise(requestAnimationFrame);
        const t1 = performance.now();

        const domAfter = document.querySelectorAll('*').length;
        const renderedCount = document.querySelectorAll('.zen-q-item').length;
        const isCollapsed = !!document.querySelector('.zen-questions-section.is-collapsed');
        const filterBarPresent = !!document.querySelector('.zen-filter-bar');
        const qListPresent = !!document.querySelector('.zen-q-list');

        return {
          collapseTimeMs: +(t1 - t0).toFixed(2),
          domBefore,
          domAfter,
          domDifference: domAfter - domBefore,
          isCollapsed,
          renderedCount,
          filterBarPresent,
          qListPresent
        };
      })()
    `, sessionId);

    console.log('[Step 5 Results - Collapse]:', JSON.stringify(collapsePerf, null, 2));

  } finally {
    chrome.kill();
    server.close();
    setTimeout(() => {
      try { fs.rmSync(tmpUserData, { recursive: true, force: true }); } catch (e) {}
    }, 1000);
  }
}

runBenchmark().then(() => {
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
