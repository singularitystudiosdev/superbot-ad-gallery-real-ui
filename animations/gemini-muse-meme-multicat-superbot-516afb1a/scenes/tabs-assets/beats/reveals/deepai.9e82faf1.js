// DeepAI's text-to-image page (deepai.org/machine-learning-model/text2img, YouTube G1kC9sHGO_4, 2025-04-06, t~25-33 s; spec
// .tmp/clone-9e82faf1/reveal-refs/deepai/spec.json, confidence 0.60; frames t_001_prompt, t_002_pending, t_003_partial, t_004_partial2,
// t_005_complete). A near-black violet page headed 'AI Image Generator': a prompt card on the left (the prompt box, a purple 'Generate'
// button, Standard / HD / Genius model chips, a Speed / Quality preference) and a dark output panel on the right. Before the click the
// panel holds one large white mark; while the image is pending the mark turns as an indeterminate spinner (no text, no percentage, no
// bar, no queue label); the picture then streams in from the top edge downwards until it fills the panel.
// Adapted to ten images: ten output slots in a 5 x 2 block, each showing a spinner until its picture streams in top to bottom (a cover
// that recedes downward), the slots taking their turn in strict order. Omitted: the style tiles, the sign-in dialog and the buttons under
// the finished image. The source's pictures are never reproduced and its comet logo is not drawn: the spinner is a plain three-arc glyph
// of our own, turning from render(t); every slot shows our own meme, in the system UI face.
import { seg, press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-dpa';
const COLS = 5, GAP = 6;
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: 372px; padding: 14px; border-radius: 12px; background: #0b0717; color: #ece9f7; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #17122a; }
.${P}-hd { flex: none; text-align: center; padding-bottom: 12px; }
.${P}-hd b { display: block; font-size: 15px; font-weight: 700; color: #fff; line-height: 20px; }
.${P}-hd span { display: block; margin-top: 3px; font-size: 7.5px; color: #cfcae2; }
.${P}-card { flex: 1; min-height: 0; display: flex; gap: 12px; box-sizing: border-box; padding: 12px; border-radius: 12px; background: #130f20; box-shadow: inset 0 0 0 1px #1d1730; }
.${P}-left { flex: none; width: 168px; display: flex; flex-direction: column; }
.${P}-lab { height: 12px; margin-top: 10px; font-size: 8.5px; font-weight: 600; line-height: 12px; color: #ece9f7; }
.${P}-lab.first { margin-top: 0; }
.${P}-prompt { margin-top: 6px; box-sizing: border-box; height: 40px; padding: 6px 7px; border-radius: 7px; background: #181327; box-shadow: inset 0 0 0 1px #2c2442; font-size: 7.5px; line-height: 10.5px; font-weight: 600; color: #e4e0f3; overflow: hidden; }
.${P}-go { margin-top: 7px; display: grid; place-items: center; height: 24px; border-radius: 12px; background: #7a35f0; font-size: 9px; font-weight: 600; color: #fff; }
.${P}-seg { margin-top: 6px; display: flex; gap: 2px; box-sizing: border-box; height: 24px; padding: 2px; border-radius: 8px; background: #181327; }
.${P}-seg span { flex: 1; display: grid; place-items: center; border-radius: 6px; font-size: 7.5px; font-weight: 500; color: #cdc8e0; white-space: nowrap; }
.${P}-seg .on { background: #7a35f0; color: #fff; }
.${P}-old { margin-top: 7px; display: flex; align-items: center; justify-content: center; gap: 5px; font-size: 7px; color: #cdc8e0; }
.${P}-old i { display: block; width: 7px; height: 7px; border-radius: 2px; background: #2c2442; }
.${P}-out { position: relative; flex: 1; min-width: 0; display: flex; align-items: center; box-sizing: border-box; padding: 8px; border-radius: 10px; background: #0e0b17; }
.${P}-es { position: absolute; left: 0; right: 0; top: 50%; display: grid; place-items: center; transform: translateY(-50%); }
.${P}-es .${P}-mk { width: 54px; height: 54px; }
.${P}-g { width: 100%; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; }
.${P}-t { position: relative; aspect-ratio: 3 / 4; border-radius: 6px; overflow: hidden; background: #17122a; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-cv { position: absolute; inset: 0; display: grid; place-items: center; background: #17122a; }
.${P}-cv::before { content: ""; position: absolute; left: 0; right: 0; bottom: 100%; height: 10px; background: linear-gradient(0deg, rgba(23, 18, 42, .85), rgba(23, 18, 42, 0)); }
.${P}-cv::after { content: ""; position: absolute; left: 0; right: 0; top: 0; height: 1.5px; background: #9b7bff; }
.${P}-mk { display: block; width: 20px; height: 20px; }
.${P}-mk svg { display: block; width: 100%; height: 100%; overflow: visible; }
`;

const PROMPT = 'a muse holding a handwritten note in a lecture hall, meme style, bright colours';
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const GEN_AT = 0.06;                              // the cursor presses Generate
const ISSUE = 0.16;                               // the single idle mark gives way to the ten slots
const STEP = (1.68 - 0.4) / 10;                   // slot i streams in over [0.4 + i * STEP, 0.4 + (i + 1) * STEP]: strict, non-overlapping, the last landing at 1.68
const A = (i) => 0.4 + i * STEP;
// a plain three-arc glyph of our own (not the source's logo), turned and pulsed from t
const MARK = '<svg viewBox="0 0 40 40" fill="none"><g stroke="#f4f1ff" stroke-width="3.4" stroke-linecap="round"><path d="M20 5.5a14.5 14.5 0 0 1 12.6 7.3"/><path d="M34.4 21.5a14.5 14.5 0 0 1-7.2 11.8"/><path d="M13.2 32.6A14.5 14.5 0 0 1 6 18.5"/></g><circle cx="20" cy="20" r="3" fill="#9b7bff"/></svg>';

export default {
  id: 'deepai',
  label: 'DeepAI (2025)',
  source: {
    platform: 'DeepAI AI Image Generator page, deepai.org/machine-learning-model/text2img (desktop Chrome, dark theme; a tutorial screen recording on YouTube, 2025-04-06)',
    feature: "dark violet page: a left prompt card with a purple 'Generate' button, Standard/HD/Genius and Speed/Quality chips; a right output panel with one large mark that turns as an indeterminate spinner (no text, percentage or bar) while the image is pending, then the picture streams in from the top edge downward (adapted to 10: ten output slots in a 5 + 5 block, each spinning then streaming in top to bottom in turn; the source's own logo is replaced by a plain glyph, the style tiles and sign-in dialog are omitted)",
    refs: [{ url: 'https://www.youtube.com/watch?v=G1kC9sHGO_4', retrieved: '2026-10-14' }],
    extrapolated: ['ten output slots in a 5 x 2 block (the footage shows one output panel)', 'a spinner and a top-to-bottom stream per slot, in strict order (the footage shows one of each)'],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'deepai');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-cv"><i class="${P}-mk">${MARK}</i></div></div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-hd"><b>AI Image Generator</b><span>This is an AI Image Generator. It creates an image from scratch from a text description.</span></div><div class="${P}-card"><div class="${P}-left"><div class="${P}-lab first">Create an image from text prompt</div><div class="${P}-prompt">${x.esc(PROMPT)}</div><div class="${P}-go">Generate</div><div class="${P}-lab">Choose a model</div><div class="${P}-seg"><span>Standard</span><span class="on">HD</span><span>Genius</span></div><div class="${P}-lab">Preference</div><div class="${P}-seg"><span class="on">Speed</span><span>Quality</span></div><div class="${P}-old"><i></i>Use older model</div></div><div class="${P}-out"><div class="${P}-es"><i class="${P}-mk">${MARK}</i></div><div class="${P}-g" style="visibility: hidden">${tiles.map(cell).join('')}</div></div></div></div>`);
    const go = root.querySelector(`.${P}-go`), es = root.querySelector(`.${P}-es`), grid = root.querySelector(`.${P}-g`), big = es.querySelector(`.${P}-mk`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), cv: n.querySelector(`.${P}-cv`), mk: n.querySelector(`.${P}-mk`), g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };
    // the glyph turns and breathes; a function of t alone (its phase differs per slot)
    const spin = (el, key, t, ph) => {
      const deg = (((t * 300 + ph * 53) % 360) + 360) % 360;
      const sc = 0.88 + 0.12 * Math.sin((t * 2.2 + ph * 0.4) * Math.PI);
      put(key, `${deg.toFixed(0)}|${sc.toFixed(2)}`, () => { el.style.transform = `rotate(${deg.toFixed(0)}deg) scale(${sc.toFixed(2)})`; });
    };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // Generate is pressed (it never changes label)
        const gp = press(s, GEN_AT, 0.06, 0.06, 0.14);
        put('go', gp.toFixed(3), () => { go.style.transform = gp > 0 ? `scale(${(1 - 0.05 * gp).toFixed(4)})` : 'none'; });

        // the one idle mark gives way to the ten slots
        const on = s >= ISSUE;
        put('iss', on, (v) => { es.style.display = v ? 'none' : ''; grid.style.visibility = v ? '' : 'hidden'; });
        spin(big, 'big', t, 0);

        cells.forEach((c, i) => {
          const a = A(i), f = seg(s, a, a + STEP);
          put(`i${i}`, s >= a, (v) => { c.im.style.visibility = v ? '' : 'hidden'; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
          // the cover recedes downward: the picture is revealed from the top edge
          put(`c${i}`, f.toFixed(3), () => {
            if (f >= 1) { c.cv.style.display = 'none'; c.cv.style.transform = ''; } else { c.cv.style.display = ''; c.cv.style.transform = f > 0 ? `translateY(${(f * 100).toFixed(2)}%)` : ''; }
          });
          spin(c.mk, `m${i}`, t, i + 1);
        });
      },
    };
  },
};
