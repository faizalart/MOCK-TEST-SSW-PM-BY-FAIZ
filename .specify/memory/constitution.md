<!--
Sync Impact Report:
- Version change: 1.0.0 → 1.1.0
- List of modified principles:
  * I. Preserve Existing Functionality: Clarified that Zone A (CBT Exam) is protected from unsolicited redesigns, but remains fully serviceable for bug fixes, responsive viewport adjustments, accessibility improvements, and explicitly requested exam controls.
  * II. Data Integrity & Schema Preservation: Separated universal mandatory fields from contextual/provenance fields (sourcePdf, sourcePage, pdfPage, questionImage, imageMediaId); clarified that HTML ruby applies only to Kanji in supported packages, exempting kana/alphanumerics and legacy packs (e.g. tipe2) without automatic migration.
  * IV. UI Consistency & Zen White Design System: Defined WCAG AA as the mandatory baseline (>= 4.5:1 for normal text) with AAA as a stretch target; required evaluation of actual rendered foreground/background combinations rather than isolated tokens.
  * VI. Performance & Zero-Dependency PWA: Mandated strict synchronization between Service Worker cache cleanup routines, CACHE_NAME, and asset query hashes, explicitly prohibiting stale hardcoded version exceptions.
  * Quality Gates section: Replaced rigid unconditional 4-gate requirement with Tiered Quality Gates (Tier 1 to Tier 4) evaluated by change domain.
- Added sections: Tiered Quality Gates evaluation framework and domain classification.
- Removed sections: None.
- Follow-up TODOs: None (all sections fully resolved against repository facts).
-->

# SSW PM Mock Test by Faiz Constitution

## Core Principles

### I. Preserve Existing Functionality
All existing, operational application capabilities MUST remain fully functional across updates.
- The active CBT examination environment (`renderExam()`, absolute deadline countdown timer, question map grid, Furigana toggle, Full Screen mode, question and answer font sliders, question navigation, flag `⚑`, exam submission confirmation, and scoring engine) is protected code against unsolicited architectural rewrites, structural churn, or visual re-theming.
- **Serviceability of Zone A**: Protection does NOT mean CBT code is immutable. Zone A remains fully serviceable: bug fixes (such as resolving viewport scroll anomalies or toolbar alignment on mobile devices), responsive viewport adjustments, accessibility improvements, and new examination controls explicitly requested by the user (such as Study List `+` button integration or toolbar layout reordering) are explicitly permitted and supported.
- Non-CBT pages (Beranda, Setup Mock Test, Bank Soal, Riwayat Hasil, Study List, Backup & Data) MUST maintain stable navigation, clean URL/state transitions, and persistent data retrieval.
- New features MUST be strictly additive, integrating seamlessly into existing toolbars and workflows without displacing or altering established candidate habits.

### II. Data Integrity & Schema Preservation
The canonical database structure, question schema, and question packages MUST NOT be altered without explicit necessity and user approval.
- **Separation of Question Schema Fields**:
  * **Universal Mandatory Fields** (required on all question records across all packages and custom sets): `id`, `setId`, `setName`, `points`, `prompt`, `instructions`, `explanation`, `correctAnswer`, `correctIndex`, `options` (array of `{ id, text, translation }`), and `promptTranslation`.
  * **Contextual & Provenance Fields** (present when applicable by source, media, or package type; optional for lab synthesis or custom sets): `sourcePdf`, `sourcePage`, `pdfPage` (for official PDF exam keys), `questionImage`, `imageMediaId`, `imageSize`, `imageRatio`, `imagePosition` (for illustrated questions), `media` (for option media attachments), `questionText` (clean plain-text representation), and `active`/`createdAt`/`updatedAt`.
  * **Backward Compatibility**: Full backward compatibility MUST be preserved for legacy question packs (such as `ssw-pm-tipe2-nguyen1.json`) and user-generated custom questions. Missing contextual fields MUST NOT cause validation failure.
- **Deterministic Question Identity**: Question identity MUST be stable and deterministic across sessions and stores (composite key `${setId}::${q.id}`). Array indices, visual positions, or randomized order MUST NEVER be used as persistent identifiers. Randomization of question order or option order MUST NEVER mutate the underlying question ID, correct answer reference, or Study List associations.
- **Furigana Annotation Scope**:
  * Anotasi HTML `<ruby>漢字<rt>かんじ</rt></ruby>` strictly applies to text containing **Kanji** in question packages that support Furigana.
  * Plain Hiragana, Katakana, Latin text, Arabic numerals, symbols, and mathematical/temperature units (e.g., `10℃`, `−18℃`, `くるみ`, `アーモンド`) do NOT require ruby tags.
  * Legacy question packages that have not yet been annotated (such as `ssw-pm-tipe2-nguyen1.json`) are valid in their current state and MUST NOT be subjected to automatic migration or rewriting without explicit user instruction.
  * Field `questionText` MUST ALWAYS remain pure plain text (zero HTML tags, zero `<ruby>`) to preserve fast indexing, search filtering, and concise list previews.
- **Database Stores**: IndexedDB stores (`questions`, `themes`, `passages`, `sessions`, `meta`, `audioGroups`, `studyList`) and their in-memory fallback maps MUST NOT be deleted, renamed, or modified destructively.

### III. Minimal Changes & Scoped Impact
Modifications MUST be surgical, minimal, and strictly confined to the explicit scope of the task.
- Unsolicited wide-scale refactoring, renaming working variables, reorganizing unrelated modules, or reformatting unaffected files is strictly prohibited.
- When fixing defects or introducing isolated enhancements, touch only the specific functions and styling rules necessary.
- Preserve all existing comments, docstrings, and license attributions that are unrelated to the target change.
- Respect established project naming conventions, code organization patterns, and file boundaries.

### IV. UI Consistency & Zen White Design System
All user-facing surfaces MUST strictly follow the **Zen White Digital Library** design system and visual rules established in `DESIGN.md`.
- Adhere to the defined Anti-Slop Dials:
  * **ENERGY 1 / 3**: Calm, distraction-free examination aesthetic. Zero decorative gradients, zero gratuitous cards, zero bouncing or floating status badges, and zero decorative drop shadows.
  * **RHYTHM 1 / 3**: Clean editorial vertical cadence with crisp 1px hairline dividers (`--zen-line: #dfdfd9`) and generous whitespace.
  * **MOTION 1 / 3**: Instant, functional state feedback (`0.1s - 0.12s` transitions); no unsolicited entrance, exit, or floating animations.
- Enforce the strict 3-file CSS architectural separation:
  * **Zone A (CBT Exam Styles)**: Stylesheets applying to `body.exam-mode` (`styles.css`, `QUESTION-EDITOR-UPDATES.css`) are protected from non-CBT CSS leakage. Background atmosphere and overlays are disabled in exam mode via `body.exam-mode::before, body.exam-mode::after { content: none !important; }`. Sanctioned CBT bug fixes and exam control additions remain serviceable within their scoped selectors.
  * **Zone B (Non-CBT Pages)**: Modulated across `ZEN-APP-SHELL.css` (global shell, atmospheric Zen warrior canvas, sidebar, topbar), `HOME-DASHBOARD.css` (homepage hero, session resume banner, package catalog), and `ZEN-PAGES.css` (reading surfaces, tables, forms, modals).
- **Accessibility & Contrast Requirements**:
  * **WCAG AA** is the mandatory baseline requirement for normal body text (contrast ratio `>= 4.5:1`) and large text (`>= 3.0:1`).
  * **WCAG AAA** (`>= 7.0:1`) serves as an additional target where feasible (achieved by `--zen-ink: #171717`, `--zen-muted: #4a4a45`, and `--zen-danger: #9e2a2b` on white reading surfaces).
  * Contrast verification MUST evaluate actual rendered foreground-on-background combinations in the DOM (including text on transparent panels, muted surfaces, or layered canvas backgrounds), rather than evaluating isolated color tokens in the abstract.

### V. Mobile Responsiveness & Multi-Viewport Parity
Every interface modification MUST be engineered and verified for both desktop and mobile viewports.
- The CBT examination interface (including question workspace, bottom action bar, font controls, and navigation buttons) MUST fit cleanly without vertical scrollbar anomalies, clipped actions, or unneeded empty space on mobile viewports (e.g., 390×844 and 360×740).
- Non-CBT pages MUST reflow smoothly: responsive sidebar collapse into an accessible drawer, full-width touch-friendly tables, and legible form controls.
- The atmospheric canvas focal point MUST be calibrated responsively: desktop (`32% 66%`), tablet (`29% 68%`), and mobile (`27% 72%`) so the meditating Zen warrior on the cliff remains visible on portrait screens.
- Interactive controls MUST maintain adequate tap target ergonomics (minimum 44×44px hit areas or generous padding).

### VI. Performance & Zero-Dependency PWA
The application MUST remain a zero-dependency, ultra-lightweight, offline-capable Progressive Web Application.
- The technology stack MUST remain strictly Native HTML5, Modern CSS, and Vanilla JavaScript (ES Modules).
- NO external npm runtime packages, heavy JS frameworks (React, Vue, Svelte), CSS frameworks (Tailwind, Bootstrap), or remote CDN scripts (`<script src="https://...">`) may be introduced.
- Offline resilience MUST be maintained via Service Worker (`sw.js`) and IndexedDB (`db.js`).
- **Service Worker & Cache Synchronization**:
  * Cache cleanup routines, `CACHE_NAME` in `sw.js`, and asset query versions (`?v=sswXX` in `index.html` and `sw.js`) MUST strictly match the active shell version.
  * Stale, hardcoded version exceptions in inline cache cleanup scripts (such as legacy checks against outdated shell versions) are strictly prohibited and MUST be updated or eliminated whenever the shell cache is incremented.

### VII. Testing & Empirical Verification
Every code or data modification MUST be validated using empirical, reproducible verification methods grounded in the real repository environment.
- Verification MUST rely on the repository's native execution capabilities: standalone Node.js assertion scripts and Headless Chromium automation via Chrome DevTools Protocol (CDP) using `--headless=new` and `--remote-debugging-pipe`.
- Agents and contributors MUST NOT invent, hallucinate, or reference non-existent testing frameworks (e.g., Jest, Cypress, Playwright, Vitest) not present in the workspace.
- Visual and layout modifications MUST be verified with high-resolution screenshot captures saved to the artifact directory for both desktop and mobile viewports.
- Database seeding, furigana coverage, and question bank updates MUST be programmatically asserted across 100% of affected records before being deemed complete.

### VIII. Architectural Documentation & Decision Rationale
Architectural invariants, state changes, and design decisions MUST be clearly recorded to maintain continuity.
- Significant updates to application state, data models, or visual components MUST be reflected in `DESIGN.md`, `TEST-REPORT.md`, or relevant documentation files.
- Architectural choices MUST follow the One-Line Decision Rationale (`R-31`) standard: articulate the core decision, the problem addressed, constraints evaluated, and why alternatives were rejected.
- Spec Kit planning and task execution artifacts (`plan.md`, `tasks.md`, `spec.md`) MUST explicitly link back to this constitution during gate checks.

## Technology Stack & Architectural Constraints

- **Language & Runtime**: Modern Vanilla JavaScript (ES2022+ Native ES Modules), HTML5, CSS3.
- **Client Architecture**: Single-Page Application (SPA) driven by state machine in `app.js`, rendered via pure DOM manipulation and lightweight templates without virtual DOM overhead.
- **Client-Side Storage**: IndexedDB database (`ssw-pm-mock-test-db`, version 2) with stores: `questions`, `themes`, `passages`, `sessions`, `meta`, `audioGroups`, `studyList`, complemented by `localStorage` for UI preferences and an in-memory `Map` fallback.
- **Offline & PWA**: Service Worker (`sw.js`) caching core app shell and static question bundles, Web App Manifest (`manifest.webmanifest`), zero cloud telemetry or external backend dependencies.
- **Question Bundles**: Pre-packaged static JSON files in project root (`ssw-pm-kunci-ujian-1.json`, `ssw-pm-kunci-ujian-2.json`, `ssw-pm-all-kunci-ujian-3-to-13.json`, `ssw-pm-tipe2-nguyen1.json`, `ssw-pm-bonus-soal-1-to-10-bundle.json`, `ssw-pm-special-lab-bundle.json`).

## Verification Workflows & Tiered Quality Gates

To balance rigorous verification with proportional execution speed, quality gates are evaluated according to a 4-tier model based on the domain of change. If a single task spans multiple domains, the **highest applicable tier** MUST be enforced.

### Quality Gate Definitions
1. **Gate 1: Zero-Dependency & Scope Check**: Verify that zero external npm runtime packages, CDNs, or foreign build tools were introduced, and that changes are scoped strictly to the task.
2. **Gate 2: Schema & Data Consistency Check**: Programmatically assert that all affected question records retain universal mandatory fields, valid options, clean plain-text `questionText`, correct scoring points, and valid `<ruby>` annotations where Kanji is present.
3. **Gate 3: Multi-Viewport Browser Parity Check**: Execute headless Chromium CDP scripts across desktop (1440px) and mobile (390px) viewports, verifying zero layout overflows, proper sticky toolbars, responsive Zen canvas focal points, and correct interaction states with artifact screenshots.
4. **Gate 4: Service Worker & Cache Synchronization**: Verify that Service Worker cache names, HTML asset query hashes, auto-seed flags in `app.js`, and inline cache cleanup logic are synchronized to the active shell version.

### Tiered Enforcement Matrix
- **Tier 1 — Documentation & Copywriting Only**:
  * *Scope*: Edits confined strictly to markdown documentation (`README.md`, `DESIGN.md`, `.specify/`), code comments, or static translation strings.
  * *Required Gates*: Markdown syntax verification, internal link checks, and copy consistency. (Gates 2, 3, and 4 are exempt).
- **Tier 2 — Data & Question Bank Updates**:
  * *Scope*: Changes to question JSON bundles, question editing functions, seed logic, or database import/export mechanisms.
  * *Required Gates*: **Gate 1**, **Gate 2**, and **Gate 4** (if bundles or seed routines were updated). (Gate 3 is exempt unless question card visual layout was altered).
- **Tier 3 — UI, CSS & Layout Modifications**:
  * *Scope*: Changes to stylesheets (`styles.css`, `ZEN-*.css`, `HOME-*.css`), modal templates, navigation bars, or responsive layout logic.
  * *Required Gates*: **Gate 1**, **Gate 3**, and **Gate 4**.
- **Tier 4 — CBT Engine, IndexedDB & Core State Machine**:
  * *Scope*: Changes affecting `renderExam()`, timer mechanisms, score calculations, IndexedDB schema/store management, session persistence, or core navigation routing.
  * *Required Gates*: **Gate 1**, **Gate 2**, **Gate 3**, and **Gate 4** (Full Verification).

## Governance

This Constitution constitutes the foundational engineering standard for the **SSW PM Mock Test by Faiz** repository.
- **Supremacy**: The principles and constraints set forth in this document supersede all informal development practices or ad-hoc instructions. All Spec Kit specifications (`spec.md`), implementation plans (`plan.md`), and tasks (`tasks.md`) MUST conform to these rules.
- **Amendment Procedure**: Amendments require an explicit rationale, validation against real codebase constraints, and updating of the version metadata.
- **Versioning Policy**:
  * **MAJOR** (`+1.0.0`): Fundamental architectural shifts, removal or redefinition of core principles.
  * **MINOR** (`+0.1.0`): Addition of new principles, structural sections, or materially expanded guidelines.
  * **PATCH** (`+0.0.1`): Textual clarifications, typo fixes, or non-semantic wording refinements.
- **Compliance Gate**: Every feature pull request or task execution must verify compliance with Core Principles I through VIII and the applicable Quality Gate Tier.

**Version**: 1.1.0 | **Ratified**: 2026-11-09 | **Last Amended**: 2026-11-09
