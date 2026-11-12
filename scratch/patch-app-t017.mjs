import fs from 'node:fs';

const appPath = 'app.js';
let content = fs.readFileSync(appPath, 'utf8');
const isCRLF = content.includes('\r\n');
const normalized = content.replace(/\r\n/g, '\n');

// 1. Insert production functions before renderExamSettingsPopover()
const popoverTarget = `function renderExamSettingsPopover() {`;

const productionFunctions = `/* ==========================================================================
   FEATURE 008: Production Kotoba Data Loader, Resolver & Viewer (Task T017)
   ========================================================================== */
let kotobaMappingCache = null;
let kotobaDictionaryCache = null;
let kotobaLoadingPromise = null;

function setKotobaData(mappingData = null, dictData = null) {
  if (mappingData && typeof mappingData === 'object') {
    kotobaMappingCache = mappingData;
  }
  if (dictData && typeof dictData === 'object') {
    kotobaDictionaryCache = dictData;
  }
}

async function ensureKotobaDataLoaded() {
  if (kotobaMappingCache && kotobaDictionaryCache) {
    return { mapping: kotobaMappingCache, dictionary: kotobaDictionaryCache };
  }
  if (kotobaLoadingPromise) return kotobaLoadingPromise;

  kotobaLoadingPromise = (async () => {
    try {
      const [mappingData, dictData] = await Promise.all([
        fetchBuiltinJson('kotobaMapping.json'),
        fetchBuiltinJson('sharedKotobaDictionary.json')
      ]);
      if (mappingData && mappingData.questions) {
        kotobaMappingCache = mappingData;
      }
      if (dictData && dictData.terms) {
        kotobaDictionaryCache = dictData;
      }
    } catch (err) {
      console.warn('Gagal memuat dataset Kotoba:', err);
    } finally {
      kotobaLoadingPromise = null;
    }
    return { mapping: kotobaMappingCache, dictionary: kotobaDictionaryCache };
  })();

  return kotobaLoadingPromise;
}

/**
 * Resolves verified Kotoba entries from shared dictionary and mapping.
 *
 * @param {string|string[]} target - Question ID string OR array of term ID strings
 * @param {object|string|null} [optOrKey=null] - Option object, composite key, original option ID, or null
 * @param {object|null} [dictOverride=null] - Optional dictionary override
 * @param {object|null} [mappingOverride=null] - Optional mapping override
 * @returns {Array<{id: string, kanji: string, furigana: string, arti: string, status: string}>}
 */
function resolveKotobaEntries(target, optOrKey = null, dictOverride = null, mappingOverride = null) {
  const dict = dictOverride || (typeof window !== 'undefined' && window.sharedKotobaDictionary) || kotobaDictionaryCache;
  if (!dict || !dict.terms || typeof dict.terms !== 'object') return [];

  let termIds = [];

  if (Array.isArray(target)) {
    termIds = target;
  } else if (typeof target === 'string' && target.trim()) {
    const qId = target.trim();
    const mapping = mappingOverride || (typeof window !== 'undefined' && window.kotobaMapping) || kotobaMappingCache;
    if (!mapping) return [];

    if (!optOrKey) {
      // Prompt context
      termIds = Array.isArray(mapping.questions?.[qId]) ? mapping.questions[qId] : [];
    } else {
      // Option context
      let origOptId = null;
      if (typeof optOrKey === 'object' && optOrKey !== null) {
        origOptId = (optOrKey.originalId != null && String(optOrKey.originalId).trim())
          ? String(optOrKey.originalId).trim()
          : (optOrKey.id != null && String(optOrKey.id).trim() ? String(optOrKey.id).trim() : null);
      } else if (typeof optOrKey === 'string' && optOrKey.trim()) {
        const cleanStr = optOrKey.trim();
        origOptId = cleanStr.includes('::') ? cleanStr.split('::').pop() : cleanStr;
      }

      if (!origOptId) return [];

      const compositeKey = \`\${qId}::\${origOptId}\`;
      termIds = Array.isArray(mapping.byCompositeKey?.[compositeKey])
        ? mapping.byCompositeKey[compositeKey]
        : (Array.isArray(mapping.options?.[qId]?.[origOptId]) ? mapping.options[qId][origOptId] : []);
    }
  } else {
    return [];
  }

  if (!Array.isArray(termIds) || !termIds.length) return [];

  const seenIds = new Set();
  const results = [];

  for (const id of termIds) {
    if (!id || typeof id !== 'string') continue;
    const cleanId = id.trim();
    if (!cleanId || seenIds.has(cleanId)) continue;

    const entry = dict.terms[cleanId];
    if (entry && entry.status === 'verified') {
      seenIds.add(cleanId);
      results.push({
        id: String(entry.id || cleanId),
        kanji: String(entry.kanji || ''),
        furigana: String(entry.furigana || ''),
        arti: String(entry.arti || ''),
        status: entry.status
      });
    }
  }

  return results;
}

/**
 * Renders verified Kotoba entries into a minimal vertical list markup.
 * Term is wrapped in <ruby class="kotoba-ruby">\${kanji}<rt>\${furigana}</rt></ruby>
 * for zero-DOM-churn toolbar F synchronization.
 *
 * @param {Array<{id: string, kanji: string, furigana: string, arti: string}>} kotobaEntries
 * @returns {string} HTML string
 */
function renderKotobaList(kotobaEntries) {
  if (!Array.isArray(kotobaEntries) || !kotobaEntries.length) return '';
  return kotobaEntries.map(entry => \`
    <div class="practice-kotoba-item" data-term-id="\${esc(entry.id)}">
      <span class="kotoba-term-wrap">
        <ruby class="kotoba-ruby">\${esc(entry.kanji)}<rt>\${esc(entry.furigana || '')}</rt></ruby>
      </span>
      <span class="kotoba-separator" aria-hidden="true">—</span>
      <span class="kotoba-meaning" lang="id">\${esc(entry.arti || '')}</span>
    </div>
  \`).join('');
}

function renderExamSettingsPopover() {`;

if (!normalized.includes(popoverTarget)) {
  console.error('ERROR: popoverTarget not found in app.js');
  process.exit(1);
}

let patched = normalized.replace(popoverTarget, productionFunctions);

// 2. In renderExam(): Option rendering integration
const optContentTarget = `        <div class="answer-content">
          \${o.text ? \`<div class="answer-text rich-content" lang="ja">\${richHTML(o.text)}</div>\` : ''}
          \${isOptTransOpen && optTrans ? \`<span class="practice-option-translation" lang="id">\${richHTML(optTrans)}</span>\` : ''}
          \${m ? \`<img class="answer-image" src="\${mediaURL(m)}" alt="Option \${letter}">\` : ''}
        </div>`;

const optContentReplacement = `        <div class="answer-content">
          \${o.text ? \`<div class="answer-text rich-content" lang="ja">\${richHTML(o.text)}</div>\` : ''}
          \${isOptTransOpen && optTrans ? \`<span class="practice-option-translation" lang="id">\${richHTML(optTrans)}</span>\` : ''}
          \${isOptKotobaOpen && resolvedOptKotoba.length ? \`
          <div class="practice-kotoba-list practice-option-kotoba" lang="ja">
            \${renderKotobaList(resolvedOptKotoba)}
          </div>\` : ''}
          \${m ? \`<img class="answer-image" src="\${mediaURL(m)}" alt="Option \${letter}">\` : ''}
        </div>`;

if (!patched.includes(optContentTarget)) {
  console.error('ERROR: optContentTarget not found in app.js');
  process.exit(1);
}

// Also add resolvedOptKotoba declaration in options map
const optKotobaDeclTarget = `    const isOptKotobaOpen = isUntimedPractice ? Boolean(optSelState?.kotoba) : false;`;
const optKotobaDeclReplacement = `    const isOptKotobaOpen = isUntimedPractice ? Boolean(optSelState?.kotoba) : false;
    const resolvedOptKotoba = (isUntimedPractice && isOptKotobaOpen)
      ? resolveKotobaEntries(q.id, optKey || o)
      : [];`;

if (!patched.includes(optKotobaDeclTarget)) {
  console.error('ERROR: optKotobaDeclTarget not found in app.js');
  process.exit(1);
}

patched = patched.replace(optKotobaDeclTarget, optKotobaDeclReplacement);
patched = patched.replace(optContentTarget, optContentReplacement);

// 3. In renderExam(): Prompt rendering integration
const promptKotobaDeclTarget = `  const isPromptKotobaOpen = isUntimedPractice ? Boolean(qSelState?.kotoba) : false;`;
const promptKotobaDeclReplacement = `  const isPromptKotobaOpen = isUntimedPractice ? Boolean(qSelState?.kotoba) : false;
  const resolvedPromptKotoba = (isUntimedPractice && isPromptKotobaOpen)
    ? resolveKotobaEntries(q.id, null)
    : [];`;

if (!patched.includes(promptKotobaDeclTarget)) {
  console.error('ERROR: promptKotobaDeclTarget not found in app.js');
  process.exit(1);
}

const promptContentTarget = `              <div class="practice-prompt-center">
                <div class="question-prompt rich-content" lang="ja">\${richHTML(cleanExamPrompt(q.prompt))}</div>
                \${isPromptTransOpen && promptTrans ? \`<div class="practice-question-translation" lang="id">\${richHTML(promptTrans)}</div>\` : ''}
              </div>`;

const promptContentReplacement = `              <div class="practice-prompt-center">
                <div class="question-prompt rich-content" lang="ja">\${richHTML(cleanExamPrompt(q.prompt))}</div>
                \${isPromptTransOpen && promptTrans ? \`<div class="practice-question-translation" lang="id">\${richHTML(promptTrans)}</div>\` : ''}
                \${isPromptKotobaOpen && resolvedPromptKotoba.length ? \`
                <div class="practice-kotoba-list practice-question-kotoba" lang="ja">
                  \${renderKotobaList(resolvedPromptKotoba)}
                </div>\` : ''}
              </div>`;

if (!patched.includes(promptContentTarget)) {
  console.error('ERROR: promptContentTarget not found in app.js');
  process.exit(1);
}

patched = patched.replace(promptKotobaDeclTarget, promptKotobaDeclReplacement);
patched = patched.replace(promptContentTarget, promptContentReplacement);

// 4. In startExam(): Trigger background load of Kotoba data when entering practice mode
const startExamPracticeTarget = `  if (isPractice) {
    initSelectiveState(session);
  }`;

const startExamPracticeReplacement = `  if (isPractice) {
    initSelectiveState(session);
    ensureKotobaDataLoaded();
  }`;

if (patched.includes(startExamPracticeTarget)) {
  patched = patched.replace(startExamPracticeTarget, startExamPracticeReplacement);
}

// 5. In window exports
const windowExportTarget = `  window.resetSelectiveTranslationOverrides = resetSelectiveTranslationOverrides;`;
const windowExportReplacement = `  window.resetSelectiveTranslationOverrides = resetSelectiveTranslationOverrides;
  window.setKotobaData = setKotobaData;
  window.ensureKotobaDataLoaded = ensureKotobaDataLoaded;
  window.resolveKotobaEntries = resolveKotobaEntries;
  window.renderKotobaList = renderKotobaList;`;

if (!patched.includes(windowExportTarget)) {
  console.error('ERROR: windowExportTarget not found in app.js');
  process.exit(1);
}

patched = patched.replace(windowExportTarget, windowExportReplacement);

const finalContent = isCRLF ? patched.replace(/\n/g, '\r\n') : patched;
fs.writeFileSync(appPath, finalContent, 'utf8');
console.log('Successfully patched app.js for T017!');
