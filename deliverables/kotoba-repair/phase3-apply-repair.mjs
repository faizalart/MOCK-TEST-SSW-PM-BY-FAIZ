import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const BACKUP_DIR = 'deliverables/backups/pre-kotoba-repair-20261115';
const ledger = JSON.parse(fs.readFileSync('deliverables/kotoba-repair/candidate-adjudication-ledger.json', 'utf8'));
const snapshot = JSON.parse(fs.readFileSync('deliverables/kotoba-repair/question-immutable-snapshot.json', 'utf8'));

// 0. Ensure backup of all 10 production + 10 staging package JSONs before touching them
for (let p = 1; p <= 10; p++) {
  const num = String(p).padStart(2, '0');
  const targets = [
    `data/latsol-otaff-pm51-${num}.json`,
    `deliverables/staging/otaff-pm51-10-packages/data/latsol-otaff-pm51-${num}.json`,
  ];
  for (const t of targets) {
    const dst = path.join(BACKUP_DIR, t);
    if (!fs.existsSync(dst)) {
      fs.mkdirSync(path.dirname(dst), { recursive: true });
      fs.copyFileSync(t, dst);
    }
  }
}

const nowIso = new Date().toISOString();

// 1. Update data/sharedKotobaDictionary.json & staging sharedKotobaDictionary-delta.json
const dict = JSON.parse(fs.readFileSync('data/sharedKotobaDictionary.json', 'utf8'));
for (const oldId of ledger.replacedOtaffOldIds) {
  delete dict.terms[oldId];
}
for (const [id, conciseArti] of Object.entries(ledger.patchedOtaffTerms)) {
  if (!dict.terms[id]) throw new Error(`Missing patched otaff ID ${id}`);
  dict.terms[id].arti = conciseArti;
}
for (const [id, entry] of Object.entries(ledger.newTerms)) {
  dict.terms[id] = entry;
}

const allTermsArr = Object.values(dict.terms);
const verifiedTermsArr = allTermsArr.filter(t => t && t.status === 'verified');
if (dict._meta) {
  dict._meta.totalTerms = allTermsArr.length;
  dict._meta.verifiedTerms = verifiedTermsArr.length;
  dict._meta.verifiedCount = verifiedTermsArr.length;
  dict._meta.updatedAt = nowIso;
}
fs.writeFileSync('data/sharedKotobaDictionary.json', JSON.stringify(dict, null, 2) + '\n', 'utf8');

const otaffDeltaTerms = {};
for (const id of Object.keys(dict.terms).filter(k => k.startsWith('kb-otaff51-')).sort()) {
  otaffDeltaTerms[id] = dict.terms[id];
}
const dictDelta = {
  _meta: {
    source: 'OTAFF SSW PM Modul 5.1 (Bab 1-3)',
    totalTerms: Object.keys(otaffDeltaTerms).length,
    status: 'verified',
    updatedAt: nowIso,
  },
  terms: otaffDeltaTerms,
};
fs.writeFileSync('deliverables/staging/otaff-pm51-10-packages/data/sharedKotobaDictionary-delta.json', JSON.stringify(dictDelta, null, 2) + '\n', 'utf8');

// 2. Build context-strict mapping lookup from adjudication ledger
const contextMap = new Map();
for (const ctx of ledger.contexts) {
  contextMap.set(ctx.key, ctx.mappedTerms);
}

const mapping = JSON.parse(fs.readFileSync('data/kotobaMapping.json', 'utf8'));
const mappingDelta = {
  _meta: {
    source: 'OTAFF SSW PM Modul 5.1 (Bab 1-3)',
    totalQuestions: 400,
    totalOptions: 1200,
    updatedAt: nowIso,
  },
  questions: {},
  options: {},
  byCompositeKey: {},
};

const kt = JSON.parse(fs.readFileSync('data/kotoba-dan-kategori-tambahan.json', 'utf8'));
const ktDelta = {
  _meta: {
    source: 'OTAFF SSW PM Modul 5.1 (Bab 1-3)',
    totalQuestions: 400,
    updatedAt: nowIso,
  },
  totalEntries: 400,
  entries: {},
};

function formatPair(termId) {
  const e = dict.terms[termId];
  if (!e) throw new Error(`Dangling termId in repair: ${termId}`);
  const f = (e.furigana && e.furigana !== 'たんご') ? e.furigana : e.kanji;
  return {
    u: `${e.kanji}（${f}）`,
    v: `${e.kanji}（${f}） : ${e.arti}`,
  };
}

let updatedQuestionsCount = 0;
let updatedOptionsCount = 0;

for (let p = 1; p <= 10; p++) {
  const num = String(p).padStart(2, '0');
  const prodPath = `data/latsol-otaff-pm51-${num}.json`;
  const stagePath = `deliverables/staging/otaff-pm51-10-packages/data/latsol-otaff-pm51-${num}.json`;

  const pkg = JSON.parse(fs.readFileSync(prodPath, 'utf8'));
  const stagePkg = JSON.parse(fs.readFileSync(stagePath, 'utf8'));
  const stageById = new Map(stagePkg.questions.map(q => [q.id, q]));

  for (const q of pkg.questions) {
    const qTerms = contextMap.get(q.id);
    if (!qTerms) throw new Error(`Missing ledger context for question ${q.id}`);
    const qIds = qTerms.map(t => t.termId);

    mapping.questions[q.id] = qIds;
    mappingDelta.questions[q.id] = qIds;
    mapping.options[q.id] = mapping.options[q.id] || {};
    mappingDelta.options[q.id] = {};

    const unionTermIds = [];
    const seenUnion = new Set();
    for (const id of qIds) {
      if (!seenUnion.has(id)) {
        seenUnion.add(id);
        unionTermIds.push(id);
      }
    }

    for (const opt of q.options) {
      const compKey = `${q.id}::${opt.id}`;
      const optTerms = contextMap.get(compKey);
      if (!optTerms) throw new Error(`Missing ledger context for option ${compKey}`);
      const optIds = optTerms.map(t => t.termId);

      mapping.options[q.id][opt.id] = optIds;
      mappingDelta.options[q.id][opt.id] = optIds;
      mapping.byCompositeKey[compKey] = optIds;
      mappingDelta.byCompositeKey[compKey] = optIds;

      for (const id of optIds) {
        if (!seenUnion.has(id)) {
          seenUnion.add(id);
          unionTermIds.push(id);
        }
      }
      updatedOptionsCount++;
    }

    const kotobaU = [];
    const kotobaV = [];
    for (const id of unionTermIds) {
      const pair = formatPair(id);
      kotobaU.push(pair.u);
      kotobaV.push(pair.v);
    }
    const kotobaFormatted = kotobaV.join('\n');

    // Update inline UI caches on production & staging package files
    q.kotobaU = kotobaU;
    q.kotobaV = kotobaV;
    q.kotobaFormatted = kotobaFormatted;
    const sq = stageById.get(q.id);
    if (sq) {
      sq.kotobaU = kotobaU;
      sq.kotobaV = kotobaV;
      sq.kotobaFormatted = kotobaFormatted;
    }

    // Update kotoba-dan-kategori-tambahan.json & staging kotoba-tambahan-delta.json
    const ktItem = {
      id: q.id,
      setId: q.setId,
      questionNumber: q.questionNumber,
      category: q.category,
      kotobaU,
      kotobaV,
      kotobaFormatted,
      status: 'FIXED',
    };
    kt.entries[q.id] = ktItem;
    ktDelta.entries[q.id] = ktItem;

    // Verify immutable fields SHA-256 hash matches pre-repair snapshot
    const payload = JSON.stringify({
      id: q.id,
      setId: q.setId,
      questionNumber: q.questionNumber,
      points: q.points,
      questionText: q.questionText,
      prompt: q.prompt,
      instructions: q.instructions,
      promptTranslation: q.promptTranslation,
      correctAnswer: q.correctAnswer,
      correctIndex: q.correctIndex,
      options: q.options,
      questionImage: q.questionImage,
      media: q.media,
    });
    const currentHash = crypto.createHash('sha256').update(payload).digest('hex');
    if (currentHash !== snapshot[q.id]) {
      throw new Error(`IMMUTABILITY VIOLATION on ${q.id}: ${currentHash} !== ${snapshot[q.id]}`);
    }

    updatedQuestionsCount++;
  }

  fs.writeFileSync(prodPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
  fs.writeFileSync(stagePath, JSON.stringify(stagePkg, null, 2) + '\n', 'utf8');
}

// Update kotobaMapping _meta totals accurately
let optEntryCount = 0;
for (const optsObj of Object.values(mapping.options || {})) {
  optEntryCount += Object.keys(optsObj || {}).length;
}
if (mapping._meta) {
  mapping._meta.totalQuestions = Object.keys(mapping.questions || {}).length;
  mapping._meta.totalOptions = optEntryCount;
  mapping._meta.totalCompositeKeys = Object.keys(mapping.byCompositeKey || {}).length;
  mapping._meta.updatedAt = nowIso;
}
fs.writeFileSync('data/kotobaMapping.json', JSON.stringify(mapping, null, 2) + '\n', 'utf8');
fs.writeFileSync('deliverables/staging/otaff-pm51-10-packages/data/kotobaMapping-delta.json', JSON.stringify(mappingDelta, null, 2) + '\n', 'utf8');

kt.totalEntries = Object.keys(kt.entries || {}).length;
fs.writeFileSync('data/kotoba-dan-kategori-tambahan.json', JSON.stringify(kt, null, 2) + '\n', 'utf8');
fs.writeFileSync('deliverables/staging/otaff-pm51-10-packages/data/kotoba-tambahan-delta.json', JSON.stringify(ktDelta, null, 2) + '\n', 'utf8');

console.log({
  status: 'REPAIR_APPLIED_CLEANLY',
  updatedQuestionsCount,
  updatedOptionsCount,
  dictTotalTerms: Object.keys(dict.terms).length,
  dictOtaffTerms: Object.keys(otaffDeltaTerms).length,
  mappingQuestions: mapping._meta?.totalQuestions,
  mappingOptions: mapping._meta?.totalOptions,
  mappingCompositeKeys: mapping._meta?.totalCompositeKeys,
  ktTotalEntries: kt.totalEntries,
  immutableHashesVerified: updatedQuestionsCount,
});
