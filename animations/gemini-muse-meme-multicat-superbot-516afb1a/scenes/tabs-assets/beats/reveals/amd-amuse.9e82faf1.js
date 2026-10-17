// AMD Amuse 2.0 beta (TensorStack), the native Windows image app, 'Generate' tab (the official Amuse AI channel, YouTube xZ0gt1GlVIA,
// 2024-08-06, t=30.75-34 s; spec .tmp/clone-9e82faf1/reveal-refs/amd-amuse/spec.json, confidence 0.78; frames
// af_amuse_01_idle_t30.png, af_amuse_02_pending_t32.png, af_amuse_03_landing_t34.png). A near-black desktop window: a slim title bar with
// the 'Generate | AI Filters | Design' tabs, a ~150 px left column (prompt, Performance slider, Image Count, Aspect Ratio, an XDNA
// Super Resolution switch and, at the foot, the full-width primary button), a tall output canvas with a 4-slot thumbnail strip under it and a
// status footer. Pressing 'Generate Images' swaps the button's label in place for 'Cancel Generation' (an amber X on an amber 1 px border), a
// ~9 px #1683DE determinate band fills along the canvas's bottom edge carrying the centred white caption 'Image: n/N - Step: ss/04', and
// the footer counters restart: 'Elapsed: 0.0 s' and 'Performance: 0.0 it/s' climb. The canvas keeps its idle art (a neutral glyph here,
// never the app's mascot) and there is no in-canvas preview: a finished image HARD-SWAPS into the canvas, and the strip's slots fill left to right.
// Adapted to ten: Image Count 10, so the strip holds ten slots in one row (the real strip scrolls past four), landing in reading order
// while the canvas shows the latest; the elapsed/performance counters and the 'n/10 - ss/04' caption are driven from t and compressed
// into the beat. Omitted: the mascot, the title-bar app icon, the presenter picture-in-picture, the cancel-in-progress state (never filmed).
// The footage's pictures are never reproduced: every tile is our own meme; no logo, wordmark or platform font is drawn.
import { seg, press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-amu';
const ROOT_H = 420, LEFT_W = 150, TOP_H = 18, FOOT_H = 20, COUNT = 10;
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 8px; background: #1a1d22; color: #d9dce1; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #2d323a; }
.${P}-top { flex: none; position: relative; display: flex; align-items: center; height: ${TOP_H}px; padding: 0 8px; font-size: 7px; font-weight: 600; color: #e6e8ec; }
.${P}-top em { margin-left: 2px; font-size: 5px; font-style: italic; font-weight: 400; color: #8b919b; }
.${P}-tabs { position: absolute; left: 50%; top: 2px; transform: translateX(-50%); display: flex; gap: 2px; font-size: 6.5px; font-weight: 500; }
.${P}-tabs span { display: block; box-sizing: border-box; width: 46px; height: 14px; border-radius: 3px; line-height: 14px; text-align: center; color: #aab0ba; }
.${P}-tabs .${P}-on { background: #2b3038; color: #f1f3f6; }
.${P}-win { margin-left: auto; display: flex; align-items: center; gap: 9px; }
.${P}-win i { display: block; box-sizing: border-box; width: 7px; height: 7px; box-shadow: inset 0 0 0 1px #b8bdc6; }
.${P}-win i:first-child { height: 1px; align-self: flex-end; margin-bottom: 5px; background: #b8bdc6; box-shadow: none; }
.${P}-win i:last-child { width: 8px; height: 8px; background: linear-gradient(45deg, transparent 46%, #b8bdc6 46%, #b8bdc6 54%, transparent 54%), linear-gradient(-45deg, transparent 46%, #b8bdc6 46%, #b8bdc6 54%, transparent 54%); box-shadow: none; }
.${P}-body { flex: 1; min-height: 0; display: flex; }
.${P}-left { flex: none; box-sizing: border-box; display: flex; flex-direction: column; width: ${LEFT_W}px; padding: 5px 5px 6px; border-right: 1px solid #262a31; }
.${P}-hd { text-align: center; font-size: 8px; font-weight: 600; line-height: 11px; color: #eceef2; }
.${P}-hd small { display: block; font-size: 5.5px; font-weight: 400; line-height: 8px; color: #b3b8c1; }
.${P}-lab { margin: 7px 0 2px; font-size: 5.5px; font-style: italic; line-height: 8px; color: #9ba1ab; }
.${P}-prompt { box-sizing: border-box; height: 68px; padding: 4px 4px; border-radius: 2px; background: #21242a; font-size: 6.5px; line-height: 9px; color: #dfe2e7; overflow: hidden; }
.${P}-sl { position: relative; height: 2px; margin: 4px 2px 3px; border-radius: 1px; background: #2e333b; }
.${P}-sl b { position: absolute; top: -3px; width: 4px; height: 8px; border-radius: 1px; background: #5b616c; }
.${P}-sl2 { display: flex; justify-content: space-between; font-size: 5.5px; color: #b3b8c1; }
.${P}-two { display: flex; gap: 6px; margin-top: 2px; }
.${P}-two > div { flex: 1; min-width: 0; }
.${P}-cnt { display: flex; align-items: center; gap: 4px; font-size: 6px; color: #c9cdd4; }
.${P}-cnt .${P}-sl { flex: 1; margin: 0; }
.${P}-ar { display: flex; gap: 0; box-sizing: border-box; height: 14px; background: #2a2e36; }
.${P}-ar span { flex: 1; display: grid; place-items: center; }
.${P}-ar i { display: block; box-sizing: border-box; border-radius: 1px; box-shadow: inset 0 0 0 1px #2d7ad6; }
.${P}-xd { display: flex; align-items: center; gap: 4px; margin-top: 9px; font-size: 6px; color: #dfe2e7; white-space: nowrap; }
.${P}-sw { position: relative; flex: none; width: 12px; height: 6px; border-radius: 3px; background: #3a3f48; }
.${P}-sw::after { content: ""; position: absolute; left: 1px; top: 1px; width: 4px; height: 4px; border-radius: 50%; background: #868c97; }
.${P}-ico { margin-left: auto; display: flex; gap: 6px; }
.${P}-ico i { display: block; width: 6px; height: 6px; border-radius: 2px; box-shadow: inset 0 0 0 1px #4b515b; }
.${P}-go { margin-top: auto; flex: none; box-sizing: border-box; display: flex; align-items: center; justify-content: center; gap: 4px; height: 17px; border-radius: 1px; background: #1a1d22; font-size: 6.5px; font-weight: 500; white-space: nowrap; }
.${P}-go b { font-size: 8px; font-weight: 400; line-height: 8px; }
.${P}-right { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.${P}-cv { position: relative; display: flex; justify-content: center; flex: 1; min-height: 0; margin: 0 3px; border-radius: 3px 3px 0 0; background: #1b1e23; overflow: hidden; }
.${P}-idle { position: absolute; left: 50%; top: 46%; width: 92px; height: 74px; margin: -37px 0 0 -46px; border-radius: 12px; box-shadow: inset 0 0 0 3px #272c34; }
.${P}-idle i { position: absolute; left: 24px; top: 16px; width: 16px; height: 16px; border-radius: 50%; background: #272c34; }
.${P}-idle u { position: absolute; left: 12px; right: 12px; bottom: 14px; height: 24px; background: linear-gradient(135deg, transparent 49%, #272c34 50%) 0 0 / 34px 24px no-repeat, linear-gradient(225deg, transparent 49%, #272c34 50%) 34px 6px / 34px 18px no-repeat; text-decoration: none; }
.${P}-main { position: relative; flex: none; height: 100%; aspect-ratio: 1; overflow: hidden; }
.${P}-main img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-band { position: relative; flex: none; height: 9px; margin: 0 3px; background: #24272d; overflow: hidden; }
.${P}-fill { position: absolute; left: 0; top: 0; bottom: 0; width: 0%; background: #1683de; }
.${P}-cap { position: absolute; left: 0; right: 0; top: 0; line-height: 9px; text-align: center; font-size: 5.5px; color: #f3f5f8; white-space: nowrap; }
.${P}-strip { flex: none; display: grid; grid-template-columns: repeat(${COUNT}, minmax(0, 1fr)); gap: 3px; box-sizing: border-box; height: 54px; padding: 8px 3px 0; }
.${P}-th { position: relative; aspect-ratio: 1; background: #1d2026; box-shadow: inset 0 0 0 1px #292d34; overflow: hidden; }
.${P}-th img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-gl { position: absolute; inset: 0; background: #1d2026; }
.${P}-gl i { position: absolute; left: 50%; top: 50%; width: 9px; height: 7px; margin: -4px 0 0 -5px; border-radius: 1.5px; box-shadow: inset 0 0 0 1px #3a3f48; }
.${P}-foot { flex: none; display: flex; align-items: center; gap: 10px; height: ${FOOT_H}px; padding: 0 8px; border-top: 1px solid #262a31; background: #20242b; font-size: 5.8px; color: #cfd3da; white-space: nowrap; }
.${P}-foot span { display: flex; align-items: center; gap: 3px; }
.${P}-foot span::before { content: ""; display: block; width: 5px; height: 5px; border-radius: 1px; box-shadow: inset 0 0 0 1px #7b818c; }
.${P}-foot .${P}-ctr { margin-left: 16px; gap: 14px; }
.${P}-foot .${P}-ctr::before { display: none; }
.${P}-foot .${P}-ctr b { font-weight: 400; color: #dfe2e7; }
.${P}-foot .${P}-ctr em { font-style: italic; color: #868c97; }
.${P}-foot .${P}-save { margin-left: auto; color: #4b5a70; }
.${P}-foot .${P}-save::before { box-shadow: inset 0 0 0 1px #4b5a70; }
.${P}-foot .${P}-stop { gap: 0; }
.${P}-foot .${P}-stop::before { box-shadow: inset 0 0 0 1px #c03030; }
`;

const PROMPT = 'a muse in a lecture hall holding up a handwritten note, meme style, bright colours';
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const GEN_AT = 0.06;                              // the cursor presses 'Generate Images'
const SWAP_AT = 0.12;                             // the label has become 'Cancel Generation'
const ISSUE = 0.16;                               // the sampler starts: the band, caption and counters come alive
const LAND = Array.from({ length: COUNT }, (_, i) => 0.4 + i * 0.1425);   // image i hard-swaps into the canvas and its slot (reading order), the last at 1.68
const STEPS = 4;
const RUN_S = 4.6;                                // the footer's 'Elapsed' at the last landing (real: 2.5 s for four images), compressed into the beat
const arBtn = (w, h) => `<span><i style="width: ${w}px; height: ${h}px"></i></span>`;
const fmt = (v) => v.toFixed(1);

export default {
  id: 'amd-amuse',
  label: 'AMD Amuse (2024)',
  source: {
    platform: "AMD Amuse 2.0.0 beta (TensorStack AI), the Windows desktop app, 'Generate' tab (the official Amuse AI channel on YouTube, 2024-08-06)",
    feature: "near-black desktop window: the primary button's label swaps in place to 'Cancel Generation' (amber X, amber 1 px border); a determinate #1683DE band fills along the canvas's bottom edge with the centred white caption 'Image: n/N - Step: ss/04'; the footer counters 'Elapsed: N.N s' and 'Performance: N.N it/s' tick; the canvas keeps its idle art (a neutral glyph here, not the mascot) and finished images hard-swap in while the thumbnail strip fills left to right",
    refs: [{ url: 'https://www.youtube.com/watch?v=xZ0gt1GlVIA', retrieved: '2026-10-14' }],
    // the source ran four images; ten, their one-row strip and every counter's range are ours
    extrapolated: ['Image Count 10: a ten-slot thumbnail strip in one row (the real strip holds four and scrolls) filling in reading order, the canvas showing the latest', "the caption's 'n/10', the 'Elapsed' and 'Performance' counters driven from t and compressed into the beat", "the caption reads 'Image: n/N - Step: ss/04' as on screen (the spec's plural wording does not match the frames)"],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'amd-amuse'), srcMain = ownSrc(ctx.src, 'amd-amuse-canvas');
    const slot = (g, i) => `<div class="${P}-th"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-gl"><i></i></div></div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-top">Amuse v2.0.0<em>beta</em><div class="${P}-tabs"><span class="${P}-on">Generate</span><span>AI Filters</span><span>Design</span></div><div class="${P}-win"><i></i><i></i><i></i></div></div><div class="${P}-body"><div class="${P}-left"><div class="${P}-hd">Welcome to Amuse Generate!<small>Generate images using AI and Stable Diffusion</small></div><div class="${P}-lab">Prompt</div><div class="${P}-prompt">${x.esc(PROMPT)}</div><div class="${P}-lab" style="text-align: center">Performance</div><div class="${P}-sl"><b style="left: 46%"></b></div><div class="${P}-sl2"><span>Fast</span><span>Balanced</span><span>Quality</span></div><div class="${P}-two"><div><div class="${P}-lab" style="text-align: center; margin-top: 4px">Image Count</div><div class="${P}-cnt"><div class="${P}-sl"><b style="left: 90%"></b></div>${COUNT}</div></div><div><div class="${P}-lab" style="text-align: center; margin-top: 4px">Aspect Ratio</div><div class="${P}-ar">${arBtn(7, 7)}${arBtn(9, 6)}${arBtn(6, 9)}</div></div></div><div class="${P}-xd">AMD XDNA™ Super Resolution<div class="${P}-sw"></div><div class="${P}-ico"><i></i><i></i></div></div><div class="${P}-go"><b></b><span>Generate Images</span></div></div><div class="${P}-right"><div class="${P}-cv"><div class="${P}-idle"><i></i><u></u></div><div class="${P}-main" style="visibility: hidden"><img src="${srcMain}" width="870" height="1024" decoding="sync" alt="Latest render"/></div></div><div class="${P}-band"><div class="${P}-fill"></div><div class="${P}-cap"></div></div><div class="${P}-strip">${tiles.map(slot).join('')}</div></div></div><div class="${P}-foot"><span>Advanced</span><span>Settings</span><span>Logs</span><span class="${P}-ctr"><b></b><b></b></span><span class="${P}-save">Save Image</span><span class="${P}-stop"></span></div></div>`);
    const q = (sel) => root.querySelector(`.${P}-${sel}`);
    const go = q('go'), goX = go.querySelector('b'), goT = go.querySelector('span');
    const idle = q('idle'), main = q('main'), mainImg = main.querySelector('img');
    const band = q('band'), fill = q('fill'), cap = q('cap'), save = q('save'), ctr = q('ctr');
    const elapsedEl = ctr.children[0], perfEl = ctr.children[1];
    const cells = [...root.querySelectorAll(`.${P}-th`)].map((n, i) => ({ im: n.querySelector('img'), gl: n.querySelector(`.${P}-gl`), g: tiles[i] }));
    ctx.gate([...cells.map((c) => c.im), mainImg]);

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // the cursor presses the button; its label swaps in place to 'Cancel Generation' and flips back when the last image is in
        const gp = press(s, GEN_AT, 0.06, 0.06, 0.14);
        put('gp', gp.toFixed(3), () => { go.style.transform = gp > 0 ? `scale(${(1 - 0.03 * gp).toFixed(4)})` : 'none'; });
        const cancel = s >= SWAP_AT && s < LAND[COUNT - 1];
        put('can', cancel, (v) => {
          goT.textContent = v ? 'Cancel Generation' : 'Generate Images';
          goX.textContent = v ? '✕' : '✦';
          goX.style.color = v ? '#e0b030' : '#7ed957';
          goT.style.color = v ? '#efe6c8' : '#cfe8c4';
          go.style.boxShadow = v ? 'inset 0 0 0 1px #c9a227' : 'inset 0 0 0 1px #3b5a3b';
        });

        // how many images are in, and the one the sampler is on
        let n = 0;
        for (let i = 0; i < COUNT; i++) if (s >= LAND[i]) n = i + 1;
        const cur = Math.min(n, COUNT - 1);
        const a = cur === 0 ? ISSUE : LAND[cur - 1];
        const p = n >= COUNT ? 1 : seg(s, a, LAND[cur]);
        const running = s >= ISSUE && n < COUNT;

        // the band along the canvas's bottom edge, with its caption
        put('band', running ? 1 : 0, (v) => { band.style.visibility = v ? '' : 'hidden'; });
        const w = running ? ((cur + p) / COUNT) * 100 : 0;
        put('w', w.toFixed(2), (v) => { fill.style.width = `${v}%`; });
        const step = Math.max(1, Math.ceil(p * STEPS - 1e-9));
        put('cap', running ? `${cur + 1}.${step}` : '', () => { cap.textContent = running ? `Image: ${cur + 1}/${COUNT} - Step: ${String(step).padStart(2, '0')}/${String(STEPS).padStart(2, '0')}` : ''; });

        // the footer counters: stale from the last run until the sampler starts, then climbing from zero; they stop at the end
        const run = seg(s, ISSUE, LAND[COUNT - 1]);
        const el = s < ISSUE ? 3.1 : run * RUN_S;
        const pf = s < ISSUE ? 10.6 : run === 0 ? 0 : run >= 1 ? 10.1 : 8.4 + 2.7 * Math.sin(run * 17) - 2.2 * (1 - seg(run, 0, 0.1));
        put('el', fmt(el), (v) => { elapsedEl.innerHTML = `<em>Elapsed:</em> ${v} s`; });
        put('pf', fmt(Math.max(0, pf)), (v) => { perfEl.innerHTML = `<em>Performance:</em> ${v} it/s`; });
        put('sv', n > 0, (v) => { save.style.color = v ? '#2d85e0' : ''; });

        // the canvas keeps its idle glyph until the first image hard-swaps in, then shows the latest finished one
        put('idle', n > 0, (v) => { idle.style.display = v ? 'none' : ''; main.style.visibility = v ? '' : 'hidden'; });
        const li = Math.max(0, n - 1);
        put('mi', li, (v) => { mainImg.style.transformOrigin = tiles[v].origin; mainImg.style.transform = restTransform(tiles[v]); mainImg.style.filter = restFilter(tiles[v]); });

        // the strip: each slot gives its glyph to the finished picture, left to right
        cells.forEach((c, i) => {
          const done = i < n;
          put(`i${i}`, done, (v) => { c.im.style.visibility = v ? '' : 'hidden'; c.gl.style.display = v ? 'none' : ''; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
        });
      },
    };
  },
};
