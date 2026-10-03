// Shopify beat, the finale: superbot applies the work to the user's own Shopify store. Its line streams and Shopify's
// app install screen lands in the chat as a card, light Polaris (help.shopify.com "Installing and setting up apps":
// the "Install app" screen shows what the app can view and edit, a privacy policy link, and the Install button):
// superbot's tile and the Shopify bag joined by the dotted connector, "Install superbot", the store it installs on
// (Lumen & Clay), the "View and edit store data" section with Products (the read_products / write_products scopes,
// shopify.dev access-scopes), Cancel and the dark primary Install. The pointer presses Install, and the base's
// connect-card grammar follows: a checklist card ("Connected to Lumen & Clay", "48 descriptions updated", "5 products
// tagged Missing photos", "Saved view added: Missing photos") ticking in turn, with a mini window under it; the card
// holds (CARD_HOLD) and the window opens to full frame (GROW).
// Full frame is the Shopify admin's Products page (admin.shopify.com, light): the dark top bar (the bag, Search with
// its key hint, the store switcher), the left nav with Products open (16:9), the page header (Products, Export,
// Import, More actions, Add product), the "Descriptions rewritten" counter, and the IndexTable card: the view tabs
// (All, Active, Draft, Archived) with its search/filter and sort buttons, and the eight products. Each row's
// description starts as the store's old line and flips to the rewrite with a "Rewritten" badge, top to bottom, 0.15 s
// apart; the rows with no photos get the critical "Missing photos" badge in the same sweep, and the counter runs to
// 48 of 48. The ONE bold moment (the chime, window.__AD_MARKS.chime): the new "Missing photos" view tab lands with
// its count 5 and is selected, the flagged rows take a light critical tint, and a Polaris toast reads "48 descriptions
// updated. 5 products flagged." The final state holds (READ).
//
// There is ONE admin, on a layer in the scene root (outside the camera). While the checklist card sits in the chat
// the layer is pinned over the card's window frame; GROW interpolates it to the whole frame. The admin is laid out once
// at a design size (the frame divided by APP_SCALE, so Polaris's 13 px body reads at video size) and scaled to the
// layer, so the mini window and the full frame are the same pixels at two sizes. On a portrait frame (4:5) it drops
// the nav and the Category / Inventory columns and puts each description under its title. Pure function of t.
import { lerp, seg, outCubic, inOutCubic, streamCount, press } from '../../../lib.js';
import { pi } from './polaris-icons.js?v=a3b73360';
import { STORE } from './catalog.js?v=a3b73360';

const SAY = 'Applying it to your Shopify store.';
// the store's products (made up for the spot): [title, photo (img/ file) or null, status, inventory, category, old
// description, new description]. 16:9 shows all eight; 4:5 the first six.
const ROWS = [
  ['Speckled Stoneware Mug', 'mug.jpg', 'Active', '42 in stock', 'Mugs', 'mug 12oz ceramic',
    'Wheel-thrown stoneware with a speckled cream glaze. Holds 12 oz. Microwave and dishwasher safe.'],
  ['Linen Table Runner', null, 'Active', '18 in stock', 'Table linens', 'table runner, linen, 2 sizes',
    'Stonewashed European linen in natural oat. Comes in 72 and 90 inch lengths.'],
  ['Fig and Cedar Soy Candle', 'candle.jpg', 'Active', '65 in stock', 'Candles', 'candle fig scent',
    'Hand-poured soy wax with ripe fig and cedar. About 50 hours of burn time in a reusable amber jar.'],
  ['Ceramic Pour-Over Set', 'pourover.jpg', 'Active', '12 in stock', 'Coffee', 'pour over coffee set',
    'Matte black dripper and 600 ml carafe. Fits standard #2 paper filters.'],
  ['Olive Wood Serving Board', null, 'Active', '9 in stock', 'Serving boards', 'board wood',
    'Carved from a single piece of olive wood. Each grain pattern is one of a kind.'],
  ['Sand Glaze Bud Vase', 'vase.jpg', 'Active', '27 in stock', 'Vases', 'small vase',
    'A 5 inch bud vase in a matte sand glaze. Sized for one stem or a few dried grasses.'],
  ['Waffle Weave Tea Towel', null, 'Draft', '30 in stock', 'Kitchen towels', 'towel',
    'Absorbent cotton waffle weave that softens with every wash. Set of two.'],
  ['Stoneware Dinner Plate', 'plate.jpg', 'Active', '54 in stock', 'Plates', 'plate 10in',
    'A 10.5 inch dinner plate with a raw clay rim. Oven, microwave and dishwasher safe.'],
].map(([title, photo, status, inv, cat, before, after]) => ({ title, photo, status, inv, cat, before, after }));
const TALL_ROWS = 5;
const STEPS = [
  ['store', 'Connected to <b>Lumen &amp; Clay</b>'],
  ['product', '<b>48</b> descriptions updated'],
  ['image', '<b>5</b> products tagged Missing photos'],
  ['filter', 'Saved view added: <b>Missing photos</b>'],
];
// the admin's nav: [icon, label, selected, sub-items]
const NAV = [
  ['home', 'Home'], ['order', 'Orders'],
  ['product', 'Products', true, ['Collections', 'Inventory', 'Purchase orders', 'Transfers', 'Gift cards']],
  ['person', 'Customers'], ['content', 'Content'], ['chart-vertical', 'Analytics'], ['target', 'Marketing'], ['discount', 'Discounts'],
];
const TOTAL = 48;
const TOAST = '48 descriptions updated. 5 products flagged.';

const APP_SCALE = { wide: 1.4, tall: 1.4 };     // full frame: the admin's px to frame px
// timing (seconds from the reply start, or from the card where noted)
const CPS = 80;                                 // the reply line streams (the base's finale beat)
const CARD_AT = 0.25;                           // the line streams, then the install card lands
const CARD_IN = 0.3;                            // a card rising into the thread
const TAP_AT = 0.75; /* deliberate */           // the install card landed to the press on Install (it reads first)
const PTR_IN = 0.3;                             // the install card landed to the pointer appearing
const PTR_MOVE = 0.4;                           // the pointer's travel onto the button, ending just before the press
const LIST_AT = 0.25;                           // the press to the checklist card landing
const CHECK_AT = 0.3;                           // the checklist landing to the first check
const CHECK_STAGGER = 0.12;                     // one check to the next
const POP = 0.16;                               // a check popping in
const CARD_HOLD = 0.3; /* deliberate */         // the last check in, the card holds before it opens
const GROW = 0.4; /* deliberate */              // the window opens to full frame
const SWEEP_AT = 0.35; /* deliberate */         // full frame (the old descriptions read) to the first row flipping
const ROW_STEP = 0.15; /* deliberate */         // one row's flip to the next (the brief: about 0.15 s)
const FLIP = 0.22;                              // a row's description crossing over, its badges popping in
const BOLD_AT = 0.25;                           // the last row flipped to the Missing photos tab landing (the chime)
const BOLD_IN = 0.34;                           // the tab opening, the tint and the toast rising in
const READ = 1.5; /* deliberate */              // the final state holds, readable, before the scene's fade
const RADIUS = 8;                               // the card's window radius (Polaris border-radius-200), eased to 0

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const CHECK = '<svg class="sk-ck" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const avatarLC = (cls = '') => `<span class="pl-av ${cls}">LC</span>`;
const badge = (tone, text, cls = '') => `<span class="pl-badge pl-${tone} ${cls}">${esc(text)}</span>`;

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD_AT;                              // the install card lands
    T.tap = T.card + TAP_AT;                           // Install is pressed
    T.list = T.tap + LIST_AT;                          // the checklist card lands, the mini window in it
    T.ok = STEPS.map((_, i) => T.list + CHECK_AT + i * CHECK_STAGGER);
    T.grow = T.ok[STEPS.length - 1] + POP + CARD_HOLD; // the window starts opening
    T.full = T.grow + GROW;                            // full frame: the old descriptions
    T.flip = ROWS.map((_, i) => T.full + SWEEP_AT + i * ROW_STEP); // each row's description flips
    T.swept = T.flip[ROWS.length - 1] + FLIP;          // the counter reads 48 of 48
    T.bold = T.swept + BOLD_AT;                        // the Missing photos tab lands (the chime)
    T.settle = T.bold + BOLD_IN;
    T.end = T.settle + READ;
    return T;
  },
  build(k, x) {
    const T = k.T;
    // the renderer reads the chime mark from here (scene-local time; the tabs scene starts the spot at 0)
    window.__AD_MARKS = Object.assign(window.__AD_MARKS || {}, { chime: T.bold });
    const bag = x.brand('shopify-logo.svg');

    // ---- the install card in the chat (Shopify's "Install app" screen, light Polaris) ----
    const say = x.el(`<div class="qc-say sk-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const install = x.el(`<div class="si-card">
      <div class="si-logos">${x.tile('superbot', 'si-sb')}<i class="si-dots"></i><span class="si-bag"><img src="${bag}" alt=""/></span></div>
      <div class="si-title">Install superbot</div>
      <div class="si-store">${avatarLC('si-av')}<span><b>${esc(STORE.name)}</b><small>${esc(STORE.domain)}</small></span></div>
      <div class="si-sec">
        <div class="si-sh">${pi('lock', 'si-shi')}<b>View and edit store data</b>${pi('chevron-up', 'si-chev')}</div>
        <div class="si-row">${pi('product', 'si-ri')}<span>Products</span></div>
      </div>
      <div class="si-pp">superbot's <a>privacy policy</a></div>
      <div class="si-btns"><span class="pl-btn si-cancel">Cancel</span><span class="pl-btn pl-pri si-go">Install</span></div>
    </div>`);
    const go = install.querySelector('.si-go');

    // ---- the checklist card ----
    const stepIcon = (kind) => (kind === 'store' ? avatarLC('sk-av') : `<span class="sk-ic">${pi(kind)}</span>`);
    const card = x.el(`<div class="sk-card">
      ${STEPS.map(([kind, txt]) => `<div class="sk-step">${stepIcon(kind)}<span class="sk-tx">${txt}</span><span class="sk-ok"><i class="sk-spin"></i>${CHECK}</span></div>`).join('')}
      <div class="sk-shot"></div>
    </div>`);
    const shot = card.querySelector('.sk-shot');
    const checks = [...card.querySelectorAll('.sk-ok')].map((n) => ({ spin: n.querySelector('.sk-spin'), ck: n.querySelector('.sk-ck') }));

    // ---- the full-frame admin: the Products index ----
    const thumb = (o) => (o.photo ? `<span class="pa-th"><img src="${x.img(o.photo)}" alt=""/></span>` : `<span class="pa-th pa-none">${pi('image')}</span>`);
    const row = (o, i) => `<div class="pa-row${o.photo ? '' : ' pa-np'}" data-i="${i}">
        <span class="pa-c pa-cb"><i class="pa-box"></i></span>
        <span class="pa-c pa-ct">${thumb(o)}</span>
        <span class="pa-c pa-cp"><span class="pa-tl"><b>${esc(o.title)}</b>${o.photo ? '' : badge('critical', 'Missing photos', 'pa-mp')}</span>
          <span class="pa-ds pa-ds-in"><span class="pa-old">${esc(o.before)}</span><span class="pa-new">${badge('success', 'Rewritten', 'pa-rw')}<span>${esc(o.after)}</span></span></span></span>
        <span class="pa-c pa-cd"><span class="pa-ds"><span class="pa-old">${esc(o.before)}</span><span class="pa-new">${badge('success', 'Rewritten', 'pa-rw')}<span>${esc(o.after)}</span></span></span></span>
        <span class="pa-c pa-cs">${badge(o.status === 'Active' ? 'success' : 'info', o.status)}</span>
        <span class="pa-c pa-ci">${esc(o.inv)}</span>
        <span class="pa-c pa-cc">${esc(o.cat)}</span>
      </div>`;
    const navHTML = NAV.map(([ic, label, on, sub]) => `<div class="pa-nv${on ? ' pa-on' : ''}">${pi(ic)}<span>${label}</span></div>${on ? sub.map((s) => `<div class="pa-ns">${s}</div>`).join('') : ''}`).join('');
    const layer = x.el(`<div class="pa-full" aria-hidden="true"><div class="pa-app">
      <header class="pa-top">
        <span class="pa-logo"><img src="${bag}" alt=""/></span>
        <span class="pa-search">${pi('search')}<span>Search</span><kbd class="pa-kh">&#8984; K</kbd></span>
        <span class="pa-tr">
          <span class="pa-tib">${pi('sidekick')}</span>
          <span class="pa-tib pa-wide">${pi('notification')}</span>
          <span class="pa-sw">${avatarLC('pa-av')}<span class="pa-wide">${esc(STORE.name)}</span></span>
        </span>
      </header>
      <div class="pa-body">
        <nav class="pa-nav">${navHTML}
          <div class="pa-sc">Sales channels ${pi('chevron-right')}</div>
          <div class="pa-nv">${pi('store')}<span>Online Store</span></div>
          <div class="pa-nv pa-set">${pi('settings')}<span>Settings</span></div>
        </nav>
        <main class="pa-main">
          <div class="pa-ph">
            <h1>${pi('product', 'pa-h1i')}Products</h1>
            <span class="pa-acts"><span class="pl-btn pa-wide">Export</span><span class="pl-btn pa-wide">Import</span><span class="pl-btn pa-wide">More actions ${pi('chevron-down')}</span><span class="pl-btn pl-pri">Add product</span></span>
          </div>
          <div class="pa-cnt">${pi('check-circle', 'pa-cnti')}<span>Descriptions rewritten</span><b class="pa-n">0 of ${TOTAL}</b></div>
          <section class="pa-card">
            <div class="pa-tabs">
              <span class="pa-tab pa-all pa-sel">All</span><span class="pa-tab">Active</span><span class="pa-tab">Draft</span><span class="pa-tab">Archived</span>
              <span class="pa-tslot"><span class="pa-tab pa-mtab">Missing photos <i class="pa-tc">5</i></span></span>
              <span class="pa-tab pa-plus">${pi('plus')}</span>
              <span class="pa-tools"><span class="pa-tool">${pi('search')}${pi('filter')}</span><span class="pa-tool pa-wide">${pi('sort')}</span></span>
            </div>
            <div class="pa-hd">
              <span class="pa-c pa-cb"><i class="pa-box"></i></span><span class="pa-c pa-ct"></span>
              <span class="pa-c pa-cp">Product</span><span class="pa-c pa-cd">Description</span><span class="pa-c pa-cs">Status</span>
              <span class="pa-c pa-ci">Inventory</span><span class="pa-c pa-cc">Category</span>
            </div>
            <div class="pa-rows">${ROWS.map(row).join('')}</div>
          </section>
        </main>
      </div>
      <div class="pa-toast"><span>${esc(TOAST)}</span>${pi('x')}</div>
    </div></div>`);
    x.root.appendChild(layer);
    const app = layer.firstElementChild;
    const $ = (s) => layer.querySelector(s);
    const rows = [...layer.querySelectorAll('.pa-row')].map((n, i) => ({
      n, np: !ROWS[i].photo,
      ds: [...n.querySelectorAll('.pa-ds')].map((d) => ({ old: d.querySelector('.pa-old'), nw: d.querySelector('.pa-new'), rw: d.querySelector('.pa-rw') })),
      mp: n.querySelector('.pa-mp'),
    }));
    const cntN = $('.pa-n'), cntI = $('.pa-cnti');
    const tslot = $('.pa-tslot'), mtab = $('.pa-mtab'), allTab = $('.pa-all'), toast = $('.pa-toast');

    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, geo = '', feed = null, slotW = '', count = '';
    let AW = 1422, AH = 800;

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
      app.classList.toggle('pa-narrow', tall);
      rows.forEach((o, i) => { o.n.style.display = tall && i >= TALL_ROWS ? 'none' : ''; });
      shot.style.aspectRatio = `${W} / ${H}`;
      card.classList.toggle('sk-tall', tall);
      install.classList.toggle('si-tall', tall);
      slotW = '';
    };

    // the pointer: in the chat, onto Install and a press, then away
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

    return {
      nodes: [say, install, card],
      marks: [[T.r, say], [T.card, install], [T.list, card]],
      pointer: ptr,
      render(t) {
        layout();
        const n = streamCount(SAY, T.r + 0.05, CPS, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        const ci = outCubic(seg(t, T.card, T.card + CARD_IN));
        install.style.opacity = ci.toFixed(3);
        install.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px)`;
        // Install: the press, then it stays in its pressed (active) tone
        const pr = press(t, T.tap);
        go.style.transform = pr ? `scale(${(1 - 0.06 * pr).toFixed(4)})` : 'none';
        go.classList.toggle('pl-hit', t >= T.tap);

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

        // the sweep: each row's description crosses from the old line to the rewrite, its badges pop in
        rows.forEach((o, i) => {
          const f = T.flip[i];
          const out = outCubic(seg(t, f, f + FLIP * 0.45)), inn = outCubic(seg(t, f + FLIP * 0.35, f + FLIP));
          o.ds.forEach((d) => {
            d.old.style.opacity = (1 - out).toFixed(3);
            d.old.style.display = inn > 0 ? 'none' : '';
            d.nw.style.display = inn > 0 ? '' : 'none';
            d.nw.style.opacity = inn.toFixed(3);
            d.rw.style.transform = inn >= 1 ? 'none' : `scale(${lerp(0.7, 1, inn).toFixed(4)})`;
          });
          if (o.mp) {
            o.mp.style.opacity = inn.toFixed(3);
            o.mp.style.transform = inn >= 1 ? 'none' : `scale(${lerp(0.7, 1, inn).toFixed(4)})`;
          }
          // the bold moment: the flagged rows take the light critical tint
          o.n.classList.toggle('pa-flag', o.np && t >= T.bold);
          o.n.style.setProperty('--pa-tint', o.np ? outCubic(seg(t, T.bold, T.bold + BOLD_IN)).toFixed(3) : '0');
        });
        // the counter: 0 of 48 until the sweep, then it runs with it to 48 of 48
        const cn = Math.round(TOTAL * seg(t, T.flip[0], T.swept));
        const cs = `${cn} of ${TOTAL}`;
        if (cs !== count) { cntN.textContent = cs; count = cs; }
        cntI.style.opacity = outCubic(seg(t, T.swept - 0.1, T.swept + 0.1)).toFixed(3);

        // the bold moment: the Missing photos tab opens into the row and takes the selection, the toast rises
        const b = outCubic(seg(t, T.bold, T.bold + BOLD_IN));
        const w = mtab.offsetWidth;
        const sw = b <= 0 ? '0px' : b >= 1 ? 'auto' : `${(w * b).toFixed(2)}px`;
        if (sw !== slotW) { tslot.style.width = sw; slotW = sw; }
        mtab.style.opacity = outCubic(seg(t, T.bold + BOLD_IN * 0.3, T.bold + BOLD_IN)).toFixed(3);
        const sel = t >= T.bold + BOLD_IN * 0.5;
        mtab.classList.toggle('pa-sel', sel);
        allTab.classList.toggle('pa-sel', !sel);
        toast.style.opacity = b.toFixed(3);
        toast.style.transform = `translate(-50%, ${((1 - b) * 24).toFixed(2)}px)`;
      },
      // after the camera: pin the layer over the card's window, then open it to the whole frame
      after(t) {
        if (t < T.list) { layer.style.opacity = '0'; return; }
        layout();
        const bx = x.box(shot);
        const root = x.root;
        feed = feed || card.closest('.feed');
        const W = root.offsetWidth, H = root.offsetHeight;
        const g = inOutCubic(seg(t, T.grow, T.full));
        const L = lerp(bx.x, 0, g), Tp = lerp(bx.y, 0, g), Wd = lerp(bx.w, W, g), Ht = lerp(bx.h, H, g);
        const s = shot.offsetWidth ? bx.w / shot.offsetWidth : 1;
        layer.style.left = `${L.toFixed(2)}px`;
        layer.style.top = `${Tp.toFixed(2)}px`;
        layer.style.width = `${Wd.toFixed(2)}px`;
        layer.style.height = `${Ht.toFixed(2)}px`;
        layer.style.borderRadius = `${(RADIUS * s * (1 - g)).toFixed(2)}px`;
        app.style.transform = `scale(${(Wd / AW).toFixed(5)})`;
        const fb = feed ? x.box(feed) : null;
        const cutT = fb ? Math.max(0, fb.y - Tp) * (1 - g) : 0, cutB = fb ? Math.max(0, Tp + Ht - (fb.y + fb.h)) * (1 - g) : 0;
        layer.style.clipPath = cutT > 0.01 || cutB > 0.01 ? `inset(${cutT.toFixed(2)}px 0 ${cutB.toFixed(2)}px 0 round ${(RADIUS * s * (1 - g)).toFixed(2)}px)` : '';
        layer.style.opacity = card.style.opacity;
      },
    };
  },
};
