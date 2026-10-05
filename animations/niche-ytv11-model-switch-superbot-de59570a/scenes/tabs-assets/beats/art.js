// Art beat: Gemini makes the thumbnail. This is the thing Gemini is actually used for here: it takes the shot and the
// one-line idea and returns IMAGES, not text. Its line streams and a card rises holding the prompt, then a 2x2 of the
// four candidates it returned for the next video's thumbnail, each 1280 x 720, each resolving out of a blur under a
// sweeping band (the "creating images" grammar) and snapping crisp, with the video's own microphone shot under the
// type. Candidate 3 gets the ring and the check: superbot keeps it. Every candidate is the real Pexels shot
// (img/mic-frame.jpg, img/CREDITS.txt) cropped four ways with thumbnail type over it, so nothing here is drawn art.
// Pure function of t: any frame is written from t.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Generated four thumbnails from the shoot and kept the strongest.';
const PROMPT = 'Thumbnail for "I tested 12 mics under $100" — bold, high contrast, one clear subject';
// [headline, sub, crop: [background-size %, x %, y %]] — the type and the crop each candidate carries, the way four
// takes on one thumbnail read: tighter on the mic, wider on the boom, higher, closer
const CANDS = [
  ['I TESTED 12', 'MICS', [156, 20, 44]],
  ['THE $29 ONE', 'WON', [120, 74, 50]],
  ['$1,200 vs $89', 'BLIND TEST', [140, 48, 24]],
  ['DON\'T BUY', 'MIC #1', [182, 42, 58]],
];
const PICK = 2;
const FOOT = '4 candidates · 1280 × 720 · kept #3';

const CPS = 95;
const SAY_AT = 0.05;
const CARD = 0.1;
const CARD_IN = 0.24;
const W0 = 0.24;
const TILE = CANDS.map((_, i) => [W0 + i * 0.08, W0 + 0.34 + i * 0.08]);
const W1 = TILE[CANDS.length - 1][1];
const PICK_AT = W1 + 0.12;
const FOOT_AT = PICK_AT + 0.24;
const FOOT_IN = 0.2;

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.w0 = r + W0;
    T.tile = TILE.map(([a, b]) => [r + a, r + b]);
    T.pick = r + PICK_AT;
    T.foot = r + FOOT_AT;
    T.end = Math.max(T.foot + FOOT_IN, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="ga-card">
      <div class="ga-prompt"><span class="ga-spark"></span><span class="ga-ptx">${x.esc(PROMPT)}</span><span class="ga-gen">Creating images</span></div>
      <div class="ga-grid">${CANDS.map(([h, s, crop]) => `<span class="ga-c">
        <span class="ga-im" style="background-image: url(${x.img('mic-frame.jpg')}); background-size: ${crop[0]}% auto; background-position: ${crop[1]}% ${crop[2]}%"></span>
        <span class="ga-type"><b>${x.esc(h)}</b><i>${x.esc(s)}</i></span>
        <i class="ga-ring"></i><span class="ga-ck">${x.OK}</span>
      </span>`).join('')}<i class="ga-band"></i></div>
      <div class="ga-ft">${x.OK}<span>${x.esc(FOOT)}</span></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const tiles = [...card.querySelectorAll('.ga-c')];
    const imgs = [...card.querySelectorAll('.ga-im')];
    const types = [...card.querySelectorAll('.ga-type')];
    const band = $('.ga-band'), ft = $('.ga-ft'), gen = $('.ga-gen');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1;
    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card], [T.pick, tiles[PICK]], [T.foot, ft]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + CARD_IN));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;
        // the candidates resolve out of a blur (a generated image sharpening), the type a beat behind
        tiles.forEach((c, i) => {
          const [a, b] = T.tile[i];
          const p = seg(t, a, b);
          const e = outCubic(p);
          imgs[i].style.filter = p >= 1 ? 'none' : `blur(${((1 - e) * 9).toFixed(2)}px)`;
          imgs[i].style.transform = p >= 1 ? 'none' : `scale(${lerp(1.07, 1, e).toFixed(4)})`;
          types[i].style.opacity = seg(t, b - 0.14, b + 0.06).toFixed(3);
        });
        // the sweeping band while the grid is still generating
        const p = seg(t, T.w0 - 0.1, W1_abs(T));
        band.style.opacity = (p > 0 && p < 1 ? Math.min(1, p * 6, (1 - p) * 6) : 0).toFixed(3);
        band.style.left = `${(-18 + p * 132).toFixed(2)}%`;
        gen.textContent = t >= W1_abs(T) ? '4 images' : 'Creating images';
        gen.classList.toggle('ga-gen-done', t >= W1_abs(T));
        // the kept candidate rings and checks
        const ring = tiles[PICK].querySelector('.ga-ring'), ck = tiles[PICK].querySelector('.ga-ck');
        const e2 = outCubic(seg(t, T.pick, T.pick + 0.2));
        ring.style.opacity = e2.toFixed(3);
        ring.style.transform = `scale(${lerp(1.12, 1, e2).toFixed(4)})`;
        ck.style.opacity = e2.toFixed(3);
        ck.style.transform = `scale(${lerp(0.5, 1, e2).toFixed(4)})`;
        const f = outCubic(seg(t, T.foot, T.foot + FOOT_IN));
        ft.style.opacity = f.toFixed(3);
        ft.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 6).toFixed(2)}px)`;
      },
    };
  },
};
// the band's travel ends when the last tile lands
function W1_abs(T) { return T.tile[T.tile.length - 1][1]; }