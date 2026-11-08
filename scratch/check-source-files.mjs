import fs from 'fs';

const files = [
  'C:\\Users\\Admin\\Downloads\\SSW_Bacteria_Lab.html',
  'C:\\Users\\Admin\\Downloads\\SSW_Temperature_Lab_Fixed_v2.html',
  'C:\\Users\\Admin\\Downloads\\HACCP_SSW_quiz.html',
  'C:\\Users\\Admin\\Downloads\\latihan_alergen_jepang_v2 (1).html'
];

for (const f of files) {
  if (fs.existsSync(f)) {
    const stat = fs.statSync(f);
    console.log(`[FOUND] ${f} (${(stat.size / 1024).toFixed(1)} KB)`);
  } else {
    console.log(`[NOT FOUND] ${f}`);
  }
}
