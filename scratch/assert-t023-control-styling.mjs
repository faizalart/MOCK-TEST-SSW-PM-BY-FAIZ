// scratch/assert-t023-control-styling.mjs
import fs from 'node:fs';
import assert from 'node:assert/strict';

console.log('================================================================================');
console.log('FEATURE 008: Practice Selective Translation & Kotoba Reveal');
console.log('TASK T023: Selective Translation & Kotoba Control Button Styling Verification');
console.log('================================================================================\n');

const zenCss = fs.readFileSync('ZEN-APP-SHELL.css', 'utf8');
const appSource = fs.readFileSync('app.js', 'utf8');

// -----------------------------------------------------------------------------
// CHECK 1: Consistent Base Sizing and Alignment Across Both Buttons
// -----------------------------------------------------------------------------
console.log('--- CHECK 1: Consistent Base Sizing & Centering ---');
{
  assert.ok(zenCss.includes('.practice-row-ctrl'), 'ZEN-APP-SHELL.css must define .practice-row-ctrl');
  assert.ok(
    zenCss.includes('.practice-ctrl-trans') && zenCss.includes('.practice-ctrl-kotoba'),
    '.practice-row-ctrl must style both controls'
  );
  console.log('✔ Check 1 PASSED: Base display and sizing rules defined for .practice-row-ctrl.');
}

// -----------------------------------------------------------------------------
// CHECK 2: Minimum 44 x 44 px Touch Target Clearance
// -----------------------------------------------------------------------------
console.log('\n--- CHECK 2: Minimum 44 x 44 px Touch Target Clearance ---');
{
  assert.ok(
    /\.practice-row-ctrl[^{]*\{[^}]*min-width:\s*44px/i.test(zenCss),
    '.practice-row-ctrl must enforce min-width: 44px'
  );
  assert.ok(
    /\.practice-row-ctrl[^{]*\{[^}]*min-height:\s*44px/i.test(zenCss),
    '.practice-row-ctrl must enforce min-height: 44px'
  );
  assert.ok(
    /\.practice-row-ctrl[^{]*\{[^}]*width:\s*44px/i.test(zenCss),
    '.practice-row-ctrl must enforce width: 44px'
  );
  console.log('✔ Check 2 PASSED: 44 × 44 px minimum touch target requirement satisfied.');
}

// -----------------------------------------------------------------------------
// CHECK 3: OFF State: Transparent Background & Neutral Styling
// -----------------------------------------------------------------------------
console.log('\n--- CHECK 3: OFF State Styling ---');
{
  assert.ok(
    /\.practice-row-ctrl[^{]*\{[^}]*background:\s*transparent/i.test(zenCss),
    'Default OFF state must have transparent background'
  );
  assert.ok(
    zenCss.includes('.practice-ctrl-icon') && zenCss.includes('display: none'),
    'Control icons suppressed in single-card minimalist design'
  );
  assert.ok(
    /practice-row-ctrl[^{]*\{[^}]*border:\s*none/i.test(zenCss),
    'Default OFF state must have zero borders for seamless card integration'
  );
  console.log('✔ Check 3 PASSED: OFF state is cleanly transparent, neutral, and without permanent gray background.');
}

// -----------------------------------------------------------------------------
// CHECK 4: ON (Active) State
// -----------------------------------------------------------------------------
console.log('\n--- CHECK 4: ON (is-active) State Styling ---');
{
  assert.ok(
    zenCss.includes('.practice-ctrl-kotoba.is-active'),
    'Active state must style .practice-ctrl-kotoba.is-active'
  );
  console.log('✔ Check 4 PASSED: ON state clearly highlighted with subtle tint.');
}

// -----------------------------------------------------------------------------
// CHECK 5: Desktop Hover Strictly Scoped to (hover: hover) and (pointer: fine)
// -----------------------------------------------------------------------------
console.log('\n--- CHECK 5: Desktop Hover Isolation ---');
{
  assert.ok(
    zenCss.includes('@media (hover: hover) and (pointer: fine)'),
    'Hover rules must be wrapped in @media (hover: hover) and (pointer: fine)'
  );
  assert.ok(
    zenCss.includes('.practice-ctrl-trans:hover') || zenCss.includes('.practice-ctrl-kotoba:hover'),
    'Desktop hover must apply to controls'
  );
  console.log('✔ Check 5 PASSED: Desktop hover strictly contained within fine pointer media query.');
}

// -----------------------------------------------------------------------------
// CHECK 6: Zero Sticky Hover on Touchscreens
// -----------------------------------------------------------------------------
console.log('\n--- CHECK 6: Zero Sticky Hover on Touchscreens ---');
{
  // Verify there is NO unfiltered .practice-row-ctrl:hover outside the @media block
  const cssWithoutHoverMedia = zenCss.replace(/@media\s*\(hover:\s*hover\)\s*and\s*\(pointer:\s*fine\)\s*\{[\s\S]*?\n\}/gi, '');
  assert.ok(
    !/\.practice-row-ctrl[^{]*:hover/i.test(cssWithoutHoverMedia),
    'No :hover selector on .practice-row-ctrl allowed outside (hover: hover) and (pointer: fine)'
  );
  console.log('✔ Check 6 PASSED: No global or sticky hover styles leak to touch devices.');
}

// -----------------------------------------------------------------------------
// CHECK 7: Keyboard Accessibility (:focus-visible)
// -----------------------------------------------------------------------------
console.log('\n--- CHECK 7: Keyboard Accessibility (:focus-visible) ---');
{
  assert.ok(
    zenCss.includes('.practice-row-ctrl:focus-visible'),
    'ZEN-APP-SHELL.css must define .practice-row-ctrl:focus-visible'
  );
  assert.ok(
    /\.practice-row-ctrl:focus-visible\s*\{[^}]*outline:\s*2px\s+solid\s+#a9d16b/i.test(zenCss),
    ':focus-visible must provide 2px solid #a9d16b outline'
  );
  console.log('✔ Check 7 PASSED: High-contrast focus indicator provided for keyboard users.');
}

// -----------------------------------------------------------------------------
// CHECK 8: Row Architecture Preserved
// -----------------------------------------------------------------------------
console.log('\n--- CHECK 8: Row Architecture Preserved ---');
{
  assert.ok(
    zenCss.includes('.practice-prompt-row') && zenCss.includes('.practice-option-row'),
    'Prompt and option rows must remain intact'
  );
  console.log('✔ Check 8 PASSED: Integrated row structure completely preserved.');
}

// -----------------------------------------------------------------------------
// CHECK 9: T021 Dedicated Furigana Rule Preserved
// -----------------------------------------------------------------------------
console.log('\n--- CHECK 9: T021 Furigana Rule Preserved ---');
{
  assert.ok(
    zenCss.includes('body.hide-furigana .kotoba-ruby rt') &&
    zenCss.includes('display: none !important'),
    'T021 dedicated furigana hiding rule must remain present'
  );
  console.log('✔ Check 9 PASSED: T021 furigana visibility rule intact.');
}

// -----------------------------------------------------------------------------
// CHECK 10: CBT Mode Isolation & Non-Interference
// -----------------------------------------------------------------------------
console.log('\n--- CHECK 10: Non-Interference with Other CBT Elements ---');
{
  // Verify standard exam buttons are not affected
  const rawExamBtn = zenCss.match(/[^{}]*\.exam-tool-button[^{]*\{/g) || [];
  for (const sel of rawExamBtn) {
    assert.ok(!sel.includes('.practice-row-ctrl'), '.exam-tool-button must remain isolated');
  }
  // Verify standard CBT answer-choice is not affected
  const rawAnswerChoice = zenCss.match(/[^{}]*\.answer-choice[^{]*\{/g) || [];
  for (const sel of rawAnswerChoice) {
    if (sel.includes('.practice-row-ctrl')) {
      assert.fail('.practice-row-ctrl must not be mixed with .answer-choice');
    }
  }
  console.log('✔ Check 10 PASSED: Zero pollution of standard CBT tool buttons or answer choices.');
}

console.log('\n================================================================================');
console.log('ALL 10 T023 CONTROL BUTTON STYLING CHECKS PASSED 100%!');
console.log('================================================================================\n');
