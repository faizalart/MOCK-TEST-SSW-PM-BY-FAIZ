// scratch/assert-t013-click-handler.mjs
import fs from 'node:fs';
import assert from 'node:assert/strict';

console.log('--- Feature 008 Task T013 Click Handler & Interaction Verification ---');

// 1. Verify app.js definitions
const appCode = fs.readFileSync('app.js', 'utf8');
assert.ok(appCode.includes('function toggleSelectiveTrans('), 'toggleSelectiveTrans defined in app.js');
assert.ok(appCode.includes("case 'toggle-selective-trans':"), "case 'toggle-selective-trans' in handleAction");
assert.ok(appCode.includes('window.toggleSelectiveTrans = toggleSelectiveTrans;'), 'Exported on window');
console.log('✓ Check 1: app.js contains toggleSelectiveTrans and handleAction case');

// 2. Set up virtual DOM / sandbox environment to test handleAction and toggleSelectiveTrans
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
    toggleSelectiveTrans
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
  toggleSelectiveTrans
} = testRunnerFn(sandbox);

// 3. Test Session Setup
const sampleQuestion = {
  id: 'kunci1-q001',
  prompt: 'アレルギー<ruby>食品<rt>しょくひん</rt></ruby>について<ruby>正<rt>ただ</rt></ruby>しいものを<ruby>一<rt>ひと</rt></ruby>つ<ruby>選<rt>えら</rt></ruby>びなさい。',
  promptTranslation: 'Terjemahan Kalimat Soal Asli.',
  instructions: '<ruby>正<rt>ただ</rt></ruby>しいものを<ruby>一<rt>ひと</rt></ruby>つ<ruby>選<rt>えら</rt></ruby>びなさい。',
  options: [
    { id: 'A', text: 'Teks Opsi A', translation: 'Terjemahan Opsi A' },
    { id: 'B', text: 'Teks Opsi B', translation: 'Terjemahan Opsi B' },
    { id: 'C', text: 'Teks Opsi C', translation: 'Terjemahan Opsi C' }
  ]
};

const practiceSession = {
  id: 'sess_practice_t013',
  mode: 'practice',
  timed: false,
  deadline: null,
  startedAt: Date.now(),
  currentIndex: 0,
  questions: [sampleQuestion],
  answers: { 'kunci1-q001': 1 }, // Currently answer B is selected (index 1)
  flaggedQuestions: []
};

initSelectiveState(practiceSession);
sandbox.state.activeSession = practiceSession;
sandbox.state.practiceTranslationOpen = false; // Globe default OFF

// -----------------------------------------------------------------------------
// Criterion 3 & 4: Initial null state inherits globe, first click saves opposite of effective
// -----------------------------------------------------------------------------
// Before click: question prompt state is not allocated (or translation: null)
assert.equal(getSelectiveQuestionState(practiceSession, 'kunci1-q001', false), null, 'Initial question state is null (sparse)');

// Globe is OFF (effective: false) -> Toggle prompt -> must save translation = true
const newPromptState = toggleSelectiveTrans(practiceSession, 'kunci1-q001', null);
assert.equal(newPromptState, true, 'First click with globe OFF toggles translation to true');
assert.equal(getSelectiveQuestionState(practiceSession, 'kunci1-q001', false).translation, true, 'Saved as local override true');

// Click again -> must flip to false
const flippedPromptState = toggleSelectiveTrans(practiceSession, 'kunci1-q001', null);
assert.equal(flippedPromptState, false, 'Second click toggles translation to false');
assert.equal(getSelectiveQuestionState(practiceSession, 'kunci1-q001', false).translation, false, 'Saved as local override false');

// Reset prompt override to null, turn Globe ON (effective: true) -> First click must save translation = false
getSelectiveQuestionState(practiceSession, 'kunci1-q001', false).translation = null;
sandbox.state.practiceTranslationOpen = true;
const promptStateGlobeOn = toggleSelectiveTrans(practiceSession, 'kunci1-q001', null);
assert.equal(promptStateGlobeOn, false, 'First click with globe ON toggles translation to false (opposite of effective)');
assert.equal(getSelectiveQuestionState(practiceSession, 'kunci1-q001', false).translation, false);
console.log('✓ Check 2: Criteria 3, 4, 5 — Override null inheritance and opposite effective flip verified');

// -----------------------------------------------------------------------------
// Criterion 1 & 2: Prompt and Option toggle isolation
// -----------------------------------------------------------------------------
sandbox.state.practiceTranslationOpen = false; // Reset globe to OFF
// Reset state
practiceSession.selectiveState.questions = {};

// Toggle Option A via composite key
const optAKey = getOptionKey('kunci1-q001', sampleQuestion.options[0]); // 'kunci1-q001::A'
const optBKey = getOptionKey('kunci1-q001', sampleQuestion.options[1]); // 'kunci1-q001::B'

toggleSelectiveTrans(practiceSession, 'kunci1-q001', optAKey);
assert.equal(getSelectiveOptionState(practiceSession, 'kunci1-q001', 'A', false).translation, true, 'Option A toggled ON');
assert.equal(getSelectiveOptionState(practiceSession, 'kunci1-q001', 'B', false), null, 'Option B remains untouched (null)');
assert.equal(getSelectiveQuestionState(practiceSession, 'kunci1-q001', false).translation, null, 'Prompt remains untouched (null)');

// Toggle Prompt
toggleSelectiveTrans(practiceSession, 'kunci1-q001', null);
assert.equal(getSelectiveQuestionState(practiceSession, 'kunci1-q001', false).translation, true, 'Prompt toggled ON');
assert.equal(getSelectiveOptionState(practiceSession, 'kunci1-q001', 'A', false).translation, true, 'Option A remains ON');
assert.equal(getSelectiveOptionState(practiceSession, 'kunci1-q001', 'B', false), null, 'Option B remains untouched (null)');

// Toggle Option B
toggleSelectiveTrans(practiceSession, 'kunci1-q001', optBKey);
assert.equal(getSelectiveOptionState(practiceSession, 'kunci1-q001', 'B', false).translation, true, 'Option B toggled ON');
assert.equal(getSelectiveOptionState(practiceSession, 'kunci1-q001', 'A', false).translation, true, 'Option A remains ON');
console.log('✓ Check 3: Criteria 1, 2, 6 — Multi-node isolation between prompt and distinct options verified');

// -----------------------------------------------------------------------------
// Criterion 7: Answer Radio Integrity (Clicking translation does not alter answer)
// -----------------------------------------------------------------------------
assert.equal(practiceSession.answers['kunci1-q001'], 1, 'Pre-condition: Answer index 1 is selected');

// Simulate handleAction call for prompt button click
const promptBtnEl = {
  dataset: {
    action: 'toggle-selective-trans',
    targetType: 'prompt'
  }
};
await handleAction('toggle-selective-trans', promptBtnEl);

assert.equal(practiceSession.answers['kunci1-q001'], 1, 'Answer index 1 must NOT change on prompt toggle click');
assert.ok(capturedHTML.includes('class="answer-choice selected" data-action="answer" data-index="1"'), 'Answer index 1 remains selected in DOM');

// Simulate handleAction call for option C button click
const optCBtnEl = {
  dataset: {
    action: 'toggle-selective-trans',
    targetType: 'option',
    optKey: 'kunci1-q001::C'
  }
};
await handleAction('toggle-selective-trans', optCBtnEl);

assert.equal(practiceSession.answers['kunci1-q001'], 1, 'Answer index 1 must NOT change on option C toggle click');
assert.ok(capturedHTML.includes('class="answer-choice selected" data-action="answer" data-index="1"'), 'Answer index 1 remains selected in DOM');
assert.ok(capturedHTML.includes('Terjemahan Opsi C'), 'Option C translation now visible in DOM');
console.log('✓ Check 4: Criterion 7 — Answer radio integrity and selection persistence verified');

// -----------------------------------------------------------------------------
// Criterion 8: Guard against Full Mock Test & Timed Custom Exam
// -----------------------------------------------------------------------------
const timedExamSession = {
  id: 'sess_timed_full',
  mode: 'exam',
  timed: true,
  deadline: Date.now() + 70 * 60000,
  startedAt: Date.now(),
  currentIndex: 0,
  questions: [sampleQuestion],
  answers: {},
  flaggedQuestions: []
};
sandbox.state.activeSession = timedExamSession;

// Attempt to call toggleSelectiveTrans directly on timed session
assert.equal(toggleSelectiveTrans(timedExamSession, 'kunci1-q001', null), null, 'toggleSelectiveTrans returns null for timed exam');
assert.equal(timedExamSession.selectiveState, undefined, 'No selectiveState attached to timed exam');

// Attempt to call handleAction on timed session
capturedHTML = 'ORIGINAL_HTML_UNCHANGED';
await handleAction('toggle-selective-trans', promptBtnEl);
assert.equal(capturedHTML, 'ORIGINAL_HTML_UNCHANGED', 'handleAction must break immediately and NOT re-render on timed session');

console.log('✓ Check 5: Criterion 8 — Guard against Timed Mock & Timed Custom verified');

console.log('----------------------------------------------------');
console.log('All T013 Click Handler & Interaction assertions passed!');
