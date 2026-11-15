# Non-OTAFF Kotoba Audit & Repair (50 Packages) — Phase 0 & Phase 1 Baseline Report

- **Generated At**: `2026-11-15T15:53:44.940Z`
- **Branch**: `fix/kotoba-audit-40` (`main` untouched at `09f24e3`)
- **Selection Status**: `CONFIRMED_ALL_50_NON_OTAFF_BY_USER` (zero production files modified)
- **Backups**: `deliverables/kotoba-audit-40/backups/baseline-20261115/data/` (43 JSON files)
- **Immutable Snapshot**: `deliverables/kotoba-audit-40/baseline-immutable-snapshot.json` (60 packages, 2139 questions, 6583 options)

## 1. Master Sidecars & Dictionary Baseline

| Artifact | Path | Entries / Scope | Version | SHA-256 (first 16) |
| --- | --- | ---: | --- | --- |
| Shared Dictionary | `data/sharedKotobaDictionary.json` | 6359 terms (6315 verified, 44 unresolved) | schema 2.0.0, data 20261113-v2 | `c3e279a0d839e8f0` |
| Kotoba Mapping | `data/kotobaMapping.json` | 2139 questions, 6583 composite keys | schema 2.0.0, data 20261113-v2 | `c26d9e919f1162a7` |
| Supplementary Kotoba | `data/kotoba-dan-kategori-tambahan.json` | 1133 question entries | — | `83846c5124e18e69` |

## 2. Cohort Summary Across All 60 Discovered Packages

| Cohort | Packages | Questions | Options | Contexts | Avg Spec-009 Span % | Total v2 Completeness Errors | Status / Evidence |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Cohort 5: Protected OTAFF PM 5.1 | 10 | 400 | 1200 | 1600 | 79.36% | 0 | Protected reference (Nov 15) |
| Cohort 1: Canonical Spec-009 | 27 | 1006 | 3110 | 4116 | 100% | 133 | Oldest; 100% Spec 009 audited (0-13 minor v2 flags) |
| Cohort 2: 19-Paket Latsol | 19 | 581 | 1811 | 2392 | 65.61% | 1010 | Un-audited in Spec 009 (Nov 14 working tree) |
| Cohort 3: Soal Ujian 14-16 | 3 | 147 | 442 | 589 | 30.17% | 1930 | Most incomplete (26-36% span, 18 s009 errs) |
| Cohort 4: Pilot OTAFF 5.1 | 1 | 5 | 20 | 25 | 63.64% | 72 | Unrepaired Nov 15 pilot |

## 3. Confirmed 50-Target Execution Batches

| Batch | Package IDs | Qs | Opts | Baseline v2 Errors |
| --- | --- | ---: | ---: | ---: |
| `batch-01` | `ssw-pm-kunci-ujian-16`, `ssw-pm-kunci-ujian-14`, `ssw-pm-kunci-ujian-15`, `latsol-tambahan-02`, `latsol-reguler-05` | 197 | 623 | 2231 |
| `batch-02` | `latsol-reguler-01`, `pilot-otaff51-01`, `latsol-reguler-06`, `latsol-reguler-04`, `latsol-reguler-03` | 85 | 286 | 321 |
| `batch-03` | `latsol-reguler-02`, `latsol-nguyen-04`, `latsol-nguyen-06`, `latsol-nguyen-07`, `latsol-nguyen-05` | 175 | 525 | 235 |
| `batch-04` | `latsol-nguyen-03`, `latsol-nguyen-09`, `latsol-nguyen-02`, `latsol-nguyen-10`, `latsol-nguyen-01` | 201 | 603 | 172 |
| `batch-05` | `latsol-nguyen-08`, `latsol-tambahan-01`, `latsol-hitungan-01`, `ssw-pm-lab-bakteri`, `bonus-soal-1` | 147 | 484 | 77 |
| `batch-06` | `bonus-soal-8`, `bonus-soal-10`, `bonus-soal-5`, `bonus-soal-6`, `ssw-pm-kunci-ujian-11` | 195 | 585 | 45 |
| `batch-07` | `ssw-pm-lab-alergen`, `bonus-soal-7`, `ssw-pm-kunci-ujian-7`, `ssw-pm-kunci-ujian-1`, `bonus-soal-4` | 179 | 557 | 33 |
| `batch-08` | `bonus-soal-2`, `ssw-pm-kunci-ujian-12`, `ssw-pm-kunci-ujian-3`, `ssw-pm-tipe2-nguyen1`, `ssw-pm-kunci-ujian-13` | 200 | 600 | 19 |
| `batch-09` | `ssw-pm-kunci-ujian-5`, `bonus-soal-9`, `ssw-pm-kunci-ujian-2`, `ssw-pm-kunci-ujian-8`, `ssw-pm-lab-haccp` | 172 | 528 | 11 |
| `batch-10` | `ssw-pm-kunci-ujian-4`, `ssw-pm-kunci-ujian-10`, `ssw-pm-kunci-ujian-6`, `ssw-pm-kunci-ujian-9`, `ssw-pm-lab-suhu` | 188 | 592 | 1 |

## 4. Full 60-Package Baseline Metrics

| # | Set ID | Cohort | Role | Batch | Qs | Opts | Spec-009 Audited | Spec-009 Span % | Unresolved Spans | s009 File Err | v2 Errors | inline `kotobaU` |
| ---: | --- | --- | --- | --- | ---: | ---: | :---: | ---: | ---: | ---: | ---: | ---: |
| 1 | `ssw-pm-kunci-ujian-1` | `cohort_1_spec009_canonical` | `target_repair_50` | `batch-07` | 40 | 120 | YES | 100% | 0 | 0 | 6 | 0/40 |
| 2 | `ssw-pm-kunci-ujian-2` | `cohort_1_spec009_canonical` | `target_repair_50` | `batch-09` | 40 | 120 | YES | 100% | 0 | 0 | 2 | 0/40 |
| 3 | `ssw-pm-kunci-ujian-3` | `cohort_1_spec009_canonical` | `target_repair_50` | `batch-08` | 40 | 120 | YES | 100% | 0 | 0 | 4 | 0/40 |
| 4 | `ssw-pm-kunci-ujian-4` | `cohort_1_spec009_canonical` | `target_repair_50` | `batch-10` | 40 | 120 | YES | 100% | 0 | 0 | 1 | 0/40 |
| 5 | `ssw-pm-kunci-ujian-5` | `cohort_1_spec009_canonical` | `target_repair_50` | `batch-09` | 40 | 120 | YES | 100% | 0 | 0 | 3 | 0/40 |
| 6 | `ssw-pm-kunci-ujian-6` | `cohort_1_spec009_canonical` | `target_repair_50` | `batch-10` | 40 | 120 | YES | 100% | 0 | 0 | 0 | 0/40 |
| 7 | `ssw-pm-kunci-ujian-7` | `cohort_1_spec009_canonical` | `target_repair_50` | `batch-07` | 40 | 120 | YES | 100% | 0 | 0 | 7 | 0/40 |
| 8 | `ssw-pm-kunci-ujian-8` | `cohort_1_spec009_canonical` | `target_repair_50` | `batch-09` | 40 | 120 | YES | 100% | 0 | 0 | 2 | 0/40 |
| 9 | `ssw-pm-kunci-ujian-9` | `cohort_1_spec009_canonical` | `target_repair_50` | `batch-10` | 40 | 120 | YES | 100% | 0 | 0 | 0 | 0/40 |
| 10 | `ssw-pm-kunci-ujian-10` | `cohort_1_spec009_canonical` | `target_repair_50` | `batch-10` | 40 | 120 | YES | 100% | 0 | 0 | 0 | 0/40 |
| 11 | `ssw-pm-kunci-ujian-11` | `cohort_1_spec009_canonical` | `target_repair_50` | `batch-06` | 40 | 120 | YES | 100% | 0 | 0 | 8 | 0/40 |
| 12 | `ssw-pm-kunci-ujian-12` | `cohort_1_spec009_canonical` | `target_repair_50` | `batch-08` | 40 | 120 | YES | 100% | 0 | 0 | 4 | 0/40 |
| 13 | `ssw-pm-kunci-ujian-13` | `cohort_1_spec009_canonical` | `target_repair_50` | `batch-08` | 40 | 120 | YES | 100% | 0 | 0 | 3 | 0/40 |
| 14 | `ssw-pm-kunci-ujian-14` | `cohort_3_unaudited_ujian_14_16` | `target_repair_50` | `batch-01` | 59 | 177 | NO | 36.22% | 515 | 13 | 684 | 59/59 |
| 15 | `ssw-pm-kunci-ujian-15` | `cohort_3_unaudited_ujian_14_16` | `target_repair_50` | `batch-01` | 38 | 114 | NO | 27.95% | 342 | 2 | 527 | 38/38 |
| 16 | `ssw-pm-kunci-ujian-16` | `cohort_3_unaudited_ujian_14_16` | `target_repair_50` | `batch-01` | 50 | 151 | NO | 26.34% | 449 | 3 | 719 | 50/50 |
| 17 | `ssw-pm-tipe2-nguyen1` | `cohort_1_spec009_canonical` | `target_repair_50` | `batch-08` | 40 | 120 | YES | 100% | 0 | 0 | 4 | 0/40 |
| 18 | `bonus-soal-1` | `cohort_1_spec009_canonical` | `target_repair_50` | `batch-05` | 40 | 120 | YES | 100% | 0 | 0 | 11 | 0/40 |
| 19 | `bonus-soal-2` | `cohort_1_spec009_canonical` | `target_repair_50` | `batch-08` | 40 | 120 | YES | 100% | 0 | 0 | 4 | 0/40 |
| 20 | `bonus-soal-4` | `cohort_1_spec009_canonical` | `target_repair_50` | `batch-07` | 40 | 120 | YES | 100% | 0 | 0 | 5 | 0/40 |
| 21 | `bonus-soal-5` | `cohort_1_spec009_canonical` | `target_repair_50` | `batch-06` | 36 | 108 | YES | 100% | 0 | 0 | 9 | 0/36 |
| 22 | `bonus-soal-6` | `cohort_1_spec009_canonical` | `target_repair_50` | `batch-06` | 40 | 120 | YES | 100% | 0 | 0 | 8 | 0/40 |
| 23 | `bonus-soal-7` | `cohort_1_spec009_canonical` | `target_repair_50` | `batch-07` | 39 | 117 | YES | 100% | 0 | 0 | 7 | 0/39 |
| 24 | `bonus-soal-8` | `cohort_1_spec009_canonical` | `target_repair_50` | `batch-06` | 39 | 117 | YES | 100% | 0 | 0 | 11 | 0/39 |
| 25 | `bonus-soal-9` | `cohort_1_spec009_canonical` | `target_repair_50` | `batch-09` | 40 | 120 | YES | 100% | 0 | 0 | 2 | 0/40 |
| 26 | `bonus-soal-10` | `cohort_1_spec009_canonical` | `target_repair_50` | `batch-06` | 40 | 120 | YES | 100% | 0 | 0 | 9 | 0/40 |
| 27 | `ssw-pm-lab-bakteri` | `cohort_1_spec009_canonical` | `target_repair_50` | `batch-05` | 32 | 128 | YES | 100% | 0 | 0 | 13 | 0/32 |
| 28 | `ssw-pm-lab-suhu` | `cohort_1_spec009_canonical` | `target_repair_50` | `batch-10` | 28 | 112 | YES | 100% | 0 | 0 | 0 | 0/28 |
| 29 | `ssw-pm-lab-haccp` | `cohort_1_spec009_canonical` | `target_repair_50` | `batch-09` | 12 | 48 | YES | 100% | 0 | 0 | 2 | 0/12 |
| 30 | `ssw-pm-lab-alergen` | `cohort_1_spec009_canonical` | `target_repair_50` | `batch-07` | 20 | 80 | YES | 100% | 0 | 0 | 8 | 0/20 |
| 31 | `latsol-nguyen-01` | `cohort_2_unaudited_19_paket` | `target_repair_50` | `batch-04` | 40 | 120 | NO | 76.13% | 452 | 0 | 26 | 0/40 |
| 32 | `latsol-nguyen-02` | `cohort_2_unaudited_19_paket` | `target_repair_50` | `batch-04` | 40 | 120 | NO | 73.8% | 405 | 0 | 36 | 0/40 |
| 33 | `latsol-nguyen-03` | `cohort_2_unaudited_19_paket` | `target_repair_50` | `batch-04` | 40 | 120 | NO | 70.47% | 479 | 0 | 39 | 0/40 |
| 34 | `latsol-nguyen-04` | `cohort_2_unaudited_19_paket` | `target_repair_50` | `batch-03` | 40 | 120 | NO | 71.27% | 473 | 0 | 49 | 0/40 |
| 35 | `latsol-nguyen-05` | `cohort_2_unaudited_19_paket` | `target_repair_50` | `batch-03` | 36 | 108 | NO | 71.12% | 493 | 0 | 41 | 0/36 |
| 36 | `latsol-nguyen-06` | `cohort_2_unaudited_19_paket` | `target_repair_50` | `batch-03` | 40 | 120 | NO | 71.24% | 428 | 0 | 48 | 0/40 |
| 37 | `latsol-nguyen-07` | `cohort_2_unaudited_19_paket` | `target_repair_50` | `batch-03` | 39 | 117 | NO | 75.53% | 442 | 0 | 43 | 0/39 |
| 38 | `latsol-nguyen-08` | `cohort_2_unaudited_19_paket` | `target_repair_50` | `batch-05` | 39 | 117 | NO | 75.28% | 410 | 0 | 25 | 0/39 |
| 39 | `latsol-nguyen-09` | `cohort_2_unaudited_19_paket` | `target_repair_50` | `batch-04` | 40 | 120 | NO | 70.15% | 493 | 0 | 38 | 0/40 |
| 40 | `latsol-nguyen-10` | `cohort_2_unaudited_19_paket` | `target_repair_50` | `batch-04` | 41 | 123 | NO | 71.48% | 482 | 0 | 33 | 0/41 |
| 41 | `latsol-reguler-01` | `cohort_2_unaudited_19_paket` | `target_repair_50` | `batch-02` | 20 | 65 | NO | 55.06% | 145 | 0 | 73 | 0/20 |
| 42 | `latsol-reguler-02` | `cohort_2_unaudited_19_paket` | `target_repair_50` | `batch-03` | 20 | 60 | NO | 56.05% | 186 | 0 | 54 | 0/20 |
| 43 | `latsol-reguler-03` | `cohort_2_unaudited_19_paket` | `target_repair_50` | `batch-02` | 20 | 60 | NO | 54.86% | 179 | 0 | 55 | 0/20 |
| 44 | `latsol-reguler-04` | `cohort_2_unaudited_19_paket` | `target_repair_50` | `batch-02` | 20 | 80 | NO | 61.56% | 246 | 0 | 56 | 0/20 |
| 45 | `latsol-reguler-05` | `cohort_2_unaudited_19_paket` | `target_repair_50` | `batch-01` | 20 | 61 | NO | 59.93% | 237 | 0 | 77 | 0/20 |
| 46 | `latsol-reguler-06` | `cohort_2_unaudited_19_paket` | `target_repair_50` | `batch-02` | 20 | 61 | NO | 57.51% | 189 | 0 | 65 | 0/20 |
| 47 | `latsol-tambahan-01` | `cohort_2_unaudited_19_paket` | `target_repair_50` | `batch-05` | 25 | 86 | NO | 61.91% | 327 | 0 | 17 | 0/25 |
| 48 | `latsol-tambahan-02` | `cohort_2_unaudited_19_paket` | `target_repair_50` | `batch-01` | 30 | 120 | NO | 47.55% | 356 | 0 | 224 | 0/30 |
| 49 | `latsol-hitungan-01` | `cohort_2_unaudited_19_paket` | `target_repair_50` | `batch-05` | 11 | 33 | NO | 65.63% | 199 | 0 | 11 | 0/11 |
| 50 | `pilot-otaff51-01` | `cohort_4_pilot_otaff51` | `target_repair_50` | `batch-02` | 5 | 20 | NO | 63.64% | 129 | 0 | 72 | 5/5 |
| 51 | `latsol-otaff-pm51-01` | `cohort_5_protected_otaff_pm51` | `protected_reference` | — | 40 | 120 | NO | 79.89% | 681 | 0 | 0 | 40/40 |
| 52 | `latsol-otaff-pm51-02` | `cohort_5_protected_otaff_pm51` | `protected_reference` | — | 40 | 120 | NO | 79.92% | 730 | 0 | 0 | 40/40 |
| 53 | `latsol-otaff-pm51-03` | `cohort_5_protected_otaff_pm51` | `protected_reference` | — | 40 | 120 | NO | 78.56% | 817 | 0 | 0 | 40/40 |
| 54 | `latsol-otaff-pm51-04` | `cohort_5_protected_otaff_pm51` | `protected_reference` | — | 40 | 120 | NO | 78.32% | 902 | 0 | 0 | 40/40 |
| 55 | `latsol-otaff-pm51-05` | `cohort_5_protected_otaff_pm51` | `protected_reference` | — | 40 | 120 | NO | 77.26% | 802 | 0 | 0 | 40/40 |
| 56 | `latsol-otaff-pm51-06` | `cohort_5_protected_otaff_pm51` | `protected_reference` | — | 40 | 120 | NO | 80.08% | 776 | 0 | 0 | 40/40 |
| 57 | `latsol-otaff-pm51-07` | `cohort_5_protected_otaff_pm51` | `protected_reference` | — | 40 | 120 | NO | 78.17% | 825 | 0 | 0 | 40/40 |
| 58 | `latsol-otaff-pm51-08` | `cohort_5_protected_otaff_pm51` | `protected_reference` | — | 40 | 120 | NO | 80.13% | 834 | 0 | 0 | 40/40 |
| 59 | `latsol-otaff-pm51-09` | `cohort_5_protected_otaff_pm51` | `protected_reference` | — | 40 | 120 | NO | 82.11% | 758 | 0 | 0 | 40/40 |
| 60 | `latsol-otaff-pm51-10` | `cohort_5_protected_otaff_pm51` | `protected_reference` | — | 40 | 120 | NO | 79.14% | 909 | 0 | 0 | 40/40 |
