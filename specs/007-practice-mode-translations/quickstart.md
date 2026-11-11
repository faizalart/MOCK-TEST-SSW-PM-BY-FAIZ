# Quickstart & Verification Guide: Practice Mode Inline Translations

**Feature**: `specs/007-practice-mode-translations`  
**Date**: 2026-11-11  
**Status**: Ready for Implementation  

---

## 1. Overview

This document specifies the end-to-end verification workflows and automated test scenarios used to prove Feature 007 works as specified. All tests are empirical, reproducible, and run against local Node.js / Headless Chromium CDP environments without external dependencies.

---

## 2. Prerequisites & Setup

1. **Repository Root**: `C:\Users\Admin\Documents\GitHub\MOCK-TEST-SSW-PM-BY-FAIZ`
2. **Environment**: Node.js v20+ with Chrome installed locally.
3. **PWA Static Server**: Standalone static HTTP server serving the repository directory.

---

## 3. End-to-End Verification Scenarios

### Scenario 1: Untimed Practice Mode Presence & Initial State
- **Action**: Launch an untimed Practice Mode session (`setup.mode = 'practice'`).
- **Assertions**:
  - `button.practice-trans-btn` exists inside `.exam-bottom-tools`.
  - Positioned immediately adjacent to `.study-list-quick-button`.
  - Button state: `aria-expanded="false"`, `aria-pressed="false"`, title contains `"Tampilkan Terjemahan"`, not containing `is-active`.
  - SVG icon is a 16 × 16 px wireframe globe (`<svg class="practice-globe-icon">`).
  - No `.practice-question-translation` elements present in DOM.
  - No `.practice-option-translation` elements present in DOM.

### Scenario 2: Timed Exam Mode Absence (Strict Mode Isolation)
- **Action**: Launch a Full Mock Test (`setup.mode = 'full'`) and a Timed Custom Exam.
- **Assertions**:
  - `button.practice-trans-btn` is completely ABSENT from the DOM (`document.querySelector('.practice-trans-btn') === null`).
  - Zero translation containers rendered.

### Scenario 3: Toggle ON Interaction (Prompt & Option Translations)
- **Action**: In an active Practice session, click `.practice-trans-btn`.
- **Assertions**:
  - Button acquires `is-active`, `aria-expanded="true"`, `aria-pressed="true"`, title becomes `"Sembunyikan Terjemahan"`.
  - `.practice-question-translation` is rendered directly inside `.question-card` below `.question-prompt`.
  - Translation text matches `q.promptTranslation` with `lang="id"`.
  - Every answer choice has a `.practice-option-translation` directly inside `.answer-content`.
  - Option translation text matches `o.translation` with `lang="id"`.
  - Option appearance retains original radio indicator, letter, alignment, and selection behavior.
  - Zero bullet points, dots, dashes, or extra prefixes added.

### Scenario 4: Toggle OFF Interaction (Clean Reversion)
- **Action**: Click `.practice-trans-btn` a second time.
- **Assertions**:
  - Button loses `is-active`, reverts to `aria-expanded="false"`, `aria-pressed="false"`.
  - `.practice-question-translation` is removed from the DOM.
  - All `.practice-option-translation` elements are removed from the DOM.
  - Question card and options return to exact original Japanese-only state.

### Scenario 5: Intra-Session Navigation Persistence
- **Action**: Turn translations ON on Question 1. Click "Next" (`exam-next`) to navigate to Question 2. Click "Previous" (`exam-prev`) to return to Question 1. Click Question Map to jump to Question 10.
- **Assertions**:
  - Translations remain visible immediately on Question 2, Question 1, and Question 10 without re-clicking toggle.
  - Button remains `is-active` on every question screen.

### Scenario 6: Option Shuffling Invariance
- **Action**: Start a Practice session with `setup.shuffleOptions: true`.
- **Assertions**:
  - Every option's displayed Indonesian translation strictly matches its Japanese text.
  - Shuffled option at position A displays Option A's translation, position B displays Option B's translation, etc.
  - Zero translation-to-option mismatch.

### Scenario 7: Session Exit & New Session Reset
- **Action**: With translations ON, click "Selesai" (`exam-finish`) or exit to Home. Start a new Practice session.
- **Assertions**:
  - New session starts with translations OFF by default (`practiceTranslationOpen === false`).
  - Globe button renders in inactive state.

### Scenario 8: Academic Integrity & Zero Leakage
- **Action**: Inspect text content of all rendered translation elements.
- **Assertions**:
  - No translation element contains the correct answer letter or explanation string.

### Scenario 9: Multi-Viewport & Touch Ergonomics
- **Action**: Test across Desktop (1440 × 900) and Mobile Portrait (390 × 844, 360 × 740).
- **Assertions**:
  - `.practice-trans-btn` bounding rect >= 40 × 40 px (touch target >= 44 × 44 px).
  - Zero button collision or overlap with adjacent `.study-list-quick-button` or `.furigana-quick-button`.
  - Zero horizontal page scrolling (`scrollWidth <= innerWidth`).

---

## 4. Test Execution Command

When implemented, the dedicated test script will be executed via:

```powershell
node tests/test-practice-mode-translations.mjs
```

Expected exit code: `0` (all scenarios passing).
