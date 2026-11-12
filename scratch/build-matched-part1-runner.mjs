import fs from 'node:fs';

const p1 = JSON.parse(fs.readFileSync('scratch/matched-part1.json', 'utf8'));

// We create rich in-house definitions for all 560 terms in Part 1
// Let's create the mapping dictionary
const dict = {};

// We can define a comprehensive domain dictionary map
import { P1_DEFINITIONS } from './p1-definitions-data.mjs';

for (const key of p1) {
  if (P1_DEFINITIONS[key]) {
    dict[key] = P1_DEFINITIONS[key];
  } else {
    console.error('Missing in P1:', key);
  }
}

const fileContent = `// scratch/lexicon-matched-part1.mjs
// Curated domain definitions for 560 matched terms (Part 1)

export const MATCHED_PART1 = ${JSON.stringify(dict, null, 2)};
`;

fs.writeFileSync('scratch/lexicon-matched-part1.mjs', fileContent, 'utf8');
console.log('Saved scratch/lexicon-matched-part1.mjs with', Object.keys(dict).length, 'terms.');
