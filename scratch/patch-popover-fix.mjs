// scratch/patch-popover-fix.mjs
import fs from 'fs';

// 1. Patch ZEN-APP-SHELL.css
const cssPath = 'ZEN-APP-SHELL.css';
let css = fs.readFileSync(cssPath, 'utf8');

const oldCssRule = `.exam-settings-popover {
  max-height: calc(100vh - 70px) !important;
  display: flex !important;
  flex-direction: column !important;
}`;

const newCssRule = `.exam-settings-popover {
  max-height: calc(100vh - 70px) !important;
}

.exam-settings-popover[hidden],
.exam-settings-popover:not(.is-open) {
  display: none !important;
}

.exam-settings-popover.is-open:not([hidden]) {
  display: flex !important;
  flex-direction: column !important;
}`;

// Normalize line endings for replacement
const normCss = css.replace(/\r\n/g, '\n');
const normOldCss = oldCssRule.replace(/\r\n/g, '\n');
const normNewCss = newCssRule.replace(/\r\n/g, '\n');

if (!normCss.includes(normOldCss)) {
  throw new Error('Target CSS rule not found in ZEN-APP-SHELL.css');
}
const updatedCss = normCss.replace(normOldCss, normNewCss);
fs.writeFileSync(cssPath, updatedCss, 'utf8');
console.log('ZEN-APP-SHELL.css patched successfully!');

// 2. Patch app.js (Escape key & Outside Click handlers)
const appPath = 'app.js';
let app = fs.readFileSync(appPath, 'utf8');
const normApp = app.replace(/\r\n/g, '\n');

// 2a. Escape key handler
const oldEscape = `document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    const wrap = $('#zen-lang-dropdown');`;

const newEscape = `document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (state.examSettingsOpen) {
      state.examSettingsOpen = false;
      const pop = $('#exam-settings-popover');
      if (pop) {
        pop.hidden = true;
        pop.classList.remove('is-open');
      }
      $$('[data-action="exam-settings"]').forEach(b => b.classList.remove('is-active'));
      $('[data-action="exam-settings"]')?.focus();
    }
    const wrap = $('#zen-lang-dropdown');`;

if (!normApp.includes(oldEscape)) {
  throw new Error('Target Escape block not found in app.js');
}
let updatedApp = normApp.replace(oldEscape, newEscape);

// 2b. Outside click handler
const oldOutsideClick = `  // Close lang dropdown when clicking outside
  if (!e.target.closest('#zen-lang-dropdown')) {
    const wrap = $('#zen-lang-dropdown');
    const menu = $('#zen-lang-menu');
    if (wrap && menu && wrap.classList.contains('is-open')) {
      wrap.classList.remove('is-open');
      menu.hidden = true;
      $('#zen-lang-trigger')?.setAttribute('aria-expanded', 'false');
    }
  }`;

const newOutsideClick = `  // Close lang dropdown when clicking outside
  if (!e.target.closest('#zen-lang-dropdown')) {
    const wrap = $('#zen-lang-dropdown');
    const menu = $('#zen-lang-menu');
    if (wrap && menu && wrap.classList.contains('is-open')) {
      wrap.classList.remove('is-open');
      menu.hidden = true;
      $('#zen-lang-trigger')?.setAttribute('aria-expanded', 'false');
    }
  }

  // Close exam settings popover when clicking outside
  if (state.examSettingsOpen && !e.target.closest('#exam-settings-popover') && !e.target.closest('[data-action="exam-settings"]')) {
    state.examSettingsOpen = false;
    const pop = $('#exam-settings-popover');
    if (pop) {
      pop.hidden = true;
      pop.classList.remove('is-open');
    }
    $$('[data-action="exam-settings"]').forEach(b => b.classList.remove('is-active'));
  }`;

if (!updatedApp.includes(oldOutsideClick)) {
  throw new Error('Target outside click block not found in app.js');
}
updatedApp = updatedApp.replace(oldOutsideClick, newOutsideClick);

fs.writeFileSync(appPath, updatedApp, 'utf8');
console.log('app.js patched successfully with Escape & Outside Click handling!');
