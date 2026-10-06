// Superbot, the order. It uses DoorDash for you: three tool chips in the thread (open, pick, check out) while the
// canvas pane shows how it chose (the three best of 14 spots inside a mile, compared on rating, time and total),
// the order it placed (the source spot's DoorDash card, with the gradient pill resolving "Placing order..." into
// "Ordered!"), a live map drawn in SVG (search radius, candidate pins, the pick, the Dasher's pickup leg and the
// delivery route) and the delivery tracker with the ETA. Card photo: img/burger.jpg ("Cheeseburger.jpg" by Renee
// Comet, NCI Visuals Online 2652, public domain). Restaurants, Dasher and address are made up. Pure function of t.
import { rise, setText, sayLine, refChip, drawStroke, IC, lerp, seg, outCubic } from './kit.66f654f1.js';
import { outBack } from '../../../lib.js';

const SAY = 'Well earned. Getting you a celebration burger.';
const CHIPS = [
  ['Opening DoorDash', 'Opened DoorDash'],
  ['Comparing 14 burger spots within a mile', 'Picked Main Street Burger Co.'],
  ['Checking out with your saved card', 'Checked out with your saved card'],
];
const SPOTS = [
  { id: 'msb', name: 'Main Street Burger Co.', kind: 'Burgers · 0.8 mi', star: '4.8', eta: '24 min', total: '$14.40', at: [140, 170], ini: '' },
  { id: 'ps', name: 'Patty Shack', kind: 'Burgers · 1.9 mi', star: '4.6', eta: '38 min', total: '$16.10', at: [392, 292], ini: 'PS', c: '#6b4a2b' },
  { id: 'g22', name: 'Grill 22', kind: 'American · 0.6 mi', star: '4.3', eta: '31 min', total: '$13.20', at: [60, 104], ini: 'G', c: '#2b4a6b' },
];
const HOME = [300, 126.7];
const STEPS = [['Order placed', '6:42 PM'], ['Preparing', '~8 min'], ['Picked up', '~6:54 PM'], ['Delivered', '~7:06 PM']];
const BAG = '<svg class="dd-bag" viewBox="0 0 24 24"><path d="M5 8h14l-1.2 12H6.2Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>';
const CHECK = '<svg class="dd-check" viewBox="0 0 24 24"><path class="dd-check-p" d="M4.5 12.5l5 5L19.5 7"/></svg>';
const BURGER = '<g class="om-bg"><path d="M-6 -1.5a6 4.2 0 0 1 12 0Z"/><rect x="-6.5" y="0" width="13" height="2" rx="1"/><path d="M-6 3h12a2 2 0 0 1-2 2.6h-8A2 2 0 0 1-6 3Z"/></g>';

function mapSvg() {
  const H = [50, 110, 170, 230, 290, 350, 410], V = [60, 140, 220, 300, 380];
  const streets = H.map((y) => `<line x1="0" x2="450" y1="${y}" y2="${y}"/>`).join('') + V.map((x) => `<line y1="0" y2="460" x1="${x}" x2="${x}"/>`).join('');
  const pins = SPOTS.map((s) => `<g class="om-pin om-${s.id}" transform="translate(${s.at[0]},${s.at[1]})"><g class="om-pg"><circle class="om-pc" r="11"/>${s.ini ? `<text y="3.5">${s.ini}</text>` : BURGER}</g></g>`).join('');
  return `<svg class="om" viewBox="0 0 450 460" preserveAspectRatio="xMidYMid slice">
    <rect width="450" height="460" class="om-land"/>
    <path class="om-water" d="M318 0H450V170C424 160 392 138 368 104C348 74 330 40 318 0Z"/>
    <rect class="om-park" x="152" y="238" width="58" height="44" rx="5"/>
    <rect class="om-park" x="308" y="358" width="64" height="44" rx="5"/>
    <rect class="om-blk" x="68" y="358" width="64" height="44" rx="4"/>
    <g class="om-st">${streets}</g>
    <path class="om-main" d="M-10 305.8L460 34.2"/>
    <text class="om-lab" transform="translate(22 283) rotate(-30)">Market St</text>
    <text class="om-lab" x="246" y="226">Mission St</text>
    <text class="om-lab" transform="translate(214 452) rotate(-90)">4th St</text>
    <text class="om-lab" x="12" y="406">Folsom St</text>
    <text class="om-lab" x="12" y="46">Howard St</text>
    <circle class="om-ring" cx="${HOME[0]}" cy="${HOME[1]}" r="150"/>
    <path class="om-leg" pathLength="1" d="M60 230L60 170L140 170"/>
    <path class="om-route-bg" d="M140 170L220 170L${HOME[0]} ${HOME[1]}"/>
    <path class="om-route" pathLength="1" d="M140 170L220 170L${HOME[0]} ${HOME[1]}"/>
    ${pins}
    <g class="om-home" transform="translate(${HOME[0]},${HOME[1]})"><circle class="om-hp" r="16"/><circle r="11"/><path d="M-5 0.5L0-4l5 4.5M-3.6-.6V4.6h7.2V-.6"/></g>
    <g class="om-dash"><circle r="9"/><path d="M-4.5 2.6a1.6 1.6 0 1 0 0 .1M4.5 2.6a1.6 1.6 0 1 0 0 .1M-4.5 2.6h5l2-5h2.2M.5 2.6-.8-2.4h-2"/></g>
  </svg>`;
}

export default {
  times(r) {
    const T = { r };
    T.chipIn = [r + 0.25, r + 0.55, r + 0.85];
    T.cv = r + 0.2;
    T.map = r + 0.3;
    T.rows = [r + 0.4, r + 0.52, r + 0.64];
    T.pins = [r + 0.75, r + 0.6, r + 0.45]; // msb lands last: it is the one picked
    T.scan = [r + 0.62, r + 1.08];
    T.pick = r + 1.15;
    T.card = r + 1.2;
    T.trk = r + 1.3;
    T.placed = T.card + 1.3;
    T.chipDone = [r + 0.6, T.pick, T.placed];
    T.eta = T.placed + 0.4;
    T.end = T.eta + 1.1;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const photo = x.img('burger.jpg');
    const say = sayLine(x, SAY);
    const rows = CHIPS.map(([run]) => x.el(`<div class="dd-chiprow"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">${x.esc(run)}</span></div></div>`));
    const ref = refChip(x, { thumb: `<img src="${x.brand('doordash-logo.svg')}" alt=""/>`, title: 'DoorDash order', sub: 'Cheeseburger · $14.40 · arrives 7:06 PM' });

    const pane = x.el(`<div class="cv-pane od">
      <div class="od-left">
        <section class="od-card od-pick"><h6>Compared 14 burger spots <em>top 3 within 1 mi</em></h6>
          <div class="od-rows"><i class="od-scan"></i>
          ${SPOTS.map((s, i) => `<div class="od-row${i === 0 ? ' best' : ''}">${i === 0 ? `<i class="od-th" style="background-image:url('${photo}')"></i>` : `<i class="od-th od-ini" style="background:${s.c}">${s.ini}</i>`}
            <span class="od-nm"><b>${x.esc(s.name)}</b><small>${s.kind}</small></span><span class="od-st">${IC.star}${s.star}</span><span class="od-e">${s.eta}</span><span class="od-p">${s.total}</span></div>`).join('')}
          </div><div class="od-why">${IC.check}<span><b>Best pick:</b> highest rated, first to arrive, under $15</span></div></section>
        <div class="dd-card od-order">
          <div class="dd-head"><img class="dd-logo" src="${x.brand('doordash-logo.svg')}" alt="DoorDash"/><b>DoorDash order</b><span class="dd-tag">1 item</span></div>
          <div class="dd-photo"><img src="${photo}" alt="Cheeseburger"/><span class="dd-place"><b>Main Street Burger Co.</b><i>${IC.star}4.8</i><em>0.8 mi</em></span></div>
          <div class="dd-item"><span class="dd-thumb" style="background-image:url('${photo}')"></span><span class="dd-meta"><b>Cheeseburger</b><small>Cheddar, pickles, house sauce</small></span><span class="dd-qty">1x</span><span class="dd-price">$7.99</span></div>
          <div class="dd-fees"><div><span>Delivery fee</span><span>$1.99</span></div><div><span>Service fee</span><span>$1.42</span></div><div><span>Dasher tip</span><span>$3.00</span></div><div class="dd-total"><span>Total</span><span>$14.40</span></div></div>
          <div class="dd-addr"><span class="dd-pin">${IC.pin}</span><span class="dd-where"><b>Deliver to 1480 Market St, Apt 5</b><small>Visa ending 4242 · contact-free</small></span></div>
          <div class="dd-btn"><span class="dd-grp dd-grp-a">${BAG}<span class="dd-lab-a">Placing order</span></span><span class="dd-grp dd-grp-b">${CHECK}<span class="dd-lab-b">Ordered!</span></span><i class="dd-shine" aria-hidden="true"></i></div>
        </div>
      </div>
      <div class="od-right">
        <section class="od-card od-map"><div class="od-mh"><b>Live map</b><span class="od-live"><i></i><span class="od-lt">Searching nearby</span></span></div>
          ${mapSvg()}
          <span class="om-tag om-tag-home">Home · 1480 Market St</span><span class="om-tag om-tag-pick">Main Street Burger Co. · 0.8 mi</span></section>
        <section class="od-card od-trk">
          <div class="od-eta"><span class="od-eta-a"><small>Arriving in</small><b>24 min</b></span><span class="od-eta-b"><small>Estimated arrival</small><b>7:06 PM</b></span></div>
          <div class="od-steps"><i class="od-prog"><s></s></i>${STEPS.map(([a, b]) => `<div class="od-sp"><i class="od-sd">${IC.check}</i><b>${a}</b><small>${b}</small></div>`).join('')}</div>
          <div class="od-dash">${IC.scooter}<span><b>Your Dasher is heading to the restaurant</b><small>2 min to pickup · 4.9 rating · 1,200+ deliveries</small></span></div>
        </section>
      </div>
    </div>`);

    const $ = (s) => pane.querySelector(s), $$ = (s) => [...pane.querySelectorAll(s)];
    const pick = $('.od-pick'), oRows = $$('.od-row'), scan = $('.od-scan'), why = $('.od-why');
    const card = $('.od-order'), btn = $('.dd-btn'), grpA = $('.dd-grp-a'), grpB = $('.dd-grp-b'), labA = $('.dd-lab-a'), bag = $('.dd-bag');
    const check = $('.dd-check'), checkP = $('.dd-check-p'), shine = $('.dd-shine');
    const map = $('.od-map'), ring = $('.om-ring'), pins = SPOTS.map((s) => $(`.om-${s.id}`)), home = $('.om-home'), hp = $('.om-hp');
    const route = $('.om-route'), routeBg = $('.om-route-bg'), leg = $('.om-leg'), dash = $('.om-dash'), live = $('.od-live'), lt = $('.od-lt');
    const tagHome = $('.om-tag-home'), tagPick = $('.om-tag-pick');
    const trk = $('.od-trk'), etaA = $('.od-eta-a'), sps = $$('.od-sp'), prog = $('.od-prog s'), dashRow = $('.od-dash');
    const chips = rows.map((r) => r.firstElementChild);
    const legLen = 60 + 80;

    return {
      nodes: [say.n, ...rows, ref],
      marks: [[T.r, say.n], ...rows.map((r, i) => [T.chipIn[i], r]), [T.card, ref]],
      ref,
      cv: { tab: 'doordash-order', pane, at: T.cv },
      render(t) {
        say.render(t, T.r + 0.05, 90);
        chips.forEach((c, i) => {
          rise(rows[i], seg(t, T.chipIn[i], T.chipIn[i] + 0.35), 8);
          const done = t >= T.chipDone[i];
          const sp = c.firstElementChild;
          sp.classList.toggle('done', done);
          sp.style.transform = done ? '' : `rotate(${(((t - T.chipIn[i]) * 450) % 360).toFixed(1)}deg)`;
          setText(c.lastElementChild, done ? CHIPS[i][1] : CHIPS[i][0]);
        });
        rise(ref, seg(t, T.card, T.card + 0.4), 8);

        // the comparison: rows land, a scan passes over them, the pick lights
        rise(pick, seg(t, T.cv, T.cv + 0.3), 8);
        oRows.forEach((n, i) => rise(n, seg(t, T.rows[i], T.rows[i] + 0.3), 6));
        const sc = seg(t, T.scan[0], T.scan[1]);
        scan.style.opacity = (sc > 0 && t < T.pick ? 1 : 0).toFixed(3);
        scan.style.transform = `translateY(${(Math.min(2, sc * 2.6) * 100).toFixed(1)}%)`;
        const picked = t >= T.pick;
        pick.classList.toggle('picked', picked);
        oRows.forEach((n, i) => { n.style.opacity = picked && i ? lerp(1, 0.5, seg(t, T.pick, T.pick + 0.3)).toFixed(3) : n.style.opacity; });
        rise(why, seg(t, T.pick, T.pick + 0.35), 5);

        // the map: search ring around home, candidate pins, the pick, then the route once it is ordered
        rise(map, seg(t, T.map - 0.1, T.map + 0.3), 10);
        const rp = seg(t, T.map, T.pick + 0.2);
        ring.style.opacity = (rp > 0 ? 0.9 * (1 - seg(t, T.pick, T.pick + 0.4)) : 0).toFixed(3);
        ring.setAttribute('r', lerp(40, 150, outCubic(seg(t, T.map, T.map + 0.6))).toFixed(1));
        const hpP = outBack(seg(t, T.map, T.map + 0.35));
        home.style.opacity = seg(t, T.map, T.map + 0.2).toFixed(3);
        home.setAttribute('transform', `translate(${HOME[0]},${HOME[1]}) scale(${lerp(0.4, 1, hpP).toFixed(3)})`);
        hp.setAttribute('r', (16 + 6 * ((t * 1.2) % 1)).toFixed(2));
        hp.style.opacity = (0.5 * (1 - ((t * 1.2) % 1))).toFixed(3);
        pins.forEach((p, i) => {
          const a = T.pins[i], e = outBack(seg(t, a, a + 0.35));
          const big = i === 0 ? 1 + 0.35 * outBack(seg(t, T.pick, T.pick + 0.4)) : 1;
          p.style.opacity = (seg(t, a, a + 0.15) * (picked && i ? lerp(1, 0.35, seg(t, T.pick, T.pick + 0.3)) : 1)).toFixed(3);
          p.setAttribute('transform', `translate(${SPOTS[i].at[0]},${SPOTS[i].at[1]}) scale(${(lerp(0.3, 1, e) * big).toFixed(3)})`);
          p.classList.toggle('on', i === 0 && picked);
        });
        rise(tagHome, seg(t, T.map + 0.2, T.map + 0.5), 5);
        rise(tagPick, seg(t, T.pick + 0.1, T.pick + 0.4), 5);
        const P = T.placed;
        routeBg.style.opacity = (0.8 * seg(t, T.pick + 0.2, T.pick + 0.5)).toFixed(3);
        drawStroke(route, seg(t, P + 0.05, P + 0.65));
        drawStroke(leg, seg(t, P + 0.2, P + 0.6));
        leg.style.opacity = seg(t, P + 0.2, P + 0.3).toFixed(3);
        // the Dasher rides the pickup leg (60,230 -> 60,170 -> 140,170)
        const d = legLen * 0.45 * outCubic(seg(t, P + 0.45, T.end + 0.3));
        const dx = d < 60 ? 60 : 60 + (d - 60), dy = d < 60 ? 230 - d : 170;
        dash.setAttribute('transform', `translate(${dx.toFixed(2)},${dy.toFixed(2)}) scale(${lerp(0.3, 1, outBack(seg(t, P + 0.4, P + 0.7))).toFixed(3)})`);
        dash.style.opacity = seg(t, P + 0.4, P + 0.55).toFixed(3);
        setText(lt, t >= P ? 'Dasher on the way' : picked ? 'Main Street Burger Co. picked' : 'Searching within 1 mi');
        live.classList.toggle('on', t >= P);

        // the order card and its pill: placing -> "Ordered!" with a dip, a shine and a drawn check
        const ci = seg(t, T.card, T.card + 0.55);
        rise(card, ci, 18);
        card.style.transform = ci >= 1 ? '' : `translateY(${((1 - outCubic(ci)) * 18).toFixed(2)}px) scale(${lerp(0.97, 1, outCubic(ci)).toFixed(4)})`;
        setText(labA, 'Placing order' + '.'.repeat(1 + (Math.floor(Math.max(0, t - T.card) * 4) % 3)));
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

        // the tracker: grey until it is ordered, then step one ticks, preparing pulses and the ETA lights
        rise(trk, seg(t, T.trk, T.trk + 0.4), 10);
        trk.classList.toggle('live', t >= P);
        sps.forEach((s, i) => {
          s.classList.toggle('ok', i === 0 && t >= P + 0.1);
          s.classList.toggle('now', i === 1 && t >= P + 0.25);
        });
        s1pulse(sps[1], t, P);
        prog.style.transform = `scaleX(${lerp(0, 0.38, outCubic(seg(t, P + 0.1, P + 0.9))).toFixed(4)})`;
        const ep = seg(t, T.eta - 0.2, T.eta + 0.15);
        etaA.style.setProperty('--lit', outCubic(ep).toFixed(3));
        etaA.style.transform = `scale(${(1 + 0.06 * Math.sin(Math.PI * ep)).toFixed(4)})`;
        rise(dashRow, seg(t, P + 0.5, P + 0.9), 6);
      },
    };
  },
};

function s1pulse(n, t, P) {
  const dot = n.querySelector('.od-sd');
  const ph = t >= P + 0.25 ? (t - P) * 1.4 % 1 : 0;
  dot.style.boxShadow = t >= P + 0.25 ? `0 0 0 ${(ph * 7).toFixed(2)}px rgba(255,48,8,${(0.45 * (1 - ph)).toFixed(3)})` : '';
}
