import fs from 'node:fs';

const staging = JSON.parse(fs.readFileSync('scratch/staging-extracted-vocab.json', 'utf8'));
const dict = JSON.parse(fs.readFileSync('data/sharedKotobaDictionary.json', 'utf8'));

// Check how many pairs in staging are not represented by (kanji, furigana) in dict.terms
const dictPairs = new Set();
for (const term of Object.values(dict.terms)) {
  dictPairs.add(`${term.kanji}::${term.furigana}`);
}

const missingFromDict = [];
for (const pair of staging.uniqueRubyPairs) {
  const key = `${pair.kanji}::${pair.furigana}`;
  if (!dictPairs.has(key)) {
    missingFromDict.push(pair);
  }
}

console.log('Total uniqueRubyPairs in staging:', staging.uniqueRubyPairs.length);
console.log('Total terms in dict:', Object.keys(dict.terms).length);
console.log('Unique (kanji::furigana) in dict:', dictPairs.size);
console.log('Staging pairs missing from dict by (kanji::furigana):', missingFromDict.length);
console.log('\nMissing pairs:');
for (const p of missingFromDict) {
  console.log(`- ${p.id} [${p.kanji}::${p.furigana}], occurrences: ${p.occurrences.length}`);
}
