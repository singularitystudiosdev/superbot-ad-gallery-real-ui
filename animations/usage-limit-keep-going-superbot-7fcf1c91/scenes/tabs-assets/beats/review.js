// GPT-6 Sol answers the per-request model switch: one tool chip reads the diff, then the verdict. Pure function of t.
import { seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'No issues found. Ready to merge.';

export default {
  times(r) {
    const T = { r };
    T.chip = r + 0.25;
    T.done = r + 0.85;
    T.end = T.done + 0.95;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const chip = x.el('<div class="dd-chiprow"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">Reading the diff</span><b class="yt-count">14 files</b></div></div>');
    const spin = chip.querySelector('.spin'), lab = chip.querySelector('.ch-tool-t');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    let shown = -1;
    return {
      nodes: [chip, say],
      marks: [[T.chip, chip], [T.done, say]],
      render(t) {
        rise(chip, seg(t, T.chip, T.chip + 0.3), 8);
        const done = t >= T.done;
        spin.classList.toggle('done', done);
        spin.style.transform = done ? '' : `rotate(${(((t - T.chip) * 420) % 360).toFixed(1)}deg)`;
        const l = done ? 'Read the diff' : 'Reading the diff';
        if (lab.textContent !== l) lab.textContent = l;
        chip.firstElementChild.classList.toggle('yt-chip-done', done);
        const n = streamCount(SAY, T.done + 0.06, 70, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        rise(say, seg(t, T.done - 0.02, T.done + 0.2), 6);
      },
    };
  },
};
