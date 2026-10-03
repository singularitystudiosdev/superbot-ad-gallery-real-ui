// Seller Central beat, the finale: superbot applies the fixes in the seller's own Seller Central. Its line streams and
// Amazon's Selling Partner API consent page lands in the chat as a card (sellercentral.amazon.com/apps/authorize/consent,
// the page the SP-API "Authorize Public Applications" doc names "Amazon's consent page"): superbot's tile and the
// Amazon mark joined by the base's dotted connector, "Authorize superbot" (the doc's own verb: the seller "chooses
// Authorize", then "reviews the data access request"), the account Copperline Kitchen, United States, the roles the
// seller reviews (Product Listing and Pricing, the role names and descriptions verbatim from the SP-API roles doc) and
// the Confirm button (the doc: "To complete authorization, the seller chooses Confirm"). The pointer presses Confirm,
// and the base's connect-card grammar follows: a checklist card ("Connected to Copperline Kitchen", "6 titles updated",
// "4 prices matched", "10 listing updates submitted") ticking in turn, with a mini window under it; the card holds
// (CARD_HOLD) and the window opens to full frame (GROW).
// Full frame is Seller Central's Manage All Inventory page (Inventory menu): the dark top nav (menu, the Amazon mark, the
// store and marketplace switcher, Search, messages, settings, help), the bookmarks row (16:9), the page header with
// Preferences and Add a product, the Listing status filter (All, Active, Inactive, Search suppressed, with counts), the
// search bar, the submitted-updates counter and the inventory table (Status, Image, Product details with ASIN and SKU,
// Available, Price + Shipping and one ad-specific Featured Offer column in plain body text). The rows flip top to bottom,
// 0.15 s apart: suppressed listings go from Inactive / Search suppressed to Active and take their new titles, the three
// price-matched listings take their new price and Featured Offer No -> Yes. The ONE bold moment (the chime,
// window.__AD_MARKS.chime): the Search suppressed count drops from 6 to 0, Inactive to 0 and Active rises by 6, while
// Seller Central's success alert opens above the table: "10 listing updates submitted. 6 listings are active again."
// The final state holds (READ).
//
// There is ONE Seller Central page, on a layer in the scene root (outside the camera). While the checklist card sits in
// the chat the layer is pinned over the card's window frame; GROW interpolates it to the whole frame. The page is laid
// out once at a design size (the frame divided by APP_SCALE) and scaled to the layer, so the mini window and the full
// frame are the same pixels at two sizes. On a portrait frame (4:5) it drops the bookmarks row, the Available column
// and rows 7 and 8, and titles wrap to two lines. Pure function of t: every moving value is written from t.
import { lerp, seg, outCubic, inOutCubic, streamCount, press } from '../../../lib.js';
import { ico } from './sc-icons.js?v=37d4e2c2';
import { STORE, LISTINGS } from './catalog.js?v=37d4e2c2';

const SAY = 'Applying the fixes in your Seller Central.';
// the roles superbot asks for: SP-API roles doc (developer-docs.amazon.com/sp-api/docs/roles-in-the-selling-partner-api,
// fetched 2026-10-03): role name, then the doc's own description, shortened at its first clause
const ROLES = [
  ['doc', 'Product Listing', 'Create and manage product listings'],
  ['tag', 'Pricing', 'Determine list prices and automate product pricing'],
];
const STEPS = [
  ['amazon', `Connected to <b>${STORE.name}</b>`],
  ['doc', '<b>6</b> titles updated'],
  ['tag', '<b>4</b> prices matched'],
  ['circle-check', '<b>10</b> listing updates submitted'],
];
const BOOKMARKS = ['Manage All Inventory', 'Manage Orders', 'Business Reports', 'Account Health', 'Advertising Console'];
// the Listing status filter: [label, count before, count after, critical]
const FILTERS = [['All', 64, 64], ['Active', 58, 64], ['Inactive', 6, 0], ['Search suppressed', 6, 0, true]];
const ALERT = ['10 listing updates submitted.', '6 listings are active again.'];
const UPDATES = 10;

const APP_SCALE = { wide: 1.25, tall: 1.15 };   // full frame: the page's px to frame px
// timing (seconds from the reply start, or from the card where noted)
const CPS = 80;                                 // the reply line streams (the base's finale beat)
const CARD_AT = 0.25;                           // the line streams, then the consent card lands
const CARD_IN = 0.3;                            // a card rising into the thread
const TAP_AT = 0.75; /* deliberate */           // the consent card landed to the press on Confirm (it reads first)
const PTR_IN = 0.32;                            // the consent card landed to the pointer appearing
const PTR_MOVE = 0.38;                          // the pointer's travel onto Confirm, ending just before the press
const LIST_AT = 0.25;                           // the press to the checklist card landing
const CHECK_AT = 0.3;                           // the checklist landing to the first check
const CHECK_STAGGER = 0.14;                     // one check to the next
const POP = 0.16;                               // a check popping in
const CARD_HOLD = 0.3; /* deliberate */         // the last check in, the card holds before it opens
const GROW = 0.4; /* deliberate */              // the window opens to full frame
const RAW_HOLD = 0.5;                           // full frame: the inventory reads before the first row flips
const ROW_STAGGER = 0.15; /* deliberate */      // one row to the next (the brief: about 0.15 s)
const FLIP = 0.2;                               // a cell's old value giving way to the new one
const FLASH = 0.6;                              // the success tint on a fixed row fading out
const CHIME_AT = 0.3;                           // the last row flipped, then the bold moment
const CHIME_IN = 0.36;                          // the counts changing over and the alert opening
const READ = 1.5; /* deliberate */              // the final state holds, readable, before the scene's fade
const RADIUS = 12;                              // the card's window radius (Seller Central's card), eased to 0 at full frame

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const usd = (p) => `$${p}`;

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD_AT;                              // the consent card lands
    T.tap = T.card + TAP_AT;                           // Confirm is pressed
    T.list = T.tap + LIST_AT;                          // the checklist card lands, the mini window in it
    T.ok = STEPS.map((_, i) => T.list + CHECK_AT + i * CHECK_STAGGER);
    T.grow = T.ok[STEPS.length - 1] + POP + CARD_HOLD; // the window starts opening
    T.full = T.grow + GROW;                            // full frame, the inventory before the fixes
    T.rows = LISTINGS.map((_, i) => T.full + RAW_HOLD + i * ROW_STAGGER); // each row flips, top to bottom
    T.chime = T.rows[T.rows.length - 1] + FLIP + CHIME_AT; // the bold moment
    T.settle = T.chime + CHIME_IN;
    T.end = T.settle + READ;
    return T;
  },
  build(k, x) {
    const T = k.T;
    // the renderer reads the chime mark from here (scene-local time; the tabs scene starts the spot at 0)
    window.__AD_MARKS = Object.assign(window.__AD_MARKS || {}, { chime: T.chime });
    const amz = x.brand('amazon-icon.svg'), amzW = x.brand('amazon-icon-white.svg');

    // ---- the consent card in the chat (Seller Central's SP-API consent page, light) ----
    const say = x.el(`<div class="qc-say sa-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const consent = x.el(`<div class="sa-card">
      <div class="sa-logos">${x.tile('superbot', 'sa-sb')}<i class="sa-dots"></i><span class="sa-amz"><img src="${amz}" alt=""/></span></div>
      <div class="sa-title">Authorize superbot</div>
      <div class="sa-acct">${esc(STORE.name)}<i></i>${esc(STORE.market)}</div>
      <div class="sa-box">
        <div class="sa-bh">Data access request</div>
        ${ROLES.map(([ic, title, sub]) => `<div class="sa-row">${ico(ic, 'sa-ri')}<span><b>${esc(title)}</b><small>${esc(sub)}</small></span>${ico('check', 'sa-rk')}</div>`).join('')}
      </div>
      <div class="sa-btns"><span class="sa-go">Confirm</span></div>
    </div>`);
    const go = consent.querySelector('.sa-go');

    // ---- the checklist card ----
    const stepIcon = (kind) => (kind === 'amazon' ? `<span class="sk-ic sk-amz"><img src="${amzW}" alt=""/></span>` : `<span class="sk-ic">${ico(kind)}</span>`);
    const card = x.el(`<div class="sk-card">
      ${STEPS.map(([kind, txt]) => `<div class="sk-step">${stepIcon(kind)}<span class="sk-tx">${txt}</span><span class="sk-ok"><i class="sk-spin"></i>${ico('check', 'sk-ck')}</span></div>`).join('')}
      <div class="sk-shot"></div>
    </div>`);
    const shot = card.querySelector('.sk-shot');
    const checks = [...card.querySelectorAll('.sk-ok')].map((n) => ({ spin: n.querySelector('.sk-spin'), ck: n.querySelector('.sk-ck') }));

    // ---- the full-frame Seller Central page: Manage All Inventory ----
    const row = (l) => {
      const T2 = l.fix === 'T', P2 = l.fix === 'P';
      return `<div class="sc-tr${T2 ? ' sc-fixT' : ''}${P2 ? ' sc-fixP' : ''}">
        <span class="sc-td sc-c-cb"><i class="sc-cb"></i></span>
        <span class="sc-td sc-c-st"><span class="sc-x">
          ${T2 ? '<span class="sc-a sc-st-i"><b>Inactive</b><em>Search suppressed</em></span>' : ''}
          <span class="sc-b sc-st-a"><b>Active</b></span>
        </span></span>
        <span class="sc-td sc-c-im"><img src="${x.img(l.img)}" alt=""/></span>
        <span class="sc-td sc-c-pd"><span class="sc-x sc-ttl">
          ${T2 ? `<a class="sc-a">${esc(l.old)}</a>` : ''}<a class="sc-b">${esc(l.title)}</a>
        </span><span class="sc-ids"><span>ASIN <b>${l.asin}</b></span><span>SKU <b>${l.sku}</b></span></span></span>
        <span class="sc-td sc-c-av">${l.avail}</span>
        <span class="sc-td sc-c-pr"><span class="sc-x">
          ${P2 ? `<span class="sc-a">${usd(l.price)}</span>` : ''}<span class="sc-b">${usd(l.newPrice || l.price)}</span>
        </span><small>+ $0.00</small></span>
        <span class="sc-td sc-c-fo"><span class="sc-x">
          ${P2 ? `<span class="sc-a">${l.fo}</span>` : ''}<span class="sc-b">${P2 ? ico('circle-check', 'sc-fok') : ''}${l.newFo || l.fo}</span>
        </span></span>
      </div>`;
    };
    const layer = x.el(`<div class="sc-full" aria-hidden="true"><div class="sc-app">
      <header class="sc-top">
        <span class="sc-ib">${ico('menu')}</span>
        <span class="sc-logo"><img src="${amzW}" alt=""/></span>
        <span class="sc-store"><b>${esc(STORE.name)}</b><i></i><span>${esc(STORE.market)}</span>${ico('chevron')}</span>
        <span class="sc-search">${ico('search')}<span>Search</span></span>
        <span class="sc-tools"><span class="sc-ib">${ico('mail')}</span><i class="sc-vd"></i><span class="sc-ib">${ico('help')}</span><i class="sc-vd"></i><span class="sc-ib">${ico('settings')}</span></span>
      </header>
      <nav class="sc-bm">${BOOKMARKS.map((b) => `<a>${esc(b)}</a>`).join('')}</nav>
      <main class="sc-page">
        <div class="sc-h"><h1>Manage All Inventory</h1><span class="sc-hr"><a class="sc-pref">Preferences</a><span class="sc-btn">Add a product</span></span></div>
        <div class="sc-flt"><span class="sc-fl">Listing status</span>${FILTERS.map(([lab, a, b, crit], i) => `<span class="sc-pill${i === 0 ? ' on' : ''}${crit ? ' sc-crit' : ''}">${esc(lab)}<span class="sc-cnt"><b class="sc-n0">${a}</b><b class="sc-n1">${b}</b></span></span>`).join('')}</div>
        <div class="sc-bar"><span class="sc-in">${ico('search')}<span>Search by SKU, product name, or ASIN</span></span><span class="sc-sbtn">Search</span>
          <span class="sc-upd">Listing updates submitted <b class="sc-updn">0</b> of ${UPDATES}</span></div>
        <div class="sc-aslot"><div class="sc-alert">${ico('circle-check', 'sc-aok')}<span><b>${esc(ALERT[0])}</b> ${esc(ALERT[1])}</span></div></div>
        <div class="sc-tbl">
          <div class="sc-thr"><span class="sc-th sc-c-cb"><i class="sc-cb"></i></span><span class="sc-th sc-c-st">Status</span><span class="sc-th sc-c-im">Image</span>
            <span class="sc-th sc-c-pd">Product details</span><span class="sc-th sc-c-av">Available</span><span class="sc-th sc-c-pr">Price + Shipping</span><span class="sc-th sc-c-fo">Featured Offer</span></div>
          ${LISTINGS.map(row).join('')}
        </div>
      </main>
    </div></div>`);
    x.root.appendChild(layer);
    const app = layer.firstElementChild;
    const $ = (s) => layer.querySelector(s);
    const rows = [...layer.querySelectorAll('.sc-tr')].map((n, i) => ({
      n, l: LISTINGS[i], xs: [...n.querySelectorAll('.sc-x')].filter((c) => c.querySelector('.sc-a')).map((c) => ({ a: c.querySelector('.sc-a'), b: c.querySelector('.sc-b') })),
    }));
    const pills = [...layer.querySelectorAll('.sc-pill')].map((n) => ({ n, a: n.querySelector('.sc-n0'), b: n.querySelector('.sc-n1') }));
    const updn = $('.sc-updn'), aslot = $('.sc-aslot'), alert = $('.sc-alert');

    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, geo = '', feed = null, slotH = '', upd = '';
    let AW = 1536, AH = 864;

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
      app.classList.toggle('sc-narrow', tall);
      shot.style.aspectRatio = `${W} / ${H}`;
      card.classList.toggle('sk-tall', tall);
      consent.classList.toggle('sa-tall', tall);
      slotH = '';
    };

    // the pointer: onto Confirm, a press, then away
    const ptr = (t) => {
      if (t < T.card + PTR_IN || t > T.tap + 0.45) return null;
      const a = T.card + PTR_IN, b = T.tap - 0.08;
      const g = x.box(go);
      if (!g.w) return null;
      const ex = g.x + g.w * 0.55, ey = g.y + g.h * 0.6;
      const m = inOutCubic(seg(t, a, Math.min(a + PTR_MOVE, b)));
      const leave = outCubic(seg(t, T.tap + 0.2, T.tap + 0.45));
      return { x: lerp(ex + 150, ex, m) + leave * 40, y: lerp(ey + 110, ey, m) + leave * 30, p: press(t, T.tap), v: seg(t, a, a + 0.12) * (1 - leave) };
    };

    // an old value gives way to the new one in the same cell: out, then in (two texts never sit on top of each other)
    const swap = (c, t, at) => {
      const out = outCubic(seg(t, at, at + FLIP * 0.5)), inn = outCubic(seg(t, at + FLIP * 0.5, at + FLIP));
      c.a.style.opacity = (1 - out).toFixed(3);
      c.b.style.opacity = inn.toFixed(3);
      c.b.style.transform = inn >= 1 || inn <= 0 ? 'none' : `translateY(${((1 - inn) * 4).toFixed(2)}px)`;
    };

    return {
      nodes: [say, consent, card],
      marks: [[T.r, say], [T.card, consent], [T.list, card]],
      pointer: ptr,
      render(t) {
        layout();
        const n = streamCount(SAY, T.r + 0.05, CPS, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        const ci = outCubic(seg(t, T.card, T.card + CARD_IN));
        consent.style.opacity = ci.toFixed(3);
        consent.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px)`;
        // Confirm: the press, then it stays in its pressed state
        const pr = press(t, T.tap);
        go.style.transform = pr ? `scale(${(1 - 0.06 * pr).toFixed(4)})` : 'none';
        go.classList.toggle('sa-hit', t >= T.tap);

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

        // ---- the page: the rows flip top to bottom, each fixed row flashing the success tint ----
        rows.forEach((o, i) => {
          const at = T.rows[i];
          o.xs.forEach((c) => swap(c, t, at));
          const fl = o.l.fix ? seg(t, at, at + 0.08) * (1 - seg(t, at + 0.15, at + FLASH)) : 0;
          o.n.style.backgroundColor = fl > 0 ? `rgba(2, 116, 9, ${(0.08 * fl).toFixed(4)})` : '';
        });
        const u = `${Math.round(UPDATES * seg(t, T.rows[0], T.chime))}`;
        if (u !== upd) { updn.textContent = u; upd = u; }

        // the bold moment: the counts change over and the success alert opens above the table
        const m = seg(t, T.chime, T.chime + CHIME_IN);
        const out = outCubic(seg(m, 0, 0.45)), inn = outCubic(seg(m, 0.45, 1));
        pills.forEach((p, i) => {
          if (FILTERS[i][1] === FILTERS[i][2]) { p.b.style.display = 'none'; return; }
          p.a.style.opacity = (1 - out).toFixed(3);
          p.b.style.opacity = inn.toFixed(3);
          p.n.classList.toggle('sc-after', t >= T.chime + CHIME_IN * 0.45);
        });
        const g = inOutCubic(m);
        const h = alert.offsetHeight;
        const sh = g >= 1 ? 'auto' : `${(h * g).toFixed(2)}px`;
        if (sh !== slotH) { aslot.style.height = sh; slotH = sh; }
        alert.style.opacity = outCubic(seg(m, 0.25, 1)).toFixed(3);
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
        const s = shot.offsetWidth ? b.w / shot.offsetWidth : 1; // the camera's scale on the card
        layer.style.left = `${L.toFixed(2)}px`;
        layer.style.top = `${Tp.toFixed(2)}px`;
        layer.style.width = `${Wd.toFixed(2)}px`;
        layer.style.height = `${Ht.toFixed(2)}px`;
        layer.style.borderRadius = `${(RADIUS * s * (1 - g)).toFixed(2)}px`;
        app.style.transform = `scale(${(Wd / AW).toFixed(5)})`;
        // while the card sits in the chat the layer is cut to the feed's viewport, as the card itself is (it lands
        // while the thread is still gliding up), so it never draws over the composer. Released as it opens.
        const fb = feed ? x.box(feed) : null;
        const cutT = fb ? Math.max(0, fb.y - Tp) * (1 - g) : 0, cutB = fb ? Math.max(0, Tp + Ht - (fb.y + fb.h)) * (1 - g) : 0;
        layer.style.clipPath = cutT > 0.01 || cutB > 0.01 ? `inset(${cutT.toFixed(2)}px 0 ${cutB.toFixed(2)}px 0 round ${(RADIUS * s * (1 - g)).toFixed(2)}px)` : '';
        layer.style.opacity = card.style.opacity;
      },
    };
  },
};
