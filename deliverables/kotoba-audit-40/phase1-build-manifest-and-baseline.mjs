import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';
import { auditSentenceSpans } from '../../scripts/audit-kotoba-coverage.mjs';
import { validateKotobaPackage } from '../../scripts/validate-kotoba-package.mjs';
import { validateContextCompleteness } from '../../scripts/validate-otaff-kotoba-completeness.mjs';
import {
  extractQuestionPlainText,
  extractOptionId,
  extractOptionPlainText
} from '../../scripts/lib/kotoba-pipeline-utils.mjs';

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'deliverables/kotoba-audit-40');
const BACKUP_DATA_DIR = path.join(OUT_DIR, 'backups/baseline-20261115/data');

fs.mkdirSync(BACKUP_DATA_DIR, { recursive: true });

function sha256Buffer(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function sha256Text(text) {
  return crypto.createHash('sha256').update(String(text || ''), 'utf8').digest('hex');
}

function readJson(relPath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relPath), 'utf8'));
}

// Parse BUILTIN_PACKAGES_META from app.js
const appJs = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
const metaMatch = appJs.match(/const BUILTIN_PACKAGES_META = (\[[\s\S]*?\n\]);/);
const builtinMeta = metaMatch ? vm.runInNewContext(metaMatch[1]) : [];
const metaById = new Map(builtinMeta.map((m, idx) => [m.id, { ...m, appOrderIndex: idx }]));

// 1. Verify / initialize baseline backups of all data/*.json files cleanly
const dataDir = path.join(ROOT, 'data');
const dataFiles = fs.readdirSync(dataDir).filter(f => f.endsWith('.json')).sort();
const fileHashes = {};

for (const fname of dataFiles) {
  const srcAbs = path.join(dataDir, fname);
  const dstAbs = path.join(BACKUP_DATA_DIR, fname);
  const backupExists = fs.existsSync(dstAbs);
  const buf = fs.readFileSync(backupExists ? dstAbs : srcAbs);
  fileHashes[`data/${fname}`] = {
    bytes: buf.length,
    sha256: sha256Buffer(buf),
    mtime: fs.statSync(srcAbs).mtime.toISOString(),
    backupPath: `deliverables/kotoba-audit-40/backups/baseline-20261115/data/${fname}`
  };
  if (!backupExists) {
    fs.writeFileSync(dstAbs, buf);
  }
}

// Load sidecars & Spec 009 ledger
const dict = readJson('data/sharedKotobaDictionary.json');
const mapping = readJson('data/kotobaMapping.json');
const extra = readJson('data/kotoba-dan-kategori-tambahan.json');
const spec009Ledger = readJson('specs/009-cbt-shortcuts-zoom-kotoba/audit/unresolved-spans-report.json');
const spec009Files = new Set((spec009Ledger._meta?.packages || []).map(p => p.packageFile));

const dictTerms = dict.terms || {};
const dictTermCount = Object.keys(dictTerms).length;
let dictVerifiedCount = 0;
let dictUnresolvedCount = 0;
for (const entry of Object.values(dictTerms)) {
  if (entry?.status === 'verified') dictVerifiedCount++;
  else dictUnresolvedCount++;
}

// 2. Enumerate all package JSON files (40 JSON files yielding 60 distinct setIds; excluding sidecars & questions.json archive)
const packageSourceFiles = dataFiles
  .filter(f => !['sharedKotobaDictionary.json', 'kotobaMapping.json', 'kotoba-dan-kategori-tambahan.json', 'questions.json'].includes(f))
  .map(f => `data/${f}`);

const packageGroups = new Map();
const s009ValidatorByFile = new Map();

for (const relPath of packageSourceFiles) {
  const baseName = path.basename(relPath);
  const rawData = readJson(relPath);
  const questions = Array.isArray(rawData) ? rawData : (rawData.questions || []);
  const s009Res = validateKotobaPackage({ packageFile: relPath, dict, mapping, requireVersion2: false });
  s009ValidatorByFile.set(relPath, s009Res);

  for (const q of questions) {
    const sid = q.setId || rawData.setId || baseName.replace(/\.json$/, '');
    if (!packageGroups.has(sid)) {
      packageGroups.set(sid, {
        setId: sid,
        sourcePath: relPath,
        isMultiPackageBundle: false,
        packageTopMeta: Array.isArray(rawData)
          ? {}
          : {
              setId: rawData.setId ?? null,
              setName: rawData.setName ?? null,
              title: rawData.title ?? null,
              sourcePdf: rawData.sourcePdf ?? null,
              totalQuestions: rawData.totalQuestions ?? null,
              pointsPerQuestion: rawData.pointsPerQuestion ?? null,
              maxScore: rawData.maxScore ?? null,
              durationMinutes: rawData.durationMinutes ?? null,
              timeLimitMinutes: rawData.timeLimitMinutes ?? null
            },
        questions: []
      });
    }
    packageGroups.get(sid).questions.push(q);
  }
}

// Detect bundles (multiple setIds in one sourcePath)
const setsPerFile = new Map();
for (const pkg of packageGroups.values()) {
  if (!setsPerFile.has(pkg.sourcePath)) setsPerFile.set(pkg.sourcePath, []);
  setsPerFile.get(pkg.sourcePath).push(pkg.setId);
}
for (const pkg of packageGroups.values()) {
  const peers = setsPerFile.get(pkg.sourcePath) || [];
  pkg.isMultiPackageBundle = peers.length > 1;
  pkg.bundlePeerSetIds = peers;
}

// Helper: assign historical cohort
function classifyCohort(sid) {
  if (sid.startsWith('latsol-otaff-pm51-')) return 'cohort_5_protected_otaff_pm51';
  if (sid === 'pilot-otaff51-01') return 'cohort_4_pilot_otaff51';
  if (['ssw-pm-kunci-ujian-14', 'ssw-pm-kunci-ujian-15', 'ssw-pm-kunci-ujian-16'].includes(sid)) {
    return 'cohort_3_unaudited_ujian_14_16';
  }
  if (sid.startsWith('latsol-')) return 'cohort_2_unaudited_19_paket';
  return 'cohort_1_spec009_canonical';
}

const COHORT_NOTES = {
  cohort_1_spec009_canonical: 'Committed legacy canonical bundle (git main Nov 8-11, internal createdAt Oct-Nov 2025). Already audited/reconciled in Spec 009 (100% spanCoveragePct, 0 UNRESOLVED_SPAN). Minor gaps remain only under strict OTAFF v2 rules (e.g., 5S/ppm/O157/counters/substring checks).',
  cohort_2_unaudited_19_paket: 'Uncommitted 19-paket Latsol batch (integrated Nov 14, internal createdAt 2026-04-01T01:40). Never audited for Kotoba in Spec 009; only answer keys audited in docs/answer-key-audit-report.md. Partial mapping with missing lexical items and SURFACE_NOT_IN_CONTEXT errors.',
  cohort_3_unaudited_ujian_14_16: 'Uncommitted Soal Ujian 14-16 batch (integrated Nov 14 11:41 WIB, internal createdAt 2026-04-01T02:03). Never audited in Spec 009; severe Kotoba incompleteness (26-36% span coverage, 527-719 v2 errors per package, plus s009 errors).',
  cohort_4_pilot_otaff51: 'Uncommitted Pilot OTAFF 5.1 (Nov 15 morning, 5 questions). Never underwent the v2 Kotoba repair (63.64% span coverage, 72 v2 errors).',
  cohort_5_protected_otaff_pm51: 'Protected reference packages: 10 newest OTAFF PM 5.1 packages (Nov 15 evening), recently repaired with v2 pipeline (0 v2 validator errors across 1,600 contexts).'
};

// 3. Build immutable snapshot & comprehensive baseline metrics for ALL 60 packages
const immutableSnapshotPackages = {};
const allPackageRecords = [];

// Order records in app BUILTIN_PACKAGES_META order for clean canonical reporting
const orderedSetIds = builtinMeta.map(m => m.id).filter(id => packageGroups.has(id));
for (const id of packageGroups.keys()) {
  if (!orderedSetIds.includes(id)) orderedSetIds.push(id);
}

for (const sid of orderedSetIds) {
  const pkg = packageGroups.get(sid);
  const meta = metaById.get(sid) || {};
  const fileInfo = fileHashes[pkg.sourcePath];
  const cohort = classifyCohort(sid);
  const spec009Audited = spec009Files.has(path.basename(pkg.sourcePath));
  const rolloutInfo = mapping._meta?.packageRollout?.[path.basename(pkg.sourcePath)] || null;

  let optionCount = 0;
  let totalChars = 0;
  let coveredChars = 0;
  let unresolvedSpansCount = 0;
  let promptContextsMapped = 0;
  let promptContextsNonEmpty = 0;
  let optionContextsMapped = 0;
  let optionContextsNonEmpty = 0;
  let inlineKotobaQuestions = 0;
  let extraEntriesCount = 0;
  let missingRefCount = 0;
  let unverifiedRefCount = 0;
  const uniqueReferencedTermIds = new Set();
  const v2ErrorCountsByCode = {};
  let v2ErrorTotal = 0;

  const immutableQuestions = [];
  const createdMsList = [];

  for (let qIdx = 0; qIdx < pkg.questions.length; qIdx++) {
    const q = pkg.questions[qIdx];
    const opts = Array.isArray(q.options) ? q.options : [];
    optionCount += opts.length;

    if (q.createdAt) {
      const ms = typeof q.createdAt === 'number' ? q.createdAt : Date.parse(q.createdAt);
      if (Number.isFinite(ms)) createdMsList.push(ms);
    }

    if (Array.isArray(q.kotobaU) && q.kotobaU.length > 0) inlineKotobaQuestions++;
    if (extra.entries?.[q.id]) extraEntriesCount++;

    immutableQuestions.push({
      index: qIdx,
      id: q.id,
      questionNumber: q.questionNumber ?? null,
      setId: q.setId ?? pkg.packageTopMeta.setId ?? null,
      setName: q.setName ?? pkg.packageTopMeta.setName ?? null,
      points: q.points ?? null,
      correctAnswer: q.correctAnswer ?? null,
      correctIndex: q.correctIndex ?? null,
      imageMediaId: q.imageMediaId ?? null,
      questionImage: q.questionImage ?? null,
      media: q.media ?? null,
      promptSha256: sha256Text(q.prompt),
      questionTextSha256: sha256Text(q.questionText),
      promptTranslationSha256: sha256Text(q.promptTranslation),
      options: opts.map((o, oIdx) => ({
        index: oIdx,
        id: o.id ?? null,
        originalId: o.originalId ?? null,
        mediaId: o.mediaId ?? null,
        optionImage: o.optionImage ?? null,
        textSha256: sha256Text(o.text),
        translationSha256: sha256Text(o.translation)
      }))
    });

    // Stem metrics
    const pText = extractQuestionPlainText(q);
    const pIds = mapping.questions?.[q.id];
    if (Array.isArray(pIds)) {
      promptContextsMapped++;
      if (pIds.length > 0) promptContextsNonEmpty++;
      for (const id of pIds) {
        uniqueReferencedTermIds.add(id);
        const e = dictTerms[id];
        if (!e) missingRefCount++;
        else if (e.status !== 'verified') unverifiedRefCount++;
      }
    }
    const pSpan = auditSentenceSpans(pText, Array.isArray(pIds) ? pIds : [], dict);
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
    for (const err of pVal) {
      v2ErrorTotal++;
      v2ErrorCountsByCode[err.code] = (v2ErrorCountsByCode[err.code] || 0) + 1;
    }

    // Option metrics
    for (let oIdx = 0; oIdx < opts.length; oIdx++) {
      const opt = opts[oIdx];
      const optId = extractOptionId(opt, oIdx);
      const ck = `${q.id}::${optId}`;
      const oIds = Array.isArray(mapping.byCompositeKey?.[ck])
        ? mapping.byCompositeKey[ck]
        : (Array.isArray(mapping.options?.[q.id]?.[optId]) ? mapping.options[q.id][optId] : null);
      if (Array.isArray(oIds)) {
        optionContextsMapped++;
        if (oIds.length > 0) optionContextsNonEmpty++;
        for (const id of oIds) {
          uniqueReferencedTermIds.add(id);
          const e = dictTerms[id];
          if (!e) missingRefCount++;
          else if (e.status !== 'verified') unverifiedRefCount++;
        }
      }
      const oText = extractOptionPlainText(opt);
      const oSpan = auditSentenceSpans(oText, Array.isArray(oIds) ? oIds : [], dict);
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
      for (const err of oVal) {
        v2ErrorTotal++;
        v2ErrorCountsByCode[err.code] = (v2ErrorCountsByCode[err.code] || 0) + 1;
      }
    }
  }

  const spanCoveragePct = totalChars > 0 ? Number(((coveredChars / totalChars) * 100).toFixed(2)) : 100;
  const s009FileResult = s009ValidatorByFile.get(pkg.sourcePath);

  immutableSnapshotPackages[sid] = {
    setId: sid,
    sourcePath: pkg.sourcePath,
    fileSha256: fileInfo.sha256,
    appMetadata: meta,
    packageTopMeta: pkg.packageTopMeta,
    questionCount: pkg.questions.length,
    optionCount,
    questions: immutableQuestions
  };

  allPackageRecords.push({
    setId: sid,
    name: meta.name || pkg.packageTopMeta.setName || sid,
    sourcePath: pkg.sourcePath,
    isMultiPackageBundle: pkg.isMultiPackageBundle,
    sourcePdf: meta.sourcePdf || pkg.packageTopMeta.sourcePdf || null,
    appOrderIndex: meta.appOrderIndex ?? null,
    cohort,
    fileMtime: fileInfo.mtime,
    fileSha256: fileInfo.sha256,
    internalCreatedAtMin: createdMsList.length ? new Date(Math.min(...createdMsList)).toISOString() : null,
    questionCount: pkg.questions.length,
    optionCount,
    totalContexts: pkg.questions.length + optionCount,
    pointsPerQuestion: meta.pointsPerQuestion ?? pkg.packageTopMeta.pointsPerQuestion ?? null,
    durationMinutes: pkg.packageTopMeta.durationMinutes ?? pkg.packageTopMeta.timeLimitMinutes ?? null,
    auditEvidence: {
      spec009Audited,
      spec009PackageRollout: rolloutInfo,
      answerKeyAuditedInDocs: cohort === 'cohort_2_unaudited_19_paket'
    },
    baselineKotobaMetrics: {
      promptContextsMapped,
      promptContextsNonEmpty,
      optionContextsMapped,
      optionContextsNonEmpty,
      uniqueReferencedTerms: uniqueReferencedTermIds.size,
      missingTermReferences: missingRefCount,
      unverifiedTermReferences: unverifiedRefCount,
      inlineKotobaQuestions,
      extraTambahanEntries: extraEntriesCount,
      spec009SpanCoveragePct: spanCoveragePct,
      spec009UnresolvedSpans: unresolvedSpansCount,
      spec009FileValidatorErrors: s009FileResult ? s009FileResult.errors.length : null,
      v2CompletenessErrorTotal: v2ErrorTotal,
      v2CompletenessErrorsByCode: v2ErrorCountsByCode
    }
  });
}

// 4. Construct Confirmed 50-Target Scope (ALL non-OTAFF packages) -> 10 batches of 5
const protected10 = allPackageRecords.filter(p => p.cohort === 'cohort_5_protected_otaff_pm51');
const nonProtected50 = allPackageRecords.filter(p => p.cohort !== 'cohort_5_protected_otaff_pm51');

const unaudited23 = nonProtected50
  .filter(p => !p.auditEvidence.spec009Audited)
  .sort((a, b) => b.baselineKotobaMetrics.v2CompletenessErrorTotal - a.baselineKotobaMetrics.v2CompletenessErrorTotal || a.setId.localeCompare(b.setId));

const spec009All27 = nonProtected50
  .filter(p => p.auditEvidence.spec009Audited)
  .sort((a, b) => b.baselineKotobaMetrics.v2CompletenessErrorTotal - a.baselineKotobaMetrics.v2CompletenessErrorTotal || a.setId.localeCompare(b.setId));

const confirmedTargets50 = [...unaudited23, ...spec009All27];
const confirmedExcluded0 = [];

const batches = [];
for (let i = 0; i < Math.ceil(confirmedTargets50.length / 5); i++) {
  const slice = confirmedTargets50.slice(i * 5, i * 5 + 5);
  batches.push({
    batchId: `batch-${String(i + 1).padStart(2, '0')}`,
    packageIds: slice.map(p => p.setId),
    questionCount: slice.reduce((a, p) => a + p.questionCount, 0),
    optionCount: slice.reduce((a, p) => a + p.optionCount, 0),
    baselineV2Errors: slice.reduce((a, p) => a + p.baselineKotobaMetrics.v2CompletenessErrorTotal, 0)
  });
}

function selectionReasonFor(pkg) {
  if (pkg.cohort === 'cohort_3_unaudited_ujian_14_16') {
    return `CRITICAL AUDIT GAP (Confirmed 50-Target Scope): Never audited in Spec 009; ${pkg.baselineKotobaMetrics.spec009SpanCoveragePct}% span coverage; ${pkg.baselineKotobaMetrics.v2CompletenessErrorTotal} v2 completeness errors.`;
  }
  if (pkg.cohort === 'cohort_2_unaudited_19_paket') {
    return `UNAUDITED IN SPEC 009 (Confirmed 50-Target Scope): Only answer keys audited prior; ${pkg.baselineKotobaMetrics.spec009SpanCoveragePct}% span coverage; ${pkg.baselineKotobaMetrics.v2CompletenessErrorTotal} v2 completeness errors.`;
  }
  if (pkg.cohort === 'cohort_4_pilot_otaff51') {
    return `UNREPAIRED PILOT (Confirmed 50-Target Scope): Pilot OTAFF 5.1 added prior to 10-package repair; ${pkg.baselineKotobaMetrics.spec009SpanCoveragePct}% span coverage; ${pkg.baselineKotobaMetrics.v2CompletenessErrorTotal} v2 errors.`;
  }
  return `SPEC 009 V2 CLEANUP (Confirmed 50-Target Scope): Audited to 100% span coverage in Spec 009, included in full 50-package non-OTAFF repair (${pkg.baselineKotobaMetrics.v2CompletenessErrorTotal} v2 errors).`;
}

const targetManifest = {
  _meta: {
    generatedAt: new Date().toISOString(),
    branch: 'fix/kotoba-audit-40',
    selectionStatus: 'CONFIRMED_ALL_50_NON_OTAFF_BY_USER',
    resolutionNote: 'User explicitly directed repairing ALL 50 non-OTAFF packages ("garap semua yg non otaff benerin ktobanya") while keeping the 10 OTAFF PM 5.1 packages (latsol-otaff-pm51-01..10) 100% protected/untouched.',
    totalDiscoveredPackages: allPackageRecords.length,
    protectedReferenceCount: protected10.length,
    nonProtectedCount: nonProtected50.length,
    selectedTargetCount: confirmedTargets50.length,
    excludedCount: confirmedExcluded0.length,
    ambiguityReport: {
      summary: 'Initial 40-vs-10 ambiguity across the 50 non-protected packages was resolved by user decision to process ALL 50 non-OTAFF packages in 10 batches of 5.',
      discoveredCohorts: {
        cohort_5_protected_otaff_pm51: { count: 10, ids: protected10.map(p => p.setId) },
        cohort_1_spec009_canonical: { count: 27, status: 'Oldest (git committed Nov 8-11; internal createdAt Oct-Nov 2025) & ALREADY 100% Spec 009 audited (0-13 minor v2 flags).' },
        cohort_2_unaudited_19_paket: { count: 19, status: 'Newer (Nov 14 working tree; internal createdAt 2026-04-01T01:40); NEVER Spec 009 audited; 47.55-76.13% coverage, 11-224 v2 errors.' },
        cohort_3_unaudited_ujian_14_16: { count: 3, status: 'Newer (Nov 14 11:41 WIB; internal createdAt 2026-04-01T02:03); NEVER Spec 009 audited; MOST BROKEN (26.34-36.22% coverage, 527-719 v2 errors).' },
        cohort_4_pilot_otaff51: { count: 1, status: 'Nov 15 morning pilot (pilot-otaff51-01); unrepaired (63.64% coverage, 72 v2 errors).' }
      }
    }
  },
  baselineReferences: {
    dictionaryPath: 'data/sharedKotobaDictionary.json',
    dictionarySha256: fileHashes['data/sharedKotobaDictionary.json'].sha256,
    dictionaryVersion: { schemaVersion: dict._meta?.schemaVersion, dataVersion: dict._meta?.dataVersion },
    dictionaryTotalTerms: dictTermCount,
    dictionaryVerifiedTerms: dictVerifiedCount,
    dictionaryUnresolvedTerms: dictUnresolvedCount,
    mappingPath: 'data/kotobaMapping.json',
    mappingSha256: fileHashes['data/kotobaMapping.json'].sha256,
    mappingVersion: { schemaVersion: mapping._meta?.schemaVersion, dataVersion: mapping._meta?.dataVersion },
    mappingQuestionsCount: Object.keys(mapping.questions || {}).length,
    mappingCompositeKeysCount: Object.keys(mapping.byCompositeKey || {}).length,
    supplementaryPath: 'data/kotoba-dan-kategori-tambahan.json',
    supplementarySha256: fileHashes['data/kotoba-dan-kategori-tambahan.json'].sha256,
    supplementaryEntriesCount: Object.keys(extra.entries || {}).length,
    legacyArchiveQuestionsJson: {
      path: 'data/questions.json',
      sha256: fileHashes['data/questions.json'].sha256,
      note: '80-question seed archive overlapping ssw-pm-kunci-ujian-1 and ssw-pm-tipe2-nguyen1'
    }
  },
  allDiscoveredPackageIds: allPackageRecords.map(p => p.setId),
  protectedReferencePackageIds: protected10.map(p => p.setId),
  selectedLegacyTargetPackageIds: confirmedTargets50.map(p => p.setId),
  excludedPackageIds: confirmedExcluded0,
  batches,
  packages: allPackageRecords.map(p => {
    const isProtected = protected10.some(x => x.setId === p.setId);
    const batchObj = batches.find(b => b.packageIds.includes(p.setId));
    return {
      ...p,
      role: isProtected ? 'protected_reference' : 'target_repair_50',
      batchId: batchObj ? batchObj.batchId : null,
      selectionReason: isProtected
        ? 'PROTECTED: One of 10 newest OTAFF PM 5.1 packages repaired on 2026-11-15.'
        : selectionReasonFor(p)
    };
  })
};

fs.writeFileSync(path.join(OUT_DIR, 'target-manifest.json'), JSON.stringify(targetManifest, null, 2) + '\n');

// 5. Write baseline-immutable-snapshot.json
const immutableSnapshot = {
  _meta: {
    generatedAt: new Date().toISOString(),
    branch: 'fix/kotoba-audit-40',
    totalPackages: Object.keys(immutableSnapshotPackages).length,
    totalQuestions: Object.values(immutableSnapshotPackages).reduce((a, p) => a + p.questionCount, 0),
    totalOptions: Object.values(immutableSnapshotPackages).reduce((a, p) => a + p.optionCount, 0)
  },
  fileHashes,
  packages: immutableSnapshotPackages
};
fs.writeFileSync(path.join(OUT_DIR, 'baseline-immutable-snapshot.json'), JSON.stringify(immutableSnapshot, null, 2) + '\n');

// 6. Write baseline-report.json & baseline-report.md
const sumGroup = arr => ({
  packageCount: arr.length,
  questions: arr.reduce((a, p) => a + p.questionCount, 0),
  options: arr.reduce((a, p) => a + p.optionCount, 0),
  contexts: arr.reduce((a, p) => a + p.totalContexts, 0),
  v2CompletenessErrors: arr.reduce((a, p) => a + p.baselineKotobaMetrics.v2CompletenessErrorTotal, 0),
  avgSpanCoveragePct: Number((arr.reduce((a, p) => a + p.baselineKotobaMetrics.spec009SpanCoveragePct, 0) / Math.max(1, arr.length)).toFixed(2))
});

const baselineReportJson = {
  _meta: {
    generatedAt: new Date().toISOString(),
    branch: 'fix/kotoba-audit-40',
    selectionStatus: targetManifest._meta.selectionStatus,
    backupDirectory: 'deliverables/kotoba-audit-40/backups/baseline-20261115/data',
    immutableSnapshotPath: 'deliverables/kotoba-audit-40/baseline-immutable-snapshot.json'
  },
  dictionaryAndMappingBaseline: targetManifest.baselineReferences,
  summaryByCohort: {
    protected10: sumGroup(protected10),
    confirmedTargets50: sumGroup(confirmedTargets50),
    excluded0: sumGroup(confirmedExcluded0),
    cohort1Spec009_27: sumGroup(spec009All27),
    cohort2_19Paket: sumGroup(allPackageRecords.filter(p => p.cohort === 'cohort_2_unaudited_19_paket')),
    cohort3_Ujian14_16: sumGroup(allPackageRecords.filter(p => p.cohort === 'cohort_3_unaudited_ujian_14_16')),
    cohort4_Pilot: sumGroup(allPackageRecords.filter(p => p.cohort === 'cohort_4_pilot_otaff51'))
  },
  packages: allPackageRecords
};

fs.writeFileSync(path.join(OUT_DIR, 'baseline-report.json'), JSON.stringify(baselineReportJson, null, 2) + '\n');

const mdLines = [
  '# Non-OTAFF Kotoba Audit & Repair (50 Packages) — Phase 0 & Phase 1 Baseline Report',
  '',
  `- **Generated At**: \`${baselineReportJson._meta.generatedAt}\``,
  `- **Branch**: \`fix/kotoba-audit-40\` (\`main\` untouched at \`09f24e3\`)`,
  `- **Selection Status**: \`CONFIRMED_ALL_50_NON_OTAFF_BY_USER\` (zero production files modified)`,
  `- **Backups**: \`deliverables/kotoba-audit-40/backups/baseline-20261115/data/\` (${dataFiles.length} JSON files)`,
  `- **Immutable Snapshot**: \`deliverables/kotoba-audit-40/baseline-immutable-snapshot.json\` (${immutableSnapshot._meta.totalPackages} packages, ${immutableSnapshot._meta.totalQuestions} questions, ${immutableSnapshot._meta.totalOptions} options)`,
  '',
  '## 1. Master Sidecars & Dictionary Baseline',
  '',
  '| Artifact | Path | Entries / Scope | Version | SHA-256 (first 16) |',
  '| --- | --- | ---: | --- | --- |',
  `| Shared Dictionary | \`data/sharedKotobaDictionary.json\` | ${dictTermCount} terms (${dictVerifiedCount} verified, ${dictUnresolvedCount} unresolved) | schema ${dict._meta?.schemaVersion}, data ${dict._meta?.dataVersion} | \`${fileHashes['data/sharedKotobaDictionary.json'].sha256.slice(0, 16)}\` |`,
  `| Kotoba Mapping | \`data/kotobaMapping.json\` | ${Object.keys(mapping.questions || {}).length} questions, ${Object.keys(mapping.byCompositeKey || {}).length} composite keys | schema ${mapping._meta?.schemaVersion}, data ${mapping._meta?.dataVersion} | \`${fileHashes['data/kotobaMapping.json'].sha256.slice(0, 16)}\` |`,
  `| Supplementary Kotoba | \`data/kotoba-dan-kategori-tambahan.json\` | ${Object.keys(extra.entries || {}).length} question entries | — | \`${fileHashes['data/kotoba-dan-kategori-tambahan.json'].sha256.slice(0, 16)}\` |`,
  '',
  '## 2. Cohort Summary Across All 60 Discovered Packages',
  '',
  '| Cohort | Packages | Questions | Options | Contexts | Avg Spec-009 Span % | Total v2 Completeness Errors | Status / Evidence |',
  '| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |',
  `| Cohort 5: Protected OTAFF PM 5.1 | ${protected10.length} | ${sumGroup(protected10).questions} | ${sumGroup(protected10).options} | ${sumGroup(protected10).contexts} | ${sumGroup(protected10).avgSpanCoveragePct}% | ${sumGroup(protected10).v2CompletenessErrors} | Protected reference (Nov 15) |`,
  `| Cohort 1: Canonical Spec-009 | ${spec009All27.length} | ${sumGroup(spec009All27).questions} | ${sumGroup(spec009All27).options} | ${sumGroup(spec009All27).contexts} | ${sumGroup(spec009All27).avgSpanCoveragePct}% | ${sumGroup(spec009All27).v2CompletenessErrors} | Oldest; 100% Spec 009 audited (0-13 minor v2 flags) |`,
  `| Cohort 2: 19-Paket Latsol | ${baselineReportJson.summaryByCohort.cohort2_19Paket.packageCount} | ${baselineReportJson.summaryByCohort.cohort2_19Paket.questions} | ${baselineReportJson.summaryByCohort.cohort2_19Paket.options} | ${baselineReportJson.summaryByCohort.cohort2_19Paket.contexts} | ${baselineReportJson.summaryByCohort.cohort2_19Paket.avgSpanCoveragePct}% | ${baselineReportJson.summaryByCohort.cohort2_19Paket.v2CompletenessErrors} | Un-audited in Spec 009 (Nov 14 working tree) |`,
  `| Cohort 3: Soal Ujian 14-16 | ${baselineReportJson.summaryByCohort.cohort3_Ujian14_16.packageCount} | ${baselineReportJson.summaryByCohort.cohort3_Ujian14_16.questions} | ${baselineReportJson.summaryByCohort.cohort3_Ujian14_16.options} | ${baselineReportJson.summaryByCohort.cohort3_Ujian14_16.contexts} | ${baselineReportJson.summaryByCohort.cohort3_Ujian14_16.avgSpanCoveragePct}% | ${baselineReportJson.summaryByCohort.cohort3_Ujian14_16.v2CompletenessErrors} | Most incomplete (26-36% span, 18 s009 errs) |`,
  `| Cohort 4: Pilot OTAFF 5.1 | ${baselineReportJson.summaryByCohort.cohort4_Pilot.packageCount} | ${baselineReportJson.summaryByCohort.cohort4_Pilot.questions} | ${baselineReportJson.summaryByCohort.cohort4_Pilot.options} | ${baselineReportJson.summaryByCohort.cohort4_Pilot.contexts} | ${baselineReportJson.summaryByCohort.cohort4_Pilot.avgSpanCoveragePct}% | ${baselineReportJson.summaryByCohort.cohort4_Pilot.v2CompletenessErrors} | Unrepaired Nov 15 pilot |`,
  '',
  '## 3. Confirmed 50-Target Execution Batches',
  '',
  '| Batch | Package IDs | Qs | Opts | Baseline v2 Errors |',
  '| --- | --- | ---: | ---: | ---: |',
  ...batches.map(b => `| \`${b.batchId}\` | ${b.packageIds.map(id => `\`${id}\``).join(', ')} | ${b.questionCount} | ${b.optionCount} | ${b.baselineV2Errors} |`),
  '',
  '## 4. Full 60-Package Baseline Metrics',
  '',
  '| # | Set ID | Cohort | Role | Batch | Qs | Opts | Spec-009 Audited | Spec-009 Span % | Unresolved Spans | s009 File Err | v2 Errors | inline `kotobaU` |',
  '| ---: | --- | --- | --- | --- | ---: | ---: | :---: | ---: | ---: | ---: | ---: | ---: |'
];

allPackageRecords.forEach((p, idx) => {
  const m = p.baselineKotobaMetrics;
  const entry = targetManifest.packages[idx];
  mdLines.push(
    `| ${idx + 1} | \`${p.setId}\` | \`${p.cohort}\` | \`${entry.role}\` | ${entry.batchId ? `\`${entry.batchId}\`` : '—'} | ${p.questionCount} | ${p.optionCount} | ${p.auditEvidence.spec009Audited ? 'YES' : 'NO'} | ${m.spec009SpanCoveragePct}% | ${m.spec009UnresolvedSpans} | ${m.spec009FileValidatorErrors} | ${m.v2CompletenessErrorTotal} | ${m.inlineKotobaQuestions}/${p.questionCount} |`
  );
});

fs.writeFileSync(path.join(OUT_DIR, 'baseline-report.md'), mdLines.join('\n') + '\n');

// 7. Write initial progress.json & progress.md
const progressJson = {
  _meta: {
    updatedAt: new Date().toISOString(),
    branch: 'fix/kotoba-audit-40'
  },
  targetManifestPath: 'deliverables/kotoba-audit-40/target-manifest.json',
  selectionStatus: targetManifest._meta.selectionStatus,
  totalBatches: batches.length,
  completedBatches: [],
  completedPackageIds: [],
  currentPackageId: null,
  currentPhase: 'PHASE_2_3_DISCOVERY_AND_VALIDATOR_SETUP',
  filesModifiedInProduction: [],
  validationResults: {
    baselineRecordedForAll60: true
  },
  unresolvedFindings: {},
  lastSuccessfulCheckpoint: 'confirmed-50-target-manifest-and-baseline',
  nextAction: 'Run Phase 2/3 full context scan across all 50 targets and build strict validate-batch.mjs + negative tests, then begin Batch 01.'
};

fs.writeFileSync(path.join(OUT_DIR, 'progress.json'), JSON.stringify(progressJson, null, 2) + '\n');
fs.writeFileSync(
  path.join(OUT_DIR, 'progress.md'),
  [
    '# Progress Checkpoint — Non-OTAFF Kotoba Audit & Repair (50 Packages)',
    '',
    `- **Phase**: \`${progressJson.currentPhase}\``,
    `- **Branch**: \`fix/kotoba-audit-40\``,
    `- **Completed Batches**: 0 / ${batches.length} (0 / 50 packages)`,
    `- **Production Files Modified**: 0`,
    `- **Last Checkpoint**: \`${progressJson.lastSuccessfulCheckpoint}\``,
    `- **Next Action**: ${progressJson.nextAction}`,
    ''
  ].join('\n')
);

console.log('Phase 0 & Phase 1 artifacts written successfully.');
console.log('Total packages:', allPackageRecords.length);
console.log('Protected 10:', protected10.length);
console.log('Confirmed Targets 50:', confirmedTargets50.length, 'in', batches.length, 'batches');
console.log('Excluded:', confirmedExcluded0.length);
console.log('Total Questions:', immutableSnapshot._meta.totalQuestions, 'Options:', immutableSnapshot._meta.totalOptions);
