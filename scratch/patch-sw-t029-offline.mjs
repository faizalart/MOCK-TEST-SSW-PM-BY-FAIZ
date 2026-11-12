// scratch/patch-sw-t029-offline.mjs
import fs from 'fs';

const swPath = 'sw.js';
let sw = fs.readFileSync(swPath, 'utf8');

// Replace CACHE_NAME v29 -> v30
const oldCache = "const CACHE_NAME = 'ssw-pm-mock-test-shell-v29';";
const newCache = "const CACHE_NAME = 'ssw-pm-mock-test-shell-v30';";
if (!sw.includes(oldCache)) {
  throw new Error(`Target not found in sw.js: ${oldCache}`);
}
sw = sw.replace(oldCache, newCache);

// Add ./data/kotobaMapping.json right after ./data/sharedKotobaDictionary.json
const oldTarget = "'./data/sharedKotobaDictionary.json',";
const newTarget = `'./data/sharedKotobaDictionary.json',\n  './data/kotobaMapping.json',`;
if (!sw.includes(oldTarget)) {
  throw new Error(`Target not found in sw.js: ${oldTarget}`);
}
sw = sw.replace(oldTarget, newTarget);

fs.writeFileSync(swPath, sw, 'utf8');
console.log('sw.js successfully updated for T029: v30 + kotobaMapping.json precache!');
