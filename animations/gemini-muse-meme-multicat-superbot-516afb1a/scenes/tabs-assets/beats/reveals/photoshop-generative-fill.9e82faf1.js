// Photoshop's Generative Fill / Generate Image pending state, in the desktop app (YouTube 2CKbKbaEulI 2024-05-06, t~220 s, and
// SB60EQG2HyE 2025-01-07, t~146.5-189 s; spec .tmp/clone-9e82faf1/reveal-refs/photoshop-generative-fill/spec.json, confidence 0.83;
// frames p_genimage_generating_toast.png, p_genimage_result_variations_1of3.png, p_genfill2025_results_4of6.png). Dark-grey desktop
// chrome: a menu bar, an options bar, a tool strip, a document tab, a canvas, a status line, and on the right the Properties panel
// (Generative Layer, prompt, Generate, 'Variations n/N') above the Layers panel. Generate puts a dark #4D4D4D 'Generating' toast
// top-centre of the canvas (a green #0AB124 determinate bar on a #E7E7E7 track, an italic Tip line, an outlined Cancel pill) over a
// blank white document, and the Variations grid fills with #343434 rounded tiles each turning a blue (#1B5EB7) ring; a slot hard-swaps
// to its finished thumbnail as it lands, the document then shows the selected variation (a marching-ants selection around it, and a
// contextual task bar with '< k/N >' and Generate), and the toast goes away.
// Adapted to ten: 'Variations k/10', ten slots landing in strict sequence (4 + 4 + 2 grid), the document showing the latest landed
// variation as the selected one, the toast's bar filling over the whole beat. Omitted: the footage's own pictures (every tile is our
// meme), the Ps badge and every Adobe mark, the app's icon font and the adjustments list; the tools are plain outlined shapes.
import { press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-pgf';
const ROOT_H = 430, TOOLS_W = 22, PANEL_W = 156, COLS = 4;
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 6px; background: #535353; color: #d4d4d4; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #1d1d1d; }
.${P}-mb { flex: none; display: flex; align-items: center; gap: 9px; height: 16px; padding: 0 8px; background: #323232; font-size: 7px; color: #d9d9d9; white-space: nowrap; }
.${P}-ob { flex: none; display: flex; align-items: center; gap: 8px; height: 20px; padding: 0 8px; background: #3d3d3d; box-shadow: 0 1px 0 #2a2a2a; font-size: 7px; color: #cfcfcf; white-space: nowrap; }
.${P}-ob i { flex: none; display: block; width: 8px; height: 8px; box-sizing: border-box; border: 1.2px solid #c8c8c8; border-radius: 2px; }
.${P}-ob u { text-decoration: none; box-sizing: border-box; height: 12px; padding: 0 12px 0 5px; border-radius: 2px; background: #2f2f2f; line-height: 12px; color: #a9a9a9; }
.${P}-ob b { margin-left: auto; box-sizing: border-box; height: 13px; padding: 0 8px; border-radius: 7px; box-shadow: inset 0 0 0 1px #bdbdbd; font-weight: 500; line-height: 13px; color: #e9e9e9; }
.${P}-bd { flex: 1; min-height: 0; display: flex; }
.${P}-tools { flex: none; display: flex; flex-direction: column; align-items: center; gap: 7px; width: ${TOOLS_W}px; padding-top: 8px; background: #3d3d3d; }
.${P}-tools i { display: block; width: 8px; height: 8px; box-sizing: border-box; border: 1.2px solid #b9b9b9; border-radius: 2px; }
.${P}-tools i.r { border-radius: 50%; }
.${P}-tools i.l { height: 1.3px; border: 0; background: #b9b9b9; transform: rotate(-35deg); }
.${P}-cv { flex: 1; min-width: 0; display: flex; flex-direction: column; background: #282828; }
.${P}-tab { flex: none; display: flex; align-items: flex-end; height: 14px; padding-left: 6px; background: #323232; }
.${P}-tab span { box-sizing: border-box; height: 12px; padding: 0 8px; border-radius: 3px 3px 0 0; background: #535353; font-size: 6.8px; line-height: 12px; color: #e6e6e6; white-space: nowrap; }
.${P}-doc { position: relative; flex: 1; min-height: 0; }
.${P}-page { position: absolute; left: 50%; top: 8px; width: 277px; height: 326px; margin-left: -138px; background: #ffffff; overflow: hidden; box-shadow: 0 0 0 1px #151515; }
.${P}-page img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-ants { position: absolute; left: 7px; top: 7px; right: 7px; bottom: 7px; width: calc(100% - 14px); height: calc(100% - 14px); overflow: visible; }
.${P}-ants rect { fill: none; stroke-width: 1; }
.${P}-toast { position: absolute; left: 50%; top: 14px; width: 176px; margin-left: -88px; box-sizing: border-box; padding: 7px 9px 8px; border-radius: 2px; background: #4d4d4d; box-shadow: 0 1px 4px rgba(0, 0, 0, .35); color: #f0f0f0; }
.${P}-toast h6 { margin: 0 0 4px; font: 700 7.5px/9px ${UI_FONT}; color: #f4f4f4; }
.${P}-bar { height: 7px; background: #e7e7e7; }
.${P}-bar i { display: block; height: 100%; width: 0; background: #0ab124; }
.${P}-tip { margin-top: 5px; font-size: 6.3px; line-height: 8px; color: #d6d6d6; }
.${P}-tip em { font-style: italic; color: #cfcfcf; }
.${P}-cn { display: grid; place-items: center; width: 38px; height: 12px; margin: 5px 0 0 auto; box-sizing: border-box; border-radius: 6px; box-shadow: inset 0 0 0 1px #c9c9c9; font-size: 6.5px; color: #f1f1f1; }
.${P}-task { position: absolute; left: 50%; bottom: 14px; display: flex; align-items: center; gap: 6px; box-sizing: border-box; height: 15px; padding: 0 6px; margin-left: -80px; width: 160px; border-radius: 3px; background: #3a3a3a; box-shadow: 0 1px 3px rgba(0, 0, 0, .45); font-size: 6.4px; color: #e6e6e6; white-space: nowrap; }
.${P}-task span { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; color: #bdbdbd; }
.${P}-task b { flex: none; font-weight: 500; }
.${P}-task u { flex: none; text-decoration: none; box-sizing: border-box; height: 10px; padding: 0 5px; border-radius: 2px; box-shadow: inset 0 0 0 1px #8d8d8d; line-height: 10px; }
.${P}-st { flex: none; display: flex; align-items: center; height: 12px; padding: 0 6px; background: #323232; font-size: 6.3px; color: #b3b3b3; white-space: nowrap; }
.${P}-side { flex: none; display: flex; flex-direction: column; width: ${PANEL_W}px; background: #535353; box-shadow: -1px 0 0 #2a2a2a; }
.${P}-ptabs { flex: none; display: flex; gap: 9px; height: 15px; padding: 0 7px; font-size: 7px; line-height: 15px; color: #a9a9a9; white-space: nowrap; box-shadow: 0 1px 0 #3d3d3d; }
.${P}-ptabs .on { color: #f1f1f1; box-shadow: 0 1.2px 0 #f1f1f1; }
.${P}-gl { flex: none; display: flex; align-items: center; gap: 5px; height: 15px; padding: 0 7px; font-size: 7px; color: #bcbcbc; }
.${P}-gl i { display: block; width: 8px; height: 8px; box-sizing: border-box; border: 1.2px solid #d3d3d3; border-radius: 2px; transform: rotate(45deg) scale(.8); }
.${P}-lab { padding: 3px 7px 2px; font-size: 6.4px; color: #bdbdbd; }
.${P}-prm { box-sizing: border-box; height: 32px; margin: 0 7px; padding: 4px 5px; background: #3f3f3f; box-shadow: inset 0 0 0 1px #4a4a4a; font-size: 6.6px; line-height: 8.5px; color: #e4e4e4; overflow: hidden; }
.${P}-gen { display: grid; place-items: center; width: 52px; height: 14px; box-sizing: border-box; margin: 6px 7px 0 auto; border-radius: 2px; box-shadow: inset 0 0 0 1px #8b8b8b; font-size: 6.8px; color: #ededed; }
.${P}-vh { flex: none; display: flex; align-items: center; justify-content: space-between; height: 16px; margin-top: 4px; padding: 0 7px; font-size: 7px; color: #d0d0d0; }
.${P}-vh span { color: #a9a9a9; }
.${P}-g { display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: 5px; padding: 3px 7px 0; }
.${P}-t { position: relative; aspect-ratio: 1; border-radius: 2px; overflow: hidden; background: #343434; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; display: grid; place-items: center; background: #343434; }
.${P}-ring { display: block; box-sizing: border-box; width: 14px; height: 14px; border-radius: 50%; border: 1.8px solid #1b5eb7; border-right-color: transparent; }
.${P}-lyr { margin-top: auto; flex: none; box-shadow: 0 -1px 0 #3d3d3d; }
.${P}-lrow { display: flex; align-items: center; gap: 5px; height: 19px; padding: 0 7px; font-size: 6.6px; color: #dcdcdc; white-space: nowrap; }
.${P}-lrow.on { background: #656565; }
.${P}-lrow s { flex: none; display: block; width: 14px; height: 14px; background: #fff; box-shadow: 0 0 0 1px #2f2f2f; }
.${P}-lrow s.ck { background: repeating-conic-gradient(#d7d7d7 0% 25%, #fff 0% 50%) 0 0 / 5px 5px; }
`;

const PROMPT = 'a muse holding a handwritten note in a lecture hall, meme style';
const GEN_AT = 0.06;                                // Generate is pressed
const ISSUE = 0.14;                                 // the toast and the ten tile slots appear
const FILL = (n) => `${n}/10`;
const TOOLS = ['', 'r', '', 'l', '', 'r', '', '', 'r', ''];

export default {
  id: 'photoshop-generative-fill',
  label: 'Photoshop Generative Fill',
  source: {
    platform: 'Adobe Photoshop desktop app (macOS), Generative Fill / Generate Image on a Generative Layer (screen recordings, 2024-05-06 and 2025-01-07)',
    feature: "dark desktop chrome; a blank white canvas under a dark 'Generating' toast (green determinate bar, italic Tip, outlined Cancel); the Properties panel's Variations grid of #343434 tiles each with a blue ring spinner, swapping to thumbnails as they land (adapted to 10: Variations k/10, strict sequence, the canvas showing the latest variation)",
    refs: [
      { url: 'https://www.youtube.com/watch?v=2CKbKbaEulI', retrieved: '2026-10-14' },
      { url: 'https://www.youtube.com/watch?v=SB60EQG2HyE', retrieved: '2026-10-14' },
    ],
    extrapolated: 'the ten-variation count (the footage shows 3 or 6), the strict one-after-another landing, the marching-ants frame and task bar showing during the run rather than after it',
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'photoshop-generative-fill');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-pend"><i class="${P}-ring"></i></div></div>`;
    const menus = ['File', 'Edit', 'Image', 'Layer', 'Type', 'Select', 'Filter', 'View', 'Plugins', 'Window', 'Help'];
    const root = x.el(`<div class="${P}"><div class="${P}-mb">${menus.map((m) => `<span>${m}</span>`).join('')}</div><div class="${P}-ob"><i></i><span>Auto-Select:</span><u>Layer</u><b>Share</b></div><div class="${P}-bd"><div class="${P}-tools">${TOOLS.map((k) => `<i class="${k}"></i>`).join('')}</div><div class="${P}-cv"><div class="${P}-tab"><span>Untitled-1 @ 88.9% (RGB/8)</span></div><div class="${P}-doc"><div class="${P}-page"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme canvas" style="visibility: hidden"/><svg class="${P}-ants" xmlns="http://www.w3.org/2000/svg"><rect x="0.5" y="0.5" width="100%" height="100%" stroke="#ffffff"/><rect class="${P}-dash" x="0.5" y="0.5" width="100%" height="100%" stroke="#000000" stroke-dasharray="3 3"/></svg><div class="${P}-task" style="display: none"><span>${x.esc(PROMPT)}</span><b>‹ <i class="${P}-k">1/10</i> ›</b><u>Generate</u></div></div><div class="${P}-toast" style="display: none"><h6>Generating</h6><div class="${P}-bar"><i></i></div><div class="${P}-tip"><em>Tip:</em> Make it uniquely yours. Use your own artwork as a reference image to generate content that reflects your personal style.</div><div class="${P}-cn">Cancel</div></div></div><div class="${P}-st">88.87%&nbsp;&nbsp;&nbsp;2048 px x 2048 px (72 ppi)</div></div><div class="${P}-side"><div class="${P}-ptabs"><span class="on">Properties</span><span>Adjustments</span><span>Libraries</span></div><div class="${P}-gl"><i></i>Generative Layer</div><div class="${P}-lab">Prompt:</div><div class="${P}-prm">${x.esc(PROMPT)}</div><div class="${P}-gen">Generate</div><div class="${P}-vh">Variations<span class="${P}-vn">0/0</span></div><div class="${P}-g" style="visibility: hidden">${tiles.map(cell).join('')}</div><div class="${P}-lyr"><div class="${P}-lrow on"><s class="ck"></s>Generative Layer</div><div class="${P}-lrow"><s></s><i style="font-style: italic">Background</i></div></div></div></div></div>`);
    const q = (s) => root.querySelector(s);
    const gen = q(`.${P}-gen`), toast = q(`.${P}-toast`), barFill = q(`.${P}-bar i`), task = q(`.${P}-task`), kEl = q(`.${P}-k`), vn = q(`.${P}-vn`), grid = q(`.${P}-g`), dash = q(`.${P}-dash`), page = q(`.${P}-page img`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ el: n, im: n.querySelector('img'), pend: n.querySelector(`.${P}-pend`), ring: n.querySelector(`.${P}-ring`), g: tiles[i] }));
    ctx.gate([...cells.map((c) => c.im), page]);
    const ends = tiles.map((_, i) => ctx.seq(i)[1]);

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const s = t - ctx.cardIn;
        const issued = s >= ISSUE;
        const done = t >= ctx.lastLand;
        const c = ends.filter((e) => t >= e).length;   // tiles landed: a growing prefix

        // Generate is pressed, then dims while the job runs
        const gp = press(s, GEN_AT, 0.06, 0.06, 0.14);
        put('gp', gp.toFixed(3), () => { gen.style.transform = gp > 0 ? `scale(${(1 - 0.06 * gp).toFixed(4)})` : 'none'; });
        put('gb', issued && !done, (v) => { gen.style.opacity = v ? '0.45' : ''; });

        // the toast: a determinate bar over the whole beat, gone once the last variation has landed
        put('toast', issued && !done, (v) => { toast.style.display = v ? '' : 'none'; });
        const f = Math.min(1, Math.max(0, (t - (ctx.cardIn + ISSUE)) / (ctx.lastLand - ctx.cardIn - ISSUE)));
        put('bar', f.toFixed(3), () => { barFill.style.width = `${(f * 100).toFixed(1)}%`; });

        // the Variations grid and its count
        put('grid', issued, (v) => { grid.style.visibility = v ? '' : 'hidden'; });
        put('vn', `${issued}${c}`, () => { vn.textContent = issued ? FILL(c) : '0/0'; });

        // the document: blank white until a variation lands, then the latest one (the selected variation), the task bar beside it
        put('page', c, (n) => {
          if (n === 0) { page.style.visibility = 'hidden'; return; }
          const g = tiles[n - 1];
          page.style.visibility = '';
          page.style.transformOrigin = g.origin;
          page.style.transform = restTransform(g);
          page.style.filter = restFilter(g);
        });
        put('task', c > 0, (v) => { task.style.display = v ? '' : 'none'; });
        put('k', c, (n) => { kEl.textContent = FILL(Math.max(1, n)); });
        // the marching ants crawl with t
        const off = ((t * 14) % 6).toFixed(1);
        put('ants', off, (o) => { dash.style.strokeDashoffset = `-${o}`; });

        cells.forEach((cl, i) => {
          const landed = t >= ends[i];
          put(`i${i}`, landed, (v) => { cl.im.style.visibility = v ? '' : 'hidden'; cl.pend.style.display = v ? 'none' : ''; });
          cl.im.style.filter = restFilter(cl.g);
          cl.im.style.transform = restTransform(cl.g);
          put(`s${i}`, landed && i === c - 1, (v) => { cl.el.style.boxShadow = v ? '0 0 0 1.5px #2f80ed' : ''; });
          // the blue ring turns with t (its phase differs per slot); a function of t alone, covered or not
          const deg = (((t * 430 + i * 53) % 360) + 360) % 360;
          put(`r${i}`, deg.toFixed(0), (d) => { cl.ring.style.transform = `rotate(${d}deg)`; });
        });
      },
    };
  },
};
