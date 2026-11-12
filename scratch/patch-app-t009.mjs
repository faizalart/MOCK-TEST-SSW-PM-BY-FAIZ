// scratch/patch-app-t009.mjs
import fs from 'node:fs';

const raw = fs.readFileSync('app.js', 'utf8');
const isCrlf = raw.includes('\r\n');
const eol = isCrlf ? '\r\n' : '\n';

// 1. Target 1: Interrupted session cleanup
const target1 = `    active.status = 'interrupted';`;
const replace1 = `    if (active && active.selectiveState) delete active.selectiveState;${eol}    if (state.activeSession && state.activeSession.selectiveState) delete state.activeSession.selectiveState;${eol}    active.status = 'interrupted';`;
if (!raw.includes(target1)) throw new Error('Target 1 not found');

// 2. Target 2: Start exam practice session initialization
const target2 = `  state.activeSession = session;${eol}  state.practiceTranslationOpen = false;`;
const replace2 = `  state.activeSession = session;${eol}  if (isPractice) {${eol}    initSelectiveState(session);${eol}  }${eol}  state.practiceTranslationOpen = false;`;
if (!raw.includes(target2)) throw new Error('Target 2 not found');

// 3. Target 3: Finish exam cleanup
const target3 = `  state.finalizing = true;${eol}  state.practiceTranslationOpen = false;${eol}  state.examSettingsOpen = false;`;
const replace3 = `  state.finalizing = true;${eol}  state.practiceTranslationOpen = false;${eol}  state.examSettingsOpen = false;${eol}  if (s && s.selectiveState) {${eol}    delete s.selectiveState;${eol}  }`;
if (!raw.includes(target3)) throw new Error('Target 3 not found');

// 4. Target 4: Resume session practice initialization
const target4 = `          state.activeSession = s;${eol}          state.page = 'exam';`;
const replace4 = `          state.activeSession = s;${eol}          if (s.mode === 'practice' && !s.selectiveState) {${eol}            initSelectiveState(s);${eol}          }${eol}          state.page = 'exam';`;
if (!raw.includes(target4)) throw new Error('Target 4 not found');

// 5. Target 5: Insert Feature 008 helper functions
const target5 = `function answeredCount(session = activeExam()) { return (session?.questions || []).filter(q => session.answers[q.id] != null).length; }`;
const helpers = [
  '',
  '/* ==========================================================================',
  '   FEATURE 008: Session-Scoped Selective State (Task T009)',
  '   ========================================================================== */',
  'function initSelectiveState(s) {',
  "  if (!s || s.mode !== 'practice') return null;",
  '  const stateObj = { questions: {} };',
  "  Object.defineProperty(s, 'selectiveState', {",
  '    value: stateObj,',
  '    writable: true,',
  '    enumerable: false,',
  '    configurable: true',
  '  });',
  '  return stateObj;',
  '}',
  '',
  'function getSelectiveState(s = activeExam()) {',
  "  if (!s || s.mode !== 'practice') return null;",
  '  if (!s.selectiveState) {',
  '    initSelectiveState(s);',
  '  }',
  '  return s.selectiveState;',
  '}',
  '',
  'function getSelectiveQuestionState(s = activeExam(), qId, create = false) {',
  '  const selState = getSelectiveState(s);',
  '  if (!selState || !qId) return null;',
  '  if (!selState.questions[qId]) {',
  '    if (!create) return null;',
  '    selState.questions[qId] = {',
  '      translation: null,',
  '      kotoba: false,',
  '      options: {}',
  '    };',
  '  }',
  '  return selState.questions[qId];',
  '}',
  '',
  'function getSelectiveOptionState(s = activeExam(), qId, origOptId, create = false) {',
  '  const qState = getSelectiveQuestionState(s, qId, create);',
  '  if (!qState || !origOptId) return null;',
  '  if (!qState.options[origOptId]) {',
  '    if (!create) return null;',
  '    qState.options[origOptId] = {',
  '      translation: null,',
  '      kotoba: false',
  '    };',
  '  }',
  '  return qState.options[origOptId];',
  '}'
].join(eol);

const replace5 = target5 + eol + helpers;
if (!raw.includes(target5)) throw new Error('Target 5 not found');

// 6. Target 6: Expose on window
const target6 = `  window.finishExam = finishExam;`;
const replace6 = [
  '  window.finishExam = finishExam;',
  '  window.initSelectiveState = initSelectiveState;',
  '  window.getSelectiveState = getSelectiveState;',
  '  window.getSelectiveQuestionState = getSelectiveQuestionState;',
  '  window.getSelectiveOptionState = getSelectiveOptionState;'
].join(eol);
if (!raw.includes(target6)) throw new Error('Target 6 not found');

let updated = raw.replace(target1, replace1);
updated = updated.replace(target2, replace2);
updated = updated.replace(target3, replace3);
updated = updated.replace(target4, replace4);
updated = updated.replace(target5, replace5);
updated = updated.replace(target6, replace6);

fs.writeFileSync('app.js', updated, 'utf8');
console.log('Clean patch applied to app.js');
