// WOMBO Dream's Android app as a 2022 screen recording shows it (Bilibili BV1Rv4y1c7ak, published 2022-05-26, t=1-17 s; spec
// .tmp/clone-9e82faf1/reveal-refs/wombo-dream/spec.json, confidence 0.66; frames o_wombo_02_composer_ready, o_wombo_03_creating_start,
// o_wombo_05_creating_mid, o_wombo_07_creating_texture, o_wombo_08_creating_late, o_wombo_09_result). A light portrait 'Create artwork'
// screen: a round back button and the title, 'Enter prompt' with 'Clear Text', the prompt field, a row of lilac suggestion chips, 'Choose an
// art style' above a grid of labelled squares (the picked one ringed in purple) and a wide purple 'Create' button. Tapping it replaces the
// screen with the artwork itself, full-bleed, as it forms: first a flat warm brown-to-grey vertical gradient, then a coarse grey-brown
// noise / texture, then the finished picture, over a multicolour animated line glyph with the white caption 'Creating...' beneath it (the
// glyph's length and hue cycle; no percentage, bar or ring). That takes about 7.5 s in the recording.
// Adapted to ten images: ten portrait tiles in a 5 x 2 block, each walking flat gradient -> coarse noise -> finished picture in strict
// sequence (one tile's whole walk at a time, in reading order, the rest still flat gradients), the noise drawn as seeded CSS gradients and
// computed from t; under the block, an animated multicolour mark of our own (five bouncing dots) and the caption 'Creating...', both gone once
// the last picture is in. Omitted: the app's wave glyph (our own mark instead), the splash, the 'Input image' section, the 'Name artwork' sheet,
// the footage's watermark and the creator's name burned into it. The footage's art is never reproduced: every tile is our own meme, the style
// squares are plain tints of our own; no logo, wordmark or platform font is drawn (system type, plain line icons).
import { seg, press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, hash, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-wbd';
const ROOT_H = 420;
const CSS = `
.${P} { position: relative; box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 14px; background: #f6f6f8; color: #141418; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #dcdce2; }
.${P}-hd { position: relative; flex: none; display: flex; align-items: center; justify-content: center; height: 46px; font-size: 15px; font-weight: 600; }
.${P}-bk { position: absolute; left: 16px; top: 8px; display: grid; place-items: center; width: 30px; height: 30px; border-radius: 50%; background: #e6e6ea; }
.${P}-bk svg { display: block; width: 14px; height: 14px; fill: none; stroke: #141418; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.${P}-bd { flex: 1; min-height: 0; display: flex; flex-direction: column; padding: 0 40px 16px; }
.${P}-lb { flex: none; display: flex; align-items: baseline; justify-content: space-between; height: 22px; font-size: 13px; font-weight: 600; }
.${P}-lb small { font-size: 11.5px; font-weight: 500; color: #3c3c46; }
.${P}-fl { flex: none; box-sizing: border-box; height: 38px; margin-top: 2px; padding: 0 14px; border-radius: 10px; background: #e8e8ec; font-size: 14px; font-weight: 600; line-height: 38px; }
.${P}-ch { flex: none; display: flex; gap: 8px; margin-top: 10px; overflow: hidden; }
.${P}-ch span { flex: none; box-sizing: border-box; height: 30px; padding: 0 14px; border-radius: 15px; background: #cbbff3; box-shadow: inset 0 0 0 1px #b5a6ea; font-size: 12px; font-weight: 600; line-height: 30px; color: #5a3fc8; white-space: nowrap; }
.${P}-lb.st { margin-top: 14px; }
.${P}-st { flex: none; display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 10px; margin-top: 4px; }
.${P}-sq { display: flex; flex-direction: column; align-items: center; gap: 5px; font-size: 11.5px; color: #55555e; }
.${P}-sq i { position: relative; display: block; box-sizing: border-box; width: 100%; aspect-ratio: 1; border-radius: 6px; }
.${P}-sq.on { color: #141418; font-weight: 600; }
.${P}-sq.on i { box-shadow: 0 0 0 3px #f6f6f8, 0 0 0 5px #6a2cff; }
.${P}-sq i svg { position: absolute; inset: 22%; width: 56%; height: 56%; fill: none; stroke: #eceaee; stroke-width: 2.4; }
.${P}-new { flex: none; margin: auto auto 0; display: grid; place-items: center; width: 300px; height: 42px; border-radius: 21px; background: #6a2cff; font-size: 15px; font-weight: 600; color: #ffffff; }
.${P}-gen { position: absolute; inset: 0; background: #1d1a1a; }
.${P}-g { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 8px; margin: 40px 40px 0; }
.${P}-t { position: relative; aspect-ratio: 870 / 1024; border-radius: 6px; overflow: hidden; background: #3a2b2b; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-c { position: absolute; inset: 0; background: linear-gradient(180deg, #6b4442 0%, #442425 34%, #6e6464 60%, #959595 100%); }
.${P}-c b { position: absolute; inset: 0; display: block; }
.${P}-mk { position: absolute; left: 0; right: 0; top: 300px; display: flex; flex-direction: column; align-items: center; gap: 12px; font-size: 14px; color: #ffffff; }
.${P}-dots { display: flex; align-items: center; gap: 8px; height: 22px; }
.${P}-dots i { display: block; width: 9px; height: 9px; border-radius: 50%; }
`;

const PROMPT = 'a friendly ghost holding a handwritten note';
const STYLES = [['Love', 'linear-gradient(150deg, #e8588a, #8a2a5c)'], ['Death', 'linear-gradient(150deg, #8f8a9c, #3c3846)'], ['Robots', 'linear-gradient(150deg, #7f95b2, #3a4658)'], ['Ghibli', 'linear-gradient(150deg, #88c4e8, #6aa268)'], ['Surreal', 'linear-gradient(150deg, #f0a35c, #9a4fb0)']];
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const NEW_AT = 0.1;                               // the cursor taps Create
const ISSUE = 0.24;                               // the composer gives way to the ten flat gradients
const S0 = 0.42;                                  // the first tile starts its walk
const W = (1.8 - S0) / 10;                        // each tile's whole walk (gradient -> noise -> picture) is its own slot: ten non-overlapping windows, the last done at 1.8
const LAST = S0 + 10 * W;                         // the last tile's picture is in
const NOISE_FPS = 14;                             // the noise re-seeds this often (a seeded step, a function of t)
const HUES = [348, 42, 184, 214, 28, 330];       // the finished painting's pinks, ambers and blues, which the noise drifts toward
const BLOBS = 28;

// coarse noise as seeded CSS gradients: BLOBS soft patches at hashed positions, plus a blocky grain on top; `c` is how far the
// noise has moved from grey-brown toward the painting's colours (0..1)
function noise(i, f, c) {
  const seed = i * 977 + f;
  const parts = [];
  for (let j = 0; j < BLOBS; j++) {
    const px = (hash(seed, j * 3) * 100).toFixed(0), py = (hash(seed, j * 3 + 1) * 100).toFixed(0), r = (6 + hash(seed, j * 3 + 2) * 13).toFixed(0);
    const h = HUES[Math.floor(hash(i + 31, j) * HUES.length)], l = (34 + hash(i + 57, j) * 34).toFixed(0), sat = (10 + 52 * c).toFixed(0);
    const col = `hsla(${h}, ${sat}%, ${l}%`;
    parts.push(`radial-gradient(circle at ${px}% ${py}%, ${col}, 1) 0, ${col}, .85) ${(r * 0.5).toFixed(0)}%, ${col}, 0) ${r}%)`);
  }
  parts.push('repeating-conic-gradient(rgba(0, 0, 0, .2) 0 25%, rgba(255, 255, 255, .08) 0 50%) 0 0 / 5px 5px');
  return `${parts.join(', ')}, #6a6054`;
}

export default {
  id: 'wombo-dream',
  label: 'WOMBO Dream (2022)',
  source: {
    platform: "WOMBO Dream for Android, portrait 'Create artwork' screen (a Bilibili screen recording, 2022-05-26)",
    feature: "a light 'Create artwork' composer (prompt field, suggestion chips, 'Choose an art style' grid of labelled squares, a purple Create button); tapping it shows the artwork itself forming full-bleed, from a flat warm brown-to-grey gradient to coarse grey-brown noise to the finished picture, under an animated multicolour line glyph and the caption 'Creating...' (no percentage, bar or ring) (adapted to 10: ten portrait tiles, each walking gradient -> noise -> picture in strict sequence, the noise drawn as seeded CSS gradients computed from t; our own animated multicolour mark of bouncing dots replaces the app's wave glyph; the style squares are plain tints of our own)",
    refs: [{ url: 'https://www.bilibili.com/video/BV1Rv4y1c7ak', retrieved: '2026-10-14' }],
    extrapolated: ['the ten-tile block (the recording shows one full-screen artwork)', 'the per-tile gradient -> noise -> picture walk compressed into one slot each', 'the style squares and the prompt wording (the recording shows the app\'s own art and the prompt "114")'],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'wombo-dream');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="transform-origin: ${g.origin}"/><div class="${P}-c"><b style="opacity: 0"></b></div></div>`;
    const back = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3 5 8l5 5"/></svg>';
    const none = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M5.6 18.4 18.4 5.6"/></svg>';
    const sq = (n, bg, on) => `<div class="${P}-sq${on ? ' on' : ''}"><i style="background: ${bg}"></i>${n}</div>`;
    const styles = STYLES.map((s, i) => sq(s[0], s[1], i === 0)).join('') + `<div class="${P}-sq"><i style="background: #8f8b92">${none}</i>No Style</div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-hd"><div class="${P}-bk">${back}</div>Create artwork</div><div class="${P}-bd"><div class="${P}-lb">Enter prompt<small>Clear Text</small></div><div class="${P}-fl">${x.esc(PROMPT)}</div><div class="${P}-ch"><span>Desert Oasis</span><span>Infinite Fractals</span><span>Pink Sunset</span><span>Golden Hour</span></div><div class="${P}-lb st">Choose an art style</div><div class="${P}-st">${styles}</div><div class="${P}-new">Create</div></div><div class="${P}-gen" style="visibility: hidden"><div class="${P}-g">${tiles.map(cell).join('')}</div><div class="${P}-mk"><div class="${P}-dots"><i></i><i></i><i></i><i></i><i></i></div>Creating...</div></div></div>`);
    const q = (s) => root.querySelector(`.${P}-${s}`);
    const hd = q('hd'), bd = q('bd'), btn = q('new'), gen = q('gen'), mk = q('mk');
    const mdots = [...mk.querySelectorAll(`.${P}-dots i`)];
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), cov: n.querySelector(`.${P}-c`), nz: n.querySelector(`.${P}-c b`), g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // Create is tapped; the composer then gives way to the artworks forming
        const bp = press(s, NEW_AT, 0.06, 0.06, 0.14);
        put('new', bp.toFixed(3), () => { btn.style.transform = bp > 0 ? `scale(${(1 - 0.05 * bp).toFixed(4)})` : 'none'; });
        put('iss', s >= ISSUE, (v) => { gen.style.visibility = v ? '' : 'hidden'; hd.style.display = bd.style.display = v ? 'none' : ''; });

        cells.forEach((c, i) => {
          const a = S0 + i * W;
          const p = seg(s, a, a + W);                 // this tile's walk
          const nA = seg(p, 0, 0.5);                  // flat gradient -> noise
          const fc = seg(p, 0.5, 1);                  // noise -> picture (the cover thins away over the sharpening image)
          const chroma = seg(p, 0.1, 1);              // the noise's colours move toward the painting's
          const f = Math.floor(t * NOISE_FPS);
          if (p >= 1) {
            c.im.style.filter = restFilter(c.g);
            c.im.style.transform = restTransform(c.g);
            put(`c${i}`, 'done', () => { c.cov.style.display = 'none'; c.cov.style.opacity = ''; c.nz.style.opacity = '0'; c.nz.style.background = ''; });
          } else {
            const bl = (7 * (1 - fc)).toFixed(2);
            c.im.style.filter = `blur(${bl}px)${c.g.grade ? ' ' + c.g.grade : ''}`;
            c.im.style.transform = `scale(${(c.g.zoom * (1 + 0.1 * (1 - fc))).toFixed(4)})`;
            const na = nA.toFixed(3), co = (1 - fc).toFixed(3);
            // the noise layer is drawn only once the walk has started; before that the tile is the flat gradient
            put(`c${i}`, p > 0 ? `${na}|${co}|${f}|${chroma.toFixed(2)}` : 'flat', () => {
              c.cov.style.display = '';
              c.cov.style.opacity = fc > 0 ? co : '';
              c.nz.style.opacity = p > 0 ? na : '0';
              c.nz.style.background = p > 0 ? noise(i, f, chroma) : '';
            });
          }
        });

        // the mark: five dots bouncing in a wave while cycling hue, a function of t alone; it and the caption go once the last picture is in
        put('mk', s >= LAST, (v) => { mk.style.visibility = v ? 'hidden' : ''; });
        mdots.forEach((d, j) => {
          const w = 0.5 + 0.5 * Math.sin(2 * Math.PI * (t * 1.3 - j * 0.14));
          const y = (-7 * w).toFixed(1), h = Math.round((t * 140 + j * 52) % 360 / 5) * 5;
          put(`m${j}`, `${y}|${h}`, () => { d.style.transform = `translateY(${y}px)`; d.style.background = `hsl(${h}, 82%, 60%)`; });
        });
      },
    };
  },
};
