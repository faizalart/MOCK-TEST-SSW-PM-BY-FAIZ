import fs from 'fs';

const app = fs.readFileSync('app.js', 'utf8');

const start = app.indexOf('const I18N = {');
const end = app.indexOf('};\n\nfunction loadLang()');
const i18nCode = app.slice(start, end + 2);
eval(i18nCode.replace('const I18N =', 'global.I18N ='));

const enObj = global.I18N.en;
const jaObj = global.I18N.ja;

const idWords = ['soal', 'ujian', 'jawaban', 'selesai', 'tinjauan', 'batal', 'ubah', 'kunci', 'simpan', 'hapus', 'riwayat', 'beranda', 'cadangan', 'pengaturan'];

console.log('--- EN checks ---');
for (const [k, v] of Object.entries(enObj)) {
  if (typeof v === 'string') {
    const lower = v.toLowerCase();
    for (const w of idWords) {
      if (lower.split(/\s+/).includes(w)) {
        console.log(`EN key "${k}": "${v}" contains "${w}"`);
      }
    }
  }
}

console.log('--- JA checks ---');
for (const [k, v] of Object.entries(jaObj)) {
  if (typeof v === 'string') {
    const lower = v.toLowerCase();
    for (const w of idWords) {
      if (lower.split(/\s+/).includes(w)) {
        console.log(`JA key "${k}": "${v}" contains "${w}"`);
      }
    }
  }
}
