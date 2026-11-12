// scratch/patch-app-t010.mjs
import fs from 'node:fs';

const raw = fs.readFileSync('app.js', 'utf8');
const isCrlf = raw.includes('\r\n');
const eol = isCrlf ? '\r\n' : '\n';

// 1. Target 1: In buildExamQuestions, preserve existing originalId if already set under repeated shuffle
const target1 = `        originalId: item.opt.id || String.fromCharCode(65 + newIdx),`;
const replace1 = `        originalId: item.opt.originalId || item.opt.id || String.fromCharCode(65 + newIdx),`;
if (!raw.includes(target1)) throw new Error('Target 1 not found');

// 2. Target 2: Update getSelectiveOptionState and insert getOptionKey
const target2 = `function getSelectiveOptionState(s = activeExam(), qId, origOptId, create = false) {
  const qState = getSelectiveQuestionState(s, qId, create);
  if (!qState || !origOptId) return null;
  if (!qState.options[origOptId]) {
    if (!create) return null;
    qState.options[origOptId] = {
      translation: null,
      kotoba: false
    };
  }
  return qState.options[origOptId];
}`;

const replace2 = [
  'function getSelectiveOptionState(s = activeExam(), qId, origOptId, create = false) {',
  '  const qState = getSelectiveQuestionState(s, qId, create);',
  '  if (!qState || !origOptId) return null;',
  '  let optId = origOptId;',
  "  if (typeof origOptId === 'object' && origOptId !== null) {",
  '    optId = (origOptId.originalId != null && String(origOptId.originalId).trim())',
  '      ? String(origOptId.originalId).trim()',
  '      : (origOptId.id != null && String(origOptId.id).trim() ? String(origOptId.id).trim() : "");',
  "  } else if (typeof origOptId === 'string' && origOptId.includes('::')) {",
  "    const parts = origOptId.split('::');",
  '    optId = parts[parts.length - 1];',
  '  }',
  '  if (!optId) return null;',
  '  optId = String(optId).trim();',
  '  if (!optId) return null;',
  '  if (!qState.options[optId]) {',
  '    if (!create) return null;',
  '    qState.options[optId] = {',
  '      translation: null,',
  '      kotoba: false',
  '    };',
  '  }',
  '  return qState.options[optId];',
  '}',
  '',
  '/* ==========================================================================',
  '   FEATURE 008: Stable Composite Option Key (Task T010)',
  '   ========================================================================== */',
  'function getOptionKey(qId, opt) {',
  '  if (qId == null) return null;',
  '  const cleanQId = String(qId).trim();',
  '  if (!cleanQId) return null;',
  "  if (!opt || typeof opt !== 'object') return null;",
  '',
  '  const rawOptId = (opt.originalId != null && String(opt.originalId).trim())',
  '    ? String(opt.originalId).trim()',
  '    : (opt.id != null && String(opt.id).trim() ? String(opt.id).trim() : "");',
  '',
  '  if (!rawOptId) return null;',
  '',
  '  return `${cleanQId}::${rawOptId}`;',
  '}'
].join(eol);

// Normalize target2 to file eol
const target2WithEol = target2.split('\n').map(l => l.replace(/\r$/, '')).join(eol);
if (!raw.includes(target2WithEol)) throw new Error('Target 2 not found');

// 3. Target 3: Window export
const target3 = `  window.getSelectiveOptionState = getSelectiveOptionState;`;
const replace3 = `  window.getSelectiveOptionState = getSelectiveOptionState;${eol}  window.getOptionKey = getOptionKey;`;
if (!raw.includes(target3)) throw new Error('Target 3 not found');

let updated = raw.replace(target1, replace1);
updated = updated.replace(target2WithEol, replace2);
updated = updated.replace(target3, replace3);

fs.writeFileSync('app.js', updated, 'utf8');
console.log('Clean patch applied to app.js for T010');
