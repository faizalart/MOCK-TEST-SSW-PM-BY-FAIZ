import fs from 'node:fs';

const matched = JSON.parse(fs.readFileSync('scratch/matched-sorted.json', 'utf8'));

// Group by first character of kanji
const byFirst = {};
for (const m of matched) {
  const c = m[0];
  byFirst[c] = (byFirst[c] || 0) + 1;
}

console.log('Total matched:', matched.length);
console.log('Unique first kanji:', Object.keys(byFirst).length);
