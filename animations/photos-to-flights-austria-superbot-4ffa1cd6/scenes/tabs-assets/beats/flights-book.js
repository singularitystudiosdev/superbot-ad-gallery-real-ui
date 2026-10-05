// Superbot's answer: it books the trip for real. One line, then four step chips that resolve as one app card drives
// three real screens, its brand header row switching with each:
//   Google Flights: the search fills (Round trip, 2, Economy; JFK to MUC; Fri, Nov 20 to Fri, Nov 27), the results land
//     (LH 411 5:45 PM to 7:10 AM+1 nonstop $798 first), the pointer selects LH 411 and presses "Book with Lufthansa";
//   Lufthansa checkout: passengers Alex Rivera and Sam Rivera prefilled, the pointer picks 34A and 34B on the seat
//     map, Visa ending 4242, total $1,596.00; the gradient "Pay and book" button spins and lands booking code K7Q2LM;
//   Google Calendar: "Flight to Munich, LH 411" drops onto Fri, Nov 20 at 5:45 PM.
// The card then folds to its header and the boarding-pass card lands: JFK to MUC, Fri Nov 20, 2 passengers, $798
// each, confirmation K7Q2LM. Screens are drawn in code after each app's current light UI; wordmarks are text, no logos.
// Every value is written from t.
import { clamp, lerp, seg, outCubic, outBack, inOutCubic } from '../../../lib.js';

const SAY = 'On it. Booking LH 411 for you and Alex, nonstop to Munich.';
const CHIPS = [['Opening Google Flights', 'Opened Google Flights'], ['Booking LH 411 with Lufthansa', 'Booked LH 411 with Lufthansa'],
  ['Picking seats', 'Seats 34A and 34B'], ['Adding to your calendar', 'Added to your calendar']];
const FIELDS = [['Where from?', 'JFK'], ['Where to?', 'MUC'], ['Departure', 'Fri, Nov 20'], ['Return', 'Fri, Nov 27']];
const FLIGHTS = [
  { code: 'LH', bg: '#05164d', times: '5:45 PM - 7:10 AM+1', air: 'Lufthansa · LH 411', dur: '7 hr 25 min', rt: 'JFK-MUC', stops: 'Nonstop', via: '', price: '$798', best: true },
  { code: 'LH', bg: '#05164d', times: '9:55 PM - 2:15 PM+1', air: 'Lufthansa', dur: '10 hr 20 min', rt: 'JFK-MUC', stops: '1 stop', via: 'FRA', price: '$934' },
  { code: 'LX', bg: '#d52b1e', times: '7:40 PM - 1:05 PM+1', air: 'SWISS', dur: '11 hr 25 min', rt: 'JFK-MUC', stops: '1 stop', via: 'ZRH', price: '$958' },
];
const COLS = ['A', 'B', 'C', '', 'D', 'E', 'F', '', 'H', 'J', 'K'];
const TAKEN = { 32: 'BEFJ', 33: 'ADK', 34: 'EHJK', 35: 'CDEFH', 36: 'ABJ' };
const PICKS = ['34A', '34B'];
const G = (s) => [...'Google'].map((ch, i) => `<i style="color:${['#4285f4', '#ea4335', '#fbbc05', '#4285f4', '#34a853', '#ea4335'][i]}">${ch}</i>`).join('') + `<span>${s}</span>`;
const SPIN = '<i class="fb-spin"></i>';
const CHECK = '<svg class="fb-ck" viewBox="0 0 16 16"><path d="M3.5 8.4l3 3 6-6.4"/></svg>';
const IC = {
  swap: '<svg viewBox="0 0 16 16"><path d="M3 5.5h9.5M10 3l2.5 2.5L10 8M13 10.5H3.5M6 8l-2.5 2.5L6 13"/></svg>',
  person: '<svg viewBox="0 0 16 16"><circle cx="8" cy="5.3" r="2.6"/><path d="M3 13.5c.6-2.6 2.6-4 5-4s4.4 1.4 5 4"/></svg>',
  dot: '<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="4.2"/></svg>',
  pin: '<svg viewBox="0 0 16 16"><path d="M8 14.5s4.6-4.3 4.6-7.8A4.6 4.6 0 0 0 3.4 6.7c0 3.5 4.6 7.8 4.6 7.8z"/><circle cx="8" cy="6.6" r="1.6"/></svg>',
  cal: '<svg viewBox="0 0 16 16"><rect x="2.5" y="3.5" width="11" height="10" rx="1.6"/><path d="M2.5 6.8h11M5.5 2v3M10.5 2v3"/></svg>',
  plane: '<svg viewBox="0 0 16 16"><path d="M14.6 9.3 9.2 6.6V2.9c0-.7-.5-1.4-1.2-1.4s-1.2.7-1.2 1.4v3.7L1.4 9.3v1.5l5.4-1.6v3.3l-1.6 1.1V15L8 14.2l2.8.8v-1.4l-1.6-1.1V9.2l5.4 1.6z"/></svg>',
};

function seatMap() {
  const head = `<span class="fb-sr"><em></em>${COLS.map((c) => `<em>${c}</em>`).join('')}</span>`;
  const rows = [32, 33, 34, 35, 36].map((r) => `<span class="fb-sr"><em>${r}</em>${COLS.map((c) => (c ? `<i class="fb-seat${TAKEN[r].includes(c) ? ' fb-taken' : ''}" data-s="${r}${c}"></i>` : '<b></b>')).join('')}</span>`).join('');
  return `<div class="fb-seats">${head}${rows}</div>`;
}

function barcode() {
  let x = 0, out = '';
  for (let i = 0; x < 120; i++) { const w = [1, 2, 1, 3, 1, 1, 2, 1, 2, 3][(i * 7 + 3) % 10]; if (i % 2 === 0) out += `<rect x="${x}" y="0" width="${w}" height="26"/>`; x += w + 0.8; }
  return `<svg class="bp-bc" viewBox="0 0 120 26" preserveAspectRatio="none">${out}</svg>`;
}

export default {
  times(r) {
    const T = {
      say: r + 0.02, c1: r + 0.1, card: r + 0.18, fill: r + 0.4, pax: r + 0.88, c1d: r + 1.0, res: r + 1.05, ptrIn: r + 1.1,
      pick: r + 1.6, bar: r + 1.7, c2: r + 1.75, press: r + 2.15, lh: r + 2.3, paxRows: r + 2.45, c3: r + 2.6,
      s1: r + 2.95, s2: r + 3.25, c3d: r + 3.35, pay: r + 3.8, booked: r + 4.5, c4: r + 4.75, cal: r + 4.85, ev: r + 5.05,
      c4d: r + 5.4, fold: r + 5.85, pass: r + 5.97,
    };
    T.end = r + 8.15;
    return T;
  },

  build(k, { el, esc, box }) {
    const T = k.T;
    const say = el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${esc(SAY)}</span></div>`);
    const chips = el(`<div class="sh-chips">${CHIPS.map(([run]) => `<span class="ch-tool"><i class="spin"></i><span class="sh-cl">${esc(run)}</span></span>`).join('')}</div>`);
    const fields = FIELDS.map(([ph, v], i) => `<span class="fb-f fb-f${i}">${[IC.dot, IC.pin, IC.cal, ''][i]}<span class="fb-ph">${esc(ph)}</span><b>${esc(v)}</b></span>${i === 0 ? `<span class="fb-swap">${IC.swap}</span>` : ''}`).join('');
    const rows = FLIGHTS.map((f) => `<div class="fb-row${f.best ? ' fb-pickrow' : ''}">
  <span class="fb-al" style="background:${f.bg}">${f.code}</span>
  <span class="fb-c1"><b>${esc(f.times)}</b><small>${esc(f.air)}</small></span>
  <span class="fb-c2"><b>${esc(f.dur)}</b><small>${esc(f.rt)}</small></span>
  <span class="fb-c3"><b>${esc(f.stops)}</b><small>${esc(f.via)}</small></span>
  <span class="fb-c4"><b${f.best ? ' class="fb-low"' : ''}>${esc(f.price)}</b><small>round trip</small></span>
</div>`).join('');
    const card = el(`<div class="fb-card">
  <div class="fb-tops">
    <div class="fb-top fb-top-gf"><span class="fb-wm fb-wm-g">${G(' Flights')}</span><span class="fb-url">google.com/travel/flights</span><em class="fb-pill">Search</em></div>
    <div class="fb-top fb-top-lh"><span class="fb-wm fb-wm-lh">Lufthansa</span><span class="fb-url">lufthansa.com</span><em class="fb-pill">Checkout</em></div>
    <div class="fb-top fb-top-cal"><span class="fb-wm fb-wm-g">${G(' Calendar')}</span><span class="fb-url">calendar.google.com</span><em class="fb-pill fb-pill-ok">${CHECK}Saved</em></div>
  </div>
  <div class="fb-body">
    <div class="fb-gf">
      <div class="fb-sel"><span>${IC.swap}Round trip</span><span>${IC.person}<b class="fb-pax">1</b></span><span>Economy</span></div>
      <div class="fb-search">${fields}</div>
      <div class="fb-rh"><b>Top departing flights</b><small>Round trip, per person, 2 adults</small></div>
      <div class="fb-rows">${rows}</div>
      <div class="fb-book"><span><small>Booking options</small><b>$1,596 total for 2</b></span><span class="fb-bk">Book with Lufthansa</span></div>
    </div>
    <div class="fb-lh">
      <div class="fb-lh-l">
        <div class="fb-steps"><span class="on">${CHECK}Flights</span><span class="on">${CHECK}Passengers</span><span class="fb-st-seat">Seats</span><span>Payment</span></div>
        <div class="fb-paxs">
          <div class="fb-px"><i>1</i><span><b>Alex Rivera</b><small>Adult</small></span><em>${CHECK}Prefilled</em></div>
          <div class="fb-px"><i>2</i><span><b>Sam Rivera</b><small>Adult</small></span><em>${CHECK}Prefilled</em></div>
        </div>
        <div class="fb-sh"><b>Choose seats</b><small>Economy · Airbus A350-900</small></div>
        ${seatMap()}
      </div>
      <div class="fb-lh-r">
        <div class="fb-sum"><b>LH 411 · JFK to MUC</b><small>Fri, Nov 20 · 5:45 PM · Nonstop</small></div>
        <div class="fb-ln"><span>2 adults</span><span>$798.00 x 2</span></div>
        <div class="fb-ln"><span>Seats</span><span class="fb-seatv">Not selected</span></div>
        <div class="fb-ln fb-card4242"><span><em class="fb-visa">VISA</em>Visa ending 4242</span>${CHECK}</div>
        <div class="fb-ln fb-tot"><span>Total</span><b>$1,596.00</b></div>
        <div class="fb-pay"><span class="fb-pay-a">Pay and book</span><span class="fb-pay-b">${SPIN}Booking...</span><span class="fb-pay-c">${CHECK}Booked</span></div>
        <div class="fb-code"><small>Booking code</small><b>K7Q2LM</b></div>
      </div>
    </div>
    <div class="fb-cal">
      <div class="fb-cbar"><span class="fb-today">Today</span><span class="fb-nav">‹ ›</span><b>November 2026</b><span class="fb-view">3 days</span></div>
      <div class="fb-cgrid">
        <div class="fb-gut"><span></span><span>4 PM</span><span>5 PM</span><span>6 PM</span><span>7 PM</span><span>8 PM</span></div>
        <div class="fb-col"><span class="fb-dh"><small>THU</small><b>19</b></span></div>
        <div class="fb-col fb-col-ev"><span class="fb-dh"><small>FRI</small><b>20</b></span><div class="fb-ev"><b>Flight to Munich, LH 411</b><small>5:45 PM - 7:10 AM</small><small>New York JFK</small></div></div>
        <div class="fb-col"><span class="fb-dh"><small>SAT</small><b>21</b></span></div>
      </div>
    </div>
  </div>
</div>`.replace(/>\s+</g, '><'));
    const pass = el(`<div class="bp">
  <div class="bp-main">
    <div class="bp-hd"><span class="bp-air">Lufthansa · LH 411</span><span class="bp-tag">Booked by Superbot</span></div>
    <div class="bp-rt"><span><b>JFK</b><small>New York</small></span><i class="bp-ln">${IC.plane}</i><span><b>MUC</b><small>Munich</small></span></div>
    <div class="bp-fs">
      <span><small>Date</small><b>Fri, Nov 20</b></span><span><small>Departs</small><b>5:45 PM</b></span>
      <span><small>Passengers</small><b>2</b></span><span><small>Seats</small><b>34A, 34B</b></span><span><small>Fare</small><b>$798 each</b></span>
    </div>
  </div>
  <div class="bp-stub"><small>Confirmation</small><b>K7Q2LM</b>${barcode()}</div>
</div>`.replace(/>\s+</g, '><'));

    const q = (s) => card.querySelector(s), qa = (s) => [...card.querySelectorAll(s)];
    const n = {
      vis: say.querySelector('.qc-vis'), hid: say.querySelector('.qc-hid'),
      chips: [...chips.querySelectorAll('.ch-tool')].map((c) => ({ c, spin: c.querySelector('.spin'), lab: c.querySelector('.sh-cl') })),
      tops: qa('.fb-top'), body: q('.fb-body'), gf: q('.fb-gf'), lh: q('.fb-lh'), cal: q('.fb-cal'),
      fs: qa('.fb-f'), pax: q('.fb-pax'), rh: q('.fb-rh'), rows: qa('.fb-row'), pick: q('.fb-pickrow'), book: q('.fb-book'), bk: q('.fb-bk'),
      pxs: qa('.fb-px'), seat: Object.fromEntries(PICKS.map((s) => [s, q(`.fb-seat[data-s="${s}"]`)])), seatv: q('.fb-seatv'), stSeat: q('.fb-st-seat'),
      pay: q('.fb-pay'), payA: q('.fb-pay-a'), payB: q('.fb-pay-b'), payC: q('.fb-pay-c'), spin: q('.fb-pay .fb-spin'), code: q('.fb-code'),
      ev: q('.fb-ev'), pills: qa('.fb-pill'),
    };
    const chipT = [[T.c1, T.c1d], [T.c2, T.booked], [T.c3, T.c3d], [T.c4, T.c4d]];
    const bodyH = 286;
    let lastSay = -1;
    const show = (node, p, dx = 0) => {
      node.style.opacity = p.toFixed(3);
      node.style.visibility = p > 0 ? 'visible' : 'hidden';
      node.style.transform = p >= 1 || !dx ? 'none' : `translateX(${((1 - p) * dx).toFixed(2)}px)`;
    };
    const press = (t, at) => Math.sin(Math.PI * seg(t, at - 0.04, at + 0.14));

    return {
      nodes: [say, chips, card, pass],
      marks: [[T.c1, chips], [T.card, card], [T.pass, pass]],
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

        // screens: Google Flights -> Lufthansa -> Calendar, header rows crossfading with them
        const toLh = inOutCubic(seg(t, T.lh, T.lh + 0.26)), toCal = inOutCubic(seg(t, T.cal, T.cal + 0.26));
        show(n.gf, 1 - toLh);
        show(n.lh, toLh * (1 - toCal), 16);
        show(n.cal, toCal, 16);
        [1 - toLh, toLh * (1 - toCal), toCal].forEach((o, i) => { n.tops[i].style.opacity = o.toFixed(3); n.tops[i].style.visibility = o > 0 ? 'visible' : 'hidden'; });

        // Google Flights: the search fills field by field, passengers to 2, then the results land
        n.fs.forEach((f, i) => f.classList.toggle('fb-on', t >= T.fill + i * 0.12));
        n.pax.textContent = t >= T.pax ? '2' : '1';
        n.rh.style.opacity = seg(t, T.res - 0.05, T.res + 0.15).toFixed(3);
        n.rows.forEach((r, i) => {
          const p = outCubic(seg(t, T.res + i * 0.07, T.res + i * 0.07 + 0.28));
          r.style.opacity = p.toFixed(3);
          r.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * 10).toFixed(2)}px)`;
        });
        n.pick.classList.toggle('fb-sel-row', t >= T.pick);
        const pk = press(t, T.pick);
        if (t >= T.res + 0.4) n.pick.style.transform = pk > 0 ? `scale(${(1 - 0.02 * pk).toFixed(4)})` : 'none';
        const bb = outCubic(seg(t, T.bar, T.bar + 0.28));
        n.book.style.opacity = bb.toFixed(3);
        n.book.style.transform = `translateY(${((1 - bb) * 30).toFixed(2)}px)`;
        const bp = press(t, T.press);
        n.bk.style.transform = bp > 0 ? `scale(${(1 - 0.06 * bp).toFixed(4)})` : 'none';
        n.bk.classList.toggle('fb-down', t >= T.press && t < T.lh);

        // Lufthansa: passengers prefilled, then the two seats picked
        n.pxs.forEach((p, i) => {
          const o = outCubic(seg(t, T.paxRows + i * 0.1, T.paxRows + i * 0.1 + 0.26));
          p.style.opacity = o.toFixed(3);
          p.classList.toggle('fb-ok', t >= T.paxRows + i * 0.1 + 0.2);
        });
        [T.s1, T.s2].forEach((at, i) => {
          const s = n.seat[PICKS[i]];
          s.classList.toggle('fb-picked', t >= at);
          const sp = press(t, at);
          s.style.transform = t >= at ? `scale(${(1 + 0.35 * outBack(seg(t, at, at + 0.25)) - 0.35 * seg(t, at + 0.25, at + 0.4)).toFixed(4)})` : (sp > 0 ? `scale(${(1 - 0.1 * sp).toFixed(4)})` : 'none');
        });
        n.seatv.textContent = t >= T.s2 ? '34A, 34B' : t >= T.s1 ? '34A' : 'Not selected';
        n.stSeat.classList.toggle('on', t >= T.c3d);
        // Pay and book: press, spin, booked; the booking code lands
        const pp = press(t, T.pay);
        n.pay.style.transform = pp > 0 ? `scale(${(1 - 0.05 * pp).toFixed(4)})` : 'none';
        const sp = seg(t, T.pay + 0.02, T.pay + 0.1), dn = seg(t, T.booked, T.booked + 0.12);
        n.payA.style.opacity = (1 - sp).toFixed(3);
        n.payB.style.opacity = (sp * (1 - dn)).toFixed(3);
        n.payC.style.opacity = dn.toFixed(3);
        n.pay.classList.toggle('fb-paid', t >= T.booked);
        n.spin.style.transform = `rotate(${((t - T.pay) * 520).toFixed(1)}deg)`;
        const cd = outBack(seg(t, T.booked + 0.05, T.booked + 0.35));
        n.code.style.opacity = clamp(cd * 1.4).toFixed(3);
        n.code.style.transform = `scale(${lerp(0.8, 1, cd).toFixed(4)})`;

        // Calendar: the event drops onto Fri 20
        const ev = outBack(seg(t, T.ev, T.ev + 0.34));
        n.ev.style.opacity = clamp(ev * 1.5).toFixed(3);
        n.ev.style.transform = `translateY(${((1 - Math.min(ev, 1)) * -18).toFixed(2)}px) scale(${lerp(0.9, 1, ev).toFixed(4)})`;
        n.pills[2].classList.toggle('fb-pill-on', t >= T.c4d);

        // the card folds to its header and the boarding pass lands under it
        const fd = inOutCubic(seg(t, T.fold, T.fold + 0.34));
        n.body.style.height = ((1 - fd) * bodyH).toFixed(2) + 'px';
        const ps = outBack(seg(t, T.pass, T.pass + 0.4));
        pass.style.opacity = clamp(ps * 1.4).toFixed(3);
        pass.style.transform = ps >= 1 ? 'none' : `translateY(${((1 - Math.min(ps, 1)) * 16).toFixed(2)}px) scale(${lerp(0.94, 1, ps).toFixed(4)})`;
      },
      // the pointer: selects LH 411, presses Book with Lufthansa, picks 34A and 34B, presses Pay and book
      pointer(t) {
        if (t < T.ptrIn || t > T.pay + 0.45) return null;
        const at = (node, fx = 0.5, fy = 0.5) => { const b = box(node); return { x: b.x + b.w * fx, y: b.y + b.h * fy }; };
        const pts = [
          [T.ptrIn, null], [T.pick, at(n.pick, 0.3, 0.5)], [T.press, at(n.bk, 0.5, 0.55)],
          [T.s1, at(n.seat['34A'], 0.6, 0.6)], [T.s2, at(n.seat['34B'], 0.6, 0.6)], [T.pay, at(n.pay, 0.55, 0.55)],
        ];
        pts[0][1] = { x: pts[1][1].x - 70, y: pts[1][1].y + 160 };
        let x = pts[0][1].x, y = pts[0][1].y;
        for (let i = 1; i < pts.length; i++) {
          const [t1, p1] = pts[i], [t0, p0] = pts[i - 1];
          const s0 = i === 1 ? t0 : t0 + 0.12;
          if (t <= s0) { x = p0.x; y = p0.y; break; }
          const m = inOutCubic(seg(t, s0, t1 - 0.05));
          x = lerp(p0.x, p1.x, m); y = lerp(p0.y, p1.y, m);
          if (t < t1) break;
        }
        const v = seg(t, T.ptrIn, T.ptrIn + 0.15) * (1 - seg(t, T.pay + 0.25, T.pay + 0.45));
        const p = Math.max(...[T.pick, T.press, T.s1, T.s2, T.pay].map((a2) => press(t, a2)));
        return { x, y, p, v };
      },
    };
  },
};
