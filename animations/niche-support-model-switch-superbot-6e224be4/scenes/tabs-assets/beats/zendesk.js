// Zendesk beat, the finale: superbot works the queue from the user's own Zendesk. Its line streams and Zendesk's OAuth
// authorization page lands in the chat as a card, light (https://trailkit.zendesk.com/oauth/authorizations/new): the
// page's address, superbot's tile and the Zendesk mark joined by the dotted connector, the app's name, the request
// for the trailkit Zendesk account, the two scopes it asks for in Zendesk's own wording (read, write: Zendesk
// help "Using OAuth authentication with your application", see brand/CREDITS.txt), Deny and the primary "Allow". The
// pointer presses Allow, and the base's connect-card grammar follows: a checklist card ("Connected to
// trailkit.zendesk.com", "Sent 209 replies", "Solved 209 tickets", "Assigned 3 to Jess Ortiz", "Unassigned queue
// cleared") ticking in turn, with a mini window under it; the card holds (CARD_HOLD) and the window opens to full
// frame (GROW). Full frame is Zendesk's Agent Workspace, light: the kale product nav, the top bar (+ Add, search, the
// JO avatar), the Views list (16:9 only) and the Unassigned tickets view: title, Filter, "212 tickets", a table that
// fills the page. The rows flip one after another, quicker and quicker, to the grey Solved badge and grey out where
// they stand, the count and the views' counts ticking in step; the double-charge row instead flips to the black
// On-hold badge and is assigned to Jess Ortiz. The ONE bold moment (the chime, window.__AD_MARKS.chime): the count
// lands on 0 (the view's "0 tickets" and the Views list's "Unassigned tickets 0"), Garden's success toast lands at its
// top-end placement under the top bar ("209 tickets solved", "3 double charges assigned to you"), and the camera
// pushes in on the page (the base's PUSH, 0.5 s outQuint) toward the header, the toast and the first solved rows. The
// final state holds (READ).
//
// There is ONE Zendesk client, on a layer in the scene root (outside the camera). While the checklist card sits in the
// chat the layer is pinned over the card's window frame; GROW interpolates it to the whole frame. The client is laid
// out once at a design size (the frame divided by APP_SCALE) and scaled to the layer, so the mini window and the full
// frame are the same pixels at two sizes. On a portrait frame (4:5) it drops the Views list and keeps the status, the
// subject and the requester. Pure function of t: every moving value is written from t.
import { lerp, seg, outCubic, outQuint, inOutCubic, streamCount, press } from '../../../lib.js';
import { zdi, initials } from './zd-icons.js?v=6e224be4';

const SAY = 'Clearing the queue from your Zendesk, as you.';
const HOST = 'trailkit.zendesk.com';
const ACCOUNT = 'trailkit';
const AGENT = 'Jess Ortiz';
// letter avatars (UI furniture): initials on a Garden palette colour (@zendeskgarden/react-theming 9.16.1 PALETTE)
export const AV = { 'Dana Whitfield': '#367a74' /* teal-700 */, 'Leo Brandt': '#2770c3' /* azure-700 */, 'Jess Ortiz': '#4c67d3' /* royal-700 */ };
// the two scopes superbot asks for, in Zendesk's own wording ("The read scope gives an app access to GET endpoints",
// "The write scope gives an app access to POST, PUT, and DELETE endpoints for creating, updating, and deleting
// resources": support.zendesk.com/hc/en-us/articles/4408845965210, fetched 2026-10-03)
const SCOPES = [
  ['Read', 'Access to GET endpoints'],
  ['Write', 'Creating, updating, and deleting resources'],
];
const STEPS = [
  ['zendesk-24', `Connected to <b>${HOST}</b>`],
  ['speech-bubble-plain-stroke', 'Sent 209 replies'],
  ['check-circle-stroke', 'Solved 209 tickets'],
  ['user-solo-stroke', `Assigned 3 to <b>${AGENT}</b>`],
  ['inbox-stroke', 'Unassigned queue cleared'],
];
// the Views list: [name, count from, count to, selected]; counts animate in render
const VIEWS = [
  ['Your unsolved tickets', 0, 3],
  ['Unassigned tickets', 212, 0, true],
  ['All unsolved tickets', 212, 3],
  ['Recently updated tickets', 0, 212],
  ['Pending tickets', 0, 0],
  ['Recently solved tickets', 0, 209],
];
// the view's visible rows (enough to fill the page at both ratios): [id, subject, requester, requested, priority,
// status]; HELD_ROW is the double charge
const ROWS = [
  ['48213', 'Still no tracking for order 10482', 'Dana Whitfield', 'Oct 04, 2026', 'Normal', 'New'],
  ['48207', 'How do I return the size M jacket?', 'Leo Brandt', 'Oct 04, 2026', 'Normal', 'New'],
  ['48201', 'Password reset email never arrives', 'Aisha Rahman', 'Oct 03, 2026', 'Normal', 'New'],
  ['48198', "Where is my order? It's been 9 days", 'Tom Keller', 'Oct 03, 2026', 'High', 'Open'],
  ['48192', 'Exchange boots for a half size up', 'Grace Liu', 'Oct 03, 2026', 'Normal', 'New'],
  ['48188', 'Locked out after changing my email', 'Marco Silva', 'Oct 03, 2026', 'High', 'Open'],
  ['48185', 'Order 10377 shows delivered, not here', 'Nina Petrova', 'Oct 02, 2026', 'Normal', 'New'],
  ['48179', 'Charged twice for order 10455', 'Owen Park', 'Oct 02, 2026', 'High', 'New'],
  ['48176', 'Tracking says label created for a week', 'Hannah Moss', 'Oct 02, 2026', 'Normal', 'New'],
  ['48172', 'Can I swap the tent for the 3 person one?', 'Diego Ramos', 'Oct 02, 2026', 'Normal', 'New'],
  ['48169', "Two step code isn't coming through", 'Sofia Lindqvist', 'Oct 02, 2026', 'Normal', 'Open'],
  ['48166', 'Package stuck in transit since Friday', 'Ben Okafor', 'Oct 02, 2026', 'Normal', 'New'],
  ['48163', 'Return label link expired', 'Mei Tanaka', 'Oct 02, 2026', 'Normal', 'New'],
  ['48160', 'Account locked after too many tries', 'Liam Novak', 'Oct 02, 2026', 'High', 'New'],
];
const HELD_ROW = 7;
// the flip order: the solved rows top to bottom, then the double charge last
const ORDER = [...ROWS.keys()].filter((i) => i !== HELD_ROW).concat(HELD_ROW);
const TOTAL = 212, SOLVED = 209, HELD = 3;
const NOTE = { title: '209 tickets solved', body: '3 double charges assigned to you' };

const APP_SCALE = { wide: 1.4, tall: 1.35 };     // full frame: the client's px to frame px (wide: the view fills the frame)
// timing (seconds from the reply start, or from the card where noted)
const CPS = 80;                                 // the reply line streams (the base's finale beat)
const CARD_AT = 0.25;                           // the line streams, then the authorization card lands
const CARD_IN = 0.3;                            // a card rising into the thread
const TAP_AT = 0.7; /* deliberate */           // the card landed to the press on Allow (it reads first)
const PTR_IN = 0.3;                             // the card landed to the pointer appearing
const PTR_MOVE = 0.38;                          // the pointer's travel onto the button, ending just before the press
const LIST_AT = 0.25;                           // the press to the checklist card landing
const CHECK_AT = 0.3;                           // the checklist landing to the first check
const CHECK_STAGGER = 0.12;                     // one check to the next
const POP = 0.16;                               // a check popping in
const CARD_HOLD = 0.3; /* deliberate */         // the last check in, the card holds before it opens
const GROW = 0.4; /* deliberate */              // the window opens to full frame
const CAS_AT = 0.3; /* deliberate */            // full frame to the first row flipping (the view reads first)
const CAS_GAPS = [0.2, 0.16, 0.13, 0.11, 0.09, 0.08, 0.07, 0.06, 0.06, 0.05, 0.05, 0.05]; /* deliberate */ // quicker and quicker
const FLIP = 0.14;                              // a badge giving way to the next one
const TICK = 0.25;                              // a flip's share of the count ticking off
const HOLD_AT = 0.3; /* deliberate */           // the last solved row's flip to the double charge flipping to On-hold
const LAND = 0.3; /* deliberate */              // the On-hold flip (assigned to Jess Ortiz) to the count landing on 0
const NOTE_IN = 0.36;                           // the success toast landing (with the count on 0: the chime)
const PUSH_IN = 0.5; /* deliberate */           // chat.js PUSH: the payoff push, outQuint, from the landing
// the payoff push, per orientation: the scale over the full frame and the design-px x the frame's left edge lands on
// (the product nav leaves the frame; the Views list, the header, the toast and the first rows stay whole)
const PUSH = { wide: { s: 1.13, x0: 72 }, tall: { s: 1.1, x0: 52 } };
// what the pushed frame would only half show leaves it with the push (as the base's sidebar does): the top bar's tools
// wherever they would cross the pushed frame's right edge, and the view's Actions and Play, which sit under the toast
const EDGE = '.zd-tools > *, .zd-play, .zd-act';
const UNDER_TOAST = '.zd-play, .zd-act';
const READ = 1.3; /* deliberate */              // the final state holds, readable, before the scene's fade
const RADIUS = 4;                               // the card's window radius (Garden md), eased to 0 at full frame

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const CHECK = '<svg class="gk-ck" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const badge = (s) => `<i class="zd-b zd-b-${s.toLowerCase().replace(/[^a-z]/g, '')}">${s}</i>`;

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD_AT;                              // the authorization card lands
    T.tap = T.card + TAP_AT;                           // Allow is pressed
    T.list = T.tap + LIST_AT;                          // the checklist card lands, the mini window in it
    T.ok = STEPS.map((_, i) => T.list + CHECK_AT + i * CHECK_STAGGER);
    T.grow = T.ok[STEPS.length - 1] + POP + CARD_HOLD; // the window starts opening
    T.full = T.grow + GROW;                            // full frame
    // the solved rows flip in ORDER, quicker and quicker; the double charge flips to On-hold after them. T.flip is
    // indexed by row
    const seq = [T.full + CAS_AT];
    CAS_GAPS.forEach((g) => seq.push(seq[seq.length - 1] + g));
    seq.push(seq[seq.length - 1] + HOLD_AT);
    T.flip = [];
    ORDER.forEach((row, j) => { T.flip[row] = seq[j]; });
    T.solvedEnd = seq[seq.length - 2] + TICK;          // the last solved row counted: 3 left in the view
    T.zero = T.flip[HELD_ROW] + LAND;                  // assigned to Jess Ortiz: the count lands on 0 (the chime)
    T.settle = T.zero + Math.max(NOTE_IN, PUSH_IN);
    T.end = T.settle + READ;
    return T;
  },
  build(k, x) {
    const T = k.T;
    // the renderer reads the chime mark from here (scene-local time; the tabs scene starts the spot at 0)
    window.__AD_MARKS = Object.assign(window.__AD_MARKS || {}, { chime: T.zero });
    const zdTile = (cls) => `<span class="za-zd ${cls}">${zdi('zendesk-24')}</span>`;

    // ---- the authorization card in the chat (Zendesk's OAuth authorization page, light) ----
    const say = x.el(`<div class="qc-say za-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const consent = x.el(`<div class="za-card">
      <div class="za-url">${HOST}/oauth/authorizations/new</div>
      <div class="za-in">
        <div class="za-logos">${x.tile('superbot', 'za-sb')}<i class="za-dots"></i>${zdTile('')}</div>
        <div class="za-title"><b>superbot</b></div>
        <div class="za-ask"><b>superbot</b> is requesting access to<br/>your <b>${ACCOUNT}</b> Zendesk account</div>
        <div class="za-box">${SCOPES.map(([title, sub]) => `<div class="za-row">${zdi('check-sm-stroke', 'za-ri')}<span><b>${esc(title)}</b><small>${esc(sub)}</small></span></div>`).join('')}</div>
        <div class="za-btns"><span class="za-b za-deny">Deny</span><span class="za-b za-go">Allow</span></div>
      </div>
    </div>`);
    const go = consent.querySelector('.za-go');

    // ---- the checklist card (superbot's own, in the hub's greys) ----
    const card = x.el(`<div class="gk-card">
      ${STEPS.map(([ic, txt]) => `<div class="gk-step"><span class="gk-ic${ic === 'zendesk-24' ? ' gk-zd' : ''}">${zdi(ic)}</span><span class="gk-tx">${txt}</span><span class="gk-ok"><i class="gk-spin"></i>${CHECK}</span></div>`).join('')}
      <div class="gk-shot"></div>
    </div>`);
    const shot = card.querySelector('.gk-shot');
    const checks = [...card.querySelectorAll('.gk-ok')].map((n) => ({ spin: n.querySelector('.gk-spin'), ck: n.querySelector('.gk-ck') }));

    // ---- the full-frame Zendesk client: Agent Workspace, the Unassigned tickets view ----
    const rowHtml = ([id, subj, who, when, prio, st]) => `<div class="zd-tr"><div class="zd-tri">
      <span class="zd-c zd-cb"><i></i></span>
      <span class="zd-c zd-cst"><span class="zd-bs">${badge(st)}${badge('Solved')}${badge('On-hold')}</span></span>
      <span class="zd-c zd-cid">#${id}</span>
      <span class="zd-c zd-csub">${esc(subj)}</span>
      <span class="zd-c zd-creq">${esc(who)}</span>
      <span class="zd-c zd-cwhen">${when}</span>
      <span class="zd-c zd-cpri">${prio}</span>
      <span class="zd-c zd-casg"><span class="zd-a0">-</span><span class="zd-a1">${AGENT}</span></span>
    </div></div>`;
    const sortI = zdi('sort-stroke', 'zd-sort');
    const layer = x.el(`<div class="zd-full" aria-hidden="true"><div class="zd-app">
      <nav class="zd-nav">
        <span class="zd-logo">${zdi('zendesk-24')}</span>
        <span class="zd-nb">${zdi('home-fill')}</span>
        <span class="zd-nb zd-on">${zdi('inbox-fill')}</span>
        <span class="zd-nb">${zdi('user-group-fill')}</span>
        <span class="zd-nb">${zdi('building-fill')}</span>
        <span class="zd-nb">${zdi('bar-chart-fill')}</span>
        <span class="zd-nb">${zdi('gear-fill')}</span>
      </nav>
      <div class="zd-body">
        <header class="zd-top">
          <span class="zd-add">${zdi('plus-stroke')}Add</span>
          <span class="zd-tools">
            <span class="zd-ib">${zdi('search-stroke')}</span>
            <span class="zd-ib zd-wide">${zdi('grid-3x3-fill')}</span>
            <span class="zd-ib zd-wide">${zdi('notification-fill')}</span>
            <i class="zd-av" style="background:${AV[AGENT]}">${initials(AGENT)}</i>
          </span>
        </header>
        <div class="zd-cols">
          <aside class="zd-views">
            <div class="zd-vh"><b>Views</b><span class="zd-vhi">${zdi('plus-circle-stroke')}${zdi('reload-stroke')}</span></div>
            <div class="zd-vsec"><b>Shared</b>${zdi('chevron-up-stroke')}</div>
            ${VIEWS.map(([name, , , on]) => `<div class="zd-vr${on ? ' zd-von' : ''}"><span>${esc(name)}</span><b class="zd-vn">0</b></div>`).join('')}
          </aside>
          <main class="zd-main">
            <div class="zd-mh"><h1>Unassigned tickets</h1><span class="zd-act">Actions${zdi('chevron-down-stroke')}</span><span class="zd-play zd-wide">${zdi('play-circle-stroke')}Play</span></div>
            <div class="zd-fl"><span class="zd-fb">${zdi('filter-stroke')}Filter</span></div>
            <div class="zd-cnt"><span class="zd-n">212</span> <span class="zd-nw">tickets</span></div>
            <div class="zd-table">
              <div class="zd-th"><span class="zd-c zd-cb"><i></i></span><span class="zd-c zd-cst"></span><span class="zd-c zd-cid">ID</span><span class="zd-c zd-csub">Subject</span>
                <span class="zd-c zd-creq">Requester${sortI}</span><span class="zd-c zd-cwhen">Requested${sortI}</span><span class="zd-c zd-cpri">Priority${sortI}</span><span class="zd-c zd-casg">Assignee</span></div>
              <div class="zd-rows">${ROWS.map(rowHtml).join('')}</div>
            </div>
          </main>
        </div>
      </div>
      <div class="zd-note">
        ${zdi('check-circle-stroke', 'zd-note-i')}
        <div class="zd-note-t"><b>${NOTE.title}</b><span>${NOTE.body}</span></div>
        ${zdi('x-stroke', 'zd-note-x')}
      </div>
    </div></div>`);
    x.root.appendChild(layer);
    const app = layer.firstElementChild;
    const $ = (s) => layer.querySelector(s);
    const rows = [...layer.querySelectorAll('.zd-tr')].map((n, i) => {
      const [first, solved, hold] = [...n.querySelectorAll('.zd-b')];
      return { n, first, solved, hold, a0: n.querySelector('.zd-a0'), a1: n.querySelector('.zd-a1'), held: i === HELD_ROW };
    });
    const vns = [...layer.querySelectorAll('.zd-vn')];
    const vrs = [...layer.querySelectorAll('.zd-vr')];
    const cntN = $('.zd-n'), cntW = $('.zd-nw'), note = $('.zd-note');

    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, geo = '', feed = null, last = '';
    let AW = 1600, AH = 900, push = PUSH.wide, edgeOut = null;
    const edges = [...layer.querySelectorAll(EDGE)];

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
      app.classList.toggle('zd-narrow', tall);
      shot.style.aspectRatio = `${W} / ${H}`;
      card.classList.toggle('gk-tall', tall);
      consent.classList.toggle('za-tall', tall);
      push = tall ? PUSH.tall : PUSH.wide;
      edgeOut = null;
    };

    // the pointer: in the chat, onto Allow and a press, then away
    const ptr = (t) => {
      if (t >= T.card + PTR_IN && t <= T.tap + 0.45) {
        const a = T.card + PTR_IN, b = T.tap - 0.08;
        const g = x.box(go);
        if (!g.w) return null;
        const ex = g.x + g.w * 0.55, ey = g.y + g.h * 0.6;
        const m = inOutCubic(seg(t, a, Math.min(a + PTR_MOVE, b)));
        const leave = outCubic(seg(t, T.tap + 0.2, T.tap + 0.45));
        return { x: lerp(ex + 150, ex, m) + leave * 40, y: lerp(ey + 110, ey, m) + leave * 30, p: press(t, T.tap), v: seg(t, a, a + 0.12) * (1 - leave) };
      }
      return null;
    };

    // the solved share at t: each solved row ticks its share off the count as it flips
    const solvedAt = (t) => rows.reduce((acc, o, i) => (o.held ? acc : acc + inOutCubic(seg(t, T.flip[i], T.flip[i] + TICK))), 0) / (ROWS.length - 1);

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
        // Allow: the press, then it stays in its pressed (active) tone
        const pr = press(t, T.tap);
        go.style.transform = pr ? `scale(${(1 - 0.06 * pr).toFixed(4)})` : 'none';
        go.classList.toggle('za-hit', t >= T.tap);

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

        // the rows: the badge flips (Solved, or On-hold for the double charge); a solved row greys out where it stands
        rows.forEach((o, i) => {
          // out, then in: the two labels never sit on top of each other
          o.first.style.opacity = (1 - outCubic(seg(t, T.flip[i], T.flip[i] + FLIP / 2))).toFixed(3);
          (o.held ? o.hold : o.solved).style.opacity = outCubic(seg(t, T.flip[i] + FLIP / 2, T.flip[i] + FLIP)).toFixed(3);
          if (o.held) {
            o.a0.style.opacity = (1 - outCubic(seg(t, T.flip[i] + 0.1, T.flip[i] + 0.1 + FLIP / 2))).toFixed(3);
            o.a1.style.opacity = outCubic(seg(t, T.flip[i] + 0.1 + FLIP / 2, T.flip[i] + 0.1 + FLIP)).toFixed(3);
          }
          o.n.classList.toggle('zd-done', !o.held && t >= T.flip[i] + FLIP * 0.5);
        });

        // the counts, in step: the view's count, and every view in the list
        const sv = solvedAt(t);
        const heldIn = outCubic(seg(t, T.flip[HELD_ROW] + 0.1, T.zero));
        const solved = Math.round(SOLVED * sv);
        const count = t >= T.zero ? 0 : Math.max(0, TOTAL - solved - Math.round(HELD * heldIn));
        const values = [Math.round(HELD * heldIn), count, TOTAL - solved, solved + Math.round(HELD * heldIn), 0, solved];
        const key = `${count}|${values.join(',')}`;
        if (key !== last) {
          cntN.textContent = String(count);
          cntW.textContent = count === 1 ? 'ticket' : 'tickets';
          values.forEach((v, i) => { vns[i].textContent = String(v); vrs[i].classList.toggle('zd-vz', v === 0 && !VIEWS[i][3]); });
          last = key;
        }

        // the bold moment: the count on 0 and Garden's success toast lands at top-end, dropping in under the top bar
        const z = outCubic(seg(t, T.zero, T.zero + NOTE_IN));
        note.style.opacity = z.toFixed(3);
        note.style.transform = z >= 1 ? 'none' : `translateY(${(-16 * (1 - z)).toFixed(2)}px)`;
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
        const k0 = Wd / AW;
        // the payoff push: from the landing, the frame closes in on the header, the toast and the first rows
        const pz = g >= 1 ? outQuint(seg(t, T.zero, T.zero + PUSH_IN)) : 0;
        const ks = k0 * lerp(1, push.s, pz);
        app.style.transform = pz > 0 ? `translate(${(-ks * push.x0 * pz).toFixed(2)}px, 0px) scale(${ks.toFixed(5)})` : `scale(${k0.toFixed(5)})`;
        if (g >= 1 && !edgeOut) {
          // in design px: the pushed frame's right edge is x0 + AW / s; anything whose right edge passes it fades out
          const ar = app.getBoundingClientRect(), k = ar.width / AW, right = push.x0 + AW / push.s;
          edgeOut = edges.filter((n) => n.matches(UNDER_TOAST) || (n.getBoundingClientRect().right - ar.left) / k > right - 2);
        }
        edges.forEach((n) => { n.style.opacity = edgeOut && edgeOut.includes(n) ? (1 - pz).toFixed(3) : ''; });
        const fb = feed ? x.box(feed) : null;
        const cutT = fb ? Math.max(0, fb.y - Tp) * (1 - g) : 0, cutB = fb ? Math.max(0, Tp + Ht - (fb.y + fb.h)) * (1 - g) : 0;
        layer.style.clipPath = cutT > 0.01 || cutB > 0.01 ? `inset(${cutT.toFixed(2)}px 0 ${cutB.toFixed(2)}px 0 round ${(RADIUS * s * (1 - g)).toFixed(2)}px)` : '';
        layer.style.opacity = card.style.opacity;
      },
    };
  },
};
