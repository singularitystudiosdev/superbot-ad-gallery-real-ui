// 123RF's AI Image Generator (123rf.com, dark theme; a 2023-11-12 tutorial screen recording on YouTube, WF-reLyIDng, t~240.07-241.60 s;
// spec .tmp/clone-9e82faf1/reveal-refs/123rf-ai/spec.json, confidence 0.58; frames ag2_02_modal_pending / ag2_03_modal_zoom /
// ag2_04_spinner_strip / ag2_05_app_pending_tile / ag2_06_tile_strip / ag2_07_app_result / ag2_08_modal_strip). Submitting the prompt dims
// the page to black and centres a white card, an image panel on its left and, on its right, a gold arc spinner turning once every ~0.9 s
// over the heading 'Your image is generating.'; the page then hard-cuts to the dark in-app view ('123RF AI Generator > Generated Images'):
// flat #313131 rounded tiles (no spinner, caption or shimmer) with a gold download badge pinned bottom-right, a prompt box over the chips
// SDXL / Wide (16:9) / Enhance / Cool tone / Wide angle and a gold 'Generate' button, and a 'Prompt settings' column at the right. A tile's
// picture is painted in at once, first letterboxed inside the tile and then filling it.
// Adapted to ten images: the card (our own meme in its image panel, never the stock photo), then ten square tiles in a 5 x 2 block painting
// in one at a time in strict reading order, each letterboxed for a moment and then filling its tile. Kept from the footage's upsell card
// only its non-commercial parts (the dimmed page, the card, the image panel, the spinner, the heading); the rest of the card's copy and
// buttons are dropped, as are the nav's brand mark and account controls and every plan or quota line. The footage's pictures are never reproduced: system type only.
import { seg } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-123';
const ROOT_H = 400, COLS = 5, GAP = 6, PANEL_W = 132;
const CSS = `
.${P} { box-sizing: border-box; position: relative; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 12px; background: #1f1f1f; color: #e6e6e6; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #2c2c2c; }
.${P}-top { flex: none; display: flex; align-items: center; height: 26px; padding: 0 12px; font-size: 6.6px; color: #c9c9c9; white-space: nowrap; }
.${P}-top b { font-weight: 700; color: #f2f2f2; }
.${P}-top i { font-style: normal; margin: 0 4px; color: #8a8a8a; }
.${P}-body { flex: 1; min-height: 0; display: flex; }
.${P}-cv { flex: 1; min-width: 0; display: flex; flex-direction: column; background: #000000; }
.${P}-gw { flex: 1; min-height: 0; display: grid; align-items: center; padding: 0 14px; }
.${P}-grid { display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; }
.${P}-tile { position: relative; aspect-ratio: 1; border-radius: 6px; overflow: hidden; background: #313131; }
.${P}-tile img { position: absolute; left: 0; right: 0; display: block; width: 100%; object-fit: cover; }
.${P}-dl { position: absolute; right: 4px; bottom: 4px; z-index: 2; display: grid; place-items: center; width: 13px; height: 13px; border-radius: 3px; background: #ffd74a; }
.${P}-dl svg { display: block; width: 8px; height: 8px; fill: none; stroke: #1f1f1f; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
.${P}-comp { flex: none; box-sizing: border-box; margin: 0 10px 10px; padding: 8px; border-radius: 8px; background: #1f1f1f; }
.${P}-ta { box-sizing: border-box; height: 50px; padding: 6px 8px; border-radius: 5px; background: #1f1f1f; box-shadow: inset 0 0 0 1px #3f3f3f; font-size: 7.2px; line-height: 10px; color: #f0f0f0; overflow: hidden; }
.${P}-cr { display: flex; align-items: center; justify-content: space-between; margin-top: 8px; height: 20px; }
.${P}-chips { display: flex; gap: 4px; }
.${P}-chips span { display: flex; align-items: center; gap: 3px; box-sizing: border-box; height: 15px; padding: 0 6px; border-radius: 8px; box-shadow: inset 0 0 0 1px #555555; font-size: 6.2px; color: #ececec; white-space: nowrap; }
.${P}-chips svg { display: block; width: 4.5px; height: 4.5px; stroke: #d8d8d8; stroke-width: 1.4; stroke-linecap: round; fill: none; }
.${P}-go { flex: none; display: grid; place-items: center; width: 56px; height: 20px; border-radius: 10px; background: #ffd74a; color: #1f1f1f; font-size: 7px; font-weight: 700; }
.${P}-side { flex: none; box-sizing: border-box; width: ${PANEL_W}px; padding: 8px 8px 0; background: #1f1f1f; }
.${P}-sh { display: flex; align-items: center; justify-content: space-between; height: 20px; padding: 0 2px; font-size: 6.8px; font-weight: 700; color: #f0f0f0; white-space: nowrap; }
.${P}-sh svg { display: block; width: 7px; height: 7px; stroke: #bdbdbd; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; fill: none; }
.${P}-sr { display: flex; align-items: center; gap: 6px; box-sizing: border-box; height: 26px; margin-top: 4px; padding: 0 6px; border-radius: 4px; background: #262626; font-size: 7px; color: #e8e8e8; white-space: nowrap; }
.${P}-sr i { flex: none; display: block; width: 8px; height: 8px; border-radius: 2px; box-shadow: inset 0 0 0 1.3px #bdbdbd; }
.${P}-sr svg { margin-left: auto; display: block; width: 7px; height: 7px; stroke: #bdbdbd; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; fill: none; }
.${P}-modal { position: absolute; inset: 0; z-index: 3; display: grid; place-items: center; background: #000000; }
.${P}-card { display: flex; box-sizing: border-box; width: 380px; height: 188px; border-radius: 12px; background: #fdfdfd; overflow: hidden; }
.${P}-cimg { flex: none; position: relative; width: 142px; height: 188px; background: #1b2230; }
.${P}-cimg img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-ctx { flex: 1; min-width: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 18px; padding: 0 14px; }
.${P}-spin { display: block; width: 24px; height: 24px; }
.${P}-arc { display: block; width: 24px; height: 24px; fill: none; stroke: #f0db6e; stroke-width: 3.2; stroke-linecap: round; stroke-dasharray: 36 21; }
.${P}-ttl { margin: 0; font-size: 12px; font-weight: 700; line-height: 16px; color: #1f1f1f; text-align: center; }
`;

const PROMPT = 'A muse holding a handwritten note, meme style, bold bright colours';
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const CUT = 0.5;                                  // the card gives way to the in-app view (a hard cut)
const LB = 0.07;                                  // a painted-in picture sits letterboxed this long, then fills its tile
const LAND = Array.from({ length: 10 }, (_, i) => 0.62 + i * 0.1178);   // tile i is painted in (reading order), the last at 1.68
const ARC_DEG = 400;                              // the card's gold arc: one turn per 0.9 s of t
const BAND = 24;                                  // the letterbox band: percent of the tile's height kept clear above and below

const CHIPS = ['SDXL', 'Wide (16:9)', 'Enhance', 'Cool tone', 'Wide angle'];
const SIDE = ['Model', 'Ratio', 'Style', 'Color and tone', 'Lighting', 'Composition'];
const X = '<svg viewBox="0 0 6 6"><path d="M1 1l4 4M5 1L1 5"/></svg>';
const CARET = '<svg viewBox="0 0 8 8"><path d="M1.5 3l2.5 2.5L6.5 3"/></svg>';
const DL = '<svg viewBox="0 0 10 10"><path d="M5 1.5v5M2.8 4.6L5 6.8l2.2-2.2M2 8.6h6"/></svg>';

export default {
  id: '123rf-ai',
  label: '123RF AI Image Generator (2023)',
  source: {
    platform: "123RF AI Image Generator (123rf.com, desktop browser, dark theme; a tutorial screen recording on YouTube, 2023-11-12)",
    feature: "after the prompt is submitted the page is dimmed to black and a white card with an image panel on its left shows a rotating gold arc spinner over 'Your image is generating.'; the page hard-cuts to the dark in-app view ('123RF AI Generator > Generated Images'): flat #313131 rounded tiles with a gold download badge bottom-right, a prompt box over the chips SDXL / Wide (16:9) / Enhance / Cool tone / Wide angle and a gold 'Generate' button; each picture is painted into its tile at once, first letterboxed inside it and then filling it (adapted to 10: a 5 + 5 block painting in strict reading order; the commercial parts of the card, the brand mark and the nav's account controls are omitted)",
    refs: [{ url: 'https://www.youtube.com/watch?v=WF-reLyIDng', published: '2023-11-12', retrieved: '2026-10-14' }],
    extrapolated: ['ten tiles in a 5 x 2 block (the footage shows one large tile and three rail thumbnails)', 'the strict one-after-another painting-in over the whole beat (the footage shows a single tile painting in)', 'the picture in the card’s image panel (the footage shows a stock photo, never reproduced)', 'the length of the card and of the empty-tile pause, which the footage’s editorial cuts hide', 'the letterbox band geometry'],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, '123rf-ai');
    const srcCard = ownSrc(ctx.src, '123rf-ai-card');
    // the badge sits BEFORE the picture so the picture is the tile's last child
    const cell = (g, i) => `<div class="${P}-tile"><span class="${P}-dl">${DL}</span><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; top: ${BAND}%; height: ${100 - 2 * BAND}%; transform-origin: ${g.origin}"/></div>`;
    const chips = CHIPS.map((c) => `<span>${c}${X}</span>`).join('');
    const side = SIDE.map((n) => `<div class="${P}-sr"><i></i>${n}${CARET}</div>`).join('');
    const arc = `<svg class="${P}-arc" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9.5"/></svg>`;
    const root = x.el(`<div class="${P}"><div class="${P}-top"><b>123RF AI Generator</b><i>&gt;</i><b>Generated Images</b></div><div class="${P}-body"><div class="${P}-cv"><div class="${P}-gw"><div class="${P}-grid">${tiles.map(cell).join('')}</div></div><div class="${P}-comp"><div class="${P}-ta">${x.esc(PROMPT)}</div><div class="${P}-cr"><div class="${P}-chips">${chips}</div><div class="${P}-go">Generate</div></div></div></div><div class="${P}-side"><div class="${P}-sh">Prompt settings${CARET}</div>${side}</div></div><div class="${P}-modal"><div class="${P}-card"><div class="${P}-cimg"><img src="${srcCard}" width="870" height="1024" decoding="sync" alt="Preview" style="transform-origin: ${tiles[0].origin}"/></div><div class="${P}-ctx"><span class="${P}-spin">${arc}</span><h3 class="${P}-ttl">Your image is generating.</h3></div></div></div></div>`);
    const modal = root.querySelector(`.${P}-modal`), arcEl = root.querySelector(`.${P}-arc`), card = root.querySelector(`.${P}-cimg img`);
    const cells = [...root.querySelectorAll(`.${P}-tile`)].map((n, i) => ({ im: n.querySelector('img'), g: tiles[i] }));
    ctx.gate([card, ...cells.map((c) => c.im)]);
    // each picture rests at its crop's own CSS (set once; render never touches it)
    cells.forEach((c) => { c.im.style.filter = restFilter(c.g); c.im.style.transform = restTransform(c.g); });
    card.style.filter = restFilter(tiles[0]);
    card.style.transform = restTransform(tiles[0]);

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // the dimmed card with its spinner, then the hard cut to the in-app view
        put('modal', s < CUT, (v) => { modal.style.visibility = v ? 'visible' : 'hidden'; });
        // the gold arc turns with t alone, shown or not
        const deg = (((t * ARC_DEG) % 360) + 360) % 360;
        put('deg', deg.toFixed(0), (d) => { arcEl.style.transform = `rotate(${d}deg)`; });

        // each tile: flat grey, then its picture painted in letterboxed, then filling the tile; strictly in reading order
        cells.forEach((c, i) => {
          const st = s >= LAND[i] + LB ? 2 : s >= LAND[i] ? 1 : 0;
          put(`l${i}`, st, (v) => {
            c.im.style.visibility = v ? '' : 'hidden';
            c.im.style.top = v === 2 ? '0%' : `${BAND}%`;
            c.im.style.height = v === 2 ? '100%' : `${100 - 2 * BAND}%`;
          });
        });
      },
    };
  },
};
