# Implementation Plan: Feature 006 — Study List UX Refinement

**Branch**: `feat/006-study-list-ux-refinement` | **Date**: 2026-11-10 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/006-study-list-ux-refinement/spec.md`

---

## Summary

Refine the Bank Soal Study List user experience based on candidate feedback:
1. Replace the card-level Study List glyph and heavy container with a standalone, minimalist Lucide-style outline flag icon (Energy 1/3, Motion 1/3), free of bubbles, circular containers, speech balloons, chevrons, expanding UI, or decorative animations.
2. Upgrade individual card flag interactions from add-only to a two-way toggle (first click adds to Study List, second click removes it).
3. Introduce a bulk Plus action button inside the Bank Soal selection toolbar (`.zen-bulk-bar`) alongside Clear Selection and Delete Selected, enabling candidates to add all selected questions to the Study List in a single operation.
4. Implement safe duplicate-skipping semantics for bulk addition: existing bookmarks are safely skipped without deletion or duplication, concise feedback indicates added and skipped counts, and the sidebar badge increments accurately.
5. Guarantee complete workflow preservation (checkbox selections, search queries, package filters, pagination page, and scroll position remain undisturbed) across both desktop (1440px) and mobile (390px) viewports.

---

## Technical Context

- **Language/Version**: Modern Vanilla JavaScript (ES2022+ Native ES Modules), Modern CSS.
- **Primary Dependencies**: None (Zero external runtime npm packages or CDN scripts).
- **Storage**: Client-side IndexedDB (`ssw-pm-mock-test-db` v2, store `studyList`), complemented by memory state (`state.studyList`).
- **Testing**: Native Node.js test runner with Chrome DevTools Protocol (`--headless=new`, `--remote-debugging-pipe`).
- **Target Platform**: Progressive Web Application (PWA) running across desktop and mobile browsers (Chrome, Safari, Edge, Samsung Internet).
- **Project Type**: Offline-capable Single-Page Application (SPA).
- **Performance Goals**: Card toggle response time < 120ms; bulk addition of 5 questions < 250ms; zero layout shift.
- **Constraints**:
  - Zone A (CBT exam mode, exam timer, scoring) is strictly untouched.
  - Service Worker (`sw.js`) and cache governance are strictly untouched.
  - Global swipe navigation is strictly untouched.
  - Feature 005 artifacts remain preserved as historical merged records.

---

## Constitution Check

*GATE: All checks evaluated against `.specify/memory/constitution.md`.*

| Principle | Status | Evaluation & Mitigation |
| :--- | :--- | :--- |
| **I. Preserve Existing Functionality** | **PASS** | Existing Bank Soal tools (Edit, Duplicate, Delete, Search, Filters, Pagination, Clear Selection, Bulk Delete) remain 100% operational. CBT examination engine is completely untouched. |
| **II. Data Integrity & Schema Preservation** | **PASS** | Reuses canonical `studyList` store, `makeStudyItem(q)`, and composite key `${setId}::${q.id}`. No database migrations or schema alterations. |
| **III. Minimal Changes & Scoped Impact** | **PASS** | Code modifications are surgical and confined strictly to Bank Soal rendering (`renderBank`) and event handlers (`handleAction`) in `app.js` and styling rules in `ZEN-PAGES.css`. |
| **IV. UI Consistency & Zen White Design System** | **PASS** | Complies with Zen White rules: Energy 1/3, Rhythm 1/3, Motion 1/3. Standalone outline flag SVG without circular containers, speech bubbles, or gratuitous bounce animations. Restrained accent color (`#0f766e`). |
| **V. Mobile Responsiveness** | **PASS** | Responsive wrapping on `.zen-bulk-bar` and accessible hit targets on `.zen-study-btn` verified for mobile (390×844) and desktop (1440×900) without horizontal overflow. |
| **VI. Performance & Zero-Dependency PWA** | **PASS** | Pure native web technologies (HTML5, Modern CSS, Vanilla JS). Zero npm dependencies. |
| **VII. Testing & Empirical Verification** | **PASS** | Verified via dedicated automated CDP regression test suite (`tests/test-study-list-ux-refinement.mjs`) covering 12 distinct verification scenarios with exit code 0. |
| **VIII. Architectural Documentation** | **PASS** | Fully documented in `spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/`, and `quickstart.md`. |

---

## Project Structure

### Documentation (this feature)
```text
specs/006-study-list-ux-refinement/
├── plan.md                                    # This plan file
├── research.md                                # Phase 0 technical research & decisions
├── data-model.md                              # Phase 1 data entities & state diagrams
├── quickstart.md                              # Phase 1 verification scenarios & test guide
├── contracts/
│   └── study-list-ux-contracts.md             # Action & interface contracts
├── checklists/
│   └── requirements.md                        # Spec quality validation checklist
└── tasks.md                                   # Phase 2 tasks (generated by /speckit-tasks)
```

### Source Code Touched (repository root)
```text
app.js                                         # renderBank (toolbar + cards), handleAction ('toggle-bank-study', 'bulk-add-study')
ZEN-PAGES.css                                  # .zen-study-btn, .zen-flag-icon, .zen-bulk-study-btn
tests/
└── test-study-list-ux-refinement.mjs          # End-to-end CDP regression test suite
```

---

## Implementation Phases & Strategy

### Phase 1: Design & Contracts (Completed)
- [x] Analyze existing Bank Soal selection toolbar (`.zen-bulk-bar`) and selection state (`state.bankSelectedIds`).
- [x] Design minimalist standalone flag icon SVG matching Lucide-style outline.
- [x] Formalize data model for `StudyListItem`, `QuestionCardStudyState`, and `BulkAddResult` in `data-model.md`.
- [x] Define contracts for individual toggle (`toggle-bank-study`) and bulk addition (`bulk-add-study`) in `contracts/`.
- [x] Formulate quickstart testing manual in `quickstart.md`.

### Phase 2: Tasks Breakdown (via `/speckit-tasks`)
- Break down the implementation into structured, dependency-ordered tasks covering UI styling, individual toggle logic, toolbar bulk addition, duplicate skipping, and CDP regression tests.

### Phase 3: Implementation (via `/speckit-implement`)
1. **CSS Styling in `ZEN-PAGES.css`**:
   - Style `.zen-study-btn` and embedded `.zen-flag-icon`: outline by default, restrained teal `#0f766e` when `.is-active`. Zero circular bubbles, background badges, or animations.
   - Style `.zen-bulk-study-btn` in `.zen-bulk-bar`: clean row button matching existing toolbar controls.
2. **Template Markup in `app.js` (`renderBank`)**:
   - Replace character text in card action button with clean SVG flag icon and dynamic accessibility attributes.
   - Insert bulk Plus button inside `.zen-bulk-bar` adjacent to Clear and Delete buttons.
3. **Action Handlers in `app.js` (`handleAction`)**:
   - Implement `case 'toggle-bank-study'` to execute two-way toggle via `toggleStudyItem(q)` with async concurrency guard.
   - Add `case 'bulk-add-study'` to process `state.bankSelectedIds`, skip duplicates, store new items, update visible DOM cards, pop concise feedback toast, and sync sidebar badge.
4. **Automated Regression Suite (`tests/test-study-list-ux-refinement.mjs`)**:
   - Develop end-to-end CDP tests asserting all 12 operational scenarios.

### Phase 4: Verification & Quality Convergence (via `/speckit-converge`)
- Run all regression test suites sequentially:
  1. `node tests/test-study-list-ux-refinement.mjs`
  2. `node tests/verify-cache-governance.js`
  3. `node tests/test-cache-cleanup-scenarios.js`
  4. `node tests/test-exam-timer-centering.mjs`
  5. `node tests/test-exam-scroll-lock.mjs`
  6. `node tests/test-global-swipe-navigation.mjs`
  7. `node tests/test-bank-soal-performance.mjs`
- Verify 100% exit code 0 across all suites.
