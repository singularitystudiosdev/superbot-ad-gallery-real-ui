// Code beat: the routed model writes Lens Lab's optics. The tool chip counts the lines as they land, and a compact
// work readout rises in its place: a progress bar, 14 file rows streaming in fast (each ticking its own +line
// counter), and a rolling log of tool steps (solve the thin lens, trace the elements, bind the focus ring, sweep the
// sharp plane) that closes on green. No source is ever shown: the beat reads as a lot of work happening very fast.
// Only ?v=3 routes through this beat (chat.js VARIANTS['3'] passes set 'world'), so it carries that one set. Pure
// function of t (the tab scene's local time) so ?t= freezes a frame.
import { seg, outCubic, streamCount } from '../../../lib.js';

// the ask is "build a lens lab that explains camera focus": a thin-lens solver and a six-element group on a rail,
// a focus ring that drives the group's travel, the depth of field and the sharp plane it sweeps through the valley
// diorama, and the ground-glass preview. The log's numbers are real thin-lens optics for a 50mm lens focused at
// 1.20m, f/2.8, circle of confusion 0.03mm:
//   1/f = 1/u + 1/v                  -> v = 1 / (1/50 - 1/1200) = 52.17mm, so the group travels v - f = 2.17mm
//   H = f^2 / (N c) + f              -> 2500 / 0.084 + 50 = 29,812mm = 29.8m
//   near = u (H - f) / (H + u - 2f)  -> 1.155m;  far = u (H - f) / (H - u) -> 1.248m;  DOF 92.9mm = 9.3cm
// File names stay within the grid column (25 characters) so none is cut with an ellipsis.
const SETS = {
  world: {
    say: 'Writing the optics behind the focus ring.',
    files: [
      ['src/optics/thinLens.ts', 186],
      ['src/optics/raytrace.ts', 298],
      ['src/optics/aperture.ts', 96],
      ['src/lens/prescription.ts', 118],
      ['src/lens/elementGroup.ts', 263],
      ['src/lens/focusRing.ts', 142],
      ['src/lens/barrel.ts', 174],
      ['src/focus/depthOfField.ts', 214],
      ['src/focus/hyperfocal.ts', 73],
      ['src/scene/valley.ts', 331],
      ['src/scene/depthMap.ts', 124],
      ['src/view/planeOfFocus.ts', 177],
      ['src/view/groundGlass.ts', 209],
      ['src/view/bokeh.ts', 152],
    ],
    steps: [
      'Solved thin lens: f=50mm, u=1.20m → v=52.17mm',
      'Traced 2,048 rays through 6 elements',
      'Bound focus ring to element travel: +2.17mm',
      'Hyperfocal at f/2.8, c=0.03mm: 29.8m',
      'Swept sharp plane: DOF 1.155m to 1.248m (9.3cm)',
      'Ground glass rendered, build OK',
    ],
  },
};

const set = (opts) => SETS[(opts && opts.set) || 'world'] || SETS.world;

const FILE_STAGGER = 0.078;  // one file row landing
const FILE_TICK = 0.22;      // one file's +line counter counting up
const STEP_STAGGER = 0.26;   // one tool step landing
const STEP_TICK = 0.18;      // one tool step resolving to its check
const LOG_ROW = 20;          // a log row + its gap: the window is 4 rows tall, the rest roll off the top

export default {
  times(r, opts) {
    const S = set(opts);
    const T = { r };
    T.chip = r + 0.14;
    T.card = r + 0.22;
    T.file = S.files.map((_, i) => r + 0.34 + i * FILE_STAGGER);
    T.step = S.steps.map((_, i) => r + 0.42 + i * STEP_STAGGER);
    T.done = r + 2.0;    // the chip resolves: Wrote N files
    T.end = r + 2.25;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const S = set(k.opts);
    const N = S.files.length;
    const TOTAL = S.files.reduce((s, [, n]) => s + n, 0);
    const num = (n) => Math.round(n).toLocaleString('en-US');
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(S.say)}</span></div>`);
    const chip = x.el(`<div class="dd-chiprow"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">Writing ${N} files</span><b class="code-count">0 lines</b></div></div>`);
    const work = x.el(`<div class="code-work">
      <div class="code-bar"><i class="code-bar-f"></i></div>
      <div class="code-grid">${S.files.map(([p]) => `<span class="code-fr"><i class="code-fd"></i><span class="code-fn">${x.esc(p)}</span><b class="code-fl">+0</b></span>`).join('')}</div>
      <div class="code-log"><div class="code-log-in">${S.steps.map((s) => `<span class="code-li"><i class="code-sd"></i><span class="code-lt">${x.esc(s)}</span>${x.OK}</span>`).join('')}</div></div>
    </div>`);
    const bar = work.querySelector('.code-bar-f');
    const rows = [...work.querySelectorAll('.code-fr')].map((r) => ({ r, fl: r.querySelector('.code-fl') }));
    const logIn = work.querySelector('.code-log-in');
    const lsteps = [...work.querySelectorAll('.code-li')];
    const chipEl = chip.firstElementChild, spin = chipEl.querySelector('.spin');
    const clab = chipEl.querySelector('.ch-tool-t'), ccount = chipEl.querySelector('.code-count');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    let shown = -1;

    return {
      nodes: [say, chip, work],
      marks: [[T.r, say], [T.chip, chip], [T.card, work]],
      render(t) {
        const n = streamCount(S.say, T.r + 0.06, 80, t);
        if (n !== shown) { vis.textContent = S.say.slice(0, n); hid.textContent = S.say.slice(n); shown = n; }

        // the writing chip: spinner and a climbing line total, then a check and "Wrote N files"
        rise(chip, seg(t, T.chip, T.chip + 0.3), 8);
        const done = t >= T.done;
        spin.classList.toggle('done', done);
        spin.style.transform = done ? '' : `rotate(${(((t - T.chip) * 420) % 360).toFixed(1)}deg)`;
        chipEl.classList.toggle('code-done', done);
        const cl = done ? `Wrote ${N} files` : `Writing ${N} files`;
        if (clab.textContent !== cl) clab.textContent = cl;

        // the work card: a progress bar, the file grid, and the rolling tool log
        rise(work, seg(t, T.card, T.card + 0.42), 14);

        // file rows: each lands, ticks its own +line count, then settles lit
        let sum = 0, credit = 0;
        rows.forEach((m, i) => {
          const a = T.file[i];
          rise(m.r, seg(t, a, a + 0.26), 5);
          const tick = outCubic(seg(t, a + 0.03, a + FILE_TICK));
          credit += tick;
          const c = S.files[i][1] * tick;
          sum += c;
          const s = `+${num(c)}`;
          if (m.fl.textContent !== s) m.fl.textContent = s;
          m.r.classList.toggle('on', t >= a + FILE_TICK);
        });
        const cs = `${num(done ? TOTAL : sum)} lines`;
        if (ccount.textContent !== cs) ccount.textContent = cs;

        // the tool log: each step lands and checks off, and the stack rolls up so the newest sits at the foot
        let live = 0;
        lsteps.forEach((s, i) => {
          const p = seg(t, T.step[i], T.step[i] + STEP_TICK);
          live += p;
          rise(s, p, 5);
          s.classList.toggle('on', p >= 1);
        });
        const off = Math.max(0, live - 4) * LOG_ROW;
        logIn.style.transform = off ? `translateY(${(-off).toFixed(2)}px)` : '';

        // the bar is the share of the beat's work that has landed: every file row and every step is one unit, so it
        // fills only as fast as the work does and only reaches full the moment Build OK checks off
        const bp = Math.min(1, (credit + live) / (N + S.steps.length));
        bar.style.transform = `scaleX(${Math.max(0.012, bp).toFixed(4)})`;
      },
    };
  },
};