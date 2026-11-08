import fs from 'fs';

// 1. ZEN-APP-SHELL.css
let shellCss = fs.readFileSync('ZEN-APP-SHELL.css', 'utf8');

shellCss = shellCss.replace(
  `body:not(.exam-mode) #global-lang-select.lang-select {
  min-height: 34px !important;
  height: 34px !important;
  padding: 0 30px 0 14px !important;
  font-family: var(--zen-font) !important;
  font-size: 12px !important;
  font-weight: 600 !important;
  color: var(--zen-ink) !important;
  background-color: rgba(255, 255, 255, 0.90) !important;
  border: 1px solid var(--zen-line-strong) !important;
  border-radius: var(--zen-radius-pill) !important;
  transition: border-color 0.16s var(--zen-ease), background-color 0.16s var(--zen-ease);
}`,
  `body:not(.exam-mode) #global-lang-select.lang-select {
  min-height: 34px !important;
  height: 34px !important;
  width: auto !important;
  min-width: 52px !important;
  padding: 0 22px 0 10px !important;
  font-family: var(--zen-font), -apple-system, BlinkMacSystemFont, "Segoe UI Emoji", "Apple Color Emoji", sans-serif !important;
  font-size: 16px !important;
  line-height: 1 !important;
  text-align: center !important;
  color: var(--zen-ink) !important;
  background-color: rgba(255, 255, 255, 0.92) !important;
  border: 1px solid var(--zen-line-strong) !important;
  border-radius: var(--zen-radius-pill) !important;
  cursor: pointer !important;
  transition: border-color 0.16s var(--zen-ease), background-color 0.16s var(--zen-ease);
}`
);

shellCss = shellCss.replace(
  `  body:not(.exam-mode) #global-lang-select.lang-select {
    min-height: 36px !important;
    height: 36px !important;
    padding: 0 26px 0 12px !important;
    font-size: 11.5px !important;
  }`,
  `  body:not(.exam-mode) #global-lang-select.lang-select {
    min-height: 34px !important;
    height: 34px !important;
    min-width: 48px !important;
    padding: 0 18px 0 8px !important;
    font-size: 15px !important;
  }`
);

fs.writeFileSync('ZEN-APP-SHELL.css', shellCss, 'utf8');
console.log('ZEN-APP-SHELL.css updated successfully!');

// 2. ZEN-PAGES.css
let pagesCss = fs.readFileSync('ZEN-PAGES.css', 'utf8');

if (!pagesCss.includes('.zen-result-page .zen-study-card-btn')) {
  pagesCss = pagesCss.replace(
    `.zen-result-page .zen-furi-card-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  font-size: 12.5px;
}`,
    `.zen-result-page .zen-furi-card-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  font-size: 12.5px;
}

.zen-result-page .zen-study-card-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 750;
  color: #6c7883;
}

.zen-result-page .zen-study-card-btn:hover {
  color: #1a2228;
  border-color: #8da4b8;
}

.zen-result-page .zen-study-card-btn.is-active {
  background: rgba(158, 203, 101, 0.18) !important;
  border-color: #9ecb65 !important;
  color: #446e16 !important;
  font-weight: 800;
  box-shadow: 0 0 0 1px rgba(158, 203, 101, 0.35);
}`
  );
  fs.writeFileSync('ZEN-PAGES.css', pagesCss, 'utf8');
  console.log('ZEN-PAGES.css updated successfully!');
}
