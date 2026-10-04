// Superbot Agent beat: three tool chips land (open DoorDash, compare spots, check out), then a two-column order card
// rises: photo, a three-spot comparison with the pick locking in, the line item; beside it a live map whose route
// draws in, a four-step tracker and the fees. The gradient pill resolves "Placing order..." into "Ordered!", the
// Dasher dot sets off and the ETA lights. Same clock as the source spot's DoorDash beat (end = r + 4.0).
// Card photo: img/burger.jpg = "Cheeseburger.jpg" by Renee Comet, National Cancer Institute (NCI Visuals Online
// 2652), public domain. Every restaurant name, rating, price and the map are made up.
import { lerp, seg, outCubic, outBack, streamCount } from '../../../lib.js';

const SAY = 'Well earned. Ordering the best-rated burger near you.';
const CHIPS = [
  ['Opening DoorDash', 'Opened DoorDash'],
  ['Comparing 3 burger spots near you', 'Picked Main Street Burger Co. · 4.8★ · fastest'],
  ['Checking out with your saved card', 'Checked out · Visa ending 4242'],
];
const SPOTS = [['Main Street Burger Co.', '4.8', '0.8 mi', '24 min', '$7.99'], ['Griddle House', '4.6', '1.4 mi', '31 min', '$9.49'], ['Smash Lane', '4.4', '2.1 mi', '38 min', '$8.25']];
const STEPS = ['Placed', 'Preparing', 'Picked up', 'At your door'];
const ROUTE = [[40, 112], [110, 112], [110, 60], [200, 60], [200, 30], [236, 30]];
const BAG = '<svg class="dd-bag" viewBox="0 0 24 24"><path d="M5 8h14l-1.2 12H6.2Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>';
const CHECK = '<svg class="dd-check" viewBox="0 0 24 24"><path class="dd-check-p" d="M4.5 12.5l5 5L19.5 7"/></svg>';
const PIN = '<svg viewBox="0 0 24 24"><path d="M20 10c0 4.99-5.54 10.19-7.4 11.8a1 1 0 0 1-1.2 0C9.54 20.19 4 14.99 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>';
const CLOCK = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>';
const STAR = '<svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9Z"/></svg>';
const TICK = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

const SEGS = ROUTE.slice(1).map((p, i) => Math.hypot(p[0] - ROUTE[i][0], p[1] - ROUTE[i][1]));
const ROUTE_LEN = SEGS.reduce((a, b) => a + b, 0);
function along(f) {
  let d = f * ROUTE_LEN;
  for (let i = 0; i < SEGS.length; i++) {
    if (d <= SEGS[i] || i === SEGS.length - 1) { const u = Math.min(1, d / SEGS[i]), a = ROUTE[i], b = ROUTE[i + 1]; return [lerp(a[0], b[0], u), lerp(a[1], b[1], u)]; }
    d -= SEGS[i];
  }
  return ROUTE[ROUTE.length - 1];
}

const MAP = `<svg class="od-svg" viewBox="0 0 280 140" preserveAspectRatio="xMidYMid slice">
  <rect width="280" height="140" class="od-land"/>
  <path class="od-water" d="M178 140C196 118 236 100 280 94V140Z"/>
  <rect class="od-park" x="20" y="10" width="62" height="36" rx="6"/>
  <g class="od-minor">${[40, 70, 150, 172, 244].map((v) => `<path d="M${v} 0V140"/>`).join('')}${[30, 88, 132].map((v) => `<path d="M0 ${v}H280"/>`).join('')}</g>
  <g class="od-major"><path d="M0 60H280"/><path d="M0 112H280"/><path d="M110 0V140"/><path d="M200 0V140"/></g>
  <text class="od-st" x="122" y="56">Market St</text><text class="od-st" x="124" y="114.3">Mission St</text>
  <path class="od-route-u" d="M${ROUTE.map((p) => p.join(' ')).join('L')}"/>
  <path class="od-route" d="M${ROUTE.map((p) => p.join(' ')).join('L')}" pathLength="1"/>
  <g class="od-shop" transform="translate(40 112)"><circle r="8"/><path d="M-3.4 -1.2h6.8M-3.6 1.4h7.2M-3 -1.2a3 2.6 0 0 1 6 0" /></g>
  <g class="od-home" transform="translate(236 30)"><circle r="8"/><path d="M-3.6 0.6L0 -3l3.6 3.6V3.6h-7.2Z"/></g>
  <g class="od-dash"><circle class="od-halo" r="9"/><circle class="od-dot" r="4.6"/></g>
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
    const card = x.el(`<div class="dd-card od-card">
      <div class="dd-head"><img class="dd-logo" src="${x.brand('doordash-logo.svg')}" alt="DoorDash"/><b>DoorDash order</b><span class="dd-tag">1 item · 3 spots compared</span></div>
      <div class="od-cols">
        <div class="od-left">
          <div class="dd-photo od-photo"><img src="${photo}" alt="Cheeseburger"/><span class="dd-place"><b>Main Street Burger Co.</b><i>${STAR}4.8</i><em>0.8 mi</em></span></div>
          <div class="od-cmp"><small>Compared near you</small>${SPOTS.map(([name, rate, dist, eta, price], i) => `<div class="od-spot${i ? '' : ' od-best'}"><b>${x.esc(name)}</b><span class="od-rate">${STAR}${rate}</span><span>${dist}</span><span>${eta}</span><span class="od-pr">${price}</span>${i ? '' : `<em class="od-pick">${TICK}Best pick</em>`}</div>`).join('')}</div>
          <div class="dd-item"><span class="dd-thumb" style="background-image:url('${photo}')"></span><span class="dd-meta"><b>Cheeseburger</b><small>Cheddar, pickles, house sauce</small></span><span class="dd-qty">1x</span><span class="dd-price">$7.99</span></div>
        </div>
        <div class="od-right">
          <div class="od-map">${MAP}<span class="od-eta">${CLOCK}<b>24 min</b></span></div>
          <div class="od-track"><i class="od-bar"><i class="od-fill"></i></i>${STEPS.map((s) => `<span class="od-step"><i></i>${s}</span>`).join('')}</div>
          <div class="dd-fees">
            <div><span>Delivery fee</span><span>$1.99</span></div>
            <div><span>Service fee</span><span>$1.42</span></div>
            <div><span>Dasher tip</span><span>$3.00</span></div>
            <div class="dd-total"><span>Total</span><span>$14.40</span></div>
          </div>
        </div>
      </div>
      <div class="dd-addr"><span class="dd-pin">${PIN}</span><span class="dd-where"><b>Deliver to 1480 Market St, Apt 5</b><small>Visa ending 4242 · leave at door</small></span><span class="dd-eta"><span class="dd-eta-a">${CLOCK}24 min</span></span></div>
      <div class="dd-btn">
        <span class="dd-grp dd-grp-a">${BAG}<span class="dd-lab-a">Placing order</span></span>
        <span class="dd-grp dd-grp-b">${CHECK}<span class="dd-lab-b">Ordered!</span></span>
        <i class="dd-shine" aria-hidden="true"></i>
      </div>
    </div>`);
    const $ = (s) => card.querySelector(s), $$ = (s) => [...card.querySelectorAll(s)];
    const btn = $('.dd-btn'), grpA = $('.dd-grp-a'), grpB = $('.dd-grp-b'), labA = $('.dd-lab-a'), bag = $('.dd-bag');
    const check = $('.dd-check'), checkP = $('.dd-check-p'), shine = $('.dd-shine'), etaPill = $('.dd-eta');
    const spots = $$('.od-spot'), pick = $('.od-pick'), best = $('.od-best');
    const route = $('.od-route'), dash = $('.od-dash'), halo = $('.od-halo'), mapEta = $('.od-eta');
    const steps = $$('.od-step'), fill = $('.od-fill');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const chips = rows.map((r) => r.firstElementChild);
    let shown = -1;
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
        rise(card, ci, 20);
        card.style.transform = ci >= 1 ? '' : `translateY(${((1 - outCubic(ci)) * 20).toFixed(2)}px) scale(${lerp(0.97, 1, outCubic(ci)).toFixed(4)})`;

        // the comparison: rows land, the pick locks in
        spots.forEach((s, i) => rise(s, seg(t, T.card + 0.15 + i * 0.1, T.card + 0.45 + i * 0.1), 5));
        const pk = seg(t, T.card + 0.6, T.card + 0.9);
        best.classList.toggle('on', t >= T.card + 0.6);
        pick.style.opacity = outCubic(pk).toFixed(3);
        pick.style.transform = `scale(${lerp(0.6, 1, outBack(pk)).toFixed(4)})`;

        // the map: the route draws, then the Dasher sets off once the order is placed
        const P = T.placed;
        route.style.strokeDashoffset = (1 - outCubic(seg(t, T.card + 0.3, T.card + 1.1))).toFixed(4);
        const [dx, dy] = along(0.22 * outCubic(seg(t, P + 0.2, T.end + 0.6)));
        dash.setAttribute('transform', `translate(${dx.toFixed(2)} ${dy.toFixed(2)})`);
        dash.style.opacity = seg(t, P, P + 0.25).toFixed(3);
        const hp = t >= P ? ((t - P) * 1.4) % 1 : 0;
        halo.setAttribute('r', (5 + 9 * hp).toFixed(2));
        halo.style.opacity = (t >= P ? 0.55 * (1 - hp) : 0).toFixed(3);
        const me = seg(t, T.eta - 0.2, T.eta + 0.2);
        mapEta.style.setProperty('--lit', outCubic(me).toFixed(3));
        mapEta.style.transform = `scale(${(1 + 0.1 * Math.sin(Math.PI * me)).toFixed(4)})`;

        // the tracker: placed lights with the button, preparing goes live with the ETA
        const reached = [P + 0.1, T.eta, Infinity, Infinity];
        steps.forEach((s, i) => { s.classList.toggle('on', t >= reached[i]); s.classList.toggle('live', i === 1 && t >= T.eta); });
        fill.style.transform = `scaleX(${(0.02 + 0.31 * outCubic(seg(t, P + 0.1, T.eta)) + 0.06 * seg(t, T.eta, T.end + 0.6)).toFixed(4)})`;

        // the order pill: placing -> "Ordered!" with a dip, a shine and a drawn check
        labA.textContent = 'Placing order' + '.'.repeat(1 + (Math.floor(Math.max(0, t - T.card) * 4) % 3));
        const down = seg(t, P - 0.06, P + 0.04) * (1 - seg(t, P + 0.1, P + 0.24));
        const pop = outBack(seg(t, P + 0.1, P + 0.5));
        btn.style.transform = `scale(${(1 - 0.05 * down + 0.03 * Math.sin(Math.PI * seg(t, P + 0.1, P + 0.5))).toFixed(4)})`;
        const sh = seg(t, P + 0.02, P + 0.62);
        shine.style.opacity = (sh > 0 && sh < 1 ? Math.sin(Math.PI * Math.min(1, sh * 1.25)) : 0).toFixed(3);
        shine.style.transform = `translateX(${lerp(-160, 300, 0.5 - Math.cos(Math.PI * sh) / 2).toFixed(1)}%) skewX(-20deg)`;
        const ro = seg(t, P + 0.04, P + 0.3);
        grpA.style.opacity = (1 - outCubic(ro)).toFixed(3);
        grpA.style.transform = `translate(-50%, calc(-50% - ${(outCubic(ro) * 10).toFixed(2)}px))`;
        bag.style.transform = `rotate(${(-40 * ro).toFixed(1)}deg) scale(${(1 - 0.6 * ro).toFixed(3)})`;
        const gi = seg(t, P + 0.1, P + 0.45);
        grpB.style.opacity = outCubic(gi).toFixed(3);
        grpB.style.transform = `translate(-50%, calc(-50% + ${((1 - outCubic(gi)) * 10).toFixed(2)}px)) scale(${lerp(0.9, 1, pop).toFixed(4)})`;
        checkP.style.strokeDashoffset = (23 * (1 - outCubic(seg(t, P + 0.14, P + 0.44)))).toFixed(2);
        check.style.transform = `scale(${lerp(0.55, 1, outBack(seg(t, P + 0.14, P + 0.4))).toFixed(3)})`;
        card.classList.toggle('is-placed', t >= P);
        const ep = seg(t, T.eta - 0.2, T.eta + 0.15);
        etaPill.style.setProperty('--lit', outCubic(ep).toFixed(3));
        etaPill.style.transform = `scale(${(1 + 0.08 * Math.sin(Math.PI * ep)).toFixed(4)})`;
      },
    };
  },
};
