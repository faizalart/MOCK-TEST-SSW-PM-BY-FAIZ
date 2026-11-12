import fs from 'node:fs';

const staging = JSON.parse(fs.readFileSync('scratch/staging-extracted-vocab.json', 'utf8'));
const dict = JSON.parse(fs.readFileSync('data/sharedKotobaDictionary.json', 'utf8'));

// Build lookup of dict terms
// Map of termId -> term
const termsById = new Map();
for (const term of Object.values(dict.terms)) {
  termsById.set(term.id, term);
}

// Check each staging pair
let droppedOccCount = 0;
let pairsWithDroppedOcc = [];

for (const pair of staging.uniqueRubyPairs) {
  let missingForThisPair = [];
  for (const sOcc of pair.occurrences) {
    const sLoc = sOcc.compositeKey || `${sOcc.questionId}::prompt`;
    // Find if this occurrence is recorded in dict under a term matching this kanji & furigana
    let found = false;
    for (const term of termsById.values()) {
      if (term.kanji === pair.kanji && term.furigana === pair.furigana) {
        for (const dOcc of term.occurrences) {
          const dLoc = dOcc.compositeKey || `${dOcc.questionId}::prompt`;
          if (dLoc === sLoc) {
            found = true;
            break;
          }
        }
      }
      if (found) break;
    }
    if (!found) {
      missingForThisPair.push({ sLoc, sOcc });
    }
  }

  if (missingForThisPair.length > 0) {
    pairsWithDroppedOcc.push({
      pairId: pair.id,
      kanji: pair.kanji,
      furigana: pair.furigana,
      totalStaging: pair.occurrences.length,
      missingCount: missingForThisPair.length,
      missing: missingForThisPair
    });
    droppedOccCount += missingForThisPair.length;
  }
}

console.log('Total pairs with dropped occurrences:', pairsWithDroppedOcc.length);
console.log('Total dropped occurrences count:', droppedOccCount);
console.log('\nBreakdown of dropped pairs:');
for (const p of pairsWithDroppedOcc) {
  console.log(`- ${p.pairId} [${p.kanji}::${p.furigana}]: ${p.missingCount} of ${p.totalStaging} occurrences dropped!`);
  for (const m of p.missing.slice(0, 3)) {
    console.log(`    loc: ${m.sLoc} (${m.sOcc.sourceFile})`);
  }
}
