// Higgsfield's image studio running Nano Banana Pro (YouTube aAZFPvkXubQ, late 2025, higgsfield.ai/image/nano_banana_2, pending tile
// t=127.4-132.4 s; spec .tmp/clone-9e82faf1/reveal-refs/higgsfield-studio/spec.json, confidence 0.62; frames q_hs7_8.4.png (pending),
// q_hs7_12.4.png (finished), q_hs7_7.9_zoom.png (badge)). A full-bleed dark studio (#0B0D0E): a top nav row, a black canvas, and a wide
// bottom composer pill holding the prompt, a chip row (model 'Nano Banana Pro', aspect, resolution '2K', an 'Unlimited' toggle, a
// 'Draw' tool) and a lime 'Generate' button. Generate drops a rounded output tile at the canvas's top-left filled edge to edge with a
// smooth BLURRED placeholder, a small dark pill reading 'In progress' in lime at its top-left (no spinner, bar, percentage or queue
// label); the tile then hard-swaps to the sharp picture and the pill goes. The 1/4 chip of the sibling Soul studio says a press makes a
// batch, which is what ten tiles extend.
// Adapted to ten images: ten tiles in a 5 x 2 block from the canvas's top-left, every one blurred with its 'In progress' pill until its
// turn, then sharp, landing in strict reading order (the placeholder is our own meme under a heavy blur). Distinct from the light
// 'Higgsfield Katana' module: a dark studio with the bottom composer pill, not a warm off-white card typed into and collapsed.
// Omitted: the Black Friday promo banner, the nav's 'Pricing' link, the Higgsfield glyph and wordmark in the nav row, the account controls and the browser
// chrome. No platform logo or font is drawn (plain text chips, system type); the model name is plain text.
import { seg, press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-hs';
const ROOT_H = 408, NAV_H = 30, COLS = 5, GAP = 6, BLUR = 9;
const CSS = `
.${P} { position: relative; box-sizing: border-box; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 12px; background: #0b0d0e; color: #d8dbdc; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #1a1d1f; }
.${P}-nav { display: flex; align-items: center; gap: 13px; height: ${NAV_H}px; padding: 0 14px; font-size: 8px; font-weight: 500; color: #8a9093; white-space: nowrap; }
.${P}-nav .on { color: #ffffff; font-weight: 600; }
.${P}-nav b { margin-left: auto; display: grid; place-items: center; box-sizing: border-box; height: 17px; padding: 0 8px; border-radius: 9px; background: #1c2022; font-size: 7.5px; font-weight: 500; color: #d8dbdc; }
.${P}-cv { position: absolute; left: 0; right: 0; top: ${NAV_H}px; bottom: 0; background: #000000; }
.${P}-es { position: absolute; left: 0; right: 0; top: 70px; text-align: center; font-size: 8px; color: #4b5154; }
.${P}-g { position: absolute; left: 8px; right: 8px; top: 8px; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; }
.${P}-t { position: relative; aspect-ratio: 870 / 1024; border-radius: 8px; overflow: hidden; background: #1a1d1f; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pg { position: absolute; left: 5px; top: 5px; box-sizing: border-box; height: 12px; padding: 0 5px; border-radius: 6px; background: rgba(8, 10, 10, .82); font-size: 6.5px; line-height: 12px; font-weight: 600; color: #d7f02a; white-space: nowrap; }
.${P}-cp { position: absolute; left: 50%; bottom: 12px; display: flex; align-items: stretch; gap: 10px; box-sizing: border-box; width: 504px; max-width: calc(100% - 20px); height: 74px; padding: 8px 8px 8px 10px; margin-left: -252px; border-radius: 16px; background: #131618; box-shadow: 0 0 0 1px #23282b; }
.${P}-col { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: space-between; }
.${P}-in { display: flex; align-items: flex-start; gap: 8px; }
.${P}-plus { flex: none; display: grid; place-items: center; width: 14px; height: 14px; border-radius: 4px; background: #23282b; font-size: 10px; line-height: 10px; color: #aeb4b7; }
.${P}-tx { font-size: 7.5px; line-height: 10.5px; color: #dfe3e4; max-height: 21px; overflow: hidden; }
.${P}-chips { display: flex; align-items: center; gap: 5px; font-size: 7px; color: #c3c8ca; white-space: nowrap; }
.${P}-chips span { display: flex; align-items: center; gap: 4px; box-sizing: border-box; height: 18px; padding: 0 7px; border-radius: 6px; background: #1c2124; }
.${P}-chips .un { color: #d7f02a; font-weight: 600; }
.${P}-chips .un i { display: block; position: relative; width: 14px; height: 8px; border-radius: 4px; background: #3a4144; }
.${P}-chips .un i::after { content: ""; position: absolute; left: 1px; top: 1px; width: 6px; height: 6px; border-radius: 50%; background: #eceeef; }
.${P}-go { flex: none; display: grid; place-items: center; width: 74px; border-radius: 10px; background: #c9f02a; font-size: 9px; font-weight: 700; color: #11160a; }
`;

const PROMPT = 'Ten Muse memes: a muse holding a handwritten note in a lecture hall, bright meme style, sharp and clean';
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const GEN_AT = 0.06;                              // the cursor presses Generate
const ISSUE = 0.16;                               // the empty canvas gives way to the ten blurred tiles
const LAND = Array.from({ length: 10 }, (_, i) => 0.4 + i * 0.1425);   // tile i goes sharp (reading order), the last at 1.68

export default {
  id: 'higgsfield-studio',
  label: 'Higgsfield Studio (2025)',
  source: {
    platform: 'Higgsfield image studio (higgsfield.ai/image, Nano Banana Pro; a screen recording on YouTube, late 2025), dark theme with a lime accent',
    feature: "full-bleed dark studio: a top nav row, a black canvas, a wide bottom composer pill (model chip, aspect, '2K', an 'Unlimited' toggle, 'Draw', a lime 'Generate' button); output tiles filled edge to edge with a smooth blurred placeholder and a lime 'In progress' pill, then a hard swap to the sharp picture (adapted to 10: a 5 x 2 tile block from the canvas's top-left landing in strict reading order; the promo banner and the Higgsfield glyph and wordmark are omitted)",
    refs: [{ url: 'https://www.youtube.com/watch?v=aAZFPvkXubQ', retrieved: '2026-10-14' }],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'higgsfield-studio');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="transform-origin: ${g.origin}"/><span class="${P}-pg">In progress</span></div>`;
    const nav = ['Explore', 'Image', 'Video', 'Edit', 'Character', 'Assist', 'Apps', 'Community'].map((n) => `<span${n === 'Image' ? ' class="on"' : ''}>${n}</span>`).join('');
    const root = x.el(`<div class="${P}"><div class="${P}-nav">${nav}<b>Browse Assets</b></div><div class="${P}-cv"><div class="${P}-es">Your generations will appear here</div><div class="${P}-g" style="visibility: hidden">${tiles.map(cell).join('')}</div></div><div class="${P}-cp"><div class="${P}-col"><div class="${P}-in"><i class="${P}-plus">+</i><div class="${P}-tx">${x.esc(PROMPT)}</div></div><div class="${P}-chips"><span>Nano Banana Pro</span><span>Auto</span><span>2K</span><span class="un">Unlimited<i></i></span><span>Draw</span></div></div><div class="${P}-go">Generate</div></div></div>`);
    const go = root.querySelector(`.${P}-go`), es = root.querySelector(`.${P}-es`), grid = root.querySelector(`.${P}-g`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), pg: n.querySelector(`.${P}-pg`), g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // Generate is pressed (it never changes label)
        const gp = press(s, GEN_AT, 0.06, 0.06, 0.14);
        put('go', gp.toFixed(3), () => { go.style.transform = gp > 0 ? `scale(${(1 - 0.05 * gp).toFixed(4)})` : 'none'; });

        // the empty canvas gives way to the ten blurred tiles
        const on = s >= ISSUE;
        put('iss', on, (v) => { es.style.visibility = v ? 'hidden' : ''; grid.style.visibility = v ? '' : 'hidden'; });

        // a tile is our meme under a heavy blur (scaled a touch so the blur never feathers at the tile's edge) with its pill, then a
        // hard swap to the sharp picture at rest; the blur is a filter on the image, the pill's removal the only other change
        cells.forEach((c, i) => {
          const landed = s >= LAND[i];
          put(`i${i}`, landed, (v) => {
            c.pg.style.display = v ? 'none' : '';
            c.im.style.filter = v ? restFilter(c.g) : `blur(${BLUR}px) ${restFilter(c.g) === 'none' ? '' : restFilter(c.g)}`.trim();
            c.im.style.transform = v ? restTransform(c.g) : `scale(${(c.g.zoom * 1.18).toFixed(4)})`;
          });
        });
      },
    };
  },
};
