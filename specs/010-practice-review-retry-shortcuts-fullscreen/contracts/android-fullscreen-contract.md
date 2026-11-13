# Contract: Android Fullscreen API & Fallback State Machine (US4)

**Feature**: `010-practice-review-retry-shortcuts-fullscreen`  
**Contract ID**: `CTR-010-US4-FULLSCREEN`  
**Spec Reference**: [spec.md](../spec.md#user-story-4---fix-android-cbt-fullscreen-button-priority-p1)

---

## 1. Capability Detection & Fallback Criteria

### 1.1 Detection Function Contract
```javascript
/**
 * Evaluates whether the current environment requires CSS Fill Screen fallback
 * instead of native HTML5 element.requestFullscreen().
 * 
 * Rules:
 * 1. If documentElement lacks requestFullscreen and webkitRequestFullscreen -> return true.
 * 2. If running on iOS (iPhone/iPad/iPod) where Fullscreen API throws or is unsupported -> return true.
 * 3. On Android Chrome, Samsung Internet, and modern desktop browsers -> return false (attempt native).
 */
function shouldUseFillScreenFallback() {
  const docEl = document.documentElement;
  const hasNativeFs = Boolean(
    docEl && (docEl.requestFullscreen || docEl.webkitRequestFullscreen)
  );
  if (!hasNativeFs) return true;
  
  // Guard iOS where element fullscreen is known to fail
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent || '');
  if (isIOS) return true;

  return false;
}
```

---

## 2. Fullscreen Toggle Contract: `toggleFullScreen()`

```javascript
async function toggleFullScreen() {
  // Path 1: Fallback environment (iOS or unsupported)
  if (shouldUseFillScreenFallback()) {
    state.examFillScreen = !state.examFillScreen;
    updateFullscreenUI();
    return;
  }

  // Path 2: Standard / Android environment with native API
  const docEl = document.documentElement;
  const reqFs = docEl.requestFullscreen || docEl.webkitRequestFullscreen;
  const exitFs = document.exitFullscreen || document.webkitExitFullscreen;
  const fsEl = document.fullscreenElement || document.webkitFullscreenElement;

  try {
    if (!fsEl) {
      if (reqFs) await reqFs.call(docEl);
    } else {
      if (exitFs) await exitFs.call(document);
    }
  } catch (err) {
    console.warn('[Fullscreen] Native request rejected or failed:', err);
    // Graceful fallback to CSS fill-screen on unexpected browser security rejection
    state.examFillScreen = !state.examFillScreen;
  } finally {
    updateFullscreenUI();
  }
}
```

---

## 3. UI Synchronization Contract: `updateFullscreenUI()`

### 3.1 State Resolution
```javascript
function isFullscreenActive() {
  const nativeFs = Boolean(document.fullscreenElement || document.webkitFullscreenElement);
  return Boolean(state.examFillScreen || nativeFs);
}
```

### 3.2 DOM Classes & Attributes
When `isFullscreenActive()` is `true`:
- If `document.fullscreenElement` is present: `document.body.classList.add('is-fullscreen')`.
- If `state.examFillScreen` is true: `document.body.classList.add('is-fill-screen')`.
- All `[data-action="toggle-fullscreen"]` buttons:
  - Text content: `'🗗'`
  - Attribute: `aria-pressed="true"`
  - Attribute: `title="Keluar Layar Penuh (Esc)"`

When `isFullscreenActive()` is `false`:
- `document.body.classList.remove('is-fullscreen', 'is-fill-screen')`.
- All `[data-action="toggle-fullscreen"]` buttons:
  - Text content: `'⛶'`
  - Attribute: `aria-pressed="false"`
  - Attribute: `title="Layar Penuh"`

### 3.3 Event Listeners
The application registers listeners for both standard and webkit events:
```javascript
document.addEventListener('fullscreenchange', updateFullscreenUI);
document.addEventListener('webkitfullscreenchange', updateFullscreenUI);
```

---

## 4. Teardown Contract

Whenever the candidate exits CBT mode (`finishExam()`, navigating home, or switching pages):
```javascript
function cleanupFullscreen() {
  if (document.fullscreenElement && document.exitFullscreen) {
    document.exitFullscreen().catch(() => {});
  }
  state.examFillScreen = false;
  document.body.classList.remove('is-fullscreen', 'is-fill-screen');
  updateFullscreenUI();
}
```
Zero stale classes or locked states remain on `document.body`.
