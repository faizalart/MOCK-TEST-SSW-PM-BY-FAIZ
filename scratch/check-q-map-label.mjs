import fs from 'fs';

for (const file of ['index.html', 'app.js', 'styles.css', 'QUESTION-EDITOR-UPDATES.css', 'ZEN-PAGES.css']) {
  const c = fs.readFileSync(file, 'utf8');
  if (c.includes('question-map-label')) {
    console.log(`Found question-map-label in ${file}`);
  }
}
