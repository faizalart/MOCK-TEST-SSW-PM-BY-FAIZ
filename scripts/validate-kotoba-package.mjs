import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  CANONICAL_PACKAGES,
  DEFAULT_DICT_PATH,
  DEFAULT_MAPPING_PATH,
  getMetaVersions,
  hasKanji,
  isSingleKanji,
  isValidHiraganaReading,
  loadPackageQuestions,
  readJson
} from './lib/kotoba-pipeline-utils.mjs';

function checkLicenseAttribution(dictMeta = {}) {
  const licenseRaw = String(dictMeta.license || dictMeta.datasetLicense || '').toUpperCase();
  const hasCcBySa = licenseRaw.includes('CC-BY-SA-4.0') || licenseRaw.includes('CC BY-SA 4.0');
  const attrText = [
    dictMeta.attribution || '',
    dictMeta.upstreamSource?.organization || '',
    dictMeta.upstreamSource?.project || ''
  ].join(' ');
  const hasEdrdg = /EDRDG/i.test(attrText) && /JMdict/i.test(attrText);
  return { valid: hasCcBySa && hasEdrdg, hasCcBySa, hasEdrdg };
}

export function validateKotobaPackage({
  packageFile,
  dict,
  mapping,
  requireVersion2 = false,
  disallowInlineOccurrences = true
}) {
  const errors = [];
  const warnings = [];

  if (!dict || typeof dict.terms !== 'object') {
    errors.push({ code: 'INVALID_DICTIONARY', message: 'Dictionary missing valid "terms" object.' });
    return { packageFile, passed: false, errors, warnings, stats: {} };
  }
  if (!mapping || typeof mapping !== 'object') {
    errors.push({ code: 'INVALID_MAPPING', message: 'Mapping file missing or invalid.' });
    return { packageFile, passed: false, errors, warnings, stats: {} };
  }

  // 1. Version synchronization checks (hard-fail on mismatch)
  const dictMeta = dict._meta || {};
  const mapMeta = mapping._meta || {};
  const dictVer = getMetaVersions(dictMeta);
  const mapVer = getMetaVersions(mapMeta);

  if (dictVer.schemaVersion !== mapVer.schemaVersion) {
    errors.push({
      code: 'SCHEMA_VERSION_MISMATCH',
      message: `schemaVersion mismatch: dictionary=${dictVer.schemaVersion} vs mapping=${mapVer.schemaVersion}`
    });
  }
  if (dictVer.dataVersion !== mapVer.dataVersion) {
    errors.push({
      code: 'DATA_VERSION_MISMATCH',
      message: `dataVersion mismatch: dictionary=${dictVer.dataVersion} vs mapping=${mapVer.dataVersion}`
    });
  }
  if (requireVersion2 && (dictVer.schemaVersion !== '2.0.0' || mapVer.schemaVersion !== '2.0.0')) {
    errors.push({
      code: 'SCHEMA_VERSION_MISMATCH',
      message: `Expected schemaVersion "2.0.0" in both artifacts, got dict=${dictVer.schemaVersion}, mapping=${mapVer.schemaVersion}`
    });
  }

  // 2. License & EDRDG/JMdict attribution check
  const lic = checkLicenseAttribution(dictMeta);
  if (!lic.valid) {
    errors.push({
      code: 'LICENSE_ATTRIBUTION_INVALID',
      message: `Missing CC-BY-SA-4.0 or EDRDG/JMdict attribution in dictionary _meta (hasCcBySa=${lic.hasCcBySa}, hasEdrdg=${lic.hasEdrdg}).`
    });
  }

  // 3. Per-sentence referential integrity & morphology/quality checks
  const questions = loadPackageQuestions(packageFile);
  const referencedIds = new Set();

  const inspectTermList = (termIds, location, sentenceText) => {
    const entriesInSentence = [];
    for (const rawId of Array.isArray(termIds) ? termIds : []) {
      const id = typeof rawId === 'string' ? rawId.trim() : '';
      if (!id) continue;
      const entry = dict.terms[id];
      if (!entry) {
        errors.push({
          code: 'MISSING_TERM_ID',
          termId: id,
          location,
          message: `Missing term ID "${id}" referenced at ${location}`
        });
        continue;
      }
      if (entry.status !== 'verified') {
        errors.push({
          code: 'UNVERIFIED_TERM',
          termId: id,
          location,
          message: `Term "${id}" at ${location} has non-verified status "${entry.status}"`
        });
      }
      referencedIds.add(id);
      entriesInSentence.push({ id, entry });
    }

    // Fragment check: single kanji extracted from a longer word in same sentence
    const multiKanjiTerms = entriesInSentence
      .map(x => String(x.entry.kanji || ''))
      .filter(k => [...k].length >= 2 && hasKanji(k));

    for (const { id, entry } of entriesInSentence) {
      const k = String(entry.kanji || '').trim();
      if (entry.unitType === 'morpheme_fragment') {
        errors.push({
          code: 'MORPHEME_FRAGMENT',
          termId: id,
          location,
          message: `Fragment term "${id}" (${k}) with unitType="morpheme_fragment" is disallowed at ${location}`
        });
      } else if (isSingleKanji(k)) {
        const embeddedInLonger = multiKanjiTerms.some(mk => mk.includes(k));
        // Flag if the single kanji only appears inside longer kanji compounds and not standalone
        if (embeddedInLonger && sentenceText) {
          const standaloneMatch = new RegExp(`(?<![\\u4e00-\\u9faf])${k}(?![\\u4e00-\\u9faf])`).test(sentenceText);
          if (!standaloneMatch) {
            errors.push({
              code: 'SINGLE_KANJI_FRAGMENT',
              termId: id,
              location,
              message: `Single-kanji fragment "${id}" (${k}) belongs to longer compound at ${location}`
            });
          }
        }
      }
    }
  };

  for (const q of questions) {
    inspectTermList(mapping.questions?.[q.id] || [], `questions.${q.id}`, q.promptText);
    for (const opt of q.options) {
      const compositeKey = `${q.id}::${opt.optId}`;
      const optIds = Array.isArray(mapping.byCompositeKey?.[compositeKey])
        ? mapping.byCompositeKey[compositeKey]
        : (mapping.options?.[q.id]?.[opt.optId] || []);
      inspectTermList(optIds, `byCompositeKey.${compositeKey}`, opt.text);
    }
  }

  // 4. Referenced dictionary entries quality checks
  let over40Count = 0;
  for (const id of referencedIds) {
    const entry = dict.terms[id];
    if (!entry) continue;

    const kanji = String(entry.kanji || '').trim();
    const furigana = String(entry.furigana || '').trim();
    const arti = String(entry.arti || '').trim();

    if (hasKanji(kanji) && !isValidHiraganaReading(furigana)) {
      errors.push({
        code: 'INVALID_WHOLE_WORD_FURIGANA',
        termId: id,
        message: `Term "${id}" (${kanji}) lacks valid whole-word Hiragana furigana ("${furigana}").`
      });
    }

    if ((entry.unitType === 'inflected_verb' || entry.unitType === 'inflected_adj') && !String(entry.dictForm || '').trim()) {
      errors.push({
        code: 'MISSING_DICT_FORM',
        termId: id,
        message: `Inflected term "${id}" (${kanji}) must specify dictForm.`
      });
    }

    if (!arti) {
      errors.push({
        code: 'EMPTY_MEANING',
        termId: id,
        message: `Term "${id}" (${kanji}) has empty Indonesian meaning.`
      });
    } else {
      if (arti.length > 40) over40Count++;
      const isApprovedTech =
        entry.unitType === 'technical' ||
        entry.unitType === 'compound_technical' ||
        entry.unitType === 'abbreviation' ||
        Boolean(entry.allowTechnicalExpansion);
      if (arti.length > 60 && !isApprovedTech) {
        errors.push({
          code: 'MEANING_TOO_LONG',
          termId: id,
          message: `Term "${id}" (${kanji}) meaning exceeds 60 chars (${arti.length} chars): "${arti}"`
        });
      }
    }

    if (disallowInlineOccurrences && Array.isArray(entry.occurrences) && entry.occurrences.length > 0) {
      errors.push({
        code: 'INLINE_OCCURRENCES_BLOAT',
        termId: id,
        message: `Term "${id}" still contains verbose inline occurrences array (${entry.occurrences.length} items).`
      });
    }
  }

  const totalTerms = referencedIds.size;
  const under40Pct = totalTerms > 0 ? Number((((totalTerms - over40Count) / totalTerms) * 100).toFixed(2)) : 100;
  if (totalTerms > 0 && under40Pct < 95) {
    errors.push({
      code: 'CONCISE_MEANING_RATIO_BELOW_95',
      message: `Only ${under40Pct}% of meanings are <= 40 chars (minimum 95% required; ${over40Count}/${totalTerms} > 40 chars).`
    });
  }

  return {
    packageFile,
    passed: errors.length === 0,
    errors,
    warnings,
    stats: {
      questionCount: questions.length,
      referencedTermCount: totalTerms,
      under40Pct,
      over40Count
    }
  };
}

function parseArgs(argv) {
  const args = {
    packages: [],
    dictPath: DEFAULT_DICT_PATH,
    mappingPath: DEFAULT_MAPPING_PATH,
    strictVersion: false,
    allowInlineOccurrences: false
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--package' && argv[i + 1]) args.packages.push(argv[++i]);
    else if (a === '--all') args.packages = [...CANONICAL_PACKAGES];
    else if (a === '--dict' && argv[i + 1]) args.dictPath = argv[++i];
    else if (a === '--mapping' && argv[i + 1]) args.mappingPath = argv[++i];
    else if (a === '--strict-version') args.strictVersion = true;
    else if (a === '--allow-inline-occurrences') args.allowInlineOccurrences = true;
  }
  if (!args.packages.length) args.packages = [...CANONICAL_PACKAGES];
  return args;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const args = parseArgs(process.argv.slice(2));
  const dict = readJson(args.dictPath);
  const mapping = readJson(args.mappingPath);

  let allPassed = true;
  for (const pkgFile of args.packages) {
    const res = validateKotobaPackage({
      packageFile: pkgFile,
      dict,
      mapping,
      requireVersion2: args.strictVersion,
      disallowInlineOccurrences: !args.allowInlineOccurrences
    });
    console.log(
      `[Validate] ${pkgFile}: ${res.passed ? 'PASS' : 'FAIL'} | terms=${res.stats.referencedTermCount} | <=40ch=${res.stats.under40Pct}% | errors=${res.errors.length}`
    );
    if (!res.passed) {
      allPassed = false;
      for (const err of res.errors.slice(0, 15)) {
        console.error(`  - [${err.code}] ${err.message}`);
      }
      if (res.errors.length > 15) {
        console.error(`  ... (${res.errors.length - 15} more errors)`);
      }
    }
  }

  if (!allPassed) {
    process.exit(1);
  }
}
