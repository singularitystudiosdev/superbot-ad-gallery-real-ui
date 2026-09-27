// Code beat: the routed model writes the Liquid Glass reel. The tool chip counts the lines as they land, and a
// compact work readout morphs out under it: a glass progress track with a glass orb riding the fill front, 12 file
// rows springing in on the 120 BPM grid (one every 1/8 beat, each lit by a glass capsule while it ticks its own +line
// counter), a rolling log of tool steps (one every 1/2 beat, each check popping in) that closes on "Build OK", and a
// stat line naming the reel's shape. A refraction sheen with a chromatic fringe crosses the glass once per beat while
// the work runs. No source is ever shown: the beat reads as a lot of work happening very fast. The readout is the one
// Liquid Glass surface of chat rule r1 (frosted white over the lilac-to-sky gradient).
// opts.set picks the file set: 'glass' is what chat.js sends, 'turf' the key older callers sent; both map to the one
// Liquid Glass set. Pure function of t (the tab scene's local time) so ?t= freezes a frame.
import { clamp, lerp, seg, outCubic, outBack, streamCount } from '../../../lib.js';

// the ask is "make a Liquid Glass motion reel": the refraction shader that bends the panel and splits a chromatic
// fringe, its specular pass, the 120 BPM grid every spring runs on, and the eight scenes the reel is cut from (the
// clip's own scene labels: MORPH REFRACT CONTROL NAVIGATE MEASURE SEARCH MERGE, then the outro).
const GLASS = {
  say: 'Writing the refraction shader and the 120 BPM grid.',
  files: [
    ['src/glass/refraction.frag', 178],
    ['src/glass/specular.ts', 132],
    ['src/motion/bpm.ts', 58],
    ['src/scenes/01-morph.tsx', 288],
    ['src/scenes/02-refract.tsx', 174],
    ['src/scenes/03-control.tsx', 196],
    ['src/scenes/04-navigate.tsx', 152],
    ['src/scenes/05-measure.tsx', 168],
    ['src/scenes/06-search.tsx', 143],
    ['src/scenes/07-merge.tsx', 231],
    ['src/scenes/08-outro.tsx', 121],
    ['src/main.ts', 96],
  ],
  steps: ['Reading mesh-orb + mesh-lens sheets', 'refraction.frag: SDF lens, IOR 1.5', 'Chromatic fringe + specular pass', '120 BPM grid: 0.5s beats', 'Type-check passed', 'Build OK'],
  // the readout's final line: the reel's shape, in the clip's own numbers (16s at 120 BPM; 960 frames at 60 fps)
  stat: ['8 scenes, 16s at 120 BPM', '960 frames at 60 fps'],
};

// chat.js sends { set: 'glass' }; an older caller sends { set: 'turf' }. One set, two accepted keys.
const SETS = { turf: GLASS, glass: GLASS };

const set = (opts) => SETS[(opts && opts.set) || 'glass'] || GLASS;

const BEAT = 0.5;                 // 120 BPM: the grid every entrance, tick and sheen is placed on
const FILE_STAGGER = BEAT / 8;    // one file row landing: a 32nd note
const FILE_TICK = 0.22;           // one file's +line counter counting up
const FILE_POP = 0.3;             // one file row's springy entrance
const STEP_STAGGER = BEAT / 2;    // one tool step landing: an 8th note
const STEP_TICK = 0.18;           // one tool step resolving to its check
const LOG_ROW = 20;               // a log row + its gap: the window is 4 rows tall, the rest roll off the top

export default {
  times(r, opts) {
    const S = set(opts);
    const T = { r };
    T.chip = r + 0.14;
    T.card = r + 0.22;
    T.file = S.files.map((_, i) => r + 0.34 + i * FILE_STAGGER);
    T.step = S.steps.map((_, i) => r + 0.42 + i * STEP_STAGGER);
    T.stat = T.step[S.steps.length - 1] + STEP_TICK - 0.1;   // the stat line lands as Build OK checks off
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
    // a path renders as its directory (quiet) and its file name (ink), so the eye reads the names
    const path = (p) => { const i = p.lastIndexOf('/') + 1; return `<span class="code-fn"><em>${x.esc(p.slice(0, i))}</em>${x.esc(p.slice(i))}</span>`; };
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(S.say)}</span></div>`);
    const chip = x.el(`<div class="dd-chiprow"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">Writing ${N} files</span><b class="code-count">0 lines</b></div></div>`);
    const work = x.el(`<div class="code-work">
      <div class="code-bar"><span class="code-bar-tr"><i class="code-bar-f"></i></span><i class="code-orb"></i></div>
      <div class="code-grid">${S.files.map(([p]) => `<span class="code-fr"><i class="code-cap"></i><i class="code-fd"></i>${path(p)}<b class="code-fl">+0</b></span>`).join('')}</div>
      <div class="code-log"><div class="code-log-in">${S.steps.map((s) => `<span class="code-li"><i class="code-sd"></i><span class="code-lt">${x.esc(s)}</span>${x.OK}</span>`).join('')}</div></div>
      <div class="code-stat"><span>${x.esc(S.stat[0])}</span><span class="code-stat-b">${x.esc(S.stat[1])}</span></div>
      <i class="code-sheen" aria-hidden="true"></i>
    </div>`);
    const bar = work.querySelector('.code-bar-f');
    const orb = work.querySelector('.code-orb');
    const sheen = work.querySelector('.code-sheen');
    const rows = [...work.querySelectorAll('.code-fr')].map((r) => ({ r, fl: r.querySelector('.code-fl'), cap: r.querySelector('.code-cap') }));
    const logIn = work.querySelector('.code-log-in');
    const lsteps = [...work.querySelectorAll('.code-li')].map((s) => ({ s, ok: s.querySelector('.qc-ok') }));
    const stat = work.querySelector('.code-stat');
    const chipEl = chip.firstElementChild, spin = chipEl.querySelector('.spin');
    const clab = chipEl.querySelector('.ch-tool-t'), ccount = chipEl.querySelector('.code-count');
    const vis = say.firstElementChild, hid = say.lastElementChild;

    // glass motion: opacity eases in plainly, position and scale spring (outBack) so every arrival overshoots and
    // settles like a liquid drop; dx/dy are the travel, s0 the starting scale
    const pop = (n, p, dx, dy, s0 = 1) => {
      n.style.opacity = outCubic(clamp(p * 1.6)).toFixed(3);
      if (p >= 1) { n.style.transform = ''; return; }
      const e = outBack(p);
      n.style.transform = `translate(${((1 - e) * dx).toFixed(2)}px, ${((1 - e) * dy).toFixed(2)}px)${s0 !== 1 ? ` scale(${lerp(s0, 1, e).toFixed(4)})` : ''}`;
    };
    // the share of the beat's work that has landed at time u: every file row and every step is one unit, so the
    // bar fills only as fast as the work does and reaches full the moment Build OK checks off
    const tickOf = (u, i) => outCubic(seg(u, T.file[i] + 0.03, T.file[i] + FILE_TICK));
    const liveOf = (u) => S.steps.reduce((s, _, i) => s + seg(u, T.step[i], T.step[i] + STEP_TICK), 0);
    const progress = (u) => Math.min(1, (S.files.reduce((s, _, i) => s + tickOf(u, i), 0) + liveOf(u)) / (N + S.steps.length));
    let shown = -1;

    return {
      nodes: [say, chip, work],
      marks: [[T.r, say], [T.chip, chip], [T.card, work]],
      render(t) {
        const n = streamCount(S.say, T.r + 0.06, 80, t);
        if (n !== shown) { vis.textContent = S.say.slice(0, n); hid.textContent = S.say.slice(n); shown = n; }

        // the writing chip: spinner and a climbing line total, then a check and "Wrote N files"; the glass count pill
        // gives one springy pulse as the total locks
        pop(chip, seg(t, T.chip, T.chip + 0.3), 0, 8, 0.94);
        const done = t >= T.done;
        spin.classList.toggle('done', done);
        spin.style.transform = done ? '' : `rotate(${(((t - T.chip) * 420) % 360).toFixed(1)}deg)`;
        chipEl.classList.toggle('code-done', done);
        const cl = done ? `Wrote ${N} files` : `Writing ${N} files`;
        if (clab.textContent !== cl) clab.textContent = cl;
        const lock = seg(t, T.done, T.done + 0.3);
        ccount.style.transform = lock > 0 && lock < 1 ? `scale(${(1 + 0.14 * Math.sin(Math.PI * lock) * (1 - lock * 0.4)).toFixed(4)})` : '';

        // the work card morphs out of the chip: it springs from a squat, rounder capsule into the card, over one beat
        const cp = seg(t, T.card, T.card + BEAT);
        work.style.opacity = outCubic(seg(t, T.card, T.card + 0.22)).toFixed(3);
        if (cp >= 1) { work.style.transform = ''; work.style.borderRadius = ''; }
        else {
          const e = outBack(cp);
          work.style.transform = `translateY(${((1 - e) * 12).toFixed(2)}px) scale(${lerp(0.9, 1, e).toFixed(4)}, ${lerp(0.72, 1, e).toFixed(4)})`;
          work.style.borderRadius = `${lerp(26, 14, outCubic(cp)).toFixed(2)}px`;
        }

        // the refraction sheen: a chromatic-fringed highlight band crossing the glass once per beat (on the global
        // 120 BPM grid, like the music waveform's) while the work runs, easing out as the chip resolves
        const env = seg(t, T.card + 0.2, T.card + 0.45) * (1 - seg(t, T.done + 0.1, T.done + 0.35));
        const beat = (((t % BEAT) + BEAT) % BEAT) / BEAT;
        sheen.style.opacity = env > 0 ? (env * (0.55 + 0.45 * Math.sin(Math.PI * beat))).toFixed(3) : '0';
        sheen.style.transform = `translateX(${lerp(-140, 310, outCubic(beat)).toFixed(1)}%) skewX(-14deg)`;

        // file rows: each springs in on its 32nd note, a glass capsule lights it while it ticks its +line count, and it
        // settles lit; the overlapping capsules read as one liquid highlight running down the columns
        let sum = 0;
        rows.forEach((m, i) => {
          const a = T.file[i];
          pop(m.r, seg(t, a, a + FILE_POP), -8, 0, 0.9);
          const tick = tickOf(t, i);
          const c = S.files[i][1] * tick;
          sum += c;
          const s = `+${num(c)}`;
          if (m.fl.textContent !== s) m.fl.textContent = s;
          m.r.classList.toggle('on', t >= a + FILE_TICK);
          const hl = seg(t, a, a + 0.08) * (1 - seg(t, a + FILE_TICK, a + FILE_TICK + 0.26));
          m.cap.style.opacity = hl.toFixed(3);
        });
        const cs = `${num(done ? TOTAL : sum)} lines`;
        if (ccount.textContent !== cs) ccount.textContent = cs;

        // the tool log: each step springs in and its check pops, and the stack rolls up so the newest sits at the foot
        const live = liveOf(t);
        lsteps.forEach(({ s, ok }, i) => {
          const p = seg(t, T.step[i], T.step[i] + STEP_TICK);
          pop(s, seg(t, T.step[i], T.step[i] + 0.3), 0, 6);
          s.classList.toggle('on', p >= 1);
          const k2 = seg(t, T.step[i] + STEP_TICK, T.step[i] + STEP_TICK + 0.24);
          ok.style.transform = k2 > 0 && k2 < 1 ? `scale(${lerp(0.3, 1, outBack(k2)).toFixed(4)})` : '';
        });
        const off = Math.max(0, live - 4) * LOG_ROW;
        logIn.style.transform = off ? `translateY(${(-off).toFixed(2)}px)` : '';

        // the stat line: the reel's shape settles in as the build closes
        pop(stat, seg(t, T.stat, T.stat + 0.34), 0, 4);

        // the progress track fills with the work; a glass orb rides the fill front, stretching along the track with
        // its speed (a liquid drop pulled by the fill) and melting into the full bar once the chip resolves
        const bp = progress(t);
        bar.style.transform = `scaleX(${Math.max(0.012, bp).toFixed(4)})`;
        const v = clamp((bp - progress(t - 1 / 30)) * 30 * 0.9, 0, 0.7);   // fill speed, in bars per second, damped
        const ov = seg(t, T.card + 0.15, T.card + 0.35) * (1 - seg(t, T.done, T.done + 0.22));
        orb.style.opacity = ov.toFixed(3);
        orb.style.left = `calc(6px + ${Math.max(0.012, bp).toFixed(4)} * (100% - 12px))`;
        orb.style.transform = `translate(-50%, -50%) scale(${(1 + v).toFixed(3)}, ${(1 - 0.35 * v).toFixed(3)})`;
      },
    };
  },
};
