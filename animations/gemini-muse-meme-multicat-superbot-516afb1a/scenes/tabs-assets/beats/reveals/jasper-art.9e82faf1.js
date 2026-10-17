// Jasper Art, the 'Art' tool of the Jasper AI web app, app.jasper.ai/art (screen recordings of 2022-08-30 and 2022-09-01, t~74.6-75.6 s;
// spec .tmp/clone-9e82faf1/reveal-refs/jasper-art/spec.json, confidence 0.60; frames aa_sheet.png, aa_pending_t75.0.png, aa_button_spinner_t75.0.png,
// aa_pending_chip_t75.0.png). A light two-column tool: on the left 'Edit image description' (a 400-character prompt box, the 'Clear
// input' and 'Have Jasper give me a prompt' links, a purple Generate button, and five 'None' selects), on the right 'Image results' over a
// large blank white card whose empty state is one small grey line. Pressing the button leaves the card blank but for ONE centred
// chip, '⌛ This shouldn't take too long.', while the button's label is replaced by a white spinning arc; there are no tiles, no
// percentage and no bar. The images then pop into the card's grid, the chip clears, and the button gets its label back.
// Adapted to ten images: the footage's 2 x 2 grid becomes a block of 4 + 4 + 2 squares in the same card, popping in one by one in
// reading order. Omitted: the app shell (wordmark, left rail, project panel), the credit and plan chrome, the 'Created by' header and the
// Screenshot button wrapping the footage's results, the beta footer (the footage's pictures are never reproduced: every tile is our own meme).
import { press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-jsa';
const ROOT_H = 392, COLS = 4;
const CSS = `
.${P} { position: relative; box-sizing: border-box; display: flex; gap: 14px; width: 560px; max-width: 100%; height: ${ROOT_H}px; padding: 16px 14px 14px; border-radius: 10px; background: #f7f8fa; color: #1f2430; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #e6e9ee; }
.${P}-l { position: relative; flex: none; display: flex; flex-direction: column; width: 220px; }
.${P}-h { flex: none; height: 14px; font-size: 10px; font-weight: 700; line-height: 14px; color: #1b2030; white-space: nowrap; }
.${P}-cnt { position: absolute; right: 0; top: 14px; font-size: 5.5px; line-height: 8px; color: #8b93a3; }
.${P}-ta { flex: none; box-sizing: border-box; height: 44px; margin-top: 10px; padding: 6px 7px; border-radius: 4px; background: #fff; box-shadow: 0 0 0 1px #e3e6ec; font-size: 7px; line-height: 10px; color: #2a3142; overflow: hidden; }
.${P}-row { flex: none; display: flex; align-items: center; gap: 10px; height: 22px; margin-top: 8px; padding-left: 6px; font-size: 6.5px; color: #98a0ae; white-space: nowrap; }
.${P}-go { position: relative; flex: none; display: grid; place-items: center; box-sizing: border-box; width: 52px; height: 22px; margin-left: auto; border-radius: 7px; background: linear-gradient(90deg, #7b3cf6, #5a2cf0); font-size: 7.5px; font-weight: 600; color: #fff; }
.${P}-go span, .${P}-go i { grid-area: 1 / 1; }
.${P}-spin { display: block; box-sizing: border-box; width: 10px; height: 10px; border-radius: 50%; border: 1.5px solid rgba(255, 255, 255, .3); border-top-color: #fff; }
.${P}-sel { flex: none; margin-top: 9px; }
.${P}-sel b { display: block; height: 9px; font-size: 6.5px; font-weight: 500; line-height: 9px; color: #333b4d; }
.${P}-sel div { display: flex; align-items: center; justify-content: space-between; box-sizing: border-box; height: 19px; margin-top: 2px; padding: 0 7px; border-radius: 3px; background: #fff; box-shadow: 0 0 0 1px #e3e6ec; font-size: 7px; color: #2a3142; }
.${P}-sel svg { width: 7px; height: 7px; fill: none; stroke: #5b6475; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
.${P}-r { position: relative; flex: 1; min-width: 0; display: flex; flex-direction: column; }
.${P}-card { position: relative; flex: 1; min-height: 0; margin-top: 10px; border-radius: 6px; background: #fff; box-shadow: 0 0 0 1px #eceff3; overflow: hidden; }
.${P}-note { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); box-sizing: border-box; width: 112px; padding: 6px 8px; border-radius: 3px; background: #fff; box-shadow: 0 0 0 1px #e6e9ef, 0 2px 6px rgba(30, 40, 60, .08); font-size: 6.5px; line-height: 9px; text-align: center; color: #6b7384; }
.${P}-chip { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); box-sizing: border-box; height: 18px; padding: 0 9px; border-radius: 4px; background: #e9eef5; font-size: 7px; line-height: 18px; color: #4d5566; white-space: nowrap; }
.${P}-g { position: absolute; left: 8px; right: 8px; top: 8px; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: 6px; }
.${P}-t { position: relative; aspect-ratio: 1; border-radius: 5px; overflow: hidden; background: #fff; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; background: #fff; }
.${P}-help { position: absolute; right: 14px; bottom: 12px; display: grid; place-items: center; width: 19px; height: 19px; border-radius: 50%; background: #6a35f4; font-size: 9px; font-weight: 700; color: #fff; }
`;

const PROMPT = 'a muse holding a handwritten note in a lecture hall, meme style, bright colours';
const SELECTS = ['Style', 'Medium', 'Artist/Style', 'Mood', 'Keywords'];
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const GEN_AT = 0.06;                              // the cursor presses the purple button
const ISSUE = 0.14;                               // the card's line gives way to the chip, the button's label to the spinner
const LAND = Array.from({ length: 10 }, (_, i) => 0.6 + i * (REF - 0.6) / 9);   // picture i pops into the grid (reading order), the last at 1.84

export default {
  id: 'jasper-art',
  label: 'Jasper Art (2022)',
  source: {
    platform: 'Jasper AI web app, the Art tool at app.jasper.ai/art (desktop browser, light theme; tutorial screen recordings on YouTube, 2022-08-30 and 2022-09-01)',
    feature: "two-column tool: a description composer with a purple button whose label becomes a white spinning arc, and an 'Image results' card that stays blank white but for one centred chip \"⌛ This shouldn't take too long.\" (no tiles, percentage, bar or blur), the pictures then popping into its grid and the chip clearing (adapted to 10: a 4 + 4 + 2 block popping in reading order; the app shell, credit and plan chrome and the 'Created by' header are omitted)",
    refs: [{ url: 'https://app.jasper.ai/art', retrieved: '2026-10-14' }],
    extrapolated: [
      'ten pictures: the footage shows a 2 x 2 grid of four, so the 4 + 4 + 2 block of small squares and the one-by-one pop-in in reading order are extrapolated (the footage fills the grid in one step)',
      'the wait length: the pending state lasts only ~0.2-0.5 s in the footage (possibly cut), so the 0.6 s before the first picture and the spacing of the landings are the beat window, not a measurement',
      "the button's spinner is held until the last picture has landed (in the 2022-09-01 footage it is still turning while the grid is already filled), and the line 'Input an image description to begin generating images.' is drawn as the card's empty state before the press",
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'jasper-art');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}; transform: ${restTransform(g)}; filter: ${restFilter(g)}"/><div class="${P}-pend"></div></div>`;
    const chev = '<svg viewBox="0 0 12 12"><path d="M3 4.5l3 3 3-3"/></svg>';
    const sel = (n) => `<div class="${P}-sel"><b>${n}</b><div>None${chev}</div></div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-l"><div class="${P}-h">Edit image description</div><div class="${P}-cnt">${PROMPT.length}/400</div><div class="${P}-ta">${x.esc(PROMPT)}</div><div class="${P}-row"><span>× Clear input</span><span>Have Jasper give me a prompt</span><div class="${P}-go"><span>Generate</span><i class="${P}-spin" style="display: none"></i></div></div>${SELECTS.map(sel).join('')}</div><div class="${P}-r"><div class="${P}-h">Image results</div><div class="${P}-card"><div class="${P}-note">Input an image description to begin generating images.</div><div class="${P}-chip" style="display: none">⌛ This shouldn't take too long.</div><div class="${P}-g" style="visibility: hidden">${tiles.map(cell).join('')}</div></div></div><div class="${P}-help">?</div></div>`);
    const go = root.querySelector(`.${P}-go`), label = go.querySelector('span'), spin = go.querySelector(`.${P}-spin`);
    const note = root.querySelector(`.${P}-note`), chip = root.querySelector(`.${P}-chip`), grid = root.querySelector(`.${P}-g`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n) => ({ im: n.querySelector('img'), pend: n.querySelector(`.${P}-pend`) }));
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // the purple button is pressed
        const gp = press(s, GEN_AT, 0.06, 0.06, 0.14);
        put('go', gp.toFixed(3), () => { go.style.transform = gp > 0 ? `scale(${(1 - 0.06 * gp).toFixed(4)})` : 'none'; });

        // the card's empty line gives way to the chip until the first picture pops in
        const busy = s >= ISSUE, first = s >= LAND[0], last = s >= LAND[9];
        put('note', busy, (v) => { note.style.display = v ? 'none' : ''; });
        put('chip', busy && !first, (v) => { chip.style.display = v ? '' : 'none'; });
        put('grid', first, (v) => { grid.style.visibility = v ? '' : 'hidden'; });

        // the button's label is a spinning white arc from the press until the last picture has landed
        const spinning = busy && !last;
        put('lab', spinning, (v) => { label.style.display = v ? 'none' : ''; spin.style.display = v ? '' : 'none'; });
        // the arc turns with t: a function of t alone
        const deg = (((t * 540) % 360) + 360) % 360;
        put('deg', deg.toFixed(0), (d) => { spin.style.transform = `rotate(${d}deg)`; });

        // each picture pops into its slot in one step, never faded
        cells.forEach((c, i) => {
          const v = s >= LAND[i];
          put(`i${i}`, v, (d) => { c.im.style.visibility = d ? '' : 'hidden'; c.pend.style.display = d ? 'none' : ''; });
        });
      },
    };
  },
};
