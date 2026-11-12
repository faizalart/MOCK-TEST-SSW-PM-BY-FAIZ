import fs from 'node:fs';

const staging = JSON.parse(fs.readFileSync('scratch/staging-extracted-vocab.json', 'utf8'));
const dict = JSON.parse(fs.readFileSync('data/sharedKotobaDictionary.json', 'utf8'));

const collisionPairs = [
  ['ext-0154', 'ext-0155'],
  ['ext-0308', 'ext-0951'],
  ['ext-0544', 'ext-0545'],
  ['ext-0777', 'ext-0917'],
  ['ext-0783', 'ext-0784'],
  ['ext-0969', 'ext-0970'],
  ['ext-1028', 'ext-1029'],
  ['ext-1044', 'ext-1045'],
  ['ext-1691', 'ext-1692']
];

for (const [id1, id2] of collisionPairs) {
  const p1 = staging.uniqueRubyPairs.find(p => p.id === id1);
  const p2 = staging.uniqueRubyPairs.find(p => p.id === id2);
  console.log(`\nCollision: ${p1.id} [${p1.kanji}::${p1.furigana}] vs ${p2.id} [${p2.kanji}::${p2.furigana}]`);
  
  // Find which one is in dict
  const matchingTerms = Object.values(dict.terms).filter(t => 
    (t.kanji === p1.kanji && t.furigana === p1.furigana) ||
    (t.kanji === p2.kanji && t.furigana === p2.furigana)
  );
  for (const t of matchingTerms) {
    console.log(`  Found in dict: ${t.id} [${t.kanji}::${t.furigana}] status=${t.status} occCount=${t.occurrences.length}`);
  }
}
