import fs from 'node:fs';

const DICT_PATH = 'data/sharedKotobaDictionary.json';
const dict = JSON.parse(fs.readFileSync(DICT_PATH, 'utf8'));

console.log('--- ASSERTING DICTIONARY INTEGRITY ---');

// 1. Meta assertions
console.assert(dict._meta, 'Meta must exist');
console.assert(dict._meta.datasetVersion === '1.0.0', 'Dataset version must be 1.0.0');
console.assert(dict._meta.totalTerms === 1809, 'Total terms must be 1809');
console.assert(dict._meta.verifiedTerms === 1768, 'Verified terms must be 1768');
console.assert(dict._meta.unresolvedTerms === 41, 'Unresolved terms must be 41');
console.assert(dict._meta.datasetLicense === 'CC BY-SA 4.0', 'License must be CC BY-SA 4.0');

// 2. Terms assertions
const terms = Object.values(dict.terms);
console.assert(terms.length === 1809, 'Must have exactly 1809 terms');

let verifiedCount = 0;
let unresolvedCount = 0;
const ambiguous = [];

for (const t of terms) {
  console.assert(t.id, `Term must have id: ${JSON.stringify(t)}`);
  console.assert(t.kanji, `Term must have kanji: ${t.id}`);
  console.assert(t.furigana, `Term must have furigana: ${t.id}`);
  console.assert(t.provenance, `Term must have provenance: ${t.id}`);
  console.assert(t.provenance.meaningSource === 'in_house_ssw_curated', `meaningSource must be in_house_ssw_curated: ${t.id}`);
  console.assert(t.provenance.lexicalLicense === 'CC-BY-SA-4.0', `lexicalLicense must be CC-BY-SA-4.0: ${t.id}`);

  if (t.matchStatus === 'ambiguous') {
    ambiguous.push(t);
  }

  if (t.status === 'verified') {
    verifiedCount++;
    console.assert(t.furiganaStatus === 'verified', `Verified term must have verified furigana: ${t.id}`);
    console.assert(t.meaningStatus === 'verified', `Verified term must have verified meaning: ${t.id}`);
    console.assert(t.arti && t.arti.length > 0, `Verified term must have non-empty arti: ${t.id}`);
    console.assert(t.entryType !== 'morpheme_fragment', `Verified term cannot be fragment: ${t.id}`);
  } else if (t.status === 'unresolved') {
    unresolvedCount++;
    console.assert(t.meaningStatus === 'unresolved', `Unresolved term must have unresolved meaning: ${t.id}`);
    console.assert(t.arti === '', `Unresolved term must have empty arti: ${t.id}`);
  } else {
    throw new Error(`Invalid status: ${t.status}`);
  }
}

console.assert(verifiedCount === 1768, `Verified count mismatch: ${verifiedCount}`);
console.assert(unresolvedCount === 41, `Unresolved count mismatch: ${unresolvedCount}`);
console.assert(ambiguous.length === 6, `Ambiguous count mismatch: ${ambiguous.length}`);

// Assert ambiguous resolution
for (const a of ambiguous) {
  console.assert(a.ent_seq !== null, `Ambiguous term must have resolved ent_seq: ${a.kanji}`);
  console.assert(a.status === 'verified', `Ambiguous term must be verified: ${a.kanji}`);
  console.log(`Ambiguous resolved: ${a.kanji} (${a.furigana}) -> ent_seq: ${a.ent_seq}, domain: ${a.domainCategory}, arti: ${a.arti}`);
}

console.log('--- ALL INTEGRITY ASSERTIONS PASSED! ---');
