import fs from 'node:fs';

const files = [
  'ssw-pm-kunci-ujian-1.json',
  'ssw-pm-kunci-ujian-2.json',
  'ssw-pm-all-kunci-ujian-3-to-13.json',
  'ssw-pm-bonus-soal-1-to-10-bundle.json',
  'ssw-pm-special-lab-bundle.json'
];

const targets = [
  'bonus-soal-2-q028',
  'kunci-ujian-8-q005',
  'kunci-ujian-5-q015',
  'kunci-ujian-13-q009',
  'kunci-ujian-4-q025',
  'kunci-ujian-11-q017',
  'bonus-soal-5-q009',
  'bonus-soal-10-q037'
];

for (const f of files) {
  if (!fs.existsSync(f)) continue;
  const data = JSON.parse(fs.readFileSync(f, 'utf8'));
  const qs = Array.isArray(data) ? data : (data.questions || []);
  for (const q of qs) {
    if (targets.includes(q.id)) {
      console.log(`\n=== Question: ${q.id} ===`);
      console.log('Prompt:', q.prompt);
      for (const opt of q.options) {
        console.log(`  Opt ${opt.id}: ${opt.text}`);
      }
    }
  }
}
