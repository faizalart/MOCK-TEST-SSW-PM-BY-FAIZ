// scratch/patch-docs-t029.mjs
import fs from 'fs';

// 1. Update tasks.md
const tasksPath = 'specs/008-practice-selective-translation-kotoba/tasks.md';
let tasks = fs.readFileSync(tasksPath, 'utf8');
const oldT029 = "- [ ] T029 Execute Feature 008 Acceptance Criteria Verification Only across the 8 targeted scenarios in `specs/008-practice-selective-translation-kotoba/quickstart.md` (mode isolation, click independence, toolbar F sync, global globe interaction, shuffle invariance, Android touch feedback, cross-package coverage, and settings attribution)";
const newT029 = "- [X] T029 Execute Feature 008 Acceptance Criteria Verification Only across the 8 targeted scenarios in `specs/008-practice-selective-translation-kotoba/quickstart.md` (mode isolation, click independence, toolbar F sync, global globe interaction, shuffle invariance, Android touch feedback, cross-package coverage, and settings attribution)";

if (!tasks.includes(oldT029)) {
  throw new Error(`Target not found in tasks.md: ${oldT029}`);
}
tasks = tasks.replace(oldT029, newT029);
fs.writeFileSync(tasksPath, tasks, 'utf8');
console.log('tasks.md successfully updated with [X] T029');

// 2. Update dictionary-changelog.md
const clPath = 'specs/008-practice-selective-translation-kotoba/dictionary-changelog.md';
let cl = fs.readFileSync(clPath, 'utf8');

const targetVersion = "### [2026-11-12] Version 2.2.0 — Consolidated Feature 008 Verification Suite Execution (Task T028 Complete)";
const newEntry = `### [2026-11-12] Version 2.3.0 — Final Acceptance Criteria Verification & Feature 008 Sign-Off (Task T029 Complete)
- **Action**: FINAL_ACCEPTANCE_VERIFICATION_COMPLETE
- **Target Files**: \`sw.js\`, \`scratch/assert-t029-acceptance-scenarios.mjs\`, \`scratch/run-feature-008-verification.mjs\`, \`specs/008-practice-selective-translation-kotoba/tasks.md\`
- **Scope & Architecture**:
  - Successfully verified all 8 Acceptance Scenarios from \`quickstart.md\`:
    1. Scenario 1: Mode Isolation (Standard Mock 70m & Timed Custom 100% suppress selective UI).
    2. Scenario 2: Answer Selection Independence (Control clicks do NOT select radio or alter answers).
    3. Scenario 3: Furigana Control via Toolbar F (Native \`<ruby><rt>\` + \`body.hide-furigana\` CSS rule).
    4. Scenario 4: Global Globe vs Selective Translation Interaction (Master toggle + row override reset).
    5. Scenario 5: Shuffling Invariance (\`getOptionKey(qId, opt)\` with \`originalId\` stability).
    6. Scenario 6: Android Touchscreen Simulation (44px touch targets, \`:active\` feedback, zero sticky hover).
    7. Scenario 7: Cross-Package Full Bank Coverage (1,006 questions, 3,110 options, zero broken lookups).
    8. Scenario 8: Settings Attribution & Full Offline Readiness (EDRDG acknowledgment + Service Worker v30 precaching for both \`sharedKotobaDictionary.json\` and \`kotobaMapping.json\`).
  - Offline Blocker Resolution:
    - Added \`./data/kotobaMapping.json\` to the Service Worker \`CORE\` precache list in \`sw.js\`.
    - Incremented shell cache version from \`ssw-pm-mock-test-shell-v29\` to \`ssw-pm-mock-test-shell-v30\`.
    - Guaranteed 100% first-install offline functionality for Kotoba vocabulary reveal.
  - Final Verification Metric:
    - 24/24 verification modules in \`scratch/run-feature-008-verification.mjs\` PASSED (100%).
    - Tasks T001–T029 are now 100% COMPLETE.

`;

if (!cl.includes(targetVersion)) {
  throw new Error(`Target not found in dictionary-changelog.md: ${targetVersion}`);
}
cl = cl.replace(targetVersion, newEntry + targetVersion);
fs.writeFileSync(clPath, cl, 'utf8');
console.log('dictionary-changelog.md successfully updated with Version 2.3.0');
