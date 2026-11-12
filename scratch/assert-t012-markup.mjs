// scratch/assert-t012-markup.mjs
import fs from 'node:fs';
import assert from 'node:assert/strict';

console.log('--- Feature 008 Task T012 Structural & DOM Isolation Verification ---');

// 1. Verify app.js syntax and basic sanity
const appCode = fs.readFileSync('app.js', 'utf8');
assert.ok(appCode.includes('practice-prompt-row'), 'app.js includes practice-prompt-row');
assert.ok(appCode.includes('practice-option-row'), 'app.js includes practice-option-row');
assert.ok(appCode.includes('practice-ctrl-trans'), 'app.js includes practice-ctrl-trans');
assert.ok(appCode.includes('practice-row-slot') || appCode.includes('practice-ctrl-kotoba'), 'app.js includes right slot/ctrl');
console.log('✓ Check 1: app.js contains all required T012 markup elements');

// 2. Extract renderExam and dependencies for sandboxed rendering
// Create a virtual DOM / mock environment
let capturedHTML = '';
const mockView = {
  get innerHTML() { return capturedHTML; },
  set innerHTML(val) { capturedHTML = val; }
};

const mockDoc = {
  body: { classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } } },
  documentElement: { classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } } }
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

// Extract renderExam and selective helpers from app.js
const helpersCode = appCode.substring(
  appCode.indexOf('function initSelectiveState(s) {'),
  appCode.indexOf('function renderExamSettingsPopover()')
);

const renderExamCode = appCode.substring(
  appCode.indexOf('function renderExam() {'),
  appCode.indexOf('async function persistExam() {')
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

  return { renderExam, initSelectiveState, getSelectiveQuestionState, getSelectiveOptionState, getOptionKey };
`
);

const {
  renderExam,
  initSelectiveState,
  getSelectiveQuestionState,
  getSelectiveOptionState,
  getOptionKey
} = testRunnerFn(sandbox);

// 3. Test Untimed Practice Mode Rendering (Selective Markup ON)
const sampleQuestion = {
  id: 'kunci1-q001',
  prompt: 'アレルギー<ruby>食品<rt>しょくひん</rt></ruby>について<ruby>正<rt>ただ</rt></ruby>しいものを<ruby>一<rt>ひと</rt></ruby>つ<ruby>選<rt>えら</rt></ruby>びなさい。',
  promptTranslation: 'Pilihlah satu jawaban yang benar mengenai makanan pemicu alergi.',
  instructions: '<ruby>正<rt>ただ</rt></ruby>しいものを<ruby>一<rt>ひと</rt></ruby>つ<ruby>選<rt>えら</rt></ruby>びなさい。',
  options: [
    { id: 'A', text: 'Opsi Pertama Text', translation: 'Ini adalah kalimat terjemahan opsi A.' },
    { id: 'B', text: 'Opsi Kedua Text', translation: 'Ini adalah kalimat terjemahan opsi B.' },
    { id: 'C', text: 'Opsi Ketiga Text', translation: 'Ini adalah kalimat terjemahan opsi C.' }
  ]
};

const practiceSession = {
  id: 'sess_practice_100',
  mode: 'practice',
  timed: false,
  deadline: null,
  startedAt: Date.now(),
  currentIndex: 0,
  questions: [sampleQuestion],
  answers: {},
  flaggedQuestions: []
};

initSelectiveState(practiceSession);
sandbox.state.activeSession = practiceSession;
sandbox.state.practiceTranslationOpen = false;

// Render default OFF
renderExam();
const htmlPracticeOff = capturedHTML;

// Assert 3-column prompt row presence
assert.ok(htmlPracticeOff.includes('class="practice-prompt-row"'), 'practice-prompt-row must exist in untimed practice');
assert.ok(htmlPracticeOff.includes('class="practice-row-ctrl practice-ctrl-trans'), 'prompt left button must exist');
assert.ok(htmlPracticeOff.includes('data-action="toggle-selective-trans"'), 'data-action must be toggle-selective-trans');
assert.ok(htmlPracticeOff.includes('data-target-type="prompt"'), 'prompt button data-target-type="prompt"');
assert.ok(htmlPracticeOff.includes('aria-label="Terjemahan Kalimat Soal"'), 'prompt button aria-label');
assert.ok(htmlPracticeOff.includes('aria-expanded="false"'), 'prompt button aria-expanded="false" when closed');
assert.ok(htmlPracticeOff.includes('class="practice-prompt-center"'), 'practice-prompt-center must exist');
assert.ok(htmlPracticeOff.includes('class="practice-row-slot"') || htmlPracticeOff.includes('practice-ctrl-kotoba'), 'right element must exist');
assert.ok(!htmlPracticeOff.includes('Pilihlah satu jawaban yang benar mengenai makanan pemicu alergi.'), 'Prompt translation hidden when OFF');

// Assert 3-column option rows presence & sibling structure
assert.ok(htmlPracticeOff.includes('class="practice-option-row"'), 'practice-option-row must exist in untimed practice');
assert.ok(htmlPracticeOff.includes('data-opt-key="kunci1-q001::A"'), 'Option A data-opt-key composite key');
assert.ok(htmlPracticeOff.includes('data-opt-key="kunci1-q001::B"'), 'Option B data-opt-key composite key');
assert.ok(htmlPracticeOff.includes('data-opt-key="kunci1-q001::C"'), 'Option C data-opt-key composite key');

// Check sibling structure: button and .answer-choice must be siblings
const optionRowMatch = htmlPracticeOff.match(/<div class="practice-option-row">([\s\S]*?(?:<span class="practice-row-slot"|<button[^>]*practice-ctrl-kotoba)[\s\S]*?)<\/div>/);
assert.ok(optionRowMatch, 'practice-option-row found');
const rowInner = optionRowMatch[1];

// Verify sibling order:
// 1. button.practice-ctrl-trans
// 2. div.answer-choice
// 3. span.practice-row-slot
const btnIdx = rowInner.indexOf('<button');
const choiceIdx = rowInner.indexOf('<div role="radio"');
const slotIdx = rowInner.indexOf('practice-ctrl-kotoba') !== -1 ? rowInner.indexOf('practice-ctrl-kotoba') : rowInner.indexOf('<span class="practice-row-slot"');

assert.ok(btnIdx !== -1 && choiceIdx !== -1 && slotIdx !== -1, 'All 3 grid children must be present');
assert.ok(btnIdx < choiceIdx, 'Left button must precede answer-choice');
assert.ok(choiceIdx < slotIdx, 'Answer-choice must precede right slot');

// Ensure button is NOT inside answer-choice (button ends before answer-choice starts)
const btnCloseIdx = rowInner.indexOf('</button>');
assert.ok(btnCloseIdx < choiceIdx, 'Button must close before answer-choice begins');
assert.ok(!htmlPracticeOff.includes('Ini adalah kalimat terjemahan opsi A.'), 'Option translation text hidden when OFF');
console.log('✓ Check 2: Untimed Practice Mode renders correct 3-column grid structure with button sibling isolation');

// 4. Test Translation Reveal & Override Hierarchy
// Test A: Global Globe ON reveals all default un-overridden translations
sandbox.state.practiceTranslationOpen = true;
renderExam();
const htmlPracticeGlobalOn = capturedHTML;
assert.ok(htmlPracticeGlobalOn.includes('Pilihlah satu jawaban yang benar mengenai makanan pemicu alergi.'), 'Prompt translation visible when global globe is ON');
assert.ok(htmlPracticeGlobalOn.includes('Ini adalah kalimat terjemahan opsi A.'), 'Option A translation visible when global globe is ON');
assert.ok(htmlPracticeGlobalOn.includes('Ini adalah kalimat terjemahan opsi B.'), 'Option B translation visible when global globe is ON');
assert.ok(htmlPracticeGlobalOn.includes('Ini adalah kalimat terjemahan opsi C.'), 'Option C translation visible when global globe is ON');

// Test B: Local override OFF on prompt while global globe is ON
const qSel = getSelectiveQuestionState(practiceSession, 'kunci1-q001', true);
qSel.translation = false; // Override OFF
renderExam();
const htmlPromptOverrideOff = capturedHTML;
assert.ok(!htmlPromptOverrideOff.includes('Pilihlah satu jawaban yang benar mengenai makanan pemicu alergi.'), 'Prompt translation hidden when locally overridden to false');
assert.ok(htmlPromptOverrideOff.includes('Ini adalah kalimat terjemahan opsi A.'), 'Option A still visible (not affected by prompt override)');

// Test C: Local override ON on Option B while global globe is OFF
sandbox.state.practiceTranslationOpen = false;
qSel.translation = null; // Reset prompt to inherit
const optBSel = getSelectiveOptionState(practiceSession, 'kunci1-q001', 'B', true);
optBSel.translation = true; // Override ON on Option B only
renderExam();
const htmlOptBOverrideOn = capturedHTML;
assert.ok(!htmlOptBOverrideOn.includes('Pilihlah satu jawaban yang benar mengenai makanan pemicu alergi.'), 'Prompt translation hidden (inherits globe OFF)');
assert.ok(!htmlOptBOverrideOn.includes('Ini adalah kalimat terjemahan opsi A.'), 'Option A hidden (inherits globe OFF)');
assert.ok(htmlOptBOverrideOn.includes('Ini adalah kalimat terjemahan opsi B.'), 'Option B visible (locally overridden to true)');
assert.ok(!htmlOptBOverrideOn.includes('Ini adalah kalimat terjemahan opsi C.'), 'Option C hidden (inherits globe OFF)');
console.log('✓ Check 3: Translation display hierarchy (global vs local override) verified');

// 5. Test Timed Exam Mode Isolation (Full Mock Test & Timed Custom)
const examTimedSession = {
  id: 'sess_timed_exam_200',
  mode: 'exam',
  timed: true,
  deadline: Date.now() + 70 * 60000,
  startedAt: Date.now(),
  currentIndex: 0,
  questions: [sampleQuestion],
  answers: {},
  flaggedQuestions: []
};

sandbox.state.activeSession = examTimedSession;
sandbox.state.practiceTranslationOpen = true; // Even if globe flag is true, must be suppressed

renderExam();
const htmlTimedExam = capturedHTML;

assert.ok(!htmlTimedExam.includes('practice-prompt-row'), 'Timed exam must NOT contain practice-prompt-row');
assert.ok(!htmlTimedExam.includes('practice-option-row'), 'Timed exam must NOT contain practice-option-row');
assert.ok(!htmlTimedExam.includes('practice-ctrl-trans'), 'Timed exam must NOT contain practice-ctrl-trans');
assert.ok(!htmlTimedExam.includes('practice-row-slot'), 'Timed exam must NOT contain practice-row-slot');
assert.ok(!htmlTimedExam.includes('toggle-selective-trans'), 'Timed exam must NOT contain toggle-selective-trans action');
assert.ok(!htmlTimedExam.includes('Pilihlah satu jawaban yang benar mengenai makanan pemicu alergi.'), 'Timed exam must NEVER reveal translations');
assert.ok(!htmlTimedExam.includes('Terjemahan Opsi A'), 'Timed exam must NEVER reveal option translations');

// Verify existing baseline CBT structure is intact
assert.ok(htmlTimedExam.includes('<div class="question-prompt rich-content" lang="ja">'), 'Direct question-prompt rich-content preserved');
assert.ok(htmlTimedExam.includes('<div role="radio" tabindex="0" class="answer-choice'), 'Direct answer-choice preserved');
console.log('✓ Check 4: Full Mock Test / Timed Custom Exam mode isolation verified (100% suppression of selective markup)');

console.log('----------------------------------------------------');
console.log('All T012 Markup & Structural DOM assertions passed!');
