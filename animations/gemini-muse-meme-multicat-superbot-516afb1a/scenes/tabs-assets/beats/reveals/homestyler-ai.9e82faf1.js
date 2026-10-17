// Homestyler AI, the AI Decor room-render tool on homestyler.com (YouTube LLEGFPwFmX8 'HomeStyler AI - Demo - Tropical', first-party
// HomeStyler AI channel, 2023-07-31, t~19.4-26.2 s; spec .tmp/clone-9e82faf1/reveal-refs/homestyler-ai/spec.json, confidence 0.7;
// frames at_homestyler_composer_19.4.png, at_homestyler_generating_22.0.png, at_homestyler_rendered_26.2.png). A near-black two-pane
// window: a left composer ('Current interior (optional)' upload box, Room type 'Living room', Style 'Tropical', Render time 'Normal',
// 'Number of renders' and a wide outlined GENERATE pill) and a right grid of render tiles, each captioned '<Style> <Room>' over a
// relative timestamp. Pressing GENERATE greys the pill out, and the render tile in the grid shows its picture dimmed with a white
// open-ring spinner (an arc of about 270 degrees) turning in the middle: no text, no percentage, no bar, no shimmer. When the render
// is done the dim and the spinner are gone, the picture is shown under a 'Rendered image' header with Share / Download glyphs, and the
// caption reads 'Tropical Living room' over 'less than a minute ago'.
// Adapted to ten images: the grid is a 4 + 4 + 2 block whose ten tiles all go pending at the press and land one after another in
// reading order, 'Number of renders' set to 10. Omitted: the HOMESTYLER wordmark, the plan name and the renders-left count, the avatar,
// and the credit-fee line under 'Number of renders'.
import { press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-hms';
const ROOT_H = 316, LEFT_W = 164, COLS = 4, GAP = 6;
const CSS = `
.${P} { box-sizing: border-box; display: flex; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 12px; background: #141414; color: #d9d9d9; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #262626; }
.${P}-left { flex: none; box-sizing: border-box; display: flex; flex-direction: column; width: ${LEFT_W}px; padding: 16px 10px 14px 14px; border-right: 1px solid #1f1f1f; }
.${P}-lab { height: 10px; margin-top: 7px; font-size: 6.5px; line-height: 10px; color: #cfcfcf; }
.${P}-lab:first-child { margin-top: 0; }
.${P}-up { box-sizing: border-box; display: grid; place-items: center; height: 36px; margin-top: 3px; border: 1px dashed #4a4a4a; font-size: 6.5px; color: #cfcfcf; }
.${P}-fld { display: flex; align-items: center; box-sizing: border-box; height: 17px; margin-top: 3px; padding: 0 5px; border-radius: 2px; background: #181818; box-shadow: inset 0 0 0 1px #4a4a4a; font-size: 6.5px; color: #dedede; }
.${P}-nr { display: flex; align-items: center; justify-content: space-between; margin-top: 12px; height: 16px; font-size: 6.5px; color: #cfcfcf; }
.${P}-nr span { box-sizing: border-box; display: grid; place-items: center; width: 22px; height: 12px; background: #d8d8d8; font-size: 6.5px; color: #1a1a1a; }
.${P}-go { margin-top: auto; flex: none; display: grid; place-items: center; box-sizing: border-box; height: 22px; border-radius: 11px; background: #11161d; box-shadow: inset 0 0 0 1.2px #5d7396; font-size: 8px; font-weight: 500; letter-spacing: .3px; color: #c4d3ea; }
.${P}-right { flex: 1; min-width: 0; box-sizing: border-box; display: flex; flex-direction: column; padding: 12px 12px 8px 10px; }
.${P}-hd { flex: none; display: flex; align-items: center; justify-content: space-between; height: 18px; padding: 0 2px; }
.${P}-hd b { font-size: 8px; font-weight: 500; color: #f1f1f1; }
.${P}-act { display: flex; gap: 12px; font-size: 6.5px; color: #e4e4e4; }
.${P}-act span { display: flex; align-items: center; gap: 3px; }
.${P}-act svg { width: 8px; height: 8px; fill: none; stroke: #e4e4e4; stroke-width: 1.4; stroke-linecap: round; stroke-linejoin: round; }
.${P}-g { flex: none; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: 7px ${GAP}px; margin-top: 4px; }
.${P}-c { min-width: 0; }
.${P}-t { position: relative; aspect-ratio: 16 / 10; border-radius: 3px; overflow: hidden; background: #1c1c1c; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-dim { position: absolute; inset: 0; display: grid; place-items: center; background: rgba(12, 12, 12, .72); }
.${P}-ring { display: block; box-sizing: border-box; width: 15px; height: 15px; border-radius: 50%; border: 1.6px solid rgba(255, 255, 255, .92); border-top-color: rgba(255, 255, 255, 0); }
.${P}-cap { margin-top: 3px; text-align: center; font-size: 6px; line-height: 8px; color: #dcdcdc; white-space: nowrap; }
.${P}-cap i { display: block; font-style: normal; font-size: 5.5px; color: #5c5c5c; }
`;

const REF = 1.84;                                  // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const GEN_AT = 0.06;                               // the cursor presses GENERATE
const ISSUE = 0.16;                                // the grid's ten tiles go pending, GENERATE greys out
const LAND = Array.from({ length: 10 }, (_, i) => 0.4 + i * 0.1425);   // tile i hands its dimmed spinner over to the render (reading order), the last at 1.68
const SHARE = '<svg viewBox="0 0 12 12"><circle cx="3" cy="6" r="1.4"/><circle cx="9" cy="2.6" r="1.4"/><circle cx="9" cy="9.4" r="1.4"/><path d="M4.3 5.3l3.4-1.9M4.3 6.7l3.4 1.9"/></svg>';
const DOWN = '<svg viewBox="0 0 12 12"><path d="M6 1.5v6.2M3.2 5l2.8 2.8L8.8 5"/><path d="M2 10.4h8"/></svg>';
const CHEV = '<svg viewBox="0 0 12 12" style="margin-left: auto; width: 6px; height: 6px; fill: none; stroke: #8e8e8e; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round"><path d="M3 4.5l3 3 3-3"/></svg>';

export default {
  id: 'homestyler-ai',
  label: 'Homestyler AI (2023)',
  source: {
    platform: 'Homestyler AI Decor in the homestyler.com web app (desktop browser, dark theme; the first-party HomeStyler AI channel demo on YouTube, 2023-07-31)',
    feature: "dark two-pane window: a left composer (Room type 'Living room', Style 'Tropical', Render time 'Normal', Number of renders and a wide outlined GENERATE pill that greys out while rendering) and a right grid of render tiles captioned 'Tropical Living room'; the pending tile holds its dimmed picture under a white open-ring spinner, with no text, percentage or bar, and the finished render lands under a 'Rendered image' header with Share / Download glyphs and the caption 'Tropical Living room' / 'less than a minute ago'. Adapted to 10: a 4 + 4 + 2 grid landing in reading order; the wordmark, plan and renders-left chrome, the avatar and the credit-fee line are omitted",
    refs: [{ url: 'https://www.youtube.com/watch?v=LLEGFPwFmX8', id: 'LLEGFPwFmX8', published: '2023-07-31', retrieved: '2026-10-14', window: 't=19.4-26.2 s' }],
    extrapolated: [
      'ten tiles in a 4 + 4 + 2 grid, all pending at the press and landing one after another in strict reading order (the footage shows one tile rendering among finished ones)',
      "'Number of renders' set to 10 (the footage sets 2)",
      "the 'Rendered image' header with its Share / Download glyphs drawn once above the grid (the footage shows them in a separate opened-render panel), appearing when the first render lands",
      'the dimmed picture under each spinner (the footage could not identify it, an upload ghost or the previous render)',
      "the upload box's file name",
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'homestyler-ai');
    const cell = (g, i) => `<div class="${P}-c"><div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-dim"><i class="${P}-ring"></i></div></div><div class="${P}-cap">Tropical Living room<i>7 days ago</i></div></div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-left"><div class="${P}-lab">Current interior (optional)</div><div class="${P}-up">room.jpg</div><div class="${P}-lab">Room type</div><div class="${P}-fld">Living room${CHEV}</div><div class="${P}-lab">Style</div><div class="${P}-fld">Tropical${CHEV}</div><div class="${P}-lab">Render time</div><div class="${P}-fld">Normal${CHEV}</div><div class="${P}-nr">Number of renders<span>10</span></div><div class="${P}-go">GENERATE</div></div><div class="${P}-right"><div class="${P}-hd"><b style="visibility: hidden">Rendered image</b><div class="${P}-act" style="visibility: hidden"><span>${SHARE}Share</span><span>${DOWN}Download</span></div></div><div class="${P}-g" style="visibility: hidden">${tiles.map(cell).join('')}</div></div></div>`);
    const go = root.querySelector(`.${P}-go`), grid = root.querySelector(`.${P}-g`);
    const head = [root.querySelector(`.${P}-hd b`), root.querySelector(`.${P}-act`)];
    const cells = [...root.querySelectorAll(`.${P}-c`)].map((n, i) => ({ im: n.querySelector('img'), dim: n.querySelector(`.${P}-dim`), ring: n.querySelector(`.${P}-ring`), stamp: n.querySelector(`.${P}-cap i`), g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered
        const tc = Math.min(t, ctx.lastLand);          // anything turning from t stops at the last landing

        // GENERATE is pressed, then stays greyed out until the last render has landed
        const gp = press(s, GEN_AT, 0.06, 0.06, 0.14);
        put('go', gp.toFixed(3), () => { go.style.transform = gp > 0 ? `scale(${(1 - 0.05 * gp).toFixed(4)})` : 'none'; });
        put('off', s >= ISSUE && s < LAND[9], (v) => { go.style.opacity = v ? '0.45' : ''; });

        // the grid's tiles go pending: each picture dimmed under its spinner
        put('iss', s >= ISSUE, (v) => { grid.style.visibility = v ? '' : 'hidden'; });

        cells.forEach((c, i) => {
          const done = s >= LAND[i];
          put(`i${i}`, s >= ISSUE, (v) => { c.im.style.visibility = v ? '' : 'hidden'; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
          put(`c${i}`, done, (v) => { c.dim.style.display = v ? 'none' : ''; c.stamp.textContent = v ? 'less than a minute ago' : '7 days ago'; });
          // the spinner turns with t (its phase differs per tile); a function of t alone
          const deg = (((tc * 540 + i * 47) % 360) + 360) % 360;
          put(`r${i}`, deg.toFixed(0), (d) => { c.ring.style.transform = `rotate(${d}deg)`; });
        });

        // 'Rendered image' with Share / Download shows once the first render has landed
        put('hd', s >= LAND[0], (v) => { head.forEach((n) => { n.style.visibility = v ? '' : 'hidden'; }); });
      },
    };
  },
};
