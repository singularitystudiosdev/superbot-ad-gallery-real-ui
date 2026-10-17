// Amazon Bedrock Image playground, the 2025 dark console era (a third-party screen recording on YouTube, source obAFZHXFbgI, 2025-07,
// t=76-98 s, and a 2024 light-theme walkthrough for the Run button's grey state; spec
// .tmp/clone-9e82faf1/reveal-refs/aws-bedrock-image-playground/spec.json, confidence 0.78; frames wy_bedrock_pending_dark2025.jpg,
// wy_bedrock_complete_dark2025.jpg, wy_bedrock_tile_spinner_dark2025.png, wy_bedrock_run_disabled_dark2025.png). The dark console
// shows an 'Image / Video playground' card: a left 'Configurations' pane (Action 'Generate image', Negative prompt, Response image
// with Size (px) and Number of images, Advanced configurations with Prompt strength and Seed), the output tiles in the centre and
// a full-width prompt box at the foot with the orange 'Run' button at its right. After Run the output area fills with equal square
// placeholder tiles, each a flat diagonal blue-violet to indigo gradient (#343971 to #2A2E5E) with a small pale pinwheel spinner at
// its centre; there is no text, percentage, bar, shimmer or blur. At the same instant the Run button goes grey and its play glyph
// becomes a thin arc spinner (the label stays), and the configuration controls grey out and disable until the run completes. Each
// tile then hard-swaps its spinner for a finished picture; Run turns orange again.
// Adapted to ten images: ten tiles in a 4 + 4 + 2 grid, all pending from Run and swapping one after another in reading order (the
// footage swaps its two or three tiles within one frame); the config pane re-enables, and Run returns to orange, after the last
// one. Omitted: the browser and console chrome (tab strip, bookmarks, the account menu, the services bar), the breadcrumb, the Info
// links, the model card with its vendor mark, the download icon and the OS dock. Every picture is our own meme; no logo, wordmark
// or platform font is drawn (a plain pinwheel, plain squares, system type).
import { press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-abp';
const ROOT_H = 452, CFG_W = 148, COLS = 4, GAP = 8;
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 10px; background: #0f1823; color: #e9ebed; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #2b3846; }
.${P}-top { flex: none; display: flex; align-items: center; justify-content: space-between; box-sizing: border-box; height: 34px; padding: 0 14px; border-bottom: 1px solid #2b3846; font-size: 10px; font-weight: 700; color: #f2f4f5; }
.${P}-top i { display: flex; flex-direction: column; gap: 2px; }
.${P}-top i u { display: block; width: 2px; height: 2px; border-radius: 50%; background: #c6cbd0; }
.${P}-body { flex: 1; min-height: 0; display: flex; }
.${P}-cfg { flex: none; box-sizing: border-box; width: ${CFG_W}px; padding: 10px 10px 8px; border-right: 1px solid #2b3846; overflow: hidden; }
.${P}-cb { display: flex; flex-direction: column; }
.${P}-ct { font-size: 9px; font-weight: 700; color: #f2f4f5; }
.${P}-lab { margin: 8px 0 3px; font-size: 7px; font-weight: 700; color: #dfe3e6; }
.${P}-sel { display: flex; align-items: center; justify-content: space-between; box-sizing: border-box; height: 19px; padding: 0 7px; border-radius: 4px; box-shadow: inset 0 0 0 1px #8b97a3; font-size: 7px; color: #e9ebed; }
.${P}-sel s { text-decoration: none; font-size: 6px; color: #5fb4ff; }
.${P}-sec { margin-top: 9px; padding-bottom: 3px; border-bottom: 1px solid #2b3846; font-size: 8px; font-weight: 700; color: #f2f4f5; }
.${P}-ta { box-sizing: border-box; height: 32px; margin-top: 5px; padding: 5px 6px; border-radius: 4px; box-shadow: inset 0 0 0 1px #8b97a3; font-size: 6.5px; font-style: italic; color: #8b97a3; }
.${P}-num { display: flex; align-items: center; justify-content: space-between; margin-top: 7px; font-size: 7px; color: #dfe3e6; }
.${P}-num b { display: grid; place-items: center; box-sizing: border-box; width: 38px; height: 17px; border-radius: 4px; box-shadow: inset 0 0 0 1px #8b97a3; font-weight: 400; font-size: 7px; color: #e9ebed; }
.${P}-trk { position: relative; height: 3px; margin: 8px 3px 4px; border-radius: 2px; background: #3a4757; }
.${P}-trk i { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 2px; background: #5fb4ff; }
.${P}-trk b { position: absolute; top: -3.5px; width: 10px; height: 10px; margin-left: -5px; border-radius: 50%; background: #f2f4f5; }
.${P}-out { flex: 1; min-width: 0; box-sizing: border-box; display: flex; flex-direction: column; padding: 10px 14px 12px; }
.${P}-cv { position: relative; flex: 1; min-height: 0; }
.${P}-es { position: absolute; left: 50%; top: 40%; width: 34px; height: 28px; margin: -14px 0 0 -17px; box-sizing: border-box; border-radius: 5px; box-shadow: inset 0 0 0 1.5px #2f3d4d; }
.${P}-es i { position: absolute; left: 7px; right: 7px; bottom: 6px; height: 8px; border-radius: 1px; background: #243140; }
.${P}-g { display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; }
.${P}-t { position: relative; aspect-ratio: 1; border-radius: 4px; overflow: hidden; background: linear-gradient(135deg, #343971, #2a2e5e); }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; display: grid; place-items: center; background: linear-gradient(135deg, #343971, #2a2e5e); }
.${P}-pw { display: block; width: 20px; height: 20px; }
.${P}-pw circle { fill: none; stroke: rgba(150, 160, 255, .45); stroke-width: 1; }
.${P}-pw path { fill: none; stroke: #f3f5ff; stroke-width: 1.7; stroke-linecap: round; }
.${P}-pr { flex: none; display: flex; align-items: flex-start; gap: 10px; margin-top: 12px; }
.${P}-ta2 { flex: 1; box-sizing: border-box; height: 30px; padding: 7px 9px; border-radius: 4px; background: #111d2a; box-shadow: inset 0 0 0 1px #36475a; font-size: 7.5px; line-height: 11px; color: #e9ebed; white-space: nowrap; overflow: hidden; }
.${P}-run { flex: none; display: flex; align-items: center; justify-content: center; gap: 5px; box-sizing: border-box; width: 52px; height: 22px; margin-top: 4px; border-radius: 11px; background: #ff9900; font-size: 8px; font-weight: 700; color: #0f1823; }
.${P}-play { display: block; width: 0; height: 0; border-style: solid; border-width: 3.5px 0 3.5px 6px; border-color: transparent transparent transparent #0f1823; }
.${P}-rs { display: none; width: 8px; height: 8px; box-sizing: border-box; border-radius: 50%; border: 1.3px solid rgba(141, 145, 153, .25); border-top-color: #8d9199; }
`;

const PROMPT = 'Give me a picture of a muse holding a handwritten note in a lecture hall, meme style';
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const RUN_AT = 0.06;                              // the cursor presses Run
const ISSUE = 0.16;                               // the empty canvas gives way to the ten pending tiles
// a pale pinwheel: eight short spokes inside a faint halo ring
const PINWHEEL = `<svg class="${P}-pw" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10.5"/><path d="${Array.from({ length: 8 }, (_, i) => { const a = (i * Math.PI) / 4, c = Math.cos(a), s = Math.sin(a); return `M${(12 + c * 3.2).toFixed(2)} ${(12 + s * 3.2).toFixed(2)}L${(12 + c * 8).toFixed(2)} ${(12 + s * 8).toFixed(2)}`; }).join('')}"/></svg>`;

export default {
  id: 'aws-bedrock-image-playground',
  label: 'Amazon Bedrock Image Playground (2025)',
  source: {
    platform: "Amazon Bedrock console, 'Image / Video playground' (image generation playground), dark console theme (third-party screen recording on YouTube, obAFZHXFbgI, 2025-07; Run-button grey state cross-checked against a 2024 light-theme walkthrough)",
    feature: "dark console: after Run the output area fills with equal gradient placeholder tiles, each with a pale pinwheel spinner (no text, percentage, bar or blur); the orange Run button greys and its play glyph becomes an arc spinner, the configuration controls dim and disable; each tile hard-swaps to its picture and Run returns to orange (adapted to 10: a 4 + 4 + 2 grid, all pending from Run, swapping in strict reading order)",
    refs: [
      { url: 'https://www.youtube.com/watch?v=obAFZHXFbgI', retrieved: '2026-10-14' },
      { url: 'https://www.youtube.com/watch?v=KSrjnZzMtdQ', retrieved: '2026-10-14' },
    ],
    extrapolated: "The footage shows two or three tiles (swapped within one frame, the wait editor-shortened): ten tiles in a 4 + 4 + 2 grid landing one after another in reading order, the Number of images box reading 10 and the config pane re-enabling after the last tile are extrapolated; the footage's tile spinner carries a vendor glyph at its centre, drawn here as a plain pinwheel.",
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'aws-bedrock-image-playground');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-pend">${PINWHEEL}</div></div>`;
    const sel = (v) => `<div class="${P}-sel">${v}<s>&#9660;</s></div>`;
    const sec = (n) => `<div class="${P}-sec">&#9660; ${n}</div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-top">Image / Video playground<i><u></u><u></u><u></u></i></div><div class="${P}-body"><div class="${P}-cfg"><div class="${P}-cb"><div class="${P}-ct">Configurations</div><div class="${P}-lab">Action</div>${sel('Generate image')}${sec('Negative prompt')}<div class="${P}-ta">Add negative prompt</div>${sec('Response image')}<div class="${P}-lab">Size (px)</div>${sel('512 x 512')}<div class="${P}-num">Number of images<b>10</b></div><div class="${P}-trk"><i style="width: 100%"></i><b style="left: 100%"></b></div>${sec('Advanced configurations')}<div class="${P}-num">Prompt strength<b>8</b></div><div class="${P}-trk"><i style="width: 80%"></i><b style="left: 80%"></b></div></div></div><div class="${P}-out"><div class="${P}-cv"><div class="${P}-es"><i></i></div><div class="${P}-g" style="visibility: hidden">${tiles.map(cell).join('')}</div></div><div class="${P}-pr"><div class="${P}-ta2">${x.esc(PROMPT)}</div><div class="${P}-run"><i class="${P}-play"></i><i class="${P}-rs"></i>Run</div></div></div></div></div>`);
    const run = root.querySelector(`.${P}-run`), play = root.querySelector(`.${P}-play`), rs = root.querySelector(`.${P}-rs`), cb = root.querySelector(`.${P}-cb`);
    const es = root.querySelector(`.${P}-es`), grid = root.querySelector(`.${P}-g`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), pend: n.querySelector(`.${P}-pend`), pw: n.querySelector(`.${P}-pw`), g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));
    cells.forEach((c) => { c.im.style.filter = restFilter(c.g); c.im.style.transform = restTransform(c.g); });

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // Run is pressed: it greys and its play glyph becomes an arc spinner (the label stays); the configuration controls dim and disable until the last tile has landed
        const rp = press(s, RUN_AT, 0.06, 0.06, 0.14);
        const busy = s >= RUN_AT && t < ctx.lastLand;
        put('run', `${rp.toFixed(3)}${busy}`, () => {
          run.style.transform = rp > 0 ? `scale(${(1 - 0.05 * rp).toFixed(4)})` : 'none';
          run.style.background = busy ? '#2b3643' : '#ff9900';
          run.style.color = busy ? '#8d9199' : '#0f1823';
          play.style.display = busy ? 'none' : '';
          rs.style.display = busy ? 'block' : 'none';
          cb.style.opacity = busy ? '0.45' : '1';
        });

        // the empty canvas gives way to the pending tiles
        const on = s >= ISSUE;
        put('iss', on, (v) => { es.style.display = v ? 'none' : ''; grid.style.visibility = v ? '' : 'hidden'; });

        cells.forEach((c, i) => {
          const done = t >= ctx.seq(i)[1];             // a hard swap, tile by tile, strictly in reading order
          put(`i${i}`, done, (v) => { c.im.style.visibility = v ? 'visible' : 'hidden'; c.pend.style.display = v ? 'none' : 'grid'; });
          // the pinwheel turns with t (its phase differs per tile); a function of t alone
          const deg = (((t * 300 + i * 29) % 360) + 360) % 360;
          put(`p${i}`, deg.toFixed(0), (d) => { c.pw.style.transform = `rotate(${d}deg)`; });
        });
        const rd = (((t * 420) % 360) + 360) % 360;
        put('rs', rd.toFixed(0), (d) => { rs.style.transform = `rotate(${d}deg)`; });
      },
    };
  },
};
