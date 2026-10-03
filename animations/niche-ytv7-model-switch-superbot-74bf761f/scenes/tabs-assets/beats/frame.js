// Frame beat: GPT-6 Astra reads the most re-watched frame of the last video, 4:38 (the retention spike Gemini found). Its
// line streams and a card rises holding the video's frame at 4:38 (img/mic-frame.jpg, ONE real Pexels photo, img/CREDITS.txt) with its timestamp chip. A scan line sweeps it top
// to bottom; as it passes each thing in the shot a highlight box lands on it and the thing joins the "In the frame"
// list beside it. Then the verdict tag lands and the tally footer: "Frame 4:38 read, open the next video on a visual
// like this".
// The boxes sit on what the photo really shows: BOXES below are measured on the crop itself (1280 x 720 px): the mount
// at the arm's end, the low-profile arm, the mic hanging under it. No desk clamp is in the shot, so the verdict says
// what is (the mic is mounted under the arm), not "clamps under the desk". Pure function of t: every moving value is
// written from t, so ?t= and __AD.seek freeze any frame.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';
import { SPIKE } from './data.js?v=74bf761f';

const SAY = `Read the most re-watched frame, ${SPIKE.time}.`;
const PHOTO = { w: 1280, h: 720 };
// [thing, x0, y0, x1, y1] in the crop's pixels, in the order the scan line reaches their middles
const BOXES = [
  ['Mount, mic hangs under it', 578, 18, 740, 182],
  ['Low-profile boom arm', 744, 40, 1276, 304],
  ['Microphone', 408, 176, 682, 668],
];
export const VERDICT = 'The boom arm shot, the strongest visual you have';
const TALLY = `Frame ${SPIKE.time} read, open the next video on a visual like this`;
const FROM = 'Retention spike';
// timing (seconds from the reply start, or from the card where noted), in the base's v3 pace
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const SCAN_AT = 0.24;                  // the card landing to the scan line starting
const SCAN = 0.56; /* deliberate */    // the scan line crossing the frame, top to bottom (trimmed from 0.7 in ytv3, kept)
const BOX_IN = 0.16;                   // a box (and its list item) popping in as the scan passes the thing's middle
const VERDICT_AT = 0.08;               // the scan done to the verdict tag
const VERDICT_IN = 0.24;               // the verdict landing
const TALLY_AT = 0.16;                 // the verdict to the tally footer
const TALLY_IN = 0.24;                 // the tally rising in

const pct = (v) => `${(v * 100).toFixed(3)}%`;
const TICK = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.s0 = T.card + SCAN_AT;
    T.s1 = T.s0 + SCAN;
    // the scan is linear in y, so each box lands the moment the line crosses its middle
    T.box = BOXES.map(([, , y0, , y1]) => T.s0 + SCAN * ((y0 + y1) / 2 / PHOTO.h));
    T.verdict = T.s1 + VERDICT_AT;
    T.tally = T.verdict + TALLY_AT;
    T.end = Math.max(T.tally + TALLY_IN, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="fr-card">
      <div class="fr-hd"><span class="fr-st"><i class="fr-spin"></i>${x.OK}</span><b>Reading the frame</b><span class="fr-of">${x.esc(FROM)}</span></div>
      <div class="fr-body">
        <div class="fr-ph" style="aspect-ratio: ${PHOTO.w} / ${PHOTO.h}">
          <img src="${x.img('mic-frame.jpg')}" width="${PHOTO.w}" height="${PHOTO.h}" alt=""/>
          ${BOXES.map(([, x0, y0, x1, y1]) => `<i class="fr-box" style="left: ${pct(x0 / PHOTO.w)}; top: ${pct(y0 / PHOTO.h)}; width: ${pct((x1 - x0) / PHOTO.w)}; height: ${pct((y1 - y0) / PHOTO.h)}"></i>`).join('')}
          <i class="fr-scan"></i>
          <i class="fr-ts">${x.esc(SPIKE.time)}</i>
        </div>
        <div class="fr-side">
          <small>In the frame</small>
          <ul>${BOXES.map(([d]) => `<li>${TICK}${x.esc(d)}</li>`).join('')}</ul>
        </div>
      </div>
      <span class="fr-verdict">${TICK}${x.esc(VERDICT)}</span>
      <div class="fr-ft">${x.OK}<span>${x.esc(TALLY)}</span></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const boxes = [...card.querySelectorAll('.fr-box')], items = [...card.querySelectorAll('.fr-side li')];
    const scan = $('.fr-scan'), verdict = $('.fr-verdict'), ft = $('.fr-ft'), spin = $('.fr-spin'), ok = $('.fr-st .qc-ok');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1;

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card], [T.tally, ft]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // the scan line: linear top to bottom, fading in and out at the ends
        const p = seg(t, T.s0, T.s1);
        scan.style.top = pct(p);
        scan.style.opacity = (p > 0 && p < 1 ? Math.min(1, p * 8, (1 - p) * 8) : 0).toFixed(3);
        boxes.forEach((b, i) => {
          const q = outCubic(seg(t, T.box[i], T.box[i] + BOX_IN));
          b.style.opacity = q.toFixed(3);
          b.style.transform = q >= 1 ? 'none' : `scale(${lerp(1.08, 1, q).toFixed(4)})`;
          const li = items[i];
          li.style.opacity = q.toFixed(3);
          li.style.transform = q >= 1 ? 'none' : `translateX(${((1 - q) * -6).toFixed(2)}px)`;
        });
        // done reading: the spinner resolves to the check as the scan finishes
        const d = outCubic(seg(t, T.s1, T.s1 + 0.2));
        spin.style.opacity = (1 - seg(t, T.s1 - 0.08, T.s1 + 0.06)).toFixed(3);
        spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        ok.style.opacity = d.toFixed(3);
        ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;

        const v = outCubic(seg(t, T.verdict, T.verdict + VERDICT_IN));
        verdict.style.opacity = v.toFixed(3);
        verdict.style.transform = v >= 1 ? 'none' : `translateY(${((1 - v) * 6).toFixed(2)}px) scale(${lerp(0.94, 1, v).toFixed(4)})`;
        const f = outCubic(seg(t, T.tally, T.tally + TALLY_IN));
        ft.style.opacity = f.toFixed(3);
        ft.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 6).toFixed(2)}px)`;
      },
    };
  },
};
