# Phase 0 Research: Add Individual Questions to Study List from Bank Soal

**Feature**: 005-bank-to-study-list
**Date**: 2026-11-10
**Status**: Completed

---

## 1. Context & Objectives

The goal is to provide a one-click action directly on each question card in Bank Soal (`.zen-q-item .zen-q-actions`) allowing candidates to bookmark any individual question into their Study List.

Key operational objectives:
1. Re-use existing canonical Study List architecture (`state.studyList`, `toggleStudyItem(q)`, `isQuestionInStudy(q)`, and IndexedDB store `studyList`).
2. Display persistent bookmark state (`+` when unbookmarked, `✓` when bookmarked) immediately on render and across reloads.
3. Preserve all existing browsing state in Bank Soal (pagination, search filter, package filter, scroll position) via in-place DOM updates without full page re-render.
4. Prevent duplicate records in IndexedDB using deterministic composite keys (`${setId}::${q.id}`).
5. Ensure mobile (360px–390px) and desktop (1440px) visual ergonomics with zero horizontal overflow.

---

## 2. Research Decisions & Findings

### Decision 1: DOM Placement and Markup Structure

- **Context**: In `app.js` (`renderBank()`, lines 2716–2720), each question card renders an action container:
  ```html
  <div class="zen-q-actions">
    <button type="button" class="hd-row-btn" data-action="edit-question" data-id="${esc(q.id)}">${esc(B.editBtn)}</button>
    <button type="button" class="hd-row-btn" data-action="duplicate-question" data-id="${esc(q.id)}">${esc(B.dupBtn)}</button>
    <button type="button" class="hd-row-btn zen-danger-btn" data-action="delete-question" data-id="${esc(q.id)}">${esc(B.delBtn)}</button>
  </div>
  ```
- **Decision**: Prepend a dedicated Study List button as the first item in `.zen-q-actions`:
  ```html
  <button type="button"
          class="hd-row-btn zen-study-btn ${inStudy ? 'is-active' : ''}"
          data-action="add-bank-study"
          data-id="${esc(q.id)}"
          title="${inStudy ? 'Sudah ada di Study List' : t('studyAddTooltip')}"
          aria-label="${inStudy ? 'Sudah ada di Study List' : t('studyAddTooltip')}"
          aria-pressed="${inStudy}">${inStudy ? '✓' : '+'}</button>
  ```
- **Rationale**:
  - Placing it first or beside Edit aligns with universal bookmarking conventions (left-anchored quick action).
  - Matches the existing button pattern used in Exam Review (`toggle-review-study`) and CBT Exam toolbar (`toggle-study-list`).
  - Uses the existing add-tooltip and success-feedback behavior. Existing items remain marked with `✓` and repeated clicks never remove them.
- **Alternatives Considered**:
  - *Floating star/bookmark icon on top-right of question card*: Rejected because `.zen-q-actions` already gathers all card-level user actions. Adding floating elements complicates responsive flow and risks overlapping question text on narrow viewports.

---

### Decision 2: State Resolution and Persistence Engine

- **Context**: Study List items are persisted in IndexedDB under store `studyList` using composite primary key `${setId}::${q.id}`. In memory, `state.studyList` stores the active array of bookmarked items.
- **Decision**: Leverage existing canonical helpers:
  1. `isQuestionInStudy(q)` for reading membership status during template evaluation.
  2. `toggleStudyItem(q)` for toggling membership, updating `state.studyList`, syncing IndexedDB (`put`/`del`), triggering `updateStudyBadge()`, and popping the toast notification.
- **Rationale**:
  - Single Source of Truth: Guarantees 100% synchronization across Bank Soal, CBT Exam, Results Review, and the Study List tab.
  - Zero Schema Overhead: No database migrations, index adjustments, or new stores needed.
  - Zero Code Duplication: Does not create a parallel storage mechanism.
- **Alternatives Considered**:
  - *Creating a local `Set` in `state.bankStudyList`*: Rejected because maintaining two disjoint caches introduces desynchronization bugs and violates Constitution Principle II.

---

### Decision 3: Event Handling & In-Place DOM Updates (Preserving Pagination, Scroll & Idempotent Add-Only)

- **Context**: Calling `renderBank()` whenever a question is bookmarked would re-render the entire question list. While `renderBank()` respects pagination state, a full re-render triggers DOM reconstruction, potentially disrupting focus, resetting transient element interactions, and causing layout shifts. Furthermore, clicking a question that is already bookmarked must be strictly idempotent (never delete or remove from Bank Soal).
- **Decision**: Handle `add-bank-study` via delegated click in `app.js` and update the button's DOM node directly in-place:
  ```js
  case 'add-bank-study': {
    if (!id || el.dataset.pending === '1') break;
    el.dataset.pending = '1';
    try {
      const q = (state.questions || []).find(x => x.id === id);
      if (!q) break;
      if (isQuestionInStudy(q)) {
        toast('Soal sudah tersimpan di Study List.', 'info');
        break;
      }
      const newItem = makeStudyItem(q);
      if (!Array.isArray(state.studyList)) state.studyList = [];
      state.studyList.unshift(newItem);
      try {
        await put('studyList', newItem);
      } catch (err) {
        console.warn('Gagal menyimpan ke IndexedDB studyList:', err);
      }
      updateStudyBadge();
      toast(t('studyAddedToast'), 'success');
      el.classList.add('is-active');
      el.setAttribute('aria-pressed', 'true');
      el.setAttribute('title', 'Sudah ada di Study List');
      el.setAttribute('aria-label', 'Sudah ada di Study List');
      el.textContent = '✓';
    } finally {
      delete el.dataset.pending;
    }
    break;
  }
  ```
- **Rationale**:
  - 100% in-place DOM mutation: zero layout shift, zero scroll reset, active pagination page remains completely untouched.
  - Sub-10ms UI execution: avoids reconstructing 20–50 complex DOM trees with ruby tags.
  - Re-entrant guard via `el.dataset.pending = '1'` prevents rapid double-click race conditions on async IndexedDB transactions.
- **Alternatives Considered**:
  - *Full `renderBank()` invocation*: Rejected because re-rendering the active page causes visual flicker and unnecessary DOM garbage collection.

---

### Decision 4: Mobile & Desktop Layout Reflow (Addressing 4 Buttons in `.zen-q-actions`)

- **Context**: In `ZEN-PAGES.css` (line 2040–2045), narrow viewports (`@media (max-width: 768px)`) format `.zen-bank-page .zen-q-actions` with:
  ```css
  .zen-bank-page .zen-q-actions {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 6px;
  }
  ```
  If a 4th button is added without CSS adjustments, the 4th button would either break into an unbalanced second row or cause overflow.
- **Decision**: Update mobile layout in `ZEN-PAGES.css`:
  ```css
  .zen-bank-page .zen-q-actions {
    width: 100%;
    display: grid;
    grid-template-columns: 38px repeat(3, minmax(0, 1fr));
    gap: 6px;
  }
  ```
  And style `.zen-study-btn`:
  ```css
  .zen-bank-page .zen-study-btn {
    min-width: 38px;
    padding: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 700;
  }
  .zen-bank-page .zen-study-btn.is-active {
    background: #0f766e;
    color: #ffffff;
    border-color: #0f766e;
  }
  ```
- **Rationale**:
  - The Study List button only contains a single glyph (`+` or `✓`), so an ergonomic square hit box (38px × 34px) saves critical horizontal space.
  - The 3 text action buttons (`Edit`, `Duplikat`, `Hapus`) retain 100% of their remaining flex/grid width without text truncation or wrapping.
  - On desktop (where `display: flex; gap: 6px;` applies), `.zen-study-btn` naturally aligns as a compact 34×34px or 38×32px square button beside the other row buttons.
- **Alternatives Considered**:
  - *`grid-template-columns: repeat(4, minmax(0, 1fr))`*: Rejected because splitting a 350px mobile width into 4 equal columns squeezes "Duplikat" and "Hapus" into ~70px, which causes Indonesian text truncation or awkward line breaks.
  - *Icon with text "Study"*: Rejected due to mobile width constraints. A single glyph (`+` / `✓`) with an explicit tooltip and aria-label is standard, clean, and slop-free.

---

### Decision 5: Offline PWA & Zero-Dependency Policy

- **Context**: Constitution Principle VI mandates zero runtime dependencies, full PWA offline capability, and zero external CDNs.
- **Decision**: Implement using 100% Native Vanilla JS (ES Modules) and pure CSS.
- **Rationale**:
  - `indexedDB` operation is 100% local and functions identically online or offline.
  - `updateStudyBadge()` updates the DOM count locally.
  - No network calls or API endpoints are contacted.


---

## 3. Baseline Regression Findings & Non-Interference Invariants

### 3.1 Baseline Error Investigation (`tests/verify-cache-governance.js` and `tests/test-exam-timer-centering.mjs`)
- **Observed Behavior**: `node tests/verify-cache-governance.js` and `node tests/test-exam-timer-centering.mjs` exited with code 1.
- **Root Cause Analysis**: Line 66 in `tests/verify-cache-governance.js` tests:
  ```js
  const hasDynamicActivate = swContent.includes("key.startsWith('ssw-pm-mock-test-shell-') &&\n          key !== CACHE_NAME") ||
                             swContent.includes("key.startsWith('ssw-pm-mock-test-shell-') && key !== CACHE_NAME");
  ```
  On Windows environments, git checkout stores `sw.js` with CRLF (`\r\n`). The string test checks for LF (`\n`), which fails with:
  `[FAIL] sw.js activate handler does not contain dynamic prefix gating`.
  Because `tests/test-exam-timer-centering.mjs` imports `runGovernanceCheck()` from `verify-cache-governance.js` as an invariant pre-check (line 125-128), it terminates before launching Chrome.
- **Non-Interference Governance**:
  - Feature 005 tasks **MUST NOT** modify CBT exam engine files (`styles.css`, `renderExam()` in `app.js`).
  - Feature 005 tasks **MUST NOT** modify `sw.js` shell cache governance.
  - Feature 005 tasks **MUST NOT** modify swipe navigation handlers (`setupSwipeNavigation()`).
  - Baseline tests will be reported accurately with this forensic rationale and will not be falsely reported as passed.
