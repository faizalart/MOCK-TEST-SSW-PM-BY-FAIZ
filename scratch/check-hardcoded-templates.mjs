import fs from 'fs';

const js = fs.readFileSync('app.js', 'utf8');

// List of Indonesian keywords that might be hardcoded in templates
const keywords = [
  'soal',
  'paket',
  'kunci',
  'ujian',
  'simulasi',
  'pustaka',
  'arsip',
  'tinjauan',
  'kosong',
  'selesai',
  'batal',
  'hapus',
  'simpan'
];

// Let's check occurrences inside backticks (template literals) outside I18N
const templateRegex = /`([\s\S]*?)`/g;
let match;
let count = 0;

while ((match = templateRegex.exec(js)) !== null) {
  const tpl = match[1];
  const start = match.index;
  // skip if inside I18N object (approx lines 178 to 650)
  if (start < 30000) continue;

  for (const kw of keywords) {
    const wordRegex = new RegExp(`\\b${kw}\\b`, 'i');
    if (wordRegex.test(tpl)) {
      // Find line number
      const lineNo = js.slice(0, start).split('\n').length;
      // print small snippet
      const firstMatch = tpl.split('\n').find(l => wordRegex.test(l)) || '';
      if (firstMatch.trim().length > 0 && !firstMatch.includes('//') && !firstMatch.includes('console.log')) {
        console.log(`L${lineNo}: [${kw}] ${firstMatch.trim().slice(0, 80)}`);
        count++;
        break;
      }
    }
  }
}
console.log('Total potential template hits:', count);
