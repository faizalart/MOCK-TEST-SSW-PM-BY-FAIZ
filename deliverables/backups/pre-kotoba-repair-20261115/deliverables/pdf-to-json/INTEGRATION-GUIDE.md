# Integration Guide — Merging Gemini Output Bundles into the Website

## Why Manual / Scripted Integration Is Required

The SSW Mock Test website does **NOT** automatically discover arbitrary JSON filenames or `*-delta.json` files placed in `data/`. Specifically:
- `ensureKotobaLoaded()` in `app.js` fetches **only** `data/sharedKotobaDictionary.json`, `data/kotobaMapping.json`, and `data/kotoba-dan-kategori-tambahan.json`.
- `ensureAllBuiltinSetsLoaded()` in `app.js` fetches **only** package JSON files explicitly registered in `app.js`, `utils.js`, and `sw.js`.

Therefore, the ZIP produced by the `pdf-to-json` Gemini Skill is an **integration bundle** that must be merged safely into the repository without overwriting existing production packages or Kotoba records.

---

## Step-by-Step Safe Integration Procedure

### Step 1: Audit the Incoming Bundle Before Touching Production Files
1. Extract the Gemini ZIP into a temporary staging directory (e.g., `_incoming/<bundle-name>/`).
2. Read `generation-audit-report.md`:
   - Resolve any **`REVIEW_REQUIRED`** answer keys against the source PDF.
   - Crop and verify any **`NEEDS_IMAGE_PROCESSING`** PNGs (ensuring zero full-page screenshots and zero swapped A–D option images).
3. Validate JSON syntax, unique `id`s (no collision with existing questions in `data/*.json`), and `correctAnswer`/`correctIndex` parity.

### Step 2: Copy Package JSON & PNG Assets
1. Copy each new package JSON (e.g., `otaff51-paket-01.json`) into `data/`.
   - **NEVER** overwrite any existing `data/*.json` production package.
2. Copy all verified `.png` files from the bundle's `assets/questions/` into `assets/questions/`.
   - Check for filename collisions first.

### Step 3: Merge the Three Kotoba Deltas Safely
Never replace the master files! Merge each delta into its corresponding master sidecar:

1. **Merge `sharedKotobaDictionary-delta.json` $\rightarrow$ `data/sharedKotobaDictionary.json`:**
   - Check every incoming `termId` against existing `dict.terms`.
   - If a `termId` already exists:
     - If `kanji`, `furigana`, and `arti` match, reuse the existing `termId`.
     - If they differ, assign a new unique `termId` (and update the reference in `kotobaMapping-delta.json` before merging!).
   - Only merge terms with `status: "verified"` (or resolve `"unresolved"` items first).
   - Update `dict._meta.totalTerms` and `updatedAt`.

2. **Merge `kotobaMapping-delta.json` $\rightarrow$ `data/kotobaMapping.json`:**
   - Add `mapping.questions[qId] = [...]`.
   - Add `mapping.options[qId] = { A: [...], B: [...], ... }`.
   - Add `mapping.byCompositeKey["${qId}::${optId}"] = [...]`.
   - Verify every referenced `termId` exists in the merged `data/sharedKotobaDictionary.json`.
   - Update `mapping._meta.totalQuestions` and `totalOptions`.

3. **Merge `kotoba-tambahan-delta.json` $\rightarrow$ `data/kotoba-dan-kategori-tambahan.json`:**
   - Add each `entries[qId]` without overwriting existing question entries.
   - Update `totalEntries = Object.keys(entries).length`.

### Step 4: Register New Packages in Website Code
1. **`utils.js`:** Add package metadata (`id`, `name`, `sourcePdf`, `description`, `pointsPerQuestion`) to `DEFAULT_PACKAGES`.
2. **`app.js`:**
   - Add metadata to `BUILTIN_PACKAGES_META`.
   - Add or update the loader function inside `ensureAllBuiltinSetsLoaded()` to fetch the new `data/<pkg>.json` filenames via `fetchBuiltinJson()`.
3. **`sw.js`:**
   - Add `'./data/<pkg>.json'` (and new PNG paths if precached) to `CORE`.
   - Bump `CACHE_NAME` (e.g., `v39` $\rightarrow$ `v40`).

### Step 5: Verify Live in Browser (Chrome DevTools)
1. Run the existing regression test suites (`node tests/test-19-paket-integration.mjs`, `node tests/test-soal-ujian-14-16-integration.mjs`).
2. Run a browser check via Chrome DevTools on localhost to verify:
   - New packages appear in the Home catalog with exact active counts.
   - All question & option images load (`complete === true && naturalWidth > 0`).
   - Prompt Kotoba (`V`) and Option Kotoba (`Z`) render cleanly.
   - Zero console errors and zero HTTP 404s.
