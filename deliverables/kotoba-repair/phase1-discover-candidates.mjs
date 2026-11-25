import fs from 'node:fs';
import path from 'node:path';
import { auditSentenceSpans } from '../../scripts/audit-kotoba-coverage.mjs';
import { hasKanji, isSingleKanji, isValidHiraganaReading } from '../../scripts/lib/kotoba-pipeline-utils.mjs';

const OUT_DIR = 'deliverables/kotoba-repair';
const dict = JSON.parse(fs.readFileSync('data/sharedKotobaDictionary.json', 'utf8'));
const mapping = JSON.parse(fs.readFileSync('data/kotobaMapping.json', 'utf8'));

// Index verified master terms by exact kanji surface (prefer non-single-kanji / non-fragment verified terms, exclude grammar particles)
const masterBySurface = new Map();
for (const [id, entry] of Object.entries(dict.terms || {})) {
  if (!entry || entry.status !== 'verified' || !entry.kanji) continue;
  if (entry.unitType === 'morpheme_fragment' || entry.entryType === 'morpheme_fragment') continue;
  const k = entry.kanji.trim();
  if (!masterBySurface.has(k)) masterBySurface.set(k, []);
  masterBySurface.get(k).push(entry);
}

// Parse inline <ruby> pairs from HTML string -> Map of surface -> rt
function extractRubyPairs(html) {
  const pairs = [];
  const re = /<ruby>([^<]+)<rt>([^<]+)<\/rt><\/ruby>/g;
  for (const m of String(html || '').matchAll(re)) {
    pairs.push({ base: m[1].trim(), rt: m[2].trim() });
  }
  return pairs;
}

const segJa = new Intl.Segmenter('ja', { granularity: 'word' });

// Grammar/particle/copula tokens typically excluded unless lexicalized
const PURE_GRAMMAR_SET = new Set([
  'の', 'に', 'を', 'が', 'は', 'で', 'と', 'も', 'や', 'へ', 'から', 'まで', 'より', 'など', 'として', 'において', 'について', 'における', 'にとって', 'によって', 'による', 'に対して', 'ため', 'ように', 'ような', 'こと', 'もの', 'とき', '場合', 'うち', 'なか', 'ほど', 'くらい', 'ぐらい', 'だけ', 'しか', 'ばかり', 'こそ', 'さえ', 'でも', 'ても', 'ので', 'のに', 'のに', 'ながら', 'たり', 'し', 'て', 'で', 'た', 'だ', 'である', 'です', 'ます', 'ました', 'ません', 'ない', 'なく', 'なる', 'なり', 'なっ', 'なった', 'なって', 'ある', 'あり', 'あっ', 'あった', 'いる', 'い', 'いた', 'いて', 'いない', 'する', 'し', 'した', 'して', 'しない', 'される', 'され', 'された', 'されて', 'できる', 'でき', 'できた', 'できない', 'おく', 'おいて', 'しまう', 'しまい', 'しまった', 'よい', 'よくない', 'いけない', 'なら', 'ば', 'たら', 'と', 'か', 'ね', 'よ', 'な', 'どの', 'どれ', 'どれか', 'どれです', 'どれですか', 'どのよう', 'どのくらい', 'いつ', 'どこ', 'なに', 'なん', 'なぜ', 'どう', 'この', 'その', 'あの', 'これら', 'それら', 'ここ', 'そこ', 'あそこ', '以下', '以上', '次', '図',
]);

// Carefully distinguish: notice '以下', '以上', '次', '図', 'とき', 'ため', '場合' HAVE kanji or strong lexical value and WILL be reviewed explicitly! So keep PURE_GRAMMAR_FILTER focused on strict Hiragana function words ONLY when deciding exclusions!
const STRICT_HIRAGANA_FUNCTION_WORDS = new Set([
  'の', 'に', 'を', 'が', 'は', 'で', 'と', 'も', 'や', 'へ', 'から', 'まで', 'より', 'など',
  'て', 'た', 'だ', 'です', 'ます', 'ました', 'ません', 'ませんでし', 'でした',
  'ない', 'なく', 'なる', 'なり', 'なった', 'なって', 'なっ',
  'ある', 'あり', 'あった', 'あって', 'あっ',
  'いる', 'いた', 'いて', 'いない', 'い', 'おり',
  'する', 'し', 'した', 'して', 'しない', 'せず', 'される', 'され', 'された', 'されて', 'できる', 'でき', 'できた', 'できない',
  'である', 'であり', 'であった', 'ではない', 'ではなく', 'でない',
  'こと', 'もの', 'という', 'といった', 'として', 'において', 'における', 'について', 'による', 'によって', 'に対して', 'にとって',
  'ので', 'のに', 'ながら', 'たり', 'つつ', 'まま', 'ため', 'よう', 'ように', 'ような', 'ようです', 'らしい',
  'ば', 'たら', 'なら', 'ても', 'でも', 'けれど', 'しかし', 'また', 'および', 'または', 'なお', 'つまり',
  'か', 'かな', 'ね', 'よ', 'この', 'その', 'あの', 'どの', 'どれ', 'どれか', 'どう', 'いつ', 'どこ',
  'おく', 'おいて', 'おき', 'おくべき', 'しまう', 'しまい', 'しまった', 'みて', 'みる',
  'および', 'ならびに', 'もし', 'もしも', 'ほど', 'くらい', 'ぐらい', 'ばかり', 'だけ', 'しか', 'さえ', 'こそ',
  'には', 'では', 'とは', 'にも', 'でも', 'とも', 'への', 'からの', 'までの', 'との', 'での', 'による',
  'ておく', 'ている', 'ていた', 'ており', 'てある', 'ていく', 'てくる', 'てみる', 'てしまう',
  'ことである', 'ものである', 'ことができます', 'ことが', 'ものを', 'ものの', 'ものとして', 'ことから', 'として', 'とは',
  'かどう', 'かどうか', 'す', 'せる', 'させる', 'れる', 'られる', 'べき', 'ずに', 'ぬ',
  'ん', 'っ', 'さ', 'み', 'ら', 'たち', 'ごと', 'ごとに',
]);

// Scan all 1,600 contexts across P01-P10
const unresolvedBySurface = new Map(); // surface -> { count, contexts: [], inMaster: [...ids], rubyHints: Set }
const contextMissingDetails = [];
let totalContexts = 0;
let contextsWithZeroMissedLexical = 0;

for (let p = 1; p <= 10; p++) {
  const fname = `data/latsol-otaff-pm51-${String(p).padStart(2, '0')}.json`;
  const pkg = JSON.parse(fs.readFileSync(fname, 'utf8'));

  for (const q of pkg.questions) {
    const promptPlain = q.questionText || q.prompt.replace(/<rt>[^<]*<\/rt>/g, '').replace(/<[^>]+>/g, '');
    const contexts = [
      { type: 'prompt', key: q.id, text: promptPlain, html: q.prompt, termIds: mapping.questions[q.id] || [] },
      ...q.options.map(o => ({
        type: 'option',
        optId: o.id,
        key: `${q.id}::${o.id}`,
        text: o.text.replace(/<rt>[^<]*<\/rt>/g, '').replace(/<[^>]+>/g, ''),
        html: o.text,
        termIds: mapping.byCompositeKey[`${q.id}::${o.id}`] || mapping.options[q.id]?.[o.id] || [],
      })),
    ];

    for (const ctx of contexts) {
      totalContexts++;
      // Note: ignore option prefix "[イラストA]" / "[標識A]" etc. in structural cleanup
      const cleanText = ctx.text.replace(/^\[(?:イラスト|標識|図)[A-Za-z0-9]+\]\s*/u, '');
      const audit = auditSentenceSpans(cleanText, ctx.termIds, dict);
      const rubyPairs = extractRubyPairs(ctx.html);

      const candidateWords = [];
      for (const span of audit.unresolvedSpans) {
        const segs = [...segJa.segment(span.text)].filter(s => s.isWordLike);
        for (const s of segs) {
          const w = s.segment.trim();
          if (!w) continue;
          // Exclude pure ASCII single chars/numbers
          if (/^[A-Za-z0-9℃%°+\-.,/]+$/.test(w)) continue;
          // Check if strictly hiragana grammar particle/suffix
          const isPureHiragana = /^[\u3041-\u3096ー]+$/.test(w);
          const hasKanjiOrKatakana = hasKanji(w) || /[\u30a1-\u30f6]/.test(w);

          if (isPureHiragana && STRICT_HIRAGANA_FUNCTION_WORDS.has(w)) {
            continue;
          }
          // Skip 1-char hiragana grammatical residues unless inside lexical set
          if (isPureHiragana && [...w].length === 1 && !['絵', '手', '目'].includes(w)) {
            continue;
          }

          candidateWords.push({ w, hasKanjiOrKatakana, span: span.text });

          if (!unresolvedBySurface.has(w)) {
            unresolvedBySurface.set(w, {
              surface: w,
              hasKanjiOrKatakana,
              count: 0,
              contexts: [],
              masterMatches: (masterBySurface.get(w) || []).map(e => ({ id: e.id, kanji: e.kanji, furigana: e.furigana, arti: e.arti, unitType: e.unitType })),
              sampleSpans: new Set(),
            });
          }
          const rec = unresolvedBySurface.get(w);
          rec.count++;
          if (rec.contexts.length < 5) rec.contexts.push(ctx.key);
          rec.sampleSpans.add(span.text);
        }
      }

      if (candidateWords.length === 0) contextsWithZeroMissedLexical++;
      else {
        contextMissingDetails.push({
          key: ctx.key,
          text: cleanText,
          existingMapped: ctx.termIds.map(id => dict.terms[id]?.kanji).filter(Boolean),
          candidates: candidateWords,
          rubyPairs,
        });
      }
    }
  }
}

const sortedCandidates = [...unresolvedBySurface.values()]
  .map(v => ({ ...v, sampleSpans: [...v.sampleSpans].slice(0, 5) }))
  .sort((a, b) => b.count - a.count);

const withKanjiOrKatakana = sortedCandidates.filter(c => c.hasKanjiOrKatakana);
const hiraganaOnly = sortedCandidates.filter(c => !c.hasKanjiOrKatakana);

fs.writeFileSync(path.join(OUT_DIR, 'phase1-candidates-summary.json'), JSON.stringify({
  totalContexts,
  contextsWithZeroMissedLexical,
  contextsNeedingAudit: contextMissingDetails.length,
  uniqueCandidateTokens: sortedCandidates.length,
  uniqueKanjiOrKatakanaTokens: withKanjiOrKatakana.length,
  uniqueHiraganaTokens: hiraganaOnly.length,
  kanjiOrKatakanaTokens: withKanjiOrKatakana,
  hiraganaTokens: hiraganaOnly,
}, null, 2) + '\n', 'utf8');

fs.writeFileSync(path.join(OUT_DIR, 'phase1-context-details.json'), JSON.stringify(contextMissingDetails, null, 2) + '\n', 'utf8');

console.log({
  totalContexts,
  contextsWithZeroMissedLexical,
  contextsNeedingAudit: contextMissingDetails.length,
  uniqueCandidateTokens: sortedCandidates.length,
  uniqueKanjiOrKatakanaTokens: withKanjiOrKatakana.length,
  uniqueHiraganaTokens: hiraganaOnly.length,
  kanjiKatakanaInMasterCount: withKanjiOrKatakana.filter(c => c.masterMatches.length > 0).length,
});
console.log('\nTop 40 missing Kanji/Katakana tokens:');
for (const c of withKanjiOrKatakana.slice(0, 40)) {
  console.log(`  ${c.surface} (${c.count}x) | master:${c.masterMatches.length} | spans:${c.sampleSpans.slice(0, 2).join('/')}`);
}
console.log('\nTop 40 missing Hiragana tokens:');
for (const c of hiraganaOnly.slice(0, 40)) {
  console.log(`  ${c.surface} (${c.count}x) | master:${c.masterMatches.length} | spans:${c.sampleSpans.slice(0, 2).join('/')}`);
}
