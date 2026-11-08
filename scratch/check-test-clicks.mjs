import fs from 'fs';

const testFile = fs.readFileSync('scratch/test-review-study-and-lang-switch.mjs', 'utf8');
const lines = testFile.split('\n');
lines.forEach((l, i) => {
  if (l.includes('global-lang-select') || l.includes('data-page') || l.includes('click()')) {
    console.log(`${i + 1}: ${l.trim()}`);
  }
});
