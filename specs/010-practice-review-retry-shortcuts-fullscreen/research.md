# Research & Architectural Decisions: Practice Review Retry, Keyboard Enhancements & Android Fullscreen Fix

**Feature**: `010-practice-review-retry-shortcuts-fullscreen`  
**Date**: 2026-11-13  
**Status**: Completed  
**Spec Reference**: [spec.md](./spec.md)

---

## Executive Overview

This document resolves the technical decisions, patterns, and integration contracts required to implement the five user stories in Feature 010:
1. **US1**: Retry Incorrect Questions Only (`Ulangi Jawaban Salah (N)`).
2. **US2**: `ArrowUp` / `ArrowDown` vertical page scrolling in CBT mode.
3. **US3**: `T` (Study List toggle) and `U` (Eye Reveal toggle) shortcuts.
4. **US4**: Android native Fullscreen API repair and graceful fallback.
5. **US5**: 8 single-letter translation (`G`, `A`, `S`, `D`) and Kotoba (`V`, `Z`, `X`, `C`) shortcuts.

---

## Research Decision 1: Retry Session Architecture & Parent Immutability (US1)

### Context & Problem
Candidates completing an exam need to practice only questions they got wrong without redoing questions they got right or skipped. The retry session must launch in Untimed Practice mode (`timed: false`, `deadline: null`), clear previous answer selections, and leave the parent completed exam session 100% immutable in IndexedDB.

### Decision
- **Question Identification**: Filter parent session questions where `parentSession.answers[q.id] != null && parentSession.answers[q.id] !== q.correctIndex`. Unanswered questions (`answers[q.id] == null`) and correctly answered questions are excluded.
- **Deep Clone with Origin Provenance**: Each selected question is cloned via structured cloning/deep copy. The clone preserves `id`, `prompt`, `instructions`, `explanation`, `correctIndex`, `options` (preserving option IDs and translations), `questionImage`, `sourcePdf`, etc. Crucially, an `originQuestionNumber` integer (1-based index from the parent exam, e.g., `qIndex + 1`) is stamped onto each question object.
- **Session Identity**: Generate a fresh unique session ID via `uid('exam')` with:
  ```javascript
  {
    id: uid('exam'),
    mode: 'practice',
    timed: false,
    deadline: null,
    originSessionId: parentSession.id,
    originExamTitle: parentSession.title || parentSession.packageTitle || 'Ujian Utama',
    packageId: parentSession.packageId,
    packageTitle: parentSession.packageTitle,
    questions: retryQuestions,
    answers: {},
    flaggedQuestions: [],
    currentIndex: 0,
    startedAt: Date.now()
  }
  ```
- **Zero-Wrong Guard**: If the filtered count `N === 0`, display toast `"Tidak ada jawaban salah untuk diulangi"` and abort without creating a session.
- **Parent Immutability**: The parent session in `sessions` store remains untouched. When the retry session finishes, it records an independent session record referencing `originSessionId`.

### Alternatives Considered
1. *In-place Reset*: Modifying the parent session in-place and wiping answers. **Rejected**: Violates Constitution Principle I & II (destructive data modification, destroys exam score and attempt history).
2. *Ad-hoc Filter in Review*: Hiding correct questions dynamically inside the review tab rather than launching a practice session. **Rejected**: Does not satisfy requirement for an active interactive practice CBT session with instant feedback, furigana, and translation tools.

---

## Research Decision 2: Persistent Top Breadcrumb Navigation (US1)

### Context & Problem
Candidates in an active retry session or viewing retry results need a clear, continuous affordance to return to the parent exam results without having to navigate through the general Exam History screen.

### Decision
- **Breadcrumb Rendering**: When `activeExam().originSessionId` exists (during CBT practice) or when `state.resultSession.originSessionId` exists (on Results / Review screen), render a persistent top breadcrumb banner above the main workspace:
  ```html
  <nav class="exam-retry-breadcrumb" aria-label="Navigasi Sesi Ulang">
    <span class="breadcrumb-item">${esc(originTitle)}</span>
    <span class="breadcrumb-separator" aria-hidden="true">›</span>
    <span class="breadcrumb-item breadcrumb-current">Latihan Ulang Jawaban Salah</span>
    <button type="button" class="breadcrumb-return-btn" data-action="return-to-parent-results" data-parent-id="${esc(originSessionId)}">
      ‹ Kembali ke Hasil Utama
    </button>
  </nav>
  ```
- **Return Action Handler**: In `handleAction()` / event delegation:
  - If in active CBT: Persist current practice state to IndexedDB/memory (`await persistExam()`), clear active CBT mode classes, set `state.resultId = originSessionId`, `state.page = 'result'`, and call `render()`.
  - If on retry Results screen: Set `state.resultId = originSessionId`, `state.page = 'result'`, and call `render()`.
- **Question Numbering & Origin Badge**:
  - In the question map and progress header: Contiguous sequential numbers `1` to `N` (e.g. `Soal 1 dari 5`).
  - In the question card header: Render `<span class="badge badge-origin-question">Asal: Soal #${q.originQuestionNumber}</span>` when `q.originQuestionNumber` is defined.

### Alternatives Considered
1. *Footer Back Button Only*: Placing a return button only at the very bottom of the results page. **Rejected**: Hidden below long review lists; not visible during active CBT.
2. *Modal Confirmation on Every Keystroke*: **Rejected**: Adds unnecessary friction for an untimed practice session.

---

## Research Decision 3: ArrowUp / ArrowDown Vertical Question Scrolling (US2)

### Context & Problem
Candidates on desktop keyboards currently use `ArrowLeft` and `ArrowRight` to navigate between questions. Tall illustrated questions, image tables, and extensive answer options require vertical scrolling. Candidates need `ArrowUp` and `ArrowDown` to scroll `.exam-workspace` without changing question index or interfering with typing in input fields.

### Decision
- **Event Interception in `handleKeyDown()`**:
  - Identify target container: `const workspace = document.querySelector('.exam-workspace')`.
  - Guard conditions:
    1. If `isInputFocused(e.target)`: bypass completely (allow standard text caret movement).
    2. If modal/dialog open: bypass completely.
    3. If active exam is not rendering: bypass.
  - Action execution:
    ```javascript
    const SCROLL_STEP = 80; // px per tick
    if (action === 'scrollQuestionDown') {
      e.preventDefault();
      workspace.scrollBy({ top: SCROLL_STEP, behavior: 'instant' });
    } else if (action === 'scrollQuestionUp') {
      e.preventDefault();
      workspace.scrollBy({ top: -SCROLL_STEP, behavior: 'instant' });
    }
    ```
  - Use `behavior: 'instant'` (or programmatic `scrollTop += step`) rather than `'smooth'` because OS key-repeat (`e.repeat === true`) provides natural 60fps fluidity without accumulating lagging scroll animation queues.

### Alternatives Considered
1. *`behavior: 'smooth'`*: **Rejected**: Rapid key repeats create animation queue lag where scrolling continues for seconds after the key is released.
2. *Scrolling `window`*: **Rejected**: The CBT layout uses fixed-height viewport shells where `.exam-workspace` is the overflow-y scroll container, not `window`.

---

## Research Decision 4: Shortcut Registry Schema v2 & Single-Letter Dispatch (US3 & US5)

### Context & Problem
Feature 009 introduced Schema v1 with 11 action bindings. Feature 010 introduces 12 new actions:
- US2: `scrollQuestionUp` (`ArrowUp`), `scrollQuestionDown` (`ArrowDown`).
- US3: `toggleStudyList` (`T`), `togglePracticeReveal` (`U`).
- US5:
  - Translation: `toggleQuestionTrans` (`G`), `toggleOption1Trans` (`A`), `toggleOption2Trans` (`S`), `toggleOption3Trans` (`D`).
  - Kotoba: `toggleQuestionKotoba` (`V`), `toggleOption1Kotoba` (`Z`), `toggleOption2Kotoba` (`X`), `toggleOption3Kotoba` (`C`).

### Decision
- **Schema Migration**: Increment schema version from `1` to `2`.
  ```javascript
  const DEFAULT_SHORTCUTS_V2 = {
    ...DEFAULT_SHORTCUTS_V1,
    scrollQuestionUp: 'ArrowUp',
    scrollQuestionDown: 'ArrowDown',
    toggleStudyList: 't',
    togglePracticeReveal: 'u',
    toggleQuestionTrans: 'g',
    toggleOption1Trans: 'a',
    toggleOption2Trans: 's',
    toggleOption3Trans: 'd',
    toggleQuestionKotoba: 'v',
    toggleOption1Kotoba: 'z',
    toggleOption2Kotoba: 'x',
    toggleOption3Kotoba: 'c'
  };
  ```
  On load: If stored version is `< 2`, perform shallow merge: keep all existing user-configured keys, fill missing keys from `DEFAULT_SHORTCUTS_V2`, and update version to `2`.
- **Target Resolution with Option Shuffling**:
  - For option actions (`A`, `S`, `D`, `Z`, `X`, `C`):
    Target visual option index: `A`/`Z` = index 0; `S`/`X` = index 1; `D`/`C` = index 2.
    Retrieve displayed option:
    ```javascript
    const displayedOptions = getExamDisplayedOptions(s, q);
    const targetOpt = displayedOptions[targetIndex];
    if (!targetOpt) return; // Safely ignore if question has fewer options
    ```
  - Call existing helpers:
    - Translation: `toggleSelectiveTranslation(s, q.id, targetOpt ? targetOpt.key : null)`
    - Kotoba: `toggleSelectiveKotoba(s, q.id, targetOpt ? targetOpt.key : null)`
- **Practice Mode Isolation**: Actions `U`, `G`, `A`, `S`, `D`, `V`, `Z`, `X`, `C` check `if (s.mode !== 'practice') return;` to guarantee 0 data/key leaks in Full Mock test mode.
- **Study List Two-Way Toggle**:
  `toggleStudyList` calls `toggleStudyItem(q)` directly, producing identical feedback and data changes as clicking `.study-list-quick-button`.

### Alternatives Considered
1. *Modifier Keys (e.g. `Alt+A`, `Ctrl+Z`)*: **Rejected**: User explicitly requested single-letter keys for speed, and `Ctrl+Z` would conflict with browser undo.
2. *Hardcoded Key Checks*: **Rejected**: User must be able to view and remap keys inside the existing shortcuts customization modal.

---

## Research Decision 5: Android Native Fullscreen Repair & Viewport Parity (US4)

### Context & Problem
Tapping the CBT Fullscreen button (`⛶`) on Android Chrome and Samsung Internet currently fails to activate native fullscreen because `shouldUseFillScreenFallback()` contains an overly aggressive user-agent regex (`/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)`) that unconditionally diverts Android devices to `.is-fill-screen`. CSS fill-screen does not collapse the browser address bar, leaving the user with the impression that the button is broken.

### Decision
- **Remove Android UA Check from Fallback**:
  Update `shouldUseFillScreenFallback()`:
  ```javascript
  function shouldUseFillScreenFallback() {
    const docEl = document.documentElement;
    const hasNativeFs = Boolean(
      docEl && (docEl.requestFullscreen || docEl.webkitRequestFullscreen)
    );
    // If browser completely lacks native Fullscreen API, use fallback
    if (!hasNativeFs) return true;
    
    // Specifically guard iOS Safari / WebViews where requestFullscreen is known to fail/throw
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent || '');
    if (isIOS) return true;
    
    // Android Chrome and modern Android browsers support requestFullscreen natively
    return false;
  }
  ```
- **Robust Invocation in User Activation**:
  ```javascript
  async function toggleFullScreen() {
    if (shouldUseFillScreenFallback()) {
      state.examFillScreen = !state.examFillScreen;
      updateFullscreenUI();
      return;
    }
    
    const docEl = document.documentElement;
    const reqFs = docEl.requestFullscreen || docEl.webkitRequestFullscreen;
    const exitFs = document.exitFullscreen || document.webkitExitFullscreen;
    const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
    
    try {
      if (!fsEl) {
        if (reqFs) await reqFs.call(docEl);
      } else {
        if (exitFs) await exitFs.call(document);
      }
    } catch (err) {
      console.warn('[Fullscreen] Native request rejected, falling back to CSS fill-screen:', err);
      state.examFillScreen = !state.examFillScreen;
    } finally {
      updateFullscreenUI();
    }
  }
  ```
- **Orientation Lock Policy**: Do not invoke `screen.orientation.lock('landscape')` automatically on mobile phones unless explicitly in landscape mode; respect portrait orientation so portrait users are not disoriented.
- **State Synchronization on Gesture Exit**:
  Listen to both `fullscreenchange` and `webkitfullscreenchange` to ensure `updateFullscreenUI()` resets `.is-fullscreen` and the `⛶` button icon when the candidate swipes to exit via Android system gestures.
- **Teardown on CBT Exit**: In `finishExam()` and navigation handlers, ensure `if (document.fullscreenElement) document.exitFullscreen().catch(() => {});` and `document.body.classList.remove('is-fullscreen', 'is-fill-screen')`.

### Alternatives Considered
1. *Relying only on CSS Fill Screen on Android*: **Rejected**: Direct root cause of the bug; does not collapse URL bar.
2. *Third-party Screenfull.js library*: **Rejected**: Violates Constitution Principle VI (Zero-Dependency PWA).

---

## Summary of Architectural Invariants

| Invariant | Implementation Mechanism | Validation Method |
|---|---|---|
| **Parent Immutability** | Cloned questions + distinct session record (`originSessionId`) | Assert parent session timestamp, answers, score unchanged |
| **Zero Mock Leaks** | Practice shortcuts guarded with `if (s.mode !== 'practice') return;` | Headless test pressing `U`, `G`, `A`, `S`, `D`, `V`, `Z`, `X`, `C` in Mock mode |
| **Native Android Fullscreen** | Direct `requestFullscreen()` with graceful CSS fallback | Chrome DevTools Protocol & device audit |
| **Instant Smooth Scrolling** | `scrollBy({ top: ±80, behavior: 'instant' })` on `.exam-workspace` | Continuous hold test (`e.repeat === true`) |
| **Shortcut Remap Parity** | Schema v2 registered in modal with collision protection | Test remapping and reset shortcuts |
