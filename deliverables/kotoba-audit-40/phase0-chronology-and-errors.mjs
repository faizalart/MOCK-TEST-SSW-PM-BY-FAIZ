import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { validateKotobaPackage } from '../../scripts/validate-kotoba-package.mjs';
import { validateContextCompleteness } from '../../scripts/validate-otaff-kotoba-completeness.mjs';
import {
  extractQuestionPlainText,
  extractOptionId,
  extractOptionPlainText
} from '../../scripts/lib/kotoba-pipeline-utils.mjs';

const ROOT = process.cwd();
const dict = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/sharedKotobaDictionary.json'), 'utf8'));
const mapping = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/kotobaMapping.json'), 'utf8'));
const extra = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/kotoba-dan-kategori-tambahan.json'), 'utf8'));

function safeGit(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
}

const rootAndDataFiles = [
  'data/ssw-pm-kunci-ujian-1.json',
  'data/ssw-pm-kunci-ujian-2.json',
  'data/ssw-pm-all-kunci-ujian-3-to-13.json',
  'data/ssw-pm-bonus-soal-1-to-10-bundle.json',
  'data/ssw-pm-special-lab-bundle.json',
  'data/ssw-pm-tipe2-nguyen1.json',
  'data/ssw-pm-kunci-ujian-14.json',
  'data/ssw-pm-kunci-ujian-15.json',
  'data/ssw-pm-kunci-ujian-16.json',
  ...Array.from({ length: 10 }, (_, i) => `data/latsol-nguyen-${String(i + 1).padStart(2, '0')}.json`),
  ...Array.from({ length: 6 }, (_, i) => `data/latsol-reguler-${String(i + 1).padStart(2, '0')}.json`),
  'data/latsol-tambahan-01.json',
  'data/latsol-tambahan-02.json',
  'data/latsol-hitungan-01.json',
  'data/pilot-otaff51-01.json',
  ...Array.from({ length: 10 }, (_, i) => `data/latsol-otaff-pm51-${String(i + 1).padStart(2, '0')}.json`)
];

console.log('=== FILE LEVEL METADATA & GIT CHRONOLOGY ===');
for (const rel of rootAndDataFiles) {
  const base = path.basename(rel);
  const abs = path.join(ROOT, rel);
  const st = fs.statSync(abs);
  const data = JSON.parse(fs.readFileSync(abs, 'utf8'));
  const qs = Array.isArray(data) ? data : (data.questions || []);
  const sets = [...new Set(qs.map(q => q.setId || data.setId || base.replace('.json', '')))];

  const firstCommit = safeGit(`git log --follow --reverse --format="%h|%ai|%s" -- "${base}" "data/${base}"`).split('\n')[0] || 'UNCOMMITTED';
  const lastCommit = safeGit(`git log -n 1 --format="%h|%ai|%s" -- "${base}" "data/${base}"`) || 'UNCOMMITTED';

  // Run Spec 009 validator per file
  const s009 = validateKotobaPackage({ packageFile: rel, dict, mapping, requireVersion2: false });
  const s009Counts = {};
  for (const e of s009.errors) s009Counts[e.code] = (s009Counts[e.code] || 0) + 1;

  // Check createdAt ranges
  const createdValues = [...new Set(qs.map(q => q.createdAt).filter(Boolean))].sort();
  const minCreated = createdValues.length ? new Date(Math.min(...createdValues.map(v => typeof v === 'number' ? v : Date.parse(v)))).toISOString().slice(0, 19) : '-';
  const hasExtraCount = qs.filter(q => extra.entries?.[q.id]).length;

  console.log([
    base.padEnd(36),
    `sets=${String(sets.length).padStart(2)}`,
    `qs=${String(qs.length).padStart(3)}`,
    `extra=${String(hasExtraCount).padStart(3)}/${qs.length}`,
    `mtime=${st.mtime.toISOString().slice(0, 19)}`,
    `created=${minCreated}`,
    `s009Err=${s009.errors.length}`,
    `(${Object.entries(s009Counts).map(([k, v]) => `${k}:${v}`).join(',')})`,
    `git1=${firstCommit}`
  ].join(' | '));
}

// Now break down v2 validator errors by error code per package
console.log('\n=== V2 VALIDATOR ERROR CODES PER PACKAGE ===');
const pkgMap = new Map();
for (const rel of rootAndDataFiles) {
  const data = JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
  const qs = Array.isArray(data) ? data : (data.questions || []);
  for (const q of qs) {
    const sid = q.setId || data.setId;
    if (!pkgMap.has(sid)) pkgMap.set(sid, { rel, qs: [] });
    pkgMap.get(sid).qs.push(q);
  }
}

for (const [sid, info] of pkgMap.entries()) {
  const counts = {};
  const sampleSurfaces = [];
  for (const q of info.qs) {
    const pIds = mapping.questions?.[q.id];
    const pErrs = validateContextCompleteness({
      contextKey: q.id,
      html: q.prompt || q.questionText || extractQuestionPlainText(q),
      termIds: pIds,
      dict,
      otaffKnownKanjis: null
    });
    for (const e of pErrs) {
      counts[e.code] = (counts[e.code] || 0) + 1;
      if (sampleSurfaces.length < 5 && e.surface) sampleSurfaces.push(e.surface);
    }
    const opts = Array.isArray(q.options) ? q.options : [];
    for (let i = 0; i < opts.length; i++) {
      const opt = opts[i];
      const optId = extractOptionId(opt, i);
      const ck = `${q.id}::${optId}`;
      const oIds = Array.isArray(mapping.byCompositeKey?.[ck])
        ? mapping.byCompositeKey[ck]
        : (Array.isArray(mapping.options?.[q.id]?.[optId]) ? mapping.options[q.id][optId] : null);
      const oErrs = validateContextCompleteness({
        contextKey: ck,
        html: opt.text || extractOptionPlainText(opt),
        termIds: oIds,
        dict,
        otaffKnownKanjis: null
      });
      for (const e of oErrs) {
        counts[e.code] = (counts[e.code] || 0) + 1;
        if (sampleSurfaces.length < 5 && e.surface) sampleSurfaces.push(e.surface);
      }
    }
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (total > 0 || sid.startsWith('ssw-pm-') || sid.startsWith('bonus-') || sid.startsWith('pilot-')) {
    console.log(
      sid.padEnd(24),
      `total=${String(total).padStart(4)}`,
      Object.entries(counts).map(([k, v]) => `${k}:${v}`).join(' '),
      sampleSurfaces.length ? `samples=[${sampleSurfaces.join(',')}]` : ''
    );
  }
}
