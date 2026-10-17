// Wix AI Image Creator (BETA), the 'Photo Studio' panel of the Wix Studio editor, as screen-recorded in 2023 (Wixarea, YouTube 4nrdjrWmXQo,
// 2023-10-26, t~28-67 s) and in the official Wix Studio tutorial of 2025-09-29 (YouTube M7e1QjXNsDM); spec .tmp/clone-9e82faf1/reveal-refs/wix-ai-image/spec.json, confidence 0.62; frames x_wix_modal_idle_t28, x_wix_generating_t40/42,
// x_wix_landing1_t43, x_wix_landing2_t44, x_wix_landed_t45). A white modal: a 'Photo Studio' header (a close cross, Cancel, a greyed Save), a
// left column titled 'AI Image Creator' with a BETA chip, a 'Describe your image' box, a 'Choose a style' grid of twelve small squares and a
// blue '✦ Create Images' pill; a pale canvas to its right holds the result slots, plain light-grey (#efefef) rounded squares, each carrying
// a faint four-point sparkle while idle. The in-flight cue is weak by design: pressing the pill turns it grey (#dde1e3) and the sparkles
// leave, while the slots stay plain, empty grey (no spinner, bar, percentage, shimmer or text) until the pictures hard-swap in one at a time, in reading order;
// the line 'See an image you like? Choose it to continue.' then appears over them and the pill reads 'Create Again'.
// Adapted to ten images: ten slots in a 4 + 4 + 2 block (the footage's grid was a fixed 2 x 2), the pictures landing strictly one after
// another; the press of the pill and its greying are drawn clearly ahead of the first drop so the wait reads. Omitted: the editing-tools
// strip, the footage's own style thumbnails (the style squares are plain with their labels), the terms footnote, the editor behind the
// modal (with its plan badge in the top bar, an upsell) and every Wix logo or wordmark; every picture is our own meme, system type only.
import { press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-wxi';
const ROOT_H = 424, LEFT_W = 178, COLS = 4, GAP = 8;
const CSS = `
.${P} { box-sizing: border-box; position: relative; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 12px; background: #fff; color: #32364a; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #d9dce1; }
.${P}-top { flex: none; display: flex; align-items: center; gap: 10px; height: 34px; padding: 0 12px; box-shadow: 0 1px 0 #e6e8ec; }
.${P}-top svg { flex: none; width: 9px; height: 9px; fill: none; stroke: #32364a; stroke-width: 1.6; stroke-linecap: round; }
.${P}-top b { font-size: 9px; font-weight: 600; color: #20233a; }
.${P}-cancel { margin-left: auto; font-size: 8px; font-weight: 500; color: #116dff; }
.${P}-save { box-sizing: border-box; height: 18px; padding: 0 9px; border-radius: 9px; background: #c9d3e8; font-size: 8px; line-height: 18px; font-weight: 500; color: #fff; }
.${P}-body { flex: 1; min-height: 0; display: flex; }
.${P}-left { flex: none; box-sizing: border-box; display: flex; flex-direction: column; width: ${LEFT_W}px; padding: 12px 13px 12px 13px; box-shadow: 1px 0 0 #e6e8ec; }
.${P}-ttl { flex: none; display: flex; align-items: center; gap: 6px; height: 14px; font-size: 9.5px; font-weight: 600; color: #20233a; }
.${P}-ttl em { font-style: normal; font-size: 5.5px; font-weight: 700; line-height: 9px; padding: 0 3px; border-radius: 2px; background: #d5e6fd; color: #1c5fc0; letter-spacing: .3px; }
.${P}-lab { flex: none; height: 10px; margin-top: 11px; font-size: 6.5px; line-height: 10px; color: #4d516a; }
.${P}-box { flex: none; box-sizing: border-box; height: 56px; margin-top: 4px; padding: 5px 6px; border-radius: 4px; box-shadow: inset 0 0 0 1px #d9dce1; font-size: 7.5px; line-height: 11px; color: #20233a; overflow: hidden; }
.${P}-st { flex: none; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 5px 6px; margin-top: 5px; }
.${P}-st span { display: flex; flex-direction: column; align-items: center; gap: 2px; font-size: 5.5px; line-height: 7px; color: #5b5f78; white-space: nowrap; }
.${P}-st i { display: block; box-sizing: border-box; width: 100%; height: 26px; border-radius: 2px; background: #f5f6f8; box-shadow: inset 0 0 0 1px #e1e4e8; }
.${P}-st .on { color: #116dff; }
.${P}-st .on i { background: #eef4ff; box-shadow: inset 0 0 0 1.5px #116dff; }
.${P}-cta { margin: auto auto 0; flex: none; display: flex; align-items: center; justify-content: center; gap: 4px; box-sizing: border-box; width: 120px; height: 26px; border-radius: 13px; font-size: 8px; font-weight: 500; }
.${P}-cta svg { flex: none; width: 8px; height: 8px; fill: currentColor; }
.${P}-cta.s0 { background: #116dff; color: #fff; }
.${P}-cta.s1 { background: #dde1e3; color: #fff; }
.${P}-cta.s2 { background: #fff; color: #116dff; box-shadow: inset 0 0 0 1px #116dff; }
.${P}-cv { position: relative; flex: 1; min-width: 0; background: #f8f8f9; }
.${P}-hint { position: absolute; left: 0; right: 0; top: 13px; text-align: center; font-size: 7px; line-height: 10px; color: #4d516a; }
.${P}-g { position: absolute; left: 20px; right: 20px; top: 50%; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; transform: translateY(-50%); }
.${P}-t { position: relative; aspect-ratio: 1; border-radius: 7px; overflow: hidden; background: #efefef; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; display: grid; place-items: center; background: #efefef; }
.${P}-pend svg { display: block; width: 13px; height: 13px; fill: #c4c4c8; }
`;

const PROMPT = 'a Muse in a lecture hall holding up a handwritten note, meme style';
const STYLES = ['None', 'Photo', 'Illustration', '3D', 'Packshot', 'Painting', 'Sketch', 'Fantasy', 'Cartoon', 'Pop Art', 'Background', 'Collage'];
const SPARK = '<svg viewBox="0 0 16 16"><path d="M8 0.5c.5 3.9 3.6 7 7.5 7.5-3.9.5-7 3.6-7.5 7.5C7.5 11.6 4.4 8.5.5 8 4.4 7.5 7.5 4.4 8 .5z"/></svg>';
const CROSS = '<svg viewBox="0 0 10 10"><path d="M1.5 1.5l7 7M8.5 1.5l-7 7"/></svg>';
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const PRESS_AT = 0.1;                             // the cursor presses 'Create Images'
const GREY_AT = 0.18;                             // the pill turns grey, the idle sparkles leave: the work is in flight
const LAND = Array.from({ length: 10 }, (_, i) => 0.62 + i * 0.12);   // slot i takes its picture (reading order), the last at 1.70

export default {
  id: 'wix-ai-image',
  label: 'Wix AI Image Creator (2025)',
  source: {
    platform: "Wix Studio editor, the 'Photo Studio' modal's 'AI Image Creator (BETA)' tab (desktop Chrome, light theme; two tutorial screen recordings on YouTube, 2023-10-26 and the official 2025-09-29 one)",
    feature: "white modal: a prompt box, a 'Choose a style' grid and a '✦ Create Images' pill that greys while working, beside a pale canvas of plain light-grey empty slots (no spinner, bar, percentage or text) into which the pictures hard-swap one at a time, then 'See an image you like? Choose it to continue.' and 'Create Again' (adapted to 10: a 4 + 4 + 2 block, strict one-by-one landing; the editor strip, the style thumbnails and the footnote are omitted)",
    refs: [
      { url: 'https://www.youtube.com/watch?v=4nrdjrWmXQo', retrieved: '2026-10-14' },
      { url: 'https://www.youtube.com/watch?v=M7e1QjXNsDM', retrieved: '2026-10-14' },
    ],
    extrapolated: "the footage's real wait is ~5-7 s from the click to the first picture and ~1.8 s from the first to the fourth (slots 1, 2, 3, 4 at t=43.1, 43.6, 44.1, 44.9); here the click, the pill greying and the empty-grey wait are compressed into the beat's window and ten slots land at an even step, strictly one at a time",
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'wix-ai-image');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-pend">${SPARK}</div></div>`;
    const style = (n) => `<span${n === 'Photo' ? ` class="on"` : ''}><i></i>${n}</span>`;
    const root = x.el(`<div class="${P}"><div class="${P}-top">${CROSS}<b>Photo Studio</b><span class="${P}-cancel">Cancel</span><span class="${P}-save">Save</span></div><div class="${P}-body"><div class="${P}-left"><div class="${P}-ttl">AI Image Creator<em>BETA</em></div><div class="${P}-lab">Describe your image</div><div class="${P}-box">${x.esc(PROMPT)}</div><div class="${P}-lab">Choose a style</div><div class="${P}-st">${STYLES.map(style).join('')}</div><div class="${P}-cta s0">${SPARK}<span>Create Images</span></div></div><div class="${P}-cv"><div class="${P}-hint" style="visibility: hidden">See an image you like? Choose it to continue.</div><div class="${P}-g">${tiles.map(cell).join('')}</div></div></div></div>`);
    const q = (s) => root.querySelector(s);
    const cta = q(`.${P}-cta`), ctaTxt = q(`.${P}-cta span`), hint = q(`.${P}-hint`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), pend: n.querySelector(`.${P}-pend`), spark: n.querySelector(`.${P}-pend svg`), g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // the pill: blue, pressed, grey while working, 'Create Again' once every slot is filled
        const state = s >= LAND[9] ? 2 : s >= GREY_AT ? 1 : 0;
        put('cta', state, (v) => { cta.className = `${P}-cta s${v}`; ctaTxt.textContent = v === 2 ? 'Create Again' : 'Create Images'; });
        const bp = press(s, PRESS_AT, 0.06, 0.06, 0.14);
        put('bp', bp.toFixed(3), () => { cta.style.transform = bp > 0 ? `scale(${(1 - 0.06 * bp).toFixed(4)})` : 'none'; });

        // the heading above the slots arrives with the first picture
        put('hint', s >= LAND[0], (v) => { hint.style.visibility = v ? '' : 'hidden'; });

        const flying = s >= GREY_AT;
        cells.forEach((c, i) => {
          const a = LAND[i];
          put(`i${i}`, s >= a, (v) => { c.im.style.visibility = v ? '' : 'hidden'; c.pend.style.display = v ? 'none' : ''; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
          put(`sp${i}`, flying, (v) => { c.spark.style.visibility = v ? 'hidden' : ''; });
        });
      },
    };
  },
};
