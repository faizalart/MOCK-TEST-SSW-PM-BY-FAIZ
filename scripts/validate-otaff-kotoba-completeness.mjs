import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {
  hasKanji,
  isSingleKanji,
  isValidHiraganaReading,
  stripRubyAndHtml,
} from './lib/kotoba-pipeline-utils.mjs';
import { validateKotobaPackage } from './validate-kotoba-package.mjs';
import { auditPackageCoverage } from './audit-kotoba-coverage.mjs';

const PURE_PARTICLES = new Set([
  'を', 'の', 'に', 'が', 'は', 'で', 'と', 'や', 'も', 'へ', 'か', 'ね', 'よ', 'な', 'だ', 'て', 'た', 'ば', 'ず',
  'する', 'し', 'した', 'して', 'しない', 'せず', 'される', 'され', 'された', 'されて', 'できる', 'でき', 'できた', 'できない',
  'いる', 'い', 'いた', 'いて', 'いない', 'おり',
  'ある', 'あり', 'あっ', 'あった', 'あって', 'ありません', 'あります',
  'なる', 'なり', 'なっ', 'なった', 'なって', 'なら',
  'ない', 'なく', 'なかっ', 'なかった', 'ないで', 'ないか',
  'です', 'ます', 'ました', 'ません', 'ませんでした', 'でした', 'ですか', 'ますか', 'ませんか',
  'である', 'であり', 'であった', 'ではない', 'ではなく', 'でない',
  'から', 'まで', 'より', 'における', 'についての', 'に対して', 'にとって',
  'ながら', 'たり', 'だり', 'ても', 'なら', 'しかし', 'また', 'および', 'または', 'なお', 'つまり',
  'この', 'その', 'あの', 'どの', 'ここ', 'そこ', 'あそこ', 'そんな', 'こんな', 'あんな', 'どんな',
  'って', 'る', 'れる', 'られる', 'せる', 'させる', 'ておく', 'おく', 'おき', 'おいて', 'しまう', 'しまい', 'しまった', 'くれる',
  'よう', 'ように', 'ような', 'そう', 'という', 'といった', 'とか', 'だけ', 'しか', 'ばかり', 'ほど', 'くらい', 'ぐらい', 'こそ', 'さえ', 'ごと', 'ごとに',
  'のです', 'ためです', 'からです', 'おらず', 'だろう', 'ところ', 'とおり', 'どおり', 'あたり', 'わけ', 'はず', 'べき', 'べく',
]);

const HIRA_LEXICAL = new Set([
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
]);

const SEGMENT_ATTACHED_PARTICLES = new Set([
  'を', 'の', 'に', 'が', 'は', 'で', 'と', 'や', 'も', 'へ', 'か', 'ね', 'よ', 'ば', 'から', 'まで', 'より', 'だ', 'な', 'でも',
  'して', 'する', 'し', 'した', 'しない', 'せず',
]);

const TECHNICAL_ASCII = new Set(['ppm', 'ml', 'kg', 'g', 'L', 'm', 'HACCP', 'CCP', 'KYT', 'FIFO', 'OTAFF', 'SNS', '5S', 'O157', 'O111']);
const PREFIX_MARKER_RE = /^(?:\[(?:イラスト|標識|図|写真|品目|保護具)[A-Za-z0-9]+\]\s*)+/u;
const segJa = new Intl.Segmenter('ja', { granularity: 'word' });

function cleanContextText(html) {
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

export function validateContextCompleteness({
  contextKey,
  html,
  termIds,
  dict,
  otaffKnownKanjis,
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
    if (hasKanji(e.kanji) && (!e.furigana || !isValidHiraganaReading(e.furigana))) {
      errors.push({ code: 'INVALID_KANJI_FURIGANA', contextKey, termId: id, message: `Invalid furigana "${e.furigana}" on kanji term ${id} (${e.kanji})` });
    }
    if (id.startsWith('kb-otaff51-') && (!e.furigana || !isValidHiraganaReading(e.furigana))) {
      errors.push({ code: 'INVALID_OTAFF_FURIGANA', contextKey, termId: id, message: `Empty/non-hiragana furigana "${e.furigana}" on ${id} (${e.kanji})` });
    }
    if (!e.arti || e.arti.length > 60) {
      errors.push({ code: 'MEANING_TOO_LONG', contextKey, termId: id, message: `Meaning missing or >60 chars (${e.arti?.length}) on ${id}` });
    }
    if (!plain.includes(e.kanji)) {
      errors.push({ code: 'SURFACE_NOT_IN_CONTEXT', contextKey, termId: id, message: `Mapped term "${e.kanji}" (${id}) not found in context text` });
      continue;
    }
    resolved.push(e);
  }

  // Mark character positions covered by longer mapped terms
  const coveredOffsets = resolved.map(e => ({
    e,
    len: e.kanji.length,
    offsets: getAllOffsets(plain, e.kanji),
  }));

  // Substring kanji collision check:
  // If a mapped kanji term's EVERY occurrence in plain is strictly bounded adjacent to another kanji
  // AND not independently occurring (nor boundary-separated by a longer mapped term at its edge), fail!
  for (const item of coveredOffsets) {
    if (!hasKanji(item.e.kanji)) continue;
    const isIndependentSomewhere = item.offsets.some(pos => {
      const end = pos + item.len;
      // Check if ANY other longer mapped term strictly swallows [pos, end)
      const swallowedByLonger = coveredOffsets.some(other =>
        other.e.id !== item.e.id &&
        other.len > item.len &&
        other.offsets.some(op => op <= pos && op + other.len >= end)
      );
      if (swallowedByLonger) return false;

      if (isSingleKanji(item.e.kanji)) {
        // For single kanji, make sure it isn't attached inside an unmapped kanji compound (unless it's a valid counter/prefix boundary we intentionally mapped)
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

  // Mark every character index covered by any mapped term
  const coveredMask = new Uint8Array(plain.length);
  for (const item of coveredOffsets) {
    for (const pos of item.offsets) {
      for (let k = pos; k < pos + item.len; k++) coveredMask[k] = 1;
    }
  }

  // Check for uncovered lexical spans in the context!
  // 1) Any segment containing kanji (except isolated counter chars already inside covered numbers) or >=2-char katakana or TECHNICAL_ASCII
  for (const seg of segJa.segment(plain)) {
    const w = seg.segment;
    const start = seg.index;
    const end = start + w.length;
    let allCovered = true;
    for (let k = start; k < end; k++) {
      if (!coveredMask[k]) { allCovered = false; break; }
    }
    if (allCovered) continue;

    // Ignore pure punctuation, whitespace, single ASCII letters (menu option A-E or single kana markers), digits
    if (/^[\s、。・「」『』（）()／→：；,."'%％℃\-+〜～【】◎×○0-9０-９①-⑩!！※\[\]．＋]+$/.test(w)) continue;
    if (/^[A-Za-z]+$/.test(w) && !TECHNICAL_ASCII.has(w)) continue;
    if (PURE_PARTICLES.has(w)) continue;

    // Allow segment if its lexical core is covered and only pure postpositional/suru-aux particles remain uncovered
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

  // 2) Check for any unmapped known OTAFF dictionary term (multi-char or lexical) appearing uncovered cleanly in plain
  if (otaffKnownKanjis) {
    let i = 0;
    while (i < plain.length) {
      if (coveredMask[i]) { i++; continue; }
      const ch = plain[i];
      const cands = otaffKnownKanjis.get(ch) || [];
      let matched = null;
      for (const cand of cands) {
        if (plain.startsWith(cand, i)) {
          // Only flag if all chars [i..i+cand.length) are uncovered and boundaries don't split a kanji/katakana word
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

function buildKnownOtaffIndex(dict, mapping) {
  const usedIds = new Set();
  for (const [qid, ids] of Object.entries(mapping.questions || {})) {
    if (qid.startsWith('otaff-pm51-')) ids.forEach(x => usedIds.add(x));
  }
  for (const [qid, opts] of Object.entries(mapping.options || {})) {
    if (qid.startsWith('otaff-pm51-')) Object.values(opts).flat().forEach(x => usedIds.add(x));
  }
  const map = new Map();
  for (const id of usedIds) {
    const e = dict.terms[id];
    if (!e || !e.kanji || PURE_PARTICLES.has(e.kanji) || e.kanji.length < 2) continue;
    if (/^[A-Za-z]+$/.test(e.kanji) && !TECHNICAL_ASCII.has(e.kanji)) continue;
    const c = e.kanji[0];
    if (!map.has(c)) map.set(c, []);
    map.get(c).push(e.kanji);
  }
  for (const arr of map.values()) arr.sort((a, b) => b.length - a.length);
  return map;
}

function runAllValidations() {
  const dict = JSON.parse(fs.readFileSync('data/sharedKotobaDictionary.json', 'utf8'));
  const mapping = JSON.parse(fs.readFileSync('data/kotobaMapping.json', 'utf8'));
  const kt = JSON.parse(fs.readFileSync('data/kotoba-dan-kategori-tambahan.json', 'utf8'));
  const dictDelta = JSON.parse(fs.readFileSync('deliverables/staging/otaff-pm51-10-packages/data/sharedKotobaDictionary-delta.json', 'utf8'));
  const mapDelta = JSON.parse(fs.readFileSync('deliverables/staging/otaff-pm51-10-packages/data/kotobaMapping-delta.json', 'utf8'));
  const ktDelta = JSON.parse(fs.readFileSync('deliverables/staging/otaff-pm51-10-packages/data/kotoba-tambahan-delta.json', 'utf8'));
  const snapshot = JSON.parse(fs.readFileSync('deliverables/kotoba-repair/question-immutable-snapshot.json', 'utf8'));

  const knownOtaffIdx = buildKnownOtaffIndex(dict, mapping);

  // Check zero たんご across all masters and deltas
  for (const [name, obj] of [
    ['sharedKotobaDictionary', dict],
    ['sharedKotobaDictionary-delta', dictDelta],
    ['kotobaMapping-delta', mapDelta],
    ['kotoba-dan-kategori-tambahan', kt],
    ['kotoba-tambahan-delta', ktDelta],
  ]) {
    assert(!JSON.stringify(obj).includes('たんご'), `Placeholder たんご detected inside ${name}`);
  }

  // Sync check deltas vs masters
  for (const [id, entry] of Object.entries(dictDelta.terms || {})) {
    assert.deepStrictEqual(dict.terms[id], entry, `Delta dict mismatch on ${id}`);
  }

  const allErrors = [];
  const pkgStats = [];
  let totalPromptTerms = 0;
  let totalOptTerms = 0;
  let totalSpanCovSum = 0;

  for (let p = 1; p <= 10; p++) {
    const num = String(p).padStart(2, '0');
    const prodFile = `data/latsol-otaff-pm51-${num}.json`;
    const stageFile = `deliverables/staging/otaff-pm51-10-packages/data/latsol-otaff-pm51-${num}.json`;
    const pkg = JSON.parse(fs.readFileSync(prodFile, 'utf8'));
    const stagePkg = JSON.parse(fs.readFileSync(stageFile, 'utf8'));
    assert.deepStrictEqual(pkg, stagePkg, `Prod vs staging mismatch on ${prodFile}`);
    assert(!JSON.stringify(pkg).includes('たんご'), `Placeholder たんご detected in ${prodFile}`);

    // Official repo validator check
    const vRes = validateKotobaPackage({
      packageFile: prodFile,
      dict,
      mapping,
      requireVersion2: false,
      disallowInlineOccurrences: true,
    });
    assert.equal(vRes.errors.length, 0, `validateKotobaPackage failed on ${prodFile}: ${JSON.stringify(vRes.errors)}`);

    // Span coverage benchmark vs gold standard latsol-nguyen-01.json (76.13%)
    const cov = auditPackageCoverage(prodFile, dict, mapping);
    assert(cov.spanCoveragePct >= 76.13, `${prodFile} spanCoveragePct ${cov.spanCoveragePct}% < nguyen baseline 76.13%`);

    let pPromptTerms = 0;
    let pOptTerms = 0;
    for (const q of pkg.questions) {
      // Immutability check
      const payload = JSON.stringify({
        id: q.id,
        setId: q.setId,
        questionNumber: q.questionNumber,
        points: q.points,
        questionText: q.questionText,
        prompt: q.prompt,
        instructions: q.instructions,
        promptTranslation: q.promptTranslation,
        correctAnswer: q.correctAnswer,
        correctIndex: q.correctIndex,
        options: q.options,
        questionImage: q.questionImage,
        media: q.media,
      });
      const hash = crypto.createHash('sha256').update(payload).digest('hex');
      assert.equal(hash, snapshot[q.id], `Immutable field hash mismatch on ${q.id}`);

      const qIds = mapping.questions[q.id];
      assert.deepStrictEqual(qIds, mapDelta.questions[q.id], `Mapping delta mismatch on ${q.id}`);
      assert.deepStrictEqual(q.kotobaU, kt.entries[q.id]?.kotobaU, `kotoba-tambahan mismatch on ${q.id}`);
      assert.deepStrictEqual(q.kotobaU, ktDelta.entries[q.id]?.kotobaU, `kotoba-tambahan-delta mismatch on ${q.id}`);

      pPromptTerms += qIds.length;
      allErrors.push(...validateContextCompleteness({
        contextKey: q.id,
        html: q.prompt,
        termIds: qIds,
        dict,
        otaffKnownKanjis: knownOtaffIdx,
      }));

      for (const opt of q.options) {
        const compKey = `${q.id}::${opt.id}`;
        const optIds = mapping.options[q.id]?.[opt.id];
        assert.deepStrictEqual(optIds, mapping.byCompositeKey[compKey], `CompositeKey mismatch on ${compKey}`);
        assert.deepStrictEqual(optIds, mapDelta.byCompositeKey[compKey], `Delta CompositeKey mismatch on ${compKey}`);
        pOptTerms += optIds.length;
        allErrors.push(...validateContextCompleteness({
          contextKey: compKey,
          html: opt.text,
          termIds: optIds,
          dict,
          otaffKnownKanjis: knownOtaffIdx,
        }));
      }
    }

    totalPromptTerms += pPromptTerms;
    totalOptTerms += pOptTerms;
    totalSpanCovSum += cov.spanCoveragePct;

    pkgStats.push({
      pkg: `latsol-otaff-pm51-${num}.json`,
      questions: pkg.questions.length,
      options: 120,
      promptTerms: pPromptTerms,
      avgPromptTerms: Number((pPromptTerms / pkg.questions.length).toFixed(2)),
      optTerms: pOptTerms,
      avgOptTerms: Number((pOptTerms / 120).toFixed(2)),
      spanCoveragePct: cov.spanCoveragePct,
      validateErrors: 0,
    });
  }

  assert.equal(allErrors.length, 0, `Context completeness errors (${allErrors.length}): ${JSON.stringify(allErrors.slice(0, 10), null, 2)}`);

  const nguyenCov = auditPackageCoverage('data/latsol-nguyen-01.json', dict, mapping);
  const summaryMetrics = {
    validatedAt: new Date().toISOString(),
    totalPackages: 10,
    totalContexts: 1600,
    promptTermsAfter: totalPromptTerms,
    optTermsAfter: totalOptTerms,
    avgPromptTermsAfter: Number((totalPromptTerms / 400).toFixed(2)),
    avgOptTermsAfter: Number((totalOptTerms / 1200).toFixed(2)),
    avgSpanCoverageAfterPct: Number((totalSpanCovSum / 10).toFixed(2)),
    nguyenGoldSpanCoveragePct: nguyenCov.spanCoveragePct,
    packages: pkgStats,
  };
  fs.writeFileSync('deliverables/kotoba-repair/after-repair-metrics.json', JSON.stringify(summaryMetrics, null, 2) + '\n', 'utf8');

  // Explicit Negative & Positive Unit Tests
  const p1 = JSON.parse(fs.readFileSync('data/latsol-otaff-pm51-01.json', 'utf8'));
  const findCtxHtml = (key) => {
    const [qid, oid] = key.split('::');
    const q = p1.questions.find(x => x.id === qid);
    if (!oid) return q.prompt;
    return q.options.find(o => o.id === oid).text;
  };

  // Neg 1: Remove 内側 from otaff-pm51-01-q031::A
  const neg1Ids = mapping.byCompositeKey['otaff-pm51-01-q031::A'].filter(id => dict.terms[id].kanji !== '内側');
  const neg1Err = validateContextCompleteness({
    contextKey: 'otaff-pm51-01-q031::A',
    html: findCtxHtml('otaff-pm51-01-q031::A'),
    termIds: neg1Ids,
    dict,
    otaffKnownKanjis: knownOtaffIdx,
  });
  assert(neg1Err.some(e => e.surface === '内側'), 'Negative test 1 failed: missing 内側 must fail');

  // Neg 2: Remove 消費者 from otaff-pm51-01-q002::A
  const neg2Ids = mapping.byCompositeKey['otaff-pm51-01-q002::A'].filter(id => dict.terms[id].kanji !== '消費者');
  const neg2Err = validateContextCompleteness({
    contextKey: 'otaff-pm51-01-q002::A',
    html: findCtxHtml('otaff-pm51-01-q002::A'),
    termIds: neg2Ids,
    dict,
    otaffKnownKanjis: knownOtaffIdx,
  });
  assert(neg2Err.some(e => e.surface === '消費者'), 'Negative test 2 failed: missing 消費者 must fail');

  // Neg 3: Remove 落とす from otaff-pm51-01-q029::A
  const neg3Ids = mapping.byCompositeKey['otaff-pm51-01-q029::A'].filter(id => dict.terms[id].kanji !== '落とす');
  const neg3Err = validateContextCompleteness({
    contextKey: 'otaff-pm51-01-q029::A',
    html: findCtxHtml('otaff-pm51-01-q029::A'),
    termIds: neg3Ids,
    dict,
    otaffKnownKanjis: knownOtaffIdx,
  });
  assert(neg3Err.some(e => e.surface === '落とす'), 'Negative test 3 failed: missing 落とす must fail');

  // Neg 4: Dangling termId
  const neg4Err = validateContextCompleteness({
    contextKey: 'otaff-pm51-01-q001::A',
    html: findCtxHtml('otaff-pm51-01-q001::A'),
    termIds: [...mapping.byCompositeKey['otaff-pm51-01-q001::A'], 'kb-otaff51-9999'],
    dict,
    otaffKnownKanjis: knownOtaffIdx,
  });
  assert(neg4Err.some(e => e.code === 'DANGLING_OR_UNVERIFIED_TERM'), 'Negative test 4 failed: dangling ID must fail');

  // Neg 5: Blank/placeholder reading
  const dictCopy = structuredClone(dict);
  dictCopy.terms['kb-otaff51-0001'] = { ...dictCopy.terms['kb-otaff51-0001'], kanji: '衛', furigana: '' };
  const neg5Err = validateContextCompleteness({
    contextKey: 'neg5',
    html: '安全を衛る',
    termIds: ['kb-otaff51-0001'],
    dict: dictCopy,
    otaffKnownKanjis: knownOtaffIdx,
  });
  assert(neg5Err.some(e => e.code === 'INVALID_KANJI_FURIGANA'), 'Negative test 5 failed: blank furigana on kanji must fail');

  // Neg 6: Substring collision 目 inside 品目
  const neg6Dict = {
    terms: {
      't-tokutei': { id: 't-tokutei', kanji: '特定原材料', furigana: 'とくていげんざいりょう', arti: 'alergen wajib', status: 'verified' },
      't-hinmoku': { id: 't-hinmoku', kanji: '品目', furigana: 'ひんもく', arti: 'item pangan', status: 'verified' },
      'kb-v2-p2-004': { id: 'kb-v2-p2-004', kanji: '目', furigana: 'め', arti: 'mata', status: 'verified' },
    },
  };
  const neg6Err = validateContextCompleteness({
    contextKey: 'neg6',
    html: '特定原材料（9品目）',
    termIds: ['t-tokutei', 't-hinmoku', 'kb-v2-p2-004'],
    dict: neg6Dict,
    otaffKnownKanjis: null,
  });
  assert(neg6Err.some(e => e.code === 'SUBSTRING_KANJI_COLLISION'), 'Negative test 6 failed: 目 inside 品目 must fail');

  // Pos 7: Ordinary grammatical particles unmapped -> MUST PASS
  const posDict = {
    terms: {
      'p-workwear': { id: 'p-workwear', kanji: '作業服', furigana: 'さぎょうふく', arti: 'baju kerja', status: 'verified' },
      'p-wear': { id: 'p-wear', kanji: '着て', furigana: 'きて', arti: 'memakai', status: 'verified' },
      'p-hygiene': { id: 'p-hygiene', kanji: '衛生管理', furigana: 'えいせいかんり', arti: 'manajemen higiene', status: 'verified' },
      'p-safety': { id: 'p-safety', kanji: '安全', furigana: 'あんぜん', arti: 'keselamatan', status: 'verified' },
    },
  };
  const posErr = validateContextCompleteness({
    contextKey: 'pos-particles-allowed',
    html: '作業服を着て衛生管理をする。これが安全です。',
    termIds: ['p-workwear', 'p-wear', 'p-hygiene', 'p-safety'],
    dict: posDict,
    otaffKnownKanjis: knownOtaffIdx,
  });
  assert.equal(posErr.length, 0, `Positive test failed: ordinary particles should pass cleanly, got ${JSON.stringify(posErr)}`);

  console.log('ALL 1,600 CONTEXTS + 10 PACKAGES + 7 UNIT TESTS PASSED 100%!');
  console.log(JSON.stringify(summaryMetrics, null, 2));
}

if (process.argv[1] && (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}` || process.argv[1].endsWith('validate-otaff-kotoba-completeness.mjs'))) {
  runAllValidations();
}
