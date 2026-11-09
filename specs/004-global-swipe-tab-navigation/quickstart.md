# Quickstart: Feature 004 — Global Mobile Swipe Navigation Across All Main Tabs

**Feature Branch**: `feat/swipe-tab-navigation`
**Date**: 2026-11-09
**Status**: Ready
**Author**: Antigravity Senior Frontend Agent

---

## 1. Executive Summary

Feature 004 brings native mobile swipe gestures to the SSW PM Mock Test PWA. Candidates on mobile devices can now swipe left and right across any area of the content screen to transition through all six main tabs:
```
Beranda ⇄ Mock Test ⇄ Bank Soal ⇄ Riwayat ⇄ Study List ⇄ Backup
```

---

## 2. Key Interaction Patterns

### 2.1 Swiping Forward (Next Tab)
- **Gesture**: Swipe horizontally towards the **left** (finger touches screen and moves leftward ≥ 70px).
- **Behavior**:
  - `Beranda` (`home`) → `Mock Test` (`setup`)
  - `Mock Test` (`setup`) → `Bank Soal` (`bank`)
  - `Bank Soal` (`bank`) → `Riwayat` (`history`)
  - `Riwayat` (`history`) → `Study List` (`study`)
  - `Study List` (`study`) → `Backup` (`backup`)
  - `Backup` (`backup`) → **Dead-end** (remains on Backup).

### 2.2 Swiping Backward (Previous Tab)
- **Gesture**: Swipe horizontally towards the **right** (finger touches screen and moves rightward ≥ 70px).
- **Behavior**:
  - `Backup` (`backup`) → `Study List` (`study`)
  - `Study List` (`study`) → `Riwayat` (`history`)
  - `Riwayat` (`history`) → `Bank Soal` (`bank`)
  - `Bank Soal` (`bank`) → `Mock Test` (`setup`)
  - `Mock Test` (`setup`) → `Beranda` (`home`)
  - `Beranda` (`home`) → **Dead-end** (remains on Beranda).

---

## 3. Disambiguation & Safety Guarantees

1. **Vertical Scrolling Priority**:
   If you scroll up or down, the page scrolls normally at full 60fps/120fps. Vertical movement will not trigger accidental tab changes.
2. **Carousel & Slider Isolation**:
   Dragging horizontally on the package filter chips (`#home-pkg-pills`) scrolls the chip ribbon, not the app tab.
3. **CBT Protection**:
   During active exams, on Results scorecards, or in Review Answers, swipe tab navigation is disabled to prevent accidental disruption.
4. **Desktop Support**:
   Standard mouse clicking on the top navigation bar works as always.

---

## 4. Verification & Testing

Run the automated headless Chrome CDP test suite:
```bash
node tests/test-global-swipe-navigation.mjs
```

Verify that all 15 automated test scenarios pass:
- Sequential navigation across all 6 tabs (left swipe)
- Sequential reverse navigation across all 6 tabs (right swipe)
- Dead-end checks on Beranda and Backup
- Exclusion checks (CBT, Results, Review, modals, inputs, carousels)
- Vertical scroll safety and diagonal gesture rejection
- Desktop parity and reduced motion support
