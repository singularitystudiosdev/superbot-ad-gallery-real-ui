// Reframe beat: GPT-6 Astra cuts the three moments and reframes each to 9:16, tracking Theo, with word-by-word captions
// burned in. Its line streams and a card rises holding three vertical previews side by side. Each preview opens on the
// whole 16:9 frame of its moment, letterboxed (img/frame-<moment>.jpg), and pushes in to fill the 9:16 window while
// the window slides onto Theo (the crop the Shorts player shows later: img/short-<moment>.jpg is the same window). A
// tracking bracket lands on Theo, then the captions burn in, two words a line, the spoken word in yellow. Under each
// preview: the source time and the clip length. The spinner resolves to the check and the footer lands: "3 vertical
// clips, 1080 x 1920, captions burned in". In the zoom cut the camera pushes in on the card while it works (chat.js
// FOCUS). Pure function of t: every moving value is written from t.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';
import { ms } from './yt-icons.js?v=5c75e467';
import { MOMENTS } from './story.js?v=5c75e467';

const SAY = 'Cut all 3 to 9:16, kept Theo centered, and burned in the captions.';
const DONE = '3 vertical clips, 1080 x 1920, captions burned in';
// where the tracking bracket sits in each reframed 9:16 window (fractions of the window): on Theo's head and
// shoulders, measured on the rendered frames (the glacier bracket is held inside the right edge)
const TRACK = { flat: [0.64, 0.36], glacier: [0.74, 0.37], climb: [0.6, 0.29] };
const FILL = (16 / 9) / (9 / 16);      // the push from the letterboxed 16:9 to a full 9:16 window
// timing (seconds from the reply start, or from the card where noted)
const CPS = 100;
const SAY_AT = 0.048;
const CARD = 0.144;
const RISE = 0.36;
const RF_AT = 0.3;                     // the card landing to the first preview starting its reframe
const RF_STAGGER = 0.12;
const RF = 0.55; /* deliberate */      // one preview's push from 16:9 to 9:16
const TRACK_IN = 0.2;                  // the tracking bracket landing on Theo
const CAP_AT = 0.1;                    // the last reframe done to the captions burning in
const WORD = 0.15;                     // one spoken word to the next
const DONE_AT = 0.42;                  // the captions starting to the check
const FOOT_AT = 0.1;
const FOOT_IN = 0.24;
const FOCUS_AT = 0.26; /* deliberate */  // the card has appeared, then the camera starts in on it
const FOCUS_PUSH = 0.4; /* deliberate */
const HOLD = 0.34; /* deliberate */      // the footer reads, pushed in, before the pull-back
const FOCUS_PULL = 0.4; /* deliberate */

export default {
  times(r, opts = {}) {
    const T = { r };
    T.card = r + CARD;
    T.rf = MOMENTS.map((_, i) => T.card + RF_AT + i * RF_STAGGER);
    T.cap = T.rf[2] + RF + CAP_AT;
    T.done = T.cap + DONE_AT;
    T.foot = T.done + FOOT_AT;
    const pull = T.foot + FOOT_IN + HOLD;
    if (opts.zoom !== false) {
      const sw = T.card + FOCUS_AT;
      T.focus = { sw, landed: sw + FOCUS_PUSH, pull, back: pull + FOCUS_PULL };
    }
    T.end = Math.max(T.focus ? T.focus.back : pull, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    window.__AD_MARKS = Object.assign(window.__AD_MARKS || {}, { reframe: { card: T.card, rf: T.rf.slice(), cap: T.cap, done: T.done, foot: T.foot } });
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const tile = (m, i) => {
      const [bx, by] = TRACK[m.img];
      return `<div class="rf-col">
        <div class="rf-tile" data-i="${i}">
          <img class="rf-img" src="${x.img(`frame-${m.img}.jpg`)}" width="1280" height="720" alt="" style="transform-origin: ${(m.fx * 100).toFixed(2)}% 50%"/>
          <i class="rf-trk" style="left: ${(bx * 100).toFixed(2)}%; top: ${(by * 100).toFixed(2)}%"><b></b><b></b><b></b><b></b></i>
          <span class="rf-cap">${[0, 2, 4].map((p) => `<span class="rf-pg">${m.cap.slice(p, p + 2).map((w) => `<i>${x.esc(w)}</i>`).join(' ')}</span>`).join('')}</span>
          <i class="rf-ar">9:16</i>
        </div>
        <span class="rf-lb"><b>${m.at}</b> · ${m.len}</span>
      </div>`;
    };
    const card = x.el(`<div class="rf-card">
      <div class="rf-hd"><span class="rf-st"><i class="rf-spin"></i>${x.OK}</span><b>Reframing 3 clips to 9:16</b>
        <span class="rf-chips"><span class="rf-chip">${ms('center-focus-strong-outline')}Tracking Theo</span><span class="rf-chip">${ms('closed-caption-outline')}Captions</span></span></div>
      <div class="rf-row">${MOMENTS.map(tile).join('')}</div>
      <div class="rf-ft">${x.OK}<span>${x.esc(DONE)}</span></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const tiles = [...card.querySelectorAll('.rf-tile')].map((n, i) => ({
      n, img: n.querySelector('.rf-img'), trk: n.querySelector('.rf-trk'), ar: n.querySelector('.rf-ar'), cap: n.querySelector('.rf-cap'),
      pages: [...n.querySelectorAll('.rf-pg')], words: [...n.querySelectorAll('.rf-pg i')], m: MOMENTS[i], on: -2, pg: -1,
    }));
    const spin = $('.rf-spin'), ok = $('.rf-st .qc-ok'), ft = $('.rf-ft');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1;

    return {
      nodes: [say, card],
      focus: T.focus ? card : null,
      marks: [[T.r, say], [T.card, card], [T.foot, ft]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        tiles.forEach((o, i) => {
          // the push: from the letterboxed 16:9 (scale 1) to the full 9:16 window, the window sliding onto Theo
          const f = inOutCubic(seg(t, T.rf[i], T.rf[i] + RF));
          const w = o.n.offsetWidth;
          const dx = (0.5 - o.m.fx) * w * f;
          o.img.style.transform = `translateX(${dx.toFixed(2)}px) scale(${lerp(1, FILL, f).toFixed(4)})`;
          const tk = outCubic(seg(t, T.rf[i] + RF, T.rf[i] + RF + TRACK_IN));
          o.trk.style.opacity = tk.toFixed(3);
          o.trk.style.transform = `translate(-50%, -50%) scale(${lerp(1.35, 1, tk).toFixed(4)})`;
          o.ar.style.opacity = tk.toFixed(3);
          // the captions: two words a line, the spoken word yellow; each preview speaks at its own offset
          const c0 = T.cap + i * 0.05;
          const wi = t < c0 ? -1 : Math.floor((t - c0) / WORD) % o.m.cap.length;
          o.cap.style.opacity = seg(t, c0 - 0.06, c0 + 0.04).toFixed(3);
          if (wi !== o.on) {
            o.words.forEach((n, j) => n.classList.toggle('on', j === wi));
            const pg = wi < 0 ? 0 : Math.floor(wi / 2);
            o.pages.forEach((n, j) => { n.style.display = j === pg ? '' : 'none'; });
            o.on = wi;
          }
        });
        const d = outCubic(seg(t, T.done, T.done + 0.2));
        spin.style.opacity = (1 - seg(t, T.done - 0.08, T.done + 0.06)).toFixed(3);
        spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        ok.style.opacity = d.toFixed(3);
        ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;
        const f = outCubic(seg(t, T.foot, T.foot + FOOT_IN));
        ft.style.opacity = f.toFixed(3);
        ft.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 6).toFixed(2)}px)`;
      },
    };
  },
};
