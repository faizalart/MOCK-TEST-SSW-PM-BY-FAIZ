import fs from 'fs';

const cssFiles = fs.readdirSync('.').filter(f => f.endsWith('.css'));
for (const file of cssFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((l, i) => {
    if (l.includes('content:') && !l.includes('""') && !l.includes("''") && !l.includes('none')) {
      console.log(`${file}:${i + 1}: ${l.trim()}`);
    }
  });
}
