import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {
  hasKanji,
  isSingleKanji,
  isValidHiraganaReading,
  stripRubyAndHtml,
  extractQuestionPlainText,
  extractOptionId,
  extractOptionPlainText,
} from '../../scripts/lib/kotoba-pipeline-utils.mjs';
import { validateKotobaPackage } from '../../scripts/validate-kotoba-package.mjs';
import { auditPackageCoverage } from '../../scripts/audit-kotoba-coverage.mjs';

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'deliverables/kotoba-audit-40');
const BASELINE_BACKUP_DIR = path.join(OUT_DIR, 'backups/baseline-20261115/data');

export const PURE_PARTICLES = new Set([
  'を', 'の', 'に', 'が', 'は', 'で', 'と', 'や', 'も', 'へ', 'か', 'ね', 'よ', 'な', 'だ', 'て', 'た', 'ば', 'ず',
  'する', 'し', 'した', 'して', 'しない', 'せず', 'される', 'され', 'された', 'されて', 'できる', 'でき', 'できた', 'できない',
  'いる', 'い', 'いた', 'いて', 'いない', 'おり', 'いては', 'いても', 'いないか',
  'ある', 'あり', 'あっ', 'あった', 'あって', 'ありません', 'あります',
  'なる', 'なり', 'なっ', 'なった', 'なって', 'なら', 'なります', 'ならない',
  'ない', 'なく', 'なかっ', 'なかった', 'ないで', 'ないか',
  'です', 'ます', 'ました', 'ません', 'ませんでした', 'でした', 'ですか', 'ますか', 'ませんか', 'ましょう', 'でしょう', 'でしょうか',
  'である', 'であり', 'であった', 'ではない', 'ではなく', 'でない', 'ではないか',
  'から', 'まで', 'より', 'における', 'についての', 'について', 'に対して', 'にとって', 'として', 'とは', 'において', 'による', 'によって',
  'ながら', 'たり', 'だり', 'ても', 'でも', 'なら', 'しかし', 'また', 'および', 'または', 'なお', 'つまり', 'あるいは',
  'この', 'その', 'あの', 'どの', 'これ', 'それ', 'あれ', 'どれ', // note: どれ IS in HIRA_LEXICAL below when checked explicitly
  'ここ', 'そこ', 'あそこ', 'そんな', 'こんな', 'あんな', 'どんな',
  'って', 'る', 'れる', 'られる', 'せる', 'させる', 'ておく', 'おく', 'おき', 'おいて', 'しまう', 'しまい', 'しまった', 'くれる',
  'よう', 'ように', 'ような', 'そう', 'そうに', 'という', 'といった', 'とか', 'だけ', 'しか', 'ばかり', 'ほど', 'くらい', 'ぐらい', 'こそ', 'さえ', 'ごと', 'ごとに',
  'のです', 'ためです', 'からです', 'おらず', 'だろう', 'ところ', 'とおり', 'どおり', 'あたり', 'わけ', 'はず', 'べき', 'べく',
  'ください', 'なさい', 'なさいませ', 'もの', 'こと', 'ため', 'などに', 'など', 'ので', 'のに', 'ほか', 'ほかの',
  'ています', 'ていない', 'ている', 'ていた', 'てはいけません', 'てはいけない',
  'なければなりません', 'なければならない', 'なければ', 'なくても', 'なくてもよい', 'てもよい', 'てもいい',
]);
// Wait: remove 'どれ' from PURE_PARTICLES so 'どれ' MUST be mapped as a lexical question word!
PURE_PARTICLES.delete('どれ');

export const HIRA_LEXICAL = new Set([
  // Original OTAFF HIRA_LEXICAL
  'せっけん', 'ほこり', 'やけど', 'やっつける', 'おこなわれている', 'おこなわれる', 'おこなわれ', 'おこない', 'おこなう', 'おこなった', 'おこなって', 'おこなわない', 'そのまま', 'すりこむ', 'なくす', 'なくなる', 'おそれ',
  'たばこ', 'ぞうきん', 'たわし', 'かぼちゃ', 'じゃがいも', 'たまねぎ', 'にんじん', 'おにぎり', 'くさり', 'うがい',
  'はさまれる', 'はさまれ', 'はさまって', 'はさまっている', 'はさみ', 'ころぶ', 'こぼれる', 'こぼれ', 'ぶつからない', 'ぶつかって', 'ぶつかった', 'ぶつかり', 'ぶつかる', 'つまずく', 'つまって', 'つまった', 'すべる', 'すべり', 'すべらない', 'しゃがむ', 'つぶれたり', 'つぶれ', 'つぶって',
  'あご', 'ひじ', 'ほほ', 'かかと', 'おなか', 'おしり', 'まぶた', 'くしゃみ', 'うろこ', 'せき', 'かたまり', 'ごみ', 'けが', 'いのち', 'まもる', 'そろえる', 'はかる', 'まくり', 'めったに',
  'うっかり', 'わざと', 'あらかじめ', 'きちんと', 'しっかり', 'ゆっくりと', 'ゆっくり', 'ていねい', 'まったく', 'すべて', 'おいしさ', 'もっと',
  'それぞれ', 'どちら', 'いつも', 'かならず', 'なるべく', 'できるだけ', 'たくさん', 'かなり', 'ほとんど', 'あまり',
  'よく', 'すぐ', 'すぐに', 'とくに', 'さらに', 'まず', 'もう', 'まだ', 'もし', 'なぜ', 'いつ', 'どこ', 'どれ', 'どう', 'ひとり', 'すでに', 'おろそか',
  'えび', 'かに', 'くるみ', 'そば', 'さば', 'いか', 'たこ', 'あさり', 'しじみ', 'はまぐり', 'あわび', 'うに', 'いくら', 'さけ', 'かき', 'くらげ', 'なまこ', 'わかめ',
  'りんご', 'ぶどう', 'いちご', 'もも', 'ぶり', 'ぎゅうにゅう', 'ふた', 'あわてて', 'はずかしい', 'ぶかぶか', 'ぎっしり', 'ひらひら', 'まっすぐ', 'すみずみ', 'ぐらぐら', 'ふらつき', 'かゆみ', 'じんましん',
  'さっと', 'じゅうぶん', 'うまく', 'よい', 'いい', 'もとづく', 'つながる', 'つながり', 'かぶった', 'かぶる', 'かぶり', 'ぬぐ', 'ぶつける', 'おさえる', 'さわる', 'つまみ出す', 'つまみ', 'ふかく', 'ふかい',
  'とき', 'あと', 'うち', 'まま', 'ころがる', 'たまる', 'つまる', 'はずれる', 'ゆるむ', 'こわれる', 'きれる', 'かえる', 'もらえる',
  'はずす', 'つける', 'つけ', 'かける', 'あてる', 'あてて', 'ふむ', 'かむ', 'すう', 'のむ', 'しく', 'おりる', 'くぐる', 'みみ', 'めん', 'うすい', 'ついている', 'ついて',
  'おおい', 'あげる', 'かわく', 'おいしい', 'おいしく', 'やすい', 'やすく', 'にくい', 'にくく', 'すすぎ', 'すいて', 'まいて', 'しやすい', 'しやすく', 'なりやすい', 'なりやすく', 'すべき',
  // Extended legacy hiragana lexical vocabulary discovered across 50 packages
  'きれい', 'きれいな', 'まちがっている', 'えらびなさい', 'えらんで', 'ただしい', 'おきます', 'つかった',
  'めまい', 'たちくらみ', 'ふらついて', 'ふきとる', 'あめ', 'ゆか', 'たまご', 'すし', 'びんづめ', 'はげしい',
  'すばやく', 'なかなか', 'つねに', 'くっつかない', 'きかい', 'きぐ', 'せんじょう', 'かたずけます', 'かくにん',
  'せいかつ', 'せいけつ', 'せいり', 'せいとん', 'ふくそう', 'けっか', 'じゅうような', 'ほうこく', 'ぞうしょく',
  'あいだ', 'あらいます', 'だれ', 'だれにも', 'もつ', 'とる', 'やる', 'なし', 'あたって', 'ほかに',
]);

export const SEGMENT_ATTACHED_PARTICLES = new Set([
  'を', 'の', 'に', 'が', 'は', 'で', 'と', 'や', 'も', 'へ', 'か', 'ね', 'よ', 'ば', 'から', 'まで', 'より', 'だ', 'な', 'でも',
  'して', 'する', 'し', 'した', 'しない', 'せず',
]);

export const TECHNICAL_ASCII = new Set([
  'ppm', 'ml', 'kg', 'g', 'L', 'm', 'HACCP', 'CCP', 'ＣＣＰ', 'HA', 'KYT', 'FIFO', 'OTAFF', 'SNS', '5S', 'O157', 'O111',
  'NaClO', 'NaCl', 'NaC1O', 'NAClO', 'X', 'Ｘ', 'CC',
]);

const PREFIX_MARKER_RE = /^(?:\[(?:イラスト|標識|図|写真|品目|保護具|画像)[A-Za-z0-9]+\]\s*)+/u;
const segJa = new Intl.Segmenter('ja', { granularity: 'word' });

export function cleanContextText(html) {
  return stripRubyAndHtml(String(html || '').replace(/\*\*/g, '')).replace(PREFIX_MARKER_RE, '');
}

function getAllOffsets(haystack, needle) {
  const out = [];
  if (!needle) return out;
  let idx = haystack.indexOf(needle);
  while (idx !== -1) {
    out.push(idx);
    idx = haystack.indexOf(needle, idx + 1);
  }
  return out;
}

export function buildKnownLexiconIndex(dict, { excludeGrammar = true } = {}) {
  const map = new Map();
  for (const e of Object.values(dict.terms || {})) {
    if (!e || e.status !== 'verified' || !e.kanji) continue;
    if (e.unitType === 'morpheme_fragment' || e.entryType === 'morpheme_fragment') continue;
    const k = e.kanji.trim();
    if ([...k].length < 2) continue;
    if (excludeGrammar && PURE_PARTICLES.has(k)) continue;
    if (/^[A-Za-z]+$/.test(k) && !TECHNICAL_ASCII.has(k)) continue;
    const c = k[0];
    if (!map.has(c)) map.set(c, []);
    map.get(c).push(k);
  }
  for (const arr of map.values()) arr.sort((a, b) => b.length - a.length);
  return map;
}

export function validateStrictContext({
  contextKey,
  html,
  termIds,
  dict,
  knownLexiconIndex = null,
}) {
  const errors = [];
  const plain = cleanContextText(html);
  const terms = dict.terms || {};

  if (!Array.isArray(termIds)) {
    errors.push({ code: 'MISSING_MAPPING_ARRAY', contextKey, message: 'termIds must be an array' });
    return errors;
  }

  const resolved = [];
  for (const id of termIds) {
    const e = terms[id];
    if (!e || e.status !== 'verified') {
      errors.push({ code: 'DANGLING_OR_UNVERIFIED_TERM', contextKey, termId: id, message: `Dangling or unverified termId: ${id}` });
      continue;
    }
    if (e.furigana === 'たんご') {
      errors.push({ code: 'PLACEHOLDER_TANGO_READING', contextKey, termId: id, message: `Placeholder たんご reading on ${id} (${e.kanji})` });
    }
    if (hasKanji(e.kanji) && (!e.furigana || !isValidHiraganaReading(e.furigana) || !/^[\u3041-\u3096ー]+$/.test(e.furigana))) {
      errors.push({ code: 'INVALID_KANJI_FURIGANA', contextKey, termId: id, message: `Invalid furigana "${e.furigana}" on kanji term ${id} (${e.kanji})` });
    }
    if (!e.arti || e.arti.length > 60) {
      errors.push({ code: 'MEANING_TOO_LONG', contextKey, termId: id, message: `Meaning missing or >60 chars (${e.arti?.length}) on ${id}` });
    }
    if ((e.unitType === 'inflected_verb' || e.unitType === 'inflected_adj') && !e.dictForm) {
      errors.push({ code: 'INFLECTED_MISSING_DICTFORM', contextKey, termId: id, message: `Inflected term missing dictForm on ${id} (${e.kanji})` });
    }
    if (!plain.includes(e.kanji)) {
      errors.push({ code: 'SURFACE_NOT_IN_CONTEXT', contextKey, termId: id, message: `Mapped term "${e.kanji}" (${id}) not found in context text` });
      continue;
    }
    resolved.push(e);
  }

  // Track character offsets per resolved term
  const coveredOffsets = resolved.map(e => ({
    e,
    len: e.kanji.length,
    offsets: getAllOffsets(plain, e.kanji),
  }));

  // Substring kanji collision check
  for (const item of coveredOffsets) {
    if (!hasKanji(item.e.kanji)) continue;
    const isIndependentSomewhere = item.offsets.some(pos => {
      const end = pos + item.len;
      const swallowedByLonger = coveredOffsets.some(other =>
        other.e.id !== item.e.id &&
        other.len > item.len &&
        other.offsets.some(op => op <= pos && op + other.len >= end)
      );
      if (swallowedByLonger) return false;

      if (isSingleKanji(item.e.kanji)) {
        const leftIsKanji = pos > 0 && hasKanji(plain[pos - 1]);
        const rightIsKanji = end < plain.length && hasKanji(plain[end]);
        const leftCoveredToBoundary = coveredOffsets.some(o => o.e.id !== item.e.id && o.offsets.some(op => op + o.len === pos));
        const rightCoveredFromBoundary = coveredOffsets.some(o => o.e.id !== item.e.id && o.offsets.some(op => op === end));
        if ((leftIsKanji && !leftCoveredToBoundary) || (rightIsKanji && !rightCoveredFromBoundary)) {
          return false;
        }
      }
      return true;
    });

    if (!isIndependentSomewhere) {
      errors.push({
        code: 'SUBSTRING_KANJI_COLLISION',
        contextKey,
        termId: item.e.id,
        message: `Substring collision: "${item.e.kanji}" (${item.e.id}) only appears inside another compound in "${plain.slice(0, 60)}"`,
      });
    }
  }

  // Character coverage mask
  const coveredMask = new Uint8Array(plain.length);
  for (const item of coveredOffsets) {
    for (const pos of item.offsets) {
      for (let k = pos; k < pos + item.len; k++) coveredMask[k] = 1;
    }
  }

  // 1) Word segment completeness check
  for (const seg of segJa.segment(plain)) {
    const w = seg.segment;
    const start = seg.index;
    const end = start + w.length;
    let allCovered = true;
    for (let k = start; k < end; k++) {
      if (!coveredMask[k]) { allCovered = false; break; }
    }
    if (allCovered) continue;

    if (/^[\s、。・「」『』（）()／→：；,."'%％℃°\-+〜～【】◎×○0-9０-９①-⑩!！※\[\]．＋\?？]+$/.test(w)) continue;
    if (/^[A-Za-z]+$/.test(w) && !TECHNICAL_ASCII.has(w)) continue;
    if (PURE_PARTICLES.has(w)) continue;

    let someCovered = false;
    const uncoveredRuns = [];
    let cur = '';
    for (let k = start; k < end; k++) {
      if (coveredMask[k]) {
        someCovered = true;
        if (cur) { uncoveredRuns.push(cur); cur = ''; }
      } else {
        cur += plain[k];
      }
    }
    if (cur) uncoveredRuns.push(cur);
    if (someCovered && uncoveredRuns.length > 0 && uncoveredRuns.every(u => SEGMENT_ATTACHED_PARTICLES.has(u))) {
      continue;
    }

    const isKanjiWord = hasKanji(w);
    const isMultiKatakana = /^[\u30A1-\u30F6ー]{2,}$/.test(w);
    const isHiraLex = HIRA_LEXICAL.has(w);
    const isTechCode = TECHNICAL_ASCII.has(w);

    if (isKanjiWord || isMultiKatakana || isHiraLex || isTechCode) {
      errors.push({
        code: 'MISSING_LEXICAL_TERM',
        contextKey,
        surface: w,
        message: `Unmapped lexical term "${w}" at index ${start} of ${contextKey}`,
      });
    }
  }

  // 2) Full-width or multi-char TECHNICAL_ASCII (e.g., ＣＣＰ, NaClO, 5S) uncovered anywhere
  for (const tech of TECHNICAL_ASCII) {
    if (tech.length < 2) continue;
    for (const pos of getAllOffsets(plain, tech)) {
      let covered = true;
      for (let k = pos; k < pos + tech.length; k++) {
        if (!coveredMask[k]) { covered = false; break; }
      }
      if (covered) continue;
      const prev = pos > 0 ? plain[pos - 1] : '';
      const next = pos + tech.length < plain.length ? plain[pos + tech.length] : '';
      if (/[A-Za-z0-9]/.test(prev) || /[A-Za-z0-9]/.test(next)) continue;
      if (!errors.some(e => e.code === 'MISSING_LEXICAL_TERM' && e.surface === tech)) {
        errors.push({
          code: 'MISSING_LEXICAL_TERM',
          contextKey,
          surface: tech,
          message: `Unmapped technical ASCII term "${tech}" at index ${pos} of ${contextKey}`,
        });
      }
    }
  }

  // 3) Check uncovered HIRA_LEXICAL words even if segmenter split them differently (e.g. ただしい -> ただし+い)
  for (const hw of HIRA_LEXICAL) {
    if (hw.length < 3) continue; // check >=3-char lexical hiragana deterministically without 2-char particle collisions inside words
    for (const pos of getAllOffsets(plain, hw)) {
      let covered = true;
      for (let k = pos; k < pos + hw.length; k++) {
        if (!coveredMask[k]) { covered = false; break; }
      }
      if (covered) continue;
      // Ensure not in the middle of another covered run, and boundaries don't split a kanji/katakana word
      let anyCovered = false;
      for (let k = pos; k < pos + hw.length; k++) if (coveredMask[k]) { anyCovered = true; break; }
      if (anyCovered) continue;
      // Boundary check against known particles vs prefix of longer kana word
      const prev = pos > 0 ? plain[pos - 1] : '';
      const next = pos + hw.length < plain.length ? plain[pos + hw.length] : '';
      if (prev && /[\u3041-\u3096]/.test(prev) && !['を', 'の', 'に', 'が', 'は', 'で', 'と', 'や', 'も', 'へ', 'か'].includes(prev)) continue;
      if (!errors.some(e => e.code === 'MISSING_LEXICAL_TERM' && e.surface === hw)) {
        errors.push({
          code: 'MISSING_LEXICAL_TERM',
          contextKey,
          surface: hw,
          message: `Unmapped lexical hiragana term "${hw}" at index ${pos} of ${contextKey}`,
        });
      }
    }
  }

  // 4) Known verified dictionary terms uncovered cleanly
  if (knownLexiconIndex) {
    let i = 0;
    while (i < plain.length) {
      if (coveredMask[i]) { i++; continue; }
      const cands = knownLexiconIndex.get(plain[i]) || [];
      let matched = null;
      for (const cand of cands) {
        if (plain.startsWith(cand, i)) {
          let uncovered = true;
          for (let k = i; k < i + cand.length; k++) {
            if (coveredMask[k]) { uncovered = false; break; }
          }
          if (!uncovered) continue;
          const prev = i > 0 ? plain[i - 1] : '';
          const next = i + cand.length < plain.length ? plain[i + cand.length] : '';
          if (hasKanji(cand[0]) && hasKanji(prev)) continue;
          if (hasKanji(cand[cand.length - 1]) && hasKanji(next)) continue;
          if (/^[\u3041-\u3096]+$/.test(cand) && (/[\u3041-\u3096]/.test(prev) || /[\u3041-\u3096]/.test(next))) continue;
          matched = cand;
          break;
        }
      }
      if (matched) {
        errors.push({
          code: 'UNMAPPED_DICTIONARY_TERM',
          contextKey,
          surface: matched,
          message: `Known dictionary term "${matched}" appears uncovered at index ${i} of ${contextKey}`,
        });
        i += matched.length;
      } else {
        i++;
      }
    }
  }

  return errors;
}

export function runNegativeTests() {
  const sampleDict = {
    terms: {
      't-shokuhin': { id: 't-shokuhin', kanji: '食品', furigana: 'しょくひん', unitType: 'noun', arti: 'makanan', status: 'verified' },
      't-anzen': { id: 't-anzen', kanji: '安全', furigana: 'あんぜん', unitType: 'noun', arti: 'keamanan', status: 'verified' },
      't-mamoru': { id: 't-mamoru', kanji: '守る', furigana: 'まもる', dictForm: '守る', unitType: 'inflected_verb', arti: 'mematuhi', status: 'verified' },
      't-sekken': { id: 't-sekken', kanji: 'せっけん', furigana: 'せっけん', unitType: 'noun', arti: 'sabun', status: 'verified' },
      't-arergi': { id: 't-arergi', kanji: 'アレルギー', furigana: 'あれるぎー', unitType: 'noun', arti: 'alergi', status: 'verified' },
      't-furi-bad': { id: 't-furi-bad', kanji: '傷', furigana: 'たんご', unitType: 'noun', arti: 'luka', status: 'verified' },
      't-aida': { id: 't-aida', kanji: '間', furigana: 'かん', unitType: 'noun', arti: 'durasi', status: 'verified' },
      't-funkan': { id: 't-funkan', kanji: '分間', furigana: 'ふんかん', unitType: 'counter', arti: 'selama menit', status: 'verified' },
      't-kanetsu': { id: 't-kanetsu', kanji: '加熱', furigana: 'かねつ', unitType: 'noun', arti: 'pemanasan', status: 'verified' },
      't-draft': { id: 't-draft', kanji: '手洗い', furigana: 'てあらい', unitType: 'noun', arti: 'cuci tangan', status: 'draft' },
    }
  };
  const idx = buildKnownLexiconIndex(sampleDict);

  // Neg 1: Missing Kanji noun (食品 missing)
  const neg1 = validateStrictContext({
    contextKey: 'neg-kanji-noun',
    html: '食品の安全を守る。',
    termIds: ['t-anzen', 't-mamoru'],
    dict: sampleDict,
    knownLexiconIndex: idx,
  });
  assert(neg1.some(e => e.surface === '食品'), 'Neg 1 failed: missing Kanji noun 食品 must fail');

  // Neg 2: Missing conjugated/lexical verb (守る missing)
  const neg2 = validateStrictContext({
    contextKey: 'neg-verb',
    html: '食品の安全を守る。',
    termIds: ['t-shokuhin', 't-anzen'],
    dict: sampleDict,
    knownLexiconIndex: idx,
  });
  assert(neg2.some(e => e.surface === '守る'), 'Neg 2 failed: missing verb 守る must fail');

  // Neg 3: Missing meaningful Hiragana word (せっけん missing)
  const neg3 = validateStrictContext({
    contextKey: 'neg-hira',
    html: 'せっけんで洗う。',
    termIds: [],
    dict: sampleDict,
    knownLexiconIndex: idx,
  });
  assert(neg3.some(e => e.surface === 'せっけん'), 'Neg 3 failed: missing meaningful hiragana せっけん must fail');

  // Neg 4: Missing Katakana word (アレルギー missing)
  const neg4 = validateStrictContext({
    contextKey: 'neg-kata',
    html: '食品のアレルギー。',
    termIds: ['t-shokuhin'],
    dict: sampleDict,
    knownLexiconIndex: idx,
  });
  assert(neg4.some(e => e.surface === 'アレルギー'), 'Neg 4 failed: missing Katakana アレルギー must fail');

  // Neg 5: Dangling or non-verified termId
  const neg5 = validateStrictContext({
    contextKey: 'neg-dangling-draft',
    html: '食品を扱う。',
    termIds: ['t-shokuhin', 'kb-nonexistent-999', 't-draft'],
    dict: sampleDict,
    knownLexiconIndex: idx,
  });
  assert(neg5.filter(e => e.code === 'DANGLING_OR_UNVERIFIED_TERM').length === 2, 'Neg 5 failed: dangling & draft IDs must fail');

  // Neg 6: Placeholder or blank reading on Kanji word
  const neg6 = validateStrictContext({
    contextKey: 'neg-bad-furi',
    html: '傷を保護する。',
    termIds: ['t-furi-bad'],
    dict: sampleDict,
    knownLexiconIndex: idx,
  });
  assert(neg6.some(e => e.code === 'PLACEHOLDER_TANGO_READING'), 'Neg 6 failed: たんご placeholder reading must fail');

  // Neg 7: Wrong-context mapping leak (mapping アレルギー on context that only says 食品の安全)
  const neg7 = validateStrictContext({
    contextKey: 'neg-wrong-ctx',
    html: '食品の安全を守る。',
    termIds: ['t-shokuhin', 't-anzen', 't-mamoru', 't-arergi'],
    dict: sampleDict,
    knownLexiconIndex: idx,
  });
  assert(neg7.some(e => e.code === 'SURFACE_NOT_IN_CONTEXT' && e.termId === 't-arergi'), 'Neg 7 failed: wrong-context mapping must fail');

  // Neg 8: Substring Kanji collision (間 inside 1分間)
  const neg8 = validateStrictContext({
    contextKey: 'neg-substr',
    html: '1分間加熱する。',
    termIds: ['t-aida', 't-kanetsu'],
    dict: sampleDict,
    knownLexiconIndex: idx,
  });
  assert(neg8.some(e => e.code === 'SUBSTRING_KANJI_COLLISION'), 'Neg 8 failed: 間 inside 1分間 must fail');

  // Pos 9: Particle tolerance positive test
  const pos9 = validateStrictContext({
    contextKey: 'pos-particles',
    html: '食品の安全を守る。これは大切です。',
    termIds: ['t-shokuhin', 't-anzen', 't-mamoru', ...(true ? [] : [])],
    dict: {
      terms: {
        ...sampleDict.terms,
        't-taisetsu': { id: 't-taisetsu', kanji: '大切', furigana: 'たいせつ', unitType: 'noun', arti: 'penting', status: 'verified' },
      }
    },
    knownLexiconIndex: idx,
  });
  // Map 大切 to complete the sentence
  const pos9Real = validateStrictContext({
    contextKey: 'pos-particles',
    html: '食品の安全を守る。これは大切です。',
    termIds: ['t-shokuhin', 't-anzen', 't-mamoru', 't-taisetsu'],
    dict: {
      terms: {
        ...sampleDict.terms,
        't-taisetsu': { id: 't-taisetsu', kanji: '大切', furigana: 'たいせつ', unitType: 'noun', arti: 'penting', status: 'verified' },
      }
    },
    knownLexiconIndex: idx,
  });
  assert.equal(pos9Real.length, 0, `Pos 9 failed: expected 0 errors, got ${JSON.stringify(pos9Real)}`);

  console.log('ALL 9 NEGATIVE + POSITIVE VALIDATOR UNIT TESTS PASSED!');
}

function sha256Text(text) {
  return crypto.createHash('sha256').update(String(text || ''), 'utf8').digest('hex');
}

function sha256File(relPath) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, relPath))).digest('hex');
}

export function verifyProtectedAndImmutability({ manifest, dict, mapping }) {
  const snapshot = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'baseline-immutable-snapshot.json'), 'utf8'));
  const baseDict = JSON.parse(fs.readFileSync(path.join(BASELINE_BACKUP_DIR, 'sharedKotobaDictionary.json'), 'utf8'));
  const baseMapping = JSON.parse(fs.readFileSync(path.join(BASELINE_BACKUP_DIR, 'kotobaMapping.json'), 'utf8'));

  // 1. Master sidecar _meta & version parity + attribution
  assert.equal(dict._meta?.schemaVersion, '2.0.0', 'dict schemaVersion must be 2.0.0');
  assert.equal(mapping._meta?.schemaVersion, '2.0.0', 'mapping schemaVersion must be 2.0.0');
  assert.equal(dict._meta?.dataVersion, mapping._meta?.dataVersion, 'dict & mapping dataVersion must match');
  assert(!JSON.stringify(dict).includes('たんご'), 'Placeholder たんご must not exist in sharedKotobaDictionary');

  // 2. Protected 10 OTAFF packages exact file SHA-256 + resolved Kotoba parity
  for (const sid of manifest.protectedReferencePackageIds) {
    const pm = manifest.packages.find(p => p.setId === sid);
    const snapPkg = snapshot.packages[sid];
    assert.equal(sha256File(pm.sourcePath), snapPkg.fileSha256, `PROTECTED FILE HASH CHANGED: ${pm.sourcePath}`);

    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, pm.sourcePath), 'utf8'));
    for (const q of (pkg.questions || pkg)) {
      assert.deepStrictEqual(mapping.questions[q.id], baseMapping.questions[q.id], `PROTECTED MAPPING CHANGED on ${q.id}`);
      for (const id of (mapping.questions[q.id] || [])) {
        assert.deepStrictEqual(dict.terms[id], baseDict.terms[id], `PROTECTED DICT TERM CHANGED on ${id} (used by ${q.id})`);
      }
      for (let oIdx = 0; oIdx < (q.options || []).length; oIdx++) {
        const oid = extractOptionId(q.options[oIdx], oIdx);
        const ck = `${q.id}::${oid}`;
        assert.deepStrictEqual(mapping.options[q.id]?.[oid], baseMapping.options[q.id]?.[oid], `PROTECTED OPT MAPPING CHANGED on ${ck}`);
        assert.deepStrictEqual(mapping.byCompositeKey[ck], baseMapping.byCompositeKey[ck], `PROTECTED CK MAPPING CHANGED on ${ck}`);
        for (const id of (mapping.byCompositeKey[ck] || [])) {
          assert.deepStrictEqual(dict.terms[id], baseDict.terms[id], `PROTECTED DICT TERM CHANGED on ${id} (used by ${ck})`);
        }
      }
    }
  }

  // 3. All 60 packages immutable fields check
  for (const pm of manifest.packages) {
    const snapPkg = snapshot.packages[pm.setId];
    const raw = JSON.parse(fs.readFileSync(path.join(ROOT, pm.sourcePath), 'utf8'));
    const qs = (Array.isArray(raw) ? raw : (raw.questions || [])).filter(q => (q.setId || raw.setId || pm.setId) === pm.setId);
    assert.equal(qs.length, snapPkg.questionCount, `Question count changed on ${pm.setId}`);
    for (let qi = 0; qi < qs.length; qi++) {
      const q = qs[qi];
      const sq = snapPkg.questions[qi];
      assert.equal(q.id, sq.id, `Question id/order changed on ${pm.setId}[${qi}]`);
      assert.equal(q.correctAnswer ?? null, sq.correctAnswer, `correctAnswer changed on ${q.id}`);
      assert.equal(q.correctIndex ?? null, sq.correctIndex, `correctIndex changed on ${q.id}`);
      assert.equal(q.points ?? null, sq.points, `points changed on ${q.id}`);
      assert.equal(sha256Text(q.prompt), sq.promptSha256, `prompt text changed on ${q.id}`);
      assert.equal(sha256Text(q.questionText), sq.questionTextSha256, `questionText changed on ${q.id}`);
      assert.equal(sha256Text(q.promptTranslation), sq.promptTranslationSha256, `promptTranslation changed on ${q.id}`);
      assert.deepStrictEqual(q.questionImage ?? null, sq.questionImage, `questionImage changed on ${q.id}`);
      assert.deepStrictEqual(q.media ?? null, sq.media, `media changed on ${q.id}`);
      const opts = Array.isArray(q.options) ? q.options : [];
      assert.equal(opts.length, sq.options.length, `Option count changed on ${q.id}`);
      for (let oi = 0; oi < opts.length; oi++) {
        const o = opts[oi];
        const so = sq.options[oi];
        assert.equal(o.id ?? null, so.id, `Option id/order changed on ${q.id}[${oi}]`);
        assert.equal(o.originalId ?? null, so.originalId, `Option originalId changed on ${q.id}[${oi}]`);
        assert.equal(sha256Text(o.text), so.textSha256, `Option text changed on ${q.id}[${oi}]`);
        assert.equal(sha256Text(o.translation), so.translationSha256, `Option translation changed on ${q.id}[${oi}]`);
        assert.deepStrictEqual(o.optionImage ?? null, so.optionImage, `Option image changed on ${q.id}[${oi}]`);
        assert.equal(o.mediaId ?? null, so.mediaId, `Option mediaId changed on ${q.id}[${oi}]`);
      }
    }
  }
}

export function validatePackagesList({ packageIds, manifest, dict, mapping, kt, checkInlineSync = true }) {
  const knownIdx = buildKnownLexiconIndex(dict);
  const results = [];
  let totalErrors = 0;
  const checkedSpec009Files = new Set();

  for (const sid of packageIds) {
    const pm = manifest.packages.find(p => p.setId === sid);
    assert(pm, `Unknown package ID ${sid}`);
    const raw = JSON.parse(fs.readFileSync(path.join(ROOT, pm.sourcePath), 'utf8'));
    const qs = (Array.isArray(raw) ? raw : (raw.questions || [])).filter(q => (q.setId || raw.setId || sid) === sid);

    const pkgErrors = [];
    for (const q of qs) {
      const pIds = mapping.questions?.[q.id];
      const pHtml = pm.cohort === 'cohort_1_spec009_canonical'
        ? extractQuestionPlainText(q)
        : (q.prompt || q.questionText || extractQuestionPlainText(q));
      pkgErrors.push(...validateStrictContext({
        contextKey: q.id,
        html: pHtml,
        termIds: pIds,
        dict,
        knownLexiconIndex: pm.cohort === 'cohort_1_spec009_canonical' ? null : knownIdx,
      }));

      // Check inline kotobaU/kt consistency if present
      if (checkInlineSync && Array.isArray(q.kotobaU)) {
        if (JSON.stringify(q.kotobaU) !== JSON.stringify(kt.entries?.[q.id]?.kotobaU)) {
          pkgErrors.push({ code: 'INLINE_KOTOBA_MISMATCH', contextKey: q.id, message: `Inline kotobaU != kotoba-dan-kategori-tambahan on ${q.id}` });
        }
        if (JSON.stringify(q.kotobaU).includes('たんご')) {
          pkgErrors.push({ code: 'INLINE_TANGO_PLACEHOLDER', contextKey: q.id, message: `Placeholder たんご in inline kotobaU on ${q.id}` });
        }
      }

      const opts = Array.isArray(q.options) ? q.options : [];
      for (let oi = 0; oi < opts.length; oi++) {
        const opt = opts[oi];
        const oid = extractOptionId(opt, oi);
        const ck = `${q.id}::${oid}`;
        const byCk = mapping.byCompositeKey?.[ck];
        const byOpt = mapping.options?.[q.id]?.[oid];
        if (JSON.stringify(byCk) !== JSON.stringify(byOpt)) {
          pkgErrors.push({ code: 'OPTIONS_COMPOSITE_MISMATCH', contextKey: ck, message: 'mapping.options != mapping.byCompositeKey' });
        }
        pkgErrors.push(...validateStrictContext({
          contextKey: ck,
          html: opt.text || extractOptionPlainText(opt),
          termIds: byCk,
          dict,
          knownLexiconIndex: pm.cohort === 'cohort_1_spec009_canonical' ? null : knownIdx,
        }));
      }
    }

    // Spec-009 compatibility check on Cohort 1 files
    let spec009Check = null;
    if (pm.cohort === 'cohort_1_spec009_canonical' && !checkedSpec009Files.has(pm.sourcePath)) {
      checkedSpec009Files.add(pm.sourcePath);
      const vRes = validateKotobaPackage({ packageFile: pm.sourcePath, dict, mapping, requireVersion2: false, disallowInlineOccurrences: true });
      const covRes = auditPackageCoverage(pm.sourcePath, dict, mapping);
      spec009Check = {
        validatorErrors: vRes.errors.length,
        spanCoveragePct: covRes.spanCoveragePct,
        unresolvedSpans: covRes.totalUnresolvedSpans,
      };
      if (vRes.errors.length > 0) {
        pkgErrors.push({ code: 'SPEC009_VALIDATOR_FAIL', contextKey: sid, message: `Spec009 errors: ${JSON.stringify(vRes.errors.slice(0, 3))}` });
      }
      if (covRes.totalUnresolvedSpans > 0) {
        pkgErrors.push({ code: 'SPEC009_SPAN_REGRESSION', contextKey: sid, message: `Spec009 unresolved spans: ${covRes.totalUnresolvedSpans}` });
      }
    }

    const covAny = auditPackageCoverage(pm.sourcePath, dict, mapping);
    totalErrors += pkgErrors.length;
    results.push({
      setId: sid,
      cohort: pm.cohort,
      questions: qs.length,
      errors: pkgErrors.length,
      fileSpanCoveragePct: covAny.spanCoveragePct,
      spec009Check,
      sampleErrors: pkgErrors.slice(0, 10),
    });
  }

  return { totalErrors, results };
}

if (process.argv[1] && process.argv[1].endsWith('validate-batch.mjs')) {
  const args = process.argv.slice(2);
  if (args.includes('--neg-tests') || args.includes('--test')) {
    runNegativeTests();
  }
  const batchIdx = args.indexOf('--batch');
  const setIdx = args.indexOf('--set');
  const runAll = args.includes('--all');
  const runProt = args.includes('--check-protected');

  if (batchIdx !== -1 || setIdx !== -1 || runAll || runProt) {
    const manifest = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'target-manifest.json'), 'utf8'));
    const dict = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/sharedKotobaDictionary.json'), 'utf8'));
    const mapping = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/kotobaMapping.json'), 'utf8'));
    const kt = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/kotoba-dan-kategori-tambahan.json'), 'utf8'));

    verifyProtectedAndImmutability({ manifest, dict, mapping });
    console.log('✓ Protected 10 OTAFF SHA-256 & resolved Kotoba parity + 60-package immutability PASSED.');

    let pkgIds = [];
    if (batchIdx !== -1) {
      const bName = args[batchIdx + 1];
      const bObj = manifest.batches.find(b => b.batchId === bName);
      assert(bObj, `Batch ${bName} not found`);
      pkgIds = bObj.packageIds;
    } else if (setIdx !== -1) {
      pkgIds = [args[setIdx + 1]];
    } else if (runAll) {
      pkgIds = manifest.selectedLegacyTargetPackageIds;
    }

    if (pkgIds.length > 0) {
      const res = validatePackagesList({ packageIds: pkgIds, manifest, dict, mapping, kt });
      console.log(JSON.stringify(res, null, 2));
      if (res.totalErrors > 0) process.exit(1);
    }
  }
}
