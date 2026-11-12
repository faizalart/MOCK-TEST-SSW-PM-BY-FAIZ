import fs from 'node:fs';

const dict = JSON.parse(fs.readFileSync('data/sharedKotobaDictionary.json', 'utf8'));

// Find the 6 ambiguous entries
const ambiguousTerms = Object.values(dict.terms).filter(t => t.matchStatus === 'ambiguous');
console.log(`Found ${ambiguousTerms.length} ambiguous terms:`);
for (const t of ambiguousTerms) {
  console.log(`\nID: ${t.id} [${t.kanji}::${t.furigana}]`);
  console.log(`  chosen ent_seq: ${t.ent_seq}`);
  console.log(`  candidateEntSeqs:`, t.candidateEntSeqs);
  console.log(`  status: ${t.status}, domain: ${t.domainCategory}, type: ${t.entryType}`);
  console.log(`  arti: "${t.arti}"`);
  console.log(`  occurrences: ${t.occurrences.length}`);
}
