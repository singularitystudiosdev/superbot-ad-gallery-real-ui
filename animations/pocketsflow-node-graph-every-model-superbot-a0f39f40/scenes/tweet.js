// Act 1, the hook: a creator's X post in dark mode ("I made this in 1 prompt") with the Pocketsflow launch film
// playing in it: the same film the flow in act 3 renders (film.js), so the payoff is the post's own video. The post
// sits in a slice of the X timeline column (its 1px side rules run off the frame). The camera opens on the whole post at
// FIT0 of the frame and pushes in (inOutCubic over PUSH) until the video fills FIT1 of the frame width, then holds.
//
// render(lt) is a pure function of local time: the camera, the pill's countdown and the film's frame all come from lt.
// The post is laid out at X's own px (a 600px column, 15px/20px text) and the camera scales it.
import { clamp, lerp, seg, inOutCubic } from '../lib.js';
import { mountFilm, fitFilm, renderFilm, FILM_DUR } from './film.js';

const H = 1080;
const DUR = 5.0;
const pf = (f) => new URL('../img/pf/' + f, import.meta.url).href;
const AVATAR = 'avatar-kai.jpg';
// the film is already playing when the post comes up (X autoplays muted): at lt 0 it is FILM_T0 in
const FILM_T0 = 0.15;
const COL_W = 600;        // X's timeline column
const FIT0 = 0.8;         // the whole post fills this much of the frame at the open
const FIT1 = 0.9;         // the video fills this much of the frame width at the end of the push
const PUSH = [0.3, 3.8];  // the push-in window (inOutCubic)
const CREEP = 1.018;      // the hold keeps drifting in this much by the end of the scene

const POST = {
  name: 'Kai', handle: '@kaiships', ago: '2h',
  text: 'I made this in 1 prompt',
  counts: { reply: '214', repost: '1.1K', like: '9.8K', views: '1.2M' },
};

// X's own 24x24 icon paths (badge: 22x22)
const P = {
  badge: 'M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z',
  more: 'M3 12c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm9 2c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm7 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z',
  reply: 'M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01zm8.005-6c-3.317 0-6.005 2.69-6.005 6 0 3.37 2.77 6.08 6.138 6.01l.351-.01h1.761v2.3l5.087-2.81c1.951-1.08 3.163-3.13 3.163-5.36 0-3.39-2.744-6.13-6.129-6.13H9.756z',
  repost: 'M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z',
  like: 'M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z',
  views: 'M8.75 21V3h2v18h-2zM18 21V8.5h2V21h-2zM4 21l.004-10h2L6 21H4zm9.248 0v-7h2v7h-2z',
  bookmark: 'M4 4.5C4 3.12 5.119 2 6.5 2h11C18.881 2 20 3.12 20 4.5v18.44l-8-5.71-8 5.71V4.5zM6.5 4c-.276 0-.5.22-.5.5v14.56l6-4.29 6 4.29V4.5c0-.28-.224-.5-.5-.5h-11z',
  share: 'M12 2.59l5.7 5.7-1.41 1.42L13 6.41V16h-2V6.41l-3.3 3.3-1.41-1.42L12 2.59zM21 15l-.02 3.51c0 1.38-1.12 2.49-2.5 2.49H5.5C4.11 21 3 19.88 3 18.5V15h2v3.5c0 .28.22.5.5.5h12.98c.28 0 .5-.22.5-.5L19 15h2z',
};
const icon = (d, cls = 'tw-ic', vb = 24) => `<svg class="${cls}" viewBox="0 0 ${vb} ${vb}" aria-hidden="true"><path d="${d}"/></svg>`;
// X's muted-video toggle: a speaker with a cross, white on the dark disc
const MUTE = '<svg class="tw-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9h4l5-4v14l-5-4H3z" fill="#fff"/><path d="M15.5 9.5l5 5m0-5l-5 5" stroke="#fff" stroke-width="2" stroke-linecap="round" fill="none"/></svg>';

const act = (k, n) => `<div class="tw-act tw-act-${k}">${icon(P[k])}${n ? `<span class="tw-n">${n}</span>` : ''}</div>`;
// m:ss, what X's pill shows (the time left in the film)
const clock = (s) => { const n = Math.max(0, Math.ceil(s - 1e-6)); return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`; };

let el = null;

// the post's geometry in the camera's design px (offsets ignore the camera transform)
function measure() {
  const off = (n) => { let x = 0, y = 0; while (n && n !== el.cam) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; } return { x, y }; };
  const p = off(el.post), m = off(el.media);
  return {
    post: { x: p.x, y: p.y, w: el.post.offsetWidth, h: el.post.offsetHeight },
    media: { x: m.x, y: m.y, w: el.media.offsetWidth, h: el.media.offsetHeight },
  };
}

export default {
  id: 'tweet',
  dur: DUR,

  mount(section) {
    const c = POST.counts;
    section.innerHTML = `
<div class="tw-cam">
  <div class="tw-col">
    <article class="tw-post">
      <div class="tw-av"><img src="${pf(AVATAR)}" alt="" decoding="sync"/></div>
      <div class="tw-main">
        <div class="tw-head">
          <span class="tw-name">${POST.name}</span>${icon(P.badge, 'tw-badge', 22)}
          <span class="tw-handle">${POST.handle}</span><span class="tw-dot">·</span><span class="tw-ago">${POST.ago}</span>
          ${icon(P.more, 'tw-ic tw-more')}
        </div>
        <div class="tw-text">${POST.text}</div>
        <div class="tw-media">
          <div class="tw-vid"></div>
          <span class="tw-pill">${clock(FILM_DUR)}</span>
          <span class="tw-mute">${MUTE}</span>
        </div>
        <div class="tw-acts">
          ${act('reply', c.reply)}${act('repost', c.repost)}${act('like', c.like)}${act('views', c.views)}
          <div class="tw-act-end">${act('bookmark')}${act('share')}</div>
        </div>
      </div>
    </article>
  </div>
</div>`;
    const q = (s) => section.querySelector(s);
    el = { sec: section, cam: q('.tw-cam'), post: q('.tw-post'), media: q('.tw-media'), vid: q('.tw-vid'), pill: q('.tw-pill'), pillText: '' };
    el.film = mountFilm(el.vid);
  },

  render(lt, ctx) {
    if (!el) return;
    const t = clamp(lt, 0, DUR);
    const W = (ctx && ctx.W) || 1920;
    const g = measure();
    if (!g.post.h || !g.media.w) return;

    // camera: the whole post at FIT0 of the frame, pushing in until the video is FIT1 of the frame width
    // (and never taller than FIT1 of its height); scale eases geometrically so the push reads as one steady move
    const s0 = FIT0 * Math.min(W / g.post.w, H / g.post.h);
    const s1 = FIT1 * Math.min(W / g.media.w, H / g.media.h);
    const f = inOutCubic(seg(t, PUSH[0], PUSH[1]));
    const s = s0 * Math.pow(s1 / s0, f) * lerp(1, CREEP, seg(t, PUSH[1], DUR));
    const fx = lerp(g.post.x + g.post.w / 2, g.media.x + g.media.w / 2, f);
    const fy = lerp(g.post.y + g.post.h / 2, g.media.y + g.media.h / 2, f);
    el.cam.style.transform = `translate(${(W / 2).toFixed(2)}px,${H / 2}px) scale(${s.toFixed(5)}) translate(${(-fx).toFixed(2)}px,${(-fy).toFixed(2)}px)`;

    // the film follows t, sized to the media box (layout px: the camera's scale does the rest)
    const want = clamp(t + FILM_T0, 0, FILM_DUR);
    const pill = clock(FILM_DUR - want);
    if (pill !== el.pillText) { el.pill.textContent = pill; el.pillText = pill; }
    fitFilm(el.film, el.vid.offsetWidth);
    renderFilm(el.film, want);
  },
};
