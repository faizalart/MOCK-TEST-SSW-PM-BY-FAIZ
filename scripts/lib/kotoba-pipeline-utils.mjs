import fs from 'node:fs';
import path from 'node:path';

export const CANONICAL_PACKAGES = [
  'ssw-pm-kunci-ujian-1.json',
  'ssw-pm-kunci-ujian-2.json',
  'ssw-pm-special-lab-bundle.json',
  'ssw-pm-tipe2-nguyen1.json',
  'ssw-pm-bonus-soal-1-to-10-bundle.json',
  'ssw-pm-all-kunci-ujian-3-to-13.json'
];

export const DEFAULT_DICT_PATH = 'data/sharedKotobaDictionary.json';
export const DEFAULT_MAPPING_PATH = 'data/kotobaMapping.json';
export const AUDIT_DIR = 'specs/009-cbt-shortcuts-zoom-kotoba/audit';

export function readJson(filePath) {
  const abs = path.resolve(process.cwd(), filePath);
  return JSON.parse(fs.readFileSync(abs, 'utf8'));
}

export function writeJsonAtomic(filePath, data) {
  const abs = path.resolve(process.cwd(), filePath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  const tmpPath = `${abs}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2) + '\n', 'utf8');
  fs.renameSync(tmpPath, abs);
}

export function stripRubyAndHtml(raw) {
  if (!raw || typeof raw !== 'string') return '';
  return raw
    .replace(/<rt\b[^>]*>[\s\S]*?<\/rt>/gi, '')
    .replace(/<rp\b[^>]*>[\s\S]*?<\/rp>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .trim();
}

export function extractQuestionPlainText(q) {
  if (q && typeof q.questionText === 'string' && q.questionText.trim()) {
    return stripRubyAndHtml(q.questionText);
  }
  return stripRubyAndHtml(q?.prompt || '');
}

export function extractOptionId(opt, idx) {
  if (opt && opt.originalId != null && String(opt.originalId).trim()) {
    return String(opt.originalId).trim();
  }
  if (opt && opt.id != null && String(opt.id).trim()) {
    return String(opt.id).trim();
  }
  return String.fromCharCode(65 + idx);
}

export function extractOptionPlainText(opt) {
  return stripRubyAndHtml(opt?.text || '');
}

export function loadPackageQuestions(pkgFile) {
  const data = readJson(pkgFile);
  const questions = Array.isArray(data?.questions) ? data.questions : [];
  return questions.map(q => ({
    id: String(q.id || '').trim(),
    promptText: extractQuestionPlainText(q),
    options: (Array.isArray(q.options) ? q.options : []).map((opt, idx) => ({
      optId: extractOptionId(opt, idx),
      text: extractOptionPlainText(opt)
    }))
  }));
}

export function getMetaVersions(meta = {}) {
  const schemaVersion = meta.schemaVersion || meta.datasetVersion || null;
  const dataVersion = meta.dataVersion || meta.datasetVersion || null;
  return { schemaVersion, dataVersion };
}

export function hasKanji(str) {
  return /[\u4e00-\u9faf\u3005]/.test(str || '');
}

export function isSingleKanji(str) {
  if (!str || typeof str !== 'string') return false;
  const trimmed = str.trim();
  return [...trimmed].length === 1 && /[\u4e00-\u9faf]/.test(trimmed);
}

export function isValidHiraganaReading(str) {
  if (!str || typeof str !== 'string') return false;
  return /^[\u3041-\u3096\u3099-\u309cー]+$/.test(str.trim());
}
