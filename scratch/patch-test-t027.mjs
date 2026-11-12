// scratch/patch-test-t027.mjs
import fs from 'fs';

const testFile = 'tests/test-practice-selective-kotoba.mjs';
let content = fs.readFileSync(testFile, 'utf8');

const targetStr = `// -----------------------------------------------------------------------------
// 14. Test Harness Summary
// -----------------------------------------------------------------------------
console.log('\\n================================================================================');
console.log('FEATURE 008 TEST HARNESS EXECUTION SUMMARY:');
console.log('  1. Task T011: Baseline State & Identity Tests:  4 PASSED (100%)');
console.log('  2. Task T011: Contract Specification Ledger:    8 SPECS COMPILED & REGISTERED');
console.log('  3. Task T015: Production Resolver Tests:        9 PASSED (100%)');
console.log('  4. Task T016: Right-Side Controls Mounting:     MOUNTED & VERIFIED');
console.log('  5. Task T017: Production Viewer & DOM Sync:     5 PASSED (100%)');
console.log('  6. Task T018: Click Router State Handler:       VERIFIED (100% PASSED)');
console.log('  7. Task T019: Furigana Synchronization Tests:   VERIFIED (100% PASSED)');
console.log('  8. Task T020: Ruby Rendering for Furigana:      VERIFIED (100% PASSED)');
console.log('  9. Task T021: Dedicated Kotoba Furigana CSS:    VERIFIED (100% PASSED)');
console.log(' 10. Task T022: Three-Column Sibling Grid:     VERIFIED (100% PASSED)');
console.log(' 11. Task T023: Button Styling & Desktop Hover: VERIFIED (100% PASSED)');
console.log(' 12. Task T024: Touch Feedback (:active):      VERIFIED (100% PASSED)');
console.log(' 13. Task T025: Vertical Content Stacking:     VERIFIED (100% PASSED)');
console.log(' 14. Task T026: EDRDG / JMdict Attribution:    VERIFIED (100% PASSED)');
console.log('================================================================================');
console.log('Feature 008 Test Harness successfully executed!\\n');`;

const replacementStr = `// -----------------------------------------------------------------------------
// 14. Phase 7: Service Worker Precaching & Cache Versioning (Task T027)
// -----------------------------------------------------------------------------
console.log('\\n--- Phase 7: Service Worker Precaching & Shell Cache Versioning (T027) ---');

const swPath = path.resolve('sw.js');
assert.ok(fs.existsSync(swPath), 'sw.js must exist');
const swSource = fs.readFileSync(swPath, 'utf8');

const t027CacheMatch = swSource.match(/const\\s+CACHE_NAME\\s*=\\s*['\"]([^'\"]+)['\"]/);
assert.ok(t027CacheMatch, 'sw.js must define CACHE_NAME');
assert.ok(
  t027CacheMatch[1] === 'ssw-pm-mock-test-shell-v29',
  \`CACHE_NAME must be incremented to v29, got: \${t027CacheMatch[1]}\`
);
console.log('✓ Criterion 14.1: Shell cache version successfully incremented to v29');

const t027CoreMatch = swSource.match(/const\\s+CORE\\s*=\\s*\\[([\\s\\S]*?)\\];/);
assert.ok(t027CoreMatch, 'sw.js must define CORE array');
const t027CoreItems = t027CoreMatch[1]
  .split('\\n')
  .map(l => l.trim())
  .filter(l => l.startsWith(\"'\") || l.startsWith('\"'))
  .map(l => l.replace(/^['\"]|['\"],?$/g, ''));

const t027DictMatches = t027CoreItems.filter(item => item.includes('sharedKotobaDictionary.json'));
assert.strictEqual(t027DictMatches.length, 1, 'sharedKotobaDictionary.json must be in CORE exactly once');
assert.strictEqual(t027DictMatches[0], './data/sharedKotobaDictionary.json', 'Path must match ./data/sharedKotobaDictionary.json');
console.log('✓ Criterion 14.2: data/sharedKotobaDictionary.json precached exactly once in CORE');

const t027GhScope = 'https://faizalart.github.io/MOCK-TEST-SSW-PM-BY-FAIZ/';
const t027ResolvedGh = new URL(t027DictMatches[0], t027GhScope).href;
assert.strictEqual(
  t027ResolvedGh,
  'https://faizalart.github.io/MOCK-TEST-SSW-PM-BY-FAIZ/data/sharedKotobaDictionary.json',
  'Must resolve cleanly under GitHub Pages base scope'
);
console.log('✓ Criterion 14.3: Precache URL resolution matches GitHub Pages deployment scope');

const t027UniqueSet = new Set(t027CoreItems);
assert.strictEqual(t027UniqueSet.size, t027CoreItems.length, 'All CORE precache entries must be unique');
console.log(\`✓ Criterion 14.4: All \${t027CoreItems.length} CORE precache assets verified unique and present\`);

// -----------------------------------------------------------------------------
// 15. Test Harness Summary
// -----------------------------------------------------------------------------
console.log('\\n================================================================================');
console.log('FEATURE 008 TEST HARNESS EXECUTION SUMMARY:');
console.log('  1. Task T011: Baseline State & Identity Tests:  4 PASSED (100%)');
console.log('  2. Task T011: Contract Specification Ledger:    8 SPECS COMPILED & REGISTERED');
console.log('  3. Task T015: Production Resolver Tests:        9 PASSED (100%)');
console.log('  4. Task T016: Right-Side Controls Mounting:     MOUNTED & VERIFIED');
console.log('  5. Task T017: Production Viewer & DOM Sync:     5 PASSED (100%)');
console.log('  6. Task T018: Click Router State Handler:       VERIFIED (100% PASSED)');
console.log('  7. Task T019: Furigana Synchronization Tests:   VERIFIED (100% PASSED)');
console.log('  8. Task T020: Ruby Rendering for Furigana:      VERIFIED (100% PASSED)');
console.log('  9. Task T021: Dedicated Kotoba Furigana CSS:    VERIFIED (100% PASSED)');
console.log(' 10. Task T022: Three-Column Sibling Grid:     VERIFIED (100% PASSED)');
console.log(' 11. Task T023: Button Styling & Desktop Hover: VERIFIED (100% PASSED)');
console.log(' 12. Task T024: Touch Feedback (:active):      VERIFIED (100% PASSED)');
console.log(' 13. Task T025: Vertical Content Stacking:     VERIFIED (100% PASSED)');
console.log(' 14. Task T026: EDRDG / JMdict Attribution:    VERIFIED (100% PASSED)');
console.log(' 15. Task T027: SW Precache & Cache v29:       VERIFIED (100% PASSED)');
console.log('================================================================================');
console.log('Feature 008 Test Harness successfully executed!\\n');`;

// Normalize line endings before replacement
const normContent = content.replace(/\r\n/g, '\n');
const normTarget = targetStr.replace(/\r\n/g, '\n');
if (!normContent.includes(normTarget)) {
  throw new Error('Target string not found in tests/test-practice-selective-kotoba.mjs');
}

const updatedContent = normContent.replace(normTarget, replacementStr);
fs.writeFileSync(testFile, updatedContent, 'utf8');
console.log('test-practice-selective-kotoba.mjs successfully updated with Part 14 & summary item 15!');
