// Beat 2: sam says go. superbot arms the bot and opens the Polymarket account in its card, then the window grows
// out of the thread to fill the frame (the winnings spot's grow) and the bot trades it live: three fills land as
// toasts, the lead market's chance line climbs from the bot's entry to a Yes resolution, positions tick up with
// green price flashes, two of them resolve Won (row sweep, rising +$ label, particle burst) and the portfolio
// closes on a glowing total with a burst of its own. Every figure is derived from ../../../variant.js
// (stake / entry = shares, shares x price = value), and every value, particle included, is a function of lt.
import { lerp, seg, clamp, outCubic, outBack, inOutCubic, boxIn, rand } from '../../../lib.js';
import { workBeat, stdTimes, fmt } from './wk.js';
import V from '../../../variant.js';

const L = V.live, CASH0 = V.cash;
const P = L.positions.map(([m, tag, stake, e, f, yes]) => ({ m, tag, stake, e, f, yes, sh: (stake / e) * 100 }));  // fractional shares: value at entry == stake exactly
const ab = (s) => s.slice(0, 3).toUpperCase();
const money = (n) => (n < 0 ? '−' : '') + '$' + fmt(Math.abs(n), 2);
const signed = (n) => (n >= 0 ? '+' : '−') + '$' + fmt(Math.abs(n), 2);
const bump = (p) => Math.sin(Math.PI * clamp(p));
const CHECK = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

// the lead market's chance series: 30 points of history around the entry, then the climb to a Yes resolution
const N = 90, BUY = 30;
const SERIES = (() => {
  const e = P[0].e, v = [];
  for (let i = 0; i < BUY; i++) v.push(e - 3 + 2.2 * Math.sin(i * 0.9) + 1.6 * Math.sin(i * 2.3 + 1) + (i / BUY) * 2.5);
  for (let i = BUY; i < N; i++) {
    const p = (i - BUY) / (N - 1 - BUY), ss = p * p * (3 - 2 * p);
    const noise = (2.6 * Math.sin(i * 2.1) + 1.5 * Math.sin(i * 0.7)) * (1 - p);
    v.push(clamp(e + (100 - e) * (0.45 * p + 0.55 * ss) + noise - 7 * Math.exp(-((i - 52) ** 2) / 14), 1, 99));
  }
  v[BUY] = e; v[N - 1] = 100;
  return v.map((x) => +x.toFixed(2));
})();
const VW = 800, VH = 300; // the chart's viewBox; the SVG stretches, strokes stay crisp (non-scaling-stroke)
const cx = (i) => (VW * i) / (N - 1), cy = (v) => VH * (1 - v / 100);
const PATH = SERIES.map((v, i) => `${i ? 'L' : 'M'}${cx(i).toFixed(2)},${cy(v).toFixed(2)}`).join('');

export function times(r) {
  const T = stdTimes(r, L.steps.length, 0.6, 0);
  T.grow = T.body + 1.0; T.growEnd = T.grow + 0.85;
  T.fills = P.map((_, i) => T.growEnd + 0.2 + i * 0.42);
  T.c0 = T.fills[P.length - 1] + 0.55;   // the climb
  T.c1 = T.c0 + 3.2;
  T.win = P.map((p, i) => (!p.yes ? null : i === 0 ? T.c1 : T.c0 + 1.85)); // resolutions (the lead market last)
  T.fin = T.c1 + 0.25;                    // the total lands
  T.end = T.fin + 1.75;
  return T;
}

function pageHtml(mode) {
  const lead = P[0];
  const yl = [100, 75, 50, 25, 0].map((v) => `<span class="pm-yl" style="top:${100 - v}%">${v}%</span>`).join('');
  const grid = [75, 50, 25].map((v) => `<line x1="0" x2="${VW}" y1="${cy(v)}" y2="${cy(v)}"/>`).join('');
  const xl = ['Oct 1', 'Oct 15', 'Nov 1', 'Nov 15', 'Now'].map((s, i) => `<span style="left:${i * 25}%">${s}</span>`).join('');
  const rows = P.map((p, i) => `<div class="pm-pr">
      <span class="pm-ic pm-ic${i}">${ab(p.tag)}</span>
      <span class="pm-pt"><b>${p.m}</b><small><i class="pm-yes">Yes</i>${fmt(Math.round(p.sh))} shares · avg ${p.e}¢</small></span>
      <span class="pm-pc"><b>${p.e}¢</b></span>
      <span class="pm-pv"><b>${money(p.stake)}</b><small>+$0.00</small></span>
      <i class="pm-won">${CHECK}Won</i><i class="pm-flash"></i></div>`).join('');
  const toasts = P.map((p) => `<div class="pm-toast"><span class="pm-tb">${CHECK}</span><span><b>Bot bought ${fmt(Math.round(p.sh))} Yes</b><small>${p.m} · ${p.e}¢</small></span><em>${money(p.stake)}</em></div>`).join('');
  return `<div class="pm-win pm-${mode}">
  <div class="pm-bar"><span class="pm-dots"><i></i><i></i><i></i></span><span class="pm-url"><svg class="pm-lk" viewBox="0 0 24 24"><rect x="4" y="10" width="16" height="11" rx="2.5"/><path d="M8 10V7.5a4 4 0 0 1 8 0V10"/></svg>polymarket.com/portfolio</span></div>
  <div class="pm-view"><div class="pm-page">
    <nav class="pm-nav"><img class="pm-logo" src="LOGO" alt=""/><b class="pm-brand">Polymarket</b>
      <span class="pm-search">Search polymarket</span>
      <span class="pm-nv"><small>Portfolio</small><b class="pm-nvp">${money(CASH0)}</b></span>
      <span class="pm-nv"><small>Cash</small><b class="pm-nvc">${money(CASH0)}</b></span>
      <span class="pm-av">S</span></nav>
    <div class="pm-grid">
      <section class="pm-mkt">
        <div class="pm-mh"><span class="pm-ic pm-ic0 pm-mi">${ab(lead.tag)}</span>
          <span class="pm-mt"><small>${lead.tag} · $18.2M Vol.</small><h1>${lead.m}</h1></span>
          <span class="pm-bot"><i></i>superbot bot · live</span></div>
        <div class="pm-ch"><b class="pm-chn">${lead.e}%</b><span>chance</span><em class="pm-dl">▲ 0%</em><span class="pm-res">${CHECK}Resolved Yes</span></div>
        <div class="pm-chart">
          <svg class="pm-svg" viewBox="0 0 ${VW} ${VH}" preserveAspectRatio="none">
            <defs><linearGradient id="pmf-${mode}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2e5cff" stop-opacity=".34"/><stop offset="1" stop-color="#2e5cff" stop-opacity="0"/></linearGradient>
              <clipPath id="pmc-${mode}"><rect class="pm-clip" x="0" y="-10" width="0" height="${VH + 20}"/></clipPath></defs>
            <g class="pm-grd">${grid}</g>
            <g clip-path="url(#pmc-${mode})"><path class="pm-area" d="${PATH}L${VW},${VH}L0,${VH}Z" fill="url(#pmf-${mode})"/><path class="pm-line" d="${PATH}"/></g>
            <line class="pm-vx" x1="0" x2="0" y1="0" y2="${VH}"/>
          </svg>
          <div class="pm-yls">${yl}</div>
          <i class="pm-buy" style="left:${((cx(BUY) / VW) * 100).toFixed(3)}%;top:${((cy(lead.e) / VH) * 100).toFixed(3)}%"><b>B</b><span>Bot bought @ ${lead.e}¢</span></i>
          <i class="pm-head"><i class="pm-ring"></i></i>
          <div class="pm-xl">${xl}</div>
        </div>
      </section>
      <aside class="pm-side">
        <div class="pm-pf"><small>Portfolio value</small>
          <div class="pm-tot"><b class="pm-big">${money(CASH0)}</b><em class="pm-gain">+0%</em></div>
          <span class="pm-pl">+$0.00 (0.00%) <small>all time</small></span></div>
        <div class="pm-pos"><div class="pm-poh"><b>Positions</b><span class="pm-pn">0</span><small>Market</small><small>Price</small><small>Value</small></div>${rows}</div>
      </aside>
    </div>
    <div class="pm-toasts">${toasts}</div>
    ${mode === 'rev' ? '<canvas class="pm-fx"></canvas>' + P.map(() => '<b class="pm-float"></b>').join('') : ''}
  </div></div>
</div>`;
}

export function build(k, x) {
  const T = k.T;
  const logo = x.img('polymarket-icon.svg');
  const wb = workBeat(x, k, { say: L.say, title: L.title, sub: L.sub, steps: L.steps, body: pageHtml('card').replace('LOGO', logo), cls: 'pm-wk' });
  const revWin = x.el(pageHtml('rev').replace('LOGO', logo));
  x.root.appendChild(revWin);

  const view = (root) => {
    const q = (s) => root.querySelector(s), qa = (s) => [...root.querySelectorAll(s)];
    return {
      win: root, view: q('.pm-view'), page: q('.pm-page'), clip: q('.pm-clip'), vx: q('.pm-vx'), head: q('.pm-head'), ring: q('.pm-ring'),
      buy: q('.pm-buy'), chn: q('.pm-chn'), dl: q('.pm-dl'), res: q('.pm-res'), big: q('.pm-big'), gain: q('.pm-gain'), pl: q('.pm-pl'),
      nvp: q('.pm-nvp'), nvc: q('.pm-nvc'), pn: q('.pm-pn'), bot: q('.pm-bot'),
      rows: qa('.pm-pr').map((n) => ({ n, pc: n.querySelector('.pm-pc b'), pcw: n.querySelector('.pm-pc'), val: n.querySelector('.pm-pv b'), pl: n.querySelector('.pm-pv small'), won: n.querySelector('.pm-won'), flash: n.querySelector('.pm-flash') })),
      toasts: qa('.pm-toast'), fx: q('.pm-fx'), floats: qa('.pm-float'),
    };
  };
  const cv = view(wb.card.querySelector('.pm-win')), rv = view(revWin);
  const text = (n, s) => { if (n.textContent !== s) n.textContent = s; };

  // the lead market's chance at t: flat at the entry until the climb, then along the series to 100
  const headAt = (t) => BUY + (N - 1 - BUY) * (0.35 * seg(t, T.c0, T.c1) + 0.65 * inOutCubic(seg(t, T.c0, T.c1)));
  const chanceAt = (f) => { const i = Math.min(N - 2, Math.floor(f)), fr = f - i; return lerp(SERIES[i], SERIES[i + 1], fr); };
  function priceOf(i, t) {
    const p = P[i];
    if (i === 0) return chanceAt(headAt(t));
    const z = p.yes ? T.win[i] : T.c1, a = T.c0 + 0.1 + i * 0.1, s = seg(t, a, z);
    if (s >= 1) return p.f;
    return clamp(lerp(p.e, p.f, 0.45 * s + 0.55 * inOutCubic(s)) + 1.8 * Math.sin(t * 9 + i * 2) * Math.sin(Math.PI * s), 1, 99.5);
  }
  function book(t) {
    let cash = CASH0, total = 0;
    const rows = P.map((p, i) => {
      const filled = t >= T.fills[i];
      if (filled) cash -= p.stake;
      const px = priceOf(i, t), val = filled ? (p.sh * px) / 100 : 0;
      total += val;
      return { filled, px, val, pl: val - p.stake };
    });
    return { cash, rows, port: cash + total };
  }
  // a glow pulse for each resolution and the final landing
  const winPulse = (t) => Math.max(0, ...T.win.filter((w) => w !== null).map((w) => bump(seg(t, w, w + 0.7))), 1.25 * bump(seg(t, T.fin, T.fin + 0.9)));

  function paint(w, t, b) {
    // chart: history is drawn from the start, the climb draws itself with a live head
    const f = headAt(t), ch = chanceAt(f);
    const hx = lerp(cx(Math.floor(f)), cx(Math.min(N - 1, Math.floor(f) + 1)), f - Math.floor(f));
    w.clip.setAttribute('width', (hx + 1).toFixed(2));
    w.vx.setAttribute('x1', hx.toFixed(2)); w.vx.setAttribute('x2', hx.toFixed(2));
    w.vx.style.opacity = t > T.c0 && t < T.c1 ? 0.45 : 0;
    w.head.style.left = `${((hx / VW) * 100).toFixed(3)}%`;
    w.head.style.top = `${((cy(ch) / VH) * 100).toFixed(3)}%`;
    const rp = ((t * 1.3) % 1 + 1) % 1;
    w.ring.style.transform = `scale(${lerp(1, 3.4, rp).toFixed(3)})`;
    w.ring.style.opacity = (0.7 * (1 - rp)).toFixed(3);
    // the live head hides on the B marker between the first fill and the climb
    w.head.style.opacity = (t < T.fills[0] ? 1 : seg(t, T.c0, T.c0 + 0.2)).toFixed(3);
    const bi = outBack(seg(t, T.fills[0], T.fills[0] + 0.45));
    w.buy.style.opacity = seg(t, T.fills[0], T.fills[0] + 0.2).toFixed(3);
    w.buy.style.transform = `translate(-13px, -50%) scale(${lerp(0.3, 1, bi).toFixed(4)})`;
    text(w.chn, `${Math.round(ch)}%`);
    text(w.dl, `▲ ${Math.max(0, Math.round(ch - P[0].e))}%`);
    w.dl.style.opacity = seg(t, T.c0, T.c0 + 0.3).toFixed(3);
    const rs = seg(t, T.c1, T.c1 + 0.45);
    w.res.style.opacity = seg(rs, 0, 0.3).toFixed(3);
    w.res.style.transform = `scale(${lerp(0.5, 1, outBack(rs)).toFixed(4)})`;
    w.chn.classList.toggle('pm-up', t >= T.c0);
    w.bot.classList.toggle('pm-on', t >= T.fills[0]);

    // positions: each fills in, ticks with its price, and the winners resolve
    let n = 0;
    w.rows.forEach((r, i) => {
      const s = b.rows[i], a = T.fills[i], p = outCubic(seg(t, a, a + 0.45));
      if (s.filled) n++;
      r.n.style.opacity = p.toFixed(3);
      r.n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * 12).toFixed(2)}px)`;
      text(r.pc, `${Math.round(s.px)}¢`);
      text(r.val, money(Math.max(s.val, 0) || P[i].stake));
      text(r.pl, signed(s.filled ? s.pl : 0));
      r.pl.classList.toggle('pm-neg', s.pl < -0.005);
      const climbing = t > T.c0 && (T.win[i] === null ? t < T.c1 : t < T.win[i]);
      const fl = climbing ? Math.pow(Math.max(0, Math.sin((t - T.c0 + i * 0.17) * Math.PI * 2 / 0.62)), 4) : 0;
      r.pcw.style.background = `rgba(63,208,122,${(0.26 * fl).toFixed(3)})`;
      const wt = T.win[i];
      const wn = wt === null ? 0 : seg(t, wt, wt + 0.45);
      r.won.style.opacity = seg(wn, 0, 0.3).toFixed(3);
      r.won.style.transform = `scale(${lerp(0.4, 1, outBack(wn)).toFixed(4)})`;
      r.n.classList.toggle('pm-wonrow', wn > 0);
      const sw = wt === null ? 0 : seg(t, wt, wt + 0.8);
      r.flash.style.opacity = (sw > 0 && sw < 1 ? bump(sw) : 0).toFixed(3);
      r.flash.style.transform = `translateX(${lerp(-100, 100, outCubic(sw)).toFixed(1)}%)`;
    });
    text(w.pn, String(n));

    // the totals
    text(w.nvp, money(b.port)); text(w.nvc, money(b.cash));
    text(w.big, money(b.port));
    const pl = b.port - CASH0, pc = (pl / CASH0) * 100;
    text(w.pl, `${signed(pl)} (${pc >= 0 ? '+' : '−'}${fmt(Math.abs(pc), 2)}%)`);
    w.pl.classList.toggle('pm-upt', pl > 0.005);
    const g = winPulse(t), live = t > T.c0 ? 0.25 : 0;
    w.big.style.textShadow = `0 0 ${(18 + 46 * g).toFixed(1)}px rgba(63,208,122,${Math.min(0.9, live + 0.55 * g).toFixed(3)})`;
    w.big.classList.toggle('pm-upt', t > T.c0);
    const fin = seg(t, T.fin, T.fin + 0.9);
    w.big.style.transform = `scale(${(1 + 0.07 * bump(fin)).toFixed(4)})`;
    const gp = seg(t, T.fin, T.fin + 0.5);
    text(w.gain, `+${fmt(pc, 1)}%`);
    w.gain.style.opacity = seg(gp, 0, 0.3).toFixed(3);
    w.gain.style.transform = `scale(${lerp(0.4, 1, outBack(gp)).toFixed(4)})`;

    // the bot's fills land as toasts, then fold away
    w.toasts.forEach((n2, i) => {
      const a = T.fills[i], o = outCubic(seg(t, a, a + 0.4)) * (1 - seg(t, a + 2.2, a + 2.6));
      n2.style.opacity = o.toFixed(3);
      n2.style.transform = `translateX(${((1 - outCubic(seg(t, a, a + 0.4))) * 60).toFixed(2)}px)`;
    });
  }

  // ---- full-frame only: rising +$ labels and deterministic particle bursts ----
  let fxBox = null;
  function measureFx() {
    const pg = rv.page;
    const at = (n) => boxIn(n, pg);
    fxBox = {
      rows: rv.rows.map((r) => at(r.pl)), big: at(rv.big),
      W: pg.offsetWidth, H: pg.offsetHeight,
    };
    const c = rv.fx;
    c.width = fxBox.W * 2; c.height = fxBox.H * 2;
    c.style.width = fxBox.W + 'px'; c.style.height = fxBox.H + 'px';
  }
  const COLORS = ['#3fd07a', '#7dffb0', '#ffd23f', '#ffffff', '#2e5cff'];
  function burst(ctx, t, t0, ox, oy, n, seed, power, spread) {
    const dt = t - t0;
    if (dt <= 0 || dt > 2) return;
    for (let i = 0; i < n; i++) {
      const r1 = rand(seed + i * 7.1), r2 = rand(seed + i * 3.7 + 11), r3 = rand(seed + i * 5.3 + 23);
      const life = 0.8 + 0.7 * r3;
      if (dt > life) continue;
      const ang = -Math.PI / 2 + (r1 - 0.5) * spread, sp = power * (0.45 + 0.75 * r2);
      const x = ox + Math.cos(ang) * sp * dt, y = oy + Math.sin(ang) * sp * dt + 0.5 * 1100 * dt * dt;
      const a = 1 - Math.pow(dt / life, 2);
      ctx.globalAlpha = clamp(a);
      ctx.fillStyle = COLORS[Math.floor(r2 * COLORS.length) % COLORS.length];
      const sz = 3 + 5 * r1;
      ctx.save(); ctx.translate(x, y); ctx.rotate(dt * (6 + 10 * r3) * (r1 > 0.5 ? 1 : -1));
      if (i % 3 === 0) { ctx.beginPath(); ctx.arc(0, 0, sz * 0.6, 0, Math.PI * 2); ctx.fill(); }
      else ctx.fillRect(-sz / 2, -sz * 0.3, sz, sz * 0.6);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }
  function renderFx(t) {
    if (t < T.growEnd) { rv.floats.forEach((f) => { f.style.opacity = '0'; }); return; }
    if (!fxBox) measureFx();
    const ctx = rv.fx.getContext('2d');
    ctx.setTransform(2, 0, 0, 2, 0, 0);
    ctx.clearRect(0, 0, fxBox.W, fxBox.H);
    const end = book(T.end);
    P.forEach((p, i) => {
      const wt = T.win[i], f = rv.floats[i], o = fxBox.rows[i];
      if (wt === null) { f.style.opacity = '0'; return; }
      burst(ctx, t, wt + 0.05, o.cx, o.cy, 46, 100 + i * 50, 620, Math.PI * 1.2);
      const u = seg(t, wt + 0.05, wt + 1.3);
      text(f, signed(end.rows[i].pl));
      f.style.left = `${Math.min(o.cx, fxBox.W - 120).toFixed(1)}px`; f.style.top = `${o.y.toFixed(1)}px`;
      f.style.opacity = (seg(u, 0, 0.15) * (1 - seg(u, 0.7, 1))).toFixed(3);
      f.style.transform = `translate(-50%, ${(-10 - 70 * outCubic(u)).toFixed(1)}px) scale(${lerp(0.6, 1, outBack(seg(u, 0, 0.35))).toFixed(3)})`;
    });
    // the landing: a wide burst out of the total, then a second, softer one
    const bg = fxBox.big;
    burst(ctx, t, T.fin, bg.cx, bg.cy, 120, 900, 900, Math.PI * 2);
    burst(ctx, t, T.fin + 0.35, bg.cx, bg.cy, 70, 1500, 700, Math.PI * 1.6);
  }

  let FW = 0, PH = 0, cardScale = 0, box = null;
  function measure() {
    const w = (window.AR && window.AR.w) || 1920;
    if (w === FW) return;
    FW = w; PH = 1080 - 30;
    [cv.page, rv.page].forEach((p) => { p.style.width = FW + 'px'; p.style.height = PH + 'px'; });
    const vw = cv.view.clientWidth || 0;
    cardScale = vw ? vw / FW : 0;
    cv.page.style.transform = `scale(${cardScale})`;
  }

  function renderSite(t) {
    if (!FW) measure();
    const b = book(t);
    paint(cv, t, b);
    paint(rv, t, b);
    const g = inOutCubic(seg(t, T.grow, T.growEnd));
    if (t >= T.grow && !box) box = boxIn(cv.win, x.root);
    const bx = box || { x: 0, y: 0, w: FW, h: 1080 };
    const wpx = lerp(bx.w, FW, g), hpx = lerp(bx.h, 1080, g);
    revWin.style.opacity = t >= T.grow ? '1' : '0';
    revWin.style.left = lerp(bx.x, 0, g).toFixed(2) + 'px';
    revWin.style.top = lerp(bx.y, 0, g).toFixed(2) + 'px';
    revWin.style.width = wpx.toFixed(2) + 'px';
    revWin.style.height = hpx.toFixed(2) + 'px';
    revWin.style.borderRadius = lerp(12, 0, g).toFixed(2) + 'px';
    revWin.style.boxShadow = `0 ${lerp(24, 0, g).toFixed(0)}px ${lerp(60, 0, g).toFixed(0)}px rgba(0,0,0,${(0.6 * (1 - g)).toFixed(2)})`;
    rv.page.style.transform = `scale(${(wpx / FW).toFixed(5)})`;
    x.hub.closest('.sbsite').style.opacity = (1 - seg(t, T.grow + 0.15, T.growEnd)).toFixed(3);
    renderFx(t);
  }

  return {
    nodes: [wb.sayEl, wb.card],
    marks: [...wb.marks, [T.body + 0.45, wb.card], [T.done, wb.card]],
    render(t) { wb.render(t); renderSite(t); },
  };
}

export default { times, build };
