import fs from 'fs';

let sw = fs.readFileSync('sw.js', 'utf8');

sw = sw.replace('ssw-pm-mock-test-shell-v19', 'ssw-pm-mock-test-shell-v20');
sw = sw.replace('styles.css?v=ssw13', 'styles.css?v=ssw20');
sw = sw.replace('QUESTION-EDITOR-UPDATES.css?v=ssw13', 'QUESTION-EDITOR-UPDATES.css?v=ssw20');
sw = sw.replace('ZEN-APP-SHELL.css?v=ssw17', 'ZEN-APP-SHELL.css?v=ssw20');
sw = sw.replace('HOME-DASHBOARD.css?v=ssw17', 'HOME-DASHBOARD.css?v=ssw20');
sw = sw.replace('ZEN-PAGES.css?v=ssw17', 'ZEN-PAGES.css?v=ssw20');
sw = sw.replace('app.js?v=ssw13', 'app.js?v=ssw20');

fs.writeFileSync('sw.js', sw, 'utf8');
console.log('sw.js updated successfully!');
