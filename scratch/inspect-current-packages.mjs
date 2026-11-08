import fs from 'fs';

// Check json files in root
const files = fs.readdirSync('.').filter(f => f.endsWith('.json'));
console.log('JSON files in root:');
for (const f of files) {
  const stat = fs.statSync(f);
  console.log(`- ${f} (${(stat.size / 1024).toFixed(1)} KB)`);
}

// Read seed-data.js first few lines to see how packages are registered
const seed = fs.readFileSync('seed-data.js', 'utf8');
console.log('\nseed-data.js head:');
console.log(seed.slice(0, 1000));
