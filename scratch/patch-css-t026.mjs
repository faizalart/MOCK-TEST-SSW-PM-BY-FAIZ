// scratch/patch-css-t026.mjs
import fs from 'node:fs';

const cssPath = 'ZEN-APP-SHELL.css';
let cssContent = fs.readFileSync(cssPath, 'utf8');

const t026CSS = `
/* ==========================================================================
   FEATURE 008: EDRDG / JMdict Attribution Section in Settings (Task T026)
   ========================================================================== */
.exam-settings-popover {
  max-height: calc(100vh - 70px) !important;
  display: flex !important;
  flex-direction: column !important;
}

.exam-settings-body {
  overflow-y: auto !important;
  max-height: calc(100vh - 160px) !important;
  overscroll-behavior: contain !important;
}

.exam-attribution-section {
  padding-top: 4px;
}

.exam-attribution-body {
  font-size: 11px;
  line-height: 1.5;
  color: #556575;
  margin-top: 6px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  padding: 8px 10px;
}

.exam-attribution-lead {
  margin: 0 0 6px 0;
  color: #334155;
}

.exam-attribution-detail {
  margin: 0;
  color: #64748b;
  font-size: 10px;
  line-height: 1.45;
}

.exam-attribution-body a {
  color: #446616;
  text-decoration: underline;
  font-weight: 600;
}

.exam-attribution-body a:hover {
  color: #638c29;
}
`;

const isCRLF = cssContent.includes('\r\n');
const formattedT026 = isCRLF ? t026CSS.replace(/\n/g, '\r\n') : t026CSS;

cssContent = cssContent.trimEnd() + (isCRLF ? '\r\n' : '\n') + formattedT026.trimStart();
fs.writeFileSync(cssPath, cssContent, 'utf8');
console.log('Successfully patched ZEN-APP-SHELL.css with T026 attribution styles');
