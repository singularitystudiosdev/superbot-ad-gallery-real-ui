// Gemini, the ranking: a tool chip checks the bike routes, then the SAME three listings come back ranked by ride
// time to Congress Ave. Each row keeps the listing's photo, name and rent from the search, a bar grows to its ride
// time, and the shortest ride is marked. Pure function of t.
import { seg, outCubic, rise, sayLine, statusChip, BIKE } from './util.js';
import { LISTINGS } from './data.js';

const SAY = 'Ranked by bike ride to Congress Ave and 6th St:';
const RANKED = [...LISTINGS].sort((a, b) => a.ride - b.ride);
const MAX = Math.max(...RANKED.map((l) => l.ride));
const CLOSE = `${RANKED[0].name} is ${RANKED[2].ride - RANKED[0].ride} min closer than ${RANKED[2].name}.`;

export default {
  times(r) {
    const T = { r };
    T.chip = r + 0.12;
    T.chipDone = r + 0.85;
    T.row = RANKED.map((_, i) => T.chipDone + 0.02 + i * 0.4);
    T.win = T.row[RANKED.length - 1] + 0.6;
    T.close = T.win + 0.1;
    T.end = T.close + 0.95;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = sayLine(x, SAY);
    const chip = statusChip(x, 'Checking bike routes', 'Checked bike routes', true);
    const rows = RANKED.map((l, i) => x.el(`<div class="sw-rk${i === 0 ? ' sw-first' : ''}">
      <span class="sw-rank">${i + 1}</span>
      <span class="sw-th" style="background-image:url('${x.img(l.photo)}')"></span>
      <span class="sw-rk-m"><b>${x.esc(l.name)}</b><small>${l.rent}/mo · ${l.bd} bd · ${l.ba} ba · ${x.esc(l.hood)}</small><span class="sw-bar"><i></i></span></span>
      <span class="sw-time"><b>${l.ride} min</b><small>${BIKE}${l.miles}</small></span>
      ${i === 0 ? '<span class="sw-win">Shortest ride</span>' : ''}
    </div>`));
    const table = x.el('<div class="sw-table"></div>');
    rows.forEach((r) => table.appendChild(r));
    const close = sayLine(x, CLOSE, 'qc-say sw-close');
    const bars = rows.map((r) => r.querySelector('.sw-bar i'));
    return {
      nodes: [say.node, chip.node, table, close.node],
      marks: [[T.r, say.node], [T.chip, chip.node], ...rows.map((r, i) => [T.row[i], r]), [T.close, close.node]],
      render(t) {
        say.update(t, T.r + 0.05, 75);
        rise(chip.node, seg(t, T.chip, T.chip + 0.3));
        chip.update(t, T.chip, T.chipDone, `${Math.round(3 * seg(t, T.chip + 0.1, T.chipDone))} listings`);
        rows.forEach((r, i) => {
          const p = seg(t, T.row[i], T.row[i] + 0.45);
          const e = outCubic(p);
          r.style.opacity = e.toFixed(3);
          r.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * 14).toFixed(2)}px)`;
          bars[i].style.width = `${(100 * (RANKED[i].ride / MAX) * outCubic(seg(t, T.row[i] + 0.15, T.row[i] + 0.8))).toFixed(2)}%`;
        });
        const w = outCubic(seg(t, T.win, T.win + 0.35));
        rows[0].classList.toggle('on', t >= T.win);
        const badge = rows[0].querySelector('.sw-win');
        badge.style.opacity = w.toFixed(3);
        badge.style.transform = `scale(${(0.8 + 0.2 * w).toFixed(3)})`;
        close.update(t, T.close, 80);
      },
    };
  },
};
