import fs from 'node:fs';

const dict = JSON.parse(fs.readFileSync('data/sharedKotobaDictionary.json', 'utf8'));

for (const [id, term] of Object.entries(dict.terms)) {
  if (term.kanji === '流' || term.kanji.includes('流') || term.furigana === 'りゅう' || term.furigana === 'なが') {
    console.log(`\nID: ${id}`);
    console.log(`  kanji: ${term.kanji}, furigana: ${term.furigana}`);
    console.log(`  status: ${term.status}, arti: "${term.arti}"`);
    console.log(`  entryType: ${term.entryType}, domain: ${term.domainCategory}`);
    console.log(`  occurrences (${term.occurrences.length}):`, term.occurrences.map(o => o.compositeKey || `${o.questionId}::${o.targetType}`));
  }
}
