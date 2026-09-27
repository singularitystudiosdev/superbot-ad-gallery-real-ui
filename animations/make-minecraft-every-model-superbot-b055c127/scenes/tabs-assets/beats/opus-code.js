// Claude Opus 5.5 writes the game as a hyper-sped work montage. Two write lanes run in parallel: each streams its
// files into an editor pane as abstract syntax bars (never legible source) behind a live caret that starts at typing
// speed and accelerates into a motion-blurred river, while the file tree lights, fills and flashes file by file and the
// line total races (then eases) to +2,418. At done the river stops, a green scan sweeps the panes and the state pops
// to Built. One speed profile drives everything, so the caret, the tree, the counters and the progress bar agree.
// Pure function of t: the profile is integrated once in build() and every line is a seeded function of (lane, line),
// so render() reads the clock and nothing else (no Math.random, no layout reads). Wide columns show both lanes' panes
// (mc-code.css container query); narrow ones show lane 0 and the tree carries lane 1.
import { clamp, seg, outCubic, outBack, rand, blink } from '../../../lib.js';
import { sayer, rise, setText, fmt, REPO, TICK } from './kit.js';

const FILES = [
  ['engine/world.js', 262], ['engine/chunk.js', 242], ['engine/mesher.js', 248], ['engine/noise.js', 102],
  ['game/player.js', 220], ['game/physics.js', 211], ['game/blocks.js', 166], ['render/webgl.ts', 300],
  ['render/shaders.ts', 158], ['render/camera.ts', 99], ['ui/hotbar.js', 98], ['ui/inventory.js', 142],
  ['game/loop.js', 74], ['main.js', 96],
];
const TOTAL = FILES.reduce((s, [, n]) => s + n, 0); // 2,418: the header total the montage counts up to
const N = FILES.length;
const STEPS = ['Scaffold project', 'Generate terrain', 'Chunk mesher', 'Player physics', 'Block textures', 'Tests passing'];
const bump = (p) => Math.sin(Math.PI * clamp(p));
const smooth = (x) => { const c = clamp(x); return c * c * (3 - 2 * c); };

// the two write lanes: even files on lane 0, odd on lane 1, each written in order; start/end are cumulative lines
const LANES = [0, 1].map((j) => {
  let at = 0;
  const files = FILES.map((f, i) => i).filter((i) => i % 2 === j).map((i) => { const o = { i, a: at, b: at + FILES[i][1] }; at = o.b; return o; });
  return { files, total: at };
});
const LANE_OF = FILES.map((_, i) => LANES[i % 2].files.find((o) => o.i === i));

// the editor: SLOTS rows of abstract source, the caret parks ANCHOR rows down and the text scrolls under it
const SLOTS = 34, ANCHOR = 16, BARS = 6, VMAX = 132; // VMAX: peak display lines per second
const SPEED = [1, 0.9]; // lane 1 runs a touch slower on screen so the two rivers never scroll in lockstep
const GAP = 1.4; // % of the track between runs on one line

// one line of abstract source for lane j, line L: an indent that walks in blocks plus 1-6 coloured runs, from the seed
const LINES = new Map();
function line(j, L) {
  const key = j * 100000 + L;
  let o = LINES.get(key);
  if (o) return o;
  const s = j * 977.31 + L;
  const blk = Math.floor(L / 6);
  const ind = (Math.floor(rand(j * 53.1 + blk * 1.93 + 0.4) * 3) + (L % 6 === 0 ? 0 : 1)) * 5.5;
  const bars = [];
  if (rand(s * 1.37 + 0.5) >= 0.09) { // ~9% blank lines, as in real source
    const cn = 1 + Math.floor(rand(s * 7.71 + 5) * BARS);
    let x = ind;
    for (let k = 0; k < cn && x < 84; k++) {
      const w = Math.min(92 - x, 3 + rand(s * 13.37 + k * 5.9 + 2) * 17);
      bars.push({ x, w, c: 1 + Math.floor(rand(s * 2.71 + k * 11.1 + 3) * 6) });
      x += w + GAP;
    }
  }
  o = { bars, x0: ind, x1: bars.length ? bars[bars.length - 1].x + bars[bars.length - 1].w : ind };
  LINES.set(key, o);
  return o;
}

const SLOT = `<div class="mcm-l"><div class="mcm-tk">${'<i></i>'.repeat(BARS)}</div></div>`;
const pane = (j) => `<div class="mcm-code${j ? ' b' : ''}">
  <div class="mcm-tab"><i></i><span>${FILES[j][0].split('/').pop()}</span><em>Ln 0</em></div>
  <div class="mcm-ed"><i class="mcm-cur"></i><div class="mcm-stk">${SLOT.repeat(SLOTS)}</div>
    <div class="mcm-ov"><i class="mcm-caret"></i></div><i class="mcm-scan"></i></div>
</div>`;

export default {
  times(r, c) {
    const p = c.pace, T = { r };
    T.card = r + 0.1 * p;
    T.sta = T.card + 0.1 * p;  // the caret starts typing, the counters start moving
    T.done = T.card + 1.12 * p; // the river stops: green scan, Built
    T.end = T.done + 0.42 * p;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = sayer(x, k.cfg.say.code);
    const card = x.el(`<div class="mcm-card">
      <svg class="mcm-defs" width="0" height="0" aria-hidden="true"><filter id="mcm-vblur" x="0" y="-10%" width="100%" height="120%"><feGaussianBlur stdDeviation="0 0"/></filter></svg>
      <div class="mcm-hd">
        <span class="mcm-ric">${REPO}</span><b>blockcraft</b><span class="mcm-br">main</span>
        <em class="mcm-stat">+0 lines &middot; 0 files</em>
        <em class="mcm-state"><i class="mcm-spin"></i>${TICK}<span>Writing</span></em>
      </div>
      <div class="mcm-bd">
        <div class="mcm-tree">${FILES.map(([f]) => {
          const cut = f.lastIndexOf('/') + 1;
          return `<div class="mcm-f"><b class="mcm-fill"></b><span><s>${f.slice(0, cut)}</s>${f.slice(cut)}</span><em></em></div>`;
        }).join('')}</div>
        ${pane(0)}${pane(1)}
      </div>
      <div class="mcm-ft">
        <span class="mcm-step">${STEPS[0]}</span>
        <span class="mcm-prog"><i></i></span>
        <em class="mcm-pct">0%</em>
      </div>
      <i class="mcm-flash"></i>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const blur = card.querySelector('feGaussianBlur');
    const rows = [...card.querySelectorAll('.mcm-f')].map((n) => ({ n, fill: n.querySelector('.mcm-fill'), num: n.lastElementChild, st: '' }));
    const prog = $('.mcm-prog > i'), pct = $('.mcm-pct'), stepEl = $('.mcm-step'), statEl = $('.mcm-stat');
    const state = $('.mcm-state'), stateL = state.lastElementChild, stateTk = state.querySelector('.mc-tk');
    const spin = $('.mcm-spin'), flash = $('.mcm-flash');
    const panes = [...card.querySelectorAll('.mcm-code')].map((p) => ({
      ed: p.querySelector('.mcm-ed'), stk: p.querySelector('.mcm-stk'), caret: p.querySelector('.mcm-caret'),
      scan: p.querySelector('.mcm-scan'), name: p.querySelector('.mcm-tab span'), ln: p.querySelector('.mcm-tab em'),
      slots: [...p.querySelectorAll('.mcm-l')].map((n) => ({ n, tk: n.firstElementChild, bars: [...n.firstElementChild.children], L: -1, vis: '', clip: '' })),
    }));

    // the one speed profile: a typing-speed start that accelerates into a flat-out run, then eases into the stop, so
    // the caret visibly types first, the tree completes files faster and faster and the counters settle on the total
    const U = Math.max(1e-3, T.done - T.sta), NS = 480;
    const vel = (u) => (u < 0.3 ? 0.09 + 0.91 * smooth(u / 0.3) : u < 0.8 ? 1 : 1 - 0.95 * smooth((u - 0.8) / 0.2));
    const H = new Float64Array(NS + 1);
    for (let i = 1; i <= NS; i++) H[i] = H[i - 1] + (vel((i - 0.5) / NS) * VMAX * U) / NS;
    const HEND = H[NS];
    const disp = (t) => { const f = clamp((t - T.sta) / U) * NS, i = Math.min(NS - 1, Math.floor(f)); return H[i] + (H[i + 1] - H[i]) * (f - i); };
    // when each file completes (its lane's share of the profile crosses the file's end): the moment its row flashes
    const doneAt = FILES.map((_, i) => {
      const o = LANE_OF[i], lt = LANES[i % 2].total, goal = (o.b / lt) * HEND;
      let s = 0; while (s < NS && H[s] < goal - 1e-9) s++;
      return T.sta + (s / NS) * U;
    });

    function renderPane(pn, j, t, h, live) {
      const off = Math.max(0, h - ANCHOR), L0 = Math.floor(off), head = Math.floor(h), f = h - head;
      pn.stk.style.setProperty('--sh', (off - L0).toFixed(3));
      for (let s = 0; s < SLOTS; s++) {
        const sl = pn.slots[s], L = L0 + s, ln = line(j, L);
        if (sl.L !== L) {
          sl.L = L;
          sl.bars.forEach((b, q) => {
            const bar = ln.bars[q];
            // every property is rewritten either way, so a slot's DOM depends on its line alone, not on its history
            b.style.display = bar ? '' : 'none';
            b.style.left = bar ? `${bar.x.toFixed(2)}%` : '';
            b.style.width = bar ? `${bar.w.toFixed(2)}%` : '';
            b.className = bar ? `mcm-c${bar.c}` : '';
          });
        }
        const vis = L > head ? 'hidden' : '';
        if (sl.vis !== vis) { sl.n.style.visibility = vis; sl.vis = vis; }
        // the line under the caret is only written as far as the caret has got
        const clip = L === head && live ? `inset(0 ${(100 - (ln.x0 + f * (ln.x1 - ln.x0))).toFixed(2)}% 0 0)` : '';
        if (sl.clip !== clip) { sl.tk.style.clipPath = clip; sl.clip = clip; }
      }
      const hl = line(j, head);
      pn.ed.style.setProperty('--cy', (head - off).toFixed(3));
      pn.caret.style.left = `${(live ? hl.x0 + f * (hl.x1 - hl.x0) : hl.x1).toFixed(2)}%`;
      // the caret blinks while it waits for the first keystroke, burns solid while writing and goes at done
      const on = t < T.sta ? blink(t - T.card, 0.5) : t < T.done;
      pn.caret.style.opacity = on ? '1' : (1 - seg(t, T.done, T.done + 0.12)).toFixed(3);
      // done: a green scan sweeps top to bottom and leaves the pane tinted
      const sw = outCubic(seg(t, T.done, T.done + 0.24));
      pn.scan.style.setProperty('--sw', sw.toFixed(3));
      pn.scan.style.opacity = sw > 0 ? '1' : '0';
      pn.scan.style.setProperty('--edge', (1 - seg(t, T.done + 0.24, T.done + 0.4)).toFixed(3));
    }

    return {
      nodes: [say.node, card],
      marks: [[T.r, say.node], [T.card, card]],
      render(t) {
        say.render(t, T.r + 0.05);
        rise(card, seg(t, T.card, T.card + 0.3), 16);
        const d = t >= T.done;
        const hd = disp(t), frac = hd / HEND; // share of the work written
        const u = clamp((t - T.sta) / U), v = t > T.sta && !d ? vel(u) : 0;

        // speed reads as vertical motion blur on the text once the river is flat out (never on the caret)
        const sig = 2.4 * seg(v, 0.5, 1);
        blur.setAttribute('stdDeviation', `0 ${sig.toFixed(2)}`);
        panes.forEach((pn, j) => {
          pn.stk.style.filter = sig > 0.05 ? 'url(#mcm-vblur)' : '';
          renderPane(pn, j, t, hd * SPEED[j], !d);
        });

        // per file: lines written so far on its lane, active while its lane is inside it, a flash as it completes
        let lines = 0, files = 0;
        const act = [-1, -1];
        rows.forEach((r, i) => {
          r.n.style.opacity = outCubic(seg(t, T.card + 0.03 + i * 0.014, T.card + 0.2 + i * 0.014)).toFixed(3);
          const o = LANE_OF[i], w = frac * LANES[i % 2].total;
          const nl = d ? FILES[i][1] : clamp(w - o.a, 0, FILES[i][1]);
          const complete = d || w >= o.b - 1e-6;
          const st = complete ? 'ok' : nl > 0 ? 'on' : '';
          if (st === 'on') act[i % 2] = i;
          if (r.st !== st) { r.n.classList.toggle('on', st === 'on'); r.n.classList.toggle('ok', st === 'ok'); r.st = st; }
          r.fill.style.transform = `scaleX(${(nl / FILES[i][1]).toFixed(3)})`;
          r.n.style.setProperty('--fl', bump(seg(t, doneAt[i], doneAt[i] + 0.16)).toFixed(3));
          setText(r.num, nl > 0 ? `+${fmt(nl)}` : '');
          lines += nl; if (complete) files++;
        });
        // each pane's tab follows its lane's current file, its line number racing and resetting file by file
        panes.forEach((pn, j) => {
          const i = act[j] >= 0 ? act[j] : (frac > 0 ? LANES[j].files[LANES[j].files.length - 1].i : j);
          const o = LANE_OF[i], nl = d || act[j] < 0 ? (frac > 0 ? FILES[i][1] : 0) : clamp(frac * LANES[j].total - o.a, 0, FILES[i][1]);
          setText(pn.name, FILES[i][0].split('/').pop());
          setText(pn.ln, `Ln ${fmt(nl)}`);
        });

        const q = d ? 1 : lines / TOTAL;
        setText(statEl, `+${fmt(d ? TOTAL : lines)} lines · ${d ? N : files} files`);
        prog.style.transform = `scaleX(${q.toFixed(4)})`;
        setText(pct, `${Math.round(q * 100)}%`);
        // the action ticker flashes through the steps, each new label landing bright then dimming
        const sp = q * (STEPS.length - 1); // the last label, Tests passing, is kept for done
        setText(stepEl, d ? STEPS[STEPS.length - 1] : STEPS[Math.min(STEPS.length - 2, Math.floor(sp))]);
        stepEl.style.opacity = d || t < T.sta ? '1' : (0.4 + 0.6 * (1 - (sp % 1))).toFixed(3);

        // the done beat: green frame, the total pill pulses, the state pops to Built with its tick
        card.classList.toggle('mcm-done', d);
        state.classList.toggle('ok', d);
        setText(stateL, d ? 'Built' : 'Writing');
        const pop = seg(t, T.done, T.done + 0.24);
        stateTk.style.transform = d && pop < 1 ? `scale(${outBack(pop).toFixed(3)})` : '';
        statEl.style.transform = d ? `scale(${(1 + 0.08 * bump(seg(t, T.done, T.done + 0.26))).toFixed(4)})` : '';
        spin.style.transform = `rotate(${((t - T.card) * 720).toFixed(1)}deg)`;
        flash.style.opacity = bump(seg(t, T.done, T.done + 0.38)).toFixed(3);
      },
    };
  },
};
