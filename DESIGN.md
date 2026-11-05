# DESIGN.md — SSW PM Mock Test by Faiz

## 1. Product Identity & Design Read

- **Product**: SSW PM Mock Test by Faiz (`特定技能1号・飲食料品製造業` — Food & Beverage Manufacturing CBT Examination Simulator)
- **Subjects Covered**: `食品衛生` (Food Hygiene), `食品安全` (Food Safety), `HACCP`, Manufacturing Procedures (`製造工程管理`), and `労働安全衛生` (Workplace Safety)
- **Design System**: **ZEN WHITE DIGITAL LIBRARY** (Japanese editorial minimalism, generous whitespace, hairline rule dividers, typography-first hierarchy, zero redundancy across all application pages)
- **Design Read**: Reading this as a Zen-minimalist digital examination library and CBT simulator for SSW Food & Beverage Manufacturing candidates, in a Japanese editorial Zen White visual language, dial **ENERGY 1 / RHYTHM 1 / MOTION 1**.

### Anti-Slop Dials

| Dial | Value | Specification |
|---|---|---|
| **ENERGY** | `1 / 3` | Calm, silent, paper-white examination portal across all pages. Zero cards, zero gradients, zero status pills, zero decorative icons. |
| **RHYTHM** | `1 / 3` | Single-column editorial vertical flow separated by crisp `1px` hairlines and generous whitespace (`44px–48px` vertical cadence). |
| **MOTION** | `1 / 3` | Instant, functional hover and `:focus-visible` states (`0.1s–0.12s`). Zero entrance, floating, or decorative animations. |

---

## 2. Strict Architectural Boundary: Application Pages vs. Frozen CBT Exam Screen

This repository enforces an absolute boundary between two visual zones:

### Zone A: Protected Active CBT Examination Screen (COMPLETELY FROZEN)
The active CBT examination simulation screen matches the official Prometric/JPF testing interface and is **frozen legacy code**.
- **Protected JS**: `renderExam()`, `renderExamSettingsPopover()`, `applyExamPrefs()`, `syncExamViewportHeight()`, `startExamTicker()`, `finishExam()`.
- **Protected DOM & CSS Selectors**: `body.exam-mode`, `.exam-shell`, `.exam-header`, `.exam-meta-strip`, `.exam-main`, `.exam-progress-rail`, `.exam-question-map`, `.question-map-grid`, `.question-map-item`, `.exam-workspace`, `.question-card`, `.question-instruction`, `.question-prompt`, `.question-image-frame`, `.answer-list`, `.answer-choice`, `.exam-bottom`, `.exam-bottom-tools`, `.exam-nav-buttons`, `.exam-settings-popover`.
- **Rule**: Never modify `renderExam()` or any CSS rule in `styles.css` / `QUESTION-EDITOR-UPDATES.css` that applies to `body.exam-mode` or `.exam-shell`.

### Zone B: Full Application Shell & Pages (`body:not(.exam-mode)`, `.home-dashboard`, `.zen-page`)
- **Scoped Stylesheet**: [`HOME-DASHBOARD.css`](file:///c:/Users/Admin/Documents/GitHub/MOCK-TEST-SSW-PM-BY-FAIZ/HOME-DASHBOARD.css)
- **Scoped Root Selectors**: `body:not(.exam-mode)`, `.home-dashboard`, and `.zen-page`. When the user enters the CBT exam (`renderExam()`), `body` receives `.exam-mode` and `.home-dashboard` / `.zen-page` are unmounted from `#view`, so zero rules in `HOME-DASHBOARD.css` match during an exam.
- **Covered Application Views**:
  1. **Global Shell (`body:not(.exam-mode)`)**: Slim `188px` white sidebar with single monogram `F`, concise 5-item navigation (`Beranda`, `Mock Test`, `Bank Soal`, `Riwayat`, `Backup`), quiet offline status indicator, and clean white topbar with flag-free language selector (`Bahasa Indonesia`, `English`, `日本語`).
  2. **Beranda (`renderHome()` / `.home-dashboard`)**: Conditional active-session resume bar, editorial hero with one-occurrence specification line (`Standar CBT · 40 soal · 70 menit · 150 poin`), categorized `Paket Soal` ledger (`Semua 23`, `Kunci Ujian 13`, `Bonus 10`), and recent `Riwayat Hasil`.
  3. **Konfigurasi Mock Test (`renderSetup()` / `.zen-setup-page`)**: Single-column editorial form (`680px` max-width) with live header specification (`40 / 40 soal · 70 menit · Maks 150 poin`), zero duplicate side summary card, zero redundant field sub-captions, and one primary CTA (`Mulai Ujian`).
  4. **Bank Soal & Daftar Pertanyaan (`renderBank()` / `.zen-bank-page`)**: Categorized package directory + readable editorial Japanese question list (`.zen-q-list` > `.zen-q-item`) displaying full Japanese prompts with furigana (`<ruby><rt>`) and `A / B / C` choices without table-cell truncation or repeated package names per row.
  5. **Riwayat Hasil (`renderHistory()` / `.zen-history-page`)**: Clean hairline evaluation table (`Tanggal`, `Paket`, `Mode`, `Benar`, `Poin`, `Akurasi`, `Durasi`, `Review`, `Hapus`) without colored status badges or mini progress bars.
  6. **Hasil & Review Jawaban (`renderResult()` / `.zen-result-page`)**: Horizontal 6-metric score ledger (`Skor Poin`, `Akurasi`, `Benar`, `Salah`, `Kosong`, `Durasi`) replacing the conic-gradient donut chart, followed by hairline Japanese question review items (`.zen-review-item`), while preserving `.print-report` for `@media print`.
  7. **Backup & Pengaturan (`renderBackup()` / `.zen-backup-page`)**: Two-column hairline Export/Restore section and compact `Preferensi Standar` form without giant decorative symbols (`⇧`, `⇩`, `＋`).
  8. **Modals, Question Editor & Toasts**: Clean `1px` hairline dialogs (`renderQuestionEditor()`, `renderCSVImportModal()`, `confirmModal()`) without redundant notices.

---

## 3. Color Palette & Contrast Verification (WCAG AA)

| Token | Hex | Role | Contrast vs `#ffffff` |
|---|---|---|---|
| `--zen-bg` | `#ffffff` | Primary page, sidebar, topbar, and modal surface | — |
| `--zen-subtle` | `#f7f7f5` | Subtle hover tint & active tab/key fill | — |
| `--zen-ink` | `#171717` | Primary charcoal typography & section hairlines | `17.9 : 1` (AAA) |
| `--zen-muted` | `#5c5c57` | Secondary metadata, units, and timestamps | `6.7 : 1` (AA) |
| `--zen-accent` | `#4a6720` | Muted olive/sage primary action & correct key indicator | `6.3 : 1` (AA) |
| `--zen-danger` | `#9e2a2b` | Restrained crimson for destructive actions & wrong answers | `7.2 : 1` (AAA) |
| `--zen-line` | `#e8e8e4` | Soft hairline row separator | — |

---

## 4. Typography & Written Decision Rationale (`R-31`)

- **Font Stack**: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', 'Yu Gothic UI', 'Meiryo', sans-serif` with `font-variant-numeric: tabular-nums` on all numeric columns.
- **One-Line Decision Rationale (`R-31`)**:
  - **Unified Non-CBT Shell (`body:not(.exam-mode)`)**: Applies the slim white sidebar (`188px`), single `F` monogram, and quiet white topbar across every application page while deactivating 100% when `body.exam-mode` is active.
  - **Single-Column Setup Form (`.zen-setup-page`)**: Removes the redundant right-hand summary card and field `<small>` explanations that repeated label text, presenting a calm `680px` editorial form with one primary `Mulai Ujian` button.
  - **Editorial Question List (`.zen-q-list` > `.zen-q-item`)**: Replaces the cramped 8-column question table with full-width hairline items so Japanese kanji, furigana (`<ruby><rt>`), and `A / B / C` options read comfortably without truncation.
  - **Horizontal 6-Metric Result Ledger (`.zen-result-ledger`)**: Replaces the decorative conic-gradient donut chart and triple-repeated accuracy percentage with a single scannable hairline ledger (`Skor Poin`, `Akurasi`, `Benar`, `Salah`, `Kosong`, `Durasi`).
