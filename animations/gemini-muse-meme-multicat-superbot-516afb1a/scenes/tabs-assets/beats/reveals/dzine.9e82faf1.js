// Dzine's canvas editor, dzine.ai, Text-to-Image (the vendor's own tutorials on YouTube: UR6qHzXhxCM, 2024-08-15, t~54.5-60 s, and
// txtWez2x_YI, 2025-07-01, t~92.2-97.2 s; spec .tmp/clone-9e82faf1/reveal-refs/dzine/spec.json, confidence 0.60; frames
// s_ur6_2024_{generate,submitted_starting,progress15,justnow,landed}.png, s_tw_2025_{submitted_starting,starting_persist,result_landed}.png).
// A dark app (page ~#262626): a slim top bar ('Untitled 1536 x 1536', zoom, Export), a left rail of AI tools, the open 'Text-to-Image'
// panel (model chip, prompt with a character counter, the yellow 'Generate' button), a centre infinite canvas that stays on its empty
// drop zone ('Click or drag here to upload images') for the whole wait, and a right 'Results' panel with a red unread badge. Pressing
// Generate flips the button to a green 'Submitted!' (#A1F3C2); the Results panel then shows a pending tile, black (#000000) with a green
// ring spinner (#3BF6A9) and the caption 'Starting...', over empty dark-grey result slots; the finished pictures land in one hard step
// (no fade, no preview), the tile goes and the button returns to yellow.
// Adapted to ten images: ten result slots in the panel (the footage ran one generation of one or two images) that land one by one in
// reading order, each a hard step; the 'Starting...' tile stays until the last has landed. The wait is compressed into the beat's
// window (extrapolated). The canvas keeps its empty drop zone, as in the footage (the footage's landed picture also lands on the canvas;
// here only the panel receives them, as the brief adapts it). Omitted: the logo, the credit counters and the credit cost on the button,
// the 2024 build's percentage badge (sampled once, at 15%) and the footage's own pictures: every tile is our own meme (plain shapes,
// system type).
import { seg, press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-dzn';
const ROOT_H = 444, TOP_H = 22, RAIL_W = 38, PANEL_W = 134, RES_W = 198, COLS = 3, GAP = 4;
const YELLOW = '#f6d40a', GREEN = '#3bf6a9', SUBMIT = '#a1f3c2';
const TOOLS = ['Upload', 'Assets', 'Txt2Img', 'Img2Img', 'Character', 'AI Video', 'Lip Sync', 'AI Editor'];
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 12px; background: #262626; color: #e8e8e8; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #343434; }
.${P}-top { flex: none; display: flex; align-items: center; gap: 8px; height: ${TOP_H}px; padding: 0 10px; background: #1b1b1b; font-size: 7.5px; color: #cfcfcf; white-space: nowrap; }
.${P}-top i { display: block; width: 8px; height: 8px; border-radius: 2.5px; box-shadow: inset 0 0 0 1.3px #cfcfcf; }
.${P}-top em { font-style: normal; margin-left: auto; color: #8d8d8d; }
.${P}-top b { box-sizing: border-box; padding: 0 6px; height: 12px; border-radius: 3px; background: #343434; font-size: 6.5px; line-height: 12px; font-weight: 500; color: #7d7d7d; }
.${P}-body { flex: 1; min-height: 0; display: flex; }
.${P}-rail { flex: none; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; gap: 7px; width: ${RAIL_W}px; padding: 8px 0; background: #222; box-shadow: inset -1px 0 0 #303030; }
.${P}-rail div { display: flex; flex-direction: column; align-items: center; gap: 2px; width: 100%; font-size: 5.5px; line-height: 7px; color: #a5a5a5; white-space: nowrap; }
.${P}-rail div i { display: block; width: 10px; height: 10px; border-radius: 3px; box-shadow: inset 0 0 0 1.2px #a5a5a5; }
.${P}-rail .on { color: #fff; }
.${P}-rail .on i { box-shadow: inset 0 0 0 1.4px ${YELLOW}; }
.${P}-pan { flex: none; box-sizing: border-box; display: flex; flex-direction: column; gap: 6px; width: ${PANEL_W}px; padding: 8px 9px 10px; background: #262626; box-shadow: inset -1px 0 0 #303030; }
.${P}-ph { display: flex; align-items: center; justify-content: space-between; height: 11px; font-size: 7.5px; font-weight: 600; color: #fff; }
.${P}-ph s { text-decoration: none; font-size: 8px; color: #a5a5a5; }
.${P}-mod { display: flex; align-items: center; gap: 5px; box-sizing: border-box; height: 26px; padding: 0 5px; border-radius: 5px; background: #333; }
.${P}-mod i { display: block; flex: none; width: 17px; height: 17px; border-radius: 4px; background: linear-gradient(135deg, #6a7a86, #c5cdd2); }
.${P}-mod span { font-size: 7px; line-height: 9px; font-weight: 600; color: #fff; }
.${P}-mod small { display: block; font-size: 5.5px; font-weight: 400; color: #e0b64a; }
.${P}-pt { flex: none; box-sizing: border-box; height: 86px; padding: 6px 7px; border-radius: 5px; background: #2f2f2f; font-size: 6.8px; line-height: 10px; color: #f1f1f1; overflow: hidden; }
.${P}-ct { margin-top: -3px; text-align: right; font-size: 5.5px; color: #7d7d7d; }
.${P}-gen { position: relative; margin-top: auto; flex: none; display: grid; place-items: center; box-sizing: border-box; height: 26px; border-radius: 5px; background: ${YELLOW}; font-size: 8.5px; font-weight: 700; color: #1c1c1c; }
.${P}-gen span { position: absolute; left: 0; right: 0; top: 0; bottom: 0; display: grid; place-items: center; }
.${P}-cv { position: relative; flex: 1; min-width: 0; background: #2b2b2b; }
.${P}-dz { position: absolute; left: 50%; top: 50%; width: 164px; height: 164px; margin: -92px 0 0 -82px; background: repeating-conic-gradient(#303030 0% 25%, #292929 0% 50%) 0 0 / 12px 12px; }
.${P}-dz i { position: absolute; left: 50%; top: 40px; width: 42px; height: 42px; margin-left: -21px; border-radius: 50%; box-shadow: inset 0 0 0 1.4px #8a8a8a; background: #333; }
.${P}-dz i::after { content: ""; position: absolute; left: 13px; top: 14px; width: 16px; height: 13px; border-radius: 2px; box-shadow: inset 0 0 0 1.4px #cfcfcf; }
.${P}-dz span { position: absolute; left: 0; right: 0; top: 94px; text-align: center; font-size: 6.5px; line-height: 9px; color: #bdbdbd; }
.${P}-res { flex: none; box-sizing: border-box; display: flex; flex-direction: column; width: ${RES_W}px; padding: 0 8px 8px; background: #1f1f1f; box-shadow: inset 1px 0 0 #303030; }
.${P}-tabs { flex: none; display: flex; align-items: center; gap: 14px; height: 26px; font-size: 7.5px; color: #8a8a8a; white-space: nowrap; }
.${P}-tabs .on { display: flex; align-items: center; gap: 4px; color: #fff; font-weight: 600; }
.${P}-tabs em { font-style: normal; min-width: 8px; box-sizing: border-box; padding: 0 2px; height: 8px; border-radius: 4px; background: #e8352b; font-size: 5.5px; line-height: 8px; font-weight: 700; text-align: center; color: #fff; }
.${P}-pending { flex: none; display: flex; align-items: center; gap: 7px; box-sizing: border-box; height: 30px; padding: 0 8px; border-radius: 8px; background: #000000; font-size: 8px; color: #fff; }
.${P}-spin { flex: none; display: block; width: 13px; height: 13px; border-radius: 50%; background: conic-gradient(from 0deg, rgba(59, 246, 169, 0) 0deg, ${GREEN} 120deg, ${GREEN} 300deg, rgba(59, 246, 169, 0) 340deg); -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 2.6px), #000 calc(100% - 2.1px)); mask: radial-gradient(farthest-side, transparent calc(100% - 2.6px), #000 calc(100% - 2.1px)); }
.${P}-job { flex: none; display: flex; align-items: center; gap: 5px; height: 18px; margin-top: 4px; font-size: 7px; font-weight: 600; color: ${YELLOW}; }
.${P}-job small { box-sizing: border-box; padding: 0 4px; height: 9px; border-radius: 3px; background: #333; font-size: 5.5px; line-height: 9px; font-weight: 400; color: #a5a5a5; }
.${P}-g { flex: none; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; }
.${P}-t { position: relative; aspect-ratio: 870 / 1024; border-radius: 4px; overflow: hidden; background: #262626; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; background: #383838; }
`;

const PROMPT = 'A muse in a lecture hall holding up a handwritten note, meme style, bright colours';
const REF = 1.84;                                  // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const GEN_AT = 0.06;                               // the cursor presses Generate; the button flips to Submitted! at once
const ISSUE = 0.2;                                 // the Results panel shows the black 'Starting...' tile over the ten empty slots
const LAND = Array.from({ length: 10 }, (_, i) => 0.62 + i * 0.1333);   // result i lands in one hard step (reading order), the last at 1.82

export default {
  id: 'dzine',
  label: 'Dzine (2025)',
  source: {
    platform: "Dzine canvas editor, dzine.ai Text-to-Image (desktop browser, dark theme; the vendor's own tutorials on YouTube, 2024-08-15 and 2025-07-01)",
    feature: "dark canvas app: a Text-to-Image panel whose yellow Generate flips to a green 'Submitted!' (#A1F3C2), an empty-drop-zone canvas that stays empty, a right Results panel whose pending tile is black (#000000) with a green ring spinner (#3BF6A9) and 'Starting...', results landing in one hard step (adapted to 10: ten result slots landing one by one in reading order; the logo, the credit counters and the percentage badge are omitted)",
    refs: [
      { url: 'https://www.youtube.com/watch?v=UR6qHzXhxCM', retrieved: '2026-10-14' },
      { url: 'https://www.youtube.com/watch?v=txtWez2x_YI', retrieved: '2026-10-14' },
    ],
    extrapolated: "the footage's wait is ~5 s for a one-image run and its pictures also land on the canvas; here the wait is compressed into the beat window, ten results land one by one in the panel and the canvas stays on its drop zone",
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'dzine');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-pend"></div></div>`;
    const rail = TOOLS.map((n) => `<div${n === 'Txt2Img' ? ' class="on"' : ''}><i></i>${n}</div>`).join('');
    const root = x.el(`<div class="${P}"><div class="${P}-top"><i></i><span>Untitled</span><span style="color: #8d8d8d">1536 × 1536</span><em>40%</em><b>Export</b></div><div class="${P}-body"><div class="${P}-rail">${rail}</div><div class="${P}-pan"><div class="${P}-ph">Text-to-Image<s>×</s></div><div class="${P}-mod"><i></i><span>FLUX.1<small>${tiles.length} imgs/gen</small></span></div><div class="${P}-pt">${x.esc(PROMPT)}</div><div class="${P}-ct">${[...PROMPT].length} / 800</div><div class="${P}-gen"><span class="g1">Generate</span><span class="g2" style="visibility: hidden">Submitted!</span></div></div><div class="${P}-cv"><div class="${P}-dz"><i></i><span>Click or drag here to upload images</span></div></div><div class="${P}-res"><div class="${P}-tabs"><span class="on">Results<em class="${P}-bd">0</em></span><span>Layers</span></div><div class="${P}-pending" style="visibility: hidden"><i class="${P}-spin"></i>Starting...</div><div class="${P}-job" style="visibility: hidden">Text-to-Image<small>Private</small></div><div class="${P}-g" style="visibility: hidden">${tiles.map(cell).join('')}</div></div></div></div>`);
    const q = (s) => root.querySelector(s);
    const gen = q(`.${P}-gen`), g1 = q(`.${P}-gen .g1`), g2 = q(`.${P}-gen .g2`), pending = q(`.${P}-pending`), job = q(`.${P}-job`), grid = q(`.${P}-g`), spin = q(`.${P}-spin`), bd = q(`.${P}-bd`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), pend: n.querySelector(`.${P}-pend`), g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // Generate is pressed and flips to the green 'Submitted!' until the last result has landed
        const gp = press(s, GEN_AT, 0.06, 0.06, 0.14);
        put('go', gp.toFixed(3), () => { gen.style.transform = gp > 0 ? `scale(${(1 - 0.04 * gp).toFixed(4)})` : 'none'; });
        const fin = s >= LAND[9];
        const sub = s >= GEN_AT && !fin;
        put('sub', sub, (v) => { gen.style.background = v ? SUBMIT : ''; g1.style.visibility = v ? 'hidden' : ''; g2.style.visibility = v ? '' : 'hidden'; });

        // the Results panel: the black 'Starting...' tile, the job row and the ten slots; the tile goes with the last result
        const on = s >= ISSUE;
        put('pnd', on && !fin, (v) => { pending.style.visibility = v ? '' : 'hidden'; });
        put('job', on, (v) => { job.style.visibility = v ? '' : 'hidden'; grid.style.visibility = v ? '' : 'hidden'; });
        const deg = ((t * 420) % 360 + 360) % 360;
        put('sp', deg.toFixed(0), (v) => { spin.style.transform = `rotate(${v}deg)`; });

        let n = 0;
        cells.forEach((c, i) => {
          const a = LAND[i];
          if (s >= a) n++;
          put(`i${i}`, s >= a, (v) => { c.im.style.visibility = v ? '' : 'hidden'; c.pend.style.display = v ? 'none' : ''; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
        });
        put('bd', n, (v) => { bd.textContent = String(v); });
      },
    };
  },
};
