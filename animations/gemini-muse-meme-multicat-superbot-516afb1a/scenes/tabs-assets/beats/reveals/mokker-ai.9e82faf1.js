// Mokker Studio's web editor, light theme, violet accent, the 2023 build (official channel video 'Learn how to Use Mokker Studio in 80
// seconds', YouTube FHuG9-OOvyY, 2023-10-23, t~74.6-77.4 s; spec .tmp/clone-9e82faf1/reveal-refs/mokker-ai/spec.json, confidence 0.7;
// frames ak_mok_t74.6, ak_mok_t75.1, ak_mok_t75.6, ak_mok_t76.3, ak_mok_t76.9, ak_mok_t77.4). The breadcrumb 'Home / Living Room', a
// left icon rail (Templates | Products | Props) beside the Products panel ('+ Upload Product Photo'), a canvas holding the product on a
// transparency checkerboard, the mood chips 'Modern Living Room' / 'Cold Light' with the field 'Write a custom prompt', a wide violet
// gradient bar (a sparkle glyph + 'Generate Photos') and a right 'Results' rail of earlier renders. Pressing the bar swaps its content,
// in place, to a white circular spinner + 'Loading...' on the same fill; nothing else moves (the canvas keeps the un-backgrounded product
// on the checkerboard, the rail keeps its renders), and the render then lands as a finished photograph. No percentage, step text, timer
// or placeholder tile.
// Adapted to ten images: the footage swaps the editor for one full-bleed photograph, so here the ten renders land in the Results rail
// (a two-column grid), each hard-swapping over an earlier-render swatch in strict reading order; the bar returns to 'Generate Photos'
// after the tenth. Omitted: the tutorial's burned-in step label ('6. GENERATE IMAGES'), the orange 'CHANGE THE MOOD' lower third and
// the account avatar. The footage's pictures are never reproduced: the canvas product is our own meme cut out on the checkerboard, every
// rail tile is our own meme, and no logo, wordmark or platform font is drawn (system type, plain glyphs).
import { seg, press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-mkr';
const ROOT_H = 392, RAIL_W = 46, PANEL_W = 108, RES_W = 112, TOP_H = 26, COLS = 2, GAP = 5;
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 10px; background: #ffffff; color: #23232b; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #e8e8ee; }
.${P}-top { flex: none; display: flex; align-items: center; gap: 4px; height: ${TOP_H}px; padding: 0 10px; box-shadow: 0 1px 0 #ededf2; font-size: 7px; color: #4a4a55; }
.${P}-top b { font-weight: 600; color: #23232b; }
.${P}-top i { font-style: normal; color: #a4a4b0; }
.${P}-body { flex: 1; min-height: 0; display: flex; }
.${P}-rail { flex: none; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; gap: 6px; width: ${RAIL_W}px; padding: 8px 0; box-shadow: 1px 0 0 #ededf2; }
.${P}-ri { position: relative; display: flex; flex-direction: column; align-items: center; gap: 2px; box-sizing: border-box; width: 38px; padding: 5px 0 4px; border-radius: 7px; font-size: 5.8px; color: #5b5b68; }
.${P}-ri svg { width: 11px; height: 11px; fill: none; stroke: #5b5b68; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
.${P}-ri.${P}-on { background: #f1edfd; color: #5b34d6; }
.${P}-ri.${P}-on svg { stroke: #5b34d6; }
.${P}-ri.${P}-on::before { content: ""; position: absolute; left: -4px; top: 6px; bottom: 6px; width: 2px; border-radius: 1px; background: #7c4dff; }
.${P}-pan { flex: none; box-sizing: border-box; width: ${PANEL_W}px; padding: 8px 8px 0; box-shadow: 1px 0 0 #ededf2; }
.${P}-ph { display: flex; align-items: center; justify-content: space-between; height: 12px; font-size: 7.5px; font-weight: 600; }
.${P}-ph span { font-size: 6px; font-weight: 400; color: #5b5b68; }
.${P}-drop { margin-top: 6px; box-sizing: border-box; padding: 6px 5px 5px; border: 1px dashed #d4d4de; border-radius: 6px; text-align: center; font-size: 5.5px; color: #8b8f98; }
.${P}-up { display: block; margin-bottom: 3px; height: 15px; border-radius: 4px; background: #7c4dff; font-size: 5.6px; font-weight: 600; line-height: 15px; color: #ffffff; white-space: nowrap; overflow: hidden; }
.${P}-th { display: grid; grid-template-columns: 1fr 1fr; gap: ${GAP}px; margin-top: 6px; }
.${P}-th i { display: block; aspect-ratio: 1; border-radius: 5px; background: #f3f3f7; box-shadow: inset 0 0 0 1px #ececf1; }
.${P}-th i::after { content: ""; display: block; margin: 30% auto 0; width: 40%; height: 40%; border-radius: 3px; background: #c9c9d3; }
.${P}-none { margin-top: 9px; text-align: center; font-size: 6px; color: #8b8f98; }
.${P}-main { flex: 1; min-width: 0; box-sizing: border-box; display: flex; flex-direction: column; padding: 8px 8px 8px; }
.${P}-cv { position: relative; flex: none; height: 236px; overflow: hidden; border-radius: 6px; background-color: #ffffff; background-image: linear-gradient(45deg, #e4e4ea 25%, transparent 25%, transparent 75%, #e4e4ea 75%), linear-gradient(45deg, #e4e4ea 25%, transparent 25%, transparent 75%, #e4e4ea 75%); background-size: 22px 22px; background-position: 0 0, 11px 11px; box-shadow: 0 0 0 1px #e6e6ec; }
.${P}-cp { position: absolute; left: 50%; top: 50%; width: 124px; height: 168px; margin: -84px 0 0 -62px; overflow: hidden; -webkit-mask-image: radial-gradient(ellipse 50% 50% at 50% 50%, #000 94%, transparent 100%); mask-image: radial-gradient(ellipse 50% 50% at 50% 50%, #000 94%, transparent 100%); }
.${P}-cp img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-mood { flex: none; display: flex; align-items: center; gap: 4px; margin-top: 7px; height: 20px; }
.${P}-mood svg { flex: none; width: 10px; height: 10px; fill: #7c4dff; }
.${P}-mood span { flex: none; box-sizing: border-box; height: 12px; padding: 0 5px; border-radius: 6px; font-size: 6px; font-weight: 600; line-height: 12px; white-space: nowrap; }
.${P}-mood .${P}-a { background: #c9f4e8; color: #0d6a55; }
.${P}-mood .${P}-b { background: #d2e4fb; color: #1d5db8; }
.${P}-mood em { flex: 1; min-width: 0; box-sizing: border-box; height: 18px; padding: 0 6px; border-radius: 5px; background: #f4f4f7; font-style: italic; font-size: 6px; line-height: 18px; color: #8b8f98; white-space: nowrap; overflow: hidden; }
.${P}-go { flex: none; display: flex; align-items: center; justify-content: center; gap: 5px; margin-top: 7px; height: 28px; border-radius: 8px; background: linear-gradient(90deg, #7c4dff, #a855f7); font-size: 8px; font-weight: 600; color: #ffffff; }
.${P}-go svg { flex: none; width: 9px; height: 9px; fill: #ffffff; }
.${P}-spin { flex: none; display: none; box-sizing: border-box; width: 10px; height: 10px; border-radius: 50%; border: 1.6px solid rgba(255, 255, 255, .35); border-top-color: #ffffff; border-right-color: #ffffff; }
.${P}-res { flex: none; box-sizing: border-box; width: ${RES_W}px; padding: 8px 8px 0 8px; box-shadow: -1px 0 0 #ededf2; overflow: hidden; }
.${P}-rh { display: flex; align-items: center; justify-content: space-between; height: 14px; font-size: 7.5px; font-weight: 600; }
.${P}-tg { display: flex; gap: 3px; }
.${P}-tg i { display: block; width: 7px; height: 7px; box-sizing: border-box; border-radius: 2px; border: 1px solid #9a9aa8; }
.${P}-g { display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; margin-top: 7px; }
.${P}-t { position: relative; aspect-ratio: 3 / 2; border-radius: 4px; overflow: hidden; background: #ececf2; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-old { position: absolute; inset: 0; }
`;

const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const GEN_AT = 0.06;                              // the cursor presses the bar
const ISSUE = 0.16;                               // the bar's content becomes the spinner and 'Loading...'
const LAND = Array.from({ length: 10 }, (_, i) => 0.4 + i * 0.1425);   // result i lands in the Results rail (reading order), the last at 1.68
// the earlier renders the rail holds before the new ones arrive: flat scene-coloured swatches (the footage's thumbnails are not reproduced)
const OLD = ['#cfdcea', '#d9ccb4', '#c9c4bd', '#c7d6e6', '#dcd3bd', '#c4cbd2', '#d6d0c6', '#cdd8e2', '#d8cdb9', '#c8ced6'];
const SPARK = '<svg viewBox="0 0 24 24"><path d="M12 1.5l2.6 7.9 7.9 2.6-7.9 2.6L12 22.5l-2.6-7.9L1.5 12l7.9-2.6z"/></svg>';
const ICON = {
  tpl: '<svg viewBox="0 0 16 16"><rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="3" rx="1"/><rect x="2" y="9" width="5" height="5" rx="1"/><rect x="9" y="7" width="5" height="7" rx="1"/></svg>',
  prod: '<svg viewBox="0 0 16 16"><path d="M3 5.5h10l-.8 8H3.8z"/><path d="M5.5 5.5a2.5 2.5 0 015 0"/></svg>',
  prop: '<svg viewBox="0 0 16 16"><path d="M6 2.5h4v2.2a1.6 1.6 0 003.1.7l.7.7-2.6 2.6h-1.2V13H5.2V8.7H3.9L1.3 6.1l.7-.7a1.6 1.6 0 003.1-.7z"/></svg>',
};

export default {
  id: 'mokker-ai',
  label: 'Mokker AI (2023)',
  source: {
    platform: "Mokker Studio's web editor (mokker.ai, light theme, violet accent; the official Mokker YouTube channel, 'Learn how to Use Mokker Studio in 80 seconds', an app screen recording, 2023-10-23)",
    feature: "scene editor: breadcrumb 'Home / Living Room', a left rail (Templates | Products | Props) with '+ Upload Product Photo', a canvas with the product on a transparency checkerboard, the chips 'Modern Living Room' / 'Cold Light' with 'Write a custom prompt', a violet gradient 'Generate Photos' bar that swaps in place to a white circular spinner + 'Loading...' (no percentage, step text, timer or placeholder tile; the canvas stays un-backgrounded) and a right 'Results' rail; adapted to ten results landing in the rail in reading order",
    refs: [
      { url: 'https://www.youtube.com/watch?v=FHuG9-OOvyY', retrieved: '2026-10-14' },
    ],
    extrapolated: [
      'The footage shows the finished photograph replacing the editor full-bleed with < / > arrows; the ten results here land as ten tiles in the Results rail (a two-column grid), each hard-swapping over an earlier-render swatch, because the rail is the only place the footage shows renders at all.',
      "The footage shows 5 earlier renders in the rail and no pending tile; the ten slots are filled with flat scene-coloured swatches that stand in for earlier renders, and the bar returns to 'Generate Photos' once the tenth has landed (the footage never shows the bar after the result).",
      'The canvas product is our own meme cut out in an oval on the checkerboard (the footage shows a sofa, a fern and a lamp); it stays un-backgrounded for the whole beat, as in the footage.',
      "The footage's burned-in '6. GENERATE IMAGES' step label, its 'CHANGE THE MOOD' lower third and the account avatar are omitted.",
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'mokker-ai');
    const srcCv = ownSrc(ctx.src, 'mokker-ai-canvas');   // the picture shown at 124 x 168 on the checkerboard, a different decode size from the 46 x 31 rail tiles
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-old" style="background: ${OLD[i % OLD.length]}"></div></div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-top"><span>Home</span><i>/</i><b>Living Room</b></div><div class="${P}-body"><div class="${P}-rail"><div class="${P}-ri">${ICON.tpl}Templates</div><div class="${P}-ri ${P}-on">${ICON.prod}Products</div><div class="${P}-ri">${ICON.prop}Props</div></div><div class="${P}-pan"><div class="${P}-ph">Products<span>Close</span></div><div class="${P}-drop"><b class="${P}-up">+ Upload Product Photo</b>or drop a file</div><div class="${P}-th"><i></i><i></i></div><div class="${P}-none">No more items</div></div><div class="${P}-main"><div class="${P}-cv"><div class="${P}-cp"><img src="${srcCv}" width="870" height="1024" decoding="sync" alt="Uploaded product" style="transform-origin: ${tiles[0].origin}"/></div></div><div class="${P}-mood">${SPARK}<span class="${P}-a">Modern Living Room</span><span class="${P}-b">Cold Light</span><em>Write a custom prompt</em></div><div class="${P}-go">${SPARK}<i class="${P}-spin"></i><span>Generate Photos</span></div></div><div class="${P}-res"><div class="${P}-rh">Results<div class="${P}-tg"><i></i><i></i></div></div><div class="${P}-g">${tiles.map(cell).join('')}</div></div></div></div>`);
    const go = root.querySelector(`.${P}-go`), spark = go.querySelector('svg'), spin = go.querySelector(`.${P}-spin`), label = go.querySelector('span');
    const cvImg = root.querySelector(`.${P}-cp img`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), old: n.querySelector(`.${P}-old`), g: tiles[i] }));
    ctx.gate([cvImg, ...cells.map((c) => c.im)]);
    cvImg.style.filter = restFilter(tiles[0]);
    cvImg.style.transform = restTransform(tiles[0]);

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // the bar is pressed
        const gp = press(s, GEN_AT, 0.06, 0.06, 0.14);
        put('go', gp.toFixed(3), () => { go.style.transform = gp > 0 ? `scale(${(1 - 0.03 * gp).toFixed(4)})` : 'none'; });

        // the bar's content becomes a white circular spinner + 'Loading...' in place, until the tenth render has landed
        const busy = s >= ISSUE && s < LAND[9];
        put('lab', busy, (v) => { spark.style.display = v ? 'none' : ''; spin.style.display = v ? 'block' : 'none'; label.textContent = v ? 'Loading...' : 'Generate Photos'; });
        const deg = (((t * 540) % 360) + 360) % 360;
        put('spin', deg.toFixed(0), (d) => { spin.style.transform = `rotate(${d}deg)`; });

        // the renders land in the Results rail, a hard swap over the earlier-render swatch
        cells.forEach((c, i) => {
          put(`i${i}`, s >= LAND[i], (v) => { c.im.style.visibility = v ? '' : 'hidden'; c.old.style.display = v ? 'none' : ''; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
        });
      },
    };
  },
};
