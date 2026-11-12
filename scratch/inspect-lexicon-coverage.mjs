import fs from 'node:fs';

const dict = JSON.parse(fs.readFileSync('data/sharedKotobaDictionary.json', 'utf8'));
const terms = Object.values(dict.terms);

console.log('Total entries:', terms.length);

// Let's inspect length distribution of kanji
const byLen = {};
for (const t of terms) {
  const l = t.kanji.length;
  byLen[l] = (byLen[l] || 0) + 1;
}
console.log('Kanji length distribution:', byLen);
