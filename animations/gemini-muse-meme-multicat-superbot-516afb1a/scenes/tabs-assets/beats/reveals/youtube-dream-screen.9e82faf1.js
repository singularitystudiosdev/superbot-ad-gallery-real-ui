// YouTube Shorts 'Dream Screen' (2024-25), the phone app's text-to-image background maker (Android screen recordings on YouTube:
// oejua-INSzo 2024-05-28 for the generate wait, VC0HqpCO6YA 2025-01-20 for the current 'Create background' screen, v5PqrDh6Pqw
// 2026-01-12 for the landing grid; spec .tmp/clone-9e82faf1/reveal-refs/youtube-dream-screen/spec.json, confidence 0.72; frames
// aj_VC0_create_background_t46.png, aj_oejua_spinner_strip.png, aj_oejua_result_empty_then_fill.png, aj_oejua_result_grid_t60.png,
// aj_oejua_style_chips.png). A flat-black screen: a back arrow, the bold title 'Create background' over a small 'Experiment' label,
// the prompt text, 'Choose style' above a row of style chips (None / Vintage / Clay / Anime / Watercolor / Digital) and a wide
// purple->pink 'Create' pill. Tapping Create keeps the screen and shows ONE centred, thin, white circular spinner (no text, no
// percentage, no bar) turning in a small dark rounded square; then the app cuts to the 'Choose your image' result screen, whose
// grid is flat black and sits empty for a moment before the pictures swap in one at a time, top-left first, each already sharp.
// Adapted to ten images: the result grid has ten portrait cells in a 5 x 2 block (the footage has four in a mosaic), filled in
// reading order. The spinner stays up until the cut. Omitted: the 'Something went wrong' toasts, the status bar, the on-screen
// keyboard, the three-dot menu and the YouTube logo; the style chips are flat tints (the app shows sample cat pictures).
import { press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-yds';
const ROOT_H = 440, COLS = 5, GAP = 6;
const CSS = `
.${P} { position: relative; box-sizing: border-box; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 12px; background: #000; color: #fff; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #1f1f22; }
.${P}-scr { position: absolute; inset: 0; box-sizing: border-box; padding: 0 18px; }
.${P}-hd { display: flex; align-items: center; gap: 18px; height: 64px; padding-top: 6px; box-sizing: border-box; }
.${P}-hd svg { flex: none; width: 20px; height: 20px; fill: none; stroke: #fff; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
.${P}-hd b { display: block; font-size: 16px; line-height: 19px; font-weight: 700; }
.${P}-hd span { display: block; margin-top: 1px; font-size: 9px; line-height: 11px; color: #b4b4ba; }
.${P}-pr { height: 106px; margin: 6px 0 0; font-size: 14px; line-height: 20px; color: #f6f6f8; }
.${P}-sl { margin-top: 4px; font-size: 12px; line-height: 16px; color: #8e8e93; }
.${P}-chips { display: flex; gap: 10px; margin-top: 10px; }
.${P}-chip { flex: none; width: 70px; text-align: center; font-size: 10px; line-height: 14px; font-weight: 700; color: #f2f2f5; }
.${P}-chip i { display: block; box-sizing: border-box; width: 70px; height: 70px; margin-bottom: 6px; border-radius: 9px; }
.${P}-chip.${P}-on i { box-shadow: 0 0 0 2px #000, 0 0 0 3.5px #f2f2f5; }
.${P}-chip svg { display: block; margin: 23px auto 0; width: 24px; height: 24px; fill: none; stroke: #f2f2f5; stroke-width: 1.5; stroke-linecap: round; }
.${P}-go { position: absolute; left: 18px; right: 18px; bottom: 22px; height: 40px; border-radius: 20px; background: linear-gradient(90deg, #8a0098, #c20aa8 45%, #ff4a55); font-size: 13px; line-height: 40px; font-weight: 700; text-align: center; }
.${P}-box { position: absolute; left: 50%; top: 50%; width: 62px; height: 62px; margin: -31px 0 0 -31px; border-radius: 14px; background: rgba(14, 14, 16, .94); }
.${P}-arc { position: absolute; left: 17px; top: 17px; width: 28px; height: 28px; border-radius: 50%; -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 2.6px), #000 calc(100% - 2.1px)); mask: radial-gradient(farthest-side, transparent calc(100% - 2.6px), #000 calc(100% - 2.1px)); }
.${P}-g { display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; margin-top: 12px; }
.${P}-t { position: relative; aspect-ratio: 2 / 3; border-radius: 6px; overflow: hidden; background: #000; }
.${P}-t img { position: absolute; inset: 0; z-index: 1; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; background: #000; }
.${P}-done { position: absolute; left: 0; right: 0; bottom: 20px; text-align: center; font-size: 12px; line-height: 16px; font-weight: 600; color: #6f6f76; }
`;

const PROMPT = 'A muse in a lecture hall holding up a handwritten note, meme style, bright colours';
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const TAP_AT = 0.08;                              // the finger taps 'Create'
const SPIN = 0.16;                                // the spinner appears over the create screen
const CUT = 0.56;                                 // the app cuts to the 'Choose your image' screen, whose grid is empty
const LAND = Array.from({ length: 10 }, (_, i) => 0.78 + i * 0.1);   // cell i swaps to its picture (reading order), the last at 1.68
const CHIPS = [
  ['None', ''], ['Vintage', 'linear-gradient(150deg, #6b5a44, #2e2a24)'], ['Clay', 'linear-gradient(150deg, #e0703a, #3c5a86)'],
  ['Anime', 'linear-gradient(150deg, #5fb3a8, #cfd8dc)'], ['Watercolor', 'linear-gradient(150deg, #d9a55b, #7fa38a)'], ['Digital', 'linear-gradient(150deg, #1f8f9a, #d98a49)'],
];

export default {
  id: 'youtube-dream-screen',
  label: 'YouTube Shorts Dream Screen (2024)',
  source: {
    platform: "YouTube Shorts phone app (Android), the 'Dream Screen' text-to-image background maker (third-party screen recordings on YouTube, 2024-05-28, 2025-01-20 and 2026-01-12)",
    feature: "flat-black 'Create background' screen (prompt, style chips None / Vintage / Clay / Anime..., purple->pink 'Create' pill) that keeps its layout while ONE centred thin white circular spinner turns in a small dark rounded square (no text, percentage or bar); then a cut to the 'Choose your image' result screen whose flat-black grid sits empty a moment and fills one image at a time, top-left first, each already sharp (adapted to 10: a 5 x 2 block of ten portrait cells; the error toasts, status bar, keyboard and YouTube logo are omitted)",
    refs: [
      { url: 'https://www.youtube.com/watch?v=oejua-INSzo', published: '2024-05-28', retrieved: '2026-10-14' },
      { url: 'https://www.youtube.com/watch?v=VC0HqpCO6YA', published: '2025-01-20', retrieved: '2026-10-14' },
      { url: 'https://www.youtube.com/watch?v=v5PqrDh6Pqw', published: '2026-01-12', retrieved: '2026-10-14' },
      { url: 'https://support.google.com/youtube/answer/15260303?hl=en', published: 'live 2026-10-14', retrieved: '2026-10-14' },
    ],
    extrapolated: [
      'ten cells: the source grid has four (a mosaic of two columns), so the result screen carries ten portrait cells in a 5 x 2 block, filling one at a time in reading order',
      "the spinner on the 'Create background' screen is from the 2024 'Create an image' build (oejua-INSzo); the current build's wait is inferred to be the same (the 2025 clip only shows the Create button dimming)",
      "the footage is time-compressed (the status clock is frozen), so the ~7 s spinner and ~2 s empty grid are scaled to the beat: spinner ~0.4 s, empty grid ~0.2 s, then ten images 0.1 s apart",
      "the 'Create background' wording and 'Experiment' label are the 2025 build; the 'Choose your image' result header and 'Done' label are the 2024 build",
      "the style chips are flat tints (the app shows cat photographs); the status bar, keyboard and three-dot menu are left out",
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'youtube-dream-screen');
    const back = '<svg viewBox="0 0 20 20"><path d="M16 10H4M9 4.5L3.5 10 9 15.5"/></svg>';
    const chip = ([n, bg], i) => `<div class="${P}-chip${i === 0 ? ` ${P}-on` : ''}"><i style="background: ${bg || '#3a3a3d'}">${i === 0 ? '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M6.4 6.4l11.2 11.2"/></svg>' : ''}</i>${n}</div>`;
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; filter: ${restFilter(g)}; transform: ${restTransform(g)}; transform-origin: ${g.origin}"/><div class="${P}-pend"></div></div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-scr ${P}-s1"><div class="${P}-hd">${back}<div><b>Create background</b><span>Experiment</span></div></div><div class="${P}-pr">${x.esc(PROMPT)}</div><div class="${P}-sl">Choose style</div><div class="${P}-chips">${CHIPS.map(chip).join('')}</div><div class="${P}-go">Create</div><div class="${P}-box" style="visibility: hidden"><i class="${P}-arc"></i></div></div><div class="${P}-scr ${P}-s2" style="visibility: hidden"><div class="${P}-hd">${back}<div><b>Choose your image</b><span>Experiment</span></div></div><div class="${P}-g">${tiles.map(cell).join('')}</div><div class="${P}-done">Done</div></div></div>`);
    const q = (s) => root.querySelector(`.${P}-${s}`);
    const s1 = q('s1'), s2 = q('s2'), go = q('go'), box = q('box'), arc = q('arc');
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n) => ({ im: n.querySelector('img'), pend: n.querySelector(`.${P}-pend`) }));
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // the create screen stays through the wait; the cut to the result screen is a single hard swap
        const cut = s >= CUT;
        put('cut', cut, (v) => { s1.style.visibility = v ? 'hidden' : ''; s2.style.visibility = v ? '' : 'hidden'; });
        const gp = press(s, TAP_AT, 0.05, 0.04, 0.06);
        put('press', gp.toFixed(3), () => { go.style.transform = gp > 0 ? `scale(${(1 - 0.04 * gp).toFixed(4)})` : 'none'; go.style.opacity = gp > 0 || s >= SPIN ? '0.62' : ''; });
        put('spin', s >= SPIN && !cut, (v) => { box.style.visibility = v ? '' : 'hidden'; });
        // one thin indeterminate arc: it turns with t and its sweep breathes with t (a function of t alone, shown or not)
        const turn = Math.round(((t * 420) % 360 + 360) % 360);
        const sweep = 80 + 10 * Math.round(10 * (0.5 + 0.5 * Math.sin(t * 4.6)));
        put('arc', `${turn}/${sweep}`, () => { arc.style.background = `conic-gradient(from 0deg, rgba(255, 255, 255, 0) 0deg, #fff ${sweep}deg, rgba(255, 255, 255, 0) ${sweep}deg)`; arc.style.transform = `rotate(${turn}deg)`; });

        // the grid is flat black and empty first; each picture then swaps into its cell in reading order, already sharp
        cells.forEach((c, i) => put(`i${i}`, s >= LAND[i], (v) => { c.im.style.visibility = v ? '' : 'hidden'; c.pend.style.display = v ? 'none' : ''; }));
      },
    };
  },
};
