import fs from 'node:fs';
import path from 'node:path';
import {
  hasKanji,
  isSingleKanji,
  isValidHiraganaReading,
  stripRubyAndHtml,
  extractQuestionPlainText,
  extractOptionId,
  extractOptionPlainText,
} from '../../scripts/lib/kotoba-pipeline-utils.mjs';
import { validateContextCompleteness } from '../../scripts/validate-otaff-kotoba-completeness.mjs';

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'deliverables/kotoba-audit-40');

const manifest = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'target-manifest.json'), 'utf8'));
const dict = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/sharedKotobaDictionary.json'), 'utf8'));
const mapping = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/kotobaMapping.json'), 'utf8'));
const kt = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/kotoba-dan-kategori-tambahan.json'), 'utf8'));

const terms = dict.terms || {};

// Build lookup map by kanji surface from verified master terms
const masterBySurface = new Map();
for (const [id, e] of Object.entries(terms)) {
  if (!e || e.status !== 'verified' || !e.kanji) continue;
  if (e.unitType === 'morpheme_fragment' || e.entryType === 'morpheme_fragment') continue;
  if (e.furigana === 'たんご') continue;
  const k = e.kanji.trim();
  if (!masterBySurface.has(k)) masterBySurface.set(k, []);
  masterBySurface.get(k).push({ id, ...e });
}

// Track which dict IDs are referenced by the 10 protected OTAFF packages
const protectedSetIds = new Set(manifest.protectedReferencePackageIds);
const protectedTermIds = new Set();
const pkgQuestionsBySet = new Map();

for (const pkgMeta of manifest.packages) {
  const raw = JSON.parse(fs.readFileSync(path.join(ROOT, pkgMeta.sourcePath), 'utf8'));
  const qs = Array.isArray(raw) ? raw : (raw.questions || []);
  const setQs = qs.filter(q => (q.setId || raw.setId || pkgMeta.setId) === pkgMeta.setId);
  pkgQuestionsBySet.set(pkgMeta.setId, setQs);

  if (protectedSetIds.has(pkgMeta.setId)) {
    for (const q of setQs) {
      for (const id of (mapping.questions?.[q.id] || [])) protectedTermIds.add(id);
      for (let oIdx = 0; oIdx < (q.options || []).length; oIdx++) {
        const oid = extractOptionId(q.options[oIdx], oIdx);
        const ck = `${q.id}::${oid}`;
        for (const id of (mapping.byCompositeKey?.[ck] || mapping.options?.[q.id]?.[oid] || [])) {
          protectedTermIds.add(id);
        }
      }
    }
  }
}

const segJa = new Intl.Segmenter('ja', { granularity: 'word' });
const KNOWN_KANJI_INDEX = (() => {
  const map = new Map();
  for (const [k, list] of masterBySurface.entries()) {
    if ([...k].length < 2) continue;
    if (/^[A-Za-z]+$/.test(k) && !new Set(['ppm', 'HACCP', 'CCP', 'KYT', 'FIFO', 'OTAFF', 'SNS', '5S', 'O157', 'O111']).has(k)) continue;
    if (!map.has(k[0])) map.set(k[0], []);
    map.get(k[0]).push(k);
  }
  for (const arr of map.values()) arr.sort((a, b) => b.length - a.length);
  return map;
})();

const PREFIX_MARKER_RE = /^(?:\[(?:イラスト|標識|図|写真|品目|保護具)[A-Za-z0-9]+\]\s*)+/u;
function cleanPlain(html) {
  return stripRubyAndHtml(String(html || '').replace(/\*\*/g, '')).replace(PREFIX_MARKER_RE, '');
}

const targetPackages = manifest.packages.filter(p => p.role === 'target_repair_50');

const report = {
  _meta: {
    generatedAt: new Date().toISOString(),
    targetPackageCount: targetPackages.length,
    protectedTermIdsCount: protectedTermIds.size,
  },
  summaryByBatch: {},
  summaryByCohort: {},
  errorCodeTotals: {},
  cohort1Details: [],
  dictAnomaliesUsedInTargets: [],
  missingSurfacesWithMasterMatch: {},
  missingSurfacesNeedingCuration: {},
  optionsVsCompositeMismatches: [],
  sampleErrorsByCode: {},
};

const dictAnomalySeen = new Set();

function recordErr(pkgMeta, err, plain) {
  report.errorCodeTotals[err.code] = (report.errorCodeTotals[err.code] || 0) + 1;
  if (!report.sampleErrorsByCode[err.code]) report.sampleErrorsByCode[err.code] = [];
  if (report.sampleErrorsByCode[err.code].length < 25) {
    report.sampleErrorsByCode[err.code].push({
      setId: pkgMeta.setId,
      cohort: pkgMeta.cohort,
      batchId: pkgMeta.batchId,
      contextKey: err.contextKey,
      termId: err.termId || null,
      surface: err.surface || null,
      message: err.message,
      plainSample: plain.slice(0, 80),
    });
  }
  if (pkgMeta.cohort === 'cohort_1_spec009_canonical') {
    report.cohort1Details.push({
      setId: pkgMeta.setId,
      batchId: pkgMeta.batchId,
      code: err.code,
      contextKey: err.contextKey,
      termId: err.termId || null,
      surface: err.surface || null,
      message: err.message,
      plainSample: plain.slice(0, 80),
    });
  }
  if (err.code === 'MISSING_LEXICAL_TERM' || err.code === 'UNMAPPED_DICTIONARY_TERM') {
    const surf = err.surface;
    const hits = masterBySurface.get(surf);
    if (hits && hits.length > 0) {
      if (!report.missingSurfacesWithMasterMatch[surf]) {
        report.missingSurfacesWithMasterMatch[surf] = { count: 0, sampleIds: hits.slice(0, 3).map(h => ({ id: h.id, furigana: h.furigana, arti: h.arti })), sampleCtx: [] };
      }
      report.missingSurfacesWithMasterMatch[surf].count++;
      if (report.missingSurfacesWithMasterMatch[surf].sampleCtx.length < 3) {
        report.missingSurfacesWithMasterMatch[surf].sampleCtx.push(`${pkgMeta.setId}:${err.contextKey}`);
      }
    } else {
      if (!report.missingSurfacesNeedingCuration[surf]) {
        report.missingSurfacesNeedingCuration[surf] = { count: 0, cohorts: [], sampleCtx: [], samplePlain: plain.slice(0, 90) };
      }
      report.missingSurfacesNeedingCuration[surf].count++;
      if (!report.missingSurfacesNeedingCuration[surf].cohorts.includes(pkgMeta.cohort)) {
        report.missingSurfacesNeedingCuration[surf].cohorts.push(pkgMeta.cohort);
      }
      if (report.missingSurfacesNeedingCuration[surf].sampleCtx.length < 3) {
        report.missingSurfacesNeedingCuration[surf].sampleCtx.push(`${pkgMeta.setId}:${err.contextKey}`);
      }
    }
  }
}

for (const pkgMeta of targetPackages) {
  const qs = pkgQuestionsBySet.get(pkgMeta.setId) || [];
  let ctxCount = 0;
  let pkgErrCount = 0;
  const pkgErrByCode = {};

  for (const q of qs) {
    // Stem
    ctxCount++;
    const pHtml = q.prompt || q.questionText || '';
    const pPlain = cleanPlain(pHtml || extractQuestionPlainText(q));
    const pIds = mapping.questions?.[q.id];
    const pErrs = validateContextCompleteness({
      contextKey: q.id,
      html: pHtml || extractQuestionPlainText(q),
      termIds: pIds,
      dict,
      otaffKnownKanjis: null,
    });
    for (const e of pErrs) {
      pkgErrCount++;
      pkgErrByCode[e.code] = (pkgErrByCode[e.code] || 0) + 1;
      recordErr(pkgMeta, e, pPlain);
    }

    if (Array.isArray(pIds)) {
      for (const id of pIds) {
        const entry = terms[id];
        if (entry && !dictAnomalySeen.has(id)) {
          const issues = [];
          if (entry.status !== 'verified') issues.push(`status:${entry.status}`);
          if (entry.furigana === 'たんご') issues.push('furigana:たんご');
          if (hasKanji(entry.kanji) && (!entry.furigana || !isValidHiraganaReading(entry.furigana))) issues.push(`badFurigana:${entry.furigana}`);
          if (!entry.arti || entry.arti.length > 60) issues.push(`badArtiLen:${entry.arti?.length}`);
          if (issues.length) {
            dictAnomalySeen.add(id);
            report.dictAnomaliesUsedInTargets.push({
              id,
              kanji: entry.kanji,
              furigana: entry.furigana,
              arti: entry.arti,
              usedInProtectedOtaff: protectedTermIds.has(id),
              issues,
            });
          }
        }
      }
    }

    // Options
    const opts = Array.isArray(q.options) ? q.options : [];
    for (let oIdx = 0; oIdx < opts.length; oIdx++) {
      ctxCount++;
      const opt = opts[oIdx];
      const oid = extractOptionId(opt, oIdx);
      const ck = `${q.id}::${oid}`;
      const byCk = mapping.byCompositeKey?.[ck];
      const byOpt = mapping.options?.[q.id]?.[oid];

      if (JSON.stringify(byCk) !== JSON.stringify(byOpt)) {
        report.optionsVsCompositeMismatches.push({
          setId: pkgMeta.setId,
          contextKey: ck,
          byCkLen: Array.isArray(byCk) ? byCk.length : null,
          byOptLen: Array.isArray(byOpt) ? byOpt.length : null,
        });
      }

      const oIds = Array.isArray(byCk) ? byCk : (Array.isArray(byOpt) ? byOpt : null);
      const oHtml = opt.text || '';
      const oPlain = cleanPlain(oHtml || extractOptionPlainText(opt));
      const oErrs = validateContextCompleteness({
        contextKey: ck,
        html: oHtml || extractOptionPlainText(opt),
        termIds: oIds,
        dict,
        otaffKnownKanjis: null,
      });
      for (const e of oErrs) {
        pkgErrCount++;
        pkgErrByCode[e.code] = (pkgErrByCode[e.code] || 0) + 1;
        recordErr(pkgMeta, e, oPlain);
      }
    }
  }

  if (!report.summaryByBatch[pkgMeta.batchId]) {
    report.summaryByBatch[pkgMeta.batchId] = { packages: [], contexts: 0, errors: 0 };
  }
  report.summaryByBatch[pkgMeta.batchId].packages.push({
    setId: pkgMeta.setId,
    cohort: pkgMeta.cohort,
    contexts: ctxCount,
    errors: pkgErrCount,
    byCode: pkgErrByCode,
  });
  report.summaryByBatch[pkgMeta.batchId].contexts += ctxCount;
  report.summaryByBatch[pkgMeta.batchId].errors += pkgErrCount;

  if (!report.summaryByCohort[pkgMeta.cohort]) {
    report.summaryByCohort[pkgMeta.cohort] = { packages: 0, contexts: 0, errors: 0, byCode: {} };
  }
  report.summaryByCohort[pkgMeta.cohort].packages++;
  report.summaryByCohort[pkgMeta.cohort].contexts += ctxCount;
  report.summaryByCohort[pkgMeta.cohort].errors += pkgErrCount;
  for (const [c, n] of Object.entries(pkgErrByCode)) {
    report.summaryByCohort[pkgMeta.cohort].byCode[c] = (report.summaryByCohort[pkgMeta.cohort].byCode[c] || 0) + n;
  }
}

// Sort missing surfaces by frequency descending
const sortObj = (obj) => Object.fromEntries(
  Object.entries(obj).sort((a, b) => b[1].count - a[1].count)
);
report.missingSurfacesWithMasterMatch = sortObj(report.missingSurfacesWithMasterMatch);
report.missingSurfacesNeedingCuration = sortObj(report.missingSurfacesNeedingCuration);

fs.writeFileSync(path.join(OUT_DIR, 'phase2-all50-audit-findings.json'), JSON.stringify(report, null, 2) + '\n');

console.log('=== PHASE 2 ALL-50 AUDIT SUMMARY ===');
console.log('Error code totals:', report.errorCodeTotals);
console.log('Summary by cohort:', report.summaryByCohort);
console.log('Dict anomalies used in targets:', report.dictAnomaliesUsedInTargets.length);
console.log('Options vs CompositeKey mismatches:', report.optionsVsCompositeMismatches.length);
console.log('Missing surfaces with existing master match:', Object.keys(report.missingSurfacesWithMasterMatch).length);
console.log('Missing surfaces needing curation (unique):', Object.keys(report.missingSurfacesNeedingCuration).length);
console.log('Top 25 needing curation:', Object.entries(report.missingSurfacesNeedingCuration).slice(0, 25).map(([k, v]) => `${k}(${v.count})`).join(', '));
console.log('Cohort 1 errors total:', report.cohort1Details.length);
