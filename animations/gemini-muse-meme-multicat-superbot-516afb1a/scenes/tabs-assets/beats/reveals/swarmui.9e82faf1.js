// SwarmUI (2024), the open-source web UI's Generate tab as it looks while a text-to-image run is working (YouTube SNyofCxYyds, a
// MimicPC tutorial published 2024-12-10, t=234.5-238.9 s generating / t=239.0 s complete; spec .tmp/clone-9e82faf1/reveal-refs/swarmui/
// spec.json, confidence 0.55, frames af2_swarm_generating_t235.0.png, af2_swarm_generating_t236.9.png, af2_swarm_cancelx_t235.0.png,
// af2_swarm_complete_t239.0.png). A flat dark web shell: the tab row Simple | Generate | Comfy Workflow | Utilities | User | Server, a
// filterable parameter rail on the left (Core Parameters with Images, Seed, Steps, CFG Scale, then collapsed groups), the image canvas in
// the middle with the two prompt boxes, the amber token counter and a purple Generate button (with its caret) under it, the session status
// line and the bottom Image History | Presets | Models | ... panel. The run itself draws NOTHING in the canvas: no placeholder, spinner,
// preview or bar. The only signs of work are a rounded 'x' (cancel) beside Generate that is dark red while the run is in progress and
// no longer red afterwards, and the status line 'Model: <name> | 1 current generation, 1 queued, 1 waiting on model load, ...'. A
// finished image hard-swaps into the canvas with its toolbar and metadata line.
// Adapted to ten images: the canvas keeps hard-swapping to the newest finished picture while the right-hand batch strip gains one
// thumbnail per image, top to bottom, in reading order; the status counts step down as images land and the line goes away after the
// last one. Omitted: the MimicPC cloud-desktop header (credits, timer, Extend/Stop/Relaunch) and the presenter's arrows and circles.
// The footage's picture is never reproduced: every picture is our own meme, and no logo, wordmark or platform font is drawn.
import { press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-swu';
const ROOT_H = 400, RAIL_W = 128, STRIP_W = 36, THUMB = 28;
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 8px; background: #1f2125; color: #d9dadd; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #2c2f35; }
.${P}-top { flex: none; display: flex; align-items: center; gap: 2px; height: 18px; padding: 0 6px; box-shadow: 0 1px 0 #34373d; }
.${P}-tab { box-sizing: border-box; display: flex; align-items: center; height: 18px; padding: 0 7px; font-size: 7px; color: #9a9ca2; white-space: nowrap; }
.${P}-on { color: #f1f1f3; box-shadow: inset 0 -1.5px 0 #6d66b7; }
.${P}-qt { margin-left: auto; display: flex; align-items: center; gap: 3px; height: 12px; padding: 0 6px; border-radius: 6px; background: #2a2d33; font-size: 6.5px; color: #b6b8bd; white-space: nowrap; }
.${P}-mid { flex: 1; min-height: 0; display: flex; }
.${P}-rail { flex: none; box-sizing: border-box; display: flex; flex-direction: column; width: ${RAIL_W}px; padding: 6px 6px 4px 8px; box-shadow: 1px 0 0 #2c2f35; overflow: hidden; }
.${P}-fil { flex: none; height: 12px; margin-bottom: 4px; font-size: 6.5px; line-height: 12px; color: #6f7279; box-shadow: 0 1px 0 #3a3d44; }
.${P}-grp { flex: none; display: flex; align-items: center; gap: 4px; height: 13px; font-size: 7px; font-weight: 600; color: #e6e7ea; white-space: nowrap; }
.${P}-grp svg { width: 5px; height: 5px; fill: #b2b4b9; }
.${P}-prm { flex: none; display: flex; align-items: center; gap: 4px; height: 14px; padding-left: 8px; font-size: 6.5px; color: #d9dadd; white-space: nowrap; }
.${P}-prm i { flex: none; width: 7px; height: 7px; border-radius: 50%; background: #2f3238; }
.${P}-prm span { margin-left: auto; padding-right: 2px; color: #b6b8bd; }
.${P}-sld { flex: none; position: relative; height: 3px; margin: 0 2px 4px 8px; border-radius: 2px; background: #3a3d44; }
.${P}-sld i { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 2px; background: #8b83d8; }
.${P}-sld b { position: absolute; top: -2.5px; width: 8px; height: 8px; border-radius: 50%; background: #9a9ca2; }
.${P}-col { flex: none; display: flex; align-items: center; gap: 4px; height: 15px; font-size: 6.5px; color: #d9dadd; white-space: nowrap; }
.${P}-col svg { width: 5px; height: 5px; fill: none; stroke: #b2b4b9; stroke-width: 1.4; stroke-linecap: round; stroke-linejoin: round; }
.${P}-col em { margin-left: auto; width: 14px; height: 7px; border-radius: 4px; background: #34373d; }
.${P}-adv { margin-top: auto; flex: none; display: flex; align-items: center; gap: 3px; height: 12px; font-size: 6px; color: #b6b8bd; white-space: nowrap; }
.${P}-adv i { flex: none; width: 6px; height: 6px; border-radius: 1px; box-shadow: inset 0 0 0 1px #8d9097; }
.${P}-cen { flex: 1; min-width: 0; display: flex; flex-direction: column; padding: 4px 4px 0 6px; }
.${P}-cv { flex: 1; min-height: 0; display: flex; align-items: center; justify-content: center; border-radius: 2px; background: #1b1d21; box-shadow: inset 0 0 0 1px #2c2f35, 0 1px 0 #6c6f76; overflow: hidden; }
.${P}-main { display: flex; flex-direction: column; align-items: center; gap: 4px; width: 100%; }
.${P}-big { position: relative; width: 156px; height: 156px; overflow: hidden; background: #0e1014; }
.${P}-big img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-btns { display: flex; gap: 3px; }
.${P}-btns span { box-sizing: border-box; height: 12px; padding: 0 5px; border-radius: 6px; background: #34373d; font-size: 6px; line-height: 12px; color: #d9dadd; white-space: nowrap; }
.${P}-meta { display: flex; flex-wrap: wrap; justify-content: center; gap: 2px 3px; width: 92%; }
.${P}-meta span { box-sizing: border-box; height: 9px; padding: 0 3px; border-radius: 4px; background: #2a2d33; font-size: 4.8px; line-height: 9px; color: #c3c5ca; white-space: nowrap; }
.${P}-cnt { flex: none; height: 11px; padding-right: 98px; font-size: 6px; line-height: 12px; text-align: right; color: #a5a7ac; }
.${P}-in { flex: none; display: flex; align-items: flex-start; gap: 5px; height: 40px; }
.${P}-boxes { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.${P}-box { box-sizing: border-box; height: 17px; padding: 0 5px; border-radius: 2px; background: #0e1014; box-shadow: inset 0 0 0 1px #34373d; font-size: 7px; line-height: 17px; color: #e3e4e7; white-space: nowrap; overflow: hidden; }
.${P}-gen { flex: none; display: flex; align-items: stretch; width: 93px; height: 33px; border-radius: 9px; overflow: hidden; background: #6d66b7; }
.${P}-gen div { display: flex; align-items: center; justify-content: center; }
.${P}-gl { flex: 1; font-size: 9px; font-weight: 500; color: #fbfaff; }
.${P}-gc { flex: none; width: 17px; box-shadow: inset 1px 0 0 rgba(20, 18, 40, .35); }
.${P}-gc svg { width: 7px; height: 7px; fill: #fbfaff; }
.${P}-gx { flex: none; width: 17px; font-size: 9px; font-weight: 700; color: #f2f2f4; }
.${P}-str { flex: none; display: flex; flex-direction: column; align-items: center; gap: 3px; box-sizing: border-box; width: ${STRIP_W}px; padding: 4px 0 4px 0; box-shadow: -1px 0 0 #2c2f35; }
.${P}-th { position: relative; flex: none; width: ${THUMB}px; height: ${THUMB}px; overflow: hidden; }
.${P}-th img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-stat { flex: none; display: flex; align-items: center; gap: 4px; height: 14px; padding: 0 8px; font-size: 6.5px; color: #c9cbd0; white-space: nowrap; overflow: hidden; box-shadow: 0 -1px 0 #2c2f35; }
.${P}-stat svg { width: 5px; height: 5px; fill: none; stroke: #b2b4b9; stroke-width: 1.4; stroke-linecap: round; stroke-linejoin: round; }
.${P}-bot { flex: none; display: flex; flex-direction: column; height: 50px; box-shadow: 0 -1px 0 #34373d; overflow: hidden; }
.${P}-bt { flex: none; display: flex; height: 17px; }
.${P}-bt span { flex: 1; display: grid; place-items: center; font-size: 7px; color: #9a9ca2; white-space: nowrap; }
.${P}-bt .${P}-on { color: #f1f1f3; box-shadow: none; }
.${P}-bc { flex: none; display: flex; align-items: center; gap: 5px; height: 18px; padding: 0 8px; font-size: 6.5px; color: #c9cbd0; white-space: nowrap; }
.${P}-bc em { font-style: normal; box-sizing: border-box; height: 11px; padding: 0 5px; border-radius: 2px; background: #2f3238; line-height: 11px; }
.${P}-bc u { text-decoration: none; display: block; width: 9px; height: 11px; border-radius: 2px; background: #3a3d44; }
.${P}-bc s { text-decoration: none; margin-left: auto; color: #8d9097; }
`;

const PROMPT = 'A muse holding a handwritten sticky note in a lecture hall, meme style';
const NEG = 'low quality, blurry, text.';
const MODEL = 'sdxl/2dnPony_v10';
const SEED0 = 1859197682;
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const GEN_AT = 0.06;                              // the cursor presses Generate
const ISSUE = 0.16;                               // the run starts: the x turns red and the status line appears
const LAND = Array.from({ length: 10 }, (_, i) => 0.4 + i * 0.1425);   // image i hard-swaps in (reading order), the last at 1.68
const META = (i) => ['steps: 25', 'cfgscale: 7', 'aspectratio: 1:1', 'width: 1024', 'height: 1024', `model: ${MODEL}`, `seed: ${SEED0 + i * 7919}`, 'sampler: dpmpp_2m', 'scheduler: karras', 'automaticvae: true'];

export default {
  id: 'swarmui',
  label: 'SwarmUI (2024)',
  source: {
    platform: 'SwarmUI (mcmonkeyprojects/SwarmUI) web UI, build v0.9.3.1 (2024-10-16), Generate tab, desktop browser dark theme, driven inside a MimicPC cloud desktop (a tutorial screen recording on YouTube, channel MIMICPC, 2024-12-10)',
    feature: "flat dark shell: the tab row Simple | Generate | Comfy Workflow | Utilities | User | Server, a filterable parameter rail, the canvas that stays completely empty while the run works (no placeholder, spinner or preview), the prompt boxes with the static '9/75, Neg: 7/75'-style token counter, a purple Generate button (label and caret unchanged) with a rounded cancel 'x' that is red while running and no longer red after, the status line 'Model: <name> | 1 current generation, 1 queued, 1 waiting on model load, ...' and the bottom Image History | Presets | Models panel; finished pictures hard-swap into the canvas (adapted to 10: the canvas shows the newest picture while the batch strip at the right gains one thumbnail per image in reading order; the cloud-desktop header and the presenter's arrows are omitted)",
    refs: [{ url: 'https://www.youtube.com/watch?v=SNyofCxYyds', retrieved: '2026-10-14' }],
    extrapolated: [
      'ten images: the source run makes ONE image; the nine others are extended in the app\'s own output layout (the canvas hard-swaps to the newest picture; the right-hand batch strip lists the batch top to bottom), and the Images field reads 10',
      'no progress bar, percentage, step counter or placeholder is drawn anywhere: none appears in this build\'s footage, the canvas stays empty until the first picture lands',
      'the status counts (1 current generation, N queued, 1 waiting on model load) step down as images land, the waiting-on-model-load clause going after the first picture and the whole text after the last; the exact wording of the intermediate counts is extrapolated from the single observed line',
      'the right-hand batch strip is cropped off in the footage, so its thumbnails (size, order, no pending slots) are extrapolated; the per-image metadata line shows a seed that steps per image',
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'swarmui');
    const srcMain = ownSrc(ctx.src, 'swarmui-main');
    const thumb = (g, i) => `<div class="${P}-th"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/></div>`;
    const caret = `<svg viewBox="0 0 10 10"><path d="M1 2.5h8L5 8.5z"/></svg>`;
    const arrow = `<svg viewBox="0 0 10 10"><path d="M2.5 1.5l5 3.5-5 3.5z"/></svg>`;
    const chev = '<svg viewBox="0 0 12 12"><path d="M3 4.5l3 3 3-3"/></svg>';
    const grp = (n) => `<div class="${P}-col"><svg viewBox="0 0 10 10"><path d="M3 1.5l4 3.5-4 3.5"/></svg>${n}<em></em></div>`;
    const root = x.el(`<div class="${P}">`
      + `<div class="${P}-top"><div class="${P}-tab">Simple</div><div class="${P}-tab ${P}-on">Generate</div><div class="${P}-tab">Comfy Workflow</div><div class="${P}-tab">Utilities</div><div class="${P}-tab">User</div><div class="${P}-tab">Server</div><div class="${P}-qt">Quick Tools${chev}</div></div>`
      + `<div class="${P}-mid">`
      + `<div class="${P}-rail"><div class="${P}-fil">Filter parameters...</div><div class="${P}-grp">${arrow}Core Parameters</div>`
      + `<div class="${P}-prm"><i></i>Images<span>10</span></div><div class="${P}-prm"><i></i>Seed<span>-1</span></div>`
      + `<div class="${P}-prm"><i></i>Steps<span>25</span></div><div class="${P}-sld"><i style="width: 25%"></i><b style="left: 22%"></b></div>`
      + `<div class="${P}-prm"><i></i>CFG Scale<span>7</span></div><div class="${P}-sld"><i style="width: 35%"></i><b style="left: 32%"></b></div>`
      + `${grp('Variation Seed')}${grp('Resolution: 1:1 (1024×1024)')}${grp('Sampling')}${grp('Init Image')}${grp('Refine / Upscale')}${grp('ControlNet')}`
      + `<div class="${P}-adv"><i></i>Display Advanced Options? (66)</div></div>`
      + `<div class="${P}-cen"><div class="${P}-cv"><div class="${P}-main" style="visibility: hidden"><div class="${P}-big"><img src="${srcMain}" width="870" height="1024" decoding="sync" alt="Latest output, Muse meme"/></div><div class="${P}-btns"><span>Use As Init</span><span>Edit Image</span><span>Star</span><span>Reuse Parameters</span><span>More ▾</span></div><div class="${P}-meta"><span class="${P}-mp">prompt: ${x.esc(PROMPT)}</span><span>negativeprompt: ${x.esc(NEG)}</span>${META(0).map((m) => `<span>${x.esc(m)}</span>`).join('')}</div></div></div>`
      + `<div class="${P}-cnt">14/75, Neg: 7/75</div>`
      + `<div class="${P}-in"><div class="${P}-boxes"><div class="${P}-box">${x.esc(PROMPT)}</div><div class="${P}-box">${x.esc(NEG)}</div></div><div class="${P}-gen"><div class="${P}-gl">Generate</div><div class="${P}-gc">${caret}</div><div class="${P}-gx">×</div></div></div></div>`
      + `<div class="${P}-str">${tiles.map(thumb).join('')}</div>`
      + `</div>`
      + `<div class="${P}-stat"><span>Model: ${MODEL}</span>${chev}<span class="${P}-st"></span></div>`
      + `<div class="${P}-bot"><div class="${P}-bt"><span class="${P}-on">Image History</span><span>Presets</span><span>Models</span><span>VAEs</span><span>LoRAs</span><span>Embeddings</span><span>ControlNets</span><span>Wildcards</span></div><div class="${P}-bc"><em>Small Cards ▾</em><u></u><u></u><span>Depth: 3</span><span>Filter...</span><span>Sort: Name ▾</span><span>Reverse</span><s>Root / sdxl / 43</s></div></div>`
      + `</div>`);
    const gen = root.querySelector(`.${P}-gen`), gx = root.querySelector(`.${P}-gx`), stat = root.querySelector(`.${P}-st`);
    const main = root.querySelector(`.${P}-main`), big = root.querySelector(`.${P}-big img`), metaEls = [...root.querySelectorAll(`.${P}-meta span`)];
    const thumbs = [...root.querySelectorAll(`.${P}-th img`)].map((im, i) => ({ im, g: tiles[i] }));
    ctx.gate([big, ...thumbs.map((c) => c.im)]);

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
        put('go', gp.toFixed(3), () => { gen.style.transform = gp > 0 ? `scale(${(1 - 0.05 * gp).toFixed(4)})` : 'none'; });

        // how many pictures have landed, and whether the run is in progress
        let n = 0;
        for (let i = 0; i < LAND.length; i++) if (s >= LAND[i]) n = i + 1;
        const running = s >= ISSUE && n < LAND.length;
        put('x', running, (v) => { gx.style.background = v ? '#8b1e1e' : '#34373d'; });

        // the session status line: counts step down as images land; nothing once the batch is done
        const r = LAND.length - n;
        const text = running ? `| 1 current generation, ${r} queued${n === 0 ? ', 1 waiting on model load' : ''}, ...` : '';
        put('stat', text, (v) => { stat.textContent = v; });

        // the canvas stays empty until the first picture lands, then hard-swaps to the newest one
        put('main', n > 0, (v) => { main.style.visibility = v ? '' : 'hidden'; });
        const cur = Math.max(0, n - 1), g = tiles[cur];
        put('big', cur, () => { big.style.transformOrigin = g.origin; big.style.transform = restTransform(g); big.style.filter = restFilter(g); });
        put('meta', cur, () => { META(cur).forEach((m, j) => { metaEls[2 + j].textContent = m; }); });

        thumbs.forEach((c, i) => {
          put(`i${i}`, s >= LAND[i], (v) => { c.im.style.visibility = v ? '' : 'hidden'; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
        });
      },
    };
  },
};
