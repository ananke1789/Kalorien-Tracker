// IndexedDB-Speicher des Finanzplaners (eigene Datenbank, unabhängig vom Tagesplan)
// Stores: categories, txs (Index date), recs, balances (Index date), meta (key/value)
import { DEFAULT_CATEGORIES, BACKUP_VERSION, validateBackup } from './calc.js';

const DB_NAME = 'finanzplaner';
const DB_VERSION = 1;
export const STORES = ['categories', 'txs', 'recs', 'balances', 'meta'];
let dbp;

function open() {
  if (dbp) return dbp;
  dbp = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (ev) => {
      const db = req.result;
      if (!db.objectStoreNames.contains('categories')) {
        const s = db.createObjectStore('categories', { keyPath: 'id' });
        if (ev.oldVersion === 0) DEFAULT_CATEGORIES.forEach((c) => s.put(c));
      }
      if (!db.objectStoreNames.contains('txs')) db.createObjectStore('txs', { keyPath: 'id' }).createIndex('date', 'date');
      if (!db.objectStoreNames.contains('recs')) db.createObjectStore('recs', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('balances')) db.createObjectStore('balances', { keyPath: 'id' }).createIndex('date', 'date');
      if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta', { keyPath: 'key' });
    };
    req.onblocked = () => window.dispatchEvent(new Event('finanzplaner-db-blocked'));
    req.onsuccess = () => {
      const db = req.result;
      db.onversionchange = () => { db.close(); location.reload(); };
      resolve(db);
    };
    req.onerror = () => reject(req.error);
  });
  return dbp;
}

const wrap = (r) => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
async function store(name, mode = 'readonly') { return (await open()).transaction(name, mode).objectStore(name); }

export const getAll = async (name) => wrap((await store(name)).getAll());
export const put = async (name, obj) => wrap((await store(name, 'readwrite')).put(obj));
export const del = async (name, id) => wrap((await store(name, 'readwrite')).delete(id));
export async function putMany(name, list) {
  const tx = (await open()).transaction(name, 'readwrite');
  const s = tx.objectStore(name);
  list.forEach((o) => s.put(o));
  return new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = () => rej(tx.error); });
}
export async function getMeta(key, fallback) {
  const r = await wrap((await store('meta')).get(key));
  return r ? r.value : fallback;
}
export const setMeta = (key, value) => put('meta', { key, value });

export async function exportAll() {
  const data = { app: 'finanzplaner', version: BACKUP_VERSION, exportedAt: new Date().toISOString() };
  for (const s of STORES) data[s] = await getAll(s);
  return data;
}
export async function importAll(raw) {
  const data = validateBackup(raw);
  const db = await open();
  const tx = db.transaction(STORES, 'readwrite');
  for (const s of STORES) {
    const st = tx.objectStore(s);
    st.clear();
    (data[s] || []).forEach((o) => st.put(o));
  }
  return new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = () => rej(tx.error); });
}

export function requestPersist() {
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
}
