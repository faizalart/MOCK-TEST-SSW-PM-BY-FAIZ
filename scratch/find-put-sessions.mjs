// scratch/find-put-sessions.mjs
import fs from 'node:fs';

const code = fs.readFileSync('app.js', 'utf8');
const lines = code.split('\n');
lines.forEach((l, i) => {
  if (l.includes("put('sessions'") || l.includes('put("sessions"')) {
    console.log(`L${i+1}: ${l.trim()}`);
  }
});
