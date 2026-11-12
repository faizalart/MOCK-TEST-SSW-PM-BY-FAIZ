import fs from 'node:fs';

const appPath = 'app.js';
let content = fs.readFileSync(appPath, 'utf8');

// Normalize line endings to detect pattern reliably, then restore
const isCRLF = content.includes('\r\n');
const normalized = content.replace(/\r\n/g, '\n');

// 1. Replace option row slot
const optTarget = `        \${answerChoiceHTML}
        <span class="practice-row-slot" aria-hidden="true"></span>`;

const optReplacement = `        \${answerChoiceHTML}
        <button type="button"
                class="practice-row-ctrl practice-ctrl-kotoba \${isOptKotobaOpen ? 'is-active' : ''}"
                data-action="toggle-selective-kotoba"
                data-target-type="option"
                data-opt-key="\${esc(optKey)}"
                aria-expanded="\${Boolean(isOptKotobaOpen)}"
                aria-label="Kosakata Opsi \${letter}"
                title="\${isOptKotobaOpen ? 'Sembunyikan kosakata opsi' : 'Tampilkan kosakata opsi'}">
          <svg class="practice-ctrl-icon" viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M2.5 3.5h11v9h-11zM6 3.5v9M2.5 8h11"/>
          </svg>
        </button>`;

if (!normalized.includes(optTarget)) {
  console.error('ERROR: optTarget not found in app.js');
  process.exit(1);
}

const afterOpt = normalized.replace(optTarget, optReplacement);

// 2. Replace prompt row slot
const promptTarget = `              <div class="practice-prompt-center">
                <div class="question-prompt rich-content" lang="ja">\${richHTML(cleanExamPrompt(q.prompt))}</div>
                \${isPromptTransOpen && promptTrans ? \`<div class="practice-question-translation" lang="id">\${richHTML(promptTrans)}</div>\` : ''}
              </div>
              <span class="practice-row-slot" aria-hidden="true"></span>`;

const promptReplacement = `              <div class="practice-prompt-center">
                <div class="question-prompt rich-content" lang="ja">\${richHTML(cleanExamPrompt(q.prompt))}</div>
                \${isPromptTransOpen && promptTrans ? \`<div class="practice-question-translation" lang="id">\${richHTML(promptTrans)}</div>\` : ''}
              </div>
              <button type="button"
                      class="practice-row-ctrl practice-ctrl-kotoba \${isPromptKotobaOpen ? 'is-active' : ''}"
                      data-action="toggle-selective-kotoba"
                      data-target-type="prompt"
                      aria-expanded="\${Boolean(isPromptKotobaOpen)}"
                      aria-label="Kosakata Soal"
                      title="\${isPromptKotobaOpen ? 'Sembunyikan kosakata soal' : 'Tampilkan kosakata soal'}">
                <svg class="practice-ctrl-icon" viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M2.5 3.5h11v9h-11zM6 3.5v9M2.5 8h11"/>
                </svg>
              </button>`;

if (!afterOpt.includes(promptTarget)) {
  console.error('ERROR: promptTarget not found in app.js');
  process.exit(1);
}

const finalNormalized = afterOpt.replace(promptTarget, promptReplacement);
const finalContent = isCRLF ? finalNormalized.replace(/\n/g, '\r\n') : finalNormalized;

fs.writeFileSync(appPath, finalContent, 'utf8');
console.log('Successfully patched app.js with T016 Kotoba controls!');
