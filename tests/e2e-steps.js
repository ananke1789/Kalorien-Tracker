// Fachliche E2E-Schritte (werden von tests/e2e.js geladen)
// Klick nach Mittig-Scrollen (FAB/Toast verdecken sonst den unteren Rand)
export const tap = async (page, sel) => { await page.evaluate(() => (document.getElementById('toast').hidden = true)); await page.waitForSelector(sel); await page.$eval(sel, (e) => e.scrollIntoView({ block: 'center' })); await page.click(sel); };
// Tab wechseln und auf gerenderten Inhalt warten
export const go = async (page, t) => { await page.click(`.tab[data-tab="${t}"]`); await page.waitForSelector(`#view-${t} > *`); await page.waitForTimeout(80); };

export async function foodSteps({ page, step, expect }) {
  const fill = async (name, v) => page.fill(`#sheet-body [name="${name}"]`, v);

  await step('Lebensmittel pro 100 g anlegen (Komma, Plausibilitätshinweis, Feldreihenfolge)', async () => {
    await go(page, 'foods');
    await page.click('.fab');
    await fill('name', 'Proteinriegel');
    await fill('kcal', '900');
    await fill('protein', '33,3');
    await fill('fat', '15.5');
    await fill('carbs', '30');
    expect(await page.isVisible('#plaus'), 'Plausibilitätshinweis fehlt');
    await fill('kcal', '387');
    expect(!(await page.isVisible('#plaus')), 'Hinweis sollte verschwinden');
    const order = await page.$$eval('#sheet-body .grid2 input', (els) => els.map((e) => e.name).join(','));
    expect(order === 'kcal,fat,carbs,protein', 'Feldreihenfolge ' + order);
    expect(!(await page.isVisible('[name=portionName]')), 'Portionsname bei pro 100 g sichtbar');
    await page.click('#sheet-body button[type=submit]');
    await page.waitForSelector('#sheet-wrap', { state: 'hidden' });
    expect((await page.textContent('#food-list')).includes('Proteinriegel'), 'nicht in Liste');
    expect((await page.textContent('.food:has-text("Proteinriegel") .sub')).startsWith('F 15,5 · C 30,0 · P 33,3'), 'Makrozeile');
  });

  await step('Lebensmittel pro Portion anlegen (Portionsname in Liste, Plausibilität)', async () => {
    await page.click('.fab');
    await fill('name', 'Shake');
    await page.click('#type-seg [data-type="portion"]');
    await page.click('#sheet-body button[type=submit]');
    await page.waitForSelector('#err', { state: 'visible' });
    expect((await page.textContent('#err')).includes('Portionsnamen'), 'Portionsname nicht geprüft');
    await fill('portionName', '1 Shake');
    await fill('kcal', '400'); await fill('fat', '1,5'); await fill('carbs', '3'); await fill('protein', '24');
    expect(await page.isVisible('#plaus'), 'Plausibilität bei Portion fehlt');
    await fill('kcal', '120');
    expect(!(await page.isVisible('#plaus')), 'Hinweis sollte verschwinden');
    await page.click('#sheet-body button[type=submit]');
    await page.waitForSelector('#sheet-wrap', { state: 'hidden' });
    const row = await page.textContent('.food:has-text("Shake")');
    expect(row.includes('1 Shake') && row.includes('kcal/1 Shake'), 'Portionsname fehlt: ' + row);
  });

  await step('Validierung blockiert leere Eingaben', async () => {
    await page.click('.fab');
    await page.click('#sheet-body button[type=submit]');
    await page.waitForSelector('#err', { state: 'visible', timeout: 2000 });
    await page.click('#sheet-wrap .sheet-head [data-close]');
    await page.waitForSelector('#sheet-wrap', { state: 'hidden' });
  });

  await step('Alphabetische Sortierung mit Umlauten', async () => {
    for (const [n, k] of [['Äpfel', '52'], ['Banane', '89'], ['apfelmus', '70']]) {
      await page.click('.fab');
      await fill('name', n); await fill('kcal', k); await fill('protein', '0,5'); await fill('fat', '0,2'); await fill('carbs', k === '52' ? '12' : k === '89' ? '21' : '16');
      await page.click('#sheet-body button[type=submit]');
      await page.waitForSelector('#sheet-wrap', { state: 'hidden' });
    }
    const names = await page.$$eval('.food .nm', (els) => els.map((e) => e.textContent.trim()));
    expect(names.join(',').replace(/\s*1 Shake/, '') === 'Äpfel,apfelmus,Banane,Proteinriegel,Shake', names.join(','));
  });

  await step('Suche filtert', async () => {
    await page.fill('#food-q', 'riegel');
    expect((await page.$$('.food')).length === 1, 'Suche falsch');
    await page.fill('#food-q', '');
  });

  await step('Lebensmittel bearbeiten und löschen', async () => {
    await page.click('.food:has-text("Banane")');
    await fill('kcal', '90');
    await page.click('#sheet-body button[type=submit]');
    await page.waitForSelector('#sheet-wrap', { state: 'hidden' });
    expect((await page.textContent('.food:has-text("Banane") .kc')).startsWith('90'), 'nicht bearbeitet');
    await page.click('.food:has-text("Banane")');
    await page.click('#del');
    await page.click('[data-yes]');
    await page.waitForTimeout(150);
    expect(!(await page.textContent('#food-list')).includes('Banane'), 'nicht gelöscht');
  });
}

export async function todaySteps({ page, step, expect }) {
  const sumV = async (k) => (await page.textContent(`.sum-cell[data-k="${k}"] .v`)).trim();
  await step('Eintrag in Gramm mit Live-Vorschau', async () => {
    await go(page, 'today');
    await tap(page, '[data-add="breakfast"]');
    await page.fill('#pick-q', 'riegel');
    await page.click('.pick:has-text("Proteinriegel")');
    await page.fill('#sheet-body [name=amount]', '150');
    const pv = await page.textContent('#preview');
    expect(pv.includes('581') && pv.includes('50,0'), 'Vorschau falsch: ' + pv); // 387*1,5=580,5 -> 581; 33,3*1,5=49,95 -> 50,0
    await page.click('#sheet-body button[type=submit]');
    await page.waitForSelector('#sheet-wrap', { state: 'hidden' });
    expect((await sumV('kcal')) === '581', 'Tagessumme kcal ' + (await sumV('kcal')));
    const ks = await page.$$eval('.sum-cell', (els) => els.map((e) => e.dataset.k).join(','));
    expect(ks === 'kcal,fat,carbs,protein', 'Reihenfolge Tagesstand ' + ks);
  });
  await step('Eintrag als Anzahl Portionen (2 × 1 Shake), zuletzt verwendet oben', async () => {
    await tap(page, '[data-add="snacks"]');
    expect((await page.textContent('.pick-head')).includes('Zuletzt'), 'Zuletzt verwendet fehlt');
    await page.click('.pick:has-text("Shake")');
    expect((await page.inputValue('#sheet-body [name=amount]')) === '1', 'Anzahl nicht 1');
    await page.fill('#sheet-body [name=amount]', '0,5');
    expect((await page.textContent('#preview')).includes('60'), 'Halbe Portion');
    await page.fill('#sheet-body [name=amount]', '2');
    const pv = await page.textContent('#preview');
    expect(pv.includes('240') && pv.includes('48,0'), 'Portionsvorschau ' + pv);
    await page.click('#sheet-body button[type=submit]');
    await page.waitForSelector('#sheet-wrap', { state: 'hidden' });
    expect((await sumV('kcal')) === '821', 'Summe ' + (await sumV('kcal'))); // 580,5+240
    expect((await page.textContent('[data-meal="snacks"] .entry')).includes('2 × 1 Shake'), 'Portionstext');
  });
  await step('Lebensmittel ändern verfälscht Historie nicht', async () => {
    await go(page, 'foods');
    await page.click('.food:has-text("Proteinriegel")');
    await page.fill('#sheet-body [name=kcal]', '500');
    await page.click('#sheet-body button[type=submit]');
    await page.waitForSelector('#sheet-wrap', { state: 'hidden' });
    await go(page, 'today');
    expect((await sumV('kcal')) === '821', 'Snapshot verletzt');
  });
  await step('Eintrag bearbeiten, kopieren, löschen', async () => {
    await tap(page, '[data-meal="breakfast"] .entry');
    await page.fill('#sheet-body [name=amount]', '100');
    await page.click('#sheet-body button[type=submit]');
    await page.waitForSelector('#sheet-wrap', { state: 'hidden' });
    expect((await sumV('kcal')) === '627', 'Bearbeiten ' + (await sumV('kcal'))); // 387+240
    await tap(page, '[data-meal="breakfast"] .entry');
    await page.click('#copy');
    await page.click('#sheet-body [data-quick="1"]');
    await page.click('#sheet-body button[type=submit]');
    await page.waitForSelector('#sheet-wrap', { state: 'hidden' });
    await tap(page, '[data-nav="1"]');
    await page.waitForSelector('.date-btn .d1:has-text("Morgen")');
    expect((await sumV('kcal')) === '387', 'Kopie fehlt');
    await tap(page, '[data-meal="breakfast"] .entry');
    await page.click('#del');
    await page.click('[data-yes]');
    await page.waitForTimeout(200);
    expect((await sumV('kcal')) === '0', 'Löschen fehlgeschlagen');
  });
  await step('Mahlzeit von gestern übernehmen', async () => {
    await tap(page, '[data-yday="snacks"]');
    await page.waitForTimeout(200);
    expect((await sumV('kcal')) === '240', 'Übernahme ' + (await sumV('kcal')));
    await tap(page, '[data-nav="-1"]');
    await page.waitForTimeout(150);
  });
}

export async function goalsStatsSteps({ page, step, expect }) {
  await step('Ziele: Rest-Carbs live, speichern', async () => {
    await go(page, 'goals');
    expect((await page.textContent('#carbs-out')) === '453,8', 'Standard-Carbs ' + (await page.textContent('#carbs-out')));
    await page.fill('[name=kcal]', '2500');
    await page.fill('[name=protein]', '150,5');
    expect((await page.textContent('#carbs-out')) === '328,3', 'Live-Carbs ' + (await page.textContent('#carbs-out'))); // (2500-602-585)/4=328,25
    await tap(page, '#reset');
    await page.fill('[name=kcal]', '2000');
    await tap(page, '#goal-form button[type=submit]');
    await page.waitForTimeout(150);
    await go(page, 'today');
    expect((await page.textContent('.sum-cell[data-k="kcal"] .g')).includes('2.000'), 'Ziel nicht übernommen');
  });
  await step('Tagesüberblick: Ringe und Verteilung', async () => {
    await go(page, 'stats');
    expect((await page.$$('.ring')).length === 4, 'Ringe fehlen');
    // heute 627 kcal von 2000 -> 31 %
    expect((await page.textContent('.ring:first-child')).includes('31%'), 'kcal-Ring');
    await go(page, 'goals');
    await tap(page, '#reset');
    await tap(page, '#goal-form button[type=submit]');
    await page.waitForTimeout(150);
  });
}

export async function weekSteps({ page, step, expect }) {
  await step('Wochenüberblick: Diagramme, Durchschnitt, Tag antippen', async () => {
    await go(page, 'stats');
    await tap(page, '#stats-mode [data-mode="week"]');
    await page.waitForSelector('.wbar');
    expect((await page.$$('.card svg.chart')).length === 4, 'Diagramme fehlen');
    // heute 735 kcal, morgen 348 kcal -> Woche abhängig vom Wochentag; Durchschnitt über Tage mit Einträgen
    const txt = await page.textContent('#stats-body');
    expect(/Tagesdurchschnitt/.test(txt) && /von 7 Tagen/.test(txt), 'Texte fehlen');
    await page.click('.wbar >> nth=0');
    await page.waitForSelector('.rings');
    expect(await page.isVisible('#stats-mode [data-mode="day"].on'), 'nicht auf Tag gewechselt');
  });
}

export async function offlineSteps({ page, step, expect, ctx, URL }) {
  await step('PWA: Service Worker aktiv, App startet offline mit Daten', async () => {
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    await page.waitForSelector('.tab.active');
    expect(await page.evaluate(() => !!navigator.serviceWorker.controller), 'SW kontrolliert die Seite nicht');
    await ctx.setOffline(true);
    await page.reload();
    await page.waitForSelector('.tab.active');
    await go(page, 'foods');
    expect((await page.textContent('#food-list')).includes('Proteinriegel'), 'Daten offline nicht verfügbar');
    await go(page, 'stats');
    await page.waitForSelector('.rings');
    await ctx.setOffline(false);
  });
}

export async function backupSteps({ page, step, expect }) {
  let file;
  await step('Export als JSON-Datei', async () => {
    await go(page, 'goals');
    const [dl] = await Promise.all([page.waitForEvent('download'), tap(page, '#export')]);
    expect(/tagesplan-backup-\d{4}-\d{2}-\d{2}\.json/.test(dl.suggestedFilename()), dl.suggestedFilename());
    file = await dl.path();
    const data = JSON.parse((await import('node:fs')).readFileSync(file, 'utf8'));
    expect(data.foods.some((f) => f.name === 'Proteinriegel') && data.entries.length > 0, 'Export unvollständig');
  });
  await step('Demo-Daten laden und komplett löschen', async () => {
    await go(page, 'goals');
    const before = await page.evaluate(async () => (await (await import('./js/db.js')).getAll('foods')).length);
    await tap(page, '#demo-load');
    await page.waitForSelector('#demo-clear');
    await go(page, 'foods');
    expect((await page.textContent('#food-list')).includes('Haferflocken'), 'Demo fehlt');
    await go(page, 'today');
    expect((await page.$$('.entry')).length > 3, 'Demo-Einträge fehlen');
    await go(page, 'goals');
    await tap(page, '#demo-clear');
    await page.click('[data-yes]');
    await page.waitForSelector('#demo-load');
    const after = await page.evaluate(async () => (await (await import('./js/db.js')).getAll('foods')).length);
    expect(after === before, `Lebensmittel ${before} -> ${after}`);
  });
  await step('Backup-Hinweis nach 14 Tagen', async () => {
    await page.evaluate(async () => (await import('./js/db.js')).setMeta('lastBackup', new Date(Date.now() - 20 * 864e5).toISOString()));
    await go(page, 'foods');
    await go(page, 'today');
    await page.waitForSelector('#backup-hint');
    expect((await page.textContent('#backup-hint')).includes('20 Tagen'), 'Text');
  });
  await step('Import mit Überschreib-Warnung', async () => {
    await page.evaluate(async () => (await import('./js/db.js')).put('foods', { id: 'tmp', name: 'Wegwerf', kcal: 1, protein: 0, fat: 0, carbs: 0, portions: [] }));
    await go(page, 'goals');
    await page.setInputFiles('#import-file', file);
    await page.waitForSelector('[data-yes]');
    expect((await page.textContent('#sheet-body')).includes('überschrieben'), 'Warnung fehlt');
    await page.click('[data-yes]');
    await page.waitForTimeout(300);
    await go(page, 'foods');
    const txt = await page.textContent('#food-list');
    expect(txt.includes('Proteinriegel') && !txt.includes('Wegwerf'), 'Import falsch');
    await go(page, 'today');
    expect(!(await page.$('#backup-hint')), 'Hinweis sollte nach Import weg sein');
  });
}

// Prüft migrierte Lebensmittel und unveränderte Historie
async function checkMigrated(page, expect, OLD_KCAL_TODAY) {
  await go(page, 'foods');
  const names = await page.$$eval('.food .nm', (els) => els.map((e) => e.textContent.replace(/\s+/g, ' ').trim()));
  expect(names.join('|') === 'Apfel|Brot 1 Scheibe|Brot (1 Brötchen) 1 Brötchen|Riegel 1 Riegel', 'Lebensmittel: ' + names.join('|'));
  expect((await page.textContent('.food:has-text("1 Brötchen") .kc')).startsWith('220'), 'Werte 1:1 übernommen');
  await go(page, 'today');
  const kcal = (await page.textContent('.sum-cell[data-k="kcal"] .v')).trim();
  expect(kcal === OLD_KCAL_TODAY, `Historie verändert: ${kcal}`);
  expect((await page.textContent('[data-meal="snacks"] .entry')).includes('2 × 1 Riegel · 90 g'), 'alter Portionstext');
}

export async function migrationSteps({ page, step, expect, ctx, URL }) {
  const { OLD_FOODS, OLD_ENTRIES, OLD_KCAL_TODAY, OLD_BACKUP } = await import('./fixtures-old.js');
  await step('Migration: DB-Upgrade von Version 1 (inkl. zwei Portionen)', async () => {
    const c2 = await ctx.browser().newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
    const p2 = await c2.newPage();
    p2.setDefaultTimeout(5000);
    await p2.goto(URL + 'manifest.webmanifest');
    await p2.evaluate(({ foods, entries }) => new Promise((res, rej) => {
      const r = indexedDB.open('tagesplan', 1);
      r.onupgradeneeded = () => {
        const db = r.result;
        db.createObjectStore('foods', { keyPath: 'id' });
        db.createObjectStore('entries', { keyPath: 'id' }).createIndex('date', 'date');
        db.createObjectStore('meta', { keyPath: 'key' });
      };
      r.onsuccess = () => {
        const t = r.result.transaction(['foods', 'entries'], 'readwrite');
        foods.forEach((f) => t.objectStore('foods').put(f));
        entries.forEach((e) => t.objectStore('entries').put(e));
        t.oncomplete = () => { r.result.close(); res(); };
        t.onerror = () => rej(t.error);
      };
    }), { foods: OLD_FOODS, entries: OLD_ENTRIES });
    await p2.goto(URL);
    await p2.waitForSelector('.tab.active');
    await checkMigrated(p2, expect, OLD_KCAL_TODAY);
    const raw = await p2.evaluate(async () => (await import('./js/db.js')).getAll('entries'));
    expect(JSON.stringify(raw.sort((a, b) => a.createdAt - b.createdAt)) === JSON.stringify(OLD_ENTRIES), 'Einträge in der DB verändert');
    await c2.close();
  });
  await step('Migration: Import eines alten Backups (Version 1)', async () => {
    const fs = await import('node:fs');
    const os = await import('node:os');
    const file = (await import('node:path')).join(os.tmpdir(), 'tagesplan-alt.json');
    fs.writeFileSync(file, JSON.stringify(OLD_BACKUP));
    const c3 = await ctx.browser().newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
    const p3 = await c3.newPage();
    p3.setDefaultTimeout(5000);
    await p3.goto(URL);
    await go(p3, 'goals');
    await p3.setInputFiles('#import-file', file);
    await p3.click('[data-yes]');
    await p3.waitForTimeout(300);
    await checkMigrated(p3, expect, OLD_KCAL_TODAY);
    await go(p3, 'goals');
    expect((await p3.inputValue('[name=kcal]')) === '2500', 'Ziele nicht importiert');
    await c3.close();
  });
}

export async function trainingSteps({ page, step, expect }) {
  const ex = (name) => `.tex:has(.tex-name:text-is("${name}"))`;
  const setIn = (name, n, f) => `${ex(name)} .set >> nth=${n} >> [data-f="${f}"]`;
  await step('Training: Startansicht und Sondertraining-Menü', async () => {
    await go(page, 'training');
    const btns = await page.$$eval('.big-btn b', (els) => els.map((e) => e.textContent));
    expect(btns.join('|') === 'Upper Body|Lower Body|Upper Body Calisthenics|Sondertraining', btns.join('|'));
    await tap(page, '#special');
    expect((await page.$$('#sheet-body .big-btn')).length === 7, 'Sondertrainings fehlen');
    await page.click('#sheet-wrap .sheet-head [data-close]');
    await page.waitForSelector('#sheet-wrap', { state: 'hidden' });
  });
  await step('Training: Upper Body erfassen (G, Skalen, KG, Variante), Autosave + Fortsetzen', async () => {
    await tap(page, '[data-plan="upper"]');
    await page.waitForSelector('.tex');
    const nos = await page.$$eval('.tex-no', (els) => els.map((e) => e.textContent).join(','));
    expect(nos === '1,2,3,4,5,6,7,8,B1,B2,9,10', 'Nummern ' + nos);
    expect(await page.isVisible('.superset .label:text("Superset B")'), 'Superset-Block');
    expect(await page.isVisible('.section-title:has-text("Griffkraft")'), 'Abschnitt');
    expect((await page.textContent(ex('Seitheben Kabelzug') + ' .tex-target')).includes('2 × 12-20'), 'Ziel');
    await page.fill(setIn('Seitheben Kabelzug', 0, 'weight'), '10');
    await page.fill(setIn('Seitheben Kabelzug', 0, 'reps'), '15');
    await page.click(`${ex('Seitheben Kabelzug')} .set >> nth=0 >> [data-k="form"][data-v="4"]`);
    await page.click(`${ex('Seitheben Kabelzug')} .set >> nth=0 >> [data-k="effort"][data-v="3"]`);
    // KG: Klimmzüge mit Stufe + Zusatzgewicht
    await page.fill(setIn('Klimmzüge weit', 0, 'reps'), '8');
    await page.click(`${ex('Klimmzüge weit')} .set >> nth=0 >> [data-act="extra"]`);
    await page.fill(setIn('Klimmzüge weit', 0, 'extra'), '2,5');
    // Variante Untere Brust -> Dip-Maschine (G)
    await page.selectOption(`${ex('Untere Brust')} select[data-act="variant"]`, 'dip-maschine');
    await page.waitForSelector(`${ex('Untere Brust')} [data-f="weight"]`);
    await page.fill(setIn('Untere Brust', 0, 'weight'), '40');
    await page.fill(setIn('Untere Brust', 0, 'reps'), '10');
    expect((await page.textContent('#w-progress')).includes('3 / '), 'Fortschritt ' + (await page.textContent('#w-progress')));
    await page.waitForTimeout(400);
    await page.reload();
    await go(page, 'training');
    await page.waitForSelector('.tex');
    expect((await page.inputValue(setIn('Seitheben Kabelzug', 0, 'weight'))) === '10', 'Autosave Gewicht');
    expect((await page.inputValue(setIn('Klimmzüge weit', 0, 'extra'))) === '2,5', 'Autosave Zusatz');
    expect(await page.isVisible(`${ex('Seitheben Kabelzug')} .set >> nth=0 >> [data-k="form"][data-v="4"].on`), 'Skala gespeichert');
    expect((await page.$eval(`${ex('Untere Brust')} select[data-act="variant"]`, (e) => e.value)) === 'dip-maschine', 'Variante gespeichert');
  });
  await step('Training: eigene Variante dauerhaft anlegen', async () => {
    await page.selectOption(`${ex('Rudern')} select[data-act="variant"]`, '__new');
    await page.fill('#sheet-body [name=name]', 'T-Bar Rudern');
    await page.click('#sheet-body button[type=submit]');
    await page.waitForSelector('#sheet-wrap', { state: 'hidden' });
    expect((await page.$eval(`${ex('Rudern')} select[data-act="variant"] option:checked`, (e) => e.textContent)).includes('T-Bar Rudern'), 'Variante nicht gewählt');
    const saved = await page.evaluate(async () => (await (await import('./js/db.js')).get('exercises', 'rudern')).variants.map((v) => v.name));
    expect(saved.includes('T-Bar Rudern'), 'Variante nicht im Katalog');
  });
  await step('Training: Satz hinzufügen/entfernen, überspringen, abschließen', async () => {
    await page.fill(setIn('Seitheben Kabelzug', 1, 'weight'), '10');
    await page.fill(setIn('Seitheben Kabelzug', 1, 'reps'), '20');
    await page.fill(setIn('Seitheben Kabelzug', 0, 'reps'), '20');
    await tap(page, `${ex('Mittlere Brust')} [data-act="add-set"]`);
    expect((await page.$$(`${ex('Mittlere Brust')} .set`)).length === 3, 'Satz hinzufügen');
    await tap(page, `${ex('Mittlere Brust')} .set >> nth=2 >> [data-act="del-set"]`);
    expect((await page.$$(`${ex('Mittlere Brust')} .set`)).length === 2, 'Satz entfernen');
    await tap(page, `${ex('Rudern')} [data-act="skip"]`);
    expect(await page.isVisible(`${ex('Rudern')}.skipped`), 'überspringen');
    await page.fill('[data-act="note"]', 'Gute Einheit');
    await tap(page, '[data-act="finish"]');
    await page.waitForSelector('#t-sub [data-sub="history"].on');
  });
  await step('Training: letzte Werte, Übernehmen per Tipp, Progressionshinweis, letzte Stufe', async () => {
    await tap(page, '#t-sub [data-sub="start"]');
    await tap(page, '[data-plan="upper"]');
    await page.waitForSelector('.tex');
    const last = await page.textContent(ex('Seitheben Kabelzug') + ' .tex-last');
    expect(last.includes('10 kg × 20 · 10 kg × 20'), 'Zuletzt: ' + last);
    expect((await page.textContent(ex('Seitheben Kabelzug') + ' .tex-prog')).includes('Progression fällig: Gewicht erhöhen'), 'Progression');
    expect((await page.getAttribute(setIn('Seitheben Kabelzug', 0, 'weight'), 'placeholder')) === '10', 'Platzhalter');
    await tap(page, `${ex('Seitheben Kabelzug')} .set >> nth=0 >> [data-act="use-last"]`);
    expect((await page.inputValue(setIn('Seitheben Kabelzug', 0, 'reps'))) === '20', 'Übernehmen');
    expect((await page.$eval(`${ex('Untere Brust')} select[data-act="variant"]`, (e) => e.value)) === 'dip-maschine', 'zuletzt genutzte Variante');
    expect(!(await page.textContent(ex('Klimmzüge weit'))).includes('Progression'), 'kein Hinweis bei Klimmzügen');
    await tap(page, '[data-act="discard"]');
    await page.click('[data-yes]');
    await page.waitForSelector('.big-btn');
  });
  await step('Training: Sondertraining 4g (pro Seite) und 4a (optional eingeklappt, Stern)', async () => {
    await tap(page, '#special');
    await page.click('#sheet-body [data-plan="4g"]');
    await page.waitForSelector('.tex');
    const heads = await page.$$eval(`${ex('Rückwärts-Ausfallschritte KH')} .set-head b`, (els) => els.map((e) => e.textContent).join(','));
    expect(heads === 'Satz 1 L,Satz 1 R,Satz 2 L,Satz 2 R', heads);
    expect((await page.textContent(ex('Seitheben Kurzhantel'))).includes('kg pro Hand'), 'pro Hand');
    await tap(page, '[data-act="discard"]');
    await page.click('[data-yes]');
    await page.waitForSelector('.big-btn');
    await tap(page, '#special');
    await page.click('#sheet-body [data-plan="4b"]');
    await page.waitForSelector('.tex');
    // alle Sätze füllen -> Stern
    for (const inp of await page.$$('[data-f="weight"]')) await inp.fill('20');
    for (const inp of await page.$$('[data-f="reps"]')) await inp.fill('12');
    expect(await page.isVisible('#w-progress .star-status.on'), 'Stern fehlt');
    await tap(page, '[data-act="discard"]');
    await page.click('[data-yes]');
    await page.waitForSelector('.big-btn');
    await tap(page, '#special');
    await page.click('#sheet-body [data-plan="4a"]');
    await page.waitForSelector('.tex');
    expect(await page.isVisible(`${ex('Dead Hang')}.closed`), 'optional nicht eingeklappt');
    await tap(page, `${ex('Dead Hang')} [data-act="open"]`);
    expect(await page.isVisible(`${ex('Dead Hang')} [data-f="secs"]`), 'Z-Eingabe');
    await tap(page, '[data-act="discard"]');
    await page.click('[data-yes]');
    await page.waitForSelector('.big-btn');
  });
}

export async function historySteps({ page, step, expect }) {
  await step('Verlauf: Liste, Details, Bearbeiten, Löschen', async () => {
    await go(page, 'training');
    await tap(page, '#t-sub [data-sub="history"]');
    await page.waitForSelector('.hist');
    const row = await page.textContent('.hist');
    expect(row.includes('Upper Body') && row.includes('5') && row.includes('Sätze'), 'Zeile: ' + row); // 2 Seitheben + 1 Klimmzug + 1 Untere Brust + ... 
    await tap(page, '.hist');
    const det = await page.textContent('#sheet-body');
    expect(det.includes('Seitheben Kabelzug') && det.includes('10 kg × 20') && det.includes('S4/V3') && det.includes('Gute Einheit'), 'Details: ' + det);
    expect(det.includes('8 Wdh. +2,5 kg') && det.includes('Stufe 1'), 'KG-Details');
    expect(det.includes('Rudern') && det.includes('übersprungen'), 'übersprungen');
    await page.click('#wd-edit');
    await page.waitForSelector('.tex');
    expect((await page.textContent('.w-head')).includes('Training bearbeiten'), 'Bearbeiten-Modus');
    await page.fill('.tex:has(.tex-name:text-is("Seitheben Kabelzug")) .set >> nth=0 >> [data-f="weight"]', '12,5');
    await page.waitForTimeout(400);
    await tap(page, '[data-act="done-edit"]');
    await page.waitForSelector('.hist');
    await tap(page, '.hist');
    expect((await page.textContent('#sheet-body')).includes('12,5 kg × 20'), 'Bearbeitung nicht gespeichert');
    await page.click('#wd-del');
    await page.click('[data-no]');
    await page.waitForSelector('#wd-del'); // Abbrechen -> Details wieder offen
    await page.click('#sheet-wrap .sheet-head [data-close]');
    await page.waitForSelector('#sheet-wrap', { state: 'hidden' });
    expect((await page.$$('.hist')).length === 1, 'nicht mehr vorhanden');
    // zweites Training anlegen und löschen
    await tap(page, '#t-sub [data-sub="start"]');
    await tap(page, '[data-plan="lower"]');
    await page.waitForSelector('.tex');
    await page.fill('.tex >> nth=0 >> [data-f="weight"] >> nth=0', '60');
    await page.fill('.tex >> nth=0 >> [data-f="reps"] >> nth=0', '12');
    await tap(page, '[data-act="finish"]');
    await page.waitForSelector('.hist');
    expect((await page.$$('.hist')).length === 2, 'zweites Training fehlt');
    await tap(page, '.hist:has-text("Lower Body")');
    await page.click('#wd-del');
    await page.click('[data-yes]');
    await page.waitForTimeout(300);
    expect((await page.$$('.hist')).length === 1, 'Löschen fehlgeschlagen');
  });
}

export async function tstatsSteps({ page, step, expect }) {
  await step('Statistik: Punktdiagramm, Stufenwechsel, Zeitraum, Kennzahl, Punkt-Details', async () => {
    // Testhistorie: Klimmzüge (Cali) über 5 Trainings, Stufenwechsel beim 4.
    await page.evaluate(async () => {
      const db = await import('./js/db.js');
      const m = await import('./js/training/model.js');
      const { DEFAULT_PLANS } = await import('./js/training/plans.js');
      const { DEFAULT_EXERCISES } = await import('./js/training/catalog.js');
      const u = await import('./js/util.js');
      const plan = DEFAULT_PLANS.find((p) => p.id === 'cali');
      const days = [-150, -40, -20, -10, -3];
      const list = days.map((d, i) => {
        const w = m.newWorkout(plan, DEFAULT_EXERCISES, [], u.addDays(u.todayKey(), d));
        const ex = w.exercises.find((e) => e.exId === 'klimmzuege-weit');
        ex.sets.forEach((s) => Object.assign(s, { reps: 8 + i, stage: i >= 3 ? 1 : 0, extra: i >= 3 ? 2.5 * (i - 2) : null, form: 4, effort: 3 }));
        return { ...w, id: 'stat-' + i, status: 'done', finishedAt: i };
      });
      await db.putMany('workouts', list);
      (await import('./js/training/store.js')).loadTraining();
    });
    await go(page, 'training');
    await tap(page, '#t-sub [data-sub="stats"]');
    await page.waitForSelector('#sp-open');
    await tap(page, '#sp-open');
    await page.fill('#sp-q', 'klimm');
    await page.click('#sheet-body [data-key="klimmzuege-weit/std"]');
    await page.waitForSelector('.lpt');
    expect((await page.$$('.lpt')).length === 5, 'Punkte 3 Monate: ' + (await page.$$('.lpt')).length); // -150 fällt raus, + Upper Body von heute (planübergreifend)
    expect((await page.textContent('.card svg.chart')).includes('Stufe 2'), 'Stufenmarkierung');
    await tap(page, '#sp-range [data-r="all"]');
    expect((await page.$$('.lpt')).length === 6, 'Alles');
    await tap(page, '#sp-range [data-r="4w"]');
    expect((await page.$$('.lpt')).length === 4, '4 Wochen');
    // Gewicht = max. Zusatzgewicht; Volumen = Σ kg×Wdh. bzw. Wdh.
    expect((await page.textContent('.stat-grid')).includes('5,0 kg'), 'Bestwert Gewicht ' + (await page.textContent('.stat-grid')));
    await tap(page, '#sp-metric [data-m="volume"]');
    const g = await page.textContent('.stat-grid');
    expect(g.includes('Wdh.') || g.includes('kg'), 'Volumen-Einheit');
    await page.click('.lpt >> nth=0');
    await page.waitForSelector('#sheet-wrap:not([hidden])');
    const det = await page.textContent('#sheet-body');
    expect(det.includes('Klimmzüge weit') && det.includes('S4/V3') && !det.includes('Ring Rows'), 'Punkt-Details: ' + det.slice(0, 200));
    await page.click('#sheet-wrap .sheet-head [data-close]');
    expect((await page.textContent('#t-body')).includes('Trainings pro Woche'), 'Wochenübersicht');
  });
}

export async function planEditorSteps({ page, step, expect }) {
  const item = (name) => `.tex:has(.tex-name:text-is("${name}"))`;
  await step('Pläne: bearbeiten (Sätze, Hinweis, optional, Superset, Reihenfolge, Abschnitt, Übung hinzufügen)', async () => {
    await go(page, 'training');
    await tap(page, '#t-sub [data-sub="plans"]');
    expect((await page.$$('[data-plan]')).length === 10, 'Planliste');
    await tap(page, '[data-plan="lower"]');
    await page.waitForSelector('#pe-addex');
    await tap(page, `${item('Beinstrecker')} [data-tg]`);
    await page.fill(`${item('Beinstrecker')} [data-pf="sets"]`, '4');
    await page.fill(`${item('Beinstrecker')} [data-pf="note"]`, 'langsam');
    await page.check(`${item('Beinstrecker')} [data-pf="optional"]`);
    await page.waitForTimeout(150);
    await page.selectOption(`${item('Beinstrecker')} [data-pf="group"]`, 'A');
    await page.waitForTimeout(150);
    expect((await page.textContent(`${item('Beinstrecker')} .tex-target`)).includes('4 × 10-15 · optional'), 'Zusammenfassung');
    expect((await page.textContent(`${item('Beinstrecker')} .tex-no`)) === 'A1', 'Superset-Label');
    // Waden nach unten
    await tap(page, `${item('Waden')} .tex-actions [data-mv="1"]`);
    await page.waitForTimeout(300);
    const names = await page.$$eval('.tex-name', (els) => els.slice(0, 2).map((e) => e.textContent).join(','));
    expect(names === 'Beinpresse (Füße hoch),Waden', 'Reihenfolge ' + names);
    await tap(page, '#pe-addsec');
    await tap(page, '#pe-addex');
    await page.fill('#pe-q', 'farmer');
    await page.click('#sheet-body .pick[data-id="farmers"]');
    await page.waitForSelector(item("Farmer's Walk / Hold"));
    await page.fill(`${item("Farmer's Walk / Hold")} [data-pf="reps"]`, '40-60 s');
    await page.waitForTimeout(500);
    // neues Training nutzt den geänderten Plan
    await tap(page, '#t-sub [data-sub="start"]');
    await tap(page, '[data-plan="lower"]');
    await page.waitForSelector('.tex');
    expect((await page.$$(`${item('Beinstrecker')} .set`)).length === 0 && await page.isVisible(`${item('Beinstrecker')}.closed`), 'optional eingeklappt');
    expect((await page.textContent(item('Beinstrecker'))).includes('4 × 10-15') && (await page.textContent(item('Beinstrecker'))).includes('langsam'), 'Plan übernommen');
    expect(await page.isVisible(`${item("Farmer's Walk / Hold")} [data-f="secs"]`), 'neue Übung im Training');
    expect(await page.isVisible('.section-title:has-text("Neuer Abschnitt")'), 'Abschnitt im Training');
    await tap(page, '[data-act="discard"]');
    await page.click('[data-yes]');
    await page.waitForSelector('.big-btn');
  });
  await step('Pläne: Snapshot – alte Trainings unverändert; Plan auf Standard zurücksetzen', async () => {
    await tap(page, '#t-sub [data-sub="history"]');
    await tap(page, '.hist:has-text("Upper Body")');
    const before = await page.textContent('#sheet-body');
    await page.click('#sheet-wrap .sheet-head [data-close]');
    await tap(page, '#t-sub [data-sub="plans"]');
    await tap(page, '[data-plan="upper"]');
    await tap(page, `${item('Seitheben Kabelzug')} [data-del]`);
    await page.click('[data-yes]');
    await page.waitForTimeout(300);
    await tap(page, '#t-sub [data-sub="history"]');
    await tap(page, '.hist:has-text("Upper Body")');
    expect((await page.textContent('#sheet-body')) === before && before.includes('Seitheben Kabelzug'), 'Snapshot verletzt');
    await page.click('#sheet-wrap .sheet-head [data-close]');
    await tap(page, '#t-sub [data-sub="plans"]');
    await tap(page, '[data-plan="upper"]');
    expect(!(await page.$(item('Seitheben Kabelzug'))), 'nicht entfernt');
    await tap(page, '#pe-reset');
    await page.click('[data-yes]');
    await page.waitForSelector(item('Seitheben Kabelzug')); // Editor zeigt wieder den Standard
    await tap(page, '#pe-back');
  });
  await step('Katalog: Übung bearbeiten (Variante + Stufen) und neue Übung anlegen', async () => {
    await tap(page, '#cat-open');
    await page.fill('#pe-q', 'beinbeuger');
    await page.click('#sheet-body .pick[data-id="beinbeuger"]');
    await page.waitForSelector('#ef-vars');
    await page.click('#ef-addv');
    await page.fill('#ef-vars [data-vi="2"] [data-vf="name"]', 'Nordic Curls');
    await page.selectOption('#ef-vars [data-vi="2"] [data-vf="type"]', 'KG');
    await page.fill('#ef-vars [data-vi="2"] [data-vf="stages"]', 'Band\nohne Band');
    await page.fill('#ef-vars [data-vi="2"] [data-vf="nextAt"]', '8');
    await page.click('#sheet-body button[type=submit]');
    await page.waitForSelector('#sheet-wrap', { state: 'hidden' });
    const v = await page.evaluate(async () => (await (await import('./js/db.js')).get('exercises', 'beinbeuger')).variants[2]);
    expect(v.name === 'Nordic Curls' && v.type === 'KG' && v.stages.length === 2 && v.nextAt === 8, JSON.stringify(v));
    await tap(page, '#cat-open');
    await page.fill('#pe-q', 'Sled Push');
    await page.click('#sheet-body .pick[data-new]');
    await page.waitForSelector('#ef-vars');
    await page.selectOption('#ef-vars [data-vf="type"]', 'Z');
    await page.click('#sheet-body button[type=submit]');
    await page.waitForSelector('#sheet-wrap', { state: 'hidden' });
    const all = await page.evaluate(async () => (await (await import('./js/db.js')).getAll('exercises')).filter((x) => x.name === 'Sled Push'));
    expect(all.length === 1 && all[0].variants[0].type === 'Z' && all[0].group === 'Eigene', JSON.stringify(all));
  });
}

export const ORDER = [migrationSteps, foodSteps, todaySteps, goalsStatsSteps, weekSteps, trainingSteps, historySteps, tstatsSteps, planEditorSteps, backupSteps, offlineSteps];
