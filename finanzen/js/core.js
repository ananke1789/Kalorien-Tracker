// Gemeinsamer Zustand und UI-Bausteine (Navigation, Sheet, Bestätigung, Toast, Formulare)
import * as db from './db.js';
import { DEFAULT_SETTINGS, todayKey, esc, money, parseMoney, moneyInput, uid, weekStart, addDays, expectedBalance } from './calc.js';

export const state = {
  view: 'overview',
  week: weekStart(todayKey()), // Montag der angezeigten Woche
  month: todayKey().slice(0, 8) + '01', // Monat in der Auswertung
  categories: [], txs: [], recs: [], balances: [],
  settings: { ...DEFAULT_SETTINGS },
  weeksDone: {}, // { 'YYYY-MM-DD' (Montag): true }
};
export const views = {};
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export const icon = (id, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-${id}"/></svg>`;

export async function loadAll() {
  const [categories, txs, recs, balances, settings, weeksDone] = await Promise.all([
    db.getAll('categories'), db.getAll('txs'), db.getAll('recs'), db.getAll('balances'),
    db.getMeta('settings', {}), db.getMeta('weeksDone', {}),
  ]);
  state.categories = categories.sort((a, b) => a.order - b.order);
  state.txs = txs.sort((a, b) => (a.date === b.date ? (b.at || 0) - (a.at || 0) : a.date < b.date ? 1 : -1));
  state.recs = recs;
  state.balances = balances;
  state.settings = { ...DEFAULT_SETTINGS, ...settings };
  state.weeksDone = weeksDone;
}
export const activeCats = () => state.categories.filter((c) => !c.archived);
export const catById = (id) => state.categories.find((c) => c.id === id);
export const catName = (id) => (catById(id) || { name: 'Ohne Kategorie' }).name;

export function navigate(view) {
  state.view = view;
  for (const s of $$('main > .view')) { s.hidden = s.dataset.view !== view; if (s.hidden) s.innerHTML = ''; }
  for (const t of $$('.tab')) t.classList.toggle('active', t.dataset.tab === view);
  closeSheet(true);
  render();
  window.scrollTo(0, 0);
}
export async function render() {
  const el = document.getElementById('view-' + state.view);
  $$('.fab').forEach((n) => n.remove());
  if (views[state.view]) await views[state.view].render(el);
}
export async function refresh() { await loadAll(); await render(); }

export function fab(label, fn, ic = 'plus') {
  const b = document.createElement('button');
  b.className = 'fab';
  b.innerHTML = icon(ic) + esc(label);
  b.onclick = fn;
  document.body.appendChild(b);
}

// ---------- Bottom-Sheet ----------
let sheetClose = null;
let ignorePop = 0;
export function openSheet({ title, html, onMount, onClose }) {
  const wrap = $('#sheet-wrap'), body = $('#sheet-body');
  if (sheetClose) closeSheet(true);
  $('#toast').hidden = true;
  $('#sheet-title').textContent = title;
  body.innerHTML = html;
  wrap.hidden = false;
  body.scrollTop = 0;
  if (!(history.state && history.state.sheet)) history.pushState({ sheet: true }, '');
  const close = (fromPop = false) => {
    if (!sheetClose) return;
    sheetClose = null;
    wrap.hidden = true;
    body.innerHTML = '';
    if (onClose) onClose();
    if (!fromPop) setTimeout(() => { if (!sheetClose && history.state && history.state.sheet) { ignorePop++; history.back(); } }, 60);
  };
  sheetClose = close;
  if (onMount) onMount(body, close);
  return close;
}
export function closeSheet(fromPop = false) { if (sheetClose) sheetClose(fromPop); }
export function onPopState() { if (ignorePop) { ignorePop--; return; } closeSheet(true); }

export function confirmDialog(text, { ok = 'Löschen', cancel = 'Abbrechen', danger = true, title = 'Bestätigen' } = {}) {
  return new Promise((resolve) => {
    let result = false;
    openSheet({
      title,
      html: `<div class="form"><p>${esc(text)}</p><div class="btn-row"><button class="btn" data-no>${esc(cancel)}</button>
        <button class="btn ${danger ? 'primary' : 'gold'}" data-yes>${esc(ok)}</button></div></div>`,
      onMount(el, close) {
        el.querySelector('[data-no]').onclick = () => close();
        el.querySelector('[data-yes]').onclick = () => { result = true; close(); };
      },
      onClose: () => resolve(result),
    });
  });
}

let toastTimer;
export function toast(msg, action) {
  const t = $('#toast');
  t.innerHTML = `<span>${esc(msg)}</span>` + (action ? `<button>${esc(action.label)}</button>` : '');
  t.hidden = false;
  if (action) t.querySelector('button').onclick = () => { t.hidden = true; action.fn(); };
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.hidden = true), action ? 5000 : 2400);
}
export const emptyState = (title, text) => `<div class="empty">${icon('coin')}<strong>${esc(title)}</strong><span>${esc(text)}</span></div>`;

// ---------- Formularbausteine ----------
export const moneyField = (name, label, value, attrs = '') => `<label class="field"><span>${esc(label)}</span>
  <div class="input-wrap"><input class="input" name="${name}" inputmode="decimal" autocomplete="off" placeholder="0,00" value="${esc(moneyInput(value))}" ${attrs}><span class="suffix">€</span></div></label>`;
export function readMoney(input, { allowZero = false } = {}) {
  const v = parseMoney(input.value);
  const ok = Number.isFinite(v) && v >= 0 && (allowZero || v > 0);
  input.classList.toggle('invalid', !ok);
  return ok ? v : null;
}
export function seg(name, options, value) {
  return `<div class="seg" data-seg="${name}">${options.map(([v, l]) => `<button type="button" data-v="${esc(v)}" class="${String(v) === String(value) ? 'on' : ''}">${esc(l)}</button>`).join('')}</div>`;
}
export function bindSeg(root, name, onChange) {
  const el = root.querySelector(`[data-seg="${name}"]`);
  el.onclick = (e) => {
    const b = e.target.closest('button'); if (!b) return;
    el.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
    onChange && onChange(b.dataset.v);
  };
  return () => el.querySelector('.on')?.dataset.v;
}

// ---------- Einzelzahlung erfassen / bearbeiten ----------
export function txSheet(tx = null, { date } = {}) {
  const isNew = !tx;
  const cats = activeCats();
  const t = tx || { type: 'out', date: date || todayKey(), catId: null, amount: null, note: '' };
  if (t.catId && !cats.some((c) => c.id === t.catId) && catById(t.catId)) cats.push(catById(t.catId)); // archivierte beim Bearbeiten
  let type = t.type, catId = t.catId;
  openSheet({
    title: isNew ? 'Neue Zahlung' : 'Zahlung bearbeiten',
    html: `<form class="form" novalidate>
      ${seg('type', [['out', 'Ausgabe'], ['in', 'Einnahme']], type)}
      ${moneyField('amount', 'Betrag', t.amount, isNew ? 'autofocus' : '')}
      <div class="field" data-cats><span>Kategorie</span><div class="chips">${cats.map((c) => `<button type="button" class="chip ${c.id === catId ? 'on' : ''}" data-cat="${esc(c.id)}">${esc(c.name)}</button>`).join('')}</div>
        <div class="error" data-caterr hidden>Bitte eine Kategorie wählen.</div></div>
      <label class="field"><span>Datum</span><input class="input" type="date" name="date" value="${esc(t.date)}" required></label>
      <label class="field"><span>Notiz (optional)</span><input class="input" name="note" maxlength="120" value="${esc(t.note || '')}" placeholder="z. B. Laden, Artikel"></label>
      <div class="sheet-actions grid-gap">
        ${isNew ? `<div class="btn-row"><button class="btn" type="button" data-more>Speichern + weitere</button><button class="btn primary" type="submit">Speichern</button></div>`
          : `<div class="btn-row"><button class="btn danger" type="button" data-del>Löschen</button><button class="btn primary" type="submit">Speichern</button></div>`}
      </div></form>`,
    onMount(el, close) {
      const form = el.querySelector('form');
      const catsEl = el.querySelector('[data-cats]');
      const showCats = () => { catsEl.hidden = type === 'in'; };
      showCats();
      bindSeg(el, 'type', (v) => { type = v; showCats(); });
      el.querySelector('.chips').onclick = (e) => {
        const b = e.target.closest('[data-cat]'); if (!b) return;
        catId = b.dataset.cat;
        el.querySelectorAll('.chip').forEach((x) => x.classList.toggle('on', x === b));
        el.querySelector('[data-caterr]').hidden = true;
      };
      const save = async (more) => {
        const amount = readMoney(form.amount);
        const d = form.date.value;
        if (type === 'out' && !catId) { el.querySelector('[data-caterr]').hidden = false; }
        if (amount == null || !d || (type === 'out' && !catId)) return;
        const obj = { ...(tx || { id: uid(), at: Date.now() }), type, amount, date: d, catId: type === 'out' ? catId : null, note: form.note.value.trim() };
        await db.put('txs', obj);
        await loadAll();
        if (more) {
          form.amount.value = ''; form.note.value = ''; form.amount.focus();
          toast(`${money(amount)} gespeichert`);
          await render();
        } else {
          close(); await render();
          toast(isNew ? 'Gespeichert' : 'Geändert');
        }
      };
      form.onsubmit = (e) => { e.preventDefault(); save(false); };
      const more = el.querySelector('[data-more]'); if (more) more.onclick = () => save(true);
      const delBtn = el.querySelector('[data-del]');
      if (delBtn) delBtn.onclick = async () => {
        close();
        await db.del('txs', tx.id);
        await refresh();
        toast('Gelöscht', { label: 'Rückgängig', fn: async () => { await db.put('txs', tx); await refresh(); } });
      };
    },
  });
}

// ---------- Kontostand eintragen ----------
export function balanceSheet({ expectedAt } = {}) {
  const d0 = todayKey();
  openSheet({
    title: 'Kontostand eintragen',
    html: `<form class="form" novalidate>
      <p class="small muted">Trag ein, was deine Banking-App gerade anzeigt. Ab diesem Stand rechnet die Prognose weiter – Abweichungen durch vergessene Einträge werden so automatisch korrigiert. Einträge vom selben Tag gelten als im Stand enthalten.</p>
      ${moneyField('amount', 'Kontostand', null, 'autofocus')}
      <label class="check"><input type="checkbox" name="neg"> Konto ist im Minus</label>
      <label class="field"><span>Stand vom</span><input class="input" type="date" name="date" value="${esc(expectedAt || d0)}" max="${d0}"></label>
      <div class="hint" data-exp hidden></div>
      <div class="sheet-actions"><button class="btn primary block" type="submit">Speichern</button></div></form>`,
    onMount(el, close) {
      const form = el.querySelector('form');
      const exp = el.querySelector('[data-exp]');
      const upd = () => {
        const e = expectedBalance(state, form.date.value || d0);
        const v = parseMoney(form.amount.value);
        if (!e) { exp.hidden = true; return; }
        exp.hidden = false;
        let s = `Erwartet laut Einträgen: <b>${money(e.amount)}</b>`;
        if (Number.isFinite(v)) {
          const diff = (form.neg.checked ? -v : v) - e.amount;
          s += `<br>Abweichung: <b>${money(diff, { sign: true })}</b>` + (diff < -500 ? ' – vermutlich nicht eingetragene Ausgaben.' : '');
        }
        exp.innerHTML = s;
      };
      form.oninput = upd; upd();
      form.onsubmit = async (e) => {
        e.preventDefault();
        const v = readMoney(form.amount, { allowZero: true });
        if (v == null || !form.date.value) return;
        await db.put('balances', { id: uid(), at: Date.now(), date: form.date.value, amount: form.neg.checked ? -v : v });
        close(); await refresh(); toast('Kontostand gespeichert');
      };
    },
  });
}

export const weekDone = (monday) => !!state.weeksDone[monday];
export async function setWeekDone(monday, on) {
  const m = { ...state.weeksDone };
  if (on) m[monday] = true; else delete m[monday];
  state.weeksDone = m;
  await db.setMeta('weeksDone', m);
}
export const lastWeek = () => addDays(weekStart(todayKey()), -7);
