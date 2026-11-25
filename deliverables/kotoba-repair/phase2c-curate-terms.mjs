import fs from 'node:fs';
import { isValidHiraganaReading } from '../../scripts/lib/kotoba-pipeline-utils.mjs';
import { CURATED_PART_1 } from './curated-dict-part1.mjs';
import { CURATED_PART_2 } from './curated-dict-part2.mjs';
import { CURATED_PART_3 } from './curated-dict-part3.mjs';
import { CURATED_PART_4 } from './curated-dict-part4.mjs';

const dict = JSON.parse(fs.readFileSync('data/sharedKotobaDictionary.json', 'utf8'));
const v3 = JSON.parse(fs.readFileSync('deliverables/kotoba-repair/phase2-v3-surfaces.json', 'utf8'));

const ALL_CURATED = [...CURATED_PART_1, ...CURATED_PART_2, ...CURATED_PART_3, ...CURATED_PART_4];
const curatedByKanji = new Map();
const dupes = [];
for (const row of ALL_CURATED) {
  const [kanji, furigana, unitType, arti, dictForm] = row;
  if (curatedByKanji.has(kanji)) dupes.push(kanji);
  curatedByKanji.set(kanji, { kanji, furigana, unitType, arti, ...(dictForm ? { dictForm } : {}) });
}
if (dupes.length) {
  throw new Error(`Duplicate curated entries found: ${dupes.join(', ')}`);
}

const MASTER_OVERRIDES = {
  'kb-u1416-3f4581a001': '切れ・こすれ',
  'kb-2084840': '年',
  'kb-ext-1151-e5b19ee88f': '属菌',
  'kb-1535560': '目的',
  'kb-1260490': '鍵',
  'kb-1246440': '隅',
  'kb-1450590': '透明',
  'kb-1524610': '枚',
  'kb-1320300': '室',
};

const PATCHED_EXISTING_OTAFF = {
  'kb-otaff51-0059': 'cairan daging/ikan saat pencairan (drip)',
  'kb-otaff51-0061': 'Hukum Heinrich (rasio 1 : 29 : 300)',
  'kb-otaff51-0070': 'sistem fail-safe penghenti otomatis',
  'kb-otaff51-0072': 'sistem foolproof pencegah salah operasi',
  'kb-otaff51-0127': 'batas tanggal konsumsi aman (Shouhikigen)',
  'kb-otaff51-0218': 'Kementerian Kesehatan & Kerja (MHLW)',
  'kb-otaff51-0253': 'OTAFF (lembaga penyelenggara ujian SSW)',
  'kb-otaff51-0332': 'Seiton (Rapi: penataan alat mudah diambil)',
  'kb-otaff51-0378': 'zona kerja kotor (Osen Sagyou Kuiki)',
  'kb-otaff51-0410': 'zona kerja semi-bersih',
  'kb-otaff51-0592': 'Kementerian Pertanian & Perikanan Jepang',
};

const neededSet = new Set(v3.needsNewDefinition.map(x => x.surface));
const missing = [...neededSet].filter(k => !curatedByKanji.has(k));
const overrideKanjis = new Set(Object.values(MASTER_OVERRIDES));
const unused = [...curatedByKanji.keys()].filter(k => !neededSet.has(k) && !overrideKanjis.has(k));

if (missing.length || unused.length) {
  console.error({ missingCount: missing.length, missing, unusedCount: unused.length, unused });
  process.exit(1);
}

// Allocate IDs starting cleanly at kb-otaff51-0688 (replacing legacy 0688..0779 たんご junk)
const validationErrors = [];
const newTerms = {};
const surfaceToNewId = new Map();
let seq = 688;

const orderedKanjis = [
  ...Object.values(MASTER_OVERRIDES),
  ...v3.needsNewDefinition.map(x => x.surface),
];

for (const k of orderedKanjis) {
  const entry = curatedByKanji.get(k);
  if (!entry) {
    validationErrors.push(`MISSING_ENTRY:${k}`);
    continue;
  }
  if (!entry.furigana || entry.furigana === 'たんご' || !isValidHiraganaReading(entry.furigana) || !/^[\u3041-\u3096ー]+$/.test(entry.furigana)) {
    validationErrors.push(`BAD_HIRAGANA_READING:${k}=>${entry.furigana}`);
  }
  if (!entry.arti || entry.arti.length > 60) {
    validationErrors.push(`BAD_ARTI_LEN(${entry.arti?.length}):${k}=>${entry.arti}`);
  }
  if ((entry.unitType === 'inflected_verb' || entry.unitType === 'inflected_adj') && !entry.dictForm) {
    validationErrors.push(`MISSING_DICTFORM:${k}`);
  }
  const id = `kb-otaff51-${String(seq++).padStart(4, '0')}`;
  newTerms[id] = {
    id,
    kanji: entry.kanji,
    furigana: entry.furigana,
    unitType: entry.unitType,
    arti: entry.arti,
    ...(entry.dictForm ? { dictForm: entry.dictForm } : {}),
    status: 'verified',
  };
  surfaceToNewId.set(k, id);
}

if (validationErrors.length) {
  console.error('Curation validation errors:', validationErrors);
  process.exit(1);
}

// Build override map from old master ID -> new kb-otaff51 ID
const masterOverrideIdMap = {};
for (const [oldId, k] of Object.entries(MASTER_OVERRIDES)) {
  masterOverrideIdMap[oldId] = surfaceToNewId.get(k);
}

// Map matched master surfaces to term IDs (applying clean overrides)
const surfaceToMasterId = new Map();
for (const m of v3.matchedInMaster) {
  surfaceToMasterId.set(m.surface, masterOverrideIdMap[m.masterId] || m.masterId);
}

// Check all 0688..0779 junk IDs to remove from OTAFF dictionary
const replacedOtaffOldIds = Object.keys(dict.terms || {})
  .filter(id => id.startsWith('kb-otaff51-') && id >= 'kb-otaff51-0688')
  .sort();

// Build per-context adjudicated ledger
const contexts = [];
let totalMapped = 0;
let le40Count = 0;
let allUsedIds = new Set();

for (const ctx of v3.contextTokens) {
  const mappedTerms = [];
  const seenIds = new Set();
  for (const tok of ctx.tokens) {
    const id = surfaceToNewId.get(tok) || surfaceToMasterId.get(tok);
    if (!id) {
      throw new Error(`Unresolved token '${tok}' in context ${ctx.key}`);
    }
    if (seenIds.has(id)) continue;
    seenIds.add(id);
    allUsedIds.add(id);
    const termObj = newTerms[id] || dict.terms[id];
    const effectiveArti = PATCHED_EXISTING_OTAFF[id] || termObj.arti;
    if (effectiveArti.length <= 40) le40Count++;
    totalMapped++;
    mappedTerms.push({
      surface: tok,
      termId: id,
      kanji: termObj.kanji,
      furigana: termObj.furigana,
      arti: effectiveArti,
      status: 'mapped_verified',
    });
  }
  contexts.push({
    key: ctx.key,
    plain: ctx.plain,
    mappedTerms,
  });
}

const newTermList = Object.values(newTerms);
const newLe40 = newTermList.filter(t => t.arti.length <= 40).length;
const newMaxArti = Math.max(...newTermList.map(t => t.arti.length));

const ledger = {
  summary: {
    totalContexts: contexts.length,
    newTermsCount: newTermList.length,
    newIdRange: `kb-otaff51-0688..kb-otaff51-${String(seq - 1).padStart(4, '0')}`,
    replacedOldJunkIdsCount: replacedOtaffOldIds.length,
    patchedExistingOtaffCount: Object.keys(PATCHED_EXISTING_OTAFF).length,
    masterOverrideCount: Object.keys(masterOverrideIdMap).length,
    totalUniqueUsedTermIds: allUsedIds.size,
    totalContextMappings: totalMapped,
    newTermsConciseLe40Pct: Number(((newLe40 / newTermList.length) * 100).toFixed(2)),
    newTermsMaxArtiLen: newMaxArti,
    contextMappingConciseLe40Pct: Number(((le40Count / totalMapped) * 100).toFixed(2)),
    needsReviewCount: 0,
  },
  patchedOtaffTerms: PATCHED_EXISTING_OTAFF,
  replacedOtaffOldIds,
  masterOverrideIdMap,
  newTerms,
  contexts,
};

fs.writeFileSync('deliverables/kotoba-repair/candidate-adjudication-ledger.json', JSON.stringify(ledger, null, 2) + '\n', 'utf8');
console.log('Adjudication ledger built successfully:', ledger.summary);
