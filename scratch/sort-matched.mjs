import fs from 'node:fs';

const matchedKeys = JSON.parse(fs.readFileSync('scratch/group-matched.json', 'utf8'));
console.log('Total matched keys to curate:', matchedKeys.length);

// Sort alphabetically
matchedKeys.sort();
fs.writeFileSync('scratch/matched-sorted.json', JSON.stringify(matchedKeys, null, 2));
