// Fachliche E2E-Schritte (werden von tests/e2e.js geladen)
// Klick nach Mittig-Scrollen (FAB/Toast verdecken sonst den unteren Rand)
export const tap = async (page, sel) => { await page.evaluate(() => (document.getElementById('toast').hidden = true)); await page.waitForSelector(sel); await page.$eval(sel, (e) => e.scrollIntoView({ block: 'center' })); await page.click(sel); };
// Tab wechseln und auf gerenderten Inhalt warten
export const go = async (page, t) => { await page.click(`.tab[data-tab="${t}"]`); await page.waitForSelector(`#view-${t} > *`); await page.waitForTimeout(80); };

export async function foodSteps({ page, step, expect }) {
  const fill = async (name, v) => page.fill(`#sheet-body [name="${name}"]`, v);

  await step('Lebensmittel anlegen (mit Komma, Portion, Plausibilitätshinweis)', async () => {
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
    await page.click('#addp');
    await page.fill('#portions .portion-row:last-child [name=pname]', '1 Riegel');
    await page.fill('#portions .portion-row:last-child [name=pgrams]', '45');
    await page.click('#sheet-body button[type=submit]');
    await page.waitForSelector('#sheet-wrap', { state: 'hidden' });
    expect((await page.textContent('#food-list')).includes('Proteinriegel'), 'nicht in Liste');
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
    expect(names.join(',') === 'Äpfel,apfelmus,Banane,Proteinriegel', names.join(','));
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
  const sumV = async (k) => (await page.textContent(`.sum-cell[data-k="${k}"] .v`)).replace(/\s|g/g, '');
  await step('Eintrag in Gramm mit Live-Vorschau', async () => {
    await go(page, 'today');
    await tap(page, '[data-add="breakfast"]');
    await page.fill('#pick-q', 'riegel');
    await page.click('.pick:has-text("Proteinriegel")');
    await page.fill('#sheet-body [name=grams]', '150');
    const pv = await page.textContent('#preview');
    expect(pv.includes('581') && pv.includes('50,0'), 'Vorschau falsch: ' + pv); // 387*1,5=580,5 -> 581; 33,3*1,5=49,95 -> 50,0
    await page.click('#sheet-body button[type=submit]');
    await page.waitForSelector('#sheet-wrap', { state: 'hidden' });
    expect((await sumV('kcal')) === '581', 'Tagessumme kcal ' + (await sumV('kcal')));
  });
  await step('Eintrag als Portion (2 × 1 Riegel = 90 g), zuletzt verwendet oben', async () => {
    await tap(page, '[data-add="snacks"]');
    expect((await page.textContent('.pick-head')).includes('Zuletzt'), 'Zuletzt verwendet fehlt');
    await page.click('.pick:has-text("Proteinriegel")');
    await page.click('#mode [data-mode="portion"]');
    await page.fill('#sheet-body [name=count]', '2');
    expect((await page.textContent('#preview')).includes('348'), 'Portionsvorschau'); // 387*0,9=348,3
    await page.click('#sheet-body button[type=submit]');
    await page.waitForSelector('#sheet-wrap', { state: 'hidden' });
    expect((await sumV('kcal')) === '929', 'Summe ' + (await sumV('kcal'))); // 580,5+348,3=928,8
    expect((await page.textContent('[data-meal="snacks"] .entry')).includes('2 × 1 Riegel'), 'Portionstext');
  });
  await step('Lebensmittel ändern verfälscht Historie nicht', async () => {
    await go(page, 'foods');
    await page.click('.food:has-text("Proteinriegel")');
    await page.fill('#sheet-body [name=kcal]', '500');
    await page.click('#sheet-body button[type=submit]');
    await page.waitForSelector('#sheet-wrap', { state: 'hidden' });
    await go(page, 'today');
    expect((await sumV('kcal')) === '929', 'Snapshot verletzt');
  });
  await step('Eintrag bearbeiten, kopieren, löschen', async () => {
    await tap(page, '[data-meal="breakfast"] .entry');
    await page.fill('#sheet-body [name=grams]', '100');
    await page.click('#sheet-body button[type=submit]');
    await page.waitForSelector('#sheet-wrap', { state: 'hidden' });
    expect((await sumV('kcal')) === '735', 'Bearbeiten ' + (await sumV('kcal'))); // 387+348,3
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
    expect((await sumV('kcal')) === '348', 'Übernahme ' + (await sumV('kcal')));
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
    // heute 735 kcal von 2000 -> 37 %
    expect((await page.textContent('.ring:first-child')).includes('37%'), 'kcal-Ring');
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

export const ORDER = [foodSteps, todaySteps, goalsStatsSteps, weekSteps, backupSteps, offlineSteps];
