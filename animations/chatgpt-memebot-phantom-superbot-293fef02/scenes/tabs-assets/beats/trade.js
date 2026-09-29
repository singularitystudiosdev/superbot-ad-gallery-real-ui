// Ask 2's answer ("Look's good, let's do it"): superbot trades live inside the user's fomo account, drawn as fomo's
// own portfolio screen (App Store shot "Track your portfolio in real time", fomo 1.94): profile band, balance with
// grey cents, "+$x 24h", the 24h/7d/30d/All switch, a bare green line with an end dot, Total cash with + and ...,
// Positions (n) with the Open/Closed toggle, the All/Tokens/Perps chips and the position rows. As in the app, a sold
// position leaves the Open list; after the last sell the toggle flips to Closed and lists the three realized trades.
// The account swings from $6,000 down to about $4,800, climbs, spikes past $9,000, drops, and closes at $8,579:
// the balance is cash plus every open position, and each position follows its own price path from buy to sell.
// Two copies are built from the same markup: the one in the thread and the full-frame one in the scene root
// (outside the scaled hub); both are driven by the same clock, so the handoff between them is invisible.
import { lerp, seg, outCubic, inOutCubic, rand, streamCount } from '../../../lib.js';
import { fmt } from './wk.js';

const START = 6000, STAKE = 2000;
const N = 96;
// each position: bought with STAKE at `buy`, sold at `sell` (fractions of the trading window); keys are the price
// multiple since the buy. Proceeds 3,680 + 1,700 + 3,199 close the account at exactly $8,579.
const POS = [
  { tk: 'PAID', name: 'Paid', icon: 'paid.png', qty: '1.4M PAID', buy: 0.03, sell: 0.66, why: 'Take profit',
    keys: [[0.03, 1], [0.27, 0.75], [0.52, 1.2], [0.6, 1.35], [0.66, 1.84]] },
  { tk: 'STONK', name: 'STONK', icon: 'stonk.png', qty: '9.9K STONK', buy: 0.07, sell: 0.26, why: 'Stop loss',
    keys: [[0.07, 1], [0.16, 1.04], [0.26, 0.85]] },
  { tk: 'JEANPHIL', name: 'Jean Phil', icon: 'jeanphil.png', qty: '3.7M JEANPHIL', buy: 0.11, sell: 0.95, why: 'Take profit',
    keys: [[0.11, 1], [0.27, 0.8], [0.52, 1.3], [0.66, 1.9], [0.8, 0.95], [0.9, 1.25], [0.95, 1.5995]] },
];
const smooth = (u) => u * u * (3 - 2 * u);
// price multiple of position i at x: smoothstep between keys, jagged noise that vanishes at the buy and the sell
function mult(pos, i, x) {
  const k = pos.keys, xx = Math.min(Math.max(x, pos.buy), pos.sell);
  const j = Math.max(0, Math.min(k.length - 2, k.findIndex(([kx]) => kx >= xx) - 1));
  const base = lerp(k[j][1], k[j + 1][1], smooth(seg(xx, k[j][0], k[j + 1][0])));
  const u = seg(xx, pos.buy, pos.sell), g = Math.round(x * (N - 1));
  return base * (1 + (rand(g * 7 + i * 131 + 3) - 0.5) * 0.07 * Math.sin(Math.PI * u));
}
function state(x) {
  let cash = START, open = 0, trades = 0;
  const rows = POS.map((p, i) => {
    if (x < p.buy) return { held: false };
    cash -= STAKE; trades++;
    const closed = x >= p.sell, m = mult(p, i, x), v = STAKE * m;
    if (closed) { cash += v; trades++; } else open += v;
    return { held: true, closed, v, pct: (m - 1) * 100 };
  });
  const openN = rows.filter((r) => r.held && !r.closed).length;
  return { cash, bal: cash + open, rows, openN, trades };
}
const BAL = Array.from({ length: N }, (_, i) => state(i / (N - 1)).bal);
const END = BAL[N - 1];
const LO = Math.min(...BAL), HI = Math.max(...BAL);

const SAY = 'Trading now, inside your fomo account.';
const FLIP = 0.965; // fraction of the window where the toggle flips to Closed (after the last sell at 0.95)
const CW = 430, CH = 150, CX = CW - 14; // chart box, full-bleed; the end dot stops 14px short of the edge, as in the app
const cy = (v) => 14 + (1 - (v - LO) / (HI - LO)) * (CH - 28);
const ICONS = {
  gift: '<path d="M4 11h16v9H4zM3 7h18v4H3zM12 7v13M12 7c-2-4-6-3-5 0M12 7c2-4 6-3 5 0"/>',
  hist: '<path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4M12 8v4l3 2"/>',
  share: '<path d="M12 3v12M7 8l5-5 5 5M5 13v7h14v-7"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  swap: '<path d="M4 8h13l-3-3M20 16H7l3 3"/>',
  cal: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
  pen: '<path d="M4 20l4-1 11-11-3-3L5 16z"/>',
};
const ico = (n) => `<svg class="fo-i" viewBox="0 0 24 24">${ICONS[n]}</svg>`;
const CHECK = '<svg viewBox="0 0 24 24"><path d="M6 12.5l4 4 8-9"/></svg>';

function times(r) {
  const T = { r, card: r + 0.25 };
  T.live = T.card + 0.45;
  T.zoom = T.live + 0.35;
  T.zoomEnd = T.zoom + 0.9;
  T.tradeEnd = T.live + 4.4; // long enough for every swing to read
  T.end = T.tradeEnd + 1.3;
  return T;
}

function screenHtml(x, cls) {
  return `<div class="fo-win ${cls}">
    <div class="fo-prof">
      <div class="fo-top"><span class="fo-av"><i>${ico('pen')}</i></span><span class="fo-tools">${ico('gift')}${ico('hist')}${ico('share')}${ico('gear')}</span></div>
      <div class="fo-name">sam <img class="fo-clan" src="${x.sbSrc}" alt=""/></div>
      <div class="fo-handle">@sam</div>
      <div class="fo-bio"><i class="fo-dot"></i>superbot is trading this account</div>
      <div class="fo-stats"><b>18</b> Following <b>342</b> Followers</div>
      <div class="fo-meta">${ico('clock')}<span>2h avg. hold</span>${ico('swap')}<span class="fo-trades">0 trades</span>${ico('cal')}<span>Joined Sep 2026</span></div>
    </div>
    <div class="fo-pf">
      <div class="fo-balrow"><div><div class="fo-bal"><span class="fo-int">$6,000</span><span class="fo-cents">.00</span></div>
        <div class="fo-pnl"><span class="fo-d">+$0.00</span> 24h</div></div>
        <div class="fo-tf"><span class="on">24h</span><span>7d</span><span>30d</span><span>All</span></div></div>
      <svg class="fo-chart" viewBox="0 0 ${CW} ${CH}"><path class="fo-line" d=""/><circle class="fo-head" r="5.5" cx="0" cy="0"/></svg>
      <div class="fo-cash"><span class="fo-cashic">$</span><div><small>Total cash</small><b class="fo-cashv">$6,000.00</b></div>
        <span class="fo-btn">+</span><span class="fo-btn">&middot;&middot;&middot;</span></div>
      <div class="fo-posh"><span>Positions <em class="fo-n">(0)</em></span><span class="fo-oc"><span class="on">Open <i></i></span><span>Closed</span></span></div>
      <div class="fo-chips"><span class="on">All</span><span>Tokens</span><span>Perps</span></div>
      <div class="fo-rows">${POS.map((p) => `<div class="fo-row"><span class="fo-ti"><img src="${x.brand('tokens/' + p.icon)}" alt=""/><i>${CHECK}</i></span>
        <span class="fo-rt"><b>${p.name}</b><small>${p.qty}</small></span><span class="fo-rv"><b>$2,000.00</b><small>&#9650; 0.00%</small></span></div>`).join('')}</div>
    </div>
  </div>`;
}

function build(k, x) {
  const T = k.T;
  const mk = (cls) => {
    const win = x.el(screenHtml(x, cls));
    const q = (s) => win.querySelector(s);
    return {
      win, int: q('.fo-int'), cents: q('.fo-cents'), d: q('.fo-d'), line: q('.fo-line'), head: q('.fo-head'),
      tabs: [...win.querySelectorAll('.fo-oc > span')],
      cashv: q('.fo-cashv'), n: q('.fo-n'), trades: q('.fo-trades'), last: '',
      rows: [...win.querySelectorAll('.fo-row')].map((r) => ({ r, v: r.querySelector('.fo-rv b'), pct: r.querySelector('.fo-rv small'), sub: r.querySelector('.fo-rt small') })),
    };
  };
  const inT = mk('fo-in');
  const big = mk('fo-big');
  x.root.appendChild(big.win);

  const sayEl = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
  const vis = sayEl.firstElementChild, hid = sayEl.lastElementChild;
  let shown = -1;
  const site = x.hub.closest('.sbsite');

  function paint(w, t) {
    const p = seg(t, T.live, T.tradeEnd);
    const s = state(p), v = p >= 1 ? END : s.bal;
    // the line: every sample up to p, plus an interpolated head
    const i = Math.min(N - 1, Math.floor(p * (N - 1)));
    const pts = BAL.slice(0, i + 1).map((b, j) => [(j / (N - 1)) * CX, cy(b)]);
    const hx = p * CX, hy = cy(v);
    pts.push([hx, hy]);
    w.line.setAttribute('d', 'M' + pts.map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join('L'));
    w.head.setAttribute('cx', hx.toFixed(1));
    w.head.setAttribute('cy', hy.toFixed(1));
    const key = fmt(v, 2);
    if (key !== w.last) {
      w.last = key;
      const [whole, c] = key.split('.');
      w.int.textContent = `$${whole}`;
      w.cents.textContent = `.${c}`;
      const d = v - START;
      w.d.textContent = `${d >= 0 ? '+' : '-'}$${fmt(Math.abs(d), 2)}`;
      w.win.classList.toggle('neg', d < 0);
      w.cashv.textContent = `$${fmt(p >= 1 ? END : s.cash, 2)}`;
      w.trades.textContent = `${s.trades} trade${s.trades === 1 ? '' : 's'}`;
      w.rows.forEach((row, j) => {
        const st = s.rows[j];
        if (!st.held) return;
        row.v.textContent = `$${fmt(st.v, 2)}`;
        row.pct.innerHTML = `${st.pct >= 0 ? '&#9650;' : '&#9660;'} ${fmt(Math.abs(st.pct), 2)}%`;
        row.pct.classList.toggle('dn', st.pct < 0);
        row.sub.textContent = st.closed ? `Sold · ${POS[j].why}` : POS[j].qty;
      });
    }
    // Open: a row lands on its buy and collapses out on its sell. Closed (after FLIP): all three, staggered in.
    const dur = T.tradeEnd - T.live, flip = T.live + FLIP * dur, closedView = t >= flip;
    w.tabs[0].classList.toggle('on', !closedView);
    w.tabs[1].classList.toggle('on', closedView);
    const n = closedView ? POS.length : s.openN;
    if (w.n.textContent !== `(${n})`) w.n.textContent = `(${n})`;
    w.rows.forEach((row, j) => {
      const a = closedView ? flip + 0.05 + j * 0.08 : T.live + POS[j].buy * dur;
      const o = outCubic(seg(t, a, a + 0.35));
      const out = closedView ? 0 : outCubic(seg(t, T.live + POS[j].sell * dur, T.live + POS[j].sell * dur + 0.35));
      const vis = o * (1 - out);
      row.r.style.opacity = vis.toFixed(3);
      row.r.style.height = `${(64 * (closedView ? 1 : o > 0 ? 1 - out : 0)).toFixed(2)}px`;
      row.r.style.transform = o >= 1 ? 'none' : `translateY(${((1 - o) * 10).toFixed(2)}px)`;
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
    const fit = Math.min((RW * 0.9) / W0, (RH * 0.94) / H0);
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
