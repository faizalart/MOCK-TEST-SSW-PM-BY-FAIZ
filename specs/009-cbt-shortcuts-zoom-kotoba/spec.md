# Feature Specification: CBT Keyboard Shortcuts, Fullscreen Pinch Zoom & Kotoba Redesign

**Feature Branch**: `[009-cbt-shortcuts-zoom-kotoba]` (branch not yet created; current branch is `feat/practice-selective-translation-kotoba`)

**Feature Directory**: `specs/009-cbt-shortcuts-zoom-kotoba/`

**Created**: 2026-11-13

**Status**: Draft (clarifications resolved 2026-11-13)

**Input**: User description: "CBT Keyboard Shortcuts, Fullscreen Pinch Zoom & Kotoba Redesign — customizable keyboard shortcuts in the exam settings popover, working pinch-to-zoom during mobile fullscreen CBT, a more compact Practice answer layout, and a complete-but-concise redesign of Kotoba extraction, mapping, and display."

**Constitution**: `.specify/memory/constitution.md` v1.1.0. This feature touches Zone A (CBT engine, `renderExam()`, exam settings popover) and therefore falls under **Tier 4** quality gates. US3-B/C also falls under **Tier 2** data gates.

**Builds on**: Feature 008 (`specs/008-practice-selective-translation-kotoba/`). Feature 008 artifacts are read-only context for this spec and MUST NOT be modified.

---

## Audit Baseline (facts observed before writing this spec)

These facts were measured in the repository on 2026-11-13 and define the starting point the requirements below are written against.

**Keyboard handling**
- Two document-level `keydown` listeners already exist in `app.js`: one handles Enter/Space on a focused answer choice plus `F` for fullscreen during the exam; a second handles `Escape` to close the exam settings popover and language menu.
- The existing handler already skips events with Ctrl/Meta/Alt, auto-repeat, and events whose target is an input, textarea, select, or contenteditable element.
- `F` is already bound to fullscreen. None of the requested defaults use `F`.

**Viewport and fullscreen**
- `index.html` viewport meta allows user scaling (`minimum-scale=0.5, maximum-scale=5.0, user-scalable=yes`).
- `body.exam-mode` and `.exam-shell` are `position: fixed`, `overflow: hidden`, and declare `touch-action: pan-x pan-y pinch-zoom`.
- Fullscreen is requested on the document root element, and on supported devices the screen orientation is locked to landscape.
- `syncExamViewportHeight()` deliberately skips resizing while the visual viewport scale differs from 1, and otherwise forces the window scroll position back to 0,0 in exam mode.
- The global swipe-tab navigation exempts the exam page and only reacts to single-finger touches.

**Question banks**
- 1,006 unique questions and 3,110 unique options across the canonical bundles (as reconciled by Feature 008).
- All bundles use 3 options per question **except** `ssw-pm-special-lab-bundle.json`, whose 92 questions have **4 options**.
- `ssw-pm-tipe2-nguyen1.json` (40 questions) contains no `<ruby>` annotations; readings for its vocabulary cannot be taken from the source text.

**Kotoba data (Feature 008 output)**
- `data/sharedKotobaDictionary.json`: 1,809 terms (1,765 verified, 44 unresolved morpheme fragments).
- Verified meanings are long: median 57 characters, 90th percentile 73, maximum 145; 1,509 of 1,765 verified meanings exceed 40 characters, and many include usage commentary (for example `目` → "Mata / indra penglihatan (organ tubuh yang wajib dilindungi kacamata pelindung …)").
- 469 verified entries are a single kanji. Several are fragments of longer words rather than standalone vocabulary. Example: `kunci1-q001` maps to `安全, 食品, 一, 作, 正, 選, 売`, where `作`, `正`, `選`, `売` appear as isolated characters instead of the words they belong to in the sentence.
- Zero particle entries exist (`に`, `を`, `で`, etc.), and grammatical forms such as `選びなさい` are not represented as units.
- Feature 008 integrity tests pass, but they check referential integrity, not whether the vocabulary in each sentence is actually covered.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Customizable Keyboard Shortcuts (Priority: P1)

An examinee using a laptop or tablet with a keyboard wants to move through the CBT without reaching for the mouse. They press `1`, `2`, `3`, or `4` to pick an answer, use the arrow keys to move between questions, and use single letters to flag a question, add it to the Study List, toggle furigana, toggle the global translation, or hide the number list. If a key feels awkward, they open the gear (exam settings) popover in the middle of the session, reassign it, and the change works immediately and is still there the next time they open the app.

Default bindings (must be preserved exactly):

| Key | Action |
|---|---|
| `1` | Select answer option 1 |
| `2` | Select answer option 2 |
| `3` | Select answer option 3 |
| `4` | Select answer option 4 (active only on questions that have a 4th option, e.g. Special Lab) |
| `ArrowRight` | Go to the next question |
| `ArrowLeft` | Go to the previous question |
| `R` | Add to / remove from Study List |
| `T` | Flag / unflag the current question |
| `E` | Toggle furigana |
| `Y` | Toggle global translation (Globe) |
| `H` | Hide / show the number list |

**Why this priority**: It affects every exam mode and every question, and it removes the most repeated physical effort in a 40-question session. It is also self-contained: it does not depend on data work.

**Independent Test**: Start any exam mode on a desktop browser, complete a question using only the keyboard (answer, flag, add to Study List, navigate), remap one key in the gear popover during the session, verify the new key works and the old one no longer does, reload the page, and verify the mapping persists.

**Acceptance Scenarios**:

1. **Given** an active CBT session with default bindings and focus not in a text field, **When** the examinee presses `2`, **Then** option 2 becomes the selected answer exactly as if it had been clicked, and the answer state, progress rail, and question map update.
2. **Given** an active session on question 5 of 40, **When** the examinee presses `ArrowRight`, **Then** question 6 is shown; **When** they press `ArrowLeft`, **Then** question 5 is shown again.
3. **Given** the last question is shown, **When** the examinee presses `ArrowRight`, **Then** nothing happens (the session is not submitted and no finish dialog opens); **Given** the first question, **When** `ArrowLeft` is pressed, **Then** nothing happens.
4. **Given** an active session, **When** the examinee presses `R`, `T`, `E`, `Y`, or `H`, **Then** the same result occurs as pressing the matching toolbar button (Study List `+`, flag `⚑`, `F` furigana, Globe, number-list toggle), including the button's visual pressed state.
5. **Given** a Full Mock Test or Timed Custom Exam (where the Globe is not available), **When** the examinee presses the translation key, **Then** nothing happens and no translation is revealed.
6. **Given** the gear popover is open, **When** the examinee assigns `Q` to "Flag" and closes the popover without reloading, **Then** `Q` flags the question and `T` no longer does.
7. **Given** the examinee tries to assign a key already used by another action, **When** they confirm, **Then** the assignment is refused, a clear message names the action already using that key, and both existing bindings stay unchanged.
8. **Given** a customized mapping, **When** the examinee uses "Reset to default", **Then** all bindings return to the default table above and this is reflected immediately in the popover and in behavior.
9. **Given** a customized mapping, **When** the page is reloaded or the browser is closed and reopened (offline included), **Then** the customized mapping is still active.
10. **Given** focus is inside any text input, textarea, select, contenteditable region, or the key-capture field of the shortcut editor, **When** the examinee types a bound key, **Then** no shortcut action fires.
11. **Given** the examinee holds Ctrl, Cmd, or Alt with a bound key (for example Ctrl+R or Ctrl+T), **When** the key is pressed, **Then** the app does not intercept it and the browser's own behavior is unaffected.
12. **Given** a scrollable question, **When** the examinee presses ArrowUp, ArrowDown, PageUp, PageDown, or Space outside an answer choice, **Then** default scrolling still works (these keys are not bound by default).
13. **Given** a Special Lab question with 4 options, **When** the examinee presses `4`, **Then** option 4 is selected; **Given** a 3-option question, **When** `4` is pressed, **Then** nothing happens.

---

### User Story 2 - Pinch-to-Zoom During Mobile Fullscreen CBT (Priority: P2)

An examinee on a phone switches the CBT to fullscreen to get more room. They come across a small diagram or dense kanji and pinch with two fingers to enlarge it, exactly as they could before entering fullscreen. After reading, they pinch back out and continue tapping answers and scrolling with one finger as usual.

**Why this priority**: It is an accessibility regression that blocks reading on small screens, but it only affects mobile fullscreen users, so it ranks below a capability used in every mode on every device.

**Independent Test**: On a real Android Chrome device and a real iOS Safari device, enter CBT fullscreen, pinch to zoom in and out, then tap an answer and scroll the workspace; confirm each works and the page does not shift sideways after zoom returns to normal.

**Acceptance Scenarios**:

1. **Given** CBT is in fullscreen on a supported mobile browser, **When** the examinee performs a two-finger pinch-out, **Then** the CBT content enlarges; **When** they pinch in, **Then** it shrinks back toward the normal size.
2. **Given** the content is zoomed in, **When** the examinee drags with one finger, **Then** they can pan to see the enlarged content, and when not zoomed, one-finger drag scrolls the question workspace as before.
3. **Given** fullscreen CBT at any zoom level, **When** the examinee taps an answer choice, a selective translation/Kotoba zone, or a toolbar button, **Then** the tap performs exactly one action and a pinch gesture never registers as an answer selection.
4. **Given** the examinee has zoomed in and then returned to normal scale, **When** they look at the layout, **Then** there is no horizontal overflow, no leftover offset, and the header, workspace, and bottom toolbar are where they were before zooming.
5. **Given** CBT is not in fullscreen, or the examinee is on any non-CBT page, **When** they pinch, **Then** zoom behaves exactly as it does today (no regression).
6. **Given** a mobile browser that blocks pinch zoom inside native fullscreen, **When** the examinee chooses to expand the CBT, **Then** the app uses a non-native "Fill Screen" mode (CBT fills the viewport and hides app chrome, without the browser's native fullscreen) in which two-finger pinch zoom works, and the app does not label native fullscreen as zoom-capable on that browser.
7. **Given** a browser where native fullscreen and pinch zoom both work, **When** the examinee uses the fullscreen control, **Then** native fullscreen behaves as it does today (including the existing landscape lock where supported).
8. **Given** Fill Screen mode is active, **When** the examinee exits it (the same toolbar control, Back gesture, or leaving the exam), **Then** the normal CBT layout returns with no leftover scale, offset, or hidden toolbar.

---

### User Story 3 - Practice Layout Refinement & Complete Kotoba Redesign (Priority: P3)

An examinee studying in Untimed Practice Mode sees answer options with text that starts close to the left edge of the card and wastes no horizontal space. When they open Kotoba for a sentence, they get a short vocabulary list that covers every meaningful word in that sentence, keeps compound words whole, includes particles and grammatical forms, and gives one to three short Indonesian equivalents per word, with correct furigana for the whole word.

Target display format (example for an HACCP question):

| Kotoba | Arti |
|---|---|
| HACCP | HACCP (Analisis Bahaya dan Titik Kendali Kritis) |
| に | Partikel: pada, terhadap |
| 沿った | Sesuai, mengikuti (bentuk dasar 沿う) |
| 衛生 | Higiene, kebersihan, sanitasi |
| 管理 | Pengelolaan, pengendalian, manajemen |
| 重要 | Penting |
| 点 | Titik |
| 重要管理点 | Titik Kendali Kritis (Critical Control Point) |
| CCP | Critical Control Point (Titik Kendali Kritis) |
| を | Partikel penanda objek |
| 行う | Melakukan, melaksanakan |
| 上で | Dalam pelaksanaan, dalam melakukan |
| で | Partikel penanda tempat, cara, atau situasi |
| 間違っている | Salah, keliru (bentuk dasar 間違う) |
| 間違う | Salah, keliru |
| もの | Hal, sesuatu, pernyataan |
| 一つ | Satu |
| 選びなさい | Pilihlah (bentuk dasar 選ぶ) |
| 選ぶ | Memilih |

**Why this priority**: It has the largest data effort and depends on careful review, while the existing Kotoba feature already works in a reduced form. It delivers learning value but is not a blocker for taking an exam.

**Independent Test**: Pick a sample of questions from every package, open Kotoba for the prompt and each option, and compare each list against the sentence: every meaningful word is present, compounds are whole, meanings are short and correct, furigana covers the full word. Separately, compare Practice answer layout screenshots before and after on desktop and mobile, and confirm Full Mock Test screenshots are unchanged.

**Acceptance Scenarios**:

*A. Practice answer layout*

1. **Given** Untimed Practice Mode on desktop (1440 px) and mobile (390 px), **When** a question is shown, **Then** the Japanese option text starts visibly closer to the left edge of the answer card than in Feature 008, with no wide empty band before the text.
2. **Given** the refined layout, **When** the examinee taps the option text area, **Then** the answer is selected; **When** they use the translation or Kotoba control, **Then** only that control's content toggles and the answer selection does not change.
3. **Given** Full Mock Test or Timed Custom Exam, **When** a question is shown, **Then** the answer cards look identical to the current release (pixel comparison at 1440 px and 390 px).
4. **Given** mobile at 360 px and 390 px width, **When** Practice Mode is shown, **Then** translation and Kotoba controls still provide a touch area of at least 44×44 px and nothing overflows horizontally.

*B. Kotoba content*

5. **Given** the prompt of an HACCP-style question, **When** Kotoba is opened, **Then** the list includes the technical terms (HACCP, CCP, 重要管理点), the components that are useful vocabulary on their own (重要, 管理, 点), the particles that appear (に, を, で), and the inflected forms as they appear together with their dictionary form where helpful (沿った / 沿う, 選びなさい / 選ぶ).
6. **Given** any sentence containing a multi-kanji word, **When** Kotoba is opened, **Then** that word appears as a whole unit (for example `作業`, not only `作`), and a single kanji appears on its own only if it is used as a standalone word in that sentence.
7. **Given** any Kotoba entry, **When** it is displayed, **Then** its Indonesian meaning is 1–3 short equivalents or a short phrase with no explanatory paragraph or full-sentence translation.
8. **Given** a compound word with furigana, **When** furigana is shown, **Then** the reading spans the whole word (for example `重要管理点` → じゅうようかんりてん), and toggling toolbar `F`/`E` shows and hides it exactly as in Feature 008.
9. **Given** shuffled option order, **When** Kotoba is opened for an option, **Then** the list belongs to that option's own text, as in Feature 008.
10. **Given** a question from `ssw-pm-tipe2-nguyen1.json` (no ruby in source), **When** Kotoba is opened, **Then** entries still show correct readings, sourced and marked by provenance rather than invented.

*C. Data quality and reconciliation*

11. **Given** the package-by-package rollout, **When** a question package's data is replaced, **Then** its coverage audit reports zero uncovered meaningful spans across all prompts and options in that package before replacement; packages awaiting rollout continue serving Feature 008 data without interruption, until all canonical bundles achieve 100% question-and-option coverage.
12. **Given** any Kotoba entry, **When** its provenance is inspected, **Then** it lists the source question/option IDs and source file where it occurs, the lemma/reading source, and the meaning source.
13. **Given** reconciliation is in progress, **When** a replacement entry has not yet passed validation, **Then** the Feature 008 entry it would replace remains available and in use; nothing is deleted before its replacement is validated.

---

### User Story 4 - Reveal Correct Answer in Practice Mode (Priority: P2)

An examinee studying in Untimed Practice Mode wants to verify the answer key for the current question without leaving the CBT screen or submitting the session. They tap or click a minimalist eye (`eye`) toggle button in the bottom toolbar, located immediately to the right of the Globe button and immediately to the left of the `F` (furigana) button. When turned ON, a subtle, minimalist check mark appears on the right end of the correct option row and stays active as they move to subsequent questions until they turn it OFF again.

**Why this priority**: Practice Mode is used for active study and memorization; letting learners peek at the answer key inline while keeping Full Mock Test and Timed Custom Exam strictly isolated significantly accelerates study speed without needing a separate review screen.

**Independent Test**: Open Untimed Practice Mode, verify the eye button is positioned between Globe and `F` and starts OFF with no check marks on options, toggle it ON to confirm a single minimalist Lucide `check` icon appears only on the correct option, select a wrong answer to confirm both states remain visually distinct, navigate to the next question to confirm the toggle persists, toggle it OFF to confirm the mark disappears, and verify the eye button and answer-key markup are completely absent in Full Mock Test and Timed Custom Exam.

**Acceptance Scenarios**:

1. **Given** Untimed Practice Mode with the eye toggle OFF, **When** a question is displayed, **Then** no check icon or answer-key marker appears on any option.
2. **Given** Untimed Practice Mode, **When** the examinee clicks the eye button (placed immediately to the right of Globe and immediately to the left of `F`), **Then** the eye toggle becomes active and a minimalist Lucide `check` icon (~16 px, muted success green, with no surrounding box, circle, badge, or text label) appears at the right end of the correct option row vertically aligned with the option text; wrong options show no cross or extra marker.
3. **Given** the eye toggle is ON and the examinee selects an incorrect answer, **Then** the chosen wrong option retains its existing user-selection styling while the Lucide `check` icon continues marking the true answer key separately, without altering the user's answer, completion state, score, or progress.
4. **Given** the eye toggle is ON and the examinee selects the correct answer, **Then** both the user-selection styling and the answer-key `check` icon remain distinguishable without visual clutter.
5. **Given** the eye toggle is ON, **When** the examinee navigates to the next or previous question, **Then** the eye toggle remains ON and the correct option on the new question displays the `check` icon; **When** toggled OFF, the `check` icon disappears immediately.
6. **Given** a Full Mock Test or Timed Custom Exam session, **Then** the eye button MUST NOT be rendered, cannot be activated, and zero answer-key indicators or `correctIndex` hints are exposed in the CBT UI.

---

### User Story 5 - Stable Number List Scroll Position (Priority: P2)

An examinee in Untimed Practice Mode scrolls down the vertical Number List (e.g., to question 25 or 35 in a 40-question or larger session) and clicks through questions using Next, Previous, keyboard shortcuts, or clicking numbers in the list. The Number List keeps its exact scroll position instead of jumping back to the top, while still updating the active highlight on the current question number.

**Why this priority**: In longer practice sessions, the Number List jumping back to question 1 on every Next/Previous click forces repeated manual scrolling and disrupts orientation during study.

**Independent Test**: Start an Untimed Practice session with enough questions to make the Number List scrollable, scroll the Number List to the middle or bottom, navigate using Next, Previous, keyboard shortcuts (`ArrowRight`/`ArrowLeft`), and clicking a number in the list, and verify `scrollTop` of the Number List stays unchanged while the active question highlight updates accurately.

**Acceptance Scenarios**:

1. **Given** Untimed Practice Mode with a scrollable Number List scrolled to a middle or bottom position, **When** the examinee clicks Next or Previous, **Then** the Number List scroll position stays exactly where the user scrolled it and does not reset to the top.
2. **Given** the Number List scrolled to a middle or bottom position, **When** the examinee navigates using keyboard shortcuts (`ArrowRight` / `ArrowLeft` or remapped keys), **Then** the Number List scroll position remains unchanged.
3. **Given** the Number List scrolled to a middle or bottom position, **When** the examinee clicks a visible question number inside the Number List, **Then** the active highlight moves to the newly selected question and the Number List scroll position does not jump automatically.
4. **Given** any question navigation in Practice Mode, **Then** the active question highlight in the Number List updates accurately to reflect the current question.
5. **Given** the Number List in Practice Mode, **When** the examinee manually scrolls the Number List, **Then** manual scrolling works normally and is preserved across subsequent question navigations.
6. **Given** initial session start or switching to a different session/category, **Then** the Number List initializes at its default starting scroll position without affecting Full Mock Test or Timed Custom Exam behavior.

---

### Edge Cases

**US1 – Shortcuts**
- A key is pressed while a modal, confirm dialog (for example "Finish Section"), or the gear popover itself is open: shortcuts other than Escape do nothing while a blocking dialog is open; inside the popover, keys go to the shortcut editor, not to exam actions.
- The examinee assigns a key the browser or OS reserves or that the app already uses (`F` fullscreen, `Escape`, `Tab`, `Enter`, `Space`, function keys, modifier combinations): the editor refuses it with an explanation.
- The examinee binds a letter while Caps Lock is on or holds Shift: letter bindings are case-insensitive, so `r` and `R` trigger the same action.
- A non-Latin keyboard layout or an IME composition is active: keys pressed during composition never trigger actions; matching is defined against the character produced by the key, with digit keys from both the main row and numpad accepted for `1`/`2`/`3`/`4`.
- The key is held down: auto-repeat does not trigger repeated actions (consistent with the current handler), so holding `ArrowRight` does not skip many questions.
- An option key is pressed on a question that has fewer options than the number (for example `4` on a 3-option question): nothing happens.
- Special Lab questions have 4 options: the `4` default selects option 4 there and is inert on every 3-option question.
- Stored shortcut data is missing, corrupted, from an older version, or contains a duplicate or unknown action: the app falls back to defaults for invalid parts without breaking the exam and without throwing errors.
- The exam timer reaches zero while a key is pressed: the auto-submit flow wins; no shortcut runs after submission.
- Rapid repeated presses (for example `T` pressed twice quickly) produce one toggle per press, and the final state matches the number of presses.

**US2 – Pinch zoom**
- Zoom while the orientation is locked to landscape, then rotate or exit fullscreen while still zoomed.
- The virtual keyboard or browser UI appears/disappears while zoomed.
- Exit fullscreen with the Back gesture or system button while zoomed: the page returns to the normal non-fullscreen layout with no leftover scale or offset.
- Three-finger or palm touches, and a two-finger touch that begins on an answer choice: no answer is selected.
- Zoom on devices where the Fullscreen API is unavailable (for example iPhone Safari, where only video elements can go native fullscreen): Fill Screen mode is the expand path there.
- Fill Screen mode is active and the browser address bar or system bars show/hide during scroll or zoom: the CBT keeps filling the visible area without clipping the bottom toolbar.
- A session is resumed or reloaded while Fill Screen was active: the session opens in the normal layout (Fill Screen is not restored silently), matching how native fullscreen behaves after reload.
- Desktop trackpad pinch and Ctrl+wheel inside fullscreen are not altered.

**US3 – Layout and Kotoba**
- Very long options, options containing images, or options mixing Latin, katakana, numbers, and units (`10℃`, `−18℃`).
- The same surface word with different meanings in different questions (for example `点` as "point/aspect" vs. "score"): meaning is chosen per context, which may require separate entries or context-specific meanings.
- Words written in kana in one question and kanji in another (`もの` / `物`).
- Repeated words inside one sentence: listed once per sentence.
- Particles that are part of a fixed expression (`上で`, `について`): listed as the expression, and the standalone particle is not duplicated unless it also appears separately.
- Numbers, units, and symbols: excluded from Kotoba unless they form part of a meaningful expression (`一つ` is included).
- Kotoba data fails to load while offline on first use: the controls fall back gracefully as in Feature 008.

**US4 & US5 – Practice Answer Reveal & Number List Scroll**
- Shuffled option order during Practice Mode: the `check` icon follows the shuffled index of `q.correctIndex` so it always marks the true correct option after shuffling.
- A question has no valid `correctIndex` (null/out of bounds): no `check` icon renders and no runtime error is thrown.
- Toggling the eye button ON/OFF while selective translation or Kotoba panels are open: toggling answer reveal preserves workspace scroll and does not alter open translation/Kotoba panels.
- Number List hidden (`mapHidden === true`) and reopened during a Practice session, or window resized while scrolled: existing Number List visibility toggle and manual scrolling continue working without crashing.
- Multi-touch pinch gesture over the toolbar eye button: protected by the US2 multi-touch guard so pinching does not accidentally toggle answer reveal.

---

## Requirements *(mandatory)*

### Functional Requirements

**US1 — Keyboard shortcuts**

- **FR-001**: The system MUST ship with exactly the eleven default bindings listed in User Story 1 (the ten requested bindings plus `4` for option 4) and MUST NOT add other default bindings.
- **FR-001a**: The option-4 binding MUST act only when the current question has a 4th option; on all other questions it MUST do nothing.
- **FR-002**: Shortcuts MUST be active only while a CBT session is shown and MUST perform the same operation as the matching on-screen control, with the same side effects (answer persistence, progress rail, question map, flag state, Study List state, furigana preference, translation state, number-list visibility).
- **FR-003**: Shortcuts MUST be available in Untimed Practice, Full Mock Test, and Timed Custom Exam. An action whose control is not available in the current mode (Globe outside Untimed Practice) MUST do nothing in that mode.
- **FR-004**: The gear (exam settings) popover MUST contain a keyboard shortcut section, usable during an active session, that lists every action with its current key in a readable form (for example "→" for ArrowRight).
- **FR-005**: Users MUST be able to reassign any of the eleven actions by selecting the action and pressing the new key; the change MUST take effect immediately without restarting or reloading the session.
- **FR-006**: The system MUST refuse an assignment that would give one key to two actions and MUST show a message naming the conflicting action; existing bindings MUST remain unchanged after a refused assignment.
- **FR-007**: The system MUST refuse keys that are unsafe or already reserved: any combination involving Ctrl, Meta/Cmd, or Alt; `Escape`, `Tab`, `Enter`, `Space`, function keys `F1`–`F12`, and the existing fullscreen key `F`. The refusal message MUST explain why.
- **FR-008**: Users MUST be able to reset all shortcuts to the defaults with one action, effective immediately.
- **FR-009**: The shortcut mapping MUST persist on the device across reloads, tab closes, browser restarts, and offline use, and MUST be stored separately from exam sessions so that resetting or deleting sessions does not affect it.
- **FR-010**: If the stored mapping is missing, unreadable, or invalid, the system MUST use defaults for the invalid parts and MUST NOT block or crash the exam.
- **FR-011**: Shortcuts MUST NOT fire when the event target is an input, textarea, select, contenteditable region, or the shortcut editor's key-capture field; MUST NOT fire during IME composition; MUST NOT fire on auto-repeat; and MUST NOT fire while a blocking dialog is open.
- **FR-012**: Shortcuts MUST NOT intercept modifier combinations, and MUST NOT prevent the default behavior of keys that are not currently bound.
- **FR-013**: Navigation shortcuts MUST NOT go past the first or last question and MUST NOT trigger exam submission.
- **FR-014**: The existing behaviors MUST keep working unchanged: Enter/Space on a focused answer choice selects it, `F` toggles fullscreen, and `Escape` closes the settings popover.
- **FR-015**: Shortcut handling MUST be integrated with the existing keyboard handling so that each key press is processed once; adding the feature MUST NOT register duplicate document-level listeners, including across repeated renders and session restarts.
- **FR-016**: Letter bindings MUST be case-insensitive; digit bindings MUST accept both the main keyboard row and the numeric keypad.
- **FR-017**: The shortcut section MUST be keyboard-accessible and screen-reader friendly (labelled controls, visible focus, announced conflict messages) and MUST meet the WCAG AA contrast baseline.

**US2 — Pinch zoom in fullscreen**

- **FR-018**: On mobile browsers that permit page zoom in fullscreen, a two-finger pinch MUST zoom the CBT content in and out while in fullscreen CBT.
- **FR-019**: Pinch gestures MUST NOT select answers, toggle selective translation/Kotoba controls, or trigger toolbar buttons; single taps MUST continue to trigger exactly one action. The multi-touch gesture cooldown (initial baseline 150 ms) MUST be treated as a tunable parameter, verified and calibrated through real physical device testing on Android Chrome, Samsung Internet, and iOS Safari to ensure no valid single-finger taps are blocked after zooming.
- **FR-020**: When not zoomed, one-finger vertical scrolling of the question workspace MUST behave as today; when zoomed, one-finger drag MUST pan the enlarged view.
- **FR-021**: After zoom returns to normal scale, the CBT layout MUST have no horizontal overflow and no residual offset, and the header, workspace, and bottom toolbar MUST return to their pre-zoom positions.
- **FR-022**: Viewport-height synchronization and scroll locking in exam mode MUST NOT cancel or fight an in-progress or active zoom.
- **FR-023**: Zoom behavior outside fullscreen CBT and on non-CBT pages MUST NOT change, and the application MUST NOT reduce the existing user-scalable allowance anywhere.
- **FR-024**: Where a mobile browser does not support pinch zoom inside native fullscreen, the system MUST use a non-native "Fill Screen" mode as the fallback (CBT expands to fill the entire browser viewport and minimizes UI chrome without invoking the browser's native fullscreen API) so that native pinch-to-zoom gestures remain fully operational. The system MUST NOT claim native fullscreen pinch support where the browser blocks it.
- **FR-025**: The planning phase MUST record a browser support matrix (at minimum Android Chrome, Samsung Internet, iOS Safari, and desktop Chrome) stating, per browser, whether native pinch works in fullscreen and how the non-native "Fill Screen" fallback is engaged.

**US3-A — Practice answer layout**

- **FR-026**: In Untimed Practice Mode, the option text MUST start closer to the left edge of the answer card than in Feature 008, removing unnecessary horizontal empty space while keeping readable padding.
- **FR-027**: Translation and Kotoba controls MAY move to a position above or next to the option text, provided they remain visible, keep a touch area of at least 44×44 px, and cannot be confused with the answer-selection area.
- **FR-028**: Selecting an answer and toggling translation/Kotoba MUST remain strictly separate actions, as in Feature 008.
- **FR-029**: Full Mock Test and Timed Custom Exam answer cards MUST render identically to the current release; any shared-style change MUST be proven not to alter those modes.
- **FR-030**: The layout MUST have no horizontal overflow at 360, 390, and 1440 px widths, and the Feature 008 behaviors (scroll-to-row after toggling, Japanese → translation → Kotoba order, single card surface) MUST be preserved.

**US3-B — Kotoba content**

- **FR-031**: Kotoba coverage MUST span the full text of every prompt and every option in every canonical question bundle.
- **FR-032**: For each sentence, the Kotoba list MUST include every meaningful unit: nouns, verbs, adjectives, adverbs, particles, set expressions, technical terms, abbreviations, and compound words.
- **FR-033**: Compound words MUST be kept in the form that appears in the text and MUST NOT be split into single kanji. Components of a compound MAY also be listed when each component is itself a real, useful word (for example `重要`, `管理`, `点`, and `重要管理点`).
- **FR-034**: A single kanji MUST NOT be listed on its own unless it is used as a standalone word in that sentence (for example `点` in `重要管理点` qualifies as a word; `作` inside `作業` does not).
- **FR-035**: For inflected forms, the list MUST show the form as it appears; the dictionary form MUST be shown when it helps understanding, either inside the meaning (for example "bentuk dasar 選ぶ") or as an adjacent entry, without repeating it unnecessarily.
- **FR-036**: Each Indonesian meaning MUST be 1–3 short equivalents or one short phrase, MUST NOT contain explanatory paragraphs, usage notes, or full-sentence translations, and MUST be accurate for the context in which the word appears.
- **FR-037**: Furigana MUST cover the whole vocabulary unit, not one kanji within it, and MUST follow the existing toolbar furigana toggle.
- **FR-038**: Where a word has several meanings, the meaning shown MUST fit the question context; meanings MUST NOT be invented.
- **FR-039**: SSW PM technical terms (including HACCP, CCP, 食品衛生, 加熱, 冷却, 交差汚染, and other domain terms found in the banks) MUST be kept as whole units.
- **FR-040**: Within one sentence, a vocabulary unit MUST appear once; entries MUST follow the order in which they appear in the sentence, with a compound listed directly after its components when both are listed (matching the example table).
- **FR-041**: Numbers, units, and symbols on their own MUST NOT be listed; counted expressions such as `一つ` MUST be listed.

**US3-C — Data quality and reconciliation**

- **FR-042**: The plan MUST include an audit of the current dictionary, mapping, resolver, and renderer that reports, per package: missing vocabulary, incorrect splits, missing compounds, incorrect furigana, over-long meanings, and unnecessary duplicates.
- **FR-043**: Every Kotoba entry MUST be traceable to every question/option where it occurs (question ID, option ID where applicable, source file), and MUST record the source of its lemma, reading, and meaning.
- **FR-044**: Kotoba rollout MUST proceed package by package across all canonical question bundles (final scope: 100% of all packages). An individual package's Feature 008 data MUST NOT be replaced until 100% question-and-option coverage and validation for that specific package is complete. Packages awaiting rollout MUST continue serving existing Feature 008 data without regression. Feature 008 data MUST NOT be deleted or overwritten until its replacement entries pass validation; reconciliation MUST be reversible until release.
- **FR-045**: Completeness MUST be measured against the source text: for each prompt and option, the audit computes which meaningful text spans are covered by a verified entry. Counting dictionary entries MUST NOT be used as a completeness metric.
- **FR-046**: Entries that cannot be verified MUST stay marked unresolved, appear in an audit report, and MUST NOT be shown to users; machine translation MUST NOT be recorded as verified data.
- **FR-046a**: If any term ID in `kotobaMapping.json` is missing in `sharedKotobaDictionary.json`, or if there is a `schemaVersion` or `dataVersion` mismatch between the two files, the validation pipeline MUST emit an explicit diagnostic identifying the missing ID or mismatch and MUST FAIL package validation. Missing or inconsistent data MUST NOT be passed or skipped silently.
- **FR-046b**: A package's active data in production MUST remain the previous known-good data until both the dictionary and mapping for that package are 100% validated and released atomically.
- **FR-047**: Licensing and attribution established in Feature 008 (JMdict/EDRDG, CC BY-SA 4.0) MUST remain correct for any new lexical data, and any new data source MUST have a license compatible with that setup.
- **FR-048**: Original question bank text MUST NOT be modified to suit Kotoba extraction.
- **FR-049**: Updated Kotoba data MUST remain available offline, and the Service Worker cache version MUST be kept in sync per constitution Principle VI.

**Cross-cutting**

- **FR-050**: The feature MUST NOT break answering, scoring, the timer, flagging, Study List, furigana, Globe, number list, option shuffling, question navigation, fullscreen, or the Feature 008 scroll-to-row behavior.
- **FR-051**: The feature MUST use the existing vanilla HTML/CSS/JavaScript PWA architecture with no new runtime dependencies, and MUST remain compatible with GitHub Pages hosting.

**US4 — Reveal correct answer in Practice Mode**

- **FR-052**: In Untimed Practice Mode, the bottom CBT toolbar MUST render an eye (`eye`) toggle button positioned immediately to the right of the Globe button and immediately to the left of the `F` (furigana toggle, `.furigana-quick-button`) button.
- **FR-053**: In Full Mock Test and Timed Custom Exam, the eye button MUST NOT be rendered, the reveal-answer action MUST remain disabled and inert in the action handler (`handleAction`), and zero answer-key indicators or `correctIndex` attributes MAY be exposed in the exam UI.
- **FR-054**: When the eye toggle is ON in Practice Mode, the correct option (`i === q.correctIndex`) MUST display a minimalist Lucide `check` icon (~16 px, muted success green) at the right end of the correct option row, vertically aligned with the option text. On compact mobile viewports (360 px and 390 px), the icon MUST have dedicated margin/spacing so it does NOT collide or overlap with the right-edge Kotoba control (`.practice-ctrl-kotoba`), does not obscure option text, and maintains 0 px horizontal overflow.
- **FR-055**: The answer-key marker MUST NOT use checkboxes, square-checks, circle-checks, badge-checks, decorative circles/boxes behind the icon, text labels (such as "Correct" or "Jawaban benar"), or cross icons on incorrect options.
- **FR-056**: The answer-key marker MUST remain visually and logically separate from user option selection (`.selected`): toggling answer reveal MUST NOT select any option, modify `s.answers`, or alter completion state, score, or progress.
- **FR-057**: The eye toggle state MUST persist across question navigations (`Next`, `Previous`, `Jump`, and keyboard shortcuts) within the active Practice session, and toggling it OFF MUST remove the `check` marker immediately.
- **FR-058**: Answer-key detection MUST use the existing `q.correctIndex` property on the active question without creating a second answer-key source or duplicating question data.

**US5 — Stable Number List scroll position**

- **FR-059**: In Untimed Practice Mode, navigating between questions via Next, Previous, keyboard shortcuts, or clicking a question number in the Number List MUST NOT automatically reset or alter the Number List's (`scrollTop`) scroll position.
- **FR-060**: Active question highlighting in the Number List MUST still update accurately on every question navigation.
- **FR-061**: Number List scroll position MUST change only in response to manual user scrolling, except during initial session creation or switching to a different session/category (which retains existing initialization behavior).
- **FR-062**: The implementation MUST address the verified root cause (preserving Number List `scrollTop` across `renderExam()` DOM replacement for the same Practice session) without altering question navigation mechanics, Full Mock Test, or Timed Custom Exam behavior.

### Key Entities

- **Shortcut Binding**: one action (from the fixed set of eleven actions) paired with one key. Attributes: action identifier, key, display label, whether it is the default.
- **Shortcut Profile**: the full set of bindings stored on the device. Attributes: bindings, version, last updated. Must satisfy: one key per action, one action per key, no reserved keys.
- **Zoom Capability Record**: per browser/platform, whether native pinch works in fullscreen CBT and which fallback is used. Produced during planning, used for verification.
- **Kotoba Entry (revised)**: a vocabulary unit as it appears in text. Attributes: surface form, dictionary form (when different), whole-word reading, part of speech or unit type (word, particle, expression, technical term, abbreviation, compound), short Indonesian meaning, verification status, provenance (lemma, reading, and meaning sources), occurrences.
- **Occurrence**: links an entry to a specific prompt or option. Attributes: question ID, option ID (if any), source file, character span in the text, order within the sentence.
- **Coverage Report**: per sentence, the covered and uncovered meaningful spans, plus package totals; used to judge completeness.
- **Reconciliation Record**: links each Feature 008 entry to its outcome (kept, revised, merged into a compound, split, or retired) and the validation result, so that changes can be reviewed and reversed.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

**US1**
- **SC-001**: An examinee can answer options (1–4), flag, add to Study List, and navigate questions using only the keyboard; all eleven default actions work in 100% of tested exam modes where the matching control is available.
- **SC-002**: A remapped key takes effect on the next key press after closing the editor, with no reload, in 100% of trials.
- **SC-003**: Customized mappings survive reload and browser restart in 100% of trials, including offline.
- **SC-004**: In 100% of attempts, conflicting or reserved assignments are refused with a message naming the reason or conflicting action.
- **SC-005**: Zero shortcut actions fire while typing in any text field, during IME composition, or with Ctrl/Cmd/Alt held.
- **SC-006**: Each key press produces exactly one action (no double handling), verified across at least 10 consecutive question navigations and repeated session restarts.

**US2**
- **SC-007**: On every browser listed as "native pinch supported" in the support matrix, examinees can zoom in to at least 2× and back to 1× in fullscreen CBT.
- **SC-008**: On mobile browsers where native fullscreen blocks pinch-to-zoom, the "Fill Screen" fallback allows examinees to zoom CBT content to at least 2× while filling the viewport.
- **SC-009**: In 20 consecutive pinch gestures, zero answers, toggles, or toolbar actions are triggered accidentally.
- **SC-010**: After returning to normal scale, horizontal overflow is 0 px and the toolbar position matches the pre-zoom position.
- **SC-011**: Zoom behavior outside fullscreen CBT is unchanged on all tested browsers.

**US3**
- **SC-012**: The empty horizontal space before option text in Practice Mode is visibly reduced compared with Feature 008 at 390 px and 1440 px (before/after screenshots), while Full Mock Test and Timed Custom Exam screenshots show no visual difference.
- **SC-013**: For each package rolled out, the coverage audit reports zero uncovered meaningful spans across all prompts and options before replacing that package's data, ultimately reaching zero uncovered meaningful spans across all canonical packages.
- **SC-014**: Zero entries are single-kanji fragments of a longer word appearing in the same sentence.
- **SC-015**: 100% of displayed meanings meet the brevity rule (1–3 equivalents or one short phrase; no explanatory parentheticals or sentences). As a measurable proxy, at least 95% of meanings are 40 characters or fewer, and none exceed 60 characters except approved technical-term expansions (for example HACCP).
- **SC-016**: In a manual review of at least 50 randomly sampled sentences total distributed across all six canonical packages (with a minimum of 5 sentences per package, not 50 sentences per package), at least 98% of entries have an accurate meaning for the context, include particles/inflections where applicable, and have a correct whole-word reading.
- **SC-017**: 100% of entries are traceable to their source question/option and source file.
- **SC-018**: No Feature 008 entry is removed before its replacement is validated (checked by the reconciliation record).

**Cross-cutting**
- **SC-019**: The Feature 008 verification suite and existing CBT behaviors (answer, timer, flag, Study List, furigana, Globe, number list, shuffle, navigation, fullscreen) show zero regressions.

**US4 — Reveal Correct Answer in Practice Mode**
- **SC-020**: In Untimed Practice Mode, the eye button renders between Globe and `F` (furigana toggle) and toggles `check` icon visibility on the true `q.correctIndex` option in 100% of tested questions (including 3-option, 4-option, and shuffled questions) with 0 decorative boxes/text labels, 0 crosses on wrong options, 0 collisions with the Kotoba control at 360 px / 390 px widths, and dual-layer guard enforcement (rendering and action handler).
- **SC-021**: When the examinee selects an incorrect option while the eye toggle is ON, user-selection styling and the answer-key `check` icon are both clearly distinguishable, and `s.answers`, completion count, and score remain unaffected by the toggle itself.
- **SC-022**: Toggling the eye button ON persists across Next/Previous/Jump navigation; toggling OFF removes the `check` icon immediately.
- **SC-023**: In Full Mock Test and Timed Custom Exam, the eye button is absent and zero answer-key icons or attributes exist in the DOM across all questions.

**US5 — Stable Number List Scroll Position**
- **SC-024**: After scrolling the Number List in Practice Mode to a middle or bottom offset (`scrollTop > 0`), navigating via Next, Previous, keyboard shortcuts, and clicking a number in the list preserves the exact `scrollTop` (`delta === 0 px`) while updating the active question highlight in 100% of trials.
- **SC-025**: Manual user scrolling of the Number List works smoothly and persists across subsequent question navigations, while starting a new session/category initializes scroll at the default starting position.

---

## Resolved Clarifications

The following decisions were confirmed by the user on 2026-11-13:

### Q1 — Answer key for the 4th option (Special Lab bundle)
- **Decision**: **Option A** — Add `4` as an extra default shortcut.
- **Behavior**: The `4` key selects answer option 4. It is active exclusively on questions that have a 4th option (such as the 92 Special Lab questions); on all 3-option questions it remains inert.
- **Total Default Bindings**: 11 actions (`1`, `2`, `3`, `4`, `ArrowRight`, `ArrowLeft`, `R`, `T`, `E`, `Y`, `H`).

### Q2 — Fallback when native fullscreen blocks pinch zoom
- **Decision**: **Option B** — Use a non-native "Fill Screen" mode as the mobile pinch-to-zoom fallback.
- **Behavior**: Where mobile browsers block or disallow zoom in native fullscreen (via Fullscreen API), the app provides a "Fill Screen" mode where CBT expands to 100% of the visible viewport while suppressing app chrome, allowing native browser pinch gestures to remain active. Existing native fullscreen behavior is preserved where appropriate, but native pinch support is never claimed where the browser blocks it.

### Q3 — Kotoba rollout scope
- **Decision**: **Option B** — Roll out Kotoba package by package.
- **Behavior**: Replace each package's old data only after achieving complete question-and-option coverage and validation for that specific package. Packages awaiting rollout continue using existing Feature 008 data without disruption. The final target scope remains ALL question packages in the canonical bank.
- **Curation Directives**:
  - Full inclusion of particles and inflected forms.
  - Preservation of meaningful compound words as whole units (no splitting into isolated single kanji).
  - Elimination of single-kanji fragments derived from multi-kanji words.
  - Concise Indonesian definitions (1–3 short equivalents or short phrases; no lengthy contextual commentary).
  - Source traceability preserved for 100% of entries.
  - Quality sampling audited across multiple diverse packages.

---

## Risks

**Browser compatibility**
- **Native fullscreen zoom limits**: Fullscreen pinch zoom support varies across Android Chrome, Samsung Internet, and iOS Safari. iPhone Safari does not provide the document Fullscreen API at all, so it already uses a non-native path. This may force a fallback rather than one fix for all browsers.
- **Fixed-position layout under zoom**: The exam shell is fixed-position with hidden overflow, and viewport-height sync resets scroll to 0,0. Zoom changes the visual viewport, and those mechanisms can conflict (jumping, clipped toolbars, residual offsets).
- **Orientation lock**: Landscape lock during fullscreen interacts with zoom and rotation.
- **Keyboard variance**: Non-US layouts, IME input, numpad differences, and browser-reserved shortcuts differ by OS and browser.

**Kotoba data quality**
- **Scale**: Covering every meaningful unit in 1,006 prompts and 3,110 options adds particles, grammatical forms, and compounds; entry count and review effort will grow substantially.
- **Segmentation accuracy**: Japanese has no spaces. Deciding units (compound vs. components, fixed expressions like `上で`) needs consistent rules, and automated segmentation will make mistakes that need review.
- **Context-dependent meanings**: The same surface word can need different meanings in different questions; one shared entry per surface form may not be enough.
- **Readings without ruby**: The tipe2 package has no ruby, and partially annotated packages may only cover some kanji, so readings need another verified source.
- **Brevity vs. accuracy**: Shortening the current long meanings can drop needed nuance or introduce errors. Each shortened meaning still needs review.
- **Licensing**: Any new lexical source must be compatible with the CC BY-SA 4.0 setup from Feature 008; non-commercial sources (for example JIDict CC BY-NC) remain excluded.
- **False confidence from passing tests**: Feature 008 integrity checks pass despite the gaps listed in the audit baseline; new checks must measure coverage against the text.

**Regression**
- Changes inside `renderExam()`, shared answer styles, and keyboard handling sit in Zone A and can affect all exam modes. Tier 4 gates apply.

---

## Assumptions

- The existing `F` fullscreen shortcut stays as is and is treated as a reserved key that cannot be assigned to another action (constitution Principle I: preserve existing functionality). `E` is the default furigana key as requested; the toolbar button labeled "F" still toggles furigana by click.
- The "Add to Study List" shortcut toggles, like the toolbar `+`/`✓` button, so pressing `R` on a question already in the Study List removes it.
- Shortcut mappings are per device/browser; there is no cross-device sync, which matches how other UI preferences are stored today.
- Shortcuts are active during a CBT session only; the result, review, and other pages are out of scope.
- Arrow keys are bound to question navigation only when focus is not in a scrollable text field; vertical arrows and Page keys keep their default scrolling behavior.
- "Mobile" for US2 means Android Chrome, Samsung Internet, and iOS Safari on current major versions; desktop browsers are verified for non-regression only.
- Practice layout refinement applies to Untimed Practice Mode only.
- Kotoba meanings are written in Indonesian, follow the Feature 008 provenance model (JMdict lemma/reading cross-check, in-house Indonesian meanings), and stay offline.
- Kotoba entries follow sentence order, matching the example table, and particles are included as the example shows.
- Development happens on a new branch for Feature 009; branch creation is outside this specify step.
