// Kling's web studio, the 'AI Virtual Try-On' tab (YouTube m18TC9z1mz4, Rob G Green 'Trying on Clothes Virtually in 2025', published
// 2025-01-20, uncut desktop screen recording, t~106.5-111.5 s; spec .tmp/clone-9e82faf1/reveal-refs/kling-try-on/spec.json, confidence 0.7;
// frames as_klingto_setup_t104, as_klingto_pending_t108, as_klingto_pending_t110, as_klingto_generating_zoom, as_klingto_result_t113).
// A different screen from the built 'kling' module (that is the text-to-image batch: a 2x2 block of small tiles with a faint sheen and a
// green bar). Here the page is #0A0C0F with a title row and two tabs ('Text to Image' | 'AI Virtual Try-On' underlined green with a NEW
// badge), a left column of upload cards ('AI Model' | 'AI Outfit' pair, 'Select a Model' with its chips and the uploaded model file,
// 'Upload a Garment Image' with its chips and the garment thumbnail) over a green-to-cyan Generate button, and a wide centre canvas. Pressing
// Generate fills the canvas with large flat tiles (#0E1014, no sheen, no bar, no number), each holding only a small multicolour ring
// spinner and the grey caption 'Generating...'. The finished try-on pictures then drop straight into the tiles, no fade.
// Adapted to ten images: ten tiles in two rows of five, landing one by one in strict reading order. EXTRAPOLATED, not footage: the footage
// has two tiles that both land at once (the clip is sped up in the edit), so the ten staggered landings (0.40 s + 0.1425 s apart in layout
// time, the last at 1.68), the two-row grid and the press timing are ours. The ring turns from render(t) and is clamped at the last landing, so
// the block is frozen once all ten are in. Omitted: the cost suffix the button carries in the footage, the bills row under it, the account
// chip, the subscription and API pills, the Assets rail and the site logo; the pictures in the footage are never reproduced (the model and garment cards
// carry plain swatches, every tile is our own meme) and no wordmark or platform font is drawn.
import { seg, press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-kto';
const ROOT_H = 316, LEFT_W = 142, COLS = 5, GAP = 6;
const GREEN = '#a6f23c';
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 12px; background: #0a0c0f; color: #e3e6e8; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #1b2025; }
.${P}-top { flex: none; display: flex; align-items: center; gap: 8px; height: 28px; padding: 0 10px; }
.${P}-menu { flex: none; display: flex; flex-direction: column; gap: 2.5px; width: 9px; }
.${P}-menu i { display: block; height: 1.2px; border-radius: 1px; background: #cfd4d7; }
.${P}-ttl { flex: none; margin-left: 4px; font-size: 9.5px; font-weight: 600; color: #f3f5f6; white-space: nowrap; }
.${P}-tabs { flex: none; display: flex; align-items: flex-end; gap: 14px; height: 24px; padding: 0 12px; }
.${P}-tabs span { display: flex; align-items: center; gap: 4px; height: 22px; font-size: 10px; font-weight: 500; color: #9aa2a6; white-space: nowrap; }
.${P}-tabs .${P}-on { color: ${GREEN}; box-shadow: 0 1.5px 0 ${GREEN}; }
.${P}-tabs em { font-style: normal; font-size: 5.5px; font-weight: 700; line-height: 8px; padding: 0 3px; border-radius: 3px; background: linear-gradient(90deg, #62f08a, #35d6e8); color: #04221a; }
.${P}-body { flex: 1; min-height: 0; display: flex; }
.${P}-left { flex: none; box-sizing: border-box; display: flex; flex-direction: column; gap: 6px; width: ${LEFT_W}px; padding: 6px 6px 8px 10px; }
.${P}-pair { flex: none; display: flex; gap: 4px; height: 17px; }
.${P}-pair span { flex: 1; display: grid; place-items: center; box-sizing: border-box; border-radius: 5px; background: #12161a; box-shadow: inset 0 0 0 1px #1f262b; font-size: 7px; color: #9aa2a6; }
.${P}-pair .${P}-on { box-shadow: inset 0 0 0 1px ${GREEN}; color: ${GREEN}; background: #0e1410; }
.${P}-card { flex: none; box-sizing: border-box; padding: 7px 8px 8px; border-radius: 7px; background: #0f1317; box-shadow: inset 0 0 0 1px #1a2025; }
.${P}-ch { display: flex; align-items: center; gap: 4px; height: 11px; font-size: 7.5px; font-weight: 600; color: #eef0f1; white-space: nowrap; }
.${P}-ch i { flex: none; width: 7px; height: 7px; border-radius: 50%; box-shadow: inset 0 0 0 1.3px ${GREEN}; }
.${P}-chips { display: flex; gap: 2px; margin-top: 5px; }
.${P}-chips span { display: grid; place-items: center; box-sizing: border-box; min-width: 0; height: 14px; padding: 0 4px; border-radius: 7px; box-shadow: inset 0 0 0 1px #2a3238; font-size: 5.6px; color: #c4cacd; white-space: nowrap; }
.${P}-chips .${P}-on { box-shadow: inset 0 0 0 1px ${GREEN}; color: ${GREEN}; }
.${P}-hint { margin-top: 4px; height: 8px; font-size: 5.2px; line-height: 8px; color: #6b7479; white-space: nowrap; }
.${P}-file { display: flex; align-items: center; gap: 6px; margin-top: 5px; height: 32px; padding: 0 4px; border-radius: 5px; background: #0b0e11; }
.${P}-sw { flex: none; width: 22px; height: 26px; border-radius: 3px; background: linear-gradient(160deg, #3b4650, #232a30); }
.${P}-sw.${P}-gm { background: linear-gradient(160deg, #aeb4b8, #8e959a); }
.${P}-file b { flex: 1; font-size: 6.5px; font-weight: 400; color: #c9cfd2; white-space: nowrap; }
.${P}-file u { flex: none; text-decoration: none; box-sizing: border-box; height: 12px; padding: 0 5px; border-radius: 4px; background: #1b2126; font-size: 6px; line-height: 12px; color: #c4cacd; }
.${P}-go { margin-top: auto; flex: none; display: grid; place-items: center; height: 24px; border-radius: 12px; background: linear-gradient(90deg, #9bf53f, #34dcef); font-size: 9px; font-weight: 700; color: #06231a; }
.${P}-cv { position: relative; flex: 1; min-width: 0; }
.${P}-g { position: absolute; left: 10px; right: 12px; top: 50%; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; transform: translateY(-52%); }
.${P}-t { position: relative; aspect-ratio: 1; border-radius: 8px; overflow: hidden; background: #0e1014; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; background: #0e1014; }
.${P}-ring { display: block; width: 16px; height: 16px; border-radius: 50%; background: conic-gradient(from 0deg, rgba(98, 240, 138, 0) 0deg, #62f08a 40deg, #35b6f0 110deg, #8d6bf6 190deg, #e24bd0 265deg, rgba(226, 75, 208, 0) 330deg); -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 2.6px), #000 calc(100% - 2.1px)); mask: radial-gradient(farthest-side, transparent calc(100% - 2.6px), #000 calc(100% - 2.1px)); }
.${P}-pend span { font-size: 6.2px; color: #8e9296; white-space: nowrap; }
`;

const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const GEN_AT = 0.06;                              // the cursor presses Generate
const ISSUE = 0.16;                               // the empty canvas gives way to the ten pending tiles
const LAND = Array.from({ length: 10 }, (_, i) => 0.4 + i * 0.1425);   // tile i takes its picture (strict reading order), the last at 1.68

export default {
  id: 'kling-try-on',
  label: 'Kling AI Virtual Try-On (2025)',
  source: {
    platform: "Kling AI web studio, 'AI Virtual Try-On' tab (klingai.com, desktop browser, dark theme; an uncut screen-recording tutorial on YouTube, published 2025-01-20)",
    feature: "dark studio on #0A0C0F: the 'AI Virtual Try-On NEW' tab, a left column of upload cards (model + garment) over a green-to-cyan Generate button, and a wide centre canvas of flat #0E1014 tiles each holding only a multicolour ring spinner and 'Generating...' (no sheen, no bar, no number) that take their picture straight in with no fade; the same screen as the built 'kling' module is NOT: that one is a 2x2 block with a green bar (adapted to 10: two rows of five tiles landing in strict reading order; the cost suffix on the button, the account chip, the subscription and API pills and the Assets rail are omitted)",
    refs: [{ url: 'https://www.youtube.com/watch?v=m18TC9z1mz4', retrieved: '2026-10-14' }],
    dates: { published: '2025-01-20', retrieved: '2026-10-14', clip: 't~106.5-111.5 s' },
    extrapolated: [
      'ten tiles in two rows of five (the footage shows two large tiles side by side)',
      'strict reading-order landing of ten tiles, 0.1425 s apart (the footage lands the two tiles together after a sped-up wait)',
      'the Generate button press and the pending duration (the footage edit hides the true wait)',
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'kling-try-on');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-pend"><i class="${P}-ring"></i><span>Generating…</span></div></div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-top"><div class="${P}-menu"><i></i><i></i><i></i></div><b class="${P}-ttl">AI Images</b></div><div class="${P}-tabs"><span>Text to Image</span><span class="${P}-on">AI Virtual Try-On<em>NEW</em></span></div><div class="${P}-body"><div class="${P}-left"><div class="${P}-pair"><span>AI Model</span><span class="${P}-on">AI Outfit</span></div><div class="${P}-card"><div class="${P}-ch"><i></i>Select a Model</div><div class="${P}-chips"><span>AI Model</span><span>Default</span><span class="${P}-on">Upload</span></div><div class="${P}-file"><i class="${P}-sw"></i><b>model.jpg</b></div></div><div class="${P}-card"><div class="${P}-ch"><i></i>Upload a Garment Image</div><div class="${P}-chips"><span class="${P}-on">Single Garment</span><span>Multiple Garments</span></div><div class="${P}-file"><i class="${P}-sw ${P}-gm"></i><b>garment.jpg</b><u>Top ▾</u></div></div><div class="${P}-go">Generate</div></div><div class="${P}-cv"><div class="${P}-g" style="visibility: hidden">${tiles.map(cell).join('')}</div></div></div></div>`);
    const go = root.querySelector(`.${P}-go`), grid = root.querySelector(`.${P}-g`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), pend: n.querySelector(`.${P}-pend`), ring: n.querySelector(`.${P}-ring`) }));
    ctx.gate(cells.map((c) => c.im));
    tiles.forEach((g, i) => { cells[i].im.style.filter = restFilter(g); cells[i].im.style.transform = restTransform(g); });

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
        put('go', gp.toFixed(3), () => { go.style.transform = gp > 0 ? `scale(${(1 - 0.05 * gp).toFixed(4)})` : 'none'; });

        // the empty canvas gives way to the pending tiles
        put('iss', s >= ISSUE, (v) => { grid.style.visibility = v ? '' : 'hidden'; });

        // the rings turn from t and stop with the last landing (every ring is covered by then): a function of the clamped time alone
        const sc = Math.min(s, LAND[9]);
        cells.forEach((c, i) => {
          const landed = s >= LAND[i];
          put(`i${i}`, landed, (v) => { c.im.style.visibility = v ? 'visible' : 'hidden'; c.pend.style.display = v ? 'none' : ''; });
          const deg = (((sc * 520 + i * 47) % 360) + 360) % 360;
          put(`r${i}`, deg.toFixed(0), (d) => { c.ring.style.transform = `rotate(${d}deg)`; });
        });
      },
    };
  },
};
