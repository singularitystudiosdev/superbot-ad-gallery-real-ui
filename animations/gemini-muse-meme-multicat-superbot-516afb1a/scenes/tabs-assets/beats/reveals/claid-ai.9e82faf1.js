// Claid.ai's Studio, 'Studio - All Tools', light theme, the 2024 build (official Claid channel video 'How to Train Custom AI and Generate
// Fashion & Lifestyle Photos of Your Products', YouTube u9fWMY21Dwg, 2024-12-17, t~232.25-233.0 s, and 'How to write prompts for AI
// product photos', YouTube NBM9pLrfofQ, 2024-08-16, t~167-169.5 s; spec .tmp/clone-9e82faf1/reveal-refs/claid-ai/spec.json, confidence
// 0.52; frames ak_claid_t232.25, ak_claid_t232.5, ak_claid_t232.75, ak_claid_t233.0, ak_claid_promptvideo_t168.0). The breadcrumb 'Home /
// Studio - All Tools'; a lilac left card (the product set, the 'Prompt' textarea, a 'Prev / Prompt: ... / Next' stepper, the aspect chips
// 1:1 4:3 3:4 16:9 9:16 with 4:3 selected, 'Advanced settings' and a black fully rounded pill with a four-point star at each end); a large
// white canvas that rests on a dashed upload empty state; and a right 'Creations' rail ('Upload new image', 'Favourites only').
// Pressing the pill gives NO pending affordance at all: the canvas drops its empty state to a plain blank white field (no spinner, bar,
// percentage or text) and the generated photograph then paints in whole. This module draws exactly that: a white blank, then pictures.
// Adapted to ten images: the canvas becomes a 5 x 2 area of ten tiles that paint in, in strict reading order, over the blank white; the
// rail gains a new creation once the tenth has painted. Omitted: the wordmark and its 'by' line, the 'Tour' and 'API' buttons, the account
// avatar, the remaining-count suffix on the pill's label, the magenta strip at the canvas foot (a footage artefact) and the presenter's
// webcam bubble. The footage's pictures are never reproduced: the product set and sample products are plain swatches, every tile is our
// own meme (system type, no logo, no platform font).
import { press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-cla';
const ROOT_H = 392, LEFT_W = 150, RAIL_W = 100, TOP_H = 24, COLS = 5, GAP = 5;
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 10px; background: #f5f1fa; color: #1c1b22; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #e7e1f0; }
.${P}-top { flex: none; display: flex; align-items: center; gap: 4px; height: ${TOP_H}px; padding: 0 12px; font-size: 7.5px; color: #8e8a99; }
.${P}-top b { font-weight: 500; color: #1c1b22; }
.${P}-body { flex: 1; min-height: 0; display: flex; gap: 6px; padding: 0 6px 6px 6px; }
.${P}-left { flex: none; box-sizing: border-box; display: flex; flex-direction: column; width: ${LEFT_W}px; padding: 8px 8px 8px; border-radius: 10px; background: #edeaf7; }
.${P}-pj { font-size: 8px; font-weight: 700; line-height: 10px; }
.${P}-pj small { display: block; font-size: 6px; font-weight: 400; line-height: 8px; color: #6f6a82; }
.${P}-set { display: flex; gap: 4px; margin-top: 5px; }
.${P}-set i { flex: none; display: block; width: 24px; height: 24px; border-radius: 4px; background: #d9d6e6; }
.${P}-set i:nth-child(2) { background: #cfe0d6; }
.${P}-set i:nth-child(3) { background: #bdbdc9; }
.${P}-set i:nth-child(4) { background: #e2d4cf; }
.${P}-lb { margin-top: 7px; font-size: 6.5px; color: #8a8599; }
.${P}-ta { flex: none; box-sizing: border-box; margin-top: 3px; height: 118px; padding: 6px 7px; border-radius: 6px; background: #f6f4fb; font-size: 6.2px; line-height: 8.6px; color: #25232d; overflow: hidden; }
.${P}-step { display: flex; align-items: center; gap: 4px; margin-top: 4px; height: 10px; font-size: 5.4px; color: #3a3846; white-space: nowrap; }
.${P}-step em { flex: 1; min-width: 0; font-style: normal; text-align: center; overflow: hidden; text-overflow: ellipsis; }
.${P}-step span { color: #d6336c; }
.${P}-asp { display: flex; gap: 3px; margin-top: 3px; }
.${P}-asp span { flex: 1; display: grid; place-items: center; box-sizing: border-box; height: 14px; border-radius: 7px; background: #f6f4fb; font-size: 5.8px; color: #5a566a; }
.${P}-asp .${P}-on { background: #111111; color: #ffffff; }
.${P}-adv { display: flex; align-items: center; gap: 3px; margin-top: 7px; height: 12px; font-size: 6.5px; color: #3a3846; }
.${P}-adv svg { width: 7px; height: 7px; fill: none; stroke: #3a3846; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.${P}-go { margin-top: auto; flex: none; display: flex; align-items: center; justify-content: center; gap: 9px; height: 24px; border-radius: 12px; background: #111111; font-size: 8px; font-weight: 600; color: #ffffff; }
.${P}-go i { font-style: normal; font-size: 7px; }
.${P}-cv { position: relative; flex: 1; min-width: 0; border-radius: 10px; background: #ffffff; overflow: hidden; }
.${P}-es { position: absolute; inset: 7px; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; border: 1px dashed #d3d0dc; border-radius: 8px; padding-top: 30px; text-align: center; font-size: 6px; color: #9aa0a6; }
.${P}-es .${P}-ic { display: block; width: 18px; height: 15px; border-radius: 3px; background: #e9e8ee; margin-bottom: 9px; }
.${P}-es h6 { margin: 0; font-size: 9.5px; font-weight: 400; color: #1c1b22; }
.${P}-es h6 b { font-weight: 700; }
.${P}-es p { margin: 5px 0 0; font-size: 5.6px; }
.${P}-es .${P}-or { display: flex; align-items: center; gap: 6px; width: 78%; margin-top: 9px; }
.${P}-es .${P}-or::before, .${P}-es .${P}-or::after { content: ""; flex: 1; height: 1px; background: #e6e4ec; }
.${P}-es .${P}-pick { margin-top: 9px; font-size: 6.3px; color: #1c1b22; }
.${P}-es .${P}-smp { display: flex; gap: 5px; margin-top: 7px; }
.${P}-es .${P}-smp i { display: block; width: 36px; height: 40px; border-radius: 4px; background: #f3f2f6; }
.${P}-g { position: absolute; left: 8px; right: 8px; top: 50%; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; transform: translateY(-50%); }
.${P}-t { position: relative; aspect-ratio: 3 / 4; border-radius: 4px; overflow: hidden; background: #ffffff; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-rail { flex: none; box-sizing: border-box; display: flex; flex-direction: column; width: ${RAIL_W}px; padding: 8px 7px 0; border-radius: 10px; background: #ffffff; overflow: hidden; }
.${P}-rt { flex: none; height: 14px; font-size: 7.5px; font-weight: 600; line-height: 12px; box-shadow: 0 1.5px 0 #1c1b22; align-self: flex-start; }
.${P}-up { flex: none; display: grid; place-items: center; box-sizing: border-box; margin-top: 7px; height: 18px; border-radius: 5px; background: #ffffff; box-shadow: inset 0 0 0 1px #e6e4ec; font-size: 6.3px; color: #1c1b22; }
.${P}-fav { flex: none; display: flex; align-items: center; gap: 4px; margin-top: 6px; height: 10px; font-size: 6.3px; color: #3a3846; }
.${P}-fav i { display: block; width: 15px; height: 8px; border-radius: 4px; background: #e6e4ec; }
.${P}-cr { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-top: 7px; }
.${P}-cr i { display: block; aspect-ratio: 4 / 3; border-radius: 4px; background: #e9e5df; }
.${P}-cr i:nth-child(3n + 2) { background: #dfe6dc; }
.${P}-cr i:nth-child(3n) { background: #e3dde6; }
.${P}-cr i.${P}-new { background: #d9d4e6; box-shadow: 0 0 0 1px #111111; }
`;

const PROMPT = 'Inside a bright lecture hall, a muse raises a handwritten note above her desk. Soft window light falls across the rows of seats, and the mood is playful, warm and clean. The composition is focused on the note and the smile.';
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const GEN_AT = 0.06;                              // the cursor presses the pill
const ISSUE = 0.16;                               // the canvas drops its empty state to plain white (nothing else changes)
const LAND = Array.from({ length: 10 }, (_, i) => 0.4 + i * 0.1425);   // picture i paints in (reading order), the last at 1.68

export default {
  id: 'claid-ai',
  label: 'Claid.ai Studio (2024)',
  source: {
    platform: "Claid.ai's Studio, 'Studio - All Tools' (claid.ai, light theme; the official Claid YouTube channel, desktop screen recordings with a presenter webcam bubble, 2024-12-17 and 2024-08-16)",
    feature: "studio editor: breadcrumb 'Home / Studio - All Tools', a lilac left card (the prompt, 'Prev / Prompt: ... / Next', the aspect chips 1:1 4:3 3:4 16:9 9:16, 'Advanced settings', a black star-flanked 'Generate' pill), a white canvas on a dashed upload empty state, a right 'Creations' rail ('Upload new image', 'Favourites only'); pressing the pill shows no spinner, bar, percentage or text, only the canvas going to plain white before the picture paints in whole; adapted to ten tiles painting in over the white in reading order",
    refs: [
      { url: 'https://www.youtube.com/watch?v=u9fWMY21Dwg', retrieved: '2026-10-14' },
      { url: 'https://www.youtube.com/watch?v=NBM9pLrfofQ', retrieved: '2026-10-14' },
    ],
    extrapolated: [
      'The footage shows ONE generated photograph painting in whole over a plain blank white canvas; the ten tiles here are a 5 x 2 area on that white, each painting in (a hard swap) in strict reading order, because the beat is a ten-image reveal.',
      'The blank-white interval is 0.16 to 0.4 layout seconds (the footage brackets it at about 0.1 to 0.4 s with an 8 fps scan); whether the white canvas is the real in-flight state or a video-edit artefact is not settled in the spec (confidence 0.52).',
      "The pill never changes label, as in the footage; the right rail gaining a new creation after the tenth picture is extrapolated (the footage says only that it 'updates with the new result').",
      "The product set, the four sample products and the creation thumbnails are plain swatches (the footage's pictures are not reproduced), and the prompt text is ours.",
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'claid-ai');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/></div>`;
    const chev = '<svg viewBox="0 0 12 12"><path d="M2.5 4.5l3.5 3.5 3.5-3.5"/></svg>';
    const root = x.el(`<div class="${P}"><div class="${P}-top"><span>Home</span><span>/</span><b>Studio - All Tools</b></div><div class="${P}-body"><div class="${P}-left"><div class="${P}-pj">Muse tote<small>black tote</small></div><div class="${P}-set"><i></i><i></i><i></i><i></i></div><div class="${P}-lb">Prompt</div><div class="${P}-ta">${x.esc(PROMPT)}</div><div class="${P}-step"><span>&lt; Prev</span><em>Prompt: Contemporary Workspace</em><span>Next &gt;</span></div><div class="${P}-lb">Aspect ratio</div><div class="${P}-asp"><span>1:1</span><span class="${P}-on">4:3</span><span>3:4</span><span>16:9</span><span>9:16</span></div><div class="${P}-adv">Advanced settings${chev}</div><div class="${P}-go"><i>✦</i>Generate<i>✦</i></div></div><div class="${P}-cv"><div class="${P}-es"><i class="${P}-ic"></i><h6><b>Click to upload</b> or drag and drop</h6><p>Supported formats: JPG, PNG, WEBP or HEIC (max. 10MB).</p><div class="${P}-or">or</div><div class="${P}-pick">choose product image from assets</div><div class="${P}-smp"><i></i><i></i><i></i><i></i></div></div><div class="${P}-g" style="visibility: hidden">${tiles.map(cell).join('')}</div></div><div class="${P}-rail"><div class="${P}-rt">Creations</div><div class="${P}-up">Upload new image</div><div class="${P}-fav"><i></i>Favourites only</div><div class="${P}-cr"><i class="${P}-new" style="display: none"></i><i></i><i></i><i></i><i></i><i></i><i></i></div></div></div></div>`);
    const go = root.querySelector(`.${P}-go`), es = root.querySelector(`.${P}-es`), grid = root.querySelector(`.${P}-g`), fresh = root.querySelector(`.${P}-cr i.${P}-new`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // the pill is pressed (it never changes label)
        const gp = press(s, GEN_AT, 0.06, 0.06, 0.14);
        put('go', gp.toFixed(3), () => { go.style.transform = gp > 0 ? `scale(${(1 - 0.04 * gp).toFixed(4)})` : 'none'; });

        // the canvas blanks to plain white: no spinner, bar, percentage or text
        put('iss', s >= ISSUE, (v) => { es.style.display = v ? 'none' : ''; grid.style.visibility = v ? '' : 'hidden'; });

        // the pictures paint in, whole, in reading order
        cells.forEach((c, i) => {
          put(`i${i}`, s >= LAND[i], (v) => { c.im.style.visibility = v ? '' : 'hidden'; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
        });

        // the new creation is filed in the rail once the tenth has painted
        put('his', s >= LAND[9], (v) => { fresh.style.display = v ? '' : 'none'; });
      },
    };
  },
};
