// scratch/audit-session-lifecycle.mjs
import fs from 'node:fs';

const code = fs.readFileSync('app.js', 'utf8');

// 1. Check startExam session creation
const startExamIdx = code.indexOf('async function startExam(');
console.log('--- startExam definition ---');
console.log(code.slice(startExamIdx, startExamIdx + 2000));

// 2. Check finishExam definition
const finishExamIdx = code.indexOf('async function finishExam(');
console.log('\n--- finishExam definition ---');
console.log(code.slice(finishExamIdx, finishExamIdx + 1500));

// 3. Check practiceTranslationOpen references
console.log('\n--- practiceTranslationOpen references ---');
const lines = code.split('\n');
lines.forEach((l, i) => {
  if (l.includes('practiceTranslationOpen')) {
    console.log(`L${i+1}: ${l.trim()}`);
  }
});
