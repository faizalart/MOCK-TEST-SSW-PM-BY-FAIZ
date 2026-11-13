import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  AUDIT_DIR,
  CANONICAL_PACKAGES,
  DEFAULT_DICT_PATH,
  DEFAULT_MAPPING_PATH,
  loadPackageQuestions,
  readJson,
  writeJsonAtomic
} from './lib/kotoba-pipeline-utils.mjs';

const NUMERIC_UNIT_REGEX =
  /(?:[ー－-])?[0-9０-９]+(?:[.,．][0-9０-９]+)?\s?(?:℃|°C|ºC|°|º|％|%|時間|ppm|pH|kg|mg|ml|cm|mm|kW|Hz|㎖|㎏|ｇ|秒間|分|秒|日|回|個|本|枚|名|人|円|歳|年|月|週|倍|割|番|号|点|問|つ|[gLmVAℓL])?/g;

const STRUCTURAL_PUNCT_REGEX =
  /[\s。、・「」『』（）()【】…〜～：:？！?!，,．.／/－\-―—＋+=×÷＜<>＞①-⑳※●○△□■◆◇★☆"'“”‘’\[\]{}･]+/g;

export function auditSentenceSpans(text, termIds = [], dict = { terms: {} }) {
  const str = typeof text === 'string' ? text : '';
  const length = str.length;
  if (length === 0) {
    return {
      text: '',
      length: 0,
      spans: [],
      structuralEntities: [],
      unresolvedSpans: [],
      coveredPct: 100
    };
  }

  const covered = new Array(length).fill(false);
  const structuralEntities = [];
  const spans = [];

  // 1. Numeric / unit entities
  for (const match of str.matchAll(NUMERIC_UNIT_REGEX)) {
    const start = match.index;
    const end = start + match[0].length;
    structuralEntities.push({ start, end, text: match[0], type: 'numeric_unit' });
    for (let i = start; i < end; i++) covered[i] = true;
  }

  // 2. Structural punctuation & whitespace
  for (const match of str.matchAll(STRUCTURAL_PUNCT_REGEX)) {
    const start = match.index;
    const end = start + match[0].length;
    structuralEntities.push({ start, end, text: match[0], type: 'structural_punctuation' });
    for (let i = start; i < end; i++) covered[i] = true;
  }

  // 3. Verified dictionary term spans (longest surface form first to prevent fragment shadowing)
  const resolvedTerms = [];
  const seenIds = new Set();
  for (const rawId of Array.isArray(termIds) ? termIds : []) {
    const id = typeof rawId === 'string' ? rawId.trim() : '';
    if (!id || seenIds.has(id)) continue;
    seenIds.add(id);
    const entry = dict?.terms?.[id];
    if (!entry || entry.status !== 'verified' || !entry.kanji) continue;
    resolvedTerms.push({ id, entry });
  }

  resolvedTerms.sort((a, b) => b.entry.kanji.length - a.entry.kanji.length);

  for (const { id, entry } of resolvedTerms) {
    const surface = String(entry.kanji);
    if (!surface) continue;
    let searchFrom = 0;
    while (searchFrom < length) {
      const idx = str.indexOf(surface, searchFrom);
      if (idx === -1) break;
      const start = idx;
      const end = idx + surface.length;
      spans.push({
        start,
        end,
        text: surface,
        termId: id,
        unitType: entry.unitType || 'word'
      });
      for (let i = start; i < end; i++) covered[i] = true;
      searchFrom = idx + surface.length;
    }
  }

  spans.sort((a, b) => a.start - b.start || b.end - a.end);
  structuralEntities.sort((a, b) => a.start - b.start);

  // 4. Collect contiguous uncovered ranges as UNRESOLVED_SPAN
  const unresolvedSpans = [];
  let i = 0;
  while (i < length) {
    if (!covered[i]) {
      const start = i;
      while (i < length && !covered[i]) i++;
      unresolvedSpans.push({
        start,
        end: i,
        text: str.slice(start, i)
      });
    } else {
      i++;
    }
  }

  const coveredChars = covered.filter(Boolean).length;
  const coveredPct = Number(((coveredChars / length) * 100).toFixed(2));

  return {
    text: str,
    length,
    spans,
    structuralEntities,
    unresolvedSpans,
    coveredPct
  };
}

export function auditPackageCoverage(pkgFile, dict, mapping) {
  const questions = loadPackageQuestions(pkgFile);
  const sentences = [];
  const unresolvedItems = [];
  let totalChars = 0;
  let coveredChars = 0;

  for (const q of questions) {
    const qTermIds = Array.isArray(mapping?.questions?.[q.id]) ? mapping.questions[q.id] : [];
    const promptAudit = auditSentenceSpans(q.promptText, qTermIds, dict);
    totalChars += promptAudit.length;
    coveredChars += Math.round((promptAudit.coveredPct / 100) * promptAudit.length);

    sentences.push({
      packageFile: pkgFile,
      questionId: q.id,
      targetType: 'prompt',
      compositeKey: q.id,
      ...promptAudit
    });

    if (promptAudit.unresolvedSpans.length > 0) {
      unresolvedItems.push({
        packageFile: pkgFile,
        questionId: q.id,
        targetType: 'prompt',
        compositeKey: q.id,
        text: promptAudit.text,
        unresolvedSpans: promptAudit.unresolvedSpans
      });
    }

    for (const opt of q.options) {
      const compositeKey = `${q.id}::${opt.optId}`;
      const optTermIds = Array.isArray(mapping?.byCompositeKey?.[compositeKey])
        ? mapping.byCompositeKey[compositeKey]
        : (Array.isArray(mapping?.options?.[q.id]?.[opt.optId]) ? mapping.options[q.id][opt.optId] : []);

      const optAudit = auditSentenceSpans(opt.text, optTermIds, dict);
      totalChars += optAudit.length;
      coveredChars += Math.round((optAudit.coveredPct / 100) * optAudit.length);

      sentences.push({
        packageFile: pkgFile,
        questionId: q.id,
        targetType: 'option',
        optionId: opt.optId,
        compositeKey,
        ...optAudit
      });

      if (optAudit.unresolvedSpans.length > 0) {
        unresolvedItems.push({
          packageFile: pkgFile,
          questionId: q.id,
          targetType: 'option',
          optionId: opt.optId,
          compositeKey,
          text: optAudit.text,
          unresolvedSpans: optAudit.unresolvedSpans
        });
      }
    }
  }

  const totalUnresolvedSpans = unresolvedItems.reduce((acc, item) => acc + item.unresolvedSpans.length, 0);
  const spanCoveragePct = totalChars > 0 ? Number(((coveredChars / totalChars) * 100).toFixed(2)) : 100;

  return {
    packageFile: pkgFile,
    questionCount: questions.length,
    sentenceCount: sentences.length,
    totalChars,
    coveredChars,
    spanCoveragePct,
    totalUnresolvedSpans,
    passed: totalUnresolvedSpans === 0,
    sentences,
    unresolvedItems
  };
}

function parseArgs(argv) {
  const args = {
    packages: [],
    dictPath: DEFAULT_DICT_PATH,
    mappingPath: DEFAULT_MAPPING_PATH,
    write: true,
    reportOnly: false
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--package' && argv[i + 1]) args.packages.push(argv[++i]);
    else if (a === '--all') args.packages = [...CANONICAL_PACKAGES];
    else if (a === '--dict' && argv[i + 1]) args.dictPath = argv[++i];
    else if (a === '--mapping' && argv[i + 1]) args.mappingPath = argv[++i];
    else if (a === '--dry-run' || a === '--no-write') args.write = false;
    else if (a === '--report-only') args.reportOnly = true;
  }
  if (!args.packages.length) args.packages = [...CANONICAL_PACKAGES];
  return args;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const args = parseArgs(process.argv.slice(2));
  const dict = readJson(args.dictPath);
  const mapping = readJson(args.mappingPath);

  const packageSummaries = [];
  const allSentences = [];
  const allUnresolved = [];
  let grandTotalUnresolved = 0;

  for (const pkgFile of args.packages) {
    const res = auditPackageCoverage(pkgFile, dict, mapping);
    grandTotalUnresolved += res.totalUnresolvedSpans;
    packageSummaries.push({
      packageFile: res.packageFile,
      questionCount: res.questionCount,
      sentenceCount: res.sentenceCount,
      spanCoveragePct: res.spanCoveragePct,
      totalUnresolvedSpans: res.totalUnresolvedSpans,
      passed: res.passed
    });
    allSentences.push(...res.sentences);
    allUnresolved.push(...res.unresolvedItems);
    console.log(
      `[Coverage] ${pkgFile}: ${res.sentenceCount} sentences | ${res.spanCoveragePct}% covered | UNRESOLVED_SPAN=${res.totalUnresolvedSpans} | ${res.passed ? 'PASS' : 'FAIL'}`
    );
  }

  if (args.write) {
    const generatedAt = new Date().toISOString();
    writeJsonAtomic(`${AUDIT_DIR}/full-coverage-ledger.json`, {
      _meta: {
        generatedAt,
        dictPath: args.dictPath,
        mappingPath: args.mappingPath,
        packages: packageSummaries
      },
      sentences: allSentences
    });
    writeJsonAtomic(`${AUDIT_DIR}/unresolved-spans-report.json`, {
      _meta: {
        generatedAt,
        totalUnresolvedSpans: grandTotalUnresolved,
        packages: packageSummaries
      },
      unresolvedItems: allUnresolved
    });
  }

  if (!args.reportOnly && grandTotalUnresolved > 0) {
    console.error(`[Coverage FAIL] Total UNRESOLVED_SPAN=${grandTotalUnresolved} (must be 0).`);
    process.exit(1);
  }
}
