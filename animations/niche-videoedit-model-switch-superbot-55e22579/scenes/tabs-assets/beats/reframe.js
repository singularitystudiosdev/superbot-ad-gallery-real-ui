// Reframe beat (the cover beat's card grammar, re-skinned): SAM 3 (Meta's Segment Anything Model 3, video tracking)
// tracks the streamer and reframes every clip from 16:9 to 9:16. Its line streams and a card rises holding a 16:9 frame
// of the stream under a "Tracking streamer" chip: SAM's box lands on the streamer with its label and score, then the
// 9:16 crop window (everything outside it dimmed) slides from the centre of the frame onto the streamer and locks.
// Beside it the three steps tick off in turn and the 5 reframed vertical clips land in a row, one by one.
// Every pixel of every picture is a real photo (img/vod.jpg, img/clip-1..5.jpg, img/CREDITS.txt): nothing is drawn;
// the box, the crop window and the dim are UI laid over it.
// Pure function of t: every moving value is written from t, so ?t= and __AD.seek freeze any frame.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';

const SAY = 'Tracked the streamer in all 5 clips and reframed them from 16:9 to 9:16.';
const STEPS = ['Tracked streamer, 5 clips', 'Reframed 16:9 to 9:16', '1080x1920, 60 fps'];
// the streamer in img/vod.jpg (percent of the 16:9 frame) and the 9:16 window (31.64% of the frame's width)
const BOX = { l: 49, t: 15, w: 26, h: 58 };
const CROP_W = (9 / 16) / (16 / 9) * 100;
const CROP_FROM = 50 - CROP_W / 2, CROP_TO = 62 - CROP_W / 2;
// timing (seconds from the reply start, or from the card where noted), in the source's v3 pace
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const BOX_AT = 0.2, BOX_IN = 0.22;     // the card landing to SAM's box landing on the streamer
const CROP_AT = 0.36, CROP = 0.5;      // the card landing to the 9:16 window sliding onto the streamer
const DIM_IN = 0.2;                    // the outside of the window dimming
const THUMB_AT = 0.06, THUMB_STAGGER = 0.08, THUMB_IN = 0.24; // the window locked to the vertical clips landing
const POP = 0.16;                      // a step's check popping in

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const OKI = '<svg class="rf-ck" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.box = T.card + BOX_AT;                         // SAM's box lands
    T.c0 = T.card + CROP_AT; T.c1 = T.c0 + CROP;     // the window slides and locks
    T.ok = [T.box + BOX_IN, T.c1, T.c1 + 0.14];      // the three steps tick
    T.th = [0, 1, 2, 3, 4].map((i) => T.c1 + THUMB_AT + i * THUMB_STAGGER);
    // the beat's last visible change: the last clip landed, or the line's last character
    T.end = Math.max(T.th[4] + THUMB_IN, T.ok[2] + POP, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="rf-card">
      <div class="rf-stage">
        <img class="rf-ph" src="${x.img('vod.jpg')}" width="1280" height="720" alt=""/>
        <i class="rf-crop" style="width:${CROP_W.toFixed(3)}%"></i>
        <span class="rf-box" style="left:${BOX.l}%;top:${BOX.t}%;width:${BOX.w}%;height:${BOX.h}%"><b>streamer 0.97</b></span>
        <span class="rf-genl">${x.tile('sam')}Tracking streamer</span>
        <span class="rf-ar"><b>16:9</b><i>to</i><b>9:16</b></span>
      </div>
      <div class="rf-side">
        <div class="rf-steps">${STEPS.map((s) => `<div class="rf-step"><span class="rf-ok"><i class="rf-spin"></i>${OKI}</span><span>${esc(s)}</span></div>`).join('')}</div>
        <div class="rf-thumbs">${[1, 2, 3, 4, 5].map((i) => `<img class="rf-th" src="${x.img(`clip-${i}.jpg`)}" width="72" height="128" alt=""/>`).join('')}</div>
      </div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const crop = $('.rf-crop'), box = $('.rf-box'), genl = $('.rf-genl'), ar = $('.rf-ar');
    const checks = [...card.querySelectorAll('.rf-ok')].map((n) => ({ spin: n.querySelector('.rf-spin'), ck: n.querySelector('.rf-ck') }));
    const steps = [...card.querySelectorAll('.rf-step')];
    const thumbs = [...card.querySelectorAll('.rf-th')];
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1;

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // SAM's box lands on the streamer (scales in from a touch larger), the chip reads while it tracks
        const b = outCubic(seg(t, T.box, T.box + BOX_IN));
        box.style.opacity = b.toFixed(3);
        box.style.transform = b >= 1 ? 'none' : `scale(${lerp(1.12, 1, b).toFixed(4)})`;
        genl.style.opacity = (seg(t, T.card + 0.1, T.card + 0.3) * (1 - seg(t, T.c1, T.c1 + 0.2))).toFixed(3);

        // the 9:16 window: the outside dims, it slides from the centre onto the streamer and locks
        const c = inOutCubic(seg(t, T.c0, T.c1));
        crop.style.left = `${lerp(CROP_FROM, CROP_TO, c).toFixed(3)}%`;
        crop.style.opacity = outCubic(seg(t, T.c0 - DIM_IN, T.c0)).toFixed(3);
        crop.classList.toggle('on', t >= T.c1);
        ar.style.opacity = outCubic(seg(t, T.c1, T.c1 + 0.2)).toFixed(3);

        checks.forEach((ck, i) => {
          const o = outCubic(seg(t, T.ok[i], T.ok[i] + POP));
          ck.spin.style.opacity = (1 - seg(t, T.ok[i] - 0.06, T.ok[i] + 0.04)).toFixed(3);
          ck.spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
          ck.ck.style.opacity = o.toFixed(3);
          ck.ck.style.transform = `scale(${lerp(0.4, 1, o).toFixed(4)})`;
          steps[i].classList.toggle('on', t >= T.ok[i]);
        });
        thumbs.forEach((th, i) => {
          const q = outCubic(seg(t, T.th[i], T.th[i] + THUMB_IN));
          th.style.opacity = q.toFixed(3);
          th.style.transform = q >= 1 ? 'none' : `translateY(${((1 - q) * 10).toFixed(2)}px) scale(${lerp(0.9, 1, q).toFixed(4)})`;
        });
      },
    };
  },
};
