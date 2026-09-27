// reveal: Act 4. The game the chat's parts add up to: BlockHaven, playing in a browser tab at localhost:5173 (the dev
// server Opus started at the end of the chat). The scene hard-cuts in on the browser window floating on black, the
// BLOCKHAVEN title screen up; the camera pushes in until the page fills the frame (the tab strip leaves at the top), and
// the footage cuts through the gameplay: the ocean pan, then punching an oak log until it cracks. A small, honest
// credit sits bottom left the whole time: "BlockHaven by @kepochnik".
//
// FOOTAGE: img/bh/blockhaven.mp4, a trim of @kepochnik's BlockHaven video (see CREDITS.txt): 0-2.5s the title screen,
// 2.5-10.5s gameplay. CUTS maps scene time onto clip time as three straight pieces (title, ocean pan, tree punch), so
// the edit is hard cuts inside real-time footage, never a speed change.
//
// render(lt) is a pure function of local time. The clip is a real <video>: a frozen frame (?t= puts body.freeze) pauses
// it and seeks to the frame t asks for; a playing frame plays it and only re-seeks past DRIFT_TOL of drift (which is
// also how each cut lands: the wanted time jumps, the drift check seeks).
import { clamp, lerp, seg, inOutCubic, outCubic } from '../lib.js';

const H = 1080;
const DUR = 6.0;
const bh = (f) => new URL('../img/bh/' + f, import.meta.url).href;
const CLIP = 'blockhaven.mp4', POSTER = 'stills/title.jpg', FAV = 'tex/grass-top.png';
const CLIP_END = 10.45;
// [scene start, clip start]: each piece plays in real time until the next one starts
const CUTS = [
  [0, 0.15],     // the BLOCKHAVEN title screen
  [1.8, 3.3],    // in-world: the ocean pan past the shore
  [3.2, 7.0],    // punching the oak log until it cracks
];
const SEED_TOL = 0.04, DRIFT_TOL = 0.25;
const VID_AR = 1080 / 780;   // the footage's own aspect
const BAR = 74;              // the browser's tab strip + address bar, in window px
const FIT0 = 0.84;           // the whole window fills this much of the frame height at the open
const PUSH = [0.3, 1.75];    // the push-in: the page ends up filling the frame height
const CREEP = 1.035;

const want = (t) => {
  let c = CUTS[0];
  for (const k of CUTS) if (t >= k[0]) c = k;
  return clamp(c[1] + (t - c[0]), 0, CLIP_END);
};

let el = null;

export default {
  id: 'reveal',
  dur: DUR,

  mount(section) {
    section.innerHTML = `
<div class="rv-cam">
  <div class="rv-win">
    <div class="rv-bar">
      <div class="rv-tabs">
        <span class="rv-dots"><i></i><i></i><i></i></span>
        <span class="rv-tab"><img src="${bh(FAV)}" alt=""/><b>BlockHaven</b><i class="rv-x">×</i></span>
        <span class="rv-plus">+</span>
      </div>
      <div class="rv-url">
        <span class="rv-nav"><i>‹</i><i>›</i><i>↻</i></span>
        <span class="rv-addr"><em>localhost</em>:5173</span>
      </div>
    </div>
    <div class="rv-page"><video class="rv-vid" muted playsinline preload="auto" poster="${bh(POSTER)}" src="${bh(CLIP)}"></video></div>
  </div>
</div>
<div class="rv-credit">BlockHaven by @kepochnik</div>`;
    const q = (s) => section.querySelector(s);
    el = { cam: q('.rv-cam'), win: q('.rv-win'), page: q('.rv-page'), vid: q('.rv-vid'), credit: q('.rv-credit'), geo: null };
    el.vid.muted = true;
    el.vid.defaultMuted = true;
    new MutationObserver(() => { if (!section.classList.contains('on') && !el.vid.paused) el.vid.pause(); })
      .observe(section, { attributes: true, attributeFilter: ['class'] });
  },

  render(lt, ctx) {
    if (!el) return;
    const t = clamp(lt, 0, DUR);
    const W = (ctx && ctx.W) || 1920;

    // the window is laid out at a fixed design size (page height 900, the footage's aspect), then the camera scales it
    if (!el.geo || el.geo.W !== W) {
      const ph = 900, pw = Math.round(ph * VID_AR);
      el.win.style.width = pw + 'px';
      el.page.style.height = ph + 'px';
      el.geo = { W, pw, ph, wh: ph + BAR };
    }
    const { pw, ph, wh } = el.geo;
    // open: the whole window at FIT0 of the frame (and inside the width); end: the page alone fills the frame height
    // (or its width on a narrow stage), the tab strip pushed off the top
    const s0 = FIT0 * Math.min(H / wh, W / pw);
    const s1 = Math.max(H / ph, Math.min(W / pw, 1.6 * H / ph));
    const f = inOutCubic(seg(t, PUSH[0], PUSH[1]));
    const s = s0 * Math.pow(s1 / s0, f) * lerp(1, CREEP, seg(t, PUSH[1], DUR));
    const fy = lerp(wh / 2, BAR + ph / 2, f);   // the focus slides from the window's centre to the page's centre
    el.cam.style.transform = `translate(${(W / 2).toFixed(2)}px,${H / 2}px) scale(${s.toFixed(5)}) translate(${(-pw / 2).toFixed(2)}px,${(-fy).toFixed(2)}px)`;
    el.win.style.borderRadius = `${lerp(14, 0, f).toFixed(2)}px`;

    // the credit: small, bottom left, in from the start
    const c = outCubic(seg(t, 0.25, 0.7));
    el.credit.style.opacity = c.toFixed(3);
    el.credit.style.transform = c >= 1 ? 'none' : `translateY(${((1 - c) * 10).toFixed(2)}px)`;

    const w = want(t);
    const vid = el.vid;
    const live = lt >= 0 && lt < DUR && !document.body.classList.contains('freeze');
    if (live) {
      if (vid.paused) {
        const p = vid.play();
        if (p && p.catch) p.catch((e) => { if (e && e.name !== 'AbortError') console.error('reveal.js: video.play() rejected', e); });
      }
      if (Math.abs(vid.currentTime - w) > DRIFT_TOL) vid.currentTime = w;
    } else {
      if (!vid.paused) vid.pause();
      if (Math.abs(vid.currentTime - w) > SEED_TOL) vid.currentTime = w;
    }
  },
};
