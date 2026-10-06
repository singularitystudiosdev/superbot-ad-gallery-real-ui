// Blender beat: superbot connects Blender and it models the ride's props. Its line streams, a card rises (Blender logo,
// name, build) and under its header each model lands in its own square frame, staggered: bike, farmhouse, vending
// machine, tree, each a real Blender 5.2.2 LTS viewport capture of that model alone (Material Preview, grid floor)
// turning slowly, its exported file name and a green check beneath; a fifth square reads '+130 more'.
// The models are real: TRELLIS.2 meshes from the game's own frames, imported, named and exported in Blender
// (img/bike/blender/models/CREDITS.txt has the chain); each square is Blender's own screenshot operator over a ~36 deg
// view orbit around that model with the other three hidden, cropped square (img/bike/blender/<model>/00..17.jpg).
// Every square is a JPEG frame sequence drawn on a <canvas>, never a <video>: the frame is chosen from t and drawn
// synchronously (neighbouring frames cross-faded, blend rounded to 3 decimals), so any seek lands on exactly the same
// pixels and nothing plays on its own. Pure function of t, so window.__AD.seek / ?t= freezes any frame.
// Timing (v3): the build runs at 0.8x its v2 pace; times(r).end is the moment the last visible element settles (the
// last model's eased turn comes to rest), with no trailing hold. The turn eases out (outCubic), and its last SNAP
// seconds (under 0.3% of one frame step) are drawn as the final frame, so the card's pixels are final by end - SNAP.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Modeled the bike, the farmhouse, the vending machine, a tree and 130 more props in Blender.';
const MODELS = ['bike', 'farmhouse', 'vending', 'tree'];   // img/bike/blender/<name>/NN.jpg, and <name>.glb under each
const MORE = 130;                                          // the rest of the props, shown as a count tile only
const FRAMES = 18;                        // per model: 00..17.jpg, 380x380, one view orbit
const FS = 380;
const VERSION = '5.2.2 LTS';              // the Blender build the captures came from
const CPS = 100;                          // v2 streamed at 80 cps; x0.8 duration
const CARD_AT = 0.14;                     // the card rises in while the line streams (v2 0.18)
const RISE = 0.24;                        // the card and each square rising in (v2 0.3)
const TILE_AT = 0.3;                      // the first square lands once the card is up
const STAGGER = 0.14;                     // one square to the next
const EXPORT = 0.4;                       // a square's file name sitting dim before its check
const CHECK = 0.16;                       // the check landing (v2 0.2)
const ORBIT = 1.26;                       // each square's captured orbit, played once from the moment it lands, easing out
const SNAP = 0.06;                        // the eased turn's last 0.06 s moves < 0.3% of one frame step: drawn as the final frame

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD_AT;
    T.tile = [...MODELS, 'more'].map((_, i) => r + TILE_AT + i * STAGGER);
    T.ok = MODELS.map((_, i) => T.tile[i] + EXPORT);
    T.v1 = MODELS.map((_, i) => T.tile[i] + ORBIT);
    T.said = r + 0.06 + SAY.length / CPS;
    // the last visible change: the last turn, the last check, the '+130 more' square settling, or the line's last char
    T.end = Math.max(...T.v1, T.ok[MODELS.length - 1] + CHECK, T.tile[MODELS.length] + RISE, T.said);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="bl-card">
      <div class="bl-head"><img class="bl-logo" src="${x.brand('blender-logo.svg')}" alt=""/><b>Blender</b><small>${x.esc(VERSION)}</small></div>
      <div class="bl-grid">${MODELS.map((m) => `<figure class="bl-sq"><div class="bl-view"><canvas width="${FS}" height="${FS}" aria-label="${x.esc(m)} in Blender"></canvas></div>
        <figcaption><b>${x.esc(m)}.glb</b>${x.OK}</figcaption></figure>`).join('')}
        <figure class="bl-sq bl-more"><div class="bl-view"><span><b>+${MORE}</b><small>more</small></span></div><figcaption></figcaption></figure>
      </div>
    </div>`);
    const sqs = [...card.querySelectorAll('.bl-sq')];

    // one turntable per model square: every frame preloaded; its canvas is redrawn only when the wanted (frame, blend)
    // changes, and again when a frame it needed finishes loading, so a seek before the frames arrive still lands right
    const tables = MODELS.map((m, j) => {
      const n = sqs[j];
      const g = n.querySelector('canvas').getContext('2d');
      const tb = { n, name: n.querySelector('b'), ok: n.querySelector('.qc-ok'), want: null, drawn: null, imgs: null };
      const ready = (im) => im.complete && im.naturalWidth > 0;
      tb.draw = () => {
        const w = tb.want;
        if (!w || w.key === tb.drawn) return;
        const a = tb.imgs[w.i], b = tb.imgs[w.j];
        if (!ready(a) || (w.f > 0 && !ready(b))) return;
        g.globalAlpha = 1;
        g.drawImage(a, 0, 0, FS, FS);
        if (w.f > 0) { g.globalAlpha = w.f; g.drawImage(b, 0, 0, FS, FS); g.globalAlpha = 1; }
        tb.drawn = w.key;
      };
      tb.imgs = Array.from({ length: FRAMES }, (_, i) => {
        const im = new Image();
        im.decoding = 'sync';
        im.onload = tb.draw;
        im.src = x.img(`bike/blender/${m}/${String(i).padStart(2, '0')}.jpg`);
        return im;
      });
      return tb;
    });
    const more = sqs[MODELS.length];

    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1;

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.06, CPS, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        rise(card, seg(t, T.card, T.card + RISE), 12);
        tables.forEach((tb, j) => {
          rise(tb.n, seg(t, T.tile[j], T.tile[j] + RISE), 10);
          // the turn: position along this model's captured frames from t, blended between the two nearest
          const u = seg(t, T.tile[j], T.v1[j] - SNAP) >= 1 ? 1 : (t - T.tile[j]) / ORBIT;
          const pos = outCubic(Math.max(0, u)) * (FRAMES - 1);
          const i = Math.min(FRAMES - 1, Math.floor(pos + 1e-9));
          const f = i >= FRAMES - 1 ? 0 : Math.round((pos - i) * 1000) / 1000;
          const key = `${i}:${f}`;
          if (!tb.want || tb.want.key !== key) tb.want = { i, j: Math.min(FRAMES - 1, i + 1), f, key };
          tb.draw();
          const e = outCubic(seg(t, T.ok[j], T.ok[j] + CHECK));
          tb.name.style.opacity = lerp(0.5, 1, e).toFixed(3);
          tb.ok.style.opacity = e.toFixed(3);
          tb.ok.style.transform = e >= 1 ? 'none' : `scale(${lerp(0.4, 1, e).toFixed(4)})`;
        });
        rise(more, seg(t, T.tile[MODELS.length], T.tile[MODELS.length] + RISE), 10);
      },
    };
  },
};
