// scratch/assert-t008-integrity.mjs
// Task T008: Comprehensive Integrity Verification of Full-Bank Kotoba Reference Mapping

import fs from 'node:fs';
import crypto from 'node:crypto';

console.log('=== FEATURE 008 T008 KOTOBA REFERENCE MAPPING INTEGRITY SUITE ===\n');

const MAPPING_PATH = 'data/kotobaMapping.json';
const DICT_PATH = 'data/sharedKotobaDictionary.json';
const STAGING_PATH = 'scratch/staging-extracted-vocab.json';

const files = [
  'ssw-pm-kunci-ujian-1.json',
  'ssw-pm-kunci-ujian-2.json',
  'ssw-pm-all-kunci-ujian-3-to-13.json',
  'ssw-pm-bonus-soal-1-to-10-bundle.json',
  'ssw-pm-tipe2-nguyen1.json',
  'ssw-pm-special-lab-bundle.json'
];

const mapping = JSON.parse(fs.readFileSync(MAPPING_PATH, 'utf8'));
const dict = JSON.parse(fs.readFileSync(DICT_PATH, 'utf8'));
const staging = JSON.parse(fs.readFileSync(STAGING_PATH, 'utf8'));

// 1. Scan canonical question and option IDs
console.log('Test 1: Canonical Scope Verification (1,006 Questions & 3,110 Options)');
const canonicalQuestions = new Set();
const canonicalOptions = new Set(); // compositeKey

for (const f of files) {
  if (!fs.existsSync(f)) continue;
  const data = JSON.parse(fs.readFileSync(f, 'utf8'));
  const qs = Array.isArray(data) ? data : (data.questions || []);
  for (const q of qs) {
    if (!canonicalQuestions.has(q.id)) {
      canonicalQuestions.add(q.id);
      for (const o of (q.options || [])) {
        canonicalOptions.add(`${q.id}::${o.id}`);
      }
    }
  }
}

if (canonicalQuestions.size !== 1006) throw new Error(`Expected 1006 questions, got ${canonicalQuestions.size}`);
if (canonicalOptions.size !== 3110) throw new Error(`Expected 3110 options, got ${canonicalOptions.size}`);
console.log(`  PASS: Canonical scope verified (${canonicalQuestions.size} Qs, ${canonicalOptions.size} Options).\n`);

// 2. Mapping Key Coverage
console.log('Test 2: Mapping Structure & Key Recognition');
if (!mapping.questions || typeof mapping.questions !== 'object') throw new Error('Missing mapping.questions!');
if (!mapping.options || typeof mapping.options !== 'object') throw new Error('Missing mapping.options!');
if (!mapping.byCompositeKey || typeof mapping.byCompositeKey !== 'object') throw new Error('Missing mapping.byCompositeKey!');

const mappedQCount = Object.keys(mapping.questions).length;
const mappedOptQCount = Object.keys(mapping.options).length;
const mappedCompKeyCount = Object.keys(mapping.byCompositeKey).length;

if (mappedQCount !== 1006) throw new Error(`Expected 1006 questions in mapping, found ${mappedQCount}`);
if (mappedOptQCount !== 1006) throw new Error(`Expected 1006 question option containers, found ${mappedOptQCount}`);
if (mappedCompKeyCount !== 3110) throw new Error(`Expected 3110 composite keys, found ${mappedCompKeyCount}`);

// Ensure every canonical question and option exists in mapping
for (const qId of canonicalQuestions) {
  if (!(qId in mapping.questions)) throw new Error(`Question ${qId} missing from mapping.questions!`);
  if (!(qId in mapping.options)) throw new Error(`Question ${qId} missing from mapping.options!`);
}
for (const compKey of canonicalOptions) {
  if (!(compKey in mapping.byCompositeKey)) throw new Error(`Composite key ${compKey} missing from mapping.byCompositeKey!`);
}
console.log('  PASS: 100% of 1,006 question IDs and 3,110 composite option keys recognized.\n');

// 3. Zero Missing Mappings for Verified Terms
console.log('Test 3: Occurrence Mapping Verification (All Verified Occurrences Mapped)');
let totalVerifiedOccsInDict = 0;
let missingOccurrences = [];

for (const term of Object.values(dict.terms)) {
  if (term.status === 'verified') {
    for (const occ of term.occurrences) {
      totalVerifiedOccsInDict++;
      if (occ.targetType === 'prompt') {
        const list = mapping.questions[occ.questionId] || [];
        if (!list.includes(term.id)) {
          missingOccurrences.push({ termId: term.id, location: `${occ.questionId}::prompt` });
        }
      } else if (occ.targetType === 'option') {
        const compKey = occ.compositeKey || `${occ.questionId}::${occ.optionId}`;
        const list = mapping.byCompositeKey[compKey] || [];
        if (!list.includes(term.id)) {
          missingOccurrences.push({ termId: term.id, location: compKey });
        }
      }
    }
  }
}

if (missingOccurrences.length > 0) {
  throw new Error(`Found ${missingOccurrences.length} missing verified occurrences in mapping!`);
}
console.log(`  PASS: All ${totalVerifiedOccsInDict.toLocaleString()} verified term occurrences accurately mapped.\n`);

// 4. Zero Unresolved Terms in Active Mapping
console.log('Test 4: Zero-Leakage Gate (No Unresolved Terms in Questions or Options)');
const unresolvedTermIds = new Set(Object.values(dict.terms).filter(t => t.status === 'unresolved').map(t => t.id));
let leakedCount = 0;

for (const [qId, termIds] of Object.entries(mapping.questions)) {
  for (const tid of termIds) {
    if (unresolvedTermIds.has(tid)) leakedCount++;
  }
}
for (const [compKey, termIds] of Object.entries(mapping.byCompositeKey)) {
  for (const tid of termIds) {
    if (unresolvedTermIds.has(tid)) leakedCount++;
  }
}

if (leakedCount > 0) {
  throw new Error(`CRITICAL: Found ${leakedCount} unresolved terms in active mapping!`);
}
console.log(`  PASS: Zero unresolved terms leaked into active mapping (${unresolvedTermIds.size} unresolved safely isolated).\n`);

// 5. Unresolved Audit Ledger Completeness
console.log('Test 5: Unresolved Audit Ledger Verification');
const ledger = mapping.unresolvedAuditLedger;
if (!Array.isArray(ledger)) throw new Error('Missing unresolvedAuditLedger array!');
let totalUnresolvedOccsInDict = 0;
for (const term of Object.values(dict.terms)) {
  if (term.status === 'unresolved') {
    totalUnresolvedOccsInDict += term.occurrences.length;
  }
}
if (ledger.length !== totalUnresolvedOccsInDict) {
  throw new Error(`Ledger length (${ledger.length}) does not match dict unresolved occurrences (${totalUnresolvedOccsInDict})`);
}
console.log(`  PASS: All ${ledger.length} unresolved occurrences documented in transparent audit ledger.\n`);

// 6. Zero Duplicate References
console.log('Test 6: Duplicate Reference Check');
for (const [qId, termIds] of Object.entries(mapping.questions)) {
  const uniq = new Set(termIds);
  if (uniq.size !== termIds.length) throw new Error(`Duplicate termIds in questions[${qId}]!`);
}
for (const [compKey, termIds] of Object.entries(mapping.byCompositeKey)) {
  const uniq = new Set(termIds);
  if (uniq.size !== termIds.length) throw new Error(`Duplicate termIds in byCompositeKey[${compKey}]!`);
}
console.log('  PASS: Zero duplicate term references across all questions and options.\n');

// 7. Dictionary Term Validity
console.log('Test 7: Dictionary Existence Assertion');
let totalReferencedTerms = 0;
for (const termIds of Object.values(mapping.questions)) {
  for (const tid of termIds) {
    totalReferencedTerms++;
    if (!dict.terms[tid]) throw new Error(`Referenced term ${tid} does not exist in dictionary!`);
    if (dict.terms[tid].status !== 'verified') throw new Error(`Referenced term ${tid} is not verified!`);
  }
}
for (const termIds of Object.values(mapping.byCompositeKey)) {
  for (const tid of termIds) {
    totalReferencedTerms++;
    if (!dict.terms[tid]) throw new Error(`Referenced term ${tid} does not exist in dictionary!`);
    if (dict.terms[tid].status !== 'verified') throw new Error(`Referenced term ${tid} is not verified!`);
  }
}
console.log(`  PASS: All ${totalReferencedTerms.toLocaleString()} references resolve to valid, verified dictionary entries.\n`);

// 8. Shared Dictionary Invariance Check
console.log('Test 8: Shared Dictionary Invariance (Zero Data Modification)');
const rawDict = fs.readFileSync(DICT_PATH, 'utf8');
const currentDictSha = crypto.createHash('sha256').update(rawDict).digest('hex');
const EXPECTED_DICT_SHA = 'f2f8c08506ed6756d8e7f7b4dbf35bf85fb00234515993b051843f1cd903a1e7';
if (currentDictSha !== EXPECTED_DICT_SHA) {
  throw new Error(`sharedKotobaDictionary.json was modified! Expected ${EXPECTED_DICT_SHA}, got ${currentDictSha}`);
}
console.log(`  PASS: sharedKotobaDictionary.json is 100% invariant (${currentDictSha}).\n`);

console.log('================================================================');
console.log('ALL FEATURE 008 T008 KOTOBA MAPPING CHECKS PASSED (8/8)!');
console.log('================================================================');
