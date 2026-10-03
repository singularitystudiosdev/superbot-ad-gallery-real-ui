// Etsy beat, the finale: superbot applies the work in the seller's own Etsy shop. Its line streams and superbot's OWN
// connect card lands in the chat (not an Etsy consent page: Etsy's Open API v3 has no messages or conversations
// endpoints and no messages OAuth scope, developers.etsy.com/documentation, checked 2026-10-03, so an Etsy screen
// granting message access would be fiction): the superbot tile and the Etsy mark joined by a dotted connector,
// "Connect your Etsy shop", the shop "WrenAndOakStudio", two permission lines and a Connect button the pointer
// presses. The base's connect-card grammar follows: a checklist card ("Connected to WrenAndOakStudio", "23 replies
// sent", "48 processing times saved", "Order-by dates on 48 listings") ticking in turn, with a mini window under it;
// the card holds (CARD_HOLD) and the window opens to full frame (GROW). Full frame is Etsy Shop Manager on the web,
// light theme, laid out from dated help.etsy.com screenshots (sidebar items in their real order, the Messages unread
// badge, the Messages inbox anatomy, the Shop Manager table anatomy): Messages and Listings side by side. The 5
// conversation rows flip to replied top to bottom ~0.15 s apart while the sidebar badge counts 23 -> 0 (the other 18
// conversations are answered below the fold), then the 8 listing rows flip their processing time and fill their
// order-by date ~0.12 s apart while "Processing times saved" counts to 48 of 48. The ONE bold moment (the chime): the
// badge lands on 0 and an Etsy success toast rises, "23 messages answered. Holiday processing times saved on 48
// listings." The final state holds (READ). On a portrait frame (4:5) there is no sidebar: a top bar (Etsy mark,
// Shop Manager, the shop, Messages with its badge), Messages (rows 1 to 4) stacked above Listings (rows 1 to 5).
//
// There is ONE Shop Manager page, on a layer in the scene root (outside the camera), pinned over the checklist card's
// window frame while the card sits in the chat and interpolated to the whole frame by GROW (the base's finale beat
// grammar). The page is laid out once at a design size (the frame divided by APP_SCALE) and scaled to the layer, so
// the mini window and the full frame are the same pixels at two sizes. Row heights are constants (etsy.css). Pure
// function of t: every moving value is written from t.
import { lerp, seg, outCubic, inOutCubic, streamCount, press } from '../../../lib.js';
import { lu } from './etsy-icons.js?v=b01f62c6';
import { SHOP } from './inbox.js?v=b01f62c6';

const SAY = 'Connecting your Etsy shop, so the replies and new times save right there.';
const PERMS = ['Reply to buyer messages', 'Edit processing times on listings'];
const STEPS = [
  ['shop', `Connected to <b>${SHOP}</b>`],
  ['msg', '<b>23</b> replies sent'],
  ['time', '<b>48</b> processing times saved'],
  ['cal', 'Order-by dates on <b>48</b> listings'],
];
const UNREAD = 23, LISTINGS = 48;
// the conversations (exact, per the brief): [buyer, initials, listing it is about, time, buyer message, your reply]
const MSGS = [
  ['Emma R.', 'ER', 'Personalized Name Necklace, Sterling Silver', '9:42 AM', "Will my name necklace get here before Christmas? It's for my sister.",
    "Hi Emma, yes! Your necklace ships Dec 9 and arrives before Christmas. I'll send tracking the day it ships."],
  ['Marcus T.', 'MT', 'Hand-Stamped Stacking Rings, Set of 3', '9:15 AM', 'Can you stamp two names on one ring?',
    "Hi Marcus, yes, two names fit on one ring. Add both in the personalization box and I'll stamp them in the same font."],
  ['Priya S.', 'PS', 'Hand-Poured Soy Candle, Fir and Cedar', '8:58 AM', "Do you gift wrap? It's for my mom.",
    'Hi Priya, every order ships in a kraft gift box with a handwritten card. Add your note at checkout.'],
  ['Jonah K.', 'JK', 'Leather Monogram Keychain', 'Yesterday', 'My order still says processing. Did it ship?',
    'Hi Jonah, it ships tomorrow. Tracking comes by email as soon as the label prints.'],
  ['Sofia M.', 'SM', 'Custom Pet Portrait Ornament', 'Yesterday', 'Can I still get the pet ornament by the 24th?',
    'Hi Sofia, yes, if you order by Dec 3. Send me a clear photo of your pet after checkout.'],
];
// the listings (exact, per the brief): [title, photo, price, processing before, processing after, order by]
const ITEMS = [
  ['Personalized Name Necklace, Sterling Silver', 'necklace.jpg', '$38.00', '1 to 3 days', '3 to 5 days', 'Dec 10'],
  ['Hand-Stamped Stacking Rings, Set of 3', 'rings.jpg', '$32.00', '1 to 3 days', '3 to 5 days', 'Dec 10'],
  ['Custom Pet Portrait Ornament', 'ornament.jpg', '$45.00', '3 to 5 days', '1 to 2 weeks', 'Dec 3'],
  ['Hand-Poured Soy Candle, Fir and Cedar', 'candle.jpg', '$24.00', '1 to 2 days', '1 to 3 days', 'Dec 14'],
  ['Chunky Knit Wool Beanie', 'beanie.jpg', '$42.00', '3 to 5 days', '1 to 2 weeks', 'Dec 3'],
  ['Leather Monogram Keychain', 'keychain.jpg', '$22.00', '1 to 2 days', '3 to 5 days', 'Dec 10'],
  ['Engraved Walnut Recipe Box', 'recipebox.jpg', '$68.00', '5 to 7 days', '1 to 2 weeks', 'Dec 3'],
  ['Linen Advent Calendar', 'advent.jpg', '$56.00', '1 to 2 days', '1 to 3 days', 'Dec 14'],
];
const TOAST = '23 messages answered. Holiday processing times saved on 48 listings.';
// Shop Manager's sidebar, in the real order (help.etsy.com "Newly Crafted" screenshots, Sales and discounts page):
// [icon, label, badge, chevron]; null = the group gap
const NAV = [
  ['search', 'Search'], ['house', 'Dashboard'], ['shapes', 'Listings'], ['message-circle-more', 'Messages', 'msg'],
  ['clipboard-list', 'Orders & Shipping', '31'], null,
  ['text-search', 'Etsy search visibility'], ['chart-column', 'Stats'], ['badge-check', 'Customer service stats'],
  ['megaphone', 'Marketing', '', true], null,
  ['landmark', 'Finances', '', true], ['layout-grid', 'Integrations'], ['users', 'Community & Help', '', true],
  ['settings', 'Settings', '', true],
];

const APP_SCALE = { wide: 1.25, tall: 1.1 };   // full frame: the page's px to frame px
// timing (seconds from the reply start, or from the card where noted)
const CPS = 80;                                  // the reply line streams (the base's finale beat)
const CARD_AT = 0.25;                            // the line streams, then the connect card lands
const CARD_IN = 0.3;                             // a card rising into the thread
const TAP_AT = 0.6; /* deliberate */             // the connect card landed to the press on Connect (it reads first)
const PTR_IN = 0.28;                             // the connect card landed to the pointer appearing
const PTR_MOVE = 0.34;                           // the pointer's travel onto Connect, ending just before the press
const LIST_AT = 0.22;                            // the press to the checklist card landing
const CHECK_AT = 0.28;                           // the checklist landing to the first check
const CHECK_STAGGER = 0.14;                      // one check to the next
const POP = 0.16;                                // a check popping in
const CARD_HOLD = 0.3; /* deliberate */          // the last check in, the card holds before it opens (the base)
const GROW = 0.4; /* deliberate */               // the window opens to full frame (the base)
const SWEEP_AT = 0.32;                           // full frame: the unread inbox reads before the first flip
const MSG_STAGGER = 0.15;                        // one conversation row to the next (the brief: ~0.15 s)
const FLIP = 0.26;                               // a row flipping (snippet swap, weight, the replied mark)
const LIST_GAP = 0.12;                           // the last conversation flipped, then the first listing
const ITEM_STAGGER = 0.12;                       // one listing row to the next (the brief: ~0.12 s)
const TINT = 0.6;                                // a flipped listing row's green wash fading out
const TOAST_AT = 0.16;                           // the last listing flipped, then the badge hits 0 and the toast rises
const TOAST_IN = 0.3;                            // Collage's toast show: 0.3 s, cubic-bezier(0,0,0,1)
const READ = 1.1; /* deliberate */               // the final state holds, readable, before the scene's fade
const RADIUS = 8;                                // the card's window radius, eased to 0 at full frame

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const CHECK = '<svg class="ek-ck" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
// Collage's toast show curve, cubic-bezier(0,0,0,1), solved for y at x (bisection; monotone)
const showCurve = (p) => {
  if (p <= 0) return 0; if (p >= 1) return 1;
  const bx = (u) => 3 * (1 - u) * u * u * 0 + u * u * u + 3 * (1 - u) * (1 - u) * u * 0; // x(u) with x1 = x2 = 0
  let a = 0, b = 1;
  for (let i = 0; i < 24; i++) { const m = (a + b) / 2; if (bx(m) < p) a = m; else b = m; }
  const u = (a + b) / 2;
  return 3 * (1 - u) * u * u + u * u * u + 0; // y(u) with y1 = 0, y2 = 1
};

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD_AT;                              // the connect card lands
    T.tap = T.card + TAP_AT;                           // Connect is pressed
    T.list = T.tap + LIST_AT;                          // the checklist card lands, the mini window in it
    T.ok = STEPS.map((_, i) => T.list + CHECK_AT + i * CHECK_STAGGER);
    T.grow = T.ok[STEPS.length - 1] + POP + CARD_HOLD; // the window starts opening
    T.full = T.grow + GROW;                            // full frame: the unread inbox, the old processing times
    T.m = MSGS.map((_, i) => T.full + SWEEP_AT + i * MSG_STAGGER);
    T.l0 = T.m[MSGS.length - 1] + FLIP + LIST_GAP;
    T.l = ITEMS.map((_, i) => T.l0 + i * ITEM_STAGGER);
    T.zero = T.l[ITEMS.length - 1] + FLIP + TOAST_AT;  // the badge lands on 0, the toast starts rising: the chime
    T.settle = Math.max(T.zero + TOAST_IN, T.l[ITEMS.length - 1] + TINT);
    T.end = T.settle + READ;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const mark = x.brand('etsy-logo.svg');
    // the renderer reads the chime mark from here (scene-local time; the tabs scene starts the spot at 0)
    window.__AD_MARKS = Object.assign(window.__AD_MARKS || {}, { chime: T.zero });

    // ---- superbot's connect card in the chat (the hub's dark palette) ----
    const say = x.el(`<div class="qc-say ek-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const connect = x.el(`<div class="ec-card">
      <div class="ec-pair">${x.tile('superbot', 'ec-t')}<i class="ec-dots"></i><span class="ec-etsy"><img src="${mark}" alt=""/></span></div>
      <div class="ec-title">Connect your Etsy shop</div>
      <div class="ec-shop"><span class="ec-etsy ec-sm"><img src="${mark}" alt=""/></span><b>${esc(SHOP)}</b></div>
      <div class="ec-sub">superbot will be able to:</div>
      ${PERMS.map((p) => `<div class="ec-perm">${CHECK}<span>${esc(p)}</span></div>`).join('')}
      <div class="ec-btns"><span class="ec-go">Connect</span></div>
    </div>`);
    const go = connect.querySelector('.ec-go');

    // ---- the checklist card ----
    const stepIcon = (kind) => (kind === 'shop' ? `<span class="ek-ic ek-etsy"><img src="${mark}" alt=""/></span>`
      : `<span class="ek-ic">${lu(kind === 'msg' ? 'reply' : kind === 'time' ? 'clock' : 'truck')}</span>`);
    const card = x.el(`<div class="ek-card">
      ${STEPS.map(([kind, txt]) => `<div class="ek-step">${stepIcon(kind)}<span class="ek-tx">${txt}</span><span class="ek-ok"><i class="ek-spin"></i>${CHECK}</span></div>`).join('')}
      <div class="ek-shot"></div>
    </div>`);
    const shot = card.querySelector('.ek-shot');
    const checks = [...card.querySelectorAll('.ek-ok')].map((n) => ({ spin: n.querySelector('.ek-spin'), ck: n.querySelector('.ek-ck') }));

    // ---- the full-frame Shop Manager page ----
    const navItem = (n) => {
      if (!n) return '<i class="et-gap"></i>';
      const [ic, label, badge, chev] = n;
      const b = badge === 'msg' ? `<span class="et-badge et-mb">${UNREAD}</span>` : badge ? `<span class="et-badge">${badge}</span>` : '';
      return `<div class="et-nv${label === 'Messages' ? ' on' : ''}">${lu(ic)}<span>${esc(label)}</span>${b}${chev ? lu('chevron-right', 'et-chev') : ''}</div>`;
    };
    const msgRow = ([name, ini, item, time, msg, rep]) => `<div class="et-mr"><i class="et-dot"></i><i class="et-av">${ini}</i>
      <div class="et-mm"><div class="et-m1"><b class="et-who">${esc(name)}</b><span class="et-about">${esc(item)}</span><time>${time}</time></div>
        <div class="et-m2"><span class="et-old">${esc(msg)}</span><span class="et-new">${lu('reply', 'et-rp')}<span>You: ${esc(rep)}</span></span></div></div></div>`;
    const itemRow = ([title, photo, price, before, after, by]) => `<div class="et-lr"><i class="et-wash"></i><img class="et-th" src="${x.img(photo)}" alt=""/>
      <span class="et-ti">${esc(title)}</span><span class="et-pr">${price}</span>
      <span class="et-pt"><span class="et-pb">${esc(before)}</span><span class="et-pa">${lu('circle-check', 'et-ok')}<b>${esc(after)}</b></span></span>
      <span class="et-ob"><span>${esc(by)}</span></span></div>`;
    const layer = x.el(`<div class="et-full" aria-hidden="true"><div class="et-app">
      <aside class="et-side">
        <div class="et-sm"><span class="et-smi">${lu('store')}</span><b>Shop Manager</b>${lu('chevron-down', 'et-dd')}</div>
        <nav class="et-nav">${NAV.map(navItem).join('')}</nav>
        <div class="et-sch">Sales channels</div>
        <div class="et-ch"><span class="et-cht"><img src="${mark}" alt=""/></span><span class="et-chn"><b>Etsy</b><small>${esc(SHOP)}</small></span><span class="et-pen">${lu('pencil')}</span></div>
        <div class="et-ch et-ch2"><span class="et-cht et-p">P</span><span class="et-chn"><b>Want your own website?</b><small>Learn more about Pattern</small></span></div>
      </aside>
      <header class="et-top"><span class="et-cht"><img src="${mark}" alt=""/></span><b>Shop Manager</b><span class="et-tshop">${esc(SHOP)}</span>
        <span class="et-tmsg">${lu('message-circle-more')}<span>Messages</span><span class="et-badge et-mb">${UNREAD}</span></span></header>
      <main class="et-main">
        <section class="et-card et-msgs">
          <div class="et-ch1"><h2>Messages</h2><span class="et-srch"><span>Search your messages</span>${lu('search')}</span></div>
          <div class="et-fold"><span class="on">Inbox <b class="et-ic-n">${UNREAD}</b></span><span>Order help requests</span><span>Sent</span></div>
          <div class="et-mrows">${MSGS.map(msgRow).join('')}</div>
        </section>
        <section class="et-card et-list">
          <div class="et-ch1"><h2>Listings</h2><span class="et-cnt">${lu('circle-check', 'et-cok')}Processing times saved <b class="et-cn">0</b> of ${LISTINGS}</span></div>
          <div class="et-lh"><span>Listing</span><span class="et-pr">Price</span><span class="et-pt">Processing time</span><span class="et-ob">Order by Dec 24</span></div>
          <div class="et-lrows">${ITEMS.map(itemRow).join('')}</div>
        </section>
        <div class="et-toast"><span class="et-ti2">${lu('check')}</span><span class="et-tt">${esc(TOAST)}</span>${lu('x', 'et-tx')}</div>
      </main>
    </div></div>`);
    x.root.appendChild(layer);
    const app = layer.firstElementChild;
    const $ = (s) => layer.querySelector(s);
    const $$ = (s) => [...layer.querySelectorAll(s)];
    const mrows = $$('.et-mr').map((n) => ({ n, old: n.querySelector('.et-old'), neu: n.querySelector('.et-new'), dot: n.querySelector('.et-dot'), rp: n.querySelector('.et-rp') }));
    const lrows = $$('.et-lr').map((n) => ({ n, pb: n.querySelector('.et-pb'), pa: n.querySelector('.et-pa'), ok: n.querySelector('.et-ok'), ob: n.querySelector('.et-ob span'), wash: n.querySelector('.et-wash') }));
    const badges = $$('.et-mb'), inboxN = $('.et-ic-n'), cn = $('.et-cn'), cnt = $('.et-cnt'), toast = $('.et-toast');

    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, geo = '', feed = null, tall = false, lastBadge = '', lastCn = '';
    let AW = 1536, AH = 864;

    const layout = () => {
      const W = x.root.offsetWidth, H = x.root.offsetHeight;
      if (!W || !H) return;
      const key = `${W}x${H}`;
      if (key === geo) return;
      geo = key;
      tall = W < H;
      const s = tall ? APP_SCALE.tall : APP_SCALE.wide;
      AW = Math.round(W / s); AH = Math.round(H / s);
      app.style.width = `${AW}px`; app.style.height = `${AH}px`;
      app.classList.toggle('et-narrow', tall);
      shot.style.aspectRatio = `${W} / ${H}`;
      card.classList.toggle('ek-tall', tall);
      connect.classList.toggle('ec-tall', tall);
    };

    // the pointer: in from below right, onto Connect, a press, then away
    const ptr = (t) => {
      const a = T.card + PTR_IN, b = T.tap - 0.08;
      if (t < a || t > T.tap + 0.45) return null;
      const g = x.box(go);
      if (!g.w) return null;
      const ex = g.x + g.w * 0.55, ey = g.y + g.h * 0.6;
      const m = inOutCubic(seg(t, a, Math.min(a + PTR_MOVE, b)));
      const leave = outCubic(seg(t, T.tap + 0.2, T.tap + 0.45));
      return {
        x: lerp(ex + 150, ex, m) + leave * 40, y: lerp(ey + 110, ey, m) + leave * 30,
        p: press(t, T.tap), v: seg(t, a, a + 0.12) * (1 - leave),
      };
    };

    return {
      nodes: [say, connect, card],
      marks: [[T.r, say], [T.card, connect], [T.list, card]],
      pointer: ptr,
      render(t) {
        layout();
        const n = streamCount(SAY, T.r + 0.05, CPS, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        const ci = outCubic(seg(t, T.card, T.card + CARD_IN));
        connect.style.opacity = ci.toFixed(3);
        connect.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px)`;
        // Connect: the press, then it stays in its pressed tone
        const pr = press(t, T.tap);
        go.style.transform = pr ? `scale(${(1 - 0.06 * pr).toFixed(4)})` : 'none';
        go.classList.toggle('ec-hit', t >= T.tap);

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

        // the conversations flip to replied, top to bottom
        mrows.forEach((o, i) => {
          const f = seg(t, T.m[i], T.m[i] + FLIP), e = outCubic(f);
          o.n.classList.toggle('et-read', f >= 0.5);
          o.dot.style.opacity = (1 - e).toFixed(3);
          o.old.style.opacity = (1 - e).toFixed(3);
          o.old.style.transform = f > 0 && f < 1 ? `translateY(${(-6 * e).toFixed(2)}px)` : f >= 1 ? 'translateY(-6px)' : 'none';
          o.neu.style.opacity = e.toFixed(3);
          o.neu.style.transform = f >= 1 ? 'none' : `translateY(${(6 * (1 - e)).toFixed(2)}px)`;
          o.rp.style.transform = `scale(${lerp(0.4, 1, outCubic(seg(t, T.m[i] + 0.08, T.m[i] + 0.08 + POP))).toFixed(4)})`;
        });
        // the unread badge counts down across the whole sweep (23 conversations, 5 of them on screen) and lands on 0
        // at the chime, where it turns from Etsy's badge orange to the neutral count style
        const left = t < T.m[0] ? UNREAD : t >= T.zero ? 0 : Math.max(1, Math.ceil(UNREAD * (1 - seg(t, T.m[0], T.zero))));
        const bs = String(left);
        if (bs !== lastBadge) { badges.forEach((b) => { b.textContent = bs; b.classList.toggle('et-zero', left === 0); }); inboxN.textContent = bs; lastBadge = bs; }
        const bp = Math.sin(Math.PI * seg(t, T.zero, T.zero + 0.24));
        badges.forEach((b) => { b.style.transform = bp > 0 ? `scale(${(1 + 0.18 * bp).toFixed(4)})` : 'none'; });

        // the listings: processing time flips old -> new with its check, the order-by date fills in, a green wash fades
        lrows.forEach((o, i) => {
          const f = seg(t, T.l[i], T.l[i] + FLIP), e = outCubic(f);
          o.pb.style.opacity = (1 - e).toFixed(3);
          o.pa.style.opacity = e.toFixed(3);
          o.pa.style.transform = f >= 1 ? 'none' : `translateY(${(5 * (1 - e)).toFixed(2)}px)`;
          o.ok.style.transform = `scale(${lerp(0.4, 1, outCubic(seg(t, T.l[i] + 0.06, T.l[i] + 0.06 + POP))).toFixed(4)})`;
          o.ob.style.opacity = outCubic(seg(t, T.l[i] + 0.08, T.l[i] + 0.08 + FLIP)).toFixed(3);
          o.wash.style.opacity = (t < T.l[i] ? 0 : (1 - inOutCubic(seg(t, T.l[i] + FLIP * 0.5, T.l[i] + TINT))) * outCubic(seg(t, T.l[i], T.l[i] + 0.1))).toFixed(3);
        });
        // "Processing times saved N of 48": all 48 listings, the 8 on screen among them, across the listings sweep
        const saved = Math.round(LISTINGS * seg(t, T.l0, T.l[ITEMS.length - 1] + FLIP));
        const cs = String(saved);
        if (cs !== lastCn) { cn.textContent = cs; cnt.classList.toggle('et-all', saved === LISTINGS); lastCn = cs; }

        // the toast: Collage's show (0.3 s, cubic-bezier(0,0,0,1)), rising from below
        const ts = showCurve(seg(t, T.zero, T.zero + TOAST_IN));
        toast.style.opacity = Math.min(1, ts * 1.6).toFixed(3);
        toast.style.transform = `translate(-50%, ${((1 - ts) * 28).toFixed(2)}px)`;
      },
      // after the camera: pin the layer over the card's window, then open it to the whole frame
      after(t) {
        if (t < T.list) { layer.style.opacity = '0'; return; }
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
        // while the card sits in the chat the layer is cut to the feed's viewport, as the card itself is, so it never
        // draws over the composer. Released as it opens.
        const fb = feed ? x.box(feed) : null;
        const cutT = fb ? Math.max(0, fb.y - Tp) * (1 - g) : 0, cutB = fb ? Math.max(0, Tp + Ht - (fb.y + fb.h)) * (1 - g) : 0;
        layer.style.clipPath = cutT > 0.01 || cutB > 0.01 ? `inset(${cutT.toFixed(2)}px 0 ${cutB.toFixed(2)}px 0 round ${(RADIUS * s * (1 - g)).toFixed(2)}px)` : '';
        layer.style.opacity = card.style.opacity;
      },
    };
  },
};
