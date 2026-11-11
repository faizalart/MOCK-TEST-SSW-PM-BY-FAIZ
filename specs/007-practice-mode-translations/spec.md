# Feature Specification: Practice Mode Inline Indonesian Translations

**Feature Branch**: `feat/practice-mode-inline-translations`

**Created**: 2026-11-11

**Status**: Draft

**Input**: User description: "Add a minimalist globe toggle beside the existing bottom-left plus button in the active untimed CBT Practice Mode. When enabled, show existing Indonesian translations directly beneath the Japanese question prompt and each Japanese answer option individually."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Toggle Practice Mode Inline Translations on Question and Options (Priority: P1)

As a candidate preparing for the SSW Food Service & Manufacturing exam in untimed Practice Mode, I want to toggle Indonesian translations directly beneath the Japanese question prompt and each answer option so that I can understand complex Japanese vocabulary and technical context while attempting questions, without leaving the CBT interface or revealing the correct answer.

**Why this priority**: This represents the core user value and MVP of Feature 007. It enables candidates to study bilingual question text and answer choices interactively in untimed practice sessions while preserving real CBT examination habits.

**Independent Test**: Can be fully tested by launching an untimed Practice session, clicking the bottom-left globe icon, and verifying that Indonesian translations appear directly underneath the Japanese question prompt and under each displayed option, then clicking again to verify that all translations disappear cleanly.

**Acceptance Scenarios**:

1. **Given** a candidate is in an active untimed Practice Mode session with translations initially OFF,
   **When** viewing any question,
   **Then** the Japanese question prompt and options are displayed in their original presentation without translations, and the globe toggle button indicates an inactive state (`aria-expanded="false"`, `aria-pressed="false"`, gray glyph).
2. **Given** translations are currently OFF in Practice Mode,
   **When** the candidate clicks or activates the globe toggle button,
   **Then** the globe button toggles to active state (`aria-expanded="true"`, `aria-pressed="true"`, restrained teal glyph), the Indonesian translation of the question prompt appears directly beneath the Japanese prompt, and the Indonesian translation of each option appears directly beneath its respective Japanese option text.
3. **Given** translations are currently ON in Practice Mode,
   **When** the candidate clicks or activates the globe toggle button again,
   **Then** the globe button returns to inactive state (`aria-expanded="false"`, `aria-pressed="false"`, gray glyph), all translation text elements are removed from view, and the question prompt and options return to their exact original visual presentation.
4. **Given** translations are ON or OFF,
   **When** inspecting the displayed translation text,
   **Then** neither the correct answer key (e.g. "B") nor the answer explanation (`explanation`) is displayed or leaked anywhere within the translation elements.
5. **Given** translations are toggled ON,
   **When** inspecting the answer options,
   **Then** each option's original layout, alignment, radio indicator, option letter, padding, selection behavior, and hover/click feedback remain completely unchanged, with the translation appearing as a plain secondary line inside that option's content area.

---

### User Story 2 - Translation State Persistence Across Question Navigation (Priority: P2)

As a candidate studying a sequence of questions with translations enabled, I want my translation visibility choice to persist as I navigate forward, backward, or jump across questions in the current Practice session so that I do not have to repeatedly activate the toggle on every single question.

**Why this priority**: Navigating between questions is the standard study flow. If the toggle reset on every question transition, the candidate experience would be frustrating and fragmented.

**Independent Test**: Can be fully tested by turning translations ON on Question 1, navigating to Question 2 via the "Next" button, navigating backward via the "Previous" button, and jumping via the question map grid, confirming that translations remain visible on every navigated question.

**Acceptance Scenarios**:

1. **Given** translations are enabled (ON) on Question 1 in an untimed Practice session,
   **When** the candidate clicks the "Next" button to navigate to Question 2,
   **Then** Question 2 immediately displays its Indonesian prompt translation and option translations, and the globe toggle button remains in the active state.
2. **Given** translations are enabled (ON) on Question 2,
   **When** the candidate clicks the "Previous" button to navigate back to Question 1,
   **Then** Question 1 immediately displays its translations, and the globe toggle remains active.
3. **Given** translations are enabled (ON),
   **When** the candidate uses the question map drawer/rail to jump directly to another question (e.g., Question 15),
   **Then** the selected question immediately displays its translations, and the globe toggle remains active.
4. **Given** translations are disabled (OFF),
   **When** the candidate navigates forward, backward, or jumps to another question,
   **Then** translations remain hidden across all navigated questions.
5. **Given** a session configured with option shuffling (`shuffleOptions: true`),
   **When** viewing any question with translations enabled,
   **Then** each shuffled option displays its own matching Indonesian translation directly underneath its text, regardless of how options were rearranged from their original master order.

---

### User Story 3 - Mode Isolation and Session Lifecycle Reset (Priority: P3)

As a candidate taking an official timed examination (Full Mock Test or Timed Custom Exam), I want the examination environment to remain strictly authentic with zero translation controls visible, and I want any translation state from a previous Practice session to be fully reset when starting a new exam.

**Why this priority**: Full Mock Tests simulate official test-center CBT conditions where inline Indonesian translations are strictly prohibited. The translation capability must be firmly isolated to untimed Practice Mode.

**Independent Test**: Can be fully tested by launching a Full Mock Test session and a Timed Custom session to confirm the globe button is absent from the DOM, and by toggling translations ON in Practice Mode, exiting to Home, and starting a new Practice session to confirm translations default to OFF.

**Acceptance Scenarios**:

1. **Given** a candidate launches a Full Mock Test session (timed 70-minute simulation),
   **When** the CBT interface renders,
   **Then** the globe toggle button is completely absent from the bottom toolbar (`.exam-bottom-tools`), and no translations are rendered.
2. **Given** a candidate launches a Timed Custom Simulation session (with an active countdown timer),
   **When** the CBT interface renders,
   **Then** the globe toggle button is completely absent from the bottom toolbar, and no translations are rendered.
3. **Given** a candidate has translations enabled (ON) in a running Practice session,
   **When** the candidate finishes the session or exits to the Home screen,
   **Then** the session-scoped translation visibility state resets to OFF.
4. **Given** the candidate subsequently starts a new Practice Mode session,
   **When** the CBT interface loads,
   **Then** translations are hidden (OFF) by default, and the globe button displays its inactive state.

---

### Edge Cases

- **Question with missing prompt translation**: If a question prompt translation is blank, empty, or whitespace-only, no empty container or broken space is rendered beneath the prompt; option translations continue to render normally if available.
- **Option with missing translation**: If an individual option lacks a translation, that option displays its Japanese text normally without a blank line or broken gap; other options with translations continue to display their secondary lines.
- **Illustration-only or short option**: If an option consists solely of an image or short numeral (e.g. "10℃", "A"), the translation line renders underneath the text label without overlapping or distorting the image.
- **Mobile portrait viewport (390px / 360px)**: The addition of the globe button in `.exam-bottom-tools` beside the plus button must not cause horizontal scrolling, toolbar wrap breakage, or button collision; touch target must maintain minimum 44 × 44 px ergonomic spacing.
- **Furigana toggle interaction**: Enabling or disabling Furigana (Kanji ruby annotations) via the adjacent "F" button must operate independently of the translation toggle without resetting translation visibility.
- **Offline operation (PWA)**: The toggle and translation display must work with 100% functionality in offline mode with zero network requests or third-party API calls.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST render a dedicated globe toggle button in the bottom-left CBT toolbar (`.exam-bottom-tools`) exclusively during an active, untimed Practice Mode session (`s.mode === 'practice' && !s.deadline`).
- **FR-002**: The system MUST NOT render the globe toggle button in Full Mock Test sessions (`s.mode === 'full'` or timed `s.mode === 'exam'`) or in any session with an active countdown timer (`s.deadline != null`).
- **FR-003**: The globe toggle button MUST be positioned immediately beside the existing Study List quick plus button (`.study-list-quick-button`) within `.exam-bottom-tools`.
- **FR-004**: Translation visibility MUST default to OFF (`false`) upon initiating any new examination or practice session.
- **FR-005**: Activating the globe toggle button MUST alternate the session's translation visibility state between ON (`true`) and OFF (`false`).
- **FR-006**: When translation visibility is ON, the system MUST display the Indonesian translation of the question prompt directly beneath the Japanese prompt text (`.question-prompt`).
- **FR-007**: When translation visibility is ON, the system MUST display the Indonesian translation of each answer option directly beneath its respective Japanese option text inside that option's content container (`.answer-content`).
- **FR-008**: When translation visibility is OFF, all question prompt and option translation elements MUST be completely hidden or removed from the DOM, restoring the exact original Japanese-only presentation.
- **FR-009**: The system MUST preserve translation visibility state across intra-session question navigation, including "Next" (`exam-next`), "Previous" (`exam-prev`), and question map selection (`jump-question`).
- **FR-010**: Exiting the CBT screen or completing/finishing the active session MUST reset the translation visibility state to OFF.
- **FR-011**: The system MUST source question prompt translations exclusively from existing local data properties (`q.promptTranslation` and recognized aliases) without external network dependencies.
- **FR-012**: The system MUST source option translations exclusively from existing local data properties (`o.translation` and recognized aliases) attached to each option object.
- **FR-013**: When option shuffling is active (`setup.shuffleOptions: true`), the system MUST ensure each option's translation remains strictly paired with its corresponding option content, regardless of shuffled option position or assigned letter.
- **FR-014**: The system MUST NOT reveal the correct answer key (`correctAnswer`), explanation text (`explanation`), or scoring calculations within any translation element.
- **FR-015**: The globe toggle button MUST provide accessible attributes, including `aria-label="Toggle Terjemahan Indonesia"`, dynamic `title` ("Tampilkan Terjemahan" when OFF, "Sembunyikan Terjemahan" when ON), and dynamic `aria-expanded` / `aria-pressed` reflecting the current state.
- **FR-016**: The translation text elements MUST include the appropriate language tag (`lang="id"`), while the primary question and option elements retain `lang="ja"`.
- **FR-017**: The option translation element MUST be implemented as a phrasing element with block display behavior (e.g. `<span class="practice-option-translation">` with `display: block`) to maintain valid HTML markup within the inline `.answer-content` element.
- **FR-018**: The system MUST NOT add bullets, dots, dashes, secondary numbering, extra option cards, or nested selection containers to the answer choices.
- **FR-019**: All translations MUST function completely offline under Progressive Web App (PWA) cache governance without runtime translation APIs.

---

### Key Entities

- **Practice Translation State**:
  - `practiceTranslationOpen`: Boolean flag (`true` when translations are enabled, `false` when hidden).
  - Scope: In-memory session UI state within the application state machine (`state.practiceTranslationOpen`).
  - Lifecycle: Initialized to `false` at application boot, reset to `false` on `startExam()` and `finishExam()`, toggled via `toggle-practice-translation`.
- **Question Translation Entity (`q`)**:
  - `promptTranslation`: String containing the verified Indonesian translation of the question prompt text.
  - Sourced from existing static JSON packages and seed datasets.
- **Option Translation Entity (`o`)**:
  - `translation`: String containing the verified Indonesian translation of that specific answer option.
  - Attached directly to each option object in the question's `options` array.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of the 1,006 questions across all 27 practice-supported packages display verified Indonesian translations for both prompt and all options when the globe toggle is activated.
- **SC-002**: Toggling translations ON or OFF executes instantly with zero perceptual delay (state update and DOM re-render under 50 milliseconds).
- **SC-003**: In 100% of tested Full Mock Test and timed exam sessions, the globe button is completely absent from the user interface.
- **SC-004**: When navigating through an entire 40-question Practice session with translations enabled, translation state persists on 100% of navigated questions without requiring reactivation.
- **SC-005**: In 100% of option-shuffled sessions, option translations correctly correspond to their original Japanese options with 0% mismatch or cross-option leakage.
- **SC-006**: 0% leakage of correct answer letters or explanation text occurs through the translation UI.
- **SC-007**: Interactive touch targets for the globe button and adjacent plus button maintain minimum 44 × 44 px ergonomic clearance across mobile (390px / 360px) and desktop (1440px) viewports with zero horizontal scrolling.
- **SC-008**: 100% of translation toggle interactions function in complete offline mode (Service Worker / PWA).

---

## Assumptions

- **Target Mode**: The feature applies strictly to CBT Practice Mode (untimed). Full Mock Test and Timed Custom simulations intentionally remain English/Japanese-only to preserve realistic exam conditions.
- **Translation Data Source**: Phase 1 data audit verified that 1,006 out of 1,006 questions (100.0%) and 3,110 out of 3,110 options (100.0%) already have complete, high-quality Indonesian translations embedded in existing static datasets. No external translation generation or API integration is required.
- **Visual Design System**: Conforms strictly to the Zen White Design System (`DESIGN.md`) and Anti-Slop Guidelines: minimalist SVG stroke geometry, transparent backgrounds, no decorative cards, bubbles, shadows, or animations, and WCAG AA contrast compliance (`>= 4.5:1`).
- **Semantic HTML**: Option translations are rendered using inline/phrasing elements styled as blocks (`display: block`) to preserve valid HTML nesting inside `.answer-content`.
- **Backward Compatibility**: Existing question formats, scoring calculators, answer-tracking logic, timer routines, and database schemas remain 100% intact without schema migrations.
