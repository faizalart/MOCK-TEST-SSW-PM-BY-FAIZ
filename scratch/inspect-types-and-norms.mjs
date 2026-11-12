import fs from 'node:fs';

const dict = JSON.parse(fs.readFileSync('data/sharedKotobaDictionary.json', 'utf8'));

const terms = Object.values(dict.terms);
const byType = {};
const byStatus = {};
for (const t of terms) {
  byType[t.entryType] = (byType[t.entryType] || 0) + 1;
  byStatus[t.status] = (byStatus[t.status] || 0) + 1;
}

console.log('Terms by status:', byStatus);
console.log('Terms by entryType:', byType);

// List all entries with normalizedForm
const withNorm = terms.filter(t => t.normalizedForm && t.normalizedForm !== t.kanji);
console.log(`\nTerms with normalizedForm != kanji: ${withNorm.length}`);
for (const t of withNorm.slice(0, 10)) {
  console.log(`- ${t.id} [${t.kanji}::${t.furigana}] -> norm: ${t.normalizedForm}, arti: "${t.arti}"`);
}
