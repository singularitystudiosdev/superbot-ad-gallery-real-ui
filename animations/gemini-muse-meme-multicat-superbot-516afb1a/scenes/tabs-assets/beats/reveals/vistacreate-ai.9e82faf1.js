// VistaCreate's design editor, the 'AI Tools' panel running 'AI Image Generator' (YouTube sZ9SSZKG6_M, SaaS Master, 2025-03-25,
// pending t~169-175 s of the clip; spec .tmp/clone-9e82faf1/reveal-refs/vistacreate-ai/spec.json, confidence 0.60; frames ac2_vc_*).
// A narrow icon rail, then a charcoal panel (#2F3039) with a dark 'AI Tools' header bar, a back arrow and the title 'AI Image
// Generator', a prompt box with a character counter, two chips (Square, Auto) and a full-width blue 'Generate' pill over an
// 'Explore ideas' section; the canvas sits to the right. Pressing Generate swaps the form for a grid of dark tiles (#26272E), each
// holding one or two small four-pointed sparkle stars in a magenta-to-purple gradient that twinkle (their place, size and
// brightness change from frame to frame), the fixed caption 'The magic is happening—your image will appear soon...' and a
// full-width 'Cancel' button. No bar, number, countdown or spinner. The finished pictures replace the tiles, the panel title reads
// 'Generated images', and the prompt box and the Generate pill come back under the grid.
// Adapted to ten images: a 4 + 4 + 2 block of tiles (the footage has a 2 x 2 grid of four), each tile handing its sparkles over to
// its picture in reading order (the footage swaps them all at once); the stars' twinkle is drawn from t. Omitted: the logo and
// 'Pro' badge in the top bar, the NEW badge on the rail item, the 'generations left' line under the pill (a plan allowance),
// the stock pictures of 'Explore ideas' (flat swatches stand in) and the presenter's webcam.
import { press } from '../../../../lib.9b47fc30.js';
import { injectStyle, hash, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-vca';
const ROOT_H = 500, RAIL_W = 52, PANEL_W = 372, COLS = 4, GAP = 8;
const CSS = `
.${P} { box-sizing: border-box; display: flex; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 12px; background: #1c1d22; color: #f2f2f5; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #2a2b33; }
.${P}-rail { flex: none; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; gap: 6px; width: ${RAIL_W}px; padding: 8px 0; background: #1c1d22; }
.${P}-ri { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; box-sizing: border-box; width: 42px; height: 42px; border-radius: 6px; font-size: 6.5px; color: #c4c5cc; white-space: nowrap; }
.${P}-ri svg { width: 15px; height: 15px; fill: none; stroke: #c4c5cc; stroke-width: 1.3; stroke-linecap: round; stroke-linejoin: round; }
.${P}-ri-on { background: #1f6fe0; color: #fff; }
.${P}-ri-on svg { stroke: #fff; }
.${P}-panel { position: relative; flex: none; box-sizing: border-box; display: flex; flex-direction: column; width: ${PANEL_W}px; background: #1c1d22; }
.${P}-hd { flex: none; display: flex; align-items: center; justify-content: space-between; height: 38px; padding: 0 14px 0 8px; font-size: 13px; font-weight: 700; color: #fff; }
.${P}-hd span { font-size: 11px; font-weight: 400; letter-spacing: -1px; color: #9a9ba3; }
.${P}-box { position: relative; flex: 1; min-height: 0; margin: 0 6px 8px 0; border-radius: 8px; background: #2f3039; overflow: hidden; }
.${P}-ttl { display: flex; align-items: center; gap: 8px; height: 32px; padding: 0 10px; font-size: 10.5px; font-weight: 600; color: #fff; white-space: nowrap; }
.${P}-ttl i { font-style: normal; font-size: 13px; font-weight: 400; color: #e8e9ee; }
.${P}-form { position: absolute; left: 8px; right: 8px; top: 36px; }
.${P}-prm { position: relative; box-sizing: border-box; height: 74px; padding: 8px 9px; border-radius: 7px; background: #212127; font-size: 9px; line-height: 13px; color: #eceef2; }
.${P}-prm em { position: absolute; right: 9px; bottom: 6px; font-style: normal; font-size: 6.5px; color: #8c8d96; }
.${P}-chips { display: flex; gap: 7px; margin-top: 7px; }
.${P}-chip { flex: 1; display: flex; align-items: center; justify-content: space-between; box-sizing: border-box; height: 24px; padding: 0 8px; border-radius: 6px; background: #3a3b45; font-size: 8px; color: #f0f1f4; }
.${P}-chip u { text-decoration: none; font-size: 6px; color: #c8c9d0; }
.${P}-gen { display: flex; align-items: center; justify-content: center; gap: 5px; height: 26px; margin-top: 8px; border-radius: 5px; background: #1f6fe0; font-size: 9px; font-weight: 600; color: #fff; }
.${P}-gen svg { width: 10px; height: 10px; fill: #fff; }
.${P}-ex { margin-top: 12px; font-size: 9.5px; font-weight: 700; color: #f2f2f5; }
.${P}-exg { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; margin-top: 7px; }
.${P}-exg i { display: block; height: 62px; border-radius: 6px; background: #3a3b45; }
.${P}-exg i:nth-child(2) { height: 40px; }
.${P}-exg i:nth-child(3) { height: 40px; margin-top: -22px; }
.${P}-res { position: absolute; left: 8px; right: 8px; top: 36px; }
.${P}-g { display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; }
.${P}-t { position: relative; aspect-ratio: 1; border-radius: 7px; overflow: hidden; background: #26272e; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; background: #26272e; }
.${P}-st { position: absolute; left: 0; top: 0; width: 12px; height: 12px; margin: -6px 0 0 -6px; background: linear-gradient(125deg, #9d4fd3 0%, #a254d8 32%, #e8508f 68%, #ee5694 100%); clip-path: path('M6 0 Q6.84 5.16 12 6 Q6.84 6.84 6 12 Q5.16 6.84 0 6 Q5.16 5.16 6 0 Z'); opacity: 0; }
.${P}-cap { margin-top: 12px; font-size: 9.5px; line-height: 14px; text-align: center; color: #e6e7ec; }
.${P}-cx { display: grid; place-items: center; height: 28px; margin-top: 10px; border-radius: 6px; background: #2a2b33; font-size: 9px; font-weight: 600; color: #8f9099; }
.${P}-cv { flex: 1; min-width: 0; display: flex; align-items: center; justify-content: center; background: #e4e5e8; }
.${P}-pg { width: 74%; aspect-ratio: 16 / 9; border-radius: 3px; background: #fff; box-shadow: 0 1px 4px rgba(20, 20, 30, .18); }
`;

const PROMPT = 'I need an ultra realistic muse in a lecture hall holding a handwritten note, meme style';
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const GEN_AT = 0.10;                              // the cursor presses Generate
const ISSUE = 0.18;                               // the form gives way to the ten pending tiles
const LAND = Array.from({ length: 10 }, (_, i) => 0.42 + i * 0.14);   // tile i hands its sparkles over to the picture (reading order), the last at 1.68
const FORM_IDLE = 36, TILE_H = (PANEL_W - 6 - 16 - GAP * (COLS - 1)) / COLS;
const GRID_H = Math.ceil(10 / COLS) * TILE_H + (Math.ceil(10 / COLS) - 1) * GAP;
const FORM_DONE = Math.round(36 + GRID_H + 10);   // the prompt box and Generate pill come back under the finished grid
const RAIL = [
  ['Templates', '<svg viewBox="0 0 16 16"><rect x="2" y="2" width="5" height="5"/><rect x="9" y="2" width="5" height="5"/><rect x="2" y="9" width="5" height="5"/><rect x="9" y="9" width="5" height="5"/></svg>'],
  ['Uploads', '<svg viewBox="0 0 16 16"><path d="M2 4.5h4l1.4 1.6H14V13H2z"/></svg>'],
  ['Photos', '<svg viewBox="0 0 16 16"><rect x="2" y="3" width="12" height="10" rx="1.5"/><path d="M2.5 11l3.5-3.5 3 3 2-2 2.5 2.5"/></svg>'],
  ['Text', '<svg viewBox="0 0 16 16"><path d="M3.5 4h9M8 4v9"/></svg>'],
  ['Styles', '<svg viewBox="0 0 16 16"><path d="M8 2l1.5 4.5L14 8l-4.5 1.5L8 14l-1.5-4.5L2 8l4.5-1.5z"/></svg>'],
  ['AI Tools', '<svg viewBox="0 0 16 16"><path d="M8 1.8l1.4 4.8 4.8 1.4-4.8 1.4L8 14.2 6.6 9.4 1.8 8l4.8-1.4z"/></svg>'],
];
// two stars per tile: a big one and a small one, each on its own period; every cycle the star moves to a fresh spot
const PERIOD = [0.62, 0.83];
const SIZE = [1, 0.62];

export default {
  id: 'vistacreate-ai',
  label: 'VistaCreate AI (2025)',
  source: {
    platform: "VistaCreate design editor (vistacreate.com), 'AI Tools' panel > 'AI Image Generator' (desktop browser, dark panel; a tutorial screen recording on YouTube, 2025-03-25)",
    feature: "dark editor panel: dark #26272E tiles on a #2F3039 panel, each holding one or two twinkling magenta-to-purple four-pointed sparkle stars, the fixed caption 'The magic is happening—your image will appear soon...' and a full-width Cancel button; no bar, percentage, countdown or spinner; the title reads 'Generated images' once the pictures are in, with the prompt box (counter), Square / Auto chips and a blue Generate pill beneath (adapted to 10: a 4 + 4 + 2 tile block whose tiles hand over to their pictures in reading order; the logo, the 'Pro' and 'NEW' badges, the 'generations left' allowance line, the stock gallery pictures and the presenter's webcam are omitted)",
    refs: [{ url: 'https://www.youtube.com/watch?v=sZ9SSZKG6_M', retrieved: '2026-10-14' }],
    extrapolated: [
      'ten tiles: the footage has a 2 x 2 grid of four, so the panel shows a 4 + 4 + 2 block and the pictures land one tile at a time in reading order (the footage swaps all four at once)',
      "the sparkles' motion is not resolved by the 4 fps crops: each star appears at a spot, swells and fades over ~0.6-0.8 s and then reappears elsewhere in its tile, drawn from t with a seeded hash",
      "the panel is shown full-width of a 560 px card next to a plain canvas, the 'Explore ideas' pictures are flat swatches, and the form returns under the grid after the last landing (the footage shows it under the first batch)",
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'vistacreate-ai');
    const star = (n) => `<i class="${P}-st" data-k="${n}"></i>`;
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-pend">${star(0)}${star(1)}</div></div>`;
    const rail = RAIL.map(([n, svg], i) => `<div class="${P}-ri${i === RAIL.length - 1 ? ` ${P}-ri-on` : ''}">${svg}${n}</div>`).join('');
    const spark = '<svg viewBox="0 0 16 16"><path d="M8 1.5l1.3 4.6 4.7 1.4-4.7 1.4L8 13.5 6.7 8.9 2 7.5l4.7-1.4z"/></svg>';
    const root = x.el(`<div class="${P}"><div class="${P}-rail">${rail}</div><div class="${P}-panel"><div class="${P}-hd">AI Tools<span>&lt;&lt;</span></div><div class="${P}-box"><div class="${P}-ttl"><i>←</i><b class="${P}-tt">AI Image Generator</b></div><div class="${P}-form" style="top: ${FORM_IDLE}px"><div class="${P}-prm">${x.esc(PROMPT)}<em>${PROMPT.length}/400</em></div><div class="${P}-chips"><div class="${P}-chip">Square<u>▼</u></div><div class="${P}-chip">Auto<u>▼</u></div></div><div class="${P}-gen"><b class="${P}-gt">Generate</b>${spark}</div><div class="${P}-ex">Explore ideas</div><div class="${P}-exg"><i></i><i></i><i></i><i></i></div></div><div class="${P}-res" style="visibility: hidden"><div class="${P}-g">${tiles.map(cell).join('')}</div><div class="${P}-cap">The magic is happening—your image will appear soon...</div><div class="${P}-cx">Cancel</div></div></div></div><div class="${P}-cv"><div class="${P}-pg"></div></div></div>`);
    const q = (s) => root.querySelector(`.${P}-${s}`);
    const form = q('form'), res = q('res'), cap = q('cap'), cx = q('cx'), gen = q('gen'), gt = q('gt'), tt = q('tt'), exg = q('exg'), ex = q('ex');
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), pend: n.querySelector(`.${P}-pend`), stars: [...n.querySelectorAll(`.${P}-st`)], g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // Generate is pressed
        const gp = press(s, GEN_AT, 0.06, 0.06, 0.14);
        put('gp', gp.toFixed(3), () => { gen.style.transform = gp > 0 ? `scale(${(1 - 0.03 * gp).toFixed(4)})` : 'none'; });

        // phase: 0 the form, 1 the pending grid, 2 the finished grid with the form beneath it
        const phase = s < ISSUE ? 0 : s < LAND[9] ? 1 : 2;
        put('ph', phase, (v) => {
          res.style.visibility = v === 0 ? 'hidden' : '';
          cap.style.display = v === 1 ? '' : 'none';
          cx.style.display = v === 1 ? '' : 'none';
          form.style.visibility = v === 1 ? 'hidden' : '';
          form.style.top = `${v === 2 ? FORM_DONE : FORM_IDLE}px`;
          ex.style.display = v === 0 ? '' : 'none';
          exg.style.display = v === 0 ? '' : 'none';
          tt.textContent = v === 2 ? 'Generated images' : 'AI Image Generator';
          gt.textContent = v === 2 ? 'Generate more' : 'Generate';
        });

        cells.forEach((c, i) => {
          const v = s >= LAND[i];
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
          put(`i${i}`, v, (on) => { c.im.style.visibility = on ? '' : 'hidden'; c.pend.style.display = on ? 'none' : ''; });
          // the twinkle: each star swells and fades once per period at a spot drawn from its cycle number, tile and slot
          c.stars.forEach((st, j) => {
            const ph = t / PERIOD[j] + hash(i * 7 + j, 3) * 4;
            const cyc = Math.floor(ph), fr = ph - cyc;
            const env = Math.sin(Math.PI * fr);
            const sc = (0.35 + 0.95 * env) * SIZE[j] * (0.85 + 0.3 * hash(i * 7 + j, cyc + 11));
            const px = 22 + 56 * hash(i * 13 + j * 5 + 1, cyc), py = 22 + 56 * hash(i * 17 + j * 3 + 2, cyc);
            const key = `${px.toFixed(1)},${py.toFixed(1)},${sc.toFixed(3)},${env.toFixed(3)}`;
            put(`s${i}.${j}`, key, () => {
              st.style.left = `${px.toFixed(1)}%`; st.style.top = `${py.toFixed(1)}%`;
              st.style.opacity = (0.2 + 0.8 * env).toFixed(3);
              st.style.transform = `scale(${sc.toFixed(3)})`;
            });
          });
        });
      },
    };
  },
};
