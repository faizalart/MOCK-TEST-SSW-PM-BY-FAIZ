import fs from 'fs';

const app = fs.readFileSync('app.js', 'utf8');
const lines = app.split('\n');
lines.forEach((l, i) => {
  if (l.includes('keydown')) {
    console.log(`${i+1}: ${l}`);
  }
});
