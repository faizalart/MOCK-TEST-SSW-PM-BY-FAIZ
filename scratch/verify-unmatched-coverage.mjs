import fs from 'node:fs';
import { UNMATCHED_COMPOUNDS, UNMATCHED_FRAGMENTS } from './lexicon-unmatched-compounds.mjs';

const rem = JSON.parse(fs.readFileSync('scratch/unmatched-sorted.json', 'utf8'));

let missing = [];
for (const item of rem) {
  if (!UNMATCHED_FRAGMENTS.has(item) && !UNMATCHED_COMPOUNDS[item]) {
    missing.push(item);
  }
}

console.log('Unmatched verification:');
console.log('Total items in list:', rem.length);
console.log('Missing items:', missing.length);
if (missing.length > 0) {
  console.log('Missing:', missing);
}
