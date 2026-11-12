// scratch/patch-app-t012.mjs
import fs from 'node:fs';

const raw = fs.readFileSync('app.js', 'utf8');
const isCrlf = raw.includes('\r\n');
const eol = isCrlf ? '\r\n' : '\n';

// 1. Target 1: optHTML rendering in renderExam()
const target1 = `  const optHTML = (q.options || []).map((o, i) => {
    const selected = s.answers[q.id] === i;
    const optTrans = String(o.translation || '').trim();
    const m = getOptionMedia(q, o, i);
    const letter = String.fromCharCode(65 + i);
    return \`
      <div role="radio" tabindex="0" class="answer-choice \${selected ? 'selected' : ''}" data-action="answer" data-index="\${i}" aria-checked="\${selected}" aria-pressed="\${selected}">
        <span class="answer-letter">\${letter}</span>
        <div class="answer-content">
          \${o.text ? \`<div class="answer-text rich-content" lang="ja">\${richHTML(o.text)}</div>\` : ''}
          \${isUntimedPractice && state.practiceTranslationOpen && optTrans ? \`<span class="practice-option-translation" lang="id">\${richHTML(optTrans)}</span>\` : ''}
          \${m ? \`<img class="answer-image" src="\${mediaURL(m)}" alt="Option \${letter}">\` : ''}
        </div>
        <span class="answer-radio" aria-hidden="true"></span>
      </div>\`;
  }).join('');`;

const replace1 = [
  '  const optHTML = (q.options || []).map((o, i) => {',
  '    const selected = s.answers[q.id] === i;',
  "    const optTrans = String(o.translation || '').trim();",
  '    const m = getOptionMedia(q, o, i);',
  '    const letter = String.fromCharCode(65 + i);',
  "    const optKey = isUntimedPractice ? getOptionKey(q.id, o) : '';",
  '    const optSelState = isUntimedPractice ? getSelectiveOptionState(s, q.id, optKey, false) : null;',
  '    const isOptTransOpen = isUntimedPractice',
  '      ? (optSelState?.translation !== null && optSelState?.translation !== undefined',
  '          ? Boolean(optSelState.translation)',
  '          : Boolean(state.practiceTranslationOpen))',
  '      : false;',
  '',
  '    const answerChoiceHTML = `',
  '      <div role="radio" tabindex="0" class="answer-choice ${selected ? \'selected\' : \'\'}" data-action="answer" data-index="${i}" aria-checked="${selected}" aria-pressed="${selected}">',
  '        <span class="answer-letter">${letter}</span>',
  '        <div class="answer-content">',
  '          ${o.text ? `<div class="answer-text rich-content" lang="ja">${richHTML(o.text)}</div>` : \'\'}',
  '          ${isOptTransOpen && optTrans ? `<span class="practice-option-translation" lang="id">${richHTML(optTrans)}</span>` : \'\'}',
  '          ${m ? `<img class="answer-image" src="${mediaURL(m)}" alt="Option ${letter}">` : \'\'}',
  '        </div>',
  '        <span class="answer-radio" aria-hidden="true"></span>',
  '      </div>`;',
  '',
  '    if (!isUntimedPractice) {',
  '      return answerChoiceHTML;',
  '    }',
  '',
  '    return `',
  '      <div class="practice-option-row">',
  '        <button type="button"',
  '                class="practice-row-ctrl practice-ctrl-trans ${isOptTransOpen ? \'is-active\' : \'\'}"',
  '                data-action="toggle-selective-trans"',
  '                data-target-type="option"',
  '                data-opt-key="${esc(optKey)}"',
  '                aria-expanded="${Boolean(isOptTransOpen)}"',
  '                aria-label="Terjemahan Opsi ${letter}"',
  '                title="${isOptTransOpen ? \'Sembunyikan terjemahan opsi\' : \'Tampilkan terjemahan opsi\'}">',
  '          <svg class="practice-ctrl-icon" viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">',
  '            <path d="M2 3h12M8 3v10M5 13h6"/>',
  '          </svg>',
  '        </button>',
  '        ${answerChoiceHTML}',
  '        <span class="practice-row-slot" aria-hidden="true"></span>',
  '      </div>`;',
  "  }).join('');"
].join(eol);

const target1WithEol = target1.split('\n').map(l => l.replace(/\r$/, '')).join(eol);
if (!raw.includes(target1WithEol)) throw new Error('Target 1 not found');

// 2. Target 2: question-prompt rendering in question-card
const target2 = `            <div class="question-instruction rich-content" lang="ja">\${richHTML(q.instructions || '<ruby>正<rt>ただ</rt></ruby>しいものを<ruby>一<rt>ひと</rt></ruby>つ<ruby>選<rt>えら</rt></ruby>びなさい。')}</div>
            <div class="question-prompt rich-content" lang="ja">\${richHTML(cleanExamPrompt(q.prompt))}</div>
            \${isUntimedPractice && state.practiceTranslationOpen && promptTrans ? \`<div class="practice-question-translation" lang="id">\${richHTML(promptTrans)}</div>\` : ''}`;

const replace2 = [
  '            <div class="question-instruction rich-content" lang="ja">${richHTML(q.instructions || \'<ruby>正<rt>ただ</rt></ruby>しいものを<ruby>一<rt>ひと</rt></ruby>つ<ruby>選<rt>えら</rt></ruby>びなさい。\')}</div>',
  '            ${isUntimedPractice ? `',
  '            <div class="practice-prompt-row">',
  '              <button type="button"',
  '                      class="practice-row-ctrl practice-ctrl-trans ${isPromptTransOpen ? \'is-active\' : \'\'}"',
  '                      data-action="toggle-selective-trans"',
  '                      data-target-type="prompt"',
  '                      aria-expanded="${Boolean(isPromptTransOpen)}"',
  '                      aria-label="Terjemahan Kalimat Soal"',
  '                      title="${isPromptTransOpen ? \'Sembunyikan terjemahan soal\' : \'Tampilkan terjemahan soal\'}">',
  '                <svg class="practice-ctrl-icon" viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">',
  '                  <path d="M2 3h12M8 3v10M5 13h6"/>',
  '                </svg>',
  '              </button>',
  '              <div class="practice-prompt-center">',
  '                <div class="question-prompt rich-content" lang="ja">${richHTML(cleanExamPrompt(q.prompt))}</div>',
  '                ${isPromptTransOpen && promptTrans ? `<div class="practice-question-translation" lang="id">${richHTML(promptTrans)}</div>` : \'\'}',
  '              </div>',
  '              <span class="practice-row-slot" aria-hidden="true"></span>',
  '            </div>` : `',
  '            <div class="question-prompt rich-content" lang="ja">${richHTML(cleanExamPrompt(q.prompt))}</div>',
  '            ${isUntimedPractice && state.practiceTranslationOpen && promptTrans ? `<div class="practice-question-translation" lang="id">${richHTML(promptTrans)}</div>` : \'\'}`}'
].join(eol);

const target2WithEol = target2.split('\n').map(l => l.replace(/\r$/, '')).join(eol);
if (!raw.includes(target2WithEol)) throw new Error('Target 2 not found');

// 3. Target 3: Add prompt state computation right before promptTrans
const target3 = `  const inStudy = isQuestionInStudy(q);
  const promptTrans = String(q.promptTranslation || '').trim();`;

const replace3 = [
  '  const inStudy = isQuestionInStudy(q);',
  '  const promptTrans = String(q.promptTranslation || \'\').trim();',
  '  const qSelState = isUntimedPractice ? getSelectiveQuestionState(s, q.id, false) : null;',
  '  const isPromptTransOpen = isUntimedPractice',
  '    ? (qSelState?.translation !== null && qSelState?.translation !== undefined',
  '        ? Boolean(qSelState.translation)',
  '        : Boolean(state.practiceTranslationOpen))',
  '    : false;'
].join(eol);

const target3WithEol = target3.split('\n').map(l => l.replace(/\r$/, '')).join(eol);
if (!raw.includes(target3WithEol)) throw new Error('Target 3 not found');

let updated = raw.replace(target1WithEol, replace1);
updated = updated.replace(target3WithEol, replace3);
updated = updated.replace(target2WithEol, replace2);

fs.writeFileSync('app.js', updated, 'utf8');
console.log('T012 markup patch successfully applied to app.js');
