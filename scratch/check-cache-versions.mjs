import fs from 'fs';

const sw = fs.readFileSync('sw.js', 'utf8');
const swMatch = sw.match(/CACHE_NAME\s*=\s*['"]([^'"]+)['"]/);
console.log('sw.js CACHE_NAME:', swMatch ? swMatch[1] : 'not found');

const indexHtml = fs.readFileSync('index.html', 'utf8');
const vMatches = [...indexHtml.matchAll(/\?v=([a-zA-Z0-9_-]+)/g)].map(m => m[1]);
console.log('index.html cache versions:', [...new Set(vMatches)]);
