// SD.Next (vladmandic's Stable Diffusion fork), the local web UI, 'Text' tab (Sebastian Kamph's install tutorial, YouTube nWTnTyFTuAs,
// 2024-05-29, and ZirJohn's multi-GPU walkthrough, i5hiZpEvVEY, 2024-04-28, t=158-167 s; spec .tmp/clone-9e82faf1/reveal-refs/sd-next/spec.json,
// confidence 0.60; frames af_sdn_01_pending_livepreview_t161.png, af_sdn_02_generate_controls_t420.png). A pure-black, teal-accented page
// that is NOT the Automatic1111 layout: 'Base model / Refiner model' pickers at the top left and, top right, a teal toast card 'Generate /
// Start processing'; the tab strip 'Text | Image | Control | Process | Gallery | Models | Agent Scheduler | System | Extensions'; a prompt block
// with '0/75' counters beside the control cluster (a teal Generate and an Enqueue over Stop / Skip / Pause and Restore / Clear / Networks);
// a work area of a left parameter rail (segmented teal sliders for Width, Height, Batch, CFG, Steps), a centre canvas with a thumbnail
// row and a 'Show | Save | Delete | -> Text | -> Image | -> Control | -> Process' toolbar, and a right model column ('Model | Lora | Style |
// Embedding | VAE' over a 'Reference/' grid); a log panel (Time | Level | Module | Message) runs along the bottom. The canvas ITSELF is
// the placeholder: while a job runs it holds the raw latent, a dense saturated RGB speckle, that clears step by step into the picture
// (a hard swap to the finished image, no fade or blur mask) while the panel streams 'Processed: images=n ...' rows; a finished image
// leaves a thumbnail under the canvas and a 'Prompt / Parameters / Time' metadata block under that.
// Adapted to ten: Batch count 10, the canvas starting a fresh latent for each image as the last lands, the thumbnail row (ten slots)
// filling in reading order and the log gaining a row per image; the per-image times, 'Image n' counts and the log's clock are driven
// from t and compressed into the beat. Omitted: the model grid's preview pictures (flat swatches here), the browser chrome, the creator's
// camera, and any logo or platform font.
import { seg, press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, hash, UI_FONT, MONO_FONT } from './util.9e82faf1.js';

const P = 'rv-sdn';
const ROOT_H = 490, RAIL_W = 118, MID_W = 254, COUNT = 10, NZ = 64, STEPS = 20, CV = 240, SEED = 1178671864;
const TEAL = '#2f8f95';
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 6px; background: #05070a; color: #dfe3e6; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #262b30; }
.${P}-top { flex: none; display: flex; align-items: flex-start; gap: 8px; height: 31px; padding: 4px 8px 0; }
.${P}-pick { flex: none; width: 92px; font-size: 5px; line-height: 7px; color: #c3c8cd; }
.${P}-pick b { display: block; box-sizing: border-box; height: 11px; margin-top: 1px; padding: 0 4px; border-radius: 2px; background: #11161a; box-shadow: inset 0 0 0 1px #30363c; font-size: 5.4px; font-weight: 400; line-height: 11px; color: #e6e9ec; white-space: nowrap; overflow: hidden; }
.${P}-toast { margin-left: auto; box-sizing: border-box; width: 92px; height: 20px; padding: 2px 5px; border-radius: 2px; background: ${TEAL}; font-size: 5px; line-height: 7px; color: #eafcfb; }
.${P}-toast b { display: block; font-size: 5.4px; font-weight: 700; }
.${P}-tabs { flex: none; display: flex; gap: 10px; height: 14px; margin: 0 8px; border-bottom: 1px solid #1c2227; font-size: 6.4px; line-height: 14px; color: #c7ccd1; white-space: nowrap; }
.${P}-tabs .${P}-on { color: #fff; box-shadow: 0 1px 0 #fff; }
.${P}-pb { flex: none; display: flex; gap: 6px; height: 56px; padding: 4px 8px 0; }
.${P}-fields { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.${P}-ta { position: relative; flex: 1; box-sizing: border-box; padding: 3px 5px; border-radius: 2px; background: #0c1013; box-shadow: inset 0 0 0 1px #20272d; font-size: 6px; line-height: 8px; color: #e7eaed; overflow: hidden; }
.${P}-ta i { position: absolute; right: 3px; top: 1px; font-style: normal; font-size: 4.6px; color: #8d959c; }
.${P}-ta.${P}-neg { color: #5a636a; }
.${P}-cl { flex: none; width: 132px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; align-content: start; }
.${P}-cl span { display: grid; place-items: center; box-sizing: border-box; height: 10px; border-radius: 2px; background: #151a1e; font-size: 5.2px; color: #6c767c; }
.${P}-cl .${P}-gen { grid-column: span 2; background: ${TEAL}; color: #f2fffe; font-size: 6px; }
.${P}-cl .${P}-enq { background: #1a5f64; color: #d9f6f4; }
.${P}-cl .${P}-live { color: #e6e9ec; }
.${P}-cl .${P}-sty { grid-column: span 3; justify-content: start; padding: 0 4px; background: #0c1013; box-shadow: inset 0 0 0 1px #20272d; font-size: 4.6px; color: #6c767c; place-items: center start; }
.${P}-work { flex: 1; min-height: 0; display: flex; padding: 4px 8px 0; gap: 6px; }
.${P}-rail { flex: none; width: ${RAIL_W}px; font-size: 5.6px; line-height: 8px; color: #cfd4d8; }
.${P}-sl { margin-bottom: 4px; }
.${P}-sl div { display: flex; justify-content: space-between; }
.${P}-sl b { font-weight: 400; color: #eef1f3; }
.${P}-sl i { display: block; height: 4px; margin-top: 1px; background: repeating-linear-gradient(90deg, #18343a 0 3px, transparent 3px 4px); }
.${P}-sl i u { display: block; height: 4px; background: repeating-linear-gradient(90deg, ${TEAL} 0 3px, transparent 3px 4px); }
.${P}-two { display: flex; gap: 6px; }
.${P}-two .${P}-sl { flex: 1; min-width: 0; }
.${P}-dd { box-sizing: border-box; height: 11px; margin: 1px 0 4px; padding: 0 4px; border-radius: 2px; background: #11161a; box-shadow: inset 0 0 0 1px #30363c; font-size: 5.4px; line-height: 11px; color: #e6e9ec; }
.${P}-ck { display: flex; gap: 5px; margin-bottom: 4px; font-size: 5px; white-space: nowrap; }
.${P}-ck span::before { content: ""; display: inline-block; width: 4px; height: 4px; margin-right: 2px; background: ${TEAL}; vertical-align: -0.5px; }
.${P}-ck span.${P}-off::before { background: #1a2024; box-shadow: inset 0 0 0 1px #4a5258; }
.${P}-acc { font-size: 5.4px; color: #d5d9dc; white-space: nowrap; margin-bottom: 4px; }
.${P}-mid { flex: none; width: ${MID_W}px; display: flex; flex-direction: column; }
.${P}-cv { position: relative; flex: none; width: ${CV}px; height: ${CV}px; margin: 0 auto; background: #0e1215; box-shadow: 0 0 0 1px #2b3238; overflow: hidden; }
.${P}-cv img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-nz { position: absolute; inset: 0; display: block; width: 100%; height: 100%; }
.${P}-thumbs { flex: none; display: flex; gap: 2px; height: 20px; margin-top: 3px; padding-left: 7px; }
.${P}-thumbs i { flex: none; display: block; position: relative; width: 20px; height: 20px; }
.${P}-thumbs img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-btns { flex: none; display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; margin-top: 4px; }
.${P}-btns span { display: grid; place-items: center; box-sizing: border-box; height: 11px; border-radius: 2px; background: #1b2024; font-size: 5px; color: #e1e5e8; white-space: nowrap; }
.${P}-meta { flex: none; margin-top: 4px; font-size: 4.8px; line-height: 6.6px; color: #b6bcc1; overflow: hidden; }
.${P}-meta b { color: #eef1f3; font-weight: 700; }
.${P}-model { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.${P}-mt { display: flex; gap: 6px; height: 11px; font-size: 6px; line-height: 11px; color: #cfd4d8; }
.${P}-mt .${P}-on { color: #fff; box-shadow: 0 1px 0 #fff; }
.${P}-ref { margin: 3px 0; font-size: 5.4px; color: #cfd4d8; }
.${P}-chips { display: flex; gap: 5px; margin-bottom: 4px; font-size: 5px; color: #9aa2a8; }
.${P}-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 3px; }
.${P}-mod { font-size: 4.8px; line-height: 6px; color: #dfe3e6; white-space: nowrap; overflow: hidden; }
.${P}-mod i { display: block; aspect-ratio: 1.25; margin-bottom: 1px; border-radius: 1px; }
.${P}-logp { flex: none; box-sizing: border-box; display: flex; flex-direction: column; height: 62px; margin-top: 3px; padding: 2px 8px 3px; border-top: 1px solid #1c2227; font-family: ${MONO_FONT}; font-size: 4.7px; line-height: 7px; color: #b9bfc4; overflow: hidden; }
.${P}-lb { flex: 1; min-height: 0; display: flex; flex-direction: column; justify-content: flex-end; overflow: hidden; }
.${P}-lr { flex: none; display: flex; height: 7px; white-space: nowrap; overflow: hidden; }
.${P}-lr span { flex: none; }
.${P}-lr span:nth-child(1) { width: 66px; }
.${P}-lr span:nth-child(2) { width: 24px; color: #5aa0e8; }
.${P}-lr span:nth-child(3) { width: 62px; }
.${P}-lr.${P}-lh { color: #7d868c; }
.${P}-lr.${P}-lh span:nth-child(2) { color: #7d868c; }
`;

const PROMPT = 'a muse in a lecture hall holding up a handwritten note, meme style, bright colours';
const NEG = 'blurry, low quality, text artifacts';
const MODELS = [['DreamShaper SD v8', '#3d4a73, #181d33'], ['Juggernaut SD-XL v9', '#6a5a52, #261f1d'], ['DreamShaper SD-XL Turbo', '#52606b, #1d252b'], ['Juggernaut Reborn', '#8a6a58, #2e211b'], ['Tempest SD-XL v0.1', '#58684a, #1f2819'], ['RunwayML SD 1.5', '#4a7088, #17242c']];
const BTNS = ['Show', 'Save', 'Delete', '→ Text', '→ Image', '→ Control', '→ Process'];
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const GEN_AT = 0.06;                              // the cursor presses Generate
const ISSUE = 0.16;                               // the toast shows 'Start processing' and the first latent fills the canvas
const LAND = Array.from({ length: COUNT }, (_, i) => 0.4 + i * 0.1425);   // image i replaces its latent (reading order), the last at 1.68
const clockAt = (i) => { const sec = 57 * 60 + 31 + i * 4; return `08:${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`; };
const row = (a, b, c, d) => `<div class="${P}-lr"><span>${a}</span><span>${b}</span><span>${c}</span><span>${d}</span></div>`;
const slider = (label, val, pct) => `<div class="${P}-sl"><div>${label}<b>${val}</b></div><i><u style="width: ${pct}%"></u></i></div>`;

// the live latent: per-pixel RGB noise on a small canvas stretched over the whole canvas, a pure function of (image, step)
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
  id: 'sd-next',
  label: 'SD.Next (2024)',
  source: {
    platform: "SD.Next (vladmandic's Stable Diffusion fork), the local web UI in a desktop browser, 'Text' tab (two tutorials on YouTube, 2024-04-28 and 2024-05-29)",
    feature: "black teal-accented page with SD.Next's own layout: tab strip Text | Image | Control | Process | Gallery | Models | Agent Scheduler | System | Extensions, a model column on the right, a Generate / Enqueue and Stop / Skip / Pause cluster beside '0/75' prompt counters, a 'Start processing' status toast and a bottom log panel streaming processed rows; the canvas itself is the placeholder: dense RGB latent noise clearing step by step into each image",
    refs: [{ url: 'https://www.youtube.com/watch?v=nWTnTyFTuAs', retrieved: '2026-10-14' }, { url: 'https://www.youtube.com/watch?v=i5hiZpEvVEY', retrieved: '2026-10-14' }],
    // one image at a time was ever on screen; ten, the thumbnail row's slots and every counter's range are ours
    extrapolated: ['Batch count 10: the canvas starts a fresh latent for each image as the last lands, the thumbnail row under it filling in reading order, one log row per image', "the log's clock, each row's time and speed figures, and the metadata block are driven from t and compressed into the beat", "the status toast reads 'Generate / Start processing' (taken from the 1080p tutorial frame)", 'the model column is flat swatches (the footage shows preview pictures)'],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'sd-next'), srcMain = ownSrc(ctx.src, 'sd-next-canvas');
    const thumb = (g, i) => `<i><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/></i>`;
    const mod = ([n, c]) => `<div class="${P}-mod"><i style="background: linear-gradient(150deg, ${c})"></i>${n}</div>`;
    const cl = (cls, t) => `<span class="${cls ? `${P}-${cls}` : ''}">${t}</span>`;
    const root = x.el(`<div class="${P}"><div class="${P}-top"><div class="${P}-pick">Base model<b>juggernaut_reborn [338b85bc4f]</b></div><div class="${P}-pick">Refiner model<b>None</b></div><div class="${P}-toast" style="visibility: hidden"><b>Generate</b>Start processing</div></div><div class="${P}-tabs"><span class="${P}-on">Text</span><span>Image</span><span>Control</span><span>Process</span><span>Gallery</span><span>Models</span><span>Agent Scheduler</span><span>System</span><span>Extensions</span></div><div class="${P}-pb"><div class="${P}-fields"><div class="${P}-ta">${x.esc(PROMPT)}<i>0/75</i></div><div class="${P}-ta ${P}-neg">${x.esc(NEG)}<i>0/75</i></div></div><div class="${P}-cl">${cl('gen', 'Generate')}${cl('enq', 'Enqueue')}${cl('live', 'Stop')}${cl('live', 'Skip')}${cl('live', 'Pause')}${cl('', 'Restore')}${cl('', 'Clear')}${cl('', 'Networks')}${cl('sty', 'Styles')}</div></div><div class="${P}-work"><div class="${P}-rail"><div class="${P}-two">${slider('Width', 1024, 100)}${slider('Height', 1024, 100)}</div><div class="${P}-two">${slider('Batch count', COUNT, 40)}${slider('Batch size', 1, 6)}</div><div class="${P}-two">${slider('CFG scale', 6, 28)}${slider('Guidance end', 1, 100)}</div>${slider('Steps', STEPS, 24)}<div>Sampling method</div><div class="${P}-dd">DPM++ 2M</div><div class="${P}-ck"><span>Full quality</span><span class="${P}-off">Face restore</span></div><div class="${P}-ck"><span class="${P}-off">Tiling</span><span>HiDiffusion</span></div><div class="${P}-acc">Samplers ◂ &nbsp;Seed ◂ &nbsp;Advanced ◂</div><div class="${P}-acc">Corrections ◂ &nbsp;Refine ◂</div><div>Script</div><div class="${P}-dd">None</div><div class="${P}-acc">IP Adapters ◂</div><div class="${P}-acc">Extensions ▾</div><div class="${P}-acc">&nbsp;&nbsp;AnimateDiff ◂</div></div><div class="${P}-mid"><div class="${P}-cv"><img src="${srcMain}" width="870" height="1024" decoding="sync" alt="Latest render" style="visibility: hidden"/><canvas class="${P}-nz" width="${NZ}" height="${NZ}" style="display: none"></canvas></div><div class="${P}-thumbs">${tiles.map(thumb).join('')}</div><div class="${P}-btns">${BTNS.map((b) => `<span>${b}</span>`).join('')}</div><div class="${P}-meta"></div></div><div class="${P}-model"><div class="${P}-mt"><span class="${P}-on">Model</span><span>Lora</span><span>Style</span><span>Embedding</span><span>VAE</span></div><div class="${P}-ref">Reference/</div><div class="${P}-chips"><span>All</span><span>Diffusers</span><span>Reference</span></div><div class="${P}-grid">${MODELS.map(mod).join('')}</div></div></div><div class="${P}-logp">${row('Time', 'Level', 'Module', 'Message').replace(`${P}-lr`, `${P}-lr ${P}-lh`)}<div class="${P}-lb"></div></div></div>`);
    const q = (sel) => root.querySelector(`.${P}-${sel}`);
    const toast = q('toast'), gen = q('gen'), live = [...root.querySelectorAll(`.${P}-live`)], cv = q('cv'), mainImg = cv.querySelector('img'), nz = cv.querySelector('canvas'), meta = q('meta'), logp = q('lb');
    const cells = [...root.querySelectorAll(`.${P}-thumbs img`)].map((im, i) => ({ im, g: tiles[i] }));
    ctx.gate([...cells.map((c) => c.im), mainImg]);

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // Generate is pressed; the toast reads 'Start processing' and Stop / Skip / Pause come alive while the queue runs
        const gp = press(s, GEN_AT, 0.06, 0.06, 0.14);
        put('gp', gp.toFixed(3), () => { gen.style.transform = gp > 0 ? `scale(${(1 - 0.05 * gp).toFixed(4)})` : 'none'; });
        let n = 0;
        for (let i = 0; i < COUNT; i++) if (s >= LAND[i]) n = i + 1;
        const running = s >= ISSUE && n < COUNT;
        put('run', running, (v) => { toast.style.visibility = v ? '' : 'hidden'; live.forEach((e) => { e.style.color = v ? '#e6e9ec' : ''; e.style.background = v ? '#222a30' : ''; }); });

        // the canvas is the placeholder: the latent of the image being made (noise clearing step by step), then the finished picture
        const cur = Math.min(n, COUNT - 1);
        const a = cur === 0 ? ISSUE : LAND[cur - 1];
        const p = n >= COUNT ? 1 : seg(s, a, LAND[cur]);
        const step = Math.min(STEPS - 1, Math.floor(p * STEPS));
        put('mi', s >= ISSUE ? cur : -1, (v) => {
          mainImg.style.visibility = v < 0 ? 'hidden' : '';
          if (v >= 0) { mainImg.style.transformOrigin = tiles[v].origin; mainImg.style.transform = restTransform(tiles[v]); mainImg.style.filter = restFilter(tiles[v]); }
        });
        put('nz', running, (v) => { nz.style.display = v ? '' : 'none'; });
        if (running) {
          put('nd', `${cur}.${step}`, () => { drawNoise(nz, cur, step); });
          const o = 1 - 0.78 * seg(p, 0.15, 0.97);
          put('no', o.toFixed(2), (v) => { nz.style.opacity = v; });
        }

        // the thumbnail row: each slot fills as its image lands, in reading order
        cells.forEach((c, i) => {
          put(`i${i}`, i < n, (v) => { c.im.style.visibility = v ? '' : 'hidden'; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
        });

        // the metadata block beneath the toolbar, once an image exists
        put('meta', n, (v) => {
          meta.innerHTML = v === 0 ? '' : `<b>Prompt:</b> ${x.esc(PROMPT)}<br><b>Parameters:</b> Steps: ${STEPS}| Seed: ${SEED + v - 1}| Sampler: DPM++ 2M| CFG scale: 6| Size: 1024x1024| Parser: Full parser| Model: juggernaut_reborn| Batch: ${v}/${COUNT}<br>Time: ${(4.1 + hash(3, v) * 0.4).toFixed(2)}s | GPU active: 7510 MB reserved 2640 | used 4300 MB free 20264 MB total 24564 MB`;
        });

        // the log panel streams: a header, the base rows and one 'Processed' row per image (the last stay in view)
        const rows = [];
        rows.push(row('2024-05-29 08:55:17', 'INFO', 'sd', 'Setting Torch parameters: device=cuda dtype=torch.float16 vae=torch.float16 unet=torch.float16'));
        if (s >= ISSUE) rows.push(row(`2024-05-29 ${clockAt(0)}`, 'INFO', 'processing_diffusers', 'Base: class=StableDiffusionXLPipeline'));
        for (let i = 0; i < n; i++) rows.push(row(`2024-05-29 ${clockAt(i + 1)}`, 'INFO', 'processing', `Processed: images=${i + 1} time=${(4.1 + hash(3, i + 1) * 0.4).toFixed(2)} its=${(4.5 + hash(5, i) * 0.5).toFixed(2)} memory={'ram': {'used': 1.88, 'total': 63.15}}`));
        put('log', `${s >= ISSUE ? 1 : 0}.${n}`, () => { logp.innerHTML = rows.join(''); });
      },
    };
  },
};
