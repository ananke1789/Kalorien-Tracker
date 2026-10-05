// Einstiegspunkt: Daten laden, Views registrieren, Navigation
import * as db from './db.js';
import { state, views, navigate, loadFoods, loadGoals, closeSheet, onPopState, toast } from './core.js';
import today from './views/today.js';
import foods from './views/foods.js';
import stats from './views/stats.js';
import goals from './views/goals.js';
import training from './views/training.js';
import { loadTraining } from './training/store.js';

Object.assign(views, { today, foods, training, stats, goals });

async function boot() {
  db.requestPersist();
  await Promise.all([loadFoods(), loadGoals(), loadTraining()]);
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
  navigator.serviceWorker.register('sw.js').catch((e) => console.warn('Service Worker:', e));
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController) toast('Neue Version installiert', { label: 'Neu laden', fn: () => location.reload() });
  });
}

boot().catch((e) => {
  console.error(e);
  document.getElementById('main').innerHTML = `<div class="card"><p class="error">Fehler beim Start: ${e.message}</p></div>`;
});
