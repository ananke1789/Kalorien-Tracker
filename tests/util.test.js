// Tests der Berechnungen: node tests/util.test.js
import assert from 'node:assert/strict';
import * as u from '../js/util.js';

let n = 0;
const t = (name, fn) => { fn(); n++; };
const near = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);

t('parseNum Komma/Punkt', () => {
  assert.equal(u.parseNum('1,5'), 1.5);
  assert.equal(u.parseNum('1.5'), 1.5);
  assert.equal(u.parseNum(' 250 '), 250);
  assert.equal(u.parseNum(',5'), 0.5);
  assert.ok(Number.isNaN(u.parseNum('abc')));
  assert.ok(Number.isNaN(u.parseNum('')));
  assert.ok(Number.isNaN(u.parseNum('1,2,3')));
});
t('Formatierung', () => {
  assert.equal(u.fmtKcal(2899.6), '2.900');
  assert.equal(u.fmtMacro(12.345), '12,3');
  assert.equal(u.fmtMacro(0), '0,0');
  assert.equal(u.fmtMacro(-3.25), '−3,3');
  assert.equal(u.fmtKcal(-0.2), '0');
  assert.equal(u.numToInput(1.5), '1,5');
});
t('Datum', () => {
  assert.equal(u.fmtDate('2026-10-04'), '04.10.2026');
  assert.equal(u.addDays('2026-02-28', 1), '2026-03-01');
  assert.equal(u.addDays('2026-03-29', 1), '2026-03-30'); // Zeitumstellung
  assert.equal(u.weekStart('2026-10-04'), '2026-09-28'); // Sonntag -> Montag davor
  assert.equal(u.weekStart('2026-09-28'), '2026-09-28');
  assert.equal(u.weekDays('2026-10-01').length, 7);
  assert.equal(u.weekDays('2026-10-01')[6], '2026-10-04');
  assert.equal(u.isoWeek('2026-10-04'), 40);
  assert.equal(u.isoWeek('2027-01-01'), 53);
});
t('Gramm und Portionen', () => {
  const per100 = { kcal: 400, protein: 20, fat: 10, carbs: 50 };
  const v = u.scale(per100, 150);
  near(v.kcal, 600); near(v.protein, 30); near(v.fat, 15); near(v.carbs, 75);
  const g = u.portionGrams(45, 2); // 2 Riegel à 45 g
  assert.equal(g, 90);
  near(u.scale(per100, g).kcal, 360);
  near(u.scale(per100, u.portionGrams(45, 0.5)).protein, 4.5);
});
t('Tagessumme', () => {
  const e = [
    { per100: { kcal: 100, protein: 10, fat: 1, carbs: 5 }, grams: 200 },
    { per100: { kcal: 50, protein: 1, fat: 0.5, carbs: 10 }, grams: 50 },
  ];
  const s = u.sumEntries(e);
  near(s.kcal, 225); near(s.protein, 20.5); near(s.fat, 2.25); near(s.carbs, 15);
});
t('Rest-Carbs', () => {
  near(u.carbGoal({ kcal: 2900, protein: 125, fat: 65 }), 453.75);
  assert.equal(u.carbGoal({ kcal: 1000, protein: 200, fat: 50 }), 0);
});
t('Zielstatus', () => {
  assert.equal(u.goalStatus('protein', 150, 125), 'exceeded');
  assert.equal(u.goalStatus('protein', 125, 125), 'met');
  assert.equal(u.goalStatus('protein', 100, 125), 'open');
  assert.equal(u.goalStatus('kcal', 3500, 2900), 'over');
  assert.equal(u.goalStatus('kcal', 2700, 2900), 'met');
  assert.equal(u.goalStatus('kcal', 2000, 2900), 'open');
  assert.equal(u.goalStatus('carbs', 460, 453.75), 'met');
  const goals = { kcal: 2900, protein: 125, fat: 65 };
  assert.ok(u.planFulfilled({ kcal: 2850, protein: 140, fat: 70, carbs: 400 }, goals));
  assert.ok(!u.planFulfilled({ kcal: 2850, protein: 120, fat: 70, carbs: 400 }, goals));
  assert.ok(!u.planFulfilled({ kcal: 3300, protein: 140, fat: 70, carbs: 400 }, goals));
});
t('Plausibilität', () => {
  assert.ok(u.plausibility({ kcal: 389, protein: 13.5, fat: 7, carbs: 58.7 }).ok);
  assert.ok(!u.plausibility({ kcal: 900, protein: 13.5, fat: 7, carbs: 58.7 }).ok);
});
t('Deutsche Sortierung', () => {
  const s = u.sortFoods([{ name: 'Zucker' }, { name: 'Äpfel' }, { name: 'apfelmus' }, { name: 'Banane' }]).map((f) => f.name);
  assert.deepEqual(s, ['Äpfel', 'apfelmus', 'Banane', 'Zucker']);
  assert.equal(u.letterOf('Öl'), 'O');
  assert.equal(u.letterOf('3-Korn'), '#');
});
t('Wochensummen', () => {
  const days = u.weekDays('2026-10-01');
  const p = { kcal: 100, protein: 10, fat: 5, carbs: 10 };
  const entries = [
    { date: '2026-09-28', per100: p, grams: 2900 }, // 2900 kcal, 290 P, 145 F -> Plan erfüllt
    { date: '2026-09-28', per100: p, grams: 0 },
    { date: '2026-09-30', per100: p, grams: 1000 }, // 1000 kcal
    { date: '2026-10-05', per100: p, grams: 500 }, // nächste Woche, wird ignoriert
  ];
  const w = u.weekData(entries.filter((e) => days.includes(e.date)), days, { kcal: 2900, protein: 125, fat: 65 });
  near(w.total.kcal, 3900);
  assert.equal(w.logged, 2);
  near(w.avg.kcal, 1950);
  near(w.avg.protein, 195);
  assert.equal(w.okDays, 1);
  near(w.perDay[2].tot.kcal, 1000);
});
console.log(`OK: ${n} Testgruppen bestanden (inkl. Woche)`);
