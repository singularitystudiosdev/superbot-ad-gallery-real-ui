// Collov AI virtual staging, as the collov.ai web app's workspace draws it (YouTube rLErFiXzzJY 'Collov.ai - Best Virtual Staging &
// AI Interior Design', The Web Genius, 2025-08-11, t~72.0-76.0 s; corroborated by the first-party tutorial o3MKOrSGWeY, 2025-03-13,
// whose narrator calls the wait 'about 10-20 seconds'; spec .tmp/clone-9e82faf1/reveal-refs/collov-ai/spec.json, confidence 0.8;
// frames at_collov_tiles_generating_72.0.png, at_collov_generating_full_73.2.png, at_collov_resolved_74.0.png). A dark warm-grey app
// shell: a 'Start Over' back control, a large canvas on the left holding the uploaded room photo (a 'Type here for instant edits...'
// pill top-right, a 'Living Room | Farmhouse' pill bottom-centre) and a narrow right-hand rail of designs under a timestamp line. When
// the run starts every tile of the rail shows a dim, featureless ghost of the room with a tiny white dot, the dark pill 'Virtual
// Staging' top-left and, centred, the bold two-line status 'Generating More Design' over the dimmer '(10-20 seconds)'. A moment before
// its picture arrives the same tile reads 'Loading Image', and then the staged room hard-swaps in. There is no percentage, no bar and
// no shimmer on the staging tiles (the footage's 'Space Clearing NN%' belongs to the separate Clear-space operation and is left out).
// Adapted to ten images: one rail of 2 x 5 tiles that go pending together and land one after another in reading order (the pictures
// are our own memes, never the footage's rooms); the first tile to land is the selected one and carries the light selection border.
// Omitted: the collov.ai wordmark, the promo banner, the navigation, the photo-count pill and every other account / plan chrome, the
// presenter's webcam inset, and the footage's non-staging tiles ('Empty Space', 'Original Image').
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-clv';
const ROOT_H = 426, RAIL_W = 206, COLS = 2, GAP = 6;
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 12px; background: linear-gradient(180deg, #38332f 0%, #262321 55%, #1e1c1b 100%); color: #f2f0ee; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #2d2a27; }
.${P}-top { flex: none; display: flex; align-items: center; gap: 5px; height: 28px; padding: 0 12px; font-size: 8px; font-weight: 600; color: #f6f4f2; }
.${P}-top svg { width: 9px; height: 9px; fill: none; stroke: #f6f4f2; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.${P}-body { flex: 1; min-height: 0; display: flex; }
.${P}-cv { position: relative; flex: 1; min-width: 0; margin: 0 6px 10px 10px; border-radius: 4px; overflow: hidden; background: #171514; }
.${P}-cv img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-edit { position: absolute; right: 7px; top: 7px; display: flex; align-items: center; gap: 4px; height: 17px; padding: 0 8px 0 4px; border-radius: 9px; background: rgba(60, 56, 52, .66); font-size: 5.5px; color: rgba(255, 255, 255, .55); white-space: nowrap; }
.${P}-edit i { display: block; width: 8px; height: 8px; border-radius: 50%; background: radial-gradient(circle at 35% 35%, #ff8a9a, #c0243f 70%); }
.${P}-loc { position: absolute; left: 50%; bottom: 8px; transform: translateX(-50%); display: flex; align-items: center; gap: 5px; height: 13px; padding: 0 7px; border-radius: 4px; background: rgba(70, 66, 62, .6); font-size: 6px; color: #eeeae6; white-space: nowrap; }
.${P}-loc b { display: block; width: 1px; height: 7px; background: rgba(255, 255, 255, .7); }
.${P}-rail { flex: none; box-sizing: border-box; display: flex; flex-direction: column; width: ${RAIL_W}px; padding: 0 8px 0 2px; }
.${P}-ts { flex: none; height: 14px; font-size: 6.5px; line-height: 14px; color: rgba(255, 255, 255, .5); }
.${P}-g { flex: none; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; margin-top: 2px; }
.${P}-t { position: relative; aspect-ratio: 4 / 3; border-radius: 4px; overflow: hidden; background: #3a3836; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-cover { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; background: radial-gradient(ellipse 42% 46% at 18% 78%, rgba(36, 36, 38, .8), rgba(36, 36, 38, 0)), radial-gradient(ellipse 36% 30% at 82% 30%, rgba(176, 190, 178, .55), rgba(176, 190, 178, 0)), radial-gradient(ellipse 50% 24% at 70% 90%, rgba(206, 196, 180, .5), rgba(206, 196, 180, 0)), linear-gradient(160deg, #96918c, #77736f 55%, #86827d); }
.${P}-dot { position: absolute; left: 50%; top: 27%; width: 2px; height: 2px; margin-left: -1px; border-radius: 50%; background: #fff; }
.${P}-st { margin-top: 5px; }
.${P}-st b { display: block; font-size: 6px; font-weight: 700; line-height: 9px; color: #fff; white-space: nowrap; }
.${P}-st span { display: block; font-size: 5.5px; line-height: 9px; color: #e4e1de; white-space: nowrap; }
.${P}-pill { position: absolute; left: 4px; top: 4px; display: block; box-sizing: border-box; height: 10px; padding: 0 4px; border-radius: 3px; background: rgba(96, 92, 88, .82); font-size: 5.5px; font-weight: 500; line-height: 10px; color: #fff; white-space: nowrap; }
.${P}-t.${P}-sel { box-shadow: 0 0 0 1px #fff, 0 0 6px 1px rgba(255, 150, 40, .7); }
`;

const REF = 1.84;                                  // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const ISSUE = 0.16;                                // the rail's ten tiles all go pending
const LOAD = 0.2;                                  // 'Loading Image' shows for this long before a tile's picture lands
const LAND = Array.from({ length: 10 }, (_, i) => 0.56 + i * 0.1244);   // tile i hands over to its picture (reading order), the last at 1.68
const BACK = '<svg viewBox="0 0 12 12"><path d="M10 6H2.5"/><path d="M5.5 2.5L2 6l3.5 3.5"/></svg>';

export default {
  id: 'collov-ai',
  label: 'Collov AI virtual staging (2025)',
  source: {
    platform: 'Collov AI virtual staging in the collov.ai web app (desktop browser, dark theme; a tutorial screen recording on YouTube, 2025-08-11, corroborated by the first-party Collov AI tutorial, 2025-03-13)',
    feature: "dark app workspace: a 'Start Over' control, a large canvas holding the uploaded room, and a right-hand rail of design tiles; each pending tile carries the pill 'Virtual Staging' over a dim featureless ghost of the room with a tiny white dot and the centred two-line status 'Generating More Design' / '(10-20 seconds)', then reads 'Loading Image' and hard-swaps to the staged picture (no percentage, bar or shimmer on the staging tiles; the 'Space Clearing NN%' counter of the separate Clear-space operation is left out). Adapted to 10: one 2 x 5 rail landing in reading order; the logo, promo banner, navigation, photo-count pill, account chrome and webcam inset are omitted",
    refs: [
      { url: 'https://www.youtube.com/watch?v=rLErFiXzzJY', id: 'rLErFiXzzJY', published: '2025-08-11', retrieved: '2026-10-14', window: 't=72.0-76.0 s' },
      { url: 'https://www.youtube.com/watch?v=o3MKOrSGWeY', id: 'o3MKOrSGWeY', published: '2025-03-13', retrieved: '2026-10-14', window: 'first-party; narrates the 10-20 second wait at t=105-119 s' },
    ],
    extrapolated: [
      'ten tiles in a 2 x 5 rail landing one after another in strict reading order (the footage shows four tiles landing together)',
      'one rail drawn once (the footage draws the right-hand tile rail twice, at x~1373 and x~1654 of the 1920-wide frame, an unresolved capture quirk), with every tile a Virtual Staging tile',
      "the length of the 'Loading Image' stage per tile and the moment the rail's tiles go pending (the click itself is off-frame)",
      'the first tile to land carrying the selection border (the footage selects the second of four)',
      "the picture on the canvas (the footage shows the staged room's source photo, never reproduced)",
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'collov-ai');
    const csrc = ownSrc(ctx.src, 'collov-ai-room');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-cover"><i class="${P}-dot"></i><div class="${P}-st ${P}-gen"><b>Generating More Design</b><span>(10-20 seconds)</span></div><div class="${P}-st ${P}-ld" style="display: none"><b>Loading Image</b></div></div><span class="${P}-pill">Virtual Staging</span></div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-top">${BACK}Start Over</div><div class="${P}-body"><div class="${P}-cv"><img src="${csrc}" width="870" height="1024" decoding="sync" alt="Uploaded room photo"/><div class="${P}-edit"><i></i>Type here for instant edits...</div><div class="${P}-loc">Living Room<b></b>Farmhouse</div></div><div class="${P}-rail"><div class="${P}-ts">08/11 10:20:57</div><div class="${P}-g" style="visibility: hidden">${tiles.map(cell).join('')}</div></div></div></div>`);
    const grid = root.querySelector(`.${P}-g`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ n, im: n.querySelector('img'), cover: n.querySelector(`.${P}-cover`), gen: n.querySelector(`.${P}-gen`), ld: n.querySelector(`.${P}-ld`), g: tiles[i] }));
    ctx.gate([root.querySelector(`.${P}-cv img`), ...cells.map((c) => c.im)]);

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // the rail's tiles all go pending at once
        put('iss', s >= ISSUE, (v) => { grid.style.visibility = v ? '' : 'hidden'; });

        cells.forEach((c, i) => {
          const a = LAND[i];
          const done = s >= a, loading = !done && s >= a - LOAD;
          // the picture is kept laid out, hidden until its tile lands (the cover sits over it meanwhile)
          put(`i${i}`, done, (v) => { c.im.style.visibility = v ? '' : 'hidden'; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
          put(`c${i}`, done, (v) => { c.cover.style.display = v ? 'none' : ''; });
          put(`g${i}`, !done && !loading, (v) => { c.gen.style.display = v ? '' : 'none'; });
          put(`l${i}`, loading, (v) => { c.ld.style.display = v ? '' : 'none'; });
        });

        // the first tile to land is the selected one
        put('sel', s >= LAND[0], (v) => { cells[0].n.classList.toggle(`${P}-sel`, v); });
      },
    };
  },
};
