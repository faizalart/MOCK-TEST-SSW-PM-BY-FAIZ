// scratch/patch-css-t023.mjs
import fs from 'node:fs';

const cssPath = 'ZEN-APP-SHELL.css';
let cssContent = fs.readFileSync(cssPath, 'utf8');

const t023CSS = `
/* ==========================================================================
   FEATURE 008: Control Buttons & Desktop Hover Styling (Task T023)
   ========================================================================== */
.practice-row-ctrl,
.practice-ctrl-trans,
.practice-ctrl-kotoba {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 44px !important;
  min-width: 44px !important;
  min-height: 44px !important;
  padding: 0 !important;
  box-sizing: border-box !important;
  background: transparent !important;
  border: 1px solid #cfd7de !important;
  border-radius: 4px !important;
  color: #6c7883 !important;
  cursor: pointer !important;
  transition: background 0.12s ease, color 0.12s ease, border-color 0.12s ease !important;
  box-shadow: none !important;
}

.practice-row-ctrl .practice-ctrl-icon {
  width: 16px !important;
  height: 16px !important;
  min-width: 16px !important;
  min-height: 16px !important;
  max-width: 16px !important;
  max-height: 16px !important;
  display: block !important;
  stroke: currentColor !important;
  fill: none !important;
  flex-shrink: 0 !important;
  pointer-events: none;
}

.practice-row-ctrl:focus-visible {
  outline: 2px solid #a9d16b !important;
  outline-offset: 2px !important;
}

.practice-row-ctrl.is-active {
  background: rgba(169, 209, 107, 0.18) !important;
  border-color: #a9d16b !important;
  color: #2e5912 !important;
}

@media (hover: hover) and (pointer: fine) {
  .practice-row-ctrl:hover:not(.is-active) {
    background: rgba(169, 209, 107, 0.12) !important;
    border-color: #a9d16b !important;
    color: #477d25 !important;
  }

  .practice-row-ctrl.is-active:hover {
    background: rgba(169, 209, 107, 0.26) !important;
    border-color: #92b85c !important;
  }
}
`;

const isCRLF = cssContent.includes('\r\n');
const formattedT023 = isCRLF ? t023CSS.replace(/\n/g, '\r\n') : t023CSS;

cssContent = cssContent.trimEnd() + (isCRLF ? '\r\n' : '\n') + formattedT023.trimStart();
fs.writeFileSync(cssPath, cssContent, 'utf8');
console.log('Successfully patched ZEN-APP-SHELL.css with T023 rules');
