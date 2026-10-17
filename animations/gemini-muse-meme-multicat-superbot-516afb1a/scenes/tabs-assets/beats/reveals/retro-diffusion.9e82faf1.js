// Retro Diffusion for Aseprite (YouTube nr8gPejMoEk 'How to create pixel art with Retro Diffusion (Basic settings guide)', Astropulse,
// Retro Diffusion's own channel, published 2024-06-01, uncut 1080p screen recording, t~94-116 s, three identical cycles at t~94-113,
// ~124-134 and ~150-159; also dZGhL_7dd_Y 2026-01-30; spec .tmp/clone-9e82faf1/reveal-refs/retro-diffusion/spec.json, confidence 0.76; frames
// ap_retro_01..22). The Aseprite 1.3 editor in its dark theme: a menu bar and a 'Sprite-0001' tab, a tool strip with a green PIXEL-PERFECT
// toggle, a palette column on the left, a light grey transparency checkerboard canvas, a tool rail and, at the right edge, the extension's
// dark dock: its tabs, a prompt field and a yellow-green 'Generate' button above a 'Generation Preview' panel. The preview well starts as
// flat multicolour pixel noise under the caption 'Loading model'; then the caption counts 'Generating... N/16 steps in batch 1/1' while a
// determinate blue bar fills with the steps and the well sharpens, step by step, from quantised noise into the sprite; then 'Generation
// complete', the bar full, the seed field ('39468825') and the live 'Send to canvas' / 'Close' buttons. A floating dark console window
// over the canvas runs in parallel ('Starting Image Generator...', 'Connected', 'Loading primary model', 'Loaded model to cuda ...',
// 'Text to Image generating | quality | ...', a bar with 'N/16 at 3.14 it/s') and closes itself when the job ends. Nothing spins, no
// percentage, no blur: every state is determinate.
// Adapted to ten images: after 'Generation complete' the ten results are sent to the canvas and land as a 5 x 2 block of pixel-art frames
// in strict reading order (image-rendering: pixelated). The preview well draws its own quantised noise canvas from t (a seeded integer hash
// re-rolled each step, a fixed mask that clears pixel by pixel into a little procedural landscape), the steps tick 1 -> 16 across the job and
// the console bar carries the same N/16 at 3.14 it/s. Extrapolated: the ten results (the footage's batch produces five and the dock shows one
// preview at a time), the strict reading-order landing on the canvas (the footage sends one sprite on 'Send to canvas'), the console line
// reading '10 images' (the footage reads 5), the extension's tab names and prompt wording, the procedural landscape in the preview well (the
// footage's sprite is never reproduced), and the compression of the ~3 s job plus ~2-3 s of model loading into the beat window. Omitted: the
// pixel 'RETRO DIFFUSION' wordmark in the console window (a logo), the native Windows window frame and the timeline's frame cels. The
// pictures are our own memes; the type is the system face.
import { seg, press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, hash, UI_FONT, MONO_FONT } from './util.9e82faf1.js';

const P = 'rv-rtd';
const ROOT_H = 400, FW = 56, FH = 66, STEPS = 16, W = 32;
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 8px; background: #232327; color: #c9c9ce; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #3a3a42; }
.${P}-menu { flex: none; display: flex; align-items: center; gap: 9px; height: 14px; padding: 0 8px; background: #1a1a1d; font-size: 6.5px; color: #d6d6db; white-space: nowrap; }
.${P}-tabs { flex: none; display: flex; align-items: flex-end; gap: 2px; height: 14px; padding: 0 4px; background: #1a1a1d; }
.${P}-tabs span { box-sizing: border-box; display: flex; align-items: center; height: 12px; padding: 0 8px; border-radius: 2px 2px 0 0; background: #2a2a30; font-size: 6.5px; color: #9a9aa2; white-space: nowrap; }
.${P}-tabs span.${P}-on { background: #36363d; color: #e6e6ea; box-shadow: inset 0 1px 0 #8fd14f; }
.${P}-tool { flex: none; display: flex; align-items: center; gap: 6px; height: 14px; padding: 0 8px; background: #2a2a30; font-size: 6px; font-weight: 600; letter-spacing: .02em; color: #d6d6db; white-space: nowrap; }
.${P}-tool i { position: relative; display: block; flex: none; box-sizing: border-box; width: 7px; height: 7px; border-radius: 1px; background: #1a1a1d; box-shadow: inset 0 0 0 1px #55555e; }
.${P}-tool i::after { content: ""; position: absolute; left: 2px; top: 0.4px; width: 1.8px; height: 3.8px; border-right: 1.3px solid #8fd14f; border-bottom: 1.3px solid #8fd14f; transform: rotate(40deg); }
.${P}-body { flex: 1; min-height: 0; display: flex; background: #2a2a2e; }
.${P}-pal { flex: none; box-sizing: border-box; display: grid; grid-template-columns: repeat(4, 8px); grid-auto-rows: 8px; gap: 1px; align-content: start; justify-content: center; width: 38px; padding: 5px 0; background: #2a2a30; }
.${P}-pal i { display: block; width: 8px; height: 8px; }
.${P}-mid { position: relative; flex: 1; min-width: 0; background: #232327; }
.${P}-cv { position: absolute; left: 14px; top: 30px; box-sizing: border-box; width: 308px; height: 152px; padding: 6px; background: repeating-conic-gradient(#c8c8c8 0 25%, #8e8e8e 0 50%) 0 0 / 24px 24px; box-shadow: 0 0 0 1px #0e0e10; }
.${P}-g { display: grid; grid-template-columns: repeat(5, ${FW}px); grid-auto-rows: ${FH}px; gap: 4px; }
.${P}-f { position: relative; width: ${FW}px; height: ${FH}px; overflow: hidden; }
.${P}-f img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; image-rendering: pixelated; }
.${P}-f div { position: absolute; inset: 0; }
.${P}-con { position: absolute; left: 8px; top: 204px; box-sizing: border-box; width: 262px; height: 112px; background: #0e0e10; box-shadow: 0 0 0 1px #4a4a53, 0 4px 10px rgba(0, 0, 0, .5); overflow: hidden; }
.${P}-ct { display: flex; align-items: center; justify-content: space-between; height: 11px; padding: 0 5px; background: #2a2a30; font-size: 6px; color: #c9c9ce; white-space: nowrap; }
.${P}-ct i { display: block; width: 5px; height: 5px; border-radius: 1px; background: #55555e; }
.${P}-log { padding: 5px 6px 0 6px; font-family: ${MONO_FONT}; font-size: 5.4px; line-height: 8px; color: #9bd68a; white-space: nowrap; }
.${P}-log div { height: 8px; overflow: hidden; }
.${P}-log .${P}-dim { color: #8a86b8; }
.${P}-cb { display: flex; align-items: center; gap: 6px; margin: 4px 6px 0 6px; }
.${P}-ctrk { flex: 1; box-sizing: border-box; height: 8px; background: #3a2d63; box-shadow: 0 0 0 1px #6a58b0; }
.${P}-cfil { height: 100%; width: 0; background: #dfe86a; }
.${P}-cn { flex: none; width: 70px; font-family: ${MONO_FONT}; font-size: 5.4px; color: #c9c9ce; white-space: nowrap; }
.${P}-rail { flex: none; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; gap: 6px; width: 14px; padding-top: 6px; background: #2a2a30; }
.${P}-rail i { display: block; width: 7px; height: 7px; border-radius: 1px; background: #8a8a92; opacity: .75; }
.${P}-dock { flex: none; box-sizing: border-box; display: flex; flex-direction: column; gap: 5px; width: 178px; padding: 5px 6px; background: #2a2a30; }
.${P}-dt { flex: none; display: flex; gap: 8px; height: 12px; border-bottom: 1px solid #3a3a42; font-size: 6.2px; color: #8a8a92; white-space: nowrap; }
.${P}-dt span { display: flex; align-items: center; height: 12px; }
.${P}-dt span.${P}-on { color: #e6e6ea; box-shadow: 0 1px 0 #8fd14f; }
.${P}-fld { flex: none; box-sizing: border-box; display: flex; align-items: center; height: 12px; padding: 0 5px; border-radius: 2px; background: #1a1a1d; box-shadow: inset 0 0 0 1px #3a3a42; font-size: 6.2px; color: #d6d6db; white-space: nowrap; overflow: hidden; }
.${P}-fld.${P}-tall { height: 25px; padding: 3px 5px; align-items: flex-start; line-height: 9px; white-space: normal; }
.${P}-fld.${P}-ctr { justify-content: center; }
.${P}-two { flex: none; display: flex; gap: 5px; }
.${P}-two .${P}-fld { flex: 1; min-width: 0; }
.${P}-btn { flex: none; box-sizing: border-box; display: grid; place-items: center; height: 14px; border-radius: 2px; background: #3a3a42; box-shadow: inset 0 0 0 1px #55555e; font-size: 6.5px; color: #e6e6ea; white-space: nowrap; }
.${P}-go { background: #8fd14f; box-shadow: none; font-weight: 700; color: #16260a; }
.${P}-pt { flex: none; display: flex; align-items: center; justify-content: space-between; height: 11px; margin-top: 2px; font-size: 6.5px; font-weight: 600; color: #e8d64c; white-space: nowrap; }
.${P}-pt i { font-style: normal; font-size: 8px; font-weight: 400; color: #9a9aa2; }
.${P}-well { flex: none; align-self: center; box-sizing: border-box; width: 96px; height: 96px; background: #000; box-shadow: 0 0 0 1px #3a3a42; }
.${P}-pv { display: block; width: 96px; height: 96px; image-rendering: pixelated; }
.${P}-cap { flex: none; height: 9px; font-size: 6.2px; line-height: 9px; color: #6f9ae6; white-space: nowrap; overflow: hidden; }
.${P}-bar { flex: none; height: 6px; background: #232329; box-shadow: 0 0 0 1px #3a3a42; }
.${P}-fill { height: 100%; width: 0; background: #3b6fd4; }
.${P}-tl { flex: none; display: flex; align-items: center; gap: 6px; height: 26px; padding: 0 8px; background: #2a2a30; border-top: 1px solid #3a3a42; font-size: 6.2px; color: #c9c9ce; white-space: nowrap; }
.${P}-tl i { display: block; width: 7px; height: 5px; border-radius: 3px; background: #8a8a92; }
.${P}-tl b { display: block; width: 6px; height: 6px; border-radius: 50%; background: #e8d64c; }
`;

const PROMPT = 'a muse holding a handwritten note in a lecture hall, meme style, pixel art';
const SEED = '39468825';
const PAL = ['#000000', '#1d2b53', '#7e2553', '#008751', '#ab5236', '#5f574f', '#c2c3c7', '#fff1e8', '#ff004d', '#ffa300', '#ffec27', '#00e436', '#29adff', '#83769c', '#ff77a8', '#ffccaa', '#291814', '#111d35', '#422136', '#125359', '#742f29', '#49333b', '#a28879', '#f3ef7d', '#be1250', '#ff6c24', '#a8e72e', '#00b543', '#065ab5', '#754665', '#ffffff', '#3a3a42'];
const SPRITE_PAL = ['#1b1c33', '#2f3a5f', '#4b5d8f', '#7a8fc0', '#a9c4e6', '#d6ecf2', '#fff2b8', '#f3b95f', '#c8663a', '#5c3a4d', '#33543f', '#4f8a4b', '#8fbf5a', '#e8e4d8', '#2b2d42', '#000000'];
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const GEN_AT = 0.06;                              // the cursor presses Generate
const LOAD_AT = 0.16;                             // the dock reads 'Loading model' over flat noise, the console starts up
const STEP0 = 0.4;                                // the first step: 'Generating... 1/16 steps in batch 1/1'
const DONE = 0.92;                                // 'Generation complete', the console window closes
const SEND_AT = 0.97;                             // the cursor presses 'Send to canvas'
const LAND = Array.from({ length: 10 }, (_, i) => 1.0 + i * 0.0756);   // result i is on the canvas (reading order), the last at 1.68

// the sprite the preview well resolves into: a quantised little landscape on a 32 x 32 grid, a function of (x, y) alone
function target(x, y) {
  const ridge = 17 - Math.round(6 * Math.abs(Math.sin(x * 0.22 + 0.5)));
  const hill = 24 + Math.round(2 * Math.sin(x * 0.4));
  if (y >= 29) return 9;
  if (y >= hill + 3) return 10;
  if (y >= hill) return 11;
  if (y >= ridge) return y < ridge + 2 && ridge < 13 ? 13 : 2;
  const dx = x - 22, dy = y - 8, d2 = dx * dx + dy * dy;
  if (d2 <= 16) return 6;
  if (d2 <= 30) return 5;
  return y < 8 ? 3 : y < 14 ? 4 : 5;
}
// step n (0 = the flat noise of 'Loading model'): each pixel has a fixed rank and shows the sprite once n/16 has passed it, noise (re-rolled per step) before
const pixel = (n, x, y) => {
  const i = y * W + x;
  return hash(1000, i) < 1 - n / STEPS ? SPRITE_PAL[Math.floor(hash(n + 7, i) * SPRITE_PAL.length)] : SPRITE_PAL[target(x, y)];
};

export default {
  id: 'retro-diffusion',
  label: 'Retro Diffusion for Aseprite (2024)',
  source: {
    platform: "Retro Diffusion's Aseprite extension inside Aseprite 1.3 (desktop, dark theme; Retro Diffusion's own channel Astropulse on YouTube, 2024)",
    feature: "Aseprite chrome with the extension dock (tabs, a yellow-green Generate button and a 'Generation Preview' panel): a noise preview under 'Loading model', then 'Generating... N/16 steps in batch 1/1' over a filling blue bar while the preview sharpens from quantised noise, then 'Generation complete'; a floating console window runs 'N/16 at 3.14 it/s' alongside and closes itself; adapted to 10: the results land on the canvas as a 5 x 2 block of pixel-art frames in reading order",
    refs: [
      { url: 'https://www.youtube.com/watch?v=nr8gPejMoEk', videoId: 'nr8gPejMoEk', published: '2024-06-01', retrieved: '2026-10-14' },
      { url: 'https://www.youtube.com/watch?v=dZGhL_7dd_Y', videoId: 'dZGhL_7dd_Y', published: '2026-01-30', retrieved: '2026-10-14' },
    ],
    videoIds: ['nr8gPejMoEk', 'dZGhL_7dd_Y'],
    dates: { published: '2024-06-01 (nr8gPejMoEk), 2026-01-30 (dZGhL_7dd_Y)', retrieved: '2026-10-14', capture: 't~94-116 s of a 2331 s uncut screen recording (three cycles at t~94-113, ~124-134, ~150-159)' },
    extrapolated: [
      "ten results landing on the canvas as a 5 x 2 block of pixel-art frames in strict reading order (the footage's batch produces five and the dock shows one preview at a time)",
      "the strict reading-order landing after 'Send to canvas' (the footage stamps one sprite)",
      "the console line reading '10 images over 1 batches' (the footage reads 5)",
      "the extension's tab names and the prompt wording (not legible or not shown in the footage)",
      "the procedural landscape the preview well resolves into (the footage's sprite is never reproduced)",
      'the compression of the ~3 s job plus ~2-3 s of model loading into the beat window',
    ],
    omitted: ["the pixel 'RETRO DIFFUSION' wordmark in the console window (a logo)", 'the native Windows window frame around the console', "the timeline's frame cels"],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'retro-diffusion');
    const frame = (g, i) => `<div class="${P}-f"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div></div></div>`;
    const pal = PAL.map((c) => `<i style="background: ${c}"></i>`).join('');
    const rail = Array.from({ length: 8 }, () => '<i></i>').join('');
    const menu = ['File', 'Edit', 'Sprite', 'Layer', 'Frame', 'Select', 'View', 'Help'].map((m) => `<span>${m}</span>`).join('');
    const log = (cls, txt) => `<div class="${cls}" style="display: none">${txt}</div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-menu">${menu}</div><div class="${P}-tabs"><span>Home</span><span class="${P}-on">Sprite-0001</span></div><div class="${P}-tool"><i></i>PIXEL-PERFECT</div><div class="${P}-body"><div class="${P}-pal">${pal}</div><div class="${P}-mid"><div class="${P}-cv"><div class="${P}-g">${tiles.map(frame).join('')}</div></div><div class="${P}-con"><div class="${P}-ct">Image Generator<i></i></div><div class="${P}-log">${log(`${P}-l1`, 'Starting Image Generator...')}${log(`${P}-l2`, 'Connected')}${log(`${P}-l3`, 'Loading primary model')}${log(`${P}-l4`, 'Loaded model to cuda with torch.bfloat16 precision in 18.57 seconds')}${log(`${P}-l5 ${P}-dim`, 'Text to Image generating | quality | 10 images over 1 batches at 512x512')}</div><div class="${P}-cb" style="display: none"><div class="${P}-ctrk"><div class="${P}-cfil"></div></div><span class="${P}-cn"></span></div></div></div><div class="${P}-rail">${rail}</div><div class="${P}-dock"><div class="${P}-dt"><span class="${P}-on">Text to Image</span><span>Image to Image</span><span>Styles</span></div><div class="${P}-fld ${P}-tall">${x.esc(PROMPT)}</div><div class="${P}-two"><div class="${P}-fld">64 x 64</div><div class="${P}-fld">Quality</div></div><div class="${P}-btn ${P}-go">Generate</div><div class="${P}-pt">Generation Preview<i>×</i></div><div class="${P}-well"><canvas class="${P}-pv" width="${W}" height="${W}"></canvas></div><div class="${P}-cap"> </div><div class="${P}-bar"><div class="${P}-fill"></div></div><div class="${P}-fld ${P}-ctr">${SEED}</div><div class="${P}-fld">${SEED}</div><div class="${P}-btn ${P}-send">Send to canvas</div><div class="${P}-btn">Close</div></div></div><div class="${P}-tl"><b></b>Layer 1<i></i></div></div>`);
    const go = root.querySelector(`.${P}-go`), send = root.querySelector(`.${P}-send`);
    const con = root.querySelector(`.${P}-con`), cb = root.querySelector(`.${P}-cb`), cfil = root.querySelector(`.${P}-cfil`), cn = root.querySelector(`.${P}-cn`);
    const logs = [1, 2, 3, 4, 5].map((n) => root.querySelector(`.${P}-l${n}`));
    const cap = root.querySelector(`.${P}-cap`), fill = root.querySelector(`.${P}-fill`), cv = root.querySelector(`.${P}-pv`), px = cv.getContext('2d');
    const frames = [...root.querySelectorAll(`.${P}-f`)].map((n, i) => ({ im: n.querySelector('img'), cover: n.querySelector('div'), g: tiles[i] }));
    ctx.gate(frames.map((c) => c.im));

    // the preview well is drawn from a step number alone (-1 = blank, 0 = the flat noise of loading, 1..16 = sharpening), so a seek draws the same pixels whatever came before
    const draw = (n) => {
      for (let yy = 0; yy < W; yy++) for (let xx = 0; xx < W; xx++) { px.fillStyle = n < 0 ? '#000000' : pixel(n, xx, yy); px.fillRect(xx, yy, 1, 1); }
    };

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // Generate is pressed, later 'Send to canvas'
        const gp = press(s, GEN_AT, 0.06, 0.06, 0.14);
        put('go', gp.toFixed(3), () => { go.style.transform = gp > 0 ? `scale(${(1 - 0.05 * gp).toFixed(4)})` : 'none'; });
        const sp = press(s, SEND_AT, 0.05, 0.04, 0.1);
        put('send', sp.toFixed(3), () => { send.style.transform = sp > 0 ? `scale(${(1 - 0.05 * sp).toFixed(4)})` : 'none'; });

        // the job: loading, then the step counter 1..16 (frozen at 16 once complete), then complete
        const loading = s >= LOAD_AT && s < STEP0, running = s >= STEP0 && s < DONE, complete = s >= DONE;
        const n = running ? Math.min(STEPS, 1 + Math.floor(STEPS * seg(s, STEP0, DONE))) : complete ? STEPS : 0;
        const phase = complete ? 3 : running ? 2 : loading ? 1 : 0;
        put('cap', `${phase}.${n}`, () => { cap.textContent = phase === 0 ? ' ' : phase === 1 ? 'Loading model' : phase === 2 ? `Generating... ${n}/${STEPS} steps in batch 1/1` : 'Generation complete'; });
        put('fill', n, (v) => { fill.style.width = `${(v / STEPS * 100).toFixed(3)}%`; });
        put('pv', phase === 0 ? -1 : n, draw);

        // the console window: start-up lines while loading, then the model and job lines with the it/s bar; it closes itself when the job ends
        put('con', phase === 1 || phase === 2, (v) => { con.style.display = v ? '' : 'none'; });
        put('l1', phase >= 1, (v) => { logs[0].style.display = logs[1].style.display = logs[2].style.display = v ? '' : 'none'; });
        put('l4', phase === 2, (v) => { logs[3].style.display = logs[4].style.display = cb.style.display = v ? '' : 'none'; });
        put('cb', n, (v) => { cfil.style.width = `${(v / STEPS * 100).toFixed(3)}%`; cn.textContent = `${v}/${STEPS} at 3.14 it/s`; });

        // the ten results are on the canvas, one after another, in reading order
        frames.forEach((c, i) => {
          const done = s >= LAND[i];
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
          put(`i${i}`, done, (v) => { c.im.style.visibility = v ? '' : 'hidden'; c.cover.style.display = v ? 'none' : ''; });
        });
      },
    };
  },
};
