// Einstiegspunkt: Daten laden, Views registrieren, Navigation, Service Worker
import * as db from './db.js';
import { state, views, navigate, loadAll, closeSheet, onPopState, toast } from './core.js';
import overview from './views/overview.js';
import week from './views/week.js';
import fixed from './views/fixed.js';
import stats from './views/stats.js';
import more from './views/more.js';

Object.assign(views, { overview, week, fixed, stats, more });

async function boot() {
  db.requestPersist();
  await loadAll();
  document.getElementById('boot').remove();
  for (const t of document.querySelectorAll('.tab')) t.onclick = () => navigate(t.dataset.tab);
  for (const c of document.querySelectorAll('#sheet-wrap [data-close]')) c.onclick = () => closeSheet();
  window.addEventListener('popstate', onPopState);
  navigate(state.view);
  registerSW();
}

function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register('sw.js', { scope: './' }).catch((e) => console.warn('Service Worker:', e));
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController) toast('Neue Version installiert', { label: 'Neu laden', fn: () => location.reload() });
  });
}

boot().catch((e) => {
  console.error(e);
  document.getElementById('main').innerHTML = `<div class="card"><p class="error">Fehler beim Start: ${e.message}</p></div>`;
});
