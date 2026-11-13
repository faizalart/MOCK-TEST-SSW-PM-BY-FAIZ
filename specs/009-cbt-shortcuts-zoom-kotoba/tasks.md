---

description: "Actionable, dependency-ordered tasks for Feature 009 implementation"
---

# Tasks: CBT Keyboard Shortcuts, Fullscreen Pinch Zoom, Practice Ergonomics & Kotoba Redesign

**Input**: Design documents from `/specs/009-cbt-shortcuts-zoom-kotoba/`
**Prerequisites**: [`plan.md`](./plan.md), [`spec.md`](./spec.md), [`research.md`](./research.md), [`data-model.md`](./data-model.md), [`contracts/`](./contracts/), [`quickstart.md`](./quickstart.md)

**Organization**: Tasks are grouped by user story in priority order (`P1` -> `P2` -> `P3`) so each story can be implemented and verified independently without blocking other tracks.

## Format: `[ID] [P?] [Story?] Description with file path`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story label (`[US1]`, `[US2]`, `[US3]`, `[US4]`, `[US5]`) — omitted in Setup and Polish phases

---

## Phase 1: Setup (Shared Verification & Audit Baseline)

**Purpose**: Establish audit directory and verify clean baseline before modifying any Zone A or data files.

- [X] T001 Create `specs/009-cbt-shortcuts-zoom-kotoba/audit/` directory and run existing Feature 008 suite (`tests/test-practice-selective-kotoba.mjs`) to record clean baseline
- [X] T002 [P] Verify `index.html` viewport meta (`minimum-scale=0.5, maximum-scale=5.0, user-scalable=yes`) and confirm `sw.js` baseline `CACHE_NAME` (`ssw-pm-mock-test-shell-v30`)

---

## Phase 2: User Story 1 — Customizable Keyboard Shortcuts (Priority: P1) 🎯 MVP

**Goal**: Enable full keyboard-only CBT navigation and in-session customizable shortcut bindings stored offline in `localStorage`, without breaking `Enter`/`Space`, `F` fullscreen, `Escape`, or input/contenteditable typing.

**Independent Test**: Start any exam mode, answer/flag/Study List/navigate via keyboard only, remap a key in the gear popover mid-session (verifying conflict/reserved rejection and zero background exam leakage during capture), reload offline, and verify persistence.

### Implementation & Verification for User Story 1

- [X] T003 [P] [US1] Implement `DEFAULT_EXAM_SHORTCUTS` (11 fixed actions: `1`–`4`, `ArrowRight`, `ArrowLeft`, `R`, `T`, `E`, `Y`, `H`), `RESERVED_SHORTCUT_KEYS` (`F`, `Escape`, `Tab`, `Enter`, `Space`, `F1`–`F12`, `Shift`, `Control`, `Alt`, `Meta`, `CapsLock`, any `Ctrl`/`Meta`/`Alt` combo), `loadExamShortcuts()`, `saveExamShortcuts()`, `normalizeShortcutKey()`, and bijection conflict validation (`sswPmExamShortcuts` schema `{ version: 1, updatedAt, bindings }`) in `app.js`
- [X] T004 [US1] Consolidate custom shortcut dispatch into the single existing `document.addEventListener('keydown', ...)` handler (`line 6161`) in `app.js` with strict priority order: (1) `Escape` (cancel capture mode without closing popover, else close settings/dropdown/modals), (2) `Enter`/`Space` on focused `.answer-choice[data-action="answer"]`, (3) ignore `input, textarea, select, [contenteditable="true"]` and `isContentEditable`, (4) isolate `shortcutCaptureAction` with `e.preventDefault()` & `e.stopPropagation()` so remapping never leaks into CBT actions, (5) ignore `isComposing || keyCode === 229 || repeat || ctrlKey || metaKey || altKey`, (6) reserve `F`/`f` for `toggleFullScreen()`, (7) dispatch bound actions with `q.options[3]` check for `answer4` and `isUntimedPractice` check for `toggleGlobalTranslation` (depends on T003)
- [X] T005 [P] [US1] Style the Keyboard Shortcuts settings section, key badges (`→`, `←`), active capture state (`"Press a key..."`), accessible `role="status"` conflict banner, and `"Reset Shortcuts"` button in `ZEN-APP-SHELL.css` following Zen White `.exam-setting-row` styling and WCAG AA (`>= 4.5:1`) contrast
- [X] T006 [US1] Render the Keyboard Shortcuts UI and wire key-capture, conflict announcement, and reset handlers inside `renderExamSettingsPopover()` and `handleAction()` in `app.js` without losing popover open state or scroll position (depends on T003, T004, T005)
- [X] T007 [US1] Create and run Node + Headless Chromium CDP test `tests/test-feature-009-shortcuts.mjs` verifying Scenarios 1 & 2 from `specs/009-cbt-shortcuts-zoom-kotoba/quickstart.md` (11 defaults, 3- vs 4-option `4` behavior, `Y` mode isolation, capture isolation, reserved/conflict rejection, zero duplicate `keydown` listeners, offline `localStorage` persistence)

**Checkpoint**: User Story 1 is complete, independently verified, and deliverable as MVP.

---

## Phase 3: User Story 2 — Pinch-to-Zoom During Mobile Fullscreen CBT (Priority: P2)

**Goal**: Restore working two-finger pinch-to-zoom (`>= 2×`) and one-finger pan in expanded mobile CBT via a non-native `"Fill Screen"` fallback where browsers block zoom in native fullscreen, with passive multi-touch tracking that prevents accidental answer/toolbar clicks without cancelling browser zoom.

**Independent Test**: On CDP mobile emulation (`390×844`) and physical Android Chrome, Samsung Internet, and iOS Safari, enter expanded CBT mode, pinch to `>= 2×`, pan, tap answers immediately after zooming back to `1×`, and verify 0 accidental clicks and 0 px horizontal overflow.

### Implementation & Verification for User Story 2

- [X] T008 [P] [US2] Add `body.exam-mode.is-fill-screen` layout rules (`100dvh`, hide non-CBT app chrome, preserve `touch-action: pan-x pan-y pinch-zoom !important` on `.exam-shell` and `.exam-viewport`, zero `touch-action: none`) in `QUESTION-EDITOR-UPDATES.css`
- [X] T009 [US2] Implement `shouldUseFillScreenFallback()` and dual-mode `toggleFullScreen()` (`body.is-fullscreen` vs non-native `body.is-fill-screen` without calling `requestFullscreen()` or `lockExamLandscape()`) plus clean reset on `finishExam()` / `go()` in `app.js` (depends on T008)
- [X] T010 [US2] Update `syncExamViewportHeight()` in `app.js` so `visualViewport.scale` is used strictly as an observer (`scale > 1.02` skips `window.scrollTo(0, 0)` and height clamping; `scale <= 1.02` restores `0,0` and syncs `--exam-viewport-height`)
- [X] T011 [US2] Implement passive multi-touch pointer guard (`activeExamPointers` Map handling `pointerdown`, `pointerup`, `pointercancel` with `{ passive: true }` and **zero** `preventDefault()` on multi-touch gestures), synthetic click discarding on pinch lift, tunable cooldown (`DEFAULT_PINCH_COOLDOWN_MS = 150`), and immediate clean single-tap acceptance guarding `answer`, `toggle-selective-trans`, `toggle-selective-kotoba`, and exam toolbar buttons in `app.js`
- [ ] T012 [US2] Create and run CDP mobile test `tests/test-feature-009-zoom.mjs` verifying `is-fill-screen` activation, `visualViewport` scale preservation, 20 simulated multi-touch pinches with `0` accidental clicks, `0px` overflow at `1×`, and calibrate/verify tunable cooldown on real Android Chrome, Samsung Internet, and iOS Safari devices per `quickstart.md` Scenario 3 *(CDP automated test PASSED; real-device testing on Android Chrome, Samsung Internet, and iOS Safari PENDING)*

**Checkpoint**: User Story 2 is complete and independently verified across simulated and real mobile browsers.

---

## Phase 4: User Story 4 — Reveal Correct Answer in Practice Mode (Priority: P2)

**Goal**: Provide a minimalist Practice-only eye (`eye`) toolbar toggle placed immediately between Globe and `F` (furigana toggle) that reveals the answer key (`q.correctIndex`) with a clean ~16 px Lucide `check` icon without affecting user selection, score, or timed exam modes.

**Independent Test**: In Untimed Practice Mode, verify eye button placement between Globe and `F` (furigana), toggle ON/OFF across navigation and wrong/correct selections, verify zero collision with `.practice-ctrl-kotoba` at `360px`/`390px`, and confirm zero button/DOM/handler leakage in Full Mock Test and Timed Custom Exam.

### Implementation & Verification for User Story 4

- [X] T013 [US4] Add scoped styles for `.practice-reveal-btn` and `.practice-answer-key-check` (~16 px Lucide `check`, muted success green, zero box/circle/badge/text, vertically aligned with `.answer-text`, clear right margin preventing collision with `.practice-ctrl-kotoba` at `360px` and `390px` viewports) in `ZEN-APP-SHELL.css`
- [X] T014 [US4] Add `state.practiceRevealAnswer` (default `false`, reset on session start/exit, preserved across question navigation), render eye button (`data-action="toggle-practice-reveal-answer"`) exclusively when `isUntimedPractice` between `.practice-trans-btn` (Globe) and `.furigana-quick-button` (`F` furigana toggle), render inline 16 px Lucide `check` SVG on `i === q.correctIndex`, and enforce `if (!isUntimedPractice) break;` in `handleAction()` in `app.js` (depends on T013)
- [X] T015 [US4] Add US4 CDP verification assertions to `tests/test-feature-009-practice-ergonomics.mjs` covering `quickstart.md` Scenario 6 (eye position between Globe & `F` furigana, ON/OFF toggle, shuffled options, wrong-answer coexistence, `360px`/`390px` zero-collision check, and dual rendering/handler isolation in Full Mock Test and Timed Custom Exam)

**Checkpoint**: User Story 4 is complete and independently verified.

---

## Phase 5: User Story 5 — Stable Number List Scroll Position (Priority: P2)

**Goal**: Preserve `.exam-question-map` scroll position across Next, Previous, keyboard shortcuts, and jump-question clicks in Practice Mode while updating the `.current` active highlight and keeping new session/category initialization unchanged.

**Independent Test**: Scroll `.exam-question-map` to middle/bottom in Practice Mode, navigate via Next, Previous, shortcuts, and clicking a number in the list, and verify `delta === 0 px` while `.current` highlight updates accurately.

### Implementation & Verification for User Story 5

- [X] T016 [US5] Update `renderExam()` and exam exit lifecycle in `app.js`: capture `prevMapScrollTop` from `$('.exam-question-map', view)` before `view.innerHTML` replacement; restore `newMap.scrollTop = prevMapScrollTop` immediately after `view.innerHTML` update only when `isUntimedPractice && s.id === lastExamMapSessionId`; set `lastExamMapSessionId = s.id` after render completes; reset `lastExamMapSessionId = null` when leaving the exam page to Home or Result (`go()` to non-exam page and `finishExam()`); ensure new sessions (`s.id !== lastExamMapSessionId`) always initialize at `scrollTop = 0`, while preserving manual user scrolling, `.current` highlight, Full Mock Test, and Timed Custom Exam untouched
- [X] T017 [US5] Add US5 CDP verification assertions to `tests/test-feature-009-practice-ergonomics.mjs` covering `quickstart.md` Scenario 7 (scroll `.exam-question-map` to mid/bottom, assert `scrollTop` `delta === 0 px` across Next, Previous, shortcuts, and `jump-question` clicks, verify `.current` highlight & manual scroll)

**Checkpoint**: User Story 5 is complete and independently verified.

---

## Phase 6: User Story 3 — Practice Answer Layout & Complete Kotoba Redesign (Priority: P3)

**Goal**: Compact horizontal option padding strictly inside `.practice-option-row`, build an automated full-text span coverage auditor & quality/integrity validator, and migrate all 6 canonical bundles package by package with 100% meaningful-unit coverage and concise Indonesian meanings.

**Independent Test**: Compare Practice vs Full Mock screenshots at `360px`/`390px`/`1440px`, run span-coverage & integrity validators (`0` `UNRESOLVED_SPAN`, hard-fail on missing ID/version mismatch), and pass a stratified manual review of `>= 50` sentences total across all 6 packages (`>= 5` per package, `>= 98%` accuracy).

### Sub-Phase 6A: Practice Answer Layout Refinement (US3-A)

- [X] T018 [US3] Reduce horizontal padding strictly inside `.practice-option-row .answer-choice` in `ZEN-APP-SHELL.css` so `.answer-text` sits compactly near the left edge while keeping `>= 44×44px` hit areas for `.practice-ctrl-trans` and `.practice-ctrl-kotoba`, `0px` horizontal overflow at `360px`/`390px`/`1440px`, Feature 008 `scrollSentenceIntoView()`, and pixel-identical Full Mock / Timed Custom cards
- [X] T019 [US3] Add US3-A layout & screenshot comparison assertions at `1440px`, `390px`, and `360px` to `tests/test-feature-009-practice-ergonomics.mjs` covering `quickstart.md` Scenario 4 (depends on T018)

### Sub-Phase 6B: Kotoba Audit, Validation & Merge Infrastructure (US3-C)

- [X] T020 [P] [US3] Build automated **Full-Text Span Coverage Auditor** (`scripts/audit-kotoba-coverage.mjs`) scanning every prompt and option `[0, string.length)` per package, rejecting partial token matching, classifying structural punctuation & standalone numbers/units, flagging any unclassified character span as `UNRESOLVED_SPAN` (`count === 0` required), and writing `specs/009-cbt-shortcuts-zoom-kotoba/audit/full-coverage-ledger.json` and `unresolved-spans-report.json`
- [X] T021 [P] [US3] Build **Dictionary Quality, Morphology & Integrity Validator** (`scripts/validate-kotoba-package.mjs`) enforcing: `0` single-kanji fragments from longer words, intact compounds (`重要管理点`), first-class particles & inflected forms with `dictForm`, `>= 95%` meanings `<= 40` chars (`0` > `60` chars except approved technical terms), `100%` whole-word furigana, valid `CC-BY-SA-4.0` + EDRDG/JMdict attribution, no verbose inline `occurrences` bloat, and **hard-fail with explicit diagnostic** on any missing term ID, `schemaVersion` mismatch, or `dataVersion` mismatch
- [X] T022 [US3] Build **Package-by-Package Merge & Reconciliation Tool** (`scripts/merge-kotoba-package.mjs`) generating `specs/009-cbt-shortcuts-zoom-kotoba/audit/reconciliation-ledger.json` and atomically updating `data/kotobaMapping.json` & `data/sharedKotobaDictionary.json` only for packages passing T020+T021 (keeping un-migrated packages on Feature 008 data), and update `resolveKotobaEntries()` in `app.js` to log explicit `console.error` diagnostics on any unexpected missing term ID or version mismatch without crashing the exam UI (depends on T020, T021)

### Sub-Phase 6C: Package-by-Package Kotoba Migration (US3-B)

- [X] T023 [US3] Curate, validate via T020–T022 (`UNRESOLVED_SPAN === 0`), and merge Package 1 `ssw-pm-kunci-ujian-1.json` (40 Q / 120 opt) into `data/sharedKotobaDictionary.json` and `data/kotobaMapping.json` (depends on T022)
- [X] T024 [US3] Curate, validate via T020–T022 (`UNRESOLVED_SPAN === 0`), and merge Package 2 `ssw-pm-kunci-ujian-2.json` (40 Q / 120 opt, reconciling shared `questions.json` IDs) into `data/sharedKotobaDictionary.json` and `data/kotobaMapping.json` (depends on T023)
- [X] T025 [US3] Curate, validate via T020–T022 (`UNRESOLVED_SPAN === 0`), and merge Package 3 `ssw-pm-special-lab-bundle.json` (92 Q / 368 opt — 4-option coverage) into `data/sharedKotobaDictionary.json` and `data/kotobaMapping.json` (depends on T024)
- [X] T026 [US3] Curate, cross-verify JMdict readings (0 source `<ruby>`), validate via T020–T022 (`UNRESOLVED_SPAN === 0`), and merge Package 4 `ssw-pm-tipe2-nguyen1.json` (40 Q / 120 opt) into `data/sharedKotobaDictionary.json` and `data/kotobaMapping.json` (depends on T025)
- [X] T027 [US3] Curate, validate via T020–T022 (`UNRESOLVED_SPAN === 0`), and merge Package 5 `ssw-pm-bonus-soal-1-to-10-bundle.json` (354 Q / 1,062 opt) into `data/sharedKotobaDictionary.json` and `data/kotobaMapping.json` (depends on T026)
- [X] T028 [US3] Curate, validate via T020–T022 (`UNRESOLVED_SPAN === 0`), and merge Package 6 `ssw-pm-all-kunci-ujian-3-to-13.json` (440 Q / 1,320 opt) into `data/sharedKotobaDictionary.json` and `data/kotobaMapping.json` (depends on T027)
- [X] T029 [US3] Perform stratified manual Kotoba quality review across all 6 canonical packages (`>= 50` sentences total, minimum `5` sentences per package; `>= 98%` contextual accuracy) and record review results in `specs/009-cbt-shortcuts-zoom-kotoba/audit/manual-sample-audit.md` (depends on T028)

**Checkpoint**: All 6 canonical packages pass 100% span coverage, referential integrity, and manual sample quality gates.

---

## Phase 7: Polish, Service Worker Sync & Cross-Cutting Regression

**Purpose**: Ensure atomic PWA cache synchronization, offline reliability, and zero regressions across Feature 008 and Feature 009.

- [X] T030 After all 6 Kotoba packages (`T023`–`T029`) pass 100% validation (no partial production deployments during per-package migration), synchronize `_meta.schemaVersion: "2.0.0"` and `_meta.dataVersion` across `data/sharedKotobaDictionary.json` and `data/kotobaMapping.json`, confirm runtime dictionary stays compact (`< 2.5 MB`, audit ledgers excluded), and bump `CACHE_NAME` in `sw.js` (`ssw-pm-mock-test-shell-v31`) once as part of the single atomic final release
- [X] T031 Run Feature 008 regression suite (`tests/test-practice-selective-kotoba.mjs`) and full Feature 009 `specs/009-cbt-shortcuts-zoom-kotoba/quickstart.md` Scenarios 1–7 (including offline Service Worker reload & `360px`/`390px`/`1440px` parity) (depends on T007, T012, T015, T017, T019, T029, T030)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **US1 (Phase 2 — P1)**, **US2 (Phase 3 — P2)**, **US4 (Phase 4 — P2)**, **US5 (Phase 5 — P2)**, and **US3-A/C (Phase 6A/6B — P3)**: Functionally independent of one another, executed sequentially by phase priority (`P1` -> `P2` -> `P3`) so edits to shared files (`app.js` and `ZEN-APP-SHELL.css`) are cleanly serialized without merge conflicts.
- **US3-B (Phase 6C)**: Blocked by Sub-Phase 6B (`T020`–`T022`); packages `T023`–`T028` run sequentially so `sharedKotobaDictionary.json` and `kotobaMapping.json` merge cleanly without conflicts. Existing production data remains active until all 6 packages pass validation and release atomically in `T030`.
- **Polish (Phase 7)**: Depends on all completed user stories (`T030` before `T031`).

### Parallel Opportunities (Strictly Same-Phase, Distinct Files)

- **Phase 1**: `T001` (`audit/` setup & baseline test) and `T002` (read-only `index.html`/`sw.js` check) can run in parallel.
- **Phase 2 (US1)**: `T003` (`app.js` shortcut store) and `T005` (`ZEN-APP-SHELL.css` shortcut UI) touch different files and can run in parallel before `T004` / `T006`.
- **Phase 3 (US2)**: `T008` (`QUESTION-EDITOR-UPDATES.css` Fill Screen) can run in parallel with `T010` (`app.js` viewport sync) since they touch different files.
- **Phase 6B (US3-C)**: `T020` (`scripts/audit-kotoba-coverage.mjs`) and `T021` (`scripts/validate-kotoba-package.mjs`) touch separate script files and can run in parallel before `T022`.
- *(Tasks touching `app.js` or `ZEN-APP-SHELL.css` across different phases — e.g., `T005`, `T013`, `T018` — are NOT run in parallel when following phase order.)*

### Implementation Strategy

1. **MVP First**: Complete Phase 1 + Phase 2 (`US1`: Keyboard Shortcuts) and validate via `T007`.
2. **Ergonomic P2 Pack**: Deliver `US2` (Pinch Zoom / Fill Screen), `US4` (Practice Answer Reveal), and `US5` (Stable Number List Scroll) as independent, fast-to-verify increments.
3. **Kotoba Redesign (P3)**: Build `T020`–`T022` audit/validation pipeline first, then roll out Packages 1–6 (`T023`–`T028`) with zero silent skips and manual 50-sentence total (`>= 5`/pkg) audit (`T029`), finishing with `sw.js` cache bump (`T030`) and full regression (`T031`).
