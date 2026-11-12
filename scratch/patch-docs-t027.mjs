// scratch/patch-docs-t027.mjs
import fs from 'fs';

// 1. Update tasks.md
const tasksPath = 'specs/008-practice-selective-translation-kotoba/tasks.md';
let tasks = fs.readFileSync(tasksPath, 'utf8');
const oldT027 = "- [ ] T027 [P] Add `data/sharedKotobaDictionary.json` to the Service Worker precache list in `sw.js` and increment shell cache version";
const newT027 = "- [X] T027 [P] Add `data/sharedKotobaDictionary.json` to the Service Worker precache list in `sw.js` and increment shell cache version";

if (!tasks.includes(oldT027)) {
  throw new Error(`Target not found in tasks.md: ${oldT027}`);
}
tasks = tasks.replace(oldT027, newT027);
fs.writeFileSync(tasksPath, tasks, 'utf8');
console.log('tasks.md successfully updated with [X] T027');

// 2. Update dictionary-changelog.md
const clPath = 'specs/008-practice-selective-translation-kotoba/dictionary-changelog.md';
let cl = fs.readFileSync(clPath, 'utf8');

const targetVersion = "### [2026-11-12] Version 2.0.0 — EDRDG / JMdict Legal Attribution Mounted in Settings Modal (Task T026 Complete)";
const newEntry = `### [2026-11-12] Version 2.1.0 — Service Worker Precaching & Shell Cache Version Bump (Task T027 Complete)
- **Action**: PRECACHE_DICTIONARY_RESOURCE
- **Target Files**: \`sw.js\`, \`tests/test-practice-selective-kotoba.mjs\`, \`scratch/assert-t027-service-worker-precache.mjs\`
- **Scope & Architecture**:
  - Added \`./data/sharedKotobaDictionary.json\` to the Service Worker \`CORE\` precache list in \`sw.js\`.
  - Incremented shell cache version from \`ssw-pm-mock-test-shell-v28\` to \`ssw-pm-mock-test-shell-v29\`.
  - Path Resolution: Matches GitHub Pages repository deployment base \`https://faizalart.github.io/MOCK-TEST-SSW-PM-BY-FAIZ/data/sharedKotobaDictionary.json\` and local environments.
  - Lifecycle Integrity: \`install\` event caches the dictionary via \`Promise.allSettled\`, while \`activate\` event purges obsolete \`v28\` and earlier shell caches without deleting \`v29\`.
  - Fetch Routing: Fallback logic in \`fetch\` handler serves dictionary requests from cache when offline.
  - Audit Finding: Verified \`data/kotobaMapping.json\` status; maintained as runtime fetch per T027 boundaries.
  - Comprehensive Verification:
    - Passed all 10 checks in \`scratch/assert-t027-service-worker-precache.mjs\` (100%).
    - Integrated and verified in \`tests/test-practice-selective-kotoba.mjs\` (15/15 test parts passed 100%).

`;

if (!cl.includes(targetVersion)) {
  throw new Error(`Target not found in dictionary-changelog.md: ${targetVersion}`);
}
cl = cl.replace(targetVersion, newEntry + targetVersion);
fs.writeFileSync(clPath, cl, 'utf8');
console.log('dictionary-changelog.md successfully updated with Version 2.1.0');
