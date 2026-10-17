// Wonder - AI Art Generator (Codeway) on iOS as a 2022 screen recording shows it (YouTube JiQHPLSHl-I, mrhackio, published 2022-08-31,
// t=190-202.3 s; spec .tmp/clone-9e82faf1/reveal-refs/wonder-ai/spec.json, confidence 0.66; frames w_jiq_t190p2 (queue), w_jiq_t192p2
// (blurred wash), w_jiq_t194p0 (RGB noise), w_jiq_t198p0 (resolving), w_jiq_t202p3 (result)). Tapping Create swaps the composer for two
// full-screen states. First an off-white page with a soft glowing orb dead centre (an electric cyan rim shading through violet into a magenta
// core, its edges drifting from frame to frame) and the bold dark caption 'In Queue...'. Then the artwork itself fills the screen, thin black
// seams between its panels: first a blurred, near-flat mauve-grey colour wash, then coarse RGB pixel noise in black, white, teal and blue
// speckle, which resolves step by step into the picture, under the white bold caption 'Creating...' about a sixth up from the bottom. No
// percentage, bar or queue number appears anywhere, and no grey skeleton: the missing picture IS the background.
// Adapted to ten images: the same off-white orb page, then a full-bleed 5 x 2 block of portrait panels with 1 px black seams. Every panel
// shows the mauve wash, goes to live RGB noise (drawn per pixel into a small canvas from a seeded hash of (tile, frame), a function of t
// alone), and then decodes to its picture, one panel after another in reading order (the noise of the panels still to come keeps running).
// Omitted: the composer, the status bar, the floating 'Reward granted' toast, the result page ('Name artwork', Publish, Share) and the
// creator's footage. The footage's art is never reproduced: every panel is our own meme; no logo, wordmark or platform font is drawn.
import { seg } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, ownSrc, hash, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-wdr';
const ROOT_H = 300, COLS = 5, NW = 48, NH = 56;
const CSS = `
.${P} { position: relative; box-sizing: border-box; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 14px; background: #f9f9f9; color: #0c0c0e; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #dcdad6; }
.${P}-q { position: absolute; inset: 0; }
.${P}-orb { position: absolute; left: 50%; top: 52px; width: 156px; height: 156px; margin-left: -78px; }
.${P}-orb i { position: absolute; display: block; inset: 14px; }
.${P}-orb .${P}-oc { background: linear-gradient(172deg, #18c7e3 0%, #3f8aeb 22%, #694cec 42%, #822eef 62%, #9721e0 82%, #991fd7 100%); }
.${P}-orb .${P}-oa { background: radial-gradient(circle at 92% 48%, #2e85f6 0%, rgba(46, 133, 246, .85) 26%, rgba(46, 133, 246, 0) 62%), radial-gradient(circle at 60% 6%, #43c1ed 0%, rgba(67, 193, 237, 0) 50%); }
.${P}-orb .${P}-ob { background: radial-gradient(circle at 36% 94%, #b345dc 0%, rgba(179, 69, 220, .8) 28%, rgba(179, 69, 220, 0) 62%), radial-gradient(circle at 6% 60%, #758ae7 0%, rgba(117, 138, 231, 0) 44%); }
.${P}-orb .${P}-od { background: radial-gradient(circle at 50% 50%, rgba(240, 195, 240, 0) 56%, rgba(240, 195, 240, .66) 74%, rgba(206, 247, 249, .5) 86%, rgba(206, 247, 249, 0) 100%); box-shadow: 0 0 22px 6px rgba(150, 120, 240, .16); }
.${P}-cap { position: absolute; left: 0; right: 0; top: 226px; text-align: center; font-size: 20px; font-weight: 800; letter-spacing: .1px; color: #0b0b0d; }
.${P}-gen { position: absolute; inset: 0; background: #08080a; }
.${P}-g { position: absolute; inset: 0; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); grid-template-rows: 1fr 1fr; gap: 1px; }
.${P}-t { position: relative; overflow: hidden; background: #6d6068; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-w { position: absolute; inset: 0; background: linear-gradient(180deg, #7d6e76 0%, #705f68 52%, #7b6c73 100%); }
.${P}-w::after { content: ""; position: absolute; inset: 0; background: repeating-linear-gradient(90deg, rgba(255, 255, 255, .05) 0 1px, rgba(0, 0, 0, 0) 1px 3px), repeating-linear-gradient(0deg, rgba(0, 0, 0, .05) 0 1px, rgba(0, 0, 0, 0) 1px 3px); }
.${P}-n { position: absolute; inset: 0; display: block; width: 100%; height: 100%; }
.${P}-cr { position: absolute; left: 0; right: 0; top: 232px; text-align: center; font-size: 17px; font-weight: 800; color: #ffffff; text-shadow: 0 1px 6px rgba(0, 0, 0, .55); }
`;

const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const QUEUE0 = 0.04;                              // the orb page is up from here
const CREATE_AT = 0.34;                           // 'In Queue...' gives way to the artwork screen
const NOISE0 = 0.38, NOISE1 = 0.52;                // the wash turns to RGB noise over this stretch
const DECODE = 0.22;                              // a panel's noise resolves into its picture over this long, ending on its landing
const LAND = Array.from({ length: 10 }, (_, i) => 0.66 + i * 0.1311);   // panel i is finished (reading order), the last at 1.84
const NOISE_FPS = 12;                             // the noise re-seeds this often (a seeded step, a function of t)
// the noise palette, measured from the footage's noise frame (w_jiq_t194p0): near-black x4, white-ish x3, saturated teal, sky blue
// and blue (the bulk), and a little yellow, brown-red and green speckle
const PAL = [[6, 6, 8], [6, 6, 8], [6, 6, 8], [27, 31, 35], [232, 244, 246], [214, 238, 246], [85, 181, 214], [40, 196, 224], [40, 196, 224], [44, 160, 236], [44, 160, 236], [60, 120, 226], [66, 103, 154], [226, 210, 74], [196, 180, 84], [176, 96, 84], [76, 170, 108]];

// orb blob outlines: border-radius percentages that wander with t (a function of t alone)
const ob = (t, k) => {
  const w = (n) => (50 + 12 * Math.sin(t * (1.7 + 0.31 * n) + k * 1.9 + n * 2.3)).toFixed(0);
  return `${w(0)}% ${w(1)}% ${w(2)}% ${w(3)}% / ${w(4)}% ${w(5)}% ${w(6)}% ${w(7)}%`;
};

export default {
  id: 'wonder-ai',
  label: 'Wonder (2022)',
  source: {
    platform: "Wonder - AI Art Generator by Codeway for iOS, the 'In Queue...' orb screen and the 'Creating...' artwork screen (an iPhone screen recording on YouTube, 2022-08-31)",
    feature: "after Create, a full-screen off-white page with a glowing cyan/violet/magenta orb captioned 'In Queue...', then the artwork fills the screen under the white bold caption 'Creating...' and decodes blurred mauve wash -> RGB pixel noise -> picture (no percentage, bar or queue number) (adapted to 10: the same orb page, then a full-bleed 5 x 2 block of portrait panels with 1 px seams, each decoding wash -> RGB noise -> picture in reading order, the noise drawn per pixel from a seeded hash of the tile and the frame)",
    refs: [{ url: 'https://www.youtube.com/watch?v=JiQHPLSHl-I', retrieved: '2026-10-14' }],
    extrapolated: ['the ten-panel 5 x 2 block (the footage shows one full-screen artwork, with a 2 x 2 split of it in the noise frames)', 'the panels decoding one after another (the footage decodes the whole screen at once)', 'the speed of the orb and noise drift, and the panel landing times (the footage holds the queue for about 1 s and the creating screen for about 10 s)'],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'wonder-ai');
    const K = (ctx.lastLand - ctx.cardIn) / REF;      // the beat's window against the layout above
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-w"></div><canvas class="${P}-n" width="${NW}" height="${NH}" style="opacity: 0"></canvas></div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-q"><div class="${P}-orb"><i class="${P}-od"></i><i class="${P}-oc"></i><i class="${P}-oa"></i><i class="${P}-ob"></i></div><div class="${P}-cap">In Queue...</div></div><div class="${P}-gen" style="visibility: hidden"><div class="${P}-g">${tiles.map(cell).join('')}</div><div class="${P}-cr">Creating...</div></div></div>`);
    const q = (s) => root.querySelector(`.${P}-${s}`);
    const queue = q('q'), gen = q('gen'), cr = q('cr');
    const blobs = [...root.querySelectorAll(`.${P}-orb i`)];
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), wash: n.querySelector(`.${P}-w`), cv: n.querySelector(`.${P}-n`), g: tiles[i] }));
    cells.forEach((c) => { c.cx = c.cv.getContext('2d'); c.data = c.cx.createImageData(NW, NH); });
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    // RGB speckle for tile i at noise frame f: every pixel a seeded draw from the palette, scaled by its own brightness draw
    const paint = (c, i, f) => {
      const d = c.data.data, seed = i * 977 + f * 13;
      for (let p = 0; p < NW * NH; p++) {
        const col = PAL[Math.floor(hash(seed, p * 3) * PAL.length)], lum = 0.78 + 0.42 * hash(seed, p * 3 + 1);
        const o = p * 4;
        d[o] = Math.min(255, col[0] * lum); d[o + 1] = Math.min(255, col[1] * lum); d[o + 2] = Math.min(255, col[2] * lum); d[o + 3] = 255;
      }
      c.cx.putImageData(c.data, 0, 0);
    };

    return {
      root,
      render(t) {
        const s = (t - ctx.cardIn) / K;                // layout seconds since the card entered

        // 'In Queue...' then the artwork screen
        const made = s >= CREATE_AT;
        put('mode', made, (v) => { queue.style.visibility = v ? 'hidden' : ''; gen.style.visibility = v ? '' : 'hidden'; });
        put('qon', s >= QUEUE0, (v) => { queue.style.opacity = v ? '' : '0'; });

        // the orb breathes and its outline drifts (a function of t alone)
        if (!made) {
          const fr = Math.floor(t * 30);
          put('orb', fr, () => {
            const tt = fr / 30;
            blobs.forEach((b, j) => {
              b.style.borderRadius = ob(tt, j);
              b.style.transform = `rotate(${(24 * Math.sin(tt * (0.9 + 0.2 * j) + j * 1.7)).toFixed(1)}deg) scale(${(1 + 0.07 * Math.sin(tt * 2.6 + j * 1.3)).toFixed(3)})`;
              b.style.opacity = (0.78 + 0.2 * Math.sin(tt * 1.9 + j * 2.1)).toFixed(3);
            });
          });
        } else {
          // the orb is gone with the queue page: its outline and tint rest at the stylesheet's own, whatever came before
          put('orb', 'gone', () => blobs.forEach((b) => { b.style.borderRadius = ''; b.style.transform = ''; b.style.opacity = ''; }));
        }

        const nOp = seg(s, NOISE0, NOISE1);                // the wash gives way to noise
        const f = Math.floor(t * NOISE_FPS);
        cells.forEach((c, i) => {
          const land = LAND[i];
          const dec = seg(s, land - DECODE, land);         // the noise resolves into the picture
          if (s >= land) {
            put(`c${i}`, 'done', () => {
              c.im.style.visibility = ''; c.im.style.filter = 'none'; c.im.style.transform = restTransform(c.g);
              c.wash.style.display = 'none'; c.wash.style.opacity = ''; c.cv.style.display = 'none'; c.cv.style.opacity = '0';
            });
          } else {
            const live = dec > 0;                          // the picture shows under the thinning noise only while it decodes
            const op = (nOp * (1 - 0.92 * seg(dec, 0.15, 1))).toFixed(3);
            put(`c${i}`, `${live}|${op}|${dec.toFixed(3)}`, () => {
              c.wash.style.display = ''; c.cv.style.display = '';
              c.cv.style.opacity = op;
              c.im.style.visibility = live ? '' : 'hidden';
              c.im.style.filter = live ? `blur(${(9 * (1 - dec)).toFixed(2)}px)` : 'none';
              c.im.style.transform = live ? `scale(${(c.g.zoom * (1 + 0.12 * (1 - dec))).toFixed(4)})` : restTransform(c.g);
              c.wash.style.opacity = live ? '0' : '';
            });
            // the noise re-seeds each frame while it can be seen
            if (made && nOp > 0) put(`n${i}`, f, () => paint(c, i, f));
          }
        });

        put('cr', s >= LAND[tiles.length - 1], (v) => { cr.style.visibility = v ? 'hidden' : ''; });
      },
    };
  },
};
