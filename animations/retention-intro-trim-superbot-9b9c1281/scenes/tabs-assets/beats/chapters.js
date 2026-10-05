// Chapters beat: Claude Opus 5.5 moves every chapter in the description back by the cut, so each one still starts on
// its scene once 0:06 to 0:31 is gone. Its line streams and a dark diff card rises: the header ("Description ·
// chapters", the video, the -0:25 shift), "0:00 Intro stays", then the nine chapter lines one by one, each old
// timestamp struck through in red and the new one landing beside it in green (2:10 Flattening becomes 1:45, 6:42
// Dovetails becomes 6:17, ... 20:48 The finished desk becomes 20:23), and the footer with the new length (22:18 to
// 21:53). The camera pushes in on the card while it plays. Every value comes from walnut.js. Pure function of t.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';
import { VIDEO, CHAPTERS, INTRO, SHIFT, AFTER_LEN, ts } from './walnut.js?v=9b9c1281';

const SAY = `Moving all ${CHAPTERS.length} chapters back ${SHIFT} seconds.`;
// timing (seconds from the reply start, or from the card where noted)
const CPS = 150;
const SAY_AT = 0.03;
const CARD = 0.06;
const RISE = 0.22;
const ROW0 = 0.1;                       // the card landing to the first line
const STEP = 0.075;                     // one line to the next
const ROW_IN = 0.12;                    // a line fading in (old time showing)
const STRIKE = [0.08, 0.2];             // the line's start to its strike drawing through the old time
const NEW = [0.12, 0.28];               // ...and to the new time landing
const FOOT_AT = 0.08;                   // the last line landing to the check and the footer
const FOOT_IN = 0.16;
const HOLD = 0.52; /* deliberate */     // the finished diff holds, readable, before the camera pulls back

export default {
  times(r, opts) {
    const T = { r };
    T.card = r + CARD;
    T.row = CHAPTERS.map((_, i) => T.card + ROW0 + i * STEP);
    T.done = T.row[T.row.length - 1] + NEW[1] + FOOT_AT;
    T.settled = Math.max(T.done + FOOT_IN, r + SAY_AT + SAY.length / CPS);
    T.end = T.settled + HOLD;
    if (opts && opts.zoom) T.focus = { sw: T.card, landed: T.card + 0.3, pull: T.end - 0.04, back: T.end + 0.24 };
    window.__AD_MARKS = Object.assign(window.__AD_MARKS || {}, { chapters: { card: T.card, rows: T.row.map((v) => v + NEW[0]), done: T.done } });
    return T;
  },
  build(k, x) {
    const T = k.T;
    const esc = x.esc;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${esc(SAY)}</span></div>`);
    const card = x.el(`<div class="cd-card">
      <div class="cd-hd"><span class="cd-st"><i class="cd-spin"></i>${x.OK}</span><b>Description · chapters</b><span class="cd-vid">${esc(VIDEO.title)}</span><span class="cd-shift">−0:${String(SHIFT).padStart(2, '0')}</span></div>
      <div class="cd-keep"><span class="cd-t">0:00</span><span class="cd-nm">${esc(INTRO)}</span><span class="cd-note">stays</span></div>
      <div class="cd-list">${CHAPTERS.map((ch) => `<div class="cd-row"><span class="cd-old"><span>${ch.old}</span><i class="cd-strike"></i></span><span class="cd-arr">→</span><span class="cd-new">${ch.now}</span><span class="cd-nm">${esc(ch.name)}</span></div>`).join('')}</div>
      <div class="cd-ft">${x.OK}<span>${CHAPTERS.length} chapters moved · new length ${ts(AFTER_LEN)}</span><span class="cd-was">was ${ts(VIDEO.len)}</span></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const st = { spin: $('.cd-spin'), ok: $('.cd-st .qc-ok') };
    const keep = $('.cd-keep');
    const rows = [...card.querySelectorAll('.cd-row')].map((n) => ({ n, strike: n.querySelector('.cd-strike'), old: n.querySelector('.cd-old'), now: n.querySelector('.cd-new') }));
    const ft = $('.cd-ft');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1;

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card]],
      focus: card,
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;
        keep.style.opacity = outCubic(seg(t, T.card + 0.04, T.card + 0.04 + ROW_IN)).toFixed(3);

        rows.forEach((r, i) => {
          const a = T.row[i];
          const f = outCubic(seg(t, a, a + ROW_IN));
          r.n.style.opacity = f.toFixed(3);
          r.n.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 5).toFixed(2)}px)`;
          const s = outCubic(seg(t, a + STRIKE[0], a + STRIKE[1]));
          r.strike.style.transform = `scaleX(${s.toFixed(4)})`;
          r.old.classList.toggle('cd-gone', s > 0.5);
          const nw = outCubic(seg(t, a + NEW[0], a + NEW[1]));
          r.now.style.opacity = nw.toFixed(3);
          r.now.style.transform = nw >= 1 ? 'none' : `translateX(${((1 - nw) * -10).toFixed(2)}px)`;
          // the line washes green as its new time lands, then settles to a faint tint
          const glow = seg(t, a + NEW[0], a + NEW[1]) * (1 - 0.6 * seg(t, a + NEW[1], a + NEW[1] + 0.4));
          r.n.style.setProperty('--cd-w', glow.toFixed(3));
        });

        const d = outCubic(seg(t, T.done, T.done + 0.2));
        st.spin.style.opacity = (1 - seg(t, T.done - 0.08, T.done + 0.06)).toFixed(3);
        st.spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        st.ok.style.opacity = d.toFixed(3);
        st.ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;
        const f = outCubic(seg(t, T.done, T.done + FOOT_IN));
        ft.style.opacity = f.toFixed(3);
        ft.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 6).toFixed(2)}px)`;
      },
    };
  },
};
