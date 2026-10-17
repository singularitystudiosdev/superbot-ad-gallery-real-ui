// DiffusionBee, the free Stable Diffusion / FLUX Mac app, 'Text to image' (YouTube l3w8kdfDpxQ, 2023-10-06, a continuous macOS screen
// recording, t~164-176 s; and the later dark FLUX build, oDDHELt9AmI, 2026-01-11, t~234-250 s; spec
// .tmp/clone-9e82faf1/reveal-refs/diffusionbee/spec.json, confidence 0.62; frames r_light_pending_t170.png, r_dark_pending_t244.png).
// A narrow icon rail, a left sidebar (prompt, Advanced Options, Model, Resolution, Number of images, Seed, Sampling Steps, and at the
// foot the blue 'Add to Queue' and 'Generate' buttons, 'Generate' reading 'Stop all' while it runs) and a large result canvas. Until a
// run the canvas holds the empty-state illustration ('No images to display'); pressing Generate replaces it with one rounded
// placeholder tile per image at the output aspect, flat near-black (#0F0D0E) on a #0C0C0D canvas, each with one small indeterminate
// spinner (a barely-visible ring and a blue #4158FD arc turning); no percentage, no bar, no caption, no blur preview. A finished
// image hard-swaps into its tile. The title bar carries a small turning activity spinner while it runs.
// Adapted to ten: ten tiles queued at once (4 + 4 + 2), landing one after another in strict order. Omitted: the Styles gallery below
// the settings, the macOS menu bar and window chrome, the creator's browser behind the window; the bee mark is not drawn.
import { seg, press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-dbe';
const ROOT_H = 408, RAIL_W = 32, SIDE_W = 162, COLS = 4, GAP = 8;
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 10px; background: #0c0c0d; color: #e7e7ea; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #232326; }
.${P}-top { flex: none; display: flex; align-items: center; height: 28px; padding: 0 12px; font-size: 9.5px; font-weight: 600; color: #f1f1f3; }
.${P}-top b { flex: 1; text-align: center; font-weight: 600; padding-left: 50px; }
.${P}-act { flex: none; width: 12px; height: 12px; margin-right: 10px; border-radius: 50%; box-shadow: inset 0 0 0 1.4px #333338; }
.${P}-act i { display: block; width: 12px; height: 12px; border-radius: 50%; background: conic-gradient(from 0deg, rgba(231, 231, 234, 0) 0deg, #e7e7ea 120deg, rgba(231, 231, 234, 0) 125deg); -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 1.6px), #000 calc(100% - 1.4px)); mask: radial-gradient(farthest-side, transparent calc(100% - 1.6px), #000 calc(100% - 1.4px)); }
.${P}-menu { flex: none; display: flex; flex-direction: column; gap: 2px; width: 10px; }
.${P}-menu i { display: block; height: 1.2px; border-radius: 1px; background: #bdbdc3; }
.${P}-body { flex: 1; min-height: 0; display: flex; }
.${P}-rail { flex: none; display: flex; flex-direction: column; align-items: center; gap: 9px; box-sizing: border-box; width: ${RAIL_W}px; padding: 8px 0; background: #0a0a0b; }
.${P}-rail i { display: block; width: 14px; height: 14px; border-radius: 4px; box-shadow: inset 0 0 0 1.3px #6a6a72; }
.${P}-rail i.${P}-on { width: 20px; height: 20px; border-radius: 6px; background: #1f5fe8; box-shadow: inset 0 0 0 4px #1f5fe8, inset 0 0 0 5.4px #fff; }
.${P}-side { flex: none; box-sizing: border-box; display: flex; flex-direction: column; gap: 7px; width: ${SIDE_W}px; padding: 4px 8px 8px; background: #121214; }
.${P}-prompt { flex: none; box-sizing: border-box; height: 66px; padding: 6px 7px; border-radius: 5px; background: #0e0e10; box-shadow: inset 0 0 0 1px #2c52c4; font-size: 8px; line-height: 11px; color: #e1e1e5; overflow: hidden; }
.${P}-adv { flex: none; display: flex; align-items: center; justify-content: space-between; height: 14px; font-size: 8px; font-weight: 600; color: #f0f0f2; }
.${P}-sw { position: relative; width: 20px; height: 11px; border-radius: 6px; background: #1f5fe8; }
.${P}-sw::after { content: ""; position: absolute; right: 1.5px; top: 1.5px; width: 8px; height: 8px; border-radius: 50%; background: #fff; }
.${P}-f { flex: none; display: flex; align-items: center; justify-content: space-between; height: 20px; font-size: 7.5px; font-weight: 500; color: #d9d9de; white-space: nowrap; }
.${P}-f span { display: flex; align-items: center; justify-content: space-between; gap: 5px; box-sizing: border-box; height: 18px; padding: 0 6px; border-radius: 5px; background: #1b1b1e; font-size: 7.5px; color: #e9e9ec; }
.${P}-f.${P}-m span { flex: 1; margin-left: 8px; }
.${P}-f.${P}-m { gap: 0; }
.${P}-f .${P}-two { display: flex; gap: 4px; padding: 0; background: none; }
.${P}-f .${P}-two em { font-style: normal; box-sizing: border-box; height: 18px; padding: 0 6px; border-radius: 5px; background: #1b1b1e; line-height: 18px; font-size: 7.5px; }
.${P}-btns { margin-top: auto; flex: none; display: flex; gap: 6px; }
.${P}-btns b { flex: 1; display: grid; place-items: center; height: 22px; border-radius: 6px; background: #1f5fe8; font-size: 8px; font-weight: 600; color: #fff; white-space: nowrap; }
.${P}-cv { position: relative; flex: 1; min-width: 0; background: #0b0b0c; }
.${P}-es { position: absolute; left: 0; right: 0; top: 50%; display: flex; flex-direction: column; align-items: center; gap: 4px; transform: translateY(-58%); font-size: 8px; color: #7a7a82; }
.${P}-es i { position: relative; display: block; width: 52px; height: 42px; margin-bottom: 6px; border-radius: 8px; background: #1b1b1e; }
.${P}-es i::after { content: ""; position: absolute; left: 12px; right: 12px; top: 10px; bottom: 10px; border-radius: 4px; box-shadow: inset 0 0 0 2px #2c2c31; }
.${P}-es b { font-size: 9px; font-weight: 600; color: #b9b9c0; }
.${P}-g { position: absolute; left: 10px; right: 10px; top: 10px; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; }
.${P}-t { position: relative; aspect-ratio: 1024 / 1216; border-radius: 6px; overflow: hidden; background: #0f0d0e; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; display: grid; place-items: center; background: #0f0d0e; }
.${P}-ring { position: relative; display: block; width: 20px; height: 20px; border-radius: 50%; box-shadow: inset 0 0 0 1.6px #1b181e; }
.${P}-ring::after { content: ""; position: absolute; inset: 0; border-radius: 50%; background: conic-gradient(from 0deg, #4158fd 0deg, #4158fd 42deg, transparent 43deg); -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 1.6px)); mask: radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 1.6px)); }
`;

const PROMPT = 'a muse holding up a handwritten note in a lecture hall, meme style, bright colours';
const GEN_AT = 0.05;       // Generate is pressed this long after the card enters
const ISSUE = 0.12;        // the empty state gives way to the ten placeholders
const FADE = 0.04;         // a placeholder gives way to its picture over this long (the app hard-swaps)

export default {
  id: 'diffusionbee',
  label: 'DiffusionBee (2023)',
  source: {
    platform: 'DiffusionBee (diffusionbee.com), the macOS app, Text to image (a continuous screen recording on YouTube, 2023-10-06, with the later dark build from 2026-01-11)',
    feature: "sidebar prompt and a blue Generate button that reads 'Stop all' while running (with 'Add to Queue' beside it); the empty-state illustration replaced by rounded placeholder tiles at the output aspect, each with one small indeterminate spinner (ring plus blue arc), no percentage or bar, a finished image hard-swapping in (adapted to 10: ten queued tiles, 4 + 4 + 2, landing in strict order)",
    refs: [
      { url: 'https://www.youtube.com/watch?v=l3w8kdfDpxQ', retrieved: '2026-10-14' },
      { url: 'https://www.youtube.com/watch?v=oDDHELt9AmI', retrieved: '2026-10-14' },
    ],
    // one or two tiles were ever on screen; ten at once, and their order, are ours
    extrapolated: ['ten placeholder tiles at once in a 4 + 4 + 2 block, resolving in strict order', 'the sidebar fields (Number of images 10) filled in for the beat'],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'diffusionbee');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-pend"><i class="${P}-ring"></i></div></div>`;
    const railIcons = `<i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i class="${P}-on"></i>`;
    const root = x.el(`<div class="${P}"><div class="${P}-top"><div class="${P}-menu"><i></i><i></i><i></i></div><b>Text to image</b><span class="${P}-act" style="visibility: hidden"><i></i></span></div><div class="${P}-body"><div class="${P}-rail">${railIcons}</div><div class="${P}-side"><div class="${P}-prompt">${x.esc(PROMPT)}</div><div class="${P}-adv">Advanced Options<i class="${P}-sw"></i></div><div class="${P}-f ${P}-m">Model<span>FLUX.1-schnell<small>&#8964;</small></span></div><div class="${P}-f">Resolution<div class="${P}-two"><em>1024</em><em>1216</em></div></div><div class="${P}-f">Number of images<span>10</span></div><div class="${P}-f">Seed<span>-1</span></div><div class="${P}-f">Sampling Steps<span>2</span></div><div class="${P}-btns"><b>Add to Queue</b><b class="${P}-go">Generate</b></div></div><div class="${P}-cv"><div class="${P}-es"><i></i><b>No images to display</b>Enter a prompt to generate images using AI.</div><div class="${P}-g" style="visibility: hidden">${tiles.map(cell).join('')}</div></div></div></div>`);
    const go = root.querySelector(`.${P}-go`), es = root.querySelector(`.${P}-es`), grid = root.querySelector(`.${P}-g`), act = root.querySelector(`.${P}-act`), actI = act.firstElementChild;
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), pend: n.querySelector(`.${P}-pend`), ring: n.querySelector(`.${P}-ring`), g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));

    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const gp = press(t, ctx.cardIn + GEN_AT, 0.05, 0.05, 0.12);
        put('gp', gp.toFixed(3), () => { go.style.transform = gp > 0 ? `scale(${(1 - 0.06 * gp).toFixed(4)})` : 'none'; });

        // pressing Generate swaps the empty state for the placeholders; the button reads 'Stop all' until the last picture is in
        const issued = t >= ctx.cardIn + ISSUE;
        put('iss', issued, (v) => { es.style.display = v ? 'none' : ''; grid.style.visibility = v ? '' : 'hidden'; });
        const running = t >= ctx.cardIn + GEN_AT && t < ctx.lastLand;
        put('run', running, (v) => { go.textContent = v ? 'Stop all' : 'Generate'; act.style.visibility = v ? '' : 'hidden'; });
        // the title bar's activity spinner turns with t
        put('act', Math.round(t * 540) % 360, (d) => { actI.style.transform = `rotate(${d}deg)`; });

        cells.forEach((c, i) => {
          const land = ctx.seq(i)[1];
          const f = seg(t, land - FADE, land);
          put(`i${i}`, t >= land - FADE, (v) => { c.im.style.visibility = v ? '' : 'hidden'; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
          put(`c${i}`, f.toFixed(3), () => {
            if (f >= 1) { c.pend.style.display = 'none'; c.pend.style.opacity = ''; } else { c.pend.style.display = ''; c.pend.style.opacity = f > 0 ? (1 - f).toFixed(3) : ''; }
          });
          // each spinner arc turns with t (phase differs per tile); a function of t alone, covered or not
          const deg = (((t * 540 + i * 61) % 360) + 360) % 360;
          put(`r${i}`, deg.toFixed(0), (d) => { c.ring.style.transform = `rotate(${d}deg)`; });
        });
      },
    };
  },
};
