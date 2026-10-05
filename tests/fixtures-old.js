// Testdaten im alten Format (Phase 1: Lebensmittel mit portions[] in Gramm, Backup version 1)
const today = (() => { const d = new Date(); const p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; })();
export const OLD_FOODS = [
  { id: 'brot', name: 'Brot', kcal: 220, protein: 7.5, fat: 1.6, carbs: 41, portions: [{ name: '1 Scheibe', grams: 50 }, { name: '1 Brötchen', grams: 80 }], createdAt: 1, updatedAt: 1 },
  { id: 'apfel', name: 'Apfel', kcal: 52, protein: 0.3, fat: 0.2, carbs: 12, portions: [], createdAt: 1, updatedAt: 1 },
  { id: 'riegel', name: 'Riegel', kcal: 387, protein: 33.3, fat: 15.5, carbs: 30, portions: [{ name: '1 Riegel', grams: 45 }], createdAt: 1, updatedAt: 1 },
];
export const OLD_ENTRIES = [
  { id: 'e1', date: today, meal: 'breakfast', foodId: 'brot', foodName: 'Brot', per100: { kcal: 220, protein: 7.5, fat: 1.6, carbs: 41 }, grams: 100, portion: { name: '1 Scheibe', grams: 50, count: 2 }, createdAt: 1 },
  { id: 'e2', date: today, meal: 'snacks', foodId: 'riegel', foodName: 'Riegel', per100: { kcal: 387, protein: 33.3, fat: 15.5, carbs: 30 }, grams: 90, portion: { name: '1 Riegel', grams: 45, count: 2 }, createdAt: 2 },
];
export const OLD_KCAL_TODAY = '568'; // 220 + 348,3
export const OLD_BACKUP = { app: 'Tagesplan', version: 1, exportedAt: new Date().toISOString(), foods: OLD_FOODS, entries: OLD_ENTRIES, meta: [{ key: 'goals', value: { kcal: 2500, protein: 140, fat: 70 } }] };
