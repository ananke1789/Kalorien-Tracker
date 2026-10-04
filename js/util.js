// Reine Hilfsfunktionen: Zahlen, Datum, Nährwertberechnung (ohne DOM, testbar mit Node)

export const MEALS = [
  { id: 'breakfast', label: 'Frühstück' },
  { id: 'lunch', label: 'Mittagessen' },
  { id: 'dinner', label: 'Abendessen' },
  { id: 'snacks', label: 'Snacks' },
];
export const NUTRIENTS = ['kcal', 'protein', 'fat', 'carbs'];
export const NUTRIENT_LABEL = { kcal: 'Kalorien', protein: 'Protein', fat: 'Fett', carbs: 'Carbs' };
export const DEFAULT_GOALS = { kcal: 2900, protein: 125, fat: 65 };

// ---------- Zahlen ----------

// Akzeptiert "1,5", "1.5", " 12 " -> Zahl; ungültig -> NaN
export function parseNum(input) {
  if (typeof input === 'number') return input;
  if (input == null) return NaN;
  const s = String(input).trim().replace(/\s/g, '').replace(',', '.');
  if (s === '' || !/^[+-]?(\d+\.?\d*|\.\d+)$/.test(s)) return NaN;
  return parseFloat(s);
}

function group(intStr) {
  return intStr.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// Fixe Nachkommastellen mit Dezimalkomma und Tausenderpunkt
export function fmtNum(x, digits = 1) {
  if (!Number.isFinite(x)) return '–';
  const a = Math.round(Math.abs(x) * 10 ** digits + 1e-9) / 10 ** digits;
  const [i, d] = a.toFixed(digits).split('.');
  const sign = x < 0 && a !== 0 ? '−' : '';
  return sign + group(i) + (d ? ',' + d : '');
}
export const fmtKcal = (x) => fmtNum(x, 0);
export const fmtMacro = (x) => fmtNum(x, 1);
export const fmtVal = (key, x) => (key === 'kcal' ? fmtKcal(x) : fmtMacro(x));
export const unit = (key) => (key === 'kcal' ? 'kcal' : 'g');

// Für Eingabefelder: ohne Tausenderpunkt, unnötige Nullen weg
export function numToInput(x) {
  if (!Number.isFinite(x)) return '';
  return String(Math.round(x * 100) / 100).replace('.', ',');
}

// ---------- Datum (lokal, Schlüssel YYYY-MM-DD) ----------

const pad = (n) => String(n).padStart(2, '0');
export function dateKey(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
export function parseKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 12); // Mittag: robust gegen Zeitumstellung
}
export const todayKey = () => dateKey(new Date());
export function addDays(key, n) {
  const d = parseKey(key);
  d.setDate(d.getDate() + n);
  return dateKey(d);
}
export function fmtDate(key) {
  const [y, m, d] = key.split('-');
  return `${d}.${m}.${y}`;
}
export const WEEKDAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
export const WEEKDAYS_SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
// 0 = Montag ... 6 = Sonntag
export const weekdayIndex = (key) => (parseKey(key).getDay() + 6) % 7;
export const weekStart = (key) => addDays(key, -weekdayIndex(key));
export const weekDays = (key) => {
  const s = weekStart(key);
  return Array.from({ length: 7 }, (_, i) => addDays(s, i));
};
// ISO-Kalenderwoche
export function isoWeek(key) {
  const d = parseKey(key);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const jan4 = new Date(d.getFullYear(), 0, 4, 12);
  return 1 + Math.round(((d - jan4) / 864e5 - 3 + ((jan4.getDay() + 6) % 7)) / 7);
}
export function relDayLabel(key) {
  const t = todayKey();
  if (key === t) return 'Heute';
  if (key === addDays(t, -1)) return 'Gestern';
  if (key === addDays(t, 1)) return 'Morgen';
  return WEEKDAYS[weekdayIndex(key)];
}
export function daysBetween(a, b) {
  return Math.round((parseKey(b) - parseKey(a)) / 864e5);
}

// ---------- Nährwerte ----------

export const zero = () => ({ kcal: 0, protein: 0, fat: 0, carbs: 0 });

// Nährwerte für eine Grammmenge aus Werten pro 100 g
export function scale(per100, grams) {
  const f = grams / 100;
  const r = zero();
  for (const k of NUTRIENTS) r[k] = (Number(per100[k]) || 0) * f;
  return r;
}
export const entryValues = (e) => scale(e.per100, e.grams);

export function sum(list) {
  const r = zero();
  for (const v of list) for (const k of NUTRIENTS) r[k] += v[k] || 0;
  return r;
}
export const sumEntries = (entries) => sum(entries.map(entryValues));

// Gramm aus Portion x Anzahl
export const portionGrams = (portionG, count) => portionG * count;

// Carbs-Ziel als Rest: (kcal - 4*Protein - 9*Fett) / 4, nicht negativ
export function carbGoal(g) {
  return Math.max(0, (g.kcal - 4 * g.protein - 9 * g.fat) / 4);
}
export function fullGoals(g) {
  return { kcal: g.kcal, protein: g.protein, fat: g.fat, carbs: carbGoal(g) };
}

// Plausibilität: kcal vs. 4*P + 4*C + 9*F
export function plausibility(f) {
  const calc = 4 * f.protein + 4 * f.carbs + 9 * f.fat;
  const diff = f.kcal - calc;
  const tol = Math.max(20, calc * 0.15);
  return { calc, diff, ok: Math.abs(diff) <= tol };
}

export const MIN_GOALS = ['protein', 'fat']; // Mindestziele
export const OVER_FACTOR = 1.1; // ab 10 % über Ziel: dezent markieren
export const KCAL_REACHED = 0.9; // ab 90 % gilt Kalorienziel als erreicht

// Status pro Wert: 'open' | 'met' | 'exceeded' (Mindestziel übertroffen) | 'over' (Zielwert deutlich überschritten)
export function goalStatus(key, ist, ziel) {
  if (MIN_GOALS.includes(key)) {
    if (ist > ziel + 0.05) return 'exceeded';
    return ist >= ziel - 0.05 ? 'met' : 'open';
  }
  if (ziel > 0 && ist > ziel * OVER_FACTOR) return 'over';
  if (key === 'kcal' ? ist >= ziel * KCAL_REACHED : ist >= ziel - 0.05) return 'met';
  return 'open';
}

// "Plan erfüllt": Protein und Fett erreicht, Kalorien zwischen 90 % und 110 %
export function planFulfilled(tot, goals) {
  const g = fullGoals(goals);
  return (
    tot.protein >= g.protein - 0.05 &&
    tot.fat >= g.fat - 0.05 &&
    tot.kcal >= g.kcal * KCAL_REACHED &&
    tot.kcal <= g.kcal * OVER_FACTOR
  );
}

// ---------- Sonstiges ----------

const collator = new Intl.Collator('de', { sensitivity: 'base', numeric: true });
export const compareDe = (a, b) => collator.compare(a, b);
export const sortFoods = (foods) => [...foods].sort((a, b) => compareDe(a.name, b.name));

// Anfangsbuchstabe für A–Z (Umlaute zu Grundbuchstaben, Rest "#")
export function letterOf(name) {
  const c = (name || '').trim().charAt(0).toUpperCase();
  const map = { Ä: 'A', Ö: 'O', Ü: 'U', ß: 'S' };
  const l = map[c] || c.normalize('NFD').charAt(0);
  return /[A-Z]/.test(l) ? l : '#';
}

export const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}
