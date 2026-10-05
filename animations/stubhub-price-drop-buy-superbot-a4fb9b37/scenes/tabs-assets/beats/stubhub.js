// Superbot's answer: it buys the pair on StubHub. One line, then three step chips that resolve as the card drives
// StubHub for real: the event page (seat map with Section 224 lit and priced, filters Qty 2 and Under $150, the
// three listings under the limit), the pointer picks Section 224, Row 7, checkout slides in (Visa ending 4242,
// $276.00), Buy now spins, and the page turns to "You're going!" with the two mobile tickets. StubHub's screens are
// drawn in code after its live event page (white, Inter, purple #5E29BA); the wordmark is text, no team logos.
// The seat map, seat-view thumbnails and ticket QR placeholders are generated SVG. Every value is written from t.
import { clamp, lerp, seg, outCubic, outBack, inOutCubic } from '../../../lib.js';

const SAY = 'Under your $150 limit. Buying them on StubHub.';
const CHIPS = [['Opening StubHub', 'Opened StubHub'], ['Grabbing Sec 224, Row 7', 'Grabbed Sec 224, Row 7'], ['Paying $276.00', 'Paid $276.00']];
// the listings under $150 for the pair (Section 224 is the watch's "cheapest pair, 200 level")
const LISTINGS = [
  { sec: 224, row: 7, seats: '11-12', was: 171, price: 138, best: true },
  { sec: 227, row: 15, seats: '3-4', price: 146 },
  { sec: 201, row: 18, seats: '7-8', price: 149 },
];
const UNDER = new Set(LISTINGS.map((l) => l.sec));

// ---------- the seat map: a generic bowl, two rings of numbered sections around the court ----------
const CX = 140, CY = 118;
function sector(ri, ro, a0, a1) {
  // an elliptical annulus sector; angles in degrees clockwise from 12 o'clock
  const pt = (r, a) => { const t = (a * Math.PI) / 180; return `${(CX + r[0] * Math.sin(t)).toFixed(2)} ${(CY - r[1] * Math.cos(t)).toFixed(2)}`; };
  const N = 6, out = [], inn = [];
  for (let i = 0; i <= N; i++) { const a = lerp(a0, a1, i / N); out.push(pt(ro, a)); inn.unshift(pt(ri, a)); }
  return `M${out.join(' L')} L${inn.join(' L')} Z`;
}
function ring(first, count, ri, ro, start, cls) {
  const w = 360 / count, gap = 0.9;
  let s = '';
  for (let i = 0; i < count; i++) {
    const num = first + i, a0 = start + i * w - w / 2 + gap, a1 = start + i * w + w / 2 - gap, am = start + i * w;
    const t = (am * Math.PI) / 180, rm = [(ri[0] + ro[0]) / 2, (ri[1] + ro[1]) / 2];
    const lx = CX + rm[0] * Math.sin(t), ly = CY - rm[1] * Math.cos(t);
    const k = num === 224 ? ' sh-s224' : UNDER.has(num) ? ' sh-under' : '';
    s += `<path class="sh-sec ${cls}${k}" d="${sector(ri, ro, a0, a1)}"/><text class="sh-sn${k}" x="${lx.toFixed(1)}" y="${(ly + 2.2).toFixed(1)}">${num}</text>`;
  }
  return s;
}
// 200 level: 28 sections, 224 on the near sideline at 12 o'clock; 100 level: 20 sections
const R2 = { ri: [86, 62], ro: [124, 96] }, R1 = { ri: [50, 34], ro: [80, 57] };
const START2 = -23 * (360 / 28), START1 = 72;
const PIN_Y = CY - R2.ro[1] - 3; // 224's price pin sits on its outer edge
function seatMap() {
  return `<svg class="sh-svg" viewBox="0 0 280 228" aria-hidden="true">
  <rect class="sh-floor" x="${CX - 44}" y="${CY - 26}" width="88" height="52" rx="4"/>
  <rect class="sh-court" x="${CX - 36}" y="${CY - 19}" width="72" height="38" rx="1.5"/>
  <line class="sh-cl" x1="${CX}" x2="${CX}" y1="${CY - 19}" y2="${CY + 19}"/><circle class="sh-cl" cx="${CX}" cy="${CY}" r="6"/>
  <path class="sh-cl" d="M${CX - 36} ${CY - 9} h12 v18 h-12 M${CX + 36} ${CY - 9} h-12 v18 h12"/>
  ${ring(101, 20, R1.ri, R1.ro, START1, 'sh-r1')}
  ${ring(201, 28, R2.ri, R2.ro, START2, 'sh-r2')}
  <path class="sh-glow" d="${sector(R2.ri, R2.ro, -360 / 56 + 0.9, 360 / 56 - 0.9)}"/>
  <g class="sh-pin" transform="translate(${CX} ${PIN_Y})"><rect x="-17" y="-17" width="34" height="14" rx="7"/><path d="M-3.5 -3.2 L0 1 L3.5 -3.2 Z"/><text x="0" y="-7">$138</text></g>
  <text class="sh-stage" x="${CX}" y="${CY + 2.5}">COURT</text>
</svg>`.replace(/\n\s*/g, '');
}

// a seat-view thumbnail: the bowl from the stands, court below, scoreboard up top (shade varies by section)
function seatView(i) {
  const hue = [262, 228, 205][i];
  return `<svg viewBox="0 0 64 44" aria-hidden="true"><defs><linearGradient id="shv${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="hsl(${hue} 30% 22%)"/><stop offset="1" stop-color="hsl(${hue} 22% 10%)"/></linearGradient></defs>
<rect width="64" height="44" fill="url(#shv${i})"/><path d="M0 18 Q32 8 64 18 L64 26 Q32 17 0 26Z" fill="hsl(${hue} 18% 30%)"/>
<rect x="28" y="3" width="8" height="5" rx="1" fill="#cfd6e4" opacity=".8"/><path d="M14 40 L22 27 L42 27 L50 40Z" fill="#d9b07a"/><path d="M14 40 L22 27 L42 27 L50 40Z" fill="none" stroke="#2f6fd0" stroke-width="1.4"/>
<path d="M0 44 L0 34 Q32 28 64 34 L64 44Z" fill="hsl(${hue} 14% 16%)"/></svg>`.replace(/\n/g, '');
}

// a QR placeholder: a deterministic 25x25 module field with the three finder squares
function qr(seed) {
  let s = seed >>> 0;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  const N = 25, inFinder = (x, y) => [[0, 0], [N - 7, 0], [0, N - 7]].some(([fx, fy]) => x >= fx - 1 && x < fx + 8 && y >= fy - 1 && y < fy + 8);
  let d = '';
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!inFinder(x, y) && rnd() < 0.48) d += `M${x} ${y}h1v1h-1z`;
  const fin = [[0, 0], [N - 7, 0], [0, N - 7]].map(([x, y]) => `M${x} ${y}h7v7h-7zM${x + 1} ${y + 1}v5h5v-5zM${x + 2} ${y + 2}h3v3h-3z`).join('');
  return `<svg class="sh-qr" viewBox="-1 -1 27 27" aria-hidden="true"><rect x="-1" y="-1" width="27" height="27" fill="#fff"/><path d="${d}${fin}" fill="#111" fill-rule="evenodd"/></svg>`;
}

const ticket = (seat, i) => `<div class="sh-tk sh-tk${i}">
  <div class="sh-tk-top"><span class="sh-wm">StubHub</span><small>Mobile ticket</small></div>
  <div class="sh-tk-ev"><b>Celtics @ Knicks</b><small>Wed, Oct 21 • 7:30 PM</small></div>
  <div class="sh-tk-grid"><span><small>SEC</small><b>224</b></span><span><small>ROW</small><b>7</b></span><span><small>SEAT</small><b>${seat}</b></span></div>
  ${qr(2240711 + seat)}
  <div class="sh-tk-ft">Madison Square Garden</div>
</div>`;

const SPIN = '<i class="sh-spin"></i>';

export default {
  times(r) {
    return {
      say: r + 0.02, c1: r + 0.08, c1d: r + 0.48, card: r + 0.18, rows: r + 0.34, pin: r + 0.42,
      c2: r + 0.56, ptrIn: r + 0.58, pick: r + 0.9, c2d: r + 1.0, co: r + 1.0, c3: r + 1.1,
      press: r + 1.58, paid: r + 2.08, confirm: r + 2.1, end: r + 3.12,
    };
  },

  build(k, { el, esc, OK, box }) {
    const T = k.T;
    const say = el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${esc(SAY)}</span></div>`);
    const chips = el(`<div class="sh-chips">${CHIPS.map(([run]) => `<span class="ch-tool"><i class="spin"></i><span class="sh-cl">${esc(run)}</span></span>`).join('')}</div>`);
    const rows = LISTINGS.map((l, i) => `<div class="sh-row${i === 0 ? ' sh-row0' : ''}">
  <span class="sh-th">${seatView(i)}</span>
  <span class="sh-rt"><b>Section ${l.sec}</b><span>Row ${l.row} · Seats ${l.seats}</span><small><i class="sh-seats"></i>2 tickets together</small></span>
  <span class="sh-pr">${l.was ? `<s>$${l.was}</s>` : ''}<b>$${l.price}</b><small>incl. fees</small>${l.best ? '<em>Best price</em>' : ''}</span>
</div>`).join('');
    const card = el(`<div class="sh-card">
  <div class="sh-top"><span class="sh-wm">StubHub</span><span class="sh-url">stubhub.com</span>
    <em class="sh-step"><span class="sh-st sh-st0">Event</span><span class="sh-st sh-st1">Checkout</span><span class="sh-st sh-st2">Order confirmed</span></em></div>
  <div class="sh-body">
    <div class="sh-ev"><span class="sh-code sh-bos">BOS</span><b>Celtics</b><i>@</i><span class="sh-code sh-nyk">NYK</span><b>Knicks</b>
      <small>Wed, Oct 21 • 7:30 PM · Madison Square Garden, New York, NY</small></div>
    <div class="sh-cols">
      <div class="sh-map">${seatMap()}<span class="sh-zoom"><i>+</i><i>−</i></span></div>
      <div class="sh-pane">
        <div class="sh-list">
          <div class="sh-filters"><span class="sh-fbtn"><svg viewBox="0 0 16 16"><path d="M2 4h12M2 8h12M2 12h12"/><circle cx="5" cy="4" r="1.6"/><circle cx="11" cy="8" r="1.6"/><circle cx="7" cy="12" r="1.6"/></svg></span>
            <span class="sh-chip">Qty 2<svg viewBox="0 0 10 10"><path d="M2 3.5l3 3 3-3"/></svg></span><span class="sh-chip sh-chip-on">Under $150<svg viewBox="0 0 10 10"><path d="M2.5 2.5l5 5M7.5 2.5l-5 5"/></svg></span>
            <small class="sh-count">3 of 1,936 listings</small></div>
          ${rows}
        </div>
        <div class="sh-co">
          <div class="sh-co-h"><b>Checkout</b><small><svg viewBox="0 0 12 12"><rect x="2.5" y="5.5" width="7" height="5" rx="1"/><path d="M4 5.5V4a2 2 0 0 1 4 0v1.5"/></svg>Secure checkout</small></div>
          <div class="sh-co-seat"><b>Section 224 · Row 7 · Seats 11-12</b><small>2 tickets together · Mobile tickets</small></div>
          <div class="sh-co-l"><span>Tickets (2 x $138.00)</span><span>$276.00</span></div>
          <div class="sh-co-l"><span>Fees</span><span>Included</span></div>
          <div class="sh-co-l sh-co-tot"><span>Total</span><span>$276.00</span></div>
          <div class="sh-pay"><span class="sh-visa">VISA</span><span>Visa ending 4242</span><i class="sh-pay-ok">${OK}</i></div>
          <div class="sh-buy"><span class="sh-buy-a">Buy now</span><span class="sh-buy-b">${SPIN}Buying...</span><i class="sh-shine"></i></div>
        </div>
      </div>
    </div>
    <div class="sh-done">
      <div class="sh-done-l">
        <i class="sh-done-ok">${OK}</i>
        <h3>You're going!</h3>
        <p>2 tickets in your StubHub app.</p>
        <small>Celtics @ Knicks · Wed, Oct 21 • 7:30 PM<br>Madison Square Garden · Section 224, Row 7<br>Order #87214930 · $276.00 · Visa ending 4242</small>
      </div>
      <div class="sh-tks">${ticket(11, 0)}${ticket(12, 1)}</div>
    </div>
  </div>
</div>`.replace(/>\s+</g, '><'));
    const q = (s) => card.querySelector(s), qa = (s) => [...card.querySelectorAll(s)];
    const n = {
      vis: say.querySelector('.qc-vis'), hid: say.querySelector('.qc-hid'),
      chips: [...chips.querySelectorAll('.ch-tool')].map((c) => ({ c, spin: c.querySelector('.spin'), lab: c.querySelector('.sh-cl') })),
      rows: qa('.sh-row'), row0: q('.sh-row0'), glow: q('.sh-glow'), s224: q('path.sh-s224'), pin: q('.sh-pin'),
      list: q('.sh-list'), co: q('.sh-co'), buy: q('.sh-buy'), buyA: q('.sh-buy-a'), buyB: q('.sh-buy-b'), shine: q('.sh-shine'),
      spin: q('.sh-buy .sh-spin'), st: qa('.sh-st'), done: q('.sh-done'), dok: q('.sh-done-ok'), dl: q('.sh-done-l'),
      tks: qa('.sh-tk'), chipOn: q('.sh-chip-on'),
    };
    const chipT = [[T.c1, T.c1d], [T.c2, T.c2d], [T.c3, T.paid]];
    let lastSay = -1;

    return {
      nodes: [say, chips, card],
      marks: [[T.c1, chips], [T.card, card]],
      render(t) {
        const c = Math.floor(clamp((t - T.say) * 110, 0, SAY.length));
        if (c !== lastSay) { n.vis.textContent = SAY.slice(0, c); n.hid.textContent = SAY.slice(c); lastSay = c; }

        n.chips.forEach((ch, i) => {
          const [a, d] = chipT[i];
          const p = outBack(seg(t, a, a + 0.3));
          ch.c.style.opacity = clamp(p * 1.3).toFixed(3);
          ch.c.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * 8).toFixed(2)}px) scale(${lerp(0.85, 1, p).toFixed(3)})`;
          const done = t >= d;
          ch.spin.classList.toggle('done', done);
          ch.c.classList.toggle('sh-ok', done);
          ch.lab.textContent = CHIPS[i][done ? 1 : 0];
          ch.spin.style.transform = done ? 'none' : `rotate(${((t - a) * 400).toFixed(1)}deg)`;
        });

        const a = outCubic(seg(t, T.card, T.card + 0.34));
        card.style.opacity = a.toFixed(3);
        card.style.transform = a >= 1 ? 'none' : `translateY(${((1 - a) * 14).toFixed(2)}px)`;

        // event page: the listings land, 224's pin drops, the section glows until the order is placed
        n.rows.forEach((r, i) => {
          const p = outCubic(seg(t, T.rows + i * 0.06, T.rows + i * 0.06 + 0.26));
          r.style.opacity = p.toFixed(3);
          r.style.transform = p >= 1 ? 'none' : `translateX(${((1 - p) * 10).toFixed(2)}px)`;
        });
        const pin = outBack(seg(t, T.pin, T.pin + 0.32));
        n.pin.style.opacity = clamp(pin * 1.4).toFixed(3);
        n.pin.setAttribute('transform', `translate(${CX} ${(PIN_Y - (1 - pin) * 8).toFixed(2)}) scale(${lerp(0.5, 1, pin).toFixed(3)})`);
        const gl = seg(t, T.pin, T.pin + 0.2);
        n.glow.style.opacity = (gl * (0.55 + 0.45 * Math.abs(Math.sin((t - T.pin) * 5.5)))).toFixed(3);
        n.chipOn.classList.toggle('sh-lit', t >= T.rows);

        // the pick: row 224 presses and stays selected
        const pk = Math.sin(Math.PI * seg(t, T.pick - 0.04, T.pick + 0.14));
        n.row0.classList.toggle('sh-sel', t >= T.pick);
        if (t >= T.rows + 0.26) n.row0.style.transform = pk > 0 ? `scale(${(1 - 0.02 * pk).toFixed(4)})` : 'none';

        // checkout slides over the listings
        const co = inOutCubic(seg(t, T.co, T.co + 0.26));
        n.co.style.transform = `translateX(${((1 - co) * 104).toFixed(2)}%)`;
        n.co.style.opacity = co > 0 ? '1' : '0';
        n.list.style.opacity = (1 - 0.7 * co).toFixed(3);
        n.list.style.transform = co > 0 ? `translateX(${(-co * 18).toFixed(2)}px)` : 'none';

        // Buy now: press, spinner while paying, then the page turns
        const bp = Math.sin(Math.PI * seg(t, T.press - 0.04, T.press + 0.14));
        n.buy.style.transform = bp > 0 ? `scale(${(1 - 0.05 * bp).toFixed(4)})` : 'none';
        const sp = seg(t, T.press + 0.02, T.press + 0.14);
        n.buyA.style.opacity = (1 - sp).toFixed(3);
        n.buyB.style.opacity = sp.toFixed(3);
        n.spin.style.transform = `rotate(${((t - T.press) * 520).toFixed(1)}deg)`;
        n.shine.style.transform = `translateX(${lerp(-120, 420, seg(t, T.press + 0.05, T.paid)).toFixed(1)}%)`;

        const step = t >= T.confirm ? 2 : t >= T.co ? 1 : 0;
        n.st.forEach((s, i) => { s.style.display = i === step ? '' : 'none'; });

        // confirmation: the page turns, the check draws, the two tickets deal in
        const cf = outCubic(seg(t, T.confirm, T.confirm + 0.26));
        n.done.style.opacity = cf.toFixed(3);
        n.done.style.visibility = cf > 0 ? 'visible' : 'hidden';
        const ok = outBack(seg(t, T.confirm + 0.06, T.confirm + 0.36));
        n.dok.style.transform = `scale(${lerp(0.3, 1, ok).toFixed(3)})`;
        n.dok.style.opacity = clamp(ok * 1.5).toFixed(3);
        n.dl.style.transform = cf >= 1 ? 'none' : `translateY(${((1 - cf) * 10).toFixed(2)}px)`;
        n.tks.forEach((tk, i) => {
          const p = outBack(seg(t, T.confirm + 0.1 + i * 0.1, T.confirm + 0.44 + i * 0.1));
          const rot = i === 0 ? -5 : 4;
          tk.style.opacity = clamp(p * 1.5).toFixed(3);
          tk.style.transform = `translateY(${((1 - p) * 40).toFixed(2)}px) rotate(${(rot * p).toFixed(2)}deg) scale(${lerp(0.85, 1, p).toFixed(3)})`;
        });
      },
      // the pointer clicks Section 224's listing, then Buy now (section px via box)
      pointer(t) {
        if (t < T.ptrIn || t > T.press + 0.4) return null;
        const r0 = box(n.row0), b = box(n.buy);
        const p0 = { x: r0.x + r0.w * 0.56, y: r0.y + r0.h * 0.62 }, p1 = { x: b.x + b.w * 0.78, y: b.y + b.h * 0.6 };
        const start = { x: p0.x + 120, y: p0.y + 90 };
        let x, y;
        if (t < T.pick) { const m = inOutCubic(seg(t, T.ptrIn, T.pick - 0.05)); x = lerp(start.x, p0.x, m); y = lerp(start.y, p0.y, m); }
        else { const m = inOutCubic(seg(t, T.co + 0.24, T.press - 0.05)); x = lerp(p0.x, p1.x, m); y = lerp(p0.y, p1.y, m); }
        const v = seg(t, T.ptrIn, T.ptrIn + 0.15) * (1 - seg(t, T.press + 0.2, T.press + 0.4));
        const press = Math.max(Math.sin(Math.PI * seg(t, T.pick - 0.04, T.pick + 0.14)), Math.sin(Math.PI * seg(t, T.press - 0.04, T.press + 0.14)));
        return { x, y, p: press, v };
      },
    };
  },
};
