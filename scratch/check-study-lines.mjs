import fs from 'fs';

const js = fs.readFileSync('app.js', 'utf8');
const lines = js.split('\n');
lines.forEach((l, i) => {
  if (l.includes('id="study-total-count"') || (i >= 4140 && i <= 4300 && (l.includes('DAFTAR BELAJAR') || l.includes('✓ Kunci') || l.includes('zen-study-correct-badge')))) {
    console.log(`${i + 1}: ${l}`);
  }
});
