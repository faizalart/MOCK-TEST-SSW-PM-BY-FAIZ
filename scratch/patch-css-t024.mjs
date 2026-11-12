// scratch/patch-css-t024.mjs
import fs from 'node:fs';

const cssPath = 'ZEN-APP-SHELL.css';
let cssContent = fs.readFileSync(cssPath, 'utf8');

const t024CSS = `
/* ==========================================================================
   FEATURE 008: Touch Feedback & Accidental Hover Prevention (Task T024)
   ========================================================================== */
.practice-row-ctrl:active {
  background: rgba(169, 209, 107, 0.22) !important;
}

.practice-row-ctrl:active:not(.is-active) {
  background: rgba(169, 209, 107, 0.22) !important;
  border-color: #a9d16b !important;
  color: #36611c !important;
}

.practice-row-ctrl.is-active:active {
  background: rgba(169, 209, 107, 0.32) !important;
  border-color: #8bb850 !important;
  color: #2e5912 !important;
}

@media (hover: none) and (pointer: coarse) {
  .practice-row-ctrl:active:not(.is-active) {
    background: rgba(169, 209, 107, 0.22) !important;
    border-color: #a9d16b !important;
    color: #36611c !important;
  }

  .practice-row-ctrl.is-active:active {
    background: rgba(169, 209, 107, 0.32) !important;
    border-color: #8bb850 !important;
    color: #2e5912 !important;
  }
}
`;

const isCRLF = cssContent.includes('\r\n');
const formattedT024 = isCRLF ? t024CSS.replace(/\n/g, '\r\n') : t024CSS;

cssContent = cssContent.trimEnd() + (isCRLF ? '\r\n' : '\n') + formattedT024.trimStart();
fs.writeFileSync(cssPath, cssContent, 'utf8');
console.log('Successfully patched ZEN-APP-SHELL.css with T024 touch feedback rules');
