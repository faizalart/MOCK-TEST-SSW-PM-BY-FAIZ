# Contract: Global Mobile Swipe Navigation Interface

**Feature Branch**: `feat/swipe-tab-navigation`
**Date**: 2026-11-09
**Status**: Active
**Author**: Antigravity Senior Frontend Agent

---

## 1. Scope & Responsibility

This contract specifies the behavioral interface, gesture threshold constants, exclusion rules, and integration boundaries for global horizontal swipe navigation across all six main tabs.

---

## 2. Interface Definition

```javascript
/**
 * Global Touch Swipe Navigation Manager
 */
export interface SwipeNavigationManager {
  /**
   * Initializes global passive touch listeners on the document.
   * Safe to call once during boot().
   */
  initSwipeNavigation(): void;

  /**
   * Resolves the adjacent main tab given a current page and direction.
   * @param currentPage - The current active page string
   * @param direction - 'next' (swipe left) or 'prev' (swipe right)
   * @returns Target page string or null if dead-end or invalid route
   */
  getAdjacentMainTab(currentPage: string, direction: 'next' | 'prev'): string | null;

  /**
   * Determines if a touch event target falls within an exclusion zone.
   * @param target - The event target element
   * @param currentPage - The current active page string
   * @returns true if swipe navigation must be suppressed
   */
  isSwipeExcluded(target: EventTarget | null, currentPage: string): boolean;
}
```

---

## 3. Threshold Constants & Configuration

```javascript
export const SWIPE_CONFIG = {
  /** Minimum horizontal displacement required to recognize a swipe (pixels) */
  THRESHOLD_PX: 70,

  /** Maximum time window for a deliberate swipe gesture (milliseconds) */
  MAX_DURATION_MS: 800,

  /** Ratio of horizontal travel over vertical travel required for dominance */
  DOMINANCE_RATIO: 1.5,

  /** Canonical sequence of primary main tabs */
  ORDERED_TABS: Object.freeze([
    'home',
    'setup',
    'bank',
    'history',
    'study',
    'backup'
  ]),

  /** Non-main tabs that are completely exempt from swipe navigation */
  EXEMPT_PAGES: Object.freeze([
    'exam',
    'result',
    'review'
  ])
};
```

---

## 4. Exclusion Rules (Precedence Order)

When `touchstart` fires, the manager MUST evaluate exclusion criteria in the following order:

1. **Exempt Assessment Surfaces**:
   If `SWIPE_CONFIG.EXEMPT_PAGES.includes(state.page)`, return `true` (exclude).
2. **Active Modal or Dialog Overlays**:
   If `document.querySelector('.modal-backdrop:not([hidden]), .zen-dialog:not([hidden]), #editor-modal:not([hidden]), #settings-modal:not([hidden]), #csv-import-modal:not([hidden])')`, return `true` (exclude).
3. **Interactive Form Controls & Action Elements**:
   If `target.closest('input, textarea, select, button, a, [role="slider"], [role="button"], audio, video, canvas, [data-no-swipe]')`, return `true` (exclude).
4. **Horizontally Scrollable Containers**:
   If `target.closest('.hd-pkg-pills, #home-pkg-pills, .table-scroll, pre, code, [data-horizontal-scroll]')`, return `true` (exclude).
   If any ancestor element up to `document.body` has computed `overflowX` of `'auto'` or `'scroll'` and `scrollWidth > clientWidth`, return `true` (exclude).
5. **Multi-Touch Gestures**:
   If `e.touches.length > 1`, return `true` (exclude).

---

## 5. Event Listener Contract

1. **Listener Attachment**:
   ```javascript
   document.addEventListener('touchstart', onTouchStart, { passive: true });
   document.addEventListener('touchmove', onTouchMove, { passive: true });
   document.addEventListener('touchend', onTouchEnd, { passive: true });
   document.addEventListener('touchcancel', onTouchCancel, { passive: true });
   ```
2. **Strict Invariant**:
   - MUST NEVER call `e.preventDefault()` inside touch handlers.
   - MUST NOT interfere with normal vertical scrolling or browser pull-to-refresh.
   - MUST trigger `go(targetPage)` at most once per qualifying touch lifecycle.
