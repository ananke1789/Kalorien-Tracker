// Pläne bearbeiten und Übungskatalog pflegen
import { openSheet, confirmDialog, toast, icon, render } from '../core.js';
import { esc, norm, parseNum, numToInput, uid } from '../util.js';
import { itemLabels, resolve, clone, TYPE_LABEL } from '../training/model.js';
import { GROUPS } from '../training/catalog.js';
import { DEFAULT_PLANS } from '../training/plans.js';
import { tstate, planById, exById, savePlan, saveExercise, resetPlan } from '../training/store.js';
import { tview, registerTrainingSub } from './training.js';

const open = new Set(); // aufgeklappte Positionen im Editor
const LETTERS = ['', ...'ABCDEFGH'];

// ---------- Übung aus Katalog wählen ----------
export function pickExercise(onPick, { title = 'Übung hinzufügen', onNew = null } = {}) {
  let q = '';
  openSheet({
    title,
    html: `<div class="form" style="gap:10px">
      <div class="search">${icon('search')}<input class="input" id="pe-q" type="search" placeholder="Übung suchen…" autocomplete="off"></div>
      <div class="pick-list" id="pe-list" style="max-height:58vh"></div></div>`,
    onMount(el, close) {
      const draw = () => {
        let html = `<button class="pick" data-new style="color:var(--red);font-weight:700">${icon('plus', 'star-status')}${q ? `„${esc(q)}“ als neue Übung` : 'Neue Übung anlegen'}</button>`;
        for (const g of GROUPS) {
          const exs = tstate.catalog.filter((x) => (x.group || 'Eigene') === g && (!q || norm(x.name + ' ' + x.variants.map((v) => v.name).join(' ')).includes(norm(q))))
            .sort((a, b) => a.name.localeCompare(b.name, 'de'));
          if (exs.length) html += `<div class="pick-head">${esc(g)}</div>` + exs.map((x) => `<button class="pick" data-id="${x.id}"><span>${esc(x.name)}</span><span class="kc">${x.variants.length > 1 ? x.variants.length + ' Varianten' : TYPE_LABEL[x.variants[0].type] || ''}</span></button>`).join('');
        }
        el.querySelector('#pe-list').innerHTML = html;
      };
      draw();
      el.querySelector('#pe-q').oninput = (e) => { q = e.target.value; draw(); };
      setTimeout(() => el.querySelector('#pe-q').focus(), 200);
      el.querySelector('#pe-list').onclick = (e) => {
        const b = e.target.closest('.pick');
        if (!b) return;
        if (b.hasAttribute('data-new')) return openExerciseForm(null, onNew === null ? onPick : onNew || null, q.trim());
        close();
        onPick(b.dataset.id);
      };
    },
  });
}

// ---------- Katalog-Übung bearbeiten / anlegen ----------
const variantRow = (v, i) => v.ref
  ? `<div class="card" data-vi="${i}" style="padding:10px;display:flex;align-items:center;gap:8px"><span style="flex:1"><b>${esc(v.name)}</b><br><span class="small muted">verweist auf die Übung „${esc(exById(v.ref)?.name || v.ref)}“</span></span>
      <button type="button" class="icon-btn" data-delv="${i}" aria-label="Variante entfernen">${icon('close')}</button></div>`
  : `<div class="card form" data-vi="${i}" style="padding:10px;gap:8px">
      <div style="display:flex;gap:8px;align-items:center"><input class="input" data-vf="name" value="${esc(v.name)}" placeholder="Name der Variante" style="flex:1">
        <button type="button" class="icon-btn" data-delv="${i}" aria-label="Variante entfernen">${icon('close')}</button></div>
      <select class="input" data-vf="type">${['G', 'KG', 'Z', 'E'].map((t) => `<option value="${t}" ${v.type === t ? 'selected' : ''}>${t} · ${TYPE_LABEL[t]}</option>`).join('')}</select>
      <div class="grid2">
        <label class="list-row small"><span>Kurzhantel (pro Hand)</span><input type="checkbox" data-vf="perHand" ${v.perHand ? 'checked' : ''} style="width:22px;height:22px"></label>
        <label class="list-row small"><span>pro Seite</span><input type="checkbox" data-vf="perSide" ${v.perSide ? 'checked' : ''} style="width:22px;height:22px"></label>
      </div>
      <label class="field"><span>Stufen (eine pro Zeile, optional)</span><textarea class="input" data-vf="stages" style="min-height:70px">${esc((v.stages || []).join('\n'))}</textarea></label>
      <label class="field"><span>Nächste Stufe ab (Wdh. bzw. Sekunden, optional)</span><input class="input" data-vf="nextAt" inputmode="numeric" value="${v.nextAt ?? ''}"></label>
    </div>`;

export function openExerciseForm(exId, onSaved, presetName = '') {
  const orig = exId ? exById(exId) : null;
  const ex = orig ? clone(orig) : { id: 'u-' + uid(), name: presetName, group: 'Eigene', variants: [{ id: 'std', name: presetName || 'Standard', type: 'G' }], custom: true };
  const readVariants = (el) => {
    el.querySelectorAll('[data-vi]').forEach((row) => {
      const v = ex.variants[+row.dataset.vi];
      if (v.ref) return;
      const f = (k) => row.querySelector(`[data-vf="${k}"]`);
      v.name = f('name').value.trim();
      v.type = f('type').value;
      v.perHand = f('perHand').checked || undefined;
      v.perSide = f('perSide').checked || undefined;
      const stages = f('stages').value.split('\n').map((x) => x.trim()).filter(Boolean);
      if (stages.length) v.stages = stages; else delete v.stages;
      const n = parseNum(f('nextAt').value);
      if (Number.isFinite(n) && n > 0) v.nextAt = Math.round(n); else delete v.nextAt;
    });
  };
  openSheet({
    title: orig ? 'Übung bearbeiten' : 'Neue Übung',
    html: `<form class="form" novalidate>
      <label class="field"><span>Name</span><input class="input" name="name" value="${esc(ex.name)}" maxlength="80" autocomplete="off"></label>
      <label class="field"><span>Gruppe</span><select class="input" name="group">${GROUPS.map((g) => `<option ${g === ex.group ? 'selected' : ''}>${esc(g)}</option>`).join('')}</select></label>
      <div class="label">Varianten</div>
      <div id="ef-vars" class="form" style="gap:8px"></div>
      <button type="button" class="btn gold" id="ef-addv">${icon('plus')}Variante hinzufügen</button>
      <p class="small muted" style="margin:0">Änderungen gelten für künftige Trainings. Abgeschlossene Trainings behalten ihren Stand.</p>
      <p class="error" id="ef-err" hidden></p>
      <div class="sheet-actions"><button class="btn primary block" type="submit">Speichern</button></div></form>`,
    onMount(el, close) {
      const vars = el.querySelector('#ef-vars');
      const draw = () => { vars.innerHTML = ex.variants.map(variantRow).join(''); };
      draw();
      el.querySelector('#ef-addv').onclick = () => { readVariants(el); ex.variants.push({ id: 'u-' + uid(), name: '', type: 'G' }); draw(); vars.lastElementChild.querySelector('input').focus(); };
      vars.onclick = (e) => {
        const b = e.target.closest('[data-delv]');
        if (!b) return;
        readVariants(el);
        if (ex.variants.length <= 1) return toast('Mindestens eine Variante ist nötig.');
        ex.variants.splice(+b.dataset.delv, 1);
        draw();
      };
      el.querySelector('form').onsubmit = async (e) => {
        e.preventDefault();
        readVariants(el);
        ex.name = el.querySelector('[name=name]').value.trim();
        ex.group = el.querySelector('[name=group]').value;
        const err = el.querySelector('#ef-err');
        const bad = !ex.name ? 'Bitte einen Namen eingeben.' : ex.variants.some((v) => !v.ref && !v.name) ? 'Jede Variante braucht einen Namen.' : '';
        if (bad) { err.hidden = false; err.textContent = bad; return; }
        if (ex.variants.length === 1 && !ex.variants[0].ref && !orig) ex.variants[0].name = ex.name;
        await saveExercise(ex);
        close();
        toast('Übung gespeichert');
        if (onSaved) onSaved(ex.id); else render();
      };
    },
  });
}

// ---------- Plan-Editor ----------
function itemHtml(plan, it, i, labels) {
  const n = plan.items.length;
  const moves = `<button class="icon-btn" data-mv="-1" data-i="${i}" ${i === 0 ? 'disabled' : ''} aria-label="nach oben">${icon('up')}</button>
    <button class="icon-btn" data-mv="1" data-i="${i}" ${i === n - 1 ? 'disabled' : ''} aria-label="nach unten">${icon('down')}</button>`;
  if (it.kind === 'section') {
    return `<div class="card" style="padding:6px 6px 6px 14px;display:flex;align-items:center;gap:4px;border-left:3px solid var(--red)">
      <input class="input" data-pf="title" data-i="${i}" value="${esc(it.title)}" placeholder="Abschnittsüberschrift" style="flex:1;font-weight:700">
      ${moves}<button class="icon-btn" data-del="${i}" aria-label="Abschnitt entfernen">${icon('close')}</button></div>`;
  }
  const ex = exById(it.exId);
  const r = ex ? resolve(tstate.catalog, it.exId, it.variant) : null;
  const isOpen = open.has(it.uid);
  const summary = `${it.sets} × ${esc(it.reps)}${it.perSide ? ' · pro Seite' : ''}${it.optional ? ' · optional' : ''}${it.variant && r && r.variant.name !== ex.name ? ' · ' + esc(r.variant.name) : ''}`;
  return `<div class="card tex" data-item="${i}">
    <div class="tex-head" style="padding-bottom:4px">
      <div class="tex-top"><span class="tex-no">${labels[it.uid] || '·'}</span><span class="tex-name">${esc(ex?.name || it.exId)}</span>
        <button class="chip" data-tg="${i}">${isOpen ? 'Fertig' : 'Bearbeiten'}</button></div>
      <div class="tex-target">${summary}</div>
      ${it.note ? `<div class="tex-note">${esc(it.note)}</div>` : ''}
    </div>
    ${isOpen ? `<div class="form" style="padding:6px 14px 12px;gap:10px">
      <div class="grid2">
        <label class="field"><span>Sätze</span><input class="input" data-pf="sets" data-i="${i}" inputmode="numeric" value="${it.sets}"></label>
        <label class="field"><span>Wdh.-Bereich</span><input class="input" data-pf="reps" data-i="${i}" value="${esc(it.reps)}" placeholder="8-12 oder 30-60 s"></label>
      </div>
      <div class="grid2">
        <label class="field"><span>Superset-Gruppe</span><select class="input" data-pf="group" data-i="${i}">${LETTERS.map((l) => `<option value="${l}" ${l === (it.group || '') ? 'selected' : ''}>${l || '– keine –'}</option>`).join('')}</select></label>
        <label class="field"><span>Variante vorauswählen</span><select class="input" data-pf="variant" data-i="${i}"><option value="">zuletzt genutzte</option>${(ex?.variants || []).map((v) => `<option value="${v.id}" ${v.id === it.variant ? 'selected' : ''}>${esc(v.name)}</option>`).join('')}</select></label>
      </div>
      ${r && r.def.stages?.length ? `<label class="field"><span>Start-Stufe (wenn noch kein Verlauf)</span><select class="input" data-pf="stage" data-i="${i}">${r.def.stages.map((s, k) => `<option value="${k}" ${k === (it.stage || 0) ? 'selected' : ''}>Stufe ${k + 1}: ${esc(s)}</option>`).join('')}</select></label>` : ''}
      <label class="field"><span>Hinweis</span><input class="input" data-pf="note" data-i="${i}" value="${esc(it.note || '')}" placeholder="z. B. Priorität"></label>
      <div class="grid2">
        <label class="list-row small"><span>optional</span><input type="checkbox" data-pf="optional" data-i="${i}" ${it.optional ? 'checked' : ''} style="width:22px;height:22px"></label>
        <label class="list-row small"><span>pro Seite</span><input type="checkbox" data-pf="perSide" data-i="${i}" ${it.perSide ? 'checked' : ''} style="width:22px;height:22px"></label>
      </div>
      <button class="btn gold" data-exedit="${esc(it.exId)}">Übung im Katalog bearbeiten</button>
    </div>` : ''}
    <div class="tex-actions">${moves.replace(/class="icon-btn"/g, 'class=""')}<button data-del="${i}">Entfernen</button></div>
  </div>`;
}

function renderEditor(el, plan) {
  const labels = itemLabels(plan.items);
  let timer;
  const save = (now) => { clearTimeout(timer); const run = () => savePlan(plan); if (now) return run(); timer = setTimeout(run, 300); };
  el.innerHTML = `
    <button class="btn ghost" id="pe-back" style="justify-self:start;min-height:40px">${icon('left')}Alle Pläne</button>
    <div class="card form">
      <svg class="watermark" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-gear"/></svg>
      <label class="field"><span>Planname</span><input class="input" data-meta="name" value="${esc(plan.name)}"></label>
      <label class="field"><span>Info (Ort, Dauer)</span><input class="input" data-meta="info" value="${esc(plan.info || '')}"></label>
      <label class="field"><span>Hinweis oben</span><input class="input" data-meta="note" value="${esc(plan.note || '')}"></label>
    </div>
    ${plan.items.map((it, i) => itemHtml(plan, it, i, labels)).join('')}
    <div class="btn-row"><button class="btn primary" id="pe-addex">${icon('plus')}Übung</button><button class="btn" id="pe-addsec">${icon('plus')}Abschnitt</button></div>
    ${DEFAULT_PLANS.some((d) => d.id === plan.id) ? `<button class="btn danger block" id="pe-reset">Plan auf Standard zurücksetzen</button>` : ''}
    <p class="small muted" style="text-align:center;margin:0">Änderungen werden automatisch gespeichert und gelten für neue Trainings.</p>`;
  const redraw = () => renderEditor(el, plan);
  el.querySelector('#pe-back').onclick = () => { tview.planEdit = null; render(); };
  el.oninput = (e) => {
    const t = e.target;
    if (t.dataset.meta) { plan[t.dataset.meta] = t.value; return save(); }
    if (t.dataset.pf == null) return;
    const it = plan.items[+t.dataset.i];
    const f = t.dataset.pf;
    if (f === 'title' || f === 'note' || f === 'reps') it[f] = t.value;
    else if (f === 'sets') { const n = parseNum(t.value); t.classList.toggle('invalid', !(n >= 1 && n <= 20)); if (n >= 1 && n <= 20) it.sets = Math.round(n); }
    else return;
    save();
  };
  el.onchange = (e) => {
    const t = e.target;
    if (t.dataset.pf == null || ['title', 'note', 'reps', 'sets'].includes(t.dataset.pf)) return;
    const it = plan.items[+t.dataset.i];
    const f = t.dataset.pf;
    if (f === 'optional' || f === 'perSide') it[f] = t.checked;
    else if (f === 'group') it.group = t.value;
    else if (f === 'variant') { if (t.value) it.variant = t.value; else delete it.variant; delete it.stage; }
    else if (f === 'stage') it.stage = +t.value;
    save(true);
    redraw();
  };
  el.onclick = async (e) => {
    const b = e.target.closest('button');
    if (!b || b.disabled) return;
    if (b.dataset.tg != null) { const u = plan.items[+b.dataset.tg].uid; open.has(u) ? open.delete(u) : open.add(u); return redraw(); }
    if (b.dataset.mv) {
      const i = +b.dataset.i, j = i + +b.dataset.mv;
      if (j < 0 || j >= plan.items.length) return;
      [plan.items[i], plan.items[j]] = [plan.items[j], plan.items[i]];
      await save(true); return redraw();
    }
    if (b.dataset.del != null) {
      const it = plan.items[+b.dataset.del];
      const name = it.kind === 'section' ? `Abschnitt „${it.title}“` : `„${exById(it.exId)?.name || it.exId}“`;
      if (!(await confirmDialog(`${name} aus dem Plan entfernen?`, { ok: 'Entfernen' }))) return;
      plan.items.splice(+b.dataset.del, 1);
      await save(true); return redraw();
    }
    if (b.dataset.exedit) return openExerciseForm(b.dataset.exedit, () => redraw());
    if (b.id === 'pe-addex') return pickExercise(async (exId) => {
      const it = { kind: 'ex', uid: `${plan.id}-${uid()}`, exId, sets: 2, reps: '8-12', group: '', note: '', optional: false, perSide: false };
      plan.items.push(it);
      open.add(it.uid);
      await save(true);
      redraw();
      window.scrollTo(0, document.body.scrollHeight);
    });
    if (b.id === 'pe-addsec') {
      plan.items.push({ kind: 'section', uid: `${plan.id}-${uid()}`, title: 'Neuer Abschnitt' });
      await save(true); redraw();
      const inputs = el.querySelectorAll('[data-pf="title"]');
      inputs[inputs.length - 1].select();
      return;
    }
    if (b.id === 'pe-reset') {
      if (!(await confirmDialog(`„${plan.name}“ auf den Standard zurücksetzen? Deine Änderungen an diesem Plan gehen verloren. Abgeschlossene Trainings bleiben unverändert.`, { ok: 'Zurücksetzen' }))) return;
      await resetPlan(plan.id);
      toast('Plan zurückgesetzt');
      return render();
    }
  };
}

function renderPlans(el) {
  if (tview.planEdit) {
    const plan = planById(tview.planEdit);
    if (plan) return renderEditor(el, clone(plan));
    tview.planEdit = null;
  }
  const row = (p) => `<button class="hist" data-plan="${p.id}"><div><div class="nm">${esc(p.name)}</div><div class="sub">${esc(p.info || '')} · ${p.items.filter((i) => i.kind === 'ex').length} Übungen</div></div><div class="kc">${icon('right', 'star-status')}</div></button>`;
  el.innerHTML = `
    <div class="section-title"><span class="label">Hauptpläne</span></div>
    <div class="card" style="padding:0">${tstate.plans.filter((p) => p.kind === 'main').map(row).join('')}</div>
    <div class="section-title"><span class="label">Sondertrainings</span></div>
    <div class="card" style="padding:0">${tstate.plans.filter((p) => p.kind === 'special').map(row).join('')}</div>
    <div class="section-title"><span class="label">Übungskatalog</span><span class="small muted">${tstate.catalog.length} Übungen</span></div>
    <button class="btn block" id="cat-open">${icon('list')}Katalog durchsuchen und bearbeiten</button>`;
  el.querySelectorAll('[data-plan]').forEach((b) => (b.onclick = () => { tview.planEdit = b.dataset.plan; render(); window.scrollTo(0, 0); }));
  el.querySelector('#cat-open').onclick = () => pickCatalog();
}

// Katalog: Übung wählen -> bearbeiten
function pickCatalog() {
  pickExercise((exId) => openExerciseForm(exId), { title: 'Übungskatalog', onNew: false });
}

registerTrainingSub('plans', renderPlans);
