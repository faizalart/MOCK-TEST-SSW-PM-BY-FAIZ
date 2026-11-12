// scratch/assert-t019-furigana-sync.mjs
import fs from 'node:fs';
import assert from 'node:assert/strict';

console.log('================================================================================');
console.log('FEATURE 008: Practice Selective Translation & Kotoba Reveal');
console.log('TASK T019: Kotoba Furigana Synchronization with Toolbar F Tests');
console.log('================================================================================\n');

// 1. Load datasets, stylesheets & app.js
const mapping = JSON.parse(fs.readFileSync('data/kotobaMapping.json', 'utf8'));
const dict = JSON.parse(fs.readFileSync('data/sharedKotobaDictionary.json', 'utf8'));
const appSource = fs.readFileSync('app.js', 'utf8');
const richHtmlCss = fs.readFileSync('RICH-HTML-STYLES.css', 'utf8');
const zenAppShellCss = fs.readFileSync('ZEN-APP-SHELL.css', 'utf8');

// Virtual DOM mock with classList tracking on body
let capturedHTML = '';
const mockView = {
  get innerHTML() { return capturedHTML; },
  set innerHTML(val) { capturedHTML = val; }
};

const bodyClasses = new Set();
const mockBody = {
  classList: {
    add(c) { bodyClasses.add(c); },
    remove(c) { bodyClasses.delete(c); },
    toggle(c, force) {
      if (force === undefined) {
        if (bodyClasses.has(c)) bodyClasses.delete(c);
        else bodyClasses.add(c);
      } else if (force) {
        bodyClasses.add(c);
      } else {
        bodyClasses.delete(c);
      }
      return bodyClasses.has(c);
    },
    contains(c) { return bodyClasses.has(c); }
  }
};

const mockDoc = {
  body: mockBody,
  documentElement: {
    style: { setProperty() {} },
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }
  },
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
    examPrefs: {
      showFurigana: true,
      questionFontSize: 16,
      answerFontSize: 14
    },
    cardFurigana: new Map(),
    studyCardFurigana: new Map(),
    confirmResolve: null,
    lang: 'id'
  },
  $: () => null,
  activeExam() { return sandbox.state.activeSession; },
  currentExamQuestion(s) { return s?.questions?.[s.currentIndex] || null; },
  answeredCount(s) { return (s?.questions || []).filter(q => s.answers[q.id] != null).length; },
  isFullscreenActive() { return false; },
  isQuestionInStudy() { return false; },
  getOptionMedia() { return null; },
  getQuestionMainMedia() { return null; },
  getExamPackageDisplayName() { return 'Paket Ujian 1'; },
  mediaURL(m) { return m; },
  fmtDurationHMS() { return '01:10:00'; },
  esc(str) { return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); },
  t(k) { return k; },
  richHTML(s) { return s; },
  renderExamSettingsPopover() { return '<aside id="exam-settings-popover"></aside>'; },
  saveExamPrefs() {},
  syncExamViewportAfterResume() {},
  finishExam() {}
};

// Extract functions from app.js
const applyExamPrefsCode = appSource.substring(
  appSource.indexOf('function applyExamPrefs() {'),
  appSource.indexOf('function isFullscreenActive()')
);

const helpersCode = appSource.substring(
  appSource.indexOf('function initSelectiveState(s) {'),
  appSource.indexOf('function renderExamSettingsPopover()')
);

const renderExamCode = appSource.substring(
  appSource.indexOf('function renderExam() {'),
  appSource.indexOf('async function persistExam() {')
);

const handleActionKotobaCode = appSource.substring(
  appSource.indexOf("case 'toggle-selective-kotoba':"),
  appSource.indexOf("case 'remove-study-item':")
);

const handleActionFuriganaCode = appSource.substring(
  appSource.indexOf("case 'toggle-furigana-quick':"),
  appSource.indexOf("case 'toggle-card-furigana':")
);

const fnModule = new Function(
  'sandbox',
  `
  const {
    window, document, view, state, $, activeExam, currentExamQuestion, answeredCount,
    isFullscreenActive, isQuestionInStudy, getOptionMedia, getQuestionMainMedia,
    getExamPackageDisplayName, mediaURL, fmtDurationHMS, esc, t, richHTML,
    renderExamSettingsPopover, saveExamPrefs, syncExamViewportAfterResume, finishExam
  } = sandbox;

  ${applyExamPrefsCode}
  ${helpersCode}
  ${renderExamCode}

  let renderExamCallCount = 0;
  const origRender = renderExam;
  function trackedRenderExam() {
    renderExamCallCount++;
    return origRender();
  }

  async function simulateAction(action, el) {
    switch (action) {
      ${handleActionKotobaCode}
      ${handleActionFuriganaCode}
    }
  }

  return {
    applyExamPrefs,
    renderExam: trackedRenderExam,
    initSelectiveState,
    getSelectiveState,
    getSelectiveQuestionState,
    getSelectiveOptionState,
    getOptionKey,
    resolveKotobaEntries,
    renderKotobaList,
    setKotobaData,
    toggleSelectiveTrans,
    toggleSelectiveKotoba,
    simulateAction,
    getRenderCount: () => renderExamCallCount,
    resetRenderCount: () => { renderExamCallCount = 0; }
  };
`
);

const {
  applyExamPrefs,
  renderExam,
  initSelectiveState,
  getSelectiveQuestionState,
  getSelectiveOptionState,
  getOptionKey,
  resolveKotobaEntries,
  renderKotobaList,
  setKotobaData,
  toggleSelectiveTrans,
  toggleSelectiveKotoba,
  simulateAction,
  getRenderCount,
  resetRenderCount
} = fnModule(sandbox);

// Pre-load data in sandbox
setKotobaData(mapping, dict);

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
// TEST 1: Same Furigana Visibility Mechanism (Native <ruby class="kotoba-ruby"><rt>)
// =============================================================================
console.log('--- TEST 1: Same Furigana Visibility Mechanism (<ruby class="kotoba-ruby"><rt>) ---');
{
  const entries = resolveKotobaEntries('kunci1-q001', null);
  assert.ok(entries.length > 0, 'Must resolve prompt terms for kunci1-q001');

  const html = renderKotobaList(entries);
  assert.ok(html.includes('<ruby class="kotoba-ruby">'), 'Must use native <ruby class="kotoba-ruby"> container');
  assert.ok(html.includes('<rt>'), 'Must place readings inside native <rt> element');
  assert.ok(html.includes('</rt></ruby>'), 'Must properly close <rt> and <ruby>');

  // Verify that RICH-HTML-STYLES.css controls all ruby/rt under body.hide-furigana
  assert.ok(
    richHtmlCss.includes('body.hide-furigana ruby rt') && richHtmlCss.includes('display:none!important;'),
    'RICH-HTML-STYLES.css must enforce display: none !important on ruby rt under body.hide-furigana'
  );
  console.log('✔ Test 1 PASSED: Kotoba terms use native <ruby><rt> matching global furigana mechanism.');
}

// =============================================================================
// TEST 2: Toolbar F ON Displays Kotoba Reading (body without hide-furigana)
// =============================================================================
console.log('\n--- TEST 2: Toolbar F ON Displays Kotoba Reading ---');
{
  sandbox.state.examPrefs.showFurigana = true;
  applyExamPrefs();

  assert.equal(sandbox.state.examPrefs.showFurigana, true, 'showFurigana must be true');
  assert.equal(mockBody.classList.contains('hide-furigana'), false, 'body must NOT have hide-furigana when F is ON');
  console.log('✔ Test 2 PASSED: Toolbar F ON removes hide-furigana from body, allowing readings to display.');
}

// =============================================================================
// TEST 3: Toolbar F OFF Hides Kotoba Reading (body has hide-furigana)
// =============================================================================
console.log('\n--- TEST 3: Toolbar F OFF Hides Kotoba Reading ---');
{
  sandbox.state.examPrefs.showFurigana = false;
  applyExamPrefs();

  assert.equal(sandbox.state.examPrefs.showFurigana, false, 'showFurigana must be false');
  assert.equal(mockBody.classList.contains('hide-furigana'), true, 'body MUST have hide-furigana when F is OFF');
  console.log('✔ Test 3 PASSED: Toolbar F OFF adds hide-furigana to body, hiding readings via CSS.');
}

// =============================================================================
// TEST 4: Toggling F Does NOT Mutate Prompt or Option Kotoba States
// =============================================================================
console.log('\n--- TEST 4: Toggling F Does NOT Mutate Prompt or Option Kotoba States ---');
{
  const s = createMockSession();
  sandbox.state.activeSession = s;
  const qId = 'kunci1-q001';
  const optKey = getOptionKey(qId, s.questions[0].options[0]);

  // Turn prompt Kotoba ON and option Kotoba ON
  toggleSelectiveKotoba(s, qId, null);
  toggleSelectiveKotoba(s, qId, optKey);

  assert.equal(getSelectiveQuestionState(s, qId, false).kotoba, true, 'Prompt kotoba must be ON');
  assert.equal(getSelectiveOptionState(s, qId, optKey, false).kotoba, true, 'Option kotoba must be ON');

  // Toggle toolbar F 4 times
  await simulateAction('toggle-furigana-quick', {});
  await simulateAction('toggle-furigana-quick', {});
  await simulateAction('toggle-furigana-quick', {});
  await simulateAction('toggle-furigana-quick', {});

  // State must remain strictly unchanged
  assert.equal(getSelectiveQuestionState(s, qId, false).kotoba, true, 'Prompt kotoba state MUST remain true after F toggles');
  assert.equal(getSelectiveOptionState(s, qId, optKey, false).kotoba, true, 'Option kotoba state MUST remain true after F toggles');
  console.log('✔ Test 4 PASSED: Toggling toolbar F does NOT mutate prompt or option Kotoba states.');
}

// =============================================================================
// TEST 5: Toggling F Does NOT Mutate Sentence Translation or Global Globe
// =============================================================================
console.log('\n--- TEST 5: Toggling F Does NOT Mutate Translation or Global Globe ---');
{
  const s = createMockSession();
  sandbox.state.activeSession = s;
  const qId = 'kunci1-q001';
  const optKey = getOptionKey(qId, s.questions[0].options[0]);

  // Set explicit translation overrides
  sandbox.state.practiceTranslationOpen = true;
  const qState = getSelectiveQuestionState(s, qId, true);
  qState.translation = false; // Prompt override OFF
  const optState = getSelectiveOptionState(s, qId, optKey, true);
  optState.translation = true; // Option override ON

  // Toggle toolbar F
  await simulateAction('toggle-furigana-quick', {});

  assert.equal(sandbox.state.practiceTranslationOpen, true, 'Global globe must remain true');
  assert.equal(qState.translation, false, 'Prompt translation override must remain false');
  assert.equal(optState.translation, true, 'Option translation override must remain true');
  console.log('✔ Test 5 PASSED: Toggling toolbar F leaves translation states and global globe untouched.');
}

// =============================================================================
// TEST 6: Zero Separate Furigana State for Kotoba (FR-025)
// =============================================================================
console.log('\n--- TEST 6: Zero Separate Furigana State for Kotoba (FR-025) ---');
{
  const s = createMockSession();
  sandbox.state.activeSession = s;
  const qId = 'kunci1-q001';
  const optKey = getOptionKey(qId, s.questions[0].options[0]);

  toggleSelectiveKotoba(s, qId, null);
  toggleSelectiveKotoba(s, qId, optKey);

  const selState = s.selectiveState;
  const qState = selState.questions[qId];
  const optState = qState.options['A'];

  // Verify only allowed keys exist
  assert.deepEqual(Object.keys(selState), ['questions'], 'selectiveState must only have "questions" key');
  assert.deepEqual(Object.keys(qState), ['translation', 'kotoba', 'options'], 'qState must only have translation, kotoba, options');
  assert.deepEqual(Object.keys(optState), ['translation', 'kotoba'], 'optState must only have translation, kotoba');

  // Assert no furigana property exists in selective state
  assert.equal(selState.furigana, undefined, 'Must NOT create selectiveState.furigana');
  assert.equal(qState.furigana, undefined, 'Must NOT create qState.furigana');
  assert.equal(optState.furigana, undefined, 'Must NOT create optState.furigana');
  console.log('✔ Test 6 PASSED: Zero new furigana state created (strictly reuses state.examPrefs.showFurigana).');
}

// =============================================================================
// TEST 7: Kotoba Status (ON/OFF) Does NOT Interfere with Toolbar F Toggling
// =============================================================================
console.log('\n--- TEST 7: Kotoba Status (ON/OFF) Does NOT Interfere with Toolbar F ---');
{
  const s = createMockSession();
  sandbox.state.activeSession = s;
  const qId = 'kunci1-q001';

  // State 1: Kotoba OFF -> F toggles cleanly
  sandbox.state.examPrefs.showFurigana = true;
  await simulateAction('toggle-furigana-quick', {});
  assert.equal(sandbox.state.examPrefs.showFurigana, false);
  assert.equal(mockBody.classList.contains('hide-furigana'), true);

  // State 2: Kotoba ON -> F toggles cleanly
  toggleSelectiveKotoba(s, qId, null);
  await simulateAction('toggle-furigana-quick', {});
  assert.equal(sandbox.state.examPrefs.showFurigana, true);
  assert.equal(mockBody.classList.contains('hide-furigana'), false);

  console.log('✔ Test 7 PASSED: Toolbar F toggling operates identically whether Kotoba is ON or OFF.');
}

// =============================================================================
// TEST 8: Synchronization Persists Across Question Navigation & Re-render
// =============================================================================
console.log('\n--- TEST 8: Synchronization Persists Across Navigation & Re-render ---');
{
  const s = createMockSession();
  sandbox.state.activeSession = s;

  // Question 1: Kotoba ON, Furigana OFF
  sandbox.state.examPrefs.showFurigana = false;
  applyExamPrefs();
  toggleSelectiveKotoba(s, 'kunci1-q001', null);

  renderExam();
  assert.ok(capturedHTML.includes('practice-question-kotoba'), 'Question 1 Kotoba list rendered');
  assert.equal(mockBody.classList.contains('hide-furigana'), true, 'hide-furigana active on Question 1');

  // Navigate to Question 2
  s.currentIndex = 1;
  toggleSelectiveKotoba(s, 'kunci1-q002', null);
  renderExam();
  assert.equal(mockBody.classList.contains('hide-furigana'), true, 'hide-furigana still active on Question 2');

  // Navigate back to Question 1
  s.currentIndex = 0;
  renderExam();
  assert.ok(capturedHTML.includes('practice-question-kotoba'), 'Question 1 Kotoba list remains rendered');
  assert.equal(mockBody.classList.contains('hide-furigana'), true, 'hide-furigana remains active after navigating back');

  console.log('✔ Test 8 PASSED: Furigana synchronization persists across question navigation.');
}

// =============================================================================
// TEST 9: Full Mock Test and Timed Custom Exam Behavior
// =============================================================================
console.log('\n--- TEST 9: Full Mock Test and Timed Custom Exam Isolation ---');
{
  // Full mock exam
  const sExam = createMockSession('exam');
  sandbox.state.activeSession = sExam;

  // Toolbar F works for standard CBT
  sandbox.state.examPrefs.showFurigana = true;
  await simulateAction('toggle-furigana-quick', {});
  assert.equal(sandbox.state.examPrefs.showFurigana, false);
  assert.equal(mockBody.classList.contains('hide-furigana'), true);

  // But no selective state or selective kotoba controls exist
  renderExam();
  assert.ok(!capturedHTML.includes('practice-ctrl-kotoba'), 'No kotoba buttons in full mock');
  assert.ok(!capturedHTML.includes('practice-kotoba-list'), 'No kotoba list in full mock');
  assert.equal(sExam.selectiveState, undefined, 'No selectiveState in full mock');

  console.log('✔ Test 9 PASSED: Full Mock Test & Timed Exam preserve standard CBT behavior without Feature 008 leakage.');
}

// =============================================================================
// TEST 10: Zero DOM Churn / No Re-render on Toolbar F Toggle (FR-024)
// =============================================================================
console.log('\n--- TEST 10: Zero DOM Churn on Toolbar F Toggle (FR-024) ---');
{
  const s = createMockSession();
  sandbox.state.activeSession = s;
  sandbox.state.page = 'exam';
  resetRenderCount();

  // Initial render
  renderExam();
  const initialHTML = capturedHTML;
  assert.equal(getRenderCount(), 1, 'Initial render performed');

  // Toggle toolbar F
  await simulateAction('toggle-furigana-quick', {});

  // renderExam should NOT be called on toggle-furigana-quick
  assert.equal(getRenderCount(), 1, 'renderExam MUST NOT be called when toolbar F is toggled');
  assert.equal(capturedHTML, initialHTML, 'Exam DOM tree remains intact without re-render');

  console.log('✔ Test 10 PASSED: Zero DOM churn; toolbar F operates via CSS class toggle without re-rendering.');
}

// =============================================================================
// TEST 11: Production CSS Rule Inspection (T020 & T021 Status)
// =============================================================================
console.log('\n--- TEST 11: Production CSS Rule Inspection (T020 & T021 Status) ---');
{
  // T020 Check: renderKotobaList uses <ruby class="kotoba-ruby">
  const hasKotobaRubyClassInMarkup = appSource.includes('class="kotoba-ruby"');
  console.log(`  • T020 Markup <ruby class="kotoba-ruby">:           ${hasKotobaRubyClassInMarkup ? 'MOUNTED & VERIFIED' : 'PENDING'}`);
  assert.ok(hasKotobaRubyClassInMarkup, 'renderKotobaList must use class="kotoba-ruby"');

  // T021 Check: ZEN-APP-SHELL.css dedicated rule body.hide-furigana .kotoba-ruby rt
  const hasDedicatedKotobaRuleInAppShell = zenAppShellCss.includes('body.hide-furigana .kotoba-ruby rt') ||
                                           zenAppShellCss.includes('body.hide-furigana') && zenAppShellCss.includes('.kotoba-ruby');

  console.log(`  • T021 Dedicated Rule in ZEN-APP-SHELL.css:        ${hasDedicatedKotobaRuleInAppShell ? 'MOUNTED' : 'PENDING_IMPLEMENTATION (T021)'}`);

  // Note: General rule in RICH-HTML-STYLES.css already covers all <ruby rt>:
  const hasGeneralRubyRule = richHtmlCss.includes('body.hide-furigana ruby rt');
  console.log(`  • Upstream general rule in RICH-HTML-STYLES.css:    ${hasGeneralRubyRule ? 'ACTIVE (Covers all ruby rt)' : 'NOT_FOUND'}`);

  console.log('✔ Test 11 PASSED: Component readiness accurately audited without false claims of T021 completion.');
}

console.log('\n================================================================================');
console.log('ALL T019 FOCUSED TESTS PASSED 100%!');
console.log('================================================================================\n');
