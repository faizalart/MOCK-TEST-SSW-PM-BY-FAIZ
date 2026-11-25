import fs from 'node:fs';
import { auditSentenceSpans } from '../../scripts/audit-kotoba-coverage.mjs';
import { hasKanji } from '../../scripts/lib/kotoba-pipeline-utils.mjs';

const dict = JSON.parse(fs.readFileSync('data/sharedKotobaDictionary.json', 'utf8'));
const mapping = JSON.parse(fs.readFileSync('data/kotobaMapping.json', 'utf8'));

// Build list of verified non-fragment master terms sorted longest-first
const masterTerms = Object.values(dict.terms || {})
  .filter(e => e && e.status === 'verified' && e.kanji && e.unitType !== 'morpheme_fragment' && e.entryType !== 'morpheme_fragment')
  .filter(e => {
    // Filter out pure 1-char hiragana grammar particles from auto-match
    if (/^[\u3041-\u3096]$/.test(e.kanji)) return false;
    return true;
  })
  .sort((a, b) => b.kanji.length - a.kanji.length);

// Group masterTerms by kanji
const masterByKanji = new Map();
for (const e of masterTerms) {
  if (!masterByKanji.has(e.kanji)) masterByKanji.set(e.kanji, []);
  masterByKanji.get(e.kanji).push(e);
}

let totalContexts = 0;
let uniqueSpans = new Map();
const imageQuestions = [];

// Also extract ruby-anchored compounds & okurigana words directly from HTML!
// In HTML: e.g. <ruby>着方<rt>きかた</rt></ruby>, <ruby>見<rt>み</rt></ruby>て, <ruby>間違<rt>まちが</rt></ruby>っている
for (let p = 1; p <= 10; p++) {
  const pkg = JSON.parse(fs.readFileSync(`data/latsol-otaff-pm51-${String(p).padStart(2, '0')}.json`, 'utf8'));
  for (const q of pkg.questions) {
    if (q.questionImage || (Array.isArray(q.media) && q.media.length > 0)) {
      imageQuestions.push({
        id: q.id,
        questionImage: q.questionImage || null,
        mediaCount: Array.isArray(q.media) ? q.media.length : 0,
        optImages: q.options.filter(o => o.optionImage).map(o => ({ opt: o.id, img: o.optionImage })),
        prompt: q.questionText || q.prompt.replace(/<rt>[^<]*<\/rt>/g, '').replace(/<[^>]+>/g, ''),
      });
    }

    const promptPlain = q.questionText || q.prompt.replace(/<rt>[^<]*<\/rt>/g, '').replace(/<[^>]+>/g, '');
    const ctxs = [
      { key: q.id, html: q.prompt, text: promptPlain, ids: mapping.questions[q.id] || [] },
      ...q.options.map(o => ({
        key: `${q.id}::${o.id}`,
        html: o.text,
        text: o.text.replace(/<rt>[^<]*<\/rt>/g, '').replace(/<[^>]+>/g, ''),
        ids: mapping.byCompositeKey[`${q.id}::${o.id}`] || [],
      })),
    ];

    for (const ctx of ctxs) {
      totalContexts++;
      const clean = ctx.text.replace(/^\[(?:イラスト|標識|図)[A-Za-z0-9]+\]\s*/u, '');
      const audit = auditSentenceSpans(clean, ctx.ids, dict);
      for (const s of audit.unresolvedSpans) {
        uniqueSpans.set(s.text, (uniqueSpans.get(s.text) || 0) + 1);
      }
    }
  }
}

console.log({
  totalContexts,
  uniqueUnresolvedSpans: uniqueSpans.size,
  imageQuestionsCount: imageQuestions.length,
  totalPngRefs: imageQuestions.reduce((acc, q) => acc + (q.questionImage ? 1 : 0) + q.optImages.length, 0),
});

// Show top 60 unresolved spans by frequency
const topSpans = [...uniqueSpans.entries()].sort((a, b) => b[1] - a[1]);
console.log('\nTop 60 unresolved spans:');
for (const [sp, cnt] of topSpans.slice(0, 60)) {
  console.log(`  ${cnt}x: "${sp}"`);
}

fs.writeFileSync('deliverables/kotoba-repair/unresolved-spans-summary.json', JSON.stringify({
  totalContexts,
  uniqueUnresolvedSpans: uniqueSpans.size,
  imageQuestions,
  spans: topSpans.map(([text, count]) => ({ text, count })),
}, null, 2) + '\n', 'utf8');
