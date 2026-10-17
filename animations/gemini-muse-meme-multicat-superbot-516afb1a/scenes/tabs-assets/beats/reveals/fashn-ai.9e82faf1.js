// FASHN AI Studio, the virtual try-on workspace of the fashn.ai web app, 2024 build (FASHN's own tutorial 'How to do Clothing Try-Ons in 2
// Minutes | FASHN Web App Tutorial', YouTube QUprJM6RrLo, 2024-12-15, t~84-99 s; spec .tmp/clone-9e82faf1/reveal-refs/fashn-ai/spec.json,
// confidence 0.72; frames as_fashn_run18s_t84, as_fashn_starting_t87, as_fashn_processing_t90/t95, as_fashn_result_t99). A light page (#FBF9F0)
// with three columns: 'Select Model' (a model photo with an X, a 'Generate AI Model' button, 'Model Image Controls'), 'Select Garment' (a
// garment photo with an X, the Category tiles Top / Bottom / Full-body, a 'Long Top' toggle, 'Garment Photo Type' with 'Auto Detect') and
// 'Result' (a bordered box, the full-width yellow 'Run (~18s)' button under it, 'Sampling Controls'). Pressing Run dims the button; the Result
// column's header row shows a grey pill chip 'Starting...' that turns into 'Processing | N.Ns', the elapsed seconds counting up in real time
// (0.1 s -> 6.1 s over the sampled span), with a plain 'Cancel' at the opposite end, while the result box holds a small garment icon and a
// rotating fashion fact. There is no percentage and no bar.
// Adapted to ten images: the studio is drawn at 560 px, one fixed column of three (the left rail is folded into a slim tab row); the result
// box turns from its fact card into a 4 + 4 + 2 block of pale pending cards and the results land in strict reading order, the chip counting
// up to ~18 s on the way and clearing, with 'Cancel', once the tenth has landed (the button then comes back to full strength).
// Omitted: the logo and wordmark, the account row, the plan chip and every credit, plan and pricing chrome, the presenter's webcam inset and
// subtitle. The footage's photographs are never reproduced: both inputs and every result are our own meme; system type throughout.
import { seg, press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-fsh';
const ROOT_H = 440, COL_W = 116, RES_W = 268, COLS = 4, GAP = 5;
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 12px; background: #fbf9f0; color: #1d1c19; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #e4e2da; }
.${P}-tabs { flex: none; display: flex; align-items: center; gap: 14px; height: 32px; padding: 0 14px; border-bottom: 1px solid #ebe9e0; font-size: 9px; font-weight: 500; color: #7a786f; }
.${P}-tabs b { font-size: 11px; font-weight: 700; letter-spacing: .08em; color: #1d1c19; margin-right: 6px; }
.${P}-tabs .${P}-on { padding: 4px 8px; border-radius: 6px; background: #efede5; color: #1d1c19; }
.${P}-cols { flex: 1; min-height: 0; display: flex; gap: 12px; padding: 12px 14px 0; }
.${P}-col { flex: none; display: flex; flex-direction: column; width: ${COL_W}px; }
.${P}-res { width: ${RES_W}px; }
.${P}-h { flex: none; height: 16px; font-size: 9.5px; line-height: 16px; font-weight: 500; color: #1d1c19; }
.${P}-ph { position: relative; flex: none; margin-top: 6px; box-sizing: border-box; width: ${COL_W}px; height: 155px; border-radius: 8px; overflow: hidden; background: #efede5; box-shadow: 0 0 0 1px #e4e2da; }
.${P}-ph img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-ph u { position: absolute; right: 5px; top: 5px; display: grid; place-items: center; width: 14px; height: 14px; border-radius: 4px; background: #111; text-decoration: none; font-size: 10px; line-height: 14px; color: #fff; }
.${P}-btn { flex: none; display: grid; place-items: center; box-sizing: border-box; height: 24px; margin-top: 8px; border-radius: 6px; background: #fff; box-shadow: inset 0 0 0 1px #d9d7ce; font-size: 8.5px; font-weight: 500; color: #1d1c19; white-space: nowrap; }
.${P}-row { flex: none; display: flex; align-items: center; justify-content: space-between; height: 16px; margin-top: 8px; font-size: 8.5px; font-weight: 500; color: #1d1c19; white-space: nowrap; }
.${P}-lab { flex: none; height: 14px; margin-top: 8px; font-size: 8.5px; line-height: 14px; font-weight: 500; color: #1d1c19; white-space: nowrap; }
.${P}-cat { flex: none; display: flex; gap: 3px; margin-top: 4px; }
.${P}-cat span { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; box-sizing: border-box; height: 34px; border-radius: 6px; background: #fff; box-shadow: inset 0 0 0 1px #d9d7ce; font-size: 7.5px; font-weight: 500; color: #1d1c19; white-space: nowrap; }
.${P}-cat .${P}-on { box-shadow: inset 0 0 0 1.5px #1d1c19; font-weight: 700; }
.${P}-cat i { display: block; width: 11px; height: 9px; border-radius: 2px; background: #1d1c19; }
.${P}-tg { flex: none; display: flex; align-items: center; gap: 5px; height: 14px; margin-top: 6px; font-size: 8.5px; font-weight: 500; color: #1d1c19; white-space: nowrap; }
.${P}-tg i { position: relative; flex: none; width: 20px; height: 11px; border-radius: 6px; background: #e4e2da; }
.${P}-tg i::after { content: ""; position: absolute; left: 1.5px; top: 1.5px; width: 8px; height: 8px; border-radius: 50%; background: #fff; }
.${P}-tg.${P}-on i { background: #2b2a27; }
.${P}-tg.${P}-on i::after { left: 10.5px; }
.${P}-hdr { flex: none; display: flex; align-items: center; justify-content: space-between; height: 22px; margin-top: 6px; }
.${P}-chip { box-sizing: border-box; height: 18px; padding: 0 8px; border-radius: 5px; background: #c9c7be; font-size: 8.5px; line-height: 18px; font-weight: 500; color: #55534c; white-space: pre; }
.${P}-cx { font-size: 9px; font-weight: 500; color: #3a3935; }
.${P}-card { position: relative; flex: none; box-sizing: border-box; height: 264px; margin-top: 6px; border-radius: 8px; background: #edebe4; box-shadow: inset 0 0 0 1px #e4e2da; overflow: hidden; }
.${P}-fact { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; padding: 0 30px; text-align: center; }
.${P}-fact i { display: grid; place-items: center; width: 26px; height: 26px; border-radius: 7px; background: #8c8a82; }
.${P}-fact i svg { display: block; width: 16px; height: 16px; fill: none; stroke: #edebe4; stroke-width: 1.5; stroke-linejoin: round; }
.${P}-fact span { font-size: 9px; line-height: 13px; color: #3a3935; }
.${P}-g { position: absolute; left: 8px; right: 8px; top: 8px; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; }
.${P}-t { position: relative; aspect-ratio: 3 / 4; border-radius: 5px; overflow: hidden; background: #e4e1d8; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-cv { position: absolute; inset: 0; background: #e4e1d8; }
.${P}-cv i { position: absolute; left: 50%; top: 50%; width: 36%; height: 30%; margin: -15% 0 0 -18%; border-radius: 3px; background: #d6d3c9; }
.${P}-run { flex: none; display: flex; align-items: center; justify-content: center; gap: 6px; height: 32px; margin-top: 8px; border-radius: 6px; background: #e8d25a; font-size: 10.5px; font-weight: 500; color: #1d1c19; white-space: nowrap; }
.${P}-run svg { display: block; width: 9px; height: 9px; fill: none; stroke: #1d1c19; stroke-width: 1.4; stroke-linejoin: round; }
.${P}-smp { flex: none; display: flex; align-items: center; justify-content: space-between; height: 18px; margin-top: 8px; font-size: 9px; font-weight: 500; color: #1d1c19; }
`;

const REF = 1.84;                                  // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const RUN_AT = 0.06;                               // the cursor presses Run
const DIM_AT = 0.1;                                // the button dims and the chip reads 'Starting...'
const START = 0.22;                                // 'Starting...' becomes 'Processing | N.Ns'
const GRID_AT = 0.85;                              // the fact card gives way to the block of pending cards
const LAND = Array.from({ length: 10 }, (_, i) => 0.9 + i * 0.0867);   // result i lands (reading order), the last at 1.68
const FADE = 0.06;                                 // a pending card hands over to its picture over this long
const APP_S = 18;                                  // the elapsed clock reaches ~18 s (the button's own estimate) as the last result lands
const FACTS = ['The first designer to put his label on a garment was Charles Frederick Worth in the 19th century.', 'The average person owns 7 pairs of jeans.'];
const FACT_STEP = 0.325;                           // the fact rotates every this many layout seconds, from the start of processing
const TEE = '<svg viewBox="0 0 16 16"><path d="M5.5 2.5L2 4.2l1.2 3 1.4-.5v6.8h6.8V6.7l1.4.5 1.2-3-3.5-1.7c-.3.9-1.2 1.5-2.5 1.5S5.8 3.4 5.5 2.5z"/></svg>';

export default {
  id: 'fashn-ai',
  label: 'FASHN AI try-on (2024)',
  source: {
    platform: "FASHN AI Studio, the virtual try-on workspace of the fashn.ai web app (desktop browser, light theme, 2024 build; FASHN's own tutorial 'How to do Clothing Try-Ons in 2 Minutes | FASHN Web App Tutorial', YouTube QUprJM6RrLo, 2024-12-15)",
    feature: "a light three-column studio: Select Model (photo, Generate AI Model), Select Garment (photo, Category tiles Top / Bottom / Full-body, Long Top, Auto Detect) and Result under which sits the yellow 'Run (~18s)' button, dimmed while running; the Result header shows a grey chip 'Starting...' that becomes a live 'Processing | N.Ns' with 'Cancel' while the result box rotates a fashion fact; no percentage or bar (adapted to 10: the box turns into a 4 + 4 + 2 block of pale pending cards and the results land in strict reading order, the chip clearing at the end)",
    refs: [
      { url: 'https://www.youtube.com/watch?v=QUprJM6RrLo', retrieved: '2026-10-14' },
    ],
    extrapolated: "The footage shows ONE result: 'Run (~18s)' pressed at t~84 s, 'Starting...' at t~86.6 s, 'Processing | 0.1s' at t~89.6 s climbing in real time to 6.1 s at t~95 s, then the recording fast-forwards and by t~99 s the chip is gone and the finished try-on fills the Result box; the landing itself, and the 18 s the button promises, are not captured. The block of ten pale pending cards, their landing one by one in reading order, the clock running on to ~18 s across the beat's window and the chip and Cancel clearing at the tenth landing are extrapolated, as is the fact card handing over to the cards (the footage never shows both). The left rail (Showcase / Studio / Background / My Images) is folded into a slim tab row to fit the 560 px column; the Category icons and the garment tick are plain shapes of our own.",
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'fashn-ai');
    const srcIn = ownSrc(ctx.src, 'fashn-ai-in');   // the two input photos at 116 x 155, a different decode size from the 59 x 79 tiles
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-cv"><i></i></div></div>`;
    const chev = '<svg viewBox="0 0 12 12" width="8" height="8" style="fill: none; stroke: #55534c; stroke-width: 1.5"><path d="M3 4.5l3 3 3-3"/></svg>';
    const play = '<svg viewBox="0 0 10 10"><path d="M2 1.2l6.4 3.8L2 8.8z"/></svg>';
    const root = x.el(`<div class="${P}"><div class="${P}-tabs"><b>STUDIO</b><span>Showcase</span><span class="${P}-on">Studio</span><span>Background</span><span>My Images</span></div><div class="${P}-cols"><div class="${P}-col"><div class="${P}-h">Select Model</div><div class="${P}-ph"><img src="${srcIn}" width="870" height="1024" decoding="sync" alt="Model photo" style="object-position: 50% 0"/><u>×</u></div><div class="${P}-btn">Generate AI Model</div><div class="${P}-row">Model Image Controls${chev}</div></div><div class="${P}-col"><div class="${P}-h">Select Garment</div><div class="${P}-ph"><img src="${srcIn}" width="870" height="1024" decoding="sync" alt="Garment photo" style="object-position: 50% 100%; transform: scale(1.5); transform-origin: 50% 100%"/><u>×</u></div><div class="${P}-lab">Category</div><div class="${P}-cat"><span class="${P}-on"><i></i>Top</span><span><i></i>Bottom</span><span><i></i>Full-body</span></div><div class="${P}-tg"><i></i>Long Top</div><div class="${P}-lab">Garment Photo Type</div><div class="${P}-tg ${P}-on"><i></i>Auto Detect</div></div><div class="${P}-col ${P}-res"><div class="${P}-h">Result</div><div class="${P}-hdr"><span class="${P}-chip" style="visibility: hidden">Starting...</span><span class="${P}-cx" style="visibility: hidden">Cancel</span></div><div class="${P}-card"><div class="${P}-fact"><i>${TEE}</i><span></span></div><div class="${P}-g" style="visibility: hidden">${tiles.map(cell).join('')}</div></div><div class="${P}-run">${play}Run (~18s)</div><div class="${P}-smp">Sampling Controls${chev}</div></div></div></div>`);
    const q = (s) => root.querySelector(`.${P}-${s}`);
    const chip = q('chip'), cx = q('cx'), fact = q('fact'), factText = fact.querySelector('span'), grid = q('card').querySelector(`.${P}-g`), run = q('run');
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), cv: n.querySelector(`.${P}-cv`), g: tiles[i] }));
    ctx.gate([...root.querySelectorAll(`.${P}-ph img`), ...cells.map((c) => c.im)]);

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered
        const done = s >= LAND[9];

        // Run is pressed, then dims while the job runs and comes back at full strength when the last result has landed
        const gp = press(s, RUN_AT, 0.06, 0.06, 0.14);
        put('run', gp.toFixed(3), () => { run.style.transform = gp > 0 ? `scale(${(1 - 0.03 * gp).toFixed(4)})` : 'none'; });
        put('dim', s >= DIM_AT && !done, (v) => { run.style.opacity = v ? '0.5' : ''; });

        // the Result header: 'Starting...' -> 'Processing | N.Ns' (elapsed seconds, counting up from t, stopped at the last landing) with 'Cancel'; both clear once done
        const starting = s >= DIM_AT && s < START;
        const processing = s >= START && !done;
        const el = (Math.min(s, LAND[9]) - START) * (APP_S / (LAND[9] - START));
        const txt = starting ? 'Starting...' : `Processing | ${Math.max(0.1, el).toFixed(1)}s`;
        put('chip', `${starting || processing}|${txt}`, () => { chip.style.visibility = starting || processing ? '' : 'hidden'; chip.textContent = txt; });
        put('cx', starting || processing, (v) => { cx.style.visibility = v ? '' : 'hidden'; });

        // the fact card rotates while the job runs, then gives way to the block of pending cards
        const gridOn = s >= GRID_AT;
        const fi = Math.floor(Math.max(0, s - START) / FACT_STEP) % FACTS.length;
        put('fact', fi, (v) => { factText.textContent = FACTS[v]; });
        put('grid', gridOn, (v) => { fact.style.display = v ? 'none' : ''; grid.style.visibility = v ? '' : 'hidden'; });

        // the results land one by one in reading order
        cells.forEach((c, i) => {
          const a = LAND[i];
          const f = seg(s, a - FADE, a);
          put(`i${i}`, s >= a - FADE, (v) => { c.im.style.visibility = v ? '' : 'hidden'; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
          put(`c${i}`, f.toFixed(3), () => {
            if (f >= 1) { c.cv.style.display = 'none'; c.cv.style.opacity = ''; } else { c.cv.style.display = ''; c.cv.style.opacity = f > 0 ? (1 - f).toFixed(3) : ''; }
          });
        });
      },
    };
  },
};
