// Fixkosten: wiederkehrende Zahlungen (Ausgaben und Einnahmen) mit Intervall, Fälligkeitstag, Betragsänderungen ab Datum
import * as db from '../db.js';
import { state, fab, openSheet, confirmDialog, refresh, toast, moneyField, readMoney, seg, bindSeg, emptyState } from '../core.js';
import { INTERVALS, FIXED_GROUPS, INCOME_GROUPS, todayKey, money, esc, uid, currentAmount, monthlyEquivalent, shortDate, addDays, occurrences, parseMoney } from '../calc.js';

const intervalName = (n) => (INTERVALS.find((i) => i.months === n) || INTERVALS[0]).name;
const isEnded = (r, today) => r.end && r.end < today;

function recSheet(rec = null) {
  const today = todayKey();
  const isNew = !rec;
  const r = rec || { type: 'out', name: '', every: 1, day: +today.slice(8), start: today, end: '', group: '', amounts: [] };
  const amount0 = isNew ? null : currentAmount(r, today);
  let type = r.type;
  const groups = () => (type === 'in' ? INCOME_GROUPS : FIXED_GROUPS);
  openSheet({
    title: isNew ? 'Wiederkehrende Zahlung' : 'Zahlung bearbeiten',
    html: `<form class="form" novalidate>
      ${seg('type', [['out', 'Ausgabe'], ['in', 'Einnahme']], type)}
      <label class="field"><span>Name</span><input class="input" name="name" maxlength="60" value="${esc(r.name)}" placeholder="z. B. Miete, Spotify, Gehalt" ${isNew ? 'autofocus' : ''}></label>
      ${moneyField('amount', 'Betrag pro Zahlung', amount0)}
      <label class="field" data-from hidden><span>Neuer Betrag gilt ab</span><input class="input" type="date" name="from" value="${today}"></label>
      <div class="grid2">
        <label class="field"><span>Intervall</span><select class="input" name="every">${INTERVALS.map((i) => `<option value="${i.months}" ${i.months === r.every ? 'selected' : ''}>${i.name}</option>`).join('')}</select></label>
        <label class="field"><span>Tag im Monat</span><input class="input" name="day" type="number" min="1" max="31" inputmode="numeric" value="${r.day}"></label>
      </div>
      <label class="field"><span>Gruppe</span><input class="input" name="group" list="groups" value="${esc(r.group || '')}" placeholder="frei wählbar"><datalist id="groups"></datalist></label>
      <div class="grid2">
        <label class="field"><span>Erste Zahlung</span><input class="input" type="date" name="start" value="${esc(r.start)}"></label>
        <label class="field"><span>Letzte (optional)</span><input class="input" type="date" name="end" value="${esc(r.end || '')}"></label>
      </div>
      <p class="small muted" style="margin:0">Bei vierteljährlich/jährlich bestimmt der Monat der ersten Zahlung den Rhythmus. Fällt der Tag nicht in den Monat (z. B. 31.), zählt der letzte Tag.</p>
      <div class="sheet-actions">${isNew ? `<button class="btn primary block" type="submit">Speichern</button>`
        : `<div class="btn-row"><button class="btn danger" type="button" data-del>Löschen</button><button class="btn primary" type="submit">Speichern</button></div>
           ${!r.end ? `<button class="btn ghost block" type="button" data-stop>Ab heute beenden (gekündigt)</button>` : ''}`}</div>
    </form>`,
    onMount(el, close) {
      const form = el.querySelector('form');
      const dl = el.querySelector('#groups');
      const fillGroups = () => { dl.innerHTML = groups().map((g) => `<option value="${esc(g)}">`).join(''); };
      fillGroups();
      bindSeg(el, 'type', (v) => { type = v; fillGroups(); });
      if (!isNew) form.amount.oninput = () => { el.querySelector('[data-from]').hidden = form.amount.value === '' || parseMoney(form.amount.value) === amount0; };
      form.onsubmit = async (e) => {
        e.preventDefault();
        const name = form.name.value.trim();
        form.name.classList.toggle('invalid', !name);
        const amount = readMoney(form.amount);
        const day = Math.min(31, Math.max(1, parseInt(form.day.value, 10) || 1));
        const start = form.start.value, end = form.end.value;
        form.start.classList.toggle('invalid', !start);
        form.end.classList.toggle('invalid', !!end && end < start);
        if (!name || amount == null || !start || (end && end < start)) return;
        let amounts = [...(r.amounts || [])];
        if (isNew || !amounts.length) amounts = [{ from: start, amount }];
        else if (amount !== amount0) {
          const from = form.from.value || today;
          amounts = amounts.filter((a) => a.from < from);
          if (from <= start || !amounts.length) amounts = [{ from: start, amount }];
          else amounts.push({ from, amount });
        }
        const obj = { ...(rec || { id: uid(), at: Date.now() }), type, name, every: +form.every.value, day, start, end, group: form.group.value.trim(), amounts };
        await db.put('recs', obj);
        close(); await refresh(); toast(isNew ? 'Angelegt' : 'Geändert');
      };
      const delBtn = el.querySelector('[data-del]');
      if (delBtn) delBtn.onclick = async () => {
        if (!(await confirmDialog(`„${r.name}“ löschen? Die Zahlung verschwindet auch aus vergangenen Monaten. Wenn sie nur gekündigt ist, besser „beenden“.`))) return;
        await db.del('recs', r.id); await refresh();
        toast('Gelöscht', { label: 'Rückgängig', fn: async () => { await db.put('recs', rec); await refresh(); } });
      };
      const stop = el.querySelector('[data-stop]');
      if (stop) stop.onclick = async () => {
        await db.put('recs', { ...rec, end: today }); close(); await refresh(); toast('Beendet – bleibt in der Historie');
      };
    },
  });
}

export default {
  async render(el) {
    const today = todayKey();
    const active = state.recs.filter((r) => !isEnded(r, today));
    const ended = state.recs.filter((r) => isEnded(r, today));
    const sum = (type) => active.filter((r) => r.type === type && r.start <= today).reduce((s, r) => s + monthlyEquivalent(r, today), 0);
    const outM = sum('out'), inM = sum('in');
    const nextDue = (r) => occurrences(r, today, addDays(today, 400))[0];

    const section = (type, title) => {
      const list = active.filter((r) => r.type === type);
      if (!list.length) return '';
      const groups = {};
      for (const r of list) (groups[r.group || 'Ohne Gruppe'] ||= []).push(r);
      return `<h3 class="section-title label">${title}</h3>` + Object.entries(groups).sort().map(([g, rs]) => `
        <div class="card flat"><div class="pick-head">${esc(g)} · ${money(rs.reduce((s, r) => s + monthlyEquivalent(r, today), 0))}/Monat</div>
        ${rs.sort((a, b) => currentAmount(b) - currentAmount(a)).map((r) => {
          const n = nextDue(r);
          return `<button class="entry" data-rec="${esc(r.id)}"><div class="main"><div class="nm">${esc(r.name)}</div>
            <div class="sub">${intervalName(r.every)}, am ${r.day}.${n ? ` · nächste ${shortDate(n.date)}` : ''}${r.start > today ? ' · startet später' : ''}${r.end ? ` · bis ${shortDate(r.end)}` : ''}</div></div>
            <div class="kc ${type === 'in' ? 'pos' : ''}">${money(currentAmount(r, today))}${r.every > 1 ? `<small>${money(monthlyEquivalent(r, today))}/Monat</small>` : ''}</div></button>`;
        }).join('')}</div>`).join('');
    };

    el.innerHTML = `
      <div class="card">
        <div class="split-num">
          <div><b class="pos">${money(inM)}</b><small>Einnahmen</small></div>
          <div><b>${money(outM)}</b><small>Fixkosten</small></div>
          <div><b class="${inM - outM < 0 ? 'neg' : ''}">${money(inM - outM, { sign: true })}</b><small>Bleibt</small></div>
        </div>
        <p class="small muted" style="margin:8px 0 0">Beträge pro Monat; „Bleibt“ ist, was für variable Ausgaben übrig ist. Vierteljährliche/jährliche Zahlungen sind auf den Monat umgerechnet. In Prognose und Woche zählen sie am Fälligkeitstag.</p>
      </div>
      ${state.recs.length ? '' : emptyState('Noch keine Fixkosten', 'Miete, Handy, Abos, Versicherungen – und als Einnahme z. B. Gehalt.')}
      ${section('in', 'Regelmäßige Einnahmen')}
      ${section('out', 'Fixkosten & Abos')}
      ${ended.length ? `<h3 class="section-title label">Beendet</h3><div class="card flat">${ended.map((r) => `<button class="entry muted" data-rec="${esc(r.id)}"><div class="main"><div class="nm">${esc(r.name)}</div><div class="sub">bis ${shortDate(r.end)}</div></div><div class="kc">${money(currentAmount(r, r.end))}</div></button>`).join('')}</div>` : ''}`;

    for (const b of el.querySelectorAll('[data-rec]')) b.onclick = () => recSheet(state.recs.find((r) => r.id === b.dataset.rec));
    fab('Fixkosten', () => recSheet());
  },
};
