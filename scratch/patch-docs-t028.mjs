// scratch/patch-docs-t028.mjs
import fs from 'fs';

// 1. Update tasks.md
const tasksPath = 'specs/008-practice-selective-translation-kotoba/tasks.md';
let tasks = fs.readFileSync(tasksPath, 'utf8');
const oldT028 = "- [ ] T028 Run Feature 008 Focused Verification Suite Only via `node tests/test-practice-selective-kotoba.mjs`, verifying 1,006 unique questions, 3,110 options, composite key stability, click isolation, Furigana toolbar F sync, shuffle invariance, and untimed practice mode isolation; strictly exclude unrelated regression suites (timer, cache, PWA, swipe)";
const newT028 = "- [X] T028 Run Feature 008 Focused Verification Suite Only via `node tests/test-practice-selective-kotoba.mjs`, verifying 1,006 unique questions, 3,110 options, composite key stability, click isolation, Furigana toolbar F sync, shuffle invariance, and untimed practice mode isolation; strictly exclude unrelated regression suites (timer, cache, PWA, swipe)";

if (!tasks.includes(oldT028)) {
  throw new Error(`Target not found in tasks.md: ${oldT028}`);
}
tasks = tasks.replace(oldT028, newT028);
fs.writeFileSync(tasksPath, tasks, 'utf8');
console.log('tasks.md successfully updated with [X] T028');

// 2. Update dictionary-changelog.md
const clPath = 'specs/008-practice-selective-translation-kotoba/dictionary-changelog.md';
let cl = fs.readFileSync(clPath, 'utf8');

const targetVersion = "### [2026-11-12] Version 2.1.0 — Service Worker Precaching & Shell Cache Version Bump (Task T027 Complete)";
const newEntry = `### [2026-11-12] Version 2.2.0 — Consolidated Feature 008 Verification Suite Execution (Task T028 Complete)
- **Action**: EXECUTE_CONSOLIDATED_VERIFICATION_SUITE
- **Target Files**: \`scratch/run-feature-008-verification.mjs\`, \`tests/test-practice-selective-kotoba.mjs\`
- **Scope & Architecture**:
  - Executed consolidated verification runner (\`scratch/run-feature-008-verification.mjs\`) covering 23 distinct verification modules across 7 functional categories.
  - Comprehensive Verification Results:
    - Primary Feature 008 Test Harness: 15/15 parts PASSED (100%).
    - Lexicographical Data (T007-T008, Curation, Quality Audit): 4/4 suites PASSED (100%).
    - User Story 1 (Selective Translation T009-T014): 5/5 suites PASSED (100%).
    - User Story 2 (Kotoba Reveal T015-T018): 4/4 suites PASSED (100%).
    - User Story 3 (Toolbar F Furigana Sync T019-T021): 3/3 suites PASSED (100%).
    - User Story 4 (Touch & Layout Ergonomics T022-T025): 4/4 suites PASSED (100%).
    - Phase 7 (Legal Attribution & SW Precache T026-T027): 2/2 suites PASSED (100%).
    - TOTAL: 23/23 PASSED (100%), 0 FAILED, 0 PENDING.
  - Factual Offline & Precache Analysis Documented:
    - Confirmed \`data/sharedKotobaDictionary.json\` is precached under \`ssw-pm-mock-test-shell-v29\`.
    - Identified that \`data/kotobaMapping.json\` is served via runtime cache rather than \`CORE\` precache, highlighting a cold-offline dependency finding for T029.
    - Audited \`Promise.allSettled\` error boundary behavior during Service Worker installation.
    - Verified complete licensing consistency between EDRDG requirements, dictionary metadata, and Settings attribution.

`;

if (!cl.includes(targetVersion)) {
  throw new Error(`Target not found in dictionary-changelog.md: ${targetVersion}`);
}
cl = cl.replace(targetVersion, newEntry + targetVersion);
fs.writeFileSync(clPath, cl, 'utf8');
console.log('dictionary-changelog.md successfully updated with Version 2.2.0');
