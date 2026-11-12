import fs from 'fs';
import path from 'path';

const cssPath = path.resolve('ZEN-APP-SHELL.css');
let content = fs.readFileSync(cssPath, 'utf8');

const isCRLF = content.includes('\r\n');
const normalize = s => s.replace(/\r\n/g, '\n');
let normalizedContent = normalize(content);

const t022CssRules = `
/* ==========================================================================
   FEATURE 008: 3-Column Sibling Grid Layout (Task T022)
   ========================================================================== */
.practice-prompt-row,
.practice-option-row {
  display: grid !important;
  grid-template-columns: 44px minmax(0, 1fr) 44px !important;
  gap: 10px !important;
  align-items: stretch !important;
  width: 100% !important;
  box-sizing: border-box !important;
}

.practice-prompt-center {
  min-width: 0 !important;
  width: 100% !important;
}

.practice-option-row .answer-choice {
  min-width: 0 !important;
  width: 100% !important;
  margin: 0 !important;
}
`;

if (normalizedContent.includes('.practice-prompt-row,') && normalizedContent.includes('grid-template-columns: 44px minmax(0, 1fr) 44px')) {
  console.log('T022 grid rules already exist in ZEN-APP-SHELL.css');
} else {
  normalizedContent = normalizedContent.trimEnd() + '\n' + normalize(t022CssRules);
  const finalContent = isCRLF ? normalizedContent.replace(/\n/g, '\r\n') : normalizedContent;
  fs.writeFileSync(cssPath, finalContent, 'utf8');
  console.log('SUCCESS: Added T022 3-column grid rules to ZEN-APP-SHELL.css');
}
