// The same Claude thread, carried on after the relay moved the call to a sibling sign-in: two tool chips resolve and the
// answer completes. Pure function of t.
import { seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Done. 14 files edited, 42 tests pass.';
const CHIPS = [['Editing files', 'Edited files', '14 / 14'], ['Running tests', 'Ran tests', '42 passed']];

export default {
  times(r) {
    const T = { r };
    T.chip = [r + 0.25, r + 0.65];
    T.done = [r + 0.6, r + 1.15];
    T.end = T.done[1] + 0.8;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const rows = CHIPS.map(([a, , c]) => x.el(`<div class="dd-chiprow"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">${x.esc(a)}</span><b class="yt-count">${x.esc(c)}</b></div></div>`));
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    let shown = -1;
    return {
      nodes: [say, ...rows],
      marks: [[T.r, say], ...rows.map((r, i) => [T.chip[i], r])],
      render(t) {
        const n = streamCount(SAY, T.r + 0.06, 70, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        rows.forEach((row, i) => {
          rise(row, seg(t, T.chip[i], T.chip[i] + 0.3), 8);
          const done = t >= T.done[i];
          const spin = row.querySelector('.spin'), lab = row.querySelector('.ch-tool-t');
          spin.classList.toggle('done', done);
          spin.style.transform = done ? '' : `rotate(${(((t - T.chip[i]) * 420) % 360).toFixed(1)}deg)`;
          const l = done ? CHIPS[i][1] : CHIPS[i][0];
          if (lab.textContent !== l) lab.textContent = l;
          row.firstElementChild.classList.toggle('yt-chip-done', done);
        });
      },
    };
  },
};
