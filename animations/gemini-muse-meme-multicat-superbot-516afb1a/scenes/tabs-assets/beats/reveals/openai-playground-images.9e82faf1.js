// The OpenAI platform Images playground (dark theme), a gpt-image-2 batch as it ran in a screen recording (Everyday AI, YouTube yw1kqlht9HA,
// 2026-06-13, t=174-236 s the pending beat, t=266-275 s the ten-image batch; spec .tmp/clone-9e82faf1/reveal-refs/openai-playground-images/spec.json,
// confidence 0.62; frames wy_oaipg_pending_early_t174.jpg, pending_mid_t190.jpg, pending_blur_t204.jpg, pending_blur2_t220.jpg, landed_t236.jpg,
// tiles10_t270.jpg, composer_t100.jpg). A near-black canvas (#1D1D1D) titled 'Images' holding a square grid of flush cells split by 1px hairlines, and a
// docked composer at the foot ('Describe what you want to see...' over a toolbar with the '10x' batch count and a 'gpt-image-2' chip). Generating
// mounts a dark rounded tile with a radial vignette: the first words of the prompt, clipped to three lines, sit centred in grey; a live elapsed timer
// ('11s' ... '41s' ... '1m 11s') bottom-left, a pencil bottom-right, a faint x top-left. No spinner, percentage, label or bar: a soft BLURRED preview
// of the picture materialises underneath the caption and the sharp picture then hard-swaps in.
// Adapted to ten images: ten tiles in a 5 x 2 grid (the footage shows one tile filling), each with its own blurred preview, landing in reading order.
// The footage's timer (11 s -> 1 m 11 s, about 72 s of real time) is compressed into the beat window and driven from t. Omitted: the left navigation
// with its project chip and the 'cleaned things up' toast, the quota-error tile, the recording's browser chrome, episode badge and webcam.
import { seg, press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-opi';
const ROOT_H = 384, COLS = 5, PAD_X = 22;
const CSS = `
.${P} { position: relative; box-sizing: border-box; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 12px; background: #1d1d1d; color: #e6e6e6; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #2a2a2a; }
.${P}-ttl { position: absolute; left: ${PAD_X}px; top: 14px; font-size: 19px; font-weight: 500; line-height: 26px; color: #ececec; }
.${P}-g { position: absolute; left: 0; right: 0; top: 58px; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); border-top: 1px solid #262626; }
.${P}-t { position: relative; aspect-ratio: 1; overflow: hidden; box-shadow: 1px 1px 0 0 #262626; background: #1d1d1d; }
.${P}-t.${P}-live { background: radial-gradient(circle at 50% 50%, #111111 0, #141414 38%, #2a2a2a 62%, #1c1c1c 80%); }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-cv { position: absolute; inset: 0; }
.${P}-cap { position: absolute; left: 14px; right: 14px; top: 50%; transform: translateY(-50%); text-align: center; font-size: 9.5px; line-height: 12.5px; color: #c9c9c9; overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 3; }
.${P}-tm { position: absolute; left: 8px; bottom: 7px; font-size: 8.5px; line-height: 10px; color: #a8a8a8; }
.${P}-ed { position: absolute; right: 8px; bottom: 7px; width: 9px; height: 9px; fill: none; stroke: #b4b4b4; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
.${P}-x { position: absolute; left: 8px; top: 6px; font-size: 11px; line-height: 12px; color: #8e8e8e; }
.${P}-cmp { position: absolute; left: 50%; bottom: 14px; width: 330px; margin-left: -165px; box-sizing: border-box; height: 66px; padding: 11px 14px 0; border-radius: 14px; background: #262626; box-shadow: 0 0 0 1px #303030; }
.${P}-in { height: 14px; font-size: 10px; line-height: 14px; color: #8a8a8a; white-space: nowrap; overflow: hidden; }
.${P}-in.${P}-typed { color: #dcdcdc; }
.${P}-tb { position: absolute; left: 14px; right: 12px; bottom: 9px; display: flex; align-items: center; gap: 12px; height: 18px; font-size: 8.5px; color: #a0a0a0; }
.${P}-tb svg { flex: none; width: 10px; height: 10px; fill: none; stroke: #a0a0a0; stroke-width: 1.4; stroke-linecap: round; stroke-linejoin: round; }
.${P}-tb em { font-style: normal; }
.${P}-tb .${P}-chip { display: flex; align-items: center; gap: 4px; }
.${P}-tb .${P}-chip i { font-style: normal; font-size: 7px; color: #888; }
.${P}-go { margin-left: auto; display: grid; place-items: center; width: 20px; height: 20px; border-radius: 50%; background: #3a3a3a; color: #bdbdbd; font-size: 10px; line-height: 10px; }
`;

const PROMPT = 'Create a bright meme-style image of a muse holding a handwritten note in a lecture hall';
const CAPTION = 'Create a bright meme-style image of a muse holding a hand-…';
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const GEN_AT = 0.04;                              // the cursor presses the submit arrow
const ISSUE = 0.12;                               // the tiles mount, the composer empties
const SECS = 72;                                  // the footage's timer ran 11s -> 1m 11s; here 0 -> 1m 12s across the batch
const PRE = 0.62;                                 // a tile's blurred preview starts to materialise this long (layout seconds) before it lands
const PEAK = 0.62;                                // the preview's opacity just before the swap
const fmt = (n) => (n >= 60 ? `${Math.floor(n / 60)}m ${n % 60}s` : `${n}s`);

export default {
  id: 'openai-playground-images',
  label: 'OpenAI Images Playground (2026)',
  source: {
    platform: 'OpenAI platform Images playground, platform.openai.com/playground/images, gpt-image-2 (desktop Chrome, dark theme; a screen recording on YouTube, 2026-06-13)',
    feature: "dark rounded tiles on a hairline square grid, each captioned with the prompt's first words and carrying a live elapsed timer ('11s' ... '1m 11s') bottom-left, a pencil bottom-right and a faint x top-left; a blurred preview materialises underneath the caption and the sharp picture then hard-swaps in; no spinner, percentage or label (adapted to 10: a 5 x 2 grid of such tiles, '10x' in the composer, landing in reading order; the left navigation, the quota-error tile and the recording's overlays are omitted)",
    refs: [
      { url: 'https://www.youtube.com/watch?v=yw1kqlht9HA', retrieved: '2026-10-14' },
      { url: 'https://platform.openai.com/docs/guides/image-generation', retrieved: '2026-10-14' },
    ],
    // the second attempt filled ONE tile (the rest of the grid stayed empty); the ten-tile fill is only seen landed, and the first pending seconds sit behind a jump cut
    extrapolated: [
      'ten tiles pending at once in a 5 x 2 grid, each with its own caption, timer and blurred preview (the footage shows one tile filling; the grid there is four columns wide)',
      'the pictures landing one at a time in reading order',
      'the elapsed timer (11 s -> 1 m 11 s, about 72 s of real time) compressed into the beat window and driven from t; each tile reads the batch clock at the moment it lands',
      'the blurred preview given the same ramp on every tile, ending just before its swap',
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'openai-playground-images');
    const pencil = `<svg class="${P}-ed" viewBox="0 0 12 12"><path d="M2 10l.6-2.4 5.7-5.7a1 1 0 011.4 0l.4.4a1 1 0 010 1.4L4.4 9.4z"/></svg>`;
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; opacity: 0; transform-origin: ${g.origin}"/><div class="${P}-cv" style="display: none"><span class="${P}-x">&#215;</span><div class="${P}-cap">${x.esc(CAPTION)}</div><span class="${P}-tm">0s</span>${pencil}</div></div>`;
    const tb = `<svg viewBox="0 0 12 12"><path d="M2 3.5h8M2 6h8M2 8.5h5"/></svg><svg viewBox="0 0 12 12"><path d="M2 4h5M9 4h1M2 8h1M5 8h5"/><circle cx="8" cy="4" r="1"/><circle cx="4" cy="8" r="1"/></svg><em>10x</em><svg viewBox="0 0 12 12"><path d="M8.5 5.5L5.2 8.8a1.6 1.6 0 01-2.3-2.3l4-4a1.1 1.1 0 011.6 1.6L4.6 7.9"/></svg><span class="${P}-chip">gpt-image-2<i>&#8693;</i></span><span class="${P}-go">&#8593;</span>`;
    const root = x.el(`<div class="${P}"><div class="${P}-ttl">Images</div><div class="${P}-g">${tiles.map(cell).join('')}</div><div class="${P}-cmp"><div class="${P}-in ${P}-typed">${x.esc(PROMPT)}</div><div class="${P}-tb">${tb}</div></div></div>`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ n, im: n.querySelector('img'), cv: n.querySelector(`.${P}-cv`), tm: n.querySelector(`.${P}-tm`), g: tiles[i] }));
    const inp = root.querySelector(`.${P}-in`), go = root.querySelector(`.${P}-go`);
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered
        const sIss = ctx.cardIn + ISSUE * k;
        const last = ctx.seq(9)[1];

        // the submit arrow is pressed, then the composer empties back to its placeholder
        const gp = press(s, GEN_AT, 0.05, 0.05, 0.12);
        put('go', gp.toFixed(3), () => { go.style.transform = gp > 0 ? `scale(${(1 - 0.12 * gp).toFixed(4)})` : 'none'; });
        const on = t >= sIss;
        put('iss', on, (v) => {
          inp.textContent = v ? 'Describe what you want to see...' : PROMPT;
          inp.className = v ? `${P}-in` : `${P}-in ${P}-typed`;
        });

        // the batch clock: 0 -> 1m 12s across the beat; every pending tile shows it, and a tile drops out when it lands
        const clock = Math.floor(SECS * seg(t, sIss, last) + 1e-6);
        cells.forEach((c, i) => {
          const land = ctx.seq(i)[1];
          const landed = t >= land;
          const live = on && !landed;
          put(`l${i}`, live, (v) => { c.cv.style.display = v ? '' : 'none'; c.n.className = v ? `${P}-t ${P}-live` : `${P}-t`; });
          put(`m${i}`, live ? clock : -1, (v) => { if (v >= 0) c.tm.textContent = fmt(v); });

          // a blurred preview materialises under the caption, then the sharp picture replaces it in one frame
          const pv = live ? seg(t, Math.max(land - PRE * k, sIss), land) : 0;
          const blur = (26 - 12 * pv).toFixed(1), op = (PEAK * pv).toFixed(2);
          put(`b${i}`, landed ? 'sharp' : `${blur}|${op}`, (v) => {
            if (v === 'sharp') { c.im.style.filter = restFilter(c.g); c.im.style.opacity = ''; }
            else { c.im.style.filter = `blur(${blur}px)${c.g.grade ? ` ${c.g.grade}` : ''}`; c.im.style.opacity = op; }
          });
          put(`v${i}`, pv > 0 || landed, (v) => { c.im.style.visibility = v ? '' : 'hidden'; });
          c.im.style.transform = restTransform(c.g);
        });
      },
    };
  },
};
