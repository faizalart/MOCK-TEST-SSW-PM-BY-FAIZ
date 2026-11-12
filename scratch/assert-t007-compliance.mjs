// scratch/assert-t007-compliance.mjs
// Task T007: Automated Verification of JMdict Metadata & Attribution Compliance

import fs from 'node:fs';
import crypto from 'node:crypto';

console.log('=== FEATURE 008 T007 METADATA & ATTRIBUTION COMPLIANCE SUITE ===\n');

const DICT_PATH = 'data/sharedKotobaDictionary.json';
const STAGING_PATH = 'scratch/staging-extracted-vocab.json';

const rawDict = fs.readFileSync(DICT_PATH, 'utf8');
const dict = JSON.parse(rawDict);
const staging = JSON.parse(fs.readFileSync(STAGING_PATH, 'utf8'));

// 1. JSON Validity & Structural Presence
console.log('Test 1: JSON validity and root fields');
if (!dict._meta || typeof dict._meta !== 'object') throw new Error('Missing _meta root object!');
if (!dict.terms || typeof dict.terms !== 'object') throw new Error('Missing terms root object!');
console.log('  PASS: Valid JSON with _meta and terms.\n');

// 2. Upstream JMdict Source Metadata
console.log('Test 2: Upstream JMdict NG source metadata');
const u = dict._meta.upstreamSource;
if (!u) throw new Error('Missing upstreamSource in _meta!');
if (u.canonicalDistributionFile !== 'JMdict_e_NG.gz') throw new Error(`Wrong artifact: ${u.canonicalDistributionFile}`);
if (u.xmlCreationDate !== '2026-11-12') throw new Error(`Wrong XML creation date: ${u.xmlCreationDate}`);
if (u.dtdVersion !== '1.10') throw new Error(`Wrong DTD version: ${u.dtdVersion}`);
if (u.verifiedSha256 !== '60cf4c4c09a8a3ec55e45fcef5e462cda242f6f228c087a6e0169ca10eaf7a84') throw new Error('Wrong SHA-256 hash!');
if (u.license !== 'CC BY-SA 4.0') throw new Error('Upstream license is not CC BY-SA 4.0!');
if (!u.officialUrl || !u.licenseUrl || !u.officialDownloadUrl) throw new Error('Missing official URLs!');
if (!u.gitCommit.startsWith('N/A')) throw new Error('Git commit must be N/A without fabrication!');
if (!u.copyrightDisclaimer || !u.copyrightDisclaimer.includes('no copyright, patent, or proprietary ownership over upstream JMdict/EDRDG entries')) {
  throw new Error('Copyright disclaimer not asserting non-ownership!');
}
console.log('  PASS: Upstream JMdict NG metadata verified without fabricated commit hash.\n');

// 3. Field-Level Provenance Separation
console.log('Test 3: Granular Field Provenance Separation');
const prov = dict._meta.provenanceSeparation;
if (!prov) throw new Error('Missing provenanceSeparation in _meta!');
const expectedFields = ['ent_seq', 'kanji', 'furigana', 'pos', 'arti', 'occurrences'];
for (const f of expectedFields) {
  if (!prov[f] || !prov[f].source || !prov[f].role) {
    throw new Error(`Missing or incomplete provenance description for field: ${f}`);
  }
}
if (!prov.ent_seq.source.includes('JMdict')) throw new Error('ent_seq source incorrect!');
if (!prov.arti.source.includes('In-House Curation')) throw new Error('arti source incorrect!');
if (!prov.occurrences.source.includes('Local SSW PM Exam Corpus')) throw new Error('occurrences source incorrect!');
console.log('  PASS: Provenance cleanly separated across all 6 fields.\n');

// 4. Third-Party JIDict Exclusion Assertion
console.log('Test 4: Strict JIDict CC BY-NC Exclusion');
const excl = dict._meta.thirdPartyExclusionStatement;
if (!excl || excl.jdictStatus !== 'STRICTLY_EXCLUDED') {
  throw new Error('JIDict exclusion statement missing or not STRICTLY_EXCLUDED!');
}
if (!excl.statement.includes('Zero Philia Space JIDict')) {
  throw new Error('JIDict rejection statement incomplete!');
}
const termsJson = JSON.stringify(dict.terms);
if (termsJson.includes('JIDict') || termsJson.includes('CC-BY-NC') || termsJson.includes('CC BY-NC')) {
  throw new Error('ILLEGAL: Found JIDict or CC-BY-NC references inside dictionary terms!');
}
console.log('  PASS: JIDict CC BY-NC strictly excluded.\n');

// 5. EDRDG Compliance, Non-Ownership & Periodic Update Procedure
console.log('Test 5: EDRDG Attribution & Periodic Update Procedure');
const comp = dict._meta.edrdgCompliance;
if (!comp) throw new Error('Missing edrdgCompliance in _meta!');
if (!comp.acknowledgement.includes('EDRDG')) throw new Error('Missing EDRDG acknowledgement!');
if (!comp.commercialDecouplingNotice.includes('Mere Aggregation')) throw new Error('Missing Mere Aggregation notice!');
if (!comp.periodicUpdateProcedure || comp.periodicUpdateProcedure.targetCadence !== 'Monthly (recommended by EDRDG licence terms for periodically updated dictionary files)') {
  throw new Error('Missing or invalid periodicUpdateProcedure!');
}
if (!comp.settingsModalAttribution || !comp.settingsModalAttribution.bodyText) {
  throw new Error('Missing settingsModalAttribution data structure for T026!');
}
console.log('  PASS: EDRDG attribution, ShareAlike, Mere Aggregation, and monthly update cadence verified.\n');

// 6. Dataset Content Integrity Check
console.log('Test 6: Vocabulary Terms and Occurrences Integrity');
const terms = Object.values(dict.terms);
if (terms.length !== 1809) throw new Error(`Expected 1809 terms, found ${terms.length}`);
const verifiedTerms = terms.filter(t => t.status === 'verified').length;
const unresolvedTerms = terms.filter(t => t.status === 'unresolved').length;
if (verifiedTerms !== 1765) throw new Error(`Expected 1765 verified terms, found ${verifiedTerms}`);
if (unresolvedTerms !== 44) throw new Error(`Expected 44 unresolved terms, found ${unresolvedTerms}`);

// Check that terms SHA-256 matches locked hash
const termsSha256 = crypto.createHash('sha256').update(JSON.stringify(dict.terms)).digest('hex');
const EXPECTED_TERMS_SHA256 = '59eca03d158e89602f44d0ef60dcca8853b7bc3b52e5cdfa2acb8b04b0917184';
if (termsSha256 !== EXPECTED_TERMS_SHA256) {
  throw new Error(`CRITICAL: Terms SHA-256 altered! Expected ${EXPECTED_TERMS_SHA256}, got ${termsSha256}`);
}
console.log(`  PASS: Terms SHA-256 is 100% invariant (${termsSha256}).\n`);

// 7. Occurrence Coverage Check
console.log('Test 7: 100.0% Occurrence Coverage (3,318 locations)');
const stagingLocs = new Set();
for (const p of staging.uniqueRubyPairs) {
  for (const o of p.occurrences) {
    const loc = o.compositeKey || `${o.questionId}::${o.targetType}`;
    stagingLocs.add(loc);
  }
}
const dictLocs = new Set();
for (const t of terms) {
  for (const o of t.occurrences) {
    const loc = o.compositeKey || `${o.questionId}::${o.targetType}`;
    dictLocs.add(loc);
  }
}
let missing = 0;
for (const loc of stagingLocs) {
  if (!dictLocs.has(loc)) missing++;
}
if (missing !== 0) throw new Error(`Missing ${missing} occurrence locations!`);
console.log(`  PASS: All 3,318 locations preserved.\n`);

console.log('================================================================');
console.log('ALL FEATURE 008 T007 METADATA & ATTRIBUTION CHECKS PASSED (7/7)!');
console.log('================================================================');
