// Photos beat: GPT-6 Astra reads the 4 photos customers sent and prices each repair (the Instagram fork's roll.js
// vision grammar). Its line streams and a card rises holding the 4 real photos (img/bike-*.jpg, Unsplash,
// img/CREDITS.txt) in a row, each under the customer who sent it. A scan line sweeps the row left to right; as it
// crosses a photo a detection box closes on the problem, and the diagnosis and its quote land under the photo.
// The footer tallies: "4 photos read, 4 repair quotes ready". Pure function of t: every moving value is written from
// t, so ?t= and __AD.seek freeze any frame.
import { lerp, seg, outCubic } from '../../../lib.js';

const SAY = 'Looked at the 4 photos customers sent and priced each repair.';
// [photo, sender, diagnosis, quote, the detection box in % of the photo: left, top, width, height]
export const PHOTOS = [
  ['bike-wheel.jpg', 'Tom Becker', 'Rear wheel out of true', 'Truing $35', [12, 16, 72, 74]],
  ['bike-chain.jpg', 'João Pereira', 'Snapped chain', 'New chain $45', [6, 48, 26, 48]],
  ['bike-flat.jpg', 'Priya Shah', 'Pinch flat', 'Tube swap $18', [12, 52, 60, 40]],
  ['bike-brake.jpg', 'Dana Kim', 'Pads worn to metal', 'Pads + bleed $40', [24, 20, 54, 50]],
];
const TALLY = '4 photos read, 4 repair quotes ready';
// timing (seconds from the reply start, or from the card where noted), in the source's v3 pace
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const SCAN_AT = 0.24;                  // the card landing to the scan line starting
const SCAN = 0.7; /* deliberate */     // the scan line crossing the row, left to right
const BOX_IN = 0.2;                    // a detection box closing on the problem
const TAG_AT = 0.1;                    // the box in, then the diagnosis and quote land
const TAG_IN = 0.22;
const TALLY_AT = 0.15;                 // the last quote in to the tally footer
const TALLY_IN = 0.24;

const pct = (v) => `${(v * 100).toFixed(3)}%`;

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.s0 = T.card + SCAN_AT;
    T.s1 = T.s0 + SCAN;
    // the scan is linear in x, so a photo's box closes as the line crosses that photo's middle
    T.box = PHOTOS.map((_, i) => T.s0 + SCAN * ((i + 0.5) / PHOTOS.length));
    T.tag = T.box.map((b) => b + BOX_IN + TAG_AT);
    T.tally = Math.max(T.s1, T.tag[PHOTOS.length - 1] + TAG_IN) + TALLY_AT;
    T.end = Math.max(T.tally + TALLY_IN, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="ph-card">
      <div class="ph-hd"><span class="ph-st"><i class="ph-spin"></i>${x.OK}</span><b>Reading 4 photos from customers</b><span class="ph-of">4 chats</span></div>
      <div class="ph-row">
        ${PHOTOS.map(([f, who, dx, q, [l, tp, w, h]]) => `<div class="ph-cell">
          <small class="ph-who">${x.esc(who)}</small>
          <span class="ph-ph"><img src="${x.img(f)}" alt=""/><i class="ph-box" style="left:${l}%;top:${tp}%;width:${w}%;height:${h}%"></i></span>
          <div class="ph-tag"><b>${x.esc(dx)}</b><span>${x.esc(q)}</span></div>
        </div>`).join('')}
        <i class="ph-scan"></i>
      </div>
      <div class="ph-ft">${x.OK}<span>${x.esc(TALLY)}</span></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const cells = [...card.querySelectorAll('.ph-cell')].map((n) => ({ box: n.querySelector('.ph-box'), tag: n.querySelector('.ph-tag'), img: n.querySelector('img') }));
    const scan = $('.ph-scan'), ft = $('.ph-ft'), spin = $('.ph-spin'), ok = $('.ph-st .qc-ok');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1;

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card], [T.tally, ft]],
      render(t) {
        const ns = Math.max(0, Math.min(SAY.length, Math.floor((t - T.r - SAY_AT) * CPS + 1e-6)));
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // the scan line: linear left to right, fading in and out at the ends
        const p = seg(t, T.s0, T.s1);
        scan.style.left = pct(p);
        scan.style.opacity = (p > 0 && p < 1 ? Math.min(1, p * 8, (1 - p) * 8) : 0).toFixed(3);
        cells.forEach((c, i) => {
          const b = outCubic(seg(t, T.box[i], T.box[i] + BOX_IN));
          c.box.style.opacity = b.toFixed(3);
          c.box.style.transform = b >= 1 ? 'none' : `scale(${lerp(1.35, 1, b).toFixed(4)})`;
          const q = outCubic(seg(t, T.tag[i], T.tag[i] + TAG_IN));
          c.tag.style.opacity = q.toFixed(3);
          c.tag.style.transform = q >= 1 ? 'none' : `translateY(${((1 - q) * 6).toFixed(2)}px)`;
        });
        const d = outCubic(seg(t, T.s1, T.s1 + 0.2));
        spin.style.opacity = (1 - seg(t, T.s1 - 0.08, T.s1 + 0.06)).toFixed(3);
        spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        ok.style.opacity = d.toFixed(3);
        ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;

        const f = outCubic(seg(t, T.tally, T.tally + TALLY_IN));
        ft.style.opacity = f.toFixed(3);
        ft.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 6).toFixed(2)}px)`;
      },
    };
  },
};
