import fs from 'node:fs';

const q1 = JSON.parse(fs.readFileSync('questions.json', 'utf8')); // or whichever file
// let's search across all 7 files
const files = [
  'ssw-pm-kunci-ujian-1.json',
  'ssw-pm-kunci-ujian-2.json',
  'ssw-pm-all-kunci-ujian-3-to-13.json',
  'ssw-pm-bonus-soal-1-to-10-bundle.json',
  'ssw-pm-special-lab-bundle.json'
];

for (const f of files) {
  if (!fs.existsSync(f)) continue;
  const data = JSON.parse(fs.readFileSync(f, 'utf8'));
  const qs = Array.isArray(data) ? data : (data.questions || []);
  for (const q of qs) {
    if (q.id === 'kunci-ujian-2-q014') {
      console.log('kunci-ujian-2-q014:', JSON.stringify(q.options.find(o => o.id === 'A' || o.id === 'kunci-ujian-2-q014-opt1')));
    }
    if (q.id === 'bonus-soal-4-q024') {
      console.log('bonus-soal-4-q024:', JSON.stringify(q.options.find(o => o.id === 'C' || o.id === 'bonus-soal-4-q024-opt3')));
    }
  }
}
