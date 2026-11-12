// scratch/lexicon-matched-terms.mjs
// Aggregates Part 1 (560) and Part 2 (563) matched terms into 1,123 total terms

import { MATCHED_PART1 } from './lexicon-matched-part1.mjs';
import { MATCHED_PART2 } from './lexicon-matched-part2.mjs';

export const MATCHED_TERMS = {
  ...MATCHED_PART1,
  ...MATCHED_PART2
};
