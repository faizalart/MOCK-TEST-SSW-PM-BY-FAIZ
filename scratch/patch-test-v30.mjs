// scratch/patch-test-v30.mjs
import fs from 'fs';

const testFile = 'tests/test-practice-selective-kotoba.mjs';
let content = fs.readFileSync(testFile, 'utf8');

const oldV29 = `assert.ok(
  t027CacheMatch[1] === 'ssw-pm-mock-test-shell-v29',
  \`CACHE_NAME must be incremented to v29, got: \${t027CacheMatch[1]}\`
);
console.log('✓ Criterion 14.1: Shell cache version successfully incremented to v29');`;

const newV30 = `assert.ok(
  t027CacheMatch[1] === 'ssw-pm-mock-test-shell-v30',
  \`CACHE_NAME must be incremented to v30, got: \${t027CacheMatch[1]}\`
);
console.log('✓ Criterion 14.1: Shell cache version successfully incremented to v30 (T027 & T029 offline resolution)');`;

content = content.replace(oldV29, newV30);

const oldMapCheck = `const t027DictMatches = t027CoreItems.filter(item => item.includes('sharedKotobaDictionary.json'));
assert.strictEqual(t027DictMatches.length, 1, 'sharedKotobaDictionary.json must be in CORE exactly once');
assert.strictEqual(t027DictMatches[0], './data/sharedKotobaDictionary.json', 'Path must match ./data/sharedKotobaDictionary.json');
console.log('✓ Criterion 14.2: data/sharedKotobaDictionary.json precached exactly once in CORE');`;

const newMapCheck = `const t027DictMatches = t027CoreItems.filter(item => item.includes('sharedKotobaDictionary.json'));
assert.strictEqual(t027DictMatches.length, 1, 'sharedKotobaDictionary.json must be in CORE exactly once');
assert.strictEqual(t027DictMatches[0], './data/sharedKotobaDictionary.json', 'Path must match ./data/sharedKotobaDictionary.json');

const t029MapMatches = t027CoreItems.filter(item => item.includes('kotobaMapping.json'));
assert.strictEqual(t029MapMatches.length, 1, 'kotobaMapping.json must be in CORE exactly once');
assert.strictEqual(t029MapMatches[0], './data/kotobaMapping.json', 'Path must match ./data/kotobaMapping.json');
console.log('✓ Criterion 14.2: Both data/sharedKotobaDictionary.json and data/kotobaMapping.json precached in CORE (100% offline-ready)');`;

content = content.replace(oldMapCheck, newMapCheck);

fs.writeFileSync(testFile, content, 'utf8');
console.log('test-practice-selective-kotoba.mjs successfully updated for v30 & offline mapping!');
