# Feature Specification: Fix PWA Cache Cleanup Inconsistency (Refined)

**Feature Branch**: `001-fix-pwa-cache-cleanup`

**Created**: 2026-11-09

**Status**: Ready for Planning / Implementation

**Input**: User description: "Buat spesifikasi untuk memperbaiki inkonsistensi cache cleanup pada PWA SSW PM Mock Test."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Preserving Active Application Shell Cache During Client Cleanup (Priority: P1)

As a candidate preparing for the SSW Food & Beverage Manufacturing examination,
I want the application to retain the active application shell cache whenever I open or reload the website,
So that I can study seamlessly without redundant network downloads and continue practicing CBT exams even when I have no internet connection.

**Why this priority**:
Preserving the active cache is fundamental to offline-first Progressive Web Application (PWA) reliability. If an overly broad or desynchronized cleanup script deletes the active shell cache, offline exam taking fails, defeating the primary offline-first guarantee mandated in Constitution Principle VI.

**Independent Test**:
Can be fully tested by loading the website once to populate the active cache, reloading the page, disconnecting network access, and verifying that the entire application shell (home dashboard, navigation, question bank, and CBT simulator) loads successfully from the active cache without throwing network failure errors.

**Acceptance Scenarios**:

1. **Given** a user has visited the website and established the active shell cache (`ssw-pm-mock-test-shell-v27`),
   **When** the user reloads the application or navigates across pages while online or offline,
   **Then** the client-side cleanup routine MUST NOT delete or invalidate the active cache bucket (`ssw-pm-mock-test-shell-v27`).
2. **Given** a candidate opens the application in a zero-connectivity (airplane mode / offline) environment,
   **When** the application starts up,
   **Then** the active cache storage remains intact, and the service worker serves all critical shell assets (`index.html`, `styles.css`, `app.js`, etc.) from cache.

---

### User Story 2 - Automated Purging of Obsolete and Stale Cache Versions (Priority: P2)

As a system maintainer and returning candidate,
I want obsolete cache buckets from older application versions to be purged automatically and safely,
So that stale bug-ridden scripts, legacy stylesheets, or pre-refactor assets do not consume local device storage or cause mixed-version runtime errors, while never touching unproven or unrelated caches on the same origin.

**Why this priority**:
As the application evolves (e.g., from v25/v26 to v27), leaving stale cache stores around wastes user storage and can lead to cache collisions or resource leaks across service worker activation cycles. Conversely, deleting unproven or unrelated caches on a shared origin like GitHub Pages causes collateral damage to adjacent projects.

**Independent Test**:
Can be tested by seeding artificial obsolete cache buckets (e.g., `ssw-pm-mock-test-shell-v25`, `ssw-pm-mock-test-shell-v26`) alongside unrelated/unproven same-origin cache buckets (e.g., `jft-practice-core`, `unrelated-project-cache-v1`) in Cache Storage, triggering Service Worker activation, and verifying that only proven obsolete application buckets (`v25`, `v26`) are removed, while the active cache (`v27`), `jft-practice-core`, and foreign caches remain 100% intact.

**Acceptance Scenarios**:

1. **Given** an existing candidate's device contains obsolete cache stores with proven application prefix `ssw-pm-mock-test-shell-` (older versions like `v25`, `v26`),
   **When** the application initializes and activates the updated service worker,
   **Then** all obsolete `ssw-pm-mock-test-shell-*` buckets differing from the active shell version MUST be evicted cleanly from storage by the Service Worker `activate` authority.
2. **Given** the cache storage contains keys whose ownership is unproven or unrelated to the application (such as `jft-practice*`, external project caches, or library storage on the same origin),
   **When** cache inspection and cleanup occurs,
   **Then** the system MUST NEVER delete or modify these unproven or unrelated keys, preserving them completely.

---

### User Story 3 - Eliminating Hardcoded Version Drift Across Entry Points (Priority: P3)

As a developer and code maintainer,
I want cache version management to be harmonized and free of forgotten hardcoded negative exceptions,
So that future shell updates (e.g., bumping to v28) do not require fragile multi-file manual search-and-replace or risk accidental premature cache purges.

**Why this priority**:
The codebase audit identified that `sw.js` uses dynamic cache management (`key !== CACHE_NAME`), but `index.html` contained an obsolete hardcoded exception (`key !== 'ssw-pm-mock-test-shell-v25'`). Removing fragile hardcoded strings prevents future regression debt and satisfies Constitution Principle VI.

**Independent Test**:
Can be tested via codebase inspection verifying that no outdated version string exists in `index.html`, and by programmatically simulating future cache version bumps to confirm that cleanup logic dynamically preserves the active version without code drift.

**Acceptance Scenarios**:

1. **Given** the application shell version is incremented in `sw.js` and asset query strings,
   **When** inspecting the client-side document in `index.html`,
   **Then** there MUST be zero lingering hardcoded references to superseded cache versions (e.g., `v25`) and zero client-side cache deletion logic.
2. **Given** the service worker lifecycle handles cache activation and claiming,
   **When** cache cleanup responsibility is evaluated,
   **Then** the delegation of cache deletion MUST be consistent, deterministic, and assigned exclusively to the Service Worker `activate` event.

---

### Edge Cases

- **Offline Launch on First Cleanup**: When a user is offline and opens the application, the Cache API is checked before network requests. The client document MUST NOT delete the active cache before the service worker has resolved requests.
- **Cache API Unavailable / Throws**: In restrictive browsing environments (e.g., private windows with disabled persistent storage, unsupported older web views, or security exceptions), `caches.keys()` or `caches.delete()` may throw. Startup logic must never crash the main application bootstrap.
- **First-Time Visitors (Empty Cache Storage)**: When a visitor opens the app for the very first time, `caches.keys()` returns an empty array. The Service Worker installation routine MUST complete cleanly with zero errors.
- **Concurrent Tabs During Service Worker Activation**: When multiple tabs of the CBT application are open during an update, cache cleanup MUST NOT invalidate active resources currently in use by adjacent tabs.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST preserve the active application shell cache during all client-side and service worker operations.
- **FR-002**: The system MUST automatically identify and delete obsolete application cache stores matching the proven naming pattern `ssw-pm-mock-test-shell-*` that do not match the active version, while strictly preserving any unproven or unrelated cache stores (such as `jft-practice-*` or third-party project caches).
- **FR-003**: The client entry point (`index.html`) MUST NOT contain obsolete hardcoded cache version strings or client-side cache deletion routines that contradict the active service worker configuration.
- **FR-004**: The cache governance mechanism MUST ensure that cache version identifiers (`v<N>`), shell asset query hashes (`?v=ssw<N>`), and Service Worker registration URL (`./sw.js?v=ssw<N>`) remain strictly synchronized as required by Constitution Principle VI.
- **FR-005**: All Service Worker registration and runtime error handling MUST be resilient and non-blocking, ensuring that errors or permission restrictions do not halt DOM rendering, event loop execution, or application startup.
- **FR-006**: The cache cleanup scope MUST be strictly confined to Cache Storage. It MUST NOT modify, inspect, or delete IndexedDB stores (`questions`, `themes`, `passages`, `sessions`, `meta`, `audioGroups`, `studyList`), `localStorage` user preferences, or mock test session states.

### Key Entities

- **Active Shell Cache**: The authoritative Cache Storage bucket (`ssw-pm-mock-test-shell-v27`) containing pre-cached application assets (`index.html`, stylesheets, scripts, fonts, icons, and built-in question JSON bundles) required for instant offline execution.
- **Obsolete Application Cache Bucket**: A proven application Cache Storage container matching prefix `ssw-pm-mock-test-shell-` (e.g., `ssw-pm-mock-test-shell-v25`, `ssw-pm-mock-test-shell-v26`) created by prior application releases that differs from the active version and is evicted exclusively by `sw.js`.
- **Foreign / Unproven Cache Bucket**: Any cache bucket not matching `ssw-pm-mock-test-shell-` (e.g., `jft-practice-core`, `unrelated-project-cache-v1`) whose ownership is unproven on the shared origin and must be strictly preserved.
- **Cache Governance Policy**: The coordinated rule set across `sw.js`, `index.html`, and `app.js` dictating when and how caches are opened, populated, matched, and cleaned up without causing race conditions or premature resource deletion.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The active shell cache (`ssw-pm-mock-test-shell-v27`) remains 100% intact across page reloads, browser restarts, and navigation changes.
- **SC-002**: 100% of detected obsolete application cache buckets (`v25`, `v26`) are successfully deleted upon Service Worker activation, while 100% of foreign or unproven same-origin caches (including `jft-practice-core`) remain preserved.
- **SC-003**: All 28 critical CORE resources defined in `sw.js` load successfully with HTTP 200 from cache during offline mode with zero failed critical resources, enabling the application shell, Question Bank, and CBT mock test to function completely offline.
- **SC-004**: Zero references to outdated cache versions (specifically `ssw-pm-mock-test-shell-v25`) and zero `caches.delete()` invocations exist within `index.html`.
- **SC-005**: Service Worker registration, installation, activation, and client claiming complete with zero uncaught JavaScript exceptions or console errors across desktop and mobile viewports.

## Assumptions

- The current active shell version is `v27` (with corresponding shell asset query string `?v=ssw27`), matching the current state of [sw.js](file:///c:/Users/Admin/Documents/GitHub/MOCK-TEST-SSW-PM-BY-FAIZ/sw.js) and [index.html](file:///c:/Users/Admin/Documents/GitHub/MOCK-TEST-SSW-PM-BY-FAIZ/index.html).
- The primary service worker cache deletion logic in `sw.js`'s `activate` event (`key.startsWith('ssw-pm-mock-test-shell-') && key !== CACHE_NAME`) is structurally sound, dynamic, and represents the authoritative deletion behavior.
- The inline script in `index.html` is completely removed to eliminate dual authority and prevent accidental deletion of active or unproven caches.
- The fix requires minimal, surgical changes to `index.html` (removing the unsafe inline script) and `app.js` (synchronizing registration URL to `?v=ssw27`), with `sw.js` remaining read-only, and requires zero modifications to IndexedDB, question JSON bundles, or CBT exam logic (Constitution Tier 3 compliance).
