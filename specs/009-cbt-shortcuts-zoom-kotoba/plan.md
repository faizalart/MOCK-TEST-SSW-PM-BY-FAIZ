# Implementation Plan: CBT Keyboard Shortcuts, Fullscreen Pinch Zoom & Kotoba Redesign

**Branch**: `009-cbt-shortcuts-zoom-kotoba` (to be branched from current working state) | **Date**: 2026-11-13 | **Spec**: [`spec.md`](./spec.md)

**Input**: Feature specification from `/specs/009-cbt-shortcuts-zoom-kotoba/spec.md`

---

## Summary

Feature 009 upgrades CBT ergonomics and vocabulary learning across three independent functional pillars without altering the existing zero-dependency Vanilla JS/CSS PWA architecture:

1. **Customizable Keyboard Shortcuts (US1)**: Integrates 11 default exam shortcuts (`1`–`4`, `ArrowLeft`/`ArrowRight`, `R`, `T`, `E`, `Y`, `H`) into the existing document `keydown` handler in `app.js`, adds an accessible, conflict-checked remapping UI inside `renderExamSettingsPopover()`, and persists bindings offline in `localStorage` (`sswPmExamShortcuts`) while keeping `F` reserved for fullscreen.
2. **Mobile Fullscreen & Fill Screen Pinch-to-Zoom (US2)**: Splits expanded CBT into native Fullscreen (desktop/capable browsers) and a non-native `"Fill Screen"` fallback (`body.is-fill-screen`) for mobile browsers that block zoom in Fullscreen API or lack the API (iOS Safari, Android Chrome/Samsung Internet), coupled with `visualViewport`-aware zoom preservation in `syncExamViewportHeight()` and a multi-touch pointer guard so pinch gestures never trigger accidental taps.
3. **Practice Mode Ergonomics & Complete Kotoba Redesign (US3, US4, US5)**: Compacts horizontal spacing strictly inside `.practice-option-row` in `ZEN-APP-SHELL.css` (US3-A), adds an eye-icon Practice-only answer-key reveal toggle with a minimalist Lucide `check` icon (US4), preserves `.exam-question-map` scrollTop across Practice question navigation without altering navigation mechanics (US5), and executes package-by-package Kotoba migration across all 1,006 unique questions and 3,110 unique options (US3-B/C) with zero impact on Full Mock Test or Timed Custom Exam.

---

## Technical Context

**Language/Version**: Native ES2022+ JavaScript (ES Modules), HTML5, CSS3  
**Primary Dependencies**: None (Zero runtime dependencies; Node.js v20+ & Headless Chromium used strictly for local verification and Kotoba build/audit scripts)  
**Storage**: `localStorage` (`sswPmExamShortcuts` alongside `sswPmExamPrefs`, `sswPmLang`, `sswPmMapHidden`), IndexedDB (`ssw-pm-mock-test-db` untouched), static JSON (`data/sharedKotobaDictionary.json`, `data/kotobaMapping.json`)  
**Testing**: Targeted Node.js assertion scripts (using existing Feature 008 verification patterns) + Headless Chromium CDP (`--headless=new --remote-debugging-pipe`) + physical Android Chrome / Samsung Internet / iOS Safari pinch verification + automated full-text span coverage audit & stratified manual review (minimum 50 sentences total across all 6 packages, >= 5 per package)  
**Target Platform**: Static Web / PWA hosted on GitHub Pages (Desktop Chrome/Edge/Firefox, Android Chrome, Samsung Internet, iOS Safari)  
**Project Type**: Offline-first Single-Page Application (PWA)  
**Performance Goals**: Instant (`<16ms`) keydown dispatch; zero duplicate listeners; runtime Kotoba dictionary kept compact (`< 3 MB` target by separating audit/occurrence ledgers from runtime payload) for reliable offline SW precaching  
**Constraints**: Zero external npm runtime dependencies; zero changes to canonical question bank JSONs; zero visual regression on Full Mock Test and Timed Custom Exam; Feature 008 data retained per package until replacement passes 100% validation  
**Scale/Scope**: 11 shortcut actions; 4+ browser zoom profiles; 1,006 net unique questions and 3,110 net unique options across 6 canonical source bundles

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

Governing Constitution: `.specify/memory/constitution.md` v1.1.0.  
Applicable Enforcement Tier: **Tier 4** (modifies Zone A CBT engine: `renderExam()`, exam settings popover, viewport sync, `keydown` handling) + **Tier 2** (updates `data/sharedKotobaDictionary.json` and `data/kotobaMapping.json`).

| Gate / Principle | Status | Verification & Compliance Plan |
|---|---|---|
| **Principle I: Preserve Existing Functionality** | PASS | `renderExam()`, timer, scoring, `F` fullscreen, `Enter`/`Space` radio selection, Study List, Flag, Furigana, Globe, Number List, shuffle, and Feature 008 scroll-to-row remain intact. All additions are additive or strictly scoped. |
| **Principle II: Data Integrity & Schema Preservation** | PASS | Original question bundles (`ssw-pm-*.json`) and IndexedDB stores are untouched. `sharedKotobaDictionary.json` / `kotobaMapping.json` preserve backward-compatible `terms`, `questions`, `options`, `byCompositeKey` keys. |
| **Principle III: Minimal Changes & Scoped Impact** | PASS | Layout compactness is strictly scoped to `.practice-option-row` / `.practice-prompt-row`. Single `keydown` listener extended in place. |
| **Principle IV: UI Consistency & Zen White Design System** | PASS | Settings popover shortcut UI follows existing `.exam-setting-row` Zen White styling, WCAG AA contrast (`>= 4.5:1`), and zero decorative bloat. |
| **Principle V: Mobile Responsiveness & Multi-Viewport Parity** | PASS | Tested at `360px`, `390px`, and `1440px` with `>= 44×44px` touch targets and `0px` horizontal overflow; Fill Screen mode restores mobile pinch zoom. |
| **Principle VI: Performance & Zero-Dependency PWA** | PASS | Zero runtime dependencies. Audit/occurrence ledgers stay outside `sw.js` precache; `sw.js` `CACHE_NAME` bumped cleanly on release. |
| **Principle VII: Testing & Empirical Verification** | PASS | Targeted Node assertions, CDP multi-viewport & touch/keyboard tests, physical device verification (Android Chrome, Samsung Internet, iOS Safari), automated full-bank span coverage audit, and stratified manual review (minimum 50 sentences total across all 6 packages, >= 5 per package). |
| **Gate 1–4 Matrix (Tier 4)** | PASS | Gate 1 (Zero-Dep), Gate 2 (Kotoba & Schema), Gate 3 (Desktop/Mobile CDP Parity), Gate 4 (SW Cache Sync) all covered before completion. |

---

## Project Structure

### Documentation (this feature)

```text
specs/009-cbt-shortcuts-zoom-kotoba/
├── spec.md                              # Clarified feature specification
├── plan.md                              # This file (/speckit-plan output)
├── research.md                          # Phase 0 codebase audit & architectural decisions
├── data-model.md                        # Phase 1 schemas (Shortcut Profile, Fill Screen, Kotoba v2)
├── quickstart.md                        # Phase 1 targeted validation scenarios
├── checklists/
│   └── requirements.md                  # Spec quality checklist (100% passed)
├── contracts/
│   ├── shortcuts-and-zoom-contract.md   # US1, US2, US3-A behavioral & DOM contracts
│   └── kotoba-redesign-contract.md      # US3-B & US3-C curation & package rollout gates
└── audit/                               # (Created in Phase 4/5) Coverage & reconciliation ledgers
```

### Source Code (repository root — existing files touched during implementation)

```text
MOCK-TEST-SSW-PM-BY-FAIZ/
├── app.js                               # Shortcut store/dispatch, popover UI, Fill Screen, touch guard
├── QUESTION-EDITOR-UPDATES.css          # body.is-fill-screen viewport & zoom styles (Zone A)
├── ZEN-APP-SHELL.css                    # Exam settings shortcut rows + compact .practice-option-row
├── sw.js                                # CACHE_NAME bump when assets/data update
├── data/
│   ├── sharedKotobaDictionary.json      # Revised concise entries + whole compounds/particles/inflections
│   └── kotobaMapping.json               # Package-by-package validated term ID arrays + rollout metadata
└── tests/ or scratch/                   # Targeted Feature 009 verification & Kotoba audit scripts
```

**Structure Decision**: Single-project Vanilla PWA structure matching the existing repository root. No new runtime directories or frameworks are introduced; offline-excluded Kotoba audit ledgers live inside `specs/009-cbt-shortcuts-zoom-kotoba/audit/` so `sw.js` precache stays lean.

---

## Implementation Phases & Dependencies

Work is split into **5 independent phases** so UI/ergonomic improvements ship cleanly without being blocked by the multi-package Kotoba data migration:

```text
[Phase 1: Keyboard Shortcuts] ──────────────────────────┐
[Phase 2: Mobile Fullscreen & Fill Screen Zoom] ────────┼──▶ (Independent UI/CBT Phases)
[Phase 3: Practice Answer Layout Refinement] ───────────┘

[Phase 4: Kotoba Audit & Rollout Infrastructure] ──▶ [Phase 5: Package-by-Package Kotoba Migration]
```

### Phase 1 — Customizable Keyboard Shortcuts (US1) — *Independent*
- **Files**: `app.js`, `ZEN-APP-SHELL.css`
- **Scope**:
  - Add `DEFAULT_EXAM_SHORTCUTS` (11 bindings including `4`), `loadExamShortcuts()`, `saveExamShortcuts()`, `normalizeShortcutKey()`, `isReservedShortcutKey()`, and conflict detection.
  - Consolidate into the single existing exam `keydown` listener (`app.js:6161`) with strict priority handling:
    1. Top Priority: `Escape` (cancel active shortcut capture first without closing popover; else close settings popover/modals).
    2. Focused Answer Selection: `Enter` / `Space` on `.answer-choice[data-action="answer"]` preserved; cannot be overridden.
    3. Input / Target Guard: Ignore immediately if focus is in `input`, `textarea`, `select`, or `[contenteditable="true"]`.
    4. Remapping / Capture Isolation: When `state.shortcutCaptureAction != null`, intercept keystroke with `e.preventDefault()` & `e.stopPropagation()`, update binding, and strictly prevent any keystroke from triggering background exam actions (e.g. typing `1` to remap an action never selects option 1 in the exam).
    5. Modifiers / IME: Ignore `e.isComposing`, `e.repeat`, and combos with `Ctrl`/`Meta`/`Alt`.
    6. Reserved Fullscreen Key: `F` / `f` calls `toggleFullScreen()`; cannot be remapped.
    7. Custom Shortcut Dispatch: Map normalized key to the 11 CBT actions, checking 4-option presence (`answer4` inert on 3-option questions) and mode restriction (`toggleGlobalTranslation` active only in Untimed Practice).
  - Add Keyboard Shortcuts UI + Reset button inside `renderExamSettingsPopover()` with accessible live conflict feedback.
- **Dependencies**: None. Can be implemented and verified independently.

### Phase 2 — Mobile Fullscreen & Fill Screen Pinch-to-Zoom (US2) — *Independent*
- **Files**: `app.js`, `QUESTION-EDITOR-UPDATES.css`
- **Scope**:
  - Implement `shouldUseFillScreenFallback()` and dual-mode `toggleFullScreen()` (`body.is-fullscreen` vs `body.is-fill-screen`).
  - Fill Screen mode (`body.is-fill-screen`) expands `.exam-shell` to `100dvh` while strictly maintaining `touch-action: pan-x pan-y pinch-zoom` on `.exam-shell` and `.exam-viewport`. Never applies `touch-action: none` or custom gesture cancellers.
  - Viewport Sync: Treat `visualViewport.scale` strictly as an **observer/read-only sync detector** (not a zoom actuator). When `visualViewport.scale > 1.02`, bypass `window.scrollTo(0, 0)` and fixed-height clamping to preserve user zoom level and pan frame; restore sync and 0px window offset when `scale <= 1.02`.
  - Non-Intrusive Multi-Touch Tracking:
    - Track active pointers via `pointerdown`, `pointerup`, and `pointercancel` in `activeExamPointers = new Map()`, plus `touchstart` (`e.touches.length >= 2`).
    - **STRICT PROHIBITION**: NEVER call `e.preventDefault()` on gesture events during multi-touch sequences, as doing so cancels browser-native pinch zoom.
    - Cleanly handle `pointercancel` to prevent stuck pointers if system gestures take over.
  - Action Resolution Guard & Adaptive Cooldown:
    - When fingers are lifted from pinch (`wasMultiTouch = true`), swallow the synthetic `click`/`pointerup`.
    - Apply an adaptive short cooldown (initial baseline 150ms, tunable based on real physical device testing on Android Chrome, Samsung Internet, and iOS Safari) purely to catch delayed asynchronous mouse/click emissions from lifted pinch fingers, ensuring no valid single-finger taps are blocked after zooming.
    - Guarantee that a fresh single-pointer `pointerdown` initiated after fingers clear and cooldown expires is accepted immediately as a valid tap (`wasMultiTouch = false`), so examinees can tap answers immediately after zooming without artificial lag.
  - Cleanly exit `is-fill-screen` on exam exit or navigation.
- **Dependencies**: None (verify `F` shortcut / Escape still respect Fill Screen state if Phase 1 is active).

### Phase 3 — Practice Mode Ergonomics: Answer Layout, Answer Reveal & Stable Number List (US3-A, US4, US5) — *Independent*
- **Files**: `ZEN-APP-SHELL.css` (scoped `.practice-option-row` compactness + minimalist `.practice-answer-key-check` styling), `app.js` (`renderExam()` toolbar button + answer-key check icon + `.exam-question-map` scrollTop preservation, `handleAction()` `toggle-practice-reveal-answer`, session lifecycle reset).
- **Scope**:
  1. **Practice Answer Layout Refinement (US3-A)**:
     - Reduce excess left/right padding on `.practice-option-row .answer-choice` so option text sits compactly near the left edge while preserving `>= 44×44px` touch targets for translation & Kotoba triggers and strict separation from answer selection.
     - Confirm `Full Mock Test` and `Timed Custom Exam` (which do not render `.practice-option-row`) have zero visual change.
  2. **Reveal Correct Answer in Practice Mode (US4)**:
     - Add an ephemeral `state.practiceRevealAnswer` boolean (default `false`, reset on session start/exit, preserved across question navigation).
     - Inside `renderExam()` (`app.js:4152–4166`), when `isUntimedPractice` is true, render the eye (`eye`) toggle button (`data-action="toggle-practice-reveal-answer"`) **immediately to the right of the Globe button (`practice-trans-btn`) and immediately to the left of the `F` (furigana toggle, `.furigana-quick-button`) button**.
     - In `handleAction()`, enforce dual-layer mode guard: `case 'toggle-practice-reveal-answer': if (!isUntimedPractice) break;`, toggle `state.practiceRevealAnswer`, and re-render via `renderExam({ preserveScroll: true })`.
     - When `isUntimedPractice && state.practiceRevealAnswer && Number.isInteger(q.correctIndex) && i === q.correctIndex`, render a minimalist 16 px inline Lucide `check` SVG (`<span class="practice-answer-key-check" aria-hidden="true">...</span>`) at the right end of `.answer-choice`, vertically aligned with `.answer-text`. On compact mobile viewports (360px and 390px), ensure the icon has dedicated margin/spacing so it does **not** collide or overlap with `.practice-ctrl-kotoba` on the right strip, does not obscure `.answer-text`, and causes 0px horizontal overflow.
     - Styled in muted success green with **zero** background box/circle/badge, **zero** text label, and **zero** cross icons on wrong options.
     - Preserve strict separation from `.selected` user-choice state; never mutate `s.answers[q.id]`, completion, score, or progress; reuse existing `q.correctIndex`.
     - Guarantee **zero** answer-key HTML, classes, or toolbar buttons render in Full Mock Test or Timed Custom Exam (`isUntimedPractice === false`).
  3. **Stable Number List Scroll Position (US5 — Root-Cause Fix)**:
     - **Verified Root Cause**: `QUESTION-EDITOR-UPDATES.css:477–487` defines `.exam-question-map` as the scrollable Number List container (`overflow-y: auto`). When navigating via Next, Previous, Jump Question, or keyboard shortcuts, `moveExamTo(index)` (`app.js:4254–4261`) calls `renderExam()`, which replaces the entire `view.innerHTML = ...`, destroying the `<aside class="exam-question-map">` DOM node and resetting its `scrollTop` to `0`. (No `scrollIntoView()` or `.focus()` calls on `.question-map-item` exist; `renderExam()` already saves/restores `.exam-workspace` `scrollTop` when `preserveScroll` is passed, but omits `.exam-question-map`).
     - **Minimal Fix**: Track `lastExamMapSessionId` alongside `prevMapScrollTop = prevMap.scrollTop` (read from `$('.exam-question-map', view)` before `view.innerHTML` replacement). When `isUntimedPractice` and `s.id === lastExamMapSessionId`, restore `newMap.scrollTop = prevMapScrollTop` immediately after `view.innerHTML` is updated. When starting a new session or switching categories (`s.id !== lastExamMapSessionId`), allow `scrollTop` to initialize at `0` as today. Navigation mechanics, active highlight (`current`), manual scroll, Full Mock Test, and Timed Custom Exam remain completely untouched.
- **Dependencies**: None. Can be implemented and verified independently (verify eye button is protected by Phase 2 multi-touch guard if Phase 2 is active).

### Phase 4 — Kotoba Infrastructure: Audit, Schema & Rollout Pipeline (US3-C) — *Blocks Phase 5*
- **Files**: Node.js audit/build scripts (in `scratch/` or `tests/`), `specs/009-cbt-shortcuts-zoom-kotoba/audit/`, minor optional metadata compatibility in `app.js` if needed.
- **Scope**:
  - Build automated **Full-Text Span Coverage Auditor**:
    - Inspects entire prompt/option Japanese text $[0, string.length)$. Every single character must belong to either a verified term span, allowed structural punctuation, or an allowed numeric/unit entity.
    - Rejects partial token matching (a sentence is not covered just because some words match).
    - Flags all unclassified character spans as `UNRESOLVED_SPAN`. Mandates `count(UNRESOLVED_SPAN) === 0` for package approval.
  - Build **Dictionary Quality & Morphology Validator** enforcing:
    - Intact compound preservation (`重要管理点`, `交差汚染`) with optional constituent keyword indexing.
    - Grammatical particles (`に`, `を`, `で`, `は`, `が`, `の`, `と`, `も`, `へ`, etc.) and compound expressions (`について`, `上で`) as first-class entries with concise grammatical meanings.
    - Inflected surface forms (`選びなさい`, `沿った`) linked to base dictionary forms.
    - Standard punctuation and standalone numbers/units accounted for as structural exclusions.
    - `0` single-kanji fragments from longer words, `>= 95%` meanings `<= 40` chars (`0` over `60` chars except approved technical terms), `100%` whole-word furigana, and retention of Feature 008 EDRDG / JMdict attribution and `CC-BY-SA-4.0` license.
  - Build **Package-by-Package Merge, Validation & Consistency Tool**:
    - Validates term referential integrity and version synchronization. If ANY term ID referenced in `kotobaMapping.json` is missing in `sharedKotobaDictionary.json`, or if there is a `schemaVersion` or `dataVersion` mismatch: the tool MUST emit a clear diagnostic error naming the missing ID, sentence, or mismatched version, and MUST FAIL package validation. Missing data MUST NEVER be skipped silently.
    - Active production data for the package remains the previous known-good (Feature 008) data until the newly validated dictionary and mapping pair is deployed atomically.
    - Generates `full-coverage-ledger.json`, `reconciliation-ledger.json`, and `unresolved-spans-report.json` in `specs/009-cbt-shortcuts-zoom-kotoba/audit/` (strictly excluded from `sw.js` precache to keep runtime dictionary `< 2.5 MB`).
    - Updates `kotobaMapping.json` strictly for packages that pass 100% validation, leaving un-migrated packages on Feature 008 data.
- **Dependencies**: Must complete before Phase 5 package migrations.

### Phase 5 — Kotoba Content Migration Per Package (US3-B) — *Depends on Phase 4*
- **Files**: `data/sharedKotobaDictionary.json`, `data/kotobaMapping.json`, `sw.js` (single atomic `CACHE_NAME` bump upon final release of all 6 validated packages)
- **Scope**: Execute curation, JMdict/ruby reading verification, and concise Indonesian authoring package by package in-branch (with **no partial production deployments** during migration):
  1. `ssw-pm-kunci-ujian-1.json` (40 Q / 120 opt) — first validation batch
  2. `ssw-pm-kunci-ujian-2.json` (40 Q / 120 opt)
  3. `ssw-pm-special-lab-bundle.json` (92 Q / 368 opt — 4-option coverage)
  4. `ssw-pm-tipe2-nguyen1.json` (40 Q / 120 opt — zero source ruby; full JMdict reading verification)
  5. `ssw-pm-bonus-soal-1-to-10-bundle.json` (354 Q / 1,062 opt)
  6. `ssw-pm-all-kunci-ujian-3-to-13.json` (440 Q / 1,320 opt)
- Atomic Production Release & Service Worker Consistency Gates:
  - Existing production data remains active until all 6 packages pass 100% automated span coverage + stratified manual sample audit (`>= 50` sentences total across all 6 packages, `>= 5` per package).
  - Only after all 6 packages are validated and merged in-branch, stamp matching `_meta.schemaVersion: "2.0.0"` and `_meta.dataVersion` (e.g. `"20261113-v2"`) across `sharedKotobaDictionary.json` and `kotobaMapping.json`, and bump `CACHE_NAME` in `sw.js` (`ssw-pm-mock-test-shell-v31`) **once** as part of the single atomic final release (never bumped partially per package).
  - Active exam sessions (`state.page === 'exam'`) are protected: the old cache serves active sessions until the new worker activates cleanly on subsequent navigation.
  - Runtime resolver diagnostic: while validation strictly fails on any missing ID/mismatch, if an unexpected missing term ID or version mismatch occurs at runtime (e.g. corrupted local storage), `resolveKotobaEntries()` in `app.js` logs an explicit console error diagnostic rather than silently ignoring it, while gracefully protecting the exam UI from crashing.
- **Dependencies**: Phase 4 pipeline.

---

## Validation Strategy (Targeted & Non-Redundant)

| Phase | Verification Evidence |
|---|---|
| **Phase 1 (Shortcuts)** | Node unit checks on key normalization, reserved-key/conflict rejection, `localStorage` fallback; CDP exam test verifying 11 defaults, 3- vs 4-option `4` behavior, `Y` mode isolation, zero duplicate `keydown` listeners, and offline persistence. |
| **Phase 2 (Zoom / Fill Screen)** | CDP mobile emulation (`390×844`) verifying `body.is-fill-screen` activation, `visualViewport` scale preservation, 20 multi-touch pinch simulations with `0` accidental answer clicks, zero `preventDefault()` on gesture events, and clean subsequent tap processing; manual physical device calibration & check across Android Chrome, Samsung Internet, and iOS Safari. |
| **Phase 3 (Practice Ergonomics: Layout, Reveal & Number List)** | CDP screenshot & DOM comparison at `1440px`, `390px`, `360px` proving reduced left whitespace in Practice Mode, `>= 44×44px` targets, Feature 008 scroll-to-row preserved, pixel-identical Full Mock / Timed Custom cards; US4 CDP test verifying eye button between Globe & `F` (furigana toggle), ON/OFF toggle, Lucide `check` icon only on `q.correctIndex` with zero collision with Kotoba control at 360px and 390px, dual rendering & action handler guards, navigation persistence, and 0 leakage in Full Mock / Timed Custom; US5 CDP test scrolling `.exam-question-map` to mid/bottom and verifying `delta === 0 px` across Next, Previous, shortcuts, and jump clicks while updating `.current` highlight. |
| **Phase 4–5 (Kotoba)** | Automated full-bank span coverage report (`0` unresolved meaningful spans per released package), automated referential integrity/fragment/length/furigana/provenance validator failing on any missing ID or mismatch, synchronized `dataVersion` check, stratified manual review (minimum 50 sentences total across all 6 packages, >= 5 per package, >= 98% accuracy), and offline `sw.js` cache check. |

---

## Biggest Risks & Complexity Estimate

### Top Risks
1. **Japanese Segmentation & Meaning Accuracy at Scale (High)**: Covering particles, inflections, and compounds across 4,116 sentences (1,006 prompts + 3,110 options) risks over-splitting or losing nuance when trimming definitions. *Mitigation*: Phase 4 automated character-by-character span auditor + unresolved span reporting + package-by-package rollout + mandatory multi-package manual audit (minimum 50 sentences total across all 6 packages, >= 5 per package).
2. **Service Worker Data Synchronization & Cache Lifecycle (Medium-High)**: If a client updates mapping before dictionary (or vice versa), term IDs could fail to resolve. *Mitigation*: Synchronized `_meta.dataVersion` on both JSONs + validation hard-failure on missing term IDs or schema/version mismatch + active legacy data retained until atomic release + explicit runtime console error diagnostic in `resolveKotobaEntries()` + non-disruptive SW lifecycle for active exams.
3. **Pinch-to-Zoom Gesture Cancellation & Subsequent Tap Latency (Medium)**: Calling `preventDefault()` on multi-touch cancels native pinch, while an excessive cooldown could block valid taps right after zooming. *Mitigation*: Strictly passive pointer listeners (zero `preventDefault()` on gestures) + synthetic click discarding on pinch finger lift + tunable initial baseline 150ms cooldown calibrated via physical testing on Android Chrome, Samsung Internet, and iOS Safari + immediate acceptance of fresh single-finger taps once fingers clear.
4. **Keyboard Shortcut Collisions with CBT Engine & Remapping Leakage (Medium)**: Remapping inputs could trigger background CBT actions or break `F`/`Escape`/`Enter`. *Mitigation*: Strict keydown priority order (Escape first, Enter/Space for answer choice, input/contenteditable exception, capture isolation via `stopPropagation` + `preventDefault`, reserved `F` fullscreen).
5. **Practice-Only Isolation & Icon Placement (Low–Medium)**: In US4/US5, answer-key markup must never leak into Full Mock/Timed Custom, and the 16 px `check` icon on `.answer-choice` must not collide with `.practice-ctrl-kotoba` on the right strip. *Mitigation*: Strict `isUntimedPractice` guard in both `renderExam()` and `handleAction()`, clear CSS positioning inside `.answer-choice`, and session-ID-scoped `.exam-question-map` scroll restoration.

### Complexity Estimate
- **Phase 1 (Keyboard Shortcuts)**: **Low–Medium** (well-bounded DOM, `localStorage`, single keydown handler with strict priority).
- **Phase 2 (Mobile Pinch Zoom & Fill Screen)**: **Medium** (passive pointer lifecycle, adaptive cooldown, and non-native Fill Screen fallback across iOS/Android).
- **Phase 3 (Practice Ergonomics: Layout, Answer Reveal & Number List Scroll)**: **Low–Medium** (scoped CSS inside `.practice-option-row`, isolated `isUntimedPractice` eye toggle + Lucide `check`, and 5-line `.exam-question-map` scroll preservation in `renderExam()`).
- **Phase 4 (Kotoba Audit & Rollout Infrastructure)**: **Medium** (deterministic Japanese character-span accounting, morphology rules, and external audit ledgers).
- **Phase 5 (Package-by-Package Kotoba Migration)**: **High** (data curation volume across 1,006 questions / 3,110 options + manual sampling, mitigated by splitting into 6 independent package batches with atomic SW sync).

---

## Complexity Tracking

> No Constitution violations exist. Tier 4 and Tier 2 quality gates are satisfied within the existing Vanilla PWA architecture.
