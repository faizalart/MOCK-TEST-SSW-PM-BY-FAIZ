import { blobToDataURL, dataURLToBlob } from './utils.js?v=ssw3';

export async function serializeDatabase(db) {
  const out = structuredClone(db);
  out.format = 'ssw-pm-backup';
  out.version = 2;
  out.exportedAt = new Date().toISOString();
  const ensureMediaSerialized = async (media, label) => {
    if (media.blob instanceof Blob) {
      media.dataUrl = await blobToDataURL(media.blob);
      delete media.blob;
    } else if (!media.dataUrl && media.path) {
      try {
        const res = await fetch(media.path);
        if (res.ok) {
          const blob = await res.blob();
          media.dataUrl = await blobToDataURL(blob);
        }
      } catch {
        // Keep media.path fallback if fetch is unavailable in test harness
      }
    } else if (!media.dataUrl && !media.path) {
      throw new Error(`Media "${label}" tidak memiliki isi data.`);
    }
  };
  for (const q of (out.questions || [])) {
    for (const media of (q.media || [])) {
      await ensureMediaSerialized(media, media.name || media.id);
    }
  }
  for (const session of (out.sessions || [])) {
    for (const q of (session.questions || [])) {
      for (const media of (q.media || [])) {
        await ensureMediaSerialized(media, media.name || media.id);
      }
    }
  }
  return out;
}

export function validateBackup(data) {
  const errors = [];
  if (!data || typeof data !== 'object') return ['Isi file bukan objek backup yang valid.'];
  if (!['ssw-pm-backup', 'jft-practice-backup'].includes(data.format)) {
    errors.push('Identitas format backup tidak dikenali.');
  }
  for (const key of ['questions', 'sessions', 'meta']) {
    if (!Array.isArray(data[key])) errors.push(`Bagian "${key}" tidak tersedia atau formatnya salah.`);
  }
  if (!Array.isArray(data.themes)) data.themes = [];
  if (!Array.isArray(data.passages)) data.passages = [];
  if (!Array.isArray(data.audioGroups)) data.audioGroups = [];
  if (errors.length) return errors;
  const ids = new Set();
  for (const q of data.questions) {
    if (!q?.id || !Array.isArray(q.options)) errors.push('Ditemukan rekaman soal dengan struktur tidak valid.');
    if (q?.id && ids.has(q.id)) errors.push(`ID soal duplikat: ${q.id}`);
    if (q?.id) ids.add(q.id);
    for (const m of q.media || []) {
      if (!m.dataUrl && !m.path && !(m.blob instanceof Blob)) {
        errors.push(`Data media hilang pada soal ${q.id}.`);
      }
    }
  }
  return errors;
}

export function hydrateBackup(data) {
  const out = structuredClone(data);
  out.themes = Array.isArray(out.themes) ? out.themes : [];
  out.passages = Array.isArray(out.passages) ? out.passages : [];
  out.audioGroups = Array.isArray(out.audioGroups) ? out.audioGroups : [];
  for (const q of (out.questions || [])) {
    for (const media of (q.media || [])) {
      if (media.dataUrl) {
        media.blob = dataURLToBlob(media.dataUrl);
        delete media.dataUrl;
      }
    }
  }
  for (const session of (out.sessions || [])) {
    for (const q of (session.questions || [])) {
      for (const media of (q.media || [])) {
        if (media.dataUrl) {
          media.blob = dataURLToBlob(media.dataUrl);
          delete media.dataUrl;
        }
      }
    }
  }
  return out;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();
let crcTable;
function makeCRCTable() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
}
function crc32(bytes) {
  crcTable ||= makeCRCTable();
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = crcTable[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function put16(view, o, n) { view.setUint16(o, n, true); }
function put32(view, o, n) { view.setUint32(o, n >>> 0, true); }
function cat(chunks) {
  const size = chunks.reduce((n, a) => n + a.length, 0);
  const out = new Uint8Array(size);
  let o = 0;
  for (const a of chunks) { out.set(a, o); o += a.length; }
  return out;
}

export function makeZip(files) {
  const locals = [], centrals = [];
  let offset = 0;
  const now = new Date();
  const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | Math.floor(now.getSeconds() / 2);
  const dosDate = ((Math.max(1980, now.getFullYear()) - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
  for (const file of files) {
    const name = encoder.encode(file.name);
    const data = file.bytes instanceof Uint8Array ? file.bytes : new Uint8Array(file.bytes);
    const crc = crc32(data);
    const local = new Uint8Array(30 + name.length + data.length);
    const lv = new DataView(local.buffer);
    put32(lv, 0, 0x04034b50); put16(lv, 4, 20); put16(lv, 6, 0x0800); put16(lv, 8, 0);
    put16(lv, 10, dosTime); put16(lv, 12, dosDate); put32(lv, 14, crc);
    put32(lv, 18, data.length); put32(lv, 22, data.length); put16(lv, 26, name.length); put16(lv, 28, 0);
    local.set(name, 30); local.set(data, 30 + name.length); locals.push(local);

    const cen = new Uint8Array(46 + name.length);
    const cv = new DataView(cen.buffer);
    put32(cv, 0, 0x02014b50); put16(cv, 4, 20); put16(cv, 6, 20); put16(cv, 8, 0x0800);
    put16(cv, 10, 0); put16(cv, 12, dosTime); put16(cv, 14, dosDate); put32(cv, 16, crc);
    put32(cv, 20, data.length); put32(cv, 24, data.length); put16(cv, 28, name.length);
    put16(cv, 30, 0); put16(cv, 32, 0); put16(cv, 34, 0); put16(cv, 36, 0); put32(cv, 38, 0);
    put32(cv, 42, offset); cen.set(name, 46); centrals.push(cen);
    offset += local.length;
  }
  const centralBytes = cat(centrals);
  const ending = new Uint8Array(22);
  const ev = new DataView(ending.buffer);
  put32(ev, 0, 0x06054b50); put16(ev, 4, 0); put16(ev, 6, 0);
  put16(ev, 8, files.length); put16(ev, 10, files.length);
  put32(ev, 12, centralBytes.length); put32(ev, 16, offset); put16(ev, 20, 0);
  return new Blob([cat([...locals, centralBytes, ending])], { type: 'application/zip' });
}

export async function readZip(blob) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let eocd = -1;
  const start = Math.max(0, bytes.length - 65557);
  for (let i = bytes.length - 22; i >= start; i--) {
    if (view.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('File ZIP tidak memiliki directory akhir yang valid.');
  const count = view.getUint16(eocd + 10, true);
  let pos = view.getUint32(eocd + 16, true);
  const files = new Map();
  for (let i = 0; i < count; i++) {
    if (view.getUint32(pos, true) !== 0x02014b50) throw new Error('Struktur direktori ZIP tidak valid.');
    const method = view.getUint16(pos + 10, true),
          compressedSize = view.getUint32(pos + 20, true),
          nameLen = view.getUint16(pos + 28, true),
          extraLen = view.getUint16(pos + 30, true),
          commentLen = view.getUint16(pos + 32, true),
          localOffset = view.getUint32(pos + 42, true);
    const name = decoder.decode(bytes.subarray(pos + 46, pos + 46 + nameLen));
    if (view.getUint32(localOffset, true) !== 0x04034b50) throw new Error(`Header file ZIP ${name} tidak valid.`);
    const localNameLen = view.getUint16(localOffset + 26, true),
          localExtraLen = view.getUint16(localOffset + 28, true),
          dataStart = localOffset + 30 + localNameLen + localExtraLen;
    const compressed = bytes.slice(dataStart, dataStart + compressedSize);
    let data;
    if (method === 0) data = compressed;
    else if (method === 8 && typeof DecompressionStream !== 'undefined') {
      const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
      data = new Uint8Array(await new Response(stream).arrayBuffer());
    } else throw new Error(`Metode kompresi ZIP tidak didukung untuk ${name}. Gunakan ZIP backup buatan aplikasi ini atau JSON lengkap.`);
    files.set(name, data);
    pos += 46 + nameLen + extraLen + commentLen;
  }
  const backupEntry = [...files.entries()].find(([name]) => name === 'backup.json' || name.endsWith('/backup.json') || name === 'database.json');
  if (!backupEntry) throw new Error('File ZIP tidak berisi backup.json yang dikenali.');
  return JSON.parse(decoder.decode(backupEntry[1]));
}
