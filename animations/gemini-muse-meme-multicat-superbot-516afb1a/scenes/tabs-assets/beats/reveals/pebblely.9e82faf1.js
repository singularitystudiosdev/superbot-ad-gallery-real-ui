// Pebblely's web editor, light theme, the 2023 build (official channel video 'How to Generate AI Product Photos of Any Size (Demo)',
// YouTube -lW4kQJ1YUs, 2023-02-08, t~43.5-50.0 s; spec .tmp/clone-9e82faf1/reveal-refs/pebblely/spec.json, confidence 0.82; frames
// ak_peb_idle_generate_t43.5, ak_peb_loading_first_result_t44.4, ak_peb_loading_4_spinner_tiles_t45.5, ak_peb_loading_persisting_t50.0).
// A product-photo studio: a left panel with the 'Themes' | 'Customize' tabs (Customize on a yellow slab), the prompt 'on a rock, by the
// sea', the don't-want chip 'ugly ✕' and a 'Match a style (optional)' row; a centre canvas holding the cut-out product on a transparency
// checkerboard; and a bottom bar with the 'Generated images' header and a full-width yellow 'GENERATE' button. Pressing the button
// relabels it in place to 'LOADING...' (same yellow fill, darker label), the closed 'Generated images' strip opens into flat #EAEAEA
// square tiles, each with one small grey circular double-arrow spinner, and the canvas takes on the generated yellow background.
// There is no percentage, timer, position text or bar anywhere; the strip's tiles simply hold their spinner.
// Adapted to ten images: ten tiles (two rows of five under the canvas) whose spinners turn from render(t), each hard-swapping to its
// picture in strict reading order (the footage cuts away before any tile fills, so the swap itself is extrapolated), the button
// returning to 'GENERATE' once the tenth has landed. Omitted: the cloud logo, the 'Log out' nav entry and the presenter's inset. The
// footage's pictures are never reproduced: the canvas product is a plain white bottle shape (no label, no brand) and every tile is our
// own meme (system type, no logo, no platform font).
import { seg, press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-pbl';
const ROOT_H = 414, LEFT_W = 150, NAV_H = 22, MAIN_H = 196, BAR_H = 30, COLS = 5, GAP = 6;
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 10px; background: #ffffff; color: #1a1a1a; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #e6e6e6; }
.${P}-nav { flex: none; display: flex; align-items: center; justify-content: flex-end; gap: 14px; height: ${NAV_H}px; padding: 0 14px; font-size: 6.5px; color: #1a1a1a; }
.${P}-main { flex: none; position: relative; display: flex; height: ${MAIN_H}px; }
.${P}-left { flex: none; box-sizing: border-box; display: flex; flex-direction: column; width: ${LEFT_W}px; height: 100%; padding: 2px 8px 0 8px; overflow: hidden; background: #fcfcfc; box-shadow: 1px 0 0 #ececec; }
.${P}-tabs { flex: none; display: flex; gap: 8px; height: 16px; margin-bottom: 5px; font-size: 7.5px; font-weight: 700; line-height: 16px; }
.${P}-tabs span { padding: 0 4px; }
.${P}-tabs .${P}-on { background: #f5c518; }
.${P}-lb { display: block; margin-top: 6px; font-size: 7.5px; font-weight: 700; line-height: 9px; }
.${P}-cap { display: block; margin-top: 2px; font-size: 6px; line-height: 8px; color: #333333; }
.${P}-ta { flex: none; box-sizing: border-box; margin-top: 3px; height: 34px; padding: 4px 5px; border: 1px solid #e2e2e2; background: #ffffff; font-size: 6.5px; line-height: 9px; color: #222222; }
.${P}-chip { display: inline-flex; align-self: flex-start; align-items: center; gap: 4px; margin-top: 3px; height: 12px; padding: 0 4px; border-radius: 3px; background: #1a1a1a; font-size: 6px; color: #ffffff; }
.${P}-in { flex: none; box-sizing: border-box; margin-top: 3px; height: 14px; padding: 0 5px; border: 1px solid #ececec; background: #ffffff; font-size: 5.8px; line-height: 12px; color: #8a8a8a; white-space: nowrap; overflow: hidden; }
.${P}-sty { display: flex; gap: 6px; margin-top: 4px; }
.${P}-sty span { flex: 1; display: grid; place-items: center; box-sizing: border-box; height: 24px; border: 1px solid #e6e6e6; background: #ffffff; font-size: 6px; color: #444444; }
.${P}-sty .${P}-on { border: 2px solid #f5c518; }
.${P}-cv { position: relative; flex: 1; min-width: 0; }
.${P}-sel { position: absolute; right: 12px; top: 0; font-size: 6.5px; color: #1a1a1a; }
.${P}-pad { position: absolute; left: 50%; top: 50%; width: 172px; height: 172px; margin: -82px 0 0 -86px; overflow: hidden; background-color: #ffffff; background-image: linear-gradient(45deg, #e6e6e6 25%, transparent 25%, transparent 75%, #e6e6e6 75%), linear-gradient(45deg, #e6e6e6 25%, transparent 25%, transparent 75%, #e6e6e6 75%); background-size: 16px 16px; background-position: 0 0, 8px 8px; }
.${P}-gen { position: absolute; inset: 0; background: #f6e27a; opacity: 0; }
.${P}-bot { position: absolute; left: 50%; top: 30px; width: 34px; height: 84px; margin-left: -17px; border-radius: 9px 9px 6px 6px; background: linear-gradient(90deg, #f0f0f0, #ffffff 45%, #e9e9e9); box-shadow: 0 0 0 1px rgba(0, 0, 0, .07); }
.${P}-bot::before { content: ""; position: absolute; left: 9px; right: 9px; top: -11px; height: 12px; border-radius: 3px 3px 0 0; background: #f4f4f4; box-shadow: 0 0 0 1px rgba(0, 0, 0, .07); }
.${P}-bar { flex: none; display: flex; align-items: center; height: ${BAR_H}px; box-sizing: border-box; padding-left: ${LEFT_W}px; padding-right: 12px; box-shadow: 0 -1px 0 #ececec; }
.${P}-bar b { flex: 1; text-align: center; font-size: 7.5px; font-weight: 600; }
.${P}-bar b svg { width: 7px; height: 7px; margin-left: 3px; fill: none; stroke: #1a1a1a; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.${P}-go { flex: none; display: grid; place-items: center; width: 118px; height: 20px; background: #f5c518; font-size: 7.5px; font-weight: 600; letter-spacing: .2px; color: #1a1a1a; }
.${P}-strip { flex: 1; min-height: 0; box-sizing: border-box; padding: 6px 12px 0 ${LEFT_W + 2}px; }
.${P}-g { display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; }
.${P}-t { position: relative; aspect-ratio: 1; overflow: hidden; background: #eaeaea; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; display: grid; place-items: center; background: #eaeaea; }
.${P}-sp { display: block; width: 17px; height: 17px; }
.${P}-sp svg { display: block; width: 17px; height: 17px; fill: none; stroke: #8a8a8a; stroke-width: 1.9; stroke-linecap: round; stroke-linejoin: round; }
`;

const PROMPT = 'on a rock, by the sea';
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const GEN_AT = 0.06;                              // the cursor presses GENERATE
const ISSUE = 0.16;                               // the button relabels, the strip opens into ten pending tiles, the canvas takes the generated background
const LAND = Array.from({ length: 10 }, (_, i) => 0.4 + i * 0.1425);   // tile i hard-swaps to its picture (reading order), the last at 1.68
const GLYPH = '<svg viewBox="0 0 24 24"><path d="M4.5 12a7.5 7.5 0 0 1 12.9-5.2M19.5 12a7.5 7.5 0 0 1-12.9 5.2"/><path d="M17.8 2.8v4.2h-4.2M6.2 21.2V17h4.2"/></svg>';

export default {
  id: 'pebblely',
  label: 'Pebblely (2023)',
  source: {
    platform: "Pebblely's web editor (pebblely.com, light theme, yellow accent; the official Pebblely YouTube channel, a desktop Chrome screen recording, 2023-02-08)",
    feature: "product-photo studio: a left panel ('Themes' | 'Customize' tabs, the prompt 'on a rock, by the sea', the don't-want chip 'ugly ✕'), a canvas with the cut-out product on a checkerboard, a bottom bar with 'Generated images' and a yellow 'GENERATE' button that relabels to 'LOADING...' in place while the strip's flat #EAEAEA tiles each turn a circular double-arrow spinner (no percentage, timer, position text or bar); adapted to ten tiles hard-swapping to their pictures in reading order",
    refs: [
      { url: 'https://www.youtube.com/watch?v=-lW4kQJ1YUs', retrieved: '2026-10-14' },
    ],
    extrapolated: [
      'The footage shows four strip tiles; the ten here are two rows of five under the canvas (the same square #EAEAEA tile, the same spinner), because a single row of ten in the 410 px beside the left panel would be ~35 px each.',
      "The footage cuts away at ~t50.0 with every tile still on its spinner, so the tile-by-tile hard swap to the finished pictures in reading order, and the button returning to 'GENERATE' after the tenth, are extrapolated.",
      "The canvas product is a plain white bottle shape (the footage's labelled bottle is not drawn); after the press the checkerboard takes a flat yellow generated background over ~0.25 s, as the first generated frame does in the footage.",
      "The 'Select another product' link and the 'Home / Help' nav are drawn; the cloud logo and the 'Log out' nav entry are omitted.",
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'pebblely');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-pend"><i class="${P}-sp">${GLYPH}</i></div></div>`;
    const chev = '<svg viewBox="0 0 12 12"><path d="M2.5 4.5l3.5 3.5 3.5-3.5"/></svg>';
    const root = x.el(`<div class="${P}"><div class="${P}-nav"><span>Home</span><span>Help</span></div><div class="${P}-main"><div class="${P}-left"><div class="${P}-tabs"><span>Themes</span><span class="${P}-on">Customize</span></div><b class="${P}-lb" style="margin-top: 2px">Describe your photo</b><span class="${P}-cap">Your product is...</span><div class="${P}-ta">${x.esc(PROMPT)}</div><b class="${P}-lb">List what you don't want</b><span class="${P}-cap">Reduce photos that are/have...</span><div class="${P}-chip">ugly <span>✕</span></div><div class="${P}-in">Add things or attributes you don't want</div><b class="${P}-lb">Match a style (optional)</b><span class="${P}-cap">Use styles and colors from an image</span><div class="${P}-sty"><span class="${P}-on">None</span><span>+</span></div></div><div class="${P}-cv"><span class="${P}-sel">Select another product</span><div class="${P}-pad"><div class="${P}-gen"></div><div class="${P}-bot"></div></div></div></div><div class="${P}-bar"><b>Generated images${chev}</b><div class="${P}-go">GENERATE</div></div><div class="${P}-strip"><div class="${P}-g" style="visibility: hidden">${tiles.map(cell).join('')}</div></div></div>`);
    const go = root.querySelector(`.${P}-go`), gen = root.querySelector(`.${P}-gen`), grid = root.querySelector(`.${P}-g`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), pend: n.querySelector(`.${P}-pend`), sp: n.querySelector(`.${P}-sp`), g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // GENERATE is pressed
        const gp = press(s, GEN_AT, 0.06, 0.06, 0.14);
        put('go', gp.toFixed(3), () => { go.style.transform = gp > 0 ? `scale(${(1 - 0.04 * gp).toFixed(4)})` : 'none'; });

        // the button reads LOADING... (same fill, darker label) from the issue until the tenth picture has landed
        const busy = s >= ISSUE && s < LAND[9];
        put('lab', busy, (v) => { go.textContent = v ? 'LOADING...' : 'GENERATE'; go.style.color = v ? '#7a6a1f' : ''; });

        // the strip opens into the pending tiles; the canvas takes the generated background
        put('iss', s >= ISSUE, (v) => { grid.style.visibility = v ? '' : 'hidden'; });
        const gf = seg(s, ISSUE, ISSUE + 0.25);
        put('gen', gf.toFixed(3), () => { gen.style.opacity = gf > 0 ? (0.85 * gf).toFixed(3) : '0'; });

        cells.forEach((c, i) => {
          const a = LAND[i];
          put(`i${i}`, s >= a, (v) => { c.im.style.visibility = v ? '' : 'hidden'; c.pend.style.display = v ? 'none' : ''; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
          // the spinner turns with t (its phase differs per tile); a function of t alone, covered or not
          const deg = (((t * 420 + i * 53) % 360) + 360) % 360;
          put(`r${i}`, deg.toFixed(0), (d) => { c.sp.style.transform = `rotate(${d}deg)`; });
        });
      },
    };
  },
};
