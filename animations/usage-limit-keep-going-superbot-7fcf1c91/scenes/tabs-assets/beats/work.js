// Claude Opus 5.5, mid-task: a tool chip edits file after file, then the plan's five-hour limit lands in the thread
// (the vendor's own notice, in the complaint's words: "5-hour limit reached", "resets 4:12 PM"). Pure function of t.
import { seg, outCubic, outBack, streamCount } from '../../../lib.js';

const SAY = 'On it. Refactoring auth across 14 files.';
const FILES = 14, STOP = 9;
const CLOCK = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';

export default {
  times(r) {
    const T = { r };
    T.chip = r + 0.3;
    T.count0 = r + 0.45;
    T.count1 = r + 1.8;
    T.lim = T.count1 + 0.25;
    T.end = T.lim + 1.25;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const chip = x.el(`<div class="dd-chiprow"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">Editing files</span><b class="yt-count">0 / ${FILES}</b></div></div>`);
    const lim = x.el(`<div class="ul-limit"><span class="ul-lim-ic">${CLOCK}</span><span class="ul-lim-t"><b>5-hour limit reached</b><small>Resets 4:12 PM</small></span></div>`);
    const spin = chip.querySelector('.spin'), ccount = chip.querySelector('.yt-count');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    let shown = -1;
    return {
      nodes: [say, chip, lim],
      marks: [[T.r, say], [T.chip, chip], [T.lim, lim]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.06, 80, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        rise(chip, seg(t, T.chip, T.chip + 0.3), 8);
        const stalled = t >= T.count1;
        spin.classList.toggle('stall', stalled);
        spin.style.transform = stalled ? '' : `rotate(${(((t - T.chip) * 420) % 360).toFixed(1)}deg)`;
        const c = Math.round(STOP * outCubic(seg(t, T.count0, T.count1)));
        const cs = `${c} / ${FILES}`;
        if (ccount.textContent !== cs) ccount.textContent = cs;
        const p = seg(t, T.lim, T.lim + 0.4);
        lim.style.opacity = outCubic(p).toFixed(3);
        lim.style.transform = p >= 1 ? '' : `translateY(${((1 - outCubic(p)) * 10).toFixed(2)}px) scale(${(0.97 + 0.03 * outBack(p)).toFixed(4)})`;
      },
    };
  },
};
