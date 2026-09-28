// Blender beat: superbot connects Blender and it models the ride's props. Its line streams, a card rises with the real
// Blender window in it (Blender 5.2.2 LTS, Layout workspace, Material Preview) orbiting the four models it made, and the
// four exported files land under it as pills, each with a green check. No counts are shown: only what was made.
// The models are real: TRELLIS.2 meshes from the game's own frames, imported, named and exported in Blender; the
// window is Blender's own screenshot operator over a view orbit (img/bike/blender/models/CREDITS.txt has the chain).
// The capture is a JPEG frame sequence drawn on a <canvas>, never a <video>: every frame is chosen from t and drawn
// synchronously (neighbouring frames cross-faded), so any seek lands on exactly the same pixels and nothing plays on
// its own. Pure function of t, so window.__AD.seek / ?t= freezes any frame.
import { clamp, lerp, seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Modeled the bike, the farmhouse, the vending machine and a tree in Blender. Exported as .glb.';
const FILES = ['bike.glb', 'farmhouse.glb', 'vending.glb', 'tree.glb'];
const FRAMES = 30;                        // img/bike/blender/frames/00..29.jpg, 1280x738, one view orbit
const FW = 1280, FH = 738;
const VERSION = '5.2.2 LTS';              // the Blender build the capture came from (its window shows the same)
const CPS = 80;
const CARD_AT = 0.18;                     // the card rises in while the line streams
const RISE = 0.3;                         // the card and each chip rising in
const ORBIT_AT = 0.3;                     // the view starts orbiting once the card is up
const ORBIT = 1.9; /* deliberate */       // the whole captured orbit, played once
const FILE_AT = 1.1;                      // the first exported file lands, after the line has named them
const STAGGER = 0.2;                      // one file to the next
const EXPORT = 0.3;                       // a file sitting dim before its check
const CHECK = 0.2;                        // the check landing
const TAIL = 0.25;                        // the last move to the beat's end

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD_AT;
    T.v0 = r + ORBIT_AT;
    T.v1 = T.v0 + ORBIT;
    T.file = FILES.map((_, i) => r + FILE_AT + i * STAGGER);
    T.ok = T.file.map((a) => a + EXPORT);
    T.done = T.ok[FILES.length - 1] + CHECK;
    T.end = Math.max(T.done, T.v1, r + 0.06 + SAY.length / CPS) + TAIL;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="bl-card">
      <div class="bl-head"><img class="bl-logo" src="${x.brand('blender-logo.svg')}" alt=""/><b>Blender</b><small>${x.esc(VERSION)}</small></div>
      <div class="bl-view"><canvas width="${FW}" height="${FH}" aria-label="Blender with the bike, farmhouse, vending machine and tree models"></canvas></div>
    </div>`);
    const files = x.el(`<div class="bl-files">${FILES.map((f) => `<span class="bl-file"><b>${x.esc(f)}</b>${x.OK}</span>`).join('')}</div>`);
    const chips = [...files.children].map((n) => ({ n, name: n.querySelector('b'), ok: n.querySelector('.qc-ok') }));

    // the capture: every frame preloaded; the canvas is redrawn only when the wanted (frame, blend) changes, and again
    // when a frame it needed finishes loading, so a seek before the frames arrive still lands right once they do
    const cv = card.querySelector('canvas'), g = cv.getContext('2d');
    let want = null, drawn = null;
    const ready = (im) => im.complete && im.naturalWidth > 0;
    const draw = () => {
      if (!want || want.key === drawn) return;
      const a = imgs[want.i], b = imgs[want.j];
      if (!ready(a) || (want.f > 0 && !ready(b))) return;
      g.globalAlpha = 1;
      g.drawImage(a, 0, 0, FW, FH);
      if (want.f > 0) { g.globalAlpha = want.f; g.drawImage(b, 0, 0, FW, FH); g.globalAlpha = 1; }
      drawn = want.key;
    };
    const imgs = Array.from({ length: FRAMES }, (_, i) => {
      const im = new Image();
      im.decoding = 'sync';
      im.onload = draw;
      im.src = x.img(`bike/blender/frames/${String(i).padStart(2, '0')}.jpg`);
      return im;
    });

    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1;

    return {
      nodes: [say, card, files],
      marks: [[T.r, say], [T.card, card], [T.file[0], files]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.06, CPS, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        rise(card, seg(t, T.card, T.card + RISE), 14);
        // the orbit: position along the captured frames from t, blended between the two nearest (3-decimal blend)
        const pos = clamp((t - T.v0) / ORBIT) * (FRAMES - 1);
        const i = Math.min(FRAMES - 1, Math.floor(pos + 1e-9));
        const f = i >= FRAMES - 1 ? 0 : Math.round((pos - i) * 1000) / 1000;
        const key = `${i}:${f}`;
        if (!want || want.key !== key) want = { i, j: Math.min(FRAMES - 1, i + 1), f, key };
        draw();

        files.style.opacity = seg(t, T.file[0], T.file[0] + 0.05).toFixed(3);
        chips.forEach((c, j) => {
          rise(c.n, seg(t, T.file[j], T.file[j] + RISE), 10);
          const e = outCubic(seg(t, T.ok[j], T.ok[j] + CHECK));
          c.name.style.opacity = lerp(0.5, 1, e).toFixed(3);
          c.ok.style.opacity = e.toFixed(3);
          c.ok.style.transform = e >= 1 ? 'none' : `scale(${lerp(0.4, 1, e).toFixed(4)})`;
        });
      },
    };
  },
};
