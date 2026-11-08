import fs from 'fs';

let sw = fs.readFileSync('sw.js', 'utf8');

sw = sw.replace('ssw-pm-mock-test-shell-v20', 'ssw-pm-mock-test-shell-v21');
sw = sw.replaceAll('?v=ssw20', '?v=ssw21');

fs.writeFileSync('sw.js', sw, 'utf8');
console.log('sw.js updated to v21 successfully!');
