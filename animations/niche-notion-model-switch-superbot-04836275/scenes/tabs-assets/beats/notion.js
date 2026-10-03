// Notion beat, the finale: superbot builds the tracker in the user's own Notion. Its line streams and Notion's
// public-connection authorization prompt lands in the chat as a card, light (developers.notion.com, "Authorization":
// the prompt "describes the connection capabilities, presented to the user as what the connection would like to be
// able to do in the workspace", with Cancel and Select pages; then the page picker with Back and Allow access; see
// brand/CREDITS.txt). The card follows the docs' own screenshots: the Notion mark and the workspace switcher in the
// header, superbot's tile and the Notion mark joined by the dotted connector, "superbot wants to access Pinecrest
// Studio", "superbot wants to" and the three capability lines in the prompt's own wording, Cancel and the blue
// "Select pages". The pointer presses Select pages; the picker takes the card's place ("Allow superbot to access these
// pages", the search box, the Shared pages with Meeting notes and Launch tracker ticking) and the pointer presses
// "Allow access". The base's connect-card grammar follows: a checklist card ("Connected to Pinecrest Studio", "Created
// the Launch tracker database", "Added 12 tasks", "Set 12 owners and 12 due dates") ticking in turn, with a mini
// window under it; the card holds (CARD_HOLD) and the window opens to full frame (GROW). Full frame is the Notion web
// app, light: the sidebar (16:9 only: the workspace switcher, Search, Home, Meetings, Notion AI, Inbox, Library, the
// Shared pages with Launch tracker selected), the top bar (the breadcrumb, Share, the page icons) and the Launch
// tracker full-page database in Board view grouped by the person property Owner: No Owner, Priya Shah, Marcus Lee,
// Elena Ruiz. It opens with all 12 cards in No Owner (title and status only: Notion hides empty properties on a card),
// then the cards leave No Owner one after another, quicker and quicker, and settle into their owner's column in due
// date order, each card's Due date appearing as it lands; the counts tick in step (No Owner 12 to 0, each owner 0 to
// 4). The ONE bold moment (the chime, window.__AD_MARKS.chime): the last card lands, No Owner lands on 0 (its column
// empty except Notion's own "+ New page" row) and the camera pushes in on the column headers. No toast: no source of
// record shows Notion raising one for a property change. The final state holds (READ).
//
// There is ONE Notion client, on a layer in the scene root (outside the camera). While the checklist card sits in the
// chat the layer is pinned over the card's window frame; GROW interpolates it to the whole frame. The client is laid
// out once at a design size (the frame divided by APP_SCALE) and scaled to the layer, so the mini window and the full
// frame are the same pixels at two sizes. On a portrait frame (4:5) it drops the sidebar and takes Small cards. Pure
// function of t: every moving value is written from t (the card positions are closed-form in t from the cascade's
// times and the heights measured once per frame size).
import { lerp, seg, outCubic, outQuint, inOutCubic, streamCount, press } from '../../../lib.js';
import { ni, initials } from './notion-icons.js?v=04836275';

const SAY = 'Building the tracker in your Notion, as you.';
const WORKSPACE = 'Pinecrest Studio';
const DB = 'Launch tracker';
const DESC = '12 tasks from 3 meetings, each with an owner and a due date';
// the prompt's capability lines, in its own wording (the docs' screenshot of the standard prompt)
const CAPS = [
  ['pencil', 'View and edit pages you select'],
  ['plus', `Add new pages to ${WORKSPACE}`],
  ['users', 'View names and emails'],
];
// the page picker: [icon, page, ticked]
const PAGES = [
  ['file-text', 'Meeting notes', true],
  ['table-2', DB, true],
  ['file-text', 'Roadmap', false],
  ['file-text', 'Team wiki', false],
];
const STEPS = [
  ['notion', `Connected to <b>${WORKSPACE}</b>`],
  ['table-2', `Created the <b>${DB}</b> database`],
  ['plus', 'Added 12 tasks'],
  ['users', 'Set 12 owners and 12 due dates'],
];
// the board's groups, in order (Owner is a person property; the empty group is "No Owner")
const OWNERS = ['Priya Shah', 'Marcus Lee', 'Elena Ruiz'];
const EMPTY = 'No Owner';
// the 12 tasks, in due-date order (the order they leave No Owner): [title, owner, Due as Notion's default date format]
const TASKS = [
  ['Finalize launch date with sales', 'Priya Shah', 'October 6, 2026'],
  ['Fix the checkout timeout bug', 'Marcus Lee', 'October 7, 2026'],
  ['Redesign the onboarding checklist', 'Elena Ruiz', 'October 8, 2026'],
  ['Write the pricing page FAQ', 'Priya Shah', 'October 9, 2026'],
  ['Export the launch screenshots', 'Elena Ruiz', 'October 12, 2026'],
  ['Ship the CSV export', 'Marcus Lee', 'October 13, 2026'],
  ['Book the press briefing', 'Priya Shah', 'October 14, 2026'],
  ['Update the app store icon', 'Elena Ruiz', 'October 14, 2026'],
  ['Load test the signup flow', 'Marcus Lee', 'October 15, 2026'],
  ['Send beta invites to the waitlist', 'Priya Shah', 'October 16, 2026'],
  ['Set up status page alerts', 'Marcus Lee', 'October 20, 2026'],
  ['Record the 60 second demo video', 'Elena Ruiz', 'October 21, 2026'],
];
const STATUS = 'Not started';
const SIDEBAR = [['search', 'Search'], ['house', 'Home'], ['calendar-days', 'Meetings'], ['sparkles', 'Notion AI'], ['inbox', 'Inbox'], ['layout-grid', 'Library']];
const SHARED = [['file-text', 'Meeting notes'], ['table-2', DB, true], ['file-text', 'Roadmap'], ['file-text', 'Team wiki']];

const APP_SCALE = { wide: 1.3, tall: 1.05 };     // full frame: the client's px to frame px
// timing (seconds from the reply start, or from the card where noted)
const CPS = 80;                                 // the reply line streams (the base's finale beat)
const CARD_AT = 0.25;                           // the line streams, then the authorization card lands
const CARD_IN = 0.3;                            // a card rising into the thread
const SELECT_AT = 0.66; /* deliberate */       // the prompt landed to the press on Select pages (it reads first)
const PTR_IN = 0.3;                             // the card landed to the pointer appearing
const PTR_MOVE = 0.38;                          // the pointer's travel onto the button, ending just before the press
const PICK_AT = 0.1;                            // the press to the picker taking the prompt's place
const PICK_IN = 0.18;                           // the picker crossfading in
const TICK_AT = 0.16;                           // the picker in to the first page ticking
const TICK_STAGGER = 0.12;                      // one tick to the next
const ALLOW_AT = 0.5; /* deliberate */          // the picker in to the press on Allow access
const LIST_AT = 0.25;                           // the press to the checklist card landing
const CHECK_AT = 0.3;                           // the checklist landing to the first check
const CHECK_STAGGER = 0.12;                     // one check to the next
const POP = 0.16;                               // a check popping in
const CARD_HOLD = 0.3; /* deliberate */         // the last check in, the card holds before it opens
const GROW = 0.4; /* deliberate */              // the window opens to full frame
const CAS_AT = 0.3; /* deliberate */            // full frame to the first card leaving No Owner (the board reads first)
const CAS_GAPS = [0.22, 0.18, 0.15, 0.13, 0.11, 0.1, 0.09, 0.08, 0.07, 0.07, 0.06]; /* deliberate */ // quicker and quicker
const MOVE = 0.32;                              // a card's travel from No Owner to its owner's column
const DATE_IN = 0.16;                           // the Due date opening on the card as it lands
const PUSH_AT = 0.12; /* deliberate */          // the count on 0 and the last Due date open, then the payoff push starts
const PUSH_IN = 0.5; /* deliberate */           // chat.js PUSH: the payoff push, outQuint
// the payoff push, per orientation: the scale, about the column headers (the board's centre, the headers' row)
const PUSH = { wide: 1.12, tall: 1.035 };
const READ = 1.3; /* deliberate */              // the final state holds, readable, before the scene's fade
const RADIUS = 10;                              // the card's window radius (Notion's measured card radius), eased to 0
const GAP_Y = 8;                                // between two cards in a column (design px)

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const CHECK = '<svg class="gk-ck" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const BOX_CK = '<svg class="nf-ck" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const av = (who, cls = '') => `<i class="nb-av ${cls}">${initials(who)}</i>`;
const ORDER_IN = (owner) => TASKS.filter((x) => x[1] === owner);

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD_AT;                              // the authorization prompt lands
    T.select = T.card + SELECT_AT;                     // Select pages is pressed
    T.pick = T.select + PICK_AT;                       // the picker takes its place
    T.ticks = PAGES.map((p, i) => T.pick + PICK_IN + TICK_AT + i * TICK_STAGGER);
    T.tap = T.pick + PICK_IN + ALLOW_AT;               // Allow access is pressed
    T.list = T.tap + LIST_AT;                          // the checklist card lands, the mini window in it
    T.ok = STEPS.map((_, i) => T.list + CHECK_AT + i * CHECK_STAGGER);
    T.grow = T.ok[STEPS.length - 1] + POP + CARD_HOLD; // the window starts opening
    T.full = T.grow + GROW;                            // full frame
    // the cards leave No Owner in due-date order, quicker and quicker; T.flip[i] is card i's start, T.land[i] its landing
    T.flip = [T.full + CAS_AT];
    CAS_GAPS.forEach((g) => T.flip.push(T.flip[T.flip.length - 1] + g));
    T.land = T.flip.map((f) => f + MOVE);
    T.zero = T.land[TASKS.length - 1];                 // the last card lands: No Owner on 0 (the chime)
    T.push = T.zero + PUSH_AT;                         // the payoff push starts
    T.settle = T.push + PUSH_IN;
    T.end = T.settle + READ;
    return T;
  },
  build(k, x) {
    const T = k.T;
    // the renderer reads the chime mark from here (scene-local time; the tabs scene starts the spot at 0)
    window.__AD_MARKS = Object.assign(window.__AD_MARKS || {}, { chime: T.zero });
    const nTile = (cls) => `<span class="nc-nt ${cls}">${ni('notion')}</span>`;
    const ws = `<span class="nc-ws"><i class="nc-p">P</i>${esc(WORKSPACE)}${ni('chevrons-up-down', 'nc-ud')}</span>`;

    // ---- the authorization prompt in the chat, then the page picker in its place (Notion's own, light) ----
    const say = x.el(`<div class="qc-say nc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const consent = x.el(`<div class="nc-card">
      <div class="nc-top">${nTile('nc-mk')}${ws}</div>
      <div class="nc-panes">
        <div class="nc-pane nc-ask">
          <div class="nc-logos">${x.tile('superbot', 'nc-sb')}<i class="nc-dots"></i>${nTile('nc-big')}</div>
          <div class="nc-h"><u>superbot</u> wants to access<br/>${esc(WORKSPACE)}</div>
          <div class="nc-wants"><u>superbot</u> wants to</div>
          <div class="nc-caps">${CAPS.map(([ic, txt]) => `<div class="nc-cap">${ni(ic, 'nc-ci')}<span>${esc(txt)}</span>${ni('chevron-down', 'nc-cv')}</div>`).join('')}</div>
          <div class="nc-btns"><span class="nc-b nc-no">Cancel</span><span class="nc-b nc-go nc-sel">Select pages</span></div>
          <div class="nc-trust"><b>Make sure you trust superbot</b><span>If you continue, you may be sharing sensitive information.</span></div>
        </div>
        <div class="nc-pane nc-pick">
          <div class="nc-ph">Allow superbot to access these pages</div>
          <div class="nc-search">${ni('search', 'nc-si')}Search for pages in ${esc(WORKSPACE)}</div>
          <div class="nc-list">
            <div class="nc-sec"><i class="nf-box nc-bx0"></i>Shared</div>
            ${PAGES.map(([ic, name]) => `<div class="nc-pg"><i class="nf-box">${BOX_CK}</i>${ni(ic, 'nc-pi')}<span>${esc(name)}</span></div>`).join('')}
          </div>
          <div class="nc-btns"><span class="nc-b nc-no">Back</span><span class="nc-b nc-go nc-allow">Allow access</span></div>
        </div>
      </div>
    </div>`);
    const ask = consent.querySelector('.nc-ask'), pick = consent.querySelector('.nc-pick');
    const sel = consent.querySelector('.nc-sel'), allow = consent.querySelector('.nc-allow');
    const boxes = [...consent.querySelectorAll('.nc-pg .nf-box')];

    // ---- the checklist card (superbot's own, in the hub's greys) ----
    const card = x.el(`<div class="gk-card">
      ${STEPS.map(([ic, txt]) => `<div class="gk-step"><span class="gk-ic${ic === 'notion' ? ' gk-nt' : ''}">${ni(ic)}</span><span class="gk-tx">${txt}</span><span class="gk-ok"><i class="gk-spin"></i>${CHECK}</span></div>`).join('')}
      <div class="gk-shot"></div>
    </div>`);
    const shot = card.querySelector('.gk-shot');
    const checks = [...card.querySelectorAll('.gk-ok')].map((n) => ({ spin: n.querySelector('.gk-spin'), ck: n.querySelector('.gk-ck') }));

    // ---- the full-frame Notion client: the Launch tracker database, Board view grouped by Owner ----
    const groups = [EMPTY, ...OWNERS];
    const cardHtml = ([title, , due]) => `<div class="nb-card"><div class="nb-ct">${esc(title)}</div>
      <div class="nb-due"><span class="nb-prop">${esc(due)}</span></div>
      <div class="nb-st"><span class="nb-chip"><i class="nb-dot"></i>${STATUS}</span></div></div>`;
    const layer = x.el(`<div class="nt-full" aria-hidden="true"><div class="nt-app">
      <aside class="nt-side">
        <div class="nt-sw"><i class="nc-p nt-p">P</i><b>${esc(WORKSPACE)}</b>${ni('chevrons-up-down', 'nt-ud')}</div>
        ${SIDEBAR.map(([ic, name]) => `<div class="nt-si">${ni(ic)}<span>${esc(name)}</span></div>`).join('')}
        <div class="nt-sec">Shared</div>
        ${SHARED.map(([ic, name, on]) => `<div class="nt-si${on ? ' nt-on' : ''}">${ni(ic)}<span>${esc(name)}</span></div>`).join('')}
      </aside>
      <div class="nt-main">
        <header class="nt-top">
          <span class="nt-crumb">${ni('table-2')}${esc(DB)}</span>
          <span class="nt-tools"><span class="nt-share">Share</span>${ni('star', 'nt-ti')}${ni('clock-3', 'nt-ti')}${ni('ellipsis', 'nt-ti')}</span>
        </header>
        <div class="nt-page">
          <h1 class="nt-h1">${esc(DB)}</h1>
          <div class="nt-desc">${esc(DESC)}</div>
          <div class="nt-vbar">
            <span class="nt-tab nt-ton">${ni('kanban')}Board</span><span class="nt-tab">${ni('table-2')}Table</span>
            <span class="nt-vtools">${ni('list-filter', 'nt-ti')}<span class="nt-sort">${ni('arrow-up-down')}Due</span>${ni('search', 'nt-ti')}${ni('sliders-horizontal', 'nt-ti')}<span class="nt-new">New</span></span>
          </div>
          <div class="nb-board">
            ${groups.map((g, gi) => `<div class="nb-col" data-g="${gi}"><div class="nb-hd">${gi ? av(g) : ''}<span class="nb-name">${esc(g)}</span><span class="nb-n">0</span></div><div class="nb-new">${ni('plus')}New page</div></div>`).join('')}
            ${TASKS.map(cardHtml).join('')}
          </div>
        </div>
      </div>
    </div></div>`);
    x.root.appendChild(layer);
    const app = layer.firstElementChild;
    const $ = (s) => layer.querySelector(s);
    const board = $('.nb-board');
    const cols = [...layer.querySelectorAll('.nb-col')];
    const counts = cols.map((c) => c.querySelector('.nb-n'));
    const news = cols.map((c) => c.querySelector('.nb-new'));
    const cards = [...layer.querySelectorAll('.nb-card')].map((n, i) => ({ n, due: n.querySelector('.nb-due'), task: TASKS[i], g: 1 + OWNERS.indexOf(TASKS[i][1]), d: ORDER_IN(TASKS[i][1]).indexOf(TASKS[i]) }));
    const edges = [...layer.querySelectorAll('.nt-tools > *, .nt-vtools > *, .nt-side')];

    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, geo = '', feed = null, last = '';
    let AW = 1477, AH = 831, pushS = PUSH.wide, edgeOut = null;
    // measured once per frame size (design px): column x, the cards' area top, each card's height with and without
    // its Due row, the Due row's height, the "+ New page" row's height
    let G = null;

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
      app.classList.toggle('nt-narrow', tall);
      shot.style.aspectRatio = `${W} / ${H}`;
      card.classList.toggle('gk-tall', tall);
      consent.classList.toggle('nc-tall', tall);
      pushS = tall ? PUSH.tall : PUSH.wide;
      edgeOut = null;
      // measure in the app's own px (it is scaled by a transform, so offset* are untransformed)
      cards.forEach((c) => { c.due.style.height = ''; });
      const bx = board.offsetLeft, by = board.offsetTop;
      const colX = cols.map((c) => c.offsetLeft);
      const colW = cols[0].offsetWidth;
      const hd = cols[0].querySelector('.nb-hd');
      const top = hd.offsetTop + hd.offsetHeight + 6;
      cards.forEach((c) => { c.n.style.width = `${colW - 12}px`; });
      const dueH = cards[0].due.offsetHeight;
      const h1 = cards.map((c) => c.n.offsetHeight);
      G = { bx, by, colX, colW, top, dueH, h1, h0: h1.map((h) => h - dueH), newH: news[0].offsetHeight,
        // the push's focus, in design px: the board's centre, the headers' row
        fx: board.offsetParent ? 0 : 0, fy: 0 };
      const pageEl = $('.nt-page'), mainEl = $('.nt-main');
      G.fx = mainEl.offsetLeft + pageEl.offsetLeft + bx + (colX[3] + colW) / 2;
      G.fy = mainEl.offsetTop + pageEl.offsetTop + by + hd.offsetTop + hd.offsetHeight / 2;
    };

    // the pointer: in the chat, onto Select pages and a press, then onto Allow access (the same corner of the card)
    // and a press, then away
    const ptr = (t) => {
      if (t >= T.card + PTR_IN && t <= T.tap + 0.45) {
        const a = T.card + PTR_IN, b = T.select - 0.08;
        const g = x.box(t < T.pick ? sel : allow);
        if (!g.w) return null;
        const ex = g.x + g.w * 0.55, ey = g.y + g.h * 0.6;
        const m = inOutCubic(seg(t, a, Math.min(a + PTR_MOVE, b)));
        const leave = outCubic(seg(t, T.tap + 0.2, T.tap + 0.45));
        return { x: lerp(ex + 150, ex, m) + leave * 40, y: lerp(ey + 110, ey, m) + leave * 30, p: Math.max(press(t, T.select), press(t, T.tap)), v: seg(t, a, a + 0.12) * (1 - leave) };
      }
      return null;
    };

    // a card's progress from No Owner (0) to its owner's column (1), and its Due row opening as it lands
    const moved = (i, t) => inOutCubic(seg(t, T.flip[i], T.land[i]));
    const dueOpen = (i, t) => outCubic(seg(t, T.land[i] - DATE_IN * 0.5, T.land[i] + DATE_IN * 0.5));

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
        // the prompt gives way to the picker (out, then in: the two never sit on top of each other)
        const po = outCubic(seg(t, T.pick, T.pick + PICK_IN / 2)), pi = outCubic(seg(t, T.pick + PICK_IN / 2, T.pick + PICK_IN));
        ask.style.opacity = (1 - po).toFixed(3);
        ask.style.visibility = po >= 1 ? 'hidden' : '';
        pick.style.opacity = pi.toFixed(3);
        pick.style.visibility = t < T.pick + PICK_IN / 2 ? 'hidden' : '';
        boxes.forEach((b, i) => b.classList.toggle('on', PAGES[i][2] && t >= T.ticks[i]));
        // the two presses, then each button stays in its pressed tone
        const p1 = press(t, T.select), p2 = press(t, T.tap);
        sel.style.transform = p1 ? `scale(${(1 - 0.06 * p1).toFixed(4)})` : 'none';
        sel.classList.toggle('nc-hit', t >= T.select);
        allow.style.transform = p2 ? `scale(${(1 - 0.06 * p2).toFixed(4)})` : 'none';
        allow.classList.toggle('nc-hit', t >= T.tap);

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

        // the board: every card's place is closed-form in t. In No Owner a card sits under the cards ahead of it
        // that have not left yet; in its owner's column under the cards of that owner that landed before it
        if (!G) return;
        const step = (h) => h + GAP_Y;
        const colH = [0, 0, 0, 0];
        cards.forEach((c, i) => {
          const m = moved(i, t), dO = dueOpen(i, t);
          let y0 = 0;
          for (let j = 0; j < i; j++) y0 += step(G.h0[j]) * (1 - moved(j, t));
          let y1 = 0;
          for (let j = 0; j < i; j++) if (cards[j].g === c.g) y1 += step(G.h1[j]);
          const xx = lerp(G.colX[0], G.colX[c.g], m) + 6;
          const yy = G.top + lerp(y0, y1, m);
          c.n.style.transform = `translate(${xx.toFixed(2)}px, ${yy.toFixed(2)}px)`;
          c.due.style.height = `${(G.dueH * dO).toFixed(2)}px`;
          c.due.style.opacity = dO.toFixed(3);
          c.n.style.zIndex = m > 0 && m < 1 ? '2' : '';
          colH[0] += step(G.h0[i]) * (1 - m);
          colH[c.g] += step(lerp(G.h0[i], G.h1[i], dO)) * m;
        });
        news.forEach((nw, g) => { nw.style.transform = `translateY(${(G.top + colH[g]).toFixed(2)}px)`; });
        // the counts, in step: a card counts in its owner's column from its landing
        const landed = T.land.filter((l) => t >= l).length;
        const per = [TASKS.length - landed, 0, 0, 0];
        cards.forEach((c, i) => { if (t >= T.land[i]) per[c.g] += 1; });
        const key = per.join(',');
        if (key !== last) { per.forEach((v, g) => { counts[g].textContent = String(v); }); last = key; }
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
        // the payoff push: just after the landing, the frame closes in on the column headers (scaled about the headers'
        // row at the board's centre, so the headers hold their place on screen)
        const pz = g >= 1 ? outQuint(seg(t, T.push, T.push + PUSH_IN)) : 0;
        const ps = lerp(1, pushS, pz);
        const fx = G ? G.fx : 0, fy = G ? G.fy : 0;
        app.style.transform = pz > 0 ? `translate(${(k0 * fx * (1 - ps)).toFixed(2)}px, ${(k0 * fy * (1 - ps)).toFixed(2)}px) scale(${(k0 * ps).toFixed(5)})` : `scale(${k0.toFixed(5)})`;
        if (g >= 1 && !edgeOut && G) {
          // in design px: what the pushed frame would only half show fades out with the push
          const lo = fx - fx / pushS, hi = fx + (AW - fx) / pushS;
          const ar = app.getBoundingClientRect(), k = ar.width / AW / (pz > 0 ? ps : 1);
          edgeOut = edges.filter((n) => { const r = n.getBoundingClientRect(); const l = (r.left - ar.left) / k, rr = (r.right - ar.left) / k; return l < lo - 1 || rr > hi + 1; });
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
