import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { runGovernanceCheck } from './verify-cache-governance.js';

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

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      resolve({ server, port, origin: `http://127.0.0.1:${port}` });
    });
  });
}

function findChromePath() {
  const possiblePaths = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    `${process.env.LOCALAPPDATA}/Google/Chrome/Application/chrome.exe`
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error('Chrome executable not found on host');
}

const delay = ms => new Promise(r => setTimeout(r, ms));

export async function runExamTimerCenteringTests() {
  console.log('=== RUNNING EXAM TIMER CENTERING REGRESSION TEST SUITE ===\n');

  console.log('--- Pre-check: Cache Governance & SW Invariants ---');
  const gov = runGovernanceCheck();
  if (!gov.passed) {
    throw new Error('Cache governance failed: ' + gov.errors.join('; '));
  }
  console.log('[PASS] Governance check verified.\n');

  const { server, origin } = await startStaticServer();
  const chromePath = findChromePath();
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-timer-test-'));

  const chrome = spawn(
    chromePath,
    [
      '--headless=new',
      '--remote-debugging-pipe',
      '--no-first-run',
      '--no-default-browser-check',
      `--user-data-dir=${userDataDir}`,
      'about:blank'
    ],
    { stdio: ['ignore', 'ignore', 'ignore', 'pipe', 'pipe'] }
  );

  const cdp = new CDPClient(chrome);
  await delay(600);

  const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });

  await cdp.send('Page.enable', {}, sessionId);
  await cdp.send('Runtime.enable', {}, sessionId);

  // Initial boot at desktop
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  }, sessionId);

  await cdp.send('Page.navigate', { url: origin + '/index.html' }, sessionId);
  await delay(1200);

  // Wait until boot finishes
  await cdp.send('Runtime.evaluate', {
    expression: `
      new Promise((resolve) => {
        const check = () => {
          if (window.state && window.state.questions && window.state.questions.length > 0 && typeof window.startExam === 'function') {
            resolve(true);
          } else {
            setTimeout(check, 100);
          }
        };
        check();
      })
    `,
    awaitPromise: true
  }, sessionId);

  // Start exam
  await cdp.send('Runtime.evaluate', {
    expression: `
      (async () => {
        window.state.setup = {
          mode: 'custom',
          setId: 'ssw-pm-kunci-ujian-1',
          count: 40,
          duration: 70,
          passingScore: 65,
          random: false,
          shuffleOptions: false
        };
        await window.startExam();
      })()
    `,
    awaitPromise: true
  }, sessionId);
  await delay(800);

  const viewports = [
    { name: 'Portrait Mobile (390 x 844)', width: 390, height: 844, mobile: true, landscape: false },
    { name: 'Landscape Android (844 x 390)', width: 844, height: 390, mobile: true, landscape: true },
    { name: 'Landscape Samsung Galaxy (915 x 412)', width: 915, height: 412, mobile: true, landscape: true },
    { name: 'Landscape Compact (740 x 360)', width: 740, height: 360, mobile: true, landscape: true },
    { name: 'Desktop (1440 x 900)', width: 1440, height: 900, mobile: false, landscape: false }
  ];

  const summary = {
    allPassed: true,
    results: []
  };

  for (const vp of viewports) {
    console.log(`--- Testing Viewport: ${vp.name} ---`);
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: vp.mobile ? 2 : 1,
      mobile: vp.mobile,
      screenOrientation: vp.landscape
        ? { angle: 90, type: 'landscapePrimary' }
        : { angle: 0, type: 'portraitPrimary' }
    }, sessionId);
    await delay(300);

    const check = await cdp.send('Runtime.evaluate', {
      expression: `
        (function() {
          const header = document.querySelector('.exam-header');
          const left = document.querySelector('.exam-header-left');
          const center = document.querySelector('.exam-header-center');
          const timer = document.querySelector('.exam-clock');
          const right = document.querySelector('.exam-header-right');
          const finish = document.querySelector('.exam-header-finish');

          if (!header || !center || !timer || !left || !right) {
            return { error: 'Missing header elements' };
          }

          const hr = header.getBoundingClientRect();
          const lr = left.getBoundingClientRect();
          const cr = center.getBoundingClientRect();
          const tr = timer.getBoundingClientRect();
          const rr = right.getBoundingClientRect();
          const fr = finish ? finish.getBoundingClientRect() : null;

          const vpWidth = window.innerWidth;
          const vpMidX = vpWidth / 2;
          const headerMidX = hr.left + hr.width / 2;
          const centerMidX = cr.left + cr.width / 2;
          const timerMidX = tr.left + tr.width / 2;

          const diffViewport = Math.abs(timerMidX - vpMidX);
          const diffHeader = Math.abs(timerMidX - headerMidX);

          // Overlap check
          const noLeftOverlap = lr.right <= cr.left;
          const noRightOverlap = cr.right <= rr.left;

          return {
            vpWidth,
            vpMidX,
            headerMidX,
            timerMidX,
            diffViewport,
            diffHeader,
            noLeftOverlap,
            noRightOverlap,
            leftRight: lr.right,
            centerLeft: cr.left,
            centerRight: cr.right,
            rightLeft: rr.left,
            gridColumns: window.getComputedStyle(header).gridTemplateColumns
          };
        })()
      `,
      returnByValue: true
    }, sessionId);

    const val = check.result.value;
    console.log(`[Viewport ${vp.width}x${vp.height}] Timer Midpoint: ${val.timerMidX}px | Viewport Midpoint: ${val.vpMidX}px`);
    console.log(`[Deviation] vs Viewport: ${val.diffViewport.toFixed(3)}px | vs Header: ${val.diffHeader.toFixed(3)}px`);
    console.log(`[Isolation] Left-to-Center Gap: ${(val.centerLeft - val.leftRight).toFixed(1)}px | Center-to-Right Gap: ${(val.rightLeft - val.centerRight).toFixed(1)}px`);
    console.log(`[Grid Tracks]: ${val.gridColumns}`);

    const isCentered = val.diffViewport <= 1.0;
    const isIsolated = val.noLeftOverlap && val.noRightOverlap;

    if (!isCentered || !isIsolated) {
      summary.allPassed = false;
      console.error(`[FAIL] Viewport ${vp.name} failed verification.`);
    } else {
      console.log(`[PASS] Viewport ${vp.name}: Timer is geometrically centered with 0 overlap.`);
    }

    summary.results.push({
      viewport: vp.name,
      isCentered,
      isIsolated,
      deviation: val.diffViewport
    });
    console.log('');
  }

  try { chrome.kill(); } catch {}
  await new Promise(r => server.close(r));
  try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch {}

  console.log('=== TIMER CENTERING REGRESSION SUMMARY ===');
  console.log(JSON.stringify(summary, null, 2));

  if (!summary.allPassed) {
    process.exit(1);
  }
  return summary;
}

if (process.argv[1] && process.argv[1].endsWith('test-exam-timer-centering.mjs')) {
  runExamTimerCenteringTests().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}
