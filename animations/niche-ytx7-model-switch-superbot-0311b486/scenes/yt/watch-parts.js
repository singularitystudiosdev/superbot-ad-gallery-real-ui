// scenes/yt/watch-parts.js: the HTML partials of the watch page (player chrome, comment threads, up-next rail) and the
// page-only content that is not in content.js (chapters, description, rail videos). Used by watch.js only.
// Strings here are page furniture authored for this spot (fictional channels, no third-party owners named), checked
// against the policy: no em/en dashes, no relative time on anything Sam (superbot) posts.
import { esc } from '../../lib.js';
import { CREATOR, IMG, VIDEO } from './content.js';
import { I } from './watch-icons.js';

/** the video's length in seconds (14:32) */
export const DURATION = 14 * 60 + 32;

/** chapters of the 14:32 video: [startSec, title] (4:38 sits in "Desk setup and boom arm") */
export const CHAPTERS = [
  [0, 'Intro'],
  [72, 'How I tested'],
  [220, 'Desk setup and boom arm'],
  [325, 'The under $50 round'],
  [470, 'USB vs XLR'],
  [640, 'The $99 tier'],
  [790, 'Verdict'],
];

export const fmt = (s) => { s = Math.max(0, Math.floor(s)); const m = Math.floor(s / 60); const r = s % 60; return `${m}:${String(r).padStart(2, '0')}`; };
export const chapterAt = (s) => { let c = CHAPTERS[0][1]; for (const [t, n] of CHAPTERS) if (s >= t) c = n; return c; };

// description (collapsed, as the page ships it: the views/date line, two lines of text, "...more")
export const DESC = {
  tags: '#microphones #podcastgear #homestudio',
  lines: [
    'I spent a month testing 12 budget microphones under $100 in a normal, untreated room. USB and XLR, dynamic and condenser, every one recorded side by side.',
  ],
};

// up-next rail: generated-looking tiles composed from this spot's own rasters (crop of an image + bold overlay text)
// { title, channel, views, age, dur, img, pos, zoom, overlay }
export const RAIL = [
  { title: 'Best USB mic under $50? I tested 9 of them', channel: 'Audio Bench', meta: '412K views', age: '3 weeks ago', dur: '16:08',
    img: IMG.thumb, pos: '100% 78%', zoom: 1.9, overlay: '<em>$50</em> USB MICS' },
  { title: 'Low-profile boom arms ranked: which one disappears on camera?', channel: 'Desk Setup Weekly', meta: '97K views', age: '2 weeks ago', dur: '8:44',
    img: IMG.frame438, pos: '72% 38%', zoom: 2.2, overlay: 'BOOM <em>ARMS</em>' },
  { title: 'Streaming headsets under $80, are any of them worth it?', channel: 'Kit & Cable', meta: '154K views', age: '4 months ago', dur: '12:15',
    img: IMG.communityPost, pos: '50% 22%', zoom: 1.25, overlay: '' },
  { title: 'My budget desk setup tour (every piece under $100)', channel: CREATOR.name, meta: '88K views', age: '1 month ago', dur: '9:21',
    img: IMG.frame438, pos: '50% 40%', zoom: 1.05, overlay: '' },
  { title: 'Why your USB mic sounds thin (and the $0 fix)', channel: 'Room Tone Lab', meta: '61K views', age: '6 days ago', dur: '7:33',
    img: IMG.thumb, pos: '30% 95%', zoom: 1.8, overlay: 'SO <em>THIN?</em>', isNew: true },
  { title: 'Dynamic vs condenser in a bad room: the real difference', channel: 'Kit & Cable', meta: '236K views', age: '5 months ago', dur: '13:02',
    img: IMG.thumb, pos: '82% 90%', zoom: 2.4, overlay: 'DYN <em>VS</em> CON' },
  { title: 'I treated my room for $40 and recorded the same mic again', channel: 'Room Tone Lab', meta: '173K views', age: '2 months ago', dur: '11:47',
    img: IMG.frame438, pos: '8% 30%', zoom: 1.9, overlay: '<em>$40</em> ROOM' },
  { title: 'Podcast starter kit: everything you need under $150', channel: 'Desk Setup Weekly', meta: '58K views', age: '1 week ago', dur: '10:09',
    img: IMG.communityPost, pos: '20% 70%', zoom: 1.6, overlay: '' },
  { title: 'Headphones for editing on a budget, tested blind', channel: 'Kit & Cable', meta: '322K views', age: '7 months ago', dur: '18:26',
    img: IMG.communityPost, pos: '85% 35%', zoom: 1.9, overlay: 'BLIND <em>TEST</em>' },
  { title: 'Gain staging for USB mics in five minutes', channel: 'Audio Bench', meta: '45K views', age: '4 days ago', dur: '5:12',
    img: IMG.thumb, pos: '60% 98%', zoom: 2.1, overlay: 'GAIN <em>FIX</em>', isNew: true },
  { title: 'The cheapest XLR setup that actually sounds good', channel: 'Audio Bench', meta: '510K views', age: '1 year ago', dur: '14:55',
    img: IMG.frame438, pos: '62% 55%', zoom: 1.7, overlay: 'XLR <em>$79</em>' },
];

export const CHIPS = ['All', `From ${CREATOR.name}`, 'Microphones', 'Related', 'Recently uploaded'];

/** player chrome: progress bar (chapters, buffered, played clips, scrubber) + the 2026 pill control bar */
export function playerHtml(barW) {
  const chaps = CHAPTERS.map(([t], i) => {
    const end = i + 1 < CHAPTERS.length ? CHAPTERS[i + 1][0] : DURATION;
    return `<span class="ytw-chap" style="flex:${end - t} 1 0"></span>`;
  }).join('');
  return `<img class="ytw-frame" src="${esc(VIDEO.frame438)}" alt="">
    <div class="ytw-grad"></div>
    <div class="ytw-ctl">
      <div class="ytw-prog">
        <div class="ytw-chaps">${chaps}</div>
        <div class="ytw-clip ytw-buf" style="position:absolute;left:0;top:6px;height:4px;overflow:hidden;width:0"><div class="ytw-chaps ytw-in" style="top:0;width:${barW}px">${chaps.replace(/ytw-chap"/g, 'ytw-chap" data-k="buf"')}</div></div>
        <div class="ytw-clip ytw-fill" style="position:absolute;left:0;top:6px;height:4px;overflow:hidden;width:0"><div class="ytw-chaps ytw-in" style="top:0;width:${barW}px">${chaps.replace(/ytw-chap"/g, 'ytw-chap" data-k="red"')}</div></div>
        <div class="ytw-dot"></div>
      </div>
      <div class="ytw-bar">
        <span class="ytw-btn ytw-circ">${I.pause}</span>
        <span class="ytw-btn ytw-circ">${I.volume}</span>
        <span class="ytw-pill"><span class="ytw-time"><span class="ytw-cur">0:00</span><span class="ytw-sep"> / </span><span class="ytw-tdur">${VIDEO.length}</span></span></span>
        <span class="ytw-pill"><span class="ytw-chapname"><span class="ytw-chapt"></span>${I.chevRight}</span></span>
        <span class="ytw-pill ytw-right">
          <span class="ytw-auto"><span>${I.pause}</span></span>
          <span class="ytw-btn">${I.cc}</span>
          <span class="ytw-btn" style="position:relative">${I.gear}<i class="ytw-hd">HD</i></span>
          <span class="ytw-btn">${I.theater}</span>
          <span class="ytw-btn">${I.full}</span>
        </span>
      </div>
    </div>`;
}

/** one viewer comment's head + text + action row; heart = show the creator-heart slot (filled with Sam's avatar) */
export function commentInner(c, { pinned = false, heart = true } = {}) {
  return `${pinned ? `<div class="ytw-pin">${I.pin}<span class="ytw-pinlabel"></span></div>` : ''}
    <div class="ytw-ahead"><span class="ytw-author">${esc(c.handle)}</span><span class="ytw-age">${esc(c.age)}</span></div>
    <div class="ytw-ctext">${esc(c.text)}</div>
    <div class="ytw-cact"><span class="ytw-cb">${I.like}</span><span class="ytw-likes">${esc(c.likes)}</span><span class="ytw-cb">${I.dislike}</span>
      ${heart ? `<span class="ytw-heart"><img src="${esc(CREATOR.avatar)}" alt="">${I.heart}</span>` : ''}<span class="ytw-reply">Reply</span></div>`;
}

/** Sam's reply (owner pill with the channel handle, NO timestamp), as the expanded reply list renders it */
export function ownerReplyHtml(text) {
  return `<div class="ytw-r"><img src="${esc(CREATOR.avatar)}" alt=""><div class="ytw-cbody">
    <div class="ytw-ahead"><span class="ytw-owner-pill">${esc(CREATOR.handle)}</span></div>
    <div class="ytw-ctext ytw-rtext">${esc(text)}</div>
    <div class="ytw-cact"><span class="ytw-cb">${I.like}</span><span class="ytw-likes"></span><span class="ytw-cb">${I.dislike}</span><span class="ytw-reply">Reply</span></div>
  </div></div>`;
}

/** a whole thread: comment + the replies toggle with its connector line (+ the expanded reply list when replyText
 *  is given). replies = 0 renders a bare comment (no toggle, no line); heart = the creator-heart slot. */
export function threadHtml(c, { pinned = false, replyText = '', replies = 1, heart = false } = {}) {
  const label = `${replies} ${replies === 1 ? 'reply' : 'replies'}`;
  const open = !!replyText;
  return `<div class="ytw-thread" data-id="${esc(c.id)}">
    <div class="ytw-c"><div class="ytw-lcol"><img src="${esc(c.avatar)}" alt="">${replies ? '<i class="ytw-line"></i>' : ''}</div>
      <div class="ytw-cbody">${commentInner(c, { pinned, heart })}
        ${replies ? `<div class="ytw-toggle"><span>${label}</span>${open ? I.chevUp : I.chevDown}</div>` : ''}</div></div>
    ${open ? `<div class="ytw-replies">${ownerReplyHtml(replyText)}</div>` : ''}
  </div>`;
}

/** one up-next lockup */
export function railItemHtml(v) {
  return `<div class="ytw-item"><div class="ytw-thumb">
      <img src="${esc(v.img)}" alt="" style="object-position:${v.pos};transform:scale(${v.zoom});transform-origin:${v.pos}">
      ${v.overlay ? `<div class="ytw-ttl">${v.overlay}</div>` : ''}<span class="ytw-dur">${esc(v.dur)}</span></div>
    <div class="ytw-meta"><h4>${esc(v.title)}</h4><p>${esc(v.channel)}</p><p>${esc(v.meta)} • ${esc(v.age)}</p>${v.isNew ? '<span class="ytw-new">New</span>' : ''}<span class="ytw-kebab">${I.moreV}</span></div>
  </div>`;
}
