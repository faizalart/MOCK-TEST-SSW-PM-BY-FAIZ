// scratch/test-runtime-hydration.mjs
// Test runtime hydration of kotobaMapping into exam questions and options

import fs from 'node:fs';

const mapping = JSON.parse(fs.readFileSync('data/kotobaMapping.json', 'utf8'));
const dict = JSON.parse(fs.readFileSync('data/sharedKotobaDictionary.json', 'utf8'));
const bundle1 = JSON.parse(fs.readFileSync('ssw-pm-kunci-ujian-1.json', 'utf8'));

console.log('=== TEST RUNTIME HYDRATION & SHUFFLE IMMUNITY ===\n');

/**
 * Hydration helper designed for T008/T009 integration.
 * Hydrates kotobaIds directly onto question and option objects in-memory.
 */
function hydrateKotoba(questions, mapping) {
  if (!Array.isArray(questions) || !mapping) return questions;
  for (const q of questions) {
    if (!q || !q.id) continue;
    // Hydrate prompt
    q.kotobaIds = mapping.questions[q.id] || [];

    // Hydrate options
    if (Array.isArray(q.options)) {
      for (const opt of q.options) {
        const origId = opt.originalId || opt.id;
        opt.originalId = origId;
        const compKey = `${q.id}::${origId}`;
        opt.kotobaIds = mapping.byCompositeKey[compKey] || mapping.options[q.id]?.[origId] || [];
      }
    }
  }
  return questions;
}

/**
 * Composite key resolver helper designed for T010.
 */
function getOptionKey(qId, opt) {
  const origId = opt.originalId || opt.id;
  return `${qId}::${origId}`;
}

// 1. Test unshuffled hydration
console.log('Test 1: Unshuffled question hydration');
const rawQuestions = structuredClone(bundle1.questions || bundle1);
const hydrated = hydrateKotoba(rawQuestions, mapping);

const sampleQ = hydrated.find(q => q.id === 'kunci1-q001');
console.log(`Question: ${sampleQ.id}`);
console.log(`Prompt kotobaIds (${sampleQ.kotobaIds.length}):`, sampleQ.kotobaIds);
for (const opt of sampleQ.options) {
  const compKey = getOptionKey(sampleQ.id, opt);
  console.log(`  Option ${opt.id} [${compKey}] kotobaIds (${opt.kotobaIds.length}):`, opt.kotobaIds);
}

// 2. Simulate buildExamQuestions option shuffle
console.log('\nTest 2: Shuffle option invariance');
const qToShuffle = structuredClone(bundle1.questions ? bundle1.questions[0] : bundle1[0]);

// Tag and reverse/permute options to simulate shuffle
const tagged = qToShuffle.options.map((opt, idx) => ({
  opt: structuredClone(opt),
  isCorrect: idx === qToShuffle.correctIndex
}));
// Force permutation: move index 2 to 0, 0 to 1, 1 to 2
const permuted = [tagged[2], tagged[0], tagged[1]];
qToShuffle.options = permuted.map((item, newIdx) => ({
  ...item.opt,
  originalId: item.opt.id || String.fromCharCode(65 + newIdx),
  id: String.fromCharCode(65 + newIdx)
}));

// Hydrate after shuffle
hydrateKotoba([qToShuffle], mapping);

for (const opt of qToShuffle.options) {
  const compKey = getOptionKey(qToShuffle.id, opt);
  console.log(`  Visual Id: ${opt.id} -> Original Id: ${opt.originalId} -> compKey: ${compKey} -> kotobaIds:`, opt.kotobaIds);
  // Verify that the kotobaIds match the original option
  const expected = mapping.options[qToShuffle.id][opt.originalId];
  if (JSON.stringify(opt.kotobaIds) !== JSON.stringify(expected)) {
    throw new Error(`Mismatch! Expected ${JSON.stringify(expected)}, got ${JSON.stringify(opt.kotobaIds)}`);
  }
}
console.log('  PASS: Option shuffle does NOT corrupt kotobaIds mapping!\n');

// 3. Verify all hydrated kotobaIds resolve to verified terms in sharedKotobaDictionary
console.log('Test 3: Dictionary resolution check');
let resolvedCount = 0;
for (const q of hydrated) {
  for (const kId of q.kotobaIds) {
    const term = dict.terms[kId];
    if (!term || term.status !== 'verified') {
      throw new Error(`Invalid kotoba reference in prompt: ${kId}`);
    }
    resolvedCount++;
  }
  for (const opt of q.options) {
    for (const kId of opt.kotobaIds) {
      const term = dict.terms[kId];
      if (!term || term.status !== 'verified') {
        throw new Error(`Invalid kotoba reference in option: ${kId}`);
      }
      resolvedCount++;
    }
  }
}
console.log(`  PASS: All ${resolvedCount} terms resolved cleanly to verified entries in sharedKotobaDictionary!\n`);

console.log('====================================================');
console.log('RUNTIME HYDRATION AND COMPOSITE KEY TESTS PASSED!');
console.log('====================================================');
