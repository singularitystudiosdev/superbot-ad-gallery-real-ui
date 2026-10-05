// doordash.com (web, light) as the live tab superbot drives: store page -> checkout -> order tracker.
// Laid out at 720x450 and scaled into the live embed frame.
import { icon, doordashMark } from './icons.2fe9583d.js';
import { h } from './shell.2fe9583d.js';
import { EASE, prog, lerp } from './ease.2fe9583d.js';

const RED = '#eb1700';
const CSS = `
.dd { position:absolute; inset:0; background:#fff; color:#191919; font-family:-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; overflow:hidden; }
.dd-nav { position:relative; z-index:3; height:56px; display:flex; align-items:center; gap:14px; padding:0 18px; background:#fff; border-bottom:1px solid #e7e7e7; }
.dd-logo { display:flex; align-items:center; gap:6px; color:#ff3008; font-weight:900; font-size:17px; letter-spacing:.6px; }
.dd-logo svg { width:30px; height:30px; }
.dd-addr { display:flex; align-items:center; gap:5px; font-size:13px; font-weight:600; margin-left:10px; }
.dd-addr .ic { width:15px; height:15px; }
.dd-search { flex:1; height:38px; border-radius:19px; background:#f1f1f1; display:flex; align-items:center; gap:8px; padding:0 14px; font-size:13.5px; color:#767676; }
.dd-search .ic { width:16px; height:16px; color:#191919; }
.dd-cart { position:relative; height:38px; border-radius:19px; padding:0 14px; display:flex; align-items:center; gap:7px; font-weight:700; font-size:14px; }
.dd-cart .ic { width:17px; height:17px; }
.dd-cart .bg { position:absolute; inset:0; border-radius:19px; background:${RED}; }
.dd-cart .bg0 { position:absolute; inset:0; border-radius:19px; background:#f1f1f1; }
.dd-cart > span:not(.bg):not(.bg0) { position:relative; display:flex; align-items:center; gap:7px; }
.dd-scr { position:absolute; left:0; right:0; top:56px; bottom:0; }
.dd-hero { margin:14px 18px 0; height:118px; border-radius:12px; overflow:hidden; position:relative; }
.dd-hero img { width:100%; height:100%; object-fit:cover; display:block; }
.dd-slogo { position:absolute; left:34px; top:108px; width:58px; height:58px; border-radius:50%; border:3px solid #fff; background:#191919; color:#fff; display:grid; place-items:center; font-weight:900; font-size:15px; letter-spacing:-.4px; box-shadow:0 2px 8px rgba(0,0,0,.15); }
.dd-sname { margin:30px 18px 0; display:flex; align-items:flex-end; justify-content:space-between; }
.dd-sname h3 { font-size:24px; font-weight:800; letter-spacing:-.4px; }
.dd-sname .meta { font-size:12.5px; color:#606060; margin-top:4px; }
.dd-fee { border:1px solid #e7e7e7; border-radius:10px; display:flex; font-size:12px; }
.dd-fee div { padding:7px 14px; text-align:center; }
.dd-fee div + div { border-left:1px solid #e7e7e7; }
.dd-fee b { display:block; font-size:13.5px; }
.dd-sec { margin:16px 18px 8px; font-size:17px; font-weight:800; }
.dd-items { margin:0 18px; display:grid; grid-template-columns:1fr 1fr; gap:12px; }
.dd-item { position:relative; height:112px; border:1px solid #e7e7e7; border-radius:12px; display:flex; overflow:hidden; }
.dd-item .tx { flex:1; padding:11px 12px; }
.dd-item .nm { font-size:14px; font-weight:700; }
.dd-item .dd-tag { font-size:11.5px; font-weight:700; color:#1d8549; margin-top:3px; }
.dd-item .ds { font-size:11.5px; color:#767676; margin-top:3px; line-height:15px; }
.dd-item .pr { font-size:13px; margin-top:6px; }
.dd-item img { width:112px; height:112px; object-fit:cover; }
.dd-add { position:absolute; right:8px; bottom:8px; width:32px; height:32px; border-radius:16px; background:#fff; box-shadow:0 1px 6px rgba(0,0,0,.25); display:grid; place-items:center; color:#191919; }
.dd-add .ic { width:16px; height:16px; stroke-width:2.6; }
.dd-qty { position:absolute; right:8px; bottom:8px; height:32px; min-width:32px; border-radius:16px; background:${RED}; color:#fff; font-size:14px; font-weight:800; display:grid; place-items:center; padding:0 11px; }
.dd-co { display:grid; grid-template-columns:1fr 260px; gap:18px; padding:16px 18px; }
.dd-co h2 { font-size:24px; font-weight:800; letter-spacing:-.4px; }
.dd-box { border:1px solid #e7e7e7; border-radius:12px; padding:12px 14px; margin-top:12px; font-size:13px; }
.dd-box .lb { font-size:15px; font-weight:800; margin-bottom:8px; }
.dd-line { display:flex; align-items:center; gap:8px; color:#191919; }
.dd-line .ic { width:16px; height:16px; }
.dd-line .sub { color:#767676; font-size:12px; }
.dd-opts { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
.dd-opt { border:1px solid #e7e7e7; border-radius:10px; padding:8px 10px; font-size:12px; color:#606060; }
.dd-opt b { display:block; color:#191919; font-size:13px; }
.dd-opt.on { border:2px solid #191919; padding:7px 9px; }
.dd-sum { border:1px solid #e7e7e7; border-radius:12px; padding:14px; font-size:12.5px; }
.dd-place { position:relative; height:44px; border-radius:22px; background:${RED}; color:#fff; font-weight:800; font-size:14.5px; display:flex; align-items:center; justify-content:space-between; padding:0 16px; }
.dd-place .dim { position:absolute; inset:0; border-radius:22px; background:#000; }
.dd-place span { position:relative; }
.dd-sum .dd-store { font-weight:800; font-size:14px; margin-top:14px; }
.dd-sum .it { color:#767676; margin-top:2px; }
.dd-row { display:flex; justify-content:space-between; margin-top:7px; color:#606060; }
.dd-row.tot { color:#191919; font-weight:800; font-size:14px; border-top:1px solid #e7e7e7; padding-top:8px; margin-top:10px; }
.dd-trk { padding:22px 26px; }
.dd-trk .dd-ok { display:inline-flex; align-items:center; gap:7px; font-size:13px; font-weight:700; color:#1d8549; }
.dd-trk .dd-ok .ic { width:16px; height:16px; stroke-width:3; }
.dd-trk h2 { font-size:30px; font-weight:800; letter-spacing:-.6px; margin-top:8px; }
.dd-trk .lat { font-size:13px; color:#606060; margin-top:4px; }
.dd-prog { display:grid; grid-template-columns:repeat(4,1fr); gap:6px; margin-top:18px; }
.dd-prog i { height:6px; border-radius:3px; background:#e7e7e7; overflow:hidden; display:block; }
.dd-prog i b { display:block; height:100%; background:${RED}; }
.dd-trk .msg { margin-top:14px; font-size:14px; font-weight:700; }
.dd-trk .msg2 { font-size:12.5px; color:#606060; margin-top:3px; }
.dd-card { margin-top:18px; border:1px solid #e7e7e7; border-radius:12px; padding:12px; display:flex; align-items:center; gap:12px; font-size:13px; }
.dd-card img { width:56px; height:56px; border-radius:8px; object-fit:cover; }
.dd-card b { display:block; font-size:14px; }
`;

function storeHtml() {
  return `<div class="dd-scr" data-s="store"><div class="dd-hero"><img src="img/store-hero.jpg" alt=""></div><div class="dd-slogo">SMASH</div>
<div class="dd-sname"><div><h3>Smash Club Burgers</h3><div class="meta">4.8 ★ (3,100+) · 1.1 mi · $$ · Burgers</div></div>
<div class="dd-fee"><div><b>$0</b>delivery fee</div><div><b>25 min</b>delivery time</div></div></div>
<div class="dd-sec">Most Ordered</div>
<div class="dd-items">
 <div class="dd-item"><div class="tx"><div class="nm">Double Smash Burger</div><div class="dd-tag">#1 Most liked</div><div class="ds">Two smashed patties, American cheese, pickles, onion</div><div class="pr">$12.49</div></div>
  <img src="img/burger.jpg" alt=""><span class="dd-add" data-add>${icon('plus')}</span><span class="dd-qty" data-qty style="opacity:0">1</span></div>
 <div class="dd-item"><div class="tx"><div class="nm">Crinkle Fries</div><div class="dd-tag">#2 Most liked</div><div class="ds">Sea salt, crispy, made to order</div><div class="pr">$4.29</div></div>
  <img src="img/store-hero.jpg" alt="" style="object-position:17% 62%"><span class="dd-add">${icon('plus')}</span></div>
</div></div>`;
}

function checkoutHtml() {
  return `<div class="dd-scr" data-s="checkout"><div class="dd-co"><div><h2>Checkout</h2>
<div class="dd-box"><div class="lb">Shipping details</div><div class="dd-line">${icon('pin')}<div>1 Market St, San Francisco<div class="sub">Apt 12 · Leave at door</div></div></div></div>
<div class="dd-box"><div class="lb">Delivery options</div><div class="dd-opts"><div class="dd-opt on"><b>Standard</b>25–35 min</div><div class="dd-opt"><b>Priority</b>15–25 min · +$2.99</div></div></div>
<div class="dd-box"><div class="lb">Payment</div><div class="dd-line">${icon('card')}<div>Visa •••• 4242</div></div></div></div>
<div class="dd-sum"><div class="dd-place" data-place><span class="dim" data-dim style="opacity:0"></span><span>Place Order</span><span>$18.03</span></div>
<div class="dd-store">Smash Club Burgers</div><div class="it">1 item</div>
<div class="dd-row"><span>Subtotal</span><span>$12.49</span></div><div class="dd-row"><span>Delivery Fee</span><span>$0.00</span></div>
<div class="dd-row"><span>Fees &amp; Estimated Tax</span><span>$2.54</span></div><div class="dd-row"><span>Dasher Tip</span><span>$3.00</span></div>
<div class="dd-row tot"><span>Total</span><span>$18.03</span></div></div></div></div>`;
}

function trackerHtml() {
  return `<div class="dd-scr" data-s="tracker"><div class="dd-trk"><span class="dd-ok">${icon('check')}Order placed</span>
<h2>Arriving at 7:42 PM</h2><div class="lat">Latest arrival by 7:52 PM</div>
<div class="dd-prog"><i><b data-p0 style="width:0"></b></i><i><b data-p1 style="width:0"></b></i><i><b style="width:0"></b></i><i><b style="width:0"></b></i></div>
<div class="msg">Smash Club Burgers is preparing your order</div><div class="msg2">We’ll let you know when your Dasher picks it up.</div>
<div class="dd-card"><img src="img/burger.jpg" alt=""><div><b>1× Double Smash Burger</b>Smash Club Burgers · $18.03 · Visa •••• 4242</div></div></div></div>`;
}

export function buildDoorDash() {
  const el = h(`<div class="dd"><style>${CSS}</style>
<div class="dd-nav"><div class="dd-logo">${doordashMark('')}DOORDASH</div><div class="dd-addr">${icon('pin')}1 Market St ▾</div>
<div class="dd-search">${icon('search')}Search DoorDash</div>
<div class="dd-cart" data-cart><span class="bg0"></span><span class="bg" data-cart-bg style="opacity:0"></span><span data-cart-ink>${icon('cart')}<span data-cart-n>0</span></span></div></div>
${storeHtml()}${checkoutHtml()}${trackerHtml()}</div>`);
  const q = (s) => el.querySelector(s);
  const screens = { store: q('[data-s=store]'), checkout: q('[data-s=checkout]'), tracker: q('[data-s=tracker]') };
  const add = q('[data-add]'), qty = q('[data-qty]');
  const cartBg = q('[data-cart-bg]'), cartInk = q('[data-cart-ink]'), cartN = q('[data-cart-n]');
  const place = q('[data-place]'), dim = q('[data-dim]');
  const p0 = q('[data-p0]'), p1 = q('[data-p1]');

  /** Page-to-page navigation: the outgoing page drifts left and fades, the incoming one settles in from the right. */
  function pageMix(t, tNav) {
    const k = prog(t, tNav, 0.5, EASE.inOut);
    return { out: { o: 1 - k, x: lerp(0, -36, k) }, inc: { o: k, x: lerp(36, 0, k) } };
  }

  /** A press: quick dip to `depth` and a soft return. */
  function press(t, at, depth = 0.9) {
    const down = prog(t, at, 0.09, EASE.standard);
    const up = prog(t, at + 0.09, 0.28, EASE.outCubic);
    return 1 - (1 - depth) * down * (1 - up);
  }

  /** cue: { add, checkout, place, placed } */
  function update(t, cue) {
    const a = pageMix(t, cue.checkout);
    const b = pageMix(t, cue.placed);
    const set = (node, o, x) => {
      node.style.opacity = o.toFixed(3);
      node.style.transform = `translateX(${x.toFixed(2)}px)`;
      node.style.visibility = o < 0.002 ? 'hidden' : 'visible';
    };
    set(screens.store, a.out.o, a.out.x);
    set(screens.checkout, Math.min(a.inc.o, b.out.o), t < cue.placed ? a.inc.x : b.out.x);
    set(screens.tracker, b.inc.o, b.inc.x);

    add.style.transform = `scale(${press(t, cue.add, 0.84).toFixed(4)})`;
    const added = prog(t, cue.add + 0.12, 0.3, EASE.standard);
    add.style.opacity = (1 - added).toFixed(3);
    qty.style.opacity = added.toFixed(3);
    qty.style.transform = `scale(${lerp(0.7, 1, prog(t, cue.add + 0.12, 0.4, EASE.outBack)).toFixed(4)})`;

    const filled = prog(t, cue.add + 0.2, 0.3, EASE.standard);
    cartBg.style.opacity = filled.toFixed(3);
    cartInk.style.color = filled > 0.5 ? '#fff' : '#191919';
    cartN.textContent = t >= cue.add + 0.2 ? '1' : '0';
    cartInk.style.transform = `scale(${lerp(0.8, 1, prog(t, cue.add + 0.2, 0.4, EASE.outBack)).toFixed(4)})`;

    place.style.transform = `scale(${press(t, cue.place, 0.96).toFixed(4)})`;
    dim.style.opacity = (0.18 * prog(t, cue.place, 0.1) * (1 - prog(t, cue.place + 0.15, 0.3))).toFixed(3);
    p0.style.width = `${(100 * prog(t, cue.placed + 0.3, 0.6, EASE.outCubic)).toFixed(2)}%`;
    p1.style.width = `${(55 * prog(t, cue.placed + 0.8, 1.6, EASE.outCubic)).toFixed(2)}%`;
  }
  return { el, update };
}
