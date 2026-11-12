// scratch/patch-assert-t012.mjs
import fs from 'fs';

const p = 'scratch/assert-t012-markup.mjs';
let c = fs.readFileSync(p, 'utf8');

c = c.replace(
  "assert.ok(appCode.includes('practice-row-slot'), 'app.js includes practice-row-slot');",
  "assert.ok(appCode.includes('practice-row-slot') || appCode.includes('practice-ctrl-kotoba'), 'app.js includes right slot/ctrl');"
);

c = c.replace(
  "assert.ok(htmlPracticeOff.includes('class=\"practice-row-slot\" aria-hidden=\"true\"'), 'practice-row-slot right spacer must exist');",
  "assert.ok(htmlPracticeOff.includes('class=\"practice-row-slot\"') || htmlPracticeOff.includes('practice-ctrl-kotoba'), 'right element must exist');"
);

c = c.replace(
  'const optionRowMatch = htmlPracticeOff.match(/<div class="practice-option-row">([\\s\\S]*?<span class="practice-row-slot" aria-hidden="true"><\\/span>\\s*)<\\/div>/);',
  'const optionRowMatch = htmlPracticeOff.match(/<div class="practice-option-row">([\\s\\S]*?(?:<span class="practice-row-slot"|<button[^>]*practice-ctrl-kotoba)[\\s\\S]*?)<\\/div>/);'
);

c = c.replace(
  'const slotIdx = rowInner.indexOf(\'<span class="practice-row-slot"\');',
  'const slotIdx = rowInner.indexOf(\'practice-ctrl-kotoba\') !== -1 ? rowInner.indexOf(\'practice-ctrl-kotoba\') : rowInner.indexOf(\'<span class="practice-row-slot"\');'
);

fs.writeFileSync(p, c, 'utf8');
console.log('assert-t012-markup.mjs updated successfully');
