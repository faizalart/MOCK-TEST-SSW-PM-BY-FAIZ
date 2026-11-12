import fs from 'fs';
let content = fs.readFileSync('scratch/assert-t016-kotoba-markup.mjs', 'utf8');
content = content.replace(
  "assert.equal(hasKotobaClickRouter, false, 'case toggle-selective-kotoba must NOT be implemented before T018 (Scheduled for T018)');\r\nconsole.log('✔ Test 8 Passed: T018 router is not prematurely implemented.');",
  "assert.equal(hasKotobaClickRouter, true, 'case toggle-selective-kotoba is mounted in T018');\r\nconsole.log('✔ Test 8 Passed: T018 router verified mounted.');"
);
content = content.replace(
  "assert.equal(hasKotobaClickRouter, false, 'case toggle-selective-kotoba must NOT be implemented before T018 (Scheduled for T018)');\nconsole.log('✔ Test 8 Passed: T018 router is not prematurely implemented.');",
  "assert.equal(hasKotobaClickRouter, true, 'case toggle-selective-kotoba is mounted in T018');\nconsole.log('✔ Test 8 Passed: T018 router verified mounted.');"
);
fs.writeFileSync('scratch/assert-t016-kotoba-markup.mjs', content, 'utf8');
console.log('Updated assert-t016-kotoba-markup.mjs');
