import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { auditPackageCoverage } from './audit-kotoba-coverage.mjs';
import { validateKotobaPackage } from './validate-kotoba-package.mjs';
import {
  AUDIT_DIR,
  CANONICAL_PACKAGES,
  DEFAULT_DICT_PATH,
  DEFAULT_MAPPING_PATH,
  loadPackageQuestions,
  readJson,
  writeJsonAtomic
} from './lib/kotoba-pipeline-utils.mjs';

function collectPackageTermIds(questions, mapping) {
  const ids = new Set();
  for (const q of questions) {
    for (const id of mapping?.questions?.[q.id] || []) {
      if (typeof id === 'string' && id.trim()) ids.add(id.trim());
    }
    for (const opt of q.options) {
      const ck = `${q.id}::${opt.optId}`;
      const list = Array.isArray(mapping?.byCompositeKey?.[ck])
        ? mapping.byCompositeKey[ck]
        : (mapping?.options?.[q.id]?.[opt.optId] || []);
      for (const id of list) {
        if (typeof id === 'string' && id.trim()) ids.add(id.trim());
      }
    }
  }
  return ids;
}

function buildPackageReconciliation({ packageFile, questions, oldDict, oldMapping, newDict, newMapping }) {
  const oldIds = collectPackageTermIds(questions, oldMapping);
  const newIds = collectPackageTermIds(questions, newMapping);
  const entries = [];

  for (const id of oldIds) {
    const oldTerm = oldDict?.terms?.[id];
    const newTerm = newDict?.terms?.[id];
    if (newIds.has(id) && newTerm) {
      const meaningChanged = oldTerm && oldTerm.arti !== newTerm.arti;
      entries.push({
        packageFile,
        termId: id,
        kanji: newTerm.kanji,
        disposition: meaningChanged ? 'revised_meaning' : 'kept',
        validated: true
      });
    } else if (oldTerm) {
      const oldKanji = String(oldTerm.kanji || '');
      const mergedCompound = [...newIds].find(nid => {
        const nt = newDict?.terms?.[nid];
        return nt && nt.kanji && nt.kanji.length > oldKanji.length && nt.kanji.includes(oldKanji);
      });
      entries.push({
        packageFile,
        termId: id,
        kanji: oldKanji,
        disposition: mergedCompound
          ? 'merged_to_compound'
          : (oldKanji.length === 1 ? 'retired_fragment' : 'split_corrected'),
        replacedBy: mergedCompound || null,
        validated: true
      });
    }
  }

  for (const id of newIds) {
    if (!oldIds.has(id)) {
      const nt = newDict?.terms?.[id];
      entries.push({
        packageFile,
        termId: id,
        kanji: nt?.kanji || '',
        disposition: 'added',
        validated: true
      });
    }
  }

  return entries;
}

export function mergeKotobaPackage({
  packageFile,
  candidateDict,
  candidateMapping,
  targetDict,
  targetMapping,
  existingLedger = null,
  dryRun = false,
  targetDictPath = DEFAULT_DICT_PATH,
  targetMappingPath = DEFAULT_MAPPING_PATH
}) {
  if (!CANONICAL_PACKAGES.includes(packageFile)) {
    throw new Error(`Unknown canonical package: ${packageFile}`);
  }

  // Gate 1: T020 Full-text span coverage
  const coverage = auditPackageCoverage(packageFile, candidateDict, candidateMapping);
  if (!coverage.passed) {
    return {
      merged: false,
      stage: 'coverage',
      coverage,
      validation: null,
      error: `Coverage gate failed for ${packageFile}: UNRESOLVED_SPAN=${coverage.totalUnresolvedSpans}`
    };
  }

  // Gate 2: T021 Dictionary quality, morphology & referential integrity
  const validation = validateKotobaPackage({
    packageFile,
    dict: candidateDict,
    mapping: candidateMapping,
    requireVersion2: false,
    disallowInlineOccurrences: true
  });
  if (!validation.passed) {
    return {
      merged: false,
      stage: 'validation',
      coverage,
      validation,
      error: `Validation gate failed for ${packageFile}: ${validation.errors[0]?.code} - ${validation.errors[0]?.message}`
    };
  }

  const questions = loadPackageQuestions(packageFile);
  const nextDict = structuredClone(targetDict);
  const nextMapping = structuredClone(targetMapping);
  nextDict.terms = nextDict.terms || {};
  nextMapping.questions = nextMapping.questions || {};
  nextMapping.options = nextMapping.options || {};
  nextMapping.byCompositeKey = nextMapping.byCompositeKey || {};
  nextMapping._meta = nextMapping._meta || {};
  nextMapping._meta.packageRollout = nextMapping._meta.packageRollout || {};

  const nowIso = new Date().toISOString();

  // Reconcile against legacy Feature 008 baseline
  const pkgReconciliation = buildPackageReconciliation({
    packageFile,
    questions,
    oldDict: targetDict,
    oldMapping: targetMapping,
    newDict: candidateDict,
    newMapping: candidateMapping
  });

  // Update mapping strictly for questions/options in this package
  const newPkgTermIds = collectPackageTermIds(questions, candidateMapping);
  for (const q of questions) {
    if (Array.isArray(candidateMapping.questions?.[q.id])) {
      nextMapping.questions[q.id] = [...candidateMapping.questions[q.id]];
    }
    if (!nextMapping.options[q.id]) nextMapping.options[q.id] = {};
    for (const opt of q.options) {
      const ck = `${q.id}::${opt.optId}`;
      const optList = Array.isArray(candidateMapping.byCompositeKey?.[ck])
        ? [...candidateMapping.byCompositeKey[ck]]
        : (Array.isArray(candidateMapping.options?.[q.id]?.[opt.optId])
            ? [...candidateMapping.options[q.id][opt.optId]]
            : []);
      nextMapping.byCompositeKey[ck] = optList;
      nextMapping.options[q.id][opt.optId] = [...optList];
    }
  }

  nextMapping._meta.packageRollout[packageFile] = {
    status: 'migrated',
    spanCoveragePct: coverage.spanCoveragePct,
    validatedAt: nowIso
  };

  // Merge referenced terms into nextDict without breaking un-migrated packages
  for (const id of newPkgTermIds) {
    const entry = candidateDict.terms[id];
    if (!entry) continue;
    const cleanEntry = { ...entry };
    delete cleanEntry.occurrences;
    nextDict.terms[id] = cleanEntry;
  }

  const ledger = existingLedger ? structuredClone(existingLedger) : { _meta: {}, packages: {}, entries: [] };
  ledger._meta = {
    generatedAt: nowIso,
    totalPackagesMigrated: Object.values(nextMapping._meta.packageRollout).filter(x => x.status === 'migrated').length
  };
  ledger.packages = ledger.packages || {};
  ledger.packages[packageFile] = {
    migratedAt: nowIso,
    questionCount: questions.length,
    spanCoveragePct: coverage.spanCoveragePct,
    reconciledCount: pkgReconciliation.length
  };
  ledger.entries = (ledger.entries || []).filter(e => e.packageFile !== packageFile).concat(pkgReconciliation);

  if (!dryRun) {
    writeJsonAtomic(targetDictPath, nextDict);
    writeJsonAtomic(targetMappingPath, nextMapping);
    writeJsonAtomic(`${AUDIT_DIR}/reconciliation-ledger.json`, ledger);
  }

  return {
    merged: true,
    coverage,
    validation,
    nextDict,
    nextMapping,
    ledger
  };
}

function parseArgs(argv) {
  const args = {
    packageFile: null,
    candidateDict: null,
    candidateMapping: null,
    targetDict: DEFAULT_DICT_PATH,
    targetMapping: DEFAULT_MAPPING_PATH,
    dryRun: false
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--package' && argv[i + 1]) args.packageFile = argv[++i];
    else if (a === '--candidate-dict' && argv[i + 1]) args.candidateDict = argv[++i];
    else if (a === '--candidate-mapping' && argv[i + 1]) args.candidateMapping = argv[++i];
    else if (a === '--target-dict' && argv[i + 1]) args.targetDict = argv[++i];
    else if (a === '--target-mapping' && argv[i + 1]) args.targetMapping = argv[++i];
    else if (a === '--dry-run') args.dryRun = true;
  }
  return args;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const args = parseArgs(process.argv.slice(2));
  if (!args.packageFile || !args.candidateDict || !args.candidateMapping) {
    console.error('Usage: node scripts/merge-kotoba-package.mjs --package <file> --candidate-dict <path> --candidate-mapping <path> [--dry-run]');
    process.exit(1);
  }

  const candidateDict = readJson(args.candidateDict);
  const candidateMapping = readJson(args.candidateMapping);
  const targetDict = readJson(args.targetDict);
  const targetMapping = readJson(args.targetMapping);

  const ledgerPath = path.resolve(process.cwd(), `${AUDIT_DIR}/reconciliation-ledger.json`);
  const existingLedger = fs.existsSync(ledgerPath) ? JSON.parse(fs.readFileSync(ledgerPath, 'utf8')) : null;

  const result = mergeKotobaPackage({
    packageFile: args.packageFile,
    candidateDict,
    candidateMapping,
    targetDict,
    targetMapping,
    existingLedger,
    dryRun: args.dryRun,
    targetDictPath: args.targetDict,
    targetMappingPath: args.targetMapping
  });

  if (!result.merged) {
    console.error(`[Merge ABORTED] ${result.error}`);
    process.exit(1);
  }

  console.log(`[Merge OK] ${args.packageFile}: 100% covered & validated${args.dryRun ? ' (dry-run)' : ' (atomic write complete)'}.`);
}
