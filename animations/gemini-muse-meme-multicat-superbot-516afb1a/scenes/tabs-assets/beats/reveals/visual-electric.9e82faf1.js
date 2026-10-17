// Visual Electric's generative canvas (visualelectric.com), from its own channel (YouTube lgwIquIxxGI, 2024-08-06, t~185-196 s and
// GMik_ezLy5U, 2024-08-07, t~313-315 s; spec .tmp/clone-9e82faf1/reveal-refs/visual-electric/spec.json, confidence 0.70; frames
// ab_lgw_189.0s.png, ab_lgw_194.0s.png, ab_gmik_313.2s.png, ab_gmik_313.4s.png, ab_gmik_314.6s.png, ab_gmik_315.0s.png). A light canvas
// (#F0F0F0) under a white toolbar: back arrow, a few tool icons (select highlighted in orange), the composer pill - the prompt, a style
// chip, an aspect chip ('3×4') and an orange lightning Generate button with a caret - and a zoom readout at the right; a contextual rail
// sits on the right (Image / Border / the prompt, then Tools: Art Director with an Instruction box and its own orange button, and the
// greyed Collage, Retouch, Make Variations, Detailed Upscale, Remove Background). Pressing Generate makes the canvas re-fit (the zoom
// readout moves, the content scales to bring the new batch into view) and a row of completely blank cool blue-grey tiles (#B4C2C8) at
// the chosen ratio appears below the source image, framed by an orange selection outline with eight square handles. There is NO text,
// spinner, percentage, bar or shimmer on a tile: each simply fills with its picture (a ~0.4 s fade over the block), left to right,
// until all are filled; the outline stays because the batch is still selected.
// Adapted to ten images: the footage's four tiles become ten, in two rows of five (the batch does not wrap on the real canvas),
// filling in reading order. Omitted: the macOS window chrome, the browser address bar, the Share button and the footage's source
// photograph (a plain tinted block stands in). The footage's pictures are never reproduced: every image is our own meme, and no logo,
// wordmark or platform font is drawn (plain shapes, system type).
import { seg, press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-vel';
const ROOT_H = 384, RAIL_W = 148, COLS = 5, GAP = 6, OR = '#f1602c';
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 12px; background: #f0f0f0; color: #1b2a3a; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #dcdcdc; }
.${P}-top { flex: none; display: flex; align-items: center; gap: 7px; height: 40px; padding: 0 10px; background: #ffffff; box-shadow: 0 1px 0 #e4e4e4; }
.${P}-ic { flex: none; display: grid; place-items: center; width: 20px; height: 20px; border-radius: 6px; font-size: 10px; line-height: 10px; color: #3b4652; }
.${P}-ic.${P}-on { background: #fdeee8; color: ${OR}; }
.${P}-ic svg { display: block; width: 11px; height: 11px; fill: none; stroke: currentColor; stroke-width: 1.4; stroke-linecap: round; stroke-linejoin: round; }
.${P}-pill { flex: 1; min-width: 0; display: flex; align-items: center; gap: 7px; box-sizing: border-box; height: 28px; padding: 0 4px 0 9px; border-radius: 14px; background: #ffffff; box-shadow: 0 0 0 1px #e6e6e6, 0 1px 3px rgba(20, 30, 40, .08); font-size: 8px; color: #1b2a3a; white-space: nowrap; }
.${P}-pr { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.${P}-chip { flex: none; display: flex; align-items: center; gap: 3px; font-size: 7.5px; color: #1b2a3a; }
.${P}-chip i { display: block; width: 7px; height: 7px; border-radius: 50%; box-shadow: inset 0 0 0 1.2px #1b2a3a; }
.${P}-chip i.${P}-rt { width: 8px; height: 6px; border-radius: 1px; }
.${P}-go { flex: none; display: flex; align-items: center; gap: 3px; box-sizing: border-box; height: 20px; padding: 0 7px; border-radius: 10px; background: ${OR}; }
.${P}-go svg { display: block; width: 9px; height: 9px; fill: #ffffff; }
.${P}-go b { display: block; width: 3px; height: 3px; border-right: 1px solid #ffffff; border-bottom: 1px solid #ffffff; transform: rotate(45deg) translate(-1px, -1px); }
.${P}-zm { flex: none; width: 30px; text-align: right; font-size: 8px; color: #3b4652; white-space: nowrap; }
.${P}-body { flex: 1; min-height: 0; display: flex; }
.${P}-cv { position: relative; flex: 1; min-width: 0; overflow: hidden; }
.${P}-wrap { position: absolute; inset: 0; }
.${P}-src { position: absolute; left: 22px; top: 30px; width: 54px; height: 68px; background: linear-gradient(135deg, #e9e9e9 0%, #bcbcbc 45%, #dedede 100%); }
.${P}-grp { position: absolute; left: 22px; top: 116px; right: 22px; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; box-shadow: 0 0 0 1.5px ${OR}; }
.${P}-t { position: relative; aspect-ratio: 3 / 4; overflow: hidden; background: #b4c2c8; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; background: #b4c2c8; }
.${P}-h { position: absolute; width: 5px; height: 5px; box-sizing: border-box; background: #ffffff; box-shadow: inset 0 0 0 1.2px ${OR}; }
.${P}-rail { flex: none; box-sizing: border-box; display: flex; flex-direction: column; gap: 4px; width: ${RAIL_W}px; padding: 8px 8px 0; background: #f9f9f9; box-shadow: -1px 0 0 #e2e2e2; overflow: hidden; }
.${P}-card { flex: none; display: flex; align-items: center; gap: 6px; box-sizing: border-box; height: 18px; padding: 0 7px; border-radius: 6px; background: #f0f1f3; font-size: 7.5px; color: #1b2a3a; white-space: nowrap; overflow: hidden; }
.${P}-card i { flex: none; display: block; width: 7px; height: 7px; border-radius: 1.5px; box-shadow: inset 0 0 0 1.1px ${OR}; }
.${P}-card.${P}-dim { color: #9aa3ab; }
.${P}-card.${P}-dim i { box-shadow: inset 0 0 0 1.1px #aab2b9; }
.${P}-lab { flex: none; margin-top: 4px; font-size: 7.5px; line-height: 10px; color: #1b2a3a; }
.${P}-ins { flex: none; box-sizing: border-box; height: 40px; padding: 5px 6px; border-radius: 6px; background: #ffffff; box-shadow: inset 0 0 0 1px #e4e4e4; font-size: 7px; color: #98a1a9; }
.${P}-bt { flex: none; align-self: flex-end; display: flex; align-items: center; justify-content: center; width: 26px; height: 14px; border-radius: 7px; background: ${OR}; }
.${P}-bt svg { display: block; width: 7px; height: 7px; fill: #ffffff; }
`;

const PROMPT = 'a muse holding a handwritten note';
const BOLT = '<svg viewBox="0 0 12 12"><path d="M7 .5L2 7h3.2L4.6 11.5 10 5H6.8z"/></svg>';
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const GEN_AT = 0.06;                              // the cursor presses the orange Generate button
const ISSUE = 0.16;                               // the canvas re-fits and the blank tiles appear
const FIT = 0.34;                                 // the canvas settles over this long after ISSUE
const LAND = Array.from({ length: 10 }, (_, i) => 0.5 + i * 0.1311);   // tile i fills (reading order), the last at 1.68
const FADE = 0.1;                                 // the blank block's cover thins away over this long before the picture lands
const ZOOM0 = 18, ZOOM1 = 16;                     // the zoom readout moves as the canvas re-fits

export default {
  id: 'visual-electric',
  label: 'Visual Electric (2024)',
  source: {
    platform: 'Visual Electric web app, visualelectric.com, the generative canvas (desktop browser, light theme; first-party screencasts on the official Visual Electric YouTube channel, 2024-08-06 and 2024-08-07)',
    feature: "light canvas under a toolbar with the composer pill (prompt, style chip, aspect chip, orange lightning Generate button) and a contextual right rail: pressing Generate re-fits the canvas and a row of completely blank cool blue-grey tiles appears under the source image inside an orange selection outline with eight handles (no text, spinner, percentage, bar or shimmer), then each tile fills with its picture over ~0.4 s, left to right (adapted to 10: two rows of five tiles filling in reading order)",
    refs: [
      { url: 'https://www.youtube.com/watch?v=lgwIquIxxGI', retrieved: '2026-10-14' },
      { url: 'https://www.youtube.com/watch?v=GMik_ezLy5U', retrieved: '2026-10-14' },
    ],
    extrapolated: [
      "ten tiles as two rows of five inside the selection outline (the footage shows one row of four; the real canvas does not wrap a batch)",
      "the source image above the batch is a plain tinted block, not the footage's photograph",
      "the prompt is our own text; the style chip and the ratio chip carry the footage's kind of label ('Hyperreal', '3×4')",
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'visual-electric');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-pend"></div></div>`;
    const arrow = '<svg viewBox="0 0 12 12"><path d="M2.5 1.5l7 3.5-3 1-1 3z"/></svg>';
    const chev = '<svg viewBox="0 0 12 12"><path d="M7.5 2.5L4 6l3.5 3.5"/></svg>';
    const handles = [[0, 0], [50, 0], [100, 0], [0, 50], [100, 50], [0, 100], [50, 100], [100, 100]].map(([l, tp]) => `<i class="${P}-h" style="left: calc(${l}% - 2.5px); top: calc(${tp}% - 2.5px)"></i>`).join('');
    const root = x.el(`<div class="${P}"><div class="${P}-top"><span class="${P}-ic">${chev}</span><span class="${P}-ic ${P}-on">${arrow}</span><span class="${P}-ic">#</span><span class="${P}-ic">T</span><div class="${P}-pill"><span class="${P}-pr">${x.esc(PROMPT)}</span><span class="${P}-chip"><i></i>Hyperreal</span><span class="${P}-chip"><i class="${P}-rt"></i>3×4</span><div class="${P}-go">${BOLT}<b></b></div></div><span class="${P}-zm">${ZOOM0}%</span></div><div class="${P}-body"><div class="${P}-cv"><div class="${P}-wrap"><div class="${P}-src"></div><div class="${P}-grp" style="visibility: hidden">${tiles.map(cell).join('')}${handles}</div></div></div><div class="${P}-rail"><div class="${P}-card"><i></i>Image</div><div class="${P}-card"><i></i>Border</div><div class="${P}-card"><i></i>${x.esc(PROMPT)}</div><div class="${P}-lab">Tools</div><div class="${P}-card"><i></i>Art Director</div><div class="${P}-lab" style="margin-top: 0">Instruction</div><div class="${P}-ins">Make it daytime</div><div class="${P}-bt">${BOLT}</div><div class="${P}-card ${P}-dim"><i></i>Collage</div><div class="${P}-card ${P}-dim"><i></i>Retouch</div><div class="${P}-card ${P}-dim"><i></i>Make Variations</div><div class="${P}-card ${P}-dim"><i></i>Detailed Upscale</div><div class="${P}-card ${P}-dim"><i></i>Remove Background</div></div></div></div>`);
    const q = (s) => root.querySelector(`.${P}-${s}`);
    const go = q('go'), zm = q('zm'), wrap = q('wrap'), grp = q('grp');
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

        // the orange Generate button is pressed
        const gp = press(s, GEN_AT, 0.06, 0.06, 0.14);
        put('go', gp.toFixed(3), () => { go.style.transform = gp > 0 ? `scale(${(1 - 0.08 * gp).toFixed(4)})` : 'none'; });

        // the canvas re-fits: the batch of blank tiles appears and the content eases in from a closer view, the zoom readout following
        const fit = seg(s, ISSUE, ISSUE + FIT);
        const e = 1 - Math.pow(1 - fit, 3);
        const sc = 1.1 - 0.1 * e;
        put('grp', s >= ISSUE, (v) => { grp.style.visibility = v ? '' : 'hidden'; });
        put('fit', fit >= 1 ? 'rest' : sc.toFixed(4), () => { wrap.style.transformOrigin = '50% 40%'; wrap.style.transform = fit >= 1 ? 'none' : `scale(${sc.toFixed(4)})`; });
        put('zm', Math.round(ZOOM0 + (ZOOM1 - ZOOM0) * e), (v) => { zm.textContent = `${v}%`; });

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
