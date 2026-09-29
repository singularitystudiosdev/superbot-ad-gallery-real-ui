// confetti.js: the "superbot can." burst. A deterministic particle system with no state of its own: every
// particle's position, rotation and 3D flip is a closed form of its age (linear air drag + gravity, integrated
// analytically), and the whole table is built once from a seeded PRNG (lib.rand). So ?t=<s> and __AD.seek(t)
// redraw the identical frame, and the burst rains on past the cut into the chat because it is drawn on a
// stage-level canvas from the spot's ABSOLUTE t, not from a scene's local time.
//
// Physics: with drag k and gravity g (both in stage px), v(t) = g/k + (v0 - g/k) e^-kt, and
//   y(t) = y0 + (g/k) t + (v0 - g/k) (1 - e^-kt)/k
// The drag is heavy (terminal speed ~440 px/s): a piece arcs to its peak inside the 1080-tall frame, then
// flutters back down through it for about two seconds, which is what makes the burst read as confetti rather
// than as a spray that vanishes off the top.
import { seg, lerp, rand } from './lib.js';

// gold, red, green, white, and superbot's blue-violet accent
const COLORS = ['#ffd23f', '#ff3040', '#2ee59d', '#ffffff', '#7c8cf8'];
const RECTS = 256, RIBBONS = 26, TOTAL = RECTS + RIBBONS;
const DRAG = 3.2;    // 1/s
const GRAV = 1400;   // px/s^2, in the 1080-tall stage
const FLASH = 0.5;   // s of extra canvas bloom right on the burst
const SPAN = 864;    // horizontal launches are authored against this stage width and scaled by W/SPAN

// one row per piece, all derived from its index so the table never changes between frames or reloads
const P = Array.from({ length: TOTAL }, (_, i) => {
  const r = (k) => rand(i * 17.13 + k * 91.7);
  const ribbon = i >= RECTS;
  // two bottom-corner cannons firing up and inward, plus a lighter centre spout
  const lane = r(1);
  const side = lane < 0.44 ? -1 : lane < 0.88 ? 1 : 0;
  const nx = side === -1 ? 0.06 : side === 1 ? 0.94 : 0.5;
  const speed = (side === 0 ? lerp(2200, 3400, r(2)) : lerp(2500, 4300, r(2))) * (ribbon ? 1.05 : 1);
  // the angle away from straight up, leaning inward: the corner cannons mostly fire across the frame
  const theta = (side === 0 ? (r(3) - 0.5) * 1.6 : lerp(-0.2, 1.0, r(3)));
  return {
    side, nx,
    ny: side === 0 ? 1.02 : 1.0,
    vx: Math.sin(theta) * speed * (side === 0 ? 1 : -side),
    vy: -Math.cos(theta) * speed * 0.97,
    // pieces die as they leave the frame, so the fade only touches the last stragglers and the burst never
    // blinks out mid-air
    life: lerp(2.5, 2.85, r(4)) * (ribbon ? 1.05 : 1),
    rot0: r(5) * Math.PI * 2,
    rotV: lerp(-8.5, 8.5, r(6)),
    flipV: lerp(3.2, 9.5, r(7)),
    flipP: r(8) * Math.PI * 2,
    w: ribbon ? 5.5 : lerp(7, 15, r(9)),
    h: ribbon ? lerp(42, 68, r(10)) : lerp(9, 21, r(11)),
    col: COLORS[Math.min(COLORS.length - 1, Math.floor(r(12) * COLORS.length))],
    ribbon,
  };
});

/**
 * Draw the burst for absolute spot time t. Nothing is drawn before T0 or after the last piece dies.
 * @param {CanvasRenderingContext2D} g
 * @param {number} t absolute seconds on the spot's clock
 * @param {number} T0 seconds at which the burst fires
 * @param {number} W stage width (window.AR.w), px
 * @param {number} H stage height (always 1080), px
 */
export function renderConfetti(g, t, T0, W, H) {
  g.clearRect(0, 0, W, H);
  const age = t - T0;
  if (age < 0 || age > 3.6) return;
  const k = DRAG, term = GRAV / k, e = Math.exp(-k * age), inv = (1 - e) / k;
  const kx = W / SPAN; // narrow frames fire the same shape with a shorter reach
  for (const p of P) {
    const a = age;
    if (a > p.life) continue;
    const x = p.nx * W + p.vx * kx * inv;
    const y = p.ny * H + term * a + (p.vy - term) * inv;
    const op = Math.min(seg(a, 0, 0.07), 1 - seg(a, p.life - 0.5, p.life));
    if (op <= 0) continue;
    g.save();
    g.globalAlpha = op;
    g.translate(x, y);
    g.rotate(p.rot0 + p.rotV * a);
    g.fillStyle = p.col;
    // the 3D flip: the piece narrows to nothing and back on one axis
    const sy = Math.cos(p.flipP + p.flipV * a);
    g.scale(1, sy);
    if (p.ribbon) {
      // a ribbon is the same strip drawn in three pieces, each nudged sideways by a travelling wave, so it
      // reads as a flexing streamer as it tumbles
      const third = p.h / 3;
      for (let j = 0; j < 3; j++) {
        g.fillRect(-p.w / 2 + Math.sin(a * 6.5 + j * 1.15) * 4.2, -p.h / 2 + j * third, p.w, third * 1.02);
      }
    } else {
      g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    }
    g.restore();
  }
  // a short bloom on the slam, so the burst reads as a hit rather than a slow spray
  const fl = seg(age, 0, FLASH);
  if (fl < 1) {
    const grd = g.createRadialGradient(W * 0.5, H * 0.66, 0, W * 0.5, H * 0.66, Math.max(W, H) * 0.62);
    grd.addColorStop(0, `rgba(255,210,63,${(0.20 * (1 - fl)).toFixed(3)})`);
    grd.addColorStop(1, 'rgba(255,210,63,0)');
    g.globalAlpha = 1;
    g.fillStyle = grd;
    g.fillRect(0, 0, W, H);
  }
}

export const CONFETTI_LIFE = 3.6;