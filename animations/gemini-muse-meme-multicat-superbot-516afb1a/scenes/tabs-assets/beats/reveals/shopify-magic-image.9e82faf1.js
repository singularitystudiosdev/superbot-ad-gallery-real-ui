// Shopify Magic media generation, the product-media editor of the Shopify admin ('Replace background', Scene), as screen-recorded in 2024
// (Hopatoo, YouTube w34KbVYatko, 2024-07-11, t~78-108 s; spec .tmp/clone-9e82faf1/reveal-refs/shopify-magic-image/spec.json, confidence 0.72;
// frames ag2_idle_t33, ag2_ready_t85, ag2_click_t86.6, ag2_pending_start_t87.2, ag2_pending_t94, ag2_rail_zoom_t94, ag2_pill_zoom_t94,
// ag2_first_result_t96.4, ag2_results_3_t101, ag2_complete_t108, ag2_button_states, ag2_rail_sequence). A near-black full-screen editor:
// an 'Edit image' title row with a dim 'Reset' and a white 'Done' pill, the photo on a black canvas, a #1A1A1A tool panel on the right
// ('Remove background' with a 'Remove' button, 'Replace background' with a Scene | Color switch, the two described fields, the Generate
// button and a Suggestions card). Pressing Generate relabels the button 'Generate again' and disables it; a rail under the canvas shows
// the 'Original' tile and then flat #141414 empty slots (no spinner, no shimmer, no text), and a deep-violet 'Generating' chip below the
// rail pulses in brightness on a ~1.1 s period. The slots hard-swap to their pictures one at a time, right to left; the last one lands,
// the chip clears and the button comes back.
// Adapted to ten images: ten slots after the Original tile (the footage shows four), filled right to left by laying the slot row out
// row-reverse so the DOM / 'Muse meme N' order lands visually right-to-left. Omitted: the store name and product id in the title, the
// browser chrome, the macOS menu bar and dock, the Loom button and its sharing banner, the Suggestions thumbnails' photos (plain tiles)
// and any plan or upsell text; every picture is our own meme, system type only, no logo or wordmark.
import { press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-smi';
const ROOT_H = 372, PANEL_W = 136, TILE = 34, TILE_H = 36, GAP = 3, CV = 226;
const CSS = `
.${P} { box-sizing: border-box; position: relative; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 12px; background: #000; color: #f1f1f1; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #262626; }
.${P}-top { flex: none; display: flex; align-items: center; gap: 8px; height: 30px; padding: 0 12px; }
.${P}-top b { font-size: 9px; font-weight: 600; color: #fff; }
.${P}-reset { margin-left: auto; font-size: 7.5px; color: #5c5c5c; }
.${P}-done { box-sizing: border-box; height: 17px; padding: 0 9px; border-radius: 9px; background: #fff; font-size: 7.5px; line-height: 17px; font-weight: 600; color: #1a1a1a; }
.${P}-body { flex: 1; min-height: 0; display: flex; }
.${P}-main { flex: 1; min-width: 0; display: flex; flex-direction: column; align-items: center; padding: 6px 10px 0; }
.${P}-cv { flex: none; position: relative; width: ${CV}px; height: ${CV}px; background: #0c0c0c; }
.${P}-cv img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-rail { flex: none; display: flex; align-items: flex-start; width: ${TILE * 11 + GAP * 10}px; height: ${TILE_H}px; margin-top: 18px; }
.${P}-orig { position: relative; flex: none; box-sizing: border-box; width: ${TILE}px; height: ${TILE_H}px; margin-right: ${GAP}px; border-radius: 4px; overflow: hidden; box-shadow: 0 0 0 1.5px #f5f5f5; }
.${P}-orig img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-orig i { position: absolute; left: 2px; top: 2px; box-sizing: border-box; height: 8px; padding: 0 2px; border-radius: 4px; background: rgba(60, 60, 60, .82); font-style: normal; font-size: 4px; line-height: 8px; color: #f2f2f2; }
.${P}-slots { flex: none; display: flex; flex-direction: row-reverse; justify-content: flex-end; gap: ${GAP}px; width: ${TILE * 10 + GAP * 9}px; }
.${P}-t { position: relative; flex: none; width: ${TILE}px; height: ${TILE_H}px; border-radius: 4px; overflow: hidden; background: #141414; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; background: #141414; }
.${P}-chipw { flex: none; display: flex; width: ${TILE * 11 + GAP * 10}px; margin-top: 12px; }
.${P}-chip { position: relative; box-sizing: border-box; height: 19px; padding: 0 11px; border-radius: 10px; background: #190843; overflow: hidden; }
.${P}-chip i { position: absolute; inset: 0; background: #2b1180; opacity: 0; }
.${P}-chip span { position: relative; font-size: 7.5px; line-height: 19px; font-weight: 500; color: #c4b5fd; letter-spacing: .1px; }
.${P}-panel { flex: none; box-sizing: border-box; display: flex; flex-direction: column; width: ${PANEL_W}px; padding: 8px 9px 8px 9px; background: #1a1a1a; box-shadow: inset 1px 0 0 #333; }
.${P}-h { flex: none; display: flex; align-items: center; gap: 4px; height: 12px; font-size: 7px; font-weight: 600; color: #f4f4f4; white-space: nowrap; }
.${P}-h svg { flex: none; width: 8px; height: 8px; }
.${P}-h u { margin-left: auto; text-decoration: none; display: grid; place-items: center; box-sizing: border-box; width: 7px; height: 7px; border-radius: 50%; box-shadow: inset 0 0 0 .8px #cfcfcf; font-size: 4.5px; line-height: 1; color: #cfcfcf; }
.${P}-rm { flex: none; display: grid; place-items: center; height: 19px; margin: 5px 0 9px; border-radius: 4px; background: #2a2a2a; font-size: 7px; font-weight: 500; color: #ededed; }
.${P}-seg { flex: none; display: flex; height: 17px; margin-top: 5px; border-radius: 4px; background: #2a2a2a; overflow: hidden; font-size: 7px; font-weight: 500; color: #cfcfcf; }
.${P}-seg span { flex: 1; display: grid; place-items: center; }
.${P}-seg .${P}-on { background: #3b3b3b; color: #fff; }
.${P}-lab { flex: none; margin-top: 8px; height: 10px; font-size: 6.5px; line-height: 10px; color: #dcdcdc; white-space: nowrap; }
.${P}-in { flex: none; box-sizing: border-box; height: 17px; margin-top: 3px; padding: 0 6px; border-radius: 4px; background: #212121; box-shadow: inset 0 0 0 1px #3a3a3a; font-size: 7px; line-height: 17px; color: #f0f0f0; white-space: nowrap; overflow: hidden; }
.${P}-ta { flex: none; box-sizing: border-box; height: 38px; margin-top: 3px; padding: 4px 6px; border-radius: 4px; background: #212121; box-shadow: inset 0 0 0 1px #3a3a3a; font-size: 7px; line-height: 10px; color: #f0f0f0; overflow: hidden; }
.${P}-go { flex: none; display: grid; place-items: center; height: 19px; margin-top: 8px; border-radius: 4px; font-size: 7px; font-weight: 600; }
.${P}-go.${P}-on { background: #303030; color: #fff; }
.${P}-go.${P}-off { background: #202020; color: #5a5a5a; }
.${P}-sg { flex: none; margin-top: 9px; padding: 6px 6px 5px; border-radius: 5px; background: #242424; }
.${P}-sg b { display: block; height: 9px; font-size: 6px; line-height: 9px; font-weight: 500; color: #cfcfcf; }
.${P}-sr { display: flex; align-items: center; gap: 5px; height: 15px; margin-top: 3px; }
.${P}-sr i { flex: none; width: 11px; height: 11px; border-radius: 2px; background: linear-gradient(150deg, #5b5b5b, #3a3a3a); }
.${P}-sr em { display: block; font-style: normal; font-size: 5.5px; line-height: 7px; font-weight: 500; color: #ececec; white-space: nowrap; }
.${P}-sr small { display: block; width: 76px; font-size: 4.5px; line-height: 6px; color: #9a9a9a; white-space: nowrap; overflow: hidden; }
.${P}-more { height: 9px; margin-top: 3px; font-size: 5.5px; line-height: 9px; color: #cfcfcf; }
`;

const SUBJECT = 'Muse at a lectern';
const PROMPT = 'a Muse in a lecture hall holding up a handwritten note, meme style';
const SUGGEST = [['Studio', 'commercial photography packsh...'], ['Living room', 'advertising style shot, soft sun s...'], ['Kitchen', 'in modern kitchen, wooden cabi...']];
const STRIPES = '<svg viewBox="0 0 10 10"><rect width="10" height="10" rx="1.5" fill="#2c2358"/><path d="M-1 4l5-5M-1 9l10-10M1 11l10-10M6 11l5-5" stroke="#8b6cf5" stroke-width="1.1"/></svg>';
const SPARKS = '<svg viewBox="0 0 10 10"><rect width="10" height="10" rx="2.5" fill="#2c2358"/><path d="M5 2c.3 1.6 1.4 2.7 3 3-1.6.3-2.7 1.4-3 3-.3-1.6-1.4-2.7-3-3 1.6-.3 2.7-1.4 3-3z" fill="#a78bfa"/></svg>';
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const PRESS_AT = 0.1;                             // the cursor presses Generate
const GO_AT = 0.16;                               // the button reads 'Generate again' and is disabled; the rail and the chip appear
const LAND = Array.from({ length: 10 }, (_, i) => 0.62 + i * 0.12);   // slot i takes its picture (DOM order, laid out right to left), the last at 1.70
const CHIP_OFF = LAND[9] + 0.03;                  // the chip clears just after the last picture lands
const BACK_AT = LAND[9] + 0.06;                   // the button comes back
const PULSE = 1.1;                                // the chip's brightness period in seconds, real time

export default {
  id: 'shopify-magic-image',
  label: 'Shopify Magic media generation (2024)',
  source: {
    platform: "Shopify admin product-media editor, 'Replace background' (desktop Chrome, dark theme; a tutorial screen recording on YouTube, 2024-07-11, whose narrator calls it 'the Shopify magic media generation tool', plus the Shopify Help Center page 'Media generation in the file editor')",
    feature: "near-black editor with an 'Edit image' title row (Reset, a white Done pill), the photo on the canvas, a tool panel (Remove background, Replace background with a Scene | Color switch, the described subject and background, the Generate button, Suggestions); pressing Generate relabels it 'Generate again' and disables it, an 'Original' tile plus flat #141414 empty slots (no spinner, no shimmer) appear in the rail under the canvas and a violet 'Generating' chip (#190843) pulses in brightness on a ~1.1 s period below it; the slots hard-swap to their pictures one at a time, right to left, then the chip clears and the button comes back (adapted to 10: ten slots; the store name, browser chrome, Loom banner and plan text are omitted)",
    refs: [
      { url: 'https://www.youtube.com/watch?v=w34KbVYatko', video: 'w34KbVYatko', published: '2024-07-11', retrieved: '2026-10-14' },
      { url: 'https://help.shopify.com/en/manual/ai-powered-tools/media-generation', retrieved: '2026-10-14' },
    ],
    extrapolated: [
      'ten slots after the Original tile (the footage shows four), filled right to left by a row-reverse slot row so the DOM / alt order lands visually right-to-left',
      "the footage's real wait is ~9.5 s from the click to the first picture and ~10.7 s to the fourth (slots at t=96.2, 96.9, 100.9, 106.9); here the click, the relabel, the empty-slot wait and the ten landings are compressed into the beat's window at an even step, strictly one at a time",
      "the chip's visible text is 'Generating' only (the footage hides its tail under the creator's screen-share HUD), its brightness pulse a cosine of period 1.1 s from t",
      "the Remove background / Replace background panel copy, the subject 'Muse at a lectern' and our own prompt in place of the footage's 'Dark Green Grass'; the Suggestions rows keep the footage's names with plain tiles instead of its photos; the title is 'Edit image' without the product name or 'Media 11 of 11'",
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'shopify-magic-image');
    const srcCv = ownSrc(ctx.src, 'shopify-magic-image-canvas');
    const srcOrig = ownSrc(ctx.src, 'shopify-magic-image-orig');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-pend"></div></div>`;
    const sug = ([n, d]) => `<div class="${P}-sr"><i></i><div><em>${n}</em><small>${d}</small></div></div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-top"><b>Edit image</b><span class="${P}-reset">Reset</span><span class="${P}-done">Done</span></div><div class="${P}-body"><div class="${P}-main"><div class="${P}-cv"><img src="${srcCv}" width="870" height="1024" decoding="sync" alt="Product photo on the canvas" style="transform-origin: ${tiles[0].origin}"/></div><div class="${P}-rail" style="visibility: hidden"><div class="${P}-orig"><img src="${srcOrig}" width="870" height="1024" decoding="sync" alt="Original photo" style="transform-origin: ${tiles[0].origin}"/><i>Original</i></div><div class="${P}-slots">${tiles.map(cell).join('')}</div></div><div class="${P}-chipw"><div class="${P}-chip" style="visibility: hidden"><i></i><span>Generating</span></div></div></div><div class="${P}-panel"><div class="${P}-h">${STRIPES}Remove background</div><div class="${P}-rm">Remove</div><div class="${P}-h">${SPARKS}Replace background<u>i</u></div><div class="${P}-seg"><span class="${P}-on">Scene</span><span>Color</span></div><div class="${P}-lab">Describe the subject *</div><div class="${P}-in">${x.esc(SUBJECT)}</div><div class="${P}-lab">Describe the background you want *</div><div class="${P}-ta">${x.esc(PROMPT)}</div><div class="${P}-go ${P}-on">Generate</div><div class="${P}-sg"><b>Suggestions</b>${SUGGEST.map(sug).join('')}<div class="${P}-more">View more</div></div></div></div></div>`);
    const q = (s) => root.querySelector(s);
    const go = q(`.${P}-go`), rail = q(`.${P}-rail`), chip = q(`.${P}-chip`), glow = q(`.${P}-chip i`);
    const cvIm = q(`.${P}-cv img`), origIm = q(`.${P}-orig img`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), pend: n.querySelector(`.${P}-pend`), g: tiles[i] }));
    ctx.gate([cvIm, origIm, ...cells.map((c) => c.im)]);
    cvIm.style.filter = restFilter(tiles[0]);
    cvIm.style.transform = restTransform(tiles[0]);
    origIm.style.filter = restFilter(tiles[0]);
    origIm.style.transform = restTransform(tiles[0]);

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // the button: 'Generate' (enabled), 'Generate again' disabled while the run is in flight, 'Generate again' enabled once the last slot has filled
        const state = s >= BACK_AT ? 2 : s >= GO_AT ? 1 : 0;
        put('go', state, (v) => { go.className = `${P}-go ${P}-${v === 1 ? 'off' : 'on'}`; go.textContent = v === 0 ? 'Generate' : 'Generate again'; });
        const gp = press(s, PRESS_AT, 0.06, 0.06, 0.14);
        put('gp', gp.toFixed(3), () => { go.style.transform = gp > 0 ? `scale(${(1 - 0.05 * gp).toFixed(4)})` : 'none'; });

        // the rail (the Original tile and the flat empty slots) appears with the click
        put('rail', s >= GO_AT, (v) => { rail.style.visibility = v ? '' : 'hidden'; });

        // each slot hard-swaps from its flat #141414 placeholder to its picture
        cells.forEach((c, i) => {
          put(`i${i}`, s >= LAND[i], (v) => { c.im.style.visibility = v ? '' : 'hidden'; c.pend.style.display = v ? 'none' : ''; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
        });

        // the violet 'Generating' chip: its brightness breathes on a 1.1 s period from t, from the click until the last slot lands
        put('chip', s >= GO_AT && s < CHIP_OFF, (v) => { chip.style.visibility = v ? '' : 'hidden'; });
        const pulse = 0.5 - 0.5 * Math.cos((2 * Math.PI * t) / PULSE);
        put('glow', pulse.toFixed(3), (v) => { glow.style.opacity = v; });
      },
    };
  },
};
