// Moments beat: Gemini watches Theo's long video and finds the three moments viewers replay most. Its line streams and
// a card rises: the video row (the thumbnail, img/thumb-carretera.jpg, with the 31:04 chip, the title, the channel and
// 640K views, "Watching the video" with a timecode running 0:00 to 31:04 and a spinner resolving to the check). Under
// it the "Most replayed" graph (YouTube's own name for the replay heatmap over the progress bar): the curve draws left
// to right behind the playhead, and as the playhead passes each spike its range lights up (8:12 to 8:54, 17:55 to 18:33,
// 26:30 to 27:15) with its number flag, and its row lands below (start, end, what happens, length, a tag). The footer:
// "3 moments picked, 2:05 of Shorts from 31:04". The grammar is the source's watch card (header with spinner resolving
// to the check, staggered rows). Pure function of t: every moving value is written from t.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';
import { CHANNEL, VIDEO, MOMENTS, TOTAL, clock } from './story.js?v=5c75e467';

const SAY = `Watched all ${VIDEO.len} and found the 3 moments viewers replay most.`;
const DONE = `3 moments picked, ${TOTAL} of Shorts from ${VIDEO.len}`;
const L = VIDEO.lenS;
const TAGS = ['Replay spike', 'Most replayed', 'Replay spike'];
// the replay curve: a quiet baseline with the intro bump every video has, and the three spikes (glacier the tallest)
const PEAK = [0.74, 1, 0.84];
const N = 160;
const curve = (() => {
  const g = (x, c, w) => Math.exp(-(((x - c) / w) ** 2));
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const s = (i / N) * L;
    let y = 0.2 + 0.05 * Math.sin(s / 37) + 0.04 * Math.sin(s / 13 + 1.7) + 0.32 * g(s, 0, 70) + 0.08 * g(s, 640, 120) + 0.07 * g(s, 1400, 150);
    MOMENTS.forEach((m, k) => { y += (PEAK[k] - 0.22) * g(s, m.s + m.d / 2, m.d * 0.75); });
    pts.push([(i / N) * 1000, 100 - Math.min(0.98, y) * 92]);
  }
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(2)}`).join('');
  return { line, area: `${line}L1000 100L0 100Z` };
})();
// timing (seconds from the reply start, or from the card where noted), in the source's v3 pace
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const PLAY_AT = 0.1;                   // the card landing to the playhead starting
const PLAY = 1.0; /* deliberate */     // the playhead sweeping all 31:04 (linear, so each spike lands where it is)
const HL_IN = 0.2;                     // a range lighting up as the playhead passes its start
const ROW_AT = 0.06;                   // a range lit to its row landing
const ROW_IN = 0.24;                   // a row rising in
const FOOT_AT = 0.1;                   // the sweep done to the footer
const FOOT_IN = 0.24;                  // the footer rising in
const READ = 0.25; /* deliberate */     // the picked rows read before the next pill

const pct = (v) => `${(v * 100).toFixed(3)}%`;

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.p0 = T.card + PLAY_AT;
    T.p1 = T.p0 + PLAY;
    T.hl = MOMENTS.map((m) => T.p0 + PLAY * (m.s / L));
    T.row = T.hl.map((h) => h + ROW_AT);
    T.foot = T.p1 + FOOT_AT;
    T.end = Math.max(T.foot + FOOT_IN + READ, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    window.__AD_MARKS = Object.assign(window.__AD_MARKS || {}, { moments: { card: T.card, p0: T.p0, p1: T.p1, hl: T.hl.slice(), foot: T.foot } });
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="mo-card">
      <div class="mo-vid">
        <span class="mo-th"><img src="${x.img('thumb-carretera.jpg')}" width="1280" height="720" alt=""/><i class="mo-len">${VIDEO.len}</i></span>
        <div class="mo-meta">
          <b class="mo-title">${x.esc(VIDEO.title)}</b>
          <span class="mo-by">${x.esc(CHANNEL)} · ${VIDEO.views}</span>
          <span class="mo-hd"><span class="mo-st"><i class="mo-spin"></i>${x.OK}</span>Watching the video<span class="mo-tc"><b>0:00</b> / ${VIDEO.len}</span></span>
        </div>
      </div>
      <div class="mo-gr">
        <span class="mo-gl">Most replayed</span>
        <div class="mo-plot">
          ${MOMENTS.map((m) => `<i class="mo-band" style="left: ${pct(m.s / L)}; width: ${pct(m.d / L)}"></i>`).join('')}
          <svg class="mo-svg" viewBox="0 0 1000 100" preserveAspectRatio="none" aria-hidden="true">
            <defs><clipPath id="mo-clip" clipPathUnits="userSpaceOnUse"><rect class="mo-cr" x="0" y="0" width="0" height="100"/></clipPath></defs>
            <path class="mo-ghost" d="${curve.area}"/>
            <g clip-path="url(#mo-clip)"><path class="mo-area" d="${curve.area}"/><path class="mo-line" d="${curve.line}"/></g>
          </svg>
          ${MOMENTS.map((m, i) => `<i class="mo-flag" style="left: ${pct((m.s + m.d / 2) / L)}">${i + 1}</i>`).join('')}
          <i class="mo-head"></i>
        </div>
        <div class="mo-bar"><i class="mo-fill"></i>${MOMENTS.map((m) => `<u style="left: ${pct(m.s / L)}; width: ${pct(m.d / L)}"></u>`).join('')}</div>
        <div class="mo-ax"><span>0:00</span><span>${VIDEO.len}</span></div>
      </div>
      <div class="mo-list">${MOMENTS.map((m, i) => `<div class="mo-row"><span class="mo-rk">${i + 1}</span>
        <span class="mo-at">${m.at} – ${clock(m.s + m.d)}</span><span class="mo-what">${x.esc(m.what)}</span>
        <span class="mo-d">${m.len}</span><span class="mo-tag${i === 1 ? ' mo-top' : ''}">${TAGS[i]}</span></div>`).join('')}</div>
      <div class="mo-ft">${x.OK}<span>${x.esc(DONE)}</span></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const st = { spin: $('.mo-spin'), ok: $('.mo-st .qc-ok') };
    const cr = $('.mo-cr'), head = $('.mo-head'), fill = $('.mo-fill'), tc = $('.mo-tc b'), ft = $('.mo-ft');
    const bands = [...card.querySelectorAll('.mo-band')], flags = [...card.querySelectorAll('.mo-flag')], ticks = [...card.querySelectorAll('.mo-bar u')];
    const rows = [...card.querySelectorAll('.mo-row')];
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, clk = '';

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card], [T.row[2], rows[2]], [T.foot, ft]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // the playhead: linear through the whole video; the curve draws behind it, the bar fills under it
        const p = seg(t, T.p0, T.p1);
        cr.setAttribute('width', (p * 1000).toFixed(1));
        head.style.left = pct(p);
        head.style.opacity = (p > 0 && p < 1 ? 1 : 1 - seg(t, T.p1, T.p1 + 0.2)).toFixed(3);
        fill.style.transform = `scaleX(${p.toFixed(4)})`;
        const c = clock(p * L);
        if (c !== clk) { tc.textContent = c; clk = c; }
        const d = outCubic(seg(t, T.p1, T.p1 + 0.2));
        st.spin.style.opacity = (1 - seg(t, T.p1 - 0.08, T.p1 + 0.06)).toFixed(3);
        st.spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        st.ok.style.opacity = d.toFixed(3);
        st.ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;

        // each range lights up as the playhead passes it, its flag pops, its row lands
        MOMENTS.forEach((m, i) => {
          const h = outCubic(seg(t, T.hl[i], T.hl[i] + HL_IN));
          bands[i].style.opacity = h.toFixed(3);
          ticks[i].style.opacity = h.toFixed(3);
          flags[i].style.opacity = h.toFixed(3);
          flags[i].style.transform = `translate(-50%, ${((1 - h) * 6).toFixed(2)}px) scale(${lerp(0.6, 1, h).toFixed(4)})`;
          const o = outCubic(seg(t, T.row[i], T.row[i] + ROW_IN));
          rows[i].style.opacity = o.toFixed(3);
          rows[i].style.transform = o >= 1 ? 'none' : `translateY(${((1 - o) * 8).toFixed(2)}px)`;
        });
        const f = outCubic(seg(t, T.foot, T.foot + FOOT_IN));
        ft.style.opacity = f.toFixed(3);
        ft.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 6).toFixed(2)}px)`;
      },
    };
  },
};
