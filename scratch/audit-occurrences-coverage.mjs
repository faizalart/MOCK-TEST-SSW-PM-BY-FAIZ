import fs from 'node:fs';

const staging = JSON.parse(fs.readFileSync('scratch/staging-extracted-vocab.json', 'utf8'));
const dict = JSON.parse(fs.readFileSync('data/sharedKotobaDictionary.json', 'utf8'));

// Collect all occurrences from staging
const stagingOccurrences = new Map(); // compositeKey -> array of pair keys
for (const pair of staging.uniqueRubyPairs) {
  const pairKey = `${pair.kanji}::${pair.furigana}`;
  for (const occ of pair.occurrences) {
    const key = occ.compositeKey || `${occ.questionId}::prompt`;
    if (!stagingOccurrences.has(key)) stagingOccurrences.set(key, []);
    stagingOccurrences.get(key).push({ pairKey, occ });
  }
}

// Collect all occurrences from dict
const dictOccurrences = new Map();
for (const term of Object.values(dict.terms)) {
  for (const occ of term.occurrences) {
    const key = occ.compositeKey || `${occ.questionId}::prompt`;
    if (!dictOccurrences.has(key)) dictOccurrences.set(key, []);
    dictOccurrences.get(key).push({ termId: term.id, kanji: term.kanji, furigana: term.furigana, occ });
  }
}

console.log('Staging unique occurrence locations (Q/Opt):', stagingOccurrences.size);
console.log('Dict unique occurrence locations (Q/Opt):', dictOccurrences.size);

// Check if any occurrence location from staging is missing from dict
let missingLocations = [];
for (const [locKey, list] of stagingOccurrences.entries()) {
  if (!dictOccurrences.has(locKey)) {
    missingLocations.push({ locKey, items: list });
  }
}
console.log('Locations in staging missing from dict:', missingLocations.length);
if (missingLocations.length > 0) {
  console.log('Sample missing locations:', missingLocations.slice(0, 5));
}
