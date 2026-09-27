// Code beat: the routed model cuts the Upping My P(doom) music video. The tool chip counts the lines as they land, and
// a compact work readout rises in its place: a progress bar, 14 file rows streaming in fast (each ticking its own
// +line counter), and a rolling log of tool steps ("Reading 4 vocal takes + 6 stills", "Tests 48/48 passing",
// "Render OK") that closes on green. No source is ever shown: the beat reads as a lot of work happening very fast.
// opts.set picks the file set; the music video has one, 'mv'. Pure function of t (the tab scene's local time) so
// ?t= freezes a frame.
import { seg, outCubic, streamCount } from '../../../lib.js';

// the ask is "make a k-pop music video about p(doom)": the timeline that cuts the shots to the beat, the lyric and
// caption tracks, the on-screen props the stills carry (the P(doom) meter, the LIVE date stamp, the METR chart), the
// riso grain over every frame, lip sync to the vocal takes, the audio mix, and the compose + encode render pass.
const SETS = {
  mv: {
    say: 'Cutting the video to the beat.',
    files: [
      ['src/mv/timeline.ts', 412],
      ['src/mv/lyrics.ts', 231],
      ['src/mv/shots.ts', 288],
      ['src/mv/captions.ts', 188],
      ['src/mv/pdoom-meter.ts', 144],
      ['src/mv/date-stamp.ts', 96],
      ['src/mv/metr-chart.ts', 203],
      ['src/mv/riso-grain.ts', 119],
      ['src/mv/beat-sync.ts', 156],
      ['src/mv/lip-sync.ts', 174],
      ['src/audio/mix.ts', 142],
      ['src/render/compose.ts', 318],
      ['src/render/encode.ts', 88],
      ['src/main.ts', 67],
    ],
    steps: ['Reading 4 vocal takes + 6 stills', 'Wired Lyria soundtrack', 'Writing 14 files', 'Type-check passed', 'Tests 48/48 passing', 'Render OK'],
  },
};

const set = (opts) => SETS[(opts && opts.set) || 'mv'] || SETS.mv;

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
        // fills only as fast as the work does and only reaches full the moment Render OK checks off
        const bp = Math.min(1, (credit + live) / (N + S.steps.length));
        bar.style.transform = `scaleX(${Math.max(0.012, bp).toFixed(4)})`;
      },
    };
  },
};
