// Leonardo.Ai's Flow State surface (the Bilibili screen recording BV1BXqLYVEYq, 2024-12-07; spec
// .tmp/clone-9e82faf1/reveal-refs/leonardo-flow/spec.json, confidence 0.50; the frames at 28-36 s are the evidence). It is NOT the
// per-prompt results feed of the 'leonardo' module: it is a dark app with a fixed left rail (a 'Flow State' Mode card with a
// padlock; Style rows Vibe / Lighting / Shot Type / Color Theme, all 'Automatic'; Image Dimensions 2:3 / 1:1 / 16:9 / More; Prompt
// Enhance and Private Mode toggles; 'Reset to Defaults'), a prompt bar carrying the mode chips 'Classic Mode' | 'Flow State' (the
// footage labels it with a small 'New' badge) and a Generate button, and ONE canvas of near-black #12121C tiles. A pending tile
// carries only a faint centred circle (no percentage, spinner or status string). Finished tiles fill in one by one; the tile under
// the cursor shows an 'Upscale' pill and a violet 'More Like This', and pressing that appends the next batch BELOW on the same
// canvas, so the canvas keeps growing instead of starting a new headed result block.
// Adapted to ten images: batches of 4 + 4 + 2 appended down the canvas, filling in reading order. The circle is a plain shape and
// the face is the system UI stack: none of the platform's medallion, logo or fonts is drawn or shipped, and none of the footage's
// pictures (nor its presenter's webcam inset) is reproduced: every tile is our own meme.
import { seg, lerp, press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-lf';
const RAIL_W = 124, ROOT_H = 404, COLS = 4, GAP = 6;
const BATCHES = [4, 4, 2];                  // tiles per batch, appended down the canvas
const CSS = `
.${P} { box-sizing: border-box; display: flex; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 12px; background: #0a0a11; color: #dcdce8; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #1d1d2a; }
.${P}-rail { flex: none; box-sizing: border-box; display: flex; flex-direction: column; gap: 9px; width: ${RAIL_W}px; padding: 10px 8px 9px; background: #0d0d15; box-shadow: inset -1px 0 0 #1b1b27; }
.${P}-brand { display: flex; align-items: center; gap: 6px; height: 16px; font-size: 9px; font-weight: 600; color: #f1f1f8; white-space: nowrap; }
.${P}-brand i { flex: none; width: 12px; height: 12px; border-radius: 50%; background: #565a72; }
.${P}-mode { position: relative; flex: none; box-sizing: border-box; height: 38px; padding: 6px 8px; border-radius: 7px; background: linear-gradient(110deg, #1a7f86 0%, #3b4fb8 55%, #6d3ec9 100%); box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .14); }
.${P}-mode small { display: block; font-size: 6px; color: rgba(255, 255, 255, .62); line-height: 8px; }
.${P}-mode b { display: block; margin-top: 2px; font-size: 9.5px; font-weight: 600; color: #fff; line-height: 12px; }
.${P}-mode svg { position: absolute; right: 8px; top: 15px; width: 9px; height: 9px; fill: none; stroke: #fff; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
.${P}-h { flex: none; font-size: 8px; font-weight: 600; color: #a2a2b8; line-height: 10px; }
.${P}-sty { display: flex; flex-direction: column; gap: 4px; }
.${P}-row { display: flex; align-items: center; gap: 6px; box-sizing: border-box; height: 26px; padding: 0 7px; border-radius: 6px; background: #151520; box-shadow: inset 0 0 0 1px #232331; }
.${P}-row i { flex: none; width: 9px; height: 9px; border-radius: 3px; background: #3c3c55; }
.${P}-row:nth-child(2) i { border-radius: 50%; }
.${P}-row span { display: block; font-size: 6.5px; color: #8b8ba2; line-height: 8px; }
.${P}-row em { display: block; font-style: normal; font-size: 7.5px; color: #dedeea; line-height: 9px; }
.${P}-dim { display: flex; gap: 4px; margin-top: -2px; }
.${P}-dim span { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; box-sizing: border-box; height: 30px; border-radius: 6px; background: #151520; box-shadow: inset 0 0 0 1px #232331; font-size: 6px; color: #9a9ab0; }
.${P}-dim span::before { content: ""; width: 8px; height: 11px; border-radius: 2px; box-shadow: inset 0 0 0 1.2px #6d6d86; }
.${P}-dim span:nth-child(2)::before { width: 10px; height: 10px; }
.${P}-dim span:nth-child(3)::before { width: 12px; height: 7px; }
.${P}-dim span:nth-child(4)::before { width: 9px; height: 9px; border-radius: 50%; box-shadow: none; background: radial-gradient(circle, #6d6d86 1.2px, transparent 1.6px) 0 50% / 3px 3px; }
.${P}-dim .on { background: #1a1430; box-shadow: inset 0 0 0 1px #7c3aed; color: #e2d7ff; }
.${P}-dim .on::before { box-shadow: inset 0 0 0 1.2px #a78bfa; }
.${P}-tg { display: flex; align-items: center; justify-content: space-between; height: 14px; font-size: 7.5px; color: #cdcde0; white-space: nowrap; }
.${P}-sw { position: relative; flex: none; width: 17px; height: 9px; border-radius: 5px; background: #2a2a3a; }
.${P}-sw::after { content: ""; position: absolute; left: 1.5px; top: 1.5px; width: 6px; height: 6px; border-radius: 50%; background: #8b8ba2; }
.${P}-sw.on { background: #7c3aed; }
.${P}-sw.on::after { left: 9.5px; background: #fff; }
.${P}-reset { margin-top: auto; box-sizing: border-box; display: grid; place-items: center; height: 22px; border-radius: 6px; background: #151520; box-shadow: inset 0 0 0 1px #232331; font-size: 7px; color: #aaaabf; }
.${P}-main { flex: 1; min-width: 0; box-sizing: border-box; display: flex; flex-direction: column; gap: 10px; padding: 10px; }
.${P}-bar { flex: none; box-sizing: border-box; padding: 8px 10px 8px; border-radius: 10px; background: #13131c; box-shadow: inset 0 0 0 1px #232331; }
.${P}-pr { height: 14px; font-size: 10px; line-height: 14px; color: #e6e6f0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.${P}-ctl { display: flex; align-items: center; gap: 6px; margin-top: 7px; }
.${P}-chip { display: flex; align-items: center; gap: 4px; box-sizing: border-box; height: 24px; padding: 0 9px; border-radius: 8px; background: #191924; box-shadow: inset 0 0 0 1px #2a2a39; font-size: 8.5px; font-weight: 500; color: #b6b6ca; white-space: nowrap; }
.${P}-chip.on { background: #1a1430; box-shadow: inset 0 0 0 1px #7c3aed; color: #f1ecff; }
.${P}-chip em { font-style: normal; font-size: 6.5px; font-weight: 700; padding: 1px 5px; border-radius: 6px; background: #8b5cf6; color: #fff; }
.${P}-sp { flex: 1; }
.${P}-gen { flex: none; display: grid; place-items: center; box-sizing: border-box; height: 24px; padding: 0 13px; border-radius: 12px; background: #7c3aed; font-size: 9px; font-weight: 600; color: #fff; }
.${P}-cv { flex: none; position: relative; height: ${3 * 99 + 2 * GAP + 4}px; overflow: hidden; border-radius: 8px; }
.${P}-g { display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; }
.${P}-t { position: relative; aspect-ratio: 1; border-radius: 7px; overflow: hidden; background: #12121c; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-ph { position: absolute; inset: 0; background: #12121c; }
.${P}-ph::before { content: ""; position: absolute; left: 50%; top: 50%; width: 44%; aspect-ratio: 1; transform: translate(-50%, -50%); border-radius: 50%; background: rgba(255, 255, 255, .035); box-shadow: inset 0 0 0 2px rgba(255, 255, 255, .05); }
.${P}-act { position: absolute; left: 5px; right: 5px; bottom: 5px; display: none; flex-direction: column; gap: 3px; }
.${P}-act span { display: grid; place-items: center; box-sizing: border-box; height: 17px; border-radius: 9px; font-size: 7px; font-weight: 600; white-space: nowrap; }
.${P}-up { background: rgba(16, 16, 26, .86); box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .16); color: #ececf6; }
.${P}-ml { background: #7c3aed; color: #fff; }
`;

const PROMPT = 'A muse holding a handwritten note in a lecture hall';
const TILE = 99.5;
// the beat in seconds from the card's entrance, laid out for a window of REF seconds (cardIn .. lastLand) and stretched with it
const REF = 1.84;
const GEN_AT = 0.07;                         // the cursor presses Generate
const B_AT = [0.13, 0.86, 1.5];              // when each batch's pending tiles appear, hard (the later two just after More Like This)
const LAND = [0.38, 0.5, 0.62, 0.74, 1.02, 1.14, 1.26, 1.38, 1.64, 1.76];   // when each tile lands, in reading order
const MORE_AT = { 3: 0.82, 7: 1.46 };        // More Like This is pressed on the last finished tile of batch 1, then of batch 2
const FADE = 0.06;                           // a pending tile's cover thins away over this long before it lands
const mix = (a, b, f) => `rgb(${a.map((v, i) => Math.round(lerp(v, b[i], f))).join(',')})`;
const VIOLET = [124, 58, 237], LIGHT = [167, 120, 255];
const LOCK = '<svg viewBox="0 0 12 12"><rect x="2.2" y="5.2" width="7.6" height="5.2" rx="1.2"/><path d="M4 5.2V3.8a2 2 0 0 1 4 0v1.4"/></svg>';

export default {
  id: 'leonardo-flow',
  label: 'Leonardo (Flow State)',
  source: {
    platform: 'Leonardo.Ai web app, Flow State image generation (a tutorial screen recording on Bilibili, 2024-12-07)',
    feature: 'Flow State canvas: a left rail, a prompt bar with Classic Mode | Flow State chips and a Generate button, then ONE canvas of near-black tiles that fill one by one, where More Like This appends the next batch below (adapted to 10: batches of 4 + 4 + 2 appended down the canvas, filling in reading order)',
    refs: [{ url: 'https://www.bilibili.com/video/BV1BXqLYVEYq', retrieved: '2026-10-14' }],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'leonardo-flow');
    const style = ['Vibe', 'Lighting', 'Shot Type', 'Color Theme'].map((n) => `<div class="${P}-row"><i></i><div><span>${n}</span><em>Automatic</em></div></div>`).join('');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-ph"></div><div class="${P}-act"><span class="${P}-up">Upscale</span><span class="${P}-ml">More Like This</span></div></div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-rail"><div class="${P}-brand"><i></i>Leonardo.Ai</div><div class="${P}-mode"><small>Mode</small><b>Flow State</b>${LOCK}</div><div class="${P}-h">Style</div><div class="${P}-sty">${style}</div><div class="${P}-h">Image Dimensions</div><div class="${P}-dim"><span>2:3</span><span class="on">1:1</span><span>16:9</span><span>More</span></div><div class="${P}-tg">Prompt Enhance<i class="${P}-sw on"></i></div><div class="${P}-tg">Private Mode<i class="${P}-sw"></i></div><div class="${P}-reset">Reset to Defaults</div></div><div class="${P}-main"><div class="${P}-bar"><div class="${P}-pr">${x.esc(PROMPT)}</div><div class="${P}-ctl"><span class="${P}-chip">Classic Mode</span><span class="${P}-chip on">Flow State<em>New</em></span><span class="${P}-sp"></span><span class="${P}-gen">Generate</span></div></div><div class="${P}-cv"><div class="${P}-g">${tiles.map(cell).join('')}</div></div></div></div>`);
    const gen = root.querySelector(`.${P}-gen`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ n, im: n.querySelector('img'), ph: n.querySelector(`.${P}-ph`), act: n.querySelector(`.${P}-act`), ml: n.querySelector(`.${P}-ml`), g: tiles[i], batch: BATCHES.findIndex((_, b) => i < BATCHES.slice(0, b + 1).reduce((s, v) => s + v, 0)) }));
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered
        const land = (i) => LAND[i];

        // Generate is pressed; it never changes label
        const gp = press(s, GEN_AT, 0.06, 0.06, 0.14);
        put('gen', gp.toFixed(3), () => {
          gen.style.transform = gp > 0 ? `scale(${(1 - 0.06 * gp).toFixed(4)})` : 'none';
          gen.style.background = gp > 0 ? mix(VIOLET, LIGHT, gp * 0.6) : '';
        });

        // the hovered tile: the cursor rests on the last finished tile of a batch while its More Like This is used
        const hover = s >= land(7) ? 7 : s >= land(3) ? 3 : -1;

        cells.forEach((c, i) => {
          const issued = s >= B_AT[c.batch];
          put(`v${i}`, issued, (on) => { c.n.style.visibility = on ? '' : 'hidden'; });
          // each tile lands at its own time in LAND: the cover thins away over FADE, the image stays in flow underneath
          const a = land(i);
          const f = seg(s, a - FADE, a);
          put(`i${i}`, s >= a - FADE, (on) => { c.im.style.visibility = on ? '' : 'hidden'; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
          const covered = f < 1;
          put(`c${i}`, covered, (on) => { c.ph.style.display = on ? '' : 'none'; if (!on) c.ph.style.opacity = ''; });
          if (covered) c.ph.style.opacity = f > 0 ? (1 - f).toFixed(3) : '';
          // the strip over the hovered tile
          put(`a${i}`, hover === i, (on) => { c.act.style.display = on ? 'flex' : 'none'; });
          if (MORE_AT[i] !== undefined) {
            const p = press(s, MORE_AT[i]);
            put(`m${i}`, p.toFixed(3), () => {
              c.ml.style.transform = p > 0 ? `scale(${(1 - 0.07 * p).toFixed(4)})` : 'none';
              c.ml.style.background = p > 0 ? mix(VIOLET, LIGHT, p * 0.7) : '';
            });
          }
        });
      },
    };
  },
};
