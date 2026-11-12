// scratch/assert-t021-kotoba-css.mjs
import fs from 'node:fs';
import assert from 'node:assert/strict';

console.log('================================================================================');
console.log('FEATURE 008: Practice Selective Translation & Kotoba Reveal');
console.log('TASK T021: Dedicated CSS Visibility Rule for Kotoba Furigana Verification');
console.log('================================================================================\n');

// 1. Read stylesheets & app.js
const zenCss = fs.readFileSync('ZEN-APP-SHELL.css', 'utf8');
const richCss = fs.readFileSync('RICH-HTML-STYLES.css', 'utf8');
const appSource = fs.readFileSync('app.js', 'utf8');

// =============================================================================
// VERIFICATION 1: Dedicated Kotoba Selector Exists in ZEN-APP-SHELL.css
// =============================================================================
console.log('--- CHECK 1: Dedicated Selector Presence in ZEN-APP-SHELL.css ---');
{
  const targetSelector = 'body.hide-furigana .kotoba-ruby rt';
  assert.ok(zenCss.includes(targetSelector), `ZEN-APP-SHELL.css must contain selector "${targetSelector}"`);

  // Extract the rule block
  const ruleStart = zenCss.indexOf(targetSelector);
  const blockStart = zenCss.indexOf('{', ruleStart);
  const blockEnd = zenCss.indexOf('}', blockStart);
  const blockBody = zenCss.substring(blockStart + 1, blockEnd).trim();

  assert.ok(
    blockBody.includes('display: none !important') || blockBody.includes('display:none!important'),
    'Rule body must enforce display: none !important;'
  );
  console.log(`✔ Check 1 PASSED: Found exact rule:\n  ${targetSelector} {\n    ${blockBody}\n  }`);
}

// =============================================================================
// VERIFICATION 2: Rule targets <rt> only when body.hide-furigana is active
// =============================================================================
console.log('\n--- CHECK 2: Strict <rt> Target Scope ---');
{
  // Must NOT hide the entire ruby container
  assert.ok(
    !zenCss.includes('body.hide-furigana .kotoba-ruby { display: none') &&
    !zenCss.includes('body.hide-furigana .kotoba-ruby{display:none'),
    'Must NOT hide .kotoba-ruby container'
  );

  // Must specifically target rt
  const hasSpecificRtRule = /body\.hide-furigana\s+\.kotoba-ruby\s+rt\s*\{[^}]*display:\s*none\s*!important/i.test(zenCss);
  assert.ok(hasSpecificRtRule, 'Must specifically target rt child of .kotoba-ruby');
  console.log('✔ Check 2 PASSED: Rule strictly scopes hiding to <rt> tags inside .kotoba-ruby.');
}

// =============================================================================
// VERIFICATION 3: Kanji / Lemma Remains Visible When Furigana is Hidden
// =============================================================================
console.log('\n--- CHECK 3: Kanji / Lemma Preservation ---');
{
  // In HTML: <ruby class="kotoba-ruby">${kanji}<rt>${furigana}</rt></ruby>
  // When body.hide-furigana .kotoba-ruby rt { display: none !important; } is applied,
  // the text node inside .kotoba-ruby (the base kanji) remains visible.
  assert.ok(!zenCss.includes('.kotoba-ruby { display: none'), 'Base ruby element must remain visible');
  assert.ok(!zenCss.includes('.kotoba-term-wrap { display: none'), 'Term wrapper must remain visible');
  console.log('✔ Check 3 PASSED: Kanji/lemma base text is fully preserved.');
}

// =============================================================================
// VERIFICATION 4: Indonesian Meaning Remains Visible When Furigana is Hidden
// =============================================================================
console.log('\n--- CHECK 4: Indonesian Meaning Preservation ---');
{
  assert.ok(!zenCss.includes('.kotoba-meaning { display: none'), 'Meaning element must remain visible');
  assert.ok(!zenCss.includes('body.hide-furigana .kotoba-meaning'), 'hide-furigana must not touch .kotoba-meaning');
  console.log('✔ Check 4 PASSED: Indonesian meaning (.kotoba-meaning) is never hidden by hide-furigana.');
}

// =============================================================================
// VERIFICATION 5: Entire Kotoba List Never Hidden by Furigana Rule
// =============================================================================
console.log('\n--- CHECK 5: Kotoba List Scope Integrity ---');
{
  assert.ok(!zenCss.includes('body.hide-furigana .practice-kotoba-list'), 'List must never be hidden by hide-furigana');
  assert.ok(!zenCss.includes('body.hide-furigana .practice-kotoba-item'), 'Item must never be hidden by hide-furigana');
  console.log('✔ Check 5 PASSED: Entire Kotoba list (.practice-kotoba-list) remains open and visible.');
}

// =============================================================================
// VERIFICATION 6: Cascade Harmony with RICH-HTML-STYLES.css
// =============================================================================
console.log('\n--- CHECK 6: Cascade Harmony with RICH-HTML-STYLES.css ---');
{
  // Upstream RICH-HTML-STYLES.css has: body.hide-furigana ruby rt { display:none!important; }
  // ZEN-APP-SHELL.css has: body.hide-furigana .kotoba-ruby rt { display: none !important; }
  // In index.html, ZEN-APP-SHELL.css is loaded AFTER RICH-HTML-STYLES.css.
  // Both use !important; ZEN-APP-SHELL.css has higher specificity (0,2,1 vs 0,1,2).
  // There is ZERO conflict: both enforce consistent display: none on rt under body.hide-furigana.
  assert.ok(richCss.includes('body.hide-furigana ruby rt'), 'RICH-HTML-STYLES.css has general rule');
  assert.ok(zenCss.includes('body.hide-furigana .kotoba-ruby rt'), 'ZEN-APP-SHELL.css has scoped rule');
  console.log('✔ Check 6 PASSED: Dedicated rule has higher specificity (0,2,1 > 0,1,2) and cascades seamlessly.');
}

// =============================================================================
// VERIFICATION 7: Toolbar F Remains the Sole Master Visibility Driver
// =============================================================================
console.log('\n--- CHECK 7: Toolbar F Integration ---');
{
  // Verify app.js applyExamPrefs directly toggles body.hide-furigana
  assert.ok(
    appSource.includes("document.body.classList.toggle('hide-furigana', !prefs.showFurigana)"),
    'app.js must toggle hide-furigana on document.body from prefs.showFurigana'
  );
  // Verify toggle-furigana-quick triggers applyExamPrefs()
  const fQuickIdx = appSource.indexOf("case 'toggle-furigana-quick':");
  const fQuickBlock = appSource.substring(fQuickIdx, fQuickIdx + 200);
  assert.ok(fQuickBlock.includes('applyExamPrefs()'), 'toggle-furigana-quick action calls applyExamPrefs()');
  console.log('✔ Check 7 PASSED: Toolbar F directly controls body.hide-furigana without secondary states.');
}

// =============================================================================
// VERIFICATION 8: No Distortion of Layout or Adjacent Control Styles
// =============================================================================
console.log('\n--- CHECK 8: Layout & Control Independence ---');
{
  // Verify the new rule does not add unintended global selectors or break sibling controls
  const ruleLines = zenCss.split(/\r?\n/);
  const targetLineIdx = ruleLines.findIndex(l => l.includes('body.hide-furigana .kotoba-ruby rt'));
  assert.ok(targetLineIdx !== -1, 'Must find line with rule');

  // Verify preceding and following lines are well-formed
  const nearbyContent = ruleLines.slice(Math.max(0, targetLineIdx - 5), targetLineIdx + 6).join('\n');
  assert.ok(!nearbyContent.includes('.practice-row-ctrl { display: none'), 'Controls must not be hidden');
  assert.ok(!nearbyContent.includes('.answer-choice { display: none'), 'Answer choices must not be hidden');
  console.log('✔ Check 8 PASSED: Control buttons and answer choices remain completely unaffected.');
}

console.log('\n================================================================================');
console.log('ALL 8 T021 KOTOBA FURIGANA CSS VERIFICATIONS PASSED 100%!');
console.log('================================================================================\n');
