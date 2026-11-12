// scratch/test-popover-display.mjs
import fs from 'fs';

const zenCss = fs.readFileSync('ZEN-APP-SHELL.css', 'utf8');

// Check the rule in ZEN-APP-SHELL.css
console.log('--- Inspecting .exam-settings-popover in ZEN-APP-SHELL.css ---');
const idx = zenCss.indexOf('.exam-settings-popover {');
console.log(zenCss.substring(idx, idx + 200));

// If .exam-settings-popover has display: flex !important without [hidden] or :not(.is-open) guard:
const hasUnconditionalDisplayFlex = zenCss.includes('.exam-settings-popover {\n  max-height: calc(100vh - 70px) !important;\n  display: flex !important;');
console.log('\nHas unconditional display: flex !important:', hasUnconditionalDisplayFlex);
