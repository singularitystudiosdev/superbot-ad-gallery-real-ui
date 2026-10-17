// Kaiber Superstudio (superstudio.kaiber.ai): the light-theme infinite canvas, as a third-party 'Kaiber AI Super Studio Image Tutorial' screen
// recording shows it (YouTube wbnWagfZ7B4, Ai Toolbox, published 2024-11-04, t=140.0-157.5 s; second source 8YMyo1CsoXg, 2024-10-18; spec
// .tmp/clone-9e82faf1/reveal-refs/kaiber-superstudio/spec.json, confidence 0.7; frames al_t2_idle_node / al_t3_generating_image /
// al_t3_generating_image_b / al_t4_image_landed). A pale canvas with a violet-bordered 'Image Lab (ImageLab)' node (a blue-to-lilac gradient body
// carrying a 'Subject' card with 'Subject Prompt' and an 'Image Upload' drop zone, and an 'Image Details' card: Aspect Ratio 16:9, Width 1344,
// Height 768) and a purple smiley run handle on its top border. Running the node turns its output area into a plain WHITE rounded rectangle with
// the label 'Generating image...' centred in indigo: no spinner, no bar, no percentage, no timer, and nothing else on the canvas changes. When the
// image lands that white tile is replaced by the picture in one frame (a hard swap, no fade); no toast or 'done' string marks it.
// Adapted to ten images: ten output areas in a 4 + 4 + 2 block, each its own white tile with its own centred 'Generating image...', swapping to
// its picture one after another in strict reading order. Nothing animates (the label is static text), so the landed state is static. Omitted:
// the credits chip, the right 'Materials / Collections / Media' rail, the node's count badge and the hover toolbar. The footage's pictures are
// never reproduced: every tile is our own meme; no logo or platform font is drawn (the smiley is a plain circle with two dots and an arc).
import { press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-kbs';
const ROOT_H = 330, COLS = 4, GAP = 6;
const CSS = `
.${P} { position: relative; box-sizing: border-box; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 12px; background: #f3f3f6; color: #2b2b36; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #e0e0e8; }
.${P}-chip { position: absolute; left: 12px; top: 9px; box-sizing: border-box; height: 18px; padding: 0 9px; border-radius: 5px; background: #ececf2; box-shadow: inset 0 0 0 1px #d2d2dc; font-size: 7px; font-weight: 500; line-height: 18px; color: #2b2b36; white-space: nowrap; }
.${P}-node { position: absolute; left: 12px; top: 36px; box-sizing: border-box; width: 212px; height: 272px; border-radius: 14px; background: linear-gradient(135deg, #a3bfe9 0%, #b3b6ee 50%, #c3a9ed 100%); box-shadow: inset 0 0 0 1.5px #6a56e2; }
.${P}-card { position: absolute; left: 10px; right: 10px; box-sizing: border-box; border-radius: 10px; background: #e9e9ec; box-shadow: 0 1px 4px rgba(60, 50, 120, .12); overflow: hidden; }
.${P}-card h4 { display: flex; align-items: center; justify-content: space-between; margin: 0; padding: 8px 10px 0; font-size: 8px; font-weight: 700; color: #1f1f2a; }
.${P}-card h4 i { font-style: normal; font-size: 8px; line-height: 10px; width: 11px; text-align: center; border-radius: 50%; box-shadow: inset 0 0 0 1px #55555f; color: #55555f; }
.${P}-lab { display: flex; align-items: center; justify-content: space-between; padding: 0 10px; font-size: 5.6px; color: #6f6f7a; }
.${P}-lab i { font-style: normal; font-size: 7px; color: #55555f; }
.${P}-val { padding: 3px 10px 0; font-size: 7.5px; color: #1f1f2a; }
.${P}-drop { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; box-sizing: border-box; height: 52px; margin: 4px 8px 0; border-radius: 7px; background: #f7f7f9; box-shadow: inset 0 0 0 1px #dcdce2; font-size: 6px; color: #2b2b36; }
.${P}-drop s { text-decoration: none; font-size: 9px; line-height: 9px; color: #6f6f7a; }
.${P}-drop small { font-size: 5px; color: #4b4b56; }
.${P}-drop b { font-size: 6px; font-weight: 600; color: #4b3fe0; }
.${P}-row { display: flex; align-items: center; justify-content: space-between; height: 20px; padding: 0 10px; font-size: 6.6px; color: #2b2b36; }
.${P}-row span { box-sizing: border-box; min-width: 56px; height: 14px; padding: 0 8px; border-radius: 7px; background: #f8f8fa; font-size: 6.6px; line-height: 14px; text-align: center; color: #1f1f2a; }
.${P}-run { position: absolute; left: 198px; top: 24px; width: 30px; height: 30px; border-radius: 50%; background: radial-gradient(circle at 35% 28%, #8a7cf5, #4f3ee0 70%); box-shadow: 0 2px 6px rgba(70, 50, 200, .35); }
.${P}-run i { position: absolute; top: 10px; width: 4px; height: 4px; border-radius: 50%; background: #fff; }
.${P}-run u { position: absolute; left: 10px; top: 14px; width: 10px; height: 5px; box-sizing: border-box; border: 1.2px solid #fff; border-top: 0; border-radius: 0 0 6px 6px; }
.${P}-g { position: absolute; left: 238px; right: 12px; top: 36px; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; }
.${P}-t { position: relative; aspect-ratio: 870 / 1024; border-radius: 8px; overflow: hidden; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; border-radius: 8px; background: #fff; font-size: 6.4px; font-weight: 500; color: #3a35d8; white-space: nowrap; }
`;

const PROMPT = 'A muse holding a handwritten note';
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const RUN_AT = 0.06;                              // the cursor presses the run handle
const ISSUE = 0.16;                               // each output area becomes its white 'Generating image...' tile
const LAND = Array.from({ length: 10 }, (_, i) => 0.4 + i * 0.1425);   // tile i hard-swaps to its picture (reading order: 4 + 4 + 2), the last at 1.68

export default {
  id: 'kaiber-superstudio',
  label: 'Kaiber Superstudio (2024)',
  source: {
    platform: "Kaiber Superstudio (superstudio.kaiber.ai): the light-theme infinite canvas with an 'Image Lab (ImageLab)' node (a third-party screen recording, desktop browser)",
    feature: "'Image Lab' node (Subject Prompt, Image Upload, Aspect Ratio 16:9, Width 1344, Height 768) whose output area becomes a plain white rounded rectangle with a centred indigo 'Generating image...' (nothing else changes: no spinner, bar, percentage or timer), then a hard swap to the finished image (adapted to 10: ten output tiles in a 4 + 4 + 2 block, each swapping in reading order)",
    refs: [
      { url: 'https://www.youtube.com/watch?v=wbnWagfZ7B4', published: '2024-11-04', retrieved: '2026-10-14' },
      { url: 'https://www.youtube.com/watch?v=8YMyo1CsoXg', published: '2024-10-18', retrieved: '2026-10-14' },
    ],
    extrapolated: "the footage is one 16:9 output per run: the ten output tiles (a 4 + 4 + 2 block), their portrait crop, a 'Generating image...' label on each, the strict reading-order swap and the landing times are ours; the node's two cards are stacked here (the footage lays them side by side) to fit the 560 px column; the footage's pending-to-result gap (~2 s) is stretched over our window",
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'kaiber-superstudio');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-pend" style="display: none">Generating image...</div></div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-chip">Image Lab (ImageLab)</div><div class="${P}-node"><div class="${P}-card" style="top: 12px; height: 124px"><h4>Subject</h4><div class="${P}-lab" style="margin-top: 5px">Subject Prompt<i>✕</i></div><div class="${P}-val">${x.esc(PROMPT)}</div><div class="${P}-lab" style="margin-top: 6px">Image Upload<i>✕</i></div><div class="${P}-drop"><s>⇪</s>Drop image here<small>Up to 20MB</small><b>Choose File</b></div></div><div class="${P}-card" style="top: 146px; height: 100px"><h4>Image Details<i>✕</i></h4><div class="${P}-row" style="margin-top: 4px">Aspect Ratio<span>16:9 ›</span></div><div class="${P}-row">Width<span>1344</span></div><div class="${P}-row">Height<span>768</span></div></div></div><div class="${P}-run"><i style="left: 8px"></i><i style="right: 8px"></i><u></u></div><div class="${P}-g">${tiles.map(cell).join('')}</div></div>`);
    const run = root.querySelector(`.${P}-run`);
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

        // the run handle is pressed
        const rp = press(s, RUN_AT, 0.06, 0.06, 0.14);
        put('run', rp.toFixed(3), () => { run.style.transform = rp > 0 ? `scale(${(1 - 0.08 * rp).toFixed(4)})` : 'none'; });

        // every output area is a plain white tile with its label until its picture takes its place (a hard swap, in reading order)
        cells.forEach((c, i) => {
          const landed = s >= LAND[i];
          put(`c${i}`, landed ? 2 : s >= ISSUE ? 1 : 0, (v) => { c.pend.style.display = v === 1 ? '' : 'none'; c.im.style.visibility = v === 2 ? '' : 'hidden'; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
        });
      },
    };
  },
};
