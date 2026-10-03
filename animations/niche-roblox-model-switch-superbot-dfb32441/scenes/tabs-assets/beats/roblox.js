// Roblox beat, the finale: superbot publishes the fix to the user's own Roblox experience. Its line streams and a card
// lands in the chat modelled on Creator Hub's real "Create API Key" page (create.roblox.com/dashboard/credentials;
// docs: create.roblox.com/docs/cloud/auth/api-keys). Why an API key and not an OAuth consent: the Place Publishing API
// (POST apis.roblox.com/universes/v1/{universeId}/places/{placeId}/versions?versionType=Published, scope
// universe-places:write) accepts API keys only (its reference lists "Auth: API Key"), so the real flow that can publish
// a place is a key the owner creates with Access Permissions on the experience. The card shows the real field names
// (Name, Access Permissions, the API systems universe-places and universe, the experience, the Write operation) and
// the real button wording "Save & Generate key"; the pointer presses it within a second, and it dims. No Roblox logo
// anywhere (Roblox's Name and Logo guidelines do not permit general use of the logo): the app tile is the plain word.
// Then the sibling's connect-card grammar: a checklist card ("Connected as TidewickDev", "Built the place file with
// Rojo", "Published version 214 to Lantern Bay Tycoon", "Servers restarted onto version 214": Open Cloud's
// universes/{id}:restartServers) ticks in turn, with a mini window under it; the card holds and the window opens into
// a SUPERBOT FRAME (policy: never a full-bleed native page): a superbot label bar above a framed, margined window, the
// thread dimmed behind. In the window, the experience's start place in Creator Hub as its owner sees it, in the
// anatomy of Roblox's own docs screenshots (left nav with the experience tile, breadcrumb, header with the icon, name,
// "Public" and "Start place", and the Version History list in the grammar of the docs' Version History screenshot:
// a v-number chip, the version notes, "author ▪ Published", the previous one "Previously Published"). The list settles
// with v213 on top; then THE bold moment (the chime, window.__AD_MARKS.chime): v214 slides in on top, published by
// TidewickDev, takes "Published", and v213 becomes "Previously Published". The camera pushes in on the list inside the
// frame, and a small static superbot status card (text only, no buttons) settles over the frame's corner. Every
// Creator Hub control (Restore, menus, filters, Add notes, Edit in Studio) is omitted; no dates or times are shown.
// One Creator Hub client, on a layer in the scene root (outside the camera), laid out once at a design size and scaled
// to the layer, so the mini window and the framed window are the same pixels at two sizes. Pure function of t.
import { lerp, seg, outCubic, outQuint, inOutCubic, streamCount, press } from '../../../lib.js';
import { lc } from './lucide-icons.js?v=dfb32441';

export const EXP = 'Lantern Bay Tycoon';      // checked: no experience of this exact name (research/collisions.txt)
export const USER = 'TidewickDev';            // checked: users.roblox.com returns no such user
const KEY_NAME = 'SUPERBOT_PLACE_PUBLISHING';
const SAY = 'Publishing it to Lantern Bay Tycoon from your Roblox account.';
const img = (f) => new URL('../img/' + f, import.meta.url).href;
// the API key's access permissions: [API system, operation]
const PERMS = [['universe-places', 'Write'], ['universe', 'Write']];
const STEPS = [
  ['avatar', `Connected as <b>${USER}</b>`],
  ['hammer', 'Built the place file with Rojo'],
  ['upload', `Published version 214 to ${EXP}`],
  ['rotate-cw', 'Servers restarted onto version 214'],
];
// the version list: [version, notes or null (an auto save), state]
const NEW = ['214', 'Fix lost saves: load retries and a session lock', 'Published'];
const OLD = [
  ['213', 'Weekly shop refresh and new pier upgrades', 'Published'],
  ['212', null, ''],
  ['211', 'Leaderboard polish', 'Previously Published'],
  ['210', null, ''],
  ['209', 'Harbor crane tiers', 'Previously Published'],
];
const NAV = [['house', 'Overview'], ['chart-line', 'Analytics'], ['users', 'Audience'], ['package', 'Monetization']];
const CONF = [['settings', 'Basic Info'], ['layers', 'Places', true], ['server', 'Server Management'], ['shield-check', 'Permissions']];
const STATUS = ['Saves retry and never load blank', 'Session lock stops stale overwrites', '42 of 42 tests passing'];

const APP_SCALE = { wide: 1.15, tall: 1.2 };    // framed window: the client's px to frame px
// the superbot frame the window opens into: margins and the label bar above it (frame px)
const FRAME = { wide: { pad: 44, top: 112, bar: 44 }, tall: { pad: 22, top: 100, bar: 40 } };
// timing (seconds from the reply start, or from the card where noted)
const CPS = 80;                                 // the reply line streams (the sibling's finale beat)
const CARD_AT = 0.25;                           // the line streams, then the key card lands
const CARD_IN = 0.3;                            // a card rising into the thread
const TAP_AT = 0.75; /* deliberate */           // the key card landed to the press (policy: within about 1 s)
const PTR_IN = 0.3;                             // the key card landed to the pointer appearing
const PTR_MOVE = 0.38;                          // the pointer's travel onto the button, ending just before the press
const LIST_AT = 0.25;                           // the press to the checklist card landing
const CHECK_AT = 0.3;                           // the checklist landing to the first check
const CHECK_STAGGER = 0.14;                     // one check to the next
const POP = 0.16;                               // a check popping in
const CARD_HOLD = 0.3; /* deliberate */         // the last check in, the card holds before it opens
const GROW = 0.45; /* deliberate */             // the window opens into the superbot frame
const LAND_AT = 0.55; /* deliberate */          // framed and settled (v213 on top) to v214 landing: the chime
const LAND_IN = 0.42;                           // v214's row opening and rising in
const SWAP = 0.36;                              // v213's state label changing over
const PUSH_IN = 0.6; /* deliberate */           // the camera push on the list, outQuint, from the landing
const PUSH = { wide: 1.28, tall: 1.25 };        // ...to this many times the framed scale
// the status card (frame px): wide, beside the pushed list at the window's lower right; tall, across the window's foot.
// `m` is its inner padding to the frame border, `gap` the space between the pushed list and the card (wide).
const CARD2 = { wide: { w: 560, m: 32, gap: 32 }, tall: { m: 28 } };
// the push anchors (frame px): where the page's main column's top left goes when pushed in
const ANCHOR = { wide: { x: 18, y: 14 }, tall: { y: 10 } };
const CARD2_AT = 0.75; /* deliberate */         // the landing to the status card rising
const CARD2_IN = 0.36;                          // the status card rising
const READ = 1.7; /* deliberate */              // the final state holds, readable, before the scene's fade
const RADIUS = 10;                              // the window's radius

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const CHECK = '<svg class="gk-ck" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD_AT;                              // the key card lands
    T.tap = T.card + TAP_AT;                           // Save & Generate key is pressed
    T.list = T.tap + LIST_AT;                          // the checklist card lands, the mini window in it
    T.ok = STEPS.map((_, i) => T.list + CHECK_AT + i * CHECK_STAGGER);
    T.grow = T.ok[STEPS.length - 1] + POP + CARD_HOLD; // the window starts opening
    T.full = T.grow + GROW;                            // framed
    T.land = T.full + LAND_AT;                         // v214 lands (the chime)
    T.card2 = T.land + CARD2_AT;                       // the status card rises
    T.settle = Math.max(T.land + PUSH_IN, T.card2 + CARD2_IN);
    T.end = T.settle + READ;
    return T;
  },
  build(k, x) {
    const T = k.T;
    // the renderer reads the chime mark from here (scene-local time; the tabs scene starts the spot at 0)
    window.__AD_MARKS = Object.assign(window.__AD_MARKS || {}, { chime: T.land });
    const icon = (cls = '') => `<img class="rb-ico ${cls}" src="${img('tycoon-icon.png')}" alt=""/>`;
    const avatar = (cls = '') => `<img class="rb-av ${cls}" src="${img('avatar.png')}" alt=""/>`;

    // ---- the Create API Key card in the chat (Creator Hub, dark) ----
    const say = x.el(`<div class="qc-say rk-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const key = x.el(`<div class="rk-card">
      <div class="rk-h">Create API Key</div>
      <div class="rk-sec">General Information</div>
      <div class="rk-lab">Name</div>
      <div class="rk-in">${KEY_NAME}</div>
      <div class="rk-sec">Access Permissions</div>
      <div class="rk-tbl">
        <div class="rk-tr rk-th"><span>API System</span><span>Experience</span><span>Operations</span></div>
        ${PERMS.map(([sys, op]) => `<div class="rk-tr"><span><code>${sys}</code></span><span class="rk-exp">${icon('rk-ei')}${esc(EXP)}</span><span>${op}</span></div>`).join('')}
      </div>
      <div class="rk-btns"><span class="rk-go">Save &amp; Generate key</span></div>
    </div>`);
    const go = key.querySelector('.rk-go');

    // ---- the checklist card ----
    const stepIcon = (kind) => (kind === 'avatar' ? `<span class="gk-ic gk-av">${avatar()}</span>` : `<span class="gk-ic gk-oc">${lc(kind)}</span>`);
    const card = x.el(`<div class="gk-card">
      ${STEPS.map(([kind, txt]) => `<div class="gk-step">${stepIcon(kind)}<span class="gk-tx">${txt}</span><span class="gk-ok"><i class="gk-spin"></i>${CHECK}</span></div>`).join('')}
      <div class="gk-shot"></div>
    </div>`);
    const shot = card.querySelector('.gk-shot');
    const checks = [...card.querySelectorAll('.gk-ok')].map((n) => ({ spin: n.querySelector('.gk-spin'), ck: n.querySelector('.gk-ck') }));

    // ---- the superbot frame: a scrim over the thread, the label bar, the framed window, the status card ----
    const scrim = x.el('<div class="rb-scrim" aria-hidden="true"></div>');
    const bar = x.el(`<div class="rb-bar" aria-hidden="true"><img class="rb-sb" src="${x.sbSrc}" alt=""/><b>superbot</b><span>Roblox Creator Hub, signed in as ${USER}</span></div>`);
    const row = ([v, notes, st], cls = '') => `<div class="rb-v ${cls}"><span class="rb-chip">v${v}</span><div class="rb-vm">
        ${notes ? `<b class="rb-vt">${esc(notes)}</b>` : ''}
        <span class="rb-meta">${notes ? `<span>${USER}</span>` : '<span>&lt;Auto save&gt;</span>'}${st ? `<i class="rb-dot"></i><span class="rb-st">${st}</span>` : ''}</span></div></div>`;
    const layer = x.el(`<div class="rb-full" aria-hidden="true"><div class="rb-app">
      <header class="rb-top"><b class="rb-brand">Creator Hub</b><span class="rb-tn rb-wide"><span class="rb-on">Dashboard</span><span>Learn</span><span>Store</span><span>Forum</span></span>
        <span class="rb-tr">${lc('bell', 'rb-bell')}${avatar('rb-me')}</span></header>
      <div class="rb-body">
        <nav class="rb-nav">
          <div class="rb-ng">${icon('rb-ni')}<b>${esc(EXP)}</b></div>
          ${NAV.map(([ic, l]) => `<span class="rb-nv">${lc(ic)}${l}</span>`).join('')}
          <div class="rb-ns">CONFIGURE</div>
          ${CONF.map(([ic, l, on]) => `<span class="rb-nv${on ? ' rb-nv-on' : ''}">${lc(ic)}${l}</span>`).join('')}
        </nav>
        <main class="rb-main">
          <div class="rb-crumb">Creations<i>/</i>${esc(EXP)}<i>/</i>Places<i>/</i>${esc(EXP)}</div>
          <div class="rb-head">${icon('rb-hi')}<div><h1>${esc(EXP)}</h1><p><span class="rb-pub">Public</span><span class="rb-star">${lc('star')}Start place</span></p></div></div>
          <h2 class="rb-h2">Version History</h2>
          <div class="rb-list">
            <div class="rb-slot">${row(NEW, 'rb-new')}</div>
            ${OLD.map((o, i) => row(o, i === 0 ? 'rb-prev' : i === OLD.length - 1 ? 'rb-wide' : '')).join('')}
          </div>
        </main>
      </div>
    </div></div>`);
    const status = x.el(`<div class="rb-card2" aria-hidden="true">
      <div class="rb-c2h"><img class="rb-sb" src="${x.sbSrc}" alt=""/><b>Version 214 is live on ${esc(EXP)}</b></div>
      ${STATUS.map((s) => `<div class="rb-c2r">${lc('circle-check')}<span>${esc(s)}</span></div>`).join('')}
    </div>`);
    x.root.append(scrim, layer, bar, status);
    const app = layer.firstElementChild;
    const $ = (s) => layer.querySelector(s);
    const nav = $('.rb-nav'), slot = $('.rb-slot'), vNew = $('.rb-new'), prevSt = $('.rb-prev .rb-st'), main = $('.rb-main'), head = $('.rb-head');
    const list = $('.rb-list');

    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, geo = '', slotH = '', prevTx = '', listW = '', tall = false, F = null;
    let AW = 1600, AH = 900, padL = 0, padR = 0, WL = 0;
    const setListW = (w) => { if (w !== listW) { list.style.width = w; listW = w; } };

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
      app.classList.toggle('rb-narrow', tall);
      shot.style.aspectRatio = `${F.w} / ${F.h}`;
      card.classList.toggle('gk-tall', tall);
      key.classList.toggle('rk-tall', tall);
      status.classList.toggle('rb-c2-tall', tall);
      bar.style.left = `${F.x}px`; bar.style.width = `${F.w}px`;
      bar.style.top = `${F.y - f.bar - 12}px`; bar.style.height = `${f.bar}px`;
      slotH = '';
      const cs = getComputedStyle(main);
      padL = parseFloat(cs.paddingLeft) || 0; padR = parseFloat(cs.paddingRight) || 0;
      // wide: the list keeps one width (app px) chosen so that, pushed in, its right edge ends a gap short of the status
      // card; framed and unpushed it ends at nearly the same place, so the push reads as a pure camera move
      if (!tall) {
        const c = CARD2.wide, ks1 = s * PUSH.wide;
        WL = Math.floor((F.w - c.m - c.w - c.gap - ANCHOR.wide.x) / ks1 - padL);
        setListW(`${WL}px`);
      } else setListW('');
    };

    // the pointer: in the chat, onto Save & Generate key and a press, then away
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
      nodes: [say, key, card],
      marks: [[T.r, say], [T.card, key], [T.list, card]],
      pointer: ptr,
      render(t) {
        layout();
        const n = streamCount(SAY, T.r + 0.05, CPS, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        const ci = outCubic(seg(t, T.card, T.card + CARD_IN));
        key.style.opacity = ci.toFixed(3);
        key.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px)`;
        // Save & Generate key: the press, then it dims (it is never left on screen as a live control)
        const pr = press(t, T.tap);
        go.style.transform = pr ? `scale(${(1 - 0.06 * pr).toFixed(4)})` : 'none';
        go.classList.toggle('rk-hit', t >= T.tap + 0.1);

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

        // v214 lands: its row opens at the top of the list and rises in; v213 changes over to Previously Published
        const g = inOutCubic(seg(t, T.land, T.land + LAND_IN));
        const h = vNew.offsetHeight;
        const sh = g >= 1 ? 'auto' : `${(h * g).toFixed(2)}px`;
        if (sh !== slotH) { slot.style.height = sh; slotH = sh; }
        const o = outCubic(seg(t, T.land + LAND_IN * 0.25, T.land + LAND_IN));
        vNew.style.opacity = o.toFixed(3);
        vNew.style.transform = o >= 1 ? 'none' : `translateY(${((1 - o) * -10).toFixed(2)}px)`;
        vNew.classList.toggle('rb-hl', t >= T.land);
        const sw = seg(t, T.land + 0.1, T.land + 0.1 + SWAP);
        const tx = sw >= 0.5 ? 'Previously Published' : 'Published';
        if (tx !== prevTx) { prevSt.textContent = tx; prevTx = tx; }
        prevSt.style.opacity = (1 - Math.sin(Math.PI * sw)).toFixed(3);

        // the status card: settles in once (a small scale-up anchored on its foot, so it never leaves its padded place
        // inside the frame), then holds still (static, text only)
        const c2 = outCubic(seg(t, T.card2, T.card2 + CARD2_IN));
        status.style.opacity = c2.toFixed(3);
        status.style.transform = c2 >= 1 ? 'none' : `scale(${lerp(0.95, 1, c2).toFixed(4)})`;
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
          // the push: the page header and the list, anchored on the header's top left, at PUSH x the framed scale
          const ar = app.getBoundingClientRect(), k = ar.width / AW;
          const hr = head.getBoundingClientRect(), mr = main.getBoundingClientRect();
          const hx = (mr.left - ar.left) / k, hy = (hr.top - ar.top) / k;
          const ks1 = k0 * (tall ? PUSH.tall : PUSH.wide), ks = lerp(k0, ks1, z);
          // tall: the list's right edge holds where the framed page puts it (the main column's right padding inside the
          // frame), and its left edge is pushed to the same inset, so the panel never runs past the frame
          const R = k0 * (AW - padR);
          const x0 = tall ? (Wd - R) - ks1 * padL : ANCHOR.wide.x, y0 = tall ? ANCHOR.tall.y : ANCHOR.wide.y;
          const px = lerp(k0 * hx, x0, z), py = lerp(k0 * hy, y0, z);
          if (tall) setListW(`${((R - px) / ks - padL).toFixed(2)}px`);
          app.style.transform = `translate(${(px - ks * hx).toFixed(2)}px, ${(py - ks * hy).toFixed(2)}px) scale(${ks.toFixed(5)})`;
        } else {
          if (tall) setListW('');
          app.style.transform = `scale(${k0.toFixed(5)})`;
        }
        // while the window still sits in the chat it is clipped to the thread's viewport
        const feed = card.closest('.feed');
        const fb = feed ? x.box(feed) : null;
        const cutT = fb ? Math.max(0, fb.y - Tp) * (1 - g) : 0, cutB = fb ? Math.max(0, Tp + Ht - (fb.y + fb.h)) * (1 - g) : 0;
        layer.style.clipPath = cutT > 0.01 || cutB > 0.01 ? `inset(${cutT.toFixed(2)}px 0 ${cutB.toFixed(2)}px 0 round ${rad.toFixed(2)}px)` : '';
        layer.style.opacity = card.style.opacity;
        scrim.style.opacity = g.toFixed(3);
        // the left nav steps out of the pushed-in view (its edge would otherwise sit on the window's margin)
        nav.style.opacity = (1 - z).toFixed(3);
        bar.style.opacity = outCubic(seg(t, T.grow + GROW * 0.5, T.full + 0.15)).toFixed(3);
        // the status card, inside the frame with clear padding: wide, beside the pushed list at the window's lower right;
        // tall, across the window's foot, under the list
        const foot = x.root.offsetHeight - (F.y + F.h);
        if (tall) { const m = CARD2.tall.m; status.style.left = `${F.x + m}px`; status.style.width = `${F.w - 2 * m}px`; status.style.top = ''; status.style.bottom = `${foot + m}px`; }
        else { const c = CARD2.wide; status.style.left = `${F.x + F.w - c.w - c.m}px`; status.style.width = `${c.w}px`; status.style.bottom = `${foot + c.m}px`; }
      },
    };
  },
};
