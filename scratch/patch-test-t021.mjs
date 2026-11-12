import fs from 'fs';
import path from 'path';

const testPath = path.resolve('tests/test-practice-selective-kotoba.mjs');
let content = fs.readFileSync(testPath, 'utf8');

const normalize = s => s.replace(/\r\n/g, '\n');
const isCRLF = content.includes('\r\n');
let normalizedContent = normalize(content);

const targetBlock = `console.log('\\nProduction Readiness & Phase 5 Contract Inspection:');
console.log(\`  • T020 Ruby Markup <ruby class="kotoba-ruby">:           \${hasKotobaRubyMarkup ? 'MOUNTED & VERIFIED' : 'PENDING'}\`);
console.log(\`  • Upstream general rule in RICH-HTML-STYLES.css:    \${hasGeneralRubyCss ? 'ACTIVE (Covers all ruby rt)' : 'NOT_FOUND'}\`);
console.log(\`  • T021 Dedicated Rule in ZEN-APP-SHELL.css:        \${hasDedicatedKotobaCssInAppShell ? 'MOUNTED' : 'PENDING_IMPLEMENTATION (T021)'}\`);

assert.ok(hasKotobaRubyMarkup, 'T020 markup requirement verified in app.js');
console.log('✓ Criterion 7.8: Phase 5 component readiness accurately verified without false completion claims');`;

const newBlock = `console.log('\\nProduction Readiness & Phase 5 Contract Inspection:');
console.log(\`  • T020 Ruby Markup <ruby class="kotoba-ruby">:           \${hasKotobaRubyMarkup ? 'MOUNTED & VERIFIED' : 'PENDING'}\`);
console.log(\`  • Upstream general rule in RICH-HTML-STYLES.css:    \${hasGeneralRubyCss ? 'ACTIVE (Covers all ruby rt)' : 'NOT_FOUND'}\`);
console.log(\`  • T021 Dedicated Rule in ZEN-APP-SHELL.css:        \${hasDedicatedKotobaCssInAppShell ? 'MOUNTED & VERIFIED' : 'PENDING_IMPLEMENTATION (T021)'}\`);

assert.ok(hasKotobaRubyMarkup, 'T020 markup requirement verified in app.js');
assert.ok(hasDedicatedKotobaCssInAppShell, 'T021 dedicated CSS rule in ZEN-APP-SHELL.css must be mounted');
console.log('✓ Criterion 7.8: Phase 5 component readiness accurately verified (T020 & T021 complete)');`;

normalizedContent = normalizedContent.replace(normalize(targetBlock), normalize(newBlock));

const targetSummary = `  7. Task T019: Furigana Synchronization Tests:   VERIFIED (100% PASSED)
  8. Task T020: Ruby Rendering for Furigana:      VERIFIED (100% PASSED)
================================================================================`;

const newSummary = `  7. Task T019: Furigana Synchronization Tests:   VERIFIED (100% PASSED)
  8. Task T020: Ruby Rendering for Furigana:      VERIFIED (100% PASSED)
  9. Task T021: Dedicated Kotoba Furigana CSS:    VERIFIED (100% PASSED)
================================================================================`;

normalizedContent = normalizedContent.replace(normalize(targetSummary), normalize(newSummary));

const finalContent = isCRLF ? normalizedContent.replace(/\n/g, '\r\n') : normalizedContent;
fs.writeFileSync(testPath, finalContent, 'utf8');
console.log('SUCCESS: tests/test-practice-selective-kotoba.mjs patched for T021');
