// Reads beat: Gemini reads 36 half marathon plans and turns what the best ones agree on into the rules of this
// runner's plan. Its line streams, a card rises ("Reading 36 half marathon plans", a "k of 36 read" counter running
// up to 36 of 36), and inside it excerpts from the plans being read scroll fast: each the quoted guidance plus a data
// tag of the plan it came from (its length and runs a week, and a sparkline of its weekly miles, drawn here). Then the
// excerpts collapse under a three column consensus table: the rule, how many of the 36 plans agree (count and bar),
// and what it sets in your plan (RESEARCH.rules[i].sets, with a 12 week strip drawn from this plan's own numbers).
// The closing line ticks in under the table: "5 rules set for your plan".
// Pure function of t: every moving value is written from t, so ?t= and __AD.seek freeze any frame. Row heights are
// constants (ROW), so the scroll is exact at every column width.
import { lerp, seg, outCubic, inOutCubic, streamCount, rand } from '../../../lib.js';
import { RESEARCH, PLAN, WEEKS, PEAK, LONG_PEAK, RACE_MI, CUTBACK, TAPER } from './plan-data.js?v=69889d8f';

const SAY = 'Reading 36 half marathon plans from coaches and clubs to set the rules for yours.';
const TOTAL = RESEARCH.total;
const LABEL = `Reading ${TOTAL} half marathon plans`;
const RULES = RESEARCH.rules;
const N = PLAN.length; // 12 weeks
// what the plans say (short, plain, no names); the numbers this plan carries come from plan-data
const SAID = [
  `Build the long run to ${LONG_PEAK} miles, not ${RACE_MI}`,
  'Run most miles at a pace you can talk at',
  `Every ${CUTBACK[0]}th week, cut back`,
  `Taper the last ${TAPER.length} weeks`,
  'One hard workout a week is plenty for a first half',
  'Strides after easy runs keep your legs quick',
  'Rest the day after a hard session',
  "Don't race your long runs",
  'Easy days easy, hard days hard',
  'Keep the long run slow and steady',
  'Practice race pace in the last month',
  'Rest days are training days',
  'Cut back when your legs feel heavy',
  'Race week: run less, stay sharp',
  'Long run on the weekend, easy pace',
  'Sleep is part of the plan',
];
const FOOT = `${RULES.length} rules set for your plan`;
// timing (seconds from the reply start, or from the card where noted), in the source's v3 pace
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const SCROLL_AT = 0.08;                // the card landing to the scroll starting
const SCROLL = 0.72; /* deliberate */   // the excerpts scrolling past (the counter runs with it)
const COL_AT = 0.04;                   // the scroll done to the collapse starting
const COL = 0.3;                       // the excerpts collapse away under the table
const LIST_AT = 0.12;                  // the collapse start to the table's header
const STAGGER = 0.07;                  // one table row to the next
const ROW_IN = 0.22;                   // a table row rising in (its count runs up, its bar and strip grow with it)
const FOOT_AT = 0.04;                  // the last row in to the closing line
const FOOT_IN = 0.24;
const SHOWN = 5;                       // excerpts visible in the window
const ROW = 34;                        // one excerpt row's height, px (matches .rd-row in reads.css)

// zone colours of the look plan (dark UI): easy neutral, tempo half orange, intervals orange, race the text colour
const NEUTRAL = '#45454d', TEXT = '#ececec';
const ZC = { easy: NEUTRAL, tempo: 'color-mix(in srgb, #fc5200 55%, transparent)', int: '#fc5200', race: TEXT };
const zoneOf = (z) => (z === 'tempo' || z === 'int' || z === 'race' ? z : 'easy');

// the plan an excerpt came from: generic (no names), its length, runs a week and weekly miles, seeded per row
function source(i) {
  const wk = [12, 10, 16, 14, 12, 18, 14, 16, 10, 12, 14, 16, 12, 18, 10, 14][i % 16];
  const runs = [4, 3, 5, 4, 3, 5, 4, 3, 4, 5, 3, 4, 5, 3, 4, 4][i % 16];
  const base = 8 + rand(i * 3.7 + 7) * 10, top = base * (1.4 + rand(i * 5.3 + 19) * 0.7);
  const cut = [4, 3, 0, 4, 3, 4, 0, 3][i % 8];                 // a cutback every 3rd or 4th week, or none
  const taper = 1 + (i % 3 === 0 ? 2 : 1);                     // a 2 or 3 week taper
  const bend = 0.6 + rand(i * 2.9 + 31) * 1.2;                 // how early the build comes
  const miles = Array.from({ length: wk }, (_, w) => {
    const left = wk - 1 - w;
    if (left < taper) return top * (0.5 + 0.25 * (left / taper));
    const m = lerp(base, top, Math.pow(w / (wk - 1 - taper), bend)) * (0.94 + rand(i * 11 + w) * 0.12);
    return cut && (w + 1) % cut === 0 ? m * 0.8 : m;
  });
  return { wk, runs, miles };
}
// a sparkline of a plan's weekly miles, 56 x 14
function spark(miles) {
  const W = 56, H = 14, mx = Math.max(...miles), mn = Math.min(...miles) * 0.8;
  const pts = miles.map((m, w) => `${(1 + (w / (miles.length - 1)) * (W - 2)).toFixed(1)},${(H - 1.5 - ((m - mn) / (mx - mn)) * (H - 3)).toFixed(1)}`);
  return `<svg class="rd-spk" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><polyline points="${pts.join(' ')}"/></svg>`;
}

// 12 week strips, one per rule, drawn from this plan: bar w = week w+1
const BW = 3, BG = 1.5, SW = N * BW + (N - 1) * BG, SH = 14;
const bar = (w, y0, h, fill) => `<rect x="${(w * (BW + BG)).toFixed(1)}" y="${(SH - y0 - h).toFixed(2)}" width="${BW}" height="${h.toFixed(2)}" fill="${fill}"/>`;
const strip = (rects) => `<svg class="rd-gl" viewBox="0 0 ${SW} ${SH}" width="${SW}" height="${SH}">${rects.join('')}</svg>`;
const sumZones = (week) => {
  const s = { easy: 0, tempo: 0, int: 0, race: 0 };
  week.forEach((r) => r.segs.forEach((g) => { s[zoneOf(g.z)] += g.mi; }));
  return s;
};
// weekly miles, the highlighted weeks in the text colour
const volume = (lit) => strip(WEEKS.map((m, w) => bar(w, 0, (m / PEAK) * SH, lit.includes(w + 1) ? TEXT : NEUTRAL)));
const GLYPHS = [
  // 1. mostly easy: each week's miles stacked by zone, easy at the bottom
  strip(PLAN.flatMap((week, w) => {
    const s = sumZones(week); let y = 0;
    return ['easy', 'tempo', 'int', 'race'].filter((z) => s[z] > 0).map((z) => { const h = (s[z] / PEAK) * SH; const r = bar(w, y, h, ZC[z]); y += h; return r; });
  })),
  // 2. the long run each week (race day is the 13.1), its peak lit
  strip(PLAN.map((week, w) => { const m = week[3].miles; return bar(w, 0, (m / RACE_MI) * SH, m === LONG_PEAK && week[3].name === 'Long Run' ? TEXT : NEUTRAL); })),
  // 3. weekly miles, the cutback weeks lit
  volume(CUTBACK),
  // 4. weekly miles, the taper weeks lit
  volume(TAPER),
  // 5. the one hard day: each week's Thursday in its zone colour
  strip(PLAN.map((week, w) => { const s = sumZones([week[1]]); const z = s.race ? 'race' : s.int ? 'int' : 'tempo'; return bar(w, 0, SH, ZC[z]); })),
];

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.s0 = T.card + SCROLL_AT;
    T.s1 = T.s0 + SCROLL;
    T.col = T.s1 + COL_AT;
    T.title = T.col + LIST_AT;
    T.rows = RULES.map((_, i) => T.title + 0.08 + i * STAGGER);
    T.foot = T.rows[RULES.length - 1] + ROW_IN + FOOT_AT;
    // the beat's last visible change: the closing line settled, or the reply line's last character
    T.end = Math.max(T.foot + FOOT_IN, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const excerpts = SAID.map((q, i) => {
      const s = source(i);
      return `<div class="rd-row"><span class="rd-qt">“${x.esc(q)}”</span><span class="rd-src">${spark(s.miles)}<span class="rd-tag">${s.wk} wk, ${s.runs} runs</span></span></div>`;
    }).join('');
    const table = RULES.map((o, i) => `<div class="rd-q">
        <span class="rd-rule">${x.esc(o.rule)}</span>
        <span class="rd-agree"><i class="rd-trk"><i class="rd-bar" style="--w: ${(o.plans / TOTAL).toFixed(4)}"></i></i><b class="rd-ct"><b class="rd-n0">0</b> of ${TOTAL}</b></span>
        <span class="rd-sets">${GLYPHS[i]}<span>${x.esc(o.sets)}</span></span>
      </div>`).join('');
    const card = x.el(`<div class="rd-card">
      <div class="rd-hd"><span class="rd-st"><i class="rd-spin"></i>${x.OK}</span><span class="rd-lb">${x.esc(LABEL)}</span><span class="rd-cnt"><b class="rd-n">0</b> of ${TOTAL} read</span></div>
      <div class="rd-vp">
        <div class="rd-list">${excerpts}</div>
        <div class="rd-top">
          <div class="rd-th"><span>What the best plans agree on</span><span>Of ${TOTAL} plans</span><span>In your plan</span></div>
          ${table}
        </div>
      </div>
      <div class="rd-ft">${x.OK}<span>${x.esc(FOOT)}</span></div>
    </div>`);
    const list = card.querySelector('.rd-list'), n = card.querySelector('.rd-n');
    const top = card.querySelector('.rd-top'), th = card.querySelector('.rd-th');
    const rows = [...card.querySelectorAll('.rd-q')].map((q, i) => ({ q, ct: q.querySelector('.rd-n0'), bar: q.querySelector('.rd-bar'),
      gl: q.querySelector('.rd-gl'), n: RULES[i].plans, shown: '' }));
    const ft = card.querySelector('.rd-ft');
    const spin = card.querySelector('.rd-spin'), ok = card.querySelector('.rd-st .qc-ok');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const span = (SAID.length - SHOWN) * ROW;
    let shown = -1, count = '';

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card], [T.foot, ft]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // the scroll: oldest to newest, fast through the middle, the counter running with it
        const p = seg(t, T.s0, T.s1), e = inOutCubic(p);
        // the collapse: the excerpts squeeze up and fade under the table
        const c = inOutCubic(seg(t, T.col, T.col + COL));
        list.style.transform = `translateY(${(-span * e - c * 18).toFixed(2)}px) scale(${lerp(1, 0.94, c).toFixed(4)})`;
        list.style.opacity = (1 - c).toFixed(3);
        const cnt = String(Math.round(TOTAL * outCubic(p)));
        if (cnt !== count) { n.textContent = cnt; count = cnt; }

        // done reading: the spinner resolves to the check as the counter lands
        const d = outCubic(seg(t, T.s1, T.s1 + 0.2));
        spin.style.opacity = (1 - seg(t, T.s1 - 0.08, T.s1 + 0.06)).toFixed(3);
        spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        ok.style.opacity = d.toFixed(3);
        ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;

        // the table: its sheet fades up over the collapsing excerpts, the header, then the rows in rank order
        top.style.opacity = outCubic(seg(t, T.col + 0.05, T.col + COL)).toFixed(3);
        const ti = outCubic(seg(t, T.title, T.title + 0.22));
        th.style.opacity = ti.toFixed(3);
        th.style.transform = ti >= 1 ? 'none' : `translateY(${((1 - ti) * 6).toFixed(2)}px)`;
        rows.forEach((o, i) => {
          const q = outCubic(seg(t, T.rows[i], T.rows[i] + ROW_IN));
          o.q.style.opacity = q.toFixed(3);
          o.q.style.transform = q >= 1 ? 'none' : `translateY(${((1 - q) * 10).toFixed(2)}px)`;
          const v = String(Math.round(o.n * q));
          if (v !== o.shown) { o.ct.textContent = v; o.shown = v; }
          o.bar.style.transform = `scaleX(${(q * (o.n / TOTAL)).toFixed(4)})`;
          o.gl.style.transform = q >= 1 ? 'none' : `scaleY(${q.toFixed(4)})`;
        });
        const f = outCubic(seg(t, T.foot, T.foot + FOOT_IN));
        ft.style.opacity = f.toFixed(3);
        ft.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 6).toFixed(2)}px)`;
      },
    };
  },
};
