// scenes/yt/studio.js: the YouTube Studio desktop Comments page (left nav Community > Comments tab), rebuilt as
// layered HTML/CSS from the 2025-2026 references (AD/CREDITS.txt). Built in Studio's native CSS px at a native
// viewport of NATIVE.w x NATIVE.h, then scaled by SCALE into the frame's screen (1808 x 916 stage px), so the comment
// body text (14 px native) renders at 22.4 px on the 1920 x 1080 stage. Builders only build: no transitions, no
// animations, nothing moves until the motion unit writes a style (directly or through the studio-rows.js setters).
//
// API
//   SCALE = 1.6, NATIVE = { w: 1130, h: 572.5 }
//   buildStudioComments(root, { order, theme, scroll }) -> {
//     el        the scaled wrapper appended to root (root = buildFrame(...).screen)
//     page      the native-px page (.yts)
//     topbar, nav, main
//     scroller  the main column's content (page header + tabs + filters + list); setScroll(y) translates it
//     list      the comment list (.ys-list), rows in `order`
//     rows      [{ id, comment, el, body, text, replyBtn, count0, count1, heart, heartOff, heartOn, pinSlot,
//                 pinLabel, composerSlot, composer, composerText, composerSend, replySlot, replyEl, replyText,
//                 ownerPill, replyHeart, h: { row, reply, composer, pin } }]  in `order`
//     rowById   { lena, marco, priya, dee, tom, hannah, jun }
//     measure() re-measures every row's natural heights (native px) and returns { rows: {id: h}, scrollMax }
//     setScroll(y)  scrolls the main column by y native px (translateY(-y))
//     scale, native
//   }
//   order  ids top to bottom (default: the 5 top comments then the 2 extras, Studio "Top comments" order before the
//          pin). Pass ['priya','lena','marco','dee','tom','hannah','jun'] for the pinned end state.
//   theme  'light' (default, the current default Studio theme in the refs) or 'dark'
//   Setters re-exported from studio-rows.js: setReply, setComposer, setHeart, setPin, setCount, applyFinal(api)
import { esc } from '../../lib.js';
import { CREATOR, ALL_COMMENTS, COMMENT_BY_ID, PINNED_ID } from './content.js';
import { icon, STUDIO_LOGO } from './icons.js';
import { ensureCss, cssUrl } from './frame.js';
import { rowEl, rowRefs, measureRow, setReply, setComposer, setHeart, setPin, setCount } from './studio-rows.js';

export { setReply, setComposer, setHeart, setPin, setCount };
export const SCALE = 1.6;
export const NATIVE = { w: 1130, h: 572.5 };
export const cssReady = typeof document !== 'undefined' ? ensureCss(cssUrl('studio.css')) : Promise.resolve(true);

const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };

// the left nav as the Nov 2025 reference shows it (studio-c8-*.png), Community selected
const NAV = [
  ['dashboard', 'Dashboard'], ['content', 'Content'], ['analytics', 'Analytics'], ['community', 'Community'],
  ['languages', 'Languages'], ['detection', 'Content detection'], ['earn', 'Earn'], ['customization', 'Customization'],
  ['music', 'Creator Music [Beta]'],
];

function topbar(dark) {
  return `<header class="ys-top">
    <span class="ys-ib ys-menu">${icon('menu')}</span>
    <span class="ys-logo" aria-label="YouTube Studio">${STUDIO_LOGO(dark ? '#fff' : '#0f0f0f')}</span>
    <div class="ys-search">${icon('search')}<span>Search across your channel</span></div>
    <div class="ys-top-r">
      <span class="ys-ib">${icon('notes')}</span>
      <span class="ys-ib">${icon('help')}</span>
      <span class="ys-ib ys-spark">${icon('sparkle')}</span>
      <span class="ys-ib">${icon('bell')}</span>
      <span class="ys-create">${icon('create')}<span>Create</span></span>
      <img class="ys-me" src="${CREATOR.avatar}" alt="${esc(CREATOR.name)}" decoding="sync" onerror="this.style.visibility='hidden'">
    </div>
  </header>`;
}

function nav() {
  return `<nav class="ys-nav">
    <div class="ys-chan">
      <img class="ys-chan-av" src="${CREATOR.avatar}" alt="${esc(CREATOR.name)}" decoding="sync" onerror="this.style.visibility='hidden'">
      <b>Your channel</b><span>${esc(CREATOR.name)}</span>
    </div>
    <div class="ys-items">
      ${NAV.map(([k, label]) => `<div class="ys-item${k === 'community' ? ' is-on' : ''}">${icon(k === 'community' ? 'communityFill' : k)}<span>${esc(label)}</span></div>`).join('')}
    </div>
    <div class="ys-nav-foot">
      <div class="ys-item">${icon('settings')}<span>Settings</span></div>
      <div class="ys-item">${icon('feedback')}<span>Send feedback</span></div>
    </div>
  </nav>`;
}

function mainCol() {
  return `<main class="ys-main"><div class="ys-scroll">
    <div class="ys-head">
      <h1>Community</h1>
      <div class="ys-tabs"><span class="is-on">Comments</span><span>Viewer posts</span><span>Mentions</span></div>
    </div>
    <div class="ys-filters">
      <span class="ys-ib ys-filt">${icon('filter')}</span>
      <span class="ys-chip">Published${icon('expandMore')}</span>
      <span class="ys-chip">Sort by${icon('expandMore')}</span>
    </div>
    <div class="ys-selall"><span class="ys-cb">${icon('checkbox')}</span></div>
    <div class="ys-list"></div>
  </div></main>`;
}

/** buildStudioComments(root, opts) -> the API above */
export function buildStudioComments(root, { order = ALL_COMMENTS.map((c) => c.id), theme = 'light', scroll = 0 } = {}) {
  const dark = theme === 'dark';
  const el = h(`<div class="ys-scaler" style="width:${NATIVE.w}px;height:${NATIVE.h}px;transform:scale(${SCALE})">
    <div class="yts${dark ? ' is-dark' : ''}">${topbar(dark)}<div class="ys-bodyrow">${nav()}${mainCol()}</div></div>
  </div>`);
  root.appendChild(el);
  const q = (s) => el.querySelector(s);
  const list = q('.ys-list');
  const rows = order.map((id) => {
    const c = COMMENT_BY_ID[id];
    const rEl = rowEl(c);
    list.appendChild(rEl);
    return rowRefs(rEl, c);
  });
  const rowById = Object.fromEntries(rows.map((r) => [r.id, r]));
  const main = q('.ys-main');
  const scroller = q('.ys-scroll');
  const api = {
    el, page: q('.yts'), topbar: q('.ys-top'), nav: q('.ys-nav'), main, scroller, list, rows, rowById,
    scale: SCALE, native: NATIVE,
    measure() {
      const out = {};
      for (const r of rows) {
        // measure with every hidden part open, then put the rows back the way they were
        const keep = [r.replySlot, r.composerSlot, r.pinSlot].map((s) => s.style.height);
        [r.replySlot, r.composerSlot, r.pinSlot].forEach((s) => { s.style.height = 'auto'; });
        out[r.id] = { ...measureRow(r) };
        [r.replySlot, r.composerSlot, r.pinSlot].forEach((s, i) => { s.style.height = keep[i]; });
      }
      return { rows: out, scrollMax: Math.max(0, scroller.scrollHeight - main.clientHeight) };
    },
    setScroll(y) { scroller.style.transform = `translateY(${(-Math.max(0, y)).toFixed(2)}px)`; },
  };
  api.measure();
  for (const r of rows) { setReply(r, 0); setComposer(r, 0); setHeart(r, 0); setPin(r, 0); setCount(r, 0); }
  if (scroll) api.setScroll(scroll);
  return api;
}

/** applyFinal(api): the end state of yt-replies' Studio half (every reply posted, every top comment hearted,
    Priya's comment pinned). Build with the pinned order for the true end state. For the preview and for reviewers. */
export function applyFinal(api) {
  api.measure();
  for (const r of api.rows) {
    const top = r.id in { lena: 1, marco: 1, priya: 1, dee: 1, tom: 1 };
    if (!top) continue;
    setReply(r, 1); setHeart(r, 1); setCount(r, 1);
    setPin(r, r.id === PINNED_ID ? 1 : 0);
  }
}
