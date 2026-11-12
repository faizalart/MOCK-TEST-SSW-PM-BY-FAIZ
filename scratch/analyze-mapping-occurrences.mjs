// scratch/analyze-mapping-occurrences.mjs
import fs from 'node:fs';

const dict = JSON.parse(fs.readFileSync('data/sharedKotobaDictionary.json', 'utf8'));

// Build mapping from dict occurrences
const promptMapping = new Map(); // questionId -> array of termIds
const optionMapping = new Map(); // compositeKey -> array of termIds

const promptVerified = new Map();
const optionVerified = new Map();

const promptUnresolved = new Map();
const optionUnresolved = new Map();

for (const term of Object.values(dict.terms)) {
  const isVerified = term.status === 'verified';
  for (const occ of term.occurrences) {
    if (occ.targetType === 'prompt') {
      const qId = occ.questionId;
      if (!promptMapping.has(qId)) promptMapping.set(qId, new Set());
      promptMapping.get(qId).add(term.id);

      if (isVerified) {
        if (!promptVerified.has(qId)) promptVerified.set(qId, new Set());
        promptVerified.get(qId).add(term.id);
      } else {
        if (!promptUnresolved.has(qId)) promptUnresolved.set(qId, new Set());
        promptUnresolved.get(qId).add(term.id);
      }
    } else if (occ.targetType === 'option') {
      const compKey = occ.compositeKey || `${occ.questionId}::${occ.optionId}`;
      if (!optionMapping.has(compKey)) optionMapping.set(compKey, new Set());
      optionMapping.get(compKey).add(term.id);

      if (isVerified) {
        if (!optionVerified.has(compKey)) optionVerified.set(compKey, new Set());
        optionVerified.get(compKey).add(term.id);
      } else {
        if (!optionUnresolved.has(compKey)) optionUnresolved.set(compKey, new Set());
        optionUnresolved.get(compKey).add(term.id);
      }
    }
  }
}

console.log('Total prompt locations in dict:', promptMapping.size);
console.log('Total option locations in dict:', optionMapping.size);
console.log('Total locations in dict:', promptMapping.size + optionMapping.size);

console.log('\nVerified prompt locations:', promptVerified.size);
console.log('Verified option locations:', optionVerified.size);
console.log('Verified total locations:', promptVerified.size + optionVerified.size);

console.log('\nUnresolved-only prompt locations:', Array.from(promptMapping.keys()).filter(k => !promptVerified.has(k)));
console.log('Unresolved-only option locations:', Array.from(optionMapping.keys()).filter(k => !optionVerified.has(k)));
