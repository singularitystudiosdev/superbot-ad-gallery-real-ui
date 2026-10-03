// Woo beat, the finale: superbot publishes the fall line to the user's WooCommerce store. WooCommerce's REST API
// authenticates with the consumer key and secret the store owner generates under WooCommerce > Settings > Advanced >
// REST API (Read/Write), and variations are created through the variations batch endpoint
// (POST /wp-json/wc/v3/products/<id>/variations/batch); so there is no consent screen, login or OAuth here. A connect
// card lands in the chat (the superbot mark and the official Woo logo side by side, a thin line drawing between them,
// the store "Fernhollow" and its domain "fernhollow.shop"), then four rows tick green ("Connected with your WooCommerce
// REST API key", "Created 4 variable products and 96 variations", "Price, SKU, stock and weight set on each one",
// "Published to fernhollow.shop"). A mini window under the rows holds the store's Products screen; the card holds and
// the window opens to the full frame (the base's grow machinery).
// Full frame is a STRIPPED WooCommerce > Products screen in wp-admin (WordPress default admin colours + WooCommerce,
// every value measured headlessly from a live WordPress Playground, beats/woo.css): no admin bar, no admin menu, no
// buttons, links, checkboxes, search, filters, row actions, sort arrows, pagination or dismiss X. The WooCommerce header
// bar carries only the Woo logo and the plain text "Fernhollow"; the "Products" heading; the notice slot; the list
// table. The ONE bold moment: the three older products are already there; the four new rows slide in at the top one
// after another, each with WordPress's list-table add highlight (wp-lists addColor #ffff33) fading out and its Stock
// count ticking up from 0; when the fourth lands the success notice "4 products and 96 variations published." slides
// into its slot, the chime fires as it lands (window.__AD_MARKS.chime) and the camera pushes into the four new rows.
// The final state holds (READ).
//
// There is ONE wp-admin page, on a layer in the scene root (outside the camera). While the connect card sits in the
// chat the layer is pinned over the card's window; GROW interpolates it to the whole frame. The page is laid out once
// per frame size at a design size (the frame divided by APP_SCALE, chosen so the 13 px table body renders >= 24 px at
// 1920 x 1080 and >= 22 px at 864 x 1080) and scaled to the layer. Portrait (4:5) shows thumbnail, Name, Stock and
// Price, taller rows with larger thumbnails, and six rows (the four new ones, Canvas Tote, Wool Socks).
import { lerp, seg, outCubic, outQuint, inOutCubic } from '../../../lib.js';
import { li } from './lucide-icons.js?v=14250a28';

const STORE = 'Fernhollow';
const DOMAIN = 'fernhollow.shop';
const STEPS = [
  ['key-round', 'Connected with your WooCommerce REST API key'],
  ['package', 'Created 4 variable products and 96 variations'],
  ['tag', 'Price, SKU, stock and weight set on each one'],
  ['globe', `Published to <b>${DOMAIN}</b>`],
];
// the Products list, top to bottom: the four new products first, then three already in the store
// [name, sku, stock, price, categories, photo, new]
const ROWS = [
  ['Heavyweight Hoodie', 'HW-HOOD', 312, '68.00', 'Hoodies, Fall line', 'heavyweight-hoodie.jpg', true],
  ['Zip Hoodie', 'ZIP-HOOD', 264, '74.00', 'Hoodies, Fall line', 'zip-hoodie.jpg', true],
  ['Crewneck Sweatshirt', 'CREW-SWT', 288, '58.00', 'Sweatshirts, Fall line', 'crewneck-sweatshirt.jpg', true],
  ['Long Sleeve Tee', 'LS-TEE', 320, '38.00', 'Tees, Fall line', 'long-sleeve-tee.jpg', true],
  ['Canvas Tote', 'TOTE-NAT', 42, '24.00', 'Bags', 'canvas-tote.jpg', false],
  ['Wool Socks', 'SOCK-WOOL', 130, '16.00', 'Accessories', 'wool-socks.jpg', false],
  ['Enamel Mug', 'MUG-ENM', 9, '18.00', 'Home', 'enamel-mug.jpg', false],
];
const NEW_N = 4;
const NOTICE = '4 products and 96 variations published.';

// the page's geometry in WordPress px (measured: header bar 32 + 1 px rule, h1 23 px with 9/4 padding = 42.9, notice
// 8/12 padding + 6.5 px paragraph margins = 49, th 8/10 padding 14/19.6 + 1 px rule = 37, td 8/10 padding, thumb 40)
const GEO = {
  wide: { scale: 1.846, pad: 70, row: 56, thumb: 40, rows: 7 },
  tall: { scale: 1.72, pad: 24, row: 72, thumb: 56, rows: 6 },
};
const HDR = 33, WRAP_TOP = 4, H1 = 43, SLOT_T = 10, NOTICE_H = 49, SLOT_B = 12, TH = 38;
// timing (seconds from the reply start, or from the card / full frame where noted)
const CARD_AT = 0.12;                           // reply start to the connect card rising
const CARD_IN = 0.3;                            // a card rising into the thread
const LINE_AT = 0.18;                           // the card landing to the line drawing between the two marks
const LINE = 0.35;                              // the line drawing
const CHECK_AT = 0.55;                          // the card landing to the first row's check
const CHECK_STAGGER = 0.16;                     // one row to the next
const POP = 0.16;                               // a check popping in
const CARD_HOLD = 0.3; /* deliberate */         // the last check in, the card holds before it opens
const GROW = 0.45; /* deliberate */             // the window opens to full frame
const NEW_AT = 0.35; /* deliberate */           // full frame to the first new row (the page reads first)
const NEW_GAP = 0.4; /* deliberate */           // one new row to the next
const ROW_IN = 0.3;                             // a row sliding in (its height opening, the rows below moving down)
const HL = 1.0;                                 // the add highlight fading out (wp-lists animates addColor back)
const TICK_AT = 0.1, TICK = 0.5;                // a new row's stock count ticking up from 0
const NOTICE_IN = 0.3;                          // the notice sliding into its slot; landed = the chime
const PUSH_AT = 0.12; /* deliberate */          // the notice landed, then the push into the new rows
const PUSH_IN = 0.5; /* deliberate */           // the push, outQuint
const PUSH = { wide: 1.12, tall: 1.06 };        // the push's scale (capped so the table's full width stays in frame)
const READ = 1.15; /* deliberate */             // the final state holds, readable, before the scene's fade
const RADIUS = 8;                               // the window's radius in the card, eased to 0

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const CHECK = '<svg class="vc-ck" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD_AT;
    T.line = T.card + LINE_AT;
    T.ok = STEPS.map((_, i) => T.card + CHECK_AT + i * CHECK_STAGGER);
    T.grow = T.ok[STEPS.length - 1] + POP + CARD_HOLD;
    T.full = T.grow + GROW;
    T.row = ROWS.map((_, i) => (i < NEW_N ? T.full + NEW_AT + (NEW_N - 1 - i) * NEW_GAP : -Infinity)); // bottom new row first
    T.landed = T.full + NEW_AT + (NEW_N - 1) * NEW_GAP + ROW_IN;   // the fourth new row (top of the list) is in
    T.zero = T.landed + NOTICE_IN;                                 // the notice has landed: the chime
    T.push = T.zero + PUSH_AT;
    T.settle = T.push + PUSH_IN;
    T.end = T.settle + READ;
    return T;
  },
  build(k, x) {
    const T = k.T;
    // the renderer reads the chime mark from here (scene-local time; the tabs scene starts the spot at 0)
    window.__AD_MARKS = Object.assign(window.__AD_MARKS || {}, { chime: T.zero });

    // ---- the connect card (superbot's own, the hub's greys and green check), the mini window under the rows ----
    const card = x.el(`<div class="vc-card">
      <div class="vc-top">
        <div class="vc-marks">${x.tile('superbot', 'vc-sb')}<i class="vc-line"><i></i></i><img class="vc-woo" src="${x.brand('woocommerce-logo.svg')}" alt=""/></div>
        <div class="vc-store"><b>${esc(STORE)}</b><span>${esc(DOMAIN)}</span></div>
      </div>
      ${STEPS.map(([ic, txt]) => `<div class="vc-step"><span class="vc-ic">${li(ic)}</span><span class="vc-tx">${txt}</span><span class="vc-ok"><i class="vc-spin"></i>${CHECK}</span></div>`).join('')}
      <div class="vc-shot"></div>
    </div>`);
    const shot = card.querySelector('.vc-shot');
    const lineFill = card.querySelector('.vc-line i');
    const checks = [...card.querySelectorAll('.vc-ok')].map((n) => ({ spin: n.querySelector('.vc-spin'), ck: n.querySelector('.vc-ck') }));

    // ---- the full-frame wp-admin Products screen (stripped of every control) ----
    const row = ([name, sku, stock, price, cats, photo, nw], i) => `<div class="wa-r${nw ? ' wa-new' : ''}${i === ROWS.length - 1 ? ' wa-last' : ''}"><div class="wa-ri"><i class="wa-hl"></i>
      <span class="wa-c wa-thumb"><img src="${x.img(photo)}" alt=""/></span>
      <span class="wa-c wa-name"><strong>${esc(name)}</strong></span>
      <span class="wa-c wa-sku">${esc(sku)}</span>
      <span class="wa-c wa-stock"><mark class="instock">In stock</mark> (<span class="wa-q">${nw ? 0 : stock}</span>)</span>
      <span class="wa-c wa-price"><span class="amount"><bdi><span class="sym">$</span>${esc(price)}</bdi></span></span>
      <span class="wa-c wa-cat">${esc(cats)}</span></div></div>`;
    const layer = x.el(`<div class="wa-full" aria-hidden="true"><div class="wa-app">
      <div class="wa-hdr wa-e"><img class="wa-mark" src="${x.brand('woocommerce-logo.svg')}" alt=""/><span class="wa-store">${esc(STORE)}</span></div>
      <div class="wa-wrap">
        <h1 class="wa-h1 wa-e">Products</h1>
        <div class="wa-slot"><div class="wa-notice"><p>${esc(NOTICE)}</p></div></div>
        <div class="wa-tbl">
          <div class="wa-th wa-e"><span class="wa-c wa-thumb"></span><span class="wa-c wa-name">Name</span><span class="wa-c wa-sku">SKU</span><span class="wa-c wa-stock">Stock</span><span class="wa-c wa-price">Price</span><span class="wa-c wa-cat">Categories</span></div>
          ${ROWS.map(row).join('')}
        </div>
      </div>
    </div></div>`);
    x.root.appendChild(layer);
    const app = layer.firstElementChild;
    const $ = (s) => layer.querySelector(s);
    const notice = $('.wa-notice');
    const rows = [...layer.querySelectorAll('.wa-r')].map((n, i) => ({ n, hl: n.querySelector('.wa-hl'), q: n.querySelector('.wa-q'), shown: '' , i }));
    const hdr = $('.wa-hdr'), h1 = $('.wa-h1'), th = $('.wa-th');

    let geoKey = '', AW = 1040, AH = 585, G = GEO.wide, tall = false;
    let F = null; // the push: focus point and which elements leave the frame, per frame size

    const layout = () => {
      const W = x.root.offsetWidth, H = x.root.offsetHeight;
      if (!W || !H) return;
      const key = `${W}x${H}`;
      if (key === geoKey) return;
      geoKey = key;
      tall = W < H;
      G = tall ? GEO.tall : GEO.wide;
      AW = Math.round(W / G.scale); AH = Math.round(H / G.scale);
      app.style.width = `${AW}px`; app.style.height = `${AH}px`;
      app.style.setProperty('--wa-pad', `${G.pad}px`);
      app.style.setProperty('--wa-row', `${G.row}px`);
      app.style.setProperty('--wa-thumb', `${G.thumb}px`);
      app.classList.toggle('wa-tall', tall);
      card.classList.toggle('vc-tall', tall);
      shot.style.aspectRatio = `${W} / ${H}`;
      // the push: scale about the middle of [the notice's top, the fourth new row's bottom], which travels to the frame's
      // centre; the scale is capped so the table's whole width stays in frame. An element the pushed frame would only
      // partly show fades out with the push (design px, final layout).
      const slotTop = HDR + WRAP_TOP + H1 + SLOT_T;
      const tblTop = slotTop + NOTICE_H + SLOT_B;
      const rowTop = (i) => tblTop + TH + i * G.row;
      const fy = (slotTop + rowTop(NEW_N)) / 2, fx = AW / 2;
      const ps = Math.min(tall ? PUSH.tall : PUSH.wide, AW / (AW - 2 * G.pad + 16));
      const dy = AH / 2 - fy;
      const map = (y) => fy + (y - fy) * ps + dy;
      const out = (a, b) => map(a) < -0.5 || map(b) > AH + 0.5;
      const fades = [];
      // the header bar's logo sits 24 px in from the page's left edge: it leaves the frame sideways as well
      if (out(0, HDR) || fx + (24 - fx) * ps < 0.5) fades.push(hdr);
      if (out(HDR + WRAP_TOP, HDR + WRAP_TOP + H1)) fades.push(h1);
      rows.forEach((r, i) => { if (i >= NEW_N && i < G.rows && out(rowTop(i), rowTop(i + 1))) fades.push(r.n); });
      F = { fx, fy, ps, dy, fades };
    };

    const ok = (t, a) => outCubic(seg(t, a, a + POP));

    return {
      nodes: [card],
      marks: [[T.card, card]],
      render(t) {
        layout();
        const ci = outCubic(seg(t, T.card, T.card + CARD_IN));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px)`;
        lineFill.style.transform = `scaleX(${inOutCubic(seg(t, T.line, T.line + LINE)).toFixed(4)})`;
        checks.forEach((c, i) => {
          const o = ok(t, T.ok[i]);
          c.spin.style.opacity = (1 - seg(t, T.ok[i] - 0.06, T.ok[i] + 0.04)).toFixed(3);
          c.spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
          c.ck.style.opacity = o.toFixed(3);
          c.ck.style.transform = `scale(${lerp(0.4, 1, o).toFixed(4)})`;
        });

        // the new rows: the height opens (the rows below move down), the row fades and slides in, the add highlight
        // fades back to the row's own colour, the stock count ticks up from 0
        rows.forEach((r) => {
          const a = T.row[r.i];
          if (!Number.isFinite(a)) return;
          const p = inOutCubic(seg(t, a, a + ROW_IN));
          r.n.style.height = `${(p * G.row).toFixed(2)}px`;
          r.n.firstElementChild.style.opacity = outCubic(seg(t, a + 0.08, a + ROW_IN)).toFixed(3);
          r.hl.style.opacity = t < a ? '0' : (1 - seg(t, a + ROW_IN * 0.5, a + ROW_IN * 0.5 + HL)).toFixed(3);
          const q = String(Math.round(ROWS[r.i][2] * outCubic(seg(t, a + TICK_AT, a + TICK_AT + TICK))));
          if (q !== r.shown) { r.q.textContent = q; r.shown = q; }
        });
        // the success notice slides into its slot as the fourth row lands
        const nv = outCubic(seg(t, T.landed, T.zero));
        notice.style.opacity = nv.toFixed(3);
        notice.style.transform = nv >= 1 ? 'none' : `translateY(${((1 - nv) * -10).toFixed(2)}px)`;
      },
      // after the camera: pin the layer over the card's window, then open it to the whole frame
      after(t) {
        if (t < T.card) { layer.style.opacity = '0'; return; }
        layout();
        const b = x.box(shot);
        const root = x.root;
        const W = root.offsetWidth, H = root.offsetHeight;
        const g = inOutCubic(seg(t, T.grow, T.full));
        const Lx = lerp(b.x, 0, g), Tp = lerp(b.y, 0, g), Wd = lerp(b.w, W, g), Ht = lerp(b.h, H, g);
        const s = shot.offsetWidth ? b.w / shot.offsetWidth : 1;
        layer.style.left = `${Lx.toFixed(2)}px`;
        layer.style.top = `${Tp.toFixed(2)}px`;
        layer.style.width = `${Wd.toFixed(2)}px`;
        layer.style.height = `${Ht.toFixed(2)}px`;
        layer.style.borderRadius = `${(RADIUS * s * (1 - g)).toFixed(2)}px`;
        const k0 = Wd / AW;
        const pz = g >= 1 && F ? outQuint(seg(t, T.push, T.push + PUSH_IN)) : 0;
        if (pz > 0) {
          const ps = lerp(1, F.ps, pz), dy = F.dy * pz;
          app.style.transform = `translate(${(k0 * F.fx * (1 - ps)).toFixed(2)}px, ${(k0 * (F.fy * (1 - ps) + dy)).toFixed(2)}px) scale(${(k0 * ps).toFixed(5)})`;
        } else app.style.transform = `scale(${k0.toFixed(5)})`;
        if (F) F.fades.forEach((n) => { n.style.opacity = pz > 0 ? (1 - pz).toFixed(3) : ''; });
        // while in the card, clip the window to the thread's visible band
        const feed = card.closest('.feed');
        const fb = feed ? x.box(feed) : null;
        const cutT = fb ? Math.max(0, fb.y - Tp) * (1 - g) : 0, cutB = fb ? Math.max(0, Tp + Ht - (fb.y + fb.h)) * (1 - g) : 0;
        layer.style.clipPath = cutT > 0.01 || cutB > 0.01 ? `inset(${cutT.toFixed(2)}px 0 ${cutB.toFixed(2)}px 0 round ${(RADIUS * s * (1 - g)).toFixed(2)}px)` : '';
        layer.style.opacity = card.style.opacity;
      },
    };
  },
};
