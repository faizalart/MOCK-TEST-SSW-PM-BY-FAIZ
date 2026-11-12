// scratch/patch-assert-t029.mjs
import fs from 'fs';

const p = 'scratch/assert-t029-acceptance-scenarios.mjs';
let c = fs.readFileSync(p, 'utf8');

// Replace appSource normalization
c = c.replace(
  "const appSource = fs.readFileSync('app.js', 'utf8');",
  "const rawAppSource = fs.readFileSync('app.js', 'utf8');\nconst appSource = rawAppSource.replace(/\\r\\n/g, '\\n');"
);

// Fix optKeyHelper slice bound
c = c.replace(
  "appSource.indexOf('function getSelectiveQuestionState(')",
  "appSource.indexOf('function toggleSelectiveTrans(')"
);

fs.writeFileSync(p, c, 'utf8');
console.log('assert-t029-acceptance-scenarios.mjs patched successfully');
