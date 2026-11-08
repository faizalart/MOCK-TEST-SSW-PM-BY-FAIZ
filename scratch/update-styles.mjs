import fs from 'fs';

// 1. Update ZEN-APP-SHELL.css
let shellCss = fs.readFileSync('ZEN-APP-SHELL.css', 'utf8');

// Update mobile nav grid to flex
shellCss = shellCss.replace(
  `  body:not(.exam-mode) .sidebar .main-nav {
    width: 100%;
    height: 46px;
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 2px;
    border-top: 1px solid var(--zen-line);
    overflow: visible;
  }`,
  `  body:not(.exam-mode) .sidebar .main-nav {
    width: 100%;
    height: 46px;
    display: flex;
    align-items: stretch;
    gap: 2px;
    border-top: 1px solid var(--zen-line);
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
    padding: 0 4px;
  }

  body:not(.exam-mode) .sidebar .main-nav::-webkit-scrollbar {
    display: none;
  }`
);

// Update nav badge and cbt button styles if not already present
if (!shellCss.includes('nav-study-badge')) {
  shellCss += `\n
/* STUDY LIST NAV BADGE */
.sidebar .nav-item {
  position: relative;
}

.sidebar .nav-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: var(--zen-accent, #c93b2b);
  color: #ffffff;
  font-size: 10.5px;
  font-weight: 750;
  line-height: 1;
  margin-left: 5px;
  vertical-align: middle;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  transition: transform 0.15s ease, opacity 0.15s ease;
}

.sidebar .nav-badge.is-zero {
  display: none !important;
}

/* CBT EXAM TOOL BUTTON: STUDY LIST QUICK BUTTON */
.exam-tool-button.study-list-quick-button {
  font-size: 18px;
  font-weight: 700;
  color: #6c7883;
  line-height: 1;
}

.exam-tool-button.study-list-quick-button:hover {
  color: #1a2228;
  border-color: #8da4b8;
}

.exam-tool-button.study-list-quick-button.is-active {
  background: rgba(158, 203, 101, 0.16) !important;
  border-color: #9ecb65 !important;
  color: #9ecb65 !important;
  font-weight: 800;
  box-shadow: 0 0 0 1px rgba(158, 203, 101, 0.35);
}
`;
}

fs.writeFileSync('ZEN-APP-SHELL.css', shellCss, 'utf8');
console.log('ZEN-APP-SHELL.css updated successfully!');

// 2. Update ZEN-PAGES.css
let pagesCss = fs.readFileSync('ZEN-PAGES.css', 'utf8');

if (!pagesCss.includes('zen-study-page')) {
  pagesCss += `\n
/* ==========================================================================
   ZEN STUDY LIST PAGE & CARDS
   ========================================================================== */
.zen-study-page {
  display: flex;
  flex-direction: column;
  gap: 22px;
  max-width: 960px;
  margin: 0 auto;
}

.zen-study-filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 18px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--zen-line);
  border-radius: 12px;
}

.zen-study-filter-left {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  flex: 1 1 320px;
}

.zen-study-search-wrap {
  position: relative;
  flex: 1 1 200px;
}

.zen-study-search-wrap input {
  width: 100%;
  padding: 8px 12px;
  font-size: 13px;
  border: 1px solid var(--zen-line);
  border-radius: 8px;
  background: #ffffff;
  color: var(--zen-ink);
}

.zen-study-filter-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.zen-study-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.zen-study-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px 20px;
  background: #ffffff;
  border: 1px solid var(--zen-line);
  border-radius: 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.zen-study-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.zen-study-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  padding-bottom: 10px;
}

.zen-study-card-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.zen-study-pkg-pill {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 6px;
  background: rgba(37, 54, 74, 0.08);
  color: var(--zen-ink);
  font-size: 12px;
  font-weight: 600;
}

.zen-study-qnum-pill {
  display: inline-block;
  padding: 3px 7px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.05);
  font-size: 12px;
  font-weight: 750;
  color: var(--zen-ink);
}

.zen-study-date {
  font-size: 11.5px;
  color: var(--zen-muted);
}

.zen-study-card-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.zen-study-card .zen-icon-toggle {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid var(--zen-line);
  background: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 12px;
  color: var(--zen-ink);
  cursor: pointer;
  transition: all 0.15s ease;
}

.zen-study-card .zen-icon-toggle:hover {
  background: #f0f2f5;
  border-color: #adb5bd;
}

.zen-study-card .zen-icon-toggle.is-active {
  background: #25364a;
  color: #ffffff;
  border-color: #25364a;
}

.zen-study-card .zen-action-btn {
  padding: 6px 11px;
  border-radius: 7px;
  border: 1px solid var(--zen-line);
  background: #ffffff;
  color: var(--zen-ink);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.zen-study-card .zen-action-btn:hover {
  background: #f7f8f9;
  border-color: #8da4b8;
}

.zen-study-card .zen-action-btn.is-danger {
  color: #c93b2b;
}

.zen-study-card .zen-action-btn.is-danger:hover {
  background: rgba(201, 59, 43, 0.08);
  border-color: #c93b2b;
}

.zen-study-prompt {
  font-size: 15.5px;
  line-height: 1.6;
  color: var(--zen-ink);
  font-weight: 600;
}

.zen-study-image {
  max-width: 100%;
  max-height: 280px;
  object-fit: contain;
  border-radius: 8px;
  border: 1px solid var(--zen-line);
  background: #fdfdfd;
}

.zen-study-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.zen-study-opt {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid var(--zen-line);
  background: #fafaf9;
  font-size: 14px;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.zen-study-opt.is-correct {
  background: rgba(158, 203, 101, 0.14);
  border-color: #9ecb65;
  font-weight: 600;
}

.zen-study-opt-letter {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 5px;
  background: rgba(0, 0, 0, 0.07);
  font-size: 12px;
  font-weight: 750;
  flex-shrink: 0;
}

.zen-study-opt.is-correct .zen-study-opt-letter {
  background: #7ca845;
  color: #fff;
}

.zen-study-opt-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.zen-study-correct-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 7px;
  border-radius: 4px;
  background: #9ecb65;
  color: #1a3311;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
}

.zen-study-translation-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 14px;
  border-radius: 8px;
  background: rgba(37, 54, 74, 0.04);
  border-left: 3px solid #25364a;
  font-size: 13.5px;
  line-height: 1.55;
  color: #2b3947;
}

.zen-study-translation-panel.is-hidden {
  display: none !important;
}

.zen-study-explanation {
  padding: 10px 14px;
  border-radius: 8px;
  background: #fff8e8;
  border: 1px solid #f0dfa8;
  font-size: 13px;
  line-height: 1.5;
  color: #634a12;
}

/* Per-card Furigana in Study Cards */
body .zen-study-card.furigana-off ruby rt,
body .zen-study-card.furigana-off ruby rp {
  display: none !important;
}

body.hide-furigana .zen-study-card.furigana-on ruby rt {
  display: ruby-text !important;
}

/* Study Detail Modal */
.zen-study-modal-wrap {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 680px;
  width: 100%;
}
`;
  fs.writeFileSync('ZEN-PAGES.css', pagesCss, 'utf8');
  console.log('ZEN-PAGES.css updated successfully!');
}
