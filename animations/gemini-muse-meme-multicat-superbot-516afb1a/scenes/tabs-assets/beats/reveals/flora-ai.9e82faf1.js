// FLORA (florafauna.ai) Team Workspace: a dark infinite node canvas, as FLORA's own 'How To Use Techniques' short shows it (YouTube pufDAi52ybE,
// published 2026-03-23, t=28.0-40.0 s; also h-QgY3W79qY 2026-03-30 and the beginner walk-through gHQfJLSMDYA 2026-02-11; spec
// .tmp/clone-9e82faf1/reveal-refs/flora-ai/spec.json, confidence 0.6; frames al_t2_idle_before_run / al_t3_queue1active / al_t3_queue1active_b /
// al_t4_results). A near-black canvas with a faint dot grid and a green-cast 'Character Lock' Technique node (header 'Node type: Technique',
// 'Estimated time: ~1 min', a 'Character Image' input, a 'GENERATE' button with a round run handle at its right, and a column of 'Angle N' output
// ports). Running it outlines the node green, swaps the run handle for a small grey spinner, and flips the capsule at the window's bottom-right from
// 'Queue 0 active' to 'Queue 1 active' (a cancel ✕ and a '>' chevron beside it). There is no bar, no percentage, no timer and no placeholder tile: the
// node keeps its content, and when the run ends the capsule drops to 'Queue 0 active' and the outputs are on the canvas (whole-image pop-in).
// Adapted to ten images: ten 'Angle N' outputs (a 5 x 2 block of cards) that pop in one after another in strict reading order, each output's port
// turning green as its card lands; the spinner turns from render(t) until the tenth has landed, when the capsule returns to 'Queue 0 active' and the
// node rests (the landed state is static). Omitted: the credit cost ('Cost 880'), the creator credit line, the FLORA mark, the left tool rail and the
// presenter's burned-in caption. The footage's own pictures are never reproduced: every card is our own meme; no logo or platform font is drawn.
import { press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-flr';
const ROOT_H = 290, COLS = 5, GAP = 6, N_TOP = 62, N_H = 128, PORT0 = 14, PORT_STEP = 11;
const CSS = `
.${P} { position: relative; box-sizing: border-box; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 12px; background-color: #0b0b0b; background-image: radial-gradient(circle, #232323 0.7px, transparent 0.9px); background-size: 12px 12px; color: #dcdcdc; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #1a1a1a; }
.${P}-ws { position: absolute; left: 12px; top: 8px; font-size: 7.5px; font-weight: 700; color: #f2f2f2; }
.${P}-ws small { display: block; margin-top: 2px; font-size: 5.5px; font-weight: 400; color: #8a8a8a; }
.${P}-share { position: absolute; right: 12px; top: 8px; box-sizing: border-box; height: 13px; padding: 0 7px; border-radius: 4px; background: #86e09a; font-size: 6px; font-weight: 700; line-height: 13px; color: #0b2412; }
.${P}-nl { position: absolute; left: 16px; top: ${N_TOP - 11}px; font-size: 6px; color: #6fdc9a; white-space: nowrap; }
.${P}-node { position: absolute; left: 16px; top: ${N_TOP}px; box-sizing: border-box; width: 150px; height: ${N_H}px; border-radius: 10px; background: #131f15; box-shadow: 0 0 0 1px #28422d; }
.${P}-node.${P}-run { box-shadow: 0 0 0 1.5px #3fd07a, 0 0 10px rgba(63, 208, 122, .3); }
.${P}-req { margin: 9px 10px 0; font-size: 5.2px; color: #6d806f; }
.${P}-inp { display: flex; align-items: center; gap: 5px; box-sizing: border-box; height: 18px; margin: 3px 8px 0; padding: 0 6px 0 3px; border-radius: 4px; background: #1d2e20; font-size: 6px; color: #d8e4da; white-space: nowrap; }
.${P}-inp i { flex: none; width: 12px; height: 12px; border-radius: 3px; background: linear-gradient(150deg, #b8a8e8, #6e6aa8); }
.${P}-inp s { margin-left: auto; text-decoration: none; font-size: 6px; color: #6fdc9a; }
.${P}-meta { margin: 9px 10px 0; font-size: 5.6px; line-height: 11px; color: #7b8c7d; }
.${P}-meta div { display: flex; justify-content: space-between; }
.${P}-meta b { font-weight: 500; color: #d3ddd5; }
.${P}-gen { position: absolute; left: 10px; right: 10px; bottom: 9px; display: flex; align-items: center; justify-content: space-between; height: 18px; }
.${P}-btn { box-sizing: border-box; height: 15px; padding: 0 9px; border-radius: 8px; background: #3fd07a; font-size: 6px; font-weight: 700; letter-spacing: .6px; line-height: 15px; color: #06210f; }
.${P}-hd { position: relative; width: 16px; height: 16px; border-radius: 50%; background: #f4f4f4; font-size: 9px; font-weight: 700; line-height: 16px; text-align: center; color: #101010; }
.${P}-hd b { position: absolute; inset: 0; display: block; box-sizing: border-box; border-radius: 50%; border: 1.6px solid rgba(190, 190, 190, .25); border-top-color: #d6d6d6; }
.${P}-pt { position: absolute; left: 163px; width: 6px; height: 6px; box-sizing: border-box; border-radius: 50%; border: 1px solid #3a4a3d; background: #0b0b0b; }
.${P}-pt.${P}-on { border-color: #3fd07a; background: #3fd07a; }
.${P}-pl { position: absolute; left: 174px; font-size: 5px; line-height: 6px; color: #7a8a7c; white-space: nowrap; }
.${P}-g { position: absolute; left: 216px; right: 12px; top: 52px; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: 8px ${GAP}px; }
.${P}-c { min-width: 0; }
.${P}-ct { height: 8px; font-size: 5px; line-height: 8px; color: #7a8a7c; white-space: nowrap; overflow: hidden; }
.${P}-t { position: relative; aspect-ratio: 870 / 1024; border-radius: 5px; overflow: hidden; background: #0e0e0e; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; border-radius: 5px; background: #0e0e0e; box-shadow: inset 0 0 0 1px #1d1d1d; }
.${P}-q { position: absolute; right: 8px; bottom: 7px; display: flex; align-items: center; gap: 5px; box-sizing: border-box; height: 15px; padding: 0 7px; border-radius: 8px; background: #1c1c1c; box-shadow: 0 0 0 1px #2a2a2a; font-size: 6px; color: #9aa0a6; white-space: nowrap; }
.${P}-q b { font-weight: 500; color: #e4e4e4; }
.${P}-q i { font-style: normal; font-size: 6px; color: #b4b8bc; }
`;

const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const RUN_AT = 0.06;                              // the cursor presses GENERATE
const FLIGHT = 0.14;                              // the capsule reads 'Queue 1 active', the node is outlined and its handle spins
const LAND = Array.from({ length: 10 }, (_, i) => 0.45 + i * 0.1356);   // output i pops in (reading order: row 1 left to right, then row 2), the last at 1.67

export default {
  id: 'flora-ai',
  label: 'FLORA (2026)',
  source: {
    platform: 'FLORA (florafauna.ai) Team Workspace: a dark infinite node canvas in a desktop browser (FLORA\'s own official how-to shorts, and a third-party beginner walk-through)',
    feature: "green Technique node ('Node type: Technique', 'Estimated time: ~1 min', 'Character Image' input, 'GENERATE' button, 'Angle N' output ports) whose run outlines it green, swaps its run handle for a small spinner and flips the bottom-right capsule from 'Queue 0 active' to 'Queue 1 active' (a cancel ✕ and a '>' chevron beside it); no bar, no percentage, no placeholder tile; on completion the capsule returns to 'Queue 0 active' and the outputs are on the canvas (adapted to 10: a 5 x 2 block of 'Angle N' cards popping in one by one in reading order; 'Cost 880' and the creator line are omitted)",
    refs: [
      { url: 'https://www.youtube.com/watch?v=pufDAi52ybE', published: '2026-03-23', retrieved: '2026-10-14' },
      { url: 'https://www.youtube.com/watch?v=h-QgY3W79qY', published: '2026-03-30', retrieved: '2026-10-14' },
      { url: 'https://www.youtube.com/watch?v=gHQfJLSMDYA', published: '2026-02-11', retrieved: '2026-10-14' },
    ],
    extrapolated: "the footage's technique has six outputs, laid out in a vertical column on the canvas: the ten 'Angle N' outputs, their 5 x 2 card block, the strict reading-order landing and the landing times are ours; the spinner is a plain ring (the footage's glyph could not be confirmed at 1 fps); the faint empty slots before an output lands are a layout stand-in (the footage shows none)",
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'flora-ai');
    const card = (g, i) => `<div class="${P}-c"><div class="${P}-ct">Angle ${i + 1}</div><div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-pend"></div></div></div>`;
    const ports = tiles.map((_, i) => `<i class="${P}-pt" style="top: ${N_TOP + PORT0 + i * PORT_STEP}px"></i><span class="${P}-pl" style="top: ${N_TOP + PORT0 + i * PORT_STEP}px">Angle ${i + 1}</span>`).join('');
    const root = x.el(`<div class="${P}"><div class="${P}-ws">Demo<small>FLORA Team Workspace</small></div><div class="${P}-share">Share</div><div class="${P}-nl">▵ Character Lock</div><div class="${P}-node"><div class="${P}-req">Required inputs</div><div class="${P}-inp"><i></i>Character Image<s>✓</s></div><div class="${P}-meta"><div>Node type<b>Technique</b></div><div>Estimated time<b>~1 min</b></div></div><div class="${P}-gen"><div class="${P}-btn">GENERATE</div><div class="${P}-hd"><span>↑</span><b style="display: none"></b></div></div></div>${ports}<div class="${P}-g">${tiles.map(card).join('')}</div><div class="${P}-q"><i style="display: none">✕</i><span><b>Queue</b> 0 active</span><i>›</i></div></div>`);
    const node = root.querySelector(`.${P}-node`), btn = root.querySelector(`.${P}-btn`), hd = root.querySelector(`.${P}-hd`), arrow = hd.querySelector('span'), spin = hd.querySelector('b');
    const qx = root.querySelector(`.${P}-q > i`), qt = root.querySelector(`.${P}-q > span`);
    const pts = [...root.querySelectorAll(`.${P}-pt`)];
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
        const done = s >= LAND[9];
        const run = s >= FLIGHT && !done;

        // GENERATE is pressed (it keeps its label while the job is live)
        const gp = press(s, RUN_AT, 0.06, 0.06, 0.14);
        put('go', gp.toFixed(3), () => { btn.style.transform = gp > 0 ? `scale(${(1 - 0.06 * gp).toFixed(4)})` : 'none'; });

        // in flight: green outline, the handle's spinner, the capsule 'Queue 1 active' with its cancel glyph; at the end 'Queue 0 active'
        put('run', run, (v) => {
          node.classList.toggle(`${P}-run`, v);
          arrow.style.display = v ? 'none' : '';
          hd.style.background = v ? 'transparent' : '';
          spin.style.display = v ? '' : 'none';
          if (!v) spin.style.transform = '';
          qx.style.display = v ? '' : 'none';
          qt.innerHTML = `<b>Queue</b> ${v ? 1 : 0} active`;
        });
        if (run) { const deg = (((t * 480) % 360) + 360) % 360; put('sd', deg.toFixed(0), (d) => { spin.style.transform = `rotate(${d}deg)`; }); }

        // the outputs pop in whole, in reading order; each one's port turns green with it
        cells.forEach((c, i) => {
          const on = s >= LAND[i];
          put(`i${i}`, on, (v) => { c.im.style.visibility = v ? '' : 'hidden'; c.pend.style.display = v ? 'none' : ''; pts[i].classList.toggle(`${P}-on`, v); });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
        });
      },
    };
  },
};
