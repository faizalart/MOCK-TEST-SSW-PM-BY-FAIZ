import fs from 'fs';

let html = fs.readFileSync('index.html', 'utf8');

// Update SW cleanup check in head
html = html.replace('ssw-pm-mock-test-shell-v20', 'ssw-pm-mock-test-shell-v21');

// Bump cachebusters to v=ssw21
html = html.replaceAll('?v=ssw20', '?v=ssw21');

// Replace lang options with minimalist flags
const oldSelect = `<select
              id="global-lang-select"
              class="lang-select"
              title="Ubah Bahasa Antarmuka / Change Interface Language"
            >
              <option value="id">Bahasa Indonesia</option>
              <option value="en">English</option>
              <option value="ja">日本語</option>
            </select>`;

const newSelect = `<select
              id="global-lang-select"
              class="lang-select"
              title="Ubah Bahasa / Change Language / 言語切替"
              aria-label="Language selection"
            >
              <option value="id" title="Bahasa Indonesia">🇮🇩</option>
              <option value="en" title="English">🇬🇧</option>
              <option value="ja" title="日本語">🇯🇵</option>
            </select>`;

if (html.includes(oldSelect)) {
  html = html.replace(oldSelect, newSelect);
} else {
  // Regex fallback
  html = html.replace(
    /<select\s+id="global-lang-select"[\s\S]*?<\/select>/,
    newSelect
  );
}

fs.writeFileSync('index.html', html, 'utf8');
console.log('index.html updated successfully!');
