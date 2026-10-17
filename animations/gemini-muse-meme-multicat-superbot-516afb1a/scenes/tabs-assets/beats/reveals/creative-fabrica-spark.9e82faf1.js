// CF Spark Art, the text-to-image generator on Creative Fabrica (creativefabrica.com/spark/tools/art-generator/, 2022-12 build; a
// tutorial screen recording on YouTube, 'Introduction to Creative Fabrica Spark Ai', 2022-12-11, t~183.5-206.5 s; spec
// .tmp/clone-9e82faf1/reveal-refs/creative-fabrica-spark/spec.json, confidence 0.78; frames ag2_01_idle_t185, ag2_02_pending_first_t186.5,
// ag2_04b_pending_row_t190, ag2_07_complete_t203). A white, light generator page: the prompt box ('Write what you would like to see
// here...', a clear cross once there is text, a '1:1' aspect chip) beside a pill button that reads IGNITE (pale grey while the box is
// empty, solid green the moment it holds a prompt). Pressing it inserts a new group at the TOP of 'Your creations': the prompt echoed
// in bold with '1:1', a blue 'Use again' link, a red 'Remove prompt' link and a right-aligned grey date, then its tiles. Each pending
// tile is a flat cream #FDFAF3 square with a faint shadow, the word 'Generating' at its foot and, under it, a hairline track whose short
// dark fill grows from the left. No spinner, percentage, countdown, blur or shimmer: a tile is simply hard-swapped for its picture.
// The older group of finished art is pushed down by the new one.
// Adapted to ten images: ten tiles in a 5 + 5 grid resolving one at a time in strict reading order (the source shows a row of 4 per
// ignition); the hairline fill advances from t. Omitted: the brand mark the footage draws in the middle of each pending tile (the tile's
// centre stays plain cream), the header and category bar, the left rail with the account strip and its usage counter, the style
// circles, the banner card, the feedback pane, the floating help pill and the tutorial's own annotation. The footage's pictures are
// never reproduced: every tile is our own meme, system type only.
import { seg, press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-cfs';
const ROOT_H = 424, PAD = 16, COLS = 5, GAP = 8;
const CSS = `
.${P} { box-sizing: border-box; position: relative; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; padding: 14px ${PAD}px 0; border-radius: 10px; background: #ffffff; color: #1f1d3a; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #e4e2ea; }
.${P}-h { flex: none; height: 20px; font-size: 14px; font-weight: 700; line-height: 20px; color: #1e1b3b; white-space: nowrap; }
.${P}-bar { flex: none; display: flex; align-items: center; gap: 10px; height: 34px; margin-top: 10px; }
.${P}-box { flex: 1; min-width: 0; display: flex; align-items: center; box-sizing: border-box; height: 34px; padding: 0 12px; border-radius: 5px; background: #ffffff; box-shadow: 0 1px 10px rgba(32, 28, 70, .1); }
.${P}-txt { flex: 1; min-width: 0; font-size: 9.5px; color: #3a3850; white-space: nowrap; overflow: hidden; }
.${P}-x { flex: none; display: block; width: 8px; height: 8px; margin-right: 10px; fill: none; stroke: #55526a; stroke-width: 1.6; stroke-linecap: round; }
.${P}-ratio { flex: none; display: flex; align-items: center; gap: 4px; box-sizing: border-box; height: 20px; padding-left: 10px; box-shadow: -1px 0 0 #ecebf1; font-size: 8.5px; color: #8d8aa0; }
.${P}-ratio i { display: block; width: 8px; height: 8px; box-sizing: border-box; border-radius: 1.5px; box-shadow: inset 0 0 0 1px #bdbacb; }
.${P}-ratio svg { display: block; width: 6px; height: 6px; fill: none; stroke: #8d8aa0; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
.${P}-go { flex: none; display: flex; align-items: center; justify-content: center; gap: 4px; box-sizing: border-box; width: 78px; height: 32px; border-radius: 4px; background: #e7e6ea; font-size: 8.5px; font-weight: 700; letter-spacing: .4px; color: #b3b1bd; }
.${P}-go svg { display: block; width: 7px; height: 8.5px; fill: currentColor; }
.${P}-go.${P}-on { background: #2f9e5a; color: #ffffff; }
.${P}-list { flex: 1; min-height: 0; overflow: hidden; }
.${P}-yc { flex: none; height: 14px; margin-top: 16px; font-size: 10.5px; font-weight: 700; line-height: 14px; color: #9b98ab; }
.${P}-grp { padding-bottom: 14px; }
.${P}-new { overflow: hidden; }
.${P}-gh { display: flex; align-items: baseline; gap: 6px; height: 14px; margin-top: 8px; margin-bottom: 8px; font-size: 7.8px; white-space: nowrap; overflow: hidden; }
.${P}-gh b { flex: none; max-width: 230px; overflow: hidden; text-overflow: ellipsis; font-size: 8.6px; font-weight: 700; color: #1e1b3b; }
.${P}-gh small { flex: none; font-size: 7.4px; color: #7e7b92; }
.${P}-gh u { flex: none; font-size: 7.4px; color: #2b6fa8; }
.${P}-gh s { flex: none; font-size: 7.4px; text-decoration: none; color: #c2455f; }
.${P}-gh em { flex: none; margin-left: auto; font-style: normal; font-size: 7px; color: #aaa7ba; }
.${P}-grid { display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; }
.${P}-t { position: relative; aspect-ratio: 1; border-radius: 3px; overflow: hidden; background: #fdfaf3; box-shadow: 0 1px 6px rgba(40, 34, 20, .09); }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; background: #fdfaf3; }
.${P}-pend span { position: absolute; left: 0; right: 0; bottom: 10px; text-align: center; font-size: 6.8px; line-height: 8px; color: #9a9a9a; white-space: nowrap; }
.${P}-pend i { position: absolute; left: 6px; right: 6px; bottom: 5px; height: 1.2px; background: #cfcdca; }
.${P}-pend i b { position: absolute; left: 0; top: 0; bottom: 0; width: 5%; background: #2a2a2a; }
`;

const PROMPT = 'A muse holding a handwritten note, meme style';
const OLD_PROMPT = 'A cat reading in a sunny library, watercolor';
const DATE = 'December 11, 2022';
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const TYPE_A = 0.02, TYPE_B = 0.24;               // the prompt is typed into the empty box
const GEN_AT = 0.28;                              // the cursor presses IGNITE
const ISSUE = 0.36;                               // the new group is inserted at the top and the older one is pushed down
const LAND = Array.from({ length: 10 }, (_, i) => 0.66 + i * 0.113);   // tile i is hard-swapped for its picture (reading order), the last at 1.677
const FILL0 = 0.05, FILL1 = 0.3;                  // the hairline's dark fill, as a share of its track, at the group's insertion and just before the swap

const FLAME = '<svg viewBox="0 0 8 10"><path d="M4.2 0C4.4 2 7.6 3.6 7.6 6.5A3.6 3.6 0 010.4 6.9C.4 5.4 1.6 3.9 2.6 3.2c.1 1 .5 1.5 1 1.6C3.4 3.3 3.5 1.4 4.2 0z"/></svg>';
const CLEAR = '<svg class="CFS-x" viewBox="0 0 8 8"><path d="M1 1l6 6M7 1L1 7"/></svg>';
const CHEV = '<svg viewBox="0 0 8 8"><path d="M1.5 3l2.5 2.5L6.5 3"/></svg>';

export default {
  id: 'creative-fabrica-spark',
  label: 'Creative Fabrica Spark Art (2022)',
  source: {
    platform: "CF Spark Art text-to-image generator on Creative Fabrica (creativefabrica.com/spark/tools/art-generator/, desktop Chrome on Windows 11; tutorial screen recordings on YouTube, 2022-12 build)",
    feature: "white generator page: a prompt box with an aspect chip '1:1' and a button labelled IGNITE (pale grey while the box is empty, solid green with a prompt); pressing it inserts a new group at the top of 'Your creations' (the prompt echoed in bold with '1:1', 'Use again', 'Remove prompt' and a right-aligned date) whose pending tiles are flat cream #FDFAF3 squares with a faint shadow, 'Generating' at the foot over a hairline track with a short dark fill growing from the left (no spinner, percentage, countdown or shimmer), each hard-swapped for its picture in reading order; the older group of finished art is pushed down (adapted to 10: a 5 + 5 grid; the brand mark in the middle of each pending tile, the header and rails, the account strip, the banner card, the feedback pane and the help pill are omitted)",
    refs: [
      { url: 'https://www.youtube.com/watch?v=4o2iAkN5U58', videoId: '4o2iAkN5U58', published: '2022-12-11', retrieved: '2026-10-14', note: "'Introduction to Creative Fabrica Spark Ai' (Creating with Saskia): idle t=183.5-186 s, ignition t~186.2 s, pending t=186.5-206.5 s, tiles swapped t~198-203 s" },
      { url: 'https://www.youtube.com/watch?v=RmuKTC4ztPM', videoId: 'RmuKTC4ztPM', published: '2023-03-01', retrieved: '2026-10-14', note: "'AI Art Made EASY in 5 Seconds with Creative Fabrica's SPARK AI Generator' (PassiveIncomeAngel): the same generator idle at t=100-146 s, corroborates the layout only" },
    ],
    extrapolated: "the source shows one row of 4 tiles per ignition; ten tiles in a 5 + 5 grid landing one at a time in strict reading order over the 1.84 s beat (the real wait is ~10-20 s per ignition) are extrapolated; the typing of the prompt, the press, the older group's name and its pictures, and the hairline fill growing in proportion to each tile's own wait (the footage only shows it advancing slowly, ~4 -> 8 px of a ~77 px track) are extrapolated; the caption reads 'Generating' (the frame at 4x shows no dots, the spec's 'Generating...' could not be confirmed at 640x360)",
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'creative-fabrica-spark');
    const srcOld = ownSrc(ctx.src, 'creative-fabrica-spark-earlier');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-pend"><span>Generating</span><i><b></b></i></div></div>`;
    const old = (g, i) => `<div class="${P}-t"><img src="${srcOld}" width="870" height="1024" decoding="sync" alt="Earlier creation ${i + 1}" style="transform-origin: ${g.origin}"/></div>`;
    const oldTiles = [9, 7, 5, 3, 1].map((k) => tiles[k]);
    const head = (prompt) => `<div class="${P}-gh"><b>${x.esc(prompt)}</b><small>1:1</small><u>Use again</u><s>Remove prompt</s><em>${DATE}</em></div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-h">What would you like to create with CF Spark?</div><div class="${P}-bar"><div class="${P}-box"><span class="${P}-txt"></span>${CLEAR.replace('CFS', P)}<div class="${P}-ratio"><i></i>1:1${CHEV}</div></div><div class="${P}-go">${FLAME}IGNITE</div></div><div class="${P}-yc">Your creations</div><div class="${P}-list"><div class="${P}-new" style="max-height: 0px"><div class="${P}-grp">${head(PROMPT)}<div class="${P}-grid">${tiles.map(cell).join('')}</div></div></div><div class="${P}-grp">${head(OLD_PROMPT)}<div class="${P}-grid">${oldTiles.map(old).join('')}</div></div></div></div>`);
    const go = root.querySelector(`.${P}-go`), txt = root.querySelector(`.${P}-txt`), clear = root.querySelector(`.${P}-x`), fresh = root.querySelector(`.${P}-new`);
    const cells = [...fresh.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), pend: n.querySelector(`.${P}-pend`), fill: n.querySelector(`.${P}-pend b`), g: tiles[i] }));
    const olds = [...root.querySelectorAll(`.${P}-t img`)].filter((im) => im.alt.startsWith('Earlier'));
    ctx.gate([...cells.map((c) => c.im), ...olds]);
    // each picture rests at its crop's own CSS (set once; render never touches it)
    cells.forEach((c) => { c.im.style.filter = restFilter(c.g); c.im.style.transform = restTransform(c.g); });
    olds.forEach((im, i) => { im.style.filter = restFilter(oldTiles[i]); im.style.transform = restTransform(oldTiles[i]); });

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // the prompt is typed in; the button is pale grey while the box is empty and solid green once it holds text (the label never changes)
        const n = Math.floor(seg(s, TYPE_A, TYPE_B) * PROMPT.length);
        put('txt', n, (v) => {
          txt.textContent = v > 0 ? PROMPT.slice(0, v) : 'Write what you would like to see here...';
          txt.style.color = v > 0 ? '' : '#a9a6b8';
          clear.style.visibility = v > 0 ? '' : 'hidden';
          go.classList.toggle(`${P}-on`, v > 0);
        });

        // IGNITE is pressed
        const gp = press(s, GEN_AT, 0.05, 0.05, 0.12);
        put('go', gp.toFixed(3), () => { go.style.transform = gp > 0 ? `scale(${(1 - 0.06 * gp).toFixed(4)})` : 'none'; });

        // the new group is inserted at the top: the older one is pushed down
        put('iss', s >= ISSUE, (v) => { fresh.style.maxHeight = v ? 'none' : '0px'; });

        // per tile: the hairline's dark fill grows from the left while pending, then the tile is hard-swapped for its picture, in reading order
        cells.forEach((c, i) => {
          const a = LAND[i];
          const done = s >= a;
          put(`l${i}`, done, (v) => { c.im.style.visibility = v ? '' : 'hidden'; c.pend.style.display = v ? 'none' : ''; });
          const w = ((FILL0 + (FILL1 - FILL0) * seg(s, ISSUE, a)) * 100).toFixed(2);
          put(`f${i}`, w, (v) => { c.fill.style.width = `${v}%`; });
        });
      },
    };
  },
};
