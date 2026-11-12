// scratch/patch-test-t025.mjs
import fs from 'node:fs';

let testSource = fs.readFileSync('tests/test-practice-selective-kotoba.mjs', 'utf8');

const targetStr = '// -----------------------------------------------------------------------------\r\n// 12. Test Harness Summary';
const targetStrAlt = '// -----------------------------------------------------------------------------\n// 12. Test Harness Summary';

const isCRLF = testSource.includes('\r\n');
const target = testSource.includes(targetStr) ? targetStr : targetStrAlt;

if (!testSource.includes(target)) {
  console.error('Target not found in tests/test-practice-selective-kotoba.mjs!');
  process.exit(1);
}

const p12Code = `// -----------------------------------------------------------------------------
// 12. User Story 4: Vertical Content Stacking Order (Task T025)
// -----------------------------------------------------------------------------
console.log('\\n--- User Story 4: Vertical Content Stacking Order (T025) ---');

// 12.1 Prompt Row DOM Order: Japanese -> Translation -> Kotoba
const pCenterIdx = normAppSource.indexOf('<div class="practice-prompt-center">');
assert.ok(pCenterIdx !== -1, 'app.js must render <div class="practice-prompt-center">');
const pCenterEnd = normAppSource.indexOf('</div>', normAppSource.indexOf('practice-kotoba-list', pCenterIdx));
const pCenterSlice = normAppSource.substring(pCenterIdx, pCenterEnd + 200);

const pPosJa = pCenterSlice.indexOf('question-prompt');
const pPosTrans = pCenterSlice.indexOf('practice-question-translation');
const pPosKotoba = pCenterSlice.indexOf('practice-kotoba-list');

assert.ok(pPosJa < pPosTrans, 'Prompt Japanese text must precede Indonesian translation');
assert.ok(pPosTrans < pPosKotoba, 'Prompt Indonesian translation must precede Kotoba list');
console.log('✓ Criterion 12.1: Prompt row DOM order strictly verified: Japanese -> Translation -> Kotoba');

// 12.2 Option Row DOM Order: Japanese -> Translation -> Kotoba
const oContentIdx = normAppSource.indexOf('<div class="answer-content">');
assert.ok(oContentIdx !== -1, 'app.js must render <div class="answer-content">');
const oContentEnd = normAppSource.indexOf('<span class="answer-radio"', oContentIdx);
const oContentSlice = normAppSource.substring(oContentIdx, oContentEnd);

const oPosJa = oContentSlice.indexOf('answer-text');
const oPosTrans = oContentSlice.indexOf('practice-option-translation');
const oPosKotoba = oContentSlice.indexOf('practice-kotoba-list');

assert.ok(oPosJa < oPosTrans, 'Option Japanese text must precede Indonesian translation');
assert.ok(oPosTrans < oPosKotoba, 'Option Indonesian translation must precede Kotoba list');
console.log('✓ Criterion 12.2: Option row DOM order strictly verified: Japanese -> Translation -> Kotoba');

// 12.3 CSS Vertical Flex-Column Stacking Rules
assert.ok(
  zenCssSource.includes('.practice-prompt-center') &&
  /\\.practice-prompt-center[^{]*\\{[^}]*display:\\s*flex/i.test(zenCssSource) &&
  /\\.practice-prompt-center[^{]*\\{[^}]*flex-direction:\\s*column/i.test(zenCssSource),
  '.practice-prompt-center must be configured with flex-direction: column'
);
assert.ok(
  zenCssSource.includes('.exam-workspace .answer-content') &&
  /\\.exam-workspace\\s+\\.answer-content[^{]*\\{[^}]*display:\\s*flex/i.test(zenCssSource) &&
  /\\.exam-workspace\\s+\\.answer-content[^{]*\\{[^}]*flex-direction:\\s*column/i.test(zenCssSource),
  '.answer-content must be configured with flex-direction: column'
);
assert.ok(
  zenCssSource.includes('.practice-kotoba-list') &&
  /\\.practice-kotoba-list[^{]*\\{[^}]*border-top:\\s*1px\\s+dashed\\s+#d5dce2/i.test(zenCssSource),
  '.practice-kotoba-list must feature 1px dashed separator'
);
console.log('✓ Criterion 12.3: Pure vertical flex-column flow guaranteed with subtle dashed dividers');

// 12.4 Dynamic DOM Lifecycle (Zero Phantom Whitespace When Closed)
assert.ok(
  normAppSource.includes("isPromptTransOpen && promptTrans ?") &&
  normAppSource.includes("isOptTransOpen && optTrans ?") &&
  normAppSource.includes("isPromptKotobaOpen && resolvedPromptKotoba.length ?") &&
  normAppSource.includes("isOptKotobaOpen && resolvedOptKotoba.length ?"),
  'Closed sections must evaluate to empty string, avoiding ghost DOM nodes'
);
console.log('✓ Criterion 12.4: Zero phantom whitespace or placeholder artifacts when controls are OFF');

// -----------------------------------------------------------------------------
// 13. Test Harness Summary`;

const formattedP12 = isCRLF ? p12Code.replace(/\n/g, '\r\n') : p12Code;
testSource = testSource.replace(target, formattedP12);

const sumOld = "console.log(' 12. Task T024: Touch Feedback (:active):      VERIFIED (100% PASSED)');";
const sumOldCRLF = "console.log(' 12. Task T024: Touch Feedback (:active):      VERIFIED (100% PASSED)');\r\n";
const sumOldLF = "console.log(' 12. Task T024: Touch Feedback (:active):      VERIFIED (100% PASSED)');\n";

const sumAddition = "console.log(' 13. Task T025: Vertical Content Stacking:     VERIFIED (100% PASSED)');";

if (testSource.includes(sumOldCRLF)) {
  testSource = testSource.replace(sumOldCRLF, sumOldCRLF + "console.log(' 13. Task T025: Vertical Content Stacking:     VERIFIED (100% PASSED)');\r\n");
} else if (testSource.includes(sumOldLF)) {
  testSource = testSource.replace(sumOldLF, sumOldLF + "console.log(' 13. Task T025: Vertical Content Stacking:     VERIFIED (100% PASSED)');\n");
} else if (testSource.includes(sumOld)) {
  testSource = testSource.replace(sumOld, sumOld + '\n' + sumAddition);
}

fs.writeFileSync('tests/test-practice-selective-kotoba.mjs', testSource, 'utf8');
console.log('Successfully patched tests/test-practice-selective-kotoba.mjs with T025 suite');
