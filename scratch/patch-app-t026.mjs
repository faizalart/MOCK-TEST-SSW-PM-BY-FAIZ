// scratch/patch-app-t026.mjs
import fs from 'node:fs';

const appPath = 'app.js';
let appSource = fs.readFileSync(appPath, 'utf8');

const targetStr = `        <div class="exam-setting-row exam-fullscreen-info">
          <div class="exam-slider-head">
            <strong>\${esc(t('setFsTitle'))}</strong>
            <span id="exam-settings-fs-status" class="status \${fsActive ? 'status-on' : 'status-neutral'}">\${esc(fsActive ? t('setFsActive') : t('setFsInactive'))}</span>
          </div>
          <p class="exam-fs-hint">\${esc(t('setFsHint'))}</p>
          <button type="button" class="button button-small button-outline button-wide" data-action="toggle-fullscreen">
            <span class="fs-icon">\${fsActive ? '🗗' : '⛶'}</span>
            <span class="fs-label">\${esc(fsActive ? t('setFsActive') : t('setFsTitle'))}</span>
          </button>
        </div>
      </div>`;

const isCRLF = appSource.includes('\r\n');
const target = isCRLF ? targetStr.replace(/\n/g, '\r\n') : targetStr;

if (!appSource.includes(target)) {
  console.error('Target not found in app.js!');
  process.exit(1);
}

const replacement = `        <div class="exam-setting-row exam-fullscreen-info">
          <div class="exam-slider-head">
            <strong>\${esc(t('setFsTitle'))}</strong>
            <span id="exam-settings-fs-status" class="status \${fsActive ? 'status-on' : 'status-neutral'}">\${esc(fsActive ? t('setFsActive') : t('setFsInactive'))}</span>
          </div>
          <p class="exam-fs-hint">\${esc(t('setFsHint'))}</p>
          <button type="button" class="button button-small button-outline button-wide" data-action="toggle-fullscreen">
            <span class="fs-icon">\${fsActive ? '🗗' : '⛶'}</span>
            <span class="fs-label">\${esc(fsActive ? t('setFsActive') : t('setFsTitle'))}</span>
          </button>
        </div>

        <div class="exam-setting-row exam-attribution-section">
          <div class="exam-slider-head">
            <strong>Data Sources &amp; Licenses</strong>
          </div>
          <div class="exam-attribution-body">
            <p class="exam-attribution-lead">
              This application uses data from the <strong>JMdict</strong> dictionary file. The JMdict data is the property of the <strong>Electronic Dictionary Research and Development Group (EDRDG)</strong> and is used in accordance with the Group's <a href="https://www.edrdg.org/edrdg/licence.html" target="_blank" rel="noopener noreferrer">licence</a>.
            </p>
            <p class="exam-attribution-detail">
              The vocabulary dataset is derived from the <a href="https://www.edrdg.org/wiki/index.php/JMdict-EDICT_Dictionary_Project" target="_blank" rel="noopener noreferrer">JMdict Project</a>, matched to SSW Food Processing (飲食料品製造業) requirements, and enriched with in-house curated Indonesian definitions released under <a href="https://creativecommons.org/licenses/by-sa/4.0/legalcode" target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a>. The application software, CBT scoring engine, and platform code remain separate proprietary works.
            </p>
          </div>
        </div>
      </div>`;

const formattedReplacement = isCRLF ? replacement.replace(/\n/g, '\r\n') : replacement;
appSource = appSource.replace(target, formattedReplacement);
fs.writeFileSync(appPath, appSource, 'utf8');
console.log('Successfully patched app.js with EDRDG attribution section');
