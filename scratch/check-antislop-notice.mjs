import fs from 'fs';

const log = fs.readFileSync('C:/Users/Admin/.gemini/antigravity/brain/d27ebec7-1c6f-4a08-9700-b5f26bb90bdd/.system_generated/logs/transcript.jsonl', 'utf8');
const lines = log.split('\n');
for (const l of lines) {
  if (l.includes('antislop active:')) {
    const obj = JSON.parse(l);
    console.log('Role:', obj.source, 'Content:', obj.content?.slice(0, 100));
  }
}
