// PicLumen, the free AI image generator at piclumen.com/app/create, as screen-recorded in October 2025 (YouTube zN4bxi1KDOg, AI GuideBro,
// 2025-10-27, t~95.5-101.6 s, plus the 4-up batch at t~85.5-86.6 s of a second recording; spec .tmp/clone-9e82faf1/reveal-refs/piclumen/spec.json,
// confidence 0.62; frames x_piclumen_preclick_t95.5, x_piclumen_pending_t96.5/97.5/98.5, x_piclumen_landing_t99.6/100.6, x_piclumen_complete_t101.6,
// x_piclumen_batch4_pending_t85.5). A near-black web app: a left composer column (Image | Video tabs, the prompt, a model row, Resolution
// chips, 'Images per batch' chips and a lilac Generate button) beside a wide canvas. Pressing Generate adds a card to the canvas: a 'Today'
// stamp, a one-line resolution + prompt header, and a flat dark rounded placeholder (#1e1e1e on #0d0d0d, a soft 1px lighter edge) with the
// small grey line 'Generating...' centred in it and a green-ringed 'Fast' chip at its top-left. Nothing animates (no spinner, bar, shimmer,
// percentage or queue label); the finished picture hard-swaps into the very same tile.
// Adapted to ten images: ten of those dark tiles in a 4 + 4 + 2 block, each showing 'Generating...' + 'Fast' until its picture lands,
// strictly one after another (the footage's batch was one to four tiles). Omitted: the account row, the credit cost on the button, the promo badge in the top bar
// (the footage's 2026 recording), the left navigation rail, the browser chrome and the footage's own pictures: every tile is our own meme, no logo, wordmark or platform
// font is drawn (the model badge is a plain gradient dot, the chip ring a plain ring, system type).
import { press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-plm';
const ROOT_H = 404, LEFT_W = 156, COLS = 4, GAP = 8;
const CSS = `
.${P} { box-sizing: border-box; display: flex; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 12px; background: #0d0d0d; color: #e6e6e8; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #1d1d20; }
.${P}-left { flex: none; box-sizing: border-box; display: flex; flex-direction: column; gap: 6px; width: ${LEFT_W}px; padding: 10px 10px 10px 10px; background: #111113; box-shadow: inset -1px 0 0 #1b1b1e; }
.${P}-tabs { flex: none; display: flex; gap: 12px; height: 15px; font-size: 7.5px; font-weight: 600; color: #7d7d84; }
.${P}-tabs span { display: flex; align-items: center; }
.${P}-tabs .on { color: #f2f2f4; box-shadow: 0 1.5px 0 #8b6cf0; }
.${P}-prompt { flex: none; box-sizing: border-box; height: 88px; padding: 7px 8px; border-radius: 6px; background: #17171a; font-size: 7px; line-height: 10.5px; color: #d6d6da; overflow: hidden; }
.${P}-row { flex: none; display: flex; align-items: center; gap: 6px; box-sizing: border-box; height: 24px; padding: 0 8px; border-radius: 6px; background: #17171a; font-size: 7.5px; color: #dcdce0; white-space: nowrap; }
.${P}-row i { flex: none; display: block; width: 12px; height: 12px; border-radius: 3px; background: linear-gradient(140deg, #ff9a4d, #e0457b 55%, #6a5cf0); }
.${P}-lab { flex: none; display: flex; justify-content: space-between; height: 9px; font-size: 6.5px; line-height: 9px; color: #82828a; }
.${P}-chips { flex: none; display: flex; gap: 4px; }
.${P}-chips span { flex: 1; display: grid; place-items: center; box-sizing: border-box; height: 22px; border-radius: 5px; background: #17171a; font-size: 6.5px; color: #8d8d95; }
.${P}-chips .on { background: #1f1c2e; box-shadow: inset 0 0 0 1px #8b6cf0; color: #f4f1ff; }
.${P}-go { margin-top: auto; flex: none; display: grid; place-items: center; height: 26px; border-radius: 5px; background: linear-gradient(90deg, #8d6ff2, #a58bf7); font-size: 8.5px; font-weight: 600; color: #fff; }
.${P}-cv { position: relative; flex: 1; min-width: 0; }
.${P}-es { position: absolute; left: 0; right: 0; top: 50%; text-align: center; transform: translateY(-50%); font-size: 7.5px; color: #66666d; }
.${P}-card { position: absolute; inset: 0; box-sizing: border-box; padding: 16px 14px 0 14px; }
.${P}-day { height: 10px; font-size: 6.5px; line-height: 10px; color: #84848c; }
.${P}-meta { display: flex; align-items: center; gap: 5px; height: 14px; margin-top: 7px; font-size: 6px; color: #70707a; white-space: nowrap; }
.${P}-meta i { flex: none; display: block; width: 10px; height: 10px; border-radius: 50%; background: linear-gradient(140deg, #ff9a4d, #e0457b 55%, #6a5cf0); }
.${P}-line { margin-top: 3px; height: 11px; font-size: 7px; line-height: 11px; color: #d2d2d6; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.${P}-g { display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; margin-top: 12px; }
.${P}-t { position: relative; aspect-ratio: 1; border-radius: 8px; overflow: hidden; background: #1e1e1e; box-shadow: inset 0 0 0 1px #2a2a2a; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; display: grid; place-items: center; background: #1e1e1e; box-shadow: inset 0 0 0 1px #2a2a2a; border-radius: 8px; }
.${P}-pend span { font-size: 6.5px; color: #9a9a9a; white-space: nowrap; }
.${P}-fast { position: absolute; left: 5px; top: 5px; display: flex; align-items: center; gap: 3px; height: 10px; font-size: 5.5px; line-height: 10px; color: #b4b4ba; }
.${P}-fast i { display: block; width: 6px; height: 6px; border-radius: 50%; box-shadow: inset 0 0 0 1.2px #4ade80; }
`;

const PROMPT = 'Create a bright meme-style image of a Muse in a lecture hall holding up a handwritten note, bold colours, a joke in the caption, wide-eyed and proud.';
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const GEN_AT = 0.06;                              // the cursor presses Generate
const ISSUE = 0.16;                               // the empty canvas gives way to the card of pending tiles
const LAND = Array.from({ length: 10 }, (_, i) => 0.42 + i * 0.1425);   // tile i hard-swaps to its picture (reading order), the last at 1.70

export default {
  id: 'piclumen',
  label: 'PicLumen (2025)',
  source: {
    platform: 'PicLumen web app, piclumen.com/app/create (desktop Chrome, dark theme; a tutorial screen recording on YouTube, 2025-10-27, plus a 4-up batch from a second recording)',
    feature: "dark app: a left composer with a lilac Generate button beside a canvas card whose tiles are flat dark rounded placeholders, each with a centred grey 'Generating...' and a green-ring 'Fast' chip, the pictures hard-swapping in (no spinner, bar, percentage or queue label; adapted to 10: a 4 + 4 + 2 block landing one after another; the navigation rail, the cost label and the account row are omitted)",
    refs: [
      { url: 'https://www.youtube.com/watch?v=zN4bxi1KDOg', retrieved: '2026-10-14' },
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'piclumen');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-pend"><div class="${P}-fast"><i></i>Fast</div><span>Generating...</span></div></div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-left"><div class="${P}-tabs"><span class="on">Image</span><span>Video</span></div><div class="${P}-prompt">${x.esc(PROMPT)}</div><div class="${P}-row"><i></i>Realistic V2</div><div class="${P}-lab"><span>Resolution</span><span>1024 x 1024</span></div><div class="${P}-chips"><span class="on">1:1</span><span>9:16</span><span>16:9</span><span>More</span></div><div class="${P}-lab"><span>Images per batch</span></div><div class="${P}-chips"><span>1</span><span>2</span><span>4</span><span class="on">10</span></div><div class="${P}-go">Generate</div></div><div class="${P}-cv"><div class="${P}-es">Click the Generate button to start creating</div><div class="${P}-card" style="visibility: hidden"><div class="${P}-day">Today</div><div class="${P}-meta"><i></i>1024 x 1024 (1:1)</div><div class="${P}-line">${x.esc(PROMPT)}</div><div class="${P}-g">${tiles.map(cell).join('')}</div></div></div></div>`);
    const go = root.querySelector(`.${P}-go`), es = root.querySelector(`.${P}-es`), card = root.querySelector(`.${P}-card`);
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

        // Generate is pressed (it never changes label)
        const gp = press(s, GEN_AT, 0.06, 0.06, 0.14);
        put('go', gp.toFixed(3), () => { go.style.transform = gp > 0 ? `scale(${(1 - 0.05 * gp).toFixed(4)})` : 'none'; });

        // the empty canvas gives way to the card of pending tiles
        const on = s >= ISSUE;
        put('iss', on, (v) => { es.style.display = v ? 'none' : ''; card.style.visibility = v ? '' : 'hidden'; });

        // each tile hard-swaps from its 'Generating...' placeholder to the picture
        cells.forEach((c, i) => {
          const landed = s >= LAND[i];
          put(`i${i}`, landed, (v) => { c.im.style.visibility = v ? '' : 'hidden'; c.pend.style.display = v ? 'none' : ''; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
        });
      },
    };
  },
};
