// Azure AI Foundry (Microsoft Foundry portal) Images playground (2025), the dark Fluent shell at ai.azure.com with the 'Images
// playground' page and a dall-e-3 deployment (three third-party screen recordings on YouTube: Solved Systems oyzlFQBsHYI 2025-09-15,
// Gabriel05 oZAqz_YWxJY 2025-10-11, Balaone 6wHDywW1G-I 2025-08-26; spec .tmp/clone-9e82faf1/reveal-refs/azure-ai-foundry-images/spec.json,
// confidence 0.78; frames wy_azure_02_pending.jpg, wy_azure_06_pending_tile_crop.png, wy_azure_05_landed.jpg). A near-black left
// rail, a #282828 canvas with the page title, a toolbar ('Deployments' + the dall-e-3 dropdown, 'Clear all outputs', 'View code',
// the List / Grid toggle), the output slot at the top-left of the canvas and the composer docked at the foot (prompt, size / Style /
// Quality chips, a blue 'Generate' button). Pressing Generate turns the output slot into a dark rounded tile (#1E1E1E, a faint
// #2A2A2A edge) whose centre shows a thin steel-blue arc spinner (a 'C' of about 300 degrees, brighter at the leading tip), the
// fixed caption 'Generating image...' and a small outlined 'Stop' button. There is no percentage, bar, shimmer, blur or countdown;
// the composer is dimmed with a greyed Generate; the finished picture hard-swaps into the same slot.
// Adapted to ten images: ten slots in a 4 + 4 + 2 grid, all pending from the press, swapping to the pictures one after another in
// reading order (the spinners turn from render(t)). Omitted: the portal's brand mark, the Docs / All resources links, the gear,
// the bell, the workspace switcher, the avatar and the Help button (environment chrome), the rail's PREVIEW badges and the data-use
// notice under the composer. Every picture is our own meme; no logo, wordmark or platform font is drawn (a plain arc, plain squares, system type).
import { press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-aaf';
const ROOT_H = 500, NAV_W = 104, COLS = 4, GAP = 8;
const NAV = [['Overview', 0], ['Model catalog', 0], ['Playgrounds', 1], ['Build and customize', 2], ['Agents', 0], ['Templates', 0], ['Fine-tuning', 0], ['Observe and optimize', 2], ['Tracing', 0], ['Monitoring', 0], ['Protect and govern', 2], ['Evaluation', 0], ['Guardrails + controls', 0], ['Governance', 0]];
const SAMPLES = ['Quantum computing hardware', 'Molecular Biology', 'Sci-Fi Cityscape'];
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 10px; background: #282828; color: #f0f0f0; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #3a3a3a; }
.${P}-top { flex: none; display: flex; align-items: center; gap: 6px; height: 24px; padding: 0 12px; background: #131313; font-size: 7px; color: #c8c8c8; white-space: nowrap; }
.${P}-top b { font-weight: 600; color: #f6f6f6; }
.${P}-top i { font-style: normal; color: #6b6b6b; }
.${P}-body { flex: 1; min-height: 0; display: flex; }
.${P}-nav { flex: none; box-sizing: border-box; display: flex; flex-direction: column; gap: 1px; width: ${NAV_W}px; padding: 8px 6px; background: #131313; }
.${P}-ni { display: flex; align-items: center; gap: 5px; box-sizing: border-box; height: 17px; padding: 0 5px; border-radius: 3px; font-size: 7px; color: #d4d4d4; white-space: nowrap; }
.${P}-ni em { flex: none; width: 7px; height: 7px; box-sizing: border-box; border: 1px solid #9a9a9a; border-radius: 2px; }
.${P}-ni.${P}-sel { background: #2b2b2b; box-shadow: inset 2px 0 0 #479ef5; color: #fff; font-weight: 600; }
.${P}-ni.${P}-sec { margin-top: 5px; height: 14px; font-size: 6.5px; color: #a0a0a0; }
.${P}-main { flex: 1; min-width: 0; box-sizing: border-box; display: flex; flex-direction: column; padding: 8px 12px 10px; }
.${P}-hd { flex: none; display: flex; align-items: center; gap: 6px; height: 20px; font-size: 11px; font-weight: 600; color: #fff; white-space: nowrap; }
.${P}-hd span { font-size: 9px; font-weight: 400; color: #c8c8c8; }
.${P}-tb { flex: none; display: flex; align-items: center; gap: 9px; box-sizing: border-box; height: 24px; margin-top: 4px; padding: 0 7px; border-radius: 3px; background: #1f1f1f; box-shadow: inset 0 0 0 1px #3a3a3a; font-size: 7px; color: #e2e2e2; white-space: nowrap; }
.${P}-tb b { font-weight: 600; }
.${P}-dd { display: flex; align-items: center; justify-content: space-between; box-sizing: border-box; width: 78px; height: 16px; padding: 0 6px; border-radius: 3px; background: #282828; box-shadow: inset 0 0 0 1px #4a4a4a; font-size: 7px; }
.${P}-tb s { text-decoration: none; color: #bdbdbd; }
.${P}-sw { margin-left: auto; display: flex; gap: 8px; color: #bdbdbd; }
.${P}-sw u { text-decoration: none; }
.${P}-sw u.${P}-on { color: #fff; }
.${P}-cv { position: relative; flex: 1; min-height: 0; margin-top: 10px; }
.${P}-es { position: absolute; left: 0; right: 0; top: 24px; display: flex; flex-direction: column; align-items: center; gap: 8px; font-size: 7px; color: #b8b8b8; }
.${P}-es i { display: block; width: 26px; height: 22px; border-radius: 9px 9px 9px 2px; background: linear-gradient(135deg, #479ef5, #a78bfa); }
.${P}-es b { font-size: 11px; font-weight: 600; color: #f4f4f4; }
.${P}-es div { display: flex; gap: 8px; }
.${P}-es span { box-sizing: border-box; display: grid; place-items: center; width: 104px; height: 38px; padding: 0 6px; border-radius: 5px; background: #1f1f1f; box-shadow: inset 0 0 0 1px #3a3a3a; font-size: 7px; text-align: center; color: #d6d6d6; }
.${P}-g { display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; }
.${P}-t { position: relative; aspect-ratio: 1; border-radius: 8px; overflow: hidden; background: #1e1e1e; box-shadow: inset 0 0 0 1px #2a2a2a; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 7px; background: #1e1e1e; box-shadow: inset 0 0 0 1px #2a2a2a; }
.${P}-ring { display: block; width: 22px; height: 22px; margin-bottom: 4px; border-radius: 50%; background: conic-gradient(from 0deg, rgba(62, 110, 146, 0) 0deg, #3e6e92 130deg, #86bde8 292deg, rgba(134, 189, 232, 0) 300deg); -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 2.2px), #000 calc(100% - 1.7px)); mask: radial-gradient(farthest-side, transparent calc(100% - 2.2px), #000 calc(100% - 1.7px)); }
.${P}-pend span { font-size: 6.5px; color: #b0b0b0; white-space: nowrap; }
.${P}-pend b { display: flex; align-items: center; gap: 3px; box-sizing: border-box; height: 15px; padding: 0 7px; border-radius: 3px; background: #262626; box-shadow: inset 0 0 0 1px #5a5a5a; font-size: 6.5px; font-weight: 400; color: #fff; }
.${P}-pend b i { display: block; width: 5px; height: 5px; box-sizing: border-box; border: 1px solid #e6e6e6; border-radius: 1px; }
.${P}-cp { flex: none; display: flex; flex-direction: column; gap: 6px; margin-top: 10px; }
.${P}-pr { box-sizing: border-box; height: 30px; padding: 7px 9px; border-radius: 5px; background: #1f1f1f; box-shadow: inset 0 0 0 1px #474747; font-size: 8px; line-height: 14px; color: #f0f0f0; white-space: nowrap; overflow: hidden; }
.${P}-row { display: flex; align-items: center; gap: 6px; }
.${P}-chip { box-sizing: border-box; height: 18px; padding: 0 8px; border-radius: 9px; background: #2f2f2f; box-shadow: inset 0 0 0 1px #4a4a4a; font-size: 7px; line-height: 18px; color: #e2e2e2; white-space: nowrap; }
.${P}-go { margin-left: auto; display: flex; align-items: center; gap: 4px; box-sizing: border-box; height: 20px; padding: 0 12px; border-radius: 4px; background: #0078d4; font-size: 8px; font-weight: 600; color: #fff; }
`;

const PROMPT = 'generate a muse holding a handwritten note in a lecture hall, meme style';
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const GEN_AT = 0.06;                              // the cursor presses Generate
const ISSUE = 0.16;                               // the sample cards give way to the ten pending slots

export default {
  id: 'azure-ai-foundry-images',
  label: 'Azure AI Foundry Images (2025)',
  source: {
    platform: "Azure AI Foundry (Microsoft Foundry) portal, ai.azure.com, 'Images playground' with a dall-e-3 deployment (dark Fluent theme; third-party screen recordings on YouTube, 2025-08 to 2025-10)",
    feature: "dark playground: after Generate the output slot is a dark rounded tile with a thin steel-blue arc spinner, the fixed caption 'Generating image...' and an outlined 'Stop' button (no percentage, bar, shimmer or blur), the composer dimmed; the picture hard-swaps into the same slot (adapted to 10: a 4 + 4 + 2 grid of slots, all pending from the press, swapping in strict reading order)",
    refs: [
      { url: 'https://www.youtube.com/watch?v=oyzlFQBsHYI', retrieved: '2026-10-14' },
      { url: 'https://www.youtube.com/watch?v=oZAqz_YWxJY', retrieved: '2026-10-14' },
      { url: 'https://www.youtube.com/watch?v=6wHDywW1G-I', retrieved: '2026-10-14' },
    ],
    extrapolated: "The footage shows one output slot per press: ten slots at once in a 4 + 4 + 2 grid, each carrying its own spinner, caption and Stop button, landing one after another in reading order, the empty-canvas sample cards and the composer's greyed Generate are extrapolated from the product around the clips. The rail entries are indicative.",
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'azure-ai-foundry-images');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-pend"><i class="${P}-ring"></i><span>Generating image...</span><b><i></i>Stop</b></div></div>`;
    const nav = NAV.map(([n, k]) => `<div class="${P}-ni${k === 1 ? ` ${P}-sel` : k === 2 ? ` ${P}-sec` : ''}">${k === 2 ? '' : '<em></em>'}${n}</div>`).join('');
    const root = x.el(`<div class="${P}"><div class="${P}-top"><i>/</i><b>my-project</b><i>/</i>Playgrounds<i>/</i><b>Images playground</b></div><div class="${P}-body"><div class="${P}-nav">${nav}</div><div class="${P}-main"><div class="${P}-hd">&larr; Images playground<span>&#8964;</span></div><div class="${P}-tb"><b>Deployments</b><div class="${P}-dd">dall-e-3<s>&#8964;</s></div><span>Clear all outputs</span><span>View code</span><div class="${P}-sw"><u>List</u><u class="${P}-on">Grid</u></div></div><div class="${P}-cv"><div class="${P}-es"><i></i><b>Start with a sample text prompt</b><div>${SAMPLES.map((s) => `<span>${s}</span>`).join('')}</div></div><div class="${P}-g" style="visibility: hidden">${tiles.map(cell).join('')}</div></div><div class="${P}-cp"><div class="${P}-pr">${x.esc(PROMPT)}</div><div class="${P}-row"><span class="${P}-chip">1024x1024</span><span class="${P}-chip">Style</span><span class="${P}-chip">Quality</span><div class="${P}-go">Generate</div></div></div></div></div></div>`);
    const go = root.querySelector(`.${P}-go`), es = root.querySelector(`.${P}-es`), grid = root.querySelector(`.${P}-g`), pr = root.querySelector(`.${P}-pr`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), pend: n.querySelector(`.${P}-pend`), ring: n.querySelector(`.${P}-ring`), g: tiles[i] }));
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

        // Generate is pressed; while the batch runs the composer is dimmed and Generate is greyed (it keeps its label)
        const gp = press(s, GEN_AT, 0.06, 0.06, 0.14);
        const busy = s >= GEN_AT && t < ctx.lastLand;
        put('go', `${gp.toFixed(3)}${busy}`, () => {
          go.style.transform = gp > 0 ? `scale(${(1 - 0.05 * gp).toFixed(4)})` : 'none';
          go.style.background = busy ? '#3a3a3a' : '#0078d4';
          go.style.color = busy ? '#8a8a8a' : '#fff';
          pr.style.color = busy ? '#8a8a8a' : '#f0f0f0';
        });

        // the sample cards give way to the ten pending slots
        const on = s >= ISSUE;
        put('iss', on, (v) => { es.style.display = v ? 'none' : ''; grid.style.visibility = v ? '' : 'hidden'; });

        cells.forEach((c, i) => {
          const done = t >= ctx.seq(i)[1];             // a hard swap, tile by tile, strictly in reading order
          put(`i${i}`, done, (v) => { c.im.style.visibility = v ? 'visible' : 'hidden'; c.pend.style.display = v ? 'none' : ''; });
          // the arc turns with t (its phase differs per slot); a function of t alone
          const deg = (((t * 300 + i * 37) % 360) + 360) % 360;
          put(`r${i}`, deg.toFixed(0), (d) => { c.ring.style.transform = `rotate(${d}deg)`; });
        });
      },
    };
  },
};
