// Preview beat (Cursor): Cursor's dev server is already up, so the answer is a live preview window: a browser-looking
// card titled localhost:5173 with Cursor's tile in its bar, showing the running game (the capture's own first frame)
// with the game HUD drawn over it in DOM (thin red HP bar, green stamina bar, top-left). Two rolls run from t: the
// stamina bar empties in two chunks and regenerates after each, a "Hot reloaded" toast slides in at the bottom right
// for each one (roll.ts, then stamina.ts), and a subtle LIVE pill sits top right.
// Pure function of t: no Date, no rAF, no CSS transition, every moving value is written from t, so ?t= freezes a frame.
import { clamp, lerp, seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Live preview is up. Roll feels right.';
const HOST = 'localhost:5173';
const SHOT = 'ds/poster.jpg';
// the two rolls: what one roll costs, how long the drop takes, how long it sits at the bottom, how long it takes to
// come back. Roll 1's whole pulse (0.16 + 0.14 + 0.70) is exactly 1.0s, so the bar is full again as roll 2 lands.
const COST = [0.58, 0.68];
const DRAIN = 0.16;
const HOLD = [0.14, 0.18];
const REGEN = [0.70, 0.75];
const TOASTS = ['Hot reloaded roll.ts', 'Hot reloaded stamina.ts'];

export default {
  times(r) {
    const T = { r };
    T.win = r + 0.24;             // the preview window grows in
    T.hud = r + 0.5;              // the HUD fades up over the frame
    T.roll = [r + 0.95, r + 1.95];// the two rolls, in the game's own time
    T.toast = [r + 1.14, r + 2.2];// the hot reload each roll causes lands just after it
    T.live = r + 0.6;             // the LIVE pill comes up with the HUD
    T.end = T.toast[1] + 0.42;    // the second reload lands, then the next request routes
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const win = x.el(`<div class="pvw-win">
      <div class="pvw-bar">${x.tile(k.app)}<b class="pvw-url">${x.esc(HOST)}</b></div>
      <div class="pvw-screen">
        <img class="pvw-shot" src="${x.img(SHOT)}" alt="Dark Souls running in the live preview"/>
        <div class="pvw-hud">
          <span class="pvw-gauge pvw-hp"><i></i></span>
          <span class="pvw-gauge pvw-st"><i></i></span>
        </div>
        <span class="pvw-live"><i class="pvw-dot"></i>LIVE</span>
        <div class="pvw-toasts">
          ${TOASTS.map((s) => `<span class="pvw-toast"><i></i>${x.esc(s)}</span>`).join('')}
        </div>
      </div>
    </div>`);
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const hud = win.querySelector('.pvw-hud');
    const live = win.querySelector('.pvw-live');
    const st = win.querySelector('.pvw-st i');
    const dot = win.querySelector('.pvw-dot');
    const toasts = [...win.querySelectorAll('.pvw-toast')];
    let shown = -1, lastSt = -1;

    // one roll: the bar drops over DRAIN, sits at the bottom for HOLD, then regenerates over REGEN
    const pulse = (t, i) => {
      const a = T.roll[i];
      return COST[i] * seg(t, a, a + DRAIN) * (1 - seg(t, a + DRAIN + HOLD[i], a + DRAIN + HOLD[i] + REGEN[i]));
    };

    return {
      nodes: [say, win],
      marks: [[T.r, say], [T.win, win]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.05, 90, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        // the window grows in, then pushes in gently for as long as the preview is live
        const ci = outCubic(seg(t, T.win, T.win + 0.55));
        const push = lerp(1, 1.02, seg(t, T.win, T.end));
        win.style.opacity = ci.toFixed(3);
        win.style.transform = ci >= 1 ? `scale(${push.toFixed(4)})`
          : `translateY(${((1 - ci) * 20).toFixed(2)}px) scale(${(lerp(0.94, 1, ci) * push).toFixed(4)})`;

        // the HUD: HP stays full, stamina takes the two rolls (both pulses are 0 once their roll is over)
        hud.style.opacity = outCubic(seg(t, T.hud, T.hud + 0.35)).toFixed(3);
        const stamina = clamp((1 - pulse(t, 0)) * (1 - pulse(t, 1)));
        const sw = Math.round(stamina * 1000) / 10;
        if (sw !== lastSt) { st.style.width = `${sw.toFixed(1)}%`; lastSt = sw; }

        // LIVE, with just enough pulse to read as a live dot (deterministic: it is a function of t)
        const lp = outCubic(seg(t, T.live, T.live + 0.4));
        live.style.opacity = (0.88 * lp).toFixed(3);
        dot.style.opacity = (0.45 + 0.55 * (0.5 + 0.5 * Math.sin((t - T.win) * 4.2))).toFixed(3);

        // the toasts: one per hot reload, newest at the bottom right. The older one lifts away as the newer arrives,
        // and the newer one stays as the beat's landed state (the window keeps its last frame after the cut).
        toasts.forEach((el, i) => {
          const slide = outCubic(seg(t, T.toast[i], T.toast[i] + 0.3));
          const out = i === 0 ? seg(t, T.toast[1], T.toast[1] + 0.24) : 0;
          el.style.opacity = (slide * (1 - out)).toFixed(3);
          const lift = i === 0 ? -32 * seg(t, T.toast[1], T.toast[1] + 0.26) : 0;
          el.style.transform = `translate(${((1 - slide) * 22).toFixed(2)}px, ${(lift + (1 - slide) * 12).toFixed(2)}px)`;
        });
      },
    };
  },
};