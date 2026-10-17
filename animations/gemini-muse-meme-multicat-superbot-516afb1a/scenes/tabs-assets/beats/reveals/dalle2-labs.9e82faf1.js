// DALL-E 2 as it appeared on OpenAI's Labs site, labs.openai.com (YouTube SflDQB7-1TA, 2023-01-15, t~70.3-76.6 s, corroborated by
// CyoFxu7WGQQ, 2022-07-13; spec .tmp/clone-9e82faf1/reveal-refs/dalle2-labs/spec.json, confidence 0.78; frames aa_04_pending_all_grey_t73.95.png,
// aa_09_promptbar_generate_t73.00.png, aa_12_reveal_row_strip.png). A light page (#F7F7FA): a small grey label, a full-width white
// prompt bar with a plain 'Generate' word at its right end, and under it the results row. Pressing Generate swaps the page's empty
// state (a Tip card) for FLAT light-grey squares (#E7E7ED) with nothing inside them: no spinner, no percentage, no bar, no shimmer,
// no blur. They sit motionless, then each one is hard-swapped for its finished render in one frame step, one tile at a time. The only
// text that changes during the wait is the prompt bar's action, a refresh glyph before the click and the word 'Generate' after it.
// Adapted to ten images: the row of four becomes two rows of five squares with the same ~7% gutter, landing in reading order
// (the footage's four landed 1, 2, 4, 3, so the order really is arbitrary). Omitted: the DALL-E mark and wordmark, the
// History / Collections nav, 'Surprise me', 'Upload an image to edit', 'Report issue', the recent-history strip, and the capybara in
// the Tip card (the footage's pictures are never reproduced: every tile is our own meme, plain squares, system type).
import { press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-dl2';
const ROOT_H = 332, COLS = 5;
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; padding: 18px 16px 0; border-radius: 6px; background: #f7f7fa; color: #202123; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #e6e6ec; }
.${P}-lab { flex: none; height: 12px; margin-bottom: 5px; font-size: 7.5px; line-height: 12px; color: #8e8ea0; white-space: nowrap; }
.${P}-bar { flex: none; display: flex; align-items: stretch; box-sizing: border-box; height: 34px; border-radius: 4px; background: #ffffff; box-shadow: 0 1px 4px rgba(32, 33, 35, .14); }
.${P}-txt { flex: 1; min-width: 0; display: flex; align-items: center; padding: 0 12px; font-size: 9px; color: #353740; white-space: nowrap; overflow: hidden; }
.${P}-act { flex: none; position: relative; display: grid; place-items: center; width: 78px; border-left: 1px solid #ececf1; font-size: 9px; font-weight: 700; color: #202123; }
.${P}-act span, .${P}-act svg { grid-area: 1 / 1; }
.${P}-act svg { width: 11px; height: 11px; fill: none; stroke: #6e6e80; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
.${P}-res { position: relative; flex: 1; min-height: 0; margin-top: 24px; }
.${P}-tip { position: absolute; left: 0; right: 0; top: 0; display: flex; gap: 14px; box-sizing: border-box; height: 108px; padding: 0 0 0 16px; align-items: center; border-radius: 3px; background: #ececf1; }
.${P}-tip i { flex: none; display: block; width: 76px; height: 76px; border-radius: 2px; background: #e0e0e8; }
.${P}-tip b { display: block; font-size: 7.5px; font-weight: 700; line-height: 11px; color: #565869; }
.${P}-tip small { display: block; font-size: 7px; line-height: 10px; color: #8e8ea0; }
.${P}-tip q { display: block; margin-top: 7px; font-size: 11px; line-height: 15px; color: #202123; quotes: "\\201c" "\\201d"; }
.${P}-g { position: absolute; left: 0; right: 0; top: 0; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: 9px 7px; }
.${P}-t { position: relative; aspect-ratio: 1; border-radius: 3px; overflow: hidden; background: #e7e7ed; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; background: #e7e7ed; box-shadow: inset 1px 1px 0 #efeff4; }
`;

const PROMPT = 'a muse holding a handwritten note in a lecture hall, meme style, bright colours';
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const GEN_AT = 0.06;                              // the cursor presses Generate
const ISSUE = 0.16;                               // the Tip card gives way to the ten flat grey squares, the refresh glyph to the word 'Generate'
const LAND = Array.from({ length: 10 }, (_, i) => 0.5 + i * (REF - 0.5) / 9);   // square i is swapped for its render in one step (reading order), the last at 1.84

export default {
  id: 'dalle2-labs',
  label: 'DALL·E 2 Labs (2022)',
  source: {
    platform: 'OpenAI DALL-E 2 web app, labs.openai.com (desktop browser, light theme; a tutorial screen recording on YouTube, 2023-01-15, corroborated by a 2022-07-13 tutorial)',
    feature: "light page with a white prompt bar whose action reads 'Generate' during the wait; the results row is flat light-grey #E7E7ED squares with nothing inside them (no spinner, percentage, bar, shimmer or blur), motionless, each hard-swapped for its render in one frame step, one at a time (adapted to 10: two rows of five squares, landing in reading order; the DALL-E mark, History/Collections nav, 'Surprise me', 'Upload', 'Report issue' and the history strip are omitted)",
    refs: [
      { url: 'https://www.youtube.com/watch?v=SflDQB7-1TA', retrieved: '2026-10-14' },
      { url: 'https://www.youtube.com/watch?v=CyoFxu7WGQQ', retrieved: '2026-10-14' },
    ],
    extrapolated: [
      'ten squares in two rows of five: the footage shows a single row of four (a three-across grid in the 2022-07 clip), so the row count, the 7 px row gap and the reading-order landing are extrapolated; the footage landed its four as 1, 2, 4, 3, an arbitrary order',
      'the swap timing: the footage waited 3.65 s for the first render and 5.75 s for the last (one run); the beat is compressed to the reveal window with an even spacing between landings',
      'the Tip card drawn as the empty state (the footage shows it before the click, with a capybara picture that is not reproduced), and the refresh glyph before the click',
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'dalle2-labs');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}; transform: ${restTransform(g)}; filter: ${restFilter(g)}"/><div class="${P}-pend"></div></div>`;
    const refresh = '<svg viewBox="0 0 12 12"><path d="M10 6a4 4 0 1 1-1.2-2.85M10 1.6v2.3H7.7"/></svg>';
    const root = x.el(`<div class="${P}"><div class="${P}-lab">Edit the detailed description</div><div class="${P}-bar"><div class="${P}-txt">${x.esc(PROMPT)}</div><div class="${P}-act">${refresh}<span style="display: none">Generate</span></div></div><div class="${P}-res"><div class="${P}-tip"><i></i><div><b>Tip</b><small>Add more specific details to get exactly what you want.</small><q>An oil painting portrait of a capybara wearing medieval royal robes</q></div></div><div class="${P}-g" style="visibility: hidden">${tiles.map(cell).join('')}</div></div></div>`);
    const act = root.querySelector(`.${P}-act`), glyph = act.querySelector('svg'), word = act.querySelector('span');
    const tip = root.querySelector(`.${P}-tip`), grid = root.querySelector(`.${P}-g`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n) => ({ im: n.querySelector('img'), pend: n.querySelector(`.${P}-pend`) }));
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
        put('go', gp.toFixed(3), () => { act.style.transform = gp > 0 ? `scale(${(1 - 0.06 * gp).toFixed(4)})` : 'none'; });

        // the results area is replaced within one frame: Tip card out, flat grey squares in; the action turns into the word 'Generate'
        const on = s >= ISSUE;
        put('iss', on, (v) => { tip.style.display = v ? 'none' : ''; grid.style.visibility = v ? '' : 'hidden'; glyph.style.display = v ? 'none' : ''; word.style.display = v ? '' : 'none'; });

        // each grey square is hard-swapped for its render in one step, never faded
        cells.forEach((c, i) => {
          const v = s >= LAND[i];
          put(`i${i}`, v, (d) => { c.im.style.visibility = d ? '' : 'hidden'; c.pend.style.display = d ? 'none' : ''; });
        });
      },
    };
  },
};
