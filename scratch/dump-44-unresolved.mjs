// scratch/dump-44-unresolved.mjs
import fs from 'node:fs';

const dict = JSON.parse(fs.readFileSync('data/sharedKotobaDictionary.json', 'utf8'));
const terms = Object.values(dict.terms);
const unresolved = terms.filter(t => t.status === 'unresolved');

console.log(`Total Unresolved: ${unresolved.length}\n`);

// Group by category/reason
const groups = {
  'Exam Ruby Typos (Reassigned Occurrences)': [],
  'Artificial Token Boundary / Sentence Fragments': [],
  'Cut-off Ruby Stems / Bound Morphemes': [],
  'Broken Katakana / Corrupted Foreign Words': [],
  'Corrupted / Typo Question Compounds': []
};

for (const t of unresolved) {
  const item = {
    id: t.id,
    kanji: t.kanji,
    furigana: t.furigana,
    matchStatus: t.matchStatus,
    furiganaStatus: t.furiganaStatus,
    entryType: t.entryType,
    occurrencesCount: t.occurrences.length,
    notes: t.reviewNotes || t.auditNotes
  };

  if (t.id === 'kb-ext-1758-e6b5813a3a' || t.id === 'kb-ext-0426-e7b9b03a3a') {
    groups['Exam Ruby Typos (Reassigned Occurrences)'].push(item);
  } else if (t.id === 'kb-1269730' || t.kanji.includes('選') || t.kanji.includes('待') || t.kanji.includes('書') || t.kanji.includes('座') || t.kanji.includes('入') || t.kanji.includes('洗') || t.kanji.includes('触') || t.kanji.includes('守') || t.kanji.includes('行')) {
    groups['Artificial Token Boundary / Sentence Fragments'].push(item);
  } else if (/^[ァ-ンー]+$/.test(t.kanji) || t.kanji === 'コカ・コーラ' || t.kanji === 'トセッ' || t.kanji === 'レトルト' || t.kanji === 'アルコール' || t.kanji === 'アレルギー') {
    groups['Broken Katakana / Corrupted Foreign Words'].push(item);
  } else if (t.kanji.includes('作') || t.kanji.includes('取') || t.kanji.includes('管理') || t.kanji.includes('要因') || t.kanji.includes('料料') || t.kanji.includes('漁場')) {
    groups['Corrupted / Typo Question Compounds'].push(item);
  } else {
    groups['Cut-off Ruby Stems / Bound Morphemes'].push(item);
  }
}

for (const [groupName, list] of Object.entries(groups)) {
  console.log(`### ${groupName} (${list.length} entri):`);
  for (const item of list) {
    console.log(`- ${item.id} [${item.kanji}::${item.furigana}] (${item.matchStatus}, f:${item.furiganaStatus}): ${item.notes.slice(0, 80)}...`);
  }
  console.log('');
}
