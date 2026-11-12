import fs from 'fs';
import path from 'path';

const testPath = path.resolve('tests/test-practice-selective-kotoba.mjs');
let content = fs.readFileSync(testPath, 'utf8');

const normalize = s => s.replace(/\r\n/g, '\n');
const isCRLF = content.includes('\r\n');
let normalizedContent = normalize(content);

const targetSummary = `// -----------------------------------------------------------------------------
// 8. Test Harness Summary
// -----------------------------------------------------------------------------
console.log('\\n================================================================================');
console.log('FEATURE 008 TEST HARNESS EXECUTION SUMMARY:');
console.log('  1. Task T011: Baseline State & Identity Tests:  4 PASSED (100%)');
console.log('  2. Task T011: Contract Specification Ledger:    8 SPECS COMPILED & REGISTERED');
console.log('  3. Task T015: Production Resolver Tests:        9 PASSED (100%)');
console.log('  4. Task T016: Right-Side Controls Mounting:     MOUNTED & VERIFIED');
console.log('  5. Task T017: Production Viewer & DOM Sync:     5 PASSED (100%)');
console.log('  6. Task T018: Click Router State Handler:       VERIFIED (100% PASSED)');
console.log('  7. Task T019: Furigana Synchronization Tests:   VERIFIED (100% PASSED)');
console.log('================================================================================');
console.log('Feature 008 Test Harness successfully executed!\\n');`;

const newPart8AndSummary = `// -----------------------------------------------------------------------------
// 8. User Story 3: Ruby Rendering for Kotoba Furigana (Task T020)
// -----------------------------------------------------------------------------
console.log('\\n--- User Story 3: Ruby Rendering for Kotoba Furigana (T020) ---');

// 8.1 Canonical Ruby Structure Verification
const t020SampleTerms = [
  { id: 'kb-test1', kanji: '健康管理', furigana: 'けんこうかんり', arti: 'Manajemen kesehatan', status: 'verified' }
];
const t020HTML = renderKotobaList(t020SampleTerms);
assert.ok(t020HTML.includes('<ruby class="kotoba-ruby">健康管理<rt>けんこうかんり</rt></ruby>'), 'Canonical <ruby class="kotoba-ruby"><rt> structure required');
assert.ok(t020HTML.includes('<span class="kotoba-term-wrap">'), 'Term wrapped inside kotoba-term-wrap');
assert.ok(t020HTML.includes('<span class="kotoba-separator" aria-hidden="true">—</span>'), 'Separator included with aria-hidden="true"');
assert.ok(t020HTML.includes('<span class="kotoba-meaning" lang="id">Manajemen kesehatan</span>'), 'Indonesian meaning tagged with lang="id"');
console.log('✓ Criterion 8.1: Canonical <ruby class="kotoba-ruby"><rt> structure verified');

// 8.2 Missing/Empty Reading Safety (Zero Hallucinated Furigana)
const t020EmptyFuriTerms = [
  { id: 'kb-test2', kanji: 'パン', furigana: '', arti: 'Roti', status: 'verified' }
];
const t020EmptyHTML = renderKotobaList(t020EmptyFuriTerms);
assert.ok(t020EmptyHTML.includes('<ruby class="kotoba-ruby">パン<rt></rt></ruby>'), 'Empty furigana yields empty <rt></rt> without hallucinating readings');
assert.ok(!t020EmptyHTML.includes('ぱん'), 'Must not hallucinate hiragana readings');
console.log('✓ Criterion 8.2: Terms without reading render empty <rt></rt> safely without fake furigana');

// 8.3 Strict Content Escaping (Zero XSS)
const t020DangerousTerms = [
  { id: 'kb-xss', kanji: '消毒<b>', furigana: 'しょうどく<script>', arti: 'Disinfeksi & steril "ok"', status: 'verified' }
];
const t020EscHTML = renderKotobaList(t020DangerousTerms);
assert.ok(!t020EscHTML.includes('<b>') && !t020EscHTML.includes('<script>'), 'Unescaped HTML tags prohibited');
assert.ok(t020EscHTML.includes('&lt;b&gt;') && t020EscHTML.includes('&lt;script&gt;'), 'Special characters escaped');
assert.ok(t020EscHTML.includes('&amp; steril &quot;ok&quot;'), 'Meaning escaped properly');
console.log('✓ Criterion 8.3: Kanji, readings, definitions, and IDs strictly sanitized via esc()');

// 8.4 Prompt and Option Component Parity
const hasPromptKotobaRender = appSource.includes('renderKotobaList(resolvedPromptKotoba)');
const hasOptionKotobaRender = appSource.includes('renderKotobaList(resolvedOptKotoba)');
assert.ok(hasPromptKotobaRender, 'renderKotobaList must be wired to prompt in renderExam');
assert.ok(hasOptionKotobaRender, 'renderKotobaList must be wired to options in renderExam');
console.log('✓ Criterion 8.4: Identical Ruby rendering component utilized across prompt and options');

// -----------------------------------------------------------------------------
// 9. Test Harness Summary
// -----------------------------------------------------------------------------
console.log('\\n================================================================================');
console.log('FEATURE 008 TEST HARNESS EXECUTION SUMMARY:');
console.log('  1. Task T011: Baseline State & Identity Tests:  4 PASSED (100%)');
console.log('  2. Task T011: Contract Specification Ledger:    8 SPECS COMPILED & REGISTERED');
console.log('  3. Task T015: Production Resolver Tests:        9 PASSED (100%)');
console.log('  4. Task T016: Right-Side Controls Mounting:     MOUNTED & VERIFIED');
console.log('  5. Task T017: Production Viewer & DOM Sync:     5 PASSED (100%)');
console.log('  6. Task T018: Click Router State Handler:       VERIFIED (100% PASSED)');
console.log('  7. Task T019: Furigana Synchronization Tests:   VERIFIED (100% PASSED)');
console.log('  8. Task T020: Ruby Rendering for Furigana:      VERIFIED (100% PASSED)');
console.log('================================================================================');
console.log('Feature 008 Test Harness successfully executed!\\n');`;

normalizedContent = normalizedContent.replace(normalize(targetSummary), normalize(newPart8AndSummary));

const finalContent = isCRLF ? normalizedContent.replace(/\n/g, '\r\n') : normalizedContent;
fs.writeFileSync(testPath, finalContent, 'utf8');
console.log('SUCCESS: tests/test-practice-selective-kotoba.mjs patched for T020');
