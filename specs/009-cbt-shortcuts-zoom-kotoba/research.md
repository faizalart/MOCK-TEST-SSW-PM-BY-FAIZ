# Phase 0 Research: CBT Keyboard Shortcuts, Fullscreen Pinch Zoom & Kotoba Redesign

**Feature**: `009-cbt-shortcuts-zoom-kotoba`  
**Date**: 2026-11-13  
**Spec**: [`spec.md`](./spec.md)

---

## 1. Keyboard Shortcuts Integration & Storage

### Codebase Audit Findings
- `app.js` currently registers two document-level `keydown` listeners:
  1. Lines 6161–6178: checks `state.page === 'exam'`, handles `Enter`/`Space` on focused `.answer-choice[data-action="answer"]`, skips `e.ctrlKey || e.metaKey || e.altKey || e.repeat`, skips `input, textarea, select, [contenteditable="true"]`, and triggers `toggleFullScreen()` on `f`/`F`.
  2. Lines 6180–6201: handles `Escape` to close `#exam-settings-popover` and `#zen-lang-dropdown`.
- `renderExamSettingsPopover()` (`app.js:3769–3851`) renders the gear popover inside `.exam-shell`, with `.exam-settings-body` (`overflow-y: auto; max-height: calc(100vh - 160px)`) and `.exam-settings-foot` (`Reset`, `Done`).
- Preferences are stored in `localStorage` under `sswPmExamPrefs`, `sswPmLang`, and `sswPmMapHidden`.

### Architectural Decisions
- **Decision 1 — Unified Exam Keydown Dispatch & Strict Priority**: Consolidate custom CBT shortcut dispatch into the existing exam `keydown` listener (`app.js:6161`) rather than adding a third `document.addEventListener('keydown', ...)`. Execute in strict priority order:
  1. `Escape`: Top priority (cancel active shortcut capture, else close settings popover, else close language menu/modals).
  2. `Enter` / `Space`: Preserved on focused `.answer-choice[data-action="answer"]` for native keyboard radio selection; cannot be overridden.
  3. Form & Contenteditable Guard: If target is `input, textarea, select, [contenteditable="true"]`, ignore global shortcuts immediately.
  4. Shortcut Remapping / Capture Isolation: If `state.shortcutCaptureAction != null`, capture the key via `e.preventDefault()` and `e.stopPropagation()`, record the binding, and prevent any keystroke leakage into global CBT actions (e.g. typing `1` to remap an action must NOT select answer option 1 in the exam).
  5. Modifiers / IME: Skip `e.isComposing || e.keyCode === 229 || e.repeat || e.ctrlKey || e.metaKey || e.altKey`.
  6. Fullscreen Reservation: `F` / `f` toggles fullscreen/Fill Screen; cannot be remapped.
  7. Custom Shortcut Dispatch: Map normalized key to the 11 CBT actions.
  - *Rationale*: Guarantees single-execution per keystroke, eliminates duplicate listener accumulation across `renderExam()` re-renders, and prevents any regression in core CBT keyboard workflows.
  - *Alternatives rejected*: Adding a separate listener inside `renderExam()` (risks duplicate handlers on re-render) or a separate global listener (risks ordering conflicts with `F` and `Escape`).
- **Decision 2 — Dedicated `localStorage` Key (`sswPmExamShortcuts`)**: Store the shortcut profile independently from `sswPmExamPrefs` and IndexedDB `sessions`, with schema `{ version: 1, bindings: { ... } }` and defensive per-action fallback to `DEFAULT_EXAM_SHORTCUTS` on parse/validation errors.
  - *Rationale*: Keeps shortcut preferences persistent across session resets/deletions, page reloads, and offline usage, matching `sswPmExamPrefs` and `sswPmMapHidden`.
  - *Alternatives rejected*: Storing inside IndexedDB `meta` (async read delay on initial keypress) or inside `sswPmExamPrefs` (couples shortcut reset with font/furigana reset).
- **Decision 3 — Key Normalization**: Normalize letter keys to uppercase (`'r'` / `'R'` -> `'R'`), digit keys via `e.key` (`'1'`–`'4'`) and `e.code` (`Digit1`–`Digit4`, `Numpad1`–`Numpad4`), and arrows via `'ArrowLeft'` / `'ArrowRight'`. Reserve `F`, `Escape`, `Tab`, `Enter`, `Space`, `F1`–`F12`, and any modifier combo (`Ctrl`/`Meta`/`Alt`).
  - *Rationale*: Works consistently across Caps Lock, Shift, and numeric keypads without interfering with browser/OS shortcuts or existing `F` fullscreen.

---

## 2. Mobile Fullscreen & Pinch-to-Zoom Compatibility

### Codebase Audit Findings
- `index.html` already declares `<meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=0.5, maximum-scale=5.0, user-scalable=yes" />`.
- `QUESTION-EDITOR-UPDATES.css` (`lines 183–224`) sets `position: fixed !important; overflow: hidden !important; touch-action: pan-x pan-y pinch-zoom !important;` on `body.exam-mode` and `.exam-shell`.
- `toggleFullScreen()` (`app.js:1335–1358`) calls `document.documentElement.requestFullscreen` (or `webkitRequestFullscreen`) and then `lockExamLandscape()`. If `reqFs` is absent, it shows a toast and exits.
- `syncExamViewportHeight()` (`app.js:1381–1412`) checks `Math.abs(scale - 1) > 0.02` on `window.visualViewport` to avoid resizing during pinch-zoom, and resets `window.scrollTo(0, 0)` when in `exam-mode`.
- `examAnswerPointerStart` (`app.js:6203–6211`, `6322–6326`) tracks single-pointer distance (`Math.hypot`) to suppress accidental answer clicks on drag, but does not track multi-touch pointer counts (`pointerId` set or `touches.length >= 2`).

### Browser Support Matrix (Verified Platform Capabilities)

| Browser / Platform | Native Fullscreen API | Pinch-to-Zoom in Native Fullscreen | Recommended Mode in Feature 009 |
|---|---|---|---|
| **Android Chrome** (current) | Supported (`requestFullscreen`) | Blocked/restricted by browser compositor in document fullscreen on mobile | **Fill Screen** fallback on mobile (or user-selectable), keeping native fullscreen available where appropriate |
| **Samsung Internet** (current) | Supported (`requestFullscreen`) | Blocked/restricted in native document fullscreen | **Fill Screen** fallback on mobile |
| **iOS Safari (iPhone)** | **Not supported** (`document.documentElement.requestFullscreen` undefined) | N/A (API absent) | **Fill Screen** mode (`body.is-fill-screen`) with full native pinch-to-zoom |
| **iPadOS Safari** | Supported on newer iPadOS | Varies / constrained by fullscreen overlay | **Fill Screen** fallback when pinch is needed; native fullscreen preserved where supported |
| **Desktop Chrome / Edge / Firefox** | Supported | Trackpad/Ctrl+wheel zoom works outside or per browser | Native Fullscreen preserved as-is |

### Architectural Decisions
- **Decision 4 — Explicit Dual-Mode Fullscreen (`isNativeFullscreen` vs `isFillScreen`)**:
  - **Native Fullscreen** (`body.is-fullscreen`): Preserves existing `requestFullscreen` + `lockExamLandscape()` behavior on desktop and when explicitly using native fullscreen.
  - **Fill Screen Mode** (`body.is-fill-screen`): Non-native expanded mode on mobile/touch viewports (and automatically used when Fullscreen API is unavailable like iOS Safari, or when mobile pinch-to-zoom is required). It hides non-CBT app chrome, uses `100dvh` / `visualViewport` height tracking, and keeps the browser's normal viewport compositor active with `touch-action: pan-x pan-y pinch-zoom` so two-finger pinch-to-zoom and one-finger panning work natively. Never applies `touch-action: none` or custom gesture cancellers.
  - *Rationale*: Directly satisfies Clarification Q2 (Option B): avoids claiming native pinch support where browsers block it, while giving mobile examinees an expanded, distraction-free view with real native pinch-to-zoom.
- **Decision 5 — Viewport Sync Under Zoom (`visualViewport.scale` as Observer)**:
  - Clarify that `visualViewport.scale` is strictly an observer/read-only property; it does NOT enable or actuate zoom.
  - In `syncExamViewportHeight()`: when `visualViewport.scale > 1.02`, bypass `window.scrollTo(0, 0)` and avoid fixed-height clamping to preserve user zoom level and pan frame. When scale returns to `<= 1.02`, cleanly re-sync `--exam-viewport-height` and eliminate residual window offsets.
- **Decision 6 — Passive Multi-Touch Pointer Guard (Zero `preventDefault()` on Gesture)**:
  - Track active pointers via `pointerdown`, `pointerup`, and `pointercancel` in `activeExamPointers = new Map()`, plus `touchstart` (`e.touches.length >= 2`).
  - **STRICT PROHIBITION**: NEVER call `e.preventDefault()` inside gesture handlers during multi-touch sequences (`activeExamPointers.size >= 2` or `e.touches.length >= 2`), as doing so cancels browser-native pinch zoom. Listeners must be passive/non-cancelling.
  - Handle `pointercancel`: cleanly clean up pointers aborted by system gestures or browser zoom takeovers, avoiding stuck pointer states.
  - Guard the action resolution layer: when fingers are lifted from pinch (`wasMultiTouch = true`), swallow the synthetic `click`/`pointerup`. Apply an adaptive short cooldown (initial baseline 150ms, tunable based on real physical device testing on Android Chrome, Samsung Internet, and iOS Safari) purely to catch delayed asynchronous mouse/click emissions without blocking valid subsequent taps. A clean single-pointer `pointerdown` after fingers lift and cooldown expires is immediately accepted, ensuring valid taps after pinch are never blocked.

---

## 3. Practice Answer Layout Refinement

### Codebase Audit Findings
- In `ZEN-APP-SHELL.css` (`lines 1086–1115`), `.practice-option-row .answer-choice` currently enforces `padding-left: 44px !important; padding-right: 58px !important;`.
- Inside `.answer-choice`, `.answer-content` also inherits margins/gaps from `QUESTION-EDITOR-UPDATES.css`, creating noticeable empty horizontal space on the left before the Japanese option text and on the right.
- Full Mock Test and Timed Custom Exam do **not** wrap `.answer-choice` inside `.practice-option-row` (`app.js:3903–3905`).

### Architectural Decisions
- **Decision 7 — Strictly Scoped `.practice-option-row` / `.practice-prompt-row` CSS Refinement**:
  - Keep `.answer-choice` base rules untouched so Full Mock Test and Timed Custom Exam remain pixel-identical.
  - Adjust horizontal padding and control hit-zone placement strictly inside `.practice-option-row` (for example reducing `.answer-choice` left padding from `44px` to compact left alignment while preserving a non-overlapping `>= 44×44px` touch target for `.practice-ctrl-trans` and `.practice-ctrl-kotoba`, or placing compact top/inline hit strips where visually cleaner without encroaching on `.answer-text` tap area).
  - *Rationale*: Zero risk of CSS leakage into official timed modes; preserves single-card surface, `JP -> Translation -> Kotoba` vertical stack, and Feature 008 scroll-to-row behavior.

---

## 4. Kotoba Redesign & Package-by-Package Migration

### Codebase Audit Findings
- Current files:
  - `data/sharedKotobaDictionary.json`: **4,960.1 KB** (~4.96 MB), 1,809 terms (`1,765 verified`, `44 unresolved` morpheme fragments).
  - `data/kotobaMapping.json`: **825.2 KB**, indexed by `questions` (1,006 keys), `options` (1,006 keys), and `byCompositeKey`.
- Why `sharedKotobaDictionary.json` is nearly 5 MB:
  - Verified meanings are verbose (median 57 chars, max 145 chars).
  - Every term embeds a full `occurrences` array listing every `{ questionId, targetType, optionId, compositeKey, sourceFile }`. For high-frequency words or particles across 1,006 questions + 3,110 options, inline `occurrences` arrays in the runtime dictionary JSON would balloon file size dramatically if kept in the runtime payload.
- Current quality gaps confirmed by audit:
  - 469 single-kanji entries (many are fragments like `作`, `正`, `選`, `売` in `kunci1-q001`).
  - 0 particles (`に`, `を`, `で`, etc.) and missing inflected forms (`選びなさい`, `沿った`).
  - 40 questions in `ssw-pm-tipe2-nguyen1.json` lack `<ruby>` annotations.
  - `sw.js` (`CACHE_NAME = 'ssw-pm-mock-test-shell-v30'`) precaches both `./data/sharedKotobaDictionary.json` and `./data/kotobaMapping.json`.

### Architectural Decisions
- **Decision 8 — Full-Text Span Coverage Model & Traceability Without Runtime Bloat**:
  - To prevent `sharedKotobaDictionary.json` from bloating past mobile PWA precache limits while providing 100% lexicographical rigor:
    - **Full-Text Span Validator**: Inspects entire prompt/option Japanese text $[0, string.length)$. Every single character must belong to either a verified term span, allowed structural punctuation, or an allowed numeric/unit entity. Any unclassified character span is flagged as an `UNRESOLVED_SPAN`. Partial dictionary matching is strictly rejected.
    - **Segmentation Principles**: Compound words (`重要管理点`, `交差汚染`) are preserved as intact units (with optional constituent sub-word indexing); grammatical particles (`に`, `を`, `で`, `は`, `が`, `の`, `と`, `も`, `へ`, etc.) and compound expressions (`について`, `上で`) are indexed as first-class entries with concise grammatical meanings; inflected surface forms (`選びなさい`, `沿った`) link to base dictionary forms; zero isolated kanji fragments.
    - **External Audit Ledgers**: Full-text span decomposition ledgers (`full-coverage-ledger.json`), reconciliation diffs (`reconciliation-ledger.json`), and unresolved span reports (`unresolved-spans-report.json`) are maintained in `specs/009-cbt-shortcuts-zoom-kotoba/audit/` in git, strictly excluded from `sw.js` precache.
    - **License & Attribution Retention**: EDRDG / JMdict attribution and CC-BY-SA-4.0 license metadata are strictly preserved in `sharedKotobaDictionary.json` `_meta` and the settings popover UI.
- **Decision 9 — Package-by-Package Rollout via Per-Package Coverage Gate**:
  - Track rollout status per canonical package (`_meta.packageRollout` in `kotobaMapping.json` + staging validator script).
  - During migration of package $P$:
    1. Extract and segment all prompts & options of package $P$ (preserving compounds, particles, inflected forms + base form, excluding isolated single-kanji fragments and standalone numbers).
    2. Cross-verify kanji readings against exam `<ruby>` tags and JMdict (EDRDG, CC BY-SA 4.0) — essential for `ssw-pm-tipe2-nguyen1.json` which has 0 ruby.
    3. Author/shorten Indonesian meanings to 1–3 concise equivalents/short phrases.
    4. Run automated **Full-Text Span Coverage Audit** on 100% of prompts and options in package $P$: must report `UNRESOLVED_SPAN === 0`, `0 single-kanji fragment errors`, and `100% whole-word furigana`.
    5. Run manual review of sampled sentences from package $P$ (part of the multi-package manual audit: minimum 50 sentences total across all 6 packages, >= 5 per package; not 50 per package).
    6. Only after passing gates 4 & 5, commit package $P$'s updated `questions` & `byCompositeKey` slices into `kotobaMapping.json` and merge validated terms into `sharedKotobaDictionary.json`. Un-migrated packages continue using Feature 008 mappings untouched.
- **Decision 10 — Service Worker Data Consistency & Resilient Resolver**:
  - `sharedKotobaDictionary.json` and `kotobaMapping.json` carry synchronized `_meta.dataVersion` (e.g. `"20261113-v2"`) and `_meta.schemaVersion: "2.0.0"` and are deployed together atomically.
  - **Validation & Integrity Hard-Fail**: If ANY term ID referenced in `kotobaMapping.json` is missing in `sharedKotobaDictionary.json`, or if there is a `schemaVersion` or `dataVersion` mismatch between mapping and dictionary, the validation tools MUST output a clear diagnostic error identifying the missing ID or mismatch and MUST FAIL package validation. Missing or mismatched data MUST NEVER be skipped or passed silently during validation.
  - **Production Data Preservation**: The package's active data in production MUST remain the previous known-good (Feature 008) data until both the dictionary and mapping for that package are 100% validated and deployed atomically.
  - **Runtime Resolver Diagnostic**: At runtime, if an unexpected missing term ID or version mismatch occurs (e.g. from local storage corruption), `resolveKotobaEntries()` in `app.js` logs an explicit console error diagnostic rather than hiding it silently, while safely preventing an unhandled crash of the surrounding CBT question view.
  - **Service Worker Lifecycle Safety**: Old cache bucket serves currently active exam sessions until the new worker activates; ongoing exams (`state.page === 'exam'`) are never abruptly reloaded or invalidated.
  - Bump `sw.js` `CACHE_NAME` per release so offline PWA caches refresh cleanly.
