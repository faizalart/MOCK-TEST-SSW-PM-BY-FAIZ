import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { auditPackageCoverage } from '../../scripts/audit-kotoba-coverage.mjs';

const BACKUP_DIR = 'deliverables/backups/pre-kotoba-repair-20261115';
const OUT_DIR = 'deliverables/kotoba-repair';
fs.mkdirSync(BACKUP_DIR, { recursive: true });
fs.mkdirSync(OUT_DIR, { recursive: true });

function copyRecursive(src, dst) {
  const st = fs.statSync(src);
  if (st.isDirectory()) {
    fs.mkdirSync(dst, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dst, entry));
    }
  } else {
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(src, dst);
  }
}

// 1. Backup production kotoba masters + skill source + skill zip + staging deltas
const backupTargets = [
  'data/sharedKotobaDictionary.json',
  'data/kotobaMapping.json',
  'data/kotoba-dan-kategori-tambahan.json',
  'deliverables/staging/otaff-pm51-10-packages/data/sharedKotobaDictionary-delta.json',
  'deliverables/staging/otaff-pm51-10-packages/data/kotobaMapping-delta.json',
  'deliverables/staging/otaff-pm51-10-packages/data/kotoba-tambahan-delta.json',
  'deliverables/pdf-to-json',
  'deliverables/pdf-to-json-gemini-skill.zip',
];

for (const target of backupTargets) {
  copyRecursive(target, path.join(BACKUP_DIR, target));
}
console.log('Backed up', backupTargets.length, 'targets to', BACKUP_DIR);

// 2. Snapshot SHA-256 of immutable question/option/key fields across P01-P10
const snapshot = {};
let inlineKotobaCount = 0;
for (let i = 1; i <= 10; i++) {
  const fname = `data/latsol-otaff-pm51-${String(i).padStart(2, '0')}.json`;
  const pkg = JSON.parse(fs.readFileSync(fname, 'utf8'));
  for (const q of pkg.questions) {
    if (q.kotobaU || q.kotobaV || q.kotobaFormatted) inlineKotobaCount++;
    const payload = JSON.stringify({
      id: q.id,
      setId: q.setId,
      questionNumber: q.questionNumber,
      points: q.points,
      questionText: q.questionText,
      prompt: q.prompt,
      instructions: q.instructions,
      promptTranslation: q.promptTranslation,
      correctAnswer: q.correctAnswer,
      correctIndex: q.correctIndex,
      options: q.options,
      questionImage: q.questionImage,
      media: q.media,
    });
    snapshot[q.id] = crypto.createHash('sha256').update(payload).digest('hex');
  }
}
fs.writeFileSync(path.join(OUT_DIR, 'question-immutable-snapshot.json'), JSON.stringify(snapshot, null, 2) + '\n', 'utf8');

// 3. Record baseline stats & span coverage across P01-P10 + nguyen-01
const dict = JSON.parse(fs.readFileSync('data/sharedKotobaDictionary.json', 'utf8'));
const mapping = JSON.parse(fs.readFileSync('data/kotobaMapping.json', 'utf8'));
const kt = JSON.parse(fs.readFileSync('data/kotoba-dan-kategori-tambahan.json', 'utf8'));

let otaffPromptTerms = 0;
let otaffOptTerms = 0;
let otaffPromptCovSum = 0;
let otaffOptCovSum = 0;
const pkgBaselines = [];

const pkgFiles = [
  'data/latsol-nguyen-01.json',
  ...Array.from({ length: 10 }, (_, i) => `data/latsol-otaff-pm51-${String(i + 1).padStart(2, '0')}.json`),
];

for (const pkgFile of pkgFiles) {
  const pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf8'));
  const cov = auditPackageCoverage(pkgFile, dict, mapping);
  let pTerms = 0, oTerms = 0, oCnt = 0;
  for (const q of pkg.questions) {
    pTerms += (mapping.questions[q.id] || []).length;
    for (const o of q.options) {
      oCnt++;
      oTerms += (mapping.byCompositeKey[`${q.id}::${o.id}`] || mapping.options[q.id]?.[o.id] || []).length;
    }
  }
  const promptSents = cov.sentences.filter(s => s.targetType === 'prompt');
  const optSents = cov.sentences.filter(s => s.targetType === 'option');
  const avgPCharCov = Number((promptSents.reduce((a, b) => a + b.coveredPct, 0) / promptSents.length).toFixed(2));
  const avgOCharCov = Number((optSents.reduce((a, b) => a + b.coveredPct, 0) / optSents.length).toFixed(2));

  pkgBaselines.push({
    pkg: path.basename(pkgFile),
    questions: pkg.questions.length,
    options: oCnt,
    promptTerms: pTerms,
    avgPromptTerms: Number((pTerms / pkg.questions.length).toFixed(2)),
    optTerms: oTerms,
    avgOptTerms: Number((oTerms / oCnt).toFixed(2)),
    spanCoveragePct: cov.spanCoveragePct,
    avgPromptCharCov: avgPCharCov,
    avgOptCharCov: avgOCharCov,
    unresolvedSpans: cov.totalUnresolvedSpans,
  });

  if (pkgFile.includes('otaff-pm51')) {
    otaffPromptTerms += pTerms;
    otaffOptTerms += oTerms;
    otaffPromptCovSum += avgPCharCov;
    otaffOptCovSum += avgOCharCov;
  }
}

const baseline = {
  recordedAt: new Date().toISOString(),
  masterDictionaryTerms: Object.keys(dict.terms || {}).length,
  masterMappingQuestions: Object.keys(mapping.questions || {}).length,
  masterMappingCompositeKeys: Object.keys(mapping.byCompositeKey || {}).length,
  masterKotobaTambahanEntries: Object.keys(kt.entries || {}).length,
  inlineKotobaIn10Packages: inlineKotobaCount,
  otaff10PackagesSummary: {
    totalQuestions: 400,
    totalOptions: 1200,
    totalContexts: 1600,
    promptTermsBefore: otaffPromptTerms,
    optTermsBefore: otaffOptTerms,
    avgPromptTermsBefore: Number((otaffPromptTerms / 400).toFixed(2)),
    avgOptTermsBefore: Number((otaffOptTerms / 1200).toFixed(2)),
  },
  packages: pkgBaselines,
};
fs.writeFileSync(path.join(OUT_DIR, 'baseline-before-repair.json'), JSON.stringify(baseline, null, 2) + '\n', 'utf8');
console.log(JSON.stringify(baseline, null, 2));
