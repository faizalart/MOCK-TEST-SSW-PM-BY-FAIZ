import fs from 'fs';

const js = fs.readFileSync('app.js', 'utf8');
const lines = js.split('\n');
lines.forEach((l, i) => {
  if (i >= 2290 && i <= 2450) {
    if (l.includes('const B =') || l.includes('title: \'') || l.includes('zen-page-head') || l.includes('zen-kicker') || l.includes('zen-page-title')) {
      console.log(`${i + 1}: ${l}`);
    }
  }
});
