# Kotoba Standard (Reverse-Engineered from `app.js` & `scripts/lib/kotoba-pipeline-utils.mjs`)

The website displays vocabulary helpers (**Kotoba**) in Practice Mode, separated strictly by context:
- **Prompt Kotoba** (Shortcut `V`): Terms appearing in the question prompt/instructions.
- **Option Kotoba** (Shortcut `Z` / per option A–D): Terms appearing in each specific answer option.

---

## 1. Mandatory Three-Sidecar Architecture

Based on `ensureKotobaLoaded()` in `app.js`, the website loads **three** sidecar files from `data/`:
1. `data/sharedKotobaDictionary.json` — Master dictionary of terms (`terms[termId]`).
2. `data/kotobaMapping.json` — Context-separated lookup (`questions[qId]`, `options[qId][optId]`, `byCompositeKey["qId::optId"]`).
3. `data/kotoba-dan-kategori-tambahan.json` — Supplementary per-question flat lists (`entries[qId]` with `kotobaU`, `kotobaV`, `kotobaFormatted`).

**STRICT RULE:** Every generated output bundle **MUST** produce all three synchronized delta files:
1. `sharedKotobaDictionary-delta.json`
2. `kotobaMapping-delta.json`
3. `kotoba-tambahan-delta.json`

Never treat any one of these three files as a substitute for the others. All three must stay 100% synchronized.
*(Some newer packages such as `ssw-pm-kunci-ujian-16.json` also embed `kotobaU`, `kotobaV`, and `kotobaFormatted` inside each question object; you may include those too, but they do NOT replace the three sidecar deltas.)*

---

## 2. Schema: `sharedKotobaDictionary` Term Entry

Each entry in `terms[termId]` follows this exact structure:

```json
{
  "id": "kb-ext-example-001",
  "kanji": "特定原材料",
  "furigana": "とくていげんざいりょう",
  "unitType": "compound_technical",
  "arti": "bahan baku spesifik",
  "status": "verified"
}
```

### Field & Verification Rules
- `id`: Globally unique string ID (never collide with existing `kb-*` IDs in `data/sharedKotobaDictionary.json`).
- `kanji`: Exact surface word or compound noun as used in the question/option (without `<ruby>` tags).
- `furigana`: Pure Hiragana reading (`^[\u3041-\u3096\u3099-\u309cー]+$`, matching `isValidHiraganaReading()`).
- `unitType`: Lexical category (`"compound_technical"`, `"noun"`, `"verb"`, `"adjective"`, `"adverb"`, `"expression"`).
- `arti`: Accurate Indonesian translation matching the SSW industry context.
- `status`:
  - **`"verified"`** may ONLY be assigned after verifying both the exact Hiragana reading and Indonesian meaning against the source context.
  - **NEVER auto-mark unverified or uncertain terms as `"verified"`.**
  - Any term whose reading or meaning cannot be verified must be marked `"unresolved"` (which `resolveKotobaEntries()` excludes from UI display) and listed in `generation-audit-report.md` for human review.

---

## 3. Schema: `kotobaMapping` Entry

`resolveKotobaEntries(qId, optOrKey)` resolves terms as follows:
1. **Prompt Context** (`optOrKey === null`): reads `mapping.questions[qId]`.
2. **Option Context** (`optOrKey` is option `A..D`): checks `mapping.byCompositeKey["${qId}::${optId}"]` first, then `mapping.options[qId][optId]`.

### Rules
- `mapping.options[qId][optId]` and `mapping.byCompositeKey["${qId}::${optId}"]` MUST contain the exact same `termId` array.
- Every `termId` in `kotobaMapping-delta.json` MUST exist in `sharedKotobaDictionary-delta.json` (or the existing master dictionary). Zero dangling `termId`s.
- Zero duplicate `termId`s within the same context array.
- Prompt Kotoba and Option Kotoba MUST be kept strictly separate.

---

## 4. Schema: `kotoba-dan-kategori-tambahan` Entry

```json
{
  "id": "example-q001",
  "setId": "example-package",
  "questionNumber": 1,
  "category": "食品安全・品質管理",
  "kotobaU": [
    "特定原材料（とくていげんざいりょう）",
    "表示義務（ひょうじぎむ）"
  ],
  "kotobaV": [
    "特定原材料（とくていげんざいりょう） : bahan baku spesifik",
    "表示義務（ひょうじぎむ） : kewajiban pelabelan"
  ],
  "kotobaFormatted": "特定原材料（とくていげんざいりょう） : bahan baku spesifik\n表示義務（ひょうじぎむ） : kewajiban pelabelan",
  "status": "FIXED"
}
```

### Rules
- `kotobaU.length` MUST equal `kotobaV.length`.
- Parentheses MUST use full-width Japanese parentheses `（` and `）`.
- `kotobaFormatted` MUST equal `kotobaV.join('\n')`.
- No duplicate entries within the same question's list.

---

## 5. Extraction Completeness & Coverage Audit Rules

1. **Extract from ALL contexts:**
   - Question prompt (`prompt`)
   - Question instructions (`instructions`)
   - Every option (`A`, `B`, `C`, and `D` if present)
   - Diagram labels / table headers when required to answer the question
2. **Extract ALL meaningful parts of speech:**
   - Technical compound nouns (`特定原材料`, `交差汚染`, `作業手順書`)
   - Verbs (`持ち上げる`, `防ぐ`, `消毒する`, `確認する`)
   - Adjectives (`不安定な`, `適切な`, `清潔な`)
   - Adverbs & procedural connectors (`できるだけ`, `ゆっくり`, `必ず`)
   - Technical units & numeric terms (`濃度`, `溶液`, `換算`)
3. **Never split compound nouns:** Keep `食中毒` as one term (`しょくちゅうどく`), never `食` + `中毒`.
4. **Coverage Self-Audit:** Compare the plain Japanese text of `prompt` and each `options[i].text` against the mapped terms in `questions[qId]` and `options[qId][optId]`. Report prompt coverage %, option coverage %, and any missing/unmapped content words in `generation-audit-report.md`.
