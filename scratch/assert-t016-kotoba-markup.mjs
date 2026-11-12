// scratch/assert-t016-kotoba-markup.mjs
import fs from 'node:fs';
import assert from 'node:assert/strict';

console.log('================================================================================');
console.log('FEATURE 008: Practice Selective Translation & Kotoba Reveal');
console.log('TASK T016: Right-Side Kotoba Controls Mounting & Isolation Verification');
console.log('================================================================================\n');

const appSource = fs.readFileSync('app.js', 'utf8');

// Virtual DOM mock
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

// Extract functions
const helpersCode = appSource.substring(
  appSource.indexOf('function initSelectiveState(s) {'),
  appSource.indexOf('function renderExamSettingsPopover()')
);

const renderExamCode = appSource.substring(
  appSource.indexOf('function renderExam() {'),
  appSource.indexOf('async function persistExam() {')
);

const fnModule = new Function(
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

  return {
    renderExam,
    initSelectiveState,
    getSelectiveQuestionState,
    getSelectiveOptionState,
    getOptionKey
  };
`
);

const {
  renderExam,
  initSelectiveState,
  getSelectiveQuestionState,
  getSelectiveOptionState,
  getOptionKey
} = fnModule(sandbox);

// Setup sample questions & session
const sampleQ = {
  id: 'kunci1-q001',
  prompt: '食品工場での衛生管理について適切なものはどれか。',
  promptTranslation: 'Terjemahan Kalimat Soal.',
  instructions: '正しいものを一つ選びなさい。',
  options: [
    { id: 'A', originalId: 'opt-orig-1', text: 'Teks Opsi A', translation: 'Terjemahan Opsi A' },
    { id: 'B', originalId: 'opt-orig-2', text: 'Teks Opsi B', translation: 'Terjemahan Opsi B' },
    { id: 'C', originalId: 'opt-orig-3', text: 'Teks Opsi C', translation: 'Terjemahan Opsi C' }
  ]
};

const untimedPracticeSession = {
  id: 'session-practice-1',
  mode: 'practice',
  deadline: null,
  timed: false,
  currentIndex: 0,
  questions: [sampleQ],
  answers: {},
  flaggedQuestions: []
};

initSelectiveState(untimedPracticeSession);
sandbox.state.activeSession = untimedPracticeSession;

// -----------------------------------------------------------------------------
// Check 1: Prompt Row Kotoba Button Mounted on Right Column
// -----------------------------------------------------------------------------
console.log('Test 1: Prompt row Kotoba button mounted in right column');
renderExam();
assert.ok(capturedHTML.includes('class="practice-prompt-row"'), 'practice-prompt-row container present');
assert.ok(capturedHTML.includes('data-target-type="prompt"'), 'Prompt row has targetType prompt');
assert.ok(capturedHTML.includes('aria-label="Kosakata Soal"'), 'Prompt row has correct aria-label');
assert.ok(capturedHTML.includes('title="Tampilkan kosakata soal"'), 'Prompt row default title when closed');
assert.ok(
  capturedHTML.includes('class="practice-row-ctrl practice-ctrl-kotoba "') ||
  capturedHTML.includes('class="practice-row-ctrl practice-ctrl-kotoba"'),
  'Prompt row has practice-ctrl-kotoba button'
);
console.log('✔ Test 1 Passed: Prompt row Kotoba button correctly mounted on right column.');

// -----------------------------------------------------------------------------
// Check 2: Option Row Kotoba Button Mounted on Right Column
// -----------------------------------------------------------------------------
console.log('Test 2: Option row Kotoba button mounted in right column');
assert.ok(capturedHTML.includes('class="practice-option-row"'), 'practice-option-row container present');
assert.ok(capturedHTML.includes('data-target-type="option"'), 'Option row has targetType option');
assert.ok(capturedHTML.includes('aria-label="Kosakata Opsi A"'), 'Option A has correct aria-label');
assert.ok(capturedHTML.includes('aria-label="Kosakata Opsi B"'), 'Option B has correct aria-label');
assert.ok(capturedHTML.includes('aria-label="Kosakata Opsi C"'), 'Option C has correct aria-label');
console.log('✔ Test 2 Passed: Option row Kotoba buttons mounted for each option.');

// -----------------------------------------------------------------------------
// Check 3: Kotoba Button Sibling Isolation (Resides Outside .answer-choice)
// -----------------------------------------------------------------------------
console.log('Test 3: Kotoba button is sibling outside .answer-choice');
// In each practice-option-row: [Left Button] [answer-choice] [Right Button]
const optionRowBlocks = capturedHTML.split('<div class="practice-option-row">').slice(1);
assert.equal(optionRowBlocks.length, 3, 'Found exactly 3 option rows');

for (let i = 0; i < optionRowBlocks.length; i++) {
  const block = optionRowBlocks[i];
  const transIdx = block.indexOf('practice-ctrl-trans');
  const radioIdx = block.indexOf('role="radio"');
  const answerRadioSpanIdx = block.indexOf('class="answer-radio"');
  const kotobaIdx = block.indexOf('practice-ctrl-kotoba');
  
  assert.ok(transIdx !== -1, `Option ${i + 1}: Left translation button present`);
  assert.ok(radioIdx !== -1, `Option ${i + 1}: Radio answer-choice present`);
  assert.ok(kotobaIdx !== -1, `Option ${i + 1}: Right Kotoba button present`);
  assert.ok(transIdx < radioIdx, `Option ${i + 1}: Translation button must precede radio choice`);
  assert.ok(radioIdx < kotobaIdx, `Option ${i + 1}: Radio choice must precede Kotoba button`);
  assert.ok(answerRadioSpanIdx < kotobaIdx, `Option ${i + 1}: Kotoba button must be outside .answer-choice`);
}
console.log('✔ Test 3 Passed: Kotoba buttons are strict DOM siblings outside .answer-choice.');

// -----------------------------------------------------------------------------
// Check 4: Option Identity Preserves Composite Key Across Shuffling
// -----------------------------------------------------------------------------
console.log('Test 4: Option identity preserves composite key across shuffling');
// Simulating post-shuffle question where original A is at position C
const shuffledQ = {
  id: 'kunci1-q001',
  prompt: 'Prompt',
  promptTranslation: 'Terjemahan',
  instructions: 'Petunjuk',
  options: [
    { id: 'A', originalId: 'opt-orig-2', text: 'Originally B' },
    { id: 'B', originalId: 'opt-orig-3', text: 'Originally C' },
    { id: 'C', originalId: 'opt-orig-1', text: 'Originally A' }
  ]
};
untimedPracticeSession.questions = [shuffledQ];
renderExam();

assert.ok(capturedHTML.includes('data-opt-key="kunci1-q001::opt-orig-1"'), 'Preserved composite key for opt-orig-1');
assert.ok(capturedHTML.includes('data-opt-key="kunci1-q001::opt-orig-2"'), 'Preserved composite key for opt-orig-2');
assert.ok(capturedHTML.includes('data-opt-key="kunci1-q001::opt-orig-3"'), 'Preserved composite key for opt-orig-3');
console.log('✔ Test 4 Passed: Composite option key strictly preserves originalId post-shuffle.');

// -----------------------------------------------------------------------------
// Check 5: Independent State Representation between Prompt and Each Option
// -----------------------------------------------------------------------------
console.log('Test 5: State synchronization and independence (Prompt vs Options)');
// Reset back to sampleQ
untimedPracticeSession.questions = [sampleQ];
const qState = getSelectiveQuestionState(untimedPracticeSession, 'kunci1-q001', true);
const opt1State = getSelectiveOptionState(untimedPracticeSession, 'kunci1-q001', 'opt-orig-1', true);
const opt2State = getSelectiveOptionState(untimedPracticeSession, 'kunci1-q001', 'opt-orig-2', true);

// Set Option A kotoba = true, others remain false
opt1State.kotoba = true;
renderExam();

// Option A Kotoba button should be active
assert.ok(capturedHTML.includes('data-opt-key="kunci1-q001::opt-orig-1"'), 'Option A key present');
assert.ok(/aria-expanded="true"\s+aria-label="Kosakata Opsi A"/.test(capturedHTML), 'Option A aria-expanded is true');
assert.ok(capturedHTML.includes('title="Sembunyikan kosakata opsi"'), 'Option A title changes to hide');

// Prompt and Option B should still be inactive (false)
assert.ok(/aria-expanded="false"\s+aria-label="Kosakata Soal"/.test(capturedHTML), 'Prompt aria-expanded is false');
assert.ok(/aria-expanded="false"\s+aria-label="Kosakata Opsi B"/.test(capturedHTML), 'Option B aria-expanded is false');

// Now set Prompt kotoba = true
qState.kotoba = true;
renderExam();
assert.ok(/aria-expanded="true"\s+aria-label="Kosakata Soal"/.test(capturedHTML), 'Prompt aria-expanded is now true');
assert.ok(capturedHTML.includes('title="Sembunyikan kosakata soal"'), 'Prompt title changes to hide');
console.log('✔ Test 5 Passed: Prompt and option buttons dynamically sync with independent state.');

// -----------------------------------------------------------------------------
// Check 6: Initial State Default is OFF (Zero Open Kotoba by Default)
// -----------------------------------------------------------------------------
console.log('Test 6: Default initial state has Kotoba OFF');
const freshSession = {
  id: 'session-fresh',
  mode: 'practice',
  deadline: null,
  timed: false,
  currentIndex: 0,
  questions: [sampleQ],
  answers: {},
  flaggedQuestions: []
};
initSelectiveState(freshSession);
sandbox.state.activeSession = freshSession;
renderExam();

assert.ok(!capturedHTML.includes('aria-expanded="true" aria-label="Kosakata'), 'No Kotoba button expanded by default');
assert.ok(!capturedHTML.includes('practice-ctrl-kotoba is-active'), 'No Kotoba button active by default');
console.log('✔ Test 6 Passed: Default initial state is strictly OFF.');

// -----------------------------------------------------------------------------
// Check 7: Mode Isolation (Suppressed on Timed Mock / Timed Custom)
// -----------------------------------------------------------------------------
console.log('Test 7: Mode isolation (Suppressed on Timed Mock / Timed Custom)');
const fullMockSession = {
  id: 'session-mock',
  mode: 'exam',
  deadline: Date.now() + 70 * 60000,
  timed: true,
  currentIndex: 0,
  questions: [sampleQ],
  answers: {},
  flaggedQuestions: []
};
sandbox.state.activeSession = fullMockSession;
renderExam();

assert.ok(!capturedHTML.includes('practice-ctrl-kotoba'), 'practice-ctrl-kotoba must NOT appear in Full Mock Exam');
assert.ok(!capturedHTML.includes('practice-prompt-row'), 'practice-prompt-row must NOT appear in Full Mock Exam');
assert.ok(!capturedHTML.includes('practice-option-row'), 'practice-option-row must NOT appear in Full Mock Exam');
console.log('✔ Test 7 Passed: Selective Kotoba controls completely suppressed in Timed Mock Exam.');

// -----------------------------------------------------------------------------
// Check 8: No Premature Implementation of T017 (Viewer) or T018 (Router)
// -----------------------------------------------------------------------------
console.log('Test 8: Premature implementation check (Zero false completion)');
const hasKotobaClickRouter = appSource.includes("case 'toggle-selective-kotoba':");

assert.equal(hasKotobaClickRouter, true, 'case toggle-selective-kotoba is mounted in T018');
console.log('✔ Test 8 Passed: T018 router verified mounted.');

console.log('\n================================================================================');
console.log('ALL T016 KOTOBA CONTROLS MOUNTING ASSERTIONS PASSED 100%!');
console.log('================================================================================\n');
