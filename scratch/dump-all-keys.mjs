import fs from 'node:fs';

const dict = JSON.parse(fs.readFileSync('data/sharedKotobaDictionary.json', 'utf8'));
const terms = Object.values(dict.terms);

// Create a list of all kanji::furigana keys
const allKeys = terms.map(t => `${t.kanji}::${t.furigana}`);
console.log('Total keys:', allKeys.length);

// Let's write all keys to a json file so we can reference them
fs.writeFileSync('scratch/all-keys.json', JSON.stringify(allKeys, null, 2));
