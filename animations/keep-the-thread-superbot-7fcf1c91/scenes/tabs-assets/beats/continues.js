// keep-the-thread: the follow-up's answer. The same thread that was started in Claude Code finishes the follow-up:
// one tool chip resolves and the reply streams in. Nothing above it moves; the ask, the history and the carry chip
// stay exactly as they were, so the thread reads as one continuous chat. Pure function of t.
import { seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Shipped to staging. 3 checks green.';
const CHIP = ['Deploying', 'Deployed to staging', 'staging'];

export default {
  times(r) {
    const T = { r };
    T.chip = r + 0.2;
    T.done = r + 0.62;
    T.end = T.done + 0.75;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const row = x.el(`<div class="dd-chiprow"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">${x.esc(CHIP[0])}</span><b class="yt-count">${x.esc(CHIP[2])}</b></div></div>`);
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    let shown = -1;
    return {
      nodes: [say, row],
      marks: [[T.r, say], [T.chip, row]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.05, 62, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        rise(row, seg(t, T.chip, T.chip + 0.3), 8);
        const done = t >= T.done;
        const spin = row.querySelector('.spin'), lab = row.querySelector('.ch-tool-t');
        spin.classList.toggle('done', done);
        spin.style.transform = done ? '' : `rotate(${(((t - T.chip) * 420) % 360).toFixed(1)}deg)`;
        const l = done ? CHIP[1] : CHIP[0];
        if (lab.textContent !== l) lab.textContent = l;
        row.firstElementChild.classList.toggle('yt-chip-done', done);
      },
    };
  },
};