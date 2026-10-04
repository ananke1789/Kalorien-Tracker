// Fachliche E2E-Schritte (werden von tests/e2e.js geladen)
export default async function ({ page, step, expect }) {
  const fill = async (name, v) => page.fill(`#sheet-body [name="${name}"]`, v);

  await step('Lebensmittel anlegen (mit Komma, Portion, Plausibilitätshinweis)', async () => {
    await page.click('.tab[data-tab="foods"]');
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
    expect(await page.isVisible('#err'), 'Fehlermeldung fehlt');
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
    await page.click('.tab[data-tab="today"]');
    await page.click('[data-add="breakfast"]');
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
    await page.click('[data-add="snacks"]');
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
    await page.click('.tab[data-tab="foods"]');
    await page.click('.food:has-text("Proteinriegel")');
    await page.fill('#sheet-body [name=kcal]', '500');
    await page.click('#sheet-body button[type=submit]');
    await page.waitForSelector('#sheet-wrap', { state: 'hidden' });
    await page.click('.tab[data-tab="today"]');
    expect((await sumV('kcal')) === '929', 'Snapshot verletzt');
  });
  await step('Eintrag bearbeiten, kopieren, löschen', async () => {
    await page.click('[data-meal="breakfast"] .entry');
    await page.fill('#sheet-body [name=grams]', '100');
    await page.click('#sheet-body button[type=submit]');
    await page.waitForSelector('#sheet-wrap', { state: 'hidden' });
    expect((await sumV('kcal')) === '735', 'Bearbeiten ' + (await sumV('kcal'))); // 387+348,3
    await page.click('[data-meal="breakfast"] .entry');
    await page.click('#copy');
    await page.click('#sheet-body [data-quick="1"]');
    await page.click('#sheet-body button[type=submit]');
    await page.waitForSelector('#sheet-wrap', { state: 'hidden' });
    await page.click('[data-nav="1"]');
    await page.waitForSelector('.date-btn .d1:has-text("Morgen")');
    expect((await sumV('kcal')) === '387', 'Kopie fehlt');
    await page.click('[data-meal="breakfast"] .entry');
    await page.click('#del');
    await page.click('[data-yes]');
    await page.waitForTimeout(200);
    expect((await sumV('kcal')) === '0', 'Löschen fehlgeschlagen');
  });
  await step('Mahlzeit von gestern übernehmen', async () => {
    await page.click('[data-yday="snacks"]');
    await page.waitForTimeout(200);
    expect((await sumV('kcal')) === '348', 'Übernahme ' + (await sumV('kcal')));
    await page.click('[data-nav="-1"]');
    await page.waitForTimeout(150);
  });
}
