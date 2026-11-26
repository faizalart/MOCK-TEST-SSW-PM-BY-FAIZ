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

1. **Extract from ALL contexts independently (Zero-Missed-Content Rule):**
   - Question prompt (`prompt`) + instructions (`instructions`)
   - Every option (`A`, `B`, `C`, and `D` if present), mapped separately under `options[qId][optId]` and `byCompositeKey["qId::optId"]`
   - Diagram labels / table headers when required to answer the question
   - **NEVER extract globally per question and drop option terms** or stop after 2–4 summary words per context!
   - **ZERO GLOBAL LEAKAGE:** Every `termId` mapped into `questions[qId]` or `options[qId][optId]` MUST literally appear inside that context's stripped text.

2. **Extract ALL meaningful parts of speech (leaving ONLY ordinary grammatical particles unmapped):**
   - **Technical compound nouns & objects:** `特定原材料`, `交差汚染`, `作業手順書`, `縦襟`, `内側`, `図`, `消費者`
   - **Numbers + counters:** `1日`, `1年間`, `1個`, `2回分`, `500箱`
   - **Complete inflected verbs & adjectives (NO TRUNCATION!):** Always emit the exact inflected surface form (e.g., `落とす`, `欠ける`, `育てる`, `書かせる`, `付着しにくい`), **NEVER** truncated stems (`落と`, `欠け`, `育て`, `書かせ`). You may store the lemma in optional `dictForm` while keeping `kanji` as the exact surface.
   - **All `>=2`-char Katakana loanwords & technical ASCII:** `ルール`, `マスク`, `ヘアーネット`, `HACCP`, `CCP`, `KYT`, `ppm`, `5S`
   - **Mandatory Hiragana lexical vocabulary checklist:** Never skip core hiragana nouns, verbs, adjectives, or adverbs such as `なくす`, `ほこり`, `やけど`, `せっけん`, `やっつける`, `うがい`, `けが`, `ころぶ`, `すべる`, `つまる`, `はずす`, `はずれる`, `あわてて`, `はずかしい`, `きちんと`, `しっかり`, `ゆっくり`, `なぜ`, `おこなう`.

3. **Anti-Collision & Anti-Placeholder Rules:**
   - **NEVER use placeholder `"たんご"`** or blank strings for `furigana` on any kanji term. `furigana` MUST match `^[\u3041-\u3096\u3099-\u309cー]+$`.
   - Keep `arti` concise in Indonesian (`<= 40` chars preferred, `<= 60` chars hard cap).
   - **Never split compound nouns or create substring kanji collisions:** Keep `食中毒` (`しょくちゅうどく`), `計画通り` (`けいかくどおり`), `品目` (`ひんもく`) intact. **NEVER** emit single-kanji substrings (`目` in `品目`, `水` in `水洗い`) unless they independently appear outside longer compounds.

4. **Real BAD vs. GOOD Contrast Examples (from OTAFF SSW PM 5.1 P01):**
   - **Example 1 — Incomplete Option Extraction (`otaff-pm51-01-q002` Option A):**
     - Text: `社会や消費者からの信用をなくす。`
     - **BAD:** `["社会", "信用"]` -> misses `消費者` and lexical verb `なくす` (learner gets no tooltip for key noun or verb!).
     - **GOOD:** `["社会", "消費者", "信用", "なくす"]` -> 100% of lexical content covered; only particles `や`, `から`, `の`, `を` stay unmapped.
   - **Example 2 — Incomplete Garment Rule + Katakana/Hiragana Drops (`otaff-pm51-01-q031` Option A):**
     - Text: `ヘアーネットは帽子の内側に着用し、襟は髪の毛やほこりが付着しにくい縦襟にする。`
     - **BAD:** `["帽子", "着用", "付着"]` -> misses `ヘアーネット`, `内側`, `襟`, `髪の毛`, `ほこり`, `縦襟`.
     - **GOOD:** `["ヘアーネット", "帽子", "内側", "着用し", "襟", "髪の毛", "ほこり", "付着しにくい", "縦襟"]`.
   - **Example 3 — Truncated Verb Stem (`otaff-pm51-01-q033` Option A):**
     - Text: `[イラストA] 流水で汚れをよく落とす工程`
     - **BAD:** `["流水", "汚れ", "落と", "工程"]` -> truncated `落と` misses `す` and omits adverb `よく`!
     - **GOOD:** `["流水", "汚れ", "よく", "落とす", "工程"]`.

5. **Automated Coverage Benchmark & Validator (`validators/validate_kotoba_completeness.py`):**
   - Gold-standard target (`latsol-nguyen-01.json`): **>= 76% span coverage** (after removing particles/punctuation) with **0** missed content words.
   - Run locally (or in Gemini Web if Python execution is enabled):
     ```bash
     python validators/validate_kotoba_completeness.py \
       --package data/<pkg-01>.json \
       --dict data/sharedKotobaDictionary-delta.json \
       --mapping data/kotobaMapping-delta.json \
       --tambahan data/kotoba-tambahan-delta.json
     ```
   - Report per-context error count, prompt/option term counts, span coverage %, and any `"unresolved"` terms in `generation-audit-report.md` (and report `VALIDATOR_NOT_EXECUTED_IN_SESSION` honestly if Python is unavailable).
