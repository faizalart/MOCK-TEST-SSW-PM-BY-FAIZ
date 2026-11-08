import fs from 'fs';

const content = fs.readFileSync('app.js', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (
    line.includes('async function startExam(') ||
    line.includes("go('exam')") ||
    line.includes('function renderExam(') ||
    line.includes('syncExamViewportAfterResume') ||
    line.includes('window.scrollTo')
  ) {
    console.log(`${idx + 1}: ${line.trim().slice(0, 100)}`);
  }
});
