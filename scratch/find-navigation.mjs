// scratch/find-navigation.mjs
import fs from 'node:fs';

const code = fs.readFileSync('app.js', 'utf8');
const lines = code.split('\n');
lines.forEach((l, i) => {
  if (l.includes('currentIndex') && (l.includes('++') || l.includes('--') || l.includes('='))) {
    console.log(`L${i+1}: ${l.trim()}`);
  }
});
