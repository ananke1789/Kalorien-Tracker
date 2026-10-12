import json, itertools
R=json.load(open('recipes.json'))
L=['1750','2250','2600','2900','3200']
slots=['fruehstueck','mittag','abend']
ok=True
print('Stufe | kcal min–max | Protein min–max | Fett min | (alle Kombinationen über alle 90 Rezepte)')
for l in L:
    by={s:[r for r in R if r['slot']==s] for s in slots}
    combos=list(itertools.product(*[by[s] for s in slots]))
    K=[sum(x['levels'][l]['macros']['kcal'] for x in c) for c in combos]
    P=[sum(x['levels'][l]['macros']['protein'] for x in c) for c in combos]
    F=[sum(x['levels'][l]['macros']['fat'] for x in c) for c in combos]
    print(l, len(combos), min(K), max(K), min(P), max(P), min(F))
    if min(P)<120 or max(P)>190 or min(F)<60: ok=False
    if min(K)<int(l)*0.95 or max(K)>int(l)*1.05: ok=False
# keto carbs
for l in L:
    by={s:[r for r in R if r['slot']==s and r['diet']=='keto'] for s in slots}
    C=[sum(x['levels'][l]['macros']['carbs'] for x in c) for c in itertools.product(*[by[s] for s in slots])]
    by2={s:[r for r in R if r['slot']==s and r['diet'] in('lowcarb',)] for s in slots}
    C2=[sum(x['levels'][l]['macros']['carbs'] for x in c) for c in itertools.product(*[by2[s] for s in slots])]
    print('keto carbs',l,min(C),max(C),' lowcarb',min(C2),max(C2))
# low C ingredient check: C-ingredients that vanish
for r in R:
    for l in L:
        lv=r['levels'][l]
        if lv['macros']['carbs']<15 and r['diet'] not in('keto','lowcarb'): print('lowcarbs',r['id'],l,lv['macros'])
print('OK' if ok else 'FAIL')
