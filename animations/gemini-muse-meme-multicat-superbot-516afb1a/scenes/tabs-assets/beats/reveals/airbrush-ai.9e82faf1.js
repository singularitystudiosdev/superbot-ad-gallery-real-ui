// airbrush.ai 'Create an Image' (the standalone AI text-to-image web app; YouTube -l2Kft-L9mM, 2024-09-19, t=150.4-157 s; spec
// .tmp/clone-9e82faf1/reveal-refs/airbrush-ai/spec.json, confidence 0.6; frames ai2_00_composer_150s, ai2_01_pending_152s, ai2_02_pending_154s,
// ai2_03_pending_155s, ai2_04_landing_155s, ai2_05_landing_157s). A very light page (#F7F8FA): the title 'Create an Image' with the strapline
// 'Turn text into a unique image', and ONE column to begin with: an 'Image Details' card holding a Description field, an 'AI Engine' select, an
// 'Image Dimensions' select and a full-width blue 'Create Image' button. Pressing it turns the page into TWO columns: the composer is NOT
// dimmed and keeps its values, and a 'Preview' card mounts on the right whose grey (#F4F4F6) tile carries a ring of eight pale-blue dots
// (#8FD4E8 / #A5DEEF at differing opacity) that turns and pulses. There is no percentage, bar, countdown or 'Generating' text. The tile then
// hard-swaps to the picture, a blue 'Download' button appears and, beneath it, a thumbs-up / thumbs-down pair.
// Adapted to ten images: the Preview card holds ten tiles in a 5 x 2 block (the source shows one), hard-swapping in strict reading order, the
// Download button and the thumbs appearing once the last has landed. The dots turn and pulse from render(t). Omitted: the generation-cost line,
// the 'Chat with us' launcher, the 'airbrush' wordmark, the left navigation rail, the browser chrome and the presenter's bubble; the
// footage's picture is never reproduced (every tile is our own meme) and no logo or platform font is drawn (a plain pink disc, plain squares,
// system type).
import { press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-abr';
const ROOT_H = 288, PAD = 14, GAP_COLS = 12, LEFT_W = 220, FULL_W = 560 - PAD * 2, PREV_W = FULL_W - LEFT_W - GAP_COLS, COLS = 5, TGAP = 4, DOTS = 8;
const CSS = `
.${P} { box-sizing: border-box; position: relative; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 12px; background: #f7f8fa; color: #111827; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #e5e7eb; }
.${P}-head { position: absolute; left: ${PAD}px; right: ${PAD}px; top: 14px; height: 32px; }
.${P}-head b { display: block; font-size: 13px; font-weight: 700; line-height: 17px; color: #111827; }
.${P}-head span { display: block; margin-top: 1px; font-size: 7.5px; line-height: 11px; color: #6b7280; }
.${P}-head em { position: absolute; right: 0; top: 10px; font-style: normal; font-size: 6.5px; line-height: 10px; color: #6b7280; white-space: nowrap; }
.${P}-head em i { font-style: normal; margin: 0 4px; color: #9ca3af; }
.${P}-col { position: absolute; top: 62px; }
.${P}-col h4 { margin: 0; height: 14px; font-size: 9px; font-weight: 700; line-height: 14px; color: #111827; white-space: nowrap; }
.${P}-card { box-sizing: border-box; margin-top: 6px; padding: 10px; border-radius: 8px; background: #fff; box-shadow: 0 0 0 1px #eceef2, 0 1px 3px rgba(17, 24, 39, .04); }
.${P}-ask { display: flex; align-items: center; gap: 7px; height: 20px; font-size: 7.5px; font-weight: 700; color: #111827; white-space: nowrap; }
.${P}-ask i { flex: none; display: block; width: 20px; height: 20px; border-radius: 50%; background: radial-gradient(circle at 36% 32%, #fff3f6 0 14%, transparent 15%), radial-gradient(circle at 64% 70%, #f5b53a 0 12%, transparent 13%), linear-gradient(145deg, #fcd5df, #f78fa9); }
.${P}-lab { margin-top: 9px; height: 9px; font-size: 7px; line-height: 9px; font-weight: 500; color: #6b7280; white-space: nowrap; }
.${P}-in { display: flex; align-items: center; justify-content: space-between; gap: 4px; box-sizing: border-box; margin-top: 3px; height: 21px; padding: 0 8px; border-radius: 4px; background: #fff; box-shadow: inset 0 0 0 1px #e5e7eb; font-size: 7px; color: #1f2937; white-space: nowrap; }
.${P}-in span { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.${P}-in svg { flex: none; width: 7px; height: 7px; fill: none; stroke: #9ca3af; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
.${P}-two { display: flex; gap: 8px; }
.${P}-two > div { flex: 1; min-width: 0; }
.${P}-adv { margin-top: 9px; height: 9px; font-size: 7px; line-height: 9px; color: #1f7bf2; white-space: nowrap; }
.${P}-go { display: grid; place-items: center; margin-top: 9px; height: 22px; border-radius: 4px; background: #1f7bf2; font-size: 8px; font-weight: 700; color: #fff; }
.${P}-prev { visibility: hidden; left: ${PAD + LEFT_W + GAP_COLS}px; width: ${PREV_W}px; }
.${P}-g { display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${TGAP}px; }
.${P}-t { position: relative; aspect-ratio: 1; border-radius: 5px; overflow: hidden; background: #f4f4f6; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; background: #f4f4f6; }
.${P}-ring { position: absolute; left: 50%; top: 50%; width: 0; height: 0; }
.${P}-ring i { position: absolute; left: -3.2px; top: -3.2px; display: block; width: 6.4px; height: 6.4px; border-radius: 50%; background: #8fd4e8; }
.${P}-ring i:nth-child(even) { background: #a5def0; }
.${P}-dl { visibility: hidden; display: grid; place-items: center; margin-top: 10px; height: 22px; border-radius: 4px; background: #1f7bf2; font-size: 8px; font-weight: 700; color: #fff; }
.${P}-th { visibility: hidden; display: flex; justify-content: center; gap: 16px; margin-top: 8px; height: 14px; }
.${P}-th svg { display: block; width: 12px; height: 12px; fill: #f5b83d; }
.${P}-th svg:last-child { transform: rotate(180deg); }
`;

const PROMPT = 'A muse in a lecture hall holding up a handwritten note, meme style, big eyes, happy';
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const GEN_AT = 0.06;                              // the cursor presses 'Create Image'
const ISSUE = 0.16;                               // one column becomes two, the Preview card mounts with ten pending tiles
const LAND = Array.from({ length: 10 }, (_, i) => 0.4 + i * 0.1425);   // tile i hard-swaps to its picture (reading order), the last at 1.6825
const R = 14;                                     // the dot ring's radius, px (a tile is ~53 px wide)

export default {
  id: 'airbrush-ai',
  label: 'AirBrush AI image generator (2024)',
  source: {
    platform: "airbrush.ai 'Create an Image' (the standalone AI text-to-image web app, desktop Chrome, light theme; a third-party screen recording on YouTube, 2024-09-19)",
    feature: "'Create an Image' composer in one column (Description field, AI Engine select, Image Dimensions select, blue 'Create Image' button); pressing it makes two columns - the composer stays undimmed with its values, a 'Preview' card mounts on the right whose grey #F4F4F6 tile carries a ring of 8 pale-blue dots (#8FD4E8 / #A5DEEF, differing opacity) turning and pulsing, no percentage, bar, countdown or 'Generating' text - then the tile hard-swaps to the picture and a blue 'Download' button with thumbs up/down appears (adapted to 10: ten tiles inside the Preview card in reading order; the generation-cost line, the chat launcher, the wordmark and the browser chrome are omitted)",
    refs: [
      { url: 'https://www.youtube.com/watch?v=-l2Kft-L9mM', videoId: '-l2Kft-L9mM', published: '2024-09-19', retrieved: '2026-10-14', note: "'Airbrush AI Review With Tutorial' (Technolung Reviews): idle one-column composer t=150.4-151.7 s, Create Image pressed and the Preview column mounted t~151.8 s, dot ring pending t=152.1-155.5 s, picture + Download landed t~155.6 s, uncut" },
      { url: 'https://www.youtube.com/watch?v=YrTZfdG8NNM', videoId: 'YrTZfdG8NNM', published: '2025-05-31', retrieved: '2026-10-14', note: 'step-card tutorial showing the same dot-ring spinner; corroboration only' },
      { url: 'https://www.youtube.com/watch?v=X0LSMCyjjl4', videoId: 'X0LSMCyjjl4', published: '2024-10-18', retrieved: '2026-10-14', note: "'Airbrush AI Showcase': the same Preview spinner at t~20-40 s; corroboration only" },
    ],
    extrapolated: [
      "the source shows ONE 1:1 preview tile; the ten tiles in a 5 x 2 block inside the Preview card, their hard swaps in strict reading order and the compressed 1.84 s timing (the real wait is ~3.8 s for one picture) are extrapolated",
      "the layout is scaled to a 560 px block: the narrow composer column (the footage's is ~1320 px wide on a 1920 px screen), and the left navigation rail is not drawn",
      "the Create Image press highlight, the Download button appearing only after the tenth tile has landed (the footage shows it with its one picture) and the dots' turn rate and pulse phase per tile are extrapolated",
      "the button under the Preview tile during the wait is hidden by the chat launcher in the footage (only 'Genera' reads); it is not drawn before the last tile lands",
      "the prompt, 'Midjourney V6' and 'Large (512 x 512)' are the footage's values for the engine and size; the prompt text is ours ('A Siberian Cat is drinking milk' in the footage)",
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'airbrush-ai');
    const dots = Array.from({ length: DOTS }, (_, j) => `<i style="transform: rotate(${j * 360 / DOTS}deg) translateY(${-R}px)"></i>`).join('');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-pend"><div class="${P}-ring">${dots}</div></div></div>`;
    const chev = '<svg viewBox="0 0 12 12"><path d="M3 4.5l3 3 3-3"/></svg>';
    const thumb = '<svg viewBox="0 0 24 24"><path d="M2 10h4v11H2zM8 10l4-8c1.7 0 3 1.3 3 3v4h5.2c1.3 0 2.2 1.2 1.9 2.4l-1.8 7.2c-.3 1-1.2 1.4-2.1 1.4H8z"/></svg>';
    const root = x.el(`<div class="${P}"><div class="${P}-head"><b>Create an Image</b><span>Turn text into a unique image</span><em>Home<i>&gt;</i>Create Image</em></div><div class="${P}-col ${P}-comp" style="left: ${PAD}px; width: ${FULL_W}px"><h4>Image Details</h4><div class="${P}-card"><div class="${P}-ask"><i></i>Please enter the description for the image:</div><div class="${P}-lab">Description</div><div class="${P}-in"><span>${x.esc(PROMPT)}</span></div><div class="${P}-two"><div><div class="${P}-lab">AI Engine</div><div class="${P}-in"><span>Midjourney V6</span>${chev}</div></div><div><div class="${P}-lab">Image Dimensions</div><div class="${P}-in"><span>Large (512 x 512)</span>${chev}</div></div></div><div class="${P}-adv">Advanced Settings</div><div class="${P}-go">Create Image</div></div></div><div class="${P}-col ${P}-prev"><h4>Preview</h4><div class="${P}-card"><div class="${P}-g">${tiles.map(cell).join('')}</div><div class="${P}-dl">Download</div><div class="${P}-th">${thumb}${thumb}</div></div></div></div>`);
    const comp = root.querySelector(`.${P}-comp`), prev = root.querySelector(`.${P}-prev`), go = root.querySelector(`.${P}-go`);
    const dl = root.querySelector(`.${P}-dl`), th = root.querySelector(`.${P}-th`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), pend: n.querySelector(`.${P}-pend`), ring: n.querySelector(`.${P}-ring`), dots: [...n.querySelectorAll(`.${P}-ring i`)], g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // 'Create Image' is pressed (it never changes label, and the composer is never dimmed)
        const gp = press(s, GEN_AT, 0.06, 0.06, 0.14);
        put('go', gp.toFixed(3), () => { go.style.transform = gp > 0 ? `scale(${(1 - 0.04 * gp).toFixed(4)})` : 'none'; });

        // one column becomes two: the composer narrows, the Preview card mounts beside it
        const two = s >= ISSUE;
        put('two', two, (v) => { comp.style.width = `${v ? LEFT_W : FULL_W}px`; prev.style.visibility = v ? 'visible' : ''; });

        cells.forEach((c, i) => {
          const a = LAND[i];
          // a hard swap: the dot ring gives way to the picture in one frame
          put(`i${i}`, s >= a, (v) => { c.im.style.visibility = v ? '' : 'hidden'; c.pend.style.display = v ? 'none' : ''; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
          // the ring turns and its dots pulse with t (the phase differs per tile): a function of t alone, covered or not
          const deg = (((t * 300 + i * 47) % 360) + 360) % 360;
          put(`r${i}`, deg.toFixed(0), (d) => { c.ring.style.transform = `rotate(${d}deg)`; });
          c.dots.forEach((d, j) => {
            const o = (0.3 + 0.7 * Math.pow(0.5 + 0.5 * Math.cos(2 * Math.PI * (t * 0.8 - j / DOTS - i / 13)), 1.4)).toFixed(2);
            put(`d${i}-${j}`, o, (v) => { d.style.opacity = v; });
          });
        });

        // the last picture has landed: the Download button and the thumbs appear
        const done = s >= LAND[9];
        put('dl', done, (v) => { dl.style.visibility = v ? 'visible' : ''; th.style.visibility = v ? 'visible' : ''; });
      },
    };
  },
};
