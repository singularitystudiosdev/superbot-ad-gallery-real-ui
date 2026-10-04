// YouTube desktop watch page, 1920x1080 viewport, light theme, seek-safe.
// export function mountWatchPage(host, data) -> { el, videoSlot, update(state), geometry }
// videoSlot: the exact 16:9 player area (1344x756, page x16 y68) the motion agent mounts its canvas into.
import { icon } from './icons.js';
import defaultData from './story-data.js';
import { ensureCss, assetUrl, clamp01, ease, easeOut, esc, fmtTime, mix } from './util.js';

const PLAYER = { x: 16, y: 68, w: 1344, h: 756 };
const BAR = { x: 12, w: 1320, y: 697 }; // progress bar inside the player (centre line)

// Up next (fictional, the same creator's other uploads; thumbnails are the ad's own generated frames)
const UP_NEXT = [
  { img: 'img/frames/s0410.jpg', title: 'Sliding barn door rail for a tiny room, the full install', meta: '96K views · 3 weeks ago', len: '12:08' },
  { img: 'img/frames/s0930.jpg', title: 'Felt acoustic panels for under $80 (they actually work)', meta: '141K views · 1 month ago', len: '9:47' },
  { img: 'img/frames/s1105.jpg', title: 'Keeping a PC quiet and cool in a closet, what worked', meta: '58K views · 2 months ago', len: '14:31' },
  { img: 'img/frames/f0738.jpg', title: 'My small space desk setup, one year later', meta: '203K views · 4 months ago', len: '18:02' },
  { img: 'img/frames/f0744.jpg', title: 'Warm lighting on a budget: 5 lamps compared', meta: '77K views · 5 months ago', len: '11:26' },
  { img: 'img/frames/f0742.jpg', z: [2.1, '54%', '14%'], title: 'Paper lantern softbox, the cheapest soft light I own', meta: '64K views · 6 months ago', len: '8:14' },
  { img: 'img/frames/s1105.jpg', z: [1.9, '40%', '45%'], title: '120 mm fans ranked by noise, quietest to loudest', meta: '39K views · 7 months ago', len: '13:52' },
  { img: 'img/frames/s0930.jpg', z: [1.7, '62%', '35%'], title: 'Where to put acoustic panels in a tiny room', meta: '88K views · 8 months ago', len: '10:05' },
  { img: 'img/frames/f0740.jpg', z: [1.8, '45%', '40%'], title: 'Floating shelves that hold 40 kg, no visible brackets', meta: '112K views · 9 months ago', len: '15:40' },
  { img: 'img/frames/s0410.jpg', z: [1.8, '30%', '25%'], title: 'Renter friendly upgrades I can take with me', meta: '150K views · 1 year ago', len: '16:12' },
];
const WATCH_COMMENTS = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7'];
const POSTERS = [[458, 'img/frames/f0738.jpg'], [460, 'img/frames/f0740.jpg'], [462, 'img/frames/f0742.jpg'], [464, 'img/frames/f0744.jpg']];

const TS = /(\b\d{1,2}:\d{2}\b)/g;
const linkify = (t) => esc(t).replace(TS, '<a class="ts">$1</a>');

export function mountWatchPage(host, data = defaultData) {
  const D = { ...defaultData, ...data };
  ensureCss();
  const A = (p) => assetUrl(p, D.assetBase);
  const dur = D.video.durationSec;
  const chaps = D.chapters.map((c, i) => ({ ...c, end: i + 1 < D.chapters.length ? D.chapters[i + 1].t : dur }));

  const el = document.createElement('div');
  el.className = 'yt-root yt-watch';
  el.innerHTML = `
  <div class="w-page">
    <div class="w-player" style="left:${PLAYER.x}px;top:${PLAYER.y}px;width:${PLAYER.w}px;height:${PLAYER.h}px">
      <div class="w-poster yt-img"></div>
      <div class="w-slot"></div>
      <div class="w-ann sb-layer">
        <div class="w-ann-scrim"></div>
        <div class="w-ann-box"><i class="c tl"></i><i class="c tr"></i><i class="c bl"></i><i class="c br"></i></div>
        <div class="w-ann-label"><span class="sb-mark"></span><span class="w-ann-model">Gemini</span><span class="w-ann-t"></span></div>
      </div>
      <div class="w-chrome">
        <div class="w-shade"></div>
        <div class="w-bar">${chaps.map((c, i) => `<div class="w-seg" data-i="${i}"><i class="buf"></i><i class="hov"></i><i class="play"></i></div>`).join('')}</div>
        <div class="w-knob"></div>
        <div class="w-ctl">
          <div class="w-cb w-pp">${icon('play-arrow', 36)}</div>
          <div class="w-cb">${icon('volume-up', 28)}</div>
          <div class="w-time"><span class="w-tt">0:00</span><span class="w-dur">&nbsp;/&nbsp;${esc(D.video.length)}</span><span class="w-chap"><span class="dotsep">•</span><span class="w-chap-t"></span>${icon('chevron-right', 20)}</span></div>
          <div class="w-right">
            <div class="w-cb"><span class="w-auto"><i></i></span></div>
            <div class="w-cb">${icon('closed-caption', 28)}</div>
            <div class="w-cb">${icon('settings-outline', 26)}</div>
            <div class="w-cb"><svg class="yt-ic" viewBox="0 0 24 24" width="26" height="26"><path fill="currentColor" d="M19 6H5c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 10H5V8h14v8z"/></svg></div>
            <div class="w-cb">${icon('fullscreen', 30)}</div>
          </div>
        </div>
      </div>
      <div class="w-prev"><div class="w-prev-img yt-img"></div><div class="w-prev-ch"></div><div class="w-prev-t"></div></div>
    </div>

    <div class="w-sec">
      <div class="w-chips"><span class="w-chip on">All</span><span class="w-chip">From ${esc(D.creator.name)}</span><span class="w-chip">Home improvement</span><span class="w-chip">Related</span></div>
      ${UP_NEXT.map((v) => `<div class="w-rec"><div class="yt-img w-rec-img"><img src="${A(v.img)}" alt=""${v.z ? ` style="transform:scale(${v.z[0]});transform-origin:${v.z[1]} ${v.z[2]}"` : ''}><span class="w-len">${v.len}</span></div>
        <div class="w-rec-txt"><div class="w-rec-ttl">${esc(v.title)}</div><div class="w-rec-meta">${esc(D.creator.name)} ${icon('check-circle', 14)}</div><div class="w-rec-meta">${esc(v.meta)}</div></div></div>`).join('')}
    </div>

    <div class="w-primary">
      <h1 class="w-title">${esc(D.video.title)}</h1>
      <div class="w-owner">
        <div class="yt-img round w-oav"><img src="${A(D.creator.avatar)}" alt=""></div>
        <div class="w-oname"><div class="n">${esc(D.creator.name)} ${icon('check-circle', 14)}</div><div class="s">${esc(D.creator.subscribersLabel)}</div></div>
        <div class="w-sub">Subscribe</div>
        <div class="w-acts">
          <div class="w-pill w-like"><span class="l">${icon('thumb-up-outline', 24)}${esc(D.video.likesLabel)}</span><span class="sep"></span><span class="d">${icon('thumb-down-outline', 24)}</span></div>
          <div class="w-pill">${icon('share-outline', 24)}Share</div>
          <div class="w-pill">${icon('download', 24)}Download</div>
          <div class="w-pill w-more">${icon('more-horiz', 24)}</div>
        </div>
      </div>
      <div class="w-desc">
        <div class="w-desc-meta">${esc(D.video.viewsLabel)}&nbsp;&nbsp;${esc(D.video.age)}&nbsp;&nbsp;<span class="tag">#closetstudio #smallspace #studiotour</span></div>
        <div>Nine square metres, one door and a lot of trial and error. Every light, panel and fan from this build is linked below.</div>
        <div>Chapters are on the timeline, start at <a class="ts">7:30</a> for the shelf lighting. <span class="more">...more</span></div>
      </div>
      <div class="w-cm">
        <div class="w-cm-head"><span class="n">${esc(D.video.commentCountLabel)} Comments</span><span class="sort">${icon('sort', 24)}Sort by</span></div>
        <div class="w-cm-add"><div class="w-viewer round">J</div><div class="w-cm-in">Add a comment...</div></div>
        ${WATCH_COMMENTS.map((id) => { const c = D.commentById[id]; return `<div class="w-th" data-id="${id}"><div class="w-th-ring"></div>
          <div class="yt-img round w-th-av"><img src="${A(c.avatar)}" alt=""></div>
          <div class="w-th-body"><div class="w-th-meta"><span class="h">${esc(c.handle)}</span><span class="t">${esc(c.time)}</span></div>
          <div class="w-th-text">${linkify(c.text)}</div>
          <div class="w-th-acts"><span class="ib">${icon('thumb-up-outline', 20)}</span><span class="cnt">${esc(c.likes === '0' ? '' : c.likes)}</span><span class="ib">${icon('thumb-down-outline', 20)}</span><span class="rp">Reply</span></div></div></div>`; }).join('')}
      </div>
    </div>
  </div>
  <div class="w-top">
    <div class="ibtn">${icon('menu', 24)}</div>
    <div class="w-logo"><img src="${new URL('brand/youtube-logo.svg', import.meta.url).href}" alt=""></div>
    <div class="w-search"><div class="w-sin">Search</div><div class="w-sbtn">${icon('search', 24)}</div></div>
    <div class="ibtn w-mic">${icon('mic', 24)}</div>
    <div class="w-tr">
      <div class="w-create">${icon('add', 24)}Create</div>
      <div class="ibtn w-bell">${icon('notifications-outline', 24)}<span class="w-badge">9+</span></div>
      <div class="w-viewer round">J</div>
    </div>
  </div>`;
  host.appendChild(el);

  const q = (s) => el.querySelector(s);
  const page = q('.w-page');
  const videoSlot = q('.w-slot');
  const posterBox = q('.w-poster');
  const chrome = q('.w-chrome');
  const segs = [...el.querySelectorAll('.w-seg')].map((s) => ({ el: s, buf: s.querySelector('.buf'), hov: s.querySelector('.hov'), play: s.querySelector('.play') }));
  const knob = q('.w-knob');
  const pp = q('.w-pp');
  const tt = q('.w-tt');
  const chapT = q('.w-chap-t');
  const prev = q('.w-prev');
  const prevBox = q('.w-prev-img');
  const prevCh = q('.w-prev-ch');
  const prevT = q('.w-prev-t');
  const ann = q('.w-ann');
  const annScrim = q('.w-ann-scrim');
  const annBox = q('.w-ann-box');
  const annLabel = q('.w-ann-label');
  const annT = q('.w-ann-t');
  const threads = Object.fromEntries([...el.querySelectorAll('.w-th')].map((t) => [t.dataset.id, t]));

  // segment geometry along the bar (2 px gaps between chapters)
  const GAP = 2;
  const segGeo = chaps.map((c) => {
    const x0 = (c.t / dur) * BAR.w;
    const x1 = (c.end / dur) * BAR.w;
    return { x: x0 + (c.t > 0 ? GAP / 2 : 0), w: Math.max(1, x1 - x0 - (c.t > 0 ? GAP / 2 : 0) - (c.end < dur ? GAP / 2 : 0)) };
  });
  segs.forEach((s, i) => { s.el.style.left = segGeo[i].x.toFixed(2) + 'px'; s.el.style.width = segGeo[i].w.toFixed(2) + 'px'; });
  const timeToX = (t) => (clamp01(t / dur)) * BAR.w;
  const chapterAt = (t) => { let k = 0; chaps.forEach((c, i) => { if (t >= c.t) k = i; }); return k; };
  // Image stacks: every candidate <img> exists up front and update() only toggles which one shows,
  // so a seek never waits on a src swap (decode is async). Unknown srcs are added on first use.
  function stack(box) {
    const m = new Map();
    return {
      add(u) { if (!m.has(u)) { const i = document.createElement('img'); i.alt = ''; i.src = u; i.style.visibility = 'hidden'; box.appendChild(i); m.set(u, i); } return m.get(u); },
      show(u) { if (u) this.add(u); for (const [k, i] of m) i.style.visibility = k === u ? 'visible' : 'hidden'; },
    };
  }
  const posters = stack(posterBox);
  const previews = stack(prevBox);
  [D.video.thumb, ...POSTERS.map((x) => x[1])].forEach((u) => posters.add(A(u)));
  ['img/frames/s0410.jpg', 'img/frames/s0930.jpg', 'img/frames/s1105.jpg', ...POSTERS.map((x) => x[1])].forEach((u) => previews.add(A(u)));
  let posterSrc = '';

  function update(state = {}) {
    const vt = Math.max(0, Math.min(dur, state.videoTime ?? 0));
    const scrub = state.scrub && state.scrub.time != null ? state.scrub : null;
    page.style.transform = `translate3d(0, ${(-(state.scroll || 0)).toFixed(2)}px, 0)`;

    // poster fallback under the slot (motion canvas covers it)
    let ps = state.posterSrc;
    if (!ps) { ps = D.video.thumb; for (const [t, src] of POSTERS) if (Math.abs(vt - t) <= 1.01) { ps = src; break; } if (vt >= 457 && vt <= 466 && ps === D.video.thumb) ps = vt < 461 ? POSTERS[1][1] : POSTERS[3][1]; }
    const psu = A(ps);
    posters.show(psu); posterSrc = psu;

    // chrome
    const ctl = state.controls != null ? clamp01(state.controls) : 1;
    chrome.style.opacity = ctl.toFixed(3);
    pp.innerHTML = state.playing ? icon('pause', 36) : icon('play-arrow', 36);
    const shown = vt;
    tt.textContent = fmtTime(shown);
    chapT.textContent = chaps[chapterAt(shown)].title;

    const hoverK = scrub ? chapterAt(scrub.time) : -1;
    const playX = timeToX(vt);
    const bufX = timeToX(Math.min(dur, vt + 48));
    const hovX = scrub ? timeToX(scrub.time) : -1;
    segs.forEach((s, i) => {
      const g = segGeo[i];
      const fill = (x) => clamp01((x - g.x) / g.w) * 100;
      s.play.style.width = fill(playX).toFixed(3) + '%';
      s.buf.style.width = fill(bufX).toFixed(3) + '%';
      s.hov.style.width = scrub ? fill(hovX).toFixed(3) + '%' : '0%';
      const tall = scrub ? (i === hoverK ? 8 : 5) : 3;
      s.el.style.height = tall + 'px';
      s.el.style.top = (-tall / 2).toFixed(1) + 'px';
    });
    const knobOn = scrub || state.knob ? 1 : 0;
    knob.style.opacity = String(knobOn * ctl);
    knob.style.left = (BAR.x + playX - 6.5).toFixed(2) + 'px';

    // scrub preview
    if (scrub) {
      const W = 242;
      const cx = BAR.x + hovX;
      const left = Math.max(BAR.x, Math.min(BAR.x + BAR.w - W, cx - W / 2));
      prev.style.display = 'block';
      prev.style.left = left.toFixed(2) + 'px';
      prev.style.opacity = (scrub.p != null ? clamp01(scrub.p) : 1).toFixed(3);
      const su = scrub.previewSrc ? A(scrub.previewSrc) : posterSrc;
      previews.show(su);
      prevCh.textContent = chaps[chapterAt(scrub.time)].title;
      prevT.textContent = fmtTime(scrub.time);
    } else { prev.style.display = 'none'; prev.style.left = prev.style.opacity = ''; prevCh.textContent = prevT.textContent = ''; previews.show(''); }

    // annotation (superbot layer: Gemini reads the frame)
    const an = state.annotation && state.annotation.box ? state.annotation : null;
    if (an && an.p > 0) {
      const p = clamp01(an.p);
      const k = PLAYER.w / 1920;
      const [bx, by, bw, bh] = an.box.map((v) => v * k);
      const pb = easeOut(clamp01(p / 0.55));
      const pl = ease(clamp01((p - 0.4) / 0.6));
      ann.style.display = 'block';
      const grow = mix(1.18, 1, pb);
      const cx = bx + bw / 2, cy = by + bh / 2;
      const w = bw * grow, h = bh * grow;
      annBox.style.left = (cx - w / 2).toFixed(2) + 'px';
      annBox.style.top = (cy - h / 2).toFixed(2) + 'px';
      annBox.style.width = w.toFixed(2) + 'px';
      annBox.style.height = h.toFixed(2) + 'px';
      annBox.style.opacity = pb.toFixed(3);
      annScrim.style.opacity = (0.4 * pb).toFixed(3);
      annScrim.style.clipPath = `polygon(evenodd, 0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${bx}px ${by}px, ${bx}px ${by + bh}px, ${bx + bw}px ${by + bh}px, ${bx + bw}px ${by}px, ${bx}px ${by}px)`;
      annT.textContent = an.label || D.frameRead.label;
      // label sits under the box, or above it when the box is low in frame
      const below = by + bh + 22 + 52 < PLAYER.h - 70;
      annLabel.style.left = Math.max(12, Math.min(PLAYER.w - 12 - 720, bx)).toFixed(2) + 'px';
      annLabel.style.top = (below ? by + bh + 22 : by - 22 - 48).toFixed(2) + 'px';
      annLabel.style.opacity = pl.toFixed(3);
      annLabel.style.transform = `translateY(${((1 - pl) * (below ? -8 : 8)).toFixed(2)}px)`;
    } else {
      ann.style.display = 'none';
      for (const e of [annBox, annLabel, annScrim]) e.removeAttribute('style');
      annT.textContent = '';
    }

    // comments focus (superbot layer ring)
    const fp = state.focusP != null ? clamp01(state.focusP) : 1;
    for (const id in threads) {
      const on = state.focusCommentId === id ? fp : 0;
      threads[id].querySelector('.w-th-ring').style.opacity = on.toFixed(3);
      threads[id].classList.toggle('focus', on > 0);
    }
  }

  // Page geometry for the build worker: player rect, slot rect, and a thread's page-space top (for state.scroll)
  function geometry() {
    const tops = {};
    for (const id in threads) tops[id] = threads[id].offsetTop + q('.w-primary').offsetTop; // .w-th offsetParent is .w-primary
    return { player: { ...PLAYER }, bar: { x: PLAYER.x + BAR.x, y: PLAYER.y + BAR.y, w: BAR.w }, timeToPageX: (t) => PLAYER.x + BAR.x + timeToX(t), threadTops: tops };
  }

  update({ videoTime: 0 });
  return { el, videoSlot, update, geometry };
}

export { ytReady } from './util.js';
export default mountWatchPage;
