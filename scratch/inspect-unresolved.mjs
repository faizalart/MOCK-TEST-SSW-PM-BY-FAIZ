import fs from 'node:fs';

const dict = JSON.parse(fs.readFileSync('data/sharedKotobaDictionary.json', 'utf8'));
const terms = Object.values(dict.terms);

const unresolved = terms.filter(t => t.status === 'unresolved');
console.log(`Total existing unresolved terms: ${unresolved.length}`);
for (const t of unresolved) {
  console.log(`- ${t.id} [${t.kanji}::${t.furigana}] occ:${t.occurrences.length}`);
}
