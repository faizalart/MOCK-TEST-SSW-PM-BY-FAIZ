# Feature Specification: Bank Soal Lazy Loading & Pagination (002-bank-soal-lazy-pagination)

**Feature Branch**: `002-bank-soal-lazy-pagination`  
**Created**: 2026-11-09  
**Status**: Ready for Planning / Implementation  
**Constitution Authority**: Constitution v1.1.0 (Principles I, II, III, IV, V, VI, VII, VIII)

---

## 1. Executive Summary & Root Cause Analysis

### Problem Statement
The Bank Soal (Question Bank) tab contains 1,006 individual questions across 27 question packages. Previously, opening the Bank Soal tab executed a synchronous render of all 1,006 questions into `#view`. For each question, `renderBank()` executed `richHTML(q.prompt)` and `richHTML(o.text)` for all options (over 4,000 DOM sanitization passes), generating **54,120 DOM elements** in a single synchronous layout pass. This caused a freeze of **~5.89 seconds (5,886 ms)** simply to open the tab, and keystroke searches took **~1.39 seconds (1,393 ms)**.

### Target Outcome
1. Users opening the Bank Soal tab IMMEDIATELY see the Question Packages catalog without delay (< 15 ms).
2. The 1,006 individual questions list is **COLLAPSED by default**.
3. When the user explicitly clicks `[Tampilkan daftar soal ▾]`:
   - Data is processed on-demand.
   - Only the first page (default 50 questions) is rendered.
   - Maximum 50 `.zen-q-item` cards (~2,500 DOM elements) exist in the DOM at any time.
4. Clean pagination navigation (`Sebelumnya`, page pills `1, 2, 3... 21`, `Berikutnya`).
5. Fast search and filtering across all 1,006 questions using pre-cleaned/plain text, taking < 5 ms.
6. When the user clicks `[Sembunyikan daftar soal ▴]`, the individual list is completely detached from the DOM (not hidden via CSS), restoring the page to ~400 DOM elements.
7. CBT examination engine, IndexedDB, and PWA offline capabilities remain 100% intact and untouched.

---

## 2. User Scenarios & Acceptance Criteria

### User Story 1 - Instant Bank Soal Tab Opening & Collapsed Catalog View (Priority: P1)
**As a** candidate or teacher reviewing exam packages,  
**I want** the Bank Soal tab to open instantly and show the package catalog without waiting for 1,006 questions to process,  
**So that** I can immediately browse packages or launch exams without frustrating interface lag.

- **Acceptance Criteria**:
  1. Opening the Bank Soal tab takes < 50 ms (measured < 20 ms).
  2. Question package directory (`.zen-catalog-section` or `.zen-active-pkg-bar`) is immediately visible and interactive.
  3. Individual questions section is collapsed by default (`state.bankListExpanded = false`).
  4. Header displays "Bank Soal Individual" with badge `1.006 soal tersedia` and button `[Tampilkan daftar soal ▾]`.
  5. Zero `.zen-q-item` elements are rendered in the DOM before user interaction.
  6. Total document DOM nodes remain under 500 elements.

---

### User Story 2 - On-Demand Expansion & Paginated Rendering (Priority: P1)
**As a** candidate studying specific questions,  
**I want** to expand the question list and view questions in paginated chunks of 50,  
**So that** the page remains smooth, responsive, and easy to scroll through.

- **Acceptance Criteria**:
  1. Clicking `[Tampilkan daftar soal ▾]` expands the question list and changes the button to `[Sembunyikan daftar soal ▴]`.
  2. Only the active page (default Page 1) is rendered into the DOM.
  3. Number of rendered `.zen-q-item` cards does not exceed `pageSize` (50).
  4. Total document DOM nodes after expand remain under 3,000 elements (a >94% reduction from 54,120).
  5. Pagination bar displays: `Menampilkan soal 1–50 dari 1.006`.
  6. Page buttons allow direct jumping, next, and previous navigation.

---

### User Story 3 - Full-Dataset Search, Filter & Package Linkage (Priority: P2)
**As a** student searching for questions about specific topics (e.g. "HACCP" or "温度"),  
**I want** search and dropdown filters to evaluate all 1,006 questions,  
**So that** I can find every matching question across the entire library with instant feedback.

- **Acceptance Criteria**:
  1. Search input `#bank-search` filters across all 1,006 questions.
  2. Package filter, media filter, and status filter evaluate the full dataset.
  3. Pagination dynamically updates its count and total pages based on filtered results (e.g. 50 matching questions = 1 page; 150 = 3 pages).
  4. If filter criteria change while on a page > 1, the view safely resets to Page 1.
  5. Clicking `[Daftar Soal]` on a package row automatically expands the list and filters to that package.
  6. Search execution takes < 10 ms (compared to 1,393 ms previously).

---

### User Story 4 - Clean Collapse & DOM Element Detachment (Priority: P2)
**As a** candidate returning to package browsing,  
**I want** the `[Sembunyikan daftar soal ▴]` button to cleanly detach the question list from the DOM,  
**So that** memory is freed and the interface returns to an ultra-lightweight state without memory leaks.

- **Acceptance Criteria**:
  1. Clicking `[Sembunyikan daftar soal ▴]` completely removes `.zen-q-list`, `.zen-filter-bar`, and `.zen-pagination` from the DOM.
  2. No question card elements exist in the DOM (`document.querySelectorAll('.zen-q-item').length === 0`).
  3. Repeated expanding and collapsing does not accumulate duplicate event listeners or duplicate DOM nodes.
  4. Navigating to another tab (e.g. Beranda) and back maintains clean collapsed state without unexpected re-render.

---

### User Story 5 - CBT Examination Protection & Zero Regression (Priority: P1)
**As a** candidate taking simulated exams,  
**I want** the exam simulator and questions database to remain completely unaffected by the Bank Soal optimizations,  
**So that** timer, scoring, furigana toggle, and question navigation work with 100% reliability.

- **Acceptance Criteria**:
  1. All 1,006 questions remain in IndexedDB and in-memory cache for exams.
  2. `renderExam()`, exam state machine, and scoring are completely untouched.
  3. `tests/verify-cache-governance.js` passes with exit code 0.
  4. `tests/test-cache-cleanup-scenarios.js` passes with exit code 0.
  5. PWA offline functionality remains 100% operational.

---

## 3. Non-Functional Requirements & Performance Budgets

| Metric | Baseline (Pre-optimization) | Budget / Target |
|---|---|---|
| **Bank Soal Tab Opening Time** | 5,886.2 ms | **< 30 ms** |
| **Initial DOM Nodes Count** | 54,120 nodes | **< 500 nodes** |
| **Expanded DOM Nodes Count** | 54,120 nodes | **< 3,000 nodes** |
| **Rendered Question Cards Count** | 1,006 cards | **50 cards max** |
| **Search Filter Response Time** | 1,393.2 ms | **< 10 ms** |
| **Memory / Detached DOM Leaks** | None | **Zero leaks** |
| **PWA Cache Invariants** | Verified v27 | **Zero drift** |
