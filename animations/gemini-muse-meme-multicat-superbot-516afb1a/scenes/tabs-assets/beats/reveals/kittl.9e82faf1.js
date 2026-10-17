// Kittl's AI image generator in its design editor, app.kittl.com (YouTube VZ5Ug7_dVHc, 2026-04-10, t=166-173 s, with the panel's options
// from FYjLmlTHe8A; spec .tmp/clone-9e82faf1/reveal-refs/kittl/spec.json, confidence 0.70; frames t_003_pending.png, t_004_pending_label_zoom.png,
// t_005_partial_lastpending.png, t_006_complete.png, t_007_panel_options.png). A near-black editor (#060A10): a thin left icon rail, a top
// strip with 'Untitled Project' and a white 'Share' button, a canvas with a white 'Artboard 1', and a floating dark rounded panel with
// the tabs 'Generate Image | Remix Image | Generate Video', a blue-outlined prompt box (a small reference thumbnail, the prompt, a
// 'Prompt builder' row), option chips (Style, a model chip, the aspect '1:1', a count) and a white 'Generate' button. Pressing it drops a
// SOLID purple (#8B6AD6) rounded tile into the canvas with, in its top-left corner, a small white spinner, the bold word 'Generating' and
// a live MM:SS countdown that ticks 00:30 down to 00:19 (about one second per second) before the tile hard-swaps to the image in one
// frame (no blur, no fade, no percentage, no queue label).
// Adapted to ten images: ten purple tiles in a 5 x 2 block, each counting 00:30 down to 00:19 over its own wait and hard-swapping to its
// image in reading order, the count chip reading '10'. Omitted: the Kittl logo in the rail, the 'Install' pill, the right-hand tools
// column, the 'Learning Hub' tooltip, the credit counter and its 'Upgrade' button, and the footage's own pictures: every tile is our own meme.
import { press, clamp } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT, MONO_FONT } from './util.9e82faf1.js';

const P = 'rv-kt';
const ROOT_H = 456, RAIL_W = 30, COLS = 5, GAP = 6;
const CSS = `
.${P} { box-sizing: border-box; display: flex; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 12px; background: #060a10; color: #e6e9ee; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #151b24; }
.${P}-rail { flex: none; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; gap: 9px; width: ${RAIL_W}px; padding: 12px 0; box-shadow: inset -1px 0 0 #10161e; }
.${P}-rail i { display: block; width: 9px; height: 9px; border-radius: 2.5px; box-shadow: inset 0 0 0 1.2px #8f98a5; }
.${P}-rail i:first-child { width: 11px; height: 11px; border-radius: 50%; background: #e6e9ee; box-shadow: none; margin-bottom: 4px; }
.${P}-main { flex: 1; min-width: 0; display: flex; flex-direction: column; padding: 0 14px 10px; }
.${P}-top { flex: none; display: flex; align-items: center; justify-content: flex-end; gap: 9px; height: 30px; font-size: 7px; color: #8f98a5; }
.${P}-top b { font-weight: 400; }
.${P}-top span { height: 14px; padding: 0 8px; border-radius: 4px; background: #f4f5f7; font-size: 7px; font-weight: 600; line-height: 14px; color: #060a10; }
.${P}-body { position: relative; flex: none; height: 240px; }
.${P}-ab { position: absolute; left: 70px; top: 8px; }
.${P}-ab small { display: block; height: 11px; font-size: 6px; line-height: 11px; color: #8f98a5; }
.${P}-ab div { width: 190px; height: 190px; background: #fff; }
.${P}-g { position: absolute; left: 0; right: 0; top: 0; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; }
.${P}-t { position: relative; aspect-ratio: 870 / 1024; overflow: hidden; border-radius: 6px; background: #8b6ad6; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; border-radius: 6px; background: linear-gradient(135deg, #8b6ad6 0%, #8b6ad6 45%, #9b7ddb 100%); }
.${P}-lb { position: absolute; left: 5px; top: 5px; right: 4px; display: flex; align-items: center; gap: 3px; white-space: nowrap; }
.${P}-sp { flex: none; display: block; width: 6px; height: 6px; border-radius: 50%; background: conic-gradient(from 0deg, rgba(255, 255, 255, 0) 0deg, #fff 300deg, rgba(255, 255, 255, 0) 360deg); -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 1.3px), #000 calc(100% - 0.9px)); mask: radial-gradient(farthest-side, transparent calc(100% - 1.3px), #000 calc(100% - 0.9px)); }
.${P}-lb b { font-size: 5.8px; font-weight: 700; color: #fff; }
.${P}-lb em { font-style: normal; font-family: ${MONO_FONT}; font-size: 5.2px; color: #d7ccf5; }
.${P}-panel { flex: none; align-self: center; box-sizing: border-box; width: 430px; margin-top: 10px; padding: 7px 7px 7px; border-radius: 10px; background: #12171e; box-shadow: 0 0 0 1px #232a34; }
.${P}-tabs { display: flex; gap: 12px; height: 14px; padding: 0 3px; font-size: 7px; line-height: 14px; color: #8f98a5; white-space: nowrap; }
.${P}-tabs .${P}-on { color: #f1f3f6; }
.${P}-ta { position: relative; box-sizing: border-box; height: 58px; margin-top: 4px; padding: 6px 8px; border-radius: 6px; background: #0c1016; box-shadow: 0 0 0 1px #2f7de1; font-size: 7.5px; line-height: 11px; color: #e6e9ee; }
.${P}-ta u { display: block; width: 14px; height: 14px; margin-bottom: 4px; border-radius: 3px; background: linear-gradient(135deg, #3a4452, #20262f); }
.${P}-pb { position: absolute; left: 8px; bottom: 5px; font-size: 6.5px; color: #aab2be; }
.${P}-opts { display: flex; align-items: center; gap: 12px; height: 24px; margin-top: 3px; padding: 0 3px; font-size: 7px; color: #cdd2da; white-space: nowrap; }
.${P}-opts i { display: inline-block; vertical-align: -1px; width: 6px; height: 6px; margin-right: 3px; border-radius: 2px; box-shadow: inset 0 0 0 1.1px #8f98a5; }
.${P}-opts .${P}-osp { flex: 1; }
.${P}-opts .${P}-ogo { height: 18px; padding: 0 9px; border-radius: 5px; background: #f4f5f7; font-size: 7.5px; font-weight: 600; line-height: 18px; color: #060a10; }
.${P}-bar { flex: none; align-self: center; display: flex; align-items: center; gap: 6px; height: 24px; margin-top: 8px; font-size: 7px; color: #aab2be; }
.${P}-bar i { display: block; width: 14px; height: 14px; border-radius: 4px; box-shadow: inset 0 0 0 1px #2a323d; }
.${P}-bar i.${P}-on { background: #1c2430; box-shadow: inset 0 0 0 1px #3a4452; }
.${P}-bar span { box-sizing: border-box; height: 20px; padding: 0 9px; border-radius: 6px; background: #12171e; box-shadow: inset 0 0 0 1px #232a34; line-height: 20px; }
`;

const PROMPT = 'A muse in a lecture hall holding up a handwritten note, meme style, big eyes, happy';
const REF = 1.84;                                  // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const GEN_AT = 0.06;                               // the cursor presses Generate
const ISSUE = 0.16;                                // the empty artboard gives way to ten purple 'Generating' tiles, all at 00:30
const LAND = Array.from({ length: 10 }, (_, i) => 0.5 + i * 0.145);   // tile i hard-swaps to its image (reading order), the last at 1.805
const FROM = 30, TO = 19;                          // the footage's countdown: 00:30 at the start, 00:19 when the tile landed

// tile i's countdown: 00:30 when it appears, 00:19 at the moment it lands, one tick per equal share of its own wait
const clockOf = (s, i) => {
  const f = clamp((s - ISSUE) / (LAND[i] - ISSUE));
  return `00:${String(FROM - Math.floor(f * (FROM - TO + 0.99))).padStart(2, '0')}`;
};

export default {
  id: 'kittl',
  label: 'Kittl (2026)',
  source: {
    platform: "Kittl's AI image generator in the design editor, app.kittl.com (desktop browser, dark theme; a third-party screen recording on YouTube, 2026-04-10)",
    feature: "near-black editor with the floating 'Generate Image | Remix Image | Generate Video' panel; each pending image is a solid purple rounded tile with a white spinner, bold 'Generating' and a live MM:SS countdown (00:30 down to 00:19), hard-swapping to the image (adapted to 10: a 5 x 2 block of tiles landing in reading order)",
    refs: [
      { url: 'https://www.youtube.com/watch?v=VZ5Ug7_dVHc', retrieved: '2026-10-14' },
      { url: 'https://www.youtube.com/watch?v=FYjLmlTHe8A', retrieved: '2026-10-14' },
    ],
    extrapolated: "the footage shows a single purple tile at count 1 (a 2-up pending grid was never sampled); the ten tiles, the per-tile countdowns each ending at 00:19 as their tile lands, and the landing in reading order are not in the footage",
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'kittl');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-pend"><div class="${P}-lb"><i class="${P}-sp"></i><b>Generating</b><em>00:30</em></div></div></div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-rail"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="${P}-main"><div class="${P}-top"><b>Untitled Project</b><span>Share</span></div><div class="${P}-body"><div class="${P}-ab"><small>Artboard 1</small><div></div></div><div class="${P}-g" style="visibility: hidden">${tiles.map(cell).join('')}</div></div><div class="${P}-panel"><div class="${P}-tabs"><span class="${P}-on">Generate Image</span><span>Remix Image</span><span>Generate Video</span></div><div class="${P}-ta"><u></u>${x.esc(PROMPT)}<div class="${P}-pb">Prompt builder</div></div><div class="${P}-opts"><span><i></i>Style</span><span><i></i>Nano Banana Pro</span><span><i></i>1:1</span><span><i></i>10</span><span class="${P}-osp"></span><span class="${P}-ogo">Generate</span></div></div><div class="${P}-bar"><i class="${P}-on"></i><i></i><i></i><i></i><span>57%</span></div></div></div>`);
    const q = (s) => root.querySelector(s);
    const go = q(`.${P}-opts .${P}-ogo`), ab = q(`.${P}-ab`), grid = q(`.${P}-g`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), pend: n.querySelector(`.${P}-pend`), sp: n.querySelector(`.${P}-sp`), clk: n.querySelector(`.${P}-lb em`), g: tiles[i] }));
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
        put('go', gp.toFixed(3), () => { go.style.transform = gp > 0 ? `scale(${(1 - 0.08 * gp).toFixed(4)})` : 'none'; });
        put('iss', s >= ISSUE, (v) => { ab.style.display = v ? 'none' : ''; grid.style.visibility = v ? '' : 'hidden'; });

        cells.forEach((c, i) => {
          const done = s >= LAND[i];
          put(`i${i}`, done, (v) => { c.im.style.visibility = v ? '' : 'hidden'; c.pend.style.display = v ? 'none' : ''; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
          if (!done) {
            put(`c${i}`, clockOf(s, i), (v) => { c.clk.textContent = v; });
            // the spinner turns with t (its phase differs per tile); a function of t alone
            const deg = (((t * 480 + i * 41) % 360) + 360) % 360;
            put(`r${i}`, deg.toFixed(0), (d) => { c.sp.style.transform = `rotate(${d}deg)`; });
          }
        });
      },
    };
  },
};
