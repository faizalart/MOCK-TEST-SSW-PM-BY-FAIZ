import fs from 'fs';
const app = fs.readFileSync('app.js', 'utf8').split('\n');
app.forEach((l, idx) => {
  if (l.includes("mode: 'practice'") || l.includes('quick-practice') || l.includes('setup.practice')) {
    console.log((idx + 1) + ': ' + l.trim());
  }
});
