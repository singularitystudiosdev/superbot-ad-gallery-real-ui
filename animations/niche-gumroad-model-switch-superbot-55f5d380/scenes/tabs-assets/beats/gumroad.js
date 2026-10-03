// Gumroad beat, the finale: superbot, connected to the creator's Gumroad account, creates and publishes the product.
// The integration is the real one: Gumroad's open-source API (antiwork/gumroad) grants the OAuth scope edit_products
// (app/controllers/api/v2/links_controller.rb:43), POST /v2/products creates and publishes a digital product, and
// the covers / thumbnail / files endpoints set the rest. So there is no consent sheet and no Authorize / Allow / Deny
// here: a connect card lands in the chat (the superbot mark and the official Gumroad mark side by side, a thin line
// drawing between them, "Connected to Gumroad" and the granted scope "edit_products" as plain text), then four rows
// tick green ("Product created", "PDF and spreadsheet attached", "Cover and thumbnail set", "Published at $29"). A
// mini window under the rows holds the product page, which builds with the rows (the title and description, then
// what's inside, then the cover, then the price); the card holds and the window opens to the full frame (the base's
// grow machinery). Full frame is the public Gumroad product page as a buyer sees it, inside superbot's opaque frame:
// the store URL as plain text on the frame's top band (no browser chrome, no address bar), then the page in Gumroad's
// visual language (white, black 1 px borders, the offset shadow, the pink price tag): the creator header ("NV Noor
// Vance"), the cover (a real photograph with the title set over it), "Price It Right", the price tag "$29" (a label
// shape, not a button), the creator line, the description, what's inside and the product facts as plain text. No buy button, no
// cart, no quantity, no stars, ratings, sales or follower counts, no share or wishlist, no carousel dots, no links
// styled as links, and no boxed panel in the buy-box slot (the product facts are plain text lines under a muted label,
// "About this product"). The ONE bold moment: the banner "Published on Gumroad" with "Price It Right, $29" slides down over
// the creator header and the chime fires as it lands (window.__AD_MARKS.chime). The final state holds (READ).
//
// There is ONE page, on a layer in the scene root (outside the camera). While the connect card sits in the chat the
// layer is pinned over the card's window; GROW interpolates it to the whole frame. The page is laid out once per frame
// size at a design size (the frame divided by APP_SCALE) and scaled to the layer. On a portrait frame (4:5) it is
// re-laid out, not cropped: one column (cover, title, the price and creator row, the description, then what's inside
// and the product facts side by side). Every opacity and transform is a pure function of t.
import { lerp, seg, outCubic, outQuint, inOutCubic } from '../../../lib.js';
import { gi } from './gumroad-icons.js?v=55f5d380';

const SCOPE = 'edit_products';
const STEPS = [
  ['package', 'Product created'],
  ['files', 'PDF and spreadsheet attached'],
  ['image', 'Cover and thumbnail set'],
  ['tag', 'Published at <b>$29</b>'],
];
const URL_LINE = 'noorvance.gumroad.com/l/price-it-right';
const CREATOR = { mono: 'NV', name: 'Noor Vance' };
const PRODUCT = {
  name: 'Price It Right',
  summary: 'A pricing guide for freelance designers',
  price: '$29',
  desc: 'I undercharged for years. This is the system I use now to quote projects, raise rates with old clients and turn down work that does not pay.',
  inside: [['file-text', '84-page PDF'], ['file-spreadsheet', 'Rate calculator spreadsheet'], ['files', '6 quote templates']],
  info: '84-page PDF, rate calculator, 6 templates',
};
const BANNER = { title: 'Published on Gumroad', sub: 'Price It Right, $29' };

const APP_SCALE = { wide: 1.3, tall: 1.0 };      // full frame: the page's px to frame px
// timing (seconds from the reply start, or from the card where noted)
const CARD_AT = 0.12;                           // reply start to the connect card rising
const CARD_IN = 0.3;                            // a card rising into the thread
const LINE_AT = 0.18;                           // the card landing to the line drawing between the two marks
const LINE = 0.35;                              // the line drawing
const CHECK_AT = 0.55;                          // the card landing to the first row's check
const CHECK_STAGGER = 0.22;                     // one row to the next
const POP = 0.16;                               // a check popping in
const PART_IN = 0.22;                           // a part of the page appearing with its row
const CARD_HOLD = 0.35; /* deliberate */        // the last check in, the card holds before it opens
const GROW = 0.45; /* deliberate */             // the window opens to full frame
const BAN_AT = 0.7; /* deliberate */            // full frame to the banner sliding down (the page reads first)
const BAN_IN = 0.36; /* deliberate */           // the banner sliding down, outQuint; the chime as it lands
const TAG_POP = 0.3;                            // the price tag's small lift as the banner lands
const READ = 1.9; /* deliberate */              // the final state holds, readable, before the scene's fade
const RADIUS = 8;                               // the window's radius in the card, eased to 0

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const CHECK = '<svg class="vc-ck" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD_AT;                              // the connect card lands
    T.line = T.card + LINE_AT;
    T.ok = STEPS.map((_, i) => T.card + CHECK_AT + i * CHECK_STAGGER);
    T.grow = T.ok[STEPS.length - 1] + POP + CARD_HOLD; // the window starts opening
    T.full = T.grow + GROW;                            // full frame
    T.ban = T.full + BAN_AT;                           // the banner starts down
    T.zero = T.ban + BAN_IN;                           // the banner lands: the chime
    T.end = T.zero + READ;
    return T;
  },
  build(k, x) {
    const T = k.T;
    // the renderer reads the chime mark from here (scene-local time; the tabs scene starts the spot at 0)
    window.__AD_MARKS = Object.assign(window.__AD_MARKS || {}, { chime: T.zero });

    // ---- the connect card (superbot's own, the hub's greys and green check), the mini window under the rows ----
    const card = x.el(`<div class="vc-card">
      <div class="vc-top">
        <div class="vc-marks">${x.tile('superbot', 'vc-sb')}<i class="vc-line"><i></i></i><img class="vc-gr" src="${x.brand('gumroad-mark.svg')}" alt=""/></div>
        <div class="vc-acct"><b>Connected to Gumroad</b><span><em>Scope</em> ${esc(SCOPE)}</span></div>
      </div>
      ${STEPS.map(([ic, txt]) => `<div class="vc-step"><span class="vc-ic">${gi(ic)}</span><span class="vc-tx">${txt}</span><span class="vc-ok"><i class="vc-spin"></i>${CHECK}</span></div>`).join('')}
      <div class="vc-shot"></div>
    </div>`);
    const shot = card.querySelector('.vc-shot');
    const lineFill = card.querySelector('.vc-line i');
    const checks = [...card.querySelectorAll('.vc-ok')].map((n) => ({ spin: n.querySelector('.vc-spin'), ck: n.querySelector('.vc-ck') }));

    // ---- the full-frame public product page ----
    const P = PRODUCT;
    const cover = new URL('../../../photos/cover.jpg', import.meta.url).href;
    const layer = x.el(`<div class="gr-full" aria-hidden="true"><div class="gr-app">
      <div class="gr-url"><span>${esc(URL_LINE)}</span></div>
      <div class="gr-page">
        <div class="gr-hd"><span class="gr-av">${esc(CREATOR.mono)}</span><span class="gr-cn">${esc(CREATOR.name)}</span></div>
        <div class="gr-ban"><img class="gr-bm" src="${x.brand('gumroad-mark.svg')}" alt=""/><b>${esc(BANNER.title)}</b><span>${esc(BANNER.sub)}</span></div>
        <article class="gr-art">
          <div class="gr-main">
            <div class="gr-cover gr-p2"><img src="${cover}" alt=""/><div class="gr-ct"><b>${esc(P.name)}</b><span>${esc(P.summary)}</span></div></div>
            <h1 class="gr-h1 gr-p0">${esc(P.name)}</h1>
            <div class="gr-row gr-p0"><span class="gr-cell"><span class="gr-tag gr-p3">${esc(P.price)}</span></span><span class="gr-cell"><span class="gr-av gr-av-s">${esc(CREATOR.mono)}</span><span>${esc(CREATOR.name)}</span></span></div>
            <div class="gr-desc gr-p0"><p>${esc(P.desc)}</p></div>
          </div>
          <aside class="gr-side">
            <div class="gr-in gr-p1"><h3>What's inside</h3><ul>${P.inside.map(([ic, t]) => `<li>${gi(ic)}<span>${esc(t)}</span></li>`).join('')}</ul></div>
            <div class="gr-info gr-p1"><h4>About this product</h4><p>${esc(P.summary)}</p><p>${esc(P.info)}</p></div>
          </aside>
        </article>
      </div>
    </div></div>`);
    x.root.appendChild(layer);
    const app = layer.firstElementChild;
    const $ = (s) => layer.querySelector(s);
    const ban = $('.gr-ban'), tag = $('.gr-tag');
    // the page's parts, each appearing with its row in the card: 0 created (title, row, description), 1 attached
    // (what's inside, the info box), 2 cover set, 3 published (the price tag)
    const parts = [0, 1, 2, 3].map((i) => [...layer.querySelectorAll(`.gr-p${i}`)]);

    let geo = '', AW = 1477, AH = 831;
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
      app.classList.toggle('gr-narrow', tall);
      card.classList.toggle('vc-tall', tall);
      shot.style.aspectRatio = `${W} / ${H}`;
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
        // the page builds with the rows
        parts.forEach((ns, i) => {
          const o = outCubic(seg(t, T.ok[i], T.ok[i] + PART_IN)).toFixed(3);
          ns.forEach((n) => { n.style.opacity = o; });
        });
        // the bold moment: the banner slides down over the creator header; the price tag lifts once as it lands
        const b = outQuint(seg(t, T.ban, T.zero));
        ban.style.transform = `translateY(${((b - 1) * 100).toFixed(2)}%)`;
        ban.style.visibility = b > 0 ? 'visible' : 'hidden';
        ban.dataset.on = t >= T.zero ? '1' : '0';
        const lift = Math.sin(Math.PI * seg(t, T.zero - 0.05, T.zero - 0.05 + TAG_POP));
        tag.style.transform = lift > 0 ? `translateY(${(-3 * lift).toFixed(2)}px) scale(${(1 + 0.08 * lift).toFixed(4)})` : 'none';
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
        app.style.transform = `scale(${(Wd / AW).toFixed(5)})`;
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
