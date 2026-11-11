# Phase 0 Research: Practice Mode Inline Indonesian Translations

**Feature**: `specs/007-practice-mode-translations`  
**Date**: 2026-11-11  
**Status**: Completed  

---

## 1. Research Objectives

1. Determine the exact DOM structure, positioning, and styling for the minimalist globe toggle button inside `.exam-bottom-tools`.
2. Establish the exact semantic element and styling rules for option translations within `.answer-content` to avoid invalid HTML nesting while preserving existing Japanese option appearance.
3. Formulate the question prompt translation integration beneath `.question-prompt`.
4. Validate session state lifecycle to ensure translation persistence across question navigation and proper reset on session exit/start.
5. Verify option-shuffling invariance so translations remain strictly paired with their respective options.

---

## 2. Research Findings & Decisions

### Decision 1: Globe Button DOM Integration & Semantics
- **Decision**: Render `<button type="button" class="exam-tool-button practice-trans-btn ...">` inside `<div class="exam-bottom-tools">` immediately adjacent to `.study-list-quick-button`.
- **Rationale**:
  - The CBT bottom toolbar (`.exam-bottom-tools`) is a flex container (`gap: 8px`) housing auxiliary tools (Settings `⚙`, Map `▦`, Fullscreen `⛶`, Study List `+`, Furigana `F`).
  - Placing the globe button immediately beside the Study List plus button creates a cohesive tool cluster at the bottom-left of the viewport.
  - Sizing the button touch target to 44 × 44 px satisfies WCAG AA and touch ergonomics without causing toolbar overflow on 360px / 390px mobile screens.
- **Icon Specification**:
  - Minimalist SVG geometry matching the Zen design language:
    ```html
    <svg class="practice-globe-icon" viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="8" cy="8" r="6.5"/>
      <path d="M1.5 8h13"/>
      <ellipse cx="8" cy="8" rx="3.2" ry="6.5"/>
    </svg>
    ```
  - Inactive State: `color: #6c7883` (subtle gray).
  - Active State: `color: #0f766e` (restrained teal).
  - Background: `transparent` (zero bubble, zero circle container, zero drop shadow, zero transition animation).
- **Alternatives Considered**:
  - *Floating action button*: Rejected because floating elements violate Constitution Principle IV (Anti-Slop Energy 1/3) and obstruct question text on mobile.
  - *Emoji globe (`🌐`)*: Rejected because system emoji rendering is inconsistent across Windows, Android, and iOS, violating Zen White graphic uniformity.

---

### Decision 2: Option Translation Markup & Layout
- **Decision**: Render option translations using a phrasing element (`<span class="practice-option-translation" lang="id">...</span>`) with `display: block` directly beneath `.answer-text` inside the existing `<span class="answer-content">` container.
- **Rationale**:
  - In `app.js` (`renderExam`), `.answer-content` is rendered as an inline `<span>`. Placing a block-level `<div>` directly inside an inline `<span>` violates HTML5 content models and can cause layout rendering quirks in strict browsers.
  - Using `<span class="practice-option-translation" lang="id">` styled with `display: block; margin-top: 5px;` guarantees 100% valid HTML semantics while rendering visually as a clean secondary line.
  - Typography: `font-size: 12px; line-height: 1.4; color: #64748b; font-weight: 400;`.
  - Presentation: Zero bullets, zero dots, zero dashes, zero extra numbering prefixes, zero new option cards. The original Japanese text, alignment, radio indicator, padding, and selection highlight remain completely intact.
- **Alternatives Considered**:
  - *Changing `.answer-content` to `<div>`*: Rejected to minimize churn in protected Zone A CBT markup and prevent unintended regression in existing CSS rules.
  - *Tooltip on hover*: Rejected because tooltips do not work ergonomically on touch devices and hide critical context during review.

---

### Decision 3: Question Prompt Translation Markup & Layout
- **Decision**: Render `<div class="practice-question-translation" lang="id">${richHTML(q.promptTranslation)}</div>` inside `.question-card` immediately underneath `<div class="question-prompt rich-content" lang="ja">`.
- **Rationale**:
  - The question prompt is already a block `<div>` inside `.question-card`.
  - Sits directly below the Japanese prompt, creating a natural vertical reading rhythm before any question illustrations or answer choices.
  - Typography: `font-size: 13px; line-height: 1.5; color: #5a6672; margin-top: 8px; font-weight: 400;`.
  - Transparent background, zero border, zero card container.
- **Alternatives Considered**:
  - *Side-by-side split column*: Rejected because dual-column text compresses horizontal space on mobile portrait screens (390px / 360px) and creates cognitive overload.

---

### Decision 4: State Management & Persistence Lifecycle
- **Decision**: Maintain translation visibility in `state.practiceTranslationOpen` (Boolean), initialized to `false`.
- **Rationale**:
  - Intra-session navigation (`moveExamTo`) updates `s.currentIndex` and calls `renderExam()`. Because `state.practiceTranslationOpen` lives on the active `state` object, translations persist automatically across "Next", "Previous", and Question Map jumps.
  - In `startExam()`, `state.practiceTranslationOpen = false;` ensures every newly launched session starts clean with translations hidden.
  - In `finishExam()`, `state.practiceTranslationOpen = false;` cleans up active state when completing an exam.
  - In `renderExam()`, the globe button and translations are strictly guarded by `s.mode === 'practice' && !s.deadline`.
- **Alternatives Considered**:
  - *Per-question toggle*: Rejected because candidate requirements explicitly call for a global session toggle that stays active across navigated questions.
  - *Persistent localStorage setting*: Rejected because translations are intended as an interactive in-session study aid; persisting globally could accidentally leave translations active across future timed exam attempts.

---

### Decision 5: Option Shuffling Mapping Invariance
- **Decision**: Directly consume `o.translation` from the already-shuffled question options array `q.options`.
- **Rationale**:
  - In `app.js` (`buildExamQuestions`), options are shuffled when `setup.shuffleOptions` is enabled:
    ```javascript
    q.options = shuffled.map((item, newIdx) => ({
      ...item.opt,
      originalId: item.opt.id || String.fromCharCode(65 + newIdx),
      id: String.fromCharCode(65 + newIdx)
    }));
    ```
  - Spreading `...item.opt` clones all original properties of that option, including `translation`.
  - In `renderExam()`, looping `(q.options || []).map((o, i) => ...)` accesses `o.translation` directly on the option currently at position `i`.
  - **Result**: Translations remain 100% attached to their matching Japanese option text regardless of shuffle order, position, or newly assigned letter (`A`, `B`, `C`).
- **Alternatives Considered**:
  - *Looking up translation by option ID*: Unnecessary overhead since the translation is already embedded directly in the cloned option object.

---

## 3. Summary of Design Decisions

| Aspect | Decision | Rationale |
|---|---|---|
| **Toggle Placement** | Inside `.exam-bottom-tools` beside `.study-list-quick-button` | Keeps auxiliary CBT tools together; bottom-left thumb zone. |
| **Globe Icon** | 16×16px SVG wireframe (`circle`, `ellipse`, `line`) | Minimalist, crisp, scalable, consistent with Zen design. |
| **Option Translation** | `<span class="practice-option-translation">` with `display: block` | Valid HTML inside inline `<span>`, plain secondary line. |
| **Prompt Translation** | `<div class="practice-question-translation">` | Directly below Japanese prompt, readable muted typography. |
| **Session Scope** | `state.practiceTranslationOpen` reset on start/finish | Persists across question navigation; resets for new sessions. |
| **Mode Restriction** | `s.mode === 'practice' && !s.deadline` | Strictly absent in Full Mock Test and timed simulations. |
