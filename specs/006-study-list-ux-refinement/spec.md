# Feature Specification: Study List UX Refinement (Minimal Flag Icon, Two-Way Toggle & Bulk Add)

**Feature Branch**: `feat/006-study-list-ux-refinement`

**Created**: 2026-11-10

**Status**: Draft

**Input**: User description: "Create Feature 006 — Study List UX Refinement. Replace old checklist/bookmark UI with clean minimalist flag icon. No bubble, circular container, arrow, expanding UI, or decorative animation. Clicking inactive flag adds question to Study List. Clicking active flag second time removes that question. Add minimalist Plus icon to selection toolbar beside Clear and Delete, outside cards. Bulk Plus adds all selected questions to Study List. Bulk addition skips existing items without deleting or duplicating them. Maintain IndexedDB persistence, badge synchronization, selection state, filters, pagination, and scroll position. Add regression tests for individual toggle and bulk addition. Preserve existing Bank Soal visual design and responsive layout."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Minimal Flag Icon & Two-Way Toggle on Individual Cards (Priority: P1)

As a candidate reviewing question materials in Bank Soal, I want each question card to feature a clean, minimalist outline flag icon that toggles between saved and unsaved states with a single click, so that I can easily bookmark difficult questions for study and unbookmark them when they are mastered without visual clutter.

**Why this priority**: Core user interaction for card-level study bookmarking. Replacing outdated glyphs with a minimalist outline flag delivers the calm, distraction-free aesthetic (Energy 1/3, Motion 1/3) demanded by the Zen White design system, while two-way toggling provides the natural undo capability expected by candidates.

**Independent Test**: Can be tested independently by opening Bank Soal, clicking the outline flag on an unsaved question card, verifying that it transitions to an active restrained accent fill with a confirmation toast and badge increment (+1). Clicking the same flag a second time immediately removes the question from the Study List, resets the icon to an outline, displays an info toast, and decrements the badge (-1).

**Acceptance Scenarios**:

1. **Given** a question card in Bank Soal is not yet in the Study List, **When** the candidate clicks its flag icon button, **Then** the question is stored into IndexedDB `studyList`, the icon transitions to the active filled state (styled with restrained accent color `#0f766e`), a confirmation toast announces `"Soal ditambahkan ke Study List."`, and the sidebar Study List badge increases by 1.
2. **Given** a question card in Bank Soal is already in the Study List (active flag state), **When** the candidate clicks the flag icon button again, **Then** the question is deleted from IndexedDB `studyList`, the icon returns to the inactive outline state, an informative toast announces `"Soal dihapus dari Study List."`, and the sidebar Study List badge decreases by 1.
3. **Given** a candidate observes the flag icon, **Then** the icon is rendered as a clean, minimalist SVG outline without circular bubbles, background badges, speech bubbles, chevrons, expanding arrows, rotation, or bouncing animation.

---

### User Story 2 - Bulk Add Selected Questions via Selection Toolbar (Priority: P2)

As a candidate managing large sets of questions in Bank Soal, I want to select multiple questions using the existing checkboxes and click a bulk Plus icon in the selection toolbar to add all selected questions to my Study List at once, so that I do not have to click each question card individually.

**Why this priority**: High-value productivity feature for candidates studying batch materials or entire sections. Enables rapid batch triage without repetitive manual card clicks.

**Independent Test**: Can be tested by selecting 5 questions in Bank Soal via their checkboxes, verifying that the bulk Plus button in the selection toolbar becomes enabled, clicking it, and verifying that all 5 questions are saved to the Study List with a concise feedback toast (`"5 soal ditambahkan · 0 sudah ada"`), the sidebar badge increments by 5, and all 5 cards reflect active flag states.

**Acceptance Scenarios**:

1. **Given** no question cards are selected in Bank Soal (`bankSelectedIds` is empty), **When** viewing the selection toolbar (`.zen-bulk-bar`), **Then** the bulk Plus button is disabled.
2. **Given** 5 questions are selected via checkboxes and none are currently in the Study List, **When** the candidate clicks the bulk Plus button in the selection toolbar, **Then** all 5 questions are saved to IndexedDB `studyList`, a feedback toast reports `"5 soal ditambahkan · 0 sudah ada"`, the sidebar badge increases by 5, and the visible question cards transition their flag icons to active states.
3. **Given** the candidate performs a bulk add, **When** the operation finishes, **Then** the active checkbox selections, current search queries, package filters, pagination page, and page scroll position remain completely intact.

---

### User Story 3 - Duplicate Skipping & Safe Partial Bulk Addition (Priority: P3)

As a candidate executing bulk addition on a mixed selection of questions (some already in Study List and some new), I want the system to add only the new questions and skip the already-saved questions without deleting or duplicating them, so that my existing bookmarks are never corrupted or removed by accident.

**Why this priority**: Essential data safety safeguard. Bulk addition must be strictly additive and idempotent; it must never behave as a toggle or inadvertently wipe out existing study bookmarks.

**Independent Test**: Can be tested by having 2 questions already in the Study List, selecting those 2 plus 3 new questions (5 total selected), clicking the bulk Plus button, and verifying that only the 3 new questions are added, the 2 existing questions remain untouched, the toast states `"3 soal ditambahkan · 2 sudah ada"`, and the badge increases by exactly 3.

**Acceptance Scenarios**:

1. **Given** questions A and B are already in the Study List, while questions C, D, and E are not, **When** the candidate selects questions A, B, C, D, and E and clicks the bulk Plus button, **Then** questions C, D, and E are added to `studyList`, questions A and B remain safely stored without duplication or removal, the toast displays `"3 soal ditambahkan · 2 sudah ada"`, and the sidebar badge increments by 3.
2. **Given** all selected questions are already present in the Study List, **When** the candidate clicks the bulk Plus button, **Then** no records are inserted or deleted, the toast displays `"0 soal ditambahkan · N sudah ada"`, and the sidebar badge remains unchanged.

---

### User Story 4 - State Persistence & Non-Interfering Isolation (Priority: P4)

As a candidate returning to Bank Soal or reloading the browser, I want question card flag states, sidebar counters, and selection controls to remain strictly accurate and persistent, without disrupting existing card actions (Edit, Duplicate, Delete) or toolbar actions (Clear, Delete).

**Why this priority**: Ensures zero regressions for existing Bank Soal features and reliable data persistence across sessions, page reloads, and offline PWA usage.

**Independent Test**: Can be tested by adding questions individually and in bulk, refreshing the page, and asserting that all added questions display active flags and the sidebar badge count matches the stored record count. Additionally, assert that clicking Edit, Duplicate, Delete, Clear Selection, and Bulk Delete functions exactly as before.

**Acceptance Scenarios**:

1. **Given** questions have been saved to the Study List, **When** the candidate reloads the page or navigates between tabs, **Then** all saved questions render with active flag icons immediately, and the sidebar badge matches the exact count of items in IndexedDB.
2. **Given** a question is removed from the Study List on the Study List page, **When** the candidate returns to Bank Soal, **Then** that question's card displays the inactive outline flag.
3. **Given** the new flag icon and bulk Plus button are active, **When** the candidate clicks Edit, Duplicate, Delete on an individual card, or Clear Selection and Delete Selected in the toolbar, **Then** all existing functions execute normally without interference.

---

### Edge Cases

- **Rapid Clicking / Concurrency Guard**: What happens when a user clicks an individual flag repeatedly in rapid succession? An asynchronous lock (`dataset.pending = "1"`) prevents duplicate IndexedDB transactions and race conditions.
- **Bulk Add with Zero Selection**: The bulk Plus button in `.zen-bulk-bar` MUST have `disabled` attribute set whenever `state.bankSelectedIds.size === 0`.
- **Bulk Add Across Filtered / Paginated View**: When questions across different pages were selected and the user filters the view, bulk addition operates on all IDs currently in `state.bankSelectedIds`, updates visible cards on the current DOM page, and retains the selection set without resetting filters.
- **Mobile Viewport Ergonomics**: On narrow screens (360px–390px), the selection toolbar `.zen-bulk-bar` must wrap cleanly without overflowing horizontally, and individual card flag buttons must maintain a minimum 32×32px click area with zero horizontal overflow.
- **Offline Resilience**: All toggle and bulk addition operations operate entirely on local IndexedDB (`studyList` store) and local state, functioning with 100% reliability in offline PWA mode.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST render a minimalist outline flag icon button (`data-action="toggle-bank-study"`) on each question card in Bank Soal within `.zen-q-actions`.
- **FR-002**: System MUST render the flag icon as a clean SVG outline without circular background bubbles, badges, speech bubbles, chevrons, expanding arrows, rotation, or bouncing animation.
- **FR-003**: System MUST display the inactive flag state using outline styling (`fill: none; stroke: currentColor;`) with accessible label `"Tambahkan ke Study List"`.
- **FR-004**: System MUST display the active flag state using restrained accent styling (`color: var(--zen-teal, #0f766e); fill: currentColor;`) with accessible label `"Hapus dari Study List"`.
- **FR-005**: First click on an inactive flag MUST add the question to the canonical `studyList` store in IndexedDB using `makeStudyItem(q)` and composite ID `${setId}::${q.id}`, transition the icon to active state, show a success toast `"Soal ditambahkan ke Study List."`, and increment the sidebar badge by 1.
- **FR-006**: Second click on an active flag MUST remove the question from `studyList` in IndexedDB, revert the icon to inactive outline state, show an info toast `"Soal dihapus dari Study List."`, and decrement the sidebar badge by 1.
- **FR-007**: Individual flag clicks MUST stop event propagation (`event.stopPropagation()`) to prevent selecting the question checkbox or opening detail modals.
- **FR-008**: System MUST render a minimalist Plus icon button (`data-action="bulk-add-study"`) in the Bank Soal selection toolbar (`.zen-bulk-bar`) alongside the existing Clear Selection and Delete Selected buttons.
- **FR-009**: The selection toolbar bulk Plus button MUST be disabled when `state.bankSelectedIds.size === 0` and enabled when 1 or more questions are selected.
- **FR-010**: Clicking the bulk Plus button MUST add all selected questions to the Study List using the existing `studyList` store.
- **FR-011**: Bulk addition MUST evaluate question membership via `isQuestionInStudy(q)` and skip any questions that are already in the Study List without deleting or duplicating them.
- **FR-012**: Bulk addition MUST display a concise feedback toast reporting both added and skipped counts in the format `"${addedCount} soal ditambahkan · ${skippedCount} sudah ada"`.
- **FR-013**: Bulk addition MUST increment the sidebar badge by exactly `addedCount`.
- **FR-014**: Bulk addition MUST update visible card flag icons in the DOM for all newly added questions to the active state.
- **FR-015**: Bulk addition MUST preserve the candidate's existing checkbox selections (`bankSelectedIds`), active search query, package filters, pagination page, and vertical scroll position.
- **FR-016**: Existing card actions (Edit, Duplicate, Delete) and existing toolbar actions (Clear Selection, Delete Selected) MUST remain fully functional without regressions.
- **FR-017**: All additions, toggles, and removals MUST persist in IndexedDB across browser reloads, navigation, and offline PWA sessions.
- **FR-018**: System MUST NOT alter CBT exam engine, scoring, exam timer, PWA cache governance, or swipe navigation.

---

### Key Entities *(include if feature involves data)*

- **StudyListItem**:
  - `id`: Composite identifier `${setId}::${q.id}` ensuring 1:1 uniqueness per package question.
  - `packageId` / `setId`: Source question package identifier (e.g. `ssw-pm-kunci-ujian-1`).
  - `setName`: Human-readable package display name.
  - `questionId`: Unique question ID within its package.
  - `questionNumber`: Display number of the question.
  - `prompt`: Japanese question text with Furigana ruby annotations.
  - `options`: Array of choices `{ id, text, translation }`.
  - `correctIndex` / `correctAnswer`: Correct answer index and key letter.
  - `explanation`: Solution explanation and Indonesian notes.
  - `promptTranslation`: Translation of the prompt.
  - `savedAt`: Timestamp when bookmarked.

- **QuestionCardStudyState**:
  - `questionId`: Composite question ID.
  - `isInStudy`: Boolean indicating presence in `state.studyList`.
  - `buttonState`: Inactive outline flag vs. active filled teal flag.
  - `pending`: Boolean lock preventing duplicate concurrent clicks.

- **BulkAddResult**:
  - `totalSelected`: Number of questions selected in `state.bankSelectedIds`.
  - `addedCount`: Number of newly added questions saved to `studyList`.
  - `skippedCount`: Number of questions already in `studyList` that were skipped.
  - `feedbackMessage`: Formatted feedback string, e.g. `"${addedCount} soal ditambahkan · ${skippedCount} sudah ada"`.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Individual flag toggle responds immediately with visual update and feedback toast within 120ms.
- **SC-002**: Bulk addition of 5 selected questions completes within 250ms with correct toast feedback and badge update.
- **SC-003**: 100% duplicate prevention: bulk adding mixed sets (e.g. 3 new, 2 existing) strictly adds 3 and skips 2 with zero duplicate records in `studyList` store.
- **SC-004**: 100% state persistence across page reload: all bookmarked cards display active flags after full browser refresh.
- **SC-005**: Zero layout regressions across mobile (360px, 390px) and desktop (1440px) viewports; no horizontal scrollbar or overlapping actions.
- **SC-006**: 0% disruption to CBT exam engine, scoring, exam timer, PWA cache governance, or swipe navigation.
- **SC-007**: Dedicated automated regression test suite (`tests/test-study-list-ux-refinement.mjs`) asserts all 12 validation scenarios and reports exit code 0.

---

## Assumptions

- Target browser environment supports ES2022 and IndexedDB `studyList` store initialized in database version 2.
- Questions in Bank Soal possess deterministic composite identifiers `${setId}::${q.id}`.
- No external libraries or icon packs need to be imported; inline SVG matching project aesthetic is used.
- Zone A (CBT exam mode) remains completely isolated and untouched.
