// "make me a memecoin trading bot", after superbot has connected Axiom. One answer, five movements:
// 1. Backtest: 4 entry strategies over 90 days of Solana memecoin launches; the winner (Volume spike) is drawn
//    against simply holding SOL. Volume spike +38.6% vs SOL +7.4%, 61% win rate, max drawdown -8.8%.
// 2. DeepSeek connects (the same routing chip as Axiom; the composer chip swaps with it) to score tickers.
// 3. Scan: every live Axiom ticker is scraped (counter to 2,418), the list of real Solana memecoins (./tokens.js,
//    real icons, market caps and volumes) rolls through a lens while superbot waits, then eases to a stop on
//    $POPCAT and the lens stamps HIT.
// 4. "I found a good buy ($POPCAT), executing": an Axiom token page with POPCAT's real stats (market-cap candles,
//    instant-trade panel, Bought / Sold / Holding / PnL row). The 9 SOL buy fills, candles stream up, B and S land.
// 5. "I'm out, we are up $174." 9 SOL in ($1,051.02), $1,225.02 out, PnL +$174.00. The candles are illustration.
import { seg, outCubic, outBack, lerp, clamp, streamCount } from '../../../lib.js';
import { stdTimes, workBeat, counter, equityChart, fmt } from './wk.js?v=2';
import { TOKENS, HIT, SOL_USD } from './tokens.js?v=3';

const pct = (v, d = 1) => `${v > 0 ? '+' : v < 0 ? '-' : ''}${Math.abs(v).toFixed(d)}%`;
const STRAT = [0,-0.16,0.19,1.29,1.7,2.85,3.89,5.15,5.63,6.69,7.72,9.16,9.21,10.65,11.62,13.04,13.53,14.82,13.36,12.36,12.25,11.78,10.15,9.39,8.39,8.23,7.12,6.54,5.7,4.67,5.37,6.03,7.17,8.82,10.39,11.58,12.53,14.24,15.55,16.64,17.3,18.76,19.02,19.24,19.58,21.51,22.8,23.79,24.23,25.96,27.69,29.21,29.42,29.75,31.02,32.5,33.89,35.61,36.46,36.86,37.06,38.36,38.6];
const SOL = [0,0.52,0.38,0.53,0.9,1.07,1.32,1.2,1.53,1.23,1.33,1.75,1.88,2.18,2.38,2.9,2.86,2.83,2.77,2.71,2.88,3.37,3.28,3.42,3.25,2.96,2.94,3.46,3.27,3.2,3.25,3.41,3.28,3.37,3.62,3.75,4.06,4.09,3.98,3.97,3.99,4.47,4.9,4.94,4.67,4.54,4.33,4.54,5.06,5.55,6.06,5.98,5.86,5.52,5.39,5.51,5.38,5.26,5.75,5.86,6.38,6.9,7.4];
const XL = [[2, 'Jul 1'], [24, 'Aug 3'], [45, 'Sep 1'], [62, 'Sep 27']];

const KPI = [
  { l: 'Volume spike', v: 38.6, f: (v) => pct(v), c: 'up' },
  { l: 'Hold SOL', v: 7.4, f: (v) => pct(v), c: '' },
  { l: 'Win rate', v: 61, f: (v) => `${Math.round(v)}%`, c: '' },
  { l: 'Max drawdown', v: -8.8, f: (v) => pct(v), c: 'dn' },
];

// ---- the scan: real Solana memecoins, $POPCAT near the end; the lens is the list's middle row. Only the
// DeepSeek score column is the ad's own.
let seed = 11;
const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const HIT_I = TOKENS.findIndex((q) => q.s === HIT.s);
const ROWS = TOKENS.map((q, i) => ({ ...q, hit: i === HIT_I, sc: i === HIT_I ? 96 : Math.round(8 + rnd() * 58) }));
const RH = 26, LENS = 2; // row height (px) and the lens row inside the 5-row window
const SCROLL_TO = (HIT_I - LENS) * RH;
// constant roll while waiting, then a slot-machine ease onto the hit (speeds match at the seam)
const roll = (p) => (p <= 0.7 ? 0.8 * (p / 0.7) : 0.8 + 0.2 * (1 - (1 - (p - 0.7) / 0.3) ** 2));

// ---- the trade: 1-minute market-cap candles (in $M). Entry at the close of candle ENTRY, exit at the last one.
// The shape is drawn on a unit path ending at 1.24 and scaled onto POPCAT's real entry market cap.
const SOL_IN = 9, BOUGHT = SOL_IN * SOL_USD, SOLD = BOUGHT + 174;
const K = HIT.mc / 1.24;
const ENTRY_MC = HIT.mc, EXIT_MC = ENTRY_MC * (SOLD / BOUGHT);
const HIST = [1.13, 1.12, 1.14, 1.16, 1.15, 1.13, 1.14, 1.17, 1.16, 1.18, 1.17, 1.15, 1.16, 1.19, 1.18, 1.2, 1.19, 1.17, 1.18, 1.21, 1.2, 1.19, 1.22, 1.21, 1.23, 1.22, 1.24].map((v) => v * K);
const RUN = [...[1.262, 1.281, 1.272, 1.301, 1.324, 1.316, 1.343, 1.338, 1.361, 1.392, 1.381, 1.405, 1.398, 1.421, 1.433].map((v) => v * K), EXIT_MC];
const CLOSES = [...HIST, ...RUN];
const ENTRY = HIST.length - 1, N = CLOSES.length;
const CANDLES = CLOSES.map((c, i) => {
  const o = i ? CLOSES[i - 1] : c - 0.006 * K;
  const w = (0.004 + rnd() * 0.009) * K;
  return { o, c, h: Math.max(o, c) + w * rnd(), l: Math.min(o, c) - w * rnd() };
});
// Axiom's chart pane at card scale: candles over a volume strip over a time axis, price axis on the right.
// Candle i is the minute 02:28 + i UTC, so the entry candle closes at 02:54, the minute the stats were pulled.
const CW = 336, CH = 176, PL = 2, PR = 34, PT = 6, VB = 22, TA = 11, LO = 1.08 * K, HI = 1.5 * K;
const PY = CH - VB - TA - 4; // bottom of the price area
const SLOT = (CW - PL - PR) / N;
const cx = (i) => PL + SLOT * (i + 0.5);
const cy = (v) => PT + ((HI - v) / (HI - LO)) * (PY - PT);
const VOL = CANDLES.map((c, i) => (i > ENTRY ? 0.45 + rnd() * 0.55 : 0.12 + rnd() * 0.4) * (c.c >= c.o ? 1 : 0.8));
const TIMES = [[2, '02:30'], [17, '02:45'], [32, '03:00']];
const mcTxt = (v) => `$${v.toFixed(2)}M`;
const pxTxt = (v) => `$${(v / HIT.supplyM).toFixed(5)}`;
const usd = (v) => `$${fmt(v, 0)}`;
const ohlc = (c, close) => {
  const d = close - c.o;
  return `<i>O</i>${c.o.toFixed(2)}M <i>H</i>${Math.max(c.h, close).toFixed(2)}M <i>L</i>${c.l.toFixed(2)}M <i>C</i>${close.toFixed(2)}M ${d >= 0 ? '+' : ''}${(d * 1000).toFixed(0)}K (${pct((d / c.o) * 100, 2)})`;
};
// UI furniture drawn as Axiom draws it (outline glyphs), not brand art
const ICON = {
  copy: '<svg viewBox="0 0 16 16"><rect x="5" y="5" width="8" height="8" rx="1.5"/><path d="M3 10.5V4a1 1 0 0 1 1-1h6.5"/></svg>',
  x: '<svg viewBox="0 0 16 16"><path d="M3.5 3.5l9 9M12.5 3.5l-9 9"/></svg>',
  web: '<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="5.5"/><path d="M2.5 8h11M8 2.5c2 2 2 9 0 11M8 2.5c-2 2-2 9 0 11"/></svg>',
  tg: '<svg viewBox="0 0 16 16"><path d="M13.5 3L2.5 7.5l4 1.5 1.5 4 2-2.5 3 2z"/></svg>',
  find: '<svg viewBox="0 0 16 16"><circle cx="7" cy="7" r="4"/><path d="M10 10l3.5 3.5"/></svg>',
  star: '<svg viewBox="0 0 16 16"><path d="M8 2.5l1.7 3.5 3.8.5-2.8 2.6.7 3.8L8 11.1l-3.4 1.8.7-3.8L2.5 6.5l3.8-.5z"/></svg>',
  bolt: '<svg viewBox="0 0 16 16"><path d="M9 2L4 9h4l-1 5 5-7H8z"/></svg>',
  gas: '<svg viewBox="0 0 16 16"><rect x="3" y="3" width="6" height="10" rx="1"/><path d="M9 6h2l1.5 1.5V12a1 1 0 0 1-2 0V9H9"/></svg>',
  tip: '<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="5"/><path d="M8 5v6M6 6.8h3a1.2 1.2 0 0 1 0 2.4H7a1.2 1.2 0 0 0 0 2.4h3"/></svg>',
  ind: '<svg viewBox="0 0 16 16"><path d="M2 12l4-5 3 3 5-6"/></svg>',
};

// a streamed line of superbot's answer, the same motion as workBeat's
function sayLine(x, text, t0) {
  const n = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(text)}</span></div>`);
  const vis = n.firstElementChild, hid = n.lastElementChild;
  let shown = -1;
  return {
    n,
    render(t) {
      const k = streamCount(text, t0 + 0.05, 70, t);
      if (k !== shown) { vis.textContent = text.slice(0, k); hid.textContent = text.slice(k); shown = k; }
    },
  };
}

function scanBody(x) {
  const rows = ROWS.map((r) => `<div class="sc-row${r.hit ? ' sc-hitrow' : ''}"><span class="sc-tk"><img src="${x.img('tokens/' + r.icon)}" alt=""/><b>$${r.s}</b></span><span>${r.mc}</span><span>${r.vol}</span><span class="sc-sc${r.sc < 30 ? ' lo' : ''}">${r.sc}</span></div>`).join('');
  return `<div class="sc-top"><span class="sc-n"><b>0</b><small>tickers scraped</small></span>
      <span class="sc-st"><span class="sc-w"><i></i>Waiting for a hit</span><span class="sc-h">HIT</span></span></div>
    <div class="sc-hd"><span>Token</span><span>MC</span><span>24h vol</span><span>Score</span></div>
    <div class="sc-win"><div class="sc-lens"><em class="sc-stamp">HIT</em></div><div class="sc-list">${rows}</div></div>`;
}

// Axiom's token page (axiom.trade/meme/<pair>), laid out as the real one: top nav, token header, chart pane with
// its toolbar and legend, and the right-hand instant-trade panel ending in the Bought / Sold / Holding / PnL row.
function axiomCard(x) {
  const grid = [44, 48, 52, 56, 60].map((v) => `<line class="ax-gl" x1="${PL}" x2="${CW - PR}" y1="${cy(v).toFixed(1)}" y2="${cy(v).toFixed(1)}"/><text class="ax-yl" x="${CW - PR + 4}" y="${(cy(v) + 2.5).toFixed(1)}">${v}M</text>`).join('');
  const times = TIMES.map(([i, s]) => `<text class="ax-xl" x="${cx(i).toFixed(1)}" y="${CH - 2}">${s}</text>`).join('');
  const candles = CANDLES.map((q, i) => `<g class="ax-c ${q.c >= q.o ? 'up' : 'dn'}"><rect class="ax-vb" x="${(cx(i) - SLOT * 0.36).toFixed(1)}" width="${(SLOT * 0.72).toFixed(1)}" y="${(CH - TA - VOL[i] * VB).toFixed(1)}" height="${(VOL[i] * VB).toFixed(1)}"/><line x1="${cx(i).toFixed(1)}" x2="${cx(i).toFixed(1)}"/><rect class="ax-cb" x="${(cx(i) - SLOT * 0.34).toFixed(1)}" width="${(SLOT * 0.68).toFixed(1)}"/></g>`).join('');
  const bubble = (cls, ch) => `<g class="ax-mk ${cls}"><circle r="5.6"/><text y="2.5">${ch}</text></g>`;
  const buyShare = HIT.buys24 / (HIT.buys24 + HIT.sells24);
  return x.el(`<div class="ax">
    <div class="ax-bar"><span class="ax-logo"><img src="${x.img('axiom.png')}" alt=""/><b>AXIOM</b><em>Pro</em></span>
      <span class="ax-nav"><span class="on">Discover</span><span>Pulse</span><span>Trackers</span><span>Perpetuals</span></span>
      <span class="ax-srch">${ICON.find}Search by token or CA...<kbd>/</kbd></span><span class="ax-dep">Deposit</span></div>
    <div class="ax-tok"><img class="ax-av" src="${x.img('tokens/' + HIT.icon)}" alt=""/>
      <span class="ax-nm"><span class="ax-n1"><b>${HIT.s}</b><small>${HIT.name}</small>${ICON.copy}</span><span class="ax-n2"><em>${HIT.age}</em>${ICON.x}${ICON.web}${ICON.tg}${ICON.find}</span></span>
      <span class="ax-mc"><b>${mcTxt(ENTRY_MC)}</b></span>
      <span class="ax-kv"><small>Price</small><b class="ax-px">${pxTxt(ENTRY_MC)}</b></span><span class="ax-kv"><small>Liquidity</small><b>${HIT.liq}</b></span><span class="ax-kv"><small>Supply</small><b>${HIT.supply}</b></span>
      <span class="ax-fav">${ICON.star}</span></div>
    <div class="ax-main">
      <div class="ax-ch">
        <div class="ax-tools"><b>1m</b><span>${ICON.ind}Indicators</span><span>Display Options</span><span><em>USD</em>/SOL</span><span><em>MarketCap</em>/Price</span></div>
        <div class="ax-leg"><span class="ax-pair">${HIT.s}/USD on ${HIT.dex} · 1 · axiom.trade</span><i class="ax-dot"></i></div>
        <div class="ax-ohlc"></div>
        <svg class="ax-svg" viewBox="0 0 ${CW} ${CH}">${grid}${times}<line class="ax-en" x1="${PL}" x2="${CW - PR}" y1="${cy(ENTRY_MC).toFixed(1)}" y2="${cy(ENTRY_MC).toFixed(1)}"/>${candles}
          <line class="ax-pl" x1="${PL}" x2="${CW - PR}"/><g class="ax-tag"><rect x="${CW - PR + 1}" width="${PR - 1}" height="11" rx="2"/><text x="${CW - PR + 3.5}" y="8"></text></g>
          ${bubble('ax-b', 'B')}${bubble('ax-s', 'S')}</svg>
      </div>
      <div class="ax-side">
        <div class="ax-vol"><span><small>24h Vol</small><b>${HIT.vol24}</b></span><span><small>Buys</small><b class="up">${fmt(HIT.buys24)}</b></span><span><small>Sells</small><b class="dn">${fmt(HIT.sells24)}</b></span></div>
        <div class="ax-ratio"><i style="width:${(buyShare * 100).toFixed(1)}%"></i></div>
        <div class="ax-tabs"><span class="ax-tb">Buy</span><span class="ax-ts">Sell</span></div>
        <div class="ax-ord"><span class="on">Market</span><span>Limit</span><span>Adv.</span></div>
        <div class="ax-amt"><small>AMOUNT</small><b class="ax-amv">${SOL_IN}</b><img class="ax-amu" src="${x.img('tokens/sol.png')}" alt=""/><em class="ax-pctu">%</em></div>
        <div class="ax-pre ax-pb"><span>0.01</span><span>0.1</span><span>1</span><span>10</span></div>
        <div class="ax-pre ax-ps"><span>10%</span><span>25%</span><span>50%</span><span class="on">100%</span></div>
        <div class="ax-set"><span>${ICON.bolt}25%</span><span>${ICON.gas}0.002</span><span>${ICON.tip}0.002</span><span>Off</span></div>
        <div class="ax-adv"><i></i>Advanced Trading Strategy</div>
        <div class="ax-btn"><span class="ax-bl">Buy ${HIT.s}</span><i class="ax-flash"></i></div>
        <div class="ax-pnl"><span><small>Bought</small><b>$0</b></span><span class="ax-sd"><small>Sold</small><b>$0</b></span><span><small>Holding</small><b>$0</b></span><span class="ax-p"><small>PnL</small><b>+$0 (+0%)</b></span></div>
        <div class="ax-presets"><span class="on">PRESET 1</span><span>PRESET 2</span><span>PRESET 3</span></div>
      </div>
    </div>
  </div>`);
}

export default {
  times(r) {
    const bt = stdTimes(r, 3, 2.9, 0.4);
    bt.kpi = [bt.body + 0.2, bt.body + 1.3];
    bt.draw = [bt.body + 0.35, bt.body + 2.45];
    bt.tags = [bt.draw[1] - 0.05, bt.draw[1] + 0.9];
    const ds = { app: 'deepseek', sw: bt.end + 0.05 };
    ds.swap = ds.sw + 0.22;
    ds.done = ds.sw + 0.65;
    const sc = stdTimes(ds.done + 0.12, 2, 4.1, 0.35);
    sc.count = [sc.body + 0.1, sc.body + 1.1];
    sc.roll = [sc.body + 0.15, sc.body + 3.45];
    sc.hit = sc.roll[1] + 0.05;
    const ex = { r: sc.end };
    ex.card = ex.r + 0.3;
    ex.hist = [ex.card + 0.1, ex.card + 0.75];
    ex.buy = ex.card + 1.05;
    ex.stream = [ex.buy + 0.25, ex.buy + 3.45];
    ex.sell = ex.stream[1] + 0.2;
    ex.out = ex.sell + 0.5;
    return { r, bt, ds, sc, ex, end: ex.out + 2.1 };
  },
  build(k, x) {
    const { bt, ds, sc, ex } = k.T;

    // 1. backtest
    const ch = equityChart({ series: [{ v: STRAT, cls: 'eq-s', tag: '+38.6%' }, { v: SOL, cls: 'eq-p', tag: '+7.4%' }], xl: XL, lo: -5, hi: 40, ticks: [0, 10, 20, 30, 40], dd: [17, 29, 'Max DD -8.8%'] });
    const a = workBeat(x, { T: bt }, {
      say: 'Connected. I backtested 4 strategies on the last 90 days. Volume spike wins.',
      title: 'Backtest',
      sub: '4 strategies, 90 days of Solana memecoins',
      steps: ['Read your <b>Axiom</b> trade history', 'Pulled 90 days of new-pair launches', 'Ran <code>backtest.py</code> on 4 entry strategies'],
      cls: 'wk-bt',
      body: `<div class="bt-kpis">${KPI.map((q) => `<span class="bt-kpi ${q.c}"><small>${q.l}</small><b>0</b></span>`).join('')}</div>
        <div class="bt-chart"><div class="bt-lg"><span class="lg-s"><i></i>Volume spike</span><span class="lg-p"><i></i>Hold SOL</span><em>Equity, % return</em></div>${ch.html}</div>`,
    });
    const kp = a.qa('.bt-kpi b').map((n, i) => counter(n, KPI[i].v, bt.kpi[0] + i * 0.12, bt.kpi[1] + i * 0.12, KPI[i].f));
    const svg = a.q('svg.eq');

    // 2. DeepSeek connects
    const chip = x.chip('deepseek', 'Connecting to DeepSeek', ds);

    // 3. scan
    const s = workBeat(x, { T: sc }, {
      say: 'Scraping every ticker on Axiom. DeepSeek scores each one, and I wait for a hit.',
      title: 'Ticker scan',
      sub: 'DeepSeek, scoring with Volume spike',
      steps: ['Scraped every live pair on <b>Axiom</b>', 'Scoring each one with <b>DeepSeek</b>'],
      cls: 'wk-sc',
      body: scanBody(x),
    });
    const scN = counter(s.q('.sc-n b'), 2418, sc.count[0], sc.count[1], (v) => fmt(Math.round(v)));
    const list = s.q('.sc-list'), lens = s.q('.sc-lens'), stamp = s.q('.sc-stamp'), hitRow = s.q('.sc-hitrow');
    const wait = s.q('.sc-w'), hitTx = s.q('.sc-h'), dot = s.q('.sc-w i');

    // 4. execute on Axiom
    const say1 = sayLine(x, `I found a good buy ($${HIT.s}), executing`, ex.r);
    const ax = axiomCard(x);
    const q = (sel) => ax.querySelector(sel);
    const cs = [...ax.querySelectorAll('.ax-c')].map((g) => ({ g, w: g.querySelector('line'), b: g.querySelector('.ax-cb') }));
    const pl = q('.ax-pl'), tag = q('.ax-tag'), tagTx = q('.ax-tag text'), en = q('.ax-en');
    const mB = q('.ax-b'), mS = q('.ax-s');
    const side = q('.ax-side'), btn = q('.ax-btn'), bl = q('.ax-bl'), flash = q('.ax-flash');
    const amv = q('.ax-amv');
    const mc = q('.ax-mc b'), px = q('.ax-px'), leg = q('.ax-ohlc');
    let lastLeg = '';
    const [pB, pS, pH, pP] = [...ax.querySelectorAll('.ax-pnl b')];
    const pnlBox = q('.ax-p');

    // 5. out
    const say2 = sayLine(x, "I'm out, we are up $174.", ex.out);
    let lastBtn = '';

    // live market cap: history is static, then each streamed candle eases from its open to its close in its slot
    const liveAt = (t) => {
      const p = seg(t, ex.stream[0], ex.stream[1]) * (N - 1 - ENTRY);
      const i = Math.min(N - 1, ENTRY + 1 + Math.floor(p));
      const f = p >= N - 1 - ENTRY ? 1 : outCubic(p - Math.floor(p));
      return { i: t < ex.stream[0] ? ENTRY : i, f: t < ex.stream[0] ? 1 : f };
    };

    return {
      nodes: [a.sayEl, a.card, chip.node, s.sayEl, s.card, say1.n, ax, say2.n],
      routes: [ds],
      marks: [...a.marks, [ds.sw, chip.node], ...s.marks, [sc.hit, s.card], [ex.r, say1.n], [ex.card, ax], [ex.out, say2.n]],
      render(t) {
        a.render(t);
        kp.forEach((c) => c(t));
        ch.render(svg, seg(t, bt.draw[0], bt.draw[1]), seg(t, bt.tags[0], bt.tags[1]));

        chip.render(t);

        s.render(t);
        scN(t);
        list.style.transform = `translateY(${(-SCROLL_TO * roll(seg(t, sc.roll[0], sc.roll[1]))).toFixed(2)}px)`;
        const hp = seg(t, sc.hit, sc.hit + 0.35);
        const hit = t >= sc.hit;
        lens.classList.toggle('on', hit);
        hitRow.classList.toggle('on', hit);
        // the two pills never share the frame: "Waiting" is gone before "HIT" lands
        wait.style.opacity = (1 - seg(t, sc.hit - 0.05, sc.hit + 0.08)).toFixed(3);
        dot.style.opacity = (0.35 + 0.65 * (0.5 + 0.5 * Math.cos((t - sc.count[1]) * 6))).toFixed(3);
        const hq = seg(t, sc.hit + 0.08, sc.hit + 0.3);
        hitTx.style.opacity = hq.toFixed(3);
        hitTx.style.transform = `scale(${lerp(0.85, 1, outBack(hq)).toFixed(4)})`;
        stamp.style.opacity = outCubic(hp).toFixed(3);
        stamp.style.transform = `translateY(-50%) scale(${lerp(1.6, 1, outBack(hp)).toFixed(4)}) rotate(${lerp(-14, -6, outCubic(hp)).toFixed(2)}deg)`;

        say1.render(t);
        const ci = seg(t, ex.card, ex.card + 0.5), ce = outCubic(ci);
        ax.style.opacity = ce.toFixed(3);
        ax.style.transform = ci >= 1 ? '' : `translateY(${((1 - ce) * 16).toFixed(2)}px) scale(${lerp(0.975, 1, ce).toFixed(4)})`;

        // candles: history draws in left to right, then the run streams one slot at a time
        const hv = seg(t, ex.hist[0], ex.hist[1]) * (ENTRY + 1);
        const { i: li, f: lf } = liveAt(t);
        cs.forEach(({ g, w, b }, i) => {
          const c = CANDLES[i];
          let o = 0, close = c.c, hh = c.h, ll = c.l;
          if (i <= ENTRY) o = clamp(hv - i);
          else if (i < li) o = 1;
          else if (i === li && t >= ex.stream[0]) {
            o = 1; close = lerp(c.o, c.c, lf);
            hh = Math.max(c.o, close) + (c.h - Math.max(c.o, c.c)) * lf; ll = Math.min(c.o, close) - (Math.min(c.o, c.c) - c.l) * lf;
          }
          g.style.opacity = o.toFixed(3);
          if (!o) return;
          g.setAttribute('class', `ax-c ${close >= c.o ? 'up' : 'dn'}`);
          w.setAttribute('y1', cy(hh).toFixed(2)); w.setAttribute('y2', cy(ll).toFixed(2));
          const y0 = cy(Math.max(c.o, close)), y1 = cy(Math.min(c.o, close));
          b.setAttribute('y', y0.toFixed(2)); b.setAttribute('height', Math.max(0.8, y1 - y0).toFixed(2));
        });
        const cur = t < ex.stream[0] ? ENTRY_MC : li === ENTRY ? ENTRY_MC : lerp(CANDLES[li].o, CANDLES[li].c, lf);
        const yc = cy(cur);
        pl.setAttribute('y1', yc.toFixed(2)); pl.setAttribute('y2', yc.toFixed(2));
        tag.setAttribute('transform', `translate(0 ${(yc - 5.5).toFixed(2)})`);
        tagTx.textContent = `${cur.toFixed(2)}M`;
        // the legend reads the live candle, green or red like Axiom's
        const lc = CANDLES[li], lg = ohlc(lc, cur);
        if (lg !== lastLeg) { leg.innerHTML = lg; leg.classList.toggle('dn', cur < lc.o); lastLeg = lg; }
        const tg = seg(t, ex.hist[1] - 0.1, ex.hist[1] + 0.2);
        pl.style.opacity = tg.toFixed(3); tag.style.opacity = tg.toFixed(3);
        mc.textContent = mcTxt(cur);
        px.textContent = pxTxt(cur);

        // the buy: button dips and flashes, the B bubble lands under the entry candle, the entry line fades in;
        // then the panel flips to Sell (red tab, % presets with 100% picked) and the S bubble lands on the exit
        const bp = seg(t, ex.buy - 0.12, ex.buy + 0.18);
        const sp = seg(t, ex.sell - 0.12, ex.sell + 0.18);
        const sell = t >= ex.sell - 0.35;
        side.classList.toggle('sell', sell);
        const label = sell ? `Sell ${HIT.s}` : `Buy ${HIT.s}`;
        if (label !== lastBtn) { bl.textContent = label; lastBtn = label; }
        amv.textContent = sell ? '100' : String(SOL_IN);
        const dip = Math.max(Math.sin(Math.PI * bp), Math.sin(Math.PI * sp));
        btn.style.transform = dip > 0.001 ? `scale(${(1 - 0.05 * dip).toFixed(4)})` : 'none';
        const fl = (a) => (t >= a ? 1 - seg(t, a, a + 0.45) : 0);
        flash.style.opacity = (0.32 * Math.max(fl(ex.buy), fl(ex.sell))).toFixed(3);
        const mk = (g, i, v, below, a0) => {
          const m = outBack(seg(t, a0, a0 + 0.35));
          g.style.opacity = clamp(m).toFixed(3);
          const yy = below ? cy(v) + 9 : cy(v) - 9;
          g.setAttribute('transform', `translate(${cx(i).toFixed(2)} ${(yy + (1 - m) * (below ? 6 : -6)).toFixed(2)}) scale(${lerp(0.5, 1, clamp(m)).toFixed(3)})`);
        };
        mk(mB, ENTRY, CANDLES[ENTRY].l, true, ex.buy);
        mk(mS, N - 1, CANDLES[N - 1].h, false, ex.sell);
        en.style.opacity = (0.8 * seg(t, ex.buy, ex.buy + 0.4)).toFixed(3);

        // Bought / Sold / Holding / PnL
        const held = t >= ex.buy && t < ex.sell;
        const val = BOUGHT * (cur / ENTRY_MC);
        pB.textContent = t >= ex.buy ? usd(BOUGHT) : '$0';
        pS.textContent = t >= ex.sell ? usd(SOLD) : '$0';
        pH.textContent = held ? usd(val) : '$0';
        const pnl = t >= ex.sell ? SOLD - BOUGHT : held ? val - BOUGHT : 0;
        pP.textContent = pnl ? `${pnl >= 0 ? '+' : '-'}$${fmt(Math.abs(pnl), 0)} (${pct((pnl / BOUGHT) * 100)})` : '+$0 (+0%)';
        pnlBox.classList.toggle('up', pnl > 0.005);
        pnlBox.classList.toggle('won', t >= ex.sell);

        say2.render(t);
      },
    };
  },
};
