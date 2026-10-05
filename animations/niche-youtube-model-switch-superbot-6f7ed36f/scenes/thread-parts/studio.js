// YouTube Studio in a Chrome window: the video's own comments page (studio.youtube.com/video/<id>/comments), the
// per-video left menu (Details, Analytics, Editor, Comments, Subtitles, Copyright, Earn, Clips), "Video comments"
// with the Published / Held for review tabs and the filter bar (support.google.com/youtube/answer/9482367).
// The replies superbot posted through the YouTube Data API (comments.insert) land under each comment as the
// creator's: the channel name in YouTube's grey creator chip, "Just now". Light theme, Roboto, YouTube's palette.
import { esc } from '../../lib.js';
import { h, ms, letterAv } from './feed.js';

const lucide = (inner) => `<svg class="lu" viewBox="0 0 24 24" aria-hidden="true">${inner}</svg>`;
const BACK = lucide('<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>');
const FWD = lucide('<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>');
const RELOAD = lucide('<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>');
const TUNE = lucide('<path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/>');

const NAV = [
  ['edit-outline', 'Details'], ['analytics-outline', 'Analytics'], ['movie-edit-outline', 'Editor'], ['comment', 'Comments', true],
  ['subtitles-outline', 'Subtitles'], ['copyright-outline', 'Copyright'], ['attach-money', 'Earn'], ['content-cut', 'Clips'],
];

export function buildStudio(video, creator, top, replies) {
  const el = h(`<div class="ys-st">
    <div class="cw-tabs"><i class="tl r"></i><i class="tl y"></i><i class="tl g"></i>
      <span class="cw-tab"><img src="brand/youtube-icon.svg" alt=""><span>Video comments - YouTube Studio</span>${ms('close')}</span>
    </div>
    <div class="cw-bar">${BACK}${FWD}${RELOAD}<span class="omni">${TUNE}<span>studio.youtube.com/video/${video.id}/comments</span></span><img class="cw-me" src="img/avatar.jpg" alt=""></div>
    <div class="sp">
      <div class="sp-top">${ms('menu', 'mi')}<img class="logo" src="brand/youtube-studio-logo.svg" alt="YouTube Studio">
        <span class="sp-search">${ms('search')}<span>Search across your channel</span></span>
        <span class="sp-r">${ms('help-outline', 'mi')}<span class="create">${ms('video-call-outline')}Create</span><img class="me" src="img/avatar.jpg" alt=""></span>
      </div>
      <div class="sp-body">
        <nav class="sn">
          <div class="sn-back">${ms('arrow-back')}<span>Channel content</span></div>
          <img class="sn-th" src="img/thumb.jpg" alt="">
          <div class="sn-yv">Your video</div>
          <div class="sn-tt">${esc(video.title)}</div>
          ${NAV.map(([i, l, on]) => `<div class="sn-i${on ? ' on' : ''}">${ms(i)}<span>${l}</span></div>`).join('')}
        </nav>
        <main class="sm">
          <h1>Video comments</h1>
          <div class="tabs"><span class="on">Published</span><span>Held for review</span></div>
          <div class="filt">${ms('filter-list')}<span>Filter</span></div>
          <div class="sl"><div class="sl-in">
            ${top.map((p, i) => `<div class="sc">
              ${letterAv(p, 'av')}
              <div class="sc-b">
                <div class="sc-meta"><b>${esc(p.handle)}</b><span>• ${esc(p.when)}</span></div>
                <div class="sc-tx">${esc(p.text)}</div>
                <div class="sc-act"><span class="sbtn">Reply</span><span class="tog">${ms('arrow-drop-down')}1 reply</span><span class="ib">${ms('thumb-up-outline')}</span><span class="n">${esc(p.likes)}</span><span class="ib">${ms('thumb-down-outline')}</span><span class="ib">${ms('favorite-outline')}</span><span class="grow"></span><span class="ib">${ms('more-vert')}</span></div>
                <div class="sr"><img src="img/avatar.jpg" alt=""><div><div class="sr-meta"><span class="chip">${esc(creator.handle)}</span><span>• Just now</span></div><div class="sr-tx">${esc(replies[i])}</div></div></div>
              </div>
            </div>`).join('')}
          </div></div>
        </main>
      </div>
    </div>
  </div>`);
  return {
    el, list: el.querySelector('.sl'), listIn: el.querySelector('.sl-in'),
    rows: [...el.querySelectorAll('.sc')].map((r) => ({ el: r, reply: r.querySelector('.sr'), tog: r.querySelector('.tog') })),
  };
}
