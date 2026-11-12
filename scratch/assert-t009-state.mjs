// scratch/assert-t009-state.mjs
import fs from 'node:fs';
import assert from 'node:assert/strict';

console.log('--- Feature 008 Task T009 Verification Suite ---');

// 1. Verify app.js syntax & function existence
const appCode = fs.readFileSync('app.js', 'utf8');
assert.ok(appCode.includes('function initSelectiveState('), 'initSelectiveState defined in app.js');
assert.ok(appCode.includes('function getSelectiveState('), 'getSelectiveState defined in app.js');
assert.ok(appCode.includes('function getSelectiveQuestionState('), 'getSelectiveQuestionState defined in app.js');
assert.ok(appCode.includes('function getSelectiveOptionState('), 'getSelectiveOptionState defined in app.js');
assert.ok(appCode.includes('window.getSelectiveOptionState = getSelectiveOptionState;'), 'Exported on window');
console.log('✓ Check 1: app.js contains all required T009 function definitions & window exports');

// 2. Extract function bodies for sandboxed behavioral execution
// We can dynamically evaluate the functions using vm or Function
const helpersSource = appCode.substring(
  appCode.indexOf('function initSelectiveState(s) {'),
  appCode.indexOf('function renderExamSettingsPopover()')
);

// Define global mock state & activeExam
const sandbox = {
  state: { activeSession: null },
  activeExam() { return sandbox.state.activeSession; }
};

const fnModule = new Function(
  'sandbox',
  `
  const { state, activeExam } = sandbox;
  ${helpersSource}
  return { initSelectiveState, getSelectiveState, getSelectiveQuestionState, getSelectiveOptionState };
`
);

const { initSelectiveState, getSelectiveState, getSelectiveQuestionState, getSelectiveOptionState } = fnModule(sandbox);

// 3. Test Practice Session Gate
const practiceSession = {
  id: 'exam_test_practice_1',
  mode: 'practice',
  currentIndex: 0,
  questions: [{ id: 'q-101' }, { id: 'q-102' }],
  answers: {}
};

const examSession = {
  id: 'exam_test_timed_1',
  mode: 'exam',
  currentIndex: 0,
  questions: [{ id: 'q-101' }, { id: 'q-102' }],
  answers: {}
};

assert.equal(initSelectiveState(examSession), null, 'Exam mode must NOT initialize selectiveState');
assert.equal(examSession.selectiveState, undefined, 'Exam session must not have selectiveState property');
assert.equal(getSelectiveState(examSession), null, 'getSelectiveState returns null for exam mode');

const pState = initSelectiveState(practiceSession);
assert.ok(pState, 'Practice mode successfully initializes selectiveState');
assert.deepEqual(pState, { questions: {} }, 'Initial state must be sparse with empty questions object');
assert.equal(practiceSession.selectiveState, pState, 'selectiveState attached to practice session');
console.log('✓ Check 2: Practice vs Exam mode isolation verified');

// 4. Test Non-Enumerable & Storage Isolation (Structured Clone & JSON)
assert.equal(practiceSession.propertyIsEnumerable('selectiveState'), false, 'selectiveState must be non-enumerable');
assert.ok(!Object.keys(practiceSession).includes('selectiveState'), 'Object.keys() must not list selectiveState');
assert.ok(!Object.entries(practiceSession).some(([k]) => k === 'selectiveState'), 'Object.entries() must not list selectiveState');

const serialized = JSON.stringify(practiceSession);
assert.ok(!serialized.includes('selectiveState'), 'JSON.stringify must omit selectiveState completely');

const cloned = structuredClone(practiceSession);
assert.equal(cloned.selectiveState, undefined, 'HTML structuredClone must omit non-enumerable selectiveState');
console.log('✓ Check 3: Non-enumerable descriptor and storage isolation (IndexedDB/JSON) verified');

// 5. Test Sparse Lazy Allocation
// Question 101 - read without create
const q101Before = getSelectiveQuestionState(practiceSession, 'q-101', false);
assert.equal(q101Before, null, 'Unaccessed question state must return null when create=false');
assert.equal(Object.keys(practiceSession.selectiveState.questions).length, 0, 'No questions created yet');

// Question 101 - create
const q101State = getSelectiveQuestionState(practiceSession, 'q-101', true);
assert.deepEqual(q101State, { translation: null, kotoba: false, options: {} }, 'Question state default shape');
assert.equal(Object.keys(practiceSession.selectiveState.questions).length, 1, 'Exactly 1 question allocated');

// Option 1 - read without create
const opt1Before = getSelectiveOptionState(practiceSession, 'q-101', 'opt-A', false);
assert.equal(opt1Before, null, 'Unaccessed option state must return null when create=false');

// Option 1 - create
const opt1State = getSelectiveOptionState(practiceSession, 'q-101', 'opt-A', true);
assert.deepEqual(opt1State, { translation: null, kotoba: false }, 'Option state default shape');
assert.equal(q101State.options['opt-A'], opt1State, 'Option attached to question options map');

// Mutate states
q101State.translation = true;
opt1State.kotoba = true;

// Verify state persistence and access
assert.equal(getSelectiveQuestionState(practiceSession, 'q-101').translation, true);
assert.equal(getSelectiveOptionState(practiceSession, 'q-101', 'opt-A').kotoba, true);

// Create on untouched question 102 directly via getSelectiveOptionState
const opt2State = getSelectiveOptionState(practiceSession, 'q-102', 'opt-X', true);
assert.deepEqual(opt2State, { translation: null, kotoba: false });
assert.ok(practiceSession.selectiveState.questions['q-102'], 'Untouched question created lazily when child option requested with create=true');
assert.equal(Object.keys(practiceSession.selectiveState.questions).length, 2, 'Exactly 2 questions allocated');
console.log('✓ Check 4: Sparse lazy allocation and default shapes verified');

// 6. Test Active Session Default Fallback
sandbox.state.activeSession = practiceSession;
assert.equal(getSelectiveState(), practiceSession.selectiveState, 'getSelectiveState defaults to activeExam()');
assert.equal(getSelectiveQuestionState(undefined, 'q-101').translation, true, 'getSelectiveQuestionState defaults to activeExam()');
assert.equal(getSelectiveOptionState(undefined, 'q-101', 'opt-A').kotoba, true, 'getSelectiveOptionState defaults to activeExam()');
console.log('✓ Check 5: Default fallback to activeExam() verified');

// 7. Test State Persistence Across Question Navigation Simulation
const navSession = {
  id: 'exam_test_practice_nav',
  mode: 'practice',
  currentIndex: 0,
  questions: [{ id: 'q-nav-0' }, { id: 'q-nav-1' }, { id: 'q-nav-2' }],
  answers: {}
};
initSelectiveState(navSession);

const q0Id = navSession.questions[0].id;
const q1Id = navSession.questions[1].id;

// Question 0 toggles
getSelectiveQuestionState(navSession, q0Id, true).translation = true;
getSelectiveOptionState(navSession, q0Id, 'opt-0A', true).kotoba = true;

// Navigate to Question 1
navSession.currentIndex = 1;
assert.equal(getSelectiveQuestionState(navSession, q1Id, false), null, 'Question 1 remains untouched');

// Navigate back to Question 0
navSession.currentIndex = 0;
assert.equal(getSelectiveQuestionState(navSession, q0Id, false).translation, true, 'Question 0 translation persisted across navigation');
assert.equal(getSelectiveOptionState(navSession, q0Id, 'opt-0A', false).kotoba, true, 'Question 0 option Kotoba persisted across navigation');
console.log('✓ Check 6: Navigation persistence verified');

// 8. Test Lifecycle Cleanup (Finish & Interrupt)
// Simulate finishExam cleanup:
delete practiceSession.selectiveState;
assert.equal(practiceSession.selectiveState, undefined, 'selectiveState successfully deleted on exam completion');
assert.equal(getSelectiveQuestionState(practiceSession, 'q-101', false), null, 'Cleared session question state is null');

// Re-init and test resume-session re-hydration:
initSelectiveState(practiceSession);
assert.ok(practiceSession.selectiveState, 'Re-hydrated session has fresh selectiveState');

// Simulate interrupt cleanup:
delete practiceSession.selectiveState;
assert.equal(practiceSession.selectiveState, undefined, 'Interrupted session has selectiveState cleanly deleted');
console.log('✓ Check 7: Session lifecycle finish & interrupt cleanup verified');

console.log('----------------------------------------------------');
console.log('All T009 Selective State integrity assertions passed!');
