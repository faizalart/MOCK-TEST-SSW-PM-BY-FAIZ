const DB_NAME = 'ssw-pm-mock-test-db';
const DB_VERSION = 2;
const STORES = ['questions', 'themes', 'passages', 'sessions', 'meta', 'audioGroups', 'studyList'];

const memoryFallback = {
  questions: new Map(),
  themes: new Map(),
  passages: new Map(),
  sessions: new Map(),
  meta: new Map(),
  audioGroups: new Map(),
  studyList: new Map()
};
let useMemoryFallback = false;
let dbPromise;

function keyField(store) {
  return store === 'meta' ? 'key' : 'id';
}

function openDB() {
  if (useMemoryFallback) return Promise.resolve(null);
  if (dbPromise) return dbPromise;
  dbPromise = new Promise(resolve => {
    let settled = false;
    const finish = (db, fallback = false) => {
      if (settled) return;
      settled = true;
      if (fallback || !db) {
        useMemoryFallback = true;
        resolve(null);
      } else {
        resolve(db);
      }
    };
    const timer = setTimeout(() => finish(null, true), 2500);
    try {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('questions')) db.createObjectStore('questions', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('themes')) db.createObjectStore('themes', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('passages')) db.createObjectStore('passages', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('sessions')) db.createObjectStore('sessions', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta', { keyPath: 'key' });
        if (!db.objectStoreNames.contains('audioGroups')) db.createObjectStore('audioGroups', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('studyList')) db.createObjectStore('studyList', { keyPath: 'id' });
      };
      req.onsuccess = () => {
        clearTimeout(timer);
        const db = req.result;
        db.onversionchange = () => { try { db.close(); } catch {} dbPromise = null; };
        finish(db, false);
      };
      req.onerror = () => { clearTimeout(timer); finish(null, true); };
      req.onblocked = () => { clearTimeout(timer); finish(null, true); };
    } catch {
      clearTimeout(timer);
      finish(null, true);
    }
  });
  return dbPromise;
}

export async function all(store) {
  const db = await openDB();
  if (!db) return [...(memoryFallback[store]?.values() || [])];
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function get(store, key) {
  const db = await openDB();
  if (!db) return memoryFallback[store]?.get(key);
  return new Promise((resolve, reject) => {
    const req = db.transaction(store, 'readonly').objectStore(store).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function put(store, value) {
  const k = value?.[keyField(store)];
  if (k != null) memoryFallback[store]?.set(k, value);
  const db = await openDB();
  if (!db) return value;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).put(value);
    tx.oncomplete = () => resolve(value);
    tx.onerror = () => reject(tx.error || new Error('Gagal menyimpan data.'));
    tx.onabort = () => reject(tx.error || new Error('Penyimpanan dibatalkan.'));
  });
}

export async function putMany(store, values = []) {
  if (!values.length) return 0;
  const kf = keyField(store);
  for (const item of values) {
    if (item?.[kf] != null) memoryFallback[store]?.set(item[kf], item);
  }
  const db = await openDB();
  if (!db) return values.length;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    const os = tx.objectStore(store);
    for (const item of values) os.put(item);
    tx.oncomplete = () => resolve(values.length);
    tx.onerror = () => reject(tx.error || new Error('Gagal menyimpan paket data.'));
    tx.onabort = () => reject(tx.error || new Error('Penyimpanan paket dibatalkan.'));
  });
}

export async function del(store, key) {
  memoryFallback[store]?.delete(key);
  const db = await openDB();
  if (!db) return true;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).delete(key);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

export async function replaceAll(records) {
  for (const store of STORES) {
    memoryFallback[store]?.clear();
    const kf = keyField(store);
    for (const item of (records[store] || [])) {
      if (item?.[kf] != null) memoryFallback[store]?.set(item[kf], item);
    }
  }
  const db = await openDB();
  if (!db) return true;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES, 'readwrite');
    for (const store of STORES) {
      const os = tx.objectStore(store);
      os.clear();
      for (const item of (records[store] || [])) os.put(item);
    }
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error || new Error('Gagal memulihkan backup.'));
    tx.onabort = () => reject(tx.error || new Error('Pemulihan dibatalkan.'));
  });
}

export async function snapshot() {
  const out = {};
  for (const store of STORES) out[store] = await all(store);
  return out;
}

export async function initialise() {
  const existingSettings = await get('meta', 'settings');
  if (!existingSettings) {
    const defaultSettings = {
      key: 'settings',
      standardDuration: 70,
      standardCount: 40,
      resumeInterrupted: true,
      defaultSetId: 'ssw-pm-kunci-ujian-1'
    };
    await put('meta', defaultSettings);
  }
}
