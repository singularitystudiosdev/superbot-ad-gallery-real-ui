// Scenario, the generative-art platform for game assets, in its web app app.scenario.com 'Generate Images' view (YouTube uW1pVvSvPoo,
// 2024-02-05, pending grid t=1-7 s, and the official walkthrough vbnZexhvG8Y, 2025-10-14, panel and filled grid t=56-60 s; spec
// .tmp/clone-9e82faf1/reveal-refs/scenario/spec.json, confidence 0.62; frames u_scenario_spinners_t3.0, u_scenario_resolving_t5.0,
// u_scenario_genpanel_t1_56.5, u_scenario_gridfilled_t1_59.5). A near-black two-column shell (#0d1117): a left 'Generate Images'
// panel holding a model chip ('SDXL'), a prompt made of removable tag chips and a full-width blue 'Generate' button with the
// '+ Negative Prompt' and '+ Reference Image' rows under it, and a large canvas on the right under a 'Clear Session' button. After
// Generate the canvas fills with dark rounded tiles (#1b1f24), each with a thin white ring spinner and the fixed word 'Generating'
// under it; there is no percentage, queue label or shimmer, and a tile simply hands the spinner over to its finished picture
// (hard swap, one tile at a time) while the others keep spinning.
// Adapted to ten images: ten square tiles in a 4 + 4 + 2 block resolving in strict reading order, the ring spinners turning from t.
// Omitted: the top bar's 'Upgrade Plan' button, the credit count on the button, the account and search chrome of the real top bar and the creator's browser chrome. The
// footage's pictures are never reproduced: every tile is our own meme, and no logo, wordmark or platform font is drawn (a plain ring,
// plain squares, system type).
import { press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-scn';
const ROOT_H = 376, LEFT_W = 176, COLS = 4, GAP = 6;
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 12px; background: #0d1117; color: #e6eaee; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #1c232b; }
.${P}-top { flex: none; display: flex; align-items: center; gap: 8px; height: 30px; padding: 0 10px; box-shadow: 0 1px 0 #161c23; }
.${P}-srch { flex: none; display: flex; align-items: center; gap: 5px; box-sizing: border-box; width: 150px; height: 18px; padding: 0 7px; border-radius: 9px; background: #151b22; box-shadow: inset 0 0 0 1px #232b34; font-size: 7px; color: #7d8791; }
.${P}-srch i { display: block; width: 6px; height: 6px; border-radius: 50%; box-shadow: inset 0 0 0 1.2px #7d8791; }
.${P}-sp { flex: 1; }
.${P}-body { flex: 1; min-height: 0; display: flex; }
.${P}-left { flex: none; box-sizing: border-box; display: flex; flex-direction: column; width: ${LEFT_W}px; padding: 10px 10px 10px 12px; box-shadow: 1px 0 0 #161c23; }
.${P}-ttl { flex: none; font-size: 10.5px; font-weight: 600; line-height: 14px; color: #ffffff; }
.${P}-model { flex: none; display: flex; align-items: center; gap: 6px; height: 26px; margin-top: 8px; padding: 0 0 0 1px; font-size: 7.5px; font-weight: 500; color: #eef1f4; }
.${P}-model i { flex: none; display: block; width: 16px; height: 16px; border-radius: 4px; background: linear-gradient(140deg, #2f6f5e, #17352f); }
.${P}-model b { margin-left: auto; font-weight: 400; font-size: 9px; color: #8b96a0; }
.${P}-ph { flex: none; display: flex; align-items: center; gap: 5px; height: 16px; margin-top: 4px; font-size: 7px; color: #cbd2d9; }
.${P}-ph em { margin-left: auto; font-style: normal; color: #7d8791; }
.${P}-tags { flex: none; display: flex; flex-wrap: wrap; gap: 3px; margin-top: 4px; }
.${P}-tags span { display: flex; align-items: center; gap: 3px; box-sizing: border-box; height: 12px; padding: 0 4px; border-radius: 3px; background: #19202a; font-size: 6px; color: #cfd6dd; white-space: nowrap; }
.${P}-tags span::after { content: "\\00d7"; font-size: 7px; color: #7d8791; }
.${P}-add { margin-top: 4px; font-size: 6px; line-height: 9px; color: #5f6b76; }
.${P}-go { flex: none; display: grid; place-items: center; height: 22px; margin-top: auto; border-radius: 4px; background: #1d78d6; font-size: 8px; font-weight: 600; color: #ffffff; }
.${P}-more { flex: none; display: flex; flex-direction: column; gap: 7px; margin-top: 8px; font-size: 6.5px; color: #aab3bc; }
.${P}-cv { flex: 1; min-width: 0; box-sizing: border-box; padding: 8px 10px; }
.${P}-bar { display: flex; align-items: center; height: 18px; margin-bottom: 8px; }
.${P}-clr { display: grid; place-items: center; height: 17px; padding: 0 7px; border-radius: 4px; background: #1a212a; font-size: 6.5px; font-weight: 600; color: #e6eaee; }
.${P}-zm { margin-left: auto; display: flex; align-items: center; gap: 4px; }
.${P}-zm i { display: block; width: 34px; height: 2px; border-radius: 1px; background: #3a4450; }
.${P}-zm b { display: block; width: 7px; height: 7px; margin-left: -18px; border-radius: 50%; background: #e6eaee; }
.${P}-g { display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; }
.${P}-t { position: relative; aspect-ratio: 1; border-radius: 5px; overflow: hidden; background: #1b1f24; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-c { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; background: #1b1f24; }
.${P}-ring { display: block; width: 19px; height: 19px; border-radius: 50%; background: conic-gradient(from 0deg, rgba(255, 255, 255, 0) 0deg, #ffffff 50deg, #ffffff 270deg, rgba(255, 255, 255, 0) 310deg); -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 2.2px), #000 calc(100% - 1.7px)); mask: radial-gradient(farthest-side, transparent calc(100% - 2.2px), #000 calc(100% - 1.7px)); }
.${P}-c span { font-size: 6.5px; color: #e6eaee; white-space: nowrap; }
`;

const TAGS = ['muse', 'lecture hall', 'handwritten note', 'meme', 'bright colours', 'UHD', '8k', 'detailed face', 'film grain', 'depth of field', 'high quality'];
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const GEN_AT = 0.06;                              // the cursor presses Generate
const ISSUE = 0.16;                               // the canvas fills with ten dark 'Generating' tiles
const LAND = Array.from({ length: 10 }, (_, i) => 0.4 + i * 0.1425);   // tile i swaps its spinner for the picture (reading order), the last at 1.68

export default {
  id: 'scenario',
  label: 'Scenario (2024)',
  source: {
    platform: 'Scenario web app, app.scenario.com Generate Images (desktop browser, dark theme; a 2024 tutorial recording and the 2025 official walkthrough on YouTube)',
    feature: "dark two-column shell: a left 'Generate Images' panel (model chip, tag-chip prompt, blue Generate button) and a right canvas of dark tiles each with a white ring spinner and the word 'Generating' (no percentage, queue label or shimmer) swapping to the finished pictures one tile at a time (adapted to 10: a 4 + 4 + 2 block resolving in strict reading order; the credit count on the button is omitted)",
    refs: [
      { url: 'https://www.youtube.com/watch?v=uW1pVvSvPoo', retrieved: '2026-10-14' },
      { url: 'https://www.youtube.com/watch?v=vbnZexhvG8Y', retrieved: '2026-10-14' },
    ],
    extrapolated: ['ten tiles in a 4 + 4 + 2 block resolving in strict reading order (the footage resolves a mixed batch at staggered times, in no fixed order)', 'every tile finishing within the window (in the 2024 clip two tiles were still Generating when it ended)'],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'scenario');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-c"><i class="${P}-ring"></i><span>Generating</span></div></div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-top"><div class="${P}-srch"><i></i>Search</div><div class="${P}-sp"></div></div><div class="${P}-body"><div class="${P}-left"><div class="${P}-ttl">Generate Images</div><div class="${P}-model"><i></i>SDXL<b>&rsaquo;</b></div><div class="${P}-ph">&#9662; Prompt<em>&#9998;</em></div><div class="${P}-tags">${TAGS.map((n) => `<span>${x.esc(n)}</span>`).join('')}</div><div class="${P}-add">Add objects, colors, places, characters...</div><div class="${P}-go">Generate</div><div class="${P}-more"><span>+ Negative Prompt</span><span>+ Reference Image</span></div></div><div class="${P}-cv"><div class="${P}-bar"><div class="${P}-clr">Clear Session</div><div class="${P}-zm"><i></i><b></b></div></div><div class="${P}-g" style="visibility: hidden">${tiles.map(cell).join('')}</div></div></div></div>`);
    const go = root.querySelector(`.${P}-go`), grid = root.querySelector(`.${P}-g`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), cv: n.querySelector(`.${P}-c`), ring: n.querySelector(`.${P}-ring`), g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // Generate is pressed (it keeps its label); the canvas fills with the pending tiles
        const gp = press(s, GEN_AT, 0.06, 0.06, 0.14);
        put('go', gp.toFixed(3), () => { go.style.transform = gp > 0 ? `scale(${(1 - 0.05 * gp).toFixed(4)})` : 'none'; });
        put('iss', s >= ISSUE, (v) => { grid.style.visibility = v ? '' : 'hidden'; });

        cells.forEach((c, i) => {
          const landed = s >= LAND[i];
          put(`i${i}`, landed, (v) => { c.im.style.visibility = v ? '' : 'hidden'; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
          put(`c${i}`, landed, (v) => { c.cv.style.display = v ? 'none' : ''; });
          // the ring turns with t (its phase differs per tile); a function of t alone, and at rest once the tile has landed
          const deg = landed ? 0 : (((t * 500 + i * 41) % 360) + 360) % 360;
          put(`r${i}`, deg.toFixed(0), (d) => { c.ring.style.transform = `rotate(${d}deg)`; });
        });
      },
    };
  },
};
