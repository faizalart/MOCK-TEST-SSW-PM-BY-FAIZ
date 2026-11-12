import fs from 'node:fs';
import { AMBIGUOUS_DEFINITIONS, FRAGMENT_KEYS, STEMS_DEFINITIONS } from './lexicon-stems-ambiguous.mjs';
import { UNMATCHED_COMPOUNDS, UNMATCHED_FRAGMENTS } from './lexicon-unmatched-compounds.mjs';
import { MATCHED_TERMS } from './lexicon-matched-terms.mjs';

const dict = JSON.parse(fs.readFileSync('data/sharedKotobaDictionary.json', 'utf8'));
const terms = Object.values(dict.terms);

console.log('Total dictionary terms to verify:', terms.length);

let missing = [];
let verifiedCount = 0;
let unresolvedCount = 0;

const byDomain = {};
const byType = {};
const byMatch = {};

for (const t of terms) {
  const key = `${t.kanji}::${t.furigana}`;
  byMatch[t.matchStatus] = (byMatch[t.matchStatus] || 0) + 1;

  let def = null;
  let isFragment = false;

  if (AMBIGUOUS_DEFINITIONS[key]) {
    def = AMBIGUOUS_DEFINITIONS[key];
  } else if (FRAGMENT_KEYS.has(key) || UNMATCHED_FRAGMENTS.has(key)) {
    isFragment = true;
  } else if (STEMS_DEFINITIONS[key]) {
    def = STEMS_DEFINITIONS[key];
  } else if (UNMATCHED_COMPOUNDS[key]) {
    def = UNMATCHED_COMPOUNDS[key];
  } else if (MATCHED_TERMS[key]) {
    def = MATCHED_TERMS[key];
  } else {
    missing.push(key);
    continue;
  }

  if (isFragment) {
    unresolvedCount++;
    byType['morpheme_fragment'] = (byType['morpheme_fragment'] || 0) + 1;
  } else {
    verifiedCount++;
    const domain = def.domainCategory || def.domain || 'General';
    const type = def.entryType || def.type || 'standalone_term';
    byDomain[domain] = (byDomain[domain] || 0) + 1;
    byType[type] = (byType[type] || 0) + 1;
  }
}

console.log('--- VERIFICATION RESULTS ---');
console.log('Missing items:', missing.length);
if (missing.length > 0) {
  console.log('Sample missing:', missing.slice(0, 10));
}
console.log('Verified terms:', verifiedCount);
console.log('Unresolved terms (fragments/broken):', unresolvedCount);
console.log('Total processed:', verifiedCount + unresolvedCount);
console.log('By Match Status:', byMatch);
console.log('By Domain Category (Verified):', byDomain);
console.log('By Entry Type:', byType);

const technicalCount = (byDomain['HACCP'] || 0) + (byDomain['Hygiene'] || 0) + (byDomain['Quality'] || 0) + (byDomain['Machinery'] || 0) + (byDomain['Safety'] || 0) + (byDomain['5S'] || 0);
const generalCount = byDomain['General'] || 0;
console.log('SSW PM Technical Terms:', technicalCount, `(${(technicalCount / verifiedCount * 100).toFixed(1)}%)`);
console.log('General Vocabulary:', generalCount, `(${(generalCount / verifiedCount * 100).toFixed(1)}%)`);
