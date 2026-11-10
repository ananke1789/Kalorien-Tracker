// Browser-Test mit Playwright: node tests/e2e.js   (Screenshots: SHOTS=verzeichnis node tests/e2e.js)
// Startet einen lokalen Server im App-Ordner, öffnet die App in Chromium (Handy-Format) und prüft die Kernabläufe.
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require(process.env.PLAYWRIGHT_PATH || '/opt/node-tools/node_modules/playwright')); }

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 8766;
const server = spawn('python3', ['-m', 'http.server', String(PORT)], { cwd: root, stdio: 'ignore' });
const URL = `http://localhost:${PORT}/`;
const errors = [];
let failed = 0;
const step = async (name, fn) => {
  try { await fn(); console.log('✓', name); } catch (e) {
    failed++; console.log('✗', name, '\n   ', e.message.split('\n')[0]);
    if (process.env.SHOTS) await page.screenshot({ path: path.join(process.env.SHOTS, `fail-${failed}.png`) }).catch(() => {});
  }
};
const expect = (cond, msg) => { if (!cond) throw new Error(msg); };
const go = async (tab) => { await page.click(`.tab[data-tab="${tab}"]`); await page.waitForSelector(`#view-${tab}:not([hidden]) > *`); };
const text = async (sel) => (await page.textContent(sel)).replace(/\s+/g, ' ').trim();
const shot = async (name) => { if (process.env.SHOTS) { await page.waitForTimeout(250); await page.screenshot({ path: path.join(process.env.SHOTS, name + '.png'), fullPage: true }); } };

await new Promise((r) => setTimeout(r, 700));
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'de-DE', acceptDownloads: true });
const page = await ctx.newPage();
page.setDefaultTimeout(5000);
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

const today = new Date();
const pad = (n) => String(n).padStart(2, '0');
const key = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const TODAY = key(today);
const MONTH1 = TODAY.slice(0, 8) + '01';

try {
  await page.goto(URL);
  await page.waitForSelector('.tab.active');

  await step('Navigation über alle Tabs', async () => {
    for (const t of ['week', 'fixed', 'stats', 'more', 'overview']) { await go(t); expect(await page.isVisible(`#view-${t}`), t); }
  });

  await step('Standardkategorien vorhanden', async () => {
    await go('more');
    const n = await page.locator('[data-cat]').count();
    expect(n === 9, 'Kategorien: ' + n);
    expect((await text('#view-more')).includes('Fitness & Supplements'), 'Fitness fehlt');
  });

  await step('Eigene Kategorie anlegen, Doppelte abgelehnt', async () => {
    await page.click('[data-newcat]');
    await page.fill('#sheet-body [name=name]', 'Supermarkt');
    await page.click('#sheet-body [type=submit]');
    expect(await page.isVisible('[data-err]'), 'keine Fehlermeldung bei Duplikat');
    await page.fill('#sheet-body [name=name]', 'Geschenke');
    await page.fill('#sheet-body [name=budget]', '50');
    await page.click('#sheet-body [type=submit]');
    await page.waitForSelector('#sheet-wrap', { state: 'hidden' });
    expect((await text('#view-more')).includes('Geschenke'), 'Geschenke fehlt');
  });

  await step('Fixkosten und Einnahme anlegen (Tag 1 des Monats)', async () => {
    await go('fixed');
    const add = async (type, name, amount, every = '1') => {
      await page.click('.fab');
      if (type === 'in') await page.click('#sheet-body [data-seg=type] [data-v=in]');
      await page.fill('#sheet-body [name=name]', name);
      await page.fill('#sheet-body [name=amount]', amount);
      await page.selectOption('#sheet-body [name=every]', every);
      await page.fill('#sheet-body [name=day]', '1');
      await page.fill('#sheet-body [name=start]', MONTH1);
      await page.click('#sheet-body [type=submit]');
      await page.waitForSelector('#sheet-wrap', { state: 'hidden' });
    };
    await add('in', 'Gehalt', '1500');
    await add('out', 'Miete', '450');
    await add('out', 'Versicherung', '120', '12');
    const t = await text('#view-fixed');
    expect(t.includes('1.500,00 €') && t.includes('Miete') && t.includes('10,00 €/Monat'), t.slice(0, 200));
    await shot('fixed');
  });

  await step('Einzelzahlungen in der Woche eintragen (Speichern + weitere)', async () => {
    await go('week');
    await page.click('.fab');
    await page.fill('#sheet-body [name=amount]', '12,50');
    await page.click('#sheet-body [data-cat=restaurant]');
    await page.fill('#sheet-body [name=date]', TODAY);
    await page.click('#sheet-body [data-more]');
    await page.waitForTimeout(200);
    expect(await page.inputValue('#sheet-body [name=amount]') === '', 'Betrag nicht geleert');
    await page.fill('#sheet-body [name=amount]', '40');
    await page.click('#sheet-body [data-cat=supermarkt]');
    await page.click('#sheet-body [type=submit]');
    await page.waitForSelector('#sheet-wrap', { state: 'hidden' });
    expect((await text('[data-weekout]')) === '52,50 €', await text('[data-weekout]'));
  });

  await step('Ohne Kategorie wird nicht gespeichert', async () => {
    await page.click('.fab');
    await page.fill('#sheet-body [name=amount]', '5');
    await page.click('#sheet-body [type=submit]');
    expect(await page.isVisible('[data-caterr]'), 'kein Hinweis');
    await page.click('#sheet-wrap .sheet-head [data-close]');
    await page.waitForSelector('#sheet-wrap', { state: 'hidden' });
  });

  await step('Eintrag bearbeiten und löschen mit Rückgängig', async () => {
    await page.click('#view-week [data-tx]');
    await page.fill('#sheet-body [name=amount]', '15');
    await page.click('#sheet-body [type=submit]');
    await page.waitForSelector('#sheet-wrap', { state: 'hidden' });
    expect((await text('[data-weekout]')) === '27,50 €', await text('[data-weekout]'));
    const n = await page.locator('#view-week [data-tx]').count();
    await page.locator('#view-week [data-tx]').first().click();
    await page.click('#sheet-body [data-del]');
    await page.waitForTimeout(200);
    expect(await page.locator('#view-week [data-tx]').count() === n - 1, 'nicht gelöscht');
    await page.click('#toast button');
    await page.waitForTimeout(200);
    expect(await page.locator('#view-week [data-tx]').count() === n, 'Rückgängig ging nicht');
  });

  await step('Woche abschließen', async () => {
    await page.click('[data-done]');
    await page.waitForTimeout(150);
    expect((await text('[data-done]')).includes('Abgeschlossen'), 'nicht abgeschlossen');
    await shot('week');
  });

  await step('Übersicht: Monatsbilanz-Prognose', async () => {
    await go('overview');
    const t = await text('#view-overview');
    expect(t.includes('Monatsbilanz'), 'keine Monatsbilanz');
    // 1500 - 450 - 120 - 55 - erwartet (Ø aus den bisherigen Tagen)
    expect(t.includes('+1.500,00 €') && t.includes('−570,00 €'), t.slice(0, 300));
    expect(t.includes('Supermarkt'), 'Kategorie fehlt');
  });

  await step('Kontostand eintragen -> Kontostand-Prognose', async () => {
    await page.click('[data-balance]');
    await page.fill('#sheet-body [name=amount]', '2000');
    await page.click('#sheet-body [type=submit]');
    await page.waitForSelector('#sheet-wrap', { state: 'hidden' });
    const t = await text('#view-overview');
    expect(t.includes('Kontostand Ende'), 'keine Kontostand-Prognose');
    expect(t.includes('Heute erwartet 2.000,00 €'), t.slice(0, 200));
    await shot('overview');
  });

  await step('Auswertung zeigt Monat und Verlauf', async () => {
    await go('stats');
    const t = await text('#view-stats');
    expect(t.includes('1.500,00 €') && t.includes('Supermarkt') && t.includes('Letzte 6 Monate'), t.slice(0, 200));
    await page.click('[data-prev]');
    expect(!(await text('[data-month-title]')).includes(String(today.getFullYear()) + 'x'), '');
    await page.click('[data-next]');
    await shot('stats');
  });

  await step('Export und Import', async () => {
    await go('more');
    const [dl] = await Promise.all([page.waitForEvent('download'), page.click('[data-export]')]);
    const file = await dl.path();
    const { readFileSync } = await import('node:fs');
    const data = JSON.parse(readFileSync(file, 'utf8'));
    expect(data.app === 'finanzplaner' && data.txs.length === 2 && data.recs.length === 3 && data.categories.length === 10, 'Export unvollständig');
    // Daten verändern, dann Import stellt wieder her
    await go('week');
    await page.locator('#view-week [data-tx]').first().click();
    await page.click('#sheet-body [data-del]');
    await go('more');
    const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.click('[data-import]')]);
    await chooser.setFiles(file);
    await page.click('#sheet-body [data-yes]');
    await page.waitForTimeout(400);
    await go('week');
    expect(await page.locator('#view-week [data-tx]').count() === 2, 'Import hat nicht wiederhergestellt');
    await shot('more');
  });

  await step('Daten bleiben nach Neuladen, App läuft offline', async () => {
    await page.reload();
    await page.waitForSelector('.tab.active');
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload(); await page.waitForSelector('.tab.active');
    await ctx.setOffline(true);
    await page.reload();
    await page.waitForSelector('.tab.active');
    await go('week');
    expect(await page.locator('#view-week [data-tx]').count() === 2, 'offline keine Daten');
    await ctx.setOffline(false);
  });

  await step('Keine JS-Fehler', async () => expect(errors.length === 0, errors.join(' | ')));
} finally {
  await browser.close();
  server.kill();
}
console.log(failed ? `\n${failed} Schritt(e) fehlgeschlagen` : '\nAlle Browser-Tests bestanden');
process.exit(failed ? 1 : 0);
