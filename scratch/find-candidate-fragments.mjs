import fs from 'node:fs';

const dict = JSON.parse(fs.readFileSync('data/sharedKotobaDictionary.json', 'utf8'));
const terms = Object.values(dict.terms);

// Find candidate broken fragments
const candidateFragments = [];

for (const t of terms) {
  const { kanji, furigana } = t;
  
  // Single kana as kanji
  if (/^[ぁ-んァ-ヶ]$/.test(kanji)) {
    candidateFragments.push({ reason: 'single_kana', kanji, furigana, occ: t.occurrencesCount });
  }
  // Contains punctuation or digits at start/end
  else if (/^[0-9０-９・]/.test(kanji) || /[0-9０-９・]$/.test(kanji)) {
    candidateFragments.push({ reason: 'digit_punct', kanji, furigana, occ: t.occurrencesCount });
  }
  // Broken ruby where furigana is clearly incomplete (e.g. 1 char for long katakana)
  else if (kanji.length >= 4 && furigana.length === 1 && !/^[一-龥]+$/.test(kanji)) {
    candidateFragments.push({ reason: 'broken_ruby_katakana', kanji, furigana, occ: t.occurrencesCount });
  }
  // Kanji with partial okurigana inside
  else if (/^[一-龥]+[ぁ-んァ-ヶ]/.test(kanji) && (kanji.endsWith('選') || kanji.endsWith('待') || kanji.endsWith('取') || kanji.endsWith('行') || kanji.endsWith('込'))) {
    candidateFragments.push({ reason: 'partial_phrase_tail', kanji, furigana, occ: t.occurrencesCount });
  }
}

console.log('Total candidate fragments identified:', candidateFragments.length);
console.log(JSON.stringify(candidateFragments, null, 2));
