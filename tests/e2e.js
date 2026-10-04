// Browser-Test mit Playwright: node tests/e2e.js
// Startet einen lokalen Server, öffnet die App in Chromium (Handy-Format) und prüft die Kernabläufe.
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import * as steps from './e2e-steps.js';
const { go } = steps;

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require(process.env.PLAYWRIGHT_PATH || '/opt/node-tools/node_modules/playwright')); }

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 8765;
const server = spawn('python3', ['-m', 'http.server', String(PORT)], { cwd: root, stdio: 'ignore' });
const URL = `http://localhost:${PORT}/`;
const errors = [];
let failed = 0;
const step = async (name, fn) => {
  try { await fn(); console.log('✓', name); } catch (e) {
    failed++; console.log('✗', name, '\n   ', (process.env.VERBOSE ? e.message : e.message.split('\n')[0]));
    if (process.env.SHOTS) await page.screenshot({ path: path.join(process.env.SHOTS, `fail-${failed}.png`) }).catch(() => {});
  }
};
const expect = (cond, msg) => { if (!cond) throw new Error(msg); };

await new Promise((r) => setTimeout(r, 700));
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'de-DE' });
const page = await ctx.newPage();
page.setDefaultTimeout(5000);
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

try {
  await page.goto(URL);
  await page.waitForSelector('.tab.active');

  await step('Navigation über alle Tabs', async () => {
    for (const t of ['foods', 'stats', 'goals', 'today']) {
      await go(page, t);
      expect(await page.isVisible(`#view-${t}`), `View ${t} nicht sichtbar`);
    }
  });

  
  for (const fn of steps.ORDER) await fn({ page, step, expect, ctx, URL });

  if (process.env.SHOTS) { // Screenshots: SHOTS=verzeichnis node tests/e2e.js
    for (const t of ['today', 'foods', 'stats', 'goals']) {
      await go(page, t); await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(process.env.SHOTS, `${t}.png`), fullPage: true });
    }
  }
  await step('Keine JS-Fehler', async () => expect(errors.length === 0, errors.join(' | ')));
} finally {
  await browser.close();
  server.kill();
}
console.log(failed ? `${failed} Schritt(e) fehlgeschlagen` : 'E2E OK');
process.exit(failed ? 1 : 0);
