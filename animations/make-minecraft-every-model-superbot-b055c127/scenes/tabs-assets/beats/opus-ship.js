// Back on Claude Opus 5.5, the ship: the decals are packed into the atlas, the build runs green and the push lands,
// then the game window opens and plays the real gameplay clip (gen/clip.mp4, 13 s into the source video). The <video>
// follows t: it plays natively while the spot plays and is seeked to the exact frame when the clock is paused or
// stepped (?t=, space, arrows), so a frozen frame is always the right one. focus() hands the window to the camera
// for the zoom cut (tabs.js).
import { lerp, seg, outBack, clamp } from '../../../lib.js';
import { sayer, rise, TICK, TERM, GRID, O_BRANCH } from './kit.js';
import { gen } from './kit.js';

const CLIP = 6.0;

export default {
  times(r, c) {
    const p = c.pace, T = { r };
    T.row = [r + 0.3 * p, r + 0.62 * p, r + 1.02 * p];
    T.ok = [T.row[0] + 0.3 * p, T.row[1] + 0.35 * p, T.row[2] + 0.3 * p];
    T.game = T.row[2] + 0.55 * p;
    T.p0 = T.game + 0.45;
    T.p1 = T.p0 + CLIP;
    T.zoom = [T.p0 + 0.5, T.p0 + 1.5];
    T.end = T.p1 + 0.25;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = sayer(x, k.cfg.say.ship, 80);
    const rows = x.el(`<div class="mc-rows">
      <div class="mc-row"><span class="mc-si">${GRID}</span><span>Packed</span><b>atlas.png</b><em class="mc-dim">6 decals</em><span class="mc-okp">${TICK}</span></div>
      <div class="mc-row"><span class="mc-si">${TERM}</span><code>npm run build</code><span class="mc-run"><i class="tt-spin"></i>Running</span><span class="mc-okp mc-okw">${TICK}Success</span></div>
      <div class="mc-row"><span class="mc-si">${O_BRANCH}</span><span>Pushed to</span><b>sam/blockcraft</b><em class="mc-dim">main &middot; 2 commits</em><span class="mc-okp">${TICK}</span></div>
    </div>`);
    const game = x.el(`<div class="mc-game">
      <div class="mc-bar"><i></i><i></i><i></i><b>Blockcraft</b><span>localhost:5173</span><em class="mc-live">Running</em></div>
      <div class="mc-screen"><video muted playsinline preload="auto" poster="${gen('clip-poster.jpg')}" src="${gen('clip.mp4')}"></video></div>
    </div>`);
    const rs = [...rows.children], oks = rs.map((n) => n.querySelector('.mc-okp'));
    const run = rows.querySelector('.mc-run'), runSpin = run.querySelector('.tt-spin');
    const v = game.querySelector('video'), screen = game.querySelector('.mc-screen'), live = game.querySelector('.mc-live');
    // the engine stops calling render() while the clock is paused, so a watchdog parks the clip on its exact frame
    // once renders stop arriving
    let lastVt = 0, lastAt = 0;
    const park = () => {
      if (!v.paused) v.pause();
      if (v.readyState >= 1 && Math.abs(v.currentTime - lastVt) > 0.02) v.currentTime = lastVt;
    };
    const watch = () => { if (!v.paused && performance.now() - lastAt > 120) park(); requestAnimationFrame(watch); };
    requestAnimationFrame(watch);
    v.addEventListener('loadedmetadata', () => { if (v.paused) v.currentTime = lastVt; });
    v.addEventListener('error', () => console.error('[make-minecraft] clip failed to load:', v.error && v.error.message, v.currentSrc));
    const syncVideo = (t) => {
      lastVt = clamp(t - T.p0, 0, CLIP); lastAt = performance.now();
      if (t < T.p0 || t >= T.p1) { park(); return; }
      if (v.readyState >= 1 && Math.abs(v.currentTime - lastVt) > 0.25) v.currentTime = lastVt;
      if (v.paused) v.play().catch((err) => console.error('[make-minecraft] clip play() failed:', err && err.stack ? err.stack : err));
    };
    return {
      nodes: [say.node, rows, game],
      marks: [[T.r, say.node], [T.row[0], rows], [T.game, game]],
      focus: { el: screen, a: T.zoom[0], b: T.zoom[1] },
      render(t) {
        say.render(t, T.r + 0.05);
        rows.style.opacity = t >= T.row[0] - 0.05 ? '1' : '0';
        rs.forEach((n, i) => {
          rise(n, seg(t, T.row[i], T.row[i] + 0.32), 8, 1);
          oks[i].style.opacity = seg(t, T.ok[i], T.ok[i] + 0.15).toFixed(3);
          oks[i].style.transform = `scale(${lerp(0.5, 1, outBack(seg(t, T.ok[i], T.ok[i] + 0.3))).toFixed(3)})`;
        });
        run.style.opacity = (seg(t, T.row[1], T.row[1] + 0.1) * (1 - seg(t, T.ok[1] - 0.08, T.ok[1] + 0.02))).toFixed(3);
        runSpin.style.transform = `rotate(${((t - T.row[1]) * 420).toFixed(1)}deg)`;
        rise(game, seg(t, T.game, T.game + 0.5), 18, 0.95);
        live.classList.toggle('on', t >= T.p0);
        syncVideo(t);
      },
    };
  },
};
