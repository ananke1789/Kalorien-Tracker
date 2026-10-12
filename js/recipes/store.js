// Rezeptdaten laden (statisch, offline gecacht) und Nutzer-Einstellungen in "meta" speichern
import * as db from '../db.js';
import { state } from '../core.js';
import { levelForGoal } from './model.js';

export const rstate = { recipes: [], byId: {}, ingredients: {}, loaded: false, prefs: null, favs: [], plan: [], checked: {} };

const DEFAULT_PREFS = () => ({ level: levelForGoal(state.goals?.kcal || 2900), slot: null, diet: 'alle', express: false, onlyFavs: false, sort: 'az' });

export async function loadRecipes() {
  if (!rstate.loaded) {
    const [r, i] = await Promise.all([fetch('data/recipes.json').then((x) => x.json()), fetch('data/ingredients.json').then((x) => x.json())]);
    rstate.recipes = r;
    rstate.byId = Object.fromEntries(r.map((x) => [x.id, x]));
    rstate.ingredients = i;
    rstate.loaded = true;
  }
  const [prefs, favs, shop] = await Promise.all([db.getMeta('recipePrefs'), db.getMeta('recipeFavs', []), db.getMeta('shoppingList', { plan: [], checked: {} })]);
  rstate.prefs = { ...DEFAULT_PREFS(), ...(prefs || {}) };
  rstate.favs = favs;
  rstate.plan = shop.plan || [];
  rstate.checked = shop.checked || {};
  return rstate;
}

export const savePrefs = () => db.setMeta('recipePrefs', rstate.prefs);
export async function toggleFav(id) {
  rstate.favs = rstate.favs.includes(id) ? rstate.favs.filter((x) => x !== id) : [...rstate.favs, id];
  await db.setMeta('recipeFavs', rstate.favs);
  return rstate.favs.includes(id);
}
export const saveShopping = () => db.setMeta('shoppingList', { plan: rstate.plan, checked: rstate.checked });
