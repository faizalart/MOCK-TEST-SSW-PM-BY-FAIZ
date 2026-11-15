import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';
import { auditSentenceSpans } from '../../scripts/audit-kotoba-coverage.mjs';
import { validateContextCompleteness } from '../../scripts/validate-otaff-kotoba-completeness.mjs';
import {
  extractQuestionPlainText,
  extractOptionId,
  extractOptionPlainText,
  hasKanji
} from '../../scripts/lib/kotoba-pipeline-utils.mjs';

const ROOT = process.cwd();

function sha256File(relPath) {
  const abs = path.resolve(ROOT, relPath);
  if (!fs.existsSync(abs)) return null;
  return crypto.createHash('sha256').update(fs.readFileSync(abs)).digest('hex');
}

function readJsonRel(relPath) {
  return JSON.parse(fs.readFileSync(path.resolve(ROOT, relPath), 'utf8'));
}

// Parse BUILTIN_PACKAGES_META from app.js
const appJs = fs.readFileSync(path.resolve(ROOT, 'app.js'), 'utf8');
const metaMatch = appJs.match(/const BUILTIN_PACKAGES_META = (\[[\s\S]*?\n\]);/);
const builtinMeta = metaMatch ? vm.runInNewContext(metaMatch[1]) : [];

// Load sidecars
const dict = readJsonRel('data/sharedKotobaDictionary.json');
const mapping = readJsonRel('data/kotobaMapping.json');
const extra = readJsonRel('data/kotoba-dan-kategori-tambahan.json');

console.log('=== SIDECAR METADATA ===');
console.log('dict keys:', Object.keys(dict), '_meta:', dict._meta, 'terms count:', Object.keys(dict.terms || {}).length);
console.log('mapping keys:', Object.keys(mapping), '_meta:', mapping._meta,
  'questions:', Object.keys(mapping.questions || {}).length,
  'byCompositeKey:', Object.keys(mapping.byCompositeKey || {}).length,
  'options:', Object.keys(mapping.options || {}).length);
console.log('extra keys:', Object.keys(extra), '_meta:', extra._meta,
  'entries count:', Array.isArray(extra.entries) ? extra.entries.length : typeof extra.entries,
  'extra sample:', Array.isArray(extra.entries) && extra.entries[0] ? Object.keys(extra.entries[0]) : null);

// Check extra sample
const extraKeys = Object.keys(extra.entries || {});
if (extraKeys.length) {
  console.log('extra sample key:', extraKeys[0], 'val:', extra.entries[extraKeys[0]]);
}

// Inspect root vs data/ JSON files
const rootJsons = fs.readdirSync(ROOT).filter(f => f.endsWith('.json'));
const dataJsons = fs.readdirSync(path.join(ROOT, 'data')).filter(f => f.endsWith('.json'));

console.log('\n=== ROOT VS DATA FILE HASHES ===');
console.log('rootJsons:', rootJsons.length, 'dataJsons:', dataJsons.length);
for (const rf of rootJsons) {
  const rHash = sha256File(rf);
  const dHash = sha256File(`data/${rf}`);
  console.log(`  ${rf}: root=${rHash?.slice(0, 12)} data=${dHash ? dHash.slice(0, 12) : 'NONE'} same=${rHash === dHash}`);
}

// Inspect data/questions.json and all package JSON files loaded by app.js
const loaderFiles = [
  'data/ssw-pm-kunci-ujian-1.json',
  'data/ssw-pm-kunci-ujian-2.json',
  'data/ssw-pm-all-kunci-ujian-3-to-13.json',
  'data/ssw-pm-bonus-soal-1-to-10-bundle.json',
  'data/ssw-pm-special-lab-bundle.json',
  'data/ssw-pm-tipe2-nguyen1.json',
  'data/ssw-pm-kunci-ujian-14.json',
  'data/ssw-pm-kunci-ujian-15.json',
  'data/ssw-pm-kunci-ujian-16.json',
  'data/questions.json',
  'data/latsol-nguyen-01.json',
  'data/latsol-nguyen-02.json',
  'data/latsol-nguyen-03.json',
  'data/latsol-nguyen-04.json',
  'data/latsol-nguyen-05.json',
  'data/latsol-nguyen-06.json',
  'data/latsol-nguyen-07.json',
  'data/latsol-nguyen-08.json',
  'data/latsol-nguyen-09.json',
  'data/latsol-nguyen-10.json',
  'data/latsol-reguler-01.json',
  'data/latsol-reguler-02.json',
  'data/latsol-reguler-03.json',
  'data/latsol-reguler-04.json',
  'data/latsol-reguler-05.json',
  'data/latsol-reguler-06.json',
  'data/latsol-tambahan-01.json',
  'data/latsol-tambahan-02.json',
  'data/latsol-hitungan-01.json',
  'data/pilot-otaff51-01.json',
  'data/latsol-otaff-pm51-01.json',
  'data/latsol-otaff-pm51-02.json',
  'data/latsol-otaff-pm51-03.json',
  'data/latsol-otaff-pm51-04.json',
  'data/latsol-otaff-pm51-05.json',
  'data/latsol-otaff-pm51-06.json',
  'data/latsol-otaff-pm51-07.json',
  'data/latsol-otaff-pm51-08.json',
  'data/latsol-otaff-pm51-09.json',
  'data/latsol-otaff-pm51-10.json'
];

// Check if any extra JSONs exist in data/
const knownSet = new Set(loaderFiles.map(f => path.basename(f)));
for (const df of dataJsons) {
  if (!knownSet.has(df) && !['sharedKotobaDictionary.json', 'kotobaMapping.json', 'kotoba-dan-kategori-tambahan.json'].includes(df)) {
    console.log('EXTRA FILE IN data/:', df);
  }
}

// Inspect questions.json
const qJson = readJsonRel('data/questions.json');
console.log('\n=== data/questions.json ===');
console.log('isArray:', Array.isArray(qJson), 'keys:', Array.isArray(qJson) ? 'array' : Object.keys(qJson));
const qList = Array.isArray(qJson) ? qJson : (qJson.questions || []);
console.log('count:', qList.length, 'setIds:', [...new Set(qList.map(q => q.setId))]);

// Spec 009 audit ledger check
const spec009Ledger = readJsonRel('specs/009-cbt-shortcuts-zoom-kotoba/audit/unresolved-spans-report.json');
const spec009Files = new Set((spec009Ledger._meta?.packages || []).map(p => p.packageFile));

// Group questions by setId across all loader files (excluding questions.json duplicate unless unique)
const packagesMap = new Map();

for (const rel of loaderFiles) {
  if (rel === 'data/questions.json') continue;
  const data = readJsonRel(rel);
  const topKeys = Array.isArray(data) ? ['<Array>'] : Object.keys(data);
  const questions = Array.isArray(data) ? data : (data.questions || []);
  const stat = fs.statSync(path.resolve(ROOT, rel));
  for (const q of questions) {
    const sid = q.setId || data.setId || path.basename(rel, '.json');
    if (!packagesMap.has(sid)) {
      packagesMap.set(sid, {
        setId: sid,
        setName: q.setName || data.setName || data.title || '',
        sourceFile: rel,
        fileMtime: stat.mtime.toISOString(),
        topKeys,
        metaCreatedAt: data._meta?.createdAt || data.createdAt || null,
        qCreatedAts: new Set(),
        qKeysSample: Object.keys(q),
        optKeysSample: q.options?.[0] ? Object.keys(q.options[0]) : [],
        questions: []
      });
    }
    const pkg = packagesMap.get(sid);
    if (q.createdAt) pkg.qCreatedAts.add(q.createdAt);
    pkg.questions.push(q);
  }
}

console.log(`\n=== DISCOVERED PACKAGES (${packagesMap.size}) ===`);
console.log(`BUILTIN_PACKAGES_META count: ${builtinMeta.length}`);
const metaIds = new Set(builtinMeta.map(m => m.id));
for (const sid of packagesMap.keys()) {
  if (!metaIds.has(sid)) console.log('  NOT IN BUILTIN_PACKAGES_META:', sid);
}
for (const m of builtinMeta) {
  if (!packagesMap.has(m.id)) console.log('  IN BUILTIN_PACKAGES_META BUT NOT IN DATA:', m.id);
}

const summaryRows = [];
for (const [sid, pkg] of packagesMap.entries()) {
  let optCount = 0;
  let promptWithMapping = 0;
  let optWithMapping = 0;
  let promptWithTerms = 0;
  let optWithTerms = 0;
  let totalChars = 0;
  let coveredChars = 0;
  let unresolvedSpansCount = 0;
  let validatorErrors = 0;
  let missingTermRefs = 0;
  let inlineKotobaQs = 0;
  let inlineKotobaOpts = 0;
  let rubyPrompts = 0;
  let transPrompts = 0;

  for (const q of pkg.questions) {
    if (q.kotoba && (!Array.isArray(q.kotoba) || q.kotoba.length > 0)) inlineKotobaQs++;
    if (String(q.prompt || '').includes('<ruby>')) rubyPrompts++;
    if (String(q.promptTranslation || '').trim()) transPrompts++;

    const pText = extractQuestionPlainText(q);
    const pIds = mapping.questions?.[q.id];
    if (Array.isArray(pIds)) {
      promptWithMapping++;
      if (pIds.length > 0) promptWithTerms++;
    }
    for (const id of (Array.isArray(pIds) ? pIds : [])) {
      if (!dict.terms?.[id]) missingTermRefs++;
    }
    const pSpan = auditSentenceSpans(pText, pIds || [], dict);
    totalChars += pSpan.length;
    coveredChars += Math.round((pSpan.coveredPct / 100) * pSpan.length);
    unresolvedSpansCount += pSpan.unresolvedSpans.length;

    const pVal = validateContextCompleteness({
      contextKey: q.id,
      html: q.prompt || q.questionText || pText,
      termIds: pIds,
      dict,
      otaffKnownKanjis: null
    });
    validatorErrors += pVal.length;

    const opts = Array.isArray(q.options) ? q.options : [];
    for (let i = 0; i < opts.length; i++) {
      optCount++;
      const opt = opts[i];
      if (opt.kotoba && (!Array.isArray(opt.kotoba) || opt.kotoba.length > 0)) inlineKotobaOpts++;
      const optId = extractOptionId(opt, i);
      const ck = `${q.id}::${optId}`;
      const oIds = Array.isArray(mapping.byCompositeKey?.[ck])
        ? mapping.byCompositeKey[ck]
        : (Array.isArray(mapping.options?.[q.id]?.[optId]) ? mapping.options[q.id][optId] : null);
      if (Array.isArray(oIds)) {
        optWithMapping++;
        if (oIds.length > 0) optWithTerms++;
      }
      for (const id of (Array.isArray(oIds) ? oIds : [])) {
        if (!dict.terms?.[id]) missingTermRefs++;
      }
      const oText = extractOptionPlainText(opt);
      const oSpan = auditSentenceSpans(oText, oIds || [], dict);
      totalChars += oSpan.length;
      coveredChars += Math.round((oSpan.coveredPct / 100) * oSpan.length);
      unresolvedSpansCount += oSpan.unresolvedSpans.length;

      const oVal = validateContextCompleteness({
        contextKey: ck,
        html: opt.text || oText,
        termIds: oIds,
        dict,
        otaffKnownKanjis: null
      });
      validatorErrors += oVal.length;
    }
  }

  const spanCov = totalChars > 0 ? Number(((coveredChars / totalChars) * 100).toFixed(2)) : 100;
  const spec009Audited = spec009Files.has(path.basename(pkg.sourceFile));
  const row = {
    setId: sid,
    sourceFile: pkg.sourceFile,
    mtime: pkg.fileMtime.slice(0, 19),
    spec009Audited,
    qs: pkg.questions.length,
    opts: optCount,
    pMap: `${promptWithMapping}/${pkg.questions.length}`,
    pNonEmpty: `${promptWithTerms}/${pkg.questions.length}`,
    oMap: `${optWithMapping}/${optCount}`,
    oNonEmpty: `${optWithTerms}/${optCount}`,
    spanCovPct: spanCov,
    unresolvedSpans: unresolvedSpansCount,
    completenessErrs: validatorErrors,
    missingTermRefs,
    inlineKotoba: `${inlineKotobaQs}/${inlineKotobaOpts}`,
    rubyPct: Math.round((rubyPrompts / pkg.questions.length) * 100),
    transPct: Math.round((transPrompts / pkg.questions.length) * 100)
  };
  summaryRows.push(row);
}

console.table(summaryRows.map(r => ({
  setId: r.setId,
  file: path.basename(r.sourceFile),
  s009: r.spec009Audited ? 'Y' : 'N',
  qs: r.qs,
  opts: r.opts,
  pNonEmpty: r.pNonEmpty,
  oNonEmpty: r.oNonEmpty,
  spanCov: r.spanCovPct,
  unres: r.unresolvedSpans,
  valErr: r.completenessErrs,
  inline: r.inlineKotoba
})));

fs.mkdirSync(path.resolve(ROOT, 'deliverables/kotoba-audit-40'), { recursive: true });
fs.writeFileSync(
  path.resolve(ROOT, 'deliverables/kotoba-audit-40/phase0-discovery-raw.json'),
  JSON.stringify({ summaryRows }, null, 2)
);
