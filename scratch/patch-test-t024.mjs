// scratch/patch-test-t024.mjs
import fs from 'node:fs';

let testSource = fs.readFileSync('tests/test-practice-selective-kotoba.mjs', 'utf8');

const targetStr = '// -----------------------------------------------------------------------------\r\n// 11. Test Harness Summary';
const targetStrAlt = '// -----------------------------------------------------------------------------\n// 11. Test Harness Summary';

const isCRLF = testSource.includes('\r\n');
const target = testSource.includes(targetStr) ? targetStr : targetStrAlt;

if (!testSource.includes(target)) {
  console.error('Target not found in tests/test-practice-selective-kotoba.mjs!');
  process.exit(1);
}

const p11Code = `// -----------------------------------------------------------------------------
// 11. User Story 4: Touch Feedback (:active) & Sticky Hover Prevention (Task T024)
// -----------------------------------------------------------------------------
console.log('\\n--- User Story 4: Touch Feedback (:active) & Sticky Hover Prevention (T024) ---');

// 11.1 Touch & Coarse Pointer Media Query
assert.ok(
  zenCssSource.includes('@media (hover: none) and (pointer: coarse)'),
  'ZEN-APP-SHELL.css must define @media (hover: none) and (pointer: coarse)'
);
console.log('✓ Criterion 11.1: Dedicated touch & coarse pointer media query is mounted');

// 11.2 Temporary Pressed Feedback for OFF and ON States
assert.ok(
  /\\.practice-row-ctrl:active:not\\(\\.is-active\\)\\s*\\{[^}]*background:\\s*rgba\\(169,\\s*209,\\s*107/i.test(zenCssSource) &&
  /\\.practice-row-ctrl:active:not\\(\\.is-active\\)\\s*\\{[^}]*border-color:\\s*#a9d16b/i.test(zenCssSource),
  ':active:not(.is-active) must provide pressed feedback with soft green tint and accent border'
);
assert.ok(
  /\\.practice-row-ctrl\\.is-active:active\\s*\\{[^}]*background:\\s*rgba\\(169,\\s*209,\\s*107/i.test(zenCssSource) &&
  /\\.practice-row-ctrl\\.is-active:active\\s*\\{[^}]*color:\\s*#2e5912/i.test(zenCssSource),
  '.is-active:active must provide reinforced pressed feedback while preserving high-contrast icon'
);
console.log('✓ Criterion 11.2: Instant pressed feedback for OFF and ON states verified with high contrast');

// 11.3 Elimination of Sticky Hover on Touchscreens
const touchBlockMatch = zenCssSource.match(/@media\\s*\\(hover:\\s*none\\)\\s*and\\s*\\(pointer:\\s*coarse\\)\\s*\\{([\\s\\S]*?)\\n\\}/i);
assert.ok(touchBlockMatch, 'Touch media query block required');
assert.ok(!touchBlockMatch[1].includes(':hover'), 'Zero :hover declarations in touch media query');
console.log('✓ Criterion 11.3: Zero sticky hover artifacts on touchscreens verified');

// 11.4 Pure CSS Transient State (Zero JS Touch Overhead)
assert.ok(
  !appSource.includes('practice-row-ctrl:active') &&
  !appSource.includes('is-touching') &&
  !appSource.includes('practice-touch-active'),
  'Zero touch state pollution in app.js'
);
console.log('✓ Criterion 11.4: Pure CSS transient :active state verified with zero JS memory/event overhead');

// -----------------------------------------------------------------------------
// 12. Test Harness Summary`;

const formattedP11 = isCRLF ? p11Code.replace(/\n/g, '\r\n') : p11Code;
testSource = testSource.replace(target, formattedP11);

const sumOld = "console.log(' 11. Task T023: Button Styling & Desktop Hover: VERIFIED (100% PASSED)');";
const sumOldCRLF = "console.log(' 11. Task T023: Button Styling & Desktop Hover: VERIFIED (100% PASSED)');\r\n";
const sumOldLF = "console.log(' 11. Task T023: Button Styling & Desktop Hover: VERIFIED (100% PASSED)');\n";

const sumAddition = "console.log(' 12. Task T024: Touch Feedback (:active):      VERIFIED (100% PASSED)');";

if (testSource.includes(sumOldCRLF)) {
  testSource = testSource.replace(sumOldCRLF, sumOldCRLF + "console.log(' 12. Task T024: Touch Feedback (:active):      VERIFIED (100% PASSED)');\r\n");
} else if (testSource.includes(sumOldLF)) {
  testSource = testSource.replace(sumOldLF, sumOldLF + "console.log(' 12. Task T024: Touch Feedback (:active):      VERIFIED (100% PASSED)');\n");
} else if (testSource.includes(sumOld)) {
  testSource = testSource.replace(sumOld, sumOld + '\n' + sumAddition);
}

fs.writeFileSync('tests/test-practice-selective-kotoba.mjs', testSource, 'utf8');
console.log('Successfully patched tests/test-practice-selective-kotoba.mjs with T024 suite');
