// Process beat: Gemini watches the creator's 2h 14m process video and finds the steps her patrons ask about. Its line
// streams and a card rises. First the video: a film glyph tile, "process.mov", "2h 14m, recorded Oct 1", and a head
// sweeping a bar with one tick per step it marks, under "Watching your 2h 14m process video" (spinner resolving to the
// check) while the timecode ticks 0:00:00 to 2:14:00. Then "Found N steps patrons ask about" ticks up to 6 and the
// ranked steps resolve as rows (rank, a film glyph tile, the step, its timecode, one small tag; the lead step is
// highlighted, the coffee break dimmed), and the footer lands: "Kept 5 steps, skipped the coffee break".
// The grammar is the base's research card (header with spinner resolving to the check, a counter, staggered rows).
// The video and every step are made up for the spot. Pure function of t: every moving value is written from t, so ?t=
// and __AD.seek freeze any frame.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';
import { lc } from './lucide-icons.js?v=8f4b57c6';

const SAY = 'Watched your whole process video and marked the steps patrons ask about.';
export const VIDEO = { title: 'process.mov', meta: '2h 14m, recorded Oct 1' };
const LEN_S = 2 * 3600 + 14 * 60;      // 2:14:00
// the ranked steps: [step, timecode, tag, kind] (kind: lead | keep | skip)
export const STEPS = [
  ['Inking the robin', '0:58:20', 'Lead', 'lead'],
  ['Six thumbnail layouts', '0:03:10', 'Keep', 'keep'],
  ['Coffee break', '1:41:30', 'Skip', 'skip'],
  ['Pencil under-drawing', '0:27:45', 'Keep', 'keep'],
  ['Mixing the orange breast', '1:22:05', 'Keep', 'keep'],
  ['Watercolor wash', '1:59:12', 'Keep', 'keep'],
];
// the five kept steps in the order of the video: the clips the post carries (patreon.js)
export const CLIPS = STEPS.filter((s) => s[3] !== 'skip').map((s) => s[1]).sort();
const secs = (tc) => tc.split(':').reduce((a, v) => a * 60 + Number(v), 0);
const MARKS = STEPS.map((s) => secs(s[1])).sort((a, b) => a - b);
const DONE = 'Kept 5 steps, skipped the coffee break';
const TOTAL = STEPS.length;
// timing (seconds from the reply start, or from the card where noted), in the base's v3 pace
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const PLAY_AT = 0.12;                  // the card landing to the head starting
const PLAY = 0.6; /* deliberate */     // the head sweeping the whole video
const COUNT_AT = 0.08;                 // the video watched to the step counter starting
const COUNT = 0.6; /* deliberate */    // the counter running up to 6 (its bar fills with it)
const ROW_AT = 0.2;                    // the counter starting to the first ranked row
const STAGGER = 0.12;                  // one row to the next
const ROW_IN = 0.24;                   // a row rising in
const FOOT_AT = 0.12;                  // the last row landing to the footer
const FOOT_IN = 0.24;                  // the footer rising in
const tcode = (s) => `${Math.floor(s / 3600)}:${String(Math.floor(s / 60) % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.p0 = T.card + PLAY_AT;
    T.p1 = T.p0 + PLAY;
    T.c0 = T.p1 + COUNT_AT;
    T.c1 = T.c0 + COUNT;
    T.row = STEPS.map((_, i) => T.c0 + ROW_AT + i * STAGGER);
    T.foot = Math.max(T.row[STEPS.length - 1] + FOOT_AT, T.c1);
    T.end = Math.max(T.foot + FOOT_IN, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="wv-card">
      <div class="wv-vid">
        <span class="wv-th">${lc('film')}</span>
        <div class="wv-meta">
          <span class="wv-l0"><b class="wv-title">${x.esc(VIDEO.title)}</b><span class="wv-sub">${x.esc(VIDEO.meta)}</span></span>
          <span class="wv-hd"><span class="wv-st"><i class="wv-spin"></i>${x.OK}</span>Watching your 2h 14m process video<span class="wv-tc">0:00:00</span></span>
          <i class="wv-bar"><i class="wv-fill"></i>${MARKS.map((m) => `<u style="left: ${((m / LEN_S) * 100).toFixed(3)}%"></u>`).join('')}<i class="wv-head"></i></i>
        </div>
      </div>
      <div class="wv-ch"><span class="wv-st"><i class="wv-spin"></i>${x.OK}</span><b>Found <span class="wv-n">0</span> steps patrons ask about</b></div>
      <i class="wv-cbar"><i></i></i>
      <div class="wv-list">${STEPS.map(([step, tc, tag, kind], i) => `<div class="wv-row wv-${kind}"><span class="wv-rk">${i + 1}</span><span class="wv-av">${lc('film')}</span>
        <div class="wv-main"><span class="wv-l1"><b>${x.esc(step)}</b><span class="wv-tag">${x.esc(tag)}</span></span><span class="wv-tx">${tc}</span></div></div>`).join('')}</div>
      <div class="wv-ft">${x.OK}<span>${x.esc(DONE)}</span></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const [vSt, cSt] = [...card.querySelectorAll('.wv-st')].map((n) => ({ spin: n.querySelector('.wv-spin'), ok: n.querySelector('.qc-ok') }));
    const fill = $('.wv-fill'), head = $('.wv-head'), tc = $('.wv-tc'), ticks = [...card.querySelectorAll('.wv-bar u')];
    const ch = $('.wv-ch'), cbarW = $('.wv-cbar'), cbar = $('.wv-cbar i'), n = $('.wv-n'), ft = $('.wv-ft');
    const rows = [...card.querySelectorAll('.wv-row')];
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, count = '', clock = '';

    const status = (s, t, a, b) => {
      const d = outCubic(seg(t, b, b + 0.2));
      s.spin.style.opacity = (1 - seg(t, b - 0.08, b + 0.06)).toFixed(3);
      s.spin.style.transform = `rotate(${((t - a) * 420).toFixed(1)}deg)`;
      s.ok.style.opacity = d.toFixed(3);
      s.ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;
    };

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card], [T.row[2], rows[2]], [T.foot, ft]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // the head: a fast run through the whole video, easing in at the end; the steps it has passed light up
        const p = inOutCubic(seg(t, T.p0, T.p1));
        fill.style.transform = `scaleX(${p.toFixed(4)})`;
        head.style.left = `${(p * 100).toFixed(3)}%`;
        ticks.forEach((u, i) => u.classList.toggle('on', p * LEN_S >= MARKS[i]));
        const tcv = tcode(Math.round(p * LEN_S / 10) * 10);
        if (tcv !== clock) { tc.textContent = tcv; clock = tcv; }
        status(vSt, t, T.card, T.p1);

        // the step counter and its bar
        const cin = outCubic(seg(t, T.c0 - 0.1, T.c0 + 0.14));
        ch.style.opacity = cin.toFixed(3);
        cbarW.style.opacity = cin.toFixed(3);
        const q = inOutCubic(seg(t, T.c0, T.c1));
        const cn = String(Math.round(TOTAL * q));
        if (cn !== count) { n.textContent = cn; count = cn; }
        cbar.style.transform = `scaleX(${q.toFixed(4)})`;
        status(cSt, t, T.c0, T.c1);

        rows.forEach((row, i) => {
          const o = outCubic(seg(t, T.row[i], T.row[i] + ROW_IN));
          row.style.opacity = o.toFixed(3);
          row.style.transform = o >= 1 ? 'none' : `translateY(${((1 - o) * 8).toFixed(2)}px)`;
        });
        const f = outCubic(seg(t, T.foot, T.foot + FOOT_IN));
        ft.style.opacity = f.toFixed(3);
        ft.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 6).toFixed(2)}px)`;
      },
    };
  },
};
