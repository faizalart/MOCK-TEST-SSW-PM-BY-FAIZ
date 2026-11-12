// scratch/inspect-app-details.mjs
import fs from 'fs';

const app = fs.readFileSync('app.js', 'utf8');

const idx1 = app.indexOf("case 'toggle-practice-translation':");
console.log('--- Globe Handler in app.js ---');
console.log(app.substring(idx1, idx1 + 350));

console.log('\n--- buildExamQuestions originalId in app.js ---');
let cur = 0;
while ((cur = app.indexOf('originalId', cur)) !== -1) {
  const lineStart = app.lastIndexOf('\n', cur);
  const lineEnd = app.indexOf('\n', cur);
  console.log(app.substring(lineStart, lineEnd).trim());
  cur = cur + 10;
}
