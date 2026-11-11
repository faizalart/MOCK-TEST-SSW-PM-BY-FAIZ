# Implementation Plan: Practice Mode Inline Indonesian Translations

**Branch**: `feat/practice-mode-inline-translations` | **Date**: 2026-11-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/007-practice-mode-translations/spec.md`

---

## Summary

Feature 007 adds an inline Indonesian translation toggle to the active untimed CBT Practice Mode. A minimalist 16 × 16 px wireframe globe SVG toggle button with a 44 × 44 px touch target is placed inside `.exam-bottom-tools` immediately beside the existing Study List plus button (`.study-list-quick-button`). When activated, it reveals verified Indonesian translations directly beneath the Japanese question prompt and under each individual answer choice (using a phrasing element with `display: block` inside `.answer-content`). The state persists during intra-session question navigation and cleanly resets on session exit or start. In accordance with realistic testing conditions, the toggle is strictly omitted from Full Mock Test and timed exam sessions. All translations are sourced from existing local question data (`q.promptTranslation` and `o.translation`), requiring zero new runtime dependencies, network calls, or translation generation.

---

## Technical Context

**Language/Version**: Modern Vanilla JavaScript (ES2022+ Native ES Modules), HTML5, CSS3  
**Primary Dependencies**: None (Zero-dependency architecture)  
**Storage**: IndexedDB (`ssw-pm-mock-test-db`, version 2) for question bundles; in-memory application state (`state.practiceTranslationOpen`) for active session UI state  
**Testing**: Standalone Node.js regression suites and Headless Chromium via Chrome DevTools Protocol (`--headless=new`, `--remote-debugging-pipe`)  
**Target Platform**: Desktop (Chrome, Edge, Safari, Firefox) and Mobile Browsers (iOS Safari, Android Chrome, PWA standalone)  
**Project Type**: Single-Page Application (SPA) / Offline-First PWA  
**Performance Goals**: State toggling and DOM re-render < 50ms; zero impact on question transition latency  
**Constraints**: Zero runtime translation APIs; 100% offline functionality; 0% answer-key/explanation leakage; touch targets >= 44 × 44 px; WCAG AA contrast baseline (>= 4.5:1)  
**Scale/Scope**: 1,006 questions across 27 practice-supported packages, 3,110 options, CBT exam surface only  

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked post-design.*

| Principle / Gate | Assessment | Status |
|---|---|---|
| **I. Preserve Existing Functionality** | Zone A CBT examination interface remains fully operational. The globe button is purely additive inside `.exam-bottom-tools`. Timer, scoring, answer radio mechanics, and Furigana controls are untouched. | **PASS** |
| **II. Data Integrity & Schema Preservation** | Reuses existing universal fields (`q.promptTranslation` and `o.translation`). Zero schema migrations, zero question modifications, zero mutation of question IDs, and deterministic shuffle handling. | **PASS** |
| **III. Minimal Changes & Scoped Impact** | Changes strictly confined to `renderExam()`, state reset hooks in `app.js`, and targeted styling in `ZEN-APP-SHELL.css`. | **PASS** |
| **IV. UI Consistency & Zen White Design** | Adheres to Anti-Slop dials (Energy 1/3, Rhythm 1/3, Motion 1/3). Minimalist wireframe SVG, transparent backgrounds, no cards/bubbles/shadows. Contrast meets WCAG AA (`#5a6672` on white >= 4.5:1). | **PASS** |
| **V. Mobile Responsiveness & Multi-Viewport Parity** | 44 × 44 px touch target ergonomics. Validated on 390 × 844 and 360 × 740 without button collision or horizontal scroll. | **PASS** |
| **VI. Performance & Zero-Dependency PWA** | Zero external dependencies, zero network requests, 100% offline resilience via Service Worker. | **PASS** |
| **VII. Testing & Empirical Verification** | End-to-end verification via automated headless Chromium CDP test suite covering all 9 acceptance scenarios. | **PASS** |
| **Tier 4 Quality Gate Matrix** | Changes touch CBT rendering (`renderExam()`) and application state machine. Activates Gates 1, 2, 3, and 4. All design criteria satisfy Tier 4 gates. | **PASS** |

---

## Project Structure

### Documentation (this feature)

```text
specs/007-practice-mode-translations/
├── spec.md              # Feature specification
├── plan.md              # Implementation plan (this file)
├── research.md          # Phase 0 research findings & design decisions
├── data-model.md        # Phase 1 data schema, entities, and state machine
├── quickstart.md        # Phase 1 verification and testing guide
├── contracts/
│   └── practice-translation-contract.md # UI & DOM integration contracts
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (/speckit-tasks command - next step)
```

### Source Code (repository root)

```text
.
├── app.js               # CBT engine, renderExam(), state machine, event delegation
├── ZEN-APP-SHELL.css    # Styling for .practice-trans-btn, .practice-question-translation, .practice-option-translation
└── tests/
    └── test-practice-mode-translations.mjs # Dedicated E2E automated regression suite
```

**Structure Decision**: Single SPA project structure with established Vanilla JS ES module layout. No build pipeline, bundler, or external test runners required.

---

## Complexity Tracking

> **Constitution Violations**: **NONE**  
> All design decisions strictly adhere to the project constitution, existing code boundaries, and user constraints.
