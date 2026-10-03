// ytx1 YouTube Studio rebuild: the channel "Community" page, Comments tab (light theme), in a framed browser window
// on superbot's dark 1920x1080 stage. Pure builders, no framework, no network: buildStudio() writes the DOM once and
// returns handles; every setter is a pure function of its arguments (call it every frame with the value for t).
// Layout units are Studio's own CSS px; the app is scaled to the browser viewport by setZoom().
import { icon, STUDIO_LOGO } from './icons.js';

// ---- story content (bible, verbatim) ----------------------------------------------------------------------------
export const STORY = {
  channel: { name: 'Sam Rivera', handle: '@samriveraaudio', subs: '412K subscribers', avatar: 'img/creator-sam.png' },
  video: { title: 'I tested 12 budget mics under $100', duration: '14:32', thumb: 'img/thumb-mics.jpg',
    views: '286,417', comments: '1,284', published: '2 days ago' },
  comments: [
    { id: 'priya', name: 'Priya Nair', handle: '@priyanair.voice', avatar: 'img/av-priya.png',
      text: 'Which one would you actually buy for a small untreated room?', likes: '2.1K', age: '5 hours ago', replies: 0 },
    { id: 'lena', name: 'Lena Fischer', handle: '@lenafischer', avatar: 'img/av-lena.png',
      text: "What's that boom arm at 4:38? Looks so clean on the desk.", likes: '986', age: '6 hours ago', replies: 2 },
    { id: 'marcus', name: 'Marcus Oyelaran', handle: '@marcusoyelaran', avatar: 'img/av-marcus.png',
      text: 'The $34 condenser sounding better than my $180 one is personally offensive', likes: '742', age: '9 hours ago', replies: 14 },
    { id: 'hana', name: 'Hana Kobayashi', handle: '@hanakobayashi', avatar: 'img/av-hana.png',
      text: 'Timestamps for the voice tests please, I keep scrubbing back to 9:12', likes: '611', age: '11 hours ago', replies: 1 },
    { id: 'diego', name: 'Diego Alvarez', handle: '@diegoalvarezpods', avatar: 'img/av-diego.png',
      text: "Part 2 with XLR mics under $150? I'd watch that tonight", likes: '503', age: '14 hours ago', replies: 6 },
    { id: 'tomasz', name: 'Tomasz Wrobel', handle: '@tomaszwrobel', avatar: 'img/av-tomasz.png',
      text: 'That plosive test at 6:05 was brutal for mic number 7', likes: '388', age: '1 day ago', replies: 0 },
    { id: 'aisha', name: 'Aisha Rahman', handle: '@aisharahman.studio', avatar: 'img/av-aisha.png',
      text: 'Bought the $49 one after this. Zero regrets so far.', likes: '301', age: '1 day ago', replies: 3 },
    { id: 'jordan', name: 'Jordan Blake', handle: '@jordanblake', avatar: 'img/av-jordan.png',
      text: 'How did you get the room to sound that dead?', likes: '264', age: '1 day ago', replies: 0 },
  ],
  target: 'priya',
  reply: { text: 'The $49 dynamic. It ignores most of the room, so a small untreated space still sounds tight. Side by side at 7:21.',
    age: '0 seconds ago' },
  pinnedLabel: 'Pinned by Sam Rivera',
  totalComments: 1284,
};

// Studio's "Most relevant" order before Gemini ranks (Priya 4th), and the ranked order (bible numbering 1..8).
export const INITIAL_ORDER = ['lena', 'marcus', 'hana', 'priya', 'diego', 'tomasz', 'aisha', 'jordan'];
export const RANKED_ORDER = ['priya', 'lena', 'marcus', 'hana', 'diego', 'tomasz', 'aisha', 'jordan'];

// ---- frame geometry (stage px) ----------------------------------------------------------------------------------
export const FRAME = { x: 64, y: 44, w: 1792, h: 992, pad: 12, bar: 44 };
export const PORT = { w: FRAME.w - 2 * FRAME.pad, h: FRAME.h - 2 * FRAME.pad - FRAME.bar }; // 1768 x 924

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const lerp = (a, b, t) => a + (b - a) * t;
const easeOutBack = (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const NAV = [
  ['dashboard', 'Dashboard'], ['content', 'Content'], ['analytics', 'Analytics'], ['community', 'Community', true],
  ['languages', 'Languages'], ['detection', 'Content detection'], ['earn', 'Earn'], ['customization', 'Customization'],
  ['music', 'Creator Music', false, '[Beta]'],
];

function countLabel(n) {
  return n === 1 ? '1 reply' : `${n} replies`;
}

function rowHTML(c, d, base, isTarget) {
  const img = (p) => esc(base + p);
  const like = c.likes ? `<span class="n">${esc(c.likes)}</span>` : '';
  const target = isTarget ? `
      <div class="st-compwrap"><div class="st-comp">
        <img src="${img(d.channel.avatar)}" alt="">
        <div class="st-ccol" style="flex:1">
          <div class="st-field"><div class="lb">Reply</div><div class="tx"></div></div>
          <div class="st-cbtns"><div class="st-tbtn">Cancel</div><div class="st-tbtn go">Reply</div></div>
        </div>
      </div></div>
      <div class="st-subwrap"><div class="st-sub">
        ${icon('checkbox', 'st-cb')}
        <img class="st-av2" src="${img(d.channel.avatar)}" alt="">
        <div class="st-sbody">
          <div class="st-meta"><span class="st-owner">${esc(d.channel.handle)}${icon('verified')}</span><span class="dot">&#8226;</span><span>${esc(d.reply.age)}</span></div>
          <div class="st-text">${esc(d.reply.text)}</div>
          <div class="st-acts"><div class="st-reply">Reply</div>
            <div class="st-icons"><div class="st-btn">${icon('like')}</div><div class="st-btn">${icon('dislike')}</div>
              <div class="st-btn">${icon('heart')}</div><div class="st-btn">${icon('more')}</div></div></div>
        </div>
      </div></div>` : '';
  return `
    <div class="st-hl"></div>
    ${icon('checkbox', 'st-cb')}
    <img class="st-av" src="${img(c.avatar)}" alt="">
    <div class="sb-rank"></div>
    <div class="st-main">
      ${isTarget ? `<div class="st-pinwrap"><div class="st-pinned">${icon('pin')}<span>${esc(d.pinnedLabel)}</span></div></div>` : ''}
      <div class="st-meta"><span>${esc(c.handle)}</span><span class="dot">&#8226;</span><span>${esc(c.age)}</span></div>
      <div class="st-text">${esc(c.text)}</div>
      <div class="st-acts">
        <div class="st-reply">Reply</div>
        <div class="st-count${c.replies ? ' has' : ''}"><span>${countLabel(c.replies)}</span>${icon('chevron-down')}</div>
        <div class="st-icons">
          <div class="st-btn st-like-b"><div class="st-like">${icon('like')}${like}</div></div>
          <div class="st-btn">${icon('dislike')}</div>
          <div class="st-btn st-heart">${icon('heart')}<div class="st-hearted"><img src="${img(d.channel.avatar)}" alt="">${icon('heart-filled')}</div></div>
          <div class="st-btn">${icon('more')}</div>
        </div>
      </div>${target}
    </div>
    <div class="st-vid"><img src="${img(d.video.thumb)}" alt=""><div>${esc(d.video.title)}</div></div>`;
}

/**
 * buildStudio(root, data = STORY, opts) -> api
 *   root  element to fill (it becomes the 1920x1080 .yx-stage)
 *   opts.base  path prefix from the document to the ad folder (index.html in AD/: '', ux/preview.html: '../')
 *   opts.zoom  initial page zoom (1 = Studio at 1768 CSS px wide; states use 1.1 / 1.3 / 1.15)
 */
export function buildStudio(root, data = STORY, opts = {}) {
  const base = opts.base ?? '';
  const d = data;
  const img = (p) => esc(base + p);
  root.classList.add('yx-stage');
  root.innerHTML = `
  <div class="yx-win">
    <div class="yx-screen">
      <div class="yx-bar"><div class="yx-dots"><i></i><i></i><i></i></div>
        <div class="yx-url">${icon('lock')}<span><b>studio.youtube.com</b>/channel/UCq4sR9vT2mWbN7kLx1aYd3Q/comments</span></div></div>
      <div class="yx-port">
        <div class="st-app">
          <div class="st-top">
            <div class="st-ib">${icon('menu')}</div>
            <div class="st-logo">${STUDIO_LOGO}</div>
            <div class="st-search">${icon('search')}<span>Search across your channel</span></div>
            <div class="st-right">
              <div class="st-ib">${icon('help')}</div>
              <div class="st-ib">${icon('bell')}</div>
              <div class="st-ask">${icon('sparkle')}<span>Ask Studio</span></div>
              <div class="st-create">${icon('create')}<span>Create</span></div>
              <img class="st-me" src="${img(d.channel.avatar)}" alt="">
            </div>
          </div>
          <div class="st-body">
            <div class="st-nav">
              <div class="st-chan"><img src="${img(d.channel.avatar)}" alt=""><b>Your channel</b><span>${esc(d.channel.name)}</span></div>
              ${NAV.map(([ic, label, on, tag]) => `<div class="st-nv${on ? ' on' : ''}">${icon(ic)}<span>${label}</span>${tag ? `<span class="tag">${tag}</span>` : ''}</div>`).join('')}
              <div class="st-navfoot">
                <div class="st-nv">${icon('settings')}<span>Settings</span></div>
                <div class="st-nv">${icon('feedback')}<span>Send feedback</span></div>
              </div>
            </div>
            <div class="st-page"><div class="st-scroll">
              <div class="st-title">Community</div>
              <div class="st-tabs"><div class="st-tab on">Comments</div><div class="st-tab">Viewer posts</div><div class="st-tab">Mentions</div></div>
              <div class="st-filter">${icon('filter')}
                <div class="st-chip">Published${icon('chevron-down')}</div>
                <div class="st-chip">Most relevant${icon('chevron-down')}</div>
                <div class="st-chip ic">${icon('search-spark')}<span>Search</span>${icon('chevron-down')}</div>
              </div>
              <div class="st-head">${icon('checkbox', 'st-cb')}<div class="sb-counter"><i></i><span></span></div></div>
              <div class="st-list">
                ${d.comments.map((c) => `<div class="st-row" data-id="${c.id}">${rowHTML(c, d, base, c.id === d.target)}</div>`).join('')}
              </div>
            </div></div>
          </div>
        </div>
      </div>
    </div>
  </div>`;

  const $ = (sel, el = root) => el.querySelector(sel);
  const win = $('.yx-win'), port = $('.yx-port'), app = $('.st-app'), scroll = $('.st-scroll'), list = $('.st-list');
  const counter = $('.sb-counter'), counterText = $('.sb-counter span');

  const rows = {};
  root.querySelectorAll('.st-row').forEach((el) => {
    const id = el.dataset.id;
    rows[id] = { id, el, badge: $('.sb-rank', el), hl: $('.st-hl', el), heartBtn: $('.st-heart', el),
      count: $('.st-count', el), data: d.comments.find((c) => c.id === id) };
  });
  const T = rows[d.target];
  const pinWrap = $('.st-pinwrap', T.el), pinInner = $('.st-pinned', T.el);
  const compWrap = $('.st-compwrap', T.el), compInner = $('.st-comp', T.el);
  const field = $('.st-field .tx', T.el), goBtn = $('.st-tbtn.go', T.el);
  const subWrap = $('.st-subwrap', T.el), subInner = $('.st-sub', T.el);
  const heartOutline = $('.st-heart > .yx-i', T.el), hearted = $('.st-hearted', T.el), heartBadge = $('.st-hearted .yx-i', T.el);

  const st = { order: d.comments.map((c) => c.id), from: null, to: null, p: 1, zoom: 1, scroll: 0,
    pin: 0, comp: 0, sub: 0, rising: d.target };

  function relayout() {
    pinWrap.style.height = `${(pinInner.offsetHeight * st.pin).toFixed(2)}px`;
    pinWrap.style.opacity = st.pin.toFixed(3);
    compWrap.style.height = `${(compInner.offsetHeight * st.comp).toFixed(2)}px`;
    compWrap.style.opacity = clamp01(st.comp * 1.6).toFixed(3);
    subWrap.style.height = `${(subInner.offsetHeight * st.sub).toFixed(2)}px`;
    subWrap.style.opacity = clamp01(st.sub * 1.4).toFixed(3);
    const h = {};
    for (const id in rows) h[id] = rows[id].el.offsetHeight;
    const tops = (order) => { const o = {}; let y = 0; for (const id of order) { o[id] = y; y += h[id]; } return o; };
    const a = tops(st.from || st.order), b = tops(st.to || st.order);
    let total = 0;
    for (const id in rows) {
      const y = lerp(a[id], b[id], st.p);
      const r = rows[id];
      r.el.style.transform = `translateY(${y.toFixed(2)}px)`;
      r.el.style.zIndex = id === st.rising ? 3 : (b[id] < a[id] ? 2 : 1);
      r.top = y; r.height = h[id];
      total += h[id];
    }
    list.style.height = `${total}px`;
  }

  const api = {
    root, win, port, app, scroll, list, rows, counter,
    composer: { el: compWrap, field, button: goBtn },
    posted: { el: subWrap },
    pinnedSlot: pinWrap,
    heart: { el: T.heartBtn },

    /** Browser zoom of the Studio page: the app is laid out at PORT/zoom CSS px and scaled up to the viewport. */
    setZoom(z) {
      st.zoom = z;
      app.style.width = `${(PORT.w / z).toFixed(3)}px`;
      app.style.height = `${(PORT.h / z).toFixed(3)}px`;
      app.style.transform = `scale(${z})`;
    },
    /** Scroll the page column (Studio's bar and left menu stay fixed), in Studio CSS px. */
    setScroll(y) { st.scroll = y; scroll.style.transform = `translateY(${(-y).toFixed(2)}px)`; },
    /** Scroll value that puts row `id`'s top `offset` CSS px below the top of the page column. */
    scrollForRow(id, offset = 16) { relayout(); return Math.max(0, list.offsetTop + rows[id].top - offset); },

    /** Row order hook: rows sit at their slots in `from`, glide to `to` as p goes 0..1 (ease p yourself). */
    setOrder(from, to = from, p = 1, rising = d.target) {
      st.from = from; st.to = to; st.p = clamp01(p); st.rising = rising; relayout();
    },
    /** Gemini's rank badge on a row: n = number shown, p = stamp progress 0..1 (scale 1.8 -> 1 with fade-in). */
    setRank(id, n, p) {
      const b = rows[id].badge; p = clamp01(p);
      if (n != null) b.textContent = String(n);
      const s = p <= 0 ? 1.8 : lerp(1.8, 1, easeOutBack(Math.min(1, p)));
      b.style.opacity = clamp01(p * 2.5).toFixed(3);
      b.style.transform = `scale(${s.toFixed(4)})`;
    },
    /** Soft highlight wash + accent bar on a row (0..1). */
    setHighlight(id, p) { rows[id].hl.style.opacity = clamp01(p).toFixed(3); },
    /** Optional overlay chip at the right of the list header: "<n> of 1,284 ranked". p = visibility 0..1. */
    setCounter(n, p = 1, total = d.totalComments) {
      counterText.innerHTML = `<b>${Math.round(n).toLocaleString('en-US')}</b> of ${total.toLocaleString('en-US')} ranked`;
      counter.style.opacity = clamp01(p).toFixed(3);
    },
    /** Reply composer under the target comment: open 0..1 (height + fade). */
    setComposer(p) { st.comp = clamp01(p); relayout(); },
    /** Typed text in the composer; caretVisible draws the text caret after the last character. */
    setReplyText(str, caretVisible = true) {
      const caret = caretVisible ? '<span class="st-caret"></span>' : '';
      field.innerHTML = str ? `${esc(str)}${caret}` : `${caret}<span class="ph">Add a reply...</span>`;
      goBtn.classList.toggle('on', !!str);
      if (st.comp > 0) relayout();
    },
    /** "Pinned by Sam Rivera" label above the target comment's handle: 0..1 (height + fade). */
    setPinned(p) { st.pin = clamp01(p); relayout(); },
    /** Sam's posted reply under the target comment (owner pill): 0..1 (height + fade). Updates "1 reply". */
    setPosted(p) {
      st.sub = clamp01(p);
      const n = T.data.replies + (st.sub > 0 ? 1 : 0);
      T.count.classList.toggle('has', n > 0);
      T.count.innerHTML = `<span>${countLabel(n)}</span>${icon(st.sub > 0 ? 'chevron-up' : 'chevron-down')}`;
      relayout();
    },
    /** Creator heart on the target comment: 0 = outline heart, 1 = Sam's avatar with the red heart (pop between). */
    setHeart(p) {
      p = clamp01(p);
      heartOutline.style.opacity = (1 - clamp01(p * 5)).toFixed(3);
      const g = p <= 0 ? 0 : easeOutBack(clamp01(p / 0.55));
      hearted.style.opacity = clamp01(p * 5).toFixed(3);
      hearted.style.transform = `scale(${g.toFixed(4)})`;
      const pulse = p <= 0.35 ? 0 : Math.sin(Math.PI * clamp01((p - 0.35) / 0.45)) * 0.35;
      heartBadge.style.transform = `scale(${(1 + pulse).toFixed(4)})`;
    },
    /** The framed window: scale about its centre plus an offset (stage px), clamped so all four edges stay >= 8px
     *  inside the 1920x1080 canvas (X policy: never full-bleed). Returns the transform actually applied. */
    setFrame(scale = 1, dx = 0, dy = 0) {
      const m = 8;
      const s = Math.min(scale, (1920 - 2 * m) / FRAME.w, (1080 - 2 * m) / FRAME.h);
      const w = FRAME.w * s, h = FRAME.h * s;
      const cx0 = FRAME.x + FRAME.w / 2, cy0 = FRAME.y + FRAME.h / 2;
      const cx = Math.min(1920 - m - w / 2, Math.max(m + w / 2, cx0 + dx));
      const cy = Math.min(1080 - m - h / 2, Math.max(m + h / 2, cy0 + dy));
      win.style.transform = `translate(${(cx - cx0).toFixed(2)}px, ${(cy - cy0).toFixed(2)}px) scale(${s.toFixed(4)})`;
      return { scale: s, dx: cx - cx0, dy: cy - cy0 };
    },
    /** Stage-px rectangle of any element inside the stage (for overlays the motion layer places). */
    rectOf(el) {
      const r = el.getBoundingClientRect(), o = root.getBoundingClientRect();
      const k = o.width / 1920 || 1;
      return { x: (r.left - o.left) / k, y: (r.top - o.top) / k, w: r.width / k, h: r.height / k };
    },
    relayout,
    /** Resolves when the bundled fonts and every <img> in the stage are decoded. */
    ready() {
      const fonts = document.fonts ? Promise.all([
        ...['400', '500', '700'].map((w) => document.fonts.load(`${w} 14px "YX Roboto"`)),
        document.fonts.load('600 25px "YX Sans"'),
      ]).then(() => document.fonts.ready) : Promise.resolve();
      const imgs = [...root.querySelectorAll('img')].map((i) => (i.decode ? i.decode().catch(() => {}) : null));
      return Promise.all([fonts, ...imgs]).then(() => relayout());
    },
  };

  api.setZoom(opts.zoom ?? 1);
  api.setReplyText('', false);
  api.setOrder(INITIAL_ORDER, INITIAL_ORDER, 1);
  for (const id in rows) api.setRank(id, null, 0);
  api.setHeart(0);
  return api;
}

/** The reply typed so far at progress p (0..1), cut on whole characters. */
export function typedReply(p, text = STORY.reply.text) {
  return text.slice(0, Math.round(clamp01(p) * text.length));
}

/**
 * Static reference states (preview.html and the motion agent's sanity frames):
 *   0  cut 1 start: Studio order, no ranks
 *   1  cut 1 end:   ranked order, rank badges 1-5, Priya highlighted on top, counter at 1,284
 *   2  cut 2:       zoomed on Priya's comment, reply composer open, reply partly typed with caret
 *   3  cut 3 final: Priya on top, "Pinned by Sam Rivera", Sam's reply posted in the owner pill, creator heart
 */
export function applyState(api, n) {
  const ids = Object.keys(api.rows);
  const reset = () => {
    for (const id of ids) { api.setRank(id, null, 0); api.setHighlight(id, 0); }
    api.setCounter(0, 0); api.setComposer(0); api.setReplyText('', false); api.setPinned(0); api.setPosted(0);
    api.setHeart(0); api.setZoom(1.1); api.setScroll(0); api.setFrame(1);
  };
  reset();
  if (n === 0) { api.setOrder(INITIAL_ORDER, INITIAL_ORDER, 1); return; }
  api.setOrder(RANKED_ORDER, RANKED_ORDER, 1);
  if (n === 1) {
    RANKED_ORDER.slice(0, 5).forEach((id, i) => api.setRank(id, i + 1, 1));
    api.setHighlight('priya', 1);
    api.setCounter(STORY.totalComments, 1);
  } else if (n === 2) {
    api.setZoom(1.3);
    api.setComposer(1);
    api.setReplyText(typedReply(0.62), true);
    api.setScroll(api.scrollForRow('priya', 20));
  } else if (n === 3) {
    api.setZoom(1.15);
    api.setPinned(1);
    api.setPosted(1);
    api.setHeart(1);
    api.setScroll(0);
  }
}
