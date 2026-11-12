import fs from 'fs';
let content = fs.readFileSync('tests/test-practice-selective-kotoba.mjs', 'utf8');

const target = "console.log('  8. Task T020: Ruby Rendering for Furigana:      VERIFIED (100% PASSED)\r\n  9. Task T021: Dedicated Kotoba Furigana CSS:    VERIFIED (100% PASSED)');";
const replacement = "console.log('  8. Task T020: Ruby Rendering for Furigana:      VERIFIED (100% PASSED)');\r\nconsole.log('  9. Task T021: Dedicated Kotoba Furigana CSS:    VERIFIED (100% PASSED)');";

content = content.replace(target, replacement);
content = content.replace(
  "console.log('  8. Task T020: Ruby Rendering for Furigana:      VERIFIED (100% PASSED)\n  9. Task T021: Dedicated Kotoba Furigana CSS:    VERIFIED (100% PASSED)');",
  "console.log('  8. Task T020: Ruby Rendering for Furigana:      VERIFIED (100% PASSED)');\nconsole.log('  9. Task T021: Dedicated Kotoba Furigana CSS:    VERIFIED (100% PASSED)');"
);

fs.writeFileSync('tests/test-practice-selective-kotoba.mjs', content, 'utf8');
console.log('Fixed summary lines in tests/test-practice-selective-kotoba.mjs');
