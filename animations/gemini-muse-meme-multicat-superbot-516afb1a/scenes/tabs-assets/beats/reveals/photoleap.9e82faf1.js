// Photoleap (2024), Lightricks' mobile editor, the 'Text to Image' result screen (the official Lightricks tutorial on YouTube
// BqEnCuz6RjM, 2024-04-25, t~61.7-65.0 s; spec .tmp/clone-9e82faf1/reveal-refs/photoleap/spec.json, confidence 0.62; frames
// aa_06_gen_click.png, aa_03_pending_1of4.png, aa_04_pending_3of4.png, aa_07_result_complete.png, aa_photoleap_sheet.png). A light
// lavender phone screen: round home and info buttons with 'Save' and 'Edit' pills on top, a big square-ish preview, a row of result
// thumbnails, the prompt caption, a row of face avatars and a purple 'Generate' pill at the bottom right. Tapping Generate opens
// the screen EMPTY: the preview and every thumbnail are flat pale-lavender (#EAE2F0) boxes with no shimmer, glyph or text, and one
// thin purple ring spinner is parked where the 'Generate' button was. The preview hard-swaps once to the first picture and the
// thumbnails then fill one by one; when the last has landed the spinner clears and 'Generate' returns.
// Adapted to ten images: the carousel row shows ten thumbnails (the app shows four and appends more on regenerate), the preview
// swapping once to the first picture. Omitted: the '4K' and 'More Like This' badges, the style chips and tiles, the 'Detecting
// faces...' modal, the composer's headline and the faces' photographs (plain tinted circles stand in).
import { press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-plp';
const ROOT_H = 506, COLS = 10, GAP = 5;
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; padding: 0 20px 14px; border-radius: 14px; background: #faf1ff; color: #261d2b; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #e3dbe6; }
.${P}-top { flex: none; display: flex; align-items: center; gap: 8px; height: 50px; }
.${P}-rnd { flex: none; display: grid; place-items: center; width: 26px; height: 26px; border-radius: 50%; background: #fffcff; box-shadow: 0 1px 3px rgba(38, 29, 43, .12); }
.${P}-rnd svg { display: block; width: 12px; height: 12px; fill: none; stroke: #261d2b; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
.${P}-sp { flex: 1; }
.${P}-pill { flex: none; display: flex; align-items: center; gap: 4px; box-sizing: border-box; height: 26px; padding: 0 11px; border-radius: 13px; background: #fffcff; box-shadow: 0 1px 3px rgba(38, 29, 43, .12); font-size: 10px; font-weight: 600; color: #261d2b; white-space: nowrap; }
.${P}-pill svg { display: block; width: 9px; height: 9px; fill: none; stroke: #261d2b; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
.${P}-pv { flex: none; position: relative; align-self: center; width: 248px; height: 288px; border-radius: 14px; background: #eae2f0; overflow: hidden; }
.${P}-pv img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-row { flex: none; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; margin-top: 12px; }
.${P}-t { position: relative; aspect-ratio: 1; border-radius: 9px; background: #eae2f0; overflow: hidden; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-cap { flex: none; margin-top: 14px; font-size: 11px; line-height: 15px; color: #261d2b; }
.${P}-foot { flex: none; display: flex; align-items: center; gap: 8px; height: 40px; margin-top: auto; }
.${P}-face { flex: none; display: block; width: 26px; height: 26px; border-radius: 50%; }
.${P}-frame { flex: none; display: grid; place-items: center; width: 26px; height: 26px; border-radius: 50%; background: #efe7f4; }
.${P}-frame i { display: block; width: 10px; height: 10px; border-radius: 3px; box-shadow: inset 0 0 0 1.5px #5c4f66; }
.${P}-slot { flex: none; position: relative; width: 84px; height: 34px; }
.${P}-go { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 4px; border-radius: 17px; background: #9466ff; font-size: 11px; font-weight: 600; color: #fffcff; white-space: nowrap; }
.${P}-go svg { display: block; fill: none; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
.${P}-wait { position: absolute; right: 0; top: 0; width: 34px; height: 34px; border-radius: 50%; background: #f1e9f7; }
.${P}-ring { position: absolute; left: 6px; top: 6px; width: 22px; height: 22px; box-sizing: border-box; border-radius: 50%; border: 2.4px solid rgba(148, 102, 255, .22); border-top-color: #9466ff; border-right-color: #9170fc; }
`;

const CAPTION = 'A muse in a lecture hall holding up a handwritten note, meme style, bright colours';
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const GEN_AT = 0.06;                              // the finger taps 'Generate'
const OPEN = 0.14;                                // the button gives way to the parked ring spinner, every box empty
const LAND = Array.from({ length: 10 }, (_, i) => 0.5 + i * 0.1311);   // thumbnail i fills (reading order), the last at 1.68; the preview swaps once with the first
const DONE = LAND[9];                             // the spinner clears and 'Generate' returns as the last has landed
const ICON = {
  home: '<svg viewBox="0 0 12 12"><path d="M1.8 6L6 2.2 10.2 6M3 5.4v4.1h6V5.4"/></svg>',
  info: '<svg viewBox="0 0 12 12"><circle cx="6" cy="6" r="4.6"/><path d="M6 5.4v3M6 3.6v.1"/></svg>',
  save: '<svg viewBox="0 0 12 12"><path d="M6 1.8v6M3.6 5.8L6 8.2l2.4-2.4M2 10.2h8"/></svg>',
  next: '<svg viewBox="0 0 12 12"><path d="M4.4 2.6L7.8 6 4.4 9.4"/></svg>',
  spark: '<svg viewBox="0 0 12 12" style="width: 10px; height: 10px; stroke: #fffcff"><path d="M6 1.4l1 3.2 3.2 1-3.2 1-1 3.2-1-3.2-3.2-1 3.2-1z"/></svg>',
};

export default {
  id: 'photoleap',
  label: 'Photoleap (2024)',
  source: {
    platform: "Photoleap by Lightricks, the mobile app's 'Text to Image' result screen (iOS, light theme; the official Lightricks tutorial screen recording on YouTube, 2024-04-25)",
    feature: "light lavender phone screen: a big empty pale-lavender preview and empty #EAE2F0 thumbnails, with one thin purple ring spinner parked where the 'Generate' button was (no text, percentage, shimmer or per-tile spinner); the preview swaps once to the first picture and the thumbnails fill one by one, then the spinner clears and 'Generate' returns (adapted to 10: a row of ten thumbnails under the preview)",
    refs: [
      { url: 'https://www.youtube.com/watch?v=BqEnCuz6RjM', retrieved: '2026-10-14' },
    ],
    extrapolated: [
      'ten thumbnails in the carousel row (the footage shows four; the app appends more on regenerate), filling one at a time in reading order',
      'the empty result screen drawn from before the tap, with the Generate button in place (the footage cuts from the composer to the empty result screen)',
      "the thumbnails' size shrunk to fit ten across the 560 px column, and the portrait phone screen reflowed to the landscape card (preview centred, caption and face row under the carousel)",
      "the spinner clearing and 'Generate' returning when the last thumbnail lands (the footage shows it once all four are filled)",
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'photoleap');
    const bigSrc = ownSrc(ctx.src, 'photoleap-big');
    const g0 = tiles[0];
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; filter: ${restFilter(g)}; transform: ${restTransform(g)}; transform-origin: ${g.origin}"/></div>`;
    const face = (a, b) => `<i class="${P}-face" style="background: linear-gradient(140deg, ${a}, ${b})"></i>`;
    const root = x.el(`<div class="${P}"><div class="${P}-top"><i class="${P}-rnd">${ICON.home}</i><i class="${P}-rnd">${ICON.info}</i><i class="${P}-sp"></i><div class="${P}-pill">${ICON.save}Save</div><div class="${P}-pill">Edit${ICON.next}</div></div><div class="${P}-pv"><img src="${bigSrc}" width="870" height="1024" decoding="sync" alt="Muse meme 1, large" style="visibility: hidden; filter: ${restFilter(g0)}; transform: ${restTransform(g0)}; transform-origin: ${g0.origin}"/></div><div class="${P}-row">${tiles.map(cell).join('')}</div><div class="${P}-cap">${x.esc(CAPTION)}</div><div class="${P}-foot">${face('#d9c6e6', '#b79bd0')}${face('#cfd9c2', '#a8b98f')}<i class="${P}-frame"><i></i></i><i class="${P}-sp"></i><div class="${P}-slot"><div class="${P}-go">Generate${ICON.spark}</div><div class="${P}-wait" style="display: none"><i class="${P}-ring"></i></div></div></div></div>`);
    const big = root.querySelector(`.${P}-pv img`), go = root.querySelector(`.${P}-go`), wait = root.querySelector(`.${P}-wait`), ring = root.querySelector(`.${P}-ring`);
    const thumbs = [...root.querySelectorAll(`.${P}-t`)].map((n) => n.querySelector('img'));
    ctx.gate([big, ...thumbs]);

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // the tap on Generate, then the button gives way to the ring spinner parked in its place until the last thumbnail has landed
        const gp = press(s, GEN_AT, 0.06, 0.04, 0.06);
        put('press', gp.toFixed(3), () => { go.style.transform = gp > 0 ? `scale(${(1 - 0.07 * gp).toFixed(4)})` : 'none'; });
        const spin = s >= OPEN && s < DONE;
        put('spin', spin, (v) => { wait.style.display = v ? '' : 'none'; go.style.display = v ? 'none' : ''; });
        const deg = Math.round((((t * 460) % 360) + 360) % 360);
        put('deg', deg, (d) => { ring.style.transform = `rotate(${d}deg)`; });

        // the preview swaps once to the first picture; the boxes fill one by one in reading order, each a hard swap
        put('big', s >= LAND[0], (v) => { big.style.visibility = v ? '' : 'hidden'; });
        thumbs.forEach((im, i) => put(`i${i}`, s >= LAND[i], (v) => { im.style.visibility = v ? '' : 'hidden'; }));
      },
    };
  },
};
