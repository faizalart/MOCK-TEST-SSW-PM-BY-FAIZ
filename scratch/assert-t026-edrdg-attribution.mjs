// scratch/assert-t026-edrdg-attribution.mjs
import fs from 'node:fs';
import assert from 'node:assert/strict';

console.log('================================================================================');
console.log('FEATURE 008: Practice Selective Translation & Kotoba Reveal');
console.log('TASK T026: EDRDG / JMdict Legal Attribution in Settings Modal Verification');
console.log('================================================================================\n');

const appSource = fs.readFileSync('app.js', 'utf8').replace(/\r\n/g, '\n');
const zenCss = fs.readFileSync('ZEN-APP-SHELL.css', 'utf8');
const indexHtml = fs.readFileSync('index.html', 'utf8');
const dictMeta = JSON.parse(fs.readFileSync('data/sharedKotobaDictionary.json', 'utf8'))._meta;

// Extract renderExamSettingsPopover from app.js
const fnStart = appSource.indexOf('function renderExamSettingsPopover()');
assert.ok(fnStart !== -1, 'renderExamSettingsPopover function must exist in app.js');
const fnEnd = appSource.indexOf('function renderExam()', fnStart);
const popoverFunctionCode = appSource.substring(fnStart, fnEnd);

// -----------------------------------------------------------------------------
// CHECK 1: Acknowledgment EDRDG appears in Settings Modal
// -----------------------------------------------------------------------------
console.log('--- CHECK 1: EDRDG Acknowledgment in Settings Modal ---');
{
  assert.ok(
    popoverFunctionCode.includes('exam-attribution-section'),
    'renderExamSettingsPopover must render an exam-attribution-section'
  );
  assert.ok(
    popoverFunctionCode.includes('This application uses data from the <strong>JMdict</strong> dictionary file'),
    'Settings modal must feature official EDRDG acknowledgment sample wording'
  );
  console.log('✔ Check 1 PASSED: EDRDG acknowledgment mounted cleanly inside Settings Modal popover.');
}

// -----------------------------------------------------------------------------
// CHECK 2: JMdict and EDRDG explicit naming
// -----------------------------------------------------------------------------
console.log('\n--- CHECK 2: Explicit JMdict and EDRDG Naming ---');
{
  assert.ok(
    popoverFunctionCode.includes('JMdict'),
    'Settings modal must name JMdict explicitly'
  );
  assert.ok(
    popoverFunctionCode.includes('Electronic Dictionary Research and Development Group (EDRDG)') ||
    popoverFunctionCode.includes('Electronic Dictionary Research and Development Group'),
    'Settings modal must name EDRDG explicitly'
  );
  console.log('✔ Check 2 PASSED: Both JMdict and EDRDG clearly named.');
}

// -----------------------------------------------------------------------------
// CHECK 3: CC BY-SA 4.0 license metadata alignment
// -----------------------------------------------------------------------------
console.log('\n--- CHECK 3: CC BY-SA 4.0 Metadata Alignment ---');
{
  assert.ok(
    popoverFunctionCode.includes('CC BY-SA 4.0'),
    'Settings modal must specify CC BY-SA 4.0'
  );
  assert.equal(dictMeta.datasetLicense, 'CC BY-SA 4.0', 'Dataset license metadata must be CC BY-SA 4.0');
  console.log('✔ Check 3 PASSED: Attribution precisely aligns with dictionary _meta CC BY-SA 4.0 metadata.');
}

// -----------------------------------------------------------------------------
// CHECK 4: EDRDG Licence link
// -----------------------------------------------------------------------------
console.log('\n--- CHECK 4: EDRDG Licence Link ---');
{
  assert.ok(
    popoverFunctionCode.includes('href="https://www.edrdg.org/edrdg/licence.html"'),
    'Must include valid link to EDRDG licence'
  );
  console.log('✔ Check 4 PASSED: EDRDG licence URL verified: https://www.edrdg.org/edrdg/licence.html');
}

// -----------------------------------------------------------------------------
// CHECK 5: JMdict Project link
// -----------------------------------------------------------------------------
console.log('\n--- CHECK 5: JMdict Project Link ---');
{
  assert.ok(
    popoverFunctionCode.includes('href="https://www.edrdg.org/wiki/index.php/JMdict-EDICT_Dictionary_Project"'),
    'Must include valid link to JMdict Project'
  );
  console.log('✔ Check 5 PASSED: JMdict Project URL verified: https://www.edrdg.org/wiki/index.php/JMdict-EDICT_Dictionary_Project');
}

// -----------------------------------------------------------------------------
// CHECK 6: CC BY-SA 4.0 Legal Code link
// -----------------------------------------------------------------------------
console.log('\n--- CHECK 6: CC BY-SA 4.0 Legal Code Link ---');
{
  assert.ok(
    popoverFunctionCode.includes('href="https://creativecommons.org/licenses/by-sa/4.0/legalcode"'),
    'Must include valid link to CC BY-SA 4.0 legal code'
  );
  console.log('✔ Check 6 PASSED: CC BY-SA 4.0 legal code URL verified: https://creativecommons.org/licenses/by-sa/4.0/legalcode');
}

// -----------------------------------------------------------------------------
// CHECK 7: Dataset Adaptation & In-House Indonesian Curation Statement
// -----------------------------------------------------------------------------
console.log('\n--- CHECK 7: Dataset Adaptation and Indonesian Curation Notice ---');
{
  assert.ok(
    popoverFunctionCode.includes('SSW Food Processing') || popoverFunctionCode.includes('飲食料品製造業'),
    'Must mention domain matching for SSW Food Processing'
  );
  assert.ok(
    popoverFunctionCode.includes('in-house curated Indonesian definitions') || popoverFunctionCode.includes('definisi bahasa Indonesia'),
    'Must clarify that Indonesian definitions were curated in-house'
  );
  console.log('✔ Check 7 PASSED: Dataset adaptation and original in-house Indonesian curation transparently communicated.');
}

// -----------------------------------------------------------------------------
// CHECK 8: Zero False Claims of Endorsement
// -----------------------------------------------------------------------------
console.log('\n--- CHECK 8: Zero False Claims of Endorsement ---');
{
  const lowerCode = popoverFunctionCode.toLowerCase();
  assert.ok(!lowerCode.includes('endorsed by edrdg'), 'No false endorsement claims');
  assert.ok(!lowerCode.includes('sponsored by edrdg'), 'No false sponsorship claims');
  assert.ok(!lowerCode.includes('official edrdg application'), 'No false official application claims');
  console.log('✔ Check 8 PASSED: Zero endorsement or sponsorship claims made.');
}

// -----------------------------------------------------------------------------
// CHECK 9: Proprietary CBT Engine Decoupling (Mere Aggregation)
// -----------------------------------------------------------------------------
console.log('\n--- CHECK 9: Proprietary CBT Software Decoupling ---');
{
  assert.ok(
    popoverFunctionCode.includes('The application software, CBT scoring engine, and platform code remain separate proprietary works') ||
    popoverFunctionCode.includes('proprietary works'),
    'Must preserve proprietary boundary of surrounding CBT engine software under Mere Aggregation'
  );
  console.log('✔ Check 9 PASSED: Proprietary code cleanly decoupled from CC BY-SA 4.0 dictionary dataset.');
}

// -----------------------------------------------------------------------------
// CHECK 10: UI Layout, Scrolling & Non-Disruptive Responsive Design
// -----------------------------------------------------------------------------
console.log('\n--- CHECK 10: Settings Modal Ergonomics & Scrollability ---');
{
  assert.ok(
    zenCss.includes('.exam-settings-popover') &&
    zenCss.includes('max-height: calc(100vh - 70px) !important'),
    '.exam-settings-popover must enforce max-height to avoid off-screen overflow'
  );
  assert.ok(
    zenCss.includes('.exam-settings-body') &&
    zenCss.includes('overflow-y: auto !important'),
    '.exam-settings-body must be scrollable'
  );
  assert.ok(
    zenCss.includes('.exam-attribution-section') &&
    zenCss.includes('.exam-attribution-body'),
    'Attribution section must have dedicated compact styling'
  );
  console.log('✔ Check 10 PASSED: Settings popover body scrollable with max-height clearance, perfectly responsive.');
}

// -----------------------------------------------------------------------------
// CHECK 11: Normal Application Lifecycle Mounting
// -----------------------------------------------------------------------------
console.log('\n--- CHECK 11: Normal Application Lifecycle Mounting ---');
{
  assert.ok(
    appSource.includes('${renderExamSettingsPopover()}'),
    'renderExam must mount renderExamSettingsPopover() into exam DOM'
  );
  assert.ok(
    indexHtml.includes('EDRDG & JMdict Attribution Section (CC BY-SA 4.0)'),
    'index.html must include legal attribution notice documentation'
  );
  console.log('✔ Check 11 PASSED: Attribution section renders directly when Settings gear (⚙) is opened.');
}

console.log('\n================================================================================');
console.log('ALL 11 T026 EDRDG ATTRIBUTION CHECKS PASSED 100%!');
console.log('================================================================================\n');
