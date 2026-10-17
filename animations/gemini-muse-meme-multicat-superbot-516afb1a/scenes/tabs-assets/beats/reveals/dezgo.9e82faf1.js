// Dezgo (2023), the free Stable Diffusion front end on dezgo.com, Text-to-image page (YouTube 1wu82yR1C8Y 'Dezgo Demo', 2023-06-29,
// t~87.7-91.2 s; spec .tmp/clone-9e82faf1/reveal-refs/dezgo/spec.json, confidence 0.68; frames aa_click_run_t87.7.png,
// aa_pending_t88.9.png, aa_pending_late_t90.2.png, aa_reveal_t91.2.png, aa_pending_sheet.png). A dark app shell (#2F303D): a slim
// nav, a left form (Prompt, Model, 'More options') and on the right an 'Output' column holding the green 'Run' button over a licence
// line. There is NO placeholder tile and no bar or percentage: pressing 'Run' replaces the button in place with a disabled grey
// pill reading 'Queued...' with a small indeterminate spinner at its left while the Output canvas below stays completely empty;
// when the job returns the picture hard-swaps into the canvas, the button goes back to green 'Run' and a grey 'Seed: n' line
// appears under it.
// Adapted to ten images: the Output canvas is a 4 + 4 + 2 block (the app stacks a batch down the column) whose pictures land one at a
// time in reading order, each a plain swap into the empty canvas. Omitted: the 'Dezgo' wordmark and round logo, the 'FREE' tag, the
// plan-gated 'Count' row, the account row and the footer links.
import { press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-dzg';
const ROOT_H = 436, SIDE_W = 92, COLS = 4, GAP = 5;
const CSS = `
.${P} { box-sizing: border-box; display: flex; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 10px; background: #2f303d; color: #d6d6de; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #3b3c4a; }
.${P}-side { flex: none; box-sizing: border-box; width: ${SIDE_W}px; padding: 40px 0 0; background: #2c2c36; }
.${P}-side span { display: block; padding: 0 9px; height: 22px; font-size: 8px; line-height: 22px; color: #b7b7c2; white-space: nowrap; overflow: hidden; }
.${P}-side .${P}-cur { color: #4a93e8; }
.${P}-main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.${P}-top { flex: none; display: flex; align-items: center; gap: 9px; height: 34px; padding: 0 12px; background: #2a2a34; font-size: 9px; color: #dcdce4; }
.${P}-top i { display: block; width: 9px; height: 7px; border-top: 1.3px solid #c9c9d2; border-bottom: 1.3px solid #c9c9d2; box-sizing: border-box; position: relative; }
.${P}-top i::after { content: ""; position: absolute; left: 0; right: 0; top: 1.5px; height: 1.3px; background: #c9c9d2; }
.${P}-ttl { flex: none; text-align: center; padding: 14px 0 0; }
.${P}-ttl b { display: block; font-size: 11.5px; font-weight: 600; color: #e3e3ea; line-height: 15px; }
.${P}-cols { flex: 1; min-height: 0; display: grid; grid-template-columns: 158px minmax(0, 1fr); gap: 14px; padding: 12px 12px 0 12px; }
.${P}-form { min-width: 0; }
.${P}-lab { font-size: 9px; font-weight: 500; line-height: 12px; color: #d6d6de; }
.${P}-sub { font-size: 6.5px; line-height: 10px; color: #7e7e8a; }
.${P}-area { box-sizing: border-box; height: 52px; margin-top: 4px; padding: 5px 7px; border-radius: 3px; background: #2f303d; box-shadow: 0 0 0 1px #50515f; font-size: 8px; line-height: 11px; color: #cfcfd8; overflow: hidden; }
.${P}-sel { display: flex; align-items: center; justify-content: space-between; box-sizing: border-box; height: 26px; margin-top: 4px; padding: 0 8px; border-radius: 3px; box-shadow: 0 0 0 1px #50515f; font-size: 8px; color: #dcdce4; }
.${P}-sel i { display: block; width: 0; height: 0; border-left: 3px solid transparent; border-right: 3px solid transparent; border-top: 3.5px solid #9a9aa8; }
.${P}-more { display: flex; align-items: center; justify-content: space-between; box-sizing: border-box; height: 26px; margin-top: 12px; padding: 0 8px; border-radius: 3px; background: #343544; font-size: 8.5px; color: #dcdce4; }
.${P}-out { min-width: 0; display: flex; flex-direction: column; align-items: center; }
.${P}-oh { font-size: 11px; font-weight: 600; line-height: 15px; color: #dcdce4; }
.${P}-btn { display: flex; align-items: center; justify-content: center; gap: 5px; box-sizing: border-box; height: 22px; margin-top: 5px; border-radius: 3px; font-size: 8.5px; font-weight: 500; white-space: nowrap; }
.${P}-btn.${P}-run { width: 44px; background: #1f8c6b; color: #f4fffb; }
.${P}-btn.${P}-que { width: 72px; background: #505257; color: #6b6a73; }
.${P}-sp { flex: none; display: block; width: 9px; height: 9px; box-sizing: border-box; border-radius: 50%; border: 1.5px solid #6b6a73; border-top-color: transparent; }
.${P}-lic { margin-top: 4px; font-size: 6px; line-height: 8.5px; text-align: center; color: #a4a4b0; }
.${P}-seed { height: 11px; margin-top: 2px; font-size: 7.5px; line-height: 11px; font-weight: 500; color: #cfcfd8; }
.${P}-g { align-self: stretch; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; margin-top: 3px; }
.${P}-t { position: relative; aspect-ratio: 3 / 4; border-radius: 3px; overflow: hidden; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
`;

const PROMPT = 'A muse in a lecture hall holding up a handwritten note, meme style, bright colours';
const SEED = 'Seed: 482916307';
const NAV = ['Text-to-Image', 'Image-to-Image', 'Upscale', 'Inpainting from text', 'Edit image from text', 'Text-to-video'];
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const RUN_AT = 0.08;                              // the cursor presses 'Run'
const QUEUED = 0.14;                              // the button flips in place to the grey 'Queued...' pill
const LAND = Array.from({ length: 10 }, (_, i) => 0.78 + i * 0.1);   // picture i swaps into the empty canvas (reading order), the last at 1.68

export default {
  id: 'dezgo',
  label: 'Dezgo (2023)',
  source: {
    platform: 'Dezgo, the free Stable Diffusion front end on dezgo.com, Text-to-image page (desktop browser, dark theme; a screen-recording demo on YouTube, 2023-06-29)',
    feature: "dark app shell with a left nav, a prompt form and an 'Output' column: the green 'Run' button flips in place to a disabled grey pill reading 'Queued...' with a small indeterminate spinner at its left while the Output canvas stays completely empty (no tile, bar, percentage or skeleton); the pictures then hard-swap into the canvas, the button returns to green 'Run' and a grey 'Seed: n' line appears (adapted to 10: a 4 + 4 + 2 block landing one picture at a time in reading order)",
    refs: [
      { url: 'https://www.youtube.com/watch?v=1wu82yR1C8Y', retrieved: '2026-10-14' },
    ],
    extrapolated: [
      'ten pictures in a 4 + 4 + 2 block landing one at a time in reading order (the free app shows one picture per run; a batch is stacked down the Output column)',
      "the button returns to 'Run' as the first picture lands and the later ones follow, where the footage has a single picture",
      "the form's content (prompt, model name) simplified, and 'More options' drawn collapsed",
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'dezgo');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; filter: ${restFilter(g)}; transform: ${restTransform(g)}; transform-origin: ${g.origin}"/></div>`;
    const nav = NAV.map((n, i) => `<span${i === 0 ? ` class="${P}-cur"` : ''}>${n}</span>`).join('');
    const root = x.el(`<div class="${P}"><div class="${P}-side">${nav}</div><div class="${P}-main"><div class="${P}-top"><i></i>Text-to-image</div><div class="${P}-ttl"><b>Generate an image from a text description</b></div><div class="${P}-cols"><div class="${P}-form"><div class="${P}-lab">Prompt</div><div class="${P}-sub">Describe how the final image should look like</div><div class="${P}-area">${x.esc(PROMPT)}</div><div class="${P}-lab" style="margin-top: 10px">Model</div><div class="${P}-sub">The AI used to generate the image.</div><div class="${P}-sel">AbsoluteReality (realistic)<i></i></div><div class="${P}-more">More options<i style="display: block; width: 4px; height: 4px; border-left: 1.3px solid #c9c9d2; border-top: 1.3px solid #c9c9d2; transform: rotate(45deg)"></i></div></div><div class="${P}-out"><div class="${P}-oh">Output</div><div class="${P}-btn ${P}-run"><i class="${P}-sp" style="display: none"></i><span>Run</span></div><div class="${P}-lic">You're provided with the AI raw output under the terms of the CreativeML Open RAIL-M license.</div><div class="${P}-seed"></div><div class="${P}-g">${tiles.map(cell).join('')}</div></div></div></div></div>`);
    const btn = root.querySelector(`.${P}-btn`), sp = root.querySelector(`.${P}-sp`), lab = btn.querySelector('span'), seed = root.querySelector(`.${P}-seed`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n) => n.querySelector('img'));
    ctx.gate(cells);

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // 'Run' is pressed; the button then flips in place to the disabled 'Queued...' pill and goes back to 'Run' when the first picture lands
        const q = s >= QUEUED && s < LAND[0];
        const pr = press(s, RUN_AT, 0.05, 0.03, 0.05);
        put('press', pr.toFixed(3), () => { btn.style.transform = pr > 0 ? `scale(${(1 - 0.06 * pr).toFixed(4)})` : 'none'; });
        put('q', q, (v) => {
          btn.className = `${P}-btn ${v ? `${P}-que` : `${P}-run`}`;
          lab.textContent = v ? 'Queued...' : 'Run';
          sp.style.display = v ? '' : 'none';
        });
        // the small spinner turns with t alone (indeterminate), only visible while queued
        const deg = Math.round((((t * 560) % 360) + 360) % 360);
        put('deg', deg, (d) => { sp.style.transform = `rotate(${d}deg)`; });

        // the Output canvas stays empty; each picture is a plain swap into it
        cells.forEach((im, i) => put(`i${i}`, s >= LAND[i], (v) => { im.style.visibility = v ? '' : 'hidden'; }));
        put('seed', s >= LAND[0], (v) => { seed.textContent = v ? SEED : ''; });
      },
    };
  },
};
