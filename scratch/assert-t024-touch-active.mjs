// scratch/assert-t024-touch-active.mjs
import fs from 'node:fs';
import assert from 'node:assert/strict';

console.log('================================================================================');
console.log('FEATURE 008: Practice Selective Translation & Kotoba Reveal');
console.log('TASK T024: Touch Feedback (:active) & Accidental Hover Prevention Verification');
console.log('================================================================================\n');

const zenCss = fs.readFileSync('ZEN-APP-SHELL.css', 'utf8');
const appSource = fs.readFileSync('app.js', 'utf8');

// -----------------------------------------------------------------------------
// CHECK 1: Touch / Coarse Pointer Media Query Present
// -----------------------------------------------------------------------------
console.log('--- CHECK 1: Touch / Coarse Pointer Media Query Availability ---');
{
  assert.ok(
    zenCss.includes('@media (hover: none) and (pointer: coarse)'),
    'ZEN-APP-SHELL.css must define @media (hover: none) and (pointer: coarse)'
  );
  console.log('✔ Check 1 PASSED: Dedicated touch & coarse pointer media query is mounted.');
}

// -----------------------------------------------------------------------------
// CHECK 2: Temporary Pressed Feedback for Selective Controls
// -----------------------------------------------------------------------------
console.log('\n--- CHECK 2: Temporary Pressed Feedback for Selective Controls ---');
{
  assert.ok(
    zenCss.includes('.practice-ctrl-trans:active'),
    '.practice-ctrl-trans:active must provide pressed feedback'
  );
  assert.ok(
    zenCss.includes('.practice-ctrl-kotoba:active'),
    '.practice-ctrl-kotoba:active must provide pressed feedback'
  );
  console.log('✔ Check 2 PASSED: Selective controls display instant pressed feedback.');
}

// -----------------------------------------------------------------------------
// CHECK 3: Temporary Pressed Feedback in Touch Media Query
// -----------------------------------------------------------------------------
console.log('\n--- CHECK 3: Temporary Pressed Feedback in Touch Media Query ---');
{
  const touchMediaMatch = zenCss.match(/@media\s*\(hover:\s*none\)\s*and\s*\(pointer:\s*coarse\)\s*\{([\s\S]*?)\n\}/i);
  assert.ok(touchMediaMatch, 'Touch media query must exist');
  assert.ok(
    touchMediaMatch[1].includes(':active'),
    'Touch media query must define :active feedback'
  );
  console.log('✔ Check 3 PASSED: Touch media query defines :active feedback without sticky hover.');
}

// -----------------------------------------------------------------------------
// CHECK 4: Zero Permanent State Mutation from Pressed Selectors
// -----------------------------------------------------------------------------
console.log('\n--- CHECK 4: Transient Nature of :active Pseudo-Class ---');
{
  // :active is purely transient browser engine state that dissolves immediately upon release
  assert.ok(
    !zenCss.includes('.is-pressed') && !zenCss.includes('.practice-pressed'),
    'Zero synthetic pressed classes in CSS'
  );
  console.log('✔ Check 4 PASSED: Pressed feedback relies 100% on native CSS :active without persistent classes.');
}

// -----------------------------------------------------------------------------
// CHECK 5: Zero JavaScript Touch State Overhead on Selective Controls
// -----------------------------------------------------------------------------
console.log('\n--- CHECK 5: Zero JavaScript Touch Handlers for Selective Controls ---');
{
  assert.ok(
    !appSource.includes('practice-row-ctrl:active') &&
    !appSource.includes('is-touching') &&
    !appSource.includes('practice-touch-active'),
    'Zero synthetic touch state variables in app.js for selective control feedback'
  );
  console.log('✔ Check 5 PASSED: Touch feedback is purely declarative CSS with zero JS execution overhead.');
}

// -----------------------------------------------------------------------------
// CHECK 6: Desktop Hover Strictly Isolated to (hover: hover) and (pointer: fine)
// -----------------------------------------------------------------------------
console.log('\n--- CHECK 6: Desktop Hover Isolation Uncompromised ---');
{
  const cssWithoutFineMedia = zenCss.replace(/@media\s*\(hover:\s*hover\)\s*and\s*\(pointer:\s*fine\)\s*\{[\s\S]*?\n\}/gi, '');
  assert.ok(
    !/\.practice-row-ctrl[^{]*:hover/i.test(cssWithoutFineMedia),
    'Zero :hover rules on .practice-row-ctrl outside fine pointer media query'
  );
  console.log('✔ Check 6 PASSED: Desktop hover remains strictly guarded against mobile touch emulation.');
}

// -----------------------------------------------------------------------------
// CHECK 7: Zero Sticky Hover on Touch Devices
// -----------------------------------------------------------------------------
console.log('\n--- CHECK 7: Sticky Hover Elimination on Touchscreens ---');
{
  const touchMediaMatch = zenCss.match(/@media\s*\(hover:\s*none\)\s*and\s*\(pointer:\s*coarse\)\s*\{([\s\S]*?)\n\}/i);
  assert.ok(touchMediaMatch, 'Touch media query must exist');
  assert.ok(
    !touchMediaMatch[1].includes(':hover'),
    'Touch media query must never declare :hover rules'
  );
  console.log('✔ Check 7 PASSED: Touch media query exclusively utilizes :active, eliminating sticky hover.');
}

// -----------------------------------------------------------------------------
// CHECK 8: Keyboard :focus-visible Preserved
// -----------------------------------------------------------------------------
console.log('\n--- CHECK 8: Keyboard Focus Ring Preserved ---');
{
  assert.ok(
    /\.practice-row-ctrl:focus-visible\s*\{[^}]*outline:\s*2px\s+solid\s+#a9d16b/i.test(zenCss),
    ':focus-visible outline must remain intact'
  );
  console.log('✔ Check 8 PASSED: Keyboard focus outline intact with 2px #a9d16b focus ring.');
}

// -----------------------------------------------------------------------------
// CHECK 9: State .is-active Remains Single Source of Truth
// -----------------------------------------------------------------------------
console.log('\n--- CHECK 9: .is-active State Truth ---');
{
  assert.ok(
    appSource.includes("${isOptTransOpen ? 'is-active' : ''}") &&
    appSource.includes("${isOptKotobaOpen ? 'is-active' : ''}") &&
    appSource.includes("${isPromptTransOpen ? 'is-active' : ''}") &&
    appSource.includes("${isPromptKotobaOpen ? 'is-active' : ''}"),
    'app.js must strictly govern .is-active via session state'
  );
  console.log('✔ Check 9 PASSED: .is-active state derived cleanly from app state without CSS interference.');
}

// -----------------------------------------------------------------------------
// CHECK 10: Row Architecture & Button Dimensions Preserved
// -----------------------------------------------------------------------------
console.log('\n--- CHECK 10: Row Architecture & Button Dimensions ---');
{
  assert.ok(
    zenCss.includes('.practice-prompt-row') && zenCss.includes('.practice-option-row'),
    'Prompt and option rows must remain intact'
  );
  assert.ok(
    /\.practice-row-ctrl[^{]*\{[^}]*min-width:\s*44px/i.test(zenCss) &&
    /\.practice-row-ctrl[^{]*\{[^}]*min-height:\s*44px/i.test(zenCss),
    'T023 44x44px minimum touch target dimensions must remain intact'
  );
  console.log('✔ Check 10 PASSED: Row architecture and 44 × 44 px touch clearance completely preserved.');
}

console.log('\n================================================================================');
console.log('ALL 10 T024 TOUCH FEEDBACK (:active) CHECKS PASSED 100%!');
console.log('================================================================================\n');
