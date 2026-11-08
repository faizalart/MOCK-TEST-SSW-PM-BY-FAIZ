import fs from 'fs';

const js = fs.readFileSync('app.js', 'utf8');
const lines = js.split('\n');
lines.forEach((l, i) => {
  if (l.includes('revKeySource:') || l.includes('en: {') || l.includes('ja: {')) {
    console.log(`${i + 1}: ${l.trim()}`);
  }
});
