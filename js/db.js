// IndexedDB-Speicher: foods, entries (Index date), meta (key/value)
import { migrateFoods } from './util.js';

const DB_NAME = 'tagesplan';
const DB_VERSION = 3;
export const BACKUP_VERSION = 2;
let dbp;

function open() {
  if (dbp) return dbp;
  dbp = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (ev) => {
      const db = req.result;
      const old = ev.oldVersion;
      if (!db.objectStoreNames.contains('foods')) db.createObjectStore('foods', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('entries')) {
        const s = db.createObjectStore('entries', { keyPath: 'id' });
        s.createIndex('date', 'date');
      }
      if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta', { keyPath: 'key' });
      // v3: Training (Katalog, Pläne, abgeschlossene Trainings, laufendes Training)
      if (!db.objectStoreNames.contains('exercises')) db.createObjectStore('exercises', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('plans')) db.createObjectStore('plans', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('workouts')) db.createObjectStore('workouts', { keyPath: 'id' }).createIndex('date', 'date');
      if (!db.objectStoreNames.contains('active')) db.createObjectStore('active', { keyPath: 'id' });
      // v2: Lebensmittel-Typ per100/portion (Einträge bleiben unverändert)
      if (old >= 1 && old < 2) {
        const store = req.transaction.objectStore('foods');
        const all = store.getAll();
        all.onsuccess = () => {
          store.clear();
          migrateFoods(all.result).forEach((f) => store.put(f));
        };
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbp;
}

const done = (req) => new Promise((res, rej) => { req.onsuccess = () => res(req.result); req.onerror = () => rej(req.error); });

async function tx(stores, mode, fn) {
  const db = await open();
  const t = db.transaction(stores, mode);
  const result = fn(t);
  await new Promise((res, rej) => { t.oncomplete = res; t.onerror = () => rej(t.error); t.onabort = () => rej(t.error); });
  return result;
}

export async function getAll(store) {
  const db = await open();
  return done(db.transaction(store).objectStore(store).getAll());
}
export async function get(store, id) {
  const db = await open();
  return done(db.transaction(store).objectStore(store).get(id));
}
export const put = (store, obj) => tx([store], 'readwrite', (t) => { t.objectStore(store).put(obj); return obj; });
export const putMany = (store, list) => tx([store], 'readwrite', (t) => { const s = t.objectStore(store); list.forEach((o) => s.put(o)); });
export const del = (store, id) => tx([store], 'readwrite', (t) => { t.objectStore(store).delete(id); });
export const delMany = (store, ids) => tx([store], 'readwrite', (t) => { const s = t.objectStore(store); ids.forEach((id) => s.delete(id)); });

export async function entriesByDate(date) {
  const db = await open();
  return done(db.transaction('entries').objectStore('entries').index('date').getAll(date));
}
export async function entriesInRange(from, to) {
  const db = await open();
  return done(db.transaction('entries').objectStore('entries').index('date').getAll(IDBKeyRange.bound(from, to)));
}

export async function getMeta(key, fallback = null) {
  const r = await get('meta', key);
  return r ? r.value : fallback;
}
export const setMeta = (key, value) => put('meta', { key, value });

export async function exportAll() {
  const [foods, entries, meta] = await Promise.all([getAll('foods'), getAll('entries'), getAll('meta')]);
  return { app: 'Tagesplan', version: BACKUP_VERSION, exportedAt: new Date().toISOString(), foods, entries, meta };
}

// Ersetzt alle Daten
export async function importAll(data) {
  if (!data || !Array.isArray(data.foods) || !Array.isArray(data.entries)) throw new Error('Ungültige Backup-Datei');
  if (!(data.version >= 2)) data = { ...data, foods: migrateFoods(data.foods) }; // altes Format
  await tx(['foods', 'entries', 'meta'], 'readwrite', (t) => {
    for (const n of ['foods', 'entries', 'meta']) t.objectStore(n).clear();
    data.foods.forEach((f) => t.objectStore('foods').put(f));
    data.entries.forEach((e) => t.objectStore('entries').put(e));
    (data.meta || []).forEach((m) => m && m.key && t.objectStore('meta').put(m));
  });
}

export async function requestPersist() {
  try {
    if (navigator.storage && navigator.storage.persist) {
      if (await navigator.storage.persisted()) return true;
      return await navigator.storage.persist();
    }
  } catch (e) { /* ignorieren */ }
  return false;
}
