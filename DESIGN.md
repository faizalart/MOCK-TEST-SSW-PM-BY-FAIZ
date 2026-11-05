# DESIGN.md — SSW PM Mock Test by Faiz

## 1. Product Identity & Design Read

- **Product**: SSW PM Mock Test by Faiz (`特定技能1号・飲食料品製造業` — Food & Beverage Manufacturing CBT Examination Simulator)
- **Subjects Covered**: `食品衛生` (Food Hygiene), `食品安全` (Food Safety), `HACCP`, Manufacturing Procedures (`製造工程管理`), and `労働安全衛生` (Workplace Safety)
- **Design Philosophy**: **Extreme Minimalism / Zen White** (Japanese editorial minimalism, generous whitespace, hairline rule dividers, typography-first hierarchy, zero redundancy)
- **Design Read**: Reading this as a Zen-minimalist digital examination library and CBT simulator for SSW Food & Beverage Manufacturing candidates, in a Japanese editorial Zen White visual language, dial **ENERGY 1 / RHYTHM 1 / MOTION 1**.

### Anti-Slop Dials

| Dial | Value | Specification |
|---|---|---|
| **ENERGY** | `1 / 3` | Calm, silent, paper-white examination portal. Zero cards, zero gradients, zero badges, zero decorative icons. |
| **RHYTHM** | `1 / 3` | Single-column editorial vertical flow separated by crisp `1px` hairlines and generous whitespace (`48px` vertical cadence). |
| **MOTION** | `1 / 3` | Instant, functional hover and `:focus-visible` states (`0.1s–0.12s`). Zero entrance, floating, or decorative animations. |

---

## 2. Strict Architectural Boundary: Homepage vs. Frozen CBT Exam Screen

This repository enforces an absolute boundary between two visual zones:

### Zone A: Protected Active CBT Examination Screen (COMPLETELY FROZEN)
The active CBT examination simulation screen matches the official Prometric/JPF testing interface and is **frozen legacy code**.
- **Protected JS**: `renderExam()`, `renderExamSettingsPopover()`, `applyExamPrefs()`, `syncExamViewportHeight()`, `startExamTicker()`, `finishExam()`.
- **Protected DOM & CSS Selectors**: `body.exam-mode`, `.exam-shell`, `.exam-header`, `.exam-meta-strip`, `.exam-main`, `.exam-progress-rail`, `.exam-question-map`, `.question-map-grid`, `.question-map-item`, `.exam-workspace`, `.question-card`, `.question-instruction`, `.question-prompt`, `.question-image-frame`, `.answer-list`, `.answer-choice`, `.exam-bottom`, `.exam-bottom-tools`, `.exam-nav-buttons`, `.exam-settings-popover`.
- **Rule**: Never modify `renderExam()` or any CSS rule in `styles.css` / `QUESTION-EDITOR-UPDATES.css` that applies to `body.exam-mode` or `.exam-shell`.

### Zone B: Homepage Dashboard (`.home-dashboard` in `HOME-DASHBOARD.css`)
- **Scoped Stylesheet**: [`HOME-DASHBOARD.css`](file:///c:/Users/Admin/Documents/GitHub/MOCK-TEST-SSW-PM-BY-FAIZ/HOME-DASHBOARD.css)
- **Scoped Root Selectors**: `.home-dashboard` and `body:has(.home-dashboard)`. When the user enters the CBT exam (`renderExam()`), `.home-dashboard` is unmounted from `#view`, so zero rules in `HOME-DASHBOARD.css` match during an exam.

---

## 3. Color Palette & Contrast Verification (WCAG AA)

| Token | Hex | Role | Contrast vs `#ffffff` |
|---|---|---|---|
| `--zen-bg` | `#ffffff` | Primary page, sidebar, and topbar surface | — |
| `--zen-subtle` | `#f7f7f5` | Subtle hover tint & active tab fill | — |
| `--zen-ink` | `#171717` | Primary charcoal typography & section hairlines | `17.9 : 1` (AAA) |
| `--zen-muted` | `#5c5c57` | Secondary metadata, units, and timestamps | `6.7 : 1` (AA) |
| `--zen-accent` | `#4a6720` | Muted olive/sage primary action (`Mulai Mock Test`) | `6.3 : 1` (AA) |
| `--zen-line` | `#e8e8e4` | Soft hairline row separator | — |

---

## 4. Typography & Written Decision Rationale (`R-31`)

- **Font Stack**: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', 'Yu Gothic UI', 'Meiryo', sans-serif` with `font-variant-numeric: tabular-nums` on all numeric columns.
- **One-Line Decision Rationale (`R-31`)**:
  - **Zen White Sidebar & Topbar (`body:has(.home-dashboard)`)**: Replaces the heavy dark `#17191a` sidebar and hides redundant brand/category/disclaimer text so the homepage reads as a calm, unified sheet of paper.
  - **Single-Column Editorial Hierarchy**: Replaces the 2-column SaaS card grid and 4-box stat strip with a focused `960px` editorial flow (`Hero` → `Paket Soal` → `Riwayat Hasil` → `Utilitas`).
  - **One Information, One Occurrence**: Displays `特定技能1号・飲食料品製造業` once in the editorial kicker, `Standar CBT · 40 soal · 70 menit · 150 poin` once in the spec line, and `914 soal` once beside the `Paket Soal` heading.
  - **Favicon Vector Monogram (`icon.svg`)**: Uses the clean vector monogram `icon.svg` instead of a raster image containing full multi-word text.
