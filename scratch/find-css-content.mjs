import fs from 'fs';

const files = fs.readdirSync('.').filter(f => f.endsWith('.css'));
for (const f of files) {
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, lineNo) => {
    if (line.includes('content:')) {
      const trimmed = line.trim();
      if (!trimmed.includes('content:""') && !trimmed.includes('content: ""') &&
          !trimmed.includes("content:''") && !trimmed.includes("content: ''") &&
          !trimmed.includes('content:none') && !trimmed.includes('content: none')) {
        console.log(`${f}:${lineNo + 1}: ${trimmed}`);
      }
    }
  });
}
