import fs from 'fs';

const js = fs.readFileSync('app.js', 'utf8');
const lines = js.split('\n');
lines.forEach((l, i) => {
  if (l.includes('data-page') && (l.includes('addEventListener') || l.includes('dataset.page') || l.includes('closest'))) {
    console.log(`${i + 1}: ${l.trim()}`);
  }
});
