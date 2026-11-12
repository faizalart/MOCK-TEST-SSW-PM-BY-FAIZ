import fs from 'node:fs';
import { AMBIGUOUS_DEFINITIONS, FRAGMENT_KEYS, STEMS_DEFINITIONS } from './lexicon-stems-ambiguous.mjs';
import { UNMATCHED_COMPOUNDS, UNMATCHED_FRAGMENTS } from './lexicon-unmatched-compounds.mjs';

const ambiguousKeys = JSON.parse(fs.readFileSync('scratch/group-ambiguous.json', 'utf8'));
const contextualKeys = JSON.parse(fs.readFileSync('scratch/group-contextual.json', 'utf8'));
const unmatchedKeys = JSON.parse(fs.readFileSync('scratch/group-unmatched.json', 'utf8'));

console.log('--- Verification of 3 Non-Matched Groups ---');
console.log('Ambiguous covered:', ambiguousKeys.filter(k => AMBIGUOUS_DEFINITIONS[k]).length, '/', ambiguousKeys.length);

const ctxCovered = contextualKeys.filter(k => FRAGMENT_KEYS.has(k) || STEMS_DEFINITIONS[k]);
console.log('Contextual covered:', ctxCovered.length, '/', contextualKeys.length);

const unmCovered = unmatchedKeys.filter(k => FRAGMENT_KEYS.has(k) || STEMS_DEFINITIONS[k] || UNMATCHED_FRAGMENTS.has(k) || UNMATCHED_COMPOUNDS[k]);
console.log('Unmatched covered:', unmCovered.length, '/', unmatchedKeys.length);
