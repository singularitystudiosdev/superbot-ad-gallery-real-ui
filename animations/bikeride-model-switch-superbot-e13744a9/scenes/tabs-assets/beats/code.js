// Code beat: Claude Opus 5.5 writes the game. Its line streams, the "Writing 4 files" chip spins, and a compact work
// readout rises: a progress bar, the game's four files landing one by one (each lighting with a green dot when it
// is written), and a short log of what it did, each step checking off. No source and no counts are shown: the beat
// reads as the game being written, file by file, in the browser. The chip resolves to "Wrote 4 files".
// Pure function of t (the tab scene's local time), so ?t= freezes a frame.
import { seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Wrote the ride: terrain, sky, bike and sound, all in the browser.';
// a plausible browser game: the ride loop, the road and paddies, the sky and its light, the loop and SFX
const FILES = ['ride.js', 'terrain.js', 'sky.js', 'audio.js'];
const STEPS = ['Loaded the stills, models, loop and sound effects', 'Wrote the game in 4 files', 'Opened it in the browser'];
const CPS = 80;
const FILE_STAGGER = 0.2;              // one file row landing to the next
const FILE_TICK = 0.22;                // one file being written, then lit
const STEP_STAGGER = 0.4; /* deliberate */ // one log step landing to the next
const STEP_TICK = 0.18;                // one log step resolving to its check
const RISE = 0.3;                      // the chip and the card rising in

export default {
  times(r) {
    const T = { r };
    T.chip = r + 0.14;
    T.card = r + 0.22;
    T.file = FILES.map((_, i) => r + 0.34 + i * FILE_STAGGER);
    T.step = STEPS.map((_, i) => r + 0.42 + i * STEP_STAGGER);
    T.done = Math.max(T.step[STEPS.length - 1] + STEP_TICK, T.file[FILES.length - 1] + FILE_TICK) + 0.1; // Wrote 4 files
    T.end = Math.max(T.done, r + SAY.length / CPS) + 0.3;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const N = FILES.length;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const chip = x.el(`<div class="dd-chiprow"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">Writing ${N} files</span></div></div>`);
    const work = x.el(`<div class="code-work">
      <div class="code-bar"><i class="code-bar-f"></i></div>
      <div class="code-grid">${FILES.map((p) => `<span class="code-fr"><i class="code-fd"></i><span class="code-fn">${x.esc(p)}</span></span>`).join('')}</div>
      <div class="code-log"><div class="code-log-in">${STEPS.map((s) => `<span class="code-li"><i class="code-sd"></i><span class="code-lt">${x.esc(s)}</span>${x.OK}</span>`).join('')}</div></div>
    </div>`);
    const bar = work.querySelector('.code-bar-f');
    const rows = [...work.querySelectorAll('.code-fr')];
    const lsteps = [...work.querySelectorAll('.code-li')];
    const chipEl = chip.firstElementChild, spin = chipEl.querySelector('.spin');
    const clab = chipEl.querySelector('.ch-tool-t');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    let shown = -1;

    return {
      nodes: [say, chip, work],
      marks: [[T.r, say], [T.chip, chip], [T.card, work]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.06, CPS, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        // the writing chip: spins, then a check and "Wrote 4 files"
        rise(chip, seg(t, T.chip, T.chip + RISE), 8);
        const done = t >= T.done;
        spin.classList.toggle('done', done);
        spin.style.transform = done ? '' : `rotate(${(((t - T.chip) * 420) % 360).toFixed(1)}deg)`;
        const cl = done ? `Wrote ${N} files` : `Writing ${N} files`;
        if (clab.textContent !== cl) clab.textContent = cl;

        rise(work, seg(t, T.card, T.card + RISE), 14);

        // file rows: each lands, then lights once written
        let credit = 0;
        rows.forEach((r, i) => {
          const a = T.file[i];
          rise(r, seg(t, a, a + RISE), 5);
          credit += seg(t, a, a + FILE_TICK);
          r.classList.toggle('on', t >= a + FILE_TICK);
        });
        // the log: each step lands and checks off
        let live = 0;
        lsteps.forEach((s, i) => {
          const p = seg(t, T.step[i], T.step[i] + STEP_TICK);
          live += p;
          rise(s, p, 5);
          s.classList.toggle('on', p >= 1);
        });
        // the bar is the share of the work that has landed: every file and every step is one unit
        const bp = Math.min(1, (credit + live) / (N + STEPS.length));
        bar.style.transform = `scaleX(${Math.max(0.012, bp).toFixed(4)})`;
      },
    };
  },
};
