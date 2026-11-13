# Contract: Retry Session Lifecycle & Breadcrumb Navigation (US1)

**Feature**: `010-practice-review-retry-shortcuts-fullscreen`  
**Contract ID**: `CTR-010-US1-RETRY`  
**Spec Reference**: [spec.md](../spec.md#user-story-1---retry-incorrect-questions-only-priority-p1)

---

## 1. Action Trigger: `retry-incorrect-questions`

### 1.1 Location & Trigger Element
- Rendered inside `.review-toolbar` or Review action bar on the Exam Results / Review screen (`state.page === 'result'` or `'review'`).
- Action Element:
  ```html
  <button type="button" 
          class="button button-primary button-small retry-incorrect-btn" 
          data-action="retry-incorrect-questions" 
          data-session-id="${esc(session.id)}"
          aria-label="Ulangi Jawaban Salah (${count})">
    Ulangi Jawaban Salah (${count})
  </button>
  ```

### 1.2 Preconditions & Guard Logic
1. `parentSession` must be retrieved via `data-session-id` or active `state.resultSession`.
2. Extract incorrect questions:
   ```javascript
   const wrongQuestions = parentSession.questions.filter((q, idx) => {
     const userAns = parentSession.answers ? parentSession.answers[q.id] : undefined;
     return userAns != null && userAns !== q.correctIndex;
   });
   ```
3. If `wrongQuestions.length === 0`:
   - Invoke `toast('Tidak ada jawaban salah untuk diulangi', 'info')`.
   - Abort execution. Do NOT instantiate a session.

### 1.3 Retry Session Instantiation
When `wrongQuestions.length > 0`:
1. Clone questions and annotate origin question numbers:
   ```javascript
   const clonedQuestions = wrongQuestions.map((q) => {
     // Determine original 1-based index in the parent exam
     const origIndex = parentSession.questions.findIndex(pq => pq.id === q.id);
     return {
       ...deepClone(q),
       originQuestionNumber: origIndex >= 0 ? origIndex + 1 : undefined
     };
   });
   ```
2. Build new practice session object:
   ```javascript
   const retrySession = {
     id: uid('exam'),
     mode: 'practice',
     timed: false,
     deadline: null,
     packageId: parentSession.packageId || 'custom',
     packageTitle: parentSession.packageTitle || 'Paket Ujian',
     originSessionId: parentSession.id,
     originExamTitle: parentSession.packageTitle || 'Ujian Utama',
     questions: clonedQuestions,
     answers: {},
     flaggedQuestions: [],
     currentIndex: 0,
     startedAt: Date.now(),
     finishedAt: null
   };
   ```
3. Transition application state:
   - `state.activeExam = retrySession;`
   - `state.page = 'exam';`
   - `await persistExam();`
   - `renderExam();`

---

## 2. Navigation Contract: Top Breadcrumb Bar

### 2.1 Display Conditions
- Visible when `activeExam()?.originSessionId` is present (in CBT mode).
- Visible on Results / Review screen when `state.resultSession?.originSessionId` is present.

### 2.2 DOM Structure
```html
<nav class="exam-retry-breadcrumb" aria-label="Navigasi Sesi Ulang">
  <div class="breadcrumb-container">
    <span class="breadcrumb-item breadcrumb-parent">${esc(originTitle)}</span>
    <span class="breadcrumb-separator" aria-hidden="true">›</span>
    <span class="breadcrumb-item breadcrumb-current">Latihan Ulang Jawaban Salah</span>
    <button type="button" 
            class="button button-subtle button-small breadcrumb-return-btn" 
            data-action="return-to-parent-results" 
            data-parent-id="${esc(originSessionId)}"
            aria-label="Kembali ke Hasil Ujian Utama">
      ‹ Kembali ke Hasil Utama
    </button>
  </div>
</nav>
```

### 2.3 Return Action Handler: `return-to-parent-results`
```javascript
case 'return-to-parent-results': {
  const parentId = target.getAttribute('data-parent-id');
  if (!parentId) break;
  
  // If leaving active CBT, persist progress and clean up exam shell
  if (state.page === 'exam') {
    await persistExam();
    cleanupExamUI();
  }
  
  state.resultId = parentId;
  state.page = 'result';
  state.reviewFilter = 'all';
  await render();
  break;
}
```

---

## 3. Question Card Origin Badge Contract

### 3.1 Display Condition
When `q.originQuestionNumber` is defined on the active question object during CBT rendering:

### 3.2 DOM Structure
```html
<span class="exam-question-origin-badge" title="Nomor soal pada ujian utama">
  Asal: Soal #${q.originQuestionNumber}
</span>
```
Placed in the question card header next to the sequential question badge (e.g. `Soal 2 dari 5`).
