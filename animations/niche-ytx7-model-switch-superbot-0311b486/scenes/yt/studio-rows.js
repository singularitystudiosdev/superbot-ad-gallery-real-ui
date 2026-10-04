// scenes/yt/studio-rows.js: one YouTube Studio Comments row (Community > Comments) and the setters that move a row
// between its states. Markup in Studio's native CSS px (studio.js scales the whole page). Used by studio.js; the
// motion unit may import the setters directly.
//
// A row: checkbox | avatar | [pin line] handle line (name, age) / text / actions (Reply, n replies, like, dislike,
// heart, more) | the video column (thumbnail + title). Under it, hidden until revealed:
//   composer   Studio's reply box (Sam's avatar, the typed text on an underline, Cancel + Reply)
//   reply      Sam's posted reply: checkbox | avatar | owner pill `Sam Rivera` / text / actions. NO timestamp.
//
// Setters (all pure DOM writes, f in 0..1, safe to call every frame; nothing animates by itself):
//   setReply(row, f)            the reply slot opens to its natural height, the reply fades/rises in
//   setComposer(row, f, text?)  the reply box opens; text (optional) replaces the typed text
//   setHeart(row, f)            the creator heart fills red (outline out, filled in)
//   setPin(row, f)              the `Pinned by Sam Rivera` line opens above the name
//   setCount(row, f)            `0 replies` crossfades to `1 reply`
//   measureRow(row)             records row.h = { row, reply, composer, pin } natural heights (native px)
import { esc } from '../../lib.js';
import { CREATOR, VIDEO, REPLIES, PIN_LABEL } from './content.js';
import { icon } from './icons.js';

const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const im = (src, cls, alt = '') => `<img class="${cls}" src="${src}" alt="${esc(alt)}" decoding="sync" onerror="this.style.visibility='hidden'">`;
const cb = () => `<span class="ys-cb">${icon('checkbox')}</span>`;
const btn = (name, cls = '') => `<span class="ys-ib ${cls}">${icon(name)}</span>`;

function actions(kind, likes) {
  // kind 'c' (a viewer comment: Reply, n replies, like, dislike, heart, more) or 'r' (Sam's reply)
  const count = kind === 'c'
    ? `<span class="ys-count"><span class="ys-n0">0 replies${icon('expandMore', 'ys-chev')}</span><span class="ys-n1">1 reply${icon('expandLess', 'ys-chev')}</span></span>`
    : '';
  return `<div class="ys-acts">
    <span class="ys-reply-btn">Reply</span>${count}
    <span class="ys-ib ys-like">${icon('like')}${likes ? `<b class="ys-likes">${esc(likes)}</b>` : ''}</span>
    ${btn('like', 'ys-dislike')}
    <span class="ys-ib ys-heart">${icon('heart', 'ys-heart-off')}${icon('heartFill', 'ys-heart-on')}</span>
    ${btn('moreVert')}
  </div>`;
}

/** rowEl(comment) -> HTMLElement (the .ys-row with its comment, composer slot and reply slot) */
export function rowEl(c) {
  const reply = REPLIES[c.id] || '';
  return h(`<div class="ys-row" data-id="${c.id}">
    <div class="ys-c">
      ${cb()}
      ${im(c.avatar, 'ys-av', c.name)}
      <div class="ys-body">
        <div class="ys-pin-slot"><div class="ys-pin">${icon('pin')}<span>${esc(PIN_LABEL)}</span></div></div>
        <div class="ys-meta"><span class="ys-name">${esc(c.name)}</span><span class="ys-dot">•</span><span class="ys-age">${esc(c.age)}</span></div>
        <p class="ys-text">${esc(c.text)}</p>
        ${actions('c', c.likes)}
      </div>
      <div class="ys-vid">
        ${im(VIDEO.thumb, 'ys-thumb', VIDEO.title)}
        <span class="ys-vt">${esc(VIDEO.title)}</span>
      </div>
    </div>
    <div class="ys-comp-slot"><div class="ys-comp">
      ${im(CREATOR.avatar, 'ys-av ys-av-s', CREATOR.name)}
      <div class="ys-comp-in">
        <div class="ys-field"><span class="ys-typed">${esc(reply)}</span></div>
        <div class="ys-comp-btns"><span class="ys-cancel">Cancel</span><span class="ys-send">Reply</span></div>
      </div>
    </div></div>
    <div class="ys-reply-slot"><div class="ys-r">
      ${cb()}
      ${im(CREATOR.avatar, 'ys-av ys-av-s', CREATOR.name)}
      <div class="ys-body">
        <div class="ys-meta"><span class="ys-owner">${esc(CREATOR.name)}${icon('verified', 'ys-ver')}</span></div>
        <p class="ys-text ys-rtext">${esc(reply)}</p>
        ${actions('r', '')}
      </div>
    </div></div>
  </div>`);
}

/** rowRefs(el, comment) -> the row API object (see studio.js) */
export function rowRefs(el, c) {
  const q = (s) => el.querySelector(s);
  return {
    id: c.id,
    comment: c,
    el,
    body: q('.ys-c .ys-body'),
    text: q('.ys-c .ys-text'),
    replyBtn: q('.ys-c .ys-reply-btn'),
    count0: q('.ys-n0'),
    count1: q('.ys-n1'),
    heart: q('.ys-c .ys-heart'),
    heartOff: q('.ys-c .ys-heart-off'),
    heartOn: q('.ys-c .ys-heart-on'),
    pinSlot: q('.ys-pin-slot'),
    pinLabel: q('.ys-pin'),
    composerSlot: q('.ys-comp-slot'),
    composer: q('.ys-comp'),
    composerText: q('.ys-typed'),
    composerSend: q('.ys-send'),
    replySlot: q('.ys-reply-slot'),
    replyEl: q('.ys-r'),
    replyText: q('.ys-rtext'),
    ownerPill: q('.ys-owner'),
    replyHeart: q('.ys-r .ys-heart'),
    h: { row: 0, reply: 0, composer: 0, pin: 0 },
  };
}

/** measureRow(row): natural heights in native px (call once after mount, fonts loaded) */
export function measureRow(r) {
  r.h.reply = r.replyEl.offsetHeight;
  r.h.composer = r.composer.offsetHeight;
  r.h.pin = r.pinLabel.offsetHeight;
  r.h.row = r.el.querySelector('.ys-c').offsetHeight;
  return r.h;
}

const c01 = (f) => Math.min(1, Math.max(0, f));
const px = (v) => `${v.toFixed(2)}px`;

export function setReply(r, f) {
  f = c01(f);
  r.replySlot.style.height = f >= 1 ? 'auto' : px(r.h.reply * f);
  r.replyEl.style.opacity = c01((f - 0.25) / 0.75).toFixed(3);
  r.replyEl.style.transform = f >= 1 ? '' : `translateY(${px((1 - f) * 10)})`;
}

export function setComposer(r, f, text) {
  f = c01(f);
  if (text != null && r.composerText.textContent !== text) r.composerText.textContent = text;
  r.composerSlot.style.height = f >= 1 ? 'auto' : px(r.h.composer * f);
  r.composer.style.opacity = f.toFixed(3);
}

export function setHeart(r, f) {
  f = c01(f);
  r.heartOn.style.opacity = f.toFixed(3);
  r.heartOn.style.transform = `scale(${(0.6 + 0.4 * f).toFixed(3)})`;
  r.heartOff.style.opacity = (1 - f).toFixed(3);
}

export function setPin(r, f) {
  f = c01(f);
  r.pinSlot.style.height = f >= 1 ? 'auto' : px(r.h.pin * f);
  r.pinLabel.style.opacity = f.toFixed(3);
}

export function setCount(r, f) {
  f = c01(f);
  r.count0.style.opacity = (1 - f).toFixed(3);
  r.count1.style.opacity = f.toFixed(3);
}
