import fs from 'fs';
import path from 'path';

const cssPath = path.resolve('ZEN-APP-SHELL.css');
let content = fs.readFileSync(cssPath, 'utf8');

const isCRLF = content.includes('\r\n');
const normalize = s => s.replace(/\r\n/g, '\n');
let normalizedContent = normalize(content);

const t021CssRule = `
/* ==========================================================================
   FEATURE 008: Kotoba Furigana Visibility Synchronization with Toolbar F (Task T021)
   ========================================================================== */
body.hide-furigana .kotoba-ruby rt {
  display: none !important;
}
`;

if (normalizedContent.includes('body.hide-furigana .kotoba-ruby rt')) {
  console.log('Rule already exists in ZEN-APP-SHELL.css');
} else {
  normalizedContent = normalizedContent.trimEnd() + '\n' + normalize(t021CssRule);
  const finalContent = isCRLF ? normalizedContent.replace(/\n/g, '\r\n') : normalizedContent;
  fs.writeFileSync(cssPath, finalContent, 'utf8');
  console.log('SUCCESS: Added T021 Kotoba furigana rule to ZEN-APP-SHELL.css');
}
