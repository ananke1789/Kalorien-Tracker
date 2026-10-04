// Ziele: kcal, Protein, Fett einstellen; Carbs als Rest
import * as db from '../db.js';
import { state, toast, render } from '../core.js';
import { parseNum, numToInput, fmtMacro, carbGoal, DEFAULT_GOALS } from '../util.js';
import { COLORS, splitBar } from '../charts.js';
import { renderBackup } from './backup.js';

const field = (name, label, val, suffix, hint) => `
  <label class="field"><span>${label}</span><div class="input-wrap">
  <input class="input" name="${name}" inputmode="decimal" autocomplete="off" value="${numToInput(val)}"><span class="suffix">${suffix}</span></div>
  <small class="muted">${hint}</small></label>`;

export default {
  async render(el) {
    const g = state.goals;
    el.innerHTML = `
      <div class="section-title"><span class="label">Tagesziele</span></div>
      <form class="card form" id="goal-form" novalidate>
        <svg class="watermark" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-gear"/></svg>
        ${field('kcal', 'Kalorien', g.kcal, 'kcal', 'Zielwert')}
        <div class="grid2">
          ${field('protein', 'Protein', g.protein, 'g', 'Mindestziel')}
          ${field('fat', 'Fett', g.fat, 'g', 'Mindestziel')}
        </div>
        <div class="goal-carbs"><span class="label">Carbs (Rest)</span><span><b id="carbs-out"></b> g</span></div>
        <div>
          <div id="split"></div>
          <div class="legend" id="split-legend" style="margin-top:8px"></div>
        </div>
        <p class="small muted">Carbs = (kcal − 4 × Protein − 9 × Fett) ÷ 4</p>
        <p class="error" id="err" hidden></p>
        <div class="btn-row"><button type="button" class="btn" id="reset">Standard</button><button type="submit" class="btn primary">Speichern</button></div>
      </form>
      <div id="goal-extra" class="view" style="animation:none"></div>`;
    const form = el.querySelector('#goal-form');
    const read = () => ({ kcal: parseNum(form.elements.kcal.value), protein: parseNum(form.elements.protein.value), fat: parseNum(form.elements.fat.value) });
    const update = () => {
      const v = read();
      const ok = Object.values(v).every(Number.isFinite);
      const raw = ok ? (v.kcal - 4 * v.protein - 9 * v.fat) / 4 : NaN;
      el.querySelector('#carbs-out').textContent = ok ? fmtMacro(Math.max(0, raw)) : '–';
      const parts = ok ? [
        { label: 'Protein', value: 4 * v.protein, color: COLORS.protein },
        { label: 'Fett', value: 9 * v.fat, color: COLORS.fat },
        { label: 'Carbs', value: 4 * carbGoal(v), color: COLORS.carbs },
      ] : [];
      const tot = parts.reduce((s, p) => s + p.value, 0) || 1;
      el.querySelector('#split').innerHTML = ok ? splitBar(parts) : '';
      el.querySelector('#split-legend').innerHTML = parts.map((p) => `<span><i style="background:${p.color}"></i>${p.label} ${Math.round((p.value / tot) * 100)} %</span>`).join('');
      const err = el.querySelector('#err');
      err.hidden = !(ok && raw < 0);
      err.textContent = 'Protein und Fett liefern schon mehr Kalorien als das kcal-Ziel – Carbs wären negativ.';
    };
    form.addEventListener('input', update);
    update();
    el.querySelector('#reset').onclick = () => {
      form.elements.kcal.value = DEFAULT_GOALS.kcal;
      form.elements.protein.value = DEFAULT_GOALS.protein;
      form.elements.fat.value = DEFAULT_GOALS.fat;
      update();
    };
    form.onsubmit = async (e) => {
      e.preventDefault();
      form.querySelectorAll('.invalid').forEach((x) => x.classList.remove('invalid'));
      const v = read();
      const limits = { kcal: [500, 10000], protein: [0, 600], fat: [0, 400] };
      const bad = Object.keys(limits).filter((k) => !Number.isFinite(v[k]) || v[k] < limits[k][0] || v[k] > limits[k][1]);
      const err = el.querySelector('#err');
      if (bad.length) {
        bad.forEach((k) => form.elements[k].classList.add('invalid'));
        err.hidden = false;
        err.textContent = 'Bitte gültige Werte eingeben (kcal 500–10.000, Protein 0–600 g, Fett 0–400 g).';
        return;
      }
      if (v.kcal - 4 * v.protein - 9 * v.fat < 0) { err.hidden = false; return; }
      state.goals = { kcal: Math.round(v.kcal), protein: v.protein, fat: v.fat };
      await db.setMeta('goals', state.goals);
      toast('Ziele gespeichert');
      render();
    };
    await renderBackup(el.querySelector('#goal-extra'));
  },
};
