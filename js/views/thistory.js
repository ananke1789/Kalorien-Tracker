// Trainingsverlauf: Liste, Details, Bearbeiten, Löschen
import { openSheet, confirmDialog, toast, icon, render, emptyState } from '../core.js';
import { esc, fmtDate, WEEKDAYS, weekdayIndex } from '../util.js';
import { resolve, setFilled, countSets, workoutProgress, itemLabels, clone } from '../training/model.js';
import { tstate, deleteWorkout } from '../training/store.js';
import { renderWorkout, setText, scaleText } from './workout.js';
import { tview, registerTrainingSub } from './training.js';

// Detail-HTML eines Trainings; onlyKey: nur Sätze dieses Statistik-Schlüssels
export function workoutDetailHtml(w, onlyKey = null) {
  const labels = itemLabels(w.planSnapshot.items);
  const parts = [];
  for (const ex of w.exercises) {
    const cex = w.catalogSnap[ex.exId];
    if (!cex) continue;
    const rows = [];
    ex.sets.forEach((s, i) => {
      const r = resolve(w.catalogSnap, ex.exId, s.variant || ex.variant);
      if (!setFilled(s, r.def.type) || (onlyKey && r.key !== onlyKey)) return;
      const n = s.side ? `${ex.sets.slice(0, i + 1).filter((x) => x.side === s.side).length} ${s.side}` : i + 1;
      const stage = r.def.stages && s.stage != null ? ` · Stufe ${s.stage + 1}` : '';
      const variant = cex.variants.length > 1 ? ` · ${(cex.variants.find((v) => v.id === (s.variant || ex.variant)) || {}).name || ''}` : '';
      rows.push(`<div class="dset"><span>Satz ${n}</span><span>${esc(setText(s, r.def.type))}${esc(scaleText(s))}<span class="muted small">${esc(variant + stage)}</span></span></div>`);
    });
    if (ex.skipped && !onlyKey) parts.push(`<div class="list-row"><span><b>${labels[ex.uid] || ''} ${esc(cex.name)}</b></span><span class="muted small">übersprungen</span></div>`);
    else if (rows.length) {
      const stages = [...new Set(ex.sets.filter((s) => s.stage != null).map((s) => s.stage))];
      const def = resolve(w.catalogSnap, ex.exId, ex.variant).def;
      const stageLine = def.stages && stages.length ? `<div class="small muted">${stages.map((k) => `Stufe ${k + 1}: ${esc(def.stages[k] || '')}`).join(' · ')}</div>` : '';
      parts.push(`<div style="padding:6px 0;border-top:1px solid var(--line)"><b>${labels[ex.uid] || ''} ${esc(cex.name)}</b>${stageLine}${rows.join('')}</div>`);
    }
  }
  return `${parts.join('') || '<p class="muted">Keine Sätze eingetragen.</p>'}
    ${w.note && !onlyKey ? `<div class="hint" style="margin-top:8px">${esc(w.note)}</div>` : ''}`;
}

export function openWorkoutDetail(w, { allowEdit = true, onlyKey = null } = {}) {
  openSheet({
    title: `${w.planName} · ${fmtDate(w.date)}`,
    html: `<div class="form" style="gap:8px">
      <div class="small muted">${WEEKDAYS[weekdayIndex(w.date)]} · ${countSets(w)} Sätze${workoutProgress(w).complete ? ' · ★ Plan erfüllt' : ''}</div>
      ${workoutDetailHtml(w, onlyKey)}
      ${allowEdit ? `<div class="sheet-actions btn-row"><button class="btn danger" id="wd-del">Löschen</button><button class="btn primary" id="wd-edit">Bearbeiten</button></div>` : ''}
    </div>`,
    onMount(el, close) {
      if (!allowEdit) return;
      el.querySelector('#wd-edit').onclick = () => { close(); tview.sub = 'history'; tview.editId = w.id; render(); window.scrollTo(0, 0); };
      el.querySelector('#wd-del').onclick = async () => {
        if (!(await confirmDialog(`Training „${w.planName}“ vom ${fmtDate(w.date)} löschen?`))) return openWorkoutDetail(w);
        await deleteWorkout(w.id);
        toast('Training gelöscht');
        render();
      };
    },
  });
}

async function renderHistory(el) {
  if (tview.editId) {
    const orig = tstate.history.find((w) => w.id === tview.editId);
    if (orig) {
      return renderWorkout(el, clone(orig), {
        mode: 'edit',
        onDone: () => { tview.editId = null; toast('Training gespeichert'); render(); },
        onDelete: async () => { await deleteWorkout(orig.id); tview.editId = null; toast('Training gelöscht'); render(); },
      });
    }
    tview.editId = null;
  }
  const list = tstate.history;
  if (!list.length) { el.innerHTML = emptyState('Noch kein Training', 'Abgeschlossene Trainings erscheinen hier.'); return; }
  el.innerHTML = `<div class="card" style="padding:0">${list.map((w) => `
    <button class="hist" data-id="${w.id}">
      <div><div class="nm">${esc(w.planName)}</div><div class="sub">${WEEKDAYS[weekdayIndex(w.date)]}, ${fmtDate(w.date)}${w.note ? ' · Notiz' : ''}</div></div>
      <div class="kc">${workoutProgress(w).complete ? icon('star', 'star-status on') : ''} ${countSets(w)}<small>Sätze</small></div>
    </button>`).join('')}</div>`;
  el.onclick = (e) => {
    const b = e.target.closest('.hist');
    if (b) openWorkoutDetail(list.find((w) => w.id === b.dataset.id));
  };
}

registerTrainingSub('history', renderHistory);
