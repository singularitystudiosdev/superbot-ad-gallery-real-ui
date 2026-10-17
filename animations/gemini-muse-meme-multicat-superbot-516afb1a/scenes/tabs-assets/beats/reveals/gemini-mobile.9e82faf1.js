// The Gemini app on an iPhone (YouTube Bc8K8F4_4ko, 2026-10-02, a top-down handheld of the phone, t=68.5-76.0 s; spec
// .tmp/clone-9e82faf1/reveal-refs/gemini-mobile/spec.json, confidence 0.8; frames q_bc8_t73.png, q_bc8_pend_strip.jpg). A single-column
// phone transcript on light lavender (#E9DCF0): the header (a menu mark, the 'Gemini Flash' model chip, a pen and an overflow mark),
// the user's prompt as a soft grey-lavender bubble, then the assistant turn, which opens with the status line 'Creating your image'
// with a three-dot loader to its LEFT (the dots fill in turn, one, two, three) over one large rounded, flat, translucent-lavender
// placeholder card, fully empty for the whole wait (no spinner, sheen, bar or percentage). The card then hard-swaps to the finished
// picture and the status line goes. The composer is an 'Ask Gemini' pill with a plus at its left.
// Adapted to ten images: the assistant turn holds ten placeholder cards in a 5 x 2 grid, each a flat lavender card, swapping to its
// picture in strict reading order. Distinct from the desktop 'Gemini' (gemini-app) module: lavender not white, separate flat cards
// not one card with a drifting sheen, three dots not a turning sparkle, a phone status bar and header, an 'Ask Gemini' composer.
// Omitted: the four-point Gemini sparkle and any logo (the dots are plain circles), the iOS keyboard and the notch. The footage's
// picture is never reproduced: every tile is our own meme; the face is the system UI stack.
import { seg } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-gmo';
const ROOT_H = 488;
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 26px; background: #e9dcf0; color: #3c3744; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #d8c8e0; }
.${P}-sb { flex: none; display: flex; align-items: center; justify-content: space-between; height: 26px; padding: 4px 26px 0; font-size: 12px; font-weight: 600; color: #2b2733; }
.${P}-bat { display: block; width: 20px; height: 9px; border-radius: 3px; box-shadow: inset 0 0 0 1.2px #2b2733; background: linear-gradient(90deg, #2b2733 0 72%, transparent 72%); background-clip: content-box; padding: 1.8px; box-sizing: border-box; }
.${P}-hd { flex: none; display: flex; align-items: center; justify-content: space-between; height: 40px; padding: 0 16px; }
.${P}-hd svg { display: block; width: 18px; height: 18px; fill: none; stroke: #3c3744; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
.${P}-md { display: flex; align-items: center; gap: 5px; font-size: 14px; color: #3c3744; white-space: nowrap; }
.${P}-md b { font-weight: 400; }
.${P}-md span { color: #8b8296; }
.${P}-md svg { width: 10px; height: 10px; stroke: #5d5568; }
.${P}-ri { display: flex; align-items: center; gap: 14px; }
.${P}-tr { flex: none; box-sizing: border-box; padding: 8px 16px 0; }
.${P}-me { display: flex; justify-content: flex-end; }
.${P}-me span { display: block; max-width: 330px; padding: 9px 16px; border-radius: 20px; background: rgba(168, 148, 180, .3); font-size: 13.5px; line-height: 19px; color: #2f2a37; }
.${P}-st { display: flex; align-items: center; gap: 9px; height: 20px; margin: 16px 0 10px 4px; font-size: 13px; line-height: 18px; color: rgba(60, 55, 68, var(--c, 1)); white-space: nowrap; }
.${P}-dots { flex: none; display: flex; align-items: center; gap: 3.5px; }
.${P}-dots i { display: block; width: 4.5px; height: 4.5px; border-radius: 50%; background: #3c3744; }
.${P}-g { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 8px; }
.${P}-t { position: relative; aspect-ratio: 870 / 1024; border-radius: 16px; overflow: hidden; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-c { position: absolute; inset: 0; background: rgba(190, 168, 200, .82); }
.${P}-cp { flex: none; display: flex; align-items: center; gap: 12px; box-sizing: border-box; height: 46px; margin: auto 14px 16px; padding: 0 8px 0 14px; border-radius: 23px; background: rgba(255, 255, 255, .55); box-shadow: 0 0 0 1px rgba(160, 140, 175, .22); font-size: 14px; color: #5d5568; }
.${P}-cp svg { flex: none; display: block; width: 17px; height: 17px; fill: none; stroke: #3c3744; stroke-width: 1.5; stroke-linecap: round; }
.${P}-cp b { flex: 1; font-weight: 400; }
.${P}-sq { flex: none; display: grid; place-items: center; width: 32px; height: 32px; }
.${P}-sq i { display: block; width: 11px; height: 11px; border-radius: 2.5px; box-shadow: inset 0 0 0 1.5px #3c3744; }
`;

const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const END = 1.68;                                 // the last card has landed
const LAND = Array.from({ length: 10 }, (_, i) => 0.4 + i * 0.1425);   // card i swaps to its picture (reading order), the last at END
const FADE = 0.04;                                // a card's flat cover thins away over this long before the picture lands
const BURST = 1.5;                                // dot-pulse cycles per layout second
const PEN = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l1-4.5L16.5 4a2 2 0 0 1 3 3L8 18.5 4 20z"/></svg>';
const MORE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h.01M12 12h.01M19 12h.01" stroke-width="2.6"/></svg>';
const MENU = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h16M4 15h16"/></svg>';
const CHEV = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 4.5l3 3 3-3"/></svg>';
const PLUS = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v16M4 12h16"/></svg>';

export default {
  id: 'gemini-mobile',
  label: 'Gemini (iPhone app)',
  source: {
    platform: 'Gemini app for iOS (iPhone, light lavender theme; a handheld tutorial recording on YouTube, 2026-10-02)',
    feature: "single-column phone transcript on #E9DCF0: the user's prompt bubble, then the assistant turn opening with 'Creating your image' and a three-dot loader to its left over a large flat translucent-lavender placeholder card, empty for the whole wait, then a hard swap to the picture; an 'Ask Gemini' composer and a 'Gemini Flash' chip in the header (adapted to 10: ten flat placeholder cards in a 5 x 2 grid swapping in strict reading order; the Gemini sparkle and the keyboard are omitted)",
    refs: [{ url: 'https://www.youtube.com/watch?v=Bc8K8F4_4ko', retrieved: '2026-10-14' }],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'gemini-mobile');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-c"></div></div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-sb"><span>12:45</span><i class="${P}-bat"></i></div><div class="${P}-hd">${MENU}<div class="${P}-md"><b>Gemini <span>Flash</span></b>${CHEV}</div><div class="${P}-ri">${PEN}${MORE}</div></div><div class="${P}-tr"><div class="${P}-me"><span>Generate ten Muse memes of a muse holding a handwritten note in a lecture hall</span></div><div class="${P}-st"><span class="${P}-dots"><i></i><i></i><i></i></span><span>Creating your image</span></div><div class="${P}-g">${tiles.map(cell).join('')}</div></div><div class="${P}-cp">${PLUS}<b>Ask Gemini</b><span class="${P}-sq"><i></i></span></div></div>`);
    const st = root.querySelector(`.${P}-st`), dots = [...root.querySelectorAll(`.${P}-dots i`)];
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), cv: n.querySelector(`.${P}-c`), g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // the three dots fill in turn (one, two, three, back): each dot's alpha is a function of t alone
        dots.forEach((d, j) => {
          const ph = (((s * BURST - j / 3) % 1) + 1) % 1;
          const a = (0.22 + 0.78 * Math.max(0, Math.sin(Math.PI * Math.min(1, ph * 1.6)))).toFixed(2);
          put(`d${j}`, a, (v) => { d.style.background = `rgba(60, 55, 68, ${v})`; });
        });

        // the status goes once the last card has landed (as colour alpha, never `opacity`, so no picture rasterises differently)
        const c = (1 - seg(s, END, END + 0.12)).toFixed(3);
        put('c', c, (v) => { st.style.setProperty('--c', v); st.style.visibility = v === '0.000' ? 'hidden' : ''; });

        cells.forEach((cell, i) => {
          const a = LAND[i];
          const f = seg(s, a - FADE, a);
          put(`i${i}`, s >= a - FADE, (v) => { cell.im.style.visibility = v ? '' : 'hidden'; });
          cell.im.style.filter = restFilter(cell.g);
          cell.im.style.transform = restTransform(cell.g);
          put(`c${i}`, f.toFixed(3), () => {
            if (f >= 1) { cell.cv.style.display = 'none'; cell.cv.style.opacity = ''; } else { cell.cv.style.display = ''; cell.cv.style.opacity = f > 0 ? (1 - f).toFixed(3) : ''; }
          });
        });
      },
    };
  },
};
