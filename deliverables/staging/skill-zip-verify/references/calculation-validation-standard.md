# Calculation Validation Standard

Use this standard whenever the source PDF contains numerical formulas, concentrations, ingredient scaling, temperature/time conversions, or production capacity calculations.

---

## 1. Scope

Follow the exact calculation types present in the source PDF being processed. Common examples in OTAFF SSW Pengolahan Makanan (e.g. Module 5.1) include:
- NaCl / sodium hypochlorite solution concentration (`%` and `ppm`, where `1% = 10,000 ppm`, `100 ppm = 0.01%`)
- Dilution volume calculations (`C1 × V1 = C2 × V2`, water volume = `V_total - V_concentrate`)
- Ingredient weight & ratio scaling (`g` $\leftrightarrow$ `kg`, `ml` $\leftrightarrow$ `L`)
- Batch / production capacity calculations based on yield or unit weight

*(For other SSW industries like Construction, Restaurant, or Caregiving, apply the exact numerical formulas taught in that module's PDF.)*

---

## 2. Mandatory 8-Step Verification

For every calculation question, perform and verify all 8 steps before writing the JSON:
1. **Initial Data:** List all given values from the prompt verbatim.
2. **Units:** Verify unit consistency (`g` vs `kg`, `ml` vs `L`, `%` vs `ppm`).
3. **Formula:** State the exact formula from the source module.
4. **Substitution:** Substitute the given numbers into the formula.
5. **Arithmetic:** Compute intermediate and final values step by step.
6. **Rounding:** Apply explicit rounding rules if non-integer (match source module convention, e.g., round to 1 decimal place or nearest integer, and state it in the prompt if needed).
7. **Exact Option Match:** Verify the computed answer matches the keyed option verbatim (including units).
8. **Distractor Check:** Ensure distractors represent plausible calculation errors (e.g., forgetting `g` $\leftrightarrow$ `kg` conversion, forgetting to subtract concentrate from total water, wrong `ppm` decimal shift) and do **not** accidentally equal the true answer.

---

## 3. Explanation Requirement

Every calculation question's `explanation` must include the complete, auditable math steps in Indonesian, matching the website convention in `data/latsol-hitungan-01.json`:
> `"Verifikasi Hitungan: 100 ppm = 0,01%; 2 L = 2000 ml. Larutan = (2000 × 0,01%) / 5% = 4 ml; Air = 2000 - 4 = 1996 ml (Opsi A)."`
