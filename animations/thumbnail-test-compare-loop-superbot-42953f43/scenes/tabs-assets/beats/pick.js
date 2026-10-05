// Pick beat: Gemini watches "The $40 Webcam That Beat My $400 One" and pulls three frames to build thumbnails from.
// Its line streams and a card rises: the video row (the current thumbnail, img/thumbs/old.jpg, with the 9:47 chip, the
// title, 48,210 views and the 3.9% impressions click-through rate) and a playhead sweeping the whole video under
// "Watching the video". The bar carries the three picks as ticks (2:14, 5:02, 7:30); as the playhead passes each one
// its frame lands in the strip below with its timestamp and what it shows, then the footer: "3 frames picked for
// thumbnails". Frames are Nano Banana Pro renders of the made-up video (img/CREDITS.txt). Pure function of t.
import { lerp, seg, outCubic } from '../../../lib.js';
import { VIDEO } from './studio-data.js?v=42953f43';

const SAY = 'Watched all 9:47 and pulled 3 frames that sell the video.';
const LEN_S = 9 * 60 + 47;
// [seconds, chip, what it shows, image]
export const PICKS = [
  [134, '2:14', 'Sam holding both webcams', 'frames/f214.jpg'],
  [302, '5:02', 'Side-by-side image test', 'frames/f502.jpg'],
  [450, '7:30', 'Price tags close-up', 'frames/f730.jpg'],
];
const DONE = '3 frames picked for thumbnails';
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;
const PLAY_AT = 0.12;                  // the card landing to the playhead starting
const PLAY = 1.5; /* deliberate */     // the playhead sweeps the 9:47 video (linear, so a pick lands as it is passed)
const POP = 0.3;                       // a picked frame landing in the strip
const FOOT_AT = 0.12;
const FOOT_IN = 0.24;
const READ = 0.75; /* deliberate */    // the three frames hold, readable, before the next pill

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.p0 = T.card + PLAY_AT;
    T.p1 = T.p0 + PLAY;
    T.pick = PICKS.map(([s]) => T.p0 + PLAY * (s / LEN_S));
    T.foot = T.p1 + FOOT_AT;
    T.end = T.foot + FOOT_IN + READ;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="pk-card">
      <div class="pk-vid">
        <span class="pk-th"><img src="${x.img('thumbs/old.jpg')}" width="1280" height="720" alt=""/><i class="pk-len">${VIDEO.len}</i></span>
        <div class="pk-meta">
          <b class="pk-title">${x.esc(VIDEO.title)}</b>
          <span class="pk-stats">${VIDEO.views} views<i></i>Impressions CTR ${VIDEO.ctr0}</span>
          <span class="pk-hd"><span class="pk-st"><i class="pk-spin"></i>${x.OK}</span>Watching the video<span class="pk-tc">0:00 / ${VIDEO.len}</span></span>
          <i class="pk-bar"><i class="pk-fill"></i>${PICKS.map(([s]) => `<u style="left: ${((s / LEN_S) * 100).toFixed(3)}%"></u>`).join('')}<i class="pk-head"></i></i>
        </div>
      </div>
      <div class="pk-strip">${PICKS.map(([, chip, what, f]) => `<div class="pk-fr"><span class="pk-im"><img src="${x.img(f)}" width="960" height="540" alt=""/><i class="pk-ts">${chip}</i></span><span class="pk-cap">${x.esc(what)}</span></div>`).join('')}</div>
      <div class="pk-ft">${x.OK}<span>${x.esc(DONE)}</span></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const st = { spin: $('.pk-spin'), ok: $('.pk-st .qc-ok') };
    const fill = $('.pk-fill'), head = $('.pk-head'), tc = $('.pk-tc'), ticks = [...card.querySelectorAll('.pk-bar u')];
    const frs = [...card.querySelectorAll('.pk-fr')], ft = $('.pk-ft');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, clock = '';
    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card], [T.foot, ft]],
      render(t) {
        const ns = Math.max(0, Math.min(SAY.length, Math.floor((t - T.r - SAY_AT) * CPS)));
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;
        const p = seg(t, T.p0, T.p1);
        fill.style.transform = `scaleX(${p.toFixed(4)})`;
        head.style.left = `${(p * 100).toFixed(3)}%`;
        const s = Math.round(p * LEN_S);
        const c = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')} / ${VIDEO.len}`;
        if (c !== clock) { tc.textContent = c; clock = c; }
        const d = outCubic(seg(t, T.p1, T.p1 + 0.2));
        st.spin.style.opacity = (1 - seg(t, T.p1 - 0.08, T.p1 + 0.06)).toFixed(3);
        st.spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        st.ok.style.opacity = d.toFixed(3);
        st.ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;
        // each pick: its tick lights as the playhead passes, and its frame lands in the strip with a brief ring
        frs.forEach((fr, i) => {
          ticks[i].classList.toggle('on', t >= T.pick[i]);
          const o = outCubic(seg(t, T.pick[i], T.pick[i] + POP));
          fr.style.opacity = o.toFixed(3);
          fr.style.transform = o >= 1 ? 'none' : `translateY(${((1 - o) * 10).toFixed(2)}px) scale(${lerp(0.92, 1, o).toFixed(4)})`;
          const ring = Math.sin(Math.PI * seg(t, T.pick[i], T.pick[i] + 0.6));
          fr.style.setProperty('--ring', ring.toFixed(3));
        });
        const f = outCubic(seg(t, T.foot, T.foot + FOOT_IN));
        ft.style.opacity = f.toFixed(3);
        ft.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 6).toFixed(2)}px)`;
      },
    };
  },
};
