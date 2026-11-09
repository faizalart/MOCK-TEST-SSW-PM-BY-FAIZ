# Tasks: Bank Soal Lazy Loading & Pagination (002-bank-soal-lazy-pagination)

**Feature Branch**: `002-bank-soal-lazy-pagination`  
**Created**: 2026-11-09  
**Status**: Implementation & Verification Complete  

---

## Task Matrix & Dependency Order

| Task ID | Phase | Description | Target File(s) | Status |
|---|---|---|---|---|
| **T001** | Planning & Baseline | Document pre-optimization benchmark metrics and DOM element counts. | `specs/002-bank-soal-lazy-pagination/research.md` | [X] Completed |
| **T002** | Core State & Logic | Add `bankListExpanded`, `bankPage`, `bankPageSize` to `state` in `app.js`. | `app.js` | [X] Completed |
| **T003** | Core Optimization | Implement lightweight `getBankQuestionSearchText(q)` in `app.js` to replace heavy `richPlainText` during search filtering. | `app.js` | [X] Completed |
| **T004** | Collapsed View | Implement collapsed state in `renderBank()` showing "Bank Soal Individual", actual count badge, and `[Tampilkan daftar soal ▾]` button without rendering questions. | `app.js` | [X] Completed |
| **T005** | Pagination & Slice | Implement paginated rendering in `renderBank()` (50 items per page), rendering only active slice when expanded. | `app.js` | [X] Completed |
| **T006** | Pagination Controls | Add pagination UI (count summary, `[Sebelumnya]`, dynamic page numbers, `[Berikutnya]`) with active page states. | `app.js` | [X] Completed |
| **T007** | Event Dispatchers | Add event handlers for `toggle-bank-list`, `bank-prev-page`, `bank-next-page`, `bank-go-page`, and update `filter-package` to auto-expand. | `app.js` | [X] Completed |
| **T008** | Styling (Zone B) | Add Zen White CSS rules in `ZEN-PAGES.css` for `.zen-q-collapse-head`, `.zen-toggle-bank-list-btn`, `.zen-pagination`, and mobile responsiveness. | `ZEN-PAGES.css` | [X] Completed |
| **T009** | Automated Testing | Create `tests/test-bank-soal-performance.mjs` verifying all 15 regression criteria via Chrome Headless CDP. | `tests/test-bank-soal-performance.mjs` | [X] Completed |
| **T010** | Existing Tests | Verify `node tests/verify-cache-governance.js` and `node tests/test-cache-cleanup-scenarios.js` pass with 0 errors. | Test Harness | [X] Completed |
| **T011** | Post-Benchmark | Measure post-optimization metrics and capture desktop/mobile screenshots for artifact directory. | Benchmark & Artifacts | [X] Completed |
| **T012** | Convergence Audit | Prepare final performance report with comparative before/after data. | Final Report | [X] Completed |
