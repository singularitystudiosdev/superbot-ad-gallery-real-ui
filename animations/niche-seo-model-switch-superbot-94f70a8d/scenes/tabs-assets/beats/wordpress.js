// WordPress beat, the finale: superbot publishes the 4 posts on the user's WordPress site. Its line streams, a connect
// card lands in the chat ("superbot connected to WordPress", "slowpour.coffee", then three checks ticking in turn:
// "Uploaded 4 featured images", "Set categories, tags and SEO meta", "Published 4 posts") with a mini browser window
// under it; the card holds (CARD_HOLD) and the window opens to full frame (GROW), the grammar of the webdev remake's
// vercel.js. Full frame is a real-looking light Chrome window with two tabs. Phase A, tab "Posts ‹ Slow Pour": a
// faithful WordPress 6.x admin (the admin bar, the left admin menu with Posts current, the Posts list screen); the
// list starts on "No posts found." and the 4 posts land in it one by one (title, author, category, tags, the focus
// keyphrase with its green SEO dot, the publish date), the counts with them, then the green notice "4 posts
// published." drops in. Phase B: the pointer clicks the second tab already in the strip, "Performance · Search
// Console": the Search Console Performance report for slowpour.coffee loads (its thin progress bar), Total clicks and
// Total impressions count up while the chart draws itself left to right, flat for the first two thirds, then past
// the "4 posts published" marker it climbs; the Queries table under it lands its 4 target keywords, each position
// with a green up arrow. The WordPress tab keeps its place in the strip to the last frame. The final state holds
// (READ) before the end card.
//
// There is ONE browser window, on a layer in the scene root (outside the camera). While the card sits in the chat the
// layer is pinned over the card's window frame; GROW interpolates it from there to the whole frame. The window is laid
// out once at a design size (the frame divided by APP_SCALE) and scaled to the layer, so the mini window and the full
// frame are the same pixels at two sizes. On a portrait frame (4:5) everything takes its tablet-width layout:
// wp-admin auto-folds its menu to icons and keeps only the Title and Date columns, Search Console hides its nav
// behind the menu button and stacks its four metric tiles two by two.
// Pure function of t: every moving value is written from t; the only measuring is of laid-out boxes (the second tab
// for the pointer, the chart's plot box), which do not move with t.
import { lerp, seg, outCubic, inOutCubic, streamCount, press } from '../../../lib.js';

const SAY = 'Publishing them to your WordPress site.';
const SITE = 'Slow Pour';
const DOMAIN = 'slowpour.coffee';
const AUTHOR = 'Dana Reyes';
const WP_TITLE = 'Posts ‹ Slow Pour';
const WP_URL = 'slowpour.coffee/wp-admin/edit.php';
const GS_TITLE = 'Performance · Search Console';
const GS_URL = 'search.google.com/search-console/performance/search-analytics?resource_id=sc-domain:slowpour.coffee';
// the 4 posts as wp-admin lists them (newest first): title, tags, focus keyphrase, publish time
const POSTS = [
  ['The Best AeroPress Recipe for Beginners', 'aeropress, recipes', 'aeropress recipe', '9:17 am'],
  ['French Press Grind Size: What Coarse Really Means', 'french press, grind', 'french press grind size', '9:16 am'],
  ['Pour Over Coffee Ratio: How Much Coffee per Cup', 'pour over, ratios', 'pour over coffee ratio', '9:15 am'],
  ['Cold Brew Ratio: The 1:8 Recipe for Smooth Coffee at Home', 'cold brew, ratios', 'cold brew ratio', '9:14 am'],
];
const DATE = '2026/10/03';
// Search Console: the 28 days (9/14/26 to 10/11/26), impressions and clicks a day. Flat for the first two thirds,
// then the posts go live on 10/3 (day 19, the marker) and both climb.
const DAY0 = Date.UTC(2026, 8, 14);
const MARK = 19;
const IMPR = [1180, 1240, 1210, 1160, 1230, 1270, 1190, 1150, 1220, 1260, 1200, 1170, 1240, 1210, 1180, 1250, 1230, 1190, 1220,
  1420, 1910, 2580, 3390, 4420, 5610, 7030, 8460, 9820];
const CLICKS = [14, 17, 15, 12, 16, 18, 14, 13, 17, 16, 15, 13, 18, 16, 14, 17, 16, 15, 17,
  22, 34, 52, 77, 108, 151, 198, 262, 334];
const TOTALS = { clicks: 1600, impr: 48200 };    // what the tiles land on
const AX = { clicks: 450, impr: 10500 };          // each metric's own axis (GSC scales them apart)
// the Queries table: query, clicks, impressions, position
const QUERIES = [
  ['cold brew ratio', '412', '9,860', '3.2'],
  ['pour over coffee ratio', '351', '8,420', '4.1'],
  ['aeropress recipe', '298', '7,130', '2.8'],
  ['french press grind size', '236', '6,050', '5.0'],
];

// design metrics (px of the window, before the scale to the frame)
const APP_SCALE = { wide: 1.5, tall: 1.2 };        // full frame: the window's px to frame px

// timing (seconds from the reply start, or from the card or the full frame where noted)
const CPS = 80;                                  // the reply line streams (the source's play.js)
const CARD_AT = 0.25;                            // the line streams, then the card lands
const CARD_IN = 0.3;                             // the card rising into the thread
const CHECK_AT = 0.3;                            // the card landing to the first check
const CHECK_STAGGER = 0.2;                       // one check to the next
const POP = 0.16;                                // a check popping in
const CARD_HOLD = 0.3; /* deliberate */          // the last check in, the card holds before it opens (play.js)
const GROW = 0.4; /* deliberate */               // the window opens to full frame (play.js)
const ROW_AT = 0.25;                             // full frame, then the first post lands in the list
const ROW_STAGGER = 0.18;                        // one post to the next
const ROW_IN = 0.2;                              // a post landing (its row fading up from a soft yellow)
const NOTICE_AT = 0.15;                          // the last post in, then the notice drops in (the chime)
const NOTICE_IN = 0.22;                          // the notice opening
const LIST_READ = 0.9; /* deliberate */          // the list complete, read before the pointer sets off
const PTR_MOVE = 0.5;                            // the pointer travelling to the second tab
const PRESS_AT = 0.05;                           // arrived, then the press
const SWITCH_AT = 0.1;                           // the press, then the tab is active (list held >= 1.5 s by then)
const LOAD = 0.3;                                // Search Console's progress bar, then the chart starts drawing
const DRAW = 1.4;                                // the chart drawing left to right, the totals counting with it
const Q_AT = 0.7;                                // the draw starts, then the first query row lands
const Q_STAGGER = 0.12;                          // one query row to the next
const Q_IN = 0.2;
const READ = 1.6; /* deliberate */               // the final state holds, readable, before the scene's fade (>= 1.5)
const RADIUS = 8;                                // the card's window radius, eased to 0 at full frame

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const svg = (d, cls = 'cr-i', vb = '0 0 24 24') => `<svg class="${cls}" viewBox="${vb}" aria-hidden="true">${d}</svg>`;
const I = {
  back: svg('<path d="M19 12H5M11 6l-6 6 6 6"/>'),
  fwd: svg('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  reload: svg('<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3L19.5 9"/><path d="M19.5 4v5h-5"/>'),
  tune: svg('<path d="M4 8h9M17 8h3M4 16h3M11 16h9"/><circle cx="15" cy="8" r="2"/><circle cx="9" cy="16" r="2"/>'),
  star: svg('<path d="M12 4l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 16.4l-4.8 2.5.9-5.4-3.9-3.8 5.4-.8z"/>'),
  kebab: svg('<circle cx="12" cy="5.5" r="1.4" class="cr-f"/><circle cx="12" cy="12" r="1.4" class="cr-f"/><circle cx="12" cy="18.5" r="1.4" class="cr-f"/>'),
  close: svg('<path d="M7 7l10 10M17 7 7 17"/>'),
  plus: svg('<path d="M12 5v14M5 12h14"/>'),
  ok: '<svg class="wc-ck" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  img: svg('<rect x="3.5" y="5" width="17" height="14" rx="2"/><path d="M3.5 16l5-5 4 4 3-3 5 5"/><circle cx="15.5" cy="9.5" r="1.4"/>', 'wc-gi'),
  tag: svg('<path d="M3.5 12.2V4.5h7.7l9.3 9.3-7.7 7.7z"/><circle cx="7.8" cy="8.8" r="1.4"/>', 'wc-gi'),
  pub: svg('<path d="M12 3.5v11M7.5 8 12 3.5 16.5 8"/><path d="M4.5 14.5v5h15v-5"/>', 'wc-gi'),
};
// wp-admin's dashicons, drawn as 20 x 20 filled glyphs
const dash = (d) => `<svg class="wp-di" viewBox="0 0 20 20" aria-hidden="true"><path fill-rule="evenodd" d="${d}"/></svg>`;
const WP_W = '<svg class="ab-w" viewBox="0 0 24 24" aria-hidden="true"><path d="M21.469 6.825c.84 1.537 1.318 3.3 1.318 5.175 0 3.979-2.156 7.456-5.363 9.325l3.295-9.527c.615-1.54.82-2.771.82-3.864 0-.405-.026-.78-.07-1.11m-7.981.105c.647-.03 1.232-.105 1.232-.105.582-.075.514-.93-.067-.899 0 0-1.755.135-2.88.135-1.064 0-2.85-.15-2.85-.15-.585-.03-.661.855-.075.885 0 0 .54.061 1.125.09l1.68 4.605-2.37 7.08L5.354 6.9c.649-.03 1.234-.1 1.234-.1.585-.075.516-.93-.065-.896 0 0-1.746.138-2.874.138-.2 0-.438-.008-.69-.015C4.911 3.15 8.235 1.215 12 1.215c2.809 0 5.365 1.072 7.286 2.833-.046-.003-.091-.009-.141-.009-1.06 0-1.812.923-1.812 1.914 0 .89.513 1.643 1.06 2.531.411.72.89 1.643.89 2.977 0 .915-.354 1.994-.821 3.479l-1.075 3.585-3.9-11.61.001.014zM12 22.784c-1.059 0-2.081-.153-3.048-.437l3.237-9.406 3.315 9.087c.024.053.05.101.078.149-1.12.393-2.325.609-3.582.609M1.211 12c0-1.564.336-3.05.935-4.39L7.29 21.709C3.694 19.96 1.212 16.271 1.211 12M12 0C5.385 0 0 5.385 0 12s5.385 12 12 12 12-5.385 12-12S18.615 0 12 0"/></svg>';
const D = {
  dashboard: dash('M10 3.5a7.5 7.5 0 0 0-6.6 11.1h13.2A7.5 7.5 0 0 0 10 3.5zm-.9 9.2 3.7-4.7-1.9 5.5a1.6 1.6 0 1 1-1.8-.8z'),
  posts: dash('M10.6 2.4 17.6 9.4l-1.4 1.4-1.3-.7-3.1 3.1.4 2.6-1.4 1.4-3-3-3.9 3.9-1-1 3.9-3.9-3-3 1.4-1.4 2.6.4 3.1-3.1-.7-1.3z'),
  media: dash('M3 4.5h14v11H3zm1.6 1.6v6.4l3.4-3.6 2.4 2.7 1.9-1.8 3.1 3.4V6.1zm9.3 1.2a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6z'),
  pages: dash('M6 2h7.2L17 5.8V16H6zm1.5 1.5v11h8V6.5h-3v-3zM3 5h1.6v12.4H14V19H3z'),
  comments: dash('M3 4h14v9.5H9.5L5.5 17v-3.5H3z'),
  appearance: dash('M14.6 2.4c.9 0 3 2.1 3 3 0 1.5-5 6.6-6 7.1l-2.5-2.5c.5-1 5.5-7.6 5.5-7.6zM7.6 11.4l2.1 2.1C9.6 15.6 8 17.6 2.8 17.6c1.1-1 1-2.6 1.6-4.1.5-1.4 2.2-2.1 3.2-2.1z'),
  plugins: dash('M6.8 2h1.6v4h3.2V2h1.6v4H15v3.2a4.8 4.8 0 0 1-4.2 4.7V18H9.2v-4.1A4.8 4.8 0 0 1 5 9.2V6h1.8z'),
  users: dash('M10 2.8a3.3 3.3 0 1 1 0 6.6 3.3 3.3 0 0 1 0-6.6zM3.4 17.2c0-3.7 3-6.2 6.6-6.2s6.6 2.5 6.6 6.2z'),
  tools: dash('M16.8 5l-2.7 2.7-1.9-.3-.3-1.9L14.6 2.8a4.4 4.4 0 0 0-5.7 5.5L3.2 14a1.6 1.6 0 0 0 2.3 2.3l5.7-5.7A4.4 4.4 0 0 0 16.8 5z'),
  settings: dash('M3 4.6h3.1a2.1 2.1 0 0 1 3.9 0H17v1.6H10a2.1 2.1 0 0 1-3.9 0H3zm0 4.6h8.1a2.1 2.1 0 0 1 3.9 0H17v1.6h-2a2.1 2.1 0 0 1-3.9 0H3zm0 4.6h2.1a2.1 2.1 0 0 1 3.9 0H17v1.6H9a2.1 2.1 0 0 1-3.9 0H3z'),
  collapse: dash('M10 2.5a7.5 7.5 0 1 1 0 15 7.5 7.5 0 0 1 0-15zm1.9 3.7L7.5 10l4.4 3.8z'),
  home: dash('M10 2.8 2.4 9.6h2.2v7.6h4.1v-4.6h2.6v4.6h4.1V9.6h2.2z'),
  comment: dash('M3 4h14v9.5H9.5L5.5 17v-3.5H3z'),
  plus: dash('M8.9 3.5h2.2v5.4h5.4v2.2h-5.4v5.4H8.9v-5.4H3.5V8.9h5.4z'),
};
// Search Console's Material glyphs (24 x 24, filled)
const mi = (d, cls = 'gs-i') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;
const M = {
  menu: mi('M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z'),
  search: mi('M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z'),
  help: mi('M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z'),
  bell: mi('M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z'),
  apps: mi('M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z'),
  home: mi('M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z'),
  trend: mi('M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z'),
  page: mi('M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z'),
  tree: mi('M22 11V3h-7v3H9V3H2v8h7V8h2v10h4v3h7v-8h-7v3h-2V8h2v3z'),
  globe: mi('M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm6.93 6h-2.95a15.65 15.65 0 0 0-1.38-3.56A8.03 8.03 0 0 1 18.93 8zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2s.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56A7.99 7.99 0 0 1 5.08 16zm2.95-8H5.08a7.99 7.99 0 0 1 4.33-3.56A15.65 15.65 0 0 0 8.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2s.07-1.35.16-2h4.68c.09.65.16 1.32.16 2s-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95a8.03 8.03 0 0 1-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2s-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z'),
  caret: mi('M7 10l5 5 5-5z'),
  edit: mi('M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z'),
  add: mi('M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z'),
  export: mi('M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2z'),
  boxOn: mi('M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z', 'gs-cb'),
  boxOff: mi('M19 5v14H5V5h14m0-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z', 'gs-cb'),
  up: mi('M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z', 'gs-up'),
  down: mi('M20 12l-1.41-1.41L13 16.17V4h-2v12.17l-5.58-5.59L4 12l8 8 8-8z', 'gs-dn'),
  filter: mi('M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z'),
  info: mi('M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z', 'gs-inf'),
};

// ---- the WordPress Posts screen (the rows' cells are filled in by layout(), per the frame's shape) ----
const MENU = [
  ['dashboard', 'Dashboard'], null, ['posts', 'Posts', true], ['media', 'Media'], ['pages', 'Pages'], ['comments', 'Comments'], null,
  ['appearance', 'Appearance'], ['plugins', 'Plugins'], ['users', 'Users'], ['tools', 'Tools'], ['settings', 'Settings'],
];
const SUBMENU = ['All Posts', 'Add New Post', 'Categories', 'Tags'];
function wpHTML(brand) {
  const head = (tall) => `<tr><td class="wp-cb"><i class="wp-box"></i></td><th class="wp-c-title wp-sort"><span>Title</span><i class="wp-arr"></i></th>${tall ? '' : '<th class="wp-c-author">Author</th><th class="wp-c-cat">Categories</th><th class="wp-c-tags">Tags</th><th class="wp-c-kw">Focus keyphrase</th><th class="wp-c-seo">SEO</th>'}<th class="wp-c-date wp-sort"><span>Date</span><i class="wp-arr"></i></th></tr>`;
  return (tall) => `<div class="wp">
    <div class="wp-bar">
      <span class="ab-it ab-logo">${WP_W}</span>
      <span class="ab-it">${D.home}<b>${esc(SITE)}</b></span>
      <span class="ab-it">${D.comment}<b>0</b></span>
      <span class="ab-it">${D.plus}<b>New</b></span>
      <span class="ab-r">Howdy, <b>${esc(AUTHOR)}</b><i class="ab-av"></i></span>
    </div>
    <div class="wp-body">
      <nav class="wp-menu">${MENU.map((m) => (m ? `<div class="wp-mi${m[2] ? ' on' : ''}">${D[m[0]]}<span>${m[1]}</span></div>${m[2] ? `<div class="wp-sub">${SUBMENU.map((s, i) => `<span${i === 0 ? ' class="on"' : ''}>${s}</span>`).join('')}</div>` : ''}` : '<i class="wp-sep"></i>')).join('')}
        <div class="wp-mi wp-col">${D.collapse}<span>Collapse menu</span></div>
      </nav>
      <main class="wp-main">
        <div class="wp-scr"><span>Screen Options<i></i></span><span>Help<i></i></span></div>
        <div class="wp-wrap">
          <div class="wp-h"><h1>Posts</h1><span class="wp-add">Add New Post</span></div>
          <div class="wp-nslot"><div class="wp-notice"><p>4 posts published.</p><i class="wp-x"></i></div></div>
          <div class="wp-subrow">
            <span class="wp-ss"><b>All <span class="wp-cnt">(0)</span></b> | <a>Published <span class="wp-cnt">(0)</span></a></span>
            <span class="wp-search"><i class="wp-in"></i><span class="wp-btn">Search Posts</span></span>
          </div>
          <div class="wp-tnav">
            <span class="wp-sel">Bulk actions</span><span class="wp-btn">Apply</span>
            <span class="wp-sel wp-sel-d">All dates</span><span class="wp-sel wp-sel-c">All Categories</span><span class="wp-btn wp-btn-f">Filter</span>
            <span class="wp-items">0 items</span>
          </div>
          <table class="wp-tbl">
            <thead>${head(tall)}</thead>
            <tbody>
              ${POSTS.map(([title, tags, kw, time]) => `<tr class="wp-row">
                <td class="wp-cb"><i class="wp-box"></i></td>
                <td class="wp-c-title"><a class="wp-rt">${esc(title)}</a></td>
                ${tall ? '' : `<td class="wp-c-author"><a>${esc(AUTHOR)}</a></td><td class="wp-c-cat"><a>Brewing</a></td><td class="wp-c-tags">${tags.split(', ').map((g) => `<a>${esc(g)}</a>`).join(', ')}</td><td class="wp-c-kw">${esc(kw)}</td><td class="wp-c-seo"><i class="wp-dot"></i></td>`}
                <td class="wp-c-date">Published<br>${DATE} at ${time}</td>
              </tr>`).join('')}
              <tr class="wp-none"><td colspan="${tall ? 3 : 8}">No posts found.</td></tr>
            </tbody>
            <tfoot>${head(tall)}</tfoot>
          </table>
        </div>
      </main>
    </div>
  </div>`;
}

// ---- the Search Console Performance report ----
const fmt = (v) => (v < 1000 ? String(Math.round(v)) : `${(v / 1000).toFixed(1)}K`);
const day = (i) => { const d = new Date(DAY0 + i * 86400000); return `${d.getUTCMonth() + 1}/${d.getUTCDate()}/26`; };
function gsHTML(brand, tall) {
  const tile = (cls, label, val, on) => `<div class="gs-t ${cls}${on ? ' on' : ''}">${on ? M.boxOn : M.boxOff}<span class="gs-tl">${label}</span>${M.info}<b class="gs-tv">${val}</b></div>`;
  return `<div class="gs${tall ? ' gs-narrow' : ''}">
    <div class="gs-load"><i></i></div>
    <header class="gs-top">${M.menu}<img class="gs-logo" src="${brand('gsc-logo-blue.svg')}" alt=""/><span class="gs-pn">Search Console</span>
      <span class="gs-q">${M.search}<span>Inspect any URL in "${esc(DOMAIN)}"</span></span>
      <span class="gs-tr">${M.help}${M.bell}${M.apps}<i class="gs-av">D</i></span></header>
    <div class="gs-body">
      <nav class="gs-nav">
        <span class="gs-prop">${M.globe}<b>${esc(DOMAIN)}</b>${M.caret}</span>
        <span class="gs-ni">${M.home}Overview</span>
        <span class="gs-ni on">${M.trend}Performance</span>
        <span class="gs-ni">${M.search}URL inspection</span>
        <span class="gs-nh">Indexing</span>
        <span class="gs-ni">${M.page}Pages</span>
        <span class="gs-ni">${M.tree}Sitemaps</span>
      </nav>
      <main class="gs-main">
        <div class="gs-h"><h1>Performance on Search results</h1><span class="gs-exp">${M.export}Export</span></div>
        <div class="gs-flt"><span class="gs-ch">Search type: Web${M.edit}</span><span class="gs-ch">Date: Last 28 days${M.edit}</span><span class="gs-ch gs-add">${M.add}Add filter</span><span class="gs-upd">Last updated: 3 hours ago</span></div>
        <section class="gs-card">
          <div class="gs-tiles">${tile('gs-cl', 'Total clicks', '0', true)}${tile('gs-im', 'Total impressions', '0', true)}${tile('gs-ct', 'Average CTR', '3.3%', false)}${tile('gs-po', 'Average position', '7.9', false)}</div>
          <div class="gs-chart"></div>
        </section>
        <section class="gs-card gs-qt">
          <div class="gs-tabs"><span class="on">Queries</span><span>Pages</span><span>Countries</span><span>Devices</span><span>Search appearance</span><span>Dates</span></div>
          <div class="gs-qh"><span>Top queries</span><span class="gs-sorted">${M.down}Clicks</span><span>Impressions</span><span>Position</span></div>
          ${QUERIES.map(([q, c, i, p]) => `<div class="gs-qr"><span>${esc(q)}</span><span>${c}</span><span>${i}</span><span>${M.up}${p}</span></div>`).join('')}
        </section>
      </main>
    </div>
  </div>`;
}
// the chart, drawn at the plot box's own px: gridlines, both axes, the marker, the two lines (clipped by the draw)
function chartSVG(w, h) {
  const L = 44, R = 52, Tp = 30, B = 26;
  const pw = w - L - R, ph = h - Tp - B;
  const x = (i) => L + (pw * i) / (IMPR.length - 1);
  const yI = (v) => Tp + ph * (1 - v / AX.impr), yC = (v) => Tp + ph * (1 - v / AX.clicks);
  const line = (arr, y) => arr.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join('');
  const grid = [0, 1, 2, 3].map((k) => {
    const gy = Tp + ph * (1 - k / 3);
    return `<line x1="${L}" x2="${L + pw}" y1="${gy.toFixed(1)}" y2="${gy.toFixed(1)}" class="gs-gl"/>
      <text x="${L - 8}" y="${(gy + 4).toFixed(1)}" text-anchor="end">${fmt((AX.clicks * k) / 3)}</text>
      <text x="${L + pw + 8}" y="${(gy + 4).toFixed(1)}">${fmt((AX.impr * k) / 3)}</text>`;
  }).join('');
  const ticks = [0, 4, 8, 12, 16, 20, 24].map((i) => `<text x="${x(i).toFixed(1)}" y="${(Tp + ph + 18).toFixed(1)}" text-anchor="middle">${day(i)}</text>`).join('');
  const mx = x(MARK);
  return `<svg class="gs-svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true">
    <defs><clipPath id="gs-clip"><rect class="gs-cr" x="0" y="0" width="0" height="${h}"/></clipPath></defs>
    <text x="2" y="14" class="gs-axl gs-axc">Clicks</text>
    <text x="${w - 2}" y="14" text-anchor="end" class="gs-axl gs-axi">Impressions</text>
    ${grid}${ticks}
    <g class="gs-mk"><line x1="${mx.toFixed(1)}" x2="${mx.toFixed(1)}" y1="${Tp - 4}" y2="${Tp + ph}" class="gs-ml"/>
      <rect x="${(mx - 62).toFixed(1)}" y="${Tp - 2}" width="124" height="22" rx="11" class="gs-mb"/>
      <text x="${mx.toFixed(1)}" y="${Tp + 13}" text-anchor="middle" class="gs-mt">4 posts published</text></g>
    <g clip-path="url(#gs-clip)">
      <path d="${line(IMPR, yI)}" class="gs-li"/>
      <path d="${line(CLICKS, yC)}" class="gs-lc"/>
    </g>
    <circle class="gs-hi" r="4.5"/><circle class="gs-hc" r="4.5"/>
  </svg>`;
}
// cumulative share of a series up to (fractional) day f, for the counting totals
const cum = (arr, f) => {
  let s = 0;
  for (let i = 0; i < arr.length; i++) { const w = Math.max(0, Math.min(1, f - i + 1)); s += arr[i] * w; }
  return s / arr.reduce((a, b) => a + b, 0);
};
const at = (arr, f) => { const i = Math.min(arr.length - 2, Math.floor(f)), u = f - i; return lerp(arr[i], arr[i + 1], Math.min(1, u)); };

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD_AT;                             // the connect card lands, the mini window in it
    T.ok = [0, 1, 2].map((i) => T.card + CHECK_AT + i * CHECK_STAGGER); // images, terms and meta, published: checks
    T.grow = T.ok[2] + POP + CARD_HOLD;               // the window starts opening
    T.full = T.grow + GROW;                           // full frame, the Posts screen
    T.row = POSTS.map((_, i) => T.full + ROW_AT + i * ROW_STAGGER); // each post lands in the list
    T.notice = T.row[POSTS.length - 1] + NOTICE_AT;   // "4 posts published." drops in (the chime)
    T.listed = T.notice + NOTICE_IN;                  // the list screen is complete
    T.ptr = T.listed + LIST_READ;                     // the pointer sets off for the second tab
    T.arrive = T.ptr + PTR_MOVE;
    T.press = T.arrive + PRESS_AT;
    T.sw = T.press + SWITCH_AT;                       // the Search Console tab is active (.gs shown)
    T.draw = T.sw + LOAD;                             // the chart starts drawing
    T.drawn = T.draw + DRAW;
    T.q = QUERIES.map((_, i) => T.draw + Q_AT + i * Q_STAGGER);
    T.settle = Math.max(T.drawn, T.q[QUERIES.length - 1] + Q_IN);
    T.end = T.settle + READ;                          // the final state holds, then the scene fades to the end card
    return T;
  },
  build(k, x) {
    const T = k.T;
    const wMark = x.brand('wordpress-logo.svg'), wDark = x.brand('wordpress-logo-dark.svg'), gBlue = x.brand('gsc-logo-blue.svg');

    // ---- the connect card in the chat ----
    const say = x.el(`<div class="qc-say wc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const steps = [
      [`<span class="wc-ct-i wc-ct-a">${I.img}</span>`, 'Uploaded <b>4 featured images</b>'],
      [`<span class="wc-ct-i wc-ct-a">${I.tag}</span>`, 'Set <b>categories, tags and SEO meta</b>'],
      [`<span class="wc-ct-i wc-ct-a">${I.pub}</span>`, 'Published <b>4 posts</b>'],
    ];
    const card = x.el(`<div class="wc-cc">
      <div class="wc-hd"><span class="wc-ct-i wc-ct-w"><img src="${wMark}" alt=""/></span><span class="wc-ht"><b>superbot connected to WordPress</b><small>${esc(DOMAIN)}</small></span></div>
      ${steps.map(([icon, txt]) => `<div class="wc-step">${icon}<span class="wc-tx">${txt}</span><span class="wc-ok"><i class="wc-spin"></i>${I.ok}</span></div>`).join('')}
      <div class="wc-shot"></div>
    </div>`);
    const shot = card.querySelector('.wc-shot');
    const checks = [...card.querySelectorAll('.wc-ok')].map((n) => ({ spin: n.querySelector('.wc-spin'), ck: n.querySelector('.wc-ck') }));

    // ---- the full-frame browser window (the two page bodies are built by layout(), once the frame's shape is known) ----
    const layer = x.el(`<div class="wc-full" aria-hidden="true"><div class="cr-app">
      <div class="cr-strip">
        <span class="cr-lights"><i></i><i></i><i></i></span>
        <span class="cr-tab cr-t1 on"><img class="cr-fav" src="${wDark}" alt=""/><span class="cr-tt">${esc(WP_TITLE)}</span>${I.close}</span>
        <span class="cr-tab cr-t2"><img class="cr-fav" src="${gBlue}" alt=""/><span class="cr-tt">${esc(GS_TITLE)}</span>${I.close}</span>
        <span class="cr-new">${I.plus}</span>
      </div>
      <div class="cr-bar">
        ${I.back}${I.fwd}${I.reload}
        <span class="cr-omni">${I.tune}<span class="cr-url"></span>${I.star}</span>
        <span class="cr-av">D</span>${I.kebab}
      </div>
      <div class="cr-vp"><div class="cr-wp"></div><div class="cr-gs"></div></div>
    </div></div>`);
    x.root.appendChild(layer);
    const app = layer.firstElementChild;
    const $ = (s) => app.querySelector(s);
    const t1 = $('.cr-t1'), t2 = $('.cr-t2'), url = $('.cr-url'), wpBox = $('.cr-wp'), gsBox = $('.cr-gs');
    // the Search Console face is vendored (wordpress.css): ask for every weight up front, and warm the photos
    if (document.fonts && document.fonts.load) ['400', '500', '700'].forEach((w) => document.fonts.load(`${w} 14px "Roboto GSC"`));

    const vis = say.firstElementChild, hid = say.lastElementChild;
    const wpMarkup = wpHTML(x.brand);
    let shown = -1, geo = '', feed = null, G = null, lastUrl = '', lastCnt = '';
    let AW = 1280, AH = 720;

    // the window's design size from the frame: W x H over APP_SCALE; a portrait frame takes the tablet layouts
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
      app.classList.toggle('cr-narrow', tall);
      shot.style.aspectRatio = `${W} / ${H}`;
      card.classList.toggle('wc-tall', tall);
      wpBox.innerHTML = wpMarkup(tall);
      gsBox.innerHTML = gsHTML(x.brand, tall);
      // the chart at its plot box's px (laid out now; the layer's scale is a transform, so offsetWidth is design px)
      const ch = gsBox.querySelector('.gs-chart');
      const prevD = gsBox.style.display;
      gsBox.style.display = '';
      ch.innerHTML = chartSVG(ch.clientWidth || 900, ch.clientHeight || 200);
      gsBox.style.display = prevD;
      const q = (s2) => [...app.querySelectorAll(s2)];
      G = {
        tall, rows: q('.wp-row'), none: app.querySelector('.wp-none'), nslot: app.querySelector('.wp-nslot'), notice: app.querySelector('.wp-notice'),
        cnts: q('.wp-cnt'), items: app.querySelector('.wp-items'), anchor: q('.wp-row .wp-rt')[1],
        load: app.querySelector('.gs-load'), loadBar: app.querySelector('.gs-load i'),
        cr: app.querySelector('.gs-cr'), mk: app.querySelector('.gs-mk'), hi: app.querySelector('.gs-hi'), hc: app.querySelector('.gs-hc'),
        svgW: +app.querySelector('.gs-svg').getAttribute('width'), cl: app.querySelector('.gs-cl .gs-tv'), im: app.querySelector('.gs-im .gs-tv'),
        qr: q('.gs-qr'), lastCl: '', lastIm: '',
      };
      G.nh = G.notice.offsetHeight + 20; // the notice's height plus its margins (wp-admin's 5px 0 15px)
      const svgEl = app.querySelector('.gs-svg');
      const pw = G.svgW - 44 - 52;
      G.plot = { L: 44, pw, Tp: 30, ph: +svgEl.getAttribute('height') - 30 - 26 };
    };

    // a box's centre in the window's own px (transform-free: the window's rect divided by its current scale)
    const ptIn = (n, fy = 0.55) => {
      const a = app.getBoundingClientRect(), b = n.getBoundingClientRect();
      const sc = a.width / AW || 1;
      return { x: (b.left - a.left + b.width * 0.5) / sc, y: (b.top - a.top + b.height * fy) / sc };
    };
    const setTxt = (n, s2) => { if (n && n.textContent !== s2) n.textContent = s2; };

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
        checks.forEach((c, i) => {
          const o = outCubic(seg(t, T.ok[i], T.ok[i] + POP));
          c.spin.style.opacity = (1 - seg(t, T.ok[i] - 0.06, T.ok[i] + 0.04)).toFixed(3);
          c.spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
          c.ck.style.opacity = o.toFixed(3);
          c.ck.style.transform = `scale(${lerp(0.4, 1, o).toFixed(4)})`;
        });
        if (!G) return;

        // ---- phase A: the posts land in the list one by one, the counts with them, then the notice ----
        const landed = T.row.filter((a) => t >= a).length;
        G.rows.forEach((row, i) => {
          // the list is newest first, so the post in list row i is the (n - 1 - i)th to land: each lands on top
          const a = T.row[POSTS.length - 1 - i];
          row.style.display = t >= a ? '' : 'none';
          row.style.opacity = outCubic(seg(t, a, a + ROW_IN)).toFixed(3);
          // the landing wash: a soft wp-admin yellow fading to the row's own stripe
          row.style.setProperty('--wash', (1 - seg(t, a + ROW_IN, a + ROW_IN + 0.5)).toFixed(3));
          // wp-admin stripes the odd rows of what is listed (counted from the top of the visible list)
          row.classList.toggle('alt', (i - (POSTS.length - landed)) % 2 === 0);
        });
        G.none.style.display = landed ? 'none' : '';
        const cnt = String(landed);
        if (cnt !== lastCnt) {
          G.cnts.forEach((c) => { c.textContent = `(${cnt})`; });
          G.items.textContent = `${cnt} item${landed === 1 ? '' : 's'}`;
          lastCnt = cnt;
        }
        const ni = outCubic(seg(t, T.notice, T.notice + NOTICE_IN));
        G.nslot.style.height = `${(G.nh * ni).toFixed(2)}px`;
        G.notice.style.opacity = seg(t, T.notice + NOTICE_IN * 0.3, T.notice + NOTICE_IN).toFixed(3);

        // ---- phase B: the second tab, Search Console's Performance report ----
        const gs = t >= T.sw;
        t1.classList.toggle('on', !gs);
        t2.classList.toggle('on', gs);
        const u = gs ? esc(GS_URL) : esc(WP_URL);
        if (u !== lastUrl) { url.innerHTML = u; lastUrl = u; }
        wpBox.style.display = gs ? 'none' : '';
        gsBox.style.display = gs ? '' : 'none';
        // the thin progress bar while it loads, then the draw
        const ld = seg(t, T.sw, T.draw);
        G.load.style.opacity = (gs && t < T.draw + 0.12 ? 1 - seg(t, T.draw, T.draw + 0.12) : 0).toFixed(3);
        G.loadBar.style.transform = `scaleX(${(0.15 + 0.85 * outCubic(ld)).toFixed(4)})`;
        const p = inOutCubic(seg(t, T.draw, T.drawn));
        const f = p * (IMPR.length - 1);              // the day the draw has reached
        G.cr.setAttribute('width', (G.plot.L + G.plot.pw * p + 1).toFixed(1));
        G.mk.style.opacity = seg(f, MARK - 0.6, MARK + 0.4).toFixed(3);
        // the draw's leading dots, gone once it settles
        const hx = G.plot.L + G.plot.pw * p;
        const live = p > 0 && p < 1;
        [[G.hi, at(IMPR, f) / AX.impr], [G.hc, at(CLICKS, f) / AX.clicks]].forEach(([c, v]) => {
          c.setAttribute('cx', hx.toFixed(1));
          c.setAttribute('cy', (G.plot.Tp + G.plot.ph * (1 - v)).toFixed(1));
          c.style.opacity = live ? '1' : '0';
        });
        // the totals count with the draw (cumulative over the days drawn so far)
        const cl = fmt(TOTALS.clicks * cum(CLICKS, f + (p >= 1 ? 1 : 0)));
        const im = fmt(TOTALS.impr * cum(IMPR, f + (p >= 1 ? 1 : 0)));
        if (cl !== G.lastCl) { setTxt(G.cl, p >= 1 ? fmt(TOTALS.clicks) : cl); G.lastCl = cl; }
        if (im !== G.lastIm) { setTxt(G.im, p >= 1 ? fmt(TOTALS.impr) : im); G.lastIm = im; }
        G.qr.forEach((row, i) => {
          const q = outCubic(seg(t, T.q[i], T.q[i] + Q_IN));
          row.style.opacity = q.toFixed(3);
          row.style.transform = q >= 1 ? 'none' : `translateY(${((1 - q) * 6).toFixed(2)}px)`;
        });
      },
      // the pointer: it sets off from the Posts list for the second tab, presses it, and fades as the report loads.
      // In the section's px (the full-frame window is the whole section by then).
      pointer(t) {
        if (!G || t < T.ptr - 0.15 || t > T.sw + 0.45) return null;
        const W = x.root.offsetWidth, s = W / AW;
        const tp = ptIn(t2, 0.5);
        const from = G.anchor && G.anchor.offsetParent ? ptIn(G.anchor, 0.6) : { x: tp.x + 120, y: tp.y + 300 };
        const m = inOutCubic(seg(t, T.ptr, T.arrive));
        const v = seg(t, T.ptr - 0.15, T.ptr) * (1 - seg(t, T.sw + 0.15, T.sw + 0.45));
        return { x: lerp(from.x, tp.x, m) * s, y: lerp(from.y, tp.y, m) * s, p: press(t, T.press), v };
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
