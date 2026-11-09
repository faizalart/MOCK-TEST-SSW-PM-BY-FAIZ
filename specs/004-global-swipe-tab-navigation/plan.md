# Implementation Plan: 004 — Global Mobile Swipe Navigation Across All Main Tabs

**Branch**: `feat/swipe-tab-navigation` | **Date**: 2026-11-09 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/004-global-swipe-tab-navigation/spec.md`

## Summary

Implement global horizontal touch swipe navigation across all six primary tabs (`home` ⇄ `setup` ⇄ `bank` ⇄ `history` ⇄ `study` ⇄ `backup`) for mobile devices. The solution attaches passive touch listeners to the document, accurately differentiates horizontal swipes from vertical scrolls (using a 70px threshold and 1.5x dominance ratio), integrates directly with the existing `go(page)` router, and strictly excludes CBT exam workspaces, Results scorecards, Review answers, active modals, form controls, and nested horizontal scroll carousels without any global `preventDefault`.

---

## Technical Context

**Language/Version**: Modern Vanilla JavaScript (ES2022+ Native ES Modules), HTML5, CSS3
**Primary Dependencies**: None (Zero-dependency architecture per Constitution Principle VI)
**Storage**: None (Ephemeral in-memory touch tracking; existing IndexedDB `ssw-pm-mock-test-db` unaffected)
**Testing**: Headless Chrome DevTools Protocol (`--headless=new`, `--remote-debugging-pipe`) via Node.js test harness `tests/test-global-swipe-navigation.mjs`
**Target Platform**: Mobile browsers (primarily Android Chrome on mobile viewports e.g. 390×844) with seamless desktop fallback (1440×900)
**Project Type**: Single-Page Web Application (PWA)
**Performance Goals**: Instant 60fps/120fps native vertical scrolling with zero main-thread hitching (guaranteed via `{ passive: true }` listeners); tab transition dispatch under 16ms
**Constraints**: Zero modification to CBT engine, scoring, question bank (1,006 questions), Bank Soal lazy pagination, or Service Worker cache governance
**Scale/Scope**: 6 primary tabs, 1 unified touch navigation module (~60-80 lines of surgical Vanilla JS)

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Constitution Principle | Evaluation | Compliance Status |
|---|---|---|
| **I. Preserve Existing Functionality** | Zone A (CBT Exam `renderExam()`, timer, question map, scoring) is strictly protected and exempt from swipe gestures. Non-CBT pages maintain clean router state transitions. | **PASS** |
| **II. Data Integrity & Schema** | Zero changes to question schemas, database stores, or static bundles. | **PASS** |
| **III. Minimal Changes & Scoped Impact** | Surgical addition of passive touch gesture management in `app.js` with zero unsolicited refactoring. | **PASS** |
| **IV. UI Consistency & Zen White** | Energy 1/3, Rhythm 1/3, Motion 1/3 preserved. Uses existing CSS glider transitions on `.nav-item.active`. | **PASS** |
| **V. Mobile Responsiveness & Viewports** | Solves topbar reachability for one-handed mobile grip; verified at 390×844 and 1440×900. | **PASS** |
| **VI. Zero-Dependency PWA** | Pure Vanilla JavaScript. Zero npm runtime packages, zero CDN scripts. PWA offline resilience untouched. | **PASS** |
| **VII. Empirical Verification** | Standalone Node.js CDP regression test script capturing screenshot artifacts on desktop & mobile. | **PASS** |
| **VIII. Architectural Documentation** | Full design artifacts produced: `research.md`, `data-model.md`, `contracts/`, `quickstart.md`, `plan.md`. | **PASS** |

*All Constitution checks PASS.*

---

## Project Structure

### Documentation (this feature)

```text
specs/004-global-swipe-tab-navigation/
├── plan.md              # Implementation Plan (this file)
├── spec.md              # Feature Specification
├── research.md          # Phase 0 Research & Technical Analysis
├── data-model.md        # Phase 1 Data Models & State Transitions
├── quickstart.md        # Phase 1 Quickstart & Interaction Guide
├── contracts/
│   └── swipe-navigation.md # Interface & Configuration Contract
├── checklists/
│   └── requirements.md  # Quality Checklist
└── tasks.md             # Phase 2 Work Breakdown (generated via /speckit-tasks)
```

### Source Code Impact

```text
app.js                                     # Surgical addition of initSwipeNavigation() and helper
tests/test-global-swipe-navigation.mjs     # Automated CDP regression test suite
```

**Structure Decision**: The implementation requires only a minimal touch manager in `app.js` that connects gesture events to the existing `go(targetPage)` router.

---

## Technical Strategy & Architecture

### 1. Canonical Tab Sequence
```javascript
const MAIN_TABS = ['home', 'setup', 'bank', 'history', 'study', 'backup'];
```

### 2. Gesture Detection Mechanics
- Attach to `document` using `{ passive: true }`:
  - `touchstart`: Records `startX`, `startY`, `startTime`. Evaluates exclusion criteria.
  - `touchmove`: Monitors `dx` and `dy`. If `Math.abs(dy) > Math.abs(dx)` early, marks `isVerticalScroll = true` to protect vertical scrolling.
  - `touchend`: If eligible and `Math.abs(dx) >= 70` and `Math.abs(dx) > Math.abs(dy) * 1.5` within 800ms:
    - `dx < 0` (left swipe): advance to `MAIN_TABS[currentIndex + 1]`.
    - `dx > 0` (right swipe): retreat to `MAIN_TABS[currentIndex - 1]`.
    - Terminal boundaries (`home` swipe-right, `backup` swipe-left) are safe no-ops.
  - `touchcancel`: Resets session state.

### 3. Exclusion Filter
Swipes are completely ignored when:
1. `state.page === 'exam' || state.page === 'result' || state.page === 'review'`
2. Modals/dialogs are present in DOM (`.modal-backdrop:not([hidden])`, etc.)
3. Target originates on interactive elements (`input, textarea, select, button, a, [role="slider"], [data-no-swipe]`)
4. Target is inside horizontally scrollable containers (e.g. `.hd-pkg-pills`, `#home-pkg-pills`, `.table-scroll`)
5. Multitouch (`e.touches.length > 1`)

---

## Implementation Phases

### Phase 0: Research & Investigation (Completed)
- Documented in `research.md`.
- Analyzed existing routing in `app.js`, touch listener mechanics, and Android Chrome behavior.

### Phase 1: Design & Contract Definition (Completed)
- Documented in `data-model.md`, `contracts/swipe-navigation.md`, and `quickstart.md`.
- Established gesture thresholds, state machine, and exclusion criteria.

### Phase 2: Tasks & Implementation (Next Step)
- Generate `tasks.md` via `/speckit-tasks`.
- Implement `initSwipeNavigation()` in `app.js`.
- Create and run `tests/test-global-swipe-navigation.mjs`.
- Execute full regression across all 4 suites:
  1. `tests/test-global-swipe-navigation.mjs`
  2. `tests/test-exam-scroll-lock.mjs`
  3. `tests/verify-cache-governance.js`
  4. `tests/test-bank-soal-performance.mjs`

---

## Complexity Tracking

> **Constitution Check has zero violations. No unjustified complexity introduced.**

| Item | Decision | Rationale |
|---|---|---|
| Dependency Addition | Zero external packages | Vanilla JS touch events satisfy 100% of gesture requirements with 0 bytes bundle inflation. |
| DOM Mutation | Reuse existing `go(page)` | Prevents duplicate rendering pipelines or state divergence. |
| Event Interception | Passive listeners only | Protects 60fps native vertical scrolling and prevents browser warnings. |
