// Training: Starten | Verlauf | Statistik | Pläne
import { openSheet, toast, icon, render, emptyState } from '../core.js';
import { esc, todayKey, fmtDate, relDayLabel } from '../util.js';
import { newWorkout, workoutProgress } from '../training/model.js';
import { tstate, loadTraining, getActive, saveActive, clearActive, finishWorkout, planById } from '../training/store.js';
import { MAIN_PLAN_IDS } from '../training/plans.js';
import { renderWorkout } from './workout.js';

const SUBS = [['start', 'Starten'], ['history', 'Verlauf'], ['stats', 'Statistik'], ['plans', 'Pläne']];
export const tview = { sub: 'start', startDate: null, editId: null, planEdit: null };
const extra = {}; // weitere Bereiche: name -> render(el)
export const registerTrainingSub = (name, fn) => (extra[name] = fn);

async function startPlan(planId) {
  const plan = planById(planId);
  if (!plan) return;
  const w = newWorkout(plan, tstate.catalog, tstate.history, tview.startDate || todayKey());
  await saveActive(w);
  tview.startDate = null;
  render();
  window.scrollTo(0, 0);
}

function openSpecialMenu() {
  const specials = tstate.plans.filter((p) => p.kind === 'special');
  openSheet({
    title: 'Sondertraining',
    html: `<div class="big-choice">${specials.map((p) => `<button class="big-btn gold" data-plan="${p.id}"><b>${esc(p.name)}</b><span>${esc(p.info || '')}</span></button>`).join('')}</div>`,
    onMount(el, close) {
      el.onclick = (e) => { const b = e.target.closest('[data-plan]'); if (b) { close(); startPlan(b.dataset.plan); } };
    },
  });
}

async function renderStart(el) {
  const active = await getActive();
  if (active) {
    return renderWorkout(el, active, {
      mode: 'active',
      onFinish: async (w) => {
        const complete = workoutProgress(w).complete;
        await finishWorkout(w);
        toast(complete ? '★ Plan erfüllt – Training gespeichert' : 'Training gespeichert');
        tview.sub = 'history';
        render();
        window.scrollTo(0, 0);
      },
      onDiscard: async () => { await clearActive(); toast('Training verworfen'); render(); },
    });
  }
  const date = tview.startDate || todayKey();
  const mains = MAIN_PLAN_IDS.map(planById).filter(Boolean);
  el.innerHTML = `
    <div class="card form">
      <div class="card-head"><span class="label">Neues Training</span><span class="small muted">${relDayLabel(date)}</span></div>
      <label class="field"><span>Datum</span><input class="input" type="date" id="t-date" value="${date}" max="${todayKey()}"></label>
    </div>
    <div class="big-choice">
      ${mains.map((p) => `<button class="big-btn" data-plan="${p.id}"><b>${esc(p.name)}</b><span>${esc(p.info || '')} · ${p.items.filter((i) => i.kind === 'ex').length} Übungen</span></button>`).join('')}
      <button class="big-btn gold" id="special"><b>Sondertraining</b><span>${tstate.plans.filter((p) => p.kind === 'special').length} Varianten</span></button>
    </div>
    ${tstate.history[0] ? `<p class="small muted" style="text-align:center;margin:4px 0 0">Letztes Training: ${esc(tstate.history[0].planName)} · ${fmtDate(tstate.history[0].date)}</p>` : ''}`;
  el.querySelector('#t-date').onchange = (e) => { tview.startDate = e.target.value || null; render(); };
  el.querySelectorAll('[data-plan]').forEach((b) => (b.onclick = () => startPlan(b.dataset.plan)));
  el.querySelector('#special').onclick = openSpecialMenu;
}

export default {
  async render(el) {
    if (!tstate.catalog.length) await loadTraining();
    el.innerHTML = `<div class="seg" id="t-sub">${SUBS.map(([id, l]) => `<button data-sub="${id}" class="${tview.sub === id ? 'on' : ''}">${l}</button>`).join('')}</div>
      <div id="t-body" class="view" style="animation:none"></div>`;
    el.querySelectorAll('#t-sub button').forEach((b) => (b.onclick = () => { tview.sub = b.dataset.sub; tview.editId = null; tview.planEdit = null; render(); window.scrollTo(0, 0); }));
    const body = el.querySelector('#t-body');
    if (tview.sub === 'start') await renderStart(body);
    else if (extra[tview.sub]) await extra[tview.sub](body);
    else body.innerHTML = emptyState('In Arbeit', 'Dieser Bereich folgt.');
  },
};
