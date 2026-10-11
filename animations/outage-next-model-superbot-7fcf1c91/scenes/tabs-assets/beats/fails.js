// GPT-6 Sol, mid-task: the ask goes out and the vendor's own capacity error comes back, so the turn ends with no
// answer. The headline is the complaint's wording ("Selected model is at capacity", the error OpenAI Codex users
// reported on 2026-10-10), shown where it lands: in the thread. Pure function of t.
import { seg, outCubic, outBack } from '../../../lib.js';

const WARN = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7.4v5.4"/><circle cx="12" cy="16.7" r="1.15" fill="currentColor" stroke="none"/></svg>';

export default {
  times(r) {
    const T = { r };
    T.chip = r + 0.02;
    T.stall = r + 0.5;    // no first token: the spinner turns red and the label gives up
    T.err = r + 0.72;     // the vendor's error lands in the thread
    T.end = T.err + 1.55;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const chip = x.el('<div class="dd-chiprow"><div class="ch-tool ot-note"><span class="spin"></span><span class="ch-tool-t">Working</span></div></div>');
    const err = x.el(`<div class="ot-err"><span class="ot-err-ic">${WARN}</span><span class="ot-err-t"><b>Selected model is at capacity</b><small>No answer came back. The failed call is in Activity.</small></span></div>`);
    const spin = chip.querySelector('.spin'), lab = chip.querySelector('.ch-tool-t');
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    return {
      nodes: [chip, err],
      marks: [[T.chip, chip], [T.err, err]],
      render(t) {
        rise(chip, seg(t, T.chip, T.chip + 0.3), 8);
        const stalled = t >= T.stall;
        spin.classList.toggle('stall', stalled);
        spin.style.transform = stalled ? '' : `rotate(${(((t - T.chip) * 420) % 360).toFixed(1)}deg)`;
        const l = stalled ? 'No response' : 'Working';
        if (lab.textContent !== l) lab.textContent = l;
        const p = seg(t, T.err, T.err + 0.42);
        err.style.opacity = outCubic(p).toFixed(3);
        err.style.transform = p >= 1 ? '' : `translateY(${((1 - outCubic(p)) * 10).toFixed(2)}px) scale(${(0.97 + 0.03 * outBack(p)).toFixed(4)})`;
      },
    };
  },
};