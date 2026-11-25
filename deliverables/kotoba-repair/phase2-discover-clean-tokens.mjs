import fs from 'node:fs';
import { hasKanji } from '../../scripts/lib/kotoba-pipeline-utils.mjs';

const dict = JSON.parse(fs.readFileSync('data/sharedKotobaDictionary.json', 'utf8'));

// Build clean verified master dictionary lookup (excluding junk たんご, fragments, and weird partial truncations)
const BAD_OTAFF_IDS = new Set();
const masterBySurface = new Map();

for (const [id, e] of Object.entries(dict.terms || {})) {
  if (!e || e.status !== 'verified' || !e.kanji) continue;
  if (e.unitType === 'morpheme_fragment' || e.entryType === 'morpheme_fragment') continue;
  if (id.startsWith('kb-otaff51-')) {
    if (e.furigana === 'たんご' || e.kanji.length > 16) {
      BAD_OTAFF_IDS.add(id);
      continue;
    }
    // Also retire known broken truncated otaff stems without ending
    if (['はさまれ', '巻き込まれ', '盛り付け', '次の掃除のときに汚れがよく落ちるようにな'].includes(e.kanji)) {
      BAD_OTAFF_IDS.add(id);
      continue;
    }
  }
  const surf = e.kanji.trim();
  if (!masterBySurface.has(surf)) masterBySurface.set(surf, []);
  masterBySurface.get(surf).push({ id, ...e });
}

// Known K+hira+K compound bases (longest-first checked against ruby sequences)
const COMPOUND_VERBS_NOUNS = [
  '組み合わせ', '合わせて', '合わせる', '合わせておこなう',
  '持ち込み', '持ち込む', '持ち込まない', '持ち込んで', '持ち込まず', '持ち込んでしまう',
  '持ち上げる', '持ち上げた', '持ち上げて', '持ち上げよう',
  '取り除く', '取り除き', '取り除こう', '取り除いた',
  '取り出す', '取り出せる', '取り出した',
  '取り扱う', '取り扱い', '取り扱って',
  '受け入れる', '受け入れた', '受け入れて', '受け入れず',
  '巻き込まれる', '巻き込まれ', '巻き込む', '巻き込み',
  '引っ掛かる', '引っ掛かって', '引っ掛かり',
  '洗い流す', '洗い流し', '洗い流さず', '洗い流した', '洗い流して',
  '拭き取る', '拭き取り', '拭き取って', 'ふき取る', 'ふき取って',
  '吹きつける', '噴きつける', '噴きつけて', '吹きかけて', '噴きつけ', '吹き付ける',
  '見つける', '見つけたら', '見つけた', '見つけて', '見つけ', '見つけにくい', '見つけられない', '見つけやすくなる',
  '立ち上がる', '立ち上がり', '立ち上がって',
  '詰め込む', '詰め込んだ', '詰め込んでは',
  '切り替える', '切り替え', '切り替えるとき',
  '引き起こす', '引き起こし', '引き起こした',
  '間違っている', '間違える', '間違えない', '間違って', '間違えた', '間違えて', '間違えたり',
  '当てはまる', '当てはまるもの',
  '決められている', '決められた', '決める', '決めて', '決めた',
  '書かれている', '書いて', '書く', '書かない', '書いたり',
  '知らされる', '知らせる', '知らせ', '知らせない', '知らせずに',
  '表している', '表す', '表した',
  '使い捨て', '投げ出し', '出し入れ', '先入れ', '先出し', '盛り付け', '盛り付ける', '盛り付けて',
  '切れ端', '切れ口', '殻付き卵', '殻付き', '皮付き', '骨付き', '目分量', '見た目', '着方', '扱い方', '守り方', '動き方',
  '開き止め', '押し板', '瓶詰め', '缶詰', '手洗い', '履き物', '食べ物', '飲み物', '生き物', '生きている',
  '立ち入り', '立入禁止', '飛び出し', '動き出す', '動き出して', '走り出す', 'すり減り', 'すり減った', 'かみ合わせ',
  '組み立て', '組み立てる', '締め付け', '締め付ける', 'ゆるみ', 'こぼれたり', 'こぼれ',
  'くさり手袋', 'メクセル手袋', '特定原材料に準ずるもの', '一般衛生管理', '重要管理点',
  '作業手順書', '衛生管理計画', '安全保護具', '消毒用アルコール', '次亜塩素酸ナトリウム',
];

// Extract raw HTML tokens so we have exact <ruby> reading annotations per position!
function parseHtmlSegments(html) {
  const clean = String(html || '')
    .replace(/\*\*/g, '')
    .replace(/^\[(?:イラスト|標識|図|写真|品目)[A-Za-z0-9]+\]\s*/u, '');
  const segs = [];
  let last = 0;
  const re = /<ruby>([^<]+)<rt>([^<]*)<\/rt><\/ruby>/g;
  for (const m of clean.matchAll(re)) {
    if (m.index > last) {
      const txt = clean.slice(last, m.index).replace(/<[^>]+>/g, '');
      if (txt) segs.push({ kind: 'text', s: txt });
    }
    segs.push({ kind: 'ruby', s: m[1].trim(), rt: m[2].trim() });
    last = m.index + m[0].length;
  }
  if (last < clean.length) {
    const txt = clean.slice(last).replace(/<[^>]+>/g, '');
    if (txt) segs.push({ kind: 'text', s: txt });
  }
  return segs;
}

// Build map: plainCharIndex -> readingChar for any character covered by <ruby>
function buildPlainAndReading(html) {
  const segs = parseHtmlSegments(html);
  let plain = '';
  const rubySpans = []; // { start, end, base, rt }
  for (const seg of segs) {
    if (seg.kind === 'ruby') {
      const start = plain.length;
      plain += seg.s;
      rubySpans.push({ start, end: plain.length, base: seg.s, rt: seg.rt });
    } else {
      plain += seg.s;
    }
  }
  return { plain, rubySpans };
}

// Reconstruct exact reading of substring [start, end) using rubySpans + kana!
function deriveReadingForSpan(plain, rubySpans, start, end) {
  let out = '';
  let i = start;
  while (i < end) {
    const r = rubySpans.find(sp => sp.start === i && sp.end <= end);
    if (r) {
      out += r.rt;
      i = r.end;
    } else {
      const ch = plain[i];
      // Convert katakana to hiragana for pure hiragana reading!
      const code = ch.charCodeAt(0);
      if (code >= 0x30a1 && code <= 0x30f6) {
        out += String.fromCharCode(code - 0x60);
      } else if (ch === '・' || ch === ' ' || ch === '　') {
        // skip middle dot in reading or omit
      } else {
        out += ch;
      }
      i++;
    }
  }
  return out;
}

// Let's also check how many ruby-anchored whole words (ruby base + trailing okurigana / compound) exist
// when we tokenize cleanly across all 1,600 contexts!
const allTokens = new Map(); // surface -> { count, readings: Set, inMaster: [...], samples: [] }

// Common hiragana verbal/adjectival inflection endings AFTER a kanji stem
// Match greedily longest valid Japanese verbal/adjectival suffix after a ruby stem, stopping before particles!
const OKURI_RE = /^(?:なければならない|なければなりませんか|なければならないため|なければなりません|なければ|てはいけない|てはいけません|てはいけず|ていませんでした|ていません|ていました|ていなかった|ていますか|ていない|ています|ている|ていた|ておく|ておいた|ておき|ており|てしまう|てしまった|てしまい|てくる|てきた|てみる|てみた|てから|ては|ても|て|でいる|でいた|でいない|で|られる|られない|られた|られて|られず|られ|させる|させない|させた|させて|させ|せる|せない|せた|せて|われる|われ|ないため|ないように|ないか|ないで|ないと|ない|なかった|なく|なくす|くなる|くなり|くなった|くても|く|たい|たがる|たり|たら|たとき|たあと|た|だ|ますか|ます|ました|ません|ましょう|なさい|ながら|やすい|にくい|にくい|ず|ずに|ぬ|う|く|ぐ|す|つ|ぬ|ぶ|む|る|い|かった|くない|ければ|さ|み|き|ぎ|し|ち|に|び|り|方|者|物|中|前|後|用|別|性|化|度|等|群|類)/;

// Let's do a smarter pass: collect all ruby bases and see every context where <ruby> is NOT already matched by a multi-char master word!
let contextCount = 0;
for (let p = 1; p <= 10; p++) {
  const pkg = JSON.parse(fs.readFileSync(`data/latsol-otaff-pm51-${String(p).padStart(2, '0')}.json`, 'utf8'));
  for (const q of pkg.questions) {
    for (const [label, html] of [['P', q.prompt], ...q.options.map(o => [o.id, o.text])]) {
      contextCount++;
      const { plain, rubySpans } = buildPlainAndReading(html);
      // Scan through rubySpans: for each rubySpan, record base + exact following chars (up to 6 hiragana)
      for (let idx = 0; idx < rubySpans.length; idx++) {
        const sp = rubySpans[idx];
        const nextRuby = rubySpans[idx + 1];
        const gapToNext = nextRuby ? plain.slice(sp.end, nextRuby.start) : plain.slice(sp.end);
        const hiraAfter = (gapToNext.match(/^[\u3041-\u3096ー]+/) || [''])[0];
        // Heuristic: check if compound across next ruby!
        let form = sp.base;
        let reading = sp.rt;
        // Just collect every rubySpan's exact base+following hira pattern to see if master already has it as exact kanji OR inflected verb!
        if (!allTokens.has(sp.base)) {
          allTokens.set(sp.base, { base: sp.base, rt: sp.rt, count: 0, exactMaster: (masterBySurface.get(sp.base) || []).length, hiraAfterSamples: new Map() });
        }
        const rec = allTokens.get(sp.base);
        rec.count++;
        if (hiraAfter) {
          rec.hiraAfterSamples.set(hiraAfter.slice(0, 8), (rec.hiraAfterSamples.get(hiraAfter.slice(0, 8)) || 0) + 1);
        }
      }
    }
  }
}

// Which ruby bases do NOT have an exact non-single-kanji or valid match in masterBySurface, OR are kanji stems of verbs/adjs?
const notExactInMaster = [...allTokens.values()].filter(t => t.exactMaster === 0).sort((a, b) => b.count - a.count);
const singleCharWithFollow = [...allTokens.values()].filter(t => t.exactMaster > 0 && t.hiraAfterSamples.size > 0).sort((a, b) => b.count - a.count);

console.log({
  contextCount,
  uniqueRubyBases: allTokens.size,
  exactInMasterCount: allTokens.size - notExactInMaster.length,
  notExactInMasterCount: notExactInMaster.length,
});
console.log('\nTop 50 ruby bases NOT exact in master (need compound or okurigana or new entry):');
for (const t of notExactInMaster.slice(0, 50)) {
  const follows = [...t.hiraAfterSamples.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([s, c]) => `${s}(${c})`).join(', ');
  console.log(`  ${t.base}(${t.rt}) [${t.count}x] -> ${follows}`);
}

console.log('\nTop 30 ruby bases exact in master BUT ALSO followed by okurigana/particles (check verbs like 正->しい/しく, 水 vs 洗い):');
for (const t of singleCharWithFollow.slice(0, 30)) {
  const follows = [...t.hiraAfterSamples.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([s, c]) => `${s}(${c})`).join(', ');
  console.log(`  ${t.base}(${t.rt}) [${t.count}x, m=${t.exactMaster}] -> ${follows}`);
}
