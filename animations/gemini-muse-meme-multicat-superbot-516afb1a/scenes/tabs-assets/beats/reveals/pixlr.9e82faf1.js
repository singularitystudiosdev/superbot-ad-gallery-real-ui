// Pixlr's AI Image Generator, the web page pixlr.com/image-generator (YouTube a0AXr-Q15BM, 2024-03-26, second run t=55-58.5 s, and
// nDV6D9eac0Q, 2024-02-16, pending state t=191.5-204 s; spec .tmp/clone-9e82faf1/reveal-refs/pixlr/spec.json, confidence 0.74; frames
// u_pixlr_a0A_pending_t56, u_pixlr_a0A_partial_t57, u_pixlr_nDV_pending_t192). A dark page (#1b2023) holding a lighter prompt card
// (a 'Description prompt' box and a row of style, colour, lighting and composition chips), a toggle row and a blue 'Generate' button.
// Pressing it turns the button's label into a white ring spinner and opens a results card headed 'Generate: <the prompt>' whose
// tiles are flat light-grey (#e4e4e4) placeholders with a soft diagonal shimmer band sweeping across them; each placeholder is then
// hard-swapped for its finished picture, left to right, and the button returns to its label. There is no percentage, queue number or
// caption anywhere; the spinning button and the shimmer are the only progress affordances.
// Adapted to ten images: ten placeholder tiles in a 5 x 2 block landing in reading order, the shimmer and the spinner computed from t.
// Omitted: the credit counter ('N remaining'), the '(4c)' credit cost on the button, the Pixlr wordmark and top bar, the account row
// and the browser and taskbar chrome of the creator's recording. The footage's pictures are never reproduced: every tile is our
// own meme, and no logo, wordmark or platform font is drawn (system type, a plain ring).
import { press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-pxl';
const ROOT_H = 494, COLS = 5, GAP = 8;
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; gap: 10px; width: 560px; max-width: 100%; height: ${ROOT_H}px; padding: 14px; border-radius: 12px; background: #1b2023; color: #e9eef0; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #2a3337; }
.${P}-hd { flex: none; display: flex; flex-direction: column; gap: 3px; padding: 0 2px; }
.${P}-hd b { font-size: 14px; font-weight: 600; color: #ffffff; line-height: 18px; }
.${P}-hd span { font-size: 7px; line-height: 10px; color: #9aa5a9; }
.${P}-card { flex: none; box-sizing: border-box; padding: 9px 10px 10px; border-radius: 8px; background: #252e30; box-shadow: inset 0 0 0 1px #2f3a3d; }
.${P}-lab { font-size: 6.5px; line-height: 9px; color: #8e999d; }
.${P}-txt { margin-top: 2px; height: 14px; font-size: 8.5px; line-height: 14px; color: #f1f5f6; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.${P}-chips { display: flex; gap: 6px; margin-top: 8px; }
.${P}-chips span { display: flex; align-items: center; gap: 4px; box-sizing: border-box; height: 20px; padding: 0 8px; border-radius: 10px; box-shadow: inset 0 0 0 1px #3a464a; font-size: 7px; font-weight: 600; color: #c9d2d5; white-space: nowrap; }
.${P}-chips i { display: block; width: 7px; height: 9px; border-radius: 2px; box-shadow: inset 0 0 0 1.2px #aeb9bd; }
.${P}-ctl { flex: none; display: flex; align-items: center; gap: 12px; height: 22px; padding: 0 2px; }
.${P}-tg { display: flex; align-items: center; gap: 5px; font-size: 7.5px; color: #cdd6d9; white-space: nowrap; }
.${P}-tg i { display: block; position: relative; width: 17px; height: 9px; border-radius: 5px; background: #3a4448; }
.${P}-tg i::after { content: ""; position: absolute; left: 1.5px; top: 1.5px; width: 6px; height: 6px; border-radius: 50%; background: #c2cbce; }
.${P}-sp { flex: 1; }
.${P}-clr { box-sizing: border-box; display: grid; place-items: center; width: 40px; height: 20px; border-radius: 4px; box-shadow: inset 0 0 0 1px #4a565a; font-size: 7.5px; font-weight: 600; color: #e2e8ea; }
.${P}-go { position: relative; box-sizing: border-box; display: grid; place-items: center; width: 70px; height: 20px; border-radius: 4px; background: #0099ff; font-size: 8px; font-weight: 700; color: #ffffff; }
.${P}-ring { position: absolute; left: 50%; top: 50%; display: block; width: 11px; height: 11px; margin: -5.5px 0 0 -5.5px; border-radius: 50%; background: conic-gradient(from 0deg, rgba(255, 255, 255, 0) 0deg, #ffffff 40deg, #ffffff 250deg, rgba(255, 255, 255, 0) 290deg); -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 1.8px), #000 calc(100% - 1.3px)); mask: radial-gradient(farthest-side, transparent calc(100% - 1.8px), #000 calc(100% - 1.3px)); }
.${P}-res { flex: 1; min-height: 0; box-sizing: border-box; padding: 9px 10px 10px; border-radius: 8px; background: #20282a; }
.${P}-rh { display: flex; align-items: center; gap: 6px; height: 16px; margin-bottom: 8px; font-size: 8px; color: #dfe6e8; white-space: nowrap; overflow: hidden; }
.${P}-rh i { flex: none; display: block; width: 10px; height: 10px; border-radius: 50%; box-shadow: inset 0 0 0 1.3px #b7c1c4; }
.${P}-rh b { flex: none; font-weight: 700; color: #ffffff; }
.${P}-rh span { overflow: hidden; text-overflow: ellipsis; color: #c4ced1; }
.${P}-g { display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; }
.${P}-t { position: relative; aspect-ratio: 3 / 4; border-radius: 5px; overflow: hidden; background: #e4e4e4; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-c { position: absolute; inset: 0; background: #e4e4e4; }
`;

const PROMPT = 'a muse holding up a handwritten note in a lecture hall, meme style, bright colours';
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const GEN_AT = 0.06;                              // the cursor presses Generate
const ISSUE = 0.16;                               // the results card opens with ten grey placeholders
const LAND = Array.from({ length: 10 }, (_, i) => 0.4 + i * 0.1425);   // tile i is hard-swapped for its picture (reading order), the last at 1.68
const PIX = ['Tall Aspect', 'Digital Art', 'Bright Tone', 'Studio', 'No Composition'];

export default {
  id: 'pixlr',
  label: 'Pixlr (2024)',
  source: {
    platform: 'Pixlr AI Image Generator, pixlr.com/image-generator (desktop browser, dark theme; two tutorial screen recordings on YouTube, 2024-02 and 2024-03)',
    feature: "dark generator page: a prompt card (Description prompt, style / colour / lighting / composition chips) and a blue 'Generate' button whose label becomes a white ring spinner while busy, then a results card headed 'Generate: <prompt>' of light-grey (#e4e4e4) shimmering placeholder tiles that hard-swap for the finished pictures left to right (adapted to 10: a 5 x 2 block; the credit counter and the '(4c)' credit cost are omitted)",
    refs: [
      { url: 'https://www.youtube.com/watch?v=a0AXr-Q15BM', retrieved: '2026-10-14' },
      { url: 'https://www.youtube.com/watch?v=nDV6D9eac0Q', retrieved: '2026-10-14' },
    ],
    extrapolated: ['ten tiles in a 5 x 2 block (the footage shows four in one row)', 'the exact shimmer geometry (a diagonal lighter band, read from single frames)', 'the button returning to its label once the last tile has landed'],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'pixlr');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-c"></div></div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-hd"><b>AI Image Generator</b><span>Generate an image using Generative AI by describing what you want to see.</span></div><div class="${P}-card"><div class="${P}-lab">Description prompt</div><div class="${P}-txt">${x.esc(PROMPT)}</div><div class="${P}-chips">${PIX.map((c, i) => `<span>${i === 0 ? '<i></i>' : ''}${c}</span>`).join('')}</div></div><div class="${P}-ctl"><div class="${P}-tg"><i></i>Negative prompt</div><div class="${P}-tg"><i></i>Make private</div><div class="${P}-sp"></div><div class="${P}-clr">Clear</div><div class="${P}-go"><span>Generate</span><i class="${P}-ring" style="display: none"></i></div></div><div class="${P}-res"><div class="${P}-in" style="visibility: hidden"><div class="${P}-rh"><i></i><b>Generate:</b><span>${x.esc(PROMPT)}</span></div><div class="${P}-g">${tiles.map(cell).join('')}</div></div></div></div>`);
    const go = root.querySelector(`.${P}-go`), label = go.querySelector('span'), ring = go.querySelector(`.${P}-ring`), inner = root.querySelector(`.${P}-in`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), cv: n.querySelector(`.${P}-c`), g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // Generate is pressed; while busy its label gives way to a white ring spinner, and it returns to its label after the last tile
        const gp = press(s, GEN_AT, 0.06, 0.06, 0.14);
        put('go', gp.toFixed(3), () => { go.style.transform = gp > 0 ? `scale(${(1 - 0.05 * gp).toFixed(4)})` : 'none'; });
        const busy = s >= GEN_AT && s < LAND[9];
        put('busy', busy, (v) => { label.style.visibility = v ? 'hidden' : ''; ring.style.display = v ? '' : 'none'; });
        const rdeg = busy ? (((t * 480) % 360) + 360) % 360 : 0;
        put('rg', rdeg.toFixed(0), (d) => { ring.style.transform = `rotate(${d}deg)`; });

        // the results card opens with the ten placeholders
        put('iss', s >= ISSUE, (v) => { inner.style.visibility = v ? '' : 'hidden'; });

        cells.forEach((c, i) => {
          const landed = s >= LAND[i];
          put(`i${i}`, landed, (v) => { c.im.style.visibility = v ? '' : 'hidden'; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
          put(`c${i}`, landed, (v) => { c.cv.style.display = v ? 'none' : ''; });
          // the shimmer: a lighter diagonal band sweeping across the tile, its position a function of t (phase differs per tile)
          const bx = landed ? '' : `${(((t * 0.85 + i * 0.11) % 1) * 170 - 35).toFixed(0)}`;
          put(`b${i}`, bx, (v) => {
            c.cv.style.background = v === '' ? '' : `linear-gradient(112deg, #e4e4e4 ${+v - 20}%, #f3f3f3 ${+v}%, #e4e4e4 ${+v + 20}%)`;
          });
        });
      },
    };
  },
};
