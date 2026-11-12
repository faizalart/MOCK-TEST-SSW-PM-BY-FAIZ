import fs from 'node:fs';

const staging = JSON.parse(fs.readFileSync('scratch/staging-extracted-vocab.json', 'utf8'));
const dict = JSON.parse(fs.readFileSync('data/sharedKotobaDictionary.json', 'utf8'));

const missingIds = [
  'ext-0155', 'ext-0308', 'ext-0545', 'ext-0777', 'ext-0784',
  'ext-0970', 'ext-1028', 'ext-1045', 'ext-1692'
];

// We need to know what ent_seq these 9 pairs matched in JMdict
// Let's check JMdict or search in dict.terms for terms with the same kanji or related kanji
for (const id of missingIds) {
  const p = staging.uniqueRubyPairs.find(x => x.id === id);
  console.log(`\nMissing pair: ${p.id} [${p.kanji}::${p.furigana}], occurrences: ${p.occurrences.length}`);
  
  // Find terms in dict that have same kanji OR same reading
  const sameKanji = Object.values(dict.terms).filter(t => t.kanji === p.kanji);
  const sameReading = Object.values(dict.terms).filter(t => t.furigana === p.furigana);
  
  if (sameKanji.length > 0) {
    console.log(`  Matching kanji in dict:`, sameKanji.map(t => `${t.id} [${t.kanji}::${t.furigana}] ent_seq=${t.ent_seq} occ=${t.occurrences.length}`));
  }
  if (sameReading.length > 0) {
    console.log(`  Matching reading in dict:`, sameReading.map(t => `${t.id} [${t.kanji}::${t.furigana}] ent_seq=${t.ent_seq} occ=${t.occurrences.length}`));
  }
}
