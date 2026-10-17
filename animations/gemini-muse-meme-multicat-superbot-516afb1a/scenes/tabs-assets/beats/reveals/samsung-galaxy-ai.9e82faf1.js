// Galaxy AI 'Sketch to Image' / Drawing Assist on a Samsung Galaxy foldable, One UI 6.1.1 (a hand-held 4K recording on a Galaxy Z Fold6,
// YouTube dMrQv597bJo, 2024-07-24, t~95-107 s; spec .tmp/clone-9e82faf1/reveal-refs/samsung-galaxy-ai/spec.json, confidence 0.62; frames
// r_fold6_generate_button.png, r_fold6_pending_a/b/c.png, r_generating_status_sheet.png, r_s25_drawing_assist_result.png). A light
// lilac-grey One UI editor ('< Title', a pen/colour tool strip), a DASHED frame holding the user's blue line-art sketch with a small
// close button on its corner, below it the style choices (Watercolour / Illustration / Sketch / Pop art / 3D cartoon / Oil painting)
// and a blue 'Generate' pill. Tapping Generate dims the framed region to a flat mid-grey wash (about #7E7E88) with the sketch showing
// faintly through it, a sparse grain of tiny bright dots shimmering over it, and ONE small caption in the middle that rotates between
// 'Bringing your drawing to life...' and 'Finetuning with artistic flair...'. There is no percentage, no bar and no queue label. The
// finished picture then fades in inside the SAME frame; the One UI 7 result screen adds 'Generate one more' and the line 'Image
// generation may produce unexpected results.' under it.
// Adapted to ten images: the framed region is a five-by-two block of ten tiles laid over the sketch; each tile's grey wash (with its own
// shimmer of grain, the sketch still readable through it) thins away to reveal its picture in strict reading order while the one caption
// keeps rotating; the button greys while it works and reads 'Generate one more' once the tenth has landed, with the disclaimer line.
// Omitted: the Galaxy AI sparkle mark (on the button and in the centre of the overlay), the phone status bar, the 'AI generated'
// watermark and the rating row. The footage's sketch and pictures are never reproduced: the sketch is our own doodle, every tile is our
// own meme, and no logo, wordmark or Samsung font is drawn (plain shapes, system type).
import { seg, press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, hash, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-sg';
const ROOT_H = 424, COLS = 5, GAP = 0;
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; padding: 0 14px 8px; border-radius: 12px; background: #efe9ec; color: #1c1b1f; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #d9d1d6; }
.${P}-top { flex: none; display: flex; align-items: center; gap: 8px; height: 30px; margin: 0 -14px; padding: 0 14px; background: #f3eff1; }
.${P}-top svg { flex: none; width: 10px; height: 10px; fill: none; stroke: #3a383d; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.${P}-top b { font-size: 11px; font-weight: 500; color: #1c1b1f; }
.${P}-top i { margin-left: auto; display: flex; gap: 8px; }
.${P}-top i s { display: block; width: 11px; height: 11px; border-radius: 3px; box-shadow: inset 0 0 0 1.3px #5b5860; }
.${P}-tools { flex: none; display: flex; align-items: center; gap: 9px; height: 28px; }
.${P}-tools s { display: block; width: 12px; height: 12px; border-radius: 3px; box-shadow: inset 0 0 0 1.3px #6a6770; }
.${P}-tools .d { width: 11px; height: 11px; border-radius: 50%; box-shadow: none; }
.${P}-tools .ln { width: 16px; height: 0; border-radius: 0; box-shadow: none; border-top: 2px solid #3a383d; }
.${P}-fr { position: relative; flex: none; box-sizing: border-box; height: 252px; margin-top: 8px; padding: 0; border: 1px dashed #8d8a92; background: #f6f2f5; }
.${P}-sk { position: absolute; inset: 0; width: 100%; height: 100%; fill: none; stroke: #2230c8; stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; }
.${P}-x { position: absolute; right: -8px; top: -8px; z-index: 3; display: grid; place-items: center; width: 15px; height: 15px; border-radius: 50%; background: #e6e1e5; box-shadow: 0 0 0 1px #c6c0c6; }
.${P}-x svg { width: 7px; height: 7px; fill: none; stroke: #3a383d; stroke-width: 1.8; stroke-linecap: round; }
.${P}-g { position: relative; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; }
.${P}-t { position: relative; aspect-ratio: 870 / 1024; overflow: hidden; background: transparent; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; background-color: rgba(126, 126, 136, .8); background-image: radial-gradient(circle, rgba(255, 255, 255, .95) 0 .6px, transparent .9px), radial-gradient(circle, rgba(236, 236, 244, .8) 0 .5px, transparent .8px), radial-gradient(circle, rgba(255, 255, 255, .7) 0 .5px, transparent .8px); background-size: 13px 11px, 17px 19px, 23px 21px; }
.${P}-cap { position: absolute; left: 50%; top: 50%; z-index: 2; display: none; transform: translate(-50%, -50%); box-sizing: border-box; height: 20px; padding: 0 11px; border-radius: 10px; background: rgba(54, 54, 64, .62); font-size: 9.5px; line-height: 20px; color: #fff; white-space: nowrap; }
.${P}-sty { flex: none; display: flex; justify-content: center; gap: 5px; margin-top: 12px; }
.${P}-sty span { box-sizing: border-box; height: 24px; padding: 0 9px; border-radius: 12px; background: #e3dde1; font-size: 9px; line-height: 24px; color: #4a474f; white-space: nowrap; }
.${P}-sty .on { background: #dfe6fb; box-shadow: inset 0 0 0 1.4px #3e6ae1; color: #1f3fa6; font-weight: 600; }
.${P}-go { flex: none; display: grid; place-items: center; align-self: center; box-sizing: border-box; height: 30px; margin-top: 9px; padding: 0 26px; border-radius: 15px; background: #2f62e6; font-size: 11px; font-weight: 600; color: #fff; white-space: nowrap; }
.${P}-go.off { background: #b3bad2; }
.${P}-go.more { background: #e0dade; color: #1c1b1f; font-weight: 500; }
.${P}-dis { flex: none; height: 14px; margin-top: 5px; font-size: 7.5px; line-height: 14px; text-align: center; color: #77747b; }
`;

const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const GEN_AT = 0.06;                              // the finger taps Generate
const ISSUE = 0.16;                               // the framed region dims: the ten washes come up over the sketch
const LAND = Array.from({ length: 10 }, (_, i) => 0.4 + i * 0.1425);   // tile i's wash gives way to its picture (reading order), the last at 1.68
const FADE = 0.06;                                // the wash thins away over this long before the picture is fully there
const LINES = ['Bringing your drawing to life...', 'Finetuning with artistic flair...'];
const LINE_EVERY = 0.62;                          // the caption rotates every this many layout seconds
const STYLES = ['Watercolour', 'Illustration', 'Sketch', 'Pop art', '3D cartoon', 'Oil painting'];
const BACK = '<svg viewBox="0 0 10 10"><path d="M6.5 1.5 3 5l3.5 3.5"/></svg>';
// our own blue doodle (a house, a tree and a sun), drawn in a 532 x 254 box under the tiles
const SKETCH = '<path d="M96 190 V118 L164 66 L232 118 V190 Z"/><path d="M150 190 V148 H186 V190"/><path d="M118 130 h20 v18 h-20 z"/><path d="M164 66 V44 h14 v28"/><path d="M300 190 V138"/><path d="M300 150 c-34 -6 -44 -40 -18 -58 c6 -26 40 -30 52 -8 c26 -2 38 30 14 46 c-14 10 -30 22 -48 20"/><path d="M420 70 m-20 0 a20 20 0 1 0 40 0 a20 20 0 1 0 -40 0"/><path d="M420 34 v-12 M420 118 v12 M384 70 h-12 M456 70 h12 M394 44 l-8 -8 M446 44 l8 -8"/><path d="M52 192 C150 184 330 200 480 190"/>';

export default {
  id: 'samsung-galaxy-ai',
  label: 'Galaxy AI Sketch to Image (2024)',
  source: {
    platform: 'Samsung Galaxy AI Sketch to Image / Drawing Assist on a Galaxy Z Fold6, One UI 6.1.1 (a hand-held 4K screen recording on YouTube, 2024-07-24; the One UI 7 result screen from a Galaxy S25 Ultra clip)',
    feature: "light One UI sketch editor: a dashed frame holding a blue line-art sketch, a style row (Watercolour / Illustration / Sketch / Pop art / 3D cartoon / Oil painting) and a blue 'Generate' pill; pending = the frame dims to a flat grey wash with grain shimmering over the faint sketch and one caption rotating 'Bringing your drawing to life...' / 'Finetuning with artistic flair...' (no percentage, bar or queue label); the picture fades in inside the same frame, then 'Generate one more' and 'Image generation may produce unexpected results.' (adapted to 10: a five-by-two block of tiles laid over the sketch washing out in strict reading order; the Galaxy AI sparkle mark, status bar, 'AI generated' watermark and rating row are omitted)",
    refs: [{ url: 'https://www.youtube.com/watch?v=dMrQv597bJo', retrieved: '2026-10-14' }],
    extrapolated: ['the ten-tile frame (the footage generates one picture per tap)', 'the exact moment each wash thins away (the footage shows a single fade of about a second)', 'the rotation interval of the caption (only two of its lines were seen, a few seconds apart)'],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'samsung-galaxy-ai');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-pend"></div></div>`;
    const tool = '<s></s><s></s><s></s><s class="d" style="background: #2b4fe0"></s><s class="d" style="background: #ef6a5a"></s><s class="d" style="background: #38b07a"></s><s class="d" style="background: #232126"></s><s class="ln"></s>';
    const root = x.el(`<div class="${P}"><div class="${P}-top">${BACK}<b>Title</b><i><s></s><s></s><s></s></i></div><div class="${P}-tools">${tool}</div><div class="${P}-fr"><svg class="${P}-sk" viewBox="0 0 532 254" preserveAspectRatio="none">${SKETCH}</svg><div class="${P}-x"><svg viewBox="0 0 8 8"><path d="M1 1l6 6M7 1 1 7"/></svg></div><div class="${P}-g" style="visibility: hidden">${tiles.map(cell).join('')}</div><div class="${P}-cap"></div></div><div class="${P}-sty">${STYLES.map((n, i) => `<span${i === 0 ? ' class="on"' : ''}>${n}</span>`).join('')}</div><div class="${P}-go">Generate</div><div class="${P}-dis" style="visibility: hidden">Image generation may produce unexpected results.</div></div>`);
    const go = root.querySelector(`.${P}-go`), grid = root.querySelector(`.${P}-g`), cap = root.querySelector(`.${P}-cap`), dis = root.querySelector(`.${P}-dis`);
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

        // the tap on Generate; the button then greys while it works and offers one more once the tenth has landed
        const gp = press(s, GEN_AT, 0.06, 0.06, 0.14);
        put('gp', gp.toFixed(3), () => { go.style.transform = gp > 0 ? `scale(${(1 - 0.05 * gp).toFixed(4)})` : 'none'; });
        const mode = s >= LAND[9] ? 2 : s >= GEN_AT + 0.04 ? 1 : 0;
        put('mode', mode, (m) => { go.textContent = m === 2 ? 'Generate one more' : 'Generate'; go.className = `${P}-go${m === 1 ? ' off' : m === 2 ? ' more' : ''}`; });
        put('dis', s >= LAND[9], (v) => { dis.style.visibility = v ? '' : 'hidden'; });

        // the framed region dims: the ten washes come up over the sketch
        put('iss', s >= ISSUE, (v) => { grid.style.visibility = v ? '' : 'hidden'; });

        // the one caption rotates through its lines (index from t) while anything is still pending
        const li = Math.max(0, Math.floor((s - ISSUE) / LINE_EVERY)) % LINES.length;
        put('cap', `${s >= ISSUE && s < LAND[9]}|${li}`, () => { cap.style.display = s >= ISSUE && s < LAND[9] ? 'block' : 'none'; cap.textContent = LINES[li]; });

        const shim = Math.floor(s * 16);               // the grain's shimmer steps with t
        cells.forEach((c, i) => {
          const a = LAND[i];
          const f = seg(s, a - FADE, a);
          put(`i${i}`, s >= a - FADE, (v) => { c.im.style.visibility = v ? '' : 'hidden'; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
          put(`c${i}`, f.toFixed(3), () => {
            if (f >= 1) { c.pend.style.display = 'none'; c.pend.style.opacity = ''; } else { c.pend.style.display = ''; c.pend.style.opacity = f > 0 ? (1 - f).toFixed(3) : ''; }
          });
          put(`g${i}`, shim, () => {
            const p = (n) => `${Math.floor(hash(shim + 3, i * 6 + n) * 40)}px ${Math.floor(hash(shim + 9, i * 6 + n + 3) * 40)}px`;
            c.pend.style.backgroundPosition = `${p(0)}, ${p(1)}, ${p(2)}`;
          });
        });
      },
    };
  },
};
