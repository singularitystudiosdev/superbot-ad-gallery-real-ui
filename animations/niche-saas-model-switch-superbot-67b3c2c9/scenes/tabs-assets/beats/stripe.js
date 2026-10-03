// Stripe beat, the finale: superbot ships the fix and connects to the founder's own Stripe account. Its line streams and
// a card lands in the chat modelled on Stripe's real install screen for a third-party app reaching a Stripe account,
// the Stripe Apps OAuth install page (docs.stripe.com/stripe-apps/api-authentication/oauth and /install-links, whose
// screenshots give every string): the app tile and the account tile joined by the two-way arrow, "Install superbot",
// "Built by superbot", "All Pinwheel Rota members will have access to this app. Make sure you trust this developer
// before installing. You can always uninstall this app from account settings.", "THIS APP WILL HAVE ACCESS TO" with
// permission rows named as in docs.stripe.com/stripe-apps/reference/permissions and their "Read-only" / "Modify"
// levels, and the confirm button "Install" (docs.stripe.com/stripe-apps/upload-install-app: "then click Install").
// Why not the remote MCP server's consent page: it is login-gated and its wording is not published (research/
// stripe-consent.txt). The pointer presses Install within a second of the card landing, and it dims. No Stripe logo
// anywhere (Stripe's Mark Usage Terms reserve the logo for the parts of a site that relate to Stripe's services; an ad
// is not one): the app tile is the plain word. Then the sibling's connect-card grammar: a checklist card ("Connected as
// Pinwheel Rota", "Smart Retries on for failed payments", "Failed payment emails on", "Webhook fix shipped to
// production") ticks in turn, with a mini window under it; the card holds and the window opens into a SUPERBOT FRAME
// (policy: never a full-bleed native page): a superbot label bar above a framed, margined window, the thread dimmed
// behind. In the window, the founder's Stripe Dashboard, light theme, on the subscription of the customer Larkfield
// Design Co as the account owner sees it: the left nav (dimmed to 0.4: page context, not controls), the breadcrumb,
// the header (the customer, "Team, $29.00/month", the status badge), the Payments list and the Details panel. The page
// settles with the badge "Past due" and the latest payment "$29.00 USD  Failed" (Visa ending 1881); then the retry
// goes through: a new "$29.00 USD  Succeeded" row slides in on top, and THE bold moment (the chime,
// window.__AD_MARKS.chime): the badge flips to "Active". The camera pushes in on the header and the list inside the
// frame, and a small static superbot status card (text only, no buttons) settles over the frame's corner. Every
// Stripe control (Actions, Update subscription, Search, filters, kebabs, the Test mode toggle, Retry, Refund,
// pagination) is omitted; no dates or times are shown. Labels are Stripe's own: subscription statuses Active / Past
// due, payment statuses Succeeded / Failed. One Dashboard client, on a layer in the scene root (outside the camera),
// laid out once at a design size and scaled to the layer, so the mini window and the framed window are the same
// pixels at two sizes. Pure function of t.
import { lerp, seg, outCubic, outQuint, inOutCubic, streamCount, press } from '../../../lib.js';
import { oct } from './glyphs.js?v=67b3c2c9';

export const ACCOUNT = 'Pinwheel Rota';        // checked: no live product of this exact name (research/collisions.txt)
export const CUSTOMER = 'Larkfield Design Co'; // checked: no company of this exact name
const SUB_ID = 'sub_1QxR7f...';                 // truncated, never a full id
const CARD = 'Visa ending 1881';
const SAY = 'Shipped it. Connecting to your Stripe account to check it worked.';
// the install page's permission rows: [Stripe Apps permission name, access level]
const PERMS = [['Customers', 'Read-only'], ['Invoices', 'Read-only'], ['Subscriptions', 'Modify'], ['Customer Portal', 'Modify']];
const STEPS = [
  ['account', `Connected as <b>${ACCOUNT}</b>`],
  ['sync', 'Smart Retries on for failed payments'],
  ['mail', 'Failed payment emails on'],
  ['repo-push', 'Webhook fix shipped to production'],
];
const NAV = ['Home', 'Balances', 'Transactions', 'Customers', 'Product catalog'];
const NAV2 = [['Billing', false], ['Overview', true], ['Subscriptions', true, true], ['Invoices', true], ['Revenue recovery', true]];
const STATUS = ['Declined cards now retry instead of canceling', 'Customers get an email to update their card', '38 of 38 tests passing'];

const APP_SCALE = { wide: 1.35, tall: 1.2 };    // framed window: the client's px to frame px
// the superbot frame the window opens into: margins and the label bar above it (frame px)
const FRAME = { wide: { pad: 44, top: 112, bar: 44 }, tall: { pad: 22, top: 100, bar: 40 } };
// timing (seconds from the reply start, or from the card where noted)
const CPS = 80;                                 // the reply line streams (the sibling's finale beat)
const CARD_AT = 0.25;                           // the line streams, then the install card lands
const CARD_IN = 0.3;                            // a card rising into the thread
const TAP_AT = 0.75; /* deliberate */           // the install card landed to the press (policy: within about 1 s)
const PTR_IN = 0.3;                             // the install card landed to the pointer appearing
const PTR_MOVE = 0.38;                          // the pointer's travel onto the button, ending just before the press
const LIST_AT = 0.25;                           // the press to the checklist card landing
const CHECK_AT = 0.3;                           // the checklist landing to the first check
const CHECK_STAGGER = 0.14;                     // one check to the next
const POP = 0.16;                               // a check popping in
const CARD_HOLD = 0.3; /* deliberate */         // the last check in, the card holds before it opens
const GROW = 0.45; /* deliberate */             // the window opens into the superbot frame
const LAND_AT = 0.7; /* deliberate */           // framed and settled (Past due, Failed on top) to the Succeeded row landing
const LAND_IN = 0.42;                           // the Succeeded row opening and rising in
const FLIP_AT = 0.3; /* deliberate */           // the row landing to the badge flipping to Active: the chime
const FLIP = 0.3;                               // the badge changing over
const PUSH_IN = 0.6; /* deliberate */           // the camera push on the header and the list, outQuint, from the landing
const PUSH = { wide: 1.3, tall: 1.28 };         // ...to this many times the framed scale, capped so the page's columns
                                                // still fit the window's width (nothing is cut at its right edge)
const CARD2_AT = 0.7; /* deliberate */          // the flip to the status card rising
const CARD2_IN = 0.36;                          // the status card rising
const READ = 1.8; /* deliberate */              // the final state holds, readable, before the scene's fade
const RADIUS = 10;                              // the window's radius

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const CHECK = '<svg class="gk-ck" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const OKC = '<svg class="sb-okc" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
// Stripe's badge tick for Succeeded / Active, drawn as a plain stroke; Failed / Past due are plain labels (no cross:
// a pill with an x would read as a dismissible chip)
const B_OK = '<svg class="sd-bi" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 6.3l2.2 2.2L9.5 3.7"/></svg>';
const SWAP = '<svg class="sa-swap" viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 5.5h10M10 3l2.5 2.5L10 8M13.5 10.5h-10M6 8l-2.5 2.5L6 13"/></svg>';
const CHEV = '<svg class="sa-chev" viewBox="0 0 16 16" aria-hidden="true"><path d="M6 4l4 4-4 4"/></svg>';
const letter = (cls = '') => `<span class="sd-acct ${cls}">P</span>`;

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD_AT;                              // the install card lands
    T.tap = T.card + TAP_AT;                           // Install is pressed
    T.list = T.tap + LIST_AT;                          // the checklist card lands, the mini window in it
    T.ok = STEPS.map((_, i) => T.list + CHECK_AT + i * CHECK_STAGGER);
    T.grow = T.ok[STEPS.length - 1] + POP + CARD_HOLD; // the window starts opening
    T.full = T.grow + GROW;                            // framed: Past due, Failed on top
    T.land = T.full + LAND_AT;                         // the Succeeded row lands on top
    T.flip = T.land + FLIP_AT;                         // the badge flips to Active (the chime)
    T.card2 = T.flip + CARD2_AT;                       // the status card rises
    T.settle = Math.max(T.land + PUSH_IN, T.card2 + CARD2_IN);
    T.end = T.settle + READ;
    return T;
  },
  build(k, x) {
    const T = k.T;
    // the renderer reads the chime mark from here (scene-local time; the tabs scene starts the spot at 0)
    window.__AD_MARKS = Object.assign(window.__AD_MARKS || {}, { chime: T.flip });

    // ---- the Stripe Apps install card in the chat (Stripe's light chrome) ----
    const say = x.el(`<div class="qc-say sa-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const install = x.el(`<div class="sa-card">
      <div class="sa-top">
        <div class="sa-logos">${x.tile('superbot', 'sa-sb')}${SWAP}${letter('sa-ac')}</div>
        <div class="sa-title">Install superbot</div>
        <div class="sa-by">Built by <u>superbot</u></div>
      </div>
      <div class="sa-body">
        <p class="sa-warn">All ${esc(ACCOUNT)} members will have access to this app. Make sure you trust this developer before installing. You can always uninstall this app from <u>account settings</u>.</p>
        <div class="sa-h">THIS APP WILL HAVE ACCESS TO</div>
        ${PERMS.map(([p, lvl]) => `<div class="sa-row">${CHEV}<b>${esc(p)}</b><span>${esc(lvl)}</span></div>`).join('')}
      </div>
      <div class="sa-ft"><span class="sa-go">Install</span></div>
    </div>`);
    const go = install.querySelector('.sa-go');

    // ---- the checklist card ----
    const stepIcon = (kind) => (kind === 'account' ? `<span class="gk-ic gk-av">${letter('gk-l')}</span>` : `<span class="gk-ic gk-oc">${oct(kind)}</span>`);
    const card = x.el(`<div class="gk-card">
      ${STEPS.map(([kind, txt]) => `<div class="gk-step">${stepIcon(kind)}<span class="gk-tx">${txt}</span><span class="gk-ok"><i class="gk-spin"></i>${CHECK}</span></div>`).join('')}
      <div class="gk-shot"></div>
    </div>`);
    const shot = card.querySelector('.gk-shot');
    const checks = [...card.querySelectorAll('.gk-ok')].map((n) => ({ spin: n.querySelector('.gk-spin'), ck: n.querySelector('.gk-ck') }));

    // ---- the superbot frame: a scrim over the thread, the label bar, the framed window, the status card ----
    const scrim = x.el('<div class="sd-scrim" aria-hidden="true"></div>');
    const bar = x.el(`<div class="sd-bar" aria-hidden="true"><img class="sd-sb" src="${x.sbSrc}" alt=""/><b>superbot</b><span>Stripe Dashboard, ${esc(ACCOUNT)}</span></div>`);
    const badge = (cls, label, icon) => `<span class="sd-badge ${cls}">${label}${icon}</span>`;
    const payRow = (st, cls = '') => `<div class="sd-tr ${cls}"><span class="sd-amt"><b>$29.00</b> USD</span><span>${st === 'ok' ? badge('sd-pos', 'Succeeded', B_OK) : badge('sd-neg', 'Failed', '')}</span><span class="sd-pm"><i class="sd-card"></i>${CARD}</span></div>`;
    const layer = x.el(`<div class="sd-full" aria-hidden="true"><div class="sd-app">
      <nav class="sd-nav">
        <div class="sd-me">${letter('sd-me-l')}<b>${esc(ACCOUNT)}</b></div>
        ${NAV.map((l) => `<span class="sd-nv">${l}</span>`).join('')}
        <div class="sd-ns">Products</div>
        ${NAV2.map(([l, sub, on]) => `<span class="sd-nv${sub ? ' sd-sub' : ''}${on ? ' sd-on' : ''}">${l}</span>`).join('')}
      </nav>
      <main class="sd-main">
        <div class="sd-crumb">Subscriptions</div>
        <div class="sd-head">
          <span class="sd-hic"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M13 8a5 5 0 0 1-8.6 3.5M3 8a5 5 0 0 1 8.6-3.5M11.8 1.8v2.9H8.9M4.2 14.2v-2.9h2.9"/></svg></span>
          <div class="sd-ht">
            <div class="sd-h1"><h1>${esc(CUSTOMER)}</h1><span class="sd-bcell">${badge('sd-neg sd-pd', 'Past due', '')}${badge('sd-pos sd-ac', 'Active', B_OK)}</span></div>
            <p>Team, $29.00/month</p>
          </div>
        </div>
        <div class="sd-cols">
          <section class="sd-pay">
            <h2>Payments</h2>
            <div class="sd-tbl">
              <div class="sd-tr sd-th"><span>Amount</span><span>Status</span><span>Payment method</span></div>
              <div class="sd-slot">${payRow('ok', 'sd-new')}</div>
              ${payRow('no', 'sd-old')}
            </div>
            <h2 class="sd-h2b">Pricing</h2>
            <div class="sd-tbl sd-price">
              <div class="sd-tr sd-th"><span>Product</span><span>Qty</span><span>Total</span></div>
              <div class="sd-tr"><span class="sd-amt"><b>Team</b></span><span>1</span><span>$29.00 USD / month</span></div>
            </div>
          </section>
          <aside class="sd-det">
            <h2>Details</h2>
            <dl>
              <dt>Customer</dt><dd>${esc(CUSTOMER)}</dd>
              <dt>Product</dt><dd>Team</dd>
              <dt>Price</dt><dd>$29.00/month</dd>
              <dt>Payment method</dt><dd><i class="sd-card"></i>${CARD}</dd>
              <dt class="sd-idl">ID</dt><dd class="sd-id">${SUB_ID}</dd>
            </dl>
          </aside>
        </div>
      </main>
    </div></div>`);
    const status = x.el(`<div class="sd-card2" aria-hidden="true">
      <div class="sd-c2h"><img class="sd-sb" src="${x.sbSrc}" alt=""/><b>Payment recovered, ${esc(CUSTOMER)} is active</b></div>
      ${STATUS.map((s) => `<div class="sd-c2r">${OKC}<span>${esc(s)}</span></div>`).join('')}
    </div>`);
    x.root.append(scrim, layer, bar, status);
    const app = layer.firstElementChild;
    const $ = (s) => layer.querySelector(s);
    const cols = $('.sd-cols'), nav = $('.sd-nav'), slot = $('.sd-slot'), rNew = $('.sd-new'), rOld = $('.sd-old'), head = $('.sd-head');
    const pd = $('.sd-pd'), ac = $('.sd-ac'), bcell = $('.sd-bcell');

    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, geo = '', slotH = '', bW = '', tall = false, F = null;
    let AW = 1600, AH = 900;

    const layout = () => {
      const W = x.root.offsetWidth, H = x.root.offsetHeight;
      if (!W || !H) return;
      const g = `${W}x${H}`;
      if (g === geo) return;
      geo = g;
      tall = W < H;
      const f = tall ? FRAME.tall : FRAME.wide;
      F = { x: f.pad, y: f.top, w: W - 2 * f.pad, h: H - f.top - f.pad, bar: f.bar };
      const s = tall ? APP_SCALE.tall : APP_SCALE.wide;
      AW = Math.round(F.w / s); AH = Math.round(F.h / s);
      app.style.width = `${AW}px`; app.style.height = `${AH}px`;
      app.classList.toggle('sd-narrow', tall);
      shot.style.aspectRatio = `${F.w} / ${F.h}`;
      card.classList.toggle('gk-tall', tall);
      install.classList.toggle('sa-tall', tall);
      status.classList.toggle('sd-c2-tall', tall);
      bar.style.left = `${F.x}px`; bar.style.width = `${F.w}px`;
      bar.style.top = `${F.y - f.bar - 12}px`; bar.style.height = `${f.bar}px`;
      slotH = ''; bW = '';
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
        // Install: the press, then it dims (it is never left on screen as a live control)
        const pr = press(t, T.tap);
        go.style.transform = pr ? `scale(${(1 - 0.06 * pr).toFixed(4)})` : 'none';
        go.classList.toggle('sa-hit', t >= T.tap + 0.1);

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

        // the retry goes through: the Succeeded row opens at the top of the list and rises in
        const g = inOutCubic(seg(t, T.land, T.land + LAND_IN));
        const h = rNew.offsetHeight;
        const sh = g >= 1 ? 'auto' : `${(h * g).toFixed(2)}px`;
        if (sh !== slotH) { slot.style.height = sh; slotH = sh; }
        const o = outCubic(seg(t, T.land + LAND_IN * 0.25, T.land + LAND_IN));
        rNew.style.opacity = o.toFixed(3);
        rNew.style.transform = o >= 1 ? 'none' : `translateY(${((1 - o) * -10).toFixed(2)}px)`;
        rNew.classList.toggle('sd-hl', t >= T.land);
        rOld.classList.toggle('sd-hl', t < T.land);

        // the badge: Past due gives way to Active (the chime), out then in, the cell easing to the new width
        const lin = seg(t, T.flip, T.flip + FLIP);
        const out = outCubic(seg(lin, 0, 0.45)), inn = outCubic(seg(lin, 0.45, 1));
        pd.style.opacity = (1 - out).toFixed(3);
        ac.style.opacity = inn.toFixed(3);
        ac.style.transform = inn > 0 && inn < 1 ? `scale(${lerp(0.85, 1, inn).toFixed(4)})` : 'none';
        const wP = pd.offsetWidth, wA = ac.offsetWidth;
        const m = inOutCubic(lin);
        const bw = m <= 0 ? `${wP}px` : m >= 1 ? `${wA}px` : `${lerp(wP, wA, m).toFixed(2)}px`;
        if (bw !== bW) { bcell.style.width = bw; bW = bw; }

        // the status card: rises once, then holds still (static, text only)
        const c2 = outCubic(seg(t, T.card2, T.card2 + CARD2_IN));
        status.style.opacity = c2.toFixed(3);
        status.style.transform = c2 >= 1 ? 'none' : `translateY(${((1 - c2) * 14).toFixed(2)}px)`;
      },
      // after the camera: pin the layer over the card's window, then open it into the superbot frame
      after(t) {
        if (t < T.list || !F) { layer.style.opacity = '0'; scrim.style.opacity = '0'; bar.style.opacity = '0'; return; }
        layout();
        const b = x.box(shot);
        const g = inOutCubic(seg(t, T.grow, T.full));
        const L = lerp(b.x, F.x, g), Tp = lerp(b.y, F.y, g), Wd = lerp(b.w, F.w, g), Ht = lerp(b.h, F.h, g);
        layer.style.left = `${L.toFixed(2)}px`;
        layer.style.top = `${Tp.toFixed(2)}px`;
        layer.style.width = `${Wd.toFixed(2)}px`;
        layer.style.height = `${Ht.toFixed(2)}px`;
        const rad = lerp(6 * (b.w / Math.max(1, shot.offsetWidth)), RADIUS, g);
        layer.style.borderRadius = `${rad.toFixed(2)}px`;
        const k0 = Wd / AW;
        const z = outQuint(seg(t, T.land, T.land + PUSH_IN));
        if (z > 0) {
          // the push: the page header and the payments list, anchored on the header's top left, at PUSH x the framed scale
          const ar = app.getBoundingClientRect(), k = ar.width / AW;
          const hr = head.getBoundingClientRect();
          const cr = cols.getBoundingClientRect();
          const hx = (cr.left - ar.left) / k, hy = (hr.top - ar.top) / k, cw = Math.max(cr.width, hr.width) / k;
          const x0 = tall ? 6 : 16, y0 = tall ? 12 : 14;
          // the push: PUSH x the framed scale, but never so far that the columns (Payments, Pricing, Details) leave the window
          const kp = Math.min(k0 * (tall ? PUSH.tall : PUSH.wide), (F.w - 2 * x0) / cw);
          const ks = lerp(k0, kp, z);
          const px = lerp(k0 * hx, x0, z), py = lerp(k0 * hy, y0, z);
          app.style.transform = `translate(${(px - ks * hx).toFixed(2)}px, ${(py - ks * hy).toFixed(2)}px) scale(${ks.toFixed(5)})`;
        } else app.style.transform = `scale(${k0.toFixed(5)})`;
        // while the window still sits in the chat it is clipped to the thread's viewport
        const feed = card.closest('.feed');
        const fb = feed ? x.box(feed) : null;
        const cutT = fb ? Math.max(0, fb.y - Tp) * (1 - g) : 0, cutB = fb ? Math.max(0, Tp + Ht - (fb.y + fb.h)) * (1 - g) : 0;
        layer.style.clipPath = cutT > 0.01 || cutB > 0.01 ? `inset(${cutT.toFixed(2)}px 0 ${cutB.toFixed(2)}px 0 round ${rad.toFixed(2)}px)` : '';
        layer.style.opacity = card.style.opacity;
        scrim.style.opacity = g.toFixed(3);
        // the left nav steps out of the pushed-in view (its edge would otherwise sit on the window's margin)
        nav.style.opacity = (0.4 * (1 - z)).toFixed(3);
        bar.style.opacity = outCubic(seg(t, T.grow + GROW * 0.5, T.full + 0.15)).toFixed(3);
        // the status card: wide, over the window's lower right; tall, across the window's foot
        if (tall) { status.style.left = `${F.x + 16}px`; status.style.width = `${F.w - 32}px`; status.style.top = ''; status.style.bottom = `${x.root.offsetHeight - (F.y + F.h) + 16}px`; }
        else { status.style.left = `${F.x + F.w - 660 - 32}px`; status.style.width = '660px'; status.style.bottom = `${x.root.offsetHeight - (F.y + F.h) + 32}px`; }
      },
    };
  },
};
