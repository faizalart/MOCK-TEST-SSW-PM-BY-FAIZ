import fs from 'node:fs';
import { isValidHiraganaReading, isSingleKanji } from '../../scripts/lib/kotoba-pipeline-utils.mjs';

const dict = JSON.parse(fs.readFileSync('data/sharedKotobaDictionary.json', 'utf8'));
const d = JSON.parse(fs.readFileSync('deliverables/kotoba-repair/phase2-v3-surfaces.json', 'utf8'));

const badMaster = [];
const singleKanjiHits = [];
for (const item of d.matchedInMaster) {
  const e = dict.terms[item.masterId];
  const issues = [];
  if (!e) {
    issues.push('NO_ENTRY');
  } else {
    if (e.status !== 'verified') issues.push('UNVERIFIED');
    if (!e.furigana || !isValidHiraganaReading(e.furigana)) issues.push('BAD_FURI:' + e.furigana);
    if (!e.arti) issues.push('NO_ARTI');
    if (e.arti && e.arti.length > 60) issues.push('ARTI>60:' + e.arti.length);
    else if (e.arti && e.arti.length > 40) issues.push('ARTI>40:' + e.arti.length);
    if (['inflected', 'inflected_verb', 'inflected_adj'].includes(e.unitType) && !e.dictForm) issues.push('NO_DICTFORM');
    if (e.unitType === 'morpheme_fragment' || e.entryType === 'morpheme_fragment') issues.push('FRAGMENT');
    if (isSingleKanji(e.kanji)) singleKanjiHits.push({ surface: item.surface, id: item.masterId, furi: e.furigana, arti: e.arti });
  }
  if (issues.length) {
    badMaster.push({ surface: item.surface, id: item.masterId, furi: e?.furigana, arti: e?.arti, unitType: e?.unitType, issues });
  }
}

console.log('Master matches audited:', d.matchedInMaster.length);
console.log('Master matches with validation issues/warnings:', badMaster.length);
console.log(badMaster.map(x => `${x.surface} (${x.id}): [${x.issues.join(',')}] furi=${x.furi} arti=${x.arti}`).join('\n'));
console.log('\nSingle kanji hits in master:', singleKanjiHits.length);
console.log(singleKanjiHits.map(x => `${x.surface} (${x.id}) [${x.furi}] = ${x.arti}`).join('\n'));
