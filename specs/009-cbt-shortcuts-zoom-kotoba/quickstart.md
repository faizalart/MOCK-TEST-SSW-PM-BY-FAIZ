# Validation Quickstart: Feature 009

**Feature**: `009-cbt-shortcuts-zoom-kotoba`  
**Date**: 2026-11-13  
**Contracts**: [`shortcuts-and-zoom-contract.md`](./contracts/shortcuts-and-zoom-contract.md), [`kotoba-redesign-contract.md`](./contracts/kotoba-redesign-contract.md)

---

## Prerequisites
- Node.js (v20+) and Google Chrome / Chromium installed locally.
- Local static HTTP server (`npx serve` or Node `http` script on `127.0.0.1`) serving the repository root.
- Real mobile browser testing (Android Chrome, iOS Safari) for US2 physical pinch-to-zoom verification, supplemented by Headless Chromium CDP (`--headless=new --remote-debugging-pipe`) for automated DOM, CSS, and touch/pointer simulation.

---

## Focused Verification Scenarios

### Scenario 1 — Keyboard Shortcuts Dispatch, 3/4-Option Handling & Mode Isolation (US1)
- **Steps**:
  1. Launch Untimed Practice (`kunci-ujian-1`), verify `1`, `2`, `3` select options 1–3, while `4` does nothing.
  2. Launch Special Lab (4-option question), verify `4` selects option 4.
  3. Press `ArrowRight` / `ArrowLeft` across questions; verify first-question `ArrowLeft` and last-question `ArrowRight` are no-ops.
  4. Press `R`, `T`, `E`, `Y`, `H` and verify Study List, Flag, Furigana, Globe, and Number List toggle with matching toolbar active states.
  5. Switch to Full Mock Test / Timed Custom Exam; verify `Y` does nothing (Globe unavailable), while `1`–`4`, arrows, `R`, `T`, `E`, `H` still work.
  6. Verify `Ctrl+R`, `Alt+T`, typing in `#exam-settings-popover` or inputs, and `F` fullscreen remain unaffected.
  7. Confirm zero duplicate `keydown` listeners across 10+ navigations and session restarts.

### Scenario 2 — In-Session Shortcut Remapping, Conflict Rejection & Persistence (US1)
- **Steps**:
  1. Open gear popover (`⚙`) mid-session, remap `toggleFlag` from `T` to `Q`, close popover without reloading.
  2. Verify `Q` toggles flag and `T` no longer triggers flag.
  3. Attempt to bind `Q` to `toggleFurigana` (conflict) and `F` or `Escape` (reserved): verify rejection with named conflict/reason message and unchanged bindings.
  4. Reload page (and test offline via Service Worker): verify `Q` binding persists in `localStorage` (`sswPmExamShortcuts`).
  5. Click "Reset Shortcuts": verify all 11 bindings return to defaults immediately.

### Scenario 3 — Mobile Fullscreen & Fill Screen Pinch-to-Zoom (US2)
- **Steps**:
  1. On iOS Safari and Android Chrome (plus CDP mobile emulation at `390×844`): enter expanded CBT mode via fullscreen toggle.
  2. Confirm non-native `body.is-fill-screen` activates on mobile browsers where native fullscreen blocks pinch zoom, while desktop keeps native fullscreen.
  3. Perform 2-finger pinch-out (`>= 2×` scale) and 1-finger pan, then pinch back to `1×`.
  4. Perform 20 simulated multi-touch pinch gestures over `.answer-choice` and `.practice-row-ctrl`: verify 0 accidental answers or toggles.
  5. Calibrate and test on real physical devices (Android Chrome, Samsung Internet, iOS Safari): verify the tunable gesture cooldown (initial baseline 150ms) reliably suppresses synthetic clicks on lifting pinch fingers without delaying or blocking subsequent deliberate single-finger taps.
  6. Verify 0 px horizontal overflow and restored header/bottom toolbar positions after returning to `1×`.

### Scenario 4 — Practice Layout Compactness & Mode Isolation (US3-A)
- **Steps**:
  1. Capture desktop (`1440×900`) and mobile (`390×844`, `360×740`) screenshots in Untimed Practice Mode and Full Mock Test.
  2. Measure `.answer-text` left offset inside `.practice-option-row` vs Feature 008 baseline (visibly closer to left edge, zero horizontal overflow).
  3. Confirm Full Mock Test and Timed Custom Exam answer cards remain pixel-identical to pre-009 baseline.
  4. Verify Feature 008 scroll-to-row behavior and `>= 44×44px` control hit areas remain intact.

### Scenario 5 — Kotoba Coverage Audit, Integrity Diagnostics & Offline Sync (US3-B, US3-C)
- **Steps**:
  1. Run automated span-coverage audit script per migrated package: assert `0` uncovered meaningful spans across 100% of prompts and options, `0` single-kanji fragments from longer words, `>= 95%` meanings `<= 40` chars, and `100%` whole-word furigana.
  2. Assert validation tool produces clear diagnostics and strictly FAILS package validation if any term ID is missing or if `schemaVersion`/`dataVersion` mismatches (never skips silently), while legacy data remains active in production until atomic release.
  3. Verify `ssw-pm-tipe2-nguyen1.json` entries carry JMdict-verified readings despite zero source `<ruby>`.
  4. Perform manual review on `>= 50` randomly sampled sentences total distributed across all six packages (minimum 5 sentences per package, not 50 per package; `>= 98%` accuracy).
  5. Verify Service Worker (`sw.js`) cache bump and offline loading of updated `data/sharedKotobaDictionary.json` and `data/kotobaMapping.json`.

### Scenario 6 — Reveal Correct Answer in Practice Mode (US4)
- **Steps**:
  1. Launch Untimed Practice Mode; verify the eye (`eye`) button appears immediately to the right of Globe and immediately to the left of `F` (furigana toggle, `.furigana-quick-button`), and starts OFF with no check icon on any option.
  2. Click the eye button ON; verify a minimalist ~16 px Lucide `check` icon (muted success green, no box/circle/badge/text, no cross on wrong options) appears only on the right end of the true `q.correctIndex` option.
  3. Verify at 360 px and 390 px mobile viewports that the `check` icon has dedicated margin/spacing so it does NOT collide or overlap with `.practice-ctrl-kotoba` on the right edge strip and causes 0 px horizontal overflow.
  4. Select an incorrect option; verify user selection styling remains on the chosen option while the `check` icon stays on the correct option, without changing score or progress.
  5. Select the correct option; verify both states remain cleanly distinguishable.
  6. Navigate Next/Previous while eye is ON; verify the next question also reveals its `check` icon; toggle eye OFF and verify the `check` icon disappears immediately.
  7. Open Full Mock Test and Timed Custom Exam; verify dual-layer guard: the eye button is absent in the DOM, zero answer-key icons exist, and invoking `handleAction('toggle-practice-reveal-answer')` is strictly ignored.

### Scenario 7 — Stable Number List Scroll Position (US5)
- **Steps**:
  1. Launch Untimed Practice Mode with a 40-question (or larger) set and scroll `.exam-question-map` to a middle/bottom position (`scrollTop > 0`).
  2. Navigate via Next and Previous buttons: assert `.exam-question-map.scrollTop` remains unchanged (`delta === 0 px`) while `.question-map-item.current` updates accurately.
  3. Navigate via keyboard shortcuts (`ArrowRight` / `ArrowLeft`): assert `.exam-question-map.scrollTop` remains unchanged.
  4. Click a visible question number inside `.exam-question-map`: assert `.question-map-item.current` moves to the clicked number and `scrollTop` does not jump automatically.
  5. Scroll `.exam-question-map` manually again and verify manual scroll works normally and persists across subsequent navigations.
  6. Start a new session or switch category: assert Number List initializes at its default starting scroll position.
