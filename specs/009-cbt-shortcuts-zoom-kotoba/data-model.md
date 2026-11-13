# Phase 1 Data Model: Feature 009

**Feature**: `009-cbt-shortcuts-zoom-kotoba`  
**Date**: 2026-11-13  
**Spec**: [`spec.md`](./spec.md)

---

## 1. Keyboard Shortcut Profile (`sswPmExamShortcuts`)

Stored in `localStorage` under key `sswPmExamShortcuts` (independent from `sswPmExamPrefs` and IndexedDB `sessions`).

### Schema
```json
{
  "version": 1,
  "updatedAt": "2026-11-13T00:00:00.000Z",
  "bindings": {
    "answer1": "1",
    "answer2": "2",
    "answer3": "3",
    "answer4": "4",
    "nextQuestion": "ArrowRight",
    "prevQuestion": "ArrowLeft",
    "toggleStudyList": "R",
    "toggleFlag": "T",
    "toggleFurigana": "E",
    "toggleGlobalTranslation": "Y",
    "toggleNumberList": "H"
  }
}
```

### Action Catalog & Defaults (Fixed 11 Actions)
| Action ID | Default Key | Behavior | Availability |
|---|---|---|---|
| `answer1` | `"1"` | Select answer option index `0` | All CBT modes (if option exists) |
| `answer2` | `"2"` | Select answer option index `1` | All CBT modes (if option exists) |
| `answer3` | `"3"` | Select answer option index `2` | All CBT modes (if option exists) |
| `answer4` | `"4"` | Select answer option index `3` | All CBT modes (active **only** if `q.options.length >= 4`) |
| `nextQuestion` | `"ArrowRight"` | `moveExamTo(s.currentIndex + 1)` | All CBT modes (no-op on last question) |
| `prevQuestion` | `"ArrowLeft"` | `moveExamTo(s.currentIndex - 1)` | All CBT modes (no-op on first question) |
| `toggleStudyList` | `"R"` | Toggle current question in Study List (`+`/`✓`) | All CBT modes |
| `toggleFlag` | `"T"` | Toggle flag `⚑` on current question | All CBT modes |
| `toggleFurigana` | `"E"` | Toggle furigana (`state.examPrefs.showFurigana`) | All CBT modes |
| `toggleGlobalTranslation` | `"Y"` | Toggle global translation (Globe) | Untimed Practice Mode only |
| `toggleNumberList` | `"H"` | Toggle `.question-map-grid` (`state.mapHidden`) | All CBT modes |

### Validation, Focus & Remapping Rules
- **Reserved / Unsafe Keys (Rejected)**:
  - Any key with `ctrlKey`, `metaKey`, or `altKey`.
  - `F` (existing fullscreen/Fill Screen toggle), `Escape`, `Tab`, `Enter`, `Space`, `F1`–`F12`, `CapsLock`, `Shift`, `Control`, `Alt`, `Meta`.
- **Normalization**:
  - Single ASCII letters `[a-z]` normalized to uppercase `[A-Z]`.
  - `Numpad1`–`Numpad4` / `Digit1`–`Digit4` mapped to `"1"`–`"4"` during exam dispatch.
- **Focus & Remapping Isolation Invariants**:
  - Global exam shortcuts MUST NOT fire when focus is inside `input`, `textarea`, `select`, or `[contenteditable="true"]`.
  - When remapping a shortcut in `#exam-settings-popover` (`state.shortcutCaptureAction != null`):
    - The keypress is captured with `e.preventDefault()` and `e.stopPropagation()`.
    - Keydown dispatch MUST NOT trigger background CBT actions (e.g. typing `1` or `R` during remapping must never select an answer option or toggle the Study List).
    - `Escape` during capture cleanly cancels capture without closing the settings popover.
- **Bijection Invariant**:
  - Every action in the 11-action set has exactly one key, and no two actions share the same normalized key.
  - On load, any corrupt/unknown field or duplicate key falls back per-action to `DEFAULT_EXAM_SHORTCUTS`.

---

## 2. Fullscreen & Fill Screen State Model

In-memory runtime state on `state` / DOM classes (not persisted across reload, matching existing `isFullscreenActive()`):

| State | Trigger | DOM Class | Capabilities |
|---|---|---|---|
| **Normal CBT** | Default exam state | `body.exam-mode` | Standard viewport, native zoom allowed |
| **Native Fullscreen** | `Fullscreen API` supported & pinch zoom permitted (e.g. Desktop) | `body.exam-mode.is-fullscreen` | Native fullscreen + landscape lock (where supported) |
| **Fill Screen Mode** | Mobile browser blocks pinch in native fullscreen OR Fullscreen API unavailable (iOS Safari, Android mobile fallback) | `body.exam-mode.is-fill-screen` | Fills `100dvh` / `visualViewport`, hides extra app chrome, preserves native browser 2-finger pinch-to-zoom & 1-finger pan |

### Multi-Touch Gesture Guard State Model (In-Memory)
- **Role of `visualViewport.scale`**:
  - `visualViewport.scale` is strictly an **observer / read-only property**. It does NOT enable or trigger pinch zoom.
  - Used in `syncExamViewportHeight()` strictly to detect zoom status: if `scale > 1.02`, bypass `window.scrollTo(0, 0)` and fixed-height clamping to preserve user zoom level and pan frame.
- **Pointer Lifecycle Tracking**:
  - `activeExamPointers: Map<number, { x: number, y: number, time: number }>` tracks active `pointerId`s.
  - On `pointerdown`: add pointer to map. If `activeExamPointers.size >= 2`, flag `wasMultiTouch = true`.
  - On `pointerup`: delete `pointerId`.
  - On `pointercancel`: delete `pointerId`. Ensures clean reset if system gestures, palm rejection, or browser zoom compositors take over the touch stream.
- **Zero `preventDefault()` on Multi-Touch**:
  - NEVER call `e.preventDefault()` on gesture events (`pointerdown`, `pointermove`, `pointerup`, `pointercancel`, `touchstart`, `touchmove`) during multi-touch sequences. Doing so kills browser-native pinch zoom.
- **Adaptive Cooldown & Clean Tap Guarantee**:
  - When `wasMultiTouch === true` and the last pinch finger lifts (`activeExamPointers.size === 0`), set `multiTouchCooldownUntil = Date.now() + 150` (initial baseline 150ms, tunable based on real physical device testing on Android Chrome, Samsung Internet, and iOS Safari).
  - Synthetic `click` / `pointerup` events generated by the browser for the lifted pinch fingers are swallowed and discarded.
  - A clean, distinct `pointerdown` initiated when `activeExamPointers.size === 0` and `Date.now() >= multiTouchCooldownUntil` is accepted immediately as a valid single-touch sequence (`wasMultiTouch = false`). Valid taps made immediately after pinch-zooming are processed without artificial lag.

---

## 3. Kotoba Redesign Data Model

### A. Runtime Dictionary (`data/sharedKotobaDictionary.json`)
Maintains backward compatibility with Feature 008 `terms` map while enforcing concise, whole-unit lexicographical rules and atomic version synchronization:

```json
{
  "_meta": {
    "schemaVersion": "2.0.0",
    "dataVersion": "20261113-v2",
    "license": "CC-BY-SA-4.0",
    "attribution": "EDRDG / JMdict + In-House SSW PM Indonesian Curations",
    "generatedAt": "2026-11-13T00:00:00.000Z"
  },
  "terms": {
    "kb-ccp": {
      "id": "kb-ccp",
      "kanji": "重要管理点",
      "furigana": "じゅうようかんりてん",
      "dictForm": "重要管理点",
      "unitType": "compound_technical",
      "pos": ["n"],
      "arti": "Titik Kendali Kritis (Critical Control Point)",
      "status": "verified",
      "provenance": {
        "lemmaSource": "jmdict_edrdg",
        "furiganaSource": "jmdict_edrdg",
        "meaningSource": "in_house_ssw_curated",
        "lexicalLicense": "CC-BY-SA-4.0",
        "sourceFiles": ["ssw-pm-kunci-ujian-1.json"]
      }
    }
  }
}
```

#### Field Constraints & Cross-Version Resilience
- `kanji`: Surface form as it appears in the text (e.g. `沿った`, `選びなさい`, `重要管理点`, `に`, `HACCP`).
- `furigana`: Whole-word Hiragana reading spanning the entire `kanji` unit; empty string `""` only for pure kana, Latin acronyms (`HACCP`, `CCP`), or alphanumeric units without kanji.
- `dictForm` *(new optional)*: Base/dictionary form when `kanji` is inflected (e.g. `沿う` for `沿った`, `選ぶ` for `選びなさい`).
- `unitType`: One of `"word"`, `"particle"`, `"expression"`, `"technical"`, `"compound_technical"`, `"inflected_verb"`, `"inflected_adj"`, `"abbreviation"`. Single-kanji morpheme fragments (`"morpheme_fragment"`) MUST NOT hold `status: "verified"`.
- `arti`: Concise Indonesian meaning (1–3 short equivalents or 1 short phrase; target `<= 40` chars, hard cap `<= 60` chars except explicit technical-term expansion like `HACCP`). For inflected forms, may append `(bentuk dasar <dictForm>)`.
- `status`: `"verified"` | `"unresolved"`. Only `"verified"` terms render in UI.
- **Referential Integrity & Diagnostic Requirements**: In validation tools, if ANY term ID in `kotobaMapping.json` is missing in `sharedKotobaDictionary.json` or if `dataVersion` / `schemaVersion` mismatches, the tools MUST fail with a clear diagnostic error (never skip silently). Active production data remains on the legacy Feature 008 set until both files are validated and released atomically. At runtime, if an unexpected missing term ID or mismatch occurs, `resolveKotobaEntries()` logs an explicit console error diagnostic rather than hiding it silently, while preventing an unhandled crash of the surrounding CBT question view.

### B. Sentence-to-Term Mapping (`data/kotobaMapping.json`)
```json
{
  "_meta": {
    "schemaVersion": "2.0.0",
    "dataVersion": "20261113-v2",
    "packageRollout": {
      "ssw-pm-kunci-ujian-1.json": { "status": "migrated", "spanCoveragePct": 100, "validatedAt": "..." },
      "ssw-pm-kunci-ujian-2.json": { "status": "legacy_f008", "spanCoveragePct": null }
    }
  },
  "questions": {
    "kunci1-q001": ["kb-...", "kb-..."]
  },
  "options": {
    "kunci1-q001": {
      "A": ["kb-..."]
    }
  },
  "byCompositeKey": {
    "kunci1-q001::A": ["kb-..."]
  }
}
```
- **Ordering invariant**: Term IDs in `questions[qId]` and `byCompositeKey[qId::optId]` MUST be ordered by first appearance in the source text; where both a compound and its meaningful components are included, components appear immediately before or alongside the compound (matching the spec's HACCP example table), with zero duplicates per sentence.

### C. Audit & Reconciliation Artifacts (`specs/009-cbt-shortcuts-zoom-kotoba/audit/`)
Stored in repository source control but strictly excluded from `sw.js` precache to keep mobile runtime JSON lightweight:
1. **Full-Text Span Coverage Ledger (`full-coverage-ledger.json`)**:
   - For every question prompt and option across the 1,006 questions + 3,110 options, records character-by-character accounting:
     - `text`: full Japanese string
     - `length`: total character count $N$
     - `spans`: array of mapped segments `[ { start, end, text, termId, unitType } ]`
     - `structuralEntities`: punctuation, whitespace, and standalone numbers/units `[ { start, end, text, type } ]`
     - `unresolvedSpans`: unclassified characters `[ { start, end, text } ]`
   - Invariant: A package passes coverage audit if and only if `unresolvedSpans.length === 0` for all sentences.
2. **Reconciliation Record (`reconciliation-ledger.json`)**: Maps every Feature 008 term ID (`kb-*`) to its disposition: `kept`, `revised_meaning`, `merged_to_compound`, `split_corrected`, or `retired_fragment`, with validation status.
3. **Unresolved Spans Report (`unresolved-spans-report.json`)**: Development audit report cataloging unmapped spans across question packages.
