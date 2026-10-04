// Lebensmittel: alphabetische Liste, A–Z, Suche, Formular mit Portionen
import * as db from '../db.js';
import { state, loadFoods, openSheet, confirmDialog, toast, icon, emptyState, render } from '../core.js';
import { parseNum, fmtKcal, fmtMacro, numToInput, plausibility, letterOf, norm, uid, esc, compareDe } from '../util.js';

let query = '';
const LETTERS = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ', '#'];

export const matches = (f, q) => !q || norm(f.name).includes(norm(q));
export const macroLine = (f) => `P ${fmtMacro(f.protein)} · F ${fmtMacro(f.fat)} · C ${fmtMacro(f.carbs)}`;

function listHtml(foods) {
  if (!state.foods.length) return emptyState('Noch keine Lebensmittel', 'Lege dein erstes Lebensmittel an – Werte pro 100 g.');
  if (!foods.length) return `<div class="empty compact">${icon('wheat')}<span>Kein Treffer für „${esc(query)}“.</span></div>`;
  let html = '', cur = null;
  for (const f of foods) {
    const l = letterOf(f.name);
    if (l !== cur) { cur = l; html += `<div class="letter" id="L-${l === '#' ? 'num' : l}">${l}</div>`; }
    const p = f.portions?.length ? ` · ${f.portions.length} Portion${f.portions.length > 1 ? 'en' : ''}` : '';
    html += `<button class="food" data-id="${f.id}">
      <div><div class="nm">${esc(f.name)}${f.demo ? ' <span class="badge">Demo</span>' : ''}</div><div class="sub">${macroLine(f)}${p}</div></div>
      <div class="kc">${fmtKcal(f.kcal)}<small>kcal/100 g</small></div></button>`;
  }
  return html;
}

function bindAz(el) {
  const rail = document.createElement('div');
  rail.className = 'az';
  const present = new Set(state.foods.map((f) => letterOf(f.name)));
  rail.innerHTML = LETTERS.map((l) => `<span data-l="${l}" class="${present.has(l) ? 'has' : ''}">${l}</span>`).join('');
  document.body.appendChild(rail);
  const jump = (x, y) => {
    const t = document.elementFromPoint(x, y);
    if (!t || !t.dataset.l) return;
    const idx = LETTERS.indexOf(t.dataset.l);
    for (const l of LETTERS.slice(idx)) { // nächster vorhandener Buchstabe
      const sec = el.querySelector(`#L-${l === '#' ? 'num' : l}`);
      if (sec) {
        const top = sec.getBoundingClientRect().top + window.scrollY - document.querySelector('.topbar').offsetHeight;
        window.scrollTo(0, top + 1);
        return;
      }
    }
  };
  rail.addEventListener('touchstart', (e) => { e.preventDefault(); jump(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
  rail.addEventListener('touchmove', (e) => { e.preventDefault(); jump(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
  rail.addEventListener('click', (e) => jump(e.clientX, e.clientY));
}

export default {
  render(el) {
    el.innerHTML = `
      <div class="section-title"><span class="label">Lebensmittel</span><span class="muted small" id="food-count"></span></div>
      <div class="search">${icon('search')}<input class="input" id="food-q" type="search" placeholder="Suchen…" autocomplete="off" value="${esc(query)}"></div>
      <div class="food-list" id="food-list"></div>`;
    const list = el.querySelector('#food-list');
    const draw = () => {
      const foods = state.foods.filter((f) => matches(f, query));
      list.innerHTML = listHtml(foods);
      el.querySelector('#food-count').textContent = state.foods.length ? `${state.foods.length}` : '';
    };
    draw();
    el.querySelector('#food-q').addEventListener('input', (e) => { query = e.target.value; draw(); });
    list.addEventListener('click', (e) => {
      const b = e.target.closest('.food');
      if (b) openFoodForm(state.foods.find((f) => f.id === b.dataset.id));
    });
    if (state.foods.length > 8) bindAz(el);
    const fab = document.createElement('button');
    fab.className = 'fab';
    fab.innerHTML = `${icon('plus')}Neu`;
    fab.onclick = () => openFoodForm(null);
    document.body.appendChild(fab);
  },
};

// ---------- Formular ----------
const numField = (name, label, val, suffix) => `
  <label class="field"><span>${label}</span><div class="input-wrap">
  <input class="input" name="${name}" inputmode="decimal" autocomplete="off" value="${val == null ? '' : numToInput(val)}"><span class="suffix">${suffix}</span></div></label>`;
const portionRow = (p = {}) => `
  <div class="portion-row">
    <input class="input" name="pname" placeholder="z. B. 1 Riegel" value="${esc(p.name || '')}" autocomplete="off">
    <div class="input-wrap"><input class="input" name="pgrams" inputmode="decimal" placeholder="45" value="${p.grams ? numToInput(p.grams) : ''}"><span class="suffix">g</span></div>
    <button type="button" class="icon-btn" data-delp aria-label="Portion entfernen">${icon('close')}</button>
  </div>`;

// onSaved(food) optional, z. B. aus dem Eintrag-Dialog
export function openFoodForm(food, onSaved, presetName = '') {
  const isNew = !food;
  const f = food || { name: presetName, kcal: null, protein: null, fat: null, carbs: null, portions: [] };
  openSheet({
    title: isNew ? 'Neues Lebensmittel' : 'Lebensmittel bearbeiten',
    html: `<form class="form" novalidate>
      <label class="field"><span>Name</span><input class="input" name="name" value="${esc(f.name)}" autocomplete="off" maxlength="80" required></label>
      <div class="label">Nährwerte pro 100 g</div>
      <div class="grid2">
        ${numField('kcal', 'Kalorien', f.kcal, 'kcal')}
        ${numField('protein', 'Protein', f.protein, 'g')}
        ${numField('fat', 'Fett', f.fat, 'g')}
        ${numField('carbs', 'Carbs', f.carbs, 'g')}
      </div>
      <div class="hint warn" id="plaus" hidden></div>
      <div class="card-head"><span class="label">Portionen (optional)</span></div>
      <div class="form" id="portions" style="gap:8px">${(f.portions || []).map(portionRow).join('')}</div>
      <button type="button" class="btn gold" id="addp">${icon('plus')}Portion hinzufügen</button>
      <p class="error" id="err" hidden></p>
      <div class="sheet-actions btn-row">
        ${isNew ? '' : `<button type="button" class="btn danger" id="del">Löschen</button>`}
        <button type="submit" class="btn primary">Speichern</button>
      </div></form>`,
    onMount(el, close) {
      const form = el.querySelector('form');
      const pl = el.querySelector('#portions');
      const val = (n) => parseNum(form.elements[n].value);
      const checkPlaus = () => {
        const v = { kcal: val('kcal'), protein: val('protein'), fat: val('fat'), carbs: val('carbs') };
        const box = el.querySelector('#plaus');
        if (Object.values(v).some((x) => !Number.isFinite(x))) { box.hidden = true; return; }
        const p = plausibility(v);
        box.hidden = p.ok;
        box.textContent = `Hinweis: Aus den Makros ergeben sich ca. ${fmtKcal(p.calc)} kcal (4 × Protein + 4 × Carbs + 9 × Fett). Bitte Werte prüfen – Speichern ist trotzdem möglich.`;
      };
      form.addEventListener('input', checkPlaus);
      checkPlaus();
      el.querySelector('#addp').onclick = () => {
        pl.insertAdjacentHTML('beforeend', portionRow());
        pl.lastElementChild.querySelector('input').focus();
      };
      pl.addEventListener('click', (e) => { if (e.target.closest('[data-delp]')) e.target.closest('.portion-row').remove(); });
      if (isNew && !presetName) setTimeout(() => form.elements.name.focus(), 250);

      form.onsubmit = async (e) => {
        e.preventDefault();
        form.querySelectorAll('.invalid').forEach((x) => x.classList.remove('invalid'));
        const errs = [];
        const name = form.elements.name.value.trim();
        if (!name) { errs.push('Bitte einen Namen eingeben.'); form.elements.name.classList.add('invalid'); }
        const vals = {};
        for (const [k, max] of [['kcal', 1000], ['protein', 100], ['fat', 100], ['carbs', 100]]) {
          const v = val(k);
          if (!Number.isFinite(v) || v < 0 || v > max) { form.elements[k].classList.add('invalid'); errs.push(`${k === 'kcal' ? 'Kalorien' : k === 'protein' ? 'Protein' : k === 'fat' ? 'Fett' : 'Carbs'}: Zahl zwischen 0 und ${max} angeben.`); }
          vals[k] = v;
        }
        if (!errs.length && vals.protein + vals.fat + vals.carbs > 100.5) errs.push('Protein + Fett + Carbs können zusammen nicht über 100 g pro 100 g liegen.');
        const portions = [];
        for (const row of pl.querySelectorAll('.portion-row')) {
          const n = row.querySelector('[name=pname]'), g = row.querySelector('[name=pgrams]');
          if (!n.value.trim() && !g.value.trim()) continue;
          const grams = parseNum(g.value);
          if (!n.value.trim()) { n.classList.add('invalid'); errs.push('Portion: Bitte einen Namen eingeben.'); }
          if (!Number.isFinite(grams) || grams <= 0 || grams > 5000) { g.classList.add('invalid'); errs.push('Portion: Gramm als Zahl größer 0 angeben.'); }
          portions.push({ name: n.value.trim(), grams });
        }
        const dup = state.foods.find((x) => x.id !== f.id && compareDe(x.name, name) === 0);
        const errEl = el.querySelector('#err');
        if (errs.length) { errEl.hidden = false; errEl.innerHTML = [...new Set(errs)].map(esc).join('<br>'); return; }
        if (dup && form.dataset.dupOk !== name) {
          form.dataset.dupOk = name;
          errEl.hidden = false;
          errEl.textContent = `Es gibt bereits „${dup.name}“. Zum Speichern trotzdem erneut auf „Speichern“ tippen.`;
          return;
        }
        const now = Date.now();
        const saved = { ...f, id: f.id || uid(), name, ...vals, portions, createdAt: f.createdAt || now, updatedAt: now };
        await db.put('foods', saved);
        await loadFoods();
        close();
        toast(isNew ? 'Lebensmittel angelegt' : 'Gespeichert');
        if (onSaved) onSaved(saved); else render();
      };

      const del = el.querySelector('#del');
      if (del) del.onclick = async () => {
        if (!(await confirmDialog(`„${f.name}“ löschen? Bereits erfasste Einträge bleiben erhalten.`))) return openFoodForm(food, onSaved);
        await db.del('foods', f.id);
        await loadFoods();
        toast('Lebensmittel gelöscht');
        render();
      };
    },
  });
}
