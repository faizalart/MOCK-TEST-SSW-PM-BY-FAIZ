import fs from 'node:fs';
import path from 'node:path';
import {
  hasKanji,
  extractQuestionPlainText,
  extractOptionId,
  extractOptionPlainText,
} from '../../scripts/lib/kotoba-pipeline-utils.mjs';
import {
  PURE_PARTICLES,
  HIRA_LEXICAL,
  TECHNICAL_ASCII,
  cleanContextText,
  buildKnownLexiconIndex,
  validateStrictContext,
} from './validate-batch.mjs';

const batchId = process.argv[2] || 'batch-01';
const manifest = JSON.parse(fs.readFileSync('deliverables/kotoba-audit-40/target-manifest.json', 'utf8'));
const dict = JSON.parse(fs.readFileSync('data/sharedKotobaDictionary.json', 'utf8'));
const mapping = JSON.parse(fs.readFileSync('data/kotobaMapping.json', 'utf8'));

const bObj = manifest.batches.find(b => b.batchId === batchId);
if (!bObj) throw new Error(`Unknown batch ${batchId}`);

const masterKeys = new Set();
for (const e of Object.values(dict.terms || {})) {
  if (e && e.status === 'verified' && e.kanji && e.furigana !== 'たんご' && e.id !== 'kb-u1416-3f4581a001') {
    masterKeys.add(e.kanji.trim());
  }
}

const knownIdx = buildKnownLexiconIndex(dict);
const segJa = new Intl.Segmenter('ja', { granularity: 'word' });

const hiraNotInDict = new Map();
const missingSurfaces = new Map();
const errorsByPkg = {};

for (const sid of bObj.packageIds) {
  const pm = manifest.packages.find(p => p.setId === sid);
  const raw = JSON.parse(fs.readFileSync(pm.sourcePath, 'utf8'));
  const qs = (Array.isArray(raw) ? raw : raw.questions || []).filter(q => (q.setId || raw.setId || sid) === sid);
  errorsByPkg[sid] = { contexts: 0, errors: 0, byCode: {} };

  for (const q of qs) {
    const ctxs = [[q.id, q.prompt || q.questionText || extractQuestionPlainText(q), mapping.questions?.[q.id] || []]];
    for (let oi = 0; oi < (q.options || []).length; oi++) {
      const o = q.options[oi];
      const oid = extractOptionId(o, oi);
      const ck = `${q.id}::${oid}`;
      ctxs.push([ck, o.text || extractOptionPlainText(o), mapping.byCompositeKey?.[ck] || []]);
    }

    for (const [ck, html, ids] of ctxs) {
      errorsByPkg[sid].contexts++;
      const errs = validateStrictContext({
        contextKey: ck,
        html,
        termIds: ids,
        dict,
        knownLexiconIndex: pm.cohort === 'cohort_1_spec009_canonical' ? null : knownIdx,
      });
      for (const e of errs) {
        errorsByPkg[sid].errors++;
        errorsByPkg[sid].byCode[e.code] = (errorsByPkg[sid].byCode[e.code] || 0) + 1;
        if (e.surface && !masterKeys.has(e.surface)) {
          const rec = missingSurfaces.get(e.surface) || { count: 0, sample: cleanContextText(html).slice(0, 70), ck };
          rec.count++;
          missingSurfaces.set(e.surface, rec);
        }
      }

      // Also scan all hiragana >=2-char segments in non-Cohort-1 packages that might be content nouns/verbs in hiragana
      if (pm.cohort !== 'cohort_1_spec009_canonical') {
        const plain = cleanContextText(html);
        const mask = new Uint8Array(plain.length);
        for (const id of ids) {
          const k = dict.terms[id]?.kanji;
          if (!k) continue;
          let idx = plain.indexOf(k);
          while (idx !== -1) {
            for (let p = idx; p < idx + k.length; p++) mask[p] = 1;
            idx = plain.indexOf(k, idx + 1);
          }
        }
        for (const s of segJa.segment(plain)) {
          const w = s.segment;
          if (!/^[\u3041-\u3096ー]{2,}$/.test(w)) continue;
          let any = false;
          for (let p = s.index; p < s.index + w.length; p++) if (mask[p]) { any = true; break; }
          if (any || PURE_PARTICLES.has(w)) continue;
          if (!masterKeys.has(w)) {
            const rec = hiraNotInDict.get(w) || { count: 0, sample: plain.slice(0, 70), sid };
            rec.count++;
            hiraNotInDict.set(w, rec);
          }
        }
      }
    }
  }
}

console.log(`=== INSPECTION FOR ${batchId} ===`);
console.log(errorsByPkg);
console.log('\n--- Missing surfaces not in dict (' + missingSurfaces.size + ') ---');
for (const [k, v] of [...missingSurfaces.entries()].sort((a, b) => b[1].count - a[1].count)) {
  console.log(`${k} (${v.count}) [${v.ck}] -> ${v.sample}`);
}
console.log('\n--- Unmapped Hiragana segments in batch not in dict (' + hiraNotInDict.size + ', top 90) ---');
for (const [k, v] of [...hiraNotInDict.entries()].sort((a, b) => b[1].count - a[1].count).slice(0, 90)) {
  console.log(`${k} (${v.count}) [${v.sid}] -> ${v.sample}`);
}
