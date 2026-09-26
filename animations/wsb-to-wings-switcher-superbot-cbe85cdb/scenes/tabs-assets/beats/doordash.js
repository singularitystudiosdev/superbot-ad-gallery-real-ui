// DoorDash, the tendies: the reference ad's DoorDash order card, re-plated with 20 boneless wings and extra ranch.
// Three tool chips land (open, pick, check out), the order card rises, and the gradient order pill resolves
// "Placing order..." into "Order placed" with a shine and a drawn check, then the ETA line reads
// "Order placed, arriving in 28 min". Card photo: img/wings.jpg = "Boneless chicken wings" by stu_spivack,
// Wikimedia Commons, CC BY-SA 2.0. "Northside Wing House" and the prices are made up.
import { lerp, seg, outCubic, outBack } from '../../../lib.js';
import { say, chips, rise, ICON } from './kit.js?v=1';

const SAY = 'Tendies are on you. 20 boneless wings, extra ranch, on the way.';
const BAG = '<svg class="dd-bag" viewBox="0 0 24 24"><path d="M5 8h14l-1.2 12H6.2Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>';
const CHECK = '<svg class="dd-check" viewBox="0 0 24 24"><path class="dd-check-p" d="M4.5 12.5l5 5L19.5 7"/></svg>';

export default {
  times(r) {
    const T = { r };
    T.chipIn = [r + 0.25, r + 0.55, r + 0.85];
    T.card = r + 1.2;
    T.placed = T.card + 1.4;
    T.chipDone = [r + 0.6, r + 1.15, T.placed];
    T.eta = T.placed + 0.4;
    T.end = T.eta + 1.9;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const line = say(x, SAY, T.r + 0.05, 85);
    const ch = chips(x, [
      ['Opening DoorDash', 'Opened DoorDash'],
      ['Finding the best-rated wings near you', 'Picked Northside Wing House'],
      ['Checking out with your saved card', 'Checked out with your saved card'],
    ], T.chipIn, T.chipDone);
    const photo = x.img('wings.jpg');
    const card = x.el(`<div class="dd-card dd-wings">
      <div class="dd-head"><img class="dd-logo" src="${x.brand('doordash-logo.svg')}" alt="DoorDash"/><b>DoorDash order</b><span class="dd-tag">1 item</span></div>
      <div class="dd-photo"><img src="${photo}" alt="Boneless wings with ranch"/><span class="dd-place"><b>Northside Wing House</b><i>${ICON.star}4.8</i><em>1.1 mi</em></span></div>
      <div class="dd-item"><span class="dd-thumb" style="background-image:url('${photo}')"></span><span class="dd-meta"><b>20 pc Boneless Wings</b><small>Buffalo, extra ranch</small></span><span class="dd-qty">1x</span><span class="dd-price">$29.49</span></div>
      <div class="dd-fees">
        <div><span>Delivery fee</span><span>$1.99</span></div>
        <div><span>Service fee</span><span>$2.95</span></div>
        <div><span>Dasher tip</span><span>$5.00</span></div>
        <div class="dd-total"><span>Total</span><span>$39.43</span></div>
      </div>
      <div class="dd-addr"><span class="dd-pin">${ICON.pin}</span><span class="dd-where"><b>Deliver to 1480 Market St, Apt 5</b><small>Visa ending 4242</small></span><span class="dd-eta"><span class="dd-eta-a">${ICON.clock}28 min</span></span></div>
      <div class="dd-btn">
        <span class="dd-grp dd-grp-a">${BAG}<span class="dd-lab-a">Placing order</span></span>
        <span class="dd-grp dd-grp-b">${CHECK}<span class="dd-lab-b">Order placed</span></span>
        <i class="dd-shine" aria-hidden="true"></i>
      </div>
      <div class="dd-etaline">${ICON.clock}<span>Order placed, arriving in <b>28 min</b></span></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const btn = $('.dd-btn'), grpA = $('.dd-grp-a'), grpB = $('.dd-grp-b'), labA = $('.dd-lab-a'), bag = $('.dd-bag');
    const check = $('.dd-check'), checkP = $('.dd-check-p'), shine = $('.dd-shine'), etaPill = $('.dd-eta'), etaLine = $('.dd-etaline');

    return {
      nodes: [line.n, ...ch.rows, card],
      marks: [[T.r, line.n], ...ch.marks, [T.card, card]],
      render(t) {
        line.render(t);
        ch.render(t);
        const ci = seg(t, T.card, T.card + 0.55);
        rise(card, ci, 20);
        card.style.transform = ci >= 1 ? '' : `translateY(${((1 - outCubic(ci)) * 20).toFixed(2)}px) scale(${lerp(0.97, 1, outCubic(ci)).toFixed(4)})`;

        // the order pill: placing -> "Order placed" with a dip, a shine and a drawn check
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
        card.classList.toggle('is-placed', t >= P);
        const ep = seg(t, T.eta - 0.2, T.eta + 0.15);
        etaPill.style.setProperty('--lit', outCubic(ep).toFixed(3));
        etaPill.style.transform = `scale(${(1 + 0.08 * Math.sin(Math.PI * ep)).toFixed(4)})`;
        rise(etaLine, seg(t, T.eta, T.eta + 0.45), 6);
      },
    };
  },
};
