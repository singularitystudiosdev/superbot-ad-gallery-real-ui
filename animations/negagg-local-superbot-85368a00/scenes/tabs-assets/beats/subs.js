// superbot-omni, the second ask: the same statement, searched for recurring charges. A status chip finds the five
// subscriptions, a table lists each with its icon, monthly price and when it was last used, two rows are flagged
// "Unused 3+ months" and a footer adds it up: $94 a month, of which $31 a month is unused. The five prices are the
// statement's Subscriptions line from the first breakdown. Pure function of t. Figures: ./data.js (invented).
import { seg, outCubic, rise, sayLine, statusChip, money, ICONS } from './util.js';
import { SUBS, SUBS_TOTAL, UNUSED_TOTAL } from './data.js';

const SAY = `${SUBS.length} recurring charges, ${money(SUBS_TOTAL)} a month. Two have sat unused for months:`;

export default {
  times(r) {
    const T = { r };
    T.chip = r + 0.12;
    T.chipDone = r + 0.8;
    T.say = T.chipDone + 0.05;
    T.row = SUBS.map((_, i) => T.chipDone + 0.15 + i * 0.22);
    T.flag = T.row[SUBS.length - 1] + 0.45;
    T.foot = T.flag + 0.3;
    T.end = T.foot + 0.7;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = sayLine(x, SAY);
    const chip = statusChip(x, 'Finding recurring charges', `Found ${SUBS.length} subscriptions`, true);
    const rows = SUBS.map((s) => x.el(`<div class="sb-row${s.idle ? ' sb-idle' : ''}">
      <span class="sb-ic">${ICONS[s.icon]}</span>
      <span class="sb-m"><b>${x.esc(s.name)}</b><em>${x.esc(s.kind)} · ${x.esc(s.last)}</em></span>
      <span class="sb-flag">Unused 3+ months</span>
      <span class="sb-p">${money(s.price)}<small>/mo</small></span>
    </div>`));
    const list = x.el('<div class="sb-list"></div>');
    rows.forEach((r) => list.appendChild(r));
    const foot = x.el(`<div class="sb-foot"><span class="sb-ft"><small>Total subscriptions</small><b>${money(SUBS_TOTAL)}/mo</b></span><span class="sb-un"><i class="sb-un-n">$0</i>/mo unused</span></div>`);
    const un = foot.querySelector('.sb-un-n'), unBox = foot.querySelector('.sb-un');
    const flags = rows.filter((_, i) => SUBS[i].idle);
    return {
      nodes: [chip.node, say.node, list, foot],
      marks: [[T.chip, chip.node], [T.row[SUBS.length - 1], list], [T.foot, foot]],
      render(t) {
        rise(chip.node, seg(t, T.chip, T.chip + 0.3));
        chip.update(t, T.chip, T.chipDone, `${Math.round(SUBS.length * outCubic(seg(t, T.chip + 0.1, T.chipDone)))} of ${SUBS.length}`);
        say.update(t, T.say, 75);
        rows.forEach((r, i) => rise(r, seg(t, T.row[i], T.row[i] + 0.34), 10));
        const fp = outCubic(seg(t, T.flag, T.flag + 0.35));
        flags.forEach((r) => { r.classList.toggle('on', fp > 0.05); r.style.setProperty('--f', fp.toFixed(3)); });
        rise(foot, seg(t, T.foot, T.foot + 0.35), 8);
        un.textContent = money(UNUSED_TOTAL * outCubic(seg(t, T.foot + 0.1, T.foot + 0.6)));
        unBox.style.transform = `scale(${(1 + 0.06 * Math.sin(Math.PI * seg(t, T.foot + 0.5, T.foot + 0.85))).toFixed(4)})`;
      },
    };
  },
};
