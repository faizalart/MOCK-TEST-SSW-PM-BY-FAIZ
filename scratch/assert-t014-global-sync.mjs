// scratch/assert-t014-global-sync.mjs
import fs from 'node:fs';
import assert from 'node:assert/strict';

console.log('--- Feature 008 Task T014 Global Sync & Override Interaction Verification ---');

// 1. Verify app.js definitions
const appCode = fs.readFileSync('app.js', 'utf8');
assert.ok(appCode.includes('function resetSelectiveTranslationOverrides('), 'resetSelectiveTranslationOverrides defined in app.js');
assert.ok(appCode.includes("case 'toggle-practice-translation':"), "case 'toggle-practice-translation' in handleAction");
assert.ok(appCode.includes('resetSelectiveTranslationOverrides(s);'), 'resetSelectiveTranslationOverrides called on toggle-practice-translation');
assert.ok(appCode.includes('window.resetSelectiveTranslationOverrides = resetSelectiveTranslationOverrides;'), 'Exported on window');
console.log('✔ Check 1: app.js contains resetSelectiveTranslationOverrides and handleAction integration');

// 2. Set up virtual DOM / sandbox environment to test handleAction, renderExam, and toggleSelectiveTrans
let capturedHTML = '';
const mockView = {
  get innerHTML() { return capturedHTML; },
  set innerHTML(val) { capturedHTML = val; }
};

const mockDoc = {
  body: { classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } } },
  documentElement: { classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } } },
  addEventListener() {}
};

const sandbox = {
  window: { scrollTo() {} },
  document: mockDoc,
  view: mockView,
  state: {
    page: 'exam',
    activeSession: null,
    practiceTranslationOpen: false,
    mapHidden: false,
    examSettingsOpen: false,
    examPrefs: { showFurigana: false },
    confirmResolve: null,
    lang: 'id'
  },
  activeExam() { return sandbox.state.activeSession; },
  currentExamQuestion(s) { return s?.questions?.[s.currentIndex] || null; },
  answeredCount(s) { return (s?.questions || []).filter(q => s.answers[q.id] != null).length; },
  isFullscreenActive() { return false; },
  isQuestionInStudy() { return false; },
  getOptionMedia() { return null; },
  getQuestionMainMedia() { return null; },
  getExamPackageDisplayName() { return 'Paket Ujian 1'; },
  mediaURL(m) { return m; },
  fmtDurationHMS(s) { return '01:10:00'; },
  esc(str) { return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); },
  t(k) { return k; },
  richHTML(s) { return s; },
  renderExamSettingsPopover() { return '<aside id="exam-settings-popover"></aside>'; },
  applyExamPrefs() {},
  syncExamViewportAfterResume() {},
  finishExam() {}
};

// Extract selective helpers, renderExam, and handleAction
const helpersCode = appCode.substring(
  appCode.indexOf('function initSelectiveState(s) {'),
  appCode.indexOf('function renderExamSettingsPopover()')
);

const renderExamCode = appCode.substring(
  appCode.indexOf('function renderExam() {'),
  appCode.indexOf('async function persistExam() {')
);

const handleActionCode = appCode.substring(
  appCode.indexOf('async function handleAction(action, el) {'),
  appCode.indexOf('document.addEventListener(\'submit\', async e => {')
);

const testRunnerFn = new Function(
  'sandbox',
  `
  const {
    window, document, view, state, activeExam, currentExamQuestion, answeredCount,
    isFullscreenActive, isQuestionInStudy, getOptionMedia, getQuestionMainMedia,
    getExamPackageDisplayName, mediaURL, fmtDurationHMS, esc, t, richHTML,
    renderExamSettingsPopover, applyExamPrefs, syncExamViewportAfterResume, finishExam
  } = sandbox;

  ${helpersCode}
  ${renderExamCode}
  ${handleActionCode}

  return {
    renderExam,
    handleAction,
    initSelectiveState,
    getSelectiveQuestionState,
    getSelectiveOptionState,
    getOptionKey,
    toggleSelectiveTrans,
    resetSelectiveTranslationOverrides
  };
`
);

const {
  renderExam,
  handleAction,
  initSelectiveState,
  getSelectiveQuestionState,
  getSelectiveOptionState,
  getOptionKey,
  toggleSelectiveTrans,
  resetSelectiveTranslationOverrides
} = testRunnerFn(sandbox);

assert.equal(typeof resetSelectiveTranslationOverrides, 'function', 'resetSelectiveTranslationOverrides must be a function');

// 3. Test Session Setup
const mockQ1 = {
  id: 'q-sync-101',
  instructions: '正しいものを一つ選びなさい。',
  prompt: '食品工場での衛生管理について適切なものはどれか。',
  promptTranslation: 'Manakah yang tepat mengenai manajemen kebersihan di pabrik makanan?',
  options: [
    { id: 'A', originalId: 'opt-orig-1', text: '床に落ちた原料をそのまま使う。', translation: 'Menggunakan langsung bahan baku yang jatuh ke lantai.' },
    { id: 'B', originalId: 'opt-orig-2', text: '定期的に手を洗う。', translation: 'Mencuci tangan secara berkala.' },
    { id: 'C', originalId: 'opt-orig-3', text: '作業着を私服の上に着ない。', translation: 'Tidak memakai pakaian kerja di luar pakaian biasa.' }
  ]
};

const mockQ2 = {
  id: 'q-sync-102',
  instructions: '正しいものを一つ選びなさい。',
  prompt: '5Sの「清掃」にあたる行動はどれか。',
  promptTranslation: 'Manakah tindakan yang termasuk dalam "Seisou" pada 5S?',
  options: [
    { id: 'A', originalId: 'opt-orig-4', text: '機械の汚れを拭き取る。', translation: 'Menyeka kotoran pada mesin.' },
    { id: 'B', originalId: 'opt-orig-5', text: '不要なものを捨てる。', translation: 'Membuang barang yang tidak diperlukan.' }
  ]
};

const session = {
  id: 'session-test-t014',
  mode: 'practice',
  deadline: null,
  timed: false,
  currentIndex: 0,
  questions: [mockQ1, mockQ2],
  answers: { 'q-sync-101': 1 },
  flaggedQuestions: []
};

initSelectiveState(session);
sandbox.state.activeSession = session;
sandbox.state.practiceTranslationOpen = false;

// Helper to determine effective visibility exactly as renderExam() does
function getEffectiveTrans(s, qId, optKey = null) {
  if (optKey) {
    const optState = getSelectiveOptionState(s, qId, optKey, false);
    return (optState && optState.translation !== null && optState.translation !== undefined)
      ? Boolean(optState.translation)
      : Boolean(sandbox.state.practiceTranslationOpen);
  }
  const qState = getSelectiveQuestionState(s, qId, false);
  return (qState && qState.translation !== null && qState.translation !== undefined)
    ? Boolean(qState.translation)
    : Boolean(sandbox.state.practiceTranslationOpen);
}

// -------------------------------------------------------------
// Test 1: Initial state (Globe OFF, all overrides null)
// -------------------------------------------------------------
console.log('Testing 1: Initial state (Globe OFF, overrides null)');
assert.equal(sandbox.state.practiceTranslationOpen, false);
renderExam();
assert.ok(!capturedHTML.includes('Manakah yang tepat'), 'Prompt translation not rendered in DOM');
assert.ok(!capturedHTML.includes('Mencuci tangan secara berkala'), 'Option translation not rendered in DOM');
assert.equal(getEffectiveTrans(session, 'q-sync-101'), false, 'Prompt translation hidden by default');
assert.equal(getEffectiveTrans(session, 'q-sync-101', 'q-sync-101::opt-orig-1'), false, 'Option 1 translation hidden by default');
assert.equal(getEffectiveTrans(session, 'q-sync-101', 'q-sync-101::opt-orig-2'), false, 'Option 2 translation hidden by default');
console.log('✔ Test 1 passed.');

// -------------------------------------------------------------
// Test 2: Toggle Globe ON via handleAction('toggle-practice-translation')
// -------------------------------------------------------------
console.log('Testing 2: Toggle Globe ON');
const mockGlobeBtn = { dataset: { action: 'toggle-practice-translation' } };
await handleAction('toggle-practice-translation', mockGlobeBtn);

assert.equal(sandbox.state.practiceTranslationOpen, true, 'Globe state should be true');
assert.equal(getEffectiveTrans(session, 'q-sync-101'), true, 'Prompt translation visible when Globe ON');
assert.equal(getEffectiveTrans(session, 'q-sync-101', 'q-sync-101::opt-orig-1'), true, 'Option 1 translation visible when Globe ON');
assert.equal(getEffectiveTrans(session, 'q-sync-101', 'q-sync-101::opt-orig-2'), true, 'Option 2 translation visible when Globe ON');
assert.ok(capturedHTML.includes('Manakah yang tepat'), 'Prompt translation rendered in DOM');
assert.ok(capturedHTML.includes('Mencuci tangan secara berkala'), 'Option translation rendered in DOM');
console.log('✔ Test 2 passed.');

// -------------------------------------------------------------
// Test 3: Local Override on Option 1 while Globe is ON (Quickstart Scenario 4)
// -------------------------------------------------------------
console.log('Testing 3: Local Override on Option 1 while Globe is ON');
const opt1Key = 'q-sync-101::opt-orig-1';
const opt1StateBefore = getSelectiveOptionState(session, 'q-sync-101', opt1Key, true);
assert.equal(opt1StateBefore.translation, null);

toggleSelectiveTrans(session, 'q-sync-101', opt1Key);
assert.equal(opt1StateBefore.translation, false, 'Option 1 should have explicit translation = false');

// Verify Option 1 is hidden while Option 2, 3, and prompt remain visible
assert.equal(getEffectiveTrans(session, 'q-sync-101', opt1Key), false, 'Option 1 translation should now be hidden');
assert.equal(getEffectiveTrans(session, 'q-sync-101', 'q-sync-101::opt-orig-2'), true, 'Option 2 translation remains visible');
assert.equal(getEffectiveTrans(session, 'q-sync-101', 'q-sync-101::opt-orig-3'), true, 'Option 3 translation remains visible');
assert.equal(getEffectiveTrans(session, 'q-sync-101'), true, 'Prompt translation remains visible');

renderExam();
assert.ok(!capturedHTML.includes('Menggunakan langsung bahan baku'), 'Option 1 hidden in DOM');
assert.ok(capturedHTML.includes('Mencuci tangan secara berkala'), 'Option 2 visible in DOM');
assert.ok(capturedHTML.includes('Manakah yang tepat'), 'Prompt visible in DOM');
console.log('✔ Test 3 passed.');

// -------------------------------------------------------------
// Test 4: Local Override on Prompt while Globe is ON
// -------------------------------------------------------------
console.log('Testing 4: Local Override on Prompt while Globe is ON');
const qStateBefore = getSelectiveQuestionState(session, 'q-sync-101', true);
assert.equal(qStateBefore.translation, null);

toggleSelectiveTrans(session, 'q-sync-101', null);
assert.equal(qStateBefore.translation, false, 'Prompt should have explicit translation = false');
assert.equal(getEffectiveTrans(session, 'q-sync-101'), false, 'Prompt translation should now be hidden');
assert.equal(getEffectiveTrans(session, 'q-sync-101', 'q-sync-101::opt-orig-2'), true, 'Option 2 still visible');

renderExam();
assert.ok(!capturedHTML.includes('Manakah yang tepat'), 'Prompt hidden in DOM');
assert.ok(capturedHTML.includes('Mencuci tangan secara berkala'), 'Option 2 still visible in DOM');
console.log('✔ Test 4 passed.');

// -------------------------------------------------------------
// Test 5: Toggle Globe OFF resets all row overrides (FR-032, Scenario 4 step 5)
// -------------------------------------------------------------
console.log('Testing 5: Toggle Globe OFF resets all row overrides uniformly');
await handleAction('toggle-practice-translation', mockGlobeBtn);

assert.equal(sandbox.state.practiceTranslationOpen, false, 'Globe state should be false');
// Verify all overrides were reset to null
assert.equal(getSelectiveQuestionState(session, 'q-sync-101').translation, null, 'Prompt override reset to null');
assert.equal(getSelectiveOptionState(session, 'q-sync-101', opt1Key).translation, null, 'Option 1 override reset to null');

// Verify all translations are now uniformly hidden
assert.equal(getEffectiveTrans(session, 'q-sync-101'), false, 'Prompt translation hidden');
assert.equal(getEffectiveTrans(session, 'q-sync-101', opt1Key), false, 'Option 1 translation hidden');
assert.equal(getEffectiveTrans(session, 'q-sync-101', 'q-sync-101::opt-orig-2'), false, 'Option 2 translation hidden');
assert.equal(getEffectiveTrans(session, 'q-sync-101', 'q-sync-101::opt-orig-3'), false, 'Option 3 translation hidden');

assert.ok(!capturedHTML.includes('Manakah yang tepat'), 'Prompt hidden in DOM');
assert.ok(!capturedHTML.includes('Menggunakan langsung bahan baku'), 'Option 1 hidden in DOM');
assert.ok(!capturedHTML.includes('Mencuci tangan secara berkala'), 'Option 2 hidden in DOM');
console.log('✔ Test 5 passed.');

// -------------------------------------------------------------
// Test 6: Kotoba independence (FR-033)
// -------------------------------------------------------------
console.log('Testing 6: Kotoba independence when Globe toggles (FR-033)');
// Set Kotoba states to true
const qState = getSelectiveQuestionState(session, 'q-sync-101', true);
qState.kotoba = true;
const optState = getSelectiveOptionState(session, 'q-sync-101', opt1Key, true);
optState.kotoba = true;

// Toggle Globe ON
await handleAction('toggle-practice-translation', mockGlobeBtn);
assert.equal(sandbox.state.practiceTranslationOpen, true);
assert.equal(qState.kotoba, true, 'Prompt kotoba flag must remain true');
assert.equal(optState.kotoba, true, 'Option kotoba flag must remain true');

// Toggle Globe OFF
await handleAction('toggle-practice-translation', mockGlobeBtn);
assert.equal(sandbox.state.practiceTranslationOpen, false);
assert.equal(qState.kotoba, true, 'Prompt kotoba flag must STILL remain true');
assert.equal(optState.kotoba, true, 'Option kotoba flag must STILL remain true');
console.log('✔ Test 6 passed.');

// -------------------------------------------------------------
// Test 7: Multi-question session reset across all questions
// -------------------------------------------------------------
console.log('Testing 7: Multi-question session reset across all questions');
// Set overrides on Q1 and Q2
const q1Opt2 = getSelectiveOptionState(session, 'q-sync-101', 'q-sync-101::opt-orig-2', true);
q1Opt2.translation = true;
const q2Prompt = getSelectiveQuestionState(session, 'q-sync-102', true);
q2Prompt.translation = true;
const q2Opt1 = getSelectiveOptionState(session, 'q-sync-102', 'q-sync-102::opt-orig-4', true);
q2Opt1.translation = false;

// Trigger reset
resetSelectiveTranslationOverrides(session);

assert.equal(q1Opt2.translation, null, 'Q1 Option 2 override reset to null');
assert.equal(q2Prompt.translation, null, 'Q2 Prompt override reset to null');
assert.equal(q2Opt1.translation, null, 'Q2 Option 1 override reset to null');
console.log('✔ Test 7 passed.');

// -------------------------------------------------------------
// Test 8: Answer selection and navigation preserved
// -------------------------------------------------------------
console.log('Testing 8: Answer selection and navigation preserved');
assert.equal(session.answers['q-sync-101'], 1, 'Answer selection preserved');
assert.equal(session.currentIndex, 0, 'Current index preserved');
console.log('✔ Test 8 passed.');

// -------------------------------------------------------------
// Test 9: Mode isolation (Timed/Mock sessions unaffected)
// -------------------------------------------------------------
console.log('Testing 9: Mode isolation (Timed/Mock sessions unaffected)');
const timedSession = {
  id: 'session-timed',
  mode: 'full',
  deadline: Date.now() + 10000,
  timed: true,
  questions: [mockQ1],
  answers: {}
};
sandbox.state.activeSession = timedSession;
const prevGlobeState = sandbox.state.practiceTranslationOpen;

await handleAction('toggle-practice-translation', mockGlobeBtn);
assert.equal(sandbox.state.practiceTranslationOpen, prevGlobeState, 'Timed session must not toggle globe state');
console.log('✔ Test 9 passed.');

console.log('--- ALL T014 GLOBAL SYNC TESTS PASSED 100%! ---');
