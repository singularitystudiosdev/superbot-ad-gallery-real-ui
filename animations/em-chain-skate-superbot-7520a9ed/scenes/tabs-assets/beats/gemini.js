// Gemini 3 Pro Image (Nano Banana Pro): what an image model does. One prompt, three takes of the deck's bottom
// graphic, each resolving out of a blur under the generating band; then the shark is picked and the other two
// step back. The three images are real gemini-3-pro-image-preview renders (img/take1-3.png). Pure function of t.
import { lerp, seg, outCubic, outBack, streamCount } from '../../../lib.js';

const SAY = 'Three takes on the graphic. Going with the shark.';
const PROMPT = '90s screenprint, shark out of a wave, sunset bands, wordmark “LOW TIDE”';
const PICK = 0;

export default {
  times(r) {
    const T = { r };
    T.chip = r + 0.2;
    T.prompt = r + 0.38;
    T.take = [0, 1, 2].map((i) => r + 0.6 + i * 0.2);
    T.gen = T.take.map((a) => [a + 0.05, a + 1.1]);
    T.pick = T.gen[2][1] + 0.15;
    T.end = T.pick + 0.8;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const chip = x.el('<div class="dd-chiprow"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">Calling gemini-3-pro-image</span><b class="yt-count">3 × 2K</b></div></div>');
    const prompt = x.el(`<div class="gi-prompt"><b>prompt</b>${x.esc(PROMPT)}</div>`);
    const strip = x.el(`<div class="gi-strip">${[1, 2, 3].map((i) => `<span class="gi-take"><img src="${x.img('take' + i + '.png')}" alt=""/><i class="qc-gen"></i>
      <span class="qc-genl">${x.tile('gemini')}Creating image</span><b class="gi-n">take ${i}</b>
      <span class="gi-pick">${x.OK}Picked</span></span>`).join('')}</div>`);
    const spin = chip.querySelector('.spin'), clab = chip.querySelector('.ch-tool-t');
    const takes = [...strip.children].map((el) => ({ el, im: el.querySelector('img'), gen: el.querySelector('.qc-gen'), genl: el.querySelector('.qc-genl'), pick: el.querySelector('.gi-pick') }));
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    let shown = -1;
    return {
      nodes: [say, chip, prompt, strip],
      marks: [[T.r, say], [T.chip, chip], [T.prompt, prompt], [T.take[0], strip]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.06, 90, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        rise(chip, seg(t, T.chip, T.chip + 0.3), 8);
        const cdone = t >= T.gen[2][1];
        spin.classList.toggle('done', cdone);
        spin.style.transform = cdone ? '' : `rotate(${(((t - T.chip) * 420) % 360).toFixed(1)}deg)`;
        const cl = cdone ? 'gemini-3-pro-image · 3 images' : 'Calling gemini-3-pro-image';
        if (clab.textContent !== cl) clab.textContent = cl;
        rise(prompt, seg(t, T.prompt, T.prompt + 0.3), 6);

        // each take lands as a blur, resolves under the sweeping band, then the pick steps forward
        strip.style.opacity = t >= T.take[0] - 0.05 ? '1' : '0';
        takes.forEach((o, i) => {
          const a = seg(t, T.take[i], T.take[i] + 0.35);
          const [g0, g1] = T.gen[i];
          const p = seg(t, g0, g1), e = outCubic(p);
          o.im.style.filter = e >= 1 ? 'none' : `blur(${((1 - e) * 18).toFixed(2)}px) saturate(${lerp(0.3, 1, e).toFixed(3)})`;
          o.im.style.opacity = lerp(0.3, 1, e).toFixed(3);
          o.gen.style.transform = `translateX(${lerp(-110, 110, (p * 1.8) % 1).toFixed(1)}%)`;
          o.gen.style.opacity = (p >= 1 ? 0 : 1 - seg(p, 0.8, 1)).toFixed(3);
          o.genl.style.opacity = (seg(t, T.take[i], T.take[i] + 0.2) * (1 - seg(t, g1 - 0.2, g1))).toFixed(3);
          const picked = t >= T.pick;
          const own = i === PICK;
          const pp = outBack(seg(t, T.pick, T.pick + 0.45));
          const sc = picked ? (own ? lerp(1, 1.05, pp) : lerp(1, 0.94, seg(t, T.pick, T.pick + 0.4))) : 1;
          const ea = outCubic(a);
          o.el.style.opacity = (ea * (picked && !own ? lerp(1, 0.38, seg(t, T.pick, T.pick + 0.4)) : 1)).toFixed(3);
          o.el.style.transform = `translateY(${((1 - ea) * 14).toFixed(2)}px) scale(${sc.toFixed(4)})`;
          o.el.classList.toggle('sel', picked && own);
          o.pick.style.opacity = own ? seg(t, T.pick + 0.1, T.pick + 0.4).toFixed(3) : '0';
        });
      },
    };
  },
};