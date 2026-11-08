import fs from 'fs';

const html = fs.readFileSync('index.html', 'utf8');
console.log('--- Checking index.html ---');
const htmlLines = html.split('\n');
htmlLines.forEach((l, i) => {
  if (
    l.includes('PUSTAKA') ||
    l.includes('EDITORIAL') ||
    l.includes('Soal') ||
    l.includes('Tinjauan') ||
    l.includes('Kosong') ||
    l.includes('Benar') ||
    l.includes('Salah')
  ) {
    console.log(`index.html:${i + 1}: ${l.trim()}`);
  }
});
