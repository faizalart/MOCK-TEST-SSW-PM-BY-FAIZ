import fs from 'node:fs';

const dict = JSON.parse(fs.readFileSync('data/sharedKotobaDictionary.json', 'utf8'));
const terms = Object.values(dict.terms);

console.log('Read', terms.length, 'terms from data/sharedKotobaDictionary.json');
