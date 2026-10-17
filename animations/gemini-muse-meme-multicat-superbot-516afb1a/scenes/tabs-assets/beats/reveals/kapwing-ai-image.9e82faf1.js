// Kapwing's dedicated 2023 AI image generator, the 'Create Image' panel of the Kapwing studio (official channel, YouTube ZB47Q1OEGnA,
// published 2023-10-23, t=44.5-55.5 s; spec .tmp/clone-9e82faf1/reveal-refs/kapwing-ai-image/spec.json, confidence 0.6; frames
// aj_ZB_full_t50.5.png, aj_ZB_grid_t52.0.png, aj_ZB_gen_text2_t52.png, aj_ZB_full_t52.5.png, aj_ZB_wait_49-55.png). It is NOT the 2025
// studio Assistant chat (yNQ2N3_ihBk, 'Thinking ...'): the dark editor sits behind a modal panel, a black left list of generators with
// 'Create Image' selected, a composer ('Topic' with our prompt in a white field, three example chips and a full-width teal 'Generate
// Images' button) and a wide results pane. Before the press the pane holds the idle line 'Type a prompt to generate, and your results will
// appear here once the generation is complete.'; pressing the button swaps it for the header 'Generating images ... please wait. This may
// take a minute.' over a grid of empty dark rounded tiles (no spinner, no bar, no percentage); the tiles then fill with the finished
// pictures one at a time, top-left first, and the header turns into 'Click on an image to add it to your Kapwing project.'
// Adapted to ten images: the source shows a 2 x 2 grid of large tiles, here the pane holds ten smaller tiles in a 4 + 4 + 2 block filling
// in strict reading order. Omitted: the Kapwing logo and 'BETA' badge, the editor's own top bar (project name, Share and Export
// buttons), the Grammarly badge in the field, the example-prompt picture card and the presenter. The footage's pictures are never
// reproduced: every tile is our own meme, and no logo, wordmark or platform font is drawn (system type, plain squares).
import { seg, press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-kpw';
const ROOT_H = 292, RAIL_W = 34, NAV_W = 94, COMP_W = 140, COLS = 4, GAP = 6;
const CSS = `
.${P} { box-sizing: border-box; display: flex; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 12px; background: #0e0e10; color: #e9e9ec; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #232327; }
.${P}-rail { flex: none; box-sizing: border-box; display: flex; flex-direction: column; gap: 9px; width: ${RAIL_W}px; padding: 34px 0 0; align-items: center; background: #0a0a0b; }
.${P}-rail span { display: flex; flex-direction: column; align-items: center; gap: 2px; font-size: 4.5px; line-height: 6px; color: #4b4b50; white-space: nowrap; }
.${P}-rail span i { display: block; width: 9px; height: 9px; border-radius: 2px; background: #27272b; }
.${P}-nav { flex: none; box-sizing: border-box; display: flex; flex-direction: column; gap: 2px; width: ${NAV_W}px; padding: 20px 0 0; background: #050506; }
.${P}-nav span { display: flex; align-items: center; gap: 5px; box-sizing: border-box; height: 20px; padding: 0 8px; font-size: 6.6px; font-weight: 500; color: #d3d3d7; white-space: nowrap; }
.${P}-nav span i { flex: none; display: block; width: 6px; height: 6px; border-radius: 1.5px; box-shadow: inset 0 0 0 1px #8a8a90; }
.${P}-nav .${P}-on { background: #1d1d20; color: #fff; }
.${P}-comp { flex: none; box-sizing: border-box; display: flex; flex-direction: column; width: ${COMP_W}px; padding: 20px 8px 14px; background: #121214; }
.${P}-lab { height: 10px; font-size: 6.6px; line-height: 10px; font-weight: 700; color: #f1f1f3; }
.${P}-fld { box-sizing: border-box; margin-top: 3px; height: 58px; padding: 5px 6px; border-radius: 2px; background: #fdfdfd; font-size: 7px; line-height: 10px; color: #2a2a2e; overflow: hidden; }
.${P}-ex { margin-top: 12px; }
.${P}-chips { display: flex; gap: 3px; margin-top: 3px; }
.${P}-chips span { flex: 1 1 auto; display: grid; place-items: center; box-sizing: border-box; height: 15px; padding: 0 3px; border-radius: 2px; background: #232326; font-size: 5.6px; font-weight: 700; color: #ececef; white-space: nowrap; }
.${P}-go { margin-top: auto; flex: none; display: grid; place-items: center; height: 26px; background: #1ae3d8; font-size: 7.6px; font-weight: 700; color: #0b2a29; }
.${P}-pane { position: relative; flex: 1; min-width: 0; background: #1b1b1d; }
.${P}-idle { position: absolute; left: 36px; right: 36px; top: 50%; transform: translateY(-50%); text-align: center; font-size: 6.4px; line-height: 9px; color: #8c8c92; }
.${P}-hd { position: absolute; left: 0; right: 0; top: 11px; text-align: center; font-size: 6.4px; line-height: 9px; color: #a9a9ae; white-space: nowrap; }
.${P}-g { position: absolute; left: 10px; right: 10px; top: 32px; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; }
.${P}-t { position: relative; aspect-ratio: 1; border-radius: 3px; overflow: hidden; background: #2a2a2d; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; background: #2a2a2d; }
`;

const PROMPT = 'A muse in a lecture hall holding up a handwritten note, meme style, big eyes';
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const GEN_AT = 0.06;                              // the cursor presses 'Generate Images'
const ISSUE = 0.16;                               // the idle line gives way to the waiting header and the ten empty tiles
const LAND = Array.from({ length: 10 }, (_, i) => 0.4 + i * 0.1425);   // tile i fills with its picture (reading order), the last at 1.6825
const FADE = 0.05;                                // the empty tile's cover thins away over this long before the picture lands
const NAV = ['Create Video', 'Script to Video', 'Create Script', 'Meme Generator', 'Create Slideshow', 'Article to Video', 'Create Image', 'Document to Video'];
const RAIL = ['Media', 'Transcript', 'Subtitles', 'Text', 'Videos', 'Images', 'Elements', 'Audio'];

export default {
  id: 'kapwing-ai-image',
  label: 'Kapwing AI image generator (2023)',
  source: {
    platform: "Kapwing studio (web app, dark UI), the 2023 dedicated 'Create Image' AI generator panel (desktop browser; the official Kapwing channel on YouTube, 2023-10-23)",
    feature: "the generator panel over the dimmed editor: a left list of generators with 'Create Image' selected, a composer ('Topic' field holding the prompt, example chips, a teal 'Generate Images' button), and a results pane that swaps its idle line for the header 'Generating images ... please wait. This may take a minute.' over a grid of empty dark rounded tiles with no spinner, bar or percentage; the tiles then fill with the finished pictures one at a time, top-left first, and the header becomes 'Click on an image to add it to your Kapwing project.'",
    refs: [
      { url: 'https://www.youtube.com/watch?v=ZB47Q1OEGnA', videoId: 'ZB47Q1OEGnA', published: '2023-10-23', retrieved: '2026-10-14', note: "'How to Generate AI Images with a Text Prompt' (Kapwing, official): the 'Create Image' panel t=44.5-48.5 s, the prompt 'A dog in a funny hat, photographed' and the teal 'Generate Images' button at t=50.5 s, the wait t=50.5-52.6 s ('Generating images ... please wait. This may take a minute.' over a 2 x 2 grid of empty dark tiles), the four results landing t=52.7-53.3 s" },
      { url: 'https://www.youtube.com/watch?v=yNQ2N3_ihBk', videoId: 'yNQ2N3_ihBk', published: '2025-10-21', retrieved: '2026-10-14', note: "'Edit Images Just by Chatting with AI' (Kapwing, official): the 2025 studio Assistant chat ('Thinking ...', a thin purple bar); a different surface, context only and not built" },
    ],
    extrapolated: [
      "the source shows a 2 x 2 grid of large square tiles; ten tiles in a 4 + 4 + 2 block, their fills in strict reading order and the compressed 1.84 s timing (the 2023 clip is time-lapsed: the copy itself says 'may take a minute') are extrapolated",
      "the layout is scaled to a 560 px block: the footage's panel is ~1000 px wide on a 1920 px screen, the dimmed editor's own top bar is not drawn and its left rail is reduced to a few labels",
      "the prompt is ours ('A dog in a funny hat, photographed' in the footage); the Grammarly badge, the example-prompt picture card and the text selection in the field are not drawn",
      "the 'Generate Images' press highlight and the one-frame fade of an empty tile into its picture are extrapolated (the footage's frames show the swap only between samples)",
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'kapwing-ai-image');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-pend"></div></div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-rail">${RAIL.map((n) => `<span><i></i>${n}</span>`).join('')}</div><div class="${P}-nav">${NAV.map((n) => `<span class="${n === 'Create Image' ? `${P}-on` : ''}"><i></i>${n}</span>`).join('')}</div><div class="${P}-comp"><div class="${P}-lab">Topic</div><div class="${P}-fld">${x.esc(PROMPT)}</div><div class="${P}-lab ${P}-ex">Try an example</div><div class="${P}-chips"><span>lake sunset</span><span>race car</span><span>modern home</span></div><div class="${P}-go">Generate Images</div></div><div class="${P}-pane"><div class="${P}-idle">Type a prompt to generate, and your results will appear here once the generation is complete.</div><div class="${P}-hd" style="display: none">Generating images ... please wait. This may take a minute.</div><div class="${P}-hd" style="display: none">Click on an image to add it to your Kapwing project.</div><div class="${P}-g" style="visibility: hidden">${tiles.map(cell).join('')}</div></div></div>`);
    const go = root.querySelector(`.${P}-go`), idle = root.querySelector(`.${P}-idle`), grid = root.querySelector(`.${P}-g`);
    const [hdWait, hdDone] = root.querySelectorAll(`.${P}-hd`);
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

        // 'Generate Images' is pressed (it never changes label)
        const gp = press(s, GEN_AT, 0.06, 0.06, 0.14);
        put('go', gp.toFixed(3), () => { go.style.transform = gp > 0 ? `scale(${(1 - 0.04 * gp).toFixed(4)})` : 'none'; });

        // the idle line gives way to the waiting header over ten empty tiles; once the last has filled, the header turns into the click-to-add line
        const issued = s >= ISSUE, finished = s >= LAND[9];
        put('iss', issued, (v) => { idle.style.display = v ? 'none' : ''; grid.style.visibility = v ? '' : 'hidden'; });
        put('hw', issued && !finished, (v) => { hdWait.style.display = v ? '' : 'none'; });
        put('hd', finished, (v) => { hdDone.style.display = v ? '' : 'none'; });

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
