// Studio beat, the finale: superbot connects the creator's own YouTube account and does the posting there.
// ONE browser window carries the whole beat, tweened between three rects on a layer in the scene root:
//   A  centred over the thread: Google's consent page on accounts.google.com, in Google's 2024 granular-consent
//      layout ("Sign in with Google"; superbot's logo; "superbot wants access to your Google Account"; the account
//      chip; "Select what superbot can access" with Select all and the youtube.force-ssl scope; "Make sure you trust
//      superbot"; Cancel / Continue). The pointer ticks Select all and taps Continue.
//   B  docked in the YouTube nest under its steps, the page now YouTube Studio (the pill reads "Connected to YouTube")
//   C  full frame: YouTube Studio's Community page as it shipped in late 2025 (top bar with search and Create; the
//      channel sidebar with Community selected; Comments / Viewer posts / Mentions; the filter chips; rows with the
//      checkbox, @handle and age, Reply pill, likes, heart, the video column). superbot's replies open under each
//      comment, each heart fills, and the ONE bold moment (the chime) is Priya's comment rising to the top as
//      "Pinned by @SamRiveraAudio". The final state holds.
// The page inside the window is laid out once at 1280 x 720 (under a 32px popup toolbar) and scaled to the rect, so
// the three states are the same pixels at three sizes. Every mark is the original beat's (reply + 0.25 consent,
// +1.0 tap, +1.25 steps, +2.89 full, +4.23 pin, +4.43 snackbar, +6.38 end; the grow starts 0.2 s earlier than the
// original's for a 0.6 s glide). Pure function of t.
import { lerp, seg, outCubic, inOutCubic, press } from '../../../lib.js';
import { ms } from './yt-icons.js?v=48dc1fe1';
import { stepHtml, mountStep, renderStep, rise } from '../thread-ui.js?v=48dc1fe1';
import { TOP, VIDEO } from './watch.js?v=48dc1fe1';
import { REPLIES, PIN } from './replies.js?v=48dc1fe1';

const HANDLE = '@SamRiveraAudio';
const EMAIL = 'sam.rivera.audio@gmail.com';
// Google's consent string for the youtube.force-ssl scope, verbatim from
// https://developers.google.com/identity/protocols/oauth2/scopes (YouTube Data API v3)
const SCOPE = 'See, edit, and permanently delete your YouTube videos, ratings, comments and captions';
const URL_CONSENT = 'accounts.google.com/signin/oauth/consent';
const URL_STUDIO = 'studio.youtube.com/channel/UCq4h0rS7bXqPm2vR1/comments';
// the list as Studio sorts it before the pin (top comments): Priya's question sits third until superbot pins it
const ORDER = [1, 2, 0, 3, 4];
const NAV = [
  ['dashboard-outline', 'Dashboard'], ['video-library-outline', 'Content'], ['analytics-outline', 'Analytics'],
  ['comment-outline', 'Community', true], ['subtitles-outline', 'Subtitles'], ['copyright-outline', 'Content detection'],
  ['attach-money', 'Earn'], ['auto-fix', 'Customization'], ['library-music-outline', 'Audio library'],
];
// ages in display order: Studio lists newest first, which is why Priya's older question sits third until it is pinned
const AGES = ['20 hours ago', '1 day ago', '2 days ago', '2 days ago', '3 days ago'];

const DW = 1280, DH = 720, BAR = 32;   // the page's design size (a 1280 x 720 viewport) and the popup toolbar above it
const DT = DH + BAR;                    // the whole window
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function times(r) {
  const T = { r };
  T.card = r + 0.25;          // the consent window rises over the thread
  T.selAll = r + 0.73;        // Select all is ticked
  T.tap = r + 1.0;            // Continue is tapped
  T.connected = T.tap + 0.1;  // the YouTube pill resolves ("Connected to YouTube")
  T.swap = T.tap + 0.08;      // the page turns from consent to Studio...
  T.dock = T.tap + 0.13;      // ...while the window eases down into the nest
  T.docked = T.dock + 0.45;
  T.list = r + 1.25;          // the steps under the who header
  T.opened = T.list + 0.3;
  T.s2 = T.list + 0.16;
  T.grow = r + 2.29;          // the window opens to full frame (lands on the original's full-frame mark, r + 2.89)
  T.full = T.grow + 0.6;
  T.rep = ORDER.map((_, i) => T.full + 0.15 + i * 0.16); // superbot's replies open, top to bottom
  T.pin = r + 4.23;           // Priya's comment is pinned (the chime)
  T.settle = T.pin + 0.55;
  T.toast = T.pin + 0.2;      // Studio's snackbar: "Comment pinned"
  T.end = r + 6.38;
  return T;
}

const box = (cls) => ms('check-box-outline-blank', cls) + ms('check-box', cls + ' on');

function consentHtml(x) {
  return `<div class="gc-page"><div class="gc-zoom">
    <div class="gc-card">
      <div class="gc-top"><img src="${x.brand('google-g.svg')}" alt=""/><span>Sign in with Google</span></div>
      <div class="gc-cols">
        <div class="gc-left">
          <span class="gc-logo"><img src="${x.brand('../scenes/tabs-assets/mark-clean.svg')}" alt=""/></span>
          <h1>superbot wants access to your Google Account</h1>
          <span class="gc-acct"><img src="${x.img('av-sam.jpg')}" alt=""/>${EMAIL}${ms('keyboard-arrow-down', 'gc-dd')}</span>
        </div>
        <div class="gc-right">
          <h2>Select what <b>superbot</b> can access</h2>
          <div class="gc-all"><span>Select all</span><i class="gc-cb gc-cb-all">${box('gc-ic')}</i></div>
          <div class="gc-row"><img src="${x.brand('youtube-icon.svg')}" alt=""/><span>${esc(SCOPE)}. <a>Learn more</a></span><i class="gc-cb gc-cb-one">${box('gc-ic')}</i></div>
          <h3>Make sure you trust superbot</h3>
          <p>You may be sharing sensitive info with this site or app. You can always see or remove access in your <a>Google Account</a>.</p>
          <p class="gc-risk"><a>Learn about the risks</a></p>
          <div class="gc-btns"><span class="gc-btn">Cancel</span><span class="gc-btn gc-go">Continue</span></div>
        </div>
      </div>
    </div>
    <div class="gc-foot"><span>English (United States) ${ms('arrow-drop-down', 'gc-fd')}</span><span class="gc-links"><a>Help</a><a>Privacy</a><a>Terms</a></span></div>
  </div></div>`;
}

function studioHtml(x) {
  const av = (c, cls) => (c.av ? `<span class="${cls}"><img src="${x.img(c.av)}" alt=""/></span>` : `<span class="${cls}" style="background:${c.color}">${c.name[0]}</span>`);
  const row = (ti, i) => {
    const c = TOP[ti];
    return `<div class="st-blk" data-i="${ti}"><i class="st-wash"></i>
      <span class="st-cb">${ms('check-box-outline-blank')}</span>
      ${av(c, 'st-av')}
      <div class="st-main">
        <div class="st-pinned">${ms('keep')}<span>Pinned by ${HANDLE}</span></div>
        <div class="st-meta"><b>${esc(c.handle)}</b><span>• ${AGES[i]}</span></div>
        <div class="st-text">${esc(c.text)}</div>
        <div class="st-acts"><span class="st-reply">Reply</span><span class="st-count"><span class="st-cn">0 replies</span>${ms('keyboard-arrow-down')}</span>
          <span class="st-like">${ms('thumb-up-outline')}<i>${c.likes}</i></span><span class="st-ic">${ms('thumb-down-outline')}</span>
          <span class="st-heart"><span class="st-h0">${ms('favorite-outline')}</span><span class="st-h1">${ms('favorite')}<img src="${x.img('av-sam.jpg')}" alt=""/></span></span>
          <span class="st-ic">${ms('more-vert')}</span></div>
        <div class="st-rep"><div class="st-rep-in"><span class="st-av st-av-s"><img src="${x.img('av-sam.jpg')}" alt=""/></span>
          <div><div class="st-meta"><b class="st-owner">${HANDLE}</b><span>• Just now</span></div><div class="st-text">${esc(REPLIES[ti])}</div></div></div></div>
      </div>
      <div class="st-vid"><img src="${x.img('thumb.jpg')}" alt=""/><span>${esc(VIDEO.title)}</span></div>
    </div>`;
  };
  return `<div class="st-page">
    <div class="st-top">${ms('menu', 'st-tic')}<img class="st-logo" src="${x.brand('youtube-studio-logo.svg')}" alt=""/>
      <div class="st-search">${ms('search')}<span>Search across your channel</span></div>
      <span class="st-tr">${ms('help-outline', 'st-tic')}${ms('notifications-outline', 'st-tic')}<span class="st-create">${ms('video-call-outline')}Create</span><img class="st-me" src="${x.img('av-sam.jpg')}" alt=""/></span></div>
    <div class="st-body">
      <nav class="st-nav"><img class="st-chan" src="${x.img('av-sam.jpg')}" alt=""/><b>Your channel</b><span>Sam Rivera</span>
        ${NAV.map(([ic, label, on]) => `<a class="${on ? 'on' : ''}">${ms(on ? 'comment' : ic)}<span>${label}</span></a>`).join('')}
        <div class="st-nav-end"><a>${ms('settings-outline')}<span>Settings</span></a><a>${ms('feedback-outline')}<span>Send feedback</span></a></div></nav>
      <main class="st-main-col">
        <h1>Community</h1>
        <div class="st-tabs"><span class="on">Comments</span><span>Viewer posts</span><span>Mentions</span></div>
        <div class="st-filter">${ms('filter-list', 'st-fic')}<span class="st-chip">Published ${ms('keyboard-arrow-down')}</span><span class="st-chip">Sort by ${ms('keyboard-arrow-down')}</span></div>
        <div class="st-allrow"><span class="st-cb">${ms('check-box-outline-blank')}</span></div>
        <div class="st-list">${ORDER.map(row).join('')}</div>
      </main>
      <div class="st-toast">Comment pinned</div>
    </div>
  </div>`;
}

export function build(k, x) {
  const T = k.T;
  window.__AD_MARKS = Object.assign(window.__AD_MARKS || {}, { chime: T.pin });

  // ---- in the thread: the steps and the slot the window docks into ----
  const steps = x.el(`<ol class="sb-steps">${stepHtml('Opening YouTube Studio', 'studio.youtube.com/channel/…/comments')}${stepHtml('Posting 5 replies, hearting, pinning')}</ol>`);
  const [li1, li2] = steps.children;
  const s1 = mountStep(li1, ['Opening YouTube Studio', 'Opened YouTube Studio']);
  const s2 = mountStep(li2, ['Posting 5 replies, hearting, pinning', 'Posted 5 replies, hearted 5, pinned Priya']);
  const slot = x.el('<div class="sb-det st-slot"></div>');

  // ---- the window on the scene root ----
  const layer = x.el(`<div class="bw-layer" aria-hidden="true"><div class="bw-win">
    <div class="bw-bar"><span class="bw-dots"><i></i><i></i><i></i></span><span class="bw-url">${ms('tune', 'bw-lock')}<span class="bw-u"></span></span></div>
    <div class="bw-page"><div class="bw-consent">${consentHtml(x)}</div><div class="bw-studio">${studioHtml(x)}</div></div>
  </div></div>`);
  x.root.appendChild(layer);
  const win = layer.firstElementChild;
  const $ = (s) => layer.querySelector(s);
  const url = $('.bw-u'), consent = $('.bw-consent'), studio = $('.bw-studio');
  const go = $('.gc-go'), cbAll = $('.gc-cb-all'), cbOne = $('.gc-cb-one');
  const blocks = [...layer.querySelectorAll('.st-blk')].map((n) => ({
    n, i: +n.dataset.i, rep: n.querySelector('.st-rep'), repIn: n.querySelector('.st-rep-in'),
    count: n.querySelector('.st-cn'), h0: n.querySelector('.st-h0'), h1: n.querySelector('.st-h1'),
    pinned: n.querySelector('.st-pinned'), wash: n.querySelector('.st-wash'),
  }));
  const list = $('.st-list'), toast = $('.st-toast');
  let layout = null; // measured once: each block's height (reply closed, no pinned label) and its reply's height

  // the window's three rects in the root's px
  const rectA = (W, H) => { const w = Math.min(W * 0.76, H * 0.88 * DW / DT); return { x: (W - w) / 2, y: (H - w * DT / DW) / 2, w }; };
  const rectB = () => { const b = x.box(slot); return { x: b.x, y: b.y, w: b.w }; };
  // full frame: the page fills the frame and the toolbar sits just above it, out of view
  const rectC = (W, H) => { const w = Math.max(W, H * DW / DH); return { x: (W - w) / 2, y: (H - w * DH / DW) / 2 - BAR * (w / DW), w }; };
  const mix = (a, b, f) => ({ x: lerp(a.x, b.x, f), y: lerp(a.y, b.y, f), w: lerp(a.w, b.w, f) });

  // the pointer: in from the lower right, ticks Select all, taps Continue, then leaves
  const ptr = (t) => {
    if (t < T.card + 0.2 || t > T.tap + 0.4) return null;
    const a = x.box(cbAll), g = x.box(go);
    const W = x.root.offsetWidth, H = x.root.offsetHeight;
    const pA = { x: a.x + a.w / 2, y: a.y + a.h / 2 }, pG = { x: g.x + g.w * 0.5, y: g.y + g.h * 0.55 };
    const start = { x: W * 0.86, y: H * 0.96 };
    let p;
    if (t < T.selAll) p = mix2(start, pA, inOutCubic(seg(t, T.card + 0.2, T.selAll - 0.03)));
    else p = mix2(pA, pG, inOutCubic(seg(t, T.selAll + 0.08, T.tap - 0.03)));
    const v = seg(t, T.card + 0.2, T.card + 0.32) * (1 - seg(t, T.tap + 0.2, T.tap + 0.4));
    return { x: p.x, y: p.y, p: Math.max(press(t, T.selAll), press(t, T.tap)), v };
  };
  const mix2 = (a, b, f) => ({ x: lerp(a.x, b.x, f), y: lerp(a.y, b.y, f) });

  return {
    nodes: [steps, slot],
    marks: [[T.dock, slot]],
    pointer: ptr,
    render(t) {
      renderStep(s1, t, T.list, T.opened);
      renderStep(s2, t, T.s2, T.settle);
      slot.style.opacity = '0';
      // consent: Select all ticks both boxes, Continue presses
      const sel = t >= T.selAll + 0.04;
      cbAll.classList.toggle('on', sel); cbOne.classList.toggle('on', sel);
      const pr = press(t, T.tap);
      go.style.transform = pr ? `scale(${(1 - 0.05 * pr).toFixed(4)})` : 'none';
      go.classList.toggle('down', t >= T.tap && t < T.swap + 0.1);
      // the page turns from consent to Studio, the URL with it
      const sw = outCubic(seg(t, T.swap, T.swap + 0.25));
      consent.style.opacity = (1 - sw).toFixed(3);
      studio.style.opacity = sw.toFixed(3);
      const u = t < T.swap + 0.1 ? URL_CONSENT : URL_STUDIO;
      if (url.textContent !== u) url.textContent = u;
      // Studio: replies open top to bottom, each heart fills, then Priya's comment rises to the top as pinned
      if (!layout) {
        layout = blocks.map((b) => ({ h: b.n.offsetHeight, rep: b.repIn.offsetHeight }));
      }
      const open = blocks.map((b, j) => outCubic(seg(t, T.rep[j], T.rep[j] + 0.3)));
      const hs = blocks.map((b, j) => open[j] * layout[j].rep);
      const pinIdx = blocks.findIndex((b) => b.i === PIN);
      const mv = inOutCubic(seg(t, T.pin, T.pin + 0.55));
      const pinLabel = outCubic(seg(t, T.pin + 0.2, T.pin + 0.5)) * 26;
      // natural tops with the opened replies (and the pinned label) folded in
      let y = 0;
      const tops = blocks.map((b, j) => { const top = y; y += layout[j].h + hs[j] + (j === pinIdx ? pinLabel : 0); return top; });
      const pinH = tops[pinIdx + 1] !== undefined ? tops[pinIdx + 1] - tops[pinIdx] : y - tops[pinIdx];
      blocks.forEach((b, j) => {
        b.rep.style.height = `${hs[j].toFixed(2)}px`;
        b.repIn.style.opacity = open[j].toFixed(3);
        const n = open[j] > 0.5 ? '1 reply' : '0 replies';
        if (b.count.textContent !== n) b.count.textContent = n;
        const h = outCubic(seg(t, T.rep[j] + 0.1, T.rep[j] + 0.3));
        b.h0.style.opacity = (1 - h).toFixed(3);
        b.h1.style.opacity = h.toFixed(3);
        b.h1.style.transform = h >= 1 ? 'none' : `scale(${lerp(0.5, 1, outCubic(h)).toFixed(4)})`;
        // the move: the pinned block slides from its slot to the top, the ones above it slide down by its height
        let dy;
        if (j === pinIdx) dy = -tops[pinIdx] * mv;
        else if (j < pinIdx) dy = pinH * mv;
        else dy = 0;
        b.n.style.transform = `translateY(${(tops[j] + dy).toFixed(2)}px)`;
        b.n.style.zIndex = j === pinIdx ? '2' : '1';
      });
      const pb = blocks[pinIdx];
      pb.pinned.style.height = `${pinLabel.toFixed(2)}px`;
      pb.pinned.style.opacity = outCubic(seg(t, T.pin + 0.25, T.pin + 0.5)).toFixed(3);
      pb.wash.style.opacity = (seg(t, T.pin, T.pin + 0.2) * (1 - seg(t, T.settle, T.settle + 1.2))).toFixed(3);
      list.style.height = `${y.toFixed(2)}px`;
      const ti = outCubic(seg(t, T.toast, T.toast + 0.3));
      toast.style.opacity = ti.toFixed(3);
      toast.style.transform = `translateY(${((1 - ti) * 16).toFixed(2)}px)`;
    },
    // after the camera: place the window (its rect depends on the slot's place on screen)
    after(t) {
      const W = x.root.offsetWidth, H = x.root.offsetHeight;
      const shown = t >= T.card;
      layer.style.display = shown ? '' : 'none';
      if (!shown) return;
      const A = rectA(W, H), C = rectC(W, H);
      const B = t >= T.dock ? rectB() : A;
      const d = inOutCubic(seg(t, T.dock, T.docked));
      const g = inOutCubic(seg(t, T.grow, T.full));
      let r = mix(A, B, d);
      r = mix(r, C, g);
      const s = r.w / DW;
      const pop = outCubic(seg(t, T.card, T.card + 0.32));
      const k = s * lerp(0.94, 1, pop);
      const cx = r.x + (r.w - DW * k) / 2, cy = r.y + (r.w * DT / DW - DT * k) / 2;
      win.style.transform = `translate(${cx.toFixed(2)}px, ${cy.toFixed(2)}px) scale(${k.toFixed(5)})`;
      win.style.opacity = pop.toFixed(3);
      // the corners square off as the window becomes the frame
      win.style.borderRadius = `${(lerp(lerp(12, 10, d), 0, g) / s).toFixed(2)}px`;
      win.style.setProperty('--shadow', (1 - g).toFixed(3));
      // the scrim behind the popup while it is centred
      layer.style.setProperty('--scrim', (pop * (1 - d) * 0.45).toFixed(3));
    },
  };
}

export default { times, build };
