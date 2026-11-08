import fs from 'fs';

const app = fs.readFileSync('app.js', 'utf8');

const start = app.indexOf('const I18N = {');
const end = app.indexOf('};\n\nfunction loadLang()');
const i18nCode = app.slice(start, end + 2);
eval(i18nCode.replace('const I18N =', 'global.I18N ='));

const idObj = global.I18N.id;
const enObj = global.I18N.en;
const jaObj = global.I18N.ja;

const idKeys = Object.keys(idObj);

console.log('Total ID keys:', idKeys.length);

const missingEn = [];
const missingJa = [];

for (const k of idKeys) {
  if (enObj[k] === undefined) missingEn.push(k);
  if (jaObj[k] === undefined) missingJa.push(k);
}

console.log('Missing in EN (' + missingEn.length + '):', missingEn);
console.log('Missing in JA (' + missingJa.length + '):', missingJa);
