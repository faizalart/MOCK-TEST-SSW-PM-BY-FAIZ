import fs from 'fs';
import path from 'path';

const testPath = path.resolve('tests/test-practice-selective-kotoba.mjs');
let content = fs.readFileSync(testPath, 'utf8');

const normalize = s => s.replace(/\r\n/g, '\n');
const isCRLF = content.includes('\r\n');
let normalizedContent = normalize(content);

// 1. Add toggleSelectiveKotoba to fnModule return and destructuring
const targetReturn = `    resolveKotobaEntries,
    renderKotobaList,
    setKotobaData
  };`;

const newReturn = `    resolveKotobaEntries,
    renderKotobaList,
    setKotobaData,
    toggleSelectiveKotoba
  };`;

normalizedContent = normalizedContent.replace(normalize(targetReturn), normalize(newReturn));

const targetDestructure = `  resolveKotobaEntries,
  renderKotobaList,
  setKotobaData
} = fnModule(sandbox);`;

const newDestructure = `  resolveKotobaEntries,
  renderKotobaList,
  setKotobaData,
  toggleSelectiveKotoba
} = fnModule(sandbox);`;

normalizedContent = normalizedContent.replace(normalize(targetDestructure), normalize(newDestructure));

// 2. Replace section 6 & 7
const targetSection6 = `// -----------------------------------------------------------------------------
// 6. Production Component Readiness Check (T016–T018)
// -----------------------------------------------------------------------------
console.log('\\n--- Production Readiness Inspection (T016–T018) ---');
const hasRenderKotobaList = appSource.includes('function renderKotobaList(');
const hasResolveKotobaEntries = appSource.includes('function resolveKotobaEntries(');
const hasKotobaButtonMarkup = appSource.includes('practice-ctrl-kotoba');

console.log(\`  • Production resolver resolveKotobaEntries: \${hasResolveKotobaEntries ? 'MOUNTED' : 'PENDING_IMPLEMENTATION (T017)'}\`);
console.log(\`  • Production viewer renderKotobaList:       \${hasRenderKotobaList ? 'MOUNTED' : 'PENDING_IMPLEMENTATION (T017)'}\`);
console.log(\`  • Production button .practice-ctrl-kotoba:  \${hasKotobaButtonMarkup ? 'MOUNTED' : 'PENDING_IMPLEMENTATION (T016)'}\`);
console.log(\`  • Production router toggle-selective-kotoba: \${hasKotobaClickAction ? 'MOUNTED' : 'PENDING_IMPLEMENTATION (T018)'}\`);

if (!hasKotobaClickAction) {
  console.log('\\nℹ STATUS: PENDING_IMPLEMENTATION for Click Router toggle-selective-kotoba');
  console.log('  As required by T017, resolver and viewer components pass 100%,');
  console.log('  while click handler toggle-selective-kotoba is safely gated pending Task T018.');
  console.log('  No false claims of premature completion are asserted.');
}

// -----------------------------------------------------------------------------
// 7. Test Harness Summary
// -----------------------------------------------------------------------------
console.log('\\n================================================================================');
console.log('FEATURE 008 TEST HARNESS EXECUTION SUMMARY:');
console.log('  1. Task T011: Baseline State & Identity Tests:  4 PASSED (100%)');
console.log('  2. Task T011: Contract Specification Ledger:    8 SPECS COMPILED & REGISTERED');
console.log('  3. Task T015: Production Resolver Tests:        9 PASSED (100%)');
console.log('  4. Task T016: Right-Side Controls Mounting:     MOUNTED & VERIFIED');
console.log('  5. Task T017: Production Viewer & DOM Sync:     5 PASSED (100%)');
console.log('  6. Task T018: Click Router State Handler:       PENDING_IMPLEMENTATION (T018)');
console.log('================================================================================');
console.log('Feature 008 Test Harness successfully executed!\\n');`;

const newSection6 = `// -----------------------------------------------------------------------------
// 6. Production Component Readiness & Click Handler Assertions (Task T018)
// -----------------------------------------------------------------------------
console.log('\\n--- Production Readiness & Click Handler Assertions (T018) ---');
const hasRenderKotobaList = appSource.includes('function renderKotobaList(');
const hasResolveKotobaEntries = appSource.includes('function resolveKotobaEntries(');
const hasKotobaButtonMarkup = appSource.includes('practice-ctrl-kotoba');
const hasToggleSelectiveKotoba = appSource.includes('function toggleSelectiveKotoba(');

console.log(\`  • Production resolver resolveKotobaEntries: \${hasResolveKotobaEntries ? 'MOUNTED' : 'PENDING_IMPLEMENTATION (T017)'}\`);
console.log(\`  • Production viewer renderKotobaList:       \${hasRenderKotobaList ? 'MOUNTED' : 'PENDING_IMPLEMENTATION (T017)'}\`);
console.log(\`  • Production button .practice-ctrl-kotoba:  \${hasKotobaButtonMarkup ? 'MOUNTED' : 'PENDING_IMPLEMENTATION (T016)'}\`);
console.log(\`  • Production router toggle-selective-kotoba: \${hasKotobaClickAction ? 'MOUNTED' : 'PENDING_IMPLEMENTATION (T018)'}\`);
console.log(\`  • Production handler toggleSelectiveKotoba: \${hasToggleSelectiveKotoba ? 'MOUNTED' : 'PENDING_IMPLEMENTATION (T018)'}\`);

assert.ok(hasKotobaClickAction, 'Router action toggle-selective-kotoba must be mounted in app.js');
assert.ok(hasToggleSelectiveKotoba, 'Handler toggleSelectiveKotoba must be implemented in app.js');

// Test toggleSelectiveKotoba functionality
const t018Session = {
  mode: 'practice',
  deadline: null,
  timed: false,
  currentIndex: 0,
  answers: {},
  questions: [
    {
      id: 'kunci1-q001',
      options: [
        { id: 'A', originalId: 'A' },
        { id: 'B', originalId: 'B' }
      ]
    }
  ]
};
initSelectiveState(t018Session);
sandbox.state.activeSession = t018Session;

// Prompt toggle
assert.equal(toggleSelectiveKotoba(t018Session, 'kunci1-q001', null), true, 'First prompt toggle must be true');
assert.equal(toggleSelectiveKotoba(t018Session, 'kunci1-q001', null), false, 'Second prompt toggle must be false');

// Option toggle
const optKeyA = getOptionKey('kunci1-q001', t018Session.questions[0].options[0]);
assert.equal(toggleSelectiveKotoba(t018Session, 'kunci1-q001', optKeyA), true, 'First option toggle must be true');
assert.equal(getSelectiveQuestionState(t018Session, 'kunci1-q001', false).kotoba, false, 'Prompt kotoba remains false when option toggles');
assert.equal(toggleSelectiveKotoba(t018Session, 'kunci1-q001', optKeyA), false, 'Second option toggle must be false');

console.log('✓ Criterion 6.1: toggleSelectiveKotoba() toggles prompt and option states independently');
console.log('✓ Criterion 6.2: Action router case toggle-selective-kotoba is safely mounted in handleAction');

// -----------------------------------------------------------------------------
// 7. Test Harness Summary
// -----------------------------------------------------------------------------
console.log('\\n================================================================================');
console.log('FEATURE 008 TEST HARNESS EXECUTION SUMMARY:');
console.log('  1. Task T011: Baseline State & Identity Tests:  4 PASSED (100%)');
console.log('  2. Task T011: Contract Specification Ledger:    8 SPECS COMPILED & REGISTERED');
console.log('  3. Task T015: Production Resolver Tests:        9 PASSED (100%)');
console.log('  4. Task T016: Right-Side Controls Mounting:     MOUNTED & VERIFIED');
console.log('  5. Task T017: Production Viewer & DOM Sync:     5 PASSED (100%)');
console.log('  6. Task T018: Click Router State Handler:       VERIFIED (100% PASSED)');
console.log('================================================================================');
console.log('Feature 008 Test Harness successfully executed!\\n');`;

normalizedContent = normalizedContent.replace(normalize(targetSection6), normalize(newSection6));

const finalContent = isCRLF ? normalizedContent.replace(/\n/g, '\r\n') : normalizedContent;
fs.writeFileSync(testPath, finalContent, 'utf8');
console.log('SUCCESS: tests/test-practice-selective-kotoba.mjs patched for T018');
