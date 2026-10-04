// Gemeinsamer Zustand und UI-Bausteine (Sheet, Bestätigung, Toast)
import * as db from './db.js';
import { DEFAULT_GOALS, todayKey, esc, sortFoods } from './util.js';

export const state = {
  view: 'today',
  date: todayKey(), // Tag in "Heute"
  statsDate: todayKey(), // Tag/Woche in "Auswertung"
  goals: { ...DEFAULT_GOALS },
  foods: [],
};

export const views = {}; // von app.js befüllt: name -> { render(el) }

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export const icon = (id, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-${id}"/></svg>`;

export async function loadFoods() {
  state.foods = sortFoods(await db.getAll('foods'));
  return state.foods;
}
export const foodById = (id) => state.foods.find((f) => f.id === id);

export async function loadGoals() {
  state.goals = { ...DEFAULT_GOALS, ...(await db.getMeta('goals', {})) };
  return state.goals;
}

export function navigate(view, opts = {}) {
  if (opts.date) state.statsDate = opts.date;
  state.view = view;
  for (const s of document.querySelectorAll('.view')) s.hidden = s.dataset.view !== view;
  for (const t of document.querySelectorAll('.tab')) t.classList.toggle('active', t.dataset.tab === view);
  closeSheet(true);
  render();
  if (!opts.keepScroll) window.scrollTo(0, 0);
}

export async function render() {
  const v = views[state.view];
  const el = document.getElementById('view-' + state.view);
  document.querySelectorAll('.fab, .az').forEach((n) => n.remove());
  if (v) await v.render(el);
}

// ---------- Bottom-Sheet ----------
let sheetClose = null;
export function openSheet({ title, html, onMount, onClose }) {
  const wrap = document.getElementById('sheet-wrap');
  const body = document.getElementById('sheet-body');
  if (sheetClose) closeSheet(true);
  document.getElementById('sheet-title').textContent = title;
  body.innerHTML = html;
  wrap.hidden = false;
  body.scrollTop = 0;
  history.pushState({ sheet: true }, '');
  const close = (fromPop = false) => {
    if (!sheetClose) return;
    sheetClose = null;
    wrap.hidden = true;
    body.innerHTML = '';
    if (onClose) onClose();
    if (!fromPop && history.state && history.state.sheet) history.back();
  };
  sheetClose = close;
  if (onMount) onMount(body, close);
  return close;
}
export function closeSheet(fromPop = false) {
  if (sheetClose) sheetClose(fromPop);
}
export const sheetOpen = () => !!sheetClose;

export function confirmDialog(text, { ok = 'Löschen', danger = true, title = 'Bestätigen' } = {}) {
  return new Promise((resolve) => {
    let result = false;
    openSheet({
      title,
      html: `<div class="form"><p>${esc(text)}</p>
        <div class="btn-row"><button class="btn" data-no>Abbrechen</button>
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
  const t = document.getElementById('toast');
  t.innerHTML = `<span>${esc(msg)}</span>` + (action ? `<button>${esc(action.label)}</button>` : '');
  t.hidden = false;
  if (action) t.querySelector('button').onclick = () => { t.hidden = true; action.fn(); };
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.hidden = true), action ? 5000 : 2400);
}

export function emptyState(title, text) {
  return `<div class="empty">${icon('wheat')}<strong>${esc(title)}</strong><span>${esc(text)}</span></div>`;
}
