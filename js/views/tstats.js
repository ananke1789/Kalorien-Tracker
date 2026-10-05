// Trainingsstatistik pro Übung und Variante (planübergreifend)
import { openSheet, icon, render, emptyState } from '../core.js';
import { esc, fmtDate, fmtNum, norm, parseKey } from '../util.js';
import { RANGES, statSeries, stageChanges, perWeek, usedKeys, catMap } from '../training/model.js';
import { GROUPS } from '../training/catalog.js';
import { tstate } from '../training/store.js';
import { lineChart, miniBars } from '../charts.js';
import { registerTrainingSub } from './training.js';
import { openWorkoutDetail } from './thistory.js';

const st = { key: null, range: '3m', metric: 'weight' };

// Übungen mit Daten: exId -> { name, group, variants: [{ key, name }] }
function exercisesWithData() {
  const used = usedKeys(tstate.history);
  const cat = catMap(tstate.catalog);
  const out = {};
  for (const key of Object.keys(used)) {
    const [exId, vId] = key.split('/');
    const name = cat[exId]?.name || used[key].split(' · ')[0];
    const vName = cat[exId]?.variants.find((v) => v.id === vId)?.name || used[key].split(' · ')[1] || name;
    (out[exId] ||= { exId, name, group: cat[exId]?.group || 'Eigene', variants: [] }).variants.push({ key, name: vName });
  }
  return out;
}

function openPicker(list) {
  let q = '';
  openSheet({
    title: 'Übung wählen',
    html: `<div class="form" style="gap:10px">
      <div class="search">${icon('search')}<input class="input" id="sp-q" type="search" placeholder="Übung suchen…" autocomplete="off"></div>
      <div class="pick-list" id="sp-list" style="max-height:60vh"></div></div>`,
    onMount(el, close) {
      const draw = () => {
        let html = '';
        for (const g of GROUPS) {
          const exs = Object.values(list).filter((x) => x.group === g && (!q || norm(x.name + ' ' + x.variants.map((v) => v.name).join(' ')).includes(norm(q))))
            .sort((a, b) => a.name.localeCompare(b.name, 'de'));
          if (!exs.length) continue;
          html += `<div class="pick-head">${esc(g)}</div>` + exs.map((x) => `<button class="pick" data-key="${esc(x.variants[0].key)}"><span>${esc(x.name)}</span><span class="kc">${x.variants.length > 1 ? `${x.variants.length} Varianten` : ''}</span></button>`).join('');
        }
        el.querySelector('#sp-list').innerHTML = html || '<div class="empty compact"><span>Kein Treffer.</span></div>';
      };
      draw();
      el.querySelector('#sp-q').oninput = (e) => { q = e.target.value; draw(); };
      el.querySelector('#sp-list').onclick = (e) => { const b = e.target.closest('[data-key]'); if (b) { st.key = b.dataset.key; close(); render(); } };
    },
  });
}

async function renderStats(el) {
  const list = exercisesWithData();
  if (!Object.keys(list).length) { el.innerHTML = emptyState('Noch keine Daten', 'Schließe ein Training ab, um hier Verläufe zu sehen.'); return; }
  if (!st.key || !list[st.key.split('/')[0]]?.variants.some((v) => v.key === st.key)) {
    const last = tstate.history[0];
    st.key = Object.values(list).find((x) => last && last.exercises.some((e) => e.exId === x.exId))?.variants[0].key || Object.values(list)[0].variants[0].key;
  }
  const exInfo = list[st.key.split('/')[0]];
  const range = RANGES.find((r) => r.id === st.range);
  const pts = statSeries(tstate.history, st.key, range.days);
  const type = pts[0]?.type || 'G';
  const cat = catMap(tstate.catalog);
  const [exId, vId] = st.key.split('/');
  const def = cat[exId]?.variants.find((v) => v.id === vId) || {};
  const useWeight = st.metric === 'weight';
  const units = [...new Set(pts.map((p) => p.volumeUnit))];
  const mixed = !useWeight && units.length > 1; // KG teils ohne, teils mit Zusatzgewicht
  const unit = useWeight ? 'kg' : mixed ? 'Wdh. / kg' : units[0] || '';
  const unitOf = (i) => (useWeight ? 'kg' : pts[i].volumeUnit);
  const series = pts.map((p) => ({ t: parseKey(p.date).getTime(), y: useWeight ? p.maxWeight : p.volume, id: p.workoutId }));
  const short = (t) => (t.length > 18 ? t.slice(0, 17) + '…' : t);
  const markers = stageChanges(pts).map((i) => ({ i, label: def.stages?.[pts[i].stage] ? `Stufe ${pts[i].stage + 1}: ${short(def.stages[pts[i].stage])}` : `Stufe ${pts[i].stage + 1}` }));
  const noWeight = useWeight && pts.length && pts.every((p) => !p.maxWeight);
  const bestI = series.reduce((bi, p, i) => (p.y > series[bi].y ? i : bi), 0);
  const weeks = perWeek(tstate.history, range.days);
  const wkShown = weeks.slice(-26);
  const digits = useWeight ? 1 : 0;

  el.innerHTML = `
    <button class="btn block" id="sp-open" style="justify-content:space-between">${icon('search')}<span style="flex:1;text-align:left">${esc(exInfo.name)}</span><span class="small muted">ändern</span></button>
    ${exInfo.variants.length > 1 ? `<div class="seg" id="sp-var" style="flex-wrap:wrap">${exInfo.variants.map((v) => `<button data-key="${esc(v.key)}" class="${v.key === st.key ? 'on' : ''}">${esc(v.name)}</button>`).join('')}</div>` : ''}
    <div class="seg" id="sp-range">${RANGES.map((r) => `<button data-r="${r.id}" class="${r.id === st.range ? 'on' : ''}">${r.label.replace(' Wochen', ' W').replace(' Monate', ' M').replace('1 Jahr', '1 J')}</button>`).join('')}</div>
    <div class="seg" id="sp-metric"><button data-m="weight" class="${useWeight ? 'on' : ''}">Gewicht</button><button data-m="volume" class="${useWeight ? '' : 'on'}">Volumen</button></div>
    <div class="card">
      <svg class="watermark" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-gear"/></svg>
      <div class="card-head"><span class="label">${useWeight ? (type === 'G' ? 'Schwerstes Gewicht' : 'Max. Zusatzgewicht') : 'Volumen'} pro Training</span><span class="small muted">${esc(unit)}</span></div>
      <hr class="rule red">
      ${pts.length ? lineChart(series, { unit, digits, markers }) : '<p class="muted small">Keine Trainings mit dieser Übung im Zeitraum.</p>'}
      ${mixed ? '<p class="small muted" style="margin:6px 0 0">Körpergewicht: ohne Zusatzgewicht = Wiederholungen, mit Zusatzgewicht = kg × Wdh.</p>' : ''}
      ${noWeight ? '<p class="small muted" style="margin:6px 0 0">Ohne Zusatzgewicht – unter „Volumen“ siehst du die Gesamtwiederholungen bzw. -sekunden.</p>' : ''}
      ${pts.length ? `<div class="stat-grid" style="margin-top:10px">
        <div><span class="label">Trainings</span><b>${pts.length}</b></div>
        <div><span class="label">Bestwert</span><b>${fmtNum(series[bestI].y, digits)} ${esc(unitOf(bestI))}</b></div>
        <div><span class="label">Zuletzt</span><b>${fmtNum(series[series.length - 1].y, digits)} ${esc(unitOf(series.length - 1))}</b><span class="small muted">${fmtDate(pts[pts.length - 1].date)}</span></div>
        <div><span class="label">Erstes</span><b>${fmtNum(series[0].y, digits)} ${esc(unitOf(0))}</b><span class="small muted">${fmtDate(pts[0].date)}</span></div>
      </div><p class="small muted" style="margin:8px 0 0">Tippe auf einen Punkt für die Details.</p>` : ''}
    </div>
    <div class="card">
      <div class="card-head"><span class="label">Trainings pro Woche</span><span class="small muted">${weeks.reduce((a, w) => a + w.count, 0)} gesamt</span></div>
      <hr class="rule red">
      ${miniBars(wkShown.map((w, i) => ({ value: w.count, label: i % Math.ceil(wkShown.length / 7) === 0 ? fmtDate(w.week).slice(0, 6) : '' })))}
      ${weeks.length > wkShown.length ? '<p class="small muted" style="margin:4px 0 0">Letzte 26 Wochen</p>' : ''}
    </div>`;
  el.querySelector('#sp-open').onclick = () => openPicker(list);
  el.querySelectorAll('#sp-var button').forEach((b) => (b.onclick = () => { st.key = b.dataset.key; render(); }));
  el.querySelectorAll('#sp-range button').forEach((b) => (b.onclick = () => { st.range = b.dataset.r; render(); }));
  el.querySelectorAll('#sp-metric button').forEach((b) => (b.onclick = () => { st.metric = b.dataset.m; render(); }));
  el.querySelectorAll('.lpt').forEach((g) => (g.onclick = () => {
    const w = tstate.history.find((x) => x.id === g.dataset.id);
    if (w) openWorkoutDetail(w, { allowEdit: false, onlyKey: st.key });
  }));
}

registerTrainingSub('stats', renderStats);
