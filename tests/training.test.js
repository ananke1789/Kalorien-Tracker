// Tests Trainingslogik: node tests/training.test.js
import assert from 'node:assert/strict';
import { DEFAULT_EXERCISES, GROUPS } from '../js/training/catalog.js';
import { DEFAULT_PLANS } from '../js/training/plans.js';
import * as m from '../js/training/model.js';

let n = 0;
const t = (name, fn) => { try { fn(); n++; } catch (e) { console.error('✗', name); throw e; } };
const cat = DEFAULT_EXERCISES;
const plan = (id) => DEFAULT_PLANS.find((p) => p.id === id);

t('Katalog konsistent', () => {
  const ids = new Set();
  for (const ex of cat) {
    assert.ok(!ids.has(ex.id), 'doppelte ID ' + ex.id); ids.add(ex.id);
    assert.ok(GROUPS.includes(ex.group), ex.id);
    assert.ok(ex.variants.length >= 1);
    for (const v of ex.variants) {
      if (v.ref) assert.ok(cat.some((x) => x.id === v.ref), 'ref ' + v.ref);
      else assert.ok(['G', 'KG', 'Z', 'E'].includes(v.type), ex.id + '/' + v.id);
    }
  }
  // gleiche Übung nur einmal
  for (const name of ['Klimmzüge weit', 'Seitheben Kabelzug', 'Dead Hang']) assert.equal(cat.filter((x) => x.name === name).length, 1);
});
t('Pläne: 3 Hauptpläne + 7 Sondertrainings, Verweise gültig', () => {
  assert.equal(DEFAULT_PLANS.filter((p) => p.kind === 'main').length, 3);
  assert.deepEqual(DEFAULT_PLANS.filter((p) => p.kind === 'special').map((p) => p.id), ['4a', '4b', '4c', '4d', '4e', '4f', '4g']);
  for (const p of DEFAULT_PLANS) for (const it of p.items) {
    if (it.kind !== 'ex') continue;
    const ex = cat.find((x) => x.id === it.exId);
    assert.ok(ex, `${p.id}: ${it.exId}`);
    if (it.variant) assert.ok(ex.variants.some((v) => v.id === it.variant), `${p.id}: ${it.exId}/${it.variant}`);
    const r = m.resolve(cat, it.exId, it.variant);
    if (it.stage != null) assert.ok(r.def.stages && it.stage < r.def.stages.length, `${p.id}: Stufe`);
  }
});
t('Nummern und Supersets', () => {
  const up = plan('upper'), l = m.itemLabels(up.items);
  const labels = up.items.filter((i) => i.kind === 'ex').map((i) => l[i.uid]);
  assert.deepEqual(labels, ['1', '2', '3', '4', '5', '6', '7', '8', 'B1', 'B2', '9', '10']);
  const blocks = m.planBlocks(plan('cali').items);
  assert.deepEqual(blocks.map((b) => (b.kind === 'section' ? '#' : b.group + b.items.length)).join(' '), '# A2 B2 # C2 D2 E2 # F2');
  const l4e = m.itemLabels(plan('4e').items);
  assert.deepEqual(plan('4e').items.filter((i) => i.kind === 'ex').map((i) => l4e[i.uid]), ['1', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2', '2', 'G1', 'G2']);
});
t('parseRange', () => {
  assert.deepEqual(m.parseRange('8-12'), { min: 8, max: 12, unit: 'reps' });
  assert.deepEqual(m.parseRange('30-60 s'), { min: 30, max: 60, unit: 's' });
  assert.equal(m.parseRange('ca. 5 Min'), null);
});
t('Varianten auflösen: planübergreifend gleicher Schlüssel', () => {
  assert.equal(m.statKey(cat, 'schulteruebung', 'ref-pike-pushups'), m.statKey(cat, 'pike-pushups'));
  assert.equal(m.statKey(cat, 'untere-brust', 'ref-dips'), 'dips/std');
  assert.equal(m.resolve(cat, 'untere-brust', 'dip-maschine').def.type, 'G');
  assert.equal(m.resolve(cat, 'untere-brust', 'ref-dips').def.type, 'KG');
  assert.equal(m.statKey(cat, 'reverse-flys', 'kabel'), 'reverse-flys/kabel');
  assert.equal(m.resolve(cat, 'seitheben-kh', 'std').def.perHand, true);
});

// ---- Training anlegen, Snapshot, letzte Werte, Progression, Statistik ----
const fill = (w, uid, values) => { const ex = w.exercises.find((e) => e.uid === uid); values.forEach((v, i) => Object.assign(ex.sets[i], v)); return ex; };
const done = (w, date) => ({ ...w, date, status: 'done', finishedAt: Date.parse(date) });

t('Neues Training: Satzzeilen, pro Seite, optional, Vorauswahl', () => {
  const w = m.newWorkout(plan('4g'), cat, [], '2026-10-01');
  const aus = w.exercises.find((e) => e.exId === 'ausfallschritte');
  assert.equal(aus.sets.length, 4);
  assert.deepEqual(aus.sets.map((s) => s.side), ['L', 'R', 'L', 'R']);
  assert.equal(w.exercises.find((e) => e.exId === 'rudern').variant, 'kh-vorgebeugt');
  const w4a = m.newWorkout(plan('4a'), cat, [], '2026-10-01');
  assert.equal(w4a.exercises.find((e) => e.exId === 'dead-hang').open, false); // optional eingeklappt
  const w4f = m.newWorkout(plan('4f'), cat, [], '2026-10-01');
  assert.equal(w4f.exercises.find((e) => e.exId === 'pike-pushups').sets[0].stage, 1); // "mit Griffen (Deficit)"
  assert.equal(w.planSnapshot.items.length, plan('4g').items.length);
});
t('Plan-Snapshot: spätere Planänderungen ändern alte Trainings nicht', () => {
  const p = JSON.parse(JSON.stringify(plan('upper')));
  const w = m.newWorkout(p, cat, [], '2026-10-01');
  p.items[0].sets = 5; p.items[0].note = 'geändert'; p.items.pop();
  assert.equal(w.planSnapshot.items[0].sets, 2);
  assert.equal(w.planSnapshot.items[0].note, 'Priorität');
  assert.equal(w.planSnapshot.items.length, 13);
  const c2 = JSON.parse(JSON.stringify(cat)); c2.find((x) => x.id === 'klimmzuege-weit').variants[0].stages[0] = 'X';
  assert.notEqual(w.catalogSnap['klimmzuege-weit'].variants[0].stages[0], 'X');
});
t('Letzte Werte, letzte Variante, letzte Stufe (planübergreifend)', () => {
  const w1 = m.newWorkout(plan('cali'), cat, [], '2026-09-01');
  fill(w1, 'cali-5', [{ reps: 8, stage: 1 }, { reps: 7, stage: 1 }, { reps: 6, stage: 1 }]); // Klimmzüge
  const h = [done(w1, '2026-09-01')];
  const last = m.lastPerformance(h, 'klimmzuege-weit/std');
  assert.equal(last.date, '2026-09-01'); assert.deepEqual(last.sets.map((s) => s.reps), [8, 7, 6]);
  const w2 = m.newWorkout(plan('upper'), cat, h, '2026-09-03');
  assert.equal(w2.exercises.find((e) => e.exId === 'klimmzuege-weit').sets[0].stage, 1);
  // Variante: zuletzt genutzt
  const w3 = m.newWorkout(plan('upper'), cat, h, '2026-09-03');
  fill(w3, 'upper-8', [{ variant: 'dip-maschine', weight: 40, reps: 10 }]);
  w3.exercises.find((e) => e.uid === 'upper-8').variant = 'dip-maschine';
  const w4 = m.newWorkout(plan('4a'), cat, [...h, done(w3, '2026-09-03')], '2026-09-05');
  assert.equal(w4.exercises.find((e) => e.exId === 'untere-brust').variant, 'dip-maschine');
});
t('Progressionshinweis', () => {
  const it = plan('upper').items[0]; // Seitheben Kabelzug 2 x 12-20, G
  const def = m.resolve(cat, it.exId).def;
  const L = (sets) => ({ sets });
  assert.equal(m.progressionHint(it, def, L([{ weight: 5, reps: 20 }, { weight: 5, reps: 20 }])), 'Progression fällig: Gewicht erhöhen');
  assert.equal(m.progressionHint(it, def, L([{ weight: 5, reps: 20 }, { weight: 5, reps: 18 }])), null);
  assert.equal(m.progressionHint(it, def, L([{ weight: 5, reps: 20 }])), null); // zu wenige Sätze
  const kz = plan('cali').items.find((i) => i.exId === 'klimmzuege-weit'); // 3 x, ab 12
  const kd = m.resolve(cat, 'klimmzuege-weit').def;
  assert.equal(m.progressionHint(kz, kd, L([{ reps: 12, stage: 0 }, { reps: 12, stage: 0 }, { reps: 13, stage: 0 }])), 'Progression fällig: nächste Stufe');
  assert.equal(m.progressionHint(kz, kd, L([{ reps: 12, stage: 2 }, { reps: 12, stage: 2 }, { reps: 12, stage: 2 }])), 'Progression fällig: Zusatzgewicht erhöhen');
  const dh = plan('upper').items.find((i) => i.exId === 'dead-hang');
  assert.equal(m.progressionHint(dh, m.resolve(cat, 'dead-hang').def, L([{ secs: 60, stage: 0 }, { secs: 65, stage: 0 }])), 'Progression fällig: nächste Stufe');
  const sk = plan('cali').items.find((i) => i.exId === 'seitheben-kh');
  assert.ok(m.progressionHint(sk, m.resolve(cat, 'seitheben-kh', 'std').def, L([{ weight: 6, reps: 20 }, { weight: 6, reps: 21 }])).includes('nächste Variante'));
});
t('Statistik: Gewicht, Volumen (G, KG ohne/mit Gewicht, Z)', () => {
  assert.deepEqual(m.metrics('G', [{ weight: 20, reps: 10 }, { weight: 22.5, reps: 8 }]), { maxWeight: 22.5, volume: 380, volumeUnit: 'kg', stage: null });
  assert.deepEqual(m.metrics('KG', [{ reps: 10, stage: 0 }, { reps: 8, stage: 0 }]), { maxWeight: 0, volume: 18, volumeUnit: 'Wdh.', stage: 0 });
  assert.deepEqual(m.metrics('KG', [{ reps: 6, extra: 5, stage: 1 }, { reps: 5, extra: 7.5, stage: 1 }]), { maxWeight: 7.5, volume: 67.5, volumeUnit: 'kg', stage: 1 });
  assert.deepEqual(m.metrics('Z', [{ secs: 45, extra: 10 }, { secs: 40 }]), { maxWeight: 10, volume: 85, volumeUnit: 's', stage: null });
});
t('Statistik-Reihe, Zeitraum, Stufenwechsel, Trainings pro Woche', () => {
  const mk = (date, reps, stage) => { const w = m.newWorkout(plan('cali'), cat, [], date); fill(w, 'cali-5', reps.map((r) => ({ reps: r, stage }))); return done(w, date); };
  const h = [mk('2026-06-01', [8, 8, 8], 0), mk('2026-09-20', [12, 12, 12], 0), mk('2026-09-27', [6, 6, 5], 1), mk('2026-10-02', [7, 6, 6], 1)];
  const all = m.statSeries(h, 'klimmzuege-weit/std', null, '2026-10-04');
  assert.deepEqual(all.map((p) => p.volume), [24, 36, 17, 19]);
  assert.deepEqual(m.stageChanges(all), [2]);
  assert.equal(m.statSeries(h, 'klimmzuege-weit/std', 28, '2026-10-04').length, 3);
  const wk = m.perWeek(h, 28, '2026-10-04');
  assert.equal(wk[0].week, '2026-09-07');
  assert.deepEqual(wk.map((x) => x.count), [0, 1, 1, 1]); // So 20.09., So 27.09., Fr 02.10.
  assert.equal(Object.keys(m.usedKeys(h)).includes('klimmzuege-weit/std'), true);
});
t('Fortschritt / Stern: alle geplanten Sätze eingetragen', () => {
  const w = m.newWorkout(plan('lower'), cat, [], '2026-10-01');
  assert.equal(m.workoutProgress(w).complete, false);
  for (const ex of w.exercises) for (const s of ex.sets) {
    const type = m.typeOf(w, ex, s);
    Object.assign(s, type === 'E' ? { done: true } : { weight: 50, reps: 10 });
  }
  const pr = m.workoutProgress(w);
  assert.ok(pr.complete); assert.equal(pr.planned, 3 + 2 + 3 + 3 + 3 + 3 + 1 + 4);
  w.exercises[0].sets.pop(); w.exercises[1].skipped = true; w.exercises[1].sets[0].reps = 0;
  assert.ok(m.workoutProgress(w).complete);
  assert.equal(m.countSets(w), 2 + 3 + 3 + 3 + 3 + 1 + 4); // ohne übersprungene Beinpresse
});
console.log(`OK: ${n} Trainings-Testgruppen bestanden`);
