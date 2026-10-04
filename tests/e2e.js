// Browser-Test mit Playwright: node tests/e2e.js
// Startet einen lokalen Server, öffnet die App in Chromium (Handy-Format) und prüft die Kernabläufe.
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

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
  try { await fn(); console.log('✓', name); } catch (e) { failed++; console.log('✗', name, '\n   ', e.message.split('\n')[0]); }
};
const expect = (cond, msg) => { if (!cond) throw new Error(msg); };

await new Promise((r) => setTimeout(r, 700));
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'de-DE' });
const page = await ctx.newPage();
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

try {
  await page.goto(URL);
  await page.waitForSelector('.tab.active');

  await step('Navigation über alle Tabs', async () => {
    for (const t of ['foods', 'stats', 'goals', 'today']) {
      await page.click(`.tab[data-tab="${t}"]`);
      expect(await page.isVisible(`#view-${t}`), `View ${t} nicht sichtbar`);
    }
  });

  const extra = (await import('./e2e-steps.js').catch(() => null))?.default;
  if (extra) await extra({ page, step, expect, ctx, URL });

  await step('Keine JS-Fehler', async () => expect(errors.length === 0, errors.join(' | ')));
} finally {
  await browser.close();
  server.kill();
}
console.log(failed ? `${failed} Schritt(e) fehlgeschlagen` : 'E2E OK');
process.exit(failed ? 1 : 0);
