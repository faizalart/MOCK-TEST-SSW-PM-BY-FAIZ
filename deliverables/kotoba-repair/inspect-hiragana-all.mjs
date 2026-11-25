import fs from 'node:fs';

const raw = JSON.parse(fs.readFileSync('deliverables/kotoba-repair/phase2-raw-discovery.json', 'utf8'));
const dict = JSON.parse(fs.readFileSync('data/sharedKotobaDictionary.json', 'utf8'));
console.log('Is 帽子 in dict?', Object.values(dict.terms).filter(e => e.kanji === '帽子').map(e => ({ id: e.id, s: e.status })));

// Check where 帽 appeared alone
for (let p = 1; p <= 10; p++) {
  const pkg = JSON.parse(fs.readFileSync(`data/latsol-otaff-pm51-${String(p).padStart(2, '0')}.json`, 'utf8'));
  for (const q of pkg.questions) {
    for (const [lbl, h] of [['P', q.prompt], ...q.options.map(o => [o.id, o.text])]) {
      if (h.includes('帽') && !h.includes('帽子')) console.log('BARE 帽:', q.id, lbl, h);
      if (h.includes('髪は帽子の外')) console.log('CAP HTML:', q.id, lbl, h);
    }
  }
}

const PURE_GRAMMAR = new Set([
  'を', 'の', 'に', 'が', 'は', 'で', 'と', 'や', 'も', 'へ', 'か', 'ね', 'よ', 'な', 'だ', 'て', 'た', 'ば', 'ず', 'さ', 'し', 'っ', 'ん', 'り', 'き', 'い', 'く', 'れ', 'せ', 'ら', 'ま', 'つ', 'す', 'ぬ', 'え', 'け', 'げ', 'べ', 'わ', 'お', 'こ', 'め', 'そ', 'ね', 'ろ',
  'する', 'し', 'した', 'して', 'しない', 'せず', 'される', 'され', 'された', 'されて', 'できる', 'でき', 'できた', 'できない',
  'いる', 'い', 'いた', 'いて', 'いない', 'おり', 'おら',
  'ある', 'あり', 'あっ', 'あった', 'あって',
  'なる', 'なり', 'なっ', 'なった', 'なって', 'なら',
  'ない', 'なく', 'なかっ', 'なかった', 'なくす', // keep なくす? Wait remove なくす from grammar!
  'です', 'ます', 'ました', 'ません', 'ませんでした', 'でした', 'である', 'であり', 'であった', 'ではない', 'ではなく',
  'こと', 'もの', 'など', 'から', 'まで', 'より', 'では', 'には', 'とは', 'にも', 'への', 'からの', 'までの', 'との', 'での',
  'において', 'における', 'について', 'についての', 'による', 'によって', 'に対して', 'にとって', 'として',
  'ので', 'のに', 'ながら', 'たり', 'ても', 'でも', 'なら', 'しかし', 'また', 'および', 'または', 'なお', 'つまり',
  'この', 'その', 'あの', 'どの', 'どれ', 'どう', 'ここ', 'そこ', 'あそこ',
  'って', 'てい', 'る', 'れる', 'られる', 'せる', 'させる', 'ておく', 'おく', 'おき', 'おいて', 'てお', 'しまう', 'しまい', 'しまった', 'てし',
  'よう', 'ように', 'ような', 'みたい', 'らしい', 'そう', 'ため', 'ために', 'ための',
  'という', 'といった', 'とか', 'だけ', 'しか', 'ばかり', 'ほど', 'くらい', 'ぐらい', 'こそ', 'さえ', 'ごと',
]);
PURE_GRAMMAR.delete('なくす');

const segJa = new Intl.Segmenter('ja', { granularity: 'word' });
const hiraFreq = new Map();
for (const [run, cnt] of raw.hiraganaRuns) {
  for (const s of segJa.segment(run)) {
    if (!s.isWordLike) continue;
    const w = s.segment;
    if (PURE_GRAMMAR.has(w)) continue;
    hiraFreq.set(w, (hiraFreq.get(w) || 0) + cnt);
  }
}

const list = [...hiraFreq.entries()].sort((a, b) => b[1] - a[1]);
console.log('Non-grammar Intl.Segmenter hiragana tokens count:', list.length);
for (const [w, c] of list.slice(0, 200)) {
  console.log(`${w}|${c}`);
}
