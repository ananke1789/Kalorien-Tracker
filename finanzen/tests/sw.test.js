// Prüft, dass alle ausgelieferten Dateien im Service-Worker-Cache stehen: node tests/sw.test.js
import { readFileSync, existsSync, readdirSync } from 'node:fs';

const sw = readFileSync('sw.js', 'utf8');
const list = JSON.parse('[' + sw.match(/const FILES = \[([\s\S]*?)\];/)[1].replace(/'/g, '"').replace(/,\s*$/, '') + ']');
const shipped = ['index.html', 'styles.css', 'manifest.webmanifest',
  ...readdirSync('js').filter((f) => f.endsWith('.js')).map((f) => 'js/' + f),
  ...readdirSync('js/views').map((f) => 'js/views/' + f), ...readdirSync('icons').map((f) => 'icons/' + f)];
const missing = shipped.filter((f) => !list.includes(f));
const dead = list.filter((f) => f !== './' && !existsSync(f));
if (missing.length || dead.length) {
  console.log('✗ Service-Worker-Liste', missing.length ? '\n   fehlt: ' + missing.join(', ') : '', dead.length ? '\n   existiert nicht: ' + dead.join(', ') : '');
  process.exit(1);
}
console.log('✓ Service-Worker-Liste vollständig (' + list.length + ' Dateien)');
