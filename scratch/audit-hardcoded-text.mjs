import fs from 'fs';

const app = fs.readFileSync('app.js', 'utf8');

// Check render functions: renderHome, renderSetup, renderExam, renderResult, renderBank, renderHistory, renderStudy, renderBackup
const renderFns = ['renderHome', 'renderSetup', 'renderExam', 'renderResult', 'renderBank', 'renderHistory', 'renderStudy', 'renderBackup'];

for (const fn of renderFns) {
  const start = app.indexOf(`function ${fn}(`);
  if (start === -1) continue;
  const nextStart = app.indexOf('\nfunction ', start + 10);
  const fnBody = app.substring(start, nextStart !== -1 ? nextStart : start + 5000);
  
  // Find raw HTML string literals in template strings that might have Indonesian
  const htmlMatches = fnBody.match(/<[^>]+>[^<]*[a-zA-Z]{4,}[^<]*<\/[^>]+>/g) || [];
  console.log(`\n=== Checking ${fn} (${htmlMatches.length} tags) ===`);
  htmlMatches.forEach(tag => {
    // Flag if tag contains common Indonesian terms not wrapped in t()
    if (/soal|ujian|kunci|tinjauan|hasil|selesai|simulasi|pustaka|pengaturan|riwayat|daftar|waktu|batal/i.test(tag)) {
      if (!tag.includes('lang="ja"')) {
        console.log(`  Potential ID in ${fn}:`, tag.trim().substring(0, 100));
      }
    }
  });
}
