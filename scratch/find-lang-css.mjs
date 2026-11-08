import fs from 'fs';

const cssFiles = fs.readdirSync('.').filter(f => f.endsWith('.css'));
for (const file of cssFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((l, i) => {
    if (l.includes('lang-select') || l.includes('lang-Segment') || l.includes('lang-segment') || l.includes('.lang-')) {
      console.log(`${file}:${i + 1}: ${l.trim()}`);
    }
  });
}
