// WhatsApp's 'Create AI stickers' sheet (Meta AI sticker generation), WhatsApp for Android, May 2024 (YouTube KzrSZGUQ8ss, 2024-05-24, an
// uncut screen recording at 60 fps, t=28.8-33.2 s; spec .tmp/clone-9e82faf1/reveal-refs/whatsapp-ai-stickers/spec.json, confidence 0.68;
// frames ar_ws_28.9 .. ar_ws_33.2). A white bottom sheet: a drag handle, a close cross, the centred title 'Create AI stickers' with a kebab, a
// rounded prompt field ('Describe new sticker to generate'). Submitting collapses the field into a pale pill (#EFF3F6) holding the prompt with
// a clear cross, the subtitle 'Tap to send to Test Number' appears under the title, and the sheet fills with near-white plates (#F9F9F9 on
// #FFFFFF) that carry a soft diagonal light band sweeping across them, all in step. There is no text, spinner, percentage or bar. The stickers do
// not land in reading order: in the source 2x2 the first lands bottom-right, then bottom-left, then top-left, then top-right, each a hard swap
// of the shimmering plate for the finished sticker, and the shimmer is gone once the set is in.
// Adapted to ten stickers: a 5 x 2 block (a 560 px column is wider than the phone sheet). The DOM and the alt text run in strict order
// ('Muse meme 1..10'), but CSS grid placement puts them on screen in the observed scramble extended to ten: the bottom row lands right to left,
// then the top row left to right (the source's bottom-right, bottom-left, top-left, top-right). Stickers sit on transparent backgrounds in the
// app, so ours are rounded sticker frames with a white die-cut edge and a soft shadow. Omitted: the WhatsApp logo, the Meta AI logo, the phone
// status bar and the emulator window. The footage's stickers are never reproduced; every sticker is our own meme and the type is the system face.
import { seg } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-was';
const ROOT_H = 372, COLS = 5, GAP = 14;
const CSS = `
.${P} { box-sizing: border-box; position: relative; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 14px; background: #ffffff; color: #111b21; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #e1e6e9; }
.${P}-hd { position: absolute; left: 50%; top: 9px; width: 40px; height: 4px; margin-left: -20px; border-radius: 2px; background: #c9d0d4; }
.${P}-bar { position: absolute; left: 0; right: 0; top: 24px; height: 46px; }
.${P}-bar svg { position: absolute; display: block; fill: none; stroke: #111b21; stroke-width: 2; stroke-linecap: round; }
.${P}-x { left: 24px; top: 14px; width: 17px; height: 17px; }
.${P}-kb { right: 26px; top: 12px; width: 4px; height: 20px; fill: #111b21 !important; stroke: none !important; }
.${P}-tt { position: absolute; left: 60px; right: 60px; top: 0; text-align: center; }
.${P}-tt b { display: block; font-size: 17px; font-weight: 600; line-height: 22px; color: #111b21; }
.${P}-tt span { display: block; font-size: 12px; line-height: 16px; color: #667781; }
.${P}-fw { position: absolute; left: 24px; right: 24px; top: 82px; height: 52px; }
.${P}-fd { position: absolute; left: 0; right: 0; top: 0; box-sizing: border-box; display: flex; align-items: center; gap: 12px; padding: 0 16px; border-radius: 26px; background: #ffffff; font-size: 16px; color: #111b21; overflow: hidden; }
.${P}-fd svg { flex: none; display: block; width: 22px; height: 22px; }
.${P}-fd .${P}-sp { fill: #8696a0; }
.${P}-tx { position: relative; flex: 1; height: 22px; line-height: 22px; white-space: nowrap; }
.${P}-tx span { position: absolute; left: 0; top: 0; }
.${P}-ph { color: #8696a0; }
.${P}-cl { stroke: #54656f; stroke-width: 2; stroke-linecap: round; fill: none; }
.${P}-g { position: absolute; left: 24px; right: 24px; top: 158px; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); grid-template-rows: repeat(2, auto); gap: ${GAP}px; }
.${P}-t { position: relative; aspect-ratio: 1; }
.${P}-f { position: absolute; inset: 0; border-radius: 14px; overflow: hidden; background: #f9f9f9; }
.${P}-on .${P}-f { background: transparent; box-shadow: 0 0 0 3px #ffffff, 0 1px 6px 1px rgba(17, 27, 33, .28); }
.${P}-f img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pl { position: absolute; inset: 0; overflow: hidden; background: #f9f9f9; }
.${P}-sh { position: absolute; left: 0; top: -25%; width: 70%; height: 150%; background: linear-gradient(90deg, rgba(228, 234, 236, 0) 0%, rgba(228, 234, 236, .9) 34%, #ffffff 66%, rgba(255, 255, 255, 0) 100%); }
`;

const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const PRESS_AT = 0.06;                            // the prompt is submitted: the field collapses to the pill
const COLLAPSE = 0.12;                            // over this long
const ISSUE = 0.2;                                // the ten plates appear and the subtitle shows
const LAND = Array.from({ length: 10 }, (_, i) => 0.4 + i * 0.1425);   // sticker i (alt order) lands, the last at 1.68
const SWEEP = 0.7;                                // one pass of the light band, in layout seconds
const PROMPT = 'Muse holding a meme note';
const PLACEHOLDER = 'Describe new sticker to generate';
// alt index -> grid cell: the observed scramble extended to ten (bottom row right to left, then the top row left to right)
const CELL = (i) => (i < COLS ? { row: 2, col: COLS - i } : { row: 1, col: i - COLS + 1 });
const SPARK = '<svg class="' + P + '-sp" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4l1.7 5 5 1.7-5 1.7L9 17.4l-1.7-5L2.4 10.7l4.9-1.7z"/><path d="M18 3l.9 2.3 2.3.9-2.3.9L18 9.4l-.9-2.3-2.3-.9 2.3-.9z"/><circle cx="18.4" cy="16.4" r="2.6"/></svg>';

export default {
  id: 'whatsapp-ai-stickers',
  label: 'WhatsApp AI stickers (2024)',
  source: {
    platform: "WhatsApp for Android (May 2024, run in an emulator window), the sticker tray's 'Create AI stickers' sheet (Meta AI); a tutorial screen recording on YouTube, 2024-05-24",
    feature: "'Create AI stickers' bottom sheet: title, kebab, subtitle 'Tap to send to Test Number', the prompt field ('Describe new sticker to generate') collapsing to a pale pill on submit, then near-white plates carrying a diagonal shimmer (no text, spinner or bar) that hard-swap into finished stickers OUT OF ORDER (bottom-right, bottom-left, top-left, top-right) and stop shimmering at the last landing (adapted to 10: a 5 x 2 block of rounded sticker frames; WhatsApp and Meta AI logos and the phone status bar omitted)",
    videoIds: ['KzrSZGUQ8ss'],
    dates: ['2024-05-24 (video published)', '2026-10-14 (retrieved)'],
    refs: [
      { url: 'https://www.youtube.com/watch?v=KzrSZGUQ8ss', retrieved: '2026-10-14' },
    ],
    extrapolated: [
      'ten plates: the source generates four stickers in a 2x2 grid, the beat needs ten, so the grid is 5 x 2',
      'landing order: the source 2x2 lands bottom-right, bottom-left, top-left, top-right; for ten the bottom row lands right to left and then the top row left to right, an extension of that observed scramble',
      "DOM / alt order ('Muse meme 1..10') is kept strictly monotonic with landing time; the visual scramble is produced by CSS grid-row / grid-column placement only, so the landing check by alt index order still reads 1..10",
      'landing times are evenly spread over the beat (the source gaps were ~0.6, 0.4, 0.4-0.8 s) and the prompt text is ours, not the footage\'s',
      'the sticker frames (rounded squares with a white edge and shadow) are ours: in the app stickers sit on transparent backgrounds',
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'whatsapp-ai-stickers');
    const cell = (g, i) => {
      const c = CELL(i);
      return `<div class="${P}-t" style="grid-row: ${c.row}; grid-column: ${c.col}"><div class="${P}-f"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}; transform: ${restTransform(g)}; filter: ${restFilter(g)}"/><div class="${P}-pl"><i class="${P}-sh"></i></div></div></div>`;
    };
    const cross = '<svg class="' + P + '-x" viewBox="0 0 18 18" aria-hidden="true"><path d="M2 2l14 14M16 2L2 16"/></svg>';
    const kebab = '<svg class="' + P + '-kb" viewBox="0 0 4 20" aria-hidden="true"><circle cx="2" cy="2.5" r="2"/><circle cx="2" cy="10" r="2"/><circle cx="2" cy="17.5" r="2"/></svg>';
    const clear = '<svg class="' + P + '-cl" viewBox="0 0 22 22" aria-hidden="true"><path d="M5 5l12 12M17 5L5 17"/></svg>';
    const root = x.el(`<div class="${P}"><i class="${P}-hd"></i><div class="${P}-bar">${cross}<div class="${P}-tt"><b>Create AI stickers</b><span style="visibility: hidden">Tap to send to Test Number</span></div>${kebab}</div><div class="${P}-fw"><div class="${P}-fd">${SPARK}<div class="${P}-tx"><span class="${P}-ph">${PLACEHOLDER}</span><span class="${P}-pr" style="visibility: hidden">${x.esc(PROMPT)}</span></div>${clear}</div></div><div class="${P}-g" style="visibility: hidden">${tiles.map(cell).join('')}</div></div>`);
    const tt = root.querySelector(`.${P}-tt`), sub = tt.querySelector('span'), fd = root.querySelector(`.${P}-fd`);
    const ph = root.querySelector(`.${P}-ph`), pr = root.querySelector(`.${P}-pr`), cl = root.querySelector(`.${P}-cl`), grid = root.querySelector(`.${P}-g`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ n, im: n.querySelector('img'), pl: n.querySelector(`.${P}-pl`), sh: n.querySelector(`.${P}-sh`), g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // submit: the field collapses to the pale pill holding the prompt (the placeholder gives way to the prompt)
        const f = seg(s, PRESS_AT, PRESS_AT + COLLAPSE);
        put('fd', f.toFixed(3), () => {
          const a = Math.round(255 + (239 - 255) * f), b = Math.round(255 + (243 - 255) * f), c = Math.round(255 + (246 - 255) * f);
          fd.style.height = `${(52 - 8 * f).toFixed(2)}px`;
          fd.style.top = `${(4 * f).toFixed(2)}px`;
          fd.style.background = `rgb(${a}, ${b}, ${c})`;
          fd.style.boxShadow = f >= 1 ? 'none' : `inset 0 0 0 1px rgba(134, 150, 160, ${(0.55 * (1 - f)).toFixed(3)})`;
          const pa = 1 - Math.min(1, f * 2), pb = Math.max(0, f * 2 - 1);
          ph.style.visibility = pa > 0 ? '' : 'hidden'; ph.style.opacity = pa >= 1 ? '' : pa.toFixed(3);
          pr.style.visibility = pb > 0 ? '' : 'hidden'; pr.style.opacity = pb >= 1 ? '' : pb.toFixed(3);
          cl.style.visibility = f > 0 ? '' : 'hidden';
        });

        // the plates appear and the subtitle shows (the title settles up to make room for it)
        const on = s >= ISSUE;
        put('iss', on, (v) => { grid.style.visibility = v ? '' : 'hidden'; sub.style.visibility = v ? '' : 'hidden'; tt.style.transform = v ? 'none' : 'translateY(8px)'; });

        // one light band for every plate, all in step; its phase stops at the last landing (render stays a function of t alone)
        const ss = Math.min(s, LAND[9]);
        const ph0 = ((ss / SWEEP) % 1 + 1) % 1;
        const tx = -100 + ph0 * 245;
        cells.forEach((c, i) => {
          const landed = s >= LAND[i];
          put(`l${i}`, landed, (v) => {
            c.im.style.visibility = v ? '' : 'hidden';
            c.pl.style.display = v ? 'none' : '';
            c.n.classList.toggle(`${P}-on`, v);
          });
          if (!landed) put(`s${i}`, tx.toFixed(2), () => { c.sh.style.transform = `translateX(${tx.toFixed(2)}%) skewX(-20deg)`; });
        });
      },
    };
  },
};
