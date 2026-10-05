// Split beat: DeepSeek V4 Flash reads every comment on Sam's newest upload and sorts it into real and spam. Its line
// streams and a dark card rises in the base's research grammar: the header ("Sorting 3,912 comments", the video title,
// spinner resolving to the check, the elapsed seconds), the read counter racing to 3,912, then two bars that fill as
// the comments are read: Real (green, 3,781) and Spam (red, 131), each with two sample lines from the thread, the
// favorite it flags for the pin (@ruthiecasts, 1.8K likes) and the footer "3,781 to heart, 131 to hide, 1 to pin".
// The camera pushes in on the card while it plays (T.focus, scenes/tabs.js). Every number comes from thread.js.
// Pure function of t.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';
import { VIDEO, TOTAL, REAL, SPAM, ROWS, FAV, fmt } from './thread.js?v=c4c1b10f';

const SAY = 'Reading every comment on your new video.';
const row = (h) => ROWS.find((r) => r.handle === h);
// two sample lines per pile, verbatim from the thread Studio lists (thread.js)
const REAL_SAMPLES = [row(FAV), row('devonmakes')];
const SPAM_SAMPLES = [row('SamRiveraGiveaway'), row('coinvault.daily')];
const fav = row(FAV);
const ELAPSED = '2.1 s';
// timing (seconds from the reply start, or from the card where noted)
const CPS = 150;                        // the reply line streams
const SAY_AT = 0.03;
const CARD = 0.06;                      // reply start to the card rising in
const RISE = 0.22;
const READ0 = 0.08;                     // the card landing to the counter starting
const READ_DUR = 0.62; /* deliberate */ // 3,912 comments read
const SAMPLE_AT = [0.2, 0.32];          // the card landing to each pile's sample lines (real, then spam)
const SAMPLE_STEP = 0.08;
const SAMPLE_IN = 0.18;
const FAV_AT = 0.06;                    // the read finishing to the favorite flag
const FAV_IN = 0.2;
const FOOT_AT = 0.2;                    // the read finishing to the footer
const FOOT_IN = 0.16;
const HOLD = 0.42; /* deliberate */     // the finished card holds, readable, before the camera pulls back

// a sample line: a real comment reads from its start; a spam one from its end, where the bait is (Telegram, the link)
const q = (s, n) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);
const qt = (s, n) => (s.length > n ? `…${s.slice(s.length - n + 1).replace(/^\S*\s+/, '')}` : s);

export default {
  times(r, opts) {
    const T = { r };
    T.card = r + CARD;
    T.read0 = T.card + READ0;
    T.read1 = T.read0 + READ_DUR;
    T.fav = T.read1 + FAV_AT;
    T.foot = T.read1 + FOOT_AT;
    T.settled = Math.max(T.foot + FOOT_IN, T.fav + FAV_IN, r + SAY_AT + SAY.length / CPS);
    T.end = T.settled + HOLD;
    if (opts && opts.zoom) T.focus = { sw: T.card, landed: T.card + 0.3, pull: T.end - 0.04, back: T.end + 0.24 };
    window.__AD_MARKS = Object.assign(window.__AD_MARKS || {}, { split: { card: T.card, read0: T.read0, read1: T.read1, fav: T.fav, foot: T.foot } });
    return T;
  },
  build(k, x) {
    const T = k.T;
    const esc = x.esc;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${esc(SAY)}</span></div>`);
    const sample = (rw, cls) => `<div class="sp-ln ${cls}"><span class="sp-q">“${esc(rw.spam ? qt(rw.text, 50) : q(rw.text, 54))}”</span><i>@${esc(rw.handle)}</i></div>`;
    const card = x.el(`<div class="sp-card">
      <div class="sp-hd"><span class="sp-st"><i class="sp-spin"></i>${x.OK}</span><b>Sorting ${fmt(TOTAL)} comments</b><span class="sp-vid">${esc(VIDEO.title)}</span><span class="sp-time">${ELAPSED}</span></div>
      <div class="sp-count"><b class="sp-n">0</b> of ${fmt(TOTAL)} read</div>
      <div class="sp-pile sp-real">
        <div class="sp-row"><span class="sp-lab"><i class="sp-dot"></i>Real</span><b class="sp-v">0</b><span class="sp-bar"><i></i></span></div>
        ${REAL_SAMPLES.map((rw) => sample(rw, 'sp-g')).join('')}
      </div>
      <div class="sp-pile sp-spam">
        <div class="sp-row"><span class="sp-lab"><i class="sp-dot"></i>Spam</span><b class="sp-v">0</b><span class="sp-bar"><i></i></span></div>
        ${SPAM_SAMPLES.map((rw) => sample(rw, 'sp-r')).join('')}
      </div>
      <div class="sp-fav"><span class="sp-star">★</span><span class="sp-fl">Favorite</span><b>@${esc(fav.handle)}</b><span class="sp-likes">${fav.likes} likes</span><span class="sp-pin">to pin</span></div>
      <div class="sp-ft">${x.OK}<span>${fmt(REAL)} to heart, ${fmt(SPAM)} to hide, 1 to pin</span></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const st = { spin: $('.sp-spin'), ok: $('.sp-st .qc-ok') };
    const n = $('.sp-n');
    const piles = [['.sp-real', REAL], ['.sp-spam', SPAM]].map(([s, v]) => {
      const p = card.querySelector(s);
      return { v, num: p.querySelector('.sp-v'), bar: p.querySelector('.sp-bar i'), lns: [...p.querySelectorAll('.sp-ln')], txt: '' };
    });
    const favEl = $('.sp-fav'), ft = $('.sp-ft');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, nTxt = '';

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

        // the read: the counter races to the total, each pile's count and bar grow with it (share of the total)
        const p = inOutCubic(seg(t, T.read0, T.read1));
        const nt = fmt(Math.round(TOTAL * p));
        if (nt !== nTxt) { n.textContent = nt; nTxt = nt; }
        piles.forEach((pl, i) => {
          const vt = fmt(Math.round(pl.v * p));
          if (vt !== pl.txt) { pl.num.textContent = vt; pl.txt = vt; }
          pl.bar.style.transform = `scaleX(${((pl.v / TOTAL) * p).toFixed(4)})`;
          pl.lns.forEach((ln, j) => {
            const a = T.card + SAMPLE_AT[i] + j * SAMPLE_STEP;
            const f = outCubic(seg(t, a, a + SAMPLE_IN));
            ln.style.opacity = f.toFixed(3);
            ln.style.transform = f >= 1 ? 'none' : `translateX(${((1 - f) * -8).toFixed(2)}px)`;
          });
        });

        const d = outCubic(seg(t, T.read1, T.read1 + 0.2));
        st.spin.style.opacity = (1 - seg(t, T.read1 - 0.08, T.read1 + 0.06)).toFixed(3);
        st.spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        st.ok.style.opacity = d.toFixed(3);
        st.ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;

        const fv = outCubic(seg(t, T.fav, T.fav + FAV_IN));
        favEl.style.opacity = fv.toFixed(3);
        favEl.style.transform = fv >= 1 ? 'none' : `translateY(${((1 - fv) * 6).toFixed(2)}px)`;
        const f = outCubic(seg(t, T.foot, T.foot + FOOT_IN));
        ft.style.opacity = f.toFixed(3);
        ft.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 6).toFixed(2)}px)`;
      },
    };
  },
};
