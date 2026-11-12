// scratch/check-research-attribution.mjs
import fs from 'node:fs';

const research = fs.readFileSync('specs/008-practice-selective-translation-kotoba/research.md', 'utf8');
const lines = research.split('\n');
const matchLines = lines.filter(l => l.toLowerCase().includes('attribution') || l.toLowerCase().includes('edrdg') || l.toLowerCase().includes('licence'));
console.log(matchLines.slice(0, 20).join('\n'));
