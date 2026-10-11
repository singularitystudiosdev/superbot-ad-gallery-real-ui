// Claude, the second opinion: a status chip checks the plan's line items (the count climbs to 14), a compact table
// lists them, one more line lands highlighted as missed (airport transfers, $60), the corrected total shows the plan
// is over budget, and a suggested swap brings it to $1,470, under budget. Pure function of t. Figures: ./data.js.
import { seg, outCubic, rise, sayLine, statusChip, money, CHECK } from './util.js';
import { ITEMS, MISSED, TOTAL, FIXED_TOTAL, FINAL_TOTAL, SWAP, BUDGET } from './data.js';
import { outBack } from '../../../lib.js';

const SAY = 'One line is missing from the plan, and it puts the trip over budget:';
const SWAP_NOTE = 'Swap and it fits:';

export default {
  times(r) {
    const T = { r };
    T.chip = r + 0.12;
    T.chipDone = r + 0.9;
    T.item = ITEMS.map((_, i) => r + 0.3 + i * 0.045);
    T.missed = T.chipDone + 0.15;
    T.total = T.missed + 0.55;
    T.swap = T.total + 0.55;
    T.fin = T.swap + 0.5;
    T.end = T.fin + 0.9;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = sayLine(x, SAY);
    const chip = statusChip(x, 'Checking the budget', 'Checked 14 line items', true);
    const cells = ITEMS.map(([n, c]) => x.el(`<div class="bd-it"><span>${x.esc(n)}</span><b>${money(c)}</b></div>`));
    const grid = x.el('<div class="bd-grid"></div>');
    cells.forEach((c) => grid.appendChild(c));
    const missed = x.el(`<div class="bd-miss"><span class="bd-miss-ic">!</span><span class="bd-miss-t"><b>${x.esc(MISSED[0])}</b><small>2 rides, not in the plan</small></span><b class="bd-miss-c">${money(MISSED[1])}</b><em>Missing</em></div>`);
    const table = x.el('<div class="bd-table"></div>');
    table.append(grid, missed);
    const total = x.el(`<div class="bd-total"><span>Corrected total</span><b><s>${money(TOTAL)}</s><i class="bd-t">${money(TOTAL)}</i></b><em>${money(FIXED_TOTAL - BUDGET)} over</em></div>`);
    const tN = total.querySelector('.bd-t'), tOld = total.querySelector('s'), tBadge = total.querySelector('em');
    const swap = x.el(`<div class="bd-swap"><span class="bd-swap-ic"><svg viewBox="0 0 24 24"><path d="M7 7h11l-3-3M17 17H6l3 3"/></svg></span><span class="bd-swap-t"><small>Suggested swap</small><b>${x.esc(SWAP.text)}</b></span><span class="bd-swap-d"><s>${money(SWAP.was)}</s><b>${money(SWAP.now)}</b></span></div>`);
    const fin = x.el(`<div class="bd-fin"><span class="bd-fin-ic"><svg viewBox="0 0 24 24"><path class="bd-fin-p" d="M5 12.5l4.5 4.5L19 7.5"/></svg></span><span class="bd-fin-t"><b>New total ${money(FINAL_TOTAL)}</b><small>Under budget by ${money(BUDGET - FINAL_TOTAL)}</small></span><span class="bd-fin-bar"><i></i></span></div>`);
    const ic = fin.querySelector('.bd-fin-ic'), path = fin.querySelector('.bd-fin-p'), bar = fin.querySelector('.bd-fin-bar i');
    const note = sayLine(x, SWAP_NOTE);
    return {
      nodes: [say.node, chip.node, table, total, note.node, swap, fin],
      marks: [[T.r, say.node], [T.chip, chip.node], [T.item[ITEMS.length - 1], grid], [T.missed, missed], [T.total, total], [T.swap, swap], [T.fin, fin]],
      render(t) {
        say.update(t, T.r + 0.05, 75);
        rise(chip.node, seg(t, T.chip, T.chip + 0.3));
        chip.update(t, T.chip, T.chipDone, `${Math.round(14 * outCubic(seg(t, T.chip + 0.1, T.chipDone)))} of 14`);
        cells.forEach((c, i) => rise(c, seg(t, T.item[i], T.item[i] + 0.3), 5));
        const mp = outCubic(seg(t, T.missed, T.missed + 0.4));
        missed.style.opacity = mp.toFixed(3);
        missed.style.transform = mp >= 1 ? '' : `translateY(${((1 - mp) * 10).toFixed(2)}px) scale(${(0.98 + 0.02 * mp).toFixed(4)})`;
        missed.classList.toggle('on', t >= T.missed + 0.25);
        const tp = outCubic(seg(t, T.total, T.total + 0.4));
        total.style.opacity = tp.toFixed(3);
        total.style.transform = tp >= 1 ? '' : `translateY(${((1 - tp) * 10).toFixed(2)}px)`;
        const tc = outCubic(seg(t, T.total + 0.1, T.total + 0.5));
        tN.textContent = money(TOTAL + (FIXED_TOTAL - TOTAL) * tc);
        tOld.style.opacity = (tc * 0.9).toFixed(3);
        tBadge.style.opacity = outCubic(seg(t, T.total + 0.3, T.total + 0.5)).toFixed(3);
        note.update(t, T.swap - 0.05, 90);
        rise(note.node, seg(t, T.swap - 0.05, T.swap + 0.2), 4);
        const sp = outCubic(seg(t, T.swap, T.swap + 0.45));
        swap.style.opacity = sp.toFixed(3);
        swap.style.transform = sp >= 1 ? '' : `translateY(${((1 - sp) * 12).toFixed(2)}px)`;
        const fp = outCubic(seg(t, T.fin, T.fin + 0.45));
        fin.style.opacity = fp.toFixed(3);
        fin.style.transform = fp >= 1 ? '' : `translateY(${((1 - fp) * 12).toFixed(2)}px) scale(${(0.97 + 0.03 * fp).toFixed(4)})`;
        ic.style.transform = `scale(${(0.5 + 0.5 * outBack(seg(t, T.fin + 0.08, T.fin + 0.4))).toFixed(3)})`;
        path.style.strokeDashoffset = (23 * (1 - outCubic(seg(t, T.fin + 0.14, T.fin + 0.46)))).toFixed(2);
        bar.style.width = `${(100 * (FINAL_TOTAL / BUDGET) * outCubic(seg(t, T.fin + 0.1, T.fin + 0.8))).toFixed(2)}%`;
      },
    };
  },
};
