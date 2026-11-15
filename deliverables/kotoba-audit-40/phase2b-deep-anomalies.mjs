import fs from 'node:fs';
import { stripRubyAndHtml, hasKanji, isValidHiraganaReading, extractOptionId } from '../../scripts/lib/kotoba-pipeline-utils.mjs';

const manifest = JSON.parse(fs.readFileSync('deliverables/kotoba-audit-40/target-manifest.json', 'utf8'));
const dict = JSON.parse(fs.readFileSync('data/sharedKotobaDictionary.json', 'utf8'));
const mapping = JSON.parse(fs.readFileSync('data/kotobaMapping.json', 'utf8'));

const protectedIds = new Set(manifest.protectedReferencePackageIds);
const protTerms = new Set();
const targetTerms = new Set();
const asciiTokens = new Map();

for (const pm of manifest.packages) {
  const raw = JSON.parse(fs.readFileSync(pm.sourcePath, 'utf8'));
  const qs = (Array.isArray(raw) ? raw : raw.questions || []).filter(q => (q.setId || raw.setId || pm.setId) === pm.setId);
  const isProt = protectedIds.has(pm.setId);
  for (const q of qs) {
    const pIds = mapping.questions?.[q.id] || [];
    for (const id of pIds) (isProt ? protTerms : targetTerms).add(id);
    const texts = [stripRubyAndHtml(q.prompt || q.questionText || '')];
    for (let i = 0; i < (q.options || []).length; i++) {
      const o = q.options[i];
      const oid = extractOptionId(o, i);
      const oIds = mapping.byCompositeKey?.[`${q.id}::${oid}`] || mapping.options?.[q.id]?.[oid] || [];
      for (const id of oIds) (isProt ? protTerms : targetTerms).add(id);
      texts.push(stripRubyAndHtml(o.text || ''));
    }
    if (!isProt) {
      for (const t of texts) {
        const clean = t.replace(/^\[(?:イラスト|標識|図|写真|品目|保護具)[A-Za-z0-9]+\]\s*/u, '');
        for (const m of clean.matchAll(/[A-Za-z][A-Za-z0-9.\-]*|[0-9]+[A-Za-z]+/g)) {
          const w = m[0];
          asciiTokens.set(w, (asciiTokens.get(w) || 0) + 1);
        }
      }
    }
  }
}

console.log('Target unique referenced termIds:', targetTerms.size, '| Protected unique termIds:', protTerms.size);
console.log('=== DICT ANOMALIES ACROSS TARGET PROMPTS+OPTIONS ===');
for (const id of targetTerms) {
  const e = dict.terms[id];
  if (!e) { console.log('DANGLING:', id); continue; }
  const iss = [];
  if (e.status !== 'verified') iss.push('status:' + e.status);
  if (e.furigana === 'たんご') iss.push('tango');
  if (hasKanji(e.kanji) && (!e.furigana || !isValidHiraganaReading(e.furigana))) iss.push('badFuri:' + e.furigana);
  if (!e.arti || e.arti.length > 60) iss.push('artiLen:' + (e.arti?.length || 0));
  if ((e.unitType === 'inflected_verb' || e.unitType === 'inflected_adj') && !e.dictForm) iss.push('noDictForm');
  if (iss.length) {
    console.log(id, '|', e.kanji, '|', e.furigana, '| prot:', protTerms.has(id), '|', iss.join(','), '|', e.arti);
  }
}

console.log('=== ASCII TOKENS IN 50 TARGETS ===');
console.log([...asciiTokens.entries()].sort((a, b) => b[1] - a[1]).slice(0, 80));

const extraCheck = [
  ['bonus-soal-1', 'bonus-soal-1-q004'],
  ['bonus-soal-9', 'bonus-soal-9-q028'],
  ['bonus-soal-10', 'bonus-soal-10-q035'],
  ['ssw-pm-lab-bakteri', 'lab-bac-031'],
  ['ssw-pm-lab-haccp', 'lab-haccp-009'],
  ['ssw-pm-lab-alergen', 'lab-alg-017'],
  ['latsol-nguyen-02', 'nguyen02-q037'],
  ['ssw-pm-kunci-ujian-15', 'kunci-ujian-15-q008'],
  ['ssw-pm-kunci-ujian-14', 'kunci-ujian-14-q008'],
  ['ssw-pm-kunci-ujian-16', 'kunci-ujian-16-q024'],
];
console.log('=== EDGE CASES ===');
for (const [sid, qid] of extraCheck) {
  const pm = manifest.packages.find(p => p.setId === sid);
  const d = JSON.parse(fs.readFileSync(pm.sourcePath, 'utf8'));
  const q = (d.questions || d).find(x => x.id === qid);
  console.log(qid, 'promptHtml:', (q.prompt || q.questionText), '\n  plain:', stripRubyAndHtml(q.prompt || q.questionText), '\n  mapped:', (mapping.questions[qid] || []).map(id => id + ':' + dict.terms[id]?.kanji));
  for (let i = 0; i < (q.options || []).length; i++) {
    const o = q.options[i];
    const oid = extractOptionId(o, i);
    const ck = `${qid}::${oid}`;
    console.log(`  opt ${oid}:`, stripRubyAndHtml(o.text), '\n    mapped:', (mapping.byCompositeKey[ck] || []).map(id => id + ':' + dict.terms[id]?.kanji));
  }
}
