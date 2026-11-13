# Implementation Plan: Practice Review Retry, Keyboard Enhancements & Android Fullscreen Fix

**Branch**: `010-practice-review-retry-shortcuts-fullscreen` | **Date**: 2026-11-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/010-practice-review-retry-shortcuts-fullscreen/spec.md`

---

## Summary

Feature 010 introduces high-value learning ergonomics and mobile bug resolutions to the SSW PM CBT simulator without altering question bank contents, scoring logic, or existing Feature 008/009 capabilities:
1. **Targeted Review Practice (US1)**: Launch an untimed practice CBT session containing solely questions answered incorrectly in a completed attempt, featuring persistent top breadcrumb navigation back to parent results and origin question numbering badges (`Asal: Soal #N`).
2. **Keyboard Question Page Scrolling (US2)**: Dedicated `ArrowUp` and `ArrowDown` shortcuts to scroll `.exam-workspace` vertically by 80px without changing question index or interfering with text inputs.
3. **Ergonomic Action Shortcuts (US3)**: Single-letter shortcuts `T` (two-way toggle for Study List) and `U` (Eye Reveal toggle in Practice mode).
4. **Android Native Fullscreen Repair (US4)**: Fixes the defect where Android Chrome and Samsung Internet bypassed native `requestFullscreen()` due to an overly aggressive mobile user-agent fallback guard, while preserving CSS Fill Screen as a graceful fallback for iOS and unsupported environments.
5. **Direct Single-Letter Translation and Kotoba Shortcuts (US5)**: 8 dedicated single-key shortcuts (`G`, `A`, `S`, `D` for Indonesian translations; `V`, `Z`, `X`, `C` for Kotoba vocabulary breakdowns) operating on question stems and options 1–3 without modifier keys, respecting option shuffling and safely ignored in Full Mock mode.

---

## Technical Context

**Language/Version**: Modern Vanilla JavaScript (ES2022+ Native ES Modules), HTML5, CSS3  
**Primary Dependencies**: Zero external npm runtime packages, zero CDNs (strictly Native Web APIs: DOM, IndexedDB, HTML5 Fullscreen API, Service Worker)  
**Storage**: Client-Side IndexedDB (`ssw-pm-mock-test-db`, version 2) stores: `sessions`, `questions`, `studyList`, `meta`; `localStorage` for UI preferences and `ssw_exam_shortcuts_v2`  
**Testing**: Standalone Node.js test runners (`node tests/...`) + Headless Chromium via Chrome DevTools Protocol (CDP) automation (`--headless=new`, `--remote-debugging-pipe`)  
**Target Platform**: Modern Desktop Browsers (Chrome, Edge, Firefox, Safari) and Mobile Browsers (Android Chrome, Samsung Internet, iOS Safari)  
**Project Type**: Client-Side Single-Page Application (SPA) / Progressive Web Application (PWA)  
**Performance Goals**: <200 ms retry session initialization, <50 ms keystroke handler response time, 60 fps smooth scroll response  
**Constraints**: Zero external dependencies, offline-capable, strict preservation of finished exam immutability, WCAG AA contrast (Zen White Digital Library), full multi-viewport parity (1440px desktop, 390px mobile)  
**Scale/Scope**: 5 user stories (US1–US5), touching CBT exam state machine, review tab action, shortcut registry schema v2, Android fullscreen handler, and selective translation/kotoba controls.

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle / Gate | Status | Evaluation & Architectural Enforcement |
|---|:---:|---|
| **I. Preserve Existing Functionality** | **PASS** | Zone A (CBT Exam) is protected from unsolicited redesigns; additions are strictly additive (new retry practice mode variant, new shortcut keys, fullscreen bug fix). Existing timer, question map, flags, scoring, and font controls remain 100% operational. |
| **II. Data Integrity & Schema Preservation** | **PASS** | Parent completed exam session records in IndexedDB `sessions` are completely immutable. Cloned retry questions retain all universal mandatory fields and provenance. Deterministic question IDs (`setId::id`) are strictly preserved. |
| **III. Minimal Changes & Scoped Impact** | **PASS** | Modifications are surgical and confined to `app.js` (action handlers, shortcuts, fullscreen check) and `QUESTION-EDITOR-UPDATES.css` (breadcrumb, origin badge). No unrelated files or question banks are altered. |
| **IV. UI Consistency & Zen White Design System** | **PASS** | Adheres to Anti-Slop Dials: Energy 1/3 (calm, distraction-free), Rhythm 1/3 (hairline 1px dividers, `--zen-line: #dfdfd9`), Motion 1/3 (instant feedback). WCAG AA contrast baseline (`>= 4.5:1`) maintained on all text surfaces. |
| **V. Mobile Responsiveness & Multi-Viewport Parity** | **PASS** | Fixes Android Fullscreen API defect, collapses browser chrome cleanly, provides iOS fallback, and maintains responsive layout across 1440px desktop and 390px mobile viewports. |
| **VI. Performance & Zero-Dependency PWA** | **PASS** | Zero runtime npm packages or external CDNs. Cache versions and Service Worker synchronization maintained if assets are updated. |
| **VII. Testing & Empirical Verification** | **PASS** | All 5 stories are verified via automated Node.js CDP test suites (`test-feature-010-*.mjs`) running against real Headless Chromium instances with zero mock hallucination. |
| **VIII. Architectural Documentation** | **PASS** | Architectural decisions documented in `research.md`, data structures defined in `data-model.md`, interface contracts codified in `/contracts/`, and run guide in `quickstart.md`. |
| **Tiered Quality Gate: Tier 4** | **PASS** | Domain spans CBT Engine, Session State Machine, and UI Controls. Quality Gates 1, 2, 3, and 4 are enforced. |

---

## Project Structure

### Documentation (this feature)

```text
specs/010-practice-review-retry-shortcuts-fullscreen/
├── spec.md              # Feature specification with clarifications
├── plan.md              # This implementation plan
├── research.md          # Phase 0: Technical research & decision records
├── data-model.md        # Phase 1: Entity definitions & state machines
├── contracts/           # Phase 1: Interface & behavior contracts
│   ├── retry-session-contract.md
│   ├── keyboard-shortcuts-schema-v2.md
│   └── android-fullscreen-contract.md
├── quickstart.md        # Phase 1: Verification run guide
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code Impact Areas

```text
c:\Users\Admin\Documents\GitHub\MOCK-TEST-SSW-PM-BY-FAIZ\
├── app.js                          # Core state machine, retry session creation,
│                                   # shortcut registry v2, Android fullscreen fix
├── QUESTION-EDITOR-UPDATES.css     # CSS rules for .exam-retry-breadcrumb,
│                                   # .exam-question-origin-badge, fullscreen styles
├── tests/
│   ├── test-feature-010-retry-incorrect.mjs     # US1 verification suite
│   ├── test-feature-010-keyboard-shortcuts.mjs   # US2, US3, US5 verification suite
│   └── test-feature-010-android-fullscreen.mjs   # US4 verification suite
```

**Structure Decision**: Single-project vanilla PWA. Modifications are strictly targeted to client logic in `app.js` and styling in `QUESTION-EDITOR-UPDATES.css`, validated via Node/CDP automation scripts in `tests/`.

---

## Complexity Tracking

> **No Constitution violations detected. All additions strictly follow existing architectural patterns.**

| Design Choice | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| Deep-cloning questions into an independent retry session | Guarantees parent session immutability and isolated practice scoring | In-place reset would destroy official exam records and violates Constitution Principle II. |
| Top breadcrumb bar throughout retry CBT and results | Allows immediate round-trip navigation back to parent exam results | Footer-only button is hidden below long review lists and inaccessible during active CBT. |
| Feature detection for Android Fullscreen | Enables true fullscreen on Android Chrome/Samsung Internet while guarding iOS | Blind user-agent blocking was the exact bug causing Android fullscreen failure. |
