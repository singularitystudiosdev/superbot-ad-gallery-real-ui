// Edit beat: Gemini watches the six raw workshop recordings and finds the lessons. Its line streams and a card rises
// (the base's catalog grammar: a compact card, a counter, rows that resolve). First the footage: a video glyph tile,
// "Sourdough workshop recordings", "6 videos, 5:48:20 total". Then the counter "Watching 348 min of video, 6 workshops"
// ticks the minutes up while a thin timeline strip plays through under it (the base's counter bar, drawn as the six
// recordings end to end, a hairline between workshops), and three findings resolve as rows (a glyph tile; the finding;
// how many; the tag). The first, the lesson breaks, carries the highlight and marks its 24 breaks on the strip; the
// Q&A, breaks and side chat and the repeated shaping demos shade the stretches they cut. The footer lands with the
// green check: "Cut 1:52:40, 24 lessons, 3:55:40 of teaching".
// COURSE is the one table of course facts every later beat and the Teachable page read (brand/CREDITS.txt DATA: the
// school, the creator and every number are made up for the spot; 5:48:20 minus 1:41:10 and 11:30 is 3:55:40, i.e.
// 20900 s minus 6070 s and 690 s is 14140 s). Pure function of t: every moving value is written from t, so ?t= and
// __AD.seek freeze any frame.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';
import { lc } from './lucide-icons.js?v=9deaa5f6';

const SAY = 'Watched all six workshops and found where each lesson starts.';
export const COURSE = {
  school: 'Crumb and Crust School', creator: 'Rosa Lindqvist', initials: 'RL', user: 'rosa',
  title: 'Sourdough from Scratch',
  folder: 'sourdough-workshops', files: '6 videos, 5:48:20',
  raw: '5:48:20', rawMin: 348, rawSec: 20900, workshops: 6, cut: '1:52:40', teach: '3:55:40', teachSec: 14140,
  lessons: 24, quizzes: 4, questions: 20, price: '$149',
  // the curriculum: [section title, lesson count]; 5 + 7 + 6 + 6 = 24
  sections: [['Your starter', 5], ['Mixing and folding', 7], ['Shaping and proofing', 6], ['Baking and the crumb', 6]],
  // Section 1's five lessons (the Teachable curriculum page shows them expanded)
  s1: ['Welcome and what you need', 'Building a starter, day 1 to 7', 'Feeding ratios made simple', 'Reading the rise', 'Fixing a sluggish starter'],
};
// deterministic pseudo-random in [0, 1)
const rnd = (i) => { const a = Math.sin(i * 12.9898 + 4.1) * 43758.5453; return a - Math.floor(a); };
// the 41 Q&A, break and side-chat stretches: 41 regions spread over the footage, their lengths summing to 6070 s
const QA = (() => {
  const w = Array.from({ length: 41 }, (_, i) => 0.5 + rnd(i));
  const sum = w.reduce((s, v) => s + v, 0);
  const len = w.map((v) => (6070 * v) / sum);
  const slot = 20900 / 41;
  return len.map((l, i) => { const a = i * slot + (slot - l) * (0.2 + 0.6 * rnd(i + 50)); return [a, a + l]; });
})();
// the findings: [what, how many, tag, lucide glyph, highlighted, cut regions on the footage timeline (seconds)]
const FINDINGS = [
  ['Lesson breaks', '24 topic changes found', '24 lessons', 'list-ordered', true, null],
  ['Q&A, breaks and side chat', '41 stretches', 'Cut 1:41:10', 'messages-square', false, QA],
  ['Repeated shaping demos', '2 extra takes', 'Cut 11:30', 'repeat', false, [[9300, 9645], [12900, 13245]]],
];
const DONE = `Cut ${COURSE.cut}, ${COURSE.lessons} lessons, ${COURSE.teach} of teaching`;
// the waveform strip: BARS bars across the raw 1:14:08, heights from a fixed seed (a speech-like envelope)
const BARS = 120;
const HEIGHTS = Array.from({ length: BARS }, (_, i) => {
  const a = Math.sin(i * 12.9898) * 43758.5453, r = a - Math.floor(a);
  const b = Math.sin(i * 0.37) * 0.18 + Math.sin(i * 1.7) * 0.12;
  return Math.max(0.18, Math.min(1, 0.42 + b + r * 0.5));
});
// the 24 lesson breaks (row 0's ticks), spread through the footage in bar units, and the 5 hairlines between workshops
const BREAKS = Array.from({ length: 24 }, (_, i) => Math.min(BARS - 1, Math.round(i * (BARS / 24) + 1 + rnd(i + 90) * 3)));
const SPLITS = [1, 2, 3, 4, 5].map((i) => (100 * i) / 6);
// timing (seconds from the reply start, or from the card where noted), in the base's v3 pace
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const COUNT_AT = 0.2;                  // the card landing to the counter starting
const COUNT = 0.7; /* deliberate */    // the counter running up to 348 min (the strip plays through with it)
const ROW_AT = 0.3;                    // the counter starting to the first finding
const STAGGER = 0.14;                  // one finding to the next
const ROW_IN = 0.24;                   // a finding rising in
const FOOT_AT = 0.24;                  // the last finding starting to the footer
const FOOT_IN = 0.24;                  // the footer rising in

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.c0 = T.card + COUNT_AT;
    T.c1 = T.c0 + COUNT;
    T.row = FINDINGS.map((_, i) => T.c0 + ROW_AT + i * STAGGER);
    T.foot = Math.max(T.row[FINDINGS.length - 1] + FOOT_AT, T.c1);
    T.end = Math.max(T.foot + FOOT_IN, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const pct = (s) => (100 * s / COURSE.rawSec).toFixed(3);
    const regions = FINDINGS.map(([, , , , , reg], i) => (reg || []).map(([a, b]) => `<i class="ct-cut${i === 1 ? ' ct-thin' : ''}" data-i="${i}" style="left:${pct(a)}%;width:${pct(b - a)}%"></i>`).join('')).join('');
    const ticks = BREAKS.map((b) => `<i class="ct-tick" data-i="0" style="left:${(100 * (b + 0.5) / BARS).toFixed(3)}%"></i>`).join('')
      + SPLITS.map((l) => `<i class="ct-split" style="left:${l.toFixed(3)}%"></i>`).join('');
    const card = x.el(`<div class="ct-card">
      <div class="ct-store">
        <span class="ct-bag">${lc('video')}</span>
        <span class="ct-sm"><b>Sourdough workshop recordings</b><code>${COURSE.workshops} videos, ${x.esc(COURSE.raw)} total</code></span>
      </div>
      <div class="ct-ch"><span class="ct-st"><i class="ct-spin"></i>${x.OK}</span><b>Watching <span class="ct-n">0</span> min of video, ${COURSE.workshops} workshops</b></div>
      <div class="ct-wave">${HEIGHTS.map((h) => `<i style="height:${(h * 100).toFixed(1)}%"></i>`).join('')}${regions}${ticks}</div>
      <div class="ct-list">${FINDINGS.map(([name, text, tag, gl, hi]) => `<div class="ct-row${hi ? ' ct-hi' : ''}"><span class="ct-th ct-gl">${lc(gl)}</span>
        <div class="ct-main"><span class="ct-r1"><b>${x.esc(name)}</b><span class="ct-tag">${x.esc(tag)}</span></span><span class="ct-tx">${x.esc(text)}</span></div></div>`).join('')}</div>
      <div class="ct-ft">${x.OK}<span>${x.esc(DONE)}</span></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const st = { spin: $('.ct-spin'), ok: $('.ct-st .qc-ok') };
    const ch = $('.ct-ch'), wave = $('.ct-wave'), n = $('.ct-n'), ft = $('.ct-ft');
    const bars = [...wave.querySelectorAll(':scope > i:not(.ct-cut):not(.ct-tick):not(.ct-split)')];
    const marks = [...wave.querySelectorAll('.ct-cut, .ct-tick')].map((m) => ({ m, i: +m.dataset.i }));
    const rows = [...card.querySelectorAll('.ct-row')];
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, count = '', played = -1;

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card], [T.row[1], rows[1]], [T.foot, ft]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // the counter and the strip: the minutes run up while the waveform plays through
        const cin = outCubic(seg(t, T.c0 - 0.1, T.c0 + 0.14));
        ch.style.opacity = cin.toFixed(3);
        wave.style.opacity = cin.toFixed(3);
        const q = inOutCubic(seg(t, T.c0, T.c1));
        const c = String(Math.round(COURSE.rawMin * q));
        if (c !== count) { n.textContent = c; count = c; }
        const p = Math.round(BARS * q);
        if (p !== played) { bars.forEach((b, i) => b.classList.toggle('on', i < p)); played = p; }
        const d = outCubic(seg(t, T.c1, T.c1 + 0.2));
        st.spin.style.opacity = (1 - seg(t, T.c1 - 0.08, T.c1 + 0.06)).toFixed(3);
        st.spin.style.transform = `rotate(${((t - T.c0) * 420).toFixed(1)}deg)`;
        st.ok.style.opacity = d.toFixed(3);
        st.ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;

        rows.forEach((row, i) => {
          const o = outCubic(seg(t, T.row[i], T.row[i] + ROW_IN));
          row.style.opacity = o.toFixed(3);
          row.style.transform = o >= 1 ? 'none' : `translateY(${((1 - o) * 8).toFixed(2)}px)`;
        });
        // each finding's cut shades on the strip as its row lands
        marks.forEach(({ m, i }) => { m.style.opacity = outCubic(seg(t, T.row[i], T.row[i] + ROW_IN)).toFixed(3); });
        const f = outCubic(seg(t, T.foot, T.foot + FOOT_IN));
        ft.style.opacity = f.toFixed(3);
        ft.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 6).toFixed(2)}px)`;
      },
    };
  },
};
