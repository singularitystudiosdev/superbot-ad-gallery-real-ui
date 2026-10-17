// PixelLab for Aseprite (YouTube nITrIQw1gag 'How to Generate Consistent Pixel Art for Games', PixelLab official channel, published
// 2025-12-29, t~48-91 s; also 7ChVezZPv64 2025-12-31 and OdRIHQ4ar2c 2025-12-19; spec .tmp/clone-9e82faf1/reveal-refs/pixellab/spec.json,
// confidence 0.62; frames ao2_pix_t64.png, ao2_pix_dialog_zoom.png, ao2_pix_t71/t74/t77.png, ao2_pix_gen_bars.png, ao2_pix_t91.png). The
// Aseprite desktop editor in its dusky theme: a palette column and colour boxes on the left, a transparency-checkerboard canvas in the
// middle, a tool rail on the right, a steel-blue timeline below, and the plugin's light 'Create character' dialog docked over the editor
// ('-Character- Description:' with the prompt, '-General- Output method: New layer', Remove background, Advanced options, then the
// 'Generate | Reset | Cancel' row). Pending is not a tile: the canvas stays the checkerboard while the timeline's layer row reads
// 'PixelLab - Generating' with a small spinner glyph, a determinate bar of 16 round pips filling left to right under a numbered 1..16
// ruler (no percentage, no count, no blur). When the job ends the pictures are on the canvas and a 'Finished - Seed: 0' review panel
// (Retry / Discard / Back and reuse seed / Reduce colors / Done) replaces the dialog.
// Adapted to ten images: a 5 x 2 block of frames painted onto the canvas one after another in strict reading order, the pip bar filling
// across the whole wait, the review panel appearing once the last frame is down. Extrapolated: the ten frames (the footage's job paints one
// sprite), the reading-order landing, the length of the wait (the footage's run is trimmed between its last bar frame and the review panel),
// the dialog's heading and the prompt wording (illegible at 480p). Omitted: the dialog's generation-cost lines, the Like / Dislike prompt and
// the documentation link, every logo, and any account element. The footage's sprites are never reproduced; every frame is our own meme,
// the glyphs are plain CSS, and the type is the system face.
import { seg, press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-pxa';
const ROOT_H = 400, CELL_W = 44, CELL_H = 52;
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 10px; background: #1d1722; color: #2c2634; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #34293c; }
.${P}-bar { flex: none; position: relative; display: flex; align-items: center; justify-content: center; height: 16px; font-size: 6.5px; color: #a79eb0; background: #2a2230; }
.${P}-dots { position: absolute; left: 7px; top: 5px; display: flex; gap: 3px; }
.${P}-dots i { display: block; width: 6px; height: 6px; border-radius: 50%; background: #5a4f63; }
.${P}-tabs { flex: none; display: flex; align-items: flex-end; gap: 2px; height: 16px; padding: 0 4px; background: #8a9bad; }
.${P}-tabs span { box-sizing: border-box; display: flex; align-items: center; height: 13px; padding: 0 8px; background: #a9b6c4; font-size: 6.5px; color: #2c3744; white-space: nowrap; }
.${P}-tabs .${P}-on { background: #d3dbe3; color: #1e2833; font-weight: 600; }
.${P}-tool { flex: none; display: flex; align-items: center; gap: 6px; height: 14px; padding: 0 8px; background: #7e8fa2; font-size: 6px; color: #1f2a36; white-space: nowrap; }
.${P}-tool b { box-sizing: border-box; height: 9px; padding: 0 5px; line-height: 9px; border-radius: 2px; background: #5d6b7b; font-size: 5.5px; font-weight: 600; color: #e7ecf1; }
.${P}-main { flex: 1; min-height: 0; display: flex; background: #6b5b6e; }
.${P}-left { flex: none; box-sizing: border-box; display: flex; flex-direction: column; gap: 5px; width: 54px; padding: 5px 4px; background: #7e8fa2; }
.${P}-pal { display: grid; grid-template-columns: repeat(5, 8px); gap: 1px; justify-content: center; }
.${P}-pal i { display: block; width: 8px; height: 8px; }
.${P}-pick { height: 38px; margin-top: 4px; background: linear-gradient(to bottom, rgba(255, 255, 255, 0), #000), linear-gradient(to right, #fff, #d63a4a); box-shadow: 0 0 0 1px #3a4655; }
.${P}-hue { height: 4px; background: linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00); }
.${P}-col { box-sizing: border-box; height: 11px; border-radius: 3px; font-size: 5px; line-height: 11px; text-align: center; box-shadow: 0 0 0 1px #2c3744; }
.${P}-mid { position: relative; flex: 1; min-width: 0; display: flex; justify-content: flex-start; align-items: center; padding-left: 8px; }
.${P}-cv { position: relative; flex: none; width: 238px; height: 238px; background: repeating-conic-gradient(#c9c9c9 0 25%, #9b9b9b 0 50%) 0 0 / 16px 16px; box-shadow: 0 0 0 1px #2c2634; }
.${P}-g { position: absolute; inset: 0; display: grid; grid-template-columns: repeat(5, ${CELL_W}px); grid-auto-rows: ${CELL_H}px; gap: 3px; justify-content: center; align-content: center; }
.${P}-f { position: relative; width: ${CELL_W}px; height: ${CELL_H}px; overflow: hidden; }
.${P}-f img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-f div { position: absolute; inset: 0; }
.${P}-dock { flex: none; box-sizing: border-box; width: 236px; margin: 6px 4px 0 0; align-self: flex-start; }
.${P}-dlg { box-sizing: border-box; border-radius: 3px; background: #dcd7cb; box-shadow: 0 0 0 1px #2c2634, 0 3px 8px rgba(0, 0, 0, .3); overflow: hidden; }
.${P}-th { display: flex; align-items: center; justify-content: space-between; height: 12px; padding: 0 5px; background: #b9b3a6; font-size: 6px; color: #2a2e44; white-space: nowrap; }
.${P}-dp { padding: 4px 8px 8px 8px; }
.${P}-sec { display: flex; align-items: center; gap: 3px; height: 10px; margin-top: 3px; font-size: 6.5px; color: #3a4aa0; white-space: nowrap; }
.${P}-sec::after { content: ""; flex: 1; height: 0; border-top: 1px dotted #8e89a8; }
.${P}-row { display: flex; align-items: center; gap: 6px; margin-top: 4px; font-size: 6.5px; color: #2c2634; white-space: nowrap; }
.${P}-row > span { flex: none; width: 50px; }
.${P}-fld { flex: 1; min-width: 0; box-sizing: border-box; height: 12px; padding: 0 4px; border-radius: 2px; background: #fff; box-shadow: inset 0 0 0 1px #2c2634; line-height: 12px; font-size: 6.5px; color: #1c1824; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.${P}-hint { margin: 4px 0 0 56px; font-size: 6px; line-height: 8px; color: #4a4558; }
.${P}-chk { display: flex; align-items: center; gap: 4px; height: 10px; margin: 4px 0 0 56px; font-size: 6.5px; color: #2c2634; white-space: nowrap; }
.${P}-chk i { position: relative; display: block; flex: none; box-sizing: border-box; width: 7px; height: 7px; border-radius: 1px; background: #fff; box-shadow: inset 0 0 0 1px #4a4558; }
.${P}-chk i.${P}-on::after { content: ""; position: absolute; left: 1.6px; top: 0.4px; width: 1.8px; height: 3.6px; border-right: 1.2px solid #2c2634; border-bottom: 1.2px solid #2c2634; transform: rotate(40deg); }
.${P}-btns { display: flex; gap: 6px; margin-top: 8px; }
.${P}-b { flex: 1; display: grid; place-items: center; box-sizing: border-box; height: 15px; border-radius: 3px; background: #fbfaf7; box-shadow: inset 0 0 0 1px #2c2634, inset 0 -1.5px 0 #b8b3a8; font-size: 6.8px; color: #1c1824; white-space: nowrap; }
.${P}-stk { display: flex; flex-direction: column; gap: 3px; margin-top: 4px; }
.${P}-two { display: flex; gap: 6px; }
.${P}-slider { box-sizing: border-box; height: 12px; border-radius: 2px; background: linear-gradient(to right, #8c93a6 0 22%, #bdd0e6 22% 100%); box-shadow: inset 0 0 0 1px #2c2634; text-align: center; font-size: 6.5px; line-height: 12px; color: #1c1824; }
.${P}-rail { flex: none; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; gap: 5px; width: 12px; padding-top: 4px; background: #7e8fa2; }
.${P}-rail i { display: block; width: 7px; height: 7px; border-radius: 1px; background: #2a3441; opacity: .8; }
.${P}-tl { flex: none; box-sizing: border-box; height: 54px; background: #7e8fa2; }
.${P}-ctl { display: flex; align-items: center; gap: 3px; height: 12px; padding-left: 8px; }
.${P}-ctl i { display: block; width: 9px; height: 8px; border-radius: 1px; background: #5d6b7b; }
.${P}-ru, .${P}-ly { display: flex; align-items: center; height: 13px; margin-left: 8px; }
.${P}-nm { flex: none; box-sizing: border-box; display: flex; align-items: center; gap: 4px; width: 150px; height: 13px; padding: 0 5px; background: #cfd2d6; font-size: 6.5px; color: #4a5565; white-space: nowrap; }
.${P}-ru .${P}-nm { background: #b8bec6; }
.${P}-sp { display: block; flex: none; box-sizing: border-box; width: 7px; height: 7px; border-radius: 50%; border: 1.3px solid #4a4a4a; border-top-color: transparent; }
.${P}-no { flex: none; box-sizing: border-box; width: 18px; height: 13px; background: #c4c8cd; font-size: 6px; line-height: 13px; text-align: center; color: #3a4452; }
.${P}-no.${P}-on { background: #8c93a6; color: #fff; }
.${P}-pip { flex: none; display: grid; place-items: center; box-sizing: border-box; width: 18px; height: 13px; background: #d8dade; }
.${P}-pip i { display: block; box-sizing: border-box; width: 7px; height: 7px; border-radius: 50%; background: #fff; box-shadow: 0 0 0 1px #6d7480; }
.${P}-stat { box-sizing: border-box; overflow: hidden; line-height: 10px; display: flex; align-items: center; justify-content: space-between; height: 12px; margin-top: 4px; padding: 0 8px; background: #2a2230; font-size: 6px; color: #a79eb0; }
`;

const PROMPT = 'a muse holding a handwritten note in a lecture hall, meme style';
const PAL = ['#000000', '#1d2b53', '#7e2553', '#008751', '#ab5236', '#5f574f', '#c2c3c7', '#fff1e8', '#ff004d', '#ffa300', '#ffec27', '#00e436', '#29adff', '#83769c', '#ff77a8', '#ffccaa', '#291814', '#111d35', '#422136', '#125359', '#742f29', '#49333b', '#a28879', '#f3ef7d', '#be1250', '#ff6c24', '#a8e72e', '#00b543', '#065ab5', '#754665'];
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const GEN_AT = 0.06;                              // the cursor presses Generate
const ISSUE = 0.16;                               // the job starts: the progress row switches to 'PixelLab - Generating'
const LAND = Array.from({ length: 10 }, (_, i) => 0.4 + i * 0.1425);   // frame i is painted onto the canvas (reading order), the last at 1.68
const REVIEW = LAND[9] + 0.05;                    // the 'Finished - Seed: 0' panel replaces the dialog once the last frame is down
const PIPS = 16, SPIN = 520;

export default {
  id: 'pixellab',
  label: 'PixelLab for Aseprite (2025)',
  source: {
    platform: "PixelLab's first-party Aseprite extension inside Aseprite v1.3.15 (desktop, dusky theme; PixelLab's official tutorials on YouTube)",
    feature: "the plugin's 'Create character' dialog over the Aseprite editor (-Character- Description, Output method, Remove background, Advanced options, Generate | Reset | Cancel); pending is the timeline row 'PixelLab - Generating' with a small spinner glyph and a determinate bar of 16 round pips filling left to right under a numbered 1..16 ruler while the canvas stays the transparency checkerboard; then the frames are on the canvas and the 'Finished - Seed: 0' review panel (Retry / Discard / Back and reuse seed / Reduce colors / Done) appears (adapted to ten frames in a 5 x 2 block, strict reading order; the generation-cost lines and the Like / Dislike prompt are omitted)",
    refs: [
      { url: 'https://www.youtube.com/watch?v=nITrIQw1gag', videoId: 'nITrIQw1gag', published: '2025-12-29', retrieved: '2026-10-14' },
      { url: 'https://www.youtube.com/watch?v=7ChVezZPv64', videoId: '7ChVezZPv64', published: '2025-12-31', retrieved: '2026-10-14' },
      { url: 'https://www.youtube.com/watch?v=OdRIHQ4ar2c', videoId: 'OdRIHQ4ar2c', published: '2025-12-19', retrieved: '2026-10-14' },
    ],
    videoIds: ['nITrIQw1gag', '7ChVezZPv64', 'OdRIHQ4ar2c'],
    dates: { published: '2025-12-29 (nITrIQw1gag), 2025-12-31 (7ChVezZPv64), 2025-12-19 (OdRIHQ4ar2c)', retrieved: '2026-10-14', capture: 't~48-91 s of a 200 s screen recording' },
    extrapolated: ['ten frames in a 5 x 2 block (the footage paints one sprite; the multi-frame tools produce several)', 'strict reading-order landing of the frames (the footage paints the finished sprite at once)', 'the length of the wait (the footage is trimmed between its last bar frame at t=79.5 s and the review panel at t=91 s)', "the dialog's heading and the prompt wording (illegible at 480p)", 'the landed timeline row (ten filled pips and the layer name) and the colour column'],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'pixellab');
    const frame = (g, i) => `<div class="${P}-f"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div></div></div>`;
    const pal = PAL.map((c) => `<i style="background: ${c}"></i>`).join('');
    const rail = Array.from({ length: 8 }, () => '<i></i>').join('');
    const nums = Array.from({ length: PIPS }, (_, i) => `<span class="${P}-no">${i + 1}</span>`).join('');
    const pips = Array.from({ length: PIPS }, () => `<span class="${P}-pip"><i></i></span>`).join('');
    const root = x.el(`<div class="${P}"><div class="${P}-bar"><div class="${P}-dots"><i></i><i></i><i></i></div>Sprite-0001 - Aseprite</div><div class="${P}-tabs"><span>Home</span><span class="${P}-on">Sprite-0001</span></div><div class="${P}-tool"><b>Auto Select Layer</b></div><div class="${P}-main"><div class="${P}-left"><div class="${P}-pal">${pal}</div><div class="${P}-pick"></div><div class="${P}-hue"></div><div class="${P}-col" style="background: #fdfcfc; color: #2c2634">#fdfcfc</div><div class="${P}-col" style="background: #4e3c2e; color: #f0e6dc">#4e3c2e</div></div><div class="${P}-mid"><div class="${P}-cv"><div class="${P}-g">${tiles.map(frame).join('')}</div></div></div><div class="${P}-dock"><div class="${P}-dlg ${P}-gen"><div class="${P}-th">Create character with frames<span>x</span></div><div class="${P}-dp"><div class="${P}-sec">Character</div><div class="${P}-row"><span>Description:</span><div class="${P}-fld">${x.esc(PROMPT)}</div></div><div class="${P}-hint">Describe the characters/items/objects you wish to generate. e.g. "warrior with sword", "small slime", "fireball"</div><div class="${P}-sec">General</div><div class="${P}-row"><span>Output method:</span><div class="${P}-fld">New layer</div></div><div class="${P}-chk"><i class="${P}-on"></i>Remove background</div><div class="${P}-chk"><i></i>Advanced options</div><div class="${P}-btns"><div class="${P}-b">Generate</div><div class="${P}-b">Reset</div><div class="${P}-b">Cancel</div></div></div></div><div class="${P}-dlg ${P}-rev" style="display: none"><div class="${P}-th">Finished - Seed: 0<span>x</span></div><div class="${P}-dp"><div class="${P}-stk"><div class="${P}-b">Retry</div><div class="${P}-b">Discard</div><div class="${P}-b">Back and reuse seed</div><div class="${P}-b">Reduce colors</div><div class="${P}-two"><div class="${P}-b">Back</div><div class="${P}-b">Done</div></div></div><div class="${P}-sec">Reduce colors</div><div class="${P}-stk"><div class="${P}-b">Auto reduce colors</div><div class="${P}-slider">53</div><div class="${P}-b">Set colors</div></div></div></div></div><div class="${P}-rail">${rail}</div></div><div class="${P}-tl"><div class="${P}-ctl"><i></i><i></i><i></i><i></i></div><div class="${P}-ru"><div class="${P}-nm"></div>${nums}</div><div class="${P}-ly"><div class="${P}-nm"><span class="${P}-sp"></span><b style="font-weight: 400">PixelLab - Generation</b></div>${pips}</div><div class="${P}-stat"><span>256 x 256</span><span>Frame: 1</span></div></div></div>`);
    const gen = root.querySelector(`.${P}-gen`), rev = root.querySelector(`.${P}-rev`);
    const go = root.querySelector(`.${P}-btns .${P}-b`);
    const sp = root.querySelector(`.${P}-sp`), label = root.querySelector(`.${P}-ly .${P}-nm b`);
    const nos = [...root.querySelectorAll(`.${P}-no`)], pipDots = [...root.querySelectorAll(`.${P}-pip i`)];
    const frames = [...root.querySelectorAll(`.${P}-f`)].map((n, i) => ({ im: n.querySelector('img'), cover: n.querySelector('div'), g: tiles[i] }));
    ctx.gate(frames.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // Generate is pressed (the dialog stays open while the job runs)
        const gp = press(s, GEN_AT, 0.06, 0.06, 0.14);
        put('go', gp.toFixed(3), () => { go.style.transform = gp > 0 ? `scale(${(1 - 0.05 * gp).toFixed(4)})` : 'none'; });

        // the job runs from ISSUE until the last frame is down: the spinner turns and the pips fill. Both are functions of t that FREEZE
        // at that moment (the spinner is hidden, the bar settles on the ten filled cels), so the landed state is static
        const running = s >= ISSUE && s < LAND[9];
        const fill = running ? Math.floor(PIPS * seg(s, ISSUE, LAND[9])) : s >= LAND[9] ? 10 : 0;
        const cur = running ? Math.min(fill, PIPS - 1) : 0;
        put('run', running, (v) => { sp.style.display = v ? '' : 'none'; label.textContent = v ? 'PixelLab - Generating' : 'PixelLab - Generation'; });
        const deg = running ? Math.round(((s * SPIN) % 360 + 360) % 360) : 0;
        put('sp', deg, (d) => { sp.style.transform = `rotate(${d}deg)`; });
        put('fill', fill, (n) => { pipDots.forEach((p, i) => { p.style.background = i < n ? '#4a4a4a' : ''; }); });
        put('cur', cur, (n) => { nos.forEach((el, i) => el.classList.toggle(`${P}-on`, i === n)); });

        // the frames are painted onto the checkerboard canvas one after another, in reading order
        frames.forEach((c, i) => {
          const done = s >= LAND[i];
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
          put(`i${i}`, done, (v) => { c.im.style.visibility = v ? '' : 'hidden'; c.cover.style.display = v ? 'none' : ''; });
        });

        // the review panel replaces the dialog
        put('rev', s >= REVIEW, (v) => { gen.style.display = v ? 'none' : ''; rev.style.display = v ? '' : 'none'; });
      },
    };
  },
};
