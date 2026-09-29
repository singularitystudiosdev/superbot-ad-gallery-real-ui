// The middle of this spot: one superbot work card that walks the whole trading lifecycle in place, in the hub
// thread, instead of revealing a finished site. Four phases run end to end inside a fixed-height stage in the
// card's body, so the card never changes height and the thread never reflows:
//
//   1 BACKTEST  four named strategies scored over history; the figures count up, the three that lose are
//               struck through, greyed and stamped CUT, the one that survives gets PASS.
//   2 PAPER     the survivor trades a paper account labelled "Paper account, $5,000 play money": the equity
//               line draws left to right from the account it opened with, and a paper ticket fills.
//   3 CONNECT   the routing chips from the reference spot (chips [[app, label], ...], sw -> swap -> done) land:
//               "Paper run passed", then "Connected to Axiom". The venue's plain letter tile grows into the
//               hub rail while the composer's platform chip swaps to the venue, then the live ticket fills.
//   4 RESULTS   the honest scoreboard of the LIVE run: winner, realized P&L on the live stake, win rate with
//               the losing count, max drawdown and the open position. No multipliers, no hype, no promises.
//
// Every value is written from the scene's lt, so ?t=<s> and window.__AD.seek(t) reproduce any frame exactly.
// Paper and live are separate accounts on separate curves: the paper curve is drawn in phase 2 and ends at
// start + paper pnl, the live curve ends at stake + live pnl and the scoreboard's drawdown is read off it, so
// no figure on screen is typed in twice or claims a paper result as a live one.
import { clamp, lerp, seg, outCubic, outQuint, inOutCubic, outBack } from '../../../lib.js';
import { workBeat, stdTimes, equityChart, counter, fmt } from './wk.js';
import V from '../../../variant.js';

const B = V.bot;
const P = B.paper;
const LIV = B.live;
const L = LIV.ticket;
const R = B.results;
const bump = (p) => Math.sin(Math.PI * clamp(p));
const money = (n) => '$' + fmt(Math.round(n));
const signed = (n) => (n > 0 ? '+' : n < 0 ? '-' : '') + Math.abs(n).toFixed(1) + '%';

// ---- the two runs are separate accounts: the paper curve is drawn, the live curve is what the scoreboard's
// drawdown is read off. Both end exactly at start + their own P&L, so no figure is typed in twice. ----
function equity(start, total, shape) {
  const sum = shape.reduce((a, b) => a + b, 0) || 1;
  const k = total / sum;
  const out = [start];
  let v = start;
  for (const w of shape) { v += w * k; out.push(v); }
  out[out.length - 1] = start + total;
  return out;
}
function worstDrop(series) {
  let peak = series[0], dd = 0;
  for (const v of series) { if (v > peak) peak = v; dd = Math.min(dd, (v - peak) / peak); }
  return dd * 100;
}
const PAPER = equity(P.start, P.pnl, P.shape);
const LIVE = equity(LIV.stake, LIV.pnl, LIV.shape);
const LO = Math.floor((Math.min(...PAPER) - 40) / 100) * 100;
const HI = Math.ceil((Math.max(...PAPER) + 40) / 100) * 100;
const TICKS = (() => { const t = []; for (let v = Math.ceil(LO / 500) * 500; v <= HI; v += 500) t.push(v); return t; })();
const LIVE_DD = worstDrop(LIVE);

// ---- the beat's clock ----
const DUR = 14.6, HOLD = 1.6;
export function times(r) {
  const T = stdTimes(r, V.steps.length, DUR, HOLD);
  const b = T.body;
  T.bt = [b + 0.18, b + 4.30];
  T.pt = [b + 4.30, b + 8.70];
  T.cn = [b + 8.70, b + 13.10];
  T.rs = [b + 13.10, T.end + 0.4];   // the scoreboard holds right up to the scene's own fade
  T.phase = [T.bt, T.pt, T.cn, T.rs];
  // the connect chips use the reference spot's timing: each lands (sw), moves the chip (swap) and resolves (done)
  const cn = T.cn[0];
  T.chips = [
    { sw: cn + 0.30, swap: cn + 0.52, done: cn + 0.95 },
    { sw: cn + 1.07, swap: cn + 1.29, done: cn + 1.72 },
  ];
  T.rail = [cn + 1.80, cn + 2.45];   // the venue tile grows into the hub rail
  T.live = [cn + 2.55, cn + 4.10];   // the live ticket fills on the venue
  return T;
}

// ---------- markup ----------
const head = (title, sub) => `<div class="lc-h"><small>${title}</small><span>${sub}</span></div>`;

const btHTML = () => {
  const last = B.strategies.length - 1;
  const rows = B.strategies.map((s, i) => `<div class="lc-br" data-i="${i}">
      <span class="lc-bn">${s.name}<i class="lc-bs"></i></span>
      <b class="lc-bv">0.0%</b>
      <span class="lc-btag ${i === last ? 'pass' : 'cut'}">${i === last ? 'PASS' : 'CUT'}</span>
      <span class="lc-bb"><i></i></span>
      <span class="lc-bm">win <b>0</b>% · dd <b>0.0</b>%</span>
    </div>`).join('');
  return `<div class="lc-p lc-bt">${head('BACKTEST', B.universe)}<div class="lc-rows">${rows}</div></div>`;
};

const ticketHTML = (kind, tk) => `<div class="lc-tk ${kind}">
    <span class="lc-tag">${kind === 'live' ? 'LIVE' : 'PAPER'}</span>
    <div class="lc-tkm"><b>${tk.side} ${tk.units}</b><small>${kind === 'live' ? `filled on ${B.venue.name} at ${tk.px}` : `filled at ${tk.px}`}</small></div>
    <span class="lc-tkv">${tk.total}</span>
    <span class="lc-fill">FILLED</span>
  </div>`;

const ptHTML = (chartHtml) => `<div class="lc-p lc-pt">${head('PAPER TRADE', `${P.days} day replay, no real money`)}
    <div class="lc-pill"><i></i>${P.label}</div>
    <div class="lc-chart">${chartHtml}</div>
    ${ticketHTML('paper', P.ticket)}</div>`;

const cnHTML = (x) => `<div class="lc-p lc-cn">${head('CONNECT', 'same rules, real fills')}
    <div class="lc-chips">
      <span class="qc-sw" data-c="0"><span class="qc-tile qc-t-superbot"><img src="${x.sbSrc}" alt=""/></span><span class="qc-swl">Paper run passed</span><span class="qc-st"><i class="qc-spin"></i>${x.OK}</span></span>
      <span class="qc-sw" data-c="1"><span class="qc-tile qc-t-venue">${B.venue.tile}</span><span class="qc-swl">Connected to ${B.venue.name}</span><span class="qc-st"><i class="qc-spin"></i>${x.OK}</span></span>
    </div>
    ${ticketHTML('live', L)}</div>`;

const rsHTML = (x) => `<div class="lc-p lc-rs">${head('RESULTS', `${P.days} days live`)}
    <div class="lc-win"><span class="lc-wt">${x.OK}</span><b>${R.winner}</b><em>WINNER</em></div>
    <div class="lc-kpis">
      <div class="lc-k"><small>Realized P&amp;L</small><b class="lc-pnl">$0</b><span>live stake ${money(LIV.stake)}</span></div>
      <div class="lc-k"><small>Win rate</small><b class="lc-wr">0%</b><span>${R.wins}W · ${R.losses}L of ${R.trades}</span></div>
      <div class="lc-k"><small>Max drawdown</small><b class="lc-dd">0.0%</b><span>worst peak to trough</span></div>
      <div class="lc-k"><small>Open position</small><b class="lc-op">${R.open.name}</b><span>${R.open.sub}</span></div>
    </div>
    <small class="lc-foot">Demo figures. Live stake ${money(LIV.stake)}. Live ran below paper after fees and slippage. Trading carries risk.</small></div>`;

const bodyHTML = (chartHtml, x) => `<div class="lc">
  <div class="lc-bar">${['Backtest', 'Paper trade', 'Connect', 'Results'].map((s, i) => `<span class="lc-sg" data-s="${i}"><b>${i + 1}</b>${s}<i class="lc-sgp"></i></span>`).join('')}</div>
  <div class="lc-stage">${btHTML()}${ptHTML(chartHtml)}${cnHTML(x)}${rsHTML(x)}</div>
</div>`;

// ---------- build ----------
export function build(k, x) {
  const T = k.T;
  const chart = equityChart({
    W: 476, H: 132, lo: LO, hi: HI, ticks: TICKS, L: 44, R: 56, accent: '#34d399',
    yfmt: (v) => `$${(v / 1000).toFixed(1)}k`,
    xl: [[0, 'day 1'], [(PAPER.length - 1) / 2, `day ${Math.round((PAPER.length - 1) / 2)}`], [PAPER.length - 1, `day ${P.days}`]],
    series: [{ v: PAPER, cls: 'eq-up', tag: `+${money(P.pnl)}` }],
  });
  const wb = workBeat(x, k, {
    say: V.say, title: V.workTitle, sub: V.workSub, steps: V.steps, body: bodyHTML(chart.html, x),
  });
  const el = (s) => wb.card.querySelector(s);
  const els = (s) => [...wb.card.querySelectorAll(s)];
  const a0 = T.bt[0], p0 = T.pt[0], c0 = T.cn[0], r0 = T.rs[0];

  const stages = els('.lc-p');
  const segs = els('.lc-sg');
  const rows = els('.lc-br').map((n, i) => {
    const s = B.strategies[i];
    const at = a0 + 0.10 + i * 0.44;
    return {
      n, s, die: i, bar: n.querySelector('.lc-bb i'), strike: n.querySelector('.lc-bs'),
      tag: n.querySelector('.lc-btag'),
      cRet: counter(n.querySelector('.lc-bv'), s.ret, at + 0.16, at + 1.02, (v) => signed(v)),
      cWin: counter(n.querySelectorAll('.lc-bm b')[0], s.win, at + 0.16, at + 1.02, (v) => String(Math.round(v))),
      cDd: counter(n.querySelectorAll('.lc-bm b')[1], s.dd, at + 0.16, at + 1.02, (v) => v.toFixed(1)),
    };
  });
  const pill = el('.lc-pill');
  const chartSvg = el('.lc-chart svg.eq');
  const tks = els('.lc-tk').map((n) => ({ n, fill: n.querySelector('.lc-fill') }));
  const chips = els('.lc-cn .qc-sw').map((n) => ({
    n, tile: n.firstElementChild, spin: n.querySelector('.qc-spin'), ok: n.querySelector('.qc-st .qc-ok'),
  }));
  const win = el('.lc-win');
  const kpis = els('.lc-k');
  const cPnl = counter(el('.lc-pnl'), LIV.pnl, r0 + 0.42, r0 + 1.42, (v) => `+${money(v)}`);
  const cWinRate = counter(el('.lc-wr'), R.winRate, r0 + 0.42, r0 + 1.32, (v) => `${Math.round(v)}%`);
  const cDd = counter(el('.lc-dd'), LIVE_DD, r0 + 0.42, r0 + 1.32, (v) => `${v.toFixed(1)}%`);

  // ---- hub level: the rail opens once, the venue tile lands in it, the composer chip swaps ----
  const hub = x.hub;
  hub.classList.add('qc-hub-split');
  const rail = hub.querySelector('.rail');
  const railBits = [...rail.children];
  const venueTile = x.el(`<span class="rail-item qc-rail-venue"><b>${B.venue.tile}</b><i></i></span>`);
  rail.insertBefore(venueTile, railBits[1].nextSibling);
  // the composer's platform chip is built by chat.js AFTER every beat has been built, so it is looked up
  // lazily on the frame that first needs it
  const plat = hub.querySelector('.rc-plat');
  let platIcon = null, platLabel = null;
  let chipOn = null;

  function renderHub(t) {
    const rp = inOutCubic(seg(t, 0.25, 1.00));
    hub.style.gridTemplateColumns = `${(64 * rp).toFixed(2)}px minmax(0, 1fr)`;
    for (const n of railBits) n.style.opacity = rp.toFixed(3);
    venueTile.style.opacity = seg(t, T.rail[0], T.rail[0] + 0.25).toFixed(3);
    venueTile.style.transform = `scale(${lerp(0.15, 1, outBack(seg(t, T.rail[0] + 0.04, T.rail[1]))).toFixed(4)})`;
    // the composer's platform chip: dips out, swaps to the venue, comes back (the reference spot's tile swap)
    const swap = T.chips[1].swap;
    const on = t >= swap;
    if (on !== chipOn) {
      if (!platIcon) { platIcon = plat.querySelector('.qc-pi'); platLabel = plat.querySelector('.qc-pl'); }
      if (platIcon) {
        chipOn = on;
        platIcon.innerHTML = on ? `<b class="qc-vt">${B.venue.tile}</b>` : `<img alt="" src="${x.sbSrc}" data-app="superbot"/>`;
        platLabel.textContent = on ? B.venue.name : 'superbot';
      }
    }
    plat.style.opacity = (1 - 0.85 * bump(seg(t, swap - 0.14, swap + 0.14))).toFixed(3);
    plat.style.transform = `scale(${(1 + 0.08 * bump(seg(t, swap, swap + 0.4))).toFixed(4)})`;
  }

  function renderBacktest(t) {
    const last = rows.length - 1;
    rows.forEach((r, i) => {
      const at = a0 + 0.10 + i * 0.44;
      const live = outCubic(seg(t, at, at + 0.34));
      // the three that lose are cut one after another; the survivor is the last row and never gets a cut
      const cutAt = a0 + 2.50 + i * 0.30;
      const cut = i < last ? seg(t, cutAt, cutAt + 0.30) : 0;
      const pass = i === last ? seg(t, a0 + 3.30, a0 + 3.64) : 0;
      r.n.style.opacity = (live * (1 - 0.56 * cut)).toFixed(3);
      r.n.style.transform = live >= 1 ? '' : `translateY(${((1 - live) * 9).toFixed(2)}px)`;
      r.cRet(t); r.cWin(t); r.cDd(t);
      const g = outQuint(seg(t, at + 0.16, at + 1.02)) * (Math.abs(r.s.ret) / 30);
      r.bar.style.width = `${(g * 100).toFixed(2)}%`;
      r.bar.style.background = r.s.ret < 0 ? 'var(--lc-dn)' : 'var(--lc-up)';
      r.strike.style.transform = `scaleX(${cut.toFixed(3)})`;
      const st = cut + pass;
      r.tag.style.opacity = st.toFixed(3);
      r.tag.style.transform = `scale(${lerp(1.45, 1, outBack(st)).toFixed(4)})`;
      r.n.classList.toggle('alive', pass > 0.6);
    });
  }

  function renderPaper(t) {
    const pi = seg(t, p0 + 0.06, p0 + 0.40);
    pill.style.opacity = pi.toFixed(3);
    pill.style.transform = pi >= 1 ? '' : `translateY(${((1 - pi) * 7).toFixed(2)}px)`;
    chart.render(chartSvg, outQuint(seg(t, p0 + 0.50, p0 + 2.60)), seg(t, p0 + 2.50, p0 + 3.00));
    const td = p0 + 2.90;
    const i = outCubic(seg(t, td, td + 0.40));
    const tk = tks[0];
    tk.n.style.opacity = i.toFixed(3);
    tk.n.style.transform = i >= 1 ? '' : `translateY(${((1 - i) * 10).toFixed(2)}px)`;
    const f = seg(t, td + 0.55, td + 0.95);
    tk.fill.style.opacity = f.toFixed(3);
    tk.fill.style.transform = `scale(${lerp(1.6, 1, outBack(f)).toFixed(4)})`;
  }

  function renderConnect(t) {
    chips.forEach((c, i) => {
      const k2 = T.chips[i];
      const live = outCubic(seg(t, k2.sw, k2.sw + 0.42));
      c.n.style.opacity = live.toFixed(3);
      c.n.style.transform = live >= 1 ? 'none' : `translateY(${((1 - live) * 10).toFixed(2)}px)`;
      c.n.classList.toggle('qc-done', t >= k2.done);
      c.n.style.setProperty('--sh', `${(100 - ((t - k2.sw) * 140) % 200).toFixed(1)}%`);
      c.spin.style.opacity = (1 - seg(t, k2.done - 0.08, k2.done + 0.06)).toFixed(3);
      c.spin.style.transform = `rotate(${((t - k2.sw) * 420).toFixed(1)}deg)`;
      const ok = seg(t, k2.done, k2.done + 0.30);
      c.ok.style.opacity = ok.toFixed(3);
      c.ok.style.transform = `scale(${lerp(0.3, 1, outBack(ok)).toFixed(4)})`;
      const tp = outBack(seg(t, k2.sw + 0.05, k2.sw + 0.45));
      c.tile.style.transform = `scale(${lerp(0.5, 1, tp).toFixed(4)}) rotate(${((1 - tp) * -25).toFixed(2)}deg)`;
    });
    const [la] = T.live;
    const i = outCubic(seg(t, la, la + 0.45));
    const tk = tks[1];
    tk.n.style.opacity = i.toFixed(3);
    tk.n.style.transform = i >= 1 ? '' : `translateY(${((1 - i) * 12).toFixed(2)}px)`;
    tk.n.style.boxShadow = `inset 0 0 0 1px rgba(52,211,153,${(0.16 + 0.36 * seg(t, la, la + 0.45)).toFixed(3)})`;
    const f = seg(t, la + 0.60, la + 1.05);
    tk.fill.style.opacity = f.toFixed(3);
    tk.fill.style.transform = `scale(${lerp(1.6, 1, outBack(f)).toFixed(4)})`;
  }

  function renderResults(t) {
    const wi = outCubic(seg(t, r0 + 0.10, r0 + 0.50));
    win.style.opacity = wi.toFixed(3);
    win.style.transform = wi >= 1 ? '' : `translateY(${((1 - wi) * 8).toFixed(2)}px)`;
    cPnl(t); cWinRate(t); cDd(t);
    kpis.forEach((n, i) => {
      const o = outCubic(seg(t, r0 + 0.42 + i * 0.13, r0 + 0.82 + i * 0.13));
      n.style.opacity = o.toFixed(3);
      n.style.transform = o >= 1 ? '' : `translateY(${((1 - o) * 9).toFixed(2)}px)`;
    });
  }

  return {
    nodes: [wb.sayEl, wb.card],
    // the card grows while it is answered and again when the body lands, so the thread re-folds on both
    marks: [...wb.marks, [T.body + 0.45, wb.card], [T.done, wb.card]],
    render(t) {
      wb.render(t);
      renderHub(t);
      stages.forEach((n, i) => {
        const [a, b] = T.phase[i];
        // each panel fades in over 0.12s from its own start and out over its own last 0.12s, in sequence: the
        // two never share the screen, so no two phase labels are ever superimposed. The last panel does not fade
        // at all, the scene's own fade takes it.
        const fin = seg(t, a, a + 0.12);
        const fout = i === T.phase.length - 1 ? 0 : seg(t, b - 0.12, b);
        n.style.opacity = (fin * (1 - fout)).toFixed(3);
        const sg = segs[i];
        sg.classList.toggle('on', t >= a && t < b);
        sg.querySelector('.lc-sgp').style.transform = `scaleX(${seg(t, a, b).toFixed(4)})`;
      });
      if (t < T.bt[1] + 0.4) renderBacktest(t);
      if (t >= p0 - 1.0 && t < T.pt[1] + 0.4) renderPaper(t);
      if (t >= c0 - 1.0 && t < T.cn[1] + 0.4) renderConnect(t);
      if (t >= r0 - 0.8) renderResults(t);
    },
  };
}

export default { times, build };