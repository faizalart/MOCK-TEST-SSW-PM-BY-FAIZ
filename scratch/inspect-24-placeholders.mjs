import fs from 'node:fs';

const dict = JSON.parse(fs.readFileSync('data/sharedKotobaDictionary.json', 'utf8'));
const staging = JSON.parse(fs.readFileSync('scratch/staging-extracted-vocab.json', 'utf8'));

const targetIds = [
  'kb-2229780', 'kb-1215240', 'kb-1260670', 'kb-2513560', 'kb-1269730',
  'kb-1578700', 'kb-2735910', 'kb-1322990', 'kb-2273780', 'kb-2088240',
  'kb-2839018', 'kb-2647200', 'kb-2406710', 'kb-2248980', 'kb-2812900',
  'kb-2411640', 'kb-1461140', 'kb-2097700', 'kb-2084840', 'kb-1506890',
  'kb-1516920', 'kb-2859250', 'kb-1584660', 'kb-1568950'
];

for (const id of targetIds) {
  const t = dict.terms[id];
  console.log(`\n========================================`);
  console.log(`${id}: ${t.kanji}::${t.furigana}`);
  console.log(`Occurrences (${t.occurrences.length}):`);
  for (const occ of t.occurrences.slice(0, 3)) {
    console.log(`  - ${occ.compositeKey || occ.questionId} (${occ.sourceFile})`);
  }
}
