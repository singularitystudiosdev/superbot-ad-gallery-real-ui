// Instagram beat, the finale: superbot sends the replies from the creator's own Instagram and fills the week. Its line
// streams and Instagram's authorization card lands in the chat (Business Login for Instagram: the Instagram glyph, the
// account "Nina Alvarez", the three permission lines, Allow / Cancel). The pointer taps Allow, and the source's
// connect-card grammar follows: a checklist card ("Connected as Nina Alvarez", "5 replies sent to brands", "7 posts
// scheduled for this week", "Watching for new brand DMs") ticking in turn, with a mini window under it; the card holds
// (CARD_HOLD) and the window opens to full frame (GROW), the grammar of the Discord fork's finale.
// RESULT A, full frame: Instagram on the web, light theme, the Messages inbox. The 5 brand rows flip in a quick
// stagger from the brand's unread message (bold, blue dot) to "You: <the reply's first words> · now", and the open
// Hearthline thread shows the brand's message and the reply sent as the creator (the blue bubble, "Sent").
// RESULT B: the frame pushes to Meta Business Suite's Planner, week view (Mon 5 to Sun 11, October 2026), Instagram
// selected: the 7 picked posts drop into their days with a stagger. The ONE bold moment: the last card lands (the
// chime) and a toast reads "7 posts scheduled"; the final state holds (READ) before the end card.
//
// There is ONE full-frame layer, in the scene root (outside the camera), holding both web apps side by side. While
// the checklist card sits in the chat the layer is pinned over the card's window frame; GROW interpolates it to the
// whole frame. Each app is laid out once at a design size (the frame divided by APP_SCALE) and scaled to the layer, so
// the mini window and the full frame are the same pixels at two sizes. On a portrait frame (4:5) they take narrow
// layouts: the inbox list over a compact thread, and the Planner as a vertical agenda of the 7 days.
// Pure function of t: every moving value is written from t.
import { lerp, seg, outCubic, inOutCubic, streamCount, press } from '../../../lib.js';
import { ph } from './ig-icons.js?v=8ae18b85';
import { WEEK } from './roll.js?v=8ae18b85';

const SAY = 'Sending from your own Instagram, so brands hear back from you.';
const ACCOUNT = 'Nina Alvarez';
const AVATAR = 'avatar-nina.jpg';
// the authorization screen (Business Login for Instagram), its layout and strings verbatim from real captures of the
// screen (brand/CREDITS.txt): the heading names the app and the account, one row per permission with its toggle
// (the required one locked on), the small print, then Allow / Cancel stacked. The account shows as its display name
// (the real screen shows the username; the spot never puts a username on screen). Only the permission lines that were
// confirmed verbatim are shown: instagram_business_basic and instagram_business_manage_messages.
const CONSENT = {
  scopes: [['View profile and access media (required)', true], ['Access and manage messages', false]],
  fine: 'By allowing, superbot will receive ongoing access to your information and Instagram will record when superbot accesses it. <u>Learn More</u> about this sharing and the settings you have.',
  allow: 'Allow', cancel: 'Cancel',
};
const STEPS = [
  ['avatar', `Connected as <b>${ACCOUNT}</b>`],
  ['ig', '5 replies sent to brands'],
  ['cal', '7 posts scheduled for this week'],
  ['watch', 'Watching for new brand DMs'],
];
// the inbox: [brand, avatar, the brand's unread message, when, the reply's first words]
const ROWS = [
  ['Hearthline Cookware', 'brand-hearthline.jpg', "We'd love 2 Reels with our new carbon steel pan", '2h', 'Hi Hearthline team, Love the new carbon steel pan'],
  ['Pinchwell Spice Co.', 'brand-pinchwell.jpg', 'Can we send you our new spice set for a Story?', '3h', "Hi Pinchwell team, I'd love the spice set"],
  ['Greenfold Meal Kits', 'brand-greenfold.jpg', 'Want your own 15% code for our meal kits?', '5h', 'Hi Greenfold team, count me in for the code'],
  ['Brightmilk Oat', 'brand-brightmilk.jpg', 'Would you do 1 feed post for $600?', '1d', 'Hi Brightmilk team, 1 feed post works for me'],
  ['Quickfry Air Fryers', 'brand-quickfry.jpg', '3 posts for $150 and a free air fryer?', '2d', 'Hi Quickfry team, thank you for thinking of me'],
];
// the rest of the inbox: people, not brands, left alone (read, untouched)
const OTHERS = [['Aunt Rosa', 'Made your lemon chicken last night!', '1d'], ['Dana Park', 'See you at the market Saturday', '2d'],
  ['Theo Mendes', 'Liked a message', '3d']];
const THREAD_IN = ['Hi Nina! Big fans of your 15-minute dinners.', "We'd love you to try our new carbon steel pan in 2 Reels. Our budget is $1,200. Interested?"];
const THREAD_OUT = `Hi Hearthline team,
Love the new carbon steel pan. I'm in for 2 Reels:
a 15-minute steak night and a crispy egg breakfast.
My rate for 2 Reels is $1,800, with 30 days of usage.
Could you send the brief and a pan by Thursday?
Talk soon,
Nina`;
// the Planner week: Mon 5 to Sun 11 October 2026, one post a day: [time, hour as a number, photo]
const POSTS = [
  ['6:00 PM', 18, 'roll-01.jpg'],
  ['12:00 PM', 12, 'roll-02.jpg'],
  ['6:30 PM', 18.5, 'roll-03.jpg'],
  ['7:00 PM', 19, 'roll-04.jpg'],
  ['5:00 PM', 17, 'roll-05.jpg'],
  ['10:00 AM', 10, 'roll-06.jpg'],
  ['4:00 PM', 16, 'roll-07.jpg'],
];
const DATES = [5, 6, 7, 8, 9, 10, 11];
const TOAST = '7 posts scheduled';
// Business Suite's collapsed icon rail, top to bottom as in the source of record (brand/CREDITS.txt): Home,
// notifications, Inbox, Content, Planner (active), Ads, Insights, All tools; search and settings at the foot
const RAIL = ['house', 'bell', 'chat-circle', 'cards', 'calendar-blank', 'megaphone', 'chart-bar', 'list'];

const APP_SCALE = { wide: 1.2, tall: 1.2 };         // full frame: the apps' px to frame px
// timing (seconds from the reply start, or from the card where noted)
const CPS = 80;                                  // the reply line streams (the source's play.js)
const CARD_AT = 0.25;                            // the line streams, then the authorization card lands
const CARD_IN = 0.3;                             // a card rising into the thread
const TAP_AT = 0.8; /* deliberate */             // the card landed to the tap on Allow (it reads first)
const PTR_IN = 0.3;                              // the card landed to the pointer appearing
const PTR_MOVE = 0.4;                            // the pointer's travel onto Allow, ending just before the tap
const LIST_AT = 0.25;                            // the tap to the checklist card landing
const CHECK_AT = 0.3;                            // the checklist landing to the first check
const CHECK_STAGGER = 0.16;                      // one check to the next
const POP = 0.16;                                // a check popping in
const CARD_HOLD = 0.3; /* deliberate */          // the last check in, the card holds before it opens
const GROW = 0.4; /* deliberate */               // the window opens to full frame
const OUT_AT = 0.2;                              // full frame to the reply bubble rising into the thread
const OUT_IN = 0.35;
const SENT_AT = 0.3;                             // the bubble in, then "Sent" under it
const FLIP_AT = 0.35;                            // full frame to the first inbox row flipping
const FLIP_STAGGER = 0.14;                       // one row to the next
const FLIP = 0.3;                                // a row's preview rolling over to the reply
const INBOX_READ = 3.05; /* deliberate */         // full frame to the push to the Planner (the inbox reads >= 3 s)
const PUSH = 0.5; /* deliberate */               // Instagram pushes out left, the Planner in from the right
const POST_AT = 0.2;                             // the Planner in to the first post card dropping
const POST_STAGGER = 0.14;                       // one day's card to the next
const POST_IN = 0.32;                            // a card dropping into its slot
const TOAST_AT = 0.22;                           // the last card's drop to the toast rising
const TOAST_IN = 0.3;
const READ = 1.9; /* deliberate */               // the final state holds, readable, before the scene's fade
const RADIUS = 8;                                // the card's window radius, eased to 0 at full frame

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const CHECK = '<svg class="gk-ck" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD_AT;                              // the authorization card lands
    T.tap = T.card + TAP_AT;                           // Allow is tapped
    T.list = T.tap + LIST_AT;                          // the checklist card lands, the mini window in it
    T.ok = STEPS.map((_, i) => T.list + CHECK_AT + i * CHECK_STAGGER);
    T.grow = T.ok[STEPS.length - 1] + POP + CARD_HOLD; // the window starts opening
    T.full = T.grow + GROW;                            // full frame: the inbox
    T.out = T.full + OUT_AT;                           // the reply bubble rises into the open thread
    T.sent = T.out + SENT_AT;
    T.flip = ROWS.map((_, i) => T.full + FLIP_AT + i * FLIP_STAGGER);
    T.push = T.full + INBOX_READ;                      // the push to the Planner
    T.plan = T.push + PUSH;                            // the Planner is in
    T.post = POSTS.map((_, i) => T.plan + POST_AT + i * POST_STAGGER);
    T.chime = T.post[POSTS.length - 1];                // the last card drops: the chime
    T.toast = T.chime + TOAST_AT;
    T.end = T.toast + TOAST_IN + READ;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const icon = (f) => x.brand(f);
    // the renderer reads the chime mark from here (scene-local time; the tabs scene starts the spot at 0)
    window.__AD_MARKS = Object.assign(window.__AD_MARKS || {}, { chime: T.chime });

    // ---- the authorization card in the chat ----
    const say = x.el(`<div class="qc-say ig-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const consent = x.el(`<div class="ic-card">
      <div class="ic-top">${ph('dots-three', 'ic-more')}<img src="${icon('instagram-wordmark.svg')}" alt=""/></div>
      <div class="ic-body">
        <div class="ic-title"><i>superbot</i> is requesting access to: ${esc(ACCOUNT)}. If you select Allow, <i>superbot</i> will be able to:</div>
        ${CONSENT.scopes.map(([txt, req]) => `<div class="ic-row"><span>${esc(txt)}</span><i class="ic-tg${req ? ' ic-req' : ''}"><b></b></i></div>`).join('')}
        <p class="ic-fine">${CONSENT.fine}</p>
        <p class="ic-fine">superbot <u>Privacy Policy</u> and <u>Terms</u>.</p>
        <div class="ic-btns"><span class="ic-go">${esc(CONSENT.allow)}</span><span class="ic-cancel">${esc(CONSENT.cancel)}</span></div>
      </div>
    </div>`);
    const go = consent.querySelector('.ic-go');

    // ---- the checklist card ----
    const stepIcon = (kind) => (kind === 'avatar' ? `<span class="gk-ic gk-av"><img src="${x.img(AVATAR)}" alt=""/></span>`
      : kind === 'ig' ? `<span class="gk-ic gk-img"><img src="${icon('instagram-logo.svg')}" alt=""/></span>`
        : `<span class="gk-ic gk-ms">${ph(kind === 'cal' ? 'calendar-blank' : 'bell')}</span>`);
    const card = x.el(`<div class="gk-card">
      ${STEPS.map(([kind, txt]) => `<div class="gk-step">${stepIcon(kind)}<span class="gk-tx">${txt}</span><span class="gk-ok"><i class="gk-spin"></i>${CHECK}</span></div>`).join('')}
      <div class="gk-shot"></div>
    </div>`);
    const shot = card.querySelector('.gk-shot');
    const checks = [...card.querySelectorAll('.gk-ok')].map((n) => ({ spin: n.querySelector('.gk-spin'), ck: n.querySelector('.gk-ck') }));

    // ---- RESULT A: Instagram web, the Messages inbox ----
    const row = ([name, av, msg, when, rep], i) => `<div class="ig-row${i === 0 ? ' ig-sel' : ''}"><img class="ig-av" src="${x.img(av)}" alt=""/>
      <div class="ig-rt"><b>${esc(name)}</b><div class="ig-pv"><span class="ig-pa"><span class="ig-pt">${esc(msg)}</span><span class="ig-pm">&nbsp;· ${when}</span></span>
      <span class="ig-pb"><span class="ig-pt">You: ${esc(rep)}</span><span class="ig-pm">&nbsp;· now</span></span></div></div><i class="ig-dot"></i></div>`;
    const railIcon = (name, cls = '') => `<span class="ig-ri ${cls}">${ph(name)}</span>`;
    const ig = `<div class="ig-app">
      <nav class="ig-rail">
        <span class="ig-ri ig-logo"><img src="${icon('instagram-glyph.svg')}" alt=""/></span>
        ${railIcon('house')}${railIcon('magnifying-glass')}${railIcon('compass')}${railIcon('film-slate')}${railIcon('messenger-logo-fill', 'ig-on')}${railIcon('heart')}${railIcon('plus-square')}
        <span class="ig-ri ig-me"><img src="${x.img(AVATAR)}" alt=""/></span>
        <span class="ig-rgap"></span>${railIcon('list')}
      </nav>
      <section class="ig-inbox">
        <header class="ig-ih"><b>${esc(ACCOUNT)}</b>${ph('caret-down', 'ig-cd')}<span class="ig-cmp">${ph('note-pencil')}</span></header>
        <div class="ig-tabs"><b>Messages</b><span>Requests</span></div>
        <div class="ig-rows">${ROWS.map(row).join('')}${OTHERS.map(([name, msg, when]) => `<div class="ig-row ig-other"><span class="ig-av ig-def">${ph('user-fill')}</span>
          <div class="ig-rt"><b>${esc(name)}</b><div class="ig-pv"><span class="ig-pa"><span class="ig-pt">${esc(msg)}</span><span class="ig-pm">&nbsp;· ${when}</span></span></div></div></div>`).join('')}</div>
      </section>
      <section class="ig-thread">
        <header class="ig-th"><img src="${x.img(ROWS[0][1])}" alt=""/><b>${esc(ROWS[0][0])}</b><span class="ig-thi">${ph('phone')}${ph('video-camera')}${ph('info')}</span></header>
        <div class="ig-msgs">
          <div class="ig-intro"><img src="${x.img(ROWS[0][1])}" alt=""/><b>${esc(ROWS[0][0])}</b><span>View profile</span></div>
          <div class="ig-stamp">Today 9:12 AM</div>
          <div class="ig-in"><i></i><p>${esc(THREAD_IN[0])}</p></div>
          <div class="ig-in"><img src="${x.img(ROWS[0][1])}" alt=""/><p>${esc(THREAD_IN[1])}</p></div>
          <div class="ig-out"><p>${esc(THREAD_OUT)}</p><small>Sent</small></div>
        </div>
        <div class="ig-comp"><span class="ig-cbox">${ph('smiley')}<span class="ig-cph">Message...</span>${ph('microphone')}${ph('image')}${ph('heart')}</span></div>
      </section>
    </div>`;

    // ---- RESULT B: Meta Business Suite, Planner, week view (layout per the source of record, brand/CREDITS.txt) ----
    const caption = (i) => WEEK[i][1];
    const postCard = (i, cls = '') => `<div class="mp-post ${cls}"><span class="mp-pt">${ph('image-square')}<time>${POSTS[i][0]}</time></span>
      <span class="mp-thw"><img class="mp-th" src="${x.img(POSTS[i][2])}" alt=""/><img class="mp-badge" src="${icon('instagram-logo.svg')}" alt=""/></span><p>${esc(caption(i))}</p></div>`;
    const dh = (i) => `<div class="mp-dh"><small>${WEEK[i][0]}</small> <b>${DATES[i]}</b></div>`;
    const mp = `<div class="mp-app">
      <nav class="mp-rail">
        <img class="mp-meta" src="${icon('meta-logo.svg')}" alt=""/><img class="mp-me" src="${x.img(AVATAR)}" alt=""/>
        ${RAIL.map((ic) => `<span class="mp-ri${ic === 'calendar-blank' ? ' mp-on' : ''}">${ph(ic)}</span>`).join('')}
        <span class="mp-rgap"></span><span class="mp-ri">${ph('magnifying-glass')}</span><span class="mp-ri">${ph('gear')}</span>
      </nav>
      <main class="mp-main">
        <div class="mp-bar">
          <span class="mp-seg"><b>Week</b><span>Month</span></span><span class="mp-arr">${ph('caret-left')}<span class="mp-today">Today</span>${ph('caret-right')}</span>
          <b class="mp-range">Oct 2026</b>
          <span class="mp-filters"><span class="mp-dd">Content type: all${ph('caret-down-fill')}</span><span class="mp-dd mp-on">Shared to: <img src="${icon('instagram-logo.svg')}" alt=""/>Instagram${ph('caret-down-fill')}</span></span>
        </div>
        <div class="mp-body">
          <div class="mp-cal">
            <div class="mp-days">${WEEK.map((_, i) => dh(i)).join('')}</div>
            <div class="mp-grid">${WEEK.map((_, i) => `<div class="mp-col">${postCard(i, i === WEEK.length - 1 ? 'mp-last' : '')}</div>`).join('')}</div>
            <div class="mp-agenda">${WEEK.map((_, i) => `<div class="mp-ag">${dh(i)}${postCard(i)}</div>`).join('')}</div>
          </div>
          <aside class="mp-side"><div class="mp-tabs"><b>Goals</b><span>Moments</span><span>Drafts</span></div>
            <div class="mp-goal"><b>${ph('trophy')}Goals</b><p>Set a goal, track progress and learn helpful tips for your professional success.</p>
              <span class="mp-btn mp-pri">Start new goal</span><span class="mp-btn">Create</span></div></aside>
        </div>
      </main>
      <div class="mp-toast">${ph('check-circle-fill')}<span>${esc(TOAST)}</span></div>
    </div>`;
    const layer = x.el(`<div class="ig-full" aria-hidden="true">${ig}${mp}</div>`);
    x.root.appendChild(layer);
    const $ = (s) => layer.querySelector(s);
    const $$ = (s) => [...layer.querySelectorAll(s)];
    const igApp = $('.ig-app'), mpApp = $('.mp-app');
    const rows = $$('.ig-row:not(.ig-other)').map((n) => ({ n, a: n.querySelector('.ig-pa'), b: n.querySelector('.ig-pb'), dot: n.querySelector('.ig-dot') }));
    const out = $('.ig-out'), outP = out.querySelector('p'), sent = out.querySelector('small');
    const gridPosts = $$('.mp-grid .mp-post'), agPosts = $$('.mp-agenda .mp-post');
    const toast = $('.mp-toast');

    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, geo = '', feed = null;
    let AW = 1600, AH = 900;

    const layout = () => {
      const W = x.root.offsetWidth, H = x.root.offsetHeight;
      if (!W || !H) return;
      const key = `${W}x${H}`;
      if (key === geo) return;
      geo = key;
      const tall = W < H;
      const s = tall ? APP_SCALE.tall : APP_SCALE.wide;
      AW = Math.round(W / s); AH = Math.round(H / s);
      [igApp, mpApp].forEach((a) => { a.style.width = `${AW}px`; a.style.height = `${AH}px`; });
      igApp.classList.toggle('ig-narrow', tall);
      mpApp.classList.toggle('mp-narrow', tall);
      shot.style.aspectRatio = `${W} / ${H}`;
      card.classList.toggle('gk-tall', tall);
      consent.classList.toggle('ic-tall', tall);
    };

    // the pointer: in from below right, onto Allow, a press, then away
    const ptr = (t) => {
      const a = T.card + PTR_IN, b = T.tap - 0.08;
      if (t < a || t > T.tap + 0.45) return null;
      const g = x.box(go);
      if (!g.w) return null;
      const ex = g.x + g.w * 0.55, ey = g.y + g.h * 0.6;
      const m = inOutCubic(seg(t, a, a + PTR_MOVE > b ? b : a + PTR_MOVE));
      const leave = outCubic(seg(t, T.tap + 0.2, T.tap + 0.45));
      return {
        x: lerp(ex + 150, ex, m) + leave * 40, y: lerp(ey + 110, ey, m) + leave * 30,
        p: press(t, T.tap), v: seg(t, a, a + 0.12) * (1 - leave),
      };
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
        // Allow: the press, then it stays in its pressed tone
        const pr = press(t, T.tap);
        go.style.transform = pr ? `scale(${(1 - 0.06 * pr).toFixed(4)})` : 'none';
        go.classList.toggle('ic-hit', t >= T.tap);

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

        // RESULT A: the reply rises into the open thread, "Sent" under it; the rows flip, top to bottom
        const o = outCubic(seg(t, T.out, T.out + OUT_IN));
        outP.style.opacity = o.toFixed(3);
        outP.style.transform = o >= 1 ? 'none' : `translateY(${((1 - o) * 18).toFixed(2)}px) scale(${lerp(0.96, 1, o).toFixed(4)})`;
        sent.style.opacity = outCubic(seg(t, T.sent, T.sent + 0.2)).toFixed(3);
        rows.forEach((r, i) => {
          const q = inOutCubic(seg(t, T.flip[i], T.flip[i] + FLIP));
          r.a.style.opacity = (1 - q).toFixed(3);
          r.a.style.transform = q > 0 ? `translateY(${(-q * 10).toFixed(2)}px)` : 'none';
          r.b.style.opacity = q.toFixed(3);
          r.b.style.transform = q < 1 ? `translateY(${((1 - q) * 10).toFixed(2)}px)` : 'none';
          r.dot.style.opacity = (1 - q).toFixed(3);
          r.n.classList.toggle('ig-unread', q < 0.5);
        });

        // the push: Instagram out to the left, the Planner in from the right
        const p = inOutCubic(seg(t, T.push, T.plan));
        igApp.dataset.x = (-AW * p).toFixed(2);
        mpApp.dataset.x = (AW * (1 - p)).toFixed(2);
        mpApp.style.visibility = p > 0 ? 'visible' : 'hidden';
        igApp.style.visibility = p < 1 ? 'visible' : 'hidden';

        // RESULT B: the 7 posts drop into their days; the toast confirms the week
        POSTS.forEach((_, i) => {
          const q = outCubic(seg(t, T.post[i], T.post[i] + POST_IN));
          [gridPosts[i], agPosts[i]].forEach((c) => {
            c.style.opacity = q.toFixed(3);
            c.style.transform = q >= 1 ? 'none' : `translateY(${((1 - q) * -16).toFixed(2)}px) scale(${lerp(0.94, 1, q).toFixed(4)})`;
          });
        });
        const tq = outCubic(seg(t, T.toast, T.toast + TOAST_IN));
        toast.style.opacity = tq.toFixed(3);
        toast.style.transform = tq >= 1 ? 'none' : `translateY(${((1 - tq) * 24).toFixed(2)}px)`;
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
        const k2 = (Wd / AW).toFixed(5);
        igApp.style.transform = `scale(${k2}) translateX(${igApp.dataset.x || 0}px)`;
        mpApp.style.transform = `scale(${k2}) translateX(${mpApp.dataset.x || AW}px)`;
        const fb = feed ? x.box(feed) : null;
        const cutT = fb ? Math.max(0, fb.y - Tp) * (1 - g) : 0, cutB = fb ? Math.max(0, Tp + Ht - (fb.y + fb.h)) * (1 - g) : 0;
        layer.style.clipPath = cutT > 0.01 || cutB > 0.01 ? `inset(${cutT.toFixed(2)}px 0 ${cutB.toFixed(2)}px 0 round ${(RADIUS * s * (1 - g)).toFixed(2)}px)` : '';
        layer.style.opacity = card.style.opacity;
      },
    };
  },
};
