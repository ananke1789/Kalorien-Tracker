// Datentest Rezeptdatenbank + Logik: node tests/recipes.test.js
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as m from '../js/recipes/model.js';
import { entryValues, sumEntries } from '../js/util.js';

const recipes = JSON.parse(readFileSync(new URL('../data/recipes.json', import.meta.url)));
const ingredients = JSON.parse(readFileSync(new URL('../data/ingredients.json', import.meta.url)));
let n = 0;
const t = (name, fn) => { try { fn(); n++; } catch (e) { console.error('✗', name); throw e; } };

t('Vollständigkeit: 5 Stufen, Zutaten, Schritte, Dauer', () => {
  assert.equal(recipes.length, 90);
  for (const r of recipes) {
    assert.ok(r.minutes > 0 && r.steps.length >= 1, r.id);
    assert.equal(r.express, r.minutes <= 10, r.id + ' express');
    for (const l of m.LEVELS) assert.ok(r.levels[l] && r.levels[l].ingredients.length >= 1, `${r.id}/${l}`);
  }
});
t('Je Ernährungsform genau 5 Rezepte pro Mahlzeit', () => {
  for (const d of m.DIETS.filter((x) => x.id !== 'alle')) for (const s of m.SLOTS) {
    assert.equal(recipes.filter((r) => r.diet === d.id && r.slot === s.id).length, 5, `${d.id}/${s.id}`);
  }
});
t('Makros aus Zutaten nachgerechnet (Abweichung ≤ 1)', () => {
  for (const r of recipes) for (const l of m.LEVELS) {
    const c = m.computeMacros(r.levels[l], ingredients);
    assert.ok(c, `${r.id}: unbekannte Zutat`);
    for (const k of ['kcal', 'protein', 'fat', 'carbs']) assert.ok(Math.abs(c[k] - r.levels[l].macros[k]) <= 1, `${r.id}/${l}/${k}: ${c[k]} vs ${r.levels[l].macros[k]}`);
  }
});
t('Vegan/vegetarisch nur mit passenden Zutaten', () => {
  for (const r of recipes) for (const l of m.LEVELS) for (const ing of r.levels[l].ingredients) {
    if (r.vegan) assert.ok(ingredients[ing.key].vegan, `${r.id}: ${ing.key} nicht vegan`);
    if (r.vegetarisch) assert.ok(ingredients[ing.key].vegetarisch, `${r.id}: ${ing.key} nicht vegetarisch`);
  }
});
t('Alle Kombinationen Frühstück × Mittag × Abend je Stufe: Protein 120–190, Fett ≥ 60, kcal ±6 %', () => {
  const by = (s) => recipes.filter((r) => r.slot === s);
  const [F, M, A] = ['fruehstueck', 'mittag', 'abend'].map(by);
  for (const l of m.LEVELS) {
    let count = 0;
    for (const f of F) for (const mi of M) for (const a of A) {
      const s = ['kcal', 'protein', 'fat'].map((k) => f.levels[l].macros[k] + mi.levels[l].macros[k] + a.levels[l].macros[k]);
      assert.ok(Math.abs(s[0] - +l) <= +l * 0.06, `${l}: kcal ${s[0]} (${f.id},${mi.id},${a.id})`);
      assert.ok(s[1] >= 120 && s[1] <= 190, `${l}: Protein ${s[1]}`);
      assert.ok(s[2] >= 60, `${l}: Fett ${s[2]}`);
      count++;
    }
    assert.equal(count, 27000);
  }
});
t('Stufe zum kcal-Ziel, Filter, Sortierung', () => {
  assert.equal(m.levelForGoal(2900), '2900');
  assert.equal(m.levelForGoal(2400), '2250');
  assert.equal(m.levelForGoal(5000), '3200');
  assert.equal(m.filterRecipes(recipes, { slot: 'mittag', diet: 'vegan' }).length, 5);
  assert.equal(m.filterRecipes(recipes, { slot: 'fruehstueck' }).length, 30);
  const ex = m.filterRecipes(recipes, { express: true });
  assert.ok(ex.length > 0 && ex.every((r) => r.minutes <= 10));
  assert.deepEqual(m.filterRecipes(recipes, { onlyFavs: true, favs: ['std-f1', 'veg-a1'] }).map((r) => r.id).sort(), ['std-f1', 'veg-a1'].filter((id) => recipes.some((r) => r.id === id)).sort());
  const z = m.filterRecipes(recipes, { slot: 'abend', sort: 'zeit' });
  assert.ok(z.every((r, i) => !i || z[i - 1].minutes <= r.minutes));
});
t('Eintrag in Heute: Portionseintrag mit Stufen-Makros', () => {
  const r = recipes.find((x) => x.id === 'std-f1');
  const e = m.recipeEntry(r, '2600', { date: '2026-10-12', count: 2 });
  assert.equal(e.meal, 'breakfast');
  assert.equal(e.foodId, 'recipe:std-f1');
  const v = entryValues(e);
  assert.equal(v.kcal, 652 * 2); assert.equal(v.protein, 70);
  assert.equal(sumEntries([e, m.recipeEntry(r, '1750', { date: '2026-10-12', meal: 'snacks' })]).kcal, 1304 + 440);
});
t('Einkaufsliste: Zutaten über Rezepte und Portionen zusammengerechnet', () => {
  const byId = Object.fromEntries(recipes.map((r) => [r.id, r]));
  const plan = [{ recipeId: 'std-f1', level: '2600', portions: 2 }, { recipeId: 'std-f1', level: '1750', portions: 1 }];
  const l = m.shoppingList(plan, byId, ingredients);
  const skyr = l.items.find((i) => i.key === 'skyr');
  assert.equal(skyr.amount, 150 * 2 + 240); assert.equal(skyr.display, '540 g');
  assert.equal(l.items.find((i) => i.key === 'milch15').display, '275 ml');
  assert.deepEqual(l.spices, ['Zimt']);
  const names = l.items.map((i) => i.name);
  assert.deepEqual(names, [...names].sort((a, b) => a.localeCompare(b, 'de')));
  const txt = m.shoppingText(l, { skyr: true });
  assert.ok(!txt.includes('Skyr') && txt.includes('275 ml Milch 1,5 %') && txt.includes('Zimt'));
  // Stück-Zutaten
  const eggR = recipes.find((r) => r.levels['2600'].ingredients.some((i) => i.unit === 'Stück'));
  const egg = m.shoppingList([{ recipeId: eggR.id, level: '2600', portions: 3 }], byId, ingredients).items.find((i) => i.unit === 'Stück');
  assert.ok(egg.display.endsWith('Stück'));
});
t('Rezept-Verlauf aus Einträgen', () => {
  const r = recipes.find((x) => x.id === 'std-f1');
  const es = [
    m.recipeEntry(r, '2600', { date: '2026-10-10', now: 1 }),
    m.recipeEntry(r, '2900', { date: '2026-10-12', now: 2 }),
    { date: '2026-10-12', perPortion: { kcal: 100 }, count: 1 }, // normaler Eintrag, ignoriert
  ];
  const h = m.recipeHistory(es);
  assert.deepEqual(h.map((d) => d.date), ['2026-10-12', '2026-10-10']);
  assert.equal(h[0].items[0].level, '2900'); assert.equal(h[1].kcal, 652);
});
console.log(`OK: ${n} Rezept-Testgruppen bestanden (27.000 Kombinationen je Stufe geprüft)`);
