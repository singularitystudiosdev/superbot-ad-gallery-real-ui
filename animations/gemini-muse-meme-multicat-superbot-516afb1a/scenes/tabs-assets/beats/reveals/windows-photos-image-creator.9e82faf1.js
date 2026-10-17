// Microsoft Photos (Windows 11), the 'Image Creator' tab: text-to-image on a Copilot+ PC (Microsoft ExpertZone Italia, YouTube
// cHX5dzRG6ZE, 2025-07-18, it-IT UI, clean pending window t=132.3-133.5 s and the filling grid to ~141 s; spec
// .tmp/clone-9e82faf1/reveal-refs/windows-photos-image-creator/spec.json, confidence 0.6; frames wz3_ic_pending_single_t132.4.png,
// wz3_ic_first_result_and_pending_t133.6.png, wz3_ic_grid_and_pending_t136.0.png, wz3_ic_interrompi_zoom_t141.0.png). A dark Photos
// window: a slim left nav with 'Image Creator' selected (lighter pill, violet accent bar), a pane headed by a sparkle glyph and
// 'Image Creator' with an 'Informazioni' link, the prompt field with a violet 'Genera' button, a 'Creatività' slider (80), the style
// tag chips and 'Aggiorna', then the prompt echoed as a blue-to-violet heading above a four-across result grid. Every cell that is
// not finished yet is a flat, rounded, diagonal pastel-gradient tile (rose -> lilac -> periwinkle, a pale bloom upper-middle) with no
// spinner, no text and no logo, its gradient drifting very slowly; a dark pill 'Interrompi generazione' with a stop-square glyph and
// a thin violet-to-blue outline floats over the lower middle of the pane for as long as anything is still pending. Finished
// pictures hard-swap into their cell one at a time: no blur, no low-res preview, no fade.
// Adapted to ten images: the feed holds one pending tile at a time at the end of the finished run (as in the footage: a result,
// then the next gradient tile appended after it), ten cells in a 4 + 4 + 2 block landing in reading order, the pill clearing once
// the tenth has landed. The video states its AI scenes were sped up for illustration, so the timings here are the beat's own.
// Omitted: the window title bar, the 'Foto' app icon, the OneDrive/iCloud entries and the storage upsell in the nav, the account
// and settings chrome and the taskbar. The footage's pictures are never reproduced: every tile is our own meme, and no logo,
// wordmark or platform font is drawn (plain glyphs, system type).
import { seg, press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-wpi';
const ROOT_H = 464, NAV_W = 100, COLS = 4, GAP = 8;
const CSS = `
.${P} { box-sizing: border-box; display: flex; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 10px; background: #24282e; color: #f1f2f4; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #14171b; }
.${P}-nav { flex: none; box-sizing: border-box; display: flex; flex-direction: column; gap: 1px; width: ${NAV_W}px; padding: 10px 6px; background: #1b2127; }
.${P}-ham { flex: none; display: flex; flex-direction: column; gap: 2.5px; width: 9px; margin: 0 0 10px 6px; }
.${P}-ham i { display: block; height: 1.2px; border-radius: 1px; background: #d6d9dd; }
.${P}-ni { position: relative; flex: none; display: flex; align-items: center; gap: 6px; box-sizing: border-box; height: 18px; padding: 0 6px; border-radius: 4px; font-size: 7px; color: #eceef0; white-space: nowrap; }
.${P}-ni b { flex: none; display: block; width: 8px; height: 8px; border-radius: 2px; box-shadow: inset 0 0 0 1.1px #cfd3d8; }
.${P}-ni b.rv-wpi-heart { border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%; background: #eceef0; box-shadow: none; }
.${P}-ni.rv-wpi-sub { padding-left: 18px; }
.${P}-ni em { margin-left: auto; font-style: normal; font-size: 6px; color: #aeb4ba; }
.${P}-ni.rv-wpi-on { background: #2c3239; font-weight: 600; }
.${P}-ni.rv-wpi-on::before { content: ""; position: absolute; left: 0; top: 4px; bottom: 4px; width: 1.6px; border-radius: 1px; background: #877fd0; }
.${P}-gap { flex: none; height: 6px; }
.${P}-main { position: relative; flex: 1; min-width: 0; display: flex; flex-direction: column; box-sizing: border-box; padding: 12px 14px 8px; }
.${P}-hd { flex: none; display: flex; align-items: center; gap: 6px; height: 22px; }
.${P}-hd svg { flex: none; width: 10px; height: 10px; fill: none; stroke: #f1f2f4; stroke-width: 1.4; stroke-linecap: round; stroke-linejoin: round; }
.${P}-hd b { font-size: 11.5px; font-weight: 700; color: #ffffff; white-space: nowrap; }
.${P}-hd span { margin-left: auto; display: flex; align-items: center; gap: 3px; font-size: 6.5px; color: #e4e6e9; white-space: nowrap; }
.${P}-hd span i { display: block; width: 6px; height: 6px; border-radius: 50%; box-shadow: inset 0 0 0 1px #d2d5d9; }
.${P}-pr { flex: none; display: flex; align-items: center; gap: 8px; margin-top: 6px; height: 22px; }
.${P}-fd { flex: 1; min-width: 0; display: flex; align-items: center; box-sizing: border-box; height: 22px; padding: 0 7px; border-radius: 3px 3px 0 0; background: #30343a; box-shadow: inset 0 -1px 0 #9ca0a6; font-size: 7.5px; color: #eceef0; white-space: nowrap; overflow: hidden; }
.${P}-fd span { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.${P}-fd i { flex: none; font-style: normal; font-size: 8px; color: #b8bcc2; }
.${P}-gen { flex: none; display: flex; align-items: center; justify-content: center; gap: 4px; box-sizing: border-box; width: 56px; height: 22px; border-radius: 4px; background: #877fd0; font-size: 7.5px; font-weight: 600; color: #ffffff; white-space: nowrap; }
.${P}-gen svg { width: 8px; height: 8px; fill: #ffffff; }
.${P}-op { flex: none; display: flex; align-items: center; margin-top: 7px; height: 20px; white-space: nowrap; }
.${P}-cr { flex: none; display: flex; align-items: center; gap: 5px; font-size: 7px; color: #eceef0; }
.${P}-cr i { display: block; width: 8px; height: 8px; border-radius: 50%; box-shadow: inset 0 0 0 1.1px #d2d5d9; }
.${P}-trk { position: relative; flex: none; width: 54px; height: 2px; border-radius: 1px; background: #6a6e74; }
.${P}-trk s { position: absolute; left: 0; top: 0; bottom: 0; width: 80%; border-radius: 1px; background: #4cb2f0; text-decoration: none; }
.${P}-trk u { position: absolute; left: 80%; top: -3px; width: 8px; height: 8px; margin-left: -4px; border-radius: 50%; background: #4cb2f0; box-shadow: 0 0 0 1.6px #24282e; }
.${P}-val { flex: none; width: 9px; text-align: right; }
.${P}-sep { flex: none; width: 1px; height: 14px; margin: 0 6px; background: #3b4047; }
.${P}-tg { flex: none; display: flex; gap: 4px; }
.${P}-tg span { box-sizing: border-box; height: 15px; padding: 0 6px; border-radius: 8px; background: #30343a; font-size: 6.5px; line-height: 15px; color: #eceef0; }
.${P}-ag { margin-left: auto; flex: none; display: flex; align-items: center; gap: 4px; box-sizing: border-box; height: 18px; padding: 0 6px; border-radius: 4px; background: #2c3036; font-size: 7px; color: #eceef0; }
.${P}-ag svg { width: 7px; height: 7px; fill: none; stroke: #eceef0; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
.${P}-hp { flex: none; display: flex; align-items: center; margin-top: 11px; height: 14px; }
.${P}-hp b { flex: 1; min-width: 0; font-size: 8px; font-weight: 600; color: #7a86e6; background: linear-gradient(90deg, #4f7fe0 0%, #7f86e6 55%, #c47fdc 100%); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.${P}-hp i { flex: none; font-style: normal; font-size: 10px; line-height: 10px; color: #eceef0; }
.${P}-g { flex: none; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; margin-top: 6px; }
.${P}-t { position: relative; aspect-ratio: 1; border-radius: 7px; overflow: hidden; background: #2b2f35; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; border-radius: 7px; }
.${P}-pill { position: absolute; left: 50%; bottom: 8px; display: flex; align-items: center; gap: 6px; box-sizing: border-box; height: 20px; padding: 0 9px 0 6px; transform: translateX(-50%); border: 1px solid transparent; border-radius: 6px; background: linear-gradient(#3a3b3e, #3a3b3e) padding-box, linear-gradient(90deg, #5b8fe6, #c58ae0) border-box; font-size: 7.5px; color: #e6e6e8; white-space: nowrap; }
.${P}-pill i { display: block; width: 8px; height: 8px; border-radius: 2px; background: #ffffff; }
`;

const PROMPT = 'Un gelato in coppa, composizione semplice, colori pastello';
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const GEN_AT = 0.06;                              // the cursor presses 'Genera'
const ISSUE = 0.14;                               // the prompt heading appears with the first pending tile
const LAND = Array.from({ length: 10 }, (_, i) => 0.5 + i * 0.1311);   // tile i hands its gradient over to the picture (reading order), the last at 1.68
const PILL_OUT = 0.08;                            // the pill clears over this long once the last tile has landed
const SPARK = '<svg viewBox="0 0 16 16"><path d="M6.5 1.5l1.3 3.7 3.7 1.3-3.7 1.3-1.3 3.7-1.3-3.7L1.5 6.5l3.7-1.3zM12.5 9.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/></svg>';
// a pending tile: a diagonal rose -> lilac -> periwinkle gradient with a pale bloom upper-middle, drifting very slowly with t (per-tile phase)
const pendBg = (t, i) => {
  const ph = t * 0.42 + i * 1.3;
  const ang = 135 + 6 * Math.sin(ph);
  const bx = 50 + 9 * Math.sin(ph * 0.8 + 1), by = 16 + 5 * Math.cos(ph * 0.7);
  const m = 4 * Math.sin(ph * 0.6);
  return `radial-gradient(circle at ${bx.toFixed(1)}% ${by.toFixed(1)}%, rgba(237, 231, 242, 0.55), rgba(237, 231, 242, 0) 52%), linear-gradient(${ang.toFixed(1)}deg, #d58fc7 0%, #cbaeda ${(34 + m).toFixed(1)}%, #9eafdd ${(62 + m).toFixed(1)}%, #7fa6d9 ${(82 + m).toFixed(1)}%, #5a84cc 100%)`;
};

export default {
  id: 'windows-photos-image-creator',
  label: 'Microsoft Photos Image Creator (2025)',
  source: {
    platform: "Windows 11 Microsoft Photos ('Foto'), the 'Image Creator' tab on a Copilot+ PC (it-IT UI, dark theme; Microsoft ExpertZone Italia on YouTube, 2025-07-18)",
    feature: "left nav with 'Image Creator' selected, a prompt field with a violet 'Genera' button, a 'Creatività' slider (80), style tag chips and 'Aggiorna', the prompt echoed as a blue-to-violet heading over a four-across grid whose unfinished cell is a flat rounded pastel gradient (rose -> lilac -> periwinkle) with no spinner, text or logo and a very slow drift, and a floating dark 'Interrompi generazione' pill with a stop-square glyph and a violet-to-blue outline; finished pictures hard-swap in one at a time (adapted to 10: a 4 + 4 + 2 grid landing in reading order, the pill clearing after the tenth)",
    refs: [{ url: 'https://www.youtube.com/watch?v=cHX5dzRG6ZE', retrieved: '2026-10-14' }],
    extrapolated: "The footage holds one pending tile at a time and cuts away with the pill still up, with ten cells never shown: the ten-cell 4 + 4 + 2 grid, the tenth landing and the pill clearing after it are extrapolated, and the clip's own on-screen note says its AI scenes were sped up for illustration, so the timings here are adapted to the beat (the real latency is not measured). The gradient drift speed is fitted to the measured ~3/255 over 0.6 s; the nav entries are trimmed to the plain ones and the prompt text is ours; the Italian UI strings are the observed ones.",
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'windows-photos-image-creator');
    const cell = (g, i) => `<div class="${P}-t" style="visibility: hidden"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-pend"></div></div>`;
    const ni = (label, cls = '', ico = '<b></b>', end = '') => `<div class="${P}-ni${cls ? ` ${cls}` : ''}">${ico}${label}${end}</div>`;
    const chev = '<em>⌃</em>', chevD = '<em>⌄</em>';
    const root = x.el(`<div class="${P}"><div class="${P}-nav"><div class="${P}-ham"><i></i><i></i><i></i></div>${ni('Raccolta')}${ni('Preferiti', '', `<b class="${P}-heart"></b>`)}${ni('Image Creator', `${P}-on`)}${ni('Nome - Personale', '', '<b></b>', chev)}${ni('Ricordi', `${P}-sub`)}${ni('Immagini', `${P}-sub`, '<b></b>', chevD)}${ni('Questo PC', '', '<b></b>', chev)}${ni('Immagini', `${P}-sub`, '<b></b>', chevD)}</div><div class="${P}-main"><div class="${P}-hd"><svg viewBox="0 0 12 12"><path d="M10.5 6H1.8M5 2.6L1.6 6 5 9.4"/></svg><svg viewBox="0 0 12 12"><rect x="1.2" y="1.8" width="9.6" height="8.4" rx="1.4"/><path d="M1.8 9l3-3 2 2 1.2-1.2 2.2 2.2"/></svg><b>Image Creator</b><span><i></i>Informazioni</span></div><div class="${P}-pr"><div class="${P}-fd"><span>${x.esc(PROMPT)}</span><i>×</i></div><div class="${P}-gen">${SPARK}Genera</div></div><div class="${P}-op"><div class="${P}-cr"><i></i>Creatività<div class="${P}-trk"><s></s><u></u></div><span class="${P}-val">80</span></div><div class="${P}-sep"></div><div class="${P}-tg"><span>Ambient</span><span>Polaroid</span><span>Illuminazione volumetrica</span><span>Malinconica</span></div><div class="${P}-ag">Aggiorna<svg viewBox="0 0 12 12"><path d="M10 4.2A4.3 4.3 0 0 0 2.4 3.6M2 1.6v2.2h2.2M2 7.8a4.3 4.3 0 0 0 7.6.6M10 10.4V8.2H7.8"/></svg></div></div><div class="${P}-hp" style="visibility: hidden"><b>${x.esc(PROMPT)}</b><i>×</i></div><div class="${P}-g">${tiles.map(cell).join('')}</div><div class="${P}-pill" style="display: none"><i></i>Interrompi generazione</div></div></div>`);
    const gen = root.querySelector(`.${P}-gen`), hp = root.querySelector(`.${P}-hp`), pill = root.querySelector(`.${P}-pill`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ n, im: n.querySelector('img'), pend: n.querySelector(`.${P}-pend`), g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // 'Genera' is pressed (it keeps its label and colour)
        const gp = press(s, GEN_AT, 0.06, 0.06, 0.14);
        put('go', gp.toFixed(3), () => { gen.style.transform = gp > 0 ? `scale(${(1 - 0.05 * gp).toFixed(4)})` : 'none'; });

        // the prompt heading appears with the first pending tile
        put('hp', s >= ISSUE, (v) => { hp.style.visibility = v ? '' : 'hidden'; });

        cells.forEach((c, i) => {
          const a = LAND[i];
          // cell i is appended once the previous tile has landed (cell 0 with the heading): one pending tile at the end of the finished run
          const shown = s >= (i === 0 ? ISSUE : LAND[i - 1]);
          const landed = s >= a;
          put(`n${i}`, shown, (v) => { c.n.style.visibility = v ? '' : 'hidden'; });
          put(`i${i}`, landed, (v) => { c.im.style.visibility = v ? '' : 'hidden'; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
          put(`c${i}`, landed, (v) => { c.pend.style.display = v ? 'none' : ''; });
          // the pending gradient drifts with t (its phase differs per tile); a function of t alone, quantised for the memo
          if (!landed) {
            const bg = pendBg(Math.round(t * 20) / 20, i);
            put(`b${i}`, bg, (v) => { c.pend.style.background = v; });
          }
        });

        // 'Interrompi generazione' floats while anything is pending, then clears after the last tile
        const po = seg(s, ISSUE, ISSUE + 0.06) * (1 - seg(s, LAND[9], LAND[9] + PILL_OUT));
        put('pill', po.toFixed(3), () => { pill.style.display = po > 0 ? '' : 'none'; pill.style.opacity = po > 0 && po < 1 ? po.toFixed(3) : ''; });
      },
    };
  },
};
