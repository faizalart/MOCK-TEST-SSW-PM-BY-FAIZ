// scratch/inspect-app-start-exam.mjs
import fs from 'node:fs';

const code = fs.readFileSync('app.js', 'utf8');
const lines = code.split('\n');
lines.forEach((l, idx) => {
  if (l.includes('startExam(') || l.includes('startExam =') || l.includes('buildExamQuestions')) {
    console.log(`Line ${idx + 1}: ${l.trim()}`);
  }
});
