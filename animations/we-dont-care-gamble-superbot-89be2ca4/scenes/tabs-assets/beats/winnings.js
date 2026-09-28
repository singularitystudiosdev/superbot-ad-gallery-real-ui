// The one beat of this spot: sam asks for a website of all their winnings, superbot reads the bets, totals
// them and ships sams-winnings.site — then the preview grows out of the chat card to fill the frame and tours
// itself. Every value is written from the scene's lt, so ?t=<s> reproduces any frame exactly (the "Biggest
// hits" amounts, the total and the cumulative curve are constants, not random).
import { lerp, seg, outCubic, outQuint, inOutCubic, boxIn } from '../../../lib.js';
import { workBeat, stdTimes, equityChart, fmt } from './wk.js';

const TOTAL = 48210; // the hero total the counter climbs to
const SITE = 'sams-winnings.site';

// biggest hits, biggest first: what the site's top-payouts list shows
const HITS = [
  ['6-leg parlay', 12400, 'Nov 2'],
  ['Poker, final table', 4900, 'Feb 27'],
  ['Blackjack, high limit room', 3150, 'Aug 14'],
  ['Slots jackpot', 2600, 'Jun 9'],
  ['Roulette, 17 black', 1750, 'Mar 3'],
];

const money = (n) => '$' + fmt(Math.round(n));
const plus = (n) => '+' + money(n);

// cumulative winnings, one point per week: strictly rising (wins only add up), with two big weeks. Scaled so
// the last point is exactly TOTAL.
const CUM = (() => {
  const raw = [0];
  let a = 0;
  for (let i = 0; i < 63; i++) {
    const p = i / 62;
    a += (0.5 + 1.1 * p) * (i % 9 === 4 ? 2.4 : 1) * (i === 20 ? 2.3 : i === 46 ? 2.0 : 1);
    raw.push(a);
  }
  const top = raw[raw.length - 1];
  return raw.map((v) => Math.round((v / top) * TOTAL));
})();

const STEPS = [
  'Read <b>1,284 bets</b> from your sportsbook accounts',
  'Matched <b>212 casino payouts</b> in Gmail receipts',
  'Totaled every win, biggest hits first',
  `Built and deployed <code>${SITE}</code>`,
];

// the beat's clock: stdTimes for the answer + steps + body, then the grow-out and the tour, then a hold
export function times(r) {
  const T = stdTimes(r, STEPS.length, 0.5, 0.2);
  T.build = T.body;            // the site assembles inside the card
  T.buildEnd = T.body + 1.85;
  T.done = T.buildEnd;         // the header flips to Done when the site is up
  T.grow = T.buildEnd + 0.32;  // the preview grows out of the thread to fill the frame
  T.growEnd = T.grow + 0.85;
  T.tour = T.growEnd + 0.22;   // the page tours its own sections in two smooth moves
  T.tourEnd = T.tour + 2.95;
  T.end = T.tourEnd + 0.75;    // hold on the best frame
  return T;
}

function chart(H, accent) {
  const c = equityChart({
    W: 476, H, lo: 0, hi: 50000, L: 46, R: 64, accent,
    ticks: [0, 10000, 20000, 30000, 40000, 50000],
    yfmt: (v) => (v === 0 ? '$0' : `$${v / 1000}k`),
    xl: [[0, 'Jan'], [20, 'Apr'], [40, 'Jul'], [62, 'Sep']],
    series: [{ v: CUM, cls: 'eq-gold', tag: plus(TOTAL) }],
  });
  return c;
}

function winHtml(mode, chartHtml) {
  return `<div class="wn-win wn-${mode}">
  <div class="wn-bar"><span class="wn-dots"><i></i><i></i><i></i></span>
    <span class="wn-url"><svg class="wn-lk" viewBox="0 0 24 24"><rect x="4" y="10" width="16" height="11" rx="2.5"/><path d="M8 10V7.5a4 4 0 0 1 8 0V10"/></svg>${SITE}</span></div>
  <div class="wn-view"><div class="wn-page">
    <div class="wn-col">
      <header class="wn-hero">
        <small>LIFETIME WINS</small>
        <h1>All my winnings</h1>
        <div class="wn-tot"><span class="wn-cur">$</span><b class="wn-num">0</b></div>
        <p class="wn-sub">1,284 bets &middot; 212 payouts &middot; every book, every table</p>
      </header>
      <section class="wn-card2">
        <div class="wn-chhd"><small>CUMULATIVE WINS</small><span class="wn-lg"><i></i>All winnings</span></div>
        ${chartHtml}
      </section>
      <section class="wn-hitsec">
        <div class="wn-sech"><small>TOP PAYOUTS</small><h2>Biggest hits</h2></div>
        <ul class="wn-list">${HITS.map(([what, amt, when]) => `<li class="wn-row"><span class="wn-what">${what}</span><span class="wn-amt">${plus(amt)}</span><span class="wn-when">${when}</span></li>`).join('')}</ul>
      </section>
      <section class="wn-night">
        <small>BIGGEST NIGHT</small>
        <div class="wn-nh"><b>${plus(6180)}</b><span>One Saturday, four tables</span></div>
        <p>Six bets across three sports, all of them winners, and a number that came up twice.</p>
      </section>
      <footer class="wn-foot">${SITE}</footer>
    </div>
  </div></div>
</div>`;
}

export function build(k, x) {
  const T = k.T;
  const cardChart = chart(220, '#ffd23f');
  const revChart = chart(220, '#ffd23f');
  const wb = workBeat(x, k, {
    say: `On it. Pulling every win you've ever had, then building the site around them.`,
    title: 'Winnings site',
    sub: SITE,
    steps: STEPS,
    body: winHtml('card', cardChart.html),
  });
  // the same site markup a second time, as the overlay that grows out of the thread to fill the frame
  const revWin = x.el(winHtml('rev', revChart.html));
  x.root.appendChild(revWin);

  const view = (root, c) => ({
    win: root, view: root.querySelector('.wn-view'), page: root.querySelector('.wn-page'),
    num: root.querySelector('.wn-num'), rows: [...root.querySelectorAll('.wn-row')],
    svg: root.querySelector('svg.eq'), chart: c,
  });
  const cv = view(wb.card.querySelector('.wn-win'), cardChart);
  const rv = view(revWin, revChart);

  let box = null, FW = 0, pageH = 0, cardScale = 0;
  function measure() {
    const w = (window.AR && window.AR.w) || 1920;
    if (w === FW) return;
    FW = w;
    [cv.page, rv.page].forEach((p) => { p.style.width = FW + 'px'; });
    rv.page.style.transform = 'none';
    pageH = rv.page.scrollHeight;
    const vw = cv.view.clientWidth || 0;
    cardScale = vw ? vw / FW : 0;
    cv.page.style.transform = `scale(${cardScale})`;
  }

  function paint(w, t) {
    const n = lerp(0, TOTAL, outCubic(seg(t, T.build + 0.1, T.build + 1.3)));
    const s = money(n);
    if (w.num.textContent !== s) w.num.textContent = s;
    const p = outQuint(seg(t, T.build + 0.2, T.buildEnd - 0.05));
    w.chart.render(w.svg, p, seg(t, T.buildEnd - 0.3, T.buildEnd + 0.2));
    w.rows.forEach((r, i) => {
      const o = outCubic(seg(t, T.build + 0.5 + i * 0.15, T.build + 0.84 + i * 0.15));
      r.style.opacity = o.toFixed(3);
      r.style.transform = o >= 1 ? 'none' : `translateY(${((1 - o) * 9).toFixed(2)}px)`;
    });
  }

  function renderSite(t) {
    if (!FW) measure();
    paint(cv, t);
    paint(rv, t);
    // the grow: from the card's own box in the thread to the whole frame, on one eased parameter
    const grow = inOutCubic(seg(t, T.grow, T.growEnd));
    if (t >= T.grow && !box) { box = boxIn(cv.win, x.root); }
    const FW2 = FW, FH = 1080;
    const b = box || { x: 0, y: 0, w: FW2, h: FH };
    const wpx = lerp(b.w, FW2, grow), hpx = lerp(b.h, FH, grow);
    // the overlay stays hidden until the grow's first frame: before the box is sampled it would otherwise
    // paint itself at the full frame for a tenth of a second
    revWin.style.opacity = t >= T.grow ? '1' : '0';
    revWin.style.left = lerp(b.x, 0, grow).toFixed(2) + 'px';
    revWin.style.top = lerp(b.y, 0, grow).toFixed(2) + 'px';
    revWin.style.width = wpx.toFixed(2) + 'px';
    revWin.style.height = hpx.toFixed(2) + 'px';
    revWin.style.borderRadius = lerp(14, 0, grow).toFixed(2) + 'px';
    revWin.style.boxShadow = `0 ${lerp(24, 0, grow).toFixed(0)}px ${lerp(60, 0, grow).toFixed(0)}px rgba(0,0,0,${(0.6 * (1 - grow)).toFixed(2)})`;
    // the page inside is always laid out at the frame's full width; the window's own scale is w/FW, so the
    // site appears in miniature in the chat and 1:1 once the window is the frame
    const s = wpx / FW2;
    const viewH = Math.max(1, hpx - 30);
    const room = Math.max(0, pageH * s - viewH);
    // two moves with a rest between them: hero+chart first, then biggest hits and the biggest night
    const tour = 0.46 * inOutCubic(seg(t, T.tour, T.tour + 0.95)) + 0.54 * inOutCubic(seg(t, T.tour + 1.35, T.tourEnd));
    const scrolled = room * tour;
    rv.page.style.transform = `scale(${s.toFixed(5)}) translateY(${(-scrolled / s).toFixed(2)}px)`;
    // the thread itself steps out of the way as the window takes the frame
    x.hub.closest('.sbsite').style.opacity = (1 - seg(t, T.grow + 0.15, T.growEnd)).toFixed(3);
  }

  return {
    nodes: [wb.sayEl, wb.card],
    // the card grows while it is answered, so the thread has to be re-folded after the body has settled and
    // again when the steps are done; otherwise the preview's lower half stays under the composer
    marks: [...wb.marks, [T.body + 0.45, wb.card], [T.done, wb.card]],
    render(t) { wb.render(t); renderSite(t); },
  };
}

export default { times, build };