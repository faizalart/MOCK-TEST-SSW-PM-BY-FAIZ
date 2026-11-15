import fs from 'node:fs';
import path from 'node:path';
import {
  extractOptionId,
  loadPackageQuestions
} from '../../scripts/lib/kotoba-pipeline-utils.mjs';

const ROOT = process.cwd();
const dict = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/sharedKotobaDictionary.json'), 'utf8'));
const mapping = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/kotobaMapping.json'), 'utf8'));

// Also check pre-otaff backup if exists
const preOtaffMapPath = path.join(ROOT, 'deliverables/backups/pre-otaff-pm51-10-paket/data/kotobaMapping.json');
const preOtaffMapping = fs.existsSync(preOtaffMapPath)
  ? JSON.parse(fs.readFileSync(preOtaffMapPath, 'utf8'))
  : null;

console.log('pre-otaff mapping meta:', preOtaffMapping?._meta?.totalQuestions, preOtaffMapping?._meta?.updatedAt);

const files = [
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

const pkgMap = new Map();
for (const rel of files) {
  const data = JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
  const qs = Array.isArray(data) ? data : (data.questions || []);
  for (const q of qs) {
    const sid = q.setId || data.setId;
    if (!pkgMap.has(sid)) pkgMap.set(sid, []);
    pkgMap.get(sid).push(q);
  }
}

for (const [sid, qs] of pkgMap.entries()) {
  const prefixes = {};
  let preOtaffHasAll = 0;
  let totalContexts = 0;
  let zeroTermContexts = 0;
  for (const q of qs) {
    totalContexts++;
    if (preOtaffMapping?.questions?.[q.id]) preOtaffHasAll++;
    const pIds = mapping.questions?.[q.id] || [];
    if (pIds.length === 0) zeroTermContexts++;
    for (const id of pIds) {
      const m = id.match(/^(kb-[a-z0-9]+)/i);
      const pfx = m ? m[1] : id.slice(0, 8);
      prefixes[pfx] = (prefixes[pfx] || 0) + 1;
    }
    for (let i = 0; i < (q.options || []).length; i++) {
      totalContexts++;
      const optId = extractOptionId(q.options[i], i);
      const ck = `${q.id}::${optId}`;
      const oIds = Array.isArray(mapping.byCompositeKey?.[ck])
        ? mapping.byCompositeKey[ck]
        : (Array.isArray(mapping.options?.[q.id]?.[optId]) ? mapping.options[q.id][optId] : []);
      if (oIds.length === 0) zeroTermContexts++;
      for (const id of oIds) {
        const m = id.match(/^(kb-[a-z0-9]+)/i);
        const pfx = m ? m[1] : id.slice(0, 8);
        prefixes[pfx] = (prefixes[pfx] || 0) + 1;
      }
    }
  }
  const topPfx = Object.entries(prefixes).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, v]) => `${k}:${v}`).join(',');
  console.log(
    sid.padEnd(23),
    `preQ=${String(preOtaffHasAll).padStart(2)}/${String(qs.length).padStart(2)}`,
    `zeroCtx=${String(zeroTermContexts).padStart(3)}/${String(totalContexts).padStart(3)}`,
    `prefixes=[${topPfx}]`
  );
}
