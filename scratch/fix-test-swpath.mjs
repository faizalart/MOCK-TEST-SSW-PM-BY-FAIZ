// scratch/fix-test-swpath.mjs
import fs from 'fs';

const testFile = 'tests/test-practice-selective-kotoba.mjs';
let content = fs.readFileSync(testFile, 'utf8');
content = content.replace("const swPath = path.resolve('sw.js');", "const swPath = './sw.js';");
fs.writeFileSync(testFile, content, 'utf8');
console.log('Fixed swPath in test harness');
