// A Hugging Face Space served by Gradio (light theme), the 'stabilityai/stable-diffusion' demo as it ran in a narrated desktop-Chrome
// screen recording (Orbit OCP, YouTube TxX0emPcOqE, published 2026-08-02, t~250-262 s; spec .tmp/clone-9e82faf1/reveal-refs/hf-spaces-gradio/spec.json,
// confidence 0.78; frames wy_gradio_pending_t028.jpg, wy_gradio_landing_t045.jpg, wy_gradio_spinner_t030.png, wy_gradio_panel_t024.png).
// A centred demo column: a bold page title with a one-line description, a bordered input panel (prompt and negative-prompt textboxes beside a
// full-height 'Generate image' button) and, under it, the bordered output box. Pressing the button leaves the output box EMPTY: no skeleton,
// no shimmer, no percentage; only a small amber striped indicator in the middle of the box and, at the output panel's top-right, the monospace
// caption 'processing | 1.0/11.2s' counting up in real time. Then the finished images are painted into the box in a hard swap.
// Adapted to ten images: the box holds a 5 x 2 gallery whose cells are blank until their picture is painted in, one at a time in reading order;
// the amber indicator leaves with the first picture and the caption keeps counting up to 11.0/11.2s, the moment the last one has landed.
// The footage's seconds counter (about 10.8 s real) is compressed into the beat window and driven from t alone. Omitted (spec unknowns): the HF
// header with its hardware pill, the description's second line and its links (a promo for a sister paid product), the community tab and like counter, the 'Share to community' pill, the Examples table, the
// recording's browser chrome. The footage's pictures are never reproduced: every cell is our own meme.
import { seg, press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT, MONO_FONT } from './util.9e82faf1.js';

const P = 'rv-hfg';
const ROOT_H = 444, COLS = 5, GAP = 6;
const CSS = `
.${P} { box-sizing: border-box; position: relative; width: 560px; max-width: 100%; height: ${ROOT_H}px; padding: 14px 20px 0; border-radius: 12px; background: #ffffff; color: #1f2937; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #e5e7eb; }
.${P}-ttl { margin: 0; text-align: center; font-size: 17px; font-weight: 700; line-height: 24px; color: #111827; }
.${P}-ttl i { display: inline-block; vertical-align: -2px; width: 10px; height: 10px; margin-right: 7px; background: conic-gradient(#f97316 0 25%, #1f2937 0 50%, #f97316 0 75%, #1f2937 0); border-radius: 2px; }
.${P}-dsc { margin-top: 3px; height: 25px; text-align: center; font-size: 8.5px; line-height: 25px; color: #374151; }
.${P}-in { display: flex; margin-top: 12px; box-sizing: border-box; height: 86px; border-radius: 8px 8px 0 0; background: #f3f4f6; box-shadow: inset 0 0 0 1px #e5e7eb; overflow: hidden; }
.${P}-fields { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 5px; padding: 6px; }
.${P}-box { flex: 1; display: flex; align-items: center; box-sizing: border-box; padding: 0 9px; border-radius: 7px; background: #ffffff; box-shadow: 0 0 0 1px #e5e7eb; font-size: 9.5px; color: #1f2937; white-space: nowrap; overflow: hidden; }
.${P}-go { flex: none; width: 124px; display: grid; place-items: center; background: linear-gradient(180deg, #f3f4f6, #e5e7eb); font-size: 11px; font-weight: 700; color: #1f2937; }
.${P}-go span { display: block; }
.${P}-out { position: relative; box-sizing: border-box; height: 238px; border-radius: 0 0 8px 8px; background: #ffffff; box-shadow: inset 0 0 0 1px #e5e7eb; overflow: hidden; }
.${P}-cap { position: absolute; right: 8px; top: 5px; font-family: ${MONO_FONT}; font-size: 8.5px; line-height: 12px; color: #6b7280; white-space: nowrap; }
.${P}-g { position: absolute; left: 8px; right: 8px; top: 24px; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; }
.${P}-t { position: relative; aspect-ratio: 1; border-radius: 6px; overflow: hidden; background: #ffffff; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-cv { position: absolute; inset: 0; background: #ffffff; }
.${P}-bar { position: absolute; left: 50%; top: 50%; width: 22px; height: 9px; margin: -4px 0 0 -11px; border-radius: 2px; background-color: #fb923c; background-image: repeating-linear-gradient(135deg, #f97316 0, #f97316 3px, #fdba74 3px, #fdba74 6px); background-size: 8.49px 8.49px; box-shadow: 0 0 0 1px #fdba74; }
.${P}-adv { display: flex; align-items: center; justify-content: space-between; box-sizing: border-box; height: 30px; margin-top: 12px; padding: 0 10px; border-radius: 6px; background: #f3f4f6; box-shadow: inset 0 0 0 1px #e5e7eb; font-size: 9.5px; font-weight: 600; color: #374151; }
.${P}-adv i { font-style: normal; font-size: 7px; color: #6b7280; }
`;

const PROMPT = 'A muse holding a handwritten note in a lecture hall, meme style';
const NEG = 'low quality, 3d, photorealistic';
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const GEN_AT = 0.06;                              // the cursor presses Generate image
const ISSUE = 0.16;                               // the caption and the amber indicator appear over the empty box
const T0 = 1.0, T1 = 11.0, EST = '11.2';          // the footage's caption counted 1.0 -> 11.0 / 11.2 s; here it runs from issue to the last landing

export default {
  id: 'hf-spaces-gradio',
  label: 'Hugging Face Space, Gradio (2026)',
  source: {
    platform: "Hugging Face Space 'stabilityai/stable-diffusion' served by Gradio (light theme, desktop Chrome; a narrated screen recording on YouTube, 2026-08-02)",
    feature: "empty bordered output box with a small amber striped indicator in its middle and the monospace caption 'processing | 1.0/11.2s' ticking in real time at the output panel's top-right, no skeleton or percentage; the finished images then hard-swap in (adapted to 10: a 5 x 2 gallery whose cells are blank until their picture is painted in, one at a time in reading order; the page's header with its hardware pill, the 'Share to community' pill and the Examples table are omitted)",
    refs: [
      { url: 'https://www.youtube.com/watch?v=TxX0emPcOqE', retrieved: '2026-10-14' },
      { url: 'https://www.gradio.app/guides/progress-bars', retrieved: '2026-10-14' },
    ],
    // the capture hard-swaps one 2 x 2 grid in a single frame; no per-image landing, no ten-image gallery and no 'waiting in queue' frame was seen
    extrapolated: [
      'ten pictures landing one at a time in reading order (the footage paints a single 2 x 2 grid at once)',
      'a 5 x 2 gallery for ten pictures',
      "the live caption 'processing | X.Y/11.2s' (about 10.8 s of real time) compressed into the beat window and driven from t, running on until the last picture lands",
      'the amber indicator leaving with the first picture while the caption runs on',
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'hf-spaces-gradio');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-cv"></div></div>`;
    const root = x.el(`<div class="${P}"><h2 class="${P}-ttl"><i></i>Stable Diffusion 2.1 Demo</h2><div class="${P}-dsc">Stable Diffusion 2.1 is the latest text-to-image model from StabilityAI.</div><div class="${P}-in"><div class="${P}-fields"><div class="${P}-box">${x.esc(PROMPT)}</div><div class="${P}-box">${x.esc(NEG)}</div></div><div class="${P}-go"><span>Generate image</span></div></div><div class="${P}-out"><div class="${P}-cap" style="display: none"></div><div class="${P}-g">${tiles.map(cell).join('')}</div><i class="${P}-bar" style="display: none"></i></div><div class="${P}-adv">Advanced settings<i>&#9664;</i></div></div>`);
    const go = root.querySelector(`.${P}-go span`), cap = root.querySelector(`.${P}-cap`), bar = root.querySelector(`.${P}-bar`);
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
        const land = cells.map((_, i) => ctx.seq(i)[1]);

        // Generate image is pressed (its label never changes)
        const gp = press(s, GEN_AT, 0.06, 0.06, 0.14);
        put('go', gp.toFixed(3), () => { go.style.transform = gp > 0 ? `scale(${(1 - 0.04 * gp).toFixed(4)})` : 'none'; });

        // the elapsed caption counts from issue to the last landing; the amber indicator runs until the first picture is painted in
        const sIss = ctx.cardIn + ISSUE * k;
        const queued = t >= sIss && t < land[9];
        const el = T0 + (T1 - T0) * seg(t, sIss, land[9]);
        put('cap', queued ? el.toFixed(1) : '-', (v) => {
          cap.style.display = v === '-' ? 'none' : '';
          cap.textContent = v === '-' ? '' : `processing | ${v}/${EST}s`;
        });
        const waiting = t >= sIss && t < land[0];
        put('bar', waiting, (v) => { bar.style.display = v ? '' : 'none'; });
        // the stripes slide along the bar (a function of t alone)
        const sh = (((t * 14) % 1) + 1) % 1;
        put('stripes', waiting ? sh.toFixed(2) : '-', (v) => { bar.style.backgroundPosition = v === '-' ? '0 0' : `${(parseFloat(v) * 8.49).toFixed(2)}px 0`; });

        // each picture is painted into its blank cell in one frame, no fade
        cells.forEach((c, i) => {
          const on = t >= land[i];
          put(`i${i}`, on, (v) => { c.im.style.visibility = v ? '' : 'hidden'; c.cv.style.display = v ? 'none' : ''; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
        });
      },
    };
  },
};
