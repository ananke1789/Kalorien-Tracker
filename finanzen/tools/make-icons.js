// Erzeugt die App-Icons als PNG ohne externe Abhängigkeiten: node tools/make-icons.js
// Motiv: Münze (Papierton, Goldring) mit drei steigenden roten Balken auf Anthrazit.
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'icons');
const PAPER = [243, 237, 226], RED = [200, 16, 46], GOLD = [168, 135, 74], INK = [38, 38, 42];

// Münze mit Balken; s = Skalierung (1 = normal)
function coin(cx, cy, s) {
  const d = Math.hypot(cx, cy) / s;
  if (d > 0.36) return null;
  if (d > 0.335) return GOLD;
  if (d > 0.315) return PAPER;
  if (d > 0.3) return GOLD;
  const x = cx / s, y = cy / s;
  const bars = [[-0.17, -0.07, 0.04], [-0.05, 0.05, -0.06], [0.07, 0.17, -0.17]]; // [x0, x1, oben]
  for (const [x0, x1, top] of bars) if (x >= x0 && x <= x1 && y >= top && y <= 0.15) return RED;
  if (y > 0.165 && y < 0.185 && x > -0.2 && x < 0.2) return INK;
  return PAPER;
}
function shade(u, v, maskable) {
  const cx = u - 0.5, cy = v - 0.5;
  if (maskable) return coin(cx, cy, 0.95) || INK;
  const r = 0.2, m = 0.02;
  const qx = Math.max(Math.abs(cx) - (0.5 - m - r), 0), qy = Math.max(Math.abs(cy) - (0.5 - m - r), 0);
  if (Math.hypot(qx, qy) > r) return null;
  if (u + (1 - v) > 1.55 && u + (1 - v) < 1.62) return GOLD;
  if (u + (1 - v) >= 1.66) return RED;
  return coin(cx, cy, 1.02) || INK;
}
function render(size, maskable) {
  const S = 4; // Supersampling
  const px = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let r = 0, g = 0, b = 0, a = 0;
    for (let sy = 0; sy < S; sy++) for (let sx = 0; sx < S; sx++) {
      const c = shade((x + (sx + 0.5) / S) / size, (y + (sy + 0.5) / S) / size, maskable);
      if (c) { r += c[0]; g += c[1]; b += c[2]; a++; }
    }
    const i = (y * size + x) * 4;
    if (a) { px[i] = r / a; px[i + 1] = g / a; px[i + 2] = b / a; }
    px[i + 3] = Math.round((a / (S * S)) * 255);
  }
  return png(size, size, px);
}

// ---------- minimaler PNG-Encoder ----------
const CRC = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; });
const crc32 = (buf) => { let c = -1; for (const b of buf) c = CRC[(c ^ b) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(w, h, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

mkdirSync(OUT, { recursive: true });
for (const [name, size, mask] of [['icon-192.png', 192, false], ['icon-512.png', 512, false], ['maskable-192.png', 192, true], ['maskable-512.png', 512, true]]) {
  writeFileSync(path.join(OUT, name), render(size, mask));
  console.log('geschrieben:', name);
}
