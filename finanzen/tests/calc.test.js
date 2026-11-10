// Tests der Rechenlogik: node tests/calc.test.js
import assert from 'node:assert/strict';
import * as c from '../js/calc.js';

let n = 0, failed = 0;
const t = (name, fn) => { n++; try { fn(); console.log('✓', name); } catch (e) { failed++; console.log('✗', name, '\n  ', e.message); } };

t('parseMoney: deutsche und englische Schreibweise', () => {
  assert.equal(c.parseMoney('12,50'), 1250);
  assert.equal(c.parseMoney('12.5'), 1250);
  assert.equal(c.parseMoney('1.234,56'), 123456);
  assert.equal(c.parseMoney('1.234'), 123400);
  assert.equal(c.parseMoney('7'), 700);
  assert.equal(c.parseMoney(' 3,99 € '), 399);
  assert.ok(Number.isNaN(c.parseMoney('abc')));
  assert.ok(Number.isNaN(c.parseMoney('')));
  assert.ok(Number.isNaN(c.parseMoney('1,234')));
});
t('money formatiert mit Komma, Tausenderpunkt, Vorzeichen', () => {
  assert.equal(c.money(123456).replace(/\s/g, ' '), '1.234,56 €');
  assert.equal(c.money(-500).replace(/\s/g, ' '), '−5,00 €');
  assert.equal(c.money(500, { sign: true }).replace(/\s/g, ' '), '+5,00 €');
  assert.equal(c.money(12345, { round: true }).replace(/\s/g, ' '), '123 €');
});
t('Datum: Wochenstart Montag, Monatsgrenzen, KW', () => {
  assert.equal(c.weekStart('2026-11-10'), '2026-11-09');
  assert.equal(c.weekStart('2026-11-15'), '2026-11-09');
  assert.equal(c.weekStart('2026-11-09'), '2026-11-09');
  assert.equal(c.monthEnd('2026-02-10'), '2026-02-28');
  assert.equal(c.addMonths('2026-01-31', 1), '2026-02-01');
  assert.equal(c.addMonths('2026-01-15', -2), '2025-11-01');
  assert.equal(c.isoWeek('2026-11-10'), 46);
  assert.equal(c.isoWeek('2027-01-01'), 53);
  assert.equal(c.daysBetween('2026-11-10', '2026-11-30'), 20);
});

const rec = (o) => ({ id: 'r', name: 'X', type: 'out', every: 1, day: 1, start: '2026-01-01', end: '', amounts: [{ from: '2026-01-01', amount: 1000 }], ...o });
t('Fälligkeiten: monatlich, Tag 31 im Februar, Ende', () => {
  const r = rec({ day: 31, start: '2026-01-31', amounts: [{ from: '2026-01-31', amount: 1000 }] });
  assert.deepEqual(c.occurrences(r, '2026-01-01', '2026-04-30').map((o) => o.date), ['2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30']);
  const e = rec({ end: '2026-03-15' });
  assert.deepEqual(c.occurrences(e, '2026-01-01', '2026-12-31').map((o) => o.date), ['2026-01-01', '2026-02-01', '2026-03-01']);
  assert.equal(c.occurrences(rec({ start: '2026-05-01' }), '2026-01-01', '2026-04-30').length, 0);
});
t('Fälligkeiten: vierteljährlich und jährlich, auch weit in der Zukunft', () => {
  const q = rec({ every: 3, day: 15, start: '2026-02-15' });
  assert.deepEqual(c.occurrences(q, '2026-01-01', '2026-12-31').map((o) => o.date), ['2026-02-15', '2026-05-15', '2026-08-15', '2026-11-15']);
  const y = rec({ every: 12, day: 1, start: '2020-03-01' });
  assert.deepEqual(c.occurrences(y, '2030-01-01', '2030-12-31').map((o) => o.date), ['2030-03-01']);
  assert.deepEqual(c.occurrences(q, '2031-05-01', '2031-05-31').map((o) => o.date), ['2031-05-15']);
});
t('Betragsänderung ab Datum: Historie bleibt', () => {
  const r = rec({ amounts: [{ from: '2026-01-01', amount: 1000 }, { from: '2026-06-01', amount: 1299 }] });
  assert.equal(c.amountAt(r, '2026-05-31'), 1000);
  assert.equal(c.amountAt(r, '2026-06-01'), 1299);
  assert.equal(c.recurringSum([r], '2026-01-01', '2026-12-31', 'out'), 5 * 1000 + 7 * 1299);
  assert.equal(c.monthlyEquivalent(rec({ every: 12, amounts: [{ from: '2026-01-01', amount: 12000 }] })), 1000);
});

const tx = (date, amount, catId = 'supermarkt', type = 'out') => ({ id: date + amount + catId, date, amount, catId, type });
t('Durchschnitt: letzte vollständige Monate, ab erstem Eintrag', () => {
  const txs = [tx('2026-08-01', 9200), tx('2026-09-05', 9200, 'buecher'), tx('2026-10-31', 9200), tx('2026-11-05', 50000)];
  const a = c.averageSpending(txs, '2026-11-10', 3); // 01.08.–31.10. = 92 Tage, aktueller Monat zählt nicht
  assert.equal(a.from, '2026-08-01'); assert.equal(a.to, '2026-10-31'); assert.equal(a.days, 92);
  assert.equal(Math.round(a.perDay), 300);
  assert.equal(Math.round(a.perCat.buecher * 92), 9200);
  const b = c.averageSpending([tx('2026-10-20', 1200)], '2026-11-10', 3); // erst ab 20.10. -> 12 Tage < 14 -> bis heute
  assert.equal(b.basis, 'short'); assert.equal(b.from, '2026-10-20'); assert.equal(b.to, '2026-11-10');
  assert.equal(c.averageSpending([], '2026-11-10').perDay, 0);
});
t('Monatsprognose ohne Kontostand', () => {
  const recs = [rec({ name: 'Miete', amounts: [{ from: '2026-01-01', amount: 50000 }] }), rec({ type: 'in', day: 28, amounts: [{ from: '2026-01-01', amount: 150000 }] })];
  const txs = [tx('2026-08-01', 92 * 1000), tx('2026-11-03', 15000), tx('2026-11-04', 2000, null, 'in')];
  const f = c.forecastMonth({ txs, recs, today: '2026-11-10', avgMonths: 3, categories: c.DEFAULT_CATEGORIES });
  assert.equal(f.daysLeft, 20);
  assert.equal(f.income, 152000); assert.equal(f.fixed, 50000); assert.equal(f.spent, 15000);
  assert.equal(f.expectedRest, 20 * 1000); // Ø 10 €/Tag
  assert.equal(f.net, 152000 - 50000 - 15000 - 20000);
  assert.equal(f.balance, null);
  assert.equal(f.perDayAvailable, Math.floor((152000 - 50000 - 15000) / 21));
  const sm = f.cats.find((x) => x.cat.id === 'supermarkt');
  assert.equal(sm.spent, 15000); assert.equal(sm.projected, 15000 + 20000);
});
t('Kontostand-Prognose: Anker + Buchungen danach + offene Fixkosten − erwartete Ausgaben', () => {
  const recs = [rec({ name: 'Handy', day: 20, amounts: [{ from: '2026-01-01', amount: 2000 }] }), rec({ name: 'Abo', day: 5, amounts: [{ from: '2026-01-01', amount: 1000 }] })];
  const txs = [tx('2026-08-01', 92 * 500), tx('2026-11-07', 3000), tx('2026-11-08', 4000)];
  const balances = [{ id: 'a', date: '2026-11-01', amount: 100000 }, { id: 'b', date: '2026-11-07', amount: 90000 }];
  const e = c.expectedBalance({ balances, txs, recs }, '2026-11-10');
  assert.equal(e.anchor.id, 'b'); assert.equal(e.amount, 90000 - 4000); // 07.11. gilt als enthalten
  const f = c.forecastMonth({ txs, recs, balances, today: '2026-11-10', avgMonths: 3 });
  assert.equal(f.balance.today, 86000);
  assert.equal(f.balance.endWithoutVariable, 86000 - 2000);
  assert.equal(f.balance.end, 86000 - 2000 - 20 * 500);
  assert.equal(f.perDayAvailable, Math.floor(84000 / 21));
});
t('Wochen- und Monatsübersicht', () => {
  const recs = [rec({ day: 11 })];
  const txs = [tx('2026-11-09', 500), tx('2026-11-15', 700, 'buecher'), tx('2026-11-16', 900)];
  const w = c.weekSummary({ txs, recs }, '2026-11-12');
  assert.equal(w.from, '2026-11-09'); assert.equal(w.to, '2026-11-15');
  assert.equal(w.out, 1200); assert.equal(w.fixed.length, 1); assert.equal(w.fixed[0].date, '2026-11-11');
  const m = c.monthSummary({ txs, recs }, '2026-11-20');
  assert.equal(m.variable, 2100); assert.equal(m.fixed, 1000); assert.equal(m.byCat.buecher, 700);
});
t('Standardkategorien und Backup-Prüfung', () => {
  assert.equal(c.DEFAULT_CATEGORIES.length, 9);
  assert.equal(new Set(c.DEFAULT_CATEGORIES.map((x) => x.id)).size, 9);
  assert.throws(() => c.validateBackup({ app: 'tagesplan' }));
  assert.throws(() => c.validateBackup({ app: 'finanzplaner', version: 99, categories: [], txs: [], recs: [], balances: [] }));
  assert.ok(c.validateBackup({ app: 'finanzplaner', version: 1, categories: [], txs: [], recs: [], balances: [], meta: [] }));
});

console.log(`\n${n - failed}/${n} Tests bestanden`);
if (failed) process.exit(1);
