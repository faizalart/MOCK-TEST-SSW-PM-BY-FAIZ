import fs from 'fs';

const algContent = fs.readFileSync('C:\\Users\\Admin\\Downloads\\latihan_alergen_jepang_v2 (1).html', 'utf8');
const scriptMatch = algContent.match(/<script\b[^>]*>([\s\S]*?)<\/script>/i);
if (scriptMatch) {
  const s = scriptMatch[1];
  const foodsMatch = s.match(/const\s+foods\s*=\s*(\[[\s\S]*?\n\];)/);
  if (foodsMatch) {
    const foods = eval(foodsMatch[1]);
    console.log(`Total foods items: ${foods.length}`);
    console.log('Foods data:');
    foods.forEach((f, i) => {
      console.log(`${i+1}. ${f.jp} (${f.reading}) - ${f.id} [Group: ${f.group}] Notes: ${f.note || ''}`);
    });
  }

  // Check lines 140 to 250 of script
  console.log('\n--- Script lines 145-250 ---');
  const lines = s.split('\n');
  for (let i = 145; i < Math.min(lines.length, 250); i++) {
    console.log(`${i+1}: ${lines[i]}`);
  }
}
