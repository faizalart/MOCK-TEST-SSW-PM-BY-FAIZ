import fs from 'fs';

const app = fs.readFileSync('app.js', 'utf8');

const start = app.indexOf('const I18N = {');
const end = app.indexOf('};\n\nfunction loadLang()');
const i18nCode = app.slice(start, end + 2);
eval(i18nCode.replace('const I18N =', 'global.I18N ='));

const en = global.I18N.en;
const ja = global.I18N.ja;

console.log('EN navStudy:', en.navStudy);
console.log('JA navStudy:', ja.navStudy);
console.log('EN revFilterAll:', en.revFilterAll);
console.log('JA revFilterAll:', ja.revFilterAll);
console.log('EN revTagCorrect:', en.revTagCorrect);
console.log('JA revTagCorrect:', ja.revTagCorrect);
console.log('EN resKicker:', en.resKicker);
console.log('JA resKicker:', ja.resKicker);
