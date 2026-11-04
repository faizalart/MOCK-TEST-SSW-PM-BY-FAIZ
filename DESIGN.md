# DESIGN.md — SSW PM Mock Test by Faiz

## 1. Product Identity & Design Read

- **Product**: SSW PM Mock Test by Faiz (`特定技能1号・飲食料品製造業` — Food & Beverage Manufacturing CBT Examination Simulator)
- **Subjects Covered**: `食品衛生` (Food Hygiene), `食品安全` (Food Safety), `HACCP`, Manufacturing Procedures (`製造工程管理`), and `労働安全衛生` (Workplace Safety)
- **Design Read**: Reading this as a professional CBT examination portal for SSW Food & Beverage Manufacturing candidates, in a minimalist modern clean visual language, dial **ENERGY 1 / RHYTHM 2 / MOTION 1**.

### Anti-Slop Dials

| Dial | Value | Specification |
|---|---|---|
| **ENERGY** | `1 / 3` | Calm, quiet, authoritative examination environment. No promotional SaaS slogans, gradients, or floating ornaments. |
| **RHYTHM** | `2 / 3` | Structured asymmetry: compact command header with inline real metrics, 2-column workspace (tabbed package directory + study mode rail), and full-width history ledger. |
| **MOTION** | `1 / 3` | Instant, functional hover and `:focus-visible` states only. Zero decorative entrance or floating animations. |

---

## 2. Strict Architectural Boundary: Homepage vs. Frozen CBT Exam Screen

This repository enforces a strict separation between two distinct visual zones:

### Zone A: Protected Active CBT Examination Screen (COMPLETELY FROZEN)
The active CBT examination simulation screen matches the official Prometric/JPF testing interface and is **frozen legacy code**.
- **Protected JS**: `renderExam()`, `renderExamSettingsPopover()`, `applyExamPrefs()`, `syncExamViewportHeight()`, `startExamTicker()`, `finishExam()`.
- **Protected DOM & CSS Selectors**: `body.exam-mode`, `.exam-shell`, `.exam-header`, `.exam-meta-strip`, `.exam-main`, `.exam-progress-rail`, `.exam-question-map`, `.question-map-grid`, `.question-map-item`, `.exam-workspace`, `.question-card`, `.question-instruction`, `.question-prompt`, `.question-image-frame`, `.answer-list`, `.answer-choice`, `.exam-bottom`, `.exam-bottom-tools`, `.exam-nav-buttons`, `.exam-settings-popover`.
- **Rule**: No global CSS variable, shared button class (`.button`, `.button-primary`, `.button-outline`), or exam selector may be altered in a way that affects `body.exam-mode` or `.exam-shell`.

### Zone B: Homepage / Dashboard (`.home-dashboard` in `HOME-DASHBOARD.css`)
- **Scope**: Rendered exclusively by `renderHome()` inside `<div class="home-dashboard">...</div>` and styled exclusively in `HOME-DASHBOARD.css` with every selector prefixed by `.home-dashboard`.
- **Lifecycle**: When an examination starts, `renderExam()` replaces `#view` innerHTML with `.exam-shell`, removing `.home-dashboard` from the DOM so zero dashboard rules can apply during an exam.

---

## 3. Homepage Design System & Written Decision Log (R-31)

### Color Palette (Restrained & WCAG AA Verified)
- **Canvas (`#f4f6f8`) & Surface (`#ffffff`)**: Provides a clean, low-fatigue paper-like surface so Japanese kanji and Indonesian/English labels remain effortless to scan.
- **Subtle Surface (`#f8fafb`)**: Differentiates table headers, metric strips, and filter bars without heavy borders or drop shadows.
- **Primary Ink (`#18222c`)**: High-contrast charcoal navy (`15.8:1` on white) for primary titles and package names.
- **Secondary Ink (`#465462`)**: Neutral slate (`7.7:1` on white, passing WCAG AA 4.5:1) for descriptions and package metadata.
- **Muted Label Ink (`#556370`)**: Controlled slate (`6.1:1` on white, passing WCAG AA 4.5:1) replacing the previous low-contrast `#89939d` grey.
- **Deep Slate Navy (`#25364a`)**: Used for structural headers, package index badges on hover, and secondary structural accents.
- **Brand Olive Green (`#638c29`, hover `#4e731e`, soft tint `#f2f7eb`, border `#c5dca0`)**: Single deliberate primary action accent connecting the dashboard to the CBT exam skin.
- **Structural Hairlines (`#dfe5ec` / `#cbd3dc`)**: Crisp `1px` borders define layout rhythm without floating card shadows (`R-12`).

### Typography & Numeric Discipline
- **UI & Japanese Stack**: `var(--font)` (`Inter, system-ui, -apple-system, "Segoe UI", "Noto Sans JP", "Yu Gothic UI", "Meiryo", sans-serif`) for crisp Latin/Kanji legibility.
- **Tabular Numerals**: `font-variant-numeric: tabular-nums` applied to all question counts, package badges, scores, and percentages so columns align vertically.
- **Border Radius System (`R-11`)**: Standardized two-tier scale inside `.home-dashboard`: `8px` for primary containers/panels and `6px` for buttons, tabs, and package index badges.

### Layout & Component Rationale (`R-31`)
1. **Conditional Resume Banner**: Appears at the top of `.home-dashboard` only when an `in_progress` session exists in IndexedDB, giving one-tap access to `data-action="resume-session"`.
2. **Command Header & Real-Data Metric Ledger**: Combines the page title, primary CTA (`data-action="quick-start-kunci1"`), secondary configuration CTA (`data-page="setup"`), and a 4-item real-data metric strip (Total Active Questions, Question Packages, Kunci Ujian 1 Questions, Completed Sessions) into one cohesive top panel instead of 4 separate template stat cards.
3. **Tabbed Question Package Directory (`Semua`, `Kunci Ujian`, `Bonus`)**: Organizes the 23 built-in packages into scannable categories (`Semua`, `Kunci Ujian` for sets 1–13, `Bonus` for Tipe 2 & Bonus 1–10) with meaningful alphanumeric codes (`01`–`13`, `T2`, `B1`–`B10`) instead of repetitive `食` monograms.
4. **Compact Study Modes & Shortcuts Rail**: Right-hand column houses the 2 secondary simulation modes (`quick-practice-kunci1`, `quick-custom` — avoiding duplication with the primary `quick-start-kunci1` CTA in the command header), 2 management shortcuts (`data-page="bank"`, `data-page="backup"`), and the official 150-point (`3.75 × 40`) scoring reference box.
5. **Responsive Examination History**: Displays the latest 5 completed sessions from IndexedDB with tabular scores on desktop and structured, full-width cards with `44px` touch buttons on mobile (`<= 640px`).
