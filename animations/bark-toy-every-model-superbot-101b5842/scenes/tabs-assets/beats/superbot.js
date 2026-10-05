// Superbot — the last mile: everything the other four models made becomes a thing that can be ordered. Its job:
// send the mesh to a full-colour print, load the bark onto the chips, check out. The pane is the order, then the
// spot lands on the finished piece: a pointer presses the paw, the bark rings out of his mouth, and that press is
// the one sound in the spot (assets-src/mk-audio places the bark at T.press).
import { seg, outCubic, inOutCubic, lerp, streamCount, outBack, press } from '../../../lib.js';

const SAY = 'Ordered two: full-colour print, bark on the chip. Arrives Thursday.';
const ROWS = [
  ['Sending the mesh to print', 'Sent to print · full colour · 6h 40m'],
  ['Loading bark.wav onto the chips', 'Loaded bark.wav · 2 chips'],
  ['Checking out with your saved card', 'Checked out · $75.20 · Visa 4242'],
];
// on the hero render (assets/img/hero.jpg, 1:1): his front paw and the tip of his nose, as fractions of the image
const PAW = [0.40, 0.805], NOSE = [0.255, 0.475];

export default {
  times(r) {
    const T = { r };
    T.rows = [r + 0.12, r + 0.5, r + 0.88];
    T.rowsDone = [r + 0.8, r + 1.15, r + 1.9];
    T.place = r + 1.95;
    T.steps = [r + 2.1, r + 2.45, r + 2.85];
    T.final = [r + 3.0, r + 3.5];
    T.pointer = [r + 3.55, r + 4.3];   // the pointer comes in and lands on the paw
    T.press = r + 4.35;                 // the paw goes down: bark
    T.end = r + 5.9;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const rows = ROWS.map(([run]) => x.el(`<div class="dd-chiprow"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">${x.esc(run)}</span></div></div>`));
    const a = x.pane.q('order', '#or-a');
    const b = x.pane.q('order', '#or-b');
    const shine = x.pane.q('order', '#or-shine');
    const btn = a.parentElement;
    const wrap = x.pane.q('order', '#or-wrap');
    const fina = x.pane.q('order', '#or-fina');
    const big = x.pane.q('order', '.or-big');
    const hero = big.querySelector('img');
    const rings = x.pane.q('order', '#or-rings');
    const ringEls = [...rings.children];
    const cap = x.pane.q('order', '.or-cap');
    const steps = [...x.pane.q('order', '#or-steps').querySelectorAll('.or-step')];
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const chips = rows.map((r) => r.firstElementChild);
    let shown = -1;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };

    return {
      nodes: [say, ...rows],
      marks: [[T.r, say], ...rows.map((r, i) => [T.rows[i], r])],
      render(t) {
        const n = streamCount(SAY, T.r + 0.05, 100, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        chips.forEach((c, i) => {
          rise(rows[i], seg(t, T.rows[i], T.rows[i] + 0.28), 8);
          const done = t >= T.rowsDone[i];
          const sp = c.firstElementChild;
          sp.classList.toggle('done', done);
          sp.style.transform = done ? '' : `rotate(${(((t - T.rows[i]) * 450) % 360).toFixed(1)}deg)`;
          const lab = done ? ROWS[i][1] : ROWS[i][0];
          if (c.lastElementChild.textContent !== lab) c.lastElementChild.textContent = lab;
        });

        // the order button: press, then the swap to "Ordered!" with a shine
        const P = T.place, pr = press(t, P);
        btn.style.transform = `scale(${(1 - 0.045 * pr).toFixed(4)})`;
        a.style.opacity = (1 - outCubic(seg(t, P + 0.02, P + 0.26))).toFixed(3);
        const gi = seg(t, P + 0.08, P + 0.4);
        b.style.opacity = outCubic(gi).toFixed(3);
        b.style.transform = `scale(${lerp(0.9, 1, outBack(gi)).toFixed(3)})`;
        const sh = seg(t, P + 0.02, P + 0.55);
        shine.style.opacity = (sh > 0 && sh < 1 ? Math.sin(Math.PI * Math.min(1, sh * 1.3)) : 0).toFixed(3);
        shine.style.transform = `translateX(${lerp(-160, 320, 0.5 - Math.cos(Math.PI * sh) / 2).toFixed(1)}%) skewX(-20deg)`;
        steps.forEach((s, i) => {
          const on = t >= T.steps[i];
          s.classList.toggle('on', on);
          s.style.opacity = on ? '1' : (0.55 + 0.45 * outCubic(seg(t, T.steps[i] - 0.4, T.steps[i]))).toFixed(3);
        });

        // the spot lands on the piece itself: the order card gives way to the finished toy
        const fp = outCubic(seg(t, T.final[0], T.final[1]));
        fina.style.opacity = fp.toFixed(3);
        fina.style.visibility = fp > 0 ? 'visible' : 'hidden';
        wrap.style.opacity = (1 - fp).toFixed(3);
        const sp = outCubic(seg(t, T.final[0] + 0.1, T.final[1] + 0.5));
        const squash = 1 - 0.035 * press(t, T.press);       // the figure gives a little under the press
        big.style.transform = `scale(${(lerp(1.06, 1, sp) * squash).toFixed(4)})`;
        cap.style.opacity = seg(t, T.final[1] - 0.05, T.final[1] + 0.3).toFixed(3);
        cap.style.transform = `translateY(${((1 - seg(t, T.final[1], T.final[1] + 0.4)) * 14).toFixed(2)}px)`;

        // the bark: three arcs out of his nose, opening to the left, one after another
        rings.style.left = (hero.offsetLeft + NOSE[0] * hero.offsetWidth - 14).toFixed(1) + 'px';
        rings.style.top = (hero.offsetTop + NOSE[1] * hero.offsetHeight).toFixed(1) + 'px';
        ringEls.forEach((ring, i) => {
          const q = seg(t, T.press + 0.04 + i * 0.13, T.press + 0.74 + i * 0.13);
          ring.style.opacity = (q > 0 && q < 1 ? 0.95 * (1 - q) : 0).toFixed(3);
          ring.style.transform = `rotate(-45deg) scale(${lerp(0.35, 1.6, outCubic(q)).toFixed(3)})`;
        });
      },
      // the pointer comes in from the lower right and presses his front paw
      pointer(t) {
        if (t < T.pointer[0] || t > T.press + 0.75) return null;
        const r = x.box(hero);
        if (!r.w) return null;
        const tx = r.x + PAW[0] * r.w, ty = r.y + PAW[1] * r.h;
        const m = inOutCubic(seg(t, T.pointer[0], T.pointer[1]));
        const v = seg(t, T.pointer[0], T.pointer[0] + 0.2) * (1 - seg(t, T.press + 0.5, T.press + 0.75));
        return { x: lerp(r.x + r.w * 0.92, tx, m), y: lerp(r.y + r.h * 1.02, ty, m), p: press(t, T.press), v };
      },
    };
  },
};