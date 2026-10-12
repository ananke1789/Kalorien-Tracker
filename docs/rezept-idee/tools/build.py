import json, itertools, math
import numpy as np
from data_db import DB, PIECE, LIQUID, STEP10
from data_recipes import RECIPES

LEVELS = [1750, 2250, 2600, 2900, 3200]
SLOTS = ['fruehstueck', 'mittag', 'abend']
KCAL_SHARE = {'fruehstueck': 0.25, 'mittag': 0.375, 'abend': 0.375}
PROT = {'fruehstueck': 35, 'mittag': 55, 'abend': 55}            # konstant über alle Stufen -> 145 g/Tag
FAT_DAY = {1750: 66, 2250: 76, 2600: 86, 2900: 96, 3200: 106}    # Standard/Veg/Vegan/Peat (Minimum 60)
FAT_SPLIT = {'fruehstueck': 0.25, 'mittag': 0.42, 'abend': 0.33}
FAT_MIN_SLOT = {'fruehstueck': 15.0, 'mittag': 25.0, 'abend': 20.0}  # Summe = 60 g Tagesminimum
MAXG = {'orangensaft': 500, 'kartoffeln': 900, 'suesskartoffel': 700, 'reis': 200, 'vollkornnudeln': 180, 'linsennudeln': 150,
        'quinoa': 180, 'masa': 180, 'haferflocken': 140, 'vollkornbrot': 280, 'mango': 350, 'ananas': 400, 'honig': 50,
        'heidelbeeren': 300, 'himbeeren': 300, 'banane': 220, 'chiasamen': 40, 'leinsamen': 30, 'walnuesse': 60, 'mandeln': 60,
        'kokosraspeln': 40, 'erdnussmus': 40, 'tahin': 40, 'mandelmus': 40, 'butter': 50, 'olivenoel': 50, 'kokosoel': 40,
        'leinoel': 40, 'sahne': 250, 'kokosmilch': 400, 'avocado': 250, 'griech_joghurt': 250, 'frischkaese': 120,
        'kidney': 300, 'kichererbsen': 300, 'bacon': 70, 'feta': 100, 'hanfsamen': 40, 'erbsen': 200}
X_SCALE = {1750: 0.75, 2250: 0.9, 2600: 1.0, 2900: 1.0, 3200: 1.0}
LC_CARB_PCT = 0.15
LC_SPLIT = {'fruehstueck': 0.25, 'mittag': 0.30, 'abend': 0.45}

def macros(amounts):
    k = p = c = f = 0.0
    for key, g in amounts.items():
        n, kc, pp, cc, ff, _ = DB[key]
        k += kc * g / 100; p += pp * g / 100; c += cc * g / 100; f += ff * g / 100
    return dict(kcal=k, p=p, c=c, f=f)

def grams(key, amt):  # Rezeptangabe -> Gramm
    return amt * PIECE[key] if key in PIECE else amt

def step(key):
    if key in PIECE: return PIECE[key]
    return 10 if key in STEP10 else 5

def targets(r, L):
    s = r['slot']
    t = dict(kcal=KCAL_SHARE[s] * L, p=PROT[s])
    if r['diet'] == 'lowcarb':
        t['c'] = L * LC_CARB_PCT / 4 * LC_SPLIT[s]
    elif r['diet'] == 'keto':
        pass
    else:
        t['f'] = FAT_DAY[L] * FAT_SPLIT[s]
    return t

def solve(r, L):
    t = targets(r, L)
    groups = {g: {} for g in 'PCFX'}
    for key, amt, role in r['ings']:
        g = grams(key, amt)
        if role == 'X' and key not in PIECE:
            g = round(g * X_SCALE[L] / 5) * 5
        groups[role][key] = g
    gm = {g: macros(a) for g, a in groups.items()}
    third = 'c' if 'c' in t else ('f' if 'f' in t else None)
    def try_solve(var):
        rows = ['kcal', 'p'] + ([third] if third and len(var) == 3 else [])
        A = np.array([[gm[g][m] for g in var] for m in rows])
        b = np.array([t[m] - gm['X'][m] for m in rows])
        if len(var) > len(rows):
            return None
        try:
            return dict(zip(var, np.linalg.solve(A, b)))
        except np.linalg.LinAlgError:
            return None
    from scipy.optimize import lsq_linear
    var = [g for g in 'PCF' if groups[g]]
    rows = ['kcal', 'p'] + ([third] if third else [])
    w = {'kcal': 1/(0.01*t['kcal']), 'p': 1/1.5, 'c': 0.4/4, 'f': 0.4/3}
    A = np.array([[gm[g][m]*w[m] for g in var] for m in rows])
    b = np.array([(t[m]-gm['X'][m])*w[m] for m in rows])
    lb = [{'P': 0.5, 'C': 0.35, 'F': 0.0}[g] for g in var]
    res = lsq_linear(A, b, bounds=(lb, [3.5]*len(var)))
    sol = dict(zip(var, res.x))
    # Startmengen
    amounts = {}
    for g in 'PCF':
        for k, v in groups[g].items():
            amounts[k] = max(0.0, v * sol.get(g, 1.0))
    for k, v in groups['X'].items():
        amounts[k] = v
    ideal_am = dict(amounts)
    # Runden
    adj = [k for g in 'PCF' for k in groups[g]]
    mins = {}
    for k in adj:
        st = step(k)
        if k in groups['C']: mins[k] = max(st, round(0.35 * groups['C'][k] / st) * st)
        elif k in groups['P']: mins[k] = max(st, round(0.5 * groups['P'][k] / st) * st)
        else: mins[k] = 0
        amounts[k] = min(MAXG.get(k, 10**6), max(mins[k], round(amounts[k] / st) * st))
    # Greedy-Feintuning
    fmin = FAT_MIN_SLOT[r['slot']]
    def err(am):
        m = macros(am)
        e = ((m['kcal'] - t['kcal']) / (0.015 * t['kcal'])) ** 2 + ((m['p'] - t['p']) / 2.0) ** 2
        if third == 'f': e += 0.3 * ((m['f'] - t['f']) / 3) ** 2
        if third == 'c': e += 0.3 * ((m['c'] - t['c']) / 4) ** 2
        if m['f'] < fmin: e += 50 + 20 * (fmin - m['f']) ** 2
        # Form-Strafe: Zutaten einer Gruppe sollen proportional skaliert bleiben
        for k in adj:
            ideal = ideal_am[k]
            e += 0.15 * ((am[k] - ideal) / (0.35 * ideal + 2 * step(k))) ** 2
        return e
    cur = err(amounts)
    for _ in range(1500):
        best = (cur, None)
        for k in adj:
            st = step(k)
            for d in (-st, st):
                na = amounts[k] + d
                if na < mins[k] or na > MAXG.get(k, 10**6): continue
                trial = dict(amounts); trial[k] = na
                e = err(trial)
                if e < best[0] - 1e-9: best = (e, (k, na))
        if best[1] is None:
            # Paar-Züge (eine Zutat rauf, andere runter), um lokale Minima zu verlassen
            for k1 in adj:
                for k2 in adj:
                    if k1 == k2: continue
                    for d1 in (-step(k1), step(k1)):
                        for d2 in (-step(k2), step(k2)):
                            a1, a2 = amounts[k1] + d1, amounts[k2] + d2
                            if a1 < mins[k1] or a2 < mins[k2] or a1 > MAXG.get(k1, 10**6) or a2 > MAXG.get(k2, 10**6): continue
                            trial = dict(amounts); trial[k1] = a1; trial[k2] = a2
                            e = err(trial)
                            if e < best[0] - 1e-9: best = (e, ('pair', k1, a1, k2, a2))
            if best[1] is None: break
            _, k1, a1, k2, a2 = best[1]; amounts[k1] = a1; amounts[k2] = a2; cur = best[0]
            continue
        amounts[best[1][0]] = best[1][1]; cur = best[0]
    return amounts, t

def fmt_amount(key, g):
    if key in PIECE:
        n = round(g / PIECE[key])
        return n, 'Stück', f"{n} Stück"
    unit = 'ml' if key in LIQUID else 'g'
    return int(round(g)), unit, f"{int(round(g))} {unit}"

def veg_tags(r):
    flags = {DB[k][5] for k, _, _ in r['ings']}
    vegan = not (flags & {'a', 'm', 'g'})
    vegetarisch = not (flags & {'m', 'g'})
    return vegan, vegetarisch

out = []
for r in RECIPES:
    vegan, vegetarisch = veg_tags(r)
    rec = dict(id=r['id'], name=r['name'], diet=r['diet'], slot=r['slot'], minutes=r['minutes'],
               express=r['minutes'] <= 10, vegan=vegan, vegetarisch=vegetarisch,
               description=r['desc'], note=r['note'], spices=r['spices'], steps=r['steps'], levels={})
    order = [k for k, _, _ in r['ings']]
    for L in LEVELS:
        am, t = solve(r, L)
        m = macros(am)
        ings = []
        for k in order:
            if am[k] <= 0: continue
            amt, unit, disp = fmt_amount(k, am[k])
            ings.append(dict(key=k, name=DB[k][0], amount=amt, unit=unit, grams=int(round(am[k])), display=disp))
        rec['levels'][str(L)] = dict(ingredients=ings,
            macros=dict(kcal=round(m['kcal']), protein=round(m['p']), fat=round(m['f']), carbs=round(m['c'])),
            target=dict(kcal=round(t['kcal'])))
    out.append(rec)

json.dump(out, open('recipes.json', 'w'), ensure_ascii=False, indent=1)
db_out = {k: dict(name=v[0], kcal=v[1], protein=v[2], carbs=v[3], fat=v[4],
                  vegan=v[5] == '', vegetarisch=v[5] in ('', 'a'), unit=('Stück' if k in PIECE else ('ml' if k in LIQUID else 'g')),
                  gramsPerPiece=PIECE.get(k)) for k, v in DB.items()}
json.dump(db_out, open('ingredients.json', 'w'), ensure_ascii=False, indent=1)
print('built', len(out))
