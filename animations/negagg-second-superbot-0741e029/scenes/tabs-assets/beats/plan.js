// ChatGPT, the plan: a status chip plans the trip (the stop count climbs), then the day by day itinerary lands one row
// at a time, each with its place photo, the main stop, what fills the day and the day's cost, and a budget bar adds
// the four days up to $1,460 of $1,500. Pure function of t (the tabs scene's local time). Data and photos: ./data.js,
// img/CREDITS.txt.
import { seg, outCubic, rise, sayLine, statusChip, money } from './util.js';
import { DAYS, TOTAL, BUDGET } from './data.js';

const SAY = `Here is a 4 day plan for two, ${money(TOTAL)} in total:`;
const STOPS = 14;
const COLORS = ['#5d91ec', '#866cf6', '#b269e8', '#34d399'];

export default {
  times(r) {
    const T = { r };
    T.chip = r + 0.12;
    T.chipDone = r + 0.8;
    T.row = DAYS.map((_, i) => T.chipDone + 0.0 + i * 0.34);
    T.bud = T.row[DAYS.length - 1] + 0.5;
    T.budFill = T.bud + 0.15;
    T.budEnd = T.budFill + 0.8;
    T.end = T.budEnd + 0.7;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = sayLine(x, SAY);
    const chip = statusChip(x, 'Planning 4 days in Lisbon', 'Planned 4 days', true);
    const rows = DAYS.map((d) => x.el(`<div class="dy-row">
      <span class="dy-ph"><img src="${x.img(d.photo)}" alt="${x.esc(d.title)}"/></span>
      <span class="dy-m"><small>Day ${d.n}</small><b>${x.esc(d.title)}</b><em>${x.esc(d.sub)}</em></span>
      <span class="dy-cost">${money(d.cost)}</span>
    </div>`));
    const list = x.el('<div class="dy-list"></div>');
    rows.forEach((r) => list.appendChild(r));
    const bud = x.el(`<div class="dy-bud">
      <div class="dy-bud-h"><span>Budget for two</span><b><i class="dy-sum">$0</i><small> of ${money(BUDGET)}</small></b></div>
      <div class="dy-bar">${DAYS.map((d, i) => `<i style="background:${COLORS[i]}"></i>`).join('')}</div>
      <div class="dy-bud-f"><span class="dy-legend">${DAYS.map((d, i) => `<span><u style="background:${COLORS[i]}"></u>Day ${d.n}</span>`).join('')}</span><em class="dy-left">${money(BUDGET - TOTAL)} left</em></div>
    </div>`);
    const segs = [...bud.querySelector('.dy-bar').children];
    const sum = bud.querySelector('.dy-sum'), left = bud.querySelector('.dy-left');
    return {
      nodes: [say.node, chip.node, list, bud],
      marks: [[T.r, say.node], [T.chip, chip.node], ...rows.map((r, i) => [T.row[i], r]), [T.bud, bud]],
      render(t) {
        say.update(t, T.r + 0.05, 75);
        rise(chip.node, seg(t, T.chip, T.chip + 0.3));
        chip.update(t, T.chip, T.chipDone, `${Math.round(STOPS * outCubic(seg(t, T.chip + 0.1, T.chipDone)))} stops`);
        rows.forEach((r, i) => {
          const p = seg(t, T.row[i], T.row[i] + 0.45);
          const e = outCubic(p);
          r.style.opacity = e.toFixed(3);
          r.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * 14).toFixed(2)}px)`;
          const img = r.firstElementChild.firstElementChild;
          img.style.transform = p >= 1 ? '' : `scale(${(1.14 - 0.14 * e).toFixed(4)})`;
        });
        const bp = outCubic(seg(t, T.bud, T.bud + 0.4));
        bud.style.opacity = bp.toFixed(3);
        bud.style.transform = bp >= 1 ? '' : `translateY(${((1 - bp) * 12).toFixed(2)}px)`;
        const f = outCubic(seg(t, T.budFill, T.budEnd));
        segs.forEach((s, i) => { s.style.width = `${(100 * DAYS[i].cost / BUDGET * f).toFixed(3)}%`; });
        sum.textContent = money(TOTAL * f);
        left.style.opacity = outCubic(seg(t, T.budEnd - 0.25, T.budEnd + 0.15)).toFixed(3);
      },
    };
  },
};
