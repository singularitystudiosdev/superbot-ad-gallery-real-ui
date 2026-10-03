// Fares beat: Gemini searches fares and stays for the trip. Its line streams and a card rises (the base's catalog
// grammar: a compact card, a counter, rows that resolve). First the trip: a neutral pin tile, "Lisbon, Portugal",
// "May 12 to 16" and a "5 days" chip. Then the counter "Comparing 312 flights and 86 stays" ticks up both numbers while
// its thin bar fills, and three findings resolve as rows (a plane glyph tile or the stay's / tour's own photo; the
// name; a short line; one tag). The first, TAP Air Portugal's nonstop fare, carries the highlight. The footer lands with
// the green check: "Best fare and stay found for May 12 to 16".
// TRIP is the one table of trip facts every later beat and the Expedia trip page read (brand/CREDITS.txt DATA: the
// traveler, the stay's name and every price are made up for the spot). Pure function of t: every moving value is
// written from t, so ?t= and __AD.seek freeze any frame.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';
import { lc } from './lucide-icons.js?v=4808b6b8';

const SAY = 'Compared every fare and stay for your dates and budget.';
export const TRIP = {
  city: 'Lisbon, Portugal', dates: 'May 12 to 16', year: '2027', traveler: 'Jordan Ellis', initials: 'JE',
  flights: 312, stays: 86, days: 5, budget: 2000, total: 1657,
  flight: { price: 784, airline: 'TAP Air Portugal' },
  stay: { name: 'Pateo das Laranjeiras', area: 'Alfama', nights: 4, nightly: 178, price: 712, rating: '9.1', cancel: 'May 9' },
  sintra: { name: 'Sintra and Pena Palace day trip', price: 89 },
  fado: { name: 'Fado dinner in Alfama', price: 72 },
  itinerary: '7291 4408 1132',
};
export const usd = (n) => '$' + Math.round(n).toLocaleString('en-US');
// the findings: [name, short line, tag, thumb (img/ file, or a lucide glyph name prefixed 'lc:'), highlighted]
const FINDINGS = [
  [TRIP.flight.airline, 'JFK to LIS nonstop', `Best fare ${usd(TRIP.flight.price)}`, 'lc:plane', true],
  [`${TRIP.stay.name}, ${TRIP.stay.area}`, `${TRIP.stay.rating} guest rating, ${TRIP.stay.nights} nights`, `${usd(TRIP.stay.nightly)} a night`, 'stay-room.jpg', false],
  [TRIP.sintra.name, 'Small group, hotel pickup', usd(TRIP.sintra.price), 'sintra-pena.jpg', false],
];
const DONE = `Best fare and stay found for ${TRIP.dates}`;
// timing (seconds from the reply start, or from the card where noted), in the base's v3 pace
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const COUNT_AT = 0.2;                  // the card landing to the counter starting
const COUNT = 0.7; /* deliberate */    // the counter running up to 312 and 86 (its bar fills with it)
const ROW_AT = 0.3;                    // the counter starting to the first finding
const STAGGER = 0.14;                  // one finding to the next
const ROW_IN = 0.24;                   // a finding rising in
const FOOT_AT = 0.24;                  // the last finding starting to the footer
const FOOT_IN = 0.24;                  // the footer rising in

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.c0 = T.card + COUNT_AT;
    T.c1 = T.c0 + COUNT;
    T.row = FINDINGS.map((_, i) => T.c0 + ROW_AT + i * STAGGER);
    T.foot = Math.max(T.row[FINDINGS.length - 1] + FOOT_AT, T.c1);
    T.end = Math.max(T.foot + FOOT_IN, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const thumb = (th) => (th.startsWith('lc:') ? `<span class="ct-th ct-gl">${lc(th.slice(3))}</span>` : `<span class="ct-th"><img src="${x.img(th)}" alt=""/></span>`);
    const card = x.el(`<div class="ct-card">
      <div class="ct-store">
        <span class="ct-bag">${lc('map-pin')}</span>
        <span class="ct-sm"><b>${x.esc(TRIP.city)}</b><code>${x.esc(TRIP.dates)}</code></span>
        <span class="ct-np">${TRIP.days} days</span>
      </div>
      <div class="ct-ch"><span class="ct-st"><i class="ct-spin"></i>${x.OK}</span><b>Comparing <span class="ct-n">0</span> flights and <span class="ct-p">0</span> stays</b></div>
      <i class="ct-cbar"><i></i></i>
      <div class="ct-list">${FINDINGS.map(([name, text, tag, th, hi]) => `<div class="ct-row${hi ? ' ct-hi' : ''}">${thumb(th)}
        <div class="ct-main"><span class="ct-r1"><b>${x.esc(name)}</b><span class="ct-tag">${x.esc(tag)}</span></span><span class="ct-tx">${x.esc(text)}</span></div></div>`).join('')}</div>
      <div class="ct-ft">${x.OK}<span>${x.esc(DONE)}</span></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const st = { spin: $('.ct-spin'), ok: $('.ct-st .qc-ok') };
    const ch = $('.ct-ch'), cbarW = $('.ct-cbar'), cbar = $('.ct-cbar i'), n = $('.ct-n'), ph = $('.ct-p'), ft = $('.ct-ft');
    const rows = [...card.querySelectorAll('.ct-row')];
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, count = '';

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card], [T.row[1], rows[1]], [T.foot, ft]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // the counter and its bar: flights and stays run up together
        const cin = outCubic(seg(t, T.c0 - 0.1, T.c0 + 0.14));
        ch.style.opacity = cin.toFixed(3);
        cbarW.style.opacity = cin.toFixed(3);
        const q = inOutCubic(seg(t, T.c0, T.c1));
        const c = `${Math.round(TRIP.flights * q)}|${Math.round(TRIP.stays * q)}`;
        if (c !== count) { const [a, b] = c.split('|'); n.textContent = a; ph.textContent = b; count = c; }
        cbar.style.transform = `scaleX(${q.toFixed(4)})`;
        const d = outCubic(seg(t, T.c1, T.c1 + 0.2));
        st.spin.style.opacity = (1 - seg(t, T.c1 - 0.08, T.c1 + 0.06)).toFixed(3);
        st.spin.style.transform = `rotate(${((t - T.c0) * 420).toFixed(1)}deg)`;
        st.ok.style.opacity = d.toFixed(3);
        st.ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;

        rows.forEach((row, i) => {
          const o = outCubic(seg(t, T.row[i], T.row[i] + ROW_IN));
          row.style.opacity = o.toFixed(3);
          row.style.transform = o >= 1 ? 'none' : `translateY(${((1 - o) * 8).toFixed(2)}px)`;
        });
        const f = outCubic(seg(t, T.foot, T.foot + FOOT_IN));
        ft.style.opacity = f.toFixed(3);
        ft.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 6).toFixed(2)}px)`;
      },
    };
  },
};
