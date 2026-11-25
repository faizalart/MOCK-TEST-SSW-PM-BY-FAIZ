# Question Generation Standard (Japanese SSW Exam Style)

Use this standard when authoring new practice questions from SSW study textbooks (e.g., OTAFF) or digitizing exam PDFs.

---

## 1. Source Grounding & Provenance

Every single question must be traceable to the uploaded PDF source:
- Record `sourcePdf`, `sourcePage` (and `pdfPage`), and `category` (chapter/topic name).
- Cite the exact chapter, subchapter, and page number inside `explanation`.
- Never invent technical rules, temperatures, legal limits, or equipment specs that do not appear in the source material.

---

## 2. Question Type Variety

Distribute questions across authentic SSW exam patterns rather than repeating one template:
1. **Basic Recall / Terminology** — Definitions, legal terms, 8/28 allergens, 5S/HACCP terms.
2. **Concept Comprehension** — *Why* a hygiene/safety rule exists (e.g., cross-contamination prevention).
3. **Negative Selection (`間違っているもの`)** — Identifying the single incorrect procedure or statement among valid ones.
4. **Workplace Scenario (`現場での対応`)** — Realistic factory/worksite situations (e.g., noticing a broken glass bottle, feeling pain when lifting heavy kettles, discovering mold).
5. **Procedure & Order (`手順`)** — Correct sequence of handwashing, cleaning/sanitizing, or machine lockout.
6. **Diagram / Sign Interpretation** — Identifying safety signs (禁止, 注意, 指示) or unsafe behaviors shown in an illustration.
7. **Table Analysis** — Reading temperature/time sterilization tables, allergen matrices, or chemical dilution charts.
8. **Numerical Calculation** — Concentration (`%`, `ppm`), ingredient weight scaling, `g`/`kg`/`ml`/`L` conversions, batch capacity.

Avoid creating near-duplicate questions that merely rearrange words from an earlier item.

---

## 3. Japanese Language & Furigana Formatting

1. **Authentic Exam Register:** Use polite/standard exam phrasing (`〜は何ですか。`, `〜について、正しいものを一つ選びなさい。`, `〜のうち、間違っているものはどれですか。`).
2. **Mandatory `<ruby>` Markup:** Wrap every kanji word in `prompt`, `instructions`, and `options[].text` with `<ruby>漢字<rt>かんじ</rt></ruby>`.
   - Example: `<ruby>食中毒<rt>しょくちゅうどく</rt></ruby>を<ruby>防<rt>ふせ</rt></ruby>ぐために...`
   - Keep okurigana outside `<ruby>` where standard (e.g., `<ruby>正<rt>ただ</rt></ruby>しい`, `<ruby>選<rt>えら</rt></ruby>びなさい`).
3. **Plain Text Field:** `questionText` must be the exact plain Japanese string stripped of all `<ruby>`, `<rt>`, and HTML tags.
4. **Indonesian Translation:** `promptTranslation` and every `options[].translation` must be accurate, natural Indonesian preserving key Japanese technical terms in parentheses when helpful (e.g., `troli (daisha)`).

---

## 4. Option Count & Structure

- Preserve the option count specified by the source exam or job configuration:
  - Standard CBT / Latsol: 3 options (`A`, `B`, `C`) or 4 options (`A`, `B`, `C`, `D`).
  - Never force 4 options when source material is strictly 3-option (`A–C`), and never drop option `D` when source material is 4-option (`A–D`).
- Options within the same question should be parallel in grammatical structure and comparable in length.
