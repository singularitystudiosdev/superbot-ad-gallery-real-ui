// Google Slides, the 'Help me visualize' / 'Create an image' side panel (a macOS Chrome screen recording on YouTube, 'Gemini in Google
// Slides: Hands on with Google Slides AI', published 2025-02-20, t~93-113 s; spec .tmp/clone-9e82faf1/reveal-refs/google-slides-visualize/spec.json,
// confidence 0.68; frames x_gs_t104.8.jpg, x_gs_t107.6.jpg, x_gs_t113.jpg). The Slides editor (a menu row, a toolbar, the slide
// filmstrip, the open slide) with a white rounded 'Create an image' panel docked on the right on a pale blue-grey ground: a title row with
// a close cross, the prompt box, a Square / Wide / Tall segmented control, an 'Adapt to content' row, 'Add a style' and 'Include colors'
// drop-downs and a solid blue 'Create' pill. Pressing it swaps the pill in place for a lighter blue 'Creating...' pill, a two-line caption
// 'Bringing your vision to life!' / 'This could take about 20 seconds.' appears under it and a large soft periwinkle blob pulses in the
// result area (no tile, no spinner, no bar, no percentage); the results then land in the panel's thumbnail grid under a 'View more'
// outline pill, which has replaced the 'Create' pill's place, and the caption and the blob are gone.
// Adapted to ten images: the result area is a block of ten square tiles (5 x 2, the 'Square' format selected rather than the footage's
// 'Wide', which would crop our portrait memes to a band), each one condensing out of the pulsing blob and dissolving into its picture, one
// after another in strict reading order; the pill stays 'Creating...' with its caption until the last has landed and then becomes 'View
// more'. The pulse's phase comes from render(t). Omitted: the 'Inspiration' sample card, the 'Previewing' hover badge, the cursor and the
// footage's deck (a neutral four-band slide stands in). The footage's pictures are never reproduced: every tile is our own meme, and no
// logo, wordmark or platform font is drawn (a plain outlined glyph, plain text in the system stack).
import { seg, press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-gsv';
const ROOT_H = 440, PANEL_W = 300, COLS = 5, GAP = 4;
const BLUE = '#0b57d0', BLOB = '#c7d2f7';
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 10px; background: #f9fbfd; color: #1f1f1f; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #dadce0; }
.${P}-top { flex: none; display: flex; align-items: center; gap: 8px; height: 28px; padding: 0 10px; }
.${P}-doc { flex: none; width: 10px; height: 13px; border-radius: 2px; background: #f4b400; }
.${P}-name { font-size: 10px; font-weight: 500; color: #1f1f1f; white-space: nowrap; }
.${P}-sp { flex: 1; }
.${P}-share { flex: none; display: grid; place-items: center; height: 17px; padding: 0 9px; border-radius: 9px; background: #c2e7ff; font-size: 7.5px; font-weight: 600; color: #001d35; }
.${P}-av { flex: none; width: 15px; height: 15px; border-radius: 50%; background: #7e57c2; }
.${P}-menu { flex: none; display: flex; align-items: center; gap: 11px; height: 14px; padding: 0 12px; font-size: 7px; color: #3c4043; white-space: nowrap; }
.${P}-tb { flex: none; display: flex; align-items: center; gap: 8px; height: 22px; margin: 2px 8px 0; padding: 0 10px; border-radius: 11px; background: #edf2fa; }
.${P}-tb i { display: block; flex: none; width: 8px; height: 8px; border-radius: 2px; box-shadow: inset 0 0 0 1.2px #5f6368; }
.${P}-tb s { flex: none; width: 1px; height: 10px; background: #c7c7c7; }
.${P}-tb em { font-style: normal; flex: none; display: flex; align-items: center; gap: 4px; height: 15px; padding: 0 7px; border-radius: 8px; background: #d3e3fd; font-size: 7px; font-weight: 600; color: #041e49; white-space: nowrap; }
.${P}-tb em i { box-shadow: inset 0 0 0 1.2px #041e49; }
.${P}-body { flex: 1; min-height: 0; display: flex; margin-top: 4px; }
.${P}-fs { flex: none; display: flex; flex-direction: column; gap: 6px; width: 38px; padding: 6px 6px; }
.${P}-fs i { display: block; flex: none; height: 20px; border-radius: 2px; background: #fff; box-shadow: 0 0 0 1px #d3d6da; }
.${P}-fs i.on { box-shadow: 0 0 0 2px #0b57d0; }
.${P}-cv { flex: 1; min-width: 0; display: flex; align-items: flex-start; justify-content: center; padding: 10px 4px 0 2px; }
.${P}-sl { position: relative; width: 100%; aspect-ratio: 16 / 9; overflow: hidden; border-radius: 2px; background: #fff; box-shadow: 0 0 0 1px #dadce0; display: flex; flex-direction: column; }
.${P}-sl i { display: block; flex: 1; }
.${P}-pn { flex: none; box-sizing: border-box; display: flex; flex-direction: column; width: ${PANEL_W}px; margin: 0 6px 6px 0; padding: 8px 10px 6px; border-radius: 12px; background: #edf2fa; box-shadow: 0 1px 3px rgba(60, 64, 67, .25); }
.${P}-ph { flex: none; display: flex; align-items: center; gap: 6px; height: 20px; font-size: 9.5px; font-weight: 500; color: #1f1f1f; }
.${P}-ph i { display: block; width: 10px; height: 9px; border-radius: 2px; box-shadow: inset 0 0 0 1.3px #444746; }
.${P}-x { position: relative; margin-left: auto; width: 9px; height: 9px; }
.${P}-x::before, .${P}-x::after { content: ""; position: absolute; left: 4px; top: -1px; width: 1.2px; height: 11px; background: #444746; transform: rotate(45deg); }
.${P}-x::after { transform: rotate(-45deg); }
.${P}-prompt { flex: none; box-sizing: border-box; margin-top: 5px; height: 44px; padding: 7px 9px; border-radius: 10px; background: #fff; font-size: 8.5px; line-height: 12px; color: #444746; overflow: hidden; }
.${P}-fmt { flex: none; display: flex; gap: 4px; margin-top: 5px; }
.${P}-fmt span { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; height: 32px; border-radius: 8px; background: #fff; font-size: 7.5px; font-weight: 500; color: #1f1f1f; }
.${P}-fmt span i { display: block; box-sizing: border-box; border-radius: 1.5px; box-shadow: inset 0 0 0 1.2px #444746; }
.${P}-fmt .on { background: #c7d7fb; }
.${P}-adapt { flex: none; display: grid; place-items: center; height: 24px; margin-top: 5px; border-radius: 8px; background: #fff; font-size: 8px; font-weight: 500; color: #1f1f1f; }
.${P}-sel { flex: none; display: flex; gap: 5px; margin-top: 5px; }
.${P}-sel span { flex: 1; display: flex; align-items: center; justify-content: space-between; height: 22px; padding: 0 9px; border-radius: 8px; background: #fff; font-size: 8px; font-weight: 500; color: #1f1f1f; white-space: nowrap; }
.${P}-sel span::after { content: ""; width: 0; height: 0; border-left: 3px solid transparent; border-right: 3px solid transparent; border-top: 3.5px solid #444746; }
.${P}-slot { flex: none; display: grid; place-items: center; height: 34px; }
.${P}-btn { display: grid; place-items: center; box-sizing: border-box; min-width: 84px; height: 24px; padding: 0 20px; border-radius: 12px; font-size: 8.5px; font-weight: 500; white-space: nowrap; }
.${P}-cap { flex: none; height: 24px; font-size: 7.5px; line-height: 12px; font-weight: 500; text-align: center; color: #1f1f1f; }
.${P}-res { position: relative; flex: none; height: 108px; margin-top: 4px; }
.${P}-blob { position: absolute; left: 50%; top: 50%; width: 88px; height: 80px; margin: -40px 0 0 -44px; border-radius: 50% 50% 46% 54% / 54% 46% 50% 50%; background: radial-gradient(closest-side, ${BLOB} 55%, rgba(199, 210, 247, 0)); }
.${P}-g { position: absolute; left: 0; right: 0; top: 0; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; }
.${P}-t { position: relative; aspect-ratio: 1; border-radius: 5px; overflow: hidden; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-cov { position: absolute; inset: 0; background: #c7d2f7; }
.${P}-note { flex: none; margin-top: auto; height: 10px; font-size: 6.5px; line-height: 10px; text-align: center; color: #5f6368; white-space: nowrap; }
`;

const PROMPT = 'a muse holding a handwritten note, meme style, bright colours';
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const GEN_AT = 0.06;                              // the cursor presses 'Create'; the pill swaps in place for 'Creating...'
const BLOB_IN = 0.12;                             // the blob swells in over this long after the press
const LAND = Array.from({ length: 10 }, (_, i) => 0.5 + i * 0.1489);   // tile i's picture lands (reading order, strictly one after another), the last at 1.84
const FORM = 0.05;                                // a tile condenses out of the blob over this long, then dissolves to its picture over the same (4 x FORM < the step, so windows never overlap)
const SIZES = [['Square', 8, 8], ['Wide', 11, 7], ['Tall', 7, 11]];

const bands = ['#d98cc2', '#1f8f46', '#9b0f2f', '#2ba6e8'];

export default {
  id: 'google-slides-visualize',
  label: 'Google Slides Help me visualize (2025)',
  source: {
    platform: "Google Slides in desktop Chrome, the 'Create an image' side panel opened from 'Help me create an image' (a macOS screen recording on YouTube, published 2025-02-20; light Material theme)",
    feature: "the blue 'Create' pill swapping in place to 'Creating...' with the caption 'Bringing your vision to life!' / 'This could take about 20 seconds.' and a pulsing periwinkle blob, then the results in the panel's thumbnail grid under a 'View more' pill (adapted to 10: ten square tiles in a 5 x 2 block condensing out of the blob one after another)",
    refs: [{ url: 'https://www.youtube.com/watch?v=wxNq_TMK930', retrieved: '2026-10-14' }],
    extrapolated: "The footage lands four 'Wide' results at once in a 2 x 2 grid: the block of ten square tiles, each one's condense-and-dissolve landing, the strict one-by-one order, the 'Creating...' pill staying until the last tile and every timing (the press at 0.06 s, the first landing at 0.5 s, the last at 1.84 s) are extrapolated. The blob's pulse rate is a guess (the footage's blob fades and pulses without a measurable period).",
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'google-slides-visualize');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-cov" style="opacity: 0"></div></div>`;
    const menu = ['File', 'Edit', 'View', 'Insert', 'Format', 'Slide', 'Arrange', 'Tools', 'Extensions', 'Help'].map((m) => `<span>${m}</span>`).join('');
    const seg3 = SIZES.map(([n, w, h], j) => `<span${j === 0 ? ' class="on"' : ''}><i style="width: ${w}px; height: ${h}px"></i>${n}</span>`).join('');
    const root = x.el(`<div class="${P}"><div class="${P}-top"><span class="${P}-doc"></span><b class="${P}-name">Brand guidelines</b><span class="${P}-sp"></span><span class="${P}-share">Share</span><span class="${P}-av"></span></div><div class="${P}-menu">${menu}</div><div class="${P}-tb"><i></i><i></i><i></i><s></s><i></i><i></i><i></i><s></s><em><i></i>Create an image</em></div><div class="${P}-body"><div class="${P}-fs"><i class="on"></i><i></i><i></i><i></i></div><div class="${P}-cv"><div class="${P}-sl">${bands.map((c) => `<i style="background: ${c}"></i>`).join('')}</div></div><div class="${P}-pn"><div class="${P}-ph"><i></i>Create an image<span class="${P}-x"></span></div><div class="${P}-prompt">${x.esc(PROMPT)}</div><div class="${P}-fmt">${seg3}</div><div class="${P}-adapt">Adapt to content</div><div class="${P}-sel"><span>Add a style</span><span>Include colors</span></div><div class="${P}-slot"><div class="${P}-btn"></div></div><div class="${P}-cap" style="visibility: hidden">Bringing your vision to life!<br/>This could take about 20 seconds.</div><div class="${P}-res"><div class="${P}-blob" style="opacity: 0"></div><div class="${P}-g">${tiles.map(cell).join('')}</div></div><div class="${P}-note">Gemini can make mistakes, including about people, so double-check it.</div></div></div></div>`);
    const q = (s) => root.querySelector(s);
    const btn = q(`.${P}-btn`), cap = q(`.${P}-cap`), blob = q(`.${P}-blob`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), cov: n.querySelector(`.${P}-cov`), g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // the pill: 'Create', swapped in place for 'Creating...' on the press, then 'View more' once every result is in
        const phase = s >= LAND[9] ? 2 : s >= GEN_AT ? 1 : 0;
        const pp = press(s, GEN_AT, 0.06, 0.06, 0.14);
        put('btn', `${phase}|${pp.toFixed(3)}`, () => {
          const scale = pp > 0 ? `scale(${(1 - 0.05 * pp).toFixed(4)})` : 'none';
          btn.style.transform = scale;
          btn.textContent = ['Create', 'Creating...', 'View more'][phase];
          btn.style.background = phase === 0 ? BLUE : phase === 1 ? '#669df6' : 'transparent';
          btn.style.color = phase === 2 ? BLUE : '#fff';
          btn.style.boxShadow = phase === 2 ? 'inset 0 0 0 1px #747775' : 'none';
        });
        put('cap', phase === 1, (on) => { cap.style.visibility = on ? 'visible' : 'hidden'; });

        // the blob swells in after the press, pulses with t, and is gone once the last tile has landed
        const swell = seg(s, GEN_AT, GEN_AT + BLOB_IN);
        const pulse = 0.5 + 0.5 * Math.sin(2 * Math.PI * t * 0.8);
        const bv = phase === 2 ? 'off' : `${(swell * (0.45 + 0.55 * pulse)).toFixed(3)}|${(0.94 + 0.1 * pulse).toFixed(3)}`;
        put('blob', bv, () => {
          if (phase === 2) { blob.style.display = 'none'; blob.style.opacity = '0'; blob.style.transform = 'none'; return; }
          blob.style.display = '';
          blob.style.opacity = (swell * (0.45 + 0.55 * pulse)).toFixed(3);
          blob.style.transform = `scale(${(0.94 + 0.1 * pulse).toFixed(3)})`;
        });

        // each tile condenses out of the blob (periwinkle cover, picture still hidden), then the cover dissolves to the picture
        cells.forEach((c, i) => {
          const a = LAND[i];
          const f1 = seg(s, a - 2 * FORM, a - FORM), f2 = seg(s, a - FORM, a);
          put(`c${i}`, `${f1.toFixed(3)}|${f2.toFixed(3)}|${s >= a ? 1 : 0}`, () => {
            c.im.style.transform = restTransform(c.g);
            c.im.style.filter = restFilter(c.g);
            if (s >= a) {
              c.im.style.visibility = 'visible';
              c.cov.style.display = 'none';
              c.cov.style.opacity = '';
              return;
            }
            c.im.style.visibility = f2 > 0 ? 'visible' : 'hidden';
            c.cov.style.display = '';
            c.cov.style.opacity = (f2 > 0 ? 1 - f2 : f1).toFixed(3);
          });
        });
      },
    };
  },
};
