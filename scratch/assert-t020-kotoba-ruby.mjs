// scratch/assert-t020-kotoba-ruby.mjs
import fs from 'node:fs';
import assert from 'node:assert/strict';

console.log('================================================================================');
console.log('FEATURE 008: Practice Selective Translation & Kotoba Reveal');
console.log('TASK T020: Kotoba Ruby & Furigana Rendering Verification (8 Scenarios)');
console.log('================================================================================\n');

// 1. Load datasets, stylesheets & app.js
const mapping = JSON.parse(fs.readFileSync('data/kotobaMapping.json', 'utf8'));
const dict = JSON.parse(fs.readFileSync('data/sharedKotobaDictionary.json', 'utf8'));
const appSource = fs.readFileSync('app.js', 'utf8');

// Virtual DOM mock
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
    examPrefs: { showFurigana: true },
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

const fnModule = new Function(
  'sandbox',
  `
  const {
    window, document, view, state, $, activeExam, currentExamQuestion, answeredCount,
    isFullscreenActive, isQuestionInStudy, getOptionMedia, getQuestionMainMedia,
    getExamPackageDisplayName, mediaURL, fmtDurationHMS, esc, t, richHTML,
    renderExamSettingsPopover, applyExamPrefs, syncExamViewportAfterResume, finishExam
  } = sandbox;

  ${helpersCode}
  ${renderExamCode}

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
    toggleSelectiveTrans,
    toggleSelectiveKotoba
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
  toggleSelectiveKotoba
} = fnModule(sandbox);

setKotobaData(mapping, dict);

function createMockSession(mode = 'practice') {
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
        promptTranslation: 'Sebagai prinsip manajemen kesehatan, pilihlah satu yang paling tepat.',
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
      }
    ]
  };
  if (mode === 'practice') {
    initSelectiveState(session);
  }
  return session;
}

// =============================================================================
// SCENARIO 1: Proper <ruby> and <rt> markup structure
// =============================================================================
console.log('--- SCENARIO 1: Proper <ruby> and <rt> markup structure ---');
{
  const entries = [
    { id: 'kb-test1', kanji: '健康管理', furigana: 'けんこうかんり', arti: 'Manajemen kesehatan', status: 'verified' }
  ];
  const html = renderKotobaList(entries);

  assert.ok(html.includes('<ruby class="kotoba-ruby">健康管理<rt>けんこうかんり</rt></ruby>'),
    'Must output canonical <ruby class="kotoba-ruby">${kanji}<rt>${furigana}</rt></ruby>');
  assert.ok(html.includes('<div class="practice-kotoba-item" data-term-id="kb-test1">'),
    'Must contain practice-kotoba-item wrapper with term ID');
  assert.ok(html.includes('<span class="kotoba-term-wrap">'),
    'Must contain kotoba-term-wrap span');
  assert.ok(html.includes('<span class="kotoba-separator" aria-hidden="true">—</span>'),
    'Must contain accessible separator');
  assert.ok(html.includes('<span class="kotoba-meaning" lang="id">Manajemen kesehatan</span>'),
    'Must contain Indonesian definition with lang="id"');
  console.log('✔ Scenario 1 PASSED: Canonical ruby and rt structure verified.');
}

// =============================================================================
// SCENARIO 2: Kanji and Reading sourced strictly from dictionary fields
// =============================================================================
console.log('\n--- SCENARIO 2: Sourced strictly from verified dictionary fields ---');
{
  // Resolve actual terms for question kunci1-q001
  const terms = resolveKotobaEntries('kunci1-q001', null);
  assert.ok(terms.length > 0, 'Must resolve terms for kunci1-q001');

  for (const term of terms) {
    const dictTerm = dict.terms[term.id];
    assert.ok(dictTerm, `Dictionary must contain term ${term.id}`);
    assert.equal(term.kanji, dictTerm.kanji, `Kanji must match dictionary for ${term.id}`);
    assert.equal(term.furigana, dictTerm.furigana, `Furigana must match dictionary for ${term.id}`);
    assert.equal(term.arti, dictTerm.arti, `Arti must match dictionary for ${term.id}`);
  }
  console.log('✔ Scenario 2 PASSED: All terms reflect authentic dictionary kanji and furigana.');
}

// =============================================================================
// SCENARIO 3: Term without valid reading handled safely (Zero fake furigana)
// =============================================================================
console.log('\n--- SCENARIO 3: Missing or empty reading safety (Zero fake furigana) ---');
{
  const termNoFuri = [
    { id: 'kb-nofuri', kanji: 'パン', furigana: '', arti: 'Roti', status: 'verified' },
    { id: 'kb-nullfuri', kanji: 'テスト', furigana: null, arti: 'Tes', status: 'verified' },
    { id: 'kb-undefuri', kanji: 'アルコール', furigana: undefined, arti: 'Alkohol', status: 'verified' }
  ];

  const html = renderKotobaList(termNoFuri);

  assert.ok(html.includes('<ruby class="kotoba-ruby">パン<rt></rt></ruby>'), 'Empty furigana yields empty <rt></rt>');
  assert.ok(html.includes('<ruby class="kotoba-ruby">テスト<rt></rt></ruby>'), 'Null furigana yields empty <rt></rt>');
  assert.ok(html.includes('<ruby class="kotoba-ruby">アルコール<rt></rt></ruby>'), 'Undefined furigana yields empty <rt></rt>');

  // Verify no hallucinated readings
  assert.ok(!html.includes('ぱん'), 'Must NOT hallucinate hiragana reading for パン');
  assert.ok(!html.includes('てすと'), 'Must NOT hallucinate hiragana reading for テスト');
  console.log('✔ Scenario 3 PASSED: Zero hallucinated furigana on terms without readings.');
}

// =============================================================================
// SCENARIO 4: Strict HTML Escaping (Zero XSS)
// =============================================================================
console.log('\n--- SCENARIO 4: Strict HTML Escaping (Zero XSS) ---');
{
  const dangerousTerms = [
    {
      id: 'kb-xss<1>',
      kanji: '消毒<script>alert(1)</script>',
      furigana: 'しょうどく<img src=x onerror=alert(2)>',
      arti: 'Disinfeksi & sterilisasi "quotes"',
      status: 'verified'
    }
  ];

  const html = renderKotobaList(dangerousTerms);

  assert.ok(!html.includes('<script>'), 'Must NOT contain raw script tag');
  assert.ok(!html.includes('<img src=x'), 'Must NOT contain raw img tag with onerror');
  assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'), 'Kanji must be HTML-escaped');
  assert.ok(html.includes('&lt;img src=x onerror=alert(2)&gt;'), 'Furigana must be HTML-escaped');
  assert.ok(html.includes('&amp; sterilisasi &quot;quotes&quot;'), 'Arti must be HTML-escaped');
  assert.ok(html.includes('data-term-id="kb-xss&lt;1&gt;"'), 'ID must be HTML-escaped');
  console.log('✔ Scenario 4 PASSED: All rendered fields are strictly sanitized via esc().');
}

// =============================================================================
// SCENARIO 5: Ruby structure identical across prompt and option rows
// =============================================================================
console.log('\n--- SCENARIO 5: Ruby structure identical across prompt and options ---');
{
  const s = createMockSession();
  sandbox.state.activeSession = s;
  const qId = 'kunci1-q001';
  const optKeyA = getOptionKey(qId, s.questions[0].options[0]);

  // Turn prompt Kotoba ON and option Kotoba ON
  toggleSelectiveKotoba(s, qId, null);
  toggleSelectiveKotoba(s, qId, optKeyA);

  renderExam();

  // Prompt center must have ruby
  assert.ok(capturedHTML.includes('class="practice-kotoba-list practice-question-kotoba"'),
    'Prompt kotoba list rendered');
  assert.ok(capturedHTML.includes('class="practice-kotoba-list practice-option-kotoba"'),
    'Option kotoba list rendered');

  // Both prompt and option lists must contain <ruby class="kotoba-ruby">
  const promptListIdx = capturedHTML.indexOf('practice-question-kotoba');
  const optionListIdx = capturedHTML.indexOf('practice-option-kotoba');

  const promptPart = capturedHTML.substring(promptListIdx, promptListIdx + 400);
  const optionPart = capturedHTML.substring(optionListIdx, optionListIdx + 400);

  assert.ok(promptPart.includes('<ruby class="kotoba-ruby">'), 'Prompt list uses kotoba-ruby');
  assert.ok(optionPart.includes('<ruby class="kotoba-ruby">'), 'Option list uses kotoba-ruby');
  console.log('✔ Scenario 5 PASSED: Prompt and option rows utilize identical ruby rendering.');
}

// =============================================================================
// SCENARIO 6: Zero additional furigana state
// =============================================================================
console.log('\n--- SCENARIO 6: Zero additional furigana state ---');
{
  const s = createMockSession();
  sandbox.state.activeSession = s;
  const qId = 'kunci1-q001';

  toggleSelectiveKotoba(s, qId, null);

  const selState = s.selectiveState;
  const qState = selState.questions[qId];

  assert.equal(selState.furigana, undefined, 'Must not create selectiveState.furigana');
  assert.equal(qState.furigana, undefined, 'Must not create qState.furigana');
  assert.deepEqual(Object.keys(qState), ['translation', 'kotoba', 'options'], 'qState keys restricted to translation, kotoba, options');
  console.log('✔ Scenario 6 PASSED: Zero secondary furigana state created.');
}

// =============================================================================
// SCENARIO 7: Toolbar F remains sole master visibility toggle
// =============================================================================
console.log('\n--- SCENARIO 7: Toolbar F remains sole master visibility toggle ---');
{
  const entries = resolveKotobaEntries('kunci1-q001', null);
  const html = renderKotobaList(entries);

  // Notice: The HTML itself always retains <rt>${furigana}</rt>.
  // Its visibility is controlled externally via body.hide-furigana in CSS,
  // NOT by conditional stripping inside renderKotobaList().
  assert.ok(html.includes('<rt>'), 'HTML output always preserves <rt> markup');
  assert.ok(!html.includes('style="display: none"'), 'renderKotobaList must not inline display: none');
  assert.ok(!html.includes('style="visibility: hidden"'), 'renderKotobaList must not inline visibility: hidden');
  console.log('✔ Scenario 7 PASSED: Visibility governed cleanly by external body class without inline styles.');
}

// =============================================================================
// SCENARIO 8: Regression Safety — T017 and T019 behavior preserved
// =============================================================================
console.log('\n--- SCENARIO 8: Regression Safety — T017 & T019 preserved ---');
{
  // Empty input safety
  assert.equal(renderKotobaList([]), '', 'Empty array returns empty string');
  assert.equal(renderKotobaList(null), '', 'Null input returns empty string');
  assert.equal(renderKotobaList(undefined), '', 'Undefined input returns empty string');

  // Vertical stacking order
  const s = createMockSession();
  sandbox.state.activeSession = s;
  sandbox.state.practiceTranslationOpen = true;
  toggleSelectiveKotoba(s, 'kunci1-q001', null);

  renderExam();

  const promptPos = capturedHTML.indexOf('class="question-prompt');
  const transPos = capturedHTML.indexOf('class="practice-question-translation"');
  const kotobaPos = capturedHTML.indexOf('class="practice-kotoba-list practice-question-kotoba"');

  assert.ok(promptPos !== -1 && transPos !== -1 && kotobaPos !== -1, 'All three sections rendered');
  assert.ok(promptPos < transPos, 'Prompt precedes Translation');
  assert.ok(transPos < kotobaPos, 'Translation precedes Kotoba');
  console.log('✔ Scenario 8 PASSED: T017 resolver & stacking order rules preserved 100%.');
}

console.log('\n================================================================================');
console.log('ALL 8 T020 KOTOBA RUBY RENDERING SCENARIOS PASSED 100%!');
console.log('================================================================================\n');
