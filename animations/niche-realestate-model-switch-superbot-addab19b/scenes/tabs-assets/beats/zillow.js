// Zillow beat, the finale: superbot books the viewings in the user's Zillow account. Its line streams, a connect card
// lands in the chat ("superbot connected to Zillow", "Signed in as Jordan", "Requesting 3 tours", three checks ticking
// in turn) with a mini browser window under it; the card holds (CARD_HOLD) and the window opens to full frame (GROW),
// the grammar of the webdev remake's vercel.js. Full frame is a real-looking light Chrome window. Phase A, tab
// "Westerville OH Real Estate · Zillow": the Zillow search page (header, search box and the applied filters, the map
// on the left and the 8 results as cards on the right). The price pins drop onto the map one by one, then the school
// pins with their ratings; the top 3 cards get a green "Tour requested" badge with the date and time, one by one, their
// pins turning green with them. Phase B: the pointer clicks the Google Calendar tab and the week of Oct 4 to 10, 2026
// shows (the user's own events already in it); the three viewings pop into it one by one, Tue 5:30 PM, Thu 6:00 PM,
// Sat 10:00 AM. The final state holds (READ) before the end card.
//
// The map is real street geometry: US Census TIGER/Line (public domain), cached in img/westerville-tiger.geojson and
// drawn once to img/map-westerville.svg (1400 x 1380 px, see img/CREDITS.txt); the pins and road labels are placed in
// the same px. Street names are real, house numbers and schools are made up (brand/CREDITS.txt DATA).
//
// There is ONE browser window, on a layer in the scene root (outside the camera). While the card sits in the chat the
// layer is pinned over the card's window frame; GROW interpolates it from there to the whole frame. The window is laid
// out once at a design size (the frame divided by APP_SCALE) and scaled to the layer, so the mini window and the full
// frame are the same pixels at two sizes. On a portrait frame (4:5) the Zillow page stacks (map on top, the cards in
// three columns under it) and the calendar's week columns narrow (the event titles wrap).
// Pure function of t: every moving value is written from t; the only measuring is of laid-out boxes (the map panel,
// the calendar tab), which do not move with t.
import { lerp, seg, outCubic, inOutCubic, streamCount, press } from '../../../lib.js';

const SAY = 'Booking the viewings in your Zillow account.';
const ZURL = 'zillow.com/westerville-oh/';
const CURL = 'calendar.google.com/calendar/r/week/2026/10/4';
const ZTITLE = 'Westerville OH Real Estate · Zillow';
// the 8 matches: [photo, pin, price, beds, baths, sqft, address, elementary rating, distance, map x, y, tour]
const HOMES = [
  ['house-1.jpg', '$449K', '$449,900', 3, 2, '1,860', '1438 Juniper Ave', 9, '0.4 mi', 939, 593, 'Tue Oct 6, 5:30 PM'],
  ['house-2.jpg', '$485K', '$485,000', 3, 2.5, '2,140', '682 Hillcrest Dr', 9, '0.6 mi', 1034, 822, 'Thu Oct 8, 6:00 PM'],
  ['house-3.jpg', '$419K', '$419,500', 3, 2, '1,720', '215 Ottawa Ave', 9, '0.3 mi', 939, 925, 'Sat Oct 10, 10:00 AM'],
  ['house-4.jpg', '$465K', '$465,000', 3, 2, '1,940', '77 Collingwood Dr', 8, '0.7 mi', 1098, 749],
  ['house-5.jpg', '$399K', '$399,900', 3, 1.5, '1,510', '341 Hiawatha Ave', 8, '0.5 mi', 607, 907],
  ['house-6.jpg', '$474K', '$474,900', 3, 2.5, '2,060', '908 Prince William Ln', 9, '0.8 mi', 1233, 697],
  ['house-7.jpg', '$438K', '$438,000', 3, 2, '1,780', '156 Mary Ave', 8, '0.4 mi', 888, 735],
  ['house-8.jpg', '$492K', '$492,500', 3, 2.5, '2,210', '1120 Lakeland Dr', 8, '0.9 mi', 1211, 559],
];
// the schools near them, all invented: [name, rating, map x, y, label side]
const SCHOOLS = [
  ['Linden Grove Elementary', 9, 1060, 500],
  ['Maple Ridge Elementary', 9, 1235, 905, 'left'],
  ['Cherry Hill Elementary', 9, 850, 980],
  ['Oak Creek Middle', 8, 760, 640],
  ['Westbrook High', 8, 640, 962],
];
// road labels (TIGER names, anchored on the road in map px, angle in degrees)
const ROADS = [
  ['E College Ave', 1080.5, 701.9, 3.4], ['E Walnut St', 1101.6, 862.1, 4.1],
  ['Cherrington Rd', 970.1, 1014.7, 4.7], ['N State St', 626, 436, -63], ['S State St', 659, 840, 73],
  ['N Spring Rd', 1213.2, 346.4, -85.9], ['E Schrock Rd', 1008.6, 1128.5, 35.3],
  ['W Main St', 205.8, 719.9, 3.1], ['Maxtown Rd', 1189.3, 163.7, 3.2],
];
const MAP = { w: 1400, h: 1380, wide: { cx: 950, cy: 745, s: 0.78 }, tall: { cx: 880, cy: 745, s: 0.7 } };
// the calendar: the week of Sun Oct 4, 2026; hours shown 9 AM to 7 PM
const DAYS = [['SUN', 4], ['MON', 5], ['TUE', 6], ['WED', 7], ['THU', 8], ['FRI', 9], ['SAT', 10]];
const H0 = 9, H1 = 19;
// [day index, start hour, end hour, title, time line, colour class, location]
const EVENTS = [
  [0, 11, 12.5, 'Brunch with Mom', '11 to 12:30pm', 'gc-blue'],
  ...[1, 2, 3, 4, 5].map((d) => [d, 9.5, 10, 'Team standup', '9:30am', 'gc-blue']),
  [1, 18, 19, 'Gym', '6 to 7pm', 'gc-lav'],
  [2, 13, 14, 'Dentist', '1 to 2pm', 'gc-blue'],
  [3, 18, 19, 'Gym', '6 to 7pm', 'gc-lav'],
  [4, 15, 15.5, '1:1 with Priya', '3pm', 'gc-blue'],
  [5, 18, 19, 'Dinner with Sam', '6 to 7pm', 'gc-blue'],
  [6, 14, 15, 'Grocery run', '2 to 3pm', 'gc-blue'],
];
const TOURS = [
  [2, 17.5, 18.5, 'Home tour: 1438 Juniper Ave', '5:30 to 6:30pm', 'Westerville, OH'],
  [4, 18, 19, 'Home tour: 682 Hillcrest Dr', '6 to 7pm', 'Westerville, OH'],
  [6, 10, 11, 'Home tour: 215 Ottawa Ave', '10 to 11am', 'Westerville, OH'],
];

// design metrics (px of the window, before the scale to the frame)
const APP_SCALE = { wide: 1.5, tall: 1.2 };        // full frame: the window's px to frame px

// timing (seconds from the reply start, or from the card or the full frame where noted)
const CPS = 80;                                  // the reply line streams
const CARD_AT = 0.25;                            // the line streams, then the card lands
const CARD_IN = 0.3;
const CHECK_AT = 0.3;                            // the card landing to the first check
const CHECK_STAGGER = 0.2;
const POP = 0.16;
const CARD_HOLD = 0.3; /* deliberate */          // the last check in, the card holds before it opens
const GROW = 0.4; /* deliberate */               // the window opens to full frame
const PIN_AT = 0.12;                             // full frame, then the first price pin drops
const PIN_STAGGER = 0.06;
const PIN_IN = 0.24;
const SCHOOL_AT = 0.15;                          // the last price pin in, then the school pins
const SCHOOL_STAGGER = 0.07;
const TOUR_AT = 1.35;                            // full frame to the first "Tour requested" badge (the map reads)
const TOUR_STAGGER = 0.3;
const TOUR_IN = 0.24;
const PTR_AT = 0.35;                             // the last badge in, then the pointer sets off for the Calendar tab
const PTR_MOVE = 0.45;
const PRESS_AT = 0.05;
const SWITCH_AT = 0.1;                           // the press, then the tab switches
const EV_AT = 0.35;                              // the calendar shows, then the first viewing pops in
const EV_STAGGER = 0.25;
const EV_IN = 0.25;
const READ = 1.6; /* deliberate */               // the final state holds, readable, before the scene's fade (>= 1.5)
const RADIUS = 8;                                // the card's window radius, eased to 0 at full frame

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const svg = (d, cls = 'cr-i', vb = '0 0 24 24') => `<svg class="${cls}" viewBox="${vb}" aria-hidden="true">${d}</svg>`;
const I = {
  back: svg('<path d="M19 12H5M11 6l-6 6 6 6"/>'),
  fwd: svg('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  reload: svg('<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3L19.5 9"/><path d="M19.5 4v5h-5"/>'),
  tune: svg('<path d="M4 8h9M17 8h3M4 16h3M11 16h9"/><circle cx="15" cy="8" r="2"/><circle cx="9" cy="16" r="2"/>'),
  star: svg('<path d="M12 4l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 16.4l-4.8 2.5.9-5.4-3.9-3.8 5.4-.8z"/>'),
  kebab: svg('<circle cx="12" cy="5.5" r="1.4" class="cr-f"/><circle cx="12" cy="12" r="1.4" class="cr-f"/><circle cx="12" cy="18.5" r="1.4" class="cr-f"/>'),
  close: svg('<path d="M7 7l10 10M17 7 7 17"/>'),
  plus: svg('<path d="M12 5v14M5 12h14"/>'),
  search: svg('<circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5 5"/>', 'zw-i'),
  caret: svg('<path d="M7 10l5 5 5-5"/>', 'zw-i'),
  heart: svg('<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>', 'zw-hrt'),
  zplus: svg('<path d="M12 6v12M6 12h12"/>', 'zw-i'),
  zminus: svg('<path d="M6 12h12"/>', 'zw-i'),
  tick: '<svg class="zw-ck" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  menu: svg('<path d="M4 7h16M4 12h16M4 17h16"/>', 'gc-i'),
  gsearch: svg('<circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5 5"/>', 'gc-i'),
  help: svg('<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.5a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5v.4"/><circle cx="12" cy="16.6" r=".6" class="gc-f"/>', 'gc-i'),
  gear: svg('<circle cx="12" cy="12" r="3"/><path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M6 6l1.4 1.4M16.6 16.6 18 18M6 18l1.4-1.4M16.6 7.4 18 6"/>', 'gc-i'),
  apps: svg([5, 12, 19].flatMap((x) => [5, 12, 19].map((y) => `<circle cx="${x}" cy="${y}" r="1.7" class="gc-f"/>`)).join(''), 'gc-i'),
  lt: svg('<path d="M14.5 6l-6 6 6 6"/>', 'gc-i'),
  gt: svg('<path d="M9.5 6l6 6-6 6"/>', 'gc-i'),
  gcaret: svg('<path d="M7 10l5 5 5-5"/>', 'gc-i gc-sm'),
  ok: '<svg class="zc-ck" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  cal: svg('<rect x="4" y="5.5" width="16" height="14.5" rx="2"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/>', 'zc-gi'),
};
const tone = (v) => (v >= 8 ? 'zw-hi' : v >= 5 ? 'zw-mid' : 'zw-lo');
const hour = (h) => `${((Math.floor(h) + 11) % 12) + 1} ${h < 12 ? 'AM' : 'PM'}`;

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD_AT;
    T.ok = [0, 1, 2].map((i) => T.card + CHECK_AT + i * CHECK_STAGGER);
    T.grow = T.ok[2] + POP + CARD_HOLD;
    T.full = T.grow + GROW;
    T.pin = HOMES.map((_, i) => T.full + PIN_AT + i * PIN_STAGGER);
    T.school = SCHOOLS.map((_, i) => T.pin[HOMES.length - 1] + SCHOOL_AT + i * SCHOOL_STAGGER);
    T.mapIn = T.school[SCHOOLS.length - 1] + PIN_IN; // the map has every pin and rating on it
    T.tour = [0, 1, 2].map((i) => T.full + TOUR_AT + i * TOUR_STAGGER); // .zw-tour opacity rises from 0 (the chime)
    T.ptr = T.tour[2] + TOUR_IN + PTR_AT;
    T.arrive = T.ptr + PTR_MOVE;
    T.press = T.arrive + PRESS_AT;
    T.cal = T.press + SWITCH_AT;                      // the Calendar tab is in front
    T.ev = TOURS.map((_, i) => T.cal + EV_AT + i * EV_STAGGER);
    T.settle = T.ev[TOURS.length - 1] + EV_IN;        // the last viewing in (.gc-tour opacity 1)
    T.end = T.settle + READ;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const zMark = x.brand('zillow-logo.svg'), zBlue = x.brand('zillow-blue.svg'), gcal = x.brand('gcal-color.svg');

    // ---- the connect card in the chat ----
    const say = x.el(`<div class="qc-say zc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const steps = [
      [`<span class="zc-ct-i zc-ct-z"><img src="${zMark}" alt=""/></span>`, '<b>superbot connected to Zillow</b>'],
      ['<span class="zc-ct-i zc-ct-a">J</span>', 'Signed in as <b>Jordan</b>'],
      [`<span class="zc-ct-i zc-ct-d">${I.cal}</span>`, 'Requesting <b>3 tours</b>'],
    ];
    const card = x.el(`<div class="zc-cc">
      ${steps.map(([icon, txt]) => `<div class="zc-step">${icon}<span class="zc-tx">${txt}</span><span class="zc-ok"><i class="zc-spin"></i>${I.ok}</span></div>`).join('')}
      <div class="zc-shot"></div>
    </div>`);
    const shot = card.querySelector('.zc-shot');
    const checks = [...card.querySelectorAll('.zc-ok')].map((n) => ({ spin: n.querySelector('.zc-spin'), ck: n.querySelector('.zc-ck') }));

    // ---- the Zillow search page ----
    const homeCard = ([f, , price, bd, ba, sq, addr, rate, dist, , , tour]) => `<article class="zw-card">
      <figure><img src="${x.img(f)}" alt=""/>${I.heart}${tour ? `<span class="zw-tour">${I.tick}<span><b>Tour requested</b><small>${esc(tour)}</small></span></span>` : ''}</figure>
      <div class="zw-ci">
        <b class="zw-price">${esc(price)}</b>
        <span class="zw-det"><b>${bd}</b> bds <i></i> <b>${ba}</b> ba <i></i> <b>${sq}</b> sqft <i></i> House for sale</span>
        <span class="zw-addr">${esc(addr)}, Westerville, OH 43081</span>
        <span class="zw-sch"><i class="zw-r ${tone(rate)}">${rate}</i>Elementary ${rate}/10  ·  ${esc(dist)}</span>
      </div>
    </article>`;
    const zillowHTML = `<div class="zw">
      <header class="zw-top">
        <nav class="zw-nav"><span>Buy</span><span>Rent</span><span>Sell</span><span>Get a mortgage</span><span>Find an Agent</span></nav>
        <img class="zw-logo" src="${x.brand('zillow-wordmark.svg')}" alt=""/>
        <nav class="zw-nav zw-nr"><span>Manage Rentals</span><span>Advertise</span><span>Get help</span><i class="zw-av">J</i></nav>
      </header>
      <div class="zw-bar">
        <span class="zw-q"><span>Westerville, OH</span>${I.search}</span>
        <span class="zw-f">For sale${I.caret}</span><span class="zw-f">Under $500K${I.caret}</span><span class="zw-f">3+ bd${I.caret}</span>
        <span class="zw-f zw-fon">Schools 8+${I.caret}</span><span class="zw-f zw-more">More${I.caret}</span>
        <span class="zw-save">Save search</span>
      </div>
      <div class="zw-body">
        <div class="zw-map"><div class="zw-mi"><img src="${x.img('map-westerville.svg')}" alt=""/></div><div class="zw-ov"></div>
          <div class="zw-zoom"><span>${I.zplus}</span><span>${I.zminus}</span></div></div>
        <div class="zw-list">
          <div class="zw-lh"><h1>Westerville OH Real Estate &amp; Homes For Sale</h1><div class="zw-lm"><b>8 results</b><span>Sort: Homes for You${I.caret}</span></div></div>
          <div class="zw-grid">${HOMES.map(homeCard).join('')}</div>
        </div>
      </div>
    </div>`;
    // the map's overlay: road labels, then the school pins, then the price pins (on top)
    const overlayHTML = `${ROADS.map(([n]) => `<span class="zw-road">${esc(n)}</span>`).join('')}
      ${SCHOOLS.map(([n, r, , , side]) => `<span class="zw-spin${side ? ' zw-sl' : ''}"><i class="zw-r ${tone(r)}">${r}</i><b>${esc(n)}</b></span>`).join('')}
      ${HOMES.map(([, pin]) => `<span class="zw-pin"><span class="zw-pp">${I.tick}${esc(pin)}</span></span>`).join('')}`;

    // ---- Google Calendar, week view ----
    const ev = ([d, a, b, title, time, cls, loc], tour) => {
      const short = b - a <= 0.5;
      return `<div class="gc-ev ${tour ? 'gc-tour' : cls}${short ? ' gc-short' : ''}" data-d="${d}" data-a="${a}" data-b="${b}">${short
        ? `<span class="gc-l1"><b>${esc(title)}</b>, ${esc(time)}</span>`
        : `<b>${esc(title)}</b><span>${esc(time)}${loc ? `, ${esc(loc)}` : ''}</span>`}</div>`;
    };
    const calHTML = `<div class="gc">
      <header class="gc-top">${I.menu}<img class="gc-logo" src="${gcal}" alt=""/><span class="gc-name">Calendar</span>
        <span class="gc-today">Today</span>${I.lt}${I.gt}<span class="gc-month">October 2026</span>
        <span class="gc-tr">${I.gsearch}${I.help}${I.gear}<span class="gc-view">Week${I.gcaret}</span>${I.apps}<i class="gc-av">J</i></span></header>
      <div class="gc-days"><span class="gc-gmt">GMT-04</span>${DAYS.map(([d, n]) => `<span class="gc-dh"><small>${d}</small><b>${n}</b></span>`).join('')}</div>
      <div class="gc-grid">
        <div class="gc-hours">${Array.from({ length: H1 - H0 }, (_, i) => `<span>${i ? hour(H0 + i) : ''}</span>`).join('')}</div>
        <div class="gc-cols">${DAYS.map(() => '<div class="gc-col"></div>').join('')}
          ${EVENTS.map((e) => ev(e, false)).join('')}${TOURS.map((e) => ev(e, true)).join('')}</div>
      </div>
    </div>`;

    const layer = x.el(`<div class="zc-full" aria-hidden="true"><div class="cr-app">
      <div class="cr-strip">
        <span class="cr-lights"><i></i><i></i><i></i></span>
        <span class="cr-tab cr-t1 on"><img class="cr-fav" src="${zBlue}" alt=""/><span class="cr-tt">${esc(ZTITLE)}</span>${I.close}</span>
        <span class="cr-tab cr-t2"><img class="cr-fav" src="${gcal}" alt=""/><span class="cr-tt">Google Calendar</span>${I.close}</span>
        <span class="cr-new">${I.plus}</span>
      </div>
      <div class="cr-bar">
        ${I.back}${I.fwd}${I.reload}
        <span class="cr-omni">${I.tune}<span class="cr-url"></span>${I.star}</span>
        <span class="cr-av">J</span>${I.kebab}
      </div>
      <div class="cr-vp">${zillowHTML}${calHTML}</div>
    </div></div>`);
    x.root.appendChild(layer);
    const app = layer.firstElementChild;
    const $ = (s) => app.querySelector(s);
    const t1 = $('.cr-t1'), t2 = $('.cr-t2'), url = $('.cr-url'), zw = $('.zw'), gc = $('.gc');
    const mapBox = $('.zw-map'), mi = $('.zw-mi'), ov = $('.zw-ov');
    ov.innerHTML = overlayHTML;
    const roads = [...ov.querySelectorAll('.zw-road')], spins = [...ov.querySelectorAll('.zw-spin')], pins = [...ov.querySelectorAll('.zw-pin')];
    const tours = [...app.querySelectorAll('.zw-tour')];
    const evs = [...app.querySelectorAll('.gc-ev')], tourEvs = [...app.querySelectorAll('.gc-ev.gc-tour')];
    const colsBox = $('.gc-cols');
    if (document.fonts && document.fonts.load) {
      ['400', '600', '700'].forEach((w) => document.fonts.load(`${w} 14px "Open Sans ZW"`));
      ['400', '500'].forEach((w) => document.fonts.load(`${w} 14px "Roboto GC"`));
    }
    [...HOMES.map(([f]) => f), 'map-westerville.svg'].forEach((f) => { const im = new Image(); im.src = x.img(f); });

    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, geo = '', feed = null, G = null, lastUrl = '';
    let AW = 1280, AH = 720;

    // the window's design size from the frame; the map crop, the pins and the calendar's events are placed here
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
      app.classList.toggle('cr-narrow', tall);
      shot.style.aspectRatio = `${W} / ${H}`;
      card.classList.toggle('zc-tall', tall);
      // the map: the 1400 px drawing scaled and centred on the crop; the overlay in the panel's own px
      const c = tall ? MAP.tall : MAP.wide;
      const pw = mapBox.offsetWidth, ph = mapBox.offsetHeight;
      const px = (mx) => pw / 2 + (mx - c.cx) * c.s, py = (my) => ph / 2 + (my - c.cy) * c.s;
      mi.style.width = `${MAP.w * c.s}px`; mi.style.height = `${MAP.h * c.s}px`;
      mi.style.left = `${px(0)}px`; mi.style.top = `${py(0)}px`;
      roads.forEach((n, i) => { const [, rx, ry, a] = ROADS[i]; n.style.left = `${px(rx)}px`; n.style.top = `${py(ry)}px`; n.style.transform = `translate(-50%, -50%) rotate(${a}deg)`; });
      spins.forEach((n, i) => { n.style.left = `${px(SCHOOLS[i][2])}px`; n.style.top = `${py(SCHOOLS[i][3])}px`; });
      pins.forEach((n, i) => { n.style.left = `${px(HOMES[i][9])}px`; n.style.top = `${py(HOMES[i][10])}px`; });
      // the calendar: hour rows fill the grid's height
      const grid = $('.gc-grid');
      const prevD = gc.style.display; gc.style.display = '';
      const hh = grid.offsetHeight / (H1 - H0);
      gc.style.display = prevD;
      gc.style.setProperty('--hh', `${hh.toFixed(2)}px`);
      evs.forEach((n) => { const d = +n.dataset.d, a = +n.dataset.a, b = +n.dataset.b;
        n.style.left = `calc(${(100 * d / 7).toFixed(4)}% + 1px)`; n.style.width = `calc(${(100 / 7).toFixed(4)}% - 9px)`;
        n.style.top = `${((a - H0) * hh + 1).toFixed(1)}px`; n.style.height = `${((b - a) * hh - 3).toFixed(1)}px`; });
      G = { tall };
    };

    const tabPt = () => {
      const a = app.getBoundingClientRect(), b = t2.getBoundingClientRect();
      const sc = a.width / AW || 1;
      return { x: (b.left - a.left + b.width * 0.42) / sc, y: (b.top - a.top + b.height * 0.55) / sc };
    };

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        layout();
        const n = streamCount(SAY, T.r + 0.05, CPS, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        const ci = outCubic(seg(t, T.card, T.card + CARD_IN));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px)`;
        checks.forEach((c, i) => {
          const o = outCubic(seg(t, T.ok[i], T.ok[i] + POP));
          c.spin.style.opacity = (1 - seg(t, T.ok[i] - 0.06, T.ok[i] + 0.04)).toFixed(3);
          c.spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
          c.ck.style.opacity = o.toFixed(3);
          c.ck.style.transform = `scale(${lerp(0.4, 1, o).toFixed(4)})`;
        });
        if (!G) return;

        // ---- phase A: the pins drop onto the map, then the tours are requested ----
        pins.forEach((p, i) => {
          const q = outCubic(seg(t, T.pin[i], T.pin[i] + PIN_IN));
          p.style.opacity = seg(t, T.pin[i], T.pin[i] + PIN_IN * 0.5).toFixed(3);
          p.style.setProperty('--dy', `${((1 - q) * -14).toFixed(2)}px`);
          const ti = HOMES[i][11] ? i : -1;
          p.classList.toggle('zw-booked', ti >= 0 && t >= T.tour[ti]);
        });
        spins.forEach((p, i) => {
          const q = outCubic(seg(t, T.school[i], T.school[i] + PIN_IN));
          p.style.opacity = q.toFixed(3);
          p.style.setProperty('--sc', lerp(0.6, 1, q).toFixed(4));
        });
        tours.forEach((b, i) => {
          const q = outCubic(seg(t, T.tour[i], T.tour[i] + TOUR_IN));
          b.style.opacity = q.toFixed(3);
          b.style.transform = q >= 1 ? 'none' : `translateY(${((1 - q) * -6).toFixed(2)}px) scale(${lerp(0.9, 1, q).toFixed(4)})`;
        });

        // ---- phase B: the Calendar tab, the viewings popping into the week ----
        const cal = t >= T.cal;
        t1.classList.toggle('on', !cal);
        t2.classList.toggle('on', cal);
        const u = cal ? esc(CURL) : esc(ZURL);
        if (u !== lastUrl) { url.innerHTML = u; lastUrl = u; }
        zw.style.display = cal ? 'none' : '';
        gc.style.display = cal ? '' : 'none';
        tourEvs.forEach((e, i) => {
          const q = outCubic(seg(t, T.ev[i], T.ev[i] + EV_IN));
          e.style.opacity = seg(t, T.ev[i], T.ev[i] + EV_IN * 0.6).toFixed(3);
          e.style.transform = q >= 1 ? 'none' : `scale(${lerp(0.82, 1, q).toFixed(4)})`;
          const ring = seg(t, T.ev[i], T.ev[i] + 0.7);
          e.style.setProperty('--ring', ring > 0 && ring < 1 ? `0 0 0 ${(6 * ring).toFixed(2)}px rgba(11, 128, 67, ${(0.35 * (1 - ring)).toFixed(3)})` : '0 0 0 0 transparent');
        });
      },
      // the pointer: from the listings to the Calendar tab, presses it, fades as the calendar shows
      pointer(t) {
        if (!G || t < T.ptr - 0.15 || t > T.cal + 0.35) return null;
        const W = x.root.offsetWidth, s = W / AW;
        const tp = tabPt();
        const from = { x: tp.x + (G.tall ? 120 : 260), y: tp.y + (G.tall ? 380 : 300) };
        const m = inOutCubic(seg(t, T.ptr, T.arrive));
        const v = seg(t, T.ptr - 0.15, T.ptr) * (1 - seg(t, T.cal + 0.05, T.cal + 0.35));
        return { x: lerp(from.x, tp.x, m) * s, y: lerp(from.y, tp.y, m) * s, p: press(t, T.press), v };
      },
      // after the camera: pin the layer over the card's window, then open it to the whole frame
      after(t) {
        if (t < T.card) { layer.style.opacity = '0'; return; }
        layout();
        const b = x.box(shot);
        const root = x.root;
        feed = feed || card.closest('.feed');
        const W = root.offsetWidth, H = root.offsetHeight;
        const g = inOutCubic(seg(t, T.grow, T.full));
        const L = lerp(b.x, 0, g), Tp = lerp(b.y, 0, g), Wd = lerp(b.w, W, g), Ht = lerp(b.h, H, g);
        const s = shot.offsetWidth ? b.w / shot.offsetWidth : 1;
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
