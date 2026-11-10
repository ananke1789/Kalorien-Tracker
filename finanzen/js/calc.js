// Reine Rechenfunktionen (ohne DOM, mit Node testbar).
// Beträge immer in Cent (Ganzzahl), Datumsschlüssel 'YYYY-MM-DD' (lokal).

export const DEFAULT_CATEGORIES = [
  { id: 'restaurant', name: 'Restaurant & Imbiss' },
  { id: 'amazon-uni', name: 'Amazon Uni & Arbeit' },
  { id: 'amazon-spass', name: 'Amazon Spaß' },
  { id: 'kleidung', name: 'Kleidung' },
  { id: 'online', name: 'Sonstige Online-Einkäufe' },
  { id: 'supermarkt', name: 'Supermarkt' },
  { id: 'fitness', name: 'Fitness & Supplements' },
  { id: 'buecher', name: 'Bücher' },
  { id: 'offline', name: 'Sonstige Offline-Einkäufe' },
].map((c, i) => ({ ...c, order: i, budget: 0, archived: false }));

export const FIXED_GROUPS = ['Wohnen', 'Abos & Streaming', 'Versicherungen', 'Handy & Internet', 'Mobilität', 'Sparen & Anlegen', 'Sonstiges'];
export const INCOME_GROUPS = ['Gehalt', 'BAföG & Unterstützung', 'Sonstiges'];
export const INTERVALS = [
  { months: 1, name: 'monatlich' },
  { months: 3, name: 'vierteljährlich' },
  { months: 6, name: 'halbjährlich' },
  { months: 12, name: 'jährlich' },
];
export const DEFAULT_SETTINGS = { avgMonths: 3 };

// ---------- Geld ----------
// "12,50" / "12.5" / "1.234,56" -> 1250 / 1250 / 123456; ungültig -> NaN
export function parseMoney(s) {
  if (typeof s === 'number') return Math.round(s * 100);
  let t = String(s ?? '').trim().replace(/\s|€/g, '');
  if (!t) return NaN;
  const neg = t.startsWith('-');
  if (neg) t = t.slice(1);
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.'); // deutsches Format
  else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, ''); // "1.234" = Tausenderpunkt
  if (!/^\d+(\.\d{0,2})?$/.test(t)) return NaN;
  const v = Math.round(parseFloat(t) * 100);
  return neg ? -v : v;
}
const fmtNum = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtNum0 = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 });
export const money = (c, { sign = false, round = false } = {}) => {
  const v = Math.round(c || 0) / 100;
  const s = (round ? fmtNum0 : fmtNum).format(Math.abs(round ? Math.round(v) : v));
  const pre = v < 0 ? '−' : sign && v > 0 ? '+' : '';
  return `${pre}${s} €`;
};
export const moneyInput = (c) => (c == null || c === '' ? '' : (c / 100).toFixed(2).replace('.', ','));

// ---------- Datum ----------
const pad = (n) => String(n).padStart(2, '0');
export const keyOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseKey = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
export const todayKey = () => keyOf(new Date());
export const addDays = (k, n) => { const d = parseKey(k); d.setDate(d.getDate() + n); return keyOf(d); };
export const daysInMonth = (y, m0) => new Date(y, m0 + 1, 0).getDate();
export const monthStart = (k) => k.slice(0, 8) + '01';
export const monthEnd = (k) => { const d = parseKey(k); return keyOf(new Date(d.getFullYear(), d.getMonth() + 1, 0)); };
export const addMonths = (k, n) => { // auf 1. des Monats
  const d = parseKey(k); return keyOf(new Date(d.getFullYear(), d.getMonth() + n, 1));
};
export const weekStart = (k) => { const d = parseKey(k); const wd = (d.getDay() + 6) % 7; d.setDate(d.getDate() - wd); return keyOf(d); };
export const daysBetween = (a, b) => Math.round((parseKey(b) - parseKey(a)) / 86400000); // b - a
export const isoWeek = (k) => {
  const d = parseKey(k); d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const w1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d - w1) / 86400000 - 3 + ((w1.getDay() + 6) % 7)) / 7);
};
const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const WD = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
export const monthName = (k) => `${MONTHS[parseKey(k).getMonth()]} ${k.slice(0, 4)}`;
export const monthShort = (k) => MONTHS[parseKey(k).getMonth()].slice(0, 3);
export const dayLabel = (k) => { const d = parseKey(k); return `${WD[d.getDay()]}, ${d.getDate()}.${d.getMonth() + 1}.`; };
export const shortDate = (k) => { const d = parseKey(k); return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`; };

// ---------- Wiederkehrende Zahlungen ----------
// rec: { id, name, type:'out'|'in', every:1|3|6|12, day:1..31, start:'YYYY-MM-DD', end?:'YYYY-MM-DD'|'',
//        amounts:[{from:'YYYY-MM-DD', amount}] }  (Betragsänderungen gelten ab 'from', Historie bleibt)
export function amountAt(rec, date) {
  const list = [...(rec.amounts || [])].sort((a, b) => (a.from < b.from ? -1 : 1));
  let a = list.length ? list[0].amount : 0;
  for (const x of list) if (x.from <= date) a = x.amount;
  return a;
}
export const currentAmount = (rec, date = todayKey()) => amountAt(rec, date);

// Fälligkeiten im Bereich [from, to] (inklusive) -> [{date, amount, rec}]
export function occurrences(rec, from, to) {
  const out = [];
  if (!rec || rec.paused) return out;
  const every = Math.max(1, rec.every || 1);
  const s = parseKey(rec.start);
  let y = s.getFullYear(), m = s.getMonth();
  // vorspulen bis in die Nähe von 'from'
  const f = parseKey(from);
  const gap = (f.getFullYear() - y) * 12 + (f.getMonth() - m);
  if (gap > every) { const n = Math.floor(gap / every) - 1; m += n * every; y += Math.floor(m / 12); m = ((m % 12) + 12) % 12; }
  for (let guard = 0; guard < 2000; guard++) {
    const day = Math.min(rec.day || s.getDate(), daysInMonth(y, m));
    const k = `${y}-${pad(m + 1)}-${pad(day)}`;
    if (k > to || (rec.end && k > rec.end)) break;
    if (k >= from && k >= rec.start) out.push({ date: k, amount: amountAt(rec, k), rec });
    m += every; y += Math.floor(m / 12); m %= 12;
  }
  return out;
}
// Summe aller Fälligkeiten eines Typs im Bereich
export function recurringSum(recs, from, to, type) {
  let s = 0;
  for (const r of recs) if (r.type === type) for (const o of occurrences(r, from, to)) s += o.amount;
  return s;
}
// Monatlicher Durchschnitt (z. B. jährliche Zahlung / 12)
export const monthlyEquivalent = (rec, date = todayKey()) => Math.round(amountAt(rec, date) / Math.max(1, rec.every || 1));

// ---------- Einzelzahlungen ----------
// tx: { id, date, amount, type:'out'|'in', catId, note }
export const inRange = (txs, from, to) => txs.filter((t) => t.date >= from && t.date <= to);
export function sumTx(txs, type) { let s = 0; for (const t of txs) if (t.type === type) s += t.amount; return s; }
export function byCategory(txs) {
  const m = {};
  for (const t of txs) if (t.type === 'out') m[t.catId] = (m[t.catId] || 0) + t.amount;
  return m;
}

// Durchschnittliche variable Ausgaben pro Tag.
// Basis: die letzten `months` vollständigen Monate vor dem aktuellen Monat (ab dem ersten Eintrag).
// Gibt es dort weniger als 14 Tage Daten, zählt zusätzlich der laufende Monat bis gestern bzw. heute.
export function averageSpending(txs, today, months = 3) {
  const outs = txs.filter((t) => t.type === 'out');
  const first = outs.reduce((m, t) => (m && m < t.date ? m : t.date), null);
  const empty = { perDay: 0, perCat: {}, from: null, to: null, days: 0, basis: 'none' };
  if (!first || first > today) return empty;
  let from = addMonths(monthStart(today), -months);
  let to = addDays(monthStart(today), -1);
  let basis = 'months';
  if (first > from) from = first;
  if (from > to || daysBetween(from, to) + 1 < 14) { // zu wenig Historie -> bis heute mitnehmen
    to = today; basis = 'short';
    if (first > from) from = first;
  }
  const days = daysBetween(from, to) + 1;
  const sel = inRange(outs, from, to);
  const cats = byCategory(sel);
  const perCat = {};
  for (const [k, v] of Object.entries(cats)) perCat[k] = v / days;
  return { perDay: sumTx(sel, 'out') / days, perCat, from, to, days, basis };
}

// Kontostand: letzter eingetragener Stand bis einschließlich `date`
export function anchorBalance(balances, date) {
  let best = null;
  for (const b of balances) if (b.date <= date && (!best || b.date > best.date || (b.date === best.date && (b.at || 0) > (best.at || 0)))) best = b;
  return best;
}
// Erwarteter Kontostand am Ende von `date` (Anker + alle Buchungen danach bis date). null ohne Anker.
export function expectedBalance({ balances, txs, recs }, date) {
  const a = anchorBalance(balances, date);
  if (!a) return null;
  const from = addDays(a.date, 1);
  if (from > date) return { amount: a.amount, anchor: a };
  const sel = inRange(txs, from, date);
  const delta = sumTx(sel, 'in') - sumTx(sel, 'out') + recurringSum(recs, from, date, 'in') - recurringSum(recs, from, date, 'out');
  return { amount: a.amount + delta, anchor: a };
}

// Prognose für den Monat, in dem `today` liegt.
export function forecastMonth({ txs, recs, balances = [], categories = [], today, avgMonths = 3 }) {
  const from = monthStart(today), to = monthEnd(today);
  const avg = averageSpending(txs, today, avgMonths);
  const month = inRange(txs, from, to);
  const tomorrow = addDays(today, 1);
  const daysLeft = Math.max(0, daysBetween(today, to)); // Tage nach heute
  const daysLeftIncl = daysLeft + 1;

  const incomeRec = recurringSum(recs, from, to, 'in');
  const fixed = recurringSum(recs, from, to, 'out');
  const fixedOpen = tomorrow <= to ? recurringSum(recs, tomorrow, to, 'out') : 0;
  const incomeOpen = tomorrow <= to ? recurringSum(recs, tomorrow, to, 'in') : 0;
  const incomeOnce = sumTx(month, 'in');
  const income = incomeRec + incomeOnce;
  const spent = sumTx(month, 'out');
  const expectedRest = Math.round(avg.perDay * daysLeft);
  const variable = spent + expectedRest;
  const net = income - fixed - variable;

  const spentCat = byCategory(month);
  const cats = categories.map((c) => {
    const s = spentCat[c.id] || 0;
    const proj = s + Math.round((avg.perCat[c.id] || 0) * daysLeft);
    return { cat: c, spent: s, projected: proj, avgMonth: Math.round((avg.perCat[c.id] || 0) * daysInMonth(+today.slice(0, 4), +today.slice(5, 7) - 1)), budget: c.budget || 0 };
  });

  // Kontostand-Prognose (nur mit eingetragenem Kontostand)
  let balance = null;
  const now = expectedBalance({ balances, txs, recs }, today);
  if (now) {
    const futureTx = tomorrow <= to ? inRange(txs, tomorrow, to) : [];
    const endNoVar = now.amount + incomeOpen - fixedOpen + sumTx(futureTx, 'in') - sumTx(futureTx, 'out');
    balance = { today: now.amount, anchor: now.anchor, end: endNoVar - expectedRest, endWithoutVariable: endNoVar };
  }
  // Frei verfügbar pro Tag bis Monatsende (inkl. heute)
  const available = balance ? balance.endWithoutVariable : income - fixed - spent;
  const perDayAvailable = Math.floor(available / daysLeftIncl);

  return { from, to, avg, income, incomeRec, incomeOnce, fixed, fixedOpen, incomeOpen, spent, expectedRest, variable, net, cats, balance, daysLeft, available, perDayAvailable };
}

// Monatsübersicht (für Auswertung): Ist-Werte eines Monats
export function monthSummary({ txs, recs }, anyDayInMonth) {
  const from = monthStart(anyDayInMonth), to = monthEnd(anyDayInMonth);
  const month = inRange(txs, from, to);
  const income = recurringSum(recs, from, to, 'in') + sumTx(month, 'in');
  const fixed = recurringSum(recs, from, to, 'out');
  const variable = sumTx(month, 'out');
  return { from, to, income, fixed, variable, net: income - fixed - variable, byCat: byCategory(month) };
}

// Wochenübersicht
export function weekSummary({ txs, recs }, anyDay) {
  const from = weekStart(anyDay), to = addDays(from, 6);
  const sel = inRange(txs, from, to);
  return {
    from, to, txs: sel, out: sumTx(sel, 'out'), in: sumTx(sel, 'in'), byCat: byCategory(sel),
    fixed: recs.flatMap((r) => occurrences(r, from, to)).sort((a, b) => (a.date < b.date ? -1 : 1)),
  };
}

// ---------- Backup ----------
export const BACKUP_VERSION = 1;
export function validateBackup(data) {
  if (!data || data.app !== 'finanzplaner') throw new Error('Keine Finanzplaner-Sicherung');
  if ((data.version || 0) > BACKUP_VERSION) throw new Error('Sicherung stammt aus einer neueren App-Version');
  for (const k of ['categories', 'txs', 'recs', 'balances']) if (!Array.isArray(data[k])) throw new Error('Sicherung unvollständig: ' + k);
  return data;
}

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
