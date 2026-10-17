// Pixel Studio on the Pixel 9, as Google's own product clip shows it (the first-party mp4 embedded in Google's Pixel 9 launch post,
// published 2024-08-13, t=5.3-7.8 s; spec .tmp/clone-9e82faf1/reveal-refs/pixel-studio/spec.json, confidence 0.58; frames
// o_px_compose_t5.3, o_px_pending_a/b/c, o_px_land_t7.8, o_px_result_t10.0). A black phone screen: a round back button at the top
// left, a rounded canvas square in the middle and, under it, a dark prompt pill holding the typed prompt, a 'Free style' chip and a
// round create button (a pale periwinkle with a tick in the footage). After create, the canvas is a soft pastel-gradient rounded
// square whose pink / lilac / blue / peach bands keep drifting diagonally: no spinner, percentage or text. About 2 s later the
// finished picture replaces it in one hard swap, and the result screen's action icons and 'Stickers and captions' button appear.
// Adapted to ten images: ten gradient squares in a 5 x 2 block, each swapping to its picture in strict sequence (one at a time, in
// reading order); the bands' offsets are computed from t, each square drifting on its own phase; the result screen's four action
// icons appear once the last picture has swapped in. Omitted: the phone's frame and keyboard, the status-bar glyphs, the 'Stickers
// and captions' button and the style chips. The footage's picture is never reproduced: every square is our own meme; no logo,
// wordmark or platform font is drawn (system type, plain line icons).
import { press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, hash, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-pxs';
const ROOT_H = 440;
const CSS = `
.${P} { position: relative; box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 14px; background: #0f1114; color: #e6e8ec; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #23262b; }
.${P}-sb { flex: none; display: flex; align-items: center; justify-content: space-between; height: 30px; padding: 0 24px; font-size: 11px; color: #e6e8ec; }
.${P}-bar { flex: none; display: flex; align-items: center; gap: 8px; height: 44px; padding: 0 20px; }
.${P}-bk { display: grid; place-items: center; width: 28px; height: 28px; border-radius: 50%; background: #23262b; }
.${P}-bk svg, .${P}-ac i svg { display: block; width: 14px; height: 14px; fill: none; stroke: #e6e8ec; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
.${P}-ac { margin-left: auto; display: flex; gap: 8px; }
.${P}-ac i { display: grid; place-items: center; width: 28px; height: 28px; border-radius: 50%; background: #23262b; }
.${P}-g { flex: none; display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 8px; margin: 12px 28px 0; }
.${P}-t { position: relative; aspect-ratio: 1; border-radius: 16px; overflow: hidden; background: #1a1d21; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-c { position: absolute; inset: 0; border-radius: 16px; }
.${P}-pill { margin: auto 40px 26px; box-sizing: border-box; padding: 14px 18px 12px; border-radius: 22px; background: #202327; }
.${P}-pr { height: 40px; font-size: 14px; line-height: 20px; text-align: center; color: #e6e8ec; overflow: hidden; }
.${P}-row { position: relative; display: flex; align-items: center; justify-content: center; height: 36px; margin-top: 6px; }
.${P}-chip { display: flex; align-items: center; gap: 6px; box-sizing: border-box; height: 32px; padding: 0 14px 0 10px; border-radius: 16px; background: #2f3338; font-size: 12.5px; color: #dcdfe4; white-space: nowrap; }
.${P}-chip svg { display: block; width: 14px; height: 14px; fill: none; stroke: #c4c8ce; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
.${P}-go { position: absolute; right: 0; top: 0; display: grid; place-items: center; width: 36px; height: 36px; border-radius: 50%; background: #b6bcff; }
.${P}-go svg { display: block; width: 16px; height: 16px; fill: none; stroke: #1b1f5a; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
`;

const PROMPT = 'ten study-night Muse memes, a friendly ghost holding a handwritten note';
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const GO_AT = 0.1;                                // the create button is pressed
const ISSUE = 0.24;                               // the canvas fills with ten drifting gradient squares
const LAND = Array.from({ length: 10 }, (_, i) => 0.46 + i * 0.1489);   // square i swaps to its picture (reading order), the last at 1.80
const COL = ['#F2B7D6', '#C9A7F0', '#8FB8F2', '#F5D3B0'];   // the bands, as drawn in the footage
const PERIOD = 150;                               // px: one full pink-lilac-blue-peach cycle along the diagonal
const SPEED = 38;                                 // px per second the bands drift
const band = (ph) => {
  const stops = COL.map((c, j) => `${c} ${(PERIOD * j / 4 - ph).toFixed(1)}px`);
  stops.push(`${COL[0]} ${(PERIOD - ph).toFixed(1)}px`);
  return `repeating-linear-gradient(${135}deg, ${stops.join(', ')})`;
};

export default {
  id: 'pixel-studio',
  label: 'Pixel Studio (Pixel 9)',
  source: {
    platform: "Pixel Studio on the Pixel 9 (Android, dark phone UI), as shown in Google's own product clip in the Pixel 9 launch post, 2024-08-13",
    feature: "black phone screen: a round back button, a rounded canvas square, a prompt pill holding the prompt, a 'Free style' chip and a round create button; after create the canvas is a soft pastel gradient rounded square (pink / lilac / blue / peach bands drifting diagonally, no spinner, percentage or text) that hard-swaps to the finished picture (adapted to 10: ten gradient squares in a 5 x 2 block, each swapping to its picture in strict sequence; the band offsets are computed from t; the phone frame, keyboard and 'Stickers and captions' button are omitted; no Google mark is drawn)",
    refs: [
      { url: 'https://blog.google/products/pixel/google-pixel-9-pro-xl/', retrieved: '2026-10-14' },
      { url: 'https://storage.googleapis.com/gweb-uniblog-publish-prod/original_videos/MBG_TextToImage_240730_sized_for_kw_xQTMuqu.mp4', retrieved: '2026-10-14' },
    ],
    extrapolated: ['the ten-square block (the clip shows one canvas)', 'the 5 x 2 layout across a wider-than-phone screen', 'the prompt wording'],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'pixel-studio');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="transform-origin: ${g.origin}"/><div class="${P}-c"></div></div>`;
    const back = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M13 8H3.5M7.6 3.6 3.2 8l4.4 4.4"/></svg>';
    const tick = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.4 8.6 6.6 11.8l6-7"/></svg>';
    const style = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 2.6h6l1.2 10.8H3.8zM6.6 5.4h2.8"/></svg>';
    const copy = '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="5" y="2.6" width="8" height="9.6" rx="1.4"/><path d="M3 5v8h6"/></svg>';
    const share = '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="4" cy="8" r="1.6"/><circle cx="12" cy="3.8" r="1.6"/><circle cx="12" cy="12.2" r="1.6"/><path d="M5.5 7.2l5-2.6M5.5 8.8l5 2.6"/></svg>';
    const save = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2.4v7.2M4.8 6.8 8 10l3.2-3.2M3 13h10"/></svg>';
    const bin = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 4.4h10M6.2 4.4V2.8h3.6v1.6M4.4 4.4l.6 8.6h6l.6-8.6"/></svg>';
    const root = x.el(`<div class="${P}"><div class="${P}-sb"><span>9:30</span><span>5G</span></div><div class="${P}-bar"><div class="${P}-bk">${back}</div><div class="${P}-ac" style="visibility: hidden"><i>${copy}</i><i>${share}</i><i>${save}</i><i>${bin}</i></div></div><div class="${P}-g" style="visibility: hidden">${tiles.map(cell).join('')}</div><div class="${P}-pill"><div class="${P}-pr">${x.esc(PROMPT)}</div><div class="${P}-row"><div class="${P}-chip">${style}Free style</div><div class="${P}-go">${tick}</div></div></div></div>`);
    const q = (s) => root.querySelector(`.${P}-${s}`);
    const go = q('go'), grid = q('g'), acts = q('ac');
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), cov: n.querySelector(`.${P}-c`), g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        const gp = press(s, GO_AT, 0.06, 0.06, 0.14);
        put('go', gp.toFixed(3), () => { go.style.transform = gp > 0 ? `scale(${(1 - 0.1 * gp).toFixed(4)})` : 'none'; });
        put('iss', s >= ISSUE, (v) => { grid.style.visibility = v ? '' : 'hidden'; });

        cells.forEach((c, i) => {
          const landed = s >= LAND[i];
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
          // pending: the bands drift along the diagonal, each square on its own phase (a function of t alone); landed: a hard swap
          const ph = (((t * SPEED + hash(7, i) * PERIOD) % PERIOD) + PERIOD) % PERIOD;
          const bg = landed ? '' : band(Math.round(ph * 2) / 2);
          put(`c${i}`, landed ? 'x' : bg, () => { c.cov.style.display = landed ? 'none' : ''; c.cov.style.background = bg; });
        });

        // the result screen's action icons come once the last picture is in
        put('act', s >= LAND[9], (v) => { acts.style.visibility = v ? '' : 'hidden'; });
      },
    };
  },
};
