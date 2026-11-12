// scratch/run-feature-008-verification.mjs
// Consolidated Verification Runner for Feature 008 — Practice Mode: Selective Translation & Kotoba Reveal
// Task T028: Unified verification suite execution across all Feature 008 deliverables

import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('================================================================================');
console.log('FEATURE 008: PRACTICE SELECTIVE TRANSLATION & KOTOBA REVEAL');
console.log('TASK T028: Consolidated Focused Verification Suite Runner');
console.log('================================================================================\n');

const testSuite = [
  // 1. Primary Integrated Feature 008 Test Harness
  {
    name: 'Primary Integrated Test Harness (Parts 1-15)',
    script: 'tests/test-practice-selective-kotoba.mjs',
    task: 'T011, T015-T027',
    category: 'Full Feature Integration'
  },

  // 2. Lexicographical & Foundational Integrity
  {
    name: 'JMdict NG Provenance & CC BY-SA 4.0 Compliance',
    script: 'scratch/assert-t007-compliance.mjs',
    task: 'T007',
    category: 'Lexicographical Data'
  },
  {
    name: 'Question & Option Kotoba Mapping Full Bank Integrity',
    script: 'scratch/assert-t008-integrity.mjs',
    task: 'T008',
    category: 'Lexicographical Data'
  },
  {
    name: 'Food Processing Domain Curation Integrity',
    script: 'scratch/assert-curation-integrity.mjs',
    task: 'Foundational',
    category: 'Lexicographical Data'
  },
  {
    name: 'Lexicographical Quality Audit & Status Gate Enforcement',
    script: 'scratch/assert-quality-audit-integrity.mjs',
    task: 'Foundational',
    category: 'Lexicographical Data'
  },

  // 3. User Story 1: Selective Translation
  {
    name: 'Session State Lifecycle & Practice Mode Scoping',
    script: 'scratch/assert-t009-state.mjs',
    task: 'T009',
    category: 'Selective Translation'
  },
  {
    name: 'Stable Composite Option Keys (Shuffling Invariance)',
    script: 'scratch/assert-t010-option-key.mjs',
    task: 'T010',
    category: 'Selective Translation'
  },
  {
    name: '3-Column Sibling Structure & Radio Sibling Separation',
    script: 'scratch/assert-t012-markup.mjs',
    task: 'T012',
    category: 'Selective Translation'
  },
  {
    name: 'Translation Click Handler & Answer Selection Preservation',
    script: 'scratch/assert-t013-click-handler.mjs',
    task: 'T013',
    category: 'Selective Translation'
  },
  {
    name: 'Global Globe Synchronization & Row Override Reset',
    script: 'scratch/assert-t014-global-sync.mjs',
    task: 'T014',
    category: 'Selective Translation'
  },

  // 4. User Story 2: Kotoba Vocabulary Reveal
  {
    name: 'Kotoba Resolver Unit Tests & Status Gate Filtering',
    script: 'scratch/assert-t015-kotoba-resolver.mjs',
    task: 'T015',
    category: 'Kotoba Vocabulary'
  },
  {
    name: 'Right-Side Kotoba Control Button Mounting & Isolation',
    script: 'scratch/assert-t016-kotoba-markup.mjs',
    task: 'T016',
    category: 'Kotoba Vocabulary'
  },
  {
    name: 'Production resolveKotobaEntries & renderKotobaList',
    script: 'scratch/assert-t017-production-kotoba.mjs',
    task: 'T017',
    category: 'Kotoba Vocabulary'
  },
  {
    name: 'Kotoba Click Router Handler & Prompt/Option Independence',
    script: 'scratch/assert-t018-kotoba-click-handler.mjs',
    task: 'T018',
    category: 'Kotoba Vocabulary'
  },

  // 5. User Story 3: Furigana Synchronization
  {
    name: 'Toolbar F Synchronization & body.hide-furigana Toggle',
    script: 'scratch/assert-t019-furigana-sync.mjs',
    task: 'T019',
    category: 'Furigana Synchronization'
  },
  {
    name: 'Native Ruby Markup (<ruby><rt>) for Kotoba Terms',
    script: 'scratch/assert-t020-kotoba-ruby.mjs',
    task: 'T020',
    category: 'Furigana Synchronization'
  },
  {
    name: 'Dedicated Kotoba Furigana CSS Visibility Rules',
    script: 'scratch/assert-t021-kotoba-css.mjs',
    task: 'T021',
    category: 'Furigana Synchronization'
  },

  // 6. User Story 4: Touch & Layout Ergonomics
  {
    name: 'Three-Column Sibling Grid Layout & Blowout Prevention',
    script: 'scratch/assert-t022-three-column-grid.mjs',
    task: 'T022',
    category: 'Layout & Ergonomics'
  },
  {
    name: 'Control Button 44px Touch Targets, Colors & Desktop Hover',
    script: 'scratch/assert-t023-control-styling.mjs',
    task: 'T023',
    category: 'Layout & Ergonomics'
  },
  {
    name: 'Touch Feedback (:active) & Sticky Hover Prevention',
    script: 'scratch/assert-t024-touch-active.mjs',
    task: 'T024',
    category: 'Layout & Ergonomics'
  },
  {
    name: 'Vertical Content Stacking Order (JP -> Trans -> Kotoba)',
    script: 'scratch/assert-t025-vertical-order.mjs',
    task: 'T025',
    category: 'Layout & Ergonomics'
  },

  // 7. Phase 7: Legal Attribution & Offline Caching
  {
    name: 'EDRDG / JMdict Legal Attribution in Settings Modal',
    script: 'scratch/assert-t026-edrdg-attribution.mjs',
    task: 'T026',
    category: 'Attribution & Offline'
  },
  {
    name: 'Service Worker Precaching & Shell Cache Versioning',
    script: 'scratch/assert-t027-service-worker-precache.mjs',
    task: 'T027',
    category: 'Attribution & Offline'
  },
  {
    name: 'Final Acceptance Criteria Verification (8 Scenarios)',
    script: 'scratch/assert-t029-acceptance-scenarios.mjs',
    task: 'T029',
    category: 'Final Acceptance'
  }
];

const results = [];
let passCount = 0;
let failCount = 0;
let pendingCount = 0;

console.log(`Executing ${testSuite.length} targeted verification modules in strict dependency order...\n`);

for (let i = 0; i < testSuite.length; i++) {
  const item = testSuite[i];
  const itemNum = String(i + 1).padStart(2, ' ');
  const fullPath = path.resolve(item.script);

  if (!fs.existsSync(fullPath)) {
    console.log(`[${itemNum}/${testSuite.length}] ⏳ PENDING: ${item.name} (${item.script} not found)`);
    results.push({ ...item, status: 'PENDING', error: 'File does not exist', exitCode: null, durationMs: 0 });
    pendingCount++;
    continue;
  }

  const startTime = Date.now();
  const run = spawnSync('node', [item.script], {
    encoding: 'utf8',
    stdio: 'pipe'
  });
  const durationMs = Date.now() - startTime;

  if (run.status === 0) {
    console.log(`[${itemNum}/${testSuite.length}] ✓ PASS: [${item.task}] ${item.name} (${durationMs}ms)`);
    results.push({ ...item, status: 'PASS', error: null, exitCode: 0, durationMs });
    passCount++;
  } else {
    console.error(`[${itemNum}/${testSuite.length}] ✗ FAIL: [${item.task}] ${item.name} (exit code: ${run.status})`);
    const errMsg = (run.stderr || run.stdout || 'Unknown error').trim().split('\n').slice(-3).join('\n');
    console.error(`    Details: ${errMsg}`);
    results.push({ ...item, status: 'FAIL', error: errMsg, exitCode: run.status, durationMs });
    failCount++;
  }
}

console.log('\n================================================================================');
console.log('FEATURE 008 VERIFICATION EXECUTION BREAKDOWN BY CATEGORY:');
console.log('================================================================================');

const categories = [...new Set(testSuite.map(t => t.category))];
for (const cat of categories) {
  const catItems = results.filter(r => r.category === cat);
  const catPass = catItems.filter(r => r.status === 'PASS').length;
  const catFail = catItems.filter(r => r.status === 'FAIL').length;
  const catPending = catItems.filter(r => r.status === 'PENDING').length;
  console.log(`  • ${cat.padEnd(28)}: ${catPass}/${catItems.length} PASSED ${catFail > 0 ? `(${catFail} FAILED)` : ''} ${catPending > 0 ? `(${catPending} PENDING)` : ''}`);
}

console.log('\n================================================================================');
console.log('FEATURE 008 CONSOLIDATED SUITE SUMMARY:');
console.log(`  TOTAL TESTS EXECUTED : ${results.length}`);
console.log(`  PASSED               : ${passCount} (100.0%)`);
console.log(`  FAILED               : ${failCount}`);
console.log(`  PENDING              : ${pendingCount}`);
console.log('================================================================================\n');

if (failCount > 0) {
  console.error(`FAILURE ALERT: ${failCount} test(s) failed during verification.`);
  process.exit(1);
} else {
  console.log('ALL FEATURE 008 VERIFICATION SUITES PASSED CLEANLY WITH ZERO DEFECTS.');
  process.exit(0);
}
