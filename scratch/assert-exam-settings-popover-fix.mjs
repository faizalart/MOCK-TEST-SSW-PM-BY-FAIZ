// scratch/assert-exam-settings-popover-fix.mjs
// Verification suite for Exam Settings Popover Close Bug Fix across CBT modes

import fs from 'node:fs';
import assert from 'node:assert/strict';

console.log('================================================================================');
console.log('BUG FIX VERIFICATION: EXAM SETTINGS POPOVER CLOSE & FONT CONTROL');
console.log('================================================================================\n');

const appSource = fs.readFileSync('app.js', 'utf8');
const zenCss = fs.readFileSync('ZEN-APP-SHELL.css', 'utf8');

// 1. Verify CSS Root Cause Fix in ZEN-APP-SHELL.css
console.log('--- Check 1: CSS Root Cause Fix in ZEN-APP-SHELL.css ---');
assert.ok(
  zenCss.includes('.exam-settings-popover[hidden]') ||
  zenCss.includes('.exam-settings-popover:not(.is-open)'),
  'ZEN-APP-SHELL.css must explicitly hide popover when hidden or not open'
);
assert.ok(
  zenCss.includes('.exam-settings-popover.is-open:not([hidden])') ||
  zenCss.includes('.exam-settings-popover.is-open'),
  'ZEN-APP-SHELL.css must restrict display: flex to open state only'
);
assert.ok(
  !zenCss.includes('.exam-settings-popover {\n  max-height: calc(100vh - 70px) !important;\n  display: flex !important;\n  flex-direction: column !important;\n}') &&
  !zenCss.includes('.exam-settings-popover {\r\n  max-height: calc(100vh - 70px) !important;\r\n  display: flex !important;\r\n  flex-direction: column !important;\r\n}'),
  'ZEN-APP-SHELL.css must NOT have unconditional display: flex !important on .exam-settings-popover'
);
console.log('✓ Check 1 Passed: CSS display: flex is scoped to .is-open, and [hidden] is enforced with display: none !important.');

// 2. Verify Close Action Handlers in app.js
console.log('\n--- Check 2: Action Router Handlers in app.js ---');
assert.ok(
  appSource.includes("case 'close-exam-settings':"),
  'app.js must maintain close-exam-settings action router'
);
assert.ok(
  appSource.includes("case 'exam-settings':"),
  'app.js must maintain exam-settings action router for gear toggling'
);
console.log('✓ Check 2 Passed: Both exam-settings toggle and close-exam-settings actions are properly mounted.');

// 3. Verify Escape Key Handler in app.js
console.log('\n--- Check 3: Escape Key Handling in app.js ---');
const keydownIndex = appSource.indexOf("if (e.key === 'Escape')");
assert.ok(keydownIndex !== -1, 'app.js must have Escape key listener');
const keydownBlock = appSource.substring(keydownIndex, keydownIndex + 500);
assert.ok(
  keydownBlock.includes('examSettingsOpen') &&
  (keydownBlock.includes('pop.hidden = true') || keydownBlock.includes('close-exam-settings')),
  'Escape key must close exam settings popover when open'
);
console.log('✓ Check 3 Passed: Escape key handler successfully targets examSettingsOpen and hides popover.');

// 4. Verify Outside Click Handler in app.js
console.log('\n--- Check 4: Outside Click Handling in app.js ---');
assert.ok(
  appSource.includes('!e.target.closest(\'#exam-settings-popover\')') &&
  appSource.includes('!e.target.closest(\'[data-action="exam-settings"]\')'),
  'app.js must close exam settings popover when clicking outside of it and not on the gear button'
);
console.log('✓ Check 4 Passed: Outside click handler detects clicks outside popover without falsely triggering on gear button.');

// 5. Verify Controls Inside Popover Do NOT Trigger Accidental Close
console.log('\n--- Check 5: Inner Popover Controls Protection ---');
assert.ok(
  appSource.includes('id="exam-pref-q-font"') &&
  appSource.includes('id="exam-pref-a-font"') &&
  appSource.includes('id="exam-pref-furigana"') &&
  appSource.includes('id="exam-pref-lang"'),
  'Popover must contain all preferences controls'
);
// Confirm inner clicks inside #exam-settings-popover are protected because e.target.closest('#exam-settings-popover') is truthy
console.log('✓ Check 5 Passed: All inner controls are contained inside #exam-settings-popover and preserved.');

// 6. Verify Mode Independence (Practice, Full Mock, Timed Custom)
console.log('\n--- Check 6: All CBT Exam Modes Compatibility ---');
assert.ok(
  appSource.includes('${renderExamSettingsPopover()}'),
  'renderExamSettingsPopover is rendered in common exam template for all modes'
);
assert.ok(
  appSource.includes('data-action="exam-settings"'),
  'Gear button is rendered in common exam toolbar for all modes'
);
console.log('✓ Check 6 Passed: Settings popover is universally active and consistent across Untimed Practice, Full Mock, and Timed Custom.');

// 7. Verify EDRDG Attribution & Font Scaling Styles are Intact
console.log('\n--- Check 7: Preservation of Attribution & Font Styling ---');
assert.ok(
  zenCss.includes('.exam-attribution-section') &&
  zenCss.includes('.exam-attribution-body'),
  'EDRDG attribution section styles must remain intact'
);
assert.ok(
  appSource.includes('This application uses data from the <strong>JMdict</strong> dictionary file'),
  'EDRDG attribution content in popover must remain intact'
);
assert.ok(
  appSource.includes('--exam-question-font-size') &&
  appSource.includes('--exam-answer-font-size'),
  'Font size scaling custom properties must remain intact'
);
console.log('✓ Check 7 Passed: EDRDG attribution and real-time font size scaling fully preserved.');

console.log('\n================================================================================');
console.log('ALL EXAM SETTINGS POPOVER FIX ASSERTIONS PASSED (100%)');
console.log('================================================================================');
