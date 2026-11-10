// Mehr: Kategorien verwalten (anlegen, umbenennen, Budget, sortieren, archivieren, löschen/zusammenführen),
// Prognose-Einstellung, Export/Import
import * as db from '../db.js';
import { state, openSheet, confirmDialog, refresh, render, toast, moneyField, readMoney, icon, seg, bindSeg } from '../core.js';
import { esc, uid, money, todayKey, shortDate, daysBetween } from '../calc.js';

function catSheet(cat = null) {
  const isNew = !cat;
  const used = cat ? state.txs.filter((t) => t.catId === cat.id).length : 0;
  const others = state.categories.filter((c) => !cat || c.id !== cat.id);
  openSheet({
    title: isNew ? 'Neue Kategorie' : 'Kategorie bearbeiten',
    html: `<form class="form" novalidate>
      <label class="field"><span>Name</span><input class="input" name="name" maxlength="40" value="${esc(cat ? cat.name : '')}" ${isNew ? 'autofocus' : ''}></label>
      ${moneyField('budget', 'Monatsbudget (optional)', cat && cat.budget ? cat.budget : null)}
      <div class="error" data-err hidden></div>
      <div class="sheet-actions"><button class="btn primary block" type="submit">Speichern</button></div>
      ${isNew ? '' : `<hr class="rule">
        <p class="small muted" style="margin:0">${used} Zahlung${used === 1 ? '' : 'en'} in dieser Kategorie.</p>
        <button class="btn block" type="button" data-arch>${cat.archived ? 'Wieder aktivieren' : 'Archivieren (bei neuen Zahlungen ausblenden)'}</button>
        ${used ? `<label class="field"><span>Zahlungen verschieben nach</span><select class="input" name="target">${others.map((c) => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('')}</select></label>
          <button class="btn danger block" type="button" data-merge>Verschieben und Kategorie löschen</button>`
        : `<button class="btn danger block" type="button" data-del>Kategorie löschen</button>`}`}
    </form>`,
    onMount(el, close) {
      const form = el.querySelector('form');
      const err = el.querySelector('[data-err]');
      form.onsubmit = async (e) => {
        e.preventDefault();
        const name = form.name.value.trim();
        const budget = form.budget.value.trim() === '' ? 0 : readMoney(form.budget, { allowZero: true });
        if (!name) { form.name.classList.add('invalid'); return; }
        if (budget == null) return;
        if (state.categories.some((c) => c.name.toLowerCase() === name.toLowerCase() && (!cat || c.id !== cat.id))) {
          err.textContent = 'Diese Kategorie gibt es schon.'; err.hidden = false; return;
        }
        const obj = cat ? { ...cat, name, budget } : { id: uid(), name, budget, archived: false, order: Math.max(-1, ...state.categories.map((c) => c.order)) + 1 };
        await db.put('categories', obj);
        close(); await refresh(); toast(isNew ? 'Kategorie angelegt' : 'Gespeichert');
      };
      if (isNew) return;
      el.querySelector('[data-arch]').onclick = async () => {
        await db.put('categories', { ...cat, archived: !cat.archived }); close(); await refresh();
      };
      const del = el.querySelector('[data-del]');
      if (del) del.onclick = async () => {
        if (!(await confirmDialog(`Kategorie „${cat.name}“ löschen?`))) return;
        await db.del('categories', cat.id); await refresh();
      };
      const merge = el.querySelector('[data-merge]');
      if (merge) merge.onclick = async () => {
        const target = state.categories.find((c) => c.id === form.target.value);
        if (!target) return;
        if (!(await confirmDialog(`${used} Zahlungen von „${cat.name}“ nach „${target.name}“ verschieben und „${cat.name}“ löschen?`, { ok: 'Verschieben' }))) return;
        await db.putMany('txs', state.txs.filter((t) => t.catId === cat.id).map((t) => ({ ...t, catId: target.id })));
        await db.del('categories', cat.id); await refresh(); toast('Zusammengeführt');
      };
    },
  });
}

async function move(id, dir) {
  const list = [...state.categories];
  const i = list.findIndex((c) => c.id === id), j = i + dir;
  if (j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  await db.putMany('categories', list.map((c, k) => ({ ...c, order: k })));
  await refresh();
}

async function doExport() {
  const data = await db.exportAll();
  const blob = new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `finanzplaner-${todayKey()}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  await db.setMeta('lastBackup', todayKey());
  await render();
  toast('Sicherung heruntergeladen');
}
function doImport() {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = 'application/json,.json';
  inp.onchange = async () => {
    const file = inp.files[0]; if (!file) return;
    let data;
    try { data = JSON.parse(await file.text()); if (data.app !== 'finanzplaner') throw new Error('Keine Finanzplaner-Sicherung'); } catch (e) { toast('Import fehlgeschlagen: ' + e.message); return; }
    if (!(await confirmDialog(`Sicherung vom ${data.exportedAt ? shortDate(data.exportedAt.slice(0, 10)) : '?'} mit ${data.txs?.length || 0} Zahlungen und ${data.recs?.length || 0} Fixkosten laden? Die aktuellen Daten werden ersetzt.`, { ok: 'Importieren' }))) return;
    try { await db.importAll(data); await refresh(); toast('Import abgeschlossen'); } catch (e) { toast('Import fehlgeschlagen: ' + e.message); }
  };
  inp.click();
}

export default {
  async render(el) {
    const last = await db.getMeta('lastBackup', null);
    const age = last ? daysBetween(last, todayKey()) : null;
    el.innerHTML = `
      <h3 class="section-title label">Kategorien für Einzelzahlungen</h3>
      <div class="card flat">
        ${state.categories.map((c, i) => `<div class="cat-edit ${c.archived ? 'muted' : ''}">
          <button class="entry" data-cat="${esc(c.id)}"><div class="main"><div class="nm">${esc(c.name)}${c.archived ? ' <span class="badge">archiviert</span>' : ''}</div>
            <div class="sub">${c.budget ? `Budget ${money(c.budget, { round: true })}/Monat` : 'kein Budget'}</div></div></button>
          <button class="icon-btn sm" data-up="${esc(c.id)}" ${i === 0 ? 'disabled' : ''} aria-label="Nach oben">${icon('up')}</button>
          <button class="icon-btn sm" data-down="${esc(c.id)}" ${i === state.categories.length - 1 ? 'disabled' : ''} aria-label="Nach unten">${icon('down')}</button></div>`).join('')}
        <button class="btn block" data-newcat style="margin-top:10px">${icon('plus')}Kategorie anlegen</button>
      </div>

      <h3 class="section-title label">Prognose</h3>
      <div class="card form">
        <div class="field"><span>Durchschnitt der variablen Ausgaben über</span>
          ${seg('avg', [[1, '1 Mon.'], [3, '3 Mon.'], [6, '6 Mon.'], [12, '12 Mon.']], state.settings.avgMonths)}</div>
        <p class="small muted" style="margin:0">Grundlage sind die letzten vollständigen Monate (ohne den laufenden). Solange es noch weniger als zwei Wochen Daten gibt, rechnet die App mit dem, was bisher da ist.</p>
      </div>

      <h3 class="section-title label">Daten & Sicherung</h3>
      <div class="card form">
        <p class="small" style="margin:0">Alle Daten liegen nur auf diesem Gerät (im Browser-Speicher der App). Nichts wird hochgeladen.</p>
        ${age == null || age > 14 ? `<div class="hint warn">${last ? `Letzte Sicherung vor ${age} Tagen.` : 'Noch keine Sicherung erstellt.'} Exportiere regelmäßig, z. B. nach Google Drive.</div>` : `<div class="hint">Letzte Sicherung: ${shortDate(last)}</div>`}
        <div class="btn-row"><button class="btn" data-export>Exportieren</button><button class="btn" data-import>Importieren</button></div>
      </div>
      <p class="small muted center">Finanzplaner · lokal & offline</p>`;

    for (const b of el.querySelectorAll('[data-cat]')) b.onclick = () => catSheet(state.categories.find((c) => c.id === b.dataset.cat));
    for (const b of el.querySelectorAll('[data-up]')) b.onclick = () => move(b.dataset.up, -1);
    for (const b of el.querySelectorAll('[data-down]')) b.onclick = () => move(b.dataset.down, 1);
    el.querySelector('[data-newcat]').onclick = () => catSheet();
    bindSeg(el, 'avg', async (v) => {
      state.settings = { ...state.settings, avgMonths: +v };
      await db.setMeta('settings', state.settings); toast(`Durchschnitt über ${v} Monat${v === '1' ? '' : 'e'}`);
    });
    el.querySelector('[data-export]').onclick = doExport;
    el.querySelector('[data-import]').onclick = doImport;
  },
};
