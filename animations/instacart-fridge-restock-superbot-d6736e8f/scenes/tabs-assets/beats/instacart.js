// Superbot beat: drives Instacart's checkout for real (forked from the Venmo/DoorDash beat). Three tool chips land
// (open, add, check out), the checkout card rises, the store picker sets to Sprouts, the seven cart rows slide in
// one by one with the counters stepping up, the totals land, the gradient pill resolves "Placing order..." into
// "Order placed", and the checkout panel flips over to the order status with the shopper. The card is drawn in
// code: Instacart green header with the wordmark as text, no logo artwork.
import { lerp, seg, outCubic, outBack, inOutCubic, streamCount } from '../../../lib.js';
import { ITEMS, TOTALS, TOTAL, STORE, WINDOW, ADDRESS, CARD } from './restock.js';

const SAY = `On it. Ordering all 7 from ${STORE.name.split(' ')[0]} on Instacart.`;
const CHIPS = [
  ['Opening Instacart', 'Opened Instacart'],
  ['Adding 7 items', 'Added 7 items'],
  ['Checking out', 'Checked out with your saved card'],
];
const ICON = {
  store: '<svg viewBox="0 0 24 24"><path d="M3 9.5 4.6 4h14.8L21 9.5"/><path d="M3 9.5a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/><path d="M5 12v8h14v-8"/><path d="M10 20v-5h4v5"/></svg>',
  chev: '<svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>',
  clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  pin: '<svg viewBox="0 0 24 24"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
  card: '<svg viewBox="0 0 24 24"><rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 10h19"/></svg>',
  bag: '<svg class="dd-bag" viewBox="0 0 24 24"><path d="M6 8h12l-1 12H7Z"/><path d="M9 8a3 3 0 0 1 6 0"/></svg>',
};
const CHECK = '<svg class="dd-check" viewBox="0 0 24 24"><path class="dd-check-p" d="M4.5 12.5l5 5L19.5 7"/></svg>';
const STEPS = ['Placed', 'Shopping', 'On the way', 'Delivered'];

export default {
  times(r) {
    const T = { r };
    T.chipIn = [r + 0.08, r + 0.16, r + 0.24];
    T.card = r + 0.3;
    T.store = r + 0.5;
    T.rows = ITEMS.map((_, i) => r + 0.68 + i * 0.11);
    T.tot = r + 1.46;
    T.press = r + 1.74;
    T.placed = r + 2.06;
    T.flip = [T.placed + 0.24, T.placed + 0.62];
    T.shopper = T.flip[1] + 0.04;
    T.chipDone = [T.store, T.rows[ITEMS.length - 1] + 0.1, T.placed];
    T.end = r + 3.3;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const chipRows = CHIPS.map(([run]) => x.el(`<div class="dd-chiprow"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">${x.esc(run)}</span></div></div>`));
    const card = x.el(`<div class="ic-card">
      <div class="ic-head"><span class="ic-wm">instacart</span><b>Checkout</b><span class="ic-tag"><span class="ic-n">0</span> items</span></div>
      <div class="ic-body">
        <div class="ic-cart">
          <div class="ic-store"><span class="ic-store-ic">${ICON.store}</span><span class="ic-store-t"><span class="ic-st-a"><b>Choose a store</b><small>Delivery</small></span><span class="ic-st-b"><b>${x.esc(STORE.name)}</b><small>${x.esc(STORE.dist)} · Delivery</small></span></span><span class="ic-chev">${ICON.chev}</span></div>
          <div class="ic-cart-hd"><b>Cart</b><small><span class="ic-n">0</span> items</small></div>
          ${ITEMS.map((it) => `<div class="ic-row"><img class="ic-th" src="${x.img('products/' + it.key + '.jpg')}" alt=""/><span class="ic-nm"><b>${x.esc(it.name)}</b><small>${x.esc(it.size)}</small></span><span class="ic-qty">1</span><span class="ic-pr">${x.esc(it.price)}</span></div>`).join('')}
        </div>
        <div class="ic-flip"><div class="ic-flip-in">
          <div class="ic-face ic-front">
            <div class="ic-sec">
              <div class="ic-li">${ICON.clock}<span><small>Delivery</small><b>${x.esc(WINDOW)}</b></span></div>
              <div class="ic-li">${ICON.pin}<span><small>Address</small><b>${x.esc(ADDRESS)}</b></span></div>
              <div class="ic-li">${ICON.card}<span><small>Payment</small><b>${x.esc(CARD)}</b></span></div>
            </div>
            <div class="ic-tot">
              ${TOTALS.map(([l, v]) => `<div class="ic-tl"><span>${x.esc(l)}</span><span>${x.esc(v)}</span></div>`).join('')}
              <div class="ic-tl ic-total"><span>Total</span><span>${x.esc(TOTAL)}</span></div>
            </div>
            <div class="dd-btn ic-btn">
              <span class="dd-grp dd-grp-a">${ICON.bag}<span class="dd-lab-a">Place order</span></span>
              <span class="dd-grp dd-grp-b">${CHECK}<span class="dd-lab-b">Order placed</span></span>
              <i class="dd-shine" aria-hidden="true"></i>
            </div>
          </div>
          <div class="ic-face ic-back">
            <span class="ic-ok"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span>
            <b class="ic-done-t">Order placed.</b>
            <span class="ic-done-s">Arriving ${x.esc(WINDOW.replace('Today, ', 'today '))}.</span>
            <div class="ic-track">${STEPS.map((s, i) => `<span class="ic-step${i === 0 ? ' is-done' : i === 1 ? ' is-now' : ''}"><i></i><small>${s}</small></span>`).join('')}</div>
            <div class="ic-shopper"><img src="${x.img('rosa.jpg')}" alt=""/><span><b>Rosa is shopping</b><small>7 items at ${x.esc(STORE.name.split(' ')[0])}</small></span><i class="ic-live"></i></div>
          </div>
        </div></div>
      </div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const $$ = (s) => [...card.querySelectorAll(s)];
    const btn = $('.ic-btn'), grpA = $('.dd-grp-a'), grpB = $('.dd-grp-b'), labA = $('.dd-lab-a'), bag = $('.dd-bag');
    const check = $('.dd-check'), checkP = $('.dd-check-p'), shine = $('.dd-shine');
    const store = $('.ic-store'), stA = $('.ic-st-a'), stB = $('.ic-st-b');
    const rows = $$('.ic-row'), counts = $$('.ic-n'), tls = $$('.ic-tl'), flipIn = $('.ic-flip-in');
    const back = $('.ic-back'), okIc = $('.ic-ok'), shopper = $('.ic-shopper'), steps = $$('.ic-step');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const chips = chipRows.map((r) => r.firstElementChild);
    let shown = -1, lastN = -1;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };

    return {
      nodes: [say, ...chipRows, card],
      marks: [[T.r, say], ...chipRows.map((r, i) => [T.chipIn[i], r]), [T.card, card]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.03, 110, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        chips.forEach((c, i) => {
          rise(chipRows[i], seg(t, T.chipIn[i], T.chipIn[i] + 0.3), 8);
          const done = t >= T.chipDone[i];
          const sp = c.firstElementChild;
          sp.classList.toggle('done', done);
          sp.style.transform = done ? '' : `rotate(${(((t - T.chipIn[i]) * 450) % 360).toFixed(1)}deg)`;
          const lab = done ? CHIPS[i][1] : CHIPS[i][0];
          if (c.lastElementChild.textContent !== lab) c.lastElementChild.textContent = lab;
        });
        const ci = seg(t, T.card, T.card + 0.4);
        card.style.opacity = outCubic(ci).toFixed(3);
        card.style.transform = ci >= 1 ? '' : `translateY(${((1 - outCubic(ci)) * 20).toFixed(2)}px) scale(${lerp(0.97, 1, outCubic(ci)).toFixed(4)})`;

        // the store picker: a ring flashes on it and "Choose a store" rolls over to Sprouts
        const sp = seg(t, T.store - 0.1, T.store + 0.35);
        store.style.setProperty('--ring', Math.sin(Math.PI * sp).toFixed(3));
        const sw = outCubic(seg(t, T.store, T.store + 0.22));
        stA.style.opacity = (1 - sw).toFixed(3);
        stA.style.transform = `translateY(${(-sw * 10).toFixed(2)}px)`;
        stB.style.opacity = sw.toFixed(3);
        stB.style.transform = `translateY(${((1 - sw) * 10).toFixed(2)}px)`;

        // cart rows slide in one by one; both counters step up with them
        let added = 0;
        rows.forEach((r, i) => {
          const p = seg(t, T.rows[i], T.rows[i] + 0.26);
          if (t >= T.rows[i] + 0.06) added = i + 1;
          r.style.opacity = outCubic(Math.min(1, p * 1.6)).toFixed(3);
          r.style.transform = p >= 1 ? '' : `translateX(${((1 - outCubic(p)) * 22).toFixed(2)}px) scale(${lerp(0.96, 1, outBack(p)).toFixed(4)})`;
          r.style.setProperty('--hl', (1 - seg(t, T.rows[i] + 0.1, T.rows[i] + 0.6)) * (p > 0 ? 1 : 0));
        });
        if (added !== lastN) { counts.forEach((c) => { c.textContent = String(added); }); lastN = added; }

        // the totals land row by row
        tls.forEach((l, i) => rise(l, seg(t, T.tot + i * 0.05, T.tot + i * 0.05 + 0.25), 5));

        // the pill: pressed, "Placing order...", then "Order placed" with a dip, a shine and a drawn check
        const P = T.press, D = T.placed;
        const lab = t < P ? 'Place order' : 'Placing order' + '.'.repeat(1 + (Math.floor(Math.max(0, t - P) * 8) % 3));
        if (labA.textContent !== lab) labA.textContent = lab;
        const down = seg(t, P - 0.06, P) * (1 - seg(t, P + 0.06, P + 0.18));
        const down2 = seg(t, D - 0.05, D + 0.03) * (1 - seg(t, D + 0.08, D + 0.2));
        btn.style.transform = `scale(${(1 - 0.06 * down - 0.04 * down2 + 0.03 * Math.sin(Math.PI * seg(t, D + 0.08, D + 0.4))).toFixed(4)})`;
        bag.style.transform = t < P ? '' : `translateY(${(-2 * Math.abs(Math.sin((t - P) * 14))).toFixed(2)}px)`;
        const sh = seg(t, D, D + 0.5);
        shine.style.opacity = (sh > 0 && sh < 1 ? Math.sin(Math.PI * Math.min(1, sh * 1.25)) : 0).toFixed(3);
        shine.style.transform = `translateX(${lerp(-160, 300, 0.5 - Math.cos(Math.PI * sh) / 2).toFixed(1)}%) skewX(-20deg)`;
        const ro = seg(t, D, D + 0.2);
        grpA.style.opacity = (1 - outCubic(ro)).toFixed(3);
        grpA.style.transform = `translate(-50%, calc(-50% - ${(outCubic(ro) * 10).toFixed(2)}px))`;
        const gi = seg(t, D + 0.05, D + 0.3);
        grpB.style.opacity = outCubic(gi).toFixed(3);
        grpB.style.transform = `translate(-50%, calc(-50% + ${((1 - outCubic(gi)) * 10).toFixed(2)}px)) scale(${lerp(0.9, 1, outBack(gi)).toFixed(4)})`;
        checkP.style.strokeDashoffset = (23 * (1 - outCubic(seg(t, D + 0.08, D + 0.32)))).toFixed(2);
        check.style.transform = `scale(${lerp(0.55, 1, outBack(seg(t, D + 0.08, D + 0.3))).toFixed(3)})`;
        card.classList.toggle('is-placed', t >= D);

        // the checkout panel flips over to the order status
        const f = inOutCubic(seg(t, T.flip[0], T.flip[1]));
        flipIn.style.transform = f <= 0 ? '' : `rotateY(${(f * 180).toFixed(2)}deg)`;
        const bo = seg(t, T.flip[1] - 0.12, T.flip[1] + 0.3);
        okIc.style.transform = `scale(${lerp(0.4, 1, outBack(bo)).toFixed(4)})`;
        back.style.setProperty('--in', outCubic(bo).toFixed(3));
        steps.forEach((s, i) => s.style.setProperty('--on', outCubic(seg(t, T.flip[1] + i * 0.06, T.flip[1] + i * 0.06 + 0.2)).toFixed(3)));
        rise(shopper, seg(t, T.shopper, T.shopper + 0.3), 8);
        shopper.style.setProperty('--pulse', (0.5 + 0.5 * Math.sin((t - T.shopper) * 7)).toFixed(3));
      },
    };
  },
};
