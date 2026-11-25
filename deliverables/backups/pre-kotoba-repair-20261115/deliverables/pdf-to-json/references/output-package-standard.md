# Output Package Standard, Delta Integration & QC Checklist

---

## 1. Output ZIP Bundle vs. Website Integration

**CRITICAL DISTINCTION:**
- The website's `ensureKotobaLoaded()` reads **only** `data/sharedKotobaDictionary.json`, `data/kotobaMapping.json`, and `data/kotoba-dan-kategori-tambahan.json`.
- `ensureAllBuiltinSetsLoaded()` loads **only** package JSON files explicitly registered in `app.js`, `utils.js`, and `sw.js`.
- Therefore, `*-delta.json` files inside a Gemini output ZIP are **NOT** automatically loaded by the website if simply copied into `data/`. They are an **integration staging bundle** that must be merged into the master sidecars and registered (see `INTEGRATION-GUIDE.md`).

---

## 2. Standard Output Integration Bundle Structure

```text
<output-bundle>.zip
├── data/
│   ├── <pkg-01>.json                       # Package 1 JSON (website schema)
│   ├── <pkg-02>.json                       # Package 2 JSON (if multi-package)
│   ├── sharedKotobaDictionary-delta.json   # New terms delta
│   ├── kotobaMapping-delta.json            # Prompt & option mappings delta
│   └── kotoba-tambahan-delta.json          # Legacy supplementary Kotoba delta
├── assets/
│   └── questions/
│       ├── <pkg-01>-q005.png               # Category 1 question diagram (if cropped)
│       ├── <pkg-01>-q012-option-a.png      # Category 2 option A image (if cropped)
│       └── ...
├── INTEGRATION-GUIDE.md                    # Merge & registration instructions
└── generation-audit-report.md              # Audit report (never inside JSON)
```

For multi-package jobs (e.g., 5 packages × 40 questions = 200 questions):
- Emit 5 separate `<pkg-01>.json` .. `<pkg-05>.json` files.
- Ensure every package covers the requested chapters (e.g., Chapters 1, 2, and 3).
- Ensure zero `setId`, question `id`, or PNG filename collisions across all 5 packages.

---

## 3. Pre-Delivery Quality Control Checklist

Before reporting a bundle as complete, verify every item:

### A. JSON Validation
- [ ] All JSON files parse with zero syntax errors.
- [ ] Single `setId` and matching `setName` per package file (no mixed `setId`s).
- [ ] `questions.length === totalQuestions`.
- [ ] `maxScore` equals the sum of `q.points` across `questions[]`.
- [ ] Zero duplicate question `id`s across all packages.
- [ ] `correctAnswer` matches `options[correctIndex].id` for every question.
- [ ] Every question has `prompt` (with `<ruby>`), `questionText` (plain), `promptTranslation`, and `options[].translation`.

### B. Kotoba Validation
- [ ] All three deltas (`sharedKotobaDictionary-delta.json`, `kotobaMapping-delta.json`, `kotoba-tambahan-delta.json`) are present and synchronized.
- [ ] Every `termId` in `kotobaMapping-delta.json` resolves to a term in `sharedKotobaDictionary-delta.json` (or verified master dictionary).
- [ ] Only genuinely verified terms carry `status: "verified"`; uncertain terms are marked `"unresolved"` and listed for review.
- [ ] `kotobaU.length === kotobaV.length` and `kotobaFormatted` matches `kotobaV.join('\n')`.

### C. Image Validation
- [ ] Zero full-page PDF screenshots.
- [ ] Category 1 diagrams are tightly cropped and `questionImage` + `imageMediaId` + `media[]` match physical PNGs.
- [ ] Category 2 visual options use separate PNG files per option (`A..D`) and `questionImage` is `""`.
- [ ] Any uncropped image is honestly flagged as `NEEDS_IMAGE_PROCESSING` (never claimed as `IMAGE_CROPPED`).

### D. Academic & Calculation Validation
- [ ] All questions grounded in the PDF (filename, page, chapter in `explanation`).
- [ ] Zero duplicate questions or ambiguous keys; uncertain keys marked `REVIEW_REQUIRED`.
- [ ] All calculations verified via the 8-step protocol.

---

## 4. Required `generation-audit-report.md` Contents

1. Total packages, total questions, active questions.
2. Chapter / topic distribution.
3. Question type distribution.
4. Visual assets summary (`IMAGE_CROPPED` count vs `NEEDS_IMAGE_PROCESSING` list with PDF page + description).
5. Calculation audit log.
6. Kotoba coverage % (prompt & options) + any `"unresolved"` terms for review.
7. Keys marked `REVIEW_REQUIRED`.
8. Validation errors & honest integration status (never claim `READY` if images or keys are pending).
