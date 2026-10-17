// The 'catsurf10' variant's answer: 'catsurf' (catsurf.e2265c3a.js) made the way '10' makes the base route
// (gemini.9b47fc30.js). The ask asks for ten, fal.ai answers in the plural, and the one 16:9 player becomes the bakery
// artifact frame (bakery.005f5570.js) titled with its count and a Download All, over a 5-column grid of ten video tiles.
// Every slot shimmers as a skeleton until its turn, then the ten land one after another in reading order on the
// 10-memes cadence (T.w0 + GRID0 + i * GRID_STEP), and each starts playing as it lands. The tiles are the one rendered
// clip under a different start, crop, mirror, speed and grade (media/catsurf10.a35789f3/render.sh), as the ten memes are
// the one meme under ten crops and grades, baked to files so a tile's Download, and Download All, is the clip as seen.
import { lerp, seg, outCubic } from '../../../lib.9b47fc30.js';
import { track } from '../../../loads.9e82faf1.js';
import { variant } from '../../../variant.9e82faf1.js?v=3';
import { LAND, landing, shimmer, settle } from './thumb-land.309eb9c5.js';
import { loadSheet as loadFrameSheet } from './bakery.005f5570.js?v=3';
import { zipStore } from './zip.69098368.js';
// the Share control every output card carries: a header button, and a disc on each clip beside its download
import { shareBtn, shareDisc } from './share.29a362ea.js';

const ID = 'catsurf10';               // this answer's route key (chat.9b47fc30.js routeBy, variant.9e82faf1.js)
const SAY = 'Here are 10 videos of a cat surfing.';
const CSS = new URL('../catsurf10.a35789f3.css', import.meta.url).href;
const LOOKS = ['golden hour', 'vivid close-up', 'sepia film', 'black and white', 'teal and orange, slow motion', 'dusk',
  'faded pastel', 'vintage', 'dramatic, slow motion', 'blue hour'];
const CLIPS = LOOKS.map((look, i) => ({
  look,
  src: new URL(`../../../media/catsurf10.a35789f3/cat-surfing-${i + 1}.mp4`, import.meta.url).href,
  name: `cat-surfing-${i + 1}.mp4`,
}));
const LEN = 9;                        // every tile clip's length in seconds (render.sh OUT_LEN)
const GRID0 = 0.4, GRID_STEP = 0.12;  // '10's landing cadence (gemini.9b47fc30.js)
const W = 320, H = 180;
const clock = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

// Gemini's grid-tile Download (gemini.9b47fc30.js dl / showDl): a real link to the tile's clip that fades in as it lands
// and takes no clicks before it does
const dl = (href, name) => `<a class="qc-dl" href="${href}" download="${name}" aria-label="Download video" title="Download"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg></a>`;
function showDl(a, p) {
  a.style.opacity = p.toFixed(3);
  a.style.visibility = p > 0 ? '' : 'hidden';
}
// the tile's Share disc comes and goes with its download, so neither shows over the skeleton
const showShare = (tl, p) => { showDl(tl.dl, p); showDl(tl.share, p); };

let sheet = null;
function loadSheet() {
  if (sheet) return;
  sheet = document.createElement('link');
  sheet.rel = 'stylesheet';
  sheet.href = CSS;
  track(new Promise((done) => {
    sheet.onload = done;
    sheet.onerror = () => { console.error(new Error(`cat surfing x10 stylesheet failed to load: ${CSS}`)); done(); };
  }));
  document.head.appendChild(sheet);
}

// Download All, the frame's header button: the ten clips as their tiles show them, saved as a single zip
async function downloadAll() {
  const files = await Promise.all(CLIPS.map(async (c) => {
    const res = await fetch(c.src);
    if (!res.ok) throw new Error(`Download All: ${c.name} answered ${res.status} for ${c.src}`);
    return { name: c.name, bytes: new Uint8Array(await res.arrayBuffer()) };
  }));
  const href = URL.createObjectURL(zipStore(files));
  Object.assign(document.createElement('a'), { href, download: 'cat-surfing-videos.zip' }).click();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}

// A tile's video follows the spot's clock as the catsurf player does: while the clock runs it plays at the spot's speed
// and is only re-seeked when it drifts; paused, scrubbed or frozen (?t=) it holds the asked frame, and the spot's ready
// state waits on that seek, so a frozen capture shows it. The hub builds every variant's answer up front, so a tile only
// takes its src once this variant is the one showing: the other variants never fetch, decode or wait on the ten clips
function follower(video, src) {
  let want = 0;
  const seekTo = (vt) => {
    if (video.readyState < 1 || Math.abs(video.currentTime - vt) <= 0.5 / 30) return;
    track(new Promise((done) => video.addEventListener('seeked', done, { once: true })));
    video.currentTime = vt;
  };
  const load = () => {
    if (video.src) return;
    track(new Promise((done) => {
      video.addEventListener('loadeddata', () => { seekTo(want); done(); }, { once: true });
      video.addEventListener('error', () => { console.error(new Error(`cat surfing tile failed to load: ${src}`)); done(); }, { once: true });
    }));
    video.src = src;
  };
  if (variant() === ID) load();
  addEventListener('variantchange', (e) => { if (e.detail === ID) load(); });
  return (vt, playing) => {
    want = vt;
    if (!video.src) return;
    if (playing) {
      const rate = (window.__AD && window.__AD.speed) || 1;
      if (video.playbackRate !== rate) video.playbackRate = rate;
      if (Math.abs(video.currentTime - vt) > 0.25) video.currentTime = vt;
      if (video.paused) video.play().catch((e) => { if (e.name !== 'AbortError') console.error(`cat surfing tile failed to play: ${src}`, e); });
      return;
    }
    if (!video.paused) video.pause();
    seekTo(vt);
  };
}

export default {
  // `end` is the base route's end plus this variant's `extra` (chat.9b47fc30.js routeBy)
  times(r, end = r + 2.35) {
    const T = { r };
    T.card = r + 0.22;
    T.w0 = r + 0.3; T.w1 = T.w0 + 1.2;
    T.end = end;
    return T;
  },
  build(k, x) {
    loadSheet();
    loadFrameSheet();
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const set = x.el(`<div class="bk qc-set cs10"><div class="bk-head"><b class="bk-title">Cat surfing videos<small>${CLIPS.length} videos</small></b>${shareBtn('Cat surfing videos')}<button type="button" class="bk-btn bk-publish qc-dlall"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>Download All</button></div><div class="bk-view"><div class="qc-grid">${CLIPS.map((c, i) => `<div class="qc-gt qc-skel">
        <video width="${W}" height="${H}" muted playsinline preload="auto" aria-label="Cat surfing video ${i + 1}: ${c.look}"></video>
        <i class="qc-sk"></i><span class="cs10-len">${clock(LEN)}</span><i class="cs10-bar"><i></i></i>${shareDisc(`Cat surfing video ${i + 1}`, { file: c.src })}${dl(c.src, c.name)}</div>`).join('')}</div></div></div>`);
    const dlAll = set.querySelector('.qc-dlall');
    // Space and Enter press the button, not the spot's clock (timeline.9b47fc30.js), as on the 10-memes frame
    dlAll.addEventListener('keydown', (e) => { if (e.key === ' ' || e.key === 'Enter') e.stopPropagation(); });
    set.addEventListener('keydown', (e) => { if ((e.key === ' ' || e.key === 'Enter') && e.target.closest('.bk-share, .qc-share')) e.stopPropagation(); });
    const tiles = [...set.querySelectorAll('.qc-gt')].map((n, i) => {
      const video = n.querySelector('video');
      video.muted = true;
      const at = T.w0 + GRID0 + i * GRID_STEP;
      return {
        video, at, play: at + LAND, sync: follower(video, CLIPS[i].src),
        sk: n.querySelector('.qc-sk'), len: n.querySelector('.cs10-len'), bar: n.querySelector('.cs10-bar'),
        head: n.querySelector('.cs10-bar i'), dl: n.querySelector('.qc-dl'), share: n.querySelector('.qc-share'),
      };
    });
    // a mouse click lets go of the button's or link's focus so the keyboard stays on the spot's clock
    set.addEventListener('click', (e) => {
      if (e.target.closest('.qc-dlall')) {
        dlAll.disabled = true;
        downloadAll().catch((err) => console.error(err)).finally(() => { dlAll.disabled = false; });
        if (e.detail > 0) dlAll.blur();
        return;
      }
      const a = e.target.closest('.qc-dl, .qc-share, .bk-share');
      if (a && e.detail > 0) a.blur();
    });
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, lastT = NaN, moved = -Infinity;

    return {
      nodes: [say, set],
      marks: [[T.r, say], [T.card, set]],
      render(t) {
        const n = Math.min(SAY.length, Math.max(0, Math.floor((t - (T.r + 0.06)) * 70 + 1e-6)));
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        const ci = outCubic(seg(t, T.card, T.card + 0.45));
        set.style.opacity = ci.toFixed(3);
        set.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.96, 1, ci).toFixed(4)})`;

        // the clock runs when it moved forward within the last 150 ms (catsurf.e2265c3a.js sync)
        const now = performance.now();
        if (t !== lastT) { if (t > lastT && t - lastT < 0.5) moved = now; lastT = t; }
        const running = now - moved < 150;

        // generating, as '10' generates: every slot shimmers until its turn, then the ten land in reading order and each
        // plays from its own landing, its length badge giving way to a playhead along its bottom edge
        tiles.forEach((tl, i) => {
          const p = landing(t, tl.at);
          shimmer(tl.sk, t, T.card, i, p);
          settle(tl.video, p);
          showShare(tl, p);
          const vt = Math.max(0, t - tl.play) % LEN;
          tl.sync(vt, running && t > tl.play);
          const pl = outCubic(seg(t, tl.play, tl.play + 0.25));
          tl.len.style.opacity = (p * (1 - pl)).toFixed(3);
          tl.bar.style.opacity = pl.toFixed(3);
          tl.head.style.width = `${((vt / LEN) * 100).toFixed(3)}%`;
        });
      },
    };
  },
};
