// Beat 1: "make me a prediction market trading bot". superbot routes to Polymarket the way the every-model spot
// routes to DoorDash (a "Connecting to Polymarket" chip that shimmers, spins and resolves to a check while the
// composer chip follows the app), answers as "Polymarket in superbot", then runs two work cards: the backtest
// (five strategies, return bars, the winner's equity curve against holding) and the live scan (a market counter,
// then three flagged buys with price vs fair odds). It closes on a summary card that asks to start. Every string
// and figure comes from ../../../variant.js; every value is written from lt.
import { lerp, seg, outCubic, outBack } from '../../../lib.js';
import { workBeat, stdTimes, equityChart, fmt } from './wk.js';
import V from '../../../variant.js';

const B = V.backtest, S = V.scan, M = V.summary;
const FLAG = '<svg class="pb-fl" viewBox="0 0 24 24"><path d="M5 21V4M5 4h11l-2 4 2 4H5"/></svg>';
const pct = (n) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(Math.round(n))}%`;

// the winner's backtest curve (18 months, one point a fortnight) against holding the favourite: deterministic
const CURVE = (() => {
  const top = B.rows[0][2], n = 40, v = [0];
  for (let i = 1; i < n; i++) {
    const p = i / (n - 1);
    v.push(+(top * (0.82 * p + 0.18 * p * p) + 3.2 * Math.sin(i * 1.7) * (1 - p * 0.6) - (i > 14 && i < 19 ? 5 : 0)).toFixed(2));
  }
  v[n - 1] = top;
  return v;
})();
const HOLD = CURVE.map((_, i) => +(9 * (i / (CURVE.length - 1)) + 2.4 * Math.sin(i * 1.3 + 1)).toFixed(2));
HOLD[HOLD.length - 1] = 9;

export function times(r) {
  const T = { r };
  // the routing chip: lands, the composer chip swaps to Polymarket, it resolves
  T.sw = r + 0.05; T.swap = T.sw + 0.3; T.done = T.sw + 1.05; T.who = T.done + 0.08;
  // card 1: the backtest
  T.c1 = stdTimes(T.who + 0.22, B.steps.length, 1.95, 0);
  // card 2: the scan (the first step holds while the market counter runs)
  const r2 = T.c1.done + 0.35, card = r2 + 0.22;
  T.c2 = { r: r2, card, steps: [[card + 0.18, card + 1.15], [card + 0.6, card + 1.35]] };
  T.c2.body = card + 1.4; T.c2.bodyEnd = T.c2.body + 0.5; T.c2.done = T.c2.body + 1.35;
  // the summary card
  T.sum = T.c2.done + 0.35;
  T.rows = M.rows.map((_, i) => T.sum + 0.35 + i * 0.16);
  T.q = T.rows[T.rows.length - 1] + 0.3;
  T.end = T.q + 0.95;
  return T;
}

function backtestBody(chart) {
  const max = Math.max(...B.rows.map((r) => Math.abs(r[2])));
  const rows = B.rows.map(([n, wr, ret], i) => `<div class="pb-row${i ? '' : ' pb-top'}" style="--w:${(Math.abs(ret) / max).toFixed(4)}">
    <span class="pb-n">${n}${i ? '' : '<i class="pb-best">Best</i>'}</span>
    <span class="pb-wr"><b>0</b>%</span>
    <span class="pb-ret${ret < 0 ? ' pb-neg' : ''}"><span class="pb-bar"><i></i></span><b>0%</b></span></div>`).join('');
  return `<div class="pb-bt">
    <div class="pb-cols"><span>Strategy</span><span>Win rate</span><span>18-mo return</span></div>
    ${rows}
    <div class="pb-eq"><div class="pb-eqh"><small>${B.rows[0][0]} vs holding the favourite</small></div>${chart.html}</div>
  </div>`;
}

function scanBody() {
  const rows = S.flags.map(([m, tag, px, fair], i) => `<div class="pb-fr" style="--px:${px}%;--fair:${fair}%">
    <span class="pb-ic pb-ic${i}">${tag.slice(0, 3).toUpperCase()}</span>
    <span class="pb-m"><b>${m}</b><small>${tag} · Yes <em>${px}¢</em> · fair <em>${fair}%</em></small>
      <span class="pb-od"><i class="pb-odm"></i><i class="pb-odf"></i></span></span>
    <span class="pb-edge">${FLAG}+${fair - px}¢</span>
    <i class="pb-sweep"></i></div>`).join('');
  return `<div class="pb-sc"><div class="pb-sch">${FLAG}<b>${S.flags.length} flagged buys</b><span>of ${fmt(S.markets)} live markets</span></div>${rows}</div>`;
}

export function build(k, x) {
  const T = k.T;
  const pm = x.img('polymarket-icon.svg');
  // the routing chip, then the routed app's header (the DoorDash route's exact parts)
  const sw = x.el(`<div class="pb-swr"><span class="qc-sw"><span class="qc-tile qc-t-polymarket"><img src="${pm}" alt=""/></span><span class="qc-swl">Connecting to Polymarket</span><span class="qc-st"><i class="qc-spin"></i>${x.OK}</span></span></div>`);
  const chip = sw.firstElementChild, tile = chip.querySelector('.qc-tile'), lbl = chip.querySelector('.qc-swl'),
    spin = chip.querySelector('.qc-spin'), ok = chip.querySelector('.qc-ok');
  const who = x.el(`<div class="qc-who"><span class="qc-tile qc-t-polymarket"><img src="${pm}" alt=""/></span><b>Polymarket</b><small>in superbot</small><span class="pb-acct"><i></i>${V.connect.handle} · ${V.connect.cash}</span></div>`);

  const chart = equityChart({
    W: 472, H: 104, lo: -10, hi: 70, ticks: [0, 30, 60], L: 30, R: 44,
    xl: [[0, 'Mar ’25'], [20, 'Dec'], [39, 'Sep']],
    series: [{ v: CURVE, cls: 'eq-s', tag: pct(B.rows[0][2]) }, { v: HOLD, cls: 'eq-p', tag: pct(9) }],
  });
  const c1 = workBeat(x, { T: T.c1 }, { say: B.say, title: B.title, sub: B.sub, steps: B.steps, body: backtestBody(chart), cls: 'pb-card' });
  const c2 = workBeat(x, { T: T.c2 }, {
    say: S.say, title: S.title, sub: S.sub, cls: 'pb-card',
    steps: [`Scanning <b class="pb-cnt">0</b> live markets`, `Pricing every market with ${B.rows[0][0]}`],
    body: scanBody(),
  });
  const sum = x.el(`<div class="pb-sum"><div class="pb-smh"><img src="${x.sbSrc}" alt=""/><b>Summary</b><span>ready to trade</span></div>
    ${M.rows.map(([a, b]) => `<div class="pb-smr"><span>${a}</span><b>${b}</b></div>`).join('')}
    <div class="pb-smq">${M.ask}</div></div>`);

  const btRows = c1.qa('.pb-row').map((n, i) => ({ n, top: i === 0, bar: n.querySelector('.pb-bar i'), wr: n.querySelector('.pb-wr b'), ret: n.querySelector('.pb-ret b'), best: n.querySelector('.pb-best'), d: B.rows[i] }));
  const svg = c1.q('svg.eq');
  const cnt = c2.q('.pb-cnt');
  const fr = c2.qa('.pb-fr').map((n) => ({ n, sweep: n.querySelector('.pb-sweep'), edge: n.querySelector('.pb-edge'), odf: n.querySelector('.pb-odf'), odm: n.querySelector('.pb-odm') }));
  const smRows = [...sum.querySelectorAll('.pb-smr')], smQ = sum.querySelector('.pb-smq');
  const text = (n, s) => { if (n.textContent !== s) n.textContent = s; };

  function renderChip(t) {
    const a = seg(t, T.sw, T.sw + 0.4), e = outBack(a);
    sw.style.opacity = seg(t, T.sw, T.sw + 0.2).toFixed(3);
    tile.style.transform = `scale(${lerp(0.5, 1, e).toFixed(4)}) rotate(${lerp(-25, 0, e).toFixed(2)}deg)`;
    const done = t >= T.done;
    chip.classList.toggle('qc-done', done);
    text(lbl, done ? 'Connected to Polymarket' : 'Connecting to Polymarket');
    chip.style.setProperty('--sh', `${(100 - ((t - T.sw) * 140) % 200).toFixed(1)}%`);
    spin.style.opacity = (1 - seg(t, T.done - 0.06, T.done + 0.06)).toFixed(3);
    spin.style.transform = `rotate(${((t - T.sw) * 420).toFixed(1)}deg)`;
    const o = seg(t, T.done, T.done + 0.3);
    ok.style.opacity = o.toFixed(3);
    ok.style.transform = `scale(${lerp(0.3, 1, outBack(o)).toFixed(4)})`;
    const w = outCubic(seg(t, T.who, T.who + 0.45));
    who.style.opacity = w.toFixed(3);
    who.style.transform = w >= 1 ? 'none' : `translateY(${((1 - w) * 8).toFixed(2)}px)`;
  }

  function renderBacktest(t) {
    const b = T.c1.body;
    btRows.forEach((r, i) => {
      const a = b + 0.12 + i * 0.12, p = outCubic(seg(t, a, a + 0.4));
      r.n.style.opacity = p.toFixed(3);
      r.n.style.transform = p >= 1 ? 'none' : `translateX(${((1 - p) * -10).toFixed(2)}px)`;
      const g = outCubic(seg(t, a + 0.1, a + 0.85));
      r.bar.style.transform = `scaleX(${g.toFixed(4)})`;
      text(r.wr, String(Math.round(r.d[1] * g)));
      text(r.ret, pct(r.d[2] * g));
      if (r.top) {
        // the winner lights up once every row has landed: a sweep across it and the Best badge pops
        const w = seg(t, b + 1.5, b + 1.95);
        r.n.classList.toggle('pb-lit', t >= b + 1.5);
        r.n.style.setProperty('--sw', `${lerp(-30, 130, outCubic(w)).toFixed(1)}%`);
        r.best.style.opacity = seg(w, 0, 0.3).toFixed(3);
        r.best.style.transform = `scale(${lerp(0.4, 1, outBack(w)).toFixed(4)})`;
      }
    });
    chart.render(svg, outCubic(seg(t, b + 0.45, b + 1.6)), seg(t, b + 1.5, b + 1.95));
  }

  function renderScan(t) {
    const [a, z] = T.c2.steps[0];
    text(cnt, fmt(Math.round(S.markets * outCubic(seg(t, a + 0.05, z - 0.05)))));
    const b = T.c2.body;
    fr.forEach((r, i) => {
      const at = b + 0.12 + i * 0.26, p = outCubic(seg(t, at, at + 0.42));
      r.n.style.opacity = p.toFixed(3);
      r.n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * 10).toFixed(2)}px) scale(${lerp(0.97, 1, p).toFixed(4)})`;
      const s = seg(t, at + 0.1, at + 0.7);
      r.sweep.style.opacity = (s > 0 && s < 1 ? Math.sin(Math.PI * s) : 0).toFixed(3);
      r.sweep.style.left = `${lerp(-30, 110, s).toFixed(1)}%`;
      // price bar fills to the market price, then the fair-value tick slides out past it
      r.odm.style.transform = `scaleX(${outCubic(seg(t, at + 0.15, at + 0.55)).toFixed(4)})`;
      const f = outCubic(seg(t, at + 0.45, at + 0.85));
      r.odf.style.opacity = seg(f, 0, 0.3).toFixed(3);
      r.odf.style.left = `calc(var(--px) + (var(--fair) - var(--px)) * ${f.toFixed(4)})`;
      const e = seg(t, at + 0.62, at + 0.98);
      r.edge.style.opacity = seg(e, 0, 0.35).toFixed(3);
      r.edge.style.transform = `scale(${lerp(0.5, 1, outBack(e)).toFixed(4)})`;
      r.n.classList.toggle('pb-flag', t >= at + 0.62);
    });
  }

  function renderSummary(t) {
    const p = outCubic(seg(t, T.sum, T.sum + 0.5));
    sum.style.opacity = p.toFixed(3);
    sum.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * 14).toFixed(2)}px) scale(${lerp(0.975, 1, p).toFixed(4)})`;
    smRows.forEach((n, i) => {
      const o = outCubic(seg(t, T.rows[i], T.rows[i] + 0.38));
      n.style.opacity = o.toFixed(3);
      n.style.transform = o >= 1 ? 'none' : `translateX(${((1 - o) * -8).toFixed(2)}px)`;
    });
    const q = outCubic(seg(t, T.q, T.q + 0.4));
    smQ.style.opacity = q.toFixed(3);
    smQ.style.transform = q >= 1 ? 'none' : `translateY(${((1 - q) * 6).toFixed(2)}px)`;
  }

  return {
    nodes: [sw, who, c1.sayEl, c1.card, c2.sayEl, c2.card, sum],
    marks: [[T.sw, sw], [T.who, who], ...c1.marks, [T.c1.body + 0.5, c1.card], [T.c1.done, c1.card],
      ...c2.marks, [T.c2.body + 0.6, c2.card], [T.c2.done, c2.card], [T.sum, sum], [T.q, sum]],
    render(t) {
      renderChip(t);
      c1.render(t); renderBacktest(t);
      c2.render(t); renderScan(t);
      renderSummary(t);
    },
  };
}

export default { times, build };
