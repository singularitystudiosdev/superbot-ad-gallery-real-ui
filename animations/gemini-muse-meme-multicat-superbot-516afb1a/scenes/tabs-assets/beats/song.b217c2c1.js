// Dog-song beat (the 'song' variant): asked "Make me a song about my dog", superbot connects to Fish Audio and it
// answers with a track. The player card arrives finished (the Fish Audio logo as cover art, title, waveform, controls,
// a download button top right), then the track starts: the play button presses into pause and the playhead turns the
// waveform white from the left. The waveform is one continuous filled shape, a mirrored amplitude envelope drawn at
// about a sample per device pixel the way an audio player draws a whole track, not bars; the played part is the same
// shape in white, clipped exactly at the playhead. Its window runs the route's `extra` past the base route's end
// (chat.9b47fc30.js routeBy), so this variant's loop is longer. Visual only, no audio: the scene is a pure function of
// t. Its stylesheet (../song.b217c2c1.css) loads with the module. Cover: the official Fish Audio logo
// (brand/CREDITS.txt); the title and genre are made up.
import { lerp, seg, outCubic, streamCount } from '../../../lib.9b47fc30.js';
import { track } from '../../../loads.9e82faf1.js';
// the Share control every output card carries (share.29a362ea.js), left of the card's download button
import { SHARE_GLYPH, shareAttrs } from './share.29a362ea.js';

const SAY = "Here's an upbeat acoustic pop song about your dog.";
const CSS = new URL('../song.b217c2c1.css?v=11', import.meta.url).href;
const TITLE = 'Muddy Paws';
const META = 'Acoustic pop · Fish Audio';
const LEN = 30; // the track's length in seconds, for the playhead
const SAMPLES = 720; // the waveform's resolution: about one sample per device pixel at its size on the stage
// the track's loudness over x (0..1 of its length): [x, level] keys for a quiet intro, a verse, a build into the
// chorus, a short break, a second verse and chorus and a tail, eased between
const SHAPE = [[0, 0.04], [0.015, 0.3], [0.06, 0.42], [0.075, 0.58], [0.32, 0.62], [0.4, 0.84], [0.41, 0.92],
  [0.6, 0.94], [0.615, 0.5], [0.63, 0.1], [0.645, 0.56], [0.66, 0.64], [0.79, 0.66], [0.8, 0.92], [0.96, 0.95],
  [0.985, 0.55], [1, 0.12]];
const ease = (u) => u * u * (3 - 2 * u);
function loudness(x) {
  let k = 1;
  while (k < SHAPE.length - 1 && SHAPE[k][0] < x) k++;
  const [x0, y0] = SHAPE[k - 1], [x1, y1] = SHAPE[k];
  return lerp(y0, y1, ease(Math.min(1, Math.max(0, (x - x0) / (x1 - x0)))));
}
// a seeded PRNG (mulberry32), so the waveform's grain is the same on every load and in every ?t= freeze
function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let m = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    m = (m + Math.imul(m ^ (m >>> 7), 61 | m)) ^ m;
    return ((m ^ (m >>> 14)) >>> 0) / 4294967296;
  };
}
// one edge's peaks (0..1): the loudness times per-sample grain and the odd transient, lightly smoothed the way a peak
// envelope reads, never below a hairline so silence still shows the centre line
function peaks(seed) {
  const r = rng(seed);
  const raw = Array.from({ length: SAMPLES }, (_, i) => loudness(i / (SAMPLES - 1)) * (0.7 + 0.3 * r()) + (r() < 0.035 ? 0.12 * r() : 0));
  return raw.map((v, i) => Math.min(1, Math.max(0.03, 0.25 * (raw[i - 1] ?? v) + 0.5 * v + 0.25 * (raw[i + 1] ?? v))));
}
// the filled outline in a (SAMPLES - 1) x 100 box: the top edge left to right, then the bottom edge back
const WAVE_D = (() => {
  const top = peaks(7), bottom = peaks(19);
  const y = (v, dir) => (50 + dir * v * 48).toFixed(1);
  let d = 'M0 50';
  top.forEach((v, i) => { d += `L${i} ${y(v, -1)}`; });
  for (let i = SAMPLES - 1; i >= 0; i--) d += `L${i} ${y(bottom[i], 1)}`;
  return `${d}Z`;
})();
const wave = (cls) => `<svg class="${cls}" viewBox="0 0 ${SAMPLES - 1} 100" preserveAspectRatio="none" aria-hidden="true"><path d="${WAVE_D}"/></svg>`;
const PLAY = '<svg viewBox="0 0 24 24"><path d="M8 5.2v13.6L19 12z"/></svg>';
const PAUSE = '<svg viewBox="0 0 24 24"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg>';
const DOWNLOAD = '<svg viewBox="0 0 24 24"><path d="M12 4v11M7 10l5 5 5-5M5 19.5h14"/></svg>';
const clock = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

let sheet = null;
function loadSheet() {
  if (sheet) return;
  sheet = document.createElement('link');
  sheet.rel = 'stylesheet';
  sheet.href = CSS;
  track(new Promise((done) => {
    sheet.onload = done;
    sheet.onerror = () => { console.error(new Error(`song variant stylesheet failed to load: ${CSS}`)); done(); };
  }));
  document.head.appendChild(sheet);
}

export default {
  // `end` is the base route's end plus this route's `extra` (chat.9b47fc30.js routeBy)
  times(r, end = r + 2.35) {
    const T = { r };
    T.card = r + 0.22;
    T.play = T.card + 0.6; // once the card's entrance has settled
    T.end = end;
    return T;
  },
  build(k, x) {
    loadSheet();
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const block = x.el(`<div class="sg">
      <div class="sg-card">
        <div class="sg-art"><img class="sg-pic" src="${x.brand('fishaudio-logo.svg')}" width="435" height="161" alt="Fish Audio logo" fetchpriority="high"/></div>
        <div class="sg-side">
          <div class="sg-t"><b>${x.esc(TITLE)}</b><small>${x.esc(META)}</small></div>
          <div class="sg-row"><span class="sg-btn">${PLAY}${PAUSE}</span><div class="sg-wave">${wave('sg-w0')}${wave('sg-w1')}</div><span class="sg-time">${clock(0)} / ${clock(LEN)}</span></div>
        </div>
        <button type="button" class="sg-share" ${shareAttrs('Muddy Paws, a song about my dog')}>${SHARE_GLYPH}</button>
        <span class="sg-dl" role="img" aria-label="Download">${DOWNLOAD}</span>
      </div>
    </div>`);
    const $ = (s) => block.querySelector(s);
    const pic = $('.sg-pic'), btn = $('.sg-btn'), time = $('.sg-time'), played = $('.sg-w1');
    const [playIcon, pauseIcon] = btn.querySelectorAll('svg');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, sec = -1, cut = -1, playing = null, decoding = false;

    return {
      nodes: [say, block],
      marks: [[T.r, say], [T.card, block]],
      render(t) {
        // a frozen frame waits on the cover; decode() only works once the nodes have left the template's inert
        // document, which they have by the first render
        if (!decoding) {
          decoding = true;
          track(pic.decode().catch((e) => console.error(new Error(`song cover failed to decode: ${pic.src}`, { cause: e }))));
        }
        const n = streamCount(SAY, T.r + 0.06, 70, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        const ci = outCubic(seg(t, T.card, T.card + 0.45));
        block.style.opacity = ci.toFixed(3);
        block.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.96, 1, ci).toFixed(4)})`;

        // playback: the button presses into pause and the white copy of the waveform is uncovered up to the playhead
        const el = Math.max(0, t - T.play);
        const s = Math.floor(el);
        if (s !== sec) { time.textContent = `${clock(s)} / ${clock(LEN)}`; sec = s; }
        const c = +((1 - Math.min(1, el / LEN)) * 100).toFixed(3);
        if (c !== cut) { played.style.clipPath = `inset(0 ${c}% 0 0)`; cut = c; }
        const press = seg(t, T.play - 0.12, T.play) * (1 - seg(t, T.play, T.play + 0.1));
        btn.style.transform = press > 0 ? `scale(${(1 - 0.12 * press).toFixed(4)})` : 'none';
        const isPlaying = t >= T.play;
        if (isPlaying !== playing) { playIcon.style.display = isPlaying ? 'none' : ''; pauseIcon.style.display = isPlaying ? '' : 'none'; playing = isPlaying; }
      },
    };
  },
};
