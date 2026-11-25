import fs from 'node:fs';
import { auditSentenceSpans } from '../../scripts/audit-kotoba-coverage.mjs';

const dict = JSON.parse(fs.readFileSync('data/sharedKotobaDictionary.json', 'utf8'));
const mapping = JSON.parse(fs.readFileSync('data/kotobaMapping.json', 'utf8'));
const ng = JSON.parse(fs.readFileSync('data/latsol-nguyen-01.json', 'utf8'));
const p1 = JSON.parse(fs.readFileSync('data/latsol-otaff-pm51-01.json', 'utf8'));

function inspectQ(pkg, qNum) {
  const q = pkg.questions.find(x => x.questionNumber === qNum);
  const plain = q.prompt.replace(/<rt>[^<]*<\/rt>/g, '').replace(/<[^>]+>/g, '');
  const pIds = mapping.questions[q.id] || [];
  console.log(`\n=== ${q.id} (Q${qNum}) ===`);
  console.log('PROMPT HTML:', q.prompt);
  console.log('PROMPT PLAIN:', plain);
  console.log('PROMPT KOTOBA:', pIds.map(id => {
    const e = dict.terms[id];
    return e ? `${id}:${e.kanji}(${e.furigana})=${e.arti}[${e.unitType || ''}${e.dictForm ? ',df:' + e.dictForm : ''}]` : `${id}:MISSING`;
  }));
  const pAudit = auditSentenceSpans(plain, pIds, dict);
  console.log('PROMPT UNRESOLVED:', pAudit.unresolvedSpans.map(s => s.text));
  console.log('PROMPT IMG:', q.questionImage || q.media || null);
  for (const o of q.options) {
    const oPlain = o.text.replace(/<rt>[^<]*<\/rt>/g, '').replace(/<[^>]+>/g, '');
    const oIds = mapping.byCompositeKey[`${q.id}::${o.id}`] || mapping.options[q.id]?.[o.id] || [];
    const oAudit = auditSentenceSpans(oPlain, oIds, dict);
    console.log(`  OPT ${o.id}:`, oPlain, '| img:', o.optionImage || null);
    console.log(`    MAPPED:`, oIds.map(id => {
      const e = dict.terms[id];
      return e ? `${e.kanji}(${e.furigana})=${e.arti}` : `${id}:MISSING`;
    }));
    console.log(`    UNRESOLVED:`, oAudit.unresolvedSpans.map(s => s.text));
  }
}

inspectQ(ng, 32);
inspectQ(p1, 2);
inspectQ(p1, 31);
inspectQ(p1, 33);

// Also check all occurrences of 食べた人が in P01-P10 to see why べた appeared
for (let p = 1; p <= 10; p++) {
  const pkg = JSON.parse(fs.readFileSync(`data/latsol-otaff-pm51-${String(p).padStart(2, '0')}.json`, 'utf8'));
  for (const q of pkg.questions) {
    const plain = q.prompt.replace(/<rt>[^<]*<\/rt>/g, '').replace(/<[^>]+>/g, '');
    if (plain.includes('食べた')) {
      console.log('\nFOUND 食べた in prompt:', q.id, plain);
      console.log('  mapped:', (mapping.questions[q.id] || []).map(id => dict.terms[id]?.kanji));
    }
    for (const o of q.options) {
      const oPlain = o.text.replace(/<rt>[^<]*<\/rt>/g, '').replace(/<[^>]+>/g, '');
      if (oPlain.includes('食べた')) {
        const ids = mapping.byCompositeKey[`${q.id}::${o.id}`] || [];
        console.log('\nFOUND 食べた in opt:', q.id, o.id, oPlain);
        console.log('  mapped:', ids.map(id => dict.terms[id]?.kanji));
      }
    }
  }
}
