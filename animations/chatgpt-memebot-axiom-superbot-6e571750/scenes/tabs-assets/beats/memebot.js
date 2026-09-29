// "make me a memecoin trading bot", after superbot has connected Axiom. One answer, five movements:
// 1. Backtest: 4 entry strategies over 90 days of Solana memecoin launches; the winner (Volume spike) is drawn
//    against simply holding SOL. Volume spike +38.6% vs SOL +7.4%, 61% win rate, max drawdown -8.8%.
// 2. DeepSeek connects (the same routing chip as Axiom; the composer chip swaps with it) to score tickers.
// 3. Scan: every live Axiom ticker is scraped (counter to 2,418), the list rolls through a lens while superbot
//    waits, then eases to a stop on $FROGE and the lens stamps HIT.
// 4. "I found a good buy ($FROGE), executing": an Axiom token page (market-cap candles, instant-trade panel,
//    Bought / Sold / Holding / PnL row). The 7 SOL buy fills, candles stream up, B and S markers land.
// 5. "I'm out, we are up $174." Bought $1,050, sold $1,224.20, PnL +$174.20 (+16.6%). Fictional mock data.
import { seg, outCubic, outBack, lerp, clamp, streamCount } from '../../../lib.js';
import { stdTimes, workBeat, counter, equityChart, fmt } from './wk.js?v=2';

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

// ---- the scan: a long list of live pairs, $FROGE near the end; the lens is the list's middle row
let seed = 11;
const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const NAMES = ['PEPU', 'BONKZ', 'WAGMI', 'DOGEX', 'CHAD', 'MOONR', 'SNEK', 'BRETTO', 'NUB', 'GOAT2', 'SIGMA', 'TURBO', 'KITTY', 'RIZZ', 'MOCHI', 'ZEUS', 'BASED', 'PONK', 'GLORP', 'SHIBU', 'NEKO', 'HONK', 'YOLO', 'MEW2', 'DEGEN', 'SLERF', 'COPE', 'POPO', 'BLOB', 'WOJAK', 'GRIMA', 'TOAD', 'LUNAR', 'BOBO', 'CRABS', 'SPUD', 'MILK', 'NOOT', 'FLOKY', 'BEANS', 'FROGE', 'HAMSTR', 'BLORP', 'GIGACAT', 'PIXL', 'MOTH'];
const HIT_I = NAMES.indexOf('FROGE');
const HUES = [140, 200, 30, 280, 350, 60, 170, 250];
const ROWS = NAMES.map((s, i) => {
  const hit = i === HIT_I;
  return {
    s, hit, hue: HUES[i % HUES.length],
    mc: hit ? '$1.24M' : `$${(20 + rnd() * 900).toFixed(0)}K`,
    vol: hit ? '$19K' : `$${(0.4 + rnd() * 9).toFixed(1)}K`,
    sc: hit ? 96 : Math.round(8 + rnd() * 58),
  };
});
const RH = 26, LENS = 2; // row height (px) and the lens row inside the 5-row window
const SCROLL_TO = (HIT_I - LENS) * RH;
// constant roll while waiting, then a slot-machine ease onto the hit (speeds match at the seam)
const roll = (p) => (p <= 0.7 ? 0.8 * (p / 0.7) : 0.8 + 0.2 * (1 - (1 - (p - 0.7) / 0.3) ** 2));

// ---- the trade: 1-minute market-cap candles (in $M). Entry at the close of candle ENTRY, exit at the last one.
const ENTRY_MC = 1.24, BOUGHT = 1050, SOLD = 1224.2, EXIT_MC = ENTRY_MC * (SOLD / BOUGHT);
const HIST = [1.13, 1.12, 1.14, 1.16, 1.15, 1.13, 1.14, 1.17, 1.16, 1.18, 1.17, 1.15, 1.16, 1.19, 1.18, 1.2, 1.19, 1.17, 1.18, 1.21, 1.2, 1.19, 1.22, 1.21, 1.23, 1.22, 1.24];
const RUN = [1.262, 1.281, 1.272, 1.301, 1.324, 1.316, 1.343, 1.338, 1.361, 1.392, 1.381, 1.405, 1.398, 1.421, 1.433, EXIT_MC];
const CLOSES = [...HIST, ...RUN];
const ENTRY = HIST.length - 1, N = CLOSES.length;
const CANDLES = CLOSES.map((c, i) => {
  const o = i ? CLOSES[i - 1] : c - 0.006;
  const w = 0.004 + rnd() * 0.009;
  return { o, c, h: Math.max(o, c) + w * rnd(), l: Math.min(o, c) - w * rnd() };
});
const CW = 300, CH = 164, PL = 4, PR = 40, PT = 8, PB = 8, LO = 1.08, HI = 1.5;
const SLOT = (CW - PL - PR) / N;
const cx = (i) => PL + SLOT * (i + 0.5);
const cy = (v) => PT + ((HI - v) / (HI - LO)) * (CH - PT - PB);
const mcTxt = (v) => `$${v.toFixed(2)}M`;
const usd = (v) => `$${fmt(v, 0)}`;

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

function scanBody() {
  const rows = ROWS.map((r) => `<div class="sc-row${r.hit ? ' sc-hitrow' : ''}"><span class="sc-tk"><i style="--h:${r.hue}">${r.s[0]}</i><b>$${r.s}</b></span><span>${r.mc}</span><span>${r.vol}</span><span class="sc-sc${r.sc < 30 ? ' lo' : ''}">${r.sc}</span></div>`).join('');
  return `<div class="sc-top"><span class="sc-n"><b>0</b><small>tickers scraped</small></span>
      <span class="sc-st"><span class="sc-w"><i></i>Waiting for a hit</span><span class="sc-h">HIT</span></span></div>
    <div class="sc-hd"><span>Token</span><span>MC</span><span>5m vol</span><span>Score</span></div>
    <div class="sc-win"><div class="sc-lens"><em class="sc-stamp">HIT</em></div><div class="sc-list">${rows}</div></div>`;
}

function axiomCard(x) {
  const grid = [1.1, 1.2, 1.3, 1.4, 1.5].map((v) => `<line class="ax-gl" x1="${PL}" x2="${CW - PR}" y1="${cy(v).toFixed(1)}" y2="${cy(v).toFixed(1)}"/><text class="ax-yl" x="${CW - PR + 5}" y="${(cy(v) + 3).toFixed(1)}">${v.toFixed(1)}M</text>`).join('');
  const candles = CANDLES.map((q, i) => `<g class="ax-c ${q.c >= q.o ? 'up' : 'dn'}"><line x1="${cx(i).toFixed(1)}" x2="${cx(i).toFixed(1)}"/><rect x="${(cx(i) - SLOT * 0.34).toFixed(1)}" width="${(SLOT * 0.68).toFixed(1)}" rx="0.6"/></g>`).join('');
  return x.el(`<div class="ax">
    <div class="ax-bar">${x.tile('axiom')}<b class="ax-brand">AXIOM</b><span class="ax-nav"><span class="on">Discover</span><span>Pulse</span><span>Trackers</span></span><span class="ax-srch">Search by token or CA</span><span class="ax-auto"><img src="${x.sbSrc}" alt=""/>superbot trading</span></div>
    <div class="ax-tok"><span class="ax-av">F</span><span class="ax-nm"><b>FROGE</b><small>Frog Emperor</small></span>
      <span class="ax-mc"><b>$1.24M</b></span>
      <span class="ax-kv"><small>Price</small><b class="ax-px">$0.00124</b></span><span class="ax-kv"><small>Liquidity</small><b>$182K</b></span><span class="ax-kv"><small>Holders</small><b>3,912</b></span></div>
    <div class="ax-main">
      <div class="ax-ch"><div class="ax-chh"><span class="ax-tf"><b>1m</b><span>5m</span><span>1h</span></span><span class="ax-pair">FROGE/USD Market Cap on Axiom</span></div>
        <svg class="ax-svg" viewBox="0 0 ${CW} ${CH}">${grid}<line class="ax-en" x1="${PL}" x2="${CW - PR}" y1="${cy(ENTRY_MC).toFixed(1)}" y2="${cy(ENTRY_MC).toFixed(1)}"/>${candles}
          <line class="ax-pl" x1="${PL}" x2="${CW - PR}"/><g class="ax-tag"><rect x="${CW - PR + 1}" width="${PR - 1}" height="13" rx="2.5"/><text x="${CW - PR + 4}"></text></g>
          <g class="ax-mk ax-b"><rect width="11" height="11" rx="2.5"/><text>B</text></g><g class="ax-mk ax-s"><rect width="11" height="11" rx="2.5"/><text>S</text></g></svg></div>
      <div class="ax-side">
        <div class="ax-vol"><span><small>5m Vol</small><b>$19K</b></span><span><small>Buys</small><b class="up">120</b></span><span><small>Sells</small><b class="dn">71</b></span></div>
        <div class="ax-tabs"><span class="ax-tb">Buy</span><span class="ax-ts">Sell</span></div>
        <div class="ax-ord"><span class="on">Market</span><span>Limit</span><span>Adv.</span></div>
        <div class="ax-amt"><small>Amount</small><b class="ax-amv">7</b><em class="ax-amu">SOL</em></div>
        <div class="ax-pre ax-pb"><span>1</span><span>3</span><span class="on">7</span><span>10</span></div>
        <div class="ax-pre ax-ps"><span>25%</span><span>50%</span><span>75%</span><span class="on">100%</span></div>
        <div class="ax-btn"><span class="ax-bl">Buy FROGE</span><i class="ax-flash"></i></div>
      </div>
    </div>
    <div class="ax-pnl"><span><small>Bought</small><b>$0</b></span><span><small>Sold</small><b>$0</b></span><span><small>Holding</small><b>$0</b></span><span class="ax-p"><small>PnL</small><b>+$0</b></span></div>
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
      body: scanBody(),
    });
    const scN = counter(s.q('.sc-n b'), 2418, sc.count[0], sc.count[1], (v) => fmt(Math.round(v)));
    const list = s.q('.sc-list'), lens = s.q('.sc-lens'), stamp = s.q('.sc-stamp'), hitRow = s.q('.sc-hitrow');
    const wait = s.q('.sc-w'), hitTx = s.q('.sc-h'), dot = s.q('.sc-w i');

    // 4. execute on Axiom
    const say1 = sayLine(x, 'I found a good buy ($FROGE), executing', ex.r);
    const ax = axiomCard(x);
    const q = (sel) => ax.querySelector(sel);
    const cs = [...ax.querySelectorAll('.ax-c')].map((g) => ({ g, w: g.querySelector('line'), b: g.querySelector('rect') }));
    const pl = q('.ax-pl'), tag = q('.ax-tag'), tagTx = q('.ax-tag text'), en = q('.ax-en');
    const mB = q('.ax-b'), mS = q('.ax-s');
    const side = q('.ax-side'), btn = q('.ax-btn'), bl = q('.ax-bl'), flash = q('.ax-flash');
    const amv = q('.ax-amv'), amu = q('.ax-amu');
    const mc = q('.ax-mc b'), px = q('.ax-px');
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
        wait.style.opacity = (1 - hp).toFixed(3);
        dot.style.opacity = (0.35 + 0.65 * (0.5 + 0.5 * Math.cos((t - sc.count[1]) * 6))).toFixed(3);
        hitTx.style.opacity = hp.toFixed(3);
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
        tag.setAttribute('transform', `translate(0 ${(yc - 6.5).toFixed(2)})`);
        tagTx.setAttribute('y', '9.6');
        tagTx.textContent = `${cur.toFixed(3)}M`;
        const tg = seg(t, ex.hist[1] - 0.1, ex.hist[1] + 0.2);
        pl.style.opacity = tg.toFixed(3); tag.style.opacity = tg.toFixed(3);
        mc.textContent = mcTxt(cur);
        px.textContent = `$${(cur / 1000).toFixed(5)}`;

        // the buy: button dips and flashes, B lands under the entry candle, the entry line fades in
        const bp = seg(t, ex.buy - 0.12, ex.buy + 0.18);
        const sp = seg(t, ex.sell - 0.12, ex.sell + 0.18);
        const sell = t >= ex.sell - 0.35;
        side.classList.toggle('sell', sell);
        const label = t < ex.buy ? 'Buy FROGE' : !sell ? 'Bought 7 SOL' : t < ex.sell ? 'Sell FROGE' : 'Sold 100%';
        if (label !== lastBtn) { bl.textContent = label; lastBtn = label; }
        amv.textContent = sell ? '100' : '7';
        amu.textContent = sell ? '%' : 'SOL';
        const dip = Math.max(Math.sin(Math.PI * bp), Math.sin(Math.PI * sp));
        btn.style.transform = dip > 0.001 ? `scale(${(1 - 0.05 * dip).toFixed(4)})` : 'none';
        const fl = (a) => (t >= a ? 1 - seg(t, a, a + 0.45) : 0);
        flash.style.opacity = (0.32 * Math.max(fl(ex.buy), fl(ex.sell))).toFixed(3);
        const mk = (g, i, v, below, a0) => {
          const m = outBack(seg(t, a0, a0 + 0.35));
          g.style.opacity = clamp(m).toFixed(3);
          const yy = below ? cy(v) + 4 : cy(v) - 15;
          g.setAttribute('transform', `translate(${(cx(i) - 5.5).toFixed(2)} ${(yy + (1 - m) * (below ? 6 : -6)).toFixed(2)})`);
        };
        mk(mB, ENTRY, CANDLES[ENTRY].l, true, ex.buy);
        mk(mS, N - 1, CANDLES[N - 1].h, false, ex.sell);
        en.style.opacity = (0.8 * seg(t, ex.buy, ex.buy + 0.4)).toFixed(3);

        // Bought / Sold / Holding / PnL
        const held = t >= ex.buy && t < ex.sell;
        const val = BOUGHT * (cur / ENTRY_MC);
        pB.textContent = t >= ex.buy ? usd(BOUGHT) : '$0';
        pS.textContent = t >= ex.sell ? `$${fmt(SOLD, 2)}` : '$0';
        pH.textContent = held ? usd(val) : '$0';
        const pnl = t >= ex.sell ? SOLD - BOUGHT : held ? val - BOUGHT : 0;
        pP.textContent = `${pnl >= 0 ? '+' : '-'}$${fmt(Math.abs(pnl), 2)} (${pct((pnl / BOUGHT) * 100)})`;
        pnlBox.classList.toggle('up', pnl > 0.005);
        pnlBox.classList.toggle('won', t >= ex.sell);

        say2.render(t);
      },
    };
  },
};
