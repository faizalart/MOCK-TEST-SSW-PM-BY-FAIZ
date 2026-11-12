// scratch/patch-app-t013.mjs
import fs from 'node:fs';

const raw = fs.readFileSync('app.js', 'utf8');
const isCrlf = raw.includes('\r\n');
const eol = isCrlf ? '\r\n' : '\n';

// 1. Target 1: Insert toggleSelectiveTrans right after getOptionKey
const target1 = `function getOptionKey(qId, opt) {
  if (qId == null) return null;
  const cleanQId = String(qId).trim();
  if (!cleanQId) return null;
  if (!opt || typeof opt !== 'object') return null;

  let rawOptId = '';
  if ('originalId' in opt) {
    if (opt.originalId != null && String(opt.originalId).trim()) {
      rawOptId = String(opt.originalId).trim();
    }
  } else if (opt.id != null && String(opt.id).trim()) {
    rawOptId = String(opt.id).trim();
  }

  if (!rawOptId) return null;

  return \`\${cleanQId}::\${rawOptId}\`;
}`;

const replace1 = [
  'function getOptionKey(qId, opt) {',
  '  if (qId == null) return null;',
  '  const cleanQId = String(qId).trim();',
  '  if (!cleanQId) return null;',
  "  if (!opt || typeof opt !== 'object') return null;",
  '',
  "  let rawOptId = '';",
  "  if ('originalId' in opt) {",
  '    if (opt.originalId != null && String(opt.originalId).trim()) {',
  '      rawOptId = String(opt.originalId).trim();',
  '    }',
  "  } else if (opt.id != null && String(opt.id).trim()) {",
  '    rawOptId = String(opt.id).trim();',
  '  }',
  '',
  '  if (!rawOptId) return null;',
  '',
  '  return `${cleanQId}::${rawOptId}`;',
  '}',
  '',
  '/* ==========================================================================',
  '   FEATURE 008: Selective Translation Toggle Handler (Task T013)',
  '   ========================================================================== */',
  'function toggleSelectiveTrans(s = activeExam(), qId, optKey = null) {',
  "  if (!s || s.mode !== 'practice') return null;",
  '  if (!qId) return null;',
  '',
  '  if (optKey) {',
  '    const optState = getSelectiveOptionState(s, qId, optKey, true);',
  '    if (!optState) return null;',
  '    const currentEffective = (optState.translation !== null && optState.translation !== undefined)',
  '      ? Boolean(optState.translation)',
  '      : Boolean(state.practiceTranslationOpen);',
  '    optState.translation = !currentEffective;',
  '    return optState.translation;',
  '  }',
  '',
  '  const qState = getSelectiveQuestionState(s, qId, true);',
  '  if (!qState) return null;',
  '  const currentEffective = (qState.translation !== null && qState.translation !== undefined)',
  '    ? Boolean(qState.translation)',
  '    : Boolean(state.practiceTranslationOpen);',
  '  qState.translation = !currentEffective;',
  '  return qState.translation;',
  '}'
].join(eol);

const target1WithEol = target1.split('\n').map(l => l.replace(/\r$/, '')).join(eol);
if (!raw.includes(target1WithEol)) throw new Error('Target 1 not found');

// 2. Target 2: Insert case 'toggle-selective-trans' into handleAction right after toggle-practice-translation
const target2 = `    case 'toggle-practice-translation': {
      const s = activeExam();
      const isUntimedPractice = Boolean(s && s.mode === 'practice' && !s.deadline && !s.timed);
      if (!isUntimedPractice) break;
      state.practiceTranslationOpen = !state.practiceTranslationOpen;
      renderExam();
      break;
    }`;

const replace2 = [
  "    case 'toggle-practice-translation': {",
  '      const s = activeExam();',
  "      const isUntimedPractice = Boolean(s && s.mode === 'practice' && !s.deadline && !s.timed);",
  '      if (!isUntimedPractice) break;',
  '      state.practiceTranslationOpen = !state.practiceTranslationOpen;',
  '      renderExam();',
  '      break;',
  '    }',
  "    case 'toggle-selective-trans': {",
  '      const s = activeExam();',
  "      const isUntimedPractice = Boolean(s && s.mode === 'practice' && !s.deadline && !s.timed);",
  '      if (!isUntimedPractice) break;',
  '      const q = currentExamQuestion(s);',
  '      if (!q) break;',
  '      const targetType = el.dataset.targetType;',
  "      const optKey = targetType === 'option' ? (el.dataset.optKey || null) : null;",
  '      toggleSelectiveTrans(s, q.id, optKey);',
  '      renderExam();',
  '      break;',
  '    }'
].join(eol);

const target2WithEol = target2.split('\n').map(l => l.replace(/\r$/, '')).join(eol);
if (!raw.includes(target2WithEol)) throw new Error('Target 2 not found');

// 3. Target 3: Expose toggleSelectiveTrans on window
const target3 = `  window.getOptionKey = getOptionKey;`;
const replace3 = `  window.getOptionKey = getOptionKey;${eol}  window.toggleSelectiveTrans = toggleSelectiveTrans;`;
if (!raw.includes(target3)) throw new Error('Target 3 not found');

let updated = raw.replace(target1WithEol, replace1);
updated = updated.replace(target2WithEol, replace2);
updated = updated.replace(target3, replace3);

fs.writeFileSync('app.js', updated, 'utf8');
console.log('T013 patch successfully applied to app.js');
