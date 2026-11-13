# Feature Specification: Practice Review Retry, Keyboard Enhancements & Android Fullscreen Fix

**Feature Branch**: `010-practice-review-retry-shortcuts-fullscreen`  
**Created**: 2026-11-13  
**Status**: Draft  
**Input**: User description: "Practice Review Retry, Keyboard Enhancements & Android Fullscreen Fix (US1 Retry Incorrect Questions, US2 Arrow Up/Down Page Scroll, US3 T and U Shortcuts, US4 Fix Android CBT Fullscreen Button, US5 Single-Letter Translation and Kotoba Shortcuts)"

---

## Executive Summary

Feature 010 introduces critical candidate workflow improvements and mobile defect resolutions to the SSW PM CBT simulator without altering existing question banks, scoring integrity, or Feature 008/009 capabilities:
1. **Targeted Review Practice (US1)**: Allows candidates to launch a dedicated, untimed practice CBT session containing solely questions answered incorrectly in a completed attempt, preserving the immutability of original exam records.
2. **Keyboard Question Scrolling (US2)**: Introduces dedicated `ArrowUp` and `ArrowDown` keys to scroll the primary question workspace vertically without interfering with horizontal question navigation.
3. **Ergonomic Action Shortcuts (US3)**: Adds `T` (Study List quick add/toggle) and `U` (Eye Reveal toggle in Practice Mode) to the customizable shortcut registry.
4. **Android Native Fullscreen Repair (US4)**: Fixes a critical defect where tapping the CBT Fullscreen button on Android failed to activate true fullscreen due to an overly aggressive mobile user-agent fallback guard that bypassed `requestFullscreen()`.
5. **Direct Single-Letter Practice Controls (US5)**: Implements 8 dedicated single-key shortcuts (`G`, `A`, `S`, `D` for Indonesian translations; `V`, `Z`, `X`, `C` for Kotoba vocabulary) operating on question stems and options 1–3 without modifier keys.

---

## Clarifications

### Session 2026-11-13
- Q: Should pressing the `T` shortcut toggle the question's Study List status (add if absent, remove if already present, matching the toolbar button), or should it strictly only add? → A: Option A — Two-way toggle (adds if absent, removes if already present, matching the existing Study List toolbar button behavior).
- Q: How should candidates be able to navigate back to the original full exam results from an active or completed incorrect-questions retry session? → A: Option C — Persistent top breadcrumb bar throughout both the retry CBT and retry results (e.g., `Sesi Ujian Utama › Latihan Ulang Jawaban Salah › [Kembali ke Hasil Utama]`) allowing immediate return to the parent attempt's results screen at any point.
- Q: In an incorrect-questions retry session, how should question numbers and original exam references be displayed in the question map and header? → A: Option A — Sequential numbering (1–N) for the retry question map and progress header, with a subtle origin reference badge (e.g., `Asal: Soal #N`) displayed on each active question card.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Retry Incorrect Questions Only (Priority: P1)

As a candidate reviewing my completed mock test results,  
I want to launch a focused Practice CBT session consisting only of the questions I got wrong,  
So that I can immediately reinforce weak areas and practice difficult questions without repeating questions I already answered correctly or skipped.

**Why this priority**: Directly solves candidate learning efficiency. Instead of manually searching through the 40-question review list or re-running an entire 40-question package, candidates can immediately isolate and master their mistakes.

**Independent Test**: Complete an exam with 3 wrong answers, 35 correct answers, and 2 unanswered questions. Open the Review section on the Results screen. Verify a single prominent button reads `"Ulangi Jawaban Salah (3)"`. Clicking it launches a new Untimed Practice CBT containing exactly those 3 questions with answers reset. Completing the retry session calculates score independently and leaves the original session's history intact.

**Acceptance Scenarios**:
1. **Given** a finished exam session with `W > 0` incorrect answers, **When** the candidate views the Review tab on the Results screen, **Then** an action button labeled `"Ulangi Jawaban Salah (W)"` is visible next to the review filters.
2. **Given** an exam where the user answered 5 questions incorrectly, answered 30 correctly, and skipped 5, **When** `"Ulangi Jawaban Salah (5)"` is activated, **Then** a new Untimed Practice session is initialized with exactly the 5 incorrect questions; correctly answered and unanswered questions are excluded.
3. **Given** an active retry session, **When** questions load, **Then** all previous answer selections are cleared, while original question prompt, option text, option images, question images, stable IDs, and answer keys are fully preserved.
4. **Given** a finished exam with zero incorrect answers (`W === 0`), **When** the candidate views the Review tab or attempts to trigger wrong-answer retry, **Then** the system displays a clear, friendly notification that there are no incorrect questions to repeat (`"Tidak ada jawaban salah untuk diulangi"`), and no empty session is created.
5. **Given** an active retry session, **When** the candidate answers questions, **Then** full Untimed Practice capabilities (Globe translation, selective sentence translations, Kotoba lists, Furigana toggle, Study List addition, and Eye Reveal) remain fully functional.
6. **Given** a completed retry session, **When** results are calculated, **Then** it generates an independent session record without modifying, overwriting, or recalculating the score, answers, or timestamp of the original attempt.
7. **Given** a completed retry session where the candidate still answered some questions incorrectly, **When** viewing the retry results, **Then** the candidate can trigger `"Ulangi Jawaban Salah"` again for the remaining mistakes.
8. **Given** options shuffled during the original attempt, **When** constructing the retry session, **Then** the mapping between shuffled option text, option IDs, and `correctIndex` remains strictly consistent.
9. **Given** an active or completed incorrect-questions retry session with a valid `originSessionId`, **When** displayed in CBT practice mode or the retry results screen, **Then** a persistent top breadcrumb navigation bar is rendered (e.g., `Sesi Ujian Utama › Latihan Ulang Jawaban Salah › [Kembali ke Hasil Utama]`), enabling the candidate to return immediately to the parent exam's results view at any time.
10. **Given** an active incorrect-questions retry session, **When** questions and the question map are rendered, **Then** the session uses contiguous sequential numbering 1 to N (`Soal 1 dari N`), and each question card displays a subtle origin badge indicating its original position in the parent exam (e.g., `Asal: Soal #N`).

---

### User Story 2 - Arrow Up / Arrow Down to Scroll the Question Page (Priority: P2)

As a desktop CBT candidate using keyboard navigation,  
I want to press the Up and Down arrow keys to scroll long question text, tables, and answer choices vertically,  
So that I can comfortably read long questions without reaching for the mouse or accidentally switching to another question.

**Why this priority**: Reading comfort on desktop viewports. Candidates currently have `ArrowLeft`/`ArrowRight` for question navigation, but must use the mouse wheel or trackpad to read questions with tall illustrations or extensive answer options.

**Independent Test**: Load a long illustrated question in CBT mode where `.exam-workspace` has vertical scroll overflow. Press `ArrowDown` multiple times or hold it down. Verify `.exam-workspace` smoothly scrolls down by consistent increments. Verify question index does NOT change. Press `ArrowUp` and verify it smoothly scrolls up. Verify `ArrowLeft` and `ArrowRight` still change questions.

**Acceptance Scenarios**:
1. **Given** an active CBT exam on a question with vertical overflow, **When** the candidate presses `ArrowDown`, **Then** the main question container (`.exam-workspace`) scrolls downward by a consistent increment (~80px).
2. **Given** an active CBT exam on a question scrolled down, **When** the candidate presses `ArrowUp`, **Then** the main question container (`.exam-workspace`) scrolls upward by a consistent increment.
3. **Given** the candidate presses and holds `ArrowDown` or `ArrowUp` (generating repeated `keydown` events with `e.repeat === true`), **Then** the scrolling responds continuously and smoothly without stuttering or locking up.
4. **Given** any press of `ArrowUp` or `ArrowDown`, **When** the key is handled, **Then** the candidate's current question index, answer selection, and question flag remain completely unchanged.
5. **Given** the candidate is typing inside a text input (e.g., in a settings modal, feedback input, or shortcut capture field), **When** `ArrowUp` or `ArrowDown` is pressed, **Then** the question page does not scroll and normal caret movement occurs.
6. **Given** `ArrowUp` and `ArrowDown` default bindings, **When** viewing the Keyboard Shortcuts settings panel, **Then** both actions are listed, customizable, and protected against key collisions.

---

### User Story 3 - T and U Keyboard Shortcuts (Priority: P2)

As a candidate practicing in CBT mode,  
I want keyboard shortcuts `T` (add question to Study List) and `U` (toggle Eye Reveal in Practice Mode),  
So that I can bookmark important questions and check correct answers instantly without clicking toolbar icons.

**Why this priority**: Completes the core ergonomics of practice navigation. `T` and `U` are standard mnemonic single-letter shortcuts located conveniently on the top letter row.

**Independent Test**: In Untimed Practice, press `T` on question 1; verify the toolbar Study button toggles to `✓`, question map updates with `in-study` marker, and the question is stored in `state.studyList` / IndexedDB. Press `U`; verify the Eye Reveal toggle turns ON and shows the minimalist checkmark on the correct option. Open a Full Mock test, press `U`, and verify nothing happens and no answer keys leak.

**Acceptance Scenarios**:
1. **Given** an active CBT exam in any mode, **When** the candidate presses `T`, **Then** the currently active question's inclusion in the Study List is toggled (added if absent, removed if already present), producing identical data mutations and visual feedback as clicking `.study-list-quick-button`.
2. **Given** an active exam in Untimed Practice Mode, **When** the candidate presses `U`, **Then** the Eye Reveal mode is toggled, showing or hiding the correct answer indicator on the correct option identically to clicking `.practice-reveal-btn`.
3. **Given** an active exam in Full Mock Test or Timed Custom Mode, **When** the candidate presses `U`, **Then** the event is safely ignored, no answer key is revealed in the DOM, and no console exceptions are thrown.
4. **Given** candidate focus is inside an input, textarea, select, or modal, **When** `T` or `U` is pressed, **Then** the shortcut does not trigger and normal typing occurs.
5. **Given** the Keyboard Shortcuts configuration panel, **When** inspected, **Then** `T` (`Tandai ke Study List`) and `U` (`Toggle Kunci Jawaban`) are displayed as defaults and can be remapped without conflict.

---

### User Story 4 - Fix Android CBT Fullscreen Button (Priority: P1)

As an Android mobile candidate taking a simulated exam,  
I want the Fullscreen button (`⛶`) to reliably hide browser chrome and maximize screen real estate when tapped,  
So that I have the authentic, uncluttered CBT interface on mobile without intrusive address bars or navigation bars.

**Why this priority**: High-impact bug resolution. Android users currently tap the button and perceive it as completely broken because the browser URL bar remains visible due to an erroneous user-agent check that bypassed native `requestFullscreen()`.

**Independent Test**: On a physical Android device running Chrome or Samsung Internet, tap the `⛶` button in the CBT header. Verify `document.documentElement.requestFullscreen()` resolves, the browser address bar collapses/hides, and the UI updates to `🗗`. Tap the button again; verify native fullscreen exits cleanly. Exit via Android system back gesture; verify `fullscreenchange` synchronizes UI state and resets button to `⛶`.

**Acceptance Scenarios**:
1. **Given** an Android device with a browser supporting the HTML5 Fullscreen API (e.g., Chrome for Android, Samsung Internet), **When** the candidate taps the fullscreen button (`data-action="toggle-fullscreen"`), **Then** `requestFullscreen()` is invoked directly within the transient user activation context and browser chrome disappears.
2. **Given** native Fullscreen is successfully activated on Android, **When** the browser enters fullscreen, **Then** `body.is-fullscreen` is added, the button icon changes to `🗗`, and `aria-pressed="true"` is set.
3. **Given** native Fullscreen is active, **When** the candidate taps the button again, **Then** `document.exitFullscreen()` is executed, returning the browser to normal view cleanly.
4. **Given** native Fullscreen is active, **When** the candidate exits fullscreen using Android system back gesture or edge swipe, **Then** the `fullscreenchange` event listener synchronizes state, clears `body.is-fullscreen`, and sets button icon to `⛶`.
5. **Given** a mobile browser environment where native Fullscreen API is genuinely unsupported or rejected (e.g., iOS Safari on iPhone, or Android WebViews with disabled fullscreen support), **When** the button is tapped, **Then** the system gracefully falls back to CSS Fill Screen (`body.is-fill-screen`) with `var(--exam-viewport-height)` synchronization, without throwing unhandled exceptions.
6. **Given** native Fullscreen activation on Android, **When** entering or exiting, **Then** the system does NOT force unnecessary landscape orientation locks that disorient portrait users.
7. **Given** the candidate leaves CBT (e.g., finishes exam or navigates back to Home/Results), **Then** any active fullscreen or fill-screen state is cleanly exited and reset, leaving zero stale classes on `<body>`.
8. **Given** pinch-to-zoom gestures during fullscreen, **When** user pinches to zoom, **Then** native multi-touch zoom operates smoothly and single-finger tap cooldown operates without blocking fullscreen toggle.

---

### User Story 5 - Single-Letter Shortcuts for Translation and Kotoba (Priority: P3)

As a candidate practicing Japanese vocabulary and reading comprehension in Practice Mode,  
I want single-letter keys `G`, `A`, `S`, `D` to toggle Indonesian translations, and `V`, `Z`, `X`, `C` to toggle Kotoba vocabulary breakdowns,  
So that I can rapidly inspect language assistance with single keystrokes without touching the mouse or using complex modifier combinations.

**Why this priority**: Substantially enhances study speed and keyboard ergonomics. Placing Translation on the home row (`A`, `S`, `D`, `G`) and Kotoba on the bottom row (`Z`, `X`, `C`, `V`) creates an intuitive tactile mapping.

**Independent Test**: In Untimed Practice Mode, press `G` to toggle the question prompt translation. Press `A` to toggle translation for Option 1; press `S` for Option 2; press `D` for Option 3. Press `V` to toggle question Kotoba list. Press `Z` for Option 1 Kotoba; press `X` for Option 2 Kotoba; press `C` for Option 3 Kotoba. Verify each operates independently without affecting answer selection or conflicting with other keys.

**Exact Default Key Mappings**:

| Shortcut Key | Action ID | Action Label | Target Component |
|:---:|:---|:---|:---|
| **G** | `toggleQuestionTrans` | Terjemahan Kalimat Soal | Question stem translation |
| **A** | `toggleOption1Trans` | Terjemahan Opsi 1 | Displayed Option 1 translation |
| **S** | `toggleOption2Trans` | Terjemahan Opsi 2 | Displayed Option 2 translation |
| **D** | `toggleOption3Trans` | Terjemahan Opsi 3 | Displayed Option 3 translation |
| **V** | `toggleQuestionKotoba` | Kosakata Soal | Question stem Kotoba list |
| **Z** | `toggleOption1Kotoba` | Kosakata Opsi 1 | Displayed Option 1 Kotoba list |
| **X** | `toggleOption2Kotoba` | Kosakata Opsi 2 | Displayed Option 2 Kotoba list |
| **C** | `toggleOption3Kotoba` | Kosakata Opsi 3 | Displayed Option 3 Kotoba list |

**Acceptance Scenarios**:
1. **Given** an exam in Untimed Practice Mode, **When** the candidate presses `G`, **Then** the Indonesian translation for the question stem toggles visibility, matching `.practice-ctrl-trans[data-target-type="prompt"]`.
2. **Given** an exam in Untimed Practice Mode, **When** the candidate presses `A`, `S`, or `D`, **Then** the translation for the currently displayed Option 1, 2, or 3 toggles visibility independently without altering radio selection.
3. **Given** an exam in Untimed Practice Mode, **When** the candidate presses `V`, **Then** the Kotoba vocabulary list for the question stem toggles visibility.
4. **Given** an exam in Untimed Practice Mode, **When** the candidate presses `Z`, `X`, or `C`, **Then** the Kotoba vocabulary list for the currently displayed Option 1, 2, or 3 toggles visibility independently.
5. **Given** options have been randomized by option shuffling, **When** `A`, `S`, `D`, `Z`, `X`, or `C` is pressed, **Then** it targets the option currently rendered in visual position 1, 2, or 3 (index 0, 1, or 2), never an outdated pre-shuffle index.
6. **Given** a question with only 2 options (e.g., true/false question), **When** `D` (Option 3 translation) or `C` (Option 3 Kotoba) is pressed, **Then** the application safely ignores the keystroke without errors.
7. **Given** an exam in Full Mock Test or Timed Custom Mode, **When** any of `G`, `A`, `S`, `D`, `V`, `Z`, `X`, `C` is pressed, **Then** the keystrokes are safely ignored and do not leak translations or vocabulary lists.
8. **Given** older shortcut configurations saved in `localStorage`, **When** the application loads, **Then** existing user-customized shortcuts are preserved and missing new action IDs are populated with these default keys without resetting user preferences.

---

### Edge Cases

- **Zero Incorrect Questions (US1)**: If a candidate achieves 100% score or skips/leaves blank all wrong answers, clicking `"Ulangi Jawaban Salah"` shows toast/message `"Tidak ada jawaban salah untuk diulangi"` and does not launch an empty CBT.
- **Cascading Retries (US1)**: If a candidate takes a retry session and gets 2 of the 5 questions wrong again, finishing the retry attempt allows clicking `"Ulangi Jawaban Salah (2)"` to launch another retry session recursively.
- **Scroll Limits (US2)**: If `.exam-workspace` is already at `scrollTop === 0`, `ArrowUp` stops at 0 without jitter or page jump. If at `scrollHeight - clientHeight`, `ArrowDown` stops at max scroll.
- **Option Count Parity (US5)**: Questions with 2 options ignore shortcuts for option 3 (`D`, `C`). Questions with 4 options can still use mouse click for option 4.
- **Android System Fullscreen Revocation (US4)**: If an incoming call, push notification, or system dialog temporarily interrupts native fullscreen on Android, `fullscreenchange` handles re-synchronizing the UI state gracefully.
- **Legacy Saved Shortcut Migration (US3/US5)**: If a candidate has a saved `localStorage` payload containing only 11 keys from Feature 009, schema migration must merge the 12 new actions (`scrollQuestionUp`, `scrollQuestionDown`, `toggleStudyList`, `toggleEyeReveal`, plus 8 Translation/Kotoba keys) without resetting previously customized keys.

---

## Root-Cause Analysis: Android Fullscreen Defect (US4)

An audit of the implementation in `app.js` and `QUESTION-EDITOR-UPDATES.css` revealed the following four root-cause factors explaining why the Fullscreen button currently fails on Android:

### 1. Premature User-Agent Fallback Bypassing Native API
In `app.js`:
```javascript
function shouldUseFillScreenFallback() {
  const docEl = document.documentElement;
  const hasNativeFs = Boolean(docEl && (docEl.requestFullscreen || docEl.webkitRequestFullscreen));
  if (!hasNativeFs) return true;
  const coarsePointer = Boolean(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
  const mobileUA = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');
  return coarsePointer || mobileUA; // <-- ROOT CAUSE: Always true on Android!
}
```
`shouldUseFillScreenFallback()` explicitly checks `/Android/i` and `coarsePointer`. Because modern Android devices match both, the function **unconditionally returns `true` on Android**.
As a direct consequence, `toggleFullScreen()` routes immediately into:
```javascript
if (shouldUseFillScreenFallback()) {
  state.examFillScreen = !state.examFillScreen;
  updateFullscreenUI();
  return;
}
```
**`requestFullscreen()` is never called on Android**, even though Android Chrome and Samsung Internet have full native Fullscreen API support.

### 2. CSS Fill Screen Does Not Hide Browser Chrome
When `state.examFillScreen` is toggled on Android, it applies `.is-fill-screen` which sets `position: fixed; inset: 0; height: var(--exam-viewport-height)`. Because the exam mode shell already occupied full screen width and hid the top navigation, applying `.is-fill-screen` produces **virtually zero visual change** in the browser. The browser URL bar, tabs, and system bars remain on screen. To the user, tapping the button appears to do nothing.

### 3. Aggressive Landscape Orientation Lock Failure
In `toggleFullScreen()`, native fullscreen attempts:
```javascript
await reqFs.call(docEl);
await lockExamLandscape();
```
`screen.orientation.lock('landscape')` on Android mobile devices requires user-permission or full native fullscreen to already be active. When invoked improperly or rejected by devices locked in portrait mode, unhandled rejections can abort subsequent viewport synchronization.

### 4. Desynchronization Between Fill Screen and Native Fullscreen State
`isFullscreenActive()` evaluates `Boolean(state.examFillScreen || document.fullscreenElement)`. If native fullscreen is toggled while `state.examFillScreen` was set, or if the user presses the Android back button, the boolean states desynchronize, causing subsequent taps to misjudge whether the browser is entering or exiting fullscreen.

---

## Requirements *(mandatory)*

### Functional Requirements

#### US1: Retry Incorrect Questions Only
- **FR-001**: System MUST provide an action button labeled `"Ulangi Jawaban Salah (N)"` on the Review section of the Results page, where `N` is the exact count of questions answered incorrectly (`s.answers[q.id] != null && s.answers[q.id] !== q.correctIndex`).
- **FR-002**: System MUST identify and collect only questions where an answer was submitted and that answer did not match the question's `correctIndex`.
- **FR-003**: System MUST exclude all correctly answered questions (`s.answers[q.id] === q.correctIndex`) and all unanswered/skipped questions (`s.answers[q.id] == null`).
- **FR-004**: System MUST launch a new Untimed Practice CBT session (`mode: 'practice'`, `timed: false`, `deadline: null`) containing clones of the incorrect questions.
- **FR-005**: System MUST initialize the retry session with empty answers (`answers: {}`), preserving original prompt text, options, option IDs (`originalId`), illustrations, and `correctIndex`.
- **FR-005a**: System MUST index questions sequentially from 1 to N in the retry question map and progress header, while rendering a subtle origin badge on the question card (e.g., `Asal: Soal #N`) indicating its original 1-based question index in the parent examination.
- **FR-006**: System MUST ensure the original finished exam session and its recorded answers, score, and history remain 100% immutable and intact.
- **FR-006a**: System MUST render a persistent top breadcrumb navigation bar across both the active retry CBT workspace and the retry results screen (e.g., `Sesi Ujian Utama › Latihan Ulang Jawaban Salah › [Kembali ke Hasil Utama]`), allowing candidates to return directly to the parent exam results at any point.
- **FR-007**: System MUST display an informative toast message (`"Tidak ada jawaban salah untuk diulangi"`) and abort session creation if `N === 0`.
- **FR-008**: System MUST support recursive retry: if the candidate completes a retry session and still has wrong answers, a subsequent retry session can be launched from those results.

#### US2: Arrow Up / Arrow Down Page Scrolling
- **FR-009**: System MUST listen for `ArrowUp` and `ArrowDown` in the active CBT examination interface and scroll the `.exam-workspace` container vertically.
- **FR-010**: System MUST NOT change question index (`currentIndex`), alter answer selection, or toggle flags when `ArrowUp` or `ArrowDown` is pressed.
- **FR-011**: System MUST support smooth continuous scrolling when `ArrowUp` or `ArrowDown` is held down (`e.repeat === true`).
- **FR-012**: System MUST bypass arrow key scrolling when focus is inside text inputs, textareas, dropdowns, or contenteditable areas.

#### US3: T and U Keyboard Shortcuts
- **FR-013**: System MUST bind `T` to toggle the active question's inclusion in the Study List (adding if absent, removing if already present), executing the exact same operation as clicking `.study-list-quick-button`.
- **FR-014**: System MUST bind `U` to toggle Eye Reveal in Untimed Practice Mode, executing the exact same operation as clicking `.practice-reveal-btn`.
- **FR-015**: System MUST strictly ignore `U` in Full Mock Test and Timed Custom Mode to prevent answer key disclosure.

#### US4: Android Fullscreen Repair
- **FR-016**: System MUST attempt native `element.requestFullscreen()` on Android browsers that expose the Fullscreen API when the fullscreen button is tapped.
- **FR-017**: System MUST maintain the `requestFullscreen()` call within the direct synchronous user gesture event execution chain to avoid browser security policy rejection.
- **FR-018**: System MUST listen to both `fullscreenchange` and `webkitfullscreenchange` to reliably synchronize UI state with actual browser presentation.
- **FR-019**: System MUST gracefully fall back to CSS Fill Screen (`body.is-fill-screen`) ONLY when native Fullscreen API is genuinely absent or explicitly rejected by browser permissions.
- **FR-020**: System MUST clean up and exit fullscreen/fill-screen states when leaving the CBT page (finishing exam, returning to home, or navigating away).

#### US5: Single-Letter Shortcuts for Translation and Kotoba
- **FR-021**: System MUST register 8 fixed single-letter shortcuts without modifier keys (`Ctrl`, `Shift`, `Alt`, `Meta`):
  - `G`: Toggle question-level Indonesian translation
  - `A`: Toggle Option 1 Indonesian translation
  - `S`: Toggle Option 2 Indonesian translation
  - `D`: Toggle Option 3 Indonesian translation
  - `V`: Toggle question-level Kotoba vocabulary
  - `Z`: Toggle Option 1 Kotoba vocabulary
  - `X`: Toggle Option 2 Kotoba vocabulary
  - `C`: Toggle Option 3 Kotoba vocabulary
- **FR-022**: System MUST map option shortcuts (`A`, `S`, `D`, `Z`, `X`, `C`) to the visually displayed options (index 0, 1, 2) respecting any active option shuffling.
- **FR-023**: System MUST safely ignore option shortcuts that target non-existent options on questions with fewer than 3 options.
- **FR-024**: System MUST seamlessly migrate older saved shortcut configurations in `localStorage`, retaining existing user customizations and adding new actions with their default keys.

---

### Key Entities *(include if feature involves data)*

- **Session (Exam / Practice)**:
  - `id`: Unique session string identifier (`uid('exam')`).
  - `mode`: Mode string (`'exam'` or `'practice'`).
  - `timed`: Boolean indicating whether a timer countdown is active.
  - `deadline`: Timestamp deadline or `null` for untimed practice.
  - `questions`: Array of question objects (when cloned into a retry session, each question retains an `originQuestionNumber` attribute referencing its 1-based question number in the parent session).
  - `answers`: Object mapping question ID to selected option index.
  - `originSessionId`: Optional reference string linking a retry session to its parent attempt, utilized to render the top breadcrumb link back to the parent attempt's results screen.
- **Shortcut Configuration Schema**:
  - `version`: Integer schema version (incremented from `1` to `2`).
  - `bindings`: Key-value map of action IDs to normalized key strings.
  - New actions: `scrollQuestionUp`, `scrollQuestionDown`, `toggleStudyList`, `togglePracticeReveal`, `toggleQuestionTrans`, `toggleOption1Trans`, `toggleOption2Trans`, `toggleOption3Trans`, `toggleQuestionKotoba`, `toggleOption1Kotoba`, `toggleOption2Kotoba`, `toggleOption3Kotoba`.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Candidates can launch a retry session of incorrect questions within 1 click from the Review screen in under 200 ms.
- **SC-002**: 100% of questions in a retry session were genuinely answered incorrectly in the parent session; zero correctly answered or skipped questions are included.
- **SC-003**: Original parent session score, answers, and timestamp remain 100% unchanged after completing a retry session.
- **SC-004**: On supported Android devices (Chrome / Samsung Internet), tapping the fullscreen button collapses browser chrome to 0px visible browser address bar in 100% of tested attempts.
- **SC-005**: Pressing `ArrowUp` or `ArrowDown` scrolls `.exam-workspace` by 80px per tap with 0 question index changes across 100 consecutive keypresses.
- **SC-006**: Pressing `T` and `U` executes within 50 ms and respects all mode restrictions with 0 answer-key leaks in Full Mock mode.
- **SC-007**: All 8 translation/Kotoba shortcuts (`G`, `A`, `S`, `D`, `V`, `Z`, `X`, `C`) toggle their target elements with 0 key conflicts and 0 interference with normal typing.
- **SC-008**: Existing user-customized shortcuts stored in `localStorage` under Schema v1 are 100% preserved without regression upon upgrade to Schema v2.

---

## Assumptions

- **A-001**: Browser security restrictions on iOS Safari on iPhone prevent arbitrary element fullscreen; iOS Safari will continue to use the CSS Fill Screen fallback as designed.
- **A-002**: Candidates using desktop or external keyboards may have different physical keyboard layouts (QWERTY, QWERTZ, AZERTY); single-letter keys are bound using standard `e.key.toLowerCase()` character normalization.
- **A-003**: The question workspace `.exam-workspace` is the primary vertical scroll container in the CBT layout.
- **A-004**: Physical device verification on Android Chrome and Samsung Internet will be performed and documented before final sign-off.
- **A-005**: All actions continue to follow the Zero-Dependency vanilla PWA architecture without external libraries or frameworks.
