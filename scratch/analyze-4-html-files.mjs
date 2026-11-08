import fs from 'fs';

const files = [
  { name: 'SSW_Bacteria_Lab.html', path: 'C:\\Users\\Admin\\Downloads\\SSW_Bacteria_Lab.html' },
  { name: 'SSW_Temperature_Lab_Fixed_v2.html', path: 'C:\\Users\\Admin\\Downloads\\SSW_Temperature_Lab_Fixed_v2.html' },
  { name: 'HACCP_SSW_quiz.html', path: 'C:\\Users\\Admin\\Downloads\\HACCP_SSW_quiz.html' },
  { name: 'latihan_alergen_jepang_v2 (1).html', path: 'C:\\Users\\Admin\\Downloads\\latihan_alergen_jepang_v2 (1).html' }
];

for (const item of files) {
  console.log(`\n========================================`);
  console.log(`FILE: ${item.name}`);
  console.log(`========================================`);
  const content = fs.readFileSync(item.path, 'utf8');
  console.log(`Size: ${content.length} characters`);

  // Look for script tags
  const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  let scriptMatch;
  let scriptCount = 0;
  while ((scriptMatch = scriptRegex.exec(content)) !== null) {
    scriptCount++;
    const sBody = scriptMatch[1].trim();
    console.log(`--- Script #${scriptCount} (${sBody.length} chars) ---`);
    // Look for variable declarations that might hold questions
    const varMatches = sBody.match(/(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*(\[|\{)/g);
    if (varMatches) {
      console.log(`  Variables:`, varMatches.slice(0, 10).join(', '));
    }
    // Check if questions / quiz array exists
    const qKeywords = ['questions', 'quiz', 'quizData', 'soal', 'data', 'qaData', 'items'];
    for (const kw of qKeywords) {
      const kwMatch = sBody.match(new RegExp(`(?:const|let|var)\\s+${kw}\\s*=\\s*(\\[|\\{)`, 'i'));
      if (kwMatch) {
        console.log(`  Found potential data array/obj for keyword: ${kw}`);
      }
    }
  }

  // Look for images / media
  const imgMatches = content.match(/<img\b[^>]*src=["']([^"']+)["']/gi);
  if (imgMatches) {
    console.log(`Images found (${imgMatches.length}):`, imgMatches.slice(0, 5));
  } else {
    console.log(`No <img> tags found directly.`);
  }
}
