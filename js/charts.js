// Selbst gezeichnete SVG-Diagramme
import { fmtKcal, fmtNum, esc } from './util.js';

export const COLORS = { kcal: '#26262a', protein: '#c8102e', fat: '#a8874a', carbs: '#8d877d' };
const STAR = 'M12 1.8l2.9 7.2 7.7.5-5.9 5 1.9 7.5L12 17.9 5.4 22l1.9-7.5-5.9-5 7.7-.5z';

// Fortschrittsring Ist/Ziel; status: open|met|exceeded|over
export function ring(value, goal, color, status) {
  const r = 34, c = 2 * Math.PI * r;
  const p = goal > 0 ? value / goal : 0;
  const shown = Math.min(1, p);
  const stroke = status === 'over' ? '#8d877d' : color;
  const pct = Math.round(p * 100);
  const extra = status === 'exceeded'
    ? `<path d="${STAR}" transform="translate(40 7) scale(.55) translate(-12 -12)" fill="#a8874a"/>`
    : status === 'over' ? `<circle cx="40" cy="40" r="${r + 5}" fill="none" stroke="#8d877d" stroke-width="1" stroke-dasharray="2 3"/>` : '';
  return `<svg viewBox="0 0 80 80" role="img" aria-label="${pct} Prozent">
    <circle cx="40" cy="40" r="${r}" fill="none" stroke="#e9e1d2" stroke-width="7"/>
    <circle cx="40" cy="40" r="${r}" fill="none" stroke="${stroke}" stroke-width="7" stroke-linecap="butt"
      stroke-dasharray="${(shown * c).toFixed(2)} ${c.toFixed(2)}" transform="rotate(-90 40 40)"/>
    ${extra}
    <text x="40" y="45" text-anchor="middle" font-size="15" font-weight="800" fill="#26262a">${pct}%</text>
  </svg>`;
}

// Kreisdiagramm (Donut) für Anteile; parts: [{label, value, color}]
export function donut(parts, centerTop = '', centerBottom = '') {
  const total = parts.reduce((s, p) => s + p.value, 0);
  const r = 42, c = 2 * Math.PI * r;
  let off = 0, segs = '';
  if (total > 0) for (const p of parts) {
    const len = (p.value / total) * c;
    segs += `<circle cx="60" cy="60" r="${r}" fill="none" stroke="${p.color}" stroke-width="16"
      stroke-dasharray="${len.toFixed(2)} ${(c - len).toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}" transform="rotate(-90 60 60)"/>`;
    off += len;
  }
  return `<svg class="chart" viewBox="0 0 120 120" style="max-width:150px" role="img" aria-label="Kalorienverteilung">
    <circle cx="60" cy="60" r="${r}" fill="none" stroke="#e9e1d2" stroke-width="16"/>${segs}
    <text x="60" y="58" text-anchor="middle" font-size="16" font-weight="800" fill="#26262a">${esc(centerTop)}</text>
    <text x="60" y="73" text-anchor="middle" font-size="8.5" letter-spacing="1.2" fill="#5f5b55">${esc(centerBottom)}</text>
  </svg>`;
}

// Gestapelter Querbalken (z. B. Ist- vs. Ziel-Verteilung)
export function splitBar(parts) {
  const total = parts.reduce((s, p) => s + p.value, 0) || 1;
  return `<div class="split">${parts.map((p) => `<i style="width:${(p.value / total) * 100}%;background:${p.color}"></i>`).join('')}</div>`;
}

// Balkendiagramm für 7 Tage mit Ziellinie; days: [{key, label, value, hl, today}]
export function weekBars(days, goal, { color = '#26262a', height = 150, unit = '', digits = 0, hlColor = '#a8874a' } = {}) {
  const W = 320, H = height, top = 16, bottom = 22, left = 4, right = 4;
  const max = Math.max(goal * 1.15, ...days.map((d) => d.value), 1);
  const ih = H - top - bottom, bw = (W - left - right) / days.length;
  const y = (v) => top + ih - (v / max) * ih;
  const fmt = (v) => (digits ? fmtNum(v, digits) : fmtKcal(v));
  let bars = '';
  days.forEach((d, i) => {
    const x = left + i * bw;
    const h = Math.max(0, top + ih - y(d.value));
    const fill = d.hl ? hlColor : color;
    bars += `<g class="wbar" data-day="${d.key}" style="cursor:pointer">
      <rect x="${x}" y="0" width="${bw}" height="${H}" fill="transparent"/>
      <rect x="${(x + bw * 0.18).toFixed(1)}" y="${y(d.value).toFixed(1)}" width="${(bw * 0.64).toFixed(1)}" height="${h.toFixed(1)}" fill="${fill}" opacity="${d.value ? (d.hl || fill !== color || hlColor !== color ? 1 : 0.42) : 0}"/>
      ${d.value ? `<text x="${(x + bw / 2).toFixed(1)}" y="${(y(d.value) - 4).toFixed(1)}" text-anchor="middle" font-size="9" font-weight="700" fill="#26262a">${fmt(d.value)}</text>` : ''}
      <text x="${(x + bw / 2).toFixed(1)}" y="${H - 6}" text-anchor="middle" font-size="10" font-weight="${d.today ? 800 : 600}" fill="${d.today ? '#c8102e' : '#5f5b55'}" letter-spacing=".5">${d.label}</text>
    </g>`;
  });
  const gy = y(goal).toFixed(1);
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Wochenverlauf">
    <line x1="0" x2="${W}" y1="${top + ih}" y2="${top + ih}" stroke="rgba(38,38,42,.28)" stroke-width="1"/>
    ${bars}
    <line x1="0" x2="${W}" y1="${gy}" y2="${gy}" stroke="#c8102e" stroke-width="1.2" stroke-dasharray="5 4"/>
    <text x="${W}" y="${gy - 4}" text-anchor="end" font-size="9" font-weight="700" fill="#c8102e">Ziel ${fmt(goal)}${unit}</text>
  </svg>`;
}
