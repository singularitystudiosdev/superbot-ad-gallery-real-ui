// Beat 2 of 6, Nano Banana Pro: it storyboards the script DeepSeek just wrote, one 16:9 frame per shot, in
// Pocketsflow's own look (the style row is the brand it was handed: palette, Satoshi, Geist Mono). Each frame is the
// real film (film.f2628f01.js) frozen on that shot's key frame, so the storyboard is exactly what the cut becomes.
// Frames resolve one after another the way a diffusion sampler does: seeded noise thins out step by step while the
// frame sharpens under it. The noise is a seeded canvas, its offset per step from rnd(), so a frozen t repeats.
import { seg, lerp, outCubic } from '../../../lib.js';
import { SHOTS, tc, mountFilm } from '../../../film/film.f2628f01.js';
import { sayLine, renderSay, head, cardIn, rise, setText, rnd } from './pf-kit.f2628f01.js';

const SAY = 'Storyboarded all six shots in Pocketsflow’s own look.';
const PROMPT = 'Storyboard launch-script.md, one 16:9 frame per shot: white set, ink type, one yellow accent, real product UI.';
const SWATCH = ['#ffffff', '#0b0b0b', '#ffd43b', '#e5e5e5', '#fafafa'];
const STEPS = 30, GEN = 1.1, GAP = 0.3;

let noiseUrl = null;
function noise() {
  if (noiseUrl) return noiseUrl;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d'), im = g.createImageData(128, 128);
  for (let i = 0; i < 128 * 128; i++) {
    const v = Math.round(rnd(i + 7) * 255);
    im.data.set([v, Math.round(v * 0.96), Math.round(v * 0.9), 235], i * 4);
  }
  g.putImageData(im, 0, 0);
  noiseUrl = c.toDataURL('image/png');
  return noiseUrl;
}

export default {
  times(r) {
    const T = { r };
    T.card = r + 0.25;
    T.gen = SHOTS.map((_, i) => r + 0.75 + i * GAP);
    T.end = r + 5.0;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = sayLine(x, SAY);
    const nz = noise();
    const card = x.el(`<div class="pfc pfb">
      ${head(x, 'banana', 'Nano Banana Pro', 'image', '<span class="pfb-count">0 of 6</span>')}
      <div class="pfb-style"><span class="pfs-lab">Style</span>${SWATCH.map((c) => `<i style="background:${c}"></i>`).join('')}
        <span class="pfb-chip">Satoshi 900</span><span class="pfb-chip">Geist Mono</span><span class="pfb-chip">ref pocketsflow.com</span></div>
      <p class="pfb-pr">${x.esc(PROMPT)}</p>
      <div class="pfb-grid">${SHOTS.map((s, i) => `<figure class="pfb-f"><div class="pfb-fr"><div class="pfb-film"></div>
        <i class="pfb-nz" style="background-image:url(${nz})"></i><span class="pfb-st">Queued</span><span class="pfb-ok">${x.OK}</span></div>
        <figcaption><b>0${i + 1} ${x.esc(s.name)}</b><span>${tc(s.t0)}</span></figcaption></figure>`).join('')}</div>
    </div>`);
    const q = (s) => [...card.querySelectorAll(s)];
    const films = q('.pfb-film').map((h) => mountFilm(h));
    const fr = q('.pfb-film'), nzs = q('.pfb-nz'), sts = q('.pfb-st'), oks = q('.pfb-ok'), figs = q('.pfb-f');
    const count = card.querySelector('.pfb-count');
    return {
      nodes: [say.n, card],
      marks: [[T.r, say.n], [T.card, card]],
      render(t) {
        renderSay(say, t, T.r + 0.05);
        cardIn(card, t, T.card, T.end);
        let done = 0;
        SHOTS.forEach((s, i) => {
          films[i].set(s.key);
          rise(figs[i], seg(t, T.card + 0.15 + i * 0.05, T.card + 0.5 + i * 0.05), 6);
          const p = seg(t, T.gen[i], T.gen[i] + GEN), e = outCubic(p);
          const step = Math.min(STEPS, Math.floor(p * STEPS));
          fr[i].style.opacity = p > 0 ? lerp(0.25, 1, e).toFixed(3) : '0';
          fr[i].style.filter = p >= 1 ? 'none' : `blur(${((1 - e) * 9).toFixed(2)}px) saturate(${lerp(0.25, 1, e).toFixed(3)})`;
          nzs[i].style.opacity = p >= 1 ? '0' : (p > 0 ? (1 - e) * 0.92 : 0.5).toFixed(3);
          nzs[i].style.backgroundPosition = `${Math.round(rnd(step + i * 31) * 128)}px ${Math.round(rnd(step + i * 57 + 3) * 128)}px`;
          setText(sts[i], p <= 0 ? 'Queued' : `Step ${step}/${STEPS}`);
          sts[i].style.opacity = p >= 1 ? '0' : '1';
          rise(oks[i], seg(t, T.gen[i] + GEN, T.gen[i] + GEN + 0.25), 4);
          if (p >= 1) done++;
        });
        setText(count, `${done} of 6`);
      },
    };
  },
};
