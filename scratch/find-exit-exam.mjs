// scratch/find-exit-exam.mjs
import fs from 'node:fs';

const code = fs.readFileSync('app.js', 'utf8');
const lines = code.split('\n');
lines.forEach((l, i) => {
  if (l.includes('exitExam') || l.includes('confirmExit') || l.includes('quitExam') || (l.includes('go(') && l.includes('home'))) {
    console.log(`L${i+1}: ${l.trim()}`);
  }
});
