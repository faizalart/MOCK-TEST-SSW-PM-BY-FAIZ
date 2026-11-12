// scratch/assert-t010-option-key.mjs
import fs from 'node:fs';
import assert from 'node:assert/strict';

console.log('--- Feature 008 Task T010 Verification Suite ---');

// 1. Verify app.js definitions and syntax
const appCode = fs.readFileSync('app.js', 'utf8');
assert.ok(appCode.includes('function getOptionKey('), 'getOptionKey defined in app.js');
assert.ok(appCode.includes('window.getOptionKey = getOptionKey;'), 'Exported on window in app.js');
assert.ok(appCode.includes('item.opt.originalId != null'), 'buildExamQuestions preserves originalId without visual fallback');
console.log('✓ Check 1: app.js contains getOptionKey and shuffle-preserving originalId');

// 2. Extract helper functions for sandboxed testing
const helpersSource = appCode.substring(
  appCode.indexOf('function initSelectiveState(s) {'),
  appCode.indexOf('function renderExamSettingsPopover()')
);

const sandbox = {
  state: { activeSession: null },
  activeExam() { return sandbox.state.activeSession; }
};

const fnModule = new Function(
  'sandbox',
  `
  const { state, activeExam } = sandbox;
  ${helpersSource}
  return { initSelectiveState, getSelectiveState, getSelectiveQuestionState, getSelectiveOptionState, getOptionKey };
`
);

const { initSelectiveState, getSelectiveState, getSelectiveQuestionState, getSelectiveOptionState, getOptionKey } = fnModule(sandbox);

// 3. Test Priority of originalId over id & immutability
const optShuffled = { id: 'A', originalId: 'opt-orig-99', text: 'Sample text' };
const frozenOpt = Object.freeze({ id: 'B', originalId: 'opt-orig-frozen' });

assert.equal(getOptionKey('q-001', optShuffled), 'q-001::opt-orig-99', 'Must prioritize originalId over shuffled id');
assert.equal(getOptionKey('q-001', frozenOpt), 'q-001::opt-orig-frozen', 'Must work on frozen objects');
assert.equal(optShuffled.id, 'A', 'Must not mutate opt.id');
assert.equal(optShuffled.originalId, 'opt-orig-99', 'Must not mutate opt.originalId');

const optUnshuffled = { id: 'opt-orig-77', text: 'Unshuffled option' };
assert.equal(getOptionKey('q-001', optUnshuffled), 'q-001::opt-orig-77', 'Must use opt.id when originalId is absent');
console.log('✓ Check 2: Priority of originalId and object immutability verified');

// 4. Test Strict Rejection of Missing / Invalid Identifiers (Zero False Fallback)
assert.equal(getOptionKey(null, { id: 'A' }), null, 'Null qId returns null');
assert.equal(getOptionKey(undefined, { id: 'A' }), null, 'Undefined qId returns null');
assert.equal(getOptionKey('', { id: 'A' }), null, 'Empty string qId returns null');
assert.equal(getOptionKey('   ', { id: 'A' }), null, 'Whitespace qId returns null');
assert.equal(getOptionKey('q-001', null), null, 'Null opt returns null');
assert.equal(getOptionKey('q-001', undefined), null, 'Undefined opt returns null');
assert.equal(getOptionKey('q-001', {}), null, 'Empty opt returns null without fallback');
assert.equal(getOptionKey('q-001', { id: '' }), null, 'Empty id returns null without fallback');
assert.equal(getOptionKey('q-001', { id: '   ' }), null, 'Whitespace id returns null without fallback');
assert.equal(getOptionKey('q-001', { originalId: '', id: '' }), null, 'Empty originalId and id returns null');
assert.equal(getOptionKey('q-001', { originalId: '   ', id: '   ' }), null, 'Whitespace originalId and id returns null');
assert.equal(getOptionKey('q-001', { id: 'A', originalId: null }), null, 'Shuffled option with null originalId must reject with null without visual letter fallback');
assert.equal(getOptionKey('q-001', { id: 'A', originalId: '' }), null, 'Shuffled option with empty originalId must reject with null');
assert.equal(getOptionKey('q-001', { id: 'A', originalId: '   ' }), null, 'Shuffled option with whitespace originalId must reject with null');
console.log('✓ Check 3: Strict rejection of invalid identifiers (zero false fallbacks) verified');

// 5. Test Cross-Question Isolation
const optA = { id: 'A' };
const keyQ1 = getOptionKey('kunci1-q001', optA);
const keyQ2 = getOptionKey('kunci1-q002', optA);
assert.equal(keyQ1, 'kunci1-q001::A');
assert.equal(keyQ2, 'kunci1-q002::A');
assert.notEqual(keyQ1, keyQ2, 'Identical option IDs on different questions must yield distinct composite keys');
console.log('✓ Check 4: Cross-question isolation verified');

// 6. Test Full Bank Key Uniqueness & Coverage (1,006 questions, 3,110 options)
const staging = JSON.parse(fs.readFileSync('scratch/staging-extracted-vocab.json', 'utf8'));
const mapping = JSON.parse(fs.readFileSync('data/kotobaMapping.json', 'utf8'));

const globalCompositeKeys = new Set();
let totalBankOptions = 0;

for (const [qId, qData] of Object.entries(staging.questionsIndex)) {
  for (const opt of qData.options) {
    totalBankOptions++;
    const key = getOptionKey(qId, { id: opt.optionId });
    assert.ok(key, `Option ${opt.optionId} in ${qId} must generate a valid key`);
    assert.equal(key, `${qId}::${opt.optionId}`, `Composite key format match`);
    assert.ok(!globalCompositeKeys.has(key), `Key ${key} must be globally unique across bank`);
    globalCompositeKeys.add(key);

    // Verify sidecar mapping match
    assert.ok(mapping.byCompositeKey[key] !== undefined, `Key ${key} must exist in kotobaMapping.byCompositeKey`);
    assert.ok(mapping.options[qId] && mapping.options[qId][opt.optionId] !== undefined, `Option must exist in mapping.options`);
  }
}

assert.equal(totalBankOptions, 3110, 'Must process exactly 3,110 options');
assert.equal(globalCompositeKeys.size, 3110, 'Must have exactly 3,110 unique composite keys');
assert.equal(Object.keys(mapping.byCompositeKey).length, 3110, 'Sidecar mapping contains exactly 3,110 keys');
console.log('✓ Check 5: Full bank coverage and uniqueness verified (3,110 options across 1,006 questions)');

// 7. Test Deterministic Repeated Shuffling Invariance
// Simulate buildExamQuestions shuffling logic deterministically
function simulateShuffle(options, seed = 42) {
  // Simple LCG pseudo-random for deterministic permutation
  let s = seed;
  function prng() {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  }
  const copy = options.map(opt => structuredClone(opt));
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(prng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.map((item, newIdx) => ({
    ...item,
    originalId: item.originalId || item.id || String.fromCharCode(65 + newIdx),
    id: String.fromCharCode(65 + newIdx)
  }));
}

const testQId = 'kunci1-q001';
const initialOptions = [
  { id: 'A', text: 'Option A Content' },
  { id: 'B', text: 'Option B Content' },
  { id: 'C', text: 'Option C Content' }
];

const preShuffleKeys = initialOptions.map(opt => ({
  text: opt.text,
  key: getOptionKey(testQId, opt)
}));

// Run 50 cycles of shuffling, feeding shuffled result back into next shuffle
let currentOptions = initialOptions;
for (let cycle = 1; cycle <= 50; cycle++) {
  currentOptions = simulateShuffle(currentOptions, 1000 + cycle);
  for (const opt of currentOptions) {
    const key = getOptionKey(testQId, opt);
    const expected = preShuffleKeys.find(p => p.text === opt.text);
    assert.equal(key, expected.key, `Cycle ${cycle}: Key for text "${opt.text}" must remain invariant regardless of visual letter ${opt.id}`);
  }
}
console.log('✓ Check 6: Deterministic repeated shuffling invariance (50 cycles) verified');

// 8. Test Integration with Selective State
const session = {
  id: 'exam_test_selective_integration',
  mode: 'practice',
  currentIndex: 0,
  questions: [{ id: 'kunci1-q001' }],
  answers: {}
};
initSelectiveState(session);

// Reveal translation on original Option B before shuffle
const optB_orig = initialOptions[1]; // id: 'B'
const stateBefore = getSelectiveOptionState(session, testQId, optB_orig, true);
stateBefore.translation = true;
stateBefore.kotoba = true;

// Retrieve using composite key string
const stateByCompositeKey = getSelectiveOptionState(session, testQId, 'kunci1-q001::B', false);
assert.equal(stateByCompositeKey, stateBefore, 'getSelectiveOptionState must resolve via composite key string');

// Retrieve using original ID string
const stateByOrigId = getSelectiveOptionState(session, testQId, 'B', false);
assert.equal(stateByOrigId, stateBefore, 'getSelectiveOptionState must resolve via origOptId string');

// Simulate shuffle where Option B moves to position 0 (visual letter 'A')
const shuffledOptions = [
  { id: 'A', originalId: 'B', text: 'Option B Content' },
  { id: 'B', originalId: 'C', text: 'Option C Content' },
  { id: 'C', originalId: 'A', text: 'Option A Content' }
];

// Look up state using the shuffled option at visual index 0 (which has visual letter 'A')
const stateAfterShuffle = getSelectiveOptionState(session, testQId, shuffledOptions[0], false);
assert.equal(stateAfterShuffle, stateBefore, 'State must follow the option content, NOT the visual letter A');
assert.equal(stateAfterShuffle.translation, true, 'Translation flag preserved after shuffle');
assert.equal(stateAfterShuffle.kotoba, true, 'Kotoba flag preserved after shuffle');

// Look up untouched options
const stateUntouched = getSelectiveOptionState(session, testQId, shuffledOptions[1], false);
assert.equal(stateUntouched, null, 'Untouched option remains null in sparse state');

console.log('✓ Check 7: Integration with selective state across shuffling verified');

console.log('----------------------------------------------------');
console.log('All T010 Stable Composite Option Key assertions passed!');
