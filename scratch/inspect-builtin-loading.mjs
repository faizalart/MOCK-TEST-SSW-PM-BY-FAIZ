import fs from 'fs';

const app = fs.readFileSync('app.js', 'utf8');
const lines = app.split('\n');
lines.forEach((l, i) => {
  if (
    l.includes('ensureAllBuiltinSetsLoaded') ||
    l.includes('BUILTIN') ||
    l.includes('ssw-pm-kunci-ujian-1.json') ||
    l.includes('ssw-pm-bonus-soal-1-to-10-bundle.json') ||
    l.includes('getAvailablePackages')
  ) {
    console.log(`${i + 1}: ${l.trim().slice(0, 100)}`);
  }
});
