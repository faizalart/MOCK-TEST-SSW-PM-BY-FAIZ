# Phase 1 UI & Interaction Contract: Selective Translation & Kotoba Reveal (Full Bank Coverage)

**Feature**: `specs/008-practice-selective-translation-kotoba`  
**Date**: 2026-11-12 (Updated for Full Bank Scope & Pathway B Provenance)  
**Status**: Completed  
**Target Branch**: `feat/practice-selective-translation-kotoba`

---

## 1. DOM Architecture & Markup Specifications

Applicable across all 1,006 questions and 3,110 options in untimed Practice Mode.

### 1.1 Question Prompt Row (`.practice-prompt-row`)

```html
<div class="practice-prompt-row">
  <!-- LEFT: Sentence Translation Button -->
  <button type="button"
          class="practice-row-ctrl practice-ctrl-trans ${isPromptTransOpen ? 'is-active' : ''}"
          data-action="toggle-selective-trans"
          data-target-type="prompt"
          aria-expanded="${Boolean(isPromptTransOpen)}"
          aria-label="Terjemahan Kalimat Soal"
          title="${isPromptTransOpen ? 'Sembunyikan terjemahan soal' : 'Tampilkan terjemahan soal'}">
    <svg class="practice-ctrl-icon" viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M2 3h12M8 3v10M5 13h6"/>
    </svg>
  </button>

  <!-- CENTER: Prompt Japanese Content, Translation, & Kotoba -->
  <div class="practice-prompt-center">
    <div class="question-prompt rich-content" lang="ja">${richHTML(cleanExamPrompt(q.prompt))}</div>
    
    <!-- Revealed Sentence Translation (if ON) -->
    ${isPromptTransOpen && promptTrans ? `
      <div class="practice-question-translation" lang="id">${richHTML(promptTrans)}</div>
    ` : ''}

    <!-- Revealed Kotoba List (if ON) -->
    ${isPromptKotobaOpen && resolvedPromptKotoba.length ? `
      <div class="practice-kotoba-list practice-question-kotoba" lang="ja">
        ${renderKotobaList(resolvedPromptKotoba)}
      </div>
    ` : ''}
  </div>

  <!-- RIGHT: Kotoba Button -->
  <button type="button"
          class="practice-row-ctrl practice-ctrl-kotoba ${isPromptKotobaOpen ? 'is-active' : ''}"
          data-action="toggle-selective-kotoba"
          data-target-type="prompt"
          aria-expanded="${Boolean(isPromptKotobaOpen)}"
          aria-label="Kosakata Soal"
          title="${isPromptKotobaOpen ? 'Sembunyikan kosakata soal' : 'Tampilkan kosakata soal'}">
    <svg class="practice-ctrl-icon" viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M2.5 3.5h11v9h-11zM6 3.5v9M2.5 8h11"/>
    </svg>
  </button>
</div>
```

---

### 1.2 Option Row (`.practice-option-row`)

In `.practice-option-row`, the radio selection widget (`.answer-choice`) is a **direct sibling** between the two control buttons.
The option key `optKey` is a deterministic composite string derived via `getOptionKey(q.id, o)` (`${q.id}::${o.originalId || o.id}`), ensuring 100% immunity against option shuffling (`setup.shuffleOptions`):

```html
<div class="practice-option-row">
  <!-- LEFT: Option Sentence Translation Button -->
  <button type="button"
          class="practice-row-ctrl practice-ctrl-trans ${isOptTransOpen ? 'is-active' : ''}"
          data-action="toggle-selective-trans"
          data-target-type="option"
          data-opt-key="${esc(optKey)}"
          aria-expanded="${Boolean(isOptTransOpen)}"
          aria-label="Terjemahan Opsi ${letter}"
          title="${isOptTransOpen ? 'Sembunyikan terjemahan opsi' : 'Tampilkan terjemahan opsi'}">
    <svg class="practice-ctrl-icon" viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M2 3h12M8 3v10M5 13h6"/>
    </svg>
  </button>

  <!-- CENTER: Radio Selection Widget (SOLE selection target) -->
  <div role="radio"
       tabindex="0"
       class="answer-choice ${selected ? 'selected' : ''}"
       data-action="answer"
       data-index="${i}"
       aria-checked="${selected}"
       aria-pressed="${selected}">
    <span class="answer-letter">${letter}</span>
    <div class="answer-content">
      <div class="answer-text rich-content" lang="ja">${richHTML(o.text)}</div>
      
      <!-- Revealed Sentence Translation (if ON) -->
      ${isOptTransOpen && optTrans ? `
        <span class="practice-option-translation" lang="id">${richHTML(optTrans)}</span>
      ` : ''}

      <!-- Revealed Kotoba List (if ON) -->
      ${isOptKotobaOpen && resolvedOptKotoba.length ? `
        <div class="practice-kotoba-list practice-option-kotoba" lang="ja">
          ${renderKotobaList(resolvedOptKotoba)}
        </div>
      ` : ''}

      ${m ? `<img class="answer-image" src="${mediaURL(m)}" alt="Option ${letter}">` : ''}
    </div>
    <span class="answer-radio" aria-hidden="true"></span>
  </div>

  <!-- RIGHT: Option Kotoba Button -->
  <button type="button"
          class="practice-row-ctrl practice-ctrl-kotoba ${isOptKotobaOpen ? 'is-active' : ''}"
          data-action="toggle-selective-kotoba"
          data-target-type="option"
          data-opt-key="${esc(optKey)}"
          aria-expanded="${Boolean(isOptKotobaOpen)}"
          aria-label="Kosakata Opsi ${letter}"
          title="${isOptKotobaOpen ? 'Sembunyikan kosakata opsi' : 'Tampilkan kosakata opsi'}">
    <svg class="practice-ctrl-icon" viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M2.5 3.5h11v9h-11zM6 3.5v9M2.5 8h11"/>
    </svg>
  </button>
</div>
```

---

## 2. Kotoba List Rendering Component Contract

```javascript
/**
 * Renders verified Kotoba entries into a minimal vertical list.
 * Term is wrapped in <ruby><rt> for seamless toolbar F synchronization.
 */
function renderKotobaList(kotobaEntries) {
  if (!Array.isArray(kotobaEntries) || !kotobaEntries.length) return '';
  return kotobaEntries.map(entry => `
    <div class="practice-kotoba-item" data-term-id="${esc(entry.id)}">
      <span class="kotoba-term-wrap">
        <ruby class="kotoba-ruby">${esc(entry.kanji)}<rt>${esc(entry.furigana || '')}</rt></ruby>
      </span>
      <span class="kotoba-separator" aria-hidden="true">—</span>
      <span class="kotoba-meaning" lang="id">${esc(entry.arti || '')}</span>
    </div>
  `).join('');
}
```

---

## 3. Central Click Router Action Contract

```javascript
// In app.js handleCentralClick router:
case 'toggle-selective-trans': {
  const s = activeExam();
  if (!s || s.mode !== 'practice' || s.deadline || s.timed) break;
  const targetType = el.dataset.targetType; // 'prompt' | 'option'
  const optKey = el.dataset.optKey || null;
  toggleSelectiveTrans(s, currentExamQuestion(s)?.id, optKey);
  renderExam();
  break;
}

case 'toggle-selective-kotoba': {
  const s = activeExam();
  if (!s || s.mode !== 'practice' || s.deadline || s.timed) break;
  const targetType = el.dataset.targetType; // 'prompt' | 'option'
  const optKey = el.dataset.optKey || null;
  toggleSelectiveKotoba(s, currentExamQuestion(s)?.id, optKey);
  renderExam();
  break;
}
```

---

## 4. Styling & CSS Layout Contract

```css
/* 1. Grid Sibling Layout */
.practice-prompt-row,
.practice-option-row {
  display: grid !important;
  grid-template-columns: 44px minmax(0, 1fr) 44px !important;
  gap: 10px !important;
  align-items: stretch !important;
  width: 100% !important;
}

/* 2. Control Button Base */
.practice-row-ctrl {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 44px !important;
  min-width: 44px !important;
  min-height: 44px !important;
  background: transparent !important;
  border: 1px solid #cfd7de !important;
  border-radius: 4px !important;
  color: #6c7883 !important;
  cursor: pointer !important;
  padding: 0 !important;
  transition: background 0.12s, color 0.12s, border-color 0.12s !important;
}

/* 3. Desktop Hover Isolation */
@media (hover: hover) and (pointer: fine) {
  .practice-row-ctrl:hover:not(.is-active) {
    background: rgba(169, 209, 107, 0.12) !important;
    border-color: #a9d16b !important;
    color: #477d25 !important;
  }
}

/* 4. Touch Feedback (Zero Sticky Hover on Android) */
.practice-row-ctrl:active {
  background: rgba(169, 209, 107, 0.22) !important;
}

/* 5. Active State (Matching CBT Theme Green #a9d16b) */
.practice-row-ctrl.is-active {
  background: rgba(169, 209, 107, 0.18) !important;
  border-color: #a9d16b !important;
  color: #2e5912 !important;
}

/* 6. Kotoba Minimalist List */
.practice-kotoba-list {
  display: flex !important;
  flex-direction: column !important;
  gap: 4px !important;
  margin-top: 6px !important;
  padding-top: 6px !important;
  border-top: 1px dashed #d5dce2 !important;
  font-size: 12px !important;
  line-height: 1.5 !important;
}

.practice-kotoba-item {
  display: flex !important;
  align-items: baseline !important;
  gap: 8px !important;
}

.kotoba-term-wrap {
  font-weight: 700 !important;
  color: #1a232c !important;
}

.kotoba-separator {
  color: #8c9ba5 !important;
}

.kotoba-meaning {
  color: #4b5863 !important;
  font-weight: 400 !important;
}
```

---

## 5. Settings Modal Legal & Attribution Contract

In the Exam Settings Modal (`⚙`), a dedicated collapsible section provides EDRDG attribution:

```html
<div class="settings-attribution-section">
  <h4 class="settings-section-title">Informasi Lisensi & Atribusi Kosakata</h4>
  <p class="settings-attribution-text">
    Data leksikal dasar bahasa Jepang (kata dasar, kanji, dan bacaan kana) bersumber dari <strong>JMdict</strong> oleh <strong>Electronic Dictionary Research and Development Group (EDRDG)</strong> di bawah lisensi <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener">Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)</a>.
  </p>
  <p class="settings-attribution-text">
    Terjemahan bahasa Indonesia, kurasi istilah pengolahan makanan (SSW PM), dan anotasi pedagogis disusun secara mandiri oleh tim SSW PM Mock Test by Faiz. Dataset leksikal ini didistribusikan di bawah lisensi CC BY-SA 4.0. Mesin simulasi CBT dan perangkat lunak aplikasi beroperasi sebagai agregasi terpisah.
  </p>
</div>
```
