// scratch/assert-t017-production-kotoba.mjs
import fs from 'node:fs';
import assert from 'node:assert/strict';

console.log('================================================================================');
console.log('FEATURE 008: Practice Selective Translation & Kotoba Reveal');
console.log('TASK T017: Production resolveKotobaEntries & renderKotobaList Verification');
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
    getOptionKey,
    resolveKotobaEntries,
    renderKotobaList,
    setKotobaData
  };
`
);

const {
  renderExam,
  initSelectiveState,
  getSelectiveQuestionState,
  getSelectiveOptionState,
  getOptionKey,
  resolveKotobaEntries,
  renderKotobaList,
  setKotobaData
} = fnModule(sandbox);

assert.equal(typeof resolveKotobaEntries, 'function', 'Production resolveKotobaEntries must be a function');
assert.equal(typeof renderKotobaList, 'function', 'Production renderKotobaList must be a function');
assert.equal(typeof setKotobaData, 'function', 'setKotobaData must be a function');

setKotobaData(mapping, dict);

// Setup sample questions & session
const sampleQ = {
  id: 'kunci1-q001',
  prompt: '食品工場での衛生管理について適切なものはどれか。',
  promptTranslation: 'Manakah yang tepat mengenai manajemen kebersihan di pabrik makanan?',
  instructions: '正しいものを一つ選びなさい。',
  options: [
    { id: 'A', originalId: 'A', text: '床に落ちた原料をそのまま使う。', translation: 'Menggunakan langsung bahan baku yang jatuh ke lantai.' },
    { id: 'B', originalId: 'B', text: '定期的に手を洗う。', translation: 'Mencuci tangan secara berkala.' },
    { id: 'C', originalId: 'C', text: '作業着を私服の上に着ない。', translation: 'Tidak memakai pakaian kerja di luar pakaian biasa.' }
  ]
};

const session = {
  id: 'session-t017',
  mode: 'practice',
  deadline: null,
  timed: false,
  currentIndex: 0,
  questions: [sampleQ],
  answers: {},
  flaggedQuestions: []
};

initSelectiveState(session);
sandbox.state.activeSession = session;

// -----------------------------------------------------------------------------
// Criterion 1: Production Prompt Resolver
// -----------------------------------------------------------------------------
console.log('Testing 1: Production prompt resolver');
const promptTerms = resolveKotobaEntries('kunci1-q001', null);
assert.ok(Array.isArray(promptTerms), 'Prompt terms must be an array');
assert.equal(promptTerms.length, 7, 'kunci1-q001 prompt has exactly 7 verified terms');
assert.equal(promptTerms[0].id, 'kb-1153930');
assert.equal(promptTerms[0].kanji, '安全');
assert.equal(promptTerms[0].furigana, 'あんぜん');
assert.ok(promptTerms[0].arti.includes('Keselamatan'));
console.log('✔ Criterion 1 Passed: Production prompt resolver returns verified term array.');

// -----------------------------------------------------------------------------
// Criterion 2: Production Option Resolver & Shuffling Invariance
// -----------------------------------------------------------------------------
console.log('Testing 2: Production option resolver & shuffling invariance');
const optAKey = 'kunci1-q001::A';
const optATermsPre = resolveKotobaEntries('kunci1-q001', optAKey);
assert.ok(optATermsPre.length > 0, 'Option A must resolve terms');

// Simulate shuffled option object where originalId is 'A' but visual id is 'C'
const shuffledOption = { id: 'C', originalId: 'A', text: 'Shuffled Option A' };
const optATermsPost = resolveKotobaEntries('kunci1-q001', shuffledOption);
assert.deepEqual(optATermsPost, optATermsPre, 'Option must resolve using originalId, NOT visual letter');

// Compare with visual Option C to prove distinct vocabulary
const optCTerms = resolveKotobaEntries('kunci1-q001', { id: 'C', originalId: 'C', text: 'Option C' });
assert.notDeepEqual(optATermsPost, optCTerms, 'Option A and Option C have distinct terms');
console.log('✔ Criterion 2 Passed: Option resolver preserves originalId and is shuffle-invariant.');

// -----------------------------------------------------------------------------
// Criterion 3: Mapping References Resolved to Dictionary
// -----------------------------------------------------------------------------
console.log('Testing 3: Mapping references resolved to dictionary terms');
const bonusQTerms = resolveKotobaEntries('bonus-soal-1-q001', null);
assert.ok(bonusQTerms.length > 0, 'Bonus soal 1 q1 resolves terms');
for (const term of bonusQTerms) {
  assert.equal(term.status, 'verified');
  assert.ok(dict.terms[term.id], `Term ${term.id} must exist in dict.terms`);
}
console.log('✔ Criterion 3 Passed: Mapping references cleanly resolve to dictionary terms.');

// -----------------------------------------------------------------------------
// Criterion 4: Status Gate Enforcement (Zero Leakage of Unresolved Terms)
// -----------------------------------------------------------------------------
console.log('Testing 4: Status gate enforcement (Unresolved terms strictly excluded)');
const unresolvedId = Object.keys(dict.terms).find(k => dict.terms[k].status === 'unresolved');
assert.ok(unresolvedId, 'Unresolved term exists');
const mixedArray = [promptTerms[0].id, unresolvedId, 'kb-fake-id-9999'];
const filteredOutput = resolveKotobaEntries(mixedArray);
assert.equal(filteredOutput.length, 1, 'Only verified terms pass');
assert.equal(filteredOutput[0].id, promptTerms[0].id);
assert.ok(!filteredOutput.some(t => t.id === unresolvedId), 'Unresolved terms MUST NOT leak');
console.log('✔ Criterion 4 Passed: Status gate strictly excludes unresolved and fake terms.');

// -----------------------------------------------------------------------------
// Criterion 5: Meaning and Reading Schema Intact
// -----------------------------------------------------------------------------
console.log('Testing 5: Meaning and reading schema intact');
for (const term of promptTerms) {
  assert.ok(typeof term.id === 'string' && term.id.startsWith('kb-'));
  assert.ok(typeof term.kanji === 'string' && term.kanji.length > 0);
  assert.ok(typeof term.furigana === 'string' && term.furigana.length > 0);
  assert.ok(typeof term.arti === 'string' && term.arti.length > 0);
  assert.equal(term.status, 'verified');
}
console.log('✔ Criterion 5 Passed: Term schema preserves kanji, furigana, and Indonesian arti.');

// -----------------------------------------------------------------------------
// Criterion 6: Duplication Stripped in Single List
// -----------------------------------------------------------------------------
console.log('Testing 6: Duplication stripped in single list');
const dupList = [promptTerms[0].id, promptTerms[0].id, promptTerms[1].id, promptTerms[0].id];
const dedupOutput = resolveKotobaEntries(dupList);
assert.equal(dedupOutput.length, 2, 'Duplicate IDs collapsed into unique entries');
assert.equal(dedupOutput[0].id, promptTerms[0].id);
assert.equal(dedupOutput[1].id, promptTerms[1].id);
console.log('✔ Criterion 6 Passed: Deduplication preserves first occurrence order without duplicates.');

// -----------------------------------------------------------------------------
// Criterion 7: Prompt and Different Options Strictly Isolated
// -----------------------------------------------------------------------------
console.log('Testing 7: Prompt and different options strictly isolated');
const qPromptKotoba = resolveKotobaEntries('kunci1-q001', null);
const qOptAKotoba = resolveKotobaEntries('kunci1-q001', 'kunci1-q001::A');
const qOptBKotoba = resolveKotobaEntries('kunci1-q001', 'kunci1-q001::B');
assert.notDeepEqual(qPromptKotoba, qOptAKotoba);
assert.notDeepEqual(qOptAKotoba, qOptBKotoba);
console.log('✔ Criterion 7 Passed: Prompt and option lists maintain strict scope isolation.');

// -----------------------------------------------------------------------------
// Criterion 8: Missing/Invalid Input Safety (Zero Crashes)
// -----------------------------------------------------------------------------
console.log('Testing 8: Missing/invalid input safety');
assert.deepEqual(resolveKotobaEntries(null), []);
assert.deepEqual(resolveKotobaEntries(undefined), []);
assert.deepEqual(resolveKotobaEntries('non-existent-q-id'), []);
assert.deepEqual(resolveKotobaEntries('kunci1-q001', 'kunci1-q001::NON_EXISTENT_OPT'), []);
assert.deepEqual(resolveKotobaEntries([null, undefined, '', 'non-existent-kb-id']), []);
console.log('✔ Criterion 8 Passed: Graceful fallback to [] with zero exceptions.');

// -----------------------------------------------------------------------------
// Criterion 9: Deterministic Results & Immutability
// -----------------------------------------------------------------------------
console.log('Testing 9: Deterministic results and immutability');
const r1 = resolveKotobaEntries('kunci1-q001', null);
const r2 = resolveKotobaEntries('kunci1-q001', null);
assert.deepEqual(r1, r2);
r1.push({ fake: true });
const r3 = resolveKotobaEntries('kunci1-q001', null);
assert.equal(r3.some(x => x.fake), false, 'Mutating output does not contaminate registry');
console.log('✔ Criterion 9 Passed: Resolver is 100% deterministic and immutable.');

// -----------------------------------------------------------------------------
// Criterion 10: renderKotobaList() Formats Terms in Minimal Vertical List
// -----------------------------------------------------------------------------
console.log('Testing 10: renderKotobaList() formatting');
const markup = renderKotobaList(promptTerms.slice(0, 2));
assert.ok(markup.includes('class="practice-kotoba-item"'));
assert.ok(markup.includes('data-term-id="kb-1153930"'));
assert.ok(markup.includes('<ruby class="kotoba-ruby">安全<rt>あんぜん</rt></ruby>'));
assert.ok(markup.includes('<span class="kotoba-separator" aria-hidden="true">—</span>'));
assert.ok(markup.includes('<span class="kotoba-meaning" lang="id">'));
assert.ok(markup.includes('Keselamatan kerja dan keamanan higienitas pangan (Food Safety)'));
console.log('✔ Criterion 10 Passed: renderKotobaList() produces semantic, minimal markup.');

// -----------------------------------------------------------------------------
// Criterion 11: Content Escaped with esc()
// -----------------------------------------------------------------------------
console.log('Testing 11: Content escaping security');
const unsafeEntry = [{
  id: 'kb-test-xss',
  kanji: '<script>alert(1)</script>',
  furigana: '"><svg onload=alert(2)>',
  arti: 'Arti "dengan & tanda <bahaya>',
  status: 'verified'
}];
const escapedMarkup = renderKotobaList(unsafeEntry);
assert.ok(!escapedMarkup.includes('<script>'), 'Script tag must be escaped');
assert.ok(escapedMarkup.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
assert.ok(!escapedMarkup.includes('<svg onload=alert(2)>'), 'SVG tag must be escaped');
assert.ok(escapedMarkup.includes('&lt;svg onload=alert(2)&gt;'));
assert.ok(escapedMarkup.includes('&amp;'));
assert.ok(escapedMarkup.includes('&quot;'));
console.log('✔ Criterion 11 Passed: Dictionary content strictly escaped, zero XSS vulnerability.');

// -----------------------------------------------------------------------------
// Criterion 12: Furigana Toolbar F & body.hide-furigana Compatibility
// -----------------------------------------------------------------------------
console.log('Testing 12: Furigana toolbar F compatibility');
// Term uses native <ruby class="kotoba-ruby"><rt>furigana</rt></ruby>
// Existing CSS rules in CBT shell toggle visibility via body.hide-furigana rt { display: none }
assert.ok(markup.includes('<ruby class="kotoba-ruby">'));
assert.ok(markup.includes('<rt>あんぜん</rt>'));
console.log('✔ Criterion 12 Passed: Uses native <ruby><rt> for seamless toolbar F synchronization.');

// -----------------------------------------------------------------------------
// Criterion 13: Kotoba List Rendered ONLY when Target State is Active
// -----------------------------------------------------------------------------
console.log('Testing 13: Conditional rendering based on active state');
// Initial: Both prompt and option kotoba are false
renderExam();
assert.ok(!capturedHTML.includes('class="practice-kotoba-list practice-question-kotoba"'), 'Prompt Kotoba list NOT rendered when state is false');
assert.ok(!capturedHTML.includes('class="practice-kotoba-list practice-option-kotoba"'), 'Option Kotoba list NOT rendered when state is false');

// Activate Prompt Kotoba
const qState = getSelectiveQuestionState(session, 'kunci1-q001', true);
qState.kotoba = true;
renderExam();
assert.ok(capturedHTML.includes('class="practice-kotoba-list practice-question-kotoba"'), 'Prompt Kotoba list rendered when qState.kotoba is true');
assert.ok(!capturedHTML.includes('class="practice-kotoba-list practice-option-kotoba"'), 'Option Kotoba list STILL NOT rendered');

// Activate Option A Kotoba
const optAState = getSelectiveOptionState(session, 'kunci1-q001', sampleQ.options[0], true);
optAState.kotoba = true;
renderExam();
assert.ok(capturedHTML.includes('class="practice-kotoba-list practice-option-kotoba"'), 'Option Kotoba list rendered when optAState.kotoba is true');
console.log('✔ Criterion 13 Passed: Kotoba list is mounted dynamically only when active.');

// -----------------------------------------------------------------------------
// Criterion 14: Vertical Content Stacking Order Enforced
// -----------------------------------------------------------------------------
console.log('Testing 14: Vertical content stacking order (Japanese -> Translation -> Kotoba)');
// 1. Both Translation and Kotoba active on Prompt
qState.translation = true;
qState.kotoba = true;
renderExam();

const promptCenterStart = capturedHTML.indexOf('class="practice-prompt-center"');
const promptCenterEnd = capturedHTML.indexOf('</button>', promptCenterStart);
const promptCenterHTML = capturedHTML.substring(promptCenterStart, promptCenterEnd);

const promptJaIdx = promptCenterHTML.indexOf('class="question-prompt');
const promptTransIdx = promptCenterHTML.indexOf('class="practice-question-translation"');
const promptKotobaIdx = promptCenterHTML.indexOf('class="practice-kotoba-list practice-question-kotoba"');

assert.ok(promptJaIdx !== -1 && promptTransIdx !== -1 && promptKotobaIdx !== -1);
assert.ok(promptJaIdx < promptTransIdx, 'Japanese prompt must precede translation');
assert.ok(promptTransIdx < promptKotobaIdx, 'Translation must precede Kotoba list');

// 2. Translation OFF, Kotoba active on Prompt
qState.translation = false;
qState.kotoba = true;
renderExam();

const promptCenterStart2 = capturedHTML.indexOf('class="practice-prompt-center"');
const promptCenterEnd2 = capturedHTML.indexOf('</button>', promptCenterStart2);
const promptCenterHTML2 = capturedHTML.substring(promptCenterStart2, promptCenterEnd2);

const promptJaIdx2 = promptCenterHTML2.indexOf('class="question-prompt');
const promptKotobaIdx2 = promptCenterHTML2.indexOf('class="practice-kotoba-list practice-question-kotoba"');
assert.ok(!promptCenterHTML2.includes('class="practice-question-translation"'), 'Translation absent when OFF');
assert.ok(promptJaIdx2 < promptKotobaIdx2, 'Kotoba list directly follows Japanese prompt when translation is OFF');
console.log('✔ Criterion 14 Passed: Vertical stacking order strictly enforced.');

console.log('\n================================================================================');
console.log('ALL 14 T017 RESOLVER & VIEWER ASSERTIONS PASSED 100%!');
console.log('================================================================================\n');
