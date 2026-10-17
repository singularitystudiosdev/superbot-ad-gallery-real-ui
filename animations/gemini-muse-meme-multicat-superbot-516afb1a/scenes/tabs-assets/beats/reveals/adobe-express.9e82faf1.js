// Adobe Express (2025), the design editor at new.express.adobe.com with its left-docked 'Generate image' panel (the third-party
// screen recording on YouTube, xPjrN-QhSnw, 2025-03-12, t=68.0-71.2 s; spec .tmp/clone-9e82faf1/reveal-refs/adobe-express/spec.json,
// confidence 0.62; frames y_ax_panel_pending_t69.png, y_ax_canvas_spinner_t70.png). A dark top bar (file name),
// a white icon rail, the panel (header 'Generate image' / 'Powered by Firefly Image 3', the prompt, the 'Styles' chips, a blue
// 'Generate' pill, a 'Results' section, a footer with 'Generate more' and 'Adobe Generative AI terms') and a grey canvas holding a
// selected 1:1 artboard (#F8F8F8). After Generate the 'Results' section is flat #E5E5E5 rounded placeholders (a faint gradient to
// ~#ECECEC) with no text, glyph or shimmer, while a thin rotating arc spinner (#7A70AD) turns at the centre of the empty artboard.
// The footage cuts before the batch resolves; the real product then puts the first result on the artboard and selects it.
// Adapted to ten images: ten placeholders in a 4 + 4 + 2 grid inside the panel, swapping to the pictures one after another in
// reading order (a hard swap, no fade); the artboard takes the first result when it lands and its spinner stops there. The
// Generate pill is drawn disabled while a batch is running (it is flat grey once the batch resolves in the footage). Omitted: the
// Adobe logo, the top bar's 'Start free trial' upsell pill, the left rail's real icons, the account row. Every picture is our own meme; no logo, wordmark or platform font.
import { press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-aex';
const ROOT_H = 472, RAIL_W = 48, PANEL_W = 236, COLS = 4;
const PROMPT = 'a cheerful ghost holding a handwritten note in a lecture hall';
const STYLES = ['Popular', 'Movements', 'Themes', 'Techniques', 'Effects', 'Materials', 'Concepts'];
const RAIL = [['Search', 'c'], ['Your stuff', 's'], ['Brands', 's'], ['Upload', 'u'], ['Templates', 's'], ['Media', 's'], ['Text', 't'], ['Elements', 'c']];
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 10px; background: #fff; color: #2c2c2c; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #d4d4d4; }
.${P}-top { flex: none; display: flex; align-items: center; gap: 12px; height: 28px; padding: 0 10px; background: #1b1b1b; color: #f2f2f2; font-size: 8px; white-space: nowrap; }
.${P}-top b { font-weight: 600; }
.${P}-top i { width: 1px; height: 12px; background: #5a5a5a; }
.${P}-body { flex: 1; min-height: 0; display: flex; }
.${P}-rail { flex: none; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; gap: 7px; width: ${RAIL_W}px; padding: 8px 0; border-right: 1px solid #e1e1e1; background: #fff; }
.${P}-rail div { display: flex; flex-direction: column; align-items: center; gap: 3px; font-size: 6px; color: #3a3a3a; white-space: nowrap; }
.${P}-rail em { display: block; width: 11px; height: 11px; box-sizing: border-box; border: 1.2px solid #2c2c2c; border-radius: 3px; }
.${P}-rail em.c { border-radius: 50%; }
.${P}-rail em.u { border-radius: 50% 50% 3px 3px; }
.${P}-rail em.t { border-width: 0 0 1.4px; border-radius: 0; }
.${P}-pan { flex: none; box-sizing: border-box; display: flex; flex-direction: column; width: ${PANEL_W}px; padding: 10px 10px 8px; background: #fff; border-right: 1px solid #e1e1e1; }
.${P}-ph { flex: none; font-size: 12px; font-weight: 700; line-height: 15px; color: #1b1b1b; }
.${P}-ps { flex: none; margin-top: 2px; font-size: 7.5px; line-height: 10px; color: #6b6b6b; }
.${P}-hr { flex: none; height: 1px; margin: 8px 0 7px; background: #e6e6e6; }
.${P}-prompt { flex: none; box-sizing: border-box; height: 40px; padding: 6px 7px; border-radius: 6px; box-shadow: inset 0 0 0 1px #b9b9b9; font-size: 8px; line-height: 11px; color: #2c2c2c; overflow: hidden; }
.${P}-lab { flex: none; margin: 8px 0 4px; font-size: 8px; font-weight: 600; color: #4a4a4a; }
.${P}-chips { flex: none; display: flex; flex-wrap: wrap; gap: 4px; }
.${P}-chips span { box-sizing: border-box; height: 17px; padding: 0 7px; border-radius: 999px; box-shadow: 0 0 0 1px #cfcfcf, 0 1px 2px rgba(0, 0, 0, .08); font-size: 7.5px; line-height: 17px; color: #3a3a3a; white-space: nowrap; }
.${P}-go { flex: none; display: grid; place-items: center; height: 26px; margin-top: 8px; border-radius: 13px; background: #5258e4; font-size: 9px; font-weight: 700; color: #fff; }
.${P}-rh { flex: none; display: flex; align-items: center; justify-content: space-between; margin: 10px 0 6px; font-size: 10px; font-weight: 700; color: #1b1b1b; }
.${P}-rh s { display: grid; place-items: center; width: 11px; height: 11px; box-sizing: border-box; border: 1.2px solid #2c2c2c; border-radius: 50%; text-decoration: none; font-size: 6.5px; font-weight: 700; line-height: 1; }
.${P}-g { flex: none; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: 3px; }
.${P}-t { position: relative; aspect-ratio: 1; border-radius: 5px; overflow: hidden; background: #e5e5e5; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; background: linear-gradient(135deg, #e5e5e5 35%, #ececec); }
.${P}-ft { margin-top: auto; flex: none; display: flex; flex-direction: column; align-items: center; gap: 5px; padding-top: 6px; border-top: 1px solid #ececec; font-size: 8px; color: #3a3a3a; }
.${P}-ft u { text-decoration: none; font-size: 7px; color: #5258e4; }
.${P}-ft b { font-weight: 400; }
.${P}-cv { flex: 1; min-width: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px; background: #e4e4e4; }
.${P}-cap { font-size: 7px; color: #444; white-space: nowrap; }
.${P}-art { position: relative; box-sizing: border-box; width: 196px; height: 196px; background: #f8f8f8; box-shadow: 0 0 0 1.5px #5258e4; }
.${P}-art > i { position: absolute; width: 6px; height: 6px; box-sizing: border-box; border: 1.2px solid #5258e4; border-radius: 50%; background: #fff; }
.${P}-art img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-spin { position: absolute; left: 50%; top: 50%; width: 24px; height: 24px; margin: -12px 0 0 -12px; border-radius: 50%; background: conic-gradient(from 0deg, rgba(122, 112, 173, 0) 0deg, #7a70ad 250deg, rgba(122, 112, 173, 0) 262deg); -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 2.2px), #000 calc(100% - 1.7px)); mask: radial-gradient(farthest-side, transparent calc(100% - 2.2px), #000 calc(100% - 1.7px)); }
`;

export default {
  id: 'adobe-express',
  label: 'Adobe Express (2025)',
  source: {
    platform: "Adobe Express design editor, new.express.adobe.com: the left-docked 'Generate image' panel, 'Powered by Firefly Image 3' (a tutorial screen recording on YouTube, 2025-03-12)",
    feature: "After Generate the panel's 'Results' section shows flat light-grey rounded placeholders (no text, glyph or shimmer) while a thin rotating arc spinner turns on the empty 1:1 artboard; the recording cuts before the batch resolves. Adapted to 10: ten placeholders in a 4 + 4 + 2 grid in the panel swapping to pictures in strict reading order, the artboard taking the first result",
    refs: [{ url: 'https://www.youtube.com/watch?v=xPjrN-QhSnw', retrieved: '2026-10-14' }],
    extrapolated: 'The footage never shows a result landing: ten tiles in the panel (the footage has four), the hard swap order, the artboard taking the first result and the Generate pill being disabled while a batch runs are extrapolated from the product around the clip.',
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'adobe-express');
    const boardSrc = ownSrc(ctx.src, 'adobe-express-board');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-pend"></div></div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-top"><span>File</span><i></i><b>Untitled - 26 February 2025 at 14.21.34</b></div><div class="${P}-body"><div class="${P}-rail">${RAIL.map(([n, k]) => `<div><em class="${k}"></em>${n}</div>`).join('')}</div><div class="${P}-pan"><div class="${P}-ph">Generate image</div><div class="${P}-ps">Powered by Firefly Image 3</div><div class="${P}-hr"></div><div class="${P}-prompt">${x.esc(PROMPT)}</div><div class="${P}-lab">Styles</div><div class="${P}-chips">${STYLES.map((s) => `<span>${s}</span>`).join('')}</div><div class="${P}-go">Generate</div><div class="${P}-rh">Results<s>i</s></div><div class="${P}-g" style="visibility: hidden">${tiles.map(cell).join('')}</div><div class="${P}-ft"><b>⌄ Generate more</b><u>Adobe Generative AI terms</u></div></div><div class="${P}-cv"><div class="${P}-cap">Page 1 / 1 - Add title</div><div class="${P}-art"><i style="left: -3.5px; top: -3.5px"></i><i style="right: -3.5px; top: -3.5px"></i><i style="left: -3.5px; bottom: -3.5px"></i><i style="right: -3.5px; bottom: -3.5px"></i><img src="${boardSrc}" width="870" height="1024" decoding="sync" alt="Muse meme board" style="visibility: hidden; transform-origin: ${tiles[0].origin}"/><div class="${P}-spin" style="display: none"></div></div></div></div></div>`);
    const go = root.querySelector(`.${P}-go`), grid = root.querySelector(`.${P}-g`), spin = root.querySelector(`.${P}-spin`), board = root.querySelector(`.${P}-art img`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ n, im: n.querySelector('img'), pend: n.querySelector(`.${P}-pend`), g: tiles[i] }));
    ctx.gate([...cells.map((c) => c.im), board]);
    board.style.filter = restFilter(tiles[0]);
    board.style.transform = restTransform(tiles[0]);
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };
    const GEN = ctx.cardIn + (ctx.seq(0)[0] - ctx.cardIn) * 0.5;   // the cursor presses Generate; the Results section takes over
    const FIRST = ctx.seq(0)[1];

    return {
      root,
      render(t) {
        const gp = press(t, GEN, 0.06, 0.06, 0.14);
        const busy = t >= GEN && t < ctx.lastLand;
        put('go', `${gp.toFixed(3)}${busy}`, () => {
          go.style.transform = gp > 0 ? `scale(${(1 - 0.05 * gp).toFixed(4)})` : 'none';
          go.style.background = busy ? '#d9d9d9' : '#5258e4';
          go.style.color = busy ? '#8b8b8b' : '#fff';
        });
        put('grid', t >= GEN, (v) => { grid.style.visibility = v ? '' : 'hidden'; });
        cells.forEach((c, i) => {
          const on = t >= ctx.seq(i)[1];
          put(`i${i}`, on, (v) => {
            c.im.style.visibility = v ? 'visible' : 'hidden';
            c.pend.style.display = v ? 'none' : '';
            c.n.style.boxShadow = v && i === 0 ? '0 0 0 1.5px #5258e4' : 'none';
          });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
        });
        // the artboard: empty with its spinner from Generate until the first result is placed on it
        put('board', t >= FIRST, (v) => { board.style.visibility = v ? 'visible' : 'hidden'; });
        const sp = t >= GEN && t < FIRST;
        put('sp', sp, (v) => { spin.style.display = v ? '' : 'none'; });
        const deg = (((t * 400) % 360) + 360) % 360;
        spin.style.transform = `rotate(${deg.toFixed(1)}deg)`;
      },
    };
  },
};
