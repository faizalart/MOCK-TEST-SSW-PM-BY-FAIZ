import fs from 'node:fs';

const raw = JSON.parse(fs.readFileSync('deliverables/kotoba-repair/phase2-raw-discovery.json', 'utf8'));

// Group needsResolution by bare surface (ignoring nextHira)
const bySurf = new Map();
for (const x of raw.needsResolution) {
  if (!bySurf.has(x.surface)) {
    bySurf.set(x.surface, { surface: x.surface, reading: x.reading, inMaster: x.inMaster, total: 0, tails: [], sample: x.sample });
  }
  const r = bySurf.get(x.surface);
  r.total += x.count;
  if (x.nextHira) r.tails.push(`${x.nextHira}(${x.count})`);
}

const unmappedGrouped = [...bySurf.values()].sort((a, b) => b.total - a.total);
console.log('Unique unmapped/stem surfaces grouped:', unmappedGrouped.length);
console.log('Of which inMaster === 0:', unmappedGrouped.filter(x => x.inMaster === 0).length);
console.log('Of which inMaster > 0 (had nextHira / single char):', unmappedGrouped.filter(x => x.inMaster > 0).length);

console.log('\nALL unmapped Katakana (inMaster === 0):');
const kataUnmapped = raw.katakana.filter(k => k.inMaster === 0);
console.log('Count:', kataUnmapped.length);
for (const k of kataUnmapped) {
  console.log(`  ${k.surface}(${k.reading}) [${k.count}x]`);
}

console.log('\nTop 100 grouped surfaces with inMaster === 0:');
for (const x of unmappedGrouped.filter(u => u.inMaster === 0).slice(0, 100)) {
  console.log(`  ${x.surface}(${x.reading}) [${x.total}x] | ${x.tails.slice(0, 4).join(', ')}`);
}

// Segment hiraganaRuns with Intl.Segmenter to see ALL unique hiragana words!
const segJa = new Intl.Segmenter('ja', { granularity: 'word' });
const hiraSegFreq = new Map();
for (const [run, cnt] of raw.hiraganaRuns) {
  for (const s of segJa.segment(run)) {
    if (!s.isWordLike) continue;
    const w = s.segment;
    hiraSegFreq.set(w, (hiraSegFreq.get(w) || 0) + cnt);
  }
}
console.log('\nUnique Intl.Segmenter hiragana tokens across leftover hiraganaRuns:', hiraSegFreq.size);
for (const [w, c] of [...hiraSegFreq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 120)) {
  console.log(`  ${w} (${c}x)`);
}
