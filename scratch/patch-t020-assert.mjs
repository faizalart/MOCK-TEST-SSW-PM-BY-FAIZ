import fs from 'fs';
let content = fs.readFileSync('scratch/assert-t020-kotoba-ruby.mjs', 'utf8');

content = content.replace(
  "translation: 'Sebagai prinsip manajemen kesehatan, pilihlah satu yang paling tepat.',",
  "promptTranslation: 'Sebagai prinsip manajemen kesehatan, pilihlah satu yang paling tepat.',\n        translation: 'Sebagai prinsip manajemen kesehatan, pilihlah satu yang paling tepat.',"
);

fs.writeFileSync('scratch/assert-t020-kotoba-ruby.mjs', content, 'utf8');
console.log('Updated mock session in assert-t020-kotoba-ruby.mjs');
