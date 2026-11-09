# Data Model: Feature 004 — Global Mobile Swipe Navigation Across All Main Tabs

**Feature Branch**: `feat/swipe-tab-navigation`
**Date**: 2026-11-09
**Status**: Completed
**Author**: Antigravity Senior Frontend Agent

---

## 1. Overview

Feature 004 introduces an ephemeral, in-memory gesture tracking state machine that interfaces directly with the application's existing SPA navigation model. It does not require persistent IndexedDB storage, as swipe gesture tracking is completely transient per touch interaction.

---

## 2. Entities & State Schemas

### 2.1 `MainTabRoute` (Static Domain Configuration)

Represents the canonical, sequential order of primary application tabs.

```typescript
type MainTabRoute = 'home' | 'setup' | 'bank' | 'history' | 'study' | 'backup';

interface TabDefinition {
  id: MainTabRoute;
  index: number;
  labelKey: string;      // i18n key e.g. 'navHome', 'navSetup'
  domSelector: string;    // button[data-page="..."]
}

const ORDERED_MAIN_TABS: readonly MainTabRoute[] = [
  'home',
  'setup',
  'bank',
  'history',
  'study',
  'backup'
] as const;
```

---

### 2.2 `SwipeGestureSession` (Transient Interaction State)

Tracks the physical coordinates, temporal metrics, and classification flags of an active touch sequence.

```typescript
interface SwipeGestureSession {
  // Coordinates and timestamp captured at touchstart
  startX: number;
  startY: number;
  startTime: number;

  // Real-time displacement during touchmove
  currentX: number;
  currentY: number;
  deltaX: number;
  deltaY: number;

  // Classification flags
  isVerticalScroll: boolean;     // True if vertical movement established dominance early
  isExcluded: boolean;           // True if touch originated in an exclusion zone
  isMultiTouch: boolean;         // True if touches.length > 1 (pinch/zoom)
  hasNavigated: boolean;         // True once a valid swipe has dispatched go()
}
```

#### Lifecycle State Transitions:

```text
[IDLE]
  │
  ├─ touchstart (touches == 1)
  │    ├─ Target in exclusion zone? ──> [ABORT / IGNORED]
  │    └─ Target valid ───────────────> [TRACKING]
  │
[TRACKING]
  │
  ├─ touchmove
  │    ├─ |dy| > |dx| early? ─────────> [FLAGGED: VERTICAL_SCROLL] (no tab switch)
  │    └─ touches > 1? ───────────────> [ABORT / IGNORED]
  │
  ├─ touchcancel ─────────────────────> [IDLE]
  │
  └─ touchend
       ├─ Flagged vertical scroll? ───> [IDLE] (native scroll was completed)
       ├─ Elapsed time > 800ms? ──────> [IDLE] (too slow / reading drag)
       ├─ |dx| < 70px? ───────────────> [IDLE] (under threshold)
       ├─ |dx| <= |dy| * 1.5? ────────> [IDLE] (insufficient horizontal dominance)
       │
       └─ VALID HORIZONTAL SWIPE ────> [DISPATCH: go(targetPage)] ──> [IDLE]
```

---

### 2.3 `SwipeDecision` (Evaluation Result)

Represents the computed resolution upon finger release:

```typescript
interface SwipeDecision {
  action: 'NAVIGATE' | 'DEAD_END' | 'IGNORE';
  direction?: 'NEXT' | 'PREVIOUS';
  currentTab?: MainTabRoute;
  targetTab?: MainTabRoute;
  metrics: {
    deltaX: number;
    deltaY: number;
    durationMs: number;
    ratio: number;
  };
  reason?: string;
}
```

---

## 3. Directional Lookup Rules

Given `currentIndex = ORDERED_MAIN_TABS.indexOf(currentTab)`:

| Direction | Condition | Target Index | Resulting Action |
|---|---|---|---|
| **Swipe Left** (`deltaX < -70`) | `currentIndex < ORDERED_MAIN_TABS.length - 1` | `currentIndex + 1` | `NAVIGATE` to `ORDERED_MAIN_TABS[currentIndex + 1]` |
| **Swipe Left** (`deltaX < -70`) | `currentIndex === ORDERED_MAIN_TABS.length - 1` | N/A (at `'backup'`) | `DEAD_END` (remain on `'backup'`, no-op) |
| **Swipe Right** (`deltaX > 70`) | `currentIndex > 0` | `currentIndex - 1` | `NAVIGATE` to `ORDERED_MAIN_TABS[currentIndex - 1]` |
| **Swipe Right** (`deltaX > 70`) | `currentIndex === 0` | N/A (at `'home'`) | `DEAD_END` (remain on `'home'`, no-op) |

---

## 4. Invariants & Storage Boundaries

1. **Zero Storage Footprint**: No values are written to `localStorage` or `IndexedDB`.
2. **Clean Teardown**: The gesture session object is completely cleared on `touchend`, `touchcancel`, or router invocation.
3. **Immutability of Router**: Existing router state (`state.page`) remains the single source of truth for the active view.
