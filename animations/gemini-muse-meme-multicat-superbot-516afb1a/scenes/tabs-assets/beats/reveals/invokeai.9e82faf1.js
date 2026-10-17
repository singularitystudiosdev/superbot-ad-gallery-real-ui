// Invoke (the open-source InvokeAI app, 6.0) generating an image, in its web UI (official Invoke channel UxJbHhpjnUc 2025-07-09,
// t~52-56 s, and the AI+D Lab tutorial jzeY5_iGpRI 2025-05-02, t~157-163 s; spec .tmp/clone-9e82faf1/reveal-refs/invokeai/spec.json,
// confidence 0.66; frames p_batch_queued_t53.png, p_denoise_noise_t158.png, p_denoise_mid_t159.png, p_denoise_resolve_t160.png,
// p_result_t56.png). A dark three-column shell: a slim icon rail, a left generation panel (a yellow 'Invoke' button with a session
// count, a red Cancel X, the prompt, image size, model), a centre canvas under a Launchpad | Image Viewer tab strip, and a right
// 'Boards' rail (Private Boards, a board with an AUTO chip, its Images grid). Pressing Invoke raises a green 'Batch Queued' toast
// ('Added 1 sessions to front of queue'), the Invoke button greys and the X lights up, a thin green progress bar runs along the top
// edge, and the canvas shows a rectangle of multi-colour latent noise that refines in place into the finished image (a denoise
// preview), after which the image is filed in the Boards gallery.
// Adapted to ten: a batch of ten sessions, each denoising on the canvas (the noise redrawn every step from a seeded hash, thinning
// to the picture) and then landing in the Boards gallery, one after another; the toast reads 'Added 10 sessions to front of queue'.
// Everything is a pure function of t. Omitted: the Invoke logo, the footage's own pictures (every tile is our meme), the cursor and
// the narrator's caption; the icon rail is plain outlined shapes.
import { press } from '../../../../lib.9b47fc30.js';
import { hash, injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-iv';
const ROOT_H = 400, RAIL_W = 20, LEFT_W = 128, BOARDS_W = 140, N = 40;   // N: the noise canvas's cells per side
const CSS = `
.${P} { position: relative; box-sizing: border-box; display: flex; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 6px; background: #16161a; color: #c9ced4; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #2a2c31; }
.${P}-top { position: absolute; left: 0; right: 0; top: 0; height: 2px; z-index: 3; background: #1f2125; }
.${P}-top i { display: block; height: 100%; width: 0; background: #4fd4a0; }
.${P}-rail { flex: none; display: flex; flex-direction: column; align-items: center; gap: 9px; width: ${RAIL_W}px; padding-top: 10px; background: #1b1c20; }
.${P}-rail i { display: block; width: 8px; height: 8px; box-sizing: border-box; border: 1.2px solid #8a9096; border-radius: 2px; }
.${P}-rail i.y { border-color: #e8e54a; }
.${P}-left { flex: none; box-sizing: border-box; display: flex; flex-direction: column; gap: 5px; width: ${LEFT_W}px; padding: 6px 5px; background: #1f2125; }
.${P}-row { flex: none; display: flex; align-items: center; gap: 3px; height: 18px; }
.${P}-inv { flex: 1; display: grid; place-items: center; height: 18px; border-radius: 3px; background: #ebe84c; font-size: 8px; font-weight: 600; color: #1c1c10; }
.${P}-cnt { flex: none; display: grid; place-items: center; box-sizing: border-box; width: 24px; height: 18px; border-radius: 3px; background: #2b2e34; font-size: 7.5px; color: #d9dde1; }
.${P}-sq { flex: none; display: grid; place-items: center; box-sizing: border-box; width: 18px; height: 18px; border-radius: 3px; background: #2b2e34; font-size: 8px; color: #aeb3b9; }
.${P}-x { flex: none; display: grid; place-items: center; box-sizing: border-box; width: 18px; height: 18px; border-radius: 3px; background: #3a2f33; font-size: 9px; font-weight: 700; color: #7a5a60; }
.${P}-sec { flex: none; display: flex; align-items: center; justify-content: space-between; box-sizing: border-box; height: 15px; padding: 0 5px; border-radius: 3px; background: #272a30; font-size: 6.6px; color: #c0c5ca; }
.${P}-box { flex: none; box-sizing: border-box; padding: 4px 5px; border-radius: 3px; background: #272a30; box-shadow: inset 0 0 0 1px #30343a; font-size: 6.6px; line-height: 9px; color: #d3d7db; overflow: hidden; }
.${P}-box small { display: block; margin-bottom: 2px; font-size: 6px; color: #8d939a; }
.${P}-box.p { height: 54px; }
.${P}-sl { display: flex; align-items: center; gap: 4px; height: 11px; font-size: 6.2px; color: #8d939a; }
.${P}-sl em { flex: 1; position: relative; height: 2px; border-radius: 1px; background: #3a3e45; }
.${P}-sl em::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 50%; border-radius: 1px; background: #9aa0a7; }
.${P}-sl b { flex: none; box-sizing: border-box; width: 22px; height: 9px; border-radius: 2px; background: #1d1f23; font-weight: 400; text-align: center; line-height: 9px; color: #6c7279; }
.${P}-mid { flex: 1; min-width: 0; display: flex; flex-direction: column; background: #16161a; }
.${P}-tabs { flex: none; display: flex; gap: 2px; height: 14px; padding: 2px 0 0 4px; font-size: 6.5px; }
.${P}-tabs span { padding: 0 7px; border-radius: 3px 3px 0 0; line-height: 12px; color: #8d939a; white-space: nowrap; }
.${P}-tabs .on { background: #272a30; color: #e6e9ec; }
.${P}-cv { position: relative; flex: 1; min-height: 0; background: #1b1c20; background-image: repeating-conic-gradient(#202228 0% 25%, #1b1c20 0% 50%); background-size: 10px 10px; }
.${P}-es { position: absolute; left: 0; right: 0; top: 38%; text-align: center; transform: translateY(-50%); font-size: 9px; font-weight: 700; color: #eceff1; }
.${P}-es small { display: block; margin-top: 6px; font-size: 6.5px; font-weight: 400; color: #8d939a; }
.${P}-sq1 { position: absolute; left: 50%; top: 50%; width: 224px; height: 224px; margin: -118px 0 0 -112px; overflow: hidden; background: #0f0f12; box-shadow: 0 0 0 1px #3a3e45; }
.${P}-sq1 img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-sq1 canvas { position: absolute; inset: 0; width: 100%; height: 100%; image-rendering: pixelated; }
.${P}-sq1 .${P}-bb { position: absolute; left: 0; top: 0; right: 0; bottom: 0; }
.${P}-meta { position: absolute; left: 50%; bottom: 8px; width: 224px; margin-left: -112px; display: flex; justify-content: space-between; font-size: 6.2px; color: #8d939a; }
.${P}-boards { flex: none; box-sizing: border-box; display: flex; flex-direction: column; width: ${BOARDS_W}px; padding: 6px 6px 0; background: #1f2125; }
.${P}-bh { flex: none; display: flex; align-items: center; justify-content: space-between; height: 14px; font-size: 7px; color: #9aa0a6; }
.${P}-bh b { font-weight: 700; color: #f0f2f4; }
.${P}-bl { flex: none; display: flex; align-items: center; gap: 4px; height: 17px; font-size: 6.6px; color: #c9ced4; white-space: nowrap; }
.${P}-bl.sub { height: 13px; font-size: 6.2px; color: #8d939a; }
.${P}-bl s { flex: none; display: block; width: 11px; height: 11px; border-radius: 2px; background: #353940; }
.${P}-bl span { margin-left: auto; font-size: 6.3px; color: #9aa0a6; }
.${P}-bl.on { box-sizing: border-box; padding: 0 3px; border-radius: 3px; background: #2e3239; color: #f0f2f4; }
.${P}-bl i { font-style: normal; font-size: 5px; font-weight: 700; padding: 1px 3px; border-radius: 2px; background: #1d3b52; color: #6cc4ff; }
.${P}-gh { flex: none; display: flex; align-items: center; gap: 3px; height: 15px; margin-top: 5px; font-size: 6.4px; color: #9aa0a6; }
.${P}-gh .on { padding: 1px 5px; border-radius: 3px; background: #2e3239; color: #f0f2f4; }
.${P}-g { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 4px; padding-top: 2px; }
.${P}-t { position: relative; aspect-ratio: 1; border-radius: 3px; overflow: hidden; background: #272a30; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; background: #272a30; }
.${P}-toast { position: absolute; right: 8px; bottom: 8px; z-index: 4; box-sizing: border-box; width: 142px; padding: 5px 8px 6px 18px; border-radius: 4px; background: #47a56f; box-shadow: 0 2px 6px rgba(0, 0, 0, .4); color: #f4fff8; }
.${P}-toast i { position: absolute; left: 6px; top: 7px; width: 6px; height: 6px; border-radius: 50%; background: #f4fff8; }
.${P}-toast u { position: absolute; right: 5px; top: 3px; text-decoration: none; font-size: 8px; line-height: 8px; color: #e5f6ec; }
.${P}-toast b { display: block; font-size: 7px; line-height: 9px; }
.${P}-toast span { display: block; font-size: 6.2px; line-height: 9px; color: #eafaf0; }
`;

const PROMPT = 'a muse holding a handwritten note in a lecture hall, meme style, sharp focus, cinematic light';
const GEN_AT = 0.06;                                // Invoke is pressed
const ISSUE = 0.12;                                 // the toast, the bar and the canvas's noise appear
const DEN = 0.84;                                   // the share of a session's slot spent denoising; the rest holds the finished picture
const STEPS = 14;                                   // the noise is redrawn this many times over a denoise
const ICONS = ['y', '', '', '', '', ''];

export default {
  id: 'invokeai',
  label: 'Invoke (6.0)',
  source: {
    platform: 'Invoke 6.0 (the open-source InvokeAI web app), Launchpad / Unified Canvas, dark theme (official tutorial screen recordings, 2025)',
    feature: "dark three-column shell: a yellow Invoke button and a red Cancel X, a green 'Batch Queued' toast, a thin progress bar along the top edge, a canvas rectangle of multi-colour latent noise refining step by step into the picture, finished images filed in the right Boards gallery (adapted to 10: a batch of ten sessions, each denoising then landing in strict sequence; the toast count is 'Added 10 sessions')",
    refs: [
      { url: 'https://www.youtube.com/watch?v=UxJbHhpjnUc', retrieved: '2026-10-14' },
      { url: 'https://www.youtube.com/watch?v=jzeY5_iGpRI', retrieved: '2026-10-14' },
    ],
    extrapolated: "the ten-session batch (the footage queues 1), the toast count and a canvas that is re-noised for every session; the footage never shows more than one image land",
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'invokeai');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-pend"></div></div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-top" style="display: none"><i></i></div><div class="${P}-rail">${ICONS.map((k) => `<i class="${k}"></i>`).join('')}</div><div class="${P}-left"><div class="${P}-row"><div class="${P}-inv">Invoke</div><div class="${P}-cnt">10</div><div class="${P}-sq">≡</div><div class="${P}-x">✕</div></div><div class="${P}-sec">Choose Prompt Template<span>⌄</span></div><div class="${P}-box p"><small>Positive Prompt</small>${x.esc(PROMPT)}</div><div class="${P}-sec">Image<span>⌃</span></div><div class="${P}-box"><small>Aspect</small>1:1</div><div class="${P}-sl">Width<em></em><b>1024</b></div><div class="${P}-sl">Height<em></em><b>1024</b></div><div class="${P}-sec">Generation<span>⌃</span></div><div class="${P}-box"><small>Model</small>Juggernaut XL v9</div></div><div class="${P}-mid"><div class="${P}-tabs"><span class="on">Launchpad</span><span>Image Viewer</span></div><div class="${P}-cv"><div class="${P}-es">Generate images from text prompts.<small>Enter a prompt and Invoke.</small></div><div class="${P}-sq1" style="display: none"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme canvas" style="visibility: hidden"/><canvas width="${N}" height="${N}"></canvas></div><div class="${P}-meta" style="visibility: hidden"><span>Bbox: 1024×1024 px</span><span class="${P}-st">session 1/10</span></div></div></div><div class="${P}-boards"><div class="${P}-bh">Boards<b>Invoke 6.0</b></div><div class="${P}-bl sub">Private Boards</div><div class="${P}-bl"><s></s>Uncategorized<span>57</span></div><div class="${P}-bl on"><s></s>Invoke 6.0<i>AUTO</i><span class="${P}-bc">0</span></div><div class="${P}-gh"><span class="on">Images</span><span>Assets</span></div><div class="${P}-g">${tiles.map(cell).join('')}</div></div><div class="${P}-toast" style="display: none"><i></i><u>✕</u><b>Batch Queued</b><span>Added 10 sessions to front of queue</span></div></div>`);
    const q = (s) => root.querySelector(s);
    const top = q(`.${P}-top`), bar = q(`.${P}-top i`), inv = q(`.${P}-inv`), xb = q(`.${P}-x`), es = q(`.${P}-es`), sq = q(`.${P}-sq1`), cim = q(`.${P}-sq1 img`), cvs = q(`.${P}-sq1 canvas`), meta = q(`.${P}-meta`), st = q(`.${P}-st`), bc = q(`.${P}-bc`), toast = q(`.${P}-toast`);
    const cx = cvs.getContext('2d');
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), pend: n.querySelector(`.${P}-pend`), g: tiles[i] }));
    ctx.gate([...cells.map((c) => c.im), cim]);
    const slots = tiles.map((_, i) => ctx.seq(i));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };
    const img = cx.createImageData(N, N);
    // one step of latent noise over the picture: cell colour from the hash (seed = session and step), opacity thinning with u
    const draw = (seed, u) => {
      const d = img.data;
      for (let k = 0; k < N * N; k++) {
        const v = Math.min(1, Math.max(0, u * 1.3 - hash(seed, k * 4 + 3) * 0.3));
        d[k * 4] = 70 + hash(seed, k * 4) * 170;
        d[k * 4 + 1] = 66 + hash(seed, k * 4 + 1) * 160;
        d[k * 4 + 2] = 62 + hash(seed, k * 4 + 2) * 160;
        d[k * 4 + 3] = Math.round(255 * (1 - v));
      }
      cx.putImageData(img, 0, 0);
    };

    return {
      root,
      render(t) {
        const s = t - ctx.cardIn;
        const issued = s >= ISSUE;
        const done = t >= ctx.lastLand;
        const c = slots.filter((w) => t >= w[1]).length;   // sessions landed: a growing prefix
        const cur = Math.min(c, tiles.length - 1);         // the session on the canvas
        const [a, b] = slots[cur];
        const u = c >= tiles.length ? 1 : Math.min(1, Math.max(0, (t - a) / ((b - a) * DEN)));

        // Invoke is pressed; the button greys and the X lights while the batch runs
        const gp = press(s, GEN_AT, 0.06, 0.06, 0.14);
        put('gp', gp.toFixed(3), () => { inv.style.transform = gp > 0 ? `scale(${(1 - 0.06 * gp).toFixed(4)})` : 'none'; });
        const run = issued && !done;
        put('run', run, (v) => {
          inv.style.background = v ? '#5b5a2c' : '';
          inv.style.color = v ? '#a9a766' : '';
          xb.style.background = v ? '#e0707c' : '';
          xb.style.color = v ? '#2a1013' : '';
        });
        put('toast', run, (v) => { toast.style.display = v ? '' : 'none'; });
        put('top', run, (v) => { top.style.display = v ? '' : 'none'; });
        const f = Math.min(1, Math.max(0, (t - (ctx.cardIn + ISSUE)) / (ctx.lastLand - ctx.cardIn - ISSUE)));
        put('bar', f.toFixed(3), () => { bar.style.width = `${(f * 100).toFixed(1)}%`; });

        // the canvas: the launchpad prompt until Invoke, then the session's latent noise thinning into its picture
        put('es', issued, (v) => { es.style.display = v ? 'none' : ''; sq.style.display = v ? '' : 'none'; meta.style.visibility = v ? '' : 'hidden'; });
        put('st', cur, (n) => { st.textContent = `session ${n + 1}/${tiles.length}`; });
        const g = tiles[cur];
        put('cim', cur, () => { cim.style.visibility = ''; cim.style.transformOrigin = g.origin; cim.style.transform = restTransform(g); });
        const blur = ((1 - u) * 9).toFixed(1);
        put('cf', `${cur}|${blur}`, () => { cim.style.filter = `${restFilter(g) === 'none' ? '' : restFilter(g) + ' '}blur(${blur}px)`.trim(); });
        const step = Math.min(STEPS - 1, Math.floor(u * STEPS));
        const uq = Math.round(u * 60);
        put('nz', `${cur}|${step}|${uq}|${issued}`, () => { if (issued) draw(cur * 97 + step, uq / 60); });
        put('nzv', u >= 1, (v) => { cvs.style.visibility = v ? 'hidden' : ''; });

        // the Boards gallery: the finished picture replaces the slot, the board's count follows
        put('bc', c, (n) => { bc.textContent = String(n); });
        cells.forEach((cl, i) => {
          const landed = t >= slots[i][1];
          put(`i${i}`, landed, (v) => { cl.im.style.visibility = v ? '' : 'hidden'; cl.pend.style.display = v ? 'none' : ''; });
          cl.im.style.filter = restFilter(cl.g);
          cl.im.style.transform = restTransform(cl.g);
          put(`a${i}`, issued && !landed && i === cur, (v) => { cl.pend.style.background = v ? '#343840' : ''; });
        });
      },
    };
  },
};
