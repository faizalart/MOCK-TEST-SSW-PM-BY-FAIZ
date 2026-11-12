// scratch/assert-t018-kotoba-click-handler.mjs
import fs from 'node:fs';
import assert from 'node:assert/strict';

console.log('================================================================================');
console.log('FEATURE 008: Practice Selective Translation & Kotoba Reveal');
console.log('TASK T018: Kotoba Click Handler & State Toggle Verification (12 Scenarios)');
console.log('================================================================================\n');

// 1. Load datasets & app.js
const mapping = JSON.parse(fs.readFileSync('data/kotobaMapping.json', 'utf8'));
const dict = JSON.parse(fs.readFileSync('data/sharedKotobaDictionary.json', 'utf8'));
const appSource = fs.readFileSync('app.js', 'utf8');

// Virtual DOM mock for renderExam
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
  window: {
    scrollTo() {},
    sharedKotobaDictionary: dict,
    kotobaMapping: mapping
  },
  document: mockDoc,
  view: mockView,
  state: {
    page: 'exam',
    activeSession: null,
    practiceTranslationOpen: false,
    mapHidden: false,
    examSettingsOpen: false,
    examPrefs: { showFurigana: true },
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

// Extract functions from app.js
const helpersCode = appSource.substring(
  appSource.indexOf('function initSelectiveState(s) {'),
  appSource.indexOf('function renderExamSettingsPopover()')
);

const renderExamCode = appSource.substring(
  appSource.indexOf('function renderExam() {'),
  appSource.indexOf('async function persistExam() {')
);

// Extract handleAction case for toggle-selective-kotoba
const handleActionCaseCode = appSource.substring(
  appSource.indexOf("case 'toggle-selective-kotoba':"),
  appSource.indexOf("case 'remove-study-item':")
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

  async function simulateKotobaAction(action, el) {
    switch (action) {
      ${handleActionCaseCode}
    }
  }

  return {
    renderExam,
    initSelectiveState,
    getSelectiveState,
    getSelectiveQuestionState,
    getSelectiveOptionState,
    getOptionKey,
    resolveKotobaEntries,
    renderKotobaList,
    setKotobaData,
    ensureKotobaDataLoaded,
    toggleSelectiveTrans,
    toggleSelectiveKotoba,
    resetSelectiveTranslationOverrides,
    simulateKotobaAction
  };
`
);

const {
  renderExam,
  initSelectiveState,
  getSelectiveState,
  getSelectiveQuestionState,
  getSelectiveOptionState,
  getOptionKey,
  resolveKotobaEntries,
  renderKotobaList,
  setKotobaData,
  ensureKotobaDataLoaded,
  toggleSelectiveTrans,
  toggleSelectiveKotoba,
  resetSelectiveTranslationOverrides,
  simulateKotobaAction
} = fnModule(sandbox);

// Pre-load data in sandbox
setKotobaData(mapping, dict);

// Helper to create test session
function createMockSession(mode = 'practice', extra = {}) {
  const session = {
    mode,
    deadline: null,
    timed: false,
    currentIndex: 0,
    answers: {},
    questions: [
      {
        id: 'kunci1-q001',
        prompt: '【問題1】健康管理の原則として、最も適切なものを一つ選びなさい。',
        translation: 'Sebagai prinsip manajemen kesehatan, pilihlah satu yang paling tepat.',
        options: [
          {
            id: 'A',
            originalId: 'A',
            text: '毎日の体調を確認し、異常があればすぐに報告する。',
            translation: 'Memeriksa kondisi fisik setiap hari dan segera melaporkan jika ada ketidaknormalan.'
          },
          {
            id: 'B',
            originalId: 'B',
            text: '多少の体調不良なら、作業を続けてもよい。',
            translation: 'Jika hanya sedikit tidak enak badan, boleh melanjutkan pekerjaan.'
          }
        ]
      },
      {
        id: 'kunci1-q002',
        prompt: '【問題2】手洗いの手順について、正しいものを選びなさい。',
        translation: 'Pilihlah yang benar tentang prosedur mencuci tangan.',
        options: [
          {
            id: 'A',
            originalId: 'A',
            text: '石けんを使って指の間や爪の間まで丁寧に洗う。',
            translation: 'Gunakan sabun dan cuci dengan teliti hingga ke sela jari dan kuku.'
          },
          {
            id: 'B',
            originalId: 'B',
            text: '水だけで軽く流せば十分である。',
            translation: 'Cukup bilas ringan dengan air saja.'
          }
        ]
      }
    ],
    ...extra
  };
  if (mode === 'practice') {
    initSelectiveState(session);
  }
  return session;
}

// =============================================================================
// SCENARIO 1: Prompt button click toggles prompt Kotoba state only
// =============================================================================
console.log('--- SCENARIO 1: Prompt button click toggles prompt Kotoba state only ---');
{
  const s = createMockSession();
  sandbox.state.activeSession = s;
  const qId = 'kunci1-q001';

  const qStateBefore = getSelectiveQuestionState(s, qId, true);
  assert.equal(qStateBefore.kotoba, false, 'Initial prompt kotoba state must be false');

  const el = {
    dataset: {
      action: 'toggle-selective-kotoba',
      targetType: 'prompt'
    }
  };

  await simulateKotobaAction('toggle-selective-kotoba', el);

  const qStateAfter = getSelectiveQuestionState(s, qId, false);
  assert.equal(qStateAfter.kotoba, true, 'Prompt kotoba state must toggle to true');

  // Verify options remain false
  const optAState = getSelectiveOptionState(s, qId, 'A', false);
  const optBState = getSelectiveOptionState(s, qId, 'B', false);
  assert.equal(optAState?.kotoba || false, false, 'Option A kotoba must remain untouched');
  assert.equal(optBState?.kotoba || false, false, 'Option B kotoba must remain untouched');
  console.log('✓ Scenario 1 PASSED: Prompt button toggles prompt Kotoba state only.');
}

// =============================================================================
// SCENARIO 2: Option button click toggles target option Kotoba state only
// =============================================================================
console.log('\n--- SCENARIO 2: Option button click toggles target option Kotoba state only ---');
{
  const s = createMockSession();
  sandbox.state.activeSession = s;
  const qId = 'kunci1-q001';
  const optKeyA = getOptionKey(qId, s.questions[0].options[0]); // 'kunci1-q001::A'
  const optKeyB = getOptionKey(qId, s.questions[0].options[1]); // 'kunci1-q001::B'

  const elA = {
    dataset: {
      action: 'toggle-selective-kotoba',
      targetType: 'option',
      optKey: optKeyA
    }
  };

  await simulateKotobaAction('toggle-selective-kotoba', elA);

  const optA = getSelectiveOptionState(s, qId, optKeyA, false);
  const optB = getSelectiveOptionState(s, qId, optKeyB, false);
  const qPrompt = getSelectiveQuestionState(s, qId, false);

  assert.equal(optA.kotoba, true, 'Option A kotoba must be true');
  assert.equal(optB?.kotoba || false, false, 'Option B kotoba must remain false');
  assert.equal(qPrompt?.kotoba || false, false, 'Prompt kotoba must remain false');
  console.log('✓ Scenario 2 PASSED: Option button toggles target option Kotoba state only.');
}

// =============================================================================
// SCENARIO 3: Repeated clicks toggle ON -> OFF -> ON consistently
// =============================================================================
console.log('\n--- SCENARIO 3: Repeated clicks toggle ON -> OFF -> ON consistently ---');
{
  const s = createMockSession();
  sandbox.state.activeSession = s;
  const qId = 'kunci1-q001';
  const optKey = getOptionKey(qId, s.questions[0].options[0]);

  const elPrompt = { dataset: { action: 'toggle-selective-kotoba', targetType: 'prompt' } };
  const elOption = { dataset: { action: 'toggle-selective-kotoba', targetType: 'option', optKey } };

  // Click 1
  await simulateKotobaAction('toggle-selective-kotoba', elPrompt);
  await simulateKotobaAction('toggle-selective-kotoba', elOption);
  assert.equal(getSelectiveQuestionState(s, qId, false).kotoba, true);
  assert.equal(getSelectiveOptionState(s, qId, optKey, false).kotoba, true);

  // Click 2
  await simulateKotobaAction('toggle-selective-kotoba', elPrompt);
  await simulateKotobaAction('toggle-selective-kotoba', elOption);
  assert.equal(getSelectiveQuestionState(s, qId, false).kotoba, false);
  assert.equal(getSelectiveOptionState(s, qId, optKey, false).kotoba, false);

  // Click 3
  await simulateKotobaAction('toggle-selective-kotoba', elPrompt);
  await simulateKotobaAction('toggle-selective-kotoba', elOption);
  assert.equal(getSelectiveQuestionState(s, qId, false).kotoba, true);
  assert.equal(getSelectiveOptionState(s, qId, optKey, false).kotoba, true);

  console.log('✓ Scenario 3 PASSED: Repeated clicks toggle ON -> OFF -> ON consistently.');
}

// =============================================================================
// SCENARIO 4: Prompt and option states remain strictly independent
// =============================================================================
console.log('\n--- SCENARIO 4: Prompt and option states remain strictly independent ---');
{
  const s = createMockSession();
  sandbox.state.activeSession = s;
  const qId = 'kunci1-q001';
  const optKeyA = getOptionKey(qId, s.questions[0].options[0]);
  const optKeyB = getOptionKey(qId, s.questions[0].options[1]);

  // Turn prompt ON, options remain OFF
  toggleSelectiveKotoba(s, qId, null);
  assert.equal(getSelectiveQuestionState(s, qId, false).kotoba, true);
  assert.equal(getSelectiveOptionState(s, qId, optKeyA, false)?.kotoba || false, false);
  assert.equal(getSelectiveOptionState(s, qId, optKeyB, false)?.kotoba || false, false);

  // Turn option B ON, prompt remains ON, option A remains OFF
  toggleSelectiveKotoba(s, qId, optKeyB);
  assert.equal(getSelectiveQuestionState(s, qId, false).kotoba, true);
  assert.equal(getSelectiveOptionState(s, qId, optKeyA, false)?.kotoba || false, false);
  assert.equal(getSelectiveOptionState(s, qId, optKeyB, false).kotoba, true);

  // Turn prompt OFF, option B remains ON
  toggleSelectiveKotoba(s, qId, null);
  assert.equal(getSelectiveQuestionState(s, qId, false).kotoba, false);
  assert.equal(getSelectiveOptionState(s, qId, optKeyB, false).kotoba, true);

  console.log('✓ Scenario 4 PASSED: Prompt and option states are strictly independent.');
}

// =============================================================================
// SCENARIO 5: Shuffled option preserves original ID composite key
// =============================================================================
console.log('\n--- SCENARIO 5: Shuffled option preserves original ID composite key ---');
{
  const s = createMockSession();
  sandbox.state.activeSession = s;
  const qId = 'kunci1-q001';

  // Suppose options are shuffled so Option 'B' is at index 0 and Option 'A' is at index 1
  const shuffledOption0 = { id: 'A', originalId: 'B', text: 'Shuffled B' };
  const shuffledOption1 = { id: 'B', originalId: 'A', text: 'Shuffled A' };

  const keyForOrigB = getOptionKey(qId, shuffledOption0);
  const keyForOrigA = getOptionKey(qId, shuffledOption1);

  assert.equal(keyForOrigB, 'kunci1-q001::B', 'Must use originalId B');
  assert.equal(keyForOrigA, 'kunci1-q001::A', 'Must use originalId A');

  // Toggle option with originalId A
  toggleSelectiveKotoba(s, qId, keyForOrigA);

  const stateOrigA = getSelectiveOptionState(s, qId, 'A', false);
  const stateOrigB = getSelectiveOptionState(s, qId, 'B', false);

  assert.equal(stateOrigA.kotoba, true, 'Option with originalId A must be ON');
  assert.equal(stateOrigB?.kotoba || false, false, 'Option with originalId B must be OFF');
  console.log('✓ Scenario 5 PASSED: Shuffled option preserves original ID composite key.');
}

// =============================================================================
// SCENARIO 6: renderKotobaList() appears when target ON and disappears when OFF
// =============================================================================
console.log('\n--- SCENARIO 6: renderKotobaList() appearance in DOM ---');
{
  const s = createMockSession();
  sandbox.state.activeSession = s;
  const qId = 'kunci1-q001';
  const optKey = getOptionKey(qId, s.questions[0].options[0]);

  // 1. Initial state: both OFF
  renderExam();
  assert.ok(!capturedHTML.includes('practice-question-kotoba'), 'Prompt kotoba list must NOT be rendered when OFF');
  assert.ok(!capturedHTML.includes('practice-option-kotoba'), 'Option kotoba list must NOT be rendered when OFF');

  // 2. Turn Prompt Kotoba ON
  toggleSelectiveKotoba(s, qId, null);
  renderExam();
  assert.ok(capturedHTML.includes('practice-question-kotoba'), 'Prompt kotoba list MUST appear when prompt kotoba is ON');
  assert.ok(capturedHTML.includes('kotoba-ruby'), 'Prompt kotoba list must contain kotoba-ruby items');

  // 3. Turn Option Kotoba ON
  toggleSelectiveKotoba(s, qId, optKey);
  renderExam();
  assert.ok(capturedHTML.includes('practice-option-kotoba'), 'Option kotoba list MUST appear when option kotoba is ON');

  // 4. Turn Prompt Kotoba OFF
  toggleSelectiveKotoba(s, qId, null);
  renderExam();
  assert.ok(!capturedHTML.includes('practice-question-kotoba'), 'Prompt kotoba list must disappear when toggled OFF');
  assert.ok(capturedHTML.includes('practice-option-kotoba'), 'Option kotoba list remains when only prompt toggled OFF');

  // 5. Turn Option Kotoba OFF
  toggleSelectiveKotoba(s, qId, optKey);
  renderExam();
  assert.ok(!capturedHTML.includes('practice-option-kotoba'), 'Option kotoba list disappears when toggled OFF');
  console.log('✓ Scenario 6 PASSED: renderKotobaList() appears when ON and disappears when OFF.');
}

// =============================================================================
// SCENARIO 7: Kotoba button does NOT alter translation or globe status
// =============================================================================
console.log('\n--- SCENARIO 7: Kotoba button does not alter translation or globe status ---');
{
  const s = createMockSession();
  sandbox.state.activeSession = s;
  const qId = 'kunci1-q001';
  sandbox.state.practiceTranslationOpen = true;

  // Toggle sentence translation explicitly to false for prompt
  const qState = getSelectiveQuestionState(s, qId, true);
  qState.translation = false;

  // Toggle Kotoba on prompt
  toggleSelectiveKotoba(s, qId, null);

  assert.equal(sandbox.state.practiceTranslationOpen, true, 'Global globe state must remain unchanged');
  assert.equal(qState.translation, false, 'Sentence translation override must remain unchanged (false)');
  assert.equal(qState.kotoba, true, 'Kotoba state must be toggled to true');
  console.log('✓ Scenario 7 PASSED: Kotoba button does NOT alter translation or globe status.');
}

// =============================================================================
// SCENARIO 8: Kotoba button does NOT alter chosen answer or trigger radio
// =============================================================================
console.log('\n--- SCENARIO 8: Kotoba button does not alter answers or radio state ---');
{
  const s = createMockSession();
  sandbox.state.activeSession = s;
  const qId = 'kunci1-q001';
  s.answers[qId] = 0; // User previously selected option 0

  const optKey = getOptionKey(qId, s.questions[0].options[1]);
  const elOption = { dataset: { action: 'toggle-selective-kotoba', targetType: 'option', optKey } };

  await simulateKotobaAction('toggle-selective-kotoba', elOption);

  assert.equal(s.answers[qId], 0, 'session.answers must remain exactly 0');
  console.log('✓ Scenario 8 PASSED: Kotoba button does NOT alter answers or radio selection.');
}

// =============================================================================
// SCENARIO 9: Gated: Inactive on Full Mock Test and Timed Custom Exam
// =============================================================================
console.log('\n--- SCENARIO 9: Gated on Full Mock Test and Timed Custom Exam ---');
{
  // Full Mock Test
  const sExam = createMockSession('exam');
  sandbox.state.activeSession = sExam;
  const res1 = toggleSelectiveKotoba(sExam, 'kunci1-q001', null);
  assert.equal(res1, null, 'Must return null in full mock test mode');

  const el = { dataset: { action: 'toggle-selective-kotoba', targetType: 'prompt' } };
  await simulateKotobaAction('toggle-selective-kotoba', el);
  assert.equal(sExam.selectiveState, undefined, 'Must not create or modify selectiveState in full mock');

  // Timed Practice
  const sTimed = createMockSession('practice', { deadline: Date.now() + 60000, timed: true });
  sandbox.state.activeSession = sTimed;
  const res2 = toggleSelectiveKotoba(sTimed, 'kunci1-q001', null);
  assert.equal(res2, null, 'Must return null in timed practice mode');

  await simulateKotobaAction('toggle-selective-kotoba', el);
  const qStateTimed = getSelectiveQuestionState(sTimed, 'kunci1-q001', false);
  assert.equal(qStateTimed?.kotoba || false, false, 'Must not toggle kotoba in timed practice');
  console.log('✓ Scenario 9 PASSED: Gated on Full Mock Test and Timed Custom Exam.');
}

// =============================================================================
// SCENARIO 10: Data loading latency / failure handled safely without crash
// =============================================================================
console.log('\n--- SCENARIO 10: Data loading latency and error tolerance ---');
{
  const s = createMockSession();
  sandbox.state.activeSession = s;
  const qId = 'kunci1-q001';

  // Simulate empty cache and failing ensureKotobaDataLoaded
  setKotobaData(null, null);
  const originalEnsure = sandbox.ensureKotobaDataLoaded;

  // Mock loader that throws
  const fnModuleWithError = new Function(
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

    async function ensureKotobaDataLoaded() {
      throw new Error('Simulated network offline failure');
    }

    async function simulateKotobaAction(action, el) {
      switch (action) {
        ${handleActionCaseCode}
      }
    }

    return {
      renderExam,
      getSelectiveQuestionState,
      simulateKotobaAction
    };
  `
  );

  const errorContext = fnModuleWithError(sandbox);
  const el = { dataset: { action: 'toggle-selective-kotoba', targetType: 'prompt' } };

  // Must not throw unhandled exception
  await errorContext.simulateKotobaAction('toggle-selective-kotoba', el);

  const qState = errorContext.getSelectiveQuestionState(s, qId, false);
  assert.equal(qState.kotoba, true, 'State must still toggle to true even if network fails');

  // Restore cache
  setKotobaData(mapping, dict);
  console.log('✓ Scenario 10 PASSED: Data loading latency and error tolerance handled cleanly.');
}

// =============================================================================
// SCENARIO 11: Button visual state and accessibility attributes synchronized
// =============================================================================
console.log('\n--- SCENARIO 11: Button visual state & accessibility attributes synchronized ---');
{
  const s = createMockSession();
  sandbox.state.activeSession = s;
  const qId = 'kunci1-q001';
  const optKey = getOptionKey(qId, s.questions[0].options[0]);

  // 1. Initial render (OFF)
  renderExam();
  assert.ok(capturedHTML.includes('aria-expanded="false"'), 'Buttons must have aria-expanded="false" initially');
  assert.ok(capturedHTML.includes('title="Tampilkan kosakata soal"'), 'Prompt button title must indicate show');
  assert.ok(capturedHTML.includes('title="Tampilkan kosakata opsi"'), 'Option button title must indicate show');
  assert.ok(!capturedHTML.includes('practice-ctrl-kotoba is-active'), 'Kotoba button must not have is-active initially');

  // 2. Toggle Prompt ON
  toggleSelectiveKotoba(s, qId, null);
  renderExam();
  assert.ok(capturedHTML.includes('practice-row-ctrl practice-ctrl-kotoba is-active'), 'Prompt kotoba button must have is-active when ON');
  assert.ok(capturedHTML.includes('title="Sembunyikan kosakata soal"'), 'Prompt button title must indicate hide when ON');

  // 3. Toggle Option ON
  toggleSelectiveKotoba(s, qId, optKey);
  renderExam();
  assert.ok(capturedHTML.includes('title="Sembunyikan kosakata opsi"'), 'Option button title must indicate hide when ON');
  console.log('✓ Scenario 11 PASSED: Visual state and accessibility attributes synchronize.');
}

// =============================================================================
// SCENARIO 12: Toggle does NOT corrupt other questions' states
// =============================================================================
console.log('\n--- SCENARIO 12: Question isolation - states do not bleed across questions ---');
{
  const s = createMockSession();
  sandbox.state.activeSession = s;

  // Question 1: prompt ON, option A ON
  const q1Id = 'kunci1-q001';
  const opt1KeyA = getOptionKey(q1Id, s.questions[0].options[0]);
  toggleSelectiveKotoba(s, q1Id, null);
  toggleSelectiveKotoba(s, q1Id, opt1KeyA);

  // Switch to Question 2
  s.currentIndex = 1;
  const q2Id = 'kunci1-q002';
  const q2State = getSelectiveQuestionState(s, q2Id, false);
  assert.equal(q2State?.kotoba || false, false, 'Question 2 prompt kotoba must be false initially');

  // Toggle Question 2 prompt ON
  toggleSelectiveKotoba(s, q2Id, null);
  assert.equal(getSelectiveQuestionState(s, q2Id, false).kotoba, true);

  // Switch back to Question 1: verify Question 1 state is intact
  s.currentIndex = 0;
  assert.equal(getSelectiveQuestionState(s, q1Id, false).kotoba, true, 'Question 1 prompt kotoba must remain true');
  assert.equal(getSelectiveOptionState(s, q1Id, opt1KeyA, false).kotoba, true, 'Question 1 opt A kotoba must remain true');

  console.log('✓ Scenario 12 PASSED: Toggle does NOT corrupt other questions\' states.');
}

console.log('\n================================================================================');
console.log('ALL 12 T018 SCENARIOS PASSED WITH ZERO ERRORS (100% SUCCESS)');
console.log('================================================================================\n');
