import fs from 'fs';

const js = fs.readFileSync('app.js', 'utf8');

// Find updateShellLanguage
const updateShellMatch = js.match(/function updateShellLanguage\(\) \{[\s\S]*?\n\}/);
if (updateShellMatch) {
  console.log('updateShellLanguage definition:');
  console.log(updateShellMatch[0]);
}

// Check where language change event is handled
const langChangeMatch = js.match(/id="global-lang-select"[\s\S]*?\n\s*\}/);
console.log('lang change handling:');
const lines = js.split('\n');
lines.forEach((l, i) => {
  if (l.includes('global-lang-select') || l.includes('setLanguage')) {
    console.log(`${i + 1}: ${l.trim()}`);
  }
});
