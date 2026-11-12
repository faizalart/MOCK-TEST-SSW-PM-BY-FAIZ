// scratch/reconcile-final-status.mjs
import fs from 'node:fs';

const dictRaw = fs.readFileSync('data/sharedKotobaDictionary.json', 'utf8');
const dict = JSON.parse(dictRaw);
const stagingRaw = fs.readFileSync('scratch/staging-extracted-vocab.json', 'utf8');
const staging = JSON.parse(stagingRaw);

const terms = Object.values(dict.terms);

console.log('=== ACTUAL DATA RECONCILIATION ===');
console.log(`Total Terms in dict.terms: ${terms.length}`);

// 1. matchStatus counts
const matchStatusCounts = {};
for (const t of terms) {
  const ms = t.matchStatus || 'unknown';
  matchStatusCounts[ms] = (matchStatusCounts[ms] || 0) + 1;
}
console.log('\nmatchStatus breakdown:', matchStatusCounts);

// 2. furiganaStatus counts
const furiganaStatusCounts = {};
for (const t of terms) {
  const fs = t.furiganaStatus || 'unknown';
  furiganaStatusCounts[fs] = (furiganaStatusCounts[fs] || 0) + 1;
}
console.log('\nfuriganaStatus breakdown:', furiganaStatusCounts);

// 3. meaningStatus counts
const meaningStatusCounts = {};
for (const t of terms) {
  const ms = t.meaningStatus || 'unknown';
  meaningStatusCounts[ms] = (meaningStatusCounts[ms] || 0) + 1;
}
console.log('\nmeaningStatus breakdown:', meaningStatusCounts);

// 4. status counts
const statusCounts = {};
for (const t of terms) {
  const s = t.status || 'unknown';
  statusCounts[s] = (statusCounts[s] || 0) + 1;
}
console.log('\nstatus breakdown:', statusCounts);

// 5. Cross-tabulation: matchStatus x status
const crossTab = {};
for (const ms of Object.keys(matchStatusCounts)) {
  crossTab[ms] = { verified: 0, unresolved: 0, total: 0 };
}
for (const t of terms) {
  const ms = t.matchStatus || 'unknown';
  const st = t.status || 'unknown';
  if (!crossTab[ms]) crossTab[ms] = { verified: 0, unresolved: 0, total: 0 };
  crossTab[ms][st] = (crossTab[ms][st] || 0) + 1;
  crossTab[ms].total++;
}
console.log('\nCross-tabulation (matchStatus x status):');
console.table(crossTab);

// 6. Cross-tabulation: matchStatus x furiganaStatus x meaningStatus
const detailedCross = {};
for (const t of terms) {
  const key = `${t.matchStatus} | f:${t.furiganaStatus} | m:${t.meaningStatus} | s:${t.status}`;
  detailedCross[key] = (detailedCross[key] || 0) + 1;
}
console.log('\nDetailed status combinations:');
console.log(detailedCross);

// 7. Verify the 44 unresolved terms
const unresolvedTerms = terms.filter(t => t.status === 'unresolved');
console.log(`\nUnresolved terms count: ${unresolvedTerms.length}`);

// Check reasons
const unresolvedReasons = unresolvedTerms.map(t => ({
  id: t.id,
  kanji: t.kanji,
  furigana: t.furigana,
  matchStatus: t.matchStatus,
  furiganaStatus: t.furiganaStatus,
  meaningStatus: t.meaningStatus,
  entryType: t.entryType,
  reviewNotes: t.reviewNotes || t.auditNotes || '-'
}));

// 8. Verify the 3 specific corrections: 流, 繰, 後手
console.log('\n--- Verifying 流, 繰, 後手 ---');
const tRyuu = dict.terms['kb-ext-1758-e6b5813a3a'];
const tNaga = dict.terms['kb-ext-1757-e6b5813a3a'];
console.log('流::りゅう -> status:', tRyuu.status, 'arti:', `"${tRyuu.arti}"`, 'occCount:', tRyuu.occurrences.length);
console.log('流::なが   -> status:', tNaga.status, 'occCount:', tNaga.occurrences.length, 'has kunci1-q032:', tNaga.occurrences.some(o => o.questionId === 'kunci1-q032'));

const tKae = dict.terms['kb-ext-0426-e7b9b03a3a'];
const tKu = dict.terms['kb-ext-0427-e7b9b03a3a'];
console.log('繰::かえ   -> status:', tKae.status, 'arti:', `"${tKae.arti}"`, 'occCount:', tKae.occurrences.length);
console.log('繰::く     -> status:', tKu.status, 'occCount:', tKu.occurrences.length, 'has kunci-ujian-2-q014:', tKu.occurrences.some(o => o.questionId === 'kunci-ujian-2-q014'));

const tGote = dict.terms['kb-1269730'];
console.log('後手::ごて -> status:', tGote.status, 'arti:', `"${tGote.arti}"`, 'occCount:', tGote.occurrences.length);

// 9. Verify 3,318 occurrences
console.log('\n--- Verifying 3,318 Occurrence Locations ---');
const stagingOccMap = new Set();
for (const p of staging.uniqueRubyPairs) {
  for (const o of p.occurrences) {
    const loc = o.compositeKey || `${o.questionId}::${o.targetType}`;
    stagingOccMap.add(loc);
  }
}

const dictOccMap = new Set();
for (const t of terms) {
  for (const o of t.occurrences) {
    const loc = o.compositeKey || `${o.questionId}::${o.targetType}`;
    dictOccMap.add(loc);
  }
}

let missing = [];
for (const loc of stagingOccMap) {
  if (!dictOccMap.has(loc)) missing.push(loc);
}
console.log(`Staging unique locations: ${stagingOccMap.size}`);
console.log(`Dict unique locations:    ${dictOccMap.size}`);
console.log(`Missing locations:        ${missing.length}`);
