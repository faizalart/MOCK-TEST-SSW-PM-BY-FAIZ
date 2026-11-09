# Feature Specification: 004 — Global Mobile Swipe Navigation Across All Main Tabs

**Feature Branch**: `feat/swipe-tab-navigation`

**Created**: 2026-11-09

**Status**: Draft

**Input**: User description: "Implementasikan GLOBAL HORIZONTAL SWIPE NAVIGATION untuk SELURUH TAB UTAMA aplikasi. Bukan hanya navigasi Home ke Bank Soal. Semua tab utama harus dapat dijangkau melalui swipe kiri dan kanan, terlepas dari tab mana yang sedang aktif. Gunakan urutan seluruh tab utama yang benar-benar tersedia pada navigation bar aplikasi saat ini."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Continuous Full-Sequence Main Tab Swiping (Priority: P1)

As a candidate studying for the SSW Food Manufacturing (Pengolahan Makanan) exam on a mobile device, I want to swipe horizontally left or right from any point within the main reading and dashboard content areas so that I can smoothly navigate across the entire sequential suite of primary application tabs without straining my thumb to reach the top navigation bar.

**Why this priority**: Mobile candidate ergonomics are significantly hindered by the top-pinned hub navigation bar. Allowing fluid thumb gestures across all primary tabs creates an intuitive, app-like experience (similar to modern social and content mobile applications) across the entire application lifecycle.

**Independent Test**: Can be independently verified on a mobile touch viewport by initiating a swipe-left gesture on Beranda to navigate to Mock Test, repeating swipe-left to navigate sequentially across all 6 main tabs to Backup, and swiping right to return cleanly back to Beranda.

**Acceptance Scenarios**:
1. **Given** the candidate is viewing the **Beranda** (Home) tab, **When** they perform a horizontal swipe left across the main content area, **Then** the application navigates directly to the **Mock Test** (Setup) tab and updates the active tab indicator.
2. **Given** the candidate is viewing the **Mock Test** (Setup) tab, **When** they perform a horizontal swipe left, **Then** the application navigates directly to the **Bank Soal** tab and renders the collapsed catalog view.
3. **Given** the candidate is viewing the **Bank Soal** tab, **When** they perform a horizontal swipe left, **Then** the application navigates directly to the **Riwayat** (History) tab.
4. **Given** the candidate is viewing the **Riwayat** (History) tab, **When** they perform a horizontal swipe left, **Then** the application navigates directly to the **Study List** tab.
5. **Given** the candidate is viewing the **Study List** tab, **When** they perform a horizontal swipe left, **Then** the application navigates directly to the **Backup** tab.
6. **Given** the candidate is on any tab from **Backup** through **Mock Test**, **When** they perform a horizontal swipe right, **Then** the application navigates sequentially to the immediate previous tab in the exact reverse order (`Backup` → `Study List` → `Riwayat` → `Bank Soal` → `Mock Test` → `Beranda`).

---

### User Story 2 - Boundary Preservation and Non-Circular Dead-Ends (Priority: P1)

As a candidate navigating through the tab spectrum, I want clear and predictable boundaries at the terminal ends of the tab sequence so that accidental over-swiping does not unexpectedly jump across the library or loop endlessly.

**Why this priority**: Circular navigation confuses candidates about their spatial position within the application, disrupting mental orientation and leading to unintended tab jumping.

**Independent Test**: Can be independently verified by swiping right while active on the first tab (Beranda) and swiping left while active on the terminal tab (Backup), confirming that no navigation occurs and the user remains safely on their current screen.

**Acceptance Scenarios**:
1. **Given** the candidate is currently on the first tab (**Beranda**), **When** they perform a horizontal swipe right, **Then** the application remains on **Beranda** with zero navigation, zero circular wrapping to Backup, and zero UI flickering.
2. **Given** the candidate is currently on the terminal tab (**Backup**), **When** they perform a horizontal swipe left, **Then** the application remains on **Backup** with zero navigation, zero circular wrapping to Beranda, and zero UI flickering.

---

### User Story 3 - Protection of Critical Assessment & Assessment Review Surfaces (Priority: P1)

As a candidate taking a formal examination or reviewing graded assessment results, I want swipe gestures to be completely inert and disabled on examination workspaces, Results scorecards, Review Answer lists, and modal dialogues so that touch interactions cannot trigger accidental page switching or disrupt testing focus.

**Why this priority**: Inadvertent tab changes during an active CBT session can cause catastrophic test disruption, lost countdown focus, or accidental exam exits. Review and Results pages also require undisturbed horizontal scrolling or detailed touch interactions.

**Independent Test**: Can be verified by initiating horizontal swipe gestures while an active CBT exam session is running, while the Results scorecard is open, while the Review Answers page is open, and when a modal dialog is displayed, confirming that tab navigation is completely disabled.

**Acceptance Scenarios**:
1. **Given** a CBT examination session is active (`renderExam`), **When** the candidate swipes horizontally across any section of the exam screen, **Then** no tab transition occurs and the candidate stays firmly in the exam workspace.
2. **Given** the candidate is viewing the **Results** scorecard or the **Review Answers** page, **When** they swipe horizontally across the screen, **Then** no tab navigation occurs and candidate scroll/review interactions remain completely undisturbed.
3. **Given** any modal overlay or dialog box is currently displayed on screen (such as the Question Editor modal, CSV Import modal, or Settings dialog), **When** a touch swipe is made, **Then** tab navigation is strictly disabled.

---

### User Story 4 - Disambiguation with Embedded Interactive Elements & Horizontal Scroll Regions (Priority: P2)

As a candidate interacting with form inputs, option buttons, sliders, or horizontal filter carousels, I want my touch interactions on those elements to function natively without unintentionally triggering a global tab switch.

**Why this priority**: Users frequently scrub horizontal carousels (such as the package filter chip ribbon on the Home dashboard) or interact with buttons and input fields. Triggering a page change during these micro-interactions frustrates users.

**Independent Test**: Can be verified by dragging horizontally across the package filter chip bar on the Home tab, typing into a search text input, or dragging an exam setting slider, ensuring that local element interactions succeed without navigating away from the current tab.

**Acceptance Scenarios**:
1. **Given** the candidate touches and drags horizontally inside an internal horizontal scrolling container (such as the Home dashboard package filter chip ribbon or a horizontally scrollable table), **When** the gesture completes, **Then** the container scrolls its own content and the global tab does not change.
2. **Given** the candidate starts a touch gesture directly on an interactive element (a button, a text input, a dropdown select, a slider, a link, or an element marked to exclude swiping), **When** the touch moves, **Then** the interaction is handled by the element and no tab navigation is triggered.

---

### User Story 5 - Vertical Scrolling Continuity & Gesture Threshold Disambiguation (Priority: P2)

As a candidate scrolling vertically through long study texts, question lists, or test history, I want vertical scrolling and diagonal finger movements to feel completely fluid and natural without accidentally triggering tab navigation.

**Why this priority**: The majority of touch interactions on mobile are vertical scrolls. If horizontal tab navigation is too sensitive or improperly disambiguated, vertical scrolling will hitch, stutter, or erroneously switch tabs.

**Independent Test**: Can be tested by performing rapid vertical flick scrolling, slow diagonal scrolling, and short horizontal taps/flicks (under the 60px activation threshold), verifying that vertical scrolling never hitches and no tab transition is triggered.

**Acceptance Scenarios**:
1. **Given** the candidate is scrolling vertically through a long list on Bank Soal, Riwayat, or Study List, **When** their finger moves primarily vertically (where vertical travel exceeds horizontal travel), **Then** vertical page scrolling proceeds smoothly without hitching and no tab navigation occurs.
2. **Given** the candidate performs a diagonal or ambiguous gesture where horizontal travel is not distinctly dominant over vertical travel, **When** the touch ends, **Then** the gesture is disregarded and the candidate remains on the current tab.
3. **Given** the candidate taps a card or performs a short flick below the activation threshold (less than 60–80px of horizontal displacement), **When** the touch ends, **Then** no tab transition occurs.
4. **Given** a valid swipe gesture is completed, **When** the tab transition executes, **Then** exactly one tab change occurs per single continuous touch lifecycle (no multi-tab acceleration or runaway skipping).

---

### User Story 6 - Multi-Viewport Parity & Motion Sensitivity Support (Priority: P3)

As a user on a desktop computer or a candidate with motion sensitivity preferences enabled, I want navigation to respect my input capabilities and system accessibility settings.

**Why this priority**: Desktop mouse users should not experience unintended page navigation when selecting text or dragging, and users with vestibular sensitivities must be protected from jarring screen animations.

**Independent Test**: Can be verified on desktop viewports by ensuring standard mouse text selection and clicking remain normal, and on mobile by verifying that users with `prefers-reduced-motion` enabled experience instantaneous or calm transitions without disorienting motion.

**Acceptance Scenarios**:
1. **Given** the application is loaded on a desktop viewport with standard mouse and keyboard controls, **When** mouse dragging occurs, **Then** global swipe tab navigation does not interfere with mouse interactions and top navigation links remain fully operable.
2. **Given** the candidate's operating system has `prefers-reduced-motion: reduce` enabled, **When** a valid swipe navigation occurs, **Then** the tab switch is immediate and distraction-free, omitting animated slides.

---

### Edge Cases

- **Rapid successive swipes**: If a user performs multiple rapid swipes before the destination tab finishes loading, the system must complete the active navigation cleanly before accepting a new swipe, preventing race conditions or state corruption.
- **Multitouch / Pinch-to-zoom**: If multiple fingers touch the screen simultaneously (e.g. pinch-to-zoom or accidental two-finger resting), swipe tab navigation must immediately cancel and ignore the gesture.
- **Swipe during network or storage sync**: Swiping tabs while background data seeding or offline synchronization is in progress must execute without interrupting the persistence operation.
- **Dynamic tab indicators**: When switching tabs via swipe, the top hub bar tab indicator (`.nav-item.active`), bottom focus/scrolling state, and breadcrumbs text must update synchronously to mirror the newly active tab.
- **Lazy content integrity**: When swiping into Bank Soal, the view must respect existing lazy rendering rules (opening in the initial collapsed state with 0 rendered question cards) without causing memory spikes or layout shifts.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST support continuous horizontal swipe navigation across all six primary application tabs in their canonical order:
  1. `home` (Beranda)
  2. `setup` (Mock Test)
  3. `bank` (Bank Soal)
  4. `history` (Riwayat)
  5. `study` (Study List)
  6. `backup` (Backup)
- **FR-002**: A swipe left gesture (finger moving from right to left) MUST transition to the next sequential tab in the primary list (`home` → `setup` → `bank` → `history` → `study` → `backup`).
- **FR-003**: A swipe right gesture (finger moving from left to right) MUST transition to the previous sequential tab in the primary list (`backup` → `study` → `history` → `bank` → `setup` → `home`).
- **FR-004**: The system MUST treat the tab boundaries as strict non-circular limits: a swipe right while on `home` MUST keep the user on `home`, and a swipe left while on `backup` MUST keep the user on `backup`.
- **FR-005**: Every valid swipe gesture MUST trigger a transition of exactly one tab per continuous touch interaction; gestures MUST NOT jump or skip intermediate tabs.
- **FR-006**: The swipe gesture detection MUST require a minimum horizontal displacement threshold between 60px and 80px before recognizing an intent to navigate.
- **FR-007**: The swipe gesture detection MUST require horizontal motion to be clearly dominant over vertical motion (horizontal distance strictly greater than vertical distance by a distinct ratio) to avoid intercepting vertical page scrolling.
- **FR-008**: The system MUST NOT utilize blanket or unconditional `preventDefault` calls that break native vertical browser scrolling, rubber-band effects, or pinch-to-zoom.
- **FR-009**: The system MUST completely disable swipe tab navigation on assessment and review surfaces:
  - During an active CBT examination session (`state.page === 'exam'`)
  - On the Exam Results scorecard (`state.page === 'result'`)
  - On the Review Answers screen (`state.page === 'review'`)
- **FR-010**: The system MUST completely disable swipe tab navigation whenever an interactive modal, dialogue overlay, or backdrop is active on the screen.
- **FR-011**: The system MUST exclude swipe tab navigation when a touch sequence originates on form controls (`input`, `textarea`, `select`, buttons, sliders, links) or inside horizontal scrolling containers (such as the package filter chip bar or table scroll wrappers).
- **FR-012**: Upon completing a swipe-triggered navigation, the system MUST immediately synchronize the active navigation item indicator (`.nav-item.active`), topbar breadcrumbs, and window scroll position.
- **FR-013**: The system MUST maintain lazy loading and on-demand rendering principles, ensuring that inactive tabs are not kept simultaneously instantiated in the DOM.
- **FR-014**: The system MUST honor `prefers-reduced-motion` preferences by suppressing decorative transition animations when the preference is set.

---

### Key Entities *(include if feature involves data)*

- **MainTabSequence**: Represents the ordered list of primary application routes (`home`, `setup`, `bank`, `history`, `study`, `backup`), their visual labels, and directional adjacency index.
- **SwipeGestureState**: Represents the active touch tracking session, recording touch start coordinates (`startX`, `startY`), timestamp, displacement vectors (`deltaX`, `deltaY`), dominant axis determination, and exclusion eligibility.
- **TabNavigationEvent**: Represents the validated transition payload dispatched when a qualifying swipe reaches completion, specifying origin tab, destination tab, and direction (`next` or `previous`).

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of the 6 primary tabs are reachable through sequential left/right swipe gestures without touching the top navigation bar.
- **SC-002**: Accidental tab switching rate during vertical scrolling is 0% across standard mobile viewport usage tests.
- **SC-003**: Tab transition recognition responds within 16ms of touch release on mobile devices without frame drops or UI stutter.
- **SC-004**: 100% exclusion rate achieved: zero tab transitions occur when swiping during active CBT exams, on Results scorecards, on Review Answers pages, inside open modals, or across horizontal filter chip carousels.
- **SC-005**: All existing regression test suites (PWA cache governance, SW offline resilience, Bank Soal lazy rendering, and Exam Scroll Lock) maintain 100% PASS rate.
- **SC-006**: Verification passes across both Desktop (1440×900) and Mobile (390×844) viewports with high-resolution screenshot evidence.

---

## Assumptions

- **Touch Support**: Swipe gesture recognition is active for touch-capable devices and mobile emulators, while standard mouse-click navigation remains the primary mechanism for desktop pointer devices.
- **Existing Router**: The existing `go(page)` routing function and SPA state model remain the authoritative navigation mechanism and will be invoked upon valid gesture recognition.
- **Tab Order Stability**: The six primary tabs (`home`, `setup`, `bank`, `history`, `study`, `backup`) established in the application shell represent the complete and canonical navigation order.
- **Performance Budget**: Gesture tracking listeners are lightweight and passive to ensure zero impact on 60fps scrolling performance.
