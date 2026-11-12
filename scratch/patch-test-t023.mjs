// scratch/patch-test-t023.mjs
import fs from 'node:fs';

let testSource = fs.readFileSync('tests/test-practice-selective-kotoba.mjs', 'utf8');

const targetStr = '// -----------------------------------------------------------------------------\r\n// 10. Test Harness Summary';
const targetStrAlt = '// -----------------------------------------------------------------------------\n// 10. Test Harness Summary';

const isCRLF = testSource.includes('\r\n');
const target = testSource.includes(targetStr) ? targetStr : targetStrAlt;

if (!testSource.includes(target)) {
  console.error('Target not found in tests/test-practice-selective-kotoba.mjs!');
  process.exit(1);
}

const p10Code = `// -----------------------------------------------------------------------------
// 10. User Story 4: Control Button Sizing, Colors & Desktop Hover (Task T023)
// -----------------------------------------------------------------------------
console.log('\\n--- User Story 4: Control Button Sizing, Colors & Desktop Hover (T023) ---');

// 10.1 Minimum 44 x 44 px Touch Target & Centering
assert.ok(
  zenCssSource.includes('.practice-row-ctrl') &&
  /\\.practice-row-ctrl[^{]*\\{[^}]*width:\\s*44px/i.test(zenCssSource) &&
  /\\.practice-row-ctrl[^{]*\\{[^}]*min-width:\\s*44px/i.test(zenCssSource) &&
  /\\.practice-row-ctrl[^{]*\\{[^}]*min-height:\\s*44px/i.test(zenCssSource),
  '.practice-row-ctrl must enforce 44x44px minimum touch target dimensions'
);
assert.ok(
  /\\.practice-row-ctrl[^{]*\\{[^}]*display:\\s*inline-flex/i.test(zenCssSource) &&
  /\\.practice-row-ctrl[^{]*\\{[^}]*align-items:\\s*center/i.test(zenCssSource) &&
  /\\.practice-row-ctrl[^{]*\\{[^}]*justify-content:\\s*center/i.test(zenCssSource),
  '.practice-row-ctrl must use flexbox to center icons'
);
console.log('✓ Criterion 10.1: Minimum 44 × 44 px touch target and flexbox icon centering verified');

// 10.2 Transparent Neutral OFF State (Zero Permanent Gray Boxes)
assert.ok(
  /\\.practice-row-ctrl[^{]*\\{[^}]*background:\\s*transparent/i.test(zenCssSource),
  'Default OFF state must have transparent background'
);
assert.ok(
  /\\.practice-row-ctrl[^{]*\\{[^}]*color:\\s*#6c7883/i.test(zenCssSource),
  'Default OFF state must use neutral slate icon color (#6c7883)'
);
assert.ok(
  /\\.practice-row-ctrl[^{]*\\{[^}]*border:\\s*1px\\s+solid\\s+#cfd7de/i.test(zenCssSource),
  'Default OFF state must have subtle border for pressable affordance'
);
console.log('✓ Criterion 10.2: Transparent neutral OFF state verified with zero permanent gray background');

// 10.3 Active ON State (Theme Green #a9d16b with Soft Tint)
assert.ok(
  zenCssSource.includes('.practice-row-ctrl.is-active') &&
  /\\.practice-row-ctrl\\.is-active\\s*\\{[^}]*border-color:\\s*#a9d16b/i.test(zenCssSource) &&
  /\\.practice-row-ctrl\\.is-active\\s*\\{[^}]*background:\\s*rgba\\(169,\\s*209,\\s*107/i.test(zenCssSource),
  'Active ON state must display theme green #a9d16b border and soft tint background'
);
console.log('✓ Criterion 10.3: Active ON state with #a9d16b border and soft green tint verified');

// 10.4 Desktop Hover Scoped to (hover: hover) and (pointer: fine)
assert.ok(
  zenCssSource.includes('@media (hover: hover) and (pointer: fine)'),
  'Desktop hover must be strictly isolated to (hover: hover) and (pointer: fine)'
);
const desktopHoverMatch = zenCssSource.match(/@media\\s*\\(hover:\\s*hover\\)\\s*and\\s*\\(pointer:\\s*fine\\)\\s*\\{([\\s\\S]*?)\\n\\}/i);
assert.ok(desktopHoverMatch, 'Desktop hover media query block required');
assert.ok(
  desktopHoverMatch[1].includes('.practice-row-ctrl:hover') || desktopHoverMatch[1].includes('.practice-row-ctrl:hover:not(.is-active)'),
  'Desktop hover must style .practice-row-ctrl inside media block'
);
console.log('✓ Criterion 10.4: Desktop hover strictly scoped with zero sticky hover leak to touchscreens');

// 10.5 Keyboard Accessibility (:focus-visible)
assert.ok(
  zenCssSource.includes('.practice-row-ctrl:focus-visible') &&
  /\\.practice-row-ctrl:focus-visible\\s*\\{[^}]*outline:\\s*2px\\s+solid\\s+#a9d16b/i.test(zenCssSource),
  '.practice-row-ctrl:focus-visible must provide clear 2px #a9d16b outline'
);
console.log('✓ Criterion 10.5: Accessible keyboard focus indicator (:focus-visible) verified');

// -----------------------------------------------------------------------------
// 11. Test Harness Summary`;

const formattedP10 = isCRLF ? p10Code.replace(/\n/g, '\r\n') : p10Code;
testSource = testSource.replace(target, formattedP10);

const sumOld = "console.log(' 10. Task T022: Three-Column Sibling Grid:     VERIFIED (100% PASSED)');";
const sumOldCRLF = "console.log(' 10. Task T022: Three-Column Sibling Grid:     VERIFIED (100% PASSED)');\r\n";
const sumOldLF = "console.log(' 10. Task T022: Three-Column Sibling Grid:     VERIFIED (100% PASSED)');\n";

const sumAddition = "console.log(' 11. Task T023: Button Styling & Desktop Hover: VERIFIED (100% PASSED)');";

if (testSource.includes(sumOldCRLF)) {
  testSource = testSource.replace(sumOldCRLF, sumOldCRLF + "console.log(' 11. Task T023: Button Styling & Desktop Hover: VERIFIED (100% PASSED)');\r\n");
} else if (testSource.includes(sumOldLF)) {
  testSource = testSource.replace(sumOldLF, sumOldLF + "console.log(' 11. Task T023: Button Styling & Desktop Hover: VERIFIED (100% PASSED)');\n");
} else if (testSource.includes(sumOld)) {
  testSource = testSource.replace(sumOld, sumOld + '\n' + sumAddition);
}

fs.writeFileSync('tests/test-practice-selective-kotoba.mjs', testSource, 'utf8');
console.log('Successfully patched tests/test-practice-selective-kotoba.mjs with T023 suite');
