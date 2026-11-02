export const DEFAULT_PACKAGES = [
  {
    id: 'ssw-pm-kunci-ujian-1',
    name: 'Kunci Soal Ujian 1 — CBTP Gino1',
    sourcePdf: 'Kunci Soal Ujian 1.pdf',
    description: 'Paket 40 soal SSW 特定技能1号・飲食料品製造業 dengan furigana dan ilustrasi asli.',
    pointsPerQuestion: 3.75
  },
  {
    id: 'ssw-pm-tipe2-nguyen1',
    name: 'Latsol Tipe 2 SSW PM — Đề 7 Thực Phẩm GINO1',
    sourcePdf: 'SSW NGUYEN 1.pdf',
    description: 'Paket latihan 40 soal SSW PM Tipe 2 (Đề 7 Thực Phẩm GINO1).',
    pointsPerQuestion: 3.75
  }
];

export const $ = (s, root = document) => root.querySelector(s);
export const $$ = (s, root = document) => [...root.querySelectorAll(s)];
export const uid = (prefix = 'id') => `${prefix}-${crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
export const esc = (v = '') => String(v).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
export const fmtDate = (value, locale = 'id-ID') => new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
export const fmtDuration = seconds => {
  const n = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;
};
export const fmtDurationHMS = seconds => {
  const n = Math.max(0, Math.floor(seconds));
  const totalMins = Math.floor(n / 60);
  const secs = n % 60;
  if (totalMins < 100) {
    return `00:${String(totalMins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  const hrs = Math.floor(n / 3600);
  const mins = Math.floor((n % 3600) / 60);
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export const packageName = (qOrSetId, fallback = 'Bank Soal SSW PM') => {
  if (!qOrSetId) return fallback;
  if (typeof qOrSetId === 'object') {
    if (qOrSetId.setName?.trim()) return qOrSetId.setName.trim();
    const found = DEFAULT_PACKAGES.find(p => p.id === qOrSetId.setId);
    if (found) return found.name;
    return qOrSetId.setId || fallback;
  }
  const found = DEFAULT_PACKAGES.find(p => p.id === qOrSetId);
  return found ? found.name : String(qOrSetId);
};

export const rawStats = session => {
  const questions = session?.questions || [];
  let correct = 0, unanswered = 0;
  let weightedScore = 0, maxWeightedScore = 0;
  for (const q of questions) {
    const pts = Number(q.points) > 0 ? Number(q.points) : 3.75;
    maxWeightedScore += pts;
    const ans = session.answers?.[q.id];
    const ok = ans != null && ans === q.correctIndex;
    if (ans == null) unanswered++;
    else if (ok) {
      correct++;
      weightedScore += pts;
    }
  }
  const total = questions.length;
  const wrong = total - correct - unanswered;
  const percent = total ? Math.round((correct / total) * 100) : 0;
  return {
    total,
    correct,
    unanswered,
    wrong,
    percent,
    weightedScore: Number(weightedScore.toFixed(2)),
    maxWeightedScore: Number(maxWeightedScore.toFixed(2))
  };
};

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

export function dataURLToBlob(data) {
  const [head, body] = data.split(',');
  const mime = head.match(/data:(.*?)(;base64)?$/)?.[1] || 'application/octet-stream';
  const raw = atob(body);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

export function shuffle(array) {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function validateQuestion(q) {
  const errors = [];
  if (!q.prompt?.trim() && !q.questionText?.trim() && !q.imageMediaId && !q.questionImage) {
    errors.push('Teks atau gambar pertanyaan belum diisi.');
  }
  if (!Array.isArray(q.options) || q.options.length < 2) {
    errors.push('Minimal dua pilihan jawaban diperlukan.');
  }
  if (q.options?.some(o => !o.text?.trim() && !o.mediaId && !o.optionImage)) {
    errors.push('Setiap pilihan harus berisi teks atau gambar.');
  }
  if (!Number.isInteger(q.correctIndex) || q.correctIndex < 0 || q.correctIndex >= (q.options?.length || 0)) {
    errors.push('Kunci jawaban belum valid.');
  }
  return errors;
}
