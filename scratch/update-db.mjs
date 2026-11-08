import fs from 'fs';

let content = fs.readFileSync('db.js', 'utf8');

content = content.replace('const DB_VERSION = 1;', 'const DB_VERSION = 2;');
content = content.replace(
  "const STORES = ['questions', 'themes', 'passages', 'sessions', 'meta', 'audioGroups'];",
  "const STORES = ['questions', 'themes', 'passages', 'sessions', 'meta', 'audioGroups', 'studyList'];"
);
content = content.replace(
  /audioGroups:\s*new\s*Map\(\)\s*};/,
  'audioGroups: new Map(),\n  studyList: new Map()\n};'
);
content = content.replace(
  "if (!db.objectStoreNames.contains('audioGroups')) db.createObjectStore('audioGroups', { keyPath: 'id' });",
  "if (!db.objectStoreNames.contains('audioGroups')) db.createObjectStore('audioGroups', { keyPath: 'id' });\n        if (!db.objectStoreNames.contains('studyList')) db.createObjectStore('studyList', { keyPath: 'id' });"
);

fs.writeFileSync('db.js', content, 'utf8');
console.log('db.js updated successfully!');
