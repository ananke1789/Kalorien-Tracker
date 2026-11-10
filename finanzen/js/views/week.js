// Woche: Kontoeinzüge Woche für Woche eintragen, Woche abschließen, Kontostand abgleichen
import { state, fab, txSheet, balanceSheet, icon, catName, weekDone, setWeekDone, render, toast } from '../core.js';
import { weekSummary, averageSpending, todayKey, addDays, money, dayLabel, shortDate, isoWeek, esc, weekStart, anchorBalance } from '../calc.js';

export default {
  async render(el) {
    const today = todayKey();
    const w = weekSummary(state, state.week);
    const avg = averageSpending(state.txs, today, state.settings.avgMonths);
    const avgWeek = Math.round(avg.perDay * 7);
    const isCurrent = w.from === weekStart(today);
    const done = weekDone(w.from);
    const lastBal = anchorBalance(state.balances, w.to);
    const balInWeek = lastBal && lastBal.date >= w.from ? lastBal : null;

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = addDays(w.from, i);
      const tx = w.txs.filter((t) => t.date === d);
      const fx = w.fixed.filter((o) => o.date === d);
      days.push({ d, tx, fx });
    }
    const cats = Object.entries(w.byCat).sort((a, b) => b[1] - a[1]);
    const defaultDate = isCurrent ? today : w.to < today ? w.to : w.from;

    el.innerHTML = `
      <div class="datebar">
        <button class="icon-btn" data-prev aria-label="Vorherige Woche">${icon('left')}</button>
        <div class="date-btn"><span class="d1">KW ${isoWeek(w.from)}${isCurrent ? ' · diese Woche' : ''}</span><span class="d2">${shortDate(w.from).slice(0, 6)} – ${shortDate(w.to)}</span></div>
        <button class="icon-btn" data-next aria-label="Nächste Woche">${icon('right')}</button>
      </div>

      <div class="card">
        <div class="split-num">
          <div><b data-weekout>${money(w.out)}</b><small>Ausgaben</small></div>
          <div><b>${avgWeek ? money(avgWeek) : '–'}</b><small>Ø pro Woche</small></div>
          <div><b class="${avgWeek && w.out > avgWeek ? 'neg' : 'pos'}">${avgWeek ? money(w.out - avgWeek, { sign: true }) : '–'}</b><small>zum Schnitt</small></div>
        </div>
        ${w.in ? `<p class="small muted" style="margin:8px 0 0">Einzel-Einnahmen: ${money(w.in)}</p>` : ''}
        <div class="btn-row" style="margin-top:12px">
          <button class="btn ${done ? 'gold' : ''}" data-done>${icon('check')}${done ? 'Abgeschlossen' : 'Woche abschließen'}</button>
          <button class="btn" data-balance>${icon('bank')}Kontostand</button>
        </div>
        ${balInWeek ? `<p class="small muted" style="margin:8px 0 0">Kontostand ${money(balInWeek.amount)} am ${shortDate(balInWeek.date)} eingetragen.</p>` : ''}
      </div>

      <div class="card flat days">
        ${days.map(({ d, tx, fx }) => `<div class="day ${d === today ? 'today' : ''}">
          <div class="day-head"><span>${dayLabel(d)}</span>
            <span class="day-sum">${tx.length ? money(tx.reduce((s, t) => s + (t.type === 'out' ? -t.amount : t.amount), 0), { sign: true }) : ''}</span>
            <button class="icon-btn sm" data-add="${d}" aria-label="Zahlung am ${dayLabel(d)} hinzufügen">${icon('plus')}</button></div>
          ${tx.map((t) => `<button class="entry" data-tx="${esc(t.id)}"><div class="main"><div class="nm">${esc(t.type === 'in' ? (t.note || 'Einnahme') : catName(t.catId))}</div>${t.note && t.type === 'out' ? `<div class="sub">${esc(t.note)}</div>` : ''}</div>
            <div class="kc ${t.type === 'in' ? 'pos' : ''}">${money(t.type === 'in' ? t.amount : -t.amount, { sign: true })}</div></button>`).join('')}
          ${fx.map((o) => `<div class="entry fixed"><div class="main"><div class="nm">${esc(o.rec.name)} <span class="badge">fix</span></div></div><div class="kc ${o.rec.type === 'in' ? 'pos' : ''}">${money(o.rec.type === 'in' ? o.amount : -o.amount, { sign: true })}</div></div>`).join('')}
        </div>`).join('')}
      </div>

      ${cats.length ? `<h3 class="section-title label">Nach Kategorie</h3>
      <div class="card flat">${cats.map(([id, v]) => `<div class="lrow"><div><span>${esc(catName(id))}</span>${avg.perCat[id] ? `<small>Ø ${money(Math.round(avg.perCat[id] * 7))}/Woche</small>` : ''}</div><b>${money(v)}</b></div>`).join('')}</div>` : ''}`;

    el.querySelector('[data-prev]').onclick = () => { state.week = addDays(state.week, -7); render(); };
    el.querySelector('[data-next]').onclick = () => { state.week = addDays(state.week, 7); render(); };
    el.querySelector('[data-balance]').onclick = () => balanceSheet({ expectedAt: w.to < today ? w.to : today });
    el.querySelector('[data-done]').onclick = async () => {
      await setWeekDone(w.from, !done); await render();
      if (!done) toast(`KW ${isoWeek(w.from)} abgeschlossen`);
    };
    for (const b of el.querySelectorAll('[data-add]')) b.onclick = () => txSheet(null, { date: b.dataset.add });
    for (const b of el.querySelectorAll('[data-tx]')) b.onclick = () => txSheet(state.txs.find((t) => t.id === b.dataset.tx));
    fab('Eintrag', () => txSheet(null, { date: defaultDate }));
  },
};
