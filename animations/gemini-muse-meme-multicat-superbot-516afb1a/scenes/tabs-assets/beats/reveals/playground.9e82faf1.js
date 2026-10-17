// Playground (2024), the Canvas image generator of playground.com, the 2024 generation of its UI (a tutorial on YouTube, i26WnckdEOo,
// pub. 2024-02-05, t~196-209 s; spec .tmp/clone-9e82faf1/reveal-refs/playground/spec.json, confidence 0.70; frames
// q_pg_2024_idle_generate.jpg, q_pg_2024_pending_2s.jpg, q_pg_2024_pending_5s.jpg, q_pg_2024_landing.jpg). The spec records two
// generations of the product's UI; this module builds the 2024 Canvas one, not the 2023 grid generator with its watermark and prompt
// text on each tile. A near-black three-column app: a left rail (Board | Canvas tabs, an 'Image to Image' drop zone, a Filter chip, the
// Expand Prompt toggle), a dotted centre canvas, a right settings panel (Quality & Details, 'Number of Images' chips, Sampler) and a
// floating prompt card at the lower left of the canvas with the purple Generate button. The output sits in a row of square frames
// labelled 'Generation frame 1024x1024': the active frame is near-black (#0A0813) with a thin purple outline, the siblings flat grey
// (#26252B). On Generate the button becomes a grey 'Cancel' chip and the active frame shows a slowly rotating 12-spoke grey spinner at
// its top left with a small timer under it counting up in tenths of a second ('1.8s' ... '9.8s'). There is no percentage, queue label
// or preview, and the frames fill one after another.
// Adapted to ten images: ten square frames (4 + 4 + 2) landing strictly in order, the outline and spinner moving on to the next frame
// each time one lands; the timer runs from 1.8s to 9.8s across the whole beat. The footage shows 'Number of Images' as chips 1-8; a
// ninth chip '10' carries the selection here. Omitted: the logo, the project title chrome and the footage's pictures (every frame is
// our own meme); no platform font is drawn (plain shapes, system type).
import { seg, press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-pg';
const ROOT_W = 560, ROOT_H = 400, TOP_H = 24, LEFT_W = 108, RIGHT_W = 112, SLOT = 76, SGAP = 5;
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; width: ${ROOT_W}px; max-width: 100%; height: ${ROOT_H}px; border-radius: 12px; background: #050310; color: #dcdce0; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #17151f; }
.${P}-top { flex: none; position: relative; display: flex; align-items: center; height: ${TOP_H}px; padding: 0 8px; background: #100f14; box-shadow: 0 1px 0 #1b1a22; font-size: 7px; font-weight: 500; color: #d4d4d8; white-space: nowrap; }
.${P}-tools { position: absolute; left: 50%; top: 5px; display: flex; gap: 4px; transform: translateX(-50%); }
.${P}-tools i { display: block; box-sizing: border-box; width: 14px; height: 14px; border-radius: 3px; box-shadow: inset 0 0 0 1.6px #2b2a33; background: #17161d; }
.${P}-tools .on { background: #5a3ee1; box-shadow: none; }
.${P}-share { position: absolute; right: 8px; top: 5px; display: grid; place-items: center; box-sizing: border-box; height: 14px; padding: 0 7px; border-radius: 4px; background: #5a3ee1; font-size: 6.5px; font-weight: 600; color: #fff; }
.${P}-body { flex: 1; min-height: 0; display: flex; }
.${P}-left { flex: none; box-sizing: border-box; width: ${LEFT_W}px; padding: 6px 7px; background: #0b0a12; box-shadow: 1px 0 0 #17151f; overflow: hidden; }
.${P}-tabs { display: flex; height: 14px; border-radius: 4px; background: #14131b; font-size: 6.5px; color: #8d8d96; }
.${P}-tabs span { flex: 1; display: grid; place-items: center; border-radius: 4px; }
.${P}-tabs .on { background: #23222b; color: #f0f0f3; }
.${P}-how { display: flex; align-items: center; gap: 4px; box-sizing: border-box; height: 16px; margin-top: 6px; padding: 0 5px; border-radius: 4px; background: #17132b; box-shadow: inset 0 0 0 1px #3a2f77; font-size: 6.5px; font-weight: 600; color: #ecebf7; white-space: nowrap; }
.${P}-how b { margin-left: auto; width: 7px; height: 7px; border-radius: 50%; background: #5a3ee1; }
.${P}-h { margin-top: 8px; font-size: 7px; font-weight: 700; color: #f1f1f4; }
.${P}-d { margin-top: 2px; font-size: 5.5px; line-height: 7px; color: #8a8a93; }
.${P}-drop { display: grid; place-items: center; box-sizing: border-box; height: 34px; margin-top: 4px; border-radius: 4px; background: #0e0d15; box-shadow: inset 0 0 0 1px #1b1a23; font-size: 11px; font-weight: 300; color: #8d8d96; }
.${P}-chip { display: flex; align-items: center; gap: 4px; box-sizing: border-box; height: 15px; margin-top: 4px; padding: 0 4px; border-radius: 3px; background: #14131b; font-size: 6px; color: #d4d4d8; }
.${P}-chip i { display: block; width: 8px; height: 8px; border-radius: 2px; background: linear-gradient(135deg, #8d6f58, #3b4455); }
.${P}-tg { display: flex; align-items: center; justify-content: space-between; margin-top: 8px; font-size: 7px; font-weight: 700; color: #f1f1f4; }
.${P}-tg i { position: relative; display: block; width: 14px; height: 8px; border-radius: 4px; background: #2d2c35; }
.${P}-tg i::after { content: ""; position: absolute; left: 1.5px; top: 1.5px; width: 5px; height: 5px; border-radius: 50%; background: #f1f1f4; }
.${P}-txt { box-sizing: border-box; height: 42px; margin-top: 4px; padding: 4px; border-radius: 4px; background: #0e0d15; box-shadow: inset 0 0 0 1px #1b1a23; font-size: 5.5px; line-height: 7px; color: #b9b9c1; overflow: hidden; }
.${P}-cv { position: relative; flex: 1; min-width: 0; background-color: #050310; background-image: radial-gradient(#1a1828 0.7px, transparent 0.8px); background-size: 8px 8px; overflow: hidden; }
.${P}-fl { position: absolute; left: 10px; top: 12px; display: flex; justify-content: space-between; width: 168px; font-size: 6px; color: #d4d4d8; white-space: nowrap; }
.${P}-fl span { color: #a8a8b0; }
.${P}-g { position: absolute; left: 10px; top: 26px; display: grid; grid-template-columns: repeat(4, ${SLOT}px); gap: ${SGAP}px; }
.${P}-t { position: relative; width: ${SLOT}px; height: ${SLOT}px; border-radius: 5px; overflow: hidden; background: #26252b; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-c { position: absolute; inset: 0; border-radius: 5px; background: #26252b; }
.${P}-sp { position: absolute; left: 7px; top: 7px; width: 14px; height: 14px; }
.${P}-sp svg { display: block; width: 14px; height: 14px; }
.${P}-tm { position: absolute; left: 6px; top: 25px; font-size: 6.5px; line-height: 8px; color: #929395; white-space: nowrap; }
.${P}-card { position: absolute; left: 10px; bottom: 14px; box-sizing: border-box; display: flex; flex-direction: column; width: 168px; height: 66px; padding: 6px 7px 6px 7px; border-radius: 6px; background: #121118; box-shadow: inset 0 0 0 1px #1f1d28; }
.${P}-card p { flex: 1; margin: 0; font-size: 6.5px; line-height: 9px; color: #e2e2e6; overflow: hidden; }
.${P}-cr { flex: none; display: flex; align-items: center; justify-content: space-between; height: 16px; font-size: 6px; color: #b9b9c1; }
.${P}-pr { display: flex; align-items: center; gap: 4px; }
.${P}-pr i { position: relative; display: block; width: 12px; height: 7px; border-radius: 4px; background: #2d2c35; }
.${P}-pr i::after { content: ""; position: absolute; left: 1px; top: 1px; width: 5px; height: 5px; border-radius: 50%; background: #f1f1f4; }
.${P}-go { display: grid; place-items: center; box-sizing: border-box; height: 16px; padding: 0 9px; border-radius: 8px; background: #5a3ee1; font-size: 6.5px; font-weight: 600; color: #fff; white-space: nowrap; }
.${P}-right { flex: none; box-sizing: border-box; width: ${RIGHT_W}px; padding: 8px 8px; background: #0b0a12; box-shadow: -1px 0 0 #17151f; overflow: hidden; }
.${P}-sl { position: relative; height: 3px; margin: 8px 18px 0 0; border-radius: 2px; background: #2a2933; }
.${P}-sl i { position: absolute; left: 0; top: 0; bottom: 0; width: 55%; border-radius: 2px; background: #5a8ae8; }
.${P}-sl b { position: absolute; left: 55%; top: -2.5px; width: 8px; height: 8px; margin-left: -4px; border-radius: 50%; background: #f1f1f4; }
.${P}-sl s { position: absolute; right: -16px; top: -3px; text-decoration: none; font-size: 6px; color: #b9b9c1; }
.${P}-n { display: grid; grid-template-columns: repeat(5, 1fr); gap: 3px; margin-top: 5px; }
.${P}-n span { display: grid; place-items: center; box-sizing: border-box; height: 15px; border-radius: 3px; box-shadow: inset 0 0 0 1px #2b2a33; font-size: 6.5px; color: #8d8d96; }
.${P}-n .on { background: #17132b; box-shadow: inset 0 0 0 1px #5a8ae8; color: #f1f1f4; }
.${P}-dd { display: flex; align-items: center; justify-content: space-between; box-sizing: border-box; height: 17px; margin-top: 4px; padding: 0 5px; border-radius: 4px; box-shadow: inset 0 0 0 1px #2b2a33; font-size: 6.5px; color: #d4d4d8; }
.${P}-dd svg { width: 6px; height: 6px; fill: none; stroke: #8d8d96; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
`;

const PROMPT = 'A muse in a lecture hall holding up a handwritten note, meme style, bold colours';
const REF = 1.84;                                  // the beat in seconds from the card's entrance: cardIn .. lastLand
const GEN_AT = 0.06;                               // the cursor presses Generate
const ISSUE = 0.16;                                // the active frame starts its spinner and timer
const LAND = Array.from({ length: 10 }, (_, i) => 0.4 + i * 0.1425);   // frame i lands, strictly in order, the last at 1.68
const FADE = 0.06;                                 // a frame's cover thins away over this long before the picture lands
const T0 = 1.8, T1 = 9.8;                          // the timer's first and last readings, the footage's '1.8s' and '9.8s'
const SPOKES = Array.from({ length: 12 }, (_, j) => `<line x1="7" y1="0.9" x2="7" y2="3.9" stroke="rgba(146, 147, 149, ${(1 - j * 0.07).toFixed(2)})" stroke-width="1.1" stroke-linecap="round" transform="rotate(${j * 30} 7 7)"/>`).join('');

export default {
  id: 'playground',
  label: 'Playground (2024)',
  source: {
    platform: 'Playground (playground.com) Canvas image generator, the 2024 generation of its UI (desktop browser, dark theme; a tutorial on YouTube, 2024-02-05)',
    feature: "2024 Canvas generator (not the 2023 grid one): a three-column app (left rail, dotted centre canvas, right settings panel with 'Number of Images' chips), a floating prompt card at the lower left whose purple Generate becomes a grey 'Cancel' chip, output frames labelled 'Generation frame 1024x1024' where the active frame is near-black (#0A0813) with a thin purple outline, a slowly rotating 12-spoke grey spinner and a timer counting up in tenths ('1.8s' -> '9.8s'), the siblings flat grey (#26252B); no percentage, queue label or preview (adapted to 10: ten frames 4 + 4 + 2 landing strictly in order, the outline and spinner passing to the next frame as each lands)",
    refs: [{ url: 'https://www.youtube.com/watch?v=i26WnckdEOo', retrieved: '2026-10-14' }],
    extrapolated: "the footage shows four frames in one row and a timer running for a few real seconds; the ten-frame 4 + 4 + 2 layout, the hand-over of the active frame and the compressed 1.8s -> 9.8s run are adapted, not observed; the '10' chip is added to the footage's 1-8 chips",
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'playground');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-c"><i class="${P}-sp" style="display: none"><svg viewBox="0 0 14 14">${SPOKES}</svg></i><b class="${P}-tm" style="display: none; font-weight: 400">1.8s</b></div></div>`;
    const chev = '<svg viewBox="0 0 12 12"><path d="M3 4.5l3 3 3-3"/></svg>';
    const root = x.el(`<div class="${P}"><div class="${P}-top">Untitled<div class="${P}-tools"><i></i><i></i><i></i><i class="on"></i><i></i><i></i></div><div class="${P}-share">Share</div></div><div class="${P}-body"><div class="${P}-left"><div class="${P}-tabs"><span>Board</span><span class="on">Canvas</span></div><div class="${P}-how">How to use Canvas<b></b></div><div class="${P}-h">Image to Image</div><div class="${P}-d">Upload or select an image as inspiration.</div><div class="${P}-drop">+</div><div class="${P}-h">Filter</div><div class="${P}-chip"><i></i>Dreamshaper</div><div class="${P}-tg">Expand Prompt<i></i></div><div class="${P}-h">Exclude From Image</div><div class="${P}-txt">ugly, deformed, noisy, blurry, distorted, out of focus, bad anatomy, extra limbs, poorly drawn face</div></div><div class="${P}-cv"><div class="${P}-fl">Generation frame<span>1024x1024</span></div><div class="${P}-g">${tiles.map(cell).join('')}</div><div class="${P}-card"><p>${x.esc(PROMPT)}</p><div class="${P}-cr"><div class="${P}-pr"><i></i>Preview Render</div><div class="${P}-go"><span class="lbl">Generate</span></div></div></div></div><div class="${P}-right"><div class="${P}-h" style="margin-top: 0">Quality &amp; Details</div><div class="${P}-sl"><i></i><b></b><s>50</s></div><div class="${P}-h" style="margin-top: 12px">Number of Images</div><div class="${P}-n"><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span><span>8</span><span class="on">10</span></div><div class="${P}-h" style="margin-top: 12px">Sampler</div><div class="${P}-dd">Euler a${chev}</div></div></div></div>`);
    const go = root.querySelector(`.${P}-go`), lbl = go.querySelector('.lbl');
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), cv: n.querySelector(`.${P}-c`), sp: n.querySelector(`.${P}-sp`), tm: n.querySelector(`.${P}-tm`), g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // Generate is pressed and becomes 'Cancel' until the last picture has landed
        const gp = press(s, GEN_AT, 0.06, 0.06, 0.14);
        put('go', gp.toFixed(3), () => { go.style.transform = gp > 0 ? `scale(${(1 - 0.06 * gp).toFixed(4)})` : 'none'; });
        const busy = s >= GEN_AT + 0.05 && s < LAND[9];
        put('busy', busy, (v) => { lbl.textContent = v ? 'Cancel' : 'Generate'; go.style.background = v ? '#2d2c35' : ''; go.style.color = v ? '#d4d4d8' : ''; });

        // the active frame is the first one still pending; its timer counts up in tenths across the whole beat
        const active = LAND.filter((a) => s >= a).length;
        const run = s >= ISSUE;
        const tm = `${(T0 + (T1 - T0) * seg(s, ISSUE, LAND[9])).toFixed(1)}s`;

        cells.forEach((c, i) => {
          const a = LAND[i];
          const f = seg(s, a - FADE, a);
          put(`i${i}`, s >= a - FADE, (v) => { c.im.style.visibility = v ? '' : 'hidden'; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
          const act = i === active;
          put(`c${i}`, `${f.toFixed(3)}${act ? 'a' : 'p'}${act && run ? 'r' : ''}`, () => {
            if (f >= 1) { c.cv.style.display = 'none'; c.cv.style.opacity = ''; return; }
            c.cv.style.display = '';
            c.cv.style.opacity = f > 0 ? (1 - f).toFixed(3) : '';
            c.cv.style.background = act ? '#0a0813' : '';
            c.cv.style.boxShadow = act ? 'inset 0 0 0 1px #5d46d6' : 'none';
            c.sp.style.display = act && run ? '' : 'none';
            c.tm.style.display = act && run ? '' : 'none';
          });
          if (act && run) {
            const deg = (((t * 120) % 360) + 360) % 360;
            put(`d${i}`, deg.toFixed(0), (d) => { c.sp.style.transform = `rotate(${d}deg)`; });
            put(`m${i}`, tm, (v) => { c.tm.textContent = v; });
          }
        });
      },
    };
  },
};
