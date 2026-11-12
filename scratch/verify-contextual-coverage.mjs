import fs from 'node:fs';
import { FRAGMENT_KEYS, STEMS_DEFINITIONS } from './lexicon-stems-ambiguous.mjs';

const contextualKeys = JSON.parse(fs.readFileSync('scratch/group-contextual.json', 'utf8'));

let coveredByStems = 0;
let coveredByFrag = 0;
let missing = [];

for (const k of contextualKeys) {
  if (FRAGMENT_KEYS.has(k)) {
    coveredByFrag++;
  } else if (STEMS_DEFINITIONS[k]) {
    coveredByStems++;
  } else {
    missing.push(k);
  }
}

console.log('Contextual verification:');
console.log('Total items in list:', contextualKeys.length);
console.log('Covered by stems:', coveredByStems);
console.log('Covered by fragments:', coveredByFrag);
console.log('Missing items:', missing.length);
if (missing.length > 0) {
  console.log('Missing contextual:', missing);
}
