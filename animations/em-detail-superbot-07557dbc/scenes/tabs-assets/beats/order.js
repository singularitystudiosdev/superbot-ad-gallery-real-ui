// Superbot Agent beat: "Winning, order me a burger." answered with a real order. Left, the agent works DoorDash
// (opens it, compares three spots, picks the fastest, checks out) over the itemised receipt, then the pill flips to
// "Ordered!". Right, live tracking: the route draws from the restaurant to home, the Dasher heads in, the stepper
// moves to Preparing and the Dasher's card lands. Card photo: img/burger.jpg = "Cheeseburger.jpg" by Renee Comet,
// National Cancer Institute, public domain (img/CREDITS.txt). Pure function of t (the tabs scene's local time).
import { lerp, seg, outCubic, outBack, streamCount } from '../../../lib.js';

const SAY = 'Well earned. Celebration burger from the fastest 4.8★ spot near you.';
const STEPS = [
  ['Opened DoorDash on your account', '0.4s'],
  ['Compared 3 burger spots nearby', '0.6s'],
  ['Picked <b>Main Street Burger Co.</b>, fastest', '0.3s'],
  ['Checked out with Visa 4242', '0.5s'],
];
const OPTS = [['Main Street Burger Co.', '4.8', '24 min', '0.8 mi'], ['Patty Shack', '4.6', '31 min', '1.4 mi'], ['Grill & Bun', '4.5', '38 min', '2.1 mi']];
const BAG = '<svg class="dd-bag" viewBox="0 0 24 24"><path d="M5 8h14l-1.2 12H6.2Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>';
const CHECK = '<svg class="dd-check" viewBox="0 0 24 24"><path class="dd-check-p" d="M4.5 12.5l5 5L19.5 7"/></svg>';
const TICK = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const STAR = '<svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z"/></svg>';
const MSG = '<svg viewBox="0 0 24 24"><path d="M4 5h16v11H9l-5 4z"/></svg>';
// lucide utensils / house / car, drawn inside the map's pins
const I_SHOP = '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>';
const I_HOME = '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>';
const I_CAR = '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>';

// the map, in its own 610x236 space: the Dasher drives D -> R (dashed), the order rides R -> H (red)
const LEG1 = [[566, 206], [520, 206], [520, 128], [380, 128]];
const LEG2 = [[380, 128], [250, 128], [250, 58], [122, 58]];
const pathD = (pts) => 'M' + pts.map((p) => p.join(' ')).join(' L');
const along = (pts, f) => {
  const segs = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
  let d = f * segs.reduce((a, b) => a + b, 0);
  for (let i = 0; i < segs.length; i++) {
    if (d <= segs[i] || i === segs.length - 1) { const u = Math.min(1, d / segs[i]); return [lerp(pts[i][0], pts[i + 1][0], u), lerp(pts[i][1], pts[i + 1][1], u)]; }
    d -= segs[i];
  }
  return pts[pts.length - 1];
};
const pin = (cls, [cx, cy], r, icon, s) => `<g class="pin-${cls}" transform="translate(${cx} ${cy})"><circle r="${r + 3}" fill="#17191c"/><circle r="${r}" class="pc"/><svg x="${-s / 2}" y="${-s / 2}" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${icon}</svg></g>`;
const tag = ([cx, cy], label, w) => `<g transform="translate(${cx - w / 2} ${cy - 38})"><rect width="${w}" height="17" rx="8" fill="rgba(12,12,14,.88)" stroke="#2a2a2e"/><text x="${w / 2}" y="12" text-anchor="middle" class="tg">${label}</text></g>`;
const MAP = `<svg viewBox="0 0 610 262" preserveAspectRatio="xMidYMid slice">
  <rect width="610" height="262" fill="#17191c"/>
  <path class="water" d="M478 0 L610 0 L610 104 Q566 92 532 66 Q500 40 478 0Z"/>
  <rect class="park" x="34" y="150" width="150" height="68" rx="8"/>
  <path class="rd2" d="M0 93 H610 M0 165 H610 M0 240 H610 M185 0 V262 M315 0 V262 M450 0 V262"/>
  <path class="rd1" d="M0 58 H610 M0 128 H610 M0 206 H610 M120 0 V262 M250 0 V262 M380 0 V262 M520 0 V262"/>
  <path class="rd1" d="M8 262 L330 0" style="stroke-width:11"/>
  <text class="lbl" x="420" y="122">Market St</text><text class="lbl" x="526" y="160" transform="rotate(90 526 160)">5th St</text>
  <text class="lbl" x="58" y="190">Dolores Park</text><text class="lbl" x="262" y="232">Valencia St</text>
  <path class="leg1" pathLength="100" d="${pathD(LEG1)}"/>
  <path class="leg2" pathLength="100" d="${pathD(LEG2)}"/>
  ${pin('shop', LEG2[0], 13, I_SHOP, 14)}${pin('home', LEG2[3], 13, I_HOME, 14)}
  ${tag(LEG2[0], 'Main Street Burger Co.', 126)}${tag(LEG2[3], 'Home', 44)}
  <circle class="ring" r="11" fill="none" stroke="#fff" stroke-width="2"/>
  ${pin('dasher', LEG1[0], 11, I_CAR, 13)}
</svg>`;
const TRACK = [['Confirmed', '7:18 PM'], ['Preparing', 'now'], ['Picked up', '7:31 PM'], ['Delivered', '7:42 PM']];

const rise = (node, p, dy = 8) => {
  node.style.opacity = p.toFixed(3);
  node.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * dy).toFixed(2)}px)`;
};

export default {
  times(r, endAt) {
    const T = { r };
    T.card = r + 0.3;
    T.step = [0.42, 0.72, 1.02, 1.32].map((o) => r + o);
    T.placed = r + 1.62;
    T.end = endAt ?? T.placed + 2.0;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const steps = STEPS.map(([s, d]) => `<div class="em-st"><span class="spin"></span><span>${s}</span><em>${d}</em></div>`).join('');
    const opts = OPTS.map(([n, s, m, d], i) => `<div class="od-op${i === 0 ? ' pick' : ''}"><b>${x.esc(n)}</b><small><i>${s}★</i><span>${m}</span><span>${d}</span></small>${i === 0 ? `<span class="od-ck">${TICK}</span>` : ''}</div>`).join('');
    const track = TRACK.map(([b, s]) => `<div class="od-tk"><span class="od-dot">${TICK}</span><b>${b}</b><small>${s}</small></div>`).join('');
    const card = x.el(`<div class="em-card od">
      <div class="od-l">
        <div class="em-hd">${x.tile('doordash')}DoorDash order<span class="em-tag">Delivery</span><span class="em-stat em-push">ordered by <b>Superbot Agent</b></span></div>
        <div class="od-steps">${steps}</div>
        <div class="od-pick">${opts}</div>
        <div class="od-item"><span class="od-thumb" style="background-image:url('${x.img('burger.jpg')}')"></span>
          <span><b>Double Smash Cheeseburger</b><small>Main Street Burger Co., 1 item</small><span class="od-mods"><span>+ Cheddar</span><span>No onion</span><span>+ Fries, medium</span></span></span>
          <span class="od-price">$13.28</span></div>
        <div class="od-fees"><div><span>Subtotal</span><span>$13.28</span></div><div><span>Delivery fee</span><span><s>$1.99</s><span class="dp">$0.00 DashPass</span></span></div>
          <div><span>Service fee and tax</span><span>$2.58</span></div><div><span>Dasher tip</span><span>$3.00</span></div>
          <div class="od-total"><span>Total, Visa 4242</span><span>$18.86</span></div></div>
        <div class="dd-btn">
          <span class="dd-grp dd-grp-a">${BAG}<span class="dd-lab-a">Placing order</span></span>
          <span class="dd-grp dd-grp-b">${CHECK}<span class="dd-lab-b">Ordered!</span></span>
          <i class="dd-shine" aria-hidden="true"></i>
        </div>
      </div>
      <div class="od-r">
        <div class="od-map">${MAP}<div class="od-eta"><small>Arriving</small><b>7:42 PM<i>24 min</i></b></div></div>
        <div class="od-track"><span class="od-line"><i></i></span>${track}</div>
        <div class="od-dash"><span class="od-av">MR</span><span><b>Marcus is heading to Main Street Burger Co.</b><small><span>Gray Honda Civic</span><span>7KDJ291</span><span>1480 Market St, Apt 5</span></small></span>
          <span class="od-rate">${STAR}4.9</span><span class="em-btn">${MSG}Message</span></div>
        <div class="od-notes"><span>Leave at the door</span><span>Ring once</span><span>Live updates in this chat</span></div>
      </div></div>`);
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const $ = (s) => card.querySelector(s), $$ = (s) => [...card.querySelectorAll(s)];
    const stEls = $$('.od-steps .em-st'), opEls = $$('.od-op'), ck = $('.od-ck');
    const btn = $('.dd-btn'), grpA = $('.dd-grp-a'), grpB = $('.dd-grp-b'), labA = $('.dd-lab-a'), bag = $('.dd-bag');
    const check = $('.dd-check'), checkP = $('.dd-check-p'), shine = $('.dd-shine');
    const leg1 = $('.leg1'), leg2 = $('.leg2'), dasher = $('.pin-dasher'), ring = $('.ring');
    const eta = $('.od-eta'), line = $('.od-line i'), tks = $$('.od-tk'), dash = $('.od-dash'), notes = $('.od-notes');
    $('.pin-shop .pc').setAttribute('fill', '#ff3008'); $('.pin-shop svg').setAttribute('stroke', '#fff');
    $('.pin-home .pc').setAttribute('fill', '#ececec'); $('.pin-home svg').setAttribute('stroke', '#0b0b0c');
    $('.pin-dasher .pc').setAttribute('fill', '#ffffff'); $('.pin-dasher svg').setAttribute('stroke', '#0b0b0c');
    let shown = -1;
    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.06, 70, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        const ci = outCubic(seg(t, T.card, T.card + 0.4));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 16).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;
        // the agent's steps tick over; the three spots fan in on "compared", the winner locks on "picked"
        stEls.forEach((el, i) => {
          const a = T.step[i], b = T.step[i + 1] ?? T.placed;
          const sp = el.firstElementChild, on = t >= a, done = t >= b;
          sp.classList.toggle('done', done);
          sp.style.transform = done || !on ? 'none' : `rotate(${((t - a) * 720) % 360}deg)`;
          sp.style.opacity = on ? '1' : '.35';
          el.classList.toggle('on', on);
          el.style.opacity = (0.45 + 0.55 * seg(t, a - 0.1, a)).toFixed(3);
          el.lastElementChild.style.opacity = seg(t, b, b + 0.15).toFixed(3);
        });
        opEls.forEach((el, i) => {
          rise(el, outCubic(seg(t, T.step[1] + i * 0.06, T.step[1] + 0.3 + i * 0.06)), 6);
          const lose = seg(t, T.step[2], T.step[2] + 0.25);
          if (i > 0) el.style.opacity = (Number(el.style.opacity) * (1 - 0.5 * lose)).toFixed(3);
        });
        opEls[0].classList.toggle('on', t >= T.step[2]);
        ck.style.opacity = seg(t, T.step[2], T.step[2] + 0.15).toFixed(3);
        ck.style.transform = `scale(${lerp(0.4, 1, outBack(seg(t, T.step[2], T.step[2] + 0.3))).toFixed(3)})`;
        // the order pill: placing -> "Ordered!" with a dip, a shine and a drawn check
        const P = T.placed;
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
        // live tracking: the route draws, the ETA lands, the Dasher appears and drives toward the restaurant
        leg2.style.strokeDasharray = '100';
        leg2.style.strokeDashoffset = (100 * (1 - outCubic(seg(t, P + 0.15, P + 0.75)))).toFixed(2);
        leg1.style.opacity = seg(t, P + 0.45, P + 0.75).toFixed(3);
        rise(eta, outCubic(seg(t, P + 0.5, P + 0.8)), 6);
        const dIn = seg(t, P + 0.6, P + 0.85), f = 0.62 * outCubic(seg(t, P + 0.7, T.end));
        const [dx, dy] = along(LEG1, f);
        dasher.setAttribute('transform', `translate(${dx.toFixed(2)} ${dy.toFixed(2)}) scale(${lerp(0.4, 1, outBack(dIn)).toFixed(3)})`);
        dasher.style.opacity = dIn.toFixed(3);
        const rp = (Math.max(0, t - P) * 1.4) % 1;
        ring.setAttribute('cx', dx.toFixed(2)); ring.setAttribute('cy', dy.toFixed(2));
        ring.setAttribute('r', (11 + 12 * rp).toFixed(2));
        ring.style.opacity = (dIn * 0.6 * (1 - rp)).toFixed(3);
        // stepper: Confirmed ticks, the bar runs to Preparing, which pulses as "now"
        const conf = t >= P + 0.25;
        tks[0].classList.toggle('ok', conf);
        tks[1].classList.toggle('now', conf);
        tks[1].style.setProperty('--pulse', (0.12 + 0.18 * Math.abs(Math.sin((t - P) * 3))).toFixed(3));
        line.style.width = (33.4 * outCubic(seg(t, P + 0.25, P + 0.75))).toFixed(2) + '%';
        rise(dash, outCubic(seg(t, P + 0.85, P + 1.15)), 8);
        rise(notes, outCubic(seg(t, P + 1.0, P + 1.3)), 6);
      },
    };
  },
};
