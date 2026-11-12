import fs from 'node:fs';

const dict = JSON.parse(fs.readFileSync('data/sharedKotobaDictionary.json', 'utf8'));
const terms = Object.values(dict.terms);

console.log('Auditing all verified entries...');
const issues = [];

for (const t of terms) {
  if (t.status === 'verified') {
    // 1. Check for empty arti
    if (!t.arti || t.arti.trim() === '') {
      issues.push({ id: t.id, kanji: t.kanji, furigana: t.furigana, issue: 'Empty arti' });
    }
    // 2. Check for generic placeholder arti like "Kosakata operasional terkait..."
    if (t.arti.includes('Kosakata operasional terkait') || t.arti.includes('Belum ditentukan')) {
      issues.push({ id: t.id, kanji: t.kanji, furigana: t.furigana, issue: 'Placeholder arti', arti: t.arti });
    }
    // 3. Check for single kanji with kanji length != furigana length where furigana seems odd
    // 4. Check if furigana contains illegal characters
    if (!/^[\u3040-\u309F\u30A0-\u30FF\u30FC]+$/.test(t.furigana)) {
      issues.push({ id: t.id, kanji: t.kanji, furigana: t.furigana, issue: 'Non-kana furigana' });
    }
  }
}

console.log(`Found ${issues.length} potential issues:`);
for (const iss of issues) {
  console.log(iss);
}
