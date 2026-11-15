# Final Kotoba Audit & Repair Report — All 50 Non-OTAFF Latsol Packages

- **Branch**: `fix/kotoba-audit-40` (`main` untouched, nothing pushed)
- **Generated At**: `2026-11-15T16:40:23.117Z`
- **Scope**: All **50** non-OTAFF packages (**1,739 questions**, **5,383 options**, **7,122 contexts**) repaired across `batch-01`..`batch-10`; **10** Protected OTAFF PM 5.1 packages (`1,600` contexts) kept **100% byte-identical** and mapping-identical.

## 1. Executive Summary (Before vs After)

| Metric | Before Repair | After Repair | Notes |
| --- | ---: | ---: | --- |
| Strict Validator Errors (50 Targets) | — | **0** | `validateStrictContext` + Spec-009 + inline sync |
| `v2Completeness` Errors (50 Targets) | **3,145** | **12** | All 12 residual flags are bracketed `[画像A/B/C]` UI tags in `latsol-nguyen-06` (intentionally excluded by `PREFIX_MARKER_RE`) |
| Mean Span Coverage (50 Targets) | **82.01%** | **88.5%** | Converged to 100% Cohort 1 / ~77-80% OTAFF standard |
| Empty Prompt Contexts (50 Targets) | **20** | **0** | Every Japanese prompt mapped |
| Empty Option Contexts (50 Targets) | **197** | **18** | Remaining 18 are pure numbers / English acronyms / PDF truncated marker |
| Dictionary Terms (Total / Verified) | 6359 / 6315 | **6547 / 6503** | +188 curated (`kb-audit-0001..`), 0 `たんご` |
| Mapping Composite Keys | 6583 | **6583** | Complete per-option keys synced with `mapping.options` |
| Protected 10 OTAFF Reference Packages | 0 errors | **0 errors (100% SHA-256 identical)** | Zero file hash or resolved Kotoba changes |

## 2. Results by Cohort vs Protected Reference & Benchmark

| Cohort | Packages | Qs | Ctxs | Errors Before (`v2`) | Errors After (`v2` / Strict) | Empty Prompts | Empty Options | Span % Before -> After |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Cohort 1 — Spec-009 Canonical | 27 | 1006 | 4116 | 133 | **0 / 0** | 0 | 6 | 100% -> **100%** |
| Cohort 2 — 19 Paket Latsol | 19 | 581 | 2392 | 1010 | **12 / 0** | 0 | 12 | 65.61% -> **74.68%** |
| Cohort 3 — Soal Ujian 14–16 | 3 | 147 | 589 | 1930 | **0 / 0** | 0 | 0 | 30.17% -> **76.47%** |
| Cohort 4 — Pilot OTAFF 5.1 | 1 | 5 | 25 | 72 | **0 / 0** | 0 | 0 | 63.64% -> **76.71%** |
| Protected 10 — OTAFF PM 5.1 (Ref) | 10 | 400 | 1600 | 0 | **0 / 0** | 0 | 0 | 79.36% -> **79.36%** |

- **Benchmark `latsol-nguyen-01`**: Span coverage **76.13% -> 79.06%**, `v2` errors **26 -> 0**, strict errors **0**, `avgPromptTerms=10.7`, `avgOptionTerms=3.23` (vs Protected OTAFF mean span **79.36%**).

## 3. Per-Package Verification Table (50 Repaired Targets)

| # | Set ID | Cohort | Batch | Qs | Errs Before (`v2`) | Errs After (`v2`/Strict) | Span % Before -> After | Empty Q / O |
| ---: | --- | --- | --- | ---: | ---: | ---: | ---: | ---: |
| 1 | `ssw-pm-kunci-ujian-1` | `cohort_1_spec009_canonical` | `batch-07` | 40 | 6 | **0 / 0** | 100% -> **100%** | 0 / 0 |
| 2 | `ssw-pm-kunci-ujian-2` | `cohort_1_spec009_canonical` | `batch-09` | 40 | 2 | **0 / 0** | 100% -> **100%** | 0 / 3 |
| 3 | `ssw-pm-kunci-ujian-3` | `cohort_1_spec009_canonical` | `batch-08` | 40 | 4 | **0 / 0** | 100% -> **100%** | 0 / 0 |
| 4 | `ssw-pm-kunci-ujian-4` | `cohort_1_spec009_canonical` | `batch-10` | 40 | 1 | **0 / 0** | 100% -> **100%** | 0 / 0 |
| 5 | `ssw-pm-kunci-ujian-5` | `cohort_1_spec009_canonical` | `batch-09` | 40 | 3 | **0 / 0** | 100% -> **100%** | 0 / 0 |
| 6 | `ssw-pm-kunci-ujian-6` | `cohort_1_spec009_canonical` | `batch-10` | 40 | 0 | **0 / 0** | 100% -> **100%** | 0 / 0 |
| 7 | `ssw-pm-kunci-ujian-7` | `cohort_1_spec009_canonical` | `batch-07` | 40 | 7 | **0 / 0** | 100% -> **100%** | 0 / 0 |
| 8 | `ssw-pm-kunci-ujian-8` | `cohort_1_spec009_canonical` | `batch-09` | 40 | 2 | **0 / 0** | 100% -> **100%** | 0 / 0 |
| 9 | `ssw-pm-kunci-ujian-9` | `cohort_1_spec009_canonical` | `batch-10` | 40 | 0 | **0 / 0** | 100% -> **100%** | 0 / 0 |
| 10 | `ssw-pm-kunci-ujian-10` | `cohort_1_spec009_canonical` | `batch-10` | 40 | 0 | **0 / 0** | 100% -> **100%** | 0 / 0 |
| 11 | `ssw-pm-kunci-ujian-11` | `cohort_1_spec009_canonical` | `batch-06` | 40 | 8 | **0 / 0** | 100% -> **100%** | 0 / 0 |
| 12 | `ssw-pm-kunci-ujian-12` | `cohort_1_spec009_canonical` | `batch-08` | 40 | 4 | **0 / 0** | 100% -> **100%** | 0 / 3 |
| 13 | `ssw-pm-kunci-ujian-13` | `cohort_1_spec009_canonical` | `batch-08` | 40 | 3 | **0 / 0** | 100% -> **100%** | 0 / 0 |
| 14 | `ssw-pm-kunci-ujian-14` | `cohort_3_unaudited_ujian_14_16` | `batch-01` | 59 | 684 | **0 / 0** | 36.22% -> **77.4%** | 0 / 0 |
| 15 | `ssw-pm-kunci-ujian-15` | `cohort_3_unaudited_ujian_14_16` | `batch-01` | 38 | 527 | **0 / 0** | 27.95% -> **74.37%** | 0 / 0 |
| 16 | `ssw-pm-kunci-ujian-16` | `cohort_3_unaudited_ujian_14_16` | `batch-01` | 50 | 719 | **0 / 0** | 26.34% -> **77.64%** | 0 / 0 |
| 17 | `ssw-pm-tipe2-nguyen1` | `cohort_1_spec009_canonical` | `batch-08` | 40 | 4 | **0 / 0** | 100% -> **100%** | 0 / 0 |
| 18 | `bonus-soal-1` | `cohort_1_spec009_canonical` | `batch-05` | 40 | 11 | **0 / 0** | 100% -> **100%** | 0 / 0 |
| 19 | `bonus-soal-2` | `cohort_1_spec009_canonical` | `batch-08` | 40 | 4 | **0 / 0** | 100% -> **100%** | 0 / 0 |
| 20 | `bonus-soal-4` | `cohort_1_spec009_canonical` | `batch-07` | 40 | 5 | **0 / 0** | 100% -> **100%** | 0 / 0 |
| 21 | `bonus-soal-5` | `cohort_1_spec009_canonical` | `batch-06` | 36 | 9 | **0 / 0** | 100% -> **100%** | 0 / 0 |
| 22 | `bonus-soal-6` | `cohort_1_spec009_canonical` | `batch-06` | 40 | 8 | **0 / 0** | 100% -> **100%** | 0 / 0 |
| 23 | `bonus-soal-7` | `cohort_1_spec009_canonical` | `batch-07` | 39 | 7 | **0 / 0** | 100% -> **100%** | 0 / 0 |
| 24 | `bonus-soal-8` | `cohort_1_spec009_canonical` | `batch-06` | 39 | 11 | **0 / 0** | 100% -> **100%** | 0 / 0 |
| 25 | `bonus-soal-9` | `cohort_1_spec009_canonical` | `batch-09` | 40 | 2 | **0 / 0** | 100% -> **100%** | 0 / 0 |
| 26 | `bonus-soal-10` | `cohort_1_spec009_canonical` | `batch-06` | 40 | 9 | **0 / 0** | 100% -> **100%** | 0 / 0 |
| 27 | `ssw-pm-lab-bakteri` | `cohort_1_spec009_canonical` | `batch-05` | 32 | 13 | **0 / 0** | 100% -> **100%** | 0 / 0 |
| 28 | `ssw-pm-lab-suhu` | `cohort_1_spec009_canonical` | `batch-10` | 28 | 0 | **0 / 0** | 100% -> **100%** | 0 / 0 |
| 29 | `ssw-pm-lab-haccp` | `cohort_1_spec009_canonical` | `batch-09` | 12 | 2 | **0 / 0** | 100% -> **100%** | 0 / 0 |
| 30 | `ssw-pm-lab-alergen` | `cohort_1_spec009_canonical` | `batch-07` | 20 | 8 | **0 / 0** | 100% -> **100%** | 0 / 0 |
| 31 | `latsol-nguyen-01` | `cohort_2_unaudited_19_paket` | `batch-04` | 40 | 26 | **0 / 0** | 76.13% -> **79.06%** | 0 / 0 |
| 32 | `latsol-nguyen-02` | `cohort_2_unaudited_19_paket` | `batch-04` | 40 | 36 | **0 / 0** | 73.8% -> **77.95%** | 0 / 0 |
| 33 | `latsol-nguyen-03` | `cohort_2_unaudited_19_paket` | `batch-04` | 40 | 39 | **0 / 0** | 70.47% -> **74.53%** | 0 / 0 |
| 34 | `latsol-nguyen-04` | `cohort_2_unaudited_19_paket` | `batch-03` | 40 | 49 | **0 / 0** | 71.27% -> **76.32%** | 0 / 0 |
| 35 | `latsol-nguyen-05` | `cohort_2_unaudited_19_paket` | `batch-03` | 36 | 41 | **0 / 0** | 71.12% -> **75.18%** | 0 / 1 |
| 36 | `latsol-nguyen-06` | `cohort_2_unaudited_19_paket` | `batch-03` | 40 | 48 | **12 / 0** | 71.24% -> **74.83%** | 0 / 0 |
| 37 | `latsol-nguyen-07` | `cohort_2_unaudited_19_paket` | `batch-03` | 39 | 43 | **0 / 0** | 75.53% -> **79.39%** | 0 / 0 |
| 38 | `latsol-nguyen-08` | `cohort_2_unaudited_19_paket` | `batch-05` | 39 | 25 | **0 / 0** | 75.28% -> **78.51%** | 0 / 0 |
| 39 | `latsol-nguyen-09` | `cohort_2_unaudited_19_paket` | `batch-04` | 40 | 38 | **0 / 0** | 70.15% -> **74.34%** | 0 / 0 |
| 40 | `latsol-nguyen-10` | `cohort_2_unaudited_19_paket` | `batch-04` | 41 | 33 | **0 / 0** | 71.48% -> **75.19%** | 0 / 0 |
| 41 | `latsol-reguler-01` | `cohort_2_unaudited_19_paket` | `batch-02` | 20 | 73 | **0 / 0** | 55.06% -> **79.26%** | 0 / 0 |
| 42 | `latsol-reguler-02` | `cohort_2_unaudited_19_paket` | `batch-03` | 20 | 54 | **0 / 0** | 56.05% -> **72.93%** | 0 / 0 |
| 43 | `latsol-reguler-03` | `cohort_2_unaudited_19_paket` | `batch-02` | 20 | 55 | **0 / 0** | 54.86% -> **74.21%** | 0 / 0 |
| 44 | `latsol-reguler-04` | `cohort_2_unaudited_19_paket` | `batch-02` | 20 | 56 | **0 / 0** | 61.56% -> **69.12%** | 0 / 7 |
| 45 | `latsol-reguler-05` | `cohort_2_unaudited_19_paket` | `batch-01` | 20 | 77 | **0 / 0** | 59.93% -> **75.18%** | 0 / 4 |
| 46 | `latsol-reguler-06` | `cohort_2_unaudited_19_paket` | `batch-02` | 20 | 65 | **0 / 0** | 57.51% -> **78.35%** | 0 / 0 |
| 47 | `latsol-tambahan-01` | `cohort_2_unaudited_19_paket` | `batch-05` | 25 | 17 | **0 / 0** | 61.91% -> **66.72%** | 0 / 0 |
| 48 | `latsol-tambahan-02` | `cohort_2_unaudited_19_paket` | `batch-01` | 30 | 224 | **0 / 0** | 47.55% -> **69.93%** | 0 / 0 |
| 49 | `latsol-hitungan-01` | `cohort_2_unaudited_19_paket` | `batch-05` | 11 | 11 | **0 / 0** | 65.63% -> **67.89%** | 0 / 0 |
| 50 | `pilot-otaff51-01` | `cohort_4_pilot_otaff51` | `batch-02` | 5 | 72 | **0 / 0** | 63.64% -> **76.71%** | 0 / 0 |

## 4. Modified Files & Unresolved Findings Transparency

- **Modified Data Files**: 7 files (`data/kotoba-dan-kategori-tambahan.json`, `data/kotobaMapping.json`, `data/pilot-otaff51-01.json`, `data/sharedKotobaDictionary.json`, `data/ssw-pm-kunci-ujian-14.json`, `data/ssw-pm-kunci-ujian-15.json`, `data/ssw-pm-kunci-ujian-16.json`). Zero question prompts, options, translations, answer keys, points, or images were altered anywhere across all 60 packages.
- **Remaining Empty Options (18)**: Documented in `deliverables/kotoba-audit-40/unresolved-findings.json`. Every single one is non-Japanese text (`20`, `120`, `180`, `1`, `2`, `3`, `1, 2, 3`, English HACCP acronyms, or `[Terpotong pada batas kanvas PDF 14400 pt]`). Zero Japanese words, counters, or measurement units remain empty.
