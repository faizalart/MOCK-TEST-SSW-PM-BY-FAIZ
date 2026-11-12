import fs from 'fs';
let content = fs.readFileSync('scratch/assert-t019-furigana-sync.mjs', 'utf8');

content = content.replace(
  `  let renderExamCallCount = 0;
  const originalRenderExam = renderExam;
  function trackedRenderExam() {
    renderExamCallCount++;
    return originalRenderExam();
  }`,
  `  let renderExamCallCount = 0;
  const origRender = renderExam;
  function trackedRenderExam() {
    renderExamCallCount++;
    return origRender();
  }`
);

content = content.replace(
  `  return {
    applyExamPrefs,
    renderExam,`,
  `  return {
    applyExamPrefs,
    renderExam: trackedRenderExam,`
);

fs.writeFileSync('scratch/assert-t019-furigana-sync.mjs', content, 'utf8');
console.log('Fixed renderExam tracking in assert-t019-furigana-sync.mjs');
