import fs from 'node:fs';
import path from 'node:path';
import { isValidHiraganaReading } from '../../scripts/lib/kotoba-pipeline-utils.mjs';

const BACKUP_DIR = 'deliverables/backups/pre-otaff-pm51-10-paket';
const STAGING_DATA = 'deliverables/staging/otaff-pm51-10-packages/data';
const STAGING_ASSETS = 'deliverables/staging/otaff-pm51-10-packages/assets/questions';

// 1. Create backups BEFORE modifying any production files
const filesToBackup = [
  'utils.js',
  'app.js',
  'sw.js',
  'index.html',
  'data/sharedKotobaDictionary.json',
  'data/kotobaMapping.json',
  'data/kotoba-dan-kategori-tambahan.json',
];
fs.mkdirSync(BACKUP_DIR, { recursive: true });
const backupsCreated = [];
for (const rel of filesToBackup) {
  const dest = path.join(BACKUP_DIR, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(rel, dest);
  backupsCreated.push(dest);
}
console.log(`Created ${backupsCreated.length} backups in ${BACKUP_DIR}`);

// 2. Copy 10 package JSON files to data/
const copiedPackages = [];
for (let i = 1; i <= 10; i++) {
  const fname = `latsol-otaff-pm51-${String(i).padStart(2, '0')}.json`;
  const src = path.join(STAGING_DATA, fname);
  const dst = path.join('data', fname);
  if (fs.existsSync(dst)) {
    throw new Error(`Refusing to overwrite existing production file: ${dst}`);
  }
  fs.copyFileSync(src, dst);
  copiedPackages.push(dst);
}
console.log(`Copied ${copiedPackages.length} package JSONs to data/`);

// 3. Copy 122 PNG files to assets/questions/
const pngFiles = fs.readdirSync(STAGING_ASSETS).filter(f => f.toLowerCase().endsWith('.png')).sort();
if (pngFiles.length !== 122) {
  throw new Error(`Expected 122 PNG files, found ${pngFiles.length}`);
}
for (const fname of pngFiles) {
  const src = path.join(STAGING_ASSETS, fname);
  const dst = path.join('assets/questions', fname);
  if (fs.existsSync(dst)) {
    throw new Error(`Refusing to overwrite existing image asset: ${dst}`);
  }
  fs.copyFileSync(src, dst);
}
console.log(`Copied ${pngFiles.length} PNG assets to assets/questions/`);

// 4. Safe merge of 3 Kotoba sidecars
const prodDict = JSON.parse(fs.readFileSync('data/sharedKotobaDictionary.json', 'utf8'));
const deltaDict = JSON.parse(fs.readFileSync(path.join(STAGING_DATA, 'sharedKotobaDictionary-delta.json'), 'utf8'));

const dictBefore = Object.keys(prodDict.terms || {}).length;
const dictDeltaCount = Object.keys(deltaDict.terms || {}).length;
let dictAdded = 0;
let dictReusedById = 0;
let dictConflicts = 0;
const normalizedFurigana = [];
const termIdRemap = new Map();

// Count surface+reading overlap for informational reporting
const masterByContent = new Map();
for (const [id, e] of Object.entries(prodDict.terms || {})) {
  masterByContent.set(`${e.kanji}::${e.furigana}::${e.arti}`, id);
}
let contentMatchCount = 0;

for (const [id, rawEntry] of Object.entries(deltaDict.terms || {})) {
  const entry = { ...rawEntry };
  if (entry.furigana && entry.furigana.includes('・')) {
    const cleanFuri = entry.furigana.replace(/・/g, '');
    if (isValidHiraganaReading(cleanFuri)) {
      normalizedFurigana.push({ id, before: entry.furigana, after: cleanFuri });
      entry.furigana = cleanFuri;
    }
  }
  if (!isValidHiraganaReading(entry.furigana)) {
    throw new Error(`Invalid furigana reading on ${id}: ${entry.furigana}`);
  }
  if (masterByContent.has(`${entry.kanji}::${entry.furigana}::${entry.arti}`)) {
    contentMatchCount++;
  }

  if (Object.prototype.hasOwnProperty.call(prodDict.terms, id)) {
    const existing = prodDict.terms[id];
    if (existing.kanji === entry.kanji && existing.furigana === entry.furigana && existing.arti === entry.arti) {
      dictReusedById++;
    } else {
      dictConflicts++;
      let suffix = 1;
      let newId = `${id}-c${suffix}`;
      while (Object.prototype.hasOwnProperty.call(prodDict.terms, newId)) {
        suffix++;
        newId = `${id}-c${suffix}`;
      }
      entry.id = newId;
      prodDict.terms[newId] = entry;
      termIdRemap.set(id, newId);
      dictAdded++;
    }
  } else {
    prodDict.terms[id] = entry;
    dictAdded++;
  }
}

const dictAfter = Object.keys(prodDict.terms).length;
if (prodDict._meta) {
  prodDict._meta.totalTerms = dictAfter;
  prodDict._meta.updatedAt = new Date().toISOString();
}
fs.writeFileSync('data/sharedKotobaDictionary.json', JSON.stringify(prodDict, null, 2) + '\n', 'utf8');

// Merge kotobaMapping-delta.json
const prodMap = JSON.parse(fs.readFileSync('data/kotobaMapping.json', 'utf8'));
const deltaMap = JSON.parse(fs.readFileSync(path.join(STAGING_DATA, 'kotobaMapping-delta.json'), 'utf8'));
const mapQBefore = Object.keys(prodMap.questions || {}).length;
const mapCompBefore = Object.keys(prodMap.byCompositeKey || {}).length;

const remapIds = arr => arr.map(tid => termIdRemap.get(tid) || tid);
let mapQAdded = 0;
let mapOptCtxAdded = 0;

for (const [qId, tids] of Object.entries(deltaMap.questions || {})) {
  if (Object.prototype.hasOwnProperty.call(prodMap.questions, qId)) {
    throw new Error(`Mapping collision in questions for ${qId}`);
  }
  prodMap.questions[qId] = remapIds(tids);
  mapQAdded++;
}
for (const [qId, optMap] of Object.entries(deltaMap.options || {})) {
  if (Object.prototype.hasOwnProperty.call(prodMap.options, qId)) {
    throw new Error(`Mapping collision in options for ${qId}`);
  }
  const cloned = {};
  for (const [optId, tids] of Object.entries(optMap)) {
    cloned[optId] = remapIds(tids);
    mapOptCtxAdded++;
  }
  prodMap.options[qId] = cloned;
}
for (const [compKey, tids] of Object.entries(deltaMap.byCompositeKey || {})) {
  if (Object.prototype.hasOwnProperty.call(prodMap.byCompositeKey, compKey)) {
    throw new Error(`Mapping collision in byCompositeKey for ${compKey}`);
  }
  prodMap.byCompositeKey[compKey] = remapIds(tids);
}
const mapQAfter = Object.keys(prodMap.questions).length;
const mapCompAfter = Object.keys(prodMap.byCompositeKey).length;
if (prodMap._meta) {
  prodMap._meta.totalQuestions = mapQAfter;
  prodMap._meta.totalCompositeKeys = mapCompAfter;
  prodMap._meta.updatedAt = new Date().toISOString();
}
fs.writeFileSync('data/kotobaMapping.json', JSON.stringify(prodMap, null, 2) + '\n', 'utf8');

// Merge kotoba-tambahan-delta.json
const prodKt = JSON.parse(fs.readFileSync('data/kotoba-dan-kategori-tambahan.json', 'utf8'));
const deltaKt = JSON.parse(fs.readFileSync(path.join(STAGING_DATA, 'kotoba-tambahan-delta.json'), 'utf8'));
const ktBefore = Object.keys(prodKt.entries || {}).length;
let ktAdded = 0;
for (const [qId, entry] of Object.entries(deltaKt.entries || {})) {
  if (Object.prototype.hasOwnProperty.call(prodKt.entries, qId)) {
    throw new Error(`kotoba-tambahan collision for ${qId}`);
  }
  prodKt.entries[qId] = entry;
  ktAdded++;
}
const ktAfter = Object.keys(prodKt.entries).length;
prodKt.totalEntries = ktAfter;
fs.writeFileSync('data/kotoba-dan-kategori-tambahan.json', JSON.stringify(prodKt, null, 2) + '\n', 'utf8');

const mergeStats = {
  backupsCreated,
  copiedPackages: copiedPackages.length,
  copiedPngs: pngFiles.length,
  dictionary: {
    before: dictBefore,
    delta: dictDeltaCount,
    addedNewIds: dictAdded,
    reusedById: dictReusedById,
    contentOverlapWithExistingMaster: contentMatchCount,
    conflictsResolved: dictConflicts,
    after: dictAfter,
    normalizedFurigana,
  },
  mapping: {
    questionsBefore: mapQBefore,
    questionsAdded: mapQAdded,
    questionsAfter: mapQAfter,
    optionContextsAdded: mapOptCtxAdded,
    compositeKeysBefore: mapCompBefore,
    compositeKeysAfter: mapCompAfter,
  },
  kotobaTambahan: {
    before: ktBefore,
    added: ktAdded,
    after: ktAfter,
  },
};

fs.mkdirSync('deliverables/reports', { recursive: true });
fs.writeFileSync('deliverables/reports/merge-stats.json', JSON.stringify(mergeStats, null, 2) + '\n', 'utf8');
console.log('Merge complete:\n', JSON.stringify(mergeStats, null, 2));
