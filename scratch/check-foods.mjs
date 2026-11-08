import fs from 'fs';

const algContent = fs.readFileSync('C:\\Users\\Admin\\Downloads\\latihan_alergen_jepang_v2 (1).html', 'utf8');
const scriptMatch = algContent.match(/<script\b[^>]*>([\s\S]*?)<\/script>/i);
if (scriptMatch) {
  const s = scriptMatch[1];
  const idx = s.indexOf('const foods =');
  console.log('Index of const foods:', idx);
  if (idx !== -1) {
    const endIdx = s.indexOf('];', idx);
    console.log('End of foods array:', endIdx);
    const sub = s.slice(idx, endIdx + 2);
    console.log('Foods snippet:', sub.slice(0, 300));
    try {
      const foods = eval('(' + sub.replace('const foods =', '').trim() + ')');
      console.log('Total foods:', foods.length);
      console.log('First 5 foods:', JSON.stringify(foods.slice(0, 5), null, 2));
      console.log('Last 5 foods:', JSON.stringify(foods.slice(-5), null, 2));
    } catch (e) {
      console.log('Eval error:', e.message);
    }
  }
}
