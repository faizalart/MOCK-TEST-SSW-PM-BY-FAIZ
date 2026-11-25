import fs from 'node:fs';

const dict = JSON.parse(fs.readFileSync('data/sharedKotobaDictionary.json', 'utf8'));

// Build clean verified master lookup (excluding 92 たんご & 4 known broken terms)
const BAD_IDS = new Set();
const masterByKanji = new Map();
for (const [id, e] of Object.entries(dict.terms || {})) {
  if (!e || e.status !== 'verified' || !e.kanji) continue;
  if (e.unitType === 'morpheme_fragment' || e.entryType === 'morpheme_fragment') continue;
  if (id.startsWith('kb-otaff51-')) {
    if (e.furigana === 'たんご' || e.kanji.length > 16 || ['はさまれ', '巻き込まれ', '盛り付け', '次の掃除のときに汚れがよく落ちるようにな'].includes(e.kanji)) {
      BAD_IDS.add(id);
      continue;
    }
  }
  const k = e.kanji.trim();
  if (!masterByKanji.has(k)) masterByKanji.set(k, []);
  masterByKanji.get(k).push({ id, ...e });
}

// Helper: decompose html into plain + per-char ruby annotations
function parseHtml(html) {
  const s = String(html || '')
    .replace(/\*\*/g, '')
    .replace(/^\[(?:イラスト|標識|図|写真|品目|保護具)[A-Za-z0-9]+\]\s*/u, '');
  let plain = '';
  const rubyAt = []; // rubyAt[startIdx] = { base, rt, end }
  let last = 0;
  const re = /<ruby>([^<]+)<rt>([^<]*)<\/rt><\/ruby>/g;
  for (const m of s.matchAll(re)) {
    if (m.index > last) {
      plain += s.slice(last, m.index).replace(/<[^>]+>/g, '');
    }
    const base = m[1].trim();
    const rt = m[2].trim();
    const start = plain.length;
    plain += base;
    rubyAt[start] = { start, end: plain.length, base, rt };
    last = m.index + m[0].length;
  }
  if (last < s.length) {
    plain += s.slice(last).replace(/<[^>]+>/g, '');
  }
  return { plain, rubyAt };
}

function getReading(plain, rubyAt, start, end) {
  let out = '';
  let i = start;
  while (i < end) {
    const r = rubyAt[i];
    if (r && r.end <= end) {
      out += r.rt;
      i = r.end;
    } else {
      const ch = plain[i];
      const code = ch.charCodeAt(0);
      if (code >= 0x30a1 && code <= 0x30f6) {
        out += String.fromCharCode(code - 0x60);
      } else if (ch === '・' || ch === ' ' || ch === '　') {
        // omit delimiter in reading
      } else {
        out += ch;
      }
      i++;
    }
  }
  return out;
}

// Curated multi-kanji / kanji+kana compound phrases so we don't split important SSW PM words
const COMP_EXPRESSIONS = [
  // Multi-word compound verbs / adjectives / nouns common in OTAFF SSW PM 5.1
  '特定原材料に準ずるもの', '特定原材料', '一般衛生管理', '重要管理点',
  '消毒用アルコール', '次亜塩素酸ナトリウム', '作業手順書', '衛生管理計画',
  '安全保護具', '安全標識', '化学的危害要因', '物理的危害要因', '生物的危害要因', '危害要因',
  '食中毒菌', 'アニサキス食中毒', 'ヒスタミン食中毒', '腸炎ビブリオ', 'セレウス菌',
  'ウェルシュ菌', 'カンピロバクター', 'ノロウイルス', 'ボツリヌス菌', 'サルモネラ菌', '黄色ブドウ球菌',
  'Ｘ線異物検出機', 'X線異物検出機', 'エアーシャワー', 'ペーパータオル', 'メクセル手袋', 'くさり手袋',
  '殻付き卵', '凍結卵', '液卵', '生鮮魚介類', '穀類加工品', '食肉製品', '冷凍水産物', '冷凍食肉',
  '固形油脂', '液状油脂', '表示義務', '表示推奨', '食品表示',
  '先入れ・先出し', '先入れ', '先出し', 'ヒヤリ・ハット', 'フールプルーフ',
  '組み合わせ', '合わせて', '取り除く', '取り除き', '取り除いた', '取り除こう',
  '持ち込み', '持ち込む', '持ち込まない', '持ち込んで', '持ち込まず',
  '持ち上げる', '持ち上げた', '持ち上げて', '持ち上げよう',
  '受け入れる', '受け入れた', '受け入れて', '受け入れず',
  '巻き込まれる', '巻き込まれ', '巻き込む', '巻き込み',
  '引っ掛かる', '引っ掛かって', '引っ掛かり', '引っかかり', '引っかかる',
  '洗い流す', '洗い流し', '洗い流さず', '洗い流した', '洗い流して',
  '拭き取る', '拭き取り', '拭き取って', 'ふき取る', 'ふき取って',
  '吹きつける', '噴きつける', '噴きつけて', '噴きつけ', '吹きかけて', '吹き付ける',
  '見つける', '見つけたら', '見つけた', '見つけて', '見つけ', '見つけにくい', '見つけられない',
  '見分ける', '見分け', '立ち上がる', '立ち上がり', '立ち上がって',
  '詰め込む', '詰め込んだ', '詰め込んでは',
  '切り替える', '切り替え', '引き起こす', '引き起こし', '引き起こした',
  '間違っている', '間違える', '間違えない', '間違って', '間違えた', '間違えて', '間違えたり',
  '当てはまる', '決められている', '決められた', '決める', '決めて', '決めた',
  '書かれている', '書いて', '書く', '書かない', '書いたり',
  '知らされる', '知らせる', '知らせ', '知らせない', '知らせずに',
  '表している', '表す', '表した', '使い捨て', '投げ出し', '出し入れ',
  '盛り付ける', '盛り付けて', '盛り付け', '切れ端', '切れ口', '皮付き', '骨付き',
  '目分量', '見た目', '着方', '扱い方', '守り方', '動き方', '運び方', '持ち方', '記録のしかた', 'しかた',
  '開き止め', '押し板', '瓶詰め', '瓶詰', '缶詰', '手洗い', '履き物', '食べ物', '飲み物', '生き物',
  '立入禁止', '立ち入り', '飛び出し', '動き出す', '動き出して', '走り出す',
  'すり減り', 'すり減った', 'かみ合わせ', '組み立て', '組み立てる', '締め付け', '締め付ける',
  '報告し合い', '報告し合って', '話し合い', '声をかけ合い', '声をかけて', '声をかける',
  '習慣付け', 'Habit', '20品目', '9品目', '品目', '番目', '種類',
];

// Let's also check ALL master multi-char terms that do NOT end cleanly in dangling particles
// Actually let's test extracting EVERY span not covered by existing valid master terms OR ruby+okuri!
// First, let's build a list of ALL unique tokens extracted by simple rule:
// 1. Ruby runs that cover compound expressions or kanji + trailing verb/adj inflection
// 2. Remaining Katakana sequences
// 3. Remaining ASCII/unit sequences
// 4. Remaining Hiragana words (segmented with Intl.Segmenter + manual merge checks)

const segJa = new Intl.Segmenter('ja', { granularity: 'word' });

const conjCandidates = new Map(); // surface -> { reading, count, inMaster, rubyBases, examples }
const hiraWords = new Map();
const kataWords = new Map();
const alphaWords = new Map();

// Match longest verbal/adjectival suffix after a kanji stem when NOT crossing particle boundaries!
const INFLECT_TAIL = /^(?:なければなりませんか|なければならない|てはいけない|てはいけません|てはいけず|ていませんでした|ていません|ていました|ていなかった|ていますか|ていない|ています|ている|ていた|ておく|ておいた|ておき|ており|てしまう|てしまった|てしまい|てくる|てきた|てみる|てみた|てから|ては|ても|て|でいる|でいた|でいない|で|られる|られない|られた|られて|られず|られ|させる|させない|させた|させて|させ|せる|せない|せた|せて|われる|われ|ないように|ないか|ないで|ない|なかった|なく|なくなる|くなり|くなった|くなる|くても|く|たい|たがる|たり|たら|た|だ|ますか|ます|ました|ません|ましょう|なさい|ながら|やすい|にくい|ず|ずに|ぬ|う|く|ぐ|す|つ|ぶ|む|る|い|かった|くない|ければ)/;

const NO_ATTACH_HIRA = new Set(['は', 'が', 'を', 'に', 'で', 'と', 'も', 'や', 'の', 'へ', 'から', 'まで', 'より', 'など', 'か', 'ね', 'よ']);

// Walk every context and see what remains if we greedily match:
// 1) COMP_EXPRESSIONS (if starting at position)
// 2) multi-char masterByKanji verified terms (NOT single-kanji unless boundary-clean!)
// 3) ruby + okurigana (when ruby base is a verb/adj stem ending in non-noun okurigana like 違+う, 硬+い, 並+べて)
// Let's test and see EVERY unique token found!
const masterMulti = [...masterByKanji.keys()]
  .filter(k => [...k].length >= 2)
  .sort((a, b) => b.length - a.length);

for (let p = 1; p <= 10; p++) {
  const pkg = JSON.parse(fs.readFileSync(`data/latsol-otaff-pm51-${String(p).padStart(2, '0')}.json`, 'utf8'));
  for (const q of pkg.questions) {
    for (const [label, html] of [['P', q.prompt], ...q.options.map(o => [o.id, o.text])]) {
      const { plain, rubyAt } = parseHtml(html);
      let i = 0;
      while (i < plain.length) {
        const ch = plain[i];
        // Skip structural punctuation & whitespace
        if (/[\s、。・「」『』（）()／→：；,."'%％℃\-+〜～【】◎×○0-9０-９]/.test(ch)) {
          i++;
          continue;
        }

        // Check curated COMP_EXPRESSIONS first
        let matched = null;
        for (const ce of COMP_EXPRESSIONS) {
          if (plain.startsWith(ce, i)) {
            // If immediately followed by okurigana (not particle)? No, COMP_EXPRESSIONS already includes inflections or full compounds!
            matched = ce;
            break;
          }
        }
        if (matched) {
          const end = i + matched.length;
          const r = getReading(plain, rubyAt, i, end);
          if (!conjCandidates.has(matched)) conjCandidates.set(matched, { surface: matched, reading: r, count: 0, inMaster: (masterByKanji.get(matched) || []).length, sample: plain });
          conjCandidates.get(matched).count++;
          i = end;
          continue;
        }

        // Check if current position has a <ruby> span
        if (rubyAt[i]) {
          const rSpan = rubyAt[i];
          // Look if adjacent kanji/ruby compound exists in masterMulti
          let mHit = null;
          for (const mk of masterMulti) {
            if (plain.startsWith(mk, i) && mk.length >= rSpan.base.length) {
              // Ensure we don't split a verb stem + trailing okurigana! E.g. 間違 + っている -> don't match 間違 as noun if followed by って!
              const nextChar = plain[i + mk.length] || '';
              // Only skip master hit if mk lacks okurigana and is followed by ruby/verbal suffix? Actually masterMulti terms are complete words/inflections like 間違っている or nouns like 作業服!
              // Exception: what if master has "作業" and text has "作業服"? masterMulti is sorted longest-first, so "作業服" matches BEFORE "作業"!
              // Exception: what if master has "安全" and text has "安全ではない"? "安全" is followed by "ではない" which is fine!
              // Exception: what if master has "衛生" and text has "衛生管理"? "衛生管理" is longer so it matches first!
              // Exception: what if master has "食肉" and text has "食肉製品"? "食肉製品" is longer!
              mHit = mk;
              break;
            }
          }
          if (mHit) {
            // Wait! What if mHit is a verb stem or adjective kanji without okurigana? Wait: check if next char is hiragana inflection like い/く/って/ない/る/た/し
            // e.g. if master had "正" (length 1) we excluded length 1 from masterMulti!
            // What if master had "確認" and text has "確認する"? Wait: in Japanese Kotoba, "確認する" or "確認" + "する" — both work, wait let's check what nguyen-01 does (`使用する` = one entry!).
            const end = i + mHit.length;
            const r = getReading(plain, rubyAt, i, end);
            if (!conjCandidates.has(mHit)) conjCandidates.set(mHit, { surface: mHit, reading: r, count: 0, inMaster: (masterByKanji.get(mHit) || []).length, sample: plain });
            conjCandidates.get(mHit).count++;
            i = end;
            continue;
          }

          // Otherwise: consume ruby + attached okurigana (if not single particle!)
          const after = plain.slice(rSpan.end);
          let extLen = 0;
          // If base ends in kanji and after starts with okurigana matching a verb/adj conjugation:
          // Careful: distinguish particle `が`, `で`, `を`, `は`, `に`, `の`, `と`, `も`, `や` after nouns!
          // How do we know if <ruby>BASE<rt>RT</rt></ruby> is a noun followed by a particle vs a verb stem followed by okurigana?
          // Inspect master: if BASE itself is a standalone noun in master OR if `rt` already looks like a complete noun (not needing okuri), be careful with single-hiragana `で/に/が/と/の/は/を/も/や`!
          const mTail = after.match(INFLECT_TAIL);
          // Only attach INFLECT_TAIL automatically when `masterByKanji.has(rSpan.base)` is false OR when the tail is clearly verbal (not standalone `で/に/と/から/まで/な/だ/である/か` unless `rt` is a known verb stem!)
          // Actually let's just record ALL (rubyBase + first few hira) if not matched in master!
          const surf = rSpan.base;
          const r = rSpan.rt;
          const nextHira = (after.match(/^[\u3041-\u3096]+/) || [''])[0].slice(0, 6);
          const key = `${surf}|${nextHira}`;
          if (!conjCandidates.has(key)) conjCandidates.set(key, { surface: surf, reading: r, nextHira, count: 0, inMaster: (masterByKanji.get(surf) || []).length, sample: plain });
          conjCandidates.get(key).count++;
          i = rSpan.end;
          continue;
        }

        // Check Katakana run
        if (/[\u30a1-\u30f6]/.test(ch)) {
          const km = plain.slice(i).match(/^[\u30a1-\u30f6ー]+(?:・[\u30a1-\u30f6ー]+)*/);
          const kw = km[0];
          if (!kataWords.has(kw)) kataWords.set(kw, { surface: kw, reading: getReading(kw, [], 0, kw.length), count: 0, inMaster: (masterByKanji.get(kw) || []).length, sample: plain });
          kataWords.get(kw).count++;
          i += kw.length;
          continue;
        }

        // Check ASCII letters run
        if (/[A-Za-z]/.test(ch)) {
          const am = plain.slice(i).match(/^[A-Za-z0-9\-]+/);
          const aw = am[0];
          alphaWords.set(aw, (alphaWords.get(aw) || 0) + 1);
          i += aw.length;
          continue;
        }

        // Check Hiragana run
        if (/[\u3041-\u3096ー]/.test(ch)) {
          const hm = plain.slice(i).match(/^[\u3041-\u3096ー]+/);
          const hw = hm[0];
          hiraWords.set(hw, (hiraWords.get(hw) || 0) + 1);
          i += hw.length;
          continue;
        }

        // Anything else (single kanji without ruby?!)
        const sk = ch;
        if (!conjCandidates.has(`NO_RUBY:${sk}`)) conjCandidates.set(`NO_RUBY:${sk}`, { surface: sk, reading: '', nextHira: '', count: 0, inMaster: (masterByKanji.get(sk) || []).length, sample: plain });
        conjCandidates.get(`NO_RUBY:${sk}`).count++;
        i++;
      }
    }
  }
}

const unmappedNonMaster = [...conjCandidates.values()]
  .filter(x => x.inMaster === 0 || x.nextHira)
  .sort((a, b) => b.count - a.count);

console.log('Total unique conjCandidates:', conjCandidates.size);
console.log('Matched in master (clean):', [...conjCandidates.values()].filter(x => x.inMaster > 0 && !x.nextHira).length);
console.log('Remaining unmapped or stem+nextHira:', unmappedNonMaster.length);
console.log('Unique Katakana:', kataWords.size, '| inMaster:', [...kataWords.values()].filter(x => x.inMaster > 0).length);
console.log('Unique Alpha:', alphaWords.size, [...alphaWords.entries()]);
console.log('Unique Hiragana runs:', hiraWords.size);

fs.writeFileSync('deliverables/kotoba-repair/phase2-raw-discovery.json', JSON.stringify({
  matchedInMaster: [...conjCandidates.values()].filter(x => x.inMaster > 0 && !x.nextHira).sort((a, b) => b.count - a.count),
  needsResolution: unmappedNonMaster,
  katakana: [...kataWords.values()].sort((a, b) => b.count - a.count),
  alpha: [...alphaWords.entries()].sort((a, b) => b[1] - a[1]),
  hiraganaRuns: [...hiraWords.entries()].sort((a, b) => b[1] - a[1]),
}, null, 2) + '\n', 'utf8');
