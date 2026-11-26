import fs from 'node:fs';

const dict = JSON.parse(fs.readFileSync('data/sharedKotobaDictionary.json', 'utf8'));

// Collect all <ruby>base<rt>rt</rt></ruby> tags across P01-P10 + what follows them
const rubyFreq = new Map();
const katakanaFreq = new Map();
const standaloneSymbols = new Set();

// Parse HTML into stream of { type: 'ruby', base, rt } | { type: 'text', text }
function tokenizeHtml(html) {
  const cleanHtml = String(html || '')
    .replace(/\*\*/g, '')
    .replace(/\[(?:イラスト|標識|図|写真|品目)[A-Za-z0-9]+\]\s*/gu, '');
  const tokens = [];
  let last = 0;
  const re = /<ruby>([^<]+)<rt>([^<]*)<\/rt><\/ruby>/g;
  for (const m of cleanHtml.matchAll(re)) {
    if (m.index > last) {
      const t = cleanHtml.slice(last, m.index).replace(/<[^>]+>/g, '');
      if (t) tokens.push({ type: 'text', text: t });
    }
    tokens.push({ type: 'ruby', base: m[1].trim(), rt: m[2].trim() });
    last = m.index + m[0].length;
  }
  if (last < cleanHtml.length) {
    const t = cleanHtml.slice(last).replace(/<[^>]+>/g, '');
    if (t) tokens.push({ type: 'text', text: t });
  }
  return tokens;
}

const sampleRubySeqs = new Set();
const allKatakana = new Map();

for (let p = 1; p <= 10; p++) {
  const pkg = JSON.parse(fs.readFileSync(`data/latsol-otaff-pm51-${String(p).padStart(2, '0')}.json`, 'utf8'));
  for (const q of pkg.questions) {
    const items = [q.prompt, ...q.options.map(o => o.text)];
    for (const html of items) {
      const toks = tokenizeHtml(html);
      for (let i = 0; i < toks.length; i++) {
        const tk = toks[i];
        if (tk.type === 'ruby') {
          const next = toks[i + 1]?.type === 'text' ? toks[i + 1].text : '';
          const hiraFollow = (next.match(/^[\u3041-\u3096ー]+/) || [''])[0];
          const key = `${tk.base}|${tk.rt}`;
          if (!rubyFreq.has(key)) rubyFreq.set(key, { base: tk.base, rt: tk.rt, count: 0, follows: new Map() });
          const r = rubyFreq.get(key);
          r.count++;
          if (hiraFollow) r.follows.set(hiraFollow.slice(0, 8), (r.follows.get(hiraFollow.slice(0, 8)) || 0) + 1);
        } else {
          for (const km of tk.text.matchAll(/[\u30a1-\u30f6ー]+(?:・[\u30a1-\u30f6ー]+)*/g)) {
            const kw = km[0];
            allKatakana.set(kw, (allKatakana.get(kw) || 0) + 1);
          }
        }
      }
    }
  }
}

console.log('Unique <ruby>base|rt pairs across all 1,600 contexts:', rubyFreq.size);
console.log('Unique Katakana tokens across all 1,600 contexts:', allKatakana.size);

// Check how many <ruby> bases are ALREADY in master dict as exact kanji or need okurigana attached
const exactInMaster = [];
const needsOkuri = [];
for (const r of rubyFreq.values()) {
  const topFollows = [...r.follows.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([f, c]) => `${f}(${c})`);
  needsOkuri.push({ base: r.base, rt: r.rt, count: r.count, topFollows });
}
needsOkuri.sort((a, b) => b.count - a.count);

console.log('\nSample 40 <ruby> bases sorted by frequency:');
for (const r of needsOkuri.slice(0, 40)) {
  console.log(`  ${r.base}(${r.rt}) [${r.count}x] -> next: ${r.topFollows.join(', ')}`);
}

console.log('\nAll Katakana tokens >= 3x:');
for (const [k, c] of [...allKatakana.entries()].sort((a, b) => b[1] - a[1]).filter(([, c]) => c >= 3)) {
  console.log(`  ${k} (${c}x)`);
}
