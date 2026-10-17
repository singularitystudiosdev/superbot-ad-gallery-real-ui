// Weavy, now Figma Weave (weavy.ai), as its node editor appears in the official 'Weavy Basics + Generate Stuff' recipe walk-through (YouTube
// ykniduApncM, published 2025-04-01, t=54.0-59.5 s; second source ihOFi5lpQr8, 2025-06-01; spec .tmp/clone-9e82faf1/reveal-refs/weavy/spec.json,
// confidence 0.66; frames al_t2_idle_node / al_t3_processing_node / al_t3_processing_node_b / al_t4_cat_landed). A near-black canvas with a faint
// dot grid; a green 'Text' node feeds the violet 'Generate from Text' node (model line 'Google Imagen 3', its one-line description, a full-width
// run button). Pressing the button turns it into a lighter-violet pill reading '✕ Processing' (the cancel glyph at its left, the word centred) and,
// a few seconds in, a thin circular indeterminate spinner joins the right end of the button row. The output field under it stays a flat dark
// rectangle for the whole wait (no skeleton, no shimmer, no percentage, no bar). When the result lands it fills the field with a '1024 X 1024'
// badge and the button returns as 'Re-run model'; the swap is a hard cut.
// Adapted to ten images: the output field is a 5 x 2 grid of ten cells, filled one after another in strict reading order (row 1 left to right,
// then row 2), the spinner turning from render(t) until the tenth has landed (then it goes, the landed state being static) and the button
// returning to 'Re-run model' with the last. Omitted: the credits chip ('68551 Credits' / 'Get more'), the Share button, the presenter's webcam
// bubble and the screen recorder's timer. The footage's cat is never reproduced: every cell is our own meme; no logo, wordmark or platform
// font is drawn (plain glyphs and system type).
import { press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-wvy';
const ROOT_H = 332, COLS = 5, GAP = 4;
const CSS = `
.${P} { position: relative; box-sizing: border-box; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 12px; background-color: #0e0e16; background-image: radial-gradient(circle, #25253a 0.7px, transparent 0.9px); background-size: 12px 12px; color: #e8e6f6; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #1d1c2c; }
.${P}-top { display: flex; align-items: center; justify-content: center; height: 28px; font-size: 7.5px; font-weight: 500; color: #cfcde2; background: #0b0b12; box-shadow: 0 1px 0 #1d1c2c; }
.${P}-cap { position: absolute; left: 190px; top: 34px; font-size: 6.5px; font-weight: 600; color: #8e7be8; white-space: nowrap; }
.${P}-txt { position: absolute; left: 12px; top: 52px; box-sizing: border-box; width: 104px; height: 76px; border-radius: 8px; background: #064533; box-shadow: 0 0 0 1px #14715a; overflow: hidden; }
.${P}-txt b { display: flex; align-items: center; justify-content: space-between; box-sizing: border-box; height: 17px; padding: 0 6px; background: #14715a; font-size: 7.5px; font-weight: 600; color: #effaf5; }
.${P}-txt b i { font-style: normal; font-size: 8px; letter-spacing: 1px; color: #bfe5d8; }
.${P}-txt div { box-sizing: border-box; height: 48px; margin: 6px 6px 0; padding: 5px 6px; border-radius: 4px; background: #05382a; box-shadow: inset 0 0 0 1px #1c8a6e; font-size: 6.5px; line-height: 9px; color: #e6f5ef; overflow: hidden; }
.${P}-ptl { position: absolute; left: 118px; width: 70px; font-size: 6px; white-space: nowrap; color: #bdbad2; }
.${P}-ptl em { font-style: normal; color: #8c88a8; }
.${P}-ptl.${P}-hi { color: #fff; font-weight: 600; }
.${P}-wire { position: absolute; left: 116px; top: 51px; width: 74px; height: 4px; }
.${P}-wire i { position: absolute; left: 0; right: 0; top: 1.5px; height: 1px; background: #3a6f60; }
.${P}-jk { position: absolute; width: 6px; height: 6px; border-radius: 50%; background: #8e7be8; }
.${P}-node { position: absolute; left: 190px; top: 46px; box-sizing: border-box; width: 358px; height: 270px; border-radius: 12px; background: #2a1a63; box-shadow: 0 0 0 1px #5b3fd6; overflow: hidden; }
.${P}-nh { display: flex; align-items: center; gap: 6px; box-sizing: border-box; height: 22px; padding: 0 10px; background: #4a2aa8; font-size: 8.5px; font-weight: 600; color: #fff; white-space: nowrap; }
.${P}-nh s { text-decoration: none; font-size: 7px; letter-spacing: -1px; color: #b9a6ff; }
.${P}-nh i { margin-left: auto; font-style: normal; font-size: 9px; font-weight: 700; color: #b9a6ff; }
.${P}-bl { box-sizing: border-box; height: 24px; margin: 6px 8px 0; font-size: 6.6px; line-height: 10px; color: #d9d2f4; overflow: hidden; }
.${P}-go { position: relative; display: flex; align-items: center; justify-content: center; box-sizing: border-box; height: 22px; margin: 4px 8px 0; border-radius: 4px; background: #623de0; font-size: 8px; font-weight: 600; color: #fff; white-space: nowrap; }
.${P}-go.${P}-busy { background: #8d74f2; }
.${P}-go u { position: absolute; left: 12px; top: 50%; margin-top: -5.5px; width: 11px; height: 11px; border-radius: 50%; box-shadow: inset 0 0 0 1.2px #fff; font-size: 7px; line-height: 11px; text-align: center; text-decoration: none; font-weight: 700; }
.${P}-go em { position: absolute; right: 12px; top: 50%; margin-top: -5.5px; width: 11px; height: 11px; line-height: 11px; text-align: center; font-style: normal; font-size: 7.5px; }
.${P}-go b { position: absolute; right: 12px; top: 50%; box-sizing: border-box; margin-top: -5.5px; width: 11px; height: 11px; border-radius: 50%; border: 1.1px solid rgba(255, 255, 255, .22); border-top-color: #d8ceff; }
.${P}-fld { position: relative; box-sizing: border-box; height: 178px; margin: 8px 8px 0; padding: 14px 6px 6px; border-radius: 8px; background: #1d1348; overflow: hidden; }
.${P}-bdg { position: absolute; left: 7px; top: 3px; font-size: 6.2px; font-weight: 600; letter-spacing: .3px; color: #c6bcf0; white-space: nowrap; }
.${P}-g { display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; }
.${P}-t { position: relative; aspect-ratio: 870 / 1024; border-radius: 4px; overflow: hidden; background: #1d1348; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; background: #1d1348; }
.${P}-out { position: absolute; right: -3px; top: 55px; width: 8px; height: 8px; border-radius: 50%; background: #8e7be8; }
`;

const PROMPT = 'a muse holding up a handwritten note, meme style, bright colours';
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const GEN_AT = 0.06;                              // the cursor presses the run button
const BUSY = 0.14;                                // the button is the '✕ Processing' pill
const SPIN_AT = 0.34;                             // the thin spinner joins the right of the button row
const LAND = Array.from({ length: 10 }, (_, i) => 0.52 + i * 0.1289);   // cell i fills with its picture (reading order: row 1 left to right, then row 2), the last at 1.68

export default {
  id: 'weavy',
  label: 'Figma Weave (2025)',
  source: {
    platform: "Weavy, now Figma Weave (weavy.ai): the node editor's 'Generate from Text' node on a dark dotted canvas (desktop browser; the official 'Weavy Basics + Generate Stuff' recipe walk-through)",
    feature: "violet 'Generate from Text' node (model line 'Google Imagen 3') whose full-width run button becomes a lighter-violet '✕ Processing' pill, a thin circular spinner joining the right of the button row a few seconds in, the output field staying flat dark (no bar, no percentage), then the result filling the field with a '1024 X 1024' badge and the button back as 'Re-run model' (adapted to 10: a 5 x 2 grid filling cell by cell in reading order; the credits chip and the Share button are omitted)",
    refs: [
      { url: 'https://www.youtube.com/watch?v=ykniduApncM', published: '2025-04-01', retrieved: '2026-10-14' },
      { url: 'https://www.youtube.com/watch?v=ihOFi5lpQr8', published: '2025-06-01', retrieved: '2026-10-14' },
    ],
    extrapolated: "the footage is one result per run: the ten-cell 5 x 2 output grid filling strictly in reading order, and the cell landing times are ours; the idle button reads 'Run Model' in the frame (the spec's 'Generate' was inferred); the spinner's first appearance (read as ~4 s into a ~5 s wait) is placed at about a fifth of the way into our window",
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'weavy');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-pend"></div></div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-top">Weavy Basics + Generate Stuff</div><div class="${P}-cap">Generate from Text</div><div class="${P}-txt"><b>Text<i>⋮</i></b><div>${x.esc(PROMPT)}</div></div><div class="${P}-wire"><i></i></div><div class="${P}-ptl" style="top: 43px; left: 120px">Text</div><div class="${P}-ptl ${P}-hi" style="top: 58px; left: 120px">Prompt <em>[required]</em></div><div class="${P}-ptl" style="top: 79px; left: 120px">Negative Prompt</div><div class="${P}-node"><div class="${P}-nh"><s>⋮⋮</s>Google Imagen 3<i>⋮</i></div><div class="${P}-bl">Google's text-to-image model, generating images with high detail, rich lighting</div><div class="${P}-go"><u style="visibility: hidden">✕</u><span>Run Model</span><em>▶</em><b style="display: none"></b></div><div class="${P}-fld"><div class="${P}-bdg" style="visibility: hidden">1024 X 1024</div><div class="${P}-g">${tiles.map(cell).join('')}</div></div></div><div class="${P}-jk" style="left: 186px; top: 60px"></div><div class="${P}-jk" style="left: 186px; top: 99px"></div><div class="${P}-out"></div></div>`);
    const go = root.querySelector(`.${P}-go`), glyph = go.querySelector('u'), lab = go.querySelector('span'), ic = go.querySelector('em'), spin = go.querySelector('b');
    const badge = root.querySelector(`.${P}-bdg`);
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
        const done = s >= LAND[9];
        const busy = s >= BUSY && !done;

        // the run button is pressed, becomes the '✕ Processing' pill, and returns as 'Re-run model' with the tenth picture
        const gp = press(s, GEN_AT, 0.06, 0.06, 0.14);
        put('go', gp.toFixed(3), () => { go.style.transform = gp > 0 ? `scale(${(1 - 0.03 * gp).toFixed(4)})` : 'none'; });
        put('bz', busy, (v) => { go.classList.toggle(`${P}-busy`, v); glyph.style.visibility = v ? '' : 'hidden'; });
        put('lb', done ? 2 : busy ? 1 : 0, (v) => { lab.textContent = ['Run Model', 'Processing', 'Re-run model'][v]; ic.textContent = ['▶', '', '↻'][v]; });

        // the thin spinner joins the right of the button row; its rotation is a function of t alone, and it is gone once the last cell has landed
        const sp = busy && s >= SPIN_AT;
        put('sp', sp, (v) => { spin.style.display = v ? '' : 'none'; if (!v) spin.style.transform = ''; });
        if (sp) { const deg = (((t * 540) % 360) + 360) % 360; put('sd', deg.toFixed(0), (d) => { spin.style.transform = `rotate(${d}deg)`; }); }

        // the output field stays flat dark; each cell hands over to its picture (a hard cut) in reading order
        put('bg', s >= LAND[0], (v) => { badge.style.visibility = v ? '' : 'hidden'; });
        cells.forEach((c, i) => {
          const on = s >= LAND[i];
          put(`i${i}`, on, (v) => { c.im.style.visibility = v ? '' : 'hidden'; c.pend.style.display = v ? 'none' : ''; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
        });
      },
    };
  },
};
