// Windows Paint, the 'Image Creator' side pane (text-prompt AI pane, Windows 11 24H2 dark theme). Primary footage: YouTube
// dxebbWjLFwk (2024-08-25, 1152x720 screen recording: the pane titled 'Image Creator' with a yellow 'PREVIEW' tag, the prompt
// field, the nine-preset 'Choose a style' picker, the three 'Explore variants' thumbnails, the yellow boost badge at 49, the
// light-blue 'Create'); the WAIT state comes from an earlier build of the same pane, YouTube gdvMxxJafKc (2023-10-09, the
// 'Cocreator (PREVIEW)' incarnation): on Create the 'Explore variants' strip clears to one flat empty plate with a small
// indeterminate accent sliver looping in it, 'Create' goes disabled, the boost badge ticks 50 -> 49, and the variants land
// together ~16 s later. Spec .tmp/clone-9e82faf1/reveal-refs/paint-image-creator/spec.json (confidence 0.55), frames ar_pic_80,
// ar_pic_100, ar_pic_105, ar_pic_108, ar_pic_112, ar_pic2023_60..76.
// The pane is a flat dark panel docked on the right of the Paint window; the window keeps its ribbon (Selection, Image, Tools,
// Brushes, Shapes, Colours, 'Image Creator', 'Layers') and its status bar (canvas size, zoom). Pressing Create swaps the strip
// for the empty plate with the sliver; there is no text, percentage, spinner glyph or shimmer. The variants then land and the
// first one is placed on the canvas as a selection with a dashed outline and handles, as clicking a variant does in the footage.
// Adapted to ten images: a five-by-two strip of square variants (the footage shows three in one row) landing strictly in reading
// order, the first also landing on the canvas. Omitted: the Windows and Microsoft logos, the account avatar, the taskbar, and any
// 'Get more boosts' or purchase link; the boost badge is only the counter. The footage's pictures are never reproduced: every
// tile is our own meme, and the preset thumbnails are plain tinted squares.
import { seg, press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-pic';
const ROOT_H = 410, PANE_W = 232, COLS = 5;
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 8px; background: #1b1b1b; color: #f2f2f2; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #3a3a3a; }
.${P}-tb { flex: none; display: flex; align-items: center; height: 18px; padding: 0 0 0 8px; font-size: 7px; color: #e8e8e8; background: #1f1f1f; }
.${P}-tb b { flex: 1; font-weight: 400; }
.${P}-tb i { display: block; width: 20px; height: 18px; position: relative; }
.${P}-tb i::before { content: ""; position: absolute; left: 7px; top: 8px; width: 6px; height: 1px; background: #d8d8d8; }
.${P}-tb i.${P}-sq::before { top: 6px; height: 5px; width: 5px; background: none; box-shadow: inset 0 0 0 1px #d8d8d8; }
.${P}-tb i.${P}-x::before { left: 6px; top: 5px; width: 8px; height: 8px; background: linear-gradient(45deg, transparent 45%, #d8d8d8 45%, #d8d8d8 55%, transparent 55%), linear-gradient(-45deg, transparent 45%, #d8d8d8 45%, #d8d8d8 55%, transparent 55%); }
.${P}-menu { flex: none; display: flex; gap: 14px; align-items: center; height: 18px; padding: 0 10px; font-size: 7.5px; color: #ededed; background: #1f1f1f; }
.${P}-rib { flex: none; display: flex; align-items: stretch; height: 46px; padding: 3px 6px 0; background: #202020; box-shadow: 0 1px 0 #2e2e2e; }
.${P}-grp { position: relative; flex: none; box-sizing: border-box; display: flex; align-items: center; gap: 4px; height: 100%; padding: 0 7px 9px; }
.${P}-grp + .${P}-grp { box-shadow: -1px 0 0 #2f2f2f; }
.${P}-grp u { position: absolute; left: 0; right: 0; bottom: 0; text-align: center; text-decoration: none; font-size: 5.5px; line-height: 9px; color: #c4c4c4; white-space: nowrap; }
.${P}-ic { flex: none; display: block; width: 11px; height: 11px; border-radius: 2px; background: #8d8d8d; }
.${P}-ic.${P}-ic2 { background: none; box-shadow: inset 0 0 0 1.3px #9a9a9a; }
.${P}-ic.${P}-ic3 { background: #5fa8d3; border-radius: 50%; }
.${P}-ic.${P}-ic4 { background: #b5b5b5; width: 8px; }
.${P}-big { width: 15px; height: 15px; border-radius: 3px; box-shadow: inset 0 0 0 1.3px #bdbdbd; background: none; }
.${P}-dots { display: grid; grid-template-columns: repeat(10, 6px); gap: 2px 2.5px; }
.${P}-dots i { display: block; width: 6px; height: 6px; border-radius: 50%; }
.${P}-btn { position: relative; flex: none; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; box-sizing: border-box; width: 44px; height: 100%; padding-top: 5px; border-radius: 4px; }
.${P}-btn u { position: absolute; left: 0; right: 0; bottom: 0; text-align: center; text-decoration: none; font-size: 5.5px; line-height: 9px; color: #c4c4c4; }
.${P}-btn.${P}-sel { background: #2b2b2b; box-shadow: inset 0 0 0 1px #5a5a5a; }
.${P}-body { flex: 1; min-height: 0; display: flex; background: #161616; }
.${P}-area { position: relative; flex: 1; min-width: 0; }
.${P}-cv { position: absolute; left: 14px; right: 14px; top: 50%; aspect-ratio: 1839 / 1002; transform: translateY(-58%); background: #ffffff; }
.${P}-cv > img { position: absolute; top: 0; bottom: 0; left: 22.76%; width: 54.49%; height: 100%; display: block; object-fit: cover; outline: 1px dashed #ffffff; outline-offset: 0; box-shadow: 0 0 0 1px #4a4a4a; }
.${P}-hd { position: absolute; width: 4px; height: 4px; margin: -2px 0 0 -2px; background: #ffffff; box-shadow: 0 0 0 .6px #5d5d5d; }
.${P}-pane { flex: none; box-sizing: border-box; display: flex; flex-direction: column; width: ${PANE_W}px; padding: 8px 10px 0; background: #272727; box-shadow: -1px 0 0 #333; }
.${P}-ttl { flex: none; display: flex; align-items: center; gap: 5px; height: 16px; font-size: 11px; font-weight: 600; color: #ffffff; }
.${P}-ttl em { font-style: normal; font-size: 5.5px; font-weight: 700; letter-spacing: .2px; line-height: 9px; padding: 0 4px; border-radius: 5px; background: #fcd116; color: #1c1c1c; }
.${P}-lb { flex: none; display: flex; align-items: center; justify-content: space-between; margin-top: 7px; height: 11px; font-size: 7.5px; font-weight: 600; color: #f4f4f4; }
.${P}-lb s { text-decoration: none; display: block; width: 7px; height: 7px; border-radius: 50%; box-shadow: inset 0 0 0 1px #bdbdbd; }
.${P}-in { flex: none; box-sizing: border-box; margin-top: 3px; height: 34px; padding: 5px 7px; border-radius: 4px; background: #2d2d2d; box-shadow: inset 0 0 0 1px #464646, inset 0 -1px 0 #9a9a9a; font-size: 7.5px; line-height: 10px; color: #f0f0f0; overflow: hidden; }
.${P}-styles { flex: none; display: grid; grid-template-columns: repeat(3, 1fr); gap: 3px; margin-top: 3px; }
.${P}-st { position: relative; box-sizing: border-box; display: flex; align-items: flex-end; justify-content: center; height: 15px; padding-bottom: 2px; border-radius: 3px; background: linear-gradient(180deg, #3d3d3d, #333); font-size: 6.3px; line-height: 8px; color: #e9e9e9; white-space: nowrap; overflow: hidden; }
.${P}-st.${P}-on { box-shadow: inset 0 0 0 1px #60cdff; background: linear-gradient(180deg, #3a4a54, #2f3b43); }
.${P}-strip { position: relative; flex: none; box-sizing: border-box; margin-top: 3px; padding: 4px; border-radius: 5px; background: #303030; overflow: hidden; }
.${P}-lane { position: absolute; left: 4px; right: 4px; top: 50%; height: 3px; margin-top: -1.5px; overflow: hidden; }
.${P}-sl { position: absolute; top: 0; bottom: 0; width: 26px; border-radius: 2px; background: #4cc2ff; }
.${P}-g { position: relative; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: 4px; }
.${P}-t { position: relative; aspect-ratio: 1; border-radius: 3px; overflow: hidden; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-t::after { content: ""; position: absolute; inset: 0; border-radius: 3px; box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .22); }
.${P}-bot { flex: none; display: flex; align-items: center; justify-content: space-between; margin-top: auto; height: 36px; box-shadow: 0 -1px 0 #3a3a3a; }
.${P}-bst { display: flex; align-items: center; gap: 3px; font-size: 7.5px; color: #f0f0f0; }
.${P}-bst i { display: block; width: 8px; height: 8px; border-radius: 50%; background: radial-gradient(circle at 40% 35%, #ffe27a, #f0b400); box-shadow: 0 0 0 1px #6a5200; }
.${P}-go { display: grid; place-items: center; box-sizing: border-box; width: 92px; height: 20px; border-radius: 3px; font-size: 8px; font-weight: 600; }
.${P}-go.${P}-ok { background: #60cdff; color: #06202e; }
.${P}-go.${P}-off { background: #3a3a3a; color: #8a8a8a; }
.${P}-sbar { flex: none; display: flex; align-items: center; gap: 16px; height: 16px; padding: 0 10px; background: #1f1f1f; font-size: 6.5px; color: #d2d2d2; }
.${P}-sbar span:last-child { margin-left: auto; }
.${P}-zm { display: block; width: 46px; height: 2px; border-radius: 1px; background: #666; position: relative; }
.${P}-zm::after { content: ""; position: absolute; left: 0; top: -2.5px; width: 7px; height: 7px; border-radius: 50%; background: #60cdff; }
`;

const PROMPT = 'A muse at a lectern holding a handwritten note, meme style, bright colours';
const STYLES = ['No Selection', 'Charcoal', 'Ink Sketch', 'Watercolor', 'Oil Painting', 'Digital Art', 'Photorealistic', 'Anime', 'Pixel Art'];
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const GO_AT = 0.06;                               // the cursor presses Create
const ISSUE = 0.16;                               // the strip is an empty plate with the sliver, Create goes disabled, the boost ticks 50 -> 49
const LAND = Array.from({ length: 10 }, (_, i) => 0.4 + i * 0.1425);   // variant i lands (reading order), the last at 1.68
const SWEEP = 1.15;                               // one pass of the sliver across the plate, real seconds
const SW = 26;                                    // the sliver's width in px
const SWATCH = ['#000', '#7f7f7f', '#c42b1c', '#e5322d', '#f7630c', '#fce100', '#13a10e', '#0f9fe0', '#2d62d4', '#a455c7', '#fff', '#bdbdbd', '#a97753', '#f4a7c0', '#f9b200', '#e2d898', '#8ed03a', '#8bd7f2', '#7a9bc9', '#b7a9ea'];

export default {
  id: 'paint-image-creator',
  label: 'Paint Image Creator (2024)',
  source: {
    platform: "Windows 11 Paint (24H2 dark theme), the 'Image Creator' pane docked on the right of the window (a desktop screen recording on YouTube, 2024-08-25; the wait state from the same pane's earlier 'Cocreator (PREVIEW)' build, a screen recording on YouTube, 2023-10-09)",
    feature: "flat #272727 pane with the title 'Image Creator' and a yellow PREVIEW tag, the label 'Describe what you'd like to create' over a prompt field, 'Choose a style' with the nine presets (No Selection, Charcoal, Ink Sketch, Watercolor, Oil Painting, Digital Art, Photorealistic, Anime, Pixel Art), 'Explore variants', a yellow star boost badge and a light-blue 'Create'; pressing Create clears the variants strip to one flat empty plate with a small accent-coloured indeterminate sliver looping in it, disables Create and ticks the boost 50 -> 49, with no text, percentage, spinner glyph or shimmer; the variants then land and the first is placed on the canvas as a selection (adapted to 10: a 5 x 2 strip landing in strict reading order; the Windows and Microsoft logos and any boosts purchase link are omitted)",
    refs: [
      { url: 'https://www.youtube.com/watch?v=dxebbWjLFwk', video: 'dxebbWjLFwk', published: '2024-08-25', retrieved: '2026-10-14' },
      { url: 'https://www.youtube.com/watch?v=gdvMxxJafKc', video: 'gdvMxxJafKc', published: '2023-10-09', retrieved: '2026-10-14' },
      { url: 'https://support.microsoft.com/en-us/windows/ai/ai-apps/use-image-creator-in-paint-to-generate-ai-art', retrieved: '2026-10-14' },
    ],
    extrapolated: [
      "two builds of the same pane are combined on purpose: the static surface (title 'Image Creator' + PREVIEW, the nine style presets, the boost badge at 49, the light-blue Create, dark theme) follows the 2024-08 Paint 24H2 clip, the wait (empty plate, indeterminate sliver, Create disabled, boost 50 -> 49) follows the 2023-10 clip, whose accent was purple; the sliver is drawn in the 2024 build's light-blue accent (#4CC2FF), which the 2024 clip never shows in motion (confidence 0.55)",
      "ten variants in strict reading order (10, extrapolated): the footage shows three variants landing together between two sampled frames, with no per-tile stagger; here they land one at a time at an even step across the beat's window, the first also placed on the canvas",
      "the footage's wait is ~16 s (2023); the click, the plate and the ten landings are compressed into the beat's window",
      "the sliver sweeps left to right across the strip in a 1.15 s cycle from t (the 2023 clip's period was not measured) and clears at the last landing",
      "the style picker is drawn as an always-visible 3 x 3 grid of the nine presets (the footage shows them in a flyout opened from a one-row dropdown), with plain tinted tiles instead of the preset thumbnails; 'No Selection' is chosen, and the prompt is our own",
      "the status bar keeps the canvas size and a zoom slider but drops the footage's '100%' zoom readout, so no percentage sign appears anywhere in the block",
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'paint-image-creator');
    const srcCv = ownSrc(ctx.src, 'paint-image-creator-canvas');   // the picture placed on the canvas, a different decode size from the 40 px strip tiles
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/></div>`;
    const grp = (inner, name, w) => `<div class="${P}-grp" style="width: ${w}px">${inner}<u>${name}</u></div>`;
    const handles = [[0, 0], [50, 0], [100, 0], [0, 50], [100, 50], [0, 100], [50, 100], [100, 100]].map(([l, tp]) => `<span class="${P}-hd" style="left: ${l}%; top: ${tp}%"></span>`).join('');
    const root = x.el(`<div class="${P}"><div class="${P}-tb"><b>Untitled - Paint</b><i></i><i class="${P}-sq"></i><i class="${P}-x"></i></div><div class="${P}-menu"><span>File</span><span>Edit</span><span>View</span></div><div class="${P}-rib">${grp(`<i class="${P}-ic ${P}-big"></i>`, 'Selection', 40)}${grp(`<i class="${P}-ic"></i><i class="${P}-ic ${P}-ic2"></i>`, 'Image', 48)}${grp(`<i class="${P}-ic ${P}-ic4"></i><i class="${P}-ic ${P}-ic3"></i>`, 'Tools', 46)}${grp(`<i class="${P}-ic ${P}-ic2"></i>`, 'Brushes', 38)}${grp(`<i class="${P}-ic ${P}-ic2"></i><i class="${P}-ic ${P}-ic2"></i><i class="${P}-ic ${P}-ic2"></i>`, 'Shapes', 56)}${grp(`<div class="${P}-dots">${SWATCH.map((c) => `<i style="background: ${c}"></i>`).join('')}</div>`, 'Colours', 90)}<div style="flex: 1"></div><div class="${P}-btn ${P}-sel"><i class="${P}-ic ${P}-ic2"></i><u>Image Creator</u></div><div class="${P}-btn"><i class="${P}-ic ${P}-ic2"></i><u>Layers</u></div></div><div class="${P}-body"><div class="${P}-area"><div class="${P}-cv"><img src="${srcCv}" width="870" height="1024" decoding="sync" alt="Placed variant on the canvas" style="visibility: hidden; transform-origin: ${tiles[0].origin}"/><div class="${P}-sh" style="visibility: hidden">${handles}</div></div></div><div class="${P}-pane"><div class="${P}-ttl">Image Creator<em>PREVIEW</em></div><div class="${P}-lb">Describe what you'd like to create<s></s></div><div class="${P}-in">${x.esc(PROMPT)}</div><div class="${P}-lb">Choose a style</div><div class="${P}-styles">${STYLES.map((n, i) => `<div class="${P}-st${i === 0 ? ` ${P}-on` : ''}">${n}</div>`).join('')}</div><div class="${P}-lb">Explore variants</div><div class="${P}-strip"><div class="${P}-lane" style="visibility: hidden"><i class="${P}-sl"></i></div><div class="${P}-g">${tiles.map(cell).join('')}</div></div><div class="${P}-bot"><div class="${P}-bst"><i></i><span class="${P}-bn">50</span></div><div class="${P}-go ${P}-ok">Create</div></div></div></div><div class="${P}-sbar"><span>1839 × 1002px</span><span><i class="${P}-zm"></i></span></div></div>`);
    const q = (s) => root.querySelector(s);
    const go = q(`.${P}-go`), bn = q(`.${P}-bn`), lane = q(`.${P}-lane`), sl = q(`.${P}-sl`), cvIm = q(`.${P}-cv > img`), sh = q(`.${P}-sh`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), g: tiles[i] }));
    // the selection frame is the image box itself: handles sit on the same square as the picture
    sh.style.cssText = 'position: absolute; top: 0; left: 22.76%; width: 54.49%; height: 100%; visibility: hidden;';
    ctx.gate([cvIm, ...cells.map((c) => c.im)]);
    cvIm.style.filter = restFilter(tiles[0]);
    cvIm.style.transform = restTransform(tiles[0]);

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // Create: enabled, pressed, disabled while the run is in flight, enabled again once the last variant has landed
        const pending = s >= ISSUE && s < LAND[9];
        put('go', pending, (v) => { go.className = `${P}-go ${P}-${v ? 'off' : 'ok'}`; });
        const gp = press(s, GO_AT, 0.06, 0.06, 0.14);
        put('gp', gp.toFixed(3), () => { go.style.transform = gp > 0 ? `scale(${(1 - 0.05 * gp).toFixed(4)})` : 'none'; });

        // the quota counter ticks once, 50 -> 49, when the run is committed (an observed state, not progress)
        put('bn', s >= ISSUE ? 49 : 50, (v) => { bn.textContent = String(v); });

        // the plate's indeterminate sliver sweeps left to right and restarts; a function of t alone, cleared at the last landing
        put('lane', pending, (v) => { lane.style.visibility = v ? '' : 'hidden'; });
        const u = (((t / SWEEP) % 1) + 1) % 1;
        put('sl', pending ? u.toFixed(3) : 'off', (v) => { sl.style.left = v === 'off' ? '' : `calc(${(parseFloat(v) * 100).toFixed(1)}% - ${(SW * (1 - parseFloat(v))).toFixed(1)}px)`; });

        // the variants land in strict reading order; the first is also placed on the canvas as a selection
        cells.forEach((c, i) => {
          put(`i${i}`, s >= LAND[i], (v) => { c.im.style.visibility = v ? '' : 'hidden'; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
        });
        put('cv', s >= LAND[0], (v) => { cvIm.style.visibility = v ? '' : 'hidden'; sh.style.visibility = v ? '' : 'hidden'; });
      },
    };
  },
};
