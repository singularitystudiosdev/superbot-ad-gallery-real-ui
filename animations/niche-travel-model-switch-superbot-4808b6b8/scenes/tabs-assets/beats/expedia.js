// Expedia beat, the finale: superbot books the trip on the user's own Expedia account. Its line streams and an
// Expedia-styled account connection sheet lands in the chat as a card (light, Expedia's own EGDS values, chat.css
// --ex-*): superbot's tile and the Expedia icon joined by the dotted connector, "Connect superbot to Expedia", the
// account it connects to ("Signed in as Jordan Ellis"), what superbot may do (search flights, stays and things to do;
// book with the saved traveler details; pay with the saved card), Cancel and Expedia's primary blue Connect. The
// pointer presses Connect, and the base's connect-card grammar follows: a checklist card ("Connected to your Expedia
// account", "Flights booked: JFK to LIS round trip", "Stay booked: 4 nights in Alfama", "Sintra day trip and Fado
// dinner booked") ticking in turn, with a mini window under it; the card holds (CARD_HOLD) and the window opens to
// full frame (GROW).
// Full frame is the Expedia trip details page (expedia.com Trips, light): the white header (the Expedia logo, Shop
// travel on 16:9, Support, Trips as the current item, the JE avatar) over a hairline, the trip hero (a real Lisbon
// photograph), the title block (Lisbon, May 12 to 16, 2027, 1 traveler, the itinerary number), the four booked items
// (flight, stay, two activities) and, on 16:9, the right rail ("Your days", Day 1 to Day 5, and the Trip total card).
// Each item's status starts "Booking" and flips to "Booked" with its confirmation code, top to bottom, ROW_STEP apart,
// while the trip total counts up with the booked prices and the budget bar fills. The ONE bold moment (the chime,
// window.__AD_MARKS.chime): the confirmation lands on the hero, "Your trip is booked", "4 bookings, $1,657 total",
// with every item Booked and the budget bar complete at 83%. The final state holds (READ).
//
// There is ONE trip page, on a layer in the scene root (outside the camera). While the checklist card sits in the chat
// the layer is pinned over the card's window frame; GROW interpolates it to the whole frame. The page is laid out once
// at a design size (the frame divided by APP_SCALE, so Expedia's 14 px body reads at video size) and scaled to the
// layer, so the mini window and the full frame are the same pixels at two sizes. On a portrait frame (4:5) it drops
// Shop travel and the Your days rail, shortens the hero, compacts the items (one detail line) and puts the trip total
// under them. Pure function of t.
import { lerp, seg, outCubic, inOutCubic, streamCount, press } from '../../../lib.js';
import { lc } from './lucide-icons.js?v=4808b6b8';
import { TRIP, usd } from './fares.js?v=4808b6b8';
import { PLAN } from './plan.js?v=4808b6b8';

const SAY = 'Booking it on your Expedia account.';
// the four bookings (one table with fares.js TRIP): [kind, thumb (img/ file or 'lc:' glyph), title, line 1, line 2,
// price label, price, confirmation code]. Flight: TAP flies JFK to LIS nonstop, evening departures, 6h 50m
// (flightconnections.com, brand/CREDITS.txt DATA); no clock times or flight number are claimed.
const ITEMS = [
  ['Flight', 'lc:plane', 'JFK to LIS', `${TRIP.flight.airline}, nonstop`, 'Tue, May 11, overnight, 6h 50m. Back Sun, May 16', 'Round trip', TRIP.flight.price, 'Conf. K7XQ2M'],
  ['Stay', 'stay-room.jpg', TRIP.stay.name, `${TRIP.stay.area}, Lisbon, ${TRIP.dates}, ${TRIP.stay.nights} nights`, `Free cancellation until ${TRIP.stay.cancel}`, `${TRIP.stay.nights} nights`, TRIP.stay.price, 'Conf. 52904417'],
  ['Activity', 'sintra-pena.jpg', TRIP.sintra.name, 'Fri, May 14, hotel pickup', 'Small group, back by 5 PM', '1 adult', TRIP.sintra.price, 'Conf. SNT3381'],
  ['Activity', 'alfama-night.jpg', TRIP.fado.name, 'Wed, May 12, 8:00 PM', 'Dinner with live fado', '1 adult', TRIP.fado.price, 'Conf. FAD7206'],
].map(([kind, thumb, title, d1, d2, plabel, price, conf]) => ({ kind, thumb, title, d1, d2, plabel, price, conf }));
const STEPS = [
  ['account', 'Connected to your <b>Expedia</b> account'],
  ['plane', 'Flights booked: <b>JFK to LIS</b> round trip'],
  ['bed-double', 'Stay booked: <b>4 nights</b> in Alfama'],
  ['ticket', '<b>Sintra day trip</b> and <b>Fado dinner</b> booked'],
];
const SHARE = TRIP.total / TRIP.budget; // the budget bar's final fill (0.83)

const APP_SCALE = { wide: 1.4, tall: 1.4 };     // full frame: the page's px to frame px
// timing (seconds from the reply start, or from the card where noted)
const CPS = 80;                                 // the reply line streams (the base's finale beat)
const CARD_AT = 0.25;                           // the line streams, then the connect sheet lands
const CARD_IN = 0.3;                            // a card rising into the thread
const TAP_AT = 0.75; /* deliberate */           // the sheet landed to the press on Connect (it reads first)
const PTR_IN = 0.3;                             // the sheet landed to the pointer appearing
const PTR_MOVE = 0.4;                           // the pointer's travel onto the button, ending just before the press
const LIST_AT = 0.25;                           // the press to the checklist card landing
const CHECK_AT = 0.3;                           // the checklist landing to the first check
const CHECK_STAGGER = 0.12;                     // one check to the next
const POP = 0.16;                               // a check popping in
const CARD_HOLD = 0.3; /* deliberate */         // the last check in, the card holds before it opens
const GROW = 0.4; /* deliberate */              // the window opens to full frame
const SWEEP_AT = 0.35; /* deliberate */         // full frame (every item still Booking) to the first item flipping
const ROW_STEP = 0.25; /* deliberate */         // one item's flip to the next (the brief: about 0.25 s)
const FLIP = 0.22;                              // an item's status crossing from Booking to Booked
const BOLD_AT = 0.25;                           // the last item booked to the confirmation landing (the chime)
const BOLD_IN = 0.34;                           // the confirmation rising in, the budget bar completing
const READ = 1.5; /* deliberate */              // the final state holds, readable, before the scene's fade
const RADIUS = 16;                              // the card's window radius (Expedia card__corner_radius 1rem), eased to 0

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const CHECK = '<svg class="xk-ck" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const avatar = (cls = '') => `<span class="ex-av ${cls}">${TRIP.initials}</span>`;

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD_AT;                              // the connect sheet lands
    T.tap = T.card + TAP_AT;                           // Connect is pressed
    T.list = T.tap + LIST_AT;                          // the checklist card lands, the mini window in it
    T.ok = STEPS.map((_, i) => T.list + CHECK_AT + i * CHECK_STAGGER);
    T.grow = T.ok[STEPS.length - 1] + POP + CARD_HOLD; // the window starts opening
    T.full = T.grow + GROW;                            // full frame: every item Booking
    T.flip = ITEMS.map((_, i) => T.full + SWEEP_AT + i * ROW_STEP); // each item flips to Booked
    T.swept = T.flip[ITEMS.length - 1] + FLIP;         // all four Booked
    T.bold = T.swept + BOLD_AT;                        // the confirmation lands (the chime)
    T.settle = T.bold + BOLD_IN;
    T.end = T.settle + READ;
    return T;
  },
  build(k, x) {
    const T = k.T;
    // the renderer reads the chime mark from here (scene-local time; the tabs scene starts the spot at 0)
    window.__AD_MARKS = Object.assign(window.__AD_MARKS || {}, { chime: T.bold });
    const logo = x.brand('expedia-logo.svg');
    // the Expedia icon: the official logo's own icon tile (its left square), never redrawn
    const icon = (cls = '') => `<span class="ex-ic ${cls}"><img src="${logo}" alt=""/></span>`;

    // ---- the account connection sheet in the chat (light, Expedia EGDS) ----
    const say = x.el(`<div class="qc-say xk-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const sheet = x.el(`<div class="xc-card">
      <div class="xc-logos">${x.tile('superbot', 'xc-sb')}<i class="xc-dots"></i>${icon('xc-ex')}</div>
      <div class="xc-title">Connect superbot to Expedia</div>
      <div class="xc-acct">${avatar('xc-av')}<span>Signed in as <b>${esc(TRIP.traveler)}</b></span></div>
      <div class="xc-perm">
        <div class="xc-row">${lc('search')}<span>Search flights, stays and things to do</span></div>
        <div class="xc-row">${lc('user-round')}<span>Book with your saved traveler details</span></div>
        <div class="xc-row">${lc('credit-card')}<span>Pay with your saved card</span></div>
      </div>
      <div class="xc-btns"><span class="ex-btn ex-sec">Cancel</span><span class="ex-btn ex-pri xc-go">Connect</span></div>
    </div>`);
    const go = sheet.querySelector('.xc-go');

    // ---- the checklist card ----
    const stepIcon = (kind) => (kind === 'account' ? icon('xk-ex') : `<span class="xk-ic">${lc(kind)}</span>`);
    const card = x.el(`<div class="xk-card">
      ${STEPS.map(([kind, txt]) => `<div class="xk-step">${stepIcon(kind)}<span class="xk-tx">${txt}</span><span class="xk-ok"><i class="xk-spin"></i>${CHECK}</span></div>`).join('')}
      <div class="xk-shot"></div>
    </div>`);
    const shot = card.querySelector('.xk-shot');
    const checks = [...card.querySelectorAll('.xk-ok')].map((n) => ({ spin: n.querySelector('.xk-spin'), ck: n.querySelector('.xk-ck') }));

    // ---- the full-frame Expedia trip page ----
    const thumb = (o) => (o.thumb.startsWith('lc:') ? `<span class="xp-th xp-gl">${lc(o.thumb.slice(3))}</span>` : `<span class="xp-th"><img src="${x.img(o.thumb)}" alt=""/></span>`);
    const item = (o) => `<div class="xp-item">
        ${thumb(o)}
        <div class="xp-im"><span class="xp-kind xp-wide">${esc(o.kind)}</span><b>${esc(o.title)}</b><span class="xp-d">${esc(o.d1)}</span><span class="xp-d xp-wide">${esc(o.d2)}</span></div>
        <div class="xp-ir">
          <span class="xp-pr"><small class="xp-wide">${esc(o.plabel)}</small><b>${usd(o.price)}</b></span>
          <span class="xp-sw"><span class="xp-st xp-bk"><i class="xp-spin"></i>Booking</span><span class="xp-st xp-ok">${lc('check')}Booked</span></span>
          <small class="xp-cf">${esc(o.conf)}</small>
        </div>
      </div>`;
    const day = ([n, wd, hood, text]) => `<div class="xp-day"><i class="xp-dot"></i><div><b>Day ${n} ${esc(wd)}, ${esc(hood)}</b><span>${esc(text)}</span></div></div>`;
    const layer = x.el(`<div class="xp-full" aria-hidden="true"><div class="xp-app">
      <header class="xp-top">
        <img class="xp-logo" src="${logo}" alt=""/>
        <span class="xp-shop xp-wide">Shop travel ${lc('chevron-down')}</span>
        <span class="xp-tr"><span class="xp-nl">Support</span><span class="xp-nl xp-cur">Trips</span>${avatar('xp-av')}</span>
      </header>
      <div class="xp-page">
        <div class="xp-hero"><img src="${x.img('lisbon-hero.jpg')}" alt=""/>
          <div class="xp-done">${lc('circle-check')}<span><b>Your trip is booked</b><small>${ITEMS.length} bookings, ${usd(TRIP.total)} total</small></span></div>
        </div>
        <div class="xp-head">
          <div class="xp-ttl"><h1>Lisbon</h1>
            <div class="xp-meta"><span>${lc('calendar')}${esc(TRIP.dates)}, ${TRIP.year}</span><span>${lc('user-round')}1 traveler</span></div></div>
          <div class="xp-itn">Itinerary # ${esc(TRIP.itinerary)}</div>
        </div>
        <div class="xp-cols">
          <div class="xp-items">${ITEMS.map(item).join('')}</div>
          <aside class="xp-rail">
            <section class="xp-card xp-days"><h2>Your days</h2>${PLAN.map(day).join('')}</section>
            <section class="xp-card xp-tot"><h2>Trip total</h2><b class="xp-sum">$0</b>
              <i class="xp-bar"><i></i></i>
              <span class="xp-bl"><span class="xp-b0">Budget ${usd(TRIP.budget)}</span><span class="xp-b1">${usd(TRIP.budget - TRIP.total)} under your ${usd(TRIP.budget)} budget</span></span>
            </section>
          </aside>
        </div>
      </div>
    </div></div>`);
    x.root.appendChild(layer);
    const app = layer.firstElementChild;
    const $ = (s) => layer.querySelector(s);
    const items = [...layer.querySelectorAll('.xp-item')].map((n) => ({ bk: n.querySelector('.xp-bk'), ok: n.querySelector('.xp-ok'), cf: n.querySelector('.xp-cf') }));
    const sum = $('.xp-sum'), bar = $('.xp-bar i'), b0 = $('.xp-b0'), b1 = $('.xp-b1'), done = $('.xp-done');

    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, geo = '', feed = null, total = '';
    let AW = 1371, AH = 771;

    const layout = () => {
      const W = x.root.offsetWidth, H = x.root.offsetHeight;
      if (!W || !H) return;
      const key = `${W}x${H}`;
      if (key === geo) return;
      geo = key;
      const tall = W < H;
      const s = tall ? APP_SCALE.tall : APP_SCALE.wide;
      AW = Math.round(W / s); AH = Math.round(H / s);
      app.style.width = `${AW}px`; app.style.height = `${AH}px`;
      app.classList.toggle('xp-narrow', tall);
      shot.style.aspectRatio = `${W} / ${H}`;
      card.classList.toggle('xk-tall', tall);
      sheet.classList.toggle('xc-tall', tall);
    };

    // the pointer: in the chat, onto Connect and a press, then away
    const ptr = (t) => {
      if (t < T.card + PTR_IN || t > T.tap + 0.45) return null;
      const a = T.card + PTR_IN, b = T.tap - 0.08;
      const g = x.box(go);
      if (!g.w) return null;
      const ex = g.x + g.w * 0.55, ey = g.y + g.h * 0.6;
      const m = inOutCubic(seg(t, a, Math.min(a + PTR_MOVE, b)));
      const leave = outCubic(seg(t, T.tap + 0.2, T.tap + 0.45));
      return { x: lerp(ex + 150, ex, m) + leave * 40, y: lerp(ey + 110, ey, m) + leave * 30, p: press(t, T.tap), v: seg(t, a, a + 0.12) * (1 - leave) };
    };

    return {
      nodes: [say, sheet, card],
      marks: [[T.r, say], [T.card, sheet], [T.list, card]],
      pointer: ptr,
      render(t) {
        layout();
        const n = streamCount(SAY, T.r + 0.05, CPS, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        const ci = outCubic(seg(t, T.card, T.card + CARD_IN));
        sheet.style.opacity = ci.toFixed(3);
        sheet.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px)`;
        // Connect: the press, then it stays in its pressed (active) tone
        const pr = press(t, T.tap);
        go.style.transform = pr ? `scale(${(1 - 0.06 * pr).toFixed(4)})` : 'none';
        go.classList.toggle('ex-hit', t >= T.tap);

        const li = outCubic(seg(t, T.list, T.list + CARD_IN));
        card.style.opacity = li.toFixed(3);
        card.style.transform = li >= 1 ? 'none' : `translateY(${((1 - li) * 14).toFixed(2)}px)`;
        checks.forEach((c, i) => {
          const o = outCubic(seg(t, T.ok[i], T.ok[i] + POP));
          c.spin.style.opacity = (1 - seg(t, T.ok[i] - 0.06, T.ok[i] + 0.04)).toFixed(3);
          c.spin.style.transform = `rotate(${((t - T.list) * 420).toFixed(1)}deg)`;
          c.ck.style.opacity = o.toFixed(3);
          c.ck.style.transform = `scale(${lerp(0.4, 1, o).toFixed(4)})`;
        });

        // the sweep: each item's status crosses from Booking to Booked, its confirmation code fades in, and the
        // trip total counts up with the booked prices
        let booked = 0;
        items.forEach((o, i) => {
          const f = T.flip[i];
          const out = outCubic(seg(t, f, f + FLIP * 0.45)), inn = outCubic(seg(t, f + FLIP * 0.35, f + FLIP));
          o.bk.style.opacity = (1 - out).toFixed(3);
          o.bk.querySelector('.xp-spin').style.transform = `rotate(${((t - T.list) * 420).toFixed(1)}deg)`;
          o.ok.style.opacity = inn.toFixed(3);
          o.ok.style.transform = inn >= 1 ? 'none' : `scale(${lerp(0.7, 1, inn).toFixed(4)})`;
          o.cf.style.opacity = inn.toFixed(3);
          booked += ITEMS[i].price * outCubic(seg(t, f, f + FLIP));
        });
        const ts = usd(booked);
        if (ts !== total) { sum.textContent = ts; total = ts; }
        // the budget bar fills with the total and completes at the bold moment
        const q = inOutCubic(seg(t, T.flip[0], T.bold + BOLD_IN * 0.6));
        bar.style.transform = `scaleX(${(SHARE * q).toFixed(4)})`;
        const b = outCubic(seg(t, T.bold, T.bold + BOLD_IN));
        b0.style.opacity = (1 - b).toFixed(3);
        b1.style.opacity = b.toFixed(3);

        // the bold moment: the confirmation rises onto the hero
        done.style.opacity = b.toFixed(3);
        done.style.transform = b >= 1 ? 'none' : `translateY(${((1 - b) * 18).toFixed(2)}px) scale(${lerp(0.94, 1, b).toFixed(4)})`;
      },
      // after the camera: pin the layer over the card's window, then open it to the whole frame
      after(t) {
        if (t < T.list) { layer.style.opacity = '0'; return; }
        layout();
        const bx = x.box(shot);
        const root = x.root;
        feed = feed || card.closest('.feed');
        const W = root.offsetWidth, H = root.offsetHeight;
        const g = inOutCubic(seg(t, T.grow, T.full));
        const L = lerp(bx.x, 0, g), Tp = lerp(bx.y, 0, g), Wd = lerp(bx.w, W, g), Ht = lerp(bx.h, H, g);
        const s = shot.offsetWidth ? bx.w / shot.offsetWidth : 1;
        layer.style.left = `${L.toFixed(2)}px`;
        layer.style.top = `${Tp.toFixed(2)}px`;
        layer.style.width = `${Wd.toFixed(2)}px`;
        layer.style.height = `${Ht.toFixed(2)}px`;
        layer.style.borderRadius = `${(RADIUS * s * (1 - g)).toFixed(2)}px`;
        app.style.transform = `scale(${(Wd / AW).toFixed(5)})`;
        const fb = feed ? x.box(feed) : null;
        const cutT = fb ? Math.max(0, fb.y - Tp) * (1 - g) : 0, cutB = fb ? Math.max(0, Tp + Ht - (fb.y + fb.h)) * (1 - g) : 0;
        layer.style.clipPath = cutT > 0.01 || cutB > 0.01 ? `inset(${cutT.toFixed(2)}px 0 ${cutB.toFixed(2)}px 0 round ${(RADIUS * s * (1 - g)).toFixed(2)}px)` : '';
        layer.style.opacity = card.style.opacity;
      },
    };
  },
};
