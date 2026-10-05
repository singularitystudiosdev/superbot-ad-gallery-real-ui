// The public YouTube watch page (dark theme), the proof after superbot's YouTube Studio connection has posted the
// replies and pinned Priya's comment: it arrives in one push with the chat (the two move as one strip), opens on the
// player paused at 7:05 (the moment Sam's pinned reply points to), then settles on the comments: Priya's pinned thread
// open on Sam's answer, Marco's and Lena's answered too ("1 reply" with the creator's avatar). Laid out in YouTube's
// own CSS px under `zoom` (see style.css .yt), so every glyph is rasterised at 1080p, never scaled up.
import { seg, esc, outCubic, inOutCubic, el } from './lib.js';
import { ICON } from './icons.js';
import { VIDEO, TOP } from './data.js';
import { T } from './timing.js';
import { frameSVG } from './thumb.js';

const ms = (n, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICON[n]}</svg>`;
const OWNER = '#1e8e3e';
const linkTimes = (s) => esc(s).replace(/\b(\d{1,2}:\d{2})\b/g, '<a>$1</a>');

function reply(c, ago) {
  return `<div class="yr">
    <span class="yav s24" style="background:${OWNER}">S</span>
    <div><div class="yhd"><span class="yowner">${VIDEO.handle}</span><span class="yago">${ago}</span></div>
      <div class="ytx">${linkTimes(c.reply.join(' '))}</div>
      <div class="yact sm"><span class="ybtn ic">${ms('thumb-up-outline')}</span><span class="ybtn ic">${ms('thumb-down-outline')}</span><span class="ybtn txt">Reply</span></div>
    </div></div>`;
}

function thread(c, open) {
  return `<div class="yc" data-k="yc">
    <span class="yav" style="background:${c.color}">${c.init}</span>
    <div class="ybody">
      ${c.pin ? `<div class="ypin"><span>${ms('keep')}Pinned by ${VIDEO.handle}</span></div>` : ''}
      <div class="yhd"><b>${c.handle}</b><span class="yago">${c.ago}</span></div>
      <div class="ytx">${linkTimes(c.text)}</div>
      <div class="yact"><span class="ybtn ic">${ms('thumb-up-outline')}</span><span class="ycount">${c.likes}</span>
        <span class="ybtn ic">${ms('thumb-down-outline')}</span>
        <span class="ybtn txt">Reply</span></div>
      <div class="ytog">${ms(open ? 'keyboard-arrow-up' : 'keyboard-arrow-down')}<span class="yav s16" style="background:${OWNER}">S</span><span>·</span>1 reply</div>
      ${open ? reply(c, 'Just now') : ''}
    </div>
    ${open ? `<span class="ymore" data-k="ymore">${ms('more-vert')}</span>` : ''}
  </div>`;
}

// YouTube's masthead is sticky on the watch page, so it stays at the top while the comments scroll under it
const masthead = () => `<div class="ymast">
  <span class="ymi">${ms('menu')}</span><img class="ylogo" src="brand/youtube-logo-dark.svg" alt="">
  <span class="ysearch"><span>Search</span><b>${ms('search')}</b></span><span class="ymi ymic">${ms('mic')}</span><i></i>
  <span class="ycreate">${ms('add')}Create</span><span class="ymi">${ms('notifications-outline')}</span>
  <span class="yav s32" style="background:${OWNER}">S</span>
</div>`;

export function mountYouTube(root) {
  const sec = el(`<section id="yt" class="scene"><div class="ybg" data-k="ybg"></div><div class="ycont" data-k="ycont"><div class="yt"><div class="yin" data-k="yin">
    <div class="yplayer">${frameSVG()}
      <div class="ygrad"></div>
      <div class="ybar"><span class="yplayed" style="width:${((425 / VIDEO.lengthS) * 100).toFixed(2)}%"></span><span class="yknob" style="left:${((425 / VIDEO.lengthS) * 100).toFixed(2)}%"></span></div>
      <div class="yctl"><span>${ms('play-arrow')}</span><span>${ms('skip-next')}</span><span>${ms('volume-up')}</span>
        <span class="ytime">7:05 / ${VIDEO.length}</span><i></i>
        <span>${ms('subtitles-outline')}</span><span>${ms('settings-outline')}</span><span>${ms('picture-in-picture-alt-outline')}</span><span>${ms('crop-16-9-outline')}</span><span>${ms('fullscreen')}</span></div>
    </div>
    <h1 class="ytitle">${esc(VIDEO.title)}</h1>
    <div class="yown"><span class="yav" style="background:${OWNER}">S</span>
      <div class="yname"><b>${VIDEO.channel}</b><span>${VIDEO.subs}</span></div>
      <span class="ypillbtn">Analytics</span><span class="ypillbtn">Edit video</span><i></i>
      <span class="ylike">${ms('thumb-up-outline')}${VIDEO.likes}<b></b>${ms('thumb-down-outline')}</span>
      <span class="ypillbtn yic">${ms('share-outline')}Share</span><span class="ypillbtn yround">${ms('more-horiz')}</span>
    </div>
    <div class="ych"><b>${VIDEO.comments} Comments</b><span>${ms('sort')}Sort by</span></div>
    <div class="yadd"><span class="yav" style="background:${OWNER}">S</span><span class="yph">Add a comment...</span></div>
    ${thread(TOP[0], true)}
  </div></div><div class="yt ytop">${masthead()}</div></div></section>`);
  root.appendChild(sec);
  const q = (k) => sec.querySelector(`[data-k="${k}"]`);
  return { sec, bg: q('ybg'), cont: q('ycont'), yt: sec.querySelector('.yt'), yin: q('yin'), more: q('ymore'), ych: sec.querySelector('.ych') };
}

export function measureYouTube(n) {
  const first = n.more.parentElement;
  // open on the comments header under the masthead (56 CSS px), Priya's pinned thread whole below it
  n.y1 = n.ych.offsetTop - 10;
}

/** Material fade-through (unrelated surfaces): once the chat has faded out (chat.js), the whole watch page, masthead
 *  included, fades in settling from 0.96x; the two overlap only at low opacity for two frames, nothing goes black */
export function renderYouTube(n, t) {
  const a = seg(t, T.pageIn[0], T.pageIn[1]);
  n.sec.style.visibility = t >= T.pageIn[0] ? 'visible' : 'hidden';
  n.sec.style.opacity = outCubic(a).toFixed(3);
  n.sec.style.transform = a >= 1 ? 'none' : `scale(${(0.96 + 0.04 * outCubic(a)).toFixed(5)})`;
  // then the camera keeps easing in on the comments
  const z = inOutCubic(seg(t, T.ytPush[0], T.ytPush[1]));
  n.yt.style.transform = z > 0 ? `scale(${(1 + 0.03 * z).toFixed(5)})` : 'none';
  n.yin.style.transform = `translateY(${(-n.y1).toFixed(2)}px)`;
}
