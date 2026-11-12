// scratch/inspect-t029.mjs
import fs from 'fs';

const app = fs.readFileSync('app.js', 'utf8');
const lines = app.split('\n');

console.log('--- Lines matching isPracticeMode or practice-prompt-row ---');
lines.forEach((l, i) => {
  if (l.includes('isPracticeMode') || l.includes('practice-prompt-row')) {
    console.log(`${i+1}: ${l.trim()}`);
  }
});

console.log('\n--- Lines matching getOptionKey ---');
lines.forEach((l, i) => {
  if (l.includes('function getOptionKey(')) {
    console.log(lines.slice(i, i + 10).join('\n'));
  }
});

console.log('\n--- Lines matching toggle-practice-translation ---');
lines.forEach((l, i) => {
  if (l.includes('toggle-practice-translation')) {
    console.log(lines.slice(i, i + 10).join('\n'));
  }
});

const mapping = JSON.parse(fs.readFileSync('data/kotobaMapping.json', 'utf8'));
console.log('\n--- Mapping keys ---');
console.log('Mapping root keys:', Object.keys(mapping));
if (mapping.questions) console.log('Questions count:', Object.keys(mapping.questions).length);
if (mapping.options) console.log('Options count:', Object.keys(mapping.options).length);
if (mapping.questions) {
  const sampleQ = Object.keys(mapping.questions)[0];
  console.log('Sample question in mapping:', sampleQ, mapping.questions[sampleQ]);
}
