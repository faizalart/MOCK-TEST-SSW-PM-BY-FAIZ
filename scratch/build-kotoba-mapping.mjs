// scratch/build-kotoba-mapping.mjs
// Task T008: Full-Bank Kotoba Reference Mapping Generator

import fs from 'node:fs';
import crypto from 'node:crypto';

const DICT_PATH = 'data/sharedKotobaDictionary.json';
const STAGING_PATH = 'scratch/staging-extracted-vocab.json';
const MAPPING_OUTPUT_PATH = 'data/kotobaMapping.json';

const files = [
  'ssw-pm-kunci-ujian-1.json',
  'ssw-pm-kunci-ujian-2.json',
  'ssw-pm-all-kunci-ujian-3-to-13.json',
  'ssw-pm-bonus-soal-1-to-10-bundle.json',
  'ssw-pm-tipe2-nguyen1.json',
  'ssw-pm-special-lab-bundle.json'
];

console.log('[1] Loading Shared Kotoba Dictionary and Staging...');
const dict = JSON.parse(fs.readFileSync(DICT_PATH, 'utf8'));
const staging = JSON.parse(fs.readFileSync(STAGING_PATH, 'utf8'));

// 1. Scan all unique questions and options from canonical bundles
console.log('[2] Scanning unique questions and options from canonical files...');
const canonicalQuestions = new Map(); // questionId -> { id, prompt, options: [{ id, text }] }
const canonicalOptions = new Map(); // compositeKey -> { questionId, optionId, text }

for (const f of files) {
  if (!fs.existsSync(f)) continue;
  const data = JSON.parse(fs.readFileSync(f, 'utf8'));
  const qs = Array.isArray(data) ? data : (data.questions || []);
  for (const q of qs) {
    if (!canonicalQuestions.has(q.id)) {
      canonicalQuestions.set(q.id, {
        id: q.id,
        prompt: q.prompt,
        options: (q.options || []).map(o => ({ id: o.id, text: o.text })),
        sourceFile: f
      });
      for (const o of (q.options || [])) {
        const compKey = `${q.id}::${o.id}`;
        canonicalOptions.set(compKey, {
          questionId: q.id,
          optionId: o.id,
          compositeKey: compKey,
          sourceFile: f
        });
      }
    }
  }
}

console.log(`    Total Unique Questions scanned: ${canonicalQuestions.size}`);
console.log(`    Total Unique Options scanned:   ${canonicalOptions.size}`);

if (canonicalQuestions.size !== 1006) {
  throw new Error(`Expected 1006 unique questions, found ${canonicalQuestions.size}`);
}
if (canonicalOptions.size !== 3110) {
  throw new Error(`Expected 3110 unique options, found ${canonicalOptions.size}`);
}

// 2. Initialize mapping containers
const questionsMap = {}; // questionId -> string[] (verified kotobaIds)
const optionsMap = {};   // questionId -> { [optionId]: string[] }
const compositeKeyMap = {}; // compositeKey -> string[]

for (const qId of canonicalQuestions.keys()) {
  questionsMap[qId] = [];
  optionsMap[qId] = {};
}
for (const [compKey, optInfo] of canonicalOptions.entries()) {
  optionsMap[optInfo.questionId][optInfo.optionId] = [];
  compositeKeyMap[compKey] = [];
}

// 3. Map verified terms from sharedKotobaDictionary
console.log('[3] Mapping verified Kotoba terms to questions and options...');

const verifiedTerms = Object.values(dict.terms).filter(t => t.status === 'verified');
const unresolvedTerms = Object.values(dict.terms).filter(t => t.status === 'unresolved');
console.log(`    Verified terms:   ${verifiedTerms.length}`);
console.log(`    Unresolved terms: ${unresolvedTerms.length}`);

let mappedVerifiedOccurrences = 0;
const orphanReferences = [];
const unresolvedOccurrences = [];

// Track all 3,318 locations
const allEncounteredLocations = new Set();
const verifiedEncounteredLocations = new Set();
const unresolvedEncounteredLocations = new Set();

for (const term of Object.values(dict.terms)) {
  const isVerified = term.status === 'verified';
  for (const occ of term.occurrences) {
    const loc = occ.compositeKey || `${occ.questionId}::${occ.targetType}`;
    allEncounteredLocations.add(loc);

    if (isVerified) {
      verifiedEncounteredLocations.add(loc);
      mappedVerifiedOccurrences++;

      if (occ.targetType === 'prompt') {
        const qId = occ.questionId;
        if (!questionsMap[qId]) {
          orphanReferences.push({ termId: term.id, location: loc, reason: `Unknown questionId: ${qId}` });
        } else {
          if (!questionsMap[qId].includes(term.id)) {
            questionsMap[qId].push(term.id);
          }
        }
      } else if (occ.targetType === 'option') {
        const qId = occ.questionId;
        const optId = occ.optionId;
        const compKey = occ.compositeKey || `${qId}::${optId}`;

        if (!optionsMap[qId] || !optionsMap[qId][optId]) {
          orphanReferences.push({ termId: term.id, location: loc, reason: `Unknown option: ${compKey}` });
        } else {
          if (!optionsMap[qId][optId].includes(term.id)) {
            optionsMap[qId][optId].push(term.id);
          }
          if (!compositeKeyMap[compKey].includes(term.id)) {
            compositeKeyMap[compKey].push(term.id);
          }
        }
      }
    } else {
      // Unresolved term: strictly excluded from active mapping
      unresolvedEncounteredLocations.add(loc);
      unresolvedOccurrences.push({
        termId: term.id,
        kanji: term.kanji,
        furigana: term.furigana,
        location: loc,
        targetType: occ.targetType,
        questionId: occ.questionId,
        optionId: occ.optionId || null,
        reason: term.reviewNotes || term.auditNotes || 'Unresolved morpheme fragment or ruby typo'
      });
    }
  }
}

// 4. Sort arrays deterministically
for (const qId of Object.keys(questionsMap)) {
  questionsMap[qId].sort();
}
for (const qId of Object.keys(optionsMap)) {
  for (const optId of Object.keys(optionsMap[qId])) {
    optionsMap[qId][optId].sort();
  }
}
for (const compKey of Object.keys(compositeKeyMap)) {
  compositeKeyMap[compKey].sort();
}

// 5. Compute mapping stats
const questionsWithVerifiedKotoba = Object.keys(questionsMap).filter(qId => questionsMap[qId].length > 0).length;
const optionsWithVerifiedKotoba = Object.keys(compositeKeyMap).filter(k => compositeKeyMap[k].length > 0).length;

console.log('\n[4] Mapping Statistics:');
console.log(`    Total Questions with verified Kotoba: ${questionsWithVerifiedKotoba} / 1006`);
console.log(`    Total Options with verified Kotoba:   ${optionsWithVerifiedKotoba} / 3110`);
console.log(`    Total All Encountered Locations:      ${allEncounteredLocations.size} / 3318`);
console.log(`    Total Verified Locations:             ${verifiedEncounteredLocations.size}`);
console.log(`    Total Unresolved Occurrences Blocked: ${unresolvedOccurrences.length}`);
console.log(`    Orphan References:                    ${orphanReferences.length}`);

// 6. Assemble sidecar mapping object
const mappingData = {
  _meta: {
    datasetVersion: "1.0.0",
    generatedAt: "2026-11-12T12:00:00.000Z",
    generator: "scratch/build-kotoba-mapping.mjs",
    dictionaryArtifact: "data/sharedKotobaDictionary.json",
    dictionaryVersion: dict._meta.datasetVersion,
    dictionaryLicense: dict._meta.datasetLicense,
    datasetLicenseUrl: dict._meta.datasetLicenseUrl,
    corpusScope: {
      totalQuestions: canonicalQuestions.size,
      totalOptions: canonicalOptions.size,
      totalOccurrenceLocations: allEncounteredLocations.size,
      promptLocationsWithVerifiedKotoba: questionsWithVerifiedKotoba,
      optionLocationsWithVerifiedKotoba: optionsWithVerifiedKotoba,
      totalLocationsWithVerifiedKotoba: questionsWithVerifiedKotoba + optionsWithVerifiedKotoba
    },
    verificationGate: {
      enforcedStatus: "verified",
      excludedStatus: "unresolved",
      unresolvedTermsCount: unresolvedTerms.length,
      unresolvedOccurrencesBlocked: unresolvedOccurrences.length
    },
    architecture: {
      storageMode: "sidecar_decoupled",
      sourceFilesUntouched: true,
      compositeKeyFormat: "${questionId}::${originalOptionId}"
    }
  },
  questions: questionsMap,
  options: optionsMap,
  byCompositeKey: compositeKeyMap,
  unresolvedAuditLedger: unresolvedOccurrences
};

const outputJson = JSON.stringify(mappingData, null, 2);
fs.writeFileSync(MAPPING_OUTPUT_PATH, outputJson, 'utf8');

const outputBytes = Buffer.byteLength(outputJson, 'utf8');
const outputSha256 = crypto.createHash('sha256').update(outputJson).digest('hex');

console.log(`\n[5] Mapping file written: ${MAPPING_OUTPUT_PATH}`);
console.log(`    Size:   ${outputBytes.toLocaleString()} bytes (${(outputBytes / 1024 / 1024).toFixed(2)} MB)`);
console.log(`    SHA256: ${outputSha256}`);
