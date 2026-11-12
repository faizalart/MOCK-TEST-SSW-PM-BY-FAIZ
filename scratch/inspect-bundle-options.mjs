// scratch/inspect-bundle-options.mjs
import fs from 'node:fs';

const files = [
  'ssw-pm-kunci-ujian-1.json',
  'ssw-pm-kunci-ujian-2.json',
  'ssw-pm-all-kunci-ujian-3-to-13.json',
  'ssw-pm-bonus-soal-1-to-10-bundle.json',
  'ssw-pm-tipe2-nguyen1.json',
  'ssw-pm-special-lab-bundle.json',
  'questions.json'
];

for (const f of files) {
  if (!fs.existsSync(f)) {
    console.log(`File missing: ${f}`);
    continue;
  }
  const data = JSON.parse(fs.readFileSync(f, 'utf8'));
  const qs = Array.isArray(data) ? data : (data.questions || []);
  const sampleQ = qs[0];
  console.log(`\nFile: ${f} (${qs.length} questions)`);
  console.log(`  Sample Q ID: ${sampleQ.id}`);
  console.log(`  Sample Options count: ${sampleQ.options ? sampleQ.options.length : 0}`);
  if (sampleQ.options && sampleQ.options.length > 0) {
    console.log(`  Option IDs:`, sampleQ.options.map(o => o.id));
  }
}
