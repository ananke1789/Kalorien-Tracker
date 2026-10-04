// Auswertung: Tagesüberblick und Wochenüberblick
import * as db from '../db.js';
import { state, icon, render, navigate, emptyState } from '../core.js';
import { ring, donut, COLORS } from '../charts.js';
import {
  NUTRIENTS, fmtVal, fmtDate, addDays, relDayLabel, sumEntries, fullGoals, goalStatus, planFulfilled,
} from '../util.js';

const LABEL = { kcal: 'Kalorien', protein: 'Protein', fat: 'Fett', carbs: 'Carbs' };
let mode = 'day';

function statusText(k, st, ist, ziel) {
  if (st === 'exceeded') return `<div class="s pos">Mindestziel übertroffen</div>`;
  if (st === 'met') return `<div class="s pos">${k === 'protein' || k === 'fat' ? 'Mindestziel erreicht' : 'Ziel erreicht'}</div>`;
  if (st === 'over') return `<div class="s">${fmtVal(k, ist - ziel)} über Ziel</div>`;
  return `<div class="s">noch ${fmtVal(k, ziel - ist)}</div>`;
}

async function renderDay(el) {
  const date = state.statsDate;
  const entries = await db.entriesByDate(date);
  const tot = sumEntries(entries);
  const g = fullGoals(state.goals);
  const ok = planFulfilled(tot, state.goals);
  const kp = { protein: tot.protein * 4, fat: tot.fat * 9, carbs: tot.carbs * 4 };
  const ks = kp.protein + kp.fat + kp.carbs;
  const gp = { protein: g.protein * 4, fat: g.fat * 9, carbs: g.carbs * 4 };
  const gs = gp.protein + gp.fat + gp.carbs || 1;
  const pct = (v, s) => (s ? Math.round((v / s) * 100) : 0);
  el.innerHTML = `
    <div class="datebar">
      <button class="icon-btn" data-dnav="-1" aria-label="Vorheriger Tag">${icon('left')}</button>
      <div class="date-btn" style="display:grid;justify-items:center"><span class="d1">${relDayLabel(date)}</span><span class="d2">${fmtDate(date)}</span></div>
      <button class="icon-btn" data-dnav="1" aria-label="Nächster Tag">${icon('right')}</button>
    </div>
    <div class="card">
      <svg class="watermark" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-gear"/></svg>
      <div class="card-head"><span class="label">Ist gegen Ziel</span>
        ${ok ? `<span class="plan-ok">${icon('star', 'star-status on')}Plan erfüllt</span>` : icon('star', 'star-status off')}</div>
      <hr class="rule red">
      ${entries.length ? '' : `<p class="small muted" style="margin:0 0 8px">Für diesen Tag gibt es noch keine Einträge.</p>`}
      <div class="rings">${NUTRIENTS.map((k) => {
        const st = goalStatus(k, tot[k], g[k]);
        return `<div class="ring">${ring(tot[k], g[k], COLORS[k], st)}<div class="k">${LABEL[k]}</div>
          <div class="s"><b>${fmtVal(k, tot[k])}</b><br>von ${fmtVal(k, g[k])}${k === 'kcal' ? '' : ' g'}</div>${statusText(k, st, tot[k], g[k])}</div>`;
      }).join('')}</div>
    </div>
    <div class="card">
      <div class="card-head"><span class="label">Kalorienverteilung</span><span class="small muted">aus Makros</span></div>
      <hr class="rule red">
      <div style="display:grid;grid-template-columns:150px 1fr;gap:14px;align-items:center">
        ${donut(['protein', 'fat', 'carbs'].map((k) => ({ label: LABEL[k], value: kp[k], color: COLORS[k] })), ks ? fmtVal('kcal', ks) : '–', 'KCAL')}
        <div style="display:grid;gap:10px">${['protein', 'fat', 'carbs'].map((k) => `
          <div><div class="legend"><span><i style="background:${COLORS[k]}"></i><b style="color:var(--ink)">${LABEL[k]}</b></span></div>
          <div style="font-size:22px;font-weight:800;line-height:1.1">${pct(kp[k], ks)} %</div>
          <div class="small muted">Ziel ${pct(gp[k], gs)} %</div></div>`).join('')}</div>
      </div>
    </div>
    <button class="btn block" id="to-today">${icon('sun')}Diesen Tag bearbeiten</button>`;
  el.querySelectorAll('[data-dnav]').forEach((b) => (b.onclick = () => { state.statsDate = addDays(state.statsDate, +b.dataset.dnav); render(); }));
  el.querySelector('#to-today').onclick = () => { state.date = date; navigate('today'); };
}

export default {
  async render(el) {
    el.innerHTML = `
      <div class="seg" id="stats-mode"><button data-mode="day">Tag</button><button data-mode="week">Woche</button></div>
      <div id="stats-body" class="view"></div>`;
    el.querySelectorAll('#stats-mode button').forEach((b) => {
      b.classList.toggle('on', b.dataset.mode === mode);
      b.onclick = () => { mode = b.dataset.mode; render(); };
    });
    const body = el.querySelector('#stats-body');
    if (mode === 'day') await renderDay(body);
    else body.innerHTML = emptyState('Wochenüberblick', 'Folgt im nächsten Schritt.');
  },
  setMode(m) { mode = m; },
};
