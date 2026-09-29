// Beat 2: sam says go. superbot re-opens the market it is watching in its card, then the window grows out of the
// thread to fill the frame (the hub spots' shared grow). The page copies polymarket.com's own market screen (nav with
// the real wordmark, category row, market header, chance line with its dotted grid and right-hand axis) with the
// right rail cropped to information only: a read-only market-info card (Yes / No odds as readouts, 24h volume,
// liquidity, holders, end date) and superbot's alert-rules card. There is no order ticket, no portfolio and no
// holding on this page. The watched market's odds climb across the last hour; as each rule trips, a superbot
// notification drops in over the chart and the rule it came from lights up. Every figure comes from
// ../../../variant.js, and every value is a function of lt.
import { lerp, seg, clamp, outCubic, outBack, inOutCubic, boxIn } from '../../../lib.js';
import { workBeat, stdTimes } from './wk.js';
import V from '../../../variant.js';

const L = V.live, RULES = V.rules.rows;
const ab = (s) => s.slice(0, 3).toUpperCase();
const bump = (p) => Math.sin(Math.PI * clamp(p));
const ICON = {
  search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/></svg>',
  trend: '<svg viewBox="0 0 24 24"><path d="M3 17l6-6 4 4 8-8M15 7h6v6"/></svg>',
  link: '<svg viewBox="0 0 24 24"><path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1"/></svg>',
  mark: '<svg viewBox="0 0 24 24"><path d="M6 4h12v16l-6-4-6 4z"/></svg>',
  cup: '<svg viewBox="0 0 24 24"><path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M9 20h6"/></svg>',
  clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/></svg>',
  bell: '<svg viewBox="0 0 24 24"><path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/></svg>',
  eye: '<svg viewBox="0 0 24 24"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
};

// the watched market's chance over the 6H window, one point every 4 minutes, flat around the opening odds until the
// last hour's move (the final sixth of the chart), which is drawn live
const N = 90, MOVE = 74;
const SERIES = (() => {
  const a = L.from, b = L.to, v = [];
  for (let i = 0; i < MOVE; i++) v.push(a - 1.6 + 1.3 * Math.sin(i * 0.9) + 0.9 * Math.sin(i * 2.3 + 1) + (i / MOVE) * 1.4);
  for (let i = MOVE; i < N; i++) {
    const p = (i - MOVE) / (N - 1 - MOVE), ss = p * p * (3 - 2 * p);
    const noise = (1.3 * Math.sin(i * 2.1) + 0.8 * Math.sin(i * 0.7)) * (1 - p);
    v.push(a + (b - a) * (0.35 * p + 0.65 * ss) + noise - 1.8 * Math.exp(-((i - 82) ** 2) / 3));
  }
  v[MOVE] = a; v[N - 1] = b;
  return v.map((x) => +x.toFixed(2));
})();
const VW = 800, VH = 300, LO = 0, HI = 100; // the chart's viewBox; the SVG stretches, strokes stay crisp (non-scaling-stroke)
const cx = (i) => (VW * i) / (N - 1), cy = (v) => VH * (1 - (v - LO) / (HI - LO));
const PATH = SERIES.map((v, i) => `${i ? 'L' : 'M'}${cx(i).toFixed(2)},${cy(v).toFixed(2)}`).join('');

// which rule each notification comes from: odds move, volume spike, odds move again (the headline)
const NOTE_RULE = [0, 1, 0];

// the head walks the last hour's move from the opening odds to the top between T.c0 and T.c1
const headAt = (T, t) => MOVE + (N - 1 - MOVE) * (0.3 * seg(t, T.c0, T.c1) + 0.7 * inOutCubic(seg(t, T.c0, T.c1)));
const chanceAt = (f) => { const i = Math.min(N - 2, Math.floor(f)), fr = f - i; return lerp(SERIES[i], SERIES[i + 1], fr); };

export function times(r) {
  const T = stdTimes(r, L.steps.length, 0.6, 0);
  T.grow = T.body + 1.0; T.growEnd = T.grow + 0.85;
  // the last hour plays out: the head walks the move while the alerts fire
  T.c0 = T.growEnd + 0.35;
  T.c1 = T.c0 + 5.2;
  // notifications: the moment the move first reads +11 pts, the volume spike between that and the top, the full
  // move once the head lands (read off the series, so the alert and the number on the page always agree)
  let first = T.c1;
  for (let t = T.c0; t <= T.c1; t += 0.01) if (Math.round(chanceAt(headAt(T, t))) >= L.from + 11) { first = +t.toFixed(2); break; }
  T.notes = [first, +((first + T.c1) / 2).toFixed(2), T.c1 + 0.1];
  T.end = T.growEnd + 7.83;
  return T;
}

function pageHtml(mode, logo, sb) {
  const yl = [100, 75, 50, 25, 0].map((v) => `<span class="pm-yl" style="top:${100 - v}%">${v}%</span>`).join('');
  const grid = [100, 75, 50, 25, 0].map((v) => `<line x1="0" x2="${VW}" y1="${cy(v)}" y2="${cy(v)}"/>`).join('');
  const xl = ['3pm', '4:30pm', '6pm', '7:30pm', 'Now'].map((s, i) => `<span style="left:${i * 25}%">${s}</span>`).join('');
  const cats = ['Politics', 'Sports', 'Crypto', 'Economy', 'Tech', 'Culture', 'Weather', 'Geopolitics']
    .map((c) => `<span${c === L.tag ? ' class="on"' : ''}>${c}</span>`).join('');
  const rules = RULES.map(([rule, detail]) => `<div class="pm-rl"><span class="pm-rb">${ICON.bell}</span>
      <span class="pm-rt"><b>${rule}</b><small>${detail}</small></span><span class="pm-rs"><i class="pm-rw">watching</i><i class="pm-rf">alert sent</i></span></div>`).join('');
  const notes = L.notes.map(([title, detail]) => `<div class="pm-note"><img class="pm-nsb" src="${sb}" alt=""/>
      <span class="pm-nt"><small>superbot · alert · now</small><b>${title}</b><em>${detail}</em></span></div>`).join('');
  return `<div class="pm-win pm-${mode}">
  <div class="pm-bar"><span class="pm-dots"><i></i><i></i><i></i></span><span class="pm-url"><svg class="pm-lk" viewBox="0 0 24 24"><rect x="4" y="10" width="16" height="11" rx="2.5"/><path d="M8 10V7.5a4 4 0 0 1 8 0V10"/></svg>polymarket.com/event/fed-cuts-rates-in-december</span></div>
  <div class="pm-view"><div class="pm-page">
    <nav class="pm-nav"><img class="pm-wm" src="${logo}" alt="Polymarket"/>
      <span class="pm-search">${ICON.search}Search polymarkets...</span>
      <span class="pm-ro">${ICON.eye}Read-only</span><span class="pm-av"></span></nav>
    <div class="pm-cats"><span class="pm-tr">${ICON.trend}Trending</span><span>Breaking</span><span>New</span><i></i>${cats}</div>
    <div class="pm-grid">
      <section class="pm-mkt">
        <div class="pm-mh"><span class="pm-ic pm-ic0 pm-mi">${ab(L.tag)}</span>
          <span class="pm-mt"><small>${L.tag} · Fed</small><h1>${L.market}</h1></span>
          <span class="pm-bot"><i></i>superbot watching</span><span class="pm-tool">${ICON.link}</span><span class="pm-tool">${ICON.mark}</span></div>
        <div class="pm-ch"><b class="pm-chn">${L.from}%</b><span>chance</span><em class="pm-dl">▲ 0 pts · 1h</em></div>
        <div class="pm-chart">
          <span class="pm-wmk"><img src="${logo}" alt=""/></span>
          <svg class="pm-svg" viewBox="0 0 ${VW} ${VH}" preserveAspectRatio="none">
            <defs><clipPath id="pmc-${mode}"><rect class="pm-clip" x="-4" y="-10" width="0" height="${VH + 20}"/></clipPath></defs>
            <g class="pm-grd">${grid}</g>
            <rect class="pm-hr" x="${cx(MOVE).toFixed(2)}" y="0" width="${(VW - cx(MOVE)).toFixed(2)}" height="${VH}"/>
            <g clip-path="url(#pmc-${mode})"><path class="pm-line" d="${PATH}"/></g>
          </svg>
          <span class="pm-hrl" style="left:${((cx(MOVE) / VW) * 100).toFixed(3)}%">last 1h</span>
          <div class="pm-yls">${yl}</div>
          <i class="pm-head"><i class="pm-ring"></i></i>
          <div class="pm-xl">${xl}</div>
          <div class="pm-notes">${notes}</div>
        </div>
        <div class="pm-vol"><span>${ICON.cup}${L.volume} Vol.</span><i></i><span>${ICON.clock}Dec 10, 2026</span>
          <span class="pm-rng"><span>1H</span><span class="on">6H</span><span>1D</span><span>1W</span><span>1M</span><span>ALL</span></span></div>
      </section>
      <div class="pm-info">
        <div class="pm-ih"><b>Market info</b><span>${ICON.eye}read-only</span></div>
        <div class="pm-odds"><span class="pm-oy"><small>Yes</small><b class="pm-yp">${L.from}%</b></span><span class="pm-on"><small>No</small><b class="pm-np">${100 - L.from}%</b></span></div>
        <div class="pm-kv"><span>24h volume</span><b class="pm-v24">$1.9M</b></div>
        <div class="pm-kv"><span>Liquidity</span><b>${L.liquidity}</b></div>
        <div class="pm-kv"><span>Holders</span><b>${L.holders}</b></div>
        <div class="pm-kv"><span>Ends</span><b>Dec 10, 2026</b></div>
      </div>
      <aside class="pm-side">
        <div class="pm-al"><div class="pm-alh"><img src="${sb}" alt=""/><b>superbot alerts</b><span class="pm-aln">0 sent</span></div>${rules}
          <div class="pm-dg">${ICON.clock}Daily digest · every morning at 9am</div></div>
      </aside>
    </div>
  </div></div>
</div>`;
}

export function build(k, x) {
  const T = k.T;
  const logo = x.img('polymarket-wordmark.svg');
  const wb = workBeat(x, k, { say: L.say, title: L.title, sub: L.sub, steps: L.steps, body: pageHtml('card', logo, x.sbSrc), cls: 'pm-wk' });
  const revWin = x.el(pageHtml('rev', logo, x.sbSrc));
  x.root.appendChild(revWin);

  const view = (root) => {
    const q = (s) => root.querySelector(s), qa = (s) => [...root.querySelectorAll(s)];
    return {
      win: root, view: q('.pm-view'), page: q('.pm-page'), clip: q('.pm-clip'), head: q('.pm-head'), ring: q('.pm-ring'),
      chn: q('.pm-chn'), dl: q('.pm-dl'), bot: q('.pm-bot'), yp: q('.pm-yp'), np: q('.pm-np'), v24: q('.pm-v24'), aln: q('.pm-aln'),
      rules: qa('.pm-rl').map((n) => ({ n, w: n.querySelector('.pm-rw'), f: n.querySelector('.pm-rf') })),
      notes: qa('.pm-note'),
    };
  };
  const cv = view(wb.card.querySelector('.pm-win')), rv = view(revWin);
  const text = (n, s) => { if (n.textContent !== s) n.textContent = s; };

  // 24h volume ticks up with the move (from $1.9M to $5.8M: the "3x" spike the second alert reports)
  const volAt = (t) => lerp(1.9, 5.8, outCubic(seg(t, T.c0 + 0.6, T.notes[1] + 0.2)));

  function paint(w, t) {
    const f = headAt(T, t), ch = chanceAt(f);
    const hx = lerp(cx(Math.floor(f)), cx(Math.min(N - 1, Math.floor(f) + 1)), f - Math.floor(f));
    w.clip.setAttribute('width', (hx + 5).toFixed(2));
    w.head.style.left = `${((hx / VW) * 100).toFixed(3)}%`;
    w.head.style.top = `${((cy(ch) / VH) * 100).toFixed(3)}%`;
    const rp = ((t * 1.1) % 1 + 1) % 1;
    w.ring.style.transform = `scale(${lerp(1, 2.6, rp).toFixed(3)})`;
    w.ring.style.opacity = (0.45 * (1 - rp)).toFixed(3);
    const c = Math.round(ch), d = Math.max(0, c - L.from);
    text(w.chn, `${c}%`);
    text(w.dl, `▲ ${d} pts · 1h`);
    w.dl.style.opacity = seg(t, T.c0, T.c0 + 0.3).toFixed(3);
    text(w.yp, `${c}%`); text(w.np, `${100 - c}%`);
    text(w.v24, `$${volAt(t).toFixed(1)}M`);
    w.bot.classList.toggle('pm-on', t >= T.growEnd);

    // rules light up as their alerts go out
    let sent = 0;
    T.notes.forEach((a) => { if (t >= a) sent++; });
    text(w.aln, `${sent} sent`);
    w.aln.classList.toggle('pm-hot', sent > 0);
    w.rules.forEach((r, i) => {
      const fired = T.notes.filter((_, j) => NOTE_RULE[j] === i);
      const first = fired.length ? Math.min(...fired) : Infinity;
      const on = seg(t, first, first + 0.3);
      const pulse = Math.max(0, ...fired.map((a) => bump(seg(t, a, a + 0.7))));
      r.n.classList.toggle('pm-fire', t >= first);
      r.n.style.background = pulse > 0.01 ? `rgba(76,130,251,${(0.14 * pulse).toFixed(3)})` : '';
      r.w.style.opacity = (1 - on).toFixed(3);
      r.f.style.opacity = on.toFixed(3);
    });

    // notifications stack in over the chart: newest on top, older ones slide down one slot. Narrow frames have a
    // short chart, so they keep the two newest (the third fades out as it is pushed down)
    const key = (window.AR && window.AR.key) || '16x9', narrow = key === '4x5' || key === '1x1';
    const SLOT = narrow ? 78 : 92;
    w.notes.forEach((n, i) => {
      const a = T.notes[i], p = outCubic(seg(t, a, a + 0.4));
      const slide = T.notes.slice(i + 1).reduce((s, b) => s + outCubic(seg(t, b, b + 0.4)), 0);
      const deep = clamp(slide - 1);   // 0 until a second newer note has landed on top of this one
      n.style.opacity = (p * (1 - deep * (narrow ? 1 : 0.45))).toFixed(3);
      n.style.transform = `translateY(${((1 - p) * -24 + slide * SLOT).toFixed(2)}px) scale(${lerp(0.94, 1, outBack(p)).toFixed(4)})`;
      n.classList.toggle('pm-new', t >= a && t < a + 1.0);
    });
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
    paint(cv, t);
    paint(rv, t);
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
  }

  return {
    nodes: [wb.sayEl, wb.card],
    marks: [...wb.marks, [T.body + 0.45, wb.card], [T.done, wb.card]],
    render(t) { wb.render(t); renderSite(t); },
  };
}

export default { times, build };