// Trainingsansicht: Erfassen (laufend) und nachträgliches Bearbeiten
import { openSheet, confirmDialog, toast, icon } from '../core.js';
import { esc, fmtDate, fmtNum, parseNum, numToInput, uid } from '../util.js';
import {
  resolve, planBlocks, itemLabels, lastPerformance, progressionHint, makeSets, setFilled, workoutProgress, typeOf, TYPE_LABEL,
} from '../training/model.js';
import { tstate, saveActive, saveWorkout, saveExercise, exById } from '../training/store.js';

export const kg = (x) => fmtNum(x, Number.isInteger(x) ? 0 : Number.isInteger(Math.round(x * 1000) / 100) ? 1 : 2);

// Kurztext eines Satzes, z. B. "20 kg × 12", "12 Wdh. +5 kg", "45 s"
export function setText(s, type) {
  if (type === 'E') return s.done ? 'erledigt' : '–';
  const extra = Number(s.extra) > 0 ? ` +${kg(Number(s.extra))} kg` : '';
  if (type === 'G') return `${kg(Number(s.weight) || 0)} kg × ${s.reps || 0}`;
  if (type === 'Z') return `${s.secs || 0} s${extra}`;
  return `${s.reps || 0} Wdh.${extra}`;
}
export const scaleText = (s) => (s.form || s.effort ? ` · S${s.form || '–'}/V${s.effort || '–'}` : '');
const sideLabel = (s, i, sets) => {
  const n = s.side ? sets.slice(0, i + 1).filter((x) => x.side === s.side).length : i + 1;
  return `Satz ${n}${s.side ? ' ' + s.side : ''}`;
};

// opts: { mode: 'active' | 'edit', history (ohne dieses Training), onFinish(w), onDiscard(), onDone() }
export function renderWorkout(el, w, opts) {
  const items = Object.fromEntries(w.planSnapshot.items.map((i) => [i.uid, i]));
  const labels = itemLabels(w.planSnapshot.items);
  const history = tstate.history.filter((h) => h.id !== w.id && h.date <= w.date);
  const lastCache = {};
  const lastFor = (key) => (key in lastCache ? lastCache[key] : (lastCache[key] = lastPerformance(history, key)));
  const exByUid = (u) => w.exercises.find((e) => e.uid === u);
  const findSet = (ex, id) => ex.sets.find((s) => s.id === id);

  let saveTimer;
  const persist = (now = false) => {
    clearTimeout(saveTimer);
    const run = () => (opts.mode === 'active' ? saveActive(w) : saveWorkout(w));
    if (now) return run();
    saveTimer = setTimeout(run, 250);
  };

  const progressHtml = () => {
    const p = workoutProgress(w);
    return `${icon('star', 'star-status ' + (p.complete ? 'on' : 'off'))}<span>${p.filled} / ${p.planned} Sätze</span>${p.complete ? '<span class="plan-ok">Plan erfüllt</span>' : ''}`;
  };

  const setHtml = (ex, s, i, item) => {
    const r = resolve(w.catalogSnap, ex.exId, s.variant || ex.variant);
    const def = r.def, type = def.type;
    const last = lastFor(r.key);
    const ls = last && last.sets[i];
    const exVariants = w.catalogSnap[ex.exId].variants;
    const canUse = ls && !setFilled(s, type);
    const chips = [];
    if (exVariants.length > 1) chips.push(`<select class="chip chip-sel" data-act="set-variant" data-ex="${ex.uid}" data-set="${s.id}" aria-label="Variante dieses Satzes">${exVariants.map((v) => `<option value="${v.id}" ${v.id === (s.variant || ex.variant) ? 'selected' : ''}>${esc(v.name)}</option>`).join('')}</select>`);
    if (def.stages && def.stages.length) chips.push(`<select class="chip chip-sel" data-act="set-stage" data-ex="${ex.uid}" data-set="${s.id}" aria-label="Stufe dieses Satzes">${def.stages.map((st, k) => `<option value="${k}" ${k === (s.stage || 0) ? 'selected' : ''}>Stufe ${k + 1}</option>`).join('')}</select>`);
    const head = `<div class="set-head"><b>${sideLabel(s, i, ex.sets)}</b>${chips.join('')}
      <button class="icon-btn" style="margin-left:auto;min-width:40px;min-height:40px" data-act="del-set" data-ex="${ex.uid}" data-set="${s.id}" aria-label="Satz entfernen">${icon('close')}</button></div>
      ${canUse ? `<button class="chip" style="justify-self:start" data-act="use-last" data-ex="${ex.uid}" data-set="${s.id}">Wie letztes Mal: ${esc(setText(ls, last.type))}</button>` : ''}`;
    const inp = (f, label, val, ph, mode) => `<label class="field"><span>${label}</span><input class="input" data-f="${f}" data-ex="${ex.uid}" data-set="${s.id}" inputmode="${mode}" autocomplete="off" value="${val == null || val === '' ? '' : numToInput(Number(val))}" placeholder="${ph == null ? '' : esc(String(ph).replace('.', ','))}"></label>`;
    let inputs = '';
    const extraOpen = s.extraOpen || Number(s.extra) > 0;
    const extraBtn = `<button type="button" class="chip ${extraOpen ? 'red' : ''}" data-act="extra" data-ex="${ex.uid}" data-set="${s.id}">${extraOpen ? '− Zusatzgewicht' : '+ Zusatzgewicht'}</button>`;
    if (type === 'G') inputs = `<div class="set-inputs">${inp('weight', def.perHand ? 'kg pro Hand' : 'kg', s.weight, ls?.weight, 'decimal')}${inp('reps', 'Wdh.', s.reps, ls?.reps, 'numeric')}</div>`;
    else if (type === 'KG') inputs = `<div class="set-inputs">${inp('reps', 'Wdh.', s.reps, ls?.reps, 'numeric')}${extraOpen ? inp('extra', 'Zusatz kg', s.extra, ls?.extra, 'decimal') : `<div style="display:grid;align-items:end">${extraBtn}</div>`}</div>${extraOpen ? `<div>${extraBtn}</div>` : ''}`;
    else if (type === 'Z') inputs = `<div class="set-inputs">${inp('secs', 'Sekunden', s.secs, ls?.secs, 'numeric')}${extraOpen ? inp('extra', def.perHand ? 'kg pro Hand' : 'Zusatz kg', s.extra, ls?.extra, 'decimal') : `<div style="display:grid;align-items:end">${extraBtn}</div>`}</div>${extraOpen ? `<div>${extraBtn}</div>` : ''}`;
    else inputs = `<button type="button" class="done-btn ${s.done ? 'on' : ''}" data-act="done" data-ex="${ex.uid}" data-set="${s.id}">${icon('check')}${s.done ? 'Erledigt' : 'Als erledigt markieren'}</button>`;
    const scale = (k, title, lo, hi, cls) => `<div class="scale"><div class="k">${title}<i>1 = ${lo} · 5 = ${hi}</i></div>
      <div class="scale-row ${cls}">${[1, 2, 3, 4, 5].map((v) => `<button type="button" class="${s[k] === v ? 'on' : ''}" data-act="scale" data-k="${k}" data-v="${v}" data-ex="${ex.uid}" data-set="${s.id}">${v}</button>`).join('')}</div></div>`;
    const scales = type === 'E' ? '' : scale('form', 'Sauberkeit', 'unsauber', 'perfekt', '') + scale('effort', 'Nähe Versagen', 'weit weg', 'erreicht', 'effort');
    return `<div class="set ${setFilled(s, type) ? 'filled' : ''}" data-setrow="${s.id}">${head}${inputs}${scales}</div>`;
  };

  const exHtml = (ex) => {
    const item = items[ex.uid] || { sets: ex.sets.length, reps: '' };
    const cex = w.catalogSnap[ex.exId];
    const r = resolve(w.catalogSnap, ex.exId, ex.variant);
    const last = lastFor(r.key);
    const hint = progressionHint(item, r.def, last);
    const perSide = item.perSide || r.def.perSide;
    const closed = !ex.open && !ex.skipped;
    // Variantenauswahl immer anbieten (auch zum Anlegen eigener Varianten)
    const variantSel = `<select class="input" data-act="variant" data-ex="${ex.uid}" aria-label="Variante">${cex.variants.map((v) => `<option value="${v.id}" ${v.id === ex.variant ? 'selected' : ''}>${esc(v.name)}${v.ref ? '' : ` (${v.type})`}</option>`).join('')}<option value="__new">+ Eigene Variante…</option></select>`;
    const stageSel = r.def.stages && r.def.stages.length
      ? `<select class="input" data-act="stage" data-ex="${ex.uid}" aria-label="Stufe für alle Sätze">${r.def.stages.map((st, k) => `<option value="${k}" ${k === (ex.sets[0]?.stage || 0) ? 'selected' : ''}>Stufe ${k + 1}: ${esc(st)}</option>`).join('')}</select>` : '';
    return `<div class="card tex ${ex.skipped ? 'skipped' : ''} ${closed ? 'closed' : ''}" data-exid="${ex.uid}">
      <div class="tex-head">
        <div class="tex-top"><span class="tex-no">${labels[ex.uid] || '·'}</span><span class="tex-name">${esc(cex.name)}</span>
          ${item.optional ? '<span class="badge">optional</span>' : ''}</div>
        <div class="tex-target">${item.sets} × ${esc(item.reps)}${perSide ? ' · pro Seite' : ''} · ${TYPE_LABEL[r.def.type]}${r.def.perHand && r.def.type === 'G' ? ' (kg pro Hand)' : ''}</div>
        ${item.note ? `<div class="tex-note">${esc(item.note)}</div>` : ''}
        ${last ? `<div class="tex-last">Zuletzt ${fmtDate(last.date)}: ${last.sets.map((s) => esc(setText(s, last.type))).join(' · ')}</div>` : ''}
        ${hint && !ex.skipped ? `<div class="tex-prog">${icon('star', 'star-status on')} ${esc(hint)}</div>` : ''}
      </div>
      ${closed ? `<div class="tex-actions"><button class="add" data-act="open" data-ex="${ex.uid}">${icon('plus')}Optionale Übung öffnen</button></div>` : `
      <div class="tex-body">
        <div class="tex-sel">${variantSel}${stageSel}</div>
        ${ex.sets.map((s, i) => setHtml(ex, s, i, item)).join('')}
      </div>
      <div class="tex-actions">
        ${ex.skipped ? '' : `<button class="add" data-act="add-set" data-ex="${ex.uid}">${icon('plus')}Satz</button>`}
        <button data-act="skip" data-ex="${ex.uid}">${ex.skipped ? 'Wieder aufnehmen' : 'Überspringen'}</button>
      </div>`}
    </div>`;
  };

  const draw = () => {
    const blocks = planBlocks(w.planSnapshot.items.filter((i) => i.kind === 'section' || exByUid(i.uid)));
    el.innerHTML = `
      <div class="card w-head">
        <svg class="watermark" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-gear"/></svg>
        <span class="label red">${opts.mode === 'active' ? 'Laufendes Training' : 'Training bearbeiten'}</span>
        <div class="w-title">${esc(w.planName)}</div>
        <label class="field"><span>Datum</span><input class="input" type="date" data-act="date" value="${w.date}"></label>
        ${w.planSnapshot.note ? `<div class="hint">${esc(w.planSnapshot.note)}</div>` : ''}
        <div class="w-progress" id="w-progress">${progressHtml()}</div>
      </div>
      ${blocks.map((b) => {
        if (b.kind === 'section') return `<div class="section-title"><span class="label">${esc(b.title)}</span></div>`;
        const inner = b.items.map((it) => exHtml(exByUid(it.uid))).join('');
        return b.kind === 'superset' ? `<div class="superset"><span class="label red">Superset ${esc(b.group)}</span>${inner}</div>` : inner;
      }).join('')}
      <div class="card form">
        <label class="field"><span>Notiz zum Training</span><textarea class="input" data-act="note" placeholder="z. B. Energie, Schlaf, Besonderheiten">${esc(w.note || '')}</textarea></label>
      </div>
      <div style="display:grid;gap:10px">
        ${opts.mode === 'active'
          ? `<button class="btn primary block" data-act="finish">${icon('check')}Training abschließen</button>
             <button class="btn danger block" data-act="discard">Training verwerfen</button>`
          : `<button class="btn primary block" data-act="done-edit">${icon('check')}Fertig</button>
             <button class="btn danger block" data-act="delete">Training löschen</button>`}
      </div>`;
  };

  const refreshProgress = (ex, s) => {
    el.querySelector('#w-progress').innerHTML = progressHtml();
    if (ex && s) {
      const row = el.querySelector(`[data-setrow="${s.id}"]`);
      if (row) row.classList.toggle('filled', setFilled(s, typeOf(w, ex, s)));
    }
  };

  // Werte tippen: ohne Neuaufbau (Fokus bleibt)
  el.oninput = (e) => {
    const t = e.target;
    if (t.dataset.f) {
      const ex = exByUid(t.dataset.ex), s = findSet(ex, t.dataset.set);
      const v = parseNum(t.value);
      s[t.dataset.f] = t.value.trim() === '' || !Number.isFinite(v) ? null : t.dataset.f === 'reps' || t.dataset.f === 'secs' ? Math.round(v) : v;
      t.classList.toggle('invalid', t.value.trim() !== '' && (!Number.isFinite(v) || v < 0));
      refreshProgress(ex, s);
      persist();
    } else if (t.dataset.act === 'note') { w.note = t.value; persist(); }
  };

  el.onchange = async (e) => {
    const t = e.target, act = t.dataset.act;
    if (act === 'date') { if (t.value) { w.date = t.value; persist(true); } return; }
    if (!act || !t.dataset.ex) return; // Zahlenfelder: nur oninput, kein Neuaufbau (sonst geht der nächste Tipp verloren)
    const ex = exByUid(t.dataset.ex);
    if (act === 'variant') {
      if (t.value === '__new') return addVariant(ex);
      setVariant(ex, t.value);
    } else if (act === 'set-variant') findSet(ex, t.dataset.set).variant = t.value;
    else if (act === 'stage') ex.sets.forEach((s) => (s.stage = +t.value));
    else if (act === 'set-stage') { findSet(ex, t.dataset.set).stage = +t.value; persist(true); return; }
    persist(true);
    draw();
  };

  function setVariant(ex, variantId) {
    ex.variant = variantId;
    const r = resolve(w.catalogSnap, ex.exId, variantId);
    const last = lastFor(r.key);
    const stage = r.def.stages?.length ? Math.min(last ? Math.max(...last.sets.map((s) => s.stage || 0)) : items[ex.uid]?.stage || 0, r.def.stages.length - 1) : null;
    const item = items[ex.uid] || { sets: ex.sets.length };
    const anyFilled = ex.sets.some((s) => setFilled(s, typeOf(w, ex, s)));
    if (!anyFilled) ex.sets = makeSets(item.sets, item.perSide || r.def.perSide, variantId, stage);
    else ex.sets.forEach((s) => { s.variant = variantId; s.stage = stage; });
  }

  function addVariant(ex) {
    const cex = w.catalogSnap[ex.exId];
    openSheet({
      title: 'Eigene Variante',
      html: `<form class="form" novalidate>
        <p class="small muted" style="margin:0">Für „${esc(cex.name)}“. Die Variante wird dauerhaft im Katalog gespeichert.</p>
        <label class="field"><span>Name</span><input class="input" name="name" maxlength="60" autocomplete="off" placeholder="z. B. Smith-Maschine"></label>
        <div class="seg" id="vt">${['G', 'KG', 'Z', 'E'].map((x) => `<button type="button" data-t="${x}">${TYPE_LABEL[x]}</button>`).join('')}</div>
        <label class="list-row"><span>Kurzhantel (Gewicht pro Hand)</span><input type="checkbox" name="perHand" style="width:24px;height:24px"></label>
        <p class="error" id="verr" hidden></p>
        <div class="sheet-actions"><button class="btn primary block" type="submit">Variante anlegen</button></div></form>`,
      onMount(sh, close) {
        let type = 'G';
        const seg = sh.querySelector('#vt');
        const drawT = () => seg.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.t === type));
        seg.onclick = (ev) => { const b = ev.target.closest('button'); if (b) { type = b.dataset.t; drawT(); } };
        drawT();
        setTimeout(() => sh.querySelector('[name=name]').focus(), 200);
        sh.querySelector('form').onsubmit = async (ev) => {
          ev.preventDefault();
          const name = sh.querySelector('[name=name]').value.trim();
          if (!name) { const er = sh.querySelector('#verr'); er.hidden = false; er.textContent = 'Bitte einen Namen eingeben.'; return; }
          const v = { id: 'u-' + uid(), name, type, ...(sh.querySelector('[name=perHand]').checked ? { perHand: true } : {}), custom: true };
          const cat = exById(ex.exId);
          if (cat) await saveExercise({ ...cat, variants: [...cat.variants, v] });
          cex.variants.push(v);
          setVariant(ex, v.id);
          await persist(true);
          close();
          toast('Variante gespeichert');
          draw();
        };
      },
      onClose: () => draw(),
    });
  }

  el.onclick = async (e) => {
    const b = e.target.closest('[data-act]');
    if (!b || b.tagName === 'SELECT' || b.tagName === 'INPUT' || b.tagName === 'TEXTAREA') return;
    const act = b.dataset.act;
    const ex = b.dataset.ex ? exByUid(b.dataset.ex) : null;
    const s = ex && b.dataset.set ? findSet(ex, b.dataset.set) : null;
    if (act === 'scale') {
      const v = +b.dataset.v;
      s[b.dataset.k] = s[b.dataset.k] === v ? null : v;
      b.parentElement.querySelectorAll('button').forEach((x) => x.classList.toggle('on', +x.dataset.v === s[b.dataset.k]));
      persist();
      return;
    }
    if (act === 'done') s.done = !s.done;
    else if (act === 'extra') { s.extraOpen = !(s.extraOpen || Number(s.extra) > 0); if (!s.extraOpen) s.extra = null; }
    else if (act === 'use-last') {
      const r = resolve(w.catalogSnap, ex.exId, s.variant || ex.variant);
      const ls = lastFor(r.key)?.sets[ex.sets.indexOf(s)];
      if (ls) for (const k of ['weight', 'reps', 'secs', 'extra', 'stage']) if (ls[k] != null) s[k] = ls[k];
    } else if (act === 'add-set') {
      const item = items[ex.uid] || {};
      const lastSet = ex.sets[ex.sets.length - 1];
      const variant = lastSet?.variant || ex.variant;
      const def = resolve(w.catalogSnap, ex.exId, variant).def;
      ex.sets.push(...makeSets(1, item.perSide || def.perSide, variant, lastSet ? lastSet.stage : null));
    } else if (act === 'del-set') {
      if (setFilled(s, typeOf(w, ex, s)) && !(await confirmDialog('Ausgefüllten Satz entfernen?', { ok: 'Entfernen' }))) return;
      ex.sets = ex.sets.filter((x) => x !== s);
    } else if (act === 'skip') ex.skipped = !ex.skipped;
    else if (act === 'open') ex.open = true;
    else if (act === 'finish') {
      await persist(true);
      return opts.onFinish(w);
    } else if (act === 'discard') {
      if (await confirmDialog('Laufendes Training verwerfen? Alle Eingaben gehen verloren.', { ok: 'Verwerfen' })) opts.onDiscard();
      return;
    } else if (act === 'done-edit') { await persist(true); return opts.onDone(); }
    else if (act === 'delete') {
      if (await confirmDialog(`Training „${w.planName}“ vom ${fmtDate(w.date)} löschen?`)) opts.onDelete();
      return;
    } else return;
    persist(true);
    draw();
  };

  flushPending = () => persist(true);
  draw();
}

// Beim Verlassen/Ausblenden der App sofort speichern
let flushPending = null;
document.addEventListener('visibilitychange', () => { if (document.hidden && flushPending) flushPending(); });
