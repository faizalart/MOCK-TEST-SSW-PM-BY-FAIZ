import fs from 'node:fs';

const dict = JSON.parse(fs.readFileSync('data/sharedKotobaDictionary.json', 'utf8'));
const staging = JSON.parse(fs.readFileSync('scratch/staging-extracted-vocab.json', 'utf8'));

// Check terms with normalizedForm where normalizedForm might be inaccurate
const terms = Object.values(dict.terms);
const suspicious = [];

for (const t of terms) {
  if (t.normalizedForm && t.normalizedForm !== t.kanji) {
    // Find staging pair to see occurrences
    const pair = staging.uniqueRubyPairs.find(p => p.kanji === t.kanji && p.furigana === t.furigana);
    suspicious.push({
      term: t,
      pair
    });
  }
}

console.log(`Auditing ${suspicious.length} normalized terms...`);
// Let's check if any normalized form is unnatural
for (const item of suspicious) {
  const t = item.term;
  // e.g. 繰::く -> is it 繰り返す?
  if (t.kanji === '繰' || t.kanji === '戻' || t.kanji === '洗' || t.kanji === '流' || t.kanji === '応') {
    console.log(`\nCheck: ${t.id} [${t.kanji}::${t.furigana}] -> norm: ${t.normalizedForm}, arti: "${t.arti}"`);
    if (item.pair) {
      console.log(`  Sample occ:`, item.pair.occurrences.slice(0, 3).map(o => o.compositeKey || o.questionId));
    }
  }
}
