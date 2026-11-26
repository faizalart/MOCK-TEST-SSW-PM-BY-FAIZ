import fs from 'node:fs';
import path from 'node:path';

const VALIDATED_DIR = 'deliverables/pilot-otaff51-01/validated';

// 1. Copy pilot-otaff51-01.json -> data/pilot-otaff51-01.json
fs.copyFileSync(
  path.join(VALIDATED_DIR, 'data/pilot-otaff51-01.json'),
  'data/pilot-otaff51-01.json'
);
console.log('Copied data/pilot-otaff51-01.json');

// 2. Copy 5 PNGs -> assets/questions/
for (const fname of fs.readdirSync(path.join(VALIDATED_DIR, 'assets/questions'))) {
  fs.copyFileSync(
    path.join(VALIDATED_DIR, 'assets/questions', fname),
    path.join('assets/questions', fname)
  );
  console.log('Copied assets/questions/' + fname);
}

// 3. Merge sharedKotobaDictionary-delta.json -> data/sharedKotobaDictionary.json
const prodDict = JSON.parse(fs.readFileSync('data/sharedKotobaDictionary.json', 'utf8'));
const deltaDict = JSON.parse(fs.readFileSync(path.join(VALIDATED_DIR, 'data/sharedKotobaDictionary-delta.json'), 'utf8'));
for (const [id, entry] of Object.entries(deltaDict.terms || {})) {
  prodDict.terms[id] = entry;
}
fs.writeFileSync('data/sharedKotobaDictionary.json', JSON.stringify(prodDict, null, 2) + '\n', 'utf8');
console.log('Merged sharedKotobaDictionary.json -> total terms:', Object.keys(prodDict.terms).length);

// 4. Merge kotobaMapping-delta.json -> data/kotobaMapping.json
const prodMap = JSON.parse(fs.readFileSync('data/kotobaMapping.json', 'utf8'));
const deltaMap = JSON.parse(fs.readFileSync(path.join(VALIDATED_DIR, 'data/kotobaMapping-delta.json'), 'utf8'));
Object.assign(prodMap.questions, deltaMap.questions || {});
Object.assign(prodMap.options, deltaMap.options || {});
Object.assign(prodMap.byCompositeKey, deltaMap.byCompositeKey || {});
fs.writeFileSync('data/kotobaMapping.json', JSON.stringify(prodMap, null, 2) + '\n', 'utf8');
console.log('Merged kotobaMapping.json -> total questions mapped:', Object.keys(prodMap.questions).length);

// 5. Merge kotoba-tambahan-delta.json -> data/kotoba-dan-kategori-tambahan.json
const prodKt = JSON.parse(fs.readFileSync('data/kotoba-dan-kategori-tambahan.json', 'utf8'));
const deltaKt = JSON.parse(fs.readFileSync(path.join(VALIDATED_DIR, 'data/kotoba-tambahan-delta.json'), 'utf8'));
Object.assign(prodKt.entries, deltaKt.entries || {});
prodKt.totalEntries = Object.keys(prodKt.entries).length;
fs.writeFileSync('data/kotoba-dan-kategori-tambahan.json', JSON.stringify(prodKt, null, 2) + '\n', 'utf8');
console.log('Merged kotoba-dan-kategori-tambahan.json -> totalEntries:', prodKt.totalEntries);
