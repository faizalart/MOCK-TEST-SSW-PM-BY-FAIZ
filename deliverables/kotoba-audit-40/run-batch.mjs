import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { repairContextList } from './lib-repair-batch.mjs';
import { buildCuratedMap } from './curated-audit-terms.mjs';
import {
  verifyProtectedAndImmutability,
  validatePackagesList,
  runNegativeTests,
} from './validate-batch.mjs';

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'deliverables/kotoba-audit-40');

const batchId = process.argv[2];
const isDryRun = process.argv.includes('--dry-run');
if (!batchId) {
  console.error('Usage: node run-batch.mjs <batch-XX> [--dry-run]');
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'target-manifest.json'), 'utf8'));
const bObj = manifest.batches.find(b => b.batchId === batchId);
if (!bObj) throw new Error(`Batch ${batchId} not found in target-manifest.json`);

const dict = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/sharedKotobaDictionary.json'), 'utf8'));
const mapping = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/kotobaMapping.json'), 'utf8'));
const kt = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/kotoba-dan-kategori-tambahan.json'), 'utf8'));

// Before counts
const beforeVal = validatePackagesList({ packageIds: bObj.packageIds, manifest, dict, mapping, kt });

const curatedMap = buildCuratedMap();
const repairRes = repairContextList({
  dict,
  mapping,
  kt,
  packageIds: bObj.packageIds,
  applyCuratedMap: curatedMap,
  dryRun: isDryRun,
});

// Always run full in-memory validation on the repaired state!
const afterVal = validatePackagesList({ packageIds: bObj.packageIds, manifest, dict, mapping, kt, checkInlineSync: !isDryRun });

if (isDryRun) {
  console.log(`=== DRY RUN ${batchId} ===`);
  console.log('Before errors:', beforeVal.totalErrors, '-> After errors (in-memory):', afterVal.totalErrors);
  console.log('Uncurated surfaces remaining (' + repairRes.uncurated.length + '):');
  for (let i = 0; i < repairRes.uncurated.length; i++) {
    const u = repairRes.uncurated[i];
    console.log(`${i + 1}. ${u.surface} | furi:${u.reading} | n:${u.count} | ${u.sample}`);
  }
  if (afterVal.totalErrors > 0) {
    console.log('\nSample residual validator errors:');
    for (const r of afterVal.results) {
      if (r.errors > 0) {
        console.log(`  [${r.setId}] errs=${r.errors}`, r.sampleErrors.slice(0, 6));
      }
    }
  }
  process.exit(0);
}

// Strict gate before persisting files!
if (repairRes.uncurated.length > 0 || afterVal.totalErrors > 0) {
  console.error(`REFUSING TO SAVE ${batchId}: uncurated=${repairRes.uncurated.length}, validationErrors=${afterVal.totalErrors}`);
  for (const r of afterVal.results) {
    if (r.errors > 0) console.error(r.setId, r.sampleErrors.slice(0, 8));
  }
  process.exit(1);
}

// Update dictionary & mapping _meta accurately
const nowIso = new Date().toISOString();
const allTerms = Object.values(dict.terms || {});
const verifiedTerms = allTerms.filter(t => t && t.status === 'verified');
dict._meta = {
  ...dict._meta,
  schemaVersion: '2.0.0',
  dataVersion: mapping._meta?.dataVersion || dict._meta?.dataVersion || '20261113-v2',
  totalTerms: allTerms.length,
  verifiedTerms: verifiedTerms.length,
  verifiedCount: verifiedTerms.length,
  updatedAt: nowIso,
};
mapping._meta = {
  ...mapping._meta,
  schemaVersion: '2.0.0',
  dataVersion: dict._meta.dataVersion,
  totalQuestions: Object.keys(mapping.questions || {}).length,
  totalOptions: Object.values(mapping.options || {}).reduce((a, o) => a + Object.keys(o || {}).length, 0),
  totalCompositeKeys: Object.keys(mapping.byCompositeKey || {}).length,
  updatedAt: nowIso,
};
kt.totalEntries = Object.keys(kt.entries || {}).length;
if (kt._meta) kt._meta.updatedAt = nowIso;

fs.writeFileSync(path.join(ROOT, 'data/sharedKotobaDictionary.json'), JSON.stringify(dict, null, 2) + '\n');
fs.writeFileSync(path.join(ROOT, 'data/kotobaMapping.json'), JSON.stringify(mapping, null, 2) + '\n');
fs.writeFileSync(path.join(ROOT, 'data/kotoba-dan-kategori-tambahan.json'), JSON.stringify(kt, null, 2) + '\n');

// Verify written disk state: protected packages, 60-pkg immutability, and negative tests
runNegativeTests();
const writtenDict = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/sharedKotobaDictionary.json'), 'utf8'));
const writtenMap = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/kotobaMapping.json'), 'utf8'));
const writtenKt = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/kotoba-dan-kategori-tambahan.json'), 'utf8'));
verifyProtectedAndImmutability({ manifest, dict: writtenDict, mapping: writtenMap });
const diskVal = validatePackagesList({ packageIds: bObj.packageIds, manifest, dict: writtenDict, mapping: writtenMap, kt: writtenKt });
assert.equal(diskVal.totalErrors, 0, `Written disk validation failed on ${batchId}`);

// Write batch report (.json & .md)
const batchReportDir = path.join(OUT_DIR, 'batches');
fs.mkdirSync(batchReportDir, { recursive: true });
const batchReport = {
  batchId,
  completedAt: nowIso,
  packages: bObj.packageIds,
  beforeTotalErrors: beforeVal.totalErrors,
  afterTotalErrors: diskVal.totalErrors,
  beforeByPackage: beforeVal.results.map(r => ({ setId: r.setId, cohort: r.cohort, questions: r.questions, errors: r.errors, spanPct: r.fileSpanCoveragePct })),
  afterByPackage: diskVal.results.map(r => ({ setId: r.setId, cohort: r.cohort, questions: r.questions, errors: r.errors, spanPct: r.fileSpanCoveragePct, spec009Check: r.spec009Check })),
  touchedPackageFiles: repairRes.touchedPackageFiles,
  curatedTermsTotalInMaster: Object.keys(curatedMap).length,
  protected10Verified: true,
  immutabilityVerified: true,
};
fs.writeFileSync(path.join(batchReportDir, `${batchId}.json`), JSON.stringify(batchReport, null, 2) + '\n');
fs.writeFileSync(
  path.join(batchReportDir, `${batchId}.md`),
  [
    `# Batch Report: \`${batchId}\``,
    '',
    `- **Completed At**: \`${nowIso}\``,
    `- **Packages**: ${bObj.packageIds.map(id => `\`${id}\``).join(', ')}`,
    `- **Strict Context Errors**: **${beforeVal.totalErrors} -> ${diskVal.totalErrors}**`,
    `- **Protected 10 OTAFF SHA-256 & Parity**: **VERIFIED IDENTICAL**`,
    `- **60-Package Immutability**: **VERIFIED**`,
    '',
    '| Set ID | Cohort | Qs | Errors Before | Errors After | Span % After |',
    '| --- | --- | ---: | ---: | ---: | ---: |',
    ...diskVal.results.map((r, i) => `| \`${r.setId}\` | \`${r.cohort}\` | ${r.questions} | ${beforeVal.results[i].errors} | **${r.errors}** | ${r.fileSpanCoveragePct}% |`),
    ''
  ].join('\n')
);

// Update progress.json & progress.md
const progPath = path.join(OUT_DIR, 'progress.json');
const progress = JSON.parse(fs.readFileSync(progPath, 'utf8'));
progress._meta.updatedAt = nowIso;
if (!progress.completedBatches.includes(batchId)) progress.completedBatches.push(batchId);
for (const sid of bObj.packageIds) {
  if (!progress.completedPackageIds.includes(sid)) progress.completedPackageIds.push(sid);
}
progress.currentPackageId = null;
progress.currentPhase = `BATCH_${batchId.toUpperCase()}_VERIFIED`;
progress.lastSuccessfulCheckpoint = `${batchId}-verified`;
const nextBatchIdx = progress.completedBatches.length;
progress.nextAction = nextBatchIdx < manifest.batches.length
  ? `Proceed with ${manifest.batches[nextBatchIdx].batchId}`
  : 'Run final full-repository verification and generate final deliverables.';
for (const pf of ['data/sharedKotobaDictionary.json', 'data/kotobaMapping.json', 'data/kotoba-dan-kategori-tambahan.json', ...repairRes.touchedPackageFiles]) {
  if (!progress.filesModifiedInProduction.includes(pf)) progress.filesModifiedInProduction.push(pf);
}
fs.writeFileSync(progPath, JSON.stringify(progress, null, 2) + '\n');
fs.writeFileSync(
  path.join(OUT_DIR, 'progress.md'),
  [
    '# Progress Checkpoint — Non-OTAFF Kotoba Audit & Repair (50 Packages)',
    '',
    `- **Phase**: \`${progress.currentPhase}\``,
    `- **Branch**: \`fix/kotoba-audit-40\``,
    `- **Completed Batches**: ${progress.completedBatches.length} / ${manifest.batches.length} (${progress.completedPackageIds.length} / 50 packages)`,
    `- **Last Checkpoint**: \`${progress.lastSuccessfulCheckpoint}\``,
    `- **Next Action**: ${progress.nextAction}`,
    '',
    '## Completed Batches',
    ...progress.completedBatches.map(b => `- \`${b}\``),
    ''
  ].join('\n')
);

console.log(`✓ ${batchId.toUpperCase()} APPLIED & VERIFIED SUCCESSFULLY! Errors: ${beforeVal.totalErrors} -> ${diskVal.totalErrors}`);
