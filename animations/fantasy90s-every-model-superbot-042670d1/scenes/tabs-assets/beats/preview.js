// Preview beat: the routed model (GPT-5 Codex) runs the dev server and the live preview hot-reloads as the pieces
// other models made land in the game. The line streams, a browser window on localhost:5173 rises showing the game,
// and each hot reload crossfades the window to the next build.
// Pure function of t: every moving value is written from t, so ?t= freezes any frame.
import { seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';

const SAY = 'Dev server is up. Hot-reloading the preview as each piece lands.';
// the frame shown after each hot reload
const FRAMES = ['f90/prev-9.0.jpg', 'f90/prev-10.5.jpg', 'f90/prev-12.0.jpg'];
const XFADE = 0.18;

export default {
  times(r) {
    const T = { r };
    T.win = r + 0.3;
    T.upd = FRAMES.map((_, i) => r + 0.85 + i * 0.55);
    T.end = T.upd[FRAMES.length - 1] + XFADE + 0.25;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const win = x.el(`<div class="pv-win">
      <div class="pv-bar"><span class="pv-dots"><i></i><i></i><i></i></span><span class="pv-url">localhost:5173</span><span class="pv-live">LIVE</span></div>
      <div class="pv-screen">${FRAMES.map((src) => `<img src="${x.img(src)}" alt=""/>`).join('')}</div>
    </div>`);
    const frames = [...win.querySelectorAll('.pv-screen img')];
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1;

    return {
      nodes: [say, win],
      marks: [[T.r, say], [T.win, win]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.06, 85, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        const wi = outCubic(seg(t, T.win, T.win + 0.45));
        win.style.opacity = wi.toFixed(3);
        win.style.transform = wi >= 1 ? 'none' : `translateY(${((1 - wi) * 16).toFixed(2)}px) scale(${(0.97 + 0.03 * wi).toFixed(4)})`;

        // frames stack in order; each fades in over the previous one at its update, the first starts dimmed
        frames.forEach((f, i) => {
          const a = i === 0 ? 0.45 + 0.55 * inOutCubic(seg(t, T.upd[0], T.upd[0] + XFADE)) : inOutCubic(seg(t, T.upd[i], T.upd[i] + XFADE));
          f.style.opacity = a.toFixed(3);
        });
      },
    };
  },
};
