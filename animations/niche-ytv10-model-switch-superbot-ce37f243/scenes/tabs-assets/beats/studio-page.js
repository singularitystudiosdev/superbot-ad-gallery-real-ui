// The ONE screen of the before and after: YouTube Studio's comments page (light theme) inside a superbot frame. The
// BEFORE (before.js) and the AFTER (studio.js) both build it from here, so the two states are the same pixels: the
// superbot title bar (the hub's superbot avatar, "superbot", the YouTube mark and a plain-text label), Studio's top bar
// (menu glyph, the YouTube Studio logo, the "S" avatar), the header ("Community" over "Comments" and a plain-text state
// line) and the comment rows in Studio's row grammar (letter avatar, name, comment, the action row as state only, the
// video column on the right).
// Policy guard (X Ads deceptive content): nothing here is a control. No Create, no search pill, no sort, no filter
// chip, no Reply links, no reply toggles, no dislike or more icons, no relative times; "Before" / "After" and the
// state line are plain text; the snackbar (AFTER only) has no action.
// Every comment and reply comes from watch.js TOP and replies.js REPLY (never retyped); the fillers below are the
// pile's other commenters, used in the BEFORE only.
import { ms } from './yt-icons.js?v=ce37f243';
import { TOP, VIDEO } from './watch.js?v=ce37f243';
import { REPLY } from './replies.js?v=ce37f243';

export const ACCOUNT = 'Sam Rivera';
// the page's design px to frame px (Studio's 15 px comment type renders at 28.5 px)
export const SC = 1.9;
// [name, comment, likes, avatar colour] (the base's avatar palette)
export const FILLERS = [
  ['Ana Costa', 'Can you do this for under $50 next?', '312', '#e8710a'],
  ['Jordan Lee', 'The $29 one sounds way better than it has any right to.', '268', '#1967d2'],
  ['Kofi Mensah', 'What interface are you running the XLR mics through?', '221', '#00897b'],
  ['Mia Chen', 'That blind test was so well done.', '187', '#d01884'],
  ['Ravi Patel', 'Is the USB one good enough for a podcast?', '154', '#9334e6'],
  ['Elena Rossi', 'Subscribed after the blind test.', '139', '#e8710a'],
  ['Noah Kim', 'Which one has the least handling noise?', '96', '#1967d2'],
  ['Sofia Alvarez', 'Wireless lav mics next please!', '71', '#00897b'],
];

export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export const av = (name, c, cls = '') => `<span class="st-av ${cls}" style="--c: ${c}">${esc(name[0])}</span>`;
// the heart is STATE only: the filled red heart with the creator's avatar, invisible until superbot hearts the comment.
// Never YouTube's outline heart (that glyph is the heart button, a control).
const HEART = `<span class="st-hrt">${ms('favorite', 'st-hf1')}<i class="st-hav">S</i></span>`;

// one comment row. kind 'before': the action row ends on a quiet "No reply"; kind 'after': the heart, the reply slot
// (Sam Rivera in YouTube's owner pill, the full reply) and, for the pinned comment, the pinned-label slot.
export function row({ name, text, likes, c, kind, img, pinned = false, key = '' }) {
  const first = name.split(' ')[0];
  const after = kind === 'after';
  return `<div class="st-blk" data-k="${esc(key)}"><i class="st-wash"></i>
    <div class="st-cm">${av(name, c)}
      <div class="st-body">
        ${pinned ? `<div class="st-pslot"><div class="st-pinned">${ms('keep', 'st-pi')}<span>Pinned by ${esc(ACCOUNT)}</span></div></div>` : ''}
        <div class="st-meta"><b>${esc(name)}</b></div>
        <div class="st-text st-ctext">${esc(text)}</div>
        <div class="st-acts">${ms('thumb-up-outline', 'st-lg')}<span class="st-n">${likes}</span>${after ? HEART : '<span class="st-norep">No reply</span>'}</div>
        ${after ? `<div class="st-rslot"><div class="st-rep">${av(ACCOUNT, 'var(--yt-me)', 'st-av-s')}
          <div class="st-body"><div class="st-meta"><b class="st-owner">${esc(ACCOUNT)}</b></div>
            <div class="st-text st-rtext">${esc(REPLY[first])}</div></div></div></div>` : ''}
      </div>
      <div class="st-vid"><img src="${img('mic-frame.jpg')}" width="1280" height="720" alt=""/><span>${esc(VIDEO.title)}</span></div>
    </div></div>`;
}

export const topRow = (ti, kind, img, pinned = false) => {
  const [name, text, likes, , c] = TOP[ti];
  return row({ name, text, likes, c, kind, img, pinned, key: `t${ti}` });
};
export const fillerRow = (fi, img) => {
  const [name, text, likes, c] = FILLERS[fi];
  return row({ name, text, likes, c, kind: 'before', img, key: `f${fi}` });
};

// the framed window: title bar + the port (clips the page, which the AFTER zooms and scrolls) + the page
export function windowMarkup({ sbSrc, brand, label, state, list, snack = '' }) {
  return `<div class="st-win">
    <div class="st-sb"><img class="st-sbt" src="${sbSrc}" alt=""/><b>superbot</b><i class="st-sbv"></i><img class="st-sby" src="${brand('youtube-icon.svg')}" alt=""/><span class="st-sbl">${label}</span></div>
    <div class="st-port"><div class="st-app">
      <header class="st-top">
        <span class="st-btn">${ms('menu')}</span>
        <span class="st-logo"><img src="${brand('youtube-studio-logo.svg')}" alt=""/></span>
        <span class="st-me">S</span>
      </header>
      <section class="st-page">
        <div class="st-head"><div class="st-crumb"><small>Community</small><i>/</i><h1 class="st-h1">Comments</h1></div><div class="st-state">${state}</div></div>
        <div class="st-list">${list}</div>
      </section>
    </div>${snack ? `<div class="st-snack">${esc(snack)}</div>` : ''}</div>
  </div>`;
}
