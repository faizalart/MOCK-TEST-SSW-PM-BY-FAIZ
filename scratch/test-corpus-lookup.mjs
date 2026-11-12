import fs from 'node:fs';

const dict = JSON.parse(fs.readFileSync('data/sharedKotobaDictionary.json', 'utf8'));
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

// Sample 5 terms from p1
const p1 = JSON.parse(fs.readFileSync('scratch/matched-part1.json', 'utf8'));
for (const key of p1.slice(0, 5)) {
  const term = Object.values(dict.terms).find(t => `${t.kanji}::${t.furigana}` === key);
  console.log('===', key, 'occ:', term?.occurrencesCount);
  if (term && term.occurrences[0]) {
    const occ = term.occurrences[0];
    const q = qMap.get(occ.questionId);
    if (q) {
      if (occ.targetType === 'prompt') {
        console.log('JA:', q.prompt);
        console.log('ID:', q.promptTranslation);
      } else {
        const opt = (q.options || []).find(o => o.id === occ.optionId);
        console.log('JA:', opt?.text);
        console.log('ID:', opt?.translation);
      }
    }
  }
}
