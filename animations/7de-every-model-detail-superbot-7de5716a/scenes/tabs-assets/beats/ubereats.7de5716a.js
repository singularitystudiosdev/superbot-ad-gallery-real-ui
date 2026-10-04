// Uber Eats beat: the burger ask goes to the app that actually delivers. Three tool chips land (find the spot, build
// the order, pay), then a two-column order rises: the itemised cart with its modifiers and Uber One fees on the left,
// the live tracker on the right. "Place order" resolves to "Order placed", the route draws across the map, the courier
// starts toward the restaurant and the tracker steps to Preparing. Pure function of t. Photo: img/burger.jpg =
// "Cheeseburger.jpg" by Renee Comet, National Cancer Institute (public domain). "Mission Smash Co." and the courier
// are made up; the map is drawn for the spot.
import { lerp, seg, outCubic, outBack, inOutCubic, streamCount } from '../../../lib.js';

const SAY = 'Well earned. Celebration burger from the best-rated smash spot near you.';
const CHIPS = [
  ['Searching Uber Eats near 1480 Market St', 'Picked Mission Smash Co. · ★ 4.9 · 0.6 mi'],
  ['Building your order: double smash, no pickles', 'Added Double Smash Burger + Fries'],
  ['Checking out with your saved card', 'Paid with Visa ending 4242'],
];
const CHECK = '<svg class="ue-check" viewBox="0 0 24 24"><path class="ue-check-p" d="M4.5 12.5l5 5L19.5 7"/></svg>';
const PIN = '<svg class="ue-pinic" viewBox="0 0 24 24"><path d="M12 22s7-6.6 7-12a7 7 0 0 0-14 0c0 5.4 7 12 7 12Z"/><circle cx="12" cy="10" r="2.6" fill="#121212"/></svg>';
const STAR = '<svg class="ue-star" viewBox="0 0 24 24"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9Z"/></svg>';
const MAP = `<svg class="ue-mapsvg" viewBox="0 0 480 214" preserveAspectRatio="xMidYMid slice">
  <rect x="-20" y="-20" width="520" height="254" fill="#e8ebee"/>
  <g fill="#dde1e5">${[[18, 14, 92, 52], [126, 14, 104, 52], [246, 14, 96, 52], [358, 14, 108, 52], [18, 84, 92, 50], [246, 84, 96, 50], [358, 84, 108, 50], [18, 152, 92, 48], [126, 152, 104, 48], [358, 152, 108, 48]].map(([a, b, c, d]) => `<rect x="${a}" y="${b}" width="${c}" height="${d}" rx="4"/>`).join('')}</g>
  <rect x="126" y="84" width="104" height="50" rx="6" fill="#cfe8c9"/><text x="178" y="113" class="ue-ml ue-ml-park">Dolores Park</text>
  <rect x="246" y="152" width="96" height="48" rx="6" fill="#d6dbe0"/>
  <g stroke="#fff" stroke-width="10" stroke-linecap="round">
    <path d="M0 75 H480"/><path d="M0 143 H480"/><path d="M118 0 V214"/><path d="M238 0 V214"/><path d="M350 0 V214"/>
  </g>
  <path d="M-10 196 L490 18" stroke="#fff" stroke-width="16" stroke-linecap="round"/>
  <path d="M-10 196 L490 18" stroke="#f6d77a" stroke-width="3" stroke-linecap="round" opacity=".8"/>
  <text x="300" y="66" class="ue-ml" transform="rotate(-19.6 300 66)">Market St</text>
  <text x="238" y="114" class="ue-ml" dy="3" transform="rotate(-90 238 114)">Valencia St</text>
  <text x="64" y="146" class="ue-ml">16th St</text>
  <path class="ue-route-bg" d="M378 143 H350 V75 H118 V40" pathLength="1"/>
  <path class="ue-route" d="M378 143 H350 V75 H118 V40" pathLength="1"/>
  <path class="ue-approach" d="M478 143 H398" fill="none" stroke="none"/>
  <g class="ue-pin ue-pin-r" transform="translate(378 143)"><circle r="15" fill="#000"/><path d="M-6 -6 v5 a2 2 0 0 0 4 0 v-5 M-4 -6 v14 M3 -6 c3 0 4 3 4 6 h-4 v8" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/></g>
  <g class="ue-pin ue-pin-h" transform="translate(118 40)"><circle r="15" fill="#06c167"/><path d="M-7 1 L0 -6 L7 1 M-5 -1 V7 H5 V-1" stroke="#fff" stroke-width="2.2" fill="none" stroke-linejoin="round"/></g>
  <g class="ue-bub" transform="translate(118 40)"><rect x="18" y="-14" width="56" height="26" rx="13" fill="#000"/><text x="46" y="4" class="ue-bub-t">18 min</text></g>
  <g class="ue-courier"><circle r="11" fill="#fff" stroke="#000" stroke-width="2.5"/><circle r="5" fill="#000"/></g>
</svg>`;

export default {
  times(r) {
    const T = { r };
    T.chipIn = [r + 0.25, r + 0.55, r + 0.85];
    T.card = r + 1.2;
    T.placed = T.card + 1.3;
    T.chipDone = [r + 0.6, r + 1.15, T.placed];
    T.eta = T.placed + 0.4;
    T.end = T.eta + 1.1;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const rows = CHIPS.map(([run]) => x.el(`<div class="dd-chiprow"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">${x.esc(run)}</span></div></div>`));
    const photo = x.img('burger.jpg');
    const card = x.el(`<div class="ue-card">
      <div class="ue-col ue-order">
        <div class="ue-head"><img class="ue-logo" src="${x.brand('ubereats-logo.svg')}" alt="Uber Eats"/><span class="ue-one">Uber One</span><span class="ue-tag">2 items · Delivery</span></div>
        <div class="ue-photo"><img src="${photo}" alt="Double smash burger"/><span class="ue-place"><b>Mission Smash Co.</b><span>${STAR}4.9 (2,140) · Burgers · 0.6 mi</span></span></div>
        <div class="ue-items">
          <div class="ue-item"><span class="ue-qty">1×</span><span class="ue-im"><b>Double Smash Burger</b><span class="ue-mods"><i>2 patties</i><i>American cheese</i><i>No pickles</i><i>Brioche bun</i></span></span><span class="ue-p">$12.49</span></div>
          <div class="ue-item"><span class="ue-qty">1×</span><span class="ue-im"><b>Fries</b><span class="ue-mods"><i>Large</i><i>Sea salt</i></span></span><span class="ue-p">$4.29</span></div>
        </div>
        <div class="ue-fees">
          <div><span>Subtotal</span><span>$16.78</span></div>
          <div><span>Delivery fee <em class="ue-u1">Uber One</em></span><span><s>$2.49</s> $0.00</span></div>
          <div><span>Service fee</span><span>$2.52</span></div>
          <div><span>Courier tip</span><span>$4.00</span></div>
          <div class="ue-total"><span>Total</span><span>$23.30</span></div>
        </div>
        <div class="ue-btn">
          <span class="ue-g ue-ga">Place order · $23.30</span>
          <span class="ue-g ue-gb">${CHECK}<span>Order placed</span></span>
          <i class="ue-shine" aria-hidden="true"></i>
        </div>
      </div>
      <div class="ue-col ue-track">
        <div class="ue-eta"><span class="ue-eta-l"><small>Estimated arrival</small><b>7:42 PM</b></span><span class="ue-eta-r"><b>18</b><small>min</small></span></div>
        <div class="ue-map">${MAP}</div>
        <div class="ue-steps">
          <div class="ue-bar"><i></i></div>
          <div class="ue-st"><span>Placed</span><span>Preparing</span><span>Picked up</span><span>Arriving</span></div>
        </div>
        <div class="ue-drop">${PIN}<span class="ue-dt"><b>1480 Market St, Apt 5</b><small>Leave at door · Ring the bell</small></span><span class="ue-ord">#UE-4821</span></div>
        <div class="ue-cour"><span class="ue-av">MK</span><span class="ue-ct"><b>Marco is heading to Mission Smash Co.</b><small>Toyota Prius · ★ 4.98 · 1,820 deliveries</small></span><span class="ue-msg">Message</span></div>
      </div>
    </div>`);
    const $ = (s) => card.querySelector(s), $$ = (s) => [...card.querySelectorAll(s)];
    const btn = $('.ue-btn'), ga = $('.ue-ga'), gb = $('.ue-gb'), checkP = $('.ue-check-p'), check = $('.ue-check'), shine = $('.ue-shine');
    const route = $('.ue-route'), approach = $('.ue-approach'), courier = $('.ue-courier'), bub = $('.ue-bub');
    const eta = $('.ue-eta'), bar = $('.ue-bar i'), steps = $$('.ue-st span'), cour = $('.ue-cour');
    const items = $$('.ue-item'), fees = $('.ue-fees'), drop = $('.ue-drop');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const chips = rows.map((r) => r.firstElementChild);
    let shown = -1, apLen = 0;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };

    return {
      nodes: [say, ...rows, card],
      marks: [[T.r, say], ...rows.map((r, i) => [T.chipIn[i], r]), [T.card, card]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.05, 90, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        chips.forEach((c, i) => {
          rise(rows[i], seg(t, T.chipIn[i], T.chipIn[i] + 0.35), 8);
          const done = t >= T.chipDone[i];
          const sp = c.firstElementChild;
          sp.classList.toggle('done', done);
          sp.style.transform = done ? '' : `rotate(${(((t - T.chipIn[i]) * 450) % 360).toFixed(1)}deg)`;
          const lab = done ? CHIPS[i][1] : CHIPS[i][0];
          if (c.lastElementChild.textContent !== lab) c.lastElementChild.textContent = lab;
        });
        const ci = seg(t, T.card, T.card + 0.55);
        card.style.opacity = outCubic(ci).toFixed(3);
        card.style.transform = ci >= 1 ? '' : `translateY(${((1 - outCubic(ci)) * 20).toFixed(2)}px) scale(${lerp(0.97, 1, outCubic(ci)).toFixed(4)})`;
        items.forEach((it, i) => rise(it, seg(t, T.card + 0.2 + i * 0.12, T.card + 0.5 + i * 0.12), 6));
        rise(fees, seg(t, T.card + 0.4, T.card + 0.75), 6);

        // Place order -> Order placed: a press, a shine, the label rolls over to a drawn check
        const P = T.placed;
        const down = seg(t, P - 0.08, P + 0.02) * (1 - seg(t, P + 0.08, P + 0.24));
        btn.style.transform = `scale(${(1 - 0.05 * down + 0.03 * Math.sin(Math.PI * seg(t, P + 0.1, P + 0.5))).toFixed(4)})`;
        card.classList.toggle('is-placed', t >= P);
        const sh = seg(t, P + 0.02, P + 0.62);
        shine.style.opacity = (sh > 0 && sh < 1 ? Math.sin(Math.PI * Math.min(1, sh * 1.25)) : 0).toFixed(3);
        shine.style.transform = `translateX(${lerp(-160, 300, 0.5 - Math.cos(Math.PI * sh) / 2).toFixed(1)}%) skewX(-20deg)`;
        const ro = outCubic(seg(t, P + 0.04, P + 0.3));
        ga.style.opacity = (1 - ro).toFixed(3);
        ga.style.transform = `translate(-50%, calc(-50% - ${(ro * 10).toFixed(2)}px))`;
        const gi = outCubic(seg(t, P + 0.1, P + 0.45));
        gb.style.opacity = gi.toFixed(3);
        gb.style.transform = `translate(-50%, calc(-50% + ${((1 - gi) * 10).toFixed(2)}px)) scale(${lerp(0.9, 1, outBack(seg(t, P + 0.1, P + 0.5))).toFixed(4)})`;
        checkP.style.strokeDashoffset = (23 * (1 - outCubic(seg(t, P + 0.14, P + 0.44)))).toFixed(2);
        check.style.transform = `scale(${lerp(0.55, 1, outBack(seg(t, P + 0.14, P + 0.4))).toFixed(3)})`;

        // the tracker comes alive once the order is in: route draws, courier heads to the restaurant, Preparing lights
        route.style.strokeDashoffset = (1 - inOutCubic(seg(t, P + 0.1, P + 0.9))).toFixed(4);
        if (!apLen) apLen = approach.getTotalLength();
        const ap = approach.getPointAtLength(apLen * inOutCubic(seg(t, P + 0.3, T.end)) * 0.85);
        courier.setAttribute('transform', `translate(${ap.x.toFixed(2)} ${ap.y.toFixed(2)})`);
        courier.style.opacity = seg(t, P + 0.2, P + 0.45).toFixed(3);
        const bb = outBack(seg(t, T.eta - 0.1, T.eta + 0.3));
        bub.style.opacity = seg(t, T.eta - 0.1, T.eta + 0.15).toFixed(3);
        bub.setAttribute('transform', `translate(118 40) scale(${lerp(0.6, 1, bb).toFixed(3)})`);
        rise(drop, seg(t, T.card + 0.45, T.card + 0.8), 6);
        const ep = seg(t, T.eta - 0.2, T.eta + 0.15);
        eta.style.setProperty('--lit', outCubic(ep).toFixed(3));
        const fill = lerp(0, 0.12, outCubic(seg(t, P, P + 0.3))) + lerp(0, 0.26, outCubic(seg(t, T.eta, T.eta + 0.5)));
        bar.style.transform = `scaleX(${fill.toFixed(4)})`;
        steps[0].classList.toggle('on', t >= P);
        steps[1].classList.toggle('on', t >= T.eta + 0.2);
        rise(cour, seg(t, T.eta + 0.15, T.eta + 0.55), 6);
      },
    };
  },
};