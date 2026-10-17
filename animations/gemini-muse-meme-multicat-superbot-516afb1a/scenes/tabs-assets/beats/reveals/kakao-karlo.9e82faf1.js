// Karlo 2.0 on karlo.ai/generation (Kakao Brain's image model, launch week), as it appears in the launch walkthrough on YouTube
// (9II8fwKol3w, 이임복의 일상IT, 2023-07-18, click t~381.1 s -> landed t=389.1 s; spec .tmp/clone-9e82faf1/reveal-refs/kakao-karlo/spec.json,
// confidence 0.80; frames wz2_karlo_pending_t384.png, wz2_karlo_landed_t389.5.png, wz2_karlo_tile_spinner_zoom_t384.png,
// wz2_karlo_btn_spinner_zoom_t384.png). A near-black two-column web app: a slim top bar ('AI Image generation' in teal, 'AI Canvas'), a
// left settings rail (Model, Number of images, Image Dimensions, Detail with Step / Guidance Scale / Seed), a composer (Prompt and
// Negative Prompt boxes with their counters and a teal 'Generate' button) and, under a divider, an 'Image' section with a result-group
// header ('N Images' chip, the date, the model and size) and the prompt echoed above the tile grid. Pressing Generate wipes the old
// grid in one frame: the button turns into a small ring spinner in a dark pill and every result slot becomes a flat dark tile with a
// grey ring carrying a teal arc and the lowercase caption 'loading'. There is no percentage, queue label, bar, shimmer or blur; in the
// footage the visible tiles then hard-swap to finished square pictures in a single frame and the button turns teal again.
// Adapted to ten images: a 4 + 4 + 2 block (the footage's page scrolls and shows only the first row), the spinners turning from
// render(t) and the tiles hard-swapping one at a time in reading order, the button returning to teal once the tenth has landed.
// Omitted: the Karlo mark and wordmark, the browser chrome, the creator's webcam overlay and the tooltip over 'Step'. The footage's
// pictures are never reproduced: every tile is our own meme, and no logo or platform font is drawn (plain shapes, system type).
import { press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-krl';
const ROOT_H = 516, RAIL_W = 100, COLS = 4, GAP = 4;
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 10px; background: #0e0d12; color: #e8e8ec; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #1c1c22; }
.${P}-top { flex: none; display: flex; align-items: center; gap: 12px; height: 22px; padding: 0 10px; background: #0a0a0e; font-size: 7.5px; font-weight: 600; color: #f1f1f4; white-space: nowrap; }
.${P}-top .${P}-on { color: #5ee6e0; }
.${P}-top i { margin-left: auto; display: grid; place-items: center; box-sizing: border-box; width: 13px; height: 13px; border-radius: 3px; box-shadow: inset 0 0 0 1px #2a2b31; font-style: normal; font-size: 7px; font-weight: 600; color: #b4b5bb; }
.${P}-body { flex: 1; min-height: 0; display: flex; }
.${P}-rail { flex: none; box-sizing: border-box; display: flex; flex-direction: column; width: ${RAIL_W}px; padding: 7px 7px 6px 8px; background: #0a0a0e; font-size: 6px; color: #e6e6ea; }
.${P}-rl { margin: 7px 0 3px; font-size: 6px; font-weight: 700; color: #f3f3f6; white-space: nowrap; }
.${P}-rl:first-child { margin-top: 0; }
.${P}-dd { display: flex; align-items: center; justify-content: space-between; box-sizing: border-box; height: 16px; padding: 0 5px; border-radius: 3px; background: #1b1c21; font-size: 6px; color: #d7d7dc; }
.${P}-dd.${P}-dm { color: #6e6f76; }
.${P}-dd svg { width: 6px; height: 6px; fill: none; stroke: #8d8e95; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
.${P}-dim { display: grid; grid-template-columns: 1fr 1fr; gap: 3px; }
.${P}-dim span { display: flex; align-items: center; gap: 2px; box-sizing: border-box; height: 15px; padding: 0 2px; border-radius: 3px; background: #1b1c21; font-size: 4.8px; color: #b9bac0; white-space: nowrap; }
.${P}-dim span::before { content: ""; flex: none; width: 5px; height: 5px; border-radius: 1px; box-shadow: inset 0 0 0 .8px #8d8e95; }
.${P}-dim .${P}-sel { box-shadow: inset 0 0 0 .8px #5ee6e0; color: #7ef0ea; }
.${P}-det { display: flex; align-items: center; gap: 4px; margin: 8px 0 0; font-size: 5.5px; color: #8d8e95; }
.${P}-det::before { content: ""; flex: 1; height: 1px; background: #232429; }
.${P}-sl { display: flex; align-items: center; gap: 4px; height: 14px; }
.${P}-sl b { position: relative; flex: 1; height: 2px; border-radius: 1px; background: #2e2f35; }
.${P}-sl b i { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 1px; background: #5ee6e0; }
.${P}-sl b s { position: absolute; top: -2.5px; width: 7px; height: 7px; margin-left: -3px; border-radius: 50%; background: #f1f1f4; }
.${P}-sl span { flex: none; box-sizing: border-box; display: grid; place-items: center; width: 22px; height: 12px; border-radius: 3px; background: #1b1c21; font-size: 5.5px; color: #d7d7dc; }
.${P}-seed { display: flex; align-items: center; box-sizing: border-box; height: 16px; padding: 0 5px; border-radius: 3px; background: #1b1c21; font-size: 6px; color: #d7d7dc; }
.${P}-main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.${P}-comp { flex: none; display: flex; flex-direction: column; padding: 5px 8px 5px; background: #121217; }
.${P}-lab { margin: 0 0 3px; font-size: 6.5px; font-weight: 700; color: #f1f1f4; }
.${P}-ta { position: relative; flex: none; box-sizing: border-box; display: flex; align-items: center; height: 17px; margin-bottom: 5px; padding: 0 6px; border-radius: 3px; background: #1a1b20; font-size: 6px; color: #e1e1e6; white-space: nowrap; overflow: hidden; }
.${P}-ta.${P}-hint { color: #5f6067; }
.${P}-ta em { position: absolute; right: 5px; bottom: 2px; font-style: normal; font-size: 4.8px; color: #85868d; }
.${P}-act { flex: none; display: flex; justify-content: flex-end; height: 15px; }
.${P}-go { display: flex; align-items: center; justify-content: center; gap: 3px; box-sizing: border-box; width: 54px; height: 15px; border-radius: 5px; background: #6cf0ea; font-size: 7px; font-weight: 700; color: #06312f; }
.${P}-go.${P}-busy { background: #232529; }
.${P}-btnring { display: none; }
.${P}-go.${P}-busy .${P}-btnring { display: block; }
.${P}-go.${P}-busy .${P}-gtx { display: none; }
.${P}-sec { flex: 1; min-height: 0; display: flex; flex-direction: column; padding: 6px 8px 0; border-top: 1px solid #232429; }
.${P}-h2 { flex: none; height: 14px; font-size: 10px; font-weight: 700; line-height: 14px; color: #f6f6f8; }
.${P}-grp { flex: none; display: flex; align-items: center; gap: 4px; height: 12px; margin-top: 3px; font-size: 5.2px; color: #a9aab1; white-space: nowrap; }
.${P}-grp span { box-sizing: border-box; height: 10px; padding: 0 3px; border-radius: 2px; background: #212228; line-height: 10px; color: #dcdce0; }
.${P}-grp u { margin-left: auto; text-decoration: none; color: #85868d; }
.${P}-echo { flex: none; display: flex; align-items: center; gap: 4px; box-sizing: border-box; height: 13px; margin-top: 3px; padding: 0 5px; border-radius: 3px; background: #17181d; font-size: 5.4px; color: #d4d4d9; white-space: nowrap; overflow: hidden; }
.${P}-echo i { font-style: italic; color: #85868d; }
.${P}-g { flex: none; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; margin-top: 4px; }
.${P}-t { position: relative; aspect-ratio: 1; border-radius: 4px; overflow: hidden; background: #1d1f23; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px; background: #232529; }
.${P}-pend span { font-size: 6px; color: #b0b0b4; white-space: nowrap; }
.${P}-ring { display: block; box-sizing: border-box; width: 13px; height: 13px; border-radius: 50%; border: 1.7px solid #55575b; border-left-color: #5ee6e0; }
.${P}-btnring { box-sizing: border-box; width: 10px; height: 10px; border-radius: 50%; border: 1.5px solid #55575b; border-left-color: #5ee6e0; }
`;

const PROMPT = 'a muse in a lecture hall holding up a handwritten note,::3 meme style, bright colours::2 warm lighting::1';
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const GEN_AT = 0.06;                              // the cursor presses Generate
const ISSUE = 0.16;                               // the old grid is wiped: ten dark tiles, the button becomes a ring spinner
const LAND = Array.from({ length: 10 }, (_, i) => 0.4 + i * 0.1425);   // tile i hard-swaps to its picture (reading order), the last at 1.68
const CHEV = '<svg viewBox="0 0 12 12"><path d="M3 4.5l3 3 3-3"/></svg>';

export default {
  id: 'kakao-karlo',
  label: 'Kakao Karlo (2023)',
  source: {
    platform: "Kakao Brain Karlo 2.0 on karlo.ai/generation (desktop Chrome, dark theme, launch week; a walkthrough screen recording on YouTube, 2023-07-18)",
    feature: "dark app shell: a left settings rail (Model, Number of images, Image Dimensions, Step / Guidance Scale / Seed), a Prompt / Negative Prompt composer with a teal 'Generate' button, then an 'Image' section whose result group header and prompt echo sit above a grid of flat dark tiles each with a grey ring and teal arc spinner and the lowercase caption 'loading' (no percentage, queue label, shimmer or blur); the button turns into a ring spinner for the whole wait and the tiles hard-swap to finished pictures (adapted to 10: a 4 + 4 + 2 block swapping one tile at a time in reading order, the button turning teal again after the tenth)",
    refs: [{ url: 'https://www.youtube.com/watch?v=9II8fwKol3w', retrieved: '2026-10-14' }],
    extrapolated: [
      "ten tiles in a 4 + 4 + 2 block (the footage generates eight and only the first row of four is on screen)",
      "tile-by-tile landing in reading order (in the footage the visible tiles all swap in one frame at 389.1 s)",
      "the compressed wait (the footage waits about 7.9 s; the beat is the ten-picture window) and the empty section before the press (the footage starts from the previous batch)",
      "the rail's dropdown value '10' and the rail and composer proportions (read from a 1920 x 1080 capture)",
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'kakao-karlo');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-pend"><i class="${P}-ring"></i><span>loading</span></div></div>`;
    const dd = (v, dim) => `<div class="${P}-dd${dim ? ` ${P}-dm` : ''}">${v}${CHEV}</div>`;
    const dims = ['512×512', '640×384', '384×640', '1024×1024'].map((d, i) => `<span${i === 0 ? ` class="${P}-sel"` : ''}>${d}</span>`).join('');
    const rail = `<div class="${P}-rail"><div class="${P}-rl">Model</div>${dd('Karlo 2.0', true)}<div class="${P}-rl">Number of images</div>${dd('10', false)}<div class="${P}-rl">Image Dimensions</div><div class="${P}-dim">${dims}</div><div class="${P}-det">Detail</div><div class="${P}-rl">Step</div><div class="${P}-sl"><b><i style="width: 100%"></i><s style="left: 100%"></s></b><span>50</span></div><div class="${P}-rl">Guidance Scale</div><div class="${P}-sl"><b><i style="width: 45%"></i><s style="left: 45%"></s></b><span>12.5</span></div><div class="${P}-rl">Seed</div><div class="${P}-seed">-1</div></div>`;
    const comp = `<div class="${P}-comp"><div class="${P}-lab">Prompt</div><div class="${P}-ta">${x.esc(PROMPT)}<em>${PROMPT.length}/250</em></div><div class="${P}-lab">Negative Prompt</div><div class="${P}-ta ${P}-hint">ex. scary, dirty<em>0/250</em></div><div class="${P}-act"><div class="${P}-go"><span class="${P}-gtx">+ Generate</span><i class="${P}-btnring"></i></div></div></div>`;
    const sec = `<div class="${P}-sec"><div class="${P}-h2">Image</div><div class="${P}-hd" style="visibility: hidden"><div class="${P}-grp"><span>10 Images</span>07/18/2023<u>Karlo 2.0&nbsp; 512×512 &nbsp;···</u></div><div class="${P}-echo"><i>Prompt</i>${x.esc(PROMPT)}</div></div><div class="${P}-g" style="visibility: hidden">${tiles.map(cell).join('')}</div></div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-top"><span class="${P}-on">AI Image generation</span><span>AI Canvas</span><i>?</i></div><div class="${P}-body">${rail}<div class="${P}-main">${comp}${sec}</div></div></div>`);
    const go = root.querySelector(`.${P}-go`), btnring = root.querySelector(`.${P}-btnring`), grid = root.querySelector(`.${P}-g`), hd = root.querySelector(`.${P}-hd`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), pend: n.querySelector(`.${P}-pend`), ring: n.querySelector(`.${P}-ring`), g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // Generate is pressed; the button is the busy indicator (a ring spinner in a dark pill) until the tenth tile has landed
        const gp = press(s, GEN_AT, 0.06, 0.06, 0.14);
        put('gp', gp.toFixed(3), () => { go.style.transform = gp > 0 ? `scale(${(1 - 0.05 * gp).toFixed(4)})` : 'none'; });
        const busy = s >= ISSUE && s < LAND[9];
        put('busy', busy, (v) => { go.className = `${P}-go${v ? ` ${P}-busy` : ''}`; });
        const bd = (((t * 420) % 360) + 360) % 360;
        put('bd', bd.toFixed(0), (d) => { btnring.style.transform = `rotate(${d}deg)`; });

        // the group header and the ten dark tiles come up in one frame
        const on = s >= ISSUE;
        put('iss', on, (v) => { grid.style.visibility = v ? '' : 'hidden'; hd.style.visibility = v ? '' : 'hidden'; });

        cells.forEach((c, i) => {
          const a = LAND[i];
          const done = s >= a;                         // a hard swap: the tile is the picture from this frame on
          put(`i${i}`, done, (v) => { c.im.style.visibility = v ? '' : 'hidden'; c.pend.style.display = v ? 'none' : ''; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
          // the ring turns with t (its phase differs per tile); a function of t alone, covered or not
          const deg = (((t * 420 + i * 47) % 360) + 360) % 360;
          put(`r${i}`, deg.toFixed(0), (d) => { c.ring.style.transform = `rotate(${d}deg)`; });
        });
      },
    };
  },
};
