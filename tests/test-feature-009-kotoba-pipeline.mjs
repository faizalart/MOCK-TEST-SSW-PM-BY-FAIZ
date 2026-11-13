import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { auditSentenceSpans, auditPackageCoverage } from '../scripts/audit-kotoba-coverage.mjs';
import { validateKotobaPackage } from '../scripts/validate-kotoba-package.mjs';
import { mergeKotobaPackage } from '../scripts/merge-kotoba-package.mjs';
import { readJson } from '../scripts/lib/kotoba-pipeline-utils.mjs';

const ROOT = process.cwd();

function makeValidMeta(dataVersion = '20261113-v2') {
  return {
    schemaVersion: '2.0.0',
    dataVersion,
    license: 'CC-BY-SA-4.0',
    attribution: 'EDRDG / JMdict + In-House SSW PM Indonesian Curations'
  };
}

async function main() {
  console.log('=== FEATURE 009 (T020-T022): Kotoba Pipeline & Integrity Verification ===\n');

  // -------------------------------------------------------------------------
  // 1. T020: Full-Text Span Coverage Auditor
  // -------------------------------------------------------------------------
  const miniDict = {
    _meta: makeValidMeta(),
    terms: {
      't-ccp': {
        id: 't-ccp',
        kanji: '重要管理点',
        furigana: 'じゅうようかんりてん',
        unitType: 'compound_technical',
        arti: 'Titik Kendali Kritis (CCP)',
        status: 'verified'
      },
      't-wo': {
        id: 't-wo',
        kanji: 'を',
        furigana: '',
        unitType: 'particle',
        arti: 'partikel penanda objek',
        status: 'verified'
      },
      't-erabi': {
        id: 't-erabi',
        kanji: '選びなさい',
        furigana: 'えらびなさい',
        dictForm: '選ぶ',
        unitType: 'inflected_verb',
        arti: 'pilihlah (dasar: 選ぶ)',
        status: 'verified'
      }
    }
  };

  // Partial coverage MUST fail with UNRESOLVED_SPAN
  const partialRes = auditSentenceSpans('重要管理点を確認して選びなさい。', ['t-ccp', 't-erabi'], miniDict);
  assert.ok(partialRes.unresolvedSpans.length > 0, 'Expected UNRESOLVED_SPAN on partially covered sentence');
  assert.ok(partialRes.coveredPct < 100, 'Expected coveredPct < 100 for partial sentence');
  assert.equal(partialRes.unresolvedSpans[0].text, 'を確認して', 'Expected exact uncovered span');
  console.log('✓ T020.1: Partial token matching rejected with exact UNRESOLVED_SPAN');

  // Full coverage including structural punctuation & numeric/unit entities
  const fullRes = auditSentenceSpans('重要管理点（10℃）を選びなさい。', ['t-ccp', 't-wo', 't-erabi'], miniDict);
  assert.equal(fullRes.unresolvedSpans.length, 0, `Expected 0 UNRESOLVED_SPAN, got ${JSON.stringify(fullRes.unresolvedSpans)}`);
  assert.equal(fullRes.coveredPct, 100, 'Expected 100% coverage');
  assert.ok(fullRes.structuralEntities.some(e => e.type === 'numeric_unit' && e.text === '10℃'), 'Expected 10℃ classified as numeric_unit');
  assert.ok(fullRes.structuralEntities.some(e => e.type === 'structural_punctuation' && e.text.includes('。')), 'Expected punctuation classified');
  console.log('✓ T020.2: Full-text span coverage + structural/numeric classification verified (0 UNRESOLVED_SPAN)');

  // Audit Package 1 (100% if migrated, else UNRESOLVED_SPAN > 0) and an un-migrated package
  const legacyDict = readJson('data/sharedKotobaDictionary.json');
  const legacyMapping = readJson('data/kotobaMapping.json');
  const pkg1Audit = auditPackageCoverage('ssw-pm-kunci-ujian-1.json', legacyDict, legacyMapping);
  assert.equal(pkg1Audit.questionCount, 40, 'Expected 40 questions in kunci-ujian-1');
  assert.equal(pkg1Audit.sentenceCount, 160, 'Expected 40 prompts + 120 options = 160 sentences');
  if (legacyMapping._meta?.packageRollout?.['ssw-pm-kunci-ujian-1.json']?.status === 'migrated') {
    assert.equal(pkg1Audit.totalUnresolvedSpans, 0, 'Expected migrated Package 1 to have 0 UNRESOLVED_SPAN');
    console.log(`✓ T020.3: Migrated Package 1 audited (${pkg1Audit.sentenceCount} sentences, 100% covered, UNRESOLVED_SPAN=0)`);
  } else {
    assert.ok(pkg1Audit.totalUnresolvedSpans > 0, 'Expected legacy Feature 008 partial mapping to report UNRESOLVED_SPAN > 0');
    console.log(`✓ T020.3: Legacy Package 1 audited (${pkg1Audit.sentenceCount} sentences, UNRESOLVED_SPAN=${pkg1Audit.totalUnresolvedSpans})`);
  }

  // -------------------------------------------------------------------------
  // 2. T021: Dictionary Quality, Morphology & Hard-Fail Integrity Validator
  // -------------------------------------------------------------------------
  const baseMapping = {
    _meta: makeValidMeta(),
    questions: { 'kunci1-q001': ['t-ccp', 't-wo', 't-erabi'] },
    options: {},
    byCompositeKey: {}
  };

  // Valid case
  const validCheck = validateKotobaPackage({
    packageFile: 'ssw-pm-kunci-ujian-1.json',
    dict: miniDict,
    mapping: baseMapping,
    requireVersion2: true
  });
  assert.equal(validCheck.passed, true, `Expected validCheck to pass, errors=${JSON.stringify(validCheck.errors)}`);
  console.log('✓ T021.1: Valid v2 dictionary + mapping passed all quality & morphology rules');

  // Hard-fail: missing term ID
  const missingIdMapping = structuredClone(baseMapping);
  missingIdMapping.questions['kunci1-q001'].push('kb-does-not-exist');
  const missingRes = validateKotobaPackage({
    packageFile: 'ssw-pm-kunci-ujian-1.json',
    dict: miniDict,
    mapping: missingIdMapping
  });
  assert.equal(missingRes.passed, false, 'Expected hard-fail on missing term ID');
  assert.ok(missingRes.errors.some(e => e.code === 'MISSING_TERM_ID' && e.termId === 'kb-does-not-exist'));
  console.log('✓ T021.2: Hard-fail with explicit MISSING_TERM_ID diagnostic verified');

  // Hard-fail: schemaVersion mismatch
  const schemaMismatchMapping = structuredClone(baseMapping);
  schemaMismatchMapping._meta.schemaVersion = '1.0.0';
  const schemaRes = validateKotobaPackage({
    packageFile: 'ssw-pm-kunci-ujian-1.json',
    dict: miniDict,
    mapping: schemaMismatchMapping
  });
  assert.equal(schemaRes.passed, false, 'Expected hard-fail on schemaVersion mismatch');
  assert.ok(schemaRes.errors.some(e => e.code === 'SCHEMA_VERSION_MISMATCH'));

  // Hard-fail: dataVersion mismatch
  const dataMismatchMapping = structuredClone(baseMapping);
  dataMismatchMapping._meta.dataVersion = '20260101-old';
  const dataRes = validateKotobaPackage({
    packageFile: 'ssw-pm-kunci-ujian-1.json',
    dict: miniDict,
    mapping: dataMismatchMapping
  });
  assert.equal(dataRes.passed, false, 'Expected hard-fail on dataVersion mismatch');
  assert.ok(dataRes.errors.some(e => e.code === 'DATA_VERSION_MISMATCH'));
  console.log('✓ T021.3: Hard-fail on schemaVersion & dataVersion mismatch verified');

  // Hard-fail: single-kanji fragment + missing furigana + inline occurrences bloat
  const badDict = structuredClone(miniDict);
  badDict.terms['t-frag'] = {
    id: 't-frag',
    kanji: '管',
    furigana: '',
    unitType: 'morpheme_fragment',
    arti: 'kelola',
    status: 'verified',
    occurrences: [{ qId: 'kunci1-q001' }]
  };
  const badMapping = structuredClone(baseMapping);
  badMapping.questions['kunci1-q001'].push('t-frag');
  const badRes = validateKotobaPackage({
    packageFile: 'ssw-pm-kunci-ujian-1.json',
    dict: badDict,
    mapping: badMapping
  });
  assert.equal(badRes.passed, false, 'Expected hard-fail on fragment/furigana/occurrences');
  assert.ok(badRes.errors.some(e => e.code === 'MORPHEME_FRAGMENT'));
  assert.ok(badRes.errors.some(e => e.code === 'INVALID_WHOLE_WORD_FURIGANA'));
  assert.ok(badRes.errors.some(e => e.code === 'INLINE_OCCURRENCES_BLOAT'));
  console.log('✓ T021.4: Fragment, missing furigana, and inline occurrences bloat hard-fail verified');

  // -------------------------------------------------------------------------
  // 3. T022: Package-by-Package Merge & Reconciliation Tool + Runtime Diagnostic
  // -------------------------------------------------------------------------
  // Aborts merge if coverage fails (never mutates targetDict / targetMapping)
  const abortRes = mergeKotobaPackage({
    packageFile: 'ssw-pm-kunci-ujian-1.json',
    candidateDict: miniDict,
    candidateMapping: baseMapping,
    targetDict: legacyDict,
    targetMapping: legacyMapping,
    dryRun: true
  });
  assert.equal(abortRes.merged, false, 'Expected merge to abort when coverage fails');
  assert.equal(abortRes.stage, 'coverage');
  console.log('✓ T022.1: Merge tool aborts safely when T020 coverage gate fails');

  // Successful merge on a 100% covered synthetic package preserves un-migrated packages
  const pkg1 = readJson('ssw-pm-kunci-ujian-1.json');
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ssw-f009-merge-'));
  try {
    // Build a complete candidate dictionary/mapping covering every character of pkg1
    const fullCandDict = { _meta: makeValidMeta(), terms: {} };
    const fullCandMap = { _meta: makeValidMeta(), questions: {}, options: {}, byCompositeKey: {} };
    let seq = 0;
    const registerSentence = (rawText) => {
      const clean = rawText
        .replace(/<rt\b[^>]*>[\s\S]*?<\/rt>/gi, '')
        .replace(/<[^>]+>/g, '')
        .trim();
      const id = `t-full-${++seq}`;
      fullCandDict.terms[id] = {
        id,
        kanji: clean,
        furigana: 'てすと',
        unitType: 'expression',
        arti: 'arti ringkas',
        status: 'verified'
      };
      return [id];
    };
    for (const q of pkg1.questions) {
      fullCandMap.questions[q.id] = registerSentence(q.questionText || q.prompt);
      fullCandMap.options[q.id] = {};
      for (const opt of q.options) {
        const oid = opt.originalId || opt.id;
        const ids = registerSentence(opt.text);
        fullCandMap.options[q.id][oid] = ids;
        fullCandMap.byCompositeKey[`${q.id}::${oid}`] = ids;
      }
    }

    const outDictPath = path.join(tmpDir, 'dict.json');
    const outMapPath = path.join(tmpDir, 'map.json');
    fs.writeFileSync(outDictPath, JSON.stringify(legacyDict));
    fs.writeFileSync(outMapPath, JSON.stringify(legacyMapping));

    const okMerge = mergeKotobaPackage({
      packageFile: 'ssw-pm-kunci-ujian-1.json',
      candidateDict: fullCandDict,
      candidateMapping: fullCandMap,
      targetDict: legacyDict,
      targetMapping: legacyMapping,
      dryRun: true
    });
    assert.equal(okMerge.merged, true, `Expected dryRun merge to succeed, error=${okMerge.error}`);
    assert.equal(okMerge.nextMapping._meta.packageRollout['ssw-pm-kunci-ujian-1.json'].status, 'migrated');
    // Un-migrated package (kunci2-q001) must remain untouched on Feature 008 data
    assert.deepEqual(
      okMerge.nextMapping.questions['kunci2-q001'],
      legacyMapping.questions['kunci2-q001'],
      'Un-migrated package mapping must remain on Feature 008 baseline'
    );
    assert.ok(okMerge.ledger.entries.length > 0, 'Expected reconciliation ledger entries');
    console.log(`✓ T022.2: Merge preserves un-migrated packages & builds reconciliation ledger (${okMerge.ledger.entries.length} entries)`);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  // Runtime resolveKotobaEntries() diagnostic check in app.js
  const appSource = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
  const fnMatch = appSource.match(/const kotobaDiagnosticLogged = new Set\(\);[\s\S]*?function resolveKotobaEntries\([\s\S]*?\n\}/);
  assert.ok(fnMatch, 'Expected updated resolveKotobaEntries with kotobaDiagnosticLogged in app.js');
  const loggedErrors = [];
  const mockConsole = { error: (...a) => loggedErrors.push(a.join(' ')) };
  const kotobaDictionaryCache = null;
  const kotobaMappingCache = null;
  const evalFn = new Function(
    'console',
    'kotobaDictionaryCache',
    'kotobaMappingCache',
    `${fnMatch[0]}; return resolveKotobaEntries;`
  );
  const resolveKotobaEntries = evalFn(mockConsole, kotobaDictionaryCache, kotobaMappingCache);

  const diagDict = {
    _meta: { schemaVersion: '2.0.0', dataVersion: 'v2' },
    terms: {
      'ok-1': { id: 'ok-1', kanji: '食品', furigana: 'しょくひん', arti: 'makanan', status: 'verified' }
    }
  };
  const diagMap = {
    _meta: { schemaVersion: '1.0.0', dataVersion: 'v1' },
    questions: { q1: ['ok-1', 'missing-999'] },
    options: {},
    byCompositeKey: {}
  };
  const resolved = resolveKotobaEntries('q1', null, diagDict, diagMap);
  assert.equal(resolved.length, 1, 'Expected valid entry to resolve safely without crashing');
  assert.equal(resolved[0].id, 'ok-1');
  assert.ok(loggedErrors.some(m => m.includes('Version mismatch')), 'Expected explicit console.error for version mismatch');
  assert.ok(loggedErrors.some(m => m.includes('Missing term ID')), 'Expected explicit console.error for missing term ID');
  console.log('✓ T022.3: Runtime resolveKotobaEntries() logs explicit console.error diagnostics without crashing UI');

  console.log('\nALL FEATURE 009 (T020-T022) KOTOBA PIPELINE TESTS PASSED!');
}

main().catch(err => {
  console.error('\nTEST FAILED:', err);
  process.exit(1);
});
