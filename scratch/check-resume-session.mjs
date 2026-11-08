import fs from 'fs';

const js = fs.readFileSync('app.js', 'utf8');
const lines = js.split('\n');
lines.forEach((l, i) => {
  if (l.includes('resume-session') || l.includes('quick-start-kunci1') || l.includes('quick-practice-kunci1')) {
    console.log(`${i + 1}: ${l.trim()}`);
  }
});
