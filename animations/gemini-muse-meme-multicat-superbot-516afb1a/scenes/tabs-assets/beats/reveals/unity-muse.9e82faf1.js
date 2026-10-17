// Unity Muse's generator window inside the Unity Editor (YouTube uMuF9M9cnoY, 2024-08-02, t=233-240 s, with the cleaner 4-tile grid of
// OPLQR_hquOg and 7wSbGP7LKd4, 2023-10; spec .tmp/clone-9e82faf1/reveal-refs/unity-muse/spec.json, confidence 0.72; frames
// ae_umu_idle_t209, ae_umu_pending_t210, ae_umu_landed_t214, ae_pending_btn_grey_t233, ae_pending_t234, ae_landed_t240, ae_row_spinners,
// ae_btn_idle_zoom, ae_btn_pending_grey_zoom, ae_tile_spinner_zoom). A dark Editor window titled 'New Muse Generator' (renamed to the prompt
// the moment Generate is pressed), with a two-part body: a left column of rounded panels (Generation: an 'Images' field and a blue
// Generate button; Prompt; Negative Prompt; Input Image with 'Color | Shape' and a drag-and-drop zone) and a right 'Generations' pane
// under a search bar and a star filter. Pressing Generate greys the button out, and the Generations pane fills with flat dark
// (#242724) square tiles, each holding ONE bare light-grey arc spinner: no caption, no percentage, no bar. Tiles resolve on their own
// clocks by a hard swap into the finished texture (the footage's blue ceramic set), and the button turns blue again after the last one.
// Adapted to ten images: Images 10, a 4 + 4 + 2 tile block, the ten textures landing one at a time in strict reading order (the arcs
// turn from render(t)). Omitted: the surrounding Editor panels (Hierarchy, Project, Inspector, the menu bar), the 'Unity Muse' tab
// mark and the creator's webcam. The footage's pictures are never reproduced: every tile is our own meme, and no logo, wordmark or
// platform font is drawn (a plain arc, plain squares, system type).
import { press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-umu';
const ROOT_H = 376, LEFT_W = 178, COLS = 4, GAP = 5;
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 4px; background: #2b2b2b; color: #d2d2d2; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #151515; }
.${P}-tt { flex: none; display: flex; align-items: center; gap: 5px; height: 18px; padding: 0 8px; background: #232323; font-size: 7px; color: #cfcfcf; white-space: nowrap; }
.${P}-tt i { flex: none; display: block; width: 6px; height: 6px; border-radius: 1.5px; background: #8a8a8a; }
.${P}-tt s { margin-left: auto; display: flex; gap: 5px; text-decoration: none; }
.${P}-tt s i { width: 5px; height: 5px; border-radius: 0; background: none; box-shadow: inset 0 0 0 1px #7a7a7a; }
.${P}-tb { flex: none; display: flex; align-items: center; gap: 6px; height: 20px; padding: 0 10px; background: #2b2b2b; }
.${P}-tb i { display: block; width: 8px; height: 6px; border-radius: 3px 3px 0 3px; box-shadow: inset 0 0 0 1px #4a4a4a; }
.${P}-body { flex: 1; min-height: 0; display: flex; gap: 6px; padding: 0 6px 6px; }
.${P}-left { flex: none; display: flex; flex-direction: column; gap: 5px; width: ${LEFT_W}px; }
.${P}-pan { flex: none; box-sizing: border-box; padding: 6px 7px 7px; border-radius: 4px; background: #343434; }
.${P}-hd { font-size: 7.5px; font-weight: 700; color: #ececec; }
.${P}-fld { position: relative; display: flex; align-items: center; justify-content: space-between; box-sizing: border-box; height: 14px; margin-top: 5px; padding: 0 5px; border-radius: 3px; background: #262626; font-size: 6.5px; color: #c4c4c4; overflow: hidden; }
.${P}-fld i { position: absolute; left: 0; top: 0; bottom: 0; width: 30%; background: #484848; }
.${P}-fld span, .${P}-fld b { position: relative; font-weight: 400; }
.${P}-go { display: grid; place-items: center; height: 16px; margin-top: 5px; border-radius: 3px; background: #0b84ff; font-size: 7.5px; font-weight: 600; color: #ffffff; }
.${P}-go.${P}-off { background: #464646; color: #7a7a7a; }
.${P}-ta { box-sizing: border-box; height: 44px; margin-top: 5px; padding: 5px 6px; border-radius: 3px; background: #262626; font-size: 7px; line-height: 10px; color: #d6d6d6; overflow: hidden; }
.${P}-ta.${P}-ta-s { height: 34px; }
.${P}-tg { display: flex; gap: 2px; margin-top: 5px; }
.${P}-tg span { box-sizing: border-box; height: 13px; padding: 0 5px; border-radius: 3px; background: #3f3f3f; font-size: 6.5px; line-height: 13px; color: #cfcfcf; }
.${P}-tg .${P}-sel { background: #4a4a4a; color: #ffffff; }
.${P}-dz { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px; box-sizing: border-box; flex: 1; min-height: 0; margin-top: 5px; padding: 0 12px; border-radius: 3px; background: #262626; box-shadow: inset 0 0 0 1px #1c1c1c; font-size: 6.3px; line-height: 9px; text-align: center; color: #a9a9a9; }
.${P}-dz u { display: grid; place-items: center; box-sizing: border-box; height: 13px; padding: 0 6px; border-radius: 3px; background: #4a4a4a; font-size: 7px; text-decoration: none; color: #e0e0e0; }
.${P}-in { flex: 1; min-height: 0; display: flex; flex-direction: column; }
.${P}-right { position: relative; flex: 1; min-width: 0; box-sizing: border-box; display: flex; flex-direction: column; padding: 8px 8px 8px; border-radius: 4px; background: #343434; }
.${P}-gt { flex: none; text-align: center; font-size: 8px; font-weight: 700; color: #ececec; }
.${P}-sr { flex: none; display: flex; align-items: center; gap: 5px; margin-top: 6px; }
.${P}-sb { flex: 1; display: flex; align-items: center; gap: 4px; box-sizing: border-box; height: 15px; padding: 0 6px; border-radius: 3px; background: #2a2a2a; box-shadow: inset 0 0 0 1px #3d3d3d; font-size: 6.5px; color: #8c8c8c; }
.${P}-sb i { display: block; width: 5px; height: 5px; border-radius: 50%; box-shadow: inset 0 0 0 1px #8c8c8c; }
.${P}-st { flex: none; display: block; width: 8px; height: 8px; background: #bdbdbd; clip-path: polygon(50% 0, 62% 36%, 100% 38%, 70% 60%, 80% 100%, 50% 76%, 20% 100%, 30% 60%, 0 38%, 38% 36%); }
.${P}-g { display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; margin-top: 8px; }
.${P}-t { position: relative; aspect-ratio: 1; overflow: hidden; background: #242724; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-c { position: absolute; inset: 0; display: grid; place-items: center; background: #242724; }
.${P}-arc { display: block; box-sizing: border-box; width: 15px; height: 15px; border-radius: 50%; border: 2px solid transparent; border-top-color: #c9c9c9; border-right-color: #c9c9c9; }
`;

const PROMPT = 'blue andalusian ceramic';
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const GEN_AT = 0.06;                              // the cursor presses Generate
const ISSUE = 0.16;                               // the button greys out and the Generations pane fills with ten pending tiles
const LAND = Array.from({ length: 10 }, (_, i) => 0.4 + i * 0.1425);   // tile i swaps its arc for the texture (reading order), the last at 1.68
const DONE = LAND[9] + 0.08;                      // the Generate button turns blue again just after the last tile has landed

export default {
  id: 'unity-muse',
  label: 'Unity Muse (2024)',
  source: {
    platform: "Unity Editor 6 / 2023.3, the docked Unity Muse generator window (Muse Texture and Muse Sprite; desktop screen recordings on YouTube, 2023-10 and 2024-08-02)",
    feature: "dark Editor window: a left column of rounded panels (Generation with an Images field and a blue Generate button, Prompt, Negative Prompt, Input Image) and a 'Generations' pane; Generate greys the button and fills the pane with dark #242724 square tiles each holding one bare unlabelled grey arc spinner (no caption, percentage or bar) which hard-swap to the finished image one by one, the button returning to blue (adapted to 10: a 4 + 4 + 2 tile block landing in reading order)",
    refs: [
      { url: 'https://www.youtube.com/watch?v=uMuF9M9cnoY', retrieved: '2026-10-14' },
      { url: 'https://www.youtube.com/watch?v=OPLQR_hquOg', retrieved: '2026-10-14' },
      { url: 'https://www.youtube.com/watch?v=7wSbGP7LKd4', retrieved: '2026-10-14' },
    ],
    extrapolated: [
      "ten tiles in a 4 + 4 + 2 block (the footage generates four or ten) landing one at a time in strict reading order (the footage resolves them on independent clocks, some out of order)",
      "the window shown on its own, without the surrounding Editor panels, and the 'Generation' name dropdown replaced by a plain 'Images' field (Images 10)",
      "the Generate button returning to blue a beat after the last tile lands (the footage shows it grey while any tile spins and blue once all are done)",
      "the window title swapping from 'New Muse Generator' to the prompt at the press, as in the footage",
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'unity-muse');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-c"><i class="${P}-arc"></i></div></div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-tt"><i></i><b class="${P}-ti" style="font-weight: 400">New Muse Generator</b><s><i></i><i></i></s></div><div class="${P}-tb"><i></i><i></i></div><div class="${P}-body"><div class="${P}-left"><div class="${P}-pan"><div class="${P}-hd">Generation</div><div class="${P}-fld"><i></i><span>Images</span><b>10</b></div><div class="${P}-go">Generate</div></div><div class="${P}-pan"><div class="${P}-hd">Prompt</div><div class="${P}-ta">${x.esc(PROMPT)}</div></div><div class="${P}-pan"><div class="${P}-hd">Negative Prompt</div><div class="${P}-ta ${P}-ta-s"></div></div><div class="${P}-pan ${P}-in"><div class="${P}-hd">Input Image</div><div class="${P}-tg"><span class="${P}-sel">Color</span><span>Shape</span></div><div class="${P}-dz">Drag and Drop or Import an image to guide your generation<u>Import</u></div></div></div><div class="${P}-right"><div class="${P}-gt">Generations</div><div class="${P}-sr"><div class="${P}-sb"><i></i>Search...</div><i class="${P}-st"></i></div><div class="${P}-g" style="visibility: hidden">${tiles.map(cell).join('')}</div></div></div></div>`);
    const go = root.querySelector(`.${P}-go`), ti = root.querySelector(`.${P}-ti`), grid = root.querySelector(`.${P}-g`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), cv: n.querySelector(`.${P}-c`), arc: n.querySelector(`.${P}-arc`), g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // Generate is pressed; from then until the last tile lands it is greyed out (the label never changes)
        const gp = press(s, GEN_AT, 0.06, 0.06, 0.14);
        put('go', gp.toFixed(3), () => { go.style.transform = gp > 0 ? `scale(${(1 - 0.03 * gp).toFixed(4)})` : 'none'; });
        const busy = s >= ISSUE && s < DONE;
        put('busy', busy, (v) => { go.classList.toggle(`${P}-off`, v); });

        // the window renames itself to the prompt and the pane fills with the pending tiles
        const on = s >= ISSUE;
        put('iss', on, (v) => { ti.textContent = v ? PROMPT : 'New Muse Generator'; grid.style.visibility = v ? '' : 'hidden'; });

        cells.forEach((c, i) => {
          const landed = s >= LAND[i];
          put(`i${i}`, landed, (v) => { c.im.style.visibility = v ? '' : 'hidden'; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
          put(`c${i}`, landed, (v) => { c.cv.style.display = v ? 'none' : ''; });
          // the arc turns with t (its phase differs per tile); a function of t alone, and at rest once the tile has landed
          const deg = landed ? 0 : (((t * 430 + i * 53) % 360) + 360) % 360;
          put(`r${i}`, deg.toFixed(0), (d) => { c.arc.style.transform = `rotate(${d}deg)`; });
        });
      },
    };
  },
};
