import fs from 'node:fs';
import { auditSentenceSpans } from '../../scripts/audit-kotoba-coverage.mjs';

const dict = JSON.parse(fs.readFileSync('data/sharedKotobaDictionary.json', 'utf8'));
const mapping = JSON.parse(fs.readFileSync('data/kotobaMapping.json', 'utf8'));

const ruSamples = [];
const falseMappings = [];

// Check every context in otaff-pm51-01..10:
// 1. Check any span === 'る'
// 2. Check any mapped 1-char kanji term (目, 手, 上, 中, 前, 後, 外, 内, 等, 材, 物, 品, 食, 大, 小, 場, 所, 回, 間, 先, 身, 足, 顔, 鼻, 耳, 口, 歯, 爪, 襟, 裾, 袖, 図, 表, 例, 次, 他)
// and see what surrounding characters it matched inside!
for (let p = 1; p <= 10; p++) {
  const pkg = JSON.parse(fs.readFileSync(`data/latsol-otaff-pm51-${String(p).padStart(2, '0')}.json`, 'utf8'));
  for (const q of pkg.questions) {
    const promptPlain = q.questionText || q.prompt.replace(/<rt>[^<]*<\/rt>/g, '').replace(/<[^>]+>/g, '');
    const ctxs = [
      { key: q.id, text: promptPlain, ids: mapping.questions[q.id] || [] },
      ...q.options.map(o => ({
        key: `${q.id}::${o.id}`,
        text: o.text.replace(/<rt>[^<]*<\/rt>/g, '').replace(/<[^>]+>/g, ''),
        ids: mapping.byCompositeKey[`${q.id}::${o.id}`] || [],
      })),
    ];
    for (const ctx of ctxs) {
      const audit = auditSentenceSpans(ctx.text, ctx.ids, dict);
      for (const sp of audit.unresolvedSpans) {
        if (sp.text === 'る') {
          ruSamples.push({ key: ctx.key, text: ctx.text, mapped: ctx.ids.map(id => dict.terms[id]?.kanji) });
        }
      }
      // Check every mapped term in ctx.ids: does its surface in dict appear ONLY inside a larger kanji/katakana compound that wasn't mapped as the compound?
      for (const id of ctx.ids) {
        const entry = dict.terms[id];
        if (!entry) {
          falseMappings.push({ type: 'DANGLING_ID', key: ctx.key, id });
          continue;
        }
        const surface = entry.kanji;
        if (!ctx.text.includes(surface)) {
          falseMappings.push({ type: 'SURFACE_NOT_IN_CONTEXT', key: ctx.key, id, surface, text: ctx.text });
        } else if (surface.length === 1) {
          // Check all occurrences of this 1-char term in ctx.text
          let idx = ctx.text.indexOf(surface);
          let hasStandalone = false;
          const contexts = [];
          while (idx !== -1) {
            const before = idx > 0 ? ctx.text[idx - 1] : '';
            const after = idx + 1 < ctx.text.length ? ctx.text[idx + 1] : '';
            contexts.push(ctx.text.slice(Math.max(0, idx - 3), Math.min(ctx.text.length, idx + 4)));
            // Strictly check if surrounded by kanji without being part of a mapped compound
            const isKanjiBefore = /[\u4e00-\u9faf\u3005]/.test(before);
            const isKanjiAfter = /[\u4e00-\u9faf\u3005]/.test(after);
            if (!isKanjiBefore && !isKanjiAfter) hasStandalone = true;
            idx = ctx.text.indexOf(surface, idx + 1);
          }
          if (!hasStandalone) {
            falseMappings.push({ type: 'SUBSTRING_KANJI_COLLISION', key: ctx.key, id, surface, arti: entry.arti, snippets: contexts });
          }
        }
      }
    }
  }
}

console.log('る samples:', ruSamples.slice(0, 10));
console.log('Total anomaly count:', falseMappings.length);
const grouped = {};
for (const a of falseMappings) {
  grouped[a.type] = (grouped[a.type] || 0) + 1;
}
console.log('By type:', grouped);
for (const a of falseMappings.slice(0, 50)) {
  console.log(' ', JSON.stringify(a));
}
