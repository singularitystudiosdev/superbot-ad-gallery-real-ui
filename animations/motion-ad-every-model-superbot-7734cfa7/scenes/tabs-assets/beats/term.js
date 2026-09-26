// Term beat: the local render. A terminal window lands under the reply, types the Remotion render command, then
// streams the render's own output: the bundle line, "Rendering frames" with a text progress bar filling [████░░░░]
// and its frame counter climbing 0 -> 900/900, the encoder line, and the finished file in green.
// The whole card is a pure function of ONE normalized progress p (0..1) of the window it is given, so the same card
// runs either on this beat's clock (times/build below) or on any [t0, t1] a caller hands it (termCard, which play.js
// reuses as its intro). No Date, no rAF, no CSS transition: ?t= freezes every frame.
import { clamp, lerp, seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Rendering the spot locally.';
const CMD = 'npx remotion render Spot out/motion-ad.mp4 --fps=60';
const FRAMES = 900; // 15 seconds at 60 fps
const CELLS = 12;   // cells in the [████████░░░░] bar

// the card's schedule, as fractions of the window the card is given
const PH = {
  win: 0.07,  // the window itself lands
  cmd0: 0.06, // the command starts typing ...
  cmd1: 0.28, // ... and its last character lands
  bun: 0.30,  // "Bundling 6 scenes"
  ren: 0.38,  // "Rendering frames" + the bar
  bar0: 0.42, // the bar starts filling and the counter starts climbing
  bar1: 0.78, // ... 900/900 and a full bar
  enc: 0.80,  // "Encoding H.264 1920x1080"
  fin: 0.88,  // the green done line
  rise: 0.08, // one output line's rise-in
};

/** the terminal window card: node + draw(p), p = normalized progress of its whole animation */
function buildWindow(x) {
  const win = x.el(`<div class="term-win">
    <div class="term-top"><span class="term-dots"><i></i><i></i><i></i></span><b class="term-title">zsh&nbsp;&nbsp;motion-ad</b></div>
    <div class="term-body">
      <div class="term-cmd"><span class="term-ps1">$</span><span class="term-ctyped"></span><i class="term-caret"></i></div>
      <div class="term-out">
        <div class="term-line"><span>Bundling 6 scenes</span></div>
        <div class="term-line"><span>Rendering frames</span><span class="term-prog"></span><span class="term-count"></span></div>
        <div class="term-line"><span>Encoding H.264 1920x1080</span></div>
        <div class="term-line term-fin"><span>✓ out/motion-ad.mp4</span><span class="term-meta">0:15</span><span class="term-meta">18.4 MB</span></div>
      </div>
    </div>
  </div>`);
  const typed = win.querySelector('.term-ctyped');
  const caret = win.querySelector('.term-caret');
  const lines = [...win.querySelectorAll('.term-line')];
  const prog = win.querySelector('.term-prog');
  const count = win.querySelector('.term-count');
  const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };

  const draw = (raw) => {
    const p = clamp(raw);
    const wi = outCubic(seg(p, 0, PH.win));
    win.style.opacity = wi.toFixed(3);
    win.style.transform = wi >= 1 ? '' : `translateY(${((1 - wi) * 16).toFixed(2)}px) scale(${lerp(0.97, 1, wi).toFixed(4)})`;

    // the command types in under a solid block caret
    const c = CMD.slice(0, Math.round(CMD.length * seg(p, PH.cmd0, PH.cmd1)));
    if (typed.textContent !== c) typed.textContent = c;
    caret.style.opacity = p >= PH.cmd0 && p < PH.cmd1 ? '1' : '0';

    // the render's output, line by line
    rise(lines[0], seg(p, PH.bun, PH.bun + PH.rise), 5);
    rise(lines[1], seg(p, PH.ren, PH.ren + PH.rise), 5);
    const f = seg(p, PH.bar0, PH.bar1);
    const filled = Math.round(CELLS * f);
    const bar = `[${'█'.repeat(filled)}${'░'.repeat(CELLS - filled)}]`;
    if (prog.textContent !== bar) prog.textContent = bar;
    const fr = `${Math.round(FRAMES * f)}/${FRAMES} frames`;
    if (count.textContent !== fr) count.textContent = fr;
    rise(lines[2], seg(p, PH.enc, PH.enc + PH.rise), 5);
    rise(lines[3], seg(p, PH.fin, PH.fin + PH.rise), 5);
    win.classList.toggle('term-done', p >= PH.fin);
  };

  return { node: win, draw };
}

export default {
  times(r) {
    const T = { r };
    T.card = r + 0.3;  // the terminal window lands
    T.end = r + 3.5;   // the finished file has been on screen for a beat by here
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = buildWindow(x);
    const span = Math.max(0.001, T.end - T.card);
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1;

    return {
      nodes: [say, card.node],
      marks: [[T.r, say], [T.card, card.node]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.06, 80, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        card.draw((t - T.card) / span);
      },
    };
  },
};

/** the same card as a standalone intro piece: node + render(t, t0, t1) across the caller's window.
    play.js uses it to open on the render that produced the clip it then plays. */
export function termCard(x) {
  const card = buildWindow(x);
  return {
    node: card.node,
    render: (t, t0, t1) => card.draw((t - t0) / Math.max(0.001, t1 - t0)),
  };
}