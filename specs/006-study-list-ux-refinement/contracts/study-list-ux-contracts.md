# Interface & Action Contracts: Study List UX Refinement

**Feature**: `specs/006-study-list-ux-refinement`
**Date**: 2026-11-10
**Status**: Completed

---

## Contract 1: Individual Flag Action (`toggle-bank-study` / Two-Way Toggle)

### 1. Trigger & Target
- **Selector**: `button.zen-study-btn[data-action="toggle-bank-study"]`
- **Location**: `.zen-q-item .zen-q-actions`
- **Event**: `click` (stops propagation via `event.stopPropagation()`)

### 2. Input
- `data-id`: String representation of the question ID (`q.id`).
- `data-pending`: Optional lock string attribute (`'1'`).

### 3. Pre-Conditions
- User is on Bank Soal tab (`state.page === 'bank'`).
- Target question `q` exists in `state.questions`.
- Button does NOT have `data-pending="1"`.

### 4. Execution Semantics
```text
IF isQuestionInStudy(q) IS TRUE:
  1. Remove item matching composite ID `${setId}::${q.id}` from state.studyList
  2. Invoke del('studyList', compositeId) in IndexedDB
  3. Remove class 'is-active' from el
  4. Set el.setAttribute('aria-pressed', 'false')
  5. Set el.setAttribute('title', 'Tambahkan ke Study List')
  6. Set el.setAttribute('aria-label', 'Tambahkan ke Study List')
  7. Decrement sidebar badge via updateStudyBadge()
  8. Display toast("Soal dihapus dari Study List.", "info")
ELSE:
  1. Construct newItem = makeStudyItem(q)
  2. Insert newItem at start of state.studyList
  3. Invoke put('studyList', newItem) in IndexedDB
  4. Add class 'is-active' to el
  5. Set el.setAttribute('aria-pressed', 'true')
  6. Set el.setAttribute('title', 'Hapus dari Study List')
  7. Set el.setAttribute('aria-label', 'Hapus dari Study List')
  8. Increment sidebar badge via updateStudyBadge()
  9. Display toast("Soal ditambahkan ke Study List.", "success")
```

### 5. Invariants
- Parent `.zen-q-item` click handlers and checkbox state MUST NOT be altered.
- Current active page in pagination, search filter, package filter, and scroll position MUST NOT be reset.

---

## Contract 2: Selection Toolbar Bulk Add Action (`bulk-add-study`)

### 1. Trigger & Target
- **Selector**: `button.zen-bulk-study-btn[data-action="bulk-add-study"]`
- **Location**: `.zen-bulk-bar` (beside `clear-question-selection` and `delete-selected-questions`)
- **Event**: `click`

### 2. Input
- `state.bankSelectedIds`: Set of selected question IDs.
- `state.questions`: Array of active questions in memory.
- `state.studyList`: Array of existing study items.

### 3. Pre-Conditions
- Button is enabled ONLY when `state.bankSelectedIds.size > 0`.
- Button does NOT have `data-pending="1"`.

### 4. Execution Semantics
```text
1. Set el.dataset.pending = "1"
2. Initialize addedCount = 0, skippedCount = 0, toPut = []
3. FOR EACH id IN state.bankSelectedIds:
     Find q IN state.questions
     IF q IS NULL: CONTINUE
     IF isQuestionInStudy(q) IS TRUE:
       skippedCount++
     ELSE:
       item = makeStudyItem(q)
       state.studyList.unshift(item)
       toPut.push(item)
       addedCount++
4. IF toPut.length > 0:
     FOR EACH item IN toPut:
       await put('studyList', item)
     updateStudyBadge()
5. FOR EACH id IN state.bankSelectedIds:
     Find cardBtn = querySelector(`.zen-study-btn[data-id="${id}"]`)
     IF cardBtn EXISTS:
       cardBtn.classList.add('is-active')
       cardBtn.setAttribute('aria-pressed', 'true')
       cardBtn.setAttribute('title', 'Hapus dari Study List')
       cardBtn.setAttribute('aria-label', 'Hapus dari Study List')
6. Display toast(`${addedCount} soal ditambahkan · ${skippedCount} sudah ada`, addedCount > 0 ? 'success' : 'info')
7. Delete el.dataset.pending
```

### 5. Invariants
- Existing items in `studyList` MUST NEVER be deleted or duplicated.
- `state.bankSelectedIds` MUST remain unchanged (user's selection is preserved).
- Bank Soal search input, filter dropdowns, pagination index, and scroll position MUST NOT be altered.

---

## Contract 3: Flag Icon & DOM Presentation Contract

### 1. Standalone Flag Icon Specification
```html
<svg class="zen-flag-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
  <line x1="4" y1="22" x2="4" y2="15"></line>
</svg>
```

### 2. Styling Rules
```css
/* Inactive state */
.zen-bank-page .zen-q-actions .zen-study-btn {
  color: var(--zen-muted, #71717a) !important;
  background: transparent !important;
  border: 0 !important;
  border-radius: 0 !important;
  padding: 0 !important;
  width: 44px !important;
  min-width: 44px !important;
  height: 44px !important;
  min-height: 44px !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  box-shadow: none !important;
  transform: none !important;
  animation: none !important;
  transition: color 0.12s ease;
}

.zen-bank-page .zen-q-actions .zen-study-btn .zen-flag-icon {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
}

/* Active state */
.zen-bank-page .zen-q-actions .zen-study-btn.is-active {
  color: var(--zen-teal, #0f766e) !important;
  background: transparent !important;
  border: 0 !important;
}

.zen-bank-page .zen-q-actions .zen-study-btn.is-active .zen-flag-icon {
  fill: currentColor;
  stroke: currentColor;
}

/* Prohibited visual artifacts */
.zen-study-btn {
  background: transparent !important;
  border: 0 !important;
  box-shadow: none !important;
  animation: none !important;
  transform: none !important;
}
```

### 3. Bulk Toolbar Button Specification
```html
<button type="button" class="hd-row-btn zen-bulk-study-btn" data-action="bulk-add-study" ${selectedCount ? '' : 'disabled'} title="Tambah soal terpilih ke Study List" aria-label="Tambah soal terpilih ke Study List">
  <svg class="zen-bulk-plus-icon" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
  <span>${esc(B.addSelStudy || 'Tambah ke Study List')}</span>
</button>
```
