// scenes/yt/posts.js: the YouTube desktop channel page, Posts tab, owner view (Sam Rivera signed in), rebuilt as
// layered HTML/CSS from the channel Posts tab reference (youtube.com/@mkbhd/posts, captured 2026-10-03, AD/CREDITS.txt).
// Built in YouTube's native CSS px at a native viewport of NATIVE.w x NATIVE.h (at that width YouTube shows the mini
// guide), then scaled by SCALE into the frame's screen (1808 x 916 stage px), so post text (14 px native) renders at
// 22.4 px on the 1920 x 1080 stage. Builders only build: no transitions, no animations, nothing moves until the motion
// unit (scenes/yt-community.js) writes a style, directly or through the setters below.
//
// API
//   SCALE = 1.6, NATIVE = { w: 1130, h: 572.5 }
//   buildChannelPosts(root, { theme, scroll }) -> {
//     el              the scaled wrapper appended to root (root = buildFrame(...).screen)
//     page            the native-px page (.ytp)
//     topbar, guide, main
//     scroller        banner + header + tabs + feed; setScroll(y) translates it
//     stickyTabs      the tab row pinned under the top bar, shown once the real tab row scrolls under it
//     banner          the channel banner <img>
//     composer        the post composer card (owner view)
//     composerText    the composer's text (empty in the initial state; write textContent to type into it)
//     composerHint    the placeholder line (hide it once composerText has text)
//     composerImage   the attached image preview (display:none initially; holds <img> composerImageImg)
//     composerImageImg
//     composerPostBtn the Post button (.is-on = enabled blue state)
//     feed            the post list under the composer
//     postSlot        the slot for the new post (height:0, overflow hidden initially, first in the feed)
//     postCard        the new post card inside postSlot: avatar, `Sam Rivera`, NO timestamp, text, image, empty action row
//     postText, postImage
//     olderPost       the earlier post below it (5 days ago)
//     measure()       -> { postH, postTop, finalScroll, scrollMax }  natural heights in native px
//     setScroll(y)    scrolls the page by y native px (sticky tab row appears once y passes the tab row)
//     scale, native
//   }
//   theme  'light' (default) or 'dark'
//   Setters: setComposer(api, { text, image, ready }), setPost(api, k), applyFinal(api)
import { esc } from '../../lib.js';
import { CREATOR, POST } from './content.js';
import { icon, P, YT_ICON } from './icons.js';
import { ensureCss, cssUrl } from './frame.js';

export const SCALE = 1.6;
export const NATIVE = { w: 1130, h: 572.5 };
export const cssReady = typeof document !== 'undefined' ? ensureCss(cssUrl('posts.css')) : Promise.resolve(true);

const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };

// Material glyphs the shared icon set does not carry (24 x 24)
const Q = {
  mic: 'M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z',
  plus: 'M20 12h-7V5h-2v7H4v2h7v7h2v-7h7z',
  home: 'M12 4.44l7 6.09V20h-4v-5c0-.55-.45-1-1-1h-4c-.55 0-1 .45-1 1v5H5v-9.47l7-6.09m0-1.32-8 6.96V21h6v-6h4v6h6V10.08l-8-6.96z',
  shorts: 'M10 14.65v-5.3L15 12l-5 2.65zm7.77-4.33c-.77-.32-1.2-.5-1.2-.5L18 9.06c1.84-.96 2.53-3.23 1.56-5.06s-3.24-2.53-5.07-1.56L6 6.94c-1.29.68-2.07 2.04-2 3.49.07 1.42.93 2.67 2.22 3.25.03.01 1.2.5 1.2.5L6 14.93c-1.83.97-2.53 3.24-1.56 5.07.97 1.83 3.24 2.53 5.07 1.56l8.5-4.5c1.29-.68 2.06-2.04 1.99-3.49-.07-1.42-.94-2.68-2.23-3.25zm-.23 5.86-8.5 4.5c-1.34.71-3.01.2-3.72-1.14-.71-1.34-.2-3.01 1.14-3.72l2.04-1.08v-1.21l-.69-.28-1.11-.46c-.99-.41-1.65-1.35-1.7-2.41-.05-1.06.52-2.06 1.46-2.56l8.5-4.5c1.34-.71 3.01-.2 3.72 1.14.71 1.34.2 3.01-1.14 3.72L15.5 9.26v1.21l1.8.74c.99.41 1.65 1.35 1.7 2.41.05 1.06-.52 2.06-1.46 2.56z',
  subs: 'M10 18v-6l5 3-5 3zm7-15H7v1h10V3zm3 3H4v1h16V6zm2 3H2v12h20V9zM3 10h18v10H3V10z',
  you: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM7.07 18.28c.43-.9 3.05-1.78 4.93-1.78s4.51.88 4.93 1.78C15.57 19.36 13.86 20 12 20s-3.57-.64-4.93-1.72zm11.29-1.45c-1.43-1.74-4.9-2.33-6.36-2.33s-4.93.59-6.36 2.33A7.95 7.95 0 0 1 4 12c0-4.41 3.59-8 8-8s8 3.59 8 8c0 1.82-.62 3.49-1.64 4.83zM12 6c-1.94 0-3.5 1.56-3.5 3.5S10.06 13 12 13s3.5-1.56 3.5-3.5S13.94 6 12 6zm0 5c-.83 0-1.5-.67-1.5-1.5S11.17 8 12 8s1.5.67 1.5 1.5S12.83 11 12 11z',
  link: 'M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z',
  info: 'M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z',
  poll: 'M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z',
  imgPoll: 'M4 4h7v7H4V4zm2 2v3h3V6H6zm7-2h7v7h-7V4zm2 2v3h3V6h-3zM4 13h7v7H4v-7zm2 2v3h3v-3H6zm7-2h7v7h-7v-7zm2 2v3h3v-3h-3z',
  quiz: 'M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12zm-6.49-5.84c.41-.73 1.18-1.16 1.63-1.8.48-.68.21-1.94-1.14-1.94-.88 0-1.32.67-1.5 1.23l-1.37-.57C11.51 5.96 12.52 5 13.99 5c1.23 0 2.08.56 2.51 1.26.37.6.58 1.73.01 2.57-.63.93-1.23 1.21-1.56 1.81-.13.24-.18.4-.18 1.18h-1.52c.01-.41-.06-1.08.26-1.66zm-.56 3.79c0-.59.47-1.04 1.05-1.04.59 0 1.04.45 1.04 1.04 0 .58-.44 1.05-1.04 1.05-.58 0-1.05-.47-1.05-1.05z',
  video: 'M10 8v8l6-4-6-4zm9-5H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z',
};
const qi = (name, cls = '') => `<svg class="yti ${cls}" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="${Q[name] || P[name]}"/></svg>`;
const av = (cls) => `<img class="${cls}" src="${CREATOR.avatar}" alt="${esc(CREATOR.name)}" decoding="sync" onerror="this.style.visibility='hidden'">`;

// the earlier post (by Sam, before the mic video went up; not by superbot)
const OLDER = {
  age: '5 days ago',
  text: 'Filming wrapped on the budget mic test. 12 mics, all under $100, one normal untreated room. Full video drops this weekend.',
  likes: '3.4K',
  comments: '212',
};
const TABS = ['Home', 'Videos', 'Shorts', 'Playlists', 'Posts'];
const TAB_ON = 'Posts';

function topbar() {
  return `<header class="ytp-top">
    <span class="ytp-ib">${icon('menu')}</span>
    <span class="ytp-logo">${YT_ICON}<b>YouTube</b></span>
    <div class="ytp-searchwrap">
      <div class="ytp-search"><span>Search</span></div>
      <span class="ytp-sbtn">${icon('search')}</span>
      <span class="ytp-mic">${qi('mic')}</span>
    </div>
    <div class="ytp-top-r">
      <span class="ytp-create">${qi('plus')}<span>Create</span></span>
      <span class="ytp-ib">${icon('bell')}</span>
      ${av('ytp-me')}
    </div>
  </header>`;
}

function guide() {
  const items = [['home', 'Home'], ['shorts', 'Shorts'], ['subs', 'Subscriptions'], ['you', 'You']];
  return `<nav class="ytp-guide">${items.map(([k, l]) => `<div class="ytp-gi">${qi(k)}<span>${l}</span></div>`).join('')}</nav>`;
}

const tabsRow = (cls) => `<div class="ytp-tabs ${cls}">
  ${TABS.map((t) => `<span class="ytp-tab${t === TAB_ON ? ' is-on' : ''}">${t}</span>`).join('')}
  <span class="ytp-tab ytp-tab-search">${icon('search')}</span>
</div>`;

function header() {
  return `<div class="ytp-head">
    <div class="ytp-banner"><img src="${CREATOR.banner}" alt="" decoding="sync" onerror="this.style.visibility='hidden'"></div>
    <div class="ytp-hero">
      ${av('ytp-avatar')}
      <div class="ytp-meta">
        <h1 class="ytp-name">${esc(CREATOR.name)}</h1>
        <div class="ytp-line"><b>${esc(CREATOR.handle)}</b><i>•</i>${esc(CREATOR.subscribers)}<i>•</i>${esc(CREATOR.videos)}</div>
        <div class="ytp-desc">Honest gear tests in a normal room. Mics, headsets and desk setups under $100.<b>...more</b></div>
        <div class="ytp-links">${qi('link')}<span>samriveratests.com</span><em>and 2 more links</em></div>
        <div class="ytp-btns"><span class="ytp-chip">Customize channel</span><span class="ytp-chip">Manage videos</span></div>
      </div>
    </div>
  </div>`;
}

function composer() {
  const tools = [['image', 'Image'], ['imgPoll', 'Image poll'], ['poll', 'Text poll'], ['quiz', 'Quiz'], ['video', 'Video']];
  return `<div class="ytp-card ytp-composer">
    <div class="ytp-c-head">${av('ytp-c-av')}<b>${esc(CREATOR.name)}</b>
      <span class="ytp-vis">Visibility: <b>Public</b>${qi('info')}</span></div>
    <div class="ytp-c-field">
      <div class="ytp-c-hint">Share a sneak peek of your next video</div>
      <div class="ytp-c-text"></div>
      <div class="ytp-c-img"><img src="${POST.image}" alt="" decoding="sync" onerror="this.style.visibility='hidden'"><span class="ytp-c-x">${icon('close')}</span></div>
    </div>
    <div class="ytp-c-foot">
      ${tools.map(([k, l]) => `<span class="ytp-tool">${qi(k)}<span>${l}</span></span>`).join('')}
      <span class="ytp-post">Post</span>
    </div>
  </div>`;
}

const actions = (likes, comments) => `<div class="ytp-acts">
  <span class="ytp-act">${icon('like')}${likes ? `<span>${likes}</span>` : ''}</span>
  <span class="ytp-act ytp-dis">${icon('like')}</span>
  <span class="ytp-act">${icon('share')}</span>
  <span class="ytp-act">${icon('comment')}${comments ? `<span>${comments}</span>` : ''}</span>
</div>`;

const postCard = ({ cls, age, text, image, likes, comments }) => `<div class="ytp-card ytp-postcard ${cls}">
  ${av('ytp-p-av')}
  <div class="ytp-p-body">
    <div class="ytp-p-head"><b>${esc(CREATOR.name)}</b>${age ? `<span>${esc(age)}</span>` : ''}</div>
    <div class="ytp-p-text">${esc(text)}</div>
    ${image ? `<div class="ytp-p-img"><img src="${image}" alt="" decoding="sync" onerror="this.style.visibility='hidden'"></div>` : ''}
    ${actions(likes, comments)}
  </div>
  <span class="ytp-ib ytp-p-more">${icon('moreVert')}</span>
</div>`;

/** buildChannelPosts(root, { theme, scroll }) -> refs (see the header) */
export function buildChannelPosts(root, { theme = 'light', scroll = 0 } = {}) {
  const el = h(`<div class="ytp-scaler" style="width:${NATIVE.w}px;height:${NATIVE.h}px;transform:scale(${SCALE})">
    <div class="ytp${theme === 'dark' ? ' is-dark' : ''}">
      ${topbar()}
      <div class="ytp-bodyrow">
        ${guide()}
        <main class="ytp-main">
          <div class="ytp-scroll">
            ${header()}
            ${tabsRow('ytp-tabs-inline')}
            <div class="ytp-feed">
              ${composer()}
              <div class="ytp-slot">${postCard({ cls: 'ytp-new', text: POST.text, image: POST.image, likes: POST.likes, comments: '' })}</div>
              ${postCard({ cls: 'ytp-older', age: OLDER.age, text: OLDER.text, likes: OLDER.likes, comments: OLDER.comments })}
            </div>
          </div>
          ${tabsRow('ytp-tabs-sticky')}
        </main>
      </div>
    </div>
  </div>`);
  root.appendChild(el);
  const q = (s) => el.querySelector(s);
  const scroller = q('.ytp-scroll');
  const main = q('.ytp-main');
  const tabsInline = q('.ytp-tabs-inline');
  const stickyTabs = q('.ytp-tabs-sticky');
  const postSlot = q('.ytp-slot');
  const postCardEl = q('.ytp-new');
  const api = {
    el,
    page: q('.ytp'),
    topbar: q('.ytp-top'),
    guide: q('.ytp-guide'),
    main,
    scroller,
    stickyTabs,
    banner: q('.ytp-banner img'),
    composer: q('.ytp-composer'),
    composerText: q('.ytp-c-text'),
    composerHint: q('.ytp-c-hint'),
    composerImage: q('.ytp-c-img'),
    composerImageImg: q('.ytp-c-img img'),
    composerPostBtn: q('.ytp-post'),
    feed: q('.ytp-feed'),
    postSlot,
    postCard: postCardEl,
    postText: postCardEl.querySelector('.ytp-p-text'),
    postImage: postCardEl.querySelector('.ytp-p-img img'),
    olderPost: q('.ytp-older'),
    scale: SCALE,
    native: NATIVE,
    measure() {
      const postH = postCardEl.offsetHeight;
      const postTop = postSlot.offsetTop;
      // final framing: the (cleared) composer's top sits 12 px under the sticky tab row, the new post right below it
      const finalScroll = Math.max(0, api.composer.offsetTop -stickyTabs.offsetHeight - 12);
      return { postH, postTop, finalScroll, scrollMax: Math.max(0, scroller.scrollHeight - main.clientHeight), tabsTop: tabsInline.offsetTop };
    },
    setScroll(y) {
      const v = Math.max(0, y);
      scroller.style.transform = `translateY(${(-v).toFixed(2)}px)`;
      stickyTabs.style.visibility = v >= tabsInline.offsetTop ? 'visible' : 'hidden';
    },
  };
  setComposer(api, {});
  setPost(api, 0);
  api.setScroll(scroll);
  return api;
}

/** setComposer(api, { text, image, ready }): text typed so far, image preview opacity 0..1 (0 = not attached),
    ready = Post button enabled. setComposer(api, {}) is the empty initial composer. */
export function setComposer(api, { text = '', image = 0, ready = false } = {}) {
  api.composerText.textContent = text;
  api.composerText.style.display = text ? 'block' : 'none';
  api.composerHint.style.display = text ? 'none' : 'block';
  api.composerImage.style.display = image > 0 ? 'block' : 'none';
  api.composerImage.style.opacity = String(Math.min(1, Math.max(0, image)));
  api.composerPostBtn.classList.toggle('is-on', !!ready);
}

/** setPost(api, k): the new post's slot opened to k (0..1) of the card's natural height; card opacity follows k. */
export function setPost(api, k) {
  const c = Math.min(1, Math.max(0, k));
  const hgt = api.postCard.offsetHeight + 16; // card + the feed gap under it
  api.postSlot.style.height = c >= 1 ? 'auto' : `${(hgt * c).toFixed(2)}px`;
  api.postCard.style.opacity = String(c);
}

/** applyFinal(api): end state of yt-community (composer cleared, new post at the top of the feed, framed). */
export function applyFinal(api) {
  setComposer(api, {});
  setPost(api, 1);
  api.setScroll(api.measure().finalScroll);
}
