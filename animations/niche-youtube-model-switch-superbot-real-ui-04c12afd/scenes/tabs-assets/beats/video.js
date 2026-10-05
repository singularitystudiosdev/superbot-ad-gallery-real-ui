// Video beat: Gemini 3.7 Flash answers the two questions only the video can answer. Agentic video understanding
// (Google, 2026-09-01: the model navigates a video's timeline to the moments a question needs instead of sampling it
// end to end) is the reason this part is Gemini's, so the card shows exactly that: the playhead on the 14:32 timeline
// JUMPS (a flash on the stop it lands on), first to 7:05 (the room test Priya's question needs: the room shot, with
// the line Sam says there as a caption) and then back to 4:38 (the boom arm Lena asked about: highlight boxes land on
// what the photo really shows). Each stop drops one timestamped answer into the list beside the frame, tagged with who
// it is for, and the footer says both answers are ready. The frames are two real photos of the same mic by the same
// photographer (img/room-frame.jpg at 7:05, img/mic-frame.jpg at 4:38; Pexels, img/CREDITS.txt). BOXES are measured on
// mic-frame.jpg (1280 x 720 px). Pure function of t: every moving value is
// written from t, so ?t= and __AD.seek freeze any frame.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';

const SAY = 'Jumping straight to the two moments in the video that answer them.';
const PHOTO = { w: 1280, h: 720 };
const LEN_S = 14 * 60 + 32;
// the two stops, in the order Gemini visits them (rank order of the questions)
const STOPS = [
  { at: 7 * 60 + 5, ts: '7:05', who: '@priyanair', ans: 'Room test: the $49 dynamic picks up the least room echo' },
  { at: 4 * 60 + 38, ts: '4:38', who: '@lenafischer', ans: 'Low-profile boom arm, mic mounted underneath' },
];
// what Sam says over the 7:05 room test (the caption on the close crop)
const CAPTION = '“The $49 dynamic barely hears this room.”';
// [thing, x0, y0, x1, y1, label corner] in the photo's pixels: the mount at the arm's end, the low-profile arm, the mic
// under it. Labels sit on different corners so no two touch.
const BOXES = [
  ['Mount', 578, 18, 740, 182, 'bl'],
  ['Boom arm', 744, 40, 1276, 304, 'br'],
  ['Mic', 408, 176, 682, 668, 'tl'],
];
const DONE = '2 answers found in the video, with timestamps';
// timing (seconds from the reply start, or from the card where noted), in the base's v3 pace
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const JUMP_AT = 0.06;                  // the card most of the way up to the first jump
const JUMP = 0.22;                     // the playhead travelling to a stop (inOutCubic)
const LOOK = 0.42; /* deliberate */    // parked on a stop: the frame reads, its answer lands at the end
const ANS_IN = 0.22;                   // an answer row popping in
const BOX_STAGGER = 0.1;               // one box to the next at 4:38
const BOX_IN = 0.16;                   // a box popping in
const FOOT_AT = 0.06;                  // the last answer to the footer
const FOOT_IN = 0.22;                  // the footer rising in
const HOLD = 0.12;                     // the footer settled to the next pill's GAP
const pct = (v) => `${(v * 100).toFixed(3)}%`;
const clock = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.j = [];
    T.a = [];
    let c = T.card + RISE * 0.6 + JUMP_AT;
    STOPS.forEach(() => {
      T.j.push(c);                        // the jump starts
      T.a.push(c + JUMP + LOOK - ANS_IN); // its answer lands as the look ends
      c += JUMP + LOOK;
    });
    T.box = BOXES.map((_, i) => T.j[1] + JUMP + 0.08 + i * BOX_STAGGER);
    T.done = T.a[STOPS.length - 1] + ANS_IN;
    T.foot = T.done + FOOT_AT;
    T.end = Math.max(T.foot + FOOT_IN + HOLD, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const src = x.img('mic-frame.jpg');
    const card = x.el(`<div class="vd-card">
      <div class="vd-hd"><span class="vd-st"><i class="vd-spin"></i>${x.OK}</span><b>Watching the video</b><span class="vd-of">2 questions</span></div>
      <div class="vd-body">
        <div class="vd-ph">
          <img class="vd-a" src="${x.img('room-frame.jpg')}" width="${PHOTO.w}" height="${PHOTO.h}" alt=""/>
          <img class="vd-b" src="${src}" width="${PHOTO.w}" height="${PHOTO.h}" alt=""/>
          ${BOXES.map(([name, x0, y0, x1, y1, at]) => `<i class="vd-box" style="left: ${pct(x0 / PHOTO.w)}; top: ${pct(y0 / PHOTO.h)}; width: ${pct((x1 - x0) / PHOTO.w)}; height: ${pct((y1 - y0) / PHOTO.h)}"><b class="vd-c${at}">${x.esc(name)}</b></i>`).join('')}
          <span class="vd-cap">${x.esc(CAPTION)}</span>
          <i class="vd-ts">0:00</i>
        </div>
        <div class="vd-side"><small>Answers</small><ul>${STOPS.map((s) => `<li><span class="vd-l1"><i class="vd-chip">${s.ts}</i>for ${x.esc(s.who)}</span><span class="vd-ans">${x.esc(s.ans)}</span></li>`).join('')}</ul></div>
      </div>
      <div class="vd-tl"><i class="vd-rail"></i>${STOPS.map((s) => `<u style="left: ${pct(s.at / LEN_S)}"></u><i class="vd-fl" style="left: ${pct(s.at / LEN_S)}"></i>`).join('')}<i class="vd-head"></i><span class="vd-len">14:32</span></div>
      <div class="vd-ft">${x.OK}<span>${x.esc(DONE)}</span></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const st = { spin: $('.vd-st .vd-spin'), ok: $('.vd-st .qc-ok') };
    const imgA = $('.vd-a'), imgB = $('.vd-b'), cap = $('.vd-cap'), ts = $('.vd-ts'), head = $('.vd-head'), ft = $('.vd-ft');
    const boxes = [...card.querySelectorAll('.vd-box')];
    const marks = [...card.querySelectorAll('.vd-tl u')];
    const flashes = [...card.querySelectorAll('.vd-fl')];
    const answers = [...card.querySelectorAll('.vd-side li')];
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, tsText = '';
    // where the playhead is (seconds into the video): 0, a glide to 7:05, a glide back to 4:38
    const at = (t) => {
      let p = 0;
      STOPS.forEach((s, i) => { p = lerp(p, s.at, inOutCubic(seg(t, T.j[i], T.j[i] + JUMP))); });
      return p;
    };
    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card], [T.foot, ft]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;
        const p = at(t);
        head.style.left = pct(p / LEN_S);
        const c = clock(p);
        if (c !== tsText) { ts.textContent = c; tsText = c; }
        // each stop lights as the playhead lands on it, with one flash (a ring that grows and fades) so the jump reads
        marks.forEach((u, i) => {
          const land = T.j[i] + JUMP;
          u.classList.toggle('on', t >= land);
          const fl = seg(t, land, land + 0.32);
          flashes[i].style.opacity = fl > 0 && fl < 1 ? (1 - fl).toFixed(3) : '0';
          flashes[i].style.transform = `scale(${lerp(1, 3.2, outCubic(fl)).toFixed(3)})`;
        });
        // the frame: the close crop is on screen for 7:05, the full shot for 4:38 (each cuts in as its jump lands)
        const a = seg(t, T.j[0] + JUMP - 0.1, T.j[0] + JUMP) * (1 - seg(t, T.j[1] + JUMP - 0.1, T.j[1] + JUMP));
        imgA.style.opacity = a.toFixed(3);
        imgB.style.opacity = (1 - a).toFixed(3);
        const cf = outCubic(seg(t, T.j[0] + JUMP + 0.08, T.j[0] + JUMP + 0.26)) * (1 - seg(t, T.j[1], T.j[1] + 0.12));
        cap.style.opacity = cf.toFixed(3);
        cap.style.transform = cf >= 1 ? 'none' : `translateY(${((1 - cf) * 4).toFixed(2)}px)`;
        boxes.forEach((b, i) => {
          const o = outCubic(seg(t, T.box[i], T.box[i] + BOX_IN));
          b.style.opacity = o.toFixed(3);
          b.style.transform = o >= 1 ? 'none' : `scale(${lerp(1.08, 1, o).toFixed(4)})`;
        });
        answers.forEach((li, i) => {
          const o = outCubic(seg(t, T.a[i], T.a[i] + ANS_IN));
          li.style.opacity = o.toFixed(3);
          li.style.transform = o >= 1 ? 'none' : `translateX(${((1 - o) * 8).toFixed(2)}px)`;
        });
        const d = outCubic(seg(t, T.done, T.done + 0.2));
        st.spin.style.opacity = (1 - seg(t, T.done - 0.08, T.done + 0.06)).toFixed(3);
        st.spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        st.ok.style.opacity = d.toFixed(3);
        st.ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;
        const f = outCubic(seg(t, T.foot, T.foot + FOOT_IN));
        ft.style.opacity = f.toFixed(3);
        ft.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 6).toFixed(2)}px)`;
      },
    };
  },
};
