import fs from 'node:fs';

const dict = JSON.parse(fs.readFileSync('data/sharedKotobaDictionary.json', 'utf8'));
const terms = Object.values(dict.terms);

const files = [
  'ssw-pm-kunci-ujian-1.json',
  'ssw-pm-kunci-ujian-2.json',
  'ssw-pm-all-kunci-ujian-3-to-13.json',
  'ssw-pm-bonus-soal-1-to-10-bundle.json',
  'ssw-pm-tipe2-nguyen1.json',
  'ssw-pm-special-lab-bundle.json'
];

const qMap = new Map();
for (const f of files) {
  const d = JSON.parse(fs.readFileSync(f, 'utf8'));
  const qs = d.questions || d;
  for (const q of qs) qMap.set(q.id, q);
}

// Gather contexts for each term
for (const t of terms) {
  t.sampleContexts = [];
  for (const occ of t.occurrences.slice(0, 3)) {
    const q = qMap.get(occ.questionId);
    if (!q) continue;
    if (occ.targetType === 'prompt') {
      t.sampleContexts.push({
        type: 'prompt',
        ja: q.prompt,
        id: q.promptTranslation
      });
    } else {
      const opt = (q.options || []).find(o => o.id === occ.optionId);
      if (opt) {
        t.sampleContexts.push({
          type: 'option',
          ja: opt.text,
          id: opt.translation
        });
      }
    }
  }
}

// Summary stats
console.log('Total terms:', terms.length);
console.log('Matched:', terms.filter(t => t.matchStatus === 'matched').length);
console.log('Ambiguous:', terms.filter(t => t.matchStatus === 'ambiguous').length);
console.log('Contextual review:', terms.filter(t => t.matchStatus === 'contextual_review').length);
console.log('Unmatched:', terms.filter(t => t.matchStatus === 'unmatched').length);
