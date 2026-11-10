// Auswertung: Monat im Detail (Einnahmen, Fix, Variabel, Kategorien) und Verlauf der letzten 6 Monate
import { state, render, icon, catName } from '../core.js';
import { monthSummary, averageSpending, addMonths, monthName, monthShort, money, esc, todayKey, daysInMonth, inRange } from '../calc.js';

function trendChart(months, selected) {
  const W = 340, H = 150, top = 16, bottom = 24, gap = 10;
  const max = Math.max(1, ...months.map((m) => m.fixed + m.variable), ...months.map((m) => m.income));
  const bw = (W - gap * (months.length - 1)) / months.length;
  const y = (v) => top + (H - top - bottom) * (1 - v / max);
  const base = H - bottom;
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Ausgaben der letzten Monate">
    <line x1="0" x2="${W}" y1="${base}" y2="${base}" stroke="var(--line-2)" stroke-width="1"/>
    ${months.map((m, i) => {
      const x = i * (bw + gap);
      const hf = base - y(m.fixed), hv = base - y(m.variable);
      const sel = m.from === selected;
      const tip = `${monthName(m.from)}: Fix ${money(m.fixed)}, Variabel ${money(m.variable)}, Einnahmen ${money(m.income)}`;
      return `<g data-month="${m.from}" class="bar-g ${sel ? 'sel' : ''}"><title>${esc(tip)}</title>
        <rect x="${x}" y="${top - 6}" width="${bw}" height="${H - top}" fill="transparent"/>
        ${m.fixed ? `<rect x="${x + 4}" y="${base - hf}" width="${bw - 8}" height="${Math.max(0, hf)}" rx="2" fill="var(--ink-3)"/>` : ''}
        ${m.variable ? `<rect x="${x + 4}" y="${base - hf - hv}" width="${bw - 8}" height="${Math.max(0, hv - 2)}" rx="3" fill="var(--red)"/>` : ''}
        ${m.income ? `<line x1="${x + 1}" x2="${x + bw - 1}" y1="${y(m.income)}" y2="${y(m.income)}" stroke="var(--gold)" stroke-width="2.5" stroke-linecap="round"/>` : ''}
        <text x="${x + bw / 2}" y="${H - 6}" text-anchor="middle" font-size="11" font-weight="${sel ? 800 : 500}" fill="${sel ? 'var(--ink)' : 'var(--ink-2)'}">${monthShort(m.from)}</text></g>`;
    }).join('')}</svg>
    <div class="legend"><span><i style="background:var(--red)"></i>Variabel</span><span><i style="background:var(--ink-3)"></i>Fixkosten</span><span><i style="background:var(--gold);height:3px;vertical-align:3px"></i>Einnahmen</span></div>`;
}

export default {
  async render(el) {
    const m0 = state.month;
    const s = monthSummary(state, m0);
    const today = todayKey();
    const isCurrent = m0 === today.slice(0, 8) + '01';
    const avg = averageSpending(state.txs, today, state.settings.avgMonths);
    const dim = daysInMonth(+m0.slice(0, 4), +m0.slice(5, 7) - 1);
    const months = [];
    for (let i = 5; i >= 0; i--) months.push(monthSummary(state, addMonths(m0, -i)));
    const catIds = new Set([...Object.keys(s.byCat), ...Object.keys(avg.perCat)]);
    const cats = [...catIds].map((id) => ({ id, v: s.byCat[id] || 0, avg: Math.round((avg.perCat[id] || 0) * dim) })).filter((c) => c.v || c.avg).sort((a, b) => b.v - a.v || b.avg - a.avg);
    const maxC = Math.max(1, ...cats.map((c) => Math.max(c.v, c.avg)));
    const count = inRange(state.txs, s.from, s.to).filter((t) => t.type === 'out').length;

    el.innerHTML = `
      <div class="datebar">
        <button class="icon-btn" data-prev aria-label="Vorheriger Monat">${icon('left')}</button>
        <div class="date-btn"><span class="d1">${isCurrent ? 'Laufender Monat' : 'Monat'}</span><span class="d2" data-month-title>${esc(monthName(m0))}</span></div>
        <button class="icon-btn" data-next aria-label="Nächster Monat">${icon('right')}</button>
      </div>
      <div class="card">
        <div class="stat-grid">
          <div><span class="label">Einnahmen</span><b class="pos">${money(s.income)}</b></div>
          <div><span class="label">Fixkosten</span><b>${money(s.fixed)}</b></div>
          <div><span class="label">Variabel</span><b>${money(s.variable)}</b><small class="muted">${count} Zahlungen</small></div>
          <div><span class="label">Bilanz</span><b class="${s.net < 0 ? 'neg' : 'pos'}">${money(s.net, { sign: true })}</b></div>
        </div>
        ${isCurrent ? '<p class="small muted" style="margin:8px 0 0">Laufender Monat: bisher erfasst. Die Prognose steht in der Übersicht.</p>' : ''}
      </div>

      <h3 class="section-title label">Variable Ausgaben nach Kategorie</h3>
      <div class="card flat cat-list">
        ${cats.length ? cats.map((c) => `<div class="cat-row">
          <div class="cat-top"><span>${esc(catName(c.id))}</span><b>${money(c.v)}</b></div>
          <div class="meter single"><i style="width:${(c.v / maxC) * 100}%"></i>${c.avg ? `<em style="left:${(c.avg / maxC) * 100}%" title="Durchschnitt"></em>` : ''}</div>
          ${c.avg ? `<div class="cat-sub"><span>Ø ${money(c.avg, { round: true })}/Monat</span><span>${c.v > c.avg ? 'über' : 'unter'} Schnitt ${money(c.v - c.avg, { sign: true, round: true })}</span></div>` : ''}
        </div>`).join('') : '<p class="muted small" style="margin:0">Keine Ausgaben in diesem Monat.</p>'}
        ${cats.length && avg.basis !== 'none' ? `<p class="small muted" style="margin:6px 0 0">Goldener Strich = Ø pro Monat (Basis ${avg.days} Tag${avg.days === 1 ? '' : 'e'}${avg.days < 14 ? ' – noch wenig Daten, wird mit der Zeit genauer' : ''}).</p>` : ''}
      </div>

      <h3 class="section-title label">Letzte 6 Monate</h3>
      <div class="card">${trendChart(months, m0)}
        <table class="tbl"><thead><tr><th></th><th>Ein</th><th>Fix</th><th>Variabel</th><th>Bilanz</th></tr></thead><tbody>
        ${months.map((m) => `<tr class="${m.from === m0 ? 'sel' : ''}" data-month="${m.from}"><td>${monthShort(m.from)}</td><td>${money(m.income, { round: true })}</td><td>${money(m.fixed, { round: true })}</td><td>${money(m.variable, { round: true })}</td><td class="${m.net < 0 ? 'neg' : 'pos'}">${money(m.net, { sign: true, round: true })}</td></tr>`).join('')}
        </tbody></table>
      </div>`;

    el.querySelector('[data-prev]').onclick = () => { state.month = addMonths(m0, -1); render(); };
    el.querySelector('[data-next]').onclick = () => { state.month = addMonths(m0, 1); render(); };
    for (const g of el.querySelectorAll('[data-month]')) g.onclick = () => { state.month = g.dataset.month; render(); };
  },
};
