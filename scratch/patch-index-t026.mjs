// scratch/patch-index-t026.mjs
import fs from 'node:fs';

const htmlPath = 'index.html';
let htmlSource = fs.readFileSync(htmlPath, 'utf8');

const targetStr = `  <!-- MAIN JAVASCRIPT -->
  <script type="module" src="./app.js?v=ssw28"></script>`;

const isCRLF = htmlSource.includes('\r\n');
const target = isCRLF ? targetStr.replace(/\n/g, '\r\n') : targetStr;

const replacement = `  <!-- EDRDG & JMdict Attribution Section (CC BY-SA 4.0)
       This application uses data from the JMdict dictionary file.
       The JMdict data is the property of the Electronic Dictionary Research and Development Group (EDRDG)
       and is used in accordance with the Group's licence: https://www.edrdg.org/edrdg/licence.html
       Vocabulary project: https://www.edrdg.org/wiki/index.php/JMdict-EDICT_Dictionary_Project
       License terms: https://creativecommons.org/licenses/by-sa/4.0/legalcode
       Interactive user-facing attribution is mounted in the Exam Settings Modal (⚙). -->

  <!-- MAIN JAVASCRIPT -->
  <script type="module" src="./app.js?v=ssw28"></script>`;

const formattedReplacement = isCRLF ? replacement.replace(/\n/g, '\r\n') : replacement;

if (!htmlSource.includes(target)) {
  console.error('Target not found in index.html!');
  process.exit(1);
}

htmlSource = htmlSource.replace(target, formattedReplacement);
fs.writeFileSync(htmlPath, htmlSource, 'utf8');
console.log('Successfully patched index.html with EDRDG attribution notice');
