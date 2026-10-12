// Rezeptdatenbank: reine Logik (Filter, Stufen, Eintrag, Einkaufsliste, Verlauf) – mit Node testbar
import { compareDe, norm, uid } from '../util.js';

export const LEVELS = ['1750', '2250', '2600', '2900', '3200'];
export const SLOTS = [
  { id: 'fruehstueck', label: 'Frühstück', meal: 'breakfast' },
  { id: 'mittag', label: 'Mittagessen', meal: 'lunch' },
  { id: 'abend', label: 'Abendessen', meal: 'dinner' },
];
export const DIETS = [
  { id: 'alle', label: 'Alle' },
  { id: 'standard', label: 'Standard' },
  { id: 'vegetarisch', label: 'Vegetarisch' },
  { id: 'vegan', label: 'Vegan' },
  { id: 'lowcarb', label: 'Low Carb' },
  { id: 'keto', label: 'Ketogen' },
  { id: 'raypeat', label: 'Ray Peat' },
];
export const dietLabel = (id) => DIETS.find((d) => d.id === id)?.label || id;
export const slotOfMeal = (meal) => SLOTS.find((s) => s.meal === meal)?.id || null;
export const mealOfSlot = (slot) => SLOTS.find((s) => s.id === slot)?.meal || 'snacks';

// Stufe, die dem kcal-Ziel am nächsten liegt (bei Gleichstand die niedrigere)
export function levelForGoal(kcal) {
  let best = LEVELS[0];
  for (const l of LEVELS) if (Math.abs(+l - kcal) < Math.abs(+best - kcal)) best = l;
  return best;
}

export const macrosOf = (recipe, level) => recipe.levels[level].macros;

// Filter: { slot, diet ('alle'|…), express, favs (Set|Array), onlyFavs, q, sort ('az'|'zeit') }
export function filterRecipes(recipes, f = {}) {
  const favs = new Set(f.favs || []);
  const list = recipes.filter((r) => (!f.slot || r.slot === f.slot)
    && (!f.diet || f.diet === 'alle' || r.diet === f.diet)
    && (!f.express || r.express)
    && (!f.onlyFavs || favs.has(r.id))
    && (!f.q || norm(r.name).includes(norm(f.q))));
  return list.sort(f.sort === 'zeit' ? (a, b) => a.minutes - b.minutes || compareDe(a.name, b.name) : (a, b) => compareDe(a.name, b.name));
}

// Eintrag für "Heute" (Portionseintrag mit Snapshot der Stufen-Makros)
export function recipeEntry(recipe, level, { date, meal, count = 1, now = Date.now() }) {
  const m = macrosOf(recipe, level);
  return {
    id: uid(), date, meal: meal || mealOfSlot(recipe.slot),
    foodId: 'recipe:' + recipe.id, foodName: recipe.name,
    perPortion: { kcal: m.kcal, fat: m.fat, carbs: m.carbs, protein: m.protein },
    portionName: `1 Portion · Stufe ${level}`, count,
    recipeId: recipe.id, recipeLevel: level, createdAt: now,
  };
}

// Einkaufsliste: plan = [{ id, recipeId, level, portions }] -> Zutaten zusammengerechnet
export function shoppingList(plan, recipesById, ingredients) {
  const items = {};
  const spices = new Set();
  for (const p of plan) {
    const r = recipesById[p.recipeId];
    if (!r || !r.levels[p.level]) continue;
    const n = p.portions || 1;
    for (const ing of r.levels[p.level].ingredients) {
      const it = (items[ing.key] ||= { key: ing.key, name: ingredients[ing.key]?.name || ing.name, unit: ing.unit, amount: 0, grams: 0, recipes: new Set() });
      it.amount += ing.amount * n;
      it.grams += ing.grams * n;
      it.recipes.add(r.name);
    }
    (r.spices || '').split(',').map((x) => x.trim()).filter(Boolean).forEach((x) => spices.add(x));
  }
  const list = Object.values(items).map((it) => ({ ...it, recipes: [...it.recipes], display: amountText(it) }))
    .sort((a, b) => compareDe(a.name, b.name));
  return { items: list, spices: [...spices].sort(compareDe) };
}

export function amountText(it) {
  const a = Math.round(it.amount * 10) / 10;
  const s = String(a).replace('.', ',');
  if (it.unit === 'Stück') return `${s} Stück`;
  return `${s} ${it.unit}`;
}

// Einkaufsliste als Text (zum Teilen/Kopieren)
export function shoppingText(list, checked = {}) {
  const lines = list.items.filter((it) => !checked[it.key]).map((it) => `• ${it.display} ${it.name}`);
  if (list.spices.length) lines.push('', 'Gewürze/nach Geschmack: ' + list.spices.join(', '));
  return lines.join('\n');
}

// Rezept-Verlauf aus Einträgen: [{ date, items: [{ recipeId, name, level, meal, count, kcal }], kcal }]
export function recipeHistory(entries) {
  const byDate = {};
  for (const e of entries) {
    if (!e.recipeId) continue;
    const d = (byDate[e.date] ||= { date: e.date, items: [], kcal: 0 });
    const kcal = (e.perPortion?.kcal || 0) * (e.count || 1);
    d.items.push({ recipeId: e.recipeId, name: e.foodName, level: e.recipeLevel, meal: e.meal, count: e.count || 1, kcal, createdAt: e.createdAt || 0 });
    d.kcal += kcal;
  }
  return Object.values(byDate).sort((a, b) => (a.date < b.date ? 1 : -1))
    .map((d) => ({ ...d, items: d.items.sort((a, b) => a.createdAt - b.createdAt) }));
}

// Makros aus Zutaten neu berechnen (für den Datentest)
export function computeMacros(levelData, ingredients) {
  const r = { kcal: 0, protein: 0, fat: 0, carbs: 0 };
  for (const ing of levelData.ingredients) {
    const x = ingredients[ing.key];
    if (!x) return null;
    for (const k of Object.keys(r)) r[k] += (x[k] * ing.grams) / 100;
  }
  return r;
}
