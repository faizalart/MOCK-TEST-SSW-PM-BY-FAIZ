# Tasks: Fix PWA Cache Cleanup Inconsistency (Refined)

**Input**: Design documents from `specs/001-fix-pwa-cache-cleanup/` (`spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/cache-governance.md`, `quickstart.md`)<br>
**Prerequisites**: `plan.md` (refined), `spec.md` (refined), `constitution.md` (v1.1.0)<br>
**Tests**: Automated dynamic consistency check (`tests/verify-cache-governance.js`) and Headless browser scenarios (`tests/test-cache-cleanup-scenarios.js`)<br>
**Organization**: Tasks are grouped strictly by user story to enable independent implementation and testing of each story.

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Maps to user stories from `spec.md` (`US1`, `US2`, `US3`)
- All task descriptions include exact file paths.

---

## Phase 1: Setup & Environment Preparation

**Purpose**: Prepare verification scripts and test harnesses without modifying application code.

- [x] T001 [P] Create automated dynamic consistency assertion script in `tests/verify-cache-governance.js` per `quickstart.md`
- [x] T002 [P] Create headless browser test harness script in `tests/test-cache-cleanup-scenarios.js` covering cold install, warm reload, offline reload, legacy upgrade, and foreign cache preservation

---

## Phase 2: Foundational Prerequisites

**Purpose**: Establish baseline state and verify existing read-only components.

- [x] T003 Verify `sw.js` `activate` event handler is read-only and strictly prefix-gated to `key.startsWith('ssw-pm-mock-test-shell-') && key !== CACHE_NAME` in `sw.js`
- [x] T004 Run baseline consistency check using `tests/verify-cache-governance.js` to capture initial failure points

**Checkpoint**: Foundation verified — User story implementation can now begin.

---

## Phase 3: User Story 1 - Preserving Active Application Shell Cache During Client Cleanup (Priority: P1) 🌟 MVP

**Goal**: Ensure the active application shell cache (`ssw-pm-mock-test-shell-v27`) is never deleted or truncated by client-side document scripts, ensuring complete offline availability.

**Independent Test**:
Load application once, trigger warm reload, disconnect network, and verify that 100% of the 28 critical CORE shell resource entries are served with HTTP 200 from cache with zero failed critical resources.

### Implementation for User Story 1

- [x] T005 [US1] Remove unsafe inline cache deletion script (lines 31–50) in `index.html` to eliminate active cache deletion (`key !== 'ssw-pm-mock-test-shell-v25'`)
- [x] T006 [US1] Verify in `index.html` that no other `<script>` tag invokes `caches.delete()` or references `ssw-pm-mock-test-shell-`
- [x] T007 [US1] Execute Scenario 3 (Warm Reload) and Scenario 4 (Offline Reload) from `quickstart.md` using `tests/test-cache-cleanup-scenarios.js` to verify all 28 CORE entries load with zero failed critical resources

**Checkpoint**: User Story 1 is complete. Active cache `v27` is preserved across reloads and offline launches.

---

## Phase 4: User Story 3 - Eliminating Hardcoded Version Drift Across Entry Points (Priority: P2)

**Goal**: Harmonize multi-file version references between `sw.js`, `index.html`, and `app.js` so that Service Worker registration URL query reflects the active shell version (`?v=ssw27`), executed BEFORE cache rotation testing.

**Independent Test**:
Run `tests/verify-cache-governance.js` and assert that active version dynamically extracted from `sw.js` (`v27`) matches `app.js:5707` (`./sw.js?v=ssw27`) and shell asset query strings in `index.html` (`?v=ssw27`).

### Implementation for User Story 3

- [x] T008 [US3] Update Service Worker registration URL query parameter from `./sw.js?v=ssw26` to `./sw.js?v=ssw27` in `app.js` (line 5707)
- [x] T009 [US3] Run dynamic consistency validation via `node tests/verify-cache-governance.js` to verify all 4 invariant checks pass with zero errors

**Checkpoint**: User Story 3 is complete. Codebase is fully synchronized to active shell version `v27`.

---

## Phase 5: User Story 2 - Automated Purging of Obsolete and Stale Cache Versions (Priority: P3)

**Goal**: Ensure that legacy application caches (`v25`, `v26`) are evicted cleanly by the Service Worker `activate` authority, while unproven same-origin caches (`jft-practice*`, `unrelated-project-cache-v1`) are 100% preserved.

**Independent Test**:
Seed artificial caches (`v25`, `v26`, `jft-practice-core`, `unrelated-project-cache-v1`) into Cache Storage, trigger Service Worker activation on the synchronized shell, and assert that only proven obsolete application buckets (`v25`, `v26`) are deleted while `v27`, `jft-practice-core`, and `unrelated-project-cache-v1` remain completely intact.

### Implementation for User Story 2

- [x] T010 [US2] Execute Scenario 5 (Upgrade From Legacy Cache) from `quickstart.md` via `tests/test-cache-cleanup-scenarios.js` to verify obsolete `v25` and `v26` eviction
- [x] T011 [US2] Execute Scenario 6 (Preservation of Unrelated Same-Origin Caches) from `quickstart.md` via `tests/test-cache-cleanup-scenarios.js` to verify foreign and `jft-practice` cache retention

**Checkpoint**: User Story 2 is complete. Obsolete application caches are purged safely without cross-origin collateral damage.

---

## Phase 6: Polish & Quality Gate Verification

**Purpose**: Execute full regression audits, Tier 3 Quality Gate checks, and retain test assets permanently.

- [x] T012 Run full headless browser suite (`tests/test-cache-cleanup-scenarios.js`) across desktop (1440px) and mobile (390px) viewports
- [x] T013 Verify Constitution v1.1.0 Tier 3 Quality Gates: Gate 1 (Zero-dependency & Scope), Gate 3 (Multi-Viewport Parity), Gate 4 (SW & Cache Sync)
- [x] T014 Retain test scripts `tests/verify-cache-governance.js` and `tests/test-cache-cleanup-scenarios.js` permanently in `tests/` for continuous reproducible regression testing

---

## Dependencies & Execution Order

### Phase Dependencies
- **Phase 1 (Setup)**: Can start immediately.
- **Phase 2 (Foundational)**: Depends on Phase 1 completion. Blocks all user stories.
- **Phase 3 (User Story 1 - P1)**: Depends on Phase 2. Delivers MVP (removes active cache deletion bug in `index.html`).
- **Phase 4 (User Story 3 - P2)**: Depends on Phase 3. Synchronizes `app.js:5707` to `?v=ssw27` BEFORE rotation testing.
- **Phase 5 (User Story 2 - P3)**: Depends on Phase 4. Executes cache eviction and foreign cache preservation tests on the fully synchronized build.
- **Phase 6 (Polish & Verification)**: Depends on all user stories completion.

### Parallel Opportunities
- T001 and T002 in Phase 1 can be developed in parallel (separate test files).
- T008 in Phase 4 is in a separate file (`app.js`) and can proceed independently.
- T010 and T011 in Phase 5 run automated test scenarios sequentially against the headless harness.

---

## Implementation Strategy: MVP First

1. **Step 1 (MVP)**: Implement Phase 1, Phase 2, and Phase 3 (T001–T007).
   - This removes the breaking bug in `index.html` that destroyed the active `v27` cache.
   - Restores offline reliability immediately.
2. **Step 2**: Implement Phase 4 (T008–T009) to synchronize `app.js:5707` to `?v=ssw27` and pass consistency invariants.
3. **Step 3**: Implement Phase 5 (T010–T011) to confirm obsolete eviction (`v25`/`v26`) and foreign cache preservation (`jft-practice*`, `unrelated-project-cache-v1`).
4. **Step 4**: Complete Tier 3 Quality Gate verification and retain permanent regression test scripts (T012–T014).
