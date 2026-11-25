import fs from 'node:fs';

const chains = new Map();
const standaloneRubyFollowed = new Map();
const mexel = [];

for (let p = 1; p <= 10; p++) {
  const pkg = JSON.parse(fs.readFileSync(`data/latsol-otaff-pm51-${String(p).padStart(2, '0')}.json`, 'utf8'));
  for (const q of pkg.questions) {
    for (const [label, html] of [['P', q.prompt], ...q.options.map(o => [o.id, o.text])]) {
      const clean = html.replace(/\*\*/g, '');
      const plain = clean.replace(/<rt>[^<]*<\/rt>/g, '').replace(/<[^>]+>/g, '');
      if (plain.includes('メクセル')) mexel.push({ id: q.id, label, plain });
      // Match <ruby>B1<rt>R1</rt></ruby>(1-2 hira)<ruby>B2<rt>R2</rt></ruby>(optional 0-3 hira)
      const reChain = /<ruby>([^<]+)<rt>([^<]+)<\/rt><\/ruby>([\u3041-\u3096]{1,2})<ruby>([^<]+)<rt>([^<]+)<\/rt><\/ruby>([\u3041-\u3096]{0,3})/g;
      for (const m of clean.matchAll(reChain)) {
        const surf = m[1] + m[3] + m[4];
        const furi = m[2] + m[3] + m[5];
        const follow = m[6];
        // Heuristic: likely compound if middle hira is NOT standalone particle like の, を, が, は, に, で, と, や, か, も, へ (except の inside known things? mostly not needed)
        if (!['の', 'を', 'が', 'は', 'に', 'で', 'と', 'や', 'か', 'も', 'へ', 'だ', 'な'].includes(m[3])) {
          const k = `${surf}|${furi}`;
          if (!chains.has(k)) chains.set(k, { surf, furi, count: 0, follows: new Set() });
          chains.get(k).count++;
          if (follow) chains.get(k).follows.add(follow);
        }
      }
    }
  }
}

console.log('メクセル occurrences:', mexel);
console.log('Unique K+hira+K chains:', chains.size);
for (const c of [...chains.values()].sort((a, b) => b.count - a.count).slice(0, 80)) {
  console.log(`  ${c.count}x: ${c.surf}(${c.furi}) + [${[...c.follows].slice(0, 4).join(',')}]`);
}
