import fs from 'fs';

const html = fs.readFileSync('index.html', 'utf8');
const lines = html.split('\n');
lines.forEach((l, i) => {
  if (l.includes('bank') || l.includes('data-page')) {
    console.log(`${i + 1}: ${l.trim()}`);
  }
});
