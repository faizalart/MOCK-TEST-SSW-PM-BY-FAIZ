import fs from 'fs';

// 1. Update app.js
let appSource = fs.readFileSync('app.js', 'utf8');

// Replace Option Row buttons (remove SVG icons)
const oldOptionTransBtn = `<button type="button"
                class="practice-row-ctrl practice-ctrl-trans \${isOptTransOpen ? 'is-active' : ''}"
                data-action="toggle-selective-trans"
                data-target-type="option"
                data-opt-key="\${esc(optKey)}"
                aria-expanded="\${Boolean(isOptTransOpen)}"
                aria-label="Terjemahan Opsi \${letter}"
                title="\${isOptTransOpen ? 'Sembunyikan terjemahan opsi' : 'Tampilkan terjemahan opsi'}">
          <svg class="practice-ctrl-icon" viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M2 3h12M8 3v10M5 13h6"/>
          </svg>
        </button>`;

const newOptionTransBtn = `<button type="button"
                class="practice-row-ctrl practice-ctrl-trans \${isOptTransOpen ? 'is-active' : ''}"
                data-action="toggle-selective-trans"
                data-target-type="option"
                data-opt-key="\${esc(optKey)}"
                aria-expanded="\${Boolean(isOptTransOpen)}"
                aria-label="Terjemahan Opsi \${letter}"
                title="\${isOptTransOpen ? 'Sembunyikan terjemahan opsi' : 'Tampilkan terjemahan opsi'}"></button>`;

const oldOptionKotobaBtn = `<button type="button"
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

const newOptionKotobaBtn = `<button type="button"
                class="practice-row-ctrl practice-ctrl-kotoba \${isOptKotobaOpen ? 'is-active' : ''}"
                data-action="toggle-selective-kotoba"
                data-target-type="option"
                data-opt-key="\${esc(optKey)}"
                aria-expanded="\${Boolean(isOptKotobaOpen)}"
                aria-label="Kosakata Opsi \${letter}"
                title="\${isOptKotobaOpen ? 'Sembunyikan kosakata opsi' : 'Tampilkan kosakata opsi'}"></button>`;

// Replace Prompt Row buttons (remove SVG icons)
const oldPromptTransBtn = `<button type="button"
                      class="practice-row-ctrl practice-ctrl-trans \${isPromptTransOpen ? 'is-active' : ''}"
                      data-action="toggle-selective-trans"
                      data-target-type="prompt"
                      aria-expanded="\${Boolean(isPromptTransOpen)}"
                      aria-label="Terjemahan Kalimat Soal"
                      title="\${isPromptTransOpen ? 'Sembunyikan terjemahan soal' : 'Tampilkan terjemahan soal'}">
                <svg class="practice-ctrl-icon" viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M2 3h12M8 3v10M5 13h6"/>
                </svg>
              </button>`;

const newPromptTransBtn = `<button type="button"
                      class="practice-row-ctrl practice-ctrl-trans \${isPromptTransOpen ? 'is-active' : ''}"
                      data-action="toggle-selective-trans"
                      data-target-type="prompt"
                      aria-expanded="\${Boolean(isPromptTransOpen)}"
                      aria-label="Terjemahan Kalimat Soal"
                      title="\${isPromptTransOpen ? 'Sembunyikan terjemahan soal' : 'Tampilkan terjemahan soal'}"></button>`;

const oldPromptKotobaBtn = `<button type="button"
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

const newPromptKotobaBtn = `<button type="button"
                      class="practice-row-ctrl practice-ctrl-kotoba \${isPromptKotobaOpen ? 'is-active' : ''}"
                      data-action="toggle-selective-kotoba"
                      data-target-type="prompt"
                      aria-expanded="\${Boolean(isPromptKotobaOpen)}"
                      aria-label="Kosakata Soal"
                      title="\${isPromptKotobaOpen ? 'Sembunyikan kosakata soal' : 'Tampilkan kosakata soal'}"></button>`;

// Normalize newlines for reliable replacement
appSource = appSource.replace(/\r\n/g, '\n');
const normOldOptionTrans = oldOptionTransBtn.replace(/\r\n/g, '\n');
const normNewOptionTrans = newOptionTransBtn.replace(/\r\n/g, '\n');
const normOldOptionKotoba = oldOptionKotobaBtn.replace(/\r\n/g, '\n');
const normNewOptionKotoba = newOptionKotobaBtn.replace(/\r\n/g, '\n');
const normOldPromptTrans = oldPromptTransBtn.replace(/\r\n/g, '\n');
const normNewPromptTrans = newPromptTransBtn.replace(/\r\n/g, '\n');
const normOldPromptKotoba = oldPromptKotobaBtn.replace(/\r\n/g, '\n');
const normNewPromptKotoba = newPromptKotobaBtn.replace(/\r\n/g, '\n');

if (appSource.includes(normOldOptionTrans)) {
  appSource = appSource.replace(normOldOptionTrans, normNewOptionTrans);
  console.log('✓ Replaced Option Trans button in app.js');
} else {
  console.warn('⚠ Could not find old Option Trans button in app.js');
}

if (appSource.includes(normOldOptionKotoba)) {
  appSource = appSource.replace(normOldOptionKotoba, normNewOptionKotoba);
  console.log('✓ Replaced Option Kotoba button in app.js');
} else {
  console.warn('⚠ Could not find old Option Kotoba button in app.js');
}

if (appSource.includes(normOldPromptTrans)) {
  appSource = appSource.replace(normOldPromptTrans, normNewPromptTrans);
  console.log('✓ Replaced Prompt Trans button in app.js');
} else {
  console.warn('⚠ Could not find old Prompt Trans button in app.js');
}

if (appSource.includes(normOldPromptKotoba)) {
  appSource = appSource.replace(normOldPromptKotoba, normNewPromptKotoba);
  console.log('✓ Replaced Prompt Kotoba button in app.js');
} else {
  console.warn('⚠ Could not find old Prompt Kotoba button in app.js');
}

fs.writeFileSync('app.js', appSource, 'utf8');

// 2. Update ZEN-APP-SHELL.css
let zenCss = fs.readFileSync('ZEN-APP-SHELL.css', 'utf8').replace(/\r\n/g, '\n');

const cssStartMarker = '/* ==========================================================================\n   FEATURE 008: 3-Column Sibling Grid Layout (Task T022)';
const cssEndMarker = '/* ==========================================================================\n   FEATURE 008: Vertical Content Stacking & Minimalist Kotoba List (Task T025)';

const startIndex = zenCss.indexOf(cssStartMarker);
const endIndex = zenCss.indexOf(cssEndMarker);

if (startIndex !== -1 && endIndex !== -1) {
  const replacementCss = `/* ==========================================================================
   FEATURE 008: Integrated Single-Card Interaction Zones (Design Correction)
   ONE EXISTING CARD = ONE VISUAL SURFACE.
   - Question prompt & answer choices retain their original single-card appearance.
   - Three interaction zones inside each card:
     * LEFT ZONE: Translation trigger (min 44px touch target)
     * CENTER ZONE: Original Answer selection / Prompt content
     * RIGHT ZONE: Kotoba vocabulary trigger (min 44px touch target)
   - Zero visible square button boxes, borders, or extra containers.
   - Zero visible T or table/grid icons.
   ========================================================================== */

/* Prompt Card Integration */
.exam-workspace .question-card {
  position: relative !important;
}

.practice-prompt-row {
  display: block !important;
  position: static !important;
  width: 100% !important;
  margin: 0 !important;
  padding: 0 !important;
  background: transparent !important;
  border: none !important;
  box-sizing: border-box !important;
}

.practice-prompt-center {
  min-width: 0 !important;
  width: 100% !important;
  box-sizing: border-box !important;
  display: flex !important;
  flex-direction: column !important;
  padding-left: 36px !important;
  padding-right: 58px !important;
}

.exam-workspace .question-card .question-instruction {
  padding-left: 36px !important;
  padding-right: 58px !important;
  box-sizing: border-box !important;
}

.practice-prompt-row .practice-ctrl-trans {
  position: absolute !important;
  left: 0 !important;
  top: 0 !important;
  bottom: 0 !important;
  width: 44px !important;
  min-width: 44px !important;
  min-height: 44px !important;
  z-index: 2 !important;
}

.practice-prompt-row .practice-ctrl-kotoba {
  position: absolute !important;
  right: 0 !important;
  top: 0 !important;
  bottom: 0 !important;
  width: 58px !important;
  min-width: 44px !important;
  min-height: 44px !important;
  z-index: 2 !important;
}

/* Option Card Integration */
.practice-option-row {
  position: relative !important;
  display: block !important;
  width: 100% !important;
  margin: 0 !important;
  padding: 0 !important;
  background: transparent !important;
  border: none !important;
  box-sizing: border-box !important;
}

.practice-option-row .answer-choice {
  min-width: 0 !important;
  width: 100% !important;
  margin: 0 !important;
  box-sizing: border-box !important;
  padding-left: 44px !important;
  padding-right: 58px !important;
}

.practice-option-row .practice-ctrl-trans {
  position: absolute !important;
  left: 1px !important;
  top: 1px !important;
  bottom: 1px !important;
  width: 44px !important;
  min-width: 44px !important;
  min-height: 44px !important;
  z-index: 2 !important;
}

.practice-option-row .practice-ctrl-kotoba {
  position: absolute !important;
  right: 1px !important;
  top: 1px !important;
  bottom: 1px !important;
  width: 58px !important;
  min-width: 44px !important;
  min-height: 44px !important;
  z-index: 2 !important;
}

/* Base Integrated Controls Styling (Zero Borders, Zero Background Boxes, Zero Icons) */
.practice-row-ctrl,
.practice-ctrl-trans,
.practice-ctrl-kotoba {
  display: block !important;
  padding: 0 !important;
  margin: 0 !important;
  box-sizing: border-box !important;
  background: transparent !important;
  border: none !important;
  border-radius: 0 !important;
  cursor: pointer !important;
  box-shadow: none !important;
  transition: background 0.12s ease !important;
}

.practice-row-ctrl .practice-ctrl-icon {
  display: none !important;
}

.practice-row-ctrl:focus-visible {
  outline: 2px solid #a9d16b !important;
  outline-offset: -2px !important;
}

/* Active Open States (Subtle Background While Panel Is Open) */
.practice-ctrl-trans.is-active {
  background: rgba(99, 140, 41, 0.08) !important;
}

.practice-ctrl-kotoba.is-active {
  background: rgba(0, 0, 0, 0.05) !important;
}

/* Desktop Hover Interaction (Scoped strictly to hover: hover and pointer: fine) */
@media (hover: hover) and (pointer: fine) {
  .practice-ctrl-trans:hover {
    background: rgba(99, 140, 41, 0.12) !important;
  }

  .practice-ctrl-kotoba:hover {
    background: rgba(0, 0, 0, 0.06) !important;
  }

  .practice-ctrl-kotoba.is-active:hover {
    background: rgba(0, 0, 0, 0.08) !important;
  }
}

/* Touchscreen Feedback (Transient :active state, No Sticky Hover) */
.practice-ctrl-trans:active {
  background: rgba(99, 140, 41, 0.22) !important;
}

.practice-ctrl-kotoba:active {
  background: rgba(0, 0, 0, 0.12) !important;
}

@media (hover: none) and (pointer: coarse) {
  .practice-ctrl-trans:active {
    background: rgba(99, 140, 41, 0.22) !important;
  }

  .practice-ctrl-kotoba:active {
    background: rgba(0, 0, 0, 0.12) !important;
  }
}

`;

  zenCss = zenCss.substring(0, startIndex) + replacementCss + zenCss.substring(endIndex);
  fs.writeFileSync('ZEN-APP-SHELL.css', zenCss, 'utf8');
  console.log('✓ Successfully updated ZEN-APP-SHELL.css');
} else {
  console.error('✗ Markers not found in ZEN-APP-SHELL.css', { startIndex, endIndex });
}
