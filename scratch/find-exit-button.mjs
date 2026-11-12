// scratch/find-exit-button.mjs
import fs from 'node:fs';

const code = fs.readFileSync('app.js', 'utf8');
const lines = code.split('\n');
lines.forEach((l, i) => {
  if (l.includes('exit') && (l.includes('modal') || l.includes('action') || l.includes('btn') || l.includes('confirm'))) {
    console.log(`L${i+1}: ${l.trim()}`);
  }
});
