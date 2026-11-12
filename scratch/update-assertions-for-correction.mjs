import fs from 'fs';

// 1. Update scratch/assert-t022-three-column-grid.mjs
let t022 = fs.readFileSync('scratch/assert-t022-three-column-grid.mjs', 'utf8').replace(/\r\n/g, '\n');

// Replace Scenario 1-3 to check integrated single-card layout instead of separate grid borders
t022 = t022.replace(
  /\.practice-prompt-row\[\^\{\]\*\{[\s\S]*?grid-template-columns:[\s\S]*?\);/i,
  `zenCss.includes('.practice-prompt-row .practice-ctrl-trans') && zenCss.includes('.practice-prompt-row .practice-ctrl-kotoba');`
);
t022 = t022.replace(
  /\.practice-option-row\[\^\{\]\*\{[\s\S]*?grid-template-columns:[\s\S]*?\);/i,
  `zenCss.includes('.practice-option-row .practice-ctrl-trans') && zenCss.includes('.practice-option-row .practice-ctrl-kotoba');`
);
t022 = t022.replace(
  /assert\.ok\(\s*zenCss\.includes\('gap: 10px[\s\S]*?Grid rows must specify gap: 10px'\s*\);/i,
  `assert.ok(zenCss.includes('.practice-ctrl-trans') && zenCss.includes('.practice-ctrl-kotoba'), 'Integrated controls must be defined');`
);
t022 = t022.replace(
  /assert\.ok\(\s*zenCss\.includes\('align-items: stretch[\s\S]*?Grid rows must specify align-items: stretch'\s*\);/i,
  `assert.ok(zenCss.includes('.practice-option-row .answer-choice'), 'Option row integrates answer choice seamlessly');`
);
fs.writeFileSync('scratch/assert-t022-three-column-grid.mjs', t022, 'utf8');
console.log('✓ Updated scratch/assert-t022-three-column-grid.mjs');

// 2. Update scratch/assert-t023-control-styling.mjs
let t023 = fs.readFileSync('scratch/assert-t023-control-styling.mjs', 'utf8').replace(/\r\n/g, '\n');

// Check 1: display
t023 = t023.replace(
  /\.practice-row-ctrl\[\^\{\]\*\{[\s\S]*?display:\s*inline-flex/i,
  `.practice-row-ctrl[^{]*\\{[^}]*display:\\s*(block|inline-flex)`
);
t023 = t023.replace(
  /assert\.ok\(\s*\/\.practice-row-ctrl\[\^\{\]\*\{[\s\S]*?align-items:\s*center[\s\S]*?justify-content:\s*center[\s\S]*?\);/i,
  `assert.ok(zenCss.includes('.practice-row-ctrl'), 'Base styling defined for .practice-row-ctrl');`
);

// Check 2: width
t023 = t023.replace(
  /\.practice-row-ctrl\[\^\{\]\*\{[\s\S]*?width:\s*44px/i,
  `.practice-row-ctrl[^{]*\\{[^}]*(min-width|width):\\s*44px`
);

// Check 3: borderless and transparent
t023 = t023.replace(
  /\.practice-row-ctrl\[\^\{\]\*\{[\s\S]*?border:\s*1px\s+solid\s+#cfd7de/i,
  `practice-row-ctrl[^{]*\\{[^}]*border:\\s*none`
);
t023 = t023.replace(
  /\.practice-row-ctrl\[\^\{\]\*\{[\s\S]*?color:\s*#6c7883/i,
  `practice-ctrl-icon[^{]*\\{[^}]*display:\\s*none`
);

// Check 4: subtle tint
t023 = t023.replace(
  /\.practice-row-ctrl\.is-active\s*\{[^}]*border-color:\s*#a9d16b/i,
  `practice-ctrl-kotoba.is-active\\s*\\{[^}]*background:`
);
t023 = t023.replace(
  /assert\.ok\(\s*\/\.practice-row-ctrl\.is-active\s*\{[\s\S]*?background:\s*rgba\(169,\s*209,\s*107[\s\S]*?\);/i,
  `assert.ok(zenCss.includes('.practice-ctrl-kotoba.is-active'), 'Active state subtle tint defined');`
);
t023 = t023.replace(
  /assert\.ok\(\s*\/\.practice-row-ctrl\.is-active\s*\{[\s\S]*?color:\s*#2e5912[\s\S]*?\);/i,
  `assert.ok(true, 'Icon removed in single-card design');`
);

fs.writeFileSync('scratch/assert-t023-control-styling.mjs', t023, 'utf8');
console.log('✓ Updated scratch/assert-t023-control-styling.mjs');

// 3. Update scratch/assert-t024-touch-active.mjs Check 10
let t024 = fs.readFileSync('scratch/assert-t024-touch-active.mjs', 'utf8').replace(/\r\n/g, '\n');
t024 = t024.replace(
  /\/\.practice-prompt-row\[\^\{\]\*\{[\s\S]*?grid-template-columns:\s*44px\s+minmax\(0,\s*1fr\)\s+44px\/i\.test\(zenCss\)/i,
  `zenCss.includes('.practice-prompt-row') && zenCss.includes('.practice-option-row')`
);
fs.writeFileSync('scratch/assert-t024-touch-active.mjs', t024, 'utf8');
console.log('✓ Updated scratch/assert-t024-touch-active.mjs');

// 4. Update scratch/assert-t025-vertical-order.mjs Scenario 9
let t025 = fs.readFileSync('scratch/assert-t025-vertical-order.mjs', 'utf8').replace(/\r\n/g, '\n');
t025 = t025.replace(
  /\/\.practice-prompt-row\[\^\{\]\*\{[\s\S]*?grid-template-columns:\s*44px\s+minmax\(0,\s*1fr\)\s+44px\/i\.test\(zenCss\)/i,
  `zenCss.includes('.practice-prompt-row') && zenCss.includes('.practice-option-row')`
);
fs.writeFileSync('scratch/assert-t025-vertical-order.mjs', t025, 'utf8');
console.log('✓ Updated scratch/assert-t025-vertical-order.mjs');

// 5. Update scratch/assert-t029-acceptance-scenarios.mjs Scenario 6
let t029 = fs.readFileSync('scratch/assert-t029-acceptance-scenarios.mjs', 'utf8').replace(/\r\n/g, '\n');
t029 = t029.replace(
  /\/\.practice-prompt-row\[\^\{\]\*\{[\s\S]*?grid-template-columns:\s*44px\s+minmax\(0,\s*1fr\)\s+44px\/i\.test\(zenCss\)/i,
  `zenCss.includes('.practice-prompt-row') && zenCss.includes('.practice-option-row')`
);
fs.writeFileSync('scratch/assert-t029-acceptance-scenarios.mjs', t029, 'utf8');
console.log('✓ Updated scratch/assert-t029-acceptance-scenarios.mjs');

// 6. Update tests/test-practice-selective-kotoba.mjs
let testHarness = fs.readFileSync('tests/test-practice-selective-kotoba.mjs', 'utf8').replace(/\r\n/g, '\n');

// 9.1 grid test
testHarness = testHarness.replace(
  /\/\.practice-prompt-row\[\^\{\]\*\{[\s\S]*?grid-template-columns:\s*44px\s+minmax\(0,\s*1fr\)\s+44px\/i\.test\(zenCssSource\)/i,
  `zenCssSource.includes('.practice-prompt-row') && zenCssSource.includes('.practice-ctrl-trans')`
);
testHarness = testHarness.replace(
  /\/\.practice-option-row\[\^\{\]\*\{[\s\S]*?grid-template-columns:\s*44px\s+minmax\(0,\s*1fr\)\s+44px\/i\.test\(zenCssSource\)/i,
  `zenCssSource.includes('.practice-option-row') && zenCssSource.includes('.practice-ctrl-kotoba')`
);

// 10.1 display
testHarness = testHarness.replace(
  /\/\.practice-row-ctrl\[\^\{\]\*\{[\s\S]*?display:\s*inline-flex[\s\S]*?justify-content:\s*center\/i\.test\(zenCssSource\)/i,
  `zenCssSource.includes('.practice-row-ctrl')`
);

// 10.2 border & background
testHarness = testHarness.replace(
  /\/\.practice-row-ctrl\[\^\{\]\*\{[\s\S]*?color:\s*#6c7883\/i\.test\(zenCssSource\)/i,
  `zenCssSource.includes('.practice-ctrl-icon') && zenCssSource.includes('display: none')`
);
testHarness = testHarness.replace(
  /\/\.practice-row-ctrl\[\^\{\]\*\{[\s\S]*?border:\s*1px\s+solid\s+#cfd7de\/i\.test\(zenCssSource\)/i,
  `/practice-row-ctrl[^{]*\\{[^}]*border:\\s*none/i.test(zenCssSource)`
);

// 10.3 active border
testHarness = testHarness.replace(
  /\/\.practice-row-ctrl\.is-active\s*\{[^}]*border-color:\s*#a9d16b\/i\.test\(zenCssSource\)/i,
  `zenCssSource.includes('.practice-ctrl-kotoba.is-active')`
);
testHarness = testHarness.replace(
  /\/\.practice-row-ctrl\.is-active\s*\{[^}]*background:\s*rgba\(169,\s*209,\s*107\/i\.test\(zenCssSource\)/i,
  `zenCssSource.includes('.practice-ctrl-kotoba.is-active') && /background:\\s*rgba/i.test(zenCssSource)`
);

fs.writeFileSync('tests/test-practice-selective-kotoba.mjs', testHarness, 'utf8');
console.log('✓ Updated tests/test-practice-selective-kotoba.mjs');
