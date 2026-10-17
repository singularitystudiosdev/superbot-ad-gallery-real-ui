// Rock-climbing beat (the 'climbing' variant): asked "Show me rock climbing videos", superbot connects YouTube and
// DeepSeek answers from it. Six
// equal 16:9 tiles in a 3x2 grid shimmer as skeletons, each lands on its own clock, then the first video starts: the controls rise, the buffer runs ahead
// of the playhead and the frame drifts (a slow push on the still). Squeezed into the window the Gemini beat leaves
// (times(r, end)); the route's extra YouTube chip delays r and stretches end by the same lead (chat.9b47fc30.js
// leadOf), so this beat's own timing is unchanged. Its stylesheet (../climb.080da517.css) loads with the module.
// Thumbnails: public-domain and CC0 photos from Wikimedia Commons (img/climb.080da517/CREDITS.txt); every title,
// channel, view count and duration is made up.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.9b47fc30.js';
import { track } from '../../../loads.9e82faf1.js';
import { LAND, landing, shimmer, settle } from './thumb-land.309eb9c5.js';

const SAY = 'Here are some rock climbing videos from YouTube.';
const CSS = new URL('../climb.080da517.css?v=4', import.meta.url).href;
// `at` is when the result lands, as a share of the search window; the first is the featured player
const VIDEOS = [
  { img: '1.jpg', title: 'Joshua Tree granite: a full day of crack climbing', meta: 'Crag Notes · 1.2M views · 8 months ago', len: '14:32', at: 0.4 },
  { img: '2.jpg', title: 'Stemming 101: climb wide cracks with less effort', meta: 'Vertical Daily · 486K views', len: '9:18', at: 0.52 },
  { img: '3.jpg', title: '2,000 ft above the fjord: big wall climbing in Lyse', meta: 'Send Lab · 2.1M views', len: '22:05', at: 0.64 },
  { img: '4.jpg', title: 'Lead and boulder finals, every top in 10 minutes', meta: 'Climb Wire · 3.8M views', len: '10:41', at: 0.76 },
  { img: '5.jpg', title: 'Top-rope anchors: build one, then throw the rope clean', meta: 'Rope Up · 742K views', len: '12:07', at: 0.88 },
  { img: '6.jpg', title: 'Hand jams 101: five Joshua Tree cracks for your first trad lead', meta: 'Desert Beta · 318K views', len: '16:54', at: 1 },
];
const LEN = 14 * 60 + 32; // the featured video's length in seconds, for the playhead
const PAUSE = '<svg viewBox="0 0 24 24"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg>';
const VOL = '<svg viewBox="0 0 24 24"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/></svg>';
const clock = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

let sheet = null;
function loadSheet() {
  if (sheet) return;
  sheet = document.createElement('link');
  sheet.rel = 'stylesheet';
  sheet.href = CSS;
  track(new Promise((done) => {
    sheet.onload = done;
    sheet.onerror = () => { console.error(new Error(`climbing variant stylesheet failed to load: ${CSS}`)); done(); };
  }));
  document.head.appendChild(sheet);
}

export default {
  // `end` is the base route's end (chat.9b47fc30.js routeBy), so the loop never changes length with the variant
  times(r, end = r + 2.35) {
    const T = { r };
    T.card = r + 0.22;
    T.w0 = r + 0.3; T.w1 = T.w0 + 1.0;
    T.play = T.w1 + 0.15;
    T.end = end;
    return T;
  },
  build(k, x) {
    loadSheet();
    const T = k.T;
    const yt = x.img('climb.080da517/youtube.svg');
    const text = (v) => `<div class="cv-t"><b><span>${x.esc(v.title)}</span></b><small><span>${x.esc(v.meta)}</span></small></div>`;
    const pic = (v, i) => `<img class="cv-pic" src="${x.img('climb.080da517/' + v.img)}" width="640" height="360" alt="${x.esc(v.title)}"${i ? '' : ' fetchpriority="high"'}/><i class="cv-sh"></i><span class="cv-len">${v.len}</span>`;
    const [lead, ...rest] = VIDEOS;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const block = x.el(`<div class="cv">
      <div class="cv-src"><img class="cv-yt" src="${yt}" width="20" height="14" alt=""/><b>YouTube</b><span>rock climbing videos</span></div>
      <div class="cv-grid">
        <div class="cv-item">
          <div class="cv-player cv-v">${pic(lead, 0)}
            <div class="cv-ctl"><div class="cv-bar"><i class="cv-buf"></i><i class="cv-played"></i><i class="cv-dot"></i></div>
              <div class="cv-row">${PAUSE}${VOL}<span class="cv-time"></span></div></div>
          </div>
          ${text(lead)}
        </div>
        ${rest.map((v, i) => `<div class="cv-item"><div class="cv-v">${pic(v, i + 1)}</div>${text(v)}</div>`).join('')}
      </div>
    </div>`);
    const $ = (s) => block.querySelector(s);
    // each result's thumbnail box sits above its title block, under one parent
    const items = [...block.querySelectorAll('.cv-v')].map((n, i) => ({
      im: n.querySelector('.cv-pic'), sh: n.querySelector('.cv-sh'), len: n.querySelector('.cv-len'),
      t: n.parentElement.querySelector('.cv-t'), v: VIDEOS[i],
    }));
    const ctl = $('.cv-ctl'), buf = $('.cv-buf'), played = $('.cv-played'), dot = $('.cv-dot'), time = $('.cv-time');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, sec = -1, decoding = false;

    return {
      nodes: [say, block],
      marks: [[T.r, say], [T.card, block]],
      render(t) {
        // a frozen frame waits on the thumbnails; decode() only works once the nodes have left the template's inert
        // document, which they have by the first render
        if (!decoding) {
          decoding = true;
          items.forEach((it) => track(it.im.decode().catch((e) => console.error(new Error(`climbing thumbnail failed to decode: ${it.im.src}`, { cause: e })))));
        }
        const n = streamCount(SAY, T.r + 0.06, 70, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        const ci = outCubic(seg(t, T.card, T.card + 0.45));
        block.style.opacity = ci.toFixed(3);
        block.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.96, 1, ci).toFixed(4)})`;

        // the search: every result shimmers as a skeleton until its own landing time, then its thumbnail settles in
        // (thumb-land.309eb9c5.js, shared with the Gemini beat's images)
        items.forEach((it, i) => {
          const at = T.w0 + (T.w1 - T.w0) * it.v.at;
          const p = landing(t, at);
          shimmer(it.sh, t, T.card, i, p);
          it.len.style.opacity = p.toFixed(3);
          it.t.classList.toggle('cv-wait', t < at);
          it.t.style.opacity = t < at ? '' : lerp(0.4, 1, p).toFixed(3);
          // the featured still's transform is set below, where it also plays
          if (i) settle(it.im, p); else it.im.style.opacity = p.toFixed(3);
        });

        // the featured video plays: the controls rise, the buffer runs ahead of the playhead and the still drifts
        // like a moving shot
        const feat = items[0];
        const at0 = T.w0 + (T.w1 - T.w0) * feat.v.at;
        const pl = seg(t, T.play, T.play + 0.25);
        ctl.style.opacity = outCubic(pl).toFixed(3);
        feat.len.style.opacity = (seg(t, at0, at0 + LAND) * (1 - pl)).toFixed(3);
        const el = Math.max(0, t - T.play);
        const head = Math.min(100, (el / LEN) * 100 + 0.6 * pl);
        played.style.width = `${head.toFixed(3)}%`;
        dot.style.left = `${head.toFixed(3)}%`;
        buf.style.width = `${(head + 21 * outCubic(seg(t, T.play, T.play + 1.4))).toFixed(2)}%`;
        const s = Math.floor(el);
        if (s !== sec) { time.textContent = `${clock(s)} / ${feat.v.len}`; sec = s; }
        const drift = inOutCubic(seg(t, T.play, T.play + 3.5));
        const land = landing(t, at0);
        feat.im.style.transform = t < T.play
          ? (land >= 1 ? 'none' : `scale(${lerp(1.08, 1, land).toFixed(4)})`)
          : `scale(${lerp(1, 1.08, drift).toFixed(4)}) translateX(${lerp(0, -1.6, drift).toFixed(3)}%)`;
      },
    };
  },
};
