// Pixelcut AI Art (2023), the Pixelcut phone app's text-to-image generator (iOS, light theme; 'How to generate a picture via the
// AI art feature on Pixelcut?', Just Ask Me, YouTube srt8r4sQHzE, 2023-03-11, t~41-75 s; spec
// .tmp/clone-9e82faf1/reveal-refs/pixelcut/spec.json, confidence 0.58; frames ai2_composer_prompt_41s, ai2_prompt_chips_52s,
// ai2_composer_66s, ai2_pending_69s, ai2_pending_label_69.5s, ai2_pending_71s, ai2_pending_73s, ai2_result_75s). A white screen titled
// 'AI Art': a rounded grey prompt field with a wand glyph and a round clear button, a 'Style' row of thumbnails (None, Picasso picked
// with a blue border and a blue caption, Futuristic, Digital Art, Oil Paint..., Pen), the result area, and a bottom bar with a full-width
// blue 'Generate' pill. Pressing it swaps the pill's label for a small white 8-bar spinner and the result area for flat #F2F2F2
// rounded tiles, each with one centred dark-grey 8-bar radial spinner (the iOS activity indicator, stepping round). There is NO status
// text, percentage or bar (an OCR 'Generating AI Art' is a misread of numerals painted inside the artwork and is never drawn). The
// finished picture then replaces the tile in a hard swap; when it has landed the pill reads 'Regenerate' over a plain 'Save' and a round
// download button sits at the top-right of the result.
// Adapted to ten images: the footage generates ONE result tile, so ten tiles sit in a 5 x 2 block and swap to their pictures one at a
// time in reading order; the pill and the download button wait for the tenth. The portrait phone screen is reflowed to the 560 px
// column. Omitted: the app's logo, the plan badges and prices, the phone status bar and the recorder's touch indicator. The footage's
// pictures are never reproduced: every tile is our own meme, and the style thumbnails are plain colour gradients.
import { press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-pxc';
const ROOT_H = 452, COLS = 5, GAP = 8;
const BLUE = '#007aff';
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; padding: 0 20px; border-radius: 14px; background: #ffffff; color: #111111; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #e6e6e6; }
.${P}-top { flex: none; position: relative; display: flex; align-items: center; justify-content: center; height: 38px; margin: 0 -20px; font-size: 14px; font-weight: 700; box-shadow: 0 1px 0 #ececec; }
.${P}-back { position: absolute; left: 18px; top: 11px; width: 16px; height: 16px; fill: none; stroke: #111111; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.${P}-field { flex: none; display: flex; align-items: center; gap: 10px; box-sizing: border-box; height: 38px; margin-top: 10px; padding: 0 9px 0 11px; border-radius: 10px; background: #f2f2f2; font-size: 13px; color: #1b1b1b; }
.${P}-wand { flex: none; width: 16px; height: 16px; fill: none; stroke: #8a8a8a; stroke-width: 1.4; stroke-linecap: round; stroke-linejoin: round; }
.${P}-txt { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.${P}-clr { flex: none; display: grid; place-items: center; width: 18px; height: 18px; border-radius: 50%; background: #1a1a1a; }
.${P}-clr svg { display: block; width: 8px; height: 8px; stroke: #ffffff; stroke-width: 1.8; stroke-linecap: round; }
.${P}-sth { flex: none; height: 16px; margin-top: 11px; font-size: 12px; font-weight: 700; line-height: 16px; }
.${P}-styles { flex: none; display: flex; gap: 12px; margin-top: 6px; }
.${P}-st { flex: none; width: 76px; display: flex; flex-direction: column; align-items: center; gap: 4px; font-size: 9px; color: #9a9a9a; white-space: nowrap; }
.${P}-st i { position: relative; box-sizing: border-box; display: grid; place-items: center; width: 76px; height: 44px; border-radius: 8px; background: #f2f2f2; }
.${P}-st i svg { display: block; width: 14px; height: 14px; fill: none; stroke: #b0b0b0; stroke-width: 1.4; stroke-linecap: round; }
.${P}-st.${P}-on { color: ${BLUE}; font-weight: 600; }
.${P}-st.${P}-on i { box-shadow: 0 0 0 2px #ffffff, 0 0 0 4px ${BLUE}; }
.${P}-res { position: relative; flex: none; margin-top: 12px; }
.${P}-grid { display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; }
.${P}-t { position: relative; aspect-ratio: 1.3; border-radius: 9px; overflow: hidden; background: #f2f2f2; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; display: grid; place-items: center; background: #f2f2f2; }
.${P}-sp { position: relative; display: block; width: 1em; height: 1em; font-size: 22px; color: #6b6b6b; }
.${P}-sp b { position: absolute; left: 50%; top: 0; width: .11em; height: .27em; margin-left: -.055em; border-radius: .06em; background: currentColor; transform-origin: 50% .5em; }
.${P}-dl { position: absolute; right: 7px; top: 7px; display: grid; place-items: center; width: 24px; height: 24px; border-radius: 50%; background: #ffffff; box-shadow: 0 1px 4px rgba(0, 0, 0, .18); }
.${P}-dl svg { display: block; width: 12px; height: 12px; fill: none; stroke: #111111; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
.${P}-bar { flex: none; margin: auto -20px 0; padding: 10px 20px 8px; display: flex; flex-direction: column; align-items: center; gap: 4px; box-shadow: 0 -1px 0 #ececec; }
.${P}-go { position: relative; width: 100%; box-sizing: border-box; display: grid; place-items: center; height: 40px; border-radius: 20px; background: ${BLUE}; font-size: 14px; font-weight: 600; color: #ffffff; }
.${P}-lab { grid-area: 1 / 1; }
.${P}-wait { grid-area: 1 / 1; font-size: 17px; color: #ffffff; }
.${P}-save { height: 24px; font-size: 13px; font-weight: 700; line-height: 24px; color: #111111; }
`;

const PROMPT = 'A muse in a lecture hall holding up a handwritten note';
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const GEN_AT = 0.06;                              // the finger presses 'Generate'
const ISSUE = 0.16;                               // the label gives way to the white spinner and the result area to the ten grey tiles
const LAND = Array.from({ length: 10 }, (_, i) => 0.4 + i * 0.1425);   // tile i swaps to its picture (reading order), the last at 1.68
const DONE = LAND[9];                             // 'Regenerate' + 'Save' return and the download button lands once the last picture has
const STEPS = 8, RATE = 12;                       // the activity indicator steps one bar RATE times a second
const SPIN = Array.from({ length: STEPS }, (_, k) => `<b style="transform: rotate(${k * 360 / STEPS}deg); opacity: ${(0.25 + 0.75 * (k / (STEPS - 1))).toFixed(2)}"></b>`).join('');
const styleCell = (name, bg, on) => `<div class="${P}-st${on ? ` ${P}-on` : ''}"><i style="background: ${bg}"></i>${name}</div>`;

export default {
  id: 'pixelcut',
  label: 'Pixelcut AI Art (2023)',
  source: {
    platform: "Pixelcut phone app (iOS), the 'AI Art' text-to-image screen, light theme (a phone screen recording on YouTube, 'How to generate a picture via the AI art feature on Pixelcut?', video srt8r4sQHzE, 2023-03-11)",
    feature: "white phone screen: prompt field, Style row and a full-width blue 'Generate' pill; pressing it swaps the pill's label for a white 8-bar spinner and the result area for flat #F2F2F2 rounded tiles each with a centred dark-grey 8-bar radial spinner, no status text, percentage or blur; the picture replaces the tile in a hard swap, then the pill reads 'Regenerate' over 'Save' and a round download button sits on the result (adapted to 10: a 5 x 2 block of tiles swapping in reading order)",
    video: 'srt8r4sQHzE',
    published: '2023-03-11',
    refs: [{ url: 'https://www.youtube.com/watch?v=srt8r4sQHzE', retrieved: '2026-10-14' }],
    extrapolated: [
      'ten result tiles in a 5 x 2 block, swapping to their pictures one at a time in reading order (the footage generates ONE tile, a single swap after ~4.5 s)',
      "the pill's white spinner and the grey tiles' spinners stay until the tenth picture has landed, and 'Regenerate' + 'Save' + the download button return only then (the footage shows them with the one picture)",
      'the empty result area drawn before the press with the Generate pill in place (the footage cuts from the keyboard composer to the grey tile)',
      'the portrait phone screen reflowed to the 560 px column: the style row shown whole, the tiles shrunk to a 5 x 2 block, the single download button placed on the top-right of the block',
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'pixelcut');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; filter: ${restFilter(g)}; transform: ${restTransform(g)}; transform-origin: ${g.origin}"/><div class="${P}-pend"><i class="${P}-sp">${SPIN}</i></div></div>`;
    const none = '<svg viewBox="0 0 14 14"><circle cx="7" cy="7" r="5.4"/><path d="M3.2 10.8l7.6-7.6"/></svg>';
    const root = x.el(`<div class="${P}"><div class="${P}-top"><svg class="${P}-back" viewBox="0 0 16 16"><path d="M10.5 2.5L5 8l5.5 5.5"/></svg>AI Art</div><div class="${P}-field"><svg class="${P}-wand" viewBox="0 0 16 16"><path d="M3 13L10.5 5.5M9 4l3 3M12.5 1.5v2M11.5 2.5h2M14 8v1.4M13.3 8.7h1.4"/></svg><span class="${P}-txt">${x.esc(PROMPT)}</span><i class="${P}-clr"><svg viewBox="0 0 8 8"><path d="M1.5 1.5l5 5M6.5 1.5l-5 5"/></svg></i></div><div class="${P}-sth">Style</div><div class="${P}-styles"><div class="${P}-st"><i>${none}</i>None</div>${styleCell('Picasso', 'linear-gradient(135deg, #ffd23f 0%, #ef476f 45%, #1b6ef3 100%)', true)}${styleCell('Futuristic', 'linear-gradient(160deg, #cdb4e6, #6d3d7e 60%, #3a1d4d)')}${styleCell('Digital Art', 'linear-gradient(160deg, #f6a15b, #c4553b 55%, #2a2638)')}${styleCell('Oil Paint...', 'linear-gradient(150deg, #e9b349, #8a4b17 60%, #2a1507)')}${styleCell('Pen', 'linear-gradient(160deg, #ececec, #a9a9a9 60%, #5c5c5c)')}</div><div class="${P}-res"><div class="${P}-grid" style="visibility: hidden">${tiles.map(cell).join('')}</div><i class="${P}-dl" style="visibility: hidden"><svg viewBox="0 0 12 12"><path d="M6 1.5v6.5M3.2 5.4L6 8.2l2.8-2.8M2 10.5h8"/></svg></i></div><div class="${P}-bar"><div class="${P}-go"><span class="${P}-lab">Generate</span><i class="${P}-sp ${P}-wait" style="display: none">${SPIN}</i></div><div class="${P}-save" style="visibility: hidden">Save</div></div></div>`);
    const go = root.querySelector(`.${P}-go`), lab = root.querySelector(`.${P}-lab`), wait = root.querySelector(`.${P}-wait`), grid = root.querySelector(`.${P}-grid`), dl = root.querySelector(`.${P}-dl`), save = root.querySelector(`.${P}-save`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n) => ({ im: n.querySelector('img'), pend: n.querySelector(`.${P}-pend`) }));
    const bars = [...root.querySelectorAll(`.${P}-sp`)];
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // the pill is pressed, then its label gives way to the white spinner until the last picture has landed (and returns as 'Regenerate')
        const gp = press(s, GEN_AT, 0.06, 0.06, 0.14);
        put('go', gp.toFixed(3), () => { go.style.transform = gp > 0 ? `scale(${(1 - 0.04 * gp).toFixed(4)})` : 'none'; });
        const busy = s >= ISSUE && s < DONE;
        put('busy', busy, (v) => { wait.style.display = v ? '' : 'none'; lab.style.display = v ? 'none' : ''; });
        const done = s >= DONE;
        put('done', done, (v) => { lab.textContent = v ? 'Regenerate' : 'Generate'; save.style.visibility = v ? '' : 'hidden'; dl.style.visibility = v ? '' : 'hidden'; });

        // the result area fills with grey tiles; each hands its spinner over to its picture in a hard swap, in reading order
        put('iss', s >= ISSUE, (v) => { grid.style.visibility = v ? '' : 'hidden'; });
        cells.forEach((c, i) => {
          const landed = s >= LAND[i];
          put(`i${i}`, landed, (v) => { c.im.style.visibility = v ? '' : 'hidden'; c.pend.style.display = v ? 'none' : ''; });
        });

        // the activity indicators step round with t (the same phase everywhere, as on the phone); a function of t alone, covered or not
        const step = ((Math.floor(t * RATE) % STEPS) + STEPS) % STEPS;
        put('spin', step, (d) => { const r = `rotate(${d * 360 / STEPS}deg)`; bars.forEach((b) => { b.style.transform = r; }); });
      },
    };
  },
};
