import fs from 'fs';

const js = fs.readFileSync('app.js', 'utf8');
const lines = js.split('\n');
lines.forEach((l, i) => {
  if (l.includes('function buildReviewCardsHTML(')) {
    console.log(`${i + 1}: ${l}`);
  }
});
