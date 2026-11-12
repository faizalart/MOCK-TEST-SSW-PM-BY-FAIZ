// scratch/inspect-occurrences-structure.mjs
import fs from 'node:fs';

const dict = JSON.parse(fs.readFileSync('data/sharedKotobaDictionary.json', 'utf8'));
const staging = JSON.parse(fs.readFileSync('scratch/staging-extracted-vocab.json', 'utf8'));

console.log('Sample occurrences from dict:');
const sampleTerms = Object.values(dict.terms).slice(0, 5);
for (const t of sampleTerms) {
  console.log(`\nTerm: ${t.id} [${t.kanji}::${t.furigana}] (${t.status}) - occ: ${t.occurrences.length}`);
  console.log('  sample occ:', t.occurrences.slice(0, 3));
}

// Check targetType and optionId across dict
let promptOccCount = 0;
let optionOccCount = 0;
const optionIdSet = new Set();
for (const t of Object.values(dict.terms)) {
  for (const o of t.occurrences) {
    if (o.targetType === 'prompt') promptOccCount++;
    else if (o.targetType === 'option') {
      optionOccCount++;
      optionIdSet.add(o.optionId);
    }
  }
}
console.log(`\nDict Occurrences:`);
console.log(`  Prompt occurrences: ${promptOccCount}`);
console.log(`  Option occurrences: ${optionOccCount}`);
console.log(`  Total occurrences:  ${promptOccCount + optionOccCount}`);
console.log(`  Distinct optionIds in occurrences:`, Array.from(optionIdSet));
