// Printify's AI image generator inside its web product designer (printify.com, 'AI image generator' panel; a 2026 tutorial screen
// recording on YouTube, 2026-07-30, t~112-118 and t~133.5-145 s; spec .tmp/clone-9e82faf1/reveal-refs/printify-ai/spec.json,
// confidence 0.55; frames ag_prnt_118 / 133_6 / 134_4 / 137 / 138_8 / 140 / 143_6 / 145). A light product-designer shell: a slim top bar
// (back, undo / redo, an Edit | Preview switch), a left tool rail with the AI tool selected, the generator panel (a prompt box with a
// 'Try an example' chip, a purple 'Generate image' button, then 'Your generated images (N)' with 'Generate more' / 'Delete all' and a
// thumbnail grid) and, centre, a plain white T-shirt on a warm-grey backdrop with a dashed print area and a Front side | Back side
// switch. There is no status text, percentage, bar or visible spinner on a pending cell: it is a plain pale-grey rounded square that is
// hard-swapped for the finished image. Choosing a design puts a small green spinner over the shirt's print area until the artwork
// is applied. Adapted to ten images: the heading's count climbs with every arrival and the ten cells (3 + 3 + 3 + 1) fill one at a time in
// reading order (the source showed 4); the first image is then picked and applied to the shirt (the pick / apply moment is
// extrapolated from t~112-118). The garment is drawn as a neutral plain T-shirt silhouette. Omitted: the daily-attempts chip, the style
// picker, the terms line, the right-hand variants / layers rail, the store's save and publish controls, and every brand mark and
// third-party tool in the rail. The footage's pictures are never reproduced: every cell is our own meme, system type only.
import { seg, press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-pfy';
const ROOT_H = 480, RAIL_W = 40, PANEL_W = 196, COLS = 3, GAP = 6;
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 10px; background: #ffffff; color: #2a2a2a; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #dedad5; }
.${P}-top { flex: none; box-sizing: border-box; display: flex; align-items: center; gap: 10px; height: 28px; padding: 0 10px; background: #ffffff; box-shadow: 0 1px 0 #e6e2dd; }
.${P}-top svg { display: block; width: 11px; height: 11px; fill: none; stroke: #5b5853; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
.${P}-top .${P}-dim { stroke: #bdb9b3; }
.${P}-sw { margin-left: auto; display: flex; gap: 2px; padding: 2px; border-radius: 6px; background: #efece8; font-size: 7.5px; font-weight: 600; }
.${P}-sw span { box-sizing: border-box; display: grid; place-items: center; width: 40px; height: 16px; border-radius: 5px; color: #6c6862; }
.${P}-sw .${P}-on { background: #3a3733; color: #ffffff; }
.${P}-body { flex: 1; min-height: 0; display: flex; }
.${P}-rail { flex: none; box-sizing: border-box; display: flex; flex-direction: column; width: ${RAIL_W}px; padding-top: 4px; background: #ffffff; box-shadow: 1px 0 0 #e6e2dd; }
.${P}-tool { flex: none; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; height: 38px; font-size: 5.5px; color: #55524d; white-space: nowrap; }
.${P}-tool svg { display: block; width: 12px; height: 12px; fill: none; stroke: #2f2d2a; stroke-width: 1.4; stroke-linecap: round; stroke-linejoin: round; }
.${P}-tool.${P}-on { background: #e9e6e2; }
.${P}-panel { flex: none; box-sizing: border-box; display: flex; flex-direction: column; width: ${PANEL_W}px; padding: 0 10px 10px; background: #ffffff; box-shadow: 1px 0 0 #e6e2dd; }
.${P}-ph { flex: none; display: flex; align-items: center; justify-content: space-between; height: 28px; font-size: 9px; font-weight: 700; color: #1f1e1c; }
.${P}-ph svg { display: block; width: 8px; height: 8px; stroke: #5b5853; stroke-width: 1.5; stroke-linecap: round; fill: none; }
.${P}-lab { flex: none; margin-top: 2px; font-size: 6.5px; line-height: 10px; color: #6c6862; }
.${P}-chips { flex: none; display: flex; align-items: center; gap: 10px; height: 16px; font-size: 6.8px; font-weight: 600; white-space: nowrap; }
.${P}-chips .${P}-ex { display: flex; align-items: center; gap: 3px; color: #5b2fb8; }
.${P}-chips .${P}-ex svg { display: block; width: 7px; height: 7px; fill: #5b2fb8; }
.${P}-chips .${P}-en { color: #3a3733; }
.${P}-prompt { position: relative; flex: none; box-sizing: border-box; height: 46px; margin-top: 2px; padding: 5px 6px; border-radius: 5px; background: #ffffff; box-shadow: inset 0 0 0 1px #cfcac4; font-size: 7px; line-height: 10px; color: #2d2b28; overflow: hidden; }
.${P}-prompt small { position: absolute; right: 6px; bottom: 3px; font-size: 5.8px; color: #8b867f; }
.${P}-gen { flex: none; display: grid; place-items: center; height: 24px; margin-top: 8px; border-radius: 5px; background: #5230a8; font-size: 8px; font-weight: 700; color: #ffffff; }
.${P}-gh { flex: none; display: flex; align-items: center; height: 14px; margin-top: 10px; font-size: 8px; font-weight: 700; color: #1f1e1c; }
.${P}-gb { flex: none; display: flex; gap: 5px; margin-top: 4px; }
.${P}-gb span { box-sizing: border-box; display: grid; place-items: center; height: 16px; padding: 0 7px; border-radius: 4px; box-shadow: inset 0 0 0 1px #cfcac4; font-size: 6.5px; font-weight: 600; color: #3a3733; white-space: nowrap; }
.${P}-grid { flex: none; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; margin-top: 8px; }
.${P}-cell { position: relative; aspect-ratio: 1; border-radius: 6px; overflow: hidden; background: #edebe9; }
.${P}-cell img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; background: #edebe9; }
.${P}-sel { position: absolute; inset: 0; border-radius: 6px; box-shadow: inset 0 0 0 2px #5230a8; }
.${P}-cv { position: relative; flex: 1; min-width: 0; background: #f3f1ee; }
.${P}-shirt { position: absolute; left: 50%; top: 46%; width: 270px; height: 243px; transform: translate(-50%, -50%); }
.${P}-shirt svg { position: absolute; inset: 0; display: block; width: 100%; height: 100%; }
.${P}-area { position: absolute; left: 33%; top: 21%; width: 34%; height: 46%; box-sizing: border-box; border: 1px dashed #4a4743; overflow: hidden; }
.${P}-area img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-spin { position: absolute; left: 50%; top: 50%; width: 18px; height: 18px; margin: -9px 0 0 -9px; }
.${P}-ring { display: block; width: 18px; height: 18px; border-radius: 50%; background: conic-gradient(from 0deg, rgba(98, 196, 70, 0) 0deg, #62c446 300deg, rgba(98, 196, 70, 0) 350deg); -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 2.4px), #000 calc(100% - 1.9px)); mask: radial-gradient(farthest-side, transparent calc(100% - 2.4px), #000 calc(100% - 1.9px)); }
.${P}-side { position: absolute; left: 50%; bottom: 14px; display: flex; gap: 4px; transform: translateX(-50%); font-size: 7px; font-weight: 600; white-space: nowrap; }
.${P}-side span { box-sizing: border-box; display: grid; place-items: center; height: 16px; padding: 0 10px; border-radius: 8px; background: #ffffff; box-shadow: inset 0 0 0 1px #dedad5; color: #4a4743; }
.${P}-side .${P}-on { background: #3d4636; box-shadow: none; color: #ffffff; }
`;

const PROMPT = 'A muse holding a handwritten note, meme style, bold bright colours';
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const GEN_AT = 0.06;                              // the cursor presses 'Generate image'
const ISSUE = 0.2;                                // the ten pale-grey cells appear
const LAND = Array.from({ length: 10 }, (_, i) => 0.4 + i * 0.1425);   // cell i is hard-swapped for its picture (reading order), the last at 1.68
const PICK = 0.62;                                // the first picture is chosen (outlined) and the garment's spinner starts
const APPLY = 1.22;                               // the artwork is applied to the shirt (hard swap, the spinner goes)

const ICON = {
  back: '<svg viewBox="0 0 12 12"><path d="M7.5 2.5L4 6l3.5 3.5"/></svg>',
  info: '<svg viewBox="0 0 12 12"><circle cx="6" cy="6" r="4.6"/><path d="M6 5.4v3M6 3.6v.1"/></svg>',
  undo: '<svg viewBox="0 0 12 12"><path d="M4.5 2.8L2.6 4.7l1.9 1.9M2.8 4.7h4.1a2.6 2.6 0 010 5.2H5"/></svg>',
  redo: '<svg class="PFY-dim" viewBox="0 0 12 12"><path d="M7.5 2.8l1.9 1.9-1.9 1.9M9.2 4.7H5.1a2.6 2.6 0 000 5.2H7"/></svg>',
  close: '<svg viewBox="0 0 8 8"><path d="M1 1l6 6M7 1L1 7"/></svg>',
  spark: '<svg viewBox="0 0 8 8"><path d="M4 0l1 2.6L8 4 5 5.4 4 8 3 5.4 0 4l3-1.4z"/></svg>',
  upload: '<svg viewBox="0 0 12 12"><path d="M6 8V2.6M3.8 4.6L6 2.4l2.2 2.2M2.5 9.5h7"/></svg>',
  ai: '<svg viewBox="0 0 12 12"><path d="M5 2l1 2.6L8.6 5.6 6 6.6 5 9.2 4 6.6 1.4 5.6 4 4.6zM9.2 7.4l.5 1.2 1.2.5-1.2.5-.5 1.2-.5-1.2-1.2-.5 1.2-.5z"/></svg>',
  text: '<svg viewBox="0 0 12 12"><path d="M2.5 3V2.2h7V3M6 2.4v7.2M4.6 9.6h2.8"/></svg>',
  lib: '<svg viewBox="0 0 12 12"><path d="M1.8 3.4h3l1 1.2h4.4v4.8H1.8z"/></svg>',
  gfx: '<svg viewBox="0 0 12 12"><circle cx="4" cy="4" r="2"/><rect x="6.2" y="6.2" width="3.8" height="3.8" rx=".6"/></svg>',
  tpl: '<svg viewBox="0 0 12 12"><rect x="2" y="2" width="3.4" height="3.4" rx=".5"/><rect x="6.6" y="2" width="3.4" height="3.4" rx=".5"/><rect x="2" y="6.6" width="3.4" height="3.4" rx=".5"/><rect x="6.6" y="6.6" width="3.4" height="3.4" rx=".5"/></svg>',
};
// a neutral plain T-shirt, no label, no mark
const SHIRT = '<svg viewBox="0 0 200 180"><path d="M70 10 L48 19 L8 36 L20 72 L41 63 L41 168 L159 168 L159 63 L180 72 L192 36 L152 19 L130 10 Q100 30 70 10 Z" fill="#ffffff" stroke="#2c2a27" stroke-width="1.2" stroke-linejoin="round"/><path d="M70 10 Q100 36 130 10" fill="none" stroke="#2c2a27" stroke-width="1.2"/><path d="M73 14 Q100 36 127 14" fill="none" stroke="#c9c5bf" stroke-width="3"/><path d="M41 63 L41 168 M159 63 L159 168" stroke="#e6e2dc" stroke-width="1"/></svg>';

export default {
  id: 'printify-ai',
  label: 'Printify AI image generator (2026)',
  source: {
    platform: "Printify web app (printify.com) product designer, 'AI image generator' panel (desktop browser; a tutorial screen recording on YouTube, 2026-07-30)",
    feature: "light product-designer shell: left tool rail, a generator panel with a prompt box and a purple 'Generate image' button, then 'Your generated images (N)' whose pending cells are plain pale-grey squares (no text, percentage or spinner) hard-swapped for the finished image, one at a time in reading order while the heading's count climbs; a plain T-shirt on the canvas takes a small green spinner while the chosen design is applied, then the artwork (adapted to 10: a 3 + 3 + 3 + 1 grid; the daily-attempts chip, style picker, terms line, layers rail and the store's save and publish controls are omitted)",
    refs: [{ url: 'https://www.youtube.com/watch?v=vqahmtEjIjc', retrieved: '2026-10-14' }],
    extrapolated: 'the source shows a grid of 4 and a single pending cell; ten cells landing one at a time in strict reading order, the heading count climbing per arrival, and the pick-then-apply timing (first image chosen at ~0.6 s, applied to the shirt at ~1.2 s of the 1.84 s beat) are extrapolated; the pending cell is shown as plain grey with no shimmer because none was legible',
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'printify-ai');
    const srcPrint = ownSrc(ctx.src, 'printify-ai-print');
    const cell = (g, i) => `<div class="${P}-cell"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-pend"></div></div>`;
    const tool = (k, label, on) => `<div class="${P}-tool${on ? ` ${P}-on` : ''}">${ICON[k]}${label}</div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-top">${ICON.back}${ICON.info}${ICON.undo}${ICON.redo.replace('PFY', P)}<div class="${P}-sw"><span class="${P}-on">Edit</span><span>Preview</span></div></div><div class="${P}-body"><div class="${P}-rail">${tool('upload', 'Upload')}${tool('ai', 'AI', true)}${tool('text', 'Add text')}${tool('lib', 'My library')}${tool('gfx', 'Graphics')}${tool('tpl', 'My templates')}</div><div class="${P}-panel"><div class="${P}-ph">AI image generator${ICON.close}</div><div class="${P}-lab">Text prompt</div><div class="${P}-chips"><span class="${P}-ex">${ICON.spark}Try an example</span><span class="${P}-en">Enhance prompt</span></div><div class="${P}-prompt">${x.esc(PROMPT)}<small>${PROMPT.length}/1000</small></div><div class="${P}-gen">Generate image</div><div class="${P}-gh">Your generated images (<span class="${P}-n">0</span>)</div><div class="${P}-gb"><span>Generate more</span><span>Delete all</span></div><div class="${P}-grid" style="visibility: hidden">${tiles.map(cell).join('')}</div></div><div class="${P}-cv"><div class="${P}-shirt">${SHIRT}<div class="${P}-area"><img src="${srcPrint}" width="870" height="1024" decoding="sync" alt="Applied design" style="visibility: hidden; transform-origin: ${tiles[0].origin}"/><div class="${P}-spin" style="display: none"><i class="${P}-ring"></i></div></div></div><div class="${P}-side"><span>Front side</span><span class="${P}-on">Back side</span></div></div></div></div>`);
    const gen = root.querySelector(`.${P}-gen`), count = root.querySelector(`.${P}-n`), grid = root.querySelector(`.${P}-grid`);
    const cells = [...root.querySelectorAll(`.${P}-cell`)].map((n, i) => ({ n, im: n.querySelector('img'), pend: n.querySelector(`.${P}-pend`), g: tiles[i] }));
    const print = root.querySelector(`.${P}-area img`), spin = root.querySelector(`.${P}-spin`), ring = root.querySelector(`.${P}-ring`);
    const sel = x.el(`<div class="${P}-sel" style="display: none"></div>`);
    cells[0].n.appendChild(sel);
    ctx.gate([...cells.map((c) => c.im), print]);
    // each picture rests at its crop's own CSS (set once; render never touches it)
    cells.forEach((c) => { c.im.style.filter = restFilter(c.g); c.im.style.transform = restTransform(c.g); });
    print.style.filter = restFilter(tiles[0]);
    print.style.transform = restTransform(tiles[0]);

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // 'Generate image' is pressed (it never changes label)
        const gp = press(s, GEN_AT, 0.06, 0.06, 0.14);
        put('gen', gp.toFixed(3), () => { gen.style.transform = gp > 0 ? `scale(${(1 - 0.04 * gp).toFixed(4)})` : 'none'; });

        // the grid of pale-grey cells appears
        put('iss', s >= ISSUE, (v) => { grid.style.visibility = v ? '' : 'hidden'; });

        // hard per-cell swap, strictly in reading order; the heading counts the arrivals
        let n = 0;
        cells.forEach((c, i) => {
          const done = s >= LAND[i];
          if (done) n++;
          put(`l${i}`, done, (v) => { c.im.style.visibility = v ? '' : 'hidden'; c.pend.style.display = v ? 'none' : ''; });
        });
        put('n', n, (v) => { count.textContent = String(v); });

        // the first picture is chosen; a small spinner turns over the print area until the artwork is applied
        put('sel', s >= PICK, (v) => { sel.style.display = v ? '' : 'none'; });
        const spinning = s >= PICK && s < APPLY;
        put('spin', spinning, (v) => { spin.style.display = v ? '' : 'none'; });
        put('app', s >= APPLY, (v) => { print.style.visibility = v ? '' : 'hidden'; });
        // the ring turns with t alone, shown or not
        const deg = (((t * 420) % 360) + 360) % 360;
        put('deg', deg.toFixed(0), (d) => { ring.style.transform = `rotate(${d}deg)`; });
      },
    };
  },
};
