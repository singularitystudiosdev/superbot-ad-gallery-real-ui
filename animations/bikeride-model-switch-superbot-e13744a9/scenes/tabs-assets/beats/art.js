// Art beat: Gemini paints the ride's decals. Its line streams, a sheet of six decal tiles rises, and each decal
// resolves out of a blur in turn under the sweeping "generating" band, then snaps crisp and stamps its file name.
// The grammar is make-minecraft-every-model's decal-gen.js (unblur, band, gen label), its helpers copied in below.
// The decals are real Gemini image-model output (gemini-3-pro-image), cut to alpha: img/bike/decals/*.png, prompts
// and method in img/bike/decals/CREDITS.txt. They sit on a dark checkerboard tile so the transparency reads.
// The sheet spans the reply column: three columns (3x2) while that fits the feed; on a wide, short feed (16:9, 1:1)
// a 3x2 of column-wide tiles would run taller than the feed, so it lays out as one row of six.
// Pure function of t: every moving value is written from t, so ?t= and __AD.seek freeze any frame.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Painted the decals: maple leaves, sakura petals, rice grass, sunflowers, hydrangeas and moss.';
// the six decals, in the order Gemini paints them (file names under img/bike/decals/)
const DECALS = ['maple-leaf', 'sakura-petals', 'rice-grass', 'sunflower', 'hydrangea', 'moss-stone'];
const CPS = 80;                       // the reply line streams at this many characters a second
const CARD = 0.18;                    // reply start to the sheet rising in
const LEAD = 0.2;                     // the sheet landing to the first decal starting to resolve
const PAINT = 0.42; /* deliberate */  // one decal resolving out of the blur
const STAGGER = 0.12;                 // one decal starting to the next
const TAIL = 0.45;                    // the last decal landing to the beat's end

// a decal resolving out of a blur (decal-gen's unblur, pure function of t)
function unblur(im, t, w0, w1) {
  const e = outCubic(seg(t, w0, w1));
  im.style.filter = e >= 1 ? 'none' : `blur(${((1 - e) * 10).toFixed(2)}px) saturate(${lerp(0.3, 1, e).toFixed(3)})`;
  im.style.opacity = lerp(0.2, 1, e).toFixed(3);
  im.style.transform = e >= 1 ? 'none' : `scale(${lerp(1.12, 1, e).toFixed(4)})`;
}

// the sweeping "generating" band across the sheet and its label (decal-gen's band)
function band(gen, genl, t, w0, w1) {
  const p = seg(t, w0, w1);
  gen.style.transform = `translateX(${lerp(-110, 110, (Math.max(0, t - w0) * 1.4) % 1).toFixed(1)}%)`;
  gen.style.opacity = (p >= 1 ? 0 : 1 - seg(p, 0.85, 1)).toFixed(3);
  genl.style.opacity = (1 - seg(t, w1 - 0.25, w1)).toFixed(3);
}

// the sheet rising in (decal-gen's rise)
function rise(n, p, dy = 14, s0 = 0.96) {
  const e = outCubic(p);
  n.style.opacity = e.toFixed(3);
  n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - e) * dy).toFixed(2)}px) scale(${lerp(s0, 1, e).toFixed(4)})`;
}

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;                                                       // the sheet rises in
    T.w0 = T.card + LEAD;                                                    // the band starts, decal 1 resolving
    T.tile = DECALS.map((_, i) => [T.w0 + i * STAGGER, T.w0 + i * STAGGER + PAINT]); // each decal: blur -> crisp
    T.w1 = T.tile[DECALS.length - 1][1];                                     // the last decal is crisp, band gone
    T.end = Math.max(T.w1, r + 0.06 + SAY.length / CPS) + TAIL;              // r + 1.85 with these constants
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="art-deck">
      <div class="art-grid">${DECALS.map((n) => `<figure class="art-dc">
        <span class="art-px"><img src="${x.img(`bike/decals/${n}.png`)}" width="512" height="512" alt="${x.esc(n)}"/></span>
        <figcaption>${x.esc(n)}<wbr>.png</figcaption>
      </figure>`).join('')}</div>
      <i class="art-gen" aria-hidden="true"></i><span class="art-genl">${x.tile('gemini')}Creating decals</span>
    </div>`);
    const tiles = [...card.querySelectorAll('.art-px img')], caps = [...card.querySelectorAll('figcaption')];
    const g = card.querySelector('.art-gen'), gl = card.querySelector('.art-genl');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1;
    // pick the column count once the sheet is laid out (offset* ignore the rise transform); the chat measures the
    // thread after every beat renders, so the switch is picked up the same frame
    let fitted = false;
    const fit = () => {
      const feed = card.closest('.feed');
      if (fitted || !feed || !card.offsetWidth) return;
      fitted = true;
      if (card.offsetHeight > 0.8 * feed.clientHeight) card.classList.add('art-row');
    };

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        fit();
        const n = streamCount(SAY, T.r + 0.06, CPS, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        rise(card, seg(t, T.card, T.card + 0.45));
        tiles.forEach((im, i) => { unblur(im, t, T.tile[i][0], T.tile[i][1]); });
        caps.forEach((c, i) => { c.style.opacity = seg(t, T.tile[i][1] - 0.15, T.tile[i][1] + 0.15).toFixed(3); });
        band(g, gl, t, T.w0, T.w1);
      },
    };
  },
};
