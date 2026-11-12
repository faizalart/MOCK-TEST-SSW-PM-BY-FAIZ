// scratch/patch-sw-t027.mjs
import fs from 'fs';

const swPath = 'sw.js';
let sw = fs.readFileSync(swPath, 'utf8');

// Replace CACHE_NAME
const oldCache = "const CACHE_NAME = 'ssw-pm-mock-test-shell-v28';";
const newCache = "const CACHE_NAME = 'ssw-pm-mock-test-shell-v29';";
if (!sw.includes(oldCache)) {
  throw new Error(`Target not found: ${oldCache}`);
}
sw = sw.replace(oldCache, newCache);

// Add sharedKotobaDictionary.json to CORE
const oldTarget = "'./ssw-pm-special-lab-bundle.json',";
const newTarget = `'./ssw-pm-special-lab-bundle.json',\n  './data/sharedKotobaDictionary.json',`;
if (!sw.includes(oldTarget)) {
  throw new Error(`Target not found: ${oldTarget}`);
}
sw = sw.replace(oldTarget, newTarget);

fs.writeFileSync(swPath, sw, 'utf8');
console.log('sw.js successfully updated for T027!');
