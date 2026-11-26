import fs from 'node:fs';
import { isValidHiraganaReading, hasKanji } from '../../scripts/lib/kotoba-pipeline-utils.mjs';

const d = JSON.parse(fs.readFileSync('data/sharedKotobaDictionary.json', 'utf8'));
const masterSampleHira = Object.entries(d.terms)
  .filter(([id, e]) => e && !id.startsWith('kb-otaff51-') && !hasKanji(e.kanji || '') && e.status === 'verified')
  .slice(0, 25);
console.log('Sample non-kanji verified terms in existing master:');
for (const [id, x] of masterSampleHira) {
  console.log(`  ${id} | ${x.kanji} | furi="${x.furigana}" | ${x.unitType} | ${x.arti}`);
}

console.log('\nImage questions summary across P01-P10:');
for (let p = 1; p <= 10; p++) {
  const pkg = JSON.parse(fs.readFileSync(`data/latsol-otaff-pm51-${String(p).padStart(2, '0')}.json`, 'utf8'));
  for (const q of pkg.questions) {
    const hasQImg = Boolean(q.questionImage);
    const optImgs = q.options.filter(o => o.optionImage).map(o => o.id + ':' + o.optionImage);
    if (hasQImg || optImgs.length > 0) {
      const plain = q.prompt.replace(/<rt>[^<]*<\/rt>/g, '').replace(/<[^>]+>/g, '');
      console.log(`${q.id} | qImg=${q.questionImage || '-'} | optImgs=${optImgs.length} | ${plain.slice(0, 75)}`);
    }
  }
}
