// scratch/patch-app-preflight-t010.mjs
import fs from 'node:fs';

const raw = fs.readFileSync('app.js', 'utf8');
const isCrlf = raw.includes('\r\n');
const eol = isCrlf ? '\r\n' : '\n';

// 1. Target 1: buildExamQuestions originalId assignment
const target1 = `        originalId: item.opt.originalId || item.opt.id || String.fromCharCode(65 + newIdx),`;
const replace1 = [
  '        originalId: (item.opt.originalId != null && String(item.opt.originalId).trim())',
  '          ? String(item.opt.originalId).trim()',
  '          : (item.opt.id != null && String(item.opt.id).trim() ? String(item.opt.id).trim() : null),'
].join(eol);

if (!raw.includes(target1)) throw new Error('Target 1 not found');

// 2. Target 2: getOptionKey hardened against visual fallback when originalId is explicitly null
const target2 = `function getOptionKey(qId, opt) {
  if (qId == null) return null;
  const cleanQId = String(qId).trim();
  if (!cleanQId) return null;
  if (!opt || typeof opt !== 'object') return null;

  const rawOptId = (opt.originalId != null && String(opt.originalId).trim())
    ? String(opt.originalId).trim()
    : (opt.id != null && String(opt.id).trim() ? String(opt.id).trim() : "");

  if (!rawOptId) return null;

  return \`\${cleanQId}::\${rawOptId}\`;
}`;

const replace2 = [
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
  '}'
].join(eol);

const target2WithEol = target2.split('\n').map(l => l.replace(/\r$/, '')).join(eol);
if (!raw.includes(target2WithEol)) throw new Error('Target 2 not found');

let updated = raw.replace(target1, replace1);
updated = updated.replace(target2WithEol, replace2);

fs.writeFileSync('app.js', updated, 'utf8');
console.log('Preflight T010 identity correction applied to app.js');
