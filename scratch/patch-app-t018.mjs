import fs from 'fs';
import path from 'path';

const appPath = path.resolve('app.js');
let content = fs.readFileSync(appPath, 'utf8');

// 1. Add toggleSelectiveKotoba after resetSelectiveTranslationOverrides
const targetFunction = `function resetSelectiveTranslationOverrides(s = activeExam()) {
  if (!s || !s.selectiveState || !s.selectiveState.questions) return;
  for (const qId of Object.keys(s.selectiveState.questions)) {
    const qState = s.selectiveState.questions[qId];
    if (!qState) continue;
    qState.translation = null;
    if (qState.options) {
      for (const optKey of Object.keys(qState.options)) {
        const optState = qState.options[optKey];
        if (optState) {
          optState.translation = null;
        }
      }
    }
  }
}`;

const kotobaToggleFunction = `

/* ==========================================================================
   FEATURE 008: Selective Kotoba Toggle Handler (Task T018)
   ========================================================================== */
function toggleSelectiveKotoba(s = activeExam(), qId, optKey = null) {
  if (!s || s.mode !== 'practice' || s.deadline || s.timed) return null;
  if (!qId) return null;

  if (optKey !== null && optKey !== undefined) {
    if (typeof optKey === 'string' && !optKey.trim()) return null;
    const optState = getSelectiveOptionState(s, qId, optKey, true);
    if (!optState) return null;
    optState.kotoba = !Boolean(optState.kotoba);
    return optState.kotoba;
  }

  const qState = getSelectiveQuestionState(s, qId, true);
  if (!qState) return null;
  qState.kotoba = !Boolean(qState.kotoba);
  return qState.kotoba;
}`;

// Normalize line endings for replacement
const normalize = s => s.replace(/\r\n/g, '\n');
const isCRLF = content.includes('\r\n');

let normalizedContent = normalize(content);
const normalizedTarget = normalize(targetFunction);

if (!normalizedContent.includes(normalizedTarget)) {
  console.error('ERROR: Could not find resetSelectiveTranslationOverrides target in app.js');
  process.exit(1);
}

normalizedContent = normalizedContent.replace(
  normalizedTarget,
  normalizedTarget + normalize(kotobaToggleFunction)
);

// 2. Add case 'toggle-selective-kotoba': in handleAction
const targetCase = `    case 'toggle-selective-trans': {
      const s = activeExam();
      const isUntimedPractice = Boolean(s && s.mode === 'practice' && !s.deadline && !s.timed);
      if (!isUntimedPractice) break;
      const q = currentExamQuestion(s);
      if (!q) break;
      const targetType = el.dataset.targetType;
      const optKey = targetType === 'option' ? (el.dataset.optKey || null) : null;
      toggleSelectiveTrans(s, q.id, optKey);
      renderExam();
      break;
    }`;

const kotobaCase = `
    case 'toggle-selective-kotoba': {
      const s = activeExam();
      const isUntimedPractice = Boolean(s && s.mode === 'practice' && !s.deadline && !s.timed);
      if (!isUntimedPractice) break;
      const q = currentExamQuestion(s);
      if (!q) break;
      const targetType = el.dataset.targetType;
      const optKey = targetType === 'option' ? (el.dataset.optKey || null) : null;
      if (targetType === 'option' && !optKey) break;
      if (targetType !== 'option' && targetType !== 'prompt') break;

      toggleSelectiveKotoba(s, q.id, optKey);

      if (typeof ensureKotobaDataLoaded === 'function') {
        try {
          await ensureKotobaDataLoaded();
        } catch (e) {
          // Gracefully continue even if data loading fails
        }
      }
      renderExam();
      break;
    }`;

const normalizedCaseTarget = normalize(targetCase);
if (!normalizedContent.includes(normalizedCaseTarget)) {
  console.error('ERROR: Could not find toggle-selective-trans case target in handleAction');
  process.exit(1);
}

normalizedContent = normalizedContent.replace(
  normalizedCaseTarget,
  normalizedCaseTarget + normalize(kotobaCase)
);

// 3. Add window export
const targetExport = `  window.renderKotobaList = renderKotobaList;`;
const kotobaExport = `\n  window.toggleSelectiveKotoba = toggleSelectiveKotoba;`;

const normalizedExportTarget = normalize(targetExport);
if (!normalizedContent.includes(normalizedExportTarget)) {
  console.error('ERROR: Could not find window.renderKotobaList export target');
  process.exit(1);
}

normalizedContent = normalizedContent.replace(
  normalizedExportTarget,
  normalizedExportTarget + normalize(kotobaExport)
);

// Restore CRLF if file was CRLF
const finalContent = isCRLF ? normalizedContent.replace(/\n/g, '\r\n') : normalizedContent;
fs.writeFileSync(appPath, finalContent, 'utf8');
console.log('SUCCESS: app.js patched for T018');
