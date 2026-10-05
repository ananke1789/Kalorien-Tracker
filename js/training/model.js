// Trainingslogik ohne DOM: Varianten auflösen, Training anlegen, letzte Werte, Progression, Statistik
import { uid, todayKey, weekStart, addDays } from '../util.js';

export const TYPE_LABEL = { G: 'Gewicht', KG: 'Körpergewicht', Z: 'Zeit', E: 'Erledigt' };
export const clone = (o) => JSON.parse(JSON.stringify(o));

// "8-12" -> {min, max, unit}; "30-60 s" -> unit 's'; Text ohne Bereich -> null
export function parseRange(reps) {
  const m = String(reps || '').match(/(\d+)\s*[-–]\s*(\d+)/);
  if (!m) return null;
  return { min: +m[1], max: +m[2], unit: /\d\s*s\b|sek/i.test(reps) ? 's' : 'reps' };
}

// Anzeige-Nummern: Superset-Gruppen "A1, A2", sonst laufende Nummer
export function itemLabels(items) {
  const labels = {}, inGroup = {};
  let n = 0;
  for (const it of items) {
    if (it.kind !== 'ex') continue;
    if (it.group) { inGroup[it.group] = (inGroup[it.group] || 0) + 1; labels[it.uid] = it.group + inGroup[it.group]; }
    else labels[it.uid] = String(++n);
  }
  return labels;
}

// Blöcke für die Darstellung: Abschnitt | Superset (aufeinanderfolgende gleiche Gruppe) | Einzelübung
export function planBlocks(items) {
  const blocks = [];
  for (const it of items) {
    const last = blocks[blocks.length - 1];
    if (it.kind === 'section') blocks.push({ kind: 'section', title: it.title, uid: it.uid });
    else if (it.group && last && last.kind === 'superset' && last.group === it.group) last.items.push(it);
    else if (it.group) blocks.push({ kind: 'superset', group: it.group, items: [it] });
    else blocks.push({ kind: 'single', items: [it] });
  }
  return blocks;
}

export const catMap = (catalog) => (Array.isArray(catalog) ? Object.fromEntries(catalog.map((x) => [x.id, x])) : catalog);

// Variante auflösen (inkl. Verweis auf eigenständige Übung).
// -> { ex, variant, def (Typ/Stufen/Flags), target: {exId, variantId}, key, name }
export function resolve(catalog, exId, variantId) {
  const cat = catMap(catalog);
  const ex = cat[exId];
  if (!ex) return null;
  const variant = ex.variants.find((x) => x.id === variantId) || ex.variants[0];
  if (variant.ref && cat[variant.ref]) {
    const tex = cat[variant.ref];
    const tv = tex.variants[0];
    return { ex, variant, def: tv, target: { exId: tex.id, variantId: tv.id }, key: `${tex.id}/${tv.id}`, name: tex.variants.length > 1 ? `${tex.name} · ${tv.name}` : tex.name, exName: tex.name };
  }
  const name = ex.variants.length > 1 ? (variant.name === ex.name ? ex.name : `${ex.name} · ${variant.name}`) : ex.name;
  return { ex, variant, def: variant, target: { exId: ex.id, variantId: variant.id }, key: `${ex.id}/${variant.id}`, name, exName: ex.name };
}
export const statKey = (catalog, exId, variantId) => resolve(catalog, exId, variantId)?.key;

// Katalog-Ausschnitt für ein Training (Übungen + referenzierte Übungen)
export function catalogSnapshot(catalog, exIds) {
  const cat = catMap(catalog), out = {};
  const add = (id) => {
    if (!cat[id] || out[id]) return;
    out[id] = clone(cat[id]);
    cat[id].variants.forEach((x) => x.ref && add(x.ref));
  };
  exIds.forEach(add);
  return out;
}

// Ist ein Satz ausgefüllt?
export function setFilled(s, type) {
  if (type === 'E') return !!s.done;
  if (type === 'Z') return s.secs > 0;
  if (type === 'G') return s.reps > 0 && s.weight != null && s.weight !== '';
  return s.reps > 0; // KG
}

// abgeschlossene Trainings, neueste zuerst
export const sortHistory = (workouts) => workouts.filter((w) => w.status === 'done')
  .sort((a, b) => (b.date === a.date ? (b.finishedAt || 0) - (a.finishedAt || 0) : b.date < a.date ? -1 : 1));

// Sätze eines Trainings je Stat-Key: [{ key, type, sets }]
export function setsByKey(w) {
  const out = {};
  for (const ex of w.exercises) {
    if (ex.skipped) continue;
    for (const s of ex.sets) {
      const r = resolve(w.catalogSnap, ex.exId, s.variant || ex.variant);
      if (!r || !setFilled(s, r.def.type)) continue;
      (out[r.key] ||= { key: r.key, name: r.name, type: r.def.type, def: r.def, sets: [] }).sets.push(s);
    }
  }
  return out;
}

// letztes abgeschlossenes Training mit diesem Key -> { date, workoutId, sets, type }
export function lastPerformance(history, key, excludeId) {
  for (const w of sortHistory(history)) {
    if (w.id === excludeId) continue;
    const g = setsByKey(w)[key];
    if (g) return { date: w.date, workoutId: w.id, sets: g.sets, type: g.type };
  }
  return null;
}

// zuletzt genutzte Variante einer Übung (über alle Pläne)
export function lastVariant(history, exId) {
  for (const w of sortHistory(history)) {
    const ex = w.exercises.find((x) => x.exId === exId && !x.skipped && x.sets.some((s) => setFilled(s, resolve(w.catalogSnap, x.exId, s.variant || x.variant)?.def.type)));
    if (ex) return ex.variant;
  }
  return null;
}

// Progressionshinweis: alle Sätze des letzten Mals am oberen Ende (bzw. "Nächste Stufe ab")
export function progressionHint(item, def, last) {
  if (!last || def.type === 'E') return null;
  const range = parseRange(item.reps);
  const target = def.nextAt || range?.max;
  if (!target) return null;
  const sides = item.perSide || def.perSide ? 2 : 1;
  const sets = last.sets;
  if (sets.length < item.sets * sides) return null;
  const val = (s) => (def.type === 'Z' ? s.secs : s.reps);
  if (!sets.every((s) => val(s) >= target)) return null;
  const stage = Math.max(...sets.map((s) => s.stage || 0));
  if (def.stages && def.stages.length && stage < def.stages.length - 1) return 'Progression fällig: nächste Stufe';
  if (def.progress) return `Progression fällig: ${def.progress}`;
  if (def.type === 'G') return 'Progression fällig: Gewicht erhöhen';
  if (def.type === 'Z') return 'Progression fällig: Zeit oder Zusatzgewicht erhöhen';
  return 'Progression fällig: Zusatzgewicht erhöhen';
}

// leere Satzzeilen
export function makeSets(n, perSide, variant, stage) {
  const out = [];
  for (let i = 0; i < n; i++) for (const side of perSide ? ['L', 'R'] : [null]) out.push({ id: uid(), variant, side, stage, extraOpen: false });
  return out;
}

// neues Training aus Plan (Plan- und Katalog-Snapshot)
export function newWorkout(plan, catalog, history = [], date = todayKey()) {
  const items = clone(plan.items);
  const exIds = items.filter((i) => i.kind === 'ex').map((i) => i.exId);
  const snap = catalogSnapshot(catalog, exIds);
  const exercises = items.filter((i) => i.kind === 'ex' && snap[i.exId]).map((it) => {
    const ex = snap[it.exId];
    const lv = lastVariant(history, it.exId);
    const variant = (lv && ex.variants.some((x) => x.id === lv) ? lv : null) || it.variant || ex.variants[0].id;
    const r = resolve(snap, it.exId, variant);
    const last = lastPerformance(history, r.key);
    const lastStage = last ? Math.max(...last.sets.map((s) => s.stage || 0)) : null;
    const stage = r.def.stages?.length ? Math.min(lastStage ?? it.stage ?? 0, r.def.stages.length - 1) : null;
    return { uid: it.uid, exId: it.exId, variant, skipped: false, open: !it.optional, sets: makeSets(it.sets, it.perSide || r.def.perSide, variant, stage) };
  });
  return {
    id: uid(), planId: plan.id, planName: plan.name, date, status: 'active', note: '',
    startedAt: Date.now(), updatedAt: Date.now(),
    planSnapshot: { id: plan.id, name: plan.name, note: plan.note || '', items },
    catalogSnap: snap, exercises,
  };
}

// Typ eines Satzes (Variante pro Satz oder Übung)
export const typeOf = (w, ex, s) => resolve(w.catalogSnap, ex.exId, (s && s.variant) || ex.variant)?.def.type;

// geplante Sätze vollständig? (nicht übersprungene, nicht optionale Übungen)
export function workoutProgress(w) {
  const opt = Object.fromEntries(w.planSnapshot.items.map((i) => [i.uid, !!i.optional]));
  let planned = 0, filled = 0;
  for (const ex of w.exercises) {
    if (ex.skipped || opt[ex.uid]) continue;
    for (const s of ex.sets) { planned++; if (setFilled(s, typeOf(w, ex, s))) filled++; }
  }
  return { planned, filled, complete: planned > 0 && filled === planned };
}
export const countSets = (w) => Object.values(setsByKey(w)).reduce((n, g) => n + g.sets.length, 0);

// ---------- Statistik ----------
export const RANGES = [
  { id: '4w', label: '4 Wochen', days: 28 },
  { id: '3m', label: '3 Monate', days: 91 },
  { id: '6m', label: '6 Monate', days: 182 },
  { id: '1y', label: '1 Jahr', days: 365 },
  { id: 'all', label: 'Alles', days: null },
];

// Kennzahlen eines Trainings für einen Key
export function metrics(type, sets) {
  const w = (s) => (type === 'G' ? Number(s.weight) || 0 : Number(s.extra) || 0);
  const weights = sets.map(w);
  const maxWeight = weights.length ? Math.max(...weights) : 0;
  let volume, volumeUnit;
  if (type === 'Z') { volume = sets.reduce((a, s) => a + (s.secs || 0), 0); volumeUnit = 's'; }
  else if (type === 'G') { volume = sets.reduce((a, s) => a + w(s) * (s.reps || 0), 0); volumeUnit = 'kg'; }
  else if (sets.some((s) => w(s) > 0)) { volume = sets.reduce((a, s) => a + w(s) * (s.reps || 0), 0); volumeUnit = 'kg'; }
  else { volume = sets.reduce((a, s) => a + (s.reps || 0), 0); volumeUnit = 'Wdh.'; }
  const stage = Math.max(...sets.map((s) => (s.stage == null ? -1 : s.stage)));
  return { maxWeight, volume, volumeUnit, stage: stage < 0 ? null : stage };
}

// Punkte für einen Key im Zeitraum, chronologisch
export function statSeries(history, key, rangeDays, today = todayKey()) {
  const from = rangeDays ? addDays(today, -rangeDays + 1) : '0000-00-00';
  const pts = [];
  for (const w of [...sortHistory(history)].reverse()) {
    if (w.date < from || w.date > today) continue;
    const g = setsByKey(w)[key];
    if (!g) continue;
    pts.push({ date: w.date, workoutId: w.id, sets: g.sets, type: g.type, ...metrics(g.type, g.sets) });
  }
  return pts;
}

// Stufenwechsel: Indizes der Punkte, an denen sich die Stufe ändert
export function stageChanges(pts) {
  const out = [];
  pts.forEach((p, i) => { if (i > 0 && p.stage != null && p.stage !== pts[i - 1].stage) out.push(i); });
  return out;
}

// Trainings pro Woche (Montag) im Zeitraum
export function perWeek(history, rangeDays, today = todayKey()) {
  const done = sortHistory(history);
  const first = rangeDays ? addDays(today, -rangeDays + 1) : (done.length ? done[done.length - 1].date : today);
  const weeks = [];
  for (let w = weekStart(first); w <= today; w = addDays(w, 7)) weeks.push({ week: w, count: 0 });
  for (const x of done) {
    if (x.date < first || x.date > today) continue;
    const wk = weeks.find((k) => k.week === weekStart(x.date));
    if (wk) wk.count++;
  }
  return weeks;
}

// alle Keys mit Daten (für Statistik-Auswahl)
export function usedKeys(history) {
  const out = {};
  for (const w of history) if (w.status === 'done') for (const g of Object.values(setsByKey(w))) out[g.key] = g.name;
  return out;
}
