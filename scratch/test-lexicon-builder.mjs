import fs from 'node:fs';

const dict = JSON.parse(fs.readFileSync('data/sharedKotobaDictionary.json', 'utf8'));
const terms = Object.values(dict.terms);

console.log('Total terms to curate:', terms.length);

// Group terms by matchStatus
const groups = {
  matched: terms.filter(t => t.matchStatus === 'matched'),
  ambiguous: terms.filter(t => t.matchStatus === 'ambiguous'),
  contextual_review: terms.filter(t => t.matchStatus === 'contextual_review'),
  unmatched: terms.filter(t => t.matchStatus === 'unmatched')
};

console.log('Group sizes:', {
  matched: groups.matched.length,
  ambiguous: groups.ambiguous.length,
  contextual_review: groups.contextual_review.length,
  unmatched: groups.unmatched.length
});
