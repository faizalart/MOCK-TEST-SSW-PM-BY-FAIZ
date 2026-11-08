import fs from 'fs';

const js = fs.readFileSync('app.js', 'utf8');
const lines = js.split('\n');
lines.forEach((l, i) => {
  if (l.includes('zen-bank-page') || l.includes('function renderBank')) {
    console.log(`${i + 1}: ${l}`);
  }
});
