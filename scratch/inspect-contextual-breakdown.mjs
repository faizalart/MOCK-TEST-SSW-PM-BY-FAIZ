import fs from 'node:fs';

const dict = JSON.parse(fs.readFileSync('data/sharedKotobaDictionary.json', 'utf8'));
const contextual = Object.values(dict.terms).filter(t => t.matchStatus === 'contextual_review');

const nouns = contextual.filter(t => t.kanji.length > 1);
const single = contextual.filter(t => t.kanji.length === 1);

console.log('Contextual review breakdown:');
console.log('Multi-char (nouns/compounds):', nouns.length);
console.log(nouns.map(n => `${n.kanji} (${n.furigana})`).join(', '));
console.log('Single char (mostly stems):', single.length);
