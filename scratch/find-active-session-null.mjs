// scratch/find-active-session-null.mjs
import fs from 'node:fs';

const code = fs.readFileSync('app.js', 'utf8');
const lines = code.split('\n');
lines.forEach((l, i) => {
  if (l.includes('activeSession =') || l.includes('activeSession:')) {
    console.log(`L${i+1}: ${l.trim()}`);
  }
});
