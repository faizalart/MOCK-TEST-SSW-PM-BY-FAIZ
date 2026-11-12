import fs from 'node:fs';

const matched = JSON.parse(fs.readFileSync('scratch/matched-sorted.json', 'utf8'));
console.log('Building matched lexicon for', matched.length, 'terms...');
