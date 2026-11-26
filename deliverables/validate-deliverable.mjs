import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';

const ROOT = process.cwd();
const SKILL_DIR = path.join(ROOT, 'deliverables', 'pdf-to-json');
const ZIP_PATH = path.join(ROOT, 'deliverables', 'pdf-to-json-gemini-skill.zip');

let passed = 0;
function check(name, fn) {
  try {
    fn();
    console.log(`PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`FAIL: ${name}\n  -> ${err.message}`);
    process.exitCode = 1;
  }
}

console.log('=== VALIDATOR: pdf-to-json GEMINI SKILL DELIVERABLE ===\n');

// 1. Parse all JSON files
const nguyenPath = path.join(SKILL_DIR, 'references', 'gold-standard-nguyen-example.json');
const u16Path = path.join(SKILL_DIR, 'references', 'gold-standard-kunci-ujian-16-example.json');
const exQPath = path.join(SKILL_DIR, 'examples', 'example-question.json');

let nguyenPkg, u16Pkg, exQ;
check('1. Parse all JSON files cleanly', () => {
  assert.ok(fs.existsSync(nguyenPath), 'gold-standard-nguyen-example.json missing');
  assert.ok(fs.existsSync(u16Path), 'gold-standard-kunci-ujian-16-example.json missing');
  assert.ok(fs.existsSync(exQPath), 'example-question.json missing');
  assert.ok(!fs.existsSync(path.join(SKILL_DIR, 'references', 'gold-standard-package.json')), 'Old mixed gold-standard-package.json must be removed');
  nguyenPkg = JSON.parse(fs.readFileSync(nguyenPath, 'utf8'));
  u16Pkg = JSON.parse(fs.readFileSync(u16Path, 'utf8'));
  exQ = JSON.parse(fs.readFileSync(exQPath, 'utf8'));
});

// 2. Verify packages do not mix setId
check('2. Verify no mixed setId inside any package', () => {
  for (const pkg of [nguyenPkg, u16Pkg]) {
    assert.ok(pkg.setId && pkg.questions.length > 0);
    for (const q of pkg.questions) {
      assert.equal(q.setId, pkg.setId, `Question ${q.id} has setId ${q.setId} != ${pkg.setId}`);
    }
  }
});

// 3. Verify setName consistency
check('3. Verify setName of all questions matches top-level setName', () => {
  for (const pkg of [nguyenPkg, u16Pkg]) {
    for (const q of pkg.questions) {
      assert.equal(q.setName, pkg.setName, `Question ${q.id} has setName ${q.setName} != ${pkg.setName}`);
    }
  }
});

// 4. Verify question count matches metadata
check('4. Verify totalQuestions matches questions.length', () => {
  for (const pkg of [nguyenPkg, u16Pkg]) {
    assert.equal(pkg.questions.length, pkg.totalQuestions, `${pkg.setId}: length ${pkg.questions.length} !== totalQuestions ${pkg.totalQuestions}`);
  }
});

// 5. Verify correctAnswer and correctIndex parity
check('5. Verify correctAnswer and correctIndex match options', () => {
  for (const q of [...nguyenPkg.questions, ...u16Pkg.questions, exQ]) {
    assert.ok(Number.isInteger(q.correctIndex) && q.correctIndex >= 0 && q.correctIndex < q.options.length, `Invalid correctIndex on ${q.id}`);
    assert.equal(q.options[q.correctIndex].id, q.correctAnswer, `correctAnswer mismatch on ${q.id}`);
  }
});

// 6. Verify all option IDs
check('6. Verify all option IDs (A, B, C, ...)', () => {
  for (const q of [...nguyenPkg.questions, ...u16Pkg.questions, exQ]) {
    assert.ok(Array.isArray(q.options) && q.options.length >= 2);
    q.options.forEach((opt, idx) => {
      assert.equal(opt.id, String.fromCharCode(65 + idx), `Option index ${idx} has id ${opt.id} on ${q.id}`);
    });
  }
});

// 7 & 8. Verify mediaId and media paths
check('7 & 8. Verify mediaId references and assets/questions/ paths', () => {
  for (const q of [...nguyenPkg.questions, ...u16Pkg.questions, exQ]) {
    const mediaMap = new Map((q.media || []).map(m => [m.id, m]));
    if (q.imageMediaId) {
      assert.ok(mediaMap.has(q.imageMediaId), `Missing media entry for imageMediaId ${q.imageMediaId} on ${q.id}`);
      assert.ok(q.questionImage.startsWith('assets/questions/'), `questionImage path invalid on ${q.id}`);
      assert.equal(mediaMap.get(q.imageMediaId).path, q.questionImage);
    }
    for (const opt of q.options) {
      if (opt.mediaId) {
        assert.ok(mediaMap.has(opt.mediaId), `Missing media entry for option ${opt.id} mediaId ${opt.mediaId} on ${q.id}`);
        assert.ok(mediaMap.get(opt.mediaId).path.startsWith('assets/questions/'), `Option media path invalid on ${q.id}`);
      }
    }
  }
});

// 9. Verify referenced PNG files exist physically in examples/example-assets/
check('9. Verify referenced PNG files exist in examples/example-assets/', () => {
  const assetsDir = path.join(SKILL_DIR, 'examples', 'example-assets');
  for (const q of [...nguyenPkg.questions, ...u16Pkg.questions]) {
    for (const m of (q.media || [])) {
      const filename = path.basename(m.path);
      const localAsset = path.join(assetsDir, filename);
      assert.ok(fs.existsSync(localAsset), `Missing example asset ${filename}`);
      assert.ok(fs.statSync(localAsset).size > 0, `Empty example asset ${filename}`);
    }
  }
});

// 10, 11, 12, 13. Verify Kotoba mapping, dictionary, status, kotobaU & kotobaV against production sidecars (read-only)
const km = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'kotobaMapping.json'), 'utf8'));
const kd = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'sharedKotobaDictionary.json'), 'utf8'));
const ek = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'kotoba-dan-kategori-tambahan.json'), 'utf8'));

check('10. Verify Kotoba mapping exists for all Gold Standard questions & options', () => {
  for (const q of [...nguyenPkg.questions, ...u16Pkg.questions, exQ]) {
    const pTerms = km.questions[q.id];
    assert.ok(Array.isArray(pTerms) && pTerms.length > 0, `No prompt Kotoba mapping for ${q.id}`);
    for (const opt of q.options) {
      const oTerms = km.options[q.id]?.[opt.id];
      const cTerms = km.byCompositeKey[`${q.id}::${opt.id}`];
      assert.ok(Array.isArray(oTerms), `Missing option Kotoba mapping array for ${q.id}::${opt.id}`);
      assert.deepEqual(oTerms, cTerms, `Nested vs composite Kotoba mismatch for ${q.id}::${opt.id}`);
    }
  }
});

check('11 & 12. Verify all termIds resolve in dictionary with status === "verified"', () => {
  for (const q of [...nguyenPkg.questions, ...u16Pkg.questions, exQ]) {
    const allIds = [...(km.questions[q.id] || [])];
    for (const opt of q.options) {
      allIds.push(...(km.options[q.id]?.[opt.id] || []));
    }
    for (const tid of allIds) {
      const term = kd.terms[tid];
      assert.ok(term, `Dangling termId ${tid} on ${q.id}`);
      assert.equal(term.status, 'verified', `Term ${tid} on ${q.id} has status ${term.status}`);
    }
  }
});

check('13. Verify kotobaU, kotobaV, and kotobaFormatted consistency', () => {
  for (const q of [...nguyenPkg.questions, ...u16Pkg.questions, exQ]) {
    const entry = ek.entries[q.id];
    assert.ok(entry, `Missing supplementary entry for ${q.id}`);
    assert.equal(entry.kotobaU.length, entry.kotobaV.length, `kotobaU vs kotobaV length mismatch on ${q.id}`);
    assert.equal(entry.kotobaFormatted, entry.kotobaV.join('\n'), `kotobaFormatted mismatch on ${q.id}`);
  }
});

// 14. Verify points & maxScore consistency
check('14. Verify points and maxScore consistency', () => {
  for (const pkg of [nguyenPkg, u16Pkg]) {
    const sumPoints = Number(pkg.questions.reduce((acc, q) => acc + Number(q.points), 0).toFixed(2));
    assert.equal(pkg.maxScore, sumPoints, `maxScore ${pkg.maxScore} !== sum of points ${sumPoints} in ${pkg.setId}`);
  }
});

// 15. Verify ZIP integrity, root SKILL.md, forward slashes, and required files
check('15. Verify ZIP integrity (SKILL.md at root, forward slashes, all required files)', () => {
  assert.ok(fs.existsSync(ZIP_PATH), 'ZIP archive does not exist');
  assert.ok(fs.statSync(ZIP_PATH).size > 0, 'ZIP archive is empty');

  const output = execSync(
    `python -c "import zipfile; z = zipfile.ZipFile(r'${ZIP_PATH}', 'r'); assert z.testzip() is None; print('\\n'.join(z.namelist()))"`,
    { encoding: 'utf8' }
  );
  const entries = output.trim().split(/\r?\n/).map(s => s.trim()).filter(Boolean);

  assert.ok(entries.includes('SKILL.md'), 'SKILL.md MUST be at root of ZIP');
  assert.ok(entries.includes('README.md'), 'README.md MUST be at root of ZIP');
  assert.ok(entries.includes('INTEGRATION-GUIDE.md'), 'INTEGRATION-GUIDE.md MUST be at root of ZIP');
  assert.ok(entries.includes('FINAL-ACCEPTANCE-REPORT.md'), 'FINAL-ACCEPTANCE-REPORT.md MUST be at root of ZIP');
  assert.ok(!entries.some(e => e.startsWith('pdf-to-json/')), 'ZIP must NOT contain wrapper pdf-to-json/ folder');
  assert.ok(!entries.some(e => e.includes('\\')), 'ZIP must NOT contain Windows backslash separators');
  assert.ok(entries.includes('references/gold-standard-nguyen-example.json'));
  assert.ok(entries.includes('references/gold-standard-kunci-ujian-16-example.json'));
  assert.ok(entries.includes('examples/example-assets/nguyen01-q032.png'));
});

console.log(`\n=== SUMMARY: ${passed} checks passed ===`);
