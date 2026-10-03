// Sketches beat: GPT-6 Astra looks at the creator's 38 sketchbook photos, picks the pages for the post and writes the
// lead image's alt text. Its line streams and a card rises: six of her photos pop in beside the frame (img/page-1..6.jpg,
// real photos of open sketchbooks, Unsplash Licence, img/CREDITS.txt), the pick ring lands on the first one and it opens
// in the frame (img/lead.jpg, the same photo cropped 16:9). A scan line sweeps it top to bottom; as it passes the robin a
// detection box lands on it with its label, "Lead image: the robin". Then the alt text lands (true of the photo), the
// status chip "Straightened, cropped, color matched", and the tally footer: "Picked 8 of 38 sketchbook photos".
// The box sits on what the photo really shows: BOX below is measured on the crop itself (1280 x 720 px), the ink and
// watercolor robin on its branch. Pure function of t: every moving value is written from t, so ?t= and __AD.seek
// freeze any frame.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';
import { lc } from './lucide-icons.js?v=8f4b57c6';

const SAY = 'Looked at all 38 sketchbook photos and picked the pages.';
const PHOTO = { w: 1280, h: 720 };
// the robin, in the crop's pixels: [label, x0, y0, x1, y1]
const BOX = ['Lead image: the robin', 588, 116, 1078, 602];
const ROLL = 6;                        // her photos shown beside the frame (page-1 is the pick)
// the alt text: what img/lead.jpg actually shows
export const ALT = 'An open sketchbook with an ink and watercolor robin perched on a branch.';
const CHIP = 'Straightened, cropped, color matched';
export const TALLY = 'Picked 8 of 38 sketchbook photos';
// timing (seconds from the reply start, or from the card where noted), in the base's v3 pace
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const ROLL_AT = 0.06;                  // the card rising to the first photo popping in
const ROLL_STAGGER = 0.03;             // one photo to the next
const ROLL_IN = 0.16;
const PICK_AT = 0.1;                   // the scan starting, the pick ring lands on the lead page (just before)
const SCAN_AT = 0.24;                  // the card landing to the scan line starting
const SCAN = 0.7; /* deliberate */     // the scan line crossing the frame, top to bottom
const BOX_IN = 0.16;                   // the box (and its label) popping in as the scan passes the robin's middle
const ALT_AT = 0.08;                   // the scan done to the alt text
const ALT_IN = 0.24;                   // the alt text landing
const CHIP_AT = 0.16;                  // the alt text to the status chip
const CHIP_IN = 0.24;
const TALLY_AT = 0.16;                 // the chip to the tally footer
const TALLY_IN = 0.24;                 // the tally rising in

const pct = (v) => `${(v * 100).toFixed(3)}%`;

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.roll = Array.from({ length: ROLL }, (_, i) => T.card + ROLL_AT + i * ROLL_STAGGER);
    T.s0 = T.card + SCAN_AT;
    T.pick = T.s0 - PICK_AT;
    T.s1 = T.s0 + SCAN;
    // the scan is linear in y, so the box lands the moment the line crosses the robin's middle
    T.box = T.s0 + SCAN * ((BOX[2] + BOX[4]) / 2 / PHOTO.h);
    T.alt = T.s1 + ALT_AT;
    T.chip = T.alt + CHIP_AT;
    T.tally = T.chip + TALLY_AT;
    T.end = Math.max(T.tally + TALLY_IN, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const [label, x0, y0, x1, y1] = BOX;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="fr-card">
      <div class="fr-hd"><span class="fr-st"><i class="fr-spin"></i>${x.OK}</span><b>Picking the pages</b><span class="fr-of">October, 38 photos</span></div>
      <div class="fr-body">
        <div class="fr-ph" style="aspect-ratio: ${PHOTO.w} / ${PHOTO.h}">
          <img src="${x.img('lead.jpg')}" width="${PHOTO.w}" height="${PHOTO.h}" alt=""/>
          <i class="fr-box" style="left: ${pct(x0 / PHOTO.w)}; top: ${pct(y0 / PHOTO.h)}; width: ${pct((x1 - x0) / PHOTO.w)}; height: ${pct((y1 - y0) / PHOTO.h)}"><span class="fr-lbl">${x.esc(label)}</span></i>
          <i class="fr-scan"></i>
        </div>
        <div class="fr-side">
          <small>${lc('image')}Your photos</small>
          <div class="fr-roll">${Array.from({ length: ROLL }, (_, i) => `<span class="fr-th${i === 0 ? ' fr-pk' : ''}"><img src="${x.img(`page-${i + 1}.jpg`)}" width="240" height="300" alt=""/></span>`).join('')}</div>
        </div>
      </div>
      <div class="fr-alt"><b>Alt text:</b> ${x.esc(ALT)}</div>
      <span class="fr-verdict">${lc('crop')}${x.esc(CHIP)}</span>
      <div class="fr-ft">${x.OK}<span>${x.esc(TALLY)}</span></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const box = $('.fr-box'), thumbs = [...card.querySelectorAll('.fr-th')];
    const scan = $('.fr-scan'), alt = $('.fr-alt'), chip = $('.fr-verdict'), ft = $('.fr-ft'), spin = $('.fr-spin'), ok = $('.fr-st .qc-ok');
    const ph = $('.fr-ph img');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1;
    const rise = (n, t, a, d, dy = 6) => {
      const v = outCubic(seg(t, a, a + d));
      n.style.opacity = v.toFixed(3);
      n.style.transform = v >= 1 ? 'none' : `translateY(${((1 - v) * dy).toFixed(2)}px)`;
    };

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card], [T.alt, alt], [T.tally, ft]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // her photos pop in; the pick ring lands on the lead page, the others step back, and the frame fills
        const pk = outCubic(seg(t, T.pick, T.pick + 0.2));
        thumbs.forEach((th, i) => {
          const q = outCubic(seg(t, T.roll[i], T.roll[i] + ROLL_IN));
          th.style.opacity = (q * (i === 0 ? 1 : lerp(1, 0.45, pk))).toFixed(3);
          th.style.transform = q >= 1 ? 'none' : `scale(${lerp(0.9, 1, q).toFixed(4)})`;
        });
        thumbs[0].classList.toggle('on', t >= T.pick);
        ph.style.opacity = pk.toFixed(3);

        // the scan line: linear top to bottom, fading in and out at the ends
        const p = seg(t, T.s0, T.s1);
        scan.style.top = pct(p);
        scan.style.opacity = (p > 0 && p < 1 ? Math.min(1, p * 8, (1 - p) * 8) : 0).toFixed(3);
        const q = outCubic(seg(t, T.box, T.box + BOX_IN));
        box.style.opacity = q.toFixed(3);
        box.style.transform = q >= 1 ? 'none' : `scale(${lerp(1.08, 1, q).toFixed(4)})`;
        // done looking: the spinner resolves to the check as the scan finishes
        const d = outCubic(seg(t, T.s1, T.s1 + 0.2));
        spin.style.opacity = (1 - seg(t, T.s1 - 0.08, T.s1 + 0.06)).toFixed(3);
        spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        ok.style.opacity = d.toFixed(3);
        ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;

        rise(alt, t, T.alt, ALT_IN);
        const v = outCubic(seg(t, T.chip, T.chip + CHIP_IN));
        chip.style.opacity = v.toFixed(3);
        chip.style.transform = v >= 1 ? 'none' : `translateY(${((1 - v) * 6).toFixed(2)}px) scale(${lerp(0.94, 1, v).toFixed(4)})`;
        rise(ft, t, T.tally, TALLY_IN);
      },
    };
  },
};
