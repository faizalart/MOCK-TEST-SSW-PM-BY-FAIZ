import fs from 'node:fs';

const dict = JSON.parse(fs.readFileSync('data/sharedKotobaDictionary.json', 'utf8'));
const terms = Object.values(dict.terms);

// Separate into categories
const ambiguous = terms.filter(t => t.matchStatus === 'ambiguous');
const contextual = terms.filter(t => t.matchStatus === 'contextual_review');
const unmatched = terms.filter(t => t.matchStatus === 'unmatched');
const matched = terms.filter(t => t.matchStatus === 'matched');

console.log({
  total: terms.length,
  ambiguous: ambiguous.length,
  contextual: contextual.length,
  unmatched: unmatched.length,
  matched: matched.length
});

// Let's dump the keys of each group to scratch for reference
fs.writeFileSync('scratch/group-ambiguous.json', JSON.stringify(ambiguous.map(t => `${t.kanji}::${t.furigana}`), null, 2));
fs.writeFileSync('scratch/group-contextual.json', JSON.stringify(contextual.map(t => `${t.kanji}::${t.furigana}`), null, 2));
fs.writeFileSync('scratch/group-unmatched.json', JSON.stringify(unmatched.map(t => `${t.kanji}::${t.furigana}`), null, 2));
fs.writeFileSync('scratch/group-matched.json', JSON.stringify(matched.map(t => `${t.kanji}::${t.furigana}`), null, 2));
console.log('Group keys dumped to scratch/group-*.json');
