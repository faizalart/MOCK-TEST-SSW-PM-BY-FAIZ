# Academic Validation & Answer Key QA Standard

Every generated or digitized question must pass academic verification before being marked ready.

---

## 1. Answer Key Verification Protocol

For every question, verify all 7 steps:
1. **Read the stem carefully:** Check whether the question asks for the **correct** statement (`正しいもの`) or the **incorrect** statement (`間違っているもの` / `不適切なもの`).
2. **Check every option against the source PDF:** Compare each option A, B, C(, D) directly against the cited chapter/page.
3. **Confirm unique correctness:** Verify that **exactly one** option satisfies the question condition and all other options are clearly contradicted or distinct.
4. **Check `correctAnswer` and `correctIndex` parity:**
   - `"A"` $\leftrightarrow$ `0`
   - `"B"` $\leftrightarrow$ `1`
   - `"C"` $\leftrightarrow$ `2`
   - `"D"` $\leftrightarrow$ `3`
5. **Verify `explanation` alignment:** Ensure the explanation explicitly justifies why the keyed option is right and why distractors fail, citing PDF page and chapter.
6. **Do not blindly copy corrupted source keys:** If an old exam PDF has a demonstrably wrong marked key contradicted by the official textbook, flag it and fix/mark for review with evidence.
7. **Flag uncertainty honestly:** If the source PDF lacks enough information to prove one unique answer, mark the item as **`REVIEW_REQUIRED`** in `generation-audit-report.md`—never guess certainty.

---

## 2. Distractor Quality Rules

Good distractors test real comprehension of SSW concepts:
- **Plausible:** Use realistic misconceptions (e.g., wrong sterilization temperature, wrong dilution step, mixing up `細菌` vs `ウイルス`, confusing `特定原材料` 8 items vs `推奨` items).
- **Mutually Exclusive:** Never write two options that mean the same thing.
- **No Obvious Giveaways:** Avoid absurd/joking options, avoid making the correct answer consistently twice as long as distractors, and avoid repeating the same answer letter pattern (e.g. `B, B, B, B`).
- **Balanced Key Distribution:** Across a 40-question package, distribute `correctAnswer` reasonably across `A`, `B`, `C` (and `D`).
