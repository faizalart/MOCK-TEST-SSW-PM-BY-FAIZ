import fs from 'node:fs';

const staging = JSON.parse(fs.readFileSync('scratch/staging-extracted-vocab.json', 'utf8'));

const targets = [
  'ext-0155', 'ext-0308', 'ext-0545', 'ext-0777', 'ext-0784',
  'ext-0970', 'ext-1028', 'ext-1045', 'ext-1692'
];

for (const id of targets) {
  const p = staging.uniqueRubyPairs.find(x => x.id === id);
  console.log(`Pair: ${p.id} kanji=${p.kanji} furigana=${p.furigana} occ=${p.occurrences.length}`);
}
