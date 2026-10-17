// Google Photos 'Remix' (the generative Create action) as it appears in the Google Photos Android app (YouTube mRi5EVprl2Y,
// published 2025-12-18, t~74.8-77.0 s; spec .tmp/clone-9e82faf1/reveal-refs/google-photos-create/spec.json, confidence 0.60; frames
// v_gp_02_improving-quality.png, v_gp_03_generating.png, v_gp_04_result.png). After a style is chosen and Create is tapped, a full-screen
// near-black overlay shows ONE centred line of light-grey system text, first 'Improving quality...' and then 'Generating...': no
// percentage, no bar, no spinner and no logo. The overlay then lifts onto a dark 'Remix' screen: a back arrow, the title 'Remix' over the
// line 'Results may be unexpected', the finished picture, and Save / Share actions.
// Adapted to ten images: the overlay (both lines) plays first, then the Remix screen shows ten result tiles in a 5 x 2 grid, each a plain
// dark placeholder until its picture lands, strictly in reading order (the real app shows a single result; the ten-tile grid and the timing
// are extrapolated). Omitted: the Android status and navigation bars, the style-picker screen before the overlay, and the Google Photos
// pinwheel and wordmark burned into the corner of the footage. Every tile is our own meme; no logo, wordmark or platform font is drawn.
import { seg } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-gpc';
const ROOT_H = 404, COLS = 5, GAP = 8;
const CSS = `
.${P} { position: relative; box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 14px; background: #121217; color: #e8eaed; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #24242c; }
.${P}-hd { flex: none; display: flex; align-items: center; gap: 14px; height: 64px; padding: 0 18px; }
.${P}-hd svg { flex: none; width: 20px; height: 20px; fill: none; stroke: #e8eaed; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.${P}-hd b { display: block; font-size: 19px; font-weight: 500; line-height: 22px; color: #f1f3f4; }
.${P}-hd span { display: block; margin-top: 1px; font-size: 12px; line-height: 15px; color: #c4c7cd; }
.${P}-g { flex: none; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; margin: 6px 16px 0; }
.${P}-t { position: relative; aspect-ratio: 4 / 5; border-radius: 10px; overflow: hidden; background: #1d1d24; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; background: #1d1d24; }
.${P}-ft { flex: none; display: flex; justify-content: center; gap: 12px; margin-top: auto; padding: 0 0 18px; }
.${P}-ft span { display: grid; place-items: center; box-sizing: border-box; height: 34px; padding: 0 22px; border-radius: 17px; font-size: 13px; font-weight: 500; color: #c4d4f7; box-shadow: inset 0 0 0 1px #4a4d57; }
.${P}-ft .pri { background: #a8c7fa; color: #062e6f; box-shadow: none; }
.${P}-ov { position: absolute; inset: 0; display: grid; place-items: center; background: #08080a; }
.${P}-ov span { grid-area: 1 / 1; font-size: 16px; font-weight: 400; letter-spacing: .1px; color: #d3d4d8; white-space: nowrap; }
`;

const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const IMPROVE = 0.40;                             // 'Improving quality...' gives way to 'Generating...'
const LIFT0 = 0.80, LIFT1 = 0.88;                 // the overlay lifts off the Remix screen
const LAND = Array.from({ length: 10 }, (_, i) => 0.96 + i * 0.0978);   // tile i's picture lands (reading order), the last at 1.84
const FADE = 0.05;                                // the placeholder thins away over this long before the picture lands

export default {
  id: 'google-photos-create',
  label: 'Google Photos Remix (2025)',
  source: {
    platform: "Google Photos for Android, the 'Remix' generative Create action (hand-held screen recording of a real device on YouTube, 2025-12-18)",
    feature: "full-screen near-black overlay with centred light-grey text 'Improving quality...' then 'Generating...' (no percentage, bar, spinner or logo), then the 'Remix' screen with 'Results may be unexpected' and Save / Share (adapted to 10: after the overlay, ten results fill a 5 x 2 grid in strict reading order; status bars, the style picker and the corner logo are omitted)",
    refs: [{ url: 'https://www.youtube.com/watch?v=mRi5EVprl2Y', retrieved: '2026-10-14' }],
    extrapolated: 'The footage shows one result, not ten: the ten-tile 5 x 2 grid, the plain dark placeholders, the strict one-by-one landing order and every timing (overlay 0-0.4 s of the beat on the first line, to 0.88 s on the second, tiles from 0.96 s to the last at 1.84 s) are our adaptation; Save / Share are drawn static.',
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'google-photos-create');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-pend"></div></div>`;
    const arrow = '<svg viewBox="0 0 24 24"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>';
    const root = x.el(`<div class="${P}"><div class="${P}-hd">${arrow}<div><b>Remix</b><span>Results may be unexpected</span></div></div><div class="${P}-g">${tiles.map(cell).join('')}</div><div class="${P}-ft"><span class="pri">Save</span><span>Share</span></div><div class="${P}-ov"><span>Improving quality...</span><span style="display: none">Generating...</span></div></div>`);
    const ov = root.querySelector(`.${P}-ov`), [l1, l2] = ov.querySelectorAll('span');
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

        // the overlay: first line, second line, then it lifts (a cover layer thinning away, the pictures never faded)
        const second = s >= IMPROVE;
        put('l1', second, (v) => { l1.style.display = v ? 'none' : ''; l2.style.display = v ? '' : 'none'; });
        const lift = seg(s, LIFT0, LIFT1);
        put('ov', lift.toFixed(3), () => {
          if (lift >= 1) { ov.style.display = 'none'; ov.style.opacity = ''; } else { ov.style.display = ''; ov.style.opacity = lift > 0 ? (1 - lift).toFixed(3) : ''; }
        });

        cells.forEach((c, i) => {
          const a = LAND[i];
          const f = seg(s, a - FADE, a);
          put(`i${i}`, s >= a - FADE, (v) => { c.im.style.visibility = v ? '' : 'hidden'; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
          put(`c${i}`, f.toFixed(3), () => {
            if (f >= 1) { c.pend.style.display = 'none'; c.pend.style.opacity = ''; } else { c.pend.style.display = ''; c.pend.style.opacity = f > 0 ? (1 - f).toFixed(3) : ''; }
          });
        });
      },
    };
  },
};
