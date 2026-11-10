# Feature Specification: Add Questions to Study List from Bank Soal

**Feature Branch**: `feat/bank-to-study-list`

**Created**: 2026-11-10

**Status**: Draft

**Input**: User description: "Add individual questions to Study List directly from Bank Soal"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Add Question to Study List with Immediate Feedback (Priority: P1)

As a candidate reviewing question materials in Bank Soal, I want to click an icon/button directly on any question card to save that question to my Study List so that I can bookmark difficult or important items without leaving my current review workflow.

**Why this priority**: This is the core capability requested by the user. It allows immediate bookmarking of individual questions from the primary catalog to the revision queue in one click.

**Independent Test**: Can be fully tested by opening Bank Soal, locating any question card, clicking the "+" button on that card, and verifying that the question is added to the Study List with a success confirmation toast and an incremented sidebar counter badge.

**Acceptance Scenarios**:

1. **Given** a candidate is viewing question cards in Bank Soal and question #5 is not yet in the Study List, **When** the candidate clicks the "+" button on question #5's card, **Then** question #5 is stored into the Study List database, the button transitions to an active/added state (showing a checkmark icon `✓`), a success notification is shown, and the sidebar Study List badge increases by 1.
2. **Given** question #5 has been added to the Study List, **When** the candidate navigates to the Study List tab, **Then** question #5 appears in the list with its complete content, options, correct key, and explanation intact.

---

### User Story 2 - State Persistence & Duplicate Prevention (Priority: P2)

As a candidate managing study materials, I want question cards in Bank Soal to clearly show whether each question is already in my Study List, and prevent redundant duplicates, so that my study list remains clean and organized.

**Why this priority**: Ensures data integrity, prevents duplicate records, and provides visual clarity on which questions have already been bookmarked.

**Independent Test**: Can be tested by adding a question, reloading the browser or navigating away and back to Bank Soal, and verifying that the card retains its added/checked state. Clicking the added button toggles removal or retains single-instance integrity deterministically.

**Acceptance Scenarios**:

1. **Given** question #12 is already saved in the Study List, **When** the candidate opens Bank Soal or reloads the application, **Then** question #12's card displays the added state (`✓` icon and active styling) immediately upon rendering.
2. **Given** question #12 is in the added state (`✓`) on Bank Soal, **When** the candidate clicks the action button again, **Then** the question remains safely in the Study List without removal and without creating a duplicate record in the database (strictly idempotent add-only behavior).
3. **Given** a question is deleted from the Study List tab, **When** the candidate returns to Bank Soal, **Then** that question's card returns to the unadded state (`+` icon).

---

### User Story 3 - Action Isolation & Non-Interference with Bank Soal Controls (Priority: P3)

As a candidate interacting with Bank Soal, I want adding a question to the Study List to happen in-place without triggering card expansion, detail modal, pagination shifts, or filter resets, so that my browsing position is completely preserved.

**Why this priority**: Guarantees seamless UX ergonomics and ensures that the new button does not conflict with existing question actions (Edit, Duplicate, Delete) or parent card selection checkboxes.

**Independent Test**: Can be tested on Page 2 of a filtered Bank Soal list by clicking "+" on a question card, verifying that the current scroll position, active page, filter criteria, and adjacent action buttons remain completely intact and unaffected.

**Acceptance Scenarios**:

1. **Given** the candidate is on Page 3 of Bank Soal with an active package search filter, **When** the candidate clicks the "+" button on any question card, **Then** event propagation is stopped, the card does not open edit or detail modes, the active page remains Page 3, and the search filter remains applied.
2. **Given** question cards have existing Edit, Duplicate, and Delete buttons, **When** the "+" button is added, **Then** all four buttons remain accessible, clickable, and responsive across both desktop (1440px) and mobile (390px) viewports with zero layout breakage.

---

### Edge Cases

- **Rapid Multiple Clicks**: What happens when a candidate clicks the button multiple times in rapid succession? The action must be debounced or state-locked during async IndexedDB writes to prevent race conditions or duplicate entries.
- **Offline Mode**: What happens when adding a question while offline in PWA mode? The operation must succeed instantly using local IndexedDB without attempting any network requests.
- **Custom / Newly Created Questions**: What happens when a candidate adds a newly created or imported question from Bank Soal? The composite identifier `${setId}::${q.id}` must handle both bundled questions and user-created custom questions deterministically.
- **Mobile Viewport Overflow**: On narrow screens (360px–390px), how do the 4 buttons (`+`, Edit, Duplicate, Delete) render? The container must use flexible wrapping or compact icon-button spacing without overflowing horizontally or pushing the question number out of view.
- **Filtered / Search View**: When question cards are filtered by package, media type, or active status, adding to Study List must preserve the filtered item list without triggering a full re-render that resets the filter.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST render an interactive Study List action button on each question card in the Bank Soal question list (`.zen-q-item`).
- **FR-002**: System MUST position the Study List action button adjacent to the existing card action buttons (Edit, Duplicate, Delete) within the card action area (`.zen-q-actions`).
- **FR-003**: System MUST use the existing `studyList` store in IndexedDB and the existing canonical Study List data model (`makeStudyItem(q)` with composite ID `${setId}::${q.id}`).
- **FR-004**: System MUST verify question membership using `isQuestionInStudy(q)` to prevent duplicate entries of the same question in the Study List.
- **FR-005**: System MUST visually distinguish questions already present in the Study List (showing an active checkmark icon `✓` with title `Sudah ada di Study List`) from questions not yet in the Study List (showing a plus icon `+` with title `Tambahkan ke Study List`).
- **FR-006**: System MUST enforce strictly idempotent add-only behavior: clicking on an unadded question saves it to IndexedDB, displays a success confirmation toast, and updates the icon to `✓`. Clicking on a question already in the Study List MUST NOT remove it, maintaining the bookmarked state without creating duplicate records.
- **FR-007**: System MUST stop event propagation (`event.stopPropagation()`) when clicking the Study List button to avoid triggering parent card click handlers, checkbox selections, or page navigation.
- **FR-008**: System MUST maintain the candidate's exact browsing state in Bank Soal (active pagination page, search query, package filter, media filter, status filter, and scroll position) without page reload or reset.
- **FR-009**: System MUST update the Study List navigation badge in the sidebar immediately when a question is added.
- **FR-010**: System MUST persist the addition to IndexedDB so that the bookmarked status survives browser reload, tab navigation, and offline PWA sessions.
- **FR-011**: System MUST maintain responsive layout integrity across mobile (360px–390px), tablet (768px), and desktop (1440px) viewports with zero horizontal scrolling or button overlapping.
- **FR-012**: System MUST preserve all existing Bank Soal capabilities: editing questions, duplicating questions, deleting questions, bulk selection, filtering, search, and pagination.

---

### Key Entities *(include if feature involves data)*

- **StudyListItem**:
  - `id`: Composite identifier `${setId}::${q.id}` ensuring 1:1 uniqueness per package question.
  - `packageId` / `setId`: The source question package identifier (e.g. `ssw-pm-kunci-ujian-1`).
  - `setName`: Human-readable package display name.
  - `questionId`: The unique question ID within its package.
  - `questionNumber`: Display number of the question.
  - `prompt` / `questionText`: Japanese question text with any Furigana ruby annotations.
  - `options`: Array of choices `{ id, text, translation }`.
  - `correctIndex` / `correctAnswer`: Correct answer index and key letter.
  - `explanation`: Solution explanation and Indonesian notes.
  - `promptTranslation`: Translation of the prompt.
  - `addedAt`: ISO 8601 timestamp when the question was bookmarked.
- **QuestionCardStudyState**:
  - `isBookmarked`: Boolean indicating whether `isQuestionInStudy(q)` returns true.
  - `icon`: Display icon (`+` when false, `✓` when true).
  - `ariaLabel`: Accessible label (`Tambah ke Study List` vs `Hapus dari Study List` / `Tersimpan di Study List`).

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Candidates can bookmark any question from Bank Soal into the Study List with a single tap/click in under 100ms UI response time.
- **SC-002**: 100% prevention of duplicate entries for the same question in the Study List store.
- **SC-003**: State indicator (`+` vs `✓`) reflects 100% accurate membership on initial render and persists across page reloads.
- **SC-004**: Adding a question produces 0 changes to the candidate's current pagination page, filter criteria, or scroll position.
- **SC-005**: The sidebar Study List counter badge updates immediately to match the exact count of saved items in IndexedDB.
- **SC-006**: 100% multi-viewport layout parity with zero horizontal scroll overflow on viewports ranging from 360px to 1440px.
- **SC-007**: All automated test suites (Cache Governance, CBT Scroll Lock, Global Swipe Navigation, Bank Soal Lazy Pagination, and new Study List addition tests) pass with zero errors.

---

## Assumptions

- The existing `toggleStudyItem(q)`, `isQuestionInStudy(q)`, and `makeStudyItem(q)` functions in `app.js` are fully operational and serve as the single source of truth for Study List persistence.
- The button will use lightweight semantic HTML (`<button type="button" class="hd-row-btn ...">`) consistent with existing `.zen-q-actions` buttons to maintain the Zen White design system without introducing external font or icon libraries.
- No schema migration or new IndexedDB store is required because the `studyList` object store already exists in database version 2.
- No changes to Service Worker shell caching architecture or CBT examination engine are required for this feature.
