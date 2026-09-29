// Beat 2: sam says go. superbot arms the bot and opens Polymarket in its card, then the window grows out of the
// thread to fill the frame (the winnings spot's grow). The page copies polymarket.com's own market screen (nav with
// the real wordmark, category row, market header, chance line with its dotted grid and right-hand axis, the trade
// card with Buy/Sell, Yes/No price buttons, Amount, +$ chips and the blue Trade button) and the bot drives it: for
// each flagged market the trade card switches market, selects Yes, types the stake and presses Trade, and a fill
// toast lands. Then the lead market's chance climbs to a Yes resolution while the Yes/No buttons tick with it,
// positions rise, two resolve Won (a quiet sweep, a rising +$ label, a small burst) and the portfolio settles on
// its total. Every figure comes from ../../../variant.js (stake / entry = shares, shares x price = value), and
// every value, particle included, is a function of lt.
import { lerp, seg, clamp, outCubic, outBack, inOutCubic, boxIn, rand } from '../../../lib.js';
import { workBeat, stdTimes, fmt } from './wk.js';
import V from '../../../variant.js';

const L = V.live, CASH0 = V.cash;
const P = L.positions.map(([m, tag, stake, e, f, yes]) => ({ m, tag, stake, e, f, yes, sh: (stake / e) * 100 })); // fractional shares: value at entry == stake
const ab = (s) => s.slice(0, 3).toUpperCase();
const money = (n) => (n < 0 ? '−' : '') + '$' + fmt(Math.abs(n), 2);
const signed = (n) => (n >= 0 ? '+' : '−') + '$' + fmt(Math.abs(n), 2);
const bump = (p) => Math.sin(Math.PI * clamp(p));
const CHECK = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const ICON = {
  search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/></svg>',
  trend: '<svg viewBox="0 0 24 24"><path d="M3 17l6-6 4 4 8-8M15 7h6v6"/></svg>',
  link: '<svg viewBox="0 0 24 24"><path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1"/></svg>',
  mark: '<svg viewBox="0 0 24 24"><path d="M6 4h12v16l-6-4-6 4z"/></svg>',
  cup: '<svg viewBox="0 0 24 24"><path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M9 20h6"/></svg>',
  clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/></svg>',
  chev: '<svg viewBox="0 0 24 24"><path d="M7 10l5 5 5-5"/></svg>',
};

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
  // each order: the trade card switches market, types the stake, Trade is pressed, the fill lands
  T.ord = P.map((_, i) => T.growEnd + 0.15 + i * 0.78);
  T.fills = T.ord.map((o) => o + 0.62);
  T.c0 = T.fills[P.length - 1] + 0.45;   // the climb
  T.c1 = T.c0 + 3.2;
  T.win = P.map((p, i) => (!p.yes ? null : i === 0 ? T.c1 : T.c0 + 1.85)); // resolutions (the lead market last)
  T.fin = T.c1 + 0.25;                    // the total lands
  T.end = T.fin + 1.6;
  return T;
}

function pageHtml(mode, logo) {
  const lead = P[0];
  const yl = [100, 75, 50, 25, 0].map((v) => `<span class="pm-yl" style="top:${100 - v}%">${v}%</span>`).join('');
  const grid = [100, 75, 50, 25, 0].map((v) => `<line x1="0" x2="${VW}" y1="${cy(v)}" y2="${cy(v)}"/>`).join('');
  const xl = ['Oct 1', 'Oct 15', 'Nov 1', 'Nov 15', 'Dec 1'].map((s, i) => `<span style="left:${i * 25}%">${s}</span>`).join('');
  const cats = ['Politics', 'Sports', 'Crypto', 'Economy', 'Tech', 'Culture', 'Weather', 'Geopolitics']
    .map((c) => `<span${c === 'Economy' ? ' class="on"' : ''}>${c}</span>`).join('');
  const rows = P.map((p, i) => `<div class="pm-pr">
      <span class="pm-ic pm-ic${i}">${ab(p.tag)}</span>
      <span class="pm-pt"><b>${p.m}</b><small><i class="pm-yes">Yes ${p.e}¢</i>${fmt(Math.round(p.sh))} shares<i class="pm-won">${CHECK}Won</i></small></span>
      <span class="pm-pv"><b>${money(p.stake)}</b><small>+$0.00</small></span>
<i class="pm-flash"></i></div>`).join('');
  const toasts = P.map((p) => `<div class="pm-toast"><span class="pm-tb">${CHECK}</span><span><b>Order filled</b><small>Bought ${fmt(Math.round(p.sh))} Yes · ${p.m}</small></span><em>${money(p.stake)}</em></div>`).join('');
  return `<div class="pm-win pm-${mode}">
  <div class="pm-bar"><span class="pm-dots"><i></i><i></i><i></i></span><span class="pm-url"><svg class="pm-lk" viewBox="0 0 24 24"><rect x="4" y="10" width="16" height="11" rx="2.5"/><path d="M8 10V7.5a4 4 0 0 1 8 0V10"/></svg>polymarket.com/event/fed-cuts-rates-in-december</span></div>
  <div class="pm-view"><div class="pm-page">
    <nav class="pm-nav"><img class="pm-wm" src="${logo}" alt="Polymarket"/>
      <span class="pm-search">${ICON.search}Search polymarkets...</span>
      <span class="pm-nv"><small>Portfolio</small><b class="pm-nvp">${money(CASH0)}</b></span>
      <span class="pm-nv"><small>Cash</small><b class="pm-nvc">${money(CASH0)}</b></span>
      <span class="pm-dep">Deposit</span><span class="pm-av"></span></nav>
    <div class="pm-cats"><span class="pm-tr">${ICON.trend}Trending</span><span>Breaking</span><span>New</span><i></i>${cats}</div>
    <div class="pm-grid">
      <section class="pm-mkt">
        <div class="pm-mh"><span class="pm-ic pm-ic0 pm-mi">${ab(lead.tag)}</span>
          <span class="pm-mt"><small>${lead.tag} · Fed</small><h1>${lead.m}</h1></span>
          <span class="pm-bot"><i></i>superbot bot</span><span class="pm-tool">${ICON.link}</span><span class="pm-tool">${ICON.mark}</span></div>
        <div class="pm-ch"><b class="pm-chn">${lead.e}%</b><span>chance</span><em class="pm-dl">▲ 0%</em><span class="pm-res">${CHECK}Resolved · Yes</span></div>
        <div class="pm-chart">
          <span class="pm-wmk"><img src="${logo}" alt=""/></span>
          <svg class="pm-svg" viewBox="0 0 ${VW} ${VH}" preserveAspectRatio="none">
            <defs><clipPath id="pmc-${mode}"><rect class="pm-clip" x="-4" y="-10" width="0" height="${VH + 20}"/></clipPath></defs>
            <g class="pm-grd">${grid}</g>
            <g clip-path="url(#pmc-${mode})"><path class="pm-line" d="${PATH}"/></g>
          </svg>
          <div class="pm-yls">${yl}</div>
          <i class="pm-buy" style="left:${((cx(BUY) / VW) * 100).toFixed(3)}%;top:${((cy(lead.e) / VH) * 100).toFixed(3)}%"><b></b><span>Bot bought Yes · ${lead.e}¢</span></i>
          <i class="pm-head"><i class="pm-ring"></i></i>
          <div class="pm-xl">${xl}</div>
        </div>
        <div class="pm-vol"><span>${ICON.cup}$18,204,381 Vol.</span><i></i><span>${ICON.clock}Dec 10, 2026</span>
          <span class="pm-rng"><span>1H</span><span>6H</span><span>1D</span><span>1W</span><span>1M</span><span class="on">ALL</span></span></div>
      </section>
      <div class="pm-trade">
        <div class="pm-th"><span class="pm-ic pm-ic0 pm-tic">${ab(lead.tag)}</span><span><small class="pm-tm">${lead.m}</small><b>Buy <em>Yes</em></b></span></div>
        <div class="pm-bs"><span class="on">Buy</span><span>Sell</span><span class="pm-mk">Market${ICON.chev}</span></div>
        <div class="pm-yn"><span class="pm-y">Yes <b class="pm-yp">${lead.e}¢</b></span><span class="pm-n">No <b class="pm-np">${100 - lead.e + 1}¢</b></span></div>
        <div class="pm-amt"><span>Amount</span><b class="pm-av2">$0</b></div>
        <div class="pm-chips"><span>+$1</span><span>+$5</span><span>+$10</span><span>+$100</span></div>
        <div class="pm-win2"><span>To win</span><b class="pm-tw">$0.00</b></div>
        <span class="pm-go">Trade</span>
      </div>
      <aside class="pm-side">
        <div class="pm-pf"><small>Portfolio</small>
          <div class="pm-tot"><b class="pm-big">${money(CASH0)}</b><em class="pm-gain">+0%</em></div>
          <span class="pm-pl">+$0.00 (0.00%) <small>All-Time</small></span></div>
        <div class="pm-pos"><div class="pm-poh"><b>Positions</b><span class="pm-pn">0</span></div>${rows}</div>
      </aside>
    </div>
    <div class="pm-toasts">${toasts}</div>
    ${mode === 'rev' ? '<canvas class="pm-fx"></canvas>' + P.map(() => '<b class="pm-float"></b>').join('') : ''}
  </div></div>
</div>`;
}

export function build(k, x) {
  const T = k.T;
  const logo = x.img('polymarket-wordmark.svg');
  const wb = workBeat(x, k, { say: L.say, title: L.title, sub: L.sub, steps: L.steps, body: pageHtml('card', logo), cls: 'pm-wk' });
  const revWin = x.el(pageHtml('rev', logo));
  x.root.appendChild(revWin);

  const view = (root) => {
    const q = (s) => root.querySelector(s), qa = (s) => [...root.querySelectorAll(s)];
    return {
      win: root, view: q('.pm-view'), page: q('.pm-page'), clip: q('.pm-clip'), head: q('.pm-head'), ring: q('.pm-ring'),
      buy: q('.pm-buy'), chn: q('.pm-chn'), dl: q('.pm-dl'), res: q('.pm-res'), big: q('.pm-big'), gain: q('.pm-gain'), pl: q('.pm-pl'),
      nvp: q('.pm-nvp'), nvc: q('.pm-nvc'), pn: q('.pm-pn'), bot: q('.pm-bot'),
      tic: q('.pm-tic'), tm: q('.pm-tm'), y: q('.pm-y'), yp: q('.pm-yp'), np: q('.pm-np'), amt: q('.pm-av2'), tw: q('.pm-tw'), go: q('.pm-go'),
      chips: qa('.pm-chips span'),
      rows: qa('.pm-pr').map((n) => ({ n, val: n.querySelector('.pm-pv b'), pl: n.querySelector('.pm-pv small'), won: n.querySelector('.pm-won'), flash: n.querySelector('.pm-flash'), pv: n.querySelector('.pm-pv') })),
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
  const winPulse = (t) => Math.max(0, ...T.win.filter((w) => w !== null).map((w) => bump(seg(t, w, w + 0.7))), bump(seg(t, T.fin, T.fin + 0.9)));

  // the trade card: which order it is on, how much of the stake is typed, and the Trade press
  function paintTrade(w, t, ch) {
    let i = 0;
    T.ord.forEach((o, j) => { if (t >= o) i = j; });
    const o = T.ord[i], p = P[i], after = t >= T.fills[P.length - 1] + 0.3;
    const mi = after ? 0 : i, mp = P[mi];
    text(w.tm, mp.m);
    text(w.tic, ab(mp.tag));
    w.tic.className = `pm-ic pm-ic${mi} pm-tic`;
    // prices on the buttons: the order's entry while ordering, then the lead market live
    const yes = after ? Math.round(ch) : mp.e;
    text(w.yp, yes >= 100 ? '99.9¢' : `${yes}¢`);
    text(w.np, yes >= 100 ? '0.1¢' : `${100 - yes + 1}¢`);
    // typing the stake: $0, then the digits count up to the stake while the bot taps +$100
    const ty = after ? 0 : seg(t, o + 0.1, o + 0.42);
    const typed = t < o ? 0 : Math.round(p.stake * outCubic(ty) / 10) * 10;
    text(w.amt, `$${fmt(after ? 0 : typed)}`);
    w.amt.classList.toggle('on', !after && typed > 0);
    text(w.tw, money(after || t < o ? 0 : (typed / p.e) * 100));
    w.chips.forEach((c, j) => c.classList.toggle('on', j === 3 && ty > 0 && ty < 1));
    const press = !after ? seg(t, o + 0.46, o + 0.62) : 0;
    w.go.style.transform = `translateY(${(2 * bump(press)).toFixed(2)}px)`;
    w.go.classList.toggle('pm-down', press > 0 && press < 1);
    w.y.classList.toggle('pm-sel', t >= T.ord[0] - 0.05);
  }

  function paint(w, t, b) {
    // chart: history is drawn from the start, the climb draws itself with a live head
    const f = headAt(t), ch = chanceAt(f);
    const hx = lerp(cx(Math.floor(f)), cx(Math.min(N - 1, Math.floor(f) + 1)), f - Math.floor(f));
    w.clip.setAttribute('width', (hx + 5).toFixed(2));
    w.head.style.left = `${((hx / VW) * 100).toFixed(3)}%`;
    w.head.style.top = `${((cy(ch) / VH) * 100).toFixed(3)}%`;
    const rp = ((t * 1.1) % 1 + 1) % 1;
    w.ring.style.transform = `scale(${lerp(1, 2.6, rp).toFixed(3)})`;
    w.ring.style.opacity = (0.45 * (1 - rp)).toFixed(3);
    w.head.style.opacity = (t < T.fills[0] ? 1 : seg(t, T.c0, T.c0 + 0.2)).toFixed(3);
    const bi = outBack(seg(t, T.fills[0], T.fills[0] + 0.4));
    w.buy.style.opacity = seg(t, T.fills[0], T.fills[0] + 0.2).toFixed(3);
    w.buy.style.transform = `translate(-6px, -50%) scale(${lerp(0.4, 1, bi).toFixed(4)})`;
    text(w.chn, `${Math.round(ch)}%`);
    text(w.dl, `▲ ${Math.max(0, Math.round(ch - P[0].e))}%`);
    w.dl.style.opacity = seg(t, T.c0, T.c0 + 0.3).toFixed(3);
    const rs = seg(t, T.c1, T.c1 + 0.4);
    w.res.style.opacity = seg(rs, 0, 0.4).toFixed(3);
    w.res.style.transform = `scale(${lerp(0.8, 1, outCubic(rs)).toFixed(4)})`;
    w.bot.classList.toggle('pm-on', t >= T.ord[0]);
    paintTrade(w, t, ch);

    // positions: each fills in, ticks with its price, and the winners resolve
    let n = 0;
    w.rows.forEach((r, i) => {
      const s = b.rows[i], a = T.fills[i], p = outCubic(seg(t, a, a + 0.4));
      if (s.filled) n++;
      r.n.style.opacity = p.toFixed(3);
      r.n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * 10).toFixed(2)}px)`;
      text(r.val, money(Math.max(s.val, 0) || P[i].stake));
      const pc = s.filled ? (s.pl / P[i].stake) * 100 : 0;
      text(r.pl, `${signed(s.filled ? s.pl : 0)} (${fmt(Math.abs(pc), 1)}%)`);
      r.pl.classList.toggle('pm-neg', s.pl < -0.005);
      const climbing = t > T.c0 && (T.win[i] === null ? t < T.c1 : t < T.win[i]);
      const fl = climbing ? Math.pow(Math.max(0, Math.sin((t - T.c0 + i * 0.17) * Math.PI * 2 / 0.62)), 4) : 0;
      r.pv.style.background = `rgba(61,180,104,${(0.16 * fl).toFixed(3)})`;
      const wt = T.win[i];
      const wn = wt === null ? 0 : seg(t, wt, wt + 0.4);
      r.won.style.opacity = seg(wn, 0, 0.4).toFixed(3);
      r.won.style.transform = `scale(${lerp(0.7, 1, outBack(wn)).toFixed(4)})`;
      const sw = wt === null ? 0 : seg(t, wt, wt + 0.9);
      r.flash.style.opacity = (sw > 0 && sw < 1 ? 0.8 * bump(sw) : 0).toFixed(3);
      r.flash.style.transform = `translateX(${lerp(-100, 100, outCubic(sw)).toFixed(1)}%)`;
    });
    text(w.pn, String(n));

    // the totals
    text(w.nvp, money(b.port)); text(w.nvc, money(b.cash));
    text(w.big, money(b.port));
    const pl = b.port - CASH0, pc = (pl / CASH0) * 100;
    text(w.pl.firstChild, `${signed(pl)} (${pc >= 0 ? '+' : '−'}${fmt(Math.abs(pc), 2)}%) `);
    w.pl.classList.toggle('pm-upt', pl > 0.005);
    const g = winPulse(t);
    w.big.style.textShadow = g > 0.01 ? `0 0 ${(10 + 16 * g).toFixed(1)}px rgba(61,180,104,${(0.35 * g).toFixed(3)})` : 'none';
    const gp = seg(t, T.fin, T.fin + 0.45);
    text(w.gain, `▲ ${fmt(pc, 1)}%`);
    w.gain.style.opacity = seg(gp, 0, 0.4).toFixed(3);
    w.gain.style.transform = `translateX(${((1 - outCubic(gp)) * -8).toFixed(2)}px)`;

    // one fill toast at a time: in, hold, out as the next arrives
    w.toasts.forEach((n2, i) => {
      const a = T.fills[i], z = (T.fills[i + 1] ?? a + 1.4) - 0.05;
      const o = outCubic(seg(t, a, a + 0.3)) * (1 - seg(t, z - 0.2, z));
      n2.style.opacity = o.toFixed(3);
      n2.style.transform = `translateY(${((1 - outCubic(seg(t, a, a + 0.3))) * -14).toFixed(2)}px)`;
    });
  }

  // ---- full-frame only: rising +$ labels and small particle bursts ----
  let fxBox = null;
  function measureFx() {
    const pg = rv.page, at = (n) => boxIn(n, pg);
    fxBox = { rows: rv.rows.map((r) => at(r.pl)), big: at(rv.big), W: pg.offsetWidth, H: pg.offsetHeight };
    const c = rv.fx;
    c.width = fxBox.W * 2; c.height = fxBox.H * 2;
    c.style.width = fxBox.W + 'px'; c.style.height = fxBox.H + 'px';
  }
  const COLORS = ['#3db468', '#7fe0a3', '#ffffff', '#f5c451'];
  function burst(ctx, t, t0, ox, oy, n, seed, power, spread) {
    const dt = t - t0;
    if (dt <= 0 || dt > 1.6) return;
    for (let i = 0; i < n; i++) {
      const r1 = rand(seed + i * 7.1), r2 = rand(seed + i * 3.7 + 11), r3 = rand(seed + i * 5.3 + 23);
      const life = 0.7 + 0.6 * r3;
      if (dt > life) continue;
      const ang = -Math.PI / 2 + (r1 - 0.5) * spread, sp = power * (0.45 + 0.7 * r2);
      const x = ox + Math.cos(ang) * sp * dt, y = oy + Math.sin(ang) * sp * dt + 0.5 * 900 * dt * dt;
      ctx.globalAlpha = clamp(0.85 * (1 - Math.pow(dt / life, 2)));
      ctx.fillStyle = COLORS[Math.floor(r2 * COLORS.length) % COLORS.length];
      const sz = 2.5 + 3 * r1;
      ctx.save(); ctx.translate(x, y); ctx.rotate(dt * (5 + 8 * r3) * (r1 > 0.5 ? 1 : -1));
      if (i % 3 === 0) { ctx.beginPath(); ctx.arc(0, 0, sz * 0.55, 0, Math.PI * 2); ctx.fill(); }
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
      burst(ctx, t, wt + 0.05, o.cx, o.cy, 16, 100 + i * 50, 380, Math.PI * 0.9);
      const u = seg(t, wt + 0.05, wt + 1.3);
      text(f, signed(end.rows[i].pl));
      f.style.left = `${Math.min(o.cx, fxBox.W - 100).toFixed(1)}px`; f.style.top = `${o.y.toFixed(1)}px`;
      f.style.opacity = (seg(u, 0, 0.15) * (1 - seg(u, 0.7, 1))).toFixed(3);
      f.style.transform = `translate(-50%, ${(-8 - 46 * outCubic(u)).toFixed(1)}px)`;
    });
    // the landing: one modest burst out of the total
    const bg = fxBox.big;
    burst(ctx, t, T.fin, bg.cx, bg.cy, 34, 900, 520, Math.PI * 1.4);
  }

  let FW = 0, PH = 0, box = null;
  function measure() {
    const w = (window.AR && window.AR.w) || 1920;
    if (w === FW) return;
    FW = w; PH = 1080 - 30;
    [cv.page, rv.page].forEach((p) => { p.style.width = FW + 'px'; p.style.height = PH + 'px'; });
    const vw = cv.view.clientWidth || 0;
    cv.page.style.transform = `scale(${vw ? vw / FW : 0})`;
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
