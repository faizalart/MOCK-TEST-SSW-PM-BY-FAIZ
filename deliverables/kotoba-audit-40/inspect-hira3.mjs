import fs from 'node:fs';
import { PURE_PARTICLES, HIRA_LEXICAL, cleanContextText } from './validate-batch.mjs';

const manifest = JSON.parse(fs.readFileSync('deliverables/kotoba-audit-40/target-manifest.json', 'utf8'));
const dict = JSON.parse(fs.readFileSync('data/sharedKotobaDictionary.json', 'utf8'));
const dictKeys = new Set(Object.values(dict.terms).map(t => t?.kanji).filter(Boolean));
const segJa = new Intl.Segmenter('ja', { granularity: 'word' });
const hits = new Map();

for (const pm of manifest.packages) {
  if (pm.role !== 'target_repair_50' || pm.cohort === 'cohort_1_spec009_canonical') continue;
  const raw = JSON.parse(fs.readFileSync(pm.sourcePath, 'utf8'));
  const qs = (Array.isArray(raw) ? raw : raw.questions || []).filter(q => (q.setId || raw.setId || pm.setId) === pm.setId);
  for (const q of qs) {
    const htmls = [q.prompt || q.questionText, ...(q.options || []).map(o => o.text)];
    for (const h of htmls) {
      const plain = cleanContextText(h);
      for (const s of segJa.segment(plain)) {
        const w = s.segment;
        if (!/^[\u3041-\u3096ー]{3,}$/.test(w)) continue;
        if (PURE_PARTICLES.has(w) || HIRA_LEXICAL.has(w) || dictKeys.has(w)) continue;
        const r = hits.get(w) || { n: 0, sample: plain.slice(0, 70), pkg: pm.setId };
        r.n++;
        hits.set(w, r);
      }
    }
  }
}
for (const [w, r] of [...hits.entries()].sort((a, b) => b[1].n - a[1].n).slice(0, 90)) {
  console.log(`${w} (${r.n}) [${r.pkg}] -> ${r.sample}`);
}
