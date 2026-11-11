# Quickstart & Verification Guide: Study List UX Refinement

**Feature**: `specs/006-study-list-ux-refinement`
**Date**: 2026-11-10
**Status**: Ready for Verification

---

## 1. Quick Verification via Automated Test Suite

A dedicated regression test script verifies all 12 operational scenarios end-to-end using Headless Chrome DevTools Protocol (CDP):

```bash
node tests/test-study-list-ux-refinement.mjs
```

### Test Assertions Covered
1. **Flag Icon Minimalist Presentation**: Standalone outline SVG; zero background badges, circular bubbles, or animations.
2. **Individual Flag First Click (Add)**: Adds question to IndexedDB, switches flag to active state, displays success toast, increments badge (+1).
3. **Individual Flag Second Click (Remove)**: Removes question from IndexedDB, reverts flag to outline, displays info toast, decrements badge (-1).
4. **State Persistence Across Page Refresh**: Active flags and exact badge count remain intact after page reload.
5. **Bulk Add 5 Selected Questions**: Checkbox selection of 5 questions enables bulk Plus button in `.zen-bulk-bar`, adds all 5, updates badge by +5, and displays `"5 soal ditambahkan · 0 sudah ada"`.
6. **Bulk Add with Mixed Questions**: Selecting 2 existing + 3 new questions adds only 3, skips 2 without deleting or duplicating, updates badge by +3, and displays `"3 soal ditambahkan · 2 sudah ada"`.
7. **Flag Icon DOM Synchronization**: All visible question cards added via bulk addition dynamically update their flag icons to the active state.
8. **Selection State Invariance**: `state.bankSelectedIds` remains checked after bulk addition.
9. **Filter & Pagination Invariance**: Active search term, package filter, pagination index, and scroll position are completely preserved.
10. **Zero Regression for Existing Controls**: Individual card Edit, Duplicate, Delete, and toolbar Clear Selection, Delete Selected remain 100% operational.
11. **Mobile Viewport Parity (390×844)**: Toolbar and card actions fit cleanly without horizontal scrolling or wrapping overflow.
12. **Desktop Viewport Parity (1440×900)**: Clean layout alignment and proper spacing.

---

## 2. Manual Verification Workflow

### Step 1: Open Bank Soal
1. Open the application in browser: `http://localhost:8080/index.html` (or live preview).
2. Click **Bank Soal** in the sidebar.
3. Click **Tampilkan Daftar Soal** to expand the question list.

### Step 2: Test Individual Flag Toggle
1. Observe the flag icon button on question card #1: verify it renders as a subtle outline flag (no chunky circular container).
2. Click the flag button on question #1:
   - Icon transitions to active teal fill.
   - Toast displays: `"Soal ditambahkan ke Study List."`
   - Sidebar badge on Study List increments by 1.
3. Click the flag button on question #1 again:
   - Icon transitions back to outline.
   - Toast displays: `"Soal dihapus dari Study List."`
   - Sidebar badge decrements by 1.

### Step 3: Test Selection Toolbar Bulk Plus
1. Select 5 questions using their checkboxes.
2. Observe the selection toolbar (`.zen-bulk-bar`):
   - Notice the new minimalist **+ Tambah ke Study List** button between Clear Selection and Delete Selected.
   - Verify it is enabled.
3. Click **+ Tambah ke Study List**:
   - Toast displays: `"5 soal ditambahkan · 0 sudah ada"`.
   - Sidebar badge increases by 5.
   - All 5 question cards display active filled teal flags.
   - Checkboxes remain selected.
4. Select 2 additional questions (keeping previous 5 selected, 7 total):
5. Click **+ Tambah ke Study List**:
   - Toast displays: `"2 soal ditambahkan · 5 sudah ada"`.
   - Sidebar badge increases by 2.
   - Previously added questions are NOT deleted or duplicated.

### Step 4: Test Persistence
1. Press `F5` / reload the browser.
2. Navigate back to Bank Soal.
3. Verify that all 7 questions display active filled flags and the sidebar badge shows `7`.
