# Research & Technical Decisions: Fix PWA Cache Cleanup Inconsistency (Refined)

**Feature**: `001-fix-pwa-cache-cleanup`<br>
**Date**: 2026-11-09 (Refined)<br>
**Status**: Completed<br>
**Governing Standard**: Constitution v1.1.0 (Tier 3 Quality Gate)

---

## 1. Problem Investigation & Codebase Audit Findings

### 1.1 Current State Audit
An end-to-end trace of Cache Storage interactions across the repository revealed the following architectural facts:

1. **Service Worker (`sw.js`) — Scope & Behavior**:
   - Declares active shell cache bucket: `const CACHE_NAME = 'ssw-pm-mock-test-shell-v27';` (Line 1).
   - Handles `activate` event (Lines 66–81):
     ```javascript
     const keys = await caches.keys();
     await Promise.all(
       keys
         .filter(key => key.startsWith('ssw-pm-mock-test-shell-') && key !== CACHE_NAME)
         .map(key => caches.delete(key))
     );
     await self.clients.claim();
     ```
     *Finding*: The Service Worker `activate` handler is **already fully dynamic, robust, and correctly scoped**. It uses `key.startsWith('ssw-pm-mock-test-shell-')` and dynamically exempts `key !== CACHE_NAME`. It does not touch foreign origin caches or unrelated caches.
     *Decision on `sw.js`*: **`sw.js` MUST BE KEPT READ-ONLY**. No changes are needed or justified in `sw.js`.

2. **Client Document Entry Point (`index.html`) — The Regression Point**:
   - Loads stylesheet links and scripts tagged with `?v=ssw27`.
   - Executes an inline cache cleanup script in `<head>` (Lines 31–50):
     ```javascript
     (function () {
       try {
         if ('caches' in window) {
           caches.keys().then(function (keys) {
             keys.forEach(function (key) {
               if (
                 key.indexOf('jft-practice') !== -1 ||
                 (key.indexOf('ssw-pm-mock-test-shell-') === 0 && key !== 'ssw-pm-mock-test-shell-v25')
               ) {
                 caches.delete(key);
               }
             });
           });
         }
       } catch (error) {
         console.warn('Service Worker cache cleanup:', error);
       }
     })();
     ```
     *Finding 1 (Active Cache Destruction)*: The inline script checks `(key.indexOf('ssw-pm-mock-test-shell-') === 0 && key !== 'ssw-pm-mock-test-shell-v25')`. Because `CACHE_NAME` is `v27`, `key !== '...v25'` is TRUE for `v27`, so `index.html` deletes the active `v27` cache on every page load.
     *Finding 2 (Unsafe Origin-Scoped Deletion of `jft-practice`)*: CacheStorage is origin-scoped (`faizalart.github.io`). If another project/application under `faizalart.github.io` uses caches containing `jft-practice`, this script unilaterally destroys that third-party application's cache without proof of ownership.

3. **Service Worker Registration (`app.js`) — Version Drift**:
   - Registers the service worker at Line 5707:
     ```javascript
     navigator.serviceWorker.register('./sw.js?v=ssw26').catch(err => console.warn('Service worker gagal didaftarkan:', err));
     ```
     *Finding*: The registration script query string is desynchronized at `?v=ssw26`, while the active shell is `v27` and assets are `?v=ssw27`.

---

## 2. Refined Architectural Decisions & Rationale

### Decision 1: Single Cache Cleanup Authority in Service Worker `activate`
- **Decision**: Establish the Service Worker (`sw.js`) `activate` event as the **Sole Authority** for versioned shell cache deletion. Completely remove all cache deletion logic from `index.html`.
- **Rationale**:
  - The Service Worker lifecycle (`install` -> `activate` -> `claim`) is the standard W3C pattern specifically engineered for atomic cache rotation.
  - Having `index.html` attempt cache cleanup creates an unmaintainable dual-authority model and inevitable version drift.
  - `sw.js` already possesses the dynamic filter `key.startsWith('ssw-pm-mock-test-shell-') && key !== CACHE_NAME`.
  - By stripping cache deletion from `index.html`, `index.html` can never accidentally destroy active or future shell caches (`v27`, `v28`, etc.).
- **Alternatives Considered**:
  - *Alternative 1A (Update v25 to v27 in index.html)*: **Rejected**. Fragile hardcoding that guarantees another regression when bumping to v28.
  - *Alternative 1B (Retain jft-practice deletion in index.html)*: **Rejected**. CacheStorage is origin-scoped. There is no cryptographic or namespace proof that a cache named `jft-practice*` on `faizalart.github.io` belongs to this repository; deleting it risks damaging independent projects on the same domain.

### Decision 2: Minimal File Scope (Keep `sw.js` Read-Only)
- **Decision**: Treat `sw.js` as **Read-Only**. Confine code changes strictly to:
  1. `index.html`: Remove the inline cache deletion script (Lines 31–50).
  2. `app.js`: Line 5707, update `./sw.js?v=ssw26` -> `./sw.js?v=ssw27`.
- **Rationale**:
  - `sw.js`'s dynamic retirement logic is already optimal and bug-free.
  - Touching `sw.js` without technical necessity violates Constitution Principle III (Minimal Changes).
  - Isolating changes to `index.html` and `app.js` minimizes blast radius and simplifies regression verification.

### Decision 3: Consistency Validation & Version Normalization
- **Decision**: Acknowledge that the project does NOT have a single automated build-time constant for versioning. Instead, define and enforce a strict **Consistency Validation Protocol** with formal version mapping:
  - **Shell Version Token**: Integer `<N>` (currently `27`).
  - **Cache Storage Container**: `ssw-pm-mock-test-shell-v<N>` (e.g., `v27`).
  - **Shell Asset & Registration Queries**: `?v=ssw<N>` (e.g., `ssw27`).
  - **Independent Non-Shell Versions**: Modules with independent release cadences maintain separate version tags (e.g., utilities `?v=ssw3`, manifest/icons `?v=ssw18`, and unversioned JSON bundles) and do not bump with the shell version.
  - `index.html` must contain ZERO cache version literals or cleanup scripts.
- **Rationale**:
  - Transparently addresses multi-file version distribution while preventing desynchronization through automated consistency assertions.

### Decision 4: Origin Isolation & Unrelated Cache Preservation
- **Decision**:
  - `sw.js` only targets keys satisfying `key.startsWith('ssw-pm-mock-test-shell-') && key !== CACHE_NAME`.
  - `index.html` does NOT delete any cache keys.
  - Any cache key not matching `ssw-pm-mock-test-shell-` (e.g. `unrelated-app-cache`, `jft-practice*`) is strictly ignored and preserved.
- **Rationale**:
  - Protects multi-app multi-repo environments on GitHub Pages (`faizalart.github.io`).

### Decision 5: Precise Offline Critical Resource Verification (28 CORE Entries)
- **Decision**: Replace vague claims of "0 network requests" with explicit verification that 100% of the **28 Critical CORE Resource Entries** defined in `sw.js:CORE` are served with HTTP 200 from cache during offline mode with zero failed critical resources:
  - Entry Point (2): `./`, `./index.html`
  - Shell Stylesheets (5): `styles.css?v=ssw27`, `QUESTION-EDITOR-UPDATES.css?v=ssw27`, `ZEN-APP-SHELL.css?v=ssw27`, `HOME-DASHBOARD.css?v=ssw27`, `ZEN-PAGES.css?v=ssw27`
  - Independent Stylesheets (2): `CSV-IMPORT-STYLES.css?v=ssw3`, `RICH-HTML-STYLES.css?v=ssw3`
  - Shell Script (1): `app.js?v=ssw27`
  - Independent Scripts (4): `seed-data.js?v=ssw3`, `db.js?v=ssw3`, `utils.js?v=ssw3`, `archive.js?v=ssw3`
  - Question Bundles (6): `ssw-pm-kunci-ujian-1.json`, `ssw-pm-kunci-ujian-2.json`, `ssw-pm-all-kunci-ujian-3-to-13.json`, `ssw-pm-tipe2-nguyen1.json`, `ssw-pm-bonus-soal-1-to-10-bundle.json`, `ssw-pm-special-lab-bundle.json`
  - Visual Assets (8): `assets/zen-warrior-bg.png`, `manifest.webmanifest?v=ssw18`, `favicon.png?v=ssw18`, `favicon.png`, `hasbulla-192.png`, `hasbulla-512.png`, `icon.svg?v=ssw18`, `icon.svg`
  *(Note: 28 CORE entries correspond to 26 unique file paths, as favicon and icon are declared with and without query strings).*
- **Rationale**:
  - Guarantees true offline usability without false positives or uncached dependency failures.

---

## 3. Tier 3 Quality Gate Compliance Matrix

| Principle / Gate | Requirement | Compliance Strategy | Status |
|---|---|---|---|
| **I. Preserve Existing Functionality** | Zone A CBT & non-CBT stability | Zero modifications to CBT code, timers, scoring, or navigation. | PASS |
| **II. Data Integrity & Schema** | Database stores & question JSON intact | Zero modifications to IndexedDB or JSON bundles. | PASS |
| **III. Minimal Changes** | Surgical, scoped changes only | Exactly 2 minimal edits: `index.html` (remove unsafe cleanup) and `app.js` (registration query). `sw.js` is read-only. | PASS |
| **IV. UI Consistency** | Zen White Design System | Zero UI/CSS modifications. | PASS |
| **V. Mobile Responsiveness** | Desktop & mobile viewport parity | Tested across 1440px desktop and 390px mobile viewports. | PASS |
| **VI. Zero-Dependency PWA** | Native vanilla JS, cache sync | Synchronized v27 shell, single cleanup authority in SW activate, zero dependencies. | PASS |
| **VII. Testing & Verification** | Empirical reproduction via Node & Headless Chromium | 7 automated/headless verification scenarios including critical resource audits and dynamic consistency checking. Skrip tes dipertahankan permanen di `tests/`. | PASS |
| **VIII. Documentation** | Architecture rationale recorded | All decisions documented with One-Line Decision Rationale. | PASS |
