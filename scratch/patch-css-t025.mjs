// scratch/patch-css-t025.mjs
import fs from 'node:fs';

const cssPath = 'ZEN-APP-SHELL.css';
let cssContent = fs.readFileSync(cssPath, 'utf8');

const t025CSS = `
/* ==========================================================================
   FEATURE 008: Vertical Content Stacking & Minimalist Kotoba List (Task T025)
   ========================================================================== */
.practice-prompt-center {
  display: flex !important;
  flex-direction: column !important;
}

.practice-kotoba-list {
  display: flex !important;
  flex-direction: column !important;
  gap: 4px !important;
  margin-top: 6px !important;
  padding-top: 6px !important;
  border-top: 1px dashed #d5dce2 !important;
  font-size: 12px !important;
  line-height: 1.5 !important;
  width: 100% !important;
  box-sizing: border-box !important;
}

.practice-kotoba-item {
  display: flex !important;
  align-items: baseline !important;
  gap: 8px !important;
  flex-wrap: wrap !important;
  min-width: 0 !important;
}

.kotoba-term-wrap {
  font-weight: 700 !important;
  color: #1a232c !important;
  flex-shrink: 0 !important;
}

.kotoba-separator {
  color: #8c9ba5 !important;
  flex-shrink: 0 !important;
}

.kotoba-meaning {
  color: #4b5863 !important;
  font-weight: 400 !important;
  min-width: 0 !important;
  word-break: break-word !important;
  overflow-wrap: break-word !important;
}
`;

const isCRLF = cssContent.includes('\r\n');
const formattedT025 = isCRLF ? t025CSS.replace(/\n/g, '\r\n') : t025CSS;

cssContent = cssContent.trimEnd() + (isCRLF ? '\r\n' : '\n') + formattedT025.trimStart();
fs.writeFileSync(cssPath, cssContent, 'utf8');
console.log('Successfully patched ZEN-APP-SHELL.css with T025 vertical stacking & kotoba list rules');
