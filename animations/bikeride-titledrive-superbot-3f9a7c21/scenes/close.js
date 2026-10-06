// The close: a hard cut into the ride running full frame, three titles that swap in place over the motion (the A24
// title-drive device: one continuous forward shot, the words changing on it), then a held beat of black and silence,
// then the end card. The ride clip is the spot's own material (img/bike/ride.mp4); it runs slow and looped so the shot
// reads as one continuous glide under all three titles. render(lt) is a pure function of local time: the video follows
// t exactly (seeked when the clock is held, played when it runs), so export frames are deterministic.
import { seg, outCubic } from '../lib.js';

const CLIP = new URL('../img/bike/ride.mp4', import.meta.url).href;
const POSTER = new URL('../img/bike/poster.jpg', import.meta.url).href;
const RATE = 0.55;               // the glide runs slow so it covers the whole close without an obvious loop
const DRIFT_TOL = 0.25;          // live playback re-seeks only once it has drifted past this
const TITLES = [
  { text: 'MAKE A GAME',   at: 0.5,  out: 2.35 },
  { text: 'IN ONE CHAT',   at: 2.55, out: 4.4 },
  { text: 'superbot.gg',   at: 4.6,  out: 6.05 },
];
const TITLE_FADE = 0.5;
const BLACK_AT = 6.1, BLACK_HOLD = 1.2;
const DUR = BLACK_AT + BLACK_HOLD; // 7.3

let el = null;

export default {
  id: 'close',
  dur: DUR,

  mount(section) {
    section.innerHTML = `
<div class="close-root">
  <div class="close-shot"><video class="close-vid" playsinline preload="auto" loop poster="${POSTER}" src="${CLIP}"></video></div>
  <div class="close-scrim"></div>
  <div class="close-titles">${TITLES.map((t, i) => `<div class="close-title" data-i="${i}">${t.text}</div>`).join('')}</div>
  <div class="close-black"></div>
</div>`;
    const vid = section.querySelector('.close-vid');
    vid.muted = false; vid.defaultMuted = false;
    const start = () => { const p = vid.play(); if (p && p.catch) p.catch((e) => {
      if (e && e.name === 'NotAllowedError') { vid.muted = true; vid.play().catch(() => {}); }
      else if (!(e && e.name === 'AbortError')) console.error('close.js: video.play() rejected', e); }); };
    el = { section, vid, start, titles: [...section.querySelectorAll('.close-title')],
      scrim: section.querySelector('.close-scrim'), black: section.querySelector('.close-black') };
    el.vid.playbackRate = RATE;
  },

  render(lt) {
    if (!el) return;
    const t = Math.max(0, lt);
    const held = document.body.classList.contains('freeze');
    const inBlack = t >= BLACK_AT;
    // the clip follows t: it plays while the clock runs and the picture is showing, otherwise it is parked on exactly t
    const want = (((t * RATE) % 3.35) + 3.35) % 3.35;
    const live = !held && !inBlack && t >= 0;
    el.vid.playbackRate = RATE;
    if (live) {
      if (el.vid.paused) el.start();
      if (Math.abs(el.vid.currentTime - want) > DRIFT_TOL) el.vid.currentTime = want;
    } else {
      if (!el.vid.paused) el.vid.pause();
      if (el.vid.readyState >= 1 && Math.abs(el.vid.currentTime - want) > 0.02) el.vid.currentTime = want;
    }
    // the three titles swap in place over the motion
    for (let i = 0; i < TITLES.length; i++) {
      const c = TITLES[i];
      const v = inBlack ? 0 : outCubic(seg(t, c.at, c.at + TITLE_FADE)) * (1 - outCubic(seg(t, c.out, c.out + TITLE_FADE)));
      const node = el.titles[i];
      node.style.opacity = v.toFixed(3);
      node.style.transform = `translateY(${((1 - v) * 10).toFixed(2)}px)`;
    }
    el.scrim.style.opacity = (inBlack ? 0 : 0.4).toFixed(3);
    el.black.style.opacity = inBlack ? '1' : '0';
  },
};