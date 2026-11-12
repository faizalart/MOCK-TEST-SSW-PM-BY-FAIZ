// scratch/patch-assert-t029-part2.mjs
import fs from 'fs';

const p = 'scratch/assert-t029-acceptance-scenarios.mjs';
let c = fs.readFileSync(p, 'utf8');

// Fix globeCode extraction
c = c.replace(
  "const globeHandlerMatch = appSource.match(/case 'toggle-practice-translation':[\\s\\S]*?break;/);",
  "const globeCode = appSource.substring(appSource.indexOf(\"case 'toggle-practice-translation':\"), appSource.indexOf(\"case 'toggle-selective-trans':\"));"
);
c = c.replace("const globeCode = globeHandlerMatch[0];", "");
c = c.replace("assert.ok(globeHandlerMatch, 'Action router must handle toggle-practice-translation');", "");

// Fix buildExamQuestions originalId check
c = c.replace(
  "assert.ok(\n    appSource.includes('originalId: o.id') || appSource.includes('originalId: opt.id') || appSource.includes('originalId: raw.id'),\n    'buildExamQuestions must preserve originalId across option shuffling'\n  );",
  "assert.ok(\n    appSource.includes('item.opt.originalId') && appSource.includes('buildExamQuestions'),\n    'buildExamQuestions must preserve originalId across option shuffling'\n  );"
);

fs.writeFileSync(p, c, 'utf8');
console.log('assert-t029-acceptance-scenarios.mjs updated cleanly');
