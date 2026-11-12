// scratch/inspect-render-exam.mjs
import fs from 'fs';

const app = fs.readFileSync('app.js', 'utf8');
const lines = app.split('\n');

[4154, 5871, 5883, 5906, 6027].forEach(lineNo => {
  console.log(`--- Line ${lineNo} ---`);
  console.log(lines.slice(Math.max(0, lineNo - 6), lineNo + 5).join('\n'));
});
