// Einstiegspunkt: Daten laden, Views registrieren, Navigation
import * as db from './db.js';
import { state, views, navigate, loadFoods, loadGoals, closeSheet, onPopState } from './core.js';
import today from './views/today.js';
import foods from './views/foods.js';
import stats from './views/stats.js';
import goals from './views/goals.js';

Object.assign(views, { today, foods, stats, goals });

async function boot() {
  db.requestPersist();
  await Promise.all([loadFoods(), loadGoals()]);
  document.getElementById('boot').remove();
  for (const t of document.querySelectorAll('.tab')) t.onclick = () => navigate(t.dataset.tab);
  for (const c of document.querySelectorAll('#sheet-wrap [data-close]')) c.onclick = () => closeSheet();
  window.addEventListener('popstate', onPopState);
  navigate(state.view);
}

boot().catch((e) => {
  console.error(e);
  document.getElementById('main').innerHTML = `<div class="card"><p class="error">Fehler beim Start: ${e.message}</p></div>`;
});
