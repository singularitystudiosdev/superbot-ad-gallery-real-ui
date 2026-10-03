// Portfolio beat, the finale: superbot says it is watching, the brokerage's positions list lands in the chat as a card,
// then the card opens to full frame (GROW, deliberate; the grammar of the source's clip card) and the story plays out on
// it: a dark positions list (ticker and shares left, last price and today's % right, a tiny intraday sparkline), every
// row carrying superbot's armed alert chip ("Alert below $X", X = previous close x 0.95). NVDA ticks down from about
// -1.8% through -5%; the tick that crosses flips its row to loss red and its chip to "Text sent"; then a lock-screen
// style Messages notification from superbot slides in and holds, readable, until the end card.
// No trade buttons, no order flow, no return or gain claims anywhere: the header shows the account and today's change.
//
// The full-frame view is ONE layer in the scene root (outside the camera). While the card sits in the chat the layer is
// pinned over the card's picture frame, its content (laid out at the frame's own size) scaled to cover it; GROW
// interpolates the layer to the whole frame. Nothing is swapped or doubled.
// Pure function of t: every value is written from t, so ?t= and __AD.seek freeze any frame. window.__STOCKS.banner is
// the scene-local time the banner lands (the renderer cues its notification chime there).
import { lerp, seg, outCubic, inOutCubic, streamCount, rand } from '../../../lib.js';

const SAY = 'Watching all 5 positions now.';
// [symbol, shares, previous close, today's % (start), drift in % a second]
const POS = [
  ['AAPL', 40, 227.52, 0.40, 0.004],
  ['MSFT', 18, 432.40, -0.30, -0.004],
  ['NVDA', 60, 186.40, -1.80, 0],
  ['AMZN', 25, 217.36, 0.89, 0.004],
  ['VOO', 12, 549.30, -0.20, 0],
];
const HOT = 2;                         // NVDA: the row that crosses
const THRESH = -5;                     // the rule: down more than 5% since yesterday's close
const FINAL = -5.2;                    // where NVDA's slide stops
const ACCOUNT = 'Individual ••4821';
const CPS = 100;
const SAY_AT = 0.05;
const CARD_AT = 0.22;                  // the line streams, then the card lands
const CARD_IN = 0.3;                   // the card rising into the thread
const CARD_HOLD = 0.2; /* deliberate */ // the card sits in the chat, live, before it opens
const GROW = 0.4; /* deliberate */     // the card opens to full frame
const SLIDE_TO_CROSS = 0.5;            // full frame to the tick that crosses -5%
const TICK = 0.08;                     // NVDA's prints come on this grid while it slides
const FLIP = 0.1;                      // the crossing tick to the row turning red and the chip reading Text sent
const BANNER_AT = 0.3;                 // the crossing to the banner starting in
const BANNER_IN = 0.4; /* deliberate */ // the banner sliding down into place
const BANNER_HOLD = 1.35; /* deliberate */ // the banner sits readable (>= 1.2 s) before the scene fades to the end card
const RADIUS = 10;                     // the card's corner radius in the chat, eased to 0 at full frame
const PTS = 40;                        // sparkline points across the session
const SW = 132, SH = 40;               // sparkline box (design px)

const money = (v) => '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pctTxt = (p) => `${p >= 0 ? '+' : '-'}${Math.abs(p).toFixed(2)}%`;
const alertAt = (prev) => Math.round(prev * 0.95 * 100) / 100;

// the intraday shape before the slide: a seeded walk from 0% (the previous close) to the row's start
function history(i) {
  const pts = [];
  let v = 0;
  for (let j = 0; j < PTS; j++) { pts.push(v); v += (rand(i * 613 + j * 29) - 0.5) * 0.55; }
  const end = POS[i][3];
  return pts.map((p, j) => p - (pts[PTS - 1] - end) * (j / (PTS - 1)));
}
const HIST = POS.map((_, i) => history(i));

// NVDA's slide: -1.8% -> -5.0% exactly on the crossing tick (accelerating), then on to FINAL; quantised to TICK
function hotPct(t, T) {
  if (t < T.s0) return POS[HOT][3];
  const q = T.s0 + Math.floor((t - T.s0 + 1e-6) / TICK) * TICK;
  if (q < T.cross) {
    const u = (q - T.s0) / (T.cross - T.s0);
    // stays above the line until the crossing tick itself
    return Math.max(THRESH + 0.06, lerp(POS[HOT][3], THRESH, u * u));
  }
  return lerp(THRESH - 0.04, FINAL, Math.min(1, (q - T.cross) / (3 * TICK)));
}
const calmPct = (i, t) => POS[i][3] + POS[i][4] * t + (rand(Math.floor(t / 0.2) * 11 + i * 71) - 0.5) * 0.03;

const BELL = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.268 21a2 2 0 0 0 3.464 0m-10.47-5.674A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/></svg>';
const CHECK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const LANDMARK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 18v-7m1.119-8.795a2 2 0 0 1 1.762 0l7.84 3.846A.5.5 0 0 1 20.5 7h-17a.5.5 0 0 1-.22-.949zM14 18v-7m4 7v-7M3 22h18M6 18v-7"/></svg>';
const MSG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2zM7 11h10M7 15h6M7 7h8"/></svg>';

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD_AT;                // the card lands in the chat
    T.c0 = T.card + CARD_IN;             // ...and is live once it has landed
    T.grow = T.c0 + CARD_HOLD;           // it starts opening
    T.full = T.grow + GROW;              // full frame
    T.s0 = T.c0;                         // NVDA starts sliding as soon as the card is live
    // the crossing sits on NVDA's own tick grid
    T.cross = T.s0 + Math.round((T.full + SLIDE_TO_CROSS - T.s0) / TICK) * TICK;
    T.flip = T.cross + FLIP;
    T.b0 = T.cross + BANNER_AT;
    T.banner = T.b0 + BANNER_IN;         // the banner has landed (the chime)
    T.end = T.banner + BANNER_HOLD;      // full frame until here, then the scene fades to the end card
    return T;
  },
  build(k, x) {
    const T = k.T;
    window.__STOCKS = { banner: T.banner, cross: T.cross, full: T.full };
    const nvdaFinal = POS[HOT][2] * (1 + FINAL / 100);
    const BODY = `NVDA is down ${Math.abs(FINAL).toFixed(1)}% today, now ${money(nvdaFinal)}. You asked me to flag drops over 5%. Watching only, no trades placed.`;
    const say = x.el(`<div class="qc-say pf-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="pf-card">
      <div class="pf-shot"></div>
      <div class="pf-cap"><b>Positions</b><small>${x.esc(ACCOUNT)}</small></div>
    </div>`);
    const shot = card.querySelector('.pf-shot');
    const rowsHTML = POS.map(([s, sh, prev]) => `<div class="pf-row">
        <div class="pf-l"><b class="pf-sym">${s}</b><span class="pf-sub"><span class="pf-sh">${sh} shares</span>
          <span class="pf-chip"><i class="pf-bell">${BELL}</i><i class="pf-ck">${CHECK}</i><span class="pf-cl">Alert below ${money(alertAt(prev))}</span></span></span></div>
        <svg class="pf-sp" viewBox="0 0 ${SW} ${SH}" preserveAspectRatio="none"><path class="pf-base" d=""/><path class="pf-ln" d=""/></svg>
        <div class="pf-r"><b class="pf-px">$0.00</b><span class="pf-pc">+0.00%</span></div>
      </div>`).join('');
    // the full-frame layer: the app at the frame's own size, scaled to cover whatever box the layer has this frame
    const layer = x.el(`<div class="pf-full" aria-hidden="true"><div class="pf-app">
      <div class="pf-col">
        <div class="pf-top"><span class="pf-acct">${LANDMARK}<b>${x.esc(ACCOUNT)}</b></span><span class="pf-ro">Read-only</span>
          <span class="pf-watch"><img src="${x.sbSrc}" alt=""/>superbot is watching</span></div>
        <h2 class="pf-h">Positions</h2>
        <div class="pf-today"><span>Today</span><b class="pf-tv">$0.00</b><b class="pf-tp">(0.00%)</b></div>
        <div class="pf-list">${rowsHTML}</div>
      </div>
      <div class="pf-ban">
        <span class="pf-av"><img src="${x.sbSrc}" alt=""/><i class="pf-badge">${MSG}</i></span>
        <div class="pf-bt"><div class="pf-bh"><b>superbot</b><small>now</small></div><p>${x.esc(BODY)}</p></div>
      </div>
    </div></div>`);
    x.root.appendChild(layer);
    const app = layer.querySelector('.pf-app'), col = layer.querySelector('.pf-col'), ban = layer.querySelector('.pf-ban');
    const tv = layer.querySelector('.pf-tv'), tp = layer.querySelector('.pf-tp'), today = layer.querySelector('.pf-today');
    const rows = [...layer.querySelectorAll('.pf-row')].map((n, i) => ({
      n, px: n.querySelector('.pf-px'), pc: n.querySelector('.pf-pc'), ln: n.querySelector('.pf-ln'), base: n.querySelector('.pf-base'),
      chip: n.querySelector('.pf-chip'), cl: n.querySelector('.pf-cl'), key: '', i,
    }));
    const prevValue = POS.reduce((a, [, sh, prev]) => a + sh * prev, 0);
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, feed = null, sized = '';

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        const n = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        const ci = outCubic(seg(t, T.card, T.card + CARD_IN));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px)`;

        // the list: every row's price, today's %, sparkline; NVDA slides and flips
        let change = 0;
        rows.forEach((m) => {
          const [, sh, prev] = POS[m.i];
          const p = m.i === HOT ? hotPct(t, T) : calmPct(m.i, Math.max(0, t - T.c0));
          const last = Math.round(prev * (1 + p / 100) * 100) / 100;
          change += sh * (last - prev);
          const sent = m.i === HOT && t >= T.flip;
          const key = `${p.toFixed(4)}:${sent}`;
          if (key === m.key) return;
          m.key = key;
          m.px.textContent = money(last);
          m.pc.textContent = pctTxt(p);
          m.n.classList.toggle('dn', p < 0);
          m.n.classList.toggle('hit', sent);
          m.chip.classList.toggle('sent', sent);
          const cl = sent ? 'Text sent' : `Alert below ${money(alertAt(prev))}`;
          if (m.cl.textContent !== cl) m.cl.textContent = cl;
          const pts = [...HIST[m.i].slice(1), p];
          const lo = Math.min(0, ...pts) - 0.25, hi = Math.max(0, ...pts) + 0.25;
          const y = (v) => (SH - 2 - ((v - lo) / (hi - lo)) * (SH - 4)).toFixed(2);
          m.ln.setAttribute('d', pts.map((v, j) => `${j ? 'L' : 'M'}${(j * SW / (PTS - 1)).toFixed(2)} ${y(v)}`).join(''));
          m.base.setAttribute('d', `M0 ${y(0)}H${SW}`);
        });
        tv.textContent = `${change < 0 ? '-' : '+'}${money(Math.abs(change))}`;
        tp.textContent = `(${pctTxt((change / prevValue) * 100)})`;
        today.classList.toggle('dn', change < 0);
        // the crossing: the row pulses once as it turns red
        const hot = rows[HOT];
        const pulse = Math.sin(Math.PI * seg(t, T.flip, T.flip + 0.3));
        hot.n.style.transform = pulse > 0 ? `scale(${(1 + 0.012 * pulse).toFixed(4)})` : '';
        hot.chip.style.transform = pulse > 0 ? `scale(${(1 + 0.08 * pulse).toFixed(4)})` : '';

        // the banner: slides down from above the frame's top edge and settles
        const b = outCubic(seg(t, T.b0, T.banner));
        ban.style.opacity = seg(t, T.b0, T.b0 + 0.15).toFixed(3);
        ban.style.transform = `translate(-50%, ${((1 - b) * -130).toFixed(2)}%)`;
      },
      // after the camera: pin the layer over the card's picture frame, then open it to the whole frame
      after(t) {
        const root = x.root;
        const W = root.offsetWidth, H = root.offsetHeight;
        // the app is laid out once per frame size, at the frame's own px; its column zooms up on a wide frame (sized
        // before the card lands, so the thread measures the card at its final size)
        const sz = `${W}x${H}`;
        if (sz !== sized) {
          sized = sz;
          app.style.width = W + 'px'; app.style.height = H + 'px';
          // a wide frame zooms the column up and sits it low, leaving the top band to the banner; a tall frame
          // centres it (the banner fits above it)
          const z = W > H ? 1.3 : 1;
          col.style.zoom = String(z); ban.style.zoom = String(z);
          app.classList.toggle('pf-wide', W > H);
          shot.style.aspectRatio = `${W} / ${H}`;
          card.style.width = W > H ? '360px' : '230px';
        }
        if (t < T.card) { layer.style.opacity = '0'; return; }
        const bx = x.box(shot);
        feed = feed || card.closest('.feed');
        const g = inOutCubic(seg(t, T.grow, T.full));
        const L = lerp(bx.x, 0, g), Tp = lerp(bx.y, 0, g), Wd = lerp(bx.w, W, g), Ht = lerp(bx.h, H, g);
        const s = shot.offsetWidth ? bx.w / shot.offsetWidth : 1;
        layer.style.left = `${L.toFixed(2)}px`;
        layer.style.top = `${Tp.toFixed(2)}px`;
        layer.style.width = `${Wd.toFixed(2)}px`;
        layer.style.height = `${Ht.toFixed(2)}px`;
        layer.style.borderRadius = `${(RADIUS * s * (1 - g)).toFixed(2)}px ${(RADIUS * s * (1 - g)).toFixed(2)}px 0 0`;
        // the app covers the layer's box, centred (like object-fit: cover)
        const k = Math.max(Wd / W, Ht / H);
        app.style.transform = `translate(${((Wd - W * k) / 2).toFixed(2)}px, ${((Ht - H * k) / 2).toFixed(2)}px) scale(${k.toFixed(5)})`;
        // while the card sits in the chat the layer is cut to the feed's viewport, as the card itself is
        const fb = feed ? x.box(feed) : null;
        const cutT = fb ? Math.max(0, fb.y - Tp) * (1 - g) : 0, cutB = fb ? Math.max(0, Tp + Ht - (fb.y + fb.h)) * (1 - g) : 0;
        layer.style.clipPath = cutT > 0.01 || cutB > 0.01 ? `inset(${cutT.toFixed(2)}px 0 ${cutB.toFixed(2)}px 0)` : '';
        layer.style.opacity = card.style.opacity;
      },
    };
  },
};
