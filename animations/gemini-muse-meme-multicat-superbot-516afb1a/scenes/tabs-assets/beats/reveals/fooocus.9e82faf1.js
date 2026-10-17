// Fooocus (lllyasviel's offline SDXL front end, a dark Gradio page; Bilibili BV1514y1C7rz, 2023-09-06, t=41-46 s; spec
// .tmp/clone-9e82faf1/reveal-refs/fooocus/spec.json, confidence 0.82; frames o_fooocus_prompt_t41.0 / _step14_t42.0 / _step24_t44.0 /
// _complete_t46.0 / _result_t55.0). A #0B0F17 page: a wide 'Preview' panel bordered in orange while a run is live, holding the picture
// in its centre (the empty-image glyph before the first one), a progress row under it (a small ring, a thin blue bar and a right-aligned
// label), the prompt box with the Generate button, and an 'Advanced' checkbox. After Generate the prompt box greys out and Generate
// disables; the label reads 'Processing text encoding...' over a small blue sliver, then 'Step k/30 in the i-th Sampling' while the
// blurred live preview sharpens with every step and the bar fills; at the end the bar and label clear and the finished images sit in
// the gallery (the panel's thumbnail strip, the selected one outlined).
// Adapted to ten images: Fooocus renders its Image Number one after another (image_number passes, each its own sampling), so
// i = 0..9: one pass per image, the preview of image i sharpening through its 30 steps, and the finished image dropping into the
// gallery strip as its pass ends - ten pictures landing strictly in sequence. Omitted: the header banner/wordmark, the Advanced side
// panel, the creator's subtitle and chapter bar. Every picture is our own meme; no logo, wordmark or platform font is drawn.
import { seg, press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-fo';
const ROOT_H = 404, PREVIEW = 238;
const CSS = `
.${P} { box-sizing: border-box; width: 560px; max-width: 100%; height: ${ROOT_H}px; padding: 12px 14px 0; border-radius: 10px; background: #0b0f17; color: #cfd6e1; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #1a212d; }
.${P}-pan { position: relative; box-sizing: border-box; height: ${PREVIEW + 52}px; border-radius: 4px; background: #11151e; overflow: hidden; }
.${P}-pan::after { content: ""; position: absolute; inset: 0; z-index: 3; border-radius: 4px; box-shadow: inset 0 0 0 1px #262e3c; pointer-events: none; }
.${P}-pan.live::after { box-shadow: inset 0 0 0 1.5px #e8833a; }
.${P}-lab { position: absolute; left: 5px; top: 4px; display: flex; align-items: center; gap: 3px; z-index: 2; font-size: 5.5px; color: #aab3c2; }
.${P}-lab i { display: block; width: 5px; height: 4px; border-radius: 1px; box-shadow: inset 0 0 0 1px #aab3c2; }
.${P}-dl { position: absolute; right: 6px; top: 4px; z-index: 2; font-size: 6px; line-height: 6px; color: #aab3c2; }
.${P}-side { position: absolute; left: 0; right: 0; top: 0; height: ${PREVIEW + 4}px; background: #212935; }
.${P}-pv { position: absolute; left: 50%; top: 0; width: ${PREVIEW}px; height: ${PREVIEW}px; margin-left: -${PREVIEW / 2}px; background: #212935; overflow: hidden; }
.${P}-pv img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-glyph { position: absolute; left: 50%; top: 50%; width: 11px; height: 9px; margin: -4px 0 0 -5px; border-radius: 1.5px; box-shadow: inset 0 0 0 1px #5e6878; }
.${P}-strip { position: absolute; left: 0; right: 0; top: ${PREVIEW + 4}px; display: flex; justify-content: center; align-items: center; gap: 4px; height: 48px; background: #11151e; }
.${P}-t { position: relative; flex: none; width: 28px; height: 33px; border-radius: 3px; background: #212935; overflow: hidden; }
.${P}-t.sel { box-shadow: 0 0 0 1.5px #e8833a; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; background: #212935; }
.${P}-prog { display: flex; align-items: center; gap: 8px; height: 14px; margin-top: 8px; }
.${P}-ring { flex: none; width: 8px; height: 8px; border-radius: 50%; background: #f1f4f8; box-shadow: inset 0 0 0 2.5px #f1f4f8, inset 0 0 0 5px #0b0f17; }
.${P}-trk { position: relative; flex: 1; height: 6px; background: #7d8283; }
.${P}-trk u { position: absolute; left: 0; top: 0; bottom: 0; width: 0%; background: #5398d4; }
.${P}-txt { flex: none; width: 112px; font-size: 6px; text-align: right; color: #c9d0db; white-space: nowrap; }
.${P}-row { display: flex; gap: 6px; margin-top: 6px; }
.${P}-ta { flex: 1; box-sizing: border-box; height: 44px; padding: 5px 6px; border-radius: 4px; background: #212935; font-size: 6.5px; line-height: 9px; color: #e6eaf0; }
.${P}-ta.off { color: #8a93a2; }
.${P}-go { flex: none; display: grid; place-items: center; box-sizing: border-box; width: 62px; height: 44px; border-radius: 4px; background: #343d4d; font-size: 7px; font-weight: 600; color: #e3e8ef; }
.${P}-go.off { background: #212935; color: #6c7585; }
.${P}-adv { display: flex; align-items: center; gap: 4px; height: 16px; margin-top: 6px; font-size: 6px; color: #aab3c2; }
.${P}-adv i { display: block; width: 6px; height: 6px; border-radius: 1.5px; box-shadow: inset 0 0 0 1px #4b5565; background: #151b26; }
`;

const PROMPT = 'a muse holding a handwritten note, meme style, vivid colours';
const REF = 1.84;                  // the beat in seconds from the card's entrance to the last landing
const GEN_AT = 0.02;               // the cursor presses Generate
const LIVE = 0.05;                 // the run starts: orange border, greyed prompt, bar sliver
const STEPS = 30;

export default {
  id: 'fooocus',
  label: 'Fooocus',
  source: {
    platform: 'Fooocus 2.1.x (lllyasviel/Fooocus), a self-hosted offline Gradio web app in a desktop browser (a screen recording on Bilibili, 2023-09-06)',
    feature: "dark Gradio page: an orange-bordered Preview panel, a blue progress bar with the right-aligned label 'Processing text encoding...' then 'Step k/30 in the i-th Sampling', the live preview sharpening through the steps, finished images collecting in the gallery strip (adapted to 10: Fooocus renders its Image Number one image per sampling pass - its own sequential image_number behaviour - so i = 0..9, one image per pass landing in strict sequence)",
    refs: [{ url: 'https://www.bilibili.com/video/BV1514y1C7rz', retrieved: '2026-10-14' }],
    extrapolated: "the footage shows a 2-image batch; the ten passes, the per-pass 30-step counter restarting at each image and the thumbnail strip filling are an adaptation; the 'Generated in ..s' line (not captured) is omitted",
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'fooocus');
    const thumb = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-pend"></div></div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-pan"><div class="${P}-side"></div><div class="${P}-lab"><i></i>Preview</div><div class="${P}-dl">⤓</div><div class="${P}-pv"><div class="${P}-glyph"></div><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme preview" style="visibility: hidden"/></div><div class="${P}-strip">${tiles.map(thumb).join('')}</div></div><div class="${P}-prog" style="visibility: hidden"><i class="${P}-ring"></i><div class="${P}-trk"><u></u></div><span class="${P}-txt"></span></div><div class="${P}-row"><div class="${P}-ta">${x.esc(PROMPT)}</div><div class="${P}-go">Generate</div></div><div class="${P}-adv"><i></i>Advanced</div></div>`);
    const pan = root.querySelector(`.${P}-pan`), glyph = root.querySelector(`.${P}-glyph`), pv = root.querySelector(`.${P}-pv img`);
    const prog = root.querySelector(`.${P}-prog`), fill = root.querySelector(`.${P}-trk u`), txt = root.querySelector(`.${P}-txt`);
    const ta = root.querySelector(`.${P}-ta`), go = root.querySelector(`.${P}-go`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ n, im: n.querySelector('img'), pend: n.querySelector(`.${P}-pend`), g: tiles[i] }));
    ctx.gate([pv, ...cells.map((c) => c.im)]);

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered
        const lay = (u) => (u - ctx.cardIn) / k;
        const S0 = lay(ctx.seq(0)[0]), L = (i) => lay(ctx.seq(i)[1]);
        const done = s >= L(9);
        const live = s >= LIVE && !done;

        // Generate is pressed, then greys out with the prompt for the run
        const gp = press(s, GEN_AT, 0.05, 0.05, 0.12);
        put('gp', gp.toFixed(3), () => { go.style.transform = gp > 0 ? `scale(${(1 - 0.05 * gp).toFixed(4)})` : 'none'; });
        put('live', live || (s >= LIVE && !done), (v) => { pan.classList.toggle('live', v); ta.classList.toggle('off', v); go.classList.toggle('off', v); });

        // the sampling pass we are in
        let ci = 0;
        while (ci < 9 && s >= L(ci)) ci++;
        const sampling = s >= S0 && !done;
        const p = sampling ? seg(s, lay(ctx.seq(ci)[0]), L(ci)) : 0;
        const n = Math.max(1, Math.min(STEPS, Math.ceil(p * STEPS - 1e-9)));

        // progress row: a sliver and 'Processing text encoding...' until the first pass, then the step counter; gone at the end
        put('prog', live, (v) => { prog.style.visibility = v ? '' : 'hidden'; });
        if (live) {
          const label = sampling ? `Step ${n}/${STEPS} in the ${ci}-th Sampling` : 'Processing text encoding...';
          put('lab', label, () => { txt.textContent = label; });
          const w = sampling ? p * 100 : 5;
          fill.style.width = `${w.toFixed(2)}%`;
        } else fill.style.width = '';

        // the preview: image ci sharpening step by step; at the end it rests on the last picture
        const idx = done ? 9 : ci, g = tiles[idx];
        const show = sampling || done;
        put('pv', show, (v) => { pv.style.visibility = v ? '' : 'hidden'; glyph.style.display = v ? 'none' : ''; });
        put('po', idx, () => { pv.style.transformOrigin = g.origin; });
        pv.style.transform = restTransform(g);
        if (sampling) {
          const stepP = n / STEPS;
          pv.style.filter = `blur(${(13 * Math.pow(1 - stepP, 1.4) + 0.4).toFixed(2)}px) saturate(${(0.6 + 0.4 * stepP).toFixed(3)}) ${g.grade}`.trim();
        } else pv.style.filter = restFilter(g);

        // the gallery strip: image i drops in as its pass ends; the last one is the selected thumbnail
        cells.forEach((c, i) => {
          const on = s >= L(i);
          put(`i${i}`, on, (v) => { c.im.style.visibility = v ? '' : 'hidden'; c.pend.style.display = v ? 'none' : ''; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
        });
        put('sel', done, (v) => { cells[9].n.classList.toggle('sel', v); });
      },
    };
  },
};
