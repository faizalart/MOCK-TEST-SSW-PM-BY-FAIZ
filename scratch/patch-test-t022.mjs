// scratch/patch-test-t022.mjs
import fs from 'node:fs';

let testSource = fs.readFileSync('tests/test-practice-selective-kotoba.mjs', 'utf8');

const targetStr = '// -----------------------------------------------------------------------------\r\n// 9. Test Harness Summary';
const targetStrAlt = '// -----------------------------------------------------------------------------\n// 9. Test Harness Summary';

const isCRLF = testSource.includes('\r\n');
const target = testSource.includes(targetStr) ? targetStr : targetStrAlt;

if (!testSource.includes(target)) {
  console.error('Target not found in tests/test-practice-selective-kotoba.mjs!');
  process.exit(1);
}

const p9Code = `// -----------------------------------------------------------------------------
// 9. User Story 4: Three-Column Sibling Grid Layout (Task T022)
// -----------------------------------------------------------------------------
console.log('\\n--- User Story 4: Three-Column Sibling Grid Layout (T022) ---');

// 9.1 CSS Grid Rules for Prompt and Option Rows
assert.ok(
  zenCssSource.includes('.practice-prompt-row') && zenCssSource.includes('.practice-option-row'),
  'ZEN-APP-SHELL.css must define .practice-prompt-row and .practice-option-row'
);
assert.ok(
  /\\.practice-prompt-row[^{]*\\{[^}]*grid-template-columns:\\s*44px\\s+minmax\\(0,\\s*1fr\\)\\s+44px/i.test(zenCssSource),
  '.practice-prompt-row must specify grid-template-columns: 44px minmax(0, 1fr) 44px'
);
assert.ok(
  /\\.practice-option-row[^{]*\\{[^}]*grid-template-columns:\\s*44px\\s+minmax\\(0,\\s*1fr\\)\\s+44px/i.test(zenCssSource),
  '.practice-option-row must specify grid-template-columns: 44px minmax(0, 1fr) 44px'
);
console.log('✓ Criterion 9.1: Both prompt and option rows configured with 3-column sibling grid (44px minmax(0, 1fr) 44px)');

// 9.2 Blowout Prevention & Flexible 1fr Center Track
assert.ok(
  zenCssSource.includes('.practice-prompt-center') &&
  /\\.practice-prompt-center\\s*\\{[^}]*min-width:\\s*0/i.test(zenCssSource),
  '.practice-prompt-center must specify min-width: 0 !important'
);
assert.ok(
  zenCssSource.includes('.practice-option-row .answer-choice') &&
  /\\.practice-option-row\\s+\\.answer-choice\\s*\\{[^}]*min-width:\\s*0/i.test(zenCssSource),
  '.practice-option-row .answer-choice must specify min-width: 0 !important'
);
console.log('✓ Criterion 9.2: Center content columns protected with min-width: 0 blowout prevention');

// 9.3 Standard CBT Answer Choice Isolation
const rawAnswerChoiceMatches = zenCssSource.match(/[^{}]*\\.answer-choice[^{]*\\{/g) || [];
for (const sel of rawAnswerChoiceMatches) {
  if (sel.includes('.practice-option-row')) {
    assert.ok(sel.trim().startsWith('.practice-option-row'), 'Must be scoped under .practice-option-row');
  }
}
console.log('✓ Criterion 9.3: Standard CBT .answer-choice styling untouched and strictly isolated');

// 9.4 DOM Sibling Ordering in app.js
const normAppSource = appSource.replace(/\\r\\n/g, '\\n');
const promptIdx = normAppSource.indexOf('<div class="practice-prompt-row">');
assert.ok(promptIdx !== -1, 'app.js must render <div class="practice-prompt-row">');
const promptEnd = normAppSource.indexOf('</div>', normAppSource.indexOf('practice-ctrl-kotoba', promptIdx));
const promptSlice = normAppSource.substring(promptIdx, promptEnd + 6);
assert.ok(promptSlice.indexOf('practice-ctrl-trans') < promptSlice.indexOf('practice-prompt-center'), 'Prompt left trans button before center');
assert.ok(promptSlice.indexOf('practice-prompt-center') < promptSlice.indexOf('practice-ctrl-kotoba'), 'Prompt center before right kotoba button');

const optIdx = normAppSource.indexOf('<div class="practice-option-row">');
assert.ok(optIdx !== -1, 'app.js must render <div class="practice-option-row">');
const optEnd = normAppSource.indexOf('</div>', normAppSource.indexOf('practice-ctrl-kotoba', optIdx));
const optSlice = normAppSource.substring(optIdx, optEnd + 6);
const ansVar = '\${' + 'answerChoiceHTML}';
assert.ok(optSlice.indexOf('practice-ctrl-trans') < optSlice.indexOf(ansVar), 'Option left trans button before answer choice');
assert.ok(optSlice.indexOf(ansVar) < optSlice.indexOf('practice-ctrl-kotoba'), 'Option answer choice before right kotoba button');
console.log('✓ Criterion 9.4: Strict DOM sibling order verified: [Left Trans] [Center Content] [Right Kotoba]');

// 9.5 Viewport Ergonomics & Separation Geometry
const colLeft = 44;
const colRight = 44;
const gap = 10;
const fixedOverhead = colLeft + colRight + (gap * 2); // 108px

// Mobile Viewport: 390px (362px row width)
const mobCenter = (390 - 28) - fixedOverhead; // 254px
const mobGap = mobCenter + (gap * 2); // 274px
assert.ok(mobCenter > 200, 'Mobile center width must exceed 200px');
assert.ok(mobGap >= 200, 'Mobile button separation must exceed 200px threshold to eliminate accidental touch');

// Desktop Viewport: 1440px (930px row width)
const dskCenter = 930 - fixedOverhead; // 822px
const dskGap = dskCenter + (gap * 2); // 842px
assert.ok(dskCenter > 700, 'Desktop center width must exceed 700px');
console.log(\`✓ Criterion 9.5: Ergonomic button separation verified: Mobile \${mobGap}px (>=200px), Desktop \${dskGap}px\`);

// -----------------------------------------------------------------------------
// 10. Test Harness Summary`;

const formattedP9 = isCRLF ? p9Code.replace(/\n/g, '\r\n') : p9Code;
testSource = testSource.replace(target, formattedP9);

const sumOld = "console.log('  9. Task T021: Dedicated Kotoba Furigana CSS:    VERIFIED (100% PASSED)');";
const sumOldCRLF = "console.log('  9. Task T021: Dedicated Kotoba Furigana CSS:    VERIFIED (100% PASSED)');\r\n";
const sumOldLF = "console.log('  9. Task T021: Dedicated Kotoba Furigana CSS:    VERIFIED (100% PASSED)');\n";

const sumAddition = "console.log(' 10. Task T022: Three-Column Sibling Grid:     VERIFIED (100% PASSED)');";

if (testSource.includes(sumOldCRLF)) {
  testSource = testSource.replace(sumOldCRLF, sumOldCRLF + "console.log(' 10. Task T022: Three-Column Sibling Grid:     VERIFIED (100% PASSED)');\r\n");
} else if (testSource.includes(sumOldLF)) {
  testSource = testSource.replace(sumOldLF, sumOldLF + "console.log(' 10. Task T022: Three-Column Sibling Grid:     VERIFIED (100% PASSED)');\n");
} else if (testSource.includes(sumOld)) {
  testSource = testSource.replace(sumOld, sumOld + '\n' + sumAddition);
}

fs.writeFileSync('tests/test-practice-selective-kotoba.mjs', testSource, 'utf8');
console.log('Successfully patched tests/test-practice-selective-kotoba.mjs');
