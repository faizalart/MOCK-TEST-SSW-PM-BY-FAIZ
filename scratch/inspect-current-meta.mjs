// scratch/inspect-current-meta.mjs
import fs from 'node:fs';

const dict = JSON.parse(fs.readFileSync('data/sharedKotobaDictionary.json', 'utf8'));
console.log('Current _meta:');
console.log(JSON.stringify(dict._meta, null, 2));
