// Watch beat: Gemini 3.1 Pro watches the whole video (it takes video in natively) to answer the two questions GPT-6
// Luna flagged. Its line streams and a card rises: the video row (Sam's thumbnail with the 14:32 chip, the title,
// "Watching the video" ("Watched" once the sweep lands) with a spinner resolving to the check, a timecode, and a playhead sweeping the bar). Each time the
// playhead passes a moment that answers a question, a marker lands on the bar and a found row rises under it: the real
// frame at that timestamp (img/at-438.jpg, img/at-705.jpg) with its time chip, whose question it answers, and the
// answer. The footer: "Both answers found, with timestamps". The playhead sweeps once, so the frames arrive in video
// order (4:38 before 7:05). Pure function of t.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';
import { VIDEO, MOMENTS } from './data.js?v=b73828a5';

const SAY = 'Watching all 14:32 for the two answers.';
const DONE = 'Both answers found, with timestamps';
const CHAPTERS = [118, 278, 372, 425, 640];  // chapter marks on the 14:32 bar (seconds)
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;
const PLAY_AT = 0.12;                  // the card landing to the playhead starting
const PLAY = 0.95; /* deliberate */     // the playhead sweeping the whole video (both finds land inside it)
const ROW_IN = 0.28;                   // a found row rising in once the playhead passes its moment
const FOOT_AT = 0.16;                  // the playhead done to the footer
const FOOT_IN = 0.24;

const fmtTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
// when the eased sweep reaches a share of the video (inverse of inOutCubic over [p0, p1])
const reach = (p0, p1, share) => {
  let lo = 0, hi = 1;
  for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (inOutCubic(m) < share) lo = m; else hi = m; }
  return p0 + (p1 - p0) * hi;
};

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.p0 = T.card + PLAY_AT;
    T.p1 = T.p0 + PLAY;
    T.find = MOMENTS.map((m) => reach(T.p0, T.p1, m.at / VIDEO.lenS));
    T.foot = Math.max(T.p1, T.find[MOMENTS.length - 1] + ROW_IN) + FOOT_AT;
    T.end = Math.max(T.foot + FOOT_IN, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="wv-card">
      <div class="wv-vid">
        <span class="wv-th"><img src="${VIDEO.thumb}" width="1280" height="720" alt=""/><i class="wv-len">${VIDEO.len}</i></span>
        <div class="wv-meta">
          <b class="wv-title">${x.esc(VIDEO.title)}</b>
          <span class="wv-hd"><span class="wv-st"><i class="wv-spin"></i>${x.OK}</span><span class="wf-verb">Watching the video</span><span class="wv-tc">0:00</span></span>
          <i class="wv-bar"><i class="wv-fill"></i>${CHAPTERS.map((c) => `<u style="left: ${((c / VIDEO.lenS) * 100).toFixed(3)}%"></u>`).join('')}
            ${MOMENTS.map((m) => `<s class="wf-mk" style="left: ${((m.at / VIDEO.lenS) * 100).toFixed(3)}%"></s>`).join('')}<i class="wv-head"></i></i>
        </div>
      </div>
      <div class="wf-list">${MOMENTS.map((m) => `<div class="wf-row">
        <span class="wf-fr"><img src="${m.frame}" width="640" height="360" alt=""/><i class="wv-len">${m.ts}</i></span>
        <div class="wf-main"><span class="wf-q">${x.esc(m.q)}</span><b class="wf-a">${x.esc(m.a)}</b></div></div>`).join('')}</div>
      <div class="wv-ft">${x.OK}<span>${x.esc(DONE)}</span></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const st = { spin: $('.wv-spin'), ok: $('.wv-st .qc-ok') };
    const fill = $('.wv-fill'), head = $('.wv-head'), tc = $('.wv-tc'), ticks = [...card.querySelectorAll('.wv-bar u')];
    const verb = $('.wf-verb');
    const mks = [...card.querySelectorAll('.wf-mk')], rows = [...card.querySelectorAll('.wf-row')], ft = $('.wv-ft');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, clock = '';

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card], [T.find[0], rows[0]], [T.find[1], rows[1]], [T.foot, ft]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        const p = inOutCubic(seg(t, T.p0, T.p1));
        fill.style.transform = `scaleX(${p.toFixed(4)})`;
        head.style.left = `${(p * 100).toFixed(3)}%`;
        ticks.forEach((u) => u.classList.toggle('on', p * 100 >= parseFloat(u.style.left)));
        const c = fmtTime(Math.round(p * VIDEO.lenS));
        if (c !== clock) { tc.textContent = c; clock = c; }
        const v = t >= T.p1 ? 'Watched the video' : 'Watching the video';
        if (verb.textContent !== v) verb.textContent = v;
        const d = outCubic(seg(t, T.p1, T.p1 + 0.2));
        st.spin.style.opacity = (1 - seg(t, T.p1 - 0.08, T.p1 + 0.06)).toFixed(3);
        st.spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        st.ok.style.opacity = d.toFixed(3);
        st.ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;

        // a find: the marker pops on the bar as the playhead passes it, its row rises
        MOMENTS.forEach((m, i) => {
          const pop = seg(t, T.find[i], T.find[i] + 0.22);
          mks[i].style.opacity = outCubic(pop).toFixed(3);
          mks[i].style.transform = `translate(-50%, -50%) scale(${(pop > 0 ? 1 + 0.5 * Math.sin(Math.PI * pop) : 0.4).toFixed(4)})`;
          const o = outCubic(seg(t, T.find[i], T.find[i] + ROW_IN));
          // a row takes no room until it lands, then grows to its height
          rows[i].style.display = o <= 0 ? 'none' : '';
          if (o > 0) { rows[i].style.height = ''; const h = rows[i].offsetHeight; rows[i].style.height = o >= 1 ? '' : `${(h * o).toFixed(2)}px`; }
          rows[i].style.opacity = o.toFixed(3);
        });
        const f = outCubic(seg(t, T.foot, T.foot + FOOT_IN));
        ft.style.opacity = f.toFixed(3);
        ft.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 6).toFixed(2)}px)`;
      },
    };
  },
};
