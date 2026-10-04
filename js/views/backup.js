// Backup (Export/Import), Backup-Erinnerung und Demo-Daten
import * as db from '../db.js';
import { state, loadFoods, loadGoals, confirmDialog, toast, icon, render } from '../core.js';
import { todayKey, addDays, fmtDate, daysBetween, dateKey, uid } from '../util.js';

export const BACKUP_DAYS = 14;

// Liefert Hinweis-HTML, wenn das letzte Backup > 14 Tage her ist (und es Daten gibt)
export async function backupHint() {
  const last = await db.getMeta('lastBackup');
  const firstUse = await db.getMeta('firstUse');
  if (!firstUse) { await db.setMeta('firstUse', todayKey()); return ''; }
  const ref = last ? dateKey(new Date(last)) : firstUse;
  const days = daysBetween(ref, todayKey());
  if (days <= BACKUP_DAYS || !state.foods.length) return '';
  return `<button class="hint" id="backup-hint" style="text-align:left;border-top:0;border-right:0;border-bottom:0;width:100%;min-height:48px">
    ${last ? `Letztes Backup vor ${days} Tagen.` : 'Noch kein Backup erstellt.'} <b style="color:var(--red)">Jetzt sichern →</b></button>`;
}

export async function exportData() {
  const data = await db.exportAll();
  const blob = new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `tagesplan-backup-${todayKey()}.json`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  await db.setMeta('lastBackup', new Date().toISOString());
  toast('Backup exportiert');
}

async function importFile(file) {
  let data;
  try {
    data = JSON.parse(await file.text());
    if (!Array.isArray(data.foods) || !Array.isArray(data.entries)) throw new Error();
  } catch {
    return toast('Die Datei ist kein gültiges Tagesplan-Backup.');
  }
  const ok = await confirmDialog(
    `Backup vom ${data.exportedAt ? fmtDate(dateKey(new Date(data.exportedAt))) : '?'} mit ${data.foods.length} Lebensmitteln und ${data.entries.length} Einträgen importieren? ALLE aktuellen Daten werden dabei überschrieben.`,
    { ok: 'Überschreiben', title: 'Import' },
  );
  if (!ok) return;
  await db.importAll(data);
  await db.setMeta('lastBackup', new Date().toISOString());
  await Promise.all([loadFoods(), loadGoals()]);
  toast('Backup wiederhergestellt');
  render();
}

// ---------- Demo-Daten ----------
const DEMO_FOODS = [
  ['Haferflocken', 372, 13.5, 7, 58.7, [['1 Portion', 50]]],
  ['Milch 1,5 %', 47, 3.4, 1.5, 4.9, [['1 Glas', 200]]],
  ['Banane', 93, 1.2, 0.2, 20, [['1 Stück', 120]]],
  ['Magerquark', 67, 12, 0.2, 4, [['1 Becher', 250]]],
  ['Hähnchenbrust', 110, 23, 1.5, 0, []],
  ['Reis (gekocht)', 130, 2.7, 0.3, 28, [['1 Teller', 200]]],
  ['Brokkoli', 34, 2.8, 0.4, 4.4, []],
  ['Vollkornbrot', 220, 7.5, 1.6, 41, [['1 Scheibe', 50]]],
  ['Gouda', 356, 25, 28, 0.1, [['1 Scheibe', 25]]],
  ['Olivenöl', 884, 0, 100, 0, [['1 EL', 10]]],
  ['Eier', 137, 12.5, 9.5, 0.7, [['1 Ei (M)', 58]]],
  ['Proteinriegel', 360, 33, 12, 32, [['1 Riegel', 45]]],
  ['Walnüsse', 690, 15, 65, 11, [['1 Handvoll', 30]]],
  ['Lachs', 202, 20, 13.6, 0, [['1 Filet', 125]]],
  ['Kartoffeln', 76, 2, 0.1, 16, []],
  ['Apfel', 54, 0.3, 0.2, 12, [['1 Stück', 150]]],
];
// [Mahlzeit, Lebensmittel-Index, Gramm]
const DEMO_DAYS = [
  [['breakfast', 0, 100], ['breakfast', 1, 300], ['breakfast', 2, 120], ['lunch', 4, 250], ['lunch', 5, 350], ['lunch', 6, 200], ['lunch', 9, 15], ['dinner', 7, 150], ['dinner', 8, 75], ['dinner', 10, 116], ['snacks', 11, 90], ['snacks', 12, 40], ['snacks', 3, 250], ['snacks', 15, 150]],
  [['breakfast', 0, 80], ['breakfast', 1, 250], ['breakfast', 3, 250], ['lunch', 13, 125], ['lunch', 14, 400], ['lunch', 9, 20], ['dinner', 7, 200], ['dinner', 8, 50], ['snacks', 11, 45], ['snacks', 2, 120], ['snacks', 12, 30]],
  [['breakfast', 10, 174], ['breakfast', 7, 100], ['lunch', 4, 200], ['lunch', 5, 400], ['lunch', 9, 15], ['dinner', 13, 250], ['dinner', 14, 300], ['dinner', 6, 200], ['snacks', 3, 500], ['snacks', 15, 150]],
];

async function loadDemo() {
  const now = Date.now();
  const foods = DEMO_FOODS.map(([name, kcal, protein, fat, carbs, ps], i) => ({
    id: 'demo-f' + i, name, kcal, protein, fat, carbs, portions: ps.map(([n, g]) => ({ name: n, grams: g })),
    createdAt: now, updatedAt: now, demo: true,
  }));
  const entries = [];
  for (let d = 0; d < 7; d++) {
    const date = addDays(todayKey(), -d);
    DEMO_DAYS[d % DEMO_DAYS.length].forEach(([meal, fi, grams], j) => {
      if (d === 0 && meal === 'dinner') return; // heute: Abendessen noch offen
      const f = foods[fi];
      const p = f.portions.find((x) => grams % x.grams === 0);
      entries.push({
        id: 'demo-e' + uid(), date, meal, foodId: f.id, foodName: f.name,
        per100: { kcal: f.kcal, protein: f.protein, fat: f.fat, carbs: f.carbs },
        grams, portion: p ? { name: p.name, grams: p.grams, count: grams / p.grams } : null, createdAt: now + d * 100 + j, demo: true,
      });
    });
  }
  await db.putMany('foods', foods);
  await db.putMany('entries', entries);
  await loadFoods();
  toast(`Demo-Daten geladen: ${foods.length} Lebensmittel, ${entries.length} Einträge`);
  render();
}

async function clearDemo() {
  const [foods, entries] = await Promise.all([db.getAll('foods'), db.getAll('entries')]);
  await db.delMany('foods', foods.filter((f) => f.demo).map((f) => f.id));
  await db.delMany('entries', entries.filter((e) => e.demo).map((e) => e.id));
  await loadFoods();
  toast('Demo-Daten gelöscht');
  render();
}

export async function renderBackup(el) {
  const last = await db.getMeta('lastBackup');
  const hasDemo = state.foods.some((f) => f.demo) || (await db.getAll('entries')).some((e) => e.demo);
  const persisted = navigator.storage && navigator.storage.persisted ? await navigator.storage.persisted().catch(() => false) : false;
  el.innerHTML = `
    <div class="section-title"><span class="label">Daten & Backup</span></div>
    <div class="card form">
      <div class="list-row"><span class="small muted">Letztes Backup</span><b>${last ? fmtDate(dateKey(new Date(last))) : 'noch keins'}</b></div>
      <div class="list-row" style="margin-top:-12px"><span class="small muted">Dauerhafter Speicher</span><b>${persisted ? 'aktiv' : 'nicht bestätigt'}</b></div>
      ${(await backupHint()).replace('id="backup-hint"', 'id="backup-hint2"')}
      <p class="small muted" style="margin:0">Die Daten liegen nur auf diesem Gerät. Sichere sie regelmäßig als Datei (z. B. in Google Drive).</p>
      <div class="btn-row">
        <button class="btn primary" id="export">Exportieren</button>
        <button class="btn" id="import">Importieren</button>
      </div>
      <input type="file" id="import-file" accept="application/json,.json" hidden>
    </div>
    <div class="section-title"><span class="label">Demo</span></div>
    <div class="card form">
      <p class="small muted" style="margin:0">Beispiel-Lebensmittel und Einträge der letzten 7 Tage zum Ausprobieren. Sie sind markiert und lassen sich jederzeit komplett löschen – eigene Daten bleiben erhalten.</p>
      ${hasDemo ? `<button class="btn danger" id="demo-clear">Demo-Daten löschen</button>` : `<button class="btn gold" id="demo-load">${icon('wheat')}Demo-Daten laden</button>`}
    </div>
    <p class="small muted" style="text-align:center;margin:8px 0 0">${icon('star', 'star-status on')}<br>Tagesplan · Daten lokal · offline nutzbar</p>`;
  el.querySelector('#export').onclick = exportData;
  const h2 = el.querySelector('#backup-hint2');
  if (h2) h2.onclick = exportData;
  const fi = el.querySelector('#import-file');
  el.querySelector('#import').onclick = () => fi.click();
  fi.onchange = () => { if (fi.files[0]) importFile(fi.files[0]); fi.value = ''; };
  const dl = el.querySelector('#demo-load');
  if (dl) dl.onclick = loadDemo;
  const dc = el.querySelector('#demo-clear');
  if (dc) dc.onclick = async () => { if (await confirmDialog('Alle Demo-Lebensmittel und Demo-Einträge löschen?')) clearDemo(); };
}
