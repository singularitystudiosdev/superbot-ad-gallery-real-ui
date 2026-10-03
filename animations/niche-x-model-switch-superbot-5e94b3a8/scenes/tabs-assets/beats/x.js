// X beat, the finale: superbot opens Sam's post on X and the drafts go out only as Sam approves them. Its line
// streams, an X-styled connect card lands in the chat ("superbot connected to X", "Signed in as Sam Rivera",
// "4 drafts ready to approve", three checks ticking in turn) with a mini X window under it; the card holds
// (CARD_HOLD) and the window opens to full frame (GROW), the grammar of the source's play.js. Full frame is a
// real-looking X web client, dark "Lights out": the left nav, the post's conversation view in the 600px centre column
// (Sam's post, the reply composer, the four comments) and the right column (search, Relevant people, What's
// happening). superbot's drafts land under each comment in turn (each slot opens), then the pointer taps Approve on
// each one; a tapped draft becomes a posted reply ("· now", the draft chrome dissolves, X's action icons appear, the
// thread line joins it to the comment). The centre column scrolls so the draft being approved is in view, then back
// to the post, whose reply count ticks 4 to 8 while X's blue toast slides up ("Your 4 replies were sent", View). The
// final state holds (READ) before the end card.
//
// There is ONE X client, on a layer in the scene root (outside the camera). While the card sits in the chat the
// layer is pinned over the card's window frame; GROW interpolates it from there to the whole frame. The client is laid
// out once at a design size (the frame divided by APP_SCALE, so its type reads like X at that zoom) and scaled to the
// layer, so the mini window and the full frame are the same pixels at two sizes. On a portrait frame (4:5) it takes
// X's tablet layout: the icon-only nav rail and the centre column, no right column.
// Pure function of t: every moving value (slot heights, the column's scroll, the pointer) is written from t.
import { lerp, seg, outCubic, inOutCubic, streamCount, press, boxIn } from '../../../lib.js';

// ---- the post and its comments (Tidepool, Sam and everyone here are made up for the spot) ----
export const POST = {
  text: 'Tidepool 2.0 is live. Shared calendars, offline mode and a new home screen widget. Built by two people in 9 months. Tell me what breaks.',
  meta: ['12:04 PM', 'Oct 2, 2026'], views: '18.4K', replies: 4, reposts: 37, likes: 412, bookmarks: 58,
};
// each comment, the intent Grok tags it with, and the reply superbot drafts in Sam's voice (write.js streams these)
export const COMMENTS = [
  { key: 'maya', name: 'Maya Chen', time: '3h', text: "Does offline mode sync once I'm back online, or do I have to export?",
    intent: { k: 'q', label: 'Question' }, draft: 'It syncs on its own the moment you reconnect, Maya. No export needed.', likes: 3, views: '214' },
  { key: 'jordan', name: 'Jordan Blake', time: '3h', text: 'Widget shows up blank on my iPhone. Anyone else?',
    intent: { k: 'bug', label: 'Bug report' }, draft: 'Not just you, Jordan. The fix ships in 2.0.1 this Friday. Removing and re-adding the widget works until then.', likes: 6, views: '388' },
  { key: 'priya', name: 'Priya Nair', time: '2h', text: 'Shared calendars are exactly what my team needed. Switching today.',
    intent: { k: 'praise', label: 'Praise' }, draft: 'Thanks Priya, that means a lot. Tell me how the first week goes for your team.', likes: 11, views: '502' },
  { key: 'leo', name: 'Leo Park', time: '1h', text: 'Any plans for an Android version?',
    intent: { k: 'feat', label: 'Feature request' }, draft: "Yes, Leo. The Android beta opens in November. I'll post the signup link right here.", likes: 9, views: '296' },
];
const N = COMMENTS.length;
const TILE = new URL('../tile.svg', import.meta.url).href; // superbot's mark, on the "Draft by superbot" label
const SAY = 'Opened your post on X. Each draft sits under its comment.';
const BIO = 'Building Tidepool, the shared calendar for small teams. Two of us, one app.';
const TRENDS = [
  ['Technology · Trending', 'Offline first', '2,184 posts'],
  ['Trending in Apps', 'Home screen widgets', '5,903 posts'],
  ['Business · Trending', 'Indie studios', '12.1K posts'],
];
const NAV = ['Home', 'Explore', 'Notifications', 'Messages', 'Grok', 'Bookmarks', 'Communities', 'Premium', 'Profile', 'More'];

const APP_SCALE = { wide: 1.25, tall: 1.2 };    // full frame: the client's px to frame px
const HEADER = 53;                               // the centre column's sticky "Post" header (X's own height)
// timing (seconds from the reply start, or from the card where noted)
const CPS = 80;                                  // the reply line streams (the source's play.js)
const CARD_AT = 0.25;                            // the line streams, then the card lands
const CARD_IN = 0.3;                             // the card rising into the thread
const CHECK_AT = 0.3;                            // the card landing to the first check
const CHECK_STAGGER = 0.2;                       // one check to the next
const POP = 0.16;                                // a check popping in
const CARD_HOLD = 0.3; /* deliberate */          // the last check in, the card holds before it opens (play.js)
const GROW = 0.4; /* deliberate */               // the window opens to full frame (play.js)
const DRAFT_AT = 0.25;                           // full frame to the first draft landing
const DRAFT_STAGGER = 0.2; /* deliberate */      // one draft to the next (the brief: ~0.2 s)
const LAND = 0.35;                               // a draft's slot opening and its content fading up
const POINT_AT = 0.2;                            // the last draft landed, then the pointer comes in
const TAP_AT = 0.35;                             // the last draft landed to the first Approve tap
const TAP_STAGGER = 0.4; /* deliberate */        // one Approve tap to the next (the brief: ~0.4 s)
const POST_AT = 0.1;                             // a tap to its draft turning into a posted reply
const POSTED = 0.3;                              // the draft chrome dissolving into a posted reply
const BACK_AT = 0.3;                             // the last tap, then the column scrolls back to the post
const BACK = 0.45;                               // the scroll back
const COUNT_AT = 0.3;                            // the scroll back starts, then the reply count ticks
const TICK = 0.08;                               // one tick of the count (4 to 8)
const TOAST_AT = 0.4;                            // the scroll back starts, then the toast slides up
const TOAST_IN = 0.35;                           // the toast sliding up
const READ = 1.6; /* deliberate */               // the final state holds, readable, before the scene's fade (>= 1.5)
const RADIUS = 8;                                // the card's window radius, eased to 0 at full frame

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const svg = (d, cls = 'xx-st') => `<svg class="xx-i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const I = {
  home: svg('<path d="M12 2.8 2.5 10.2V21.5h7v-6.5h5v6.5h7V10.2z"/>', 'xx-fl'),
  explore: svg('<circle cx="10.5" cy="10.5" r="7"/><path d="m15.8 15.8 5.2 5.2"/>'),
  bell: svg('<path d="M5.5 17V11a6.5 6.5 0 0 1 13 0v6l1.6 2.2H3.9z"/><path d="M9.6 21.5h4.8"/>'),
  mail: svg('<rect x="2.8" y="4.8" width="18.4" height="14.4" rx="2.2"/><path d="m3.5 6.3 8.5 6.5 8.5-6.5"/>'),
  grok: svg('<rect x="3.2" y="3.2" width="17.6" height="17.6" rx="4"/><path d="M8.2 16.4 15.8 7.6"/>'),
  bookmark: svg('<path d="M6 3.5h12v17.2l-6-4.4-6 4.4z"/>'),
  people: svg('<circle cx="8.5" cy="8.5" r="3.4"/><circle cx="16.5" cy="9.5" r="2.7"/><path d="M2.5 19.5a6 6 0 0 1 12 0M15 14.2a5 5 0 0 1 6.5 4.8"/>'),
  premium: '<svg class="xx-i xx-fl" viewBox="-4 -4 32 32" aria-hidden="true"><path d="M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z"/></svg>',
  profile: svg('<circle cx="12" cy="8" r="4.2"/><path d="M3.8 21a8.2 8.2 0 0 1 16.4 0z"/>'),
  more: svg('<circle cx="12" cy="12" r="9.2"/><path d="M7.6 12h.01M12 12h.01M16.4 12h.01" class="xx-dot"/>'),
  dots: svg('<path d="M5 12h.01M12 12h.01M19 12h.01" class="xx-dot"/>'),
  back: svg('<path d="M20 12H4.5M10.5 5.5 4 12l6.5 6.5"/>'),
  reply: svg('<path d="M4 11.3C4 7.3 7.3 4 11.3 4h1.5a7.3 7.3 0 0 1 0 14.6H10L5.5 21.3v-4.2A7.2 7.2 0 0 1 4 11.3z"/>'),
  repost: svg('<path d="M4.5 7.5 7.5 4.5l3 3M7.5 5v9.5a2.5 2.5 0 0 0 2.5 2.5h3.5M19.5 16.5l-3 3-3-3M16.5 19V9.5A2.5 2.5 0 0 0 14 7h-3.5"/>'),
  like: svg('<path d="M12 20.2S3.5 15.4 3.5 9.4A4.6 4.6 0 0 1 12 7a4.6 4.6 0 0 1 8.5 2.4c0 6-8.5 10.8-8.5 10.8z"/>'),
  views: svg('<path d="M4.5 20.5V13M9.5 20.5V4.5M14.5 20.5V9.5M19.5 20.5V15"/>'),
  share: svg('<path d="M12 3.5v12M7.5 8 12 3.5 16.5 8M4.5 14v5.2c0 .7.6 1.3 1.3 1.3h12.4c.7 0 1.3-.6 1.3-1.3V14"/>'),
  search: svg('<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/>'),
  feather: svg('<path d="M12 5v14M5 12h14"/>'),
  badge: '<svg class="xx-badge" viewBox="0 0 22 22" aria-hidden="true"><path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"/></svg>',
  check: '<svg class="xk-ck" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
};
const NAV_ICON = [I.home, I.explore, I.bell, I.mail, I.grok, I.bookmark, I.people, I.premium, I.profile, I.more];
const av = (key, letter, cls = 'xx-av') => `<span class="${cls}" style="--c: var(--xx-av-${key})">${esc(letter)}</span>`;
const SAM = (cls) => av('sam', 'S', cls);
// X's action row under a post; counts are shown only where they are non-zero, the way X does
const acts = (c = {}) => `<div class="xx-acts">
  <span class="xx-a">${I.reply}<em>${c.replies || ''}</em></span><span class="xx-a">${I.repost}<em>${c.reposts || ''}</em></span>
  <span class="xx-a">${I.like}<em>${c.likes || ''}</em></span><span class="xx-a">${I.views}<em>${c.views || ''}</em></span>
  <span class="xx-a2">${I.bookmark}${I.share}</span></div>`;

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD_AT;                             // the connect card lands, the mini window in it
    T.ok = [0, 1, 2].map((i) => T.card + CHECK_AT + i * CHECK_STAGGER); // connected, signed in, drafts ready: checks
    T.grow = T.ok[2] + POP + CARD_HOLD;               // the window starts opening
    T.full = T.grow + GROW;                           // full frame
    T.d = COMMENTS.map((_, i) => T.full + DRAFT_AT + i * DRAFT_STAGGER); // superbot's drafts land, one per comment
    const landed = T.d[N - 1] + LAND;
    T.cin = landed - POINT_AT;                        // the pointer comes in (a beat before the last draft settles)
    T.tap = COMMENTS.map((_, i) => landed + TAP_AT + i * TAP_STAGGER); // Approve, one draft at a time
    T.post = T.tap.map((a) => a + POST_AT);           // ...each one turning into a posted reply
    T.back = T.tap[N - 1] + BACK_AT;                  // the column scrolls back up to the post
    T.count = T.back + COUNT_AT;                      // the post's reply count ticks 4 -> 8
    T.toast = T.back + TOAST_AT;                      // X's toast starts sliding up (.xx-toast gets .xx-toast-in)
    T.toastLanded = T.toast + TOAST_IN;               // ...and has landed
    T.settle = Math.max(T.toastLanded, T.count + N * TICK, T.post[N - 1] + POSTED); // the last visible change
    T.end = T.settle + READ;                          // the final state holds, then the scene fades to the end card
    return T;
  },
  build(k, x) {
    const T = k.T;
    const mark = x.brand('x-logo.svg');

    // ---- the connect card in the chat ----
    const say = x.el(`<div class="qc-say xk-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const steps = [
      [`<span class="xk-ct xk-ct-x"><img src="${mark}" alt=""/></span>`, `<b>superbot connected to X</b>`],
      [SAM('xk-ct xk-ct-av'), `Signed in as <b>Sam Rivera</b>`],
      [`<span class="xk-ct xk-ct-n">${N}</span>`, `<b>${N} drafts</b> ready to approve`],
    ];
    const card = x.el(`<div class="xk-card">
      ${steps.map(([icon, txt]) => `<div class="xk-step">${icon}<span class="xk-tx">${txt}</span><span class="xk-ok"><i class="xk-spin"></i>${I.check}</span></div>`).join('')}
      <div class="xk-shot"></div>
    </div>`);
    const shot = card.querySelector('.xk-shot');
    const checks = [...card.querySelectorAll('.xk-ok')].map((n) => ({ spin: n.querySelector('.xk-spin'), ck: n.querySelector('.xk-ck') }));

    // ---- the full-frame X client ----
    const comment = (c) => `<article class="xx-tw xx-cm">${av(c.key, c.name[0])}<i class="xx-thr"></i>
      <div class="xx-body"><div class="xx-hd"><b>${esc(c.name)}</b><span class="xx-mu">&middot; ${esc(c.time)}</span>${I.dots}</div>
      <div class="xx-tx">${esc(c.text)}</div>${acts({ likes: c.likes, views: c.views })}</div></article>`;
    const draft = (c) => `<div class="xx-slot"><article class="xx-tw xx-rp"><i class="xx-chrome"></i><i class="xx-thr2"></i>${SAM()}
      <div class="xx-body"><div class="xx-hd"><b>Sam Rivera</b>${I.badge}<span class="xx-lab">
        <span class="xx-dl"><span class="xx-mu">&middot;</span><img src="${TILE}" alt=""/>Draft by superbot</span>
        <span class="xx-now xx-mu">&middot; now</span></span>${I.dots}</div>
      <div class="xx-tx">${esc(c.draft)}</div>
      <div class="xx-foot"><div class="xx-dbtns"><i class="xx-edit">Edit</i><i class="xx-appr">Approve</i></div>${acts()}</div></div></article></div>`;
    const layer = x.el(`<div class="xx-full" aria-hidden="true"><div class="xx-app">
      <nav class="xx-nav">
        <span class="xx-logo"><img src="${mark}" alt=""/></span>
        ${NAV.map((n, i) => `<div class="xx-ni${i === 0 ? ' xx-on' : ''}">${NAV_ICON[i]}<span>${n}</span></div>`).join('')}
        <span class="xx-postbtn"><span>Post</span>${I.feather}</span>
        <div class="xx-acct">${SAM()}<b>Sam Rivera</b>${I.dots}</div>
      </nav>
      <main class="xx-col">
        <div class="xx-list">
          <article class="xx-focal">
            <div class="xx-fh">${SAM()}<b>Sam Rivera</b>${I.badge}${I.dots}</div>
            <div class="xx-ftx">${esc(POST.text)}</div>
            <div class="xx-meta">${POST.meta.join(' &middot; ')} &middot; <b>${POST.views}</b> Views</div>
            <div class="xx-fbar">
              <span class="xx-a">${I.reply}<em class="xx-rc">${POST.replies}</em></span><span class="xx-a">${I.repost}<em>${POST.reposts}</em></span>
              <span class="xx-a">${I.like}<em>${POST.likes}</em></span><span class="xx-a">${I.bookmark}<em>${POST.bookmarks}</em></span><span class="xx-a">${I.share}</span>
            </div>
          </article>
          <div class="xx-compose">${SAM()}<span class="xx-ph">Post your reply</span><span class="xx-rbtn">Reply</span></div>
          ${COMMENTS.map((c) => `<div class="xx-pair">${comment(c)}${draft(c)}</div>`).join('')}
        </div>
        <header class="xx-top">${I.back}<b>Post</b></header>
        <div class="xx-toast" data-in="${T.toast.toFixed(3)}" data-landed="${T.toastLanded.toFixed(3)}"><span>Your ${N} replies were sent</span><b>View</b></div>
      </main>
      <aside class="xx-side">
        <div class="xx-search">${I.search}<span>Search</span></div>
        <section class="xx-box"><h2>Relevant people</h2>
          <div class="xx-person">${SAM()}<div><div class="xx-pn"><b>Sam Rivera</b>${I.badge}</div><p>${esc(BIO)}</p></div></div>
        </section>
        <section class="xx-box"><h2>What&rsquo;s happening</h2>
          ${TRENDS.map(([cat, name, n]) => `<div class="xx-trend"><small>${esc(cat)}</small><b>${esc(name)}</b><small>${esc(n)}</small>${I.dots}</div>`).join('')}
        </section>
      </aside>
    </div></div>`);
    x.root.appendChild(layer);
    const app = layer.firstElementChild;
    const list = layer.querySelector('.xx-list');
    const rc = layer.querySelector('.xx-rc');
    const toast = layer.querySelector('.xx-toast');
    const pairs = [...layer.querySelectorAll('.xx-pair')].map((p) => {
      const s = p.querySelector('.xx-slot');
      return {
        s, c: s.firstElementChild, h: '', thr: p.querySelector('.xx-thr'), thr2: s.querySelector('.xx-thr2'),
        chrome: s.querySelector('.xx-chrome'), dl: s.querySelector('.xx-dl'), now: s.querySelector('.xx-now'),
        btns: s.querySelector('.xx-dbtns'), acts: s.querySelector('.xx-acts'), appr: s.querySelector('.xx-appr'),
      };
    });

    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, geo = '', feed = null, count = '';
    let AW = 1536, AH = 864, FW = 1920;

    // the client's design size from the frame: W x H over APP_SCALE; a portrait frame takes the tablet layout
    const layout = () => {
      const W = x.root.offsetWidth, H = x.root.offsetHeight;
      if (!W || !H) return;
      const key = `${W}x${H}`;
      if (key === geo) return;
      geo = key;
      const tall = W < H;
      const s = tall ? APP_SCALE.tall : APP_SCALE.wide;
      AW = Math.round(W / s); AH = Math.round(H / s); FW = W;
      app.style.width = `${AW}px`; app.style.height = `${AH}px`;
      app.classList.toggle('xx-narrow', tall);
      shot.style.aspectRatio = `${W} / ${H}`;
      card.classList.toggle('xk-tall', tall);
    };

    // the centre column's scroll at t, in the column's px. Measured on the FINAL layout (every slot open), so a
    // target never depends on how far a slot has opened this frame: a pure function of t.
    const scrollAt = (t) => {
      const full = pairs.map((m) => m.c.offsetHeight);
      const cur = pairs.map((m) => m.s.offsetHeight);
      const before = (i) => { let d = 0; for (let j = 0; j < i; j++) d += full[j] - cur[j]; return d; };
      const top = pairs.map((m, i) => m.s.offsetTop + before(i));        // a draft's top, all slots open
      const bot = top.map((v, i) => v + full[i]);
      const total = list.offsetHeight + before(N);
      const max = Math.max(0, total - AH);
      const clamp = (v) => Math.min(max, Math.max(0, v));
      // just enough to bring a draft fully into view under the header (no move when it already is)
      const into = (y, i) => clamp(Math.min(Math.max(y, bot[i] + 12 - AH), top[i] - 8 - HEADER));
      const keys = [];
      const yLand = clamp(bot[N - 1] + 12 - AH);
      keys.push([T.d[0], T.d[N - 1] + LAND, yLand]);
      let y = yLand;
      T.tap.forEach((a, i) => { y = into(y, i); keys.push([a - TAP_STAGGER + 0.02, a - 0.1, y]); });
      keys.push([T.back, T.back + BACK, 0]);
      let v = 0;
      for (const [a, b, to] of keys) { if (t <= a) break; v = lerp(v, to, inOutCubic(seg(t, a, b))); }
      return v;
    };

    // a node's centre in the scene root's px once the client is full frame (layer at 0,0, scaled FW / AW)
    const at = (n) => { const b = boxIn(n, app); const s = FW / AW; return { x: b.cx * s, y: b.cy * s }; };

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        layout();
        const n = streamCount(SAY, T.r + 0.05, CPS, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        const ci = outCubic(seg(t, T.card, T.card + CARD_IN));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px)`;
        // the three steps: a spinner each, resolving to a green check in turn
        checks.forEach((c, i) => {
          const o = outCubic(seg(t, T.ok[i], T.ok[i] + POP));
          c.spin.style.opacity = (1 - seg(t, T.ok[i] - 0.06, T.ok[i] + 0.04)).toFixed(3);
          c.spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
          c.ck.style.opacity = o.toFixed(3);
          c.ck.style.transform = `scale(${lerp(0.4, 1, o).toFixed(4)})`;
        });

        // the drafts: each slot opens under its comment and the draft fades up behind it
        pairs.forEach((m, i) => {
          const g = outCubic(seg(t, T.d[i], T.d[i] + LAND));
          const want = g >= 1 ? 'auto' : `${(m.c.offsetHeight * g).toFixed(2)}px`;
          if (want !== m.h) { m.s.style.height = want; m.h = want; }
          const f = outCubic(seg(t, T.d[i] + LAND * 0.35, T.d[i] + LAND));
          m.c.style.opacity = f.toFixed(3);
          m.c.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 10).toFixed(2)}px)`;
          // Approve: a visible press, then the draft becomes a posted reply
          const pr = press(t, T.tap[i]);
          m.appr.style.transform = pr ? `scale(${(1 - 0.08 * pr).toFixed(4)})` : '';
          m.appr.classList.toggle('xx-down', pr > 0.3);
          const p = outCubic(seg(t, T.post[i], T.post[i] + POSTED));
          m.chrome.style.opacity = (1 - p).toFixed(3);
          m.dl.style.opacity = (1 - p).toFixed(3);
          m.now.style.opacity = p.toFixed(3);
          m.btns.style.opacity = (1 - p).toFixed(3);
          m.btns.style.visibility = p >= 1 ? 'hidden' : '';
          m.acts.style.opacity = p.toFixed(3);
          m.thr.style.transform = `scaleY(${p.toFixed(4)})`;
          m.thr2.style.opacity = seg(t, T.post[i] + POSTED * 0.6, T.post[i] + POSTED).toFixed(3);
        });

        // the column follows the approvals, then glides back to the post
        list.style.transform = `translateY(${(-scrollAt(t)).toFixed(2)}px)`;

        // the post's reply count ticks up as the replies arrive, and X's toast slides up
        const c = String(POST.replies + (t < T.count ? 0 : Math.min(N, Math.floor((t - T.count) / TICK) + 1)));
        if (c !== count) { rc.textContent = c; count = c; }
        const tp = outCubic(seg(t, T.toast, T.toastLanded));
        toast.style.opacity = tp.toFixed(3);
        toast.style.transform = `translate(-50%, ${((1 - tp) * 28).toFixed(2)}px)`;
        toast.classList.toggle('xx-toast-in', t >= T.toast);
        toast.classList.toggle('xx-toast-landed', t >= T.toastLanded);
      },
      // the pointer: in from below, onto each Approve in turn (a press on each), then away
      pointer(t) {
        if (t < T.cin || t > T.tap[N - 1] + 0.6) return null;
        const pts = pairs.map((m) => at(m.appr));
        const v = seg(t, T.cin, T.cin + 0.15) * (1 - seg(t, T.tap[N - 1] + 0.3, T.tap[N - 1] + 0.6));
        let p;
        if (t <= T.tap[0]) {
          const s = { x: pts[0].x + 150, y: pts[0].y + 190 };
          const e = inOutCubic(seg(t, T.cin, T.tap[0] - 0.06));
          p = { x: lerp(s.x, pts[0].x, e), y: lerp(s.y, pts[0].y, e) };
        } else if (t >= T.tap[N - 1]) {
          const e = inOutCubic(seg(t, T.tap[N - 1] + 0.15, T.tap[N - 1] + 0.6));
          p = { x: pts[N - 1].x + 60 * e, y: pts[N - 1].y + 80 * e };
        } else {
          const i = T.tap.findIndex((a) => t < a);
          const e = inOutCubic(seg(t, T.tap[i - 1] + 0.1, T.tap[i] - 0.06));
          p = { x: lerp(pts[i - 1].x, pts[i].x, e), y: lerp(pts[i - 1].y, pts[i].y, e) };
        }
        const pr = Math.max(...T.tap.map((a) => press(t, a)));
        return { x: p.x + 6, y: p.y + 4, p: pr, v };
      },
      // after the camera: pin the layer over the card's window, then open it to the whole frame
      after(t) {
        if (t < T.card) { layer.style.opacity = '0'; return; }
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
