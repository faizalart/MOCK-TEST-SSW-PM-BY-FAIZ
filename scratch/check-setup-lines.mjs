import fs from 'fs';

const js = fs.readFileSync('app.js', 'utf8');
const lines = js.split('\n');
lines.forEach((l, i) => {
  if (i >= 2040 && i <= 2180) {
    if (l.includes('const L =') || l.includes('title: \'') || l.includes('zen-page-head') || l.includes('zen-page-title')) {
      console.log(`${i + 1}: ${l}`);
    }
  }
});
