// Watch beat: Gemini watches the latest video, reads its comments and maps them to the timeline. Its line streams and
// a card rises. First the video: its thumbnail (img/mic-frame.jpg, the real Pexels photo, img/CREDITS.txt) with the
// 14:32 duration badge, the title, and a progress line filling under "Watching the video" (spinner resolving to the
// check; a thin fill only, no knob, so nothing reads as a seek bar). Then "Reading N comments" ticks up to 1,284. Then
// superbot's own data panel "Comment mentions by timestamp": an area chart across the 14:32 timeline (axis 0:00, 5:00,
// 10:00, 14:32, the chapters under it) draws left to right; it peaks sharply at 6:12 under "Blind test" (smaller bumps
// at 4:38 and 7:05). This is superbot's chart, not YouTube's player: no red bar, no scrubber, no knob. As the peak
// draws, three comments that name 6:12 surface (letter avatar, name, like count, the comment with 6:12 marked in a
// soft superbot highlight) and the footer lands: "Most talked-about moment: 6:12, the blind test". superbot's line
// follows under the card: "312 comments point to the blind test at 6:12."
// Every commenter is made up for the spot. Pure function of t: every moving value is written from t, so ?t= and
// __AD.seek freeze any frame.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';
import { ms } from './yt-icons.js?v=b0c8e364';

const SAY = 'Watched the whole video and read all 1,284 comments.';
const AFTER = '312 comments point to the blind test at 6:12.';
export const VIDEO = { title: 'I tested 12 budget mics under $100', len: '14:32' };
const TOTAL = 1284;
const LEN_S = 14 * 60 + 32;
// the video's chapters: [label, start (s)]. The ticks on the watch line mark the chapter starts.
const CHAPTERS = [['Intro', 0], ['The 12 mics', 60], ['Boom arm', 240], ['Blind test', 330], ['Side by side', 410], ['Verdict', 630]];
const PEAK_S = 6 * 60 + 12;            // 6:12, the blind test
// comment mentions per second of video: a low floor, small bumps at 4:38 and 7:05, the sharp peak at 6:12
const BUMPS = [[278, 0.2, 14], [PEAK_S, 1, 9], [425, 0.17, 12], [70, 0.06, 30], [700, 0.07, 40], [840, 0.08, 18]];
const density = (s) => 0.03 + 0.012 * Math.sin(s / 23) + BUMPS.reduce((a, [c, h, w]) => a + h * Math.exp(-((s - c) ** 2) / (2 * w * w)), 0);
// the three comments that name the peak: [name, text, likes, avatar colour]; 6:12 is marked where it appears
export const PEAK_COMMENTS = [
  ['Marco Ruiz', 'The blind test at 6:12 got me. Picked the $29 one every single time.', '1.4K', '#e8710a'],
  ['Aisha Khan', 'Ran 6:12 back three times with headphones on. Still picked C.', '633', '#0b8043'],
  ['Jonas Weber', '6:12 should be its own video honestly', '402', '#8e24aa'],
];
const DONE = 'Most talked-about moment: 6:12, the blind test';
// timing (seconds from the reply start, or from the card where noted), in the base's v3 pace
const CPS = 100;                       // superbot's lines stream at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const PLAY_AT = 0.12;                  // the card landing to the watch line starting
const PLAY = 0.5; /* deliberate */     // the watch line filling (the whole video)
const COUNT_AT = 0.08;                 // the video watched to the comment counter starting
const COUNT = 0.5; /* deliberate */    // the counter running up to 1,284 (its bar fills with it)
const CHART_AT = 0.15;                 // the counter starting to the chart panel rising
const CHART_IN = 0.3;
const DRAW_AT = 0.25;                  // the chart panel landing to the area starting to draw
const DRAW = 1.4; /* deliberate */     // the area drawing across the whole timeline, left to right
const PEAK_POP = 0.25;                 // the 6:12 marker popping as the drawing passes the peak
const CM_AT = 0.15;                    // the peak drawn to the first comment rising
const CM_STAGGER = 0.35;               // one comment to the next
const CM_IN = 0.3;
const FOOT_AT = 0.1;                   // the drawing done and the comments in, to the footer
const FOOT_IN = 0.24;
const AFTER_AT = 0.3;                  // the footer to superbot's line under the card
const HOLD = 1.0; /* deliberate */     // the finished card reads before the next pill

const fmt = (n) => n.toLocaleString('en-US');
const THUMB = ms('thumb-up-outline');
const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
const pct = (s) => (s / LEN_S) * 100;

// the area chart, in a 1000 x 100 box (x: seconds across the video, y: mentions, peak at the top)
function areaPath() {
  const N = 240, H = 100, top = 8;
  const max = density(PEAK_S);
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const s = (i / N) * LEN_S;
    pts.push([(s / LEN_S) * 1000, H - (density(s) / max) * (H - top)]);
  }
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(2)}`).join('');
  return { line, area: `${line}L1000 ${H}L0 ${H}Z`, peakY: H - (H - top) };
}

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.p0 = T.card + PLAY_AT;
    T.p1 = T.p0 + PLAY;
    T.c0 = T.p1 + COUNT_AT;
    T.c1 = T.c0 + COUNT;
    T.chart = T.c0 + CHART_AT;
    T.d0 = T.chart + DRAW_AT;
    T.d1 = T.d0 + DRAW;
    T.peak = T.d0 + DRAW * (PEAK_S / LEN_S);  // the drawing passes 6:12
    T.cm = PEAK_COMMENTS.map((_, i) => T.peak + CM_AT + i * CM_STAGGER);
    T.foot = Math.max(T.d1, T.cm[PEAK_COMMENTS.length - 1] + CM_IN, T.c1) + FOOT_AT;
    T.after = T.foot + FOOT_IN + AFTER_AT;
    T.end = Math.max(T.after + AFTER.length / CPS, r + SAY_AT + SAY.length / CPS) + HOLD;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const { line, area } = areaPath();
    const markTs = (s) => x.esc(s).replace(/6:12/g, '<mark class="wv-ts">6:12</mark>');
    // chapter labels sit centred on their chapter in two staggered rows, so neighbours never overlap
    const chap = CHAPTERS.map(([label, s0], i) => {
      const s1 = i + 1 < CHAPTERS.length ? CHAPTERS[i + 1][1] : LEN_S;
      const c = Math.min(95, Math.max(4, pct((s0 + s1) / 2)));
      return `<span class="wv-chl${i % 2 ? ' wv-r2' : ''}${label === 'Blind test' ? ' wv-hot' : ''}" style="left: ${c.toFixed(2)}%">${x.esc(label)}</span>`;
    }).join('');
    const card = x.el(`<div class="wv-card">
      <div class="wv-vid">
        <span class="wv-th"><img src="${x.img('mic-frame.jpg')}" width="1280" height="720" alt=""/><i class="wv-len">${VIDEO.len}</i></span>
        <div class="wv-meta">
          <b class="wv-title">${x.esc(VIDEO.title)}</b>
          <span class="wv-hd"><span class="wv-st"><i class="wv-spin"></i>${x.OK}</span>Watching the video<span class="wv-tc">0:00</span></span>
          <i class="wv-bar"><i class="wv-fill"></i>${CHAPTERS.slice(1).map(([, s]) => `<u style="left: ${pct(s).toFixed(3)}%"></u>`).join('')}</i>
        </div>
      </div>
      <div class="wv-ch"><span class="wv-st"><i class="wv-spin"></i>${x.OK}</span><b>Reading <span class="wv-n">0</span> comments</b></div>
      <i class="wv-cbar"><i></i></i>
      <div class="wv-chart">
        <div class="wv-ct">Comment mentions by timestamp</div>
        <div class="wv-plot">
          <svg class="wv-svg" viewBox="0 0 1000 100" preserveAspectRatio="none" aria-hidden="true">
            <defs><linearGradient id="wvg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8ab4f8" stop-opacity=".55"/><stop offset="1" stop-color="#8ab4f8" stop-opacity=".04"/></linearGradient>
              <clipPath id="wvclip"><rect class="wv-clip" x="0" y="-10" width="0" height="120"/></clipPath></defs>
            ${CHAPTERS.slice(1).map(([, s]) => `<line class="wv-div" x1="${(pct(s) * 10).toFixed(1)}" x2="${(pct(s) * 10).toFixed(1)}" y1="0" y2="100"/>`).join('')}
            <g clip-path="url(#wvclip)"><path class="wv-area" d="${area}"/><path class="wv-line" d="${line}"/></g>
          </svg>
          <i class="wv-pk" style="left: ${pct(PEAK_S).toFixed(3)}%"><b>6:12</b></i>
        </div>
        <div class="wv-axis">${[0, 300, 600, LEN_S].map((s) => `<span style="left: ${pct(s).toFixed(3)}%">${mmss(s)}</span>`).join('')}</div>
        <div class="wv-chs">${chap}</div>
      </div>
      <div class="wv-list">${PEAK_COMMENTS.map(([name, text, likes, c]) => `<div class="wv-row"><span class="wv-av" style="--c: ${c}">${x.esc(name[0])}</span>
        <div class="wv-main"><span class="wv-l1"><b>${x.esc(name)}</b><span class="wv-lk">${THUMB}${likes}</span></span><span class="wv-tx">${markTs(text)}</span></div></div>`).join('')}</div>
      <div class="wv-ft">${x.OK}<span>${x.esc(DONE)}</span></div>
    </div>`);
    const after = x.el(`<div class="qc-say wv-after"><span class="qc-vis"></span><span class="qc-hid">${x.esc(AFTER)}</span></div>`);
    const $ = (s) => card.querySelector(s);
    const [vSt, cSt] = [...card.querySelectorAll('.wv-st')].map((n) => ({ spin: n.querySelector('.wv-spin'), ok: n.querySelector('.qc-ok') }));
    const fill = $('.wv-fill'), tc = $('.wv-tc'), ticks = [...card.querySelectorAll('.wv-bar u')];
    const ch = $('.wv-ch'), cbarW = $('.wv-cbar'), cbar = $('.wv-cbar i'), n = $('.wv-n'), ft = $('.wv-ft');
    const chart = $('.wv-chart'), clip = $('.wv-clip'), pk = $('.wv-pk'), hot = $('.wv-hot');
    const rows = [...card.querySelectorAll('.wv-row')];
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const aVis = after.firstElementChild, aHid = after.lastElementChild;
    let shown = -1, aShown = -1, count = '', clock = '', clipW = '';

    const status = (s, t, a, b) => {
      const d = outCubic(seg(t, b, b + 0.2));
      s.spin.style.opacity = (1 - seg(t, b - 0.08, b + 0.06)).toFixed(3);
      s.spin.style.transform = `rotate(${((t - a) * 420).toFixed(1)}deg)`;
      s.ok.style.opacity = d.toFixed(3);
      s.ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;
    };

    return {
      nodes: [say, card, after],
      marks: [[T.r, say], [T.card, card], [T.chart, chart], [T.cm[0], rows[0]], [T.cm[2], rows[2]], [T.foot, ft], [T.after, after]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // the watch line: a fast run through the whole video; the chapter ticks it has passed light up
        const p = inOutCubic(seg(t, T.p0, T.p1));
        fill.style.transform = `scaleX(${p.toFixed(4)})`;
        ticks.forEach((u, i) => u.classList.toggle('on', p * LEN_S >= CHAPTERS[i + 1][1]));
        const c = mmss(Math.round(p * LEN_S));
        if (c !== clock) { tc.textContent = c; clock = c; }
        status(vSt, t, T.card, T.p1);

        // the comment counter and its bar
        const cin = outCubic(seg(t, T.c0 - 0.1, T.c0 + 0.14));
        ch.style.opacity = cin.toFixed(3);
        cbarW.style.opacity = cin.toFixed(3);
        const q = inOutCubic(seg(t, T.c0, T.c1));
        const cn = fmt(Math.round(TOTAL * q));
        if (cn !== count) { n.textContent = cn; count = cn; }
        cbar.style.transform = `scaleX(${q.toFixed(4)})`;
        status(cSt, t, T.c0, T.c1);

        // the chart: the panel rises, the area draws left to right (linear in time), the 6:12 marker pops at the peak
        const cr = outCubic(seg(t, T.chart, T.chart + CHART_IN));
        chart.style.opacity = cr.toFixed(3);
        chart.style.transform = cr >= 1 ? 'none' : `translateY(${((1 - cr) * 8).toFixed(2)}px)`;
        const w = (seg(t, T.d0, T.d1) * 1000).toFixed(1);
        if (w !== clipW) { clip.setAttribute('width', w); clipW = w; }
        const pp = outCubic(seg(t, T.peak, T.peak + PEAK_POP));
        pk.style.opacity = pp.toFixed(3);
        pk.firstElementChild.style.transform = pp >= 1 ? 'none' : `translateY(${((1 - pp) * 6).toFixed(2)}px) scale(${lerp(0.8, 1, pp).toFixed(4)})`;
        hot.classList.toggle('on', t >= T.peak);

        rows.forEach((row, i) => {
          const o = outCubic(seg(t, T.cm[i], T.cm[i] + CM_IN));
          row.style.opacity = o.toFixed(3);
          row.style.transform = o >= 1 ? 'none' : `translateY(${((1 - o) * 8).toFixed(2)}px)`;
        });
        const f = outCubic(seg(t, T.foot, T.foot + FOOT_IN));
        ft.style.opacity = f.toFixed(3);
        ft.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 6).toFixed(2)}px)`;

        const na = streamCount(AFTER, T.after, CPS, t);
        if (na !== aShown) { aVis.textContent = AFTER.slice(0, na); aHid.textContent = AFTER.slice(na); aShown = na; }
        after.style.opacity = t >= T.after ? '1' : '0';
      },
    };
  },
};
