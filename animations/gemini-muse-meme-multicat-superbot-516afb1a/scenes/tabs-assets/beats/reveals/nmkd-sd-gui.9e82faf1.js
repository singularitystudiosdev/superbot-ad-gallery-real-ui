// NMKD Stable Diffusion GUI 1.6.0, the Windows desktop app (Photo Blue's install tutorial, YouTube YjQ6IUUmHRQ, 2022-10-22, t=375-392 s;
// spec .tmp/clone-9e82faf1/reveal-refs/nmkd-sd-gui/spec.json, confidence 0.62; frames af_nmkd_01_pending_t375.png,
// af_nmkd_02_pending_t384.png, af_nmkd_03_first_image_t392.png). A black single window: a status-ring and icon row on top, a left settings
// column (Prompt buttons, Amount Of Images To Generate, Generation Steps, Prompt Guidance, Seed, Resolution, Sampler, a seamless
// checkbox) ending in a small monospace LOG pane, and a right column: the prompt box, a square output canvas, the 'Image n/n - Seed ...'
// line and a tool row carrying a red-outlined 'Cancel' pill with a thin blue batch bar along the bottom. There is NO graphical
// placeholder: while it works the canvas stays the plain dark checkerboard (no spinner, skeleton or live preview), and everything the
// app says is the log: 'Running Stable Diffusion: ...', '1 prompt with N iterations each and 1 scale each = N images total', 'Loading
// Stable Diffusion with model "..."...', then 'Generated 1 Image in NN.NNNs (n/N)' per finished image. A finished image just appears in the canvas.
// Adapted to ten: 'Amount Of Images' 10, the canvas holding the batch as a 4 + 4 + 2 image list over its checkerboard (the app's list view
// sits behind a side toggle; the real canvas shows one image at a time with prev/next), each image popping in at once as its log line prints;
// the batch bar, the n/10 counts and each image's seconds are driven from t and compressed into the beat. Omitted: the app's title bar icon,
// the big header wordmark, the Windows desktop and the browser behind the window. No logo or platform font is drawn.
import { seg, press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, hash, UI_FONT, MONO_FONT } from './util.9e82faf1.js';

const P = 'rv-nmk';
const ROOT_H = 404, LEFT_W = 280, COLS = 4, GAP = 4, COUNT = 10, SEED = 894433934;
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 6px; background: #101113; color: #cfd2d6; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #2b2e33; }
.${P}-title { flex: none; display: flex; align-items: center; justify-content: space-between; height: 15px; padding: 0 7px; background: #1d1f22; font-size: 6px; color: #e3e5e8; white-space: nowrap; }
.${P}-title i { display: block; width: 6px; height: 6px; box-shadow: inset 0 0 0 1px #a9adb3; }
.${P}-head { flex: none; display: flex; align-items: center; gap: 4px; height: 24px; padding: 0 8px; }
.${P}-ring { display: block; width: 9px; height: 9px; border-radius: 50%; box-shadow: inset 0 0 0 2px #5a8a4a; }
.${P}-icons { margin-left: auto; display: flex; gap: 6px; }
.${P}-icons i { display: block; width: 8px; height: 8px; border-radius: 2px; box-shadow: inset 0 0 0 1.2px #bfc3c9; }
.${P}-body { flex: 1; min-height: 0; display: flex; }
.${P}-left { flex: none; box-sizing: border-box; display: flex; flex-direction: column; width: ${LEFT_W}px; padding: 2px 6px 6px 8px; font-size: 6px; color: #d3d6da; }
.${P}-f { display: flex; align-items: center; height: 14px; white-space: nowrap; }
.${P}-f > span:first-child { flex: none; width: 112px; }
.${P}-f.${P}-wide > span:first-child { width: auto; margin-right: 6px; }
.${P}-btn { display: grid; place-items: center; box-sizing: border-box; height: 10px; padding: 0 6px; background: #2a2c30; font-size: 5.6px; color: #d6d9dd; }
.${P}-note { margin-left: 8px; font-size: 5.4px; color: #858a92; }
.${P}-sp { flex: 1; position: relative; height: 3px; margin: 0 8px; background: linear-gradient(#eaeaea, #eaeaea) 0 0 / 100% 1px no-repeat; }
.${P}-sp::after { content: ""; position: absolute; top: -3px; left: var(--k, 30%); width: 3px; height: 7px; border-radius: 1px; background: #d7dade; }
.${P}-val { flex: none; width: 14px; text-align: right; }
.${P}-box { box-sizing: border-box; height: 9px; padding: 0 3px; background: #1a1b1e; box-shadow: inset 0 0 0 1px #3a3d42; line-height: 9px; font-size: 5.4px; }
.${P}-dd { width: 70px; margin-left: 0; background: #2a2c30; color: #f1f2f4; box-shadow: none; }
.${P}-ck { display: inline-block; width: 6px; height: 6px; background: #f2f3f4; }
.${P}-log { margin-top: auto; box-sizing: border-box; display: flex; flex-direction: column; justify-content: flex-end; height: 60px; padding: 3px 5px; background: #17181a; box-shadow: inset 0 0 0 1px #34373c; overflow: hidden; font-family: ${MONO_FONT}; font-size: 5px; line-height: 7.5px; color: #b5b9bf; white-space: nowrap; }
.${P}-log div { flex: none; height: 7.5px; overflow: hidden; }
.${P}-right { flex: 1; min-width: 0; display: flex; flex-direction: column; padding: 0 8px 0 4px; }
.${P}-prompt { flex: none; box-sizing: border-box; height: 19px; padding: 3px 4px; background: #d8dadd; font-size: 5.8px; line-height: 8px; color: #25282c; overflow: hidden; white-space: nowrap; }
.${P}-cv { position: relative; flex: none; aspect-ratio: 1; margin-top: 3px; background: conic-gradient(#25272a 25%, #17181a 0 50%, #25272a 0 75%, #17181a 0) 0 0 / 14px 14px; overflow: hidden; }
.${P}-g { position: absolute; left: ${GAP}px; right: ${GAP}px; top: ${GAP}px; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; }
.${P}-t { position: relative; aspect-ratio: 1; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; overflow: hidden; }
.${P}-info { flex: none; height: 12px; margin-top: 2px; font-size: 5.2px; line-height: 12px; color: #aeb2b8; white-space: nowrap; overflow: hidden; }
.${P}-tools { flex: none; display: flex; align-items: center; gap: 4px; height: 21px; }
.${P}-cancel { box-sizing: border-box; display: grid; place-items: center; width: 42px; height: 13px; background: #1c1717; box-shadow: inset 0 0 0 1px #4a3030; font-size: 6.2px; color: #6c4a4a; }
.${P}-tools i { display: grid; place-items: center; width: 11px; height: 11px; font-style: normal; font-size: 9px; line-height: 9px; color: #e9ebee; }
.${P}-tools b { display: block; box-sizing: border-box; width: 9px; height: 9px; border-radius: 1px; box-shadow: inset 0 0 0 1.3px #e9ebee; }
.${P}-tools .${P}-gap { flex: 1; }
.${P}-bar { flex: none; height: 3px; background: #1d1f22; }
.${P}-bar i { display: block; height: 3px; width: 0%; background: #2f7fe0; }
`;

const PROMPT = 'a muse in a lecture hall holding up a handwritten note, meme style, bright colours';
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const GEN_AT = 0.06;                              // the cursor presses Generate (the log lines start with it)
const ISSUE = 0.16;                               // 'Running Stable Diffusion: ...' and the arithmetic line print
const LOAD_AT = 0.26;                             // 'Loading Stable Diffusion with model ...'
const LAND = Array.from({ length: COUNT }, (_, i) => 0.4 + i * 0.1425);   // image i pops into the canvas as its 'Generated' line prints (reading order), the last at 1.68
const secs = (i) => (18.4 + hash(7, i) * 1.4).toFixed(3);
const slider = (k) => `<div class="${P}-sp" style="--k: ${k}%"></div>`;

export default {
  id: 'nmkd-sd-gui',
  label: 'NMKD Stable Diffusion GUI (2022)',
  source: {
    platform: 'NMKD Stable Diffusion GUI 1.6.0, the Windows desktop app (a narrated install tutorial on YouTube, 2022-10-22)',
    feature: "no graphical placeholder: the canvas stays a plain checkerboard; the whole wait is the bottom monospace log ('Running Stable Diffusion: ...', 'Loading Stable Diffusion with model ...', then 'Generated 1 Image in NN.NNNs (n/N)') plus a red-outlined 'Cancel' pill and a thin blue batch bar bottom-right; each finished image simply appears in the canvas",
    refs: [{ url: 'https://www.youtube.com/watch?v=YjQ6IUUmHRQ', retrieved: '2026-10-14' }],
    // the source ran five images and showed one at a time; ten, their list layout and every number's range are ours
    extrapolated: ["'Amount Of Images' 10: the canvas holds the batch as a 4 + 4 + 2 image list over the checkerboard (the real canvas shows one image with prev/next), each image popping in as its 'Generated' log line prints", 'the batch bar, the n/10 counts and each image\'s seconds are driven from t and compressed into the beat', 'the checkerboard is the dark one of the frames'],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'nmkd-sd-gui');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/></div>`;
    const field = (label, inner, wide = '') => `<div class="${P}-f${wide}"><span>${label}</span>${inner}</div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-title"><span>Stable Diffusion GUI 1.6.0 - CUDA GPU: NVIDIA GeForce RTX 3070</span><i></i></div><div class="${P}-head"><i class="${P}-ring"></i><div class="${P}-icons"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div></div><div class="${P}-body"><div class="${P}-left">${field('Prompt (AI Inputs)', `<span class="${P}-btn">Load Image</span><span class="${P}-note">No initialization image loaded.</span>`)}${field('', `<span class="${P}-btn">Load Concept</span><span class="${P}-note">No trained concept loaded.</span>`)}${field('Amount Of Images To Generate', `<span class="${P}-box" style="width: 38px">${COUNT}</span>`)}${field('Generation Steps', `${slider(30)}<span class="${P}-val">25</span>`)}${field('Prompt Guidance (CFG Scale)', `${slider(40)}<span class="${P}-val">9</span>`)}${field('Seed (Empty = Random)', `<span class="${P}-box" style="width: 38px"></span><span class="${P}-btn" style="margin-left: 6px">Use Previous</span><span class="${P}-btn" style="margin-left: 4px">Reset</span>`)}${field('Resolution (Width x Height)', `${slider(22)}<span class="${P}-val">512</span>${slider(50)}<span class="${P}-val">512</span>`)}${field('Sampler', `<span class="${P}-box ${P}-dd">Euler Ancestral</span>`)}${field('Generate Seamless (Tileable) Images', `<span class="${P}-ck"></span>`, ` ${P}-wide`)}<div class="${P}-log"></div></div><div class="${P}-right"><div class="${P}-prompt">${x.esc(PROMPT)}</div><div class="${P}-cv"><div class="${P}-g">${tiles.map(cell).join('')}</div></div><div class="${P}-info"></div><div class="${P}-tools"><span class="${P}-cancel">Cancel</span><i>+</i><i>◷</i><span class="${P}-gap"></span><b></b><b style="border-radius: 2px 2px 1px 1px"></b><i>‹</i><i>›</i></div><div class="${P}-bar"><i></i></div></div></div></div>`);
    const q = (sel) => root.querySelector(`.${P}-${sel}`);
    const log = q('log'), info = q('info'), cancel = q('cancel'), bar = q('bar').firstElementChild, gen = q('icons').children[4];
    const cells = [...root.querySelectorAll(`.${P}-t img`)].map((im, i) => ({ im, g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // Generate (the wand in the icon row) is pressed; the work shows only in the log, the bar and Cancel
        const gp = press(s, GEN_AT, 0.06, 0.06, 0.14);
        put('gp', gp.toFixed(3), () => { gen.style.transform = gp > 0 ? `scale(${(1 - 0.05 * gp).toFixed(4)})` : 'none'; });

        let n = 0;
        for (let i = 0; i < COUNT; i++) if (s >= LAND[i]) n = i + 1;
        const running = s >= ISSUE && n < COUNT;
        put('can', running, (v) => { cancel.style.color = v ? '#e0625c' : '#6c4a4a'; cancel.style.boxShadow = v ? 'inset 0 0 0 1px #c0392b' : 'inset 0 0 0 1px #4a3030'; cancel.style.background = v ? '#2a1515' : '#1c1717'; });

        // the log: the run summary, the model load, then one 'Generated' line per finished image (the last lines stay in view)
        const lines = [];
        if (s < ISSUE) lines.push('Generated 1 Image in 19.211s (5/5)');
        else {
          lines.push(`Running Stable Diffusion: ${COUNT} Iterations, 25 Steps, Scales 9, 512x512, Starting Seed: ${SEED}`);
          lines.push(`1 prompt with ${COUNT} iterations each and 1 scale each = ${COUNT} images total`);
          if (s >= LOAD_AT) lines.push('Loading Stable Diffusion with model "stable-diffusion-1.4fp16"...');
          for (let i = 0; i < n; i++) lines.push(`Generated 1 Image in ${secs(i)}s (${i + 1}/${COUNT})`);
        }
        put('log', lines.join('\n'), () => { log.innerHTML = lines.map((l) => `<div>${l}</div>`).join(''); });

        // the batch bar beside Cancel grows with the batch
        const cur = Math.min(n, COUNT - 1);
        const p = n >= COUNT ? 1 : seg(s, cur === 0 ? ISSUE : LAND[cur - 1], LAND[cur]);
        const w = s < ISSUE ? 0 : ((cur + p) / COUNT) * 100;
        put('bar', w.toFixed(2), (v) => { bar.style.width = `${v}%`; });
        put('inf', n, (v) => { info.textContent = v === 0 ? 'No images to show.' : `Image ${v}/${v} - Seed: ${SEED + v - 1} - Scale 9 - 512x512 - k_euler_a`; });

        // each finished image pops into the canvas over the checkerboard, in reading order
        cells.forEach((c, i) => {
          put(`i${i}`, i < n, (v) => { c.im.style.visibility = v ? '' : 'hidden'; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
        });
      },
    };
  },
};
