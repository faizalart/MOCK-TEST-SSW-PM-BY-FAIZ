// scratch/patch-test-t026.mjs
import fs from 'node:fs';

let testSource = fs.readFileSync('tests/test-practice-selective-kotoba.mjs', 'utf8');

const targetStr = '// -----------------------------------------------------------------------------\r\n// 13. Test Harness Summary';
const targetStrAlt = '// -----------------------------------------------------------------------------\n// 13. Test Harness Summary';

const isCRLF = testSource.includes('\r\n');
const target = testSource.includes(targetStr) ? targetStr : targetStrAlt;

if (!testSource.includes(target)) {
  console.error('Target not found in tests/test-practice-selective-kotoba.mjs!');
  process.exit(1);
}

const p13Code = `// -----------------------------------------------------------------------------
// 13. Phase 7: EDRDG / JMdict Legal Attribution in Settings Modal (Task T026)
// -----------------------------------------------------------------------------
console.log('\\n--- Phase 7: EDRDG / JMdict Legal Attribution in Settings Modal (T026) ---');

// 13.1 Official Sample Acknowledgment Wording
assert.ok(
  normAppSource.includes('This application uses data from the <strong>JMdict</strong> dictionary file'),
  'Settings modal must feature official EDRDG acknowledgment sample wording'
);
assert.ok(
  normAppSource.includes('Electronic Dictionary Research and Development Group (EDRDG)'),
  'Settings modal must explicitly name EDRDG'
);
console.log('✓ Criterion 13.1: Official EDRDG acknowledgment wording mounted in Settings Modal');

// 13.2 Legal Links to Licence, Project & CC BY-SA 4.0
assert.ok(
  normAppSource.includes('href=\"https://www.edrdg.org/edrdg/licence.html\"'),
  'Must include active link to EDRDG licence'
);
assert.ok(
  normAppSource.includes('href=\"https://www.edrdg.org/wiki/index.php/JMdict-EDICT_Dictionary_Project\"'),
  'Must include active link to JMdict Project'
);
assert.ok(
  normAppSource.includes('href=\"https://creativecommons.org/licenses/by-sa/4.0/legalcode\"'),
  'Must include active link to CC BY-SA 4.0 legal code'
);
console.log('✓ Criterion 13.2: Active hyperlinks to EDRDG licence, JMdict Project, and CC BY-SA 4.0 verified');

// 13.3 Decoupling & In-House Indonesian Curation Clarity
assert.ok(
  normAppSource.includes('in-house curated Indonesian definitions') &&
  normAppSource.includes('separate proprietary works'),
  'Must document in-house Indonesian curation and preserve proprietary CBT engine boundary'
);
console.log('✓ Criterion 13.3: In-house Indonesian curation clarity and proprietary software decoupling preserved');

// 13.4 Responsive Scrollable Popover Architecture
assert.ok(
  zenCssSource.includes('.exam-settings-popover') &&
  zenCssSource.includes('max-height: calc(100vh - 70px) !important') &&
  zenCssSource.includes('.exam-settings-body') &&
  zenCssSource.includes('overflow-y: auto !important'),
  'Settings popover must support scrollable overflow without breaking viewport boundary'
);
console.log('✓ Criterion 13.4: Settings modal layout ergonomics and scrollability guaranteed');

// -----------------------------------------------------------------------------
// 14. Test Harness Summary`;

const formattedP13 = isCRLF ? p13Code.replace(/\n/g, '\r\n') : p13Code;
testSource = testSource.replace(target, formattedP13);

const sumOld = "console.log(' 13. Task T025: Vertical Content Stacking:     VERIFIED (100% PASSED)');";
const sumOldCRLF = "console.log(' 13. Task T025: Vertical Content Stacking:     VERIFIED (100% PASSED)');\r\n";
const sumOldLF = "console.log(' 13. Task T025: Vertical Content Stacking:     VERIFIED (100% PASSED)');\n";

const sumAddition = "console.log(' 14. Task T026: EDRDG / JMdict Attribution:    VERIFIED (100% PASSED)');";

if (testSource.includes(sumOldCRLF)) {
  testSource = testSource.replace(sumOldCRLF, sumOldCRLF + "console.log(' 14. Task T026: EDRDG / JMdict Attribution:    VERIFIED (100% PASSED)');\r\n");
} else if (testSource.includes(sumOldLF)) {
  testSource = testSource.replace(sumOldLF, sumOldLF + "console.log(' 14. Task T026: EDRDG / JMdict Attribution:    VERIFIED (100% PASSED)');\n");
} else if (testSource.includes(sumOld)) {
  testSource = testSource.replace(sumOld, sumOld + '\n' + sumAddition);
}

fs.writeFileSync('tests/test-practice-selective-kotoba.mjs', testSource, 'utf8');
console.log('Successfully patched tests/test-practice-selective-kotoba.mjs with T026 suite');
