# DESIGN.md — SSW PM Mock Test by Faiz

## 1. Product Identity & Design Read

- **Product**: SSW PM Mock Test by Faiz (`特定技能1号・飲食料品製造業` — Food & Beverage Manufacturing CBT Examination Simulator)
- **Subjects Covered**: `食品衛生` (Food Hygiene), `食品安全` (Food Safety), `HACCP`, Manufacturing Procedures (`製造工程管理`), and `労働安全衛生` (Workplace Safety)
- **Design System**: **ZEN WHITE DIGITAL LIBRARY** (Japanese editorial minimalism, generous whitespace, hairline rule dividers, typography-first hierarchy, zero redundancy across all application pages, with a single atmospheric Zen warrior canvas on non-CBT pages)
- **Design Read**: Reading this as a Zen-minimalist digital examination library and CBT simulator for SSW Food & Beverage Manufacturing candidates, in a Japanese editorial Zen White visual language, dial **ENERGY 1 / RHYTHM 1 / MOTION 1**.

### Anti-Slop Dials

| Dial | Value | Specification |
|---|---|---|
| **ENERGY** | `1 / 3` | Calm, silent examination portal across all pages. Zero SaaS cards, zero decorative gradients, zero status pills, zero decorative icons. |
| **RHYTHM** | `1 / 3` | Single-column editorial vertical flow separated by crisp `1px` hairlines and generous whitespace (`40px–44px` vertical cadence). |
| **MOTION** | `1 / 3` | Instant, functional hover and `:focus-visible` states (`0.1s–0.12s`). Zero entrance, floating, or decorative animations. |

---

## 2. Strict Architectural Boundary & 3-File CSS Separation

This repository enforces an absolute boundary between the frozen active CBT exam screen and the redesigned non-CBT application pages, split cleanly by responsibility across three stylesheets:

### Zone A: Protected Active CBT Examination Screen (COMPLETELY FROZEN)
The active CBT examination simulation screen matches the official Prometric/JPF testing interface and is **frozen legacy code**.
- **Protected JS**: `renderExam()`, `renderExamSettingsPopover()`, `applyExamPrefs()`, `syncExamViewportHeight()`, `startExamTicker()`, `finishExam()`.
- **Protected Stylesheets (READ-ONLY)**: `styles.css`, `QUESTION-EDITOR-UPDATES.css`, `RICH-HTML-STYLES.css`, `CSV-IMPORT-STYLES.css`.
- **Protected DOM & CSS Selectors**: `body.exam-mode`, `.exam-shell`, `.exam-header`, `.exam-meta-strip`, `.exam-main`, `.exam-progress-rail`, `.exam-question-map`, `.question-map-grid`, `.question-map-item`, `.exam-workspace`, `.question-card`, `.question-instruction`, `.question-prompt`, `.question-image-frame`, `.answer-list`, `.answer-choice`, `.exam-bottom`, `.exam-bottom-tools`, `.exam-nav-buttons`, `.exam-settings-popover`.
- **CBT Kill-Switch**: `body.exam-mode::before, body.exam-mode::after { content: none !important; display: none !important; background: none !important; }` guarantees zero background or overlay leakage during `exam-mode`.

### Zone B: 3-Stylesheet Non-CBT Design Architecture
1. **[`ZEN-APP-SHELL.css`](file:///c:/Users/Admin/Documents/GitHub/MOCK-TEST-SSW-PM-BY-FAIZ/ZEN-APP-SHELL.css)**:
   - Global atmospheric background (`body:not(.exam-mode)::before` using `assets/zen-warrior-bg.png`, `1024x576`, web-optimized `390 KB` PNG) and single soft mist overlay (`body:not(.exam-mode)::after`).
   - Responsive focal point calibration:
     - Desktop (`> 900px`): `background-position: 32% 66%` (frames temple eaves & sakura at upper-left, meditating Zen warrior on cliff at lower-left, and Mt. Fuji at center-right).
     - Tablet (`<= 900px`): `background-position: 29% 68%`.
     - Mobile (`<= 640px`): `background-position: 27% 72%` (keeps the meditating Zen warrior on the cliff at `x ≈ 27%` visible in portrait mobile viewports).
   - Transparent `.app-shell`, `.main-area`, and `.page-content` (no giant white wrapper box).
   - Minimalist `188px` sidebar, topbar, language selector, focus ring, and shared button tokens.
2. **[`HOME-DASHBOARD.css`](file:///c:/Users/Admin/Documents/GitHub/MOCK-TEST-SSW-PM-BY-FAIZ/HOME-DASHBOARD.css)**:
   - Scoped strictly to `.home-dashboard` (Homepage only): conditional active-session resume banner, editorial hero directly on the atmospheric canvas, categorized `Paket Soal` ledger (`Semua 23`, `Kunci Ujian 13`, `Bonus 10`), and recent `Riwayat Hasil` table.
3. **[`ZEN-PAGES.css`](file:///c:/Users/Admin/Documents/GitHub/MOCK-TEST-SSW-PM-BY-FAIZ/ZEN-PAGES.css)**:
   - Scoped strictly to `.zen-page` (`.zen-setup-page`, `.zen-bank-page`, `.zen-history-page`, `.zen-result-page`, `.zen-backup-page`) and `body:not(.exam-mode)` modals/toasts.
   - Applies clean white reading surfaces (`rgba(255, 255, 255, 0.86)` to `#ffffff`) exclusively to elements requiring reading contrast (tables, forms, question/review lists, and modal dialogs).

---

## 3. Color Palette & Contrast Verification (WCAG AA)

| Token | Value | Role | Contrast vs Reading Surface |
|---|---|---|---|
| `--zen-bg` | `#faf9f5` | Atmospheric mist base tone | — |
| `--zen-surface` | `rgba(255, 255, 255, 0.86)` | Reading surface for tables, forms, question lists, and ledgers | — |
| `--zen-ink` | `#171717` | Primary charcoal typography & section hairlines | `>= 15.8 : 1` (AAA) |
| `--zen-muted` | `#4a4a45` | Secondary metadata, units, and timestamps | `>= 7.4 : 1` (AAA) |
| `--zen-accent` | `#4a6720` | Muted olive/sage primary action & correct key indicator | `6.3 : 1` (AA) |
| `--zen-danger` | `#9e2a2b` | Restrained crimson for destructive actions & wrong answers | `7.2 : 1` (AAA) |
| `--zen-line` | `#dfdfd9` | Soft hairline row separator | — |

---

## 4. Typography & Written Decision Rationale (`R-31`)

- **Font Stack**: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', 'Yu Gothic UI', 'Meiryo', sans-serif` with `font-variant-numeric: tabular-nums` on all numeric columns.
- **One-Line Decision Rationale (`R-31`)**:
  - **Atmospheric Background Without Giant Panel (`ZEN-APP-SHELL.css`)**: Uses a single fixed `assets/zen-warrior-bg.png` layer (`z-index: -2`) and soft mist overlay (`z-index: -1`) while keeping `.app-shell`, `.main-area`, and `.page-content` transparent so the Zen warrior atmosphere breathes naturally around readable table/form surfaces.
  - **Responsive Off-Center Focal Point (`32% 66%` → `27% 72%`)**: Anchors `background-position` to the meditating Zen warrior on the lower-left cliff (`x ≈ 27%`) rather than blind `center` alignment so the warrior remains visible on mobile portrait viewports (`390×844`).
  - **3-File CSS Responsibility Split (`ZEN-APP-SHELL.css`, `HOME-DASHBOARD.css`, `ZEN-PAGES.css`)**: Separates global shell/atmosphere, homepage-only layout, and secondary pages/modals while keeping all legacy CBT stylesheets 100% read-only.
  - **Minimalist Monogram Favicon (`icon.svg`)**: Replaces meme/legacy illustrations with a clean single-character `F` monogram on `#171717` with a `#4a6720` accent square and zero long title text.
