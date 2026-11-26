import fs from 'node:fs';
import path from 'node:path';

const stagingDir = 'deliverables/pilot-otaff51-01/staging';
const validatedDir = 'deliverables/pilot-otaff51-01/validated';

fs.mkdirSync(path.join(validatedDir, 'data'), { recursive: true });
fs.mkdirSync(path.join(validatedDir, 'assets/questions'), { recursive: true });
fs.mkdirSync(path.join(validatedDir, 'reports'), { recursive: true });

// 1. Copy all 5 PNGs
for (const file of fs.readdirSync(path.join(stagingDir, 'assets/questions'))) {
  fs.copyFileSync(
    path.join(stagingDir, 'assets/questions', file),
    path.join(validatedDir, 'assets/questions', file)
  );
}

// 2. Load JSONs from staging
const pilot = JSON.parse(fs.readFileSync(path.join(stagingDir, 'data/pilot-otaff51-01.json'), 'utf8'));
const dictDelta = JSON.parse(fs.readFileSync(path.join(stagingDir, 'data/sharedKotobaDictionary-delta.json'), 'utf8'));
const mapDelta = JSON.parse(fs.readFileSync(path.join(stagingDir, 'data/kotobaMapping-delta.json'), 'utf8'));
const ktDelta = JSON.parse(fs.readFileSync(path.join(stagingDir, 'data/kotoba-tambahan-delta.json'), 'utf8'));

// 3. Repair Q001 Option A text & translation to match Bab 1-3.pdf p. 8 verbatim
const q1 = pilot.questions.find(q => q.id === 'pilot-otaff51-q001');
const q1OptA = q1.options.find(o => o.id === 'A');
q1OptA.text = '<ruby>食品<rt>しょくひん</rt></ruby>の<ruby>衛生管理<rt>えいせいかんり</rt></ruby>が<ruby>十分<rt>じゅうぶん</rt></ruby>ではない<ruby>食品<rt>しょくひん</rt></ruby>（<ruby>安全<rt>あんぜん</rt></ruby>ではない<ruby>食品<rt>しょくひん</rt></ruby>）を<ruby>食<rt>た</rt></ruby>べた<ruby>人<rt>ひと</rt></ruby>は、<ruby>病気<rt>びょうき</rt></ruby>になったり、ケガをします。その<ruby>食品<rt>しょくひん</rt></ruby>を<ruby>作<rt>つく</rt></ruby>った<ruby>会社<rt>かいしゃ</rt></ruby>は、<ruby>信用<rt>しんよう</rt></ruby>をなくします。';
q1OptA.translation = 'Orang yang memakan makanan yang manajemen higiene pangannya tidak memadai (makanan yang tidak aman) akan jatuh sakit atau terluka. Perusahaan yang membuat makanan tersebut akan kehilangan kepercayaan.';

// 4. Add missing 7 allergen Kotoba terms to Q002 across all 4 files
const newTerms = [
  {
    id: 'kb-pilot51-109',
    kanji: 'えび',
    furigana: 'えび',
    unitType: 'noun_allergen',
    arti: 'udang',
    status: 'verified',
    options: ['A', 'B', 'C', 'D'],
  },
  {
    id: 'kb-pilot51-110',
    kanji: 'かに',
    furigana: 'かに',
    unitType: 'noun_allergen',
    arti: 'kepiting',
    status: 'verified',
    options: ['A', 'B', 'C', 'D'],
  },
  {
    id: 'kb-pilot51-111',
    kanji: 'くるみ',
    furigana: 'くるみ',
    unitType: 'noun_allergen',
    arti: 'kacang kenari (walnut)',
    status: 'verified',
    options: ['A', 'B', 'D'],
  },
  {
    id: 'kb-pilot51-112',
    kanji: 'そば',
    furigana: 'そば',
    unitType: 'noun_allergen',
    arti: 'soba / gandum kuda (buckwheat)',
    status: 'verified',
    options: ['A', 'B', 'C', 'D'],
  },
  {
    id: 'kb-pilot51-113',
    kanji: 'ピーナッツ',
    furigana: 'ぴーなっつ',
    unitType: 'noun_allergen',
    arti: 'kacang tanah',
    status: 'verified',
    options: ['A', 'B', 'D'],
  },
  {
    id: 'kb-pilot51-114',
    kanji: 'カシューナッツ',
    furigana: 'かしゅーなっつ',
    unitType: 'noun_allergen',
    arti: 'kacang mete',
    status: 'verified',
    options: ['A'],
  },
  {
    id: 'kb-pilot51-115',
    kanji: 'ピスタチオ',
    furigana: 'ぴすたちお',
    unitType: 'noun_allergen',
    arti: 'kacang pistachio',
    status: 'verified',
    options: ['D'],
  },
];

const q2 = pilot.questions.find(q => q.id === 'pilot-otaff51-q002');
const ktQ2 = ktDelta.entries['pilot-otaff51-q002'];

for (const t of newTerms) {
  dictDelta.terms[t.id] = {
    id: t.id,
    kanji: t.kanji,
    furigana: t.furigana,
    unitType: t.unitType,
    arti: t.arti,
    status: t.status,
  };

  for (const optId of t.options) {
    if (!mapDelta.options['pilot-otaff51-q002'][optId].includes(t.id)) {
      mapDelta.options['pilot-otaff51-q002'][optId].push(t.id);
    }
    const compKey = `pilot-otaff51-q002::${optId}`;
    if (!mapDelta.byCompositeKey[compKey].includes(t.id)) {
      mapDelta.byCompositeKey[compKey].push(t.id);
    }
  }

  const uStr = `${t.kanji}（${t.furigana}）`;
  const vStr = `${t.kanji}（${t.furigana}） : ${t.arti}`;
  if (!q2.kotobaU.includes(uStr)) q2.kotobaU.push(uStr);
  if (!q2.kotobaV.includes(vStr)) q2.kotobaV.push(vStr);
  if (!ktQ2.kotobaU.includes(uStr)) ktQ2.kotobaU.push(uStr);
  if (!ktQ2.kotobaV.includes(vStr)) ktQ2.kotobaV.push(vStr);
}

q2.kotobaFormatted = q2.kotobaV.join('\n');
ktQ2.kotobaFormatted = ktQ2.kotobaV.join('\n');

const totalTerms = Object.keys(dictDelta.terms).length;
dictDelta._meta.totalTerms = totalTerms;
dictDelta._meta.verifiedTerms = totalTerms;
dictDelta._meta.unresolvedTerms = 0;
dictDelta._meta.updatedAt = new Date().toISOString();

mapDelta._meta.totalTerms = totalTerms;
mapDelta._meta.updatedAt = dictDelta._meta.updatedAt;

// Write validated JSONs
fs.writeFileSync(path.join(validatedDir, 'data/pilot-otaff51-01.json'), JSON.stringify(pilot, null, 2) + '\n', 'utf8');
fs.writeFileSync(path.join(validatedDir, 'data/sharedKotobaDictionary-delta.json'), JSON.stringify(dictDelta, null, 2) + '\n', 'utf8');
fs.writeFileSync(path.join(validatedDir, 'data/kotobaMapping-delta.json'), JSON.stringify(mapDelta, null, 2) + '\n', 'utf8');
fs.writeFileSync(path.join(validatedDir, 'data/kotoba-tambahan-delta.json'), JSON.stringify(ktDelta, null, 2) + '\n', 'utf8');

console.log('Validated files built successfully. Total dictionary delta terms:', totalTerms);
