# Interface Contract: Bank Soal Study List Action

**Feature**: 005-bank-to-study-list
**Date**: 2026-11-10
**Status**: Draft

---

## 1. DOM Element Contract

The button is rendered inside each `.zen-q-item .zen-q-actions` container in `renderBank()` (`app.js`).

### 1.1 Unbookmarked State (Default)

```html
<button
  type="button"
  class="hd-row-btn zen-study-btn"
  data-action="add-bank-study"
  data-id="<QUESTION_ID>"
  title="Tambahkan ke Study List"
  aria-label="Tambahkan ke Study List"
  aria-pressed="false"
>+</button>
```

### 1.2 Bookmarked State (Active - Idempotent Add-Only)

```html
<button
  type="button"
  class="hd-row-btn zen-study-btn is-active"
  data-action="add-bank-study"
  data-id="<QUESTION_ID>"
  title="Sudah ada di Study List"
  aria-label="Sudah ada di Study List"
  aria-pressed="true"
>✓</button>
```

---

## 2. Event Dispatch & Handler Contract

### 2.1 Event Listener
- **Target**: Centralized delegation on `#view` container:
  ```js
  view.addEventListener('click', async (event) => {
    const el = event.target.closest('[data-action]');
    if (!el) return;
    const action = el.dataset.action;
    const id = el.dataset.id;
    // ...
  });
  ```
- **Handler Case**: `case 'add-bank-study':`

### 2.2 Execution Sequence
1. **Concurrency Check**:
   If `el.dataset.pending === '1'`, exit immediately (no-op).
2. **Locking**:
   Set `el.dataset.pending = '1'`.
3. **Question Lookup**:
   Retrieve question object `q` from `state.questions` where `x.id === id`. If not found, unlock and exit.
4. **Idempotency Guard**:
   Check `if (isQuestionInStudy(q))`:
   - The question is already saved.
   - Do NOT delete or remove.
   - Show notification `toast('Soal sudah tersimpan di Study List.', 'info')` or keep silent.
   - Ensure `el.classList.add('is-active')`, `el.textContent = '✓'`.
   - Unlock and exit immediately.
5. **Addition Execution**:
   - Create `newItem = makeStudyItem(q)`.
   - Push/unshift to `state.studyList`.
   - Persist to IndexedDB: `await put('studyList', newItem)`.
   - Update sidebar badge: `updateStudyBadge()`.
   - Show success notification: `toast(t('studyAddedToast'), 'success')`.
6. **In-Place DOM Mutation**:
   - `el.classList.add('is-active')`
   - `el.setAttribute('aria-pressed', 'true')`
   - `el.setAttribute('title', 'Sudah ada di Study List')`
   - `el.setAttribute('aria-label', 'Sudah ada di Study List')`
   - `el.textContent = '✓'`
7. **Cleanup**:
   Delete `el.dataset.pending` in a `finally` block.

---

## 3. Behavioral Invariants

1. **Non-Propagation**:
   - Clicking `.zen-study-btn` MUST NOT toggle card selection checkboxes (`data-question-select`).
   - Clicking `.zen-study-btn` MUST NOT open the question edit modal or duplicate dialog.
2. **Pagination Invariance**:
   - The active Bank Soal page index (`state.bankCurrentPage`) MUST NOT change.
   - The scroll position of the window MUST NOT reset to top.
3. **Filter Invariance**:
   - Active package filter, search string, media filter, and status filter MUST remain 100% active.
