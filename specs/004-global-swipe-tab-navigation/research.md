# Research: Feature 004 — Global Mobile Swipe Navigation Across All Main Tabs

**Feature Branch**: `feat/swipe-tab-navigation`
**Date**: 2026-11-09
**Status**: Completed
**Author**: Antigravity Senior Frontend Agent

---

## 1. Problem Space & Context

### 1.1 The Mobile Thumb Ergonomics Issue
The SSW PM Mock Test web application employs a top-pinned navigation bar (`<aside id="sidebar">` transformed by `ZEN-APP-SHELL.css` into a fixed top hub at `position: fixed; top: 0;`). On mobile viewports (e.g., modern Android devices at 390×844 or 360×780), the navigation tab buttons reside at the very top of the physical screen. Candidates holding their device one-handed with their thumb resting naturally in the lower 30–50% of the display cannot comfortably tap the tab bar without shifting grip or using a second hand.

To provide a modern, app-like experience (comparable to Instagram or Twitter/X feed tab navigation), users require the ability to swipe left and right across the central content area to transition sequentially between all primary tabs.

---

## 2. Examination of Existing Routing Architecture

### 2.1 Router Structure in `app.js`
The application implements an in-memory single-page routing model driven by the `state.page` property and the `go(page)` router function:
```javascript
// Canonical primary tabs defined by index.html and app.js:
const MAIN_TABS = ['home', 'setup', 'bank', 'history', 'study', 'backup'];
```

When `go(targetPage)` is called:
1. It updates `state.page = targetPage`.
2. It calls `render()`, which conditionally invokes the corresponding page renderer:
   - `'home'` → `renderHome()`
   - `'setup'` → `renderSetup()`
   - `'bank'` → `renderBank()`
   - `'history'` → `renderHistory()`
   - `'study'` → `renderStudy()`
   - `'backup'` → `renderBackup()`
3. It updates top hub active indicators:
   ```javascript
   $$('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.page === targetPage));
   $('#breadcrumbs').textContent = pageLabel(targetPage);
   ```
4. It closes the mobile sidebar if open: `$('#sidebar').classList.remove('sidebar-open')`.
5. It enforces non-exam invariant cleanup (removing lingering `in-exam` / `exam-mode` classes).

**Architectural Insight**:
The swipe navigation mechanism should **not** manipulate the DOM directly, recreate tab markup, or maintain duplicate router logic. Instead, upon detecting a valid horizontal swipe gesture, it should simply call `window.go(nextOrPrevPage)`. This guarantees 100% architectural consistency with existing navigation and state lifecycle.

---

## 3. Touch Gesture Recognition on Android Chrome

### 3.1 Passive Touch Listeners vs. `touch-action` vs. Pointer Events
Mobile browsers—specifically Android Chrome—have strict requirements regarding main-thread responsiveness:
- **Passive Listeners (`{ passive: true }`)**: By attaching touch listeners with `{ passive: true }`, the browser's compositor thread handles vertical scrolling immediately without waiting for JavaScript execution. This guarantees 60fps/120fps smooth scrolling.
- **Why Global `preventDefault` Fails**: Calling `e.preventDefault()` on `touchmove` blocks browser scrolling, breaks pinch-to-zoom, and produces browser warnings. We strictly avoid global `preventDefault`.
- **Gesture Lifetime**:
  1. `touchstart`: Capture start coordinates (`startX = touch.clientX`, `startY = touch.clientY`, `startTime = Date.now()`). Evaluate whether the touch originates inside an exclusion zone.
  2. `touchmove`: Monitor displacement vectors (`dx = currentX - startX`, `dy = currentY - startY`).
     - If vertical displacement strongly exceeds horizontal displacement early in the gesture (`Math.abs(dy) > Math.abs(dx)`), lock the gesture as a **vertical scroll** and suppress horizontal tab switching for the duration of this touch.
  3. `touchend`: Evaluate whether the completed touch qualifies as a deliberate horizontal swipe:
     - `Math.abs(dx) >= THRESHOLD` (70px).
     - `Math.abs(dx) > Math.abs(dy) * 1.5` (horizontal angle clearly dominant over vertical travel).
     - Gesture duration is within a reasonable human gesture window (`Date.now() - startTime < 800ms`).
     - Gesture was not flagged as vertical scroll or aborted by an exclusion zone.
  4. `touchcancel`: Immediately reset all tracking state without triggering navigation.

---

## 4. Exclusion Zones & Conflict Resolution

### 4.1 Assessment Environment (CBT Protection)
Under Constitution Principle I and Principle IV, Zone A (the CBT examination environment) is strictly protected from unintended disruptions. Furthermore, Results scorecards and Review Answers require undisturbed vertical and horizontal review gestures.
- **Rule**: If `state.page === 'exam' || state.page === 'result' || state.page === 'review'`, the swipe handler immediately aborts on `touchstart` and ignores all gesture tracking.

### 4.2 Interactive Overlays & Modals
Whenever a modal dialog or overlay is open (`#editor-modal`, `#settings-modal`, `#csv-import-modal`, `.modal-backdrop`, `.zen-dialog`), swiping inside the modal or background must NOT change tabs.
- **Rule**: If `document.querySelector('.modal-backdrop:not([hidden]), .zen-dialog:not([hidden]), #editor-modal:not([hidden]), #settings-modal:not([hidden]), #csv-import-modal:not([hidden])')` exists in the DOM, abort gesture tracking.

### 4.3 Form Controls & Interactive Elements
Tapping or dragging buttons, text inputs, search fields, sliders, audio players, or links must execute their native behavior:
- **Rule**: If `e.target.closest('input, textarea, select, button, a, [role="slider"], [role="button"], audio, video, canvas, [data-no-swipe]')` is detected, abort gesture tracking.

### 4.4 Embedded Horizontally Scrollable Containers
The Home dashboard features a horizontal package filter pill ribbon (`#home-pkg-pills` / `.hd-pkg-pills`). Tables with overflow (`.table-scroll`), code blocks (`pre`, `code`), and any container where `scrollWidth > clientWidth` and `overflowX` is scrollable must retain their local horizontal scrolling capability.
- **Rule**: Inspect ancestral chain up to `document.body`. If an ancestor element has `overflowX === 'auto' || overflowX === 'scroll'` and `scrollWidth > clientWidth`, abort global tab swipe to allow native container scrolling.

---

## 5. Tab Sequence Mapping & Directional Boundary Handling

### 5.1 Canonical Sequence
```javascript
const MAIN_TABS = ['home', 'setup', 'bank', 'history', 'study', 'backup'];
```

### 5.2 Directional Logic
- **Swipe Left (`dx < 0`)** (Finger sweeps leftwards): User wants to see the **next** tab to the right.
  - From `home` → `setup`
  - From `setup` → `bank`
  - From `bank` → `history`
  - From `history` → `study`
  - From `study` → `backup`
  - From `backup` → **Dead-end**: Stays on `backup` (no circular wrapping, no error).
- **Swipe Right (`dx > 0`)** (Finger sweeps rightwards): User wants to see the **previous** tab to the left.
  - From `backup` → `study`
  - From `study` → `history`
  - From `history` → `bank`
  - From `bank` → `setup`
  - From `setup` → `home`
  - From `home` → **Dead-end**: Stays on `home` (no circular wrapping, no error).

### 5.3 Single-Action Invariant
A single touch lifecycle (`touchstart` → `touchmove` → `touchend`) can trigger **at most one** tab transition. The system marks a `navigated` flag upon dispatch to prevent multiple fires during finger bounce or rapid release events.

---

## 6. Multi-Viewport & Accessibility Considerations

1. **Desktop Parity**: On desktop viewports where navigation occurs via mouse click, touch swipe listeners remain benign and idle. Standard mouse selection, dragging, and topbar navigation are 100% unaffected.
2. **Reduced Motion**: System respects `@media (prefers-reduced-motion: reduce)`. Page transitions occur instantaneously without animated horizontal sliding.
3. **Memory & Performance**:
   - Zero npm dependencies introduced.
   - Zero additional memory overhead (less than 1KB of plain JavaScript).
   - Listeners added once to `window` or `document` using passive options.

---

## 7. Conclusions & Selected Technical Approach

- **Selected Approach**: A clean, modular, passive Touch Manager attached to `document`.
- **Router Integration**: Direct delegation to existing `go(targetPage)`.
- **Safety Invariant**: Early abort when in CBT mode, Results, Review, modals, interactive form controls, or nested scrollable containers.
- **Verification Strategy**: Automated headless Chrome CDP test script (`tests/test-global-swipe-navigation.mjs`) asserting all 15 scenarios on mobile and desktop viewports.
