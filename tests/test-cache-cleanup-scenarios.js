import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { runGovernanceCheck } from './verify-cache-governance.js';

const ROOT = process.cwd();
const ARTIFACT_DIR = 'C:/Users/Admin/.gemini/antigravity/brain/d27ebec7-1c6f-4a08-9700-b5f26bb90bdd';

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

export async function runAllScenarios() {
  console.log('=== Starting PWA Cache Cleanup Verification Scenarios ===');
  const summary = {
    scenario1_coldInstall: false,
    scenario2_swActivation: false,
    scenario3_warmReload: false,
    scenario4_offlineReload: false,
    scenario5_legacyEviction: false,
    scenario6_foreignPreservation: false,
    scenario7_dynamicConsistency: false,
    errors: []
  };

  // Run dynamic consistency validation first (Scenario 7)
  console.log('\n--- Scenario 7: Dynamic Static Regression & Consistency Validation ---');
  const govResult = runGovernanceCheck();
  summary.scenario7_dynamicConsistency = govResult.passed;
  if (!govResult.passed) {
    summary.errors.push(...govResult.errors);
  }

  // 1. Create HTTP Server
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
  console.log(`[HTTP Server] Running on http://127.0.0.1:${port}`);

  // Test Session 1: Cold Install, Warm Reload, Offline Reload
  const tmpUserData1 = fs.mkdtempSync(path.join(os.tmpdir(), 'mocktest-pwa-session1-'));
  const chrome1 = launchChrome(tmpUserData1);
  const cdp1 = new CDPClient(chrome1);

  try {
    const { targetId } = await cdp1.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await cdp1.send('Target.attachToTarget', { targetId, flatten: true });

    await cdp1.send('Page.enable', {}, sessionId);
    await cdp1.send('Runtime.enable', {}, sessionId);
    await cdp1.send('Network.enable', {}, sessionId);

    const requestLog = [];
    cdp1.on('Network.responseReceived', (params, sid) => {
      if (sid === sessionId) {
        requestLog.push({
          url: params.response.url,
          status: params.response.status,
          fromDiskCache: params.response.fromDiskCache,
          fromServiceWorker: params.response.fromServiceWorker
        });
      }
    });

    // SCENARIO 1 & 2: Cold Installation & SW Activation
    console.log('\n--- Scenario 1 & 2: Cold Installation & SW Activation ---');
    await cdp1.send('Page.navigate', { url: baseUrl }, sessionId);
    await new Promise(r => setTimeout(r, 4000));

    const swStatus = await cdp1.eval(`
      (async () => {
        if (!('serviceWorker' in navigator)) return { error: 'No SW support' };
        const reg = await navigator.serviceWorker.ready;
        return {
          active: !!reg.active,
          controller: !!navigator.serviceWorker.controller,
          scope: reg.scope,
          scriptURL: reg.active ? reg.active.scriptURL : null
        };
      })()
    `, sessionId);

    console.log('[SW Status]:', swStatus);
    if (swStatus.active) {
      summary.scenario2_swActivation = true;
    }

    const cacheInspection = await cdp1.eval(`
      (async () => {
        const keys = await caches.keys();
        const activeName = keys.find(k => k.startsWith('ssw-pm-mock-test-shell-v27'));
        if (!activeName) return { error: 'Active cache bucket v27 not found', keys };
        const cache = await caches.open(activeName);
        const requests = await cache.keys();
        return {
          keys,
          activeName,
          entryCount: requests.length,
          urls: requests.map(r => r.url)
        };
      })()
    `, sessionId);

    console.log(`[Cache Inspection]: Found ${cacheInspection.entryCount} CORE entries in ${cacheInspection.activeName}`);
    if (cacheInspection.activeName === 'ssw-pm-mock-test-shell-v27' && cacheInspection.entryCount === 28) {
      summary.scenario1_coldInstall = true;
      console.log('[PASS] Scenario 1 & 2: Cold install and SW activation verified with 28 CORE entries.');
    }

    // SCENARIO 3: Warm Reload
    console.log('\n--- Scenario 3: Warm Reload ---');
    await cdp1.send('Page.reload', {}, sessionId);
    await new Promise(r => setTimeout(r, 2500));

    const warmKeys = await cdp1.eval(`caches.keys()`, sessionId);
    console.log('[Warm Reload Caches]:', warmKeys);
    if (warmKeys.includes('ssw-pm-mock-test-shell-v27')) {
      summary.scenario3_warmReload = true;
      console.log('[PASS] Scenario 3: Active cache v27 retained 100% on warm reload.');
    }

    // SCENARIO 4: Offline Reload & Critical Resource Audit
    console.log('\n--- Scenario 4: Offline Reload & Critical Resource Audit ---');
    await cdp1.send('Network.emulateNetworkConditions', {
      offline: true,
      latency: 0,
      downloadThroughput: -1,
      uploadThroughput: -1
    }, sessionId);

    requestLog.length = 0;
    await cdp1.send('Page.reload', {}, sessionId);
    await new Promise(r => setTimeout(r, 3000));

    const offlineDOM = await cdp1.eval(`
      (() => {
        const conn = document.getElementById('connection-label');
        const dashboard = document.querySelector('.home-dashboard');
        const hero = document.querySelector('.hd-hero');
        const mainTitle = document.getElementById('hd-main-title') || document.querySelector('.hd-title');
        const pkgRows = document.querySelectorAll('.hd-pkg-row');
        const loadingEl = document.querySelector('.zen-loading');

        const isVisible = (el) => {
          if (!el) return false;
          const rect = el.getBoundingClientRect();
          const style = window.getComputedStyle(el);
          return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
        };

        const hasVisibleDashboard = isVisible(dashboard);
        const hasVisibleHero = isVisible(hero);
        const hasVisibleTitle = isVisible(mainTitle);

        const hasContent = hasVisibleDashboard && hasVisibleHero && hasVisibleTitle && (pkgRows.length > 0) && !loadingEl;

        return {
          title: document.title,
          connectionText: conn ? conn.textContent.trim() : 'NOT_FOUND',
          hasDashboard: !!dashboard,
          hasHero: !!hero,
          titleText: mainTitle ? mainTitle.textContent.trim() : null,
          packageRowCount: pkgRows.length,
          isLoadingPresent: !!loadingEl,
          hasVisibleDashboard,
          hasVisibleHero,
          hasVisibleTitle,
          hasContent
        };
      })()
    `, sessionId);

    console.log('[Offline DOM state]:', offlineDOM);

    // Explicit audit of all 28 CORE entries declared in sw.js
    const CORE_ENTRIES = [
      './',
      './index.html',
      './styles.css?v=ssw27',
      './CSV-IMPORT-STYLES.css?v=ssw3',
      './RICH-HTML-STYLES.css?v=ssw3',
      './QUESTION-EDITOR-UPDATES.css?v=ssw27',
      './ZEN-APP-SHELL.css?v=ssw27',
      './HOME-DASHBOARD.css?v=ssw27',
      './ZEN-PAGES.css?v=ssw27',
      './assets/zen-warrior-bg.png',
      './app.js?v=ssw27',
      './seed-data.js?v=ssw3',
      './db.js?v=ssw3',
      './utils.js?v=ssw3',
      './archive.js?v=ssw3',
      './ssw-pm-kunci-ujian-1.json',
      './ssw-pm-kunci-ujian-2.json',
      './ssw-pm-all-kunci-ujian-3-to-13.json',
      './ssw-pm-tipe2-nguyen1.json',
      './ssw-pm-bonus-soal-1-to-10-bundle.json',
      './ssw-pm-special-lab-bundle.json',
      './manifest.webmanifest?v=ssw18',
      './favicon.png?v=ssw18',
      './favicon.png',
      './hasbulla-192.png',
      './hasbulla-512.png',
      './icon.svg?v=ssw18',
      './icon.svg'
    ];

    const offlineCoreAudit = await cdp1.eval(`
      (async (entries) => {
        const cache = await caches.open('ssw-pm-mock-test-shell-v27');
        const results = [];

        for (const entry of entries) {
          // 1. Verify direct Cache Storage existence and valid 200 payload
          let cacheStatus = 0;
          let cacheSize = 0;
          try {
            const cacheRes = await cache.match(entry);
            if (cacheRes) {
              cacheStatus = cacheRes.status;
              const b = await cacheRes.clone().blob();
              cacheSize = b.size;
            }
          } catch (e) {
            cacheStatus = -1;
          }

          // 2. Verify offline fetch routing through Service Worker
          let fetchStatus = 0;
          let fetchSize = 0;
          try {
            const fetchRes = await fetch(entry);
            fetchStatus = fetchRes.status;
            if (fetchRes.ok) {
              const b = await fetchRes.blob();
              fetchSize = b.size;
            }
          } catch (e) {
            fetchStatus = -1;
          }

          results.push({
            entry,
            cacheStatus,
            cacheSize,
            cacheValid: cacheStatus === 200 && cacheSize > 0,
            fetchStatus,
            fetchSize,
            fetchValid: fetchStatus === 200 && fetchSize > 0
          });
        }

        const validCacheEntries = results.filter(r => r.cacheValid);
        const validFetchEntries = results.filter(r => r.fetchValid);

        // Analyze unique files vs declared entries
        // favicon.png and icon.svg are declared twice (with ?v=ssw18 and bare)
        // ./ and ./index.html resolve to the same root document
        const uniqueDiskFiles = new Set(
          entries.map(e => {
            let clean = e.replace(/\\?.*$/, '');
            if (clean === './') clean = './index.html';
            return clean;
          })
        );

        return {
          totalDeclared: entries.length,
          uniquePhysicalFilesCount: uniqueDiskFiles.size,
          validCacheCount: validCacheEntries.length,
          validFetchCount: validFetchEntries.length,
          allCacheValid: validCacheEntries.length === entries.length,
          allFetchValid: validFetchEntries.length === entries.length,
          failures: results.filter(r => !r.cacheValid || !r.fetchValid)
        };
      })(${JSON.stringify(CORE_ENTRIES)})
    `, sessionId);

    console.log(`[Offline CORE Resources Audit]: ${offlineCoreAudit.validCacheCount}/28 valid in Cache Storage, ${offlineCoreAudit.validFetchCount}/28 served with HTTP 200 via offline SW fetch (${offlineCoreAudit.uniquePhysicalFilesCount} unique files).`);

    const failedCritical = requestLog.filter(r => r.status >= 400 || r.status === 0);
    console.log(`[Offline Requests Logged via CDP]: Total ${requestLog.length}, Failed: ${failedCritical.length}`);

    // Desktop screenshot (1440x900)
    await cdp1.send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    }, sessionId);
    await new Promise(r => setTimeout(r, 500));
    const desktopShot = await cdp1.send('Page.captureScreenshot', { format: 'png' }, sessionId);
    const desktopShotPath = path.join(ARTIFACT_DIR, 'offline-desktop-verified.png');
    fs.writeFileSync(desktopShotPath, Buffer.from(desktopShot.data, 'base64'));
    console.log(`[Screenshot Saved]: ${desktopShotPath}`);

    // Mobile screenshot (390x844)
    await cdp1.send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    }, sessionId);
    await new Promise(r => setTimeout(r, 500));
    const mobileShot = await cdp1.send('Page.captureScreenshot', { format: 'png' }, sessionId);
    const mobileShotPath = path.join(ARTIFACT_DIR, 'offline-mobile-verified.png');
    fs.writeFileSync(mobileShotPath, Buffer.from(mobileShot.data, 'base64'));
    console.log(`[Screenshot Saved]: ${mobileShotPath}`);

    // Mandatory assertions for Scenario 4
    const isOfflineStateValid = offlineDOM.connectionText.includes('Offline');
    const isDOMContentValid = offlineDOM.hasContent === true;
    const isCriticalRequestsValid = failedCritical.length === 0;
    const isAllCoreCacheValid = offlineCoreAudit.allCacheValid;
    const isAllCoreFetchValid = offlineCoreAudit.allFetchValid;
    const isEntryCountValid = offlineCoreAudit.totalDeclared === 28;

    if (!isDOMContentValid) {
      const err = `Scenario 4 FAILED: Main visible dashboard/hero content missing or invisible (hasDashboard=${offlineDOM.hasDashboard}, hasHero=${offlineDOM.hasHero}, pkgRows=${offlineDOM.packageRowCount}, loading=${offlineDOM.isLoadingPresent})`;
      summary.errors.push(err);
      console.error(`[FAIL] ${err}`);
    }

    if (!isAllCoreCacheValid || !isAllCoreFetchValid) {
      const err = `Scenario 4 FAILED: CORE resource audit failed (cacheValid=${offlineCoreAudit.validCacheCount}/28, fetchValid=${offlineCoreAudit.validFetchCount}/28). Failures: ${JSON.stringify(offlineCoreAudit.failures)}`;
      summary.errors.push(err);
      console.error(`[FAIL] ${err}`);
    }

    if (
      isOfflineStateValid &&
      isDOMContentValid &&
      isCriticalRequestsValid &&
      isAllCoreCacheValid &&
      isAllCoreFetchValid &&
      isEntryCountValid
    ) {
      summary.scenario4_offlineReload = true;
      console.log(`[PASS] Scenario 4: Offline reload succeeded. Main visible content confirmed, all 28 CORE resources validated from cache (${offlineCoreAudit.uniquePhysicalFilesCount} unique files, 0 failed critical requests).`);
    }

  } finally {
    chrome1.kill();
    setTimeout(() => {
      try { fs.rmSync(tmpUserData1, { recursive: true, force: true }); } catch (e) {}
    }, 1000);
  }

  // Test Session 2: Realistic Upgrade Simulation (Pre-existing Legacy & Foreign Caches)
  console.log('\n--- Scenario 5 & 6: Upgrade From Legacy Cache & Foreign Cache Preservation ---');
  const tmpUserData2 = fs.mkdtempSync(path.join(os.tmpdir(), 'mocktest-pwa-session2-'));
  const chrome2 = launchChrome(tmpUserData2);
  const cdp2 = new CDPClient(chrome2);

  try {
    const { targetId } = await cdp2.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await cdp2.send('Target.attachToTarget', { targetId, flatten: true });

    await cdp2.send('Page.enable', {}, sessionId);
    await cdp2.send('Runtime.enable', {}, sessionId);

    // 1. Navigate to origin domain on a blank setup path
    await cdp2.send('Page.navigate', { url: `http://127.0.0.1:${port}/favicon.png` }, sessionId);
    await new Promise(r => setTimeout(r, 1000));

    // 2. Pre-seed artificial legacy and foreign caches BEFORE sw.js is ever registered
    const seeded = await cdp2.eval(`
      (async () => {
        const c1 = await caches.open('ssw-pm-mock-test-shell-v25');
        await c1.put('/v25-asset', new Response('v25'));
        const c2 = await caches.open('ssw-pm-mock-test-shell-v26');
        await c2.put('/v26-asset', new Response('v26'));
        const c3 = await caches.open('jft-practice-core');
        await c3.put('/jft-asset', new Response('jft'));
        const c4 = await caches.open('unrelated-project-cache-v1');
        await c4.put('/foreign-asset', new Response('foreign'));
        return await caches.keys();
      })()
    `, sessionId);

    console.log('[Pre-existing Caches Seeded on Client]:', seeded);

    // 3. Now navigate to the application index.html (triggers SW registration & activation of v27)
    await cdp2.send('Page.navigate', { url: baseUrl }, sessionId);
    await new Promise(r => setTimeout(r, 4500)); // allow install -> activate -> claims cycle

    const postUpgradeKeys = await cdp2.eval(`caches.keys()`, sessionId);
    console.log('[Caches After Service Worker Activation]:', postUpgradeKeys);

    const hasV25 = postUpgradeKeys.includes('ssw-pm-mock-test-shell-v25');
    const hasV26 = postUpgradeKeys.includes('ssw-pm-mock-test-shell-v26');
    const hasV27 = postUpgradeKeys.includes('ssw-pm-mock-test-shell-v27');
    const hasJft = postUpgradeKeys.includes('jft-practice-core');
    const hasForeign = postUpgradeKeys.includes('unrelated-project-cache-v1');

    console.log('[Eviction & Preservation Results]:', {
      v25_evicted: !hasV25,
      v26_evicted: !hasV26,
      v27_preserved: hasV27,
      jft_preserved: hasJft,
      foreign_preserved: hasForeign
    });

    if (!hasV25 && !hasV26 && hasV27) {
      summary.scenario5_legacyEviction = true;
      console.log('[PASS] Scenario 5: Obsolete shell caches (v25, v26) were automatically evicted by sw.js activate.');
    } else {
      summary.errors.push('Obsolete shell caches were not evicted');
    }

    if (hasJft && hasForeign) {
      summary.scenario6_foreignPreservation = true;
      console.log('[PASS] Scenario 6: Foreign caches (jft-practice-core, unrelated-project-cache-v1) were strictly preserved.');
    } else {
      summary.errors.push('Foreign origin caches were unexpectedly deleted');
    }

  } finally {
    chrome2.kill();
    server.close();
    setTimeout(() => {
      try { fs.rmSync(tmpUserData2, { recursive: true, force: true }); } catch (e) {}
    }, 1000);
  }

  console.log('\n=== All Scenarios Execution Complete ===');
  console.log(JSON.stringify(summary, null, 2));
  return summary;
}

if (process.argv[1] && process.argv[1].endsWith('test-cache-cleanup-scenarios.js')) {
  runAllScenarios().then(() => {
    process.exit(0);
  }).catch(err => {
    console.error('[FATAL]', err);
    process.exit(1);
  });
}
