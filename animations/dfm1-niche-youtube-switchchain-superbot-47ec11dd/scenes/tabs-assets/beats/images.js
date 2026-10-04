// Images beat: Gemini 3 Pro Image (Nano Banana Pro) generates the YouTube thumbnail and the three title cards from
// DeepSeek's hook ("open on the $29 winner, price on screen"). Its line streams and a card rises in Gemini's visual
// language: the model row (Gemini spark, the exact Gemini API model id gemini-3-pro-image, the REST imageConfig field
// aspectRatio "16:9", a counter "Generating n of 4" resolving to the check), the prompt chip (a verbatim excerpt of the
// thumbnail prompt in img/gen/CREDITS.txt), then a 2x2 grid of 16:9 tiles: the thumbnail first, then title cards 1 to 3.
// Each tile starts as a shimmer placeholder and resolves from blur and noise to the sharp image, staggered. The images
// are the real Gemini API outputs in img/gen/ (CREDITS.txt holds the model id, the date and the exact prompts). The
// footer lands with the save path and the SynthID note (every Gemini image carries an invisible SynthID watermark).
// Pure function of t: every moving value is written from t (the noise grain steps with the frame index of t, seeded),
// so ?t= and __AD.seek freeze any frame.
import { lerp, seg, outCubic, inOutCubic, streamCount, rand } from '../../../lib.js';

const SAY = 'Generated your thumbnail and 3 title cards from the hook.';
export const MODEL = 'gemini-3-pro-image';
// verbatim fragments of the thumbnail prompt (img/gen/CREDITS.txt), joined where the prompt was cut
const PROMPT = 'YouTube video thumbnail, 16:9 ... Huge bold white sans-serif headline text "$29 BEAT $300"';
// the four outputs, in the order they were generated: [file under img/, caption, file name]
export const TILES = [
  ['gen/thumb.jpg', 'Thumbnail', 'thumb.jpg'],
  ['gen/title-1.jpg', 'Title card 1', 'title-1.jpg'],
  ['gen/title-2.jpg', 'Title card 2', 'title-2.jpg'],
  ['gen/title-3.jpg', 'Title card 3', 'title-3.jpg'],
];
const DONE = '4 images, 16:9, saved to img/gen';
// timing (seconds from the reply start, or from the card where noted)
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const GEN_AT = 0.3;                    // the card starting to rise to the first tile resolving
const STAGGER = 0.24;                  // one tile's reveal to the next
const RESOLVE = 0.72; /* deliberate */ // one tile resolving from noise and blur to sharp
const FOOT_AT = 0.1;                   // the last tile sharp to the footer
const FOOT_IN = 0.24;                  // the footer rising in
const FPS = 30;                        // the noise grain steps once per frame of the spot's clock

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.gen = TILES.map((_, i) => T.card + GEN_AT + i * STAGGER);
    T.done = T.gen[TILES.length - 1] + RESOLVE;
    T.foot = T.done + FOOT_AT;
    T.end = Math.max(T.foot + FOOT_IN, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="gi-card">
      <div class="gi-hd"><img class="gi-spark" src="${x.brand('gemini-logo.svg')}" alt=""/><b class="gi-model">${MODEL}</b><span class="gi-ar">aspectRatio <i>16:9</i></span>
        <span class="gi-stat"><span class="gi-st"><i class="gi-spin"></i>${x.OK}</span><span class="gi-cnt">Generating 1 of 4</span></span></div>
      <div class="gi-prompt"><span class="gi-pl">Prompt</span><span class="gi-pt">${x.esc(PROMPT)}</span></div>
      <div class="gi-grid">${TILES.map(([src, cap, file], i) => `<figure class="gi-tile${i === 0 ? ' gi-first' : ''}">
        <span class="gi-frame"><i class="gi-shim"></i><img src="${x.img(src)}" width="1280" height="720" alt=""/><i class="gi-noise"></i></span>
        <figcaption><b>${x.esc(cap)}</b><span>${x.esc(file)}</span></figcaption></figure>`).join('')}</div>
      <div class="gi-ft">${x.OK}<span>${x.esc(DONE)}</span><small>SynthID watermark included</small></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const st = { spin: $('.gi-spin'), ok: $('.gi-st .qc-ok') };
    const cnt = $('.gi-cnt'), ft = $('.gi-ft');
    const tiles = [...card.querySelectorAll('.gi-tile')].map((n) => ({
      n, shim: n.querySelector('.gi-shim'), img: n.querySelector('img'), noise: n.querySelector('.gi-noise'), cap: n.querySelector('figcaption'),
    }));
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, label = '';

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card], [T.foot, ft]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // the counter: "Generating n of 4" names the tile resolving now, then "4 of 4 generated"
        const made = T.gen.filter((g) => t >= g + RESOLVE * 0.8).length; // a tile counts once it reads as sharp
        const lb = made >= TILES.length ? '4 of 4 generated' : `Generating ${made + 1} of 4`;
        if (lb !== label) { cnt.textContent = lb; label = lb; }
        const d = outCubic(seg(t, T.done, T.done + 0.2));
        st.spin.style.opacity = (1 - seg(t, T.done - 0.08, T.done + 0.06)).toFixed(3);
        st.spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        st.ok.style.opacity = d.toFixed(3);
        st.ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;

        // each tile: a shimmer sweeping the empty frame, then the image resolving out of noise and blur
        const frame = Math.floor(t * FPS);
        tiles.forEach((tl, i) => {
          const g = T.gen[i];
          const sweep = ((t - T.card) / 0.9) % 1; // the shimmer band crosses the frame every 0.9 s
          tl.shim.style.transform = `translateX(${lerp(-100, 100, sweep < 0 ? 0 : sweep).toFixed(2)}%)`;
          const p = seg(t, g, g + RESOLVE);
          const e = inOutCubic(p);
          tl.shim.style.opacity = (1 - seg(t, g, g + 0.2)).toFixed(3);
          const o = outCubic(seg(t, g, g + 0.26));
          tl.img.style.opacity = o.toFixed(3);
          const blur = lerp(16, 0, e), sat = lerp(0.35, 1, e), br = lerp(1.35, 1, e);
          tl.img.style.filter = p >= 1 ? 'none' : `blur(${blur.toFixed(2)}px) saturate(${sat.toFixed(3)}) brightness(${br.toFixed(3)})`;
          tl.img.style.transform = p >= 1 ? 'none' : `scale(${lerp(1.08, 1, e).toFixed(4)})`;
          const nz = p <= 0 ? 0 : (1 - outCubic(seg(t, g + 0.08, g + RESOLVE))) * 0.85;
          tl.noise.style.opacity = nz.toFixed(3);
          if (nz > 0) tl.noise.style.backgroundPosition = `${Math.floor(rand(frame * 4 + i) * 128)}px ${Math.floor(rand(frame * 4 + i + 97) * 128)}px`;
          const c = outCubic(seg(t, g + RESOLVE - 0.2, g + RESOLVE + 0.04));
          tl.cap.style.opacity = lerp(0.35, 1, c).toFixed(3);
          tl.n.classList.toggle('gi-on', p >= 1);
        });

        const f = outCubic(seg(t, T.foot, T.foot + FOOT_IN));
        ft.style.opacity = f.toFixed(3);
        ft.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 6).toFixed(2)}px)`;
      },
    };
  },
};
