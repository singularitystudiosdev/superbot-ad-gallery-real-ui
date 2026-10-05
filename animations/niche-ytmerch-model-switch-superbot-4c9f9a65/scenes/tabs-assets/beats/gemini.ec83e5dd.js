// Link 3, Nano Banana Pro (Gemini 3 Pro Image): makes the pictures. Every image on this screen is a REAL output of
// google/gemini-3-pro-image (work folder assets/gemini): the four print designs from one prompt, then two edits that
// take the Blender render as input: #1 printed onto that exact mug (mockup), and the same mug on a studio desk as a
// 9:16 shot for the Short. Gemini's own dark chat: the prompt in a bubble, the images arriving through a moving colour
// shimmer that resolves blur-to-sharp, the picked one ringed in Gemini blue.
import { seg, outCubic, lerp } from '../../../lib.js';
import { ic } from '../icons.ec83e5dd.js?v=4c9f9a65';

const REVEAL = 0.45;
export default {
  times(done) {
    return { end: done + 2.25 };
  },
  build(k, ctx) {
    const im = ctx.img;
    const ws = ctx.el(`
<div class="gm">
  <div class="gm-ask"><span class="gm-tool">${ic('image-outline')}Create image</span><p>Print art for an 11 oz mug: “ONE MORE TAKE”, a retro mic, two colours. Give me 4.</p></div>
  <div class="gm-by"><img src="${ctx.brand('gemini-logo.svg')}" alt=""/><b>Nano Banana Pro</b></div>
  <div class="gm-grid">${[1, 2, 3, 4].map((n) => `<div class="gm-cell"><i class="gm-shim"></i><img src="${im(`design-${n}.webp`)}" alt=""/>${n === 1 ? '<span class="gm-pick">' + ic('check') + 'Using #1</span>' : ''}</div>`).join('')}</div>
  <div class="gm-edit"><p>Print #1 on the Blender render. Keep the mug, light and camera.</p>
    <div class="gm-ins"><span><img src="${im('mug-blank.webp')}" alt=""/><small>mug-render.png</small></span><b>+</b><span><img src="${im('design-1.webp')}" alt=""/><small>design-1.png</small></span></div></div>
  <div class="gm-out"><i class="gm-shim"></i><img src="${im('mockup.webp')}" alt=""/></div>
  <div class="gm-desk"><img src="${im('desk.webp')}" alt=""/><span><b>Desk shot</b><small>9:16 for the Short</small></span></div>
</div>`);
    const q = (s) => ws.querySelector(s);
    const cells = [...ws.querySelectorAll('.gm-cell')].map((c) => ({ c, shim: c.querySelector('.gm-shim'), img: c.querySelector('img') }));
    const pick = q('.gm-pick'), by = q('.gm-by'), ask = q('.gm-ask'), edit = q('.gm-edit');
    const out = { c: q('.gm-out'), shim: q('.gm-out .gm-shim'), img: q('.gm-out img') };
    const desk = q('.gm-desk');
    const d = k.done;
    const show = (n, t, a, dur = 0.3, dy = 12) => {
      const p = outCubic(seg(t, a, a + dur));
      n.style.opacity = p.toFixed(3);
      n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * dy).toFixed(2)}px)`;
    };
    // the shimmer drifts with time; the image resolves from blurred and bright to sharp
    const gen = (g, t, a) => {
      const p = seg(t, a, a + REVEAL);
      const e = outCubic(p);
      g.shim.style.opacity = (seg(t, a - 0.5, a - 0.25) * (1 - e)).toFixed(3);
      g.shim.style.backgroundPosition = `${((t * 140) % 400).toFixed(1)}px 0`;
      g.img.style.opacity = e.toFixed(3);
      g.img.style.filter = e >= 1 ? 'none' : `blur(${((1 - e) * 22).toFixed(2)}px) brightness(${lerp(1.35, 1, e).toFixed(3)})`;
    };
    return {
      ws,
      head: 'Gemini 3 Pro Image · generating and editing',
      say: '4 designs. #1 printed on your mug, plus a desk shot for the Short.',
      chips: ['design-1.png', 'mockup.png', 'desk-9x16.png'],
      out: 'mockup.png',
      render(t) {
        show(ask, t, k.sw + 0.12, 0.3, 10);
        show(by, t, d - 0.1, 0.25, 6);
        cells.forEach((g, i) => gen(g, t, d + 0.15 + i * 0.12));
        const pp = outCubic(seg(t, d + 0.98, d + 1.2));
        cells[0].c.classList.toggle('gm-on', t >= d + 0.98);
        pick.style.opacity = pp.toFixed(3);
        pick.style.transform = `scale(${lerp(0.8, 1, pp).toFixed(4)})`;
        cells.slice(1).forEach((g) => { g.c.style.opacity = lerp(1, 0.5, outCubic(seg(t, d + 1.0, d + 1.3))).toFixed(3); });
        show(edit, t, d + 1.08, 0.3, 10);
        out.c.style.opacity = seg(t, d + 1.1, d + 1.25).toFixed(3);
        gen(out, t, d + 1.4);
        show(desk, t, d + 1.88, 0.3, 10);
      },
    };
  },
};
