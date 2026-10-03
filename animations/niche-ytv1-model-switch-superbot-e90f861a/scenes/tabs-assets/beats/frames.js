// Frames beat: GPT-6 Astra checks the video frames the comments point to, so every reply matches the video. Its line
// streams and a card rises: a compact video strip for "I tested 12 budget mics under $100" (a row of frame thumbnails
// cropped from the three sourced photos, img/CREDITS.txt, and a thin time ruler 0:00 to 14:32 with three markers at
// 4:38, 6:12 and 7:05). A scan cursor runs along the ruler; at each marker that frame lifts into the larger view (its
// timestamp chip, highlight boxes on what the photo really shows, the verdict, who it is for, the story line), then
// settles back as a checked frame in the row under it and the marker turns into a check. Order 4:38 (for Lena), 6:12
// (for Marco), 7:05 (for Priya). Then the tally: "3 frames checked, every answer matches the video".
// The boxes are measured on the crops themselves (1280 x 720 px each): mic-frame.jpg is the base's boom-arm photo,
// frame-612.jpg a small USB mic (Audio-Technica, USB glyph on the body) clipped to its mini tripod desk stand,
// frame-705.jpg three broadcast dynamic mics side by side on boom arms and stands in one room. Every verdict is true
// of its photo. Pure function of t: every moving value is written from t, so ?t= and __AD.seek freeze any frame.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';

const SAY = 'Checked the 3 moments in the video the comments point to.';
const PHOTO = { w: 1280, h: 720 };
const LEN_S = 14 * 60 + 32;
// the three frames: [timecode, seconds, image, who it is for, verdict, story line, boxes [x0, y0, x1, y1] in crop px]
export const FRAMES = [
  ['4:38', 278, 'mic-frame.jpg', 'Lena', 'Low-profile boom arm, mic mounted underneath', '',
    [[744, 40, 1276, 304], [408, 176, 682, 668], [578, 18, 740, 182]]],
  ['6:12', 372, 'frame-612.jpg', 'Marco', 'Small USB mic on a desk stand', 'the $29 pick',
    [[52, 88, 726, 628], [664, 210, 1248, 470]]],
  ['7:05', 425, 'frame-705.jpg', 'Priya', 'Three mics side by side, same room', 'the $49 dynamic',
    [[124, 432, 656, 594], [458, 250, 770, 388], [916, 292, 1236, 572]]],
];
// the filmstrip: crops of the same three photos (img/CREDITS.txt), standing in for the video's frames
const STRIP = ['strip-4.jpg', 'strip-1.jpg', 'mic-frame.jpg', 'frame-612.jpg', 'frame-705.jpg', 'strip-2.jpg', 'strip-3.jpg'];
const TALLY = '3 frames checked, every answer matches the video';
// timing (seconds from the reply start, or from the card where noted)
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const SCAN_AT = 0.1;                   // the card landing to the cursor starting along the ruler
const RUN0 = 0.22;                     // the cursor's run from 0:00 to the first marker
const PER = 0.6; /* deliberate */      // one frame: lifted, boxed, verdict read, then it settles (brief 0.6 to 0.8 s)
const RUN = 0.12;                      // the cursor's hop from one marker to the next
const LIFT = 0.18;                     // a frame lifting into the view
const BOX_AT = 0.1, BOX_STAGGER = 0.06, BOX_IN = 0.14;
const VERDICT_AT = 0.24, VERDICT_IN = 0.18;
const SETTLE = 0.16;                   // the frame settling back as a checked frame (its chip pops in the row)
const TALLY_AT = 0.12;                 // the last frame settled to the tally footer
const TALLY_IN = 0.24;
const READ = 0.15; /* deliberate */    // the tally holds before the next pill

const pct = (v) => `${(v * 100).toFixed(3)}%`;
const TICK = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.c0 = T.card + RISE / 2 + SCAN_AT;             // the cursor leaves 0:00
    T.at = [];                                       // the cursor reaches marker i, frame i lifts
    T.set = [];                                      // frame i settles back, checked
    let a = T.c0 + RUN0;
    FRAMES.forEach(() => { T.at.push(a); T.set.push(a + PER); a = a + PER + RUN; });
    T.tally = T.set[FRAMES.length - 1] + SETTLE + TALLY_AT;
    T.end = Math.max(T.tally + TALLY_IN + READ, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="fr-card">
      <div class="fr-hd"><span class="fr-st"><i class="fr-spin"></i>${x.OK}</span><b>Checking the video frames</b><span class="fr-of">3 moments from the comments</span></div>
      <div class="fr-vid">
        <div class="fr-strip">${STRIP.map((f) => `<span><img src="${x.img(f)}" alt=""/></span>`).join('')}</div>
        <div class="fr-ruler"><i class="fr-track"></i><i class="fr-fill"></i>
          ${FRAMES.map(([, s]) => `<i class="fr-mk" style="left: ${pct(s / LEN_S)}"><i class="fr-dot"></i>${TICK}</i>`).join('')}
          <i class="fr-cur"></i></div>
        <div class="fr-ends"><span>0:00</span><span class="fr-ttl">I tested 12 budget mics under $100</span><span>14:32</span></div>
      </div>
      <div class="fr-view">${FRAMES.map(([tc, s, im, who, verdict, story, boxes]) => `<div class="fr-pane" style="transform-origin: ${pct(s / LEN_S)} 0">
        <div class="fr-ph" style="aspect-ratio: ${PHOTO.w} / ${PHOTO.h}">
          <img src="${x.img(im)}" width="${PHOTO.w}" height="${PHOTO.h}" alt=""/>
          ${boxes.map(([x0, y0, x1, y1]) => `<i class="fr-box" style="left: ${pct(x0 / PHOTO.w)}; top: ${pct(y0 / PHOTO.h)}; width: ${pct((x1 - x0) / PHOTO.w)}; height: ${pct((y1 - y0) / PHOTO.h)}"></i>`).join('')}
          <i class="fr-ts">${tc}</i>
        </div>
        <div class="fr-side">
          <small>${tc} &middot; for ${who}</small>
          <span class="fr-verdict">${TICK}<span>${x.esc(verdict)}</span></span>
          ${story ? `<span class="fr-story">${x.esc(story)}</span>` : ''}
        </div>
      </div>`).join('')}</div>
      <div class="fr-done">${FRAMES.map(([tc, , im, who]) => `<span class="fr-chk"><img src="${x.img(im)}" alt=""/><b>${tc}</b><span>for ${who}</span>${TICK}</span>`).join('')}</div>
      <div class="fr-ft">${x.OK}<span>${x.esc(TALLY)}</span></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const all = (s) => [...card.querySelectorAll(s)];
    const panes = all('.fr-pane').map((p) => ({ p, boxes: [...p.querySelectorAll('.fr-box')], verdict: p.querySelector('.fr-verdict'), story: p.querySelector('.fr-story'), side: p.querySelector('.fr-side small') }));
    const marks = all('.fr-mk').map((m) => ({ dot: m.querySelector('.fr-dot'), ck: m.querySelector('svg') }));
    const chks = all('.fr-chk');
    const cur = $('.fr-cur'), fill = $('.fr-fill'), ft = $('.fr-ft'), spin = $('.fr-spin'), ok = $('.fr-st .qc-ok');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const pos = FRAMES.map(([, s]) => s / LEN_S);
    let shown = -1;

    // where the cursor sits on the ruler at t (0..1 of the video)
    const cursor = (t) => {
      if (t < T.c0) return 0;
      if (t < T.at[0]) return lerp(0, pos[0], inOutCubic(seg(t, T.c0, T.at[0])));
      for (let i = 0; i < FRAMES.length - 1; i++) {
        if (t < T.set[i]) return pos[i];                     // parked on marker i while its frame plays
        if (t < T.at[i + 1]) return lerp(pos[i], pos[i + 1], inOutCubic(seg(t, T.set[i], T.at[i + 1])));
      }
      return pos[FRAMES.length - 1];
    };

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card], [T.tally, ft]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // the scan cursor along the ruler (it fades out once the last frame has settled)
        const c = cursor(t);
        cur.style.left = pct(c);
        cur.style.opacity = (seg(t, T.c0 - 0.1, T.c0) * (1 - seg(t, T.set[2], T.set[2] + SETTLE))).toFixed(3);
        fill.style.transform = `scaleX(${c.toFixed(4)})`;

        panes.forEach((o, i) => {
          // lift in at its marker; the next frame's lift replaces it (the last one stays in the view)
          const up = outCubic(seg(t, T.at[i], T.at[i] + LIFT));
          const out = i < FRAMES.length - 1 ? inOutCubic(seg(t, T.at[i + 1] - 0.04, T.at[i + 1] + 0.1)) : 0;
          const settle = inOutCubic(seg(t, T.set[i], T.set[i] + SETTLE));
          o.p.style.opacity = (up * (1 - out)).toFixed(3);
          o.p.style.visibility = up * (1 - out) <= 0 ? 'hidden' : 'visible';
          const sc = lerp(0.82, 1, up) * lerp(1, 0.97, settle);
          o.p.style.transform = sc === 1 ? 'none' : `scale(${sc.toFixed(4)})`;
          o.boxes.forEach((b, j) => {
            const q = outCubic(seg(t, T.at[i] + BOX_AT + j * BOX_STAGGER, T.at[i] + BOX_AT + j * BOX_STAGGER + BOX_IN));
            b.style.opacity = q.toFixed(3);
            b.style.transform = q >= 1 ? 'none' : `scale(${lerp(1.08, 1, q).toFixed(4)})`;
          });
          const v = outCubic(seg(t, T.at[i] + VERDICT_AT, T.at[i] + VERDICT_AT + VERDICT_IN));
          o.verdict.style.opacity = v.toFixed(3);
          o.verdict.style.transform = v >= 1 ? 'none' : `translateY(${((1 - v) * 6).toFixed(2)}px)`;
          if (o.story) {
            const w = outCubic(seg(t, T.at[i] + VERDICT_AT + 0.08, T.at[i] + VERDICT_AT + 0.08 + VERDICT_IN));
            o.story.style.opacity = w.toFixed(3);
          }
          // settled: its marker turns into a check and its chip pops in the checked row
          const m = marks[i];
          const d = outCubic(seg(t, T.set[i], T.set[i] + SETTLE));
          m.dot.style.opacity = (1 - d).toFixed(3);
          m.ck.style.opacity = d.toFixed(3);
          m.ck.style.transform = `translate(-50%, -50%) scale(${lerp(0.4, 1, d).toFixed(4)})`;
          chks[i].style.opacity = lerp(0.28, 1, d).toFixed(3);
          chks[i].classList.toggle('on', d > 0);
          chks[i].style.transform = d > 0 && d < 1 ? `scale(${(1 + 0.08 * Math.sin(Math.PI * d)).toFixed(4)})` : 'none';
        });

        // done checking: the header's spinner resolves to the check as the last frame settles
        const s1 = T.set[FRAMES.length - 1];
        const dn = outCubic(seg(t, s1, s1 + 0.2));
        spin.style.opacity = (1 - seg(t, s1 - 0.08, s1 + 0.06)).toFixed(3);
        spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        ok.style.opacity = dn.toFixed(3);
        ok.style.transform = `scale(${lerp(0.4, 1, dn).toFixed(4)})`;
        const f = outCubic(seg(t, T.tally, T.tally + TALLY_IN));
        ft.style.opacity = f.toFixed(3);
        ft.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 6).toFixed(2)}px)`;
      },
    };
  },
};
