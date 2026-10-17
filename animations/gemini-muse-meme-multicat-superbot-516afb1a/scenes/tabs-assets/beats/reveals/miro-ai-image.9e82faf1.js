// Miro AI's 'Image' generation in the Miro web app, miro.com/app (YouTube jaUOb1D0DFQ, DrewTech Hub, 2025-12-15, t~38-66 s; spec
// .tmp/clone-9e82faf1/reveal-refs/miro-ai-image/spec.json, confidence 0.70; frames ac_miro_pending_t3.png, ac_miro_pending_t7.png,
// ac_miro_pending_panel_crop.png, ac_miro_landing_t20.png, ac_miro_complete_t26.png). A light board on a faint grid with the Miro AI
// side panel pinned to its right (header 'Image', the intro copy, the user's request, then the reply line 'Here's N images based on
// your specifications:' over ONE result row). Sending the request puts a lavender (#E9EBF1) 'Image' frame on the canvas that reads,
// centred in grey, 'Hang tight, this might take a minute', with a small white pill 'Generating' and a red 'Stop' above it; in the panel
// the result row reads 'Generating...' beside a spinner with a 'View on canvas' link. There is no percentage, bar or shimmer. When the
// renders are done the frame is filled with them, the pill is swapped for 'Discard all' / 'Add to canvas' and the row relabels
// 'Artifact v1'.
// Adapted to ten images: the footage's four renders (2x2) become ten (4 + 4 + 2) landing one at a time in reading order inside the
// frame, each in its own blank lavender slot; the 'Hang tight' line gives way to the slot block when the first render is about to land
// (the footage swaps the whole frame at once), and the reply line reads 'Here's 10 images'. Omitted: the browser chrome, the install
// banner, the board title, the Share/Present row and the left tool rail. The footage's pictures are never reproduced: every image is
// our own meme, and no logo, wordmark or platform font is drawn (plain shapes, system type).
import { seg, press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-mai';
const ROOT_H = 400, PANEL_W = 214, COLS = 4, GAP = 6;
const CSS = `
.${P} { box-sizing: border-box; display: flex; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 12px; background-color: #f4f4f6; background-image: linear-gradient(#e8e9ee 1px, transparent 1px), linear-gradient(90deg, #e8e9ee 1px, transparent 1px); background-size: 16px 16px; color: #1a1a2e; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #dcdde4; }
.${P}-cv { position: relative; flex: 1; min-width: 0; }
.${P}-bar { position: absolute; left: 50%; top: 16px; display: flex; align-items: center; justify-content: center; gap: 8px; box-sizing: border-box; height: 26px; padding: 0 6px 0 10px; border-radius: 6px; background: #ffffff; box-shadow: 0 1px 4px rgba(34, 36, 48, .18); transform: translateX(-50%); font-size: 8px; font-weight: 600; white-space: nowrap; }
.${P}-stop { display: flex; align-items: center; gap: 3px; box-sizing: border-box; height: 18px; padding: 0 6px; border-radius: 4px; box-shadow: inset 0 0 0 1px #d0455f; font-size: 7.5px; font-weight: 500; color: #c8344d; }
.${P}-stop i { display: block; width: 6px; height: 6px; border-radius: 50%; box-shadow: inset 0 0 0 1.2px #c8344d; }
.${P}-discard { font-size: 7.5px; font-weight: 500; color: #3a3d52; }
.${P}-add { display: flex; align-items: center; box-sizing: border-box; height: 18px; padding: 0 7px; border-radius: 4px; background: #3859ff; font-size: 7.5px; font-weight: 500; color: #ffffff; }
.${P}-fr { position: absolute; left: 14px; right: 14px; top: 52px; bottom: 44px; box-sizing: border-box; border-radius: 3px; background: #e9ebf1; box-shadow: inset 0 0 0 1.5px #5a63f2; }
.${P}-chip { position: absolute; left: 6px; top: 6px; display: flex; align-items: center; gap: 3px; box-sizing: border-box; height: 15px; padding: 0 6px; border-radius: 8px; background: #ffffff; box-shadow: inset 0 0 0 1px #b26df0; font-size: 7.5px; font-weight: 500; color: #2a2a40; z-index: 2; }
.${P}-chip b { font-size: 7px; font-weight: 400; color: #b26df0; }
.${P}-hang { position: absolute; left: 0; right: 0; top: 50%; margin-top: -6px; text-align: center; font-size: 8.5px; line-height: 12px; color: #6b6f85; }
.${P}-g { position: absolute; left: 8px; right: 8px; top: 24px; bottom: 8px; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); grid-auto-rows: min-content; align-content: center; gap: ${GAP}px; }
.${P}-t { position: relative; aspect-ratio: 870 / 1024; border-radius: 2px; overflow: hidden; background: #e1e4ee; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; background: #e1e4ee; }
.${P}-zoom { position: absolute; left: 50%; bottom: 10px; display: flex; align-items: center; gap: 12px; box-sizing: border-box; height: 24px; padding: 0 12px; border-radius: 6px; background: #ffffff; box-shadow: 0 1px 4px rgba(34, 36, 48, .18); transform: translateX(-50%); font-size: 8px; color: #3a3d52; white-space: nowrap; }
.${P}-zoom span { font-size: 11px; line-height: 11px; color: #5a5e75; }
.${P}-pn { flex: none; box-sizing: border-box; display: flex; flex-direction: column; width: ${PANEL_W}px; margin: 10px 10px 10px 0; padding: 10px 10px 10px; border-radius: 8px; background: #ffffff; box-shadow: 0 1px 6px rgba(34, 36, 48, .16); }
.${P}-hd { flex: none; display: flex; align-items: center; justify-content: space-between; height: 18px; font-size: 9px; font-weight: 600; color: #1a1a2e; }
.${P}-hd i { font-style: normal; font-size: 10px; font-weight: 400; color: #4a4d63; }
.${P}-msgs { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 8px; padding: 10px 1px 0; overflow: hidden; }
.${P}-ai { display: flex; gap: 6px; font-size: 7px; line-height: 10px; color: #26283c; }
.${P}-ai u { flex: none; display: block; width: 11px; height: 11px; border-radius: 3px; box-shadow: inset 0 0 0 1px #d06bd0; background: #fbeefb; }
.${P}-me { align-self: flex-end; box-sizing: border-box; max-width: 150px; padding: 4px 7px; border-radius: 6px; background: #f1f2fb; font-size: 7.5px; line-height: 10px; color: #26283c; }
.${P}-row { display: flex; align-items: center; gap: 7px; box-sizing: border-box; margin-left: 17px; height: 34px; padding: 0 7px; border-radius: 3px; background: #ffffff; box-shadow: 0 0 0 1px #ececf0; }
.${P}-th { flex: none; display: grid; place-items: center; width: 22px; height: 22px; border-radius: 2px; background: #f1f1f3; }
.${P}-spin { display: block; width: 11px; height: 11px; border-radius: 50%; background: conic-gradient(from 0deg, rgba(26, 26, 46, 0) 0deg, #2a2a40 300deg, rgba(26, 26, 46, 0) 340deg); -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 1.8px), #000 calc(100% - 1.3px)); mask: radial-gradient(farthest-side, transparent calc(100% - 1.8px), #000 calc(100% - 1.3px)); }
.${P}-spark { font-style: normal; font-size: 12px; line-height: 12px; color: #1a1a2e; }
.${P}-rt { display: flex; flex-direction: column; gap: 1px; white-space: nowrap; }
.${P}-rt b { font-size: 8px; font-weight: 600; line-height: 11px; color: #26283c; }
.${P}-rt span { font-size: 7.5px; line-height: 10px; color: #6b6f85; }
.${P}-in { flex: none; display: flex; flex-direction: column; justify-content: space-between; box-sizing: border-box; height: 52px; padding: 7px 8px 6px; border-radius: 6px; background: #f1f1f4; font-size: 8px; line-height: 11px; color: #8a8da2; overflow: hidden; }
.${P}-in b { align-self: flex-end; display: grid; place-items: center; width: 14px; height: 14px; border-radius: 50%; background: #d9dae2; font-size: 9px; font-weight: 400; line-height: 14px; color: #ffffff; }
`;

const PROMPT = 'create a muse holding a handwritten note in a lecture hall, meme style';
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const GEN_AT = 0.06;                              // the cursor presses the composer's send arrow
const ISSUE = 0.16;                               // the frame, the pill and the panel's result row appear
const LAND = Array.from({ length: 10 }, (_, i) => 0.5 + i * 0.1311);   // slot i takes its render (reading order), the last at 1.68
const FADE = 0.06;                                // the blank slot's cover thins away over this long before the render lands
const LEAD = 0.1;                                 // 'Hang tight' gives way to the slot block this long before the first render lands

export default {
  id: 'miro-ai-image',
  label: 'Miro AI (2025)',
  source: {
    platform: "Miro web app, miro.com/app, the Miro AI 'Image' panel and the board's 'Image' frame (desktop browser, light theme; a third-party screen recording, DrewTech Hub on YouTube, 2025-12-15)",
    feature: "light dot-grid board with a lavender 'Image' frame reading 'Hang tight, this might take a minute' (no percentage, bar or shimmer) under a 'Generating' pill with a red 'Stop', beside the Miro AI side panel whose result row reads 'Generating...' with a spinner and 'View on canvas', then the renders fill the frame and the row relabels 'Artifact v1' (adapted to 10: a 4 + 4 + 2 block of slots resolving in reading order inside the frame, the reply line reading 'Here's 10 images'; the pill swaps for 'Discard all' / 'Add to canvas' once the last has landed)",
    refs: [{ url: 'https://www.youtube.com/watch?v=jaUOb1D0DFQ', retrieved: '2026-10-14' }],
    extrapolated: [
      "ten images (the footage's four renders, 2x2) as a 4 + 4 + 2 block of slots landing one at a time in reading order (the footage hard-swaps the four at once)",
      "the reply line 'Here's 10 images based on your specifications:' (the footage's reads 'Here's 4 images')",
      "the user's request is our own prompt; the 'Hang tight' line gives way to the blank slot block just before the first render lands",
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'miro-ai-image');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-pend"></div></div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-cv"><div class="${P}-bar" style="display: none"><span>Generating</span><div class="${P}-stop"><i></i>Stop</div></div><div class="${P}-bar ${P}-bar2" style="display: none"><span class="${P}-discard">✕ Discard all</span><div class="${P}-add">✓ Add to canvas</div></div><div class="${P}-fr" style="display: none"><div class="${P}-chip"><b>✦</b>Image</div><div class="${P}-hang">Hang tight, this might take a minute</div><div class="${P}-g" style="visibility: hidden">${tiles.map(cell).join('')}</div></div><div class="${P}-zoom"><span>−</span>88%<span>+</span></div></div><div class="${P}-pn"><div class="${P}-hd">Image<i>✕</i></div><div class="${P}-msgs"><div class="${P}-ai"><u></u><div>In a few words describe the image you'd like to create. If there's any specific details that shouldn't be missed make sure to call them out! You can also select objects on the canvas to add context.</div></div><div class="${P}-me" style="display: none">${x.esc(PROMPT)}</div><div class="${P}-ai ${P}-reply" style="display: none"><u></u><div>Here's 10 images based on your specifications:</div></div><div class="${P}-row" style="display: none"><div class="${P}-th"><i class="${P}-spin"></i><em class="${P}-spark" style="display: none">✦</em></div><div class="${P}-rt"><b>Generating...</b><span>View on canvas</span></div></div></div><div class="${P}-in"><div class="${P}-ph"></div><b>↑</b></div></div></div>`);
    const q = (s) => root.querySelector(`.${P}-${s}`);
    const bar = root.querySelectorAll(`.${P}-bar`)[0], bar2 = q('bar2'), fr = q('fr'), hang = q('hang'), grid = q('g');
    const me = q('me'), reply = q('reply'), row = q('row'), spin = q('spin'), spark = q('spark'), title = row.querySelector('b'), ph = q('ph'), send = q('in').querySelector('b');
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

        // the request sits in the composer, then the send arrow is pressed and the composer empties
        const sent = s >= ISSUE;
        put('ph', sent, (v) => { ph.textContent = v ? 'Enter a response...' : PROMPT; });
        const sp = press(s, GEN_AT, 0.06, 0.06, 0.14);
        put('snd', sp.toFixed(3), () => { send.style.transform = sp > 0 ? `scale(${(1 - 0.12 * sp).toFixed(4)})` : 'none'; });
        put('sndc', sent, (v) => { send.style.background = v ? '#d9dae2' : '#3859ff'; });

        // the panel gains the request, the reply line and the result row; the canvas gains the frame and the pill
        const allIn = s >= LAND[9];
        put('iss', sent, (v) => { const d = v ? '' : 'none'; me.style.display = d; reply.style.display = d; row.style.display = d; fr.style.display = d; });
        put('bar', sent && !allIn, (v) => { bar.style.display = v ? '' : 'none'; });
        put('bar2', allIn, (v) => { bar2.style.display = v ? '' : 'none'; });

        // 'Hang tight' holds the frame until just before the first render lands, then the slot block takes over
        const blocks = s >= LAND[0] - FADE - LEAD;
        put('hang', blocks, (v) => { hang.style.display = v ? 'none' : ''; grid.style.visibility = v ? '' : 'hidden'; });

        // the result row: the spinner turns with t alone; once the last render has landed it relabels 'Artifact v1'
        put('rowd', allIn, (v) => { title.textContent = v ? 'Artifact v1' : 'Generating...'; spin.style.display = v ? 'none' : ''; spark.style.display = v ? '' : 'none'; });
        const deg = (((t * 520) % 360) + 360) % 360;
        put('spin', deg.toFixed(0), (d) => { spin.style.transform = `rotate(${d}deg)`; });

        cells.forEach((c, i) => {
          const a = LAND[i];
          const f = seg(s, a - FADE, a);
          put(`i${i}`, s >= a - FADE, (v) => { c.im.style.visibility = v ? '' : 'hidden'; });
          put(`f${i}`, 1, () => { c.im.style.filter = restFilter(c.g); c.im.style.transform = restTransform(c.g); });
          put(`c${i}`, f.toFixed(3), () => {
            if (f >= 1) { c.pend.style.display = 'none'; c.pend.style.opacity = ''; } else { c.pend.style.display = ''; c.pend.style.opacity = f > 0 ? (1 - f).toFixed(3) : ''; }
          });
        });
      },
    };
  },
};
