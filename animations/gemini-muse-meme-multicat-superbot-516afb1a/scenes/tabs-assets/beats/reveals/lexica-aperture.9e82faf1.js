// Lexica Aperture (2023), the '/aperture' Generate tab on lexica.art (YouTube CdAAu646Riw, 2023-07, t~243-253 s; spec
// .tmp/clone-9e82faf1/reveal-refs/lexica-aperture/spec.json, confidence 0.62, which corrects reveal-refs/lexica/NOTES.md; frames
// aa_00_idle.png .. aa_05_complete.png, aa_06_bar_fill_sheet.png). A dark app page: a slim top row 'Home | Generate | History | Likes |
// Account', a composer column ('Describe your image' box, 'Negative prompt' box, a right-aligned indigo 'Generate' pill) beside a
// bordered settings card, an empty band, then the results grid of square tiles. Pressing Generate changes NOTHING on the button and
// shows NO spinner, NO percentage and NO placeholder tile: the previous results stay fully visible and the only affordance is a 5 px
// indigo determinate bar that grows left to right in the empty band under the composer, stalls just short of the end, and clears
// when the job returns; the new results then take the place of the old ones, a plain swap, tile by tile.
// Adapted to ten images: a 5 x 2 results grid (the footage shows a row of 4, 4-across at 1:1), the previous batch drawn as ten
// neutral gradient tiles (never anybody's pictures), each replaced by our own meme in strict reading order. Omitted: the 'lexica'
// wordmark, the avatar's account, the Image-to-Image thumbnail (another person's picture) and any plan or credits chrome.
import { seg } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-lxa';
const ROOT_H = 452, COLS = 5, GAP = 8;
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 10px; background: #262628; color: #e6e6ea; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #34343a; }
.${P}-nav { flex: none; position: relative; display: flex; align-items: center; justify-content: center; gap: 18px; height: 34px; background: #1a1a1e; font-size: 10px; color: #a3a3ab; white-space: nowrap; }
.${P}-nav span { position: relative; line-height: 34px; }
.${P}-nav .${P}-cur { color: #f2f2f5; box-shadow: 0 2px 0 #5146cd; }
.${P}-av { position: absolute; right: 12px; top: 8px; display: grid; place-items: center; width: 18px; height: 18px; border-radius: 50%; background: #34343a; font-size: 8px; color: #cfcfd6; }
.${P}-comp { flex: none; display: grid; grid-template-columns: minmax(0, 1fr) 176px; gap: 14px; padding: 14px 16px 0; }
.${P}-form { display: flex; flex-direction: column; min-width: 0; }
.${P}-lab { height: 12px; font-size: 8px; line-height: 12px; color: #8d8d96; }
.${P}-box { box-sizing: border-box; margin-top: 3px; padding: 7px 8px; border-radius: 7px; background: #353538; font-size: 9.5px; line-height: 13px; color: #e8e8ec; overflow: hidden; }
.${P}-box.${P}-big { height: 54px; }
.${P}-box.${P}-sm { height: 26px; padding-top: 6px; }
.${P}-gen { align-self: flex-end; margin-top: 9px; display: grid; place-items: center; width: 70px; height: 24px; border-radius: 12px; background: #3a33a6; font-size: 10px; font-weight: 600; color: #f4f4ff; }
.${P}-card { box-sizing: border-box; padding: 8px 9px; border-radius: 8px; box-shadow: inset 0 0 0 1px #3a3a40; }
.${P}-ct { font-size: 9px; font-weight: 600; color: #ececf0; line-height: 12px; }
.${P}-cs { margin-top: 2px; font-size: 7.5px; line-height: 10px; color: #8d8d96; }
.${P}-up { margin-top: 6px; font-size: 7.5px; color: #b4b4bc; text-align: right; line-height: 10px; }
.${P}-dim { display: flex; align-items: center; gap: 4px; margin-top: 9px; font-size: 8px; color: #c2c2c9; line-height: 11px; }
.${P}-dim i { display: block; width: 7px; height: 7px; border-radius: 2px; box-shadow: inset 0 0 0 1px #8d8d96; }
.${P}-sl { position: relative; height: 2px; margin: 8px 3px 0; border-radius: 1px; background: #3a3a40; }
.${P}-sl b { position: absolute; left: 0; top: -3.5px; width: 9px; height: 9px; border-radius: 50%; background: #9a9aa2; }
.${P}-rd { margin-top: 7px; text-align: center; font-size: 8px; line-height: 11px; color: #a6a6ae; }
.${P}-adv { margin-top: 8px; font-size: 8px; line-height: 11px; color: #c2c2c9; }
.${P}-band { flex: none; position: relative; height: 38px; }
.${P}-trk { position: absolute; left: 16%; right: 16%; top: 16px; height: 5px; background: #34343a; }
.${P}-fill { position: absolute; left: 0; top: 0; bottom: 0; width: 0%; background: #5146cd; }
.${P}-g { flex: none; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; padding: 0 16px; }
.${P}-t { position: relative; aspect-ratio: 1; border-radius: 6px; overflow: hidden; background: #303034; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-old { position: absolute; inset: 0; border-radius: 6px; }
`;

const PROMPT = 'a muse in a lecture hall holding a handwritten note, meme style, bright colours';
const NEG = 'blurry, text, watermark';
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const BAR_ON = 0.1;                               // the bar appears in the empty band
const BAR_FULL = 0.72;                            // it reaches its stall point and holds there
const STALL = 0.972;                              // the fraction of the track it stops at: short of the end
const LAND = Array.from({ length: 10 }, (_, i) => 0.84 + i * 0.0933);   // result i replaces the old tile i (reading order), the last at 1.68
// ten neutral 'previous results': dark gradients only, a different angle and lightness each
const OLD = Array.from({ length: 10 }, (_, i) => `linear-gradient(${(150 + i * 37) % 360}deg, hsl(${230 + (i % 5) * 12}, 8%, ${32 + (i % 4) * 4}%), hsl(${250 - (i % 3) * 14}, 7%, ${22 + (i % 3) * 3}%))`);

export default {
  id: 'lexica-aperture',
  label: 'Lexica Aperture (2023)',
  source: {
    platform: "Lexica Aperture on lexica.art, the '/aperture' Generate tab (desktop browser, dark UI; a tutorial screen recording on YouTube, 2023-07)",
    feature: "dark composer page: a prompt box, a negative prompt box and an indigo 'Generate' pill that never changes; on press the previous results stay on screen and the only affordance is a 5 px indigo determinate bar growing in the empty band under the composer and stalling short of the end (no spinner, no percentage, no placeholder tile); the bar clears and the new results replace the old ones (adapted to 10: a 5 x 2 grid whose ten old gradient tiles are swapped for the new pictures in reading order)",
    refs: [
      { url: 'https://www.youtube.com/watch?v=CdAAu646Riw', retrieved: '2026-10-14' },
    ],
    extrapolated: [
      'ten results in a 5 x 2 grid (the footage shows a row of 4, 4-across at 1:1) landing one at a time in reading order (the footage shows the new batch arriving as one image and then filling out)',
      'the previous batch drawn as ten neutral gradient tiles instead of the creator\'s own pictures',
      'the bar tops out at 97% and holds, the cap the live page bundle sets (reveal-refs/lexica/NOTES.md); the footage only shows it stalling short of the right end',
      "the settings card's content, simplified to text and a slider (the Image-to-Image thumbnail and the avatar's account are omitted)",
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'lexica-aperture');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; filter: ${restFilter(g)}; transform: ${restTransform(g)}; transform-origin: ${g.origin}"/><div class="${P}-old" style="background: ${OLD[i]}"></div></div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-nav"><span>Home</span><span class="${P}-cur">Generate</span><span>History</span><span>Likes</span><span>Account</span><i class="${P}-av">N</i></div><div class="${P}-comp"><div class="${P}-form"><div class="${P}-lab">Describe your image</div><div class="${P}-box ${P}-big">${x.esc(PROMPT)}</div><div class="${P}-lab" style="margin-top: 8px">Negative prompt</div><div class="${P}-box ${P}-sm">${x.esc(NEG)}</div><div class="${P}-gen">Generate</div></div><div class="${P}-card"><div class="${P}-ct">Image to Image</div><div class="${P}-cs">Create similar images guided by your prompt.</div><div class="${P}-up">+ Upload image</div><div class="${P}-dim"><i></i>Dimensions</div><div class="${P}-sl"><b></b></div><div class="${P}-rd">1152 × 768</div><div class="${P}-adv">▾ Advanced settings</div></div></div><div class="${P}-band"><div class="${P}-trk" style="visibility: hidden"><div class="${P}-fill"></div></div></div><div class="${P}-g">${tiles.map(cell).join('')}</div></div>`);
    const trk = root.querySelector(`.${P}-trk`), fill = root.querySelector(`.${P}-fill`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n) => ({ im: n.querySelector('img'), old: n.querySelector(`.${P}-old`) }));
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // the determinate bar: in the band from BAR_ON until the first new result lands; it fills fast, eases into a stall just short of the end
        const live = s >= BAR_ON && s < LAND[0];
        const f = seg(s, BAR_ON, BAR_FULL);
        const w = live ? (STALL * (1 - Math.pow(1 - f, 2.2)) * 0.93 + STALL * 0.07 * f) * 100 : 0;
        put('trk', live, (v) => { trk.style.visibility = v ? '' : 'hidden'; });
        put('fill', w.toFixed(2), () => { fill.style.width = `${w.toFixed(2)}%`; });

        // each result swaps in for the old tile at its place (the old results stay up until then)
        cells.forEach((c, i) => {
          const done = s >= LAND[i];
          put(`i${i}`, done, (v) => { c.im.style.visibility = v ? '' : 'hidden'; c.old.style.display = v ? 'none' : ''; });
        });
      },
    };
  },
};
