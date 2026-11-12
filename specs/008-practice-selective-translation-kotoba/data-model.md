# Phase 1 Data Model: Practice Mode Selective Translation & Kotoba Reveal (Decoupled Provenance Architecture)

**Feature**: `specs/008-practice-selective-translation-kotoba`  
**Date**: 2026-11-12 (Updated: Full Bank Reconciliation & Composite Option Identity)  
**Status**: Decided & Modeled  
**Target Branch**: `feat/practice-selective-translation-kotoba`

---

## 1. Overview & Decoupled Architecture

Feature 008 employs a **Shared Deduplicated Vocabulary Architecture** operating under **Pathway B (Decoupled Provenance)**:
- **Application Engine**: Proprietary CBT application logic, scoring, and subscription access control.
- **Lexicographical Dataset (`sharedKotobaDictionary.json`)**: Open dataset asset distributed under **CC BY-SA 4.0**, containing JMdict-derived lemmas/readings paired with original, in-house curated Indonesian definitions.
- **Full Bank Scope**: Reconciled coverage across all 1,006 unique questions and 3,110 unique options across all 27 packages.

---

## 2. Entities & Schemas

### 2.1 KotobaEntry (Field-by-Field Provenance)

Each vocabulary record specifies granular field-level provenance to ensure complete transparency and legal compliance:

```typescript
interface KotobaEntry {
  /**
   * Unique stable identifier for the vocabulary term.
   * Format: "kb-" followed by romanized lemma or numeric hash.
   * Examples: "kb-seiton", "kb-shokuhin", "kb-kousa-osen"
   */
  id: string;

  /**
   * Japanese lemma / base word form.
   * Provenance: Extracted from exam corpus ruby base, verified against JMdict (EDRDG, CC BY-SA 4.0).
   * Example: "整頓", "原材料", "交差汚染"
   */
  kanji: string;

  /**
   * Verified reading in Hiragana or Katakana.
   * Provenance: Sourced from exam corpus `<rt>` tags, verified against JMdict reading entries.
   * Example: "せいとん", "げんざいりょう", "こうさおせん"
   */
  furigana: string;

  /**
   * Verified Indonesian definition, contextually disambiguated for food manufacturing.
   * Provenance: In-house curated by SSW PM Mock Test team based on official exam textbooks.
   * Distributed under CC BY-SA 4.0 to fulfill ShareAlike obligations on the adapted dataset.
   * Example: "Penataan teratur / menaruh barang pada tempat yang ditentukan"
   */
  arti: string;

  /**
   * Verification status.
   * Only 'verified' entries are rendered in the end-user UI.
   * 'unresolved' entries are tracked transparently in the audit ledger and excluded from display.
   */
  status: 'verified' | 'unresolved';

  /**
   * Explicit Field Provenance Metadata.
   */
  provenance: {
    lemmaSource: 'jmdict_edrdg' | 'exam_corpus_ruby';
    furiganaSource: 'exam_corpus_rt' | 'jmdict_edrdg';
    meaningSource: 'in_house_ssw_curated';
    lexicalLicense: 'CC-BY-SA-4.0';
  };

  /**
   * Domain context category (e.g. "5S", "HACCP", "Hygiene", "Machinery").
   */
  domainCategory?: string;
}
```

### 2.2 SharedKotobaRegistry (Centralized Store Metadata)

```typescript
interface SharedKotobaRegistry {
  /**
   * Dataset metadata, version tracking, and legal attributions.
   */
  _meta: {
    datasetVersion: string;           // Semantic version, e.g. "1.0.0"
    jmdictArtifact: "JMdict_e_NG.gz"; // Canonical upstream archive
    jmdictCreationDate: string;       // Sourced from XML created attribute, e.g. "2026-11-12"
    jmdictDtdVersion: "1.10";         // Upstream DTD Rev 1.10 (XML Next Generation)
    jmdictFetchDate: string;          // ISO date of archive retrieval, e.g. "2026-11-12"
    jmdictSha256: string;             // SHA-256 integrity hash of upstream archive
    jmdictGitCommit: "N/A";           // Public git commit not provided by upstream FTP distribution
    totalTerms: number;
    verifiedTerms: number;
    unresolvedTerms: number;
    datasetLicense: "CC BY-SA 4.0";
    datasetLicenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/";
    upstreamAttribution: {
      source: "JMdict by Electronic Dictionary Research and Development Group (EDRDG)";
      sourceUrl: "https://www.edrdg.org/edrdg/licence.html";
    };
    commercialDecouplingNotice: "This dictionary dataset is released under CC BY-SA 4.0. The surrounding application software, user interface, CBT engine, and commercial subscription services are proprietary and licensed separately.";
  };

  /**
   * Key-value registry mapping termId to KotobaEntry.
   */
  terms: {
    [termId: string]: KotobaEntry;
  };
}
```

### 2.3 Question Extension (Prompt Level)

Applicable across all 1,006 unique questions:

```typescript
interface Question {
  id: string;                         // Stable unique question ID (e.g. "kunci1-q001")
  prompt: string;                     // Raw Japanese prompt containing ruby tags
  promptTranslation?: string;         // Indonesian sentence translation (100% available)
  
  /**
   * Array of term IDs referencing SharedKotobaRegistry.
   * Example: ["kb-seiton", "kb-5s-katsudou"]
   */
  kotobaIds?: string[];

  options: Option[];
}
```

### 2.4 Option Extension (Option Level)

Applicable across all 3,110 unique options:

```typescript
interface Option {
  id: string;                         // Original stable ID in JSON (e.g. "kunci1-q001-opt1"), or letter after shuffle
  originalId?: string;                // Preserved stable identifier after buildExamQuestions shuffle
  text: string;                       // Japanese option text
  translation?: string;               // Indonesian sentence translation (100% available)
  
  /**
   * Array of term IDs referencing SharedKotobaRegistry.
   * Example: ["kb-koujou", "kb-gomi", "kb-suteru"]
   */
  kotobaIds?: string[];

  mediaId?: string;
  optionImage?: string;
}
```

---

## 3. Vocabulary Resolution Helper

```javascript
/**
 * Resolves term IDs against the shared vocabulary registry.
 * Filters out unverified or missing entries.
 */
function resolveKotobaEntries(kotobaIds, registry = window.sharedKotobaDictionary) {
  if (!Array.isArray(kotobaIds) || !registry?.terms) return [];
  return kotobaIds
    .map(id => registry.terms[id])
    .filter(entry => entry && entry.status === 'verified');
}
```

---

## 4. In-Memory Session State Model & Composite Keying

All selective states are stored strictly in memory on `activeSession.selectiveState` during untimed Practice Mode, reset upon session start/completion, and isolated from timed exams.

```typescript
interface SelectiveSessionState {
  [questionId: string]: {
    promptTrans: boolean | null;      // null: inherit from globe; true/false: explicit override
    promptKotoba: boolean;            // true: visible; false: hidden (default)
    options: {
      [compositeOptKey: string]: {
        trans: boolean | null;
        kotoba: boolean;
      };
    };
  };
}
```

### Composite Stable Option Key Resolution (Shuffling Immunity)

To guarantee 100% immunity against option shuffling in `buildExamQuestions(setup)`—where `opt.id` is overwritten with visual letters `'A'`, `'B'`, `'C'` but `opt.originalId` preserves the stable identifier:

```javascript
/**
 * Resolves a deterministic, shuffle-invariant composite key for an option.
 * Strictly avoids relying on visual letter positions A/B/C/D.
 * 
 * @param {string} qId - Question ID (e.g. "kunci1-q001")
 * @param {object} opt - Option object
 * @returns {string} Composite key (e.g. "kunci1-q001::kunci1-q001-opt1")
 */
function getOptionKey(qId, opt) {
  const stableOptId = String(opt.originalId || opt.id || '').trim();
  return `${qId}::${stableOptId}`;
}
```

---

## 5. Furigana Integration State (Zero New State)

Reuses the existing CBT exam preference and CSS gating mechanism:

```typescript
// Existing state: state.examPrefs.showFurigana (boolean)
```

| Toolbar F State (`state.examPrefs.showFurigana`) | DOM Body Class | Kotoba `<rt>` Display | Rendered Output |
| :--- | :--- | :--- | :--- |
| **OFF** (`false`) | `body.hide-furigana` | `display: none !important` | `整頓 — penataan` (clean base text) |
| **ON** (`true`) | *(none)* | `display: ruby-text` | `整頓` with `せいとん` reading above it |

---

## 6. Raw Record Reconciliation & Coverage Taxonomy

### 6.1 Raw Records vs Unique Question Bank

Audit across the 7 source bundle JSON files confirms:
- **`questions.json`**: 80 raw records
- **`ssw-pm-all-kunci-ujian-3-to-13.json`**: 440 raw records
- **`ssw-pm-bonus-soal-1-to-10-bundle.json`**: 354 raw records
- **`ssw-pm-kunci-ujian-1.json`**: 40 raw records
- **`ssw-pm-kunci-ujian-2.json`**: 40 raw records
- **`ssw-pm-special-lab-bundle.json`**: 92 raw records
- **`ssw-pm-tipe2-nguyen1.json`**: 40 raw records
- **Total Raw Records**: **1,086**
- **Cross-File Duplicates**: Exactly **80 questions** (the 40 questions of Ujian 1 and 40 questions of Ujian 2 in `questions.json` mirror `ssw-pm-kunci-ujian-1.json` and `ssw-pm-kunci-ujian-2.json`). Canonical source is package-specific files.
- **Net Unique Questions**: **1,006**
- **Net Unique Options**: **3,110** (all verified to possess unique IDs within their respective questions).

### 6.2 4-Tier Coverage Taxonomy

To ensure transparent reporting and honest release criteria:
1. **Extraction Coverage**: 100% of Japanese text across all 1,006 unique questions and 3,110 options scanned.
2. **Vocabulary Coverage**: Proportion of technical food manufacturing terms mapped to dictionary entries.
3. **Verified Coverage**: Proportion of terms whose kanji/reading is cross-verified against JMdict and exam ruby annotations, and whose Indonesian definition is verified in-house.
4. **Unresolved Tracking**: Entries lacking high-confidence verification marked `status: 'unresolved'`, tracked in the audit ledger, and excluded from UI rendering. No speculative or machine translation guessing may be treated as verified.
