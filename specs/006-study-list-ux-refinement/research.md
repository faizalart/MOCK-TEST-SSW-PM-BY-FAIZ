# Research & Technical Architecture: Study List UX Refinement

**Feature**: `specs/006-study-list-ux-refinement`
**Date**: 2026-11-10
**Status**: Completed

---

## 1. Architectural & UX Decisions

### Decision 1: Minimalist Standalone Flag Icon
- **Context**: The previous Study List button rendered text characters (`✓` / `+`) with heavy solid badge backgrounds. User requirements demand a clean, restrained outline flag matching the Zen White Digital Library design system (Energy 1/3, Motion 1/3).
- **Design Rationale (`R-31`)**: Adopt a standalone Lucide-style outline SVG flag (`viewBox="0 0 24 24"`, 14×14px) embedded directly into `.zen-study-btn`.
  - **Inactive state**: `fill: none; stroke: currentColor;` using subtle muted color (`var(--zen-muted, #71717a)`), transparent background, hairline border.
  - **Active state (`.is-active`)**: `fill: currentColor; stroke: currentColor;` using restrained teal (`var(--zen-teal, #0f766e)`), subtle tinted background (`rgba(15, 118, 110, 0.08)`), matching border.
  - **Forbidden artifacts**: No circular bubbles, background badges, speech bubbles, chevrons, expanding arrows, bounce, or rotation.
  - **Accessibility**: Preserves `aria-label`, `title`, and `aria-pressed` states for screen readers and keyboard focus indicators.

### Decision 2: Individual Card Two-Way Toggle
- **Context**: In Feature 005, clicking a saved question showed an info toast without removing it (add-only). Candidates need direct in-place unbookmarking capability.
- **Design Rationale (`R-31`)**: Utilize the canonical `toggleStudyItem(q)` pipeline already defined in `app.js`:
  - **First click (unsaved)**: Question is transformed via `makeStudyItem(q)` and saved to `studyList` store via `put('studyList', newItem)`. The button transitions to `.is-active`, updates tooltip to `"Hapus dari Study List"`, displays success toast (`"Soal ditambahkan ke Study List."`), and increments the sidebar badge.
  - **Second click (saved)**: Question is identified via composite ID `${setId}::${q.id}` and removed from `studyList` store via `del('studyList', item.id)`. The button removes `.is-active`, updates tooltip to `"Tambahkan ke Study List"`, displays informative toast (`"Soal dihapus dari Study List."`), and decrements the sidebar badge.
  - **Concurrency Guard**: Synchronous dataset check `el.dataset.pending === '1'` locked during async IndexedDB I/O prevents double-click race conditions.
  - **Event Isolation**: `event.stopPropagation()` prevents parent `.zen-q-item` event bubbling.

### Decision 3: Selection Toolbar Placement & Bulk Plus Action
- **Context**: Candidates frequently select multiple questions (via checkboxes or "Pilih Semua") and require batch addition to Study List.
- **Design Rationale (`R-31`)**: Insert the new bulk action button inside `.zen-bulk-bar`, situated beside Clear Selection (`clear-question-selection`) and Delete Selected (`delete-selected-questions`):
  ```html
  <button type="button" class="hd-row-btn zen-bulk-study-btn" data-action="bulk-add-study" ${selectedCount ? '' : 'disabled'} title="Tambah soal terpilih ke Study List" aria-label="Tambah soal terpilih ke Study List">
    <svg class="zen-bulk-plus-icon" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
    <span>${esc(B.addSelStudy || 'Tambah ke Study List')}</span>
  </button>
  ```
- **State Binding**: The button is enabled only when `state.bankSelectedIds.size > 0`.
- **Duplicate Skipping Mechanics**: Iterates through all IDs in `state.bankSelectedIds`. For each question:
  - If `isQuestionInStudy(q)` is true: increments `skippedCount` and skips insertion. Never deletes or duplicates existing records.
  - If `isQuestionInStudy(q)` is false: constructs `makeStudyItem(q)`, inserts into `state.studyList`, stores to IndexedDB, and increments `addedCount`.
- **Targeted Feedback & Badge Sync**: Displays concise feedback toast `"${addedCount} soal ditambahkan · ${skippedCount} sudah ada"`. The sidebar badge is incremented by strictly `addedCount`.
- **In-Place DOM Synchronization**: Visible question cards on the active page matching newly added IDs are dynamically updated with `.classList.add('is-active')` without requiring a full page re-render.
- **Workflow Invariance**: The user's active checkbox selection (`state.bankSelectedIds`), current search query, package filters, media filters, status filters, pagination index, and vertical scroll position remain completely intact.

### Decision 4: Mobile & Responsive Layout Ergonomics
- **Context**: Narrow screens (360px–390px) must accommodate all toolbar buttons and card controls without horizontal scrolling.
- **Design Rationale (`R-31`)**:
  - Selection toolbar (`.zen-bulk-bar`) uses flexbox with `flex-wrap: wrap; gap: 8px;`, allowing buttons to reflow cleanly on mobile.
  - Card action bar (`.zen-q-actions`) maintains 32px height icon buttons with accessible touch targets (minimum 44×44px hit bounds via generous padding and margins).

### Decision 5: Architectural Boundaries & Zero Disruption
- **Protected Zones**: Zone A (CBT examination engine `renderExam()`, exam countdown timer, exam navigation, question map, scoring), Service Worker cache governance (`sw.js`), and global swipe navigation (`zen-swipe`) are strictly untouched.
- **Scope**: Changes are confined to `app.js` (renderBank, handleAction) and `ZEN-PAGES.css` (button styles and flag SVG layout).

---

## 2. Technical Stack Verification

| Component | Standard / Value | Compliance Note |
| :--- | :--- | :--- |
| **Language** | Vanilla JavaScript (ES2022+) | Native ES Modules, no transpilation |
| **Styling** | Native Modern CSS | Zone B (`ZEN-PAGES.css`), Zen White aesthetic |
| **Icons** | Clean Inline SVG | Lucide/Feather outline flag, zero external icon fonts |
| **Database** | IndexedDB (`ssw-pm-mock-test-db` v2) | Store `studyList`, fallback memory `Map` |
| **Testing** | Node.js + CDP Automation | Headless Chromium regression suite |
