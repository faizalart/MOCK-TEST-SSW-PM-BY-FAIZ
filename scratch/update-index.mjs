import fs from 'fs';

let html = fs.readFileSync('index.html', 'utf8');

// Update SW cleanup check in head
html = html.replace('ssw-pm-mock-test-shell-v19', 'ssw-pm-mock-test-shell-v20');

// Update cachebusters
html = html.replace('styles.css?v=ssw13', 'styles.css?v=ssw20');
html = html.replace('QUESTION-EDITOR-UPDATES.css?v=ssw13', 'QUESTION-EDITOR-UPDATES.css?v=ssw20');
html = html.replace('ZEN-APP-SHELL.css?v=ssw17', 'ZEN-APP-SHELL.css?v=ssw20');
html = html.replace('HOME-DASHBOARD.css?v=ssw17', 'HOME-DASHBOARD.css?v=ssw20');
html = html.replace('ZEN-PAGES.css?v=ssw17', 'ZEN-PAGES.css?v=ssw20');
html = html.replace('app.js?v=ssw13', 'app.js?v=ssw20');

// Add Study List nav item before backup nav item
const targetNav = `<button class="nav-item" data-page="backup">`;
const studyNavItem = `        <button class="nav-item" data-page="study">
          <span class="nav-icon">🔖</span>
          <span data-i18n="navStudy">Study List</span>
          <span class="nav-badge is-zero" id="nav-study-badge">0</span>
        </button>

`;

if (!html.includes('data-page="study"')) {
  html = html.replace(targetNav, studyNavItem + targetNav);
}

fs.writeFileSync('index.html', html, 'utf8');
console.log('index.html updated successfully!');
