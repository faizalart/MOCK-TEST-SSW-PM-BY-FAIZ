import fs from 'node:fs';

const raw = JSON.parse(fs.readFileSync('deliverables/kotoba-repair/phase2-raw-discovery.json', 'utf8'));

// 1. Group needsResolution by surface, skip pure punctuation/symbols
const isPunct = s => /^[①②③④⑤⑥⑦⑧⑨⑩!:：※/\\\[\]．＋+()「」『』、。・\-~～℃%％]+$/.test(s);

const bySurf = new Map();
for (const x of raw.needsResolution) {
  if (isPunct(x.surface)) continue;
  if (!bySurf.has(x.surface)) {
    bySurf.set(x.surface, { surface: x.surface, reading: x.reading, inMaster: x.inMaster, total: 0, tails: new Map(), sample: x.sample });
  }
  const r = bySurf.get(x.surface);
  r.total += x.count;
  if (x.nextHira) r.tails.set(x.nextHira, (r.tails.get(x.nextHira) || 0) + x.count);
}

const unmappedKanji = [...bySurf.values()].filter(x => x.inMaster === 0).sort((a, b) => b.total - a.total);
const partialOrSingle = [...bySurf.values()].filter(x => x.inMaster > 0).sort((a, b) => b.total - a.total);

const lines = [];
lines.push(`=== UNMAPPED KATAKANA (${raw.katakana.filter(k => k.inMaster === 0).length}) ===`);
for (const k of raw.katakana.filter(k => k.inMaster === 0)) {
  lines.push(`${k.surface}|${k.reading}|${k.count}|${k.sample.slice(0, 60)}`);
}

lines.push(`\n=== UNMAPPED KANJI/RUBY (${unmappedKanji.length}) ===`);
for (const u of unmappedKanji) {
  const ts = [...u.tails.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([s, c]) => `${s}:${c}`).join(',');
  lines.push(`${u.surface}|${u.reading}|${u.total}|[${ts}]|${u.sample.slice(0, 50)}`);
}

lines.push(`\n=== STEM/MASTER WITH TRAILING HIRA (${partialOrSingle.length}) ===`);
for (const u of partialOrSingle) {
  const ts = [...u.tails.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([s, c]) => `${s}:${c}`).join(',');
  lines.push(`${u.surface}|${u.reading}|${u.total}|[${ts}]`);
}

// Hiragana full runs >= 2 chars (grouped/sorted by freq) - let's inspect raw runs that look lexical or non-trivial!
lines.push(`\n=== HIRAGANA RUNS NOT SIMPLE SINGLE PARTICLES (total=${raw.hiraganaRuns.length}) ===`);
const TRIVIAL_GLUE = new Set(['の', 'を', 'に', 'が', 'は', 'で', 'と', 'や', 'も', 'へ', 'か', 'ね', 'よ', 'な', 'だ', 'て', 'た', 'ば', 'ず', 'さ', 'し', 'てい', 'する', 'した', 'して', 'として', 'において', 'について', 'による', 'によって', 'など', 'から', 'まで', 'より', 'では', 'には', 'とは', 'にも', 'への', 'からの', 'までの', 'との', 'での', 'です', 'ます', 'ました', 'ません', 'ですか', 'でした', 'である', 'であり', 'ではない', 'ではなく', 'もの', 'ものを', 'ものの', 'ものとして', 'こと', 'ことを', 'ことに', 'ことが', 'ことで', 'ことと', 'であるか', 'のです', 'ので', 'のに', 'ながら', 'たり', 'ても', 'でも', 'なら', 'しかし', 'また', 'および', 'または', 'この', 'その', 'あの', 'どの', 'どれ', 'どれですか', 'はどれですか', '何ですか', 'ですか', 'ない', 'ないか', 'ないため', 'ないように', 'ないで', 'なく', 'なる', 'なり', 'なった', 'なって', 'ある', 'あり', 'あった', 'あって', 'いる', 'いた', 'いて', 'いない', 'おき', 'おく', 'おいて', 'しまう', 'しまい', 'しまった', 'よい', 'よくない', 'いけない', 'てはいけない', 'てはいけません']);
for (const [hw, c] of raw.hiraganaRuns) {
  if (TRIVIAL_GLUE.has(hw)) continue;
  lines.push(`${hw}|${c}`);
}

fs.writeFileSync('deliverables/kotoba-repair/todo-lexicon.txt', lines.join('\n') + '\n', 'utf8');
console.log('Wrote deliverables/kotoba-repair/todo-lexicon.txt lines:', lines.length, {
  katakana: raw.katakana.filter(k => k.inMaster === 0).length,
  unmappedKanji: unmappedKanji.length,
  partialOrSingle: partialOrSingle.length,
});
