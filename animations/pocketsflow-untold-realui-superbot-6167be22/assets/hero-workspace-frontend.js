// hero-workspace-frontend: the workspace hero's app frame, drawn as
// superbot-desktop main's NEW CHAT screen (main 77f02910, captured live
// 2026-09-27: .tmp/hero-ref.7580bba1/main/new-chat.png + dom/new-chat.json),
// and the `ui` handle the hero's chat beat drives.
//
// Geometry. Main lays its window out at 1091 x 658 CSS px (a 1310 x 790
// window at app zoom 1.2), 13px body text. This module lays the hub out in
// main's own px at that width and scales the whole box ONCE to the hub
// (942 / 1091 = 0.863 on the lander's 960px stage), so every value in
// hero-workspace.css is main's number, pasted. hero-sphere.js measures the
// HUD through getBoundingClientRect and divides by the box's own scale (its
// L.hk), so the reveal glides onto the scaled mark unchanged. Below a 924px
// hub (where the one scale would set body text under 11px) the frame is
// main's hidden-sidebar state at a 0.92 scale: the pane alone, as main draws
// a narrow window.
//
// What the sphere needs from the hub stays where prepStage looks for it:
// .hud with .hud-mark, .hud-word and .hud-discs .hud-disc (the drop items),
// and .inner on everything that fades up after the mark lands. The HUD and
// its mark are the page's own nodes, MOVED here, so the mounted face
// (lander-agent.html mountMascotMark) keeps running.
//
// CONTRACT (hero-workspace-chat.js codes against it):
//   buildFrontend(hub) -> ui, idempotent per hub (a second call returns the same ui)
//   ui.pane            the main (right) column: header, feed, composer, tail
//   ui.feed            the thread feed, a column whose rows sit bottom-anchored
//                      above the composer; append chat rows here. It is its
//                      own scroll box (overflow hidden, scroll it with
//                      scrollTop). Its first child is the greeting
//                      (.hwf-hero), which this module owns: append after it.
//                      The row column is the composer's width (736 design px,
//                      the feed's inline padding does it).
//   ui.composer        the composer box; ui.send the send button
//   ui.setDraft(text)  '' shows the placeholder 'How can superbot help you today?'
//   ui.setCaret(on)    the text caret after the draft (main's native caret: 1px, fg, 1s blink)
//   ui.setSendArmed(on) idle (fg 8% well, #6b6f76 arrow) vs armed (storm gradient, white arrow, glow)
//   ui.setSending(on)  the send becomes main's stop square (composer-cancel), SUPER
//                      dims and the placeholder reads 'Queues until this turn ends'
//   ui.setModel(m)     the model chip. m: null / '' / 'superbot' = the glitch mascot
//                      and 'superbot'; 'Gemini' or { name: 'Gemini', tile } = main's
//                      switch reading, 'Gemini 3 Pro Image' on the Gemini mark; any
//                      other { name, tile } shows that name on that tile image
//   ui.setModelFx(opacity, scale) the chip's swap dip and pop, written as given
//   ui.setNewChat(p)   p is the collapse's EASED remaining progress, 1 = pristine
//                      new chat (greeting, tail open, composer mid-pane), 0 =
//                      thread mode (greeting gone, tail collapsed, composer in its
//                      bottom seat, the thread toolbar band under the header). p IS
//                      the tail's flex-grow, main's collapse (new-chat.css
//                      .new-chat-tail: flex-grow over 400ms on emphasized-decelerate):
//                      the caller applies that curve (hero-workspace-chat.js
//                      renderComposer passes 1 - emphDecel(time progress)), this
//                      module applies none, so the glide is main's curve exactly
//                      once. Below 1 the thread exists: the band opens (height and
//                      opacity 1 - p), the greeting fades out at opacity p in its
//                      seat, and the new chat's row leads Recent, active.
//   ui.setTitle(text)  the pane header title ('New chat'), and the Recent row's title
//   ui.reset()         pristine new chat: draft '', caret off, send idle, not
//                      sending, model superbot, title 'New chat', feed rows removed,
//                      the thread's Recent row gone
//   ui.lanes           { select(lane), live(on) } the sidebar's Chat | Code switch
//   ui.fit()           re-read the hub's size and rescale now (the ResizeObserver
//                      does it on its own; the host calls it once prepStage has
//                      widened the hub, before the sphere measures the HUD)
//   ui.onFit           the host's callback after every rescale (the sphere re-measures)
// Every setter writes only on change, so it is safe every frame and out of order.

const DESIGN_W = 1091;      // main's CSS layout width (dom/new-chat.json __viewport)
// The sidebar shows only while the whole 1091 box, scaled to the hub, still
// sets main's 13px body text at 11px or more (w / 1091 * 13 >= 11, a hub of
// 924 rendered px and up). Narrower, the frame is main's hidden-sidebar state, the pane
// alone at NARROW_SCALE, as main draws a narrow window; so no width between a
// phone and the desktop renders the lists at 5-9px.
const BODY_PX = 13;         // main's body text (type.tokens.json:100)
const MIN_BODY_PX = 11;     // the floor body text may render at
const WIDE_HUB = Math.ceil(DESIGN_W * MIN_BODY_PX / BODY_PX); // 924
const NARROW_SCALE = 0.92;  // the pane-only frame: 13px body text lands at 12px

const LU = (d, sw = 2) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${d}</svg>`;
const CL = (d, cls = '') => `<svg class="hwf-cl${cls}" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${d}</svg>`;
const IC = {
  panelLeftClose: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/><path d="m16 15-3-3 3-3"/>',
  panelLeftOpen: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/><path d="m14 9 3 3-3 3"/>',
  panelRightOpen: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M15 3v18"/><path d="m10 15-3-3 3-3"/>',
  search: '<path d="m21 21-4.34-4.34"/><circle cx="11" cy="11" r="8"/>',
  chat: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  code: '<path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  minus: '<path d="M5 12h14"/>',
  filter: '<path d="M3 6h18"/><path d="M7 12h10"/><path d="M10 18h4"/>',
  listChecks: '<path d="M13 5h8"/><path d="M13 12h8"/><path d="M13 19h8"/><path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/>', // lucide list-checks, main's Setup row
  chevron: '<path d="m6 9 6 6 6-6"/>',
  bug: '<path d="m8 2 1.88 1.88"/><path d="M14.12 3.88 16 2"/><path d="M9 7.13v-1a3 3 0 1 1 6 0v1"/><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"/><path d="M12 20v-9"/><path d="M6.53 9C4.6 8.8 3 7.1 3 5"/><path d="M6 13H2"/><path d="M3 21c0-2.1 1.7-3.9 3.8-4"/><path d="M20.97 5c0 2.1-1.6 3.8-3.5 4"/><path d="M22 13h-4"/><path d="M17.2 17c2.1.1 3.8 1.9 3.8 4"/>',
  gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/>',
  settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.59 13.51 6.83 3.98"/><path d="m15.41 6.51-6.82 3.98"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
  penLine: '<path d="M13 21h8"/><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/>',
  workflow: '<rect width="8" height="8" x="3" y="3" rx="2"/><path d="M7 11v4a2 2 0 0 0 2 2h4"/><rect width="8" height="8" x="13" y="13" rx="2"/>',
  folderGit: '<path d="M18 19a5 5 0 0 1-5-5v8"/><path d="M9 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v5"/><circle cx="13" cy="12" r="2"/><circle cx="20" cy="19" r="2"/>',
  download: '<path d="M12 15V3"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/>',
  stop: '<rect width="18" height="18" x="3" y="3" rx="2"/>',
};
// the composer's own 12px glyphs (packages/ui composer.tsx .cl-ic, from the live DOM)
const CLI = {
  plus: '<path d="M6 1.5v9M1.5 6h9"/>',
  computer: '<rect x="1.5" y="2" width="9" height="6" rx="1"/><path d="M4 10.5h4M6 8v2.5"/>',
  mic: '<rect x="4.4" y="1.3" width="3.2" height="6" rx="1.6"/><path d="M2.8 5.8a3.2 3.2 0 0 0 6.4 0M6 9v1.7"/>',
  send: '<path d="M6 10V2M2.5 5.5 6 2l3.5 3.5"/>',
  chevron: '<path d="M3 4.5 6 7.5 9 4.5"/>',
};

// MarkSuperbotGlitch as main renders it at rest (dom/new-chat.json
// greeting-hero): a cyan and a magenta copy of the face a hair off the white
// one, ears drawn separately. One mask per instance.
let markSeq = 0;
function glitchMark() {
  const id = `hwf-face-${++markSeq}`;
  const ears = (fill) => `<path fill="${fill}" d="M14 46V28Q14 20 21 21Q28 24 36 32Z"/><path fill="${fill}" d="M86 46V28Q86 20 79 21Q72 24 64 32Z"/>`;
  const layer = (cls, fill) => `<g class="${cls}"><rect width="100" height="100" fill="${fill}" mask="url(#${id})"/>${ears(fill)}</g>`;
  return `<svg class="hwf-glitch" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><defs><mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">` +
    '<path fill="#fff" d="M29 32H71A15 15 0 0 1 86 47V71A15 15 0 0 1 71 86H29A15 15 0 0 1 14 71V47A15 15 0 0 1 29 32Z"/>' +
    '<g fill="#000"><ellipse cx="35" cy="58" rx="8" ry="11"/><ellipse cx="65" cy="58" rx="8" ry="11"/></g></mask></defs>' +
    layer('hwf-glitch-a', '#00e5c3') + layer('hwf-glitch-b', '#c026d3') + layer('hwf-glitch-face', '#ffffff') + '</svg>';
}
const GEMINI = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><defs><linearGradient id="hwf-gemini" x1="-4" y1="22" x2="26" y2="4" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#439ddf"/><stop offset=".25" stop-color="#4f87ed"/><stop offset=".5" stop-color="#9476c5"/><stop offset=".75" stop-color="#bc688e"/><stop offset="1" stop-color="#d6645d"/></linearGradient></defs><path d="M11.04 19.32Q12 21.51 12 24q0-2.49.93-4.68.96-2.19 2.58-3.81t3.81-2.55Q21.51 12 24 12q-2.49 0-4.68-.93a12.3 12.3 0 0 1-3.81-2.58 12.3 12.3 0 0 1-2.58-3.81Q12 2.49 12 0q0 2.49-.96 4.68-.93 2.19-2.55 3.81a12.3 12.3 0 0 1-3.81 2.58Q2.49 12 0 12q2.49 0 4.68.96 2.19.93 3.81 2.55t2.55 3.81" fill="url(#hwf-gemini)"/></svg>';

// ---------- copy ----------
// the greeting: greetings.ts emptyThreadGreeting with no stored name,
// "{time of day}. {question}?", the time of day off the visitor's clock with
// timeOfDayGreeting's buckets (before 5 or from 22 'Still up', to 12 'Good
// morning', to 17 'Good afternoon', then 'Good evening'); the question is
// fixed, EMPTY_THREAD_QUESTIONS[7], so every visitor sees one line.
const timeOfDayGreeting = (now) => {
  return 'Good evening'; // the ad pins main/new-chat.png's evening greeting so every frame reads the same
  const hour = now.getHours();
  if (hour < 5 || hour >= 22) return 'Still up';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};
const QUESTION = 'What\'s first'; // main/new-chat.png: "Good evening. What's first?"
const PLACEHOLDER = 'How can superbot help you today?';
const PLACEHOLDER_LIVE = 'Queues until this turn ends'; // main's placeholder while a turn runs (main/thread-streaming.png)
// the context line an empty chat reads (ContextStatusLine.tsx baseline, the
// always-on tokens against the window: 12k of 200k, a 6% bar); main shows
// the name 'Context', the mono reading, then the track
const CTX = { value: '12k of 200k', fill: 0.06 };
const CHIPS = [['Write', IC.penLine], ['Code', IC.code], ['Research', IC.search], ['Browse', IC.globe], ['Automate', IC.workflow]];
const MODELS = {
  superbot: { label: 'superbot', mark: () => `<span class="hwf-platglitch">${glitchMark()}</span>` },
  gemini: { label: 'Gemini 3 Pro Image', mark: () => `<span class="hwf-platicon">${GEMINI}</span>` },
};

// ---------- the sidebar's rows ----------
// a row's mark: the Superbot tile (black, the white face), or a vendor's
// brand tile (the page's #sb-ic-* symbols on the hub's --brand-* grounds)
const SB_TILE = '<img src="assets/brand/mono-mark-white.svg" alt="" width="12" height="12"/>';
const MARK = (app) => app === 'superbot'
  ? `<i class="hwf-mk sb" aria-hidden="true">${SB_TILE}</i>`
  : app === 'git'
    ? `<i class="hwf-mk git" aria-hidden="true">${LU(IC.folderGit)}</i>`
    : `<i class="hwf-mk app-${app}" aria-hidden="true"><svg><use href="#sb-ic-${app}"/></svg></i>`;
// a pinned card wears the provider tile (main: data-provider-tile="superbot", the app icon)
const PIN_MARK = (app) => app === 'superbot'
  ? '<i class="hwf-mk sbapp" aria-hidden="true"><img src="assets/brand/superbot-app-icon.png" alt="" width="48" height="48" draggable="false"/></i>'
  : MARK(app);
const pinRow = ([app, title, preview]) => `<span class="hwf-row pin">${PIN_MARK(app)}<span class="hwf-tx"><span class="t">${title}</span><small>${preview}</small></span></span>`;
const chatRow = ([app, title, when]) => `<span class="hwf-row">${MARK(app)}<span class="hwf-tx"><span class="t">${title}</span></span><em>${when}</em></span>`;
// the Chat lane (2026-09-26, the user: "add some mock chatgpt chats too"):
// the list's own voice, Pinned cards then Recent rows in time order
const PINNED = [
  ['superbot', 'Cheapest GPUs on RunPod', 'Here are the three cheapest tiers right now.'],
];
const RECENT = [
  ['superbot', 'Name ideas for the CLI', '2:14 PM'],
  ['superbot', 'Codex lost its MCP servers', '1:11 PM'],
  ['superbot', 'Rules in Cursor and Claude Code', '1:08 PM'],
  ['openai', 'Plan the Lisbon offsite', 'Sep 24'],
  ['claude', 'Review the auth middleware', 'Sep 23'],
  ['claude', 'Which agent used the most context?', 'Sep 23'],
];
const bucket = (label, tools = '') => `<div class="hwf-bucket"><span>${label}</span>${tools}</div>`;
const RECENT_TOOLS = '<span class="hwf-bucket-tools">' +
  `<i class="hwf-ib">${LU(IC.filter)}</i><span class="hwf-zoom"><i class="hwf-ib">${LU(IC.minus)}</i><i class="hwf-ib">${LU(IC.plus)}</i></span></span>`;
const CHAT_LANE =
  `<span class="hwf-newchat"><i aria-hidden="true">${LU(IC.plus)}</i>New chat</span>` +
  `<section class="hwf-sect">${bucket('Pinned')}${PINNED.map(pinRow).join('')}</section>` +
  `<section class="hwf-sect recent">${bucket('Recent', RECENT_TOOLS)}${RECENT.map(chatRow).join('')}</section>`;
// the Code lane (the user: "let user click "Code" tab to see imported
// cursor, devin mix with 1 expanded maybe and the default project chat"):
// Sidebar.tsx projects-new-row + ProjectRows.tsx at main's row metrics. The
// head row IS the project's chat (no separate "Project chat" row since
// 2026-09-23), one project open with its imported Cursor and Devin chats.
const PROJECT = (p) => `<div class="hwf-proj${p.open ? ' open' : ''}">` +
  `<span class="hwf-row proj" title="${p.title}, Project chat"><i class="hwf-fold" aria-hidden="true">${LU(IC.chevron)}</i>${MARK(p.origin)}` +
  `<span class="hwf-tx"><span class="t">${p.title}</span><small>${p.label}</small></span>` +
  `<em>${p.when}</em>${p.open ? `<b class="hwf-count">${p.chats.length}</b>` : ''}</span>` +
  (p.open ? `<div class="hwf-proj-chats">${p.chats.map(chatRow).join('')}</div>` : '') + '</div>';
const CODE_LANE =
  '<div class="hwf-code-new">' +
  `<span class="hwf-newchat"><i aria-hidden="true">${LU(IC.plus)}</i>New project</span>` +
  `<span class="hwf-newchat import"><i aria-hidden="true">${LU(IC.download)}</i>Import</span></div>` +
  `<section class="hwf-sect">${bucket('Today')}` +
  PROJECT({ title: 'checkout-service', origin: 'cursor', label: 'Cursor', when: '2:41 PM', open: true, chats: [
    ['devin', 'Retry the Stripe webhook on 5xx', '2:41 PM'],
    ['cursor', 'Add idempotency keys to /charge', '11:02 AM'],
    ['devin', 'Bump Node to 22 in CI', '9:15 AM'],
  ] }) +
  PROJECT({ title: 'mobile-app', origin: 'cursor', label: 'Cursor', when: '1:20 PM' }) + '</section>' +
  `<section class="hwf-sect">${bucket('Yesterday')}${PROJECT({ title: 'infra', origin: 'git', label: 'Git repository', when: 'Sep 25' })}</section>` +
  `<section class="hwf-sect">${bucket('Earlier')}${PROJECT({ title: 'docs-site', origin: 'cursor', label: 'Cursor', when: 'Sep 22' })}</section>`;

// the account card, v00-crisper (account-widgets/variants/v00-crisper): the
// avatar with its status dot, the address over the tier, Bug / Gift /
// Settings (Settings wears the unread dot), the outlined Upgrade, the usage meter
const ACCOUNT =
  '<div class="hwf-acct-card"><div class="hwf-acct-bar">' +
  '<span class="hwf-avatar">H<i></i></span>' +
  `<span class="hwf-names"><b>hi@ezo.dev</b><span class="hwf-plan"><i class="hwf-tier">${SB_TILE}</i>Free</span></span>` +
  `<span class="hwf-tools"><i class="hwf-tool">${LU(IC.bug)}</i><i class="hwf-tool">${LU(IC.gift)}</i><i class="hwf-tool hwf-dot">${LU(IC.settings)}</i></span></div>` +
  '<span class="hwf-upgrade">Upgrade</span>' +
  '<span class="hwf-usage"><span>Usage</span><i class="hwf-meter"><i></i></i><span>18%</span></span></div>';

// ---------- the pane ----------
const PANE_HEAD =
  '<header class="hwf-head">' +
  `<span class="hwf-head-lead"><i class="hwf-ib boxed hwf-showside" aria-hidden="true">${LU(IC.panelLeftOpen)}</i><span class="hwf-title"><span class="hwf-title-t">New chat</span>${LU(IC.chevron)}</span></span>` +
  `<span class="hwf-search">${LU(IC.search)}<span class="hwf-search-l">Search</span><kbd>⌘K</kbd></span>` +
  `<span class="hwf-head-act"><i class="hwf-ib boxed" aria-hidden="true">${LU(IC.panelRightOpen)}</i></span>` +
  '</header>' +
  // the thread toolbar band: main draws it only once the chat has a thread
  `<div class="hwf-band2"><i class="hwf-ib">${LU(IC.refresh)}</i><i class="hwf-ib">${LU(IC.share)}</i><i class="hwf-ib boxed">${LU(IC.globe)}</i></div>`;
const COMPOSER =
  '<div class="hwf-crow"><div class="hwf-composer">' +
  `<div class="hwf-input"><span class="hwf-ph">${PLACEHOLDER}</span><span class="hwf-draft"><span class="hwf-draft-t"></span><i class="hwf-caret"></i></span></div>` +
  '<div class="hwf-foot">' +
  `<span class="hwf-plus">${CL(CLI.plus)}</span>` +
  '<span class="hwf-super"><span class="hwf-super-l">SUPER</span><span class="hwf-tag"><i></i><b>OFF</b></span></span>' +
  '<span class="hwf-right">' +
  `<span class="hwf-plat"><span class="hwf-plat-mark"></span><span class="hwf-plat-l"></span>${CL(CLI.chevron)}</span>` +
  `<span class="hwf-computer">${CL(CLI.computer)}</span>` +
  `<span class="hwf-mic">${CL(CLI.mic)}</span>` +
  `<span class="hwf-send">${CL(CLI.send, ' arrow')}${LU(IC.stop)}</span>` +
  '</span></div></div>' +
  `<div class="hwf-cline"><span class="hwf-ctx"><span class="nm">Context</span><span class="v">${CTX.value}</span><i class="trk"><i style="width:${CTX.fill * 100}%"></i></i></span>` +
  '<p class="hwf-ai">superbot is AI and can make mistakes.</p></div></div>';
const TAIL = `<div class="hwf-tail"><div class="hwf-chips">${CHIPS.map(([l, d]) => `<span class="hwf-chip">${LU(d)}<span>${l}</span></span>`).join('')}</div></div>`;

// the thread's own Recent row, at the head of the list while the chat has a
// thread: a superbot chat, its time main's same-day stamp (sidebar-format.ts
// toLocaleTimeString en-US, hour numeric, minute 2-digit) off the visitor's
// clock, as the greeting reads it
// while a turn runs main shows its elapsed seconds after a status dot and a progress track under
// the row (main/thread-streaming.png: "5s"); settled, the stamp (fixed: the evening the greeting names)
const LIVE_ROW = (now) => `<span class="hwf-row hwf-live" hidden>${MARK('superbot')}<span class="hwf-tx"><span class="t">New chat</span></span>` +
  `<em><b class="hwf-ldot"></b><span class="hwf-lt">6:42 PM</span></em><i class="hwf-prog" aria-hidden="true"></i></span>`;

// Inter (hero-workspace.css @font-face, main's bundled face) is fetched only
// once text asks for it; ask at build, seconds before the reveal, so the
// frame never swaps faces on screen
const warmFonts = () => {
  const f = document.fonts;
  if (!f || typeof f.load !== 'function') return;
  for (const w of [400, 500, 600, 700]) f.load(`${w} 13px Inter`).catch(() => {});
};

// ---------- the ad's HUD roster (was hero-workspace.js swapHud) ----------
// The shared markup keeps OUR roster for chaos, sphere and realui; this arm
// draws the ad's vendor discs in image-2 order (ChatGPT, Claude, Cursor,
// Hermes) after the ringed Superbot disc. Hermes is the app's own icon, so
// its image fills the disc. The Servers menu (.hud-menu, shown only by
// .hud.menu-open) gains the same Hermes row ahead of its Add divider.
const HERMES_IMG = '<img src="assets/brand/chaos/hermes.png" alt="" width="44" height="44" loading="lazy"/>';
// main/new-chat.png's stack: Claude (its usage ring lit), the selected Superbot disc, ChatGPT
const AD_DISCS =
  '<span class="hud-disc" data-app="openai"><svg><use href="#sb-ic-openai"/></svg></span>';
const AD_LEAD = '<span class="hud-disc hwf-warn" data-app="claude"><svg><use href="#sb-ic-claude"/></svg></span>';
const AD_MENU_ROW =
  `<span class="hud-menu-row"><i class="hud-menu-art logo" data-app="hermes">${HERMES_IMG}</i>` +
  '<span class="hud-menu-tx"><b>Hermes Agent</b></span></span>';
function swapHud(hud) {
  const discs = hud.querySelector('.hud-discs');
  const sb = discs?.querySelector('.hud-disc.sb');
  if (!sb || discs.dataset.hwHud) return;
  discs.dataset.hwHud = '1';
  while (sb.nextSibling) sb.nextSibling.remove();
  sb.insertAdjacentHTML('afterend', AD_DISCS);
  sb.insertAdjacentHTML('beforebegin', AD_LEAD);
  const menuDiv = hud.querySelector('.hud-menu .hud-menu-div');
  if (menuDiv) menuDiv.insertAdjacentHTML('beforebegin', AD_MENU_ROW);
}

const built = new WeakMap();

export function buildFrontend(hub) {
  if (built.has(hub)) return built.get(hub);
  const oldSide = hub.querySelector(':scope > .side');
  const oldMain = hub.querySelector(':scope > .main');
  const hud = hub.querySelector('.hud');
  const mark = hud?.querySelector('.hud-mark');
  if (!hud || !mark) return null;
  warmFonts();

  // ---- the HUD: main's hud-row (the mark, the wordmark over the stack) ----
  swapHud(hud);
  const menu = hud.querySelector('.hud-menu');
  const discs = hud.querySelector('.hud-discs');
  const word = hud.querySelector('.hud-word');
  // the stack after the discs: main's chevron (hud-expand), then the '+'
  discs.insertAdjacentHTML('beforeend', `<span class="hud-disc hwf-exp">${LU(IC.chevron)}</span><span class="hud-disc add">${LU(IC.plus)}</span>`);
  const row = document.createElement('div');
  row.className = 'hwf-hud-row';
  const text = document.createElement('div');
  text.className = 'hud-text';
  const line = document.createElement('div');
  line.className = 'hwf-title-line';
  line.append(word);
  text.append(line, discs);
  row.append(mark, text);
  hud.replaceChildren(row);
  if (menu) hud.append(menu);

  // ---- the frame ----
  const box = document.createElement('div');
  box.className = 'hwf';
  box.innerHTML =
    '<aside class="hwf-side">' +
    `<div class="hwf-band inner"><i class="hwf-ib boxed" aria-hidden="true">${LU(IC.panelLeftClose)}</i></div>` +
    `<div class="hwf-setup inner"><span class="hwf-setup-row"><i aria-hidden="true">${LU(IC.listChecks)}</i><span>Setup</span></span><b class="hwf-badge">5</b></div>` +
    '<div class="hwf-lanes inner"><div class="hwf-tabs" role="tablist" aria-label="Lane view">' +
    `<button type="button" class="hwf-tab" id="hw-tab-chat" role="tab" aria-controls="hw-lane-chat" data-track="hero-tab-chat">${LU(IC.chat, 1.75)}<span>Chat</span></button>` +
    `<button type="button" class="hwf-tab" id="hw-tab-code" role="tab" aria-controls="hw-lane-code" data-track="hero-tab-code">${LU(IC.code, 1.75)}<span>Code</span></button>` +
    '</div>' +
    `<div class="hwf-lane" id="hw-lane-chat" role="tabpanel" aria-labelledby="hw-tab-chat">${CHAT_LANE}</div>` +
    `<div class="hwf-lane" id="hw-lane-code" role="tabpanel" aria-labelledby="hw-tab-code" hidden>${CODE_LANE}</div></div>` +
    `<div class="hwf-acct inner">${ACCOUNT}</div>` +
    '</aside><div class="hwf-split inner" aria-hidden="true"></div>' +
    `<section class="hwf-pane inner" data-new="1">${PANE_HEAD}<div class="hwf-feed"></div>${COMPOSER}${TAIL}</section>`;
  const side = box.querySelector('.hwf-side');
  side.insertBefore(hud, side.querySelector('.hwf-setup'));
  oldSide?.remove();
  oldMain?.remove();
  hub.append(box);
  hub.dataset.hwf = '1';

  // ---- the greeting (ThreadIdle variant="hero"): the feed's first child ----
  const pane = box.querySelector('.hwf-pane');
  const feed = pane.querySelector('.hwf-feed');
  const hero = document.createElement('div');
  hero.className = 'hwf-hero';
  hero.innerHTML = `<span class="hwf-hero-mark">${glitchMark()}</span><h2 class="hwf-greet"><span>${timeOfDayGreeting(new Date())}.</span> <span>${QUESTION}?</span></h2>`;
  feed.append(hero);

  const composer = pane.querySelector('.hwf-composer');
  const send = pane.querySelector('.hwf-send');
  const draftT = pane.querySelector('.hwf-draft-t');
  const tail = pane.querySelector('.hwf-tail');
  const titleT = pane.querySelector('.hwf-title-t');
  const platMark = pane.querySelector('.hwf-plat-mark');
  const platL = pane.querySelector('.hwf-plat-l');
  const band2 = pane.querySelector('.hwf-band2');
  // the thread's Recent row: after the Recent head, ahead of every fixture row
  box.querySelector('.hwf-sect.recent > .hwf-bucket').insertAdjacentHTML('afterend', LIVE_ROW(new Date()));
  const liveRow = box.querySelector('.hwf-row.hwf-live');
  const liveT = liveRow.querySelector('.t');

  // ---- the one scale ----
  let fitKey = '';
  const fit = () => {
    const w = hub.clientWidth, h = hub.clientHeight;
    if (!w || !h) return;
    // the page's own zoom tier (site.css html { zoom: 1.25 } from 1200px)
    // enlarges what renders, so the floor is read in rendered px
    const z = typeof hub.currentCSSZoom === 'number' && hub.currentCSSZoom > 0 ? hub.currentCSSZoom : 1;
    const wide = w * z >= WIDE_HUB;
    const s = wide ? w / DESIGN_W : NARROW_SCALE;
    const key = `${w}x${h}x${z}`;
    if (key === fitKey) return;
    fitKey = key;
    box.style.width = `${(w / s).toFixed(3)}px`;
    box.style.height = `${(h / s).toFixed(3)}px`;
    box.style.transform = `scale(${s.toFixed(6)})`;
    box.dataset.side = wide ? '1' : '0';
    ui?.onFit?.();
  };
  let ui = null;
  fit();
  new ResizeObserver(fit).observe(hub);

  // ---- the setters: each writes only on change ----
  const st = {};
  const put = (k, v, write) => { if (st[k] !== v) { st[k] = v; write(v); } };
  const setDraft = (text) => put('draft', String(text ?? ''), (v) => {
    draftT.textContent = v;
    composer.toggleAttribute('data-draft', v !== '');
  });
  const setCaret = (on) => put('caret', !!on, (v) => composer.toggleAttribute('data-caret', v));
  const setSendArmed = (on) => put('armed', !!on, (v) => send.toggleAttribute('data-armed', v));
  const ph = pane.querySelector('.hwf-ph');
  const plat = pane.querySelector('.hwf-plat');
  // a live turn: send reads as main's stop square, SUPER dims, and the
  // placeholder is the queue note main shows while a turn runs
  const setSending = (on) => put('sending', !!on, (v) => {
    composer.toggleAttribute('data-sending', v);
    ph.textContent = v ? PLACEHOLDER_LIVE : PLACEHOLDER;
  });
  // the model chip: null / '' / 'superbot' is the glitch mascot and
  // 'superbot'; a Gemini name (string or { name, tile }) is main's switch
  // reading, 'Gemini 3 Pro Image' on the Gemini mark; any other vendor shows
  // its name on the given tile image
  const setModel = (m) => {
    const name = (m && typeof m === 'object' ? m.name : m) || 'superbot';
    const tile = m && typeof m === 'object' ? m.tile || '' : '';
    const k = /^superbot$/i.test(name) ? 'superbot' : /gemini/i.test(name) ? 'gemini' : `other|${name}|${tile}`;
    put('model', k, () => {
      if (MODELS[k]) {
        platMark.innerHTML = MODELS[k].mark();
        platL.textContent = MODELS[k].label;
      } else {
        platMark.innerHTML = tile ? `<span class="hwf-platicon"><img src="${tile}" alt="" width="14" height="14"/></span>` : '';
        platL.textContent = name;
      }
      composer.dataset.model = MODELS[k] ? k : 'other';
    });
  };
  // the chip's swap motion (composer.tsx: it dips to .15 over 140ms, swaps,
  // pops 1.08 -> 1 over 400ms out-cubic); the caller passes the values
  const setModelFx = (opacity = 1, scale = 1) => {
    put('fxo', String(opacity), (v) => { plat.style.opacity = v === '1' ? '' : v; });
    put('fxs', String(scale), (v) => { plat.style.transform = v === '1' ? '' : `scale(${v})`; });
  };
  const setTitle = (text) => put('title', String(text ?? ''), (v) => { titleT.textContent = v; liveT.textContent = v; });
  // p is already main's eased collapse (see the contract): the tail's
  // flex-grow is p itself, and everything the send brings in or takes out
  // rides that same curve, so no frame of the glide is a step
  const setNewChat = (p) => {
    p = Math.min(1, Math.max(0, Number(p) || 0));
    if (hero.parentNode !== feed) feed.prepend(hero);
    // the chat is new only at p = 1; below it the thread exists (the band,
    // the thread's rows, its Recent row)
    put('isNew', p >= 1, (v) => { pane.dataset.new = v ? '1' : '0'; liveRow.hidden = v; });
    put('thread', p <= 0, (v) => pane.toggleAttribute('data-thread', v));
    const k = p.toFixed(4);
    put('grow', k, (v) => { tail.style.flexGrow = v; });
    // the greeting fades out in its seat and leaves once the tail has closed
    put('heroOn', p > 0, (v) => { hero.hidden = !v; });
    put('heroOp', k, (v) => { hero.style.opacity = v === '1.0000' ? '' : v; });
    // the band opens as the tail closes: height and opacity 1 - p
    put('band', (1 - p).toFixed(4), (v) => { band2.style.setProperty('--hwf-band', v); });
  };
  const reset = () => {
    for (const n of [...feed.children]) if (n !== hero) n.remove();
    if (hero.parentNode !== feed) feed.prepend(hero);
    feed.scrollTop = 0;
    setDraft('');
    setCaret(false);
    setSendArmed(false);
    setSending(false);
    setModel(null);
    setModelFx(1, 1);
    setTitle('New chat');
    setNewChat(1);
  };

  ui = {
    pane, feed, composer, send, fit, onFit: null,
    setDraft, setCaret, setSendArmed, setSending, setModel, setModelFx, setNewChat, setTitle, reset,
    lanes: sidebarLanes(box),
  };
  reset();
  built.set(hub, ui);
  return ui;
}

// ---------- the sidebar's Chat | Code switch ----------
// A real control once the story holds (inert before, so a keyboard never
// lands on a picture still in flight): the arrows move and select as main's
// switch does (packages/ui lane-view-switch.tsx: Right/Down next, Left/Up
// previous, wrapping), Home/End jump; data-track feeds ga4's cta_click. The
// underline is main's 2px fg bar under the open tab's content.
const LANES = ['chat', 'code'];
function sidebarLanes(box) {
  const row = box.querySelector('.hwf-tabs');
  const tabs = LANES.map((l) => box.querySelector(`#hw-tab-${l}`));
  const panes = LANES.map((l) => box.querySelector(`#hw-lane-${l}`));
  let cur = null;
  const select = (lane, focus = false) => {
    if (lane !== cur) {
      cur = lane;
      tabs.forEach((b, i) => {
        const on = LANES[i] === lane;
        b.classList.toggle('on', on);
        b.setAttribute('aria-selected', String(on));
        b.tabIndex = on ? 0 : -1;
        panes[i].hidden = !on;
      });
    }
    if (focus) tabs[LANES.indexOf(lane)].focus();
  };
  tabs.forEach((b, i) => b.addEventListener('click', () => select(LANES[i])));
  row.addEventListener('keydown', (e) => {
    const i = tabs.indexOf(document.activeElement);
    if (i < 0) return;
    const n = tabs.length;
    const j = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? (i + 1) % n
      : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? (i - 1 + n) % n
        : e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : -1;
    if (j < 0) return;
    e.preventDefault();
    select(LANES[j], true);
  });
  let isLive = null;
  const live = (on) => { if (on !== isLive) { isLive = on; row.inert = !on; } };
  select('chat');
  live(false);
  return { select, live };
}
