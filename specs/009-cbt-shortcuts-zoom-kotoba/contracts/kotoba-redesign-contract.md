# Data & Rollout Contract: Kotoba Redesign & Package-by-Package Migration

**Feature**: `009-cbt-shortcuts-zoom-kotoba`  
**Date**: 2026-11-13 (Updated with Final Technical Review)

---

## 1. Curation & Lexicographical Rules

Every migrated package MUST satisfy all 12 spec rules (`FR-031`–`FR-041`) and the rigorous full-text span coverage model:

### A. Full-Text Span Coverage Model & Unresolved Review Items
1. **Exhaustive Character Accounting**:
   - The validator inspects the **entire Japanese text** of each question prompt and each option from index `0` to `string.length`.
   - The text is decomposed into character spans $[start, end)$.
   - Every single character in the sentence must be strictly accounted for by one of three disjoint sets:
     $$\text{Sentence Text} = \bigcup \text{Term Spans} \cup \bigcup \text{Structural Punctuation} \cup \bigcup \text{Numeric/Unit Entities}$$
2. **Rejection of Partial Token Matching**:
   - A sentence is **never** considered covered merely because some dictionary words or partial substrings match. If a sentence has 30 characters and verified entries account for only 12 characters, the remaining 18 characters cannot be ignored.
3. **Mandatory Unresolved Review Items**:
   - Any Japanese character span $[start, end)$ that is not mapped to a verified dictionary entry and not classified as an allowed structural syntax entity (punctuation/whitespace/number/unit) is flagged as an `UNRESOLVED_SPAN`.
   - The automated coverage gate requires:
     $$\sum \text{UNRESOLVED\_SPAN} = 0$$
     for the package to be approved for production merge.

### B. Japanese Segmentation Strategy
1. **Meaningful Compound Preservation**:
   - Multi-kanji words and domain terminology appear as intact whole units (`作業`, `重要管理点`, `交差汚染`, `食品衛生責任者`, `危害要因分析`).
   - Meaningful constituent sub-words (`重要`, `管理`, `点`) may also be co-indexed right before/with the compound for vocabulary building, but the compound itself MUST be preserved as an intact primary entry.
2. **Zero Isolated Kanji Fragments**:
   - Single kanji characters (`作`, `正`, `選`, `売`) MUST NOT appear as standalone entries unless they function as an actual standalone word in that sentence.
3. **Grammatical Particles as First-Class Units**:
   - All case, binding, conjunctive, and sentence-ending particles (`は`, `が`, `を`, `に`, `で`, `と`, `の`, `へ`, `から`, `まで`, `より`, `も`, `ね`, `よ`, etc.) and compound particles/expressions (`について`, `によって`, `上で`, `とともに`) must be classified and indexed as first-class entries with concise grammatical role descriptions in Indonesian (e.g. `を` → "partikel penanda objek langsung").
4. **Inflected Forms (Conjugations)**:
   - Verbs and adjectives appearing in inflected/conjugated surface forms (`選びなさい`, `間違っている`, `沿った`, `冷暗所に`) are indexed by their surface form with explicit base form indication in `dictForm` and/or concise Indonesian meaning (e.g. `選びなさい` → `pilihlah (bentuk dasar 選ぶ)`).
5. **Numbers, Symbols, & Punctuation**:
   - Standard Japanese and ASCII punctuation (`。`, `、`, `・`, `「`, `」`, `（`, `）`, `【`, `】`, `…`) and whitespace are categorized as `structural_punctuation` (accounted for by validator span accounting, excluded from vocabulary dictionary).
   - Standalone Arabic numerals and measurement units (`1`, `2`, `10℃`, `−18℃`, `15分`, `100g`) are classified as `numeric_unit` (accounted for in coverage, excluded from vocabulary dictionary).
   - Counted Sino-Japanese or native number words functioning as lexical units (`一つ`, `二人`, `第一`) ARE indexed as vocabulary units.
6. **Concise Indonesian Meaning**:
   - 1–3 short equivalents or one short phrase (target `<= 40` chars, hard cap `<= 60` chars except technical expansions). Zero multi-sentence commentary or full-sentence translations.
7. **Whole-Word Furigana**:
   - Reading in Hiragana covers the entire word (`重要管理点` -> `じゅうようかんりてん`). Never guess unverified readings (cross-check exam `<ruby>` + JMdict EDRDG for non-ruby packs like `ssw-pm-tipe2-nguyen1.json`).
8. **Sentence Order & Deduplication**:
   - Entries in `questions[qId]` / `byCompositeKey[qId::optId]` appear in sentence occurrence order, deduplicated per sentence.
9. **License & Attribution Retention**:
   - Must strictly maintain Feature 008 EDRDG / JMdict attribution and CC-BY-SA-4.0 licensing in metadata and the exam settings popover UI:
     `_meta.license = "CC-BY-SA-4.0"`, `_meta.attribution = "EDRDG / JMdict + In-House SSW PM Indonesian Curations"`.

---

## 2. Runtime Resolver & Service Worker Data Consistency

### A. Runtime Resolver Contract (`app.js`)
`resolveKotobaEntries(target, optOrKey, dictOverride, mappingOverride)` and `renderKotobaList(kotobaEntries)`:
- Preserve existing signature and behavior:
  - Only entries with `entry.status === 'verified'` are returned and rendered.
  - Entries render in the exact array order stored in `kotobaMapping.json`.
  - Each item renders `<ruby class="kotoba-ruby">${kanji}<rt>${furigana}</rt></ruby> — ${arti}` so toolbar `F` / shortcut `E` (`body.hide-furigana`) hides/shows `<rt>` with zero DOM churn.
- **Referential Integrity & Diagnostic Requirements**:
  - **Validation & Pipeline Hard-Fail**: If ANY term ID referenced in `kotobaMapping.json` is missing in `sharedKotobaDictionary.json`, or if there is a `schemaVersion` or `dataVersion` mismatch between mapping and dictionary, the validation tools MUST output a clear diagnostic error identifying the missing ID or mismatch and MUST FAIL package validation. Missing or mismatched data MUST NEVER be skipped or passed silently during validation.
  - **Production Data Preservation**: The package's active data in production MUST remain the previous known-good (Feature 008) data until both the dictionary and mapping for that package are 100% validated and deployed atomically.
  - **Runtime Resolver Diagnostic**: At runtime, if an unexpected missing term ID or version mismatch occurs (e.g. from local storage corruption), `resolveKotobaEntries()` MUST log an explicit console error diagnostic (`console.error('[Kotoba] Missing term ID or version mismatch:', id, version)`) rather than hiding it silently, while safely preventing an unhandled crash of the surrounding CBT question view.
- Backward compatibility: Un-migrated packages continue resolving their Feature 008 term IDs from `sharedKotobaDictionary.json` until their package gate passes.

### B. Service Worker Consistency & Cache Lifecycle
1. **Synchronous Data Versioning**:
   - `data/sharedKotobaDictionary.json` and `data/kotobaMapping.json` must share a synchronized `_meta.dataVersion` (e.g. `"20261113-v2"`) and `_meta.schemaVersion: "2.0.0"`.
   - Both files are deployed together in atomic release commits.
2. **Atomic SW Precaching & Transition Safety**:
   - Service Worker precaching is atomic per `CACHE_NAME` (e.g. `ssw-pm-mock-test-shell-v31`).
   - During the SW `install` phase, new versions of dictionary and mapping are fetched into the *new* cache bucket.
   - The *old* cache bucket continues serving existing requests for any active exam page until the new SW activates.
   - Ongoing exams (`state.page === 'exam'`) are never forcefully reloaded or interrupted.
3. **Offline Capability**:
   - The app remains 100% functional offline. Both dictionary and mapping remain in the `CORE` precache list in `sw.js`.

---

## 3. Package-by-Package Migration & Validation Gate

Migration proceeds one canonical package at a time in-branch (with no partial production deployments) across all 6 source bundles (covering all 1,006 net unique questions and 3,110 net unique options):
1. `ssw-pm-kunci-ujian-1.json` (40 questions, 120 options)
2. `ssw-pm-kunci-ujian-2.json` (40 questions, 120 options)
3. `ssw-pm-special-lab-bundle.json` (92 questions, 368 options — 4 options each)
4. `ssw-pm-tipe2-nguyen1.json` (40 questions, 120 options — zero source ruby; requires JMdict reading verification)
5. `ssw-pm-bonus-soal-1-to-10-bundle.json` (354 questions, 1,062 options)
6. `ssw-pm-all-kunci-ujian-3-to-13.json` (440 questions, 1,320 options)
*(Note: `questions.json` mirrors `kunci-ujian-1` & `kunci-ujian-2` and shares their reconciled IDs.)*

### A. Traceability via External Audit Ledgers (Zero Runtime Bloat)
- **Runtime JSONs** (`data/sharedKotobaDictionary.json` & `data/kotobaMapping.json`): Precached by `sw.js`. Redundant per-term `occurrences` text arrays are stripped from the runtime dictionary to keep payload `< 2.5 MB` for mobile precache reliability.
- **Audit Ledgers** (`specs/009-cbt-shortcuts-zoom-kotoba/audit/`):
  - `full-coverage-ledger.json`: 100% character-by-character span coverage for all sentences, character offsets `[start, end]`, mapped term IDs, and structural exclusion classifications.
  - `reconciliation-ledger.json`: Diff of terms and mappings per package against Feature 008 baseline.
  - `unresolved-spans-report.json`: Detailed review items for unclassified spans.
  - Ledgers live in repository source control but are **strictly excluded** from `sw.js` precache.

### B. Mandatory Per-Package Gate Before Replacing Feature 008 Data
A package $P$ MAY replace its Feature 008 mapping/entries ONLY when ALL checks pass:
1. **Automated Full-Text Span Coverage**: 100% of prompts and 100% of options in package $P$ have **0 uncovered meaningful spans** (`UNRESOLVED_SPAN === 0`).
2. **Fragment & Length Check**: 0 single-kanji fragments from longer words in the same sentence; `>= 95%` meanings `<= 40` chars, `0` meanings `> 60` chars (excluding approved technical expansions).
3. **Whole-Word Furigana & License Check**: 100% kanji-bearing units have verified whole-word Hiragana readings; provenance records `lemmaSource`, `furiganaSource`, `meaningSource`, `lexicalLicense: 'CC-BY-SA-4.0'`.
4. **Manual Sample Review**: Stratified sample across all six canonical packages (minimum 50 sentences total across all packages, with minimum 5 sentences per package; not 50 sentences per package) reviewed with `>= 98%` accuracy.
5. **Offline & SW Precache Size Check**: `sharedKotobaDictionary.json` + `kotobaMapping.json` remain compact, versioned consistently, `sw.js` `CACHE_NAME` is bumped, and offline fetch resolves cleanly.
