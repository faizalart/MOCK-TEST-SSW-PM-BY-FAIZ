# Interface Contract: Practice Mode Inline Indonesian Translations

**Feature**: `specs/007-practice-mode-translations`  
**Date**: 2026-11-11  
**Status**: Completed  

---

## 1. Globe Toggle Button DOM Contract

### Element Signature
Rendered within `<div class="exam-bottom-tools">` directly after `<button class="study-list-quick-button">`:

```html
<button type="button"
  class="exam-tool-button practice-trans-btn ${state.practiceTranslationOpen ? 'is-active' : ''}"
  data-action="toggle-practice-translation"
  title="${state.practiceTranslationOpen ? 'Sembunyikan Terjemahan' : 'Tampilkan Terjemahan'}"
  aria-label="Toggle Terjemahan Indonesia"
  aria-expanded="${Boolean(state.practiceTranslationOpen)}"
  aria-pressed="${Boolean(state.practiceTranslationOpen)}">
  <svg class="practice-globe-icon" viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <circle cx="8" cy="8" r="6.5"/>
    <path d="M1.5 8h13"/>
    <ellipse cx="8" cy="8" rx="3.2" ry="6.5"/>
  </svg>
</button>
```

### Attributes & Rules
- `class`: MUST include `exam-tool-button` and `practice-trans-btn`. MUST conditionally include `is-active` when translations are enabled.
- `data-action`: Fixed to `"toggle-practice-translation"`.
- `title`: Dynamic: `"Sembunyikan Terjemahan"` when active, `"Tampilkan Terjemahan"` when inactive.
- `aria-label`: Fixed to `"Toggle Terjemahan Indonesia"`.
- `aria-expanded`: String representation of boolean (`"true"` / `"false"`).
- `aria-pressed`: String representation of boolean (`"true"` / `"false"`).
- Touch Target: 44 × 44 px ergonomic target.
- Visibility Rule: Rendered **ONLY** when `s.mode === 'practice' && !s.deadline && !s.timed`. Omitted entirely in Full Mock Test and timed sessions.

---

## 2. Question Prompt Translation DOM Contract

### Element Signature
Rendered within `<div class="question-card">`, immediately after `<div class="question-prompt rich-content" lang="ja">`:

```html
<div class="practice-question-translation" lang="id">
  ${richHTML(q.promptTranslation)}
</div>
```

### Attributes & Rules
- `class`: Fixed to `"practice-question-translation"`.
- `lang`: Fixed to `"id"` (Indonesian).
- Visibility: Present in the DOM only when `state.practiceTranslationOpen === true` and `q.promptTranslation` is non-empty.
- Typography:
  - Font size: ~13px.
  - Font weight: 400.
  - Line height: 1.5.
  - Color: `#5a6672` (muted, WCAG AA contrast on white reading surface).
  - Margin top: 8px.
  - Background: `transparent`.
  - Border: `none`.
  - Padding: `0`.

---

## 3. Option Translation DOM Contract

### Element Signature
Rendered within `<div role="radio" class="answer-choice">` inside `<span class="answer-content">`, immediately after `<div class="answer-text rich-content" lang="ja">`:

```html
<div role="radio" tabindex="0" class="answer-choice ${selected ? 'selected' : ''}" data-action="answer" data-index="${i}" aria-checked="${selected}" aria-pressed="${selected}">
  <span class="answer-letter">${letter}</span>
  <span class="answer-content">
    ${o.text ? `<div class="answer-text rich-content" lang="ja">${richHTML(o.text)}</div>` : ''}
    ${state.practiceTranslationOpen && o.translation ? `<span class="practice-option-translation" lang="id">${richHTML(o.translation)}</span>` : ''}
    ${m ? `<img class="answer-image" src="${mediaURL(m)}" alt="Option ${letter}">` : ''}
  </span>
  <span class="answer-radio" aria-hidden="true"></span>
</div>
```

### Attributes & Rules
- Tag: Phrasing element `<span>` (to maintain valid HTML within outer inline `<span>` `.answer-content`).
- `class`: Fixed to `"practice-option-translation"`.
- `lang`: Fixed to `"id"` (Indonesian).
- CSS Display: `display: block;`.
- Visibility: Present in the DOM only when `state.practiceTranslationOpen === true` and `o.translation` is non-empty.
- Typography:
  - Font size: ~12px.
  - Font weight: 400.
  - Line height: 1.4.
  - Color: `#64748b` (muted, readable).
  - Margin top: 5px (4–6px vertical separation).
  - Background: `transparent`.
  - Border: `none`.
  - Padding: `0`.
- Visual Invariant: No bullet markers, dots, dashes, or added numbering. Preserves existing radio selection highlight and click handlers.

---

## 4. Event Delegation Contract

### Action: `toggle-practice-translation`
Handled by the central click event listener in `app.js`:

```javascript
case 'toggle-practice-translation': {
  const s = activeExam();
  const isUntimedPractice = Boolean(s && s.mode === 'practice' && !s.deadline && !s.timed);
  if (!isUntimedPractice) break;
  state.practiceTranslationOpen = !state.practiceTranslationOpen;
  renderExam();
  break;
}
```

- Target: Any click originating on or inside `[data-action="toggle-practice-translation"]`.
- State Effect: Toggles `state.practiceTranslationOpen`.
- DOM Effect: Immediate re-render via `renderExam()`, updating globe button active state and revealing/hiding all inline translations.
- Invariant: Does not modify exam timer, answer selections, flag status, or question index.

---

## 5. Security & Academic Integrity Contract

- The translation rendering pipeline MUST ONLY consume `q.promptTranslation` and `o.translation`.
- The following fields MUST NEVER be rendered or accessible via translation DOM nodes:
  - `q.correctAnswer`
  - `q.correctIndex`
  - `q.explanation`
- Automated assertions will verify that translation containers contain 0 occurrences of answer keys or explanation strings.
