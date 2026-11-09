# Quickstart & Verification Guide: Fix PWA Cache Cleanup Inconsistency (Refined)

**Feature**: `001-fix-pwa-cache-cleanup`<br>
**Date**: 2026-11-09 (Refined)<br>
**Status**: Ready for Verification<br>
**Governing Standard**: Constitution v1.1.0 (Tier 3 Quality Gate)

---

## 1. Inventory of 28 Critical CORE Offline Resource Entries

The following **28 CORE resource entries** defined in `sw.js:CORE` MUST be served with HTTP 200 from cache during offline execution.

> [!NOTE]
> The 28 CORE entries correspond to 26 unique on-disk asset files because `favicon.png` and `icon.svg` are each declared twice in `CORE` (one with query `?v=ssw18` and one bare path without query, ensuring full compatibility across different browser fetch requests).

| Category | Count | Resource URLs (As Declared in `sw.js:CORE`) |
|---|---|---|
| **Entry Point** | 2 | `./`, `./index.html` |
| **Shell Stylesheets (`?v=ssw27`)** | 5 | `./styles.css?v=ssw27`, `./QUESTION-EDITOR-UPDATES.css?v=ssw27`, `./ZEN-APP-SHELL.css?v=ssw27`, `./HOME-DASHBOARD.css?v=ssw27`, `./ZEN-PAGES.css?v=ssw27` |
| **Independent Stylesheets (`?v=ssw3`)** | 2 | `./CSV-IMPORT-STYLES.css?v=ssw3`, `./RICH-HTML-STYLES.css?v=ssw3` |
| **Shell Script (`?v=ssw27`)** | 1 | `./app.js?v=ssw27` |
| **Independent Scripts (`?v=ssw3`)** | 4 | `./seed-data.js?v=ssw3`, `./db.js?v=ssw3`, `./utils.js?v=ssw3`, `./archive.js?v=ssw3` |
| **Question Bundles (Static JSON)** | 6 | `./ssw-pm-kunci-ujian-1.json`, `./ssw-pm-kunci-ujian-2.json`, `./ssw-pm-all-kunci-ujian-3-to-13.json`, `./ssw-pm-tipe2-nguyen1.json`, `./ssw-pm-bonus-soal-1-to-10-bundle.json`, `./ssw-pm-special-lab-bundle.json` |
| **Visual Assets & Icons** | 8 | `./assets/zen-warrior-bg.png`, `./manifest.webmanifest?v=ssw18`, `./favicon.png?v=ssw18`, `./favicon.png`, `./hasbulla-192.png`, `./hasbulla-512.png`, `./icon.svg?v=ssw18`, `./icon.svg` |
| **TOTAL CORE ENTRIES** | **28** | *(Sum of all entries in `sw.js:CORE` array)* |

---

## 2. Test Scenarios & Execution Matrix

### Scenario 1: Cold Installation
- **Objective**: Verify that a first-time visitor with completely empty Cache Storage successfully installs the service worker and pre-caches the full v27 application shell without errors.
- **Steps**:
  1. Open DevTools -> Application -> Storage -> Click "Clear site data".
  2. Navigate to `http://localhost:8080/index.html`.
  3. Inspect Console: Verify zero uncaught errors.
  4. Inspect Application -> Cache Storage:
     - Verify bucket `ssw-pm-mock-test-shell-v27` exists.
     - Verify all 28 CORE critical resource entries are present with status 200.
- **Pass Criteria**: `ssw-pm-mock-test-shell-v27` is created and populated; console shows zero errors.

---

### Scenario 2: Service Worker Activation & Dynamic Claiming
- **Objective**: Verify that the Service Worker enters the `activated` state and claims clients immediately via `clients.claim()`.
- **Steps**:
  1. In DevTools -> Application -> Service Workers:
     - Verify status is `# active and is running`.
     - Verify Source script is `sw.js?v=ssw27`.
  2. In Console: Run `navigator.serviceWorker.controller !== null`.
- **Pass Criteria**: Controller is active (`true`) and managing the page.

---

### Scenario 3: Warm Reload (Active Cache Retention)
- **Objective**: Verify that reloading the page in normal online conditions does NOT delete or truncate the active shell cache.
- **Steps**:
  1. With `ssw-pm-mock-test-shell-v27` populated, trigger a page reload (`F5` or `location.reload()`).
  2. Inspect DevTools -> Application -> Cache Storage immediately after reload.
  3. Verify `ssw-pm-mock-test-shell-v27` remains present with all 28 CORE entries intact.
  4. Inspect Network tab: Core assets should indicate `(ServiceWorker)` in the Size column.
- **Pass Criteria**: Cache bucket `ssw-pm-mock-test-shell-v27` is 100% preserved.

---

### Scenario 4: Offline Reload & Critical Resource Availability
- **Objective**: Verify that all critical application shell resources are served offline from cache with ZERO failed critical resources.
- **Steps**:
  1. In DevTools -> Network -> Throttling dropdown, select **Offline** (or simulate complete network disconnect).
  2. Perform a hard refresh (`Ctrl + Shift + R`).
  3. Check Network panel for critical resources:
     - Verify status is `200 (from ServiceWorker)` for `index.html`, stylesheets, scripts, and JSON bundles.
     - Verify ZERO failed critical resources (no 503 Service Unavailable, no `net::ERR_INTERNET_DISCONNECTED`).
  4. Check DOM rendering:
     - Topbar `#connection-label` displays "Penyimpanan: Offline".
     - Home Dashboard renders hero section and package directory cleanly.
     - Opening Bank Soal or launching a CBT exam renders questions from cached IndexedDB/JSON bundles without network requests.
- **Pass Criteria**: 100% of critical resources served from cache; application fully operable offline with 0 failed critical resources.

---

### Scenario 5: Upgrade From Legacy Cache Versions
- **Objective**: Verify that obsolete application shell caches (`v25`, `v26`) are automatically evicted during SW activation, while the active cache (`v27`) is preserved.
- **Simulation Script**:
  ```javascript
  await caches.open('ssw-pm-mock-test-shell-v25');
  await caches.open('ssw-pm-mock-test-shell-v26');
  console.log('Seeded legacy caches:', await caches.keys());
  ```
- **Steps**:
  1. Run the simulation script above in Console.
  2. Verify that `ssw-pm-mock-test-shell-v25` and `ssw-pm-mock-test-shell-v26` exist.
  3. Reload the page and wait for the Service Worker `activate` event.
  4. Inspect `await caches.keys()`.
- **Pass Criteria**:
  - `ssw-pm-mock-test-shell-v25` is DELETED.
  - `ssw-pm-mock-test-shell-v26` is DELETED.
  - `ssw-pm-mock-test-shell-v27` is PRESERVED.

---

### Scenario 6: Preservation of Unrelated Same-Origin Caches
- **Objective**: Verify that unrelated same-origin caches (including external `jft-practice*` caches and third-party app caches) are NEVER touched.
- **Simulation Script**:
  ```javascript
  const c1 = await caches.open('unrelated-project-cache-v1');
  await c1.put('/foreign-item', new Response('safe'));
  const c2 = await caches.open('jft-practice-core');
  await c2.put('/jft-item', new Response('safe'));
  console.log('Created foreign caches:', await caches.keys());
  ```
- **Steps**:
  1. Run the simulation script to seed `unrelated-project-cache-v1` and `jft-practice-core`.
  2. Reload the page and trigger complete Service Worker activation.
  3. Check `await caches.keys()`.
- **Pass Criteria**:
  - `unrelated-project-cache-v1` remains in Cache Storage untouched.
  - `jft-practice-core` remains in Cache Storage untouched.
  - `ssw-pm-mock-test-shell-v27` remains intact.

---

### Scenario 7: Dynamic Static Regression & Consistency Validation
- **Objective**: Dynamically assert version consistency across files and verify the complete absence of hardcoded cleanup logic.
- **Permanent Validation Script (`tests/verify-cache-governance.js`)**:
  ```javascript
  import fs from 'fs';

  const swContent = fs.readFileSync('sw.js', 'utf8');
  const indexContent = fs.readFileSync('index.html', 'utf8');
  const appContent = fs.readFileSync('app.js', 'utf8');

  // 1. Extract active shell version from sw.js
  const swMatch = swContent.match(/const\s+CACHE_NAME\s*=\s*['"]ssw-pm-mock-test-shell-v(\d+)['"]/);
  if (!swMatch) throw new Error('Cannot extract active CACHE_NAME from sw.js');
  const activeVersion = swMatch[1];
  console.log(`[PASS] Active shell version extracted from sw.js: v${activeVersion}`);

  // 2. Validate app.js registration query matches active version
  const regMatch = appContent.match(/navigator\.serviceWorker\.register\(['"]\.\/sw\.js\?v=ssw(\d+)['"]\)/);
  if (!regMatch || regMatch[1] !== activeVersion) {
    throw new Error(`app.js SW registration query (v=${regMatch ? regMatch[1] : 'none'}) does not match active v${activeVersion}`);
  }
  console.log(`[PASS] app.js registers ./sw.js?v=ssw${activeVersion}`);

  // 3. Validate index.html contains ZERO hardcoded cache cleanup or deletion
  if (/caches\.delete/.test(indexContent)) {
    throw new Error('index.html must not contain caches.delete calls');
  }
  if (/ssw-pm-mock-test-shell-/.test(indexContent)) {
    throw new Error('index.html must not contain references to ssw-pm-mock-test-shell-');
  }
  console.log('[PASS] index.html has zero hardcoded cache deletions');

  // 4. Validate sw.js is strictly prefix-gated
  if (!swContent.includes("key.startsWith('ssw-pm-mock-test-shell-') && key !== CACHE_NAME")) {
    throw new Error('sw.js activate handler must use prefix gating key.startsWith and key !== CACHE_NAME');
  }
  console.log('[PASS] sw.js activate handler is dynamically and safely gated');
  ```
- **Execution Command**:
  ```powershell
  node tests/verify-cache-governance.js
  ```
- **Pass Criteria**: All 4 automated assertions log `[PASS]` with exit code 0.
