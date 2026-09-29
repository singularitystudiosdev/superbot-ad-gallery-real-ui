// "make me a memecoin tracker for Axiom", after superbot has connected Axiom read-only. One answer, six movements:
// 1. Watchlist: five real Solana memecoins with price, 24h change, 24h volume, liquidity and holders (./tokens.js).
// 2. Alert rules: Volume spike 3x in 5m, Holders +20% in 1h, Dev wallet moved; each switch flips on in turn.
// 3. DeepSeek connects (the same routing chip as Axiom; the composer chip swaps with it) to read the activity.
// 4. Scan: every live Axiom ticker is checked (counter to 2,418); the real scan list rolls through a lens and eases
//    to a stop on $POPCAT, where the lens stamps ALERT and the card flags "ALERT: POPCAT volume 3.1x in 5m".
// 5. Summary (with the one disclaimer line), then "Want me to turn on alerts?"; sam types "Looks good, let's do it".
// 6. Finale: POPCAT's Axiom token page, rebuilt information-only (chart, token info, superbot's alert rules), with
//    superbot's alert notifications dropping in over it. superbot never presses anything on the page.
import { seg, outCubic, outBack, lerp, clamp, streamCount } from '../../../lib.js';
import { stdTimes, workBeat, counter, grow, fmt } from './wk.js?v=3';
import { TOKENS, WATCH, PAGE } from './tokens.js?v=4';

const pct = (v, d = 2) => `${v > 0 ? '+' : v < 0 ? '-' : ''}${Math.abs(v).toFixed(d)}%`;
const REPLY = "Looks good, let's do it";

// ---- the alert rules
const RULES = [
  { k: 'vol', txt: 'Volume spike 3x in 5m', ic: '<path d="M3 20h18"/><path d="M6 16v-3"/><path d="M10 16V9"/><path d="M14 16v-5"/><path d="M18 16V5"/>' },
  { k: 'hold', txt: 'Holders +20% in 1h', ic: '<path d="M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20"/><circle cx="10" cy="8" r="3.5"/><path d="M20 20v-1.5a3.5 3.5 0 0 0-2.5-3.35"/><path d="M15.5 4.65a3.5 3.5 0 0 1 0 6.7"/>' },
  { k: 'dev', txt: 'Dev wallet moved', ic: '<path d="M19 7V5a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v3h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2"/><path d="M3 6v12a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-3"/>' },
];
const svgIc = (d) => `<svg viewBox="0 0 24 24">${d}</svg>`;

// ---- the scan: real Solana memecoins, $POPCAT near the end; the lens is the list's middle row. Only the 5m
// volume multiple (5m volume over its 1h average) is the ad's own illustration.
let seed = 11;
const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const FLAG_I = TOKENS.findIndex((q) => q.s === PAGE.s);
const ROWS = TOKENS.map((q, i) => ({ ...q, flag: i === FLAG_I, vx: i === FLAG_I ? 3.1 : 0.4 + rnd() * 1.4 }));
const RH = 26, LENS = 2; // row height (px) and the lens row inside the 5-row window
const SCROLL_TO = (FLAG_I - LENS) * RH;
// constant roll while waiting, then an ease onto the flagged row (speeds match at the seam)
const roll = (p) => (p <= 0.7 ? 0.8 * (p / 0.7) : 0.8 + 0.2 * (1 - (1 - (p - 0.7) / 0.3) ** 2));
const AVG5 = PAGE.vol1h / 12, SPIKE5 = AVG5 * 3.1; // POPCAT's 5m average and the flagged 5m volume, $
const usdK = (v) => `$${(v / 1000).toFixed(v < 10000 ? 2 : 1)}K`;

// ---- the finale chart: 1-minute market-cap candles (in $M) around POPCAT's pulled market cap, ranging sideways
// on the hour, with the last five minutes carrying the flagged volume. Illustration drawn on real levels.
const MC = PAGE.mc;
const SHAPE = [0.1, 0.05, 0.12, 0.2, 0.15, 0.08, 0.02, 0.06, -0.02, -0.08, -0.04, -0.1, -0.06, 0, -0.05, -0.12, -0.08, -0.02, 0.04, -0.01, -0.06, -0.03, 0.02, -0.02, 0.03, -0.01, 0.06, 0.01, -0.04, 0.03, 0];
const CLOSES = SHAPE.map((v) => MC * (1 + v / 100));
const N = CLOSES.length, SPIKE0 = N - 5; // the last five candles are the flagged 5m window
const CANDLES = CLOSES.map((c, i) => {
  const o = i ? CLOSES[i - 1] : c * 0.9993;
  const w = MC * (0.0004 + rnd() * 0.001);
  return { o, c, h: Math.max(o, c) + w * rnd(), l: Math.min(o, c) - w * rnd() };
});
const VOL = CANDLES.map((c, i) => (i >= SPIKE0 ? 0.62 + rnd() * 0.38 : 0.1 + rnd() * 0.2));
const CW = 324, CH = 176, PL = 2, PR = 34, PT = 6, VB = 30, TA = 11;
const LO = MC * 0.9968, HI = MC * 1.0036;
const PY = CH - VB - TA - 4; // bottom of the price area
const SLOT = (CW - PL - PR) / N;
const cx = (i) => PL + SLOT * (i + 0.5);
const cy = (v) => PT + ((HI - v) / (HI - LO)) * (PY - PT);
const TIMES = [[4, '04:00'], [14, '04:10'], [24, '04:20']];
const GRID = [51.1, 51.2, 51.3];
const mcTxt = (v) => `$${v.toFixed(2)}M`;
const pxTxt = (v) => `$${(v / PAGE.supplyM).toFixed(5)}`;

// UI furniture drawn as Axiom draws it (outline glyphs), not brand art
const ICON = {
  copy: '<svg viewBox="0 0 16 16"><rect x="5" y="5" width="8" height="8" rx="1.5"/><path d="M3 10.5V4a1 1 0 0 1 1-1h6.5"/></svg>',
  x: '<svg viewBox="0 0 16 16"><path d="M3.5 3.5l9 9M12.5 3.5l-9 9"/></svg>',
  web: '<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="5.5"/><path d="M2.5 8h11M8 2.5c2 2 2 9 0 11M8 2.5c-2 2-2 9 0 11"/></svg>',
  tg: '<svg viewBox="0 0 16 16"><path d="M13.5 3L2.5 7.5l4 1.5 1.5 4 2-2.5 3 2z"/></svg>',
  find: '<svg viewBox="0 0 16 16"><circle cx="7" cy="7" r="4"/><path d="M10 10l3.5 3.5"/></svg>',
  star: '<svg viewBox="0 0 16 16"><path d="M8 2.5l1.7 3.5 3.8.5-2.8 2.6.7 3.8L8 11.1l-3.4 1.8.7-3.8L2.5 6.5l3.8-.5z"/></svg>',
  eye: '<svg viewBox="0 0 16 16"><path d="M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8z"/><circle cx="8" cy="8" r="2"/></svg>',
  ind: '<svg viewBox="0 0 16 16"><path d="M2 12l4-5 3 3 5-6"/></svg>',
  bell: '<svg viewBox="0 0 24 24"><path d="M10.27 21a2 2 0 0 0 3.46 0"/><path d="M3.26 15.33A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.67C19.41 13.96 18 12.5 18 8A6 6 0 0 0 6 8c0 4.5-1.41 5.96-2.74 7.33"/></svg>',
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

// a block that rises in at a (the thread's own appear motion)
function rise(n, t, a, dy = 12) {
  const p = outCubic(seg(t, a, a + 0.45));
  n.style.opacity = p.toFixed(3);
  n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * dy).toFixed(2)}px)`;
}

function watchBody(x) {
  const rows = WATCH.map((w) => `<div class="wl-row"><span class="wl-tk"><img src="${x.img('tokens/' + w.icon)}" alt=""/><b>$${w.s}</b></span><span>${w.px}</span><span class="${w.ch < 0 ? 'dn' : 'up'}">${pct(w.ch)}</span><span>${w.vol}</span><span>${w.liq}</span><span class="wl-h">0</span></div>`).join('');
  return `<div class="wl-hd"><span>Token</span><span>Price</span><span>24h</span><span>24h vol</span><span>Liquidity</span><span>Holders</span></div>${rows}`;
}

function rulesBody() {
  return RULES.map((r) => `<div class="ar-row"><span class="ar-ic">${svgIc(r.ic)}</span><span class="ar-tx"><b>${r.txt}</b><small>All ${WATCH.length} tokens</small></span><span class="ar-sw"><i></i></span></div>`).join('');
}

function scanBody(x) {
  const rows = ROWS.map((r) => `<div class="sc-row${r.flag ? ' sc-flagrow' : ''}"><span class="sc-tk"><img src="${x.img('tokens/' + r.icon)}" alt=""/><b>$${r.s}</b></span><span>${r.mc}</span><span>${r.vol}</span><span class="sc-vx${r.vx >= 3 ? ' hi' : r.vx < 0.9 ? ' lo' : ''}">${r.vx.toFixed(1)}x</span></div>`).join('');
  return `<div class="sc-top"><span class="sc-n"><b>0</b><small>tickers checked</small></span>
      <span class="sc-st"><span class="sc-w"><i></i>Watching</span><span class="sc-h">ALERT</span></span></div>
    <div class="sc-hd"><span>Token</span><span>MC</span><span>24h vol</span><span>Vol 5m</span></div>
    <div class="sc-win"><div class="sc-lens"><em class="sc-stamp">ALERT</em></div><div class="sc-list">${rows}</div></div>
    <div class="sc-fw"><div class="sc-flag">${ICON.bell}<b>ALERT: ${PAGE.s} volume 3.1x in 5m</b><small>${usdK(SPIKE5)} vs ${usdK(AVG5)} avg</small></div></div>`;
}

function summaryBody() {
  const rows = [
    ['Watchlist', `${WATCH.length} memecoins on Axiom`],
    ['Alert rules', `${RULES.length} rules, all tokens`],
    ['Flagged', `${PAGE.s} volume 3.1x in 5m`],
    ['Daily digest', '9:00 AM'],
  ];
  return `<div class="sm-rows">${rows.map(([k, v]) => `<div class="sm-row"><small>${k}</small><b>${v}</b></div>`).join('')}</div>
    <div class="sm-note">${ICON.eye}Tracking only. Not financial advice. superbot never trades.</div>`;
}

// Axiom's token page (axiom's /meme/<pair>), rebuilt information-only: top nav, token header, chart pane with its
// toolbar and legend, and a right-hand column of token info and superbot's alert rules in place of any controls.
function axiomCard(x) {
  const grid = GRID.map((v) => `<line class="ax-gl" x1="${PL}" x2="${CW - PR}" y1="${cy(v).toFixed(1)}" y2="${cy(v).toFixed(1)}"/><text class="ax-yl" x="${CW - PR + 4}" y="${(cy(v) + 2.5).toFixed(1)}">${v.toFixed(1)}M</text>`).join('');
  const times = TIMES.map(([i, s]) => `<text class="ax-xl" x="${cx(i).toFixed(1)}" y="${CH - 2}">${s}</text>`).join('');
  const candles = CANDLES.map((q, i) => `<g class="ax-c ${q.c >= q.o ? 'up' : 'dn'}${i >= SPIKE0 ? ' sp' : ''}"><rect class="ax-vb" x="${(cx(i) - SLOT * 0.36).toFixed(1)}" width="${(SLOT * 0.72).toFixed(1)}"/><line x1="${cx(i).toFixed(1)}" x2="${cx(i).toFixed(1)}" y1="${cy(q.h).toFixed(2)}" y2="${cy(q.l).toFixed(2)}"/><rect class="ax-cb" x="${(cx(i) - SLOT * 0.34).toFixed(1)}" width="${(SLOT * 0.68).toFixed(1)}" y="${cy(Math.max(q.o, q.c)).toFixed(2)}" height="${Math.max(0.8, cy(Math.min(q.o, q.c)) - cy(Math.max(q.o, q.c))).toFixed(2)}"/></g>`).join('');
  const bx = cx(SPIKE0) - SLOT / 2, bw = SLOT * 5;
  const band = `<g class="ax-band"><rect x="${bx.toFixed(1)}" y="${PT}" width="${bw.toFixed(1)}" height="${CH - TA - PT}" rx="2"/><text x="${(bx + bw / 2).toFixed(1)}" y="${(PY + 3).toFixed(1)}">3.1x</text></g>`;
  const close = CLOSES[N - 1], yc = cy(close);
  const info = [
    ['Top 10 H.', `${PAGE.top10.toFixed(1)}%`],
    ['Holders', fmt(PAGE.holders)],
    ['Liquidity', PAGE.liq],
    ['24h Vol', PAGE.vol24],
    ['Txns', fmt(PAGE.txns)],
    ['Pair age', PAGE.age],
  ];
  const toasts = [
    ['Alerts are on', `Watching ${WATCH.length} tokens with ${RULES.length} rules`],
    ['Daily digest set', 'Tomorrow, 9:00 AM: price, volume, holders'],
    [`ALERT: ${PAGE.s} volume 3.1x in 5m`, `${usdK(SPIKE5)} in 5m vs ${usdK(AVG5)} avg, ${PAGE.dex} pair`],
  ];
  return x.el(`<div class="ax">
    <div class="ax-bar"><span class="ax-logo"><img src="${x.img('axiom.png')}" alt=""/><b>AXIOM</b><em>Pro</em></span>
      <span class="ax-nav"><span>Discover</span><span>Pulse</span><span class="on">Trackers</span></span>
      <span class="ax-srch">${ICON.find}Search by token or CA...<kbd>/</kbd></span><span class="ax-ro">${ICON.eye}Read-only</span></div>
    <div class="ax-tok"><img class="ax-av" src="${x.img('tokens/' + PAGE.icon)}" alt=""/>
      <span class="ax-nm"><span class="ax-n1"><b>${PAGE.s}</b><small>${PAGE.name}</small>${ICON.copy}</span><span class="ax-n2"><em>${PAGE.age}</em>${ICON.x}${ICON.web}${ICON.tg}${ICON.find}</span></span>
      <span class="ax-mc"><b>${mcTxt(close)}</b></span>
      <span class="ax-kv"><small>Price</small><b>${pxTxt(close)}</b></span><span class="ax-kv"><small>Liquidity</small><b>${PAGE.liq}</b></span><span class="ax-kv"><small>Supply</small><b>${PAGE.supply}</b></span>
      <span class="ax-fav">${ICON.star}</span></div>
    <div class="ax-main">
      <div class="ax-ch">
        <div class="ax-tools"><b>1m</b><span>${ICON.ind}Indicators</span><span>Display Options</span><span><em>USD</em>/SOL</span><span><em>MarketCap</em>/Price</span></div>
        <div class="ax-leg"><span class="ax-pair">${PAGE.s}/USD on ${PAGE.dex} · 1m</span><i class="ax-dot"></i></div>
        <svg class="ax-svg" viewBox="0 0 ${CW} ${CH}">${grid}${times}${band}${candles}
          <line class="ax-pl" x1="${PL}" x2="${CW - PR}" y1="${yc.toFixed(2)}" y2="${yc.toFixed(2)}"/><g class="ax-tag" transform="translate(0 ${(yc - 5.5).toFixed(2)})"><rect x="${CW - PR + 1}" width="${PR - 1}" height="11" rx="2"/><text x="${CW - PR + 3.5}" y="8">${close.toFixed(2)}M</text></g></svg>
      </div>
      <div class="ax-side">
        <div class="ax-sh">Token info</div>
        <div class="ax-info">${info.map(([k, v]) => `<span><b>${v}</b><small>${k}</small></span>`).join('')}</div>
        <div class="ax-al">
          <div class="ax-alh"><img src="${x.sbSrc}" alt=""/><b>superbot alerts</b><em><i></i>On</em></div>
          ${RULES.map((r) => `<div class="ax-alr ax-r-${r.k}">${svgIc(r.ic)}<span>${r.txt}</span><i></i></div>`).join('')}
        </div>
      </div>
    </div>
    <div class="ax-toasts">${toasts.map(([h, s], i) => `<div class="ax-toast${i === 2 ? ' hot' : ''}"><img src="${x.sbSrc}" alt=""/><span class="ax-tt"><span class="ax-tt1"><b>superbot</b><small>now</small></span><b class="ax-tt2">${h}</b><small class="ax-tt3">${s}</small></span></div>`).join('')}</div>
  </div>`);
}

export default {
  times(r) {
    const wl = stdTimes(r, 3, 2.1, 0.3);
    wl.rows = wl.body + 0.1;
    wl.count = [wl.body + 0.3, wl.body + 1.3];
    const ar = stdTimes(wl.end, 1, 1.5, 0.3);
    ar.on = ar.body + 0.35; // the switches flip on 0.3 s apart
    const ds = { app: 'deepseek', sw: ar.end + 0.05 };
    ds.swap = ds.sw + 0.22;
    ds.done = ds.sw + 0.65;
    const sc = stdTimes(ds.done + 0.12, 2, 3.3, 0.35);
    sc.count = [sc.body + 0.1, sc.body + 1.1];
    sc.roll = [sc.body + 0.15, sc.body + 2.65];
    sc.alert = sc.roll[1] + 0.05;
    const sm = stdTimes(sc.end, 1, 1.4, 0.2);
    sm.ask = sm.end;
    const u = { s: sm.ask + 0.75 };
    u.typeEnd = u.s + Math.min(0.55, 0.15 + REPLY.length * 0.006);
    u.send = u.typeEnd + 0.1;
    const fin = { r: u.send + 0.4 };
    fin.card = fin.r + 0.3;
    fin.draw = [fin.card + 0.1, fin.card + 0.8];
    fin.toast = [fin.card + 0.95, fin.card + 1.75, fin.card + 2.55];
    return { r, wl, ar, ds, sc, sm, u, fin, end: fin.toast[2] + 1.7 };
  },
  build(k, x) {
    const { wl, ar, ds, sc, sm, u, fin } = k.T;

    // 1. watchlist
    const a = workBeat(x, { T: wl }, {
      say: "Connected, read-only. Here's your Axiom watchlist.",
      title: 'Watchlist',
      sub: `${WATCH.length} Solana memecoins on Axiom`,
      steps: ['Read your <b>Axiom</b> watchlist (read-only)', 'Pulled price, 24h change and volume', 'Added liquidity and holders'],
      cls: 'wk-wl',
      body: watchBody(x),
    });
    const wRows = a.qa('.wl-row');
    const wHold = a.qa('.wl-h').map((n, i) => counter(n, WATCH[i].holders, wl.count[0] + i * 0.08, wl.count[1] + i * 0.08, (v) => fmt(Math.round(v))));

    // 2. alert rules
    const b = workBeat(x, { T: ar }, {
      say: "I'll ping you when any of these fire.",
      title: 'Alert rules',
      sub: `On all ${WATCH.length} tokens`,
      steps: ['Set rules for your watchlist'],
      cls: 'wk-ar',
      body: rulesBody(),
    });
    const sws = b.qa('.ar-sw'), knobs = b.qa('.ar-sw i');

    // 3. DeepSeek connects
    const chip = x.chip('deepseek', 'Connecting to DeepSeek', ds, 'Connected DeepSeek');

    // 4. scan
    const s = workBeat(x, { T: sc }, {
      say: 'Checking every ticker on Axiom against your rules. DeepSeek reads the activity.',
      title: 'Ticker scan',
      sub: 'Volume, holders and dev wallets',
      steps: ['Read every live pair on <b>Axiom</b>', 'Checking each one with <b>DeepSeek</b>'],
      cls: 'wk-sc',
      body: scanBody(x),
    });
    const scN = counter(s.q('.sc-n b'), 2418, sc.count[0], sc.count[1], (v) => fmt(Math.round(v)));
    const list = s.q('.sc-list'), lens = s.q('.sc-lens'), stamp = s.q('.sc-stamp'), flagRow = s.q('.sc-flagrow');
    const wait = s.q('.sc-w'), alertTx = s.q('.sc-h'), dot = s.q('.sc-w i'), flag = s.q('.sc-fw');

    // 5. summary and the question
    const m = workBeat(x, { T: sm }, {
      say: 'Your tracker is ready.',
      title: 'Memecoin tracker',
      sub: 'Axiom, read-only',
      steps: ['Saved your watchlist and rules'],
      cls: 'wk-sm',
      body: summaryBody(),
    });
    const ask = sayLine(x, 'Want me to turn on alerts?', sm.ask);

    // sam's reply, typed in the composer, then superbot's last message: the Axiom page with the alerts over it
    const uMsg = x.userMsg(REPLY);
    const fMsg = x.sbMsg();
    const say3 = sayLine(x, `Alerts are on. Here's ${PAGE.s} on Axiom.`, fin.r);
    const ax = axiomCard(x);
    fMsg.lastElementChild.append(say3.n, ax);
    const q = (sel) => ax.querySelector(sel);
    const cs = [...ax.querySelectorAll('.ax-c')].map((g, i) => ({ g, v: g.querySelector('.ax-vb'), i }));
    const band = q('.ax-band'), pl = q('.ax-pl'), tag = q('.ax-tag');
    const alOn = q('.ax-alh em'), volRule = q('.ax-r-vol');
    const toasts = [...ax.querySelectorAll('.ax-toast')];
    // iOS-style stack: the newest lands on top at full size, older ones tuck under it, smaller and dimmer
    const PEEK = 7, SHRINK = 0.05;

    return {
      nodes: [a.sayEl, a.card, b.sayEl, b.card, chip.node, s.sayEl, s.card, m.sayEl, m.card, ask.n],
      after: [uMsg, fMsg],
      routes: [ds],
      types: [{ s: u.s, typeEnd: u.typeEnd, send: u.send, text: REPLY }],
      marks: [...a.marks, ...b.marks, [ds.sw, chip.node], ...s.marks, [sc.alert, s.card], [sc.alert + 0.3, s.card], ...m.marks, [sm.ask, ask.n], [u.send, uMsg], [fin.r, say3.n], [fin.card, ax]],
      render(t) {
        // 1. watchlist rows land one by one, holders count up
        a.render(t);
        wRows.forEach((n, i) => rise(n, t, wl.rows + i * 0.1, 6));
        wHold.forEach((c) => c(t));

        // 2. rules: each switch slides on
        b.render(t);
        sws.forEach((n, i) => {
          const p = outCubic(seg(t, ar.on + i * 0.3, ar.on + i * 0.3 + 0.22));
          n.classList.toggle('on', p > 0.5);
          knobs[i].style.transform = `translateX(${(p * 14).toFixed(2)}px)`;
        });

        chip.render(t);

        // 4. scan
        s.render(t);
        scN(t);
        list.style.transform = `translateY(${(-SCROLL_TO * roll(seg(t, sc.roll[0], sc.roll[1]))).toFixed(2)}px)`;
        const hp = seg(t, sc.alert, sc.alert + 0.35);
        const flagged = t >= sc.alert;
        lens.classList.toggle('on', flagged);
        flagRow.classList.toggle('on', flagged);
        // the two pills never share the frame: "Watching" is gone before "ALERT" lands
        wait.style.opacity = (1 - seg(t, sc.alert - 0.05, sc.alert + 0.08)).toFixed(3);
        dot.style.opacity = (0.35 + 0.65 * (0.5 + 0.5 * Math.cos((t - sc.count[1]) * 6))).toFixed(3);
        const hq = seg(t, sc.alert + 0.08, sc.alert + 0.3);
        alertTx.style.opacity = hq.toFixed(3);
        alertTx.style.transform = `scale(${lerp(0.85, 1, outBack(hq)).toFixed(4)})`;
        stamp.style.opacity = outCubic(hp).toFixed(3);
        stamp.style.transform = `translateY(-50%) scale(${lerp(1.6, 1, outBack(hp)).toFixed(4)}) rotate(${lerp(-14, -6, outCubic(hp)).toFixed(2)}deg)`;
        grow(flag, seg(t, sc.alert + 0.2, sc.alert + 0.55));

        // 5. summary, the question, sam's reply
        m.render(t);
        ask.render(t);
        rise(uMsg, t, u.send);
        rise(fMsg, t, fin.r);
        say3.render(t);

        // 6. the page: rises in, candles draw left to right, the flagged window's volume grows with the alert
        const ci = seg(t, fin.card, fin.card + 0.5), ce = outCubic(ci);
        ax.style.opacity = ce.toFixed(3);
        ax.style.transform = ci >= 1 ? '' : `translateY(${((1 - ce) * 16).toFixed(2)}px) scale(${lerp(0.975, 1, ce).toFixed(4)})`;
        const hv = seg(t, fin.draw[0], fin.draw[1]) * N;
        const sv = outBack(seg(t, fin.toast[2] - 0.35, fin.toast[2] + 0.1));
        cs.forEach(({ g, v, i }) => {
          g.style.opacity = clamp(hv - i).toFixed(3);
          const vh = VOL[i] * VB * (i >= SPIKE0 ? lerp(0.32, 1, clamp(sv, 0, 1.2)) : 1);
          v.setAttribute('y', (CH - TA - vh).toFixed(2));
          v.setAttribute('height', vh.toFixed(2));
        });
        const tg = seg(t, fin.draw[1] - 0.1, fin.draw[1] + 0.2);
        pl.style.opacity = tg.toFixed(3); tag.style.opacity = tg.toFixed(3);
        band.style.opacity = seg(t, fin.toast[2] - 0.1, fin.toast[2] + 0.25).toFixed(3);
        alOn.classList.toggle('on', t >= fin.toast[0]);
        volRule.classList.toggle('hot', t >= fin.toast[2]);

        // notifications: each drops in from above, the ones before it tuck under
        toasts.forEach((n, i) => {
          const p = outCubic(seg(t, fin.toast[i], fin.toast[i] + 0.4));
          let under = 0;
          for (let j = i + 1; j < toasts.length; j++) under += outCubic(seg(t, fin.toast[j], fin.toast[j] + 0.4));
          n.style.opacity = (clamp(p * 1.4) * (1 - 0.3 * Math.min(under, 1.5))).toFixed(3);
          n.style.zIndex = String(10 + i);
          n.style.transform = `translateY(${(under * PEEK - (1 - p) * 26).toFixed(2)}px) scale(${(lerp(0.94, 1, p) - under * SHRINK).toFixed(4)})`;
          n.classList.toggle('under', under > 0.5);
        });
      },
    };
  },
};
