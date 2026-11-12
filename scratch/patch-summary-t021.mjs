import fs from 'fs';
let content = fs.readFileSync('tests/test-practice-selective-kotoba.mjs', 'utf8');

const target = "  8. Task T020: Ruby Rendering for Furigana:      VERIFIED (100% PASSED)";
const replacement = "  8. Task T020: Ruby Rendering for Furigana:      VERIFIED (100% PASSED)\r\n  9. Task T021: Dedicated Kotoba Furigana CSS:    VERIFIED (100% PASSED)";

if (content.includes('\r\n')) {
  content = content.replace(target, replacement);
} else {
  content = content.replace(target, "  8. Task T020: Ruby Rendering for Furigana:      VERIFIED (100% PASSED)\n  9. Task T021: Dedicated Kotoba Furigana CSS:    VERIFIED (100% PASSED)");
}

fs.writeFileSync('tests/test-practice-selective-kotoba.mjs', content, 'utf8');
console.log('Updated summary in test-practice-selective-kotoba.mjs');
