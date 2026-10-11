// Claude Opus 5.5, mid-task: a tool chip edits file after file while the task runs on across the plans you already
// pay for. Solution only (user ruling): no five-hour limit notice, no red callout, no error state lands here; the beat
// simply stops while the tool chip is still working, and the next beat's chip and answer carry it to done.
import { seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'On it. Refactoring auth across 14 files.';
const FILES = 14, AT = 9;

export default {
  times(r) {
    const T = { r };
    T.chip = r + 0.3;
    T.count0 = r + 0.45;
    T.count1 = r + 1.8;
    T.end = T.count1 + 0.85;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const chip = x.el(`<div class="dd-chiprow"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">Editing files</span><b class="yt-count">0 / ${FILES}</b></div></div>`);
    const spin = chip.querySelector('.spin'), ccount = chip.querySelector('.yt-count');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    let shown = -1;
    return {
      nodes: [say, chip],
      marks: [[T.r, say], [T.chip, chip]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.06, 80, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        rise(chip, seg(t, T.chip, T.chip + 0.3), 8);
        // the spinner keeps turning: the task is running on, not stalled
        spin.style.transform = `rotate(${(((t - T.chip) * 420) % 360).toFixed(1)}deg)`;
        const c = Math.round(AT * outCubic(seg(t, T.count0, T.count1)));
        const cs = `${c} / ${FILES}`;
        if (ccount.textContent !== cs) ccount.textContent = cs;
      },
    };
  },
};