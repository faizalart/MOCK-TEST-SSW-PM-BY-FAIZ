import fs from 'node:fs';

const dict = JSON.parse(fs.readFileSync('data/sharedKotobaDictionary.json', 'utf8'));
const terms = Object.values(dict.terms);

// Check single kanji with 1-character reading that might be fragments or inflected
const singleKanjiShortReading = terms.filter(t => t.kanji.length === 1 && t.furigana.length === 1);
console.log(`Single kanji with 1-char reading: ${singleKanjiShortReading.length}`);

// Group by status
const verifiedShort = singleKanjiShortReading.filter(t => t.status === 'verified');
const unresolvedShort = singleKanjiShortReading.filter(t => t.status === 'unresolved');
console.log(`  verified: ${verifiedShort.length}, unresolved: ${unresolvedShort.length}`);

// Inspect verified short ones to check if any are suspicious fragments
console.log('\nSample verified single-kanji 1-char reading:');
for (const t of verifiedShort.slice(0, 30)) {
  console.log(`- ${t.id} [${t.kanji}::${t.furigana}] norm:${t.normalizedForm || '-'} type:${t.entryType} arti:"${t.arti.slice(0, 40)}"`);
}
