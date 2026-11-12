import fs from 'node:fs';
import { FRAGMENT_KEYS, STEMS_DEFINITIONS } from './lexicon-stems-ambiguous.mjs';

const unmatchedKeys = JSON.parse(fs.readFileSync('scratch/group-unmatched.json', 'utf8'));

let coveredByStems = 0;
let coveredByFrag = 0;
let remaining = [];

for (const k of unmatchedKeys) {
  if (FRAGMENT_KEYS.has(k)) {
    coveredByFrag++;
  } else if (STEMS_DEFINITIONS[k]) {
    coveredByStems++;
  } else {
    remaining.push(k);
  }
}

console.log('Total unmatched:', unmatchedKeys.length);
console.log('Covered by stems:', coveredByStems);
console.log('Covered by fragments:', coveredByFrag);
console.log('Remaining to cover in unmatched:', remaining.length);
fs.writeFileSync('scratch/unmatched-remaining.json', JSON.stringify(remaining, null, 2));
