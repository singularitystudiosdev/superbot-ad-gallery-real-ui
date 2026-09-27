// Preview beat: the routed model (GPT-5 Codex) runs the dev server and the live preview hot-reloads as the pieces
// other models made land in the game. The line streams, a browser window on localhost:5173 rises showing the game,
// and each HMR update flashes the window, swaps the frame to the next build, and stamps a log line under it.
// Pure function of t: every moving value is written from t, so ?t= freezes any frame.
import { seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Dev server is up. Hot-reloading the preview as each piece lands.';
// [frame shown after this update, the module that changed]
const UPDATES = [
  ['f90/prev-9.0.jpg', '/src/world/valley.ts'],
  ['f90/prev-10.5.jpg', '/assets/textures/keep.png'],
  ['f90/prev-12.0.jpg', '/src/fx/torch-fire.ts'],
];

export default {
  times(r) {
    const T = { r };
    T.win = r + 0.3;
    T.upd = UPDATES.map((_, i) => r + 0.95 + i * 0.62);
    T.end = T.upd[UPDATES.length - 1] + 0.55;   // last log line lands at +0.2, its flash fades by +0.3
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const win = x.el(`<div class="pv-win">
      <div class="pv-bar"><span class="pv-dots"><i></i><i></i><i></i></span><span class="pv-url">localhost:5173</span><span class="pv-live">LIVE</span></div>
      <div class="pv-screen">${UPDATES.map(([src]) => `<img src="${x.img(src)}" alt=""/>`).join('')}<i class="pv-flash"></i></div>
      <div class="pv-log">${UPDATES.map(([, mod]) => `<div class="pv-ln"><b>[vite]</b> hmr update <span>${x.esc(mod)}</span></div>`).join('')}</div>
    </div>`);
    const frames = [...win.querySelectorAll('.pv-screen img')];
    const flash = win.querySelector('.pv-flash');
    const logs = [...win.querySelectorAll('.pv-ln')];
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1;

    return {
      nodes: [say, win],
      // follow the log down as each update lands, so the newest line never sits under the composer
      marks: [[T.r, say], [T.win, win], ...logs.map((L, i) => [T.upd[i], L])],
      render(t) {
        const n = streamCount(SAY, T.r + 0.06, 85, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        const wi = outCubic(seg(t, T.win, T.win + 0.45));
        win.style.opacity = wi.toFixed(3);
        win.style.transform = wi >= 1 ? 'none' : `translateY(${((1 - wi) * 16).toFixed(2)}px) scale(${(0.97 + 0.03 * wi).toFixed(4)})`;

        // the frame on screen is the newest update at or before t; before the first update, the first frame dimmed
        let cur = 0;
        T.upd.forEach((a, i) => { if (t >= a) cur = i; });
        frames.forEach((f, i) => { f.style.opacity = i === cur ? (t < T.upd[0] ? '0.45' : '1') : '0'; });
        const last = T.upd.filter((a) => t >= a).pop();
        flash.style.opacity = last === undefined ? '0' : (0.55 * (1 - seg(t, last, last + 0.3))).toFixed(3);
        logs.forEach((L, i) => {
          const p = seg(t, T.upd[i], T.upd[i] + 0.2);
          L.style.opacity = outCubic(p).toFixed(3);
          L.style.transform = p >= 1 ? '' : `translateX(${((1 - outCubic(p)) * -6).toFixed(2)}px)`;
        });
      },
    };
  },
};
