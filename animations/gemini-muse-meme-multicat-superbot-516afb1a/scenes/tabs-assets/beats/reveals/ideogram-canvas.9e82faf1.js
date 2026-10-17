// Ideogram Canvas (2024), the layered editing surface at ideogram.ai/canvas (the official 'Canvas: Magic Fill and Extend Explained'
// video on YouTube ppDjfgwhNyY, 2024-10-23; Extend t=40-52.5 s, Magic Fill t=77.2-78.5 s; spec
// .tmp/clone-9e82faf1/reveal-refs/ideogram-canvas/spec.json, confidence 0.66; frames o_ideo_04_extend_pending_mid / _05_late /
// _06_extend_result / _07_magicfill_mask). A dark tool rail down the left (Generate, Magic Fill, Extend, Remix, a rule, Select, Hand,
// Upload, Download, each a line icon over a small label), a light canvas, a floating dark prompt bar at the top ('Describe what you
// want to see', a sliders icon and a white Generate button over the chips Private | aspect | Style Auto | Magic Prompt On), a selection
// rectangle with white round corner handles and pill mid-edge handles, and a small undo / redo / zoom bar at the bottom right. While a
// run is in flight the region being generated is covered in place by a flat magenta -> violet -> blue gradient (the footage's does not
// shimmer, and shows no percentage, queue or spinner) and a small dark toast reads 'Adding Magic Prompt...'; the generated pixels
// then replace the gradient in one hard swap.
// Adapted to ten images: ten regions on the canvas (5 x 2), all covered by the gradient when Generate is pressed and each swapped for its
// picture in strict sequence. Omitted: the app's logo at the top of the rail, the project-name chip, the right details rail, and the
// Magic Fill lasso contour. Every picture is our own meme; no logo, wordmark or platform font is drawn (plain line icons, system type).
import { seg, press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-ic';
const ROOT_H = 392, RAIL_W = 58, COLS = 5, GAP = 6;
const CSS = `
.${P} { position: relative; box-sizing: border-box; display: flex; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 10px; background: #f3f3f4; color: #1b1b1d; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #d9d9dd; }
.${P}-rail { flex: none; box-sizing: border-box; display: flex; flex-direction: column; width: ${RAIL_W}px; padding: 14px 4px 0; background: #050506; }
.${P}-tool { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; height: 34px; margin-bottom: 2px; border-radius: 6px; font-size: 6.5px; color: #f1f1f3; }
.${P}-tool.on { background: #1d1d20; }
.${P}-tool svg { width: 13px; height: 13px; fill: none; stroke: #f1f1f3; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
.${P}-hr { height: 1px; margin: 5px 6px 7px; background: #2a2a2e; }
.${P}-cv { position: relative; flex: 1; min-width: 0; background: #f3f3f4; }
.${P}-bar { position: absolute; left: 50%; top: 10px; box-sizing: border-box; width: 330px; margin-left: -165px; padding: 7px; border-radius: 9px; background: #131315; z-index: 4; box-shadow: 0 4px 14px rgba(0, 0, 0, .18); }
.${P}-in { display: flex; align-items: center; gap: 5px; }
.${P}-box { flex: 1; box-sizing: border-box; height: 20px; padding: 0 7px; border-radius: 5px; background: #000; font-size: 7.5px; line-height: 20px; color: #7d7d82; }
.${P}-sl { display: grid; place-items: center; width: 18px; height: 20px; }
.${P}-sl svg { width: 10px; height: 10px; fill: none; stroke: #e6e6e9; stroke-width: 1.4; stroke-linecap: round; }
.${P}-go { display: grid; place-items: center; box-sizing: border-box; height: 20px; padding: 0 9px; border-radius: 5px; background: #fff; font-size: 7.5px; font-weight: 500; color: #111; }
.${P}-chips { display: flex; align-items: center; gap: 12px; height: 16px; margin-top: 5px; padding-left: 3px; font-size: 7px; color: #b9b9be; white-space: nowrap; }
.${P}-chips b { font-weight: 600; color: #eeeef1; }
.${P}-chips i { display: inline-block; width: 7px; height: 5px; margin-right: 3px; border-radius: 1.5px; box-shadow: inset 0 0 0 1px #b9b9be; vertical-align: 0; }
.${P}-sel { position: absolute; left: 18px; right: 18px; top: 90px; height: ${2 * 102 + GAP + 12}px; box-shadow: 0 0 0 1.5px #e4569d; z-index: 3; pointer-events: none; }
.${P}-sel s { position: absolute; display: block; background: #fff; box-shadow: 0 0 0 1px rgba(0, 0, 0, .12); }
.${P}-sel s.c { width: 7px; height: 7px; border-radius: 50%; }
.${P}-sel s.h { width: 14px; height: 4px; border-radius: 2px; }
.${P}-sel s.v { width: 4px; height: 14px; border-radius: 2px; }
.${P}-g { position: absolute; left: 24px; right: 24px; top: 96px; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; }
.${P}-t { position: relative; aspect-ratio: 870 / 1024; overflow: hidden; background: #e6e6e9; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; background: #e6e6e9; }
.${P}-pend.g { background: linear-gradient(135deg, #f8a1c3 0%, #f27fc4 28%, #d66dd3 52%, #a563da 74%, #5a6cff 100%); }
.${P}-toast { position: absolute; z-index: 5; box-sizing: border-box; height: 16px; padding: 0 8px; border-radius: 4px; background: #0a0a0b; font-size: 7.5px; line-height: 16px; color: #fff; white-space: nowrap; }
.${P}-zoom { position: absolute; right: 8px; bottom: 8px; display: flex; align-items: center; gap: 9px; box-sizing: border-box; height: 24px; padding: 0 9px; border-radius: 8px; background: #131315; font-size: 7px; color: #e6e6e9; z-index: 4; }
.${P}-zoom b { display: grid; place-items: center; height: 15px; padding: 0 6px; border-radius: 4px; background: #2a2a2e; font-weight: 400; }
.${P}-zoom i { font-style: normal; font-size: 9px; line-height: 9px; color: #bdbdc2; }
`;

const ICON = {
  Generate: '<path d="M7 3l1.4 3.6L12 8 8.4 9.4 7 13 5.6 9.4 2 8l3.6-1.4zM13 2l.6 1.4L15 4l-1.4.6L13 6l-.6-1.4L11 4l1.4-.6z"/>',
  'Magic Fill': '<path d="M3 3h3M10 3h3M13 6v3M13 11v2h-2M7 13H5M3 11V9M3 6V5"/><path d="M8 5.5l.8 1.7 1.7.8-1.7.8-.8 1.7-.8-1.7-1.7-.8 1.7-.8z"/>',
  Extend: '<path d="M5 2v8h8M2 5h8v8"/>',
  Remix: '<rect x="2.5" y="4.5" width="9" height="9" rx="1.5"/><path d="M5 11l2-2.4 1.6 1.6 1.4-1.8M12 1.5v3M10.5 3h3"/>',
  Select: '<path d="M4 2l8 5-3.6 1-1.4 3.6z"/>',
  Hand: '<path d="M6 8V3.5a1 1 0 012 0V7M8 6.5V2.8a1 1 0 012 0V7M10 6.8V4a1 1 0 012 0v5.5c0 2.4-1.6 4-3.8 4-1.6 0-2.6-.8-3.4-2L3 8.6a1 1 0 011.6-1.2L6 9"/>',
  Upload: '<path d="M8 11V3M4.5 6.5L8 3l3.5 3.5M3 13h10"/>',
  Download: '<path d="M8 3v8M4.5 7.5L8 11l3.5-3.5M3 13h10"/>',
};
const TOOLS = ['Generate', 'Magic Fill', 'Extend', 'Remix', '-', 'Select', 'Hand', 'Upload', 'Download'];

const REF = 1.84;                  // the beat in seconds from the card's entrance to the last landing
const GEN_AT = 0.04;               // the cursor presses Generate
const ISSUE = 0.12;                // the ten regions are covered by the gradient
const TOAST = [0.14, 0.62];        // 'Adding Magic Prompt...' over the first region

export default {
  id: 'ideogram-canvas',
  label: 'Ideogram Canvas (2024)',
  source: {
    platform: 'Ideogram Canvas, ideogram.ai/canvas (desktop browser; the official 2024-10-23 tutorial video on the Ideogram YouTube channel)',
    feature: "dark left tool rail (Generate, Magic Fill, Extend, Remix, Select, Hand, Upload, Download), a light canvas, a dark prompt bar ('Describe what you want to see', Generate, chips Private | aspect | Style Auto | Magic Prompt On); the region being generated is covered in place by a flat magenta-to-violet-to-blue gradient with the toast 'Adding Magic Prompt...', then swapped for the generated pixels (adapted to 10: ten regions on the canvas, each swapped for its picture in strict sequence)",
    refs: [{ url: 'https://www.youtube.com/watch?v=ppDjfgwhNyY', retrieved: '2026-10-14' }],
    extrapolated: 'the footage generates one region per run (Extend margins or a Magic Fill mask) and shows neither a percentage nor a queue: the ten-region canvas, all gradients at once and the strict swap order are an adaptation; the Magic Fill wait is on screen for only ~1.3 s',
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'ideogram-canvas');
    const tool = (n) => (n === '-' ? `<div class="${P}-hr"></div>` : `<div class="${P}-tool${n === 'Generate' ? ' on' : ''}"><svg viewBox="0 0 16 16">${ICON[n]}</svg>${n}</div>`);
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-pend"></div></div>`;
    const handles = '<s class="c" style="left:-3.5px;top:-3.5px"></s><s class="c" style="right:-3.5px;top:-3.5px"></s><s class="c" style="left:-3.5px;bottom:-3.5px"></s><s class="c" style="right:-3.5px;bottom:-3.5px"></s><s class="h" style="left:calc(50% - 7px);top:-2px"></s><s class="h" style="left:calc(50% - 7px);bottom:-2px"></s><s class="v" style="left:-2px;top:calc(50% - 7px)"></s><s class="v" style="right:-2px;top:calc(50% - 7px)"></s>';
    const root = x.el(`<div class="${P}"><div class="${P}-rail">${TOOLS.map(tool).join('')}</div><div class="${P}-cv"><div class="${P}-bar"><div class="${P}-in"><div class="${P}-box">Describe what you want to see</div><div class="${P}-sl"><svg viewBox="0 0 16 16"><path d="M2 5h12M2 11h12"/><circle cx="10" cy="5" r="1.6" fill="#131315"/><circle cx="6" cy="11" r="1.6" fill="#131315"/></svg></div><div class="${P}-go">Generate</div></div><div class="${P}-chips"><span><i></i><b>Private</b></span><span>1:1</span><span>Style <b>Auto</b></span><span>Magic Prompt <b>On</b></span></div></div><div class="${P}-sel" style="visibility: hidden">${handles}</div><div class="${P}-g">${tiles.map(cell).join('')}</div><div class="${P}-toast" style="left: 28px; top: 100px; visibility: hidden">Adding Magic Prompt...</div><div class="${P}-zoom"><i>↶</i><i>↷</i><i>✓</i><i>−</i><b>71%</b><i>+</i></div></div></div>`);
    const go = root.querySelector(`.${P}-go`), sel = root.querySelector(`.${P}-sel`), toast = root.querySelector(`.${P}-toast`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), pend: n.querySelector(`.${P}-pend`), g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered
        const L = (i) => (ctx.seq(i)[1] - ctx.cardIn) / k;

        // Generate is pressed (it keeps its label); the selection rectangle with its handles appears around the regions
        const gp = press(s, GEN_AT, 0.05, 0.05, 0.12);
        put('gp', gp.toFixed(3), () => { go.style.transform = gp > 0 ? `scale(${(1 - 0.06 * gp).toFixed(4)})` : 'none'; });
        put('sel', s >= GEN_AT, (v) => { sel.style.visibility = v ? '' : 'hidden'; });

        // all ten regions take the gradient at once; the toast sits over the first
        put('iss', s >= ISSUE, (v) => { cells.forEach((c) => c.pend.classList.toggle('g', v)); });
        put('toast', s >= TOAST[0] && s < TOAST[1], (v) => { toast.style.visibility = v ? '' : 'hidden'; });

        // region i: the gradient is replaced in place by the picture, strictly one after another
        cells.forEach((c, i) => {
          const on = s >= L(i);
          put(`i${i}`, on, (v) => { c.im.style.visibility = v ? '' : 'hidden'; c.pend.style.display = v ? 'none' : ''; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
        });
        void seg;
      },
    };
  },
};
