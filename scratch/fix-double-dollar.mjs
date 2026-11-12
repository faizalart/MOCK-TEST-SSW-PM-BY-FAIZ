// scratch/fix-double-dollar.mjs
import fs from 'fs';

const appPath = 'app.js';
let app = fs.readFileSync(appPath, 'utf8');

// Replace single $ with $$ for forEach
app = app.replace(
  "$('[data-action=\"exam-settings\"]').forEach(b => b.classList.remove('is-active'));\n      $('[data-action=\"exam-settings\"]')?.focus();",
  "$$('[data-action=\"exam-settings\"]').forEach(b => b.classList.remove('is-active'));\n      $('[data-action=\"exam-settings\"]')?.focus();"
);

app = app.replace(
  "$('[data-action=\"exam-settings\"]').forEach(b => b.classList.remove('is-active'));\n  }\n\n  const pageBtn",
  "$$('[data-action=\"exam-settings\"]').forEach(b => b.classList.remove('is-active'));\n  }\n\n  const pageBtn"
);

fs.writeFileSync(appPath, app, 'utf8');
console.log('Fixed double dollar $$ in app.js');
