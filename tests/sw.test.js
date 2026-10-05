// Prüft, dass alle ausgelieferten Dateien im Service-Worker-Cache stehen und existieren
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import assert from 'node:assert/strict';
const sw = readFileSync('sw.js', 'utf8');
const list = JSON.parse('[' + sw.match(/const FILES = \[([\s\S]*?)\];/)[1].replace(/'/g, '"').replace(/,\s*$/, '') + ']');
for (const f of list) if (f !== './') assert.ok(existsSync(f), 'fehlt: ' + f);
const shipped = ['index.html', 'styles.css', 'manifest.webmanifest',
  ...readdirSync('js').filter((f) => f.endsWith('.js')).map((f) => 'js/' + f),
  ...readdirSync('js/views').map((f) => 'js/views/' + f), ...readdirSync('js/training').map((f) => 'js/training/' + f), ...readdirSync('icons').map((f) => 'icons/' + f)];
for (const f of shipped) assert.ok(list.includes(f), 'nicht im Cache: ' + f);
const m = JSON.parse(readFileSync('manifest.webmanifest', 'utf8'));
assert.equal(m.name, 'Tagesplan'); assert.equal(m.display, 'standalone');
assert.ok(m.icons.some((i) => i.purpose === 'maskable' && i.sizes === '512x512'));
assert.ok(!/(src|href)="\//.test(readFileSync('index.html', 'utf8')), 'absolute Pfade in index.html');
console.log(`OK: Service Worker cached ${list.length} Dateien, Manifest gültig`);
