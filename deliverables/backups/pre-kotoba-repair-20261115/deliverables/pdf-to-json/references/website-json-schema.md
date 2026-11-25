# Website JSON Schema (Reverse-Engineered from `app.js` & `utils.js`)

This document defines the exact JSON structure accepted by the SSW Mock Test website (`normalizeExternalQuestion`, `importAdditiveQuestionSet`, `validateQuestion`, and `rawStats`).

---

## 1. Distinction Between Reference Artifacts

Do **not** confuse the four different structural levels used in this Skill:

1. **Single Question Object** (`examples/example-question.json`) — One standalone question object from `questions[]` (e.g., a calculation question from `latsol-hitungan-01.json`). Not a full package.
2. **Single Package JSON** (`references/gold-standard-nguyen-example.json`, `references/gold-standard-kunci-ujian-16-example.json`) — A consistent package excerpt where every item in `questions[]` shares the exact same `setId`, `setName`, and `sourcePdf` as the top-level package object. These are **structural reference excerpts** from verified production datasets, not new production packages.
3. **Sidecar Kotoba Files** (`references/kotoba-standard.md`) — The three external vocabulary files (`sharedKotobaDictionary.json`, `kotobaMapping.json`, `kotoba-dan-kategori-tambahan.json`) loaded by `ensureKotobaLoaded()`.
4. **Media & Asset Mapping** (`references/image-processing-standard.md`) — How `questionImage`, `imageMediaId`, `options[].mediaId`, and `media[]` link to PNG files under `assets/questions/`.

---

## 2. Top-Level Package Object

Each package JSON file (e.g., `data/latsol-nguyen-01.json`) is a single JSON object:

| Field | Type | Required | Description & Website Usage |
| :--- | :--- | :--- | :--- |
| `setId` | `string` | **Required** | Unique kebab-case package identifier (e.g., `"latsol-nguyen-01"`). Used to group packages in `getAvailablePackages()`. Never mix different `setId`s in one package file. |
| `setName` | `string` | **Required** | Display name shown in Home catalog & Exam topbar (e.g., `"Latsol Nguyen 01"`). Must match every question's `setName`. |
| `title` | `string` | Optional | Fallback package title used by `importAdditiveQuestionSet` if `setName` is omitted. |
| `sourcePdf` | `string` | Recommended | Source PDF filename for provenance (e.g., `"1-1.pdf"`). |
| `totalPages` | `number` | Optional | Total pages in the source PDF. Informational metadata (not required by loader). |
| `totalQuestions` | `number` | Recommended | Must equal `questions.length` for complete packages. Informational metadata. |
| `pointsPerQuestion` | `number` | Recommended | Nominal point weight per question (e.g., `3.75` for 40 questions; `3` for 50 questions). Informational metadata. |
| `maxScore` | `number` | Optional | Must equal the **sum of `q.points`** across all questions in `questions[]`. Never assume `totalQuestions * pointsPerQuestion` if individual questions have differing weights. |
| `questions` | `Array<Question>` | **Required** | Non-empty array of question objects belonging strictly to this `setId`. |

### How Website Scoring Works (`rawStats` in `utils.js`)
At runtime, `rawStats(session)` ignores top-level `maxScore` / `pointsPerQuestion` and computes:
- For each question `q` in `session.questions`: `pts = Number(q.points) > 0 ? Number(q.points) : 3.75`.
- `maxWeightedScore` = sum of `pts` across all questions in the session.
- `weightedScore` = sum of `pts` for correctly answered questions (`ans === q.correctIndex`).

---

## 3. Question Object Schema (`questions[]`)

| Field | Type | Required | Description & Website Usage |
| :--- | :--- | :--- | :--- |
| `id` | `string` | **Required** | Globally unique question ID across the entire website (e.g., `"otaff51-01-q001"`). Used as IndexedDB keyPath and Kotoba lookup key. |
| `questionNumber` | `number` (int) | **Required** | 1-based sequential question number within the package (`1..N`). |
| `setId` | `string` | **Required** | Must match top-level `setId`. |
| `setName` | `string` | **Required** | Must match top-level `setName`. |
| `sourcePdf` | `string` | Recommended | Source PDF filename. |
| `sourcePage` | `number` (int) | Recommended | 1-based PDF page number where the source material/question appears. |
| `pdfPage` | `number` (int) | Optional | Alias of `sourcePage` (website falls back to `raw.sourcePage \|\| raw.pdfPage \|\| 1`). |
| `category` | `string` | Recommended | Topic/chapter classification (e.g., `"食品安全・品質管理（Keamanan Pangan & Mutu）"`). |
| `points` | `number` | Recommended | Question score weight (defaults to `3.75` in `normalizeExternalQuestion` and `rawStats` if omitted or `<= 0`). |
| `prompt` | `string` | **Required** | Japanese question text **with `<ruby>漢字<rt>かんじ</rt></ruby>` furigana markup**. Rendered directly in Exam/Practice UI. |
| `questionText` | `string` | **Required** | Plain Japanese text **without HTML/ruby tags**. Used by Kotoba plain-text pipelines and search. |
| `questionTextStatus` | `string` | Recommended | Verification status, e.g., `"verified"`. |
| `promptTranslation` | `string` | **Required** | Natural Indonesian translation of `prompt`. Checked by `hasCompleteTranslations()`. |
| `instructions` | `string` | Recommended | Instruction line with `<ruby>` tags, e.g., `"<ruby>正<rt>ただ</rt></ruby>しいものを<ruby>一<rt>ひと</rt></ruby>つ<ruby>選<rt>えら</rt></ruby>びなさい。"`. |
| `options` | `Array<Option>` | **Required** | Minimum 2 options (`validateQuestion` requires `options.length >= 2`). Preserves source exam count (e.g., 3 options `A–C` or 4 options `A–D`). |
| `correctAnswer` | `string` | **Required** | Uppercase letter of the correct option: `"A"`, `"B"`, `"C"`, or `"D"`. Must match `options[correctIndex].id`. |
| `correctIndex` | `number` (int) | **Required** | 0-based index of the correct option in `options[]` (`0`..`options.length - 1`). **Graded by `rawStats()`**. |
| `explanation` | `string` | Recommended | Indonesian explanation citing source PDF, page, chapter, and why the answer is correct. |
| `questionImage` | `string` | Conditional | Relative path `"assets/questions/<filename>.png"` for Category 1 question diagram; `""` if none or if using Category 2 option images. |
| `imageMediaId` | `string` | Conditional | Media ID linking to `media[]` (e.g., `"media-nguyen01-q032"`); `""` if no main question image. |
| `imageSize` | `string` | Optional | `"medium"` when `questionImage` is present, `"large"` otherwise. |
| `imageRatio` | `string` | Optional | `"auto"` (preserves original aspect ratio). |
| `imagePosition` | `string` | Optional | `"center"`. |
| `media` | `Array<Media>` | Conditional | Array of media descriptors for `questionImage` and/or option images. Empty `[]` if text-only. |
| `active` | `boolean` | **Required** | Must be `true` for the question to appear in Mock Test / Practice / Catalog counts. |
| `createdAt` | `number` | Optional | Unix epoch timestamp in milliseconds. |
| `updatedAt` | `number` | Optional | Unix epoch timestamp in milliseconds. |
| `kotobaU` / `kotobaV` / `kotobaFormatted` | `Array` / `string` | Optional | Supplementary question-level Kotoba fields (seen in `ssw-pm-kunci-ujian-16.json`). Does **not** replace the three required sidecar Kotoba files. |

---

## 4. Option Object Schema (`options[]`)

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | `string` | **Required** | Uppercase option letter: `"A"`, `"B"`, `"C"`, or `"D"`. |
| `text` | `string` | **Required** | Japanese option text with `<ruby>` furigana (if option is image-only, provide descriptive label like `"[標識A] ..."`). |
| `translation` | `string` | **Required** | Indonesian translation of the option text. Checked by `hasCompleteTranslations()`. |
| `mediaId` | `string` | Conditional | Media ID matching an entry in `question.media[]` if option has an image; `""` otherwise. |
| `optionImage` | `string` | Conditional | Relative path `"assets/questions/<filename>.png"` if option has an image (normalized by `normalizeExternalQuestion`). |

---

## 5. Media Object Schema (`media[]`)

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | `string` | **Required** | Must match `question.imageMediaId` or `option.mediaId`. |
| `name` | `string` | **Required** | Filename only (e.g., `"nguyen01-q032.png"`). |
| `type` | `string` | **Required** | MIME type: `"image/png"`. |
| `path` | `string` | **Required** | Must contain `"assets/questions/<filename>.png"`. `mediaURL()` extracts everything after `"assets/questions/"`. |

---

## 6. Failure Modes That Cause Questions to Fail Loading or Validation

1. **Mixing `setId`s in one package file:** Breaks package metadata consistency and catalog grouping.
2. **Missing `id` or duplicate `id`:** Overwrites existing questions in IndexedDB (`putMany`).
3. **Invalid `correctIndex`:** If `correctIndex` is not an integer `0 <= correctIndex < options.length`, `validateQuestion()` rejects the question and excludes it from active counts.
4. **Mismatched `correctAnswer` vs `correctIndex`:** Causes inconsistent QA and wrong grading.
5. **Fewer than 2 options, or empty option without text/image:** Fails `validateQuestion()`.
6. **Missing `promptTranslation` or `option.translation`:** Causes `hasCompleteTranslations()` to return `false` and breaks Indonesian translation mode.
7. **Broken `mediaId` or wrong `media[].path`:** Causes HTTP 404 or missing `<img>` in Exam/Practice UI.
