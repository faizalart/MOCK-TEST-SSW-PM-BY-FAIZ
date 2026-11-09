# Implementation Plan: Fix PWA Cache Cleanup Inconsistency (Refined)

**Branch**: `001-fix-pwa-cache-cleanup` | **Date**: 2026-11-09 (Refined) | **Spec**: [specs/001-fix-pwa-cache-cleanup/spec.md](file:///c:/Users/Admin/Documents/GitHub/MOCK-TEST-SSW-PM-BY-FAIZ/specs/001-fix-pwa-cache-cleanup/spec.md)

**Input**: Feature specification from `specs/001-fix-pwa-cache-cleanup/spec.md`, Constitution v1.1.0, and refinement findings on Cache Ownership, Minimal Scope, and Verification Precision.

---

## Summary

This feature eliminates the critical PWA bug where the active application shell cache (`ssw-pm-mock-test-shell-v27`) was deleted on application load by an obsolete hardcoded exception check in `index.html` (`key !== 'ssw-pm-mock-test-shell-v25'`), while also preventing accidental deletion of unrelated same-origin caches (such as external `jft-practice*` caches on `faizalart.github.io`).

The refined architecture establishes the **Service Worker (`sw.js`) `activate` event as the Sole Authority for Cache Deletion**. `sw.js` already contains dynamic, version-independent cleanup (`key.startsWith('ssw-pm-mock-test-shell-') && key !== CACHE_NAME`), making it **Read-Only**. The inline deletion block in `index.html` is completely removed, eliminating dual authority and preventing future version drift. The Service Worker registration query parameter in `app.js` is synchronized from `?v=ssw26` to `?v=ssw27` before cache rotation testing occurs.

---

## Technical Context

**Language/Version**: Modern Vanilla JavaScript (ECMAScript 2022+ Native ES Modules), HTML5, Modern CSS3<br>
**Primary Dependencies**: None (Zero runtime dependencies, pure web standards)<br>
**Storage**:
- Browser Cache Storage API (`window.caches` and `self.caches`) for PWA shell assets
- IndexedDB (`ssw-pm-mock-test-db`, version 2) for question banks and exam sessions (strictly preserved, untouched)

**Testing**: Native Node.js dynamic consistency assertion script (`tests/verify-cache-governance.js`) and Chrome DevTools Protocol (CDP) headless browser automation (`tests/test-cache-cleanup-scenarios.js`)<br>
**Target Platform**: Desktop and Mobile evergreen browsers with PWA offline-first capabilities<br>
**Project Type**: Single-Page Application (SPA) / Progressive Web Application (PWA)<br>
**Performance Goals**: Instant cold and warm page loads (<200ms) from local cache; 100% of the 28 critical CORE shell resource entries served offline with HTTP 200<br>
**Constraints**:
- Keep `sw.js` Read-Only (it already has correct dynamic retirement)
- Strictly preserve foreign/unrelated origin caches on `faizalart.github.io` (including `jft-practice*`)
- Zero changes to IndexedDB stores, question JSON bundles, or CBT exam scoring logic
- Tier 3 Quality Gate compliance

**Scale/Scope**: Exactly 2 modified files (`index.html`, `app.js`), 0 changes to `sw.js`, 0 database migrations, 0 styling changes

---

## Constitution Check

*GATE: Evaluated against Constitution v1.1.0 Tier 3 Quality Gates.*

| Gate | Requirement | Evaluation & Status |
|---|---|---|
| **Gate 1: Zero-Dependency & Scope Check** | No external runtime dependencies, minimal blast radius. Scope strictly isolated to `index.html` and `app.js`. `sw.js` kept read-only. | **PASS**: Pure native web standards. Exactly 2 files modified. |
| **Gate 2: Schema & Data Consistency** | Database stores and question JSON bundles intact. | **PASS (Exempt / Untouched)**: Zero modifications to IndexedDB or JSON bundles. |
| **Gate 3: Multi-Viewport Browser Parity** | Verify desktop (1440px) and mobile (390px) viewports; no UI regression. | **PASS**: Zero styling, layout, or markup alterations. |
| **Gate 4: Service Worker & Cache Synchronization** | Cache names, asset query hashes, and Service Worker registration strictly synchronized to active version (`v27`). | **PASS**: Multi-file consistency verified between `sw.js:CACHE_NAME` (v27), `app.js:register` (ssw27), and `index.html` assets (ssw27). |

---

## Project Structure

### Documentation (this feature)

```text
specs/001-fix-pwa-cache-cleanup/
├── plan.md              # This refined implementation plan
├── research.md          # Phase 0 architectural analysis & decisions
├── data-model.md        # Phase 1 Cache Storage entity definitions & state transitions
├── quickstart.md        # Phase 1 reproducible test scenarios & verification guide
├── contracts/
│   └── cache-governance.md # Multi-file consistency & lifecycle contract
├── checklists/
│   └── requirements.md  # Requirement traceability checklist
└── tasks.md             # Phase 2 implementation tasks
```

### Source Code Files Affected

```text
index.html               # Lines 31-50: Remove unsafe inline cache deletion script
app.js                   # Line 5707: Synchronize SW registration query from ssw26 to ssw27
sw.js                    # READ-ONLY: Dynamic activate cleanup retained as-is
```

---

## Implementation Strategy & File Boundaries

### 1. `index.html` (Lines 31–50) — Remove Unsafe Cleanup Script (Phase 3 / US1)
- Remove lines 31–50 containing the inline cache deletion IIFE.
- Eliminates both the active `v27` cache destruction bug and the unsafe deletion of third-party `jft-practice*` caches.
- Restores pure document parsing without premature Cache Storage locks.

### 2. `app.js` (Line 5707) — Synchronize Service Worker Registration (Phase 4 / US3)
- Update registration URL:
  `navigator.serviceWorker.register('./sw.js?v=ssw26')` -> `navigator.serviceWorker.register('./sw.js?v=ssw27')`.
- Aligns registration query with the active shell version (`v27`) before cache rotation tests are run.

### 3. `sw.js` — Read-Only Preserved
- The existing `activate` event handler:
  ```javascript
  keys.filter(key => key.startsWith('ssw-pm-mock-test-shell-') && key !== CACHE_NAME).map(key => caches.delete(key))
  ```
  remains the **Sole Authority** for deleting obsolete `ssw-pm-mock-test-shell-*` caches. It is already safe, dynamic, and correctly scoped.

### 4. Version Normalization & Independent Cadences
- Shell Version integer `<N>` (currently `27`) maps to `ssw-pm-mock-test-shell-v<N>` (Cache Storage) and `?v=ssw<N>` (Shell assets & SW registration query).
- Non-shell modules maintain independent versioning (e.g., utilities `?v=ssw3`, manifest/icons `?v=ssw18`, unversioned JSON bundles) and do not bump with the shell version.

---

## Verification & Testing Plan

The implementation will be verified against all 7 specific scenarios defined in `quickstart.md`:

1. **Cold Installation**: Empty cache installation creates `ssw-pm-mock-test-shell-v27` and populates all 28 CORE critical resource entries without console errors.
2. **Service Worker Activation**: Service worker reaches `activated` state and claims clients (`navigator.serviceWorker.controller !== null`).
3. **Warm Reload**: Active cache `ssw-pm-mock-test-shell-v27` is 100% retained after page reload.
4. **Offline Reload & Critical Resource Audit**: In offline mode, 100% of the 28 critical CORE shell resource entries (HTML, 7 CSS files, 5 JS modules, 6 JSON bundles, 8 assets) are served with HTTP 200 from cache with ZERO failed critical resources.
5. **Upgrade From Legacy Cache Versions**: Seeding artificial `v25` and `v26` caches results in automatic deletion during SW activate, leaving `v27` intact.
6. **Preservation of Unrelated Same-Origin Caches**: Seeding `unrelated-project-cache-v1` and `jft-practice-core` confirms that neither is touched; both remain intact.
7. **Dynamic Static Regression & Consistency Validation**: Automated Node script (`tests/verify-cache-governance.js`) extracts `ACTIVE_VERSION` dynamically from `sw.js` and asserts consistency across `app.js` and `index.html`.
8. **Permanent Test Retention**: Both verification scripts are permanently retained in `tests/` for continuous reproducible validation.

---

## Technical Assumptions & Unproven Assumptions

### Technical Assumptions
1. **Cache Storage API Availability**: Supported in target evergreen browsers (Chromium, Safari iOS 11.3+, Firefox).
2. **Active Shell Version**: Version `v27` is the authoritative active shell version across `sw.js` and `index.html`.
3. **Storage Separation**: IndexedDB stores and `localStorage` operate on independent browser subsystems unaffected by Cache Storage operations.

### Unproven Assumptions (Daftar Asumsi yang Belum Bisa Dibuktikan)
1. **Kepemilikan Cache `jft-practice`**: Tidak dapat dibuktikan secara pasti apakah di origin `faizalart.github.io` terdapat aplikasi mandiri lain yang menggunakan prefix `jft-practice`. Oleh karena itu, asumsi bahwa `jft-practice` boleh dihapus adalah cacat; keputusan teraman adalah **tidak menghapus** cache `jft-practice`.
2. **Perilaku Update Cache WebKit iOS**: WebKit pada iOS memiliki variasi timing terkait eksekusi event `activate` saat PWA di-update. Asumsi bahwa cache lama langsung terhapus pada reload pertama memerlukan verifikasi empiris pada perangkat fisik iOS.
3. **Ketersediaan Cache API pada Private Browsing**: Pada private browsing browser tertentu (seperti Firefox Private Mode atau Android WebView restrictive settings), `window.caches` dapat bernilai `undefined` atau melempar `SecurityError`. Skrip pendaftaran SW di `app.js` mengasumsikan keberadaan `'serviceWorker' in navigator && location.protocol !== 'file:'`.
