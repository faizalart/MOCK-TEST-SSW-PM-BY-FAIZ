import fs from 'node:fs';

const dict = JSON.parse(fs.readFileSync('data/sharedKotobaDictionary.json', 'utf8'));
const t426 = dict.terms['kb-ext-0426-e7b9b03a3a'];
console.log('t426 occurrences:', t426 ? t426.occurrences : 'none');

const t427 = dict.terms['kb-ext-0427-e7b9b03a3a'];
console.log('t427 occurrences:', t427 ? t427.occurrences : 'none');
