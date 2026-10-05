// Images beat: Nano Banana Pro (Gemini 3 Pro Image) makes one photo per stretch of the course. In Gemini's dark
// image view: the prompt bubble, then three 16:9 tiles shimmering as they generate and resolving one after another.
// The three photos are the real outputs of google/nano-banana-pro for that prompt (media/img/, 2752x1536 originals,
// which carry Google's SynthID watermark as every Gemini image does).
import { seg, outCubic } from '../../../lib.js';
import { sayLine, rise, land, setText, statusRender, cardHead, media, withFocus } from './kit.9f1df009.js?v=9f1df009';

const SAY = 'One photo per stretch, so race morning already looks familiar.';
const PROMPT = 'Photoreal, 16:9, no text: the dawn start by the Brooklyn Museum, the East Drive hill, the boardwalk finish';
const SHOTS = [['start', 'Start · Washington Ave'], ['hill', 'Mile 5 · East Drive hill'], ['finish', 'Finish · Coney Island']];
const RES = 0.45; // one tile resolving
const META = '2752×1536 each · SynthID watermark';

export default {
  times(r, opts = {}) {
    const T = { r };
    T.card = r + 0.14;
    T.ask = T.card + 0.18;
    T.label = T.card + 0.42;
    T.gen = T.card + 0.5;                                    // the tiles start shimmering
    T.res = SHOTS.map((_, i) => T.gen + 0.7 + i * 0.28);     // each tile resolves
    T.done = T.res[SHOTS.length - 1] + RES;
    T.meta = T.done + 0.06;
    return withFocus(T, opts, T.card + 0.36, T.done + 1.0); // the camera pushes in on the output, then glides to the next pill
  },
  build(k, x) {
    const T = k.T;
    const say = sayLine(x, SAY, T.r + 0.05);
    const card = x.el(`<div class="rk-card nb-card">
      ${cardHead(x, 'nanobanana-logo.svg', 'Generating 3 course photos', '<b class="rk-n">0</b> / 3 · 16:9 · 2K')}
      <div class="nb-gem">
        <div class="nb-ask"><span>${x.esc(PROMPT)}</span></div>
        <div class="nb-by"><img src="${x.brand('gemini-logo.svg')}" alt=""><b>Nano Banana Pro</b><s>Gemini 3 Pro Image</s></div>
        <div class="nb-grid">${SHOTS.map(([f, c]) => `<figure class="nb-t"><div class="nb-img"><i class="nb-sh"></i><i class="nb-sp"></i>
          <img src="${media(`img/${f}.jpg`)}" alt=""></div><figcaption>${x.esc(c)}</figcaption></figure>`).join('')}</div>
      </div>
      <div class="nb-meta">${x.OK}<span>${x.esc(META)}</span></div>
    </div>`);
    const $ = (s) => card.querySelector(s), $$ = (s) => [...card.querySelectorAll(s)];
    const st = $('.rk-st'), n = $('.rk-n'), ask = $('.nb-ask'), by = $('.nb-by'), meta = $('.nb-meta');
    const tiles = $$('.nb-t').map((f) => ({ f, sh: f.querySelector('.nb-sh'), sp: f.querySelector('.nb-sp'), img: f.querySelector('img'), cap: f.querySelector('figcaption') }));
    return {
      nodes: [say.n, card],
      focus: T.focus ? card : null, // the camera's target while T.focus runs (chat.js FOCUS; zoom cut only)
      marks: [[T.r, say.n], [T.card, card], [T.meta, meta]],
      render(t) {
        say.render(t);
        rise(card, seg(t, T.card, T.card + 0.36));
        statusRender(st, t, T.card, T.done);
        land(ask, seg(t, T.ask, T.ask + 0.24), 8);
        land(by, seg(t, T.label, T.label + 0.2), 4);
        let made = 0;
        tiles.forEach((o, i) => {
          land(o.f, seg(t, T.gen + i * 0.05, T.gen + i * 0.05 + 0.22), 6);
          // generating: a light band sweeps across, the sparkle breathes; then the photo resolves out of a blur
          const sweep = ((t - T.gen) * 0.9 + i * 0.27) % 1;
          o.sh.style.transform = `translateX(${(-100 + 200 * sweep).toFixed(1)}%)`;
          const r = outCubic(seg(t, T.res[i], T.res[i] + RES));
          o.sh.style.opacity = (1 - r).toFixed(3);
          o.sp.style.opacity = ((1 - r) * (0.55 + 0.45 * Math.sin((t - T.gen) * 7 + i))).toFixed(3);
          o.img.style.opacity = r.toFixed(3);
          o.img.style.filter = r >= 1 ? 'none' : `blur(${((1 - r) * 9).toFixed(2)}px) saturate(${(0.6 + 0.4 * r).toFixed(3)})`;
          o.img.style.transform = r >= 1 ? 'none' : `scale(${(1.06 - 0.06 * r).toFixed(4)})`;
          land(o.cap, seg(t, T.res[i] + 0.1, T.res[i] + 0.34), 3);
          if (t >= T.res[i] + RES * 0.6) made++;
        });
        setText(n, String(made));
        land(meta, seg(t, T.meta, T.meta + 0.22), 4);
      },
    };
  },
};
