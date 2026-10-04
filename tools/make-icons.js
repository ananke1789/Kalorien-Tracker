// Erzeugt die App-Icons als PNG ohne externe Abhängigkeiten: node tools/make-icons.js
// Motiv: fünfzackiger Stern, Goldring, diagonaler Akzent – passend zum App-Design.
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'icons');
const PAPER = [243, 237, 226], RED = [200, 16, 46], GOLD = [168, 135, 74];

// Sternpolygon (Mittelpunkt 0,0; Radius 1)
function starPoly(r = 1, inner = 0.382) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * inner : r;
    pts.push([Math.cos(a) * rr, Math.sin(a) * rr]);
  }
  return pts;
}
function inPoly(x, y, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
const STAR = starPoly();

// Farbe an Punkt (u,v in 0..1) je Variante
function shade(u, v, maskable) {
  const cx = u - 0.5, cy = v - 0.5;
  const d = Math.hypot(cx, cy);
  if (maskable) {
    // vollflächig rot; Inhalt innerhalb der sicheren Zone (Radius 0,4)
    if (inPoly(cx / 0.25, (cy - 0.012) / 0.25, STAR)) return PAPER;
    if (d > 0.33 && d < 0.345) return GOLD;
    return RED;
  }
  // abgerundetes Quadrat in Papierton
  const r = 0.2, m = 0.02;
  const qx = Math.max(Math.abs(cx) - (0.5 - m - r), 0), qy = Math.max(Math.abs(cy) - (0.5 - m - r), 0);
  if (Math.hypot(qx, qy) > r) return null; // transparent
  // diagonaler Akzent oben rechts
  if (u + (1 - v) > 1.55 && u + (1 - v) < 1.62) return GOLD;
  if (u + (1 - v) >= 1.66) return RED;
  if (inPoly(cx / 0.3, (cy - 0.015) / 0.3, STAR)) return RED;
  if (d > 0.375 && d < 0.39) return GOLD;
  return PAPER;
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
