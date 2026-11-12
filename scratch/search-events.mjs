// scratch/search-events.mjs
import fs from 'fs';

const app = fs.readFileSync('app.js', 'utf8');
const lines = app.split('\n');

console.log('--- Searching for handleAction calls & click listeners ---');
lines.forEach((l, i) => {
  if (l.includes('handleAction(') || l.includes("addEventListener('click'") || l.includes('addEventListener("click"') || l.includes("addEventListener('keydown'")) {
    console.log(`${i+1}: ${l.trim()}`);
  }
});

console.log('\n--- Searching for outside click / popover listeners ---');
lines.forEach((l, i) => {
  if (l.includes('exam-settings-popover') || l.includes('examSettingsOpen')) {
    console.log(`${i+1}: ${l.trim()}`);
  }
});
