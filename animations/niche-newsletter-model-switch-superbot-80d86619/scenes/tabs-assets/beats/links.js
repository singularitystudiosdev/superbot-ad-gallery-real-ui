// Links beat: Gemini reads the writer's saved links and her last 12 issues, and picks Sunday's stories. Its line
// streams and a card rises. First the week's reading list: a bookmark glyph tile, "Saved this week", "23 links, Sep 27
// to Oct 3", and a head sweeping a bar of 12 ticks, one per back issue (75 to 86), under "Checking your last 12
// issues" (spinner resolving to the check). Then "Reading N saved links and your last 12 issues" ticks up to 23 and
// the ranked stories resolve as rows (rank, a neutral link glyph tile, the story, where it came from, one small tag;
// the lead story is highlighted), and the footer lands: "Kept 5 stories, skipped 4 already covered".
// The grammar is the base's research card (header with spinner resolving to the check, a counter, staggered rows).
// Every link and story is made up for the spot. Pure function of t: every moving value is written from t, so ?t= and
// __AD.seek freeze any frame.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';
import { lc } from './lucide-icons.js?v=80d86619';

const SAY = 'Read your 23 saved links and your last 12 issues.';
export const SAVED = { title: 'Saved this week', meta: '23 links, Sep 27 to Oct 3' };
const TOTAL = 23;
const ISSUES = 12;                     // the back issues the head runs past (75 to 86)
const FIRST_ISSUE = 75;
// the ranked stories: [story, where it came from, tag, kind] (kind: lead | keep | skip)
export const STORIES = [
  ['Why gravel tires keep getting wider', '3 sources agree', 'Lead story', 'lead'],
  ['The 40 km climb most riders skip', 'local blog', 'Keep', 'keep'],
  ['Indoor trainers, the summer price drop', 'already in issue 85', 'Skip', 'skip'],
  ['Bar tape that survives a wet winter', 'reader question', 'Keep', 'keep'],
  ['New rules for the Sunday group ride', 'club post', 'Keep', 'keep'],
];
const DONE = 'Kept 5 stories, skipped 4 already covered';
// timing (seconds from the reply start, or from the card where noted), in the base's v3 pace
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const PLAY_AT = 0.12;                  // the card landing to the head starting
const PLAY = 0.6; /* deliberate */     // the head sweeping the 12 back issues
const COUNT_AT = 0.08;                 // the archive read to the link counter starting
const COUNT = 0.6; /* deliberate */    // the counter running up to 23 (its bar fills with it)
const ROW_AT = 0.2;                    // the counter starting to the first ranked row
const STAGGER = 0.12;                  // one row to the next
const ROW_IN = 0.24;                   // a row rising in
const FOOT_AT = 0.12;                  // the last row landing to the footer
const FOOT_IN = 0.24;                  // the footer rising in

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.p0 = T.card + PLAY_AT;
    T.p1 = T.p0 + PLAY;
    T.c0 = T.p1 + COUNT_AT;
    T.c1 = T.c0 + COUNT;
    T.row = STORIES.map((_, i) => T.c0 + ROW_AT + i * STAGGER);
    T.foot = Math.max(T.row[STORIES.length - 1] + FOOT_AT, T.c1);
    T.end = Math.max(T.foot + FOOT_IN, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="wv-card">
      <div class="wv-vid">
        <span class="wv-th">${lc('bookmark')}</span>
        <div class="wv-meta">
          <span class="wv-l0"><b class="wv-title">${x.esc(SAVED.title)}</b><span class="wv-sub">${x.esc(SAVED.meta)}</span></span>
          <span class="wv-hd"><span class="wv-st"><i class="wv-spin"></i>${x.OK}</span>Checking your last ${ISSUES} issues<span class="wv-tc">Issue ${FIRST_ISSUE}</span></span>
          <i class="wv-bar"><i class="wv-fill"></i>${Array.from({ length: ISSUES }, (_, i) => `<u style="left: ${(((i + 0.5) / ISSUES) * 100).toFixed(3)}%"></u>`).join('')}<i class="wv-head"></i></i>
        </div>
      </div>
      <div class="wv-ch"><span class="wv-st"><i class="wv-spin"></i>${x.OK}</span><b>Reading <span class="wv-n">0</span> saved links and your last ${ISSUES} issues</b></div>
      <i class="wv-cbar"><i></i></i>
      <div class="wv-list">${STORIES.map(([story, from, tag, kind], i) => `<div class="wv-row wv-${kind}"><span class="wv-rk">${i + 1}</span><span class="wv-av">${lc('link')}</span>
        <div class="wv-main"><span class="wv-l1"><b>${x.esc(story)}</b><span class="wv-tag">${x.esc(tag)}</span></span><span class="wv-tx">${x.esc(from)}</span></div></div>`).join('')}</div>
      <div class="wv-ft">${x.OK}<span>${x.esc(DONE)}</span></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const [vSt, cSt] = [...card.querySelectorAll('.wv-st')].map((n) => ({ spin: n.querySelector('.wv-spin'), ok: n.querySelector('.qc-ok') }));
    const fill = $('.wv-fill'), head = $('.wv-head'), tc = $('.wv-tc'), ticks = [...card.querySelectorAll('.wv-bar u')];
    const ch = $('.wv-ch'), cbarW = $('.wv-cbar'), cbar = $('.wv-cbar i'), n = $('.wv-n'), ft = $('.wv-ft');
    const rows = [...card.querySelectorAll('.wv-row')];
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, count = '', issue = '';

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

        // the head: a fast run through the 12 back issues, easing in at the end; issues it has passed light up
        const p = inOutCubic(seg(t, T.p0, T.p1));
        fill.style.transform = `scaleX(${p.toFixed(4)})`;
        head.style.left = `${(p * 100).toFixed(3)}%`;
        ticks.forEach((u, i) => u.classList.toggle('on', p * ISSUES >= i + 0.5));
        const is = `Issue ${FIRST_ISSUE + Math.min(ISSUES - 1, Math.floor(p * ISSUES))}`;
        if (is !== issue) { tc.textContent = is; issue = is; }
        status(vSt, t, T.card, T.p1);

        // the link counter and its bar
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
