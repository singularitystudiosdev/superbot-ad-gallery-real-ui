// Depositphotos' AI Image Generator page (depositphotos.com/ai-image-generator; a 2024-12-07 tutorial screen recording on YouTube,
// jQlyKzEiNwg, t~84.0-89.6 s and a second, fast re-run at t~124.9-125.4 s; spec .tmp/clone-9e82faf1/reveal-refs/depositphotos-ai/spec.json,
// confidence 0.78; frames ag2_idle_t84.0 / ag2_pending_first_t84.217 / ag2_pending_t85.5 / ag2_pending_t87.0 / ag2_partial_t89.25 /
// ag2_complete_t89.6 / ag2_btn_pending_t86.0 / ag2_tiles_zoom_t86.0). A white page: a slim 'AI Image Generator' header, a black rounded
// composer (the prompt, the chips 'Aspect Ratio | Wide' on dark and 'Style | Auto' on white, a row of three style thumbnails) and, at its
// right, a magenta-to-blue-to-cyan 'Generate' pill; under it a pale 'Explore ideas | Recently Generated' tab pill over a picture feed.
// Pressing the pill pushes the feed down and opens a results block directly under the composer: blank flat light-grey rounded tiles at
// 16:9 (no border, shadow, shimmer, caption or percentage) into whose centre fades a violet-to-blue four-point sparkle pair that then
// pulses; the pill keeps its gradient but its label is replaced by a white indeterminate ring spinner. The tiles then hard-swap to the
// finished pictures, staggered, and the pill goes back to 'Generate'.
// Adapted to ten images: ten tiles in a 5 x 2 block resolving one after another in strict reading order (the source shows four, 2 x 2),
// the sparkles fading in and pulsing from render(t), the spinner turning from render(t). Omitted: the wordmark and its petal mark, the
// 'Plans & Balance' menu, the avatar and bell, the green-ring generations-left chip, the browser chrome and the channel watermark. The
// footage's pictures are never reproduced: every tile is our own meme, the feed is plain tinted blocks, the style thumbnails are plain
// gradients, system type only.
import { seg, press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-dph';
const ROOT_H = 440, COLS = 5, GAP = 6, SLOT_H = 124;
const CSS = `
.${P} { box-sizing: border-box; position: relative; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 12px; background: #ffffff; color: #1d1e22; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #e3e5e9; }
.${P}-defs { position: absolute; width: 0; height: 0; overflow: hidden; }
.${P}-top { display: flex; align-items: center; gap: 5px; height: 30px; padding: 0 16px; font-size: 8px; font-weight: 600; color: #5d6068; white-space: nowrap; }
.${P}-top svg { display: block; width: 9px; height: 9px; }
.${P}-comp { box-sizing: border-box; margin: 0 12px; height: 126px; padding: 10px 12px 8px; border-radius: 14px; background: #0b0b0d; }
.${P}-in { display: flex; align-items: center; gap: 6px; box-sizing: border-box; height: 26px; padding: 0 8px; border-radius: 8px; box-shadow: inset 0 0 0 1px #26272c; font-size: 7.4px; color: #b9bbc2; white-space: nowrap; overflow: hidden; }
.${P}-in i { flex: none; display: block; width: 8px; height: 8px; border-radius: 2px; background: #5b4bd6; }
.${P}-row { display: flex; align-items: center; justify-content: space-between; margin-top: 8px; height: 24px; }
.${P}-chips { display: flex; gap: 6px; }
.${P}-chip { display: flex; align-items: center; gap: 5px; box-sizing: border-box; height: 24px; padding: 0 7px; border-radius: 12px; font-size: 6.4px; line-height: 7.4px; white-space: nowrap; }
.${P}-chip b { display: block; font-weight: 400; font-size: 5.4px; opacity: 0.72; }
.${P}-chip em { display: block; font-style: normal; font-weight: 700; }
.${P}-chip svg { flex: none; display: block; width: 8px; height: 8px; fill: none; stroke: currentColor; stroke-width: 1.4; stroke-linecap: round; stroke-linejoin: round; }
.${P}-dk { background: #1f2024; color: #f2f3f5; }
.${P}-lt { background: #ffffff; color: #1d1e22; }
.${P}-go { position: relative; flex: none; display: grid; place-items: center; box-sizing: border-box; width: 72px; height: 24px; border-radius: 12px; background: linear-gradient(90deg, #a208fe, #3862eb 55%, #00a2ff); color: #ffffff; font-size: 7.6px; font-weight: 700; white-space: nowrap; }
.${P}-go span { display: flex; align-items: center; gap: 4px; }
.${P}-lab svg { display: block; width: 8px; height: 8px; fill: #ffffff; }
.${P}-ring { display: block; width: 12px; height: 12px; fill: none; stroke: #ffffff; stroke-width: 1.8; stroke-linecap: round; stroke-dasharray: 17 10; }
.${P}-th { display: flex; justify-content: center; gap: 9px; margin-top: 7px; }
.${P}-th div { display: flex; flex-direction: column; align-items: center; gap: 3px; font-size: 5.4px; color: #8c8e96; }
.${P}-th i { display: block; box-sizing: border-box; width: 40px; height: 26px; border-radius: 4px; opacity: 0.72; }
.${P}-th .${P}-on { color: #ffffff; font-weight: 700; }
.${P}-th .${P}-on i { opacity: 1; box-shadow: 0 0 0 1.5px #ffffff; }
.${P}-lower { position: relative; height: ${ROOT_H - 156}px; overflow: hidden; }
.${P}-slot { box-sizing: border-box; height: ${SLOT_H}px; padding: 14px 38px 0; }
.${P}-grid { display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; }
.${P}-tile { position: relative; aspect-ratio: 16 / 9; border-radius: 8px; overflow: hidden; background: #edeff2; }
.${P}-tile img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; background: #edeff2; }
.${P}-sp { position: absolute; left: 50%; top: 50%; width: 22px; height: 22px; margin: -11px 0 0 -11px; opacity: 0; }
.${P}-sp svg { display: block; width: 22px; height: 22px; }
.${P}-tabs { display: flex; justify-content: center; }
.${P}-tabs div { display: flex; padding: 2px; border-radius: 10px; background: #f1f2f5; font-size: 6.6px; font-weight: 600; color: #6a6c74; white-space: nowrap; }
.${P}-tabs span { display: grid; place-items: center; box-sizing: border-box; height: 16px; padding: 0 9px; border-radius: 8px; }
.${P}-tabs .${P}-on { background: #ffffff; color: #1d1e22; box-shadow: 0 0 0 1px #e1e3e8; }
.${P}-feed { display: flex; gap: 8px; margin: 12px 38px 0; }
.${P}-col { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 8px; }
.${P}-col i { display: block; border-radius: 8px; }
`;

const PROMPT = 'A muse holding a handwritten note, meme style, bold bright colours';
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const GEN_AT = 0.06;                              // the cursor presses 'Generate'
const ISSUE = 0.2;                                // the results block opens: ten blank tiles, the spinner replaces the label, the feed drops
const SP_IN = 0.3, SP_FADE = 0.14;                // the sparkles fade and scale in a few frames after the blank tiles
const LAND = Array.from({ length: 10 }, (_, i) => 0.62 + i * 0.1178);   // tile i is hard-swapped for its picture (reading order), the last at 1.68
const SPIN_DEG = 540;                             // the pill's ring, degrees per second of t
const PULSE_HZ = 1.7;

const STAR = 'M12 0C12.9 7.4 16.6 11.1 24 12C16.6 12.9 12.9 16.6 12 24C11.1 16.6 7.4 12.9 0 12C7.4 11.1 11.1 7.4 12 0Z';
const SPARK = `<svg viewBox="0 0 24 24"><path d="${STAR}" fill="#fff"/></svg>`;
const FEED = [
  [['#fbd34d', 70], ['#c9ecf3', 46], ['#e8e0f7', 60], ['#f3e8d2', 50]],
  [['#bfe6ee', 88], ['#f3e3b0', 52], ['#d7e4fb', 58], ['#f4dde6', 56]],
  [['#e9eef7', 52], ['#f1d9c4', 80], ['#cfe9d6', 56], ['#e5def4', 62]],
  [['#d9d0f4', 96], ['#efe9f5', 48], ['#f7d9d9', 56], ['#d3e8f2', 50]],
  [['#f6e2ae', 64], ['#c3d9f4', 78], ['#e8d5f2', 54], ['#d8ecd8', 58]],
];
const THUMBS = [['Auto', 'linear-gradient(135deg, #f2b53b, #c42f7c 55%, #5b2bd6)', true], ['Art', 'linear-gradient(135deg, #46313c, #a56f3d)', false], ['Photography', 'linear-gradient(135deg, #263650, #7b5a48)', false]];

export default {
  id: 'depositphotos-ai',
  label: 'Depositphotos AI Image Generator (2024)',
  source: {
    platform: "Depositphotos AI Image Generator page (depositphotos.com/ai-image-generator, desktop browser, white page with a black rounded composer; a tutorial screen recording on YouTube, 2024-12-07)",
    feature: "a black composer holds the prompt, the chips 'Aspect Ratio | Wide' and 'Style | Auto' and a gradient 'Generate' pill; pressing it opens a block of blank flat light-grey 16:9 tiles directly under the composer (the feed below is pushed down), each soon showing a violet-to-blue four-point sparkle pair that fades in and pulses, while the pill keeps its gradient and swaps its label for a white ring spinner; the tiles then hard-swap to the finished pictures, staggered, and the pill returns to 'Generate' (adapted to 10: a 5 + 5 block landing in strict reading order; the wordmark, account menu, generations-left chip and browser chrome are omitted)",
    refs: [{ url: 'https://www.youtube.com/watch?v=jQlyKzEiNwg', published: '2024-12-07', retrieved: '2026-10-14' }],
    extrapolated: ['ten tiles in a 5 x 2 block (the footage shows four, 2 x 2, at 16:9)', 'the strict one-after-another landing in reading order over the whole beat (the footage shows a staggered but unordered swap)', 'the sparkle pulse rate and the per-tile phase offsets', 'the pill spinner speed', 'the tinted-block feed and the gradient style thumbnails (the footage shows stock pictures, never reproduced)'],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'depositphotos-ai');
    const defs = `<svg class="${P}-defs" aria-hidden="true" width="0" height="0"><defs><linearGradient id="${P}-grad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8b61fd"/><stop offset="0.5" stop-color="#676ffc"/><stop offset="1" stop-color="#4c77fc"/></linearGradient></defs></svg>`;
    const spark = `<svg viewBox="0 0 24 24"><path d="${STAR}" transform="translate(1.4 7.6) scale(0.64)" fill="url(#${P}-grad)"/><path d="${STAR}" transform="translate(13.6 0.6) scale(0.34)" fill="url(#${P}-grad)"/></svg>`;
    const cell = (g, i) => `<div class="${P}-tile"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-pend"><div class="${P}-sp">${spark}</div></div></div>`;
    const thumbs = THUMBS.map(([n, bg, on]) => `<div${on ? ` class="${P}-on"` : ''}><i style="background: ${bg}"></i>${n}</div>`).join('');
    const feed = FEED.map((col) => `<div class="${P}-col">${col.map(([c, h]) => `<i style="background: ${c}; height: ${h}px"></i>`).join('')}</div>`).join('');
    const ring = `<svg class="${P}-ring" viewBox="0 0 12 12"><circle cx="6" cy="6" r="4.4"/></svg>`;
    const root = x.el(`<div class="${P}">${defs}<div class="${P}-top"><svg viewBox="0 0 24 24"><path d="${STAR}" fill="#e0489e"/></svg>AI Image Generator</div><div class="${P}-comp"><div class="${P}-in"><i></i>${x.esc(PROMPT)}</div><div class="${P}-row"><div class="${P}-chips"><div class="${P}-chip ${P}-dk"><svg viewBox="0 0 12 12"><rect x="1.5" y="3" width="9" height="6" rx="1"/></svg><div><b>Aspect Ratio</b><em>Wide</em></div></div><div class="${P}-chip ${P}-lt"><svg viewBox="0 0 12 12"><path d="M6 1.5l1.2 3.3L10.5 6 7.2 7.2 6 10.5 4.8 7.2 1.5 6l3.3-1.2z"/></svg><div><b>Style</b><em>Auto</em></div></div></div><div class="${P}-go"><span class="${P}-lab">Generate<svg viewBox="0 0 24 24"><path d="${STAR}"/></svg></span><span class="${P}-spin" style="display: none">${ring}</span></div></div><div class="${P}-th">${thumbs}</div></div><div class="${P}-lower"><div class="${P}-flow"><div class="${P}-slot"><div class="${P}-grid" style="visibility: hidden">${tiles.map(cell).join('')}</div></div><div class="${P}-tabs"><div><span class="${P}-on">Explore ideas</span><span>Recently Generated</span></div></div><div class="${P}-feed">${feed}</div></div></div></div>`);
    const go = root.querySelector(`.${P}-go`), lab = root.querySelector(`.${P}-lab`), spin = root.querySelector(`.${P}-spin`), ringEl = root.querySelector(`.${P}-ring`);
    const grid = root.querySelector(`.${P}-grid`), lower = root.querySelector(`.${P}-flow`);
    const cells = [...root.querySelectorAll(`.${P}-tile`)].map((n, i) => ({ im: n.querySelector('img'), pend: n.querySelector(`.${P}-pend`), sp: n.querySelector(`.${P}-sp`), g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));
    // each picture rests at its crop's own CSS (set once; render never touches it)
    cells.forEach((c) => { c.im.style.filter = restFilter(c.g); c.im.style.transform = restTransform(c.g); });

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // 'Generate' is pressed (the pill keeps its gradient)
        const gp = press(s, GEN_AT, 0.06, 0.06, 0.14);
        put('go', gp.toFixed(3), () => { go.style.transform = gp > 0 ? `scale(${(1 - 0.05 * gp).toFixed(4)})` : 'none'; });

        // the results block opens under the composer and the feed is pushed down
        put('iss', s >= ISSUE, (v) => { grid.style.visibility = v ? '' : 'hidden'; lower.style.transform = v ? 'none' : `translateY(-${SLOT_H}px)`; });

        // the label becomes a white ring spinner until the last picture has landed
        const busy = s >= ISSUE && s < LAND[9];
        put('busy', busy, (v) => { lab.style.display = v ? 'none' : ''; spin.style.display = v ? '' : 'none'; });
        const deg = (((t * SPIN_DEG) % 360) + 360) % 360;
        put('deg', deg.toFixed(0), (d) => { ringEl.style.transform = `rotate(${d}deg)`; });

        // per tile: the sparkle pair fades and scales in, then pulses (phase offset per tile); then the hard swap, strictly in reading order
        cells.forEach((c, i) => {
          const f = seg(s, SP_IN, SP_IN + SP_FADE);
          const wave = 0.5 + 0.5 * Math.sin(2 * Math.PI * (t * PULSE_HZ + i * 0.173));
          const o = f * (0.5 + 0.5 * wave), sc = (0.55 + 0.45 * f) * (0.9 + 0.2 * wave * f);
          put(`s${i}`, `${o.toFixed(3)}|${sc.toFixed(3)}`, () => { c.sp.style.opacity = o.toFixed(3); c.sp.style.transform = f > 0 ? `scale(${sc.toFixed(3)})` : 'none'; });
          const done = s >= LAND[i];
          put(`l${i}`, done, (v) => { c.im.style.visibility = v ? '' : 'hidden'; c.pend.style.display = v ? 'none' : ''; });
        });
      },
    };
  },
};
