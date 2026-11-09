# Implementation Plan: Bank Soal Lazy Loading & Pagination (002-bank-soal-lazy-pagination)

**Feature Branch**: `002-bank-soal-lazy-pagination`  
**Created**: 2026-11-09  
**Constitution Tier**: Tier 3 (UI, CSS & Layout Modifications) with Zone A Frozen / Zone B Scoped

---

## 1. Technical Architecture & Component Boundaries

### File Scope & Roles
| File | Action | Responsibilities |
|---|---|---|
| **`app.js`** | **Modified** | Add `state.bankListExpanded`, `state.bankPage`, `state.bankPageSize`; implement collapsed rendering in `renderBank()`; implement fast search index/regex; implement slice-based pagination; add event dispatchers (`toggle-bank-list`, `bank-prev-page`, `bank-next-page`, `bank-go-page`). |
| **`ZEN-PAGES.css`** | **Modified** | Zone B stylesheet for Non-CBT pages. Add styles for `.zen-q-collapse-head`, `.zen-toggle-bank-list-btn`, `.zen-pagination`, and mobile responsive layout. |
| **`sw.js`** | **READ-ONLY** | Untouched. Active shell version remains v27. |
| **`index.html`** | **READ-ONLY** | Untouched. Asset versions and DOM shell structure unchanged. |
| **`styles.css`** | **READ-ONLY** | Zone A CBT styles untouched. |
| **Database & JSON** | **READ-ONLY** | All 1,006 questions, schemas, IDs, answers remain 100% untouched. |

---

## 2. Implementation Details

### A. State Model Extensions in `app.js`
```javascript
// In state initialization:
bankFilter: { search: '', setId: 'all', media: 'all', status: 'all' },
bankSelectedIds: new Set(),
bankVisibleIds: [],
bankListExpanded: false, // Default collapsed
bankPage: 1,             // Current page
bankPageSize: 50         // 50 questions per page
```

### B. Fast Search Text Indexing
Replace repeated calls to `richPlainText()` (which invoked `document.createElement('div')` and `sanitizeRichHTML` 5 times per question) with a lightweight, regex-based cache:
```javascript
function getQuestionSearchIndex(q) {
  if (q._searchIndex) return q._searchIndex;
  const promptText = (q.questionText || q.prompt || '').replace(/<[^>]+>/g, ' ');
  const instrText = (q.instructions || '').replace(/<[^>]+>/g, ' ');
  const optText = (q.options || []).map(o => (o.text || '').replace(/<[^>]+>/g, ' ')).join(' ');
  const index = `${promptText} ${instrText} ${optText} ${q.explanation || ''} ${q.setName || ''} ${q.sourcePdf || ''} soal ${q.questionNumber || ''}`.toLowerCase();
  q._searchIndex = index;
  return index;
}
```

### C. Collapsed vs. Expanded Rendering in `renderBank()`
```javascript
if (!state.bankListExpanded) {
  // Render ONLY the collapsed section header
  // Zero .zen-q-item elements generated
  // Zero richHTML passes executed
} else {
  // Render filters, pagination bar, and ONLY the 50 questions for state.bankPage
  const startIdx = (state.bankPage - 1) * state.bankPageSize;
  const endIdx = Math.min(startIdx + state.bankPageSize, qs.length);
  const pageQuestions = qs.slice(startIdx, endIdx);
  // pageQuestions.map(q => renderQuestionItem(q))
}
```

### D. Pagination Algorithm
- Total filtered questions: `N = qs.length`
- Total pages: `P = Math.max(1, Math.ceil(N / state.bankPageSize))`
- Bound validation: `state.bankPage = Math.min(Math.max(1, state.bankPage), P)`
- Visible pagination numbers: Dynamic smart sliding window with ellipsis (`[1] ... [4] [5] [6] ... [21]`).

---

## 3. Testing & Empirical Verification Strategy

### Regression Test Suite (`tests/test-bank-soal-performance.mjs`)
1. **Cold Start & Baseline Check**: App boots cleanly.
2. **Tab Open Instantaneous Check**: Clicking `[data-page="bank"]` completes in < 50 ms.
3. **Collapsed Invariant**: `state.bankListExpanded === false`, zero `.zen-q-item` elements in DOM, DOM nodes < 500.
4. **Package Catalog Integrity**: All 27 packages visible and interactive.
5. **Expand Trigger**: Clicking `[Tampilkan daftar soal ▾]` expands list, renders <= 50 `.zen-q-item` cards.
6. **DOM Node Budget**: Total DOM nodes after expansion < 3,000.
7. **Pagination Navigation**: Clicking `Berikutnya`, `Sebelumnya`, and page pills changes displayed questions without duplication.
8. **Full Dataset Search**: Search for terms across 1,006 questions evaluates the whole dataset and correctly filters results.
9. **Filter Reset**: Changing filters resets active page to 1.
10. **Collapse Detachment**: Clicking `[Sembunyikan daftar soal ▴]` completely removes question elements from the DOM (`length === 0`).
11. **Repeat Stability**: Repeated toggle (expand/collapse 5 times) produces zero DOM node leakage or event listener collisions.
12. **CBT Engine Non-interference**: Launching an exam loads all 40 standard questions with full interactive timer and scoring.
13. **PWA Offline Resilience**: Tested in offline mode.
14. **Existing Test Invariance**:
    - `node tests/verify-cache-governance.js` -> 100% PASS
    - `node tests/test-cache-cleanup-scenarios.js` -> 100% PASS
15. **Multi-Viewport Visual Verification**: Capture desktop (1440x900) and mobile (390x844) screenshots in collapsed and expanded states.
