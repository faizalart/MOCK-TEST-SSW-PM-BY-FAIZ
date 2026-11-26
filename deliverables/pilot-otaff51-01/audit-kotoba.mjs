import fs from 'node:fs';
import path from 'node:path';
import {
  isValidHiraganaReading,
  extractQuestionPlainText,
  extractOptionPlainText,
  extractOptionId,
} from '../../scripts/lib/kotoba-pipeline-utils.mjs';

const stagingDataDir = 'deliverables/pilot-otaff51-01/staging/data';
const prodDataDir = 'data';

const pilot = JSON.parse(fs.readFileSync(path.join(stagingDataDir, 'pilot-otaff51-01.json'), 'utf8'));
const dictDelta = JSON.parse(fs.readFileSync(path.join(stagingDataDir, 'sharedKotobaDictionary-delta.json'), 'utf8'));
const mapDelta = JSON.parse(fs.readFileSync(path.join(stagingDataDir, 'kotobaMapping-delta.json'), 'utf8'));
const ktDelta = JSON.parse(fs.readFileSync(path.join(stagingDataDir, 'kotoba-tambahan-delta.json'), 'utf8'));

const prodDict = JSON.parse(fs.readFileSync(path.join(prodDataDir, 'sharedKotobaDictionary.json'), 'utf8'));
const prodMap = JSON.parse(fs.readFileSync(path.join(prodDataDir, 'kotobaMapping.json'), 'utf8'));

const prodTerms = prodDict.terms || {};
const deltaTerms = dictDelta.terms || {};

console.log('=== 1. DICTIONARY CHECK ===');
const prodTermIds = new Set(Object.keys(prodTerms));
const collisions = [];
const invalidHiragana = [];
const emptyArti = [];
const statusCounts = {};

for (const [termId, entry] of Object.entries(deltaTerms)) {
  if (prodTermIds.has(termId)) collisions.push(termId);
  const st = entry.status || 'MISSING_STATUS';
  statusCounts[st] = (statusCounts[st] || 0) + 1;
  if (!isValidHiraganaReading(entry.furigana)) {
    invalidHiragana.push({ termId, kanji: entry.kanji, furigana: entry.furigana });
  }
  if (!entry.arti || !String(entry.arti).trim()) {
    emptyArti.push(termId);
  }
}
console.log('deltaTerms count:', Object.keys(deltaTerms).length);
console.log('Collisions with prod sharedKotobaDictionary:', collisions.length, collisions);
console.log('Status counts:', statusCounts);
console.log('Non-strict-hiragana furigana:', invalidHiragana.length, invalidHiragana);
console.log('Empty arti:', emptyArti.length, emptyArti);

// Check if same kanji+furigana already exists in prodDict
const prodKanjiMap = new Map();
for (const [id, e] of Object.entries(prodTerms)) {
  prodKanjiMap.set(`${e.kanji}::${e.furigana}`, id);
}
const sameInProd = [];
for (const [id, e] of Object.entries(deltaTerms)) {
  const key = `${e.kanji}::${e.furigana}`;
  if (prodKanjiMap.has(key)) {
    sameInProd.push({ deltaId: id, prodId: prodKanjiMap.get(key), kanji: e.kanji, furigana: e.furigana });
  }
}
console.log('Same kanji+furigana already in prodDict:', sameInProd.length);

console.log('\n=== 2. DANGLING TERM IDS IN MAPPING DELTA ===');
const allKnownIds = new Set([...prodTermIds, ...Object.keys(deltaTerms)]);
const dangling = [];
for (const [qId, ids] of Object.entries(mapDelta.questions || {})) {
  for (const id of ids) {
    if (!allKnownIds.has(id)) dangling.push({ where: `questions.${qId}`, id });
  }
}
for (const [qId, optObj] of Object.entries(mapDelta.options || {})) {
  for (const [optId, ids] of Object.entries(optObj || {})) {
    for (const id of ids) {
      if (!allKnownIds.has(id)) dangling.push({ where: `options.${qId}.${optId}`, id });
    }
  }
}
for (const [comp, ids] of Object.entries(mapDelta.byCompositeKey || {})) {
  for (const id of ids) {
    if (!allKnownIds.has(id)) dangling.push({ where: `byCompositeKey.${comp}`, id });
  }
}
console.log('Dangling termIds:', dangling.length, dangling);

console.log('\n=== 3. 3-WAY SYNC CHECK (pilot.json vs ktDelta vs mapDelta) ===');
for (const q of pilot.questions) {
  const qId = q.id;
  const qU = Array.isArray(q.kotobaU) ? q.kotobaU : [];
  const qV = Array.isArray(q.kotobaV) ? q.kotobaV : [];
  const ktEntry = (ktDelta.entries || {})[qId];
  const ktU = ktEntry?.kotobaU || [];
  const ktV = ktEntry?.kotobaV || [];

  const onlyInQU = qU.filter(x => !ktU.includes(x));
  const onlyInKtU = ktU.filter(x => !qU.includes(x));

  const mapQIds = (mapDelta.questions || {})[qId] || [];
  const mapOptObj = (mapDelta.options || {})[qId] || {};
  const allMappedIds = new Set(mapQIds);
  for (const ids of Object.values(mapOptObj)) {
    for (const id of ids) allMappedIds.add(id);
  }
  const mappedStrings = [...allMappedIds].map(id => {
    const e = deltaTerms[id] || prodTerms[id];
    return e ? `${e.kanji}（${e.furigana}）` : `MISSING:${id}`;
  });

  const onlyInQvsMap = qU.filter(x => !mappedStrings.includes(x));
  const onlyInMapVsQ = mappedStrings.filter(x => !qU.includes(x));

  console.log(`\n[${qId}]`);
  console.log(`  counts -> q.kotobaU:${qU.length} q.kotobaV:${qV.length} kt.kotobaU:${ktU.length} kt.kotobaV:${ktV.length} mapUnique:${allMappedIds.size}`);
  console.log(`  onlyInQ vs kt:`, onlyInQU);
  console.log(`  onlyInKt vs q:`, onlyInKtU);
  console.log(`  onlyInQ vs map:`, onlyInQvsMap);
  console.log(`  onlyInMap vs q:`, onlyInMapVsQ);

  // Check if mapped terms actually appear in the plain text of the prompt / options
  const promptText = extractQuestionPlainText(q);
  const missingInPrompt = mapQIds
    .map(id => deltaTerms[id] || prodTerms[id])
    .filter(e => e && !promptText.includes(e.kanji))
    .map(e => `${e.kanji}（${e.furigana}）`);
  if (missingInPrompt.length) {
    console.log(`  WARN mapped in prompt but kanji not found in promptText:`, missingInPrompt);
  }

  for (const [idx, o] of q.options.entries()) {
    const optId = extractOptionId(o, idx);
    const optText = extractOptionPlainText(o);
    const optIds = mapOptObj[optId] || [];
    const compIds = (mapDelta.byCompositeKey || {})[`${qId}::${optId}`] || [];
    if (JSON.stringify(optIds) !== JSON.stringify(compIds)) {
      console.log(`  MISMATCH options vs byCompositeKey for ${qId}::${optId}`);
    }
    const missingInOpt = optIds
      .map(id => deltaTerms[id] || prodTerms[id])
      .filter(e => e && !optText.includes(e.kanji) && !e.kanji.startsWith('['))
      .map(e => `${e.kanji}（${e.furigana}）`);
    if (missingInOpt.length) {
      console.log(`  WARN mapped in opt ${optId} but kanji not found in optText:`, missingInOpt);
    }
  }
}
