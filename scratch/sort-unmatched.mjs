import fs from 'node:fs';

const rem = JSON.parse(fs.readFileSync('scratch/unmatched-remaining.json', 'utf8'));
console.log('Total remaining unmatched to process:', rem.length);

// Let's inspect all 377 items in alphabetical/reading order
rem.sort();
fs.writeFileSync('scratch/unmatched-sorted.json', JSON.stringify(rem, null, 2));
