# Data Model: Add Questions to Study List from Bank Soal

**Feature**: 005-bank-to-study-list
**Date**: 2026-11-10
**Status**: Draft

---

## 1. Primary Entities

### 1.1 `StudyListItem` (IndexedDB Entity)

The canonical record stored inside the `studyList` object store of IndexedDB (`ssw-pm-mock-test-db`, version 2).

| Field Name | Type | Mandatory | Description / Validation |
|------------|------|-----------|--------------------------|
| `id` | String | Yes | Composite primary key formatted as `${setId}::${questionId}` (e.g., `ssw-pm-kunci-ujian-1::q1`). Guarantees uniqueness. |
| `compositeId` | String | Yes | Mirror of `id` for backwards-compatible lookups. |
| `packageId` | String | Yes | Source question package ID (e.g. `ssw-pm-kunci-ujian-1`). Defaults to `ssw-pm-kunci-ujian-1` if absent. |
| `setId` | String | Yes | Mirror of `packageId`. |
| `setName` | String | Yes | Human-readable package display title (e.g. `Kunci Soal Ujian 1`). |
| `questionId` | String | Yes | Source question identifier within the package (e.g. `q1`). |
| `questionNumber`| Number | Yes | Display sequence number (defaults to 1 if not defined). |
| `prompt` | String | Yes | Japanese question text containing Kanji and ruby annotations where supported. |
| `questionText` | String | Yes | Plain-text Japanese question prompt without HTML ruby tags for clean indexing. |
| `instructions` | String | No | Additional question directions or context header (if any). |
| `options` | Array | Yes | Array of 3–4 choices: `[{ id: 'A', text: '...', translation: '...' }, ...]`. |
| `correctIndex` | Number | Yes | Zero-based index of the correct answer (0, 1, 2, or 3). |
| `correctAnswer`| String | Yes | Key letter of the correct answer (`A`, `B`, `C`, or `D`). |
| `explanation` | String | No | Indonesian explanation notes and rationale. |
| `promptTranslation` | String | No | Indonesian translation of the prompt. |
| `imageMediaId` | String | No | Asset media ID if the question includes an illustration. |
| `questionImage`| String | No | Direct image URL or base64 data URI if present. |
| `imageSize` | String | No | Image sizing preference (`small`, `medium`, `large`). |
| `imageRatio` | String | No | Image aspect ratio preference (`auto`, `16:9`, `4:3`, `1:1`). |
| `imagePosition`| String | No | Image alignment (`center`, `left`, `right`). |
| `media` | Object | No | Option media attachments. |
| `addedAt` | String | Yes | ISO 8601 UTC timestamp of creation (e.g. `2026-11-10T02:40:00.000Z`). |

---

### 1.2 `QuestionCardStudyState` (Transitory UI State)

In-memory visual state rendered on each Bank Soal question card within `.zen-q-actions`.

| Property | Type | Possible Values | Description |
|----------|------|-----------------|-------------|
| `inStudy` | Boolean | `true` \| `false` | Computed via `isQuestionInStudy(q)`. Evaluates whether `${setId}::${q.id}` exists in `state.studyList`. |
| `glyph` | String | `'+'` \| `'✓'` | Single character displayed inside the button. |
| `cssClass` | String | `'hd-row-btn zen-study-btn'` (inactive) \| `'hd-row-btn zen-study-btn is-active'` (active) | CSS styling hook for normal vs bookmarked state. |
| `ariaPressed`| String | `'true'` \| `'false'` | Accessible toggle state for screen readers. |
| `title` / `ariaLabel` | String | `t('studyAddTooltip')` \| `'Sudah ada di Study List'` | Tooltip and accessibility text (`Tambahkan ke Study List` vs `Sudah ada di Study List`). |
| `isPending` | Boolean | `true` \| `false` | Concurrency lock during active async IndexedDB write (`data-pending="1"`). |

---

## 2. State Machine & Transitions

```mermaid
stateDiagram-v2
    [*] --> Unbookmarked: Initial render (isQuestionInStudy == false)
    [*] --> Bookmarked: Initial render (isQuestionInStudy == true)

    state Unbookmarked {
        Glyph: "+"
        Class: hd-row-btn zen-study-btn
        AriaPressed: false
        Title: studyAddTooltip
    }

    state Bookmarked {
        Glyph: "✓"
        Class: hd-row-btn zen-study-btn is-active
        AriaPressed: true
        Title: Sudah ada di Study List
    }

    state Mutating {
        DataPending: "1"
        Lock: Re-entrant clicks ignored
        DB: IndexedDB put executing
    }

    Unbookmarked --> Mutating: User clicks "+" button
    Mutating --> Bookmarked: IndexedDB put resolves + toast success
    Mutating --> Unbookmarked: IndexedDB put fails (rollback)

    Bookmarked --> Bookmarked: User clicks "✓" button (Idempotent No-Op, does NOT delete)
    Bookmarked --> Unbookmarked: Deleted from Study List tab
```

---

## 3. Data Integrity & Uniqueness Guarantees

1. **Composite Key Formula**: `${setId}::${questionId}`
   - Example 1: Standard exam package: `ssw-pm-kunci-ujian-1::q5`
   - Example 2: Laboratory synthetic bundle: `ssw-pm-special-lab-bundle::q-lab-01`
   - Example 3: Legacy package: `ssw-pm-tipe2-nguyen1::tipe2-01`
2. **Duplicate Prevention & Idempotency**:
   - `isQuestionInStudy(q)` checks whether `${setId}::${q.id}` already exists.
   - If already present, clicking the card button in Bank Soal is an idempotent no-op (never deletes, never duplicates).
   - If not present, `addStudyItem(q)` or idempotent add saves the record via IndexedDB `put` and updates `state.studyList`.
   - Multiple rapid clicks on the same button are blocked by `data-pending="1"`, guaranteeing atomic single-execution per user gesture.
3. **Synchronization Across Modules**:
   - When an item is bookmarked from Bank Soal, `updateStudyBadge()` is called immediately to synchronize the count displayed in the navigation sidebar.
   - When the candidate navigates to the Study List tab, `renderStudy()` reads the identical `state.studyList` array.
