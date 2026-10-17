// Ideogram's own iOS app, light mode, the 2025 build (a screen recording of the App Store install and first run, t~92-104 s; a second,
// dark 2026 build was also captured and is not the one drawn; spec .tmp/clone-9e82faf1/reveal-refs/ideogram-mobile/spec.json,
// confidence 0.6; frames w_light_start_t92.2, w_light_queue_t93.5, w_light_magic_t96.5, w_light_pct27_t100.0, w_light_pct67_t102.5,
// w_light_landed_t103.6 and w_light_sequence_sheet). After submit the prompt composer collapses to the 'My Images' feed and the batch's
// placeholder tiles appear at the top of it: FLAT pale lavender-grey rounded squares (#f2eff3) on a #f7f5f9 page with nothing drawn
// inside them, no spinner, no glyph, no bar. ONE white chip is pinned over the first tile's top-left corner and steps its label in place,
// 'Starting...', 'Waiting in the slow queue...', 'Getting Magic Prompt...', then 'NN% complete' (27, 67 and 99 observed); the pictures
// then hard-swap in (no blur, no preview pass) while the chip still reads '99% complete', and the chip clears. There is no 'Wait <N>s'
// chip and no per-tile caption strip, which is what tells this from the web app's dark feed.
// Adapted to ten images: the feed shows ten square tiles four wide (the footage's two-wide phone column would hold only four of them
// above the fold), the last wave of the wait (the pictures landing) running one tile at a time in reading order under the '99% complete'
// chip. Omitted: the status bar and 'App Store' return link, the notification badges on the tab bar and the account avatar's
// photograph; the product's logo, wordmark and typeface are not drawn (system type, plain glyphs, our own memes).
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-igm';
const ROOT_H = 500, COLS = 4, GAP = 8;
const CSS = `
.${P} { position: relative; box-sizing: border-box; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 12px; background: #f7f5f9; color: #3a3a3f; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #e6e3ea; }
.${P}-hd { position: absolute; left: 0; right: 0; top: 0; height: 46px; display: flex; align-items: center; gap: 6px; padding: 0 16px; }
.${P}-hd svg { flex: none; width: 17px; height: 17px; fill: none; stroke: #4a4a50; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
.${P}-tab { flex: none; height: 26px; padding: 0 10px; border-radius: 8px; font-size: 13px; line-height: 26px; font-weight: 500; color: #55555c; white-space: nowrap; }
.${P}-tab.${P}-sel { background: #dddce1; color: #1f1f23; }
.${P}-sp { flex: 1; }
.${P}-g { position: absolute; left: 14px; right: 14px; top: 54px; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; }
.${P}-t { position: relative; aspect-ratio: 1; border-radius: 10px; overflow: hidden; background: #f2eff3; box-shadow: inset 0 0 0 1px #ece9ee; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-cv { position: absolute; inset: 0; background: #f2eff3; box-shadow: inset 0 0 0 1px #ece9ee; }
.${P}-chip { position: absolute; left: 22px; top: 62px; box-sizing: border-box; height: 25px; padding: 0 9px; border-radius: 7px; background: #fff; box-shadow: 0 1px 4px rgba(0, 0, 0, .16); font-size: 12px; line-height: 25px; font-weight: 500; color: #3a3a3f; white-space: nowrap; font-variant-numeric: tabular-nums; }
.${P}-bar { position: absolute; left: 0; right: 0; bottom: 0; height: 46px; display: flex; align-items: center; justify-content: space-around; padding: 0 24px; background: #fff; box-shadow: 0 -1px 0 #ece9ee; }
.${P}-bar svg { width: 21px; height: 21px; fill: none; stroke: #1f1f23; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
.${P}-plus { display: grid; place-items: center; width: 40px; height: 40px; margin-top: -4px; border-radius: 50%; background: #1f1f23; }
.${P}-plus svg { width: 17px; height: 17px; stroke: #fff; stroke-width: 2.2; }
.${P}-av { display: grid; place-items: center; width: 24px; height: 24px; border-radius: 50%; background: #8a6a60; font-size: 12px; font-weight: 600; color: #fff; }
`;

const REF = 1.84;                                  // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
// the chip's wording, from the second it takes over (layout seconds); the last reading holds while the pictures land, then the chip clears
const STEPS = [[0.12, 'Starting...'], [0.28, 'Waiting in the slow queue...'], [0.62, 'Getting Magic Prompt...'], [0.88, '27% complete'], [1.14, '67% complete'], [1.34, '99% complete']];
const LAND = Array.from({ length: 10 }, (_, i) => 1.4 + i * 0.0311);   // tile i hard-swaps to its picture (reading order), the last at 1.68
const CLEAR = 1.74;                                // the chip clears

export default {
  id: 'ideogram-mobile',
  label: 'Ideogram iOS (2025)',
  source: {
    platform: "Ideogram's own iOS app 'Ideogram AI - Image Generator' (light mode, the 2025 build; a screen recording of the App Store install and first generation)",
    feature: "after submit the composer collapses to the My Images feed: FLAT pale lavender-grey tiles with nothing inside them (no spinner, glyph, bar or per-tile caption) and ONE white chip over the first tile's corner stepping 'Starting...' -> 'Waiting in the slow queue...' -> 'Getting Magic Prompt...' -> 'NN% complete' (27 / 67 / 99), then the pictures hard-swap in with the chip at '99% complete' and it clears; no 'Wait <N>s' chip, no blur (adapted to 10: a four-wide, three-high grid of square tiles landing one at a time in reading order; the status bar, tab-bar badges and account photo are omitted)",
    refs: [
      { url: 'https://www.youtube.com/watch?v=EoRPinbOiU4', retrieved: '2026-10-14' },
      { url: 'https://www.youtube.com/watch?v=9qt-MMZ-i8I', retrieved: '2026-10-14' },
    ],
    extrapolated: "The footage shows four tiles that hard-swap together when the chip reads '99% complete'; here ten square tiles take that swap one after another in reading order (the last wave of the wait) under the same chip, which clears afterwards. The grid is four wide where the app's phone column is two wide, so all ten sit above the tab bar.",
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'ideogram-mobile');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-cv"></div></div>`;
    const svg = (d) => `<svg viewBox="0 0 24 24">${d}</svg>`;
    const root = x.el(`<div class="${P}"><div class="${P}-hd">${svg('<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>')}<span class="${P}-tab ${P}-sel">My Images</span><span class="${P}-tab">Pinned</span><span class="${P}-tab">Public</span><span class="${P}-tab">Private</span><span class="${P}-sp"></span>${svg('<path d="M4 8h16M4 16h16"/><circle cx="9" cy="8" r="2" fill="#f7f5f9"/><circle cx="15" cy="16" r="2" fill="#f7f5f9"/>')}</div><div class="${P}-g">${tiles.map(cell).join('')}</div><div class="${P}-chip" style="visibility: hidden"></div><div class="${P}-bar">${svg('<circle cx="12" cy="12" r="8.5"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>')}${svg('<rect x="4" y="6" width="16" height="13" rx="2.5"/><path d="M4 16l4.5-4 3.5 3 3-2.5 5 4"/>')}<span class="${P}-plus">${svg('<path d="M12 5v14M5 12h14"/>')}</span>${svg('<path d="M6 16.5V11a6 6 0 0112 0v5.5l1.5 1.5h-15z"/><path d="M10 20.5h4"/>')}<span class="${P}-av">A</span></div></div>`);
    const chip = root.querySelector(`.${P}-chip`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), cv: n.querySelector(`.${P}-cv`), g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // the one batch chip: its label is swapped in place; before the composer has collapsed and after the pictures have landed it is not there
        let step = -1;
        STEPS.forEach(([a], i) => { if (s >= a) step = i; });
        const shown = s < CLEAR ? step : -1;
        put('chip', shown, (v) => {
          chip.style.visibility = v < 0 ? 'hidden' : '';
          if (v >= 0) chip.textContent = STEPS[v][1];
        });

        // the pale tiles are empty until the picture hard-swaps in
        cells.forEach((c, i) => {
          const a = LAND[i];
          const on = s >= a;
          put(`i${i}`, on, (v) => { c.im.style.visibility = v ? '' : 'hidden'; c.cv.style.display = v ? 'none' : ''; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
        });
      },
    };
  },
};
