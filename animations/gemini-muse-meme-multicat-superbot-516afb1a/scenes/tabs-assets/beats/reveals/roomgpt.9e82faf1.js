// roomGPT (roomgpt.io /dream, the 'Redesign' product) in a desktop browser (YouTube JVtYdbjBDos 'How To Use RoomGPT | Quick Guide',
// 2024-06-08, uncut 60 fps screen recording, t=67.5-71.5 s; spec .tmp/clone-9e82faf1/reveal-refs/roomgpt/spec.json, confidence 0.62;
// frames at_roomgpt_status_line.png, at_roomgpt_paint_start_69.5.png, at_roomgpt_progressive_sheet.png, at_roomgpt_result_71.5.png).
// A light two-part page: a left rail (the upload card, 'Select Room Types (max 3)', a 'Public Gallery' strip, the style chip
// 'Coastal Living Room' and a blue REDESIGN button) beside a pale result canvas. Pressing REDESIGN leaves the canvas in its empty state
// under one grey status line, 'Generations may take up to 45 seconds, please be patient.' There is no spinner, no percentage, no bar
// and no blur: the line goes away as the picture starts to paint, and the picture arrives as a hard-edged band that grows from the
// top of its frame downward (about 10% of the height, then 35%, then 80%, then the whole picture).
// Adapted to ten images: the canvas holds ten frames (5 x 2) that paint one after another in reading order, each by the same
// top-down band (a clip driven from render(t), never an animation); the status line shows until the first band appears.
// Omitted: the cost line under the button, the roomGPT.io wordmark and the header tabs, the footer credits. The footage's room is
// never reproduced: every frame is our own meme, and no logo, wordmark or platform font is drawn (plain boxes, system type).
import { seg, press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-rgp';
const ROOT_H = 296, LEFT_W = 172, COLS = 5, GAP = 5;
const CSS = `
.${P} { box-sizing: border-box; display: flex; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 12px; background: #ffffff; color: #111827; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #e5e7eb; }
.${P}-left { flex: none; box-sizing: border-box; display: flex; flex-direction: column; gap: 6px; width: ${LEFT_W}px; padding: 12px 12px 12px 14px; border-right: 1px solid #eceef1; }
.${P}-h { flex: none; font-size: 7.5px; font-weight: 700; line-height: 10px; color: #111827; white-space: nowrap; }
.${P}-up { flex: none; display: flex; align-items: center; gap: 8px; box-sizing: border-box; height: 46px; padding: 0 9px; border-radius: 8px; background: #f8f9fb; box-shadow: inset 0 0 0 1px #d9dde3; font-size: 7px; line-height: 9px; color: #4b5563; }
.${P}-up i { flex: none; position: relative; width: 28px; height: 28px; border-radius: 5px; background: linear-gradient(180deg, #cfe3df 0 58%, #d9c7a8 58%); box-shadow: 0 0 0 1px #d9dde3; }
.${P}-up i::after { content: ""; position: absolute; left: 5px; right: 9px; top: 6px; height: 7px; border-radius: 1.5px; background: #fdfdfd; }
.${P}-types { flex: none; display: flex; flex-wrap: wrap; gap: 4px; }
.${P}-types span { box-sizing: border-box; height: 15px; padding: 0 6px; border-radius: 8px; background: #f1f3f6; font-size: 6.5px; line-height: 15px; color: #4b5563; white-space: nowrap; }
.${P}-types .${P}-on { background: #e6eeff; box-shadow: inset 0 0 0 1px #2f6bff; color: #1d4ed8; }
.${P}-gal { flex: none; display: flex; gap: 4px; }
.${P}-gal i { flex: 1; height: 26px; border-radius: 4px; }
.${P}-gal i:nth-child(1) { background: linear-gradient(160deg, #e9d8c4, #b89572); }
.${P}-gal i:nth-child(2) { background: linear-gradient(160deg, #d2e4ec, #86aab8); }
.${P}-gal i:nth-child(3) { background: linear-gradient(160deg, #e4e6d2, #a2a97c); }
.${P}-gal i:nth-child(4) { background: linear-gradient(160deg, #ecd2d2, #c18d8d); }
.${P}-gal i:nth-child(5) { background: linear-gradient(160deg, #d6d2ec, #8d86c1); }
.${P}-style { flex: none; display: flex; align-items: center; justify-content: space-between; box-sizing: border-box; height: 20px; padding: 0 8px; border-radius: 6px; background: #ffffff; box-shadow: inset 0 0 0 1px #d1d5db; font-size: 7px; color: #111827; white-space: nowrap; }
.${P}-style svg { width: 7px; height: 7px; fill: none; stroke: #6b7280; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
.${P}-go { margin-top: auto; flex: none; display: grid; place-items: center; height: 24px; border-radius: 6px; background: #2f6bff; font-size: 8px; font-weight: 700; letter-spacing: .04em; color: #ffffff; }
.${P}-cv { position: relative; flex: 1; min-width: 0; background: radial-gradient(ellipse 60% 38% at 32% 0%, #e9e4fb, rgba(233, 228, 251, 0)), #f7f7f9; }
.${P}-st { position: absolute; left: 0; right: 0; top: 10px; text-align: center; font-size: 6.8px; line-height: 10px; color: #6b7280; white-space: nowrap; }
.${P}-g { position: absolute; left: 10px; right: 10px; top: 52px; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; }
.${P}-t { position: relative; aspect-ratio: 5 / 7; border-radius: 5px; overflow: hidden; background: #ededf1; }
.${P}-t img { position: absolute; inset: 0; z-index: 1; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; z-index: 0; background: #ededf1; }
`;

const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const GEN_AT = 0.06;                              // the cursor presses REDESIGN
const ISSUE = 0.16;                               // the canvas shows its status line and the ten empty frames
const WIN = 0.12;                                 // one frame's paint, top to bottom
const START = Array.from({ length: 10 }, (_, i) => 0.48 + i * WIN);   // frame i starts to paint (reading order), the last ends at 1.68
const END = START.map((a) => a + WIN);
// the band's height against the paint's progress, from the footage: ~10% at 0.5 s, ~35% at 1 s, ~80% at 1.5 s, whole at 3 s of a ~3 s paint (compressed)
const KEYS = [[0, 0], [0.18, 0.1], [0.42, 0.35], [0.7, 0.8], [1, 1]];
const band = (u) => {
  if (u <= 0) return 0;
  if (u >= 1) return 1;
  for (let k = 1; k < KEYS.length; k++) if (u <= KEYS[k][0]) { const [u0, v0] = KEYS[k - 1], [u1, v1] = KEYS[k]; return v0 + (v1 - v0) * (u - u0) / (u1 - u0); }
  return 1;
};
const STATUS = 'Generations may take up to 45 seconds, please be patient.';

export default {
  id: 'roomgpt',
  label: 'roomGPT (2024)',
  source: {
    platform: 'roomGPT (roomgpt.io /dream, the Redesign product) in a desktop browser (light theme; an uncut 60 fps screen recording on YouTube, 2024-06-08)',
    feature: "light page: a left rail (upload card, 'Select Room Types (max 3)', 'Public Gallery', the style chip 'Coastal Living Room', a blue REDESIGN button) beside a pale result canvas that shows one grey status line, 'Generations may take up to 45 seconds, please be patient.', then paints each picture as a hard-edged band growing from the top down (about 10%, 35%, 80%, then whole); no spinner, percentage or bar (adapted to 10: ten frames painting top-down one after another in reading order; the cost line, wordmark and header tabs are omitted)",
    refs: [{ url: 'https://www.youtube.com/watch?v=JVtYdbjBDos', retrieved: '2026-10-14' }],
    videos: [{ id: 'JVtYdbjBDos', published: '2024-06-08', window: 't=67.5-71.5 s' }],
    extrapolated: [
      'ten frames: the footage paints ONE picture; the ten-frame 5 x 2 canvas and their strict reading-order sequence are extrapolated from it',
      'the per-frame paint is the footage\'s single paint compressed to a fraction of a second (real ~3 s): the 10 / 35 / 80 / 100% keys are kept, the pace is not',
      'the status line shows until the first band appears (the footage drops it as the paint starts); with ten frames that is a single moment, not per frame',
      'the left-rail room-type chips (Living Room, Bedroom, Kitchen) and the Public Gallery swatches are drawn plain; their real contents were not legible',
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'roomgpt');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-pend"></div></div>`;
    const chev = '<svg viewBox="0 0 12 12"><path d="M3 4.5l3 3 3-3"/></svg>';
    const root = x.el(`<div class="${P}"><div class="${P}-left"><div class="${P}-h">Upload a photo of your room</div><div class="${P}-up"><i></i>Upload</div><div class="${P}-h">Select Room Types (max 3)</div><div class="${P}-types"><span class="${P}-on">Living Room</span><span>Bedroom</span><span>Kitchen</span></div><div class="${P}-h">Public Gallery</div><div class="${P}-gal"><i></i><i></i><i></i><i></i><i></i></div><div class="${P}-style">Coastal Living Room${chev}</div><div class="${P}-go">REDESIGN</div></div><div class="${P}-cv"><div class="${P}-st" style="visibility: hidden">${x.esc(STATUS)}</div><div class="${P}-g" style="visibility: hidden">${tiles.map(cell).join('')}</div></div></div>`);
    const go = root.querySelector(`.${P}-go`), st = root.querySelector(`.${P}-st`), grid = root.querySelector(`.${P}-g`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => {
      const im = n.querySelector('img');
      im.style.filter = restFilter(tiles[i]);
      return { im, pend: n.querySelector(`.${P}-pend`) };
    });
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // REDESIGN is pressed (it never changes label)
        const gp = press(s, GEN_AT, 0.06, 0.06, 0.14);
        put('go', gp.toFixed(3), () => { go.style.transform = gp > 0 ? `scale(${(1 - 0.05 * gp).toFixed(4)})` : 'none'; });

        // the canvas keeps its empty state under the status line until the first band appears
        put('iss', s >= ISSUE, (v) => { grid.style.visibility = v ? '' : 'hidden'; });
        put('st', s >= ISSUE && s < START[0], (v) => { st.style.visibility = v ? '' : 'hidden'; });

        cells.forEach((c, i) => {
          const r = band(seg(s, START[i], END[i]));
          put(`i${i}`, r > 0, (v) => { c.im.style.visibility = v ? '' : 'hidden'; });
          c.im.style.transform = restTransform(tiles[i]);
          // a hard edge: the top r of the picture is painted, the rest still shows the canvas
          put(`c${i}`, r.toFixed(4), () => { c.im.style.clipPath = r >= 1 ? 'none' : `inset(0 0 ${((1 - r) * 100).toFixed(2)}% 0)`; });
          put(`d${i}`, r >= 1, (v) => { c.pend.style.display = v ? 'none' : ''; });
        });
      },
    };
  },
};
