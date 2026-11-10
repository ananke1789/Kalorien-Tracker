// Übersicht: Prognose für das Monatsende, frei verfügbar pro Tag, Kategorien, nächste Fixkosten
import { state, activeCats, fab, txSheet, balanceSheet, navigate, icon, weekDone, lastWeek } from '../core.js';
import { forecastMonth, todayKey, money, monthName, shortDate, addDays, esc, occurrences, dayLabel, isoWeek } from '../calc.js';

export default {
  async render(el) {
    const today = todayKey();
    const f = forecastMonth({ ...state, categories: activeCats(), today, avgMonths: state.settings.avgMonths });
    const lw = lastWeek();
    // Erinnerung erst, wenn es schon Einträge bis zur letzten Woche gibt
    const hasData = Object.keys(state.weeksDone).length > 0 || state.txs.some((t) => t.date <= addDays(lw, 6));

    const hero = f.balance
      ? `<div class="label red">Kontostand Ende ${esc(monthName(today).split(' ')[0])} (Prognose)</div>
         <div class="big-num ${f.balance.end < 0 ? 'neg' : ''}" data-hero>${money(f.balance.end)}</div>
         <div class="small muted">Heute erwartet ${money(f.balance.today)} · Stand ${money(f.balance.anchor.amount)} vom ${shortDate(f.balance.anchor.date)}</div>`
      : `<div class="label red">Monatsbilanz ${esc(monthName(today))} (Prognose)</div>
         <div class="big-num ${f.net < 0 ? 'neg' : ''}" data-hero>${money(f.net, { sign: true })}</div>
         <div class="small muted">Einnahmen minus Fixkosten minus variable Ausgaben. Für eine Kontostand-Prognose einmal den Kontostand eintragen.</div>`;

    const avgTxt = f.avg.basis === 'none' ? 'noch keine Ausgaben erfasst'
      : `Ø ${money(Math.round(f.avg.perDay))}/Tag (${shortDate(f.avg.from)}–${shortDate(f.avg.to)}${f.avg.basis === 'short' ? ', noch wenig Daten' : ''})`;

    const rows = [
      ['Einnahmen', f.income, ''],
      ['Fixkosten', -f.fixed, f.fixedOpen ? `davon noch offen ${money(f.fixedOpen)}` : ''],
      ['Variable Ausgaben bisher', -f.spent, ''],
      ['Erwartet bis Monatsende', -f.expectedRest, `${f.daysLeft} Tage · ${avgTxt}`],
    ];

    const upcoming = state.recs.flatMap((r) => occurrences(r, addDays(today, 1), addDays(today, 30)))
      .sort((a, b) => (a.date < b.date ? -1 : 1)).slice(0, 6);

    const cats = f.cats.filter((c) => c.spent || c.projected || c.budget).sort((a, b) => b.projected - a.projected);

    el.innerHTML = `
      ${!weekDone(lw) && hasData ? `<button class="hint warn row-btn" data-lastweek>${icon('cal')}<span><b>KW ${isoWeek(lw)} noch nicht abgeschlossen.</b><br>Kontoeinzüge der letzten Woche eintragen →</span></button>` : ''}
      <div class="card">${hero}
        <hr class="rule">
        <div class="ledger">${rows.map(([k, v, sub]) => `<div class="lrow"><div><span>${k}</span>${sub ? `<small>${esc(sub)}</small>` : ''}</div><b class="${v < 0 ? '' : 'pos'}">${money(v, { sign: true })}</b></div>`).join('')}
          <div class="lrow total"><div><span>Bilanz ${esc(monthName(today).split(' ')[0])}</span></div><b class="${f.net < 0 ? 'neg' : 'pos'}">${money(f.net, { sign: true })}</b></div>
        </div>
        <div class="btn-row" style="margin-top:12px"><button class="btn" data-balance>${icon('bank')}Kontostand eintragen</button></div>
      </div>

      <div class="card">
        <div class="label">Frei verfügbar bis Monatsende</div>
        <div class="split-num"><div><b class="${f.perDayAvailable < 0 ? 'neg' : ''}" data-perday>${money(f.perDayAvailable)}</b><small>pro Tag</small></div>
          <div><b>${money(f.perDayAvailable * 7)}</b><small>pro Woche</small></div>
          <div><b>${money(f.available)}</b><small>gesamt</small></div></div>
        <p class="small muted" style="margin:8px 0 0">${f.balance ? 'Erwarteter Kontostand' : 'Einnahmen'} nach allen Fixkosten bis ${shortDate(f.to)}, geteilt durch ${f.daysLeft + 1} Tage (inkl. heute).</p>
      </div>

      <h3 class="section-title label">Kategorien diesen Monat</h3>
      <div class="card flat cat-list">
        ${cats.length ? cats.map((c) => {
          const ref = c.budget || c.avgMonth || c.projected || 1;
          const over = c.budget && c.projected > c.budget;
          return `<div class="cat-row">
            <div class="cat-top"><span>${esc(c.cat.name)}</span><b>${money(c.spent)}</b></div>
            <div class="meter"><i style="width:${Math.min(100, (c.spent / ref) * 100)}%"></i><s style="width:${Math.min(100, (c.projected / ref) * 100)}%"></s></div>
            <div class="cat-sub"><span>Prognose ${money(c.projected, { round: true })}${c.avgMonth ? ` · Ø ${money(c.avgMonth, { round: true })}` : ''}</span>
              ${c.budget ? `<span class="${over ? 'neg' : ''}">Budget ${money(c.budget, { round: true })}${over ? ' – wird überschritten' : ''}</span>` : ''}</div></div>`;
        }).join('') : `<p class="muted small" style="margin:0">Noch keine Ausgaben in diesem Monat.</p>`}
      </div>

      <h3 class="section-title label">Nächste Fixkosten & Einnahmen (30 Tage)</h3>
      <div class="card flat">
        ${upcoming.length ? upcoming.map((o) => `<div class="lrow"><div><span>${esc(o.rec.name)}</span><small>${dayLabel(o.date)}</small></div><b class="${o.rec.type === 'in' ? 'pos' : ''}">${money(o.rec.type === 'in' ? o.amount : -o.amount, { sign: true })}</b></div>`).join('')
          : `<p class="muted small" style="margin:0">Keine wiederkehrenden Zahlungen angelegt. <button class="link" data-gofixed>Fixkosten anlegen</button></p>`}
      </div>`;

    el.querySelector('[data-balance]').onclick = () => balanceSheet();
    const lwb = el.querySelector('[data-lastweek]');
    if (lwb) lwb.onclick = () => { state.week = lw; navigate('week'); };
    const gf = el.querySelector('[data-gofixed]');
    if (gf) gf.onclick = () => navigate('fixed');
    fab('Ausgabe', () => txSheet());
  },
};
