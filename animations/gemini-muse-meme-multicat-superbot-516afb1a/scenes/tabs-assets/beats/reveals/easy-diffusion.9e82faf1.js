// Easy Diffusion 2.5 (cmdr2's Stable Diffusion UI), the local web app at localhost:9000, 'Generate' tab (Nathan DeShone's tutorial, YouTube
// TFqI8XdRjDw, 2023-03-09, t=633-745 s; spec .tmp/clone-9e82faf1/reveal-refs/easy-diffusion/spec.json, confidence 0.70; frames
// af_ed_01_pending_loading_t633.png, af_ed_02_pending_taskcard_t645.png, af_ed_03_pending_livepreview_t660.png, af_ed_04_landing_t745.png).
// A near-black violet-accented page: a slim top bar (title, the 'Generate | Settings | Help & Community | Merge models' tabs and, at its
// right, a status that reads an amber dot and 'Stable Diffusion is loading…' and then '…is rendering…'), a left column (prompt, negative
// prompt, an Image Modifiers grid, the action buttons and the Image Settings list) and a right column that opens with the TASK CARD: red
// 'Clear All' and 'Download All images' chips, a 'Processing' tag, the prompt, a red 'Stop' pill, the parameters line and a determinate
// trough with its violet fill under the text 'Batch: n of N, Generating image(s): NN%, Time remaining (approx): NN seconds'. Pressing the make
// button swaps it for 'Enqueue Next N Images' with a red 'Stop All' and a violet 'Pause All'. Under the card each image's slot shows the
// raw multicolour latent (blobby per-pixel RGB noise, the live preview) that sharpens as the steps run, then HARD-SWAPS to the finished picture
// (no fade); when the batch ends the header status, the Stop pill and the progress text clear and the button returns to 'Make N images'.
// Adapted to ten: 'Make 10 images' and ten image slots in a 4 + 4 + 2 block, each opening (as the app does, when its own run starts) with
// its live preview and landing in strict order; the percentage restarts for every image ('Batch: n of 10') and, with the time remaining,
// is driven from t and compressed into the beat. Omitted: the Image Modifiers' preview pictures (flat swatches here), the right-hand
// image strip, the per-image toolbar (Seed / Use as Input / Download...), and the title wordmark's styling. No logo or platform font is drawn.
import { seg, press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, hash, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-ezd';
const ROOT_H = 456, LEFT_W = 152, COLS = 4, GAP = 5, COUNT = 10, NZ = 48, STEPS = 25;
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 10px; background: #12151a; color: #d8dce2; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #262b33; }
.${P}-top { flex: none; display: flex; align-items: center; gap: 8px; height: 24px; padding: 0 9px; background: #181b21; }
.${P}-ttl { flex: none; font-size: 9.5px; font-weight: 700; color: #f3f4f7; white-space: nowrap; }
.${P}-ttl em { margin-left: 2px; font-size: 5.5px; font-style: normal; font-weight: 600; color: #8e95a1; }
.${P}-tabs { flex: none; display: flex; gap: 8px; font-size: 6.5px; color: #8b93a0; white-space: nowrap; }
.${P}-tabs .${P}-on { color: #f1f3f6; font-weight: 600; }
.${P}-st { margin-left: auto; display: flex; align-items: center; gap: 4px; font-size: 6px; color: #e6c27a; white-space: nowrap; }
.${P}-st i { display: block; width: 4px; height: 4px; border-radius: 50%; background: #f0a030; }
.${P}-body { flex: 1; min-height: 0; display: flex; }
.${P}-left { flex: none; box-sizing: border-box; display: flex; flex-direction: column; width: ${LEFT_W}px; padding: 6px 7px 6px 7px; border-right: 1px solid #22272e; }
.${P}-lab { font-size: 6px; line-height: 9px; color: #c3c9d2; white-space: nowrap; }
.${P}-lab small { font-size: 5.5px; color: #7d8592; }
.${P}-ta { box-sizing: border-box; height: 32px; margin: 1px 0 3px; padding: 3px 4px; border-radius: 3px; background: #1b1f26; box-shadow: inset 0 0 0 1px #2c323b; font-size: 6px; line-height: 8px; color: #e1e5ea; overflow: hidden; }
.${P}-two { display: flex; gap: 4px; margin: 1px 0 4px; }
.${P}-two span { flex: 1; box-sizing: border-box; height: 12px; border-radius: 3px; background: #1f242c; font-size: 6px; line-height: 12px; text-align: center; color: #c3c9d2; }
.${P}-mods { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 3px 3px; margin: 2px 0 4px; }
.${P}-mod { font-size: 4.6px; line-height: 6px; text-align: center; color: #a8afba; white-space: nowrap; }
.${P}-mod i { display: block; aspect-ratio: 1; margin-bottom: 1px; border-radius: 3px; }
.${P}-btns { display: flex; flex-wrap: wrap; gap: 0; margin: 0 0 5px; }
.${P}-btn { display: grid; place-items: center; box-sizing: border-box; height: 15px; background: #6d3ec9; font-size: 6.5px; font-weight: 600; color: #fff; white-space: nowrap; }
.${P}-make { width: 100%; }
.${P}-q { width: 100%; }
.${P}-btn.${P}-stopall { width: 50%; background: #a31d1d; }
.${P}-btn.${P}-pause { width: 50%; }
.${P}-set { margin-top: 2px; padding-top: 3px; border-top: 1px solid #22272e; font-size: 6px; font-weight: 700; color: #e6e9ee; }
.${P}-row { display: flex; justify-content: space-between; height: 11px; font-size: 5.6px; font-weight: 400; line-height: 11px; color: #b5bcc7; white-space: nowrap; }
.${P}-row b { padding: 0 4px; border-radius: 2px; background: #1d222a; font-weight: 400; color: #d6dae0; line-height: 9px; align-self: center; }
.${P}-right { flex: 1; min-width: 0; display: flex; flex-direction: column; padding: 5px 7px 6px; }
.${P}-chips { flex: none; display: flex; gap: 4px; height: 12px; font-size: 5.6px; line-height: 12px; color: #fff; white-space: nowrap; }
.${P}-chips span { box-sizing: border-box; padding: 0 5px; border-radius: 2px; background: #2a2e36; }
.${P}-chips .${P}-red { background: #b02525; }
.${P}-card { flex: none; box-sizing: border-box; height: 64px; margin-top: 3px; }
.${P}-ln { display: flex; align-items: flex-start; gap: 4px; font-size: 6px; line-height: 8px; color: #e4e7ec; }
.${P}-ln em { flex: none; padding: 0 3px; margin-top: 1px; border-radius: 2px; background: #2c7a3a; font-size: 4.6px; font-style: normal; line-height: 7px; color: #eaffea; }
.${P}-ln p { flex: 1; min-width: 0; height: 16px; margin: 0; overflow: hidden; }
.${P}-ln u { flex: none; display: flex; flex-direction: column; align-items: flex-end; gap: 2px; text-decoration: none; }
.${P}-ln u span { font-size: 5px; color: #9ba2ae; white-space: nowrap; }
.${P}-ln u b { box-sizing: border-box; height: 10px; padding: 0 5px; border-radius: 5px; background: #c52b2b; font-size: 5.6px; font-weight: 600; line-height: 10px; color: #fff; }
.${P}-par { margin-top: 2px; font-size: 4.9px; line-height: 7px; color: #8d95a1; white-space: nowrap; overflow: hidden; }
.${P}-prog { margin-top: 2px; font-size: 5px; line-height: 7px; color: #c9cfd8; white-space: nowrap; }
.${P}-trough { position: relative; height: 3px; margin-top: 2px; background: #b9bdc3; overflow: hidden; }
.${P}-trough i { position: absolute; left: 0; top: 0; bottom: 0; width: 0%; background: #6a3fc4; }
.${P}-pane { position: relative; flex: 1; min-height: 0; margin-top: 4px; }
.${P}-g { display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; }
.${P}-t { position: relative; aspect-ratio: 1; background: #0e1014; overflow: hidden; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-nz { position: absolute; inset: 0; display: block; width: 100%; height: 100%; }
`;

const PROMPT = 'a muse in a lecture hall holding up a handwritten note, meme style, bright colours, Line Art, Concept Art, Digital Art, Realistic, Cinematic';
const MODS = [['Line Art', '#d9dce0, #6c7078'], ['Concept Art', '#a79a62, #3e4a3a'], ['Digital Art', '#8a9a55, #2f3b2a'], ['Realistic', '#b8a368, #4b4d33'], ['Cinematic', '#c28f4a, #3c3425'], ['Studio Lighting', '#9d8c64, #4a4538'], ['Golden Hour', '#e0963a, #5b3a1c'], ['HD', '#8fae4b, #3d4d2a']];
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const GEN_AT = 0.06;                              // the cursor presses 'Make 10 images'
const ISSUE = 0.16;                               // the task card opens and the status turns on
const RENDERING = 0.3;                            // 'Stable Diffusion is loading…' gives way to 'is rendering…'
const LAND = Array.from({ length: COUNT }, (_, i) => 0.4 + i * 0.1425);   // image i swaps its live preview for the picture (reading order), the last at 1.68
const row = (a, b) => `<div class="${P}-row">${a}<b>${b}</b></div>`;

// the live preview: per-pixel RGB noise on a small canvas the tile stretches (soft blobs), a pure function of (tile, step)
function drawNoise(cv, seed, step) {
  const c = cv.getContext('2d');
  const d = c.createImageData(NZ, NZ);
  for (let n = 0; n < NZ * NZ; n++) {
    for (let k = 0; k < 3; k++) { const h = hash(seed * 131 + step, n * 3 + k); d.data[n * 4 + k] = h < 0.5 ? Math.round(255 * 2 * h * h) : Math.round(255 * (1 - 2 * (1 - h) * (1 - h))); }
    d.data[n * 4 + 3] = 255;
  }
  c.putImageData(d, 0, 0);
}

export default {
  id: 'easy-diffusion',
  label: 'Easy Diffusion (2023)',
  source: {
    platform: 'Easy Diffusion 2.5.22 (cmdr2 Stable Diffusion UI), the local web app in a desktop browser, Generate tab (a narrated tutorial on YouTube, 2023-03-09)',
    feature: "dark violet page: a header status (amber dot, 'Stable Diffusion is loading…' then 'is rendering…'); a task card with a red 'Stop' pill and a violet determinate trough under 'Batch: n of N, Generating image(s): NN%, Time remaining (approx): NN seconds'; 'Stop All' (red) and 'Pause All' (violet) beside 'Enqueue Next N Images' while it runs; each image's slot shows a noisy RGB live latent that sharpens and hard-swaps to the picture",
    refs: [{ url: 'https://www.youtube.com/watch?v=TFqI8XdRjDw', retrieved: '2026-10-14' }],
    // the source made two images under one task; ten, their slots as a grid and every counter's range are ours
    extrapolated: ["'Make 10 images': ten image slots in a 4 + 4 + 2 block (the real pane stacks images full width), each opening with its own live preview as its run starts and landing in strict order", "the percentage restarts for every image ('Batch: n of 10') and, with 'Time remaining (approx)', is driven from t and compressed into the beat", 'the Image Modifiers are flat swatches (the footage shows preview pictures)'],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'easy-diffusion');
    const cell = (g, i) => `<div class="${P}-t" style="visibility: hidden"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><canvas class="${P}-nz" width="${NZ}" height="${NZ}"></canvas></div>`;
    const mod = ([n, c]) => `<div class="${P}-mod"><i style="background: linear-gradient(160deg, ${c})"></i>${n}</div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-top"><b class="${P}-ttl">Easy Diffusion<em>v2.5.22</em></b><div class="${P}-tabs"><span class="${P}-on">Generate</span><span>Settings</span><span>Help &amp; Community</span><span>Merge models</span></div><div class="${P}-st" style="visibility: hidden"><i></i><span></span></div></div><div class="${P}-body"><div class="${P}-left"><div class="${P}-lab">Enter Prompt <small>or Load from a file</small></div><div class="${P}-ta">${x.esc(PROMPT.split(', Line')[0])}</div><div class="${P}-lab">Negative Prompt <small>(optional)</small></div><div class="${P}-lab">Initial Image (img2img) <small>(optional)</small></div><div class="${P}-two"><span>Browse</span><span>Draw</span></div><div class="${P}-lab">Image Modifiers</div><div class="${P}-mods">${MODS.map(mod).join('')}</div><div class="${P}-btns"><div class="${P}-btn ${P}-make">Make ${COUNT} images</div><div class="${P}-btn ${P}-q" style="display: none">Enqueue Next ${COUNT} Images</div><div class="${P}-btn ${P}-stopall" style="display: none">Stop All</div><div class="${P}-btn ${P}-pause" style="display: none">Pause All</div></div><div class="${P}-set">Image Settings${row('Number of images', String(COUNT))}${row('Model', 'sd-v1-4')}${row('Sampler', 'Euler Ancestral')}${row('Image Size', '512 x 512')}${row('Inference Steps', '25')}${row('Guidance Scale', '7.5')}</div></div><div class="${P}-right"><div class="${P}-chips"><span class="${P}-red">Clear All</span><span>Download All images</span></div><div class="${P}-card" style="visibility: hidden"><div class="${P}-ln"><em>Processing</em><p>${x.esc(PROMPT)}</p><u><span>Use these settings</span><b>Stop</b></u></div><div class="${P}-par">Seed: 1007618, Sampler: euler_a, Inference Steps: 25, Guidance Scale: 7.5, Model: sd-v1-4</div><div class="${P}-prog"></div><div class="${P}-trough"><i></i></div></div><div class="${P}-pane"><div class="${P}-g">${tiles.map(cell).join('')}</div></div></div></div></div>`);
    const q = (sel) => root.querySelector(`.${P}-${sel}`);
    const st = q('st'), stT = st.querySelector('span'), card = q('card'), prog = q('prog'), fillEl = q('trough').firstElementChild, stopPill = card.querySelector('u b'), tag = card.querySelector('em');
    const make = q('make'), enq = q('q'), stopAll = q('stopall'), pause = q('pause');
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ t: n, im: n.querySelector('img'), nz: n.querySelector('canvas'), g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // 'Make 10 images' is pressed; while the queue runs it gives way to Enqueue Next / Stop All / Pause All
        const gp = press(s, GEN_AT, 0.06, 0.06, 0.14);
        put('gp', gp.toFixed(3), () => { make.style.transform = gp > 0 ? `scale(${(1 - 0.04 * gp).toFixed(4)})` : 'none'; });
        const running = s >= ISSUE && s < LAND[COUNT - 1];
        put('run', running, (v) => { make.style.display = v ? 'none' : ''; enq.style.display = v ? '' : 'none'; stopAll.style.display = v ? '' : 'none'; pause.style.display = v ? '' : 'none'; });

        // the header status and the task card
        put('st', running ? (s >= RENDERING ? 2 : 1) : 0, (v) => { st.style.visibility = v ? '' : 'hidden'; stT.textContent = v === 2 ? 'Stable Diffusion is rendering…' : 'Stable Diffusion is loading…'; });
        put('card', s >= ISSUE, (v) => { card.style.visibility = v ? '' : 'hidden'; });
        put('pill', running, (v) => { stopPill.style.visibility = v ? '' : 'hidden'; prog.style.visibility = v ? '' : 'hidden'; fillEl.parentNode.style.visibility = v ? '' : 'hidden'; tag.textContent = v ? 'Processing' : 'Completed'; });

        let n = 0;
        for (let i = 0; i < COUNT; i++) if (s >= LAND[i]) n = i + 1;
        const cur = Math.min(n, COUNT - 1);
        const a = cur === 0 ? ISSUE : LAND[cur - 1];
        const p = n >= COUNT ? 1 : seg(s, a, LAND[cur]);
        const pct = Math.min(99, Math.floor(p * 100));
        const eta = Math.ceil((COUNT - cur - p) * 9);
        const line = `Batch: ${cur + 1} of ${COUNT}, Generating image(s): ${pct}%, Time remaining (approx): ${eta} seconds`;
        put('prog', running ? line : '', (v) => { prog.textContent = v; });
        const w = ((cur + p) / COUNT) * 100;
        put('fill', running ? w.toFixed(1) : '0', (v) => { fillEl.style.width = `${v}%`; });

        // each slot opens when its own run starts (live preview of noise sharpening step by step), then hard-swaps to the finished picture
        const step = Math.min(STEPS - 1, Math.floor(p * STEPS));
        cells.forEach((c, i) => {
          const started = s >= (i === 0 ? ISSUE : LAND[i - 1]);
          put(`s${i}`, started, (v) => { c.t.style.visibility = v ? '' : 'hidden'; c.im.style.visibility = v ? '' : 'hidden'; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
          const landed = i < n;
          put(`l${i}`, landed, (v) => { c.nz.style.display = v ? 'none' : ''; });
          if (started && !landed) {
            put(`n${i}`, step, (v) => { drawNoise(c.nz, i, v); });
            // the preview sharpens: the noise thins out over the steps (full strength in the first ones)
            const o = 1 - 0.8 * seg(p, 0.2, 0.96);
            put(`o${i}`, o.toFixed(2), (v) => { c.nz.style.opacity = v; });
          }
        });
      },
    };
  },
};
