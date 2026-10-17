// Adobe Firefly's phone app (iOS), the dark 'generate' screen (YouTube UYNWP-DFgoQ, 2025-09-12, pending t~228.3-232.4 s of the
// clip; spec .tmp/clone-9e82faf1/reveal-refs/firefly-mobile/spec.json, confidence 0.60; frames ac2_ffm_*, ac_ffmobile_*). A page of
// #2D2A2E, a result area above a rounded near-black prompt card (a 'View all' row with a four-slot thumbnail strip, then the
// 'Prompt' label, the prompt and a circular submit button) and a row of four tabs (General, Content type, Visual intensity, a
// clipped fifth). Pressing the button swaps the empty state ('Start generating images') for large flat dark-grey portrait
// placeholders (#4A484B) that never animate, and the strip's four slots go grey. The wait carries no copy at all: the only moving
// thing is the submit button, which goes from solid blue (#0359E2) to a flat dark disc and then shows an indeterminate white ring
// spinner in place of its glyph; when the pictures arrive (all at once in the footage) the button returns to blue and the strip
// fills with their thumbnails.
// Adapted to ten images: the footage shows two portrait tiles side by side in a horizontally scrolling row, so ten tiles are laid out
// as a 5 x 2 block of the same portrait placeholders, landing one at a time in reading order; the four strip slots take the first
// four pictures as they land. The button spins until the last one has landed. Omitted: the app icon on the empty state, the
// colour-swatch icon beside the button is reduced to a plain glyph, and the presenter's red arrow annotations.
import { press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-ffm';
const ROOT_H = 480;
const CSS = `
.${P} { position: relative; box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; padding: 12px 12px 6px; border-radius: 12px; background: #2d2a2e; color: #f1eff2; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #3a373b; }
.${P}-res { position: relative; flex: 1; min-height: 0; }
.${P}-es { position: absolute; left: 0; right: 0; top: 50%; display: flex; flex-direction: column; align-items: center; gap: 6px; transform: translateY(-55%); text-align: center; }
.${P}-es i { display: block; width: 34px; height: 28px; margin-bottom: 4px; border-radius: 6px; background: #4a484b; box-shadow: inset 0 0 0 1px #5a575b; }
.${P}-es b { font-size: 13px; font-weight: 700; color: #f6f4f7; }
.${P}-es span { max-width: 300px; font-size: 9.5px; line-height: 13px; color: #c9c6cb; }
.${P}-g { position: absolute; left: 0; right: 0; top: 0; display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 8px; }
.${P}-t { position: relative; aspect-ratio: 3 / 4; border-radius: 8px; overflow: hidden; background: #4a484b; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; background: #4a484b; }
.${P}-card { flex: none; margin-top: 10px; border-radius: 14px; background: #1b191c; box-shadow: 0 0 0 1px #262327; }
.${P}-va { display: flex; align-items: center; gap: 14px; height: 52px; padding: 0 14px; }
.${P}-va b { font-size: 10px; font-weight: 500; color: #ebe8ed; }
.${P}-strip { display: flex; align-items: center; gap: 6px; box-sizing: border-box; height: 38px; padding: 0 6px 0 6px; border-radius: 8px; box-shadow: inset 0 0 0 1.5px #e7e4e9; }
.${P}-strip svg { flex: none; width: 13px; height: 13px; fill: none; stroke: #d8d5da; stroke-width: 1.4; stroke-linecap: round; stroke-linejoin: round; }
.${P}-sl { position: relative; flex: none; width: 26px; height: 30px; border-radius: 3px; overflow: hidden; background: #454246; }
.${P}-sl img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-div { height: 1px; margin: 0 14px; background: #2c292d; }
.${P}-pr { position: relative; height: 70px; padding: 9px 14px 0; }
.${P}-pr small { display: block; font-size: 8.5px; line-height: 11px; color: #a8a5ab; }
.${P}-pr p { margin: 3px 0 0; max-width: 410px; font-size: 11px; line-height: 15px; color: #f4f2f5; }
.${P}-aux { position: absolute; right: 60px; bottom: 15px; width: 15px; height: 12px; border-radius: 3px; box-shadow: inset 0 0 0 1.3px #8f8c92; }
.${P}-go { position: absolute; right: 14px; bottom: 9px; width: 32px; height: 32px; border-radius: 50%; background: #0359e2; }
.${P}-go svg { position: absolute; left: 8px; top: 8px; width: 16px; height: 16px; fill: none; stroke: #f4f7ff; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
.${P}-trk { position: absolute; left: 6px; top: 6px; width: 20px; height: 20px; box-sizing: border-box; border-radius: 50%; border: 2.5px solid rgba(255, 255, 255, .24); }
.${P}-arc { position: absolute; left: 6px; top: 6px; width: 20px; height: 20px; border-radius: 50%; -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2.5px)); mask: radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2.5px)); }
.${P}-tabs { flex: none; display: flex; height: 46px; margin-top: 8px; overflow: hidden; }
.${P}-tab { flex: none; width: 25%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; font-size: 9px; color: #e6e3e8; white-space: nowrap; }
.${P}-tab svg { width: 14px; height: 14px; fill: none; stroke: #e6e3e8; stroke-width: 1.3; stroke-linecap: round; stroke-linejoin: round; }
`;

const PROMPT = 'A muse in a lecture hall holding up a handwritten note, meme style, bright colours';
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const GO_AT = 0.10;                               // the submit button is tapped
const ISSUE = 0.16;                               // the empty state gives way to the ten placeholders; the button turns into a dark disc
const SPIN = 0.26;                                // the glyph is replaced by the ring spinner
const LAND = Array.from({ length: 10 }, (_, i) => 0.4 + i * 0.1425);   // tile i swaps to its picture (reading order), the last at 1.68
const GLYPH = '<svg viewBox="0 0 16 16"><rect x="2" y="3.5" width="9" height="9" rx="2"/><circle cx="6.5" cy="8" r=".7"/><path d="M12.6 1.8v3.4M10.9 3.5h3.4"/></svg>';
const TABS = [
  ['General', '<svg viewBox="0 0 16 16"><path d="M2 4.5h12M2 11.5h12"/><circle cx="6" cy="4.5" r="1.6"/><circle cx="10.5" cy="11.5" r="1.6"/></svg>'],
  ['Content type', '<svg viewBox="0 0 16 16"><rect x="2.5" y="2.5" width="8" height="8" rx="2"/><path d="M6 13.5h6a1.5 1.5 0 0 0 1.5-1.5V6"/></svg>'],
  ['Visual intensity', '<svg viewBox="0 0 16 16"><path d="M2.5 11.5a5.5 5.5 0 0 1 11 0z"/><path d="M8 6.2V3"/></svg>'],
  ['Composition', '<svg viewBox="0 0 16 16"><circle cx="8" cy="5.2" r="2.4"/><path d="M3 13.5c.6-3 2.6-4.5 5-4.5s4.4 1.5 5 4.5z"/></svg>'],
];

export default {
  id: 'firefly-mobile',
  label: 'Adobe Firefly mobile (2025)',
  source: {
    platform: "Adobe Firefly phone app (iOS), dark theme 'generate' screen (a phone screen recording on YouTube, 2025-09-12)",
    feature: "dark app page: large flat dark-grey portrait placeholders that never animate plus a grey 'View all' thumbnail strip, no copy during the wait, and the prompt bar's circular submit button going blue -> flat dark disc -> an indeterminate white ring spinner, back to blue after the last picture lands (adapted to 10: the footage's two-up scrolling row becomes a 5 x 2 block of the same portrait tiles landing one at a time in reading order, the strip taking the first four pictures; the app icon on the empty state and the presenter's arrows are omitted)",
    refs: [{ url: 'https://www.youtube.com/watch?v=UYNWP-DFgoQ', retrieved: '2026-10-14' }],
    extrapolated: [
      'ten tiles: the footage shows two portrait tiles in a horizontally scrolling row (and all of them swapping at once), so the ten tiles sit in a 5 x 2 grid and swap one at a time in reading order',
      "the strip's four slots take the first four pictures as they land (the footage fills all four at the swap)",
      'the spinner stays until the tenth picture has landed (the footage shows it for ~2.8 s of a ~4.1 s wait)',
      'the 560 px card is wider than a phone: the prompt card and tab row are stretched to it, the fifth tab is shown whole rather than cut off',
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'firefly-mobile');
    const tsrc = ownSrc(ctx.src, 'firefly-mobile-strip');   // the strip's thumbnails are a smaller raster of the same pictures: a URL of their own keeps their decode apart
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-pend"></div></div>`;
    const slot = (g, i) => `<div class="${P}-sl"><img src="${tsrc}" width="870" height="1024" decoding="sync" alt="Firefly thumbnail ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/></div>`;
    const tabs = TABS.map(([n, svg]) => `<div class="${P}-tab">${svg}${n}</div>`).join('');
    const root = x.el(`<div class="${P}"><div class="${P}-res"><div class="${P}-es"><i></i><b>Start generating images</b><span>Describe the image you want to generate in the prompt field. For inspiration, go to Gallery or learn more about prompting.</span></div><div class="${P}-g" style="visibility: hidden">${tiles.map(cell).join('')}</div></div><div class="${P}-card"><div class="${P}-va" style="visibility: hidden"><b>View all</b><div class="${P}-strip"><svg viewBox="0 0 16 16"><rect x="2.5" y="4" width="9" height="9" rx="2"/><path d="M12.6 1.8v3.4M10.9 3.5h3.4"/></svg>${tiles.slice(0, 4).map(slot).join('')}</div></div><div class="${P}-div" style="visibility: hidden"></div><div class="${P}-pr"><small>Prompt</small><p>${x.esc(PROMPT)}</p><i class="${P}-aux"></i><div class="${P}-go">${GLYPH}<i class="${P}-trk" style="display: none"></i><i class="${P}-arc" style="display: none"></i></div></div></div><div class="${P}-tabs">${tabs}</div></div>`);
    const q = (s) => root.querySelector(`.${P}-${s}`);
    const es = q('es'), grid = q('g'), va = q('va'), div = q('div'), go = q('go'), glyph = go.querySelector('svg'), trk = q('trk'), arc = q('arc');
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), pend: n.querySelector(`.${P}-pend`), g: tiles[i] }));
    const thumbs = [...root.querySelectorAll(`.${P}-sl img`)].map((im, i) => ({ im, g: tiles[i] }));
    ctx.gate([...cells.map((c) => c.im), ...thumbs.map((c) => c.im)]);

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // the empty state gives way to the placeholders and the 'View all' row appears
        const on = s >= ISSUE;
        put('iss', on, (v) => { es.style.display = v ? 'none' : ''; grid.style.visibility = v ? '' : 'hidden'; va.style.visibility = v ? '' : 'hidden'; div.style.visibility = v ? '' : 'hidden'; });

        // the submit button: blue -> flat dark disc -> ring spinner -> blue once the last picture has landed
        const done = s >= LAND[9];
        const mode = !on || done ? 0 : s < SPIN ? 1 : 2;
        const gp = press(s, GO_AT, 0.06, 0.06, 0.14);
        put('mode', mode, (m) => {
          go.style.background = m === 0 ? '#0359e2' : '#3b383c';
          glyph.style.display = m === 2 ? 'none' : '';
          glyph.style.opacity = m === 1 ? '0.55' : '';
          trk.style.display = m === 2 ? '' : 'none';
          arc.style.display = m === 2 ? '' : 'none';
        });
        put('gp', gp.toFixed(3), () => { go.style.transform = gp > 0 ? `scale(${(1 - 0.08 * gp).toFixed(4)})` : 'none'; });
        // an indeterminate ring: the arc turns with t and its sweep breathes with t (a function of t alone, shown or not)
        const turn = Math.round(((t * 480) % 360 + 360) % 360);
        const sweep = 70 + 5 * Math.round(10 * (0.5 + 0.5 * Math.sin(t * 5.2)));
        put('arc', `${turn}/${sweep}`, () => { arc.style.background = `conic-gradient(from 0deg, #fff 0deg, #fff ${sweep}deg, rgba(255, 255, 255, 0) ${sweep}deg)`; arc.style.transform = `rotate(${turn}deg)`; });

        cells.forEach((c, i) => {
          const v = s >= LAND[i];
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
          put(`i${i}`, v, (on1) => { c.im.style.visibility = on1 ? '' : 'hidden'; c.pend.style.display = on1 ? 'none' : ''; });
        });
        thumbs.forEach((c, i) => {
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
          put(`h${i}`, s >= LAND[i], (v) => { c.im.style.visibility = v ? '' : 'hidden'; });
        });
      },
    };
  },
};
