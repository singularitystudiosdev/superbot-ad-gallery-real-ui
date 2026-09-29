// Ask 2's answer ("Look's good, let's do it"): superbot trades live inside the user's fomo account. The account
// opens in the thread, then zooms out of it to fill the frame while the balance swings from $6,000 down, back up,
// spikes, pulls back and settles at $8,579; the activity feed logs the three buys, one stop-loss and two take-profits.
// Two copies are built from the same markup: the one in the thread and the full-frame one in the scene root
// (outside the scaled hub); both are driven by the same clock, so the handoff between them is invisible.
import { lerp, seg, outCubic, inOutCubic, rand, streamCount } from '../../../lib.js';
import { equityChart, fmt } from './wk.js';

const START = 6000, END = 8579;
const N = 96;
// the balance's shape, as [x, $] keys: the buys fill, a semi big loss (-20%), the climb, the spike, the drop, and
// a close at END; smoothstep between keys plus jagged noise so it reads like a live memecoin wallet
const KEYS = [[0, 6000], [0.1, 6080], [0.27, 4790], [0.35, 5180], [0.52, 7350], [0.57, 7050], [0.66, 9920], [0.73, 8850], [0.8, 7480], [0.9, 8150], [1, END]];
const BAL = Array.from({ length: N }, (_, i) => {
  const x = i / (N - 1);
  const j = Math.max(0, KEYS.findIndex(([kx]) => kx >= x) - 1);
  const [x0, v0] = KEYS[j], [x1, v1] = KEYS[j + 1];
  const u = seg(x, x0, x1), e = u * u * (3 - 2 * u);
  const n = i === 0 || i === N - 1 ? 0 : (rand(i + 5) - 0.5) * 260;
  return +(lerp(v0, v1, e) + n).toFixed(2);
});

const FEED = [
  // proceeds add up to END: 1,700 + 3,680 + 3,199
  { at: 0.03, side: 'buy', tk: '$PAID', sub: 'Bought with 2,000 USDC', amt: '-$2,000' },
  { at: 0.07, side: 'buy', tk: '$STONK', sub: 'Bought with 2,000 USDC', amt: '-$2,000' },
  { at: 0.11, side: 'buy', tk: '$JEANPHIL', sub: 'Bought with 2,000 USDC', amt: '-$2,000' },
  { at: 0.26, side: 'sell loss', tk: '$STONK', sub: 'Stop loss hit, -15%', amt: '+$1,700' },
  { at: 0.66, side: 'sell', tk: '$PAID', sub: 'Take profit hit, +84%', amt: '+$3,680' },
  { at: 0.95, side: 'sell', tk: '$JEANPHIL', sub: 'Take profit hit, +60%', amt: '+$3,199' },
];
const SAY = 'Trading now, inside your fomo account.';
const ICON = { $PAID: 'paid.png', $STONK: 'stonk.png', $JEANPHIL: 'jeanphil.png' };
const ARROW = { buy: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12l7 7 7-7"/></svg>', sell: '<svg viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7"/></svg>' };
const verb = (side) => (side === 'buy' ? 'Bought' : 'Sold');

function times(r) {
  const T = { r, card: r + 0.25 };
  T.live = T.card + 0.45;
  T.zoom = T.live + 0.35;
  T.zoomEnd = T.zoom + 0.9;
  T.tradeEnd = T.live + 4.4; // long enough for every swing to read
  T.end = T.tradeEnd + 1.3;
  return T;
}

function walletHtml(x, chartHtml, cls) {
  return `<div class="ph-win ${cls}">
    <div class="ph-top"><img class="ph-av" src="${x.brand('fomo-mark.png')}" alt=""/>
      <div class="ph-acc"><b>sam</b><small>fomo · Solana</small></div>
      <em class="ph-live"><img src="${x.sbSrc}" alt=""/>superbot trading<i></i></em></div>
    <div class="ph-bal"><b class="ph-num">$6,000.00</b><div class="ph-chg"><span class="ph-d">+$0.00</span><span class="ph-p">+0.00%</span></div></div>
    <div class="ph-chart">${chartHtml}</div>
    <div class="ph-feed-h">Activity</div>
    <div class="ph-feed">${FEED.map((f) => `<div class="ph-row ${f.side}"><span class="ph-ic"><img src="${x.brand('tokens/' + ICON[f.tk])}" alt=""/><i>${ARROW[f.side.split(' ')[0]]}</i></span>
      <span class="ph-rt"><b>${verb(f.side)} ${f.tk}</b><small>${f.sub}</small></span><em class="ph-amt">${f.amt}</em></div>`).join('')}</div>
  </div>`;
}

function build(k, x) {
  const T = k.T;
  const mk = (cls) => {
    const chart = equityChart({ W: 476, H: 140, series: [{ v: BAL, cls: 'eq-s', tag: '+43%' }], lo: 4200, hi: 10600, ticks: [5000, 7500, 10000], R: 44, yfmt: (v) => `$${v / 1000}k` });
    const win = x.el(walletHtml(x, chart.html, cls));
    return { win, chart, svg: win.querySelector('svg.eq'), num: win.querySelector('.ph-num'), d: win.querySelector('.ph-d'), p: win.querySelector('.ph-p'), rows: [...win.querySelectorAll('.ph-row')], last: '' };
  };
  const inT = mk('ph-in');
  const big = mk('ph-big');
  x.root.appendChild(big.win);

  const sayEl = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
  const vis = sayEl.firstElementChild, hid = sayEl.lastElementChild;
  let shown = -1;
  const site = x.hub.closest('.sbsite');

  function paint(w, t) {
    const p = seg(t, T.live, T.tradeEnd);
    w.chart.render(w.svg, p, seg(t, T.tradeEnd - 0.1, T.tradeEnd + 0.5));
    const f = p * (N - 1), i = Math.min(N - 2, Math.floor(f));
    const v = p >= 1 ? END : lerp(BAL[i], BAL[i + 1], f - i);
    const s = `$${fmt(v, 2)}`;
    if (s !== w.last) {
      w.last = s;
      w.num.textContent = s;
      const d = v - START;
      w.d.textContent = `${d >= 0 ? '+' : '-'}$${fmt(Math.abs(d), 2)}`;
      w.p.textContent = `${d >= 0 ? '+' : '-'}${fmt(Math.abs(d / START) * 100, 2)}%`;
      w.win.classList.toggle('neg', d < 0);
    }
    w.rows.forEach((r, j) => {
      const a = T.live + FEED[j].at * (T.tradeEnd - T.live);
      const o = outCubic(seg(t, a, a + 0.35));
      r.style.opacity = o.toFixed(3);
      r.style.transform = o >= 1 ? 'none' : `translateY(${((1 - o) * 8).toFixed(2)}px)`;
      r.classList.toggle('flash', t >= a && t < a + 0.6);
    });
  }

  function render(t) {
    const n = streamCount(SAY, T.r + 0.05, 70, t);
    if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
    const ci = seg(t, T.card, T.card + 0.5), e = outCubic(ci);
    inT.win.style.opacity = e.toFixed(3);
    inT.win.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - e) * 16).toFixed(2)}px) scale(${lerp(0.975, 1, e).toFixed(4)})`;
    paint(inT, t);

    // the zoom: the full-frame copy starts exactly over the thread copy, then flies to the centre of the frame
    if (t < T.zoom) { big.win.style.opacity = '0'; site.style.opacity = ''; return; }
    paint(big, t);
    const b = x.box(inT.win);
    const W0 = big.win.offsetWidth, H0 = big.win.offsetHeight;
    const RW = x.root.offsetWidth, RH = x.root.offsetHeight;
    const fit = Math.min((RW * 0.9) / W0, (RH * 0.9) / H0);
    const z = inOutCubic(seg(t, T.zoom, T.zoomEnd));
    const s = lerp(b.w / W0, fit, z);
    const tx = lerp(b.x, (RW - W0 * fit) / 2, z), ty = lerp(b.y, (RH - H0 * fit) / 2, z);
    big.win.style.opacity = '1';
    big.win.style.transform = `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${s.toFixed(4)})`;
    site.style.opacity = lerp(1, 0.12, seg(t, T.zoom, T.zoomEnd)).toFixed(3);
  }

  return { nodes: [sayEl, inT.win], marks: [[T.r, sayEl], [T.card, inT.win]], render };
}

export default { times, build };
