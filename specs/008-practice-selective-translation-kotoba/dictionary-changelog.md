# SSW PM Kotoba Dictionary Changelog & Audit Ledger

**Feature**: `specs/008-practice-selective-translation-kotoba`  
**Dataset Target**: `data/sharedKotobaDictionary.json`  
**License**: Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)  
**Upstream Source**: JMdict New Generation (`JMdict_e_NG.gz`) by EDRDG  
**Upstream Snapshot**: XML `created="2026-11-12"`, DTD Rev `1.10`, SHA-256 `60cf4c4c09a8a3ec55e45fcef5e462cda242f6f228c087a6e0169ca10eaf7a84`  
**Indonesian Definition Curation**: SSW PM Mock Test Team (In-House Curation)  

---

## 1. Governance & Provenance Policy

### 1.1 Provenance Hierarchy
1. **Japanese Lemma & Kanji Form**: Sourced from JMdict base records (`<k_ele><keb>`) under CC BY-SA 4.0, cross-referenced with official SSW PM exam corpus base text.
2. **Kana Reading (Furigana)**: Sourced from authentic `<rt>` tags in the 1,006 unique questions and 3,110 unique options, validated against JMdict reading elements (`<r_ele><reb>`).
3. **Indonesian Definition**: Authored in-house and contextually disambiguated for industrial food processing operations (特定技能1号・飲食料品製造業) based on official exam textbooks.
4. **Third-Party Restriction**: Zero ingestion or bundling of Philia Space JIDict (CC BY-NC 4.0) data.
5. **Commercial Software Protection**: Under "Mere Aggregation", the application engine (`app.js`, `ZEN-APP-SHELL.css`, subscription billing) remains proprietary; only this adapted dictionary dataset is released under CC BY-SA 4.0.

### 1.2 3-Tier Status Separation & Zero-Leakage Gate
Every entry in the vocabulary pipeline is categorized into one of three strict statuses:

| Status | Definition | Rendered in UI? | Criteria for Promotion |
| :--- | :--- | :---: | :--- |
| `extracted` | Raw term identified from ruby annotations during full-bank corpus scanning. | ❌ NO | None (initial intermediate pipeline state). |
| `verified` | Lemma & reading validated against JMdict; Indonesian definition curated and verified against official SSW PM textbook context. | ✅ YES | Human verification of food manufacturing domain accuracy. |
| `unresolved` | Ambiguous term, polysemous word lacking domain consensus, or low-confidence candidate. | ❌ NO (Blocked) | Requires manual lexicographical audit. Strictly prohibited from using machine translation guesses. |

> [!CRITICAL]
> **Zero-Leakage Enforcement**:  
> The client resolver `resolveKotobaEntries(kotobaIds)` programmatically enforces `entry.status === 'verified'`. Entries marked `extracted` or `unresolved` are silently excluded from UI rendering so that examinees never encounter inaccurate or speculative definitions.

---

## 2. Audit Ledger Schema

Each record in the ledger adheres to the following specification:

```typescript
interface LedgerEntry {
  id: string;                         // e.g. "kb-seiton", "kb-shokuhin"
  kanji: string;                      // e.g. "整頓"
  furigana: string;                   // e.g. "せいとん"
  arti: string;                       // e.g. "Penataan teratur / menaruh barang pada tempat yang ditentukan"
  status: 'extracted' | 'verified' | 'unresolved';
  provenance: {
    lemmaSource: 'jmdict_edrdg' | 'exam_corpus_ruby';
    furiganaSource: 'exam_corpus_rt' | 'jmdict_edrdg';
    meaningSource: 'in_house_ssw_curated';
    lexicalLicense: 'CC-BY-SA-4.0';
  };
  domainCategory?: '5S' | 'HACCP' | 'Hygiene' | 'Machinery' | 'Safety' | 'Quality' | 'General';
  auditNotes?: string;
}
```

---

## 3. Maintenance & Changelog Specification

All modifications to the vocabulary dataset must be recorded in reverse chronological order using the template below:

### Entry Log Template
```markdown
### [YYYY-MM-DD] Version X.Y.Z — <Summary of Changes>
- **Action**: ADDED | CORRECTED_READING | DISAMBIGUATED_DEFINITION | RESOLVED | FLAGGED_UNRESOLVED
- **Term ID**: `kb-...`
- **Kanji / Reading**: `Kanji` (`furigana`)
- **Previous Value**: *<Previous definition or reading, or "None (New)">*
- **Updated Value**: *<Updated verified definition or reading>*
- **Domain Justification**: *<Citing textbook section, official standard, or HACCP guide>*
- **Reviewer**: *<Auditor name or role>*
```

---

## 4. Version History

### [2026-11-12] Version 2.3.0 — Final Acceptance Criteria Verification & Feature 008 Sign-Off (Task T029 Complete)
- **Action**: FINAL_ACCEPTANCE_VERIFICATION_COMPLETE
- **Target Files**: `sw.js`, `scratch/assert-t029-acceptance-scenarios.mjs`, `scratch/run-feature-008-verification.mjs`, `specs/008-practice-selective-translation-kotoba/tasks.md`
- **Scope & Architecture**:
  - Successfully verified all 8 Acceptance Scenarios from `quickstart.md`:
    1. Scenario 1: Mode Isolation (Standard Mock 70m & Timed Custom 100% suppress selective UI).
    2. Scenario 2: Answer Selection Independence (Control clicks do NOT select radio or alter answers).
    3. Scenario 3: Furigana Control via Toolbar F (Native `<ruby><rt>` + `body.hide-furigana` CSS rule).
    4. Scenario 4: Global Globe vs Selective Translation Interaction (Master toggle + row override reset).
    5. Scenario 5: Shuffling Invariance (`getOptionKey(qId, opt)` with `originalId` stability).
    6. Scenario 6: Android Touchscreen Simulation (44px touch targets, `:active` feedback, zero sticky hover).
    7. Scenario 7: Cross-Package Full Bank Coverage (1,006 questions, 3,110 options, zero broken lookups).
    8. Scenario 8: Settings Attribution & Full Offline Readiness (EDRDG acknowledgment + Service Worker v30 precaching for both `sharedKotobaDictionary.json` and `kotobaMapping.json`).
  - Offline Blocker Resolution:
    - Added `./data/kotobaMapping.json` to the Service Worker `CORE` precache list in `sw.js`.
    - Incremented shell cache version from `ssw-pm-mock-test-shell-v29` to `ssw-pm-mock-test-shell-v30`.
    - Guaranteed 100% first-install offline functionality for Kotoba vocabulary reveal.
  - Final Verification Metric:
    - 24/24 verification modules in `scratch/run-feature-008-verification.mjs` PASSED (100%).
    - Tasks T001–T029 are now 100% COMPLETE.

### [2026-11-12] Version 2.2.0 — Consolidated Feature 008 Verification Suite Execution (Task T028 Complete)
- **Action**: EXECUTE_CONSOLIDATED_VERIFICATION_SUITE
- **Target Files**: `scratch/run-feature-008-verification.mjs`, `tests/test-practice-selective-kotoba.mjs`
- **Scope & Architecture**:
  - Executed consolidated verification runner (`scratch/run-feature-008-verification.mjs`) covering 23 distinct verification modules across 7 functional categories.
  - Comprehensive Verification Results:
    - Primary Feature 008 Test Harness: 15/15 parts PASSED (100%).
    - Lexicographical Data (T007-T008, Curation, Quality Audit): 4/4 suites PASSED (100%).
    - User Story 1 (Selective Translation T009-T014): 5/5 suites PASSED (100%).
    - User Story 2 (Kotoba Reveal T015-T018): 4/4 suites PASSED (100%).
    - User Story 3 (Toolbar F Furigana Sync T019-T021): 3/3 suites PASSED (100%).
    - User Story 4 (Touch & Layout Ergonomics T022-T025): 4/4 suites PASSED (100%).
    - Phase 7 (Legal Attribution & SW Precache T026-T027): 2/2 suites PASSED (100%).
    - TOTAL: 23/23 PASSED (100%), 0 FAILED, 0 PENDING.
  - Factual Offline & Precache Analysis Documented:
    - Confirmed `data/sharedKotobaDictionary.json` is precached under `ssw-pm-mock-test-shell-v29`.
    - Identified that `data/kotobaMapping.json` is served via runtime cache rather than `CORE` precache, highlighting a cold-offline dependency finding for T029.
    - Audited `Promise.allSettled` error boundary behavior during Service Worker installation.
    - Verified complete licensing consistency between EDRDG requirements, dictionary metadata, and Settings attribution.

### [2026-11-12] Version 2.1.0 — Service Worker Precaching & Shell Cache Version Bump (Task T027 Complete)
- **Action**: PRECACHE_DICTIONARY_RESOURCE
- **Target Files**: `sw.js`, `tests/test-practice-selective-kotoba.mjs`, `scratch/assert-t027-service-worker-precache.mjs`
- **Scope & Architecture**:
  - Added `./data/sharedKotobaDictionary.json` to the Service Worker `CORE` precache list in `sw.js`.
  - Incremented shell cache version from `ssw-pm-mock-test-shell-v28` to `ssw-pm-mock-test-shell-v29`.
  - Path Resolution: Matches GitHub Pages repository deployment base `https://faizalart.github.io/MOCK-TEST-SSW-PM-BY-FAIZ/data/sharedKotobaDictionary.json` and local environments.
  - Lifecycle Integrity: `install` event caches the dictionary via `Promise.allSettled`, while `activate` event purges obsolete `v28` and earlier shell caches without deleting `v29`.
  - Fetch Routing: Fallback logic in `fetch` handler serves dictionary requests from cache when offline.
  - Audit Finding: Verified `data/kotobaMapping.json` status; maintained as runtime fetch per T027 boundaries.
  - Comprehensive Verification:
    - Passed all 10 checks in `scratch/assert-t027-service-worker-precache.mjs` (100%).
    - Integrated and verified in `tests/test-practice-selective-kotoba.mjs` (15/15 test parts passed 100%).

### [2026-11-12] Version 2.0.0 — EDRDG / JMdict Legal Attribution Mounted in Settings Modal (Task T026 Complete)
- **Action**: EDRDG_JMDICT_ATTRIBUTION_MOUNTED
- **Target Files**: `app.js`, `index.html`, `ZEN-APP-SHELL.css`, `tests/test-practice-selective-kotoba.mjs`, `scratch/assert-t026-edrdg-attribution.mjs`
- **Scope & Architecture**:
  - Mounted dedicated legal attribution section (`.exam-attribution-section`) in the Exam Settings Modal (`renderExamSettingsPopover()` in `app.js`):
    - Official Sample Acknowledgment Wording:
      *"This application uses data from the **JMdict** dictionary file. The JMdict data is the property of the **Electronic Dictionary Research and Development Group (EDRDG)** and is used in accordance with the Group's [licence](https://www.edrdg.org/edrdg/licence.html)."*
    - Hyperlink to official EDRDG Licence: `https://www.edrdg.org/edrdg/licence.html`.
    - Hyperlink to JMdict Dictionary Project: `https://www.edrdg.org/wiki/index.php/JMdict-EDICT_Dictionary_Project`.
    - Hyperlink to CC BY-SA 4.0 Legal Code: `https://creativecommons.org/licenses/by-sa/4.0/legalcode`.
    - Domain Matching & In-House Indonesian Curation Statement: Confirms vocabulary terms were matched to SSW Food Processing (特定技能1号・飲食料品製造業) and enriched with original in-house curated Indonesian definitions released under CC BY-SA 4.0.
    - Software Decoupling Notice (Mere Aggregation): Clarifies that the CBT exam platform, scoring engine (`app.js`), and user interface styles remain separate proprietary works.
    - Zero Endorsement Clarity: No claims of official endorsement or sponsorship by EDRDG.
  - Responsive Modal Ergonomics (`ZEN-APP-SHELL.css`):
    - Added `max-height: calc(100vh - 70px) !important;` to `.exam-settings-popover` and `overflow-y: auto !important; max-height: calc(100vh - 160px) !important;` to `.exam-settings-body` to ensure smooth scrolling and zero viewport overflow on mobile touchscreens and desktop screens.
  - Documented HTML Attribution in `index.html`:
    - Embedded structured legal comment citing EDRDG, JMdict, CC BY-SA 4.0, and the interactive Settings modal location.
  - Comprehensive Verification:
    - Passed all 11 checks in `scratch/assert-t026-edrdg-attribution.mjs` (100%).
    - Integrated and verified in `tests/test-practice-selective-kotoba.mjs` (14/14 test parts passed 100%).

### [2026-11-12] Version 1.9.0 — Vertical Content Stacking Order Enforced (Task T025 Complete)
- **Action**: VERTICAL_CONTENT_STACKING_ENFORCED
- **Target Files**: `ZEN-APP-SHELL.css`, `tests/test-practice-selective-kotoba.mjs`, `scratch/assert-t025-vertical-order.mjs`
- **Scope & Architecture**:
  - Enforced strict vertical content hierarchy: **[Japanese Base Text] → [Indonesian Translation] → [Kotoba List]**.
  - Verified DOM Order in `app.js`:
    - Prompt Row: `.question-prompt` → `.practice-question-translation` → `.practice-kotoba-list.practice-question-kotoba`.
    - Option Row: `.answer-text` → `.practice-option-translation` → `.practice-kotoba-list.practice-option-kotoba`.
  - CSS Flexbox Column Architecture (`ZEN-APP-SHELL.css`):
    - Added `display: flex !important; flex-direction: column !important;` to `.practice-prompt-center` to guarantee vertical stacking in prompt center container.
    - Preserved existing `.exam-workspace .answer-content` flex-direction column styling.
    - Styled `.practice-kotoba-list` with `display: flex !important; flex-direction: column !important; width: 100% !important; border-top: 1px dashed #d5dce2 !important;` to cleanly separate vocabulary definitions.
    - Handled overflow wrapping with `word-break: break-word !important; overflow-wrap: break-word !important;` on `.kotoba-meaning` and `flex-wrap: wrap !important;` on `.practice-kotoba-item`.
  - Dynamic Lifecycle & Clean Transitions:
    - Translation OFF + Kotoba ON: Kotoba mounts directly beneath Japanese text with zero phantom gaps.
    - Translation ON + Kotoba ON: Kotoba mounts cleanly beneath translation with 1px dashed separator.
    - Both OFF: Japanese text displays in standard CBT state with zero placeholders or layout shifts.
  - Comprehensive Verification:
    - Passed all 10 scenarios in `scratch/assert-t025-vertical-order.mjs` (100%).
    - Integrated and verified in `tests/test-practice-selective-kotoba.mjs` (13/13 test parts passed 100%).
    - Verified non-interference with Full Mock Test and Timed Custom Exam.

### [2026-11-12] Version 1.8.0 — Touch Feedback (:active) & Sticky Hover Prevention Implemented (Task T024 Complete)
- **Action**: TOUCH_FEEDBACK_ACTIVE_IMPLEMENTED
- **Target Files**: `ZEN-APP-SHELL.css`, `tests/test-practice-selective-kotoba.mjs`, `scratch/assert-t024-touch-active.mjs`
- **Scope & Architecture**:
  - Implemented responsive touch feedback in `ZEN-APP-SHELL.css` using pure CSS `:active` pseudo-class:
    - Base Pressed Feedback:
      ```css
      .practice-row-ctrl:active {
        background: rgba(169, 209, 107, 0.22) !important;
      }
      .practice-row-ctrl:active:not(.is-active) {
        background: rgba(169, 209, 107, 0.22) !important;
        border-color: #a9d16b !important;
        color: #36611c !important;
      }
      .practice-row-ctrl.is-active:active {
        background: rgba(169, 209, 107, 0.32) !important;
        border-color: #8bb850 !important;
        color: #2e5912 !important;
      }
      ```
    - Dedicated Coarse Pointer Media Query (`@media (hover: none) and (pointer: coarse)`):
      Guarantees immediate visual pressed feedback on Android touchscreens without creating persistent synthetic states or triggering sticky hover artifacts.
    - Zero JavaScript Overhead: Operates with 100% declarative CSS; zero `touchstart` or `touchend` listeners added for button feedback.
    - High Contrast & Accessibility: Pressed state icon retains strong contrast (>6:1) against the green background tint. Keyboard `:focus-visible` ring remains intact.
  - Comprehensive Verification:
    - Passed all 10 checks in `scratch/assert-t024-touch-active.mjs` (100%).
    - Integrated and verified in `tests/test-practice-selective-kotoba.mjs` (12/12 test parts passed 100%).
    - Preserved full regression compatibility with T021 furigana rules, T022 3-column grid, and T023 desktop hover styles.

### [2026-11-12] Version 1.7.0 — Control Button Styling & Desktop Hover Implemented (Task T023 Complete)
- **Action**: CONTROL_BUTTON_STYLING_IMPLEMENTED
- **Target Files**: `ZEN-APP-SHELL.css`, `tests/test-practice-selective-kotoba.mjs`, `scratch/assert-t023-control-styling.mjs`
- **Scope & Architecture**:
  - Implemented consistent button styling in `ZEN-APP-SHELL.css` for `.practice-row-ctrl`, `.practice-ctrl-trans`, and `.practice-ctrl-kotoba`:
    - Base Dimensions: Exactly 44 × 44 px minimum touch target (`width: 44px`, `min-width: 44px`, `min-height: 44px`) with flexbox centering (`display: inline-flex`, `align-items: center`, `justify-content: center`).
    - OFF State: Transparent background (`background: transparent`), neutral slate icon (`color: #6c7883`), subtle hairline border (`border: 1px solid #cfd7de`, `border-radius: 4px`), zero permanent gray background.
    - Active (ON) State: Theme green accent border (`border-color: #a9d16b`), soft translucent background (`background: rgba(169, 209, 107, 0.18)`), dark green high-contrast icon (`color: #2e5912`, 7.49:1 WCAG AAA contrast ratio).
    - Desktop Hover: Strictly scoped to `@media (hover: hover) and (pointer: fine)`:
      - OFF hover: subtle green tint (`rgba(169, 209, 107, 0.12)`), `#a9d16b` border, and `#477d25` icon.
      - ON hover: slightly intensified background (`rgba(169, 209, 107, 0.26)`).
      - Zero sticky hover on mobile touchscreens.
    - Accessibility: High-contrast keyboard focus indicator (`:focus-visible` with `outline: 2px solid #a9d16b`, `outline-offset: 2px`).
    - Icon Geometry: Centered SVG icon (`.practice-ctrl-icon`) measuring exactly 16 × 16 px with `stroke: currentColor` and `fill: none`.
  - Comprehensive Verification:
    - Passed all 10 checks in `scratch/assert-t023-control-styling.mjs` (100%).
    - Integrated and verified in `tests/test-practice-selective-kotoba.mjs` (11/11 test parts passed 100%).
    - Verified non-interference with T021 furigana rules and T022 grid layout.

### [2026-11-12] Version 1.6.0 — Responsive Three-Column Sibling Grid Layout Implemented (Task T022 Complete)
- **Action**: THREE_COLUMN_SIBLING_GRID_IMPLEMENTED
- **Target Files**: `ZEN-APP-SHELL.css`, `tests/test-practice-selective-kotoba.mjs`, `scratch/assert-t022-three-column-grid.mjs`
- **Scope & Architecture**:
  - Implemented responsive 3-column sibling grid layout in `ZEN-APP-SHELL.css`:
    ```css
    .practice-prompt-row,
    .practice-option-row {
      display: grid !important;
      grid-template-columns: 44px minmax(0, 1fr) 44px !important;
      gap: 10px !important;
      align-items: stretch !important;
      width: 100% !important;
      box-sizing: border-box !important;
    }

    .practice-prompt-center {
      min-width: 0 !important;
      width: 100% !important;
    }

    .practice-option-row .answer-choice {
      min-width: 0 !important;
      width: 100% !important;
      margin: 0 !important;
    }
    ```
  - Viewport Ergonomics & Zero Accidental Touches:
    - Mobile (390px viewport, 362px row): Center content column receives 254px (70.2% width), and buttons are separated by 274px (>= 200px threshold to eliminate accidental touchscreen answer selection).
    - Desktop (1440px viewport, 930px row): Center content column receives 822px (88.4% width), with an 842px button separation.
  - Blowout Protection: Added `min-width: 0 !important` to center containers (`.practice-prompt-center` and `.practice-option-row .answer-choice`) ensuring long unbroken Japanese text or rich media cannot distort or blow out grid column boundaries.
  - Standard CBT Isolation: Left base `.answer-choice` untouched; changes strictly scoped to `.practice-option-row .answer-choice`. Full Mock Test and Timed Custom Exam remain unimpacted.
  - Comprehensive Verification:
    - Passed all 9 scenarios in `scratch/assert-t022-three-column-grid.mjs` (100%).
    - Integrated and verified in `tests/test-practice-selective-kotoba.mjs` (10/10 test parts passed 100%).

### [2026-11-12] Version 1.5.0 — Dedicated Kotoba Furigana CSS Rule Implemented (Task T021 Complete)
- **Action**: KOTOBA_FURIGANA_CSS_RULE_IMPLEMENTED
- **Target Files**: `ZEN-APP-SHELL.css`, `tests/test-practice-selective-kotoba.mjs`, `scratch/assert-t021-kotoba-css.mjs`
- **Scope & Architecture**:
  - Implemented dedicated scoped visibility rule in `ZEN-APP-SHELL.css`:
    ```css
    body.hide-furigana .kotoba-ruby rt {
      display: none !important;
    }
    ```
  - Cascade & Specificity Harmony: Evaluates with class-level specificity `(0, 2, 1)`, providing high-priority override and complete alignment with upstream `RICH-HTML-STYLES.css` (`body.hide-furigana ruby rt`).
  - Zero Semantic Erosion: Scoped specifically to `<rt>` child elements inside `.kotoba-ruby`; ensures base kanji/lemma, Indonesian translation (`.kotoba-meaning`), and the overall list container (`.practice-kotoba-list`) remain fully visible and open.
  - Furigana Synchronization Checkpoint: User Story 3 (Furigana Synchronization via Toolbar F) is fully operational with zero secondary state and zero DOM churn.
  - Comprehensive Verification:
    - Passed all 8 checks in `scratch/assert-t021-kotoba-css.mjs` (100%).
    - Verified in `tests/test-practice-selective-kotoba.mjs` (Task T021 verified).

### [2026-11-12] Version 1.4.0 — Ruby Rendering for Kotoba Furigana Verified (Task T020 Complete)
- **Action**: KOTOBA_RUBY_RENDERING_VERIFIED
- **Target Files**: `app.js`, `tests/test-practice-selective-kotoba.mjs`, `scratch/assert-t020-kotoba-ruby.mjs`
- **Scope & Architecture**:
  - Audited production `renderKotobaList(kotobaEntries)` in `app.js` and confirmed that canonical `<ruby class="kotoba-ruby">${esc(entry.kanji)}<rt>${esc(entry.furigana || '')}</rt></ruby>` rendering was cleanly established during Task T017.
  - Zero Redundant Implementation: Verified that no duplicate renderer or code churn is needed in `app.js`.
  - Comprehensive Verification (8 Scenarios in `scratch/assert-t020-kotoba-ruby.mjs` and Part 8 in `tests/test-practice-selective-kotoba.mjs`):
    - Canonical `<ruby>` and `<rt>` markup structure verified across prompt and option rows.
    - Kanji and reading values sourced authentic dictionary fields (`entry.kanji` and `entry.furigana`).
    - Missing or empty reading safety: terms without reading (e.g., pure katakana `パン`) render `<rt></rt>` cleanly with zero fake or hallucinated furigana.
    - Security Escaping: all attributes and text content are sanitized with `esc()`, preventing XSS vulnerabilities.
    - Strict component parity: prompt rows (`.practice-prompt-center`) and option rows (`.answer-content`) share identical Ruby list rendering.
    - Zero separate furigana state: completely relies on `state.examPrefs.showFurigana` and CSS class `body.hide-furigana`.
    - Preserved 100% backward compatibility with T017, T018, and T019 test suites.

### [2026-11-12] Version 1.3.0 — Kotoba Furigana Synchronization Tests Implemented (Task T019 Complete)
- **Action**: FURIGANA_SYNC_TESTS_IMPLEMENTED
- **Target Files**: `tests/test-practice-selective-kotoba.mjs`, `scratch/assert-t019-furigana-sync.mjs`
- **Scope & Architecture**:
  - Implemented comprehensive assertion suites in `scratch/assert-t019-furigana-sync.mjs` (11 tests) and `tests/test-practice-selective-kotoba.mjs` (Part 7, 8 criteria) verifying User Story 3 Furigana synchronization contracts.
  - Verified that Kotoba terms use native `<ruby class="kotoba-ruby">${kanji}<rt>${furigana}</rt></ruby>` markup, perfectly aligned with the global furigana mechanism governed by `body.hide-furigana`.
  - Verified that toggling toolbar F (`toggle-furigana-quick`) toggles `state.examPrefs.showFurigana` and `body.hide-furigana` without re-rendering the exam DOM (`renderExam()` is not called) and without closing open Kotoba lists.
  - Verified multi-node state independence: toggling F does not alter prompt or option Kotoba states (`kotoba` remains true), does not alter sentence translation overrides (`translation`), does not modify the global globe state, and does not create any secondary furigana states (FR-025).
  - Verified question navigation and mode gating: furigana display mode persists across question navigation, while Full Mock Test and Timed Practice continue standard CBT operation without selective Kotoba controls.
  - Production Readiness & Phase 5 Audit:
    - T020 (`<ruby class="kotoba-ruby">` markup): Verified already mounted and operational in `renderKotobaList()` (T017).
    - T021 (Dedicated CSS rule `body.hide-furigana .kotoba-ruby rt { display: none !important; }` in `ZEN-APP-SHELL.css`): Correctly audited and transparently marked `PENDING_IMPLEMENTATION (T021)` without premature claims. General suppression rule in `RICH-HTML-STYLES.css` remains active in the interim.

### [2026-11-12] Version 1.2.0 — Selective Kotoba State Handler & Click Router Implemented (Task T018 Complete)
- **Action**: KOTOBA_CLICK_HANDLER_IMPLEMENTED
- **Target Files**: `app.js`, `tests/test-practice-selective-kotoba.mjs`, `scratch/assert-t018-kotoba-click-handler.mjs`
- **Scope & Architecture**:
  - Implemented production helper `toggleSelectiveKotoba(s = activeExam(), qId, optKey = null)` in `app.js` with independent boolean toggle (`false -> true -> false`) for question prompt and individual answer options.
  - Option Composite Key Integration: Operates directly on stable composite option keys (`${qId}::${originalId}`), maintaining 100% invariance to visual option shuffling.
  - Scope & State Independence: Toggling prompt Kotoba leaves options untouched; toggling an option leaves other options and prompt untouched; toggling Kotoba never mutates sentence translation states (`translation`), global toolbar globe, answer selections (`session.answers`), or question navigation.
  - Mode Gating: Strictly gated to Untimed Practice Mode (`s && s.mode === 'practice' && !s.deadline && !s.timed`); completely inactive on Full Mock Test and Timed Custom Exam.
  - Event Router Integration: Connected `case 'toggle-selective-kotoba':` in `handleAction()` with target validation (`prompt` vs `option`).
  - Preload & Latency Tolerance: Awaits `ensureKotobaDataLoaded()` with non-blocking error handling (`catch (e) {}`), ensuring zero crashes even under offline or slow network conditions.
  - Dynamic UI Synchronization: Calls `renderExam()` immediately on toggle to update `.is-active`, `aria-expanded`, dynamic tooltips, and mount/unmount `.practice-kotoba-list`.
  - Verification & Checkpoint:
    - Passed all 12 scenario tests in `scratch/assert-t018-kotoba-click-handler.mjs` (100%).
    - Passed all assertions in `tests/test-practice-selective-kotoba.mjs` (Task T018 verified).
    - Checkpoint User Story 2 (Kotoba Reveal) fully achieved. Stop at T018.

### [2026-11-12] Version 1.0.0 — Production Kotoba Resolver & Viewer Implemented (Task T017 Complete)
- **Action**: KOTOBA_RESOLVER_AND_VIEWER_IMPLEMENTED
- **Target Files**: `app.js`, `tests/test-practice-selective-kotoba.mjs`, `scratch/assert-t017-production-kotoba.mjs`
- **Scope & Architecture**:
  - Implemented production resolver `resolveKotobaEntries(target, optOrKey = null, dictOverride = null, mappingOverride = null)` in `app.js` supporting prompt (`qId, null`), option (`qId, optKey`), and direct term ID array signatures.
  - Shuffling Invariance & Identity: Option resolution reliably extracts `originalId` from option objects or composite keys (`${qId}::${originalId}`), retrieving correct terms regardless of visual A/B/C/D position post-shuffle.
  - Status Gate & Deduplication: Strictly resolves against `sharedKotobaDictionary.terms`, filtering out unresolved morpheme fragments and non-existent IDs so only `status: "verified"` entries are returned. Strips duplicate term IDs in a single list while preserving source order.
  - In-Memory Cache & Preload: Added `ensureKotobaDataLoaded()` and `setKotobaData()` with in-memory caching (`kotobaMappingCache`, `kotobaDictionaryCache`), eliminating repeated fetches and backgrounding preload upon `startExam()` in practice mode.
  - Production Component `renderKotobaList(kotobaEntries)`: Produces semantic vertical markup containing `<ruby class="kotoba-ruby">${esc(kanji)}<rt>${esc(furigana)}</rt></ruby>`, separator `—`, and `<span class="kotoba-meaning">${esc(arti)}</span>`.
  - Furigana Sync: Native `<ruby><rt>` structure directly responds to existing `body.hide-furigana` and toolbar F toggling without secondary states or DOM re-rendering.
  - Security Escaping: All fields (`kanji`, `furigana`, `arti`, `id`) are sanitized with `esc()`, eliminating XSS vulnerabilities.
  - DOM Center Column Integration: Mounted into `renderExam()` in `.practice-prompt-center` and `.answer-content`. Enforces strict vertical stacking hierarchy: 1. Japanese base text → 2. Sentence translation (if active) → 3. Kotoba list (if active). When translation is OFF, Kotoba is placed directly beneath Japanese text.
  - Automated Verification: Verified 100% across all 14 criteria in `scratch/assert-t017-production-kotoba.mjs` and `tests/test-practice-selective-kotoba.mjs`. Click router action `toggle-selective-kotoba` remains safely deferred to Task T018.

### [2026-11-12] Version 1.0.0 — Right-Side Kotoba Controls Mounted (Task T016 Complete)
- **Action**: KOTOBA_CONTROLS_MOUNTED
- **Target File**: `app.js`
- **Scope & Architecture**:
  - Mounted right-side control button `.practice-row-ctrl.practice-ctrl-kotoba` within `.practice-prompt-row` and `.practice-option-row` in `renderExam()` in `app.js`, replacing temporary `.practice-row-slot` spacing placeholders.
  - Prompt Row Integration: Configured with `data-action="toggle-selective-kotoba"`, `data-target-type="prompt"`, `aria-label="Kosakata Soal"`, dynamically reflecting `isPromptKotobaOpen = Boolean(qSelState?.kotoba)`.
  - Option Row Integration: Configured with `data-action="toggle-selective-kotoba"`, `data-target-type="option"`, deterministic composite key `data-opt-key="${esc(getOptionKey(q.id, o))}"`, and `aria-label="Kosakata Opsi ${letter}"`, dynamically reflecting `isOptKotobaOpen = Boolean(optSelState?.kotoba)`.
  - Sibling Architecture & Radio Integrity: Kotoba button is mounted as a direct sibling outside `.answer-choice`, guaranteeing that control presence does not affect radio selection behavior or mutate `session.answers`.
  - Shuffling Invariance: Options preserve their permanent `originalId` via composite keying (`${qId}::${opt.originalId || opt.id}`), ensuring stable mapping across shuffle cycles.
  - Untimed Practice Mode Guard: Strictly gated by `Boolean(s && s.mode === 'practice' && !s.deadline && !s.timed)`; 100% suppressed on Full Mock Test and Timed Custom Exam modes.
  - Safe Implementation Staging: In accordance with task boundaries, click router action `toggle-selective-kotoba` (T018) and term list renderer `renderKotobaList()` (T017) are intentionally deferred without premature mock interactions.
  - Automated Verification: Verified via `scratch/assert-t016-kotoba-markup.mjs` and updated `tests/test-practice-selective-kotoba.mjs` across all 8 criteria (100% pass rate).

### [2026-11-12] Version 1.0.0 — Kotoba Viewer & Term Resolver Unit Tests (Task T015 Complete)
- **Action**: KOTOBA_RESOLVER_VIEWER_TEST_INITIALIZED
- **Target Files**: `tests/test-practice-selective-kotoba.mjs`, `scratch/assert-t015-kotoba-resolver.mjs`
- **Scope & Architecture**:
  - Integrated Part 3 into test harness `tests/test-practice-selective-kotoba.mjs` and created focused runner `scratch/assert-t015-kotoba-resolver.mjs` to test Kotoba resolver contracts against real dataset schemas (`data/kotobaMapping.json`, `data/sharedKotobaDictionary.json`).
  - Active Data & Contract Verification (9 Criteria Passed 100%):
    1. *Question Mapping*: Resolved verified term arrays from `mapping.questions` across distinct package IDs (`kunci1-q001`, `kunci-ujian-2-q001`, `bonus-soal-1-q001`, `lab-haccp-001`).
    2. *Option Mapping & Shuffling Invariance*: Verified that option resolution prioritizes `originalId` over visual letter (e.g. Option A shuffled to slot C resolves A's terms, not C's).
    3. *Dictionary Reference Resolution*: Sampled 1,662+ consecutive dictionary lookups, confirming 0 broken links against `sharedKotobaDictionary.terms`.
    4. *Status Gate Enforcement*: Verified that terms with `status === 'unresolved'` (such as fragment `kb-ext-0001-e383bce383` or unverified audit ledger items) are 100% filtered out; only `status === 'verified'` terms pass.
    5. *Meaning & Reading Schema*: Asserted presence of non-empty `kanji`, `furigana`, and `arti` (Indonesian definition contextually disambiguated for food manufacturing).
    6. *Uniqueness*: Enforced deduplication of redundant term IDs in a single term list.
    7. *Scope Isolation*: Confirmed prompt, Option A, Option B, etc., maintain isolated scopes without cross-contamination.
    8. *Missing Reference Safety*: Asserted that null/invalid `qId`, non-existent composite keys, empty arrays, or unknown term IDs return empty array `[]` safely without throwing exceptions or corrupting sessions.
    9. *Deterministic Results*: Confirmed successive resolutions yield identical, immutable results.
  - Production UI Component Gate: Inspected `app.js` and confirmed production viewer `renderKotobaList()`, button `.practice-ctrl-kotoba`, and click router `toggle-selective-kotoba` remain cleanly gated as `PENDING_IMPLEMENTATION (T016–T018)` without premature claims.
  - Zero edits to `app.js`, CSS, dictionary, mapping, or question JSON bundles.

### [2026-11-12] Version 1.0.0 — Global Globe Translation Toggle & Row-Level Override Sync (Task T014 Complete)
- **Action**: GLOBAL_GLOBE_SYNC_IMPLEMENTED
- **Target File**: `app.js`
- **Scope & Architecture**:
  - Implemented `resetSelectiveTranslationOverrides(s = activeExam())` in `app.js` to iterate across all recorded questions and option keys in `s.selectiveState.questions` and restore row-level `translation: null`.
  - Integrated `resetSelectiveTranslationOverrides(s)` inside `case 'toggle-practice-translation':` in `handleAction()` right after toggling `state.practiceTranslationOpen = !state.practiceTranslationOpen`.
  - Enforced FR-031 & FR-032 Contract: Toggling the master Globe button inverts `state.practiceTranslationOpen` and clears all explicit row overrides across active session questions, uniformly aligning all prompts and options with the global translation state.
  - Enforced FR-033 Contract: Toggling the toolbar Globe button strictly preserves Kotoba list reveal states (`qState.kotoba` and `optState.kotoba` remain unaltered).
  - Preserved Quickstart Scenario 4 Hierarchy: While the Globe is ON, candidates can toggle individual prompt or option translations OFF (setting `translation: false`). Toggling the Globe OFF then cleanly resets all rows (including overrides) to `null`, uniformly hiding all translations.
  - Session Integrity: Candidate answers (`session.answers`), current question index (`session.currentIndex`), and navigation state remain 100% untouched throughout global synchronization.
  - Mode Guard: Gated strictly behind `Boolean(s && s.mode === 'practice' && !s.deadline && !s.timed)`, ensuring Full Mock Test and Timed Custom modes cannot trigger translation toggling.
  - Verification Suite: Created `scratch/assert-t014-global-sync.mjs` and verified 9 targeted assertion scenarios with 100% pass rate.

### [2026-11-12] Version 1.0.0 — Left Selective Sentence Translation Click Handler (Task T013 Complete)
- **Action**: CLICK_ROUTER_ACTION_IMPLEMENTED
- **Target File**: `app.js`
- **Scope & Architecture**:
  - Implemented `toggleSelectiveTrans(s, qId, optKey = null)` in `app.js` supporting both question prompt (`targetType === 'prompt'`) and option row (`targetType === 'option'`) targets.
  - Connected action `case 'toggle-selective-trans':` within centralized `handleAction` router, triggered seamlessly by the existing delegated click architecture.
  - Implemented Override Rule Hierarchy: If local override is `null`, inherits effective status from `state.practiceTranslationOpen`. First click inverts current effective status and persists it as an explicit local override (`true` or `false`). Subsequent clicks cleanly flip the boolean override.
  - Multi-Node State Isolation: Mutating prompt translation does not alter option translations, and toggling Option A leaves sibling options B, C, etc. completely untouched.
  - Answer Selection Integrity: Controls reside strictly outside `.answer-choice`, preventing translation toggle clicks from selecting radio choices or modifying `session.answers[q.id]`.
  - Mode Guard: Event router strictly verifies `Boolean(s && s.mode === 'practice' && !s.deadline && !s.timed)`, completely suppressing execution in Full Mock Test and Timed Custom Exam modes.
  - UI State Synchronization: Calls `renderExam()` immediately after toggle, seamlessly updating button visual active state (`.is-active`), `aria-expanded`, dynamic tooltips, and revealed translation text.

### [2026-11-12] Version 1.0.0 — Markup 3-Column Layout & Left Sentence Translation Control (Task T012 Complete)
- **Action**: 3_COLUMN_MARKUP_MOUNTED
- **Target File**: `app.js`
- **Scope & Architecture**:
  - Implemented 3-column question prompt markup `.practice-prompt-row` containing left translation button `.practice-row-ctrl.practice-ctrl-trans` (`data-action="toggle-selective-trans"`, `data-target-type="prompt"`), center prompt container `.practice-prompt-center` (Japanese prompt + conditional translation), and right slot `.practice-row-slot` (`aria-hidden="true"`).
  - Implemented 3-column option markup `.practice-option-row` with direct sibling layout: left translation button `.practice-row-ctrl.practice-ctrl-trans` (`data-action="toggle-selective-trans"`, `data-target-type="option"`, `data-opt-key`), center `.answer-choice` (`role="radio"`), and right slot `.practice-row-slot`.
  - Sibling Isolation Guarantee: Left translation button resides strictly outside `.answer-choice`, ensuring clicking controls cannot trigger answer selection.
  - Radio Integrity: `.answer-choice` remains the sole element carrying `data-action="answer"`.
  - Mode Isolation: Selective markup is strictly gated by `Boolean(s && s.mode === 'practice' && !s.deadline && !s.timed)`. Full Mock Test and Timed Custom sessions remain 100% on the baseline CBT structure with zero selective wrappers.
  - Translation Reveal Hierarchy: Inherits global toolbar globe state when local state is `null`, while respecting explicit local override flags (`true`/`false`).
  - Zero UI Layout Shift: Right slot `.practice-row-slot` maintains grid spacing until Kotoba control button is mounted in Phase 4 (T016).

### [2026-11-12] Version 1.0.0 — Automated Test Seleksi & Isolasi Klik Harness (Task T011 Complete)
- **Action**: TEST_HARNESS_INITIALIZED
- **Target Files**: `tests/test-practice-selective-kotoba.mjs`, `app.js`
- **Scope & Architecture**:
  - Preflight Hardening in `buildExamQuestions()`: Ensured permanent `originalId` is strictly derived from actual original option IDs without fallback to visual letters (A/B/C/D) or position indices (`item.opt.originalId || item.opt.id || null`).
  - Preflight Hardening in `getOptionKey()`: Guarded post-shuffle options against falling back to visual letters when `originalId` is explicitly `null`.
  - Test Harness Established: Created Node.js automated test harness in `tests/test-practice-selective-kotoba.mjs`.
  - Active Baseline Checks Verified:
    1. Mode isolation verified (Untimed Practice ON, Timed Mock / Timed Custom OFF).
    2. Baseline answer radio selection verified (`session.answers[q.id]` updates cleanly on `.answer-choice` click).
    3. Composite option key stability verified across shuffling (`${qId}::${opt.originalId || opt.id}`).
    4. Multi-node state independence verified across question prompt and individual options.
  - Contract Specification Ledger: Encoded all 8 behavioral acceptance criteria for left/right button isolation, answer radio immunity, option-level isolation, and untimed practice gating.
  - Safe Implementation Gating: Production UI readiness inspection safely defers click simulation on unmounted buttons to Tasks T012–T014 without false claims of premature completion.

### [2026-11-12] Version 1.0.0 — Stable Composite Option Key Implementation (Task T010 Complete)
- **Action**: COMPOSITE_OPTION_KEY_IMPLEMENTED
- **Target File**: `app.js`
- **Scope & Architecture**:
  - Implemented deterministic composite option key helper `getOptionKey(qId, opt)` with format `${qId}::${opt.originalId || opt.id}`.
  - Strict priority order: `opt.originalId` takes precedence over visual `opt.id`.
  - Zero false fallback: Rejects missing/empty question IDs or option IDs with `null` without falling back to visual letters (A/B/C/D) or array indices.
  - Object immutability: Does not mutate the option object passed into the helper.
  - Cross-Question Isolation: Options with identical ID across different questions generate strictly distinct composite keys.
  - Full Bank Coverage: 100% of 3,110 options across 1,006 unique questions generate globally unique composite keys matching `data/kotobaMapping.json`'s `byCompositeKey`.
  - Shuffling Invariance: Hardened `buildExamQuestions(setup)` with `item.opt.originalId || item.opt.id || String.fromCharCode(65 + newIdx)`, ensuring absolute option identity invariance across repeated (50+) shuffle cycles.
  - Selective State Integration: Enhanced `getSelectiveOptionState` to accept original option ID string, composite key string (`${qId}::${optId}`), or option object, seamlessly binding selective translation and Kotoba reveal states to the stable option identity regardless of display order.
  - Zero DOM/UI mutation, zero CSS changes, zero changes to dictionary (`data/sharedKotobaDictionary.json`), mapping (`data/kotobaMapping.json`), or 7 question JSON bundles.

### [2026-11-12] Version 1.0.0 — Session-Scoped Selective State Initialization (Task T009 Complete)
- **Action**: SESSION_SELECTIVE_STATE_INITIALIZED
- **Target File**: `app.js`
- **Scope & Architecture**:
  - Implemented in-memory, session-scoped selective state on active practice sessions (`isPractice`).
  - Strict mode gate: Timed mock tests (`mode: 'exam'`) strictly bypass selective state initialization.
  - Non-enumerable descriptor (`enumerable: false`): Guarantees absolute storage isolation. HTML `structuredClone()` and `JSON.stringify()` completely omit `selectiveState`, preventing leakage into IndexedDB (`put('sessions', s)`) or LocalStorage.
  - Hierarchical Sparse Model: Initialized with `{ questions: {} }`. Child question and option state allocated lazily on demand via accessors:
    - `getSelectiveQuestionState(s, qId, create = false)`
    - `getSelectiveOptionState(s, qId, origOptId, create = false)`
  - Default shapes:
    - Question: `{ translation: null, kotoba: false, options: {} }` (`translation: null` delegates to global header toggle).
    - Option: `{ translation: null, kotoba: false }`.
  - Lifecycle Cleanup:
    - `finishExam()`: Explicit `delete s.selectiveState` prior to database persistence.
    - Session Interrupt: Explicit deletion of `selectiveState` on existing active session when launching a new exam.
    - `resume-session`: Automatic re-hydration of non-enumerable `selectiveState` for in-progress practice sessions.
  - Persistence Across Navigation: In-memory state remains fully intact across question index navigation (`moveExamTo`, prev/next, question map).
  - Zero DOM/UI mutation, zero CSS changes, zero changes to dictionary (`data/sharedKotobaDictionary.json`), mapping (`data/kotobaMapping.json`), or 7 question JSON bundles.

### [2026-11-12] Version 1.0.0 — Full-Bank Kotoba Reference Mapping (Task T008 Complete)
- **Action**: SIDECAR_MAPPING_COMPILED
- **Mapping Target**: `data/kotobaMapping.json` (844,965 bytes, SHA-256: `8946c87d8c12fef0adbd022f91758f610f68f968155475818deeffa817ed9210`)
- **Scope Covered**:
  - 1,006 unique questions mapped (855 prompt locations with verified Kotoba).
  - 3,110 unique options mapped (2,446 option locations with verified Kotoba).
  - 3,318 total occurrence locations accounted for (3,301 verified, 17 unresolved-only isolated).
  - 15,332 verified term occurrences linked into 14,796 unique reference entries.
- **Zero Modification to Source Bundles**:
  - Implemented decoupled sidecar architecture; all 7 question JSON bundles remain 100% untouched.
  - Zero modification to `data/sharedKotobaDictionary.json` (SHA-256: `f2f8c08506ed6756d8e7f7b4dbf35bf85fb00234515993b051843f1cd903a1e7`).
- **Integrity & Zero Leakage**:
  - 0 orphan references, 0 missing mappings.
  - 100% of 44 unresolved terms safely blocked and documented in `unresolvedAuditLedger`.
  - Shuffling immunity verified: `originalId` and composite key `${qId}::${originalOptionId}` guarantee zero swapped options.

### [2026-11-12] Version 1.0.0 — JMdict Metadata & Attribution Compliance (Task T007 Complete)
- **Action**: COMPLIANCE_AND_ATTRIBUTION_ENRICHED
- **Dataset Target**: `data/sharedKotobaDictionary.json` (5,079,115 bytes, SHA-256: `f2f8c08506ed6756d8e7f7b4dbf35bf85fb00234515993b051843f1cd903a1e7`)
- **Terms Invariance Check**: Terms SHA-256 is 100% identical before and after update (`59eca03d158e89602f44d0ef60dcca8853b7bc3b52e5cdfa2acb8b04b0917184`). Zero vocabulary modifications.
- **Upstream Snapshot Verification**:
  - Entity: Electronic Dictionary Research and Development Group (EDRDG)
  - Project: JMdict New Generation (`JMdict_e_NG.gz`, DTD Rev `1.10`, XML `created="2026-11-12"`)
  - Snapshot Verified SHA-256: `60cf4c4c09a8a3ec55e45fcef5e462cda242f6f228c087a6e0169ca10eaf7a84`
  - Upstream Git Commit: Designated as `N/A` (no fabricated hash).
  - License: CC BY-SA 4.0 (`https://www.edrdg.org/edrdg/licence.html`).
- **Provenance Separation Enforced**:
  - `ent_seq`: JMdict NG by EDRDG (`CC BY-SA 4.0`).
  - `kanji`: Composite Exam Ruby Markup & JMdict NG `keb` elements (`CC BY-SA 4.0`).
  - `furigana`: Composite Exam `<rt>` Annotations & JMdict NG `reb` elements (`CC BY-SA 4.0`).
  - `pos`: JMdict NG part-of-speech codes (`CC BY-SA 4.0`).
  - `arti`: Original in-house SSW PM curation (`CC BY-SA 4.0`).
  - `occurrences`: Local SSW PM exam corpus context (`Proprietary CBT Context`).
- **Third-Party JIDict Exclusion Statement**:
  - Formally codified `thirdPartyExclusionStatement`: Zero Philia Space JIDict CC BY-NC 4.0 translation or lexical data ingested, maintaining full commercial compatibility.
- **EDRDG Attribution & Periodic Update Compliance**:
  - Non-ownership disclaimer codified: No proprietary claims asserted over EDRDG upstream entries.
  - Periodic update procedure established with target monthly review cadence following EDRDG licensing guidelines.
  - Structured `settingsModalAttribution` data block prepared for consumption by Task T026 in Settings Modal (`⚙`).

### [2026-11-12] Version 1.0.1 — Quality Audit & Lexical Correction (Task T006 Complete)
- **Action**: AUDITED_AND_CORRECTED
- **Dataset Target**: `data/sharedKotobaDictionary.json` (5,073,541 bytes, SHA-256: `1a3e55dc63646fcdac782836afe295e514389ed29fc97fc8111791fa36401c56`)
- **Corpus Coverage**: 100.0% across all 1,006 unique questions and 3,110 unique options (3,318 unique question/option occurrence locations, 0 missing).
- **Summary Metrics**:
  - **Total Lexical Terms**: 1,809 entries
  - **Verified Terms**: 1,765 entries (97.6%)
  - **Unresolved Terms**: 44 entries (2.4% — non-standalone morphemes, corrupted `<ruby>` fragments, exam ruby typos)
  - **Technical SSW PM Terms**: 1,341 entries (76.0%)
  - **General Workplace Terms**: 424 entries (24.0%)
  - **Cross-Tabulation (`matchStatus` × `status`)**:
    - `matched` (1,123 entries): 1,122 verified, 1 unresolved (`kb-1269730` [後手::ごて])
    - `contextual_review` (200 entries): 194 verified, 6 unresolved fragments
    - `unmatched` (480 entries): 444 verified, 36 unresolved fragments (including `kb-ext-0426-e7b9b03a3a` [繰::かえ])
    - `ambiguous` (6 entries): 5 verified, 1 unresolved (`kb-ext-1758-e6b5813a3a` [流::りゅう])
    - **Total**: 1,765 verified + 44 unresolved = 1,809 entries
  - **Detailed Sub-Status Metrics**:
    - `furiganaStatus`: 1,800 verified, 9 unresolved (total: 1,809)
    - `meaningStatus`: 1,765 verified, 44 unresolved (total: 1,809)
    - `status`: 1,765 verified, 44 unresolved (total: 1,809)
  - **Placeholder Definitions Remaining**: 0 (all 21 previous generic placeholders replaced with authentic domain-curated definitions)
  - **Evidence & Review Notes**: 100% of verified entries possess traceable domain evidence and review notes.
- **Lexical Error Corrections**:
  1. `流::りゅう` (`kb-ext-1758-e6b5813a3a`):
     - Identified that `kunci1-q032::prompt` contains `<ruby>洗<rt>せん</rt></ruby>い<ruby>流<rt>りゅう</rt></ruby>す` (exam question author typo for `あらいながす`).
     - Transferred `kunci1-q032` occurrence to canonical verb entry `kb-ext-1757-e6b5813a3a` (`流::なが`, normalized: `洗い流す`, 15 occurrences total).
     - Demoted `kb-ext-1758-e6b5813a3a` to `status: 'unresolved'`, `entryType: 'morpheme_fragment'`, `arti: ''` with explicit review note.
  2. `繰::かえ` (`kb-ext-0426-e7b9b03a3a`):
     - Identified that `kunci-ujian-2-q014::A` contains `<ruby>繰<rt>かえ</rt></ruby>り<ruby>返<rt>かえ</rt></ruby>し` (exam ruby typo for `くりかえし`).
     - Transferred occurrence to canonical verb entry `kb-ext-0427-e7b9b03a3a` (`繰::く`, normalized: `繰り返す`, 5 occurrences total).
     - Demoted `kb-ext-0426-e7b9b03a3a` to `status: 'unresolved'`, `entryType: 'morpheme_fragment'`, `arti: ''`.
  3. `後手::ごて` (`kb-1269730`):
     - Identified as an artificial extraction artifact from unpunctuated phrase `トイレの後手を水だけで洗う` (setelah toilet, tangan...).
     - Demoted to `status: 'unresolved'`, `entryType: 'morpheme_fragment'`, `arti: ''`.
- **Reconciliation of 1,818 Staging Pairs to 1,809 Dictionary Entries (9 Collisions Resolved)**:
  During T005 deduplication, 9 staging pairs collided on the same upstream JMdict `ent_seq`. All 9 collisions were reconciled with zero lost question IDs or composite option keys:
  1. `黄色` (`ent_seq: 1576760`): Combined `ext-0154` (`きいろ`, 2 occ) and `ext-0155` (`おうしょく`, 34 occ) into canonical entry `kb-1576760` with `readingVariants: ['おうしょく']`. Total 36 occurrences preserved (critical for `黄色ブドウ球菌`).
  2. `目` / `眼` (`ent_seq: 1604890`): Combined `ext-0951` (`目::め`, 13 occ) and orthographic variant `ext-0308` (`眼::め`, 3 occ) into `kb-1604890` with `kanjiVariants: ['眼']`. Total 16 occurrences preserved.
  3. `工場` (`ent_seq: 1578700`): Combined `ext-0545` (`こうじょう`, 18 occ) and `ext-0544` (`こうば`, 1 occ) into `kb-1578700` with canonical reading `こうじょう` and `readingVariants: ['こうば']`. Total 19 occurrences preserved.
  4. `重` / `主` (`ent_seq: 1324940`): Combined `ext-0917` (`重::おも`, 58 occ) and `ext-0777` (`主::おも`, 25 occ) into `kb-1324940` with `kanjiVariants: ['主']`. Total 83 occurrences preserved.
  5. `手指` (`ent_seq: 1327710`): Combined `ext-0784` (`しゅし`, 2 occ) and `ext-0783` (`てゆび`, 2 occ) into `kb-1327710` with canonical reading `しゅし` and `readingVariants: ['てゆび']`. Total 4 occurrences preserved.
  6. `身体` (`ent_seq: 2830705`): Combined `ext-0970` (`からだ`, 3 occ) and `ext-0969` (`しんたい`, 3 occ) into `kb-2830705` with canonical reading `からだ` and `readingVariants: ['しんたい']`. Total 6 occurrences preserved.
  7. `生` (`ent_seq: 2088240`): Combined `ext-1029` (`せい`, 3 occ) and `ext-1028` (`しょう`, 3 occ) into `kb-2088240` with canonical reading `せい` and `readingVariants: ['しょう']`. Total 6 occurrences preserved.
  8. `生肉` (`ent_seq: 1829790`): Combined `ext-1044` (`なまにく`, 5 occ) and `ext-1045` (`せいにく`, 2 occ) into `kb-1829790` with canonical reading `なまにく` and `readingVariants: ['せいにく']`. Total 7 occurrences preserved.
  9. `麺` / `麵` (`ent_seq: 1533610`): Combined `ext-1692` (shinjitai `麺::めん`, 7 occ) and `ext-1691` (kyujitai `麵::めん`, 1 occ) into `kb-1533610` with `kanjiVariants: ['麵']`. Total 8 occurrences preserved (restoring previously dropped locations `bonus-soal-4-q040::A`, `B`, `C`).
- **Disambiguation Rationale Documented for 6 Ambiguous Entries**:
  1. `応::おう`: Selected standard modern verb `応じる` (`ent_seq: 2603430`) over archaic `2711110`.
  2. `元::もと`: Selected 5S Seiton original place `元の場所` (`ent_seq: 1260670`) over raw material `2219590`.
  3. `腰::こし`: Selected K3 ergonomics / lower back waist (`ent_seq: 1288340`) over noodle firmness `2844070`.
  4. `食::しょく`: Selected food/eating/nutrition (`ent_seq: 1956480`) over eclipse `2837078`.
  5. `丁::ちょう`: Selected tool/knife counter for `包丁` (`ent_seq: 1165000`) over town block `1427240`.
  6. `流::りゅう`: Demoted to `unresolved` morpheme fragment (`arti: ''`) due to exam ruby typo in `kunci1-q032`; occurrence mapped to `流::なが`.
- **License & Provenance Compliance**:
  - Zero ingestion of Philia Space JIDict CC BY-NC 4.0 data.
  - JMdict NG EDRDG attribution and CC BY-SA 4.0 coverage verified.
  - All Indonesian definitions verified as in-house curated SSW PM content.
  - Pathway B decoupling maintained (application code proprietary; dictionary dataset CC BY-SA 4.0).

### [2026-11-12] Version 1.0.0 — Task T006 Indonesian Curation & Contextual Disambiguation
- **Action**: CURATED_AND_DISAMBIGUATED
- **Dataset Target**: `data/sharedKotobaDictionary.json` (4,555,527 bytes, SHA-256: `0cb3d2ed50ba22dbb3400392d93c10a3655cf731f4a8c64c5322cca6633fb1d8`)
- **Corpus Coverage**: 100% of 1,006 unique questions and 3,110 unique options across all 27 packages
- **Summary Metrics**:
  - **Total Lexical Terms**: 1,809 entries
  - **Verified Terms**: 1,768 entries (97.7%)
  - **Unresolved Terms**: 41 entries (2.3% — non-standalone morphemes, corrupted `<ruby>` fragments)
  - **Technical SSW PM Terms**: 1,326 entries (75.0%)
  - **General Workplace Terms**: 442 entries (25.0%)
- **Distribution by Match Status**:
  - `matched`: 1,123 entries (1,123 verified, 0 unresolved)
  - `contextual_review`: 200 entries (194 verified, 6 unresolved fragments)
  - `unmatched`: 480 entries (445 verified, 35 unresolved fragments)
  - `ambiguous`: 6 entries (6 verified, 0 unresolved)
- **Domain Category Breakdown (Verified Terms)**:
  - `HACCP`: 179 entries
  - `Hygiene`: 367 entries
  - `Quality`: 360 entries
  - `Safety`: 216 entries
  - `5S`: 110 entries
  - `Machinery`: 94 entries
  - `General`: 442 entries
- **Entry Type Breakdown**:
  - `standalone_term`: 1,546 entries
  - `inflected_verb`: 198 entries (normalized with base dictionary forms)
  - `inflected_adjective`: 23 entries (normalized with base dictionary forms)
  - `compound_part`: 1 entry (`丁` in `包丁`)
  - `morpheme_fragment`: 41 entries (status strictly set to `unresolved`, excluded from UI display)
- **Resolved Ambiguous Entries**:
  1. `応::おう`: Resolved to `ent_seq: 2603430` (verb form `応じる`: to adapt to/comply with condition of frozen fish in cutting operations), rejecting interjection `2711110`. Domain: `Machinery`.
  2. `元::もと`: Resolved to `ent_seq: 1260670` (original location / base in returning tools to original places, 5S Seiton), rejecting currency unit `2219590`. Domain: `5S`.
  3. `腰::こし`: Resolved to `ent_seq: 1288340` (lower back / waist ergonomics in manual heavy lifting safety), rejecting noodle texture `2844070`. Domain: `Safety`.
  4. `食::しょく`: Resolved to `ent_seq: 1956480` (food/diet/eating in food allergen and shokupan contexts), rejecting eclipse `2837078`. Domain: `Quality`.
  5. `丁::ちょう`: Resolved to `ent_seq: 1165000` (counter for tools / bound kanji in `包丁` knife), rejecting ordinal rank `1427240`. Domain: `Machinery`.
  6. `流::りゅう`: Resolved to `ent_seq: 1552090` (stream/current in rinsing steps `洗い流す` with on'yomi ruby), rejecting flag counter `2844102`. Domain: `Hygiene`.
- **Unresolved Morpheme Fragments List (41 entries marked status: 'unresolved', arti: '')**:
  - Broken Katakana / Incomplete Ruby: `ーム::む`, `アルコール::る`, `アレルギー::し`, `コカ・コーラ::こから`, `トセッ::せっと`, `パン::く`, `ムダ::は`, `レトルト::し`.
  - Phrase Fragment Tails: `つ選::えら`, `一つ選::ひとつえら`, `3秒待::３びょうま`, `全部書::ぜんぶか`, `原則守::げんそくまも`, `直接触::ちょくせつふ`, `秒間洗::びょうかんあら`, `長時間座::ちょうじかんすわ`, `非汚染作::ひおせんさく`, `非汚染区入::ひおせんくはい`, `後手洗::あとてあら`, `後石鹸::あとせっけん`, `時自分::ときじぶん`, `湯入::ゆい`, `特多::とくおお`, `清作::せいさく`, `清潔作::せいけつさく`.
  - Typographical Ruby Annotations: `度::ちゅうしんおんど` (ruby typo on `度` instead of `中心温度`), `製品::しょくひん` (typo reading `しょくひん` on `製品`), `調理::ちょうせい` (typo reading on `調理`), `集中力::しゅうなかちから` (typo reading on `集中力`), `発生::は` (ruby on single character), `傷口::き` (ruby on single character), `衛生的取::えいせいてきと` (cut-off stem), `一度行::いちどおこな` (cut-off stem), `一番多::いちばんおお` (cut-off stem), `汚染作::おせんさく` (cut-off stem), `衛生物::えいせいぶつ` (corrupt compound), `差漁場::さぎょじょう` (corrupt compound), `服作業管理::ふくさぎょうかんり` (corrupt phrase), `特定原材料料::とくていげんざいりょうりょう` (repeated character typo), `安全的危害要因::あんぜんてききがいよういんー` (trailing dash typo), `災害的危害要因::さいがいてききがいよういんー` (trailing dash typo).
- **Zero-Leakage Assertion**:
  All 41 unresolved entries have `status: 'unresolved'`, `meaningStatus: 'unresolved'`, and `arti: ''`. The client resolver `resolveKotobaEntries(kotobaIds)` programmatically filters `entry.status === 'verified'`, ensuring examinees never encounter incomplete fragments or unverified glosses.

### [2026-11-12] Version 1.0.0-draft — Phase 1 Infrastructure Initialization
- **Action**: INITIALIZED
- **Upstream Snapshot**: JMdict New Generation (`JMdict_e_NG.gz`, DTD Rev 1.10, XML `created="2026-11-12"`, SHA-256 `60cf4c4c09a8a3ec55e45fcef5e462cda242f6f228c087a6e0169ca10eaf7a84`, git commit N/A).
- **Audit Findings**:
  - Raw question records scanned across 7 bundles: 1,086.
  - Cross-file duplicates identified: 80 (`questions.json` mirroring `kunci-ujian-1` and `kunci-ujian-2`).
  - Canonical source designated: Package-specific files (`kunci-ujian-1`, `kunci-ujian-2`).
  - Net unique questions verified: 1,006.
  - Net unique options verified: 3,110 (100% possess unique IDs).
  - Unique `<ruby><rt>` pairs in corpus: 1,818 pairs.
- **Policy Established**:
  - Pathway B with Decoupled Provenance Architecture.
  - Zero ingestion of Philia Space JIDict (CC BY-NC 4.0).
  - In-house Indonesian definition curation under CC BY-SA 4.0.
  - Mandatory `status === 'verified'` gating for UI display.
- **Status**: Setup Complete (Ready for Phase 2 Extraction).
