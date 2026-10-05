// Trainingsdaten in IndexedDB: Katalog, Pläne, Trainings, laufendes Training
import * as db from '../db.js';
import { DEFAULT_EXERCISES } from './catalog.js';
import { DEFAULT_PLANS } from './plans.js';
import { clone, sortHistory } from './model.js';

export const tstate = { catalog: [], plans: [], history: [] };

// Standarddaten ergänzen, ohne Änderungen des Nutzers zu überschreiben
export async function loadTraining() {
  let [ex, plans, workouts] = await Promise.all([db.getAll('exercises'), db.getAll('plans'), db.getAll('workouts')]);
  const missingEx = DEFAULT_EXERCISES.filter((d) => !ex.some((x) => x.id === d.id)).map((d) => ({ ...clone(d), builtin: true }));
  const missingPlans = DEFAULT_PLANS.filter((d) => !plans.some((x) => x.id === d.id)).map((d) => ({ ...clone(d), builtin: true }));
  if (missingEx.length) { await db.putMany('exercises', missingEx); ex = ex.concat(missingEx); }
  if (missingPlans.length) { await db.putMany('plans', missingPlans); plans = plans.concat(missingPlans); }
  const order = DEFAULT_PLANS.map((p) => p.id);
  tstate.catalog = ex;
  tstate.plans = plans.sort((a, b) => ((order.indexOf(a.id) + 1 || 99) - (order.indexOf(b.id) + 1 || 99)) || a.name.localeCompare(b.name, 'de'));
  tstate.history = sortHistory(workouts);
  return tstate;
}

export const planById = (id) => tstate.plans.find((p) => p.id === id);
export const exById = (id) => tstate.catalog.find((x) => x.id === id);

export async function saveExercise(ex) { await db.put('exercises', ex); await loadTraining(); }
export async function savePlan(plan) { await db.put('plans', plan); await loadTraining(); }
export async function resetPlan(id) {
  const d = DEFAULT_PLANS.find((p) => p.id === id);
  if (d) await savePlan({ ...clone(d), builtin: true });
}

// laufendes Training (genau eins)
export const getActive = async () => (await db.get('active', 'current'))?.workout || null;
export async function saveActive(w) { w.updatedAt = Date.now(); await db.put('active', { id: 'current', workout: w }); }
export const clearActive = () => db.del('active', 'current');

export async function finishWorkout(w) {
  const done = { ...w, status: 'done', finishedAt: w.finishedAt || Date.now() };
  await db.put('workouts', done);
  await clearActive();
  await loadTraining();
  return done;
}
export async function saveWorkout(w) { await db.put('workouts', w); await loadTraining(); }
export async function deleteWorkout(id) { await db.del('workouts', id); await loadTraining(); }
