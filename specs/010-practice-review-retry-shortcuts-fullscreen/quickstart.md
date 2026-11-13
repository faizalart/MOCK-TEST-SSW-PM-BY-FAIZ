# Quickstart Validation Guide: Feature 010

**Feature**: `010-practice-review-retry-shortcuts-fullscreen`  
**Date**: 2026-11-13  
**Status**: Completed  
**Spec Reference**: [spec.md](./spec.md)  
**Plan Reference**: [plan.md](./plan.md)

---

## Overview

This guide provides step-by-step verification procedures for validating all five user stories introduced in Feature 010 using automated Node/CDP test scripts and targeted browser interaction scenarios.

---

## 1. Prerequisites & Environment Setup

1. **Working Directory**: Repository root (`MOCK-TEST-SSW-PM-BY-FAIZ`)
2. **Node.js**: Installed (`node --version` >= 18)
3. **Headless Chrome**: Chrome / Chromium available in PATH or default installation directory.
4. **Local HTTP Server**:
   ```powershell
   # Start local testing server on port 8080 (or run background server)
   npx serve -l 8080 .
   ```

---

## 2. Test Suite Execution Matrix

| Test Suite File | Stories Tested | Primary Validation Target |
|---|---|---|
| `tests/test-feature-010-retry-incorrect.mjs` | **US1** | Wrong questions filtering, cloned session launch, parent immutability, breadcrumb navigation, and origin badges. |
| `tests/test-feature-010-keyboard-shortcuts.mjs` | **US2, US3, US5** | `ArrowUp`/`ArrowDown` scrolling, `T` (Study list toggle), `U` (Eye reveal), 8 translation/Kotoba single-letter keys, and input bypass. |
| `tests/test-feature-010-android-fullscreen.mjs` | **US4** | `shouldUseFillScreenFallback()` feature detection, `requestFullscreen()` execution, and UI state synchronization. |
| `tests/test-feature-009-shortcuts.mjs` | **Regression** | Schema v1 to v2 migration, existing shortcut preservation, and collision detection. |
| `tests/test-practice-selective-kotoba.mjs` | **Regression** | Selective translation and Kotoba rendering consistency. |

---

## 3. Step-by-Step Validation Scenarios

### Scenario 1: Retry Incorrect Questions Only (US1)

1. **Execution**:
   ```powershell
   node tests/test-feature-010-retry-incorrect.mjs
   ```
2. **Automated Steps Asserted**:
   - Seeds an exam with 40 questions.
   - Submits 3 wrong answers (e.g. Questions 4, 12, 19), 35 correct answers, and 2 skipped.
   - Opens the Review tab on the Results screen.
   - Asserts button `"Ulangi Jawaban Salah (3)"` is rendered.
   - Clicks button and asserts a new practice session begins with exactly 3 questions.
   - Asserts question header displays `Soal 1 dari 3` and origin badge `Asal: Soal #4`.
   - Asserts breadcrumb bar displays `Ujian Utama › Latihan Ulang Jawaban Salah › [Kembali ke Hasil Utama]`.
   - Clicks `[Kembali ke Hasil Utama]` and asserts return to original results screen.
   - Asserts parent exam score, answers, and timestamp are 100% identical to baseline.
3. **Expected Outcome**: Test exits with code 0 (`PASS: All US1 scenarios verified`).

---

### Scenario 2: ArrowUp / ArrowDown Question Scrolling (US2)

1. **Execution**:
   ```powershell
   node tests/test-feature-010-keyboard-shortcuts.mjs --filter=scroll
   ```
2. **Automated Steps Asserted**:
   - Opens an illustrated question in CBT mode with vertical overflow.
   - Records baseline `scrollTop` (0).
   - Simulates `ArrowDown` keydown 5 times.
   - Asserts `.exam-workspace` `scrollTop` increases by `5 * 80 = 400px` (±5px).
   - Asserts `currentIndex` remains unchanged at question 0.
   - Simulates `ArrowUp` keydown 3 times.
   - Asserts `scrollTop` decreases by `3 * 80 = 240px`.
   - Focuses a text input and presses `ArrowDown`; asserts `scrollTop` does not change.
3. **Expected Outcome**: Test exits with code 0 (`PASS: Arrow scrolling verified`).

---

### Scenario 3: T and U Shortcuts (US3)

1. **Execution**:
   ```powershell
   node tests/test-feature-010-keyboard-shortcuts.mjs --filter=study-reveal
   ```
2. **Automated Steps Asserted**:
   - Launches Untimed Practice mode.
   - Presses `T` on question 1: asserts active question is added to Study List and toolbar icon updates to `✓`.
   - Presses `T` again: asserts active question is removed from Study List (two-way toggle) and icon resets to `+`.
   - Presses `U`: asserts Eye Reveal toggle turns ON and minimalism checkmark appears on correct option.
   - Presses `U` again: asserts Eye Reveal turns OFF.
   - Switches to Full Mock exam: presses `U`; asserts Eye Reveal does NOT activate and no answer key indicators appear in the DOM.
3. **Expected Outcome**: Test exits with code 0 (`PASS: T and U shortcuts verified`).

---

### Scenario 4: Android Fullscreen Repair & Fallback (US4)

1. **Execution**:
   ```powershell
   node tests/test-feature-010-android-fullscreen.mjs
   ```
2. **Automated Steps Asserted**:
   - Emulates Android Chrome user-agent string (`Mozilla/5.0 (Linux; Android 14; Pixel 8) ...`).
   - Asserts `shouldUseFillScreenFallback()` returns `false` (native Fullscreen API supported).
   - Taps `⛶` button (`[data-action="toggle-fullscreen"]`).
   - Asserts `document.fullscreenElement` is active and button icon becomes `🗗`.
   - Emulates iOS Safari user-agent string; asserts `shouldUseFillScreenFallback()` returns `true` and triggers `body.is-fill-screen`.
   - Exits exam; asserts all fullscreen classes are cleared.
3. **Expected Outcome**: Test exits with code 0 (`PASS: Android Fullscreen API repair verified`).

---

### Scenario 5: Single-Letter Translation & Kotoba Keys (US5)

1. **Execution**:
   ```powershell
   node tests/test-feature-010-keyboard-shortcuts.mjs --filter=trans-kotoba
   ```
2. **Automated Steps Asserted**:
   - In Untimed Practice mode, presses `G`: asserts question stem Indonesian translation toggles.
   - Presses `A`: asserts Option 1 translation toggles.
   - Presses `S`: asserts Option 2 translation toggles.
   - Presses `D`: asserts Option 3 translation toggles.
   - Presses `V`: asserts Question stem Kotoba list toggles.
   - Presses `Z`: asserts Option 1 Kotoba list toggles.
   - Presses `X`: asserts Option 2 Kotoba list toggles.
   - Presses `C`: asserts Option 3 Kotoba list toggles.
   - Re-runs with option shuffling active; asserts keys target visually displayed options 1, 2, 3.
   - Switches to Full Mock exam; presses all 8 keys and asserts no translations or Kotoba lists are exposed.
3. **Expected Outcome**: Test exits with code 0 (`PASS: 8 single-letter shortcuts verified`).

---

## 4. Full Regression Verification Command

Run the complete test suite before merging or release:
```powershell
node tests/test-feature-010-retry-incorrect.mjs
node tests/test-feature-010-keyboard-shortcuts.mjs
node tests/test-feature-010-android-fullscreen.mjs
node tests/test-feature-009-shortcuts.mjs
node tests/test-feature-009-practice-ergonomics.mjs
git diff --check
```
