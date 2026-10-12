// Rezeptdatenbank im Reiter Lebensmittel: Rezepte, Einkaufsliste, Rezept-Verlauf
import * as db from '../db.js';
import { state, openSheet, confirmDialog, toast, icon, emptyState } from '../core.js';
import { esc, fmtKcal, fmtDate, relDayLabel, parseNum, numToInput, todayKey, uid, MEALS, WEEKDAYS, weekdayIndex } from '../util.js';
import {
  LEVELS, SLOTS, DIETS, dietLabel, filterRecipes, macrosOf, recipeEntry, shoppingList, shoppingText, recipeHistory,
} from '../recipes/model.js';
import { rstate, loadRecipes, savePrefs, toggleFav, saveShopping } from '../recipes/store.js';

export const FOOD_MODES = [['mine', 'Meine'], ['recipes', 'Rezepte'], ['shop', 'Einkauf'], ['hist', 'Verlauf']];
let q = '';
let setMode = null; // vom Lebensmittel-Reiter gesetzt (Wechsel z. B. zur Einkaufsliste)

const nowSlot = () => { const h = new Date().getHours(); return h < 11 ? 'fruehstueck' : h < 16 ? 'mittag' : 'abend'; };
const macroLine = (m) => `<b>${fmtKcal(m.kcal)} kcal</b> · F ${Math.round(m.fat)} · C ${Math.round(m.carbs)} · P ${Math.round(m.protein)} g`;
const tags = (r) => [dietLabel(r.diet), r.vegan && r.diet !== 'vegan' ? 'vegan' : '', r.vegetarisch && !r.vegan && r.diet !== 'vegetarisch' ? 'vegetarisch' : ''].filter(Boolean);
const timeLine = (r) => `⏱ ${r.minutes} Min.${r.express ? ' <span class="badge red">Express</span>' : ''}`;

export async function renderRecipeMode(el, mode, onModeChange) {
  setMode = onModeChange;
  await loadRecipes();
  if (mode === 'recipes') return renderList(el);
  if (mode === 'shop') return renderShop(el);
  if (mode === 'hist') return renderHistory(el);
}

// ---------- Liste ----------
function renderList(el) {
  const p = rstate.prefs;
  const slot = p.slot || nowSlot();
  el.innerHTML = `
    <div class="seg" id="r-slot">${SLOTS.map((s) => `<button data-slot="${s.id}" class="${s.id === slot ? 'on' : ''}">${s.label.replace('essen', '')}</button>`).join('')}</div>
    <div class="chips" id="r-diet">${DIETS.map((d) => `<button class="chip ${d.id === p.diet ? 'on' : ''}" data-diet="${d.id}">${d.label}</button>`).join('')}</div>
    <div class="chips">
      <button class="chip ${p.express ? 'on' : ''}" id="r-express">Express ≤ 10 Min.</button>
      <button class="chip ${p.onlyFavs ? 'on' : ''}" id="r-favs">★ Favoriten</button>
      <button class="chip" id="r-sort">${p.sort === 'zeit' ? 'Schnellste zuerst' : 'A–Z'}</button>
      <select class="chip chip-sel" id="r-level" aria-label="Kalorienstufe">${LEVELS.map((l) => `<option value="${l}" ${l === p.level ? 'selected' : ''}>Stufe ${l} kcal</option>`).join('')}</select>
    </div>
    <div class="search">${icon('search')}<input class="input" id="r-q" type="search" placeholder="Rezept suchen…" autocomplete="off" value="${esc(q)}"></div>
    <div id="r-list" style="display:grid;gap:10px"></div>`;
  const listEl = el.querySelector('#r-list');
  const draw = () => {
    const items = filterRecipes(rstate.recipes, { slot, diet: p.diet, express: p.express, onlyFavs: p.onlyFavs, favs: rstate.favs, q, sort: p.sort });
    listEl.innerHTML = items.length ? items.map((r) => {
      const m = macrosOf(r, p.level);
      return `<button class="card rcard" data-id="${r.id}">
        <div class="rc-name">${esc(r.name)}${rstate.favs.includes(r.id) ? ` ${icon('star', 'star-status on')}` : ''}</div>
        <div class="rc-macros">${macroLine(m)}</div>
        <div class="rc-meta">${timeLine(r)} ${tags(r).map((t) => `<span class="badge">${esc(t)}</span>`).join(' ')}</div>
      </button>`;
    }).join('') : `<div class="empty compact">${icon('wheat')}<span>Keine Rezepte für diese Filter.</span></div>`;
  };
  draw();
  const save = () => { savePrefs(); renderList(el); };
  el.querySelectorAll('[data-slot]').forEach((b) => (b.onclick = () => { p.slot = b.dataset.slot; save(); }));
  el.querySelectorAll('[data-diet]').forEach((b) => (b.onclick = () => { p.diet = b.dataset.diet; save(); }));
  el.querySelector('#r-express').onclick = () => { p.express = !p.express; save(); };
  el.querySelector('#r-favs').onclick = () => { p.onlyFavs = !p.onlyFavs; save(); };
  el.querySelector('#r-sort').onclick = () => { p.sort = p.sort === 'zeit' ? 'az' : 'zeit'; save(); };
  el.querySelector('#r-level').onchange = (e) => { p.level = e.target.value; save(); };
  el.querySelector('#r-q').oninput = (e) => { q = e.target.value; draw(); };
  listEl.onclick = (e) => { const b = e.target.closest('.rcard'); if (b) openRecipe(rstate.byId[b.dataset.id], { onChange: () => draw() }); };
}

// ---------- Detail ----------
export function openRecipe(r, { level = rstate.prefs.level, onChange } = {}) {
  let lv = level;
  let stepsOpen = false;
  openSheet({
    title: dietLabel(r.diet) + ' · ' + SLOTS.find((s) => s.id === r.slot).label,
    html: '<div id="rd"></div>',
    onMount(sheet, close) {
      const box = sheet.querySelector('#rd');
      const draw = () => {
        const L = r.levels[lv];
        const m = L.macros;
        const fav = rstate.favs.includes(r.id);
        box.innerHTML = `<div class="form" style="gap:12px">
          <div><div class="rc-name" style="font-size:21px">${esc(r.name)}</div>
            <div class="rc-meta" style="margin-top:4px">${timeLine(r)} ${tags(r).map((t) => `<span class="badge">${esc(t)}</span>`).join(' ')}</div></div>
          ${r.description ? `<p class="muted" style="margin:0">${esc(r.description)}</p>` : ''}
          <div><div class="label" style="margin-bottom:6px">Kalorienstufe</div>
            <div class="seg" id="rd-level">${LEVELS.map((l) => `<button data-l="${l}" class="${l === lv ? 'on' : ''}">${l}</button>`).join('')}</div></div>
          <div class="preview">${[['kcal', 'kcal'], ['fat', 'Fett g'], ['carbs', 'Carbs g'], ['protein', 'Protein g']].map(([k, lab]) => `<div><b>${k === 'kcal' ? fmtKcal(m[k]) : Math.round(m[k])}</b><span>${lab}</span></div>`).join('')}</div>
          <div class="card" style="padding:4px 14px">${L.ingredients.map((i) => `<div class="list-row" style="min-height:40px;border-bottom:1px solid var(--line)"><span>${esc(i.name)}</span><b>${esc(i.display)}</b></div>`).join('')}
            ${r.spices ? `<div class="list-row small" style="min-height:40px"><span class="muted">Gewürze, nach Geschmack</span><span>${esc(r.spices)}</span></div>` : ''}</div>
          ${r.note ? `<div class="hint">${esc(r.note)}</div>` : ''}
          <button class="btn block" id="rd-steps">${stepsOpen ? 'Zubereitung ausblenden' : 'Zubereitung anzeigen'}</button>
          ${stepsOpen ? `<ol class="steps">${r.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>` : ''}
          <div class="btn-row"><button class="btn ${fav ? 'gold' : ''}" id="rd-fav">${icon('star')}${fav ? 'Favorit' : 'Merken'}</button>
            <button class="btn" id="rd-shop">${icon('plus')}Einkaufsliste</button></div>
          <div class="sheet-actions"><button class="btn primary block" id="rd-book">${icon('check')}In Heute eintragen</button></div>
          <p class="small muted" style="margin:0">Nährwerte sind Durchschnittswerte und können je nach Produkt abweichen.</p>
        </div>`;
        box.querySelectorAll('#rd-level button').forEach((b) => (b.onclick = () => { lv = b.dataset.l; draw(); }));
        box.querySelector('#rd-steps').onclick = () => { stepsOpen = !stepsOpen; draw(); };
        box.querySelector('#rd-fav').onclick = async () => { const on = await toggleFav(r.id); toast(on ? 'Als Favorit gemerkt' : 'Favorit entfernt'); draw(); if (onChange) onChange(); };
        box.querySelector('#rd-shop').onclick = async () => {
          rstate.plan.push({ id: uid(), recipeId: r.id, level: lv, portions: 1 });
          await saveShopping();
          toast('Zur Einkaufsliste hinzugefügt', { label: 'Ansehen', fn: () => { close(); if (setMode) setMode('shop'); } });
        };
        box.querySelector('#rd-book').onclick = () => openBook(r, lv);
      };
      draw();
    },
  });
}

// ---------- In Heute eintragen ----------
function openBook(r, level) {
  const meal0 = SLOTS.find((s) => s.id === r.slot).meal;
  openSheet({
    title: 'In Heute eintragen',
    html: `<form class="form" novalidate>
      <div><b>${esc(r.name)}</b><div class="small muted">Stufe ${level} · ${macroLine(macrosOf(r, level))}</div></div>
      <label class="field"><span>Datum</span><input class="input" type="date" name="date" value="${state.date || todayKey()}"></label>
      <div class="seg" id="bk-meal">${MEALS.map((m) => `<button type="button" data-m="${m.id}" class="${m.id === meal0 ? 'on' : ''}">${m.label.replace('Mittagessen', 'Mittag').replace('Abendessen', 'Abend')}</button>`).join('')}</div>
      <label class="field"><span>Portionen</span><div class="input-wrap"><input class="input" name="count" inputmode="decimal" value="1" autocomplete="off"><span class="suffix">×</span></div></label>
      <p class="error" id="bk-err" hidden></p>
      <div class="sheet-actions"><button class="btn primary block" type="submit">${icon('check')}Eintragen</button></div></form>`,
    onMount(el, close) {
      let meal = meal0;
      el.querySelector('#bk-meal').onclick = (e) => { const b = e.target.closest('button'); if (!b) return; meal = b.dataset.m; el.querySelectorAll('#bk-meal button').forEach((x) => x.classList.toggle('on', x === b)); };
      el.querySelector('form').onsubmit = async (e) => {
        e.preventDefault();
        const f = e.target;
        const count = parseNum(f.elements.count.value);
        const date = f.elements.date.value;
        if (!(count > 0 && count <= 20) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) { const er = el.querySelector('#bk-err'); er.hidden = false; er.textContent = 'Bitte Datum und eine Portionenzahl größer 0 angeben.'; return; }
        await db.put('entries', recipeEntry(r, level, { date, meal, count }));
        close();
        toast(`Eingetragen: ${r.name} (${relDayLabel(date)})`);
      };
    },
  });
}

// ---------- Einkaufsliste ----------
function renderShop(el) {
  const plan = rstate.plan.filter((p) => rstate.byId[p.recipeId]);
  const list = shoppingList(plan, rstate.byId, rstate.ingredients);
  const checked = rstate.checked;
  const open = list.items.filter((i) => !checked[i.key]);
  const done = list.items.filter((i) => checked[i.key]);
  const row = (i) => `<button class="shop-item ${checked[i.key] ? 'done' : ''}" data-key="${esc(i.key)}">
      <span class="box">${checked[i.key] ? icon('check') : ''}</span><span class="nm">${esc(i.name)}</span><b>${esc(i.display)}</b></button>`;
  el.innerHTML = `
    <div class="section-title"><span class="label">Geplante Rezepte</span><span class="small muted">${plan.length}</span></div>
    <div class="card" style="padding:0">${plan.length ? plan.map((p) => {
      const r = rstate.byId[p.recipeId];
      return `<div class="plan-row" data-id="${p.id}">
        <button class="pr-main" data-open="${p.id}"><div class="nm">${esc(r.name)}</div><div class="sub">${SLOTS.find((s) => s.id === r.slot).label} · Stufe ${p.level}</div></button>
        <div class="pr-count"><button class="icon-btn" data-dec="${p.id}" aria-label="weniger">−</button><b>${numToInput(p.portions)}</b><button class="icon-btn" data-inc="${p.id}" aria-label="mehr">+</button></div>
        <button class="icon-btn" data-del="${p.id}" aria-label="entfernen">${icon('close')}</button></div>`;
    }).join('') : `<div class="empty compact">${icon('wheat')}<span>Noch keine Rezepte geplant. Wähle aus, was du in den nächsten Tagen essen willst.</span></div>`}</div>
    <button class="btn primary block" id="sh-add">${icon('plus')}Rezept hinzufügen</button>
    ${plan.length ? `
      <div class="section-title"><span class="label">Einkaufsliste</span><span class="small muted">${open.length} offen</span></div>
      <div class="card" style="padding:0">${open.map(row).join('')}${done.map(row).join('')}</div>
      ${list.spices.length ? `<div class="hint">Gewürze, nach Geschmack: ${esc(list.spices.join(', '))}</div>` : ''}
      <div class="btn-row"><button class="btn" id="sh-share">Teilen / Kopieren</button><button class="btn" id="sh-uncheck" ${done.length ? '' : 'disabled'}>Haken zurücksetzen</button></div>
      <button class="btn danger block" id="sh-clear">Liste leeren</button>` : ''}`;
  const redraw = async () => { await saveShopping(); renderShop(el); };
  el.onclick = async (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const find = (id) => rstate.plan.find((p) => p.id === id);
    if (b.dataset.key) { rstate.checked[b.dataset.key] = !rstate.checked[b.dataset.key]; return redraw(); }
    if (b.dataset.inc) { find(b.dataset.inc).portions += 1; return redraw(); }
    if (b.dataset.dec) { const p = find(b.dataset.dec); if (p.portions > 1) { p.portions -= 1; return redraw(); } return; }
    if (b.dataset.del) { rstate.plan = rstate.plan.filter((p) => p.id !== b.dataset.del); return redraw(); }
    if (b.dataset.open) { const p = find(b.dataset.open); return openRecipe(rstate.byId[p.recipeId], { level: p.level }); }
    if (b.id === 'sh-add') return pickRecipe(async (r) => { rstate.plan.push({ id: uid(), recipeId: r.id, level: rstate.prefs.level, portions: 1 }); await redraw(); toast('Hinzugefügt'); });
    if (b.id === 'sh-uncheck') { rstate.checked = {}; return redraw(); }
    if (b.id === 'sh-clear') {
      if (!(await confirmDialog('Geplante Rezepte und Einkaufsliste leeren?', { ok: 'Leeren' }))) return;
      rstate.plan = []; rstate.checked = {};
      return redraw();
    }
    if (b.id === 'sh-share') {
      const text = 'Einkaufsliste\n' + shoppingText(list, rstate.checked);
      try {
        if (navigator.share) await navigator.share({ title: 'Einkaufsliste', text });
        else { await navigator.clipboard.writeText(text); toast('In die Zwischenablage kopiert'); }
      } catch (err) { if (err && err.name !== 'AbortError') { try { await navigator.clipboard.writeText(text); toast('In die Zwischenablage kopiert'); } catch { toast('Teilen nicht möglich'); } } }
    }
  };
}

// Rezept für die Einkaufsliste auswählen
function pickRecipe(onPick) {
  let slot = rstate.prefs.slot || nowSlot();
  let pq = '';
  openSheet({
    title: 'Rezept planen',
    html: `<div class="form" style="gap:10px">
      <div class="seg" id="pk-slot">${SLOTS.map((s) => `<button data-slot="${s.id}">${s.label.replace('essen', '')}</button>`).join('')}</div>
      <div class="search">${icon('search')}<input class="input" id="pk-q" type="search" placeholder="Rezept suchen…" autocomplete="off"></div>
      <div class="pick-list" id="pk-list" style="max-height:52vh"></div>
      <p class="small muted" style="margin:0">Stufe ${rstate.prefs.level} kcal (änderbar über das Rezept)</p></div>`,
    onMount(el, close) {
      const draw = () => {
        el.querySelectorAll('#pk-slot button').forEach((b) => b.classList.toggle('on', b.dataset.slot === slot));
        const items = filterRecipes(rstate.recipes, { slot: pq ? null : slot, diet: rstate.prefs.diet, q: pq, favs: rstate.favs });
        el.querySelector('#pk-list').innerHTML = items.map((r) => `<button class="pick" data-id="${r.id}"><span>${esc(r.name)}${rstate.favs.includes(r.id) ? ' ★' : ''}</span><span class="kc">${dietLabel(r.diet)}</span></button>`).join('')
          || '<div class="empty compact"><span>Kein Treffer.</span></div>';
      };
      draw();
      el.querySelector('#pk-slot').onclick = (e) => { const b = e.target.closest('button'); if (b) { slot = b.dataset.slot; draw(); } };
      el.querySelector('#pk-q').oninput = (e) => { pq = e.target.value; draw(); };
      el.querySelector('#pk-list').onclick = (e) => { const b = e.target.closest('.pick'); if (b) { close(); onPick(rstate.byId[b.dataset.id]); } };
    },
  });
}

// ---------- Rezept-Verlauf ----------
async function renderHistory(el) {
  const days = recipeHistory(await db.getAll('entries')).slice(0, 60);
  if (!days.length) { el.innerHTML = emptyState('Noch keine Rezepte gegessen', 'Trage ein Rezept über „In Heute eintragen“ ein – es erscheint dann hier.'); return; }
  el.innerHTML = days.map((d) => `<div class="card" style="padding:0">
      <div class="meal-head"><span class="label">${WEEKDAYS[weekdayIndex(d.date)]}, ${fmtDate(d.date)}</span><div class="meal-sum"><b>${fmtKcal(d.kcal)}</b> kcal</div></div>
      ${d.items.map((i) => `<button class="entry" data-rid="${esc(i.recipeId)}" data-level="${esc(i.level || '')}">
        <div class="main"><div class="nm">${esc(i.name)}</div><div class="sub">${MEALS.find((m) => m.id === i.meal)?.label || ''} · Stufe ${esc(i.level || '–')}${i.count !== 1 ? ` · ${numToInput(i.count)} Portionen` : ''}</div></div>
        <div class="kc">${fmtKcal(i.kcal)} kcal</div></button>`).join('')}</div>`).join('');
  el.onclick = (e) => {
    const b = e.target.closest('[data-rid]');
    const r = b && rstate.byId[b.dataset.rid];
    if (r) openRecipe(r, { level: b.dataset.level || rstate.prefs.level });
  };
}
