# Feature Specification: Practice Mode — Selective Translation & Kotoba Reveal (Pathway B Provenance Architecture)

**Feature Branch**: `feat/practice-selective-translation-kotoba`  
**Feature Directory**: `specs/008-practice-selective-translation-kotoba/`  
**Date**: 2026-11-12 (Updated: Pathway B Decoupled Provenance Architecture)  
**Status**: Specified  

---

## 1. Feature Overview & Scope Mandate

Feature 008 introduces granular, per-sentence translation control alongside an inline technical vocabulary (Kotoba) reveal system for untimed CBT Practice Mode across the **ENTIRE SSW PM question bank from Day 1**.

### Scope Invariants:
- **Full Bank Coverage & Raw Record Reconciliation**:
  - Scanning all 7 question bundle files reveals 1,086 raw question records: `questions.json` (80), `ssw-pm-all-kunci-ujian-3-to-13.json` (440), `ssw-pm-bonus-soal-1-to-10-bundle.json` (354), `ssw-pm-kunci-ujian-1.json` (40), `ssw-pm-kunci-ujian-2.json` (40), `ssw-pm-special-lab-bundle.json` (92), and `ssw-pm-tipe2-nguyen1.json` (40).
  - Cross-file deduplication reveals exactly 80 duplicates (questions in `questions.json` mirroring `kunci-ujian-1` and `kunci-ujian-2`), yielding exactly **1,006 net unique questions** and **3,110 net unique options** (all confirmed to possess unique option IDs).
- **4-Tier Coverage Taxonomy**:
  1. *Extraction Coverage*: 100% of Japanese text across all 1,006 unique questions and 3,110 unique options is scanned.
  2. *Vocabulary Coverage*: All relevant technical food manufacturing terms are extracted and mapped to the central dictionary registry.
  3. *Verified Coverage*: All terms whose lemma/reading matches JMdict/ruby and whose Indonesian definition is verified in-house are marked `status: 'verified'`.
  4. *Unresolved Tracking*: Any term lacking high-confidence verification is marked `status: 'unresolved'`, tracked in the audit ledger, and excluded from UI rendering. No speculative guessing or treating machine translation as verified.
- **No Pilot Package / No Partial Releases**: All 27 packages are supported uniformly in the initial release.
- **Shared Deduplicated Vocabulary Architecture**: Vocabulary entries are centralized in a single, deduplicated shared dictionary registry (`sharedKotobaDictionary`). Questions and options reference vocabulary via stable term IDs (`kotobaIds`).
- **Pathway B Provenance Architecture**:
  - Upstream Japanese lemmas and readings cross-verified with JMdict (EDRDG, CC BY-SA 4.0) and exam ruby annotations.
  - Indonesian definitions are authored in-house, contextually disambiguated for the food manufacturing industry, and released as an adapted dataset under CC BY-SA 4.0.
  - Zero ingestion of JIDict CC BY-NC 4.0 data without commercial permission.
  - The proprietary application software, CBT engine, scoring algorithms, and commercial subscription models remain strictly decoupled and protected.
- **Zero Hallucination / Explicit Unresolved Tracking**: Unverified terms are flagged as `status: 'unresolved'` and audited transparently. Machine translation results MUST NOT be treated as verified lexicographical data.
- **100% Offline**: Zero runtime translation API calls or external network dependencies.

---

## 2. Layout & Control Architecture

Each question prompt and each answer option features two independent, widely separated control buttons:
- **[KIRI: TERJEMAHAN]**: Toggles the verified Indonesian sentence translation for that specific line.
- **[TENGAH: KONTEN UTAMA]**: Contains the Japanese text and any revealed translations/kotoba. For options, this is the **ONLY** area that selects the answer radio button.
- **[KANAN: KOTOBA]**: Toggles the technical vocabulary list (Kotoba) containing the Japanese term, its reading, and its Indonesian definition.

### Kotoba Furigana Control
- By default, when a Kotoba list is opened, Japanese terms are displayed **without furigana** (e.g., `整頓 — penataan`).
- Furigana display is strictly synchronized with the existing **Furigana Quick Button (`F`)** on the CBT toolbar (`.furigana-quick-button`):
  - When F is OFF: all Kotoba furigana readings are hidden.
  - When F is ON: all Kotoba furigana readings are rendered natively via `<ruby><rt>` markup above the kanji.
  - Toggling F immediately updates all visible Kotoba lists without closing panels, without re-rendering the CBT workspace, and without altering Sentence Translation states.
  - Zero new state: reuses `state.examPrefs.showFurigana` and CSS class `body.hide-furigana`.

---

## 3. User Stories

### User Story 1: Full-Bank Selective Sentence Translation
> *As a candidate practicing any of the 1,006 questions across all 27 packages, I want to toggle Indonesian sentence translations independently for each question and option, so that I can practice reading in Japanese while only checking translations when needed.*

### User Story 2: Domain-Disambiguated Kotoba Vocabulary Reveal
> *As an examinee studying technical food manufacturing vocabulary, I want to open the Kotoba list on any sentence to see terms with definitions tailored to the food manufacturing industry (e.g., HACCP, hygiene, machinery), so that I learn authentic exam terminology.*

### User Story 3: Synchronized Furigana Inspection via Toolbar F
> *As a learner reviewing Kotoba, I want the vocabulary list to default to clean base text without readings, but instantly show or hide furigana readings whenever I toggle the toolbar F button, so that I can first test my kanji reading recall and only consult readings on demand without closing the Kotoba panel.*

### User Story 4: Accidental-Click-Free Option Selection
> *As a user on a mobile smartphone, I want the left and right buttons to be widely separated from the option selection area, so that tapping translation or Kotoba never accidentally selects or changes my answer choice.*

---

## 4. Functional Requirements

### 4.1 Full Bank Scope & Coverage
- **FR-001**: Feature 008 MUST apply to all 1,006 questions and 3,110 answer options across all 27 question packages without package-level gating.
- **FR-002**: The vocabulary dataset MUST be structured as a single, deduplicated shared dictionary registry (`sharedKotobaDictionary`).
- **FR-003**: Identical vocabulary terms appearing across different questions or packages MUST be deduplicated into a single normalized entry.
- **FR-004**: Questions and options MUST reference relevant Kotoba entries via stable term IDs (`kotobaIds: string[]`).

### 4.2 Legal Provenance, ShareAlike Compliance & Commercial Decoupling
- **FR-005**: Upstream Japanese lemmas and readings derived from JMdict MUST comply with CC BY-SA 4.0.
- **FR-006**: In-house Indonesian definitions and contextual food manufacturing glosses MUST be distributed under CC BY-SA 4.0 as an adapted open dataset.
- **FR-007**: The proprietary application code, UI styles, CBT engine, and subscription management logic MUST remain decoupled from the open dataset (Mere Aggregation) to protect commercial subscription models.
- **FR-008**: The system MUST NEVER ingest JIDict CC BY-NC 4.0 translations without explicit separate commercial authorization.
- **FR-009**: The CBT interface MUST display EDRDG attribution in the Exam Settings modal (`⚙`) and About/Legal views with direct links to the CC BY-SA 4.0 license and EDRDG license page.
- **FR-010**: The shared dictionary metadata MUST record the specific upstream JMdict snapshot date and version commit.
- **FR-011**: Polysemous words MUST be contextually disambiguated for the food manufacturing domain (e.g., `仕込み`, `揚げる`, `盛付け`).
- **FR-012**: Terms lacking high-confidence verification MUST be marked `status: 'unresolved'` and omitted from UI rendering; machine translation results MUST NOT be treated as verified data.
- **FR-013**: The feature MUST operate 100% offline without runtime translation APIs or network dependencies.

### 4.3 Mode Isolation & Visibility
- **FR-014**: Selective translation and Kotoba buttons MUST render exclusively during an active, untimed Practice Mode session (`s.mode === 'practice' && !s.deadline && !s.timed`).
- **FR-015**: All selective translation buttons, Kotoba buttons, and revealed content MUST be completely omitted from Full Mock Test (`s.mode === 'full'`) and Timed Custom Exam (`s.timed === true` or `s.deadline` exists).

### 4.4 3-Column Sibling Architecture
- **FR-016**: The question prompt MUST render as a 3-column row container (`.practice-prompt-row`): `[Left Button] [Center Prompt Content] [Right Button]`.
- **FR-017**: Each answer option MUST render as a 3-column row container (`.practice-option-row`): `[Left Button] [Center Radio Choice] [Right Button]`.
- **FR-018**: The left and right buttons MUST be direct DOM siblings outside `.answer-choice`.
- **FR-019**: Clicking the left button or right button MUST NOT trigger answer selection (`setAnswer`) or alter the radio selection state.
- **FR-020**: Clicking the center `.answer-choice` MUST remain the sole interaction target that selects the answer radio.

### 4.5 Furigana Control Integration (Zero New State)
- **FR-021**: Kotoba terms MUST be rendered using native `<ruby class="kotoba-ruby">${kanji}<rt>${furigana}</rt></ruby>` markup.
- **FR-022**: When the toolbar Furigana button (`.furigana-quick-button`) is OFF (`body.hide-furigana` active), all `<rt>` tags inside Kotoba lists MUST be hidden via CSS (`display: none !important`), displaying base kanji only (e.g. `整頓 — penataan`).
- **FR-023**: When the toolbar Furigana button is ON, all `<rt>` tags inside Kotoba lists MUST be visible above the base text.
- **FR-024**: Toggling the toolbar Furigana button MUST NOT re-render the exam DOM, MUST NOT close currently open Kotoba lists, and MUST NOT alter Sentence Translation states.
- **FR-025**: The system MUST NOT create a separate Furigana state or secondary toggle button for Kotoba.

### 4.6 Content Stacking Order
- **FR-026**: In the center content area, when both Sentence Translation and Kotoba are active, the vertical stacking order MUST strictly be:
  1. Japanese base text.
  2. Indonesian sentence translation.
  3. Kotoba vocabulary list.
- **FR-027**: All revealed content MUST remain confined within the center column and MUST NOT expand underneath the left or right control buttons.

### 4.7 State Stability & Shuffling
- **FR-028**: Selective states MUST be stored in memory on `activeSession.selectiveState` and cleanly reset when a practice session starts or finishes.
- **FR-029**: Option states MUST be mapped to deterministic composite option keys (`compositeOptKey = `${q.id}::${o.originalId || o.id}``) so that option states never swap, collide, or corrupt when options are shuffled (`setup.shuffleOptions`). Relying on visual letter positions A/B/C/D is strictly prohibited.
- **FR-030**: Navigating between questions via Next, Prev, or Question Map MUST preserve individual open/closed states for visited questions.

### 4.8 Global Toolbar Globe Interaction
- **FR-031**: Clicking the toolbar Globe button toggles master translation state (`state.practiceTranslationOpen`).
- **FR-032**: Toggling the toolbar Globe button MUST reset all row-level explicit translation overrides in the active session, restoring uniform visibility across all rows.
- **FR-033**: Toggling the toolbar Globe button MUST NOT affect Kotoba list visibility.

---

## 5. Acceptance Criteria

### 5.1 Full Bank Scope & Legal Provenance
- [ ] **AC-001**: All 1,006 questions and 3,110 options across all 27 packages are covered without package exclusions.
- [ ] **AC-002**: Vocabulary entries are deduplicated into a single shared dictionary registry (`sharedKotobaDictionary`).
- [ ] **AC-003**: The dataset complies with CC BY-SA 4.0; no CC BY-NC 4.0 data from JIDict is incorporated without explicit authorization.
- [ ] **AC-004**: Upstream JMdict attribution is displayed in the Exam Settings modal (`⚙`) with active links to the CC BY-SA 4.0 license and EDRDG license page.
- [ ] **AC-005**: The proprietary application code and commercial subscription capabilities are decoupled and unaffected by dataset ShareAlike obligations.
- [ ] **AC-006**: Upstream JMdict snapshot version and commit are recorded in dictionary metadata.
- [ ] **AC-007**: All displayed vocabulary entries have verified sources and contextually accurate food manufacturing definitions.
- [ ] **AC-008**: Zero definitions or furigana readings are fabricated or hallucinated; machine translations are not treated as verified data.
- [ ] **AC-009**: The extraction ledger transparently logs the total count and percentage of resolved vs. unresolved entries.
- [ ] **AC-010**: The entire dataset functions 100% offline with zero runtime API calls.

### 5.2 Kotoba Furigana Control via Toolbar F Button
- [ ] **AC-011**: When a Kotoba list is opened while toolbar Furigana is OFF, Japanese terms are displayed without furigana (e.g., `整頓 — penataan`).
- [ ] **AC-012**: Toggling the toolbar F button from OFF to ON immediately reveals furigana readings on all currently open Kotoba entries without closing the Kotoba panel.
- [ ] **AC-013**: Toggling the toolbar F button from ON to OFF immediately hides furigana readings on all currently open Kotoba entries without closing the Kotoba panel.
- [ ] **AC-014**: Furigana behavior applies identically to Kotoba lists on the question prompt and on all answer options across all packages.
- [ ] **AC-015**: Navigating to another question (Next/Prev/Map) and returning preserves the active Furigana display mode for Kotoba.
- [ ] **AC-016**: Toggling Sentence Translation (left button) or Global Globe does NOT alter Furigana display status.
- [ ] **AC-017**: Existing behavior of the toolbar F button on CBT question prompt and options is 100% preserved.

### 5.3 Sibling Architecture & Click Independence
- [ ] **AC-018**: Clicking the left translation button toggles translation without checking or unchecking the option radio.
- [ ] **AC-019**: Clicking the right Kotoba button toggles Kotoba without checking or unchecking the option radio.
- [ ] **AC-020**: Clicking the center `.answer-choice` selects the radio answer and updates answer status.
- [ ] **AC-021**: Both left and right buttons meet the minimum 44 × 44 px touch target clearance.

### 5.4 Mobile Touchscreen & Desktop Hover
- [ ] **AC-022**: On Android touchscreens, control buttons display transparent/neutral backgrounds when OFF without permanent gray boxes.
- [ ] **AC-023**: On Android touchscreens, tapping a control button does NOT cause sticky hover backgrounds after the finger is lifted.
- [ ] **AC-024**: On desktop with mouse pointer, hovering over a control button displays a subtle green tint (`rgba(169, 209, 107, 0.12)`).
- [ ] **AC-025**: Active control buttons display theme green `#a9d16b` border/accent.

### 5.5 Shuffling & Mode Isolation
- [ ] **AC-026**: In an untimed practice session with `shuffleOptions: true`, opening translation or Kotoba on an option retains that state on that exact option across navigation.
- [ ] **AC-027**: Full Mock Test and Timed Custom Exam render zero left/right buttons and zero selective translations/kotoba across all packages.
