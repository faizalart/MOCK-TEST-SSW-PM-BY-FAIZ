# Feature 008 Requirements Verification Checklist (Pathway B Provenance Architecture)

**Feature**: `specs/008-practice-selective-translation-kotoba`  
**Date**: 2026-11-12 (Updated for Pathway B License Decision & Full Bank Scope)  
**Target Branch**: `feat/practice-selective-translation-kotoba`

---

## 1. Full Bank Scope & Licensing Compliance (Pathway B Mandate)
- [x] **Full Bank Scope & Bank Reconciliation**: Entire question bank reconciled (1,086 raw records across 7 files, exactly 80 cross-file duplicates between `questions.json` and `kunci-1`/`kunci-2`, yielding 1,006 net unique questions and 3,110 unique options across all 27 packages).
- [x] **4-Tier Coverage Taxonomy Defined**: Extraction coverage (100%), Vocabulary coverage, Verified coverage, and transparent Unresolved tracking with zero guessing.
- [x] **No Pilot Package Restrictions**: Feature active for all packages uniformly in untimed Practice Mode.
- [x] **License Discrepancy Audited**: Verified that JIDict by Philia Space is CC BY-NC 4.0, while upstream JMdict/EDRDG is CC BY-SA 4.0. EDRDG multi-language policy notes translations have separate copyright.
- [x] **Commercial Protection**: JIDict CC BY-NC 4.0 data is strictly excluded from commercial distribution.
- [x] **No False IP Claims**: The project transparently acknowledges all CC BY-SA 4.0 obligations and never claims to be "100% copyright-clear" without qualification.
- [x] **BLOCKER GATE RESOLVED**: Pathway B (Decoupled Provenance Architecture) formally adopted.
- [x] **Zero Early Downloads**: Zero dictionary database files downloaded or committed to the repository before implementation phase.
- [x] **Field-by-Field Provenance**: `KotobaEntry.provenance` records explicit source tags for lemma, furigana, meaning, and license.
- [x] **Upstream Snapshot Tracking**: `sharedKotobaDictionary._meta` tracks JMdict snapshot date, commit, license, and attribution URLs.
- [x] **Software Decoupling (Mere Aggregation)**: Standalone dictionary asset is CC BY-SA 4.0; CBT engine (`app.js`, styles, subscription platform) remains proprietary.
- [x] **UI Attribution Delivery**: EDRDG attribution and CC BY-SA 4.0 links placed in Exam Settings Modal (`⚙`) and About/Legal views.
- [x] **Ruby Cross-Check Pipeline**: Empirical `<ruby><rt>` markup in the 1,006 questions and 3,110 options cross-referenced with JMdict base forms.
- [x] **Contextual Disambiguation**: Food manufacturing terms disambiguated contextually (e.g. `仕込み`, `揚げる`, `盛付け`).
- [x] **Zero Hallucination**: Unverified entries marked as `status: 'unresolved'` and audited transparently; machine translations excluded from verified status.
- [x] **100% Offline**: Entire dataset functions offline without runtime translation APIs.

---

## 2. 3-Column Sibling Architecture & Click Independence
- [ ] Prompt row renders as `[Left Button] [Center Prompt] [Right Button]`.
- [ ] Each option row renders as `[Left Button] [Center Radio Choice] [Right Button]`.
- [ ] Left and right buttons are direct DOM siblings outside `.answer-choice`.
- [ ] Clicking the left translation button does NOT trigger answer selection (`setAnswer`).
- [ ] Clicking the right Kotoba button does NOT trigger answer selection (`setAnswer`).
- [ ] Clicking the center `.answer-choice` selects the radio answer as expected.
- [ ] Keyboard Arrow keys navigate smoothly between radio options without being trapped by helper buttons.

---

## 3. Kotoba Furigana Control via Toolbar F Button (Mandatory)
- [ ] Default display: When a Kotoba list is opened while toolbar F is OFF, terms display base Kanji without furigana (e.g. `整頓 — penataan`).
- [ ] No reading in parentheses shown by default.
- [ ] Indonesian meaning is always shown.
- [ ] Toggling toolbar F button from OFF to ON immediately displays furigana readings (`<rt>`) above Kanji across all open Kotoba lists.
- [ ] Toggling toolbar F button from ON to OFF immediately hides furigana readings across all open Kotoba lists.
- [ ] Toggling toolbar F button does NOT close open Kotoba lists.
- [ ] Toggling toolbar F button does NOT alter Sentence Translation states.
- [ ] Zero new state: reuses `state.examPrefs.showFurigana` and CSS class `body.hide-furigana`.
- [ ] Native `<ruby><rt>` markup is used for all Kotoba entries.
- [ ] Applies identically to Kotoba on questions and all options across all packages.
- [ ] Preserved across Next, Prev, and Question Map navigation.

---

## 4. Sentence Translation (Left Button)
- [ ] Left button on prompt row toggles prompt Indonesian translation.
- [ ] Left button on option row toggles that option's Indonesian translation.
- [ ] Sourced from `q.promptTranslation` and `o.translation` (100% available across all 1,006 questions and 3,110 options).
- [ ] Clean fallback when translation is missing or empty.

---

## 5. Content Stacking Order & Visual Containment
- [ ] Vertical order in center area is strictly:
  1. Japanese base text.
  2. Indonesian sentence translation (if ON).
  3. Kotoba vocabulary list (if ON).
- [ ] Content stays strictly within the center column, never expanding beneath the left or right buttons.
- [ ] Kotoba list uses minimal, clean formatting: base word/Kanji, separator `—`, and Indonesian meaning.

---

## 6. Mobile Touchscreen & Desktop Ergonomics
- [ ] Both buttons have minimum 44 × 44 px touch target.
- [ ] Normal state has transparent/neutral background without permanent gray boxes.
- [ ] Hover effects wrapped in `@media (hover: hover) and (pointer: fine)` to eliminate sticky hover on Android.
- [ ] Touch feedback provided via `:active`.
- [ ] Active state uses consistent CBT theme green accent (`#a9d16b`).
- [ ] Left and right buttons are separated by the full width of the answer choice (>= 200px gap).

---

## 7. State Management, Invariance & Mode Isolation
- [ ] State stored in `activeSession.selectiveState`.
- [ ] Option states bound to composite stable keys (`compositeOptKey = `${q.id}::${o.originalId || o.id}``) immune to option shuffling in `buildExamQuestions`. Relying on visual letter positions A/B/C/D is strictly prohibited.
- [ ] States persist across Next, Prev, and Question Map navigation.
- [ ] States cleanly reset when a practice session ends or starts.
- [ ] Toolbar Globe button toggles master translation state and resets row-level translation overrides.
- [ ] Kotoba state is 100% independent of the toolbar Globe button.
- [ ] Full Mock Test and Timed Custom Exam render zero selective buttons or content across all packages.
