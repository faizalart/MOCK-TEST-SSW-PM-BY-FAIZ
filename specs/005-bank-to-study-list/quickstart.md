# Quickstart & Verification Guide: Bank Soal Study List Action

**Feature**: 005-bank-to-study-list
**Date**: 2026-11-10
**Status**: Draft

---

## 1. Prerequisites

- Node.js 18+ installed on system.
- Google Chrome installed at standard location.
- Clean working directory on the active feature branch.

---

## 2. Automated Test Suite Execution

A dedicated test script `tests/test-bank-study-action.mjs` will be created to validate the feature end-to-end using Headless Chrome DevTools Protocol (CDP).

To execute the test:
```powershell
node tests/test-bank-study-action.mjs
```

### Verification Checks Performed by Automated Suite:
1. **Initial Rendering**:
   - Navigate to Bank Soal (`#bank`).
   - Assert all visible `.zen-q-item` cards contain a button with `data-action="add-bank-study"`.
   - Assert unbookmarked questions display `+` glyph, `aria-pressed="false"`, and tooltip `Tambahkan ke Study List`.
2. **Add Action Execution (User Story 1)**:
   - Click the `+` button on question #1.
   - Assert button immediately changes to `✓` glyph, gains class `is-active`, and `aria-pressed="true"`.
   - Assert toast notification pops with message `"Soal berhasil ditambahkan ke Study List."`.
   - Assert sidebar Study List badge count increments by 1.
   - Inspect IndexedDB `studyList` store to assert the record exists with correct composite key `${setId}::${q.id}`.
3. **Study List Verification**:
   - Navigate to `#study`.
   - Assert question #1 appears in the Study List with full prompt, options, and explanation.
4. **Idempotent Add-Only Execution (User Story 2)**:
   - Return to `#bank`.
   - Assert question #1 card still renders in the bookmarked state (`✓`, `is-active`).
   - Click the `✓` button on question #1 again.
   - Assert button remains in `✓` state and does NOT revert to `+` (does NOT delete from Study List).
   - Assert no duplicate record is created in IndexedDB (record count remains 1).
   - Assert sidebar badge remains unchanged.
5. **Browsing State & Action Isolation (User Story 3)**:
   - Navigate to Page 2 of Bank Soal with an active search query.
   - Click `+` on a question card.
   - Assert pagination remains on Page 2.
   - Assert search query remains intact.
   - Assert no question editing modal is opened.
6. **Responsive Layout Parity (390px & 1440px)**:
   - Emulate mobile portrait viewport (390×844): verify `.zen-q-actions` displays 4 buttons without overflow or clipped text.
   - Emulate desktop viewport (1440×900): verify all buttons align cleanly side-by-side.

---

## 3. Manual Verification Steps

1. Launch local test server or open `index.html` in browser.
2. Click **Bank Soal** in sidebar or top navigation.
3. Verify each question card displays a small square button with `+` next to the `Edit`, `Duplikat`, and `Hapus` buttons.
4. Click `+` on the first question:
   - Observe immediate transition to `✓`.
   - Observe green success toast in top right.
   - Observe sidebar badge next to "Study List" increments.
5. Reload the browser page (`Ctrl+F5`):
   - Navigate to Bank Soal.
   - Verify the first question still shows `✓` (persisted state).
6. Click **Study List** in the navigation menu:
   - Verify the question is listed with all details.
7. Return to **Bank Soal** and click `✓` on that question:
   - Observe button remains `✓` (strictly idempotent add-only, does not delete).
   - Observe no duplicate is created.
   - Observe sidebar badge remains unchanged.
8. Switch to Mobile View (DevTools device mode, iPhone 12/14/15 390×844):
   - Confirm the 4 buttons (`+`, `Edit`, `Duplikat`, `Hapus`) fit neatly across the top bar of each card with zero horizontal scrollbar.
