// Lebensmittel: alphabetische Liste, A–Z, Suche, Formular (Typ pro 100 g oder pro Portion)
import * as db from '../db.js';
import { state, loadFoods, openSheet, confirmDialog, toast, icon, emptyState, render } from '../core.js';
import { parseNum, fmtKcal, numToInput, plausibility, letterOf, norm, uid, esc, compareDe, macroText, NUTRIENTS } from '../util.js';

let query = '';
const LETTERS = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ', '#'];

export const matches = (f, q) => !q || norm(f.name).includes(norm(q));
export const macroLine = (f) => macroText(f);
// "100 g" bzw. Portionsname
export const basisLabel = (f) => (f.type === 'portion' ? f.portionName || '1 Portion' : '100 g');

function listHtml(foods) {
  if (!state.foods.length) return emptyState('Noch keine Lebensmittel', 'Lege dein erstes Lebensmittel an – Werte pro 100 g.');
  if (!foods.length) return `<div class="empty compact">${icon('wheat')}<span>Kein Treffer für „${esc(query)}“.</span></div>`;
  let html = '', cur = null;
  for (const f of foods) {
    const l = letterOf(f.name);
    if (l !== cur) { cur = l; html += `<div class="letter" id="L-${l === '#' ? 'num' : l}">${l}</div>`; }
    const portion = f.type === 'portion' ? ` <span class="badge red">${esc(basisLabel(f))}</span>` : '';
    html += `<button class="food" data-id="${f.id}">
      <div><div class="nm">${esc(f.name)}${portion}${f.demo ? ' <span class="badge">Demo</span>' : ''}</div><div class="sub">${macroLine(f)}</div></div>
      <div class="kc">${fmtKcal(f.kcal)}<small>kcal/${esc(basisLabel(f))}</small></div></button>`;
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
const LABELS = { kcal: 'Kalorien', fat: 'Fett', carbs: 'Carbs', protein: 'Protein' };
const numField = (name, val, suffix) => `
  <label class="field"><span>${LABELS[name]}</span><div class="input-wrap">
  <input class="input" name="${name}" inputmode="decimal" autocomplete="off" value="${val == null ? '' : numToInput(val)}"><span class="suffix">${suffix}</span></div></label>`;

// onSaved(food) optional, z. B. aus dem Eintrag-Dialog
export function openFoodForm(food, onSaved, presetName = '') {
  const isNew = !food;
  const f = food || { name: presetName, type: 'per100', kcal: null, fat: null, carbs: null, protein: null, portionName: '' };
  let type = f.type === 'portion' ? 'portion' : 'per100';
  openSheet({
    title: isNew ? 'Neues Lebensmittel' : 'Lebensmittel bearbeiten',
    html: `<form class="form" novalidate>
      <label class="field"><span>Name</span><input class="input" name="name" value="${esc(f.name)}" autocomplete="off" maxlength="80" required></label>
      <div class="seg" id="type-seg"><button type="button" data-type="per100">pro 100 g</button><button type="button" data-type="portion">pro Portion</button></div>
      <label class="field" id="pname-box"><span>Portionsname</span><input class="input" name="portionName" value="${esc(f.portionName || '')}" placeholder="z. B. 1 Riegel, 1 Shake" autocomplete="off" maxlength="40"></label>
      <div class="label" id="basis-label"></div>
      <div class="grid2">
        ${numField('kcal', f.kcal, 'kcal')}
        ${numField('fat', f.fat, 'g')}
        ${numField('carbs', f.carbs, 'g')}
        ${numField('protein', f.protein, 'g')}
      </div>
      <div class="hint warn" id="plaus" hidden></div>
      <p class="error" id="err" hidden></p>
      <div class="sheet-actions btn-row">
        ${isNew ? '' : `<button type="button" class="btn danger" id="del">Löschen</button>`}
        <button type="submit" class="btn primary">Speichern</button>
      </div></form>`,
    onMount(el, close) {
      const form = el.querySelector('form');
      const val = (n) => parseNum(form.elements[n].value);
      const drawType = () => {
        el.querySelectorAll('#type-seg button').forEach((b) => b.classList.toggle('on', b.dataset.type === type));
        el.querySelector('#pname-box').hidden = type !== 'portion';
        el.querySelector('#basis-label').textContent = type === 'portion' ? 'Nährwerte pro Portion' : 'Nährwerte pro 100 g';
      };
      el.querySelector('#type-seg').onclick = (e) => {
        const b = e.target.closest('button');
        if (!b) return;
        type = b.dataset.type;
        drawType();
        if (type === 'portion' && !form.elements.portionName.value) form.elements.portionName.focus();
      };
      drawType();
      const checkPlaus = () => {
        const v = Object.fromEntries(NUTRIENTS.map((k) => [k, val(k)]));
        const box = el.querySelector('#plaus');
        if (Object.values(v).some((x) => !Number.isFinite(x))) { box.hidden = true; return; }
        const p = plausibility(v);
        box.hidden = p.ok;
        box.textContent = `Hinweis: Aus den Makros ergeben sich ca. ${fmtKcal(p.calc)} kcal (9 × Fett + 4 × Carbs + 4 × Protein). Bitte Werte prüfen – Speichern ist trotzdem möglich.`;
      };
      form.addEventListener('input', checkPlaus);
      checkPlaus();
      if (isNew && !presetName) setTimeout(() => form.elements.name.focus(), 250);

      form.onsubmit = async (e) => {
        e.preventDefault();
        form.querySelectorAll('.invalid').forEach((x) => x.classList.remove('invalid'));
        const errs = [];
        const name = form.elements.name.value.trim();
        if (!name) { errs.push('Bitte einen Namen eingeben.'); form.elements.name.classList.add('invalid'); }
        const portionName = form.elements.portionName.value.trim();
        if (type === 'portion' && !portionName) { errs.push('Bitte einen Portionsnamen eingeben (z. B. „1 Riegel“).'); form.elements.portionName.classList.add('invalid'); }
        const per100 = type === 'per100';
        const vals = {};
        for (const k of NUTRIENTS) {
          const max = k === 'kcal' ? (per100 ? 1000 : 5000) : (per100 ? 100 : 1000);
          const v = val(k);
          if (!Number.isFinite(v) || v < 0 || v > max) { form.elements[k].classList.add('invalid'); errs.push(`${LABELS[k]}: Zahl zwischen 0 und ${fmtKcal(max)} angeben.`); }
          vals[k] = v;
        }
        if (!errs.length && per100 && vals.protein + vals.fat + vals.carbs > 100.5) errs.push('Fett + Carbs + Protein können zusammen nicht über 100 g pro 100 g liegen.');
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
        const { portions, portionName: _pn, ...base } = f; // alte Felder entfernen
        const saved = { ...base, id: f.id || uid(), name, type, ...vals, ...(per100 ? {} : { portionName }), createdAt: f.createdAt || now, updatedAt: now };
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
