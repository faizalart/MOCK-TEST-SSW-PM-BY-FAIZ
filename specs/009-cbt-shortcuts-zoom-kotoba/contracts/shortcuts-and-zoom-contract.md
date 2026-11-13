# Interface & Behavioral Contract: Keyboard Shortcuts, Fill Screen Zoom & Practice Layout

**Feature**: `009-cbt-shortcuts-zoom-kotoba`  
**Date**: 2026-11-13 (Updated with Final Technical Review)

---

## 1. Keyboard Shortcuts Contract (`app.js`, `ZEN-APP-SHELL.css`)

### A. Key Normalization & Reservation
```javascript
const DEFAULT_EXAM_SHORTCUTS = {
  answer1: '1',
  answer2: '2',
  answer3: '3',
  answer4: '4',
  nextQuestion: 'ArrowRight',
  prevQuestion: 'ArrowLeft',
  toggleStudyList: 'R',
  toggleFlag: 'T',
  toggleFurigana: 'E',
  toggleGlobalTranslation: 'Y',
  toggleNumberList: 'H'
};
```
- **Input Normalization**:
  - Letters `/^[a-z]$/i` -> uppercase (`'r'` -> `'R'`).
  - Numpad/top-row digits: `e.code` matching `Digit([1-4])` or `Numpad([1-4])` resolves to `'1'`..`'4'` when `e.key` is a digit or numpad digit.
  - Reserved keys (strictly cannot be bound or reassigned): `'F'`, `'Escape'`, `'Tab'`, `'Enter'`, `' '`, `'Space'`, `'F1'`..`'F12'`, `'Shift'`, `'Control'`, `'Alt'`, `'Meta'`, `'CapsLock'`, or any event with `ctrlKey || metaKey || altKey`.
- **Conflict Validation**:
  - `assignExamShortcut(actionId, rawEvent)`:
    1. Reject reserved/modifier keys with an inline alert naming why.
    2. Check if normalized key is already bound to another `otherActionId !== actionId`. If so, refuse assignment and announce conflict naming the conflicting action's localized label.
    3. Otherwise persist immediately to `localStorage` (`sswPmExamShortcuts`) and re-render only the shortcut list inside `#exam-settings-popover` (without losing popover open state or scroll).

### B. Unified Exam Keydown Dispatch (`app.js`)
Consolidated into the single existing `document.addEventListener('keydown', ...)` handler with strict priority order:

1. **Modal & Top-Level `Escape` Handling (Top Priority)**:
   - If a shortcut capture control is active (`state.shortcutCaptureAction != null`): cancel capture mode immediately, restore focus/label, and call `e.preventDefault()`, `e.stopPropagation()`. Do **not** close the settings popover.
   - Else if `#exam-settings-popover` or `#zen-lang-dropdown` is open: close it as before and return.
   - Else if any blocking modal is open: close it or dismiss as before.
2. **Focused Answer Choice Selection (`Enter` / `Space`)**:
   - If `e.target` is `.answer-choice[data-action="answer"]` or inside one, and key is `'Enter'` or `' '` / `'Space'`: preserve existing behavior (`e.preventDefault()`, invoke `handleAction('answer', ...)`). Custom shortcuts CANNOT override this.
3. **Form & Contenteditable Element Guard**:
   - If `e.target.matches('input, textarea, select, [contenteditable="true"]')` OR `e.target.isContentEditable`: **ignore immediately** (return without handling any exam shortcut).
4. **Shortcut Remapping / Capture Isolation**:
   - If `state.shortcutCaptureAction != null` or focus is on the shortcut key-capture field/badge:
     - Intercept the keystroke immediately with `e.preventDefault()` and `e.stopPropagation()`.
     - Pass the event to `assignExamShortcut()` to record the remapped key.
     - **NEVER allow this keystroke to bubble or trigger global CBT actions** (e.g. typing `1` or `R` during remapping must NOT select an answer option or toggle the Study List in the exam).
5. **Modifiers & IME Composition Guard**:
   - Ignore if `e.isComposing || e.keyCode === 229 || e.repeat || e.ctrlKey || e.metaKey || e.altKey`.
6. **Page Context Check**:
   - Ignore if `state.page !== 'exam'`.
7. **Fullscreen / Fill Screen Reservation (`F` / `f`)**:
   - If key is `'f'` or `'F'`: call `e.preventDefault(); toggleFullScreen();` as before. Custom shortcuts CANNOT rebind or intercept `F`.
8. **Custom Exam Shortcut Lookup & Dispatch**:
   - Look up normalized key in `state.examShortcuts`:
     - `answer1`..`answer4`: check `q.options[idx]` exists; if yes, `e.preventDefault(); await setExamAnswer(idx);`. If `idx === 3` on a 3-option question, do nothing.
     - `nextQuestion`: if `s.currentIndex < s.questions.length - 1`, `e.preventDefault(); await moveExamTo(s.currentIndex + 1);`.
     - `prevQuestion`: if `s.currentIndex > 0`, `e.preventDefault(); await moveExamTo(s.currentIndex - 1);`.
     - `toggleStudyList`, `toggleFlag`, `toggleFurigana`, `toggleNumberList`: `e.preventDefault();` and invoke the exact same action as clicking the corresponding toolbar button.
     - `toggleGlobalTranslation`: active **only** when `isUntimedPractice` (`s.mode === 'practice' && !s.deadline && !s.timed`); otherwise no-op.

### C. Settings Popover UI (`renderExamSettingsPopover()`)
- Add a `"Keyboard Shortcuts"` section inside `.exam-settings-body`.
- Each of the 11 actions displays: Action Label + Key Badge button (e.g., `→` for `ArrowRight`, `←` for `ArrowLeft`).
- Clicking the Key Badge enters capture state (`"Press a key..."`, `Escape` cancels capture without closing popover if capturing).
- Live conflict/validation status element (`role="status"` / `aria-live="polite"`) announces errors or updates.
- Dedicated `"Reset Shortcuts"` button restores `DEFAULT_EXAM_SHORTCUTS` immediately without resetting font/furigana preferences.

---

## 2. Mobile Fullscreen & Fill Screen Zoom Contract (`app.js`, `QUESTION-EDITOR-UPDATES.css`)

### A. Mode Selection & Toggle (`toggleFullScreen()`)
- Define `shouldUseFillScreenFallback()`:
  - Returns `true` when `Fullscreen API` is unavailable (`!docEl.requestFullscreen && !docEl.webkitRequestFullscreen`), OR on mobile/coarse-pointer touch environments (`window.matchMedia('(pointer: coarse)').matches || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)`) where native fullscreen blocks browser pinch-to-zoom.
- Behavior of `toggleFullScreen()`:
  - **When `shouldUseFillScreenFallback()` is true**:
    - Toggle `state.examFillScreen` and `body.classList.toggle('is-fill-screen', active)`.
    - Do **not** call `requestFullscreen()` or `lockExamLandscape()`.
    - Ensure `body.exam-mode.is-fill-screen` expands `.exam-shell` to `100dvh` / `100%` visible viewport while strictly keeping `touch-action: pan-x pan-y pinch-zoom` on `.exam-shell` and `.exam-viewport`.
    - Fill Screen mode MUST NEVER apply `touch-action: none` or hijack browser gesture recognition. Native two-finger pinch-to-zoom and one-finger panning are preserved by the browser engine.
  - **When desktop / native-pinch-capable**:
    - Execute existing `reqFs` + `lockExamLandscape()` and toggle `body.is-fullscreen`.
- On exiting exam (`go()` to non-exam page or `finishExam()`), reset both `is-fill-screen` and native fullscreen cleanly.

### B. Viewport Sync & Non-Intrusive Multi-Touch Guard
- **`visualViewport.scale` Role Declaration**:
  - `visualViewport.scale` is strictly an **observer / read-only property**. It DOES NOT activate, enable, or control pinch zoom.
  - Pinch zoom is actuated entirely by the browser engine via `<meta name="viewport" content="... user-scalable=yes">` and CSS `touch-action: pinch-zoom`.
  - In `syncExamViewportHeight()`:
    - When `visualViewport && visualViewport.scale > 1.02`: return early without calling `window.scrollTo(0, 0)` and without overwriting `--exam-viewport-height`, preserving user zoom scale and pan frame without jumping.
    - When `visualViewport.scale <= 1.02`: restore `window.scrollTo(0, 0)` and sync `--exam-viewport-height` to eliminate residual window offsets.
- **Passive Multi-Touch Tracking (Zero `preventDefault()` on Gesture)**:
  - Track active pointer IDs on `.exam-shell` via `pointerdown`, `pointerup`, and `pointercancel` in `activeExamPointers = new Map()`, plus `touchstart` (`e.touches.length >= 2`).
  - **STRICT PROHIBITION**: NEVER call `e.preventDefault()` on `pointerdown`, `pointermove`, `pointerup`, `pointercancel`, `touchstart`, or `touchmove` during multi-touch sequences (`activeExamPointers.size >= 2` or `e.touches.length >= 2`). Calling `preventDefault()` cancels the browser's native pinch-to-zoom gesture in Blink and WebKit.
  - Touch/pointer tracking listeners must be non-cancelling / passive (`{ passive: true }`).
- **Pointer Lifecycle Management**:
  - On `pointerdown`: `activeExamPointers.set(e.pointerId, { x: e.clientX, y: e.clientY, time: Date.now() })`. If `activeExamPointers.size >= 2`, mark `wasMultiTouch = true`.
  - On `pointerup`: remove `e.pointerId`.
  - On `pointercancel`: remove `e.pointerId`. If pointers are cancelled by system gestures (e.g. OS back swipe, screenshot gesture, or browser zooming compositor lock), pointers are cleanly freed to prevent persistent lockouts.
- **Tap Resolution & Adaptive Cooldown Evaluation**:
  - The guard operates strictly at the **semantic action / click / tap / swipe resolution layer** (e.g. in `handleAction('answer')`, option selection end, translation/Kotoba toggles, toolbar buttons):
    1. **Synthetic Click Discarding**: If `wasMultiTouch === true`, any synthetic `click` / `pointerup` event generated by the browser upon lifting the pinch fingers is discarded without triggering an answer or button action.
    2. **Adaptive Cooldown Window**: When the last pinch finger lifts (`activeExamPointers.size === 0` and `wasMultiTouch === true`), set `multiTouchCooldownUntil = Date.now() + 150` (initial baseline of 150ms, tunable based on real physical device testing on Android Chrome, Samsung Internet, and iOS Safari purely to swallow delayed synthetic mouse/click events without blocking valid subsequent taps).
    3. **Clean Tap Guarantee**: A fresh, distinct `pointerdown` initiated when `activeExamPointers.size === 0` and `Date.now() >= multiTouchCooldownUntil` is immediately recognized as a clean single-touch sequence (`wasMultiTouch = false`). If the examinee deliberately taps an answer or button after zooming, their tap is processed immediately without artificial lag or accidental blockage.

---

## 3. Practice Answer Layout Contract (`ZEN-APP-SHELL.css`)

- **Strict Scoping**: All layout compactness changes MUST be scoped under `.practice-option-row` (and `.practice-prompt-row` if applicable). Base `.answer-choice` styles in `QUESTION-EDITOR-UPDATES.css` and `styles.css` MUST NOT be altered in a way that affects Full Mock Test or Timed Custom Exam.
- **Compact Alignment**:
  - Reduce horizontal padding inside `.practice-option-row .answer-choice` so `.answer-text` sits closer to the left edge of the answer card (`padding-left` reduced from `44px` to compact `12px–16px` when controls are compact/top-aligned or narrow non-overlapping edge strips, keeping `>= 44×44px` accessible hit targets for `.practice-ctrl-trans` and `.practice-ctrl-kotoba`).
  - Preserve `ONE EXISTING CARD = ONE VISUAL SURFACE`, `JP -> Translation -> Kotoba` vertical stacking, and Feature 008 `scrollSentenceIntoView()` compatibility.
  - Zero horizontal overflow at `360px`, `390px`, and `1440px`.

---

## 4. Practice Mode Answer-Key Reveal Contract (US4 — `app.js`, `ZEN-APP-SHELL.css`)

- **Strict Mode Isolation (Dual Guard)**:
  - Toolbar eye button (`data-action="toggle-practice-reveal-answer"`) and answer-key marker MUST render **only** when `isUntimedPractice === true` (`s.mode === 'practice' && !s.deadline && !s.timed`).
  - In `handleAction('toggle-practice-reveal-answer')`, guard with `if (!isUntimedPractice) break;` so the action is inert in timed modes.
  - Full Mock Test and Timed Custom Exam MUST NOT render the eye button, answer-key icon, or any `correctIndex` hint in the DOM.
- **Toolbar Placement**:
  - Rendered inside `.exam-bottom-tools` **immediately to the right of Globe (`.practice-trans-btn`) and immediately to the left of `F` (furigana toggle, `.furigana-quick-button`)**. The button labeled "F" on the toolbar is strictly the furigana quick toggle (distinct from the `F` keyboard shortcut used for fullscreen).
- **Minimalist Visual Design & Collision Avoidance**:
  - When `state.practiceRevealAnswer === true` and `Number.isInteger(q.correctIndex) && i === q.correctIndex`, render a 16 px inline Lucide `check` SVG inside `.answer-choice` at the right end of the row, vertically aligned with `.answer-text`.
  - On compact mobile viewports (360px and 390px), the `check` icon MUST have dedicated margin/spacing so it does NOT collide or overlap with `.practice-ctrl-kotoba` on the right edge strip, does not obscure `.answer-text`, and keeps 0px horizontal overflow.
  - Muted success green (`color`); **no** checkbox, square-check, circle-check, badge-check, background box/circle, text label ("Correct" / "Jawaban benar"), or cross icons on wrong options.
- **Logical & State Separation**:
  - `.answer-choice.selected` = user choice; `.practice-answer-key-check` = `q.correctIndex`.
  - Toggling eye ON/OFF MUST NOT mutate `s.answers`, completion count, score, or progress, and persists across question navigation within the Practice session (reset to `false` on session start/exit).

---

## 5. Stable Number List Scroll Contract (US5 — `app.js`)

- **Root-Cause Preservation**:
  - `renderExam()` replaces `view.innerHTML`, which recreates `<aside class="exam-question-map">`.
  - When `isUntimedPractice === true` and `s.id === lastExamMapSessionId`, `renderExam()` MUST capture `prevMap.scrollTop` before `view.innerHTML` replacement and restore `newMap.scrollTop = prevMapScrollTop` immediately afterward.
  - On new session initialization or switching to a different session/category (`s.id !== lastExamMapSessionId`), Number List scroll initializes at `0`.
  - Active question highlight (`.question-map-item.current`) continues updating on every navigation (`Next`, `Previous`, keyboard shortcuts, and `jump-question` clicks) without altering Full Mock Test or Timed Custom Exam.
