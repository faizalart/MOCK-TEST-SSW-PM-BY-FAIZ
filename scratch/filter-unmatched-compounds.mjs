import fs from 'node:fs';

const rem = JSON.parse(fs.readFileSync('scratch/unmatched-sorted.json', 'utf8'));

const fragments = [];
const valid = [];

for (const item of rem) {
  const [kanji, furigana] = item.split('::');
  // If ends in single verb tail kanji like 書, 守, 洗, 座, 触, 入, etc. where okurigana was cut off
  if (kanji.endsWith('書') && furigana.endsWith('か') && kanji !== '作業手順書' && kanji !== '規格書') {
    fragments.push(item);
  } else if (kanji.endsWith('守') && furigana.endsWith('まも')) {
    fragments.push(item);
  } else if (kanji.endsWith('洗') && furigana.endsWith('あら')) {
    fragments.push(item);
  } else if (kanji.endsWith('座') && furigana.endsWith('すわ')) {
    fragments.push(item);
  } else if (kanji.endsWith('触') && furigana.endsWith('ふ')) {
    fragments.push(item);
  } else if (kanji.endsWith('入') && furigana.endsWith('はい') && kanji !== '受入') {
    fragments.push(item);
  } else if (kanji.endsWith('作') && furigana.endsWith('さく') && kanji.length <= 5 && !kanji.includes('作業')) {
    fragments.push(item);
  } else if (furigana.endsWith('ー')) {
    // Typo in furigana e.g. 安全的危害要因ー
    fragments.push(item);
  } else {
    valid.push(item);
  }
}

console.log('Unmatched categorized:', {
  fragments: fragments.length,
  valid: valid.length,
  total: rem.length
});
console.log('Fragments identified:', fragments);
