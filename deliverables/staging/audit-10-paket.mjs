import fs from 'node:fs';
import path from 'node:path';
import { validateQuestion, rawStats } from '../../utils.js';
import {
  isValidHiraganaReading,
  extractQuestionPlainText,
  extractOptionPlainText,
  extractOptionId,
} from '../../scripts/lib/kotoba-pipeline-utils.mjs';

const STAGING_DIR = 'deliverables/staging/otaff-pm51-10-packages';
const STAGING_DATA = path.join(STAGING_DIR, 'data');
const STAGING_ASSETS = path.join(STAGING_DIR, 'assets/questions');

const EXPECTED_SETS = Array.from({ length: 10 }, (_, i) => {
  const num = String(i + 1).padStart(2, '0');
  return `latsol-otaff-pm51-${num}`;
});

function readPngInfo(filePath) {
  const buf = fs.readFileSync(filePath);
  const magic = buf.subarray(0, 8).toString('hex');
  if (magic !== '89504e470d0a1a0a') return { valid: false, error: `Bad PNG magic ${magic}` };
  if (buf.length < 24) return { valid: false, error: 'Truncated PNG' };
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  if (width <= 0 || height <= 0) return { valid: false, error: `Zero dims ${width}x${height}` };
  return { valid: true, width, height, bytes: buf.length };
}

console.log('=== PHASE 2: AUDIT 10 PAKET / 400 SOAL ===');

const allQuestions = [];
const allQuestionIds = new Set();
const existingProdJsonFiles = fs.readdirSync('data').filter(f => f.endsWith('.json'));
const existingQuestionIds = new Set();
for (const jf of existingProdJsonFiles) {
  if (jf.startsWith('sharedKotoba') || jf.startsWith('kotoba') || jf.startsWith('latsol-otaff-pm51-')) continue;
  try {
    const d = JSON.parse(fs.readFileSync(path.join('data', jf), 'utf8'));
    if (Array.isArray(d?.questions)) {
      for (const q of d.questions) if (q?.id) existingQuestionIds.add(q.id);
    }
  } catch {}
}

const packageSummaries = [];
const questionErrors = [];
const referencedImagePaths = new Set();
const questionImagesSet = new Set();
const optionImagesSet = new Set();
let countCategory1 = 0;
let countCategory2 = 0;

for (const setId of EXPECTED_SETS) {
  const jsonFile = `${setId}.json`;
  const jsonPath = path.join(STAGING_DATA, jsonFile);
  if (!fs.existsSync(jsonPath)) {
    questionErrors.push(`MISSING JSON: ${jsonFile}`);
    continue;
  }
  const pkg = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  if (pkg.setId !== setId) questionErrors.push(`${jsonFile}: top-level setId mismatch (${pkg.setId} !== ${setId})`);
  if (!Array.isArray(pkg.questions) || pkg.questions.length !== 40) {
    questionErrors.push(`${jsonFile}: expected 40 questions, got ${pkg.questions?.length}`);
  }

  let optTotal = 0;
  let optionDCount = 0;
  let scoreSum = 0;
  const mockAnswers = {};

  for (let i = 0; i < pkg.questions.length; i++) {
    const q = pkg.questions[i];
    const qNum = i + 1;
    allQuestions.push(q);

    if (allQuestionIds.has(q.id)) questionErrors.push(`Duplicate question id inside bundle: ${q.id}`);
    allQuestionIds.add(q.id);
    if (existingQuestionIds.has(q.id)) questionErrors.push(`Collision with existing prod question id: ${q.id}`);
    if (q.setId !== setId) questionErrors.push(`${q.id}: q.setId mismatch (${q.setId} !== ${setId})`);
    if (q.questionNumber !== qNum) questionErrors.push(`${q.id}: questionNumber ${q.questionNumber} !== ${qNum}`);

    const vErrs = validateQuestion(q);
    if (vErrs.length) questionErrors.push(`${q.id}: validateQuestion failed: ${vErrs.join('; ')}`);

    // 3 options A, B, C check
    if (!Array.isArray(q.options) || q.options.length !== 3) {
      questionErrors.push(`${q.id}: options.length is ${q.options?.length}, expected 3`);
    } else {
      optTotal += q.options.length;
      const optIds = q.options.map(o => o.id);
      if (JSON.stringify(optIds) !== JSON.stringify(['A', 'B', 'C'])) {
        questionErrors.push(`${q.id}: option IDs are ${JSON.stringify(optIds)}, expected ['A','B','C']`);
      }
      if (optIds.includes('D')) optionDCount++;
      for (const o of q.options) {
        const hasText = Boolean(String(o.text || '').trim());
        const hasOptImg = Boolean(String(o.optionImage || '').trim() || String(o.mediaId || '').trim());
        if (!hasText && !hasOptImg) questionErrors.push(`${q.id} opt ${o.id}: empty text and empty media`);
        if (!String(o.translation || '').trim()) questionErrors.push(`${q.id} opt ${o.id}: missing translation`);
      }
    }

    // correctAnswer & correctIndex check
    if (!['A', 'B', 'C'].includes(q.correctAnswer)) {
      questionErrors.push(`${q.id}: invalid correctAnswer ${q.correctAnswer}`);
    }
    const expectedIdx = { A: 0, B: 1, C: 2 }[q.correctAnswer];
    if (q.correctIndex !== expectedIdx) {
      questionErrors.push(`${q.id}: correctIndex ${q.correctIndex} out of sync with correctAnswer ${q.correctAnswer}`);
    }

    // Weight check: 1-25 -> 3, 26-40 -> 5
    const expectedPts = qNum <= 25 ? 3 : 5;
    if (Number(q.points) !== expectedPts) {
      questionErrors.push(`${q.id}: points=${q.points}, expected ${expectedPts}`);
    }
    scoreSum += Number(q.points);
    mockAnswers[q.id] = q.correctIndex;

    // Media checks
    const mediaById = new Map((Array.isArray(q.media) ? q.media : []).map(m => [m.id, m]));
    const qImg = String(q.questionImage || '').trim();
    const qMediaId = String(q.imageMediaId || '').trim();
    const optImgsForQ = q.options.filter(o => String(o.optionImage || '').trim() || String(o.mediaId || '').trim());

    if (qImg) {
      countCategory1++;
      questionImagesSet.add(qImg);
      referencedImagePaths.add(qImg);
      if (!qMediaId || !mediaById.has(qMediaId)) {
        questionErrors.push(`${q.id}: has questionImage "${qImg}" but missing imageMediaId in media[]`);
      } else if (mediaById.get(qMediaId).path !== qImg) {
        questionErrors.push(`${q.id}: media[${qMediaId}].path mismatch (${mediaById.get(qMediaId).path} !== ${qImg})`);
      }
    }
    if (optImgsForQ.length > 0) {
      countCategory2++;
      if (qImg) questionErrors.push(`${q.id}: has BOTH questionImage and option images!`);
      for (const o of optImgsForQ) {
        const oi = String(o.optionImage || '').trim();
        const omid = String(o.mediaId || '').trim();
        if (oi) {
          optionImagesSet.add(oi);
          referencedImagePaths.add(oi);
        }
        if (!omid || !mediaById.has(omid)) {
          questionErrors.push(`${q.id} opt ${o.id}: missing media[] entry for option mediaId "${omid}"`);
        } else if (oi && mediaById.get(omid).path !== oi) {
          questionErrors.push(`${q.id} opt ${o.id}: media[${omid}].path (${mediaById.get(omid).path}) !== optionImage (${oi})`);
        }
      }
    }
  }

  const rs = rawStats({ questions: pkg.questions, answers: mockAnswers });
  if (pkg.maxScore !== 150 || scoreSum !== 150 || rs.maxWeightedScore !== 150 || rs.weightedScore !== 150) {
    questionErrors.push(`${jsonFile}: score mismatch pkg.maxScore=${pkg.maxScore}, sum=${scoreSum}, rawStats=${rs.maxWeightedScore}`);
  }

  packageSummaries.push({
    setId,
    setName: pkg.setName || pkg.title,
    questions: pkg.questions.length,
    options: optTotal,
    optionDCount,
    maxScore: pkg.maxScore,
    rawStatsMax: rs.maxWeightedScore,
    durationMinutes: pkg.durationMinutes ?? pkg.timeLimitMinutes ?? null,
    sampleTopKeys: Object.keys(pkg),
  });
}

console.log('Package summaries:', packageSummaries.map(p => `${p.setId}: q=${p.questions}, opts=${p.options}, D=${p.optionDCount}, max=${p.maxScore}`).join('\n  '));
console.log(`Category 1 (questionImage) questions: ${countCategory1}, unique question PNGs: ${questionImagesSet.size}`);
console.log(`Category 2 (optionImage) questions: ${countCategory2}, unique option PNGs: ${optionImagesSet.size}`);
console.log('Question/Schema errors:', questionErrors.length, questionErrors.slice(0, 20));

console.log('\n=== PHASE 4: PHYSICAL IMAGE AUDIT (122 PNGs) ===');
const physicalPngs = fs.existsSync(STAGING_ASSETS)
  ? fs.readdirSync(STAGING_ASSETS).filter(f => f.toLowerCase().endsWith('.png'))
  : [];
const existingProdAssets = new Set(fs.readdirSync('assets/questions'));
const imageErrors = [];
const pngDimensions = [];

for (const fname of physicalPngs) {
  if (existingProdAssets.has(fname)) imageErrors.push(`Filename collision with existing assets/questions/: ${fname}`);
  const info = readPngInfo(path.join(STAGING_ASSETS, fname));
  if (!info.valid) imageErrors.push(`${fname}: ${info.error}`);
  else pngDimensions.push({ fname, ...info });
}
const physicalRelPaths = new Set(physicalPngs.map(f => `assets/questions/${f}`));
const missingOnDisk = [...referencedImagePaths].filter(p => !physicalRelPaths.has(p));
const unreferencedOnDisk = [...physicalRelPaths].filter(p => !referencedImagePaths.has(p));

console.log(`Physical PNG count: ${physicalPngs.length}`);
console.log(`Unique referenced PNG paths in 400 questions: ${referencedImagePaths.size}`);
console.log(`Missing on disk: ${missingOnDisk.length}`, missingOnDisk);
console.log(`Unreferenced on disk: ${unreferencedOnDisk.length}`, unreferencedOnDisk);
console.log(`Physical/Collision errors: ${imageErrors.length}`, imageErrors);
if (pngDimensions.length) {
  const minW = Math.min(...pngDimensions.map(x => x.width));
  const maxW = Math.max(...pngDimensions.map(x => x.width));
  const minH = Math.min(...pngDimensions.map(x => x.height));
  const maxH = Math.max(...pngDimensions.map(x => x.height));
  console.log(`PNG width range: ${minW}..${maxW} px, height range: ${minH}..${maxH} px`);
}

console.log('\n=== PHASE 3: AUDIT 3 KOTOBA SIDECARS BEFORE MERGE ===');
const prodDict = JSON.parse(fs.readFileSync('data/sharedKotobaDictionary.json', 'utf8'));
const prodMap = JSON.parse(fs.readFileSync('data/kotobaMapping.json', 'utf8'));
const prodKt = JSON.parse(fs.readFileSync('data/kotoba-dan-kategori-tambahan.json', 'utf8'));

const deltaDict = JSON.parse(fs.readFileSync(path.join(STAGING_DATA, 'sharedKotobaDictionary-delta.json'), 'utf8'));
const deltaMap = JSON.parse(fs.readFileSync(path.join(STAGING_DATA, 'kotobaMapping-delta.json'), 'utf8'));
const deltaKt = JSON.parse(fs.readFileSync(path.join(STAGING_DATA, 'kotoba-tambahan-delta.json'), 'utf8'));

const prodTerms = prodDict.terms || {};
const deltaTerms = deltaDict.terms || {};
console.log('Prod dict terms:', Object.keys(prodTerms).length, '| Delta dict terms:', Object.keys(deltaTerms).length);

const idCollisionsSame = [];
const idCollisionsDiff = [];
const invalidHiragana = [];
const unverifiedTerms = [];
const emptyArti = [];
const missingKanjiOrUnit = [];

// Also index prod by kanji+furigana+arti to see reusable concepts
const prodByContent = new Map();
for (const [id, e] of Object.entries(prodTerms)) {
  prodByContent.set(`${e.kanji}::${e.furigana}::${e.arti}`, id);
}

for (const [id, entry] of Object.entries(deltaTerms)) {
  if (Object.prototype.hasOwnProperty.call(prodTerms, id)) {
    const pe = prodTerms[id];
    if (pe.kanji === entry.kanji && pe.furigana === entry.furigana && pe.arti === entry.arti) {
      idCollisionsSame.push(id);
    } else {
      idCollisionsDiff.push({ id, prod: pe, delta: entry });
    }
  }
  if (entry.status !== 'verified') unverifiedTerms.push({ id, status: entry.status });
  if (!isValidHiraganaReading(entry.furigana)) invalidHiragana.push({ id, kanji: entry.kanji, furigana: entry.furigana });
  if (!String(entry.arti || '').trim()) emptyArti.push(id);
  if (!String(entry.kanji || '').trim() || !String(entry.unitType || '').trim()) {
    missingKanjiOrUnit.push({ id, kanji: entry.kanji, unitType: entry.unitType });
  }
}

console.log('TermId collisions (identical content):', idCollisionsSame.length);
console.log('TermId collisions (DIFFERENT content):', idCollisionsDiff.length, idCollisionsDiff.slice(0, 5));
console.log('Unverified terms in delta:', unverifiedTerms.length, unverifiedTerms.slice(0, 10));
console.log('Non-strict-hiragana furigana:', invalidHiragana.length, invalidHiragana.slice(0, 20));
console.log('Empty arti:', emptyArti.length, emptyArti.slice(0, 10));
console.log('Missing kanji or unitType:', missingKanjiOrUnit.length, missingKanjiOrUnit.slice(0, 10));

// Mapping audit
const mapQIds = Object.keys(deltaMap.questions || {});
const mapOptQIds = Object.keys(deltaMap.options || {});
const mapCompKeys = Object.keys(deltaMap.byCompositeKey || {});
const mapErrors = [];
let totalOptContexts = 0;

const allKnownIds = new Set([...Object.keys(prodTerms), ...Object.keys(deltaTerms)]);
const ktEntries = deltaKt.entries || {};
const ktErrors = [];

for (const q of allQuestions) {
  const qId = q.id;
  if (!Array.isArray(deltaMap.questions?.[qId]) || deltaMap.questions[qId].length === 0) {
    mapErrors.push(`Missing/empty mapping.questions[${qId}]`);
  } else {
    for (const tid of deltaMap.questions[qId]) {
      if (!allKnownIds.has(tid)) mapErrors.push(`Dangling termId ${tid} in questions[${qId}]`);
    }
  }
  const optObj = deltaMap.options?.[qId];
  if (!optObj) {
    mapErrors.push(`Missing mapping.options[${qId}]`);
  } else {
    for (const optLetter of ['A', 'B', 'C']) {
      totalOptContexts++;
      const arr = optObj[optLetter];
      const compArr = deltaMap.byCompositeKey?.[`${qId}::${optLetter}`];
      if (!Array.isArray(arr) || arr.length === 0) {
        mapErrors.push(`Missing/empty options[${qId}][${optLetter}]`);
      } else {
        for (const tid of arr) {
          if (!allKnownIds.has(tid)) mapErrors.push(`Dangling termId ${tid} in options[${qId}][${optLetter}]`);
        }
      }
      if (JSON.stringify(arr) !== JSON.stringify(compArr)) {
        mapErrors.push(`byCompositeKey mismatch at ${qId}::${optLetter}`);
      }
    }
  }

  // Legacy kt audit
  const kt = ktEntries[qId];
  if (!kt) {
    ktErrors.push(`Missing ktEntries[${qId}]`);
  } else {
    if (kt.setId !== q.setId) ktErrors.push(`kt[${qId}].setId mismatch (${kt.setId} !== ${q.setId})`);
    if (kt.questionNumber !== q.questionNumber) ktErrors.push(`kt[${qId}].questionNumber mismatch`);
    if (!Array.isArray(kt.kotobaU) || !Array.isArray(kt.kotobaV) || kt.kotobaU.length !== kt.kotobaV.length) {
      ktErrors.push(`kt[${qId}].kotobaU/V length mismatch`);
    } else {
      for (const s of kt.kotobaU) {
        if (!/^.+（.+）$/.test(s)) ktErrors.push(`kt[${qId}] invalid JP parens format in kotobaU: ${s}`);
      }
      if (kt.kotobaFormatted !== kt.kotobaV.join('\n')) {
        ktErrors.push(`kt[${qId}].kotobaFormatted !== kotobaV.join('\\n')`);
      }
    }
  }

  // Collision check against existing prodMap / prodKt
  if (Object.prototype.hasOwnProperty.call(prodMap.questions, qId)) mapErrors.push(`Collision in prodMap.questions: ${qId}`);
  if (Object.prototype.hasOwnProperty.call(prodKt.entries, qId)) ktErrors.push(`Collision in prodKt.entries: ${qId}`);
}

console.log(`Mapped question IDs: ${mapQIds.length}, option QIDs: ${mapOptQIds.length}, opt contexts checked: ${totalOptContexts}, byCompositeKey count: ${mapCompKeys.length}`);
console.log('Mapping errors:', mapErrors.length, mapErrors.slice(0, 20));
console.log('Legacy kt entries count:', Object.keys(ktEntries).length, '| ktErrors:', ktErrors.length, ktErrors.slice(0, 20));
