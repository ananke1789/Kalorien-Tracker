// Heute: Datumsnavigation, Tagesstand, Mahlzeiten, Einträge
import * as db from '../db.js';
import { state, loadFoods, foodById, openSheet, confirmDialog, toast, icon, render } from '../core.js';
import { openFoodForm, matches, macroLine } from './foods.js';
import { backupHint, exportData } from './backup.js';
import {
  MEALS, NUTRIENTS, fmtKcal, fmtMacro, fmtVal, fmtDate, addDays, todayKey, relDayLabel, parseNum, numToInput,
  scale, entryValues, sumEntries, fullGoals, goalStatus, planFulfilled, esc, uid, NUTRIENT_LABEL,
} from '../util.js';

const SHORT = { kcal: 'kcal', protein: 'Protein', fat: 'Fett', carbs: 'Carbs' };

// Tagesstand-Karte (auch in der Auswertung genutzt)
export function summaryHtml(tot, goals) {
  const g = fullGoals(goals);
  const ok = planFulfilled(tot, goals);
  const cells = NUTRIENTS.map((k) => {
    const st = goalStatus(k, tot[k], g[k]);
    const rest = g[k] - tot[k];
    let o;
    if (st === 'exceeded') o = `+${fmtVal(k, -rest)} übertroffen`;
    else if (st === 'over') o = `${fmtVal(k, -rest)} über`;
    else if (st === 'met') o = rest > 0 ? `${fmtVal(k, rest)} offen` : 'erreicht';
    else o = `${fmtVal(k, rest)} offen`;
    const pct = g[k] > 0 ? Math.min(100, (tot[k] / g[k]) * 100) : 0;
    return `<div class="sum-cell st-${st}" data-k="${k}">
      <div class="k">${SHORT[k]}</div>
      <div class="v">${fmtVal(k, tot[k])}</div>
      <div class="g">${k === 'protein' || k === 'fat' ? 'min. ' : 'Ziel '}${fmtVal(k, g[k])}${k === 'kcal' ? '' : ' g'}</div>
      <div class="bar"><i style="width:${pct}%"></i></div>
      <div class="o">${o}</div></div>`;
  }).join('');
  return `<div class="card summary">
    <svg class="watermark" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-gear"/></svg>
    <div class="card-head"><span class="label">Tagesstand</span>
      ${ok ? `<span class="plan-ok">${icon('star', 'star-status on')}Plan erfüllt</span>` : icon('star', 'star-status off')}</div>
    <div class="sum-grid">${cells}</div></div>`;
}

const gramText = (g) => `${fmtMacro(g).replace(/,0$/, '')} g`;
const portionText = (e) => (e.portion
  ? `${e.portion.count === 1 ? '' : `${numToInput(e.portion.count)} × `}${esc(e.portion.name)} · ${gramText(e.grams)}`
  : gramText(e.grams));

function mealHtml(meal, entries) {
  const tot = sumEntries(entries);
  const rows = entries.map((e) => {
    const v = entryValues(e);
    return `<button class="entry" data-id="${e.id}">
      <div class="main"><div class="nm">${esc(e.foodName)}</div><div class="sub">${portionText(e)}</div></div>
      <div class="kc">${fmtKcal(v.kcal)} kcal<small>P ${fmtMacro(v.protein)} · F ${fmtMacro(v.fat)} · C ${fmtMacro(v.carbs)}</small></div></button>`;
  }).join('');
  return `<div class="card meal" data-meal="${meal.id}">
    <div class="meal-head"><span class="label">${meal.label}</span>
      <div class="meal-sum">${entries.length ? `<b>${fmtKcal(tot.kcal)}</b> kcal<br>P ${fmtMacro(tot.protein)} · F ${fmtMacro(tot.fat)} · C ${fmtMacro(tot.carbs)}` : ''}</div></div>
    ${rows || `<div class="empty compact">${icon('wheat')}<span>Noch nichts eingetragen.</span></div>`}
    <div class="meal-actions">
      <button class="add" data-add="${meal.id}">${icon('plus')}Eintrag</button>
      <button data-yday="${meal.id}">${icon('copy')}Von gestern</button>
    </div></div>`;
}

export default {
  async render(el) {
    const date = state.date;
    const entries = (await db.entriesByDate(date)).sort((a, b) => a.createdAt - b.createdAt);
    if (state.view !== 'today' || date !== state.date) return;
    const tot = sumEntries(entries);
    const hint = await backupHint();
    if (state.view !== 'today' || date !== state.date) return;
    el.innerHTML = `${hint}
      <div class="datebar">
        <button class="icon-btn" data-nav="-1" aria-label="Vorheriger Tag">${icon('left')}</button>
        <button class="date-btn" id="date-pick"><span class="d1">${relDayLabel(date)}</span><span class="d2">${fmtDate(date)}</span></button>
        <input type="date" class="hidden-date" id="date-input" value="${date}" tabindex="-1" aria-hidden="true">
        <button class="icon-btn" data-nav="1" aria-label="Nächster Tag">${icon('right')}</button>
      </div>
      ${date !== todayKey() ? `<button class="btn ghost small" id="go-today" style="min-height:36px;margin:-12px 0 -6px;justify-self:center;color:var(--red)">↺ Zu heute</button>` : ''}
      ${summaryHtml(tot, state.goals)}
      ${MEALS.map((m) => mealHtml(m, entries.filter((e) => e.meal === m.id))).join('')}`;

    el.querySelectorAll('[data-nav]').forEach((b) => (b.onclick = () => { state.date = addDays(state.date, +b.dataset.nav); render(); }));
    const di = el.querySelector('#date-input');
    el.querySelector('#date-pick').onclick = () => { try { di.showPicker(); } catch { di.focus(); di.click(); } };
    di.onchange = () => { if (di.value) { state.date = di.value; render(); } };
    const bh = el.querySelector('#backup-hint');
    if (bh) bh.onclick = async () => { await exportData(); render(); };
    const gt = el.querySelector('#go-today');
    if (gt) gt.onclick = () => { state.date = todayKey(); render(); };
    el.querySelectorAll('[data-add]').forEach((b) => (b.onclick = () => openEntryForm({ meal: b.dataset.add, date })));
    el.querySelectorAll('[data-yday]').forEach((b) => (b.onclick = () => copyFromYesterday(date, b.dataset.yday)));
    el.querySelectorAll('.entry').forEach((b) => (b.onclick = () => openEntryForm({ entry: entries.find((e) => e.id === b.dataset.id) })));

    const fab = document.createElement('button');
    fab.className = 'fab';
    fab.innerHTML = `${icon('plus')}Eintrag`;
    fab.onclick = () => openEntryForm({ meal: guessMeal(), date });
    document.body.appendChild(fab);
  },
};

function guessMeal() {
  const h = new Date().getHours();
  return h < 11 ? 'breakfast' : h < 15 ? 'lunch' : h < 18 ? 'snacks' : 'dinner';
}

async function copyFromYesterday(date, meal) {
  const y = addDays(date, -1);
  const src = (await db.entriesByDate(y)).filter((e) => e.meal === meal);
  const label = MEALS.find((m) => m.id === meal).label;
  if (!src.length) return toast(`${label} am ${fmtDate(y)} ist leer.`);
  const now = Date.now();
  const copies = src.map((e, i) => ({ ...e, id: uid(), date, demo: false, createdAt: now + i }));
  await db.putMany('entries', copies);
  render();
  toast(`${copies.length} Eintr${copies.length > 1 ? 'äge' : 'ag'} übernommen`, {
    label: 'Rückgängig', fn: async () => { await db.delMany('entries', copies.map((c) => c.id)); render(); },
  });
}

async function touchFood(id) {
  const f = foodById(id);
  if (f) { await db.put('foods', { ...f, lastUsed: Date.now() }); await loadFoods(); }
}

// ---------- Eintrag-Dialog ----------
// opts: { meal, date } für neu, { entry } zum Bearbeiten, food = vorausgewählt
export function openEntryForm(opts) {
  const edit = opts.entry || null;
  const ctx = {
    date: edit ? edit.date : opts.date,
    meal: edit ? edit.meal : opts.meal,
    food: opts.food || (edit ? { id: edit.foodId, name: edit.foodName, ...edit.per100, portions: foodById(edit.foodId)?.portions || [] } : null),
    mode: edit?.portion ? 'portion' : 'gram',
    portionIdx: 0,
    q: '',
  };
  if (edit?.portion) {
    const i = ctx.food.portions.findIndex((p) => p.name === edit.portion.name && p.grams === edit.portion.grams);
    if (i >= 0) ctx.portionIdx = i; else ctx.food.portions = [edit.portion, ...ctx.food.portions];
  }

  openSheet({
    title: edit ? 'Eintrag bearbeiten' : 'Eintrag hinzufügen',
    html: `<div class="form">
      <div class="seg" id="meal-seg">${MEALS.map((m) => `<button type="button" data-m="${m.id}">${m.label.replace('Mittagessen', 'Mittag').replace('Abendessen', 'Abend')}</button>`).join('')}</div>
      <div id="pick-area"></div>
      <div id="amount-area"></div>
    </div>`,
    onMount(el, close) {
      const seg = el.querySelector('#meal-seg');
      const drawSeg = () => seg.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.m === ctx.meal));
      seg.onclick = (e) => { const b = e.target.closest('button'); if (b) { ctx.meal = b.dataset.m; drawSeg(); } };
      drawSeg();
      const pickArea = el.querySelector('#pick-area');
      const amountArea = el.querySelector('#amount-area');

      const drawPicker = () => {
        amountArea.innerHTML = '';
        pickArea.innerHTML = `<div class="form" style="gap:10px">
          <div class="search">${icon('search')}<input class="input" id="pick-q" type="search" placeholder="Lebensmittel suchen…" autocomplete="off" value="${esc(ctx.q)}"></div>
          <div class="pick-list" id="pick-list"></div></div>`;
        const q = pickArea.querySelector('#pick-q');
        const list = pickArea.querySelector('#pick-list');
        const drawList = () => {
          const found = state.foods.filter((f) => matches(f, ctx.q));
          const recent = ctx.q ? [] : [...state.foods].filter((f) => f.lastUsed).sort((a, b) => b.lastUsed - a.lastUsed).slice(0, 5);
          const item = (f) => `<button class="pick" data-id="${f.id}"><span>${esc(f.name)}</span><span class="kc">${fmtKcal(f.kcal)} kcal</span></button>`;
          let html = '';
          if (recent.length) html += `<div class="pick-head">Zuletzt verwendet</div>${recent.map(item).join('')}<div class="pick-head">Alle A–Z</div>`;
          html += found.map(item).join('');
          html += `<button class="pick" data-new style="color:var(--red);font-weight:700">${icon('plus', 'star-status')}${ctx.q ? `„${esc(ctx.q)}“ neu anlegen` : 'Neues Lebensmittel anlegen'}</button>`;
          list.innerHTML = html;
        };
        drawList();
        q.oninput = () => { ctx.q = q.value; drawList(); };
        list.onclick = (e) => {
          const b = e.target.closest('.pick');
          if (!b) return;
          if (b.hasAttribute('data-new')) {
            const keep = { ...ctx };
            return openFoodForm(null, (food) => openEntryForm({ meal: keep.meal, date: keep.date, food }), ctx.q.trim());
          }
          ctx.food = state.foods.find((f) => f.id === b.dataset.id);
          ctx.mode = 'gram'; ctx.portionIdx = 0;
          drawAmount();
        };
        if (!state.foods.length) setTimeout(() => q.focus(), 250);
      };

      const drawAmount = () => {
        const f = ctx.food;
        const ps = f.portions || [];
        if (!ps.length) ctx.mode = 'gram';
        const gramsVal = edit && !edit.portion ? numToInput(edit.grams) : '';
        const countVal = edit && edit.portion ? numToInput(edit.portion.count) : '1';
        pickArea.innerHTML = `<div class="chosen"><div><div class="nm">${esc(f.name)}</div><div class="small muted">${fmtKcal(f.kcal)} kcal · ${macroLine(f)} je 100 g</div></div>
          ${edit ? '' : `<button class="btn ghost" id="change" style="margin-left:auto;min-height:44px;padding:0 10px">Ändern</button>`}</div>`;
        amountArea.innerHTML = `<form class="form" novalidate>
          ${ps.length ? `<div class="seg" id="mode"><button type="button" data-mode="gram">Gramm</button><button type="button" data-mode="portion">Portion</button></div>` : ''}
          <div id="gram-box"><label class="field"><span>Menge</span><div class="input-wrap"><input class="input" name="grams" inputmode="decimal" autocomplete="off" value="${gramsVal}" placeholder="z. B. 100"><span class="suffix">g</span></div></label></div>
          <div id="portion-box" class="grid2">
            <label class="field"><span>Portion</span><select class="input" name="portion">${ps.map((p, i) => `<option value="${i}">${esc(p.name)} (${fmtMacro(p.grams).replace(',0', '')} g)</option>`).join('')}</select></label>
            <label class="field"><span>Anzahl</span><input class="input" name="count" inputmode="decimal" autocomplete="off" value="${countVal}"></label>
          </div>
          <div class="preview" id="preview"></div>
          <p class="error" id="err" hidden></p>
          <div class="sheet-actions" style="display:grid;gap:10px">
            <button type="submit" class="btn primary block">${edit ? 'Speichern' : 'Hinzufügen'}</button>
            ${edit ? `<div class="btn-row"><button type="button" class="btn" id="copy">${icon('copy')}Kopieren</button><button type="button" class="btn danger" id="del">Löschen</button></div>` : ''}
          </div></form>`;
        const form = amountArea.querySelector('form');
        if (ps.length) form.elements.portion.value = String(ctx.portionIdx);
        const grams = () => {
          if (ctx.mode === 'portion') {
            const p = ps[+form.elements.portion.value];
            return p ? p.grams * parseNum(form.elements.count.value) : NaN;
          }
          return parseNum(form.elements.grams.value);
        };
        const update = () => {
          amountArea.querySelector('#gram-box').hidden = ctx.mode !== 'gram';
          amountArea.querySelector('#portion-box').hidden = ctx.mode !== 'portion';
          amountArea.querySelectorAll('#mode button').forEach((b) => b.classList.toggle('on', b.dataset.mode === ctx.mode));
          const g = grams();
          const v = Number.isFinite(g) && g > 0 ? scale(f, g) : null;
          amountArea.querySelector('#preview').innerHTML = NUTRIENTS.map((k) => `<div><b>${v ? fmtVal(k, v[k]) : '–'}</b><span>${k === 'kcal' ? 'kcal' : NUTRIENT_LABEL[k] + ' g'}</span></div>`).join('');
        };
        update();
        form.addEventListener('input', update);
        form.addEventListener('change', update);
        const mode = amountArea.querySelector('#mode');
        if (mode) mode.onclick = (e) => { const b = e.target.closest('button'); if (b) { ctx.mode = b.dataset.mode; update(); (ctx.mode === 'gram' ? form.elements.grams : form.elements.count).focus(); } };
        const ch = pickArea.querySelector('#change');
        if (ch) ch.onclick = () => { ctx.food = null; drawPicker(); };
        if (!edit) setTimeout(() => (ctx.mode === 'gram' ? form.elements.grams : form.elements.count).focus(), 200);

        form.onsubmit = async (e) => {
          e.preventDefault();
          const g = grams();
          const err = amountArea.querySelector('#err');
          if (!Number.isFinite(g) || g <= 0 || g > 10000) {
            err.hidden = false;
            err.textContent = ctx.mode === 'portion' ? 'Bitte eine gültige Anzahl größer 0 eingeben.' : 'Bitte eine Menge in Gramm größer 0 eingeben.';
            form.querySelector(ctx.mode === 'portion' ? '[name=count]' : '[name=grams]').classList.add('invalid');
            return;
          }
          const p = ctx.mode === 'portion' ? ps[+form.elements.portion.value] : null;
          const entry = {
            ...(edit || {}),
            id: edit ? edit.id : uid(),
            date: ctx.date,
            meal: ctx.meal,
            foodId: f.id,
            foodName: f.name,
            per100: edit && edit.foodId === f.id ? edit.per100 : { kcal: f.kcal, protein: f.protein, fat: f.fat, carbs: f.carbs },
            grams: Math.round(g * 100) / 100,
            portion: p ? { name: p.name, grams: p.grams, count: parseNum(form.elements.count.value) } : null,
            createdAt: edit ? edit.createdAt : Date.now(),
          };
          delete entry.demo;
          await db.put('entries', entry);
          if (!edit) await touchFood(f.id);
          close();
          toast(edit ? 'Eintrag gespeichert' : 'Eintrag hinzugefügt');
          render();
        };
        if (edit) {
          amountArea.querySelector('#del').onclick = async () => {
            if (!(await confirmDialog(`Eintrag „${edit.foodName}“ löschen?`))) return openEntryForm({ entry: edit });
            await db.del('entries', edit.id);
            toast('Eintrag gelöscht', { label: 'Rückgängig', fn: async () => { await db.put('entries', edit); render(); } });
            render();
          };
          amountArea.querySelector('#copy').onclick = () => openCopyForm(edit);
        }
      };

      if (ctx.food) drawAmount(); else drawPicker();
    },
  });
}

function openCopyForm(entry) {
  const tomorrow = addDays(entry.date, 1);
  openSheet({
    title: 'Auf anderen Tag kopieren',
    html: `<form class="form" novalidate>
      <p class="muted small">${esc(entry.foodName)} · ${portionText(entry)}</p>
      <label class="field"><span>Zieldatum</span><input class="input" type="date" name="date" value="${tomorrow}" required></label>
      <div class="seg" id="meal-seg">${MEALS.map((m) => `<button type="button" data-m="${m.id}">${m.label.replace('Mittagessen', 'Mittag').replace('Abendessen', 'Abend')}</button>`).join('')}</div>
      <div class="btn-row"><button type="button" class="btn" data-quick="0">Heute</button><button type="button" class="btn" data-quick="1">Morgen</button></div>
      <div class="sheet-actions"><button type="submit" class="btn primary block">Kopieren</button></div></form>`,
    onMount(el, close) {
      let meal = entry.meal;
      const seg = el.querySelector('#meal-seg');
      const drawSeg = () => seg.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.m === meal));
      seg.onclick = (e) => { const b = e.target.closest('button'); if (b) { meal = b.dataset.m; drawSeg(); } };
      drawSeg();
      const form = el.querySelector('form');
      el.querySelectorAll('[data-quick]').forEach((b) => (b.onclick = () => { form.elements.date.value = addDays(todayKey(), +b.dataset.quick); }));
      form.onsubmit = async (e) => {
        e.preventDefault();
        const date = form.elements.date.value;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return form.elements.date.classList.add('invalid');
        await db.put('entries', { ...entry, id: uid(), date, meal, demo: false, createdAt: Date.now() });
        close();
        toast(`Kopiert auf ${fmtDate(date)}`);
        render();
      };
    },
  });
}
